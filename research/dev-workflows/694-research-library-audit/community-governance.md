# Research Audit: Community & Governance Folders

**Scope:** 42 community docs + 33 governance docs = 75 total research documents
**Date audited:** 2026-05-20
**Criteria:** Frontmatter completeness, source health, staleness, goal clarity, completeness

---

## Summary

| Verdict | Count | Notes |
|---------|-------|-------|
| **FINE** | 54 | Solid, current, good sources |
| **REVALIDATE** | 0 | None exceeded 60-day staleness threshold |
| **RE-RESEARCH** | 20 | Thin sources / stubs / unclear goals / info loss |
| **ARCHIVE** | 1 | Superseded by doc 427/050/051 |

**Health:** 72% passing (FINE), 27% need rework (RE-RESEARCH), 1% obsolete (ARCHIVE)

---

## Priority RE-RESEARCH Docs (Top 10)

| # | Folder | Status | Title | Reason | Priority |
|---|--------|--------|-------|--------|----------|
| 590 | community | research-complete | Substack's Three Models for Building Co... | Sources lost to fetch errors / 404s | HIGH |
| 624 | community | research-complete | Nexus Portal Canon (May 7 stub) | Stub / incomplete, missing clear goal | HIGH |
| 59 | governance | research-complete | ZAO Hats Tree: On-Chain State & ZAO OS... | Stub with incomplete integration notes | HIGH |
| 500 | governance | published | DAO Event Coordination Patterns | Stub / incomplete, missing goal clarity | HIGH |
| 502 | governance | research-complete | ZAOstock Circles v1 Spec | Thin sources (metadata-only notes) | MED |
| 567 | governance | research-complete | Nouns DAO Deep Dive: Mechanism Lore | Thin sources (mostly outline, light content) | MED |
| 635 | community | research-complete | CyrilXBT on Anthropic AI Agents | Very thin (374w) without clear purpose | MED |
| 60 | community | research-complete | Vitalik's Ethereum Philosophy | Sources marked as "metadata only" | MED |
| 75 | governance | research-complete | Hats Protocol V2 Updates | Sources marked as "thin / metadata only" | MED |
| 444 | governance | ready-for-submission | ZAO Fractal Submission: April 20 | Very thin (484w), operational notes only | MED |

---

## Detailed Verdicts

### RE-RESEARCH (HIGH PRIORITY)

**590 — Substack's Three Community Models**
- **Status:** research-complete
- **Issue:** Sources section shows fetch failures: "could not parse" on 2 out of 3 sources
- **Action:** Re-fetch Substack URLs + add 2-3 real case studies (BCZ, Juno, one music creator)
- **Impact:** Informs future ZAO community models; blockers doc development

**624 — Nexus Portal Canon (May 7)**
- **Status:** research-complete (marked with quotation error)
- **Issue:** Frontmatter formatting error (`"2026-05-0`) + content is 40% placeholder ("Add X here", "(pending)")
- **Action:** Complete canonical Nexus Portal overview by reviewing actual portal.zaoos.com + Quad source code
- **Impact:** Needed for upcoming portal launch decision

**59 — ZAO Hats Tree: On-Chain State & ZAO OS Integration**
- **Status:** research-complete
- **Issue:** Content is ~40% research + 60% unfinished integration spec ("TODO: clarify role hierarchy", stub sections)
- **Action:** Complete: test live Hats deployment on Base + map ZAO roles → Hats roles + spec ZAO OS integration
- **Impact:** Blocks governance infrastructure decisions

**500 — DAO Event Coordination Patterns**
- **Status:** published
- **Issue:** Stub doc: only 1,858 words, section headers present but no body content ("TBD", gaps)
- **Action:** Flesh out with 3-5 real DAO event examples (ETHDenver, Ethereum Foundation, etc) + apply to ZAOstock workflow
- **Impact:** ZAOstock team needs this for Oct 3 execution

---

### RE-RESEARCH (MED PRIORITY)

**502 — ZAOstock Circles v1 Spec**
- **Issue:** Thin sources (spec pulled from memory/notes, not live research)
- **Action:** Cross-reference with doc 498 (ZAO Fractal Adapted) + test actual circle workflow
- **Impact:** Confirms Circles v1 design before Oct event

**567 — Nouns DAO Deep Dive: Mechanism Lore + ZAO Angles**
- **Issue:** 2,604 words but mostly outline structure; thin on mechanism analysis
- **Action:** Add: treasury curve analysis, prop voting mechanics, historical failures, ZAO-specific learnings
- **Impact:** Informs future on-chain governance spec

**60 — Vitalik's Ethereum Philosophy & EF Mandate**
- **Issue:** Sources marked "metadata only" - no actual fetch of Vitalik blog posts for quotes
- **Action:** Re-fetch all 6 source blog posts, add direct quotes + analysis
- **Impact:** Core alignment doc; needs solid sourcing

**75 — Hats Protocol V2 Updates & Tooling**
- **Issue:** Thin sources section; mostly product review without real integration planning
- **Action:** Review Hats v2 changelog + plan ZAO-specific role hierarchy
- **Impact:** Informs identity/governance layer decisions

---

### RE-RESEARCH (LOW PRIORITY)

**635 — CyrilXBT on Anthropic AI Agents Workshop (374w)**
- **Issue:** Very short, no clear takeaway or how-to-apply section
- **Action:** Expand: What did Cyril teach? How does ZAO apply this to agent stack?
- **Impact:** Informational only; lower urgency

**105, 272, 458, 56, 58, 103, 109, 450, 497, 501**
- **Issue:** Missing or vague Goal lines; unclear why each doc exists or what decision it informs
- **Action:** Add explicit `> Goal:` line + one-sentence decision context for each
- **Impact:** Organizational clarity; docs are solid but need better framing

---

## ARCHIVE

**600 — Jadyn Violet & UVR (Underground Violet Review)**
- **Superseded by:** Doc 427, 050, 051 (all more current and complete)
- **Action:** Link to doc 427 as canonical source; this doc can be marked historical

---

## Recommendations

1. **Immediate (week of 5/20):** Fix HIGH-priority docs (590, 624, 59, 500). These block ZAOstock + governance work.
2. **Next sprint:** Complete MED-priority source gaps (60, 75, 502, 567).
3. **Process improvement:** Add consistent frontmatter template to all new research docs.
   - Required: `status:`, `last-validated: YYYY-MM-DD`, `> Goal:` (one sentence)
   - Check: 60-day staleness on "governance/community" topics

---

## Files by Quality Tier

**TIER 1 (Canonical, use freely):**
530, 533, 547, 577, 621, 625, 634, 640, 642 — all recent (11-26 days), solid sourcing, clear use cases

**TIER 2 (Research-complete, safe with minor updates):**
023, 050, 051, 060, 061, 065, 094, 105, 106, 110, 169, 200, 229, 249, 287, 289, 348, 352, 358, 363, 415, 419, 427, 432, 449, 458, 538, 547, 56, 58, 102, 103, 104, 109, 111, 114, 115, 132, 133, 140, 149, 188, 285, 299, 306, 346, 347, 349, 497, 498 — known good, low change risk

**TIER 3 (Needs rework before citing):**
590, 624, 59, 500, 502, 567, 60, 75, 444, 635, 105, 272, 458, 497, 501

**TIER 4 (Retired):**
600 (superseded)

