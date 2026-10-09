# Vanishing Dependencies - if something depends on it, git must hold it

`~/bin`, `~/.claude/skills` and `~/.claude/settings.json` are symlinks into the `~/zaal-dotfiles` working tree, whose HEAD moves. The four 2026-08-12 losses (ZAOOS#3056): `research/dev-workflows/2649-rules-history/archive/vanishing-dependencies.md`.

1. **If a hook, cron, skill, or another script depends on a file, that file is git-tracked** - written and committed in the same pass.
2. **`git checkout` in `~/zaal-dotfiles` reconfigures the machine.** Know what you change under every running session before switching branches there.
3. **A dependency's existence is checked, not assumed** (`zao-hook-check` at SessionStart for hook scripts; the same for anything else with dependencies).
4. **Absence is reported loudly and specifically, never inferred from silence.** Prove the thing can still run before concluding anything from its quiet.
5. **Recoverability is verified, not assumed:** `zao-guard snapshot` keeps a restorable copy outside every repo; `zao-guard diff` catches loss within the hour.

Defend without waiting for a root cause. Not an argument for committing everything: scratch, caches and temporaries stay untracked unless something depends on them. A check that fires on the normal case is worse than none.
