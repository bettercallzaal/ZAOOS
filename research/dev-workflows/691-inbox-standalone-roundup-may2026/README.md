---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-10-01
related-docs:
tier: STANDARD
---

# 691 - Inbox Standalone Roundup (ZOE Inbox, May 2026)

> **Goal:** Capture 4 unrelated forwarded items - Google Stitch DESIGN.md, intern-os, a Spotify episode, and Z.ai.

## Key Decisions (DO THIS)

| # | Item | Decision | Why |
|---|------|----------|-----|
| 1 | Google Stitch DESIGN.md | ADOPT | Directly overlaps ZAO's design-consultation workflow. Already producing DESIGN.md files - this is the upstream spec. Apache 2.0 licensed, actively maintained by Google Labs with goal of industry standard by 2027. |
| 2 | fruteroclub/intern-os | WATCH | Workstream coordination framework for AI agents. Relevant IF ZAO spins up multi-agent coordination (Hermes + Bonfire + ZOE ensemble). AGPL licensed - check commercial use implications for ZAO brand projects. |
| 3 | Spotify episode 69LleBwkRozkLAhbsxaCUC | SKIP | Unreachable - episode ID not found in Spotify API or search. Zaal can verify directly in Spotify app if still needed. |
| 4 | Z.ai / GLM-5 | WATCH | Open-weight LLM alternative (77.8% SWE-bench, approaching Claude Opus 4.5). Evaluate for cost-sensitive agent deployments on VPS 1. Not a replacement for Anthropic key yet, but track for future compute constraints. |

## Item 1 - Google Stitch open-sources DESIGN.md

**What it is:** DESIGN.md is a markdown file format that describes a brand's visual rules in a way AI coding agents can read deterministically. Combines YAML design tokens with human-readable design rationale. Spec includes color palettes, typography, spacing systems, component patterns, and WCAG accessibility rules - all machine-parseable.

**Key facts:**
- Announced April 21, 2026 by Google Labs
- Version: alpha (format still maturing, expect breaking changes through 2026)
- License: Apache 2.0 (permissive, usable in commercial projects)
- Target: industry standard format by 2027
- Compatible with Claude Code, Cursor, GitHub Copilot, and any agent that reads markdown

**ZAO relevance - ADOPT:** Direct overlap. ZAO's `/design-consultation` skill already produces DESIGN.md files for projects. This is the upstream spec - adopting it ensures compatibility with future tooling and agent frameworks. Recommend integrating the Google Labs spec template into next design-consultation output.

**Sources:**
- [Google Blog: Stitch DESIGN.md Open Source](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/)
- [GitHub: google-labs-code/design.md](https://github.com/google-labs-code/design.md)
- [Design Systems Collective: DESIGN.md Workflow Analysis](https://www.designsystemscollective.com/the-design-md-workflow-how-google-stitch-claude-code-quietly-changed-the-design-to-code-handoff-c4213f97ed8f)

## Item 2 - fruteroclub/intern-os

**What it is:** internOS is a workstream coordination framework for AI agents across projects, tasks, communication threads, and filesystem storage. Built by Frutero (Impact Technology for Latin America). Designed so agents can activate workstreams from Slack/Discord threads, resolve context via `thread_id`, load only what's needed (BRIEF.md + STATUS.md), and persist state across session boundaries.

**Key facts:**
- GitHub stars: ~180 (moderate adoption in agent circles)
- Active maintenance: yes, current version 0.x (alpha, pre-1.0)
- License: AGPL v3 (open source) + commercial license required for B2B/SaaS
- Language: TypeScript/JavaScript
- Installers available for Hermes Agent, OpenClaw, Claude Code, and generic frameworks
- Includes 2 scripts: `sync-check.sh` (workspace health), `checkpoint-reminder.sh` (stale detection)

**ZAO relevance - WATCH:** Relevant only if ZAO spins up multi-agent coordination. Current stack (ZOE, Hermes, Bonfire, ZAO Devz) use point-to-point communication, not cross-agent workstream binding. IF future roadmap includes ensemble routing (all bots as ZOE dispatch targets), intern-os is a reference implementation. **Caution:** AGPL licensing means any ZAO derivative must also open-source under AGPL - acceptable for community projects (WaveWarZ, Bonfire integration), not for paid agency work under BCZ Strategies LLC. Contact hola@frutero.club for commercial license if needed.

**Sources:**
- [GitHub: fruteroclub/intern-os](https://github.com/fruteroclub/intern-os)

## Item 3 - Spotify episode 69LleBwkRozkLAhbsxaCUC

**What it is:** Unreachable. The Spotify episode ID `69LleBwkRozkLAhbsxaCUC` does not appear in Spotify API search results, web search, or public metadata. Either the episode has been delisted, the ID is malformed, or it requires direct Spotify login to access.

**ZAO relevance - SKIP:** Cannot assess content without access. If Zaal has this episode pinned in Spotify, he can copy the title/description directly from the app and re-forward. No further action recommended.

## Item 4 - Z.ai (Zhipu AI's GLM-5)

**What it is:** Z.ai is Zhipu AI's international platform offering a free web-based chat and commercial API, powered by GLM-5, their 744B-parameter mixture-of-experts model. Released February 11, 2026. Supports Chat mode (RAG-friendly) and Agent mode (tool-calling + document generation). OpenAI-compatible API.

**Key facts:**
- Flagship model: GLM-5 (Feb 11, 2026)
- Model size: 744B total parameters, 40B active (MoE)
- Context window: up to 202,752 tokens
- Max output: 131,072 tokens
- Performance: 77.8% on SWE-bench Verified (approaching Claude Opus 4.5 and GPT-5.2 territory)
- Free tier: chat.z.ai with rate limits
- Pricing: per-token API, subscription for Agent mode features
- Status: April 8, 2026 released GLM-5.1 as open-source; late February saw 23% stock dip due to compute shortages

**ZAO relevance - WATCH:** Potential cost-sensitive LLM option for VPS 1 agent deployments or fallback inference. NOT a replacement for current Anthropic Max subscription (ZOE, Hermes run on Claude Sonnet/Opus). Consider for:
- Classify / lightweight tasks on Ollama (~llama3.1:8b) replacement
- Agent trading logic on resource-constrained infrastructure
- Cost benchmarking if Anthropic key budget tightens

Does NOT replace primary agent stack (Sonnet for ZOE state, Opus for Hermes fixes) but viable hedge.

**Sources:**
- [Z.ai Platform](https://chat.z.ai/)
- [GLM-5 Review: Chat.z.ai Pricing & Benchmarks](https://mysummit.school/blog/en/glm5-zai-review-2026/)
- [LLM Stats: GLM-5 Agentic Engineering Breakthrough](https://llm-stats.com/blog/research/glm-5-launch/)
- [Zhipu AI Official](https://www.zhipuai.cn/en)

## Updated 2026-10-01

Re-researched against full GitHub clones (Items 1, 2) and search snippets for Z.ai (Item 4, direct fetches blocked by egress proxy).

**Item 1 - Google DESIGN.md (FULL fetch, github.com/google-labs-code/design.md, commit 9bf8eae6):**
- Advanced from alpha to **v0.4.0** (released 2026-07-27). Latest commit: `release: 0.4.0 (#161)`.
- Notable additions since May 2026: CSS custom properties export (`--format css-vars`), data-driven Color/Dimension type definitions, lint checks for typography sub-properties and token name collisions.
- Package is now `@google/design.md` (npm CLI: `npx @google/design.md lint DESIGN.md`).
- Repo status: active, public, not archived. ADOPT decision stands and is strengthened.

**Item 2 - fruteroclub/intern-os (FULL fetch, commit 4d9646f6):**
- **Graduated to stable v1.0.0** (2026-07-24) and **v1.1.0** (2026-08-16). Was 0.x alpha in May.
- v1.1.0 adds **git-worktree support** (`worktree.sh`, `BRIEF.md worktrees:` binding, registry awareness) — directly relevant to ZAO's `ws/` branch convention.
- **Org rename 2026-08-16:** Internal identity shifted from `fruteroclub` → `poktalabs`; repo still at fruteroclub GitHub URL but README/install commands now reference `poktalabs/intern-os`.
- Post-v1.1 additions: per-execution cost tracker in `session-wrap` skill (v0.4.0, Sep 2026), `checkpoint` companion skill (v0.1.0, Sep 2026).
- AGPL v3 + commercial license terms unchanged. Contact hola@frutero.club for B2B use.
- Upgrade WATCH to **WATCH (higher relevance)**: stable, git-worktree support relevant to ZAO fleet worktree patterns.
- Sources: https://github.com/fruteroclub/intern-os (cloned, FULL)

**Item 4 - Z.ai / GLM-5 (search snippets only — PARTIAL, treat as UNVERIFIED until direct fetch confirmed):**
- Zhipu AI **IPO'd January 8, 2026** (China's first public AI company per multiple sources).
- Rapid model releases since May 2026:
  - **GLM-5.1** (Apr 8, 2026): open-source release
  - **GLM-5.2** (Jun 13, 2026): 744B MoE, **1M-token context**, MIT license, SWE-bench Pro 62.1%
  - **GLM-5.3** (Aug 14, 2026): image input added, 1M context / 128K output, reasoning with effort tiers; open weights released ~Aug 28; current default on chat.z.ai
- WATCH decision stands. GLM-5.3's MIT open-weights + 1M context window is a meaningful development for cost-sensitive VPS deployments. Q3 2026 eval milestone from May is now overdue — recommend pricing the API against current Anthropic budget.
- Sources: search snippets only (direct fetches to chat.z.ai, zhipuai.cn, docs.z.ai blocked by egress proxy — PARTIAL). Key snippet sources: emergent.sh/news/glm-53-officially-launched, presenc.ai/research/zhipu-glm-model-lineage-2026.

## Sources

- [Google Stitch DESIGN.md Blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/)
- [Google Labs DESIGN.md GitHub Repo](https://github.com/google-labs-code/design.md)
- [Frutero intern-os GitHub Repository](https://github.com/fruteroclub/intern-os)
- [Z.ai Free Chat Platform](https://chat.z.ai/)
- [Z.ai GLM-5 Benchmarks & Review](https://mysummit.school/blog/en/glm5-zai-review-2026/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review Google DESIGN.md spec template and integrate into next `/design-consultation` output | Engineering | Code Integration | Next design project |
| Eval intern-os AGPL license implications for BCZ Strategies projects | Legal/Zaal | Compliance | Before multi-agent ensemble design |
| Verify Spotify episode ID with Zaal or skip if not recoverable | Zaal | Clarification | Next sync |
| Benchmark GLM-5 API cost vs Anthropic for classify tasks | Engineering | Cost Analysis | Q3 2026 (if budget pressure emerges) |
