---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: How do we add @-mentions on action assignment and a DM-to-code-PR pipeline to cowork-zaodevz bot? (reconstructed)
superseded-by:
related-docs: 650, 662, 677, 461, 523, 601
tier: STANDARD
---

# 679 - Coworking Agent: Telegram @-Mentions + Iman DM-to-Code Pipeline

> **Goal:** Audit the cowork-zaodevz Telegram bot against best practices, then lock two new features - (A) @-mention the owner on Telegram when an action is assigned or changes status, and (B) let any cowork allowlist user DM the bot a task, have Claude write the code and open a PR, so Zaal only reviews and merges.

## Scope note - which bot

This doc covers the **cowork-zaodevz tracker bot** (`@ZAOcoworkingBot`, on Iman's VPS `187.77.3.104`, GitHub Contents API backend, `data/actions.json` task store). It is NOT the ZAOOS `ZAO Devz` dual-bot (`bot/src/devz/`, the Hermes Coder/Critic narrator). The two share the Hermes engine pattern but are separate processes on separate machines.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **@-mention via HTML `tg://user?id=` deep link**, not `@username` | Robust - works whether or not the user has a public username. Already proven in `bot/src/devz/index.ts:177` (Zaal cc-tag). Telegram Bot API confirms `text_mention` / id-link needs only the numeric id. |
| 2 | **Fire notifications from the command handlers** (handler-hook), post to one notifications chat | The bot executes `/add /assign /done /wip /blocked` itself, so it knows the actor and can skip self-pings. Web-app edits are a known v1 gap - see Finding A4. |
| 3 | **Code engine = Hermes, vendored into cowork-zaodevz, runs on Iman's VPS** | Zaal's choice (2026-05-20). Clone-no-deps matches the ZAO graduate pattern. Tradeoff accepted: Zaal's Claude Max OAuth token lives on Iman's box - mitigations in Feature B. |
| 4 | **`/code` is open to all 4 cowork allowlist users** (Zaal, Iman, ThyRev, Samantha) | Zaal's choice (2026-05-20). Raises cost exposure - hard daily cap + concurrency lock are mandatory, not optional. See the June 15 cost flag. |
| 5 | **`HERMES_FLEET_DAILY_USD_CAP = 10`** for the cowork engine | 4-user access against one Max account, and `claude -p` headless billing changes 2026-06-15. $10/day is a deliberate brake; raise later if it proves too tight. |
| 6 | Run the bot as a **dedicated non-root `cowork` user** | Current v1 runs as root. New code-write capability makes root unacceptable. |

## Best-Practices Audit

The cowork-zaodevz agent today (v1, per docs 650 + 662): deterministic slash commands, GitHub Contents API backend, daily digest cron. Audited against `.claude/rules/secret-hygiene.md`, `.claude/rules/typescript-hygiene.md`, the Hermes pattern (docs 461/523), and the ZAO monorepo-as-lab rules.

| # | Finding | Severity | Fix | Covered by |
|---|---------|----------|-----|------------|
| A1 | v1 bot code lives only on Iman's VPS, not committed to the repo - drift risk, no review | High | Commit `agent/` to cowork-zaodevz | doc 662 v2 PR |
| A2 | Bot process runs as root | High | Dedicated non-root `cowork` user + `systemctl --user` unit | This doc, Feature B |
| A3 | GitHub PAT on disk, scope unverified | Med | Fine-grained PAT scoped to cowork-zaodevz only; `chmod 600 .env` | This doc |
| A4 | No assignment / status notifications; web-app edits invisible to the bot | Feature gap | Feature A (handler-hook); poll-diff safety net = v1.1 | This doc, Feature A |
| A5 | No code-change pipeline | Feature gap | Feature B | This doc, Feature B |
| A6 | Coder-generated commits are not secret-scanned | High | Port secret-hygiene guards 2-4 into the Hermes preflight + PR step | This doc, Feature B |
| A7 | No 5-block memory / transcripts | Med | v2 spec | doc 662 |
| A8 | No branch protection on cowork-zaodevz `main` | Med | `gh api` branch protection + ported `safe-git-push.sh` | This doc, Feature B |
| A9 | No tests on agent code | Low | vitest for roster / notify / diff logic | This doc, Next Actions |
| A10 | No per-run cost telemetry | Med | Parse `total_cost_usd` from `claude --output-format json`, log to runs store, enforce daily cap | This doc, Feature B |
| A11 | `claude -p` headless billing changes 2026-06-15 (see below) | High - time-bomb | Daily cap + monitor the Agent SDK credit; revisit Decision 4 | This doc |

### The 2026-06-15 cost flag (read before shipping Feature B)

Anthropic emailed subscription users: starting **2026-06-15**, `claude -p` headless usage on Max/Pro plans stops drawing from interactive Max limits. It moves to a separate **monthly Agent SDK credit**; past that credit it bills **raw token (API) cost** (HN thread 48129753, "A new monthly Agent SDK credit for your plan").

Consequences for the cowork code pipeline (and for Hermes on VPS 1, same engine):

- Before 2026-06-15: each `/code` run is effectively free under Max.
- After 2026-06-15: each run draws the Agent SDK credit, then costs real money. With 4 users able to fire Opus coder runs (Decision 4), exposure is real.
- Mitigation is built in: `HERMES_FLEET_DAILY_USD_CAP` (Decision 5), `--output-format json` returns `total_cost_usd` per run for tracking, and a concurrency lock (one run at a time).
- Recommendation: ship now, watch the first week of spend after 2026-06-15, and reconsider whether `/code` stays allowlist-wide or narrows to Iman + Zaal.

## Feature A - @-Mention on Assignment / Status Change

### Trigger matrix

| Bot command | Notify | Condition |
|-------------|--------|-----------|
| `/add <title>` (with owner) | new owner | owner is a real person AND owner != actor |
| `/assign <id> <Owner>` | new owner | owner is a real person AND owner != actor |
| `/done <id>` | item owner | owner != actor |
| `/wip <id>` | item owner | owner != actor |
| `/blocked <id> <reason>` | item owner + creator | recipient != actor (creator only if != owner) |

Rules: never ping yourself. Owner `Open` -> no ping. Owner `Both` -> ping Zaal and Iman in one message. Owner with no roster entry -> plain-text name, no link (graceful degrade).

### Roster - `agent/src/roster.ts`

The v1 allowlist already maps Telegram id to display name. Require those display names to equal the `Owner` enum values exactly (`Zaal`, `Iman`, `ThyRev`, `Samantha`). Then:

```typescript
import type { Owner } from './types';

interface RosterEntry { name: string; telegramId: number }

// Loaded from the existing allowlist (users.json / ALLOWLIST_USER_IDS+USER_NAMES).
const ROSTER: Record<string, RosterEntry> = loadRoster();

/** Telegram ids to ping for a given Owner. [] = nobody (Open / unknown). */
export function ownerTelegramIds(owner: Owner): number[] {
  if (owner === 'Open') return [];
  if (owner === 'Both') {
    return ['Zaal', 'Iman']
      .map((n) => ROSTER[n]?.telegramId)
      .filter((id): id is number => typeof id === 'number');
  }
  const id = ROSTER[owner]?.telegramId;
  return typeof id === 'number' ? [id] : [];
}
```

### Notification helper - `agent/src/notify.ts`

```typescript
import type { Bot } from 'grammy';
import type { ActionItem } from './types';
import { ownerTelegramIds } from './roster';

/** Action titles/notes are user input - escape before embedding in HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mention(name: string, telegramId: number | null): string {
  const safe = escapeHtml(name);
  return telegramId
    ? `<a href="tg://user?id=${telegramId}">${safe}</a>`
    : safe;
}

interface NotifyOpts {
  bot: Bot;
  notifyChatId: number;       // env NOTIFY_CHAT_ID, defaults to DAILY_DIGEST_CHAT_ID
  item: ActionItem;
  actorTelegramId: number;
  actorName: string;
  kind: 'assigned' | 'status';
}

export async function notifyOwner(o: NotifyOpts): Promise<void> {
  const targets = ownerTelegramIds(o.item.owner)
    .filter((id) => id !== o.actorTelegramId); // never ping the actor
  if (targets.length === 0) return;

  const title = escapeHtml(o.item.title);
  const actor = mention(o.actorName, o.actorTelegramId);
  const links = targets.map((id) => mention(o.item.owner, id)).join(' ');

  const body =
    o.kind === 'assigned'
      ? `${links} assigned: "${title}" [${o.item.priority}]` +
        (o.item.due ? ` due ${escapeHtml(o.item.due)}` : '') +
        ` - by ${actor}`
      : `${links} your item "${title}" is now ${o.item.status} - by ${actor}`;

  await o.bot.api.sendMessage(o.notifyChatId, body, { parse_mode: 'HTML' });
}
```

Then each command handler calls `notifyOwner(...)` right after the successful `saveActions()` write.

### Delivery requirement

The `tg://user?id=` mention only produces a push notification if the target user is a member of the notification chat. **All 4 cowork users must be members of the `NOTIFY_CHAT_ID` group.** If a user is not a member the message still posts; it just will not ping them. Add `NOTIFY_CHAT_ID` to `.env` (default to the existing `DAILY_DIGEST_CHAT_ID`).

### Known v1 gap + v1.1 fix

Handler-hook notifications fire only for changes made *through the bot*. Edits made in the cowork-zaodevz **web app** do not pass through the bot, so they will not ping. v1.1 fix: a poll-diff loop - every 2 minutes read `data/actions.json`, diff item owner/status against the cached snapshot (v2 already caches the file + sha per doc 662), ping any delta, and skip ids already notified via a small `~/.zaocoworking/notified.json` fingerprint set. Poll-diff loses the actor name on web edits, so the message degrades to "item X is now WIP" without a "by" clause. Ship handler-hook first; add poll-diff once v2 caching lands.

## Feature B - Iman DMs the Bot, Claude Writes Code, PR Opens

This is doc 662's v3 ("add `cowork` profile to Hermes, `/code` command"), with the two open decisions now locked: engine runs on Iman's VPS (Decision 3), `/code` is allowlist-wide (Decision 4).

### Flow

```
Iman (or any of 4 allowlist users) DMs the cowork bot:
   /code make the BLOCKED badge red instead of gray

   v
cowork bot (Iman's VPS):
   - allowlist check (4 users)
   - daily cost cap not exceeded?  (HERMES_FLEET_DAILY_USD_CAP=10)
   - acquire run lock (one run at a time)
   - reply: "Coder starting on cowork-zaodevz..."
   v
vendored Hermes runner (agent/src/hermes/, cowork profile):
   clone cowork-zaodevz -> /tmp/hermes-<id>/ -> fresh branch
   Coder pass    (opus,   claude -p headless, Max OAuth)
   Preflight     (npm run build + typecheck + lint + secret scan)
   Critic pass   (sonnet, claude -p headless) -> score 0-100
   score >= 70   -> gh pr create  (base: main)
   v
cowork bot posts back to the chat:
   "PR #N opened on cowork-zaodevz: <title>. Critic 85. <url>"  cc <mention Zaal>
   v
Zaal reviews + merges on GitHub. No Claude Code on his laptop needed.
```

Score < 70 loops feedback to the Coder, max 3 attempts, then escalates: "needs human" cc Zaal.

### Engine - vendor Hermes into cowork-zaodevz

Copy `bot/src/hermes/` from ZAOOS into `cowork-zaodevz/agent/src/hermes/` (clone, no deps - the ZAO graduate pattern). One adaptation: ZAOOS Hermes persists runs to a Supabase `hermes_runs` table; cowork has no Supabase wired yet (doc 650 puts it in Phase 2). Replace `db.ts` with a file-backed run store at `~/.zaocoworking/hermes-runs.json` (same shape - `id, triggeredBy, issueText, branch, prNumber, criticScore, status, totalCostUsd, timestamps`).

### The `cowork` repo profile

Add to the vendored Hermes (`agent/src/hermes/types.ts` + `coder.ts`):

```typescript
// repo profile
cowork: {
  repoUrl: process.env.HERMES_COWORK_REPO_URL
    ?? 'https://github.com/songchaindao-dot/cowork-zaodevz.git',
  baseBranch: 'main',
  gitUserName: 'Cowork Bot',
  gitUserEmail: 'bot@songchaindao.dev',
  forbiddenPaths: [
    'data/',                  // tracker data - the bot owns this, not the coder
    '.env', 'agent/.env', '.env.local', '.env.production',
    'agent/src/hermes/',      // do not let the coder edit its own engine
    '.github/workflows/',     // CI changes need human review
    'package-lock.json',
  ],
}
```

Coder system-prompt context block: "cowork-zaodevz is a Next.js 15 App Router team action tracker. The web app reads/writes `data/actions.json` via the GitHub Contents API; never touch `data/`. The `agent/` folder is the Telegram bot. Tailwind v3, TypeScript strict."

### `/code` command handler

```typescript
bot.command('code', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAllowlisted(userId)) return;          // Decision 4: 4 users

  const task = ctx.match?.trim();
  if (!task) return ctx.reply('Usage: /code <what to change>');

  if (await dailyCostExceeded()) {
    return ctx.reply('Daily code-engine cap reached. Try again tomorrow.');
  }
  if (!acquireRunLock()) {
    return ctx.reply('A code run is already in progress. One at a time.');
  }

  await ctx.reply('Coder starting on cowork-zaodevz...');
  try {
    const run = await dispatchHermesRun({
      profile: 'cowork',
      issueText: task,
      triggeredBy: userId,
      narrate: (msg) => ctx.reply(msg),       // progress to this chat
      model: { coder: 'opus', critic: 'sonnet' },
    });
    if (run.status === 'ready') {
      await ctx.reply(
        `PR #${run.prNumber} opened: ${run.prTitle}. Critic ${run.criticScore}.\n` +
        `${run.prUrl}\ncc <a href="tg://user?id=${ZAAL_TG_ID}">Zaal</a>`,
        { parse_mode: 'HTML' },
      );
    } else {
      await ctx.reply(
        `Code run ${run.status} after ${run.fixerAttempts} attempts. ` +
        `Needs human. cc <a href="tg://user?id=${ZAAL_TG_ID}">Zaal</a>`,
        { parse_mode: 'HTML' },
      );
    }
  } finally {
    releaseRunLock();
  }
});
```

### VPS prerequisites - Iman's box `187.77.3.104`

1. **Node 22** + `git`.
2. **`claude` CLI**: `npm i -g @anthropic-ai/claude-code`.
3. **Auth with Zaal's Claude Max**: run `claude` once interactively to complete the OAuth login, or copy `~/.claude/` from a Zaal machine. Then `chmod 600 ~/.claude/*.json`. Pass `bare: false` on every `callClaudeCli()` call (per `feedback_no_bare_with_oauth` / PR #512 - the `--bare` flag strips OAuth reads, breaks Max-plan bots).
4. **`gh` CLI** authed with a **fine-grained GitHub PAT scoped to `songchaindao-dot/cowork-zaodevz` only** (Contents + Pull requests: write).
5. **Dedicated non-root `cowork` user**; bot runs under `systemctl --user` (fixes audit A2).
6. Port **`safe-git-push.sh` + `branch-guard.sh`** (docs 461/523) so the Coder can never push to `main` or a merged PR.
7. **Branch protection on cowork-zaodevz `main`**: `gh api -X PUT /repos/songchaindao-dot/cowork-zaodevz/branches/main/protection ...` - block force-push + deletion.
8. **Secret-hygiene guards 2-4** (`.claude/rules/secret-hygiene.md`) wired into the Hermes preflight + PR step - scan the staged diff for 64-char hex, `PRIVATE_KEY=`, PEM blocks, `ghp_` / `sk-ant-` tokens; hard-abort on any match (fixes audit A6).

### Security tradeoff (Decision 3, accepted)

Zaal's Claude Max OAuth token will live on Iman's VPS. Honest mitigations: it is a revocable OAuth token, not a raw API key - revoke from the Anthropic console anytime; `chmod 600`; the bot runs non-root; `HERMES_FLEET_DAILY_USD_CAP` bounds spend; the Hermes `forbiddenPaths` + secret-hygiene scan bound what the Coder can write. Residual risk: anyone with root on Iman's box can read the token and run Claude as Zaal. If that becomes a concern, the alternative (rejected today) is to keep the engine on VPS 1 and have the cowork bot dispatch over an authenticated tunnel.

### The "simple VPS command" fallback

Zaal asked whether a plain VPS command is the better path. It is the fallback, not the primary: once Hermes is vendored, anyone with SSH to Iman's box can run `cd ~/cowork-zaodevz/agent && npm run code -- "<task>"` to invoke the same runner manually. The `/code` DM path is the recommendation because it needs no SSH, works from a phone, and is gated by the allowlist + cost cap automatically.

## Also See

- [Doc 650](../650-cowork-zaodevz-imanagent/) - cowork-zaodevz imanagent spec, VPS build, storage layer
- [Doc 662](../../dev-workflows/662-zaocoworking-v2-v3-architecture/) - v2 memory/transcripts + v3 Hermes integration skeleton (this doc locks v3)
- [Doc 677](../677-bonfire-cowork-github-connection/) - GitHub events -> Bonfire sync (the GitHub-side companion)
- [Doc 461](../../dev-workflows/461-push-to-merged-pr-failure-fix/) - safe-git-push.sh, branch protection
- [Doc 523](../523-zao-agentic-systems-full-audit-fix-pr-pipeline/) - Hermes dual-bot pattern, hermes_runs schema
- [Doc 601](../601-agent-stack-cleanup-decision/) - Hermes-as-canonical-engine decision

## Next Actions

| Action | Owner | Type | Difficulty (1-10) |
|--------|-------|------|-------------------|
| Commit v1 `agent/` to cowork-zaodevz repo (closes audit A1) | @Iman | PR | 2 |
| Move bot to non-root `cowork` user + `systemctl --user` unit (A2) | @Iman | Infra | 3 |
| Scope the GitHub PAT to cowork-zaodevz only, `chmod 600 .env` (A3) | @Iman | Infra | 2 |
| Feature A - add `roster.ts` + `notify.ts`, hook the 5 command handlers, add `NOTIFY_CHAT_ID` env | @Iman | PR | 4 |
| Confirm all 4 cowork users are members of `NOTIFY_CHAT_ID` group | @Zaal | Ops | 1 |
| Feature B - vendor Hermes into `agent/src/hermes/`, file-backed run store, `cowork` profile | @Iman | PR | 6 |
| Feature B - VPS prereqs 1-8 on `187.77.3.104` (claude CLI, gh PAT, guards, branch protection) | @Iman | Infra | 5 |
| Feature B - `/code` handler with allowlist + cost cap + run lock | @Iman | PR | 4 |
| Set `HERMES_FLEET_DAILY_USD_CAP=10`, wire `total_cost_usd` telemetry (A10) | @Iman | PR | 3 |
| vitest coverage for roster / notify / diff logic (A9) | @Iman | PR | 3 |
| After 2026-06-15: review one week of code-engine spend, decide if `/code` stays allowlist-wide (Decision 4 / A11) | @Zaal | Decision | 2 |

## Sources

- [Telegram Bot API - Mentions](https://core.telegram.org/bots/api) - `text_mention` entity + `tg://user?id=` link mention users without a username; only the numeric id is required. Verified 2026-05-20.
- [Telegram API - Mentions](https://core.telegram.org/api/mentions) - mention mechanics. Verified 2026-05-20.
- [Claude Code - Headless mode docs](https://code.claude.com/docs/en/headless) - `claude -p` non-interactive, `--allowedTools`, `--output-format json` returns `total_cost_usd`. Verified 2026-05-20.
- [HN 48129753 - "Claude -p headless mode cannot use Max limits, will fall under API plan"](https://news.ycombinator.com/item?id=48129753) - community thread; confirms the 2026-06-15 "Agent SDK credit" change for subscription headless usage. Verified 2026-05-20.
- [amux.io - Claude Code headless self-hosting guide (2026)](https://amux.io/guides/claude-code-headless/) - server deployment patterns. Verified 2026-05-20.
- ZAOOS codebase: `bot/src/hermes/` (Hermes engine), `bot/src/devz/index.ts:177` (existing `tg://user?id=` cc-tag pattern), `.claude/rules/secret-hygiene.md`.
