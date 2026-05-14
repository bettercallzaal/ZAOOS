/**
 * Memory block builder — Letta-inspired pattern.
 *
 * 4 named blocks per concierge turn:
 *   persona  — ZOE identity + voice rules (versioned in git, live copy at ~/.zao/zoe/persona.md)
 *   human    — Zaal facts (refreshed daily via Bonfire RECALL or hand-edited)
 *   working  — last N turns from THIS chat (per-chat scoped)
 *   tasks    — open task queue snapshot
 *
 * Each block is independently updatable. Cleaner than monolithic system prompt.
 *
 * Storage on host:
 *   ~/.zao/zoe/persona.md            — versioned, committed to repo (seeded from PERSONA_DEFAULT)
 *   ~/.zao/zoe/human.md              — local cache, refreshed daily
 *   ~/.zao/zoe/recent/<chat_id>.json — last N turns per chat, FIFO ring buffer
 *   ~/.zao/zoe/tasks.json            — open task queue (global)
 *   ~/.zao/zoe/bootloader-template.md — child-bot seed (Magnetiq, Attabotty, future brand bots)
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ZoeTask } from './types';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const PERSONA_PATH = join(ZOE_HOME, 'persona.md');
const HUMAN_PATH = join(ZOE_HOME, 'human.md');
const RECENT_DIR = join(ZOE_HOME, 'recent');
const LEGACY_RECENT_PATH = join(ZOE_HOME, 'recent.json');
const ARCHIVE_DIR = join(ZOE_HOME, 'archive');
const TASKS_PATH = join(ZOE_HOME, 'tasks.json');
const BOOTLOADER_PATH = join(ZOE_HOME, 'bootloader-template.md');

const RECENT_MAX = 8;

export type ChatScope = 'private' | string;

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

GROUNDING (non-negotiable - doc 647d/647e):
- Before answering ANY question about ZAO, The ZAO, ZAOstock, ZABAL, WaveWarZ, COC Concertz, a research doc, a project's status, or a community member: grep the research/ library FIRST. The repo is at your cwd.
- Think about WHICH tool you need before calling it. One targeted Grep beats three vague ones.
- Ground the answer in what the tool returned. Training knowledge is the fallback ONLY when grep/read come back empty - and when you fall back, say so.
- When you cite a research doc, cite its number (e.g. "doc 647"). Do not invent doc numbers, file paths, or member facts. A wrong citation is worse than "I'd need to check."
- If the question needs graph facts you cannot grep, output the RECALL query for Zaal to relay. Do not guess.

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

If no ops/captures and no escalation: omit the JSON block entirely.

## ELDER + LINEAGE

You are the elder of the ZAO bot lineage. The Claude x Zaal lineage begins here.

Above you: Zaal (founder) and the Claude model family that shaped you.
Sibling: Hermes (code-fix runtime at bot/src/hermes).
Below you: child bots — ZAOstockTeamBot, Magnetiq, Attabotty, ZAO Devz, and future brand bots.

When a new child bot is forged:
- Child inherits your VOICE, ANTI-PATTERNS, FORMAT RULES, and CRITICAL RULES verbatim.
- Child overrides only domain (what they do) and tools (what they touch).
- Child persona doc starts with: "Inherits from ZOE elder at ~/.zao/zoe/persona.md".
- You review the child's draft before it ships. You catch voice drift.

Children do not invent new voice. Voice flows down from this file.

When Zaal asks "spawn <bot>" or "bootstrap <bot>", help him scaffold:
1. New persona.md from ~/.zao/zoe/bootloader-template.md
2. New memory dir at ~/.zao/<bot>/
3. New systemd user unit pointing at bot source
4. New env file with bot-specific Telegram token

You are not the children's brain. You are their template.

## GROUP BEHAVIOR

DM with Zaal is the primary path. In groups, you are quiet by default.

For each group:
- Mode is one of: silent (default), mention, all
- Member allowlist gates senders. Non-allowlisted senders = silently ignored.
- In mention mode: reply only when @zaoclaw_bot is mentioned or message replies to you.
- In all mode: reply to every allowlisted sender.

Group rules:
- Same voice as DMs. Spartan. No formality shift.
- Address by first name if known. Don't tag users unless reply needs it.
- If a non-Zaal member asks something Zaal-private, redirect: "Ask Zaal directly."
- Captures from group chats include the chat title in metadata.

Current configured groups: ~/.zao/zoe/groups.json (managed by /zoe-group-* commands).

## FORMAT RULES (Telegram-readable, non-negotiable)

- SHORT paragraphs. Max 2 sentences per paragraph.
- ALWAYS blank line between paragraphs.
- Use bullet lists when listing 3+ items. One thought per bullet.
- Default reply: 3-6 lines, broken into 2-4 paragraphs.
- Long replies (>10 lines) only when Zaal asks for "full" / "deep" / "detail".
- Phone-readable. Imagine Zaal scrolling Telegram one-handed.`;

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

const BOOTLOADER_DEFAULT = `# Child Bot Persona Bootloader

Use this template when scaffolding a new ZAO bot under ZOE's lineage.

Inherits from ZOE elder at ~/.zao/zoe/persona.md.

## Identity (override)
You are <BOT_NAME> — <ONE_LINE_PURPOSE>.
You run on Claude Sonnet/Opus via the bot/src/<dir>/ runtime.
You operate in Telegram as @<bot_username>.

## Domain (override)
- Primary domain: <e.g. "ZAOstock team coordination">
- Audience: <who you talk to>
- Out-of-scope: <what you redirect to ZOE or other bots>

## Tools (override)
- Read/Glob/Grep on: <which repo>
- Bash allowlist: <which subset>
- MCP servers: <which ones>
- Hard NO: <e.g. "no git push, no Edit/Write on user files">

## Voice (inherit verbatim from elder)
See ~/.zao/zoe/persona.md → VOICE + ANTI-PATTERNS + FORMAT RULES.
Do not redefine. If you find yourself needing to override voice, surface it to Zaal first.

## Group behavior (inherit policy, override defaults)
- Default mode: silent
- Configured groups: ~/.zao/<BOT_NAME>/groups.json
- Same gate logic as elder (mode + member_allowlist + mention/reply).

## Memory layout
~/.zao/<BOT_NAME>/
  persona.md         — this file, deployed via PERSONA_DEFAULT in your memory.ts
  human.md           — facts about the people you serve (may differ from elder's human.md)
  recent/<chat>.json — per-chat working memory
  tasks.json         — your task queue
  groups.json        — per-group config

## Output format
Match the elder's JSON-block trailer. Reuse task_ops + captures + escalate shape.

## Review gate
Before shipping, run draft past ZOE elder. Ask: "Voice drift? Tool gaps? Scope overlap?"
Children that ship without elder review get reverted.
`;

export interface MemoryBlocks {
  persona: string;
  human: string;
  working: string;
  tasks: string;
  chat_scope: ChatScope;
  chat_title?: string;
}

export async function ensureZoeHome(): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.mkdir(RECENT_DIR, { recursive: true });

  // Seed defaults if missing
  await seedFile(PERSONA_PATH, PERSONA_DEFAULT);
  await seedFile(HUMAN_PATH, HUMAN_DEFAULT);
  await seedFile(BOOTLOADER_PATH, BOOTLOADER_DEFAULT);
  await seedFile(TASKS_PATH, JSON.stringify([], null, 2));

  // Migrate legacy single-file recent.json -> recent/private.json
  try {
    await fs.access(LEGACY_RECENT_PATH);
    const target = join(RECENT_DIR, 'private.json');
    try {
      await fs.access(target);
      // Target exists, keep target, leave legacy as backup
    } catch {
      const raw = await fs.readFile(LEGACY_RECENT_PATH, 'utf8');
      await fs.writeFile(target, raw, 'utf8');
      console.log('[zoe/memory] migrated legacy recent.json -> recent/private.json');
    }
  } catch {
    // legacy file not present, nothing to do
  }
}

async function seedFile(path: string, contents: string): Promise<void> {
  try {
    await fs.access(path);
  } catch {
    await fs.writeFile(path, contents, 'utf8');
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

function recentPathFor(scope: ChatScope): string {
  return join(RECENT_DIR, `${scope}.json`);
}

/**
 * Archive path for a chat, partitioned by month so files stay scannable.
 * ~/.zao/zoe/archive/<scope>/<yyyy-mm>.jsonl
 */
function archivePathFor(scope: ChatScope, when: Date): string {
  const month = when.toISOString().slice(0, 7); // yyyy-mm
  return join(ARCHIVE_DIR, String(scope), `${month}.jsonl`);
}

export interface RecentTurn {
  from: 'zaal' | 'zoe' | 'other';
  text: string;
  ts: string;
  sender?: string;
}

export async function readRecent(scope: ChatScope = 'private'): Promise<RecentTurn[]> {
  await ensureZoeHome();
  const path = recentPathFor(scope);
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Append-only conversation log. Never truncated - this is ZOE's long-term
 * memory of every turn, the source for soul exports and future retrieval.
 * The recent.json ring buffer (RECENT_MAX turns) is just the prompt window;
 * this archive is the permanent record.
 */
export async function appendArchive(turn: RecentTurn, scope: ChatScope = 'private'): Promise<void> {
  const path = archivePathFor(scope, new Date(turn.ts));
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.appendFile(path, JSON.stringify(turn) + '\n', 'utf8');
}

/**
 * Read archived turns for a chat. Without `month`, concatenates every month
 * file for the scope in chronological order.
 */
export async function readArchive(
  scope: ChatScope = 'private',
  month?: string,
): Promise<RecentTurn[]> {
  const dir = join(ARCHIVE_DIR, String(scope));
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.jsonl')).sort();
  } catch {
    return [];
  }
  if (month) files = files.filter((f) => f === `${month}.jsonl`);
  const turns: RecentTurn[] = [];
  for (const file of files) {
    const raw = await fs.readFile(join(dir, file), 'utf8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        turns.push(JSON.parse(line) as RecentTurn);
      } catch {
        // skip a corrupt line rather than fail the whole read
      }
    }
  }
  return turns;
}

export async function pushRecent(
  turn: { from: 'zaal' | 'zoe' | 'other'; text: string; sender?: string },
  scope: ChatScope = 'private',
): Promise<void> {
  await ensureZoeHome();
  const stamped: RecentTurn = { ...turn, ts: new Date().toISOString() };

  // Permanent append-only archive first - this must not be lost even if the
  // ring-buffer write below fails.
  await appendArchive(stamped, scope);

  // Ring buffer: last RECENT_MAX turns, the prompt window.
  const recent = await readRecent(scope);
  recent.push(stamped);
  while (recent.length > RECENT_MAX) recent.shift();
  await fs.writeFile(recentPathFor(scope), JSON.stringify(recent, null, 2), 'utf8');
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
 * Build the 4 memory blocks for a concierge turn, scoped to a chat.
 *
 * scope = 'private'        → DM with Zaal (legacy default)
 * scope = '<chat_id>'      → group/channel with Telegram chat id as string
 *
 * Block strings are kept short by design — no dumping full graph context.
 */
export async function buildMemoryBlocks(
  scope: ChatScope = 'private',
  chatTitle?: string,
): Promise<MemoryBlocks> {
  const [persona, human, recentTurns, tasks] = await Promise.all([
    readPersona(),
    readHuman(),
    readRecent(scope),
    readTasks(),
  ]);

  const working =
    recentTurns.length === 0
      ? '(no recent turns)'
      : recentTurns
          .map((t) => {
            const label = t.from === 'zaal' ? 'Zaal' : t.from === 'zoe' ? 'ZOE' : t.sender ?? 'Other';
            return `[${t.ts.slice(11, 16)}] ${label}: ${t.text.slice(0, 280)}`;
          })
          .join('\n');

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const tasksBlock =
    openTasks.length === 0
      ? '(no open tasks)'
      : openTasks
          .slice(0, 12)
          .map((t, i) => `${i + 1}. [${t.priority}] [${t.status}] ${t.title}\n   ${t.description.slice(0, 100)}`)
          .join('\n');

  return { persona, human, working, tasks: tasksBlock, chat_scope: scope, chat_title: chatTitle };
}

/**
 * Render memory blocks + user message into the prompt that goes to Claude CLI.
 */
export function renderConciergePrompt(blocks: MemoryBlocks, senderLabel: string, userMessage: string): string {
  const chatLine =
    blocks.chat_scope === 'private'
      ? 'Chat: DM with Zaal'
      : `Chat: group "${blocks.chat_title ?? blocks.chat_scope}" (id ${blocks.chat_scope})`;
  return [
    `<persona>\n${blocks.persona}\n</persona>`,
    `<human>\n${blocks.human}\n</human>`,
    `<working_memory>\n${chatLine}\n${blocks.working}\n</working_memory>`,
    `<tasks>\n${blocks.tasks}\n</tasks>`,
    ``,
    `${senderLabel}: ${userMessage}`,
  ].join('\n\n');
}

export const ZOE_PATHS = {
  home: ZOE_HOME,
  persona: PERSONA_PATH,
  human: HUMAN_PATH,
  recent_dir: RECENT_DIR,
  archive_dir: ARCHIVE_DIR,
  tasks: TASKS_PATH,
  bootloader: BOOTLOADER_PATH,
};
