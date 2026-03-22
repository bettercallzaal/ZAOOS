# 108 — Superchain ORDAO & Cross-Chain Fractal Governance

> **Status:** Research complete
> **Date:** 2026-03-22
> **Goal:** Understand Superchain ORDAO architecture, cross-chain Respect, Hats integration, Eden Fractal Epoch 2, and Optimism grant alignment for ZAO

---

## 1. Superchain ORDAO MVP

### What is Superchain ORDAO?

Superchain ORDAO extends the ORDAO governance framework across multiple OP Stack chains (Optimism, Base, and future Superchain members). The concept was pitched at the **Superchain Interop Incubator** by Optimystics and showcased alongside Eden Fractal's 3-year anniversary milestone.

The goal: a single fractal governance system that coordinates communities across the entire Superchain, using Respect as the shared reputation primitive.

### Hub-and-Spoke Architecture

The Superchain ORDAO MVP implements cross-chain governance through a **hub-and-spoke model**:

| Component | Role | Chain |
|-----------|------|-------|
| **Hub Contract** | Central Respect token issuance + tracking | Primary chain (e.g., Optimism for OF, Base for EF) |
| **Spoke Contracts** | "Respect emitter contracts" — enable voting, burning, minting, balance verification | Other Superchain L2s |
| **Ornode** | Off-chain API storing proposals + Respect metadata | Shared infrastructure |

**How it works:**
1. Each community deploys its ORDAO (OREC + Respect1155) on its home chain
2. Spoke "Respect emitter" contracts on other chains can read balances and emit votes
3. Communities can execute governance decisions across multiple chains while maintaining unified Respect recognition
4. The hub maintains canonical Respect state; spokes provide cross-chain access

**Technical mechanism:** The Superchain's native `L2ToL2CrossDomainMessenger` enables low-latency message passing between OP Stack chains. This contract:
- Takes `_destination` (chain ID) + `_target` (contract address on destination)
- Emits log entries with nonce + sender for replay protection
- An autorelayer or the application calls `relayMessage` on the destination chain

This means Respect balances on Optimism can be verified on Base (and vice versa) without traditional bridges — just native Superchain interop messaging.

### Can ZAO (Optimism) and Eden Fractal (Base) Share Respect?

**Yes, architecturally.** The hub-and-spoke model is specifically designed for this:
- ZAO's ORDAO lives on Optimism (OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`)
- Eden Fractal's ORDAO is deploying on Base (Epoch 2)
- A spoke contract on Base could read ZAO Respect balances from Optimism
- A spoke contract on Optimism could read Eden Fractal Respect from Base

**Current status:** The cross-chain spoke contracts are in development as part of the Superchain Interop Incubator work. The `L2ToL2CrossDomainMessenger` is the native mechanism that would power this.

---

## 2. Cross-Chain Respect

### Can Respect Earned on One Chain Count on Another?

**Yes, via three mechanisms:**

1. **Native Superchain Interop (preferred):** `L2ToL2CrossDomainMessenger` allows contracts on one chain to read state from another. A Respect eligibility check on Base can query Optimism Respect balances natively — no bridge needed, just message passing.

2. **Spoke Respect Emitter Contracts:** The Superchain ORDAO design includes "Respect emitter contracts" that can be deployed on any Superchain L2. These contracts emit, verify, and count Respect across chains without requiring token transfers (since Respect is soulbound/non-transferable anyway).

3. **Off-chain Aggregation via Ornode:** The ornode service already stores proposals and Respect metadata off-chain. A multi-chain ornode could aggregate Respect from multiple ORDAO deployments and present a unified view to frontends.

### Is There a Bridge Mechanism?

**Respect tokens are soulbound (non-transferable ERC-1155)** — they cannot and should not be bridged in the traditional sense. Instead:
- Cross-chain verification happens via message passing (not token transfer)
- The `L2ToL2CrossDomainMessenger` reads balances cross-chain
- This preserves the soulbound property while enabling cross-chain recognition

### What Does "Higher Order Fractal" Mean?

The concept (derived from Daniel Larimer's "More Equal Animals" framework) describes **nested fractal governance layers**:

1. **Individual fractals** — ZAO, Eden Fractal, Optimism Fractal each run their own Respect Games
2. **Inter-fractal coordination** — Representatives from each fractal participate in a higher-order fractal
3. **Ecosystem-level governance** — Respect from multiple fractals contributes to broader Superchain decision-making

In practice:
- A ZAO member's Respect counts in ZAO governance
- That Respect could also give weight in a "Superchain Fractal Council" that coordinates across communities
- This scales fractal democracy from small groups to ecosystem-wide coordination
- The Optimism Fractal Council already demonstrates this: 65+ members with Respect-weighted voting on treasury and operations

---

## 3. Hats Protocol + ORDAO Integration

### How Optimism Fractal Uses Hats with ORDAO

Optimism Fractal has an **"award-winning Hats Tree"** that programmatically assigns roles based on Respect earned through the Respect Game. The integration:

1. Respect Game distributes Fibonacci-scored tokens (55, 34, 21, 13, 8, 5 per session)
2. Respect1155 balances accumulate as soulbound ERC-1155 tokens
3. Hats Protocol's **ERC1155 Eligibility Module** checks these balances
4. Hats are automatically granted/revoked based on Respect thresholds

### Can Respect Levels Automatically Grant Hats?

**Yes.** Hats Protocol has a native **ERC1155 Eligibility Module** designed exactly for this:

| Configuration | Value |
|--------------|-------|
| **Module type** | `MultiERC1155EligibilityModule` |
| **Token contract** | Respect1155 address (e.g., ZOR: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`) |
| **Token ID** | `0` (for total Respect balance) |
| **Min balance** | Configurable per hat (e.g., 100 Respect for "Active Member", 500 for "Council Member") |

**Setup process:**
1. Navigate to ZAO's Hats tree on app.hatsprotocol.xyz
2. Edit a hat → "Revocation & Eligibility" → "Automatically"
3. Create new ERC1155 Eligibility Module
4. Point to ZOR Respect1155 contract + set minimum balance threshold
5. Deploy — hat auto-grants to anyone meeting the Respect threshold

### ZAO's Hats Tree + ORDAO Respect Thresholds

ZAO already has a Hats tree at `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137` on Optimism. Integration path:

| Hat Role | Respect Threshold | ORDAO Permission |
|----------|------------------|-----------------|
| ZAO Member | Any ZOR balance > 0 | Can vote on proposals |
| Active Contributor | ZOR >= 100 | Can create proposals |
| Council Member | ZOR >= 500 | Can execute approved proposals |
| Admin | ZOR >= 1000 + Council election | Full OREC permissions |

**Implementation:**
1. Add ERC1155 Eligibility Modules to existing ZAO Hats tree
2. Point each module to ZOR contract (`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`)
3. Set appropriate `minBalance` per hat
4. OREC can then check Hats for permission gating (e.g., only "Council Member" hat wearers can execute)

This creates a **fully automated governance pipeline**: earn Respect → get Hat → gain ORDAO permissions.

---

## 4. Eden Fractal Epoch 2 on Base

### Timeline

| Date | Event |
|------|-------|
| May 2022 | Eden Fractal launches on EOS, weekly meetings |
| 2022-2024 | 100+ events, ~10 members average, self-funded |
| Aug 2024 | "False start" — Epoch 2 announced prematurely (ORDAO not ready) |
| Nov 2024 | ORDAO adopted by Optimism Fractal Council |
| Jun 5, 2025 | Official Epoch 2 launch (event #121) — ORDAO deployed on Base |
| 2025-2026 | Epoch 2 active — Base-native governance |

### Base Contract Addresses

**Not yet publicly documented as of this research.** The Epoch 2 launch post and technical deployment docs have not published Base contract addresses. What we know:

- ORDAO (OREC + Respect1155) is confirmed deployed on Base as of Epoch 2 launch
- The contracts follow the same architecture as Optimism Fractal's deployment
- Eden Fractal's GitHub: [James-Mart/eden-fractal-contract](https://github.com/James-Mart/eden-fractal-contract) (EOS-era contracts)

**For comparison — Optimism Fractal's contracts (OP Mainnet):**

| Contract | Address |
|----------|---------|
| Parent Respect Account (S1-4) | `0x53C9E3a44B08E7ECF3E8882996A500eb06c0C5CC` |
| Respect1155 (S5+) | `0x07418B51196045EB360F31d8881326858Ed25121` |
| OREC | `0x73eb8B61E6Eb65aFAAE972874bB4EB5689d1cCE3` |

**ZAO's contracts (OP Mainnet):**

| Contract | Address |
|----------|---------|
| OREC | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| Respect1155 (ZOR) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| OG Respect (frozen) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` |

### Is the Same Ornode Used for Both Eden and ZAO?

Each ORDAO deployment runs its own ornode instance configured for its specific contracts. However:
- The ornode software is the same codebase (from `sim31/ordao` monorepo)
- It could theoretically be configured as a multi-tenant service
- Currently, each community manages its own ornode pointing to its own OREC + Respect1155

### EOS Respect Migration to Base

Eden Fractal's Epoch 1 ran on EOS (Antelope chain). The migration to Base for Epoch 2:
- EOS Respect is on a completely different blockchain (not EVM-compatible)
- There is no direct on-chain bridge from EOS to Base
- The migration likely involves a **snapshot + claim mechanism**: EOS Respect balances snapshotted, then a Base claim contract allows verified holders to mint equivalent Respect1155 tokens
- Specific claim interface details are not yet documented publicly

---

## 5. Optimism Collective Alignment

### Has Eden Fractal / Optimism Fractal Received Optimism Grants?

**Yes.** Documented grant activity:

| Grant | Details |
|-------|---------|
| **Grants Council (Season 6)** | "Optimism Fractal Respect Game: Research into Democratic Fund Distribution" — approved by Grants Council |
| **Builders Committee** | Optimism Fractal applied to bring builders into the ecosystem |
| **RetroPGF participation** | Optimism Fractal is documented exploring Retro Funding Rounds 4-7; specific amounts not publicly disclosed |
| **Superchain Interop Incubator** | Optimystics participated with Superchain ORDAO pitch |

The Season 6 research grant covers six milestones:
1. Initial Technical Architecture Blueprint
2. Governance Integration Strategy Document
3. Legal and Compliance Framework Development
4. Role-based Reward Allocation System
5. User Experience Design for System Interface
6. Gamified Interface Prototype

### Could ZAO Apply for Optimism Grants?

**Absolutely.** ZAO is well-positioned for multiple grant tracks:

| Track | ZAO Fit | Rationale |
|-------|---------|-----------|
| **Retro Funding (Onchain Builders)** | Strong | ZAO has deployed ORDAO contracts, runs Respect Games, builds on OP Mainnet |
| **Grants Council (Builders)** | Strong | ZAO OS is a gated Farcaster client with real users on Optimism |
| **Foundation Missions** | Medium | New RFPs for Superchain Interop (EIP-7702, ERC-7683, Oracle Standards) — apply by April 11 |
| **Superchain Interop Incubator** | Strong | ZAO + Eden Fractal cross-chain Respect is a textbook interop use case |

**Key selling points for a ZAO grant application:**
- Active fractal community using ORDAO on Optimism
- Hats tree already deployed at `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`
- ZOR Respect tokens distributed via Respect Game
- Cross-chain use case with Eden Fractal (Optimism ↔ Base)
- Open-source toolkit (ZAO OS) built on Optimism infrastructure
- Music community — unique vertical for Optimism ecosystem diversity

**RetroPGF context:** The Optimism Collective has distributed 30M OP in recent rounds, with 850M+ OP allocated for future Retro Funding. The next round focuses specifically on onchain builders — ZAO qualifies.

### Alignment with Optimism Collective Values

| Optimism Value | ZAO Alignment |
|---------------|---------------|
| **Impact = Profit** | Respect Game measures impact retroactively |
| **Public Goods** | ZAO OS is open-source; fractal governance is a public good |
| **Superchain Vision** | Cross-chain Respect between ZAO (OP) and Eden Fractal (Base) |
| **Democratic Governance** | Fractal democracy is consent-based, not plutocratic |
| **Credible Neutrality** | Respect is soulbound — cannot be bought, only earned |

---

## Key Repositories & Links

| Resource | URL |
|----------|-----|
| ORDAO monorepo | [sim31/ordao](https://github.com/sim31/ordao) |
| Optimystics GitHub | [github.com/Optimystics](https://github.com/Optimystics) |
| Optimystics ORDAO page | [optimystics.io/ordao](https://optimystics.io/ordao) |
| OREC specification | [optimystics.io/orec](https://optimystics.io/orec) |
| Optimystics frapps toolkit | [github.com/Optimystics/frapps](https://github.com/Optimystics/frapps) |
| Optimism Fractal | [optimismfractal.com](https://optimismfractal.com/) |
| OF Contract Accounts | [optimismfractal.com/account](https://optimismfractal.com/account) |
| OF Council | [optimismfractal.com/council](https://optimismfractal.com/council) |
| Eden Fractal | [edenfractal.com](https://edenfractal.com/) |
| Eden Fractal Epoch 2 | [edenfractal.com/epoch2-implementation-plan](https://edenfractal.com/epoch2-implementation-plan/elements-of-epoch-2/clarifying-eden-fractals-epoch-1-and-epoch-2-timeline) |
| Hats ERC1155 Eligibility | [docs.hatsprotocol.xyz/.../erc1155-eligibility](https://docs.hatsprotocol.xyz/hats-integrations/eligibility-and-accountability-criteria/erc1155-eligibility) |
| Superchain Interop Docs | [docs.optimism.io/stack/interop](https://docs.optimism.io/stack/interop/message-passing) |
| Optimism Grants | [community.optimism.io/grant](https://community.optimism.io/grant/grant-overview) |
| OF Governance Forum Post | [gov.optimism.io/t/8399](https://gov.optimism.io/t/announcing-optimism-fractal-s-intent-to-optimize-governance-on-the-superchain/8399) |
| OF Respect Game Grant | [gov.optimism.io/t/9617](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617) |
| Fractal History | [optimystics.io/blog/fractalhistory](https://optimystics.io/blog/fractalhistory) |
| Optimism Atlas (grants) | [atlas.optimism.io](https://atlas.optimism.io/) |

---

## Related ZAO Research

- [56 — ORDAO & Respect Game System](../56-ordao-respect-system/README.md)
- [58 — Respect Deep Dive](../58-respect-deep-dive/README.md)
- [59 — ZAO Hats Tree Integration](../59-hats-anchor-app-and-tooling/README.md) (note: doc 59 covers Hats tree)
- [75 — Hats Protocol v2 Updates](../75-hats-protocol-v2-updates/README.md)
- [102 — Fractals Page: frapps, ORDAO, ZAO Integration](../102-fractals-frapps-ordao-page/README.md)
- [103 — Fractal Governance Ecosystem](../103-fractal-governance-ecosystem/README.md)
- [104 — Fractal Communities Directory](../104-fractal-communities-directory/README.md)
- [105 — Fractal Key People](../105-fractal-key-people/README.md)
- [106 — Dan Singjoy / Eden Fractal Deep Dive](../106-dan-singjoy-eden-fractal-deep-dive/README.md)
