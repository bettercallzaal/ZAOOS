---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-04-29
related-docs: 548, 549, 549e, 551, 553
tier: STANDARD
---

# 552 - ZAO Skill Library Audit

> **Goal:** Audit the 33 global + 23 project ZAO-specific skills for: broken triggers, dupes across global+project, missing SKILL.md, descriptions that won't auto-trigger. Plan promote/retire/refactor. Drop Lazer's `audit-skill` (Doc 548) into the global library for ongoing use.

## Inventory (verified 2026-04-29)

| Surface | Count | Where |
|---|---|---|
| Global ZAO-related skills | 33 | `~/.claude/skills/` |
| Project ZAO-specific skills | 23 | `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/` |
| Plugin/upstream skills | 200+ | ECC + obra/superpowers + claude-api + caveman + connect-apps + oh-my-mermaid (managed by plugin system, NOT in scope of this audit) |
| **Global skill folders without `SKILL.md` or `skill.md`** | **1** | `~/.claude/skills/learned/` is an empty folder |
| **Skills duplicated in BOTH global + project** | **3** | `autoresearch`, `socials`, `zao-research` |

## Findings (Sorted by Severity)

### CRITICAL - `learned/` skill is an empty directory

`~/.claude/skills/learned/` exists with no `SKILL.md`. Either a leftover scaffold or a removed skill that didn't get cleaned. Either:

- Delete the directory if abandoned
- Add a real SKILL.md if it was meant to capture learnings (this would be useful actually - a "learnings since session start" auto-saver)

### HIGH - 3 skills duplicated global + project

| Skill | Global path | Project path | Risk |
|---|---|---|---|
| `autoresearch` | `~/.claude/skills/autoresearch/` | `.claude/skills/autoresearch/` | Which one Claude Code picks is undefined; project-scope wins per Claude docs, but if global has been updated (2026 patches) and project hasn't, you regress on every project |
| `socials` | `~/.claude/skills/socials/` | `.claude/skills/socials/` | Same |
| `zao-research` | `~/.claude/skills/zao-research/` | `.claude/skills/zao-research/` | Same - the v2 redesign in Doc 493 may exist in only one |

**Fix plan:**
1. Diff each pair: `diff -ru ~/.claude/skills/<name>/ .../ZAO\ OS\ V1/.claude/skills/<name>/`
2. Promote the better version to global (project skills should be ZAO-specific only).
3. Delete the stale copy.
4. For `zao-research`: confirm v2 from Doc 493 is the canonical version.

### HIGH - Many global skill descriptions use YAML literal-block (`description: |`)

When a skill writes:

```yaml
description: |
  multi-line
  description here
```

Claude Code's auto-trigger logic reads only the first line of `description` for matching. Multi-line descriptions get truncated, weakening triggers.

Skills with single-line descriptions (good): `21st`, `autoresearch`, `bcz-yapz-description`, `clipboard`, `graphify`, `quad`, `socials`. Many others use `|`.

**Fix plan:**
1. Convert each `description: |` to a single-line `description: "..."` with the most important trigger phrase up front.
2. Keep extended description in the body of SKILL.md after frontmatter, where Claude can still read it after invocation.

### MEDIUM - No `audit-skill` installed yet

Doc 548 surfaced Lazer's portable `audit-skill` (in their npm tarball at `dist/.claude/skills/audit-skill/`). It's MIT, 1 SKILL.md + 4 reference files, audits any `**/.claude/skills/*/SKILL.md` against Anthropic's official best practices.

**Fix plan:**

```bash
# Already extracted in /tmp/lazer-inspect from Doc 548 deep-dive
cp -r /tmp/lazer-inspect/package/dist/.claude/skills/audit-skill ~/.claude/skills/audit-skill
# Then in any session:
/audit-skill all
```

### MEDIUM - 23 project-only ZAO skills

Project-scope skills (only in ZAO OS V1 repo):

`big-win, catchup, check-env, design-steal, evals, fishbowlz, fix-issue, gitnexus, inbox, lean, morning, new-component, new-route, newsletter, next-best-practices, onepager, reflect, standup, vps, worksession, z, zao-os, zao-stock`

Concerns:

- **`fishbowlz`** project skill exists despite `project_fishbowlz_deprecated` memory (2026-04-16). Either deprecate the skill or update its description to reflect Juke partnership.
- **`vps`** is project-scoped but VPS work happens across multiple ZAO repos (BCZ, ZAOstock, etc.). Should be **promoted to global** so other ZAO sessions can use it.
- **`morning`, `reflect`, `standup`** - rituals that span all ZAO projects. Promote to global.
- **`zao-os, zao-stock, fishbowlz, gitnexus`** - genuinely project/repo-specific. Keep project-scoped.

### LOW - No `audit-skill` reports against Anthropic best practices yet

Once installed, run `/audit-skill all` and capture findings. PASS/WARN/FAIL on:

- File named exactly `SKILL.md` (case sensitive)
- Folder kebab-case
- No `README.md` inside skill folder
- Frontmatter delimiters
- `name` matches folder name
- `description` explains WHAT + WHEN
- `description` under 1024 chars
- `allowed-tools` scoped (no wildcard)

Expected fail count: 5-15 across the 33 global skills based on what I saw in the literal-block scan.

## Concrete Fixes (Ranked, Cheapest First)

| # | Fix | Time | Risk |
|---|---|---|---|
| 1 | Delete or repair empty `~/.claude/skills/learned/` | 1 min | None |
| 2 | Drop `audit-skill` from `/tmp/lazer-inspect/` into `~/.claude/skills/audit-skill/` | 1 min | None |
| 3 | Run `/audit-skill all` and capture report | 5 min | None |
| 4 | Convert top-10 most-used skills' descriptions from `|` to single-line | 30 min | Low - test invocation triggers after |
| 5 | Diff + de-dupe `autoresearch`, `socials`, `zao-research` between global + project | 30 min | Medium - keep the right one canonical |
| 6 | Promote `vps`, `morning`, `reflect`, `standup` from project to global | 15 min | Low |
| 7 | Update `fishbowlz` skill description with Juke partnership context, or retire it | 10 min | Low |
| 8 | Add `superpowers:writing-skills` skill check to skill creation workflow | n/a | n/a (already exists, just remember to use) |

## Skill Library Health Score (subjective, 2026-04-29)

| Dimension | Score / 5 | Note |
|---|---|---|
| Coverage of ZAO surfaces | 4 | Most active surfaces have a skill |
| Trigger quality | 2 | Many `description: |` blocks weaken triggers |
| De-duplication | 2 | 3 known dupes between global + project |
| Documentation hygiene | 3 | Most have frontmatter, few have references |
| Anti-drift discipline | 2 | No audit ever run; some skills haven't been touched in months |
| Promotion/retire process | 1 | None documented; skills accrete |

**Overall: 2.3 / 5.** Library has good coverage but is overdue for hygiene pass.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Delete `~/.claude/skills/learned/` (empty) | Zaal | One-shot | Today |
| Drop `audit-skill` into global skills, run `/audit-skill all` | Zaal | One-shot + skill run | Today |
| Diff + de-dupe `autoresearch`, `socials`, `zao-research` | Zaal | One-shot | This week |
| Promote `vps`, `morning`, `reflect`, `standup` to global | Zaal | git mv + skill check | This week |
| Convert top-10 skill descriptions to single-line `description: "..."` | Zaal | PR | This week |
| Re-audit quarterly | n/a | Calendar | 2026-07-29 |

## Also See

- [Doc 551 - Research roadmap + library audit](../551-research-roadmap-library-audit/)
- [Doc 553 - Memory file health audit](../553-memory-file-health-audit/)
- [Doc 548 - Lazer Mini Apps CLI](../../farcaster/548-lazer-miniapps-cli-evaluation/) - source of `audit-skill`
- [Doc 549e - /21st skill spec](../549e-21st-dev-zao-skill-spec/) - example of what a clean modern skill looks like
- [Doc 493 - zao-research skill v2](../493-zao-research-skill-v2-redesign/)
- `superpowers:writing-skills` upstream skill - covers skill best practices

## Sources

- Local filesystem scan of `~/.claude/skills/` and `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/skills/` 2026-04-29
- Lazer audit-skill extracted in Doc 548 deep dive at `/tmp/lazer-inspect/package/dist/.claude/skills/audit-skill/`
- Anthropic best practices referenced via `audit-skill/references/`

## Staleness Notes

Re-validate after first `/audit-skill all` run. Re-audit quarterly.
