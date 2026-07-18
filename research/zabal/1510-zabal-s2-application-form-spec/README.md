# 1510 — ZABAL S2 Application Form Spec (Build Before Aug 1)

**Type:** ACTION-SPEC  
**Topic:** ZABAL  
**Status:** BUILD BY AUG 1 — Application opens Aug 1. This spec defines the form questions, eligibility gates, and ZOE evaluation workflow.

---

## Background

ZABAL Season 2 opens applications on **August 1, 2026**. The application form must be live before the Aug 1 announcement. Applications close **August 22**. Cohort starts **September 1**.

S1 had 32 participants from an informal invite process. S2 targets 20-30 participants with a structured, public application so it is:
- Citable in grant applications (MAC, Fisher, OP RF — "open application process")
- Documentable (each applicant consents to public participation data)
- ZOE-evaluable (structured enough that ZOE can do first-pass scoring)

---

## Recommended Form Platform

**Typeform** (free tier supports up to 10 questions and 100 responses/month) or **Tally.so** (free, unlimited — recommended).

Form URL pattern: `tally.so/r/zabal-s2` or a custom URL after connecting to wavewarz.info

---

## Application Form Questions

### Section 1: Identity (Required)

**Q1. Name (First + Last)**  
*Text field*

**Q2. Email Address**  
*Email field — used for cohort communication*

**Q3. Discord or Telegram handle (at least one)**  
*Text field — primary community channel*

**Q4. Are you a musician, builder, or both?**  
*Multiple choice (select all that apply):*
- Musician / artist / performer
- Builder / developer / designer
- Writer / content creator
- Community organizer
- Other: [fill in]

---

### Section 2: Background (Required)

**Q5. Tell us what you're building or creating right now. (50–200 words)**  
*Long text — this is the most important answer. ZOE scores 0-5.*

Scoring rubric (ZOE reference):
- 5: Active project, specific output named (song, repo, community)
- 4: Clear direction, some concrete detail
- 3: Idea stage, some specificity
- 2: Vague but shows motivation
- 1: No current project
- 0: Non-answer

**Q6. Have you worked with blockchain or web3 tools before?**  
*Multiple choice (select all that apply):*
- Yes — I own or use a crypto wallet
- Yes — I've minted an NFT
- Yes — I've used a DAO voting platform
- Yes — I've built or deployed a smart contract
- No — but I'm curious to learn
- No — and I'm not sure I'm interested

*Note: "No" answers do not disqualify. ZABAL is designed for beginners.*

**Q7. What would you want to build or release during ZABAL S2? (2–5 sentences)**  
*Long text — evaluates ambition and clarity*

---

### Section 3: ZABAL Fit (Required)

**Q8. Why ZABAL specifically? What do you hope to learn that you can't find elsewhere? (2–5 sentences)**  
*Long text — evaluates self-selection accuracy*

**Q9. ZABAL S2 runs 10 weeks (Sep 1 – Nov 7, 2026) with a weekly 1-hour session. Can you commit to that schedule?**  
*Multiple choice:*
- Yes — I can commit to 90%+ attendance (9/10 sessions)
- Mostly — I might miss 2-3 sessions due to [time zone / work schedule]
- I'm not sure yet — I'd need to see the exact schedule
- No — the timing doesn't work for me this season

**Q10. Are you based in or connected to Maine (or the Maine diaspora)?**  
*Multiple choice:*
- Yes — I live in Maine
- Yes — I grew up in Maine or have strong Maine ties
- No — but I'm connected to ZAO/WaveWarZ community
- No — I found ZABAL through another channel

*Note: Maine-based applicants may receive priority for the ZAOstock tie-in track and certain micro-grants.*

---

### Section 4: Optional Enrichment

**Q11. Link to your work (optional)**  
*URL field — GitHub, SoundCloud, personal site, social handle, Audius, etc.*

**Q12. Any access needs we should know about? (optional)**  
*Long text — timezone constraints, language preferences, disability access, internet limitations*

**Q13. How did you hear about ZABAL? (optional)**  
*Multiple choice:*
- WaveWarZ platform
- @wavewarz or @bettercallzaal on X
- Farcaster (/wavewarz)
- ZAO Telegram community
- ZABAL alumni referral
- Word of mouth
- Other

---

## Eligibility Gates (Hard Filters)

Before ZOE scores applications, filter out any that fail:
1. **No Discord or Telegram handle provided** — cannot participate in cohort
2. **"No" to schedule commitment AND "No — the timing doesn't work"** — waitlist only
3. **Blank answer to Q5 or Q7** — auto-reject (application incomplete)

---

## ZOE Evaluation Workflow

**Day of close (Aug 22):**
1. ZOE exports all Tally responses as CSV
2. Apply hard filters — remove ineligible
3. Score each eligible application on Q5 (0–5) + Q7 (0–5) = 0–10 total
4. Sort by score descending
5. Flag top 25 for Zaal review
6. Flag any Maine-based applicants in top 35 (priority track)
7. Send Zaal the sorted table with 1-line applicant summaries

**Zaal review (Aug 23–25):**
- Select 20–30 participants from flagged set
- Check for diversity: musician/builder mix, geography, experience level

**Acceptance emails (Aug 26):**
- ZOE sends acceptance email to selected cohort (template below)
- ZOE sends waitlist email to 5–10 runners-up

---

## Acceptance Email Template

**Subject:** You're in — ZABAL Season 2 starts September 1

**Body:**
```
Hi [NAME],

You've been accepted to ZABAL Season 2.

ZABAL is a 10-week learning cohort for musicians and builders working at the intersection of music, community, and web3. Season 2 runs September 1 through November 7, 2026, with weekly 1-hour sessions.

Here's what to do now:

1. Join the ZABAL Telegram group: [link]
2. Fill out this quick onboarding form: [link] (takes 3 minutes)
3. Block your calendar: Thursdays at [TIME] for 10 weeks

Your first session is September 1. We'll send a reminder 48 hours before.

Questions? Reply to this email or DM @bettercallzaal.

See you September 1.

— Zaal Panthaki
ZAO / ZABAL
```

---

## Waitlist Email Template

**Subject:** ZABAL Season 2 — you're on the waitlist

**Body:**
```
Hi [NAME],

Thank you for applying to ZABAL Season 2. The cohort filled quickly and we couldn't offer you a spot — but you're on the waitlist.

If a spot opens before September 1, you'll hear from us first. And ZABAL Season 3 will open applications in early 2027 — we'll reach out when registration opens.

DM @bettercallzaal on X or Telegram with any questions.

— ZAO
```

---

## Form Build Checklist

- [ ] Create Tally.so account (or confirm existing account)
- [ ] Build form using questions above in exact order
- [ ] Set form to collect email addresses (enables ZOE email automation)
- [ ] Add ZABAL/ZAO logo as form header image
- [ ] Set open date: August 1, 2026 (or publish early, share link Aug 1)
- [ ] Set close date: August 22, 2026
- [ ] Test form with a dummy submission
- [ ] Copy form URL
- [ ] Add URL to doc 1457 (ZABAL S2 recruitment outreach)
- [ ] Add URL to doc 1492 (ZABAL S2 announcement post)
- [ ] Add URL to doc 1497 (Newsletter Issue 1 preview section)
- [ ] Add URL to doc 1467 (Newsletter Issue 2 — "applications open" line)
- [ ] Add URL to doc 1504 (Mirror article closing CTA)
- [ ] Send URL to ZOE for scheduling the Aug 1 announcement

---

## Citable Outcomes Post-S2

After ZABAL S2 closes:
- "ZABAL S2 received [N] applications, accepted [N] participants through an open competitive process"
- Citable in MAC grant (S3), Fisher grant renewal, OP RF Round 2
- "ZABAL has graduated [N total] participants across 2 seasons"

---

## Related Docs

- 1457 — ZABAL S2 Recruitment Outreach Pack (channels to post application link)
- 1492 — ZABAL S2 Announcement Post Pack (Aug 1 social posts)
- 1501 — ZABAL S1 August Finals Brief (S1 graduation data for citable quote)
- 1419 — ZABAL S2 Curriculum Outline (what participants will learn)
- 1436 — Fisher Grant Application (ZABAL micro-grants = Fisher use-of-funds)
- 1470 — OP RF Submission (ZABAL = evidence of education/community work)
