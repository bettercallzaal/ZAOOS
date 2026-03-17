# 55 — Hats Anchor App, DAO Tooling & Ecosystem Research

> **Status:** Research complete
> **Date:** March 2026
> **Priority:** High — Hats Protocol is being explored for ZAO DAO role management
> **Sources:** 6 parallel research agents covering Hats, OpenFang, Superpowers, DAO tooling landscape, and AI developer content

---

## 1. Hats Anchor App (Deep Dive)

### What It Is

The **Hats Anchor App** is the production web interface for creating, managing, and claiming organizational roles on the Hats Protocol. Available at [app.hatsprotocol.xyz](https://app.hatsprotocol.xyz).

This is the tool the ZAO would use to deploy and manage its role tree without writing custom smart contracts.

### Three Applications

| App | URL | Purpose |
|-----|-----|---------|
| **Anchor App** | app.hatsprotocol.xyz | Create and manage hat trees, assign roles, configure eligibility |
| **Claims App** | claim.hatsprotocol.xyz | Individuals self-claim available hats based on eligibility criteria |
| **Councils App** | (internal) | Council-specific governance tooling |

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Build system | Nx monorepo |
| Language | TypeScript (99.9%) |
| Package manager | pnpm workspaces |
| API layer | GraphQL via GraphQL Zeus |
| UI architecture | Atomic design (atoms, molecules, organisms) |
| Data | Subgraph queries for on-chain hat data |
| Shared libraries | 15 packages |

### Deployment Chains

Hats Protocol v1 uses a **single deterministic address across all chains:**

**`0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`** (ENS: `v1.hatsprotocol.eth`)

Confirmed chains:
- **Optimism** (confirmed on Optimistic Etherscan)
- Ethereum mainnet
- Base
- Arbitrum
- Gnosis Chain
- Polygon
- Scroll
- Celo

**Optimism is fully supported.** This is critical — ZAO's Respect tokens are on Optimism, so the hat tree can live on the same chain.

### Eligibility Modules

These determine who is allowed to wear a hat:

| Module | How It Works |
|--------|-------------|
| **ERC-20 Eligibility** | Eligible if address holds minimum balance of specified ERC-20 token |
| **ERC-1155 Eligibility** | Eligible if address holds minimum balance of specified ERC-1155 token ID(s) |
| **ERC-721 Eligibility** | Eligible if address holds a specified NFT |
| **Staking Eligibility** | Eligible if address has staked minimum amount of a specified token |
| **Allow-List Eligibility** | Eligible if address appears on an explicit allowlist |
| **Hat-Wearing Eligibility** | Eligible if address wears another specified hat |
| **Pass-Through Eligibility** | Delegates eligibility determination to another hat's wearer |
| **JokeRace Eligibility** | Based on contest results |
| **Hats Election Eligibility** | Based on election/voting outcomes |
| **Custom Module** | Any contract implementing `IHatsEligibility` interface |

**For ZAO Respect tokens:**
- $ZAO OG Respect is **ERC-20** → use the ERC-20 Eligibility module, set token contract + minimum balance
- $ZOR (ZAO Respect) is **ERC-1155** → use the ERC-1155 Eligibility module with token ID + minimum balance
- If either uses a non-standard interface, a custom eligibility module would be needed (simple Solidity contract returning `(bool eligible, bool standing)`)

### Safe Multisig Integration (Hats Signer Gate v2)

This is one of Hats' strongest features:

- **What:** A Zodiac module + guard that grants Safe multisig signing rights to hat wearers
- **How:** HSG attaches to a Safe. Hat wearers call `claimSigner()` to become signers. The guard ensures only current hat-wearers can sign.
- **Automatic revocation:** When someone loses their hat (Respect drops below threshold), their signing authority is automatically invalidated
- **Used by:** TreasureDAO (Arbitrum Council multisig), Purple DAO, Questbook

**This means ZAO can have a treasury where signing authority is controlled entirely by hat assignments.**

### ZAO Deployment Path

1. **Create Top Hat** on Optimism via the Anchor App UI. Mint to a Safe multisig.
2. **Design hat tree:** Create child hats for each role (Council, Curator, Artist, Moderator, Developer)
3. **Attach eligibility modules:** ERC-20 module for $ZAO OG Respect, ERC-1155 module for $ZOR
4. **Set up Safe + HSG:** Deploy Safe on Optimism, attach Hats Signer Gate v2 for treasury signers
5. **Enable self-service claims:** Use Multi Claims Hatter so eligible members claim hats without admin action
6. **Connect to token gates:** Hats are ERC-1155 tokens — plug into Guild.xyz or Collab.Land for Discord/Telegram gating

### Gotchas

1. **Eligibility is checked dynamically** — the moment an on-chain balance check fails, permissions are lost (no grace period)
2. **Hat trees are per-chain** — no native cross-chain eligibility (can't check Solana balance from Optimism)
3. **Top Hat custody is critical** — if compromised, attacker controls the entire role tree. Must be held by a Safe multisig.
4. **HSG deeply couples Safe to Hats** — removing HSG later requires careful migration
5. **Gas costs:** ~5-10 transactions for initial setup. Cheap on Optimism.
6. **No built-in "Respect" module** — use the generic ERC-20 or ERC-1155 modules

---

## 2. DAO Tooling Landscape (March 2026)

### Role Management Alternatives

| Tool | Approach | ZAO Fit |
|------|----------|---------|
| **Hats Protocol** | Onchain role trees, ERC-1155 tokens, modular eligibility | Best fit — most mature, Optimism support |
| **Decent DAO** | All-in-one: roles + payments + subDAOs. **Built ON Hats Protocol** | Strong alternative — bundles Hats + Safe + fractal subDAO hierarchy |
| **Zodiac Roles Modifier** | Granular treasury execution permissions on Safe | Complements Hats for treasury operations |
| **DAOhaus (Moloch v3)** | Membership shares + shamans | Simpler but less granular |
| **Aragon OSx** | Plugin-based modular framework | Higher complexity, suited to larger DAOs |
| **Colony** | Domain-based reputation with decay | Similar decay concept to Respect but less active ecosystem |

### Key Discovery: Decent DAO

**Decent DAO (formerly Fractal)** is particularly interesting because it:
- Builds directly on top of Hats Protocol
- Supports **fractal subDAO hierarchy** with parent oversight
- Includes automated term limits and re-election triggers
- Manages payments and treasury alongside roles
- Uses Safe underneath for treasury

**Decision for ZAO:** Build on Hats directly (more flexibility) or use Decent DAO (faster path, less customization)?

### Soulbound Token Tooling

| Tool | Relevance |
|------|-----------|
| **Otterspace Badges** | EIP-4973 soulbound tokens. Can gate governance. Open source. |
| **EIP-4973 / EIP-5192** | Standards for account-bound tokens. OpenZeppelin provides production-ready SBT components. |
| **Colony Reputation** | Score-based (not token-based). Decays over time. Domain-specific weighting. |

### Token Gating

| Tool | What It Does |
|------|-------------|
| **Guild.xyz** | Gates Discord, Telegram, etc. based on onchain criteria. Integrates with Hats. |
| **Collab.Land** | Similar token gating. Can gate multiple Telegram channels per hat. Integrates with Hats. |

Both support soulbound tokens — ZAO Respect tokens could control platform access.

### Fractal Democracy Tools

| Tool | Description |
|------|-------------|
| **Fractally** (fractally.com) | Daniel Larimer's platform. Weekly Fibonacci-weighted consensus rounds. Closest to ZAO's model. |
| **Optimism Fractal Council** | Implementation at scale within Optimism ecosystem. |
| **Decent DAO** | Fractal subDAO hierarchies with Hats + Safe. |

### Recommended Stack for ZAO

1. **Hats Protocol** — onchain role management on Optimism
2. **Safe + Zodiac Roles Modifier** — treasury with role-based execution
3. **Hats Signer Gate v2** — connect roles to treasury signing
4. **Guild.xyz or Collab.Land** — gate community channels by Respect holdings
5. **Decent DAO** — evaluate as potential all-in-one alternative

---

## 3. OpenFang Update

> **See also:** Doc 46 for full OpenFang research

### What's New

| Metric | Doc 46 | Current |
|--------|--------|---------|
| API endpoints | 76+ | 140+ REST/WS/SSE |
| Tools | 38 | 53 |
| LLM providers | 26 | 27 |
| Protocol support | — | MCP + Google A2A (agent-to-agent) |

### Hands Architecture (Detailed)

Each Hand has three layers:
- **HAND.toml** — declarative manifest with tools, settings, cron schedules, event triggers, multi-Hand chaining
- **system-prompt.md** — multi-phase operational playbook with decision trees and error recovery
- **SKILL.md** — domain expertise reference injected into context

Hands compile into the binary via Rust's `include_str!()`. Lifecycle: Inactive → Active → Paused (preserves state, resumes from checkpoints).

7 built-in Hands: Clip (video), Lead (sales), Collector (OSINT), Predictor (forecasting), Researcher (fact-checking), Twitter (social), Browser (web automation).

### Agent Framework Landscape (2026)

| Framework | Type | Best For |
|-----------|------|----------|
| **OpenFang** | Rust Agent OS | Autonomous scheduled agents, 40 channels, security |
| **LangGraph** | Python framework | Complex stateful workflows, production-grade |
| **CrewAI** | Python framework | Role-based agent teams, rapid prototyping |
| **AutoGen** | Python framework | Multi-party conversations (maintenance mode) |
| **PydanticAI** | Python framework | Type-safe agent development |

### Farcaster + XMTP Agent Integration

- Farcaster has native **OpenClaw** agent support (autonomous posting)
- **Clanker** enables conversational tokenization on Farcaster ($50M+ fees)
- **Ensemble** integrated XMTP for "chat-native agent economy"
- A community-built **Farcaster Support Agent** is accessible via XMTP
- **No agent framework has purpose-built music integrations**

### ZAO Relevance

Original assessment stands — OpenFang isn't directly useful for ZAO OS. But:
- The **Hands pattern** (autonomous agents with bundled prompts running on schedules) is the right mental model for ZAO's AI agent phase
- A **Curator Hand** (discovers music, scores tracks, posts recommendations) maps to ZAO's needs
- **Collector Hand** could monitor Farcaster channels and track artist mentions
- Multi-Hand chaining: Collector → Researcher → Twitter could automate community social media

---

## 4. Superpowers Update

> **See also:** Doc 54 for full Superpowers research

### Current State

**v5.0.4** (March 17, 2026). 88.8K stars. Official Anthropic Claude Code plugin.

### What's New Since Doc 54

- **Agent Teams** (Issue #469) — true parallel execution with multiple implementer agents working simultaneously
- **Community skills repo** (`obra/superpowers-skills`) — auto-distributed via `~/.config/superpowers/skills/`
- **Gemini CLI + OpenCode** support added

### Competitive Landscape

| Tool | Paradigm |
|------|----------|
| **Claude Code + Superpowers** | Terminal-native agent with structured TDD |
| **Cursor** | AI-native IDE with repo indexing, Background Agents |
| **Codex (OpenAI)** | CLI agent with sandboxed execution |
| **Devin** | Fully autonomous agent with own dev environment |
| **Ruflo** | Multi-agent swarm orchestration |

Superpowers remains unique as a **methodology** (not just a tool) — enforcing TDD, planning, and review as non-negotiable steps.

### ZAO OS Best Practices

Already well-integrated. Consider adding project-specific skills:
- `zao-farcaster-patterns` — Neynar API patterns, channel management
- `zao-xmtp-integration` — XMTP key management, message handling
- `zao-supabase-patterns` — RLS policies, migration workflows

---

## 5. People & Content Research

### Priyanka Vergadia (@pvergadia)

**Now:** Senior Director of Global Developer Engagement at **Microsoft Azure** (left Google mid-2024 after 7 years). Faculty at University of Pennsylvania.

**Recent work relevant to ZAO:**

| Content | Relevance |
|---------|-----------|
| **TED Talk: "What you know that AI doesn't"** | AI augments but doesn't replace human judgment — aligns with ZAO's artist-centric philosophy |
| **Multi-agent AI apps on Azure** | Architecture patterns for specialized agents collaborating — maps to ZAO's planned onboarding/curation/moderation agents |
| **Traditional AI vs Generative AI vs Agentic AI** | Framework for where autonomous agents fit in a product |
| **Context engineering** | Building AI that "remembers, reasons, responds" — exactly what a community-embedded agent needs |
| **Data governance as foundation** | Governance-first design relevant to handling creator data, royalties, and identity |

**The specific tweet** (status/2033403840264126816) could not be fetched but based on timing likely covers agentic AI architecture or context engineering.

### Dr. Alvaro Cintas (@dr_cintas)

**Who:** Assistant Professor (PhD Computer Science & Engineering), 124K followers. Curates open-source AI tools and developer workflows.

**Recent work relevant to ZAO:**

| Content | Relevance |
|---------|-----------|
| **Claude Code agent skills library (250K+ skills)** | Skills ecosystem that ZAO is already part of via Superpowers |
| **Docling** (IBM) | Converts PDFs/docs/audio into structured data for LLMs — could power an agent that ingests music contracts or governance proposals |
| **Cline CLI supply chain attack** | npm token compromise installed OpenClaw on ~4,000 machines. Security reminder for ZAO OS dependencies. |
| **llmfit** | Scans hardware and recommends which local AI models will run — relevant if ZAO offers local AI features |
| **OpenClaw / Emergent** | Autonomous agent deployment via browser — aligns with ZAO's ElizaOS agent plans |

**The two specific tweets** (status/2032869686828810270 and status/2032149592154755298) could not be fetched. Based on timeline, likely cover open-source AI tool highlights or Claude Code follow-ups.

---

## 6. Key Takeaways for ZAO

### Immediate: Hats Anchor App

The ZAO can deploy roles **today** using the existing Anchor App on Optimism:
1. No custom contracts needed
2. ERC-20 module works with $ZAO OG Respect
3. ERC-1155 module works with $ZOR
4. Safe + HSG v2 enables role-controlled treasury
5. Self-service claiming via Claims App

### Evaluate: Decent DAO

Decent DAO bundles Hats + Safe + subDAOs + fractal hierarchy. Could accelerate ZAO's governance deployment vs building from individual components.

### Monitor: Agent Patterns

- OpenFang's Hands model for autonomous scheduled agents
- Farcaster's native OpenClaw integration for autonomous posting
- Ensemble's XMTP agent integration for chat-native agents
- Pvergadia's multi-agent architecture patterns

### Already Working: Superpowers

v5.0.4 installed. Consider custom project-specific skills.

### Security Note

The Cline CLI supply chain attack (Feb 2026) is a reminder to pin npm dependency versions and audit supply chains in ZAO OS.

---

## Sources

### Hats Protocol
- [Hats Anchor App Repository](https://github.com/Hats-Protocol/hats-anchor-app)
- [Hats Protocol Documentation](https://docs.hatsprotocol.xyz/)
- [Hats Protocol on Optimism](https://optimistic.etherscan.io/address/0x3bc1a0ad72417f2d411118085256fc53cbddd137)
- [Hats Signer Gate v2](https://docs.hatsprotocol.xyz/for-developers/hats-signer-gate-v2)
- [ERC-1155 Eligibility Module](https://docs.hatsprotocol.xyz/hats-integrations/eligibility-and-accountability-criteria/erc1155-eligibility)
- [Hats Introduction (Mirror)](https://hats.mirror.xyz/NXJI4Rkk4TafwLvVZLfdlz-sLWdrNlKFmvJq9cKDkiw)

### DAO Tooling
- [Decent DAO — Roles](https://decent.build/blog/roles)
- [Decent DAO — SubDAOs](https://decent.build/blog/what-are-subdaos)
- [Zodiac Roles Modifier](https://docs.roles.gnosisguild.org/)
- [Otterspace Soulbound Badges](https://github.com/otterspace-xyz/badges)
- [Colony Reputation-Based Governance](https://blog.colony.io/what-is-reputation-based-governance/)
- [Fractally](https://fractally.com/)
- [Guild.xyz](https://guild.xyz/)

### Agent Frameworks
- [OpenFang](https://www.openfang.sh/)
- [Superpowers](https://github.com/obra/superpowers)
- [Farcaster 2026: AI Agents](https://app.t2.world/article/cm6driew61299193tymcl5g6ikvh)
- [Ensemble + XMTP](https://crypto.news/ensemble-integrates-xmtp-to-bring-ai-agents-to-decentralised-messaging/)

### People
- [Priyanka Vergadia TED Talk](https://www.ted.com/talks/priyanka_vergadia_what_you_know_that_ai_doesn_t)
- [Pvergadia — Multi-agent AI on Azure](https://devblogs.microsoft.com/all-things-azure/how-to-build-multi-agent-ai-apps-using-microsoft-azure/)
- [Dr. Alvaro Cintas](https://alvarocintas.com/)
- [Cline CLI Supply Chain Attack](https://www.theregister.com/2026/02/20/openclaw_snuck_into_cline_package/)
