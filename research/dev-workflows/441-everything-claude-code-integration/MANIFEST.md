### MANIFEST — ECC-origin Artifacts Installed

> Source: `affaan-m/everything-claude-code`
> Pinned SHA: `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`
> Pinned date: 2026-04-19

---

## Installed (Path A — safe cherry-pick)

| Artifact | Type | Path | Source | Added | Status |
|----------|------|------|--------|-------|--------|
| ecc-verification-loop | skill | `~/.claude/skills/ecc-verification-loop/SKILL.md` | `skills/verification-loop/SKILL.md` | 2026-04-19 | ACTIVE |
| ecc-security-review | skill | `~/.claude/skills/ecc-security-review/` (SKILL.md + cloud-infrastructure-security.md) | `skills/security-review/` | 2026-04-19 | ACTIVE |
| ecc-eval-harness | skill | `~/.claude/skills/ecc-eval-harness/SKILL.md` | `skills/eval-harness/SKILL.md` | 2026-04-19 | ACTIVE |
| ecc-strategic-compact | skill | `~/.claude/skills/ecc-strategic-compact/` (SKILL.md + suggest-compact.sh) | `skills/strategic-compact/` | 2026-04-19 | ACTIVE |
| ecc-content-hash-cache | skill | `~/.claude/skills/ecc-content-hash-cache/SKILL.md` | `skills/content-hash-cache-pattern/SKILL.md` | 2026-04-19 | ACTIVE |
| ecc-learn | command | `~/.claude/commands/ecc-learn.md` | `commands/learn.md` | 2026-04-19 | ACTIVE |
| ecc-skill-create | command | `~/.claude/commands/ecc-skill-create.md` | `commands/skill-create.md` | 2026-04-19 | ACTIVE |
| env.CLAUDE_CODE_SUBAGENT_MODEL | setting | `~/.claude/settings.json` | ECC README | 2026-04-19 | ACTIVE (haiku) |

Backup: `~/.claude/settings.json.pre-ecc-2026-04-19`

---

## Deferred (Path B — require explicit decision)

| Artifact | Reason |
|----------|--------|
| ECC hooks (`hooks/hooks.json`) | Tightly coupled to ECC plugin bootstrap (`scripts/hooks/plugin-hook-bootstrap.js` + `scripts/lib/utils.js`). Can't cherry-pick cleanly. Requires full plugin install. |
| `continuous-learning-v2` skill + instinct system | Has `agents/`, `hooks/`, `scripts/` subdirs that reference ECC root scripts. Requires full plugin install OR heavy manual port. |
| `/checkpoint`, `/verify`, `/instinct-*`, `/prune`, `/evolve`, `/learn-eval` commands | Depend on continuous-learning-v2 backend. Install only after CL-v2 works. |
| `/harness-audit` command | Needs `scripts/harness-audit.js` at ECC root. |
| AgentShield (`npx ecc-agentshield`) | Third-party npm package. Needs Zaal OK to install + run. |
| MCP servers (Supabase, Playwright, Context7) | Need API keys + per-server config. Needs Zaal OK + creds. |
| Tkinter dashboard (`ecc_dashboard.py`) | Python + tk dep. Needs Zaal OK. |
| Rules (`rules/typescript/`) | Diff-merge pass needed into `.claude/rules/` (project-local). |
| Agents (`harness-optimizer`, etc.) | Some depend on scripts. Diff per-agent. |

---

## Rollback

Full uninstall of Path A artifacts:

```bash
rm -rf \
  ~/.claude/skills/ecc-verification-loop \
  ~/.claude/skills/ecc-security-review \
  ~/.claude/skills/ecc-eval-harness \
  ~/.claude/skills/ecc-strategic-compact \
  ~/.claude/skills/ecc-content-hash-cache \
  ~/.claude/commands/ecc-learn.md \
  ~/.claude/commands/ecc-skill-create.md
cp ~/.claude/settings.json.pre-ecc-2026-04-19 ~/.claude/settings.json
```

Partial uninstall: delete single artifact + leave others.

---

## Verification

After install, Claude Code listed these skills in available-skills:

- `ecc-verification-loop: A comprehensive verification system for Claude Code sessions.`
- `ecc-security-review: Use this skill when adding authentication, handling user input...`
- `ecc-eval-harness: Formal evaluation framework...`
- `ecc-strategic-compact: Suggests manual context compaction...`
- `ecc-content-hash-cache: Cache expensive file processing results...`
- `ecc-learn: /learn - Extract Reusable Patterns`
- `ecc-skill-create: Analyze local git history to extract coding patterns...`

settings.json valid JSON after edit: confirmed.
