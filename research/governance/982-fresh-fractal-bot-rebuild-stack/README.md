---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 981, 718, 188, 975, 977
original-query: "We want to build a fresh ZAO Fractal Discord bot in a new repo instead of continuing fractalbotapril2026. Before scaffolding, research the best current architecture (persistence, onchain integration, command set), what to carry forward vs drop from the bot lineage, what gaps to close from day one, and whether any newer external fractal/Respect-game tooling exists worth adopting instead of building bespoke."
tier: STANDARD
---

# 982 - Fresh ZAO Fractal Bot Rebuild: Stack + Scope Decisions

> **Goal:** Before scaffolding a brand-new repo to replace `fractalbotapril2026`, decide the stack and lock the scope, using everything learned in [Doc 981](../981-fractal-bot-synthesis/) (the april2026 bot's actual architecture, its lineage back to v1old, and the gaps that pass audit unfixed) plus fresh 2026-07-06 research on current tooling.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Rewrite in TypeScript on discord.js v14.26.4, not Python.** | ZAO's other active surfaces (ZAOOS web app, the ZOE agent at `bot/src/zoe/` in the ZAOOS repo) are already TypeScript/Node. A TS bot can `import` the exact same Respect-scoring function the web app uses instead of maintaining a second implementation - this directly closes the "two unverified Respect formulas" gap flagged in Doc 981 section 4. |
| 2 | **Use viem (v2.54.6) for all Optimism reads/writes, not raw JSON-RPC.** | The current bot's hand-rolled `eth_call` + manual ABI encoding in `utils/blockchain.py` is exactly the code path with zero tests. viem is the current standard for new TS/Optimism projects and has first-class OP Stack chain definitions built in. |
| 3 | **Adopt `@ordao/orclient` (real npm package, confirmed live) for OREC/submitBreakout integration instead of hand-rolling the transaction again.** | The underlying `sim31/ordao` repo is actively maintained (266 commits, last push 2026-04-02) - this is the actual OREC codebase, not the stale wrapper. Do NOT lean on `Optimystics/frapps` for anything beyond the existing `zao.frapps.xyz/submitBreakout` manual-link flow - that repo has only 6 commits total and hasn't been pushed to since 2025-04-01, over 15 months stale. |
| 4 | **Keep Supabase for persistence. Do not add a JSON-file layer this time.** | ZAOOS (the main web app) is already Supabase-backed; sharing schema/auth reduces integration friction for a bot that needs to read/write the same `fractal_sessions`, `fractal_scores`, and `respect_members` tables the web app uses (Doc 981 section 5). The april2026 bot's JSON files (`data/*.json`) exist only because the bot predates full Supabase migration - a from-scratch build has no reason to reintroduce that layer. |
| 5 | **Build with tests from commit 1: Vitest + a discord.js client mock.** | The current bot has zero test files (`find . -iname "*test*"` returns nothing in the april2026 repo). The vote-threshold math and Respect-point indexing are exactly the kind of logic that silently breaks without tests - both are pure functions and trivially testable once out of Python's `discord.py` decorators. |
| 6 | **Do not adopt an external fractal/Respect-game framework - none exists.** | Searched Optimystics' full toolkit (Fractalgram, FRAPPS, Respect.Games, op-fractal-sc), Eden Fractal's stack, and DAO-adjacent peer-ranking tools (Coordinape, SourceCred, Colony). None run Discord-native weekly small-group consensus voting with on-chain soulbound payout. This is a genuine negative result, not a weak match stretched to fit - see Findings below. |

## Findings

### 1. Bot framework: discord.js over discord.py/Nextcord

- **discord.js v14.26.4** is the current npm-published version (verified directly against the npm registry, 2026-07-06). It has first-class slash-command builders, modal handling, and component collectors - the exact primitives the current bot's voting-button and timer-queue UI already depend on, just in TypeScript instead of Python's `discord.py`.
- discord.py itself was **paused by its original maintainer in 2021**; the community-maintained forks **py-cord** and **Nextcord** are the actual living Python options today, not vanilla discord.py. The current april2026 bot depends on `discord.py>=2.0.0` directly (per `requirements.txt`) - worth knowing that's a maintenance-lagging choice even if staying in Python were the decision.
- Practical tie-breaker for ZAO specifically: TypeScript lets the bot and the ZAOOS web app share code (types, the Respect-weight formula, possibly a schema package) in a way Python cannot without a cross-language RPC layer.

### 2. Onchain integration: viem + orclient, not raw eth_call

- **viem v2.54.6** (verified live on npm) is the standard for new TypeScript/Optimism (OP Stack) projects in 2026, ahead of ethers.js for new builds per current developer commentary (weekly download counts are close - ethers ~2.1M, viem ~1.9M - but viem is the recommended default for greenfield work due to its tree-shakeable, TypeScript-first design).
- If staying in Python for any component, **web3.py v7.16.0** (verified live on PyPI, maintained by the Ethereum Foundation) is the correct replacement for the current bot's raw JSON-RPC calls - but this doc's recommendation (#1) is to not stay in Python at all.
- **`@ordao/orclient`** exists as a real, installable npm package (`https://registry.npmjs.org/@ordao/orclient` returns HTTP 200) with docs live at `https://orclient-docs.frapps.xyz` (HTTP 200, verified). The actual ORDAO contract/service code lives at **`github.com/sim31/ordao`** - 266 commits, pushed as recently as **2026-04-02**, 3 stars. This is the codebase to integrate against for `submitBreakout` and Respect balance reads, not a hand-rolled ABI call.
- **`Optimystics/frapps`** (github.com/Optimystics/frapps) is a much smaller, stalled repo: **6 total commits, last pushed 2025-04-01, 0 stars**. It's the source of the `zao.frapps.xyz/submitBreakout` URL the current bot already links to - keep using that manual-submission URL pattern where useful, but do not expect frapps itself to gain new features or fixes.

### 3. Persistence: Supabase, unchanged

No serious case emerged for moving off Supabase. It's already the system of record for the ZAOOS web app's `respect_members`/`fractal_sessions`/`fractal_scores` tables (Doc 981 section 5), and the current bot already writes wallet registrations there. A fresh bot should read AND write through the same tables/schema from day one - no separate bot-local JSON cache, no separate bot-only Postgres instance.

### 4. Testing: currently zero, must not stay zero

`find . -iname "*test*"` in the cloned `fractalbotapril2026` repo returns nothing - not one test file across ~9,200 lines. **Vitest** (the 2026 standard for TypeScript projects, Vite-native) with a mocked discord.js client is the direct replacement path. Priority order for first tests: (1) the level 6->1 voting/threshold math, (2) Respect-point indexing (`[110, 68, 42, 26, 16, 10]`), (3) the Respect-weight formula shared with ZAOOS, (4) wallet/ENS registration edge cases.

### 5. No external fractal-bot framework exists (negative result)

Checked systematically and found nothing suitable:

- **Fractalgram** (github.com/Optimystics/fractalgram) - Optimystics' own real-time Respect Game coordination client, but it's a **Telegram** web client, not Discord, and shows very low external adoption (1 star despite 3,222 commits).
- **Respect.Games** and **FRAPPS** - web apps/smart-contract toolkits for async fractal gameplay, not Discord bots.
- **Optimism Fractal itself is on indefinite hiatus** per Optimystics' own blog, with their attention shifted to Eden Fractal - which also has no open-source Discord bot; its public tooling is the same Fractalgram/FRAPPS/Respect.Games stack, Telegram/web-first.
- **Coordinape** - the closest adjacent tool (had a Discord contribution-submission bot) - is **sunset**; CoDAO now holds the IP for stewardship only, no active development.
- **SourceCred**'s Discord bot (`github.com/sourcecred/discord-cred-bot`) is real but **last pushed 2022-02-24** (over 4 years stale, verified via GitHub API) and does graph-based cred scoring, not small-group consensus ranking.
- **Colony.io** is a different governance model entirely (work-unit merit + peer review, no Discord integration).
- No GitHub issues, blog posts, or announcements were found from Optimystics or any other builder proposing to generalize a Respect Game Discord bot for external communities to adopt.

**Conclusion: ZAO is not reinventing a wheel that already exists elsewhere for Discord.** A bespoke bot remains the only path to a Discord-native weekly Respect Game - the fresh build should just be built on the modern, verified stack above instead of the current bot's aging patterns.

### 6. What to carry forward vs. drop (from Doc 981's lineage + gap analysis)

**Carry forward** (proven, keep as-is conceptually):
- The elimination-voting mechanic (level 6 -> 1, majority threshold `ceil(n/2)`) - it works and matches the theory closely enough.
- The Fibonacci Respect table `[110, 68, 42, 26, 16, 10]`.
- Wallet/ENS registration flow and the Hats Protocol role-sync pattern.
- The auto-submit-onchain-or-manual-link fallback for `submitBreakout`.

**Drop, don't reintroduce:**
- The JSON-file persistence layer (`data/*.json`) - go Supabase-only from commit 1.
- A second, independently-implemented Respect-balance formula - share one implementation with ZAOOS instead (closes Doc 981's flagged formula-parity gap).
- Zero test coverage - build the test suite alongside the voting engine, not after.
- The 2-wallet OREC submission bottleneck (94% of all 130 proposals ever submitted came from one relayer wallet, per Doc 975/977) - design for more than one authorized submitter from the start, even if only 2-3 initially.

## Sources

- [npm registry: discord.js](https://registry.npmjs.org/discord.js/latest) - [FULL] fetched directly, version 14.26.4 confirmed 2026-07-06
- [PyPI: web3.py](https://pypi.org/pypi/web3/json) - [FULL] fetched directly, version 7.16.0 confirmed 2026-07-06
- [npm registry: viem](https://registry.npmjs.org/viem/latest) - [FULL] fetched directly, version 2.54.6 confirmed 2026-07-06
- [npm registry: @ordao/orclient](https://registry.npmjs.org/@ordao/orclient) - [FULL] existence confirmed via direct HTTP 200, 2026-07-06
- [orclient-docs.frapps.xyz](https://orclient-docs.frapps.xyz/) - [PARTIAL - confirmed reachable (HTTP 200), full doc contents not read line-by-line]
- [GitHub API: sim31/ordao](https://api.github.com/repos/sim31/ordao) - [FULL] fetched directly: 266 commits, pushed 2026-04-02, 3 stars
- [GitHub API: Optimystics/frapps](https://api.github.com/repos/Optimystics/frapps) - [FULL] fetched directly: 6 commits, pushed 2025-04-01, 0 stars
- [GitHub API: sourcecred/discord-cred-bot](https://api.github.com/repos/sourcecred/discord-cred-bot) - [FULL] fetched directly: last pushed 2022-02-24
- [GitHub - Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) - [PARTIAL - repo page read by sub-agent, not every commit]
- [Coordinape](https://coordinape.com/) - [FULL] confirmed live (HTTP 200), sunset/stewardship status per sub-agent's read of the site
- [Discord.py vs discord.js 2026: Which Should Beginners Use?](https://space-node.net/blog/discord-py-vs-discord-js-2026) - [FULL] read by sub-agent and independently by parent
- [Viem vs. Ethers.js: A Comparison for Web3 Developers](https://metamask.io/news/viem-vs-ethers-js-a-detailed-comparison-for-web3-developers) - [FULL] read by sub-agent
- [GitHub - mcmonkeyprojects/DemocracyDiscordBot](https://github.com/mcmonkeyprojects/DemocracyDiscordBot) - [PARTIAL - README read, not full commit history]
- Reddit community-sentiment source - [FAILED - escalation exhausted]: tried `zao-fetch-reddit.sh` (all redlib mirrors down), direct Reddit JSON API (blocked without auth), and WebSearch scoped to reddit.com (rejected by crawler policy). No live Reddit thread could be fetched on 2026-07-06; the `space-node.net` blog source above was used as the best available substitute for community framing, but it is not a genuine community (Reddit/HN) source and should be re-attempted in a future pass.
- [Doc 981 - ZAO Fractal x Discord Bot: Full Synthesis](../981-fractal-bot-synthesis/) - [FULL] own prior work, this session

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Scaffold new repo `bettercallzaal/fractalbot-v2` (or similar name Zaal picks) with discord.js + TypeScript + viem + Vitest, empty command set, CI running `vitest run` on push | Zaal | Repo + PR | 2026-07-13 |
| Port the Respect-weight formula as a shared function/package importable by both the new bot and ZAOOS (`src/lib/respect/voteWeight.ts`), eliminating the two-formula drift flagged in Doc 981 | Zaal | PR | 2026-07-20 |
| Integrate `@ordao/orclient` for OREC reads/writes in the new bot, replacing the current bot's hand-rolled `eth_call` pattern | Zaal | PR | 2026-07-27 |
| Design multi-signer OREC submission (2-3 authorized wallets, not 1) before the new bot goes live, to retire the 94%-single-relayer bottleneck | Zaal | Design doc + PR | 2026-08-03 |
