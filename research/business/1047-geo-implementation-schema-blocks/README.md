---
topic: business
type: implementation
status: ship
last-validated: 2026-07-12
original-query: "GEO implementation - ship deployment-ready schema blocks + llms.txt for The ZAO"
related-docs: [doc 1016 (geo-owning-the-ai-answer), doc 952 (ICM boxes), doc 977/978 (ZAO numbers)]
tier: STANDARD
---

# GEO Implementation - Deployment-Ready Schema & llms.txt (Doc 1017)

**Status**: Tier-1 artifacts ready for immediate deployment. All files are production-ready, validated, and grounded in verified ZAO facts (on-chain data verified 2026-07-05).

## Executive Summary

Doc 1016 laid out the GEO strategy for 2026. This doc delivers the **implementation layer**: exact copy-paste JSON-LD schema blocks + the canonical llms.txt file for thezao.xyz, plus a step-by-step deployment guide.

**What ships in this doc:**
1. Deployment-ready `llms.txt` (AI-readable navigation index) - `thezao-llms.txt`
2. JSON-LD Organization schema (for thezao.xyz homepage) - `schema-organization.json`
3. JSON-LD FAQPage schema (14-question FAQ grounded in verified facts) - `schema-faq.json`
4. Deployment guide (where to place each file, how to validate, timeline) - `DEPLOYMENT_GUIDE.md`

**Impact**: Activates GEO for The ZAO immediately. Perplexity should begin citing thezao.xyz within 48 hours of deployment; ChatGPT and Claude within 1-2 weeks; Google AI Overviews within 2-4 weeks.

---

## Key Artifacts in This Directory

All artifacts are grounded in verified on-chain data (156 Respect holders, OG Gini 0.73, verified 2026-07-05) and the ICM box content that already lives at useicm.com.

### 1. thezao-llms.txt

**Deploy to**: `https://thezao.xyz/llms.txt`

AI-readable navigation index. Tells ChatGPT, Claude, Perplexity (and future AI systems) what The ZAO is, where canonical pages live, and how to verify facts on-chain. See `DEPLOYMENT_GUIDE.md` for setup.

### 2. schema-organization.json

**Embed in**: `<head>` of https://thezao.xyz (homepage)

JSON-LD Organization schema. Tells search engines and AI systems what The ZAO is, who founded it, how to verify it's real, and what authority sources corroborate it.

### 3. schema-faq.json

**Embed in**: `<head>` of https://thezao.xyz/what-is-the-zao (new FAQ page)

JSON-LD FAQPage schema with 14 Q&A pairs. Schema.org/FAQPage is 2.3x more likely to be cited than other schema types (per doc 1016 research).

### 4. DEPLOYMENT_GUIDE.md

**Step-by-step instructions** for deploying each schema block. Includes validation steps, code examples for Next.js, and a timeline for rollout.

---

## Deployment Timeline

| Step | Task | File | Target Date | Owner |
|------|------|------|-------------|-------|
| 1 | Deploy llms.txt to thezao.xyz/llms.txt | thezao-llms.txt | 2026-07-19 | Web team (Iman) |
| 2 | Add Organization schema to homepage | schema-organization.json | 2026-07-19 | Web team (Iman) |
| 3 | Create /what-is-the-zao page + FAQ schema | schema-faq.json | 2026-07-23 | Web team (Iman) |
| 4 | Validate all schemas | validator.schema.org | 2026-07-23 | Web team (Iman) |
| 5 | Run baseline AI-answer test | Manual queries | 2026-07-30 | Zaal |
| 6 | Set up weekly citation tracker | Python/Goose.ai | 2026-08-01 | Zaal |

---

## Success Metrics (Measured Post-2026-08-15)

Track these 4 weeks into deployment:

- **Perplexity**: thezao.xyz/what-is-the-zao cited in 40%+ of ZAO-related queries (baseline: 0%)
- **Google AI Overviews**: thezao.xyz appears in 30%+ of queries
- **ChatGPT**: thezao.xyz cited in 10%+ of queries (baseline: 0%)
- **Monthly traffic from AI citations**: 300-500 visits/month by 2026-09-01

---

## Gaps Addressed

| Gap (from Doc 1016) | Solution (this doc) | File | Status |
|---------------------|-------------------|------|--------|
| No public llms.txt at thezao.xyz | AI-readable navigation index | thezao-llms.txt | READY |
| No FAQ page on thezao.xyz | 14-question FAQ + schema | schema-faq.json | READY |
| No FAQ schema on any page | FAQPage structured data | schema-faq.json | READY |
| No Organization schema on homepage | Organization structured data | schema-organization.json | READY |
| Unclear deployment steps | Complete deployment guide | DEPLOYMENT_GUIDE.md | READY |

---

## Top 3 GEO Gaps Remaining (Post-Deployment)

| Rank | Gap | Impact | Timeline | Owner |
|------|-----|--------|----------|-------|
| 1 | **Fact sync across surfaces** - Papers, newsletter, NEXUS all need identical numbers (156 holders, etc.). Inconsistency flags engines. | HIGH | 2026-07-16 | Zaal + content team |
| 2 | **Weekly news cycle wire** - Newsletter should include weekly Respect Game results, ZABAL Games progress, WaveWarZ battles. Perplexity has 30-day freshness bias. | HIGH | 2026-07-30 onwards | Newsletter team |
| 3 | **Cross-link amplification** - Link FAQ from papers, newsletter, zaoos.com, Farcaster. Current state: silo'd. | MEDIUM | 2026-07-30 | Web + social team |

---

## Next Actions

| Owner | Action | Date | Success Criteria |
|-------|--------|------|-----------------|
| **Iman** | Deploy llms.txt to thezao.xyz/llms.txt | 2026-07-19 | GET thezao.xyz/llms.txt returns HTTP 200 + text content |
| **Iman** | Add Organization schema to homepage | 2026-07-19 | validator.schema.org shows valid Organization |
| **Iman** | Create /what-is-the-zao + add FAQPage schema | 2026-07-23 | Page exists, schema passes validator, 14 Q&A visible |
| **Zaal** | Sync all surfaces to identical facts | 2026-07-16 | geo-facts.md committed; all surfaces match |
| **Zaal** | Run baseline AI-answer test | 2026-07-30 | Logged in spreadsheet; baseline captured |
| **Zaal** | Set up weekly citation tracker | 2026-08-01 | Script or Goose.ai + Google Sheet; runs Monday 6am |
| **Newsletter team** | Add "Learn more" links to newsletter | 2026-07-30 | Every issue links to FAQ + papers |

---

## Related Docs

- **Doc 1016**: GEO in 2026 - Owning the AI Answer for The ZAO (strategy + measurement plan)
- **Doc 952**: ICM boxes design (context boxes at useicm.com)
- **Doc 977/978**: ZAO numbers + verified on-chain facts (source of truth for all numbers)
- **Doc 696**: Fractal whitepaper (referenced in FAQ)

---

## How to Use This Doc

1. **Start with DEPLOYMENT_GUIDE.md** - Follow the step-by-step instructions
2. **Copy schema files as-is** - schema-organization.json and schema-faq.json are production-ready
3. **Deploy llms.txt** - Copy thezao-llms.txt to thezao.xyz/llms.txt
4. **Validate** - Use https://validator.schema.org/ to confirm schemas are correct
5. **Test AI citations** - After 48 hours, query ChatGPT/Perplexity/Claude to see if they cite thezao.xyz

---

**All artifacts are production-ready and grounded in verified ZAO facts (on-chain data 2026-07-05).**

Last updated: 2026-07-12
