# Team Skill Sharing (ZAOOS) - Design Spec

Date: 2026-07-14
Status: approved (brainstorm), ready to plan
Related: research/dev-workflows/946-zao-claude-code-kit (the curation this reuses), research/dev-workflows/154-skills-commands-master-reference, research/dev-workflows/441-everything-claude-code-integration

## Problem

Zaal's daily-driver Claude Code workflow (`qa`, `ship`, `review`, `plan-eng-review`,
`clipboard`, `handoff`, plus a few others) lives entirely in his personal
`~/.claude/skills/` (global, Mac-only). ZAOOS's project-level `.claude/skills/`
(git-tracked, 30 skills) is what anyone who clones the repo actually gets - and
it's missing all of the above. Jose and Candy (contributing to ZAOOS - dev work
for at least one, content/ops for the other, scope not fully settled yet) clone
the repo and don't get the workflow Zaal actually uses.

Research doc 946 (2026-07-03) already did the hard curation work: a KEEP list of
~10 daily-driver skills, a HOLD list (ZAO-private infra, stays personal), and an
ARCHIVE list (dead skills). It scoped the destination as a new public repo
(`zao-claude-kit`, secrets stripped, MIT license). That destination has changed:
the ask now is to land the KEEP list inside ZAOOS itself, for the internal team,
not spin out a public repo.

## Goal

Get Zaal's daily-driver skills into ZAOOS's git-tracked `.claude/skills/` so any
teammate who clones the repo has them, plus a `/team-setup` skill that walks a
new teammate through whatever local setup those skills need.

## Non-goals

- The public `zao-claude-kit` open-source spinout from doc 946 - separate effort,
  not superseded by this.
- Reconciling `meeting`/`socials`/`zao-research`/`newsletter` - these already
  exist in both `~/.claude/skills/` and the project `.claude/skills/` and have
  DIVERGED (doc 946's own warning: "do not blind-dedup, breaks the working
  copy"). Deferred to a separate careful diff-and-reconcile pass.
- Auto-provisioning credentials (Supabase keys, Bonfire access, bot tokens) for
  new teammates. `/team-setup` flags what's missing; a human (Zaal) grants it.
- The handoff-skill enhancement to route to a designated "orchestrating
  terminal" - a related but separate idea, queued as its own follow-up
  brainstorm.

## What moves (Batch 1 - this build)

Six skills, verified conflict-free (no existing project-side copy) and verified
to need zero or minimal external state:

| Skill | External state needed |
|---|---|
| `qa` | none |
| `ship` | none |
| `review` | none |
| `plan-eng-review` | none |
| `clipboard` | `~/.zao/clipboard/` (auto-created by the skill's own helper script, pure local, no network/credentials) |
| `handoff` | `~/.zao/handoff/` for non-ZAO-repo targets; in ZAOOS itself it lands as `research/events/session-*/README.md` (already the repo's own convention). Default receiver is ZOE via Bonfire - a teammate without Bonfire access just skips that leg, the local bundle still works. |

Copied as-is from `~/.claude/skills/<name>/` into
`.claude/skills/<name>/` (SKILL.md + any `bin/` helper scripts).

## What's deferred (Batch 2 - separate follow-up)

`meeting`, `socials`, `zao-research`, `newsletter` - diverged copies exist in
both locations already. Needs a diff pass to pick canonical per-skill before
merging, not a straight copy. Not part of this build.

## Architecture: `/team-setup`

```
.claude/skills/team-setup/
  SKILL.md                        # the interactive/conversational layer
scripts/
  setup-claude-teammate.sh        # deterministic, idempotent, safe to re-run
```

**`scripts/setup-claude-teammate.sh`** (mechanical, no conversation):
1. Confirm cwd is inside the ZAOOS repo (fail loud if not).
2. `mkdir -p ~/.zao/clipboard ~/.zao/handoff` if missing.
3. Check for `~/.zao/private/` (PII-hygiene convention per
   `.claude/rules/pii-hygiene.md`) - create if missing.
4. Print a checklist of what it could NOT verify/provision (Supabase MCP
   access, Bonfire endpoint, any bot tokens) - these need Zaal, not the script.
5. Exit 0 with a machine-readable summary (what was created vs already present
   vs missing) the skill layer can read and narrate.

**`.claude/skills/team-setup/SKILL.md`** (the conversational layer, triggered
by `/team-setup` or natural language like "I'm new here" / "set me up"):
1. Confirm they're on a `ws/` branch (existing `/worksession` convention) -
   point at `/worksession` if not.
2. Run the bootstrap script, narrate the results.
3. For anything flagged as missing/needs-Zaal, tell the teammate to ask Zaal
   directly rather than trying to self-serve credentials.
4. Summarize the 6 newly-available skills: name, one-line purpose, trigger.
5. Point at `CLAUDE.md` (Security, Boundaries sections) since this is a new
   contributor's first session.

Edge cases (re-running after partial setup, skill already present, etc.) are
implementation-plan-level detail, not separate design decisions - the script's
idempotency (step-by-step existence checks before creating anything) already
covers the real risk (double-creating dirs is harmless; the plan should not
duplicate-copy skill files if `/team-setup` is run twice).

## Testing

- `scripts/setup-claude-teammate.sh`: shell-level test - run twice in a row on
  a clean temp `$HOME`, assert idempotent (second run reports "already
  present", doesn't error, doesn't duplicate).
- `/team-setup` skill: manual walkthrough (skills aren't unit-testable the way
  route handlers are) - Zaal or a teammate runs it once for real.
- The 6 copied skills themselves: no new tests needed, they're unchanged
  copies of already-working skills.

## Open questions (deferred, not blocking this build)

- Batch 2 reconciliation (meeting/socials/zao-research/newsletter) - separate
  task.
- Handoff-skill routing to a single orchestrating terminal - separate
  brainstorm.
- Whether Jose/Candy end up doing dev work, content/ops work, or both wasn't
  fully pinned down ("all and more") - `/team-setup` doesn't need to know in
  advance, it just makes all 6 skills available either way.
