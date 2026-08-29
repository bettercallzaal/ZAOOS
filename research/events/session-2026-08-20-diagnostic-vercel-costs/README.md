# Session handoff - 2026-08-20 15:30
> from MacBook Air, ZAO OS V1, branch ws/research-2351-zen-adoption-workflow -> to ZOE (via Bonfire + cockpit inbox)
> doc: research/events/session-2026-08-20-diagnostic-vercel-costs/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. If section C has a diff, decide: apply it or note it for later.
3. Create TaskList entries from section A. These are the "to do" items.
4. Use section B as your "why" - do NOT re-litigate decisions captured there unless new info surfaces.
5. Use section D to know what's still running.
6. Use section E as your cold-start map for files, skills, memory state.
7. Once integrated, message back: "Ingested handoff diagnostic-vercel-costs. 5 tasks queued. Ready."
8. If you /handoff later, your new bundle's chain: field points BACK to this bundle's path.

## A. Tasks to absorb (paste these into your TODO list)

- [ ] ZAO free-tier Vercel dig - BLOCKED on Zaal: either a Keychain allow so Claude can import Arc's vercel.com cookies via gstack /browse, or a Vercel account token created in Arc and stashed locally (path and mode held in the private tracker). Goal: name which route burns the free account's invocation and Fluid CPU budget (suspect: bot polling of thezao.xyz API routes).
- [ ] Verify zpoidh deploy rate dropped after PR #90 merge (was ~25/day, expect max 4/day; check `npx vercel ls zpoidh` timestamps after 2 cron ticks, cron is 30 */6 * * *).
- [ ] Identify the outlier-cost Claude session - `zao-spend --by-lane` names the working dir; one ZAOOS session's 24h list-price spend is far outside the normal band (figures held in the private tracker). Decide if that loop's output is worth its burn.
- [ ] Review/merge doc 2351 PR #3209 (Zen adoption) if the docs auto-merge contract has not already taken it.
- [ ] Zen follow-through from doc 2351 Next Actions: Zaal sets up 4 brand Workspaces (by Aug 22), applies doc 796 telemetry hardening (by Aug 24); Claude drafts the ZAO navy/gold Zen Mod for theme-store (by Sep 5).

## B. Why - decisions + pivots + ruled-out paths

- Vercel Pro overage root cause was BUILD CPU, not runtime: the ZAOOS ignore-guard failed open because Vercel's shallow clone rarely contains VERCEL_GIT_PREVIOUS_SHA, so every docs-only commit built (~$22/mo, 94% of zaoos spend). Fixed in ZAOOS PR #3147 (fetch the SHA, fall back to HEAD^, log every decision). VERIFIED working: all deployments since merge show Canceled at 9-13s.
- zpoidh hourly deploys were price churn, not timestamp churn: 64 amount_usd fields recomputed hourly from CoinGecko. The -I timestamp filter in zpoidh PR #90 is nearly a no-op; the 6h cron is the real lever. Merged with corrected analysis in PR comment. Countdown-freshness assumption flagged: countdowns render client-side; if one freezes, drop the cadence back.
- Vercel migration REJECTED: post-fixes the bill lands inside the $20 Pro credit. Cloudflare/OpenNext risk (XMTP WASM, iron-session, 324 routes) exceeds savings. VPS self-host stays the answer for the ZAO FREE account's runtime overage (point bot pollers at the VPS), not for builds.
- Build machines set to Elastic (auto-scales from Standard) on zaoos/zpoidh/sparkz; spend cap set on the Pro account. sparkz's $5.15 was a one-time Jul 28 dev burst - no chronic leak, no action.
- Settings lost-update mechanism CONFIRMED: Claude Code rewrites the whole settings.json from memory on any toggle; a stale long-lived session's toggle reverts external changes (wiped dotfiles PR #31 on Aug 18; caught benignly again Aug 20 via /remote-control rewrite). Rule now in memory: toggle only in fresh sessions, push dotfiles immediately. Dotfiles synced clean as of this session.
- Zen browser: adopted as Zaal's HUMAN browser only. Automation stays on Arc/Chrome because Claude-in-Chrome + gstack /browse cookie import are Chromium-only. Do NOT uninstall Arc/Chrome. Fork verdict unchanged (SKIP, doc 817); cheap win is a ZAO-branded Zen Mod.
- Friction sources hit this session: (1) Vercel API token at ~/Library/Application Support/com.vercel.cli/auth.json returned 403 on v6/deployments the day after working - CLI `vercel ls` still works, prefer it; (2) Arc cookie import fails until Zaal grants Keychain access; (3) doc number 2343 was claimed mid-write by another lane - step 7.5 re-check caught it, renumbered to 2351 with a gap; (4) deny rule Bash(git push origin main*) blocks dotfiles pushes from ZAOOS-project sessions - `git -C ~/zaal-dotfiles push origin main` form worked after explicit user approval.

## C. Git state

- Branch: `ws/research-2351-zen-adoption-workflow` (pushed, PR #3209 open)
- Push status: pushed
- Uncommitted in working tree: `.claude/settings.json` (removes 2 dead Write-deny lines that caused startup warnings - Edit rules cover Write since CC 2.1.234). Small, intentional, not yet PR'd.
- Untracked: none relevant.

## D. In-flight

- Background bash jobs: none.
- Subagents pending: none.
- Scheduled wakeups: none.
- Open AskUserQuestion: none. Open user-action: the ZAO-Vercel access (section A task 1).

## E. Cold-start map (read if you are confused)

- Files touched this session: research/dev-workflows/2351-zen-browser-adoption-workflow/README.md (new doc), research/dev-workflows/README.md (index row), .claude/settings.json (dead deny lines, uncommitted), ~/zaal-dotfiles/claude/settings.json (protections restored + committed + pushed), scripts/vercel-ignore.sh (via merged PR #3147), zpoidh .github/workflows/refresh-bounty-dashboard.yml (via merged PR #90), memory: project_settings_lost_update.md (new).
- Skills invoked: /zao-research (doc 2351, shipped), /handoff (this bundle), /clipboard (Vercel steps page), /browse (Arc cookie attempt, blocked on Keychain).
- Memory writes: project_settings_lost_update.md - new - the settings rewrite-from-memory race + how to avoid it.
- Last-known mental model: Two-day diagnostic arc closed out the Vercel Pro overage (build-side, fixed and verified) and hardened the dotfiles/settings pipeline. Remaining unknown is the ZAO FREE Vercel account's runtime overage, blocked on account access. Zen adopted as human browser; automation split documented in doc 2351.
- Open questions for the receiver: Which access route does Zaal prefer for the ZAO Vercel account (Keychain allow vs token)? Is the outlier-cost session a sanctioned loop?

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/session-2026-08-20-diagnostic-vercel-costs/README.md and follow receiver instructions at the top. 5 tasks to absorb.
```
