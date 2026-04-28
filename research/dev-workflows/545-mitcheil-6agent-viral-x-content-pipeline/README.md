---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 419, 432, 432-zao-master-context, 502, 503
tier: STANDARD
---

# 545 — MitcheIl's 6-Agent Viral X Content Pipeline (Apr 2026)

> **Goal:** MitcheIl claims 100M+ views in 6 months for tech startups using a 6-specialized-agent Claude Code pipeline. Decide if it's worth replicating for ZAO + BCZ X content (RaidSharks, ZAOstock, Empire Builder).

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Replicate the 6-agent structure** | USE — partial. Build a `bcz-content-pipeline` agent system on VPS 1 with 4 of 6 agents (Hook, Script, Critic, Diagram). Skip "internet scan via paid X API" + "5,000 post pull" until ROI proven. | Already have `RaidSharks` + Empire Builder for amplification; pipeline upstream is the gap. |
| **Single-job-per-agent pattern** | USE — formalize as ZAO content rule. Each agent has one input/output contract + hard 10/10 numeric scoring gate. | Mirrors `gan-generator` + `gan-evaluator` skills already installed. |
| **5,000 post research sweep via paid X API** | SKIP — for now. Use `exa` MCP semantic search + `mcp__plugin_everything-claude-code_exa__web_search_exa` instead. Free + already integrated. | X API basic tier costs $200/mo and rate limits hard. Exa covers cross-posts on Substack/Medium. Re-evaluate if content volume scales 10x. |
| **Google Docs as output target (Research / Working / Final tabs)** | USE — adopt structure. Output to Google Drive via existing `mcp__claude_ai_Google_Drive__*` tools. | Already have Google connectors authed. Lets Zaal review iteration history live. |
| **Hard numeric gates (4 hooks × 3 iterations × 5D scoring)** | USE — bake into the BCZ pipeline as eval criteria. | Aligns with `eval-harness` + `gan-style-harness` skills. |
| **Copy-paste-ready 4 hooks + 2 CTAs at end** | USE — every BCZ content deliverable should ship with this packaging. | Removes Zaal's manual "what do I post?" step. |
| **Content topics queue** | USE — start with: ZAOstock launch, Cipher release, ZAO 101 agent demos, Hermes shipping cadence, Quad multi-agent dev fleet | Highest-leverage upcoming announcements. |

## Source

| Field | Value |
|-------|-------|
| Author | MitcheIl (@MitcheIl) |
| Posted | 2026-04-23 |
| Article | https://www.xrticles.com/article/i-turned-my-client-into-a-millionaire-using-claude-code |
| Title | "How I Use Claude Code To Hit #1 Trending On X" |
| Tweet engagement | 939 likes / 393K views / 68 retweets / 212 replies |
| Claimed results | 2M avg views/video, 50M total views, #1 trending X hits, "client into a millionaire" |

## The 6-Agent Pipeline (verbatim structure)

1. **Internet Scan Agent** — pulls 5,000 X posts via X API, ranked by engagement signals
2. **Hook Generation Agent** — synthesizes 4 hook variants per topic, 3 iterations each, scored on 5 dimensions (curiosity, novelty, specificity, emotional pull, controversy)
3. **Script Writing Agent** — turns chosen hook into full script
4. **Diagram Agent** — generates supporting visual or thumbnail concept
5. **Critic Agent** — line-by-line scoring on 2 dimensions (clarity + impact); blocks ship until 10/10
6. **Output Agent** — writes to Google Doc with 3 tabs: Research (raw data) / Working Script (full iteration history) / Final Script (4 hooks + 2 CTAs ready to copy)

**Key principle:** each agent has one job, one input shape, one output shape, one numeric pass/fail gate.

## Why This Maps Well to ZAO/BCZ

| Have already | Maps to MitcheIl agent |
|--------------|------------------------|
| `RaidSharks` Telegram raids + ZABAL distribution | downstream amplification (post-pipeline) |
| Empire Builder V3 (in-progress per `project_raidsharks_empire_builder.md`) | downstream amplification |
| `socials` skill (cross-platform posting) | output formatter |
| `crosspost` skill | distributor |
| `brand-voice` skill | hook generator (Zaal's voice) |
| `content-engine` skill | most of pipeline |
| `gan-generator` + `gan-evaluator` skills | Critic agent |
| `eval-harness` skill | numeric scoring gates |
| Hermes (just shipped sprint 1 cost routing) | could host the pipeline |
| `exa` MCP web search | replaces "Internet Scan via X API" |
| Google Drive MCP authed | Google Docs output |

**Gap:** there's no orchestrator wiring these into a sequential 6-stage pipeline with hard gates. That's the build.

## Comparison: Build vs Use Existing Tools

| Approach | Cost | Time-to-First-Output | Ongoing Maintenance | Quality Ceiling |
|---------|------|---------------------|---------------------|-----------------|
| Replicate full 6-agent pipeline on VPS 1 | $0 (VPS already paid) + 1 sprint dev | 1 week | Medium (ongoing prompt tuning) | High — bespoke to ZAO voice |
| Use `content-engine` skill as-is | $0 | minutes | Low | Medium — generic |
| Pay for tools like Buffer/Hypefury/Tweet Hunter | $20-50/mo | minutes | Low | Low-Medium — generic |
| Hire human content creator | $1k-5k/mo | weeks | High | Highest if creator is good |

**Recommendation:** Build a **lean 4-agent version** (Hook + Script + Critic + Output) on VPS 1 in 1 sprint. Skip Diagram (use existing `fal-ai-media` skill on demand) + Internet Scan (use exa). Iterate from there.

## Content Targets (Priority Queue for ZAO)

Topics with highest viral potential based on existing ZAO assets:

1. **Hermes shipping cadence** — multi-agent dev fleet shipping PRs autonomously is genuinely novel
2. **Quad multi-agent dev team** — 4-agent dashboard, technical demo content
3. **ZAOstock launch (Oct 3 2026)** — annual real-world music + web3 event in Ellsworth ME
4. **Cipher release (ZAO Music Entity, doc 475)** — first label release, BMI + DistroKid
5. **ZAO 101 onboarding agent live demo** — ZOE Concierge for 188 members
6. **Empire Builder V3 + RaidSharks integration** — amplification engine deep dive
7. **Zlank.online launch** — agents launching coins + running socials, OSS

Each of these is a content series, not a single post.

## Action Plan

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Sketch 4-agent pipeline architecture (Hook / Script / Critic / Output) on VPS 1 | Claude | Plan doc | This sprint |
| Identify which existing skills to compose vs which to write fresh | Claude | Audit table | Same sprint |
| Pick 1 topic from the 7 above, run pipeline E2E on it as a pilot | Zaal | Decision | This week |
| Wire Google Docs output via `mcp__claude_ai_Google_Drive__*` | Claude | Build | Sprint after architecture sign-off |
| Define numeric scoring rubric (5 dims for hooks, 2 dims for critic) | Zaal + Claude | Doc | Before pilot |
| Skip X API spend until pilot proves ROI | Zaal | Decision | Locked |
| Re-validate this doc after pilot ships first piece | Claude | Update last-validated | After pilot |

## Risks + Caveats

- **Claim verification:** "100M+ views" + "client into a millionaire" are unverified. MitcheIl's tweet has 393K views which is plausible. Take the framework, ignore the claims.
- **Voice authenticity:** Zaal's voice (per `feedback_brainstorm_before_writing.md`) requires actual brainstorm before drafting. Don't full-auto generate without Zaal's hooks.
- **Build-in-public expectation:** ZAO's existing voice is build-in-public + technical depth. MitcheIl's content style is high-engagement bait — risk of voice drift if pipeline runs on autopilot.
- **Banned content:** no em dashes, no emojis, exact brand spelling per global CLAUDE.md glossary.

## Also See

- [Doc 154 — Skills + Commands master reference](../154-skills-commands-master-reference/) — `socials`, `crosspost`, `content-engine`, `brand-voice` skills
- [Doc 432 — ZAO master positioning](../../community/432-tricky-buddha-space/) — voice + audience anchor
- [Doc 502 — RaidSharks + Empire Builder](../../) — downstream amplification engine
- [Doc 506 — TRAE AI SOLO skip](../506-trae-ai-solo-bytedance-coding-agent/) — pattern theft for plan mode + diff review

## Sources (Verified 2026-04-28)

1. [xrticles.com — I Turned My Client Into a Millionaire Using Claude Code](https://www.xrticles.com/article/i-turned-my-client-into-a-millionaire-using-claude-code) — MitcheIl's source article
2. [x.com/MitcheIl/status/2047336198990098603](https://x.com/MitcheIl/status/2047336198990098603) — original tweet
3. [Claude Code Anthropic docs](https://docs.claude.com/en/docs/claude-code/sub-agents) — sub-agent reference
4. ZAO OS skills inventory: `socials`, `crosspost`, `content-engine`, `brand-voice`, `gan-style-harness`, `eval-harness`, `exa-search`, `fal-ai-media`
