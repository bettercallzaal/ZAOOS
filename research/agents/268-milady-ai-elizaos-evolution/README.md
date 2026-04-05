# 268 — Milady AI: ElizaOS Evolution for Desktop-First AI Agents

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate Milady AI as the next-gen ElizaOS distribution and assess implications for ZAO's agent stack (OpenClaw + Paperclip + ElizaOS per doc 205)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Replace vanilla ElizaOS with Milady?** | NOT YET — Milady v2.0.3 just shipped (March 28, 2026) but is BSC/trading-focused, not music/Farcaster-focused. No Farcaster or XMTP plugins. Keep ElizaOS v1.7.2 per doc 83 plan |
| **Eliza Cloud for hosting?** | SKIP for now — Milady Cloud (`cloud.milady.ai`) is managed ElizaOS hosting with OpenAI-compatible API, but ZAO's Railway deployment at $5/mo (doc 205) is cheaper and gives full control |
| **Steward Wallet pattern** | ADOPT THE PATTERN — Milady's real-time approval flow with multi-chain USD-based policy controls is exactly what ZAO needs for agent wallet security. Implement similar guardrails on the OpenClaw agent wallet |
| **ERC-8004 agent identity** | TRACK — Conway Cloud uses ERC-8004 for on-chain agent identity. ZAO should adopt ERC-8004 when the standard stabilizes (currently EIP stage). Connects to doc 23 (Austin Griffith / ETH Skills / onchain credentials) |
| **Desktop companion UX** | SKIP — Milady's 3D VRM avatar + Electrobun desktop app is consumer-focused. ZAO is a web-first community OS, not a desktop companion |
| **Plugin architecture lessons** | LEARN FROM — Milady's `milady plugins` CLI and Binance Skills Hub (25 trading skills) show how ElizaOS v2 plugin system matured. Use same pattern for ZAO music skills when migrating to ElizaOS v2 |

## Comparison: Milady vs Vanilla ElizaOS vs ZAO Agent Stack

| Dimension | Milady v2.0.3 | ElizaOS v1.7.2 (vanilla) | ZAO Stack (doc 205) |
|-----------|---------------|--------------------------|----------------------|
| **Focus** | Desktop AI companion, crypto trading | General-purpose agent framework | Music community agents |
| **Deployment** | Desktop app (Electrobun) + Cloud | Self-hosted (Railway/VPS) | Railway ($5/mo) + VPS ($5/mo) |
| **Farcaster** | None | Plugin v1.0.5 (stable) | ElizaOS Farcaster plugin + Neynar |
| **XMTP** | None | Plugin available | Planned for DM automation |
| **Blockchain** | BSC/Solana (PancakeSwap, meme tokens) | Multi-chain via plugins | Optimism/Base (ZOUNZ, Respect) |
| **Wallet security** | Steward Wallet (approval flow, USD limits) | Basic EVM/Solana auto-gen | App wallet (doc 205, `APP_SIGNER_PRIVATE_KEY`) |
| **3D/Avatar** | VRM + Gaussian splats + Three.js | None | None (not needed) |
| **Stars** | 269 | 17,800+ | N/A |
| **Release cadence** | Multiple per day (alpha.125-129 in 3 days) | 9 alphas/day on v2 branch | N/A |
| **Cloud hosting** | Eliza Cloud (`elizacloud.ai`) | Self-host only | Railway + Hostinger VPS |
| **Agent identity** | ERC-8004 via Conway Cloud | None built-in | None yet (track ERC-8004) |
| **License** | Not clearly stated (check repo) | MIT | N/A |
| **Cost** | Free (local) or Cloud pricing | Free + infra | ~$15/mo total |

## What Milady Actually Is

Milady is a **consumer-packaged ElizaOS distribution** — not a fork with different internals, but a UX layer on top. Key additions over vanilla ElizaOS:

1. **Desktop app** via Electrobun (custom Electron variant) with macOS/Windows/Linux/iOS/Android builds
2. **3D companion** — VRM avatars with lip sync, Gaussian splat rendering, battery-aware GPU optimization ("UX per watt")
3. **Crypto trading** — BSC/PancakeSwap integration, meme token discovery via Binance Skills Hub (25 skills), Pump.fun/Four.meme token lists
4. **Steward Wallet** — Real-time transaction approval flow with multi-chain USD-based policy controls. Agent proposes transactions, human approves via webhook. This is the most interesting technical contribution
5. **Eliza Cloud** — Managed hosting at `cloud.milady.ai` with OpenAI-compatible API (`/api/v1/chat/completions`), model gateway (OpenAI/Anthropic/Google), vector knowledge base, and generation studio (image/video/voice)
6. **Personality system** — Multiple anime-themed character personas (Sakuya, Reimu, Koishi, Marisa) with tone presets ("uwu~ soft & sweet" to "lmao kms unhinged & dark")

### What It's NOT

- Not a music platform — zero music features
- Not Farcaster-aware — no Farcaster or XMTP plugins
- Not community-focused — single-user desktop companion model
- Not a governance tool — no DAO/voting features

## Architecture Worth Stealing

### 1. Steward Wallet Pattern

Milady's transaction approval flow is the best pattern we've seen for agent wallet security:

```
Agent proposes transaction → Webhook fires → Human reviews in UI → Approve/reject → Execute
```

Multi-chain USD-based policy controls mean you can set rules like "auto-approve < $5 USDC, require approval for everything else." ZAO should implement this on the OpenClaw agent's wallet (`APP_SIGNER_PRIVATE_KEY` in `src/lib/auth/session.ts`).

### 2. Plugin CLI (`milady plugins`)

```bash
milady plugins list          # see installed
milady plugins install X     # add new skill
milady plugins remove X      # clean up
```

This is cleaner than ElizaOS v1's character-file-based plugin loading. When ZAO migrates to ElizaOS v2, adopt this pattern for music-specific skills (curation, playlist generation, respect-weighted recommendations).

### 3. Battery-Aware Rendering

Not directly relevant (ZAO is web), but the principle of "measure UX per watt" is good for mobile PWA optimization. Milady reduces Three.js render quality when on battery — ZAO could apply similar logic to reduce polling frequency on mobile (relevant to `src/hooks/useNowPlaying.ts` and `src/hooks/useRadio.ts`).

## ERC-8004: On-Chain Agent Identity

Conway Cloud (Milady's infrastructure) uses ERC-8004 for trustless AI agent identity. The standard introduces 3 registries:

| Registry | Purpose | ZAO Relevance |
|----------|---------|---------------|
| **Identity** | ERC-721 NFT per agent, linked to name/endpoints/wallet | ZAO agents (OpenClaw, ElizaOS bot) get verifiable on-chain identity |
| **Reputation** | On-chain reputation scores | Connects to ZAO's Respect system — agent earns Respect for good curation |
| **Validation** | Trust verification for agent-to-agent communication | Multi-agent stack (doc 202) needs trust between OpenClaw → Paperclip → ElizaOS |

ERC-8004 is still at EIP stage (not finalized). TRACK but don't build on it yet. When it stabilizes, it's a natural fit for ZAO's agent identity — an agent with a FID, an ERC-8004 identity, and a Respect score.

## Ecosystem Context: The ElizaOS Distribution Layer

Milady signals a new pattern: **ElizaOS is becoming a platform, not just a framework.** Key evidence:

| Signal | Detail |
|--------|--------|
| Milady Cloud branding | `elizacloud.ai` redirects to Milady Cloud — the managed hosting is Milady-branded |
| 3,364 commits | Heavy investment in consumer UX layer |
| v2.0.3 stable | Milady shipped stable v2 before vanilla ElizaOS (still at alpha.76) |
| Binance Skills Hub | 25 trading skills = first "skill marketplace" on ElizaOS |
| Conway Cloud infra | Dedicated AI infrastructure company (Linux sandboxes, AI inference, ERC-8004) |

This matters for ZAO because it validates the doc 205 architecture: **use ElizaOS as the runtime, build domain-specific skills on top.** Milady built trading skills; ZAO should build music skills.

## Framework Friction Warning

From the Digital Rain Technologies analysis (March 3, 2026), a developer building on ElizaOS v2 reported:

- **60% of effort** was fighting framework constraints (removed local embeddings, vendored 1,332 lines for 2 HTTP headers, inconsistent identity checking)
- **40% of effort** was actual domain logic
- Plugin architecture lacks extensibility hooks — required forking internal code

This reinforces doc 83's recommendation: **stay on ElizaOS v1.7.2 for now.** The v2 ecosystem (which Milady rides) is stabilizing but still has sharp edges.

## ZAO OS Integration

### Files Affected

- `src/lib/auth/session.ts` — Steward Wallet pattern could wrap `APP_SIGNER_PRIVATE_KEY` usage with approval flows
- `community.config.ts` — Future: add ERC-8004 agent identity config alongside existing ZOUNZ contract addresses
- `src/hooks/useNowPlaying.ts`, `src/hooks/useRadio.ts` — Battery-aware polling optimization (learn from Milady's UX-per-watt approach)
- Doc 205 agent stack — No changes needed now. ElizaOS v1.7.2 on Railway remains the right call

### Migration Path (When Ready)

1. **Now:** Stay on ElizaOS v1.7.2 (doc 83 recommendation stands)
2. **When ElizaOS v2 reaches beta:** Evaluate Milady's plugin CLI pattern for ZAO music skills
3. **When ERC-8004 finalizes:** Add agent identity to OpenClaw + ElizaOS bot
4. **When Milady adds Farcaster plugin:** Re-evaluate Milady as a drop-in replacement for vanilla ElizaOS

## Comparison: ElizaOS-Based Agent Platforms (March 2026)

| Platform | Stars | Focus | Unique Feature | License | Farcaster Support |
|----------|-------|-------|----------------|---------|-------------------|
| **ElizaOS (vanilla)** | 17,800 | General agent framework | Plugin ecosystem (50+ plugins) | MIT | Yes (v1.0.5 plugin) |
| **Milady** | 269 | Desktop AI companion + trading | 3D VRM avatars, Steward Wallet, Eliza Cloud | Unclear | No |
| **OpenClaw** | ~500K lines | Meta-agent orchestrator | SOUL.md, MCP servers, Telegram integration | Proprietary | Via ElizaOS delegation |
| **BTQ-Agent** | ~9K lines | Domain-specific (blockchain explorer) | Hybrid search (BM25 + semantic) | Unknown | No |
| **NanoClaw** | ~6.2K lines | Minimal agent | Fork-and-modify simplicity | Unknown | No |

## Sources

- [Milady AI GitHub repo](https://github.com/milady-ai/milady) — 269 stars, 3,364 commits, v2.0.3 (March 28, 2026)
- [Eliza Cloud / Milady Cloud docs](https://www.elizacloud.ai/docs) — managed ElizaOS hosting platform
- [ERC-8004: Trustless Agents (EIP)](https://eips.ethereum.org/EIPS/eip-8004) — on-chain agent identity standard
- [Digital Rain: "The Era of Large Frameworks Is Over"](https://digitalrain.studio/posts/2026-03-03-why-i-stayed-on-elizaos) — ElizaOS v2 friction analysis (60% framework fighting)
- [QuickNode: ERC-8004 Developer's Guide](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/)
- [Milady releases page](https://github.com/milady-ai/milady/releases) — v2.0.0-alpha.125 through v2.0.3 in 3 days
- ZAO OS doc 83 — ElizaOS March 2026 Update (v1.7.2 stable recommendation)
- ZAO OS doc 205 — OpenClaw + Paperclip + ElizaOS deployment plan ($15/mo)
- ZAO OS doc 202 — Multi-agent orchestration architecture
