---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-04-28
related-docs: 173, 250, 349, 489, 508
tier: STANDARD
---

# 548 - Lazer Mini Apps CLI Evaluation (miniapps.lazer.tools)

> **Goal:** Decide whether ZAO adopts `@lazer-tech/miniapp` CLI for net-new Farcaster/Base mini apps, vs sticking with Neynar / Base MiniKit / hand-rolled patterns already in `src/app/api/miniapp/**` and `src/app/miniapp/**`.

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
- Repo `lazer-mini-apps` 404 verified via `gh api` 2026-04-28 - repo declared in npm metadata is genuinely private or renamed; do not assume MIT == public source.
- No Reddit / HN / Warpcast threads found for "miniapps.lazer.tools" or "@lazer-tech/miniapp" as of 2026-04-28 - tool is too new for community sentiment. Re-check in 30 days.
- Re-validate by 2026-05-28.
