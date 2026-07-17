---
topic: agents
type: canonical
status: research-complete
last-validated: 2026-07-17
related-docs: "1067, 739, 801"
original-query: "Generalize the Milk Road MCP auth+boundary design into a reusable template for any session-gated personal-use data source"
tier: CANONICAL
---

# 1212 — Personal-Use Session-MCP Pattern

> **One-liner:** Any paywalled or login-gated source Zaal wants ZOE to read follows this exact template — cookie auth, `~/.zao/private/` storage, single-tenant, personal-brief-only, loud session-expiry, never redistributed. Milk Road MCP (doc 1067) is the first instance.

## Why This Exists

Doc 1067 (Milk Road PRO MCP) produced a disciplined auth+boundary design that is *not* Milk Road-specific. Every subsequent personal-use MCP would otherwise re-derive the same ToS/PII reasoning from scratch, risking drift. This doc freezes the pattern as a CANONICAL template so future instances inherit it by reference, not by re-invention.

---

## The Pattern

### 1. Auth Model

| Component | Spec |
|-----------|------|
| **Credential type** | Browser session cookie (manually retrieved by Zaal from DevTools after login) |
| **Storage location** | `~/.zao/private/<source>-session.json` — chmod 600, never committed |
| **File schema** | `{ "sessionCookie": "<value>", "retrievedAt": "<ISO8601>", "expiresAt": "<ISO8601>" }` |
| **Runtime use** | MCP server reads cookie at startup; passes as `Cookie` header on every request |
| **Refresh cadence** | Manual, ~30-day cycle; Zaal re-retrieves and saves when ZOE nudges him |
| **Owner** | Zaal only — loops never retrieve or store his session cookies |

### 2. Tenancy Model

| Constraint | Rule |
|-----------|------|
| **Single-tenant** | Zaal's session only; no multi-user auth layer, no delegation |
| **Purpose** | Personal decision support — never a shared "ZOE knows X" product |
| **No export surface** | MCP exposes no endpoint to dump or share raw paywalled content |

### 3. Integration Boundary

| Surface | Allowed | Banned |
|---------|---------|--------|
| Zaal's personal morning-brief (console) | YES — full output | |
| ZAO Telegram bot | Index/gauge values only (non-paywalled) | Raw research, analyst holdings, write-up text |
| Bonfire / knowledge graph | Index/gauge values + Zaal's own interpretation | Paywalled article text, analyst trade rationale |
| ZAO community channels | NEVER without Zaal approval + written source consent | Everything |

### 4. Loud Degradation on Session Expiry

When the session cookie expires (401/403 from source), the MCP **must not**:
- Return empty/null silently
- Crash or throw an uncaught exception
- Retry with a stale cookie

It **must** return a structured error:

```typescript
{
  error: "session_expired",
  source: "<source-name>",
  action: "Zaal re-auth needed — retrieve fresh session cookie from browser DevTools and save to ~/.zao/private/<source>-session.json"
}
```

ZOE surfaces this as a one-line nudge in the morning brief: `"[source] session expired — re-save cookie"`. Never a silent drop.

### 5. PII + Secret Hygiene

Governed by existing rules — this pattern inherits both:
- `~/.zao/private/` is the canonical location for all personal session files (not in repo)
- `.gitignore` must include `**/.zao/private/` at root — verify on every new MCP source
- Session cookie values never appear in logs, Bonfire, or Telegram output
- See `secret-hygiene.md` and `pii-hygiene.md` in `.claude/rules/`

---

## Checklist: Instantiate a New Source

Copy this checklist for each new personal-use MCP:

```
[ ] Identify source: name, login URL, session-cookie approach confirmed
[ ] ToS review: personal-use-only defensible? redistribution explicitly banned? document verdict
[ ] Verify .gitignore includes ~/.zao/private/ at repo root
[ ] Create ~/.zao/private/<source>-session.json (Zaal, manually, via DevTools)
[ ] Build src/mcp/<source>.mcp.ts with:
      - Session loading from ~/.zao/private/<source>-session.json
      - Cookie header injection on every fetch
      - Structured session_expired return on 401/403 (not throw, not null)
      - No export endpoint for raw paywalled content
[ ] Wire ZOE brief: which data to surface (index/gauge only vs. full output)
[ ] Define community-boundary rule: what can go to Telegram, what stays console-only
[ ] Document in SETUP.md alongside the MCP: session refresh steps + troubleshooting
[ ] Shipped criteria: `get_<primary_tool>()` returns real data; expired-cookie test returns structured error (not silent)
```

---

## Known Instances

| Instance | Doc | Source | Status | Notes |
|----------|-----|--------|--------|-------|
| Milk Road PRO MCP | [1067](../1067-milkroad-personal-mcp/) | milkroad.com | Design complete, build Zaal-owned | 5 tools: market ticker, analyst portfolios, holdings, trade log, macro index |

---

## ToS/Legal Template

When a new source is added, record the ToS verdict here:

```
Source: <name>
ToS URL: <url>
Personal-use status: ALLOWED / BANNED / GREY
Redistribution status: BANNED (default assumed unless ToS explicitly permits)
Paywalled content redistribution: BANNED
Verified by: Zaal / agent / doc
Date: YYYY-MM-DD
```

---

## What This Pattern Is NOT

- **Not a multi-user product.** If Zaal wants to share research with ZAO members, that is a different product requiring different auth + explicit source consent.
- **Not a scraper.** Session-cookie auth uses legitimate authenticated endpoints, not DOM scraping. If a source blocks headless fetches, this approach still works because it looks like a logged-in browser.
- **Not a secret-manager.** `~/.zao/private/` is a convenience location for Zaal's personal machine, not a vault. Do not store production API keys here (those belong in `.env` files or a proper secrets manager).

---

## Also See

- [Doc 1067](../1067-milkroad-personal-mcp/) — First instance; full ToS analysis, 5-tool spec, implementation checklist
- [Doc 801](../801-mcp-server-starter-guide/) — General MCP patterns in ZAOOS; Neynar + Supabase session auth examples
- [Doc 739](../739-zoe-orchestrator-memory-blocks/) — ZOE soul architecture; how to add MCP tools to startup config
