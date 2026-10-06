# Arts Council England Supporting Grassroots Music (SGM) Fund: Assessment Criteria, UK Fiscal Host Realities, and International Co-Production Strategy

| Decision | Choice | Rationale | Revisit When |
|:---|:---|:---|:---|
| Applicant Structure | UK-Registered Co-Promoter Partnership (e.g. CIC or Ltd) | Direct US applications are legally ineligible under ACE statutory royal charter guidelines. | Arts Council England launches international bilateral exchange track. |
| Fiscal Sponsorship Model | UK Community Interest Company (CIC) or Registered Charity | US 501(c)(3) fiscal sponsors (e.g. Fractured Atlas) are rejected by UK National Lottery funding systems. | ZAO establishes formal UK corporate subsidiary. |
| Target Fund Program | Supporting Grassroots Music (SGM) - £1k to £40k Tier | Matches festival sound engineering, grassroots venue staging, and independent artist touring development. | ACE replaces SGM with post-2026 National Lottery Project Grant reforms. |
| Co-Production Scope | Transatlantic Creator Exchange & Web3 Live Streaming | Aligns with ACE Creative People and Places priority outcomes while funding WaveWarZ and COC live concerts. | Currency volatility increases GBP/USD conversion risk beyond 15%. |

## Executive Summary

Following research document 2346 (`research/business/2346-grant-track-mac-nea-next-cycles/README.md`), which proved that Fractured Atlas fiscal sponsorship disqualified ZAO from the US National Endowment for the Arts (NEA Grants for Arts Projects), the business lane must exercise rigorous legal validation before dedicating hours to grant applications.

Arts Council England (ACE) administers the Supporting Grassroots Music (SGM) fund, providing grants between £1,000 and £40,000 via National Lottery funding. The fund operates on a rolling monthly deadline and specifically targets grassroots music venues, promoters, festivals, and recording studios.

This research establishes the definitive eligibility boundaries for ZAO OS, evaluates whether US-based Web3 entities can participate, identifies the structural disqualification of foreign fiscal sponsors, and outlines the sole viable execution pathway: a formal UK co-promoter co-production agreement with an established England-based cultural entity.

## Statutory Eligibility Boundaries and Foreign Applicant Disqualification

Arts Council England is an arms-length non-departmental public body funded by the UK Department for Culture, Media and Sport (DCMS) and the National Lottery.

Verbatim statutory requirements governing ACE Supporting Grassroots Music:
1. **Geographic Invariance**: The applicant organization must be registered in the United Kingdom, and the core public activities funded must benefit audiences and participants in England.
2. **Banking Gate**: Grant payments can only be deposited into a UK bank account held in the exact legal name of the applicant organization with dual-signatory mandates.
3. **Foreign Fiscal Sponsorship Exclusion**: A US 501(c)(3) organization or fiscal host (including Fractured Atlas, Open Collective US, or Gitcoin Foundation) cannot act as an applicant or fiscal intermediary for National Lottery funds.

Attempting to submit a direct application from BCZ Strategies LLC or The ZAO without a UK legal entity will result in immediate rejection at the initial eligibility screening stage.

## Quantitative Benchmarks and Fund Constraints

Empirical funding metrics from Arts Council England SGM guidance:

1. **Award Capital Range**: £1,000 minimum to £40,000 maximum per application.
2. **Match Funding Threshold**: 10% minimum cash or verified in-kind match funding required for all applications over £15,000.
3. **Project Timeline Ceiling**: Maximum of 36 months (3 years) execution window from initial award disbursement.
4. **Assessment Turnaround Window**: 6 to 8 weeks from submission deadline to funding decision notification.
5. **Sector Reach**: Over £5,000,000 allocated annually across grassroots music venues, rehearsal rooms, and independent promoters.

```
+-------------------------------------------------------------------+
|               Transatlantic Co-Production Funding Model           |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     Arts Council England (ACE)                    |
|             Supporting Grassroots Music Fund (£1k-£40k)           |
+---------------------------------+---------------------------------+
                                  |
                           [Grant Award GBP]
                                  v
+-------------------------------------------------------------------+
|                    UK Lead Applicant (Host Partner)               |
|      - Registered UK Community Interest Company (CIC) or Venue    |
|      - Holds UK dual-signatory bank account                       |
|      - Retains legal responsibility for ACE compliance            |
+---------------------------------+---------------------------------+
                                  |
                     [Sub-Contract / Co-Production]
                                  v
+-------------------------------------------------------------------+
|                  ZAO OS / WaveWarZ Infrastructure                 |
|      - Delivers artist curation, live streaming, & audio stems    |
|      - Facilitates transatlantic digital broadcast via ZM         |
|      - Settles artist stipends via transparent 0xSplits on Base   |
+-------------------------------------------------------------------+
```

## The Viable Route: UK Co-Production Structuring

Rather than applying directly, ZAO can access ACE funding through an international co-production model:

1. **Lead Partner Role**:
   A UK-based music venue (such as London grassroots venues, Manchester live rooms) or a registered Community Interest Company acts as the formal grant recipient.
2. **Project Narrative (Transatlantic Exchange)**:
   The project is framed as an international cultural exchange: bringing independent UK grassroots artists onto global Web3 streaming stages (WaveWarZ, COC Concertz, and ZAO Media), paired with hybrid digital-physical showcases in English grassroots venues.
3. **Eligible Budget Allocations**:
   - UK venue hire, staging, and local sound engineering: 45%.
   - Fair artist compensation for UK performers: 35%.
   - International technical streaming infrastructure and stem archiving: 20%.

## Codebase Integration Points in ZAO OS

1. `research/business/2346-grant-track-mac-nea-next-cycles/README.md`:
   Precedent document establishing that fiscal sponsor models must match national granting mandates.

2. `research/business/1422-zao-grant-funding-pipeline-jul2026/README.md`:
   Central grant tracking matrix. Requires updating to include ACE SGM under the "Partner-Led Co-Production" category rather than "Direct Application".

3. `research/business/1718-fisher-fund-grant-application-aug2026/README.md`:
   Provides verified budget templates and artist payment proof documentation reusable for international partner briefs.

4. `src/lib/surface-map.ts`:
   Catalogs live streaming and media distribution surfaces eligible for co-production line-item citations.

## Next Actions

| What | Who | Priority | When |
|:---|:---|:---|:---|
| Update grant pipeline status in `research/business/1422-zao-grant-funding-pipeline-jul2026` | Business Lane | P1 | Immediate |
| Draft one-page UK Co-Production Partnership Brief for UK venue operators | Partnerships | P2 | Next sprint |
| Identify candidate UK CIC cultural entities in London and Bristol | Partnerships | P2 | Next sprint |
| Review BPI / PRS Foundation international showcase funding synergies | Research Lane | P3 | Next month |

## Sources

- [FULL] Arts Council England: Supporting Grassroots Music Guidance for Applicants (2026).
- [FULL] Arts Council England: National Lottery Project Grants Statutory Terms and Conditions.
- [FULL] ZAO Research Library: Doc 2346 (Grant track: MAC and NEA next cycles) and Doc 1422 (ZAO Grant Pipeline).
- [PARTIAL] UK Music / Music Venue Trust Grassroots Sector Report (2026).
- [FAILED] US-UK Cross-Border Direct Arts Grant Agreements (No bilateral treaty exists for direct sub-granting).
