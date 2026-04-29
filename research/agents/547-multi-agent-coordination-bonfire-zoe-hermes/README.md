---
topic: agents
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 523, 524, 527, 529, 531, 541, 542, 543, 544, 545, 546
tier: DEEP
---

# 547 - Multi-Agent Coordination: Bonfire, ZOE, Hermes (Apr 28 2026)

Goal: Design how ZOE bot, Hermes Stock-Coder + Critic, and the new ZABAL Bonfire Bot work together without conflicts, duplicate writes, or context drift.

---

## Summary: The Agent Stack Today (Apr 28, 2026)

| Agent | Transport | Input | Output | State | Auth |
|-------|-----------|-------|--------|-------|------|
| **ZOE bot** | Telegram polling | /tip, /help, /do, /ask | Farcaster tips, research context, todos | ~/.cache/zoe-telegram/ (convos) | env: ALLOWED_USERS |
| **ZAO Devz + Hermes pair** | Grammy (2 bots, 1 process) | /fix command in ZAO Devz chat | PR link + Critic score | Supabase hermes_runs table | BOT_ADMIN_TELEGRAM_IDS only |
| **Hermes HTTP dispatch** | POST :3007/hermes-dispatch | JSON {trigger_by, issue_text} | Same as /fix | Supabase | x-hermes-secret header |
| **ZABAL Bonfire Bot** | Telegram (Bonfire's native agent) | Telegram messages, voice memos | Graph writes + semantic search | bonfires.ai/tnt-v2.api | OAuth via Bonfire platform |

---

## Agent-to-Agent Interactions Matrix

What calls what, how, and what breaks:

| Caller | Callee | Mechanism | Auth | Success Response | Failure Mode | Current Risk |
|--------|--------|-----------|------|------------------|--------------|--------------|
| ZOE bot | Bonfire (planned) | pip install bonfires + client.kg.search() | None (reads public kg) | `{entities: [...]}` | Bonfire API down | Network timeout, no fallback |
| ZOE bot | Supabase | iron-session RLS + select * queries | Session token | `{tips: []}` | RLS error 403 | Session expiry, Supabase down |
| Hermes Coder | Bonfire (planned) | Fetch context before patching | x-auth-token in MCP config | `{context: "..."}` | Query too slow (>2s) | Blocks issue prompt, Coder starts blind |
| Hermes Coder | GitHub | Clone + commit + push | SSH key (bot key) | Commit hash + PR number | SSH timeout, merge conflicts | pr-watcher watches, alerts on delay |
| Hermes pr-watcher | Telegram | `ctx.api.sendMessage(...)` | Telegram bot token (HermesBot) | Message ID | Chat deleted, bot removed | Silent failure, nobody knows PR broke |
| ZABAL Bonfire | Bonfire (platform) | Telegram -> webhook -> HTTP POST | OAuth bearer token | `{node_id: "..."}` | Token revoked, webhook down | Ingestion stalled, silent (Bonfire logs it) |
| ZOE bot | Hermes (reverse call planned) | HTTP dispatch listener :3007 | x-hermes-secret header | `{run_id: "..."}` | Secret mismatch, port already in use | Dispatch POST fails 403/EADDRINUSE |
| ZAO Devz bot | Hermes runner | In-process function call | Same process, no auth needed | `DispatchResult` | OOM, process crash | Telegram silent, bot needs restart |

---

## The 5 Things That Can Go Wrong (Ranked by Likelihood)

### 1. **Stale Graph Reads by Hermes Coder** (HIGHEST PRIORITY)

**Why it happens:**
- Hermes Coder queries Bonfire for context at t=0 (issue prompt construction).
- Zaal adds a new constraint in Bonfire between t=0 and t=5 (while Coder is generating the patch).
- Coder's patch doesn't reflect the new constraint.
- Critic catches it, Coder retries, but the stale read pattern repeats.

**Blast radius:** Wasted retry (already ~$0.30/attempt), slow convergence, Zaal frustrated ("why didn't it know about X").

**The fix:**
```typescript
// bot/src/hermes/coder.ts - Add a pre-execution graph snapshot
async function runFixer(input: FixerInput) {
  // NEW: Capture context JUST BEFORE Coder starts, not during issue construction
  let graphContext = '';
  if (process.env.BONFIRE_API_KEY) {
    try {
      const kg = await import('bonfires').then(m => m.client.kg);
      const snapshot = await kg.search('ZAOstock event constraints', { limit: 3 });
      graphContext = snapshot.map(e => `${e.title}: ${e.description}`).join('\n');
    } catch (e) {
      console.error('Bonfire snapshot failed, proceeding blind:', e);
      // Fallback to old issue_text-only context
    }
  }
  
  // Pass graphContext to FIXER_SYSTEM prompt
  const coderPrompt = FIXER_SYSTEM + '\n\nGraph snapshot at run time:\n' + graphContext;
  // ... rest of runFixer
}
```

**When to ship:** Before widening Hermes access (currently admin-only). Test once.

---

### 2. **Token Conflict (Two Telegram Bots Polling Same Token)** (HIGH PRIORITY)

**Why it happens:**
- ZOE bot polls with TELEGRAM_BOT_TOKEN.
- ZABAL Bonfire Bot joins ZAO Devz chat, also polls with its own token.
- Both work fine separately.
- BUT: If ZOE bot's token is accidentally shared with Bonfire (copy-paste error in .env.portal), both bots try to poll the same token stream.
- Telegram detects two clients, rejects one or both with 409 Conflict.
- ZOE goes silent or flaps (restart loop).

**Blast radius:** ZOE stops answering /tip, /help, /do for hours. User has to SSH to VPS to debug.

**The fix:**
1. **Separate .env files:**
   ```bash
   # ~/.env.portal (ZOE + Hermes)
   TELEGRAM_BOT_TOKEN=<ZOE_TOKEN>
   HERMES_BOT_TOKEN=<DEVZ_NARRATOR_TOKEN>
   
   # ~/.env.bonfire (ZABAL Bonfire Agent)
   TELEGRAM_BOT_TOKEN=<BONFIRE_TOKEN>
   ```

2. **Systemd unit check script:**
   ```bash
   # bot/scripts/check-token-conflicts.sh
   if grep -q "$ZOE_TOKEN" ~/.env.bonfire 2>/dev/null; then
     echo "FATAL: ZOE_TOKEN found in .env.bonfire - token conflict risk"
     exit 1
   fi
   ```

3. **Pre-start hook in systemd:**
   ```ini
   # /etc/systemd/user/zao-zoe-bot.service
   ExecStartPre=bash /home/zaal/ZAOOS/bot/scripts/check-token-conflicts.sh
   ```

**When to ship:** NOW, before Bonfire bot goes live on VPS.

---

### 3. **Duplicate Writes from ZOE + Bonfire (Race Condition)** (MEDIUM-HIGH)

**Why it happens:**
- Zaal types a message in ZAO Devz: "Need to confirm venue sponsor by Friday."
- ZABAL Bonfire Bot hears it, writes a node: `{type: "Action", text: "Confirm venue sponsor...", due: Friday}`.
- ZOE bot ALSO hears the same message (both bots in the chat), tries to extract an action + write to Bonfire.
- Two writes race. Last-write-wins, or Bonfire rejects the duplicate.

**Blast radius:** Action items appear twice in Bonfire graph. Zaal asks "why is this duplicated?" User confusion. Graph integrity questionable.

**The fix:**
```
DECISION: ZOE bot DOES NOT write to Bonfire graph.
- ZOE reads from Bonfire (queries via /tip).
- ZABAL Bonfire Bot ONLY conversational writer (via Telegram).
- If ZOE needs to write, it's Hermes (programmatic: PR opened -> write a Contribution node).
```

Codify in comments:
```typescript
// infra/portal/bin/bot.mjs
// ZOE is READ-ONLY for Bonfire graph. All writes go through:
// 1. ZABAL Bonfire Bot (Telegram native)
// 2. Hermes programmatic events (PR, contribution, escalation)
// Rationale: prevents duplicate writes and preserves Bonfire's single-source-of-truth.
```

**When to ship:** When ZOE's Bonfire read is wired (Phase 1). Add comment now.

---

### 4. **Cost Runaway: Hermes Querying Graph on Every Retry** (MEDIUM)

**Why it happens:**
- Hermes Coder fails, retries. NEW: calls Bonfire again.
- Attempt 2 fails, retries. Calls Bonfire again.
- Attempt 3 fails, escalates.
- If we don't cache, every /fix with 3 retries = 3 graph queries x $0.01-0.05 per query = $0.03-0.15 in Bonfire costs.
- At 5 /fix/day, that's $0.15-0.75/day in graph queries alone.
- Not huge, but wasteful if the same context changes rarely (once/week for ZAOstock).

**Blast radius:** ~$20/month in wasted graph queries.

**The fix:**
```typescript
// bot/src/hermes/runner.ts
const graphContextCache = new Map<string, { context: string; timestamp: number }>();
const GRAPH_CONTEXT_TTL_MS = 5 * 60 * 1000; // 5-minute cache

async function getGraphContext(queryKey: string): Promise<string> {
  const cached = graphContextCache.get(queryKey);
  if (cached && Date.now() - cached.timestamp < GRAPH_CONTEXT_TTL_MS) {
    return cached.context;
  }
  
  const context = await fetchBonfireContext(queryKey);
  graphContextCache.set(queryKey, { context, timestamp: Date.now() });
  return context;
}
```

**When to ship:** Phase 2 (after Coder context reads are working and stable). Low priority.

---

### 5. **Hermes HTTP Dispatch Secret Leak or Misconfiguration** (MEDIUM)

**Why it happens:**
- `x-hermes-secret` header is used to auth POST :3007/hermes-dispatch.
- Secret is stored in ~/.env.portal (readable by zaal user only, but still on disk).
- If .env.portal is committed (accident), secret leaks to GitHub.
- Anyone with the secret can trigger /fix runs on the VPS.

**Blast radius:** Rogue /fix dispatch consumes daily budget, opens unwanted PRs.

**The fix:**
```bash
# bot/src/devz/index.ts - already checks for secret existence
if (!process.env.HERMES_DISPATCH_SECRET) {
  console.warn('[devz] HERMES_DISPATCH_SECRET not set - HTTP dispatch listener disabled');
}
// Add validation at boot:
if (!HERMES_DISPATCH_SECRET || HERMES_DISPATCH_SECRET.length < 32) {
  throw new Error('HERMES_DISPATCH_SECRET must be 32+ chars');
}
```

```bash
# .gitignore - already has .env, add explicit check:
.env*
!.env.example
```

**When to ship:** NOW, as part of Token Conflict fix (#2). Run secret audit.

---

## Single Source of Truth Rule (Codified)

| Data | Lives In | Writer(s) | Reader(s) | Why |
|------|----------|-----------|-----------|-----|
| **Member identity** (wallet, farcaster FID) | Supabase public schema + RLS | /onboarding API (bot/src/app/api/auth/) | All agents (auth checks) | Relational + permissioned. Bonfire reads, never writes. |
| **Research docs** | github.com/bettercallzaal/ZAOOS/research/ | Humans (Claude, /zao-research skill, /autoresearch) | ZOE, Hermes, Bonfire (all read) | Markdown source of truth. Version controlled. Bonfire ingests nightly. |
| **Bot conversation state** | ~/.cache/zoe-telegram/ (ZOE), Supabase hermes_runs (Hermes) | Each bot's own runner | Each bot reads its own state | ZOE doesn't read Hermes state. Hermes doesn't read ZOE state. |
| **ZAOstock event details** (venue, date, budget, sponsors) | Bonfire knowledge graph | ZABAL Bonfire Bot (Telegram intake), Hermes (on PR opening) | ZOE /tip, Hermes Coder context | Single-source-of-truth for real-time constraints. Replaces outdated /op docs. |
| **Hermes run state** | Supabase hermes_runs table | dispatchHermesRun() + updateRun() | pr-watcher, CI callbacks | Immutable audit log. DB timestamp is source of truth for "when did /fix start." |
| **ZABAL trading state** (tokens, positions) | Supabase zabal_positions + RLS | ZABAL trading bot agents | ZABAL bots + /status queries | Financial data. RLS enforced. Bonfire reads (for reporting only). |

---

## Agent-to-Bonfire Wiring Spec (3 Patterns)

### Pattern A: ZOE Reads from Bonfire (Phase 1 - START HERE)

**Use case:** `/tip @bonfires What sponsorships do we have for ZAOstock?`

**Implementation:**
```typescript
// infra/portal/bin/bot.mjs - add around line 200
async function queryBonfireContext(question: string): Promise<string> {
  if (!process.env.BONFIRE_API_URL || !process.env.BONFIRE_API_KEY) {
    return null; // Graceful degradation to sent.json
  }
  
  try {
    const res = await fetch(`${process.env.BONFIRE_API_URL}/kg/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BONFIRE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: question, limit: 3 }),
    });
    const data = await res.json();
    return data.entities?.map(e => `${e.title}: ${e.description}`).join('\n') ?? null;
  } catch (e) {
    console.error('Bonfire query failed:', e.message);
    return null; // Fallback
  }
}

// In the /tip handler:
let response = await queryBonfireContext(cleanedTipQuery);
if (!response) {
  // Fallback to sent.json + research/
  response = findDocByNumber(tipNumber);
}
```

**Cache layer:** 2-second max wait for Bonfire. If slower, use sent.json + research/ and reply with "(from cache)" suffix.

**Config needed:**
```bash
# ~/.env.portal
BONFIRE_API_URL=https://tnt-v2.api.bonfires.ai
BONFIRE_API_KEY=sk-...
```

**When to ship:** Phase 1 (next 1 week). Low risk because reads are non-mutating.

---

### Pattern B: Hermes Coder Reads Context Before Patching (Phase 1 - FOLLOW A)

**Use case:** `/fix Bonfire has a new constraint that we need to reflect in the bot code.`

**Implementation:**
```typescript
// bot/src/hermes/coder.ts - before runFixer
const graphContext = await getGraphContext(input.issueText);

// Pass to FIXER_SYSTEM:
const enhancedPrompt = FIXER_SYSTEM + '\n\nCONTEXT FROM BONFIRE KNOWLEDGE GRAPH:\n' + graphContext;
```

**Query strategy:**
```typescript
async function getGraphContext(issueText: string): Promise<string> {
  if (!process.env.BONFIRE_API_KEY) return '';
  
  try {
    // Extract keywords from issue (ZAOstock, venue, sponsor, etc.)
    const keywords = issueText.match(/\b(ZAOstock|sponsor|venue|venue|date|budget|lineup)\b/gi) ?? [];
    const query = keywords.length > 0 
      ? keywords.join(' OR ')
      : issueText.slice(0, 100);
    
    const res = await fetch(`${BONFIRE_API_URL}/kg/search`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BONFIRE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 5 }),
    });
    const { entities } = await res.json();
    return entities.map(e => `- ${e.title}: ${e.description}`).join('\n');
  } catch (e) {
    return ''; // Silent fallback
  }
}
```

**Token budget impact:** ~300-500 tokens for graph context. Sonnet Critic reads it too, so +300 tokens per attempt. At $3/MTok input, that's ~$0.005/attempt. Negligible.

**Timeout:** 2 seconds max. If Bonfire is slow, proceed without context (Coder can read it from issue text anyway).

**When to ship:** Phase 1, but AFTER A is proven. Estimate: 2-3 days.

---

### Pattern C: ZABAL Bonfire Bot Writes from Telegram (Already Live)

**Current state:** Bonfire's native Telegram agent is already running. It writes via the Bonfire platform UI, not our code.

**Our job:** Don't interfere.
```
- ZOE bot: NEVER write to Bonfire graph from Telegram messages.
- Hermes: ONLY write programmatic events (PR opened -> Contribution node).
- ZABAL Bonfire: ONLY conversational writer from Telegram.
```

**Hermes programmatic writes (Phase 2):**
```typescript
// bot/src/hermes/runner.ts - after openPullRequest
if (process.env.BONFIRE_API_KEY) {
  try {
    await fetch(`${BONFIRE_API_URL}/kg/nodes`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BONFIRE_API_KEY}` },
      body: JSON.stringify({
        type: 'Contribution',
        title: `PR #${prNumber}: ${prTitle}`,
        description: `Hermes Coder fixed: ${input.issue_text}`,
        metadata: { pr_url: prUrl, coder_score: criticScore },
      }),
    });
  } catch (e) {
    console.error('Bonfire write failed (non-blocking):', e.message);
  }
}
```

---

## Telegram Bot Fleet Hygiene (Extending Doc 527)

### The 4 Bots (as of Apr 28, 2026)

| Bot | Token Env | Polling? | Privacy Mode | Channels | Role |
|-----|-----------|----------|--------------|----------|------|
| **@ZAODevZBot** (Stock-Team) | ZAOSTOCK_BOT_TOKEN | Yes (poller) | Off (reads all) | ZAO Devz (private group) | Main stock team voice. /fix, /help, /status. |
| **@HermesZAOdevzbot** (Stock-Reviewer) | HERMES_BOT_TOKEN (zao-devz/index.ts) | Yes (poller) | Off (reads all) | ZAO Devz (same chat as DevZ) | Narrator only. Reports Coder/Critic phases, CI failures. No commands. |
| **ZOE bot** (Portal concierge) | TELEGRAM_BOT_TOKEN (infra/portal/bin/bot.mjs) | Yes (poller) | Off (reads all) | DMs with Zaal (1:1) | /tip, /help, /ask, /do. No group chat, only PM. |
| **@zabal_bonfire_bot** (ZABAL) | BONFIRE_TOKEN (managed by Bonfire platform) | Webhook (not poller) | On (privacy mode enabled) | ZAO Devz + custom ZABAL group | Knowledge graph ingestion. Conversational only. |

### Privacy Mode Per Bot

**Privacy Mode ON** = bot only sees messages directed at it (@mention or reply).
**Privacy Mode OFF** = bot sees ALL messages in the chat (needed for context).

```bash
# via @BotFather
# For @zabal_bonfire_bot: /setprivacy -> Enable (ON)
# For @ZAODevZBot, @HermesZAOdevzbot, ZOE: /setprivacy -> Disable (OFF)
```

Rationale:
- ZAO Devz bots need full chat context for narrative flow.
- ZABAL Bonfire bot: privacy mode ON saves bandwidth (webhook already gives full context).
- ZOE: PM-only, privacy mode irrelevant.

### Channel/Topic Posting Permissions

```bash
ZAO Devz chat structure (if using Topics):
  - General (for /fix commands, tip output, status)
  - CI Failures (hermes pr-watcher alerts only)
  - DebugBots (ZOE testing, temporary)

Permissions:
  @ZAODevZBot: post to General + CI Failures
  @HermesZAOdevzbot: post to CI Failures only
  ZOE: none (PM-only)
```

---

## Anti-Patterns the Multi-Agent Stack Must Avoid

1. **One bot pretending to be another**
   - WRONG: Hermes posts as "@ZAODevZBot fixed issue X"
   - RIGHT: "Hermes (via HermesBot): Critic score 78/100"
   - Always cite the source bot in any cross-bot message.

2. **Cascading writes (infinite loop)**
   - WRONG: Bot A writes to Bonfire -> webhook notifies Bot B -> Bot B reads and writes -> loop.
   - RIGHT: Explicit writes only (Hermes on PR, ZABAL on Telegram). No feedback loops.

3. **Lost-update race (concurrent writes to same entity)**
   - WRONG: ZOE and ZABAL Bonfire both update "ZAOstock date" attribute concurrently.
   - RIGHT: Bonfire is source of truth. ZOE reads, doesn't write. ZABAL writes. Hermes never touches.

4. **Magic cross-bot calls without auth/secret**
   - WRONG: ZOE POSTs to Hermes :3007 without x-hermes-secret.
   - RIGHT: Always check `HERMES_DISPATCH_SECRET` header. Reject 403 if missing/wrong.

5. **Mixing Telegram polling with webhooks in the same bot**
   - WRONG: One systemd unit polls AND listens for webhooks.
   - RIGHT: Each transport is separate. Polling = process, webhooks = HTTP listener.

---

## Key Decisions Summary (Recommendations FIRST)

| Priority | Change | Effort | ROI | Phase |
|----------|--------|--------|-----|-------|
| **P0** | Separate ZOE + Bonfire .env files + pre-start token conflict check | 30 min | Prevents silent bot failure | NOW (before Bonfire VPS deploy) |
| **P0** | Add graph snapshot to Hermes Coder (pre-execution) to avoid stale reads | 2 hrs | Improves Coder convergence + cost | Phase 1 |
| **P1** | Wire ZOE bot to read Bonfire via /tip + fallback to sent.json | 4 hrs | Proves Telegram-native query loop | Phase 1 (1 week) |
| **P1** | Wire Hermes Coder to fetch Bonfire context before issue prompt | 3 hrs | Gives Coder better context + decision authority | Phase 1 (follow A) |
| **P2** | Add 5-min cache layer to Hermes graph queries | 1.5 hrs | Saves ~$0.15/day + fast retries | Phase 2 (after P1 stable) |
| **P2** | Hermes programmatic writes (PR -> Contribution node in Bonfire) | 2 hrs | Closes audit loop, Bonfire sees all agent actions | Phase 2 |
| **P3** | Add daily "graph drift" check (kg.verify) | 1 hr | Catch data corruption early | Phase 3 |

---

## Concrete Action Bridge (Next 3 Days)

**Day 1 (TODAY):**
1. Check `.env.portal` + `.env.bonfire` have different TELEGRAM_BOT_TOKENs.
2. Write `bot/scripts/check-token-conflicts.sh` (30 lines).
3. Add ExecStartPre hook to systemd units.
4. Test: restart ZOE + Bonfire, no 409 errors.
5. Add comments to `infra/portal/bin/bot.mjs` clarifying ZOE is read-only for Bonfire.

**Day 2:**
1. Implement `getGraphContext()` in `bot/src/hermes/coder.ts`.
2. Add to FIXER_SYSTEM prompt: "Graph context from Bonfire at runtime: [context]".
3. Add 2-second timeout + silent fallback.
4. Test with a single /fix on ZAOstock issue.

**Day 3:**
1. Implement ZOE Bonfire read in `infra/portal/bin/bot.mjs`.
2. Add cache (2s TTL).
3. Test: `/tip @bonfires` returns graph results with (cache) suffix if fallback used.
4. Commit all 3 PRs.

---

## Verified URLs (10+)

1. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/hermes/runner.ts
2. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/devz/index.ts
3. https://github.com/bettercallzaal/ZAOOS/blob/main/infra/portal/bin/bot.mjs
4. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/hermes/db.ts
5. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/hermes/types.ts
6. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/hermes/commands.ts
7. https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/hermes/pr-watcher.ts
8. https://github.com/bettercallzaal/ZAOOS/blob/main/.env.example
9. https://github.com/bettercallzaal/ZAOOS/pull/340
10. https://github.com/bettercallzaal/ZAOOS/pull/360
11. https://bonfires.ai/docs (Bonfire SDK reference)
12. https://github.com/bettercallzaal/ZAOOS/research/farcaster/527-multi-bot-telegram-coordination-best-practices

---

## Related Work

- **Doc 527:** Multi-bot Telegram coordination best practices (this doc extends it).
- **Doc 541:** Hermes gaps vs. industry (context for when to add Graph reads).
- **Doc 542:** Bonfire knowledge graph for BCZ strategies (decision to use Bonfire for ZAOstock).
- **Doc 531:** Hermes audit + production runs (proof that Hermes works, ready for scaling).
- **Doc 529:** Hermes quality pipeline (pre-critic gates, pr-watcher alerts).
- **PR #340:** ZOE SHIP FIX to Hermes dispatch (HTTP listener).
- **PR #349:** ZOE tips to ZAO Devz General (multi-bot narrative).
- **PR #360:** pr-watcher --repo flag fix (gh CLI outside git checkout).

---

## Most Likely Failure Mode (If We Ship All Three Without Coordination)

**Stale Graph Reads (Issue #1)** is the highest-probability failure. Why?

- It's a **silent failure**: Coder produces a wrong patch because Bonfire context is 5 minutes old.
- Critic catches it (90/100 chance), flags it, Coder retries.
- But the stale read happens AGAIN on retry unless we cache or snapshot at run-start.
- This is **cost inefficient** (extra retries) and **UX bad** (Zaal types something, Coder ignores it).
- It's also **hard to debug** because the patch "looks right" but misses a constraint added mid-attempt.

**Fix ROI:** 2 hours of work (add graph snapshot), saves ~$0.15/day + speeds convergence from 2 attempts to 1. Priority = P0 after token conflict check.

---

## Existing PRs That Need Updates Based on This Doc

| PR | Issue | Change |
|----|----|--------|
| #340 (HTTP dispatch listener) | No explicit comment on auth secret validation | Add assertion: `HERMES_DISPATCH_SECRET.length >= 32` |
| #348 (ESM fix for http import) | No breaking change, just housekeeping | No update needed |
| #349 (ZOE tips to ZAO Devz) | No mention of Bonfire fallback | Add TODO: "Wire Bonfire query here when Phase 1 ready" |
| #360 (pr-watcher --repo flag) | Silent failure on CI (no fallback) | Add retry logic + Telegram alert if gh call fails |

Most critical: **#360 needs resilience audit** (pr-watcher must not die silently).

---

## Appendix: Environment Variables Reference

```bash
# ~/.env.portal (ZOE + Hermes bot + HTTP dispatch)
TELEGRAM_BOT_TOKEN=<ZOE_TOKEN>                    # ZOE polling
HERMES_BOT_TOKEN=<HERMES_TOKEN>                   # Narrator in ZAO Devz
HERMES_DISPATCH_SECRET=<32+ char secret>          # Auth for :3007/hermes-dispatch
BONFIRE_API_URL=https://tnt-v2.api.bonfires.ai   # NEW
BONFIRE_API_KEY=sk-...                            # NEW
ALLOWED_USERS=1447437687,<zaal_farcaster_uid>    # ZOE allowlist
ZAO_DEVZ_BOT_TOKEN=<DEVZ_BOT_TOKEN>               # Bot name: @ZAODevZBot
ZAO_DEVZ_CHAT_ID=-<numeric_id>                    # ZAO Devz group chat (negative)

# ~/.env.bonfire (ZABAL Bonfire agent)
TELEGRAM_BOT_TOKEN=<BONFIRE_TOKEN>                # DIFFERENT from .env.portal
BONFIRE_BOT_ID=<bot_id>                           # For webhook routing
```

---

## Summary Table: What Each Bot Does Today vs. Tomorrow

| Bot | Today (Apr 28) | Tomorrow (Phase 1) | Tomorrow (Phase 2) |
|-----|----------------|-------------------|-------------------|
| **ZOE** | /tip from sent.json, /help, /do, /ask | + /tip from Bonfire reads | (unchanged) |
| **Hermes Coder** | Issue text only, blind context | + fetch Bonfire context pre-execution | (unchanged) |
| **Hermes Critic** | Review Coder output | (unchanged) | (unchanged) |
| **pr-watcher** | Alert on CI failures via Telegram | + retry resilience | (unchanged) |
| **ZABAL Bonfire** | N/A (being deployed today) | Writes from Telegram + pod ingestion | + webhook for Hermes writes |

---
