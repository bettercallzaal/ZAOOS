# 164 — Skills, Research Workflow & Autoresearch Improvements

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Improve ZAO's research tool, skills, and autoresearch workflow — especially adding open-source code analysis from the internet as a resource

## Key Decisions / Recommendations

| Decision | Recommendation | Priority |
|----------|----------------|----------|
| **Open-source code search** | Install grep.app MCP: `claude mcp add --transport http grep https://mcp.grep.app` — searches 1M+ GitHub repos from inside Claude Code | **NOW** |
| **Code search backup** | Add Sourcegraph MCP (`sourcegraph.com/mcp`) for semantic search + deep questions across codebases | **NOW** |
| **Up-to-date docs** | Install Context7 MCP (49.9K stars) — real-time docs for Next.js 16, Supabase, Wagmi, XMTP. Eliminates hallucinated APIs | **NOW** |
| **AI-optimized search** | Install Tavily MCP (1.4K stars) — production web search optimized for agents. Free tier: 1,000 credits/month | **NEXT** |
| **zao-research skill** | Upgrade with open-source code search step, improved quality scoring, and autoresearch self-improvement loop | **NOW** |
| **Skill self-improvement** | Run `/autoresearch` on the `/zao-research` skill itself — target 55% -> 95% quality score (per doc 62) | **NEXT** |
| **Dead skill cleanup** | Delete 3 deprecated commands: `brainstorm.md`, `write-plan.md`, `execute-plan.md` (per doc 137) | **NOW** |

---

## Part 1: Open-Source Code Analysis — The Missing Capability

### Problem

The current `/zao-research` skill uses WebSearch + WebFetch for external research, but has **no structured way to search and read open-source code**. When building features, we need to see how other projects solved the same problem — not just read blog posts about it.

### Solution: Three MCP Servers

#### 1. grep.app MCP (Primary — install immediately)

```bash
claude mcp add --transport http grep https://mcp.grep.app
```

- Searches ~1 million public GitHub repos via MCP
- Supports regex, language filtering, repo/file path filtering
- Returns: repo name, file path, GitHub URL, license, code snippets
- Source: [Vercel blog announcement](https://vercel.com/blog/grep-a-million-github-repositories-via-mcp)

**Use cases for ZAO OS:**
- "How do other Farcaster clients handle Neynar webhooks?" → search `neynar.*webhook` in TypeScript
- "Show me LiveKit + Next.js App Router integration patterns" → search `livekit.*app.*router`
- "How does Sonata handle music player state?" → search in `sonata` repo specifically

#### 2. Sourcegraph MCP (Deep code understanding)

```bash
# Visit sourcegraph.com/mcp for setup
```

- Keyword + semantic search across entire codebases
- Search commits, diffs, revision comparisons
- Deep Search for complex architectural questions
- Docs: `sourcegraph.com/docs/api/mcp`

#### 3. Context7 MCP (Up-to-date library docs)

- 49.9K stars, eliminates hallucinated API references
- Real-time docs for: Next.js 16, Supabase, Wagmi, XMTP, Tailwind, React 19
- Critical for ZAO OS since we're on bleeding-edge versions

#### 4. Tavily MCP (AI-optimized web search)

- Production web search returning clean, structured content (not raw HTML)
- Free tier: 1,000 credits/month
- Better than raw WebSearch for research workflows

### Alternative: `gh` CLI Patterns (No MCP needed)

For targeted repo analysis without installing MCPs:

```bash
# Clone a reference repo into temp dir
gh repo clone sonata-xyz/sonata /tmp/sonata-ref

# Search for specific patterns
grep -r "usePlayer" /tmp/sonata-ref/src/

# Fetch a single file from GitHub raw
curl -s https://raw.githubusercontent.com/sonata-xyz/sonata/main/src/hooks/usePlayer.ts

# Search code across GitHub
gh search code "neynar webhook" --language typescript --limit 10
```

---

## Part 2: Karpathy Autoresearch — Applying to Skills

### Core Principles (from Karpathy's 630-line MIT script)

1. **Single-file modification** — Each iteration edits one thing, keeps diffs reviewable
2. **Fixed evaluation budget** — 5 minutes per experiment, ~12/hour, ~100 overnight
3. **Mechanical metric** — `val_bpb` (validation bits per byte) — no subjective scoring
4. **Keep/discard binary** — Improvement = keep, regression = revert. No "maybe"
5. **Git as memory** — Agent reads commit history to learn what worked

### How This Maps to Our Skills

Our `/autoresearch` skill (v1.7.3) already implements Karpathy's loop:

| Karpathy Step | Our Autoresearch Phase |
|---|---|
| Modify `train.py` | Phase 3: Modify (edit skill/code) |
| Train (5 min) | Phase 5: Verify (run metric command) |
| Evaluate `val_bpb` | Phase 5: Parse metric from output |
| Keep/discard | Phase 7: Decide (keep if improved, revert if not) |
| Repeat | Phase 9: Loop back to Phase 1 |

### Concrete Self-Improvement Targets

**Target 1: `/zao-research` skill quality** (from doc 62)
```
Goal: Improve zao-research output quality from ~55% to 95%
Scope: .claude/skills/zao-research/SKILL.md
Metric: quality_score (binary checklist: ZAO-specific? Sources linked? Numbers included? Cross-referenced? Actionable? Recommendations at top?)
Direction: maximize
Verify: Run skill on test topic, score output against 6-point checklist
Iterations: 20
```

**Target 2: Research doc consistency across 155+ docs**
```
Goal: Identify and flag weak research docs
Scope: research/*/README.md
Metric: docs_with_all_fields / total_docs
Direction: maximize
Verify: grep for "Sources" section, "Key Decisions" table, dates in each doc
```

**Target 3: Skill description accuracy** (for auto-matching)
```
Goal: Ensure skill descriptions trigger correctly
Scope: .claude/skills/*/SKILL.md frontmatter
Metric: trigger_accuracy (test N prompts, count correct skill activations)
Direction: maximize
```

---

## Part 3: Upgraded `/zao-research` Workflow

### Current Workflow (5 steps)

1. Search codebase
2. Search existing research (155+ docs)
3. Conduct new research (WebSearch + WebFetch)
4. Save as numbered doc
5. Update indexes

### Proposed Workflow (7 steps)

1. **Search codebase** (unchanged)
2. **Search existing research** (unchanged)
3. **Search open-source code** (NEW) — use grep.app MCP / Sourcegraph / `gh search code` to find how other projects solved the same problem
4. **Read reference implementations** (NEW) — fetch and analyze key files from the best matches
5. **Conduct web research** (WebSearch + WebFetch for docs, specs, pricing)
6. **Save as numbered doc** — now includes "Reference Implementations" section
7. **Update indexes**

### New Section in Research Template: "Reference Implementations"

```markdown
## Reference Implementations

| Project | Stars | License | Key File | What We Can Learn |
|---------|-------|---------|----------|-------------------|
| sonata-xyz/sonata | 2.1K | MIT | `src/hooks/usePlayer.ts` | Player state management pattern |
| herocast/herocast | 800 | AGPL | `src/lib/neynar.ts` | Neynar API wrapper with caching |

### Code Patterns Worth Borrowing

\`\`\`typescript
// From sonata-xyz/sonata — elegant queue management
// src/hooks/usePlayerQueue.ts:42-67
export function usePlayerQueue() { ... }
\`\`\`
```

---

## Part 4: Skill System Best Practices

### SKILL.md Standard (Open standard, Dec 2025)

The emerging standard for AI agent skills:
- YAML frontmatter: `name`, `description`, `license`, `compatibility`, `allowed-tools`
- Markdown body: instructions, rules, examples
- Optional: `scripts/`, `references/`, `assets/`, `examples/`
- **Keep under 500 lines** for optimal performance

### Progressive Disclosure (3-tier loading)

| Tier | What Loads | Token Cost |
|------|-----------|-----------|
| **1. Discovery** | Name + description only | ~50 tokens/skill |
| **2. Activation** | Full SKILL.md body | ~500-5,000 tokens |
| **3. Execution** | Supporting references | ~2,000+ tokens |

Claude Code already does this — skill descriptions load at session start (Tier 1), full skill loads on invocation (Tier 2), references load on demand (Tier 3).

### Skill Design Rules

1. **Critical constraints first** — Position "NEVER" rules at the top
2. **Include worked examples** — At least one good + one bad example
3. **Keyword-rich descriptions** — Enables automatic skill matching
4. **Explicit output format** — Templates prevent drift
5. **500-2,000 token instructions** — Longer = ignored; shorter = ambiguous

### Skill Composition via Hooks

Skills can define hooks in their YAML frontmatter that activate only while the skill runs:

```yaml
hooks:
  PostToolUse:
    - if: "Write(research/*)"
      type: prompt
      prompt: "Verify this research doc has: sources, dates, ZAO-specific context, actionable recommendations"
```

This enables quality gates without manual checking.

---

## Part 5: Hook System Enhancements

### Current Hook Events (24 total, as of Claude Code v2.1.x)

Key events for skill improvement:

| Event | Use for Research/Skills |
|---|---|
| `SessionStart` | Auto-load research context via `/catchup` |
| `PreToolUse` | Validate research queries before execution |
| `PostToolUse` | Auto-score research output quality |
| `Stop` | Verify research doc meets quality checklist before ending |
| `FileChanged` | Watch `research/` for new docs, auto-update index |

### The `if` Field (v2.1.85+)

Filter hooks by tool name AND arguments:

```json
{
  "hooks": {
    "PostToolUse": [{
      "if": "Write(research/*)",
      "type": "prompt",
      "prompt": "Check: does this research doc have sources, dates, recommendations at top, and ZAO-specific context?"
    }]
  }
}
```

---

## Part 6: Concrete Implementation Plan

### Phase 1: Install MCP Servers (10 minutes)

```bash
# 1. grep.app — open-source code search
claude mcp add --transport http grep https://mcp.grep.app

# 2. Context7 — up-to-date library docs
# Visit: https://github.com/upstash/context7 for setup

# 3. Sourcegraph (optional)
# Visit: sourcegraph.com/mcp
```

### Phase 2: Upgrade `/zao-research` Skill (30 minutes)

Add Steps 3-4 (open-source code search + reference implementations) to `SKILL.md`:
- Add grep.app/Sourcegraph search patterns
- Add "Reference Implementations" section to research template
- Update quality checklist to include code references

### Phase 3: Add Quality Gate Hook (15 minutes)

Add a `PostToolUse` hook that scores research output against the 6-point quality checklist when writing to `research/`.

### Phase 4: Run Autoresearch Self-Improvement (1-2 hours)

```
/autoresearch
Goal: Improve zao-research skill output quality
Scope: .claude/skills/zao-research/SKILL.md
Metric: Pass rate on 6-point quality checklist
Direction: maximize
Iterations: 15
```

### Phase 5: Clean Up Dead Skills (5 minutes)

Delete deprecated commands:
- `.claude/commands/brainstorm.md`
- `.claude/commands/write-plan.md`
- `.claude/commands/execute-plan.md`

---

## Part 7: Skill Marketplace & Community Resources

| Resource | Stars | What It Offers |
|----------|-------|----------------|
| [skillsmp.com](https://skillsmp.com) | N/A | 500K+ skills marketplace |
| [awesomeskills.dev](https://awesomeskills.dev) | N/A | 3,032 curated skills |
| [VoltAgent/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) | 12.1K | 549+ open-source skills |
| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Varies | Community patterns, orchestrators |
| [Anthropic official skills](https://github.com/anthropics/skills) | N/A | pdf, xlsx, docx processing |

---

## Cross-References

| Doc | Relationship |
|-----|-------------|
| **62** — Autoresearch: Skill Improvement | Original methodology for self-improving skills via autoresearch loop |
| **63** — Autoresearch Deep Dive | 7 concrete ZAO use cases including `/zao-research` improvement |
| **89** — Paperclip + gstack + Autoresearch Stack | Three-layer AI company architecture, skill marketplace references |
| **91** — Top Claude Skills & MCP Repos | Context7, Tavily, Anthropic skills evaluations |
| **137** — Skills Audit & Security | Current inventory, dead weight identified, OWASP for LLMs |
| **154** — Skills & Commands Master Reference | Canonical reference for all commands/skills |

## Sources

- [Karpathy autoresearch](https://github.com/karpathy/autoresearch) — Original 630-line MIT script, 45.3K+ stars
- [Vercel: grep.app MCP](https://vercel.com/blog/grep-a-million-github-repositories-via-mcp) — grep 1M repos via MCP
- [Sourcegraph MCP](https://sourcegraph.com/mcp) — Semantic code search MCP
- [Context7](https://github.com/upstash/context7) — Real-time library docs, 49.9K stars
- [Agent Skills Standard](https://medium.com/@loccarrre/the-agent-skills-standard-how-a-simple-skill-md-file-turns-ai-agents-into-on-demand-specialists-172af1d9737d) — SKILL.md open standard
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide) — 24 hook events, 4 hook types
- [awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) — 549+ curated skills, 12.1K stars
- [NextBigFuture: Karpathy on autoresearch](https://www.nextbigfuture.com/2026/03/andrej-karpathy-on-code-agents-autoresearch-and-the-self-improvement-loopy-era-of-ai.html)
- [Elite AI Coding: gh for agents](https://elite-ai-assisted-coding.dev/p/gh-for-agentic-github) — `gh` CLI patterns for AI agents
