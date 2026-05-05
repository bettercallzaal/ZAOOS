/**
 * ZOE concierge brain — calls Claude Code CLI with concierge system prompt
 * and Zaal-personalized context. Returns reply + task ops + captures.
 *
 * Sister to bot/src/hermes/coder.ts (which does code-fix). This one does
 * "talk to Zaal day-to-day."
 */
import { callClaudeCli } from '../hermes/claude-cli';
import type { ConciergeOptions, ConciergeResult, ZoeContext, TaskOp, ZoeCaptureNote } from './types';
import { selectModel, ZOE_DEFAULT_MODEL } from './types';
import { buildFactsBlock } from './facts';
import { promises as fsAsync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import { ZOE_PATHS } from './memory';

const ZOE_VERSION = '0.1.0';

/**
 * Concierge system prompt. Loaded into Claude Code CLI on every concierge call.
 * Matches Year-of-the-ZABAL Paragraph voice (clear, simple, spartan, active voice).
 *
 * Tool use: ZOE has Read/Glob/Grep/Bash to inspect the ZAOOS repo, plus the
 * recall.ts module for Bonfire access (when key arrives, otherwise asks Zaal
 * to relay manually).
 */
function buildSystemPrompt(context: ZoeContext): string {
  return `You are ZOE — Zaal Panthaki's personal concierge. You run on Claude Opus/Sonnet via the Hermes runtime (bot/src/zoe). You DM Zaal on Telegram as @zaoclaw_bot.

Today is ${context.current_date}.

## Your job
- Daily tasks + captures + nudges. You are NOT a code-fix bot (that's Hermes coder/critic, your sibling at bot/src/hermes).
- Surface findings, connect dots between captures and projects, nudge on priorities.
- Match Zaal's Year-of-the-ZABAL voice: clear, simple, spartan, short impactful sentences, active voice. No marketing language.
- Never say "Sure!" or "Of course" — just answer.
- Default 2-3 sentences. Expand only when topic demands.

## Voice rules (non-negotiable)
- No emojis ever
- No em dashes (use hyphens)
- No "leveraging", "synergize", "unlock value", "ecosystem of solutions"
- No "Would you like me to..." - just do it
- Lead with the outcome, not the process

## Format rules (Telegram-readable)
- SHORT paragraphs. Max 2 sentences per paragraph.
- ALWAYS insert a blank line between paragraphs.
- Use bullet lists when listing 3+ items. One thought per bullet.
- Default total reply: 3-6 lines, broken into 2-4 paragraphs.
- Long replies (>10 lines) only when Zaal explicitly asks for "full" / "deep" / "detail".
- Phone-readable. Imagine Zaal scrolling Telegram one-handed.

## Your tools
- Read, Glob, Grep on the ZAOOS repo
- Bash for limited shell ops (gh CLI, git read-only commands, simple curl)
- Bonfire RECALL via recall.ts module (when a question requires graph facts)

## Pending tasks (your work queue)
${context.pending_tasks.map((t, i) => `${i + 1}. [${t.priority}] [${t.status}] ${t.title}\n   ${t.description.slice(0, 120)}`).join('\n')}

## Recent captures (last 5)
${context.recent_captures.slice(0, 5).map((c) => `- ${c.created_at.slice(0, 10)} (${c.topic}): ${c.text.slice(0, 100)}`).join('\n') || '(none yet)'}

## Output format
Reply naturally to Zaal. If you want to add or update tasks, OR you captured a new note from this exchange, append a JSON block at the END of your reply (after a ---- separator):

----
\`\`\`json
{
  "task_ops": [
    {"op": "add", "task": {"title": "...", "description": "...", "status": "pending", "priority": "med", "source": "ad-hoc", "notes": []}},
    {"op": "complete", "id": "task-id", "outcome": "..."}
  ],
  "captures": [
    {"text": "verbatim what zaal said worth remembering", "topic": "decision"}
  ]
}
\`\`\`

If no task ops or captures, omit the JSON block entirely. Do not include placeholder JSON.

## Critical rules
1. NEVER fabricate facts. If you don't know, say "I'd need to check Bonfire for that — want me to query?"
2. NEVER claim memory state changes that didn't occur (no "I've remembered that for you" unless you actually wrote a capture).
3. NEVER use commands like /add or /done as part of your output — that was the OLD Telegram bot pattern. You write the JSON block instead, and the runner applies the ops.
4. When unsure, pick one and tell Zaal what you did, not what you could do.

ZOE v${ZOE_VERSION}. Lean. Direct. Match the Year-of-the-ZABAL voice.`;
}

/**
 * Run a concierge turn:
 * 1. Build system prompt from context
 * 2. Call Claude Code CLI with the user's message + concierge system prompt
 * 3. Parse the reply text + extract task_ops/captures JSON block
 * 4. Return structured result
 */
// Read today's newsletter draft if it exists - lets concierge recognize replies
// to the newsletter as feedback (e.g. "its always fractal monday").
async function readTodaysNewsletter(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const path = pathJoin(ZOE_PATHS.home, 'newsletters', `${today}.md`);
  try {
    return await fsAsync.readFile(path, 'utf8');
  } catch {
    return '';
  }
}

export async function runConciergeTurn(opts: ConciergeOptions): Promise<ConciergeResult> {
  const model = opts.model ?? selectModel(opts.message);
  const baseSystemPrompt = buildSystemPrompt(opts.context);
  const factsBlock = await buildFactsBlock();
  const todaysNewsletter = await readTodaysNewsletter();

  const newsletterContext = todaysNewsletter
    ? `\n\n## Today's newsletter draft (in scope - if Zaal replies with a correction, addition, or context, treat it as feedback. Suggest the exact "@newsletter edit <addition>" command rather than ignoring or giving generic philosophical replies)\n\n"""\n${todaysNewsletter.slice(0, 2500)}\n"""\n`
    : '';

  const systemPrompt = baseSystemPrompt + factsBlock + newsletterContext;

  const result = await callClaudeCli({
    model,
    prompt: opts.message,
    cwd: opts.context.workspace_dir,
    appendSystemPrompt: systemPrompt,
    allowedTools: [
      'Read',
      'Glob',
      'Grep',
      'Bash(gh issue list*)',
      'Bash(gh pr list*)',
      'Bash(gh pr view*)',
      'Bash(git log*)',
      'Bash(git status)',
      'Bash(curl -s*)',
      // Doc 605 Phase 1 unlock: Playwright MCP for browse-DOM-grounded tasks
      // (read-only by allowed-list shape; browser_click/type/select still gated by user gesture in MCP)
      'mcp__playwright__browser_snapshot',
      'mcp__playwright__browser_navigate',
      'mcp__playwright__browser_take_screenshot',
      'mcp__playwright__browser_evaluate',
      'mcp__playwright__browser_console_messages',
      'mcp__playwright__browser_network_requests',
      'mcp__playwright__browser_click',
      'mcp__playwright__browser_type',
      'mcp__playwright__browser_press_key',
      'mcp__playwright__browser_wait_for',
      'mcp__playwright__browser_close',
    ],
    disallowedTools: [
      'Bash(git push*)',
      'Bash(git commit*)',
      'Bash(git reset*)',
      'Bash(rm*)',
      'Edit',
      'Write',
    ],
    permissionMode: 'auto',
    outputFormat: 'json',
    // bare: true REMOVED 2026-05-04 - --bare strictly skips OAuth+keychain,
    // breaking Max-plan auth on the VPS. Zaal uses Max plan via `claude /login`,
    // not ANTHROPIC_API_KEY. With --bare gone, claude reads OAuth normally.
  });

  // Parse JSON block (if present) at end of reply
  const { reply, taskOps, captures } = splitReplyAndOps(result.text);

  return {
    reply,
    task_ops: taskOps,
    captures,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    model,
    durationMs: result.durationMs,
  };
}

const OPS_FENCE_RE = /----\s*```json\s*([\s\S]*?)\s*```\s*$/;

function splitReplyAndOps(text: string): { reply: string; taskOps: TaskOp[]; captures: ZoeCaptureNote[] } {
  const match = text.match(OPS_FENCE_RE);
  if (!match) {
    return { reply: text.trim(), taskOps: [], captures: [] };
  }
  const jsonStr = match[1];
  const reply = text.replace(OPS_FENCE_RE, '').trim();
  try {
    const parsed = JSON.parse(jsonStr) as {
      task_ops?: TaskOp[];
      captures?: Array<{ text: string; topic: string }>;
    };
    const captures: ZoeCaptureNote[] = (parsed.captures ?? []).map((c) => ({
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: c.text,
      topic: c.topic ?? 'note',
      source: 'dm',
      created_at: new Date().toISOString(),
    }));
    return {
      reply,
      taskOps: parsed.task_ops ?? [],
      captures,
    };
  } catch (err) {
    console.error('[zoe/concierge] failed to parse ops JSON:', (err as Error).message, 'raw:', jsonStr.slice(0, 200));
    return { reply, taskOps: [], captures: [] };
  }
}

export { ZOE_DEFAULT_MODEL };
