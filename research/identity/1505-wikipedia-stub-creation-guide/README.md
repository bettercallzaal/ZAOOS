# 1505 — ZAO Wikipedia Stub Creation Guide (GEO Chain Step 2)

**Type:** ACTION-GUIDE  
**Topic:** Identity  
**Status:** AFTER WIKIDATA — create Wikipedia stub after Wikidata Q-entity exists (doc 1496). Estimated time: 45–60 min.

---

## Why Wikipedia Matters for ZAO

A Wikipedia article for ZAO/WaveWarZ would:

1. **Dramatically improve GEO** — Wikipedia is the single highest-authority source AI language models cite. An article on ZAO means future AI responses about "decentralized music platforms" or "DAO-governed music" may reference ZAO.
2. **Add legitimacy for grants** — Fisher, MAC, OP RF reviewers recognize Wikipedia articles as independent verification.
3. **Support the Wikidata entity** — Wikipedia articles and Wikidata entities link to each other; having both makes the graph more robust and harder to challenge.
4. **Generate the "Knowledge Panel"** — Google shows a Knowledge Panel (right sidebar) for entities with both Wikipedia and Wikidata entries.

---

## Notability Pre-Check (Required Before Creating)

Wikipedia's notability threshold for organizations: "significant coverage in reliable sources that are independent of the subject." Before creating the article, gather sources:

| Source Type | ZAO's Sources | Strength |
|---|---|---|
| On-chain contract verification | Optimism Etherscan (3 contracts) | Medium — verifiable but not "press" |
| Public API | wavewarz.info/api/public/stats | Medium — demonstrates activity |
| ZAOOS archive | CC-BY corpus, 1,500+ docs | Medium — self-published but large |
| Press coverage | Hypebot, W&M, Decrypt (if obtained after Jul 2026 pitches) | High — independent coverage |
| COC Concertz 7-month streak | YouTube channel history | Medium |
| Academic citation | If any researchers cite ZAOOS | High |

**Honest Assessment:** ZAO may be borderline notable as of Jul 2026 without independent press. Options:
- **Option A:** Create stub now with on-chain verifiable sources; risk AFD (Articles for Deletion) if challenged
- **Option B:** Wait until after Hypebot/Water & Music pitches produce coverage, then create article with citations
- **Option C:** Create article in Incubator space (Wikipedia:WikiProject Blockchain) to avoid immediate deletion

**Recommendation: Option B + C combined** — submit to WikiProject Blockchain sandbox, get feedback, then move to mainspace when press coverage arrives (after Aug 1 Mirror article + media pitches).

---

## Step 1 — Create a Wikipedia Account (5 Min)

1. Go to en.wikipedia.org/wiki/Special:CreateAccount
2. Create with email (zaalp99@gmail.com)
3. Username suggestion: `ZaalPanthaki` or similar (avoid ZAO branding to reduce COI concerns)
4. Make 10 small edits to other articles before creating ZAO article — this establishes your account as not promotional

**Important:** Disclose your conflict of interest on the article's talk page when you create it. Wikipedia COI policy requires this. Add: "I am the founder of ZAO, the organization described in this article. I have tried to write this neutrally but disclose my connection."

---

## Step 2 — Draft the Article (30 Min)

Use this draft as the starting point:

```
== ZAO (organization) ==

'''ZAO''' (Zaalian Arts Organization) is a [[decentralized autonomous organization]] 
(DAO) that operates [[WaveWarZ]], a music battle platform built on the [[Solana (blockchain)|Solana]] blockchain. 
Founded in 2024, ZAO is governed by a weekly Fractal Democracy session using the OREC 
smart contract on [[Optimism (blockchain)|Optimism]].

=== WaveWarZ Platform ===

WaveWarZ is a music competition platform where artists submit recordings to time-limited 
voting battles. Participants stake [[Solana (cryptocurrency)|SOL]] tokens to support 
artists; the smart contract distributes payouts proportionally, with both the winning 
and losing artist receiving a share of the pool. This "loser earns" mechanism ensures 
all participating artists receive compensation regardless of battle outcome.{{cn}}

As of July 2026, the platform had processed over 1,245 battles with approximately 524 SOL 
in total volume and 9 SOL in direct artist payouts.{{cn}}

=== Governance ===

ZAO uses a governance model called Fractal Democracy, adapted from the [[Eden Fractal]] 
community. In weekly sessions, participants rank each other's contributions to the 
ecosystem using a Fibonacci-based scoring system (55, 34, 21, 13, 8 points by rank). 
Rankings are submitted on-chain to the OREC contract (0xcB05F9254765CA521F7698e61E0A6CA6456Be532 
on Optimism Mainnet) and converted to Respect scores held as ZOR ERC-1155 tokens.

As of 2026, ZAO had conducted 64 consecutive weekly governance sessions.{{cn}}

=== ZAOstock ===

ZAOstock is an annual free outdoor music festival organized by ZAO. The inaugural event 
is scheduled for October 3, 2026, in [[Ellsworth, Maine]], with a capacity of 500 
attendees. The festival features live WaveWarZ battles where the audience votes in 
real time.{{cn}}

=== External links ===
* [https://wavewarz.info WaveWarZ official website]
* [https://www.wikidata.org/wiki/QXXXXXXX ZAO on Wikidata]

[[Category:Decentralized autonomous organizations]]
[[Category:Music websites]]
[[Category:Blockchain applications]]
[[Category:Organizations based in Maine]]
```

**Replace `{{cn}}` with actual citation tags when you add sources.**

---

## Step 3 — Add Citations

For each `{{cn}}` placeholder, add a citation:

**Format:**
```
<ref>{{cite web |url=https://wavewarz.info/api/public/stats |title=WaveWarZ Public Statistics API |accessdate=2026-07-XX}}</ref>
```

**Sources to cite:**
1. Etherscan for the OREC contract — use as reference for "OREC contract address"
2. wavewarz.info/api/public/stats — for battle count and SOL volume
3. Mirror Article 1 (once published Aug 1) — for loser-earns mechanic
4. Any press coverage (Hypebot, W&M, Decrypt) — for notability

---

## Step 4 — Submit to WikiProject Blockchain Sandbox First

1. Create the draft at: `Wikipedia:WikiProject Blockchain/Sandbox/ZAO`
2. Add a talk page message asking for feedback: "Draft article about ZAO, a DAO-governed music platform. Disclosing COI as the founder. Looking for feedback before moving to mainspace."
3. Tag it: `{{WikiProject Blockchain|class=Stub|importance=Low}}`
4. Wait 2-4 weeks for feedback
5. After feedback (and press coverage): move to mainspace at `ZAO (organization)` or `WaveWarZ`

---

## Step 5 — Wikidata Linking (Do After Article Exists)

Once the Wikipedia article is created:
1. Go to the Wikidata entity (from doc 1496)
2. Add property **P18** (Wikipedia article): link to the new article
3. The article should also auto-link via the Wikipedia Wikidata integration

---

## Deletion Risk Management

If the article is nominated for deletion (AFD):
1. **Don't panic** — respond on the AFD talk page within 24 hours
2. **Add press citations** — any Hypebot/Decrypt/W&M coverage resolves most AFDs
3. **Etherscan verification** — smart contract activity is considered primary source
4. **ZAOOS corpus size** — 1,500+ CC-BY research documents demonstrating significant institutional activity
5. **Fallback:** If deleted, create in Wikidata only (more lenient than Wikipedia)

**ZOE monitors:** set a monthly Google Alert for "ZAO Wikipedia" and "WaveWarZ Wikipedia" to catch any AFD nominations.

---

## Related Docs

- 1496 — Wikidata Entity Creation Guide (Step 1 in the GEO chain — do this first)
- 1417 — Earlier Wikidata/Wikipedia research (background)
- 1107 — SEO + GEO Strategy (Wikipedia as GEO signal)
- 1470 — OP RF Submission Guide (Wikipedia article = OP RF Gate evidence)
- 1504 — Mirror Article 1 (Mirror article can be cited in Wikipedia as a primary source)
- 1483 — ZAO Press Kit (stats for article body)
