# ZAO Research Agent Tools

## Paperclip API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agents/me` | Check identity, role, budget |
| `GET /api/companies/{id}/issues` | List assigned tasks |
| `POST /api/issues/{id}/checkout` | Lock a task before working |
| `POST /api/companies/{id}/issues` | Create subtasks |
| `POST /api/cost-events` | Report spending |

Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on mutating calls.

## Claude Code Tools (Research-Focused)

You have READ-ONLY access to the codebase plus web research:

| Tool | Your Use Case |
|------|-------------|
| **Read** | Read research docs, code files, configs |
| **Grep** | Search research docs and codebase for topics |
| **Glob** | Find files by pattern (research/*/README.md, src/app/api/**/route.ts) |
| **WebSearch** | Find new information online (always use current year 2026) |
| **WebFetch** | Fetch primary sources (GitHub READMEs, official docs, specs) |
| **Write** | Create new research docs and update indexes ONLY |
| **Edit** | Update existing research docs and skill files ONLY |
| **Agent** | Dispatch sub-agents for parallel research on multiple topics |

**You do NOT use:** Bash (no shell commands), no code execution, no npm commands.

## Research Library Map

| Location | What |
|----------|------|
| `research/` | 70+ numbered research docs |
| `research/README.md` | Master index by topic category |
| `.claude/skills/zao-research/SKILL.md` | Research skill workflow |
| `.claude/skills/zao-research/research-index.md` | Full doc inventory table |
| `.claude/skills/zao-research/topics.md` | Docs organized by category |
| `.claude/skills/zao-research/search-patterns.md` | How to search research + codebase |
| `.claude/skills/zao-research/new-research.md` | Template + process for new docs |
| `.claude/skills/zao-research/project-context.md` | ZAO tech stack, what's built |

## Key Codebase Files to Check

| What | Where |
|------|-------|
| Branding, channels, contracts | `community.config.ts` |
| Project conventions | `CLAUDE.md` |
| Security rules | `SECURITY.md` |
| API routes | `src/app/api/` |
| Components | `src/components/` |
| Database schemas | `scripts/*.sql` |
| Auth | `src/lib/auth/session.ts` |
| Canonical guide | `research/50-the-zao-complete-guide/README.md` |

## Research Doc Template

```markdown
# {Number} — {Title}

> **Status:** Research complete
> **Date:** {Today's date}
> **Goal:** {One-line description}

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **{What}** | {Specific actionable recommendation for ZAO OS} |

---

## {Section 1}

{Content with tables, numbers, comparisons}

---

## Sources

- [Source Name](URL)
```

## Partner Platforms to Monitor

| Platform | URL | What to Watch |
|----------|-----|--------------|
| Incented | incented.co/organizations/zabal | New campaigns, protocol updates |
| SongJam | songjam.space/zabal | Leaderboard changes, $SANG updates |
| Empire Builder | empirebuilder.world | Empire features, Clanker integration |
| MAGNETIQ | magnetiq.xyz | API release, POM updates |
| Clanker | clanker.world | Protocol changes (now owned by Neynar) |

(Add notes about new tools and sources as you discover them.)
