/**
 * ZOE concierge brain — calls Claude Code CLI with the 4-block memory context
 * (persona, human, working, tasks) and Zaal's message. Returns reply + task ops.
 *
 * Sister to bot/src/hermes/coder.ts (which does code-fix). This one does
 * "talk to Zaal day-to-day."
 *
 * Single source of truth for ZOE identity = ~/.zao/zoe/persona.md (seeded
 * from PERSONA_DEFAULT in memory.ts on first boot, hand-editable after).
 */
import { callClaudeCli } from '../hermes/claude-cli';
import type { ConciergeOptions, ConciergeResult, TaskOp, QuestOp, ZoeCaptureNote, BotRelayOp } from './types';
import { selectModel, ZOE_DEFAULT_MODEL } from './types';
import type { MemoryBlocks } from './memory';

const ZOE_VERSION = '0.2.0';

/**
 * Render the 4 memory blocks as a system prompt for Claude Code CLI.
 * The user's message is passed separately as `prompt`.
 */
function buildSystemBlocks(blocks: MemoryBlocks, currentDate: string): string {
  const chatLine =
    blocks.chat_scope === 'private'
      ? 'Chat: DM with Zaal'
      : `Chat: group "${blocks.chat_title ?? blocks.chat_scope}" (id ${blocks.chat_scope})`;

  return [
    `<current_time>`,
    `${currentDate}`,
    `</current_time>`,
    ``,
    `<runtime>`,
    `ZOE v${ZOE_VERSION}. The <current_time> block above is your authoritative time. When asked 'what time is it' / 'what day is it' / similar, answer with THAT exact value. Do not infer from message metadata or your own clock.`,
    `</runtime>`,
    ``,
    `<persona>`,
    blocks.persona,
    `</persona>`,
    ``,
    `<human>`,
    blocks.human,
    `</human>`,
    ``,
    `<working_memory>`,
    chatLine,
    blocks.working,
    `</working_memory>`,
    ``,
    `<tasks>`,
    blocks.tasks,
    `</tasks>`,
    ``,
    `<quests>`,
    blocks.quests,
    `</quests>`,
  ].join('\n');
}

/**
 * Run a concierge turn:
 * 1. Build system prompt from memory blocks (persona/human/working/tasks)
 * 2. Call Claude Code CLI with the user's message + blocks as appendSystemPrompt
 * 3. Parse the reply text + extract task_ops/captures JSON block
 * 4. Return structured result
 */
export async function runConciergeTurn(opts: ConciergeOptions): Promise<ConciergeResult> {
  const model = opts.model ?? selectModel(opts.message);
  const systemBlocks = buildSystemBlocks(opts.blocks, opts.context.current_date);

  const senderLabel = opts.senderLabel ?? 'Zaal';
  const userPrompt = `${senderLabel}: ${opts.message}`;

  const result = await callClaudeCli({
    model,
    prompt: userPrompt,
    cwd: opts.context.workspace_dir,
    appendSystemPrompt: systemBlocks,
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
      // Doc 759 Gap 2 (locked Q1=GATEWAY, Q5=8 workers): subagent dispatch via
      // Task tool. Workers live in bot/src/zoe/.claude/agents/*.md and ZOE
      // routes per the persona ROUTING block. Both 'Task' and 'Agent' added
      // because Claude Code CLI tool name varies by version.
      'Task',
      'Agent',
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
    // bare: false on purpose. Claude Code CLI 2.1.140+ explicitly disables
    // OAuth credential reads under --bare ("Anthropic auth is strictly
    // ANTHROPIC_API_KEY or apiKeyHelper"). ZOE uses Max-plan OAuth, so we
    // run without --bare. Cost is ~$0.10 per cold turn for CLAUDE.md auto-
    // discovery (~26K input tokens) but prompt-cache amortizes that across
    // a session.
    bare: false,
  });

  const { reply, taskOps, questOps, captures, botRelayOps } = splitReplyAndOps(result.text);

  return {
    reply,
    task_ops: taskOps,
    quest_ops: questOps,
    captures,
    bot_relay_ops: botRelayOps,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    model,
    durationMs: result.durationMs,
  };
}

const OPS_FENCE_RE = /----\s*```json\s*([\s\S]*?)\s*```\s*$/;

function splitReplyAndOps(text: string): {
  reply: string;
  taskOps: TaskOp[];
  questOps: QuestOp[];
  captures: ZoeCaptureNote[];
  botRelayOps: BotRelayOp[];
} {
  const match = text.match(OPS_FENCE_RE);
  if (!match) {
    return { reply: text.trim(), taskOps: [], questOps: [], captures: [], botRelayOps: [] };
  }
  const jsonStr = match[1];
  const reply = text.replace(OPS_FENCE_RE, '').trim();
  try {
    const parsed = JSON.parse(jsonStr) as {
      task_ops?: TaskOp[];
      quest_ops?: QuestOp[];
      captures?: Array<{ text: string; topic: string }>;
      bot_relay_ops?: BotRelayOp[];
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
      questOps: parsed.quest_ops ?? [],
      captures,
      botRelayOps: parsed.bot_relay_ops ?? [],
    };
  } catch (err) {
    console.error('[zoe/concierge] failed to parse ops JSON:', (err as Error).message, 'raw:', jsonStr.slice(0, 200));
    return { reply, taskOps: [], questOps: [], captures: [], botRelayOps: [] };
  }
}

export { ZOE_DEFAULT_MODEL };
