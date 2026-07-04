---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-03
superseded-by:
related-docs: 154, 441, 944, 801, 836
original-query: "we have been using claude code for 3 months and learned a lot - let's now open-source implement that; also condense our skills down to what we actually do"
tier: STANDARD
---

# 946 - The ZAO Claude Code Kit: open-sourcing 3 months of setup

> **Goal:** Turn 3 months of running The ZAO on Claude Code into a public, clone-and-go kit others can adopt - and use that same curation to condense our own skills to what we actually use. The skill-condense and the open-source are one effort: the KEEP list below IS the kit.

## Key Decisions / Recommendations

| # | Decision |
|---|----------|
| 1 | **Ship a public repo `zao-claude-kit`** - the reusable skills + `.claude/rules/` + patterns + a settings template, secrets stripped. The ethskills-for-org-ops move (doc 944 is ethskills for onchain; this is Claude-Code for running a community/company). |
| 2 | **Condense = curate for the kit.** Our ~90 skills (60 global + 30 project) split into KEEP (daily drivers, go in the kit), HOLD (ZAO-specific, stay private), ARCHIVE (dead/novelty). Done in this doc. |
| 3 | **Archived now (dead per our own docs):** `fishbowlz` (killed, doc 601) + `gitnexus` (disabled MCP, CLAUDE.md) -> moved to `.claude/_archived-skills/`. |
| 4 | **Hold the divergent dupes for a careful pass.** `meeting`, `socials`, `bonfire`, `zao-research` exist in BOTH global and project and have DIVERGED - do not blind-dedup (breaks the working copy). `zao-lens` + `autoresearch` are identical (safe to dedup later). |
| 5 | **Sanitize with the `opensource-pipeline` skill** (20+ secret patterns) before publish - never hand-copy skills into a public repo. |
| 6 | **Build after the meeting batch lands** - the kit is a deliberate extract, not a rushed one. |

## What goes in the kit (the KEEP list, genericized)

These are the daily-driver skills + rules that are broadly reusable once ZAO specifics are templated out:

**Workflow skills (the core value):**
- **research-doc workflow** (`zao-research`, genericized) - the numbered-doc library, dedup + collision-safe numbering, fetch-quality gate, FULL/PARTIAL/FAILED source marking, action-bridge. This is the crown jewel - a disciplined research system for any team.
- **meeting pipeline** (`/meeting`) - local transcription (mlx-whisper) -> multi-pass extraction -> recap doc + action routing + knowledge-graph episode + share block.
- **clipboard** - terminal-to-shareable-page with history.
- **handoff** - session compaction into a portable bundle.
- **the loop/tend pattern** - `ScheduleWakeup` self-paced loops + report-only-on-change (the fleet-tend + research loops).
- **socials / newsletter** - platform-specific content generation with a locked voice.
- **plan-* + review + qa + ship** - the plan-first, verify-before-done discipline.

**Rules (`.claude/rules/`, the most portable part):**
- `secret-hygiene.md` (5 guards: stub keys, staged-diff scan, HEAD scan, repo scan, prompt-level) - every team needs this.
- `pii-hygiene.md` (off-repo `~/.private/` for connected-service dumps, allowlists, pre-flight scans).
- `api-routes.md`, `components.md`, `tests.md`, `typescript-hygiene.md` - Next.js/React conventions.

**Patterns (documented, not code):**
- Monorepo-as-lab (graduate -> own repo -> delete from lab).
- PR-only to main, never push; verify-before-done.
- The fix-PR pipeline (coder + critic + auto-PR) shape.
- Collision-safe doc numbering (the 819/824 renumber incident lesson).
- A `settings.json` template: sane permissions allowlist, the deny guards (rm -rf, force-push, drop table), the notification hook.

## What stays private (HOLD - ZAO-specific)

`zol`, `vps` (hardcoded IPs), `coworkvps`, `zaostock`/`zao-stock`, `bcz-*`, `bandz-research`, `pi` (Tailscale/Pi specifics), `zabal-games-context`, `zao-os`, `graphify`/`bonfire` (point at private endpoints), `inbox` (AgentMail), anything reading `~/.zao/` secrets. These reference private infra; they are the reason to strip, not ship.

## What we archived / flagged (the condense)

- **Archived (dead):** `fishbowlz`, `gitnexus`.
- **Archive candidates (novelty/unused, pending Zaal eyeball):** `claude-is-tripping`, `drunk-claude`, `careful`, `freeze`/`unfreeze`, `claude-creativity`, `guard`, `find-skills`, `learned`, `office-hours`, `document-release`, `skill-eval`, `audit-skill`, `gstack`/`gstack-upgrade`, `quad`, `cold-outreach`, `setup-browser-cookies`.
- **Divergent dupes (reconcile, do not blind-dedup):** `meeting`, `socials`, `bonfire`, `zao-research` differ between global and project. `zao-lens` + `autoresearch` are identical (safe to dedup).

## Repo structure (proposed)

```
zao-claude-kit/
  README.md              # what this is, how to install, the ZAO story
  .claude/
    skills/              # the genericized KEEP skills
    rules/               # secret-hygiene, pii-hygiene, api/components/tests/ts
    settings.template.json  # permissions allowlist + deny guards + notif hook
  patterns/              # markdown: monorepo-as-lab, PR discipline, loop pattern, doc numbering
  CONTRIBUTING.md
  LICENSE                # MIT
```

## Also See

- [Doc 154](../154-skills-commands-master-reference/) - the skills/commands master reference (source of the KEEP list)
- [Doc 441](../441-everything-claude-code-integration/) - the ECC integration (where the rules were cherry-picked from)
- [Doc 944](../../agents/944-bot-fleet-ethskills-integration/) - ethskills (the onchain-knowledge sibling to this org-ops kit)
- [Doc 801](../../agents/801-zoe-cowork-systems-audit-consolidation/), [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/) - the estate this setup runs

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `zao-claude-kit` repo via `opensource-pipeline` (fork -> sanitize -> package) | @Claude | Build | After the meeting batch |
| Zaal eyeball the novelty archive-candidate list; confirm which to remove | @Zaal | Decision | This week |
| Reconcile the 4 divergent global/project dupes (meeting/socials/bonfire/zao-research) - pick canonical | @Zaal + @Claude | Careful pass | Not mid-meeting-processing |
| Dedup the 2 identical dupes (zao-lens, autoresearch) - keep project copy | @Claude | Cleanup | Low priority |

## Sources

- Live skills inventory (`~/.claude/skills` 60 + `.claude/skills` 30), measured 2026-07-03 [FULL]
- `.claude/rules/` (secret-hygiene, pii-hygiene, api-routes, components, tests, typescript-hygiene) [FULL - this repo]
- Doc 154 (skills/commands master reference), Doc 441 (ECC integration) [FULL - internal]
- `opensource-pipeline` skill (fork/sanitize/package, 20+ secret patterns) [FULL - installed]
