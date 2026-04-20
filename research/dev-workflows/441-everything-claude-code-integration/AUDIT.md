### AUDIT — ECC Structure vs Cherry-Pick Plan

> Ran Phase 1 audit 2026-04-19. Pinned SHA: `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`

---

## Pre-Install State

- ECC cloned to `~/scratch/ecc/`
- Collision check on `~/.claude/skills/`: **0 collisions** with target skills
- Current `~/.claude/settings.json`: has `MAX_THINKING_TOKENS=10000`, permissions, Notification hook, 3 enabled plugins (superpowers, oh-my-mermaid, caveman)
- Current skill count target paths: all clean

---

## Real ECC Structure (verified)

| Directory | Count | Notes |
|-----------|-------|-------|
| `skills/` | 183 | README inflated count is accurate |
| `commands/` | 79+ | Confirmed: learn, checkpoint, verify, harness-audit, skill-create, instinct-*, prune, evolve, eval, etc. |
| `agents/` | 48+ | Confirmed: architect, planner, code-reviewer, language-specific reviewers, harness-optimizer |
| `hooks/` | 1 monolithic file | `hooks.json` — NOT 20 individual hooks. Heavy Node.js plugin bootstrap. |
| `rules/` | 15 subdirs | common, typescript, python, go, swift, java, kotlin, rust, cpp, csharp, dart, perl, php, web, zh |
| `scripts/` | 32 subdirs | Plugin runtime infra — hooks depend on this |
| `mcp-configs/` | 1 | `.mcp.json` + config dir |

---

## Cherry-Pick Feasibility Per Target

| Target | Path | Files | Deps | Verdict |
|--------|------|-------|------|---------|
| `verification-loop` skill | `skills/verification-loop/` | SKILL.md only | none | **COPY (safe)** |
| `security-review` skill | `skills/security-review/` | SKILL.md + cloud-infrastructure-security.md | none | **COPY (safe)** |
| `eval-harness` skill | `skills/eval-harness/` | SKILL.md only | none | **COPY (safe)** |
| `strategic-compact` skill | `skills/strategic-compact/` | SKILL.md + suggest-compact.sh | none | **COPY (safe, sh script self-contained)** |
| `content-hash-cache-pattern` skill | `skills/content-hash-cache-pattern/` | SKILL.md only | none | **COPY (safe)** |
| `continuous-learning-v2` skill | `skills/continuous-learning-v2/` | SKILL.md + agents/ + config.json + hooks/ + scripts/ | **ECC plugin bootstrap required** | **DEFER — needs full plugin install OR heavy port** |
| `skill-create` command | `commands/skill-create.md` | single md file | none (pure prompt) | **COPY (safe)** |
| `learn` command | `commands/learn.md` | single md file | none (pure prompt) | **COPY (safe)** |
| `harness-audit` command | `commands/harness-audit.md` | single md file | **needs `scripts/harness-audit.js`** | **DEFER — script dep** |
| `checkpoint`, `verify`, `instinct-*`, `prune`, `evolve`, `learn-eval` | various | each single md | likely need continuous-learning-v2 backend | **DEFER — depends on CL-v2** |
| Hooks | `hooks/hooks.json` | 1 monolith | **needs ECC scripts/lib/utils.js + scripts/hooks/*.js** | **DEFER — can't cleanly cherry-pick** |
| Rules (typescript) | `rules/typescript/` | multiple md | none | **DIFF-then-merge into `.claude/rules/`** |

---

## Strategy Shift

Original plan assumed individual hook files and standalone continuous-learning. Reality: ECC hooks + CL-v2 are **tightly coupled to the plugin bootstrap system**.

Two viable paths:

**Path A (current — Phase 1/2 executed):** Cherry-pick the 5 safe standalone skills + 2 safe commands. Skip hooks + CL-v2 + dependent commands.
- Pros: zero risk, incremental, easy rollback.
- Cons: miss out on instinct system + auto-hooks.

**Path B (deferred — requires Zaal decision):** Full plugin install via `/plugin marketplace add + /plugin install`. Get everything including hooks + CL-v2. Then disable unwanted skills via config.
- Pros: full system working, auto-updates.
- Cons: 183 skills loaded, potential skill-routing collisions with superpowers/caveman/autoresearch, unclear uninstall.

**Recommendation:** execute Path A now. Evaluate Path B in 2 weeks if the 5 copied skills prove value.

---

## Files Being Installed This Session

Safe cherry-pick (Path A):

```
~/.claude/skills/ecc-verification-loop/SKILL.md
~/.claude/skills/ecc-security-review/SKILL.md
~/.claude/skills/ecc-security-review/cloud-infrastructure-security.md
~/.claude/skills/ecc-eval-harness/SKILL.md
~/.claude/skills/ecc-strategic-compact/SKILL.md
~/.claude/skills/ecc-strategic-compact/suggest-compact.sh
~/.claude/skills/ecc-content-hash-cache/SKILL.md
~/.claude/commands/ecc-skill-create.md
~/.claude/commands/ecc-learn.md
```

Settings changes:

```
~/.claude/settings.json:
  env.CLAUDE_CODE_SUBAGENT_MODEL = "haiku"
  (keep existing MAX_THINKING_TOKENS=10000)
  (no hook additions this pass)
```

Backup:

```
~/.claude/settings.json.pre-ecc-2026-04-19
```

---

## Deferred Pending Explicit Decision

1. **AgentShield** (`npx ecc-agentshield`) — runs third-party npm package. Need explicit OK.
2. **MCP servers** (Supabase, Playwright, Context7) — need API keys + config. Need explicit OK + creds.
3. **continuous-learning-v2 + hooks + instinct commands** — requires Path B (full plugin install) OR manual port of scripts/lib/*. Need explicit OK on install strategy.
4. **Tkinter dashboard** (`ecc_dashboard.py`) — requires Python env + tk. Need explicit OK.
5. **Rules merge** — requires diff pass on `rules/typescript/` → `.claude/rules/`. Easy but manual.

---

## Rollback

One-liner:

```bash
rm -rf ~/.claude/skills/ecc-* ~/.claude/commands/ecc-* && cp ~/.claude/settings.json.pre-ecc-2026-04-19 ~/.claude/settings.json
```
