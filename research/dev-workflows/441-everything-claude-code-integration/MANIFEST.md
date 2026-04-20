### MANIFEST — ECC-origin Artifacts Installed

> Source: `affaan-m/everything-claude-code`
> Pinned SHA: `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f` (audit reference)
> Pinned date: 2026-04-19
> Last updated: 2026-04-20 (Path B — full plugin install)

---

## Current Strategy: PATH B (Full Plugin Install + Selective Disable)

Previous Path A cherry-picks REMOVED. Plugin now provides all ECC artifacts natively, selectively filtered via `skillOverrides`.

### Why Path B?
- Unlocks `continuous-learning-v2` (instinct system) — the biggest ECC feature.
- Unlocks `/checkpoint`, `/verify`, `/learn`, `/harness-audit`, `/evolve`, `/prune`, `/instinct-*` commands.
- Unlocks all ECC hooks (coupled to plugin bootstrap).
- Cherry-pick overhead eliminated — upstream ECC updates flow through.

### Trade-off
- 48 agents + 79 commands load (no filter mechanism).
- 183 skills, but 163 disabled via `skillOverrides`.
- Active skill count from ECC plugin: **20**.

---

## Plugin Config (~/.claude/settings.json)

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": { "source": "github", "repo": "affaan-m/everything-claude-code" }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  },
  "skillOverrides": {
    "everything-claude-code:<skill-name>": "off"  // 163 entries
  }
}
```

Backup: `~/.claude/settings.json.pre-path-b-2026-04-20`
Previous (Path A) backup still at: `~/.claude/settings.json.pre-ecc-2026-04-19`

---

## Active ECC Skills (20, plugin-scoped as `everything-claude-code:<name>`)

### Top 10 (daily-use, from doc 442)
| Skill | Why |
|-------|-----|
| `continuous-learning-v2` | Instinct store — captures patterns session-to-session |
| `continuous-learning` | Legacy compat for CL-v2 hooks |
| `verification-loop` | Post-edit build/test/lint/typecheck cycle |
| `security-review` | OWASP + cloud infra checklist |
| `eval-harness` | Eval-driven dev for VAULT/BANKER/DEALER |
| `nextjs-turbopack` | Next.js 16 + Turbopack perf knobs |
| `postgres-patterns` | Supabase query/index/RLS patterns |
| `database-migrations` | Safe schema change playbook |
| `hookify-rules` | Author hookify rules from natural language |
| `agent-introspection-debugging` | Debug ZAO agents when they loop |
| `skill-stocktake` | Audit 80+ skill quality |

### Honorable mentions (kept, situational)
| Skill | When |
|-------|------|
| `gateguard` | Fact-forcing gate before edits (+2.25 quality) |
| `rules-distill` | Auto-promote cross-cutting principles to `.claude/rules/` |
| `architecture-decision-records` | ADRs for major new modules |
| `prompt-optimizer` | Tune agent/skill prompts |
| `canary-watch` | Pre-deploy regression radar |
| `deployment-patterns` | Vercel + rollout patterns |
| `mcp-server-patterns` | Maintain ZAO's existing MCP server |
| `content-hash-cache-pattern` | SHA-256 file processing cache |
| `strategic-compact` | Context compaction suggestions |

---

## Disabled (163 of 183 ECC skills — see `/tmp/ecc-overrides.json` or settings.json)

Dropped reasons:
- Framework not in ZAO stack (Django, Spring, Laravel, NestJS, Nuxt, Rails, Flutter, Android, etc.)
- Language not TS/Python (Go, Rust, C++, Perl, Java, C#, PHP, Ruby)
- Industry-specific (healthcare, logistics, customs, carrier)
- Direct duplicates of existing ZAO skills (tdd-workflow, code-reviewer, planner, etc.)
- Niche / unclear value (ralphinho-rfc, santa-method, ck, etc.)

Full list lives in `~/.claude/settings.json` `skillOverrides` block.

---

## Agents (48 — all load, no filter mechanism)

Most daily-relevant:
- `silent-failure-hunter` — hunt swallowed errors (pre-ship)
- `pr-test-analyzer` — behavioral coverage check on PR diffs
- `harness-optimizer` — audit Claude Code setup
- `planner` / `architect` — reference only (prefer `/plan-eng-review` + `/plan-ceo-review`)
- Language reviewers (`typescript-reviewer`, `python-reviewer`, etc.) — ignore unless targeting language

---

## Commands (79 — all load as slash commands)

Key additions from Path B (previously absent):
- `/checkpoint` — save verification state
- `/verify` — run verification loop
- `/learn` — extract patterns from session
- `/learn-eval` — extract + evaluate before saving
- `/harness-audit` — audit repository harness
- `/evolve` — evolve captured instincts
- `/prune` — remove stale instincts
- `/instinct-status` / `/instinct-import` / `/instinct-export`
- `/skill-create` — generate skills from git history
- `/skill-health` — check skill quality
- `/model-route` — task routing by complexity
- `/pm2` — service lifecycle
- `/multi-plan` / `/multi-execute` / `/orchestrate`

Collisions to watch (if they happen, rename in doc 442 follow-up):
- `/plan` — we have `/plan-eng-review`, `/plan-ceo-review`, `/plan-design-review`
- `/tdd` — we have superpowers:test-driven-development
- `/e2e` — we have `/qa`, `gstack`
- `/build-fix`, `/refactor-clean` — unclear, likely fine

---

## Hooks (active via plugin)

ECC `hooks.json` wires many PreToolUse/PostToolUse/SessionStart hooks. Plugin bootstrap handles execution:
- `pre:bash:dispatcher` — bash preflight checks
- `pre:write:doc-file-warning` — warn on non-standard docs
- `pre:edit-write:suggest-compact` — auto-compact suggestion
- `pre:observe:continuous-learning` — capture tool use for CL-v2
- `pre:governance-capture` — policy/secret events
- `pre:config-protection` — block linter/formatter config edits
- `pre:mcp-health-check` — MCP server health gate
- `pre:edit-write:gateguard-fact-force` — gateguard fact-forcing
- `PreCompact` hooks
- Plus SessionStart hooks

Strictness controlled via env var `ECC_HOOK_PROFILE=minimal|standard|strict` (default: standard after plugin install).

---

## MCPs (still manual, separate from plugin)

Installed via `claude mcp add`:
- `context7` — `npx -y @upstash/context7-mcp@2.1.4`
- `playwright` — `npx -y @playwright/mcp@0.0.69 --extension`

Stored in `~/.claude.json` (not settings.json).

---

## Rules (still manual, plugin can't auto-distribute)

- `.claude/rules/typescript-hygiene.md` — merged additive from ECC `rules/typescript/`

---

## Env Vars

`~/.claude/settings.json` env:
- `MAX_THINKING_TOKENS=10000`
- `CLAUDE_CODE_SUBAGENT_MODEL=haiku`

Plugin may add `ECC_HOOK_PROFILE`, `ECC_DISABLED_HOOKS`, `ECC_GOVERNANCE_CAPTURE`, etc. Check after first load.

---

## Rollback (to Pre-ECC State)

```bash
cp ~/.claude/settings.json.pre-ecc-2026-04-19 ~/.claude/settings.json
```

## Partial Rollback (from Path B to Path A)

```bash
cp ~/.claude/settings.json.pre-path-b-2026-04-20 ~/.claude/settings.json
# Then re-install the 10 ecc-* cherry-picks per previous MANIFEST entry
```

## Rollback (remove just plugin, keep everything else)

Remove from settings.json:
- `enabledPlugins["everything-claude-code@everything-claude-code"]`
- `extraKnownMarketplaces["everything-claude-code"]`
- All `skillOverrides` keys starting with `everything-claude-code:`

---

## Verification (after Claude Code restart)

Run these to confirm plugin loaded:

```bash
# Plugin listing
claude /plugin list

# Should see everything-claude-code@everything-claude-code

# Skill listing should include everything-claude-code:continuous-learning-v2, :verification-loop, etc.
# Disabled skills should NOT appear.

# Commands — test
claude /learn
claude /checkpoint
claude /verify
claude /harness-audit
```

---

## Next Steps

1. Restart Claude Code to trigger plugin install from marketplace.
2. Verify 20 ECC skills visible, ~163 hidden.
3. Test `/learn` + `/checkpoint` + `/verify` + `/harness-audit` commands.
4. Run `/harness-audit` on current setup — save report.
5. 7-day window: use `/learn` at end of each session to populate instinct store.
6. 2026-04-27: evaluate continuous-learning-v2 value via `/instinct-status`.
