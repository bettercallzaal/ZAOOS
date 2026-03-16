# 54 — Superpowers: Agentic Skills Framework for Claude Code

> **Status:** Research complete
> **Date:** March 2026
> **Source:** github.com/obra/superpowers
> **Verdict:** Install it. Zero cost, MIT license, 87K stars, official Anthropic plugin. Transforms how Claude Code builds ZAO OS.

---

## What Is Superpowers?

An agentic skills framework by **Jesse Vincent** (obra) that enforces structured development workflows for AI coding agents. 14 composable skills that trigger automatically, making Claude Code brainstorm before coding, write tests before implementation, and review before merging.

| Metric | Value |
|--------|-------|
| **Stars** | ~87,000 |
| **License** | MIT |
| **Created** | October 2025 |
| **Latest** | Superpowers 5 (March 9, 2026) |
| **Supports** | Claude Code, Cursor, Codex, Gemini CLI, OpenCode |
| **Status** | Official Anthropic marketplace plugin |

## Who Is Jesse Vincent (obra)?

- Creator of **Request Tracker (RT)** — leading open-source issue tracker
- Creator of **K-9 Mail** — popular Android email client
- Co-founder of **Keyboardio** — custom mechanical keyboards
- COO of **VaccinateCA** during COVID
- Former Perl programming language project lead
- 202 public repos, 3,252 GitHub followers
- Blog: [fsck.com](https://blog.fsck.com/)

---

## The 14 Skills

| Skill | What It Enforces |
|-------|-----------------|
| **Brainstorming** | Ask clarifying questions, produce design spec BEFORE coding |
| **Writing Plans** | Break specs into 2-5 min tasks with exact file paths + verification |
| **Executing Plans** | Follow the plan step by step, no deviation |
| **Subagent-Driven Development** | Dispatch fresh sub-agents per task in isolated worktrees |
| **Dispatching Parallel Agents** | Multiple agents working simultaneously on different tasks |
| **Test-Driven Development** | Strict RED-GREEN-REFACTOR. Deletes code written before tests. |
| **Requesting Code Review** | Review against plan between tasks |
| **Receiving Code Review** | Process review feedback before continuing |
| **Using Git Worktrees** | Isolated branches per task, prevents conflicts |
| **Finishing a Dev Branch** | Verify tests, present merge/PR/discard options, cleanup |
| **Systematic Debugging** | Structured approach to finding and fixing bugs |
| **Verification Before Completion** | Final check before marking done |
| **Using Superpowers** | Meta-skill for the framework itself |
| **Writing Skills** | Meta-skill for creating new custom skills |

## Key Insight

Jesse uses **persuasion engineering on LLMs** — authority framing, commitment language, and scarcity signals from Cialdini's research. This makes agents actually follow the rules rather than take shortcuts.

---

## How ZAO OS Would Use It

### Install

```bash
/plugin install superpowers@claude-plugins-official
```

### What Changes

| Before Superpowers | After Superpowers |
|-------------------|-------------------|
| "Build the notification UI" → Claude jumps to code | "Build the notification UI" → Claude asks clarifying questions → writes spec → you approve → plan created → tests first → code → review → merge |
| No tests | TDD enforced (RED-GREEN-REFACTOR) |
| One big branch | Git worktrees per task (isolated) |
| Hope it works | Verification step before completion |
| One agent doing everything | Sub-agents dispatched in parallel |

### Best For ZAO OS's Upcoming Features

| Feature | Why Superpowers Helps |
|---------|----------------------|
| **XMTP encrypted messaging** | Complex, needs spec + TDD to avoid breaking existing chat |
| **Respect token activation** | On-chain interaction needs careful planning + testing |
| **Hats Protocol deployment** | Smart contract interaction needs structured approach |
| **Cross-platform publishing** | 11 platform integrations need parallel sub-agents |
| **AI agent (ElizaOS)** | Separate repo, needs clean spec before building |
| **ZAO Cypher release** | 0xSplits integration needs TDD |

### Custom Skills for ZAO

You can write ZAO-specific skills:
- "Deploying to Vercel" workflow
- "Neynar API patterns" (webhook setup, signer management)
- "Supabase migration" (schema diff → test → deploy)
- "Farcaster Mini App" (manifest, SDK, notifications)

---

## Superpowers 5 (March 9, 2026)

Latest release added:
- **Visual brainstorming** — generates HTML mockups viewable in browser
- **Spec review loops** — adversarial sub-agent catches incomplete specs
- **Subagent-driven development as default** — not opt-in anymore
- **Cost optimization** — delegates plan-execution to cheaper models (Haiku)

---

## Pros & Cons for ZAO OS

**Pros:**
- Zero cost (MIT, free plugin)
- Immediately usable — install and next session auto-uses it
- Forces TDD (ZAO OS currently has no test infrastructure)
- Saves specs/plans to `docs/superpowers/` — build-in-public documentation
- Sub-agents can work in parallel on different features
- 87K stars = battle-tested
- Cost optimization via model delegation (saves money for bootstrapped project)

**Cons:**
- Development tool only — doesn't add user-facing features
- Adds process overhead for small quick fixes
- Git worktree workflow may need adjustment
- Need to verify plugin support in current Claude Code version

**Recommendation:** Install it. Use for big features (XMTP, Respect, Hats, cross-platform). Skip brainstorming phase for quick bug fixes.

---

## Sources

- [obra/superpowers](https://github.com/obra/superpowers)
- [Superpowers blog post (Oct 2025)](https://blog.fsck.com/2025/10/09/superpowers/)
- [Superpowers 5 (March 2026)](https://blog.fsck.com/2026/03/09/superpowers-5/)
- [Jesse Vincent GitHub](https://github.com/obra)
- [Superpowers Complete Guide](https://www.pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide)
