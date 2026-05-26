---
topic: community
type: guide
status: research-complete
last-validated: 2026-05-26
related-docs: "758, 758a, 758b, 758c, 758d, 720"
original-query: "ZABAL Games mentor handbook (1-pager) - what do YC/Techstars/Antler/AngelPad/ETHGlobal/MetaCartel ship? Recruiting asset + reduces DM burden. 8 mentors confirmed, 3-month June-Aug 2026 build-a-thon"
tier: STANDARD
---

# 758e - Mentor handbook patterns (for ZABAL Games)

> **Goal:** Document what canonical accelerator mentor handbooks contain. Provide the STRUCTURE for a ZABAL Games handbook, not the content - specific compensation / cadence / dates must come from Zaal, not from this doc.

## FABRICATION CORRECTION (2026-05-26)

An earlier version of this doc contained fabricated specifics (USDC honorarium amount, ETH Champion-pool size, hour/week commitment, week count, kickoff date, monthly group call cadence, NDA-at-intake) that were never confirmed by Zaal. The fabrications originated in the sub-agent prompt context block (which the parent wrote), got laundered through the agent output, and landed in this doc as if they were Zaal's priors. They have been stripped. See `feedback_no_sub_agent_context_fabrication` in memory for the root-cause rule.

The PATTERN research below (Techstars / YC / Antler / ETHGlobal / FAST / IPAS analysis) is FULL-sourced and stays. The OUTLINE has been reduced to section names + placeholders; ALL specific numbers, dates, and cadences in any future handbook must come from Zaal, not from this doc.

## What is actually confirmed by Zaal (only these are safe to use)

- ZABAL Games = build-a-thon, June through August 2026, "3 months"
- 8 mentors confirmed (Tyler Stambaugh, Arthur, kmac.eth, Jordan Oram, CannonJones, Shriyash Soni, yerbearzerker, deez)
- 8 finalists (count, not selected as of 2026-05-26)
- Mentor mechanics decided (Q1-Q6 from 2026-05-26 - see `project_zabal_games.md` memory or doc 758e's source thread): claim via Telegram /claim bot in private mentor channel, submissions via FC + TG feed + /submissions page, mentor coordination in Telegram group, handbook to ship before mentor commitments, Hats Protocol Champion NFT for Top-3 mentors (manual mint path), conflict resolution = builder picks with 24h FCFS fallback
- ZAO operates as INCUBATOR; builders own their projects; mentors advise

That's it. Everything else (USDC amount, ETH amount, time-commitment hours, week count, weekly/monthly cadence, kickoff date, NDA requirements, intake form fields) is UNCONFIRMED.

## Key Decisions (patterns only, no specifics)

| # | Decision | Why |
|---|----------|-----|
| 1 | **TARGET 1 page web doc** | Techstars Mentor Manifesto = 1 page; YC = none; FAST = 3 pages; >5 pages = not read pre-commitment |
| 2 | **LEAD with culture, not legal** - 80% culture signal / 20% legal | Recruiting asset first, contract second |
| 3 | **PUBLISH compensation transparently** (whatever Zaal sets) - on-chain rewards are public anyway | Transparency = recruiting asset, not weakness. BUT amounts must come from Zaal, not from this doc. |
| 4 | **REQUIRE pre-program conflict-of-interest intake** (not post-hoc disclosure) | Antler / IPAS pattern: flag conflicts at matching time, not during program |
| 5 | **DECISION RIGHTS clause: builders are the boss; mentors advise** | Inverts traditional accelerator power dynamics; matches ZAO's principle that founders own projects (Zaal-confirmed) |
| 6 | **CODE-OF-CONDUCT focuses on "no-asshole" + confidentiality + no-poaching** | Skip harassment policy (TG-gated 8-person group); poaching is the realistic risk |
| 7 | **NO NDA in the handbook itself** - the handbook is recruiting copy; any NDA decision is separate and pending Zaal | Don't conflate. Don't ship "NDA at intake" as if Zaal approved it - he didn't. |

## Findings

### Reference handbooks landscape

| Program | Handbook | Length | Compensation | Notable |
|---------|----------|--------|--------------|---------|
| **Techstars** | Mentor Manifesto (Cohen + Feld 2011) | 1 page, 19 principles | Unpaid volunteers | The canonical short doc. Behavioral + Socratic |
| **YC** | None formal | n/a (1:1 office hours) | Unpaid (network access) | "Coaches not directive"; embedded in process |
| **Antler** | Founder Handbook + curated 1:1s | Heavier | Sponsors meals/coworking | Residential, curated matching |
| **FAST (Founder Institute)** | Standard Template | 3 pages | 0.25-1% equity, 2yr vest | Legal baseline for advisor equity |
| **ETHGlobal** | Rules + Code of Conduct | Sharp + short | Volunteer | Mentor stations + 24/7 Discord; harassment policy explicit |
| **MetaCartel** | "Mages" model (no formal handbook) | n/a | Permissioned membership | Post-hoc transparency around conflicts |
| **IPAS Japan** | 3-person mentor team (biz + IP + associate) | Heavier | Sponsored | Most sophisticated COI model: check pre-assignment |

### Failure modes other programs hit (don't repeat)

1. **Ambiguous time commitment** -> mentors ghost or over-commit
2. **Unwritten conflict rules** -> mentor invests in mentee / advises competitor / poaches founder
3. **IP/confidentiality leakage** -> mentors copy mentee ideas
4. **Mentor-to-mentor tension** -> no cadence or protocol for info-sharing
5. **Surprise compensation specifics** -> mentor signs up based on assumed comp, then real numbers don't match (this doc's prior version is itself a case study)

### ZABAL-specific advantage

You're not running a residential cohort or equity accelerator. 8 mentors / 8 finalists / 3 months (June-Aug 2026) / async Telegram / on-chain rewards (specifics TBD by Zaal) / builder autonomy. Founders own projects; mentors advise. This INVERTS traditional accelerator power dynamics and simplifies the handbook: it's not "what we demand of you" but "here's what great mentors do + here's what you're committing to."

### Compensation transparency principle (no specifics from this doc)

Most accelerator mentors are unpaid (Techstars, YC) or sponsored-in-kind (Antler). FAST publishes equity ranges publicly (0.25-1%). **For ZABAL: whatever compensation Zaal sets should be published in the handbook. Transparency is the recruiting hook. But this doc does not set the numbers - Zaal does.**

### Decision rights

Every program is explicit: builders decide, mentors advise. Techstars "Guide, don't control." YC "Partners are advisors, not operators." Antler "Coaches support, teams lead." ZABAL should be the clearest: builders own; mentors are optional input.

### Conflict of interest

Techstars / Antler: disclose at matching time. IPAS: written conflict-check forms pre-assignment. YC / FAST: embedded in advisor agreement ("No Conflicts"). MetaCartel: post-hoc transparency. **For ZABAL:** pre-program intake form recommended; specific clauses pending Zaal.

### Mentor-builder matching

ETHGlobal: pure self-serve. Antler: curated 1:1. Founder Institute: FCFS after 8 hours of intro calls. **ZABAL's /claim FCFS is the confirmed mechanism (Q1=A). Cadence of mentor calls is NOT yet confirmed.**

### The recruiting-asset angle

Great mentor handbook = 20% legal, 80% culture signal. ETHGlobal: "high-energy, zero-bs 48-hour sprint." YC: "access to 6000+ domain experts." A ZABAL hook could be along the lines of "Build with us, champion a winner, earn on-chain" - but the specific tagline is Zaal's call.

## Proposed handbook OUTLINE (section names only; ALL content pending Zaal)

These are the SECTIONS a great handbook covers. The CONTENT of each section must come from Zaal, not from this doc. Do not draft any section's content using this doc as the source of specific numbers, dates, or cadences.

1. **Welcome + Program Mission** - frame ZABAL Games. (Confirmed inputs: 3-month, June-August 2026, 8 mentors, 8 finalists, builder autonomy.)
2. **Your Role as Mentor** - advise vs operate. (Standard pattern, safe to draft from Techstars Manifesto + ZAO incubator language.)
3. **Time Commitment + Cadence** - hours/week, 1:1 cadence, group call cadence. **All specifics TBD by Zaal. Do not invent numbers.**
4. **Compensation** - honorarium amount, Champion pool size + split rule, payment timing, NFT mint mechanics. **ALL TBD by Zaal. Do not invent numbers.**
5. **Confidentiality + IP** - what's private, what's public, whether NDA is required. **NDA decision TBD by Zaal.**
6. **Conflict of Interest Disclosure** - what mentors must flag, when. (Recommended categories: investing in competitor, hiring from team, financial stake in protocol, anticipated conflicts. Cutoff dates TBD by Zaal.)
7. **Decision Rights + Boundaries** - builders own, mentors advise. (Safe to draft.)
8. **Mentor-to-Mentor Cadence** - if any. (Pending Q3 + Zaal's call on whether there IS a recurring mentor call.)
9. **Code of Conduct** - Socratic / responsive / direct / empathetic; don't ghost / patronize / gatekeep / poach. (Safe to draft from pattern.)
10. **If Things Go Sideways** - escalation path. (Pattern safe; specific contacts TBD.)
11. **Post-Finals + Champion Minting** - vote mechanism, mint cadence. (Mechanism per Q5=C manual mint confirmed; specifics TBD.)
12. **How to Get Started** - intake form fields, /submissions page review timeline, /claim mechanism, first-call schedule. **Dates + form fields TBD by Zaal.**

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set compensation specifics (USDC amount, ETH pool size, split rule, payment timing) | @Zaal | decision | before drafting handbook |
| Set time commitment specifics (hr/week, 1:1 cadence, group call cadence if any) | @Zaal | decision | before drafting handbook |
| Set timeline specifics (kickoff date, /submissions page launch, intake-form deadline) | @Zaal | decision | before drafting handbook |
| Decide NDA-or-not for handbook + intake | @Zaal | decision | before drafting handbook |
| Confirm escalation contact (who do mentors message when things go sideways?) | @Zaal | decision | before drafting handbook |
| Draft 1-page handbook from outline using ZAAL-CONFIRMED specifics only | @Zaal or @Claude with explicit inputs | docs | post-decisions |
| Build /submissions page | @Zaal | PR (zabalgames.com) | TBD by Zaal |
| Spin up private mentor TG group; pin handbook | @Zaal | ops | TBD by Zaal |

## Also See

- Doc 758 (hub) - parent
- Doc 758c - Telegram /claim bot (the mechanical companion to this handbook)
- Doc 720 - ZAOstock standup May 19 (ZABAL Games initial commitment)
- Memory: project_zabal_games.md, feedback_no_sub_agent_context_fabrication (the rule this doc's prior version broke)

## Sources

- [FULL] Techstars Mentor Manifesto (Cohen + Feld) - https://davidgcohen.com/2011/08/28/the-mentor-manifesto/
- [FULL] Techstars Official Mentor Program Guide - https://www.techstars.com/blog/advice/mentor-manifesto
- [PARTIAL - YC focuses on ops not handbook] YC partner model - https://www.ycombinator.com/about
- [FULL] ETHGlobal Rules + Code of Conduct - https://ethglobal.com/rules
- [FULL] FAST (Founder/Advisor Standard Template) v2 - https://b6cloud.com/p/g3N2ajrfaROyGS86zyYQ
- [FULL] Antler Residency Structure + Mentor Matching - https://www.antler.co/residency
- [PARTIAL - investor DAO not mentor model] MetaCartel DAO - https://github.com/metacartel/MCV/wiki
- [FULL] Mentor Risk Management Guide (M Accelerator) - https://maccelerator.la/en/blog/entrepreneurship/mentorship-risk-management-guide/
- [FULL] Investment Accelerators Legal Study (Colorado Law) - https://lawweb.colorado.edu/profiles/pubpdfs/bernthal/Investment%20Accelerators(SJLBF%202016).pdf
- [FULL] IPAS Mentoring Team + Conflict Framework (Japan) - https://ipbase.go.jp/assets/pdf/achievement-e.pdf
- [FULL] Mentor Makers Code of Conduct (NASDAQ) - https://thecenter.nasdaq.org/mentor-makers/mentor-makers-code-of-conduct/
- [FULL] AngelPad Hands-On Mentorship - https://www.eaglerockcfo.com/blog/venture-capital-firms/angelpad-review
- [PARTIAL - advisor equity only] Startup Advisor Agreement (Promise Legal) - https://promise.legal/templates/advisor-agreement
