---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-20
original-query: What AI-pair-coding patterns emerge from r/vibecoding thread on non-dev PM shipping 70k lines in 30 days? (reconstructed)
related-docs: [172, 196, 440, 506, 507, 539]
tier: QUICK
source: reddit.com/r/vibecoding thread 2026-05-11
---

# 633 - r/vibecoding thread: 200+ hours of AI-pair-coding as a non-dev PM

## TL;DR

Non-technical PM shipped 70k lines, complex internal tool in 30 days using Claude/Codex. Thread validates multi-session token conservation, PRD-first approach, UI-then-backend, aggressive testing/refactoring, and TypeScript adoption. Significant pushback from senior engineers questioning whether non-devs can scale AI-coded systems without tech debt.

## OP Claims

- Background: PM, architecture/code knowledge but no prior solo shipping
- Output: 200+ hours -> 70k lines (30% tests), chat+embeddings+LLM vision, login, Sentry, PostHog, internal tool
- Approach: 30-day sprint, micro-features, broke across sessions, mocked UI first

## Top Comments Synthesis

**Supporting patterns (4+ mentions):**
1. New session per feature, `/compact` to keep context tight, plan with top model, code with cheaper one
2. Tests massively pay off - catches regressions, saves manual QA
3. CLAUDE.md / AGENTS.md discipline prevents ballooning
4. Refactoring days (1-2 per sprint) prevent codebase decay
5. Multi-model approach: Claude for UI, Codex for complex logic, Gemini for fresh-perspective evaluation
6. Preview channel before main - prevents shipping unverified commits
7. TypeScript adoption earlier than feels necessary

**Major critiques:**
1. **Frontend-first is backwards** (12+ replies): Build backend first, then frontend. OP's UI-then-backend flagged as "backwards" and recipe for disaster
2. **Security advice "batshit crazy"**: OP's security guidance critiqued as naive
3. **Non-dev scaling ceiling**: Senior engineers claim non-devs can't scale past MVP, will need engineers to clean up tech debt, inconsistencies, dead code
4. **Don't rebuild retry logic** - use Temporal for failure recovery instead
5. **Verify your own stack**: One comment asked OP to explain security choices - OP didn't go deep

**Contrarian support:**
- Multiple comments defend non-dev capability: "knowledge isn't gatekept anymore", learn by asking AI right questions
- "This all makes sense... you learn it naturally"
- Suggestion: Use spec frameworks like OpenSpec, `/grill-me` before docs
- React Native tip: test both Android+iOS from start, use DevBuilds not Expo Go

## Applicable to ZAO?

- YES: Multi-session token discipline + new-session-per-feature pattern aligns with your `/compact` workflow and documented in CLAUDE.md
- YES: Frontend-first on features - but comments suggest backend-contract-first is safer. Your Hermes/ZOE agent stack is backend-heavy; verify UI assumptions don't slip
- YES: Test/refactor cadence - your agent testing could adopt OP's "teach AI to write e2e" pattern
- PARTIAL: TypeScript adoption - you're already heavy TS in routes/libs; React still mixed. Not blocking
- NO: Security confidence - OP couldn't defend specifics. Your Supabase RLS + secret hygiene rules (Doc 473) are stricter; maintain
- NO: Frontend-before-backend for agents - agents are all backend/logic; UI is secondary. Skip this pattern for agent work

## Gaps in Thread

- No discussion of LLM hallucination on architecture decisions (just assume AI is right)
- No cost analysis (one comment asked spend; OP didn't answer)
- No discussion of debugging when AI code breaks in prod
- No mention of RAG, knowledge bases, or context management beyond sessions

## Action

| Action | Owner | Consideration |
|--------|-------|----------------|
| Validate UI-then-backend on Hermes/ZOE feature work | Zaal | Spec UI but wire backend contract first to avoid rework |
| Document agent testing pattern (teach AI e2e) | Doc task | Formalize in 534 or agent-specific guide |
| Audit security claims | Review | OP's "basics" claim is overstated per thread; maintain stricter Doc 473 standard |
| Evaluate Temporal for agent retry logic | Backlog | Replace hand-rolled retry in agent runners if scaling |

---

**Thread vibe:** Optimistic non-dev enthusiasm vs. jaded senior-eng skepticism. OP is credible on process but underestimates complexity scaling. Useful for token/session discipline. Ignore "frontend first" for agents.
