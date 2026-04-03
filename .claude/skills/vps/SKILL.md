---
name: vps
description: Manage ZOE (OpenClaw agent) on the VPS via direct SSH, or send messages to ZOE on Telegram. Execute commands directly — no copy-paste needed.
---

# VPS — ZOE Remote Management

Two modes of interaction:
- **SSH direct** → Execute commands on the VPS via `ssh zaal@31.97.148.88 "command"` (for system changes, config, debugging, status checks)
- **Telegram** → Generate copy-paste messages for ZOE directly (for task instructions, context updates, questions)

You HAVE direct SSH access as `zaal@31.97.148.88`. Use the Bash tool to run commands remotely. For docker commands, SSH in and run them — the zaal user is in the docker group.

## Usage

- `/vps` — interactive, asks what you need
- `/vps status` — health check (runs directly via SSH)
- `/vps deploy <what to change>` — deploy config/files/upgrades (runs directly via SSH)
- `/vps zoe <instructions>` — update ZOE's workspace files + generate Telegram message (runs directly via SSH)
- `/vps tell <message>` — send a direct message to ZOE (→ Telegram copy-paste)
- `/vps ask <question>` — ask ZOE a question (→ Telegram copy-paste)

## Routing: SSH or Telegram?

| Intent | Method |
|--------|--------|
| Check health, logs, container state | SSH direct — run it |
| Change config, install packages, update files | SSH direct — run it |
| Update SOUL.md, AGENTS.md, MEMORY.md, TASKS.md | SSH direct — run it |
| Tell ZOE to build something, start a task | Telegram copy-paste |
| Ask ZOE a question, give feedback | Telegram copy-paste |
| Fix a bug ZOE introduced | SSH direct — run it |

**Rule of thumb:** If it touches the filesystem, Docker, or config → SSH direct. If it's a conversation with ZOE → Telegram.

## SSH Patterns

**Single command:**
```bash
ssh zaal@31.97.148.88 "docker ps"
```

**Multi-command:**
```bash
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/TASKS.md"
```

**Writing files (heredoc over SSH):**
```bash
ssh zaal@31.97.148.88 'docker exec openclaw-openclaw-gateway-1 bash -c "cat > /home/node/openclaw-workspace/file.md << '"'"'EOF'"'"'
content here
EOF"'
```

**Config writes (need root inside container):**
```bash
ssh zaal@31.97.148.88 'docker exec -u root openclaw-openclaw-gateway-1 bash -c "..."'
```

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
Repo: /home/node/openclaw-workspace/ZAOOS/
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

**Run these commands directly via SSH using the Bash tool.** Run multiple SSH commands in parallel for speed.

Commands to run (all read-only):
```bash
# Run these in parallel via separate Bash tool calls:
ssh zaal@31.97.148.88 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep openclaw"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'head -5 /home/node/openclaw-workspace/SOUL.md'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'wc -l /home/node/openclaw-workspace/MEMORY.md'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'cat /home/node/openclaw-workspace/TASKS.md'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'head -3 /home/node/openclaw-workspace/AGENTS.md 2>/dev/null || echo no AGENTS.md'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'head -3 /home/node/openclaw-workspace/HEARTBEAT.md 2>/dev/null || echo no HEARTBEAT.md'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'ls -la /home/node/openclaw-workspace/memory/ 2>/dev/null || echo no daily notes'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'cd /home/node/openclaw-workspace/zaoos && git log --oneline -5'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'cd /home/node/openclaw-workspace/zaoos && git status --short | head -10'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'gh pr list --repo bettercallzaal/ZAOOS --limit 5 2>&1'"
ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'gh issue list --repo bettercallzaal/ZAOOS --limit 5 2>&1'"
ssh zaal@31.97.148.88 "docker logs openclaw-openclaw-gateway-1 --tail 15 2>&1"
```

Then present results in this format:

## ZOE Status Report

**Container:** [up/down, uptime, ports]
**Identity:** [SOUL.md first line]
**Workspace files:** [which exist: AGENTS.md, HEARTBEAT.md, TASKS.md, daily notes]
**MEMORY.md:** [line count]

### Git State
- Branch: [current]
- Last 5 commits: [list]
- Dirty files: [list or "clean"]

### Open PRs / Issues
[list or "none"]

### Tasks (from TASKS.md)
[full contents]

### Container Logs (last 15 lines)
[any errors? MCP failures? healthy?]

### Suggested Actions
[based on what you see — stale tasks, errors, missing files, etc.]

## Mode: deploy

**Execute directly via SSH.** Follow this workflow:

1. **Gather local context first:**
   - Read any files the user references
   - Check recent research docs if relevant
   - Check git status for uncommitted local changes

2. **Read current state on VPS** (via SSH, read before write):
   ```bash
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /path/to/file"
   ```

3. **Make changes** (via SSH):
   ```bash
   # Workspace files (node can write):
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'cat > /home/node/openclaw-workspace/file.md << ...'"
   
   # Config files (need root):
   ssh zaal@31.97.148.88 "docker exec -u root openclaw-openclaw-gateway-1 bash -c '...'"
   ```

4. **Verify** (via SSH):
   ```bash
   # After config changes, restart:
   ssh zaal@31.97.148.88 "docker restart openclaw-openclaw-gateway-1 && sleep 30 && docker logs openclaw-openclaw-gateway-1 --tail 20"
   ```

5. **Generate Telegram message** for ZOE (output as copy-paste text)

**Rules:**
- ALWAYS read before write
- Use `docker exec -u root` for openclaw.json writes and package installs
- For config: read first, merge with python3 script, don't overwrite
- Workspace .md files writable by node (no root needed)
- After config changes: restart container + check logs
- Always generate a Telegram message for ZOE at the end if workspace files changed

## Mode: zoe

For sending ZOE new context, instructions, or task updates. **Execute directly via SSH.**

1. **Gather context from this conversation** — what does ZOE need to know?
   - New tasks or priority changes
   - Research findings to add to MEMORY.md
   - Corrections or new patterns for SOUL.md/AGENTS.md
   - Completed work to mark in TASKS.md

2. **Read current state via SSH:**
   ```bash
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/MEMORY.md"
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/TASKS.md"
   ```

3. **Update files via SSH:**
   ```bash
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 bash -c 'cat >> /home/node/openclaw-workspace/MEMORY.md << ...'"
   ```

4. **Verify via SSH:**
   ```bash
   ssh zaal@31.97.148.88 "docker exec openclaw-openclaw-gateway-1 cat /home/node/openclaw-workspace/MEMORY.md | tail -5"
   ```

5. **Generate Telegram message** for ZOE (output as copy-paste text, under 280 chars, ends with "What are your Next 3 Moves?")

## Mode: interactive (no args)

Ask: "What do you need? I can:
1. **Check ZOE's status** (`/vps status`) — runs directly
2. **Deploy changes** (`/vps deploy ...`) — runs directly
3. **Update ZOE's files** (`/vps zoe ...`) — runs directly
4. **Tell ZOE to do something** (`/vps tell ...`) — Telegram message
5. **Ask ZOE a question** (`/vps ask ...`) — Telegram message"

## Output Format

For SSH modes (status, deploy, zoe): **Execute commands directly via Bash tool + SSH.** No copy-paste needed. Report results inline.

For Telegram modes (tell, ask): Output the message in a fenced code block labeled `Send to ZOE on Telegram:`

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
| `~/.openclaw/workspace/zaoos/` | `/home/node/openclaw-workspace/ZAOOS/` |
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
