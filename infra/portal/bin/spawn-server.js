// Portal backend: spawn + test-checklist + todos.
// Listens on localhost 3004, Caddy fronts it with cookie auth.
const http = require("http");
const { spawn } = require("child_process");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
const { URL } = require("url");
const crypto = require("crypto");

const AO_BIN = process.env.AO_BIN || path.join(process.env.HOME, ".local", "bin", "ao");
const PROJECT_ROOT = path.join(process.env.HOME, "code");
const CHECKLIST_FILE = path.join(process.env.HOME, "test-checklist", "state.json");
const TODOS_FILE = path.join(process.env.HOME, "portal-state", "todos.json");

function ensureDir(f) {
  const d = path.dirname(f);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
function readJSON(f, fallback) {
  if (!existsSync(f)) return fallback;
  try { return JSON.parse(readFileSync(f, "utf-8")); }
  catch { return fallback; }
}
function writeJSON(f, obj) { ensureDir(f); writeFileSync(f, JSON.stringify(obj, null, 2)); }
function json(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function html(res, code, body) {
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// --------- test-checklist ---------
function renderChecklistHTML(state) {
  const rows = state.tests.map(t => {
    const tag = t.done ? "DONE" : "PENDING";
    const color = t.done ? "#4ade80" : "#f5a623";
    const btn = t.done
      ? `<a href="/test-done?id=${t.id}&undo=1" class="btn undo">undo</a>`
      : `<a href="/test-done?id=${t.id}" class="btn do">mark done</a>`;
    return `<li><div class="row"><span class="tag" style="color:${color}">${tag}</span><strong>${escapeHtml(t.name)}</strong>${btn}</div><p class="desc">${escapeHtml(t.description)}</p></li>`;
  }).join("");
  const done = state.tests.filter(t => t.done).length;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(state.title)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0a1628;color:#f5f4ed;padding:1.25rem;padding-bottom:calc(1.25rem + 64px);max-width:720px;margin:0 auto}h1{font-size:1.4rem;margin-bottom:.4rem}.sum{color:#94a3b8;margin-bottom:1rem;font-size:.9rem}ul{list-style:none;padding:0}li{border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.8rem 1rem;margin-bottom:.6rem;background:rgba(255,255,255,.02)}.row{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem}.tag{font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;padding:.1rem .4rem;border-radius:3px;border:1px solid currentColor;font-weight:600}.desc{color:#94a3b8;font-size:.85rem;line-height:1.4;margin:0}.btn{margin-left:auto;font-size:.8rem;padding:.35rem .7rem;border-radius:5px;text-decoration:none;-webkit-tap-highlight-color:transparent}.btn.do{background:#f5a623;color:#0a1628}.btn.undo{background:transparent;color:#94a3b8;border:1px solid rgba(255,255,255,.2)}a.back{display:inline-block;margin-top:1rem;color:#f5a623;text-decoration:none;font-size:.85rem}</style></head><body><h1>${escapeHtml(state.title)}</h1><div class="sum">Done: ${done}/${state.tests.length}</div><ul>${rows}</ul><a class="back" href="/">&larr; back to portal</a><script src="/dock.js" defer></script></body></html>`;
}

// --------- todos ---------
const DEFAULT_TODOS = { todos: [] };
const VALID_PRIORITIES = ["P0", "P1", "P2", "P3"];
const VALID_STATUSES = ["open", "doing", "done", "archived"];

function newTodoId() { return crypto.randomBytes(6).toString("hex"); }

function sanitizeTodo(input) {
  const out = {};
  if (input.text !== undefined) out.text = String(input.text).trim().slice(0, 2000);
  if (input.priority !== undefined && VALID_PRIORITIES.includes(input.priority)) out.priority = input.priority;
  if (input.status !== undefined && VALID_STATUSES.includes(input.status)) out.status = input.status;
  if (input.tags !== undefined) {
    const arr = Array.isArray(input.tags) ? input.tags : String(input.tags || "").split(/[,\s]+/);
    out.tags = arr.map(t => String(t).trim().toLowerCase().replace(/^#/, "")).filter(Boolean).slice(0, 10);
  }
  if (input.project !== undefined) out.project = String(input.project).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  if (input.note !== undefined) out.note = String(input.note).slice(0, 4000);
  return out;
}

function listTodos(u) {
  const state = readJSON(TODOS_FILE, DEFAULT_TODOS);
  let todos = state.todos || [];
  const p = u.searchParams;
  const statuses = p.getAll("status");
  if (statuses.length) todos = todos.filter(t => statuses.includes(t.status || "open"));
  const priorities = p.getAll("priority");
  if (priorities.length) todos = todos.filter(t => priorities.includes(t.priority || "P2"));
  const tag = p.get("tag");
  if (tag) todos = todos.filter(t => (t.tags || []).includes(tag.toLowerCase().replace(/^#/, "")));
  const project = p.get("project");
  if (project) todos = todos.filter(t => (t.project || "") === project);
  const q = (p.get("q") || "").toLowerCase().trim();
  if (q) todos = todos.filter(t => (t.text || "").toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q) || (t.tags || []).some(tg => tg.includes(q)));
  const order = p.get("order") || "priority";
  if (order === "priority") todos.sort((a, b) => (a.priority || "P2").localeCompare(b.priority || "P2") || (b.created_at || "").localeCompare(a.created_at || ""));
  else if (order === "newest") todos.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  else if (order === "oldest") todos.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  const limit = Math.min(parseInt(p.get("limit") || "500", 10) || 500, 2000);
  return todos.slice(0, limit);
}

function allTags(state) {
  const set = new Set();
  for (const t of state.todos || []) (t.tags || []).forEach(tg => set.add(tg));
  return [...set].sort();
}

function handleTodos(req, res, u) {
  if (req.method === "GET") {
    const todos = listTodos(u);
    const state = readJSON(TODOS_FILE, DEFAULT_TODOS);
    return json(res, 200, { todos, tags: allTags(state), total: (state.todos || []).length });
  }
  if (req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let payload;
      try { payload = JSON.parse(body); } catch { return json(res, 400, { error: "invalid JSON" }); }
      const state = readJSON(TODOS_FILE, DEFAULT_TODOS);
      const items = Array.isArray(payload.items) ? payload.items : [payload];
      const created = [];
      for (const it of items) {
        const clean = sanitizeTodo(it || {});
        if (!clean.text) continue;
        const todo = {
          id: newTodoId(),
          text: clean.text,
          priority: clean.priority || "P2",
          status: clean.status || "open",
          tags: clean.tags || [],
          project: clean.project || "",
          note: clean.note || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.todos = state.todos || [];
        state.todos.unshift(todo);
        created.push(todo);
      }
      writeJSON(TODOS_FILE, state);
      return json(res, 201, { created });
    });
    return;
  }
  return json(res, 405, { error: "method not allowed" });
}

function handleTodoById(req, res, u, id) {
  const state = readJSON(TODOS_FILE, DEFAULT_TODOS);
  const idx = (state.todos || []).findIndex(t => t.id === id);
  if (idx < 0) return json(res, 404, { error: "not found" });
  if (req.method === "GET") return json(res, 200, state.todos[idx]);
  if (req.method === "PATCH" || req.method === "PUT") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let payload;
      try { payload = JSON.parse(body); } catch { return json(res, 400, { error: "invalid JSON" }); }
      const clean = sanitizeTodo(payload);
      state.todos[idx] = { ...state.todos[idx], ...clean, updated_at: new Date().toISOString() };
      writeJSON(TODOS_FILE, state);
      return json(res, 200, state.todos[idx]);
    });
    return;
  }
  if (req.method === "DELETE") {
    const [removed] = state.todos.splice(idx, 1);
    writeJSON(TODOS_FILE, state);
    return json(res, 200, { removed });
  }
  return json(res, 405, { error: "method not allowed" });
}

// --------- spawn ---------
function handleSpawn(req, res) {
  let body = "";
  req.on("data", c => body += c);
  req.on("end", () => {
    let payload;
    try { payload = JSON.parse(body); } catch { return json(res, 400, { error: "invalid JSON" }); }
    const project = (payload.project || "").replace(/[^A-Za-z0-9_-]/g, "");
    const prompt = (payload.prompt || "").trim();
    if (!project || !prompt) return json(res, 400, { error: "project and prompt required" });
    const cwd = path.join(PROJECT_ROOT, project);
    if (!existsSync(cwd)) {
      return json(res, 400, { error: `project directory not found: ~/code/${project} (clone it first or pick an existing project)` });
    }
    let ao;
    try {
      ao = spawn(AO_BIN, ["spawn", "--prompt", prompt], {
        cwd,
        env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}` },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      return json(res, 500, { error: "failed to spawn ao: " + (e.message || String(e)).slice(0, 200) });
    }
    ao.on("error", err => {
      if (res.writableEnded) return;
      json(res, 500, { error: "ao process error: " + (err.message || String(err)).slice(0, 200) });
    });
    let stdout = "", stderr = "";
    ao.stdout.on("data", c => stdout += c);
    ao.stderr.on("data", c => stderr += c);
    const timer = setTimeout(() => {
      ao.unref();
      json(res, 202, { accepted: true, sessionId: null, note: "spawning in background" });
    }, 8000);
    ao.on("exit", code => {
      clearTimeout(timer);
      if (res.writableEnded) return;
      if (code === 0) {
        const m = stdout.match(/session\s*(?:id|name)?[:\s]+([\w-]+)/i);
        json(res, 200, { sessionId: m ? m[1] : null, stdout: stdout.slice(0, 2000) });
      } else {
        json(res, 500, { error: stderr.slice(0, 2000) || `ao exited ${code}` });
      }
    });
  });
}

// --------- server ---------
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (req.method === "POST" && (u.pathname === "/spawn-action" || u.pathname === "/api/spawn")) return handleSpawn(req, res);
  if (req.method === "GET" && u.pathname === "/test-checklist") {
    const state = readJSON(CHECKLIST_FILE, null);
    if (!state) return html(res, 404, "<h1>no checklist</h1>");
    return html(res, 200, renderChecklistHTML(state));
  }
  if (req.method === "GET" && u.pathname === "/test-done") {
    const id = parseInt(u.searchParams.get("id"), 10);
    const undo = u.searchParams.get("undo") === "1";
    const state = readJSON(CHECKLIST_FILE, null);
    if (!state) return html(res, 404, "<h1>no checklist</h1>");
    const t = state.tests.find(x => x.id === id);
    if (!t) return html(res, 404, "<h1>unknown test id</h1>");
    t.done = !undo;
    writeJSON(CHECKLIST_FILE, state);
    res.writeHead(302, { Location: "/test-checklist" });
    return res.end();
  }
  if (u.pathname === "/todos" || u.pathname === "/todos/" || u.pathname === "/api/todos" || u.pathname === "/api/todos/") return handleTodos(req, res, u);
  const m = u.pathname.match(/^(?:\/api)?\/todos\/([a-z0-9]+)\/?$/i);
  if (m) return handleTodoById(req, res, u, m[1]);
  return json(res, 404, { error: "not found" });
});
server.listen(3004, "127.0.0.1", () => console.log("spawn-server on 127.0.0.1:3004"));
