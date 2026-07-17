---
topic: identity/external-citability
type: DRAFT
status: actionable
created: 2026-07-17
board-task: dfbf3f0e
related-docs: 1077, 1327, 1296, 1275, 1237, 1324, 1319
owner: Zaal
---

# 1330 — ZAO Wikipedia Entry Draft (July 2026)

> **Why this matters:** A Wikipedia article is the highest-authority external citation available. It unlocks:
> - Journalists citing Wikipedia instead of asking ZAO for facts
> - Grants reviewers verifying ZAO's legitimacy from a neutral source
> - AI discovery tools (GEO) treating ZAO as a real, documented entity
> - Academic researchers citing "according to Wikipedia" rather than needing to cite ZAO's own docs
>
> **North Star impact:** Accepted Wikipedia article = external citability 8.5 → 10/10 (North Star #1 complete).

---

## Notability Pre-Check

Wikipedia requires: *"The organization has been the subject of multiple, non-trivial, reliable, independent, published works."*

**Current ZAO coverage (verifiable independent sources):**

| Source | Type | Verifiable? | Notes |
|--------|------|-------------|-------|
| Crypto Magic Hour EP.50 (@VeVeMagic) | Podcast | ✅ YouTube oEmbed-confirmed | Independent coverage; not solicited by ZAO |
| XTinct artist interview (@wavewarz YouTube) | Interview | ✅ oEmbed-confirmed | ZAO-produced but features an external artist |
| Optimism mainnet contracts | Blockchain | ✅ Etherscan | OG: 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957 |
| WaveWarZ on-chain transactions | Blockchain | ✅ Solana explorer | 1,245 battles, public PDAs |
| Fisher grant application (if filed) | Grant record | ⏳ Pending Zaal action | Would create an institutional record |
| Academic outreach targets (doc 1324) | Pending | ⏳ Water & Music, Metagov | One published mention = notability threshold |

**Current verdict:** On the edge of notability. One Water & Music article or one major crypto-media mention tips it over.

**Strategy:** File the Wikipedia draft NOW. Submit AFTER first podcast episode publishes (adds 1 independent source). Wikipedia allows draft articles to sit in "Draft:" namespace until notability is established.

---

## Wikipedia Article (Wikitext) — Paste-Ready

```wikitext
{{Draft article
|topic = decentralized autonomous organizations, music technology
|date = July 2026
}}

'''The ZAO''' (also known as '''ZTalent Artist Organization''' or '''ZAO OS''') is an American [[decentralized autonomous organization]] (DAO) focused on the intersection of music, technology, and [[blockchain]] governance. Founded by Zaal Panthaki, the organization operates primarily through [[Fractal governance]] on the [[Optimism (blockchain)|Optimism]] network and WaveWarZ, a music prediction market on the [[Solana]] blockchain.

== Background ==

The ZAO was established as a community-driven hub for musicians, artists, and technologists in the Web3 ecosystem. The organization describes itself as part of the ZTalent Network, a broader collective of creator-economy projects. Its governance model uses '''Fractal Respect''' — a contribution-weighted consensus mechanism — rather than token-weighted voting, meaning membership is determined by participation rather than capital investment.<ref name="thezao">{{cite web |url=https://thezao.com/about |title=About The ZAO |publisher=The ZAO |accessdate=2026-07-17}}</ref>

As of July 2026, the organization has conducted over 100 consecutive weekly Fractal governance sessions, which the organization claims may represent the longest-running governance streak among music-focused DAOs.<ref name="1077">{{cite web |url=https://github.com/bettercallzaal/ZAOOS |title=ZAO OS Research Repository |publisher=ZAO |accessdate=2026-07-17}}</ref>

== WaveWarZ ==

WaveWarZ is a music prediction market platform developed by ZAO and deployed on the [[Solana]] blockchain. The platform enables fans to stake SOL (Solana's native cryptocurrency) on the outcome of head-to-head music battles between artists. A distinctive feature is the "loser-earns" mechanic, in which the losing artist in a battle still receives a portion of the staked volume.

As of July 2026, the platform has recorded 1,245 battles, 523.99 SOL in total volume, and approximately $1,497 raised for charity through a community benefit battle program.<ref name="wwapi">{{cite web |url=https://wavewarz.info/api/public/stats |title=WaveWarZ Public Statistics API |publisher=WaveWarZ |accessdate=2026-07-17}}</ref> The platform has been covered by the independent podcast ''Crypto Magic Hour''.<ref name="cmh">{{cite web |url=https://www.youtube.com/watch?v=rx0PeGv8lPI |title=Crypto Magic Hour EP.50 |publisher=VeVeMagic |date=2026 |accessdate=2026-07-17}}</ref>

== Governance ==

ZAO's governance uses the [[Fractal governance|Fractal]] model developed by the Eden Fractal community. Participants are ranked by peers in breakout sessions, generating Respect tokens that represent governance weight. The process does not require token purchase or minimum stakes.

The ZAO's Respect contracts are deployed on [[Optimism (blockchain)|Optimism]] mainnet:
* '''OG Respect (ERC-20):''' 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
* '''ZOR (ERC-1155):''' 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c

As of July 2026, there are 157 unique Respect holders and 505 on-chain governance transactions recorded.

== Events ==

=== COC Concertz ===
COC Concertz ('''Circles of Care Concertz''') is a virtual concert series hosted by ZAO. As of July 2026, seven shows have been produced, beginning in March 2025. The series features WaveWarZ artists in a Spatial.io virtual venue simulcast on Twitch.

=== ZAOstock ===
ZAOstock is an outdoor music festival organized by ZAO, scheduled for October 3, 2026, in Ellsworth, Maine. The event's lineup is intended to feature artists who have participated in WaveWarZ battles.

=== ZABAL Games ===
ZABAL Games ('''ZAO Builder Accelerator Lab Games''') is a builder competition program in which developers compete to ship projects, with the winning team earning a performance slot at COC Concertz.

== See also ==
* [[Decentralized autonomous organization]]
* [[Fractal governance]]
* [[Solana (blockchain)]]
* [[Music technology]]

== References ==
{{Reflist}}

== External links ==
* [https://thezao.com Official website]
* [https://wavewarz.info WaveWarZ platform]
* [https://warpcast.com/~/channel/zao ZAO Farcaster channel]

[[Category:Decentralized autonomous organizations]]
[[Category:Music technology companies]]
[[Category:Organizations established in 2024]]
[[Category:Organizations based in Maine]]
```

---

## Submission Checklist

### Before Submitting
- [ ] **Notability gate:** At least 2 independent published sources must exist. Current count: 1 (Crypto Magic Hour). Wait for one podcast episode to publish (doc 1328), OR one Water & Music/Metagov mention (doc 1324).
- [ ] **Tone check:** Wikipedia requires neutral point of view (NPOV). The draft above strips superlatives. Review for any remaining promotional language before submission.
- [ ] **References:** All `{{cite web}}` blocks must link to real, accessible URLs. Verify each before submission.

### Submission Steps
1. Create Wikipedia account (or log into existing)
2. Navigate to `https://en.wikipedia.org/wiki/Wikipedia:Your_first_article`
3. Use the "Article wizard" to submit as a draft: `Draft:The ZAO (organization)`
4. Add the template `{{AFC submission|t}}` to request review
5. Monitor talk page for reviewer feedback

### Common Rejection Reasons + Mitigations

| Rejection Reason | Mitigation |
|-----------------|-----------|
| "Not notable enough" | Submit after 2nd independent source (first podcast ep) |
| "Too promotional" | Review for superlatives; ensure NPOV language throughout |
| "Unreliable sources" | Blockchain explorer links (Etherscan/Solscan) are reliable per WP:RS |
| "Primary sources only" | WaveWarZ API is a primary source — balance with podcast/press citations |

---

## GEO Note

Even before Wikipedia acceptance, this draft creates value:
- The article text itself, published in ZAOOS, gives AI indexers a structured, Wikipedia-formatted fact set
- When AI tools synthesize "what is ZAO," this draft is the clearest structured answer available
- GEO discovery (doc 1316, llms.txt) + this draft together = AI systems can describe ZAO accurately

---

## North Star Impact

| Milestone | Citability Score | Notes |
|-----------|-----------------|-------|
| Draft written (this doc) | 8.5/10 (no change) | Internal only |
| Draft submitted to Wikipedia | 8.7/10 (+0.2) | Creates a public "Draft:" page |
| Article accepted | 10/10 (+1.5) | Highest external validation available |

Submit draft after first podcast episode (Aug-Sep per doc 1328 cadence). Expected acceptance: Q4 2026 if notability is established by ZAOstock coverage.

---

*Created: 2026-07-17 | Cross-refs: doc 1077 (DAO case study), 1327 (membership counts), 1296 (press kit), 1324 (academic outreach), 1328 (podcast kit)*
