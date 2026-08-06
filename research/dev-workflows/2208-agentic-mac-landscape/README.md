---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-05
superseded-by:
related-docs: 2207, 2135
original-query: "Let's research how others use their mac's for agentic purposes deep research on GitHub"
tier: DEEP
---

# 2208 - How others run agentic Macs, and where this one is ahead vs exposed

> **Goal:** Benchmark this Mac's agentic setup against what the GitHub/HN field actually ships, so the work goes to the real gaps instead of rebuilding what already runs here.

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **INSTALL `@anthropic-ai/sandbox-runtime` and wrap the MCP servers first.** 10 concurrent Claude Code sessions currently run with unrestricted filesystem read on a machine holding `~/.zao/zao.env`, a Supabase service key, and a GitHub token. This is the single largest exposure found. | Anthropic's own srt (4,865 stars, pushed 2026-08-06, Apache-2.0) sandboxes MCP servers with allow-only network and write rules. One `npm install -g`, then wrap servers in `.mcp.json`. The threat is prompt injection reading a key out of the home dir - not hypothetical when agents fetch arbitrary web content. | @Zaal |
| 2 | **USE git worktrees for parallel agents - this is the field's dominant pattern and it is absent here.** Verified: `git worktree list` in `~/Documents/sparkz` shows only `main`. Ten agents sharing one checkout collide on the working tree. | Worktrees are the substrate under nearly every serious parallel-agent tool on HN: Emdash (206 pts), Superset "run 10 parallel coding agents" (96 pts), Conductor. Isolation per agent is what makes 10 sessions safe rather than merely simultaneous. | @Zaal |
| 3 | **OPEN Conductor - it is already installed on this Mac and has never been launched.** 567 MB sitting idle at `/Applications/Conductor.app`, `kMDItemLastUsedDate` = null. It is the Mac-native answer to Decision 2: parallel Claude Codes, each in an isolated workspace, with status tracking. | Zero install cost, already paid for in disk. Evaluate before building a worktree harness by hand - `lane-relay-daemon` already proves the appetite for this, Conductor may cover the isolation half. | @Zaal |
| 4 | **ADD event-stream observability across sessions.** `cockpit` answers "what needs me" but nothing answers "what are the 10 agents doing right now." Use `disler/claude-code-hooks-multi-agent-observability` (1,509 stars). | It captures 12 lifecycle events per session with a `session_id`, explicitly supports concurrent agents, and the hook wiring is already 80% done here - 7 hook types plus `statusLine` are configured in `~/.claude/settings.json`. This is a config change, not a build. | @Zaal |
| 5 | **KEEP the relay system - it is genuinely ahead of the field.** `~/bin/lane-relay-daemon` solves idle-lane message delivery (a detached session that never picks up a relay until someone types in it). Nothing in the surveyed GitHub landscape does this. | Do not replace it with an off-the-shelf orchestrator. The GitHub orchestrators (verun, essaim, claudefu, orca - all under 10 stars) are less mature than what already runs here. | @Zaal |
| 6 | **SKIP the memory-optimizer repos for now.** `lucasrosati/claude-code-memory-setup` (919 stars) advertises "up to 71.5x fewer tokens per session." That number is an unverified vendor claim with no methodology published in the listing. | This Mac already has `~/bin/memory-index` plus a file-based memory directory. Adopting an unbenchmarked third-party memory layer risks regressing a working system for a marketing figure. INVESTIGATE only if token cost becomes the binding constraint - and demand the benchmark first. | @Zaal |

## This Mac's actual agentic surface (measured 2026-08-05)

| Dimension | State here | Field norm | Verdict |
|-----------|-----------|------------|---------|
| Skills | **77** personal skills | Curated lists ship 50-135 (`rohitg00/awesome-claude-code-toolkit`: 135 agents, 35 commands) | **AHEAD** |
| Hooks | 7 event types + `statusLine` (SessionStart, UserPromptSubmit, Notification, Stop, PreToolUse x2, PostToolUse x3) | `disler/claude-code-hooks-mastery` (3,872 stars) exists because most people run zero | **AHEAD** |
| MCP servers | 6 (context7, playwright, serena, supabase-cowork, dune, hyperagent) | Typical setups run 2-5 | **AT PAR** |
| Custom tooling | **74** scripts in `~/bin` incl. `cockpit`, `lane-relay-daemon`, `memory-index`, `zao-ingest.sh` | Most users have dotfiles, not a tool fleet | **AHEAD** |
| Local models | 3 via Ollama (deepseek-r1, llama3.2, qwen3) + mlx-whisper | Common in r/LocalLLaMA circles | **AT PAR** |
| Concurrent sessions | **10** live | HN "Superset" markets 10 as the aspirational ceiling | **AHEAD (and see risk below)** |
| **Sandboxing** | **NONE** | srt at 4,865 stars; Docker and sandbox-exec variants widely shipped | **EXPOSED** |
| **Worktree isolation** | **NONE** (`sparkz` has only `main`) | The default substrate for parallel agents | **BEHIND** |
| **Cross-session observability** | **NONE** (cockpit is status, not event stream) | 1,509-star tool exists for exactly this | **BEHIND** |
| Scheduling | 1 crontab entry (weekly fetch healthcheck) | launchd/cron agent scheduling is common | **BEHIND** |

The short version: **tooling and skills are well past the field; isolation, sandboxing and observability are the gaps.** Every gap is a config or install, not a build.

## Findings

### The security gap is the real headline

Ten agents, full home-directory read, and a machine that holds live credentials. The field converged on three answers:

| Approach | Repo | Stars | Mechanism | Fit here |
|----------|------|-------|-----------|----------|
| **Official (srt)** | [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) | 4,865 | `sandbox-exec` + dynamic Seatbelt profiles; allow-only network via localhost proxy | **USE THIS** |
| Community profile | [neko-kai/claude-code-sandbox](https://github.com/neko-kai/claude-code-sandbox) | 58 | Static sandbox-exec profile; blocks `~` except cwd, `.gitconfig`, system dirs | Reference only - srt supersedes it |
| Containers | [textcortex/claude-code-sandbox](https://github.com/textcortex/claude-code-sandbox) | 322 | Docker | Heavy; Docker not in use here |

**Honest caveat that matters:** srt uses `sandbox-exec`, and `man sandbox-exec` on this machine states plainly: *"The sandbox-exec command is DEPRECATED."* Apple has said this for years while continuing to ship the binary - it is present and functional on macOS 26.5.2, dated 2026-06-24. So the recommendation stands, but it rests on a deprecated Apple primitive that Apple could remove. srt itself is labelled **Beta Research Preview** with the note that "APIs and configuration formats may evolve."

Net: adopt it for MCP servers, expect churn, do not treat it as a permanent guarantee.

### Worktrees are the pattern, and Conductor is already on disk

The strongest signal in the whole survey: independent HN projects converge on the same primitive.

| Project | HN points | Date | Approach |
|---------|-----------|------|----------|
| [Emdash](https://news.ycombinator.com/item?id=47140322) | 206 | 2026-02-24 | Open-source agentic dev environment |
| [Parallel coding agents with tmux and Markdown specs](https://news.ycombinator.com/item?id=47218318) | 189 | 2026-03-02 | tmux + spec files |
| [Coasts](https://news.ycombinator.com/item?id=47575417) | 99 | 2026-03-30 | Containerized hosts per agent |
| [Superset](https://news.ycombinator.com/item?id=46368739) | 96 | 2025-12-23 | Terminal for 10 parallel agents |

Conductor - the Mac-native version, isolated workspace per agent - is installed here and has never been opened. That is the cheapest possible test of Decision 2.

Note the GitHub orchestrator layer is *thin*: `verun` (macOS-specific, 8 stars), `essaim` (1), `claudefu` (1), `orca` (1), `pennyfarthing` (1). Only `patoles/agent-flow` (1,453) has real traction, and it is visualization rather than orchestration. **Zero hits** for short queries on "agent orchestrator macos" as a repo category. The negative signal is informative: nobody has won this category, which is why `lane-relay-daemon` is defensible.

### Where the community actually concentrates

Curation and hooks dominate, not orchestration:

| Repo | Stars | What |
|------|-------|------|
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 51,740 | The canonical resource list |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 24,050 | 100+ specialized subagents |
| [parcadei/Continuous-Claude-v3](https://github.com/parcadei/Continuous-Claude-v3) | 3,879 | Context management via hook-maintained ledger |
| [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) | 3,872 | Hook patterns |
| [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | 2,450 | 135 agents, 35 commands |
| [disler/...multi-agent-observability](https://github.com/disler/claude-code-hooks-multi-agent-observability) | 1,509 | The observability answer |

`Continuous-Claude-v3` at 3,879 stars is worth a look specifically because it does hook-maintained state ledgers - adjacent to what `lane-relay-daemon` and `memory-index` already do here.

### Observability: the cheapest win

Architecture is `Claude Agents -> Hook Scripts -> HTTP POST -> Bun Server -> SQLite -> WebSocket -> Vue Client`, capturing 12 events (PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Notification, UserPromptSubmit, Stop, SubagentStart, SubagentStop, PreCompact, SessionStart, SessionEnd), each tagged with `session_id`.

Since 7 hook types are already wired here, adoption is mostly pointing existing hooks at a local endpoint. Requires Bun and `uv` (Python 3.11+).

### The resource ceiling nobody on GitHub mentions

Measured on this machine: 10 Claude sessions consuming **2.7 GB RAM and spawning 42 MCP server processes** - 6 duplicate copies each of playwright, github, memory, sequential-thinking, and context7. Swap sits at **8.1 GB of 9.2 GB**.

None of the surveyed projects address MCP server duplication across concurrent sessions. Every session boots its own full stack. At 10 sessions that is 6x redundancy on every server. This is an unsolved problem in the ecosystem and a live cost here - it is the practical ceiling on "just run more agents," and it interacts with the macOS 26.5.2 Spotlight `mds_stores` memory issues documented in doc 2207.

## Risks and limitations of this research

| Limitation | Detail |
|------------|--------|
| **Reddit coverage failed** | Both `www.reddit.com` (HTTP 403) and `old.reddit.com` (200 but HTML, not JSON) refused the search API. Community signal here is HN + GitHub only. r/ClaudeAI and r/LocalLLaMA sentiment is NOT represented. |
| **Star counts are proxies** | Stars measure attention, not quality or fitness. The 8-star `verun` may be better for this Mac than a 3,000-star generic toolkit. |
| **srt is Beta + deprecated primitive** | Stated above. Adopt with eyes open. |
| **The 71.5x claim is unverified** | Repo-description marketing, no methodology reviewed. Do not cite it as fact. |
| **Conductor not evaluated** | Recommended for trial because it is free and installed - its actual quality is untested here. |
| **Agent Teams feature unverified** | Search results referenced a "Claude Code Agent Teams" feature dated 2026-02-05. NOT confirmed against Anthropic docs in this pass. Treat as a lead, not a fact. |

## Also See

- [Doc 2207](../../infrastructure/2207-media-drive-archive-index/) - media archive + index; shares the macOS 26.5.2 Spotlight/`mds_stores` finding
- [Doc 2135](../../cross-platform/2135-zaal-media-channels-inventory/) - content inventory
- `~/bin/lane-relay-daemon` - the idle-lane relay, ahead of the field
- `~/bin/cockpit` - canonical status tool (2026-07-20), absorbed status / zao-cockpit / zao-pulse / zao-loops
- `~/.claude/settings.json` - 7 hook types, the foundation for Decision 4

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `npm install -g @anthropic-ai/sandbox-runtime`, wrap the 6 MCP servers in `.mcp.json`. Shipped: `srt` present and at least one server launches sandboxed | @Zaal | Manual | 2026-08-08 |
| Move `~/.zao/zao.env` outside any sandboxed agent's read scope, or confirm srt denies it. Shipped: an agent cannot `cat` the file | @Zaal | Manual | 2026-08-08 |
| Open Conductor, run one real task in an isolated workspace, decide keep-or-delete (it is 567 MB either way). Shipped: written verdict in this doc | @Zaal | Decision | 2026-08-09 |
| Trial `git worktree` for one parallel task in `~/Documents/sparkz`. Shipped: `git worktree list` shows 2+ entries | @Zaal | Manual | 2026-08-10 |
| Stand up `claude-code-hooks-multi-agent-observability` locally, point existing hooks at it. Shipped: dashboard at `localhost:5173` shows events from 2+ concurrent sessions | @Zaal | PR | 2026-08-14 |
| Measure MCP duplication cost: count processes at 1 session vs 10, decide whether to cap concurrent sessions. Shipped: number recorded in this doc | @Zaal | Manual | 2026-08-12 |
| Re-run the Reddit half of this research once the fetch path works. Shipped: r/ClaudeAI + r/LocalLLaMA section added | @Zaal | Manual | 2026-08-19 |
| Verify or kill the "Claude Code Agent Teams" lead against official docs. Shipped: confirmed-or-removed line in this doc | @Zaal | Manual | 2026-08-12 |

## Sources

### GitHub (primary source, per the request)

- [anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) - `[FULL]` - 4,865 stars, pushed 2026-08-06, Apache-2.0, Beta Research Preview. macOS mechanism, install, restriction model, limitations all read
- [neko-kai/claude-code-sandbox](https://github.com/neko-kai/claude-code-sandbox) - `[FULL]` - 58 stars. sandbox-exec profile, exact allowed paths, stated limitation on parent-dir list access
- [disler/claude-code-hooks-multi-agent-observability](https://github.com/disler/claude-code-hooks-multi-agent-observability) - `[FULL]` - 1,509 stars. Architecture, 12 events, multi-session support, tech stack, limitations
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) - `[PARTIAL - metadata + description via gh search; list contents not enumerated]` - 51,740 stars
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) - `[PARTIAL - metadata only]` - 24,050 stars
- [parcadei/Continuous-Claude-v3](https://github.com/parcadei/Continuous-Claude-v3) - `[PARTIAL - metadata only]` - 3,879 stars
- [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) - `[PARTIAL - metadata only]` - 3,872 stars
- [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) - `[PARTIAL - metadata only]` - 2,450 stars
- [textcortex/claude-code-sandbox](https://github.com/textcortex/claude-code-sandbox) - `[PARTIAL - metadata only]` - 322 stars
- [patoles/agent-flow](https://github.com/patoles/agent-flow) - `[PARTIAL - metadata only]` - 1,453 stars
- [lucasrosati/claude-code-memory-setup](https://github.com/lucasrosati/claude-code-memory-setup) - `[PARTIAL - description only; the 71.5x claim is NOT verified]` - 919 stars
- [SoftwareSavants/verun](https://github.com/SoftwareSavants/verun) - `[PARTIAL - metadata only]` - 8 stars, macOS parallel orchestrator
- [primeline-ai/claude-tmux-orchestration](https://github.com/primeline-ai/claude-tmux-orchestration) - `[PARTIAL - metadata only]` - 39 stars

### Community (HN via Algolia API)

- [Parallel coding agents with tmux and Markdown specs](https://news.ycombinator.com/item?id=47218318) - `[FULL - metadata: 189 pts, 131 comments, 2026-03-02]` - comment tree not walked
- [Show HN: Emdash - Open-source agentic development environment](https://news.ycombinator.com/item?id=47140322) - `[FULL - metadata: 206 pts, 71 comments, 2026-02-24]`
- [Show HN: Superset - Terminal to run 10 parallel coding agents](https://news.ycombinator.com/item?id=46368739) - `[FULL - metadata: 96 pts, 90 comments, 2025-12-23]`
- [Show HN: Coasts - Containerized Hosts for Agents](https://news.ycombinator.com/item?id=47575417) - `[FULL - metadata: 99 pts, 38 comments, 2026-03-30]`
- [Claude Code Unpacked: A visual guide](https://news.ycombinator.com/item?id=47597085) - `[FULL - metadata: 1,128 pts, 400 comments, 2026-04-01]`
- r/ClaudeAI, r/LocalLLaMA - `[FAILED - www.reddit.com returned HTTP 403; old.reddit.com returned HTML not JSON; ~/bin/zao-fetch-reddit.sh rejects search URLs (post-id only). Ladder exhausted this session; flagged as a Next Action]`

### Local ground truth

- `[FULL]` - `~/.claude/settings.json` (7 hook types + statusLine), `~/.claude/skills` (77), `~/.claude.json` (6 MCP servers), `~/bin` (74 scripts), `~/bin/lane-relay-daemon`, `~/bin/cockpit`, `crontab -l` (1 entry), `~/.ollama` (3 models), `git worktree list` in `~/Documents/sparkz`, `mdls` on `/Applications/Conductor.app`, `man sandbox-exec`, `sw_vers` (macOS 26.5.2), process/RAM measurements
