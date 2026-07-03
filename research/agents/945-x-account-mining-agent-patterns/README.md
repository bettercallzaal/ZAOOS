---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-06-09
superseded-by:
related-docs: "830, 829, 835"
original-query: "can we go through all of the x accounts of the links we have to see other similar posts / x articles - mine the high-signal authors from the inbox for more"
tier: DEEP
---

# 945 - X Account Mining: The Agent-Patterns the Inbox Authors Are Writing

> **Goal:** Zaal asked to mine the X accounts from the inbox for more articles like the ones he saved. X gated guest-token timelines in 2026 (can't bulk-scrape feeds keyless), so this used semantic search on the high-signal authors + their themes. Three rich clusters surfaced - all directly relevant to ZAO's agent stack.

## Method note (read first)

Keyless X *timeline* mining is dead: guest-token `UserTweets` now returns an empty timeline (verified live 2026-06-09 - X returns clear-cache instructions, zero tweets). Single tweets/articles still fetch keyless via FxTwitter. So this round used **semantic search (exa) on the authors + their topics** rather than feed-scraping. That's the keyless way to "keep searching." For exhaustive timeline mining you'd need an auth cookie or a paid API (getxapi ~$0.001/call).

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Add a cost-routing layer to ZAO's Workflow/Hermes: classify each task judgment-heavy vs execution-heavy, route to the right model** | The 0xRicker cluster's real lesson (the "$62k -> $129" articles) is NOT "Opus + Kimi" - it's the ROUTING rule: "if a clear machine-scorable rule can be written -> cheap executor; else -> Opus." ZAO runs Opus for everything. A routing layer (Opus plans/reviews, Haiku or Kimi-class executes the parallel bulk) is a 100-400x cost cut on execution-heavy fan-outs, same quality. Maps straight onto the Workflow tool's fan-out + the ZOE $50/day cap. |
| 2 | **Audit ZAO's ~50 skills against Thariq's 9 categories + 9 tips; adopt "description = trigger", "gotchas section", and PreToolUse usage-logging immediately** | Thariq's "Lessons from Building Claude Code: How We Use Skills" is the authoritative skill-authoring playbook (Anthropic, hundreds of skills in prod). It operationalizes doc 829. Three immediately actionable: (a) every skill description is a *when-to-trigger*, not a summary; (b) a Gotchas section is the highest-signal content; (c) log skill usage via a PreToolUse hook to find undertriggering skills. |
| 3 | **Validate Hermes's clean-context critic - Cognition proves a reviewer with NO shared context is SMARTER, not redundant** | Cognition's "Multi-Agents: What's Actually Working" found generator+verifier loops work BEST when the agents share no prior context (clean context dodges context-rot, forces reasoning backward from the diff). Devin Review catches ~2 bugs/PR, 58% severe. ZAO's Hermes (coder+critic) should ensure the critic starts clean, not from the coder's context. |
| 4 | **Do NOT build unstructured agent swarms - the practical shape is map-reduce-and-manage with single-threaded writes** | Both Cognition (Walden Yan) and the Kimi-swarm crowd converge here: multi-agent works when WRITES stay single-threaded and extra agents contribute INTELLIGENCE not parallel write-actions. Unstructured swarms = "a distraction." ZAO's Workflow tool (pipeline/parallel with a synthesis stage) already follows this; keep it. |

## Findings - three clusters

### Cluster A - Opus-orchestrator + cheap-executor + a routing layer (mined from 0xRicker)

The post Zaal saved (0xRicker, "300 agents built a SaaS," doc 830) is one node in a whole movement. The deeper articles (BestHub + Medium "$62,000 -> $129", zenn.dev Claude x Kimi hybrid):

- **Architecture:** Opus 4.8 = brain (plan, judgment, quality control); Kimi K2.6 Agent Swarm = hands (300 parallel sub-agents, up to 4,000 steps, SWE-Bench Pro 58.6%, **$0.6/M tokens**). Kimi's own orchestrator is good at task decomposition but NOT high-level design - so Opus owns "what to build," Kimi owns "build it."
- **The actual unlock is the routing layer:** classify every task first - judgment-heavy (no clear rubric -> Opus) vs execution-heavy (clear machine-scorable output spec -> cheap executor). "$62k -> $129" came from the routing, not just the model swap.
- **Discipline that makes it safe:** Opus emits a `spec.md` (file paths, validation commands, completion criteria) so the executor doesn't wander; executor works on an isolated branch; Opus reviews against a quality rubric before merge. The BestHub piece ships 15 concrete prompts (plan / classify / rubric / review / assemble / handoff-template / cost-tracking) - a ready-made orchestration kit.
- **ZAO fit:** this is a cost optimization for the Workflow tool + Hermes/ZOE. Today ZAO fans out Opus agents; routing the execution-heavy ones to Haiku (or a Kimi-class model) keeps quality and slashes cost on big drains like doc 832 (the 84-item re-fetch ran 22 Opus-class agents - prime routing candidate).

### Cluster B - Thariq's skill-authoring playbook (mined from trq212) - operationalizes doc 829

"Lessons from Building Claude Code: How We Use Skills" (Anthropic, hundreds of skills in prod):

- **9 skill categories:** (1) Library/API Reference, (2) Product Verification, (3) Data Fetching/Analysis, (4) Business Process/Team Automation, (5) Code Scaffolding/Templates, (6) Code Quality/Review, (7) CI/CD/Deployment, (8) Runbooks (symptom -> multi-tool investigation -> report), (9) Infrastructure Operations.
- **9 authoring tips:** don't state the obvious (push Claude out of defaults - e.g. the frontend skill kills Inter font + purple gradients); **Gotchas section is the highest-signal content**; use the file system + progressive disclosure (skill = folder, point to `references/*.md`); avoid railroading (give goal + constraints, not step-by-step); think through setup (`config.json` + AskUserQuestion for missing context); **the description field is the model-facing "when to trigger," not a summary**; memory via `${CLAUDE_PLUGIN_DATA}` (survives upgrades); store scripts so Claude composes instead of reconstructing boilerplate; on-demand hooks (`/careful` blocks rm -rf/DROP TABLE/force-push; `/freeze` blocks edits outside a dir).
- **Distribution:** check into `.claude/skills` (small teams) or a plugin marketplace (scale); curate before release to avoid redundancy; reference other skills by name to compose them.
- **Measurement:** a PreToolUse hook logs skill usage -> find popular + undertriggering skills.
- **ZAO fit:** the operating manual for ZAO's skill library. The fetch trio + `/inbox` + `/zao-research` already match categories 1/2/3/8. Action: add a Gotchas section to each, rewrite descriptions as triggers, and wire usage-logging.

### Cluster C - Cognition's "multi-agent that actually works" (mined from walden_yan) - validates Hermes/ZOE

Walden Yan's "Multi-Agents: What's Actually Working" (2026-04-22, the sequel to "Don't Build Multi-Agents"):

- **Core finding:** multi-agent works today when **writes stay single-threaded** and extra agents contribute **intelligence, not actions**. Parallel writers still fragment decisions (style/edge-cases conflict).
- **The code-review loop "so stupid it shouldn't work":** generator + verifier where they share NO context beforehand. Clean context makes the reviewer *smarter* - dodges context-rot (attention math degrades long-context decisions), forces reasoning backward from the diff, openly questions choices. Devin Review: ~2 bugs/PR, 58% severe. The communication bridge back to the coder (filtering bugs against user intent) is what prevents looping.
- **"Smart Friend":** a smaller primary calls out to a bigger model when stuck. Works well *cross-frontier* (Claude + GPT as a capability router - some debug better, some test better). The weak-primary -> strong-helper version (the big cost unlock) is still an open training problem.
- **Higher-level delegation = map-reduce-and-manage:** a manager splits scope, children execute, manager synthesizes. Unstructured swarms are "a distraction."
- **ZAO fit:** direct validation of Hermes (coder + critic) and ZOE (workers + critics). Two upgrades: (1) make the critic clean-context, (2) the "smart friend" pattern = a ZOE worker on Haiku that consults Opus on hard calls (the cost-routing tie-in to Cluster A).

## ZAO Application (cross-cluster)

The three clusters converge on one ZAO move: **a routed, single-threaded-write, clean-context-critic agent system, packaged as well-authored skills.** ZAO already has the shape (Workflow tool, Hermes, ZOE, skill library). The deltas: add cost-routing (Cluster A), apply the skill playbook (Cluster B), make critics clean-context + add a smart-friend router (Cluster C).

## Also See

- [Doc 830](../830-ai-coding-agent-discourse-inbox-cluster/) - the inbox cluster where 0xRicker/Thariq first surfaced
- [Doc 829](../829-anthropic-agent-skills-talk/) - Anthropic Skills talk (Cluster B's foundation)
- [Doc 835](../../governance/835-deep-funding-ai-pgf/) - "AI proposes, jury checks" (same review-rung pattern)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Prototype a cost-routing layer for the Workflow tool: classify execution-heavy stages -> Haiku, judgment -> Opus | @Zaal | Build | Next sprint |
| Audit ZAO's ~50 skills vs Thariq's 9 categories + add Gotchas sections + trigger-style descriptions | @Zaal | Skill hygiene | Pre-July |
| Make Hermes critic clean-context (no shared coder context); add a smart-friend Haiku->Opus consult to ZOE | @Zaal | Agent infra | Ongoing |
| Keep mining: cyrilxbt, shawmakesmagic, shannholmberg, eng_khairallah1 next round (cookie or getxapi if timeline depth needed) | @Zaal | Research | Ad hoc |

## Sources

- [Cognition - Multi-Agents: What's Actually Working](https://cognition.ai/blog/multi-agents-working) `[FULL - exa web_fetch; clean-context review, smart-friend, map-reduce-and-manage, single-threaded writes]`
- [Thariq - Lessons from Building Claude Code: How We Use Skills (GitHub mirror)](https://github.com/shanraisshan/claude-code-best-practice/blob/main/tips/claude-thariq-tips-17-mar-26.md) `[FULL - exa web_fetch; 9 categories + 9 tips + distribution/measurement]`
- [BestHub - Cut Dynamic Workflows cost $62k -> $129](https://www.besthub.dev/articles/how-to-cut-dynamic-workflows-costs-from-62-000-to-129-with-ai-agents-e3957ed032ce) `[FULL - exa web_fetch; routing layer + 15 orchestration prompts + cost math]`
- [zenn.dev - Claude Code x Kimi K2.5 hybrid (Opus designs, Kimi implements)](https://zenn.dev/shimo4228/articles/claude-kimi-hybrid-setup?locale=en) `[FULL via exa highlight; spec.md handoff, isolated branch, Claude review before merge]`
- [Cognition - Don't Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents) `[FULL via exa highlight; the original context-engineering principles]`
- [Latent.Space - Walden Yan / The Age of Async Agents](https://www.latent.space/p/cognition) `[PARTIAL via exa highlight; podcast - brain/machine separation, repo setup, multi-agent maturity]`
- [Thariq pinned writing thread (Rattibha mirror)](https://en.rattibha.com/thread/2035372716820218141) `[FULL via exa highlight; "skills are the abstraction all agents build on", bash is all you need, file system, prompt caching]`
- Live test 2026-06-09: guest-token X timeline mining returns empty (verified the keyless-timeline wall) `[FULL - primary; UserTweets returned 0 entries]`
