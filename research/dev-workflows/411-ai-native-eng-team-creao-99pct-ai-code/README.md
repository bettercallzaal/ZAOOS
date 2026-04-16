# 411 - AI-Native Engineering Team: CREAO's 99% AI-Written Code

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** How CREAO restructured 25-person team to ship 99% AI-written code with 3-8 daily deploys - applicable org design patterns for ZAO
> **Source:** [@intuitiveml (Peter Pang) on X](https://x.com/intuitiveml/status/2043545596699750791)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Org model** | Adopt "harness engineering" - engineers enable AI agents, not write code directly. Already doing this with Claude Code. |
| **Review process** | USE Claude Opus for 3 parallel code review passes. Matches /review skill approach. |
| **Bottleneck shift** | Product management and QA are the new bottlenecks when build time collapses. Invest there. |
| **Junior vs senior** | Junior engineers adapt faster to AI-native workflows. Seniors carry old habits. |
| **For ZAO** | Solo dev + AI = 10-25 person team output. Validates the lean team model (Doc 263). |

---

## CREAO's Numbers

| Metric | Value |
|--------|-------|
| **Team size** | 25 employees, 10 engineers |
| **AI-written code** | 99% of production code |
| **Daily deploys** | 3-8 to production |
| **Feature kill time** | Same day (bad features killed immediately) |
| **Feature ship time** | New features within 24 hours |
| **Equivalent output** | 100+ person team |
| **Previous cycle time** | 6 weeks -> now hours |

---

## The "Harness Engineering" Model

> "The primary job of an engineering team is no longer writing code. It is enabling agents to do useful work."

### Two Engineer Archetypes

| Role | Count | Responsibility |
|------|-------|---------------|
| **Architects** | 1-2 senior | Design systems, critique AI decisions, set constraints |
| **Operators** | Everyone else | Validate fixes, review for risk, investigate issues |

### Key Insight: Junior > Senior (for AI-native)

Junior engineers adapted faster than seniors. Seniors carry "traditional practices" that slow AI adoption. The unlearning cost is real.

---

## Three Bottleneck Shifts

When AI collapses build time to hours, what becomes the constraint?

| Old Bottleneck | New Bottleneck | Solution |
|----------------|---------------|----------|
| Writing code (weeks) | Product management (still weeks) | Faster spec cycles, tighter feedback loops |
| Building features | QA testing (days while impl = hours) | Automated testing, AI-assisted QA |
| Hiring more devs | Team coordination overhead | Smaller teams, more autonomous agents |

---

## CREAO's Tech Stack

| Layer | Tool | ZAO OS Equivalent |
|-------|------|-------------------|
| **Infrastructure** | AWS auto-scaling + circuit-breaker rollback | Vercel (auto-scaling built in) |
| **CI/CD** | GitHub Actions, 6-phase deterministic pipeline | GitHub Actions (simpler) |
| **Code review** | Claude Opus 4.6, 3 parallel review passes | /review skill + /codex |
| **Monitoring** | CloudWatch + Sentry + daily health workflows | Vercel Analytics + Sentry |
| **Feature flags** | Statsig for flags + A/B testing | None (could add) |
| **PR management** | Graphite for stacking PRs | Standard GitHub PRs |
| **Deploys** | 3-8/day with same-day rollback | Vercel preview + production |

---

## ZAO OS Application

### What We Already Do (Validated)

- Solo dev + AI writing 95%+ of code
- Claude Code for implementation
- /review for code review
- /qa for automated testing
- /worksession for isolated branches
- Lean team model (Doc 263 - Obsidian's 9-person $350M company)

### What We Could Adopt

| CREAO Practice | ZAO OS Adoption |
|----------------|----------------|
| 3 parallel review passes | Enhance /review to run 3 focused passes (security, logic, style) |
| Same-day feature kill | Already doing via Vercel rollback, but could formalize |
| Circuit-breaker rollback | Add to Vercel deployment config |
| Daily health workflows | /z status dashboard + automated checks |
| Feature flags | Add Statsig or LaunchDarkly for gradual rollout |

### The One-Person Company Insight

> "One-person companies become feasible when one architect manages AI agents."

This IS the ZAO model. Zaal as architect + Claude Code + agent squad (ZOE, skills). The validation from a 25-person team scaling this way confirms the solo dev approach scales further than expected.

---

## Key Quote

> "Nothing in our stack is proprietary. The competitive advantage lies in organizational redesign."

The moat isn't the tools - it's how you restructure work around AI. ZAO OS's skill system, research library, and /worksession workflow IS that organizational redesign.

---

## Sources

- [@intuitiveml (Peter Pang) - CREAO AI-Native Team](https://x.com/intuitiveml/status/2043545596699750791)
- [Doc 263 - Obsidian Lean Team Model](../../business/263-obsidian-lean-team-model/)
- [Doc 196 - Solo Dev AI Coding Landscape 2026](../196-solo-dev-ai-coding-landscape-2026/)
