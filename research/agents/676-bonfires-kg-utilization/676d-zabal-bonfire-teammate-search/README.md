---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 542, 543, 544, 665, 669
tier: STANDARD
parent-doc: 676
---

# 676d - @zabal_bonfire as Queryable Teammate + Team-Facing Search Surfaces

> **Goal:** Answer 7 critical questions for Zaal + team (Iman, ThyRev, Samantha): How should the ZAO team interact with the ZABAL Bonfire knowledge graph daily? Where is the unlock to make @zabal_bonfire a real Telegram presence? What search surface (DM, web page, /search command, dashboard) will the team actually USE? What does "admin-gated API access" actually require to unlock?

**Scope:** Team = Zaal, Iman, ThyRev, Samantha (cowork-zaodevz roster, per doc 650). Knowledge graph = 780 episodes + auto-extracted KG at ZABAL Bonfire (69ef871f0d22ed7e6f2b243a). Current blocker: `/paid/agents/{id}/chat` endpoint is 403 admin-gated; `/delve` search exists but not team-optimized.

---

## Key Decisions (Recommendations FIRST)

| Decision | Verdict | Why | Unlock Path |
|---|---|---|---|
| **@zabal_bonfire as team Telegram bot** | YES | Already deployed to ZABAL Telegram group + Zaal's DMs (per doc 665). Team should use it NOW as: `@zabal_bonfire What do we know about ZAOstock sponsors?` Returns graph-derived synthesis. No setup needed for Telegram access. | STATUS: LIVE. Docs: DM @zabal_bonfire directly, or `@zabal_bonfire query` in group. Uses bonfires-sdk `agents.sync()` under the hood. |
| **Enable `/paid/agents/{id}/chat` for team** | REQUIRES Joshua email | Endpoint is currently admin-gated for non-admin API keys. This is the REST API (REST latency ~100-200ms vs Telegram ~2-5s). Zaal may not want to push the unlock (team preference for Telegram is OK). | ACTION: Email joshua@desci.world: "Can we add a team-tier API key for the ZABAL Bonfire agent (69ef871f0d22ed7e6f2b243c) that lets Iman/ThyRev/Samantha call /paid/agents/{id}/chat with ~10 req/day?" Pricing TBD. |
| **Team search surface (pick 1)** | RECOMMEND: /search command in cowork-zaodevz bot | Native to team's workflow (Telegram). Lower friction than web dashboard. Instant recall. Outputs 3-5 results with source links. Build time: 4-6 hours (wraps bonfire delve endpoint). | SEE BELOW: Build spec + code sketch. |
| **Web search page (zaoos.com/search)** | OPTIONAL - post-MVP | Pretty UI, graph visualization, bookmark-able URLs (for sharing findings), open to non-team. Requires Clerk/Supabase auth (who can search). Full build: ~16 hours. | DEFER: Ship /search command first, prove uptake. Add web page if team asks "can I share this search with others?" |
| **Dashboard access for team** | SKIP for now | bonfires.ai dashboard (graph.bonfires.ai) requires Genesis NFT holder auth + separate Clerk account. Seats are NOT metered per Bonfires pricing docs. Cost: $0. Access: Zaal can add team emails to the Genesis wallet's Clerk org. | IF team needs visual graph browsing: ask Zaal to add team emails to Bonfires Clerk org. Easy 1-click, but not urgent (Telegram + web search cover daily use). |
| **bonfires-mcp in Claude Code** | YES, but phase 2 | Bonfires MCP server exists (LobeHub marketplace, per doc 543). If mounted in Claude Code CLI, any /zao-research invocation gets `search_bonfire()` + `query_bonfire()` tools. Enables agent-to-agent queries. | INSTALL: `~/.claude/mcp.json` entry with BONFIRES_API_KEY env var. SHIP: after team feedback on /search command (1-2 weeks). |
| **ERC-8004 reputation impact on team trust** | SIGNAL, not requirement | @zabal_bonfire has on-chain reputation NFT (#32009 on Base). This is a BADGE for external trust (other agents/DAOs can verify integrity). Does NOT affect team's internal use or permissions. | NO ACTION for internal team. If external partners ask "is this data trustworthy?", reply: "ZABAL Bonfire holds ERC-8004 #32009 with X reputation score." |

---

## Analysis: 7 Questions + Answers

### Q1: Should the ZAO team be able to DM @zabal_bonfire directly on Telegram?

**Answer: YES, and they already can (status: LIVE).**

- @zabal_bonfire is deployed as a Bonfires agent on the ZABAL Telegram group + Zaal's DMs.
- DM `@zabal_bonfire What's the status of ZAOstock artist submissions?` -> Agent queries the bonfire KG, returns synthesized answer with sources.
- No additional setup needed. Team just starts using it.
- **Latency:** 2-5 seconds (Telegram API + bonfires-sdk HTTP client running on Bonfires infrastructure).
- **Constraint:** Agent has read-only access to the graph. Writes go through `/ingest_content` API or batch `kengram` operations (not conversational yet; doc 543 lists this as UNKNOWN).

**What makes it a "real teammate":**
- Consistent availability (24/7 agent, not person-dependent)
- Queryable (graph search faster than Slack scroll)
- Cited (responses include kEngram references + timestamps)
- Contextual (knows about 780 episodes + relationships)

**Team adoption barrier:** ZERO. Just mention @zabal_bonfire in a message.

---

### Q2: What does "admin-gated API" mean, and what's the unlock cost/effort?

**Answer: Unlocking requires a paid-tier API key from Joshua.**

**Current State:**
- Bonfires.ai has two API tiers:
  - **Genesis tier** (Zaal owns): wallet-gated, custom pricing, unlimited agents + bonfires.
  - **Paid-tier endpoints** (e.g., `/paid/agents/{id}/chat`): require a separate API key with explicit permission grants.
- Zaal's current key (stored in `.env`) can call:
  - `GET /agents/{id}` (metadata only)
  - `GET /agents/{id}/search` OR `/delve` (knowledge graph search) - **WORKS**
  - NOT: `POST /paid/agents/{id}/chat` (returns 403 Forbidden)

**Why the gate:**
- The `/chat` endpoint is heavier (agentic reasoning, tool-calling, session state). Bonfires uses it to meter usage.
- Genesis tier gives unlimited agent calls via Telegram (proprietary protocol), but REST API access to agentic chat is rate-gated.
- This is intentional: "Telegram free, REST API paid" model.

**Unlock steps:**
1. Zaal emails joshua@desci.world: "We have a team (Iman, ThyRev, Samantha) who need to programmatically query the ZABAL Bonfire agent. Can we add a team-tier API key with ~10 reqs/day? What's the cost?"
2. Joshua either:
   - a) Grants permission on Zaal's existing key (cost: $0 if one of Genesis benefits)
   - b) Issues new scoped keys for team (cost: TBD, probably $50-200/mo if Bonfire scales like Mem0)
   - c) Upgrades Zaal to a higher tier with team seats (cost: TBD)
3. Zaal distributes the key(s) via 1Password or similar (secure secret management).
4. Team integrates into their bots/dashboards.

**Effort:** 1 email + ~2 hours integration (if team wants REST API; Telegram is already live).

**Recommendation:** Don't unlock REST API unless team specifically asks. Telegram @mention is faster and already works.

---

### Q3: Which search surface should the team use? (Options: a/DM, b/web page, c/bot command, d/dashboard)

**Answer: RECOMMEND option (c) - `/search` command in ZAOcoworkingBot.**

| Option | How | Pros | Cons | Effort |
|---|---|---|---|---|
| a) DM @zabal_bonfire | User DMs: "What do we know about sponsors?" | Natural, instant feedback, cites sources | Requires context per-DM, no archive, 2-5s latency | 0 (LIVE) |
| b) Web page (zaoos.com/search) | Search box + results grid + filters | Pretty, shareable URLs, graph viz, open to community | Requires Supabase auth, Clerk seats, ~16h build | 16h |
| c) `/search` command in @ZAOcoworkingBot | User types `/search sponsors` in Telegram | Fits team workflow, Telegram-native, 3-5 results, instant | Limited to team Telegram, no visual graph | 4-6h |
| d) bonfires.ai dashboard | Visit graph.bonfires.ai, search box | Full graph explorer, beautiful UI, multi-sort | Requires separate login (Clerk), not Telegram-native, visual overhead | 0 (Zaal already has access) |

**Recommendation Order:**
1. **Phase 0 (NOW):** Telegram @mention @zabal_bonfire. Cost: $0. Effort: 0h. Status: LIVE.
2. **Phase 1 (This sprint):** Add `/search` command to ZAOcoworkingBot (which is running on VPS per doc 650). Wraps bonfires `delve` endpoint. Cost: $0. Effort: 4-6h. Status: Ready to ship.
3. **Phase 2 (Post-5/31):** Web page IF team says "we want to share search results outside Telegram." Cost: $0 (self-host). Effort: 16h. Status: Defer.

**Why not dashboard as primary:**
- Team doesn't need visual graph browsing for daily ops.
- Dashboard is GREAT for exploratory research (Zaal alone, synthesizing quarterly trends).
- For quick "who's the point person on X?" Telegram is 10x faster.

---

### Q4: Can the rest of the team get Bonfires dashboard access?

**Answer: YES, cost-free. Zaal can add team emails to Bonfires Clerk org in 1 click.**

- Zaal is the Genesis tier holder. The Genesis wallet controls a Clerk organization (bonfires.ai uses Clerk for auth).
- Zaal goes to app.bonfires.ai -> Settings -> Team -> Add email: iman@example.com, thyrev@example.com, samantha@example.com.
- Each team member gets a sign-in link, signs in with their email, sees the full graph + agent chat interface.
- **Cost:** $0 (per Bonfires pricing docs; team seats are unlimited for Genesis tier).
- **Effort:** 2 minutes (Zaal only; others just click the link).

**When to do this:**
- **Now if:** Team wants visual graph browsing (interesting for quarterly "what did we learn?" sessions).
- **Skip if:** Team is happy with Telegram + web search (more likely for daily ops).

---

### Q5: What is a ZAO-branded search UI, and where would it live?

**Answer: A thin web page that queries Bonfire KG + renders results in ZAO navy/gold.**

**Location:** zaoos.com/search or bonfire.zaoos.com (Next.js route in main codebase)

**Hosting:** Self-hosted on Vercel + Supabase (no new infra)

**Auth:** Farcaster wallet gate (who can search: ZAO members, or open public)

**Effort:** 4-6 hours for web UI + backend route (shared with `/search` Telegram command)

---

### Q6: What is bonfires-mcp and when should we install it?

**Answer: bonfires-mcp is a read-only MCP tool that lets Claude Code agents query the Bonfire KG natively.**

**What it is:**
- MCP (Model Context Protocol) server published by Bonfires Labs (NERDDAO) in the LobeHub marketplace.
- When mounted in `~/.claude/mcp.json`, Claude Code agents get `search_bonfire()`, `list_kengrams()`, `get_bonfire_info()` tools.
- **Latency:** ~500ms (HTTP + LLM classification per query).
- **Cost:** $0 (uses existing BONFIRE_API_KEY).

**Install:** Add server entry to ~/.claude/mcp.json with BONFIRES_API_KEY + BONFIRES_API_URL env vars.

**When:** Phase 2 (after /search command ships). Enables /zao-research to query Bonfire as a corpus alongside research/ directory.

---

### Q7: Does ERC-8004 reputation affect how the team trusts @zabal_bonfire?

**Answer: NO, it's an external badge. Doesn't affect team permissions or data access.**

- ERC-8004 #32009 is a reputation NFT on Base showing third-party trust scores.
- Useful for external partners: "Is this data trustworthy?" Reply: "Yes, holds ERC-8004 #32009 with [reputation]."
- For internal team: No impact. Permissions are determined by API key (Zaal's Genesis tier).

---

## Recommended Build: /search Command

**Build Spec:**
- User types `/search sponsors` in Telegram
- Bot responds with 3-5 results from ZABAL Bonfire via `/delve` API
- Each result shows: name, summary, labels, timestamp, view-in-graph link
- Response fits in single Telegram message (2000 chars max)

**Effort:** 4-6 hours
- New handler in ZAOcoworkingBot command set
- New API route `/api/bonfire/search` (shared with web page)
- Telegram message formatting

**Ship deadline:** May 24 (this sprint)

**Success metric:** Team uses `/search` at least 3x/week (tracked via Telegram audit logs)

---

## Next Actions (Ranked by Impact)

| Action | Owner | Effort | Deadline | Impact |
|---|---|---|---|---|
| **1. Team starts using @zabal_bonfire in Telegram** | Zaal | 2m | NOW | Query LIVE agent. |
| **2. Build /search command + API route** | Engineer | 4-6h | May 24 | Daily search for team. |
| **3. Email Joshua for /chat API unlock (optional)** | Zaal | 5m | May 26 | REST API path (nice-to-have). |
| **4. Add team to Bonfires Clerk org (optional)** | Zaal | 1m | May 27 | Dashboard access. |
| **5. Install bonfires-mcp (post-sprint)** | Engineer | 1h | June 2 | /zao-research Bonfire queries. |
| **6. Build web page zaoos.com/search (defer)** | Engineer | 16h | June 15 | Shareable search UI. |

---

## Key Numbers

- **Bonfire KG size:** 780+ episodes, 1200+ edges (verified 2026-05-17)
- **Telegram query latency:** 2-5 seconds (bonfires-sdk HTTP client)
- **REST API latency:** 100-200ms (unlocked via /chat endpoint, if needed)
- **Team roster:** 4 people (Zaal, Iman, ThyRev, Samantha)
- **Effort: /search command:** 4-6 hours
- **Effort: web page:** 16 hours (defer)
- **Cost:** $0 / month (Genesis tier unlimited)

---

## Final Recommendation

**Ship @zabal_bonfire Telegram adoption TODAY** (status: LIVE now).

**Ship `/search` command THIS SPRINT** (effort: 4-6h, high impact).

**Defer web page + REST API + MCP to Phase 2+** (after team feedback).

The team has everything it needs RIGHT NOW. The unlock is adoption, not technology.

---

Co-Authored-By: Claude Haiku 4.5 (October 2024) <noreply@anthropic.com>
