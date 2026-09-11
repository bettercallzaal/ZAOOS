---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-11
superseded-by:
related-docs: "agents/1080-aws-strands-agents-for-zoe, agents/1081-zoe-assistant-buildout-roadmap"
original-query: "https://osp.fyi/tools /zao-research this please"
tier: STANDARD
---

# 2481 - Strands Agents Tools (osp.fyi/tools): skip the package, borrow its deprecation table

> **Goal:** Decide what the ZAO agent stack should do with `strands-agents-tools`,
> the AWS Strands tool library featured at osp.fyi/tools on 2026-09-10. The answer
> is to skip it, because its own maintainers are winding it down, and to borrow one
> practice from it.

## Key Decisions

| # | Decision | Call | Why (evidence) |
|---|---|---|---|
| 1 | Adopt `strands-agents-tools` anywhere in the stack | **SKIP** | Its own README says "this repository will eventually be archived". 14 of its tools are already deprecated, including `shell`, `editor`, `think`, `memory` and `cron`. They warn from v0.8.6 and log an error from v0.9.0. The article that sent us here praises `shell` and `editor` and never mentions this. |
| 2 | Adopt the Strands SDK for ZOE | **SKIP (unchanged from agents/1080)** | ZOE's tool surface is the Claude CLI: `bot/src/hermes/claude-cli.ts` passes `--allowedTools` / `--disallowedTools` per worker. Claude Code already ships every capability this package lists (files, shell, web search and fetch, subagents, MCP). A Python tool library would add a second runtime for nothing. |
| 3 | Borrow anything | **YES: the deprecation table** | For each retired tool the README gives one row: the tool, what replaces it, the version it starts warning, and the version it errors. It tells users to find remaining uses with `mypy --enable-error-code deprecated`. Our own retirements of skills and `bin/` scripts have no equivalent. On 2026-09-11, the Pi's three research loops (18 Claude calls a day) were found still running after the VPS radar was built to replace them, and nothing pointed from the old thing to the new one. |
| 4 | Its consent-bypass switch | **Do NOT copy** | `BYPASS_TOOL_CONSENT=true` turns off confirmation for every consent-gated tool (`shell`, `file_write`, `python_repl`), and a separate `DEV` mode "bypasses confirmations". One global switch that disables every gate is what `block-no-verify` exists to stop in our stack (dotfiles #184). |
| 5 | The "memory backends" pitch (Mem0, Bedrock KB, Elasticsearch, MongoDB Atlas) | **SKIP** | The Bedrock `memory` and `retrieve` tools are among the deprecated ones. The live alternatives embed with AWS Bedrock Titan. We chose bundle-first vault memory on 2026-09-11 (`decisions/compact-bundle-first.md`), and none of these backends is on our path. |

## What the link actually is

`https://osp.fyi/tools` redirects (HTTP 200 after redirect) to
`https://www.opensourceprojects.dev/post/tools`. That is a post by the account
`@githubprojects`, dated 2026-09-10 05:18, titled "Give Your AI Agents Actual
Capabilities With Strands Agents Tools". The page showed 31 impressions when read.
It is a promotional summary of `github.com/strands-agents/tools`, and it adds
nothing that is not in the repo's README. It misses the README's most important
section.

## Findings

### The package, measured 2026-09-11

| Fact | Value | Source |
|---|---|---|
| Repo | `strands-agents/tools`, created 2025-05-14, last push 2026-09-04 | `gh api repos/strands-agents/tools` |
| Stars / forks / open issues | 1,178 / 334 / 140 | same, plus `zao-research-snapshot` (first look, no delta yet) |
| Licence | Apache 2.0, read from the LICENSE file (not the API field) | `gh api .../contents/LICENSE` |
| PyPI | `strands-agents-tools` 0.8.8, released 2026-09-04; 53 releases since 0.0.1 on 2025-05-14; Python >= 3.10 | `pypi.org/pypi/strands-agents-tools/json` |
| Core deps | `strands-agents>=1.0.0`, `botocore`, `aws-requests-auth`, `slack-bolt`, `pillow`, `rich`, among others | same |
| Parent SDK | `strands-agents/sdk-python`: 7,204 stars, 1,124 forks, pushed 2026-09-11; LICENSE.APACHE | `gh api repos/strands-agents/sdk-python` |
| Top contributors | cagataycali (16), zastrowm (16), yonib05 (15), JackYPCOnline (12), mkmeral (11) | `zao-research-snapshot` |

### The part the article left out

The README's "Deprecations" section states the direction plainly: the SDK now
reasons, injects context, manages memory and runs tools concurrently on its own.
It also says an official vendor MCP server will track that vendor's API better
than a wrapper can. The section says more tools will follow and ends: "this
repository will eventually be archived". (In the README that sentence wraps across two lines, so a one-line grep for it finds nothing. Read the section, not the grep.)

| Deprecated tool | What replaces it |
|---|---|
| `shell` | `strands.vended_tools.bash` |
| `editor` | `strands.vended_tools.file_editor` |
| `sleep` | `strands.vended_tools.sleep` |
| `batch` | nothing; the SDK runs tools concurrently by default |
| `think` | the model's own extended thinking |
| `current_time` | `ContextInjector` |
| `memory` / `retrieve` | `MemoryManager` + `BedrockKnowledgeBaseStore` |
| `calculator`, `cron`, `environment` | `bash` |
| `slack` | the official Slack MCP server |
| `diagram`, `rss` | nothing; the model writes the code or uses a parser directly |

Every row warns from v0.8.6 and logs an error from v0.9.0. Deprecated tools keep
working, and the README calls the error log "a louder signal for anyone who has
not migrated, not a behavior change".

### What is still live and not deprecated

The live set includes file read and write, `http_request`, and Tavily and Exa
search/extract. It also has `python_repl` (consent-gated), `use_aws`, the Mem0,
MongoDB and Elasticsearch memory tools, `swarm`, `graph`, `agent_graph`,
`use_agent` and `use_llm`. There is an `mcp_client` too, which the README itself
marks with a security warning: agents "may connect to malicious servers". Finally
there are `browser`, `use_computer` and a TwelveLabs video search. The
multi-agent pieces overlap with what Claude Code subagents and our Orca lanes
already do.

### Community signal (thin)

Hacker News has 8 stories matching "strands agents", all low-traffic. The largest
is a 2026-07-13 Show HN (72 points, 28 comments): a Big Mouth Billy Bass driven
by Strands on a Raspberry Pi. In that thread the author notes you can "run a
local model with strands using Ollama pretty easily". No thread discusses the
tools package specifically. The launch posts (2025-05-16) drew 10 points and no
comments.

### Correction to agents/1080

`agents/1080-aws-strands-agents-for-zoe` (2026-07-14) says ZOE "uses
OpenRouter/self-hosted". That is stale. ZOE's workers run through the Claude CLI
on the subscription (`bot/src/hermes/claude-cli.ts`). ZAOOS #3473 on 2026-09-11
made `--bare` conditional on an API key precisely so the subscription OAuth
works. The SKIP call in 1080 still stands, on stronger grounds than it gave.

## Also See

- [agents/1080 - AWS Strands Agents: framework audit for ZOE](../1080-aws-strands-agents-for-zoe/)
- [agents/1081 - ZOE assistant build-out roadmap](../1081-zoe-assistant-buildout-roadmap/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a "Retired" table to the skills README, in the format of this package's deprecation table (skill, replacement, date retired), so a retired skill points at its successor. Shipped when the table exists in `~/.claude/skills` and lists the retired skills found in the skills review | @zj | PR (zaal-dotfiles) | 2026-09-18 |
| Put a `superseded-by` line on agents/1080's stale "OpenRouter" claim, pointing here. Shipped when the correction is on main | @vault | PR (ZAOOS research) | 2026-09-18 |
| No adoption work on `strands-agents-tools` | @zj | wontfix | wontfix |

## Sources

1. [FULL, curl + HTML strip] opensourceprojects.dev post (redirect target of osp.fyi/tools), "Give Your AI Agents Actual Capabilities With Strands Agents Tools", 2026-09-10 - https://www.opensourceprojects.dev/post/tools (verified 200, 2026-09-11)
2. [FULL, `gh api .../readme`, raw] strands-agents/tools README, including the Deprecations section and the environment-variable table - https://github.com/strands-agents/tools
3. [FULL, `gh api`] repo metadata and LICENSE file, strands-agents/tools - https://github.com/strands-agents/tools/blob/main/LICENSE
4. [FULL, JSON API] PyPI metadata for strands-agents-tools - https://pypi.org/project/strands-agents-tools/
5. [FULL, `gh api`] strands-agents/sdk-python repo metadata - https://github.com/strands-agents/sdk-python
6. [FULL, HN Algolia API] Hacker News search "strands agents", and the comment tree of item 48896599 (Show HN: BillAI Bass, 72 points) - https://news.ycombinator.com/item?id=48896599
7. [FULL, local] ZOE's tool surface: `bot/src/hermes/claude-cli.ts` lines 28-29 and 134-137 (allowedTools / disallowedTools)
