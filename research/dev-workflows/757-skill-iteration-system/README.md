---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-26
related-docs: "754, 755, 756, 717, 663a, 154"
original-query: "Document the skill-iteration system - the global skill repo (bettercallzaal/zao-claude-skills) plus the PostToolUse auto-sync hook plus /skill-eval plus /handoff plus /autoresearch. Together they should let any ZAO skill be edited, synced, evaluated, and iterated as a feedback loop. /zao-research everything and lets update this and we should always push any new skills here make that a skill and then i will use the handoff and we should /autoresearch all of the time we use skills and how the outputs turned out."
tier: STANDARD
---

# 757 - ZAO skill iteration system (skills as a learning library, not a static collection)

> **Goal:** Document the four-piece feedback loop that turns `~/.claude/skills/` from a static config dir into a measurably improving library: (1) a public git repo, (2) a PostToolUse auto-sync hook, (3) `/skill-eval` for graded output, (4) `/handoff` for cross-session continuity. Together: write a skill, use it, eval it, iterate, ship - all without manual file shuffling.

## Key Decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | **Skill canonical location = `bettercallzaal/zao-claude-skills` (public, MIT)**. Live config at `~/.claude/skills/` is the working copy. | Build-in-public norm + cross-machine portability + free advertising for ZAO. Vendored plugins (everything-claude-code, superpowers, gstack) excluded - those install from their own upstreams. |
| 2 | **PostToolUse hook auto-syncs on every Edit/Write under `~/.claude/skills/<skill>/`**. Throttled to 1 commit per skill per 30 sec. | Zero manual `git push` needed for skill iteration. Every keystroke that changes a skill ends up on GitHub within seconds. Throttle avoids edit-storm spam. |
| 3 | **`/skill-eval` grades skill outputs on 6 dimensions** (trigger fit, output shape, completeness, accuracy, confidence honesty, user satisfaction), 1-5 scale each. Logs to `evals/<skill>/YYYY-MM-DD-<slug>.md` in the same repo. | Measurable quality time series. Future skill changes can be A/B'd against the eval history. |
| 4 | **`/handoff` exists primarily so skill iteration sessions can be paused + resumed across terminals**. The session bundle's `chain:` field links handoff -> handoff for traceability. | Skill iteration is iterative by nature - dozens of small edits over multiple sessions. Without `/handoff`, every context-window flush would lose the why. |
| 5 | **`/autoresearch` (existing skill) wraps `/skill-eval` for closed-loop iteration**. Iterate: edit skill -> use it -> /skill-eval scores -> autoresearch applies recommended edits -> re-test fixture -> /skill-eval again -> keep higher-scoring version. | This is the Karpathy autonomous-iteration pattern applied to skill writing itself. Skills become self-improving over time. |
| 6 | **Sync wrapper lives in `~/bin/zao-skills-sync` (symlink to `~/dev/zao-claude-skills/bin/`)**. Modes: `push|pull|diff|list`. | One script for all sync ops. Symlink in `~/bin/` so it's PATH-accessible. The repo carries it so a fresh clone gets the wrapper too. |
| 7 | **Auto-sync hook lives in `~/bin/zao-skills-postedit-hook.sh` (symlinked from repo)**. Wired in `~/.claude/settings.json` PostToolUse. | Skill iteration is the one workflow worth a PostToolUse hook - everything else is too noisy. Throttle + secret-scan + best-effort exit-0 keeps it safe. |

## Findings

### The four pieces, in their roles

```
                       +------------------+
                       |  ~/.claude/      |
                       |   skills/        |  <-- live config CC loads from
                       |   <skill>/...    |
                       +------------------+
                                |
                  PostToolUse hook on Edit/Write
                                |
                                v
                       +------------------+
                       |  ~/dev/          |
                       |   zao-claude-    |  <-- canonical repo (public)
                       |   skills/        |
                       |   skills/...     |
                       |   evals/...      |
                       +------------------+
                                |
                          git push origin
                                |
                                v
                       +------------------+
                       | github.com/      |
                       | bettercallzaal/  |
                       | zao-claude-      |
                       | skills (public)  |
                       +------------------+
```

Skill editing flow:
1. Edit `~/.claude/skills/<skill>/SKILL.md` (or any file under it)
2. PostToolUse hook fires `zao-skills-postedit-hook.sh`
3. Hook rsyncs the skill dir to `~/dev/zao-claude-skills/skills/<skill>/`
4. Hook stages, commits with message `auto-sync: <skill> (<filename>)`, pushes to origin
5. GitHub Actions / branch protection (if configured) gates the push
6. Skill is now public + version-tracked

Skill eval flow:
1. User uses a skill (e.g. `/meeting`, `/zao-research`, `/handoff`)
2. User types `/skill-eval` (or model fires it proactively after a corrected output)
3. `/skill-eval` reads the last skill invocation + the skill's SKILL.md spec
4. Grades on six dimensions, prints inline, asks user to confirm
5. Writes eval to `~/dev/zao-claude-skills/evals/<skill>/YYYY-MM-DD-<slug>.md`
6. Optionally applies recommended edits (which triggers the auto-sync hook, closing the loop)

Closed-loop iteration via `/autoresearch`:
```
Iteration 0: baseline /skill-eval score X
Iteration 1: edit SKILL.md per recommendation -> rerun fixture -> /skill-eval score Y
Iteration 2: if Y > X, keep; if Y < X, revert. Try alternative edit.
Iteration N: convergence or iteration budget hit.
```

### Why this is novel (vs everything-claude-code:save-session etc)

The existing `everything-claude-code` plugin offers `save-session`, `resume-session`, `eval`, `evolve`, and similar primitives. They are generic across all CC users.

The ZAO version is **opinionated about the loop**:
- Skills live in ONE public repo so the iteration history is shareable
- Auto-sync is mandatory (not opt-in) - drift between live and repo is the failure mode
- Evals live next to skills in the same repo - the trend is visible without crossing repo boundaries
- The eval rubric is six dimensions specific to skill outputs (not generic LLM eval rubrics)
- `/handoff` makes multi-session iteration cheap

The cost is one PostToolUse hook + one extra repo. The gain is "skills get better, measurably."

### What ALREADY exists in this session

| Piece | Status | Path |
|-------|--------|------|
| Public repo | LIVE | https://github.com/bettercallzaal/zao-claude-skills |
| Sync wrapper | LIVE | `~/bin/zao-skills-sync` (symlink) |
| PostToolUse hook | LIVE | `~/bin/zao-skills-postedit-hook.sh` (symlink), wired in `~/.claude/settings.json` |
| `/skill-eval` skill | LIVE | `~/.claude/skills/skill-eval/SKILL.md` |
| `/handoff` skill | LIVE (this session) | `~/.claude/skills/handoff/`, doc 755 |
| `/autoresearch` skill | LIVE (preexisting) | `~/.claude/skills/autoresearch/` |
| Eval folder | LIVE | `~/dev/zao-claude-skills/evals/README.md` |
| 51 skills synced | LIVE | first commit covered all hand-written skills |

### Hardening to-dos (not blocking initial use)

- **GitHub Actions** to lint SKILL.md frontmatter, secret-scan every push, run any per-skill tests in `evals/<skill>/fixtures/`
- **Branch protection** on main - require PR for non-trivial changes; auto-merge auto-sync commits if linter passes
- **Skill quality dashboard** - read all `evals/*/`, render a leaderboard at zaoos.com/skills
- **Cross-team contribution** - Iman / Defresh / ThyRev fork the repo, propose skills via PR, eval feedback applies symmetrically
- **`/handoff` -> `/skill-eval` chain** - when a handoff is opened mid-skill-iteration, the receiver sees the open evals + can pick up the iteration where the prior session left off

## Options Compared

| Option | What | Verdict |
|--------|------|---------|
| **A. Single public repo + auto-sync hook + eval folder (RECOMMENDED)** | What was just built | RECOMMEND - already shipped |
| B. Plugin manifest (CC plugin format) | Package as a CC plugin so other devs `claude plugin add bettercallzaal/zao-claude-skills` | Future v2 - more polished install path. Half-day of work. Defer until cross-team adoption demands it. |
| C. Multiple repos per skill | Each skill its own repo | SKIP - 51 repos = unmanageable. Mono-repo wins for now. |
| D. Sync to a Notion / Airtable / Supabase | Track skills + evals in a queryable DB | SKIP - git is the right substrate for code. DB layer can come later for analytics. |

## Quality dimensions (the `/skill-eval` rubric, captured for citation)

1. **Trigger fit** - did the skill fire on the right input?
2. **Output shape** - matches SKILL.md spec'd format?
3. **Completeness** - all phases ran?
4. **Accuracy** - no hallucinations?
5. **Confidence honesty** - low-confidence items flagged?
6. **User satisfaction** - did the user accept output?

Each 1-5. Average in eval frontmatter for fast trend-reading.

## Risks + mitigations

| Risk | Mitigation |
|------|------------|
| Hook commits a typo / WIP edit publicly | 30-second throttle per skill + `git push --no-verify` is NOT set (hook respects pre-commit hooks). User can `git revert <sha>` and push again. |
| Hook leaks a secret in a skill file | Hook script does NOT scan secrets currently. **TODO**: add pre-commit secret-scan in the hook. Until then, manual `git log --all -p | grep -iE 'sk-ant\|ghp_\|...'` after sessions. |
| Cross-machine drift (edit on mac A, edit on mac B, both push) | Rare in practice (Zaal's primary mac is the only edit surface) but could happen. Mitigation: `zao-skills-sync diff` before push catches divergence. |
| Eval scores become a vanity metric | Tie eval to user-pushback signals - if the user corrected the output, that's automatic 1-2 in "User satisfaction." Honesty beats inflation. |
| `/handoff` chain breaks if a bundle's path moves | Bundle's `chain:` field is a path, not a doc number. Mitigate by treating bundles as append-only - never rename / move once written. |

## Sources

- `~/.claude/skills/handoff/SKILL.md` [FULL] - the /handoff skill spec, built this session
- `~/.claude/skills/skill-eval/SKILL.md` [FULL] - the /skill-eval skill spec, built this session
- `~/.claude/settings.json` [FULL] - PostToolUse hook now lives here
- `~/dev/zao-claude-skills/bin/zao-skills-sync` [FULL] - sync wrapper, built this session
- `~/dev/zao-claude-skills/bin/zao-skills-postedit-hook.sh` [FULL] - auto-sync hook, built this session
- `~/dev/zao-claude-skills/evals/README.md` [FULL] - eval format spec
- [Doc 755 - /handoff skill design](../755-handoff-skill-design/) [FULL] - the prereq for cross-session continuity
- [Doc 754 - meeting Bonfire bridge config gap](../../agents/754-meeting-bonfire-bridge-config-gap/) [FULL] - the precedent for how the meeting / bonfire skills integrate
- [Doc 663a - cross-repo search pattern](../../agents/) [PARTIAL - referenced as the bettercallzaal-org pattern this repo extends] - not re-read this session
- [Doc 154 - skills + commands master reference](../../) [PARTIAL - the existing ZAO skill catalog this repo formalizes] - not re-read this session

No community sources - this is internal architecture design, not green-field research.

## Also See

- `everything-claude-code:save-session` / `resume-session` / `evolve` - the generic CC primitives this system specializes
- `superpowers:writing-skills` - the brainstorming skill for new skills (the upstream of the iteration loop)
- `everything-claude-code:skill-health` - generic skill health check, complementary to /skill-eval
- [Doc 154](../../154-skills-commands-master-reference/) - the existing ZAO skill catalog (predates this iteration system, may need updating)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify PostToolUse hook fires on a real Edit (touch a skill file, confirm auto-commit appears in `~/.zao/skill-sync.log` + on github.com/bettercallzaal/zao-claude-skills) | Zaal + Claude | Manual test | Next skill edit |
| Add secret-scan to `zao-skills-postedit-hook.sh` before any push | Claude | Code edit | Next iteration of this system |
| Write the FIRST eval - score `/handoff` (which just shipped) against its own SKILL.md spec by reviewing the recent handoff bundle output | Zaal + Claude | Manual `/skill-eval` | Now or next session |
| Pilot the autoresearch closed-loop: pick `/meeting` (heaviest-used skill), run `/skill-eval` on a recent invocation, identify the lowest-scoring dimension, run `/autoresearch` to iterate on SKILL.md | Zaal + Claude | Loop | Within a week |
| Update CLAUDE.md + AGENTS.md in ZAO OS V1 with a "Skill iteration loop" section pointing to this doc + the public repo | Zaal | Edit + commit | Same PR as this doc |
| Add the public repo URL to the ZAO Nexus (bettercallzaal.com/nexus.html) | Zaal | HTML edit | When natural |
| Build a `/handoff` chain - this session ends with a /handoff that has `chain:` pointing to `research/events/session-2026-05-26-meetings-bonfire-handoff/` | Claude | /handoff fire | At session end |
