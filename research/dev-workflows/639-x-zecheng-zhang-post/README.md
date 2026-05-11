---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-11
related-docs: []
tier: QUICK
source: inbox-forward-2026-05-11
---

# 639 - Zecheng Zhang (@zechengzh) on Mirage: Unified Virtual Filesystem for AI Agents

Goal: AI agents need Unix pipe semantics across heterogeneous data services. Mirage solves it.

## TL;DR

Mirage is a virtual filesystem (VFS) that mounts S3, Google Drive, Slack, Gmail, GitHub, Linear, Notion, Postgres, MongoDB, SSH, and HTTPS as a unified filesystem tree. Bash commands (cat, grep, head, wc, pipes) work natively on any format (.parquet, .csv, .json, .h5, .wav) across all services. Built by Strukto AI in 6 weeks (1.1M LOC). Caching layer keeps agent loops fast. Mounts into FastAPI/Express apps or Claude Code/Codex/LangChain.

## The Post (verbatim)

> Introducing Mirage, a unified virtual filesystem for AI agents! 6 weeks. 1.1M+ lines of code. We rewrote bash from the ground up so cat, grep, head, and pipes work across heterogeneous services. S3, Google Drive, Slack, Gmail, GitHub, Linear, Notion, Postgres, MongoDB, SSH, and more, all mounted side-by-side as one filesystem. Bash that AI agents already know works on every format! cat, grep, head, and wc parse .parquet, .csv, .json, .h5, even .wav! One pipe can stitch S3, Drive, GitHub, Slack, and Linear together, same Unix semantics throughout. Workspaces are versioned too. Snapshot, clone, and roll back the whole thing with one API call. A two-layer cache turns repeated reads into local lookups, so agent loops stay fast and cheap. Drop a Workspace into FastAPI, Express, or a browser app. Wire it into OpenAI Agents SDK, Vercel AI SDK, LangChain, Mastra, or Pi. Run it alongside Claude Code and Codex.

## Who is the Author

Zecheng Zhang (@zechengzh). Founder of Strukto AI (strukto.ai). YC Alumni. Founding Engineer at Kumo AI. Stanford CS Masters. Co-creator of DeepSNAP and PyTorch Frame. 601.7K views on the post (as of May 6).

## Why Zaal Saved It

Hermes + ZOE agent stack needs to pipe data across Supabase, Farcaster (Neynar), GitHub, and internal state without context fragmentation. Mirage's approach to unified bash semantics across service boundaries is directly applicable to agent-driven ZAOOS systems. Pattern is worth tracking for future cross-service agent tooling.

## Action

- Bookmark strukto.ai/mirage + github.com/strukto-ai/mirage for reference.
- Consider for Hermes fix-PR pipeline (piping GitHub diffs + Supabase context together).
- Track if Strukto releases a Python binding or MCP server (agent-native integration).

## Sources

- X post: https://x.com/zechengzh/status/2052105012172792061
- Strukto.ai: https://strukto.ai/mirage
- GitHub: https://github.com/strukto-ai/mirage
