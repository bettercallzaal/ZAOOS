// Cookie-based auth for *.zaoos.com. Reads PORTAL_PASSWORD from env (no hardcoded).
// Security hardening per research/security/463-portal-ao-audit-10-batch/:
// - crypto.timingSafeEqual instead of == (findings 2)
// - in-memory rate limit on /login (finding 2)
// - HTML-escape `next` param in login page (finding 3 — XSS)
// - SameSite=Strict (was Lax, finding 10)
// - 7-day cookie (was 30 days, finding 10)
// - Content-Length cap on POST body (finding 5)
const http = require("http");
const crypto = require("crypto");
const { readFileSync } = require("fs");
const { URL } = require("url");
const path = require("path");

const PASSWORD = process.env.PORTAL_PASSWORD || "";
const TOKEN_FILE = path.join(process.env.HOME, ".auth-token");
const TOKEN = readFileSync(TOKEN_FILE, "utf8").trim();
const COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 days (was 30)
const MAX_BODY_BYTES = 1024; // /login body is tiny; hard cap
const RATE_LIMIT_MAX = 5; // failures
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000; // locked 15 min after max fails

if (!PASSWORD) {
  console.error("FATAL: PORTAL_PASSWORD env var not set. Source ~/.env.portal before launching.");
  process.exit(1);
}

// Pre-hash PASSWORD for timing-safe comparison (both sides same length).
const PASSWORD_DIGEST = crypto.createHash("sha256").update(PASSWORD).digest();

// In-memory rate limit store keyed by best-effort client IP.
// Cleared on process restart (acceptable — watchdog respawns rare).
const rateLimit = new Map(); // ip -> {fails: number, lockedUntil: number}

function clientIpFromReq(req) {
  // Caddy forwards real IP in X-Forwarded-For / X-Real-IP.
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  if (real) return String(real).trim();
  return req.socket.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const secs = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSecs: secs };
  }
  // Decay old fail window
  if (entry.firstFailAt && now - entry.firstFailAt > RATE_LIMIT_WINDOW_MS) {
    rateLimit.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip) || { fails: 0, firstFailAt: now };
  entry.fails += 1;
  if (!entry.firstFailAt) entry.firstFailAt = now;
  if (entry.fails >= RATE_LIMIT_MAX) {
    entry.lockedUntil = now + RATE_LIMIT_COOLDOWN_MS;
    console.warn(`[auth] rate-limit lockout for ${ip} until ${new Date(entry.lockedUntil).toISOString()}`);
  }
  rateLimit.set(ip, entry);
}

function recordSuccess(ip) {
  rateLimit.delete(ip);
}

// Constant-time password comparison.
function passwordMatches(candidate) {
  if (typeof candidate !== "string") return false;
  const candidateDigest = crypto.createHash("sha256").update(candidate).digest();
  return candidateDigest.length === PASSWORD_DIGEST.length
    && crypto.timingSafeEqual(candidateDigest, PASSWORD_DIGEST);
}

function parseCookies(h) {
  const out = {};
  (h || "").split(/;\s*/).forEach(p => { const [k, ...v] = p.split("="); if (k) out[k.trim()] = v.join("=").trim(); });
  return out;
}

function setAuthCookie(res) {
  res.setHeader("Set-Cookie",
    `zao_auth=${TOKEN}; Max-Age=${COOKIE_MAX_AGE}; Domain=.zaoos.com; Path=/; HttpOnly; Secure; SameSite=Strict`);
}

// HTML-escape for safe interpolation into the login template.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Validate `next` is an allowed target; fall back to portal home otherwise.
function safeNext(raw) {
  const candidate = String(raw || "");
  if (/^https:\/\/[a-z0-9.-]+\.zaoos\.com(\/|$)/.test(candidate)) return candidate;
  return "https://portal.zaoos.com/";
}

function loginPage(err, next) {
  const safeNextEsc = escapeHtml(next || "/");
  const errEsc = err ? escapeHtml(err) : "";
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
    <p class="sub">Sign in once. Stays 7 days on this device.</p>
    <form method="POST" action="/login">
      <input type="hidden" name="next" value="${safeNextEsc}">
      <input type="password" name="password" placeholder="password" autocomplete="current-password" autofocus required>
      <button type="submit">Sign in</button>
      <div class="err">${errEsc}</div>
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
  const ip = clientIpFromReq(req);

  if (u.pathname === "/check") {
    if (cookies.zao_auth && cookies.zao_auth === TOKEN) { res.writeHead(204); return res.end(); }
    res.writeHead(401); return res.end();
  }
  if (u.pathname === "/login" && req.method === "GET") {
    const next = safeNext(u.searchParams.get("next") || `https://${fwdHost}${fwdUri}`);
    res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
    return res.end(loginPage(null, next));
  }
  if (u.pathname === "/login" && req.method === "POST") {
    // Enforce Content-Length hard cap before consuming body.
    const declared = parseInt(req.headers["content-length"] || "0", 10);
    if (declared > MAX_BODY_BYTES) {
      res.writeHead(413, {"Content-Type":"text/plain"});
      return res.end("payload too large");
    }
    // Rate-limit check by IP.
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      res.writeHead(429, {"Content-Type":"text/html; charset=utf-8", "Retry-After": String(rl.retryAfterSecs)});
      return res.end(loginPage(`Too many attempts. Retry in ${Math.ceil(rl.retryAfterSecs/60)} min.`, "/"));
    }
    let body = "";
    let received = 0;
    let tooBig = false;
    req.on("data", c => {
      received += c.length;
      if (received > MAX_BODY_BYTES) { tooBig = true; req.destroy(); return; }
      body += c;
    });
    req.on("end", () => {
      if (tooBig) {
        if (!res.headersSent) { res.writeHead(413, {"Content-Type":"text/plain"}); res.end("payload too large"); }
        return;
      }
      const form = parseForm(body);
      const nextEsc = safeNext(form.next);
      if (passwordMatches(form.password)) {
        recordSuccess(ip);
        setAuthCookie(res);
        res.writeHead(302, {Location: nextEsc});
        return res.end();
      }
      recordFailure(ip);
      res.writeHead(401, {"Content-Type":"text/html; charset=utf-8"});
      return res.end(loginPage("wrong password", nextEsc));
    });
    return;
  }
  if (u.pathname === "/logout") {
    res.setHeader("Set-Cookie", "zao_auth=; Max-Age=0; Domain=.zaoos.com; Path=/; HttpOnly; Secure; SameSite=Strict");
    res.writeHead(302, {Location: "https://portal.zaoos.com/login"});
    return res.end();
  }
  // Default: show login form (unauthenticated catch-all).
  res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
  res.end(loginPage(null, safeNext(`https://${fwdHost}${fwdUri}`)));
}).listen(3005, "127.0.0.1", () => console.log("auth-server on 127.0.0.1:3005"));
