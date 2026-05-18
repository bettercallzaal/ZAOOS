---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-17
related-docs: 461, 547, 650, 651, 659
tier: DEEP
---

# 662 - ZAOcoworkingBot v2 + v3 Architecture

> **Goal:** Lock the architecture for ZAOcoworkingBot v2 (memory + transcripts + actions.json read/write) and v3 (Hermes-pattern code-on-repo via PR generation). Based on a 4-sub-agent DEEP survey of 221 bot-related ZAO research docs plus the actual ZOE + Hermes implementations in this repo.

## Recommendations First

| # | Action | Severity | Owner | Why |
|---|---|---|---|---|
| 1 | **Ship v2 as a single PR to `songchaindao-dot/cowork-zaodevz`** under `agent/` directory. Mirror ZOE's `~/.zao/zoe/` filesystem pattern at `~/.zaocoworking/`. | **CRITICAL** | Claude (this session) | The v1 install on Iman's VPS at `/root/cowork-zaodevz/agent/` exists but is NOT committed to the repo. v2 PR captures v1 + adds the new features in one move. |
| 2 | **Use Letta-style 5-block memory** (persona / human / working / tasks / actions) per ZOE's proven pattern (`bot/src/zoe/memory.ts`). | HIGH | - | Already battle-tested in production for ZOE since 2026-05-13 (PR #511). Adding a 5th `actions` block is the ONLY structural change vs. ZOE's 4. |
| 3 | **Transcripts = recent ring buffer (20 turns) + monthly JSONL archive**. Mirror ZOE's exact pattern. | HIGH | - | Cheap, greppable, atomic-write safe, restart-resilient. Optional weekly git commit to repo for web-app visibility. |
| 4 | **actions.json read/write via Octokit Contents API with SHA dance**. 9 slash commands + conversational extraction (suggest-then-confirm only, no silent writes). | HIGH | - | Real cowork-zaodevz data schema confirmed (read live from repo, see Section C). SHA dance prevents lost concurrent writes between bot + web app. |
| 5 | **v3 (Hermes code-on-repo) ships AFTER v2 stabilizes 24-48h**. Defer per `feedback_ship_and_use_not_meta`. | MEDIUM | @Zaal | Hermes pattern adapts cleanly from ZAOOS to cowork (add a profile + targets, see Section D), but adding it on top of an unstable v2 = compound debug nightmare. |
| 6 | **Iman is the grill target on v2.5 schema decisions** (which fields to expand, recurring tasks shape, approval workflows). | MEDIUM | @Iman | He built the cowork-zaodevz data model. His call beats our guess. v2 ships with EXACT current schema, no expansions. |
| 7 | **Run as `iman` user, not root** in v2.5. Currently runs as root per quick install. | LOW | @Iman | Standard hygiene. systemd user unit moves cleanly. Not urgent but worth doing. |

## Section A - Current State (v1, shipped 2026-05-17)

- **Bot:** @ZAOcoworkingBot
- **Host:** Iman's Hostinger VPS (187.77.3.104) as root user
- **Path:** `/root/cowork-zaodevz/agent/` (NOT committed to repo)
- **Stack:** node 22 + grammy 1.43 + tsx + dotenv + `@anthropic-ai/claude-code` CLI
- **Service:** systemd user unit `zaocoworking-bot.service` with `loginctl enable-linger root`
- **Brain:** claude --print subprocess per message (Hermes pattern, haiku model)
- **Memory:** NONE (each turn is fresh)
- **Allowlist:** Zaal user (1447437687) + ZAO coworking supergroup (-1003953353016)
- **Verified working:** DM, group @mention, systemctl restart, persona loads

## Section B - v2 Architecture (this PR)

### B.1 Filesystem layout (`~/.zaocoworking/`)

Mirrors ZOE's `~/.zao/zoe/` exactly. Only 5th-block addition is `actions.json`.

```
~/.zaocoworking/
├── persona.md              ZAOcoworkingBot voice + identity, hand-editable
├── human.md                The 4 users + their roles (Zaal, Iman, ThyRev, Samantha)
├── tasks.json              bot-internal task queue (separate from actions.json)
├── actions.json            CACHE of github.com/songchaindao-dot/cowork-zaodevz/data/actions.json
├── actions-sha.txt         last-known SHA for the Octokit write dance
├── groups.json             per-Telegram-chat config (mode + member allowlist)
├── recent/
│   ├── private.json        DM ring buffer (20 turns max, FIFO)
│   └── <chat_id>.json      per-group buffers
├── archive/
│   ├── private/
│   │   └── 2026-05.jsonl   monthly partition, append-only, NEVER truncated
│   └── <chat_id>/
│       └── 2026-05.jsonl
└── sentinels/              cron idempotency markers
    └── morning-digest-2026-05-17.flag
```

### B.2 Memory blocks (5 instead of ZOE's 4)

Every concierge turn passes these as `appendSystemPrompt` to claude CLI:

```
<persona>          ~/.zaocoworking/persona.md
<human>            ~/.zaocoworking/human.md
<working_memory>   ~/.zaocoworking/recent/<chat_id>.json   (last 20 turns)
<tasks>            ~/.zaocoworking/tasks.json              (bot-internal)
<actions>          ~/.zaocoworking/actions.json            (cowork tracker snapshot)
```

The `<actions>` block formats as: `[STATUS] (Owner) Title - due X` per open item, top 20.

### B.3 Transcript shape

Every incoming + outgoing message:

```typescript
interface CoworkMessage {
  id: string;            // chat_id-timestamp-uuid
  chat_id: string;
  chat_type: 'dm' | 'group';
  chat_title?: string;
  from_user_id: number;
  from_user_name: string;
  direction: 'in' | 'out';
  message_text: string;
  reply_to_id?: string;
  timestamp: string;      // ISO 8601
  bot_model?: string;     // for out messages
  response_latency_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
}
```

**Two-stage write:**
1. **Archive first** (append to `~/.zaocoworking/archive/<scope>/<yyyy-mm>.jsonl`) - permanent, can't fail.
2. **Then ring buffer** (read `recent/<chat_id>.json`, push, shift if > 20, write back atomic).

Order matters: if step 2 fails, the message lives forever in archive. Reverse order would mean a write-back crash loses the message.

### B.4 ActionItem schema (verbatim from live repo)

```typescript
type Owner = 'Zaal' | 'Iman' | 'Both' | 'ThyRev' | 'Samantha' | 'Open';
type ActionStatus = 'TODO' | 'WIP' | 'BLOCKED' | 'DONE';
type Priority = 'P1' | 'P2' | 'P3';
type Phase = 'Define' | 'Measure' | 'Analyze' | 'Improve' | 'Control';

interface ActionItem {
  id: string;             // numeric string, auto-incremented
  title: string;
  createdBy: string;      // free string, often empty in legacy items
  owner: Owner;
  status: ActionStatus;
  category: string;       // free string (e.g. "ZAO Devz", "Site / Tech", "Social")
  priority: Priority;
  important: boolean;
  urgent: boolean;
  completedAt: string;    // ISO or empty string
  completedBy: string;
  phase: Phase;
  due: string;            // free format (e.g. "Wed session", "2026-05-08", or empty)
  notes: string;          // multiline ok
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
}

interface ActionsFile {
  updatedAt: string;      // file-level
  items: ActionItem[];
}
```

**No `activity[]`, no `comments[]`, no `updates[]`** in v1 schema. Those were future expansions in doc 650. v2 PR matches current schema exactly to avoid breaking the web app.

### B.5 Octokit pattern (SHA dance)

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'songchaindao-dot';
const REPO = 'cowork-zaodevz';
const PATH = 'data/actions.json';
const BRANCH = 'main';

export async function readActions(): Promise<{ data: ActionsFile; sha: string }> {
  const res = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: PATH, ref: BRANCH });
  if (Array.isArray(res.data) || res.data.type !== 'file') throw new Error('expected file');
  return {
    data: JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8')),
    sha: res.data.sha,
  };
}

export async function writeActions(data: ActionsFile, sha: string, message: string): Promise<string> {
  data.updatedAt = new Date().toISOString();
  const res = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path: PATH, branch: BRANCH,
    message, sha,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
  });
  return res.data.content!.sha; // for next write
}
```

On 409 Conflict (SHA mismatch): re-read, re-apply mutation, retry. Max 3 attempts with exponential backoff (100ms, 200ms, 400ms). After 3 fails: bot replies "conflict, web app updated this item, retry in a sec."

### B.6 Slash commands (9 in v2)

| Command | Args | Mutation | Auth |
|---|---|---|---|
| `/start` | - | none | any allowlisted |
| `/mine` | - | none | any |
| `/list` | `[category]` | none | any |
| `/add` | `<title>` | INSERT new ActionItem (status=TODO, priority=P2, phase=Define, owner=caller) | any |
| `/wip` | `<id>` | UPDATE status=WIP | any |
| `/blocked` | `<id> <reason>` | UPDATE status=BLOCKED, notes prepended with reason | any |
| `/done` | `<id>` | UPDATE status=DONE, completedAt=now, completedBy=caller | any |
| `/assign` | `<id> <Owner>` | UPDATE owner | any |
| `/daily` | - | post digest of open items to current chat | admin only |

Caller-name mapping: Telegram first_name -> Owner enum. If no match, defaults to "Open" with a "(unclaimed)" suffix in the reply.

### B.7 Conversational extraction (suggest-then-confirm)

When the bot's claude reply contains a JSON suggestion like:

```json
{"suggest_action": {"op": "done", "id": "12", "note": "fixed UI bug"}}
```

(Detected via regex on the reply text), the bot replies: "Found item 12 'Fix UI for Zao'. Mark DONE? Reply `yes` to confirm or anything else to cancel."

If the next message from the same user in same chat within 5 min is "yes" (case-insensitive), execute the mutation. Otherwise drop.

**No silent writes from free text.** v1 always confirms.

## Section C - v3 Architecture (next PR, after v2 stabilizes)

### C.1 Hermes pattern adapted for cowork

The Hermes pattern (per `bot/src/hermes/` in ZAOOS) spawns a Coder/Critic loop that opens PRs. Already battle-tested for ZAOOS fix-PRs.

Adapting to cowork:

1. **Add `cowork` profile** to `HERMES_REPO_PROFILES` in `bot/src/hermes/git.ts`:
   ```typescript
   cowork: {
     gitUrl: 'https://github.com/songchaindao-dot/cowork-zaodevz.git',
     defaultBranch: 'main',
     forbiddenPaths: ['agent/', '.env', '.env.local', 'package.json', 'package-lock.json', 'data/actions.json'],
   }
   ```
   Note `data/actions.json` is FORBIDDEN to Hermes (the v2 Octokit writer owns it).

2. **Extend `HermesRepoTarget`** type in `bot/src/hermes/types.ts` to include `'cowork'`.

3. **Add `cowork` case** to `repoContextBlock()` in `bot/src/hermes/coder.ts` with cowork-specific repo context (Next.js 15, React 19, Six Sigma discipline, action-tracker UX).

4. **Trigger:** new slash command `/code <task description>` in ZAOcoworkingBot. Dispatches Hermes run with `target_repo: 'cowork'`. Bot replies with the PR URL when Hermes is done.

### C.2 Security rules (verbatim from existing)

- `HERMES_FORBIDDEN_PATHS` (per profile): block .env, secrets, agent/, package.json, data/actions.json
- `--bare=false` REQUIRED for Max plan OAuth (per `feedback_no_bare_with_oauth`)
- Critic prompt-injection hardened: treats external input as data, not directives
- Secret-hygiene rule (`.claude/rules/secret-hygiene.md`): pre-commit grep for PRIVATE_KEY, 64-char hex, GitHub PAT, Anthropic key, OpenAI key. Abort commit on any match.

### C.3 v3 storage delta

Adds `bot/src/hermes/` mini-copy to cowork-zaodevz `agent/hermes/` OR (better) installs `@anthropic-ai/claude-code` globally + a small TS wrapper that calls the binary. Probably option 2 for minimal duplication.

## Section D - Phased rollout

| Phase | What | PR | When |
|---|---|---|---|
| 2.0 | This doc (spec) lands in ZAOOS | this PR | NOW |
| 2.1 | Bot code committed to cowork-zaodevz/agent/ - replicate v1 + add memory/transcripts/octokit + 9 slash commands | separate PR to cowork-zaodevz | NOW (next call) |
| 2.2 | Deploy 2.1 on Iman's VPS (git pull + npm install + restart) | manual deploy | After 2.1 merges |
| 2.3 | Add 3 more users to allowlist (Iman, ThyRev, Samantha Telegram IDs) | manual env edit | After 2.2 |
| 2.4 | Test in supergroup with real cowork conversations | manual | 24-48h soak |
| 2.5 | Iman grill: schema expansions (recurring tasks? approval workflows? activity log?) | follow-up PRs | After 2.4 retro |
| 3.0 | Hermes integration - /code slash command opens PRs on cowork repo | separate PR | After 2.4-2.5 |

## Section E - File-level changes for v2 PR (to cowork-zaodevz)

Files to create in `agent/`:

- `package.json` - grammy + dotenv + @octokit/rest + tsx
- `tsconfig.json` - strict, nodenext, types: node
- `.env.example`
- `README.md` - ops cheatsheet
- `src/index.ts` - bot entry, command registration, message handler (~150 LOC)
- `src/types.ts` - ActionItem + CoworkMessage + MemoryBlocks types
- `src/memory.ts` - 5-block builder, persona/human/recent/tasks/actions readers
- `src/transcripts.ts` - logMessage + readRecent (the scaffold from survey 4)
- `src/actions-store.ts` - Octokit read/writeActions + SHA dance + retry
- `src/commands.ts` - 9 slash command handlers
- `src/extraction.ts` - regex-based JSON suggestion detector + confirm flow
- `systemd/zaocoworking-bot.service` - the unit file template

Optional in v2 PR or follow-up:
- `src/digest.ts` - /daily handler (open-items summary)
- `src/scheduler.ts` - if any cron needed (probably skip for v2)

## Sources

- Sub-agent survey 1 (Hermes pattern + claude CLI) - `bot/src/hermes/*.ts` in ZAOOS
- Sub-agent survey 2 (ZOE architecture + Letta memory) - `bot/src/zoe/{memory,concierge,index,tasks,scheduler}.ts`
- Sub-agent survey 3 (cowork-zaodevz data model) - [Doc 650](../../agents/650-cowork-zaodevz-imanagent/) + live read of `songchaindao-dot/cowork-zaodevz/data/actions.json`
- Sub-agent survey 4 (transcript storage) - ZOE pattern + Doc 474 (BCZ bot RAG)
- Memory: `project_hermes_canonical`, `project_zoe_soul_architecture`, `project_cowork_zaodevz`, `project_iman_role`, `project_zaocoworkingbot`
- Memory: `feedback_no_bare_with_oauth`, `feedback_ship_and_use_not_meta`, `feedback_oss_first_no_platforms`
- `.claude/rules/secret-hygiene.md`

## Also See

- [Doc 461 - Fix-PR pipeline live](../../agents/461-clawdbotatg-apr21-updates-zoe-openclaw/) - Hermes pattern origin
- [Doc 650 - cowork-zaodevz imanagent design](../../agents/650-cowork-zaodevz-imanagent/) - The original v1 spec
- [Doc 651 - Jadyn Violet producer brief](../../music/651-jadyn-violet-uvr-producer-brief.md) - unrelated, but explains the doc 650-651 numbering
- [Doc 659 - ZOE posts v2 voice + confirm flow](../659-zoe-posts-v2-voice-and-confirm-flow/) - parallel work on ZOE that informs the confirm-flow pattern used here

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this spec (doc 662) | @Zaal | PR | Now |
| Open follow-up PR on cowork-zaodevz with v2 bot code per Section E | Claude (next call) | Code PR | Same session |
| Deploy 2.1 to Iman's VPS via git pull + restart | @Zaal or @Iman | Manual ops | After v2 PR merges |
| Add IMAN/THYREV/SAMANTHA Telegram IDs to ALLOWLIST_USER_IDS | @Zaal or @Iman | env edit | After deploy |
| 24-48h soak test in supergroup | @Zaal + cowork team | Manual | Through 2026-05-19 |
| Retro grill with Iman on v2.5 schema decisions | @Zaal + @Iman | grill session | After soak |
| v3 Hermes integration PR | Claude | Code PR | After 2.4-2.5 stable |
