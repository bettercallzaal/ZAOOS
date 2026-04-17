# 429 — Claude Code Skills Deep Dive

> **Status:** Research complete
> **Date:** April 17, 2026
> **Goal:** Comprehensive reference for building, structuring, and optimizing Claude Code custom skills — frontmatter spec, advanced patterns, and how ZAO OS's 25 skills can improve

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Skill format** | USE `.claude/skills/<name>/SKILL.md` — commands in `.claude/commands/` still work but skills are the current standard with more features |
| **Frontmatter** | USE `description` (required for auto-trigger), `disable-model-invocation: true` for side-effect skills (deploy, commit, vps), `user-invocable: false` for background knowledge |
| **Progressive disclosure** | SPLIT skills over 500 lines into `SKILL.md` + `references/` subdirectory — 82% token savings vs loading everything upfront |
| **Tool control** | USE `allowed-tools` to pre-approve tools without per-use prompts — it grants permission, does NOT restrict |
| **Subagent execution** | USE `context: fork` + `agent: Explore` for read-only research skills that gather context without bloating main conversation |
| **Description quality** | INVEST in trigger descriptions — this is the primary interface for auto-invocation. Front-load keywords. Combined `description` + `when_to_use` capped at 1,536 chars |
| **ZAO OS action** | AUDIT our 25 skills against these patterns — several are over 500 lines and should use progressive disclosure |

---

## Complete SKILL.md Frontmatter Specification

Every field is optional except `description` (recommended). The directory name becomes the slash command.

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | directory name | Display name. Lowercase, hyphens, max 64 chars. Becomes `/slash-command` |
| `description` | string | first markdown paragraph | What it does + when to trigger. Claude uses this for auto-invocation. Truncated at 1,536 chars (combined with `when_to_use`) |
| `when_to_use` | string | none | Extra trigger context — example phrases, alt wordings. Appended to description, shares 1,536-char cap |
| `argument-hint` | string | none | CLI hint shown during autocomplete, e.g. `[issue-number]` |
| `disable-model-invocation` | boolean | false | `true` = only user can invoke via `/name`. Claude cannot auto-trigger. Use for side-effect skills |
| `user-invocable` | boolean | true | `false` = hidden from `/` menu. Only Claude can invoke. Use for background knowledge |
| `allowed-tools` | string or list | all tools | Pre-approves tools without per-use prompts. Does NOT restrict — permission settings still govern baseline. Example: `Read Grep Bash(git *)` |
| `model` | string | session model | Override model for this skill. Example: `claude-opus-4-20250514` |
| `effort` | string | session effort | Override effort level: `low`, `medium`, `high`, `xhigh`, `max` |
| `context` | string | inline | `fork` = run in isolated subagent context. Skill content becomes the subagent's task prompt |
| `agent` | string | general-purpose | Subagent type when `context: fork`. Options: `Explore` (Haiku, read-only), `Plan` (research), `general-purpose` (full tools), or custom `.claude/agents/` |
| `hooks` | object | none | Lifecycle hooks scoped to this skill |
| `paths` | string or list | none | Glob patterns limiting when Claude auto-loads. Example: `src/**/*.tsx` |
| `shell` | string | bash | Shell for `!command` blocks. `bash` or `powershell` |

### Invocation Matrix

| Frontmatter | User invokes | Claude invokes | Description in context |
|-------------|-------------|----------------|----------------------|
| (default) | Yes | Yes | Yes — always loaded |
| `disable-model-invocation: true` | Yes | No | No — hidden from context |
| `user-invocable: false` | No | Yes | Yes — always loaded |

---

## Comparison of Skill Architectures

| Pattern | Token Cost | Best For | Example |
|---------|-----------|----------|---------|
| **Inline (single SKILL.md)** | 1-5K tokens | Simple workflows under 200 lines | `/z`, `/check-env` |
| **Progressive disclosure (SKILL.md + references/)** | 100 tokens idle, 1-5K active | Complex skills with conditional detail | `/zao-research`, `/autoresearch` |
| **Forked subagent (`context: fork`)** | 0 tokens in main context | Read-only research, expensive context gathering | Codebase analysis, deep search |
| **Task pipeline (sequential skills)** | Additive per skill | Multi-phase workflows: brainstorm → plan → implement | Superpowers framework |
| **Background knowledge (`user-invocable: false`)** | ~100 tokens always | Conventions, legacy docs, API patterns | `/next-best-practices` |

---

## String Substitutions

Skills support dynamic placeholders replaced before Claude sees the content:

| Placeholder | Description |
|-------------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking. If absent, args appended as `ARGUMENTS: <value>` |
| `$ARGUMENTS[N]` | Specific argument by 0-based index |
| `$0`, `$1`, `$2` | Shell-style shorthand for positional args |
| `${CLAUDE_SESSION_ID}` | Current session ID — useful for logging |
| `${CLAUDE_SKILL_DIR}` | Directory containing this SKILL.md — use for referencing bundled scripts |

---

## Dynamic Context Injection (Shell Execution in Skills)

Skills can execute shell commands whose output replaces placeholders before Claude sees anything.

**Inline syntax:**
```markdown
Current branch: !`git branch --show-current`
Recent commits: !`git log --oneline -5`
```

**Multi-line syntax:**
````markdown
```!
node --version
npm --version
git status --short
```
````

Commands run **before** Claude processes the skill. Output replaces the command block. Claude only sees the rendered result.

Disable with `"disableSkillShellExecution": true` in settings. Affects user/project/plugin skills only; bundled skills are unaffected.

---

## Skill File Structure

```
my-skill/
├── SKILL.md           # Main instructions (REQUIRED, <500 lines)
├── references/        # Loaded on demand when SKILL.md says to
│   ├── api-guide.md   # Detailed API docs
│   ├── examples.md    # Usage examples
│   └── schemas.md     # Data schemas
├── scripts/           # Executable scripts
│   ├── validate.sh
│   └── helper.py
├── templates/         # Templates Claude fills in
│   └── pr-template.md
└── data/              # Reference data
    └── config.json
```

**Key principle:** SKILL.md is the entrypoint. Reference other files explicitly so Claude knows when to load them. Keep SKILL.md under 500 lines; move detail to separate files.

### Skill Discovery & Precedence

```
Enterprise .claude/settings/ (managed)  ← Highest priority
Personal   ~/.claude/skills/<skill>/SKILL.md
Project    .claude/skills/<skill>/SKILL.md
Plugin     <plugin>/skills/<skill>/SKILL.md  ← Namespaced: plugin:skill
```

Monorepo support: Claude auto-discovers `.claude/skills/` in nested directories (e.g., `packages/frontend/.claude/skills/`).

Live changes: Editing skills takes effect immediately within the session. Creating a NEW top-level `skills/` directory requires restart.

---

## Skill Lifecycle & Context Persistence

1. When invoked, rendered SKILL.md enters the conversation as a single message
2. Content stays for the rest of the session — Claude does NOT re-read the file
3. On auto-compaction: most recent invocation of each skill is re-attached (first 5,000 tokens per skill, 25,000 combined budget)
4. If behavior drifts: strengthen instructions or re-invoke after compaction

**Description budget:** All skill descriptions share ~1% of context window (fallback 8,000 chars). Raise with `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var. Each description capped at 1,536 chars.

---

## Advanced Patterns

### 1. Progressive Disclosure (Token Savings)

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---

## Quick Reference
- Use RESTful naming
- Return consistent error formats
- Include Zod validation

## When to Consult References
- For auth patterns, read references/auth.md
- For error codes, read references/errors.md
- For rate limiting, read references/rate-limits.md
```

Result: 82% token savings vs loading everything upfront. At scale (1,000+ skills): 96.3% savings.

### 2. Forked Subagent Research

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

Main conversation stays clean. Subagent does the heavy lifting and returns a summary.

### 3. Side-Effect Protection

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
allowed-tools: Bash(npm run build) Bash(vercel deploy *)
---

Deploy steps:
1. Run the test suite
2. Build the application
3. Push to Vercel
```

Claude cannot auto-trigger this. Only user invokes via `/deploy`.

### 4. Conditional Tool Pre-Approval

```yaml
---
name: commit
description: Stage and commit changes
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *)
---
```

Git commands run without per-use approval prompts. Other tools still need normal permission.

### 5. Extended Thinking Trigger

Include the word **"ultrathink"** anywhere in skill content to enable deep reasoning mode for that skill's execution.

---

## ZAO OS Integration

### Current State: 25 Skills

ZAO OS has 25 custom skills in `.claude/skills/`:

| Skill | Type | Notes |
|-------|------|-------|
| `/worksession` | Session management | Creates isolated git worktrees per terminal |
| `/z` | Status dashboard | Parallel context gathering, quick pulse check |
| `/autoresearch` | Autonomous iteration | Karpathy-inspired modify-verify-keep loop + 6 sub-skills |
| `/zao-research` | Research workflow | 7-step process with mandatory doc structure |
| `/morning` | Daily kickoff | Status + priorities + intention |
| `/reflect` | End-of-day | Journal entry with learnings |
| `/vps` | Server management | SSH to VPS, manage ZOE agents, Telegram |
| `/inbox` | Email processing | AgentMail inbox for research topics |
| `/big-win` | Win documentation | Quarterly docs + master index |
| `/lean` | Process audit | 7 wastes identification |
| `/design-steal` | Design language | 55 DESIGN.md files from awesome-design-md |
| `/fishbowlz` | Project management | Sync, deploy, build for fishbowlz.com |
| `/fix-issue` | Issue resolution | GitHub issue → fix → test → commit |
| `/new-route` | API scaffolding | ZAO conventions: Zod, session, NextResponse |
| `/new-component` | Component scaffolding | Dark theme, mobile-first, Tailwind v4 |
| `/check-env` | Env validation | Validates .env.example vars without exposing values |
| `/catchup` | Context restoration | Reads uncommitted changes, recent commits, branches |
| `/standup` | Build-in-public | Git history → Farcaster-ready standup |
| `/next-best-practices` | Background knowledge | Next.js conventions (from Vercel) |
| `/claude-api` | SDK reference | Anthropic SDK patterns |

Plus skills in `skills/` (project root): `fishbowlz/SKILL.md`.

### Optimization Opportunities

| Issue | Skills Affected | Fix |
|-------|----------------|-----|
| Over 500 lines, no progressive disclosure | `/zao-research`, `/autoresearch` | Split into SKILL.md + `references/` |
| Missing `disable-model-invocation` on side-effect skills | `/vps`, `/fishbowlz` | Add `disable-model-invocation: true` |
| No `allowed-tools` restriction | `/z`, `/check-env` | Add `allowed-tools: Read Grep Bash(git *) Bash(lsof *)` for read-only safety |
| No `when_to_use` field | Most skills | Add trigger phrases to improve auto-invocation accuracy |
| No `argument-hint` | `/fix-issue`, `/design-steal` | Add `argument-hint: [issue-number]`, `argument-hint: [company-name]` |
| Sub-skills not using `context: fork` | `/autoresearch` sub-skills | Evaluate forking for `scenario`, `security`, `debug` sub-skills |

### Recommended New Skills

| Skill | Purpose | Pattern |
|-------|---------|---------|
| `/qa` | Pre-merge quality check | `disable-model-invocation: true`, runs typecheck + biome + vitest |
| `/ship` | Full shipping workflow | `disable-model-invocation: true`, PR creation + deploy |
| `/review` | Code review against plan | `context: fork` + `agent: Explore` for read-only analysis |

---

## Known Issues & Gotchas (April 2026)

| Issue | Workaround |
|-------|-----------|
| `disable-model-invocation` doesn't fully hide description from context | Accepted token cost; keep description short |
| `model` field can be overridden by tool calls | No fix yet — GitHub issue #32732 open |
| Skill deadlock with 50+ skill file changes at once | Restart Claude Code after large skill refactors |
| Compaction drops older skills after 25K combined token budget | Re-invoke critical skills after compaction |
| `allowed-tools` grants but doesn't restrict | Use permission settings deny rules to actually block tools |

---

## Superpowers Framework Reference

The Obra Superpowers project (42,000+ stars, MIT, Anthropic marketplace) demonstrates production skill composition:

- 14 composable skills enforcing structured dev workflows
- Sequential pipeline: brainstorm → plan → implement → test → review
- "Mandatory workflows, not suggestions" — skills are process, not tools
- Uses persuasion engineering on LLMs (authority framing, commitment language)
- ZAO OS already borrows these patterns in `.claude/rules/skill-enhancements.md`

---

## Sources

- [Extend Claude with Skills — Official Docs](https://code.claude.com/docs/en/skills)
- [Agent Skills Overview — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Skill Authoring Best Practices — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [How to Create Custom Skills — Claude Help Center](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Claude Code Customization Guide — alexop.dev](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)
- [Progressive Disclosure for AI Coding Tools — alexop.dev](https://alexop.dev/posts/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools/)
- [Awesome Claude Skills — travisvn](https://github.com/travisvn/awesome-claude-skills)
- [Obra Superpowers — GitHub](https://github.com/obra/superpowers)
- [10 Must-Have Skills for Claude in 2026 — Medium](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051)
- [Claude Code Skills Architecture — MindStudio](https://www.mindstudio.ai/blog/claude-code-skills-architecture-skill-md-reference-files/)
