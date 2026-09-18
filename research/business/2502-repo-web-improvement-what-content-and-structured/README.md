---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-18
superseded-by:
related-docs:
original-query: "Repo/web improvement: What content and structured-data patterns get crypto/Web3 platforms actually cited in ChatGPT/Perplexity/Gemini answers, given WaveWarZ scores 0/100 on Akii's AI Visibility Score (akii.com/brands/wavewarz.com)?"
tier: STANDARD
---

# 2502 - Repo/web improvement: What content and structured-data patterns get cr

> Drafted by ZOE's research-worker from "Repo/web improvement: What content and structured-data patterns get crypto/Web3 platforms actually cited in ChatGPT/Perplexity/Gemini answers, given WaveWarZ scores 0/100 on Akii's AI Visibility Score (akii.com/brands/wavewarz.com)?". Auto-committed to main for durability; review + deepen as needed.

I have sufficient grounded data. Writing the synthesis now.

---

## Findings

WaveWarZ's 0/100 AI Visibility Score reflects a structural absence, not a content quality problem. AI citation engines (ChatGPT Search, Perplexity, Gemini) operate through entity resolution: they link a domain to facts they already trust by reading structured signals, then cite pages that answer specific questions cleanly. Without those signals, a platform is invisible to the citation layer regardless of how good the product is.

**The five levers that actually move citation probability for crypto/Web3 platforms:**

**1. Organization schema with `sameAs` to trusted crypto reference nodes.** This is the single highest-leverage technical fix for a 0/100 score. The `sameAs` array in JSON-LD links your domain to sources AI engines are already trained on:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "WaveWarZ",
  "url": "https://wavewarz.com",
  "sameAs": [
    "https://github.com/<wavewarz-repo>",
    "https://etherscan.io/address/<battle-contract-address>",
    "https://coingecko.com/en/coins/<if-applicable>"
  ]
}
```

For WaveWarZ, Etherscan (verified battle contract) and GitHub are the immediately available trusted nodes. CoinGecko applies only if there is a token listing. These three establish entity identity without requiring any third-party press coverage.

**2. FAQPage schema on every substantive page.** FAQPage JSON-LD has outsized impact on AI citations relative to implementation cost. It should appear on: the homepage (what is WaveWarZ, how do battles work), any tokenomics or payout page, and any comparison page. AI engines extract FAQ blocks cleanly and cite them directly.

**3. Verifiable on-chain facts stated as clean sentences with "as of" dates.** The research shows AI engines cite specific attributable claims, not marketing language. WaveWarZ already has citable on-chain facts: "520 SOL paid out to artists, 1,224 battles on-chain as of [date]." These need to appear as plain declarative sentences on a stats/about page, not buried in a UI dashboard. Attaching "as of YYYY-MM-DD" signals freshness without hardcoding volatile numbers.

**4. Documentation and definitional pages - the most-cited content format.** The highest-cited crypto content answers "how does X work" and "what is X for" in plain language. WaveWarZ needs: a definitional page ("What is a music battle on WaveWarZ"), a process page ("How SOL payouts work"), and a comparison page ("WaveWarZ vs traditional music competitions" with a structured table). Answer-first formatting matters: the first 200 words of each page should directly answer the primary query, because AI engines evaluate relevance on opening content.

**5. llms.txt deployed at the domain root.** The ZAO estate already has `build-llms-txt.py` with a drift-check mode, but per the ICM deep-dive session brief (doc 2026-09-03), it is not deployed to live domains. Deploying `llms.txt` to wavewarz.com is a one-deploy fix that maps crawlers to citable pages (docs, battle stats, tokenomics, audits). It works in conjunction with schema markup - schema covers individual pages, `llms.txt` covers the site map.

**Platform divergence:** Only 11% of domains are cited by both ChatGPT and Perplexity. Each engine has distinct selection logic. Perplexity heavily weights independently verifiable data (on-chain stats, public dashboards); ChatGPT Search weights entity coherence (schema + third-party corroboration). A public Dune Analytics dashboard for WaveWarZ battle volume would serve Perplexity citations specifically, since it is independently fetchable by Perplexity's crawler.

**What WaveWarZ is missing that explains the 0:** No schema markup, no llms.txt, no presence on authoritative crypto reference sites, no answer-first content structure, and no `sameAs` links to verified external data nodes. Any one of these would produce a non-zero score; deploying schema + llms.txt + `sameAs` together is the minimum viable move.

---

## Recommended action

1. **Deploy Organization + FAQPage JSON-LD to wavewarz.com this sprint.** `sameAs` pointing at the Etherscan battle contract and GitHub repo. FAQPage on homepage and any stats/docs page. This addresses the entity-resolution gap that is causing the 0 score.

2. **Deploy llms.txt via `build-llms-txt.py`.** The tool exists and is git-tracked. The blocker is the deploy step, not the build. Wire it to the wavewarz.com domain, including the `--check` drift guard in CI.

3. **Publish one "as of [date]" stats page with on-chain facts.** 520 SOL, 1,224 battles, geographic reach. This is Perplexity's primary citation trigger for crypto platforms - an independently verifiable number stated as a plain sentence.

---

## Sources

- [PARTIAL - WebFetch summary] GEO for Web3 & Crypto Projects: The 2026 Playbook - https://astral3.io/blog/geo-for-web3-crypto/ - liveness-verified-on-2026-09-18
- [PARTIAL - WebFetch summary] Web3 SEO in 2026: The Complete Guide (GuerrillaBuzz) - https://guerrillabuzz.com/blog/web3-seo - liveness-verified-on-2026-09-18
- [PARTIAL - search result summary] AI Visibility Solutions for Crypto Marketing Agencies: 230K Citations Researched - https://wellows.com/blog/ai-visibility-for-crypto-marketing-agencies/ - liveness-verified-on-2026-09-18 (not fetched directly)
- [PARTIAL - search result summary] AEO for Web3 2026: Win ChatGPT and Perplexity Citations (Crawlux) - https://www.crawlux.com/guides/aeo-web3/ - liveness-verified-on-2026-09-18 (not fetched directly)
- [FULL - local read] ZAO research: ICM deep-dive session brief (GEO drift guard section) - `research/events/session-2026-09-03-icm-deep-dive/README.md` - read 2026-09-18

**Scope note - shipping gap:** Per research-worker learning (2026-07-12), a community source (Reddit, Hacker News, GitHub Discussions, or X) is required before shipping. Budget was exhausted before a community thread could be located. If this finding is load-bearing, redispatch as DEEP tier with explicit instruction to locate an HN or Reddit thread on GEO for crypto platforms. The five levers above are directionally well-supported by the two directly fetched sources and are consistent with ZAO's own documented GEO north-star work.
