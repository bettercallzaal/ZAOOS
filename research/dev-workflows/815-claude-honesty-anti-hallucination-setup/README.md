---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-06-07
superseded-by:
related-docs: 441, 461, 168, 238, 353
original-query: "https://x.com/0x_rody/status/2063295395434831922 - 'How to Make Claude Code Stop Making Stuff Up When It Doesn't Know (Exact Setup Inside)' - rody's 4-layer honesty setup (CLAUDE.md rules, verification protocol, PostToolUse/Stop hooks, fact-checker subagent)"
tier: STANDARD
---

# 815 - Claude Code Anti-Hallucination "Honesty Setup" - Audit + ZAO Gap Analysis

> **Goal:** Evaluate @0x_rody's viral 4-layer "stop Claude making stuff up" setup against what ZAO OS already runs, fix the two technical errors in the original post, and ship a corrected version.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | ADOPT Layer 1 (honesty rules) + Layer 2 (verification protocol) into `.claude/rules/honesty.md` | ZAO has zero explicit honesty/verification rules today - only one context7 line in CLAUDE.md. Low-cost, high-value, first-50-lines placement. |
| 2 | FIX before adopting Layer 3 hooks - rody's hooks DO NOT WORK as claimed | Official Claude Code docs: PostToolUse/Stop **exit code 0 stdout is NOT shown to Claude** (debug log only). rody's hooks all exit 0, so tsc errors never reach the model. Must exit 2 or emit `decision:block`. |
| 3 | ZAO's existing PostToolUse hook is WORSE than rody's - it actively swallows output | Current `.claude/settings.json` PostToolUse: `npx eslint --fix "$TOOL_ARG_FILE_PATH" 2>/dev/null; exit 0`. The `2>/dev/null; exit 0` double-guarantees nothing reaches Claude. Add a tsc gate that exits 2 on failure. |
| 4 | ADOPT Layer 4 (fact-checker subagent) as `.claude/agents/fact-checker.md` | ZAO has only `code-reviewer.md`. A read-only claim-verifier is a clean complement, fits the existing `secret-hygiene.md` / `pii-hygiene.md` pre-commit discipline. |
| 5 | rody's matcher syntax `Write(*.ts\|*.tsx)` is INVALID - do not copy verbatim | Claude Code matchers match the tool NAME (`Write`, `Edit`), not file globs. File-filtering happens inside the command. ZAO's settings already do this correctly. |

## What rody's post claims (the source)

4 layers, "cut fabrication to roughly zero":

1. **CLAUDE.md honesty rules** - explicit "I don't know" license; verify symbols before claiming they exist; never invent error messages/stack traces; ask before adding unseen libraries.
2. **Verification-before-write protocol** - read the file / grep / check the manifest before writing code that uses a symbol; prefix `// UNVERIFIED:` if you skip; prefer plan mode for multi-file tasks.
3. **PostToolUse + Stop hooks** - run `tsc --noEmit` / linter on every write, run the test suite on Stop, "hook output goes back to Claude as context."
4. **fact-checker subagent** - read-only agent (tools: Read, Grep, Glob, Bash; model: sonnet) that classifies every claim VERIFIED / WRONG / UNVERIFIABLE before commit.

The framing ("I don't know" license, reward honesty with patience) is sound and matches Anthropic's own guidance on uncertainty. The CLAUDE.md text and the subagent are directly usable. **The hooks block is where it breaks.**

## Findings

### Finding 1 - The hooks as written are silent (load-bearing claim is false)

rody: *"Hook output goes back to Claude as context. If tsc says 'Cannot find module foo', Claude sees it immediately and fixes the fabricated import."*

Verified against official docs (code.claude.com/docs/en/hooks, fetched 2026-06-07):

- **PostToolUse exit code 0 + stdout** -> "written to the debug log but **not shown in the transcript**" - Claude never sees it.
- **PostToolUse exit code 2 + stderr** -> "stderr text is **fed back to Claude** as an error message."
- Same pattern for **Stop** hooks.

rody's three hooks all pipe through `| head -20` / `| tail -30` and exit 0 (pipe success = exit 0). So the tsc/test output lands in the debug log, not the model's context. The setup that is supposed to catch lies is itself making a confidently-wrong claim - a fitting irony, but a real bug.

**Correct pattern:** the hook command must exit 2 when the check fails, and write the failure to stderr. Example PostToolUse for ZAO (TS):

```bash
cd "$PROJECT_DIR" && OUT=$(npx tsc --noEmit --pretty false 2>&1); \
  if [ -n "$OUT" ]; then echo "$OUT" | head -30 >&2; exit 2; fi; exit 0
```

Or the JSON form (`{"decision":"block","reason":"<tsc errors>"}`), which is cleaner but needs the command to emit JSON.

### Finding 2 - ZAO's current hooks (ground truth from `.claude/settings.json`)

| Event | Matcher | Command | Reaches Claude? |
|-------|---------|---------|-----------------|
| PostToolUse | `Edit\|Write` | `npx eslint --fix "$TOOL_ARG_FILE_PATH" 2>/dev/null; exit 0` | No - stderr discarded, exit 0 |
| PostToolUse | `Write` | (empty) | n/a |
| Stop | (none) | `serena-hooks cleanup` | No test run at all |
| PreToolUse | `Bash` | `npm run typecheck 2>&1 \| tail -10` | Pre-commit gate (separate mechanism) |
| PreToolUse | `Bash` | eslint on staged `.ts/.tsx` | Pre-commit gate |
| PreToolUse | `Bash` | `worksession/branch-guard.sh` | Branch guard |

ZAO already runs `typecheck` as a **PreToolUse gate on `git commit`** (the `npm run typecheck ... | tail -10` line). That is arguably a better place than per-write - it catches fabricated symbols before they're committed without a tsc run on every single edit (Next.js 16 project-wide `tsc --noEmit` is multi-second; per-write is expensive). The gap is not "no typecheck" - it is "per-write feedback is swallowed, and there is no test run on Stop."

### Finding 3 - Honesty rules: genuine gap

`grep -in "honesty|verify|unverified|fabricat|hallucinat" CLAUDE.md AGENTS.md` returns exactly one line - the context7 "kills hallucinated APIs" note. There is no explicit "I don't know" license, no verify-before-claim rule. This is the cheapest, highest-leverage adoption. ZAO already has the *habit* encoded for secrets (`secret-hygiene.md`) and PII (`pii-hygiene.md`) - an `honesty.md` rule file is the same shape applied to factual claims.

### Finding 4 - fact-checker subagent: genuine gap

`.claude/agents/` holds only `code-reviewer.md`. rody's `fact-checker.md` (read-only, VERIFIED/WRONG/UNVERIFIABLE report) is a clean addition. It pairs with the existing `/code-review` and the `superpowers:verification-before-completion` skill ZAO already has installed. Worth wiring into the `/ship` pre-flight alongside the secret-scan.

## Comparison - rody's setup vs ZAO OS today

| Layer | rody | ZAO OS today | Action |
|-------|------|--------------|--------|
| 1. Honesty rules | CLAUDE.md block | Absent (1 context7 line) | ADD `.claude/rules/honesty.md` |
| 2. Verify-before-write | CLAUDE.md protocol | Implicit (Serena symbol tools, context7) | ADD explicit rule + `// UNVERIFIED:` convention |
| 3a. Per-write typecheck | tsc, exit 0 (broken) | eslint --fix, output swallowed | FIX: tsc gate that exits 2 |
| 3b. Test on Stop | npm test on Stop | Absent (serena cleanup only) | ADD Stop hook running vitest, exit 2 on fail |
| 3c. Pre-commit typecheck | not present | PreToolUse `npm run typecheck` | KEEP - ZAO ahead here |
| 4. fact-checker subagent | sonnet read-only agent | Absent (only code-reviewer) | ADD `.claude/agents/fact-checker.md` |
| Matcher syntax | `Write(*.ts\|*.tsx)` (invalid) | `Edit\|Write` + in-command filter | ZAO correct, ignore rody's |

## Also See

- [Doc 441](../441-everything-claude-code-integration/) - ECC rules integration (where `typescript-hygiene.md`, `secret-hygiene.md` came from)
- [Doc 461](../../agents/461-fix-pr-pipeline/) - fix-PR pipeline + pre-push hooks (existing verification discipline)
- [Doc 168](../168-claude-code-community-innovations-march2026/) - prior community-pattern roundup
- [Doc 238](../238-claude-tools-top50-evaluation/) - Claude tooling eval
- [Doc 353](../353-claude-code-token-optimization-v2/) - hook/token cost trade-offs

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `.claude/rules/honesty.md` (Layer 1+2, first-50-lines) | @Zaal | PR | This week |
| Patch PostToolUse: add tsc gate that exits 2 on failure (stop swallowing output) | @Zaal | PR | This week |
| Add Stop hook running `npm run test` (vitest), exit 2 on fail | @Zaal | PR (settings change - ask first per CLAUDE.md) | After review |
| Create `.claude/agents/fact-checker.md`, wire into `/ship` pre-flight | @Zaal | PR | Next sprint |
| Verify the exit-2 hook actually surfaces tsc errors in a live session | @Zaal | Test | With first PR |

## Sources

- [@0x_rody, "How to Make Claude Code Stop Making Stuff Up"](https://x.com/0x_rody/status/2063295395434831922) - **[FULL** - complete article text supplied verbatim in the research request; X/Twitter community source, 236.6K views, 2026-06-06]
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) - **[FULL** - fetched 2026-06-07, redirect from docs.claude.com resolved; confirms exit-0 stdout not shown to Claude, exit-2 stderr fed back, `decision`/`reason`/`additionalContext` JSON fields]
- `.claude/settings.json` (ZAO OS, this repo) - **[FULL** - current PostToolUse/Stop/PreToolUse hook commands, ground truth for gap analysis]
- `CLAUDE.md`, `.claude/rules/secret-hygiene.md`, `.claude/rules/pii-hygiene.md` (this repo) - **[FULL** - existing verification-discipline precedents]
