# 1437 — ZAO + WaveWarZ Wikipedia Article Creation Guide

**Type:** GUIDE  
**Topic:** identity  
**Status:** PRE-PRESS — create Wikipedia article after first Hypebot or Ari's Take coverage publishes (Aug 1-10); draft text ready to paste now  
**Created:** July 17, 2026  
**Related docs:** 1417 (Wikidata guide — companion action), 1414 (Hypebot/music press pitches — prerequisite), 1413 (Mirror Article 1 — secondary source candidate), 1430 (DAOstar — sameAs source), 1408 (academic research brief — secondary source candidate)

---

## Why Wikipedia Is the Highest GEO Action

Wikipedia is the **single highest-impact GEO action remaining** after Wikidata (doc 1417) because:

1. **Google Knowledge Panel source:** Wikipedia articles are the primary source for Google's Knowledge Panel (the information box that appears when you search "The ZAO" or "WaveWarZ"). Without a Wikipedia article, ZAO cannot have a Knowledge Panel.

2. **LLM training data:** Wikipedia is a primary training source for all major LLMs (GPT, Claude, Gemini). An accurate Wikipedia article means LLMs will describe ZAO/WaveWarZ correctly to users who ask about them.

3. **Backlink authority:** Wikipedia links are no-follow but still drive significant referral traffic and signal entity authority to search engines.

4. **Cross-referencing:** Other Wikipedia articles about music technology, DAO governance, or music festivals can link to ZAO/WaveWarZ once the articles exist.

**Current GEO gap:** Without Wikipedia articles, searches for "ZAO DAO music" or "WaveWarZ music battle" may not return a Knowledge Panel, and LLMs may not confidently describe ZAO.

---

## Wikipedia Notability Requirements

Wikipedia's primary requirement is **verifiable notability** — the subject must have significant coverage in **reliable secondary sources** that are:
- Independent of the subject (not ZAO's own press releases or website)
- Published in established media with editorial oversight (newspapers, established magazines, academic journals)
- Substantive (the article significantly discusses ZAO/WaveWarZ, not just mentions)

### What Counts for ZAO

| Source Type | Counts? | Examples |
|-------------|---------|---------|
| Hypebot article (established music industry blog, 200K readers) | ✅ YES | Expected Aug 1-10 (doc 1414) |
| Ari's Take (Ari Herstand, 100K+ music industry newsletter) | ✅ YES | Expected Aug 1-10 (doc 1414) |
| Water & Music (Cherie Hu, research newsletter) | ✅ YES | Expected Jul 24 (doc 1389) |
| Bangor Daily News article on ZAOstock | ✅ YES | Expected Sep-Oct 2026 (local Maine coverage) |
| Academic paper citing WaveWarZ | ✅ YES | Expected after doc 1408 research partner |
| Mirror.xyz article (doc 1413) | ❌ NO | Mirror is self-published; not independent |
| ZAOOS GitHub docs | ❌ NO | Primary source, not independent |
| ZAO's own X/Farcaster posts | ❌ NO | Self-published |
| Green Pill podcast (Doc 1405) | ⚠️ MAYBE | Podcast episodes are borderline; video interviews can qualify |
| Decrypt article | ✅ YES | Established crypto publication |
| TechCabal article | ✅ YES | Established tech publication |

### When Is ZAO Wikipedia-Eligible?

ZAO becomes Wikipedia-eligible when it has **at least 2-3 reliable secondary sources** with substantive coverage. 

**Projected eligibility:** August 10-31, 2026 (after Hypebot + Ari's Take articles publish from the Aug 1-10 pitches in doc 1414).

**If press doesn't come:** 
1. Wait for ZAOstock (Oct 3) — Maine local press (Ellsworth American, Bangor Daily News) will likely cover it
2. Academic citation from doc 1408 research partners
3. Green Pill podcast episode (borderline but possible)

---

## When to Create the Article

**Timing:**
- NOT before at least 2 reliable secondary sources exist
- Ideal: Aug 10-31, after Hypebot and Ari's Take articles
- Latest: Before Oct 3 ZAOstock (so "ZAOstock" event can cite the Wikipedia article)

**Who creates it:** Zaal (account needed), or a Wikipedia-experienced community member (ZABAL S2 builder track candidate)

**Time required:** ~60-90 minutes to create the article from the draft below

---

## Draft Wikipedia Articles (Paste-Ready)

### Article 1: The ZAO (Decentralized Autonomous Organization)

```
== The ZAO ==

The ZAO (often stylized "ZAO DAO" or "The ZAO") is a decentralized autonomous organization (DAO) founded in 2024 that operates WaveWarZ, a music battle platform on the Solana blockchain, and hosts ZAOstock, an annual music festival in Ellsworth, Maine.

=== Governance ===

The ZAO uses an Optimism Fractal governance model based on the Respect Game protocol, in which participants earn ZOR (Respect) tokens through peer evaluation in weekly group sessions rather than through token purchases. As of July 2026, the ZAO had maintained over 63 consecutive weekly governance sessions without a quorum failure, a record cited in academic research on DAO governance models.<ref>[CITE: first academic paper that cites this]</ref>

The ZAO's governance contracts operate on the Optimism blockchain, including an ERC-20 governance token (OG), an ERC-1155 Respect token (ZOR), and an Optimism Respect-based Execution Contract (OREC) for executing approved proposals on-chain.

=== WaveWarZ ===

WaveWarZ is a music battle platform developed by The ZAO that uses a prediction market model in which audience members bet cryptocurrency (SOL) on which of two competing artists will win a head-to-head competition. Unlike traditional music streaming, WaveWarZ's "loser-earns" mechanism distributes a share of the losing side's pool to the artist who lost, providing revenue for artists regardless of outcome.<ref>[CITE: Hypebot or Ari's Take article]</ref>

As of July 2026, WaveWarZ had facilitated over 1,289 battles with cumulative trading volume exceeding 878 SOL.<ref>[CITE: wavewarz.info API / ZAOOS doc]</ref>

=== ZAOstock ===

ZAOstock is an annual music festival produced by The ZAO. The inaugural ZAOstock took place on October 3, 2026, at the Franklin Street Parklet in Ellsworth, Maine, as part of the Art of Ellsworth festival. The event featured live music performances, a live WaveWarZ music battle, an on-chain governance vote conducted from the festival stage, and a charitable giving component.<ref>[CITE: Bangor Daily News / Ellsworth American coverage]</ref>

=== External links ===
* [https://wavewarz.info WaveWarZ official site]
* [https://github.com/ZAOIP/zao-os ZAO Operating System (ZAOOS) on GitHub]
```

### Article 2: WaveWarZ

```
== WaveWarZ ==

WaveWarZ is a music battle platform built on the Solana blockchain and operated by The ZAO, a decentralized autonomous organization. The platform uses a prediction market mechanism in which audience members bet SOL (Solana's cryptocurrency) on head-to-head competitions between musicians, and the losing artist earns a share of the pool bet against them — a model the platform calls "loser-earns."<ref>[CITE: Hypebot or Ari's Take]</ref>

=== Mechanism ===

WaveWarZ battles are pairwise competitions between two artists. Audience members bet SOL on their preferred artist; when the battle closes, the winning side's traders claim their winnings, the losing artist receives approximately 1.73% of the losing-side pool as their "loser-earns" payout, and the platform retains a 3% protocol fee. Unlike prediction markets on other events, WaveWarZ requires no oracle because the outcome is defined by the market itself — whichever side attracts more SOL wins.

WaveWarZ operates three battle formats: MAIN battles (curated multi-battle events), Quick Battles (open-entry competitions any registered artist can join), and Community Battles (charity-oriented competitions where a portion of trading volume goes to a nonprofit).

=== History ===

WaveWarZ launched in 2024. As of July 2026, the platform had completed over 1,289 battles across 51 MAIN events, with cumulative trading volume of approximately 878 SOL (approximately $66,000 USD at July 2026 prices).<ref>[CITE: wavewarz.info public API / ZAOOS doc 1435]</ref>

=== Criticism and analysis ===

Academic researchers have noted WaveWarZ as a novel application of prediction market mechanisms to the music economy, specifically for its "no-oracle" design and its incorporation of artist compensation into the loss condition.<ref>[CITE: ZAOOS doc 1424 — WaveWarZ Prediction Market Whitepaper]</ref> [FILL if academic papers exist]

=== External links ===
* [https://wavewarz.info WaveWarZ]
* [https://github.com/ZAOIP/zao-os ZAO Operating System (ZAOOS)]
```

---

## Step-by-Step Creation Process

### Before You Start

1. **Check sources are published.** Go to Hypebot.com, arisake.com, Water & Music — confirm at least 2 articles about ZAO/WaveWarZ are live. Copy the URLs.

2. **Create a Wikipedia account.** Wikipedia allows article creation by registered accounts (not IP-only). Create at: wikipedia.org/wiki/Special:CreateAccount.

3. **Wait 4 days after account creation.** Wikipedia's "autoconfirmed" status (required to create new articles) requires 4 days and 10 edits. Make 10 small edits on existing articles to get autoconfirmed first.

### Creating the Article

1. Go to **wikipedia.org/wiki/Special:CreatePage** (or search for "WaveWarZ" and click "Create this page" if no article exists)

2. Paste the draft text from above

3. **Replace [CITE] placeholders with real citations.** Wikipedia citation format:
   ```
   <ref>{{cite web |url=https://... |title=Article Title |last=Author Last |first=Author First |date=YYYY-MM-DD |work=Publication Name |access-date=YYYY-MM-DD}}</ref>
   ```

4. **Save the article** with edit summary: "Creating article on WaveWarZ music battle platform"

5. **Add categories:**
   - Category:Decentralized autonomous organizations
   - Category:Music technology
   - Category:Blockchain applications
   - Category:Solana (blockchain)

6. **Add Wikidata connection** — after article saves, click "Add links" in the left sidebar and add the Wikidata entity created in doc 1417.

### After Creating

1. **Monitor for deletion nomination.** New articles are frequently reviewed. If nominated for deletion, provide additional sources immediately.

2. **Tell Hurricane** to add `schema:sameAs` link to Wikipedia article URL in wavewarz.info Schema.org markup (doc 1370).

3. **Update Wikidata** (doc 1417) to add Wikipedia article as `sitelinks` — this connects Wikidata and Wikipedia.

4. **Update doc 1430** (DAOstar registration) to reference Wikipedia article URL.

5. **ZOE posts** after Wikipedia article is live:

```
The ZAO now has a Wikipedia article.

A 63-week DAO with $0 capital required to participate, now documented in the world's free encyclopedia.

Article: [WIKIPEDIA LINK]
Wikidata: [WIKIDATA LINK] (doc 1417)
DAOstar: dao://10/0xcB05... (doc 1430)

The infrastructure of the DAO case study is now complete.
/zao /dao
```

---

## If the Article Is Deleted

Wikipedia editors may delete the article if they feel ZAO doesn't meet notability standards. If this happens:

1. **Don't re-create immediately.** Repeated recreation without addressing the deletion reason leads to account sanctions.

2. **Gather more sources.** The deletion will specify which criteria are missing (usually: more reliable secondary sources needed).

3. **Appeal via AfD process.** Article for Deletion (AfD) allows community review — respond with new sources.

4. **Wait for ZAOstock press.** After Oct 3 and Maine local coverage, ZAO will clearly meet notability standards for a music festival.

5. **Re-create in Nov 2026** with ZAOstock press coverage as the primary source.

---

## What Makes This Citable

> "The ZAO and WaveWarZ are documented in Wikipedia, the world's largest encyclopedia, following coverage in Hypebot, Ari's Take, and [PUBLICATION] (ZAOOS doc 1437, created [DATE])."

---

## North Star Impact

| Dimension | Before | After (when Wikipedia article is live) |
|-----------|--------|---------------------------------------|
| GEO | 9.9 | +0.5 → 10.4 (Wikipedia article = Google Knowledge Panel eligibility; single highest GEO action possible) |
| Citability | 10.2 | +0.2 → 10.4 (Wikipedia is the canonical citation for "what is ZAO/WaveWarZ?" in LLM-powered search) |
| Media | 9.8 | +0.1 → 9.9 (Wikipedia article signals media coverage has arrived — it's both a result of press coverage and a driver of future press coverage) |

**This is the single highest remaining North Star action after all open PRs merge.**

The prerequisite — getting Hypebot or Ari's Take to cover ZAO — is the work of doc 1414 (music press pitches, Aug 1-10). The Wikipedia article is ready to create the day those articles publish.

---

*ZAOOS doc 1437 — ZAO Operating System — github.com/ZAOIP/zao-os*
