---
title: "DreamLoops Capabilities, Critical Unlocks & Cross-Ecosystem Application"
type: strategy
topic: agents
status: research-complete
tier: STANDARD
created: 2026-07-14
last-validated: 2026-07-14
related-docs: ["1085-zol-dreamloops-persistent-agent-graft", "1084-github-spec-kit-spec-driven-dev", "994-loop-engineering-taxonomy", "928-agent-loop-best-practices", "601-agent-stack-cleanup-decision"]
original-query: "Brandon Ducar feedback - scan dreamloops framework, cross-ref ZOE/ZABAL/ZAO repo estate, find new capabilities + critical unlocks + new ideas, verdict on applying across the board; explain simply + save a report"
---

# DreamLoops Capabilities, Critical Unlocks & Cross-Ecosystem Application

## In Simple Terms

DreamLoops is a portable runtime that turns agents from stateless script-runners into durable operators with persistent memory, predictable daily routines, and the ability to improve themselves. The ZOL graft shipped in PR #13 demonstrates three immediate wins: ZOL can now learn which artists the curator prefers (persistent memory), run the same curation loop every morning without redeploying (daily routines), and propose improvements to its own handlers which Zaal approves once (self-improvement). The critical insight is that DreamLoops makes bounded, approval-gated autonomous work safe and auditable - the manifest is the source of truth, not scattered business logic. This matters across ZAO because ZOE (the orchestrator) is currently a 44-file monolith with implicit authority rules buried in code, and new agents (like a grant-deadline watcher or a podcast-scout) can now be built portable-first, test-on-dev-run-on-prod without rewiring the whole stack. The honest verdict: ship ZOL after Pi dry-run, pilot the pattern for one new agent, but do NOT refactor ZOE mid-flight - that's a 4-6 week redesign that belongs in ZOE v2 planning.

## Key Decisions

| Decision | Status | Owner | Target Date | Success Criteria |
|----------|--------|-------|-------------|-----------------|
| **Ship ZOL DreamLoops after Pi dry-run** | Ready | @Zaal | 2026-07-28 | 14 days monitoring, zero crashes, persistent memory + daily loops working |
| **PILOT DreamLoops for ONE new agent (not ZOE)** | Pending | @Zaal | 2026-08-15 | Concrete proposal for grant-deadline watcher or podcast-scout agent |
| **DO NOT refactor ZOE to Capsules (defer to v2)** | Decided | @Zaal | N/A | No ZOE work on this path; focus goes to new agents + stability |
| **DreamLoops becomes the template for future agents** | Pending | @Zaal | 2026-08-04 | Document updated with ZOL + pilot agent as reference implementations |

## A. NEW CAPABILITIES UNLOCKED BY THE ZOL GRAFT

### 1. Persistent Memory Across Restart

Before: ZOL was stateless or used temporary files. After a crash or redeploy, all learned preferences (favorite artists, relationship context, curator patterns) were lost.

After: DreamLoops' state backend (atomic-file or SQLite-WAL) survives process death. ZOL can now consolidate its observations (e.g., "this artist's genre palette is electronic + world music") into durable state and reference it on the next curation loop.

Real example from the graft: The `zol-memory.json` Capsule has handlers for memory.consolidate and memory.expire. ZOL can now observe which artists get high engagement, merge those into a "favorite artists" memory block, and use that context to bias future curator picks.

### 2. Daily Routines Without Manual Intervention

Before: ZOL's daily curator loop (read-music-draft-stage-approval) was a one-off script triggered by a human or a cron job. Each loop was independent.

After: DreamLoops defines the loop as a declarative circuit with triggers, steps, permissions, and checks. The loop runs daily at a set time (e.g., 08:00 EST), loads context from state, executes handlers in order, and writes outcomes to state. No human deploys ZOL each day.

The ZOL daily-curator loop runs: 08:00 EST trigger -> read-music (Neynar) -> draft (Claude) -> stage-approval (human approval gate) -> posted. If the draft needs improvement, the entire loop can be re-run without changing code.

### 3. Self-Improvement State Machine

Before: ZOL was static. If the curation logic needed tweaking, Zaal had to edit the handler code and redeploy.

After: DreamLoops Phase 4 delivered a self-improvement state machine (observe-propose-test-accept/reject). ZOL can now:

1. Observe: "My last 5 curator picks got low engagement; the genre distribution was off"
2. Propose: "Try shifting the genre weights to favor electronic +20%, jazz -10%"
3. Test: Run the proposed change in dry-run mode on recent music data
4. Accept/Reject: If metrics improve in dry-run, propose the change as a PR to Zaal; if they worsen, keep the old logic

This closes the loop from "static agent" to "learning agent" without removing Zaal's approval gate. The key safety: Zaal reviews proposed changes once, merges the PR to main, and the new logic takes effect on the next loop run.

### 4. Bounded Cost & Budget Awareness

Before: No visibility into what each curator loop costs (LLM calls, API calls, state storage). Loops ran unbounded.

After: DreamLoops tracks cost per loop via the cost-governance handler. The manifest declares resource ceilings (max 45s wall-time, max 7 steps, max 1 retry per step). If a loop would exceed budget, it fails closed with a receipt explaining why.

ZOL's daily-curator loop has a 45-second ceiling. If the music read takes 30s and the draft takes 20s, the loop fails at "too close to ceiling" rather than trying the approval step and timing out.

### 5. Portable Deployment (Test on Dev, Run on Prod)

Before: ZOL was Pi-only. Testing meant editing code on the Pi itself, risking breakage on prod hardware.

After: Capsules and handlers are portable JSON + code. A Capsule can be tested on a development Pi, dry-run locally, and then deployed to the production Pi by setting DREAMLOOPS_ENABLED=1 and restarting the service.

The entire test suite (105 tests) runs on dev. Once confirmed green, the branch is merged to main, and the prod Pi pulls the update on the next service restart. Rollback is instant: unset the flag, restart.

### 6. Approval Gates Explicit in the Manifest

Before: Approval logic was scattered across handler conditionals. "Does this action need human approval?" was buried in code.

After: The Capsule manifest declares approval-required actions. Example from ZOL:

```json
"permissions": {
  "farcaster.post": { "blocked": false, "approval": true },
  "memory.update": { "blocked": false, "approval": false }
}
```

This means: posts to Farcaster always need approval (no silent posting), but memory updates are local. The manifest is the source of truth, not the code.

## B. CRITICAL UNLOCKS (RANKED BY IMPACT)

### 1. Self-Improving Agents (Closed-Loop Learning)

Impact: Unlocks agents that get better over time without constant human tuning.

Why critical: The ZOL graft includes a full self-improvement state machine (Phase 4, 24 tests, proof-of-concept working). This is the path from "dumb curator" to "curator that learns". Without it, every agent change requires human code edits. With it, agents propose improvements, Zaal reviews them once per week, and the agent incorporates the feedback autonomously.

Application: ZOL can observe engagement metrics, propose handler weight changes, test them dry-run, and escalate winners to Zaal for approval. Future agents (grant-deadline watcher, podcast-scout) inherit the same pattern immediately.

### 2. Persistent Memory & Daily Consistency (No Restart Amnesia)

Impact: Agents can now maintain coherent identity and learn from yesterday's actions.

Why critical: Persistent memory is the difference between a chatbot and an operator. Right now ZOE (the orchestrator) uses memory blocks stored as files in ~/.zao/zoe/. DreamLoops formalizes this pattern: memory is durable state managed by the state adapter (atomic-file or SQLite). ZOL can now know "I curated electronic music yesterday, so today I should balance with world music" rather than starting fresh each day.

Application: Any agent that needs consistency across days (ZOL curator, budget tracker, grant-deadline watcher) now has a safe, auditable way to store and evolve state.

### 3. Portable Agent Design (Code + Tests = Deployable Everywhere)

Impact: Agents can be developed on a laptop and deployed to Raspberry Pi or VPS with zero changes.

Why critical: Right now ZOL is Pi-only code. If it needs to run on the VPS later, or if a new agent needs to run in both places, there's manual porting work. DreamLoops' Capsule model separates "what the agent should do" (manifest) from "how it runs" (handler implementations, state backend, trigger scheduling). This means a ZOL-like agent can be developed on dev hardware, test-suite green, and deployed to prod with one config change.

Application: Overnight development on a laptop, morning dry-run on dev Pi, afternoon deploy to prod Pi by toggling one env var.

### 4. Audit Trail & Explicit Authority (Manifests Are The Contract)

Impact: Every agent's permissions, loops, and constraints are human-readable and reviewable.

Why critical: Right now, ZOE's authority rules are implicit: "if you're in the coder role, you can propose PR changes; if you're in the approver role, you can merge." This is documented in code comments scattered across 44 files. DreamLoops makes this explicit in the Capsule manifest. A security audit can read one JSON file and know exactly what an agent is allowed to do.

Application: Compliance, security review, and onboarding of new agents becomes "read the Capsule manifest" rather than "grep the code for role checks."

### 5. Budget Awareness & Runaway Cost Prevention

Impact: Agents have hard ceilings on cost (wall-time, API calls, LLM tokens) baked into the manifest.

Why critical: Right now, an agent loop with a bug could burn through tokens unbounded. DreamLoops enforces ceilings: a loop that would exceed wall-time fails closed. This is especially critical for agents using LLM calls where tokens = cost.

Application: ZOL's curator loop runs for max 45 seconds. If the music read takes longer than expected, the loop gracefully fails with a receipt rather than timing out and leaving orphaned state.

## C. CROSS-ECOSYSTEM APPLICATION

### Fit Analysis: Should Each Surface Adopt DreamLoops?

| Surface | Type | Current Pattern | DreamLoops Fit | Recommendation | Reasoning |
|---------|------|-----------------|---------------|-|-----------|
| **ZOL (@zolbot, Pi)** | Persistent agent | Stateless curator, approval-gated posts | Strong fit (already shipped PR #13) | SHIP after Pi dry-run | Single-purpose, bounded loops, approval gates. Built for this. 105 tests pass. |
| **ZOE (orchestrator, VPS)** | Multi-tenant orchestrator | Monolithic 44-file codebase, scattered logic, multi-channel (TG/Discord/GH) | Medium-to-weak fit (too complex for near-term refactor) | DEFER to ZOE v2 (4-6 weeks work) | ZOE has nested decision trees, cost governance, multiple concurrent streams. Capsule redesign would touch every decision point. Not a refactor; a redesign. Keep ZOE stable; pilot DreamLoops for new agents. |
| **ZABAL Games (Magnetiq, workshops)** | Web app + static content | Next.js pages + components, Vercel deployment | Weak fit (agents don't fit web apps) | NOT applicable | DreamLoops is for agents. ZABAL Games is a web app. Different needs (UI rendering vs autonomous loops). |
| **ZAOstock (festival dashboard, Telegram bot) | Web app + bot (hybrid) | React dashboard on Vercel, ZAOstockTeamBot for team coordination | Weak-to-medium fit (depends on graduation path) | PILOT if it stays as Telegram bot; web dashboard stays web | If ZAOstock stays as a team-coordination bot running on VPS, could pilot DreamLoops for the bot half. But the dashboard is a web app, not an agent. |
| **Treasury agents (VAULT/BANKER/DEALER)** | Autonomous traders | Thin wrappers over shared runner, cost-gated autonomous trading | Medium-to-strong fit | PILOT after ZOL shipping | Similar to ZOL: bounded loops, approval gates, cost awareness. Could become DreamLoop-native in a follow-up. |
| **Grant-deadline watcher (future agent)** | Research/monitoring agent | To-be-built | Strong fit | PILOT candidate | Conceptually simple: daily loop reading grant calendars, flagging upcoming deadlines, drafting outreach. Perfect DreamLoops first experience. |
| **Podcast-scout (future agent)** | Content discovery agent | To-be-built | Strong fit | PILOT candidate | Daily loop: read podcast feeds, identify episodes matching ZAO themes, draft episode summaries, escalate high-confidence matches to Zaal. |
| **Web improver (bettercallzaal.com bot, PR-only)** | GitHub automation agent | Currently minimal (6-hour turnaround, PR-only, no live deployments) | Medium fit | MONITOR + CONSIDER for next phase | Currently human-gated at every step. If it grows autonomous capabilities (auto-testing, auto-deployment), DreamLoops fit improves. Today it's too constrained to benefit. |

### Verdict on "Blanket Application Across the Board"

Do NOT apply DreamLoops to web apps or the current ZOE monolith. DO apply it to:
- Any new agent or autonomous loop (future work)
- ZOL (already shipped)
- Treasury agents (if they graduate to persistent state)
- Any bot doing daily routines or multi-step decision-making

The pattern is: **DreamLoops for agents; keep web apps as web apps.**

## D. NEW IDEAS: CONCRETE AGENT/LOOP OPPORTUNITIES

### 1. Grant Deadline Watcher (Highest Priority)

What it does: Monitors grant calendars and RFP feeds, flags deadlines 30/14/7 days out, drafts outreach emails.

Capsules reused: calendar.read (from ZOL), memory.consolidate (track which grants are tracked), escalation (flag high-priority matches to Zaal).

Why it's valuable: The ZAO ecosystem has grant+fellowship opportunities scattered across Zapier integrations and manual tracking. A persistent agent could consolidate them, learn which grant types are relevant (music+community+web3), and escalate only high-matches to Zaal. 

Build effort: 3-4 weeks (calendar integrations, grant-database scraper, LLM-based relevance classifier, approval escalation). Reuses 80% of ZOL's scaffolding.

### 2. Podcast Scout (High Priority)

What it does: Daily loop reading podcast feeds (Spotify/Apple/RSS), identifying episodes matching ZAO themes (music+community+onchain), drafting summaries, escalating for potential collaboration.

Capsules reused: feed.read (new, builds on music.read in ZOL), memory.learn (track which podcasts/hosts ZOL has already recommended), escalation.

Why it's valuable: COC Concertz is built on podcast monetization. POIDH is audio-first. A podcast-scout agent could identify emerging voices doing music+community work, draft collaboration pitches (guest appearance, sampling rights, cross-promotion), and escalate to Zaal weekly.

Build effort: 2-3 weeks. Mostly off-the-shelf feeds + Claude classifiers.

### 3. Artist Relationship Nudger (Medium Priority)

What it does: Tracks relationships from ZOL's curator observations, reminds Zaal when artists haven't been featured in 30 days, drafts "we miss you" check-in messages.

Capsules reused: memory.consolidate (artist relationship state), escalation (reminder nudge), drafts (message composition).

Why it's valuable: ZOL learns which artists Zaal loves to feature. This agent closes the loop: "Artist X is your favorite curator pick 5 months running. Artist Y (similar genre) hasn't been featured in 3 weeks. Consider checking in?" Keeps relationships warm.

Build effort: 2 weeks (mostly reusing ZOL's state machine + memory patterns).

### 4. Engagement Feedback Loop Closer (Medium Priority)

What it does: Nightly loop reading Farcaster engagement stats for ZOL's casts, correlating with curator logic, proposing handler adjustments.

Capsules reused: farcaster.analytics (new), memory.propose-self-improvement (from ZOL Phase 4), escalation.

Why it's valuable: Automates the feedback loop for ZOL's self-improvement. Right now, Zaal has to manually check engagement and suggest tweaks. This agent does it daily: "Posts with electronic music themes got 35% higher engagement this week; shall I increase the weight?"

Build effort: 1-2 weeks (mostly reading ZOL's Phase 4 self-improvement code, adapting for Farcaster metrics).

### 5. Event Coverage Tracker (Lower Priority)

What it does: Monitors ZAO Events (ZAO-PALOOZA, concerts, workshops), flags upcoming coverage deadlines, drafts promotion copy.

Capsules reused: calendar.read, memory.consolidate, drafts.

Why it's valuable: ZAO runs 10-20 events per quarter. Each one needs promotion (social posts, updates, coverage). A persistent agent could track "ZAO-PALOOZA is 21 days out, promotional video not shot yet, should escalate to Zaal."

Build effort: 1-2 weeks (event calendar scraper + promotion checklist templates).

### 6. Research Doc Auto-Publisher (Lowest Priority)

What it does: Watches research/ directories for completed docs, auto-drafts social posts and Bonfire episodes, escalates for approval.

Capsules reused: file.watch (new), socialmedia.draft, bonfire.queue (existing in ZOE).

Why it's valuable: Every research doc currently requires manual social + Bonfire work. This agent detects "new doc completed" and says "shall I draft a Twitter thread and Bonfire episode?" Zaal approves once, agent posts.

Build effort: 2-3 weeks (file watching, draft templating, social+Bonfire integration).

## E. HONEST RISKS & WHAT NOT TO DO

### Risk 1: Over-Engineering for Web Apps

Mistake: Trying to force DreamLoops into Next.js frontend logic or Vercel-deployed services.

Why it's wrong: DreamLoops is for autonomous loops (cron-based, event-triggered, state-managed). Web apps are request-response. Trying to put a Capsule in a page.tsx or API route adds complexity with no benefit.

What to do instead: Keep web apps as web apps. Use DreamLoops only for agents/bots/autonomous services.

### Risk 2: Refactoring ZOE Too Soon

Mistake: Refactoring ZOE from monolithic to Capsule-based before it's stable or before we have 2-3 working DreamLoops agents as reference.

Why it's wrong: ZOE is currently the spine holding all ZAO automations together. A redesign mid-flight means touching concierge, scheduler, cost governance, approvals, research doc publishing, and task routing all at once. The blast radius is the entire orchestration layer. If something breaks, ZAO automations stall.

What to do instead: Ship ZOL (low risk, already tested). Pilot one new agent (grant-deadline watcher or podcast-scout). Let those run for 4-6 weeks. Then, with 2-3 working examples, plan ZOE v2 redesign as a deliberate, documented migration. That work should happen in January 2026+ (off-season, not during festival season).

### Risk 3: Assuming Capsules Eliminate All Authority Checking

Mistake: Thinking "I put approval: true in the Capsule, so I don't need to check permissions in my handler code."

Why it's wrong: The Capsule is one layer of the 3-factor model. The host application still needs to check: does the user have the right role? Is the context safe? Even if a Capsule says "farcaster.post: approval required," the handler code should still verify "is this actually a safe post" before drafting it.

What to do instead: Treat Capsule permissions as a checklist, not a complete solution. Handlers should still validate inputs with Zod, check user identity, and audit sensitive operations.

### Risk 4: Trying to Retrofit Existing Agents Without Regressions

Mistake: Taking agents that are already live (like ZOE's cost-governance loop or the cowork bot) and trying to rewrite them as DreamLoops agents in-place.

Why it's wrong: You'd have to coordinate: turn off the old code, turn on the new Capsule, test, flip back if something breaks. The regression risk is high. It's safer to build new.

What to do instead: Use the "pilot new agent" approach: build grant-deadline-watcher as a DreamLoop-native agent from day one. Let it run in parallel with existing systems. Once it proves stable, use it as a template for the next one.

### Risk 5: Bundling Too Much Logic Into One Loop

Mistake: Creating a Capsule with a loop that does "read calendar, read email, read slack, classify all three, make a decision, execute" in one 30-step loop.

Why it's wrong: DreamLoops are bounded by design. A step that fails can retry, but if the retry ceiling hits, the whole loop fails. Long, complex loops are fragile. A step-5 failure means the loop stopped and loses context from steps 1-4.

What to do instead: Split into smaller loops. Example: "calendar-read loop" (5 steps, runs daily), "email-classify loop" (3 steps, runs when email arrives), "decision loop" (consumes outputs from prior two). Each loop is independently restartable and debuggable.

## F. RECOMMENDATION: CONCRETE NEXT STEPS

### SHIP ZOL DreamLoops (Approved - Awaiting Go-Ahead)

Status: PR bettercallzaal/zol #13 is in draft, 105 tests passing, ready for Zaal approval.

Path:
1. Zaal reviews + approves PR #13 (leave in draft, do not merge yet) - 2026-07-16
2. Pull ws/persistent-agent-graft on the Pi, run npm run dl:test (verify 105/105 pass) - 2026-07-17
3. Run npm run dl:dry-run, review logs for loop executions (no network posts, no state mutations) - 2026-07-17
4. Set DREAMLOOPS_ENABLED=1 in .env on the Pi, restart ZOL service - 2026-07-18
5. Monitor ZOL activity for 14 days: daily curator casts, reply volume, errors - 2026-07-18 to 2026-07-28
6. If stable and useful (persistent memory working, no crashes, expected posts shipping): merge PR #13 to main - 2026-07-29

### PILOT ONE NEW AGENT (Target: Grant-Deadline Watcher or Podcast-Scout)

Status: Pending Zaal decision on which to build first.

Path:
1. Zaal chooses: grant-deadline-watcher or podcast-scout - 2026-08-01
2. Create research doc 1087 (pilot agent design): Capsule manifest, handlers, test plan - 2026-08-04
3. Build on a ws/agent-* branch, parallel to main. Use ZOL as the reference implementation. Reuse Capsules (calendar.read, memory.consolidate, escalation, drafts). Write 80%+ of code + tests before opening a PR - 2026-08-08 to 2026-08-15
4. Test locally (dry-run), then deploy to VPS or Pi (depends on trigger type)
5. Run for 2-3 weeks in parallel with ZOL. If stable, write a postmortem doc and a template repo for the next agent - 2026-08-15 to 2026-09-05

### DO NOT REFACTOR ZOE (Keep It Stable)

Status: Decided - defer to ZOE v2 planning.

Rationale: ZOE is currently the orchestration spine. A redesign now would touch 15+ handler files, change the decision-tree logic, and risk breaking task routing, cost governance, and approvals. The payoff is long-term (cleaner authority model, portable handlers), but the risk is immediate (ZAO automations stall).

Better path: Let ZOL + pilot agent run for 2+ months. Document lessons learned. In January 2026 (off-season), start ZOE v2 planning with the DreamLoops pattern as a proven reference. Redesign document (process, schedule, risk). Then migrate in phases (concierge first, then scheduler, then cost governance).

### UPDATE THE TEMPLATE

Status: Pending completion of pilot agent.

Action: After the pilot agent ships and runs for 2 weeks stable, create a "DreamLoops Agent Template" repository (or guide in this repo's docs/). It should include:
1. Capsule manifest boilerplate (handlers, loops, permissions)
2. Handler scaffolding (async function signatures, state adapter calls)
3. Test template (unit tests for each handler, integration test for loop)
4. Deployment checklist (dry-run, monitor, flip flag, merge)

This becomes the reference for the next 3-4 agents (relationship nudger, event-coverage tracker, etc.).

## Sources

### Full Access [FULL]
- **ZOL DreamLoops Graft (PR #13)**: https://github.com/bettercallzaal/zol/pull/13 (ws/persistent-agent-graft branch)
- **ZOL Graft Research Doc (1085)**: research/agents/1085-zol-dreamloops-persistent-agent-graft/README.md (local)
- **ZOE Architecture**: bot/src/zoe/ (index.ts, scheduler.ts, concierge.ts, brief.ts, cost-governance.ts)
- **DreamLoops Framework**: BrandonDucar/dreamloops on GitHub (commit 1c6d3b1910)

### Partial Access [PARTIAL]
- **ZAO Repo Census (1085)**: research/infrastructure/836-zaoos-repo-estate-census/README.md (code metrics + Vercel/Supabase estate)
- **DreamLoops README/CATALOG**: GitHub repo (docs still sparse, framework new 2026-07-14)

### Related Research [FULL]
- **GitHub Spec Kit, Spec-Driven Development (1084)**: research/dev-workflows/1084-github-spec-kit-spec-driven-dev/README.md (parallel pattern: manifests as source of truth)
- **Loop-Engineering Taxonomy (994)**: research/agents/994-loop-engineering-taxonomy/README.md (bounded-loop theory)
- **Agent-Loop Best Practices (928)**: research/agents/928-agent-loop-best-practices/README.md (durable loop patterns)
- **Agent Stack Cleanup Decision (601)**: research/agents/601-agent-stack-cleanup-decision/README.md (locked 5-surface model)

## Statistics

- **ZOL Graft**: 105 tests (100% pass), 8 phases, 8 Capsules, 23 handlers, 18 loops, 0 breaking changes
- **ZOE Current**: 44 files, ~2,000 lines per major module (concierge, scheduler, brief, etc.), scattered authority logic, ~10 concurrent worker states
- **ZAO Repo Estate**: 306 API routes, 296 components, 963 research docs, still growing (no major graduation since COC Concertz)
- **DreamLoops Framework**: Dependency-free, ~50KB of portable runtime code, vendored by commit SHA
- **Estimated Pilot Agent Build Time**: grant-deadline-watcher 3-4 weeks, podcast-scout 2-3 weeks

## Next Actions

| Action | Owner | Target Date | Success Criteria |
|--------|-------|-------------|-----------------|
| Approve ZOL PR #13 (leave in draft) | @Zaal | 2026-07-16 | PR approved, no blocking comments |
| Run npm run dl:test on Pi (verify 105/105) | @Zaal | 2026-07-17 | All tests pass, log confirms success |
| Run npm run dl:dry-run and review logs | @Zaal | 2026-07-17 | Logs show 3+ loop executions, no posts, no mutations |
| Enable DREAMLOOPS_ENABLED=1 on Pi, restart ZOL | @Zaal | 2026-07-18 | ZOL running, Telegram pings continue |
| Monitor ZOL for 14 days (curator activity, errors, engagement) | @Zaal | 2026-07-18 to 2026-07-28 | Zero crashes, persistent memory working, daily posts shipping on time |
| Decide: Grant-deadline-watcher or Podcast-scout as pilot agent | @Zaal | 2026-08-01 | Written decision in Telegram or Zaal's calendar |
| Merge PR #13 to main (after 14-day monitor) | @Zaal | 2026-07-29 | Branch deleted, code on main, prod Pi updated |
| Research doc 1087: Pilot agent design + Capsule manifest | Claude | 2026-08-04 | Doc complete with full manifest, handler signatures, test plan |
| Build + test pilot agent locally (80%+ code + tests before PR) | Claude | 2026-08-08 to 2026-08-15 | Dry-run successful, tests 90%+ pass |
| Open PR for pilot agent, deploy to VPS or Pi | Claude | 2026-08-15 | PR reviewed + merged, agent running in parallel with ZOL |
| Monitor pilot agent for 2-3 weeks, document lessons | Claude | 2026-08-15 to 2026-09-05 | Postmortem doc + template for next agent ready |

## Summary

The DreamLoops framework transforms agents from stateless scripts to durable, learning operators with explicit authority rules and portable design. The ZOL graft (PR #13, 105 tests, ready to ship) unlocks six new capabilities: persistent memory, daily routines, self-improvement, budget awareness, portable deployment, and explicit approval gates.

Critical unlocks, ranked: (1) self-improving agents (observe-propose-test-accept loop), (2) persistent memory without restart amnesia, (3) portable agent design (code + tests = deployable everywhere), (4) explicit authority & audit trail (manifests are the contract), (5) budget awareness & cost prevention.

Cross-ecosystem verdict: Ship ZOL after Pi dry-run. Pilot the pattern for one new agent (grant-deadline-watcher or podcast-scout). Do NOT refactor ZOE mid-flight; defer to v2 planning. Use ZOL + pilot agent as reference implementations for the next 3-4 agents (relationship nudger, event-coverage tracker, engagement-feedback-closer).

The pattern is clear: DreamLoops for agents; keep web apps as web apps. Authority rules explicit in manifests. Each agent portable, bounded, and testable. The next iteration should be a grant-deadline-watcher or podcast-scout, built from day one as a DreamLoop-native agent, reusing ZOL's scaffolding.

---

**Author**: Claude Code (research synthesis of Brandon Ducar's DreamLoops framework + ZOL graft + ZAO ecosystem cross-reference)  
**Delivered**: 2026-07-14  
**Framework**: DreamLoops by Brandon Ducar (Apache 2.0, commit 1c6d3b1910)  
**Confidence**: STRATEGY READY (grounded in code, cross-validated against ZOE + repo estate)
