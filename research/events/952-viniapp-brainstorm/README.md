---
topic: events
type: recap
status: research-complete
last-validated: 2026-07-05
original-query: "meeting recap: Viniapp brainstorm (2026-06-29)"
tier: DEEP
meeting-date: 2026-06-29
platform: "recording (mp4, local mlx-whisper) - RE-TRANSCRIBED 2026-07-05"
attendees: "Zaal, Chris (useicm.com)"
---

# 952 - Viniapp brainstorm (Zaal x Chris, 2026-06-29) - DEEP

> **RECOVERY NOTE:** the 2026-07-03 transcription hit a whisper "yeah yeah" hallucination loop and lost ~90% of a 29-minute call; the earlier recap was written off ~2 usable minutes and was mostly inference. **Re-transcribed 2026-07-05** (mlx-whisper turbo, `--condition-on-previous-text False --hallucination-silence-threshold 2`), recovering the full conversation (~6,000 words). This recap replaces the old one and is grounded in the real transcript.

> **Goal:** Chris walks Zaal through **useicm.com** (his composable-context tool for Claude) and how it plugs into **Viniapp / Vinny Build** - a Farcaster-native onramp that scaffolds beginners into building for ZABAL Games; plus Chris agreeing to mentor the August ZABAL Games cohort.

## Attendees

- **Zaal** - ZAO founder.
- **Chris** - web3 developer/educator, creator of **useicm.com** (ICM = "identifier context [mail/mgmt]", line 178 - last word not fully audible). Named at line 404. (Likely Chris Dolinsky, per cross-reference in doc 950; not stated in this transcript.)

## Decisions / commitments

| Decision | Owner | Line | Anchor |
|----------|-------|------|--------|
| Chris will be a **ZAO mentor for August ZABAL Games** - pick an open-submission builder and pair with them | Chris | 318-329 | "I would love for you to be a Zao mentor for the August month... pick someone that open submitted and kind of be a teammate" |
| Chris shares his **mentor evaluation metrics** so Zaal can publish them as submission criteria | Chris | 327-329 | "sharing a few of the things you would be looking at... so I can add it as metrics for people to look at" |
| Zaal builds a **ZABAL Games ICM context box** (+ per-project boxes) and pairs it with Viniapp | Zaal | 359-365 | "I'll create an ICM for the Zabal game specifically... take that with Vinny app" |
| **Phase-1 = manual, low-friction submission** (timeline tags) for the first ~2 weeks; GitHub integration is Phase 2 | Zaal | 392-402 | "the first two weeks... your first submission can be just tags on the timeline"; "gives me the first two weeks to build out the GitHub integration" |
| Schedule a **longer Space** to plan ICM + Viniapp + the mentor framework | Both | 306-312 | "I think we should have a longer conversation about this" |

## Action items

| Action | Owner | Due | Line |
|--------|-------|-----|------|
| Try useicm.com tonight + report back | Chris | this week | 252, 311-312 |
| Draft a summary of the Viniapp brainstorm | Chris | this week | 307 |
| Share mentor evaluation criteria | Chris | ~2 weeks | 327-329 |
| Build Viniapp GitHub integration | Zaal | after week 2 | 400-402 |
| Create ICM boxes for ZABAL Games + applicable ZAO projects | Zaal | before v1 | 359-365 |
| Provide Chris's integration block (title/desc/prompt/logo/API) for Viniapp | Chris | TBD | 335-345 |

## Viniapp product design (as actually discussed)

**Decided:**
- **Two tiers:** **Vinny Build** (help a beginner ship their first app, lines 6-10) -> **higher-fidelity apps** ("daily driver" or competition-grade, lines 8-10).
- **"What should you build?" quiz:** 3 automated questions (automated because it's a Farcaster mini app - no manual prompting), output = a few things to build + applicable ZAO projects + workshops to watch (lines 15-17).
- **ZABAL token rewards** for leveling up / completing challenges (transcript: "zibal tokens", lines 20, 346; = **ZABAL tokens**, NOT ZOL). The hook: "I tried this out and got my personalized xyz" drives Farcaster energy (lines 19-22).
- **Farcaster-native** mini app, not an iframe (lines 16-17).
- **Ideas + Integrations UI:** partners contribute an integration block (title, description, AI builder prompt, logo, docs URL, API key) that becomes a learning module (lines 334-345; Kenny has an existing one, 336).
- **Viniapp submission = ZABAL Games submission** (line 346).

**Fuzzy / undecided:** the exact 3 quiz questions + how answers map to paths; token economics (trigger, amount, cap, who mints); the educational difficulty ramp (lines 24-40 is empathy, not spec); GitHub light-verification via temporary bio change (lines 348-358, likely deferred).

## Strategic through-lines

1. **Web3 "walled garden" onramp (lines 410-424).** Zaal frames Viniapp + ZABAL Games as the on-ramp across the wall - prove the tech works at the beginner tier to build momentum, then invite people in. Risk: retention cliff between beginner and higher-fidelity, and the constant re-marketing tax (lines 67-74).
2. **"Context, not agents" (Chris's thesis, lines 159-207).** Optimize for composable context you can vector-search into any LLM, not rigid agents. useicm.com is the realization (each project = its own context box). Direct implication for Viniapp: learners need composable learning contexts (quiz result + workshop + template + integration prompt), not "a Viniapp agent."
3. **Coordination / handoff problem (lines 82-108).** Chris: solo work is easy, collaboration is hard; he's experimenting with bot-to-bot + knowledge-graph handoffs (Nicky Sap). Viniapp's beginner->higher-fidelity jump is exactly where handoff/mentorship is needed; ICM + the August mentor model is the manual version.
4. **Ship the Excel sheet first (lines 379-402).** Chris's car-company anecdote: a spreadsheet beat custom software because it shipped. Applied: Viniapp v1 = manual submission, validate demand before building the GitHub integration.

## People / tools / projects (verified in transcript)

useicm.com / ICM (Chris's context tool, 129, 178), Nicky Sap (Chris's dev collaborator, 90-94), Kenny (has a Viniapp integration, 336), Luciano (Saturday Farcaster-alignment convo, 425), Bonfire (knowledge-graph tool, "still building", 437-464), Aware AI + API now.fun (Chris's other ICM boxes, 289-290), ZABAL Games (3-month build-a-thon; Chris mentors August cohort), Farcaster (mini-app surface).

## Opportunities + what v1 needs

- **Context-as-a-service:** Zaal publishes ICM boxes per ZAO project; learners import via URL into Claude Code (kills per-collaborator onboarding).
- **Mentor-as-traction:** Chris's August mentorship validates the two-tier progression + yields the evaluation metrics that feed the quiz.
- **v1 must-haves:** the 3-question quiz + branching + path mapping; the Ideas/Integrations UI surfaced in the frontend; ZABAL Games + project ICM boxes; a manual submission flow (Telegram command or form); the published mentor criteria.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Correct anywhere the old recap's inferred detail was cited (shipped = superseded by this doc) | Claude | Doc | 2026-07-05 |
| Draft the 3 "what should you build" questions + path mapping (shipped = quiz spec committed) | Zaal | Doc/PR | 2026-08-01 |
| Create ZABAL Games + top-project ICM boxes on useicm.com (shipped = boxes live) | Zaal | Task | 2026-08-01 |
| Confirm Chris's mentor evaluation metrics + publish as submission criteria (shipped = criteria posted) | Zaal + Chris | Task | 2026-08-01 |

## Sources

- [FULL] Re-transcribed recording (mlx-whisper turbo, anti-hallucination flags), `transcript.md` in this folder - 2026-07-05, ~6,000 words, verified loop-free.
- Cross-ref: doc 950 (Ohnahji strat sesh) names "Chris Dolinsky / Vinny app / ICM".
- Method note: the prior 2026-07-03 recap is superseded - it was written off a corrupted (~90% lost) transcript. Token name corrected ZOL -> ZABAL against transcript line 20.
