# 465 — ZOE Observability + Dispatch Hardening (post-messaging-fix)

> **Status:** Research complete
> **Date:** 2026-04-20
> **Goal:** Map the next-highest-leverage ZOE improvements now that the messaging/reply-context layer (doc 464 + PRs #253/#254) is shipped. Focus: observability, ZOE -> specialist dispatch, watchdog reliability, voice + file + group scope expansion. Every item has a code path + difficulty score.
> **Builds on:** docs 234, 236, 245, 256, 289, 435, 447, 454, 460, 463, 464
> **Live VPS findings (2026-04-20 00:42 UTC):** 3 git clones of ZAOOS exist on VPS (zao-os, code/ZAOOS, openclaw-workspace/zaoos), deploy path is zao-os only, git-sync.sh only syncs openclaw-workspace, random_tip.py was not symlinked (now fixed), ANTHROPIC_API_KEY missing (no-LLM mode works), swap 1.1G/4G used, bot.log has 2 silent "Poll error: fetch failed" entries, watchdog respawned zoe-bot 3x/min on Apr 18 with no alert.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Observability default** | USE a 3-part stack: (a) daily `/activity` digest in Telegram at 8pm ET, (b) per-turn cost line appended to every ZOE reply in dev mode, (c) single `~/zoe-bot/events.jsonl` append-only log that `bot.mjs` + `random_tip.py` + `session-watcher.mjs` + `spawn-server.js` all write to. One sink, not five. |
| **Log aggregation** | ADD `infra/portal/bin/log-digest.mjs` that tails events.jsonl + correlates by `trace_id` + posts daily summary. Skip Grafana/Loki — overkill for 1-VPS single-user stack. |
| **Cost tracking** | PARSE `claude -p` JSON output for `total_cost_usd` + `usage.{input_tokens,output_tokens,cache_creation,cache_read}`. Append `{trace_id, model, cost_usd, tokens, duration_ms}` to events.jsonl. Daily digest rolls up. |
| **Dispatch routing** | USE prefix `@zoey <task>`, `@wallet <task>`, `@rolo <task>` in `bot.mjs` slash handler. Routes to `docker exec openclaw-openclaw-gateway-1 openclaw agent --agent <name> --message <task>` then polls agent's `results/` dir. Dispatch returns "task accepted: <id>"; session-watcher-style cron posts completion. |
| **Result polling** | USE filesystem polling on `/home/node/openclaw-workspace/<agent>/results/*.md` inside container via `docker exec ... ls -t --time=ctime`. Avoid exposing a port; keeps everything behind existing auth. |
| **Watchdog reliability** | CHANGE the respawn check from pattern-match-only to pattern + liveness probe. For bot.mjs: `curl -sf http://127.0.0.1:3004/api/sessions` (spawn-server) or the bot is fine; for AO: `pgrep` + `tmux capture-pane` tail shows working state. Log `respawn reason` instead of just "respawned". Alert to Telegram if >3 respawns in 10 min. |
| **Resilient Telegram send** | ADD `sendMessageWithRetry()` with exponential backoff (200/500/1200ms) + Retry-After header on 429. Wrap `poll()` in try/catch that logs fetch failures to events.jsonl with backoff instead of bare console.error (we saw 2 silent "Poll error: fetch failed" in tonight's log). |
| **Voice messages** | USE Whisper via Anthropic audio input (Claude handles audio natively in Messages API as of 2026-02). Skip standalone OpenAI Whisper — one API key fewer, same quality. Download OGG via `getFile` -> stream into Claude with text instruction "transcribe + route". |
| **File uploads** | ADD msg.photo / msg.document handlers that download via `getFile` + pass to Claude vision. Screenshots become queryable: "what does this screenshot say?" -> OCR + reply. |
| **Group / channel posting** | ADD `/cast <text>` (Farcaster via Neynar) + `/broadcast <channel> <text>` (Telegram channel) slash commands. Use existing allowlist for authorization. Keep ZOE OUT of multi-user groups until spam/DM policy hardens. |
| **Multi-user allowlist** | REPLACE `ALLOWED_USER = "1447437687"` (hardcoded) with `ALLOWED_USERS = (process.env.ALLOWED_USERS || "1447437687").split(",")`. Prep for ZAO member assistant agents per doc 256. |
| **Config/workspace paths** | READ from env: `process.env.WORKSPACE || "$HOME/openclaw-workspace"`. Stops hardcoding `/home/zaal/` which breaks on rename. |

---

## Part 1 — Observability Gap Map (what's broken today)

| Gap | Evidence | Impact |
|-----|----------|--------|
| Poll errors silent | `bot.log` 2026-04-21 at 00:0X: `Poll error: fetch failed` (x2, no alert, no retry logic) | Message could drop; Zaal unaware |
| Watchdog flapping | `watchdog.log` Apr 18 22:50-22:52: zoe-bot respawned 3x in 2 min, no alert | Transient crash loop unnoticed |
| No PR-merge notification | doc 454 #1 still open | Overnight ship not confirmed |
| No AO session exit alert | doc 454 #2 still open | 3 AO sessions died Apr 19 night with zero signal |
| Logs siloed across 5 files | `bot.log`, `spawn-server.log`, `watchdog.log`, `ao.log`, Supabase agent_events, Vercel logs (doc 463 P0 finding) | Can't answer "what did ZOE do today?" in <60s |
| No cost visibility | bot.mjs caps calls at `--max-budget-usd 2` but never logs actuals | Can't optimize, can't budget |
| No per-day digest | morning-brief.sh and evening-reflect.sh exist but don't surface ZOE's own activity | Zaal sees priorities, not what ran |
| Sent.json ≠ bot state | `sent.json` lives at `~/.cache/zoe-learning-pings/`, bot memory at `~/.cache/zoe-telegram/`; no single view | Debugging requires two greps |

---

## Part 2 — Unified events.jsonl (single append-only log)

### Schema

```json
{"ts":"2026-04-21T00:12:34.567Z","trace_id":"ab12cd","source":"bot","event":"inbound","user":"1447437687","text":"/tip 157","bytes":10}
{"ts":"2026-04-21T00:12:34.612Z","trace_id":"ab12cd","source":"bot","event":"slash_handled","command":"tip","result":"doc_found","path":"research/dev-workflows/157-.../README.md"}
{"ts":"2026-04-21T00:12:35.001Z","trace_id":"ab12cd","source":"bot","event":"outbound","chat_id":1447437687,"bytes":320}
{"ts":"2026-04-21T00:30:00.000Z","trace_id":"tip-ef","source":"pings","event":"tip_sent","doc":"research/.../038-.../README.md","mode":"summary"}
{"ts":"2026-04-21T00:30:05.114Z","trace_id":"ab12cd","source":"bot","event":"claude_call","model":"opus","tokens":{"in":4200,"out":380},"cost_usd":0.062,"duration_ms":7845}
{"ts":"2026-04-21T00:30:12.220Z","trace_id":"ship-77","source":"bot","event":"callback","action":"ship","doc_num":"157"}
{"ts":"2026-04-21T00:30:12.901Z","trace_id":"ship-77","source":"spawn","event":"spawn_agent","doc":"research/.../157-.../README.md","sessionId":"xyz-abc"}
{"ts":"2026-04-21T00:45:00.000Z","trace_id":"ship-77","source":"watcher","event":"shipped","pr":255,"url":"https://..."}
```

Every source writes to the same `~/zoe-bot/events.jsonl` via a simple helper. Rotation: when file exceeds 50 MB, rename to `events-YYYYMMDD.jsonl.gz` + gzip; keep 30 days.

### Tiny helper (drop in each producer)

```js
// infra/portal/bin/events.mjs
import { appendFileSync, mkdirSync } from "fs";
import { randomBytes } from "crypto";
const EVENTS_FILE = process.env.HOME + "/zoe-bot/events.jsonl";
export function traceId() { return randomBytes(3).toString("hex"); }
export function emit(obj) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...obj }) + "\n";
  try { mkdirSync(process.env.HOME + "/zoe-bot", { recursive: true }); appendFileSync(EVENTS_FILE, line); }
  catch (e) { console.error("events.emit error:", e.message); }
}
```

Python mirror for `random_tip.py` — 8 lines. Shell mirror via `jq -nc` one-liner for bash scripts.

---

## Part 3 — Daily Activity Digest (`/activity` + 8pm cron)

Scheduled via cron + on-demand via `/activity` slash command.

```
[ZOE DAILY DIGEST] 2026-04-20

Telegram
  in:  14 messages from Zaal
  out: 18 messages from ZOE (incl 4 tips, 2 ship-fix spawns)
  slash commands: /tip x3, /list x2, /recap x1

Claude calls
  7 calls, avg 2.3 turns
  cost today: $0.41  (month-to-date: $4.18 / $50 budget)
  p50 latency: 6.2s  p95: 18.4s
  1 timeout (180s cap) on "summarize all open PRs"

Agent dispatch
  @zoey: 2 tasks (both DONE)
  @wallet: 0 tasks
  @rolo: 1 task (PENDING — started 18:02)

PR activity
  shipped: #253 reply-context fix, #254 ship-fix loop
  opened: 0
  ship-fix spawns: 2 (1 PR merged, 1 in flight)

Reliability
  poll errors: 2 (transient Telegram API, auto-retried)
  watchdog respawns: 0
  uptime: 99.7% (5 min across 2 caddy restarts)

Top 3 costs
  1. "summarize all open PRs"  $0.18
  2. "what did I ship this week?"  $0.09
  3. "draft PR comment for #253"  $0.05
```

Implementation: `infra/portal/bin/log-digest.mjs` (new, ~150 lines). Reads events.jsonl for today, groups by event type, queries `gh pr list` + watched-sessions.json, formats, sends Telegram.

**Difficulty:** 5/10.

---

## Part 4 — Agent Dispatch (`@zoey`, `@wallet`, `@rolo`)

### Flow

```
Zaal: "@zoey draft a Farcaster cast about PR #253 shipping"
  1. bot.mjs handleAtMention() parses "@zoey" + rest
  2. Validates agent name against allowlist [zoey, wallet, rolo]
  3. execs `docker exec openclaw-openclaw-gateway-1 openclaw agent --agent zoey --message "draft a Farcaster cast..."`
  4. Captures sessionId or task file name from stdout
  5. Records to ~/.cache/zoe-telegram/dispatched-tasks.json:
     { taskId, agent, message, started_at, result_path, chatId, messageId }
  6. Replies: "[DISPATCHED] zoey task <id>. Polling for result..."
  7. New cron `*/1 * * * * dispatch-watcher.mjs` polls result paths
  8. On result file appearance: posts result summary to Telegram
```

### `handleAtMention` sketch

```js
async function handleAtMention(msg) {
  const m = msg.text.match(/^@(zoey|wallet|rolo)\b\s+(.+)/is);
  if (!m) return null;
  const agent = m[1].toLowerCase();
  const task = m[2].trim().slice(0, 2000);
  if (!task) return "empty task";
  const traceId = randomBytes(3).toString("hex");
  emit({ trace_id: traceId, source: "bot", event: "dispatch", agent, task: task.slice(0, 200) });
  try {
    const out = execSync(
      `docker exec openclaw-openclaw-gateway-1 openclaw agent --agent ${agent} --message ${JSON.stringify(task)} --non-interactive`,
      { encoding: "utf-8", timeout: 30_000 }
    );
    const sid = (out.match(/session[: ]*([\w-]+)/i) || [])[1] || traceId;
    recordDispatch({ taskId: sid, agent, task, chatId: msg.chat.id, messageId: msg.message_id, traceId });
    return `[DISPATCHED] ${agent} task ${sid.slice(0, 10)}. Polling for result...`;
  } catch (e) {
    emit({ trace_id: traceId, source: "bot", event: "dispatch_fail", agent, err: e.message });
    return `[DISPATCH FAIL] ${agent}: ${e.message.slice(0, 200)}`;
  }
}
```

### Result polling (dispatch-watcher.mjs, new cron */1)

```js
// For each pending dispatch: ls results dir for files newer than started_at
const recent = execSync(
  `docker exec openclaw-openclaw-gateway-1 find /home/node/openclaw-workspace/${agent}/results -type f -newermt "@${startedSec}" -name '*.md' 2>/dev/null`,
  { encoding: "utf-8" }
);
// On hit: read result, post summary, mark task notified
```

### Security

- Prefix match re-validated against `/^(zoey|wallet|rolo)$/` (not regex-free substring).
- Task passed via `JSON.stringify` to avoid shell injection.
- ALLOWED_USER check still applies (already in poll loop).
- `--non-interactive` flag keeps openclaw from blocking on TTY.
- Rate limit per agent: 5 dispatches/hour in shared rate file.

**Difficulty:** 6/10.

---

## Part 5 — Watchdog Reliability Upgrade

### Today's problem

`watchdog.sh` checks `pgrep -f <pattern>` + `tmux has-session`. When the child process dies but tmux shell survives, it works. When ao boot hangs mid-init, `pgrep -f "ao start"` stays true + watchdog is blind.

Apr 18 22:50-22:52: zoe-bot respawned 3x in 2 min. No idea why, no alert.

### Proposed changes

```bash
# infra/portal/bin/watchdog.sh
# Add a respawn counter + alert threshold.
BOT_ALERT_THRESHOLD=3  # respawns per 10 min -> alert
RESPAWN_LOG="$HOME/watchdog-respawns.jsonl"

respawn() {
  local name=$1 cmd=$2 pat=$3 health=$4   # NEW: optional health check URL
  local reason=""
  local need_spawn=0

  if [ -n "$pat" ] && ! pgrep -f "$pat" >/dev/null 2>&1; then
    reason="proc_missing"; need_spawn=1
  fi

  if [ "$need_spawn" = "0" ] && [ -n "$health" ]; then
    if ! curl -sf -m 3 "$health" >/dev/null 2>&1; then
      reason="health_fail"; need_spawn=1
      # Health check failed but process lives — kill it so fresh spawn is clean.
      pkill -9 -f "$pat" 2>/dev/null
    fi
  fi

  if ! tmux has-session -t "$name" 2>/dev/null; then
    [ -z "$reason" ] && reason="tmux_gone"; need_spawn=1
  fi

  if [ "$need_spawn" = "1" ]; then
    tmux new -d -s "$name" "$cmd" && {
      ts=$(date -Iseconds)
      echo "{\"ts\":\"$ts\",\"name\":\"$name\",\"reason\":\"$reason\"}" >> "$RESPAWN_LOG"
      # Alert if >= THRESHOLD respawns in last 10 min for this name.
      cutoff=$(date -d '10 min ago' -Iseconds)
      count=$(awk -v c="$cutoff" -v n="$name" -F'"' '$4>c && index($0,"\"name\":\""n"\"") {x++} END{print x+0}' "$RESPAWN_LOG")
      if [ "$count" -ge "$BOT_ALERT_THRESHOLD" ]; then
        curl -s -X POST -H 'Content-Type: application/json' \
          -d "{\"chat_id\":\"$TELEGRAM_CHAT_ID\",\"text\":\"[WATCHDOG] $name respawned $count times in 10 min. reason=$reason\"}" \
          "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" >/dev/null
      fi
    }
  fi
}

# Add health URLs for services that expose them:
respawn spawn-server "$SPAWN_CMD" "node.*spawn-server.js" "http://127.0.0.1:3004/api/sessions"
respawn auth-server  "$AUTH_CMD"  "node.*auth-server.js"  "http://127.0.0.1:3005/healthz"  # add healthz
respawn zoe-bot      "$BOT_CMD"   "node.*bot.mjs"         ""  # bot has no HTTP port; skip
```

Add lightweight `/healthz` to `spawn-server.js` + `auth-server.js` (1 line each).

**Difficulty:** 4/10.

---

## Part 6 — Voice Messages (Whisper via Claude audio)

### Flow

```
1. msg.voice arrives via getUpdates (update.message.voice: { file_id, duration, mime_type, file_size })
2. POST getFile -> file_path
3. GET https://api.telegram.org/file/bot<token>/<file_path> -> raw bytes (OGG/Opus)
4. Pass to Claude Messages API as audio content block:
   { role: "user", content: [
     { type: "input_audio", source: { data: <base64>, media_type: "audio/ogg" }},
     { type: "text", text: "Transcribe this voice message and route it to the right slash command or reply conversationally." }
   ]}
5. Claude returns transcription + action plan; bot.mjs follows action.
```

### Cost

Voice is metered as audio tokens in Messages API. Claude Haiku 4.5 audio: ~$1/1M input tokens. A 10-second voice note = ~50 tokens = $0.00005. Effectively free at Zaal's usage rate.

### Fallback

If Claude audio unavailable, use OpenAI Whisper via `curl -F file=@voice.ogg -F model=whisper-1 https://api.openai.com/v1/audio/transcriptions`. ~$0.006/min. Adds an API key.

**Recommendation:** Start with Claude audio. Fall back only if quality fails.

**Difficulty:** 6/10.

---

## Part 7 — File / Photo Uploads

Add to poll loop:

```js
if (msg.photo) {
  const largest = msg.photo[msg.photo.length - 1];  // largest size
  const fileBytes = await downloadTelegramFile(largest.file_id);
  const base64 = fileBytes.toString("base64");
  const systemPrompt = loadSystemPrompt(chatId);
  // Pass image + caption to Claude as vision input
  const reply = await callClaudeWithImage(msg.caption || "What is this?", base64, systemPrompt);
  await sendMessage(chatId, reply);
  continue;
}
if (msg.document) { /* similar: PDF/text as file input */ }
```

Uses Claude Messages API image input (already vision-capable). No extra API key.

**Difficulty:** 5/10.

---

## Part 8 — Group / Channel Posting

Not urgent. Two-line additions when ready:

```js
// /cast <text>  (Farcaster via Neynar app signer)
// /broadcast zao-updates <text>  (Telegram channel — ZOE must be added as admin)
```

Both gated behind ALLOWED_USER.

**Difficulty:** 4/10.

---

## Part 9 — Resilient Telegram Send

Wraps current `sendMessage`:

```js
async function sendMessageWithRetry(chatId, text, { maxRetries = 3, baseDelay = 200 } = {}) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(API + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (res.ok) return true;
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "1", 10);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 408) {
        emit({ source: "bot", event: "send_fail_perm", status: res.status });
        return false;  // unrecoverable
      }
    } catch (e) {
      emit({ source: "bot", event: "send_fail_transient", err: e.message.slice(0, 200) });
    }
    await sleep(baseDelay * Math.pow(2, attempt));
  }
  return false;
}
```

Also wrap `poll()` loop body in try/catch that logs + sleeps on error (current loop has try/catch but with 100ms fixed delay — no exponential backoff).

**Difficulty:** 2/10.

---

## Adoption Plan

### Today / Tomorrow (next session, ~2-3 hours)
| # | Task | Difficulty |
|---|------|------------|
| 1 | `events.mjs` helper + wire `bot.mjs` inbound/outbound + `random_tip.py` tip_sent | 3/10 |
| 2 | `sendMessageWithRetry` + `poll()` error handling | 2/10 |
| 3 | Cost parse from `claude -p --output-format json` into events.jsonl | 3/10 |
| 4 | `ALLOWED_USERS` env var + workspace path env var | 1/10 |

### This Week
| # | Task | Difficulty |
|---|------|------------|
| 5 | `log-digest.mjs` + 8pm cron + `/activity` slash | 5/10 |
| 6 | Watchdog alert on >3 respawns in 10 min + `/healthz` endpoints | 4/10 |
| 7 | `@zoey` / `@wallet` / `@rolo` dispatch + result polling | 6/10 |
| 8 | Voice message transcription via Claude audio | 6/10 |

### This Month
| # | Task | Difficulty |
|---|------|------------|
| 9 | Photo/document uploads via Claude vision | 5/10 |
| 10 | `/cast` (Neynar) + `/broadcast` (Telegram channel) | 4/10 |
| 11 | Per-project memory files (doc 447 #2) | 2/10 |
| 12 | ZOE context awareness — git/PR/tmux state injection (doc 447 #1) | 3/10 |

### This Quarter
| # | Task | Difficulty |
|---|------|------------|
| 13 | Move daily digests to Claude Routines (doc 422 + doc 460 Gap 2) | 6/10 |
| 14 | Single unified events.jsonl exported to Grafana Loki if scale demands | 7/10 |
| 15 | Mem0 upgrade from flat-JSON conv buffer (doc 245 P1) | 6/10 |

---

## Comparison: Observability architectures for a single-user VPS

| Option | Plumbing | Cost | Query UX | Verdict |
|--------|----------|------|----------|---------|
| **events.jsonl + jq scripts (proposed)** | ~200 lines | $0 | `jq` one-liners + daily digest | **SHIP** — right-sized |
| Supabase `agent_events` (current for VAULT/BANKER/DEALER) | already built | included | SQL via portal admin dash | USE ALREADY for on-chain agents; don't extend to ZOE |
| Grafana Loki + Promtail | Docker compose, ~2 hr setup | $0 self-hosted | rich UI | SKIP — overkill for 1 user |
| Grafana Cloud Free | API key + shipper | $0 up to 50GB/mo | rich UI | SKIP — free tier exhausts on multi-agent |
| OpenTelemetry + Honeycomb / Tempo | 1 day of wiring | free dev tier | trace waterfall | SKIP — no multi-service traces needed |
| Sentry | SDK install | free up to 5K events | error-focused | ADOPT only for Next.js (doc 453 P1 already proposes) — not for bot.mjs |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Telegram Bot API version | 8.3 (2026-04) |
| Claude Messages API audio input GA date | 2026-02 |
| Claude Haiku 4.5 audio cost | ~$1/1M input tokens |
| Voice msg typical cost per 10s note | ~$0.00005 |
| Current bot.mjs lines (post PR #254) | 675 |
| Lines added by this doc's proposed changes | ~550 (events.mjs, log-digest.mjs, dispatch, voice, retry) |
| Current ZOE daily Claude spend (no ANTHROPIC_API_KEY; no-LLM mode) | $0 |
| Budget cap per `claude -p` call | $2 USD |
| `setMyCommands` cap | 100 commands |
| Telegram callback_data max | 64 bytes |
| events.jsonl target rotation size | 50 MB |
| VPS swap used today | 1.1 GB / 4 GB |
| VPS disk used | 64 GB / 96 GB (67%) |
| VPS mem free | 1.7 GB / 7.8 GB (5.6 GB available with cache) |
| Watchdog respawn alert threshold (proposed) | 3 in 10 min |
| Dispatch rate limit (proposed) | 5/hour per agent |

---

## ZAO Ecosystem Integration

Files to change (in order of the adoption plan):

- NEW `infra/portal/bin/events.mjs` — emit() helper
- NEW `scripts/zoe-learning-pings/events.py` — Python mirror
- `infra/portal/bin/bot.mjs` — import events, emit on inbound/outbound/slash/claude_call, add sendMessageWithRetry, ALLOWED_USERS env var
- `infra/portal/bin/spawn-server.js` — emit on spawn-agent + sessions endpoint; add /healthz
- `infra/portal/bin/auth-server.js` — add /healthz
- `infra/portal/bin/session-watcher.mjs` — emit on shipped/timeout
- NEW `infra/portal/bin/log-digest.mjs` — daily digest + `/activity` handler
- NEW `infra/portal/bin/dispatch-watcher.mjs` — poll agent result dirs + post Telegram
- `infra/portal/bin/watchdog.sh` — reason + alert + health URLs
- `infra/portal/install.sh` — crontab entries for log-digest (20:00 ET = 00:00 UTC) + dispatch-watcher (every minute)

Related docs in library:
- Doc 234 — OpenClaw guide (agent dispatch syntax)
- Doc 236 — auto-dream nightly consolidation (Part 3 could add a nightly events -> consolidation)
- Doc 245 — ZOE upgrade (Mem0 stays deferred)
- Doc 256 — ZOE agent factory (enables `@<member>` dispatch eventually)
- Doc 289 — chat UX patterns (reactions, generative UI if we later build zoe.zaoos.com)
- Doc 435 — ZOE effectiveness playbook (overlaps with Part 3 digest)
- Doc 447 — 7-day sprint (overlaps with Parts 4, 6)
- Doc 454 — reliability hardening (this doc's direct predecessor)
- Doc 460 — agentic stack master (Part 4 implements Gap 3)
- Doc 463 — portal security audit (5-sink log gap this doc closes)
- Doc 464 — reply-context + ship-PR loop (shipped in #253/#254)

---

## Sources

- [Telegram Bot API — getFile + voice](https://core.telegram.org/bots/api#voice)
- [Telegram Bot API — retry_after](https://core.telegram.org/bots/api#responseparameters)
- [Anthropic Messages API — audio input](https://docs.claude.com/en/api/messages)
- [OpenClaw `agent` command](https://github.com/openclaw/openclaw#agent-dispatch)
- [Grafana Loki cost comparison](https://grafana.com/pricing/)
- ZAO internal: `infra/portal/bin/bot.mjs`, `infra/portal/bin/watchdog.sh`, `infra/portal/bin/spawn-server.js`, `scripts/zoe-learning-pings/random_tip.py`, `~/watchdog.log`, `~/zoe-bot/bot.log`

---

## Next Action

Recommended first slice (1-2 hours):

1. `events.mjs` + instrument bot.mjs inbound/outbound/slash handlers (Part 2, 3/10)
2. `sendMessageWithRetry` + poll-loop backoff (Part 9, 2/10)
3. ALLOWED_USERS env var (Part 1 recommendations, 1/10)

That kills the "silent Poll error" + "can't answer what ZOE did today" + "one-user hardcode" trio in a single PR. Daily digest + dispatch + voice come next — each as a standalone PR.
