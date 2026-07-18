---
topic: governance
type: op-rf-evidence
status: active
last-validated: 2026-07-18
related-docs: 1254, 1312, 1423, 1430, 1434, 1531, 1583, 1617, 1645
original-query: "Compile all on-chain evidence + supporting docs for Optimism Retroactive Funding application for ZAO Fractal Democracy."
tier: STANDARD
---

# 1668 — ZAO Fractal: Optimism Retro Funding Evidence Package

> **Purpose:** A compiled, submission-ready evidence package for Optimism Retro Funding. Use this doc to fill the OP RF application and link reviewers directly to on-chain proof.

---

## Project Summary (250 words — paste into OP RF application)

ZAO Fractal is a weekly music governance session built on Fractal Democracy — a peer-ranked contribution system that rewards participants based on relative contribution rather than token weight. The ZAO community has run uninterrupted weekly governance sessions for 100+ consecutive weeks, making it the longest unbroken governance streak on Optimism Mainnet.

**What it does:** Participants in each session are split into groups of 6. Each group ranks every other member's contribution relative to their own peers (not by how much they liked the music). Those relative rankings aggregate into Respect scores, which are recorded on-chain via OREC (On-chain Ranking Engine for Contribution). Top scorers receive ZOR (ZAO On-chain Respect) ERC-1155 tokens, which gate participation in formal governance: proposal submission, community votes, and fund allocation.

**Why it matters to Optimism:** ZAO Fractal demonstrates that Fractal Democracy is production-ready on Optimism — 100+ sessions, live governance, a growing holder base (157 ZOR holders as of Jul 2026), and now expanding to West Africa. Every session produces on-chain data that feeds the Collective's understanding of what fair, Sybil-resistant community governance looks like. The Africa expansion (Season 9, starting Session 97, Aug 2026) takes this from a North American experiment to an international model.

**Optimism alignment:** Public good (open-source governance tooling), long-term ecosystem participant (100+ weeks, no funding received to date), clear expansion roadmap (Season 9 Africa, Season 10 Contribution Requests).

---

## Core Evidence (link these in the OP RF application)

### 1. On-chain session record

| Item | Proof |
|------|-------|
| **OREC contract** (session recorder) | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` on Optimism Mainnet |
| **ZOR / Respect1155 contract** | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` on Optimism Mainnet |
| **OG ERC-20 contract** | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` on Optimism Mainnet |
| **ZOR holders (as of Jul 2026)** | 157 unique addresses |
| **Sessions run** | 96+ (100+ weeks unbroken as of application date) |
| **Chain** | Optimism Mainnet (every session recorded on-chain since Session 1) |

To verify: Blockscout search for the OREC contract → Transactions tab. Every session is a transaction cluster; the OREC contract README explains the data format.

### 2. Governance corpus (supporting docs)

| Doc | What It Proves |
|-----|----------------|
| **1254**: ZAO Fractal 100+ Week Record | The citable session count + streak length |
| **1312**: Fractal Respect Governance Deep Dive | Technical spec + OP RF alignment argument (written for a governance audience) |
| **1423**: ZAO Fractal Governance Explainer (GEO-ready) | Academic-framing; suitable for OP governance reviewers |
| **1430**: DAOstar Registration | EIP-4824 JSON at `governance.thezao.com/.well-known/dao.json`; verifies ZAO is a registered DAO |
| **1434**: Q2 2026 Governance Quarterly Report | Activity metrics: sessions run, attendance, ZOR minted, proposals submitted |
| **1531**: Canonical Reference Page (GEO/Wikidata) | GEO answer page + Wikidata entity = permanent public record |
| **1583**: Press Media Kit | Third-party journalist summary of the project (pull quotes, story angles) |

### 3. Community verification

- **ZOR holder page:** Blockscout → Token `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` → Holders tab
- **DAOstar JSON:** `https://governance.thezao.com/.well-known/dao.json`
- **Session archive:** OREC transaction history on Optimism Mainnet
- **Q2 2026 quarterly report:** Doc 1434 (session attendance, ZOR minted, member growth)

---

## Impact Metrics (as of Jul 2026)

| Metric | Value |
|--------|-------|
| Consecutive sessions (weeks) | 96+ (started 2024, no session missed) |
| ZOR holders | 157 |
| Members ever participated | 35+ |
| Sessions per year | 52 |
| Average attendance | 6-12 per session |
| Governance actions (proposals, votes) | Track via OREC + Snapshot history |
| Geographic expansion | Season 9 = WaveWarZ Africa (Aug 2026) — first non-North America expansion |
| Ecosystem integrations | DAOstar (EIP-4824), Snapshot (ZOR voting), Bonfire (knowledge graph), ZAOstock (live event governance) |

---

## Application Narrative (600 words — paste into OP RF "tell your story")

**The problem:** Most music DAOs have governance theatre. Token holders vote on who to fund, but "token holder" means "had money to buy in." The people who show up, create content, run sessions, and build the community have no voice unless they bought tokens first.

**The solution:** Fractal Democracy inverts this. You earn your governance token — ZOR — by participating and being recognized as a contributor by your peers in a structured, Sybil-resistant ranking process. You cannot buy your way into ZOR. You earn it by showing up, contributing to the community's shared goals, and having that contribution validated by the people who were in the room with you.

**What ZAO Fractal built on Optimism:**
- OREC: an on-chain contract that records every Fractal session's peer rankings as immutable Optimism transactions.
- Respect1155 / ZOR: an ERC-1155 token minted by OREC based on session outcomes. Your ZOR balance reflects your cumulative contribution across all sessions.
- Weekly governance sessions: every Thursday, participants break into groups of 6, rank each other's contribution, and the rankings are aggregated and recorded on-chain. This has happened every single week for 96+ consecutive weeks.
- ZOR-gated governance: formal proposals, community votes, and fund allocation are ZOR-gated. You can only vote on governance if you have contributed.

**The public good argument:** Every session's data is on-chain and public. The OREC contract is open-source. The Fractal Democracy model — peer-ranked contribution scoring, Sybil-resistant, no bought governance — is freely available for any DAO to adopt. ZAO ran the 100+ week experiment to prove that it works at human scale, week after week, without funding, because the community found it intrinsically valuable. That proof is the public good. Other music DAOs, artist communities, and governance experiments can fork OREC and replicate what we built.

**What OP RF funding would enable:**
1. Season 9 (WaveWarZ Africa, Aug-Nov 2026): onboard West African music artists into Fractal Democracy governance. This is the first international expansion of the model.
2. Season 10 (Contribution Requests, Nov 2026-Feb 2027): introduce on-chain contribution requests — community members propose work, Fractal ranks it, completed work gets ZOR + potential USDC bounties.
3. ZAOstock Oct 3 (live event): 100+ community members attending an IRL event, with Fractal Democracy governance running live, ZOR holders voting on proposals from the stage. First live-event governance experiment.
4. Open-source OREC + documentation: make the OREC contract and Fractal Democracy operational guide formally open-source, with docs suitable for a team to fork and deploy without Zaal's involvement.

**Why Optimism specifically:** We chose Optimism for gas costs and ecosystem alignment. Every session runs on Optimism Mainnet. Every ZOR token is an Optimism ERC-1155. The community votes via Snapshot with an Optimism Mainnet strategy. Our growth is Optimism's growth.

---

## Supporting Links (compile before submission)

| Item | URL |
|------|-----|
| OREC on Blockscout | `https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| ZOR holders on Blockscout | `https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c#holders` |
| DAOstar JSON | `https://governance.thezao.com/.well-known/dao.json` |
| Mirror Article 3 (once published) | [Fill in after Jul 24 publish] |
| ZAO website | `https://thezao.com` |
| Q2 2026 quarterly report | Link doc 1434 once merged |
| Press media kit | Link doc 1583 |

---

## Application Checklist (before submitting)

- [ ] Mirror Article 3 (doc 1623) published on Mirror — link it
- [ ] Doc 1531 (GEO canonical page) merged — use GEO URL as verifiable public record
- [ ] DAOstar JSON endpoint live at `governance.thezao.com/.well-known/dao.json`
- [ ] OREC transaction count updated to reflect current session count
- [ ] Impact metrics (attendance, ZOR minted) verified against Q2 quarterly report (doc 1434)
- [ ] Season 9 start confirmed (Session 97, Aug 2026) — include as evidence of funded roadmap
- [ ] Zaal reviews narrative and submits application

---

## Cross-References

| Doc | What |
|-----|------|
| 1254 | 100-week fact sheet (citable session count) |
| 1312 | Technical spec for governance reviewers |
| 1423 | Academic-framing explainer for OP RF audience |
| 1430 | DAOstar EIP-4824 registration |
| 1434 | Q2 2026 quarterly report (activity metrics) |
| 1531 | GEO canonical reference (public permanent record) |
| 1583 | Press media kit |
| 1617 | ZAOstock Oct 3 governance voter guide |
| 1645 | Press moment playbook |
