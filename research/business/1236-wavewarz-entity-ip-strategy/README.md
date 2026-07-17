---
topic: business
type: research
status: design-complete
last-validated: 2026-07-17
related-docs: 951 (Greg/Autonomous meeting recap), 742 (Zaal Panthaki dossier), 621 (ZAO context canon)
original-query: "WaveWarZ entity formation + IP strategy follow-up — Autonomous offerings, jurisdiction comparison, trademark path; from board task 73e4f4d4; parent doc 951"
tier: STANDARD
---

# 1236 — WaveWarZ Entity Formation + IP Strategy

> **Purpose:** Follow-up to doc 951 (Greg x ZAO meeting, 2026-07-01). Synthesizes Greg's legal advice into an actionable entity formation + IP protection plan for WaveWarZ. Covers Autonomous (otomos.com) jurisdiction comparison, WaveWarZ-specific risk analysis, recommended structure, and the trademark path. Decision-ready: the three founders (Hurricane, Samantha, Zaal) can read this and choose a path at the next call.

---

## Context: What Doc 951 Established

Greg's core advice from the July 1 meeting (summarized from doc 951):

1. **Risk-first entity planning** — identify the specific liability exposure (user complaints, IP theft, YouTube strikes) before picking a structure. Entity formation ≠ IP protection.
2. **IP requires separate global filings** — creating a legal entity does NOT protect "WaveWarZ" as a name or the gamification mechanism. Trademark filings are separate, multi-jurisdictional, and slow.
3. **Offshore vs US LLC tradeoff** — offshore (Cayman, BVI, Panama, Singapore) raises litigation costs but YouTube's platform rules are the real threat, not US jurisdiction. Hybrid (offshore holding + US LLC pass-through) is optimal for banking access.
4. **Autonomous (otomos.com)** — Greg's firm, 18+ formation jurisdictions, nominee director services for privacy, turnkey setup.
5. **ApeSwap reference** — even well-resourced teams spend years in trademark disputes. WaveWarZ should file before the name becomes worth stealing.

---

## WaveWarZ Risk Profile (before choosing a structure)

| Risk type | Severity | Exposure | Greg's take |
|---|---|---|---|
| Personal liability (lawsuit from a user) | HIGH | Hurricane + Samantha + Zaal | Any entity (US LLC or offshore) breaks personal liability. Fix first. |
| "WaveWarZ" name theft | HIGH | Hurricane (original inventor) | Trademark filings required — entity formation doesn't protect it. |
| Gamification mechanism IP | MEDIUM | Hurricane (smart contract author) | Novel territory — may be patentable or copyrightable; research needed |
| YouTube community strike | MEDIUM | All (content risk) | Platform rules > jurisdiction. Offshore entity does NOT help. |
| Affiliate / rev-share misclassification | MEDIUM | Zaal (organizer of the split) | IC-vs-employee risk at scale. Agreements needed per partner. |
| Equity split dispute | LOW-MEDIUM | 3 founders | 33/33/33 or other split must be formalized in a founder agreement |

**The single most urgent action:** Start the "WaveWarZ" trademark filing NOW. The longer the delay, the higher the risk of a squatter filing first. IP timeline: 12-18 months to registration in the US (USPTO), parallel filings for EU, UK, and relevant LATAM markets.

---

## Jurisdiction Comparison (for WaveWarZ's Situation)

Greg mentioned Cayman, BVI, Panama, Singapore as the main offshore options. Here is how they compare for a US-team web3 company with Solana smart contract revenue:

| Jurisdiction | Annual cost (est.) | Banking access | Privacy | Web3 friendliness | WaveWarZ fit |
|---|---|---|---|---|---|
| **Cayman Islands** | $3,000-$8,000/yr | Hard (US banks won't touch) | High (no public registry) | HIGH — de facto standard for DeFi funds + protocols | Best for protocol DAO / token treasury; harder for the operating team |
| **British Virgin Islands (BVI)** | $1,500-$3,000/yr | Medium (some US banks via nominee) | High | HIGH — used by most web3 companies pre-SEC pressure | Good middle ground; simpler than Cayman, recognized by investors |
| **Panama** | $1,000-$2,000/yr | Medium | Medium | MEDIUM — less web3-specific legal infrastructure | Cheap, simple, but less recognized in US/EU VC context |
| **Singapore** | $2,000-$5,000/yr | HIGH (US banks accept Singapore) | Low (public ACRA registry) | VERY HIGH — MAS progressive crypto regulation | Best if WaveWarZ wants US/EU VC investment + exchange listings |
| **US LLC (Wyoming)** | $500-$1,500/yr | HIGH (natural) | Low-Medium | MEDIUM — SEC risk if token ever goes live | Best for banking; worst for regulatory protection if WaveWarZ scales |
| **Hybrid: Offshore + US LLC** | Offshore + $1K-2K/yr | HIGH (US LLC does banking) | High (offshore) | HIGH | **Greg's recommendation — optimal for WaveWarZ** |

### Recommended Structure: BVI Holding + Wyoming LLC

```
BVI Holding Co (WaveWarZ International Ltd)
├── Holds the protocol, smart contracts, brand IP, and equity
├── Offshore → personal liability protected, litigation cost elevated
└── Hurricane + Samantha + Zaal hold shares directly

Wyoming LLC (WaveWarZ Operations LLC)
├── Receives contractor payments from BVI Holding
├── US bank account, US tax filings, loan eligibility
└── Used for Stripe payouts, team compensation, US expenses
```

**Cost estimate:** ~$2,000-$4,000/yr (BVI formation + Wyoming LLC annual fee). One-time formation cost: ~$3,000-$5,000 total (Greg's firm likely in this range; Stripe Atlas Wyoming LLC = $500).

**Why BVI over Cayman:** WaveWarZ is an operating product with revenue, not a fund. BVI is simpler, cheaper, and sufficient. Cayman is overkill unless they're raising a proper token round.

---

## Autonomous (otomos.com) — What Greg's Firm Offers

Based on doc 951 and the Autonomous positioning Greg described:

| Service | What it means for WaveWarZ |
|---|---|
| 18+ jurisdiction options | Can form in BVI, Cayman, Panama, Singapore, Seychelles, Marshall Islands, and more — one-stop |
| Nominee director services | A local director in the offshore jurisdiction (privacy layer — founders don't appear in public records) |
| Registered agent | Required for BVI/Cayman to maintain the entity in good standing |
| Banking introduction | Greg has relationships that help open offshore accounts (hard to do cold) |
| IP filing contacts | From ApeSwap experience — Greg has referrals for trademark attorneys who handle multi-jurisdictional filings |
| Turnkey setup | Forms the entity, files articles, sets up the structure end-to-end |

**DECISION NEEDED (outbound gated):** Schedule the Greg follow-up call. He requested it after the team reviewed the Autonomous options. This is Zaal's action (or Hurricane's, as the primary technical founder). Reply to this doc with "call scheduled" to close the loop.

Estimated timeline once the call happens: 2-4 weeks to form the entity (BVI is fast). Trademark filing is parallel: 12-18 months to registration.

---

## IP Strategy: "WaveWarZ" Trademark Path

### What to protect

1. **"WaveWarZ" name** — brand mark. File in class 41 (entertainment services) and class 9 (software). US + EU + UK minimum.
2. **The gamification mechanism** — the real-time scored battle format with automated payouts is potentially a novel invention. Options:
   - **Patent** (utility patent on the mechanism) — $15,000-$30,000+ and 2-4 years. High bar, but creates defensive moat. Only worth it if WaveWarZ raises $500K+.
   - **Trade secret** — document the mechanism in a private memo, signed + dated. Cheaper, not registered, but still enforceable if stolen.
   - **CC0 (recommended short-term)** — Hurricane suggested this on the call. License the protocol as CC0 (public domain), which means anyone can fork it, but the brand "WaveWarZ" is still protectable separately. This prevents a squatter from claiming they invented it while WaveWarZ still owns the name.
3. **WaveWarZ logo** — trademark the wordmark + logo design.

### Priority order

1. **File the "WaveWarZ" trademark NOW** (or within 30 days). Cost: ~$2,000-$5,000 for US + 1-2 key markets via an IP attorney.
2. **Draft a trade secret memo** for the gamification mechanism (Hurricane authors it, Samantha + Zaal co-sign, dated). Free, takes 1 hour.
3. **Decide on CC0 vs patent for the protocol** (after the entity is formed, lower urgency).

---

## Affiliate / Rev-Share Structure (Risk Cleanup)

Current model: 50/50 rev-share with "community builders" who operate events. Risk: at scale, these could be reclassified as employees (W-2 triggers in the US → payroll taxes, benefits, etc.).

**Recommended cleanup:**
- Draft an Independent Contractor Agreement for each builder who receives rev-share. Key terms: IC (not employee), project-based engagement, IP assignment (anything they build on WaveWarZ protocol stays WaveWarZ property or is CC0).
- Once the WaveWarZ entity exists, route payments through it (not Zaal or Hurricane personally).
- Greg can review the IC agreement template as part of the engagement.

---

## Equity / Founder Agreement

Doc 951 flagged: "confirm 33/33/33 equity split among three founders or alternative power distribution." This must be formalized in a Founder Agreement before any entity is formed — it's much harder to contest once the entity exists with shares allocated.

**Items to lock:**
- Split percentages: Hurricane / Samantha / Zaal (confirm 33/33/33 or negotiate now)
- Vesting: 4-year cliff with 1-year cliff is standard; protects the team if a founder leaves
- IP assignment: all WaveWarZ IP (code, brand, mechanism) transfers to the entity, not personally held
- Decision-making: voting rights (usually follows equity split)

**DECISION NEEDED (founder conversation gated):** Zaal, Hurricane, and Samantha need a 30-min call to confirm the split before the Greg call. This is pre-requisite to entity formation.

---

## Action Plan (Decision-Ready)

| Action | Owner | Urgency | Gating |
|---|---|---|---|
| Confirm equity split (33/33/33 or adjust) | Zaal + Hurricane + Samantha | NOW (pre-req for entity) | Founder conversation |
| Schedule Greg follow-up call | Zaal or Hurricane | This week | Outbound gated (DECISION NEEDED) |
| File "WaveWarZ" trademark (US class 41 + 9) | IP attorney Greg refers | Within 30 days | Zaal to engage attorney via Greg referral |
| Draft trade secret memo (gamification mechanism) | Hurricane | Within 2 weeks | Hurricane writes, Zaal/Samantha co-sign |
| Form BVI Holding entity via Autonomous | Greg's firm | After equity confirmed | Outbound gated |
| Form Wyoming LLC (Stripe Atlas or attorney) | Post-BVI | After BVI | ~$500, Stripe Atlas self-serve |
| Draft IC agreement template for builders | Greg review | After entity formed | DECISION NEEDED (engage Greg) |
| Decide CC0 vs patent for protocol | Hurricane + Zaal | Low urgency | After entity + trademark filed |

---

## Cost Summary

| Item | Est. Cost | Timing |
|---|---|---|
| "WaveWarZ" trademark (US + 1 key market) | $2,000-$5,000 | ASAP |
| BVI entity formation (Autonomous) | $2,500-$5,000 one-time | After equity confirmed |
| BVI annual maintenance (Autonomous) | $1,500-$3,000/yr | Ongoing |
| Wyoming LLC (Stripe Atlas) | $500 one-time | After BVI |
| Wyoming annual fee | $100-$200/yr | Ongoing |
| **Total year 1** | **$6,600-$13,700** | — |
| **Ongoing/yr** | **$1,600-$3,200** | — |

---

## Open Questions for Zaal

1. **Equity split confirmed?** 33/33/33 or different? This is blocking entity formation.
2. **Greg call scheduled?** He's waiting on the team after the July 1 meeting. Zaal should DM Greg with 2-3 availability windows.
3. **IP attorney budget?** Trademark filing is the most time-sensitive spend (~$2,000-$5,000). Is there a WaveWarZ treasury or does each founder contribute?
4. **CC0 or closed for the protocol?** Hurricane mentioned CC0 as an option. Affects how competitors can fork.
5. **WaveWarZ Africa (Iman's project)** — should WaveWarZ Africa operate under the same entity or a sub-entity? Greg's structure can accommodate both with a clean holding → sub-entity tree.

---

## Sources

- Doc 951 — Greg x ZAO legal meeting recap (2026-07-01)
- Doc 742 — WaveWarZ founder context
- Doc 621 — ZAO ecosystem context
- Board task `73e4f4d4` — "WaveWarZ: research Autonomous + engage IP attorney for trademark"
- General: USPTO trademark class 41 (entertainment), class 9 (software)
- General: Autonomous (otomos.com) — Greg's firm positioning per doc 951
