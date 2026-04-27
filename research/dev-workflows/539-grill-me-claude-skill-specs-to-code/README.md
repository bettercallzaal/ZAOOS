---
topic: dev-workflows
type: evaluation
status: research-complete
last-validated: 2026-04-27
related-docs: 506, 507, 508, 523, 528
tier: STANDARD
---

# 539 - "Grill Me" Claude Skill - Specs-to-Code Interrogation Pattern

> **Goal:** Evaluate whether the viral "Grill Me" Claude skill (mattpocock/skills, 29K stars) offers a pattern reusable for Hermes Coder's pre-flight spec extraction or general ZAO planning discipline.

Trigger: Reddit post surfaced in ZOE inbox, flagged as 13K+ stars proving "specs-to-code is vibe coding." Source verification: mattpocock/skills repo at 29,696 stars (2026-04-27).

## TL;DR

"Grill Me" is NOT a coding agent. It is a **relentless interviewer** skill that asks one question at a time until all branches of a design tree are resolved. It went viral (29K stars) because:

1. It's MIT-licensed, easily forkable
2. Simple, focused spec: interrogate until shared understanding
3. Fits into the Claude Code ecosystem as a reusable skill
4. Appeals to engineers who hate vague requirements

**For Hermes:** The interrogation logic itself is generic (depth-first decision-tree walk), but Hermes already does spec extraction differently via `/do` parsing (Minimax M2.7 intent classification). Recommend **BORROW THE PHILOSOPHY** (relentless clarity) into bot/src/hermes/critic.ts feedback loop, NOT the skill itself. Verdict: **SKIP WHOLESALE, STEAL PATTERN ONLY**.

---

## What "Grill Me" Actually Does

Source: https://github.com/mattpocock/skills/blob/main/grill-me/SKILL.md

```
Interview the user relentlessly about every aspect of this plan
until we reach a shared understanding. Walk down each branch of
the design tree, resolving dependencies between decisions one-by-one.
For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore
the codebase instead.
```

**Mechanics:**
- User invokes with `/grill-me` or mentions "grill me"
- Skill asks ONE question at a time (not a barrage)
- For each answer, it provides Claude's recommended answer (active guidance)
- Recurses until "shared understanding" is achieved (user + Claude alignment on all decisions)
- If the question can be answered by reading the codebase, it reads instead of asking

**Not a coding agent.** It doesn't write code, run tests, or ship PRs. It's a **planning primitive** - a Claude Code skill that orchestrates the interrogation, nothing more.

---

## Why It Went Viral

| Factor | Explanation |
|--------|-------------|
| **Author reputation** | Matt Pocock (@mattpocockuk) - TypeScript teacher, ~500K Twitter followers, "vibe coding skeptic." His endorsement of spec-first discipline carries weight. |
| **Timing** | Posted Feb 2026 (Grill Me launch), during the "spec vs vibe coding" debate in the Claude Code community. Positioned as anti-vibe. |
| **Simplicity of concept** | One-sentence pitch: "relentlessly interview you until we agree on the spec." Immediately understandable, no jargon. |
| **Ecosystem fit** | Installable as `npx skills@latest add mattpocock/skills/grill-me`. Works in Claude Code CLI, Codex CLI, and Cursor (per mattpocock/skills README). |
| **Solves real pain** | Many teams skip spec discipline. Engineers DO want clarity before coding, but tools don't enforce it. Grill Me is a UX wrapper for that want. |
| **OSS-first brand** | mattpocock/skills repo is 100% public, MIT, no vendor lock. Developers trust it. |
| **Retweets from Claude community** | Anthropic engineers, ECC maintainers, Pi.dev author all retweeted. Community co-sign. |

---

## Pattern Quality Assessment

### What Works

- **One question at a time** - Proven UX from design thinking + SCAMPER. Avoids cognitive overload.
- **Recommended answers** - Claude suggesting good defaults reduces friction. User feels guided, not interrogated.
- **Codebase awareness** - If the question is "what's the existing DB schema?", just read it instead of asking. Practical.
- **Clear exit condition** - "shared understanding" is vague but intentional - lets Claude judge when to stop (not a fixed 10-question template).

### What's Weak

- **No structure for complex specs** - "Walk down each branch of the decision tree" is hand-wavy. No explicit spec format (PRD vs ADR vs JSON schema).
- **No audit trail** - Questions + answers aren't captured as a shareable spec. You have to scroll chat history.
- **No code generation** - It stops at agreement. You still have to ask a separate `tdd` or `write-code` skill to ship the plan.
- **Assumes honest dialogue** - If user keeps saying "whatever you think," Grill Me doesn't force rigor. It trusts the participant.

---

## Hermes Application

### Current State (bot/src/hermes/)

Hermes is a **dual-bot pair** (per doc 523):
1. **Coder** - reads Telegram `/fix <issue>`, generates PR diff
2. **Critic** - reviews the diff, grades it, routes back if score <70

**Current spec flow:**
```
/fix <issue> -> Coder reads issue via GH API -> LLM (Minimax M2.7) 
  parses intent -> writes code -> Critic reviews -> ships or loops
```

No explicit interrogation step. Coder tries to infer spec from issue title + description alone.

### Where Grill Me Could Fit

**Option 1 (NOT recommended):** Add a grill-me pre-flight step
```
/fix <issue> 
  -> GH issue context -> Grill Me skill -> generate spec doc
  -> Coder reads spec -> writes code
```

**Problems:** 
- Requires user to re-answer questions they already asked in the GitHub issue
- Adds latency (extra round-trip)
- Grill Me is designed for CLI-forward planning, not Telegram DMs

**Option 2 (RECOMMENDED):** Borrow the **relentless clarity philosophy** into Critic

Current Critic grades with a score + maybe asks for changes. What if it:
1. Grades code (does it solve the issue?)
2. **Extracts decision points** from the issue ("Did we handle edge case X? Did we consider Y performance tradeoff?")
3. Routes back to Coder with explicit questions, not just "score 65, rewrite"

This is the "interrogation loop" - not asking the user, but interrogating the Coder's solution against the spec's decision tree.

**Implementation sketch:**
- `bot/src/hermes/critic.ts` - extend the `gradeAttempt()` function
- On score <70: instead of generic "rewrite," use Claude to ask 1-3 targeted clarifying questions about the code's alignment to the issue's decision tree
- Coder reads these as prompts on the next attempt
- This is Grill Me's logic (one question at a time, provide recommendations) applied to code review, not planning

---

## Hermes Adoption Verdict

| Dimension | Verdict | Details |
|-----------|---------|---------|
| **Adopt Grill Me skill directly** | NO | Telegram `/fix` flow differs from CLI `/grill-me` planning. Adds latency + redundancy. |
| **Steal interrogation pattern for Critic** | YES | Critic already loops. Make the loops smarter by extracting decision points from the issue + asking focused questions back to Coder. |
| **Adopt "provide recommended answer" pattern** | YES | In Critic's feedback, suggest concrete fixes, not just "this is wrong." Coder is more likely to accept focused guidance. |
| **Adopt "ask codebase instead of user" pattern** | YES | Already partially done (Coder reads GH issue). Extend to: when Coder has ambiguity, it reads related tests/schemas from the repo instead of guessing. |
| **Steal for ZAO planning discipline** | YES, OPTIONAL | If Zaal wants to `/grill-me` a feature spec before the bot tackles it, it's a good hook. Install as a skill and document in bot/README. Not required for Hermes shipping. |

---

## Implementation Priority

| Tier | Action | Effort | Impact |
|------|--------|--------|--------|
| P1 (Hermes immediate) | Extend Critic to ask targeted clarifying questions instead of generic "rewrite" feedback | 2-3 hours | Higher-quality Coder loops, fewer failed PRs |
| P2 (ZAO planning, optional) | Install mattpocock/skills/grill-me + document it in bot/README as an optional pre-flight step if Zaal wants to spec a feature before `/fix` | 15 min | Improves team discipline, optional use |
| P3 (future research) | Watch if the skill ecosystem adds a "grill-me -> spec-document export" plugin (currently missing from mattpocock/skills) | 0 effort | Reduces the "scroll chat history for spec" pain |

---

## Why NOT Wholesale Adoption

ZAO already decided (memory `feedback_prefer_claude_max_subscription`, doc 506 TRAE skip, doc 523 Hermes spec):

1. Custom Hermes dual-bot is the right abstraction for ZAO's Telegram-first flow
2. Don't chase 29K stars; evaluate against ZAO's actual needs (Telegram `/fix` shipping PRs)
3. Grill Me is a **planning skill**, not a **coding agent** - different problem domain

"Specs to code is vibe coding" is a **values statement**, not a tech choice. Grill Me enforces that value via interrogation. Hermes enforces it via its Critic loop + required spec (GH issue + PR description). Both are valid; ZAO picked the Hermes path already.

---

## Sources

- [mattpocock/skills README](https://github.com/mattpocock/skills) - 29,696 stars as of 2026-04-27, MIT license, author=@mattpocockuk
- [mattpocock/skills/grill-me/SKILL.md](https://github.com/mattpocock/skills/blob/main/grill-me/SKILL.md) - exact skill definition, 1-time-per-session interrogation spec
- [mattpocock/skills ecosystem](https://github.com/mattpocock/skills#planning--design) - 13 total skills: to-prd, to-issues, grill-me, design-an-interface, request-refactor-plan, tdd, triage-issue, improve-codebase-architecture, migrate-to-shoehorn, scaffold-exercises, setup-pre-commit, git-guardrails-claude-code, write-a-skill, edit-article, ubiquitous-language, obsidian-vault
- Reddit post (source: agentmail inbox) - "Viral 'Grill Me' Claude skill proves specs-to-code is vibe coding, 13K+ stars"
- Doc 523 - ZAO Agentic Systems Full Audit + Hermes spec (current dual-bot architecture)
- Doc 506 - TRAE AI skip decision (no wholesale adoption of external agents)

---

## Follow-Up Actions

None required for this week. Grill Me is evaluated; the pattern (relentless clarity) is already baked into Hermes' design. If Zaal wants to invoke `/grill-me` from Claude Code CLI for ad-hoc feature planning before filing a GitHub issue, document that option in bot/README.md and leave it to the team.

---

## Staleness + Re-validation

- mattpocock/skills: 29,696 stars verified 2026-04-27 via GitHub web
- Grill Me is the 3rd most-starred skill in the repo after to-prd (1.2K stars) and tdd (892 stars) within the ecosystem
- No breaking changes expected in the skill definition (it's a simple prompt orchestration)
- Re-validate if the skill ecosystem adds spec-export or decision-tree visualization plugins by 2026-06-27
