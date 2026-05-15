---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-15
related-docs: 467, 487, 495, 644, 645, 646, 647, 648, 649
tier: STANDARD
---

# 650 — cowork-zaodevz: the imanagent + a from-scratch VPS build Iman can follow

> **Goal:** Audit what's already in `songchaindao-dot/cowork-zaodevz` (it's mature — most of the agent is already specified). Design the imanagent as Iman's first ground-up Telegram bot on a fresh VPS. Write the walkthrough Zaal runs through with Iman.

## Locked decisions (2026-05-15)

- **Standalone, not folded under ZAO/ZAO Festivals.** cowork-zaodevz stays under `songchaindao-dot`. It's its own thing.
- **Iman owns it operationally.** He drives the agent build, deploys it, runs the VPS, and is the day-to-day maintainer. Zaal is co-lead on the data but Iman is the primary builder/operator.
- **Universal action tracker — every brand, every todo.** Not just "the 4 cowork users' personal todos." This is THE board where work across every ZAO-adjacent brand lives: COC Concertz (Thy Revolution), WaveWarZ (Samantha, plus Zambia ops), Magnetiq, Attabotty, ZAOstock, BCZ Strategies, ZAO Devz. One place. One audit log.
- **Categories likely need to expand** to cover the full brand surface (see "Category expansion needed" below). Iman + Zaal decide the final list before the agent build, so the bot's `/list <category>` filter matches reality.

## Key Decisions (act on these)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Use cowork-zaodevz as the single source of truth for todos across Zaal + Iman + ThyRev + candytoybox.** Repo is already substantial: 4-user-aware in env + types (one tweak needed for candytoybox), DMAIC + Kanban structure, GitHub-Contents-API audit log. | Repo is real and shippable today; the brief Zaal described IS what's already built. |
| 2 | **Add candytoybox / Samantha as a 4th user.** Currently 3: Zaal + Iman + ThyRev. Env + Owner enum + auth need a one-line each. | Zaal's stated workspace = 4 people. |
| 3 | **imanagent v1 = Telegram bot on a fresh VPS, slash-command-driven, GitHub Contents API as backend** (skip Supabase / dedicated Bot API for v1). | BACKLOG Phase 4 lists 3 prereqs (Supabase + Bot API + agent); for Iman's first build, drop the prereqs and use the same GitHub backend the web app uses today. Storage swaps to Supabase later without changing bot logic — same pattern as the web app's `data.ts`. |
| 4 | **The agent inherits ZOE's lineage** (voice, anti-patterns, format rules) per the elder/lineage pattern from [doc 648](../648-ryan-kagy-zao-civilization-sync/). | Voice consistency across the bot fleet. Iman doesn't define a new voice. |
| 5 | **No Claude CLI in v1.** Slash commands are deterministic + cheap. Free-text NL goes to a Claude turn in v2. | Iman learns the bot pipeline without the complexity + cost of an LLM subprocess. |
| 6 | **Fresh VPS, not VPS 1.** Per Zaal: a new box, taught from scratch. Provider-agnostic; this doc uses Hostinger commands but any Ubuntu 24+ VPS works identically after SSH is in. | Iman owns the box, learns sysadmin basics, doesn't risk VPS 1. |

## What's already in `cowork-zaodevz` (read this first)

The repo is **not empty** and **not a fresh app to design** — it's a working Next.js app with a clear roadmap. Key facts from `gh api` reads (verified 2026-05-15):

| Surface | Status |
|---------|--------|
| App | Next.js 15 App Router + React 19 + TS + Tailwind v3. Created 2026-05-07, last push 2026-05-15. |
| Auth | HMAC-signed cookie, one password per user. `ZAAL_PASSWORD`, `IMAN_PASSWORD`, `THYREV_PASSWORD` already wired in `.env.example`. |
| Backend | `data/actions.json` persisted via GitHub Contents API — every save is a commit; git history = audit log. |
| Data model | `ActionItem` with `status` (TODO/WIP/BLOCKED/DONE), `priority` (P1/P2/P3), `phase` (DMAIC), `category` (14 options), `owner` enum (Zaal/Iman/Both/ThyRev/Open), `taskType` (task/work_order/incident/approval_request/goal/maintenance), `important` + `urgent` flags, `comments[]`, `updates[]`, `activity[]`. See `src/lib/types.ts`. |
| Existing AI | `MINIMAX_API_KEY` env slot + `@anthropic-ai/sdk` dependency. `src/components/TodoPanel.tsx` (27KB) is likely an in-app todo-parsing assistant. **Separate** from the Telegram imanagent. |
| Supabase prep | `supabase/schema.sql` (12KB) already drafted. `@supabase/supabase-js` in deps. Not yet wired — Phase 2. |
| Roadmap | `BACKLOG.md` lays out Phase 2 (Supabase) → Phase 3 (Bot API) → Phase 4 (Hermes imanagent on VPS) → Phase 5 (Six Sigma metrics). |
| Process docs | `SIX-SIGMA.md` — DMAIC, 5S, TIMWOODS, weekly review. The discipline that keeps the tracker honest. |

**Currently `data/actions.json` has 3 example items** (item 1 done by iman, item 2 done by iman, item 3 TODO/Both). Real data is flowing.

## Category expansion needed

The repo currently has 14 categories (see `src/lib/types.ts`):
> ZAO Devz, Site / Tech, Ops, Bounty, Other, WaveWarZ Zambia, Recording, Distribution, Release, Artist Onboarding, Social, Brand, Content, Campaigns

Per the "universal action tracker" decision, **add the missing brand categories** before the agent build so `/list <category>` returns sensible results from day one. Candidate additions Zaal + Iman should agree on:

- **COC Concertz** — Thy Revolution's brand
- **Magnetiq** — the brand bot project
- **Attabotty** — the brand bot project
- **ZAOstock** — the Oct 3 festival (currently lives in ZAO OS repo; may graduate here)
- **BCZ Strategies** — Zaal's agency work (clients like Riverside)
- **The ZAO** (catch-all for org-level work that isn't Devz / WaveWarZ / a specific brand)

Same single PR as the "add Samantha" change — edit `Owner` + `Category` together, ship once.

## What changes for 4-user cowork mode

These are the only modifications needed BEFORE the agent build to add candytoybox/Samantha:

1. **`.env.example`** — add `SAMANTHA_PASSWORD=changeme-samantha`
2. **`src/lib/types.ts`** — extend the `Owner` union:
   ```typescript
   export type Owner = "Zaal" | "Iman" | "Both" | "ThyRev" | "Samantha" | "Open";
   export const OWNERS: Owner[] = ["Zaal", "Iman", "ThyRev", "Samantha", "Open"];
   ```
3. **`src/lib/auth.ts`** — add `SAMANTHA_PASSWORD` to the password map (mirror existing pattern).
4. **Vercel env** — add `SAMANTHA_PASSWORD` value.

Single small PR. Ship it BEFORE the agent build so candytoybox shows up in the owner picker and can log in.

## The imanagent — design (v1)

### What it is

A Telegram bot named `@cowork_zaodevz_bot` (or similar) running on Iman's fresh VPS. Slash-command-driven. Reads/writes `data/actions.json` via the same GitHub Contents API the web app uses. No LLM in v1.

### Persona inheritance (per [doc 648](../648-ryan-kagy-zao-civilization-sync/) elder pattern)

The bot's persona file (`~/.cowork-agent/persona.md` on Iman's VPS) inherits ZOE's voice + anti-patterns + format rules verbatim. Override ONLY the identity + domain + tools sections. Use the bootloader template at `~/.zao/zoe/bootloader-template.md` on Zaal's VPS as the seed.

Identity (override): "imanagent — the cowork-zaodevz Telegram bot. Talks to Zaal, Iman, ThyRev, Samantha. Manages the shared todo board."
Domain (override): "Read + write `data/actions.json` in the cowork-zaodevz repo via GitHub Contents API. Surface today's open items, take new todos, mark done, log activity. No outside-of-repo work."
Tools (override): "GitHub Contents API only. No Claude CLI, no shell access, no other repos. v2 may add Claude CLI for natural-language todo parsing."

### Slash commands (v1)

| Command | Who | What it does |
|---------|-----|--------------|
| `/start` | anyone allowlisted | "imanagent online. Try /mine /list /add" |
| `/mine` | anyone allowlisted | list the caller's open items (TODO + WIP), sorted by priority then age |
| `/list` | anyone allowlisted | list ALL open items grouped by owner |
| `/list <category>` | anyone allowlisted | filter by category (e.g. `/list WaveWarZ Zambia`) |
| `/add <title>` | anyone allowlisted | creates a new item, defaults: owner = caller, status = TODO, priority = P2, category = Other, phase = Define |
| `/done <id>` | anyone allowlisted | marks item id as DONE; sets `completedAt` + `completedBy` |
| `/wip <id>` | anyone allowlisted | moves item to WIP |
| `/blocked <id> <reason>` | anyone allowlisted | moves item to BLOCKED with a note |
| `/assign <id> <Zaal\|Iman\|ThyRev\|Samantha\|Both>` | anyone allowlisted | changes owner |
| `/daily` | Zaal only (admin) | force-runs the daily summary (the 9am cron sends one automatically) |

Allowlist: a JSON file on the VPS at `~/.cowork-agent/users.json` mapping Telegram user IDs → display names. Same shape as ZOE's `groups.json` allowlist.

### Daily summary cron (9am UTC)

A node-cron job inside the bot process posts to a configured Telegram chat (group or DM): open items per owner + count of blockers + items completed in the last 24h. Use the existing imanprojects audit data (every save = a commit, every commit ≈ an activity event).

### Storage layer — the future-proof shape

`src/storage.ts` in the agent has two functions:
```typescript
export async function readActions(): Promise<{ items: ActionItem[]; sha: string }>;
export async function saveActions(items: ActionItem[], commitMessage: string): Promise<void>;
```

v1 implementation: hits `https://api.github.com/repos/songchaindao-dot/cowork-zaodevz/contents/data/actions.json` with a fine-grained PAT. **Same function signatures stay** when Phase 2 swaps to Supabase — the bot doesn't change, only the storage module's body changes. Mirrors the web app's `src/lib/data.ts` pattern.

### What v1 is NOT (YAGNI)

- **No LLM** in v1. No `@anthropic-ai/sdk`, no Claude CLI subprocess. Pure deterministic command parsing.
- **No Supabase** in v1. Backend = GitHub Contents API (same as the web app today).
- **No Bot API server** (BACKLOG Phase 3). The bot writes directly to GitHub.
- **No web-side integration** with the agent — they share the same data file via GitHub, that's it.
- **No natural-language todo parsing.** "Drop coffee with Roddy on the list" → user has to type `/add coffee with Roddy`. v2 adds NL parsing via Claude CLI.

### Stack (mirrors the existing Hermes pattern from ZOE)

- **Runtime:** Node 22 + TypeScript via `tsx` (no build step — match the ZOE bot/src pattern)
- **Telegram client:** `grammy` (same as ZOE)
- **GitHub client:** `@octokit/rest` (well-known, typed)
- **Cron:** `node-cron` (same as ZOE scheduler)
- **No Anthropic / OpenAI / Minimax dep in v1**

Why this stack: Iman learns the same pattern Zaal already uses for ZOE. Familiar to anyone reading the ZAO OS repo. Zero new concepts.

## From-scratch VPS build — the Iman walkthrough

This is the part Zaal runs through with Iman in person or on a call. **Linear, copy-paste-friendly.** Each step is something Iman does on his own machine and his new VPS. Provider used here = Hostinger (matches Zaal's VPS 1); the exact same commands work on DigitalOcean / Hetzner / Linode after SSH is in.

### Step 0: What Iman needs before starting

- A GitHub account with access to `songchaindao-dot/cowork-zaodevz` (Zaal adds him as a collaborator)
- A Telegram account on his phone
- A laptop with a terminal (Mac terminal, iTerm, or WSL on Windows)
- ~$5/mo for a small VPS

### Step 1: Provision the VPS

1. Sign up at hostinger.com → VPS Hosting → KVM 1 (1 vCPU, 4GB RAM, $5-6/mo is plenty for one agent).
2. Choose **Ubuntu 24.04 LTS** as the OS.
3. Choose a strong root password and write it down once (he'll disable root login after Step 2).
4. Note the IPv4 address Hostinger assigns. He'll use it everywhere as `<VPS_IP>`.

### Step 2: SSH access from Iman's laptop

On his laptop:
```bash
# 1. Generate an SSH key if he doesn't have one
ls ~/.ssh/id_ed25519.pub 2>/dev/null || ssh-keygen -t ed25519 -C "iman@cowork-agent" -f ~/.ssh/id_ed25519 -N ""

# 2. Copy his public key to the VPS (uses root pass once, the last time)
ssh-copy-id root@<VPS_IP>

# 3. Confirm key login works
ssh root@<VPS_IP> "echo connected"
```

### Step 3: Create a non-root user + harden SSH

Still on his laptop, SSH'd in as root:
```bash
ssh root@<VPS_IP>

# Inside the VPS:
adduser iman   # set a password he remembers
usermod -aG sudo iman
mkdir -p /home/iman/.ssh
cp /root/.ssh/authorized_keys /home/iman/.ssh/
chown -R iman:iman /home/iman/.ssh
chmod 600 /home/iman/.ssh/authorized_keys

# Disable root SSH (optional but recommended)
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
exit
```

Now from his laptop:
```bash
ssh iman@<VPS_IP>   # should land him in /home/iman without a password prompt
```

### Step 4: Install the base toolchain

Inside the VPS as user `iman`:
```bash
# Install node 22 (via nodesource)
sudo apt update
sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version    # expect v22.x
npm --version

# Install tsx globally so we can run TypeScript directly
sudo npm install -g tsx
```

### Step 5: Clone the cowork-zaodevz repo

```bash
cd ~
git config --global user.name "Iman"
git config --global user.email "iman@<his-email>"
git clone https://github.com/songchaindao-dot/cowork-zaodevz.git
cd cowork-zaodevz
```

This is the SAME repo the web app deploys from. The agent will live in a new directory inside it (`agent/`) so the web app, the agent, and the data file all sit in one place — no syncing between two repos.

### Step 6: Create the Telegram bot via @BotFather

On his phone (or the Telegram web app):
1. DM `@BotFather`.
2. `/newbot` → pick a name like "Cowork ZAO Devz Bot" and a username ending in `bot` (e.g. `cowork_zaodevz_bot`).
3. BotFather sends back a token like `123456:ABC-DEF...`. **This is a secret** — don't paste it anywhere public.
4. `/setprivacy` → choose Disable. (Lets the bot read all group messages later if needed; v1 only needs DMs but disabling is the standard ZAO pattern.)
5. `/setcommands` → paste:
   ```
   mine - my open items
   list - all open items
   add - add a new item
   done - mark an item DONE
   wip - move item to WIP
   blocked - move item to BLOCKED
   assign - reassign an item
   start - show the help
   ```

### Step 7: Make a GitHub fine-grained Personal Access Token

The bot writes to `data/actions.json` via the GitHub API — it needs a token.

1. https://github.com/settings/tokens?type=beta → "Generate new token"
2. Name it `cowork-zaodevz imanagent`.
3. Resource owner: `songchaindao-dot`.
4. Repository access: "Only select repositories" → pick `cowork-zaodevz`.
5. Permissions → Repository permissions → **Contents: Read and write**.
6. Generate token. Copy it once — GitHub won't show it again.

### Step 8: Get every Telegram user's `user_id`

The bot allowlists by Telegram numeric user ID, not username (usernames can change). To find each person's ID:

```
DM @userinfobot on Telegram
```

It replies with the user's numeric ID. Get all 4: Zaal, Iman, ThyRev, Samantha. Save them.

### Step 9: Write the agent — the smallest viable version

In the VPS, inside `~/cowork-zaodevz`:
```bash
mkdir -p agent/src
cd agent
npm init -y
npm install grammy @octokit/rest node-cron
npm install -D @types/node @types/node-cron typescript tsx
```

Create `agent/.env`:
```bash
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=<paste-the-botfather-token>
GITHUB_TOKEN=<paste-the-fine-grained-pat>
GITHUB_REPO=songchaindao-dot/cowork-zaodevz
GITHUB_BRANCH=main
ALLOWLIST_USER_IDS=<zaal_id>,<iman_id>,<thyrev_id>,<samantha_id>
USER_NAMES=<zaal_id>:Zaal,<iman_id>:Iman,<thyrev_id>:ThyRev,<samantha_id>:Samantha
ADMIN_USER_IDS=<zaal_id>
DAILY_DIGEST_CHAT_ID=<the-chat-id-where-9am-digest-posts>
EOF
chmod 600 .env
```

Create `agent/src/storage.ts`:
```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = (process.env.GITHUB_REPO ?? '').split('/');
const branch = process.env.GITHUB_BRANCH ?? 'main';

export interface ActionItem {
  id: string;
  title: string;
  createdBy: string;
  owner: string;
  status: 'TODO' | 'WIP' | 'BLOCKED' | 'DONE';
  category: string;
  priority: 'P1' | 'P2' | 'P3';
  important: boolean;
  urgent: boolean;
  completedAt: string;
  completedBy: string;
  phase: string;
  due: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface FileResponse { items: ActionItem[]; updatedAt: string }

export async function readActions(): Promise<{ data: FileResponse; sha: string }> {
  const res = await octokit.repos.getContent({ owner, repo, path: 'data/actions.json', ref: branch });
  if (Array.isArray(res.data) || res.data.type !== 'file') throw new Error('actions.json missing');
  const content = Buffer.from(res.data.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: res.data.sha };
}

export async function saveActions(data: FileResponse, sha: string, message: string): Promise<void> {
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, branch,
    path: 'data/actions.json',
    message,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    sha,
  });
}
```

Create `agent/src/index.ts`:
```typescript
import 'dotenv/config';
import { Bot, Context } from 'grammy';
import { readActions, saveActions, type ActionItem } from './storage.js';

const ALLOWLIST = new Set((process.env.ALLOWLIST_USER_IDS ?? '').split(',').map((s) => Number(s.trim())));
const ADMINS = new Set((process.env.ADMIN_USER_IDS ?? '').split(',').map((s) => Number(s.trim())));
const NAMES = new Map(
  (process.env.USER_NAMES ?? '').split(',').map((p) => {
    const [id, name] = p.split(':');
    return [Number(id), name];
  }),
);

function nameFor(id: number): string {
  return NAMES.get(id) ?? `user:${id}`;
}

function allowed(ctx: Context): boolean {
  const id = ctx.from?.id;
  return id !== undefined && ALLOWLIST.has(id);
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command('start', async (ctx) => {
  if (!allowed(ctx)) return;
  await ctx.reply('imanagent online. Try /mine /list /add <title> /done <id>');
});

bot.command('mine', async (ctx) => {
  if (!allowed(ctx)) return;
  const me = nameFor(ctx.from!.id);
  const { data } = await readActions();
  const mine = data.items.filter(
    (i) => (i.owner === me || i.owner === 'Both') && i.status !== 'DONE',
  );
  if (mine.length === 0) { await ctx.reply(`${me}: no open items.`); return; }
  const lines = mine
    .sort((a, b) => a.priority.localeCompare(b.priority))
    .map((i) => `[${i.priority}] [${i.status}] (${i.id}) ${i.title}`);
  await ctx.reply(`Open for ${me} (${mine.length}):\n${lines.join('\n')}`);
});

bot.command('list', async (ctx) => {
  if (!allowed(ctx)) return;
  const filter = ctx.match?.toString().trim();
  const { data } = await readActions();
  let items = data.items.filter((i) => i.status !== 'DONE');
  if (filter) items = items.filter((i) => i.category.toLowerCase().includes(filter.toLowerCase()));
  if (items.length === 0) { await ctx.reply('No open items.'); return; }
  const byOwner: Record<string, string[]> = {};
  for (const i of items) {
    const o = i.owner || 'Open';
    byOwner[o] = byOwner[o] ?? [];
    byOwner[o].push(`  [${i.priority}] [${i.status}] (${i.id}) ${i.title}`);
  }
  const lines = Object.entries(byOwner).map(([o, list]) => `${o}:\n${list.join('\n')}`);
  await ctx.reply(lines.join('\n\n'));
});

bot.command('add', async (ctx) => {
  if (!allowed(ctx)) return;
  const title = ctx.match?.toString().trim();
  if (!title) { await ctx.reply('Usage: /add <title>'); return; }
  const me = nameFor(ctx.from!.id);
  const { data, sha } = await readActions();
  const newId = String(data.items.length > 0 ? Math.max(...data.items.map((i) => Number(i.id) || 0)) + 1 : 1);
  const now = new Date().toISOString();
  const item: ActionItem = {
    id: newId, title,
    createdBy: me, owner: me,
    status: 'TODO', category: 'Other', priority: 'P2',
    important: false, urgent: false,
    completedAt: '', completedBy: '',
    phase: 'Define', due: '', notes: '',
    createdAt: now, updatedAt: now,
  };
  data.items.push(item);
  data.updatedAt = now;
  await saveActions(data, sha, `bot: add "${title.slice(0, 60)}" via ${me}`);
  await ctx.reply(`Added (${newId}) "${title}" -> ${me}.`);
});

bot.command('done', async (ctx) => {
  if (!allowed(ctx)) return;
  const id = ctx.match?.toString().trim();
  if (!id) { await ctx.reply('Usage: /done <id>'); return; }
  const me = nameFor(ctx.from!.id);
  const { data, sha } = await readActions();
  const item = data.items.find((i) => i.id === id);
  if (!item) { await ctx.reply(`No item with id ${id}.`); return; }
  const now = new Date().toISOString();
  item.status = 'DONE';
  item.completedAt = now;
  item.completedBy = me;
  item.updatedAt = now;
  data.updatedAt = now;
  await saveActions(data, sha, `bot: done (${id}) by ${me}`);
  await ctx.reply(`Done (${id}) "${item.title}".`);
});

// (Add /wip /blocked /assign /daily as the same pattern. Save for later.)

await bot.api.getMe().then((me) => console.log(`[imanagent] up as @${me.username}`));
await bot.start();
```

Add a `package.json` script:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

And install `dotenv`:
```bash
npm install dotenv
```

Test interactively:
```bash
cd ~/cowork-zaodevz/agent
npm run start
```
Iman DMs `@cowork_zaodevz_bot` from his phone — `/start` → "imanagent online." `/mine`, `/add test`, `/done 1` etc.

### Step 10: Daemonize with systemd (user unit)

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/imanagent.service << 'EOF'
[Unit]
Description=cowork-zaodevz imanagent
After=network-online.target

[Service]
Type=simple
WorkingDirectory=%h/cowork-zaodevz/agent
ExecStart=/usr/bin/tsx %h/cowork-zaodevz/agent/src/index.ts
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
EnvironmentFile=%h/cowork-zaodevz/agent/.env
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
EOF

# Enable user services to run without an active login session
sudo loginctl enable-linger iman

# Start + enable
systemctl --user daemon-reload
systemctl --user enable --now imanagent
systemctl --user status imanagent
journalctl --user -u imanagent -f   # follow logs
```

That last command tails the bot live. Send a message in Telegram and watch the journal scroll.

### Step 11: Daily digest cron (optional, after v1 works)

Inside `agent/src/index.ts`, add at the bottom (before `await bot.start()`):
```typescript
import cron from 'node-cron';

cron.schedule('0 9 * * *', async () => {
  const chatId = process.env.DAILY_DIGEST_CHAT_ID;
  if (!chatId) return;
  const { data } = await readActions();
  const open = data.items.filter((i) => i.status !== 'DONE');
  const lines = open.map((i) => `[${i.priority}] [${i.status}] ${i.owner}: ${i.title}`);
  await bot.api.sendMessage(chatId, `Daily digest (${open.length} open):\n${lines.join('\n')}`);
}, { timezone: 'UTC' });
```

Add `DAILY_DIGEST_CHAT_ID` to `.env` (use `@userinfobot` for a personal chat ID, or `@username_to_id_bot` in a group).

Restart: `systemctl --user restart imanagent`.

### Step 12: When something breaks

```bash
systemctl --user status imanagent          # is it running?
journalctl --user -u imanagent -n 50       # last 50 log lines
journalctl --user -u imanagent -f          # live tail
systemctl --user restart imanagent         # restart
```

Common issues:
- **Token rejected** — re-check `TELEGRAM_BOT_TOKEN` matches what BotFather sent
- **GitHub 404 on read** — check the PAT has Contents: Read+Write on `cowork-zaodevz` specifically
- **GitHub 409 conflict on save** — somebody else just saved; the agent should re-read + retry (v2 hardening — for v1, the bot replies "conflict, retry" and the user resends)
- **Allowlist blocking valid user** — confirm the numeric ID in `.env` matches @userinfobot's output exactly

## Also See

- [Doc 467](../467-zao-bot-fleet-design-magnetiq/) — original bot-fleet pattern
- [Doc 495](../495-team-telegram-bot-2026-patterns/) — team-bot patterns
- [Doc 644](../644-zao-agent-stack-canon-and-team-bot-template/) — team-bot template
- [Doc 647](../647-agent-quality-deep-research/) — agent quality (persona inheritance, memory, evals)
- [Doc 648](../648-ryan-kagy-zao-civilization-sync/) — elder/lineage pattern + Tailscale federation
- [Doc 649](../../identity/649-zaal-build-profile-ecosystem-survey/) — repo ecosystem context
- Memory `project_hermes_canonical` — Hermes is the ZAO agent framework
- Memory `project_zoe_soul_architecture` — ZOE's runtime, the lineage elder

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add Samantha/candytoybox as the 4th user (env + Owner enum + auth.ts) | @Zaal | small PR | Before the agent build |
| Iman gets repo collaborator access on `songchaindao-dot/cowork-zaodevz` | @Zaal | GitHub setting | Before Step 5 |
| Run through Steps 1-11 with Iman in person or on a call | @Zaal + @Iman | session | Within 1 week |
| After v1 works: open a PR adding `agent/` to the repo (with the index.ts + storage.ts from Step 9) | @Iman | PR | Right after the walkthrough |
| Agree the final category list (existing 14 + COC Concertz + Magnetiq + Attabotty + ZAOstock + BCZ Strategies + The ZAO?) and ship in the same PR as the Samantha-add | @Zaal + @Iman | small PR | Before the agent build |
| Brief candytoybox + ThyRev that cowork-zaodevz is now their shared workplace, walk them through login | @Iman | comms + onboarding session | After the 4-user PR ships |
| v2 add Claude CLI for natural-language todo capture ("todo: ship X" -> `/add` flow) | @Iman | PR | After v1 stabilizes |
| v2 swap GitHub Contents API for Supabase (BACKLOG Phase 2 + 3) | @Zaal + @Iman | PR sequence | After v1 is stable |

## Sources

- `gh api repos/songchaindao-dot/cowork-zaodevz` — repo metadata, tree, BACKLOG.md, SIX-SIGMA.md, README.md, CLAUDE.md, `.env.example`, `src/lib/types.ts`, `package.json`, sample `data/actions.json` (verified 2026-05-15)
- [grammy.dev](https://grammy.dev/) — Telegram bot framework used here + by ZOE
- [docs.github.com — Contents API](https://docs.github.com/en/rest/repos/contents) — the storage backend the repo + the agent share
- [octokit/rest.js](https://github.com/octokit/rest.js) — official typed GitHub client
- ZAOOS `bot/src/zoe/index.ts` — the Hermes-style bot pattern this design mirrors
- `~/.zao/zoe/bootloader-template.md` (on VPS 1) — the child-bot persona seed
