---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-09-13
superseded-by:
related-docs: "618, 2268, 2407, 2444"
original-query: "can u /zao-research https://opencode.ai/ and https://goose-docs.ai/ - one comparison doc since they are the same category (open-source terminal coding agents, alternatives/complements to Claude Code). Ground in Zaal's fleet of ~15 Claude Code lanes via Orca (Orca CLI already names opencode as a runnable agent), estate near weekly Claude usage limit (89% used, 2026-09-13). Answer provider/model support, MCP support, permissions/tool approval, headless mode, session resume, licence, maturity, and what it takes to run one lane on it inside Orca."
tier: STANDARD
---

# 2485 - OpenCode vs goose: open-source terminal coding agents as Orca lanes

> **Goal:** Decide whether a Claude Code lane in the Orca fleet can be swapped for OpenCode or goose to relieve the Claude weekly usage cap (89% used, 2026-09-13), and what that swap costs in setup, auth, and lost features.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | RUN one Orca lane on OpenCode against a non-Anthropic provider (OpenRouter, GLM/Z.AI, or a local Ollama model) for low-stakes lanes (doc grunt work, triage, research fetches) - this is the only configuration of either tool that actually removes load from the Claude weekly cap. | OpenCode's Anthropic path is API-key billing in practice, and that is a terms-of-service block, not a missing feature: its docs (`opencode.ai/docs/providers`, re-verified raw 2026-09-13) state "There are plugins that allow you to use your Claude Pro/Max models with OpenCode. Anthropic explicitly prohibits this. Previous versions of OpenCode came bundled with these plugins but that is no longer the case as of 1.3.0." So any Claude-model use in OpenCode today is Console API-key billing, separate from the Max/Pro plan; pointed at a different provider it touches Claude usage not at all. |
| 2 | DO NOT expect goose's "Claude ACP" mode to relieve the cap - it shares the exact same Claude Code subscription. | goose's own docs state it plainly: Claude ACP "[u]ses the same Claude subscription as the deprecated [CLI provider]" (`goose-docs.ai/docs/guides/acp-providers`, fetched raw 2026-09-13). Running a goose lane this way is cosmetically a different tool consuming the identical quota. |
| 3 | USE OpenCode, not goose, for the first Orca pilot lane. | OpenCode's `--command "opencode"` already appears verbatim in `orca terminal create --help` (confirmed by running the command locally, 2026-09-13), meaning Orca's own maintainers already treat it as a first-class lane command. goose has no equivalent mention in Orca's CLI help text (see Sources - GitHub/local verification). |
| 4 | KEEP both tools out of Orca's managed-account system for now. | `orca account add --help` scopes to "Claude or Codex" only (verified locally, 2026-09-13) - OpenCode and goose must carry their own credentials (`opencode auth login`, `goose configure`, or env vars) independent of Orca's account switcher. A lane on either tool is a bare terminal command, not an Orca-managed identity. |

## Findings

### 1. What each tool actually is

- **OpenCode** (`opencode.ai`, GitHub `anomalyco/opencode` - the repo Orca's help text and opencode's own install script point at, formerly under `sst`): a terminal-first, open-source coding agent with a TUI, desktop app (macOS/Windows/Linux, in beta), IDE extension, and a headless server mode. Fetched raw via curl, 2026-09-13: "OpenCode is an open source agent that helps you write code in your terminal, IDE, or desktop... 75+ LLM providers through Models.dev, including local models."
- **goose** (`goose-docs.ai`, GitHub `aaif-goose/goose`, originally Block's internal tool, open-sourced Jan 2025, moved to the **Agentic AI Foundation (AAIF)** per a banner on every doc page - fetched raw 2026-09-13): a general-purpose agent (not code-only - "research, writing, automation, data analysis") with CLI, desktop app, and an API, built in Rust. It supports "15+ providers" natively plus a separate ACP-provider path for reusing Claude Code / ChatGPT Plus/Pro / Amp subscriptions.

### 2. Provider / model support (decision-relevant to the usage cap)

| | OpenCode | goose |
|---|---|---|
| Provider count | "75+ LLM providers through Models.dev" (home page, raw fetch) - full list on `/docs/providers` includes Anthropic, OpenAI, Google Vertex, Bedrock, Azure, Groq, Ollama (local), OpenRouter, xAI, DeepSeek, Together AI, and 60+ more named gateways | "Works with 15+ providers - Anthropic, OpenAI, Google, Ollama, OpenRouter, Azure, Bedrock, and more" (home page, raw fetch); full provider table on `/docs/getting-started/providers` |
| Claude via API key | Yes - `ANTHROPIC_API_KEY` set through `opencode auth login`, billed on Anthropic Console, separate from a Claude Max/Pro subscription cap | Yes - same pattern, `ANTHROPIC_API_KEY` |
| Claude via existing subscription | **Blocked by Anthropic's terms, not by OpenCode's design.** `/docs/providers` (raw fetch, re-verified 2026-09-13) walks through `/connect` -> Anthropic -> "Here you can select the Claude Pro/Max option and it'll open your browser and ask you to authenticate" - directly beneath that it states: "There are plugins that allow you to use your Claude Pro/Max models with OpenCode. Anthropic explicitly prohibits this. Previous versions of OpenCode came bundled with these plugins but that is no longer the case as of 1.3.0." OpenCode's zero-setup subscription list is **ChatGPT Plus, GitHub Copilot, GitLab Duo, Atomic Chat** (four items, per the same page) - Anthropic is the one major provider deliberately excluded from it. | Yes, via **ACP provider "Claude ACP"** - wraps `claude-agent-acp` and "Uses the same Claude subscription as the deprecated [CLI provider]" (`/docs/guides/acp-providers`, raw fetch). This is the one path in either tool that visibly touches the same weekly cap Zaal is trying to relieve. |
| Local / free models | Ollama, LM Studio, llama.cpp all listed as first-class providers | Ollama listed as a first-class provider; goose also runs via Atomic Chat locally |
| Model recommendation | No stated preference in docs sampled | goose docs state it "currently works best with Claude 4 models" and point to the Berkeley Function-Calling Leaderboard for picking others (`/docs/getting-started/providers`) - a tool built to be model-agnostic still nudges back toward Anthropic |

### 3. MCP support

Both are native MCP clients, not just MCP-adjacent:

- **OpenCode** (`/docs/mcp-servers`, raw fetch): configured under `mcp` in `opencode.jsonc`/`opencode.json`, supports local (stdio) and remote (HTTP) servers, OAuth for remote servers, global or per-agent scoping. Explicit caveat in the docs: "MCP servers add to your context... we recommend being careful with which MCP servers you use" - same context-budget problem ZAO already tracks for Claude Code lanes.
- **goose** (`/docs/getting-started/using-extensions`, raw fetch): calls MCP servers "extensions." Ships five built-in extensions (Developer, Computer Controller, Memory, Tutorial, Auto Visualiser) plus "70+ MCP extensions" (home page claim). Notably: "goose automatically checks external extensions for known malware before activation" - a supply-chain check OpenCode's docs do not claim.

### 4. Permissions / tool approval

- **OpenCode** (`/docs/permissions`, raw fetch): three-state model - `allow` / `ask` / `deny`, configurable globally (`*`) or per tool, with wildcard and per-directory rules. `--auto` flag (also `opencode run --auto`) auto-approves anything not explicitly denied; explicit `deny` rules always hold even in auto mode. Config note: "As of v1.1.1, the legacy `tools` boolean config is deprecated and merged into `permission`" - an active, recently-changed surface, not a stable one.
- **goose** (`/docs/guides/managing-tools/goose-permissions`, raw fetch): four named modes - **Completely Autonomous** (no approval, can delete files), **Manual Approval** (approve every tool call), **Smart Approval** (risk-based auto-approval), and a fourth ("Chat...", page truncated in this fetch - see Sources, marked PARTIAL). Docs flag that the Developer extension is enabled by default and, combined with autonomous mode, "goose can execute commands and modify files without your approval" out of the box - a materially looser default posture than OpenCode's per-action `ask` default.

### 5. Headless / non-interactive mode

Both have a real one - this is what makes either usable as an unattended Orca lane:

- **OpenCode**: `opencode run [message..]` - "Run opencode in non-interactive mode by passing a prompt directly... useful for scripting, automation." Flags include `--format json` (raw JSON events), `--auto` (auto-approve), `--model`, `--agent`, `--file`. Also `opencode serve` starts a headless HTTP server so a lane can attach via `opencode run --attach http://localhost:4096 "..."` and skip MCP cold-boot on every invocation - directly useful for a 24/7 Orca lane.
- **goose**: `goose run -i <file>` or `-t "<text>"` - "Execute commands from an instruction file or stdin." Flags include `--no-session` (no session file at all), `-q/--quiet` (model output only, no chrome), `--output-format json|stream-json` for automation, `--max-turns` (default 1000) and `--max-tool-repetitions` as loop guards, and `--params`/`--recipe` for portable YAML task templates ("recipes") - a structured-automation feature OpenCode does not have a documented equivalent for.

### 6. Session resume

- **OpenCode**: `--continue`/`-c` (last session), `--session`/`-s <id>` (specific session), `--fork` (branch a copy). Works both from the TUI and from `run`.
- **goose**: `-r/--resume` (both `goose session` and `goose run`), `--fork` to duplicate with history, `--edit` to open a resumed session's transcript in `$EDITOR` as YAML before continuing, `--history` to print prior messages on resume. goose migrated session storage from per-session `.jsonl` files to a single SQLite `sessions.db` "starting with version 1.10.0" (`/docs/guides/goose-cli-commands`, raw fetch) - legacy `.jsonl` still readable but no longer managed.
- **Caveat that cuts against goose for this fleet**: the ACP providers (including "Claude ACP") explicitly do **not** support resume or fork - "goose session resume and goose session fork are not supported yet" (`/docs/guides/acp-providers`). So the one goose mode that reuses a Claude subscription is also the one mode that can't be resumed - a real gap for a lane meant to run unattended across a session boundary.

### 7. Licence (read from the LICENSE file, not the API field, per this library's hard rule)

- **OpenCode** - repo `anomalyco/opencode`. `gh api repos/anomalyco/opencode/contents/LICENSE` decodes to a standard **MIT License**, copyright "opencode" 2025. Permissive, no copyleft, compatible with private forks/vendoring.
- **goose** - repo `aaif-goose/goose`. `gh api repos/aaif-goose/goose/contents/LICENSE` decodes to the full **Apache License 2.0** text. Permissive, includes an explicit patent grant (Section 3) that MIT lacks - marginally more protective for a project taking outside contributions, no practical downside for ZAO's use as a client tool.

Both licences clear ZAO for adoption/vendoring with no legal blocker either way.

### 8. Maturity (measured 2026-09-13, `zao-research-snapshot`)

| | OpenCode (`anomalyco/opencode`) | goose (`aaif-goose/goose`) |
|---|---|---|
| Created | 2025-04-30 (~1.4 yr old) | 2024-08-23 (~2.1 yr old) |
| Stars | 207,064 | 54,210 |
| Forks | 27,139 | 6,224 |
| Open issues | 5,855 | 337 |
| Contributors (top-100 sampled) | 100+, top: thdxr, adamdotdevin, opencode-agent[bot], rekram1-node, kitlangton | 100+, top: dependabot[bot], alexhancock, DOsinga, lifeizhou-ap, jamadeo |
| Last push | 2026-09-13 (today) | 2026-09-11 (2 days ago) |
| Governance | Company-adjacent (opencode/anomalyco) | Moved to the **Agentic AI Foundation (AAIF)** - Block spun it out to a neutral foundation (banner on every doc page, dated claim not independently re-verified beyond the banner text itself) |

Raw star/issue counts favor OpenCode heavily, but OpenCode's 5,855 open issues against 100 tracked contributors is a materially higher issue backlog ratio than goose's 337 - read the star count as popularity, not as a proxy for stability. Per this skill's snapshot practice, these are first-look numbers with no prior snapshot to diff against; a second look in 1-2 weeks will show real velocity for the lane-worthiness call, not just size.

### 9. Running one lane inside Orca - concretely

Verified locally, 2026-09-13:

- `orca terminal create --help` already documents `--command "opencode"` as a worked example (`orca terminal create --worktree path:/projects/myapp --command "opencode"`). No Orca-side change needed to start an OpenCode lane; it is exactly the same mechanism used for every Claude Code lane today, just naming a different binary.
- `orca account add --help` scopes explicitly to "Add a managed Claude or Codex account on this Orca host" - it has no goose or opencode-aware auth path. Whatever auth OpenCode or goose need (`opencode auth login`, or `goose configure` / provider env vars) has to be set up once per host outside Orca's account system, then the lane's terminal environment just needs to see those credentials (env vars or the tool's own credential file - `~/.local/share/opencode/auth.json` for OpenCode).
- Neither tool's docs mention Orca, tmux, or any lane manager by name (checked `/docs/enterprise`, `/docs/network` for OpenCode and the goose nav tree) - both are designed to be driven as a plain foreground or headless CLI process, which is exactly the shape Orca's `terminal create --command` wants.
- Practical first pilot: `orca terminal create --worktree <selector> --command "opencode run --auto --model openrouter/<free-or-cheap-model> '<task prompt>'"` for a specific lane's task, or `opencode serve` left running in one lane with other lanes `opencode run --attach` into it for shared MCP state.

## Contradiction check

No direct contradiction between the two tools' own docs. The one genuine tension is internal to goose: it markets itself as provider-agnostic and even foundation-governed (AAIF) for neutrality, but its own docs recommend Claude 4 models for best tool-calling results and its most subscription-friendly mode (Claude ACP) is the one that shares Anthropic's own metering - the tool's neutrality claim and its practical default both point back at Anthropic.

## Also See

- [Doc 618](../618-agents-md-spec-zaoos-audit/) - AGENTS.md spec audit lists both Goose and OpenCode among tools ZAOOS already targets for cross-agent config compatibility.
- [Doc 2268](../2268-t3-code-agent-control-surface/) - T3 Code control surface names OpenCode as one of the agents it can drive; relevant if ZAO ever wants one control plane over Claude Code + OpenCode lanes instead of Orca's native command-per-lane model.
- [Doc 2407](../2407-orca-tmux-lane-integration/) - measured Orca/tmux lane visibility; the same visibility gaps documented there would apply identically to an OpenCode or goose lane since Orca treats them as opaque terminal processes.
- [Doc 2444](../2444-always-on-orchestrator/) - context-handling overhead finding; relevant because OpenCode's own docs flag MCP-server context cost the same way this doc does for Claude Code lanes.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `opencode auth login` once on the Orca host and start one pilot lane via `orca terminal create --command "opencode run --auto ..."` against a non-Anthropic provider (OpenRouter or a free/local model) - shipped when that lane completes one real task end to end without touching the Claude weekly quota | Zaal | Task | 2026-09-20 |
| Re-run `zao-research-snapshot anomalyco/opencode` and `zao-research-snapshot aaif-goose/goose` to get the first delta reading (stars/issues velocity) - shipped when both snapshots show a second data point | Zaal | Task | 2026-09-27 |
| File a tracker row to evaluate goose's Claude ACP mode specifically for editor-embedded (not lane) use, since it shares the Claude subscription and offers no cap relief for Orca lanes - shipped when the tracker row exists with that scope note | Zaal | Tracker row | 2026-09-16 |

## Sources

- [OpenCode home page](https://opencode.ai/) - [FULL, method: curl + HTML strip] fetched 2026-09-13, 66,879 bytes raw.
- [OpenCode docs: Intro](https://opencode.ai/docs/) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [OpenCode docs: Providers](https://opencode.ai/docs/providers) - [FULL, method: curl + HTML strip] fetched 2026-09-13 and re-fetched raw a second time same day after review (identical 424KB raw HTML both times) to verify the Anthropic/Claude Pro-Max passage verbatim: "There are plugins that allow you to use your Claude Pro/Max models with OpenCode. Anthropic explicitly prohibits this. Previous versions of OpenCode came bundled with these plugins but that is no longer the case as of 1.3.0."
- [OpenCode docs: MCP servers](https://opencode.ai/docs/mcp-servers) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [OpenCode docs: Permissions](https://opencode.ai/docs/permissions) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [OpenCode docs: CLI](https://opencode.ai/docs/cli) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [OpenCode docs: Share](https://opencode.ai/docs/share) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [OpenCode docs: ACP Support](https://opencode.ai/docs/acp) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [goose docs home](https://goose-docs.ai/) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [goose docs: Quickstart](https://goose-docs.ai/docs/quickstart) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [goose docs: Configure LLM Provider](https://goose-docs.ai/docs/getting-started/providers) - [FULL, method: curl + HTML strip] fetched 2026-09-13, 228KB raw HTML.
- [goose docs: Using Extensions](https://goose-docs.ai/docs/getting-started/using-extensions) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [goose docs: goose Permission Modes](https://goose-docs.ai/docs/guides/managing-tools/goose-permissions) - [PARTIAL - fourth permission mode name truncated mid-fetch by the stripped-text window; the three primary modes (Completely Autonomous, Manual Approval, Smart Approval) were fully read. Escalation not pursued further since the three read modes already establish the comparison point against OpenCode's allow/ask/deny model] fetched 2026-09-13, method: curl + HTML strip.
- [goose docs: CLI Commands](https://goose-docs.ai/docs/guides/goose-cli-commands) - [FULL, method: curl + HTML strip] fetched 2026-09-13, 138KB raw HTML.
- [goose docs: Managing Sessions](https://goose-docs.ai/docs/guides/sessions/) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [goose docs: ACP Providers](https://goose-docs.ai/docs/guides/acp-providers) - [FULL, method: curl + HTML strip] fetched 2026-09-13.
- [GitHub: anomalyco/opencode](https://github.com/anomalyco/opencode) - [FULL, method: `gh api repos/anomalyco/opencode` + `gh api .../contents/LICENSE` decoded] snapshotted 2026-09-13: 207,064 stars, 27,139 forks, 5,855 open issues, MIT licence (read from LICENSE file).
- [GitHub: aaif-goose/goose](https://github.com/aaif-goose/goose) - [FULL, method: `gh api repos/aaif-goose/goose` + `gh api .../contents/LICENSE` decoded] snapshotted 2026-09-13: 54,210 stars, 6,224 forks, 337 open issues, Apache-2.0 licence (read from LICENSE file).
- [Hacker News: "Goose: An open-source, extensible AI agent that goes beyond code suggestions"](https://news.ycombinator.com/item?id=42879323) - [FULL, method: hn.algolia.com/api/v1/items keyless JSON API] 249 points, 17 top-level comments read directly (Jan 2025 - flagged as 19+ months old at time of this research; noted for staleness). Representative comment (user `juunpp`): criticized goose's "local" framing since it "requires you to set up a remote/external provider as the first step."
- [Hacker News: "Terminal Agents in 2026: Goose, Claude Code, OpenCode, and Pi Compared"](https://news.ycombinator.com/item?id=48683357) - [PARTIAL - story metadata only (4 points, 0 comments, June 2026) read via Algolia search API; article body not fetched since engagement was too low to justify escalation and it was not needed to support any specific claim in this doc] method: hn.algolia.com/api/v1/search keyless JSON API.
- **Control checks (empty-result proof, per this library's hard rule):** `zao-research-index "opencode"` and `"goose"` both returned 10+ ranked hits (proving the index itself works) with zero being a dedicated opencode-vs-goose comparison doc - a real negative, not a broken search. `gh search code "opencode" --owner=bettercallzaal --owner=ZAODEVZ` returned 12 real hits (proving the search mechanism works) confirming existing scattered mentions but no prior comparison doc. `hn.algolia.com` control query `"claude code"` returned 9,011 hits with a 2,445-point top story, proving the Algolia method itself surfaces real high-engagement results (i.e., goose's/opencode's lower point counts reflect real lower HN engagement, not a broken query).
- **Local verification (not a URL source):** `orca terminal create --help` and `orca account add --help`, run directly on this machine, 2026-09-13 - confirms the `--command "opencode"` example cited in the task and the "Claude or Codex only" scope of Orca's managed-account system.
