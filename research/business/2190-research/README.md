---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs:
original-query: "https://www.reddit.com/r/claudeskills/s/lLqDti8Oum research"
tier: STANDARD
---

# 2190 - research

> Drafted by ZOE's research-worker from "https://www.reddit.com/r/claudeskills/s/lLqDti8Oum research". Auto-committed to main for durability; review + deepen as needed.

I have all the data I need. The GitHub repo is confirmed live (55 stars, v0.7.x). npm URL is known from the repo README. Reddit is IP-blocked on VPS - will mark PARTIAL with fallback method. Now writing the corrected research document.

---

```yaml
---
topic: dev-workflows/claude-code-adeptly-claudeskills
type: research
status: research-complete
last-validated: 2026-08-03
related-docs: 154, 441, 2127, 2142, 2150
original-query: "https://www.reddit.com/r/claudeskills/s/lLqDti8Oum research"
tier: STANDARD
---
```

# r/claudeskills - Adeptly + Claude Code Best Practices: ZAO Gap Analysis

## Key Decisions

| Decision | Recommendation | Rationale | Effort |
|----------|---------------|-----------|--------|
| Install Adeptly the tool (`npx adeptly`) | No - skip | Its "Crew" pipeline duplicates the plan->build->verify->PR flow ZAO already runs; adds a dependency against OSS-first-no-new-deps rule | Skip |
| Adopt Adeptly's feature-teaching plan annotation idea | Yes - already shipped | Annotating plan steps with which Claude Code feature fits (subagent, hook, skill, /security-review) turns plans into teaching surfaces; folded into `skill-enhancements.md` + `/plan-eng-review` | Done |
| Parameter-scoped permission allowlist in settings.json | Yes - pending Zaal approval | Current `fewer-permission-prompts` has no shape-scoped deny/allow; adding `deny git push --force*`, `rm -rf*`, `curl <non-allowlisted>` also hardens against prompt-injection chaining an allowed command | Low (settings PR) |
| Quarterly skill-prune pass | Yes - recurring discipline | 50+ skills accumulate; unused always-loaded descriptions cost context every session; the best-practices name this explicitly | Low (cleanup pass) |

---

## Findings

The Reddit post (`r/claudeskills`, user Substantial-Fuel-519, fetched via VPS fallback 2026-07-30) introduces `npx adeptly`, an MIT-licensed local companion for Claude Code (no backend, no API key, no telemetry). It packages two ideas: feature-teaching plans and an automated Crew pipeline.

**Feature-teaching plans** are the genuinely novel half. You describe what to build; Adeptly writes a structured plan and drops a one-line note on each step naming the Claude Code feature that fits it - plan mode, a subagent for parallel work, a hook for a gate that must not be skipped, `/security-review` before the PR opens. The plan becomes a teaching surface. As more ZAO teammates pick up Claude Code, plans that explain the reach-for-the-right-tool instinct compound in value without extra onboarding.

**The Crew pipeline** (Architect -> Approval Gate -> Builder -> Medic -> Reviewer -> Security -> Pilot) is a dry-run-by-default executor; going live requires both an approved markdown plan AND `ADEPTLY_LIVE=1`. It mirrors ZAO's existing PR-only + human-merge circuit breaker (agent-loops rule 8) so precisely that adopting the tool would duplicate the fleet, not improve it. The idea validates the architecture; the package adds a dependency.

### Options comparison

| Idea / Option | Description | ZAO fit | Effort |
|---------------|-------------|---------|--------|
| Adeptly tool install | `npx adeptly` - runs Crew pipeline in your repo | Duplicate of hand-run plan->build->verify->PR; new dep | Skip |
| Feature-teaching annotations (Adeptly idea #1) | Annotate each plan step with which Claude Code feature | Gap is real; already shipped in `skill-enhancements.md` | Done - one prompt addition |
| Param-scoped permission allowlist | `deny git push --force*`, `rm -rf*`, non-allowlisted curl shapes in settings.json | We have `fewer-permission-prompts` but not shape-scoped deny; real security uplift | Low - settings PR for Zaal to approve |
| Quarterly skill-prune pass | Retire skills that no longer earn their always-loaded description slot | 50+ skills accumulate; we skip this; cheap context win | Low - recurring cleanup |
| `/usage` per-subagent spend breakdown | Claude Code's `/usage` breaks spend down by skill/subagent/MCP | We don't watch this; adds visibility into cap burn by component | Trivial - just run `/usage` |
| Nested subagents to 5 levels (2026 capability) | Mid-2026 Claude supports deeper nesting | Cost trap the same sources flag; we cap workflow size deliberately | Skip |

The subreddit's broader advice (permissions policy maturity, skill progressive disclosure, subagent model-tiering) maps cleanly onto ZAO's existing stack. The gap is the parameter-scoped deny list and the prune discipline - both named explicitly in the best-practices and both absent from current ZAO practice.

**The real security framing** from the post is worth internalizing: the threat is not fat-fingering but prompt injection - an injected instruction in a web page or repo file chaining an ALLOWED command. Shape-scoped deny rules cut the blast radius without adding prompts.

---

## Recommended action

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Feature-teaching annotations in `/plan-eng-review` + `/plan-ceo-review` | ZOE | Done - shipped in `skill-enhancements.md` (2026-07-30) | Complete |
| Draft param-scoped deny/allow permission block for Zaal to approve (deny `git push --force*`, `rm -rf*`, curl to non-allowlisted hosts; allow constant read-only shapes) | ZOE | This week | Pending Zaal approval |
| Run skill-prune stocktake, retire dead skills from the 50+ active skill list | Zaal | Monthly / next quarterly pass | Not started |

---

## Sources

- [PARTIAL - IP-blocked on VPS, resolved via `zao-fetch-reddit` fallback on 2026-07-30; direct Reddit JSON unreachable from this host per `feedback_reddit_x_ip_block`] r/claudeskills "Most people use like 15% of Claude Code" (Adeptly, Substantial-Fuel-519) - https://www.reddit.com/r/claudeskills/s/lLqDti8Oum (liveness-verified-by-redirect-resolve-2026-07-30)
- [FULL] adeptlydev GitHub repository (ShopDevX, MIT, 55 stars, v0.7.x) - https://github.com/ShopDevX/adeptlydev (liveness-verified-2026-08-03)
- [PARTIAL - 403 on direct VPS fetch; URL confirmed from GitHub README] adeptly npm package - https://www.npmjs.com/package/adeptly (URL-confirmed-via-github-2026-08-03)
- [PARTIAL - title/highlights only via exa, full body not fetched] AIXplore "Claude Code Best Practices: Setup, Skills, Subagents, Hooks" (rundatarun.io, 2026 rewrite) - https://rundatarun.io (liveness-not-directly-verified)
- [FULL - local file] Doc 2150 prior research synthesis, ZAO monorepo - research/dev-workflows/2150-claudeskills-subreddit-advice/README.md (liveness-verified-2026-08-03)
