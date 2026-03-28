# 69 — Claude Code Tips & Best Practices for ZAO OS

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Audit ZAO OS's Claude Code setup against community best practices (ykdojo/claude-code-tips), identify gaps, and document actionable improvements

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Add HANDOFF.md pattern** | CREATE a `/handoff` command that captures session state between conversations — ZAO's memory system is great but lacks session-to-session handoffs (Tip 8) |
| **Add test suite** | START with Vitest for API routes. No tests exist. This is ZAO's biggest gap. (Tips 9, 34) |
| **Add cc-safe scanner** | RUN `npx cc-safe .` to audit Claude Code permissions settings — aligns with ZAO's security-first stance |
| **Fix CLAUDE.md doc count** | UPDATE "54 research docs" → "70 research docs" — drift detected per Tip 30 |
| **Add setup script** | CREATE `scripts/setup-claude.sh` that installs ZAO's skills, commands, and agent configs for forks (Tip 45) |
| **Context compaction strategy** | DOCUMENT when to `/compact` — after research sessions spanning 10+ docs |

---

## Source: ykdojo/claude-code-tips

**Repo:** [github.com/ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips)
**Author:** YK Sugishita (CS Dojo YouTube)
**Stats:** 5,500 stars, 386 forks, 45 tips
**License:** MIT

---

## ZAO OS vs Community Best Practices

### What ZAO Already Does Better

| Area | ZAO OS | Community Standard |
|------|--------|-------------------|
| **Research infrastructure** | 70 docs + `/zao-research` skill with indexes | Tip 27 suggests basic web fetching |
| **Autonomous loops** | `autoresearch` skill with 9 workflow modes | Nothing comparable in tips |
| **Security rules** | Explicit rules for keys, env vars, dangerouslySetInnerHTML, RLS | YK uses container isolation + cc-safe |
| **Domain-specific skills** | `next-best-practices` with 20 reference files | Generic skills only |
| **Memory system** | 13 categorized memory files | HANDOFF.md between sessions |
| **Skills + commands** | 10+ commands, 2 skills, 1 agent | 2 skills max in most setups |

### Gaps to Close

| Gap | Tip # | Action | Priority |
|-----|-------|--------|----------|
| No test suite | 9, 34 | Add Vitest, start with API route tests | HIGH |
| No HANDOFF.md | 8 | Create `/handoff` command | MEDIUM |
| No cc-safe scans | 33 | Run `npx cc-safe .` regularly | MEDIUM |
| CLAUDE.md doc count stale | 30 | Update to 70 docs | LOW (do now) |
| No setup script for forks | 45 | Create `scripts/setup-claude.sh` | LOW |
| No GLOBAL-CLAUDE.md | — | Create `~/.claude/CLAUDE.md` for Zaal's personal defaults | LOW |
| No container isolation | 21 | Use Docker for Supabase migrations and blockchain scripts | FUTURE |
| No voice input | 2 | Try SuperWhisper for build-in-public narrated sessions | FUTURE |

---

## Top 10 Most Relevant Tips for ZAO OS

1. **Tip 5: Context Is Milk** — Each research doc = own conversation. Each feature = fresh start. Critical with 70 docs.
2. **Tip 8: HANDOFF.md** — Bridge multi-session work. Capture what worked, what failed, next steps.
3. **Tip 9: Write-Test Cycle** — Provide verification methods for autonomous work. ZAO has none.
4. **Tip 16: Git Worktrees** — Work on governance branch + main simultaneously. ZAO has active changes on both.
5. **Tip 25: CLAUDE.md vs Skills vs Commands** — ZAO already implements all 4 categories. This validates the approach.
6. **Tip 30: Review CLAUDE.md Periodically** — Doc count drift detected. Schedule monthly review.
7. **Tip 33: Audit Approved Commands** — Security-critical with ZAO's non-negotiable security rules.
8. **Tip 34: TDD** — ZAO's biggest gap. 50 API routes with zero tests.
9. **Tip 36: Sub-Agents** — Run research in background while building. Autoresearch skill could leverage this.
10. **Tip 44: dx Plugin** — Package ZAO's Claude setup for fork distribution.

---

## Sources

- [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips) — 5,500 stars, 45 tips
- [Claude Code Best Practices — Official](https://code.claude.com/docs/en/best-practices)
- [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
- [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide)
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [Doc 44 — Agentic Development Workflows](../044-agentic-development-workflows/)
- [Doc 67 — Paperclip AI Agent Company](../067-paperclip-ai-agent-company/)
