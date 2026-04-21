import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync, writeFileSync, unlinkSync } from "fs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USER = "1447437687";
const WORKSPACE = "/home/zaal/openclaw-workspace";
const REPO = WORKSPACE + "/ZAOOS";
const API = "https://api.telegram.org/bot" + BOT_TOKEN;
const TODOS_FILE = "/home/zaal/portal-state/todos.json";
const CHECKLIST_FILE = "/home/zaal/test-checklist/state.json";
// ZOE's own recent outbound tips (written by scripts/zoe-learning-pings/random_tip.py).
// Reading this lets ZOE answer "zoe tip 157 can u see that" without claiming the
// doc doesn't exist. Root cause of the 2026-04-20 bug logged in doc 464.
const SENT_TIPS_FILE = process.env.HOME + "/.cache/zoe-learning-pings/sent.json";
const CONV_DIR = process.env.HOME + "/.cache/zoe-telegram";
const CONV_TURN_LIMIT = 20;
const TIP_CONTEXT_DAYS = 7;

function readTodos() {
  try { return JSON.parse(readFileSync(TODOS_FILE, "utf-8")); }
  catch { return { todos: [] }; }
}

function loadRecentTips(days = TIP_CONTEXT_DAYS) {
  try {
    const s = JSON.parse(readFileSync(SENT_TIPS_FILE, "utf-8"));
    const cutoffMs = Date.now() - days * 86400000;
    return (s.sent || [])
      .filter((t) => {
        const at = new Date(t.at || 0).getTime();
        return Number.isFinite(at) && at >= cutoffMs;
      })
      .slice(-30);
  } catch { return []; }
}

function loadConversation(chatId) {
  try {
    const f = CONV_DIR + "/conv-" + chatId + ".json";
    const parsed = JSON.parse(readFileSync(f, "utf-8"));
    return Array.isArray(parsed.turns) ? parsed.turns : [];
  } catch { return []; }
}

function appendConversation(chatId, userMsg, botReply) {
  try { mkdirSync(CONV_DIR, { recursive: true }); } catch {}
  const f = CONV_DIR + "/conv-" + chatId + ".json";
  const prior = loadConversation(chatId);
  const turns = prior.concat([{
    t: new Date().toISOString(),
    user: String(userMsg || "").slice(0, 2000),
    bot: String(botReply || "").slice(0, 800),
  }]).slice(-CONV_TURN_LIMIT);
  try { writeFileSync(f, JSON.stringify({ turns }, null, 2)); }
  catch (e) { console.error("Conv write error:", e.message); }
}

// Local fallback when sent.json hasn't caught this tip yet (e.g. Zaal asks
// about tip 292 hours after it arrived and cache was pruned). Scans the repo
// for a folder matching `<n>-*` under research/.
function findDocByNumber(n) {
  const num = String(n).replace(/[^0-9]/g, "");
  if (!num) return null;
  const base = REPO + "/research";
  try {
    for (const topic of readdirSync(base, { withFileTypes: true })) {
      if (!topic.isDirectory()) continue;
      const topicPath = base + "/" + topic.name;
      let entries;
      try { entries = readdirSync(topicPath, { withFileTypes: true }); }
      catch { continue; }
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (e.name.startsWith(num + "-") || e.name === num) {
          return "research/" + topic.name + "/" + e.name + "/README.md";
        }
      }
    }
  } catch {}
  return null;
}
function writeTodos(s) {
  try { mkdirSync("/home/zaal/portal-state", { recursive: true }); } catch {}
  writeFileSync(TODOS_FILE, JSON.stringify(s, null, 2));
}
function newId() { return Math.random().toString(16).slice(2, 14); }
function parsePriority(text) {
  const m = text.match(/\b(P[0-3])\b/i);
  return m ? m[1].toUpperCase() : "P2";
}
function parseProject(text) {
  const m = text.match(/\+([A-Za-z][A-Za-z0-9_-]{0,39})/);
  return m ? m[1] : "";
}
function parseTags(text) {
  const tags = [];
  for (const m of text.matchAll(/#([a-z0-9][a-z0-9_-]{0,20})/gi)) {
    tags.push(m[1].toLowerCase());
  }
  return tags;
}

async function handleTodoCommand(text) {
  const trim = text.trim();
  // /todo <text> - add
  const addM = trim.match(/^\/(?:todo|add)\s+(.+)/is);
  if (addM) {
    const rest = addM[1];
    const priority = parsePriority(rest);
    const project = parseProject(rest);
    const tags = parseTags(rest);
    let body = rest.replace(/\b(P[0-3])\b/gi, "").replace(/\+[A-Za-z][A-Za-z0-9_-]*/g, "").replace(/#[a-z0-9][a-z0-9_-]*/gi, "").trim();
    if (!body) return "Empty todo. Try: /todo call mom P1 +Family #call";
    const state = readTodos();
    const todo = { id: newId(), text: body, priority, status: "open", tags, project, note: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    state.todos = state.todos || [];
    state.todos.unshift(todo);
    writeTodos(state);
    let msg = "[ADDED] " + priority + " " + body;
    if (project) msg += " (+" + project + ")";
    if (tags.length) msg += " " + tags.map(t => "#" + t).join(" ");
    msg += "\nid: " + todo.id;
    return msg;
  }
  // /done <id|text-match>
  const doneM = trim.match(/^\/done\s+(\S+)/i);
  if (doneM) {
    const q = doneM[1].toLowerCase();
    const state = readTodos();
    const idx = (state.todos || []).findIndex(t => t.id.startsWith(q) || (t.text || "").toLowerCase().includes(q));
    if (idx < 0) return "No match for " + q;
    state.todos[idx].status = "done";
    state.todos[idx].updated_at = new Date().toISOString();
    writeTodos(state);
    return "[DONE] " + state.todos[idx].text;
  }
  // /list [priority|status|tag] - default: top 10 open by priority
  if (/^\/(?:list|todos|p1|p0)\b/i.test(trim)) {
    const state = readTodos();
    let items = (state.todos || []).filter(t => t.status === "open");
    if (/^\/p0\b/i.test(trim)) items = items.filter(t => t.priority === "P0");
    if (/^\/p1\b/i.test(trim)) items = items.filter(t => (t.priority || "P2") <= "P1");
    items.sort((a, b) => (a.priority || "P2").localeCompare(b.priority || "P2"));
    items = items.slice(0, 12);
    if (!items.length) return "No open todos match.";
    return items.map(t => "- " + (t.priority || "P2") + " " + t.text + (t.project ? " (+" + t.project + ")" : "")).join("\n");
  }
  // /note <id> <text> - append note
  const noteM = trim.match(/^\/note\s+(\S+)\s+(.+)/is);
  if (noteM) {
    const q = noteM[1].toLowerCase(), body = noteM[2];
    const state = readTodos();
    const idx = (state.todos || []).findIndex(t => t.id.startsWith(q) || (t.text || "").toLowerCase().includes(q));
    if (idx < 0) return "No match for " + q;
    const existing = state.todos[idx].note || "";
    state.todos[idx].note = existing ? existing + "\n" + body : body;
    state.todos[idx].updated_at = new Date().toISOString();
    writeTodos(state);
    return "[NOTED] " + state.todos[idx].text;
  }
  // /help - command reference
  if (/^\/help(\s|$)/i.test(trim)) {
    return [
      "Portal todo commands:",
      "/todo <text> [P0-P3] [+Project] [#tags] - add todo",
      "/done <id-prefix or text-match> - mark done",
      "/list - top 12 open by priority",
      "/p1 - only P0 + P1 open",
      "/p0 - only P0 open",
      "/note <id> <text> - append note",
      "/recap [N days] - last 2 weeks by default: commits, PRs, new research, todo deltas",
      "/summarize <project> - quick status of ZAOOS/BCZ/etc",
      "/focus <mins> - mute nudges for N minutes (max 480)",
      "/tip <number> - resolve a ZOE tip by doc number (e.g. /tip 157)",
      "/help - this message",
      "Portal UI: portal.zaoos.com/todos"
    ].join("\n");
  }
  // /tip <n> - resolve a ZOE tip by doc number. Checks sent.json first,
  // then falls back to scanning research/ for `<n>-*`. Short-circuits Claude
  // so /tip 157 costs ~0 tokens and returns instantly.
  const tipM = trim.match(/^\/tip\s+(\d+)/i);
  if (tipM) {
    const n = tipM[1];
    const sent = loadRecentTips(30);
    const hit = sent.find((t) => {
      const title = t.title || "";
      const path = t.path || "";
      return title.startsWith(n + " ") || title.startsWith(n + "—") ||
        title.includes(" " + n + " ") || path.includes("/" + n + "-");
    });
    if (hit) {
      const github = "https://github.com/bettercallzaal/ZAOOS/blob/main/" + (hit.path || "");
      return [
        "[TIP " + n + "] " + (hit.title || "(no title)"),
        "",
        "Path: " + (hit.path || "(unknown)"),
        "Sent: " + (hit.at || "(unknown)"),
        "Read: " + github,
      ].join("\n");
    }
    const local = findDocByNumber(n);
    if (local) {
      return [
        "[TIP " + n + "] not in recent sent.json cache but the doc exists:",
        "Path: " + local,
        "Read: https://github.com/bettercallzaal/ZAOOS/blob/main/" + local,
      ].join("\n");
    }
    return "No tip or doc matching '" + n + "' found in sent.json or research/.";
  }
  // /recap [N] - last N days (default 14) of shipped work
  const recapM = trim.match(/^\/(?:recap|rewind|past)(?:\s+(\d+))?/i);
  if (recapM) {
    const days = Math.min(parseInt(recapM[1] || "14", 10) || 14, 90);
    const since = new Date(Date.now() - days * 86400000);
    const sinceIso = since.toISOString();
    const sinceShort = sinceIso.slice(0, 10);
    try {
      const commits = execSync(`cd /home/zaal/code/ZAOOS 2>/dev/null && git log --oneline --since='${days} days ago' main 2>/dev/null | head -40`, { encoding: "utf-8", timeout: 8000 }).trim() || "(no commits)";
      const commitCount = commits.split("\n").filter(Boolean).length;
      let prs = [];
      try {
        const prsJson = execSync(`/home/zaal/.local/bin/gh pr list --repo bettercallzaal/ZAOOS --state merged --search 'merged:>=${sinceShort}' --limit 30 --json number,title 2>/dev/null || echo '[]'`, { encoding: "utf-8", timeout: 8000 }).trim();
        prs = JSON.parse(prsJson || "[]");
      } catch {}
      let newResearch = [];
      try {
        const stat = execSync(`find /home/zaal/code/ZAOOS/research -maxdepth 3 -type d -name '[0-9]*' -newermt '${sinceIso}' 2>/dev/null | head -30`, { encoding: "utf-8", timeout: 5000 }).trim();
        newResearch = stat.split("\n").filter(Boolean).map(p => p.split("/").slice(-2).join("/"));
      } catch {}
      let todosDone = 0, todosAdded = 0;
      try {
        const todos = JSON.parse(readFileSync("/home/zaal/portal-state/todos.json", "utf-8")).todos || [];
        todosDone = todos.filter(t => t.status === "done" && new Date(t.updated_at || 0) >= since).length;
        todosAdded = todos.filter(t => new Date(t.created_at || 0) >= since).length;
      } catch {}
      const out = [];
      out.push(`Recap - last ${days} days (since ${sinceShort})`);
      out.push("");
      out.push(`COMMITS on main: ${commitCount}`);
      out.push(commits.split("\n").slice(0, 12).join("\n"));
      out.push("");
      out.push(`MERGED PRS: ${prs.length}`);
      out.push(prs.slice(0, 12).map(p => `#${p.number} ${(p.title || "").slice(0, 70)}`).join("\n") || "(none)");
      out.push("");
      out.push(`NEW RESEARCH DOCS: ${newResearch.length}`);
      out.push(newResearch.slice(0, 12).join("\n") || "(none)");
      out.push("");
      out.push(`TODOS: +${todosAdded} added, ${todosDone} completed`);
      return out.join("\n").slice(0, 3800);
    } catch (e) {
      return "recap error: " + String(e.message).slice(0, 200);
    }
  }

  // /summarize <project> - cross-project status
  const sumM = trim.match(/^\/(?:summarize|sum|status)\s+(\S+)/i);
  if (sumM) {
    const proj = sumM[1];
    const projRoot = { ZAOOS: "/home/zaal/code/ZAOOS", BCZ: "/home/zaal/code/BetterCallZaal", BetterCallZaal: "/home/zaal/code/BetterCallZaal" }[proj] || `/home/zaal/code/${proj}`;
    try {
      const git = (() => { try { return execSync(`cd ${projRoot} 2>/dev/null && git log --oneline --since='3 days ago' | head -8`, { encoding: "utf-8", timeout: 5000 }).trim(); } catch { return ""; } })() || "(no repo or no recent commits)";
      let openTodos = [];
      try {
        const s = JSON.parse(readFileSync("/home/zaal/portal-state/todos.json", "utf-8"));
        openTodos = (s.todos || []).filter(t => (t.project === proj || t.project === proj.toUpperCase()) && !["done","archived"].includes(t.status || "open"));
      } catch {}
      const topTodos = openTodos.slice(0, 6).map(t => "- " + (t.priority || "P2") + " " + (t.text || "").slice(0, 70)).join("\n") || "(no open todos)";
      const repoName = proj === "ZAOOS" ? "ZAOOS" : proj;
      let prs = [];
      try {
        const prsJson = execSync(`/home/zaal/.local/bin/gh pr list --repo bettercallzaal/${repoName} --state open --limit 4 --json number,title 2>/dev/null || echo '[]'`, { encoding: "utf-8", timeout: 5000 }).trim();
        prs = JSON.parse(prsJson || "[]");
      } catch {}
      const prLines = prs.map(p => `#${p.number} ${(p.title || "").slice(0, 60)}`).join("\n") || "(none)";
      return [`Status: ${proj}`, "", `OPEN TODOS (${openTodos.length})`, topTodos, "", "RECENT COMMITS", git.slice(0, 400), "", "OPEN PRS", prLines].join("\n");
    } catch (e) {
      return "summarize error: " + String(e.message).slice(0, 200);
    }
  }

  // /focus <mins> - silence nudges for N minutes (writes ~/.focus-until)
  const focusM = trim.match(/^\/focus(?:\s+(\d+))?/i);
  if (focusM) {
    const mins = Math.min(parseInt(focusM[1] || "60", 10) || 60, 480);
    const until = Date.now() + mins * 60000;
    try { writeFileSync("/home/zaal/.focus-until", String(until)); } catch {}
    return `[FOCUS] muting nudges ${mins} min. /focus 0 to cancel.`;
  }

  return null;  // not a todo command, fall through to Claude
}

function loadSystemPrompt(chatId) {
  const files = ["SOUL.md", "USER.md", "AGENTS.md", "MEMORY.md"];
  let prompt = "";
  for (const file of files) {
    const path = WORKSPACE + "/" + file;
    if (existsSync(path)) {
      prompt += readFileSync(path, "utf-8") + "\n\n---\n\n";
    }
  }
  const now = new Date();
  prompt += "Today is " + now.toISOString().split("T")[0] + ". Current time: " + now.toLocaleTimeString("en-US", { timeZone: "America/New_York" }) + " Eastern.\n";

  // Inject recent outbound tips so ZOE knows what she herself sent earlier today.
  // Without this, questions like "zoe tip 157 can u see that" fail because the
  // random_tip.py cron runs in a separate process and leaves no trace in memory.
  const tips = loadRecentTips();
  if (tips.length) {
    const lines = tips.map((t) => {
      const when = (t.at || "").slice(0, 16).replace("T", " ");
      return "- [" + when + "] " + (t.title || "(untitled)") + " -> " + (t.path || "(no path)");
    });
    prompt += "\n---\n\nRECENT TIPS YOU (ZOE) SENT TO ZAAL (last " + TIP_CONTEXT_DAYS + " days):\n"
      + lines.join("\n")
      + "\n\nIf Zaal asks about one of these (e.g. 'tip 157'), treat it as your own prior message. The doc IS in the repo at the path shown.\n";
  }

  // Short-term conversation buffer so ZOE can reference what was said a few
  // turns ago. Kept per chat in ~/.cache/zoe-telegram/conv-<chatId>.json.
  if (chatId) {
    const conv = loadConversation(chatId);
    if (conv.length) {
      const lines = conv.map((t) => "Zaal: " + (t.user || "") + "\nZOE: " + (t.bot || ""));
      prompt += "\n---\n\nRECENT CONVERSATION (last " + conv.length + " turns in this chat):\n"
        + lines.join("\n\n")
        + "\n\nThe message below is the NEW inbound from Zaal. Respond in context.\n";
    }
  }

  return prompt;
}

async function sendMessage(chatId, text) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4000) { chunks.push(remaining); break; }
    let splitAt = remaining.lastIndexOf("\n", 4000);
    if (splitAt < 2000) splitAt = 4000;
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt);
  }
  for (const chunk of chunks) {
    try {
      await fetch(API + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: chunk }),
      });
    } catch (e) { console.error("Send error:", e.message); }
  }
}

async function sendTyping(chatId) {
  fetch(API + "/sendChatAction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(function() {});
}

function callClaude(userMessage, systemPrompt) {
  const ts = Date.now();
  const tmpSys = "/tmp/zoe-sys-" + ts + ".txt";

  try {
    writeFileSync(tmpSys, systemPrompt);

    // Use --append-system-prompt-file to avoid shell escaping issues
    // Pipe user message via stdin using echo
    // Run from REPO dir so CLAUDE.md is auto-discovered
    const safeMsg = userMessage.replace(/'/g, "'\\''");
    const cmd = "echo '" + safeMsg + "' | claude -p --append-system-prompt-file " + tmpSys + " --model opus --max-budget-usd 2 --output-format json --allowedTools 'Bash,Read,Grep,Glob,WebSearch,WebFetch'";

    console.log("Calling Claude...");
    const result = execSync(cmd, {
      cwd: REPO,
      timeout: 180000,
      maxBuffer: 2 * 1024 * 1024,
      env: Object.assign({}, process.env, { HOME: "/home/zaal" }),
    });

    const lines = result.toString().trim().split("\n");
    // Find the JSON line (last line should be the result)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.result) return parsed.result;
      } catch (e) { continue; }
    }
    return result.toString().substring(0, 4000);
  } catch (err) {
    const errMsg = String(err.message || err).substring(0, 500);
    console.error("Claude error:", errMsg);
    if (errMsg.includes("ETIMEDOUT")) return "Response took too long. Try a shorter or simpler request.";
    if (errMsg.includes("401")) return "Auth error. OAuth token may need refresh.";
    return "Hit an error: " + errMsg.substring(0, 100);
  } finally {
    try { unlinkSync(tmpSys); } catch (e) {}
  }
}

function logConversation(userMsg, botReply) {
  const date = new Date().toISOString().split("T")[0];
  const dir = WORKSPACE + "/memory";
  const logFile = dir + "/" + date + "-telegram.md";
  const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" });
  const entry = "\n## " + time + "\n**Zaal:** " + userMsg + "\n**ZOE:** " + botReply.substring(0, 200) + "...\n";
  try { mkdirSync(dir, { recursive: true }); } catch (e) {}
  try { appendFileSync(logFile, entry); } catch (e) { console.error("Log error:", e.message); }
}

async function poll(offset) {
  offset = offset || 0;
  try {
    const res = await fetch(API + "/getUpdates?offset=" + offset + "&timeout=30");
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg || !msg.text) continue;
        const userId = String(msg.from.id);
        const chatId = msg.chat.id;
        if (userId !== ALLOWED_USER) { await sendMessage(chatId, "Not authorized."); continue; }
        console.log("[" + new Date().toISOString() + "] Zaal: " + msg.text.substring(0, 80));
        // Portal todos slash commands - intercept before Claude
        const slashReply = await handleTodoCommand(msg.text);
        if (slashReply !== null) {
          await sendMessage(chatId, slashReply);
          logConversation(msg.text, slashReply);
          appendConversation(chatId, msg.text, slashReply);
          console.log("[" + new Date().toISOString() + "] ZOE(todo): " + slashReply.substring(0, 80));
          continue;
        }
        await sendTyping(chatId);
        const systemPrompt = loadSystemPrompt(chatId);
        const reply = callClaude(msg.text, systemPrompt);
        await sendMessage(chatId, reply);
        logConversation(msg.text, reply);
        appendConversation(chatId, msg.text, reply);
        console.log("[" + new Date().toISOString() + "] ZOE: " + reply.substring(0, 80) + "...");
      }
    }
  } catch (err) { console.error("Poll error:", err.message); }
  setTimeout(function() { poll(offset); }, 100);
}

console.log("ZOE v2 Telegram Bot (Opus via Max plan)");
console.log("Workspace: " + WORKSPACE);
console.log("Repo: " + REPO);
await fetch(API + "/deleteWebhook");
console.log("Webhook cleared. Polling...");
poll();
