---
name: vps
description: Generate prompts for VPS Claude Code or ZOE (OpenClaw agent). Two destinations — Hostinger terminal (Claude Code) or Telegram (ZOE direct). Outputs copy-paste-ready prompts.
---

# VPS — ZOE Remote Management

Generate self-contained prompts for TWO destinations:
- **Hostinger web terminal** → Claude Code on the VPS (for system changes, config, debugging)
- **Telegram** → ZOE directly (for task instructions, context updates, questions)

You cannot SSH directly — all output is a copy-paste prompt for one of these two destinations.

## Usage

- `/vps` — interactive, asks what you need and WHERE to send it
- `/vps status` — health check prompt (→ Hostinger)
- `/vps deploy <what to change>` — deploy config/files/upgrades (→ Hostinger)
- `/vps zoe <instructions>` — send ZOE context + tasks via workspace files (→ Hostinger, generates Telegram message)
- `/vps tell <message>` — send a direct message to ZOE (→ Telegram)
- `/vps ask <question>` — ask ZOE a question (→ Telegram)

## Routing: Where Does This Go?

**Before generating any prompt, determine the destination:**

| Intent | Destination | Label |
|--------|-------------|-------|
| Check health, logs, container state | Hostinger (Claude Code) | `📋 Paste into Claude Code on the VPS:` |
| Change config, install packages, update files | Hostinger (Claude Code) | `📋 Paste into Claude Code on the VPS:` |
| Update SOUL.md, AGENTS.md, MEMORY.md, TASKS.md | Hostinger (Claude Code) | `📋 Paste into Claude Code on the VPS:` |
| Tell ZOE to build something, start a task | **Telegram** (ZOE direct) | `💬 Send to ZOE on Telegram:` |
| Ask ZOE a question, request status, give feedback | **Telegram** (ZOE direct) | `💬 Send to ZOE on Telegram:` |
| Fix a bug ZOE introduced | Hostinger (Claude Code) | `📋 Paste into Claude Code on the VPS:` |

**Rule of thumb:** If it touches the filesystem, Docker, or config → Hostinger. If it's a conversation with ZOE → Telegram.

## Mode: tell (NEW — direct to ZOE on Telegram)

For sending ZOE instructions, task assignments, or feedback directly via Telegram. No VPS Claude Code involved.

1. **Gather context** from this conversation — what does ZOE need to know?
2. **Generate a Telegram message** that is:
   - Under 500 characters
   - Direct, no fluff
   - Includes specific task or question
   - Ends with "What are your Next 3 Moves?" (for task assignments) or a specific question
3. **Output format:**

```
💬 Send to ZOE on Telegram:
```
Then the message in a fenced code block.

**Examples of /vps tell:**
- `/vps tell proceed with P2 tasks` → Telegram message telling ZOE to start
- `/vps tell fix the import on calendar branch` → Telegram message with the fix instruction
- `/vps tell merge PR #86 first, then the rest` → Telegram message with merge order

## Mode: ask (NEW — question for ZOE on Telegram)

Same as tell but for questions. Does NOT end with "Next 3 Moves" — ends with the question.

**Examples:**
- `/vps ask what's the status of the lint warnings?`
- `/vps ask did you check if the calendar build passed?`

## VPS Environment (always include in generated prompts)

```
VPS: Hostinger KVM 2, Ubuntu 24.04, 31.97.148.88
Container: openclaw-openclaw-gateway-1 (Docker, image openclaw:local)
User inside container: node (uid 1000)
Config file owner: uid 1001 (use docker exec -u root for openclaw.json edits)
Workspace: /home/node/openclaw-workspace/
Repo: /home/node/openclaw-workspace/zaoos/
Config: /home/node/.openclaw/openclaw.json (OWNED BY 1001 — need root to write)
Agent identity: ZOE ⚡ — ZAO's orchestration agent
Telegram bot: @zaoclaw_bot
GitHub: bettercallzaal/ZAOOS (gh CLI installed + authenticated as bettercallzaal)
LLM: Minimax M2.7 (primary)
Tools: git, gh, npx, uvx (uv 0.11.2), python3
```

## Known Gotchas (learned from real deploys)

These MUST be included as warnings in every generated prompt:

1. **openclaw.json is owned by uid 1001, container runs as uid 1000 (node).** All config writes MUST use `docker exec -u root` or the write will fail with PermissionError.
2. **Workspace files (.md) are writable by node.** SOUL.md, MEMORY.md, AGENTS.md, TASKS.md, HEARTBEAT.md can be written without root.
3. **pip is NOT installed in the container.** Use `curl -LsSf https://astral.sh/uv/install.sh | sh` for Python tools, or npx for Node tools.
4. **After container restart, gh CLI and uvx survive** (installed to /usr/local/bin/ and /home/node/.local/bin/). But if the container is REBUILT (docker compose down/up with fresh image), they'll need reinstalling.
5. **The heredoc quoting inside docker exec is tricky.** Use this pattern:
   ```
   docker exec openclaw-openclaw-gateway-1 bash -c 'cat << '"'"'EOF'"'"' > /path/to/file
   content here
   EOF'
   ```
6. **ZOE's GitHub workflow order matters.** Code first, then commit, then push, then PR. ZOE has gotten this wrong before (created PR before writing code).
7. **Config changes require container restart.** Workspace file changes (.md) take effect on ZOE's next session automatically.

## Mode: status

Generate a prompt with this exact structure:

```
You are on the ZAO VPS. Run a health check on ZOE (OpenClaw agent in Docker).

Run ALL of these in parallel — read everything, change nothing:

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep openclaw
docker exec openclaw-openclaw-gateway-1 bash -c 'head -5 /home/node/openclaw-workspace/SOUL.md'
docker exec openclaw-openclaw-gateway-1 bash -c 'wc -l /home/node/openclaw-workspace/MEMORY.md'
docker exec openclaw-openclaw-gateway-1 bash -c 'cat /home/node/openclaw-workspace/TASKS.md'
docker exec openclaw-openclaw-gateway-1 bash -c 'head -3 /home/node/openclaw-workspace/AGENTS.md 2>/dev/null || echo "no AGENTS.md"'
docker exec openclaw-openclaw-gateway-1 bash -c 'head -3 /home/node/openclaw-workspace/HEARTBEAT.md 2>/dev/null || echo "no HEARTBEAT.md"'
docker exec openclaw-openclaw-gateway-1 bash -c 'ls -la /home/node/openclaw-workspace/memory/ 2>/dev/null || echo "no daily notes"'
docker exec openclaw-openclaw-gateway-1 bash -c 'cd /home/node/openclaw-workspace/zaoos && git log --oneline -5'
docker exec openclaw-openclaw-gateway-1 bash -c 'cd /home/node/openclaw-workspace/zaoos && git status --short | head -10'
docker exec openclaw-openclaw-gateway-1 bash -c 'gh pr list --repo bettercallzaal/ZAOOS --limit 5 2>&1'
docker exec openclaw-openclaw-gateway-1 bash -c 'gh issue list --repo bettercallzaal/ZAOOS --limit 5 2>&1'
docker logs openclaw-openclaw-gateway-1 --tail 15 2>&1
docker exec openclaw-openclaw-gateway-1 bash -c 'python3 -c "import json; c=json.load(open(\"/home/node/.openclaw/openclaw.json\")); print(\"Model:\", c.get(\"agents\",{}).get(\"defaults\",{}).get(\"model\",\"unknown\")); print(\"MCP servers:\", list(c.get(\"mcpServers\",{}).keys())); print(\"Heartbeat:\", c.get(\"agents\",{}).get(\"defaults\",{}).get(\"heartbeat\",\"not set\"))"'

Report in this format (read-only, change nothing):

## ZOE Status Report

**Container:** [up/down, uptime, ports]
**Identity:** [SOUL.md first line]
**Workspace files:** [which exist: AGENTS.md, HEARTBEAT.md, TASKS.md, daily notes]
**MEMORY.md:** [line count]
**Config:** [model, MCP servers list, heartbeat setting]

### Git State
- Branch: [current]
- Last 5 commits: [list]
- Dirty files: [list or "clean"]

### Open PRs
[list or "none"]

### Open Issues
[list or "none"]

### Tasks (from TASKS.md)
[full contents]

### Container Logs (last 15 lines)
[any errors? MCP failures? healthy?]

### Suggested Actions
[based on what you see — stale tasks, errors, missing files, etc.]
```

## Mode: deploy

1. **Gather local context first.** Before generating the prompt:
   - Read any files the user references
   - Check recent research docs if relevant
   - Check git status for uncommitted local changes
   - Read community.config.ts if the deploy touches branding/config

2. **Generate a prompt** with this structure:

```
You are on the ZAO VPS. Your job: [specific task].

## VPS ENVIRONMENT
[environment block from above]

## KNOWN GOTCHAS
- openclaw.json is owned by uid 1001. Use `docker exec -u root` for config writes.
- pip is not installed. Use npx or uvx for packages.
- Workspace .md files are writable by node (no root needed).
- Config changes need container restart. Workspace changes are automatic.

## STEP 1: READ CURRENT STATE
[commands to read ONLY the files being changed — always read before write]

## STEP 2: MAKE CHANGES
[specific writes with exact content — use the heredoc pattern from gotchas]

## STEP 3: VERIFY
[check files exist, restart if config changed, check logs]

## STEP 4: REPORT + ZOE TELEGRAM MESSAGE
List what changed, any errors. Then generate a short Telegram message for me to send to ZOE that tells her what changed and asks for her Next 3 Moves. Print it clearly labeled "TELEGRAM MESSAGE FOR ZOE:" so I can copy-paste it.
```

3. **Rules for generated deploy prompts:**
   - ALWAYS start with reading current state
   - Use `docker exec openclaw-openclaw-gateway-1 bash -c '...'` for container ops
   - Use `docker exec -u root` for openclaw.json writes and package installs
   - For config: read first, merge with python3 script, don't overwrite
   - For workspace files: node user can write directly
   - After config changes: `docker restart openclaw-openclaw-gateway-1 && sleep 30 && docker logs openclaw-openclaw-gateway-1 --tail 20`
   - Always end with a Telegram test message if workspace files changed

## Mode: zoe

For sending ZOE new context, instructions, or task updates.

1. **Gather context from this conversation** — what does ZOE need to know?
   - New tasks or priority changes
   - Research findings to add to MEMORY.md
   - Corrections or new patterns for SOUL.md/AGENTS.md
   - Completed work to mark in TASKS.md

2. **Generate a SINGLE prompt for VPS Claude Code** that does everything — file updates AND generates the Telegram message at the end:

```
You are on the ZAO VPS. Update ZOE's workspace files with new context, then generate a Telegram message for me to send her.

## KNOWN GOTCHAS
- openclaw.json owned by uid 1001. Use docker exec -u root for config writes.
- Workspace .md files writable by node (no root needed).
- Config changes need restart. Workspace changes are automatic.

## STEP 1: READ CURRENT STATE
docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/MEMORY.md
docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/TASKS.md
[add more reads as needed]

## STEP 2: UPDATE FILES
[exact content to append/replace — use docker exec with heredoc]

## STEP 3: VERIFY
[check files, restart if needed]

## STEP 4: GENERATE TELEGRAM MESSAGE
Print a short message (under 280 chars) for me to send ZOE on Telegram. Label it clearly:
TELEGRAM MESSAGE FOR ZOE:
[message that tells ZOE what changed, which files to read, and ends with "What are your Next 3 Moves?"]
```

The user only pastes ONE prompt into VPS Claude Code. The Telegram message comes out as part of the VPS output.

## Mode: interactive (no args)

Ask: "What do you need? I can:
1. **Check ZOE's status** (`/vps status`) → Hostinger
2. **Deploy changes** (`/vps deploy ...`) → Hostinger
3. **Update ZOE's files** (`/vps zoe ...`) → Hostinger
4. **Tell ZOE to do something** (`/vps tell ...`) → Telegram
5. **Ask ZOE a question** (`/vps ask ...`) → Telegram"

Then pick the right mode. If ambiguous, ask: "Should this go to Claude Code on the VPS, or directly to ZOE on Telegram?"

## Output Format

Structure your response as:

1. **Brief explanation** of what the prompt will do (1-2 sentences)
2. **"Paste this into Claude Code on the VPS:"** header
3. The prompt in a single fenced code block

**ONE prompt per invocation.** Always label which destination it goes to:
- `📋 Paste into Claude Code on the VPS:` → for Hostinger terminal prompts
- `💬 Send to ZOE on Telegram:` → for direct ZOE messages

For Hostinger prompts that change workspace files, the VPS Claude Code generates the ZOE Telegram message as part of its output (in the final STEP). The user copies it from the VPS terminal.

For `/vps tell` and `/vps ask`, you output the Telegram message directly — no VPS Claude Code involved.

## Prompt Size Rules

- Status prompts: under 500 words
- Deploy prompts: under 2000 words
- ZOE context prompts: under 1000 words
- Never include API keys or secrets — use ${VAR} placeholders
- Always use full paths, never ~ or relative inside docker exec

## Path Reference

| Wrong | Right |
|-------|-------|
| `~/.openclaw/workspace/` | `/home/node/openclaw-workspace/` |
| `~/.openclaw/workspace/zaoos/` | `/home/node/openclaw-workspace/zaoos/` |
| MCP filesystem for writes | Terminal: `cat << 'EOF' > path` |
| PR before code committed | Code → commit → push → PR |
| `pip install` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` or `npx` |
| `docker exec ... python3 script.py` for config | `docker exec -u root ... python3 -c '...'` for config |
| Brave Search MCP | DuckDuckGo MCP + Jina Reader ($0) |

## Research Docs Reference

When generating prompts, check if these are relevant:
- Doc 234: OpenClaw comprehensive guide — memory, knowledge graphs, MCP, context mgmt
- Doc 235: Free web search MCP — DuckDuckGo + Jina Reader
- Doc 236: Autonomous operator pattern — heartbeat, consolidation, "Next 3 Moves"
- Doc 237: USV agents — named agents, "mentions" data model
- Doc 238: Claude tools Top 50 — Context7, TDD Guard, Claude SEO
- Doc 239: Agent frameworks — OpenClaw stays, promptfoo, n8n

## Vercel Build Monitoring

ZOE can check if Vercel built a PR successfully using gh CLI:

```bash
# Check PR status checks (includes Vercel)
gh pr checks <PR_NUMBER> --repo bettercallzaal/ZAOOS

# Get Vercel deployment URL from PR
gh pr view <PR_NUMBER> --repo bettercallzaal/ZAOOS --json statusCheckRollup --jq '.statusCheckRollup[] | select(.context | contains("vercel")) | {state: .state, url: .targetUrl}'
```

To add build monitoring to ZOE's task workflow, include this in deploy/zoe prompts when relevant:

```
After creating a PR, wait 5 minutes then check the build:
gh pr checks <PR_NUMBER> --repo bettercallzaal/ZAOOS --watch --fail-fast
If it fails, read the Vercel logs and fix the issue on the same branch.
```

Common Vercel build failures for ZAO OS:
- `@/community.config` → should be `@/../community.config` (file is at repo root, not in src/)
- Missing "use client" directive on components using hooks
- TypeScript strict mode errors

## ZOE's Current Workspace Files (as of April 1, 2026)

| File | Status | Purpose |
|------|--------|---------|
| SOUL.md | Active | Identity, anti-patterns, expertise domains, GitHub workflow |
| AGENTS.md | Active | Session protocol, memory protocol, "Next 3 Moves", task workflow, security |
| HEARTBEAT.md | Active | 60m heartbeat checks, Monday fractal reminder, daily PR check |
| TASKS.md | Active | Work queue with completed/in-progress/queued sections |
| MEMORY.md | Active | Tools, config, research docs 234-239, patterns learned |
| memory/YYYY-MM-DD.md | Auto | Daily notes (created by ZOE per session) |
