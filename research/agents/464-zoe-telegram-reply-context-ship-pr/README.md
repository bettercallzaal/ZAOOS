# 464 — ZOE Telegram: Reply-Context Bug, Capability Matrix, Ship-PR Loop

> **Status:** Research complete
> **Date:** 2026-04-20
> **Goal:** Fix ZOE's "I didn't send that" reply bug, map every Telegram Bot API capability ZOE can adopt, and design a tip-to-PR shipping loop (Telegram → VPS Claude Code → branch + PR).
> **Builds on:** docs 234, 236, 245, 256, 289, 460, 463
> **Repro case (2026-04-20):** Zaal received `[ZOE TIP] 157 — Cross-Project Asset Audit` then asked ZOE "zoe tip 157 can u see that". ZOE replied "No file matching 'tip 157' or '157' exists in the repo." The file exists at `research/dev-workflows/157-cross-project-asset-audit/README.md`.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Root cause of "didn't send that" bug** | USE two fixes together: (a) make `bot.mjs` read `~/.cache/zoe-learning-pings/sent.json` on every turn and inject the last 7 days of tip titles + paths into the system prompt; (b) add a per-chat conversation buffer (`~/.cache/zoe-telegram/conv-<chatId>.json`, last 20 turns) so ZOE has short-term memory between messages. Right now each Claude Code invocation in `callClaude` is stateless. |
| **Tip lookup shortcut** | ADD `/tip <n>` slash command in `bot.mjs` that reads `sent.json` + falls back to `find research -name "<n>-*"`. Short-circuits the Claude call, saves ~$0.02 + 15 seconds per lookup. |
| **Ship-PR loop entry** | USE the already-built `/act` portal page + `handleSpawnAgent` in `spawn-server.js:205` as the canonical path. Add a Telegram inline button "SHIP FIX" alongside the existing `Read:` + `Act:` URLs so Zaal can trigger a PR directly from the tip. |
| **Telegram parse mode** | SWITCH `sendMessage` from plain text to `parse_mode: "MarkdownV2"` (or HTML) so `[ZOE TIP]` headers, tip paths, and PR links render as tap-targets. Current raw URL shipping is lowest-friction but highest-UX-ceiling cost. |
| **Inline keyboards** | ADD `reply_markup` with `inline_keyboard` to every tip. Buttons: `[Read] [Ship Fix] [Not Now] [Mute 24h]`. Wire `callback_query` handler in `bot.mjs` poll loop. |
| **Authorization scope** | HARDCODED `ALLOWED_USER = "1447437687"` stays. ADD per-action confirmation for `ship` (ZOE asks "confirm ship PR for doc X?" before spawning AO). |
| **Conversation memory store** | USE JSON per chat (not sqlite) — 20 turns, prune ≥7 days. Keeps the bot dependency-free. If it outgrows, upgrade to Mem0 per doc 245. |
| **Act button + Ship-Fix unification** | KEEP `/act` page (URL in Telegram) AND add inline button. The page gives form-based intent (review/expand/update/custom). The button defaults to `intent=review`. Both land at the same `handleSpawnAgent`. |
| **VPS Claude Code session for alignment** | SKIP a second live `claude` session on the VPS today. Instead: align via this doc + patch `bot.mjs` via PR, let the VPS auto-pull cron pick it up. Spawning a second interactive session doubles token burn without payoff. |
| **Expand ZOE scope beyond tips** | ADD 5 capability tracks (see Capability Matrix below): (1) PR shipping, (2) cast / content ops, (3) on-chain ops via WALLET, (4) contact + CRM via ROLO, (5) scheduling via Claude Routines. Don't ship all at once — order by effort/impact. |

---

## Part 1 — The "Didn't Send That" Bug: Root Cause + Patch

### Evidence

`infra/portal/bin/bot.mjs:238-277` (`callClaude`):
```js
const cmd = "echo '" + safeMsg + "' | claude -p --append-system-prompt-file " + tmpSys + " ...";
```

System prompt = `SOUL.md + USER.md + AGENTS.md + MEMORY.md` only. Zero conversation state. Zero awareness of what `random_tip.py` sent earlier.

`scripts/zoe-learning-pings/random_tip.py:316-322` writes to `~/.cache/zoe-learning-pings/sent.json`:
```json
{"path": "research/dev-workflows/157-cross-project-asset-audit/README.md",
 "title": "157 — Cross-Project Asset Audit: Reusable Code from Sibling ZAO Projects",
 "mode": "summary",
 "at": "2026-04-20T..."}
```

`bot.mjs` never reads this file.

### Patch (minimal, preserves dependency-free property)

Add to `bot.mjs`:

```js
const SENT_TIPS_FILE = process.env.HOME + "/.cache/zoe-learning-pings/sent.json";
const CONV_DIR = process.env.HOME + "/.cache/zoe-telegram";

function loadRecentTips(days = 7) {
  try {
    const s = JSON.parse(readFileSync(SENT_TIPS_FILE, "utf-8"));
    const cutoff = Date.now() - days * 86400000;
    return (s.sent || []).filter(t => new Date(t.at).getTime() > cutoff)
      .slice(-30)
      .map(t => `- ${t.title} (${t.path})`);
  } catch { return []; }
}

function loadConversation(chatId) {
  try {
    const f = `${CONV_DIR}/conv-${chatId}.json`;
    return JSON.parse(readFileSync(f, "utf-8")).turns || [];
  } catch { return []; }
}

function appendConversation(chatId, userMsg, botReply) {
  try { mkdirSync(CONV_DIR, { recursive: true }); } catch {}
  const f = `${CONV_DIR}/conv-${chatId}.json`;
  const prior = loadConversation(chatId);
  const turns = [...prior, { t: new Date().toISOString(), user: userMsg, bot: botReply.slice(0, 800) }]
    .slice(-20);
  writeFileSync(f, JSON.stringify({ turns }, null, 2));
}
```

Modify `loadSystemPrompt()` signature to `(chatId)` and append:

```js
const tips = loadRecentTips();
if (tips.length) {
  prompt += "\n\n---\n\nRECENT TIPS YOU SENT (last 7d):\n" + tips.join("\n") + "\n";
}
const conv = loadConversation(chatId);
if (conv.length) {
  prompt += "\n\n---\n\nRECENT CONVERSATION (last 20 turns):\n" +
    conv.map(t => `Zaal: ${t.user}\nZOE: ${t.bot}`).join("\n\n");
}
```

And in the poll loop (`bot.mjs:289-321`) call `appendConversation(chatId, msg.text, reply)` after `sendMessage`.

### Effort: 2/10 — ~30 lines of JS, one test message to confirm.

---

## Part 2 — Telegram Bot API Capability Matrix (2026)

Full list of what a bot can do today. Checked against the 2026-04 Bot API 8.3 spec.

| Capability | What it enables for ZOE | Current status | Difficulty to add |
|-----------|--------------------------|----------------|-------------------|
| `sendMessage` | Text replies | SHIPPED | — |
| `sendChatAction` | "typing..." indicator | SHIPPED | — |
| `getUpdates` long polling | Inbound messages | SHIPPED | — |
| `parse_mode` (MarkdownV2 / HTML) | Rich formatting (bold, links, code) | NOT USED | 2/10 |
| `reply_markup` inline keyboards | Tap-to-reply buttons under messages | NOT USED | 3/10 |
| `callback_query` handler | Receive button taps | NOT USED | 3/10 |
| `editMessageText` / `editMessageReplyMarkup` | Mutate a sent tip after the tap (e.g. "SHIPPING...") | NOT USED | 3/10 |
| Inline mode (`@zaoclaw_bot query`) | Search research from any chat | NOT USED | 4/10 |
| Web Apps (Mini Apps) | Full web UI inside Telegram (e.g. todos dashboard) | NOT USED | 7/10 |
| Webhook mode (replace polling) | Lower latency, no poll loop | NOT USED | 4/10 |
| `sendPhoto` / `sendDocument` / `sendVoice` | Ship images (PR screenshots), docs (digest PDF), voice notes | NOT USED | 2/10 |
| `sendPoll` | Quick polls to Zaal ("which PR first?") | NOT USED | 2/10 |
| Voice messages + speech-to-text | Zaal speaks to ZOE on walks | NOT USED | 6/10 (needs Whisper) |
| Commands menu (`setMyCommands`) | Blue "menu" button lists all slash commands | NOT USED | 1/10 |
| Forum / topics | Group threading — one chat with multiple topics | NOT USED | 5/10 |
| Reactions (`setMessageReaction`) | Thumbs-up on Zaal's message as ack | NOT USED | 1/10 |
| Payments (Stars / Telegram Pay) | Accept micropayments for premium features | NOT USED | 8/10 |
| Bot-to-Bot via Bot API + user's session | Coordinate with other bots (raidsharks, etc.) | NOT USED | 7/10 |
| Groups / channels posting | Broadcast to ZAO community | NOT USED | 4/10 |
| Scheduled messages (Telegram-side) | Not available via Bot API — use cron locally | N/A | — |
| File uploads from Zaal → ZOE | Zaal sends a screenshot, ZOE OCRs + responds | NOT USED | 5/10 |
| `forwardMessage` / `copyMessage` | Relay content between chats | NOT USED | 2/10 |
| Live location | N/A for ZOE | N/A | — |
| Passport / ID verification | N/A | N/A | — |

### Top-3 Telegram capabilities to add this week

1. **Inline keyboards on tips** — `[Read] [Ship Fix] [Not Now] [Mute 24h]`. Biggest UX jump.
2. **`parse_mode: "HTML"`** — URLs become actual hyperlinks, bold titles stand out. One-line change.
3. **`setMyCommands`** — populates Telegram's blue "menu" button so Zaal sees every slash command without typing `/help`.

---

## Part 3 — Ship-PR Loop Design

### Flow (goal state)

```
1. ZOE sends [ZOE TIP] with inline buttons
2. Zaal taps [Ship Fix]
3. bot.mjs receives callback_query with data="ship:<doc-path>"
4. bot.mjs POSTs to http://127.0.0.1:<portal-port>/api/spawn-agent
   with { doc, title, intent: "review" }
5. spawn-server.js:handleSpawnAgent builds agent prompt + delegates to handleSpawn
6. ao spawn --prompt "<agentPrompt>" runs in detached Claude Code session
7. Claude Code reads doc, makes targeted edits, creates ws/act-<slug>-<ts> branch
8. git push + gh pr create
9. spawn-server returns { sessionId } (or 202 if >8s)
10. bot.mjs edits the original Telegram message:
    "[SHIPPING] session <id> started — will reply with PR link when ready"
11. Session watcher (poll ~/.agent-orchestrator/ZAOOS/sessions/<id>/result.json)
    picks up PR URL, bot.mjs sends follow-up: "PR #<n> ready — <url>"
```

### Patch set (in order)

| # | Change | File | Effort |
|---|--------|------|--------|
| 1 | Inject `sent.json` tips + conversation into system prompt | `bot.mjs` | 2/10 |
| 2 | `/tip <n>` slash command | `bot.mjs` | 1/10 |
| 3 | Inline keyboard on every tip sent | `scripts/zoe-learning-pings/random_tip.py` | 3/10 |
| 4 | `callback_query` handler in poll loop | `bot.mjs` | 3/10 |
| 5 | Internal POST to `localhost:3000/api/spawn-agent` on `ship:` callback | `bot.mjs` | 2/10 |
| 6 | Session watcher → PR-link follow-up | new file `infra/portal/bin/session-watcher.mjs` + cron | 5/10 |
| 7 | `editMessageText` to reflect SHIPPING → SHIPPED | `bot.mjs` | 2/10 |
| 8 | `setMyCommands` to expose all slash commands in menu | one-shot script | 1/10 |

Total: ~1 day of work, mostly in `bot.mjs` which is already the right layer.

### Security constraints (per doc 463)

- `handleSpawnAgent` ALREADY validates doc path regex + wraps user context as data. Keep that contract.
- Callback data from Telegram is untrusted — re-validate `doc` against `/^[a-z0-9][a-z0-9/_.-]*\.md$/i` before POST.
- Re-check `ALLOWED_USER` inside the `callback_query` branch (users can't inject callbacks, but belt + braces).
- Rate-limit: max 3 ship-fix spawns per hour (store in `~/.cache/zoe-telegram/ship-rate.json`).

---

## Part 4 — Expanding ZOE Beyond Tips

Current ZOE = tip-sender + chat responder. Gaps mapped to the 4 capability tracks below.

### Track A — PR / Code Ops (THIS WEEK)
- Ship-Fix button (Part 3)
- `/pr <number>` summary command
- `/ci` status digest

### Track B — Cast / Content Ops (NEXT WEEK)
- `/cast <text>` → Neynar API cast as app FID 19640
- `/digest` → latest newsletter draft via `scripts/ZAO OS V1/...` (TODO: find script)
- Farcaster mention webhook → Telegram relay (per doc 245 Upgrade 3)

### Track C — On-Chain Ops via WALLET (NEXT 2 WEEKS)
- `/balance` → wallet balance across ZABAL/ETH/USDC on Base
- `/stake <amount>` → routes to WALLET dispatch per doc 460 Flow 2
- `/swap <from> <to> <amount>` → same

### Track D — Contact + CRM via ROLO (THIS MONTH)
- `/contact <name>` → ROLO lookup
- Incoming email via Composio triggers ZOE digest to Telegram
- `/introduce <a> <b>` → ROLO drafts intro message

### Track E — Scheduling via Claude Routines (THIS QUARTER)
- Move morning brief to a Claude Routine (doc 422)
- Move evening reflect to a Routine
- Keep ZOE learning pings on VPS cron (file-local state needs local FS)

---

## Part 5 — What the VPS Claude Code Session WOULD Do

User asked for a parallel VPS session. Here's why that's not needed THIS turn, and what it WOULD do if started:

### Why not this turn
- The root cause is code in `bot.mjs` and `random_tip.py`. Both are in this repo. Editing here + PR + VPS auto-pull (cron every 15 min per doc 460) deploys the fix.
- A second Claude Code session on VPS via `/vps` skill doubles token burn for zero additional information. The code is here, the decision is made.
- The VPS would duplicate this research doc, write the same patches, then collide with the Mac session's PR.

### What it WOULD do (if still wanted)
- Validate the current deployed `bot.mjs` on VPS matches git (drift check)
- Check `~/.cache/zoe-learning-pings/sent.json` exists + has real entries
- Tail `journalctl -u zoe-bot` (or wherever the bot runs) to see live behaviour
- Confirm `~/.agent-orchestrator/ZAOOS/sessions/` is populating

### Better path
Run a one-shot `/vps` skill invocation from THIS session to do those checks remotely, instead of a persistent parallel session. See "This Week's Action Plan" below.

---

## Part 6 — Action Plan

### Today (2026-04-20)
| # | Task | Owner | Difficulty |
|---|------|-------|------------|
| 1 | Open PR with `bot.mjs` patch + `random_tip.py` inline-keyboard change | Claude Code on Mac | 3/10 |
| 2 | Run `/vps` skill to verify `sent.json` exists + bot process is healthy | Claude Code | 2/10 |
| 3 | Activate ZOE learning pings (paste Anthropic key, enable cron — per doc 460 Week #1) | Zaal | 1/10 |

### This Week
| # | Task | Difficulty |
|---|------|------------|
| 4 | Add callback_query handler + Ship-Fix round-trip | 4/10 |
| 5 | Add `setMyCommands` + `parse_mode: "HTML"` | 2/10 |
| 6 | Session watcher cron for PR-link follow-up | 5/10 |
| 7 | Rate limiter on ship-fix spawns | 2/10 |

### This Month
| # | Task | Difficulty |
|---|------|------------|
| 8 | `/cast`, `/pr`, `/ci` slash commands (Track A + B) | 5/10 |
| 9 | Neynar webhook → Telegram relay (doc 245 Upgrade 3) | 5/10 |
| 10 | Migrate morning-brief and evening-reflect to Claude Routines | 6/10 |

---

## Comparison: ZOE reply-context strategies

| Option | Memory depth | Cost/mo | Plumbing effort | Verdict |
|--------|--------------|---------|-----------------|---------|
| **No memory (today)** | 0 turns | $0 | — | BROKEN — caused 2026-04-20 bug |
| **Flat JSON (proposed)** | 20 turns + 7d tips | $0 | 2/10 | **SHIP FIRST** — fixes bug in 30 lines |
| **SQLite turn log** | Unbounded + queryable | $0 | 5/10 | Overkill until Mem0 proves insufficient |
| **Mem0 (per doc 245)** | Semantic, self-organizing | ~$5 | 6/10 | SHIP AFTER flat JSON works 2+ weeks |
| **Zep / Graphiti** | Graph with relationships | ~$20 | 8/10 | SKIP — higher token footprint (600K+ vs Mem0's 1,764) |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Lines of JS needed for Part 1 patch | ~30 |
| Claude Code call cost per inbound Telegram message today | $0.01-0.05 (Opus, cap $2/call) |
| Expected conv-buffer file size after 1 week | <500 KB per chat (20 turns, 800 chars each) |
| Tips cooldown window | 7 days (per `random_tip.py:56`) |
| Telegram Bot API version as of 2026-04 | 8.3 |
| Callback data max size | 64 bytes — must shorten doc path in `callback_data` (use hash or index) |
| `handleSpawnAgent` body cap | 600 chars extra context (`spawn-server.js:210`) |
| AO spawn 8-second timeout before 202 accepted | `spawn-server.js:320` |
| `ALLOWED_USER` Telegram ID | `1447437687` (Zaal) |
| Ship-fix spawn rate limit (proposed) | 3/hour |
| bot.mjs max reply budget | $2 USD per call (`--max-budget-usd 2`) |
| Telegram message char cap | 4096 (bot.mjs chunks at 4000) |

---

## ZAO Ecosystem Integration

Files to modify:
- `/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/bot.mjs` — all Part 1 + Part 3 patches
- `/Users/zaalpanthaki/Documents/ZAO OS V1/scripts/zoe-learning-pings/random_tip.py` — inline keyboard + shorter callback payload
- `/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/spawn-server.js` — accept callback-shaped payload (optional, Part 3 Patch 5)
- New: `/Users/zaalpanthaki/Documents/ZAO OS V1/infra/portal/bin/session-watcher.mjs` — Part 3 Patch 6

Paths on VPS (referenced, not edited from here):
- `/home/zaal/openclaw-workspace/` — SOUL/USER/AGENTS/MEMORY
- `/home/zaal/.cache/zoe-learning-pings/sent.json` — tips ledger (already written)
- `/home/zaal/.cache/zoe-telegram/conv-<chatId>.json` — NEW, conversation buffer
- `/home/zaal/.agent-orchestrator/ZAOOS/sessions/` — AO session outputs

Related docs in library:
- Doc 234 — OpenClaw comprehensive guide
- Doc 236 — autonomous OpenClaw operator pattern
- Doc 245 — ZOE upgrade (Mem0, Telegram inline, Neynar webhook)
- Doc 256 — ZOE agent factory vision
- Doc 289 — chat-based command center UX patterns
- Doc 460 — end-to-end agentic stack design
- Doc 463 — portal + AO security audit (safe spawn contract)

---

## Sources

- [Telegram Bot API 2026 changelog](https://core.telegram.org/bots/api)
- [Telegram Bot API — InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
- [Telegram Bot API — callback_query](https://core.telegram.org/bots/api#callbackquery)
- [Telegram Bot API — setMyCommands](https://core.telegram.org/bots/api#setmycommands)
- [Mem0 GitHub (per doc 245)](https://github.com/mem0ai/mem0)
- ZAO internal: `infra/portal/bin/bot.mjs`, `scripts/zoe-learning-pings/random_tip.py`, `infra/portal/bin/spawn-server.js`

---

## Next Action

Pick one — both in scope today:

- **A (ship the fix, 30 min):** Branch off main, patch `bot.mjs` per Part 1, open PR. VPS auto-pull + bot restart clears the "I didn't send that" bug.
- **B (verify VPS state, 5 min via `/vps`):** Run remote checks on `sent.json`, bot process, session dir — confirms diagnosis before the patch.

Recommended: B → A in one session. Don't open a second live Claude Code session on VPS; no new information to be had there.
