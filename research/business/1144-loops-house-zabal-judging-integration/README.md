---
title: "Loops House for ZABAL Games: Judging Infrastructure Research"
type: decision
tier: DEEP
status: research-complete
created: 2026-07-17
last-validated: 2026-07-17
related-docs: [631, 1120, 682, 681, 646]
original-query: "Deep research on Loops House as judging infrastructure for ZABAL Games. Prepare Zaal for Saturday 8 AM EST call with founder Rishikesh Kale about using Loops House for August finals judging. Two-way deal: ZAO gives Loops House a live cohort + real feedback; ZAO gets judging infra it doesn't have to build."
---

# 1144 - Loops House for ZABAL Games: Call Prep & Integration Assessment

## Executive Summary

**What Loops House Is:** An AI-native hackathon platform for the 2026 agentic era. Builders install the event into their IDE via `npx loopshouse add event-slug`, submit code directly from the terminal, and projects are judged by an AI system that analyzes "what was built" not "how it was pitched." The AI judge generates evidence-based reports with code citations, so builders can interrogate decisions ("Did they actually integrate our SDK?") and get specific code references back.

**Rishikesh Kale:** Blockchain developer, 6x web3 hackathon winner, Developer Advocate at Filecoin. Early builder in the web3 space with IPFS/blockchain expertise. Currently building Loops House as an AI-first judging/certification platform.

**The Offer to Zaal:** Two-way partnership - ZAO gets a production-grade judging system for ZABAL Games August finals (replacing manual judging), complete with evidence-based scoring + personalized feedback. In return, Loops House gets a live 8-person finalist cohort, real-world feedback on the platform, and a ZAO case study.

**ZABAL Games Context:** 3-month build-a-thon (June workshops / July open build / August finals with 8 finalists + 8 mentors). Current plan: finalists battle on-stream with manual judging from mentors. **The gap:** no automated judging infrastructure, no persistent evidence trail, no bulk feedback to non-winners. Loops House closes this gap + adds credibility (AI reports with code citations).

**Fit Assessment: STRONG (but conditional on timing + API transparency)**

---

## Part 1: What is Loops House

### Platform Overview

**Tagline:** "Build, launch, and evaluate projects" on an "evidence-first engine" where projects are judged on what was built, not how it was pitched.

**Three Core Offerings:**
1. **Hackathons** - AI-native events where sponsor docs become agents in your IDE
2. **Certify** - Builders complete 5 real projects on a sponsor's stack, earn co-branded credential
3. **Compete** - Build Battles: 5 projects in 10 hours every two weeks, live AI scoring + leaderboard

### The Hackathon Workflow (Key Feature for ZABAL)

**Three integrated components:**

#### 1. Skill (IDE Integration - The Claude Code Differentiator)
- Developers run `npx loopshouse add your-event-slug` to install the event directly into Cursor/Claude Code
- Sponsor information, bounties, and judging criteria load into coding agents as context
- Builders can ideate against actual bounty requirements without leaving the IDE
- **Submission:** Developers submit directly from terminal after building locally (no web form friction)

#### 2. Co-Pilot (In-Browser AI Agent)
- Sponsor documentation becomes a "knowledge graph powering an in-browser AI agent"
- Builders self-evaluate drafts before submission
- Access resources + ideate against bounty criteria in one place

#### 3. AI Judge (The Evidence-First Core)
- Projects receive **structured evaluations that are interrogatable**
- AI analyzes what was built vs what was pitched
- Checks SDK integrations against sponsor requirements
- **Key differentiator: provides code references back when questioned**
- Builders ask "Did they actually integrate our SDK?" and receive specific code citations
- Human reviewers confirm final winners (AI assessment complements, doesn't replace)

### Judge Output & Code Citations

**What the AI judge generates:**
- Evidence-based reports examining project against bounty criteria
- **Code citations:** When builders question a decision, the system returns specific code sections that informed the judgment
- Score breakdown by rubric dimension (execution, integration, design, etc.)
- Comparison to peer submissions (relative strength)

**User feedback:** "It gave participants one place to ideate, access resources, and submit projects, making judging much easier." Testimonial notes "the AI scoring feature is a fun way to compare projects alongside judge evaluations."

---

## Part 2: Rishikesh Kale - Founder Background

### Public Profile
- **Role:** Founder/CEO of Loops House
- **Background:** Blockchain developer, 6x web3 hackathon winner
- **Previous:** Developer Advocate at Filecoin (early builder in IPFS/web3 ecosystem)
- **Track Record:** Active in blockchain development; speakers on IPFS/web3 topics at IIT-Roorkee (2022+)
- **Location/Timezone:** IST (India Standard Time)

### Credibility Signals
1. **Web3 hackathon experience:** Won hackathons multiple times; understands builder friction + judging from competitor side
2. **Filecoin involvement:** Worked at a major infrastructure layer (shows enterprise + open-source experience)
3. **First-mover in agentic hackathons:** Loops House appears to be among the earliest platforms combining AI judging + Claude Code integration (2026 production launch)

### Likely Philosophy
- Evidence-first evaluation (vs vibes-based scoring)
- Builder experience is paramount (IDE integration, terminal submission)
- AI + human collaboration (AI does thoroughness, humans decide)

---

## Part 3: Competitive Landscape (Agentic Hackathon Platforms, 2026)

### Direct Competitors

| Platform | Core Feature | Judging Approach | Integration | Gaps vs Loops House |
|---|---|---|---|---|
| **Devfolio** | Hackathon discovery + hosting | Two-phase: agent code inspection + human rubric | Web form submission | Only scores winners; no bulk feedback; no IDE integration |
| **Submittable** | Grant/awards/submission mgmt | Configurable workflows, blind review, weighted rubrics, auto-scoring | Web form + email | Enterprise-only pricing ($2.5K-$10K/yr); no AI feedback generation; not hackathon-specific |
| **Sopact** | Grant evaluation | AI rubric scoring with citations to source text | Web form | No feedback loop for failed applicants; limited to text evaluation |
| **Devpost** | Hackathon discovery + hosting | Manual judging + voting | Web form + GitHub integration | Manual + slow; no AI judge; no evidence trail |
| **MLH (Major League Hacking)** | Hackathon logistics | Manual judge assignment + voting | Web + on-site | Designed for in-person events; manual judging bottleneck |

### Market Gap Loops House Fills
- **Evidence-first + code citations:** Other tools focus on ranking winners. Loops House provides interrogatable, code-cited decisions.
- **IDE-native submission:** No other platform integrates Claude Code skill for direct terminal submission.
- **AI + human balance:** AI does thoroughness; humans confirm. Most competitors are either all-manual or all-automated.
- **Bulk feedback potential:** While Loops House doesn't explicitly advertise personalized feedback for non-winners, the infrastructure (AI judge + evidence citations) enables it—unlike competitors.

### Landscape Positioning
- **Agentic AI hackathons trending in 2026:** MIT CSAIL, Google GDG, SETA International, Microsoft all running agentic-AI specific hackathons
- **"Agent-as-a-Judge" research emerging:** 100+ papers on using agents to evaluate other agents (evaluates reasoning trajectory, not just output)
- **No commercial tool dominates yet:** Devfolio + Devpost are incumbent (manual + slow); Loops House is first to combine AI + IDE integration + evidence-based scoring

---

## Part 4: ZABAL Games Context (Why Loops House Matters Now)

### Current ZABAL Games Structure (Doc 681-682)

| Phase | Timeline | What | Current Judging |
|---|---|---|---|
| **Workshops** | June | 30-min volunteer-led sessions; recorded for YouTube | N/A |
| **Open Build** | July | Anyone builds; anyone submits on Magnetiq | N/A (self-selection) |
| **Finals** | August | 8 finalists + 8 mentors; on-stream battles; winner announced | Manual: mentors score live on subjective criteria |

**August Finals Judging Reality:**
- 8 mentors, 8 finalists
- On-stream evaluation (live audience + commentary)
- No formal rubric, no persistent scoring trail
- No feedback to non-winners
- Subjective mentor decisions (no code-citation justification)

### ZAO's Existing Judging Infrastructure (Docs 631, 1120)

**Doc 631 - Sentinel + POIDH Bounty System:**
- Autonomous bounty evaluation bot with 3-stage evaluator (deterministic + OCR + vision AI + LLM verdict)
- Built for POIDH bounty rounds (7-12 submissions, 2-3 hours manual judging per round by Zaal)
- Can auto-judge, auto-pick winners, auto-announce
- **Gap:** Designed for small, fast bounties. Not suitable for deep project evaluation or multi-month cohorts.

**Doc 1120 - Fable-Powered Evaluation Pipeline:**
- AI-powered submission + evaluation using Claude Fable 5
- Generates personalized feedback for ALL submitters (not just winners)
- Planned for Artizen Fund, POIDH, ZABAL Games cohorts
- Bulk feedback engine is the differentiator (retention, improvement focus)
- **Status:** Research-complete; not yet deployed. **Revenue opportunity identified: $499-$999/cohort**

### The ZABAL Games Judging Gap

| Current Gap | Loops House Solution |
|---|---|
| Manual mentor scoring on-stream (subjective, no trail) | AI judge + code citations + evidence trail |
| No structured rubric across judges | Loops House enforces rubric consistency via AI |
| No feedback to non-winners | AI judge can generate feedback; builders see why they scored X |
| No persistent scoring data (for sponsor validation) | Evidence-based reports persist + are queryable |
| Subjective on-stream decisions | AI pre-judges; mentors confirm (human-in-the-loop) |
| No IDE integration for builders | Claude Code skill allows direct submission from editor |
| Builder confidence in scoring (vibes-based) | Code citations + rubric breakdown = transparency |

---

## Part 5: The Two-Way Deal Analysis

### What ZAO Gives Loops House
1. **Live cohort for production validation** - 8 finalists is real data; non-trivial stakes (ZAOstock + ZABAL reputation)
2. **Real feedback on UX** - builders, mentors, streaming audience all provide signal on what works/breaks
3. **Case study for marketing** - "Loops House judged ZABAL Games (ZAO's 3-month buildathon for 188 members)" is credible social proof
4. **High-credential builders** - ZAO members are mostly web3 natives; their feedback is valuable for product iteration
5. **Potential for ongoing relationship** - Artizen Fund (doc 1120) + future POIDH rounds could use Loops House long-term

### What ZAO Gets from Loops House
1. **Judging infrastructure (not built)** - Replaces custom Sentinel/Fable deployment for ZABAL Games
2. **Evidence-based scoring** - Code citations + rubric breakdown replaces subjective mentor vibes
3. **Bulk feedback generation** - If Loops House does per-submission feedback, closes the gap Fable was planned to fill
4. **Credibility layer** - "Judged by Loops House AI (validated by mentors)" is stronger than "judged by mentors"
5. **Zero infrastructure cost** - No deploy, no maintenance, no bot wallet ETH float
6. **IDE integration already built** - Claude Code skill is production-ready; builders submit from editor

---

## Part 6: Technical Deep-Dive: Integration Shape for August Finals

### Scenario: ZABAL Games August Finals on Loops House

**Setup (June-July):**
1. Create Loops House event: `loops.house/zabal-games-august`
2. Upload sponsor docs: ZABAL Empire context, ZAO mission, builder frameworks (WaveWarZ, ZAOstock, music context)
3. Configure rubric: execution (25%), originality (25%), ZAO fit (20%), demo/presentation (20%), code quality (10%)
4. Add mentor FIDs for confirmation (final reviewer role)

**July - Open Build:**
- 30-50 builders submit projects during open-build month
- Builders optionally use Claude Code skill to ideate inside IDE

**August 1-8 - Evaluation Window:**
1. Finalists (8) submit via `npx loopshouse submit` from terminal
2. AI judge evaluates all 8 simultaneously in 2-3 minutes
3. Evidence-based reports generated: code citations, rubric breakdown, comparison to peers
4. Mentor review: 8 mentors see AI reports + code citations, confirm/override top 3
5. (Optional) Builder feedback: AI generates 1-paragraph feedback for non-finalists ("Your execution was solid (8/10) but ZAO fit unclear (5/10). Focus next round on how your project serves the ZAO ecosystem.")

**August 9 - Finals Stream:**
- Stream finalists live (as planned)
- Display AI judge report on overlay (rubric breakdown, code citations)
- Mentors announce winner (with AI backing instead of subjective gut feel)
- Credibility: "Loops House AI judge + ZAO mentor consensus"

**Output:**
- Persistent scoring trail (for Zaal's documentation)
- Evidence for sponsor validation (Neynar/FIL/ZAOstock partners)
- Bulk feedback (improves builder retention for next ZABAL cohort)
- Builder testimonials ("I could see exactly why I scored what; code citations made it real")

### Technical Questions Zaal Should Ask

1. **Data Isolation:** Does Loops House store our builder code? Can we request deletion post-event? (Privacy for competitive context)
2. **Rubric Customization:** Can we import a custom rubric (ZAO-specific dimensions) or are we locked to default?
3. **Judge Explainability:** When AI cites code, does it show the full function or just line numbers? Can we override citations?
4. **Feedback Generation:** Can AI generate personalized feedback for non-finalists, or only for winners?
5. **Mentor Confirmation Flow:** How do mentors override/confirm? Is there a UI, API, or Telegram integration?
6. **Timeline:** Can Loops House support a July open-build + August evaluation window, or is it geared for all-in-one weekends?
7. **Cost/Pricing:** Is there a per-finalist fee, per-event fee, or revenue share model?
8. **Export:** Can Zaal export all scoring data (for Zaal's own post-hoc analysis)?
9. **Claude Code Skill:** Is the `npx loopshouse add` skill production-ready for 50+ builders? What's the support model if it breaks?
10. **Sponsor Integration:** Can we embed Neynar/Farcaster identity so winners are auto-posted to FC?

---

## Part 7: Risks & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude Code skill breaks for >30 builders | Medium | Builders can't submit; August finals collapse | Ask Rishikesh: what's the largest cohort tested? Is there a web fallback? |
| AI judge over-weights code quality vs creative vision | Medium | WaveWarZ/music projects down-scored for "non-standard" code | Test rubric on 10 sample projects first; adjust weights before August |
| Code citations miss edge cases (e.g., no SDK integration detection) | Medium | False positive scores; mentors override AI findings | Require mentor confirmation; AI is evidence, not oracle |
| Loops House down on finals day | Low but critical | No judging infrastructure; live stream breaks | Fallback: manual mentor scoring + AI reports as async validation |

### Business/Partnership Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pricing surprise (e.g., $5K for 8 finalists) | Medium | Deal doesn't work; Zaal builds custom solution | Ask upfront: pricing model for 8 finalists + 50 open-build submissions |
| Loops House wants exclusive feature rights (e.g., "ZAO is our only music hackathon") | Low | ZAO loses flexibility for future partnerships | Clarify IP/exclusivity upfront; get it in writing |
| Rishikesh pitches ongoing service agreement instead of one-off event | Medium | Sales pressure; timeline confusion | Go in with clear ask: one August event + optional renewal for future |
| Loops House goes dark (startup risk) | Low but real | Judge infra vanishes; ZABAL Games stranded | Ask: funding status, team size, runway? Ensure data export before August. |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Builders unfamiliar with terminal submission (npx command) | Medium | 20% don't submit; requires support | Offer written guide + office-hours recording; test with 3 builders in July |
| Mentor flow unclear (how to confirm/override) | Medium | On-stream confusion about scoring | Run a full dry-run with 1-2 mentors + Rishikesh 1 week before |
| Rubric misaligned with ZAO brand (too technical) | Medium | Winners aren't representative of ZAO values | Co-design rubric with Zaal + 2 mentors; test on past ZABAL winners |

### Mitigation Summary
- **Saturday call:** Get pricing, timeline fit, mentor flow, skill stability, data export all confirmed
- **Test period:** Run Loops House on 5-10 sample projects (not finalists) in July; iterate rubric
- **Dry-run:** Full mentor + Loops House dry-run 1 week before finals
- **Fallback:** Manual mentor scoring remains the backup; Loops House is the upgrade

---

## Part 8: Comparison to Existing ZAO Solutions

### Sentinel (Doc 631) vs Loops House

| Dimension | Sentinel | Loops House |
|---|---|---|
| **Use Case** | Small bounties (7-12 submissions) | Large cohorts (50+ submissions) + finals |
| **Judge Type** | LLM deterministic + vision AI | LLM deterministic + code analysis |
| **Evidence Trail** | Vision scores, pre-score breakdown | Code citations, rubric breakdown |
| **Feedback** | Winner announcement only | Can do bulk feedback (TBD) |
| **Deployment** | Self-hosted (Vercel) | SaaS (Loops House) |
| **Cost** | $0/mo (free tier) + 0.05 ETH float | TBD per event |
| **IDE Integration** | Farcaster cast mention | Claude Code skill (npx) |
| **For ZABAL Games** | Overkill for 8 finalists; too bounty-focused | Perfect fit for August finals |

### Fable Evaluation Pipeline (Doc 1120) vs Loops House

| Dimension | Fable | Loops House |
|---|---|---|
| **Status** | Research-complete; not deployed | Production (2026 launch) |
| **Judge Type** | Claude Fable 5 multi-file context | LLM code inspector |
| **Bulk Feedback** | YES (core feature) - personalized per submitter | Possible but not advertised |
| **Cost** | $99-$999/cohort planned pricing | TBD |
| **IDE Integration** | None planned | Claude Code skill |
| **Code Citation** | No (text-only) | YES (code-focused) |
| **For ZABAL Games** | Strong fit for feedback + retention | Strong fit for evidence-based judging |
| **Overlap** | Yes - both solve ZABAL Games gap | Yes - both solve ZABAL Games gap |
| **Future State** | Could combine: Loops House judges (evidence) + Fable feedback (retention) | Could combine: same |

### Strategic Implication
Zaal can:
1. **Use Loops House for August finals** (evidence-based judging + code citations)
2. **Use Fable for post-event feedback** (bulk personalized feedback to all 50 open-build participants)
3. **Use Sentinel for future bounties** (small, fast POIDH-style rounds)

This gives ZAO a full judging stack without building it from scratch.

---

## Part 9: Top 5 Questions for Saturday's Call

### 1. **Pricing & Timeline**
"What's the cost structure for ZABAL Games? Per finalist? Per open-build submission? Is this a one-event fee or a monthly commitment? Can we do July open-build + August finals on one event, or does your system expect everything in 1-2 days?"

*Why it matters:* Deal viability depends on cost; timeline fit determines if Loops House works for ZABAL's 3-month structure.

---

### 2. **Mentor Confirmation Flow & On-Stream UX**
"Walk me through how the 8 mentors see the AI judge reports and confirm/override decisions. Is there a UI, Telegram bot, or live dashboard? And how does the scoring display on the finals stream—can we show the AI judge's rubric breakdown as an overlay while mentors announce the winner?"

*Why it matters:* On-stream credibility depends on mentor flow being smooth; transparency (showing AI reports) is the differentiator vs manual scoring.

---

### 3. **Claude Code Skill Stability & Support**
"The `npx loopshouse add` skill is production-ready for 50+ builders, right? What happens if the skill breaks during open-build? Is there a web fallback? And who supports builders that get stuck with the terminal submission—is that on Loops House or on ZAO?"

*Why it matters:* ZAO can't afford broken submissions for 50 builders in July; need clarity on support model + fallbacks.

---

### 4. **Code Citations & Judge Explainability**
"When your AI judge cites code, does it show the full function, specific lines, or just a reference? If a mentor disagrees with a code citation (e.g., 'That SDK integration isn't actually there'), can they override it? How interrogatable are the judge's decisions?"

*Why it matters:* ZAO's builders are sophisticated web3 devs; they'll ask hard questions about AI scoring. Need transparency + override capability.

---

### 5. **Feedback Beyond Winners & Data Export**
"Can your AI judge generate personalized feedback for non-finalists ('You scored 6/10 on execution, 4/10 on ZAO fit. Focus next round on...')? And can ZAO export all scoring data post-event for our own analysis and post-hoc validation?"

*Why it matters:* Feedback = builder retention; data export = ZAO owns the evidence trail. This is where Loops House unlocks real value vs manual scoring.

---

## Part 10: Call Prep Checklist

**Before Saturday 8 AM EST:**

- [ ] **Your setup:** Clear internet, calendar set for 8 AM EST (5 PM IST for Rishikesh on Saturday evening)
- [ ] **Shared context:** Send Rishikesh this doc + link to ZABAL Games announcement (zabalgamez.com or Magnetiq event)
- [ ] **Desired outcome:** "Explore Loops House for ZABAL Games August finals; understand fit + pricing; if aligned, plan a July test with 5-10 sample projects"
- [ ] **Fallback:** If Loops House doesn't fit (cost too high, timeline misaligned), ZAO builds on Sentinel + Fable

**After Call - Next Actions:**

| Action | Owner | By When | Notes |
|---|---|---|---|
| Confirm pricing + timeline fit | Zaal + Rishikesh | Monday 2026-07-21 | Get it in writing |
| Identify 5-10 sample projects for July test | Zaal | Wednesday 2026-07-23 | Use past ZABAL/ZAOstock projects |
| Dry-run with 2 mentors + Loops House | Zaal | Friday 2026-07-31 | Full submission + evaluation flow |
| Finalize August finals event details | Zaal + Rishikesh | Wednesday 2026-08-06 | Go-live checklist |
| Backup plan (Sentinel + Fable) ready if needed | ClaudeBot | Friday 2026-07-31 | Non-blocking; just in case |

---

## Part 11: Reference Context for Saturday

### ZABAL Games Basics (One-Pager for Rishikesh)
- **What:** 3-month mentored builder cohort / buildathon
- **Who:** ZAO members (188-person web3 music/culture DAO) + open applications
- **When:** June 2026 (workshops) → July (open build) → August (finals + streaming)
- **Where:** Magnetiq platform; streaming on ZAO channels
- **Why:** Re-energize ZAOstock (ZAO's October festival); build cool stuff on ZAOstock rails
- **Tracks:** ZAOstock, ZABAL, WaveWarZ, The ZAO (each has context prompt)
- **August Finals:** 8 finalists + 8 ZAO mentors; on-stream battles; winner gets ZABAL + community validation

### Key Contacts for Rishikesh
- **Zaal** (@zaal on Farcaster) - ZABAL Games curator, ZAO founder, web3 music focus
- **Tyler Stambaugh** (@tylerstambaugh on Farcaster) - Founder of Magnetiq (platform host); workshop lead
- **Kenny Francisco** (@kennxo on Farcaster) - ZABAL Empire architect; bounty framework designer

### Loops House Edge Cases to Cover
- **Music-specific projects:** Some finalists will ship audio/music. Does Loops House judge multimodal projects? (Fable excels here; Loops House unclear)
- **On-chain components:** Projects may include smart contracts (Solana, Base, Degen). Does Loops House have contract auditing?
- **Community/social validity:** Some projects are community tools (Discord bots, Farcaster frames). Can Loops House evaluate non-technical dimensions?

---

## Part 12: Sources & Validation

### Web Research Sources
- [Loops House Official Site](https://www.loops.house/)
- [Loops House Hackathon Workflow](https://www.loops.house/hackathonworkflow)
- Loops House testimonials & case studies (site)
- Web3 hackathon landscape 2026 (Devfolio, Devpost, SETA International, MIT CSAIL, Google GDG, Microsoft partnerships)
- "Agent-as-a-Judge" research trending (100+ papers 2024-2026)

### ZAO Internal Docs
- Doc 631 - POIDH x ZABAL x Sentinel convergence + best ideas
- Doc 1120 - Fable-powered submission pipeline business case (Tim Martinez meeting prep)
- Doc 682 - ZAOstock standup 2026-05-19
- Doc 681 - ZABAL Games research + workshop planning
- Doc 646 - ZABAL Games / Magnetiq cohort framework

### Founder Background Sources
- [Rishikesh Kale GitHub](https://github.com/rk-rishikesh)
- [Rishikesh Kale Devfolio](https://devfolio.co/@rk_rishikesh)
- [Rishikesh Kale Medium](https://medium.com/@rvk_rishikesh)
- [Rishikesh Kale LinkedIn](https://gb.linkedin.com/posts/rishikeshkale_delivered-a-talk-at-indian-institute-of-technology-activity-7019916012464582656-83Du)
- Filecoin Developer Advocate role (inferred from search results)

### Competitive Landscape Sources
- Devfolio blog post: "Push to Prod" hackathon 2026 (AI judging case study)
- Submittable pricing & features
- Sopact grant evaluation platform
- Devpost hackathon hosting
- MLH (Major League Hacking) platform

---

## Part 13: Appendix - Full Loops House Feature Breakdown

### The IDE Integration (What Makes Loops House Unique)

**Installation Flow:**
```bash
npx loopshouse add zabal-games-august
# Loads:
# - Event brief (ZABAL Games context)
# - Sponsor docs (ZAO mission, builder frameworks)
# - Rubric (execution, originality, fit, demo, code quality)
# - Judging criteria + constraints
# Into the builder's IDE (Cursor, Claude Code, VSCode)
```

**During Open Build:**
- Builders can ask the co-pilot (in-browser AI agent) about bounties
- Self-evaluate drafts against rubric before submitting
- Access resources without leaving IDE

**Submission:**
```bash
# In the terminal, after building locally:
npx loopshouse submit
# Compresses project, submits to Loops House
# Gets confirmation + scoring starts
```

### The AI Judge Architecture

**Execution:**
1. AI reads all submissions simultaneously (evidence-first engine)
2. Evaluates against rubric (deterministic scoring)
3. Analyzes code quality + SDK integration (code inspection)
4. Generates evidence-based report per submission
5. Produces leaderboard + comparison view

**Output per Submission:**
- Rubric breakdown (score per dimension)
- Code citations (specific functions/patterns analyzed)
- Peer comparison ("You scored 8/10; cohort median 6.5/10")
- Interrogatable decision trail ("Show me where you found the SDK integration")

**Mentors:**
- See AI report + code citations
- Can confirm or override
- Final decision is human-validated

### The Three Business Models

**1. Hackathons (ZABAL Games Context)**
- Event setup + open build period + finalist evaluation
- Pricing: TBD per event / per finalist
- Output: evidence-based scoring + potentially bulk feedback

**2. Certify (Not Relevant to ZABAL)**
- Builders complete 5 real projects on sponsor's stack over weeks
- Earn co-branded credential
- Ongoing evaluation

**3. Build Battles (Not Relevant to ZABAL)**
- 5 projects in 10 hours, every two weeks
- Live AI scoring + leaderboard movement
- Competitive

---

## Final Recommendation

**Decision:** Explore Loops House for ZABAL Games August finals as the primary judging infrastructure. If pricing is reasonable ($0-$5K range) and timeline fits (July open-build + August finals), integrate. If not, fallback to Sentinel + Fable hybrid.

**Rationale:**
1. **Evidence-first judgment** matches ZAO's transparency values
2. **Code citations** provide credibility to builders (vs subjective vibes)
3. **IDE integration** is a first-mover advantage; lowers friction for web3 devs
4. **No build cost** (Loops House handles infra)
5. **Complements existing stack** (Sentinel for bounties, Fable for feedback, Loops House for cohort judging)
6. **One-event commitment** (low risk; can iterate for future cohorts)

**Success Metrics (Post-August):**
- Finalists see Loops House scoring as fair + transparent (NPS / feedback survey)
- Code citations were actually used by mentors / on-stream narrative
- Loops House team gets 3+ testimonials + case study material for their product
- ZAO considers using Loops House for future Artizen Fund + ZABAL Games rounds

---

## Next Actions (Post-Call)

| # | Action | Owner | By When | Dependency |
|---|--------|-------|---------|-----------|
| 1 | Schedule Saturday 8 AM EST call with Rishikesh | Zaal | NOW | Confirm IST timezone for Rishikesh |
| 2 | Share ZABAL Games context + this doc with Rishikesh | Zaal | Friday 2026-07-18 | Prep for call |
| 3 | Confirm pricing + timeline fit post-call | Zaal | Monday 2026-07-21 | Call outcomes |
| 4 | Identify 5-10 sample projects from past ZABAL/ZAOstock | Zaal | Wednesday 2026-07-23 | Testing prep |
| 5 | Run dry-run test with Loops House + 2 mentors | Zaal | Friday 2026-07-31 | Confirmed deal + timeline |
| 6 | Finalize August finals event setup | Zaal + Rishikesh | Wednesday 2026-08-06 | Go-live 1 week before finals |
| 7 | Plan post-event feedback (Fable or Loops House?) | Zaal | After finalists selected | Feedback strategy |
| 8 | Prepare on-stream overlay (rubric + scores) | Zaal + streaming lead | Friday 2026-08-09 | Finals UX |

---

**Doc Status:** Ready for call prep. Update post-Saturday with outcomes.

**Questions for Future Iteration:**
- How does Loops House handle multimodal (audio/video) evaluation? (Fable 5 excels here)
- Can Loops House integrate Neynar/Farcaster for auto-posting winners?
- What's the data retention policy post-event?
- Can judges collaborate / comment on rubrically?
