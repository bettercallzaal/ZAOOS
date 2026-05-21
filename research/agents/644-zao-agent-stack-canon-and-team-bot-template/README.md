---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: ZAO agent stack canon and team bot template - reference for Hermes pattern, five surfaces, deployment model (reconstructed)
related-docs: 640, 642, 483, 547, 601
tier: DEEP
---

# 644 - ZAO Agent Stack Canon + Team Bot Template

Reference doc for builders. Locks the canonical agent pattern, the conversational-group-chat template both Magnetiq and AttaBotty bots will use, and the path to add future team bots.

**TL;DR:** All ZAO bots use Hermes pattern (Claude CLI subprocess) + Telegraf + per-bot persona files (human.md, agents.md, soul.md, heartbeat.md) + Telegram group allowlists. One template. Five operating surfaces. No new bots without research doc + Zaal approval.

---

## Locked Canon (Non-Negotiable)

### Agent Framework: Hermes + Claude Code CLI

ALL ZAO agents use the **Hermes pattern** from `bot/src/hermes/claude-cli.ts`:

- Spawn `claude` CLI as subprocess, not direct API calls
- Auth via Claude Code Max plan OAuth (~/.claude/auth.json), NOT `ANTHROPIC_API_KEY`
- System prompt injected per invocation via `--append-system-prompt`
- Tool restrictions via `--allowedTools` / `--disallowedTools`
- Parse JSON response via `--output-format json`
- Zero marginal cost, stable model quality (Sonnet/Opus), no billing surprises

**Why Hermes:** Max plan = shared auth infrastructure. No Anthropic API key sprawl. Stable for production. Past experiments (Composio AO, Agent Zero migration, ZOE v2) hit quality walls or complexity ceilings. Hermes is locked 2026-05-05, no reopening.

**Free local LLM:** Ollama on VPS :11434 (llama3.1:8b, 4.9GB) for low-stakes work only (entity classification, inbox routing). Wrapper: `bot/src/zoe/ollama.ts`. NOT for writing, brand outputs, research, or concierge replies.

### Five Operating Surfaces (Post-Doc-601 Collapse)

ZAO went from 12+ systems to 5. When proposing automation or bots, check this list first.

| Surface | Purpose | Users | Source | Model |
|---------|---------|-------|--------|-------|
| **ZOE** (@zaoclaw_bot) | Concierge: tasks, captures, brief/reflect, recall, research | Zaal + team | bot/src/zoe/ (Hermes-brain) | Sonnet/Opus |
| **Hermes** (@zoe_hermes_bot) | Autonomous fix-PR pipeline: coder + critic + auto-PR | DevOps | bot/src/hermes/ | Opus |
| **ZAO Devz** (@zaodevz_bot) | Group dispatch + hourly learning tip (Phase 3: fold into Hermes) | Engineers | bot/src/devz/ | Sonnet/Haiku |
| **Bonfire** (@zabal_bonfire) | Knowledge graph recall + multi-corpus ingest | Members | bonfires.ai (external) | Claude |
| **ZAOstock bot** (@ZAOstockTeamBot) | Festival team coordination (graduating to own repo) | Team | bot/ (root, separate) | Sonnet |

**Decommissioned — do NOT propose, build, restart:**
- openclaw container + 7-agent squad (ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER)
- Composio AO orchestrator
- ZOE v2 + Agent Zero migration plan
- 10-bot branded fleet (features fold into ZOE memory blocks instead)

**Rule:** No new bots without a numbered research doc + explicit Zaal approval in writing.

### Infrastructure

- **VPS only:** Hostinger KVM 2 at 31.97.148.88 (31GB RAM, 8 cores). NO second box.
- **Code deployment:** rsync from local to VPS, never git-clone on server (env vars stay local)
- **Service management:** systemd user units at `~/.config/systemd/user/<bot>.service`
- **Bot tokens + secrets:** `~/<bot-name>/.env` (chmod 600, never committed, never pushed)
- **Secrets hygiene:** apply all 5 guards from `secret-hygiene.md` on any agent commit

---

## Conversational-Group-Chat Bot Template

This is the standard for Magnetiq, AttaBotty, and any approved future team bot.

### File Layout

```
bot/src/<bot-name>/
├── human.md               # Persona, voice, values, what they care about
├── agents.md              # Capabilities matrix - tools, commands, model choice
├── soul.md                # Hard rules, mission, what they refuse, secret refusal
├── heartbeat.md           # Cadence rules - summarization, nag timing, silence windows
├── config.ts              # Telegraf setup, TG token, allowed group, allowed users, model
├── index.ts               # Main bot entry - Telegraf setup, message handler, classify -> route
├── commands/
│   ├── research.ts        # /research <topic> -> Claude-powered research (like /zao-research)
│   ├── idea.ts            # /idea <text> -> capture to Supabase ideas table
│   ├── context.ts         # /context -> dump what bot knows (let humans correct)
│   ├── task.ts            # /task <text> -> add to shared task list
│   └── workflow.ts        # /workflow <date> -> generate checklist (bot-specific)
├── memory/
│   ├── chat_history.jsonl # Rolling Supabase-backed chat log
│   └── facts.md           # Extracted team/project knowledge bot has learned
└── package.json           # (inherits from bot/ root, no duplicates)
```

### Message Flow (Sequence)

```
[Human posts to group]
        |
        v
Telegraf receives update
        |
        v
Check: @mention or /command?
        |
     /  \
    Y    N
   /      \
  v        v
Route to   Check allowlist:
command    - allowed group ID?
handler    - allowed user ID?
  |        |
  v        |  N
Execute    |  -> Ignore
  |        v  Y
  |      Extract text
  |        |
  |        v
  |      Classify intent
  |      (Ollama or rule-based)
  |        |
  |        v
  |      Match route:
  |      - greeting? respond
  |      - question? research
  |      - decision? synthesize
  |      - task? add to list
  |        |
  |        v
  |      Call Claude CLI
  |      (Hermes pattern)
  |        |
  |        v
  |      Generate reply
  |        |
  v        v
Save to   Send TG message
history   |
          v
          Log to Supabase
```

### Bot Persona Files (Locked Template)

#### human.md
```markdown
# <Bot Name> Persona

## Who You Are
[2-3 sentences: voice, role, what you stand for]

## What You Care About
- [Specific to the bot's purpose]
- [Specific to the users]
- [Specific to the domain]

## Tone
[Casual, formal, witty, supportive? One-liner.]

## Example Conversation Snippet
[Show a good interaction, not prescriptive but illustrative]
```

#### agents.md
```markdown
# <Bot Name> - Capabilities & Tools

## Model Choice
[Haiku for classify / Sonnet for synthesis / Opus for complex reasoning]

## Commands
| Command | What It Does | Example |
|---------|-------------|---------|
| /research | Find information | /research ZAO history |
| ... | ... | ... |

## Tools Available
- Allowed: [Bash, Read, Grep, etc.]
- Disallowed: [Write, Edit if not needed, etc.]

## Integration Points
- Reads from: [Supabase tables, files, external APIs]
- Writes to: [Supabase, Telegram, logs]
```

#### soul.md
```markdown
# <Bot Name> - Hard Rules & Refusals

## Mission
[One-liner: why this bot exists and what it achieves]

## What You Do
- [Specific, achievable commitment]
- [Specific, achievable commitment]

## What You REFUSE
- Never reveal secrets (tokens, keys, passwords) in group chat. If asked, respond: "I can't share secrets here. Refer to <owner>."
- Never take destructive actions (delete, broadcast) without user confirmation.
- Never fabricate team facts. If unsure, say: "I don't have that info. Ask <owner>."

## Approval Gates
Commands that need explicit confirmation:
- /broadcast <message> - always ask "Send to [group]? (yes/no)"
- /archive <data> - always ask "Archive [X] records? (yes/no)"
```

#### heartbeat.md
```markdown
# <Bot Name> - Cadence & Timing Rules

## Automatic Digests
- [None, or list specific times/cadences]

## When to Speak
- Only on /command or @mention (no auto-replies to all messages)
- Read all messages for context (passive listening)
- React (emoji) to noteworthy messages if natural

## When to Stay Silent
- Group chatter, off-topic banter (unless @mentioned)
- During specific hours: [list if applicable, e.g., 9pm-6am EST]

## Summarization Rules
- After N messages or X hours, offer: "/context to dump what I know"
- Don't summarize unless asked or weekly digest scheduled
```

#### config.ts
```typescript
// Example: Magnetiq bot

export const MAGNETIQ_BOT_CONFIG = {
  telegramToken: process.env.MAGNETIQ_BOT_TOKEN!,
  allowedGroupId: -1001234567890,  // Zaal + Tyler private group
  allowedUserIds: [123456789, 987654321], // Zaal, Tyler Telegram IDs
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  model: 'claude-opus', // or 'claude-sonnet' for lower cost
  ollamaUrl: 'http://31.97.148.88:11434', // for classify only
  systemPrompt: `You are Magnetiq Bot, a research assistant helping Zaal and Tyler spec the ZAO-Magnetiq integration...`,
};
```

#### index.ts
```typescript
// Sketch
import { Bot, Context } from 'grammy';
import { callClaudeCli } from '../hermes/claude-cli';

const bot = new Bot(config.telegramToken);

bot.on('message', async (ctx) => {
  // Check allowlist
  if (!isAllowed(ctx.from?.id, ctx.chat.id)) {
    return; // Ignore
  }

  // Extract text, check for /command or @mention
  const text = ctx.message?.text || '';
  
  if (text.startsWith('/')) {
    await handleCommand(ctx, text);
  } else if (text.includes('@magnetiq_bot') || text.includes('@magnetiq_bot')) {
    const result = await callClaudeCli({
      model: config.model,
      prompt: text,
      cwd: process.cwd(),
      appendSystemPrompt: config.systemPrompt,
      allowedTools: ['Read', 'Bash', 'Grep'],
    });
    await ctx.reply(result.text);
  }

  // Log to Supabase
  await logMessage(ctx);
});
```

---

## Magnetiq Bot Spec (Doc 640 Extracted)

| Aspect | Details |
|--------|---------|
| **Name** | ZAO MAGNETIQ (or @zaom bot) |
| **Users** | Zaal + Tyler (private TG chat) |
| **Purpose** | Dual-user research assistant for ZAO-Magnetiq integration spec |
| **Context** | Tyler will send Magnetiq data + API docs via Telegram |
| **Folder** | `bot/src/magnetiq/` |
| **Model** | Sonnet (fast, good enough for research synthesis) |
| **Cadence** | No auto-digests; responds on /command + @mention |
| **Key Commands** | /research <topic>, /context, /idea <note> |
| **Deployment** | VPS 1, systemd service, `~/magnetiq-bot/.env` |

---

## AttaBotty Bot Spec (Doc 642 Extracted)

| Aspect | Details |
|--------|---------|
| **Name** | Z + AttaBotty (or @zab_live bot) |
| **Users** | Zaal + AttaBotty (private TG chat) |
| **Purpose** | Stream production assistant, research, task tracking, VOD review |
| **Context** | NotebookLM transcripts, stream SOPs, playbook (Doc 642) |
| **Folder** | `bot/src/attabotty/` |
| **Model** | Sonnet (but use Opus for /stream-review if budget allows) |
| **Key Commands** | /research, /stream-review <url>, /workflow <date>, /task, /context |
| **Deployment** | VPS 1, systemd service, `~/attabotty-bot/.env` |
| **Knowledge Load** | This playbook + NotebookLM transcripts + stream metadata |

---

## Hard Requirements (Non-Negotiable)

1. **Allowlists:** Every bot has a hardcoded allowlist of group IDs + user IDs. Ignore messages outside.
2. **Command gating:** Admin commands (/broadcast, /link, /archive) only to Zaal's Telegram ID.
3. **Secrets refusal:** soul.md includes "never reveal secrets in group chat" + always refer to owner.
4. **Confirmation gates:** Any destructive action (delete, broadcast, post) requires explicit yes/no.
5. **Passive listening:** Bot reads all messages for context but only speaks on /command or @mention.
6. **No hallucination on facts:** If bot doesn't know a team fact, say so and refer to owner.
7. **Supabase tables per bot:** chat_history, ideas, tasks live in bot-specific tables (magnetiq_*, attabotty_*, etc.)
8. **Logging:** Every action logged to Supabase (who, what, when). Audit trail is non-negotiable.

---

## How to Add a 3rd Team Bot (7-Step Playbook)

### 1. Write a research doc
Create `research/agents/64X-<name>-telegram-bot/README.md`. Include:
- Who the users are (Zaal + whom?)
- What problem it solves
- Commands needed
- Knowledge base sources (docs, transcripts, links)
- Deployment target (VPS 1)

### 2. Get Zaal's approval
Share doc with Zaal. Wait for explicit "yes, build this." Unblock only then.

### 3. Create the folder
```bash
mkdir -p bot/src/<name>
touch bot/src/<name>/{human.md,agents.md,soul.md,heartbeat.md,config.ts,index.ts}
mkdir -p bot/src/<name>/{commands,memory}
```

### 4. Fill persona files
- **human.md:** Who is this bot? What's the voice?
- **agents.md:** What commands? What model? What tools?
- **soul.md:** Hard rules. What won't you do?
- **heartbeat.md:** When to speak? When to stay silent?

### 5. Copy Hermes pattern in index.ts
Start with `bot/src/hermes/claude-cli.ts` as import. Use the sequence diagram above to structure message handler. Apply allowlist logic.

### 6. Add systemd service
```bash
cat > ~/.config/systemd/user/<name>-bot.service <<EOF
[Unit]
Description=<Name> Telegram Bot
After=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/node /home/zaal/<name>-bot/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable <name>-bot
systemctl --user start <name>-bot
```

### 7. Test + deploy
```bash
# Local test (if possible)
npm run dev

# Push to VPS
rsync -av --delete --exclude=node_modules --exclude=.env bot/src/<name>/ zaal@31.97.148.88:~/<name>-bot/

# Verify on VPS
ssh zaal@31.97.148.88 'systemctl --user status <name>-bot && journalctl --user -u <name>-bot -n 10'
```

---

## Provisioning: Shared Environment Script

Extend `bot/scripts/sync-supabase-env.sh` to parameterize per-bot env vars:

```bash
#!/bin/bash
# Usage: ./sync-supabase-env.sh <bot-name> (e.g., magnetiq, attabotty)

BOT_NAME=${1:-zaostock}
ENV_FILE="$HOME/${BOT_NAME}-bot/.env"

# Pull from Supabase dashboard or .env.local
echo "SUPABASE_URL=..." >> "$ENV_FILE"
echo "SUPABASE_SERVICE_ROLE_KEY=..." >> "$ENV_FILE"
echo "${BOT_NAME^^}_BOT_TOKEN=..." >> "$ENV_FILE"

chmod 600 "$ENV_FILE"
systemctl --user restart "${BOT_NAME}-bot"
```

---

## Comparison Table: 5 Surfaces

| Aspect | ZOE | Hermes | Magnetiq Bot | AttaBotty Bot | ZAOstock |
|--------|-----|--------|--------------|---------------|----------|
| **Purpose** | Concierge: tasks, research, brief/reflect | Autonomous PR fixer | Research assistant (Tyler collab) | Stream + music research | Festival team ops |
| **Users** | Zaal + team | DevOps team | Zaal + Tyler | Zaal + AttaBotty | ZAOstock crew |
| **Primary Channel** | TG group + Matrix | TG group | TG private | TG private | TG group |
| **Commands** | /task, /capture, /research, /brief, /reflect | /fix-pr, /review, /merge | /research, /idea, /context | /research, /stream-review, /workflow, /task | /status, /mytodos, /gemba, /note |
| **Model** | Sonnet (fast) | Opus (quality critical) | Sonnet | Sonnet/Opus | Sonnet |
| **Brain** | Letta-style memory blocks (persistent disk) | Claude CLI + git state | Claude CLI + chat history | Claude CLI + NotebookLM | Supabase tables |
| **Deployed** | VPS 1 | VPS 1 | VPS 1 (this week) | VPS 1 (this week) | VPS 1 (live) |
| **Folder** | bot/src/zoe/ | bot/src/hermes/ | bot/src/magnetiq/ | bot/src/attabotty/ | bot/ (root) |

---

## Unresolved Questions for Zaal

These three questions must be answered before Magnetiq and AttaBotty bots ship:

### 1. MAGNETIQ BOT: Should the bot auto-summarize chat after N messages?

Tyler will send long context docs + API specs. The bot will read all of it for context, but should it:
- *Option A:* Summarize automatically every 50 messages or after 1 hour of inactivity?
- *Option B:* Only summarize when asked via /context?
- *Option C:* Smart mode - summarize if it detects a new topic/conversation shift?

Decision affects: heartbeat.md cadence rules + memory table schema.

### 2. ATTABOTTY BOT: Where should the bot store VOD review notes + clip suggestions?

After /stream-review <youtube-url>, the bot will ingest the VOD transcript and suggest timestamps for short clips. Should these be:
- *Option A:* Stored in a Supabase table (queryable, exportable, audit trail)?
- *Option B:* Logged to a shared Google Doc (shareable with AttaBotty collaborators, Gdrive native)?
- *Option C:* Both (Supabase for bot data, Google Doc export for human consumption)?

Decision affects: data schema + commands/stream-review.ts implementation.

### 3. FUTURE BOTS: Should there be a shared "team bot registry"?

As bots multiply, should there be a single source of truth (API, Supabase table, or docs file) that lists:
- All active bots + their group IDs
- All allowed users per bot
- Health status + last ping time
- Commands available

This would let a human or bot quickly see "what bots are running?" without SSH. Should we build this now (before bot 3) or wait until bot 5+?

Decision affects: VPS monitoring, /admin dashboard, and bot discovery patterns.

---

## Sources

- Doc 640: Magnetiq vibes-to-data pivot + bot spec (Tyler call 2026-05-11)
- Doc 642: AttaBotty livestream playbook + bot spec (William call 2026-05-11)
- Doc 483: Hermes agent framework (local LLM + Claude CLI)
- Doc 547: Multi-agent coordination (ZOE/Hermes/Bonfire surfaces)
- Doc 601: Agent stack cleanup decision (5 surfaces decision)
- Memory: project_hermes_canonical (locked 2026-05-05)
- Memory: project_zaostock_bot_live (VPS deployment pattern)
- Code: bot/src/hermes/claude-cli.ts (Hermes subprocess pattern)
- Code: bot/ (ZAOstock bot as template for file layout)

---

**Last updated:** 2026-05-11
**Status:** Ready for build (waiting on Zaal's answers to 3 questions above)
