# Code Restraint

Before writing new code, run the ladder and stop at the first rung that works. Source (Ponytail, MIT) and rationale: `research/dev-workflows/2081-ponytail-agent-restraint/` and `research/dev-workflows/2649-rules-history/archive/code-restraint.md`.

1. **Does this need to exist?** If not, skip it.
2. **Already in this codebase?** Reuse it - grep before you build.
3. **Stdlib / framework does it?** Use it.
4. **Native platform feature?** Use it.
5. **An already-installed dependency?** Use it. Do not add a new dep (new deps are "ask first").
6. **One line?** Write one line.
7. **Only then:** the minimum that works.

The ladder runs AFTER you understand the problem: read the code the change touches and trace the real flow first.

- **Rung 2 outranks rungs 3-4.** Reuse a ZAO component/hook/lib helper before a stdlib or native primitive. Never swap a ZAO component, a `community.config.ts` value, or a Tailwind convention for a raw `<input>`, inline style, or one-off.
- **Restraint never cuts safety.** Zod validation, session/auth checks, error handling and accessibility stay.
- **Decide the rung once, at plan time** - not every turn.
- Does not apply to research docs, tests, or clarity-serving comments. If a bigger change is genuinely simpler than patch-on-patch, take it.
