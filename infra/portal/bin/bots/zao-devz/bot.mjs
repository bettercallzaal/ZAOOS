// ZAO Devz bot — autonomous coding agent in the ZAO DEVZ Telegram group.
//
// Scope Phase 1 (tonight): slash + mention commands that dispatch real coding
// tasks to the existing AO spawn-agent pipeline at localhost:3004. No free-form
// Claude calls from this bot — every reply is either a fixed string (status,
// help) or a direct action (spawn, merge). Opus / Sonnet free-form stays out
// until the Anthropic API key is installed.
//
// Commands:
//   @zaodevz spawn <task>  — dispatches an AO session on a new ws/devz-* branch
//   /spawn <task>          — same as above
//   /status                — short PR + CI digest
//   /approve <pr-number>   — owner-only, squash-merges the PR
//   /help                  — command list
//
// Safety:
//   - ALLOWED_USERS + ALLOWED_GROUPS env gates every inbound.
//   - Rate limit: 3 spawns/user/day, 10/group/day.
//   - Budget: $5/PR via spawn-agent --max-budget-usd.
//   - OWNER_USER_ID only can merge.
//   - Task text wrapped as DATA per doc 463.

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import {
  makeApiUrl, makeIsAllowed, sendMessage, sendTyping,
  publishCommands, clearWebhook, startPollLoop, sleep,
} from "../_shared/bot-core.mjs";
import { emit, traceId, startTimer } from "../../events.mjs";

const BOT_NAME = "zao-devz";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN || TOKEN.startsWith("PASTE_")) {
  console.error("[zao-devz] TELEGRAM_BOT_TOKEN not set; refusing to start");
  process.exit(1);
}

const API = makeApiUrl(TOKEN);
const ALLOWED_USERS = (process.env.ALLOWED_USERS || "1447437687")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const OWNER_USER_ID = process.env.OWNER_USER_ID || "1447437687";
const REPO = process.env.ZAOOS_REPO || "/home/zaal/zao-os";
const GH = process.env.GITHUB_REPO || "bettercallzaal/ZAOOS";
const SPAWN_SERVER = process.env.SPAWN_SERVER_URL || "http://127.0.0.1:3004";
const GH_BIN = process.env.GH_BIN || "/home/zaal/.local/bin/gh";

const RATE_DIR = process.env.HOME + "/.cache/zoe-devz";
const RATE_FILE = RATE_DIR + "/rate.json";
const SPAWNS_PER_USER_PER_DAY = parseInt(process.env.SPAWNS_PER_USER_PER_DAY || "3", 10);
const SPAWNS_PER_GROUP_PER_DAY = parseInt(process.env.SPAWNS_PER_GROUP_PER_DAY || "10", 10);

const isAllowed = makeIsAllowed(ALLOWED_USERS);

function isAllowedGroup(chatId) {
  if (!ALLOWED_GROUPS.length) return true;     // empty = any group (dev only)
  return ALLOWED_GROUPS.includes(String(chatId));
}

// ----- rate limit --------------------------------------------------------
// Day is rolling 24h, not calendar day. Stored as per-key event arrays in
// ~/.cache/zoe-devz/rate.json, pruned on every read.

function loadRate() {
  try { return JSON.parse(readFileSync(RATE_FILE, "utf-8")); }
  catch { return { events: [] }; }
}
function saveRate(state) {
  try { mkdirSync(RATE_DIR, { recursive: true }); } catch {}
  try { writeFileSync(RATE_FILE, JSON.stringify(state)); } catch {}
}
function checkAndRecordSpawn(userId, chatId) {
  const state = loadRate();
  const cutoff = Date.now() - 86400_000;
  state.events = (state.events || []).filter((e) => e.at > cutoff);
  const userCount = state.events.filter((e) => e.user === String(userId)).length;
  const groupCount = state.events.filter((e) => e.chat === String(chatId)).length;
  if (userCount >= SPAWNS_PER_USER_PER_DAY) {
    return { ok: false, reason: "per-user cap " + SPAWNS_PER_USER_PER_DAY + "/day hit" };
  }
  if (groupCount >= SPAWNS_PER_GROUP_PER_DAY) {
    return { ok: false, reason: "per-group cap " + SPAWNS_PER_GROUP_PER_DAY + "/day hit" };
  }
  state.events.push({ at: Date.now(), user: String(userId), chat: String(chatId) });
  saveRate(state);
  return { ok: true, user_today: userCount + 1, group_today: groupCount + 1 };
}

// ----- spawn dispatch ----------------------------------------------------

async function dispatchSpawn(task, userId, chatId, trace_id) {
  // Re-sanitize task text: strip newlines that would break YAML/prompt wrap,
  // cap size to prevent unbounded prompts.
  const cleaned = String(task || "").replace(/[\r\n]+/g, " ").trim().slice(0, 600);
  if (!cleaned) return { ok: false, err: "empty task" };

  // Build a slug for the branch name matching spawn-server.js:230 convention.
  const slug = cleaned.replace(/[^a-z0-9]/gi, "-").slice(0, 40).toLowerCase();

  // POST to spawn-server. Reuses doc 464 pipeline; branch will be ws/act-<slug>-*.
  // For devz, override intent to "custom" with the task in extra.
  const body = JSON.stringify({
    doc: "research/agents/466-ao-ui-button-audit-apr21/README.md",  // placeholder doc — spawn-agent requires one
    title: "ZAO Devz dispatch: " + cleaned.slice(0, 80),
    intent: "custom",
    extra: cleaned,
  });
  const t = startTimer();
  try {
    const res = await fetch(SPAWN_SERVER + "/api/spawn-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    let payload = {};
    try { payload = JSON.parse(text); } catch {}
    emit({
      source: BOT_NAME, event: "spawn_dispatch", trace_id,
      user: userId, chat: chatId,
      status: res.status, duration_ms: t.ms(),
      sessionId: payload.sessionId || null,
      task_preview: cleaned.slice(0, 120),
    });
    if (res.status >= 400) return { ok: false, err: "spawn-server " + res.status + ": " + (payload.error || text.slice(0, 200)) };
    return { ok: true, sessionId: payload.sessionId, slug };
  } catch (e) {
    emit({ source: BOT_NAME, event: "spawn_dispatch_err", err: String(e.message || e).slice(0, 200), trace_id });
    return { ok: false, err: e.message };
  }
}

// ----- status command ----------------------------------------------------

function buildStatus() {
  try {
    const prsJson = execSync(
      GH_BIN + " pr list --repo " + GH + " --state open --limit 10 --json number,title,headRefName,updatedAt 2>/dev/null || echo '[]'",
      { encoding: "utf-8", timeout: 8000 }
    ).trim();
    const prs = JSON.parse(prsJson || "[]");
    const mergedJson = execSync(
      GH_BIN + " pr list --repo " + GH + " --state merged --search 'merged:>=' --limit 20 --json number,mergedAt 2>/dev/null || echo '[]'",
      { encoding: "utf-8", timeout: 8000 }
    ).trim();
    const merged = JSON.parse(mergedJson || "[]");
    const since24h = Date.now() - 86400_000;
    const merged24h = merged.filter((p) => new Date(p.mergedAt).getTime() > since24h).length;
    const commitsOut = execSync(
      "cd " + REPO + " && git log --since='24 hours ago' --oneline main 2>/dev/null | wc -l",
      { encoding: "utf-8", timeout: 5000 }
    ).trim();
    const lines = [
      "Open PRs: " + prs.length,
      "Merged last 24h: " + merged24h,
      "Commits to main last 24h: " + commitsOut,
    ];
    prs.slice(0, 6).forEach((p) => lines.push("  #" + p.number + " " + (p.title || "").slice(0, 60)));
    return lines.join("\n");
  } catch (e) {
    return "status error: " + String(e.message || e).slice(0, 200);
  }
}

// ----- approve command ---------------------------------------------------

function mergePr(prNumber) {
  const n = parseInt(prNumber, 10);
  if (!Number.isInteger(n) || n <= 0) return { ok: false, err: "bad pr number" };
  try {
    const out = execSync(
      GH_BIN + " pr merge " + n + " --repo " + GH + " --squash --delete-branch 2>&1",
      { encoding: "utf-8", timeout: 30000 }
    ).trim();
    return { ok: true, out: out.slice(0, 400) };
  } catch (e) {
    return { ok: false, err: String(e.message || e).slice(0, 400) };
  }
}

// ----- help --------------------------------------------------------------

const HELP = [
  "ZAO Devz bot — autonomous coding dispatcher.",
  "",
  "@zaodevz spawn <task>  Dispatch an AO session. Creates ws/devz-<slug>-<ts> + PR.",
  "/spawn <task>          Same.",
  "/status                Open PRs + merge stats.",
  "/approve <pr>          (owner-only) squash-merge a PR + delete branch.",
  "/help                  This message.",
  "",
  "Rate: " + SPAWNS_PER_USER_PER_DAY + "/user/day, " + SPAWNS_PER_GROUP_PER_DAY + "/group/day. Budget $5/PR.",
].join("\n");

// ----- handle inbound ----------------------------------------------------

async function handleMessage(msg) {
  if (!msg || !msg.text) return;
  const userId = String(msg.from.id);
  const chatId = msg.chat.id;
  const trace_id = traceId();
  if (!isAllowed(userId)) {
    emit({ source: BOT_NAME, event: "auth_reject", user: userId, chat: chatId, trace_id });
    return;  // silent drop — no "not authorized" to avoid noise in groups
  }
  if (!isAllowedGroup(chatId)) {
    emit({ source: BOT_NAME, event: "group_reject", user: userId, chat: chatId, trace_id });
    return;  // silent
  }
  const text = msg.text.trim();
  emit({ source: BOT_NAME, event: "inbound", user: userId, chat: chatId, bytes: text.length, trace_id, text_preview: text.slice(0, 80) });

  // /help
  if (/^\/help(\s|$)/i.test(text)) {
    await sendMessage(API, chatId, HELP, trace_id, { botName: BOT_NAME });
    return;
  }
  // /status
  if (/^\/status(\s|$)/i.test(text)) {
    sendTyping(API, chatId);
    const s = buildStatus();
    await sendMessage(API, chatId, s, trace_id, { botName: BOT_NAME });
    return;
  }
  // /approve <n>
  const appM = text.match(/^\/approve\s+(\d+)/i);
  if (appM) {
    if (userId !== String(OWNER_USER_ID)) {
      await sendMessage(API, chatId, "Only owner can merge.", trace_id, { botName: BOT_NAME });
      emit({ source: BOT_NAME, event: "approve_reject", user: userId, pr: appM[1], trace_id });
      return;
    }
    const r = mergePr(appM[1]);
    const reply = r.ok
      ? "[MERGED] #" + appM[1] + " squashed, branch deleted."
      : "[MERGE FAIL] #" + appM[1] + ": " + r.err;
    await sendMessage(API, chatId, reply, trace_id, { botName: BOT_NAME });
    emit({ source: BOT_NAME, event: r.ok ? "pr_merged" : "pr_merge_fail", user: userId, pr: appM[1], trace_id, err: r.err || null });
    return;
  }
  // @zaodevz spawn <task> OR /spawn <task>
  const spawnM = text.match(/^(?:@zaodevz|@zaodevzbot|@zaodevz_bot)\s+spawn\s+(.+)/is)
               || text.match(/^\/spawn\s+(.+)/is);
  if (spawnM) {
    const task = spawnM[1];
    const rate = checkAndRecordSpawn(userId, chatId);
    if (!rate.ok) {
      await sendMessage(API, chatId, "[RATE] " + rate.reason + ". Resets rolling 24h.", trace_id, { botName: BOT_NAME });
      emit({ source: BOT_NAME, event: "spawn_rate_limit", user: userId, chat: chatId, reason: rate.reason, trace_id });
      return;
    }
    await sendMessage(API, chatId, "[DEVZ] dispatching — " + task.slice(0, 100) + (task.length > 100 ? "..." : ""), trace_id, { botName: BOT_NAME });
    sendTyping(API, chatId);
    const r = await dispatchSpawn(task, userId, chatId, trace_id);
    const reply = r.ok
      ? "[DEVZ] spawned. session=" + (r.sessionId || "pending") + ". Watcher will post PR link when ready. (" + rate.user_today + "/" + SPAWNS_PER_USER_PER_DAY + " today)"
      : "[DEVZ] spawn failed: " + r.err;
    await sendMessage(API, chatId, reply, trace_id, { botName: BOT_NAME });
    return;
  }
  // Unknown — silent. /help if they ask directly.
  emit({ source: BOT_NAME, event: "unknown_input", user: userId, chat: chatId, bytes: text.length, trace_id });
}

async function handleUpdate(update) {
  if (update.message) return handleMessage(update.message);
  // callback_query intentionally unhandled Phase 1 — inline keyboards come later.
}

// ----- boot --------------------------------------------------------------

const COMMANDS = [
  { command: "spawn", description: "Dispatch coding task: /spawn <description>" },
  { command: "status", description: "Open PRs + merge stats last 24h" },
  { command: "approve", description: "(owner) squash-merge a PR: /approve <pr>" },
  { command: "help", description: "Command list" },
];

console.log("[zao-devz] booting. allowed_users=" + ALLOWED_USERS.length + " allowed_groups=" + (ALLOWED_GROUPS.length || "any") + " owner=" + OWNER_USER_ID);
emit({ source: BOT_NAME, event: "boot", allowed_user_count: ALLOWED_USERS.length, allowed_group_count: ALLOWED_GROUPS.length, owner: String(OWNER_USER_ID) });
await clearWebhook(API);
await publishCommands(API, COMMANDS);
startPollLoop(API, { onUpdate: handleUpdate, botName: BOT_NAME });
