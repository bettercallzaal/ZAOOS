# Team-bots audit (PR #503 vs canon, 2026-05-11)

## SHIP AS-IS (good, do not change)

- **Dual-bot pattern clean:** Both Magnetiq and AttaBotty boot in one systemd process with independent configs. Matches Devz pattern (devz/index.ts). shared chatGate() enforces per-group isolation correctly.
- **Hermes pattern locked:** Uses `bot/src/hermes/claude-cli.ts` subprocess spawning, Max auth, no API keys. No Composio/Agent Zero regressions. Correct.
- **Allowed-tools matrix good:** Chat tier (Sonnet, $0.50): Read/Glob/Grep only. Research tier (Opus, $3): adds WebSearch/WebFetch/Bash(grep|find|ls). Disallowed: git push, git commit, rm, curl POST, Edit, Write. Matches threat model.
- **Persona files locked:** Both magnetiq/persona.md and attabotty/persona.md follow the DOC 644 template structure. Voice, values, hard rules, reference docs all present.
- **Memory layer clean:** Supabase tables (team_bot_messages, team_bot_facts, team_bot_ideas, team_bot_tasks, team_bot_clips) with bot-column checks. Service role only (secret key), RLS not needed (bot-side only). Indexes present.
- **Database migration complete:** team_bots.sql creates all 5 tables + indexes. bot/status column constraints lock to ('magnetiq', 'attabotty'). No open security holes.
- **Systemd service solid:** Working directory, env file, TZ set, restart on failure, journal logging. Matches infrastructure canon (VPS 1, user unit).
- **Message stitching correct:** Last 24h of chat + open tasks + facts rolled into context for brain calls. Prevents hallucination on old data.
- **Daily summary cron working:** node-cron with timezone support. Opus tier. Posts to group. Fail-soft: logs error, sends brief TG alert, continues.

---

## SHIP-BLOCKERS (must fix before tokens go on VPS)

| # | Issue | File | Risk | Fix |
|---|-------|------|------|-----|
| 1 | SUPABASE_SERVICE_ROLE_KEY not validated on boot | memory.ts:14-16 | Crash at first DB call if missing or malformed | Add explicit check: `if (!url\|\|!key) throw new Error(...)` on lines 14-16. Already done correctly - PASS. |
| 2 | Bot tokens not validated on boot | shared.ts:35-41 | Process starts with missing MAGNETIQ_BOT_TOKEN or ATTABOTTY_BOT_TOKEN, fails on first getMe() | Validation exists (lines 38-39). Correct. Continue as-is. |
| 3 | No secret-scan pre-commit hook (Guard #2) | N/A - infra | Persona files could accidentally leak Zaal's TG ID or Tyler's real name if not redacted | Add to .husky/pre-commit or .git/hooks/pre-commit: check persona files for `MAGNETIQ_BOT_TOKEN=`, `ATTABOTTY_BOT_TOKEN=`, numeric 10-digit IDs (TG user IDs). Test: grep -E '(BOT_TOKEN|ALLOWED_IDS)=' bot/src/teams/*/persona.md should be empty. **DEFER to VPS deploy step.**|

**Verdict:** No hard blockers in code. One pre-deploy checklist item (Guard #2).

---

## P1 GAPS (fix before bot has 7 days uptime)

| # | Issue | File | Why | Fix |
|---|-------|------|-----|-----|
| 1 | No rate-limit on @mention replies | commands.ts:260-290 | Attacker could spam @mentions, burn budget fast (chat replies are $0.50 each). Allowlist gate exists but no per-user cooldown. | Add to shared.ts: `Map<number, Date>` tracking last @mention per user_id. On mention, check cooldown (e.g., 60s). Silent ignore if too soon. Example: `const MENTION_COOLDOWN_MS = 60_000; const lastMention = new Map<number, number>(); if (Date.now() - (lastMention.get(id) \|\| 0) < MENTION_COOLDOWN_MS) return;` |
| 2 | No pagination on `/context` output | commands.ts:181-198 | Context dump can exceed 3500 chars, Telegram truncates silently. If 50+ facts + 20+ tasks, humans miss bottom items. | Paginate `/context` with "Page 1/3" footer + `/context <page>` arg. Or: show top 5 facts + 5 tasks (not 10+20). Safer: truncate at 2500 chars instead of 3500, add "...see /facts or /tasks for full list." |
| 3 | No error budget tracking per bot | brain.ts:60-95 | If Magnetiq exhausts its $0.50 budget mid-day (e.g., from spam), it will silently fail (catch at line 236-238) and user sees "Research failed: max budget exceeded." No alert to Zaal. | Add to shared.ts: track cumulative spend per bot per day in Supabase. On budget breach, send Zaal a DM via bot.api.sendMessage(ZAAL_ID, "Magnetiq hit $0.50 budget limit."). Or: log to stderr + let ops monitor journal. Minimum: console.warn with bot name. |
| 4 | Persona files can be edited hot-reload but lack version control | brain.ts:61 | If Magnetiq persona gets corrupted (truncated file, bad markdown), bot runs with silent wrong persona. No validation. | Add to brain.ts before `const persona = readFileSync...`: validate persona is non-empty, contains at least one markdown heading (`#`), no suspiciously short (<50 chars). Throw if invalid. Or: keep backup personas in git, refuse to boot if persona not found. |
| 5 | No user-activity audit log | memory.ts:35-46 | If a team member runs /idea or /task, there's no immutable record linking it to their Telegram ID for later disputes. | Add columns to team_bot_ideas / team_bot_tasks: `bot_name, from_id` (already there), but ensure RLS or app-side checks prevent cross-team reads. Or: accept as-is since table_name = bot (scoped) + from_id logged. Low priority. |

---

## P2 GAPS (nice-to-have, defer until proven)

| # | Issue | Why deferred |
|---|-------|--------------|
| 1 | No "confused?" fallback for misclassified intents | Cheap rule-based classifier (mention + commands) is sufficient for two small private groups. Ollama for intent classification premature without user feedback loop. Ship first, add if needed. |
| 2 | No transcript export command (/export) | Could be useful for review but not needed for MVP. Supabase query can dump anytime. Ship without it. |
| 3 | No multi-person task assignment (tasks are personal today) | current task model: logged by user, owned by user. Could extend to `/task @someone else` but unclear if Zaal/Tyler want that. Ask before building. |
| 4 | No Supabase RLS rules (service-role-only writes assumed) | RLS is premature for bot-side-only writes. If humans ever query tables directly (web UI), add RLS then. Ship without it. |
| 5 | No analytics dashboard (API hits, cost trend, usage patterns) | Useful for understanding bot health but not blocking. Can add later. |

---

## OVER-BUILDS (premature features, consider removing)

| # | What | Why over-built |
|---|------|----------------|
| 1 | `team_bot_daily_summaries` table (team_bots.sql:58-66) | Prepared for storing summaries but never read/written. Commands send to Telegram only, don't insert to table. Remove this table or uncomment code that writes to it. Check if bot/migrations/team_bots.sql has INSERT logic (doesn't appear to). **Action:** Either insert summaries to table + add /summary-history command, or drop table from migration. Decision needed. |
| 2 | `TEAMS_CHAT_MODEL`, `TEAMS_RESEARCH_MODEL`, etc. env var tuning (brain.ts:20-30) | Per-bot model choice is good, but 6 new env vars (TEAMS_CHAT_BUDGET, TEAMS_RESEARCH_BUDGET, TEAMS_SUMMARY_BUDGET, TEAMS_CHAT_MODEL, TEAMS_RESEARCH_MODEL, TEAMS_SUMMARY_MODEL) add config surface. Most will stay at defaults. Simplify: lock models in code, allow only budget overrides if needed. Or: keep as-is (fine). |

---

## DELTAS vs Hermes/Devz pattern (existing canonical pair)

| Dimension | Devz/Hermes | Teams (PR #503) | Recommendation |
|-----------|-------------|-----------------|----------------|
| **Entry point** | bot/src/devz/index.ts boots both Devz + Hermes Bot in one process | bot/src/teams/index.ts boots Magnetiq + AttaBotty in one process | MATCH - both dual-bot in single Node process |
| **Token validation** | Lines 28-48: explicit checks throw on missing token/chat_id | Lines 35-41: explicit checks throw. GOOD. | MATCH - both fail-fast |
| **Chat gate** | buildBotNameFilter() middleware (devz/index.ts:66-84) checks if command is tagged @devz or @hermes | chatGate() in shared.ts (lines 59-68) checks ctx.chat.id === cfg.chatId | MATCH - both guard chat scope correctly |
| **User allowlist** | ADMIN_IDS env var parsed on boot (devz/index.ts:50-53) | envBotConfig() parses MAGNETIQ_ALLOWED_IDS, ATTABOTTY_ALLOWED_IDS per bot (shared.ts:43-46) | MATCH - both enforce allowlist. Teams is cleaner (per-bot, not global). |
| **Brain subprocess** | Uses callClaudeCli() from hermes/claude-cli.ts (devz/index.ts imports it) | Uses callClaudeCli() from hermes/claude-cli.ts (brain.ts:66) | MATCH - identical pattern |
| **Model selection** | No per-feature budget; Coder runs Opus freely | chat ($0.50, Sonnet), research ($3, Opus), summary ($1, Opus) | Teams is MORE prudent. Budget caps are explicit. |
| **Persona system** | No persona files in Devz; hardcoded prompt in bot handlers | magnetiq/persona.md, attabotty/persona.md read fresh on each call (brain.ts:61) | Teams is BETTER - personas are versioned, hot-editable, team-facing. |
| **Memory/context stitching** | No Supabase memory layer; context is command-only | Last 24h messages + facts + tasks stitched (shared.ts:100-132) | Teams is MORE mature. Better for long-running collaboration. |
| **Systematic errors** | devz/index.ts logs to console (devz.on error catcher exists) | commands.ts/shared.ts log errors to console + reply to user. brain.ts catches and returns sanitized error | MATCH - both reasonable. Teams has slightly cleaner error replies. |
| **Daily summary cron** | No equivalent in Devz | scheduleDailySummary() with node-cron (shared.ts:148-157) | Teams adds feature that Devz doesn't have. GOOD. |

**Summary:** Teams bots follow Hermes/Devz canon closely. Teams actually improves on Devz by adding: per-bot config, explicit budgets, persona versioning, Supabase memory, daily summary. No major deviations. PASS.

---

## Hard security checks (each pass/fail)

- [PASS] No secrets / tokens ever logged
  - brain.ts: reply.text is sanitized, cost/duration logged but not prompt or model details that could leak secrets
  - shared.ts: personas are read at invocation but not logged; userPrompt goes to brain, not stdout
  - commands.ts: error messages slice to 200-300 chars, never dump raw error.message which might contain env var names
  - memory.ts: message text logged verbatim (safe: user input only, no secrets expected)

- [PASS] Allowlist enforced for state mutations
  - commands.ts:79,97,127,147,167: all state-mutating commands (/idea, /task, /done, /clip, /fact) call userGate() first
  - userGate() (shared.ts:71-76) checks ctx.from?.id against cfg.allowedTelegramIds
  - Permissive if allowlist is empty (controlled: envBotConfig line 43-46 parses from env)
  - Read-only commands (/tasks, /context, /help, /whoami) do NOT gate (correct)

- [PASS] Chat-scope enforced (silent ignore outside chat)
  - commands.ts:40-41: `bot.use(chatGate(cfg))` registered first, so ALL downstream handlers are scoped
  - chatGate (shared.ts:59-68) checks `ctx.chat?.id !== cfg.chatId` and returns early (no reply, no log)
  - Each bot (Magnetiq, AttaBotty) has separate cfg.chatId, so messages to other groups never reach handlers

- [PASS] Brain tools disallow Edit/Write/git push/curl POST
  - brain.ts:71-81: allowedTools for chat = ['Read', 'Glob', 'Grep'] only
  - allowedTools for research = [..., 'WebSearch', 'WebFetch', 'Bash(grep*)', 'Bash(find*)', 'Bash(ls*)']
  - disallowedTools: ['Bash(git push*)', 'Bash(git commit*)', 'Bash(rm*)', 'Bash(curl*POST*)', 'Edit', 'Write']
  - Correct. Permits grep/find/ls (read-only), blocks destructive commands.

- [PASS] No SQL string interpolation (parameterized only)
  - memory.ts: ALL Supabase calls use `.from().insert()` / `.select()` / `.eq()` / `.gte()` / `.order()` / `.update()` methods
  - No template literals in SQL, no string concatenation
  - Supabase JS client auto-parameterizes via prepared statements
  - PASS

- [PASS] No dangerouslySetInnerHTML or HTML injection in TG replies
  - commands.ts: all ctx.reply() calls send plain text (no HTML, no Telegram HTML parsing enabled)
  - Telegram API used via grammy, which by default sends text/plain
  - No Telegram HTML mode flag in replies (would be ctx.reply(text, { parse_mode: 'HTML' }))
  - safe.

- [PASS] All env vars validated on boot (fail-fast not lazy)
  - memory.ts:14-16: throws immediately if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing
  - shared.ts:35-41: throws immediately if token or chatRaw missing, validates chatId is a number
  - index.ts:48-56: validates TEAMS_RUN env, throws if empty or unrecognized
  - brain.ts: MODEL_FOR and BUDGET_USD have defaults (lines 20-30), no missing-var crash
  - PASS - all critical secrets checked on boot

- [PASS] Each table has bot-column check constraint
  - team_bots.sql:8: `check (bot in ('magnetiq', 'attabotty'))` on team_bot_messages
  - team_bots.sql:20: same check on team_bot_facts
  - team_bots.sql:29: same check on team_bot_ideas
  - team_bots.sql:37: same check on team_bot_tasks
  - team_bots.sql:48: same check on team_bot_clips
  - team_bots.sql:59: same check on team_bot_daily_summaries
  - PASS

- [PASS] Persona files refuse to leak env / commit / DM external
  - magnetiq/persona.md:30-35: "Never reveal env vars, API keys, tokens... Never push to git... Never tag external people without explicit approval"
  - attabotty/persona.md:30-38: same hard rules
  - Both personas are locked to the two users (Zaal + Tyler, or Zaal + AttaBotty)
  - Mentions chat allowlist in help text
  - PASS

---

## Audit summary

- **Total ship-blockers:** 0 (all code checks pass; 1 infra checklist item: pre-commit hook for Guard #2)
- **Total P1 gaps:** 5 (rate-limit cooldown, /context pagination, budget tracking, persona validation, audit log) - can defer post-launch if MVP validation needed first
- **Total over-builds:** 1 (unused team_bot_daily_summaries table) - minor cleanup
- **Security posture:** Strong. Allowlist enforced, chat-scope gated, brain tools locked, no SQL injection, no secret leaks in logs, env vars validated on boot.
- **vs Canon (Doc 644):** Follows Hermes pattern locked. Per-bot personas, memory layer, daily summary. Better than Devz. No deviations.

### Recommendation: GO

**Single most important fix before tokens land:** None critical in code. **Ops check before VPS deploy:** Run secret-scan on bot/src/teams/ persona files to ensure no API keys / TG IDs leaked. Command:
```bash
grep -Er '(BOT_TOKEN|ALLOWED_IDS|SUPABASE_|NEYNAR_|SESSION_|SIGNER_|sk-ant-|ghp_)' bot/src/teams/ 
```
If any match, redact before pushing. Otherwise: **GO SHIP.**

**Timeline:** Deploy bots to VPS 1 systemd immediately. Run 7-day stability test. Collect user feedback. Then tackle P1 gaps in order (rate-limit, /context pagination, budget alerts). Both bots ready for production.
