# 1555 — ZABAL S2 Micro-Grant Program Spec (Nov 2026 Graduation)

**Type:** PROGRAM-SPEC  
**Topic:** ZABAL  
**Status:** DRAFT — awards announced Nov 21, 2026 (graduation day). Funding source: Fisher Fund grant (Aug 15 confirm, doc 1455) + any ZAOstock surplus. Confirm award amounts after Fisher grant confirmed (Aug 15).

---

## Why Micro-Grants Matter

ZABAL S1 had no formal graduation incentive beyond community recognition. S1 feedback (doc 1466) indicates this reduced completion rates in the back half of the cohort. Micro-grants create a concrete endpoint: participants know that completing the program results in a tangible award, not just a certificate.

**Secondary benefits:**
- "Micro-grant recipients" = citable data point for Fisher Fund renewal, MAC grant, OP RF
- ZABAL S2 graduates who receive grants = potential ZAOOS doc authors + future ZAO contributors
- Micro-grant amounts ($50–$200) are accessible to a Fisher Fund application ($2K–$5K scope)

---

## Program Structure

### Award Tiers

| Tier | Name | Amount | Criteria | Expected Recipients |
|---|---|---|---|---|
| 1 — Completion | Participant Award | $50 USDC | Met minimum completion criteria (see below) | 10–15 participants |
| 2 — Contribution | Contributor Award | $100 USDC | Completion + ≥2 ZAOOS docs merged | 5–10 participants |
| 3 — Excellence | Excellence Award | $200 USDC | Contribution + standout final project (Zaal + ZOR vote) | 3–5 participants |
| 4 — Community Vote | People's Choice | $150 USDC | Voted by cohort members (1 Builder + 1 Musician) | 2 recipients |

**Total budget estimate:** 15 × $50 + 7 × $50 additional (Tier 2 diff) + 4 × $100 additional (Tier 3 diff) + 2 × $150 = **$1,450–$2,050 USDC**

This falls within the $1,500 ZABAL micro-grants budget line in Fisher grant application (doc 1509).

### Minimum Completion Criteria (Tier 1)
**Builder track:**
- Attended ≥10 of 12 scheduled workshop sessions (Juke/Telegram)
- Shipped ≥1 artifact (GitHub PR, deployed tool, demo video, or design spec)
- Submitted ≥1 ZAOOS research doc

**Musician track:**
- Attended ≥10 of 12 sessions
- Participated in ≥1 WaveWarZ battle (any type)
- Submitted ≥1 ZAOOS research doc OR posted ≥1 Audius/SoundCloud track

**Data collection:** ZOE pulls attendance from Telegram session logs and Juke analytics by Nov 18 (3 days before graduation). ZOE checks ZAOOS GitHub PRs authored by each participant. Zaal reviews and finalizes list Nov 19.

---

## Final Project (Tier 3 Evaluation)

Each Tier 2 participant (completion + 2 ZAOOS docs) submits a final project for Tier 3 consideration.

**Final project formats:**
- Builder: Working demo or deployed tool (GitHub link + 3-min video walkthrough)
- Musician: 1 completed WaveWarZ MAIN battle + track on Audius + 1-paragraph reflection
- Both tracks: ZAOOS doc (doc 1555 or related) summarizing what they built/learned

**Evaluation process:**
1. ZOE collects final project submissions Nov 14–20 (Telegram + Google Form)
2. Zaal reviews all submissions by Nov 20 (1 evening, ~20 submissions)
3. ZOR holder vote on Excellence Award recipients at Nov 20 Thursday governance session (use Fractal Democracy format — top 3 nominated, ZOR holders select final 3)
4. Excellence Award announced at Nov 21 graduation

---

## People's Choice Award (Cohort Vote)

Cohort members vote for 2 peers (1 Builder, 1 Musician) who made the biggest impact on the group.

**Voting mechanism:** ZOE posts a Telegram poll Nov 19 (24-hour open window). Each cohort member can vote for 1 Builder and 1 Musician peer. Most votes wins. ZOE tallies and announces Nov 21.

**Why cohort-voted matters:**
> "People's Choice award is voted by ZABAL S2 participants themselves — the community chose who demonstrated the most impact to their peers."

This is citable in press and grant applications as peer-reviewed recognition.

---

## Funding Mechanics

**Payment method:** USDC on Solana (via WaveWarZ wallet infrastructure Hurricane maintains)

**Why Solana USDC:**
- Hurricane already manages Solana wallet infrastructure for WaveWarZ payouts
- Participants who went through ZABAL are comfortable with crypto wallets (ZABAL requirement)
- USDC = stable, no volatility risk for recipients

**Payment flow:**
1. Zaal confirms final recipient list Nov 20
2. ZOE sends Telegram DM to each recipient: "Congratulations — please send your Solana wallet address for your ZABAL S2 award by Nov 21 12PM"
3. Hurricane processes batch payment Nov 21 after graduation event
4. Each payment tx hash → ZOE archives in graduation ZAOOS doc (new doc created Nov 21)
5. ZOE posts @wavewarz X: "ZABAL S2 graduation — [N] participants received USDC awards on-chain. Builders and musicians who completed ZAO's 12-week program. [total amount] USDC distributed."

**Alternative if Fisher Fund not confirmed:** ZABAL token ($ZABAL on Base, ERC-20) or ZAOOS credit only. Confirm funding source by Aug 15. If Fisher denied by Aug 25 → pivot to ZABAL token awards (same tiers, ZABAL amounts TBD with Zaal).

---

## Grant Language (Post-Confirmation)

### Fisher Grant Application Block
> "ZAO will distribute $1,500 in micro-grants to ZABAL Season 2 graduates. Awards range from $50 (program completion) to $200 (Excellence Award, voted by ZOR governance session). Grants are paid in USDC on Solana — directly to participants' wallets, on-chain, within 24 hours of the Nov 21 graduation event. All transactions will be publicly verifiable."

### OP RF Evidence Block (Post-Graduation)
> "ZABAL S2 distributed $[amount] to [N] participants via on-chain USDC transfers on Nov 21, 2026. Solana tx hashes: [ZOE inserts]. Funded by Fisher Community Fund (Maine arts organization). All participants earned access through an open competitive application process (Aug 1–22, 2026)."

---

## ZOE Timeline (Micro-Grant Administration)

| Date | ZOE Action |
|---|---|
| Aug 15 | Add Fisher grant confirmation status to this doc |
| Sep 1 | Post ZABAL S2 cohort announcement — mention graduation awards in onboarding materials |
| Nov 1 | Telegram reminder to cohort: "Graduation and awards on Nov 21 — complete your final project by Nov 14" |
| Nov 14–20 | Collect final project submissions via Google Form + Telegram |
| Nov 18 | Pull attendance data from Juke/Telegram logs; compile Tier 1 eligibility list |
| Nov 19 | Post People's Choice poll in Telegram (24-hour window) |
| Nov 20 | Send draft recipient list to Zaal for review; prep wallet address request DMs |
| Nov 20 (Thursday) | Excellence Award nominees voted at ZOR governance session |
| Nov 21 AM | ZOE DMs all recipients for Solana wallet addresses |
| Nov 21 (graduation) | Hurricane processes payments during or immediately after graduation event |
| Nov 21 PM | ZOE posts graduation + award announcement to X, Telegram, Farcaster |
| Nov 22 | ZOE creates graduation ZAOOS doc with all tx hashes + recipient counts |

---

## Tracking Table

| Participant | Track | Tier Achieved | Award Amount | Wallet Confirmed? | Tx Hash |
|---|---|---|---|---|---|
| [ZOE fills from Nov 18 eligibility pull] | | | | | |

ZOE fills this table by Nov 20. Zaal reviews and approves before payments go out.

---

## Related Docs

- 1528 — ZABAL S2 Workshop Calendar (graduation Nov 21 = anchor date for this doc)
- 1455 — Fisher Community Grant (funding source — confirm Aug 15)
- 1509 — Fractured Atlas Application (FA = prerequisite for Fisher)
- 1460 — Nouns Micro-Grants Research (background on micro-grant design patterns)
- 1501 — ZABAL S1 August Finals Brief (S1 had no formal awards — S2 fixes this)
- 1543 — ZABAL S2 Mentor Roster (mentors = judges for Excellence Award context)
- 1547 — ZAO Revenue Model (micro-grants as revenue use allocation)
