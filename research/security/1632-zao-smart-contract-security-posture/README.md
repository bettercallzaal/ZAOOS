# 1632 — ZAO Smart Contract Security Posture (Jul 2026)

**Type:** SECURITY-REFERENCE  
**Topic:** Security  
**Status:** ACTIVE — Reference for press, grant reviewers, and technical due diligence. ZAO uses smart contracts on Solana (WaveWarZ), Optimism (governance), and Base (tokens). This doc captures the current security posture: what's been reviewed, known risks, and what a formal audit should cover. Update after any audit or contract upgrade.

---

## Executive Summary

ZAO's on-chain components have operated without a security incident through 1,245 WaveWarZ battles and 100+ Fractal Democracy governance sessions (Jul 2026). No formal third-party audit has been completed as of Jul 2026. The design philosophy minimizes blast radius: governance contracts are optimistic (72h veto window), artist payouts are automatic (no manual intervention), and no user funds are custodied by ZAO.

**Key security property:** ZAO never holds user funds. Fan prediction tokens are custodied by the WaveWarZ smart contract; artist payouts fire automatically at settlement; charity payouts fire automatically at settlement. There is no ZAO treasury wallet that could be compromised to drain user funds.

---

## Contracts in Scope

### Solana: WaveWarZ Game Program

**Status:** Proprietary program (not open source as of Jul 2026)  
**Audit status:** No formal audit  
**Risk level:** Medium — holds prediction token funds during battle window  

**What it does:**
- Creates battle PDAs (Program Derived Addresses) for each battle
- Manages bonding curve for prediction token pricing
- Settles battles and fires payout transactions automatically

**Known risk factors:**
- No formal audit — relying on testing and operational track record
- Bonding curve logic is complex; a price manipulation attack could drain a battle pool
- Private program = less public scrutiny, but also less attack surface for public exploits

**Mitigations in place:**
- Per-battle isolation: each battle is a separate PDA — a compromise of one battle cannot affect others
- Automatic settlement: no admin key required for payouts (reduces key compromise risk)
- Volume limits: low per-battle volumes mean financial impact of any exploit is bounded

**Recommended next audit step:** Commission a Solana program audit from a Solana-native firm (Neodyme, OtterSec, Halborn) before reaching $100K cumulative battle volume.

---

### Optimism: Governance Contracts

**OREC (Optimistic Respect-based Executive Contract)**  
`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`  
**Status:** Open source (ORDAO framework)  
**Audit status:** ORDAO framework has been reviewed by the Optimystics community; no independent ZAO-specific audit  
**Risk level:** Low — optimistic execution with 72h veto window

**How OREC reduces risk:**
- Any governance action submitted to OREC has a 72-hour window during which ZOR holders can veto
- This means even if a malicious proposal were submitted, the community has time to reject it
- OREC does not hold funds — it records governance decisions; execution (payouts) happens elsewhere

**OG ERC-20 Respect Token**  
`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`  
**Type:** Soulbound (non-transferable) ERC-20  
**Risk:** Minimal — non-transferable tokens have no secondary market exploit surface  
**Audit status:** Standard OpenZeppelin-based ERC-20 with transfer restrictions; not independently audited

**ZOR ERC-1155**  
`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`  
**Type:** Soulbound ERC-1155 (governance power token)  
**Risk:** Low — soulbound prevents flash loan governance attacks  
**Audit status:** Not independently audited

**Key security property of ZOR soulbound:** Because ZOR cannot be borrowed or transferred, the standard "governance flash loan attack" (borrow tokens, vote, return) is impossible. ZOR holders must actually hold and earn ZOR to vote.

---

### Base: Identity and Token Contracts

**$ZAO ERC-20**  
**Risk:** Standard ERC-20; primary risk is key compromise of deployer wallet  
**Audit status:** Not audited  
**Mitigation:** Limited functionality (identity token, not utility/financial token)

**ZABAL ERC-20**  
**Risk:** Standard ERC-20; used for micro-grants and staking (doc 349)  
**Audit status:** Not audited  
**Note:** ZABAL has not yet been used in production staking (doc 349 is planning-stage)

---

## Key Security Properties Summary

| Property | Status |
|---|---|
| ZAO does not custody user funds | ✅ True — funds are in smart contracts, not a ZAO wallet |
| Governance has a veto window | ✅ True — OREC 72h veto |
| Flash loan governance attacks blocked | ✅ True — ZOR is soulbound |
| Per-battle fund isolation (Solana) | ✅ True — each battle is a separate PDA |
| Formal third-party audit | ❌ Not yet completed |
| Bug bounty program | ❌ Not yet established |
| Multi-sig admin key (Solana program upgrade) | ❓ Unknown — Zaal to confirm |
| Open source WaveWarZ game program | ❌ Private as of Jul 2026 |

---

## Incident Response Protocol

If a security incident is discovered:

**Severity 1 (funds at risk, active exploit):**
1. Zaal manually pauses any affected feature (wavewarz.info admin)
2. ZOE posts to Telegram: "⚠️ ZAO is investigating a potential security incident. [Feature] is temporarily suspended. No action needed from users. Update in 1 hour."
3. Zaal contacts WaveWarZ backend team (private repo owner) immediately
4. Do NOT disclose exploit details publicly until patched

**Severity 2 (vulnerability found, not actively exploited):**
1. Zaal evaluates patch timeline
2. ZOE posts general maintenance notice if feature needs to go offline for patching
3. Disclose responsibly after patch is live

**Severity 3 (low-risk finding, no active threat):**
1. Document in a ZAOOS security finding doc
2. Add to future audit scope
3. No public disclosure required

---

## Pre-Audit Checklist (Before Seeking Formal Audit)

Before commissioning an audit, ZAO should:
- [ ] Make WaveWarZ Solana program source code available to auditors (confidential disclosure)
- [ ] Document the intended behavior of the bonding curve + settlement math
- [ ] Confirm the program upgrade authority key (is it multi-sig? sole key?)
- [ ] Review all admin functions: who can pause battles? Who can change the fee rate?
- [ ] Establish a bug bounty (HackerOne or Immunefi) before public launch of high-value battles

**Audit priority order:**
1. WaveWarZ Solana program (highest TVL, most complex logic)
2. ZOR ERC-1155 on Optimism (governance power — compromise could affect all votes)
3. ZABAL staking contracts (when active — doc 349)

---

## What ZAO Can Cite Today (Press/Grants)

**Honest framing:**
> "ZAO's smart contracts have operated through 1,245 WaveWarZ battles and 100+ governance sessions without a security incident. Key security properties: ZAO never custodies user funds (all held in smart contracts), governance uses a 72-hour optimistic veto window, and ZOR's soulbound design prevents flash loan governance attacks. A formal third-party audit is planned as part of ZAO's 2026 growth roadmap."

**What NOT to claim:**
- "Audited" (not yet true)
- "Fully decentralized" (Zaal has admin keys for WaveWarZ program upgrade)
- "Battle funds are guaranteed safe" (no formal security guarantee without audit)

---

## Related Docs

- 1628 — ZAO Multi-Chain Architecture Guide (contract addresses + chain roles)
- 1619 — Fractal Democracy Session Guide (OREC governance + 72h veto)
- 1605 — WaveWarZ Estate Audit (public repo inventory — what's open source)
- 1414 — Helius RPC + Webhook Spec (Solana-side monitoring)
- 1525 — OP Retro Funding Evidence Package (Optimism-specific track record)
