### MANIFEST — ECC-origin Artifacts Installed

> Source: `affaan-m/everything-claude-code`
> Pinned SHA: `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`
> Pinned date: 2026-04-19
> Last updated: 2026-04-20 (after doc 442 top-picks ranking)

---

## Installed — Skills (10)

| Artifact | Path | Source | Added | Tier |
|----------|------|--------|-------|------|
| ecc-verification-loop | `~/.claude/skills/ecc-verification-loop/SKILL.md` | `skills/verification-loop/` | 2026-04-19 | 1 |
| ecc-security-review | `~/.claude/skills/ecc-security-review/` (SKILL.md + cloud-infrastructure-security.md) | `skills/security-review/` | 2026-04-19 | 1 |
| ecc-eval-harness | `~/.claude/skills/ecc-eval-harness/SKILL.md` | `skills/eval-harness/` | 2026-04-19 | 1 |
| ecc-content-hash-cache | `~/.claude/skills/ecc-content-hash-cache/SKILL.md` | `skills/content-hash-cache-pattern/` | 2026-04-19 | Honorable (demoted) |
| ecc-nextjs-turbopack | `~/.claude/skills/ecc-nextjs-turbopack/` | `skills/nextjs-turbopack/` | 2026-04-20 | 1 |
| ecc-postgres-patterns | `~/.claude/skills/ecc-postgres-patterns/` | `skills/postgres-patterns/` | 2026-04-20 | 1 |
| ecc-database-migrations | `~/.claude/skills/ecc-database-migrations/` | `skills/database-migrations/` | 2026-04-20 | 1 |
| ecc-hookify-rules | `~/.claude/skills/ecc-hookify-rules/` | `skills/hookify-rules/` | 2026-04-20 | 1 |
| ecc-agent-introspection | `~/.claude/skills/ecc-agent-introspection/` | `skills/agent-introspection-debugging/` | 2026-04-20 | 1 |
| ecc-skill-stocktake | `~/.claude/skills/ecc-skill-stocktake/` | `skills/skill-stocktake/` | 2026-04-20 | 1 |

## Installed — Agents (1)

| Artifact | Path | Source | Added |
|----------|------|--------|-------|
| ecc-silent-failure-hunter | `~/.claude/agents/ecc-silent-failure-hunter.md` | `agents/silent-failure-hunter.md` | 2026-04-20 |

## Installed — Commands (6)

| Artifact | Path | Source | Added |
|----------|------|--------|-------|
| ecc-learn | `~/.claude/commands/ecc-learn.md` | `commands/learn.md` | 2026-04-19 |
| ecc-skill-create | `~/.claude/commands/ecc-skill-create.md` | `commands/skill-create.md` | 2026-04-19 |
| ecc-hookify | `~/.claude/commands/ecc-hookify.md` | `commands/hookify.md` | 2026-04-20 |
| ecc-hookify-configure | `~/.claude/commands/ecc-hookify-configure.md` | `commands/hookify-configure.md` | 2026-04-20 |
| ecc-hookify-help | `~/.claude/commands/ecc-hookify-help.md` | `commands/hookify-help.md` | 2026-04-20 |
| ecc-hookify-list | `~/.claude/commands/ecc-hookify-list.md` | `commands/hookify-list.md` | 2026-04-20 |

## Installed — Settings

| Key | Value | Added |
|-----|-------|-------|
| `env.CLAUDE_CODE_SUBAGENT_MODEL` | `haiku` | 2026-04-19 |

Backup: `~/.claude/settings.json.pre-ecc-2026-04-19`

---

## Removed (2026-04-20)

| Artifact | Reason |
|----------|--------|
| ecc-strategic-compact | Duplicates `/compact` + caveman compression. Doc 442 ranking. |

---

## Still Deferred (Path B — require explicit decision)

| Artifact | Reason |
|----------|--------|
| ECC hooks (`hooks/hooks.json`) | Coupled to plugin bootstrap. Use `ecc-hookify-rules` skill instead for per-rule hooks. |
| `continuous-learning-v2` full skill + instinct commands | Requires plugin install. Doc 442 ranks as Honorable H1. |
| `/checkpoint`, `/verify`, `/instinct-*`, `/prune`, `/evolve`, `/learn-eval` | Depend on CL-v2. |
| AgentShield (`npx ecc-agentshield`) | D2 pending. Install separately if chosen. |
| MCP servers (Supabase / Playwright / Context7) | D3 pending. Doc 442 picks Context7 + Playwright only. |
| Tkinter dashboard | D4 decided SKIP. |
| Rules (`rules/typescript/`) | D5 pending. 10-min diff-merge pass. |
| Other agents (`pr-test-analyzer`, etc.) | Honorable list only. |

---

## Rollback

Full uninstall of Path A artifacts:

```bash
rm -rf ~/.claude/skills/ecc-* \
       ~/.claude/agents/ecc-* \
       ~/.claude/commands/ecc-*
cp ~/.claude/settings.json.pre-ecc-2026-04-19 ~/.claude/settings.json
```

Per-artifact uninstall: delete the single file/folder.

---

## Next Step

7-day validation window starts 2026-04-20. Re-evaluate top-10 at 2026-04-27 per doc 442 success metrics.
