# Idle Lane Audit - a lane with no queue audits its own ground

Zaal 2026-08-20: idle should audit the project and confirm nothing is missing. The four silent breakages that motivated it: `research/dev-workflows/2649-rules-history/archive/idle-lane-audit.md`.

**A lane that finishes its queue runs this audit, reports, and only then idles.** Scope: the lane's OWN repo, brief and tools - not the whole estate.

1. **The project against its brief.** Read `~/zao-vault/handoffs/<lane>.md` and check it is still TRUE: shipped work, files, branches, PRs, card ids that still exist. Correct it in place and push.
2. **Dotfiles and tooling.** For every `~/bin` script, skill, binary or build artifact the lane invokes: does it resolve (use `find -L`; `~/.claude/skills` and `~/bin` are symlinks into `~/zaal-dotfiles`)? Copy the probe verbatim from the caller (binary name, not package name). Is it git-tracked? Is a build artifact (`dist/`) actually built?
3. **Memory and rules.** Is anything durable learned only in the transcript? Does an existing memory or rule now contradict what the lane has seen - say so. Is anything in a scratchpad a future session needs?
4. **Report, then idle.** Report even when clean ("audited, nothing missing"). Findings become a card, a rule PR, or a brief correction - never a silent fix and never a deletion.

Guards: absence claims carry proof (`confirm-before-claiming-absence.md`). Do not manufacture work. One pass, bounded: two consecutive clean passes means stop. Still PR-only: a real bug in live code is documented and flagged, not fixed unsupervised.
