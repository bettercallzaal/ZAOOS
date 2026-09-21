---
topic: business
type: audit
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "business/429-paragraph-agents-launch-apr2026, cross-platform/2189-paragraph-brand-growth-playbook, business/2348-newsletter-craft-paragraph-mcp, business/1066-zaoonparagraph-buildout, identity/1270-zao-newsletter-paragraph-canonical-jul2026"
original-query: "Paragraph's new features - what the platform now offers that The ZAO newsletter is not using. Context: publication @thezao, 380 posts, free plan, API key works, no MCP in session, zero-AI-credit constraint."
tier: STANDARD
---

# 2527 - Paragraph features The ZAO is not using, and the one-line reason why

> **Goal:** Establish what Paragraph offers @thezao in September 2026, measured against the live publication, and explain why the newsletter lane has been hand-pasting for weeks while the capability sat installed two directories away.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **The Paragraph MCP in the newsletter repo** | RUN `claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp` inside `~/Desktop/repos/zaoonparagraph`. It is already configured in `ZAO OS V1` and `zabalgames` and absent from the newsletter repo, which has zero MCP servers. This single omission is why every Paragraph session in that lane has been limited to the thin public REST subset. Browser auth, no API key, no local install. |
| **X Articles** | USE `/api/v1/content`, not `/api/v1/posts`. Paragraph drafts X posts, LinkedIn posts, newsletters and X Articles into a content library. It drafts only and never sends; the writer sends from the Paragraph app. This CORRECTS the claim made to Zaal on 2026-09-20 that Paragraph had no X capability, which was drawn from the wrong endpoint. |
| **Publication settings** | USE the MCP `update-publication` tool for pinned posts, featured post and email-notification toggles, rather than clicking through the UI. @thezao currently has `pinnedPostIds: []` with a festival 13 days out. |
| **The analytics contradiction** | RESOLVE with the MCP `analytics` tools. The REST `views` field and the in-app Web analytics tab disagree by 65x on Day 258 over the same period. Until resolved, no reach claim about the newsletter is safe, including the "readership halved" claim this author made and withdrew on 2026-09-20. |
| **Playbooks (recurring workflows)** | EVALUATE, do not adopt blind. Paragraph's own welcome doc sells the agent on "recurring workflows that would otherwise eat your week". The 31-day ZAOstock run is exactly that shape. Gated on the credit question below. |
| **Agent credits** | UNCHANGED. Reid's 17 September note said the $50 was likely the last free top-up. The MCP and REST paths are API calls, not agent prompts, so they do not spend agent credits. Playbooks run the agent and therefore do. |
| **Free plan** | PRICE IT. `plan: free` confirmed via `/api/v1/me` and the app sidebar, against 380 published posts. Establish what the paid tier unlocks before the 3 October festival, not after. |

---

## The finding, in one line

Paragraph's capability was never the constraint. The MCP that exposes 29 tools is configured in `/Users/zaalpanthaki/Documents/ZAO OS V1` and `/Users/zaalpanthaki/Documents/zabalgames`, and **not** in `/Users/zaalpanthaki/Desktop/repos/zaoonparagraph`, the repo whose entire purpose is the newsletter. That repo's `mcpServers` list is empty.

Measured 2026-09-20 from `~/.claude.json`. The config carries no secret:

```json
{"type": "http", "url": "https://mcp.paragraph.com/mcp"}
```

Doc `business/429-paragraph-agents-launch-apr2026` documented the hosted MCP and the install command on 2026-04-17. It has sat unactioned in the newsletter lane for five months.

---

## What is live today, measured against @thezao

Every row below was verified against the live publication on 2026-09-20 with the repo's own `PARAGRAPH_API_KEY`. A deliberately wrong key returns `401 {"success":false,"msg":"Invalid API key."}`, so the 200s are real authentication and not an open endpoint.

| Surface | State on @thezao | Evidence |
|---|---|---|
| `GET /api/v1/posts` | 200, 380 posts, published only. Drafts are absent from the list and fetchable only by known id. | `pagination.total: 380` |
| `GET /api/v1/posts/{id}` | 200 on a draft, returns `status: draft` | Day 263 draft `sEEVjfXTNIFU6qKZuqsN` |
| `GET /api/v1/content` | 200, **8 items, all `kind: tweet`, all created 2026-08-10** | the drafted-content library |
| `GET /api/v1/subscribers` | 200, returns `email`, `walletAddress`, `createdAt`. No `total` in pagination, so the subscriber count is UNKNOWN from this route. PII: count only, never dump. | 6 of the first 10 carry a wallet address |
| `GET /api/v1/me` | 200, 17 publication settings | see settings table below |
| `GET /api/v1/emails` | 404 | control route also 404 |
| `GET /api/v1/analytics` | 404 | control route also 404 |
| `https://mcp.paragraph.com/mcp` | 401 unauthenticated, so the endpoint is live and gated | |
| `github.com/paragraph-xyz/skill` | 200, MIT (read from the LICENSE file, not the API field), last pushed 2026-09-01, 3 stars | actively maintained |

The `emails` and `analytics` 404s mean those capabilities are not on the public REST surface. The skill README lists both among the MCP's 29 tools, so they are reachable through the MCP and not through `curl`.

---

## The 29 MCP tools, versus what the newsletter lane has been using

The Paragraph CLI skill states the MCP server "exposes 29 tools (posts, content, publications, subscribers, coins, search, feed, users, me, analytics, emails)".

The newsletter lane has been using three REST endpoints via hand-rolled shell scripts in `automation/`: `create-draft.sh` (POST a draft), `update-draft.sh` (PUT), `set-thumbnail.sh`. Those work and `create-draft.sh` runs the voice check and refuses to push on a hard failure. They cover roughly a tenth of the surface.

**Tools the skill flags as recently added, each of which answers a live ZAO problem:**

| Tool | What it does | The ZAO problem it answers |
|---|---|---|
| `create-content`, `list-content`, `get-content`, `update-content`, `archive-content`, `restore-content` | Drafts X posts, LinkedIn posts, newsletters and **X Articles**. Drafts only, never sends. | The 17-day plan's rule that every artist piece becomes an X article the next morning. Currently a manual copy-paste. |
| `update-publication` | Settings, featured post, **pinned posts**, email-notification toggles | @thezao has nothing pinned with a festival 13 days out |
| `update-post` with `imageUrl` / `clearImage` | Set or remove a cover image | Covers are currently set through a separate `set-thumbnail.sh` |
| `update-post` with `publishedAt` | Backdate a post | The `published/` archive holds 11 of 380 editions |
| `send-custom-email` | Markdown email blast to a recipient list. Requires publication approval; returns 403 if not approved. | Untested on @thezao |
| `remove-subscriber` | Hard delete by email or wallet | Not currently needed |
| analytics tools | Not on REST | Would settle the 65x views contradiction below |

---

## The correction this doc exists to make

On 2026-09-20 this author told Zaal, in his own terminal: "Paragraph cannot post this for you. I checked its API and there are no social or X fields on a post at all."

That was drawn from `GET /api/v1/posts/{id}`, whose fields are `authorIds, categories, id, imageUrl, publishOnline, publishedAt, slug, status, subtitle, title, updatedAt`. The statement is true of that endpoint and false of the platform. X Articles live at `/api/v1/content`, which returned 200 and eight existing tweet drafts when finally queried.

The failure mode is the one `.claude/rules/state-claims.md` names: a proxy that was cheaper to reach than the truth. One endpoint was checked and the conclusion was written about the whole product.

---

## The analytics contradiction, unresolved

| Source | Day 258 views | Window |
|---|---|---|
| `GET /api/v1/posts` `views` field | 132 | all-time |
| In-app Analytics, Web tab, Top posts | 2 | last 14 days |

Day 258 published 2026-09-15, five days before measurement, so both windows cover the post's entire life. They disagree by 65x.

The in-app Web tab also reports 388 views over 14 days with an average read time of **1 second**, a chart that is flat zero on every day except a single spike on 17 September, and a Top posts list where editions from March, April, June, July and August each show exactly 2 views and 0 seconds read. That distribution is the signature of an automated crawl rather than an audience.

Two genuine reading signals exist in the same table: Day 258 at 55 seconds and Day 259 at 31 seconds. Both are ZAOstock artist editions.

**Most likely explanation, untested:** the REST `views` field includes email opens and the Web tab does not. If so, real readership is roughly 130 per edition. The MCP analytics tools are the way to test it. Until tested, treat every reach number as UNKNOWN.

---

## @thezao publication settings, live values

From `GET /api/v1/me`, 2026-09-20. All seventeen fields, with the five that matter called out.

| Setting | Value | Note |
|---|---|---|
| `pinnedPostIds` | `[]` | **nothing pinned, 13 days from the festival** |
| `featuredPost` | `popular` | with `showMostPopular` this drives the "Top" tab under every post |
| `showMostPopular` | `true` | the Top tab serves ZTalent posts from 2024 under every ZAOstock edition |
| `summary` | contains an em dash | renders under all 380 posts and in the subscribe popup, against the standing no-em-dash rule |
| `themeColor` / `headerFont` / `bodyFont` | all `default` | the ZAOstock design system (Oswald, Rubik, fireside `#C1662C`) is unused |
| `plan` | `free` | against 380 posts |
| `postListType` | `grid` | correct, covers are branded artwork |
| `enableSubscribePopup` / `enableSubscribeScroll` | both `true` | two prompts at one reader |
| `emailNotifications` | `{newSubscriber: true}` | fine |
| `name` / `slug` / `logoUrl` / `id` / `ownerUserId` | set and correct | logo is 2048x2048 |

---

## Also See

- [business/429 - Paragraph Agents Launch](../429-paragraph-agents-launch-apr2026/) - documented the hosted MCP and skill bundle on 2026-04-17. Note: doc number 429 is ambiguous and also resolves to `dev-workflows/429-claude-code-skills-deep-dive`.
- [cross-platform/2189 - Paragraph brand-growth playbook](../../cross-platform/2189-paragraph-brand-growth-playbook/) - DEEP tier, last validated 2026-08-03.
- [business/2348 - Newsletter craft + Paragraph MCP operations](../2348-newsletter-craft-paragraph-mcp/) - the operational MCP learnings from the Day 230/231 finals edition.
- [business/1066 - zaoonparagraph Build-Out](../1066-zaoonparagraph-buildout/) - the repo this doc audits.
- [identity/1270 - The ZAO Newsletter canonical reference](../../identity/1270-zao-newsletter-paragraph-canonical-jul2026/) - canonical figures. Note this doc measures 380 published posts, where 1270 records 400 editions.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp` in `~/Desktop/repos/zaoonparagraph` and complete browser auth, so the tool list shows `mcp__paragraph__*` in that lane | @Zaal | Terminal command | 2026-09-21 |
| Open the in-app Analytics **Newsletter** tab and screenshot it, settling whether the 132-vs-2 gap is email opens | @Zaal | Screenshot into the lane | 2026-09-21 |
| Pin the current ZAOstock edition via `update-publication` once the MCP is live; re-pin daily through 3 October | @Zaal | Setting change | 2026-09-22 |
| Remove the em dash from the publication `summary` in Paragraph settings | @Zaal | Setting change | 2026-09-22 |
| Set `themeColor`, `headerFont`, `bodyFont` from the ZAOstock design kit at zaostock.com/design | @Zaal | Setting change | 2026-09-24 |
| Draft the Day 263 X Article through `/api/v1/content` rather than by hand, proving the path end to end | @Zaal | Lane task, needs MCP first | 2026-09-22 |
| Price the paid plan against the free plan and decide before the festival | @Zaal | Decision | 2026-10-01 |

## Sources

- [business/429-paragraph-agents-launch-apr2026](../429-paragraph-agents-launch-apr2026/README.md) - **[FULL, method: local file read]** last-validated 2026-05-21, four months stale; its MCP and skill claims re-verified live today.
- [github.com/paragraph-xyz/skill](https://github.com/paragraph-xyz/skill) - **[FULL, method: `gh api` raw + base64 decode]** MIT read from the LICENSE file per Hard Requirement 13, pushed 2026-09-01, 3 stars.
- `paragraph-api/SKILL.md` and `paragraph-cli/SKILL.md` in that repo - **[FULL, method: `gh api contents` + base64 decode]** source of the 29-tool count and the recently-added tool list.
- [paragraph.com/docs/development/mcp](https://paragraph.com/docs/development/mcp) - **[FULL, method: curl + HTML strip]** HTTP 200, 791 words, confirms the hosted server and the `claude mcp add` command verbatim.
- [paragraph.com/docs/developers/drafted-content](https://paragraph.com/docs/developers/drafted-content) - **[PARTIAL - the slug falls back to the 265-word welcome page; the nav confirms the page exists but its body was not retrieved. Escalation not attempted beyond curl because the SKILL.md above documents the same feature FULL.]**
- Live `public.api.paragraph.com/api/v1/*` against @thezao - **[FULL, method: authenticated curl with a wrong-key control returning 401]** posts, content, subscribers, me, plus 404 controls on emails and analytics.
- `~/.claude.json` MCP configuration - **[FULL, method: local JSON parse with secret redaction]** the two projects carrying the paragraph server and the newsletter repo's empty list.
- In-app Analytics, Web tab, screenshot supplied by Zaal 2026-09-20 - **[FULL, method: image read]** 388 views / 14 days, 1s average read, the 17 September spike, and the Top posts table.
- Hacker News via the keyless Algolia API, query "paragraph.com newsletter" - **[FULL, method: `hn.algolia.com/api/v1/search`]** **0 hits**. Documented as a negative signal: Paragraph has no Hacker News discussion footprint, so no community sentiment is available from that surface.
