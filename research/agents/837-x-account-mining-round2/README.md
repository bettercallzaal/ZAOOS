---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-06-10
superseded-by:
related-docs: "836, 830, 838, 829"
original-query: "keep mining - round 2: mine the remaining high-signal X authors (shaw, shann, cyril, khairallah, ziwen, prateek, saai, peter pang, whedon, kirill) for more agent/AI content"
tier: DEEP
---

# 837 - X Account Mining Round 2 (10 authors, 40 findings)

> **Goal:** Continue the doc-836 mining across the remaining high-signal inbox authors. Keyless semantic-search method (X timelines stay walled). 13-agent workflow, ~875k tokens. Six clusters - the field is converging hard, and several findings map directly onto ZAO's stack.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **The recurring external pattern IS ZAO's stack - "recursive orchestrator + CLAUDE.md leverage + persistent memory + clean-context review." Stop treating these as new; treat them as validation + a parts catalog** | Across 10 unrelated builders the same architecture recurs: an orchestrator that is itself an agent, driven by a high-leverage CLAUDE.md, backed by a persistent memory layer, with autonomous review loops. ZAO runs all four (Workflow tool, CLAUDE.md, memory/Bonfire, Hermes critic). The findings are a catalog of refinements to steal, not a gap. |
| 2 | **Adopt the "Obsidian/typed-folder second brain" framing for ZAO's synthesis layer (doc 838 Stage 2)** | Recurs in 4 findings (cyril, ziwen, 0xsammy, shann's gBrain at 97.6% R@5 LongMemEval). The pattern: typed folders (people/companies/projects/operations), agent reads-first then writes-back, compounds over 90 days. ZAO's memory dir + Bonfire are this; formalize the typed-folder structure. |
| 3 | **INVESTIGATE SubQ (sub-quadratic attention, 12M context, ~300x cost cut) as a future cost-routing target** | alex_whedon's SubQ claims drop-in Claude Code replacement at RULER-128K $8 vs $2,600 on Opus. If real, it changes the doc-836 cost-routing math (cheap long-context executor). Watch; verify the benchmark before betting. |
| 4 | **Steal ComposioHQ Agent Orchestrator's "reactions" pattern for Hermes** | Open-source, recursive (built by the agents it orchestrates): CI fails -> auto-spawn fix agent; reviewer comment -> route to session; approved+green -> notify. 8 swappable plugin slots. Hermes's auto-PR pipeline should adopt the reaction-router shape. |

## Findings - six clusters (40 items)

### Orchestrators as Recursive Control Planes

_10 items._ Pattern: move from serial queues to concurrent orchestrators managing 8-300 parallel agents with explicit coordination, shared memory architectures, and feedback loops that route failures back into session context. Orchestrator itself becomes an intelligent agent, creating recursive improvement where agents build the system that manages agents. This pattern enables 40K-line codebases in 8 days and 99.9% accuracy on 12.5M-line repos.

- **@shawmakesmagic** - [ai16z, ELIZA and the Bazaar of Agents](https://chainofthought.xyz/p/ai16z-eliza-and-the-bazaar-of-agents) - Plugin flywheel + trust engine for autonomous trading (risk management via liquidity checks, dynamic position sizing, holder verification). Out-of-box social integrations explain why ELIZA outcompetes cathedral approaches.
- **shannholmberg** - [gBrain + Hermes Agent: Shared Memory Architecture for Multi-Agent Teams](https://digg.com/ai/1j0kes8f) - Typed folders (people, companies, projects, operations) where agents read-first before work, write context back. Achieved 97.6% R@5 on LongMemEval. Demonstrates shared context at scale.
- **Khairallah AL-Awady (@eng_khairallah1)** - [One agent is useful. A team of agents is a competitive advantage](https://bookmark.build/curated/how-to-build-a-team-of-ai-agents-that-work-together-full-course) - Coordinator + specialists pattern: each agent owns one job, context flows explicitly, coordinator validates before handoff. Proves specialization beats generalization; mirrors high-performing company structure.
- **Prateek Kharnal (@agent_wrapper)** - [The Self-Improving AI System That Built Itself](https://yuanchang.org/en/posts/self-improving-ai-agent-orchestrator/) - Built 40K lines TypeScript in 8 days via orchestrator spawning agents. Key: agents build orchestrator, orchestrator improves agent assignment, agents improve orchestrator-recursive gain ceiling. 3,288 tests, 17 plugins, full autonomous CI self-healing.
- **Prateek Kharnal (@agent_wrapper)** - [Show HN: Agent Orchestrator - Built using the agents it orchestrates](https://news.ycombinator.com/item?id=47219229) - Reactions system: CI fails = auto-spawn fix agent, reviewer comments = route to right session, approved + green = notify. 30 concurrent agents at peak, 80+ self-merged PRs in 8 days. Pluggable (Claude Code, Aider, Codex, any runtime).
- **saaiarora** - [From Solo Coder to Command Center: How Developers Turn Claude Code Into Swarms of Parallel Agents](https://www.webpronews.com/from-solo-coder-to-command-center-how-developers-turn-claude-code-into-swarms-of-parallel-agents/) - Rakuten 12.5M-line codebase: 99.9% accuracy in 7 hours autonomously via parallel sub-agents with subagent specs, git worktrees. Pattern shifts from serial queues to concurrent control room.
- **saaiarora** - [I Built 9 Production AI Agents With Claude Code - Here Is the Complete Workflow](https://dev.to/akaranjkar08/i-built-9-production-ai-agents-with-claude-code-here-is-the-complete-workflow-2j3d) - 5-layer architecture (CLAUDE.md system prompt, 3-5 MCP servers, skills, hooks, subagents). Subagent coordination eliminates external orchestrators. 9 agents under $180/month.
- **saaiarora** - [Replicas - Background Coding Agents for Engineering Teams](https://platoseed.com/companies/replicas) - Control plane for delegating tasks to Claude Code/Codex from Slack/Linear/GitHub. Sandboxed VMs, parallelized execution, automated CI feedback. 20+ YC startups. Moat: integration depth + VM isolation + feedback automation.
- **@kirillk_web3** - [HOW AI AGENTS ACTUALLY WORK - 20 minute breakdown of Claude Agent Teams and Kimi Agent Swarm](https://instalker.org/kirillk_web3) - Comparative technical breakdown: Claude Code explicit coordination vs Kimi K2.5 learned orchestrator. Agent Teams = explicit vs Agent Swarm = learned policy-two competing architectures.
- **@kirillk_web3** - [Kimi Founder 40-Minute Masterclass - Free Architecture Deep-Dive on Agent Swarms (300 Parallel Sub-Agents)](https://instalker.org/kirillk_web3) - Open-source Agent Swarm architecture with 300 parallel sub-agents, 4000 steps, Muon optimizer (2x token efficiency). Demonstrates scaling patterns beyond traditional orchestration.

### CLAUDE.md as the Control Signal; Eliza as the Web3-Native Blueprint

_7 items._ Pattern: framework design is determined by single high-leverage configuration files (CLAUDE.md, character.json in Eliza) that encode agent personality, guardrails, and decision-making logic. Success factors in open-source frameworks like Eliza: modularity, out-of-box readiness (Discord/X/Telegram social loops), trust engines for autonomous finance, and TypeScript ecosystem fit. Vague config produces generic outputs regardless of model quality.

- **@shawmakesmagic** - [Eliza: A Web3 friendly AI Agent Operating System (ArXiv)](https://arxiv.org/html/2501.06781v2) - Formal research paper documenting Eliza design principles: web3-first, pluggable modular, simplicity-over-completeness. Compares favorably vs LangGraph, AutoGPT, CAMEL on web3 support, social media integration, multi-agent capability.
- **@shawmakesmagic** - [Shaw on Eliza Framework Evolution & Marketplace of Trust](https://www.panewslab.com/en/articles/bn6f9u6m) - Eliza = Shaw's fifth-generation framework. Success factors: out-of-box readiness, TypeScript/web3 fit, solving social loop via X/Discord/Telegram. Introduces Marketplace of Trust where agents build credibility via simulated trading performance.
- **@shawmakesmagic** - [Shaw's Personal Essays: Eliza Labs vs X, Multi-Agent Boredom](https://shaw.codes/) - Documents Eliza Labs lawsuit against X (demanded $600k/year API licensing). Explores cringeloops in multi-agent simulations: agents trapped in orchestrated turn-taking rather than emergent behavior. Frames Eliza as path to autonomous agent DAOs.
- **cyrilxbt** - [The Complete Hermes Agent Setup Guide (Masterclass)](https://www.newsletter.datadrivenvc.io/p/mega-funds-take-over-seed-emerging-managers-rebound-fee-vs-carry-hermes-agent-masterclass-more) - CLAUDE.md identified as single leverage point across all workflows. Vague config produces generic outputs regardless of model quality. Persistent SQLite memory + Markdown skill system + configurable scheduler = 90-day compounding where accumulated decision history becomes irreplaceable.
- **@intuitiveml (Peter Pang, CREAO CTO)** - [Why Your Company's 'AI-First' Strategy Might Not Be Real AI-First](https://www.besthub.dev/articles/why-your-company-s-ai-first-strategy-might-not-be-real-ai-first-d371dc9aa07f) - Distinguishes 'AI-assist' (10-20% gains) from true 'AI-first' architecture redesign. CREAO case study: 99% code AI-written, 3-8 daily deployments, unified monorepo, Claude Opus 4.6 three-pass code review (quality/security/dependencies), self-healing loop.
- **@intuitiveml (Peter Pang, CREAO CTO)** - [Peter Pang, Co-Founder and CTO of CREAO – Interview Series](https://www.unite.ai/peter-pang-co-founder-and-cto-of-creao-interview-series/) - Core thesis: closed-loop AI systems (observe-act-learn-improve) build tools then execute them vs copilots (one-shot). Harness wraps agents into self-improving engines. One architect + agents achieves 100+ person workload. Real competition is execution layer, not model.
- **shannholmberg** - [5 Levels of AI Marketing: From Prompts to Agent Teams](https://www.teamday.ai/ai/holmberg-5-levels-ai-marketing-agents) - Level 3 (skills + brand foundation) = critical inflection where AI stops reading as AI because judgment is baked in. Level 5 shows 38 agents across 8 departments sharing centralized knowledge base with compounding intelligence.

### Obsidian as Agent Brain; Sparse Attention as Cost Inversion

_8 items._ Pattern: agent knowledge compounds when paired with semantic memory layers (Obsidian vaults, gBrain typed folders, Bonfire graphs). Long-running agents fail not from missing answers but missing context-transformer context limits are the hard ceiling. SubQ's sparse attention enables true persistent agent memory, reducing cost 300x and fundamentally inverting agent architecture economics: when context is cheap and fast, no need for RAG pipelines or hand-authored orchestration logic.

- **cyrilxbt** - [Hermes + Obsidian Second Brain Integration](https://www.0xsammy.com/p/the-agentic-future-060226-three-must) - Guide to wiring Obsidian as semantic memory layer for Hermes agents. Agent reads/writes to local vault, every output feeds back as context for next execution. Solves persistent-context problem separating day-1 from day-90 agents.
- **cyrilxbt** - [I Post Every Day. No Team. No Agency. Just Obsidian + Claude. Here Is the Exact System.](https://bookmark.build/curated/i-post-every-day-no-team-no-agency-just-obsidian-claude-here-is-the-exact-system) - Operationalizes Claude as content generation engine using Obsidian vault as persistent knowledge base. Weekly connection prompts surface non-obvious cross-domain patterns. System compounds over time as vault grows richer.
- **ziwenxu_** - [How to Build Codex Knowledge Vault That Gets Smarter Every Day Without You Doing Anything](https://x.com/ziwenxu_/status/2053241837453029439) - 5-layer neural structure (AGENTS.md, inbox, notes, ideas, projects) where agents autonomously ingest bookmarks daily. Treats knowledge vaults as evolving organisms rather than static filing cabinets, eliminating context debt.
- **ziwenxu_** - [Hyperclaw: Mission Control UI for AI Agents](https://vibepicked.com/p/392638/hyperclaw/) - Open-source unified dashboard for orchestrating multiple agent instances with live persona editing and Obsidian-style 2D knowledge graph visualization to inspect and debug agent internal state.
- **@alex_whedon** - [Have you ever run an agent for 9 hours and it forgot a critical constraint from hour one?](https://x.com/alex_whedon) - Core insight: long-running agents fail from missing context, not missing answers. RAG and complex memory cannot fix transformer context limits-SubQ's sub-quadratic sparse attention enables true persistent memory.
- **@alex_whedon** - [How SSA Makes Long Context Practical](https://subq.ai/how-ssa-makes-long-context-practical) - Enterprise agent failures are distributed-evidence problems (codebases, contracts, long-running sessions). When context is truly reliable, no RAG pipelines, context compaction, or hand-authored orchestration logic needed-model reasons reliably across millions of tokens.
- **@alex_whedon** - [Subquadratic's SubQ: A 12-Million-Token LLM and a New Math Claim](https://ap7i.com/posts/subquadratic-subq-12m-context/) - Agent product economics invert at scale: 300x cost reduction (RULER 128K: $8 vs $2,600 on Opus). SubQ Code as drop-in for Claude Code/Codex changes agent architecture when context is cheap-bottleneck shifts from tokens to quality of reasoning over full codebase.
- **@alex_whedon** - [Demystifying subQ - A Field Guide: Plug-and-Replace Agentic Positioning](https://subq.mildlyconcerning.com/) - SubQ positions as model-level agent-capable (not just longer context for agents), with routing smarts to handle existing Claude Code/OpenClaw/Hermes workflows as-is.

### Skills as Composable Workflows; Plugin Marketplace as Skill Economy

_4 items._ Pattern: skills are discoverable folders with scripts, assets, templates, and data that agents execute rather than read. Not markdown files you drop in-they're first-class executable packages. Claude plugin marketplace (2026) has millions of users and minimal supply: bundle 5-8 commands targeting specific roles; quality bar is output user couldn't reach in 20-30 min of self-prompting. Revenue model: $49-149 one-time or $9-29/month projects $3k+/month per plugin by month 3.

- **shannholmberg** - [Every Skill Type Worth Building: 9 Categories](https://threadreaderapp.com/user/shannholmberg) - Corrects misconception that skills are markdown files-reveals they're discoverable folders with scripts, assets, templates, data that agents execute. References Anthropic engineer publishing structural breakdown.
- **Khairallah AL-Awady (@eng_khairallah1)** - [How to Build & Sell Claude Plugins That Generate Passive Income](https://bookmark.build/curated/how-to-build-sell-claude-plugins-that-generate-passive-income-full-course) - Claude plugin marketplace launched early 2026, millions of users, minimal supply. Bundle 5-8 commands per role. Quality: output unachievable in 20-30 min self-prompting. $49-149 one-time or $9-29/month. Projected $3k+/month per plugin by month 3.
- **shannholmberg** - [Claude Superpowers for Marketers](https://threadreaderapp.com/user/shannholmberg) - Superpowers framework enforces 5-stage pipeline before building: brainstorm, lock spec, task breakdown, subagent execution, review. Forces structured thinking rather than vibe-coding; 83K GitHub stars, applicable beyond developers.
- **@kirillk_web3** - [Nvidia Computex 2026 Jensen Huang Keynote + 7 Free Kimi Skills Guide](https://topicdigg.com/x/kirillk_web3/2061403635506966910) - 12-minute Jensen Huang breakdown of where agents/robots are heading. Paired with complete guide to 7 free Kimi Skills. Signal: Future of coding is skills + agents, not individual tools.

### Autonomous Code Review, CI Feedback, Compounding Decision History

_6 items._ Pattern: move from single-pass autonomous execution to recursive improvement loops where agent output feeds back into next iteration's context. Autonomous code review (700 comments, 69% bot, 30% agents, 1% human) outpaces human reviewers. Recovery rate (convergence on second/third attempt) matters more than first-pass accuracy. Agents learn by accumulating decision history-SQLite logs become competitive asset after 90 days. CREAO achieved 6-week PM cycles -> 2 hours; ZAOstock-scale iteration velocity requires closing this loop.

- **Prateek Kharnal (@agent_wrapper)** - [Self-Improving AI System via Autonomous Code Review and Self-Healing CI](https://www.linkedin.com/pulse/self-improving-ai-system-built-itself-prateek-karnal-760oc) - Fully autonomous code review: 700 comments (69% Bugbot, 30% agents, 1% human). PR #125 dashboard: 12 CI failure cycles with zero human intervention. ao-52 logs outcomes, runs retrospectives, learns which task prompts succeed first-try vs need guardrails.
- **saaiarora** - [Replicas Grading Product Backlog with Autonomous Pass](https://www.linkedin.com/posts/saaiarora_we-gave-replicas-our-entire-backlog-activity-7462187361184161793-fvaD) - 50% backlog merged on first autonomous pass; 15% needed tiny fix; 23% converged after iteration. Recovery rate (convergence) matters more than one-shot accuracy. Codebases mostly maintain themselves, catching bugs and shipping routine fixes autonomously.
- **Khairallah AL-Awady (@eng_khairallah1)** - [I tested 500+ prompts, and these are the 40 that produce expert-level output every single time](https://threadnavigator.com/author/eng_khairallah1/) - Distilled 500+ tested prompts to 40 high-signal patterns. Situation-first briefs (41% improvement per Anthropic internal testing), reasoning-demand framing, expert-multiplier perspective, financial-planning scaffolds. Prompt structure matters over creativity.
- **Prateek Kharnal (@agent_wrapper)** - [Agent Orchestrator - The Orchestration Layer for Parallel AI Agents](https://github.com/ComposioHQ/agent-orchestrator) - Reactions system: CI fails = auto-spawn fix agent, reviewer comments = auto-route, approved + green = notify. Session lifecycle from GitHub issue to merged PR fully observable via Next.js dashboard with real-time SSE + live terminal.
- **@intuitiveml (Peter Pang, CREAO CTO)** - [真正的 AI 优先公司：99% 代码由 AI 编写，迭代仅需 1 天 (Real AI-First Company: 99% Code AI-Written, Iteration in 1 Day)](https://gitcode.csdn.net/69f9f0a854b52172bc71e9ff.html) - Feature cycles: conception to A/B testing to kill-or-iterate within same day (previously 6 weeks). 25-person team (10 engineers) achieves 100+ person output. PM cycles (weeks->2 hours), QA (3 days->parallel AI), labor (100x reduction). Monorepo prerequisite.
- **@intuitiveml (Peter Pang, CREAO CTO)** - [Harness时代AI-First的组织架构：从信任人到信任AI (Harness-Era AI-First Org Architecture)](https://www.xiaoyuzhoufm.com/episode/6a13923cfe904f3873c51d2b) - Podcast: organizational transformation requires guardrails/verification to enable trust. Architect value shifts to finding AI planning defects. Junior engineers adapt faster than seniors (no decade of code identity to unlearn).

### When Agents Are Builders; Content, Trading, Analysis Becomes Native to Execution

_5 items._ Pattern: agent-native production flips the model from 'AI-as-tool' to 'AI-as-executor.' Content generation at scale (daily posts, video frames, trading signals) becomes native to agent output loops rather than human input. Pattern recognition templates (whale DCA behavior, price lags, narrative cohorts) are reproducible across domains. Agent-native video production manipulates frames via HTML/CSS/browser APIs rather than asking for manual edits. Success requires tooling audit (60+ tools evaluated), build-order discipline, and autonomous execution with recovery patterns.

- **cyrilxbt** - [Smart Money Wallet Tracking: Following Whale Behavior](https://threadreaderapp.com/thread/1659219221857828864) - Demonstrates applied pattern matching across cryptographic data: tracking DCA behavior, identifying timing edge (buy downside vs pump), comparing holdings across protocol narrative cohorts. Reproducible pattern-matching template for any domain where behavioral data signals intent.
- **Khairallah AL-Awady (@eng_khairallah1)** - [I spent 100+ hours testing AI tools so you do not have to](https://threadnavigator.com/thread/2037816689665147355/) - Hands-on evaluation of 60+ AI tools across 9 categories (coding agents, frameworks, MCP servers, skills, local models, automation, RAG, infrastructure). Filtered for real workflows. Includes structured build-order recommendations for developers, creators, product builders.
- **@kirillk_web3** - [Fast Copy Bot - $294K Revenue Trading Bot Built with Claude in 40 Minutes](https://vibepicked.com/p/269734/fast-copy-bot/) - Polymarket latency arbitrage bot exploiting BTC contract price lags every 5 minutes. Detects lag, enters before repricing, exits after catch-up. Demonstrates Claude as practical tool for building autonomous trading agents with measurable revenue.
- **ziwenxu_** - [Agent-Native Video Production: From AI Tools to Agent Manipulation](https://x.com/ziwenxu_/status/1784742527634903041) - Video editing careers ending as production crosses from AI-tool-suggestions to agent-native manipulation where agents directly control frames via HTML/CSS/browser APIs, rendering MP4s headlessly without manual interaction.
- **ziwenxu_** - [Maxxer Academy: 50 Skills to Outperform 99% of People](https://maxxer.academy/) - Production-grade playbooks for agent business building: Mission Control pattern (sub-agents under coordinator), MEMORY.md persistence, SkillGuard security. Tools scale as agents gain more capabilities.

## Top Picks (deep-read these)

- [ComposioHQ Agent Orchestrator (Show HN) - recursive control plane, reactions system](https://news.ycombinator.com/item?id=47219229)
- [Hermes Agent setup masterclass - CLAUDE.md leverage + 90-day compounding memory](https://www.newsletter.datadrivenvc.io/p/mega-funds-take-over-seed-emerging-managers-rebound-fee-vs-carry-hermes-agent-masterclass-more)
- [SubQ 12M-token context - 300x cost inversion claim](https://ap7i.com/posts/subquadratic-subq-12m-context/)
- [Hermes + Obsidian second-brain integration](https://www.0xsammy.com/p/the-agentic-future-060226-three-must)

## ZAO Application

- **Validates the doc-836 thesis at 2x the sample:** ZAO is architecturally aligned with the frontier of agent builders. The deltas are refinements (reactions router, typed-folder memory, SubQ cost-routing), not a rebuild.
- **Note - "Hermes Agent" appears externally** (cyril/shann/0xsammy reference a "Hermes Agent" framework). Either coincidental naming or a parallel project; worth a quick check whether it relates to ZAO's Hermes or is a naming collision to be aware of in branding.
- **Feeds doc 838:** these 40 findings are exactly the "capture" the pipeline is built to process. Round 2 doubled the corpus; the synthesis layer (this doc + memory + Bonfire) is where it compounds.

## Also See

- [Doc 836](../836-x-account-mining-agent-patterns/) - round 1 (3 clusters)
- [Doc 838](../../dev-workflows/838-media-capture-distribute-pipeline/) - the capture/distribute system this feeds
- [Doc 830](../830-ai-coding-agent-discourse-inbox-cluster/) - the original inbox cluster

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Deep-read the 4 top picks; pull the reactions-router + typed-folder-memory patterns into Hermes/ZOE | @Zaal | Research | Next sprint |
| Verify SubQ's 12M-context / 300x-cost claim before any cost-routing bet | @Zaal | Verify | Ad hoc |
| Check whether external "Hermes Agent" relates to ZAO Hermes or is a naming collision | @Zaal | Check | Ad hoc |

## Sources

40 findings from 10 authors via keyless semantic search (exa), 2026-06-10. Each carries its source URL inline above. `[FULL/PARTIAL mix - exa search highlights + web_fetch; per-item signal captured. Timelines stayed walled (doc 836 method note).]`
