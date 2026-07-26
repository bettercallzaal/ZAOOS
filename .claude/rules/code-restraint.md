# Code Restraint

The best code is the code you never wrote. Before writing any new code, run the
ladder below and stop at the first rung that works. Adapted from Ponytail
(DietrichGebert/ponytail, 89k stars, MIT) - see `research/dev-workflows/2081-ponytail-agent-restraint/`.
This operationalizes the vague "elegance check" in `agent-loops.md` into a
checklist, and is the write-side complement to that file's rule 3 (read live code
first). It is loaded every session like the other `.claude/rules/*.md`.

## The ladder (stop at the first rung that works)

1. **Does this need to exist?** If not, skip it. (YAGNI - the biggest win.)
2. **Already in this codebase?** Reuse it, don't rewrite. (ZAO has ~296 components, 20 hooks, 42 lib domains - grep before you build.)
3. **Stdlib / framework does it?** Use it. (Next.js, React 19, Zod, native JS.)
4. **Native platform feature?** Use it.
5. **An already-installed dependency?** Use it. Do NOT add a new dep for it (new deps are "ask first" per CLAUDE.md).
6. **One line?** Write one line.
7. **Only then:** the minimum that works.

The ladder runs AFTER you understand the problem, not instead of it. Read the code
the change touches and trace the real flow first. Lazy about the solution, never
about reading.

## ZAO-specific guards (non-negotiable)

- **Rung 2 outranks rungs 3-4.** In ZAOOS, reuse an existing component / hook / lib
  helper before reaching for a stdlib or native primitive. Never swap a ZAO
  component (or a `community.config.ts` value, or a Tailwind convention) for a raw
  `<input>` / inline style / one-off. This is the design-system-blindness failure
  the community found in Ponytail (it was benchmarked on a repo with no component
  library); ZAOOS is the opposite case. Respect `components.md` + `typescript-hygiene.md`.
- **Restraint never cuts safety.** Zod validation, session/auth checks, error
  handling, and accessibility are NOT over-engineering - they stay. Restraint
  removes speculative features and duplicate code, not guardrails
  (`api-routes.md`, `secret-hygiene.md`, `pii-hygiene.md` still bind).
- **Decide the rung once, at plan time - not every turn.** Re-evaluating the whole
  ladder on every response burns the weekly Claude cap (`claude-usage.md`). Pick
  the approach during planning; execute without re-deliberating each step.

## When restraint does NOT apply

- Research docs, tests, and clarity-serving comments are not "code to avoid" -
  write what the task needs. This rule targets application/product code and net-new
  abstractions, not coverage or documentation.
- If a bigger change is genuinely simpler than a patch-on-patch (see `agent-loops.md`
  elegance check), take it - restraint is about the minimum that WORKS, not the
  minimum diff.

## Source

Decision + benchmarks + community critique: `research/dev-workflows/2081-ponytail-agent-restraint/`.
Sibling rules: `agent-loops.md` (elegance check, read-first), `claude-usage.md` (cap discipline),
`components.md` + `typescript-hygiene.md` (what "reuse" means in ZAOOS).
