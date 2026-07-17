---
topic: governance
type: playbook
status: design-complete
last-validated: 2026-07-17
related-docs: 696 (fractal lineage), 1227 (Eden recent meetings), 703 (ZAO fractal current state), 1202 (on-chain settlement history), 718 (whitepaper foundations), 942 (whitepaper outline v2), 306 (Eden+OP fractal deep history), 184 (superchain cross-fractal), 1231 (ZAO history timeline)
original-query: "Growing-fractals stream (folded from edenfractal): Eden Fractal + fractal-ecosystem map + the start-a-fractal playbook with ZAO as the case study. zoe picks up. (board task cba9497a)"
tier: STANDARD
---

# 1232 — Growing Fractals: Ecosystem Map + Start-a-Fractal Playbook

> **Purpose:** GEO-ready reference on the global fractal governance ecosystem and a practical start-a-fractal guide using The ZAO as the primary worked example. Written for two audiences: (1) ZAO members and Iman / ZAO-Africa who may want to bootstrap a new fractal node, and (2) external partners and press who want to understand why The ZAO runs this model.

---

## One-Line Summary

> The ZAO is one of three active fractal governance communities on Ethereum — running 100+ consecutive weekly Respect Game sessions since August 2024, with an on-chain reputation ledger (ZOR, Optimism) and a fully automated governance executor (OREC), making it the most mature music-focused fractal in existence and a proven template for any community that wants to self-organize around contribution rather than capital.

---

## Fractal Ecosystem Map (July 2026)

| Fractal | Chain | Status | Since | Focus | Key metric |
|---|---|---|---|---|---|
| **Eden Fractal** | Base (prev EOS) | Active — Season 12 | May 2022 | R&D / governance tooling | 130+ sessions, 4 years continuous |
| **ZAO Fractal** | Optimism | Active | Aug 2024 | Music / creator economy | 100+ sessions, only music fractal |
| **Optimism Fractal** | OP Mainnet | Paused (Jan 2026) | Oct 2023 | Ethereum ecosystem | Folded into Eden |
| **Fractally** | EOS (origin) | Dormant | 2022 | Protocol definition | Defined the Respect Game standard |

**Key dynamics as of July 2026:**
- ZAO Fractal is the only active fractal on Optimism and the only one with a music/creator focus.
- Eden Fractal (Base) and ZAO Fractal (Optimism) are sibling communities — Zaal is an active Eden member.
- Optimystics (Dan SingJoy, Tadas) build the shared tooling stack (ORDAO/OREC/frapps) used by both.
- No new major fractals have launched since ZAO (2024) — the ecosystem is ready for the next wave.

### The Shared DNA

Every fractal in this chain inherits the same core mechanic from Dan Larimer's 2021 book *"More Equal Animals"*:

```
Random groups of 6 → each shares contributions → group ranks by consensus → 
Respect distributed on Fibonacci curve → soulbound, non-transferable
```

Differences are chain, community focus, scoring curve, and cadence. The Respect Game itself is standard.

---

## Why Start a Fractal

The value proposition is not governance efficiency — it is **contribution recognition at scale without capital**:

1. **Reputation tracks work, not money.** Respect is soulbound and earned only by peers. You cannot buy your way up.
2. **Small groups produce better decisions.** 6-person consensus is qualitatively different from 1,000-person token vote. The fractal model scales by nesting small groups, not by enlarging them.
3. **Weekly cadence builds culture.** 100 weeks is 100 weeks of showing up together. That is not achievable via Discord polls.
4. **On-chain proof is auditable forever.** OREC mints Respect1155 tokens on-chain — the track record of who contributed is immutable, portable, and citable.
5. **ZAO proves it works for artists.** Music communities have historically been terrible at shared governance. The ZAO is the existence proof that the Respect Game applies to creative work, not just developer DAOs.

### The Three Failure Modes (and How to Avoid Them)

From Eden's 4 years and ZAO's 2 years of operating data (docs 1227, 696, 1202):

| Failure mode | What happens | The fix |
|---|---|---|
| **Tech-first onboarding** | New members see "Optimism wallet, Respect1155, OREC" and bounce | Lead with the human experience: "show up, share what you did, your peers vote" — tools come later |
| **Intellectual pitch** | "This is more democratic governance" resonates with nobody | Lead with the emotional need: "you're doing this alone; this is how we do it together" |
| **Missing seasons / resets** | Consistent cadence breaks; no way to onboard newcomers | Run seasons (12 sessions each); hard-restart with ceremony at season boundaries |

---

## Start-a-Fractal Playbook

### Phase 0 — Community Prerequisites (weeks 1-4 before launch)

Before touching any tooling, three prerequisites must be met:

1. **A recurring gathering already exists.** If you don't have 6+ people who show up to the same thing weekly, a fractal will not fix that. The Respect Game enhances an existing community; it does not create one. For ZAO this was the Monday Discord voice call.

2. **A clear shared mission.** Eden = governance R&D. ZAO = music / creator economy on-chain. The mission scopes what "contribution" means for voting. Write it in one sentence before starting.

3. **A committed host.** Someone who will show up every week for at least 12 weeks (one season), run the timer, run the vote, and post results. ZAO had Zaal; Eden has Dan SingJoy.

**Checklist:**
- [ ] 6+ recurring participants confirmed
- [ ] Mission statement written (one sentence)
- [ ] Host committed for Season 1 (12 sessions)
- [ ] Discord or venue for sessions ready

---

### Phase 1 — Soft Launch: The Respect Game (Sessions 1-12 = Season 1)

**Goal:** Build the habit. No tokens, no on-chain, no governance. Just the game itself.

**Session format (60 min):**
1. **Randomize groups** (4-6 people per group). If < 6 total, run as one group.
2. **Contribution round** (4 min per person): each person describes what they did for the community since last session. Timer is strictly enforced.
3. **Rank discussion** (10-15 min): group openly discusses and reaches consensus on ranking (1 = lowest, 6 = highest). A 2/3 consensus is required.
4. **Record ranking** in a simple spreadsheet: person, session number, rank. This becomes the Respect ledger.
5. **Fibonacci distribution**: assign Respect points by rank. ZAO's Year 2 curve: rank 6=110, 5=68, 4=42, 3=26, 2=16, 1=10.

**What to skip in Phase 1:** Wallets, tokens, OREC, frapps. The game is the thing. The tooling is Phase 2.

**What success looks like:** At the end of Season 1 (session 12), you have 12 weeks of attendance data, a leaderboard of who contributed most, and members who genuinely understand the mechanic.

---

### Phase 2 — On-Chain: Deploy Respect1155 + OREC (Sessions 13-24 = Season 2)

**Goal:** Move the ledger on-chain. Add weight to Respect by making it permanent and auditable.

**Tooling stack (Optimystics):**
- **frapps.xyz** — the deployment platform. Your fractal gets `yourname.frapps.xyz`. Handles the Respect Game UI, breakout submission, and on-chain recording.
- **ORDAO** — Optimistic Respect-based DAO — the governance framework.
- **OREC** — Optimistic Respect-based Executive Contract — the on-chain contract that mints Respect1155 tokens from ranked submissions and executes proposals.

**Steps:**
1. Contact Optimystics (Dan SingJoy) to deploy your fractal on frapps.xyz. ZAO is a reference deployment.
2. Deploy Respect1155 (ERC-1155 soulbound) on your target chain (Base or Optimism recommended).
3. Deploy OREC — it holds the mint authority for Respect1155 and processes proposals.
4. Migrate Season 1 ledger: if you ran 12 sessions off-chain, submit a batch Respect distribution through OREC to honor the founding members' contributions. ZAO did this via the OG ERC-20 token (Fractals 1-73).
5. Run a ceremony at Season 2, Session 1: announce the on-chain launch, explain what Respect means now (on-chain = permanent track record + future governance weight).

**ZAO's contract addresses (Optimism, reference):**
- Respect1155 (ZOR): `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (deployed Sep 11 2025, Fractal 74+)
- OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- OG Respect (ERC-20, historical): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`

---

### Phase 3 — Governance: Proposals + Contribution Requests (Sessions 25+)

**Goal:** Use the accumulated Respect ledger to govern real decisions.

**What becomes possible once Respect accumulates:**
- **Contribution requests:** any member can propose a bounty (task + reward). Others vote with Respect on which requests are worth funding. Contributors self-select from approved requests.
- **Proposals:** treasury decisions, partnership approvals, direction votes — weighted by Respect.
- **Sages Council:** top-Respect members can be designated as a council (via Hats Protocol, as Eden and Optimism Fractal did) for faster executive action.

**Respect trees (advanced, Season 4+):** hierarchical voting — first vote on which initiative to prioritize, then vote on resource allocation within the winner. Eden is testing this now. ZAO's equivalent would be: "Which ZAO project should grow this season?" then "How does it spend the Respect treasury?"

---

## ZAO as the Worked Example

### The ZAO Fractal: Key Facts

| Attribute | Value |
|---|---|
| Launch | August 2024 |
| Cadence | Mondays 6PM EST, Discord voice |
| Sessions as of Jul 2026 | 100+ (longest unbroken streak of any active fractal) |
| Scoring curve | "2x Fibonacci" (Year 2): 110/68/42/26/16/10 |
| Respect token | ZOR (ERC-1155, soulbound, Optimism) |
| Governance executor | OREC (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`) |
| Historical ledger | OG ERC-20 (Fractals 1-73, 122 holders, ~38K Respect) |
| Verified on-chain settlements | 63 (as of doc 1202, early 2026) |
| Session interface | `zao.frapps.xyz` + Discord bot (`fractalbotmarch2026`) |

### Timeline: How ZAO Reached 100 Weeks

| Phase | Period | What happened |
|---|---|---|
| **Pre-fractal** | Jan-Jul 2024 | ZAO launched as a collective (Jan 2024). Weekly Monday calls existed. |
| **Phase 1 — Soft launch** | Aug 2024 (Fractal 1) | First Respect Game session. Tracking in Airtable, no on-chain. |
| **Phase 1 — Season 1-5** | Aug 2024 - Aug 2025 | 73 sessions off-chain. OG ERC-20 distributed but not minted democratically. |
| **Phase 2 — On-chain** | Sep 11 2025 (Fractal 74) | ZOR (Respect1155) deployed. OREC deployed. On-chain minting begins. |
| **Phase 2 — Season 6+** | Sep 2025 - Jul 2026 | 30+ sessions on-chain. 63 verified Respect settlements. OREC ~175 txns. |
| **Phase 3 (planned)** | Late 2026 | Contribution requests, proposal voting, Sages Council activation |

### What Made ZAO's Fractal Work

Synthesized from docs 1202, 1227, 696, 703:

1. **Zaal showed up every week.** The host consistency is 80% of the outcome. No week was skipped.
2. **Discord bot reduced friction.** `fractalbotmarch2026` runs `/randomize`, `/timer`, `/zaofractal` — members don't need to understand the mechanics, they just follow the bot prompts.
3. **Music = clear contribution surface.** "What did you do for ZAO's music mission?" is a more concrete question than "what did you do for the ecosystem?" Specificity makes the Respect Game vote easier.
4. **Fibonacci scoring keeps it fair but meaningful.** The 2x Fibonacci curve (Year 2) rewards top contributors substantially (110 vs 10) without creating winner-take-all dynamics.
5. **Eden as sibling.** Zaal's active participation in Eden Fractal gives ZAO first access to tooling upgrades (ORDAO v2, frapps updates, Firmament on-chain voting).

---

## New Node Bootstrap: ZAO-Africa

**Context:** Iman (ZAO-Africa lead) is building the African arm of The ZAO ecosystem, with a focus on music + creator economy onboarding in Africa (board task `5fe4f608`).

A ZAO-Africa Fractal node would be a sister fractal to the main ZAO Fractal — same Respect Game mechanic, same frapps tooling, but with a separate Respect ledger scoped to the African community's contributions.

**Recommended path for ZAO-Africa:**

| Phase | Action | Timeline |
|---|---|---|
| Phase 0 | Identify 6+ consistent participants in ZAO-Africa community. Confirm host (Iman or designated co-host). | Now–Month 1 |
| Phase 1 | Run soft-launch Respect Game sessions (off-chain, spreadsheet) during existing ZAO-Africa gatherings. | Month 1-3 |
| Phase 1b | Optionally join main ZAO Fractal sessions (remote, Mondays 6PM EST) to learn the mechanic before running independently. | Month 1-2 |
| Phase 2 | Deploy ZAO-Africa Respect1155 on Base (lower gas than Optimism) via frapps.xyz. OREC deployment optional for Phase 2. | Month 3-6 |
| Phase 3 | Cross-fractal Respect: explore a "Superchain bridge" that lets ZAO-Africa Respect holders participate in ZAO main Fractal votes (doc 184 has the architecture). | Month 6+ |

**Decision needed (ZAAL-gated):** Zaal must connect Iman with Dan SingJoy (Optimystics) for the frapps.xyz deployment. This is an outbound introduction — flag as DECISION NEEDED.

---

## Fractal Ecosystem Next Steps

From Eden's 4-year arc and ZAO's 2-year arc, the pattern for ecosystem growth is clear:

1. **More fractals = more nodes, not a bigger fractal.** Eden did not try to grow to 500 members; it stayed at ~40 active and helped others start new fractals. ZAO should do the same: ZAO-Africa is the second node, not a larger main fractal.

2. **Contribution circles as the onboarding layer.** Before someone runs a Respect Game, offer a contribution circle: a simple 30-min call where anyone can say "here's what I want to help with." No voting, no tokens. Lowers the bar. Eden's Eric found this converts casual participants to committed ones at a much higher rate.

3. **Public Respect ledger as a credentialing layer.** Once a member has 3+ seasons of on-chain Respect, that is a portable credential. ZAO should document how to cite ZOR Respect in grant applications, collaboration pitches, and press bios.

4. **Season themes create momentum.** Eden names its seasons ("Season 12: Global Expansion"). ZAO should adopt this: Season 1 = Founding, Season 2 = On-Chain, Season 3 = ZAO 100 celebration, Season 4 = Contribution Requests launch.

---

## Tooling Reference

| Tool | Purpose | Access |
|---|---|---|
| `zao.frapps.xyz` | Breakout submission + Respect display | Public |
| `fractalbotmarch2026` | Discord bot: randomize, timer, voting flow | ZAO Discord |
| OREC | On-chain proposal execution, Respect1155 minting | Optimism `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| Respect1155 (ZOR) | Soulbound reputation token | Optimism `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` |
| Firmament | Eden's on-chain voting (next gen, Tadas-built) | Eden Fractal only (Jul 2026) |
| ORDAO | Governance framework wrapping OREC | GitHub: Optimystics |
| Hats Protocol | Role/council designation on-chain | Used by OP Fractal Sages Council |

---

## Open Questions for Zaal

1. **ZAO-Africa connection:** Has Iman expressed interest in running a ZAO-Africa Fractal? If yes, should Dan SingJoy be introduced? (DECISION NEEDED — outbound gated)
2. **Season themes:** Does ZAO formally name its Fractal seasons? If not, Season 3 ("ZAO 100") would be a natural launch point for this playbook.
3. **Contribution requests:** Is this the right Phase 3 mechanic for ZAO? Or does the music focus mean something different (e.g., "Respect-weighted set list for COC shows")?
4. **Cross-fractal Respect bridge:** Doc 184 describes a Superchain bridge architecture. Is there active coordination with Dan SingJoy / Optimystics on this for ZAO-Africa?
5. **Eden Season 12 visibility:** Zaal is an active Eden member. Is there a regular update from Eden that should feed into ZAO's fractal planning?

---

## Sources

- Doc 696 — Respect & Fractal Governance: The Complete Lineage (full lineage + ZAO contract addresses)
- Doc 1227 — Eden Fractal Recent Meetings (Jun-Jul 2026): adoption framework, 4-year learnings, Firmament
- Doc 703 — ZAO Fractal Current State (May 2026)
- Doc 1202 — Fractal On-Chain Settlement History (63 verified settlements)
- Doc 718 — ZAO Fractal Whitepaper Foundations
- Doc 942 — ZAO Fractal Whitepaper Outline v2
- Doc 306 — Eden Fractal + Optimism Fractal Deep History
- Doc 184 — Superchain / Cross-Chain Fractal Architecture
- Doc 1231 — The ZAO History Timeline (ZAO Fractal in context of full org history)
- Board task `cba9497a` — "Growing-fractals stream"
