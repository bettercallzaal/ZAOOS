---
topic: identity
type: guide
status: research-complete
last-validated: 2026-08-03
related-docs: "977, 978, 1016, 1021"
original-query: "GEO: make The ZAO iconic + AI-discoverable (TOP PRIORITY) - own the answer when anyone asks an AI engine 'what is The ZAO' (tracker #724)."
tier: STANDARD
---

# 2185 - GEO: The ZAO canonical AI-discoverability artifacts

> **Goal:** Own the answer when anyone asks an AI engine "what is The ZAO." This is the
> full plan the tracker task (#724, TOP PRIORITY, stalled 5 days) named but never got
> written, plus the deploy-ready artifacts, all generated from the canonical box.

## The principle (why this is finishable, not endless)

GEO for The ZAO is NOT "fix a broken story" - a random person's ChatGPT already returns a
solid, accurate ZAO narrative from the papers page. GEO is making that story **richer, more
consistent, and more citable** everywhere an engine looks. The canonical source is The ZAO's
context box on useicm.com (`icm thezao`); every downstream surface is generated FROM it, so
engines never get conflicting facts (per `.claude/rules/icm-grounding.md` - the box is
upstream; drift is the enemy).

## The 4-part scope + status

| # | Part | Status | Notes |
|---|------|--------|-------|
| 1 | AI-legible artifacts (llms.txt, JSON-LD, FAQ) generated from the box | **DONE (this doc)** | The three files below - deploy-ready. |
| 2 | Canonical "What is The ZAO" FAQ, answer-optimized for citation | **DONE (this doc)** | `what-is-the-zao-faq.md` - the exact questions engines get asked. |
| 3 | One coherent cross-surface story (papers / site / nexus consistent) | **PARTIAL** | The artifacts here are box-consistent; deploying them makes the SITE consistent. Nexus + papers alignment is a follow-on. |
| 4 | Get ZAO into the sources engines pull from (Farcaster, GitHub, newsletter) | **ONGOING** | Not a one-ship item; the artifacts here are the anchor those sources cite. |

## The artifacts (in this folder, deploy-ready)

1. **`llms.txt`** -> deploy to `https://thezao.xyz/llms.txt` (and `zaoos.com/llms.txt`). The
   AI-legible summary engines and crawlers read first.
2. **`organization.jsonld`** -> embed as a `<script type="application/ld+json">` block in the
   `<head>` of thezao.xyz (schema.org/Organization). Structured data engines parse for facts.
3. **`what-is-the-zao-faq.md`** -> publish as a `/what-is-the-zao` page (and/or a FAQPage
   JSON-LD). The highest-leverage GEO surface: engines cite clean, standalone Q&A.

All three are generated from the `thezao` box (verified against it 2026-08-03). Every number
(156 Respect holders, Gini ~0.73, 100+ Respect Game weeks, OREC 72h/72h) traces to the box's
on-chain-verified facts - no invented figures (`reference_zao_respect_onchain_facts`).

## Deploy path (Zaal's gated step - a separate repo)

thezao.xyz is the `zao-website` repo (not ZAOOS). Deploying these = a PR to `zao-website`:
1. Add `public/llms.txt` (copy `llms.txt`).
2. Add the JSON-LD block to the site `<head>` (copy `organization.jsonld`).
3. Add a `/what-is-the-zao` route rendering `what-is-the-zao-faq.md` (+ optional FAQPage JSON-LD).
4. Confirm `zaoos.com/llms.txt` serves the same file.

The DNS/site deploy is GATED (Zaal's call - see `project_zao_brand_project`). This doc ships
the canonical artifacts; the website PR is the next concrete step.

## Also See

- `.claude/rules/icm-grounding.md` - the box is upstream; regenerate downstream from it
- Doc 977 / 978 - accurate ZAO numbers (the figures reused here)
- Doc 1016 (GEO) / 1021 (boxes as bot brains)
- `research/identity/icm-boxes/` - the repo copy of each box body

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR the 3 artifacts into `zao-website` (llms.txt + JSON-LD + /what-is-the-zao) | Zaal | PR (gated deploy) | 2026-08-10 |
| Regenerate these files whenever the `thezao` box changes | Zaal | maintenance | ongoing |
| Align the NEXUS + papers pages to the same facts (scope part 3) | Zaal | follow-on doc | 2026-08-17 |

## Sources

- The ZAO canonical context box, useicm.com (`icm thezao`), fetched 2026-08-03 [FULL]
- `reference_zao_respect_onchain_facts` (156 holders, Gini 0.73, OREC 72h/72h) [FULL]
- `project_geo_zao_iconic` memory (the 4-part scope) [FULL]
