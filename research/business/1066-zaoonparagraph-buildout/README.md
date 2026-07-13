---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-13
related-docs: "1065"
original-query: "How ZAO builds out zaoonparagraph based on Paragraph creator-feedback interview - turn the meeting with the Paragraph team (Colin Armstrong, Reid DeRamus) + Zaal into a concrete build-out plan"
tier: STANDARD
---

# 1066 - zaoonparagraph Build-Out from Creator Interview

> **Goal:** Split Zaal's feedback from the Paragraph team call into immediate builds on the existing Paragraph API, feature requests to send via email, and longer-term strategic bets. Provide concrete first-move recommendations.

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---|---|
| **Publish vehicle for build-now work** | Keep zaoonparagraph as the integration repo; automate INTO the existing `paragraph.com/@thezao` publication via the Paragraph API (already live) | 400+ editions archived + 78 paid supporters already on @thezao; no risk in continuing to use it as the shipping surface. zaoonparagraph can coordinate draft-to-publish pipeline |
| **Native AI agent vs. custom pipe** | Keep custom voice-checked pipeline for newsletter drafting; try native agent in a read-only narrow lane (SEO audits, archive optimization) | Paragraph agent shipped 2026-07-07 as a generic "daily suggestions" model. ZAO's handcrafted voice (all lowercase, zero commas, no em dashes, exact signoff) requires human guardrails the agent's permission model doesn't describe having. Low-risk pilot now, full adoption later if guardrails ship |
| **Multiple newsletters on one account** | Proceed with multiple publications feature test - ship a second Paragraph publication (e.g., "The ZAO Research" or "ZABAL Games") inside the same @zaal account | Paragraph shipped this in Aug 2025; test with research/podcast content before full rollout. One account = one API key = simpler automation |
| **Writer Coin launch timing** | Launch Writer Coin for @thezao after Respect + ZABAL ecosystem stabilizes (Q3 2026); request feature: coin supply allocation tools from Paragraph | Current ZABAL + ZOL + ZOE token stack is 3 surfaces already. A Writer Coin is a fourth token narrative - needs deliberate positioning, not default auto-launch. Paragraph's discovery-feed visibility is real (5% supply retroactive rewards, writer-coin launches get feed placement), so timing matters |
| **Headless + ICM boxes** | Build headless archive on this repo + wire ICM context boxes for Paragraph publication metadata (author, subscriber count, archive links) | Paragraph API `GET /v1/publications/{id}/posts` is public, no key needed. Existing proof-of-concept fetches 3 most recent posts - scale this to full searchable archive. ICM boxes extend reachability to AI agents querying ZAO context |
| **Farcaster integration depth** | Ship Paragraph Mini App frame integration (already shipped by Paragraph 2026-01-15, in docs); request: deeper Farcaster native cast creation (not just embed/preview) from Paragraph team | Mini App is live today. Draft-to-cast flow is the harder ask - depends on Farcaster Mini App + Frames spec. Request it, use existing tools meanwhile |

## What We Can Build NOW on Paragraph API (immediate, existing surface)

### Build 1: Headless Archive + Pagination
**Concrete step:** Extend zaoonparagraph's `index.html` to a full archive page that paginates all 400+ published posts via `GET /v1/publications/@thezao/posts` with cursor. Render full content with `includeContent=true`. Ship as a static page on this repo or as an embedded component.

**Why it matters:** Paragraph.com design is ZAO-agnostic. A ZAO-controlled archive page (searchable, sortable by date/theme, styled to ZAO brand) gives 400+ editions a permanent home independent of Paragraph's own design choices. Proof already exists - see the 2026-07-10 experiment doc in zaoonparagraph/research/.

**File to edit:** `/tmp/zaoos-shallow/` → create zaoonparagraph feature branch with `archive.html` component.

**APIs used:** `GET /v1/publications/{publicationId}/posts` (public, no auth), `GET /v1/publications/{id}` (for subscriber count, author, publication metadata).

**Ship criteria:** Archive page resolves to a working URL, displays 10+ posts, pagination works, page links from the main @thezao publication description.

### Build 2: Analytics Dashboard in Draft
**Concrete step:** Wire Paragraph's analytics SQL endpoint (`POST /v1/analytics/run-query`) into zaoonparagraph's draft-creation flow to pull real subscriber count, week-over-week growth, top posts by opens/clicks before each newsletter goes out. Surface these metrics in the draft pre-flight so Zaal can cite data ("it reads the record not your word").

**Why it matters:** ZAO's voice already claims data-driven positioning. Pulling real Paragraph subscriber/engagement numbers into the newsletter itself is one sentence per edition and a unique angle (most newsletters ignore their own analytics).

**APIs used:** `POST /v1/analytics/run-query` (authenticated, Paragraph API key).

**Query examples (ship-ready):**
```sql
SELECT DATE_TRUNC('week', opened_at) AS week, COUNT(*) AS opens 
FROM events WHERE event_type = 'open' 
GROUP BY DATE_TRUNC('week', opened_at) 
ORDER BY week DESC LIMIT 12;
```

**File to edit:** `zaoonparagraph/automation/create-draft.sh` - add an optional `--analytics` flag that injects subscriber count + top-3-posts-this-week into the draft preamble.

**Ship criteria:** Flag works, pulls real data (tested locally), draft contains a live metric from Paragraph.

### Build 3: Multiple Publications Test
**Concrete step:** Create a second Paragraph publication called "The ZAO Research" (or "ZAO Research Dispatch") under the same @zaal account (via Settings > Publications > Add Publication). Wire zaoonparagraph automation to handle BOTH publications - flag in `create-draft.sh` to specify which pub (defaulting to @thezao).

**Why it matters:** Test Paragraph's multiple-publication support (Aug 2025 feature) with real content before a full spin-out. ZABAL Games research, GEO docs, and long-form strategy all belong in their own publication with their own subscriber base + potential Writer Coin. Paragraph's one-account-N-pubs model makes this clean.

**APIs used:** `POST /v1/publications` (create new pub), all existing endpoints scoped by `publicationId`.

**File to edit:** `zaoonparagraph/.env` - add `PARAGRAPH_PUB_ID` and `PARAGRAPH_PUB_ID_RESEARCH` (two keys).

**Ship criteria:** Second publication created + a test draft posted to it + both pubs have subscriber forms working.

### Build 4: Remix + Comment Threads Integration
**Concrete step:** Enable Remixes on @thezao publication (shipped Aug 2025, requires Settings toggle on Paragraph). Add note in drafts template encouraging readers to remix + link to top remixes in weekly recap editions.

**Why it matters:** Remixes are Paragraph's version of collaborative response threads with shared revenue - unique to their platform. Low effort to enable (one settings toggle), and it unlocks reader-authored follow-ups that deepen the conversation loop.

**File to edit:** `zaoonparagraph/templates/weekly-recap.md` - add a "Top Remixes This Week" section that manually links to the best community responses.

**Ship criteria:** Setting enabled on Paragraph, first remix published by a reader, recap template includes remix callout.

### Build 5: Paragraph + zabalnewsletterbuilder Bridge
**Concrete step:** After zabalnewsletterbuilder generates each day's 3-snippet digest, auto-post a draft to Paragraph via the existing `create-draft.sh` pipeline instead of manually copy/pasting. Add a Supabase webhook from zabalnewsletterbuilder that triggers `automation/create-draft.sh <title>` when a newsletter is ready for review.

**Why it matters:** Today's flow: zabalnewsletterbuilder (daily-3 generator on Vercel) -> manual copy/paste to zaoonparagraph -> manual Paragraph draft creation. Automating the Paragraph step closes the loop and lets Zaal's daily 4:30am-7pm build window flow uninterrupted.

**Files to edit:** 
- `zaoonparagraph/automation/create-draft.sh` - add a mode to accept piped JSON input from webhook
- zabalnewsletterbuilder's webhook config to POST to a zaoonparagraph endpoint (or Telegram command that Zaal trusts)

**Ship criteria:** Webhook fires, draft lands on Paragraph, no manual copy/paste step needed.

## What to REQUEST from Paragraph (Email Follow-Up)

Synthesized from the meeting topics (Colin Armstrong, Reid DeRamus - 2026-07-11):

| Request | Why | Priority |
|---------|-----|----------|
| **BYOK (Bring Your Own Keys) for AI agent** | ZAO voice is non-negotiable; Paragraph's native agent is generic. Allow API key holders to override the agent's system prompt or provide a custom model endpoint (local + remote). Reference: Jailbreak in real-time without forking the codebase. | HIGH - voice control is core to ZAO's differentiation |
| **Local model fallback for AI features** | Some features (draft suggestions, SEO audits) could run on-device (Llama, Mistral) when internet is spotty or for privacy. Paragraph to support local LLM endpoints in settings. | MEDIUM - Nice-to-have for autonomous loops; not essential for 2026 |
| **Native Farcaster cast creation** | Today's integration is Mini App embed + post preview. Shipped feature: write a draft on Paragraph, auto-create a native Farcaster cast without leaving the dashboard (not just a link + preview). Similar to Twitter integration on Substack. | HIGH - Farcaster is ZAO's home; native cast creation closes the loop |
| **GitHub integration** | Auto-commit drafts to a GitHub repo, auto-create PRs for review, link commits in published post metadata. One source of truth: GitHub as the writer's local archive, Paragraph as the public-facing surface. | MEDIUM - Enables versioning + git-based collab; lower priority than cast creation |
| **ICM (Influence Catalog Metadata) context box export** | Generate a structured JSON export of publication metadata (author, subscriber count, top posts, tagline) suitable for inclusion in AI context boxes (useicm.com format). Paragraph can ship this as a Settings > Export option. | MEDIUM - Niche for AI agents, big for ZAO's GEO/canonical-answer work |
| **Credit usage visibility in API responses** | When creating drafts, querying analytics, or using the agent, return a `X-Credits-Used` header + running balance. Today's dashboard doesn't show per-operation credit costs - hard to forecast spending. | LOW - Nice for budgeting; not blocking |
| **Bulk subscriber export with segmentation** | Export subscribers filtered by: paid vs. free, join date ranges, engagement level (opens/clicks last 30 days). Today's export is a flat CSV. Segmentation enables targeted remixes (e.g., "message for 90-day vets" remix template). | LOW - Useful for advanced campaigns; can workaround with manual SQL on analytics endpoint |
| **Live-streaming integration** | Embed a live stream (Twitch, Restream, Cal.com event) directly in a Paragraph post or as a post type (like a special "Live Coverage" edition). Reader tuning in sees the stream + chat directly from Paragraph. | LOW - Optional for events; can embed manually for now |
| **Headless CMS mode documentation** | Publish a documented "Build a Headless Site on Paragraph" guide showing the GET /posts endpoint + example client-side archive/search implementations. Paragraph doesn't market this; make it official. | MEDIUM - Opens third-party integrations; benefits all publishers |

**Email draft to Colin + Reid:** (will be in Next Actions)

## Longer-Term Bets (Q3+ 2026)

| Bet | Shape | Timeline |
|-----|-------|----------|
| **ZAO Research publication** | Spin out research docs (the 820+ docs in ZAOOS/research) into their own Paragraph publication with a Writer Coin launch. Test multiple-publication workflow + token narrative separation. | After Build 3 + Respect stabilization (Q3) |
| **ZABAL Games spotlight newsletter** | ZABAL Games mentors (Tyler/Magnetic, Arthur/Neynar, etc.) become contributors to a ZAO Research publication. Paragraph's Remix feature lets them respond directly + share revenue. | Q3-Q4 2026 |
| **Agent inbox integration** | Connect ZOE (the orchestrator) to Paragraph's API to auto-draft weekly recaps + summaries of ZAO activity (new members, top posts, proposals, ZOL signer actions) without manual work. | Q3 2026 (depends on Paragraph's agent guardrails shipping) |
| **Arweave archive verification** | Every published post auto-mints to Arweave. Pull Arweave CID into ZAO's knowledge graph (Bonfire/ICM) for permanent, decentralized record. | Q4 2026 (infrastructure play) |

## Numbers & Context

- **400+ newsletter editions** published across Year of the ZAO / Year of the ZABAL / ZTalent.
- **78 paid supporters** on Paragraph (recurring revenue via subscriptions).
- **1 publication** today (@thezao); 0 secondary publications yet.
- **API surface:** 50+ endpoints available; 5 currently used (drafts, posts, publications, subscribers, analytics).
- **Paragraph timeline:** Founded 2022, $1.7M pre-seed Oct 2022, $5M Series A from USV/Coinbase 2024. Mirror acquired May 2024, migration complete Sept 2025. AI-native positioning launched April 2026, built-in per-publication agents launched July 7 2026.
- **Automation built:** `create-draft.sh` (push to Paragraph), `update-draft.sh` (revise), `archive-issue.sh` (mark published), voice/link checkers (pre-flight), analytics queries (manual).

## Also See

- [Doc 1065](../1065-zaoos-repo-estate-census/) - infrastructure census of ZAO repos
- zaoonparagraph/research/2026-07-09-paragraph-platform-potential.md - deeper platform audit (existing in the repo)
- zaoonparagraph/research/2026-07-10-headless-paragraph-experiment.md - proof-of-concept for headless archive
- zabalnewsletterbuilder repo - daily-3 newsletter generator (separate Vercel project)
- [Paragraph API Docs](https://paragraph.com/docs) - official reference
- [Paragraph MCP Server](https://paragraph.com/docs/development/mcp.md) - connect AI agents

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|---|
| Review & approve build prioritization (Build 1-5 order, timeline split) | @Zaal | Decision | 2026-07-15 | Written decision + branch-out order |
| Send feature-request email to Colin + Reid (BYOK, Farcaster cast creation, ICM export, headless docs) | @Zaal | Email/Outreach | 2026-07-16 | Email sent with specific ask + context; cc loop |
| Implement Build 1: Headless archive page with pagination | @Zaal | Code | 2026-07-22 | Branch merged, archive.html live at zaoonparagraph, resolves to working URL, displays 10+ posts |
| Implement Build 2: Analytics dashboard in draft pre-flight | @Zaal | Code | 2026-07-29 | `--analytics` flag works, pulls real Paragraph data into draft preamble |
| Test Build 3: Create second publication (@thezao-research or @research) | @Zaal | Experiment | 2026-08-05 | Second pub created, test draft published, both publications have subscriber forms |
| Enable Build 4: Remixes + update weekly-recap template | @Zaal | Toggle + Edit | 2026-07-20 | Setting enabled on Paragraph, template includes remix section |
| Plan Build 5 webhook architecture (zabalnewsletterbuilder -> zaoonparagraph) | @Zaal | Planning | 2026-07-24 | Design doc with hook URL + payload shape + error handling strategy |
| Implement Build 5 webhook + auto-draft flow | @Zaal | Code | 2026-08-12 | Webhook fires end-to-end, draft lands on Paragraph without manual copy/paste |
| Revisit Writer Coin launch decision after Respect + ZABAL stabilize | @Zaal | Review | 2026-09-01 | Decision memo: launch or defer + rationale |
| Monitor Paragraph agent guardrails (follow up on BYOK request) | @Zaal | Monitoring | Monthly check-ins starting 2026-07-16 | Track feature requests; evaluate agent for draft automation once guardrails ship |

## Sources

- [Paragraph platform potential audit](../1065-zaoonparagraph-buildout/zaoonparagraph-research-2026-07-09.txt) `[FULL]` - zaoonparagraph repo, 2026-07-09 research session
- [Paragraph headless experiment](../1066-zaoonparagraph-buildout/headless-experiment-2026-07-10.txt) `[FULL]` - zaoonparagraph repo, proof-of-concept with screenshot
- [Paragraph API reference](https://paragraph.com/docs/api-reference/) `[FULL]` - official docs fetched 2026-07-13, llms.txt endpoint index
- [Paragraph AI agent launch](https://paragraph.com/@blog/the-new-paragraph) `[FULL]` - blog post 2026-07-07, describes new built-in agent
- [Paragraph multiple publications](https://paragraph.com/docs/publish/multiple-publications.md) `[FULL]` - official docs, feature shipped Aug 2025
- [Paragraph Writer Coins](https://paragraph.com/docs/earn/writer-coins.md) `[FULL]` - official docs, launched Nov 2025
- [Paragraph Farcaster Mini App](https://paragraph.com/docs/grow/farcaster-miniapp.md) `[FULL]` - official docs, shipped Jan 2026
- [Paragraph Remixes](https://paragraph.com/docs/earn/remix.md) `[FULL]` - official docs, launched Aug 2025
- [Paragraph CLI + SDK](https://paragraph.com/docs/development/cli/index.md) `[FULL]` - official docs, live examples
- zaoonparagraph/automation/create-draft.sh `[FULL]` - existing integration script, verified 2026-07-13
- zabalnewsletterbuilder repo (separate Vercel project, linked in CLAUDE.md) `[PARTIAL]` - runbook exists, full webhook integration spec to be designed
