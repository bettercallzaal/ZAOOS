---
topic: "Oddly - KORRO's Odd-Lot Tender Arbitrage Claude Code Skill"
type: "business analysis"
status: "complete"
last_validated: "2026-07-18"
original_query: "Run a STANDARD-tier research pass on Oddly - a Claude Code skill for odd-lot tender arbitrage from KorroAi"
tier: "STANDARD"
---

# Oddly: Odd-Lot Tender Arbitrage via Claude Code

**NOT FINANCIAL ADVICE.** This doc analyzes what Oddly is, how it works, the regulatory basis (with corrections), and ZAO ecosystem relevance. Investment decisions carry risk of loss. Verify all claims against official SEC filings before trading.

## Goal

Understand Oddly as a retail trading tool, verify its regulatory foundation, assess the real vs claimed edge, and document KORRO's relevance to ZAO's skill ecosystem and builder thesis.

## What Oddly Is

**Oddly** is a Claude Code skill (launched 2026, by KorroAi) that identifies and validates odd-lot tender offer opportunities - a documented structural edge for retail shareholders holding fewer than 100 shares.

### The Tool

- **Function:** Scans SEC EDGAR filings for tender offers with odd-lot provisions. Applies an 11-gate automated verification system. Uses Claude to read and validate filing text.
- **Scope:** Monitors SC 13E3, 13E4 (issuer tender offers), SC TO-I, SC TO-T (third-party tenders), 10-12B (spin-off registrations), S-3, FWP (rights offerings).
- **Output:** Binary PASS/REJECT with evidence quotes from SEC filings. Gates verify: filing still active, odd-lot provision exists, all-cash consideration, affordability (cost <= 50% of user capital), premium >= 10%, deadline <= 60 days, exchange-listed, deal risk assessment, price verified, no red flags, and "grandmother test" (ethical reasonableness).
- **Frequency:** KorroAi claims 2-6 actionable opportunities per year.
- **Expected Returns:** 5-40% per transaction over 30-90 day holding periods (claimed). Win rate: 96.7% (for filings passing all 11 gates). Average realized premium: 25.12%.

### How It Works

User flow:
1. Run Oddly scanner. It flags tender offers matching odd-lot criteria.
2. Review PASS opportunities (those passing all 11 gates).
3. Buy 1-99 shares at market price (user's decision, not automated).
4. Submit tender at broker's Corporate Actions section.
5. Hold until tender offer closes. Shares sell at fixed tender price.
6. Record exit in Oddly CLI.

**No trading algorithm. No execution.** The skill is detection + verification only. User decides whether to act and handles all broker interaction.

---

## Regulatory Basis - CRITICAL CORRECTION

### What the Paper Claims

Oddly's 2026 paper states:
> "Under SEC Rule 14d-10, companies conducting tender offers may establish 'odd-lot' provisions granting priority acceptance to shareholders owning fewer than 100 shares."

**This is INCORRECT.**

### The Actual Regulation

**Rule 14d-10(f)** (the "all-holders rule") requires that tender offers be open to ALL holders WITHOUT PREFERENTIAL TREATMENT based on share count. It does NOT permit odd-lot priority.

**The actual odd-lot rule is SEC Rule 13e-4(f)(3)(i)**, which applies ONLY to **issuer tender offers** (companies buying their own stock):
- Issuer or affiliate making a tender offer for its own shares
- MAY accept all shares tendered by holders of fewer than 100 shares BEFORE prorating other shares
- Purpose: reduce administrative costs of servicing small accounts; allow small holders to exit without brokerage fees
- **Established:** 1970s-1980s (decades-old, predates the "10-year-old" framing Oddly sometimes implies)

### Scope Discrepancy

Oddly scans BOTH types:
- **13e-4 offers (issuer buybacks):** Odd-lot priority IS a regulatory right. No proration for <100 share holders.
- **14d offers (third-party/bidder tenders):** SEC does NOT mandate odd-lot priority. No-action letters (2024+) permit odd-lot ONLY tenders (targeting only <100 holders), but that's a separate deal structure, not a priority within a larger offer.

**Finding:** The regulatory basis for issuer tender offers (13e-4) IS solid and decades-old. But the paper misattributes it to Rule 14d-10, which is a material error.

---

## Academic Evidence & Return Claims

### Paper's Citations

Oddly cites:
- **Lakonishok & Vermaelen (1990):** 9-12% abnormal returns for tender-offer participants; odd-lot holders capture full premium while institutional holders face proration.
- **Larcker & Lys (1987):** 3-5% incremental return advantage for odd-lot holders.
- **Dann (1981):** Tender offers produce 16-23% average premiums; odd-lot holders achieve near-100% capture.
- **Closed-End Fund (CEF) data 2015-2025:** 90-100% odd-lot capture rates, 8-14% average premiums, 15-25% annualized returns.

**Honest Read:** These studies are real and peer-reviewed. But:
- Lakonishok, Larcker, Dann are 1980s-1990s vintage. Market structure may have evolved.
- CEF data (2015-2025) is more recent; shows 8-14% premiums, which is lower than Oddly's 5-40% range.
- No study claims a 96.7% win rate as broadly as Oddly does. The win rate applies only to opportunities passing the tool's 11 gates, which is tautological (self-selected).

---

## KorroAi / Branth & ZAO Relevance

### The Relationship

**Branth** (founder/lead of KorroAi) is a documented ZAO collaborator. KorroAi builds:
- **Onklaud 5:** Code verification (dual independent LLM review).
- **Oddly:** The odd-lot tender arbitrage tool.
- **Mue X:** Agent runtime platform.

All are "production-ready" tools with emphasis on completeness and craft (no half-shipped features).

### Ecosystem Fit

Oddly is a Claude Code **skill** - aligns with:
- ZAO's 40+ in-house skills ecosystem (autoresearch, zao-research, ship, review, etc.)
- Monetization thesis: "tools for builders + communities" (parallel to Sparkz golden-standard OSS model)
- Retail-focused (ZAO community skews toward builders/retail, not institutions)

**Honest Assessment:**
- Real collaborator with real tooling. Oddly is a legitimate tool.
- Regulatory edge IS real for issuer tenders (13e-4).
- But returns are situational, frequency is low (2-6/year), and capital allocation matters (need $500-5k per opportunity for 99 shares).
- Not OSS (not published as open repo on GitHub at time of research). Closed-source skill.

---

## Verification Summary

| Claim | Status | Notes |
|-------|--------|-------|
| SEC Rule 14d-10(f) permits odd-lot priority | FALSE | Actual rule is 13e-4(f)(3)(i), applies to issuer offers only. 14d-10(f) requires equal treatment. |
| Odd-lot edge is regulatory structure | TRUE | 13e-4(f)(3)(i) has been law for 40+ years. Institutions cannot scale it (cap at 99 shares). |
| Expected returns 5-40% per trade | PLAUSIBLE | Academic evidence supports 8-14% average premiums. Oddly's range assumes best-case timing + successful broker execution. |
| Frequency 2-6 per year | PLAUSIBLE | CEF tenders (quarterly) + spin-offs + rights offers could yield this. No independent verification. |
| Win rate 96.7% | TAUTOLOGICAL | Applies only to filings passing 11 gates. Gate design is conservative (premium >= 10%, no red flags), so high pass rate is built-in. |
| Bidder tenders have odd-lot priority | FALSE | No SEC mandate. Only issuer (13e-4) tenders. 14d offers may voluntarily target <100 holders, but that's not "priority." |

---

## Risk & Limitations

### Deal Risk
- Tender offer can fail, be withdrawn, or be prorated despite odd-lot clause.
- Offer price may be below market (negative premium), negating arbitrage.
- Acquisition/deal conditions can kill offer post-tender.

### Broker Risk
- Not all brokers support tender offer participation or charge fees.
- Tender offer may not appear in broker's Corporate Actions for days/weeks.
- User must manually submit tender (not automated).

### Market Risk
- Stock can gap-down between purchase and tender close (30-60 day hold).
- Opportunity cost: capital locked in odd-lot tender during that period.

### Frequency & Capital
- Only 2-6 opportunities per year = low throughput.
- Requires $500-5k per opportunity (99 shares at $5-50+ per share).
- Cannot scale: cap is fixed at 99 shares per holder per offer.

### Regulatory Risk
- Rule 13e-4(f)(3)(i) could be amended or repealed (low probability, but not zero).
- SEC could tighten no-action letter relief (2024 letters are recent).

---

## ZAO Strategic Relevance

### Builder Ecosystem Fit
- Real skill for real edge. Authentic, not hype.
- Retail-aligned: solves a micro-edge unavailable to institutions.
- KORRO is a ZAO collaborator; cross-promotion makes sense.

### Skill Ecosystem Consideration
- Oddly could be featured in ZAO's skill marketplace or learning materials (if/when published as OSS or wider-access skill).
- Fits the pattern: niche, builder-focused tool (like zao-research, autoresearch).

### Honest Recommendation
- Monitor but do not over-position. Tool is real, edge is real, but:
  - Frequency is too low for portfolio-core strategy.
  - Requires active broker knowledge.
  - Paper's regulatory attribution error is a yellow flag on deeper due diligence.
- If KORRO open-sources or makes Oddly community-accessible, re-evaluate for ZAO skill integration.
- KORRO as collaborator is solid; their emphasis on craft aligns with ZAO values.

---

## Next Actions

| Owner | Target Date | Shipped Criteria |
|-------|-------------|------------------|
| Research | 2026-07-18 | Doc written, sources fetched, regulatory facts verified. |
| Zaal | TBD | Decide whether to cross-promote Oddly in ZAO skill ecosystem / feature it in learning materials. |
| Zaal | TBD | Consider collaborative opportunities with KORRO (e.g., joint workshop on special situations, regulatory edges). |

---

## Sources

- [KorroAi GitHub: Oddly Repo](https://github.com/KorroAi/oddly) - README + PAPER.pdf - FULL
- [KorroAi Landing Page](https://korrocorp.com) - Company positioning - FULL
- [SEC Rule 14d-10 vs Rule 13e-4 Verification](https://www.sec.gov/files/rules/final/34-38068.txt) - Tender offer rules framework - FULL
- [SEC Tender Offer Rules CDI Update](https://cooleypubco.com/2023/03/21/update-tender-offer-cdis/) - 2023 guidance on 14d vs 13e distinction - FULL
- [CTA Acquisitions: Tender Offer Rules 2026 Guide](https://ctacquisitions.com/tender-offer-rules/) - Cross-reference on rule scope - FULL
- [SEC EDGAR System](https://www.sec.gov/edgar) - Filing retrieval - REFERENCED
- Academic citations (Lakonishok & Vermaelen 1990, Larcker & Lys 1987, Dann 1981) - Cited in Oddly paper, verified to exist but not re-fetched - PARTIAL

---

## Appendix: 11-Gate System (From Oddly Framework)

| Gate | Criterion | Strictness |
|------|-----------|-----------|
| G0 | Filing still active (deadline not passed) | Automated, no ambiguity |
| G1 | Odd-lot provision explicitly quoted | Text-based, strict |
| G2 | All-cash consideration | Text-based, strict |
| G3 | Affordable (99 shares <= 50% user capital) | User-input dependent |
| G4 | Premium >= 10% | Math-based, no ambiguity |
| G5 | Deadline <= 60 days | Math-based, no ambiguity |
| G6 | Exchange-listed (NYSE/NASDAQ) | Database check, strict |
| G7 | Deal risk written (2 failure scenarios) | AI-generated, subjective |
| G8 | Tender price verified from filing text | Text-based, strict |
| G9 | No red flags (insider selling, litigation, going concern) | Text-based, subjective |
| G10 | Grandmother test (ethical reasonableness) | Subjective |

All gates must pass. Zero exceptions claimed.
