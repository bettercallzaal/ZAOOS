---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: 684
tier: STANDARD
---

# 685 - code-on-incus: Isolated Machines for AI Agents

> **Goal:** Evaluate code-on-incus (each AI agent gets its own isolated Linux machine) for ZAO's autonomous agent stack.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | INVESTIGATE code-on-incus for the Hermes autonomous PR pipeline - does each Hermes run get a clean sandbox? | Hermes writes code + opens PRs autonomously; an isolated machine per run contains blast radius if an agent goes wrong |
| 2 | code-on-incus is Linux-only; on Zaal's Mac it needs a Linux VM. USE it on the VPS, not the laptop | Incus is a Linux container manager; QuadWork runs locally on macOS where Incus is not native |
| 3 | code-on-incus directly enforces `.claude/rules/secret-hygiene.md` at the OS layer | Host SSH keys, env vars, and Git tokens stay on the host - this is the secret-hygiene rule made structural instead of procedural |
| 4 | SKIP it for QuadWork's local 4-agent loop for now | QuadWork agents are trusted local dev work; the git-worktree isolation it already uses is proportionate |

## What code-on-incus Is

CLI tool (`coi`) by **mensfeld**, **MIT** licensed, open-source (not commercial). Tagline: "gives each AI agent its own isolated machine with root, Docker, and systemd." Built on **Incus** - a Linux system-container manager forked from LXD - not Docker.

## Why It Exists

| Problem | How code-on-incus answers it |
|---------|------------------------------|
| Credential exposure | Host SSH keys, env vars, Git tokens stay on the host; agent only sees its container |
| Cross-session interference | Each agent gets its own sandboxed full-OS environment; parallel agents do not collide |
| Agent goes rogue | Kernel-level monitoring (nftables) detects reverse shells, data exfiltration, credential scanning; auto-pauses or kills the container |
| Permission hacks | System containers give proper file ownership without UID-mapping workarounds |

Supports **Claude Code** (default) and **OpenCode**. Sessions persist with full conversation history; credentials restore automatically. Setup: `curl ... install.sh | bash`, then `coi build` (~5-10 min), then `coi shell` in a project.

## Why System Containers (Incus) over Docker

Docker = application containers (one process). Incus = system containers (full OS with init/systemd). For an agent that needs root, Docker-in-the-box, and systemd, a system container behaves like a real machine - which is what an autonomous coding agent expects.

## ZAO Fit

| ZAO surface | Sandbox needed? | Verdict |
|-------------|-----------------|---------|
| **Hermes** autonomous fix-PR pipeline (`bot/src/hermes/`) | High - it writes code + pushes PRs unattended | INVESTIGATE code-on-incus on the VPS |
| **QuadWork** local 4-agent loop | Low - trusted local dev, git-worktree isolation already used | SKIP for now |
| **ZOE / ZAO Devz** Telegram bots | Low - they dispatch + classify, do not run arbitrary code | SKIP |

ZAO's existing isolation is procedural: `.claude/rules/secret-hygiene.md` (stub keys on disk, pre-commit scans, post-edit HEAD scans). code-on-incus makes that structural - the agent physically cannot read host secrets. That is the upgrade path if Hermes ever runs untrusted or community-submitted tasks.

## Community Signal

Agent sandboxing is an active 2026 topic. A competing approach - **Elvean** (macOS-native AI client with a Linux sandbox via Apple's Containerization framework) - drew **66 upvotes / 15 comments** on r/ollama. Different stack (Apple Containerization vs Incus), same thesis: AI agents need a real isolated OS, not just a process jail. code-on-incus is the Linux/VPS-native answer; Elvean is the Mac-native one.

## Staleness Notes

- code-on-incus is a young single-maintainer OSS project - verify the threat-detection feature set on the repo before relying on it in production.
- `coi build` time (~5-10 min) and install method from the repo README, captured 2026-05-20.
- Incus continues active development post-LXD-fork; no version pinned here.

## Sources

- [mensfeld/code-on-incus (GitHub)](https://github.com/mensfeld/code-on-incus)
- [Incus - Linux container manager](https://linuxcontainers.org/incus/)
- [r/ollama - "Local Linux sandbox for AI agents on macOS - no Docker" (Elvean, 66 upvotes)](https://www.reddit.com/r/ollama/comments/1tg7nih/local_linux_sandbox_for_ai_agents_on_macos_no/)

## Also See

- [Doc 684](../684-claude-code-agent-dispatch-parallelization/) - agent dispatch/parallelization; code-on-incus is the isolation layer beneath a dispatcher

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide whether Hermes runs need per-run Incus sandboxes on the VPS | @Zaal | Decision | Next Hermes hardening pass |
| If yes, spike `coi` on VPS 1 and run one Hermes job inside a container | @Zaal | Todo | After decision |
| Cross-check code-on-incus threat detection against `.claude/rules/secret-hygiene.md` guards | @Claude | Audit | When Hermes sandbox is scoped |
