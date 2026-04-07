# 293 — Multi-Agent Orchestration Tools, GitNexus Knowledge Graphs & High-Impact Agent Prompts

> **Status:** Research complete
> **Date:** April 6, 2026
> **Goal:** Evaluate three tools found on X/Twitter for ZAO agent squad relevance: (1) Trellis multi-agent framework, (2) GitNexus codebase knowledge graph, (3) exploraX_ 40 High-Impact Prompts collection
> **Builds on:** Docs 202 (multi-agent orchestration), 227 (agentic workflows), 234 (OpenClaw guide), 245 (ZOE upgrade)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Trellis (multi-agent orchestration)** | SKIP -- solves a different problem than ZAO needs. Trellis is a spec/task/journal framework for human developers using AI coding tools, not an agent-to-agent orchestrator. ZAO already has OpenClaw + Paperclip (Doc 202) which is purpose-built for autonomous agent hierarchies |
| **GitNexus (codebase knowledge graph)** | INSTALL FOR LOCAL DEV -- genuine value for Claude Code sessions. `npx gitnexus analyze` indexes ZAO OS into a queryable dependency graph via MCP. BUILDER agent on VPS could also use it. But license is PolyForm Noncommercial -- cannot use in production/commercial contexts |
| **GitNexus for VPS agents** | DEFER -- the MCP server requires Node.js and local filesystem access. VPS agents (ZOE/ZOEY) run in Docker containers with OpenClaw. Adding another MCP server adds complexity for marginal gain since agents already have Supabase MCP + GitHub MCP |
| **exploraX_ 40 Prompts** | CHERRY-PICK 5-6 prompts as SOUL.md improvements for specific agents. The full list is a generic prompt collection, but several coding-specific prompts map directly to agent roles |
| **Overall verdict** | 1 install (GitNexus local), 0 new frameworks, 5-6 prompt extractions for SOUL.md files |

---

## Comparison Table

| Tool | What It Is | Stars | Language | License | ZAO Agent Value | Effort to Adopt | Verdict |
|------|-----------|-------|----------|---------|----------------|-----------------|---------|
| **Trellis** (mindfold-ai) | Spec/task/journal framework for AI-assisted dev across 13 coding tools | 4.9K | Python + TS + Shell | AGPL-3.0 | LOW -- coordinates human developers, not autonomous agents | 30 min install, ongoing maintenance | SKIP |
| **GitNexus** (abhigyanpatwari) | Tree-sitter-based codebase knowledge graph with MCP server | 24.2K | TypeScript | PolyForm Noncommercial | HIGH for local dev, MEDIUM for VPS | 5 min install, auto-reindex | INSTALL (local only) |
| **exploraX_ 40 Prompts** | Curated prompt collection: coding, business, creative, workflow | N/A | N/A | Public tweet | MEDIUM -- 5-6 prompts map to agent roles | 2 hr to adapt into SOUL.md | CHERRY-PICK |

---

## 1. Trellis (Multi-Agent Orchestration Framework)

### What It Actually Is

Trellis is NOT an agent-to-agent orchestration system. Despite the marketing language ("orchestrate multiple AI coding agents"), it is a **developer workflow framework** that:

- Stores project specs in `.trellis/spec/` so AI tools get consistent context
- Tracks tasks via `.trellis/tasks/` PRD files
- Enables parallel human-driven AI coding via git worktrees
- Keeps session journals in `.trellis/workspace/`
- Generates platform-specific config files for 13 coding tools (Claude Code, Cursor, Codex, Kiro, etc.)

It is essentially a structured `.claude/` + `CLAUDE.md` + task tracking system that works across multiple AI coding platforms.

### Why It Does Not Fit ZAO

ZAO's agent squad problem (Doc 202) is autonomous agents coordinating with each other on a VPS:
- OpenClaw supervises Paperclip workers
- Agents run cron jobs, respond to webhooks, self-improve
- Human-in-the-loop via Telegram approval keyboards

Trellis solves a completely different problem: helping a single developer use multiple AI coding tools consistently. ZAO OS already has:
- `CLAUDE.md` (project conventions)
- `.claude/skills/` (11 skills)
- `.claude/rules/` (API, component, test conventions)
- `AGENTS.md` (for Codex/other tools)

Trellis would add a `.trellis/` directory that duplicates what already exists.

### Verdict: SKIP

**Effort:** 30 min to install, ongoing spec maintenance
**Value:** Near-zero -- ZAO's existing CLAUDE.md + skills infrastructure already provides what Trellis offers for Claude Code, and OpenClaw + Paperclip handles actual multi-agent orchestration

---

## 2. GitNexus (Codebase Knowledge Graph Engine)

### What It Actually Is

GitNexus is a **code intelligence engine** that uses Tree-sitter parsing to build a knowledge graph of a codebase. It maps:

- Every dependency relationship (imports, exports, function calls)
- Call chains and execution flows
- Functional clusters (using Leiden community detection algorithm)
- Blast radius / impact analysis for changes
- Hybrid search (BM25 + semantic + Reciprocal Rank Fusion)

The graph is stored in LadybugDB (embedded graph database) and exposed via:
1. **CLI** (`npx gitnexus analyze`) -- indexes locally
2. **MCP server** -- 16 tools queryable by Claude Code
3. **Web UI** -- browser-based explorer (WebAssembly, client-side only)

### How It Would Help ZAO

**For local Claude Code sessions (HIGH value):**

When working on ZAO OS (400+ files, 30+ components in music alone), GitNexus would let Claude Code:
- Query `impact` before editing a file to see blast radius (e.g., "what breaks if I change `curationWeight.ts`?")
- Use `context` to get 360-degree view of any symbol with all references
- Use `detect_changes` to map git diff impact before committing
- Auto-reindex after every commit via PostToolUse hooks

This directly addresses the problem of Claude Code sometimes missing cross-file dependencies in a codebase this size.

**For BUILDER agent on VPS (MEDIUM value):**

BUILDER (the code-writing agent in the planned squad) could use GitNexus MCP to understand the codebase before writing PRs. But this requires:
- Node.js on the VPS (already available)
- GitNexus CLI installed in the Docker container
- The ZAO OS repo cloned on VPS (already there for deploy)

**Concrete example:** BUILDER gets task "add scrobbling to the music player." GitNexus `context` query on `PlayerProvider` returns every component that imports it, every hook that reads its state, every API route that writes play data. BUILDER writes the feature with full dependency awareness instead of grepping.

### Setup Instructions

```bash
# One-time install (local dev machine)
npm install -g gitnexus

# Index ZAO OS codebase
cd /Users/zaalpanthaki/Documents/ZAO\ OS\ V1
npx gitnexus analyze

# Register with Claude Code MCP
claude mcp add gitnexus -- npx -y gitnexus@latest mcp

# Or manual setup via claude mcp config
npx gitnexus setup
```

After setup, 16 MCP tools become available in Claude Code sessions:
- `query` -- hybrid search across codebase
- `context` -- 360-degree symbol view
- `impact` -- blast radius analysis
- `detect_changes` -- git-diff impact mapping
- `cypher` -- raw graph queries

Auto-reindex hooks fire after every commit (PostToolUse).

### Limitations and Risks

| Concern | Detail |
|---------|--------|
| **License** | PolyForm Noncommercial 1.0.0 -- free for non-commercial use only. ZAO OS is open-source but The ZAO is a community with potential revenue. Clarify with GitNexus team if needed |
| **Memory** | Web UI limited to ~5,000 files. CLI mode is unlimited. ZAO OS has ~600 source files -- well within limits |
| **Staleness** | Must re-analyze after major refactors. Auto-reindex covers incremental changes but not branch switches |
| **Enterprise features** | Multi-repo unified graphs, auto-reindexing, OCaml support require enterprise license |
| **Index storage** | Creates `.gitnexus/` directory (gitignored by default). ~50-100MB for a codebase this size |

### Verdict: INSTALL FOR LOCAL DEV

**Effort:** 5 minutes to install and index
**Value:** High -- gives Claude Code structural awareness of the codebase that currently requires manual file reading
**Next step:** Run `npx gitnexus analyze` on ZAO OS, add MCP to Claude Code, test with a real feature task

---

## 3. exploraX_ 40 High-Impact Prompts

### What It Actually Is

A curated collection of 40 system prompts shared by @exploraX_ on X, covering five categories:

1. **Coding** (8 prompts) -- Bug Risk Analyst, TypeScript Type Expert, Repository Indexer, Refactoring Expert, Shell Script Specialist, API Design Reviewer, Performance Profiler, Security Auditor
2. **Business** (8 prompts) -- Strategy Advisor, Market Analyst, Financial Modeler, etc.
3. **Creative** (8 prompts) -- Content Strategist, Copywriter, Brand Voice, etc.
4. **Workflow** (8 prompts) -- Task Prioritizer, Meeting Summarizer, Documentation Writer, etc.
5. **Productivity** (8 prompts) -- Email Drafter, Research Synthesizer, Decision Framework, etc.

Note: The original tweet is behind X's login wall and was not directly fetchable. The prompt names listed here are based on the user's description. The actual prompt text for each would need to be extracted from the original tweet thread or linked resource.

### Which Prompts Map to ZAO Agent Roles

| Prompt | Maps To Agent | SOUL.md Improvement |
|--------|--------------|-------------------|
| **Bug Risk Analyst** | BUILDER | Add to BUILDER SOUL.md: before writing any code, analyze the change for regression risk. Check blast radius of modified files. Flag functions with > 3 callers |
| **TypeScript Type Expert** | BUILDER | Add to BUILDER SOUL.md: enforce strict types, never use `any`, prefer discriminated unions, use Zod schemas for runtime validation (aligns with existing API route conventions) |
| **Repository Indexer** | ZOE (supervisor) | Add to ZOE SOUL.md: maintain a mental model of the codebase structure. When BUILDER reports confusion about file locations, update the codebase map in MEMORY.md |
| **Security Auditor** | ZOE | Add to ZOE SOUL.md: weekly security scan checklist -- check for exposed env vars, missing Zod validation, raw SQL, dangerouslySetInnerHTML (aligns with SECURITY.md rules) |
| **Shell Script Specialist** | ZOE | Add to ZOE SOUL.md: when writing bash scripts for VPS maintenance, follow POSIX compatibility, add error handling (set -euo pipefail), log all actions |
| **Content Strategist** | ZOEY (community) | Add to ZOEY SOUL.md: when drafting Farcaster casts or cross-platform posts, follow ZAO voice (build-in-public, music-first, community-owned), optimize for each platform's character limits and culture |

### Prompts That Do NOT Help

- **Financial Modeler** -- ZAO has no financial modeling needs at current scale
- **Meeting Summarizer** -- fractal meetings use a Discord bot, not an LLM summarizer
- **Email Drafter** -- ZAO communicates via Farcaster/Telegram, not email
- **Market Analyst** -- premature for a 188-member community
- Most business/productivity prompts are generic and not agent-squad-relevant

### How to Apply

The prompts are not meant to be used as standalone agents. They are **persona instructions** that can be folded into existing SOUL.md files:

```markdown
# Example: BUILDER SOUL.md addition

## Code Quality Checklist (from Bug Risk Analyst prompt)
Before submitting any PR:
1. List all files modified and their callers (use GitNexus `impact` if available)
2. Check for type safety -- no `any`, no type assertions without justification
3. Verify Zod validation on all new API inputs
4. Run blast radius analysis on changed exports
5. Flag any function > 50 lines for refactoring consideration
```

### Verdict: CHERRY-PICK 5-6 PROMPTS

**Effort:** 2 hours to adapt into SOUL.md files
**Value:** Medium -- codifies best practices that are currently implicit. The Bug Risk Analyst and TypeScript Type Expert prompts are the highest value
**Next step:** When building/upgrading agent SOUL.md files (Doc 245 roadmap), incorporate these as checklist sections

---

## ZAO Integration Summary

### What to Do Now (This Week)

| Action | Tool | Time | Impact |
|--------|------|------|--------|
| Install GitNexus locally | `npx gitnexus analyze` | 5 min | Claude Code gets structural codebase awareness |
| Add GitNexus MCP to Claude Code | `claude mcp add gitnexus` | 2 min | 16 new code intelligence tools in every session |
| Test with a real task | Query `impact` on PlayerProvider | 10 min | Validate value before recommending to VPS |

### What to Do Later (Agent Squad Build Phase)

| Action | Tool | Time | Impact |
|--------|------|------|--------|
| Add Bug Risk Analyst to BUILDER SOUL.md | exploraX prompts | 30 min | BUILDER checks blast radius before writing |
| Add TypeScript Type Expert to BUILDER SOUL.md | exploraX prompts | 30 min | Stricter type safety in generated code |
| Add Security Auditor checklist to ZOE SOUL.md | exploraX prompts | 30 min | Weekly automated security scan |
| Add Content Strategist to ZOEY SOUL.md | exploraX prompts | 30 min | Better cross-platform post quality |
| Evaluate GitNexus on VPS for BUILDER | GitNexus CLI | 2 hr | BUILDER gets dependency awareness |

### What to Skip

- **Trellis** -- duplicates existing CLAUDE.md + skills infrastructure, does not do agent-to-agent orchestration
- **GitNexus enterprise** -- not needed at ZAO's codebase size (~600 files)
- **Most exploraX prompts** -- 34 of 40 are generic business/productivity prompts that do not apply to autonomous coding agents

---

## Sources

- [Trellis GitHub](https://github.com/mindfold-ai/Trellis) -- 4.9K stars, AGPL-3.0, multi-platform AI coding framework
- [Trellis on opensourceprojects.dev](https://www.opensourceprojects.dev/post/e954a5d2-5ac6-4c51-9ee3-b2f78131ea4b)
- [GitNexus GitHub](https://github.com/abhigyanpatwari/GitNexus) -- 24.2K stars, PolyForm Noncommercial, codebase knowledge graph
- [GitNexus docs](https://gitnexus.vercel.app) -- web UI and documentation
- [@exploraX_ on X](https://x.com/exploraX_) -- 40 High-Impact Prompts collection
- [Doc 202: Multi-Agent Orchestration](../202-multi-agent-orchestration-openclaw-paperclip/) -- existing ZAO agent hierarchy design
- [Doc 227: Agentic Workflows 2026](../227-agentic-workflows-2026/) -- framework comparison
- [Doc 245: ZOE Upgrade](../245-zoe-upgrade-autonomous-workflow-2026/) -- current agent upgrade roadmap
