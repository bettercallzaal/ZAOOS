# 240 — Farcaster Agentic Bootcamp (Builders Garden / urbe.eth)

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Document the Farcaster Agentic Bootcamp curriculum, tools, and frameworks for building autonomous agents on Farcaster — directly applicable to ZAO OS agent development

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent identity** | USE ERC-8004 (Trustless Agents) — went live on Ethereum mainnet January 29, 2026. On-chain identity + reputation + validation registries. Builders Garden built SIWA (Sign In With Agent) on top of it |
| **Agent auth** | USE SIWA (`@buildersgarden/siwa`, MIT license) — "Sign In With Agent" auth framework. Drop-in Next.js middleware (`withSiwa()`). Supports Circle, Privy, Openfort, private key, viem wallets |
| **Miniapp framework** | USE `@farcaster/miniapp-sdk` v0.2.3 + Builders Garden `farcaster-miniapp-starter` (47 stars, TypeScript, Next.js) or `base-minikit-starter` (41 stars) for Base integration |
| **Bootcamp value for ZAO** | HIGH — 10 sessions covering exactly what ZAO needs: Farcaster agents, miniapps, wallet-enabled agents, multi-agent coordination. All projects deploy for FarHack Online 2026 |
| **Session transcripts** | Bootcamp is LIVE (March 30 – April 10, 2026) — transcripts may not be publicly posted yet. Check the Notion page or ask in urbe.eth Farcaster channel for recordings |

---

## Bootcamp Overview

| Detail | Value |
|--------|-------|
| **Name** | Farcaster Agentic Bootcamp |
| **Dates** | March 30 – April 10, 2026 (2 weeks, 10 sessions) |
| **Format** | Online, free (General Admission) |
| **Organizers** | urbe.eth (Rome-based Web3 community) + Dev3Pack (women+ / student fellowship) + Builders Garden (AI-native product studio) |
| **Led by** | limone.eth (Builders Garden founder, shipped 20+ miniapps in 2025) |
| **Goal** | Build autonomous agents on Farcaster + deploy for FarHack Online 2026 |
| **Notion** | [builders-garden.notion.site/farcaster-agentic-bootcamp](https://builders-garden.notion.site/farcaster-agentic-bootcamp) |
| **Luma** | [luma.com/f7ok6tbp](https://luma.com/f7ok6tbp) |

---

## Full Session Schedule

### Week 1: Foundations

| # | Date | Topic | What's Covered |
|---|------|-------|----------------|
| 1 | **March 30** | **Farcaster Building Blocks** | Hubs, clients, miniapps, open social graph architecture |
| 2 | **March 31** | **Miniapps 101** | Designing and deploying miniapps inside Farcaster |
| 3 | **April 1** | **Agents 101** | Building event-driven agents that listen, decide, and act |
| 4 | **April 2** | **Memory, Context & Reasoning** | Designing stateful agents with contextual awareness |
| 5 | **April 3** | **Agent Identity & Auth (ERC-8004)** | Registering agents, signing, verification via SIWA |

### Week 2: Advanced

| # | Date | Topic | What's Covered |
|---|------|-------|----------------|
| 6 | **April 6** | **Give Your Agent a Wallet** | Wallet primitives, agents as economic actors |
| 7 | **April 7** | **Embedded Capital & Agentic Commerce** | On-chain transactions, micro-markets |
| 8 | **April 8** | **Going Viral on Farcaster** | Distribution loops for agent-native apps |
| 9 | **April 9** | **Miniapp Notifications & Sharable Moments** | Retention, interaction design, push notifications |
| 10 | **April 10** | **Multi-Agent Systems & Open Coordination** | Agent-to-agent interaction, swarm coordination |

---

## Session 1: Farcaster Building Blocks (March 30)

### What Farcaster's Architecture Enables for Agents

Farcaster's open protocol makes agents **first-class citizens**:
- **Hubs** — decentralized data layer. Agents can read/write directly to hubs
- **Open social graph** — agents can follow users, be followed, build relationships
- **Miniapps** — web apps inside Farcaster clients with access to native features (auth, notifications, wallets)
- **Channels** — topic-based feeds agents can monitor and post to (ZAO already uses /zao, /zabal, /wavewarz, /cocconcertz channels)

### ZAO OS Already Has
- Neynar SDK integration (`src/lib/farcaster/neynar.ts`) for reading/writing casts
- Channel management in `community.config.ts` (4 channels: zao, zabal, cocconcertz, wavewarz)
- Webhook handler for Farcaster events (`src/app/api/fractals/webhook/route.ts`)

### What's New from the Bootcamp
- Direct hub access (bypassing Neynar) for lower latency
- Miniapp framework for embedding ZAO features inside Warpcast/other clients
- Agent-native patterns: agents as first-class Farcaster users, not just bots

---

## Session 2: Miniapps 101 (March 31)

### Farcaster Miniapps — What They Are

Miniapps are web apps (HTML/CSS/JS) that run inside Farcaster clients. They get access to:
- **Authentication** — Quick Auth (sign in with Farcaster)
- **Notifications** — push notifications to users
- **Wallet access** — interact with user's connected wallet
- **Sharing** — native share to feed/channels

### Key SDK: `@farcaster/miniapp-sdk` v0.2.3
- Published on npm, 4 days old (as of April 2026)
- Official docs: [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/)
- Spec: [miniapps.farcaster.xyz/docs/specification](https://miniapps.farcaster.xyz/docs/specification)

### Builders Garden Starter Templates

| Repo | Stars | What It Is |
|------|-------|-----------|
| `farcaster-miniapp-starter` | 47 | Next.js starter kit for Farcaster Mini Apps |
| `base-minikit-starter` | 41 | Opinionated template using Base Minikit (Redis, webhooks, notifications) |
| `miniapp-next-template` | 28 | Cross-platform template (Farcaster + Worldcoin compatible) |
| `frames-v2-starter` | 29 | Frames v2 starter (predecessor to miniapps) |

### ZAO OS Miniapp Opportunity
ZAO OS already has a Farcaster Mini App embed config in `src/app/layout.tsx:18-31`:
```typescript
const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og.png',
  button: { title: 'Open ZAO OS', action: { type: 'launch_miniapp', url: 'https://zaoos.com' } },
});
```
The bootcamp teaches how to enhance this with notifications, sharing, and wallet interactions.

---

## Session 3: Agents 101 (April 1)

### Event-Driven Agent Architecture

Agents on Farcaster follow the **Listen → Decide → Act** pattern:
1. **Listen** — monitor casts, mentions, channel activity, wallet events
2. **Decide** — process inputs with AI (LLM reasoning, context, rules)
3. **Act** — post casts, send transactions, trigger miniapp actions, interact with other agents

### SIWA: Sign In With Agent (Builders Garden)

The core authentication framework for Farcaster agents:

| Detail | Value |
|--------|-------|
| **Package** | `@buildersgarden/siwa` |
| **License** | MIT (2025, Builders Garden SRL) |
| **Stars** | 38 |
| **Standards** | ERC-8004 (agent identity NFT) + ERC-8128 (HTTP message signing) |
| **Repo** | [github.com/builders-garden/siwa](https://github.com/builders-garden/siwa) |

### How SIWA Works (5-Step Flow)
1. **Nonce request** — agent requests nonce from server (`/siwa/nonce`), server validates agent's on-chain registration
2. **Message signing** — agent constructs SIWA message + signs with private key
3. **Verification** — agent submits signature to `/siwa/verify`, server confirms on-chain identity ownership
4. **Receipt** — server returns verification receipt
5. **Subsequent requests** — agent uses ERC-8128 per-request signatures (stateless auth)

### Server Framework Support
- Next.js (`@buildersgarden/siwa/next`) — `withSiwa()` middleware
- Express (`@buildersgarden/siwa/express`)
- Hono (`@buildersgarden/siwa/hono`)
- Fastify (`@buildersgarden/siwa/fastify`)

### Wallet Provider Support
Circle, Openfort, Privy, Private Key (local), Keyring Proxy, WalletClient (viem)

### SIWA Package Architecture
| Package | Purpose |
|---------|---------|
| `siwa` | Core SDK (signing, verification, framework wrappers) |
| `siwa-skill` | Educational materials for AI agent integration |
| `siwa-testing` | Local dev harness (CLI agent + Express server) |
| `keyring-proxy` | Isolated signing service (key security) |
| `siwa-website` | Documentation portal |
| `2fa-gateway` + `2fa-telegram` | Two-factor approval via Telegram |

---

## ERC-8004: Trustless Agents Standard

### What It Is
On-chain identity standard for AI agents, based on ERC-721. Went **live on Ethereum mainnet January 29, 2026**.

### Three Registries

| Registry | Purpose |
|----------|---------|
| **Identity** | Global directory — each agent gets an ERC-721 identity NFT linked to metadata (name, description, endpoints, wallets) |
| **Reputation** | Persistent on-chain history of ratings/evaluations after interactions |
| **Validation** | Independent verification that agents did what they claim to have done |

### Why It Matters for ZAO
- ZAO agents (governance summarizer, AI DJ, onboarding guide) could have on-chain identities
- Other agents could verify they're interacting with legitimate ZAO agents
- Reputation system aligns with ZAO's existing Respect scoring (`src/lib/respect/`)

---

## Comparison: Agent Frameworks for Farcaster

| Framework | What It Does | License | ZAO Fit |
|-----------|-------------|---------|---------|
| **SIWA** (Builders Garden) | Agent authentication (ERC-8004/8128), Next.js middleware, multi-wallet support | MIT | HIGH — drop-in for ZAO OS's Next.js stack, same auth patterns as existing iron-session |
| **ElizaOS** | Full agent framework (personality, memory, multi-platform), Farcaster plugin available | MIT | MEDIUM — heavier, researched in Doc 83. Good for standalone agents, overkill for embedded features |
| **Vercel AI SDK** | LLM toolkit (streaming, tool calling, ToolLoopAgent), no Farcaster-specific features | Apache-2.0 | HIGH — researched in Doc 227. Best for LLM plumbing, combine with SIWA for Farcaster identity |
| **Neynar Agents** | Managed Farcaster bot hosting, auto-replies, webhook-driven | Proprietary | LOW — ZAO already uses Neynar SDK directly, managed hosting not needed |

---

## ZAO OS Integration

### Already Built
- `src/lib/farcaster/neynar.ts` — Neynar SDK client for Farcaster API
- `src/app/layout.tsx:18-31` — Farcaster Mini App embed configuration
- `src/app/api/fractals/webhook/route.ts` — Webhook handler for Farcaster events
- `community.config.ts` — 4 Farcaster channels configured (zao, zabal, cocconcertz, wavewarz)
- `src/lib/hats/constants.ts` — Hats Protocol roles (could map to agent permissions)
- Doc 227 researched Vercel AI SDK + agent designs (5 ZAO agents proposed)

### What the Bootcamp Adds
1. **SIWA integration** — add `@buildersgarden/siwa` for agent authentication. Use `withSiwa()` middleware on agent-facing API routes
2. **Miniapp enhancements** — upgrade the existing miniapp embed with notifications + sharing + wallet interactions
3. **ERC-8004 agent identity** — register ZAO agents on-chain with verifiable identity
4. **Multi-agent coordination** (Session 10) — agent-to-agent interaction patterns for governance summarizer + AI DJ + onboarding guide working together
5. **Agent wallets** (Session 6) — agents as economic actors, enabling autonomous tipping, payment splits

### Proposed ZAO Agent Architecture (Post-Bootcamp)

```
User (Farcaster) → ZAO OS → Agent Router
                              ├── Governance Agent (summarize proposals, notify voters)
                              ├── Music Agent (AI DJ, curation, track recommendations)
                              ├── Onboarding Agent (welcome new members, guide setup)
                              ├── Content Agent (auto-post highlights, recaps)
                              └── Fractal Agent (coordinate weekly meetings, track Respect)

Each agent:
- Has ERC-8004 identity NFT (on-chain)
- Authenticates via SIWA
- Has its own wallet (economic actor)
- Can post to Farcaster channels
- Coordinates with other agents (Session 10 patterns)
```

---

## Builders Garden — Who They Are

| Detail | Value |
|--------|-------|
| **What** | AI-native crypto product studio |
| **Founded by** | limone.eth |
| **Based** | Italy (associated with urbe.eth, Rome) |
| **GitHub** | [github.com/builders-garden](https://github.com/builders-garden) — 175 repos |
| **2025 output** | 20+ miniapps shipped |
| **Key projects** | Farville (Farcaster game), SIWA (agent auth), RevU, Checkmates, UFO.fm, ITM ID |
| **Clients** | Base ecosystem, Ephemera Labs, USV-backed startups |
| **Starter templates** | 4 Farcaster templates (47, 41, 29, 28 stars) |

---

## Session Transcripts Status

The bootcamp is **currently live** (March 30 – April 10, 2026). Sessions 1-3 have occurred but transcripts are not publicly indexed yet.

**To get transcripts:**
- Check the [Notion page](https://builders-garden.notion.site/farcaster-agentic-bootcamp) (may have recordings/links after each session)
- Check the urbe.eth Farcaster channel: [farcaster.xyz/~/channel/urbe-eth](https://farcaster.xyz/~/channel/urbe-eth)
- Ask in the bootcamp community for recording links

**When transcripts are available**, add them to this doc with key code examples and patterns from each session.

---

## Sources

- [Farcaster Agentic Bootcamp — Luma](https://luma.com/f7ok6tbp) — full schedule, organizers, format
- [SIWA: Sign In With Agent — GitHub](https://github.com/builders-garden/siwa) — MIT license, agent auth framework
- [ERC-8004: Trustless Agents — EIP](https://eips.ethereum.org/EIPS/eip-8004) — on-chain agent identity standard
- [ERC-8004 Developer Guide — QuickNode](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/) — practical implementation guide
- [Farcaster Mini Apps — Official Docs](https://miniapps.farcaster.xyz/) — miniapp SDK, specification
- [@farcaster/miniapp-sdk — npm](https://www.npmjs.com/package/@farcaster/miniapp-sdk) — v0.2.3
- [Builders Garden — GitHub](https://github.com/builders-garden) — 175 repos, starter templates
- [Builders Garden — Website](https://builders.garden/) — AI-native product studio
- [farcaster-miniapp-starter — GitHub](https://github.com/builders-garden/farcaster-miniapp-starter) — 47 stars, Next.js template
- [base-minikit-starter — GitHub](https://github.com/builders-garden/base-minikit-starter) — 41 stars, Base integration
- [urbe.eth — GitHub](https://github.com/urbeETH) — bootcamp organizer
- [Doc 83 — ElizaOS 2026 Update](../083-elizaos-2026-update/) — alternative agent framework comparison
- [Doc 227 — Agentic Workflows 2026](../227-agentic-workflows-2026/) — Vercel AI SDK, 5 ZAO agent designs
- [Awesome ERC-8004 — GitHub](https://github.com/sudeepb02/awesome-erc8004) — curated resource list
