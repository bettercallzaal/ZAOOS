#!/usr/bin/env node
// ZOE ship-fix session watcher.
//
// bot.mjs records every Ship-Fix spawn in ~/.cache/zoe-telegram/watched-sessions.json.
// Each entry: { sessionId, docNum, docPath, title, chatId, messageId, started_at, notified }.
// This watcher runs on a cron (every 2 min is plenty) and for each unnotified
// session either:
//   - finds a PR matching branch pattern ws/act-<doc-slug>-* and posts its URL to Telegram
//   - if >20 min elapsed and no PR, posts a timeout message
// then marks notified=true so we don't double-post.
//
// Kept intentionally simple — no dependencies, no daemon. Re-runs idempotently.

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = "https://api.telegram.org/bot" + BOT_TOKEN;
const WATCH_FILE = process.env.HOME + "/.cache/zoe-telegram/watched-sessions.json";
const REPO = "bettercallzaal/ZAOOS";
const MAX_WAIT_MS = 20 * 60_000;
const GH_BIN = process.env.GH_BIN || "/home/zaal/.local/bin/gh";

function log(msg) {
  console.log("[" + new Date().toISOString() + "] " + msg);
}

function loadWatch() {
  try { return JSON.parse(readFileSync(WATCH_FILE, "utf-8")); }
  catch { return { sessions: {} }; }
}

function saveWatch(state) {
  try { mkdirSync(process.env.HOME + "/.cache/zoe-telegram", { recursive: true }); } catch {}
  writeFileSync(WATCH_FILE, JSON.stringify(state, null, 2));
}

async function sendTelegram(chatId, text) {
  if (!BOT_TOKEN) { log("TELEGRAM_BOT_TOKEN missing; printing"); console.log(text); return; }
  if (!chatId) { log("no chat_id; printing"); console.log(text); return; }
  try {
    await fetch(API + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
  } catch (e) { log("send error: " + e.message); }
}

// Given a doc path like research/dev-workflows/157-cross-project-asset-audit/README.md,
// rebuild the branch slug bot.mjs/spawn-server.js uses:
//   slug = doc.replace(/[^a-z0-9]/gi, "-").slice(0, 40).toLowerCase()
//   branch = "ws/act-" + slug + "-MMDD-HHMM"
// We don't know the timestamp suffix, so we search gh for matching prefix.
function docSlug(docPath) {
  return String(docPath).replace(/[^a-z0-9]/gi, "-").slice(0, 40).toLowerCase();
}

function findPrForDoc(docPath) {
  const slug = docSlug(docPath);
  const prefix = "ws/act-" + slug;
  try {
    const out = execSync(
      GH_BIN + " pr list --repo " + REPO + " --state open --limit 20 " +
      "--json number,title,headRefName,url --search \"head:" + prefix + "\" 2>/dev/null || echo '[]'",
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
    const prs = JSON.parse(out || "[]");
    return prs.find((p) => (p.headRefName || "").startsWith(prefix)) || null;
  } catch (e) {
    log("gh pr list failed: " + e.message.slice(0, 160));
    return null;
  }
}

async function processSession(sessionId, meta) {
  const { docNum, docPath, title, chatId, started_at } = meta;
  const age = Date.now() - (started_at || 0);
  const pr = findPrForDoc(docPath);
  if (pr) {
    const msg = [
      "[SHIPPED] doc " + docNum + " -> PR #" + pr.number,
      title || "",
      pr.url || "",
    ].filter(Boolean).join("\n");
    await sendTelegram(chatId, msg);
    return { notified: true, result: "pr", pr: pr.number };
  }
  if (age > MAX_WAIT_MS) {
    await sendTelegram(
      chatId,
      "[SHIP FIX TIMEOUT] doc " + docNum + " (session " + sessionId + ") no PR after 20 min. " +
      "Check ~/.agent-orchestrator/ZAOOS/sessions/ on VPS."
    );
    return { notified: true, result: "timeout" };
  }
  return { notified: false };
}

async function main() {
  const state = loadWatch();
  const sessions = state.sessions || {};
  const sids = Object.keys(sessions);
  if (!sids.length) { log("no watched sessions"); return; }

  let changed = false;
  for (const sid of sids) {
    const meta = sessions[sid];
    if (meta.notified) continue;
    try {
      const res = await processSession(sid, meta);
      if (res.notified) {
        meta.notified = true;
        meta.result = res.result;
        if (res.pr) meta.pr = res.pr;
        changed = true;
      }
    } catch (e) { log("session " + sid + " error: " + e.message); }
  }

  // Prune notified sessions older than 24h.
  const cutoff = Date.now() - 86_400_000;
  for (const sid of sids) {
    const meta = sessions[sid];
    if (meta.notified && (meta.started_at || 0) < cutoff) {
      delete sessions[sid];
      changed = true;
    }
  }

  if (changed) saveWatch(state);
}

main().catch((e) => { log("fatal: " + e.message); process.exit(1); });
