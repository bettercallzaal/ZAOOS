// Shared Telegram primitives for every bot in the ZAO fleet.
//
// Scope (Phase 1, intentionally small): low-level outbound + authorization
// helpers that every bot needs in exactly the same way. Each bot still owns
// its OWN poll loop, slash handler, callback handler, and system-prompt
// builder — those are where bot personality lives and should NOT be shared.
//
// Design goals:
// - Every function takes a Telegram API URL as first arg so one bot process
//   can hold state for multiple tokens if that ever becomes useful.
// - Every outbound path emits a structured event to ~/zoe-bot/events.jsonl
//   via events.mjs so "silent drop" failures remain impossible.
// - No I/O to disk from here (conversation buffers and persona files live
//   per-bot).

import { emit } from "../../events.mjs";

export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function makeApiUrl(botToken) {
  if (!botToken) throw new Error("makeApiUrl: missing botToken");
  return "https://api.telegram.org/bot" + botToken;
}

// ALLOWED_USERS is an array of Telegram user IDs, strings. Returns a closure
// so bots can inject their own allowlist without leaking globals.
export function makeIsAllowed(allowedUsers) {
  const list = (allowedUsers || []).map(String);
  return function isAllowed(userId) {
    return list.includes(String(userId));
  };
}

// Exponential backoff send with Retry-After handling. Drops only on
// unrecoverable 4xx (except 408). Emits a structured event on every
// failure so silent drops become visible. Returns true on success.
export async function sendMessageChunk(api, chatId, chunk, opts = {}) {
  const { maxRetries = 3, baseDelay = 200, botName = "bot" } = opts;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(api + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: chunk }),
      });
      if (res.ok) return true;
      if (res.status === 429) {
        const ra = parseInt(res.headers.get("retry-after") || "1", 10) || 1;
        emit({ source: botName, event: "send_rate_limited", status: 429, retry_after: ra, attempt });
        await sleep(ra * 1000);
        continue;
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 408) {
        emit({ source: botName, event: "send_fail_perm", status: res.status, attempt });
        return false;
      }
      emit({ source: botName, event: "send_fail_transient", status: res.status, attempt });
    } catch (e) {
      emit({ source: botName, event: "send_fail_transient", err: String(e.message || e).slice(0, 200), attempt });
    }
    await sleep(baseDelay * Math.pow(2, attempt));
  }
  emit({ source: botName, event: "send_fail_exhausted", chat_id: chatId, chunk_bytes: chunk.length });
  return false;
}

// Chunks a long message at 4000 chars (Telegram cap is 4096) preferring newline
// breaks. Emits one outbound event per logical message with a trace_id if provided.
export async function sendMessage(api, chatId, text, trace_id, opts = {}) {
  const { botName = "bot" } = opts;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4000) { chunks.push(remaining); break; }
    let splitAt = remaining.lastIndexOf("\n", 4000);
    if (splitAt < 2000) splitAt = 4000;
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt);
  }
  let allOk = true;
  for (const chunk of chunks) {
    const ok = await sendMessageChunk(api, chatId, chunk, { botName });
    if (!ok) allOk = false;
  }
  emit({ source: botName, event: "outbound", chat_id: chatId, bytes: text.length, chunks: chunks.length, ok: allOk, trace_id });
  return allOk;
}

// Fire-and-forget typing indicator. Never awaits, never emits (too noisy).
export function sendTyping(api, chatId) {
  fetch(api + "/sendChatAction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(function () {});
}

// Ack a tapped inline keyboard button. Always best-effort.
export async function answerCallback(api, callbackId, text) {
  try {
    await fetch(api + "/answerCallbackQuery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackId,
        text: String(text || "").slice(0, 200),
        show_alert: false,
      }),
    });
  } catch (e) { console.error("answerCallback error:", e.message); }
}

// Mutate a previously-sent message (e.g. flipping [PENDING] -> [SHIPPED]).
// Telegram enforces a 48h edit window.
export async function editMessageText(api, chatId, messageId, newText) {
  try {
    await fetch(api + "/editMessageText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        disable_web_page_preview: true,
      }),
    });
  } catch (e) { console.error("editMessageText error:", e.message); }
}

// Publish the slash-command list so Telegram's blue "menu" button surfaces
// every command without users typing /help. Idempotent; safe on every boot.
// `commands` is an array of { command, description } objects.
export async function publishCommands(api, commands) {
  try {
    await fetch(api + "/setMyCommands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    });
  } catch (e) { console.error("setMyCommands error:", e.message); }
}

// Poll-loop helper: long-polls getUpdates with backoff on failure. Caller
// provides onUpdate(update) which returns a promise. Loop is an infinite
// setTimeout chain so one failure doesn't kill the bot; failures emit
// poll_fail events and widen the delay up to 30s.
export function startPollLoop(api, { onUpdate, botName = "bot", allowedUpdates = ["message", "callback_query"] } = {}) {
  if (typeof onUpdate !== "function") throw new Error("startPollLoop: onUpdate required");
  const allowed = encodeURIComponent(JSON.stringify(allowedUpdates));
  let pollErrorCount = 0;
  let offset = 0;

  async function tick() {
    let nextDelay = 100;
    try {
      const res = await fetch(api + "/getUpdates?offset=" + offset + "&timeout=30&allowed_updates=" + allowed);
      const data = await res.json();
      pollErrorCount = 0;
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          try { await onUpdate(update); }
          catch (e) { emit({ source: botName, event: "on_update_error", err: String(e.message || e).slice(0, 200) }); }
        }
      }
    } catch (err) {
      pollErrorCount += 1;
      const errMsg = String(err.message || err).slice(0, 200);
      emit({ source: botName, event: "poll_fail", err: errMsg, error_count: pollErrorCount });
      console.error(botName + " poll error:", errMsg, "(count=" + pollErrorCount + ")");
      nextDelay = Math.min(500 * Math.pow(2, Math.min(pollErrorCount - 1, 6)), 30000);
    }
    setTimeout(tick, nextDelay);
  }

  tick();
}

// Clear webhook (so getUpdates works) — call once on boot.
export async function clearWebhook(api) {
  try { await fetch(api + "/deleteWebhook"); }
  catch (e) { console.error("deleteWebhook error:", e.message); }
}
