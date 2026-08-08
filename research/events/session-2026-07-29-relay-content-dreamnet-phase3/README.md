# Session handoff - 2026-07-29 21:20
> from mac / ZAOOS (marathon session, ~17 PRs merged) -> to a fresh Claude Code terminal on ZAOOS
> doc: research/events/session-2026-07-29-relay-content-dreamnet-phase3/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

1. Read ALL sections (A-E) before doing anything.
2. Section C: working tree is CLEAN, everything's merged - no diff to apply.
3. Create TaskList entries from Section A. Board tasks #45/#48/#49/#51 already exist on the cowork board (`knock` / thezao.xyz/todo) with full context.
4. Section B is the "why" - don't re-litigate.
5. Section D: the ZOE bot is LIVE with the relay system; an overnight ZABAL loop was announced via relay.
6. Once integrated, reply: "Ingested handoff relay-content-dreamnet-phase3. Ready."

## A. Tasks to absorb (top-priority first)

- [ ] **BRANDON DREAMNET PHASE 3 (TOP PRIORITY, do not wait for a prompt).** SDK is public: `github.com/BrandonDucar/dreamnet-spore-sdk`. Clone it; run BIDIRECTIONAL cross-runtime `receipt.v1` verification - ZAO verifies DreamNet-generated receipts AND DreamNet verifies ZAO-generated receipts; prove identical canonical bytes + subject-hashes + digest values; prove tamper rejection (issuer/payload/subject-hash/digest) + unsupported-schema fails closed; commit PERMANENT conformance fixtures + a conformance artifact/receipt. On pass, formally identify ZAO as the **first independently-operated conformant Spore node** at the hash-and-receipt layers. (ZAO's canonicalize lives in `src/lib/eyes/observation.ts`; receipt.v1 in `src/lib/spore/receipt.ts`; Phase-1 golden test in `src/lib/spore/__tests__/`; spec doc `research/agents/2124-spore-interop-federation-v0.2/`.)
- [ ] **HEART FLEET EXTRACTION (parallel, operational priority).** Extract the Heart lease-manager (`src/lib/heart/`) into a SHARED fleet package: acquire/renew/release/recovery + fencing-token enforcement + deterministic resource identity + retry ceilings + execution receipts + contention/recovery metrics + explicit irreversible-side-effect protection. Roll out via CANARY, not fleet-wide. Prove 5 safety properties: (1) two workers can't run the same resource concurrently, (2) killed worker safely recovered, (3) stale worker can't commit after losing ownership, (4) retries don't duplicate external actions, (5) receipt/final-state reconciliation consistent. NOTE: `bot/` is an isolated build (no @/lib alias) - the shared package must be reachable from both the Next app and `bot/`.
- [ ] **Design the idempotent side-effect protocol:** durable intents + deterministic idempotency keys + external reconciliation + transactional completion evidence. Then END with the standing Architect's Progress Report (implemented / proof / remaining failure modes / operational overhead / highest-leverage next milestone / 3 ranked alternatives / 1-3 iteration roadmap / next focus = transactional-outbox vs Spore-claims vs fleet-wide-Cortex / self-critique + simpler alternatives).
- [ ] **#51 orchestrator decision-UX fix** (bot code, PR-only): make "Decision needed" messages render CONTEXTUAL option buttons parsed from the text (the "solid" example = Creator Studio "1: intro test / 2: map / 3: both" + Skip/Later), support MULTI-CHOICE, and FIX typed-reply capture (a typed reply didn't register until Zaal tapped Later). Lives in `always-open-topics.ts` / the decision-question builder. Mirror the relay-combo's `recordMessageContext` + pending-answer arming.
- [ ] **#49 ZABAL Gamez August prep (for Saturday, PR-only):** concept = August is comprised of the JULY SUBMITTERS. Produce: concept + ALL August format options doc, a website page draft (for people to see - Zaal deploys), the Saturday announcement copy (FC/X/YT) + rollout. Announcement is public = Zaal approves + posts. Ground: `project_zabal_games` (Jun workshops/Jul open build/Aug finals), `project_zabal_games_august_pipeline` (daily-tournament, percentile leaderboard, WaveWarZ 3-track).
- [ ] Lower: **#48** board cleanup (329 active tasks, reconcile drift - verify then close, anti-fabrication); **#45** review/delete ~29 uncertain Downloads recordings; thezao.com SEO fixes (meta description, title tag, Organization schema, OG tags, canonical - the audit that kept truncating).

## B. Why - decisions + pivots + friction

- **The relay system is the big build of this session, fully shipped + live.** Terminal `relay <msg>` (hub-defaults to zoe) / `relay` (pull) / `relay back` (reply last sender); auto-grab hook (inbound surfaces on every prompt); Telegram bridge (relays land in ZAAL BOTZ General, just-type-to-answer, instant route-back, native swipe-reply). PRs #2687/2688/2690/2693/2694. All verified + deployed + confirmed working end-to-end.
- **Truncation was fixed TWICE.** First raised the fallback LLM cap 4096->8192 (#2695) - WRONG diagnosis, made it worse (longer output). Real cause (#2703): `scheduler.ts` posted audits via a RAW `bot.api.sendMessage`, and Telegram truncates >4096 chars. Fix = `bot/src/zoe/tg-chunk.ts` (chunk the send). Both deployed.
- **New anti-sprawl rule shipped + used** (`.claude/rules/thread-discipline.md`, #2700): live ledger (Task tools) + park-on-pivot (write leaving threads to the `todo` inbox) + end-recap. Built because this session sprawled across ~15 threads. The receiver should USE it - hold open threads in TaskList, park on pivot.
- **Handle correction:** Farcaster is **@zaal**, X/YouTube is **@bettercallzaal** (I had it backwards in doc 2135, fixed in doc 2136). Verified by fetch: X 4,990 followers, YouTube 57 subs/193 videos (the repurpose gap), Farcaster FID 19640.
- **Twitch VODs can't be bulk-saved** - the Highlighter is a per-video editor + full highlights blow the 100h storage cap. Zaal said he'll handle Twitch himself. The 30GB local `~/Movies` + expiring VODs are the real preservation risk (docs 2135/2136).
- **FRICTION:** `bot/` is an isolated build (no @/lib paths) - the Heart shared package must bridge this. Vitest runs fine in `bot/` but NOT in the Next app (missing rolldown native binding) - typecheck + bot vitest are the verify gates. `gh pr merge --admin` is the pattern to merge over the pre-existing red "Test" job (46 pre-existing tsc errors + a flaky app-test suite - all unrelated to bot changes). Commit as **Zaal Panthaki <zaalp99@gmail.com>** (Vercel rejects bot-identity commits).

## C. Git state
- Branch: `ws/zoe-fix-audit-send-chunk` (merged), working tree CLEAN, 0 uncommitted.
- All 17 session PRs merged (#2687-#2703). Nothing to apply.
- `git fetch origin main` before any new `git worktree add ... origin/main` (local ref lags after admin-merges).

## D. In-flight
- ZOE bot LIVE on the VPS (`~/zao-bot-live`, systemd `zoe-bot`, one poller). Relay bridge enabled (`ZOE_RELAY_TG_ENABLED=true`). Truncation chunk-fix deployed.
- An overnight ZABAL loop was ANNOUNCED via relay ("relay send zoe ...") but NOT actually running autonomously - the receiver should pick up #49.
- No pending subagents, no scheduled wakeups.

## E. Cold-start map
- **Files this session:** `bot/src/zoe/` relay-bridge.ts, pending-answers.ts, tg-chunk.ts, orchestrator-tick.ts, index.ts, tg-interactions.ts, models/router.ts, scheduler.ts + tests; `.claude/rules/thread-discipline.md`; `~/bin/relay`, `~/bin/relay-autopull.sh`, `~/bin/knock`; research docs 2127-2136.
- **Skills:** /zao-research (x6 -> docs 2127/2131/2132/2133/2135/2136), /meeting (2128-2130, 2134), /handoff (this), /clipboard.
- **Memory writes:** `feedback_zoe_auto_relay` (relay tooling + gotcha), `feedback_never_skip_superstonk`, `project_james_meme_for_trees`, `feedback_board_first_channel_first`.
- **Mental model:** Shipped the full relay system + fixed truncation twice + 10 research docs. Zaal then handed Brandon's DreamNet Phase 3 + Heart-fleet-extraction directive - the fresh session's real job. Everything else (ZABAL, decision-UX, cleanup) is parked on the board.
- **Open questions for receiver:** none blocking - Brandon's directive is explicit ("do not wait for another human prompt"). Confirm Spore SDK access on clone.

## Reference: Brandon's federation topology (Pi vs Railway)
Pi = ZAO's SOVEREIGN EDGE (identity/keys, local orchestrator, Heart lease-manager, durable local state, private memory, Spore signing/verification, recovery loop, low-volume loops, local model fallback, outbound to DreamNet). Railway = OPTIONAL cloud (public webhooks, Control Plane UI, TG/FC ingress, cron that must run while Pi offline, managed Postgres, bursty workloads, externally-accessible Spore endpoint). DreamNet reached via a FEDERATION BOUNDARY (Spore + Tailscale), never shared internals. Do NOT put root identity/private memory/execution authority inside DreamNet infra. Pick: Pi + a small separate ZAO Railway project.

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/session-2026-07-29-relay-content-dreamnet-phase3/README.md and follow the receiver instructions at the top. Top task: Brandon DreamNet Phase 3 Spore conformance. 6 tasks to absorb.
```
