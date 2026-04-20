(node:37373) ExperimentalWarning: CommonJS module /Users/zaalpanthaki/Library/pnpm/nodejs/23.3.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /Users/zaalpanthaki/Library/pnpm/nodejs/23.3.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
# AgentShield Security Report

**Date:** 2026-04-20T08:44:32.261Z
**Target:** /Users/zaalpanthaki/Documents/ZAO OS V1/.claude
**Grade:** B (83/100)

## Summary

| Metric | Value |
|--------|-------|
| Files scanned | 10 |
| Total findings | 14 |
| Critical | 0 |
| High | 4 |
| Medium | 5 |
| Low | 5 |
| Info | 0 |
| Auto-fixable | 2 |

## Skill Health

| Metric | Value |
|--------|-------|
| Skills discovered | 2 |
| Instrumented | 0 |
| Versioned | 0 |
| Rollback-ready | 0 |
| With history | 0 |

## Score Breakdown

| Category | Score |
|----------|-------|
| Secrets | 100/100 |
| Permissions | 53/100 |
| Hooks | 80/100 |
| MCP Servers | 100/100 |
| Agents | 83/100 |

## Findings

### 🟡 No deny list configured

- **Severity:** high
- **Category:** permissions
- **File:** `settings.json`
- **Description:** settings.json has no deny list. Without explicit denials, the agent may run dangerous operations if the allow list is too broad.
- **Fix:** Add a deny list for dangerous operations

### 🟡 All mutable tool categories allowed simultaneously

- **Severity:** high
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The allow list grants Bash, Write, and Edit access. Even with scoped patterns, having all three categories means the agent can run commands, create files, and modify files — effectively unrestricted write access to the system. Consider whether all three are truly needed.
- **Fix:** Remove one or more mutable tool categories if not needed

### 🟡 No deny list configured

- **Severity:** high
- **Category:** permissions
- **Runtime Confidence:** project-local optional
- **File:** `settings.local.json`
- **Description:** settings.json has no deny list. Without explicit denials, the agent may run dangerous operations if the allow list is too broad.
- **Fix:** Add a deny list for dangerous operations

### 🟡 Agent has no tools restriction: agents/code-reviewer.md

- **Severity:** high
- **Category:** agents
- **File:** `agents/code-reviewer.md`
- **Description:** This agent definition is structured but does not specify an explicit tools array. Without a tools list, it may inherit all available tools by default, including Bash, Write, and Edit. Always specify the minimum set of tools needed.
- **Fix:** Add an explicit tools array to the frontmatter

### 🔵 Hook silently suppresses errors: stderr silenced

- **Severity:** medium
- **Category:** hooks
- **File:** `settings.json:72`
- **Description:** Hook uses "2>/dev/null" which suppresses errors. A failing security hook that silently passes could miss real vulnerabilities.
- **Evidence:** `2>/dev/null`
- **Fix:** Remove error suppression to surface failures
- **Auto-fixable:** Yes

### 🔵 Hook silently suppresses errors: stderr silenced

- **Severity:** medium
- **Category:** hooks
- **File:** `settings.json:83`
- **Description:** Hook uses "2>/dev/null" which suppresses errors. A failing security hook that silently passes could miss real vulnerabilities.
- **Evidence:** `2>/dev/null`
- **Fix:** Remove error suppression to surface failures
- **Auto-fixable:** Yes

### 🔵 Hook has 9 chained commands

- **Severity:** medium
- **Category:** hooks
- **File:** `settings.json`
- **Description:** A hook chains 9 commands together: "cd "$PROJECT_DIR" && STAGED=$(git diff --cached --name-only --diff-filter=d | gr...". Complex chained commands in hooks are harder to audit and may perform operations beyond the hook's stated purpose. Consider breaking into a dedicated script file.
- **Evidence:** `cd "$PROJECT_DIR" && STAGED=$(git diff --cached --name-only --diff-filter=d | grep -E '\.(ts|tsx)$' `
- **Fix:** Move complex logic to a script file

### 🔵 Hook has 5 chained commands

- **Severity:** medium
- **Category:** hooks
- **File:** `settings.json`
- **Description:** A hook chains 5 commands together: "cd "$PROJECT_DIR" && BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); if [...". Complex chained commands in hooks are harder to audit and may perform operations beyond the hook's stated purpose. Consider breaking into a dedicated script file.
- **Evidence:** `cd "$PROJECT_DIR" && BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); if [[ "$BRANCH" != ws/* `
- **Fix:** Move complex logic to a script file

### 🔵 No PreToolUse security hooks configured

- **Severity:** medium
- **Category:** misconfiguration
- **Runtime Confidence:** project-local optional
- **File:** `settings.local.json`
- **Description:** No PreToolUse hooks are defined. These hooks can catch dangerous operations before they run, providing an essential security layer.
- **Fix:** Add PreToolUse hooks for security-sensitive operations

### ⚪ No Stop hooks for session-end verification

- **Severity:** low
- **Category:** misconfiguration
- **File:** `settings.json`
- **Description:** Hooks are configured but no Stop hooks exist. Stop hooks run when a session ends and are useful for final verification — checking for uncommitted secrets, ensuring console.log statements were removed, or auditing file changes.
- **Fix:** Add a Stop hook for session-end checks

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/autoresearch.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "autoresearch" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/autoresearch.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "autoresearch" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/minimax.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "minimax" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/minimax.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "minimax" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`


  Scan log written to: scan-project.ndjson

(node:37412) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
