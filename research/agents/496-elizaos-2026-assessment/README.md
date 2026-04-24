# 496 — ElizaOS 2026 Assessment: For ZAOstock Bot Decision

> **Status:** Research complete
> **Date:** April 24, 2026
> **Tier:** STANDARD
> **Topic:** Agents / Framework Selection
> **Type:** Decision
> **Related Docs:** 205 (OpenClaw+Paperclip+ElizaOS deployment), 268 (Milady/ElizaOS evolution), 239 (Agent frameworks evaluation)
> **Last Validated:** April 24, 2026

## The Question

ZAOstock Team Bot is running on VPS with grammy + Supabase (no LLM yet). Doc 495 just landed. Should we adopt ElizaOS for v1.5 multi-persona bot routing, or keep grammy + direct API?

Constraints: $0 budget, solo dev, single VPS (already runs ZOE + ZAOstock + ollama).

## The Verdict

**ADOPT ELIZAOS — But not yet. SKIP the immediate rewrite. ADOPT the patterns for ZAOstock v2.0 (late May 2026).**

## Two Concrete Reasons

### 1. Production Memory Leaks Are Real and Unresolved (March-April 2026)

ElizaOS v2 has three documented memory failures in active use:

- **Bootstrap cache leak (PR #6477, Feb 2026):** Shared provider caches lack guaranteed cleanup on shutdown. The fix introduced TTL eviction, but `setInterval` sweeper created at module load time with no guarantee `stopCacheMaintenance()` runs. Review noted 2/5 confidence — merge-blocking issues.
- **Zero-vector memory corruption (PR #6562, Mar 2026):** When embedding fails, the system persists zero vectors to semantic memory, making them unretrievable by cosine-similarity search. Silent data loss.
- **Unbounded memory in long-running agents (PR #6562):** `latestResponseIds` Map accumulates entries per agent/room and is never cleaned up. Grows unbounded in 24h+ deployments.

These aren't edge cases — they hit deployments with knowledge bases (200+ .md files, issue #3664) or long-running memory (issue #1942: 9.5GB+ footprint, not reclaimed).

**What this means for ZAOstock:** If we ported grammy bot to ElizaOS v2 today and it ran 24h, we'd likely hit OOM on a 2GB VPS. Doc 205's deployment plan (Railway $5/mo) sidesteps this by keeping ElizaOS social agent separate from orchestrator, but a monolithic bot would be risky.

### 2. ElizaOS v2 Framework Friction Still High (March 2026)

Digital Rain Technologies analysis (cited in doc 268): **60% of dev effort was fighting framework constraints, 40% was domain logic.** Problems:

- Removed local embeddings mid-cycle (forced cloud dependency)
- Vendored 1,332 lines for 2 HTTP headers
- Plugin architecture lacks extensibility hooks — required forking internal code
- Version churn: 426 releases, 9 alphas/day on v2 branch

**What this means for ZAOstock:** Migrating from grammy's focused, lightweight design to ElizaOS's general-purpose framework is a 2-3 week rewrite. If we hit a plugin limitation (e.g., needing custom Telegram keyboard logic), we'd fork ElizaOS or eject to grammy anyway.

## If We Skip ElizaOS Now

What ElizaOS does well that we should steal patterns from (not code):

1. **Character file design (doc 205 phase 2):** The JSON schema for persona, style, topics, and adjectives is clean and data-driven. We could use the same pattern for ZAOstock's team member configs (even on grammy).

2. **Plugin architecture concept:** ElizaOS's `@elizaos/plugin-X` pattern isolates concerns (Farcaster, Telegram, XMTP). For grammy, we could organize as `services/farcaster.ts`, `services/telegram.ts`, `services/xmtp.ts` with dependency injection. Same modularity, simpler codebase.

3. **Memory safety for autonomous agents:** Steward Wallet pattern (doc 268, Milady contribution) — multi-chain USD-based policy controls, approval webhooks. Adopt for ZAOstock's future trading actions: "auto-approve < $5 ZABAL, require approval for everything else."

## Why Not Rewrite Now

Doc 495 (ZAOstock current state): grammy bot works, integrated with Supabase, deployed on VPS. Current tech debt:

- No LLM routing (uses Claude API directly for each command)
- No multi-persona support (single bot personality)
- Team member commands not yet parametrized

These are **data + logic problems, not framework problems.** ElizaOS solves both, but at the cost of a migration week. Grammy + direct API solves them in 2-3 days with focused code.

## If We Adopt (Late May 2026)

When ElizaOS v2 reaches beta stability (target: June 2026), migration effort sketch:

1. **Prepare character files** (2 hours): Define ZAOstock personas (VAULT, BANKER, DEALER) as `agents/*/character.json` per doc 205.
2. **Port Telegram plugin wrapper** (4 hours): ElizaOS `@elizaos/plugin-telegram` handles grammy's low-level work. We adapt our message router.
3. **Migrate memory storage** (3 hours): ElizaOS uses chromadb + postgres. Supabase RLS rules already in place; ElizaOS can use Supabase as backing DB.
4. **Test on Railway** (2 hours): Spin up ElizaOS agent, verify Telegram webhook, check memory footprint over 6 hours.
5. **Deploy to VPS** (1 hour): Use ElizaOS CLI or Docker.

**Total estimate: 12 hours (1.5 dev days) for a complete rewrite + test.**

## Why This Call

ElizaOS is the right framework for ZAO's agent fleet (doc 205 plan: OpenClaw + Paperclip + ElizaOS). Proven at scale ($25M+ AUM in Web3 bots per Medium analysis, Mar 2026). But v2's stability is marginal (alpha.215 as of Apr 20, and memory leaks are March-April vintage, not fixed).

**Better strategy:** Ship ZAOstock v1.5 (multi-persona) on grammy in ~1 week. Use ElizaOS patterns (character files, plugin architecture) to keep the code migration-ready. When v2 stabilizes (Jun 2026), a one-day port to ElizaOS is low risk.

---

## Sources

- [elizaOS GitHub](https://github.com/elizaos/eliza) — 18K stars, MIT license, 426 releases, v2.0.0-alpha.215 (Apr 20, 2026). TypeScript + Python + Rust.
- [ElizaOS Bootstrap Cache Memory Leak (PR #6477)](https://github.com/elizaOS/eliza/pull/6477) — Feb 8, 2026. Unresolved cleanup semantics.
- [ElizaOS Memory Corruption & Timeout Issues (PR #6562)](https://github.com/elizaOS/eliza/pull/6562) — Mar 8, 2026. Zero-vector embedding fallback, unbounded latestResponseIds Map.
- [ElizaOS Memory Leak in getLocalEmbedding (Issue #1942)](https://github.com/elizaOS/eliza/issues/1942) — Jan 7, 2025 (closed). 100-500MB per embedding, 9.5GB+ footprint on startup with large character knowledge.
- [ElizaOS RAG Knowledge Heap OOM (Issue #3664)](https://github.com/elizaOS/eliza/issues/3664) — Feb 25, 2025 (open). 200+ .md files cause "JavaScript heap out of memory" crashes at 4GB.
- [Digital Rain: "The Era of Large Frameworks Is Over"](https://digitalrain.studio/posts/2026-03-03-why-i-stayed-on-elizaos) — March 3, 2026 analysis. 60% framework fighting, 40% domain logic on ElizaOS v2.
- [Medium: "ElizaOS vs. OpenClaw vs. Hermes 2026"](https://medium.com/@alvintoms2136/elizaos-vs-openclaw-vs-hermes-what-actually-matters-in-2026-a5cf7446726f) — Mar 10, 2026. $25M+ AUM in bots, memory injection vulnerability, ElizaOS proven for Web3 but hardening on developers.
- [grammY Framework Comparison](https://grammy.dev/resources/comparison) — Oct 2024. Best TypeScript bot DX, handles 100M updates/day, fast iteration.
- [ZAO OS Doc 205: OpenClaw + Paperclip + ElizaOS Deployment Plan](../../205-openclaw-paperclip-elizaos-deployment-plan/) — March 28, 2026. $15/mo stack, 3-phase deployment.
- [ZAO OS Doc 268: Milady AI / ElizaOS Evolution](../../268-milady-ai-elizaos-evolution/) — March 28, 2026. Steward Wallet pattern, ERC-8004 identity tracking, plugin CLI patterns.
- [ZAO OS Doc 495: ZAOstock Team Bot Architecture](../../495-zaostock-team-bot-architecture/) — April 24, 2026. Current grammy + Supabase design, no LLM routing yet.
