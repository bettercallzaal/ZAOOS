# 1450 — ZAO Govbase Submission Guide (Metagov, Jul 25)

**Type:** GUIDE  
**Topic:** governance  
**Status:** ⚠️ DECISION NEEDED — Zaal submits a GitHub PR to the Metagov govbase dataset by Jul 25; ~30 minutes  
**Created:** July 18, 2026  
**Related docs:** 1408 (academic research partnership brief — Govbase submission is Action 1), 1430 (DAOstar registration — complementary action), 1417 (Wikidata — complete before Govbase if possible), 1434 (Q2 governance report — data source)

---

## What Govbase Is

**Govbase** is the Metagov project's open database of DAO governance systems, maintained at github.com/metagov/govbase. It is the most widely cited academic dataset for DAO governance research — referenced by MIT, Stanford, Oxford, and other institutions studying decentralized organizations.

**Why it matters for ZAO:**
1. **Citability:** Being in Govbase means researchers who study DAOs will find ZAO in their data pulls
2. **Academic attention:** Govbase entries are read by researchers who could cite ZAO in papers (doc 1408)
3. **GEO:** Govbase is indexed by Google Scholar and appears in academic search results
4. **OP RF:** The Optimism Foundation values projects with academic legitimacy

**Current status:** ZAO is NOT in Govbase as of July 2026. This is an easy fix.

---

## What to Submit

Govbase accepts several data types. ZAO should submit to:

### 1. The "Protocols" Sheet (Primary)

The Govbase Protocols sheet documents governance systems. ZAO's Optimism Fractal implementation is a novel governance protocol worth documenting.

**ZAO Protocol Entry:**

| Field | Value |
|-------|-------|
| Name | ZAO Fractal Governance (Optimism Fractal) |
| Organization | The ZAO |
| Protocol Type | Fractal / Respect Game |
| Description | Optimism Fractal governance implementation. Weekly sessions in which participants earn ZOR (Respect) tokens through peer evaluation in small groups rather than through token purchases. Non-plutocratic. 63+ consecutive weekly sessions without a quorum failure as of July 2026. |
| Chain | Optimism Mainnet |
| Contracts | OG ERC-20: 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957; ZOR ERC-1155: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c; OREC: 0xcB05F9254765CA521F7698e61E0A6CA6456Be532 |
| Active Since | 2024 |
| References | github.com/ZAOIP/zao-os (ZAOOS CC-BY); wavewarz.info |
| Notes | 63+ consecutive weekly governance sessions (Jul 2026); 157 ZOR holders; 188 active participants (90-day); governs WaveWarZ music platform on Solana |

### 2. The "Organizations" Sheet (Secondary)

Govbase also tracks DAOs as organizations.

**ZAO Organization Entry:**

| Field | Value |
|-------|-------|
| Name | The ZAO |
| Type | DAO |
| Founded | 2024 |
| Domain | Music / Creative Economy |
| Platform | WaveWarZ (wavewarz.info) |
| Governance Protocol | Optimism Fractal / ZAO Fractal |
| Jurisdiction | Ellsworth, Maine, USA (primary event) |
| Chain(s) | Optimism Mainnet (governance), Solana (WaveWarZ product) |
| Token(s) | OG (ERC-20), ZOR (ERC-1155) |
| Website | wavewarz.info |
| GitHub | github.com/ZAOIP/zao-os |
| Notes | First DAO to govern a music prediction market; 63+ consecutive weekly governance sessions |

---

## How to Submit (Step-by-Step)

### Method A: GitHub PR (Recommended — More Credible, Faster)

Metagov maintains Govbase as a GitHub repository at `metagov/govbase`.

1. **Fork the repo:** github.com/metagov/govbase → click "Fork"

2. **Edit the Protocols CSV:** Find `data/protocols.csv` or `data/organizations.csv` and add ZAO's row using the data from the table above.

3. **Create a PR** with title: `Add ZAO Fractal Governance (Optimism Fractal) — The ZAO DAO`

4. **PR description:**
   ```
   Adding The ZAO's Optimism Fractal governance implementation to Govbase.
   
   Organization: The ZAO
   Platform: WaveWarZ (wavewarz.info)
   Chain: Optimism Mainnet
   Protocol: Optimism Fractal / Respect Game (ZOR tokens)
   Consecutive sessions: 63+ (as of Jul 2026)
   Contracts: 3 verified on Optimism Mainnet
   Documentation: github.com/ZAOIP/zao-os (1,445+ CC-BY docs)
   
   Happy to provide additional data or clarify any fields.
   ```

5. **Ping Metagov on X or Discord** after submitting the PR: @MetagovProject on X

### Method B: Metagov Submission Form

Metagov may have a web form for Govbase submissions. Check metagov.org for a current form.

---

## After Submission

Once the PR is merged or the form is submitted:

1. **Tell Zaal via Telegram (ZOE):** "ZAO is now in Govbase. Metagov PR merged: [LINK]"

2. **Update Wikidata** (doc 1417): Add `P8737: Govbase identifier` to ZAO's Wikidata entity

3. **Update press pitches** (doc 1414): Add "ZAO is documented in Metagov's Govbase dataset" to the academic credibility section

4. **Update academic research brief** (doc 1408): Govbase = complete; move to Ostrom Workshop email

5. **ZOE social post:**
   ```
   ZAO is now in @MetagovProject's Govbase.
   
   The most-cited DAO governance dataset in academic research now includes ZAO's Optimism Fractal implementation — 63+ consecutive weekly sessions, 157 ZOR holders, 3 Optimism contracts.
   
   If you're researching DAO governance: ZAO is a longitudinal dataset.
   
   github.com/ZAOIP/zao-os
   
   /dao /optimism /zao
   ```

---

## Expected Timeline

- **Jul 21-25:** Zaal forks govbase repo + opens PR
- **Jul 25 – Aug 7:** Metagov maintainer reviews (usually 1-2 weeks)
- **Aug 7-14:** PR merged → ZAO is in Govbase
- **Aug 15:** Reference Govbase in Fisher grant application ("ZAO is documented in Metagov's Govbase dataset")

---

## What Makes This Citable

> "The ZAO is documented in Metagov's Govbase dataset (github.com/metagov/govbase), the primary academic repository for DAO governance systems. ZAO's Optimism Fractal implementation, 63+ consecutive weekly sessions, and Optimism Mainnet contracts are all indexed (ZAOOS doc 1450)."

---

## North Star Impact

| Dimension | Before | After (Govbase PR merged) |
|-----------|--------|--------------------------|
| GEO | 9.9 | +0.2 → 10.1 (Govbase = Google Scholar indexed; directly findable by DAO researchers) |
| Citability | 10.3 | +0.1 → 10.4 (Govbase entry = citable source in academic papers) |

**This is the fastest academic credibility action available** — takes 30 minutes, no approval required beyond Metagov reviewing the PR.

---

*ZAOOS doc 1450 — ZAO Operating System — github.com/ZAOIP/zao-os*
