# Idle Lane Audit - a lane with no queue audits its own ground, it does not wait

Zaal, 2026-08-20, when asked how idle lanes should render on The Wall:

> "idle should prob for an audit on the project and based on dotfiles and
> memory updates confirm nothing is missing"

That is a better answer than any of the display options it was asked about,
because it changes what idle IS rather than how it looks. A lane with nothing
queued has capacity and context - the two expensive things - and spends them on
nothing. This rule spends them on verification.

## Why this specific work, and not "find something useful"

**Four separate load-bearing things were found missing or broken on 2026-08-20
alone**, every one of them silent until someone happened to look:

| What | How it failed | Found by |
|---|---|---|
| `gstack browse/dist/` | never built, so `/browse` could never run | two lanes blocked, neither could name why |
| capture-triage-crush CLI | gone from the Mac, 5 skills still invoke it | a card, days later |
| `zj` probe | no ceiling, hung the whole wall on a loaded host | Zaal, twice |
| `zj` needs-you | fires on every idle lane, headline number ~4x wrong | a screenshot |

None was caught by a check. All were caught by a human hitting them. That is
the gap idle capacity should be closing, and it is `vanishing-dependencies.md`
rule 3 (a dependency's existence is checked, not assumed) finally getting
someone to do the checking.

## The behavior (behavior-changing)

**A lane that finishes its queue does NOT go quiet and wait. It runs the audit
below, reports what it found, and only then idles.** On The Wall an idle lane is
a defect ([[project_the_wall]]); this is the lane's own first response to being
one.

Scope it to the lane's OWN project - its repo, its brief, its tools. This is not
a licence to audit the whole estate; twelve lanes each auditing everything is
twelve times the cost and one twelfth the depth.

### 1. The project against its brief

Read `~/zao-vault/handoffs/<lane>.md` and check it is still TRUE, not just
present. Has the work it describes shipped? Does it name files, branches, PRs,
or card IDs that no longer exist? A brief that has drifted is worse than none,
because the next session boots on it. Correct it in place and push.

### 2. Dotfiles and tooling - does what we depend on still exist

For every tool the lane's work invokes - a `~/bin` script, a skill, a binary, a
build artifact:

- **Does it resolve?** Use `find -L`, not `find`. `~/.claude/skills` and
  `~/bin` are SYMLINKS into `~/zaal-dotfiles`, and a plain `find` reports
  present files as missing. That exact mistake was made on 2026-08-20.
- **Copy the probe verbatim from the caller.** If a script tests
  `command -v mlx_whisper`, test `mlx_whisper` - not `mlx-whisper`, which is
  the package name. Same day, same session, second false negative.
- **Is it git-tracked?** An untracked file inside a git tree is the worst case:
  it looks safe and git cannot give it back. If something depends on it and git
  does not hold it, that is a finding.
- **Is a build artifact actually built?** `dist/` is correctly gitignored and
  therefore correctly absent on a fresh clone - which is exactly how
  `/browse` was dead for weeks while looking fine.

### 3. Memory and rules - is anything learned still unwritten

- Did this lane learn something durable that lives only in its transcript? A
  repeated bug, a corrected assumption, a tool that behaves unexpectedly. Rules
  and memories are the artifact; a transcript is not (`agent-loops.md` rule 6).
- Does an existing memory or rule now contradict what the lane has seen? Say so
  rather than quietly working around it. Memories reflect what was true when
  written and are explicitly allowed to be wrong.
- Is anything in a scratchpad that a future session will need? Scratchpads hold
  nothing that outlives the session (`handoff-discipline.md` rule 8).

### 4. Report, then idle

Report findings even when there are none - "audited, nothing missing" is a
result, and an honest clean report is a success rather than a wasted run
(`anti-fabrication.md` rule 4). Findings become a card, a rule PR, or a brief
correction. **Never a silent fix and never a deletion** - surface the path and
why, and let Zaal delete (`no-rm-rf.md`).

## Guards

- **Absence claims still need proof.** "X is missing" from this audit carries
  the same burden as anywhere else: name what you searched and how
  (`confirm-before-claiming-absence.md`). Two false negatives were produced in
  one session by a wrong `find` and a wrong binary name - both would have
  become confident wrong findings.
- **Do not manufacture work.** If the audit is clean, say so and stop. A check
  that always finds something is a check nobody trusts
  (`noisy-signal-guard.md`).
- **Bounded.** One pass over the lane's own ground, not a rolling re-audit.
  Re-running the same audit hourly is the polling-loop spend pattern
  `agent-spend.md` bans - two consecutive clean passes means stop, not lengthen.
- **Still PR-only.** An audit that finds a real bug in live code documents and
  flags it; it does not fix it unsupervised (`agent-loops.md` rule 35).

## Source

Zaal, 2026-08-20, during a Wall grill, answering "how should idle render" with
"make idle do the audit instead." Siblings: [[project_the_wall]] (on the wall =
autonomous, so idle is a defect), `vanishing-dependencies.md` (the failure class
this hunts), `confirm-before-claiming-absence.md` (the burden of proof on any
finding), `noisy-signal-guard.md`, `agent-spend.md` (why it is bounded),
doc 2343 (the wall signal audit that surfaced the idle/blocked split).
