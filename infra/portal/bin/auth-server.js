// Cookie-based auth for *.zaoos.com. Served on :3005.
// Caddy forward_auth queries /check. Login form POSTs /login.
const http = require("http");
const { readFileSync } = require("fs");
const { URL } = require("url");
const path = require("path");

const PASSWORD = "qwerty1";  // TODO: pull from env; rotate via CF Access later
const TOKEN_FILE = path.join(process.env.HOME, ".auth-token");
const TOKEN = readFileSync(TOKEN_FILE, "utf8").trim();
const COOKIE_MAX_AGE = 30 * 24 * 3600;  // 30 days

function parseCookies(h) {
  const out = {};
  (h || "").split(/;\s*/).forEach(p => { const [k, ...v] = p.split("="); if (k) out[k.trim()] = v.join("=").trim(); });
  return out;
}

function setAuthCookie(res) {
  res.setHeader("Set-Cookie",
    `zao_auth=${TOKEN}; Max-Age=${COOKIE_MAX_AGE}; Domain=.zaoos.com; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

function loginPage(err, next) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0a1628"><title>Sign in - ZAO</title><style>
    body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0a1628;color:#f5f4ed;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;margin:0}
    .box{max-width:360px;width:100%}
    h1{font-size:1.5rem;margin:0 0 .25rem 0}
    p.sub{color:#94a3b8;font-size:.85rem;margin:0 0 1.25rem 0}
    form{display:flex;flex-direction:column;gap:.6rem}
    input{background:#0f1f36;color:#f5f4ed;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.8rem;font-size:1rem;width:100%;box-sizing:border-box;-webkit-appearance:none}
    input:focus{outline:none;border-color:#f5a623}
    button{background:#f5a623;color:#0a1628;border:0;border-radius:8px;padding:.8rem;font-weight:600;font-size:1rem;-webkit-appearance:none}
    button:active{background:#d38b11}
    .err{color:#f87171;font-size:.85rem;margin-top:.4rem;min-height:1em}
  </style></head><body><div class="box">
    <h1>ZAO Portal</h1>
    <p class="sub">Sign in once. Stays for 30 days on this device.</p>
    <form method="POST" action="/login">
      <input type="hidden" name="next" value="${String(next || "/").replace(/"/g, "&quot;")}">
      <input type="password" name="password" placeholder="password" autocomplete="current-password" autofocus required>
      <button type="submit">Sign in</button>
      <div class="err">${err ? err : ""}</div>
    </form>
  </div></body></html>`;
}

function parseForm(body) {
  const out = {};
  body.split("&").forEach(p => { const [k, v] = p.split("="); if (k) out[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " ")); });
  return out;
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const cookies = parseCookies(req.headers.cookie);
  const fwdUri = req.headers["x-forwarded-uri"] || "/";
  const fwdHost = req.headers["x-forwarded-host"] || req.headers.host || "portal.zaoos.com";

  // Forward-auth check: Caddy calls this before serving protected routes.
  if (u.pathname === "/check") {
    if (cookies.zao_auth === TOKEN) {
      res.writeHead(204); return res.end();
    }
    res.writeHead(401); return res.end();
  }

  // Login page (GET)
  if (u.pathname === "/login" && req.method === "GET") {
    const next = u.searchParams.get("next") || `https://${fwdHost}${fwdUri}`;
    res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
    return res.end(loginPage(null, next));
  }

  // Login form POST
  if (u.pathname === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      const form = parseForm(body);
      if (form.password === PASSWORD) {
        setAuthCookie(res);
        const next = form.next && /^https:\/\/[a-z.-]+\.zaoos\.com(\/|$)/i.test(form.next) ? form.next : "https://portal.zaoos.com/";
        res.writeHead(302, {Location: next});
        return res.end();
      }
      res.writeHead(401, {"Content-Type":"text/html; charset=utf-8"});
      return res.end(loginPage("wrong password", form.next));
    });
    return;
  }

  // Logout
  if (u.pathname === "/logout") {
    res.setHeader("Set-Cookie", "zao_auth=; Max-Age=0; Domain=.zaoos.com; Path=/; HttpOnly; Secure; SameSite=Lax");
    res.writeHead(302, {Location: "https://portal.zaoos.com/login"});
    return res.end();
  }

  // Anything else: show login page (Caddy sent us here because 401)
  res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
  res.end(loginPage(null, `https://${fwdHost}${fwdUri}`));
}).listen(3005, "127.0.0.1", () => console.log("auth-server on 127.0.0.1:3005"));
