---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-21
superseded-by:
related-docs: 601, 759, 872, 875, 882
original-query: "https://github.com/KorroAi?tab=repositories"
tier: STANDARD
---

# 883 — KORRO: The AI-Run Company (GitHub Org Audit + What ZAO Steals)

> **Goal:** Audit KORRO (github.com/KorroAi) - a self-described autonomous AI company shipping weekly open-source drops - and decide what is worth pulling into the ZAO agent stack (ZOE, Hermes, autoresearch) versus what is marketing.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **INSTALL `claude-is-tripping` for ZAO ideation** | Free, no-dep, MIT. 3-agent dialectic (Visionary / Destroyer / Synthesizer + verifier) is exactly the `/plan-eng-review` + `/council` pattern ZAO already wants. Maps onto our brainstorming flow. Test on one ZAOstock decision, keep if output survives. |
| 2 | **STEAL the mue-x self-rewrite loop pattern, do NOT run mue-x in prod** | mue-x's observe -> mutate -> `ast.parse()` validate -> backup -> apply -> rollback loop is a real, verifiable design (61 Python modules in `mue/evo/`). It is the disciplined version of our `autoresearch` skill. Lift the validate+rollback discipline into Hermes' fix-PR pipeline. Running an unsupervised self-mutating agent against ZAO code violates `bot/src/zoe/` no-new-autonomous-loop rule (Doc 601). |
| 3 | **INSTALL `drunk-claude` + `claude-creativity` as optional ideation skills** | Both MIT, no-dep, ~150 + 19 stars. They are persona/technique layers over brainstorming. Low risk, additive to the `.claude/skills/` arsenal. Drunk-claude is the highest-traction repo (143 stars in ~18 days). |
| 4 | **MINE the 4 KORRO curated lists for tool picks, trust selectively** | curated-skills (12 repos), -trading (10), -bugbounty (12), -automation (12). Useful negative signal (they reject Backtrader/Zipline as abandoned). But these are AI-generated lists - verify any pick before adopting, same `feedback_no_synthesis_from_titles` rule. |
| 5 | **DO NOT model ZAO on KORRO's "zero humans" framing** | KORRO is 14-18 days old, 6 agents on OpenRouter, run-in-public marketing experiment. The "fully autonomous company" claim is unverifiable and is itself the product. ZAO's locked architecture (Doc 759: human-in-loop GATEWAY, $50/day cap, critics) is the safer bet. Watch KORRO as a competitor/peer, do not copy the no-supervision posture. |

## What KORRO Is

- GitHub user `KorroAi`, display name **KORRO**. Created **2026-06-03** (18 days old as of 2026-06-21). 11 public repos, 13 followers.
- Self-description: "A company run by AI agents. Weekly github drops." Site: **korro.me**. X: **@korro_ai** / @korrocorp. LinkedIn: korro-corp. Email: contact@korro.me.
- Claimed model: 6 named AI agents (Axel = markets/research, Nova = code audit + recon, Vex = content, Pixel = UI, plus 2) each with a personality + department, running on **frontier models via OpenRouter**, persistent processes with memory + autonomous drives, **on a server in Paris**, **zero human supervision**, building-in-public. "Day 14" on the landing page as of fetch.
- Business model surfaced: **agent-store** (50+ downloadable AI agents, $1.99 one-time, Solana payment, runs on buyer's own keys - OpenAI/Anthropic/DeepSeek/OpenRouter/Groq/Google/xAI/Ollama).

## Repo-by-Repo (11 repos, sorted by traction)

| Repo | Lang | Stars | What | ZAO relevance |
|------|------|-------|------|---------------|
| **drunk-claude** | TeX/MD | 143 | Claude Code skill - "creative persona" with intensity slider 0.1-1.0, 5 moods, 8 techniques, MIT. Has an arXiv-ready LaTeX paper. | Ideation skill. Persona layer over brainstorming. |
| **mue-x** | Python | 60 | Self-evolving agent that rewrites its own `.py` files in a continuous loop via 6 AST-level mutation strategies (repair/optimize/explore/...). Standalone CLI, Gemini + Copilot adapters. MIT. | Pattern source for Hermes + autoresearch. Verified 61 modules. |
| **claude-creativity** | TeX/MD | 19 | Claude Code skill - 15 creative techniques (Oblique Strategies, Negative Space, Time Travel, Role Swap, Synthesis...), intensity slider, `--drunk` fusion mode, MIT. | Ideation skill, sibling to drunk-claude. |
| **claude-is-tripping** | MD | 6 | "Universal Breakthrough Engine" - 3 agents (Visionary/Destroyer/Synthesizer) in a structured dialectic + internal verifier, 1-2 rounds, claims 51% token reduction, MIT, no deps/keys. | Strongest steal - matches ZAO council/plan-review pattern. |
| **korro-curated-trading** | MD | 3 | 10 trading tools "validated against live markets," rejects 15+ abandoned repos (Backtrader, Zipline). | Tool-pick reference (low for ZAO). |
| **korro-curated-skills** | MD | 2 | 12 Claude Code skill repos curated from "500K+ repos." Names anthropics/skills, obra/superpowers (the superpowers stack ZAO already runs). | Cross-check our skill stack. |
| **korro-curated-bugbounty** | MD | 2 | 12 bug-bounty tools, rejects 40+ dead tools. | Reference for ZAO security work. |
| **korro-curated-automation** | MD | 1 | 12 MCP servers / AI frameworks "that run in production." | MCP-server pick reference (see Doc 801/802). |
| **agent-store** | TypeScript | 0 | Next.js 14 marketplace, Solana checkout, license-gated downloads, 50+ agents at $1.99. | Commercial model reference, not a tool to adopt. |
| **korro-website** | HTML | 1 | korro.me landing page source. | - |
| **KorroAi** | MD | 1 | Org profile README. | - |

## Findings

### 1. The high-traction repos are creativity skills, not the agent

drunk-claude (143 stars) and claude-creativity (19) - both pure prompt/persona skills with zero dependencies - massively outpull mue-x (60) and the agent-store (0). KORRO's distribution win is **packaging brainstorming techniques as installable Claude Code skills with sliders and flags**. That is a repeatable playbook ZAO could use to package its own internal skills (autoresearch, plan-eng-review) for public distribution / ZABAL Games.

### 2. mue-x is a real, verifiable architecture (not vaporware)

Claim: "opens its own `.py` files and rewrites them in real-time... 60+ Python modules." **Verified** via git tree: 103 files total, 75 `.py`, **61 under `mue/evo/`** (absorption/, autonomy/, dna/, bootstrap, core...). The 6 mutation strategies are described as concrete AST transforms - `repair` wraps unprotected calls in try/except, `optimize` does constant folding + for-loop -> comprehension + `@lru_cache` injection on pure functions, `explore` draws from 10 pre-validated patterns (retry w/ exp backoff, circuit breaker...). Every mutation is `ast.parse()`-validated, backed up, applied, rolled back on failure. This validate-and-rollback discipline is the part worth lifting into Hermes' coder+critic loop (`bot/src/hermes/`).

### 3. The "zero humans" claim is the product, and unverifiable

The landing page leads with "We built a company. Then we fired ourselves" and "Nobody reviews their work before it ships." 14-18 days old. There is no way to verify from outside that no human is in the loop, and the claim is load-bearing marketing. ZAO's own stack deliberately keeps a human GATEWAY + 3 critics + a $50/day cap (Doc 759) - the **opposite** posture. KORRO is a useful foil: it shows the "full autonomy" extreme that ZAO chose not to take after the Doc 601 agent-stack cleanup (openclaw 7-agent squad killed for exactly this reason).

### 4. The curated lists confirm ZAO's existing stack

korro-curated-skills independently names **obra/superpowers** (the exact superpowers skill stack already wired into ZAO) and **anthropics/skills** as top picks. Mild external validation that ZAO's skill foundation is the consensus-correct one. Their rejection methodology (cut README-only repos, 6+ month-abandoned, single-file gimmicks) is sound - but the lists are AI-authored, so any specific tool pick needs verification before adoption.

### Staleness / caveats

- All data current as of **2026-06-21**. Org is 18 days old; star counts and repo set will move fast (weekly drops claimed). Re-validate in ~30 days.
- Star counts are real GitHub API values, not self-reported. Autonomy/revenue claims are self-reported and unverifiable.
- KORRO skills are NOT installed locally (`~/.claude/skills/` has none of them) - recommendations to install are proposals, not done.

## Also See

- [Doc 601](../601-agent-stack-cleanup-decision/) - why ZAO killed its 7-agent autonomous squad (the anti-KORRO decision)
- [Doc 759](../759-zoe-orchestrator-locked/) - ZOE locked architecture: human GATEWAY, critics, spend cap
- [Doc 872](../872-agent-effectiveness-steerable-feedback/) - agent effectiveness patterns
- [Doc 875](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/) - external Hermes-style setup vs ZAO Hermes (same compare-and-steal shape)
- `.claude/skills/autoresearch/SKILL.md` - ZAO's existing self-iterating loop (mue-x is the AST-validated cousin)
- `bot/src/hermes/` - target for the mue-x validate+rollback discipline

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install `claude-is-tripping` + test on one real ZAOstock/ZABAL decision; keep if output survives the Destroyer | @Zaal | Skill trial | This week |
| Install `drunk-claude` + `claude-creativity` as optional `.claude/skills/` ideation layers | @Zaal | Skill add | This week |
| Lift mue-x's `ast.parse()`-validate + backup + rollback discipline into Hermes coder+critic loop | @Zaal | PR to `bot/src/hermes/` | Next sprint |
| Cross-check `korro-curated-automation` MCP picks against Doc 801 MCP audit before adopting any | @Zaal | Research follow-up | Next sprint |
| Re-validate KORRO repo set + autonomy claims (weekly drops) | @Zaal | Re-research | 2026-07-21 |

## Sources

- [KORRO GitHub org (github.com/KorroAi)](https://github.com/KorroAi?tab=repositories) - `[FULL]` - via gh API, all 11 repos + metadata
- [drunk-claude README](https://github.com/KorroAi/drunk-claude) - `[FULL]`
- [mue-x README + git tree](https://github.com/KorroAi/mue-x) - `[FULL]` - README + recursive tree (verified 61 evo modules)
- [claude-creativity README](https://github.com/KorroAi/claude-creativity) - `[FULL]`
- [claude-is-tripping README](https://github.com/KorroAi/claude-is-tripping) - `[FULL]`
- [agent-store README](https://github.com/KorroAi/agent-store) - `[FULL]`
- [korro-curated-skills / -trading / -bugbounty / -automation READMEs](https://github.com/KorroAi/korro-curated-skills) - `[FULL]` (skills/trading/automation fully; bugbounty head only)
- [korro.me landing page](https://korro.me) - `[FULL]` - via curl, stripped HTML
- [KorroAi org profile README](https://github.com/KorroAi/KorroAi) - `[FULL]`
