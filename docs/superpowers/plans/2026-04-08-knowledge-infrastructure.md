# Knowledge Infrastructure & Token Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install knowledge graph tools, create brand voice skill, build research changelog, set up daily AI curriculum for ZOE, and configure token-saving workflow improvements based on research docs 297-303.

**Architecture:** No new application code - this is all tooling, skills, configuration, and documentation. Install 3 CLI tools (Graphify, MemPalace, Oh-My-Mermaid), 2 Claude Code plugins (wiki-skills, last30days), create 3 new skill files, and configure CLAUDE.md for token optimization.

**Tech Stack:** Python (pip), Node.js (npm/npx), Claude Code plugins, Markdown skills

---

## File Structure

### New Files
- `.claude/skills/zao-os/brand-voice.md` - Brand voice profile for content consistency
- `docs/ai-curriculum/curriculum.md` - 30-day AI tool mastery plan
- `docs/ai-curriculum/skills-journal.md` - Append-only learning log
- `research/changelog.md` - Chronological research tracking (ALREADY CREATED)

### Modified Files
- `CLAUDE.md` - Context budget section (ALREADY DONE)
- `.claude/skills/zao-research/new-research.md` - Updated doc number (ALREADY DONE)
- `research/dev-workflows/README.md` - New doc entries (ALREADY DONE)
- `research/README.md` - Updated count (ALREADY DONE)

---

### Task 1: Install Graphify Knowledge Graph Tool

**Files:**
- None (CLI tool install)

- [ ] **Step 1: Install Graphify via pip**

Run:
```bash
pip install graphifyy
```
Expected: Successfully installed graphifyy-0.1.15 (or latest)

- [ ] **Step 2: Install Graphify as Claude Code skill**

Run:
```bash
graphify install
```
Expected: Skill installed at `~/.claude/skills/graphify/SKILL.md`

- [ ] **Step 3: Verify Graphify is available**

Run:
```bash
graphify --version
```
Expected: `graphify 0.1.15` or similar version output

- [ ] **Step 4: Index the research library**

In Claude Code, run:
```
/graphify ./research
```
Expected: Processing 338+ markdown files. Output in `graphify-out/` directory with `graph.html`, `graph.json`, `obsidian/` vault, and `GRAPH_REPORT.md`. Takes 3-5 minutes.

- [ ] **Step 5: Index the source code**

In Claude Code, run:
```
/graphify ./src
```
Expected: Processing 863 .ts/.tsx files via tree-sitter AST. Adds code structure to the graph. Takes 2-3 minutes.

- [ ] **Step 6: Add graphify-out to .gitignore**

Check if `.gitignore` exists and add:
```
graphify-out/
```

- [ ] **Step 7: Commit**

```bash
git add .gitignore
git commit -m "chore: add graphify-out to gitignore"
```

---

### Task 2: Install Wiki-Skills Plugin

**Files:**
- None (Claude Code plugin)

- [ ] **Step 1: Install wiki-skills from marketplace**

In Claude Code, run:
```
/plugin marketplace add kfchou/wiki-skills
/plugin install wiki-skills@kfchou/wiki-skills
```
Expected: Plugin installed with 5 skills: wiki-init, wiki-ingest, wiki-query, wiki-lint, wiki-update

- [ ] **Step 2: Test wiki-init**

In Claude Code, run:
```
/wiki-init
```
When prompted, point it at a new directory: `research-wiki/`

Expected: Creates `research-wiki/` with `SCHEMA.md`, `raw/`, `wiki/` (index.md, log.md, overview.md, pages/), `assets/`

- [ ] **Step 3: Add research-wiki to .gitignore**

```
research-wiki/
```

This is a local knowledge tool, not project source.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add research-wiki to gitignore"
```

---

### Task 3: Install last30days Research Plugin

**Files:**
- None (Claude Code plugin)

- [ ] **Step 1: Install last30days from marketplace**

In Claude Code, run:
```
/plugin marketplace add mvanhorn/last30days-skill
```
Expected: Plugin installed with research skill

- [ ] **Step 2: Test with a ZAO-relevant query**

In Claude Code, run:
```
/last30days Farcaster music communities 2026
```
Expected: Briefing with results from Reddit, Hacker News, and Polymarket (3 free sources). Auto-saved to `~/Documents/Last30Days/`.

---

### Task 4: Install MemPalace Cross-Session Memory

**Files:**
- None (pip install + MCP config)

- [ ] **Step 1: Install MemPalace**

Run:
```bash
pip install mempalace
```
Expected: Successfully installed mempalace-3.0.0 (or latest)

- [ ] **Step 2: Initialize MemPalace**

Run:
```bash
mempalace init
```
Expected: Creates palace structure in `~/.mempalace/` or local directory

- [ ] **Step 3: Mine existing conversations (optional)**

Run:
```bash
mempalace mine
```
Expected: Processes existing project data into palace wings/rooms

- [ ] **Step 4: Note MCP config for later**

MemPalace MCP server can be added to `.claude/settings.json` later:
```json
{
  "mcpServers": {
    "mempalace": {
      "command": "mempalace",
      "args": ["mcp"]
    }
  }
}
```
Do NOT add this yet - test MemPalace standalone first, add MCP after confirming it works.

---

### Task 5: Install Oh-My-Mermaid Architecture Diagrams

**Files:**
- None (npm global install)

- [ ] **Step 1: Install Oh-My-Mermaid**

Run:
```bash
npm install -g oh-my-mermaid
```
Expected: Global install successful

- [ ] **Step 2: Run setup**

Run:
```bash
omm setup
```
Expected: Auto-detects Claude Code, registers `/omm-scan` and `/omm-push` skills

- [ ] **Step 3: Generate architecture diagrams**

In Claude Code, run:
```
/omm-scan
```
Expected: Creates `.omm/` directory with Mermaid diagrams organized by perspectives (structure, data-flow, integrations). Each perspective has nested .mmd files + markdown descriptions.

- [ ] **Step 4: Add .omm to .gitignore (or commit for docs)**

If you want architecture docs in the repo:
```bash
git add .omm/
git commit -m "docs: add oh-my-mermaid architecture diagrams"
```

If you want it local-only, add `.omm/` to `.gitignore`.

---

### Task 6: Create Brand Voice Skill

**Files:**
- Create: `.claude/skills/zao-os/brand-voice.md`

- [ ] **Step 1: Create the zao-os skills directory**

Run:
```bash
mkdir -p "/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/zao-os"
```

- [ ] **Step 2: Write the brand voice skill**

Create `.claude/skills/zao-os/brand-voice.md`:

```markdown
---
name: brand-voice
description: Zaal's brand voice profile for ZAO content. Use when generating newsletters, social posts, documentation, or any public-facing text.
---

# Brand Voice - Zaal / The ZAO

## When to Use
- Before writing any newsletter (`/newsletter`)
- Before writing social posts (`/socials`)
- Before writing documentation or announcements
- When reviewing AI-generated content for voice consistency

## Voice Profile

### Tone
- Builder-enthusiast. Direct. No BS.
- Build-in-public: show the work, not just the result
- Community-first: The ZAO is the star, not Zaal
- Optimistic but grounded. Real numbers, real progress.

### Opening Style (from published posts)
- "ZM" (most common)
- "zm" (lowercase mood)
- "GM ZM" (morning energy)
- No greeting (announcement days)

### Vocabulary Rules
- Say "Farcaster" never "Warpcast"
- Say "The ZAO" not "our community" or "the community"
- Use lowercase for casual sentences
- Capitalize proper nouns: ZAO, ZABAL, WaveWarZ, Farcaster
- Never use em dashes. Use hyphens.
- Never use "utilize", "leverage", "synergy", "excited to announce"

### Style
- Short sentences. Short paragraphs.
- Lead with the build, not the announcement
- Show specific numbers: "863 source files", "338 research docs", not "many files"
- Credit community members by name
- Include Farcaster links when possible

### Sign-off (in order of frequency)
1. "- BetterCallZaal on behalf of the ZABAL Team"
2. "Zaal"
3. "Thanks, Zaal"

### Recurring Phrases
- "the quiet work compounds"
- "consistency every day is the best you can do"
- "momentum is there"

## Examples

### Good (sounds like Zaal)
"shipped the crossfade engine today. dual audio elements, Web Audio API
for binaural beats. 30+ components in the music player now. the quiet
work compounds."

### Bad (sounds like AI)
"We're excited to announce our latest feature update to enhance the
music listening experience for our valued community members."

## How to Apply
1. Write the content first
2. Read it back checking each rule above
3. Replace any corporate/formal language with direct builder language
4. Add specific numbers where possible
5. Make sure it sounds like a message from a builder, not a press release
```

- [ ] **Step 3: Verify the file exists**

Run:
```bash
cat "/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/zao-os/brand-voice.md" | head -5
```
Expected: Shows the frontmatter header

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/zao-os/brand-voice.md
git commit -m "feat: add brand voice skill for content consistency"
```

---

### Task 7: Create AI Curriculum Files

**Files:**
- Create: `docs/ai-curriculum/curriculum.md`
- Create: `docs/ai-curriculum/skills-journal.md`

- [ ] **Step 1: Create the curriculum directory**

Run:
```bash
mkdir -p "/Users/zaalpanthaki/Documents/ZAO OS V1/docs/ai-curriculum"
```

- [ ] **Step 2: Write the 30-day curriculum**

Create `docs/ai-curriculum/curriculum.md` with the full 30-day plan from Doc 303. Content is the 4-week curriculum covering:
- Week 1: Claude Code Power User (compact, model switching, batching, agents, /z, peak hours)
- Week 2: Knowledge Infrastructure (Graphify, wiki-skills, last30days, Nia Docs, Oh-My-Mermaid)
- Week 3: Content & Communication (brand voice, quote-cast, research-first content, build-in-public)
- Week 4: Codebase & Agent Mastery (auto-memory, MemPalace, /investigate, /review, custom skills, /reflect)

Each day has: Tip name, what to try (3 steps max), why it matters (1 sentence).

Format for ZOE delivery:
```
## Day N: [Tip Name]

**Try this:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Why:** [One sentence]
```

- [ ] **Step 3: Write the skills journal**

Create `docs/ai-curriculum/skills-journal.md`:

```markdown
# AI Skills Journal

Append-only log of tools tried, what worked, what clicked.
ZOE appends entries when Zaal reports back.

| Date | Day | Tool/Technique | Tried? | Notes |
|------|-----|---------------|--------|-------|
```

- [ ] **Step 4: Commit**

```bash
git add docs/ai-curriculum/
git commit -m "feat: add 30-day AI skill building curriculum + journal"
```

---

### Task 8: Final Commit - Research Docs Batch

**Files:**
- All research docs 297-303
- research/changelog.md
- Updated indexes

- [ ] **Step 1: Stage all research files**

```bash
git add research/dev-workflows/297-graphify-knowledge-graph-codebase/
git add research/dev-workflows/298-claude-token-optimization-strategies/
git add research/dev-workflows/299-llm-knowledge-bases-wiki-systems/
git add research/dev-workflows/300-ai-memory-agent-infrastructure/
git add research/dev-workflows/301-developer-tooling-roundup-2026/
git add research/dev-workflows/302-ai-content-engine-automation-patterns/
git add research/dev-workflows/303-daily-ai-skill-building-curriculum/
git add research/changelog.md
git add research/dev-workflows/README.md
git add research/README.md
git add CLAUDE.md
git add .claude/skills/zao-research/new-research.md
```

- [ ] **Step 2: Commit research batch**

```bash
git commit -m "docs: research batch 297-303 — knowledge infrastructure, token optimization, AI tooling"
```

- [ ] **Step 3: Verify clean state**

```bash
git status
git log --oneline -5
```
Expected: Clean working tree. 2-3 new commits on `ws/token-optimization-0408`.

---

## Execution Order

Tasks 1-5 are tool installs (independent, can run in parallel).
Task 6 is the brand voice skill (independent).
Task 7 is the curriculum files (independent).
Task 8 is the final research commit (depends on nothing being left unstaged).

**Recommended:** Start with Task 8 (commit what we already have), then Tasks 1-5 in parallel, then 6-7.

---

## Post-Plan: What's NOT in This Plan (Future Work)

- ZOE scheduled daily tip delivery via `/schedule` or VPS cron (ZOE already dispatches via Telegram)
- MemPalace MCP server configuration (test standalone first)
- Nia Docs API key setup (needs account creation at trynia.ai)
- Impeccable design skill install (evaluate in next session)
- wiki-skills ingestion of top 10 research docs (do after install confirms working)
- Graphify auto-update git hook (`graphify hook install`)
- GitNexus on VPS already has 17,627 nodes - curriculum references this
- ZOE SOUL.md update to include daily tip delivery routine
- Cross-reference brand-voice.md with existing newsletter/voice-reference.md
