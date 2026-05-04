/**
 * Memory block builder — Letta-inspired pattern.
 *
 * 4 named blocks per concierge turn:
 *   persona  — ZOE identity + voice rules (versioned in git)
 *   human    — Zaal facts (refreshed daily via Bonfire RECALL or hand-edited)
 *   working  — last 5 turns from this Telegram thread
 *   tasks    — open task queue snapshot
 *
 * Each block is independently updatable. Cleaner than monolithic system prompt.
 *
 * Storage on host:
 *   ~/.zao/zoe/persona.md      — versioned, committed to repo
 *   ~/.zao/zoe/human.md         — local cache, refreshed daily
 *   ~/.zao/zoe/recent.json      — last N turns, FIFO ring buffer
 *   ~/.zao/zoe/tasks.json       — open task queue
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import type { ZoeTask } from './types';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const PERSONA_PATH = join(ZOE_HOME, 'persona.md');
const HUMAN_PATH = join(ZOE_HOME, 'human.md');
const RECENT_PATH = join(ZOE_HOME, 'recent.json');
const TASKS_PATH = join(ZOE_HOME, 'tasks.json');

const RECENT_MAX = 5;

const PERSONA_DEFAULT = `You are ZOE — Zaal Panthaki's personal concierge running on Claude Sonnet/Opus via the bot/src/zoe Hermes-style runtime. You DM Zaal as @zaoclaw_bot.

VOICE (Year-of-the-ZABAL, non-negotiable):
- Clear, simple, spartan
- Short impactful sentences
- Active voice
- No marketing language ("leveraging", "synergize", "unlock value" are banned)
- No emojis ever
- No em dashes — use hyphens
- Never start with "Sure!" or "Of course"
- Default 2-3 sentences. Expand only when topic demands.
- Lead with outcome, not process

ANTI-PATTERNS:
- Never ask "Would you like me to..." — just do it
- Never list 5 options when 1 is obviously right
- Never ask permission for routine tasks (research, reads, status checks)
- Never repeat a task back before doing it
- Never fabricate facts. If unsure, say so OR query Bonfire via RECALL.
- Never claim memory state changes that didn't happen.

ROUTING:
- Code-fix work → Hermes coder/critic (your sibling at bot/src/hermes). Tell Zaal.
- Graph queries → RECALL pattern (manual relay until SDK lands). Output the query, Zaal pastes to @zabal_bonfire.
- Daily ops, captures, nudges → you handle directly.

MEMORY:
- Working memory (this conversation) is in <working_memory> block.
- Long-term facts about Zaal are in <human> block. Treat as ground truth.
- Open tasks are in <tasks> block. Update via JSON ops in your reply (see output format).

OUTPUT FORMAT:
Reply naturally to Zaal. If you want to add/update tasks OR captured a note, append at the END:

----
\`\`\`json
{
  "task_ops": [
    {"op": "add", "task": {"title": "...", "description": "...", "status": "pending", "priority": "med", "source": "ad-hoc", "notes": []}},
    {"op": "complete", "id": "task-id", "outcome": "..."}
  ],
  "captures": [
    {"text": "verbatim what zaal said worth remembering", "topic": "decision"}
  ],
  "escalate": false
}
\`\`\`

Set "escalate": true ONLY if your current model (Sonnet) cannot answer well and the response should be re-run on Opus. Include "reason" when escalating.

If no ops/captures and no escalation: omit the JSON block entirely.`;

const HUMAN_DEFAULT = `# Zaal Panthaki

Solo founder of The ZAO (decentralized impact network for music + creators).

## Identity
- Farcaster: @zaal (FID lookup via Neynar)
- X: @bettercallzaal
- ENS: zaal.eth (registered 2022-08-26)
- Wallet: 0x7234c36a71ec237c2ae7698e8916e0735001e9af
- Email: zaalp99@gmail.com

## Schedule (M-F default)
- 4:30am wake
- Gym
- 9am-12pm prime build #1 (Claude Code CLI on Mac)
- 12pm lunch + content stream
- 1pm-4pm meetings, calls, mobile captures (Telegram)
- 4pm-7pm prime build #2
- 9pm reflection + plan tomorrow

## Active projects (cross-link to Bonfire if details needed)
- ZAO OS — Farcaster-gated client at zaoos.com
- ZAOstock 2026 — flagship event, Oct 3 2026, Ellsworth Maine
- BCZ YapZ — podcast (18 episodes published)
- BCZ Strategies LLC — agency, ZAO Music DBA underneath
- ZABAL coin — launched Jan 1 2026 on Base
- WaveWarZ — music battle platform on Solana
- ZAO Fractals — weekly governance, 90+ weeks running

## Key relationships (RECALL via Bonfire for full context)
- Cassie (ZAOstock strategic advisor)
- Steve Peer (Ellsworth co-curator + drummer)
- Roddy Ehrlenbach (City of Ellsworth Parks/Rec)
- Joshua.eth (Bonfires founder)
- Ohnahji + EZinCrypto (LTAW3 cohosts)

## Voice fingerprint
Year-of-the-ZABAL daily on paragraph.com/@thezao. ~120 daily posts as of May 2026. Spartan + practical + active voice + no marketing.

## Last refreshed
2026-05-04 (initial seed). Auto-update from Bonfire RECALL when SDK lands.`;

export interface MemoryBlocks {
  persona: string;
  human: string;
  working: string;
  tasks: string;
}

export async function ensureZoeHome(): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  // Seed defaults if missing
  try {
    await fs.access(PERSONA_PATH);
  } catch {
    await fs.writeFile(PERSONA_PATH, PERSONA_DEFAULT, 'utf8');
  }
  try {
    await fs.access(HUMAN_PATH);
  } catch {
    await fs.writeFile(HUMAN_PATH, HUMAN_DEFAULT, 'utf8');
  }
  try {
    await fs.access(RECENT_PATH);
  } catch {
    await fs.writeFile(RECENT_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  try {
    await fs.access(TASKS_PATH);
  } catch {
    await fs.writeFile(TASKS_PATH, JSON.stringify([], null, 2), 'utf8');
  }
}

export async function readPersona(): Promise<string> {
  await ensureZoeHome();
  return fs.readFile(PERSONA_PATH, 'utf8');
}

export async function readHuman(): Promise<string> {
  await ensureZoeHome();
  return fs.readFile(HUMAN_PATH, 'utf8');
}

export async function readRecent(): Promise<Array<{ from: 'zaal' | 'zoe'; text: string; ts: string }>> {
  await ensureZoeHome();
  const raw = await fs.readFile(RECENT_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function pushRecent(turn: { from: 'zaal' | 'zoe'; text: string }): Promise<void> {
  const recent = await readRecent();
  recent.push({ ...turn, ts: new Date().toISOString() });
  while (recent.length > RECENT_MAX) recent.shift();
  await fs.writeFile(RECENT_PATH, JSON.stringify(recent, null, 2), 'utf8');
}

export async function readTasks(): Promise<ZoeTask[]> {
  await ensureZoeHome();
  const raw = await fs.readFile(TASKS_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function writeTasks(tasks: ZoeTask[]): Promise<void> {
  await ensureZoeHome();
  await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2), 'utf8');
}

/**
 * Build the 4 memory blocks for a concierge turn.
 * Block strings are kept short by design — no dumping full graph context.
 */
export async function buildMemoryBlocks(): Promise<MemoryBlocks> {
  const [persona, human, recentTurns, tasks] = await Promise.all([
    readPersona(),
    readHuman(),
    readRecent(),
    readTasks(),
  ]);

  const working =
    recentTurns.length === 0
      ? '(no recent turns)'
      : recentTurns
          .map((t) => `[${t.ts.slice(11, 16)}] ${t.from === 'zaal' ? 'Zaal' : 'ZOE'}: ${t.text.slice(0, 280)}`)
          .join('\n');

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const tasksBlock =
    openTasks.length === 0
      ? '(no open tasks)'
      : openTasks
          .slice(0, 12)
          .map((t, i) => `${i + 1}. [${t.priority}] [${t.status}] ${t.title}\n   ${t.description.slice(0, 100)}`)
          .join('\n');

  return { persona, human, working, tasks: tasksBlock };
}

/**
 * Render memory blocks + user message into the prompt that goes to Claude CLI.
 */
export function renderConciergePrompt(blocks: MemoryBlocks, userMessage: string): string {
  return [
    `<persona>\n${blocks.persona}\n</persona>`,
    `<human>\n${blocks.human}\n</human>`,
    `<working_memory>\n${blocks.working}\n</working_memory>`,
    `<tasks>\n${blocks.tasks}\n</tasks>`,
    ``,
    `Zaal: ${userMessage}`,
  ].join('\n\n');
}

export const ZOE_PATHS = {
  home: ZOE_HOME,
  persona: PERSONA_PATH,
  human: HUMAN_PATH,
  recent: RECENT_PATH,
  tasks: TASKS_PATH,
};
