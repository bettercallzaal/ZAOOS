# 435 - ZOE Effectiveness v2: Proactive, Context-Aware, Safe Playbook

> **Status:** Research + ranked build list
> **Date:** 2026-04-18
> **Goal:** Rank every proposed ZOE upgrade against Zaal's daily flow, ship-today vs ship-this-week vs skip. Build list top 3 with exact VPS code. Companion to doc 245 (prior ZOE upgrade), doc 305 (pocket assistant), doc 434 (Telegram commands), doc 433 (portal todos).

---

## Key Decisions / Recommendations

Ranked for ship-next-7-days:

| # | Feature | Tier | Effort | Why this rank |
|---|---------|------|--------|---------------|
| 1 | **Morning brief at 10am ET** (reads P0+P1 todos, recent merged PRs, today's calendar) | **SHIP TODAY** | 45 min | Respects flow-state protocol (doc 305: no Telegram before 10am). Unblocks day. |
| 2 | **Evening reflection at 9pm ET** (what got done today, 1 thing for tomorrow) | **SHIP TODAY** | 30 min | Closes loop, pairs with todo marking. Low risk. |
| 3 | **`/summarize <project>` slash command** (git + todos + memory in 1 reply) | **SHIP TODAY** | 45 min | Fastest cross-project context switch for Zaal. No waiting for cron. |
| 4 | **`/focus <mins>` mute nudges during deep work** | **SHIP THIS WEEK** | 30 min | Flow state sacred. Manual escape hatch for 9am+ Telegram nudges. |
| 5 | **`/ask <question>` external research via DuckDuckGo MCP + Jina** | **SHIP THIS WEEK** | 60 min | Already have DuckDuckGo MCP from doc 235. Routes research to ZOE. |
| 6 | **Context awareness: auto-read git HEAD + AO active sessions + open PRs into system prompt** | **SHIP THIS WEEK** | 90 min | ZOE becomes situationally aware. One shell-out per reply, small cost. |
| 7 | **Per-project memory files** (zao-os.md, zaostock.md, wavewarz.md, coc.md, bcz.md, personal.md), auto-selected by keyword | **SHIP THIS WEEK** | 60 min | Solves "ZOE replies generically" problem. |
| 8 | **Weekly rollup via `/weekly` + Sunday 6pm auto-push** | **SHIP THIS WEEK** | 60 min | Retro + plan-next loop. Reads todos + gh + memory. |
| 9 | **Telegram voice message -> todo transcription (via bot's native voice download + Whisper via Anthropic or local)** | **SHIP THIS WEEK** | 90 min | Walking brain-dump. Telegram voice is native on iPhone lock-screen. |
| 10 | **Safety guardrails: command allowlist + per-action rate limits** | **SHIP THIS WEEK** | 60 min | Prevents runaway loops. Needed before #11-14 below. |
| 11 | **Auto-research-doc -> MEMORY.md key-decision appender** | SHIP WHEN THERE IS ROOM | 60 min | Quality-of-life for knowledge compounding. |
| 12 | **ZOE auto-posts daily "what I shipped" to X+Farcaster via Firefly** | SHIP WHEN THERE IS ROOM | 90 min | Build-in-public automation. Needs manual approval first. |
| 13 | **Multi-user / per-user JSON tenant separation** | SHIP WHEN THERE IS ROOM | 2 hrs | Preload work for adding ZAO members later. Not needed now (188 members, solo founder use). |
| 14 | **Apple Reminders / Google Tasks sync into portal todos** | SHIP WHEN THERE IS ROOM | 3 hrs | Reduces "which app do I add to" friction. Worth it only if Zaal actually uses those apps. |
| 15 | **ZOE as the voice on outbound ring-a-ding calls** | **SKIP for now** | - | Keep ZOE = text dispatcher. Separate ring-a-ding agent with distinct voice/persona = safer brand boundary. Revisit after 20 call runs. |
| 16 | **Inline keyboards on Telegram messages** (approve/snooze buttons) | SHIP WHEN THERE IS ROOM | 2 hrs | Nice polish but tap-the-URL works today. |
| 17 | **Conversation-log pattern mining** ("Zaal asked 3x -> make it a skill") | SHIP WHEN THERE IS ROOM | 3 hrs | Requires weekly batch, needs memory-archive first. |
| 18 | **`/plan <topic>` that drafts an AO spawn spec** | SHIP WHEN THERE IS ROOM | 90 min | Useful but `/todo ... then tap spawn` already covers 80%. |

---

## The 3-item 7-day build list (concrete code)

### Ship today #1 - Morning brief at 10am ET

**Why:** Respects flow-state (no ping 4:30am-10am). First Telegram event of the day tells Zaal exactly what matters + frees his head.

**Script** - `~/bin/morning-brief.sh`:

```bash
#!/bin/bash
set -eu
ENV_FILE="${HOME}/.env.portal"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
[ -z "${TELEGRAM_BOT_TOKEN:-}" ] && exit 1

cd "${HOME}/code/ZAOOS" 2>/dev/null || true

BRIEF=$(python3 <<'PYEOF'
import json, os, subprocess, datetime
HOME = os.path.expanduser("~")
todos = []
try:
    s = json.load(open(HOME + "/portal-state/todos.json"))
    todos = [t for t in s["todos"] if not t.get("status","open") in ("done","archived")]
except Exception: pass
p0 = [t for t in todos if t.get("priority","P2") == "P0"]
p1 = [t for t in todos if t.get("priority","P2") == "P1"]

def sh(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=5, shell=True).stdout.strip()
    except Exception: return ""

recent = sh("cd ~/code/ZAOOS 2>/dev/null && git log --oneline --since='24 hours ago' | head -5")
prs = sh("/home/zaal/.local/bin/gh pr list --repo bettercallzaal/ZAOOS --limit 5 --json number,title | python3 -c 'import sys,json; [print(\"#%d %s\" % (p[\"number\"], p[\"title\"][:60])) for p in json.load(sys.stdin)]'")

d = datetime.datetime.now().strftime("%a %b %d")
out = ["Morning brief - " + d, ""]
out.append("TOP PRIORITIES")
for t in (p0 + p1)[:5]:
    out.append("- " + t.get("priority","P2") + " " + t["text"][:80])
if not (p0 or p1):
    out.append("- no P0/P1 open, go build")
if recent:
    out.append("")
    out.append("SHIPPED LAST 24H")
    out.append(recent)
if prs:
    out.append("")
    out.append("OPEN PRS")
    out.append(prs[:500])
out.append("")
out.append("portal.zaoos.com/todos - brain dump")
print("\n".join(out))
PYEOF
)

ESC=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$BRIEF")
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESC}}" > /dev/null
echo "$(date -Iseconds) morning-brief sent" >> "${HOME}/test-checklist/cron.log"
```

**Cron** (add to `crontab -e`):
```
0 14 * * * /home/zaal/bin/morning-brief.sh
```

`14 UTC` = 10am ET (during DST). Add a second entry `0 15 * * *` to cover EST.

**Test now:** `ssh zaal@31.97.148.88 '~/bin/morning-brief.sh'` -> ZOE DM fires.

---

### Ship today #2 - Evening reflection at 9pm ET

**Why:** Closes today's loop. Auto-lists todos marked done + prompts 1 thing for tomorrow.

`~/bin/evening-reflect.sh`:

```bash
#!/bin/bash
set -eu
ENV_FILE="${HOME}/.env.portal"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
[ -z "${TELEGRAM_BOT_TOKEN:-}" ] && exit 1

MSG=$(python3 <<'PYEOF'
import json, os, datetime
HOME = os.path.expanduser("~")
s = json.load(open(HOME + "/portal-state/todos.json"))
today = datetime.datetime.now().date()
done_today = [t for t in s["todos"] if t.get("status")=="done" and datetime.datetime.fromisoformat(t.get("updated_at","1970-01-01T00:00:00")).date()==today]
pending_p1 = [t for t in s["todos"] if not t.get("status","open") in ("done","archived") and t.get("priority","P2") <= "P1"]
out = ["Evening check - " + today.strftime("%a %b %d"), ""]
out.append("DONE TODAY: " + str(len(done_today)))
for t in done_today[:6]:
    out.append("- " + t["text"][:80])
out.append("")
out.append("TOP OPEN FOR TOMORROW:")
for t in pending_p1[:3]:
    out.append("- " + t["priority"] + " " + t["text"][:80])
out.append("")
out.append("Reply /todo <one-thing> to set tomorrow intention")
print("\n".join(out))
PYEOF
)
ESC=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$MSG")
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESC}}" > /dev/null
echo "$(date -Iseconds) evening-reflect sent" >> "${HOME}/test-checklist/cron.log"
```

Cron: `0 1 * * * /home/zaal/bin/evening-reflect.sh` (1 UTC = 9pm ET).

---

### Ship today #3 - `/summarize <project>` slash command

**Why:** Instant cross-project status. Switches Zaal's head between ZAO OS / ZAOstock / WaveWarZ in 2 sec.

Patch `~/zoe-bot/bot.mjs` `handleTodoCommand`:

```js
// Add inside handleTodoCommand, before the final `return null;`

const sumM = trim.match(/^\/(?:summarize|sum|status)\s+(\S+)/i);
if (sumM) {
  const proj = sumM[1];
  const projRoot = { ZAOOS: "~/code/ZAOOS", BCZ: "~/code/BetterCallZaal", BetterCallZaal: "~/code/BetterCallZaal" }[proj] || `~/code/${proj}`;
  try {
    const { execSync } = await import("child_process");
    const git = execSync(`cd ${projRoot} 2>/dev/null && git log --oneline --since='3 days ago' | head -8`, { encoding: "utf-8", timeout: 5000 }).trim() || "(no repo or no recent commits)";
    const todosJson = readFileSync(TODOS_FILE, "utf-8");
    const s = JSON.parse(todosJson);
    const open = (s.todos || []).filter(t => (t.project === proj || t.project === proj.toUpperCase()) && !["done","archived"].includes(t.status || "open"));
    const top = open.slice(0, 5).map(t => "- " + (t.priority || "P2") + " " + t.text.slice(0, 70)).join("\n");
    const prs = execSync(`/home/zaal/.local/bin/gh pr list --repo bettercallzaal/${proj === "ZAOOS" ? "ZAOOS" : proj} --limit 3 --json number,title 2>/dev/null || echo "[]"`, { encoding: "utf-8", timeout: 5000 }).trim();
    const prLines = (JSON.parse(prs || "[]") || []).map(p => `#${p.number} ${p.title.slice(0, 60)}`).join("\n") || "(no open PRs)";
    return [
      `SUMMARY: ${proj}`,
      "",
      `OPEN TODOS (${open.length}):`,
      top || "(none)",
      "",
      "RECENT COMMITS:",
      git.slice(0, 400),
      "",
      "OPEN PRS:",
      prLines.slice(0, 400),
    ].join("\n");
  } catch (e) {
    return "summarize error: " + String(e.message).slice(0, 200);
  }
}
```

**Test:** send `/summarize ZAOOS` in Telegram -> instant status dump.

---

## The 10 dimensions, answered

### 1. Proactive behaviors

**Ship:** Morning brief (10am ET), evening reflection (9pm ET). Respect flow state: NO Telegram 4:30am-10am.

**Skip for now:** Hourly check-ins (noise). Mid-day P1 scan (evening reflect covers it).

### 2. Context awareness

**Ship this week:** Shell-out into ZOE's system prompt builder at message time:
- `git log --since='24 hours ago' --oneline` on each active repo
- `gh pr list --state open --limit 5`
- `tmux ls | head` (which AO sessions running)
- `tail -20 ~/openclaw-workspace/TASKS.md`

All cached to `/tmp/zoe-context.md` with 5-min TTL. Regenerated if stale. Added to system prompt.

### 3. Cross-project memory

**Ship this week:** Per-project files in `~/openclaw-workspace/memory/`:
- `zao-os.md`
- `zaostock.md`
- `wavewarz.md`
- `coc.md`
- `bcz.md`
- `personal.md`
- `global.md` (always loaded)

Auto-selected by keyword match in user message. Max 2 files injected into prompt.

### 4. Learning from past

**Ship when there is room:** Sunday batch reads `~/openclaw-workspace/logs/*.log`, clusters by topic, spots "Zaal asked N times about X" patterns, proposes skill candidates. Saves to `~/openclaw-workspace/memory/learned-patterns.md`.

### 5. Proactive integrations

**Ship this week:** 
- **GitHub CLI:** Already authed. Surface in morning brief + `/summarize` + evening reflection.
- **Email inbox** (zoe-zao@agentmail.to): Daily batch at 10am reads unprocessed emails -> drops into portal todos with `#email` tag. `/inbox` slash command manually triggers.
- **Supabase ZAO OS events:** Daily snapshot of 7-agent squad activity -> morning brief.

**Ship when there is room:**
- **Google Calendar MCP:** Morning brief includes today's meetings + free windows. Requires OAuth flow (1-time user action).
- **Farcaster Neynar mentions:** Telegram ping when ZAO OS community mentions a specific channel.

### 6. Safety + guardrails

**Ship this week (all required before more autonomous features):**
1. **Command allowlist in bot.mjs** - `callClaude` has shell access; wrap with allowlist prefix check for dangerous ops (rm, sudo, reboot, kubectl).
2. **Per-minute rate limit** - max 10 Telegram sends/min from scripts (protects against loop bugs).
3. **Dispatch confirmation** - any `openclaw agent --agent X --message` requires inline keyboard approval OR explicit `CONFIRM` token in message.
4. **Immutable audit log** - append-only `~/openclaw-workspace/logs/actions.jsonl` of every agent dispatch, todo mutation, shell command.

**NEVER autonomously:**
- `git push --force` to any branch
- `rm -rf` anything outside `~/tmp/`
- Sign or broadcast on-chain transactions
- Delete PRs, issues, comments
- Post to X/Farcaster without explicit `/publish approve`
- Modify ~/.env.portal or any `.env*` file
- Spawn AO sessions without explicit spawn prompt

### 7. Voice input

**Ship this week: Telegram voice messages via bot API** - native on iPhone lock screen, zero iOS setup. Cheapest path.

Flow:
1. User sends voice message to `@zaoclaw_bot`
2. `bot.mjs` detects `msg.voice`, downloads via `getFile` + file_path
3. Transcribe via Anthropic Claude (supports audio input) OR local whisper.cpp
4. If transcription starts with `/todo` or similar command, run the command. Else relay to Claude as text.

**Skip:** webkitSpeechRecognition on portal - lock-screen Telegram beats "open Safari, tap mic".

### 8. Multi-user future

**Ship when there is room.** Store todos as `~/portal-state/todos-<tgchatid>.json`. auth-server includes user email in cookie, spawn-server and bot.mjs key state by that. 2 hr refactor when needed. **Do not pre-build** - YAGNI at 1 user.

### 9. Ring-a-ding

**Skip for now.** Keep ZOE as text dispatcher. Ring-a-ding outbound calls use separate voice persona + phone-number. Cleaner brand boundary + TCPA blast-radius isolation. Revisit after 20 successful calls and you want to merge identities.

### 10. Specific features

| Feature | Verdict | Why |
|---------|---------|-----|
| `/ask <question>` | **SHIP THIS WEEK** | DuckDuckGo MCP (doc 235) + Jina Reader already on VPS. 1 hr. |
| `/summarize <project>` | **SHIP TODAY** (build #3 above) | - |
| `/plan <topic>` | SKIP FOR NOW | `/todo + tap spawn on portal` does 80%. |
| `/focus <mins>` | **SHIP THIS WEEK** | Writes `~/.focus-until` timestamp. Nudge scripts check + skip. 30 min. |
| `/weekly` | **SHIP THIS WEEK** | Sunday 6pm cron reads `git log --since='7 days ago' --all` + todos delta + memory additions. |
| Auto-research-doc -> MEMORY.md | SHIP WHEN THERE IS ROOM | Quality of life. |
| Apple Reminders / Google Tasks | SHIP WHEN THERE IS ROOM | Only if Zaal actually uses those. |
| Daily "what I shipped" auto-post | SHIP WHEN THERE IS ROOM | Requires approval gate. Build-in-public is manual for now. |

---

## Comparison - ZOE effectiveness levers

| Lever | Ship cost | Value to Zaal (1-5) | Risk |
|-------|-----------|----------------------|------|
| Morning brief | 45 min | 5 | Low (one-way push) |
| Evening reflection | 30 min | 4 | Low |
| /summarize | 45 min | 5 | Low (read-only) |
| Per-project memory | 60 min | 4 | Low |
| Context awareness | 90 min | 4 | Medium (shell outs) |
| Voice messages | 90 min | 5 | Low (content in, content out) |
| Guardrails | 60 min | 5 | None (pure safety) |
| /focus mute | 30 min | 3 | None |
| /ask external research | 60 min | 3 | Low (read-only) |
| /weekly retro | 60 min | 3 | Low |

Ship the 5-value items first.

---

## VPS state right now (2026-04-18 5pm ET)

```
~/zoe-bot/bot.mjs         - handles /todo /done /list /p1 /note /help (doc 434)
~/portal-state/todos.json - 35+ seeded todos, work + life
~/test-checklist/         - 5 portal tests, 4x/day nudges
~/.env.portal             - TELEGRAM_BOT_TOKEN (rotated), TELEGRAM_CHAT_ID
~/bin/watchdog.sh         - keeps zoe-bot + caddy + ao + ttyd alive
~/openclaw-workspace/     - ZOE SOUL/AGENTS/MEMORY/TASKS + 7-agent squad
```

---

## ZAO Ecosystem Integration

### Files touched by top 3 builds

- `infra/portal/bin/morning-brief.sh` - NEW
- `infra/portal/bin/evening-reflect.sh` - NEW
- `infra/portal/bin/bot.mjs` - patch to add `/summarize` + future voice handler
- `~/zoe-bot/bot.mjs` on VPS - deployed copy
- `crontab` on VPS - add 2 entries (10am + 9pm ET)

### Cross-doc alignment

- [doc 245 - ZOE upgrade autonomous workflow](../245-zoe-upgrade-autonomous-workflow-2026/) - origin of OpenClaw + Mem0 recommendations
- [doc 305 - pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/) - source of 10am rule
- [doc 434 - portal personal todos + Telegram commands](../../infrastructure/434-portal-personal-todos-zoe-telegram-commands/) - slash command foundation
- [doc 433 - portal todos brain-dump](../../infrastructure/433-portal-todos-brain-dump-universal-nav/) - todos.json schema
- [doc 428 - unified agent portal](../../infrastructure/428-unified-agent-portal-ao-phone-access/) - VPS surface map
- [doc 235 - free web search MCP](../235-free-web-search-mcp-alternatives/) - DuckDuckGo + Jina for `/ask`
- [doc 236 - autonomous OpenClaw operator](../236-autonomous-openclaw-operator-pattern/) - consolidation pattern
- [doc 267 - OpenClaw skills + capabilities](../267-openclaw-skills-capabilities/) - agent dispatch

---

## Open questions to resolve with Zaal

1. Morning brief cadence - 10am hard, or also 1pm?
2. Evening reflection - 9pm hard, or "when you go to bed" (push notification tied to phone locked)?
3. Voice-message transcription - pay for Claude audio input ($0.01/min) or self-host whisper.cpp? (Whisper = free but CPU-heavy, 4s latency on VPS 1's 8GB RAM.)
4. `/focus <mins>` - should it also pause `watchdog.sh`? Probably NO (keeps stack alive).
5. Per-project memory - auto-select by keyword OR user passes `/switch zao-os` to change context?

Answer these before ship #3 of the 7-day build.

---

## Sources

- [Companion - doc 245 ZOE upgrade (Mem0, inline keyboards, webhooks)](../245-zoe-upgrade-autonomous-workflow-2026/README.md)
- [Companion - doc 305 pocket assistant flow state](../../dev-workflows/305-pocket-assistant-flow-state-workflow/README.md)
- [Companion - doc 434 Telegram commands](../../infrastructure/434-portal-personal-todos-zoe-telegram-commands/README.md)
- [Companion - doc 433 portal todos brain-dump](../../infrastructure/433-portal-todos-brain-dump-universal-nav/README.md)
- [Companion - doc 236 autonomous OpenClaw operator](../236-autonomous-openclaw-operator-pattern/README.md)
- [Telegram Bot API voice messages](https://core.telegram.org/bots/api#voice)
- [Anthropic audio input](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [whisper.cpp self-host](https://github.com/ggerganov/whisper.cpp)
- [user_zaal_schedule memory](file:///Users/zaalpanthaki/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/user_zaal_schedule.md)
