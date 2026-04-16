# 412 - AI Dev Tools Roundup: Conductor, Replicas, AO Agents

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Evaluate three AI dev tools flagged in inbox - Conductor (local parallel agents), Replicas (background agents), AO Agents (decentralized AI on Arweave)
> **Source:** [@agent_wrapper on X](https://x.com/agent_wrapper/status/2044227480228376812), [@SaaiArora on X](https://x.com/saaiarora/status/2044183396608287216)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Conductor.build** | WATCH - parallel Claude Code instances in isolated worktrees. We already do this manually via /worksession. Could replace manual worktree management. |
| **Replicas** | WATCH - background agents that pick up tickets from GitHub/Slack/Linear. Good for delegating routine work. Not needed yet at ZAO's scale. |
| **AO Agents** | SKIP for now - decentralized AI on Arweave. Interesting for ZAO's Arweave music storage (Doc 152) but too early, ecosystem immature. |

---

## Conductor.build

### What It Is

Mac app for running multiple Claude Code instances in parallel, each in isolated git worktrees.

| Feature | Detail |
|---------|--------|
| **Core function** | Parallel AI coding agents on your Mac |
| **Isolation** | Each agent gets its own git worktree (no conflicts) |
| **Visibility** | Real-time progress dashboard |
| **Merge** | Review + merge changes from each agent |
| **Funding** | $2.8M raised, YC S24 |
| **Founders** | Charlie Holtz + Jackson de Campos (SF) |
| **Price** | Not published |

### ZAO OS Relevance

Already doing this manually:
- /worksession creates isolated `ws/` branches
- Multiple Claude Code terminals can run in parallel
- Each on its own worktree

**Conductor would automate:** worktree creation, task assignment, progress monitoring, merge workflow. Could save 5-10 min per session setup.

**Skip if:** Prefer terminal-native workflow. Adopt if: managing 3+ parallel sessions becomes common.

---

## Replicas (replicas.dev)

### What It Is

Background coding agents that work asynchronously on your codebase.

| Feature | Detail |
|---------|--------|
| **Core function** | Delegate tasks, get PRs back |
| **Triggers** | GitHub PR comments (@tryreplicas), Slack, Linear, dashboard |
| **Isolation** | Each agent runs in isolated VM |
| **Output** | Opens PR when done |
| **Verification** | Runs tests, installs deps, verifies locally |

### ZAO OS Relevance

Useful when:
- Routine bug fixes from GitHub issues
- "Fix this lint error" type tasks
- Batch processing multiple small tasks

Not needed yet:
- ZAO OS is solo dev + Claude Code, direct control preferred
- /fix-issue skill already handles GitHub issue -> fix -> PR workflow

**Revisit when:** Multiple contributors are filing issues regularly, or when routine maintenance tasks pile up.

---

## AO Agents (Arweave)

### What It Is

AI agents running on AO Computer - Arweave's decentralized compute layer.

| Feature | Detail |
|---------|--------|
| **Core function** | Autonomous AI agents on decentralized infra |
| **Compute** | AO Computer (hyper-parallel, Actor model) |
| **Storage** | Arweave (permanent) |
| **Mainnet** | Launched Feb 2025 |
| **Token** | AO (36% allocated to AR holders) |

### ZAO OS Relevance

Interesting overlap with:
- Doc 152 (Arweave ecosystem) - ZAO uses Arweave for permanent music storage
- Doc 155 (Music NFT end-to-end) - Arweave atomic assets
- Doc 153 (BazAR) - Arweave marketplace

Could eventually run ZOE-like agents on decentralized infra. But ecosystem too immature for production use. @agent_wrapper (prateek) says "it's gotten really good recently" - worth monitoring.

**Revisit when:** AO has stable agent frameworks, ZAO is ready for decentralized agent deployment.

---

## Comparison: Parallel Agent Tools

| Tool | Model | Isolation | Cost | Best For |
|------|-------|-----------|------|----------|
| **Conductor** | Local Mac app | Git worktrees | $? | Parallel Claude Code sessions |
| **Replicas** | Cloud VMs | Isolated VMs | $? | Background task delegation |
| **/worksession** (ZAO) | Manual terminal | Git worktrees | Free | Current workflow |
| **Claude Code subagents** | Built-in | Process isolation | Token cost | Research, intermediate work |

---

## Sources

- [@agent_wrapper - AO Agents endorsement](https://x.com/agent_wrapper/status/2044227480228376812)
- [@SaaiArora - Conductor + Replicas recommendation](https://x.com/saaiarora/status/2044183396608287216)
- [Conductor.build](https://www.conductor.build/)
- [Replicas.dev](https://www.replicas.dev/)
- [AO Computer - Blockworks Research](https://app.blockworksresearch.com/unlocked/the-ao-computer-spawning-an-agent-economy)
- [Conductor on Y Combinator](https://www.ycombinator.com/companies/conductor)
