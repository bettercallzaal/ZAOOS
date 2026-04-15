# 355 - Harness Engineering: CREAO's AI-First Workflow (Peter Pang)

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Extract actionable patterns from CREAO's AI-first engineering rebuild for ZAO OS solo-dev workflow

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Self-healing feedback loop** | BUILD for ZAO OS - daily automated health check (CloudWatch/Vercel equivalent) + auto-triage to Linear/GitHub Issues |
| **AI code review on PR** | ALREADY HAVE `/review` skill - enhance with 3-pass pattern (quality + security + deps) |
| **Monorepo for AI legibility** | ALREADY DONE - ZAO OS is single repo. Key insight: "fragmented codebase is invisible to agents, unified one is legible" |
| **Feature flags** | SKIP for now - 100-member community, not consumer scale. Revisit at 1000+ members |
| **Architect vs Operator model** | APPLY - Zaal is the Architect. Claude Code / ZOE are Operators. Design SOPs (skills) that teach AI how to work |
| **Push AI-native into every function** | APPLY - already doing: newsletter, socials, research, QA, code review. Gap: no automated health monitoring |

---

## Comparison: CREAO vs ZAO OS Current State

| Capability | CREAO (25 people) | ZAO OS (1 person + AI) | Gap |
|-----------|-------------------|------------------------|-----|
| AI code review | 3 Claude passes per PR | `/review` skill, 1 pass | Add security + deps passes |
| CI/CD pipeline | 6-phase with auto-rollback | Vercel auto-deploy, lint hook | Add typecheck gate, test gate |
| Health monitoring | Daily CloudWatch + auto-triage | None | **Big gap** - need Vercel/Sentry integration |
| Feature flags | Statsig | None | Skip for now |
| Self-healing loop | Error detect -> triage -> fix -> verify -> close | Manual | Build automated error detection |
| Deploys per day | 3-8 | 1-3 | Fine for solo dev |
| AI across all functions | Eng + product + marketing + growth | Eng + content + research | Gap: no automated marketing/growth |

## CREAO's Core Insight (Harness Engineering)

OpenAI coined "harness engineering" in Feb 2026: **primary job of engineering team is no longer writing code - it is enabling agents to do useful work.** When something fails, fix is never "try harder." Fix is: what capability is missing, and how do we make it legible and enforceable for the agent?

ZAO OS translation: **skills are the harness.** Each skill teaches Claude Code how to do a specific job. The more skills, the more leverage. Gap: no skill for health monitoring, error triage, or automated testing pipeline.

## Key Quotes Worth Remembering

- "99% of our production code is written by AI"
- "It doesn't make sense to think about something for months and then build it in two hours"
- "The ability to criticize AI will be more valuable than the ability to produce code"
- "Junior engineers adapted faster than senior engineers" - less habits to unlearn
- "Bad features die the same day they ship"
- "We build an agent platform. We built it with agents."

## What ZAO OS Should Steal

### 1. Self-Healing Error Loop (Priority: High)
```
Vercel deploy logs -> Claude triage -> GitHub Issue auto-created -> fix -> verify -> close
```
Could run as scheduled trigger or `/vps` agent task.

### 2. Three-Pass PR Review (Priority: Medium)
Enhance `/review` skill:
- Pass 1: Code quality (logic errors, performance, maintainability)
- Pass 2: Security (OWASP, auth boundaries, injection)
- Pass 3: Dependency scan (supply chain, version conflicts, license)

### 3. Structured Logging (Priority: Medium)
"If AI can't read the logs, it can't diagnose the problem."
Add structured JSON logging to API routes so automated triage can parse them.

### 4. Daily Health Report (Priority: Low)
Morning automated report: Vercel deploy status, error rates, key metrics.
Could integrate with `/morning` skill.

---

## ZAO Ecosystem Integration

Relevant files:
- `.claude/skills/review/` - PR review skill, enhance with 3-pass pattern
- `.claude/skills/morning/` - morning kickoff, add health check
- `src/middleware.ts` - rate limiting, could add structured error logging
- `src/app/api/` - all API routes, add consistent error format

The CREAO model validates ZAO OS direction: one architect (Zaal) + AI operators (Claude Code, ZOE) + skills as the harness. Main gaps: health monitoring, structured logging, multi-pass review.

---

## Sources

- [Peter Pang @intuitiveml - X thread](https://x.com/intuitiveml) - April 13, 2026, 1.7M views
- [OpenAI - Harness Engineering concept](https://openai.com) - February 2026
- CREAO - 25 employees, 10 engineers, agent platform
- Peter Pang: Co-founder CreaoAI, formerly GenAI @ Meta (LLaMA), xApple, PhD in physics
