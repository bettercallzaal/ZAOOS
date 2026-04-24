---
topic: business
type: decision
status: draft
last-validated: 2026-04-24
related-docs: 281, 361, 475, 497
tier: DISPATCH
---

# 498 - Zlank: Unified Agent-Native SDK (Clanker + Empire Builder + Farcaster Graph)

> **Goal:** Decide if Zlank is worth building, scope the MVP, identify what ZAO OS already has, and map the ask to Adrian / Orajo / Diviflyy.

## Key Decisions

| Decision | Answer |
|---|---|
| Is Zlank worth building? | YES as a FarHack submission + npm package. No unified SDK exists today. Clanker SDK is token-only, Neynar SDK is social-only, Empire Builder has no public SDK. |
| MVP scope for FarHack Online (Apr 6-26, 2026) | Weekend scope: @zlank/sdk on npm with .cast/.launchToken + Vercel AI tool() exports. Human SDK + agent tools, one source of truth. |
| Auth model | One `zlank_` API key resolves to 3 backends on init (Clanker wallet signer, Empire Builder FID sig, Neynar api_key+signer_uuid). Clean for user, fan-out internally. |
| Ship as npm only, or npm + MCP server? | npm first (weekend). Add MCP server week 2 so Claude Code + Desktop can call as tools natively. |
| Include Individual Empire Tokens in v1? | NO. Wait for Adrian/Orajo spec. Design Zlank interface so `.empireMint()` can slot in later without breaking changes. |
| Open-source or private? | Open-source under MIT. FarHack requires public repo. Protocol-layer value > lock-in value. |

## Why Now

- **Clanker owned by Neynar (Jan 2026).** Farcaster founders stepped back, builder-first roadmap. Unification pitch lands with the new owner.
- **Empire Builder V3 ships for Farcon (May 4-5, 2026 Rome).** Adrian: "agent skills dropping, greater support for external builders."
- **FarHack Online running Apr 6-26, 2026** with agent-native emphasis. Clean submission window.
- **Moxie dead, Zora Creator Coins 99% fail rate.** Vacuum for a better creator-token primitive that Orajo/Diviflyy's Individual Empire Tokens are aiming at. Zlank is the wrapper that makes those easy to build against.

## Three-Layer Stack

```
Layer 1  Clanker             Token launch, 1% swap fee (40% creator, 60% protocol), Base + Arbitrum + Unichain + BSC + Monad
Layer 2  Empire Builder V3   Leaderboards (up to 50), boosters (ERC-20/1155 multipliers), treasury distribution (even/weighted/raffle), FID-tied
Layer 3  Farcaster graph     Cast, reply, react, follow, channel, search, profile, feed, notifications, signers via Neynar
```

## Layer 1 - Clanker (current state, Apr 2026)

| Feature | State |
|---|---|
| Version | v4.0.0 live since Jul 2025, SDK v4.2.14 (Mar 2026) |
| Chains | Base primary, Arbitrum, Unichain, Monad testnet, BSC |
| Fees | 1% on every buy/sell. 40% to creator (80% on bot-deployed), 60% to protocol. 0.2% extra protocol fee on top |
| LP ownership | Permanent lock to Clanker LP Locker (no withdraw). Deployer gets fee stream only |
| Anti-bot | 15s sniper tax (decays 5% over 15s) |
| Optional creator vault | Up to 30% supply, 31+ day lock |
| Auth | Wallet/private-key or injected signer. No API key required for SDK |
| SDK | clanker-sdk (TypeScript, Viem-based, npm) + REST at clanker.world/api |
| Hooks | None. Poll `/tokens/fetch-deployed-by-address` or `/search-creator` |
| Volume peak | $300M in 48h (Feb 2026), $3M daily fees at peak |
| Total fees generated | $8M protocol cumulative, $27M ecosystem |
| Active tokens | 355k+ deployed |
| Owner | Neynar (acquired Jan 2026) |

`Zlank.launchToken()` wraps: init wallet -> call clanker-sdk deploy with config -> wait tx confirm -> poll fetch-deployed-by-address -> return { address, poolAddress, explorerUrl, claimInstructions }.

## Layer 2 - Empire Builder V2 -> V3

| Feature | V2 (live) | V3 (pre-Farcon) |
|---|---|---|
| Token launch | Via Clanker integration | Same + SDK hooks |
| Leaderboards | Up to 50 per Empire, FID-native | Same + agent-readable |
| Boosters | ERC-20/1155 multipliers | Same + custom config |
| Treasury | Multi-token custody, even/weighted/raffle distribution | Same + agent-proposable distributions |
| API | 6+ endpoints (get empires, leaderboard, boosters, refresh, distribute) | + agent skill surface, external builder SDK |
| Mini app | farcaster.xyz/miniapps/empire-builder | + standardized mini-app hooks for third parties |
| Governance | None public | TBD, likely over booster + distribution configs |

`Zlank.leaderboard(empire, {...})` wraps V2 endpoints today. Grows to `Zlank.agent.proposeDistribution()` + `Zlank.agent.executeLeaderboardAction()` when V3 ships.

## Layer 3 - Farcaster Graph (already in ZAO OS)

ZAO OS wraps 40+ Farcaster ops in `src/lib/farcaster/neynar.ts` (546 lines) across `/api/neynar/*` + `/api/users/*`. Covered: cast/reply/like/recast/delete, follow/unfollow/batch, mute/block, profile/bulk/by-address, search, channel feed, trending feed, thread, signers, frames, notifications, best friends, popular casts, storage.

Gaps not wrapped: DM/direct-cast, channel admin ops, frame creation + button handling, pin/unpin, nested quote embeds, strong webhook validation, Clanker/Empire Builder.

`Zlank.cast/.follow/.react/.search/.getProfile` wraps what exists. `Zlank.sendDM/.createFrame/.pinCast` are new surface.

## Individual Empire Tokens (Orajo / Diviflyy hint)

Not spec'd publicly. Reading the signal:

- **FID-linked ownership** - token bound to creator's FID, non-transferable soul-bound-ish. Not floating like Moxie.
- **Generative leaderboards** - rewards continuous (months/years) based on engagement, contributions, treasury participation. Not dump-and-go.
- **Community identification** - hold creator's token = membership in their Empire. Gates leaderboards, votes, yield.
- **Creator-sovereign** - 100% fees to creator + community. No platform extraction a la Moxie / Zora / Friend.tech.
- **Long-term alignment** - value accrues to engaged community, not speculators.

Why not Moxie: Moxie tokens floated free, speculative, insiders dumped. Why not Zora Creator Coins: 99% fail in 5 txs, 0.3% trade after 48h, Jacob Horne's own token crashed 80%. Why not Friend.tech: keys/bonding curves collapsed when growth stalled, team walked in Sept 2024, FRIEND down 98%.

What IS working (from Layer 3 ecosystem): Hypersub subscription NFTs (600+ contracts, $600k moved), Noice peer-tipping (1.68M tips, $81k), Tipn composable tipping (seasons), RaveDAO event ticketing (60x surge on real volume), Basedrop music tokens with royalty backing (Doppler multicurve + Organic Distro).

Common thread: real utility > pure speculation. Access, subs, tips, royalties, tickets - all work. Pure curves - don't.

### Three fits for ZAO

| Model | Shape | Pro | Con |
|---|---|---|---|
| **Artist Empire Token** | 1 token per artist (188 total) | Aligned incentives, fan loyalty local | Fragmentation, each artist markets own |
| **Contributor-Tier Token** | 1 community token (ZABAL adj), tier NFT monthly sub, revenue-share pro-rata | Unified community, direct alignment | Governance complex, tier gaming |
| **Music Collective + Royalty Backing** | 1 token ($CIPHER / $ZAO_MUSIC), 10% of BMI/DistroKid publishing + streaming flows to liquidity | Real RWA floor, matches ZAO Music plan (doc 475) | Requires release cadence + distro setup |

Recommended for ZAO: Model 3 (music + royalty) or Model 2 (tier-based). Model 1 too fragmented for 188 artists.

## Zlank Architecture (MVP)

```
@zlank/sdk
  src/
    core/
      client.ts          Zlank main class (human-facing)
      auth.ts            Multi-auth resolver
      types.ts           Zod schemas
    tools/
      definitions.ts     Vercel AI tool() exports
      schemas.ts         JSON schema for MCP / LangChain / CrewAI
    mcp/
      server.ts          MCP stdio server (week 2)
    backends/
      clanker.ts         Token launch (async + polling)
      empire-builder.ts  Token ops (FID sig)
      neynar.ts          Social graph (api_key + signer_uuid)
```

Dual surface:

```typescript
// Human
const zlank = new Zlank({ apiKey: 'zlank_abc' })
await zlank.cast({ text: 'hello', channel: 'zao' })
await zlank.launchToken({ symbol: 'ZLANK', chain: 'base' })

// Agent (Vercel AI)
import { zlankTools } from '@zlank/sdk/tools'
const agent = new ToolLoopAgent({ tools: zlankTools })

// Claude Code / Desktop (MCP)
npm start:mcp   // stdio server exposes launchToken, cast, leaderboard, distribute
```

Async pattern: slow ops return `{ jobId, polling }`, sync ops return result directly. Rate-limit + retry shared per-backend. Type sync via OpenAPI -> TS codegen.

## MVP Scopes

| Scope | Ship |
|---|---|
| Weekend (48h) | @zlank/sdk npm, .cast + .launchToken, Vercel AI tool() exports, README, FarHack submission |
| Month (4wk) | + MCP server, multi-auth resolver, async polling + webhooks, CrewAI/LangChain adapters, OpenAPI codegen |
| Full (8wk) | + hosted API, key mgmt dashboard, webhook replay + DLQ, streaming job status, multi-backend failover |

## FarHack Pitch (3 sentences)

Zlank is a unified TypeScript SDK wrapping token launch (Clanker), token operations (Empire Builder V3), and Farcaster social graph (Neynar) behind one API key and a dual interface - callable by human devs as SDK methods and by LLM agents as structured tools. It kills the agent framework fragmentation problem: one source of truth instead of duplicating tool definitions across Vercel AI, LangChain, CrewAI, MCP, OpenAI function calling. Weekend scope: working SDK + two agent frameworks. Month scope: MCP server + multi-auth resolver + adapters for all major frameworks.

## Open Questions (Ask Adrian / Orajo / Diviflyy)

1. V3 agent skill spec - autonomous read leaderboards? Propose distributions? Execute treasury transfers? FID + sig or pure contract calls?
2. Individual Empire Tokens timeline - shipping at Farcon? Post-Farcon? Under design?
3. FID-linkage mechanics - ERC-6551 token-bound accounts or custom soul-bound pattern?
4. V3 revenue - cut on launches? Distributions? Or free infra with revenue flowing through Clanker's 1%?
5. External builder SDK - standardized mini-app hooks? Webhook event stream? Or REST poll only?
6. Booster governance in V3 - who proposes, who approves?
7. Any competitor teams building generative leaderboard systems post-Moxie worth partnering vs competing?

## Also See

- [Doc 281 - Farcaster agents landscape + registration](../../agents/281-farcaster-agents-landscape-registration/)
- [Doc 361 - Empire Builder touchpoints](../361-empire-builder-touchpoints/) (if exists)
- [Doc 475 - ZAO Music entity](../475-zao-music-entity/) - royalty backing for Model 3
- [Doc 487 - QuadWork four-agent dev team](../../agents/487-quadwork-four-agent-dev-team/) - could build Zlank via Quad batch
- [Doc 497 - Quad workflow deep dive](../../agents/497-quad-workflow-deep-dive/) - how to ship Zlank with the team

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DM Adrian + Orajo, ask the 7 open questions, share this doc | Zaal | Farcaster DM | This week |
| Decide weekend-vs-month scope, pick one, commit to FarHack Apr 6-26 window | Zaal | Decision | Before Apr 28 |
| If GO: create @zlank/sdk repo, scaffold package, Vercel AI tool() definitions via Quad batch (Pattern 1 from doc 497) | Zaal + Quad | New repo + first batch | Within 10 days |
| Park Individual Empire Tokens design until Adrian/Orajo ship V3 spec | Zaal | Calendar reminder post-Farcon May 5 | May 5 2026 |
| Audit src/lib/farcaster/neynar.ts for methods worth lifting into Zlank verbatim | Claude | Code audit | Before weekend hack |
| Pin ZAO fit decision: Model 1 (artist), Model 2 (tier), or Model 3 (music + royalty) | Zaal + core team | Meeting | Before V3 spec drops |

## Sources

**Clanker:**
- https://clanker.gitbook.io/clanker-documentation
- https://github.com/clanker-devco/clanker-sdk
- https://www.clanker.world/deploy
- https://clanker.world/ecosystem
- https://coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app

**Empire Builder:**
- https://empire-builder.gitbook.io/empire-builder-docs
- https://miniapps.farcaster.xyz/docs/sdk/changelog
- https://cryptoevents.global/farcon-2026-rome/
- https://farhack.xyz/hackathons/farhack-online-2026

**Creator-token landscape:**
- https://www.moxie.xyz/token/id_farcaster (sunset)
- https://blockworks.co/news/zora-latest-content-coin-fad/
- https://nickysap.substack.com/p/the-creator-coin-delusion
- https://cointelegraph.com/news/friendtech-failure-socialfi-success-adoption
- https://neynar.com/blog/tipn-enabling-composable-micropayments-economies
- https://neynar.com/blog/noice-unlocking-the-new-era-of-social-finance
- https://docs.withfabric.xyz/stp/overview (Hypersub)
- https://rome.builders/imperia
- https://basedrop.fun/about
- https://startupfortune.com/ravedaos-rave-token-surged-60x

**SDK architecture:**
- https://github.com/vercel/ai (AI SDK tool())
- https://github.com/modelcontextprotocol/typescript-sdk
- https://modelcontextprotocol.io/docs/develop/build-server
- https://github.com/stripe/ai (Stripe agent toolkit)
- https://www.scalekit.com/blog/unified-tool-calling-architecture-langchain-crewai-mcp

**ZAO internal:**
- src/lib/farcaster/neynar.ts:1-546
- src/lib/agents/swap.ts + runner.ts + wallet.ts + cast.ts
- src/lib/publish/auto-cast.ts + normalize.ts
- community.config.ts:32-39
