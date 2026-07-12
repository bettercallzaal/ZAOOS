/**
 * orchestrator-tick.ts - VPS cron tick for the durable orchestrator.
 *
 * Stage 1 (shipped): detects Zaal's tapped answers + posts next questions.
 * Stage 2 (this file): ACTS on answers - enqueues research, marks tasks done, or asks next question.
 *
 * When ZOE_ORCHESTRATOR_ENABLED === 'true', this runs every 5 min via cron
 * to drive a one-question-at-a-time loop autonomously. Zaal taps answers to
 * button questions in ZAAL BOTZ Claude Code topic; the tick detects those
 * answers and classifies them into ACTIONS (research, board_done, ask_next).
 *
 * Design:
 *  - Read recent/<group_id>.json for Zaal's tapped answers ([answer:qid] format)
 *  - Detect NEW answers since the last stored pointer (lastSeenTs)
 *  - Classify each answer via classifyAnswer() -> AnswerAction
 *  - Execute the action:
 *    * research: call enqueueWork(topic) to queue research for the work loop
 *    * board_done: PATCH the team tracker task to status 'done'
 *    * ask_next: post the next question with buttons (Stage 1 behavior)
 *  - Update state pointer
 *
 * Safe by design:
 *  - DISABLED by default (ZOE_ORCHESTRATOR_ENABLED env flag)
 *  - Zaal-only (silently skips non-Zaal answers)
 *  - Empty queue = no messages
 *  - File-locked (one-instance only, mirrors work-loop.ts pattern)
 *  - Daily cap (ZOE_ORCHESTRATOR_DAILY, default 20)
 *  - Best-effort: one action failure doesn't kill the tick
 *  - Never: LLM calls, posts to Farcaster/X, DMs outside General, casts, spends, on-chain, merges PRs, builds/writes code
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parseQuestionCallback, questionKeyboard, encodeQuestion, type ParsedQuestion } from './questions';
import { pushRecent, ZOE_PATHS } from './memory';
import { enqueueWork } from './work-loop';

const ORCHESTRATOR_STATE_PATH = (): string =>
  join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'orchestrator-state.json');
const ORCHESTRATOR_LOCK = (): string =>
  join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'orchestrator.lock');
const ORCHESTRATOR_COUNTER = (): string =>
  join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'orchestrator-count.json');

const LOCK_STALE_MS = 30 * 60 * 1000; // 30 min staleness threshold
const DAILY_CAP = Math.max(1, Number(process.env.ZOE_ORCHESTRATOR_DAILY ?? 20));

/**
 * Question-answer rule table (v1). Maps (qid, tappedValue) -> next qid.
 * If no rule matches, decideNextQuestion returns null (silent, no next question).
 *
 * Example flow:
 *  - q1: "What are you shipping?" -> user taps "Music feature"
 *  - Rule matches (q1, "Music feature") -> next is q2
 *  - q2: "When?" -> user taps "This week"
 *  - Rule matches (q2, "This week") -> next is q3 (or null = done)
 *
 * SIMPLE rules only. v1 does NOT call an LLM for follow-ups.
 */
const DECISION_TABLE: Array<{
  fromQid: string;
  onValue: string;
  toQid: string;
  options: string[];
}> = [
  // Starter question: "What's the priority for next?"
  {
    fromQid: 'q-priority-what',
    onValue: 'Research',
    toQid: 'q-priority-research-depth',
    options: ['Quick overview', 'Deep dive', 'Full audit'],
  },
  {
    fromQid: 'q-priority-what',
    onValue: 'Code',
    toQid: 'q-priority-code-type',
    options: ['Bug fix', 'Feature', 'Refactor'],
  },
  {
    fromQid: 'q-priority-what',
    onValue: 'Meetings',
    toQid: 'q-priority-meetings-focus',
    options: ['Partnerships', 'Team', 'Investors'],
  },

  // Research depth follow-ups
  {
    fromQid: 'q-priority-research-depth',
    onValue: 'Quick overview',
    toQid: 'q-research-scope',
    options: ['Market', 'Technical', 'Competitive'],
  },
  {
    fromQid: 'q-priority-research-depth',
    onValue: 'Deep dive',
    toQid: 'q-research-scope',
    options: ['Market', 'Technical', 'Competitive'],
  },
  {
    fromQid: 'q-priority-research-depth',
    onValue: 'Full audit',
    toQid: 'q-research-scope',
    options: ['Market', 'Technical', 'Competitive'],
  },

  // Code type follow-ups
  {
    fromQid: 'q-priority-code-type',
    onValue: 'Bug fix',
    toQid: 'q-code-urgency',
    options: ['Critical', 'High', 'Normal'],
  },
  {
    fromQid: 'q-priority-code-type',
    onValue: 'Feature',
    toQid: 'q-code-urgency',
    options: ['Critical', 'High', 'Normal'],
  },
  {
    fromQid: 'q-priority-code-type',
    onValue: 'Refactor',
    toQid: 'q-code-urgency',
    options: ['Critical', 'High', 'Normal'],
  },

  // Meeting focus follow-ups
  {
    fromQid: 'q-priority-meetings-focus',
    onValue: 'Partnerships',
    toQid: 'q-meeting-depth',
    options: ['Intro call', 'Deep discussion', 'Deal stage'],
  },
  {
    fromQid: 'q-priority-meetings-focus',
    onValue: 'Team',
    toQid: 'q-meeting-depth',
    options: ['Intro call', 'Deep discussion', 'Deal stage'],
  },
  {
    fromQid: 'q-priority-meetings-focus',
    onValue: 'Investors',
    toQid: 'q-meeting-depth',
    options: ['Intro call', 'Deep discussion', 'Deal stage'],
  },
];

/**
 * Stage 2: ACTION classification. Maps (qid, value) -> action (research, board_done, ask_next, skip).
 * Each action carries what's needed to execute it.
 */
export interface AnswerAction {
  kind: 'research' | 'board_done' | 'ask_next' | 'skip';
  topic?: string; // for research: the topic to enqueue
  taskId?: string; // for board_done: the task uuid
  nextQuestion?: { qid: string; options: string[] }; // for ask_next
}

/**
 * Check if a string looks like a valid UUID (8-4-4-4-12 hex).
 */
function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Parse a qid that encodes a task id (format: 'task-<uuid>').
 * Returns the uuid or null if not a task qid.
 */
function parseTaskQid(qid: string): string | null {
  if (!qid.startsWith('task-')) return null;
  const uuid = qid.slice(5);
  return isValidUuid(uuid) ? uuid : null;
}

/**
 * Classify an answer into an ACTION: research, board_done, ask_next, or skip.
 * Pure function (no I/O), unit-testable.
 *
 * Rules:
 *  - If qid = 'task-<uuid>' and value in {done, complete, ship}, return board_done
 *  - If qid starts with 'research-' or value looks like a research topic, return research
 *  - Else if decideNextQuestion returns a match, return ask_next
 *  - Else return skip
 */
export function classifyAnswer(qid: string, value: string): AnswerAction {
  // Check for board_done first: task-<uuid> with disposition value
  const taskId = parseTaskQid(qid);
  if (taskId) {
    const disposition = value.toLowerCase().trim();
    if (['done', 'complete', 'ship'].includes(disposition)) {
      return { kind: 'board_done', taskId };
    }
  }

  // Check for research: qid starts with 'research-' or value is non-empty
  if (qid.startsWith('research-')) {
    return { kind: 'research', topic: value || 'General research' };
  }

  // Try to match a next-question rule (Stage 1 behavior)
  const nextQuestion = decideNextQuestion(qid, value);
  if (nextQuestion) {
    return { kind: 'ask_next', nextQuestion };
  }

  // No rule matched; skip silently
  return { kind: 'skip' };
}

export interface OrchestratorState {
  lastSeenTs: string;
  pending?: Array<{ qid: string; askedAt: string }>;
}

export interface OrchestratorTickDeps {
  bot: {
    api: {
      sendMessage: (chatId: number, text: string, options?: any) => Promise<any>;
    };
  };
  groupId: number;
  zaalTgId: number;
  now: Date;
}

async function readState(): Promise<OrchestratorState> {
  try {
    const raw = await fs.readFile(ORCHESTRATOR_STATE_PATH(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { lastSeenTs: new Date().toISOString() };
  }
}

async function writeState(state: OrchestratorState): Promise<void> {
  await fs.mkdir(join(ORCHESTRATOR_STATE_PATH(), '..'), { recursive: true });
  await fs.writeFile(ORCHESTRATOR_STATE_PATH(), JSON.stringify(state, null, 2), 'utf8');
}

async function countToday(date: string): Promise<number> {
  try {
    const c = JSON.parse(await fs.readFile(ORCHESTRATOR_COUNTER(), 'utf8')) as {
      date: string;
      n: number;
    };
    return c.date === date ? c.n : 0;
  } catch {
    return 0;
  }
}

async function bumpToday(date: string): Promise<void> {
  const n = (await countToday(date)) + 1;
  await fs.mkdir(join(ORCHESTRATOR_COUNTER(), '..'), { recursive: true });
  await fs.writeFile(ORCHESTRATOR_COUNTER(), JSON.stringify({ date, n }), 'utf8');
}

async function acquireLock(): Promise<boolean> {
  const st = await fs.stat(ORCHESTRATOR_LOCK()).catch(() => null);
  if (st && Date.now() - st.mtimeMs < LOCK_STALE_MS) return false;
  await fs.mkdir(join(ORCHESTRATOR_LOCK(), '..'), { recursive: true });
  await fs.writeFile(ORCHESTRATOR_LOCK(), String(Date.now()));
  return true;
}

async function releaseLock(): Promise<void> {
  try {
    await fs.unlink(ORCHESTRATOR_LOCK());
  } catch {
    // best-effort
  }
}

/**
 * Read the group's recent/<gid>.json (where callback-button answers are logged).
 * Return only Zaal's [answer:qid] lines with ts > lastSeenTs, excluding system senders.
 */
export async function detectNewAnswers(
  lastSeenTs: string,
  groupId: number,
): Promise<Array<{ qid: string; value: string; ts: string }>> {
  // Derive recent dir from ZOE_HOME (set at runtime)
  const zoeHome = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
  const recentPath = join(zoeHome, 'recent', `${groupId}.json`);
  try {
    const raw = await fs.readFile(recentPath, 'utf8');
    const turns = JSON.parse(raw) as Array<{
      from: string;
      text: string;
      ts: string;
      sender?: string;
    }>;

    const answers: Array<{ qid: string; value: string; ts: string }> = [];
    for (const turn of turns) {
      // Only Zaal, skip system senders (zsk*, zvl*)
      if (turn.from !== 'zaal' || (turn.sender && (turn.sender.startsWith('zsk') || turn.sender.startsWith('zvl')))) {
        continue;
      }
      // Only [answer:*] lines
      const match = /^\[answer:([^\]]+)\]\s*(.*)$/.exec(turn.text);
      if (!match) continue;
      const [, qid, value] = match;
      // Only if ts > lastSeenTs
      if (new Date(turn.ts) <= new Date(lastSeenTs)) continue;

      answers.push({ qid, value: value.trim(), ts: turn.ts });
    }
    return answers;
  } catch {
    return [];
  }
}

/**
 * Look up the next question based on (fromQid, tappedValue).
 * Returns { qid, options } or null if no rule matches.
 */
export function decideNextQuestion(
  fromQid: string,
  value: string,
): { qid: string; options: string[] } | null {
  for (const rule of DECISION_TABLE) {
    if (rule.fromQid === fromQid && rule.onValue === value) {
      return { qid: rule.toQid, options: rule.options };
    }
  }
  return null;
}

/**
 * Stage 2: Enqueue research via the work-loop's existing pipeline.
 * Best-effort; logs on failure but doesn't throw.
 */
async function actionEnqueueResearch(topic: string): Promise<boolean> {
  try {
    const item = await enqueueWork(topic);
    console.log(`[zoe/orchestrator] enqueued research: "${topic}" (${item.id})`);
    return true;
  } catch (err) {
    console.error('[zoe/orchestrator] failed to enqueue research:', (err as Error)?.message);
    return false;
  }
}

/**
 * Stage 2: Mark a team tracker task as done via PATCH.
 * Requires COWORK_TRACKER_URL and COWORK_TRACKER_KEY env vars.
 * Best-effort; returns false on any error.
 */
async function actionMarkTaskDone(taskId: string): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) {
    console.log(`[zoe/orchestrator] tracker not configured, skip board update for ${taskId}`);
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${taskId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: 'done' }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      console.log(`[zoe/orchestrator] marked task ${taskId} as done`);
      return true;
    }

    console.error(`[zoe/orchestrator] tracker PATCH ${taskId} returned ${res.status}`);
    return false;
  } catch (err) {
    console.error(
      '[zoe/orchestrator] failed to mark task done:',
      (err as Error)?.message,
    );
    return false;
  }
}

/**
 * Stage 2: Post a brief confirmation message to the group after executing an action.
 * Best-effort; doesn't throw.
 */
async function postActionConfirmation(
  deps: OrchestratorTickDeps,
  action: AnswerAction,
  answer: { qid: string; value: string },
): Promise<void> {
  let msg = '';
  switch (action.kind) {
    case 'research':
      msg = `Queued research: ${action.topic}`;
      break;
    case 'board_done':
      msg = `Marked task done.`;
      break;
    case 'ask_next':
      // No confirmation for ask_next; the question itself is the confirmation
      return;
    case 'skip':
      return;
  }

  try {
    await deps.bot.api.sendMessage(deps.groupId, msg);
  } catch (err) {
    console.error('[zoe/orchestrator] failed to post confirmation:', (err as Error)?.message);
  }
}

/**
 * Build the button question text for a given qid (simple labels, not LLM).
 */
function questionTextFor(qid: string): string | null {
  const texts: Record<string, string> = {
    'q-priority-what': "What's the priority for next?",
    'q-priority-research-depth': 'How deep should the research go?',
    'q-priority-code-type': 'What kind of code work?',
    'q-priority-meetings-focus': 'What type of meeting?',
    'q-research-scope': 'What research scope?',
    'q-code-urgency': 'How urgent is this code work?',
    'q-meeting-depth': 'How deep is this meeting?',
  };
  return texts[qid] ?? null;
}

/**
 * Main orchestrator tick: detect new answers, decide follow-ups, post questions.
 * Disabled by default; only runs when ZOE_ORCHESTRATOR_ENABLED === 'true'.
 */
export async function runOrchestratorTick(deps: OrchestratorTickDeps): Promise<void> {
  // SAFETY: disabled by default
  if (process.env.ZOE_ORCHESTRATOR_ENABLED !== 'true') {
    return;
  }

  // Daily cap
  const dateStr = deps.now.toISOString().slice(0, 10);
  const done = await countToday(dateStr);
  if (done >= DAILY_CAP) {
    console.log(
      `[zoe/orchestrator] daily cap ${DAILY_CAP} reached, next tick after UTC midnight`,
    );
    return;
  }

  // File lock: one tick at a time
  if (!(await acquireLock())) {
    console.log('[zoe/orchestrator] another run in progress, skip');
    return;
  }

  try {
    const state = await readState();
    const answers = await detectNewAnswers(state.lastSeenTs, deps.groupId);

    if (answers.length === 0) {
      console.log('[zoe/orchestrator] no new answers, silent');
      return;
    }

    // Stage 2: Process each new answer via action classification
    let actioned = 0;
    for (const answer of answers) {
      const action = classifyAnswer(answer.qid, answer.value);

      switch (action.kind) {
        case 'research':
          // Enqueue research via work-loop pipeline
          if (await actionEnqueueResearch(action.topic!)) {
            actioned++;
            await postActionConfirmation(deps, action, answer);
          }
          break;

        case 'board_done':
          // Mark task as done on team tracker
          if (await actionMarkTaskDone(action.taskId!)) {
            actioned++;
            await postActionConfirmation(deps, action, answer);
          }
          break;

        case 'ask_next':
          // Stage 1: Post the next question with buttons
          if (!action.nextQuestion) {
            console.log(
              `[zoe/orchestrator] ask_next but no nextQuestion for (${answer.qid}, "${answer.value}")`,
            );
            break;
          }

          const qText = questionTextFor(action.nextQuestion.qid);
          if (!qText) {
            console.log(
              `[zoe/orchestrator] no text for qid ${action.nextQuestion.qid}, skip`,
            );
            break;
          }

          try {
            await deps.bot.api.sendMessage(deps.groupId, qText, {
              reply_markup: questionKeyboard(action.nextQuestion.qid, action.nextQuestion.options),
            });
            actioned++;
            console.log(
              `[zoe/orchestrator] posted ${action.nextQuestion.qid} after answer (${answer.qid}, "${answer.value}")`,
            );
          } catch (err) {
            console.error(
              '[zoe/orchestrator] failed to post next question:',
              (err as Error)?.message,
            );
          }
          break;

        case 'skip':
          console.log(
            `[zoe/orchestrator] no rule for (${answer.qid}, "${answer.value}"), silent`,
          );
          break;
      }
    }

    const posted = actioned;

    if (posted > 0) {
      // Advance pointer to latest answer's timestamp
      const latestTs = answers[answers.length - 1].ts;
      await writeState({ lastSeenTs: latestTs });
      await bumpToday(dateStr);
      console.log(`[zoe/orchestrator] tick: ${answers.length} answer(s), ${posted} action(s) executed`);
    }
  } finally {
    await releaseLock();
  }
}
