(node:37374) ExperimentalWarning: CommonJS module /Users/zaalpanthaki/Library/pnpm/nodejs/23.3.0/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /Users/zaalpanthaki/Library/pnpm/nodejs/23.3.0/lib/node_modules/npm/node_modules/supports-color/index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
# AgentShield Security Report

**Date:** 2026-04-20T08:44:32.398Z
**Target:** /Users/zaalpanthaki/.claude
**Grade:** D (55/100)

## Summary

| Metric | Value |
|--------|-------|
| Files scanned | 42 |
| Total findings | 36 |
| Critical | 1 |
| High | 16 |
| Medium | 6 |
| Low | 13 |
| Info | 0 |
| Auto-fixable | 0 |

## Skill Health

| Metric | Value |
|--------|-------|
| Skills discovered | 6 |
| Instrumented | 0 |
| Versioned | 0 |
| Rollback-ready | 0 |
| With history | 0 |

## Score Breakdown

| Category | Score |
|----------|-------|
| Secrets | 100/100 |
| Permissions | 33/100 |
| Hooks | 0/100 |
| MCP Servers | 100/100 |
| Agents | 44/100 |

## Findings

### 🔴 Overly permissive allow rule: Bash(*)

- **Severity:** critical
- **Category:** permissions
- **File:** `settings.json`
- **Description:** Unrestricted Bash access — any command can run
- **Evidence:** `Bash(*)`
- **Fix:** Restrict to specific commands: Bash(git *), Bash(npm *), Bash(node *)

### 🟡 System prompt extraction attempt detected

- **Severity:** high
- **Category:** injection
- **File:** `CLAUDE.md:1`
- **Description:** Found "Output Rules" — Attempts to extract the agent's system prompt — reconnaissance for crafting targeted injection attacks. From openclaw-security-guard prompt injection patterns.
- **Evidence:** `Output Rules`

### 🟡 All mutable tool categories allowed simultaneously

- **Severity:** high
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The allow list grants Bash, Write, and Edit access. Even with scoped patterns, having all three categories means the agent can run commands, create files, and modify files — effectively unrestricted write access to the system. Consider whether all three are truly needed.
- **Fix:** Remove one or more mutable tool categories if not needed

### 🟡 System prompt extraction attempt detected

- **Severity:** high
- **Category:** injection
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/CLAUDE.md:170`
- **Description:** Found "system prompt" — Probes for the agent's system instructions — prompt leaking technique. From openclaw-security-guard prompt injection patterns.
- **Evidence:** `system prompt`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/install.sh:68`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/install.sh:73`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/install.sh:74`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/install.sh:28`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/install.sh:79`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/cache/caveman/caveman/63e797cd753b/hooks/uninstall.sh:53`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🟡 System prompt extraction attempt detected

- **Severity:** high
- **Category:** injection
- **File:** `plugins/marketplaces/caveman/CLAUDE.md:170`
- **Description:** Found "system prompt" — Probes for the agent's system instructions — prompt leaking technique. From openclaw-security-guard prompt injection patterns.
- **Evidence:** `system prompt`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/install.sh:68`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/install.sh:73`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook spawns background process: &

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/install.sh:74`
- **Description:** Background process via & — may run indefinitely after hook completes. Background processes in hooks can be used for persistent backdoors or data exfiltration that outlives the session.
- **Evidence:** `&`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/install.sh:28`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/install.sh:79`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🟡 Hook disables logging: >/dev/null 2>&1

- **Severity:** high
- **Category:** hooks
- **File:** `plugins/marketplaces/caveman/hooks/uninstall.sh:53`
- **Description:** Redirects all output to /dev/null — hides both stdout and stderr. Disabling logging or clearing audit trails in hooks is a defense evasion technique that makes it harder to detect and investigate compromises.
- **Evidence:** `>/dev/null 2>&1`

### 🔵 Missing deny rule: Privilege escalation

- **Severity:** medium
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The deny list does not block "sudo". Consider adding it to prevent privilege escalation.

### 🔵 Missing deny rule: World-writable permissions

- **Severity:** medium
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The deny list does not block "chmod 777". Consider adding it to prevent world-writable permissions.

### 🔵 Missing deny rule: SSH connections from agent

- **Severity:** medium
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The deny list does not block "ssh". Consider adding it to prevent ssh connections from agent.

### 🔵 Missing deny rule: Writing to device files

- **Severity:** medium
- **Category:** permissions
- **File:** `settings.json`
- **Description:** The deny list does not block "> /dev/". Consider adding it to prevent writing to device files.

### 🔵 No PreToolUse security hooks configured

- **Severity:** medium
- **Category:** misconfiguration
- **File:** `settings.json`
- **Description:** No PreToolUse hooks are defined. These hooks can catch dangerous operations before they run, providing an essential security layer.
- **Fix:** Add PreToolUse hooks for security-sensitive operations

### 🔵 Agent has Bash access: agents/ecc-silent-failure-hunter.md

- **Severity:** medium
- **Category:** agents
- **File:** `agents/ecc-silent-failure-hunter.md`
- **Description:** This agent has Bash tool access, allowing arbitrary command running. Consider if it truly needs shell access, or if Read/Write/Edit would suffice.

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
- **File:** `commands/ecc-hookify-configure.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-configure" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify-configure.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-configure" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify-help.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-help" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify-help.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-help" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify-list.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-list" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify-list.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify-list" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-hookify.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-hookify" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-learn.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-learn" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-learn.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "ecc-learn" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`

### ⚪ Example config: Skill is missing observation hooks and feedback hooks

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-skill-create.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "skill-create" does not define observation hooks and feedback hooks in SKILL.md. ECC 2.0 self-improving skills need explicit observe/feedback hooks so runs can be inspected and amended safely.
- **Evidence:** `observation hooks and feedback hooks`

### ⚪ Example config: Skill is missing version metadata and rollback metadata

- **Severity:** low
- **Category:** skills
- **Runtime Confidence:** docs/example
- **File:** `commands/ecc-skill-create.md`
- **Description:** This finding comes from docs or sample configuration in the repository. It indicates risky guidance or example defaults, not confirmed active runtime exposure. The skill "skill-create" does not define version metadata and rollback metadata. Self-amending skills need explicit version and rollback markers so regressions can be evaluated and reversed.
- **Evidence:** `version metadata and rollback metadata`


  Scan log written to: scan-global.ndjson

