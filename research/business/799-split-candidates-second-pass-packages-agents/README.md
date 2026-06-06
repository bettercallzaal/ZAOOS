---
topic: business
type: strategy
status: research-complete
last-validated: 2026-06-06
related-docs: "797, 794, 601, 796, 643"
original-query: "go deeper into what we can split into new repos"
tier: STANDARD (two independent sub-agents — bot/ agent stack + package-extraction survey — over doc-797's product-only first pass)
scope: "second-pass split analysis at THREE altitudes — product graduations, npm/library extractions, and whole-client fork-template — covering the surfaces doc 797 never assessed (bot/ stack, shared libs)"
---

# 799 — Split candidates, second pass: agents, packages, and the fork-template

> **Goal.** Doc 797 asked one question — "what can become its own app + DB + domain?" — and found one clean product candidate (Respect/Governance). Going deeper reveals two altitudes 797 never looked at: **(B) reusable npm packages** that publish-and-consume-back (no DB/domain needed), and **(A′) the `bot/` agent stack**, which is already a structurally separate workspace. Plus **(C) the meta-move**: ZAOOS itself as a forkable community-client template. The big insight: the most valuable "splits" aren't products leaving — they're *packages* extracting, which is what unblocks the products.

## The three altitudes

| Altitude | What "split" means | DB/domain? | Best candidates |
|---|---|---|---|
| **A — Product graduation** | Own repo + DB + domain; code deleted from ZAOOS, routes redirect | Yes | Respect/Governance (doc 797), **Hermes** (new) |
| **B — Package extraction** | Published npm package, consumed back by ZAOOS + others | No | publish lib, audio player, `neynar` wrapper, `openrank`/`ordao` readers, `claude-cli` |
| **C — Fork template** | ZAOOS itself becomes a boilerplate others clone + reconfigure | N/A | the gated Farcaster client (via `community.config.ts`) |

---

## Altitude A — Product graduations (updated)

Doc 797 stands: **Respect/Governance** is the #1 product spinout; Music/Spaces are not-yet (coupling); WaveWarZ is already external. The new entry from the `bot/` assessment:

### Hermes — the strongest OSS-tool candidate in the whole repo
`bot/` is **already a structurally separate workspace** — own `package.json`/`node_modules`/`tsconfig`/`migrations`/`systemd`, excluded from the root `tsconfig.json:33`, and **zero imports into the main app**. It could be `git filter-repo`'d into its own repo today. But it's not three independent bots — it's **one shared substrate (Hermes) with four consumers** (ZOE, Devz, Teams, the root ZAOstock bot).

- **Hermes** (`bot/src/hermes/`, ~1,965 LOC, 11 files) — an unattended coder→critic→auto-PR bot: clones a target repo into `/tmp`, Claude writes a minimal patch, a second Claude pass critiques (≥70 to pass, 3 retries), then commits/rebases/pushes and opens a PR via `gh`. **Repo-agnostic by design** (`HERMES_REPO_PROFILES`, `git.ts:78-91`; `HermesRepoTarget` type) — only ~4 ZAO-specific strings to parameterize (default repo URLs, `repoContextBlock` in `coder.ts:15-34`, `FIXER_SYSTEM` repo name, forbidden-paths). Genuine OSS hook: **"$0 marginal cost on a Claude Max plan"** (runs on Claude Code CLI OAuth, no API key — `claude-cli.ts:32-37`). **Verdict: graduate-as-OSS-tool.**
  - **Blocker:** the 4 HIGH trust issues from doc 794 (✓verified) must close before branding it "safe unattended" — critic/coder run `bypassPermissions` with bare `Bash` not denied (`critic.ts:106-114`, `coder.ts:126-155`), and the daily spend cap is an in-process global that resets on restart (`runner.ts:33-51`). Also add a secret/PII pre-commit scan (doc 794 A-M1) before open-sourcing under our own hygiene rules.
  - **Spinout shape:** Hermes + the **Devz two-bot narrator** (`bot/src/devz/index.ts`, the coder-bot/critic-bot Telegram UX — a great demo) + the **`claude-cli` wrapper** as one repo (e.g. `hermes-pr-bot`). Effort **S–M**.
- **ZOE** (`bot/src/zoe/`, ~9,671 LOC) — deeply personalized single-user (Zaal) concierge, saturated with ZABAL brand / Bonfire / Farcaster-for-ZAO. **Keep internal** (it's the opposite of self-contained — the largest consumer of the shared Hermes substrate, 13 import sites). Effort to extract: L, low payoff.
- **Devz** — pure Hermes Telegram front-end; **bundle with Hermes**, don't split.

---

## Altitude B — Package extractions (the new altitude)

These publish once and get consumed back. A package needs a clean API + low coupling, **not** a DB or domain — so this unlocks things 797 called ungraduatable. Ranked by (reusability × cleanliness ÷ effort):

| Rank | Package | LOC | Coupling OUT | Call sites IN | Effort | Verdict |
|---|---|---|---|---|---|---|
| 1 | **`openrank/client`** | 149 | none | few | **S** | strong-OSS |
| 2 | **`ordao/client`** (OREC reader) | 193 | env addresses only | moderate | **S–M** | strong-OSS |
| 3 | **`claude-cli` wrapper** (bot) | ~225 | none (bot-local) | all 4 bots | **S** | strong-OSS |
| 4 | **cross-platform publish** | 1,708 | branding strings + `ENV.X_*` | **28** | M | strong-OSS |
| 5 | **`isMusicUrl`** | 35 | 1 local type | 19 | S | strong-OSS (ships w/ player) |
| 6 | **`neynar.ts` wrapper** | 583 | `ENV` only | **56** | M | strong-OSS |
| 7 | **universal audio player** | ~1,900 | scrobble fetch + RadioProvider | **43** | M–L | strong-OSS (after de-scrobble) |
| 8 | `hats/gating` | ~660 | ZAO hat IDs | moderate | M | internal-shared |
| — | `respect/leaderboard` | 263 | Supabase + schema | moderate | L | too-coupled (keep internal) |
| — | `miniapp-quickauth` + `allowlist` | 180 | Supabase + iron-session | high | L | too-coupled (keep internal) |

### The standouts
- **Quick wins (publishable this week, config-injection only):** `openrank/client.ts` (a clean, fault-tolerant OpenRank Farcaster-reputation SDK — none exists publicly; zero `@/` imports), `ordao/client.ts` (generic OREC / Optimism-fractal governance reader, pure viem), and the bot `claude-cli` wrapper (the de-facto "Hermes-brain" every bot routes through — `bot/AGENTS.md:11` already mandates it).
- **`@zao/social-broadcast`** (cross-platform publish, `src/lib/publish/`) — "write once, post to X/Bluesky/Telegram/Discord/Lens/Hive/Threads." The single most generally-useful lib in the repo (everyone has this problem). De-coupling cost is ~10 hard-coded ZAO branding strings (`normalize.ts:56,75…`, `broadcast.ts:58-64`) → inject `{attribution, brandUrl, accountHandle, accentColor}`; leave the ZAO-specific `auto-cast.ts` behind.
- **`neynar.ts` wrapper** — 56 call sites (largest import fan-in in the repo). The **Hypersnap read-proxy failover** (`neynar.ts:24-39`, free reads via a self-hosted node, auto-fallback to paid Neynar — doc 643) is a genuinely novel pattern worth packaging. Split rule: publish `neynar.ts` (inject `NEYNAR_API_KEY`/read-base); **keep `allowlist.ts` + `miniapp-quickauth.ts` internal** (Supabase schema + iron-session bound).

### The unlock chain (why packages matter for products)
- **Audio player package → Music product graduation.** Doc 797 said Music can't graduate because the player is mounted app-wide (`(auth)/providers.tsx`, 43 consumers). Extracting `@zao/react-omniplayer` (externalize the 2 hard-coded `/api/music/scrobble` fetches at `PlayerProvider.tsx:198,215` into `onScrobble` callbacks; lift `RadioProvider` out of core) turns 43 tight in-repo couplings into one versioned package boundary — **the prerequisite to ever spinning Music out.** Highest coupling-debt reduction of any candidate.
- **`neynar.ts` package → isolates the entire Farcaster surface** from ZAOOS internals (56 call sites behind a stable API).

---

## Altitude C — The meta-move: ZAOOS as a fork-template

The highest-leverage "split" may be **not extracting anything** — but hardening ZAOOS into a **"gated Farcaster community client" boilerplate** other communities fork. The seam already exists: `community.config.ts` (325 lines: branding, channels, admin FIDs, contracts, nav) is imported by 43 files, and the security audit (doc 795/796) showed the auth/gate is already config-driven. This *is* the "clone, no deps" model CLAUDE.md describes for graduates — applied to the core client itself. A fork would swap `community.config.ts`, point at its own Supabase + Neynar + manifest, and ship. Effort to productize as a template: M (extract remaining hard-coded ZAO strings, write a fork guide, stub the lab-only surfaces).

---

## Recommended sequencing

1. **Publish the three quick-win packages** (`openrank`, `ordao`, `claude-cli`) — S effort, zero coupling debt, pure upside, and they seed a `@zao/*` npm scope.
2. **Extract `@zao/social-broadcast`** (publish lib) — high reuse, M effort, parameterize branding.
3. **Extract the audio player package** — M–L, but it's the unlock for Music; do it before any Music product spinout.
4. **Spin out Hermes** (Hermes + Devz narrator + `claude-cli`) as `hermes-pr-bot` — **after** closing the doc-794 HIGHs.
5. **Product graduations** remain a Zaal business call: Respect/Governance (doc 797 #1) and the fork-template are the two genuine product opportunities.

## Drift flags surfaced
1. **`bot/src/teams/` (Magnetiq + AttaBotty) — RESOLVED 2026-06-06: docs are stale, code is sanctioned.** Initial read flagged these as contradicting CLAUDE.md's "decommissioned 2026-05-04" list. Tracing it: the team bots are a **canon-blessed, audited surface**, NOT the decommissioned brand fleet. Evidence — they were introduced via **PR #618 (2026-05-22)**, 18 days *after* the 601 decommission, *with* the required docs: **644** (`zao-agent-stack-canon-and-team-bot-template`), **645** (`agent-canon-and-team-bots-audit` — canon locked 2026-05-11 + a security audit that found "**No hard blockers in code**"), and **646** (brand-fit audits). The "no new bots without doc" rule was followed. The apparent contradiction is a **name collision**: "Magnetiq" is on the decommissioned list as the old *10-bot brand-broadcast fleet* concept, while the new `teams/` Magnetiq is a *2-person collab pairing bot* (Zaal+Tyler) built on the doc-644 template (sibling to the Devz dual-bot pattern, generalized). **Action: do NOT delete the code. CLAUDE.md's Primary Surfaces table is the stale side** — it collapsed to 5 surfaces around the 601 cleanup (2026-05-04) and never absorbed the team-bot template that landed ~2 weeks later. Pending Zaal's call on whether to add it as a 6th Primary Surface or document it as a sub-pattern. The 645 audit's deferred P1 (no secret-scan pre-commit hook on persona files) is still worth wiring.
2. **FISHBOWLZ** (from doc 797 §Incidental): CLAUDE.md says "killed," the `/fishbowlz` skill says active synced standalone. Unresolved (out-of-repo status). Left untouched per Zaal 2026-06-06.

## See also
- `research/business/797-graduation-candidates-monorepo-split/` — first pass (products).
- `research/agents/794-hermes-trading-stack-audit/` — the Hermes HIGHs to close pre-graduation.
- `research/agents/601-agent-stack-cleanup-decision/` — what was decommissioned (Magnetiq context).
- `research/infrastructure/643-hypersnap-run-a-node/` — the read-proxy pattern in the `neynar` package.
