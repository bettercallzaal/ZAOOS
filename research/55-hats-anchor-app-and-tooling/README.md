# 55 — Hats Anchor App & Ecosystem Tooling Research

> **Status:** Research complete
> **Date:** March 2026
> **Priority:** High — Hats Protocol is being explored for ZAO DAO role management
> **Sources:** github.com/Hats-Protocol/hats-anchor-app, openfang.sh, github.com/obra/superpowers

---

## 1. Hats Anchor App

### What It Is

The **Hats Anchor App** is the primary web interface for creating, managing, and claiming organizational roles ("hats") on the Hats Protocol. It is the production frontend at [app.hatsprotocol.xyz](https://app.hatsprotocol.xyz).

This is the tool the ZAO would use to deploy and manage its role tree — Council, Curator, Artist, Moderator, Developer — without writing custom smart contracts.

### Why This Matters for ZAO

Doc 07 covers Hats Protocol's core concepts (tree structure, ERC-1155 tokens, eligibility modules). This document covers the **actual app the ZAO would use to deploy roles**. The Anchor App removes the need for custom contract deployment — organizations can create their entire role hierarchy through the UI.

### Applications

The repo is a monorepo containing three applications:

| App | URL | Purpose |
|-----|-----|---------|
| **Anchor App** | app.hatsprotocol.xyz | Create and manage hat trees, assign roles, configure eligibility |
| **Claims App** | claim.hatsprotocol.xyz | Individuals claim available hats based on eligibility criteria |
| **Councils App** | (internal) | Council-specific governance tooling |

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Build system** | Nx monorepo |
| **Language** | TypeScript (99.9%) |
| **Package manager** | pnpm workspaces |
| **API layer** | GraphQL via GraphQL Zeus (auto-generated client) |
| **UI architecture** | Atomic design (atoms, molecules, organisms) |
| **Data** | Subgraph queries for on-chain hat data |

### Architecture

The repo contains 15 shared libraries:

**Blockchain:**
- `hats-hooks` — React hooks for contract and subgraph interactions
- `hats-utils` — Smart contract utilities

**UI (Atomic Design):**
- `molecules`, `organisms`, `atoms` — composable component layers
- `ui`, `icons` — shared styling and icons

**State & Logic:**
- `contexts` — React context providers
- `hooks` — UI/UX hooks
- `modules-hooks`, `modules-ui` — module state management

**Data & Config:**
- `constants`, `types`, `forms`, `utils`, `pages`, `shared`

### What Organizations Can Do

Through the Anchor App, DAOs can:

- **Design role trees** — visual hierarchy builder (parent-child hat relationships)
- **Set eligibility criteria** — programmatic rules for who can wear a hat (token holdings, attestations, custom contracts)
- **Auto-grant and revoke** — roles automatically assigned/removed based on on-chain conditions
- **Plug in automations** — 15+ pre-built automation modules, no code required
- **Query hat data** — subgraph integration for historical role data

### ZAO Deployment Path

Based on the planned ZAO role tree from doc 50:

```
ZAO Top Hat (multisig)
├── Council (top Respect earners)
├── Curator (Respect threshold)
├── Artist (allowlisted by Curators)
├── Moderator (community elected)
├── Event Organizer
└── Developer (ZAO OS contributors)
```

**Using the Anchor App, the ZAO could:**
1. Create the Top Hat via the UI (no contract deployment needed)
2. Add child hats for each role
3. Configure eligibility modules (e.g., "must hold X Respect tokens" for Council)
4. Set up the Claims App so contributors can claim hats they're eligible for
5. Integrate with ZAO OS to check hat ownership for permissions

**Key question for ZAO:** The Anchor App supports multiple chains. Hats Protocol contracts are deployed on Optimism (same chain as $ZAO Respect). This alignment simplifies integration — eligibility modules can directly query Respect token balances.

### Adoption

Hats Protocol is trusted by 50+ DAOs. The protocol provides composability — multiple hat instances can work across different DAOs.

---

## 2. OpenFang Update

> **See also:** Doc 46 for the full OpenFang research

Doc 46 concluded: "Impressive engineering but not a fit for ZAO OS — wrong language (Rust), no Farcaster/XMTP, requires self-hosting."

### What's Changed Since Doc 46

OpenFang has continued rapid development since the initial research:

| Metric | Doc 46 (early March) | Current |
|--------|---------------------|---------|
| **Stars** | 14,485 | Growing rapidly |
| **API endpoints** | 76+ | 140+ REST/WS/SSE |
| **Tools** | 38 | 53 |
| **Channel adapters** | 40 | 40 (stable) |
| **Security systems** | 16 | 16 (stable) |
| **LLM providers** | 26 | 27 |
| **Skills** | 60 | 60 (stable) |
| **Target** | v1.0 mid-2026 | v1.0 mid-2026 |

### New Details

- **"Hands" system** — pre-built autonomous capability packages (Clip, Lead, Collector, Predictor, Researcher, Twitter, Browser). Each bundles a TOML manifest, system prompt, skill reference, and guardrails.
- **Desktop app** — Tauri 2.0 native app with system tray
- **Migration engine** — can import from OpenClaw, LangChain, AutoGPT
- **OpenAI-compatible API** — existing tools can point at OpenFang as a drop-in

### ZAO Relevance

The original assessment stands — OpenFang is not directly useful for ZAO OS development. However, the "Hands" concept (autonomous agents running on schedules without user prompts) is worth monitoring for the ZAO AI agent phase. If the ZAO ever needs a standalone agent runtime (not embedded in ZAO OS), OpenFang's architecture is a reference point.

---

## 3. Superpowers Update

> **See also:** Doc 54 for the full Superpowers research

Superpowers is already installed in the ZAO OS repo and actively in use.

### Current State

Superpowers 5.0.2 is the installed version. The framework provides 14+ composable skills including brainstorming, planning, TDD, code review, debugging, and parallel agent dispatch.

### How ZAO OS Uses It

The ZAO OS repo has Superpowers integrated with:
- Custom `/zao-research` skill for conducting research
- Custom `/next-best-practices` skill for Next.js conventions
- All standard skills (brainstorming, planning, executing, reviewing)

No significant changes needed — the tool is working as documented in doc 54.

---

## 4. Unfetched X/Twitter Posts

Three X posts were provided but could not be fetched (X blocks automated access):

| URL | Author | Status |
|-----|--------|--------|
| x.com/pvergadia/status/2033403840264126816 | Priyanka Vergadia (Google Cloud developer advocate) | Could not fetch |
| x.com/dr_cintas/status/2032869686828810270 | Dr. Alvaro Cintas (AI/cybersecurity professor) | Could not fetch |
| x.com/dr_cintas/status/2032149592154755298 | Dr. Alvaro Cintas | Could not fetch |

**Who these people are:**
- **Priyanka Vergadia** — Google Cloud developer advocate known for sketchnotes and technical explainers
- **Dr. Alvaro Cintas** — Professor with PhD in Computer Science & Engineering, creates viral AI education content

To document the content of these posts, the user would need to provide the text/screenshots directly.

---

## 5. Key Takeaways for ZAO

### Immediate Action: Hats Anchor App

The Hats Anchor App is the most directly relevant finding. The ZAO can:

1. **Use the existing app** at app.hatsprotocol.xyz — no custom development needed
2. **Deploy on Optimism** — same chain as $ZAO Respect tokens
3. **Configure eligibility** using Respect token balances as criteria
4. **Enable self-service claiming** via claim.hatsprotocol.xyz
5. **Integrate with ZAO OS** by checking hat ownership via subgraph queries

This means the "Hats Protocol roles" item in doc 50's conceptual section could move to prototype much faster than building custom tooling.

### Reference: OpenFang Hands Architecture

The "Hands" pattern (autonomous agents with bundled prompts, skills, and guardrails running on schedules) is a useful architectural reference for the ZAO AI agent phase, even if OpenFang itself isn't the right tool.

### Already Working: Superpowers

No action needed — already installed and in use.

---

## Sources

- [Hats Anchor App Repository](https://github.com/Hats-Protocol/hats-anchor-app)
- [Hats Protocol Documentation](https://docs.hatsprotocol.xyz/)
- [Hats Protocol Website](https://www.hatsprotocol.xyz/)
- [Hats Protocol Core Contracts](https://github.com/Hats-Protocol/hats-protocol)
- [Hats Protocol Introduction](https://hats.mirror.xyz/NXJI4Rkk4TafwLvVZLfdlz-sLWdrNlKFmvJq9cKDkiw)
- [OpenFang Website](https://www.openfang.sh/)
- [OpenFang Repository](https://github.com/RightNow-AI/openfang)
- [OpenFang on Product Hunt](https://www.producthunt.com/products/openfang)
- [Superpowers Repository](https://github.com/obra/superpowers)
- [Priyanka Vergadia](https://x.com/pvergadia)
- [Dr. Alvaro Cintas](https://alvarocintas.com/)
