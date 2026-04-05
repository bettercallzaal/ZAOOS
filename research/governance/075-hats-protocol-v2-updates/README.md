# 75 — Hats Protocol V2 Updates & New Tooling

> **Status:** Research complete
> **Date:** 2026-03-19
> **Goal:** Document new Hats Protocol tooling since docs 07/55/59, easier integration paths, and impact on ZAO OS

---

## Key Decisions / Recommendations

| Priority | Action | Why |
|----------|--------|-----|
| **High** | Wire hat-based gating into Governance "Manage" tab | Currently gated by FID-based `session.isAdmin`, not hat ownership — any Configurator wearer should have access |
| **High** | Replace sequential RPC hat-fetching with `@hatsprotocol/sdk-v1-subgraph` | Current `tree.ts` makes individual `viewHat()` calls per hat (slow for 20+ hat tree). Subgraph does it in one GraphQL query |
| **High** | Wire `requirePermission()` into gated API routes | `gating.ts` exports it with JSDoc but it's not used in any API routes yet |
| **Medium** | Expand HatManager to support `createHat` and `transferHat` | Currently only `mintHat` — users must leave ZAO OS for app.hatsprotocol.xyz for other operations |
| **Medium** | Use SDK `walletClient` path instead of raw inline ABI for writes | SDK validates hat existence, admin status, supply before tx — raw ABI skips these checks |
| **Low** | Deploy ERC-1155 Eligibility module for $ZOR-gated hats | Enables self-service claiming — removes admin bottleneck for role assignment |
| **Future** | Integrate Hats Protocol MCP server with AI agent | Natural-language DAO governance queries for ElizaOS onboarding agent |

---

## What ZAO OS Has Built (Current State)

ZAO OS has a **complete, well-structured** Hats integration matching the architecture in doc 59.

### Files Built

| Layer | File | What It Does |
|-------|------|-------------|
| Client | `src/lib/hats/client.ts` | Singleton `HatsClient` via `@hatsprotocol/sdk-v1-core` on Optimism. Read-only: `isWearerOfHat()`, `getWornHats()` |
| Constants | `src/lib/hats/constants.ts` | All ZAO Tree 226 hat IDs (256-bit encoding). 17 project sub-hats + `HAT_LABELS` map + `formatHatId()` |
| Tree | `src/lib/hats/tree.ts` | Full tree-fetching with 5-minute cache. IPFS details via 3 fallback gateways. Typed `HatNode` hierarchy (4 levels) |
| Gating | `src/lib/hats/gating.ts` | 6 permission types: `admin`, `moderate`, `governance`, `feature_tracks`, `manage_events`, `manage_projects`. Functions: `hasPermission()`, `getPermissions()`, `getRoles()`, `isHatAdmin()`, `requirePermission()` |
| API | `src/app/api/hats/tree/route.ts` | GET — auth-gated, returns full tree with resolved IPFS names |
| API | `src/app/api/hats/check/route.ts` | GET — auth-gated, Zod-validated, checks wallet's hats |
| UI | `src/components/hats/HatTree.tsx` | Visual tree with color-coded levels, wearer counts, expand/collapse, connecting lines |
| UI | `src/components/hats/HatManager.tsx` | Admin-only mint UI. Uses wagmi `useWriteContract` with inline ABI. Requires Optimism |
| UI | `src/components/hats/HatBadge.tsx` | Compact/expanded badge showing wallet's roles. 5-minute client cache |
| Tests | `src/lib/hats/__tests__/*.test.ts` | Full test suite for gating + constants |
| Tests | `src/app/api/hats/__tests__/*.test.ts` | API route tests for check + tree |
| Page | `src/app/(auth)/governance/page.tsx` | 4 tabs: Respect, Roles (HatTree), Proposals, Manage (HatManager, admin-only) |

### Gaps Not Yet Wired

- `requirePermission()` exists but isn't used in any API route actions
- "Manage" tab gated by `session.isAdmin` (FID-based), not hat-based
- `HatManager` only supports `mintHat` — no `createHat`, `transferHat`, `renounceHat`
- Write operations use raw inline ABI, not the SDK `walletClient` path
- Tree fetching uses sequential RPC calls, not the subgraph

---

## New Eligibility Modules (Since Docs 07/55)

| Module | Status in Old Docs | Current Status | ZAO Relevance |
|--------|-------------------|----------------|---------------|
| ERC-20 Eligibility | Documented | Live | Low — ZAO uses ERC-1155 ($ZOR) |
| ERC-721 Eligibility | Documented | Live | Low |
| ERC-1155 Eligibility | Documented | Live | **HIGH** — $ZOR holders could self-claim hats |
| Staking Eligibility | Documented | Live (now with Judge Hat + slashing) | **Medium** — accountability for Curators/Moderators |
| Allow-List Eligibility | Documented | Live | Medium — matches ZAO's allowlist model |
| Hat-Wearing Eligibility | Documented | Live | Medium — role prerequisites |
| JokeRace Eligibility | Documented | Live | Low |
| Hats Election Eligibility | Documented | Live | Medium — governance council elections |
| **CoLinks Eligibility** | NOT in old docs | **Live** | Medium — Coordinape social graph reputation |
| **Unlock Protocol Membership** | NOT in old docs | **Live** | **HIGH** — subscription-gated hats, auto-revoke on lapse |
| **Gitcoin/Human Passport** | "Coming soon" in doc 55 | Partially live | Medium — Sybil resistance (rebranded to Human Passport by Holonym, Feb 2025) |
| EAS Attestations | "Coming soon" | Still "coming soon" | High when ready — ZAO planned this in doc 12 |
| Composite multi-criteria | "Coming soon" | Still "coming soon" | High when ready |

### New Toggle Modules

- **Seasonal Time-Expiry Toggle** — time-based activation (v1 Season Toggle renamed)
- **Pass-Through Hat-Based Toggle** — toggle one hat based on another hat's status

### New Hatter Modules

- **Multi Claims Hatter** — self-service claiming for eligible addresses (confirmed live)
- **DAOhaus Moloch v3 Membership** — grants hats based on Moloch v3 DAO membership

---

## Hats Signer Gate v2 (Live)

HSG v2 is fully documented and deployed. Key additions over v1:

| Feature | v1 | v2 |
|---------|----|----|
| Threshold type | Fixed | **ABSOLUTE** (e.g., always 3-of-N) or **PROPORTIONAL** (basis points, e.g., 5100 = 51%) |
| Threshold management | Manual | **Dynamic** — auto-adjusts as signers join/leave |
| Batch onboarding | N/A | `claimSignerFor()` and `claimSignersFor()` |
| Delegatecall | Unrestricted | **Guard restricts** unsafe delegatecall |

**ZAO impact:** When ZAO's treasury (Safe multisig) is operational, connect it to HSG v2 with PROPORTIONAL thresholds so signing authority automatically tracks Configurator hat wearers.

---

## Hats Account (ERC-6551) — Now Mature

`@hatsprotocol/hats-account-sdk` is live and stable. Each hat gets a deterministic smart contract account:

- Send/receive ETH, ERC-20, ERC-721, ERC-1155 tokens
- Sign messages (ERC-1271 compatible)
- Vote and create proposals in Moloch DAOs
- Call external contracts
- Addresses are deterministic — usable before deployment

---

## Hats Protocol MCP Server (New)

A **Model Context Protocol (MCP) server** for Hats Protocol now enables AI agents to interact with DAO governance:

- Role management: mint, transfer, revoke hats
- Hierarchy querying: read trees, sub-committees, wearer lists
- Permission checking: natural language ("is address X a grants committee member?")
- Analytics: org health, structure, activity via GraphQL
- Multi-chain: Ethereum, Polygon, Arbitrum, Optimism, Base, Gnosis
- Human oversight: AI proposes, human approves before on-chain execution

**ZAO impact:** Directly relevant to the planned ElizaOS AI agent (doc 24). The MCP server enables the agent to understand and explain the governance structure, check member roles, and guide onboarding — all without custom code.

---

## Modules Registry

The [Hats-Protocol/modules-registry](https://github.com/Hats-Protocol/modules-registry) GitHub repo is the canonical index of all live modules with:

- Full JSON metadata per module
- Deployment addresses across all 8 supported chains
- ABIs for programmatic interaction
- Auto-generates UIs for the Anchor App
- Community-extensible via PRs

---

## Chain Support — Now 8 Mainnets

Ethereum, **Optimism** (ZAO's chain), Base, Arbitrum, Gnosis, Polygon, Scroll, Celo.

Same deterministic address: `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`

---

## Subgraph SDK (v1.0.0 — Production Ready)

`@hatsprotocol/sdk-v1-subgraph` released v1.0.0 (March 2025). This is the formal production release enabling:

- Full tree fetch in a single GraphQL query (vs. sequential RPC `viewHat()` calls)
- Wearer lists, eligibility status, toggle status
- Historical data (hat creation events, wearer changes)

**ZAO impact:** Replace the waterfall `viewHat()` loop in `tree.ts` with one subgraph query. Tree load time drops from ~5-10 seconds to under 1 second. Keep existing RPC as fallback.

---

## Cross-References

- **Doc 07** — Hats Protocol fundamentals (still accurate for core concepts)
- **Doc 55** — Hats Anchor App & tooling landscape (augmented by new modules here)
- **Doc 59** — ZAO's Tree 226 integration (fully implemented, architecture validated)
- **Doc 12** — Gating (EAS attestation eligibility still "coming soon")
- **Doc 24** — AI Agent Plan (MCP server is new integration path)
- **Doc 31** — Governance/DAO (HSG v2 relevant for treasury)
- **Doc 56** — ORDAO/Respect (hat-gated roles complement respect scoring)

---

## Sources

- [Hats Protocol Documentation](https://docs.hatsprotocol.xyz/)
- [Eligibility & Accountability Criteria — Full Module List](https://docs.hatsprotocol.xyz/hats-integrations/eligibility-and-accountability-criteria)
- [Activation & Deactivation Criteria (Toggle Modules)](https://docs.hatsprotocol.xyz/hats-integrations/activation-and-deactivation-criteria)
- [Hatter Modules](https://docs.hatsprotocol.xyz/hats-integrations/hatter-modules)
- [Hats Signer Gate v2 Docs](https://docs.hatsprotocol.xyz/for-developers/hats-signer-gate-v2)
- [Hats Account (ERC-6551)](https://docs.hatsprotocol.xyz/hats-integrations/permissions-and-authorities/hats-account)
- [Hats Protocol Supported Chains](https://docs.hatsprotocol.xyz/using-hats/hats-protocol-supported-chains)
- [Staking Eligibility Module](https://docs.hatsprotocol.xyz/hats-integrations/eligibility-and-accountability-criteria/staking-eligibility)
- [sdk-v1-core Releases (GitHub)](https://github.com/Hats-Protocol/sdk-v1-core/releases)
- [Modules Registry (GitHub)](https://github.com/Hats-Protocol/modules-registry)
- [Unlock Protocol + Hats Protocol Integration](https://unlock-protocol.com/blog/unlock-protocol-and-hats-protocol-integration)
- [Bridging AI and DAOs: Hats Protocol MCP Server](https://skywork.ai/skypage/en/ai-daos-hats-protocol/1980089516992090112)
- [Hats Modules: A New Era for Programmable Organizations (Mirror)](https://hats.mirror.xyz/xAk_yb7dDL1OLBx8nq47Ni7V1SuiC6L6B-49u7vz520)
- [Holonym acquires Gitcoin Passport (→ Human Passport)](https://www.coindesk.com/business/2025/02/10/digital-identity-startup-holonym-acquires-gitcoin-passport)
- [ZAO Tree 226 on Hats App](https://app.hatsprotocol.xyz/trees/10/226)
