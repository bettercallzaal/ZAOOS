# 46 — OpenFang: Agent Operating System (RightNow-AI)

> **Status:** Research complete
> **Date:** March 2026
> **Source:** github.com/RightNow-AI/openfang
> **Verdict:** Impressive engineering but not a fit for ZAO OS — wrong language (Rust), no Farcaster/XMTP, requires self-hosting

---

## What Is OpenFang?

An open-source **Agent Operating System** written entirely in Rust. Not a chatbot framework — a full runtime for autonomous AI agents that run on schedules, 24/7, without user prompts. Compiles to a single ~32MB binary.

| Metric | Value |
|--------|-------|
| **Stars** | 14,485 |
| **Created** | February 24, 2026 (19 days old) |
| **Language** | Rust (137,728 lines, 14 crates) |
| **License** | Apache-2.0 OR MIT (dual) |
| **Version** | 0.4.4 (pre-1.0, targeting v1.0 mid-2026) |
| **Cold start** | 180ms |
| **Memory** | 40MB idle |
| **Tests** | 1,767+ passing |
| **Builder** | Jaber (RightNow AI) — essentially solo developer |

---

## Key Features

- **14 Rust crates:** kernel (orchestration), runtime (agent loop + 38 tools), API (76+ endpoints), memory (SQLite + vector), channels (40 platform adapters), hands (7 autonomous packages), skills (60 bundled), wire (P2P protocol), desktop (Tauri), CLI
- **40 channel adapters:** Telegram, Discord, Slack, WhatsApp, Matrix, Mastodon, Bluesky, Nostr, Reddit, and more
- **MCP client + server** — connects to external MCP servers AND exposes its own tools
- **Google A2A** agent-to-agent protocol support
- **16-layer security:** WASM sandbox, Ed25519, Merkle audit, taint tracking, SSRF protection, prompt injection scanning
- **OpenAI-compatible API** at `/v1/chat/completions`
- **Skills marketplace** (FangHub/ClawHub)

---

## Why It Doesn't Fit ZAO OS

| Issue | Detail |
|-------|--------|
| **Language mismatch** | Rust vs ZAO's TypeScript/Next.js |
| **No Farcaster** | 40 channel adapters but Farcaster is NOT one of them |
| **No XMTP** | Not supported |
| **No Supabase** | Uses SQLite, not PostgreSQL |
| **Infrastructure** | Requires self-hosting a Rust binary — not Vercel-compatible |
| **Very young** | 19 days old, solo developer, pre-1.0 |

---

## Theoretical Integration Paths

| Path | Feasibility | Worth It? |
|------|-------------|-----------|
| Call OpenFang API as AI backend | Medium | No — adds ops complexity, just call LLM APIs directly |
| MCP bridge (ElizaOS ↔ OpenFang) | Medium | No — over-engineered for current needs |
| Use "Hands" for background tasks (music discovery) | Low | No — build in your own stack instead |
| Write a Farcaster channel adapter | High effort | No — significant Rust development |

---

## Better Alternatives for ZAO OS

| Framework | Language | Web3/Farcaster | ZAO Fit |
|-----------|----------|----------------|---------|
| **ElizaOS** | TypeScript | Yes (native Farcaster + XMTP plugins) | **Best fit** |
| **Vercel AI SDK** | TypeScript | No | Tight Next.js integration |
| **LangChain.js** | TypeScript | Via plugins | Good for RAG |
| **OpenFang** | Rust | No | Poor fit |
| **CrewAI** | Python | No | Wrong language |

---

## Worth Watching For

- If they add a **Farcaster channel adapter**
- If they release a **JS/TS SDK** (bindings to the Rust runtime)
- If the **MCP ecosystem** matures enough to bridge Rust ↔ TypeScript seamlessly
- The **skills marketplace** concept (FangHub) is interesting for the agent ecosystem

---

## Sources

- [OpenFang GitHub](https://github.com/RightNow-AI/openfang)
- [OpenFang Website](https://www.openfang.sh/)
- [OpenFang on Product Hunt](https://www.producthunt.com/products/openfang)
