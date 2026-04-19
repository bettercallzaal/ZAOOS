### PLAN — ECC Integration into ZAO OS Workflow

> Companion to `README.md` (research doc 441). This is the execution spec.

---

## Goal

Adopt the highest-value pieces of `affaan-m/everything-claude-code` (ECC) into the global `~/.claude/` setup + ZAO OS project config, WITHOUT duplicating existing superpowers / caveman / autoresearch / gstack skills.

---

## Target Outcomes

1. Security: AgentShield scan wired into `/ship`. Secret-detection + git-push-review hooks active.
2. Continuous learning: `/learn` + `/checkpoint` + `/verify` running after every session. Instinct store populated.
3. Verification loop: `verification-loop` skill as default post-edit discipline.
4. Harness-audit: ran once, report saved, remediations applied.
5. MCPs: Supabase (read-only), Playwright, Context7 wired in.
6. Model routing: `CLAUDE_CODE_SUBAGENT_MODEL=haiku` env var set. Subagent cost down est. 40-60%.
7. Zero duplicate commands. No skill-routing collisions.
8. Rollback path: every added artifact listed in a manifest, one-command removal.

---

## Pre-Flight Checks

Run before Phase 1:

```bash
# 1. Current skill/agent count for baseline
ls ~/.claude/skills/ | wc -l
ls ~/.claude/agents/ | wc -l
cat ~/.claude/settings.json | jq '.env, .mcpServers, .hooks'

# 2. Git state clean
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git status

# 3. Confirm Claude Code CLI version ≥ 2.1.0
claude --version
```

Acceptance: baseline numbers recorded in a scratch note. Working tree clean.

---

## Phase 1 — Audit & Pin (difficulty 2/10)

**Scope:** pull ECC to a scratch dir, pin SHA, run their `/harness-audit` against current setup.

Steps:
1. `mkdir -p ~/scratch && cd ~/scratch`
2. `git clone https://github.com/affaan-m/everything-claude-code.git ecc`
3. `cd ecc && git rev-parse HEAD > ~/scratch/ecc-pin.sha`
4. Read `ecc/agents/harness-optimizer.md` + `ecc/commands/harness-audit.md` to understand audit scope.
5. Manually copy `harness-optimizer` agent to `~/.claude/agents/ecc-harness-optimizer.md` (prefix to avoid collision).
6. Invoke via subagent from ZAO OS session. Feed it `~/.claude/settings.json` + current skill list. Save report to `research/dev-workflows/441-everything-claude-code-integration/audit-report.md`.

Exit criteria: audit report saved. Known risks documented.

Rollback: `rm ~/.claude/agents/ecc-harness-optimizer.md`.

---

## Phase 2 — Cherry-Pick Core Skills (difficulty 3/10)

**Scope:** copy 7 skills to `~/.claude/skills/`, renamed with `ecc-` prefix to avoid collision.

Skills to pull:
- `ecc/skills/verification-loop/` → `~/.claude/skills/ecc-verification-loop/`
- `ecc/skills/continuous-learning-v2/` → `~/.claude/skills/ecc-continuous-learning/`
- `ecc/skills/security-review/` → `~/.claude/skills/ecc-security-review/`
- `ecc/skills/eval-harness/` → `~/.claude/skills/ecc-eval-harness/`
- `ecc/skills/strategic-compact/` → `~/.claude/skills/ecc-strategic-compact/`
- `ecc/skills/skill-creator/` → `~/.claude/skills/ecc-skill-creator/`
- `ecc/skills/content-hash-cache-pattern/` → `~/.claude/skills/ecc-content-hash-cache/`

Steps:
1. `for s in verification-loop continuous-learning-v2 security-review eval-harness strategic-compact skill-creator content-hash-cache-pattern; do cp -r ~/scratch/ecc/skills/$s ~/.claude/skills/ecc-$s; done`
2. Edit each `SKILL.md` frontmatter: rename + update `description` to note `ecc-` origin + pin SHA.
3. Open new Claude Code session, list skills, confirm all 7 appear with ecc- prefix.
4. Test each skill one at a time on a trivial task. Record which work out-of-box vs need tweaks.

Exit criteria: 7 skills loaded. Zero name collisions. Each tested once.

Rollback: `rm -rf ~/.claude/skills/ecc-*`.

---

## Phase 3 — Hooks + Settings (difficulty 4/10)

**Scope:** install 3 hooks + 2 env vars. Use `update-config` skill.

Hooks to add:
- Secret-pattern detection on `PreToolUse` for Write/Edit tools.
- console.log detection on `PostToolUse` for `.ts/.tsx` files.
- git-push-review warning on `PreToolUse` for Bash tool with `git push` matcher.

Env vars to add to `~/.claude/settings.json`:
- `CLAUDE_CODE_SUBAGENT_MODEL=haiku`
- `ECC_HOOK_PROFILE=standard`

Steps:
1. Invoke `update-config` skill.
2. Paste hook JSON from `ecc/hooks/*.json` (adapted).
3. Test each hook: trigger Edit on a file with `console.log`, confirm warning. Attempt `git push` via Bash, confirm warning.
4. Verify no conflict with caveman SessionStart hook.

Exit criteria: 3 hooks active. 2 env vars set. Caveman still firing.

Rollback: `jq` remove hook entries from `settings.json`. Unset env vars.

---

## Phase 4 — MCPs (difficulty 5/10)

**Scope:** add Supabase (read-only), Playwright, Context7 MCP servers.

Steps:
1. Supabase MCP: clone setup from `ecc/mcp-servers/supabase/`. Config with **anon key only** (never service role). Scope to single project (ZAO OS Supabase URL).
2. Playwright MCP: install official server `@modelcontextprotocol/server-playwright`.
3. Context7 MCP: install `@upstash/context7-mcp`. Verify Next.js 16 + React 19 + Supabase docs retrievable.
4. Update `~/.claude/settings.json` `mcpServers` block.
5. Restart Claude Code. Confirm MCP count is 8 (5 existing + 3 new).

Constraints:
- Supabase MCP **must use anon key**. Service role stays server-only (per ZAO OS CLAUDE.md security rules).
- Scope Supabase MCP to read-only if server supports it. Otherwise test queries against non-prod table first.

Exit criteria: 3 MCPs listed via `/mcp`. Test query works. Total MCPs ≤ 10.

Rollback: remove entries from `settings.json` `mcpServers`.

---

## Phase 5 — AgentShield Integration (difficulty 3/10)

**Scope:** add security scan to `/ship` workflow.

Steps:
1. Run baseline: `cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npx ecc-agentshield scan --opus --stream`
2. Review findings. Expected: some false-positives (test fixtures, docs). Triage into real vs ignore.
3. Create `.agentshield-ignore` with justified exclusions.
4. Re-run. Confirm clean or ≤5 known-acceptable findings.
5. Edit `~/.claude/skills/ship/SKILL.md` (or equivalent): append AgentShield step before PR creation, warning-only for first week.
6. After 1 week of clean scans, flip AgentShield to **blocking** in `/ship`.

Exit criteria: AgentShield runs in `/ship`. Baseline findings triaged.

Rollback: remove AgentShield step from `/ship` skill.

---

## Phase 6 — Instinct System (difficulty 4/10)

**Scope:** stand up `ecc-continuous-learning` + `/learn` + `/checkpoint` + `/verify` equivalents.

Steps:
1. Copy `ecc/commands/learn.md`, `checkpoint.md`, `verify.md`, `instinct-status.md`, `prune.md` to `~/.claude/commands/` with `ecc-` prefix.
2. Configure instinct store path under `~/.claude/projects/.../instincts/` (separate from `memory/`).
3. Run `/ecc-learn` at end of each of next 7 work sessions.
4. Run `/ecc-instinct-status` after 7 days. Review captured patterns.
5. Prune false-positive instincts with `/ecc-prune`.
6. Decide: keep or remove. If keep, drop `ecc-` prefix on commands.

Constraints:
- **Do not merge instinct store with auto-memory.** Separate files. Auto-memory is authoritative for user/feedback/project/reference types; instincts are code-pattern-specific.
- Namespace: `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/instincts/` (mirrors memory path).

Exit criteria: instinct store populated after 7 sessions. No collision with auto-memory.

Rollback: `rm -rf ~/.claude/projects/.../instincts/` + remove commands.

---

## Phase 7 — Skill-Creator on ZAO OS History (difficulty 5/10)

**Scope:** auto-generate ZAO-specific skills from git history.

Steps:
1. `cd "/Users/zaalpanthaki/Documents/ZAO OS V1"`
2. Invoke `ecc-skill-creator` skill with target: `git log --since="2025-10-01"` (6 months).
3. Review generated skill proposals. Expected outputs: patterns like "adding a new API route to `/api/foo/`", "wiring a new Supabase table + RLS", "adding a Farcaster cast type", etc.
4. Accept top 3-5 proposals. Reject the rest.
5. Save accepted skills to `.claude/skills/` (project-local, not global) — they're ZAO-specific.
6. Test each on next matching task.

Exit criteria: 3-5 ZAO-specific skills created from real git history. Each tested once.

Rollback: `rm .claude/skills/<generated>/`.

---

## Phase 8 — Validation + Retire Duplicates (difficulty 3/10)

**Scope:** after 2 weeks, measure which ECC pieces stuck and which got rolled back.

Steps:
1. Count invocations per ecc- prefixed skill/command over 2 weeks (via Claude Code logs or manual journal).
2. Any skill invoked < 2 times in 2 weeks → rollback.
3. Any skill that collided or conflicted → rollback.
4. Write doc 442 (follow-up) summarizing: kept vs dropped, token impact, new instincts, AgentShield findings prevented.
5. Update `CLAUDE.md` to document kept artifacts.
6. Drop `ecc-` prefix on kept artifacts — they're now part of the standard kit.

Exit criteria: doc 442 saved. `CLAUDE.md` reflects final state. Manifest of all ECC-origin artifacts maintained.

---

## Manifest Format

Save at `research/dev-workflows/441-everything-claude-code-integration/MANIFEST.md`:

```markdown
| Artifact | Type | Path | Source SHA | Added | Kept/Dropped |
|----------|------|------|-----------|-------|--------------|
| ecc-verification-loop | skill | ~/.claude/skills/ecc-verification-loop/ | <sha> | 2026-04-19 | TBD |
| ...
```

---

## Total Difficulty & Sequencing

| Phase | Difficulty | Depends On |
|-------|------------|------------|
| 1. Audit | 2 | — |
| 2. Skills | 3 | 1 |
| 3. Hooks | 4 | 1 |
| 4. MCPs | 5 | 1 |
| 5. AgentShield | 3 | 1 |
| 6. Instincts | 4 | 2 |
| 7. Skill-Creator | 5 | 2 |
| 8. Validate | 3 | 6, 7 |

Phases 2, 3, 4, 5 can run in parallel after Phase 1. Sequence 6 → 7 → 8.

---

## Success Metrics (measure at Phase 8)

| Metric | Target |
|--------|--------|
| Skills kept after 2 weeks | ≥ 4 of 7 |
| Instincts captured | ≥ 15 |
| AgentShield findings blocked from shipping | ≥ 1 real secret/injection risk |
| Subagent token cost | -40% vs baseline (via haiku routing) |
| MCP count | ≤ 10 (ECC recommendation) |
| Command collisions | 0 |
| Commands added to daily use | ≥ 3 |
| Rollback events | ≤ 3 |

---

## Open Questions (brainstorm with Zaal before Phase 1)

1. Scope: global install (`~/.claude/`) vs ZAO-OS-project-only (`.claude/`)? Default: global for skills + agents, project-local for auto-generated ones.
2. `ecc-` prefix: keep forever, or drop after Phase 8? Default: drop on kept artifacts.
3. AgentShield in `/ship`: warning-only vs blocking? Default: warning-only for week 1, blocking after.
4. Instinct store namespacing: separate from memory/, or merge? Default: separate.
5. Should we also install the Tkinter dashboard (`npm run dashboard`)? Default: SKIP.
6. Rules: copy `ecc/rules/typescript/` to `.claude/rules/` (project) or `~/.claude/rules/` (global)? Default: diff first, then merge additive rules into project-local `.claude/rules/api-routes.md` + `components.md` + `tests.md`.

---

## Next Action

Confirm scope + open questions with Zaal, then kick Phase 1 in a fresh `ws/` worktree branch.
