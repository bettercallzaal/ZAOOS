---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-13
related-docs: "739, 759, 801"
original-query: "Research Milk Road PRO - personal-use MCP for Zaal's own account (STANDARD tier)"
tier: STANDARD
---

# 1067 — Milk Road PRO Personal-Use MCP for ZOE

> **Goal:** Structure Zaal's Milk Road reconnaissance into a personal-use MCP spec grounded in ToS boundaries and ZOE integration.

## Key Decisions

| Decision | Verdict | Rationale |
|----------|---------|-----------|
| **Build a Milk Road MCP?** | YES - personal-use only, session-authenticated, Zaal's account only | Milk Road ToS prohibits commercial redistribution of paywalled content. Personal MCP on his own session is defensible; sharing research/holdings with ZAO community would violate ToS. Build it purely for Zaal's personal decision support, never expose raw research to others. |
| **Redistribute Milk Road research to ZAO?** | NO - hard stop | ToS: "You are not permitted to use any content or materials on our website or in our newsletters for any commercial purposes without express written consent." Paywalled research write-ups are commercial content. This MCP is single-tenant (Zaal only). If the value requires sharing, seek written consent from Milk Road first. |
| **Store cookies/secrets in repo?** | NO - session cookie in ~/.zao/private only | Never commit browser session cookies. Store at `~/.zao/private/milkroad-session.json` (chmod 600), loaded by the MCP server at runtime only. |
| **ZOE integration surface** | Personal brief tool, not community product | ZOE can fetch `get_market_ticker()` + `get_macro_index()` for Zaal's morning read or trading-decision context. The macro/crypto metrics are personal inputs to Zaal's judgment, not a shared "ZOE knows markets" product. |

## What Milk Road Is

Milk Road (milkroad.com) is a research/investing platform + analyst portfolio tracker:
- **Founders:** 5 named analyst portfolios (Melvin, M0xt, Vincent, Kyle, John Gillen) with full P&L + trade logs.
- **Content:** ~230 research write-ups (some paywall-gated as "AI PRO" / "Crypto PRO"), ~2,900 news items/podcasts, macro + crypto + AI equity coverage.
- **Data:** Milk Road Macro Index (MRMI) - proprietary risk-on/off gauge; Macro Pulse, Crypto Pulse; portfolio tracking.
- **Swap:** Built-in token swap at swap.milkroad.com with MEV protection.
- **Zaal's plan:** All Access tier (promo $12.06/mo, list $99/mo; trial started 2025-08-21).

## MCP Spec: Personal-Use Milk Road Client

A local Node/TypeScript MCP server authenticates via Zaal's OWN browser session cookie (stored in `~/.zao/private/`, never committed). Tools query internal Milk Road API endpoints he confirmed (first-party, session-cookie authenticated, all return HTTP 200 JSON).

### 5 Core Tools

| Tool | Endpoint | Purpose | Returns |
|------|----------|---------|---------|
| `get_market_ticker()` | `/api/market-ticker` | Current macro/crypto prices | `{S&P, Nasdaq, BTC, ETH, Gold, DXY, MRMI: {value, change}}` |
| `get_analyst_portfolios()` | `/api/portfolio-tracker/summaries` | All 5 analyst portfolio snapshots | Array of `{name, userId, currentValue, change24h/7d/30d/allTime, color, avatarUrl}` |
| `get_portfolio_holdings(analyst)` | `/api/portfolio-tracker/holdings?userId=<id>` | One analyst's full holdings + entry price + P&L | Array of `{ticker, shares, entryPrice, currentPrice, gainLoss, gainLossPercent}` |
| `get_trade_log(limit)` | `/api/portfolio-tracker/all-holdings?timeframe=7D\|1D` | Real-time analyst trade log with rationale | Array of `{analyst, date, ticker, action (buy/sell), shares, price, rationale}` |
| `get_macro_index()` | `/api/market-ticker` subset | Milk Road Macro Index (MRMI) risk-on/off + supporting metrics | `{MRMI: value, direction, macro-signal (bullish/neutral/bearish)}` |

### Authentication Model

- **Session storage:** Zaal manually retrieves his session cookie from browser DevTools after logging into milkroad.com, saves it to `~/.zao/private/milkroad-session.json`:
  ```json
  {
    "sessionCookie": "<cookie-value>",
    "retrievedAt": "2026-07-13T00:00:00Z",
    "expiresAt": "2026-08-13T00:00:00Z"
  }
  ```
- **Never committed.** Verify `.gitignore` includes `**/.zao-private/` and `~/.zao/private/` patterns.
- **Runtime loading:** The MCP server reads the cookie at startup, passes it as `Cookie` header on every request.
- **Refresh cadence:** Cookie expires after ~30 days. Zaal re-retrieves + re-saves manually. The MCP server logs a clear warning if cookie is stale.

### ZOE Integration Points

| Consumer | Use Case | Tool(s) | Example Output |
|----------|----------|---------|-----------------|
| **Zaal's Morning Brief** | Macro risk gauge + analyst sentiment | `get_macro_index()` + `get_analyst_portfolios()` | "MRMI at 72 (neutral). Melvin +8.3% YTD, holding 12 cryptos. Vincent -2.1%, shifted to stables." |
| **Trade Decision Context** | Before moving ZAO treasury or personal positions | `get_market_ticker()` + `get_trade_log()` | "BTC +3.2% in 24h. Melvin bought 0.5 BTC at 67,200 yesterday. ETH neutral." |
| **Portfolio Monitoring** | Watch analyst risk posture | `get_analyst_portfolios()` (recurring, e.g., hourly) | Alerts if Melvin's portfolio drops >5% in 1 day (signal of macro shift). |

**Strict boundary:** ZOE fetches these metrics for Zaal's console only. Never surface Milk Road analyst portfolios, trade rationale, or research write-ups in Telegram, Bonfire, or ZAO community channels without explicit Zaal approval AND Milk Road written consent.

## Implementation Checklist

| Item | Effort | Owner | By When | Shipped Criteria |
|------|--------|-------|---------|------------------|
| Reserve session cookie storage in ~/.zao/private + add .gitignore rules | 15 min | Zaal | 2026-07-14 | `.gitignore` updated, test: `git check-attr gitignore ~/.zao/private/milkroad-session.json` returns "untracked" |
| Manually retrieve session cookie, save to ~/.zao/private/milkroad-session.json | 10 min | Zaal | 2026-07-14 | File exists, contains valid sessionCookie field, expiry >7 days |
| Build Node/TS MCP server with 5 tools in `src/mcp/milkroad.mcp.ts` | 2-3 hours | Zaal or agent | 2026-07-16 | Server boots without errors, `node src/mcp/milkroad.mcp.ts --help` shows 5 tools |
| Wire ZOE's `human.md` to instantiate Milkroad MCP on startup | 30 min | Zaal | 2026-07-17 | ZOE loads without errors, `/invoke milkroad get_market_ticker` works in console |
| Test: ZOE fetch market ticker + get_analyst_portfolios + log output to morning brief | 45 min | Zaal | 2026-07-17 | Manual test shows MRMI + 5 analyst portfolios in ZOE output; no raw content leakage to Telegram |
| Document in `research/agents/1067-milkroad-personal-mcp/SETUP.md` + add to ZOE .md reference | 30 min | Zaal | 2026-07-18 | SETUP.md created with session refresh + troubleshooting; ZOE brief links to it |

## ToS + Legal Boundary (CRITICAL)

**Milk Road Terms of Service (verified via Zaal's paid account + ToS page):**

> "You are not permitted to use any content or materials on our website or in our newsletters for any commercial purposes without the express written consent of Milk Road Inc."

**Application to this MCP:**

1. **ALLOWED (this build):** Zaal uses Milk Road data to inform his own personal investment and strategy decisions. No redistribution, no resale, no commercial use.
2. **BANNED (do not do):**
   - Publishing Milk Road research write-ups to ZAO Slack, Bonfire, or public channels.
   - Selling Milk Road insights to ZAO members or the community.
   - Treating the MCP as a "ZAO market intelligence tool" and distributing outputs.
   - Sharing analyst holdings + trade rationale with others (those are commercial content).
3. **GREY ZONE (ask first):** If Zaal wants to reference a macro trend from Milk Road in a public ZAO post, he may cite "Milk Road Macro Index shows X" (the index name + direction are not paywalled), but NEVER paste research write-up text or analyst holdings.

**Enforcement:**
- The MCP server is single-tenant: Zaal's session cookie only, no multi-user auth layer.
- No endpoint to export/share raw research or holdings.
- ZOE logs any attempt to redistribute Milk Road content to external channels and alerts Zaal.

---

## Also See

- [Doc 739](../739-zoe-orchestrator-memory-blocks/) — ZOE soul architecture; how to add MCP tools to ZOE's startup config.
- [Doc 759](../759-zoe-8-workers-3-critics/) — ZOE locked configuration; 8 workers, 3 critics.
- [Doc 801](../801-mcp-server-starter-guide/) — MCP patterns in ZAOOS; session auth example with Neynar, Supabase.

## Sources

| Source | Fetch Status | Notes |
|--------|--------------|-------|
| Milk Road homepage (milkroad.com) | PARTIAL | Site exists but behind Cloudflare challenge (curl blocked). Zaal has live paid access confirming platform real. |
| Milk Road Terms page (milkroad.com/terms) | PARTIAL | Cloudflare challenge prevented direct fetch. Zaal verified ToS language: "not permitted to use content for commercial purposes without express consent." |
| Zaal's direct platform recon | FULL | Zaal logged in, verified 5 analyst portfolios + real API endpoints + current plan ($99/mo listed, $12.06/mo promo). Firsthand confirmed. |
| `src/lib/agents/runner.ts` (ZAOOS) | FULL | Verified existing MCP integration pattern (Neynar, Supabase session auth). Will mirror for Milk Road auth model. |

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Set up ~/.zao/private/milkroad-session.json + verify .gitignore blocks it | Zaal | Setup | 2026-07-14 | File exists, gitignore test passes, no commit risk |
| Build milkroad.mcp.ts with 5 tools + session auth, test locally against real endpoints | Zaal | Code | 2026-07-16 | `npm run test -- src/mcp/milkroad.mcp.test.ts` green; manual `get_market_ticker()` returns real MRMI value |
| Wire ZOE to load Milk Road MCP on startup + add to morning brief pipeline | Zaal | Integration | 2026-07-17 | ZOE boots, fetches Milk Road data, surfaces in console (no Telegram leak) |
| Document session refresh + troubleshooting in SETUP.md | Zaal | Docs | 2026-07-18 | SETUP.md committed alongside MCP code; points to this doc's ToS section |
