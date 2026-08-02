---
topic: business
type: audit
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs: 1070, 1016, 2155, 724
original-query: "Board task 724 (TOP PRIORITY): make The ZAO iconic + AI-discoverable - own the answer to 'what is The ZAO' across AI engines. GEO audit: how AI answers it today, structured-data gaps, Wikidata/Wikipedia presence, ICM box freshness. Ranked concrete actions."
tier: STANDARD
---

# 2180 - GEO Audit: Make The ZAO Iconic + AI-Discoverable (Task 724)

> **Goal:** Own the answer to "what is The ZAO" across AI engines. This audit was run, then EVERY load-bearing claim was re-verified against the live site - which corrected the picture materially. The on-site foundation is stronger than a first pass suggested; the real gap is off-site authority.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Where is the actual gap | **Off-site authority (Wikidata + Wikipedia), NOT on-site markup.** | On-site is largely done (verified below). ZAO is invisible to knowledge graphs + AI training corpora, which is why it gets confused with a metalcore band. |
| 2 | First move | **Create a Wikidata entity for The ZAO.** Highest leverage, ~half a day. | Wikidata is upstream to Wikipedia, Google's Knowledge Graph, and LLM training. A Q-item gives ZAO a canonical URI that disambiguates it. |
| 3 | Second move | **Wikipedia stub** (gated on notability + citations). | Directly quoted by AI systems + high search authority; but Wikipedia's notability bar is real - draft is ready, submission is Zaal's call. |
| 4 | On-site polish | **Minor: enhance the existing JSON-LD** (add foundingDate + subOrganization + more sameAs). Do NOT "add schema from scratch" - it already exists and is good. | Cheap 30-min win; not a gap. |
| 5 | Coverage | **Write ICM boxes for COC Concertz + ZAOstock** (the two real missing brands). | Completeness for the estate's AI-readable context. |

## Anti-fabrication note (why this doc corrects its own audit)

The first-pass audit claimed three gaps that **did not survive verification** - flagged here per `anti-fabrication.md` so we don't spend effort re-doing done work:

| Audit claimed | Verified reality (2026-08-02) |
|---------------|-------------------------------|
| "ZERO JSON-LD schema on thezao.xyz" | **FALSE** - 2 `application/ld+json` blocks on both `www.thezao.xyz` and `/what-is-the-zao`; the Organization schema is present and well-formed (see below). |
| "Generated llms.txt not deployed (404)" | **MOSTLY FALSE** - `zabalgamez.com/llms.txt` -> **200**, `thezao.com/llms.txt` -> **301** (redirect, not 404). Brand llms.txt is largely live. |
| "No Wikidata / Wikipedia" | **TRUE** - confirmed zero (this is the real gap). |

Lesson: a GEO audit that greps for a tag and finds none can be wrong if the tag is server-rendered - verify against the live fetched HTML, not an assumption.

## Verified current state (the foundation is strong)

- **llms.txt**: `www.thezao.xyz/llms.txt` serves clean, canonical, rich context (governance, lanes, membership). `zabalgamez.com/llms.txt` = 200. Brand generated files exist in `research/identity/icm-boxes/generated/` (thezao.com, wavewarz.com, zabalgamez.com, bettercallzaal.com, fractal). **Done.**
- **JSON-LD Organization** (live on `www.thezao.xyz`, verified):
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The ZAO",
  "alternateName": "ZTalent Artist Organization",
  "url": "https://thezao.xyz",
  "description": "A decentralized impact network returning profit margin, data, and IP rights to artists using blockchain and AI. Music first, community second, technology third.",
  "founder": { "@type": "Person", "name": "Zaal Panthaki", "alternateName": "BetterCallZaal" },
  "sameAs": ["https://zaoos.com", "https://farcaster.xyz/~/channel/zao"]
}
```
  Good schema. **Done** (minor enhancement in action 4).
- **ICM boxes**: 7 fresh (thezao, zaal, wavewarz, zabalgamez, fractal, sparkz, zao-assistant).

## The real gaps + ranked actions

### 1. Wikidata entity (HIGHEST leverage) - MISSING
The ZAO has no Wikidata Q-item; searches return only the metalcore band Zao (Q147129) and unrelated entities. Wikidata is upstream to Wikipedia, Google Knowledge Graph, and LLM training. **Draft entity (ready to submit):**
- **Label:** The ZAO · **Also known as:** ZTalent Artist Organization
- **Instance of:** decentralized autonomous organization; organization
- **Inception:** 2024-07-30 (Fractal week 1)
- **Founded by:** Zaal Panthaki (BetterCallZaal)
- **Official website:** https://thezao.xyz
- **Field of work:** music, blockchain, artist rights, decentralized governance
- **Has part / products:** WaveWarZ, ZABAL Games, ZAO festivals, ZAO OS
- **Described at URL:** https://thezao.xyz/what-is-the-zao ; **sameAs:** thezao.com, zaoos.com
- Effort ~half a day. Gated: needs a Wikidata account (Zaal's, or a team member's) - creating it is Zaal's action.

### 2. Wikipedia stub (HIGH leverage, notability-gated) - MISSING
No article. **Draft lede (ready):** "The ZAO (ZTalent Artist Organization) is a decentralized impact network founded in 2024 by Zaal Panthaki that uses blockchain and AI to return profit margin, data, and IP rights to artists, with music as its first domain." Body: governance (Respect soulbound token on Optimism, weekly Fractal, 157 holders), products (WaveWarZ - 1,245 battles / ~$39K volume; ZABAL Games; festivals), membership (sign the Manifesto). **Cite:** thezao.xyz/what-is-the-zao, WaveWarZ public API stats, the Whitepaper. Risk: Wikipedia notability - may need press citations; if rejected, the Wikidata entity (action 1) still delivers most of the AI-training benefit. Submission = Zaal's call (publishing public content).

### 3. Enhance the existing JSON-LD (LOW effort, on-site) - POLISH
Add to the live Organization block: `"foundingDate": "2024-07-30"`, `subOrganization` for WaveWarZ + ZABAL Games (with their URLs + one-liners), and extend `sameAs` to include `https://thezao.com`, `https://www.thezao.com`, `https://wavewarz.com`, and the Wikidata Q-item once created. PR to the site repo (zao-website). ~30 min.

### 4. Two missing ICM boxes (LOW-MEDIUM) - COVERAGE
Write `coconcertz.llm.txt` + `zaostock.llm.txt` in `research/identity/icm-boxes/`, regenerate. Both are real brands with product surfaces but no AI-readable context box. (Note: creating/editing ICM boxes = gated per `icm-grounding.md` - Zaal's OK on content.)

### 5. Domain redirect consistency (MINOR) - POLISH
`thezao.com` returns 301, `thezao.xyz` returns 307. Standardize to 308 (permanent, method-preserving) so crawlers consolidate authority under one canonical domain. ~30 min Vercel config.

## Also See

- [Doc 1070](../1070-geo-own-the-ai-answer/) - GEO strategy (own the AI answer).
- [Doc 1016](../../identity/1016-geo-generative-engine-optimization/) - GEO foundations.
- [Doc 2155](../../identity/2155-per-brand-identity-kit/) - per-brand identity (the box system this extends).
- `.claude/rules/icm-grounding.md` - the box-is-source-of-truth rule GEO generates from.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create the Wikidata entity for The ZAO (draft fields above) | @Zaal | Manual (Wikidata acct) | 2026-08-09 |
| Submit the Wikipedia stub (draft ready; add citations) | @Zaal | Publishing (gated) | 2026-08-16 |
| Enhance live JSON-LD (foundingDate + subOrganization + sameAs) - PR to zao-website | @Zaal | PR | 2026-08-07 |
| Write COC Concertz + ZAOstock ICM boxes (gated content) - boxes live | @Zaal | Manual (icm) | 2026-08-11 |
| Standardize domain redirects to 308 - verified `curl -I` | @Zaal | Config | 2026-08-07 |

## Sources

- [FULL] `https://www.thezao.xyz` + `/what-is-the-zao` - live JSON-LD Organization block (verified present, 2 blocks each, 2026-08-02).
- [FULL] `https://www.thezao.xyz/llms.txt` - canonical context, strong.
- [FULL] `https://zabalgamez.com/llms.txt` -> 200; `https://thezao.com/llms.txt` -> 301 (verified via `curl -w %{http_code}`).
- [FULL] `research/identity/icm-boxes/generated/` - 5 generated brand llms.txt files (thezao.com, wavewarz.com, zabalgamez.com, bettercallzaal.com, fractal).
- [FAILED - real gap] Wikidata search "The ZAO" / "ZTalent Artist Organization" -> zero ZAO entity (only Zao metalcore band Q147129).
- [FAILED - real gap] Wikipedia search "The ZAO" / "ZTalent" -> zero article.
- [FULL] GEO audit subagent (2026-08-02) - findings re-verified by orchestrator; 3 over-graded claims corrected above per `anti-fabrication.md`.
