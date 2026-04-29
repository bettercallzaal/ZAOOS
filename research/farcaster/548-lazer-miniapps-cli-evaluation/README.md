---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 173, 250, 349, 489, 508
tier: STANDARD
---

# 548 - Lazer Mini Apps CLI Evaluation (miniapps.lazer.tools)

> **Goal:** Decide whether ZAO adopts `@lazer-tech/miniapp` CLI for net-new Farcaster/Base mini apps, vs sticking with Neynar / Base MiniKit / hand-rolled patterns already in `src/app/api/miniapp/**` and `src/app/miniapp/**`.

> **Update 2026-04-29 (deep-dive pass):** Pulled the npm tarball + read source. Far more capable than landing page implied. **Source IS readable** in `dist/` (unminified TS, 5,765 LOC across 11 packages, plus 16 bundled Claude skills, plus Foundry + Anchor templates). Private GitHub repo is workflow inconvenience, not audit blocker. Verdict moves from "spike candidate" to **"spike + lift patterns into ZAO now."** Full breakdown in [Deep Dive](#deep-dive--what-actually-ships) at end.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt Lazer CLI as default scaffold for ALL new ZAO mini apps | **NO** | 437 monthly npm downloads (Mar 29 - Apr 27 2026), 17 last week. v0.1.8, package created 2026-03-18 (~6 weeks old). Pre-PMF. Source repo `LazerTechnologies/lazer-mini-apps` is **private** despite MIT license on the npm tarball - bus-factor + audit risk for any ZAO production app. |
| Try Lazer CLI ONCE on a throwaway net-new mini app (ZAOstock RSVP card or ZABAL stake flow) | **YES** | Lazer is a credible studio (80+ engineers ex-Apple/Google/Coinbase, 350+ clients incl. Uniswap, Coinbase, Shopify, 40+ YC, 20+ unicorns). MIT-licensed, free, single command (`bunx @lazer-tech/miniapp create`). Multi-platform scaffold (Farcaster + Base + World) hedges against Hypersnap split flagged in Doc 508. Worth a 1-day spike, no commitment. |
| Steal Lazer's `/web3`, `/contracts`, `/farcaster` skill prompts into QuadWork | **YES, IF SOURCE BECOMES VISIBLE** | Skill set (`/auth /web3 /contracts /codex /postgres /ds /base /farcaster`) maps 1:1 to ZAO surface area (`src/lib/auth`, `src/lib/agents`, `contracts/`, Supabase, Base). Aligns with `feedback_oss_first_no_platforms` + `feedback_prefer_claude_max_subscription` (Claude Code CLI on VPS). Pattern reuse > tool dependency. **Blocked until repo opens** - cannot lift skills from a private repo. |
| Replace existing `src/app/api/miniapp/**` + `src/app/miniapp/**` infra with Lazer-generated scaffold | **NO** | ZAO already ships a working mini app surface: `webhook/route.ts`, `discover/route.ts`, `search/route.ts`, `miniapp/layout.tsx`, `miniapp/page.tsx`. Tests exist (`src/app/api/__tests__/miniapp-stream.test.ts`). Migration cost > scaffold value for code that already runs. |
| Keep Doc 508 framing: lead Juke / new launches with "audio-first / utility-first," not "we made a mini app" | **YES, REINFORCED** | Lazer's pitch is dev ergonomics, not distribution. Telegram mini apps dropped 89% in 9 months (Doc 508). A better scaffold does not change the retention problem. |
| Keep Neynar `@neynar/create-farcaster-mini-app` + Base MiniKit CLI as fallback choices for non-spike work | **YES** | Both are first-party (Neynar already in ZAO stack per `community.config.ts` infra; Base MiniKit is Coinbase-official). Lower risk than depending on a private-source CLI from a 6-week-old package. |

## What Lazer Mini Apps CLI Actually Is

**Site:** https://miniapps.lazer.tools (HTTP 200, served as static HTML, no `/docs` path - 404).

**npm package** (verified via `registry.npmjs.org` direct query, 2026-04-28):

| Field | Value |
|---|---|
| Name | `@lazer-tech/miniapp` |
| Latest | `0.1.8` |
| Versions shipped | 0.1.4, 0.1.5, 0.1.6, 0.1.7, 0.1.8 |
| License | MIT |
| Created | 2026-03-18 |
| Last published | 2026-04-01 |
| Downloads, last week | **17** (2026-04-21 to 2026-04-27) |
| Downloads, last month | **437** (2026-03-29 to 2026-04-27) |
| Repo declared | `git+https://github.com/LazerTechnologies/lazer-mini-apps.git` |
| Repo actual | **404 / private** (verified via `gh api` 2026-04-28) |

**Install:** `bunx @lazer-tech/miniapp create`.

**Bundled Claude Code skills** (per landing page): `/auth`, `/web3`, `/contracts`, `/codex`, `/postgres`, `/ds`, `/base`, `/farcaster`.

**Examples shown on landing page:** Tile Riot, Idle Perps, Rattlejack.

**Built by:** Lazer Technologies, Toronto digital product studio. Contributors named on landing: @sudojbird, @0x_reed, @james_mccomish. Twitter: @lazer_hq.

## Lazer Studio Track Record (de-risks the team, not the tool)

Verified via `lazertechnologies.com` + Built In Toronto + LinkedIn snippet:

- 80+ senior engineers + designers, ex-Apple/Google/Coinbase
- 350+ clients including Shopify, Coinbase, Uniswap, Goldfinch, ClassDojo, OVO
- 40+ Y Combinator portfolio companies, 20+ unicorns
- Active ecosystem repos in same org (verified via `gh api orgs/LazerTechnologies/repos`):
  - `lazer-arrive-can-clone` (37 stars, TS, updated 2026-04-08)
  - `LazerForge` (6 stars, "Foundry templates and tutorials for all Solidity developers")
  - `canton-debugger-proposal` (Canton ecosystem proposal, 2026-04-22)
  - `canton-dev-fund` (Canton dev fund administration, 2026-04-22)
  - `LayerZero-Executor`, `nft-marketplace-tutorial`, `ai-showcase`

The studio is real. The CLI is early.

## Comparison: Lazer vs Alternatives for ZAO Net-New Mini App

| Tool | First-party? | Source visible? | Multi-platform | Maturity (proxy: stars / DLs) | ZAO fit |
|---|---|---|---|---|---|
| `@lazer-tech/miniapp` | No (3rd-party studio) | **No, repo private** | Farcaster + Base + World | 437 monthly DLs, 6 weeks old | Spike candidate |
| `@neynar/create-farcaster-mini-app` | **Yes (Neynar)** | Yes | Farcaster (Neynar SDK) | Neynar already in ZAO stack | Default for Neynar-tied flows |
| Base MiniKit CLI (`docs.base.org/builderkits/minikit`) | **Yes (Coinbase / Base)** | Yes | Base + Farcaster | Coinbase-backed | Default for Base-tied flows |
| `builders-garden/base-minikit-starter` | No (community) | Yes | Base + Farcaster | Template, not CLI | Reference, copy patterns |
| `Emmo00/create-farcaster-miniapp` | No (community) | Yes | Farcaster only | Community-driven | Skip |
| Hand-rolled (current `src/app/miniapp/**`) | n/a | Yes | Farcaster | Already shipped, tested | **Keep for existing** |

## ZAO Codebase Cross-Check

Verified 2026-04-28 via `grep -ril "miniapp" src/`:

- `src/app/api/miniapp/webhook/route.ts` - Farcaster webhook handler
- `src/app/api/miniapp/discover/route.ts`
- `src/app/api/miniapp/search/route.ts`
- `src/app/miniapp/layout.tsx` + `src/app/miniapp/page.tsx`
- `src/app/api/__tests__/miniapp-stream.test.ts` (tested)
- Referenced from `src/middleware.ts`, `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/stake/page.tsx`

**Implication:** ZAO is past the scaffolding stage for its core mini app. Lazer's value here is on **net-new throwaway** mini apps (event RSVP, single-shot drops), not the main ZAO OS shell.

## Risks

| Risk | Mitigation |
|---|---|
| Private source repo despite MIT npm tarball | Treat any Lazer-generated code as "vendored" - read every file before committing. Do not trust auto-applied skills blindly. |
| 6-week-old package, 17 weekly DLs - any version could break | Pin exact version in any spike (`@lazer-tech/miniapp@0.1.8`), do not auto-upgrade. |
| Skill name overlap with Claude Code skills already installed in ZAO (`/zao-research`, `/qa`, etc.) | Test in a clean shell or worktree, not the main ZAO OS V1 dir. Lazer skills install to project scope; conflicts unlikely but worth verifying. |
| Mini apps as a category are in retention crisis (Doc 508) | This evaluation does not change distribution strategy - keep audio-first / utility-first framing. |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| 1-day spike: scaffold a throwaway "ZAOstock RSVP" mini app via `bunx @lazer-tech/miniapp create` in a new worktree, write notes on what skills shipped, what code generated | Zaal or ZAO Devz | Spike | After Roddy 2026-04-30 |
| If repo `LazerTechnologies/lazer-mini-apps` becomes public, lift `/web3`, `/contracts`, `/farcaster` skill prompts into QuadWork skill library | Zaal | PR to QuadWork repo | Conditional, watch monthly |
| Re-validate npm download trend in 30 days; if `<1000/month` still, mark this doc `superseded-by` a "skip Lazer" decision | Auto | This doc + memory update | 2026-05-28 |
| Keep `feedback_oss_first_no_platforms` rule active - only adopt Lazer if source opens or it solves a real auth/payments gap that Neynar + MiniKit do not | Zaal | Ongoing | n/a |
| Do NOT replace existing `src/app/api/miniapp/**` infra | n/a | Constraint | n/a |

## Also See

- [Doc 173 - Farcaster mini apps integration](../173-farcaster-miniapps-integration/)
- [Doc 250 - Farcaster miniapps llms.txt 2026](../250-farcaster-miniapps-llms-txt-2026/)
- [Doc 349 - ZABAL staking miniapp options](../../governance/349-zabal-staking-miniapp-options/)
- [Doc 489 - Hypersnap fork research](../../farcaster/) (referenced in Doc 508)
- [Doc 508 - Creator infra + mini apps + token burn signal brief](../../dev-workflows/508-creator-infra-mini-apps-token-burn-signals-apr25/) - mini app retention crisis context

## Sources

- [Lazer Mini Apps landing page](https://miniapps.lazer.tools/) - verified 2026-04-28, HTTP 200
- [npm registry @lazer-tech/miniapp](https://registry.npmjs.org/@lazer-tech/miniapp) - direct API query 2026-04-28
- [npm download stats last-week](https://api.npmjs.org/downloads/point/last-week/@lazer-tech/miniapp) - 17 downloads
- [npm download stats last-month](https://api.npmjs.org/downloads/point/last-month/@lazer-tech/miniapp) - 437 downloads
- [Lazer Technologies GitHub org](https://github.com/LazerTechnologies) - 23 repos visible, lazer-mini-apps repo 404 (private)
- [Lazer Technologies homepage](https://www.lazertechnologies.com/) - 350+ clients, AI/Commerce/Crypto verticals
- [Built In Toronto - Lazer Technologies](https://builtintoronto.com/company/lazer-technologies) - 80+ engineers, remote-first, Toronto HQ
- [Farcaster Mini Apps official docs](https://miniapps.farcaster.xyz/) - first-party reference
- [@neynar/create-farcaster-mini-app on npm](https://www.npmjs.com/package/@neynar/create-farcaster-mini-app) - first-party Neynar alternative
- [Base MiniKit Quickstart](https://docs.base.org/builderkits/minikit/quickstart) - first-party Base alternative
- [builders-garden/base-minikit-starter](https://github.com/builders-garden/base-minikit-starter) - community template alternative
- [Emmo00/create-farcaster-miniapp](https://github.com/Emmo00/create-farcaster-miniapp) - community CLI alternative

## Staleness + Hallucination Notes

- All numbers (DLs, version, dates, repo counts) pulled from live API responses on 2026-04-28, not LLM-recalled.
- Lazer studio claim "80+ engineers, 350+ clients, 40+ YC, 20+ unicorns" sourced from their own homepage + Built In Toronto - self-reported, not independently audited.
- Repo `lazer-mini-apps` 404 verified via `gh api` 2026-04-28 - repo declared in npm metadata is genuinely private or renamed. **Update 2026-04-29:** confirmed source IS shipped readable in the `dist/` of the npm tarball (unminified TS), so MIT licence is enforceable on the published artefact even though git history is closed.
- No Reddit / HN / Warpcast threads found for "miniapps.lazer.tools" or "@lazer-tech/miniapp" as of 2026-04-28 - tool is too new for community sentiment. Re-check in 30 days.
- Deep-dive numbers (file counts, LOC, packages, skills) verified 2026-04-29 by extracting `miniapp-0.1.8.tgz` and counting locally.
- Re-validate by 2026-05-28.

---

## Deep Dive — What Actually Ships

> Pulled `https://registry.npmjs.org/@lazer-tech/miniapp/-/miniapp-0.1.8.tgz` (812,130 bytes, 264 files), extracted, read on 2026-04-29. Numbers below are local `wc` / `ls`, not LLM recall.

### Tarball anatomy

```
package/
├── package.json       (deps: @inquirer/prompts, bs58, incur, zod)
├── README.md
├── LICENSE            (MIT)
└── dist/
    ├── bin.js                  2,612 lines (bundled CLI entry)
    ├── packages/               5,765 lines TS across 11 packages
    │   ├── auth/      Privy provider + 4 features (gas-sponsorship, delegated-signing, server-auth, server-wallets) + RainbowKit alt
    │   ├── core/      shared utils (cn, browser, types/config)
    │   ├── evm/       wagmi wrappers (config, connect, read, tx)
    │   ├── solana/    1,049 LOC (token 356, deploy 194, tx, sign, read, connect)
    │   ├── swap/      Uniswap (310 LOC) + Jupiter component
    │   ├── farcaster/ adapter, sdk init, context, actions (composeCast, addMiniApp, sendToken, swapToken, viewProfile, viewCast), manifest, embed, share, hooks, notifications (handlers/webhook/send/store)
    │   ├── base/      adapter, basename, builder-codes, deeplinks, share, types
    │   ├── web/       generic web adapter (Web Share API + clipboard fallback)
    │   ├── codex/     graph.codex.io (DefinedFi) GraphQL client + WS subscriptions for token prices, charts, events, balances
    │   ├── postgres/  Kysely + pool + migrations
    │   └── ds/        CVA-based design system (Radix Slot, Tailwind, tokens, branding-driven)
    ├── templates/app-minimal/  Next.js 16.2.1 + React 19.2.4 + Tailwind v4 + Biome v2 + TS 6 + Vitest 4
    │   ├── contracts/          Foundry (Counter.sol, foundry.toml, Deploy.s.sol)
    │   ├── programs/           Anchor (Solana counter, Anchor.toml)
    │   ├── _claude/skills/     11 user-facing skills (auth, base, codex, contracts, ds, farcaster, lazer, postgres, programs, web, web3)
    │   ├── _CLAUDE.md          Generated app instructions
    │   ├── _mcp.json           Pre-wires 3 MCP servers: privy-docs (HTTP), next-devtools (bunx), miniapp itself (--mcp flag)
    │   ├── _biome.jsonc        Biome v2 config
    │   ├── branding.json       { primary, defaultMode } - drives DS tokens
    │   ├── site.json           Farcaster manifest fields (categories, tags, capabilities, OG, splash)
    │   └── docker-compose.yml
    └── .claude/skills/         16 internal "module dev" skills (audit-skill, *-module sync, lint, test, verify, sync-skills, resources)
```

### CLI surface

`bin.js` agent targets array: `['claude', 'codex', 'cursor', 'gemini']`. So a generated app gets per-agent skill folders, not Claude-only.

`OWNED_PROJECT_SKILLS` (12): auth, base, codex, contracts, ds, farcaster, lazer, postgres, programs, resources, web, web3.

The `/lazer` skill in generated apps is a **router** - it inspects `.claude/skills/` + `src/lib/modules/` to know what's installed vs available, then dispatches free-form requests to the right skill(s). Pattern resembles ZAO's `/zao-research` index but at app-build scope.

### Hidden CLI feature: doubles as MCP server

`_mcp.json` includes:

```json
"miniapp": { "command": "bunx", "args": ["@lazer-tech/miniapp@latest", "--mcp"] }
```

So once installed, the CLI exposes itself over MCP - the dev-time agent (Claude / Codex / Cursor / Gemini) can call CLI commands as tools, not just shell-out. Not advertised on the landing page; only visible in tarball. **Worth re-using as a pattern in ZAO's own dev tooling** (e.g. `zao-research --mcp`).

### Skills work by reading source, then minimally implementing

Generated `_CLAUDE.md` makes the philosophy explicit:

> "Each skill has access to the full module source code in `.claude/skills/*/references/`. When you run a skill, it: 1) Reads the reference source to understand the full API surface, 2) Installs required npm dependencies, 3) Writes only the code your app needs into `src/lib/modules/`. This means `/auth email login` and `/auth wallet only` produce different implementations - skills write code tailored to your requirements, not flip switches on pre-written templates."

This is a different pattern from `create-next-app` (templates) and from MiniKit (opinionated boilerplate). It's closer to "AI-native code-gen with full source as RAG context." Useful pattern for ZAO's own QuadWork skill library.

### Stack match with ZAO is exact

| Tech | Lazer template | ZAO OS V1 (`package.json`) | Match |
|---|---|---|---|
| Next.js | 16.2.1 | 16 | Exact |
| React | 19.2.4 | 19 | Exact |
| Tailwind | v4.2.2 | v4 | Exact |
| Biome | v2.4.9 | v2 (lint:biome) | Exact |
| TypeScript | v6.0.2 | v6 | Exact |
| Zod | v4.3.6 | required for safeParse | Exact |
| Vitest | v4.1.2 | required for tests | Exact |
| Test runner | jsdom + @testing-library/react 16 | matches `.claude/rules/tests.md` | Exact |

This is unusual. Most Farcaster scaffolds lag Next/React by a major version. Lazer is on the same bleeding edge as ZAO. Migration friction = near zero.

### Privy auth depth

`packages/auth/src/privy/features/`:

| Feature | What it does | ZAO use |
|---|---|---|
| `gas-sponsorship` | `useSponsoredTransaction()` - Privy gas policies, gasless EVM tx | **Direct fit:** ZAOstock RSVP, ZABAL stake, Cipher mint - all gasless onboarding for the 188 + new joiners |
| `delegated-signing` | App can sign on behalf of user (consented) | Agent flows (VAULT/BANKER/DEALER) where user delegates a budget |
| `server-auth` | Verify Privy session server-side in API routes | Replaces / complements iron-session for wallet-first paths |
| `server-wallets` | Privy-managed embedded wallets, server-controlled | Possible foundation for ZOE / agent wallets without rolling our own |

Auth provider exposes: `appId`, `platforms`, `chains`, `supportedChains`, `defaultChain`, `solanaConnectors`, `accentColor`, `theme`, `plugins`, `embeddedWalletCreateOnLogin` (`"all-users" | "users-without-wallets" | "off"`). Last one matters - server signers require `all-users`.

### Codex (DefinedFi) integration

`packages/codex/src/client.ts` wires `https://graph.codex.io/graphql` + `wss://graph.codex.io/graphql` with auto-reconnect WebSocket manager. Network ID map covers ethereum (1), base (8453), base-sepolia (84532), polygon (137), arbitrum (42161), optimism (10), avalanche (43114).

Queries: `TOKEN_QUERY`, `TOKEN_LIST_QUERY`, `TOKEN_WITH_STATS_QUERY`, `TOKEN_CHART_QUERY`, `TOKEN_EVENTS_QUERY`, `WALLET_BALANCES_QUERY`. Subscriptions: `ON_BARS_UPDATED`, `ON_PRICE_UPDATED`, `ON_PRICES_UPDATED`, `ON_EVENTS_CREATED`.

**Direct ZAO fit:**
- ZABAL price chart on `/stake` page (currently no live chart)
- WaveWarZ token data feed
- ZAO Music drop sales analytics
- Replaces ad-hoc "fetch token price" calls scattered across `src/lib/`

This is the highest-value module to **lift in standalone**, not via the full CLI scaffold.

### Solana support (unexpected)

11 packages includes `solana/` (1,049 LOC) + `swap/jupiter.tsx`. Anchor template ships in `programs/`. ZAO is EVM-first today (Base + Optimism), but `project_zao_music_entity` (BMI + DistroKid + 0xSplits) is EVM-only by accident not design. Lazer makes Solana cross-chain music NFTs an option without rebuilding auth + wallets.

### Foundry contract template

`templates/app-minimal/contracts/`: minimal `Counter.sol` + `Deploy.s.sol` + `foundry.toml`. (Not the heavier `LazerNFT.sol` ERC721+USDC+Ownable2Step+SafeERC20 contract that ships in `LazerForge` repo per `lazertechnologies.com/LazerForge`.) Pairs with `bin.js` orchestration so `/contracts` skill scaffolds Foundry inside an existing app.

ZAO already has `contracts/` (staking, bounty board) using Foundry per `CLAUDE.md`. No replacement needed. **Pattern to steal:** the `/contracts` skill flow for adding new contracts to an existing repo. Would speed up future ZAO contract drops (e.g. ZAOstock NFT ticket).

### Bundled audit-skill

`dist/.claude/skills/audit-skill/SKILL.md` is a portable Anthropic-best-practices skill auditor (4 reference files: `rules.md`, `quality.md`, `anti-patterns.md`, `resources.md`). Targets any skill at `**/.claude/skills/*/SKILL.md`. Accepts skill name, path, or `all`.

**Direct ZAO use:** run it across `~/.claude/skills/` and `.claude/skills/` to audit ZAO's own skill library quality (zao-research, qa, ship, vps, worksession, etc.). Independent of whether we adopt the rest of Lazer.

### Notifications, manifest, embeds (Farcaster module specifics)

- `manifest.ts`: enforces FORBIDDEN chars `[@#$%^&*+=\\/|~«»]`, MAX_NAME=128, MAX_BUTTON=32, MAX_SHORT_TEXT=30, MAX_OG_DESC=100, MAX_DESC=170, MAX_TAG=20, MAX_TAGS=5. ZAO can crib this to validate its own manifest entries before publish.
- `notifications/`: full webhook handler + send + broadcast + InMemoryNotificationStore (swappable for postgres-backed in production).
- `actions.ts`: `composeCast`, `addMiniApp`, `sendToken`, `swapToken`, `viewProfile`, `viewCast` - all wrap `@farcaster/miniapp-sdk` actions with miniapp-context guard.
- `embed.ts`: generates `fc:miniapp` meta tags for sharing.

### Revised recommendation summary (post deep dive)

| Action | Old verdict (2026-04-28) | New verdict (2026-04-29) | Why changed |
|---|---|---|---|
| Adopt full CLI as default scaffold | NO | NO (unchanged) | Heavy stack to inherit; ZAO's miniapp shell already runs. |
| 1-day spike on a throwaway net-new mini app | YES | **YES, this week** | Higher confidence: stack match is exact, source is readable, output is minimal modules not boilerplate dump. |
| Lift module patterns into ZAO directly | "if repo opens" | **YES NOW** | Source is in dist/. MIT. Specific lifts: Codex client (`/stake` chart), gas-sponsorship pattern (gasless ZABAL stake), `manifest.ts` validators, `audit-skill` for ZAO skill library. |
| Replace existing `src/app/miniapp/**` | NO | NO (unchanged) | Already shipped + tested. |
| Steal CLI-as-MCP pattern (`--mcp` flag) | not noticed | **YES, capture for QuadWork** | Hidden in `_mcp.json`. Generic pattern: any CLI you maintain can self-expose as MCP for dev-time agent calls. |

### Concrete lift targets (ranked, highest signal first)

1. **`packages/codex/src/client.ts`** (~600 LOC) - drop into `src/lib/codex/` for live ZABAL + WaveWarZ token data. Replaces ad-hoc fetches. Highest immediate user-visible value.
2. **`packages/auth/src/privy/features/gas-sponsorship/`** - gasless onboarding for ZAOstock RSVP + ZABAL stake. Direct UX win for non-crypto-native attendees.
3. **`packages/farcaster/src/manifest.ts`** validators - bolt onto existing manifest generation, prevents production bugs from char limits / forbidden chars.
4. **`dist/.claude/skills/audit-skill/`** - copy to `~/.claude/skills/audit-skill/` and audit ZAO's full skill library. One-time win.
5. **CLI-as-MCP pattern** (`bunx <pkg> --mcp`) - capture as a general QuadWork pattern; not a code lift, an architectural one.
6. **`packages/farcaster/src/notifications/`** - replace any ad-hoc Farcaster notification code in `src/app/api/miniapp/webhook/route.ts` with the typed handler + store interface.

Lifts are independent. No need to take all 6.

### Caveats (unchanged from initial pass)

- Pin `@lazer-tech/miniapp@0.1.8` exactly if used.
- Do not auto-upgrade until `last-validated` date refreshes.
- Treat lifted code as vendored. Read every file before commit. License header check.
- Mini app retention crisis (Doc 508) framing still holds. Better tooling != distribution.
