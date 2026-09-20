---
topic: security
type: guide
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "2433, 2412, 2411, 2473"
original-query: "Research the Canva Connect API's authorization and permission model. STANDARD-to-DEEP depth. Core question: why can an authenticated Canva integration READ a design that was shared with it by link, but be refused when it tries to open an edit transaction, copy the design, or export it? Measured facts from a live session 2026-09-20, design id DAG9Qtzie0M: read-design succeeds via the full share URL; open-editing-transaction, copy-design and get-export-formats all fail with permission_denied / \"Not allowed to access design\"; copy-design and export-design accept only a bare 11-char design id and reject a full URL. Cover the OAuth/PKCE flow and full scope list, design ACL model (owner/team/shared/anyone-with-link), whether a grant needs acceptance and whether it propagates immediately, Enterprise vs Pro/Free gating for brand kits/templates/Autofill, the Connect API vs Canva MCP server distinction, and rate limits/export polling."
tier: DEEP
---

# 2515 — Canva Connect API authorization and permission model: why READ succeeds and EDIT/COPY/EXPORT fail on the same shared design

> **Goal:** Explain, from Canva's own documentation, why an authenticated Canva integration can read a design shared with it by link (DAG9Qtzie0M) but gets `permission_denied` when it opens an editing transaction, copies the design, or exports it — and give the exact scopes, capabilities, tiers, and rate limits that govern each operation.

## Key Decisions

| # | Recommendation |
|---|---|
| 1 | Treat this as an **ACL problem, not a scope problem**. The fix is asking the design owner to re-share DAG9Qtzie0M with "Can edit" (not "Can view"/"Can comment"), not adding OAuth scopes — the token already has enough scope for `get-design` to succeed, and Canva's own error taxonomy separates `missing_scope` from `permission_denied`. |
| 2 | **Do not request `design:permission:read` or `design:permission:write` scopes for any ZAO integration.** They do not exist in Canva's current official scope table (18 scopes total, fetched 2026-09-20). Anyone who put them in a scope list (including this task's own framing) got it from an unverified source — flag and correct it. |
| 3 | Even once "Can edit" is granted, **do not assume copy or download/export will start working for a non-owner, non-team guest.** Canva's own Help Center states that under a "Can edit" collaboration link, guests explicitly cannot "Make a copy of the design," "Publish," or "Download the design" — those are separate, higher-tier permissions (team membership or ownership), not unlocked by "Can edit." |
| 4 | **Editing transactions do not exist in the public REST Connect API at all** — confirmed by enumerating all 111 `/docs/connect/*` and 18 `/docs/mcp/*` URLs in Canva's own sitemap. `start-editing-transaction` / `perform-editing-operations` / `commit-editing-transaction` / `cancel-editing-transaction` are MCP-only tools (`docs/mcp/tools/*`), not REST endpoints (`docs/connect/api-reference/*`). No Connect API access token, however scoped, can open one outside the MCP surface. |
| 5 | `copy-design` is also MCP-only — it is listed in the MCP tools rate-limit table (`docs/mcp/tools/`, 20 req/min, all plans) but there is **no `/v1/designs/{id}/copy` or `create-design-copy` REST endpoint** in the Connect API reference. This is exactly why the design-id-only regex in the failing tool call exists — there was never a URL-shaped parameter to accept, because the underlying Canva-side call is not a public REST endpoint. |
| 6 | For ZAO's own Canva brand kits (used today for `generate-design`/`export-design`): **`brand_template` capability requires Canva Pro, Teams, or Enterprise** (any paid plan with brand template access); **`autofill` capability and `get-brand-template-dataset` require Canva Enterprise specifically.** Confirmed identically in two independent Canva doc pages (capabilities appendix and MCP tools/rate-limits page) — do not conflate the two tiers when scoping future Autofill work. |

## Findings

### 1. It is OAuth 2.0 + PKCE, not OAuth 2.1 — and the full scope list is 18 scopes, not the assumed 13

Canva's own authentication guide states verbatim: *"the Connect APIs use OAuth 2.0 with the Authorization Code flow with Proof Key for Code Exchange (PKCE) using SHA-256."* It never says OAuth 2.1 anywhere in the fetched page. **Flagging a contradiction:** the research brief that spawned this doc assumed "OAuth 2.1/PKCE" — Canva's docs call it OAuth 2.0+PKCE. This is a naming distinction (OAuth 2.1 is a not-yet-final IETF draft that mandates PKCE; Canva implements PKCE under the OAuth 2.0 umbrella) but it means integrations should not describe Canva as "OAuth 2.1-compliant" in any external-facing doc.

The authorization URL format:
```
https://www.canva.com/api/oauth/authorize?code_challenge=<...>&code_challenge_method=s256&scope=<scopes>&response_type=code&client_id=<id>&state=<...>&redirect_uri=<uri>
```
`code_verifier` (43-128 chars) → SHA-256 → base64url `code_challenge`. Scopes must be pre-registered in the integration's Developer Portal settings before they can be requested at authorization time — you cannot request a scope you haven't enabled for the integration.

**The authoritative scope table** (`https://www.canva.dev/docs/connect/appendix/scopes/`, fetched in full, 18 rows):

| Scope | Description |
|---|---|
| `asset:read` | View metadata for the user's assets |
| `asset:write` | Upload, update, or delete assets on the user's behalf |
| `brandtemplate:content:read` | Read the content of brand templates in the user's brand |
| `brandtemplate:content:write` | Publish brand templates in the user's brand |
| `brandtemplate:meta:read` | View metadata of brand templates in the user's brand |
| `collaboration:event` | Receive webhook notifications about events relevant to the user |
| `comment:read` | View comments on the user's designs and metadata |
| `comment:write` | Create comments and replies on the user's designs |
| `design:content:read` | View the contents of the user's designs |
| `design:content:write` | Create designs on the user's behalf |
| `design:meta:read` | View metadata of the user's designs |
| `email` | Read user email via OIDC |
| `folder:permission:write` | Set/update/remove permissions on the user's folders |
| `folder:read` | View metadata and contents of the user's folders (incl. Projects) |
| `folder:write` | Add/move/remove the user's folders; edit folder metadata |
| `openid` | Read user info via OIDC |
| `profile` | Read user profile info via OIDC |
| `profile:read` | Read a user's profile and account information |

**Correction to the task's assumed list:** `design:permission:read`, `design:permission:write`, and `asset:write` (present but check exact casing) — of these, `design:permission:read` and `design:permission:write` **do not appear anywhere in this table.** There is a `folder:permission:write` scope (folder-level only, no `folder:permission:read` counterpart either) but nothing design-permission-scoped. Scopes are also strictly additive/explicit per the docs: requesting `asset:write` does **not** imply `asset:read` — both must be requested separately.

**Which scope governs which operation, per the exact endpoint docs (not the general table):**
- `GET /v1/designs/{designId}` (get-design) → requires `design:meta:read` only. 100 req/min per user.
- `GET /v1/designs/{designId}/export-formats` (get-export-formats) → requires `design:content:read`. 100 req/min per user.
- `POST /v1/exports` (create-design-export-job) → requires `design:content:read` (not `design:content:write`). 20 req/min per user (endpoint), plus integration/document/user throttles (see Rate Limits below).
- `GET /v1/users/me/capabilities` → requires `profile:read`. 10 req/min per user.

None of the four operations in the failing session (edit transaction, copy, export-formats) is blocked by a missing scope per these pages — `export-formats` needs `design:content:read`, which a working `get-design` call's token plausibly already has requested (same integration). The failures are `permission_denied`, Canva's separate authorization-on-the-resource error code (see Finding 3).

### 2. The design ACL model: link sharing has three tiers, and "anyone with the link" defaults to view

Canva's own Help Center (`canva.com/help/collaborate-with-anyone/`, `canva.com/help/cant-edit-shared-design/`) — fetched in full — describes the product-level sharing model that the Connect API/MCP inherits:

- A design's share link carries **one of three levels**: **Can view**, **Can comment**, **Can edit**. The owner sets this explicitly (design defaults to "Only you can access" until changed).
- **Can't-edit troubleshooting page confirms the most common cause verbatim:** *"You only have view or comment-only access to the shared design... Ask the owner of the design to re-share the design with you and make sure to give you edit access."* This matches the measured session exactly: `read-design` succeeded because `design:meta:read`/`design:content:read` only require the equivalent of **view** access; opening an editing transaction needs **edit** access specifically, and the invite email's link (framed as "would like you to take a look at the design") is language consistent with a **view-level** share, not an edit-level one.
- **Even under a "Can edit" link**, Canva's own docs list what a guest still cannot do: *"Upload content or files... Add, edit, or resolve a comment [without login]... Share the design... Change design link permissions... **Make a copy of the design.** ... Print the design. **Publish or download the design.**"* This is the direct, sourced answer to why `copy-design` and export could plausibly still fail even after an edit-level grant — copy and download/export sit on a **separate, higher tier** (team membership or ownership) in Canva's product model, not unlocked by "Can edit" alone for a non-team guest.
- Team/account mismatch is a second documented cause: *"If a design is shared with a team, you can't access it if you're not part of the team or if you're trying to open it from your personal account."*
- **`SHARE_DESIGNS_EXTERNALLY_VIA_LINKS` (Canva Enterprise Audit Logs action taxonomy, `docs/audit-logs/actions/permissions-and-settings/`)** independently confirms two distinct link types at the admin-policy level: **"public view links"** and **"collaboration links"** — i.e., Canva's own permission model treats "viewable by link" and "collaboratively editable by link" as structurally different grants, not two settings of the same grant.

**On whether link sharing grants API access at all:** yes, but only up to the level the link encodes. The share-URL's embedded `accessToken` in the task's measured case (`https://www.canva.com/design/DAG9Qtzie0M/<token>/edit`) is Canva's internal collaboration-link token (a product-level, per-share credential), separate from the OAuth Bearer token used by the Connect API/MCP call. The MCP `read-design` tool evidently accepts and resolves that link token to fetch view-level metadata; it does not — and by the ACL model above, structurally cannot — upgrade the acting user's edit/copy/export rights on that design, because those rights are a property of the design's ACL for that user's account, not of the link.

### 3. `permission_denied` is a standardized Connect API error code, distinct from `missing_scope` and `not_found`

Canva's error-responses page (`docs/connect/error-responses/`, fetched in full) lists the complete error-code enum (curl-verified, ~90 codes) and gives explicit troubleshooting guidance for the three relevant codes:

| Code | Meaning per Canva's docs |
|---|---|
| `missing_scope` | "The access token doesn't include a required scope for this endpoint." → re-authorize with the missing scope. |
| `permission_denied` | "The user doesn't have permission to access the specified resource, such as a design." → this is an ACL failure on the resource, not a token/scope failure. |
| `design_not_found` / `not_found` | "The design doesn't exist or isn't accessible... may have been deleted or is in a team the user can't access." |

Both measured failures ("Could not open an editing transaction... Not allowed to edit this design DAG9Qtzie0M", code `permission_denied`, and "Not allowed to access design with id 'DAG9Qtzie0M'" for copy/export-formats) map cleanly onto the documented `permission_denied` semantics: valid token, valid scope, resource exists and is even readable — but the acting user's ACL entry for that specific design doesn't include edit/copy/export-level access.

### 4. Editing transactions and copy-design are MCP-only surface, not in the public Connect API

Enumerated every `/docs/connect/*` URL (111 total) and every `/docs/mcp/*` URL (18 total) from Canva's sitemap (`canva.dev/sitemap.xml`, fetched in full, 209KB). The full Connect API reference (`/docs/connect/api-reference/*`) covers: analytics, assets, authentication, autofills, brand-templates, comments, design-imports, designs (create/list/get/get-pages/get-export-formats/get-dataset — **no edit, no copy**), exports, folders, merges, resizes, users, webhooks. There is no `/docs/connect/api-reference/designs/create-design-edit-url/` or `/create-design-copy/` page — both 404 (confirmed by fetching them directly: identical 20,803-byte Canva 404 shell for each).

The editing-transaction tools and `copy-design` live exclusively under `/docs/mcp/tools/*` (Canva MCP / "Canva AI Connector," server at `https://mcp.canva.com/mcp`) — a **separate product from the "Dev MCP server"** at `docs/connect/mcp-server/` (installed via `npx @canva/cli mcp`, for AI-assisted *building* of Canva Apps/integrations, not for driving designs). Do not conflate the two in future ZAO docs — the design-editing MCP tools (`read-design`, `copy-design`, `start-editing-transaction`, etc., what `mcp__claude_ai_Canva__*` wraps in this session) come from the Canva AI Connector / MCP server (`docs/mcp/`), not the Dev MCP.

From the Canva MCP overview page (`docs/mcp/`, fetched in full), the permission model is stated explicitly and is the single most direct answer to the core question: *"The operations available to a user match their level of access to a design or asset. For example, editing operations are only available on designs and assets for which you have edit permissions."* And separately: *"Canva stores and manages designs, assets, and permissions on a per-user basis, not at the organization level."*

The MCP editing-transaction flow itself (three tools, all fetched in full): `start-editing-transaction` opens a transaction and returns `transaction_id` plus editable `richtexts`/`fills` with `element_id`s; `perform-editing-operations` applies edits by `transaction_id` + `element_id`, staying in draft; `commit-editing-transaction` persists the draft — and can fail if the design was edited concurrently in the browser during the transaction ("its snapshot is stale... cancel it, start a fresh transaction, re-apply, and commit"). None of these three pages document a permission check step distinct from the general per-design ACL check already described.

**Related but distinct reliability issue (community source, not the same failure mode):** `anthropics/claude-code` issue #33124 (closed, 4 comments, fetched in full via `gh api`) reports the built-in `mcp__claude_ai_Canva__start-editing-transaction` tool hanging indefinitely (no response, no error, no timeout) on a 20-page design, while `get-design`/`get-design-content`/`get-design-pages` on the same design respond instantly. This is a **hang**, not a `permission_denied`, and the issue was closed by a stale-bot with no root-cause confirmed from Anthropic or Canva. Note it as a known adjacent flakiness in the same tool family — do not assume it's the same bug as this doc's core question.

### 5. Enterprise vs Pro vs Free gating — confirmed from two independent pages

**Connect API capabilities** (`GET /v1/users/me/capabilities`, `docs/connect/api-reference/users/get-user-capabilities/`, fetched in full — response schema lists the exact enum):

| Capability | Required for | Who has it |
|---|---|---|
| `analytics` | Design analytics APIs | Canva Enterprise org members only |
| `autofill` | Autofill APIs | Canva Enterprise org members only |
| `brand_template` | Brand template APIs | Canva Pro, Canva Teams, **or** Canva Enterprise |
| `export_png_transparency` | Transparent-background PNG export | Any paid Canva plan (e.g. Pro) |
| `resize` | Design resize jobs | Canva plan with premium features (e.g. Pro) |
| `team_restricted_app` | Team-restricted apps | Canva Enterprise or Canva for Education org members |

**MCP tool plan-availability table** (`docs/mcp/tools/`, fetched in full) is an independent cross-check and agrees exactly:

| MCP tool | Rate limit | Plan |
|---|---|---|
| `search-brand-templates`, `list-brand-kits` | 100 req/min | Pro and above |
| `create-design-from-brand-template` | 20 req/min | Pro and above |
| `autofill-design` | 60 req/min | **Enterprise only** |
| `get-brand-template-dataset` | 100 req/min | **Enterprise only** |
| `resize-design` | 20 req/min | Pro and above |
| `copy-design` | 20 req/min | All plans |
| `export-design` | 20 req/min | All plans* (quality varies: free = standard, Pro+ = lossless PNG/transparent bg/premium elements; any plan can hit `license_required` if the design has premium elements) |
| `get-design` / `get-export-formats` / `get-design-content` / `get-design-pages` | 100 req/min | All plans |
| `start/perform/commit/cancel-editing-transaction` | 20/50/20/20 req/min | All plans |
| `upload-asset-from-url` | 30 req/min | All plans |

**Precise answer to the task's tier question:** brand template *browsing/using* is not Enterprise-gated — it's Pro-and-above. Only Autofill (`autofill-design`) and reading a template's fillable-field dataset (`get-brand-template-dataset`) require Enterprise specifically. This is a meaningful distinction for ZAO's own Canva usage (doc 2433 confirmed ZAO has 16 brand kits and used `export-design` against the `Paragraph` brand kit `kAG4P6WcbYY`, so ZAO is at minimum on a Pro-tier-equivalent seat for brand_template capability to have worked there).

### 6. Rate limits and export-job polling

**Connect API REST endpoints** (per-endpoint docs, fetched in full):
- `GET /v1/designs/{id}`: 100 req/min per user.
- `GET /v1/designs/{id}/export-formats`: 100 req/min per user.
- `POST /v1/exports` (create export job): **20 req/min per user** (endpoint-level), plus three additional throttles stacked on top — **integration**: 750 exports/5-min window, 5,000/24h; **document**: 75 exports/5-min window per document; **user**: 75/5-min, 500/24h. Download URLs from a completed export are valid for **24 hours**.
- `GET /v1/users/me/capabilities`: 10 req/min per user.

**Async job pattern** (`docs/connect/api-requests-responses/`, fetched in full): create-job endpoints return `{job: {id, status: "in_progress"}}` immediately; poll the corresponding get-job endpoint until `status` transitions to `success` or `failed`. Canva's explicit recommendation is **exponential backoff** starting from a short interval up to a capped max interval — no fixed poll cadence is mandated. Free-plan users can get **trial quotas** on some premium async APIs (e.g., resize) — a documented example gives 2 lifetime uses — flagged in the docs as a preview feature that can change without a new API version.

**MCP tool rate limits** (`docs/mcp/tools/`) are a separate, tool-level throttle layer on top of whatever the underlying Connect-API-equivalent call allows — see the full table in Finding 5. `resolve-shortlink` is the only MCP tool with no stated limit.

## Contradictions Flagged

1. **OAuth version:** task brief assumed "OAuth 2.1/PKCE"; Canva's authentication guide says "OAuth 2.0 with... PKCE." Use OAuth 2.0+PKCE in any ZAO-authored description of Canva's flow.
2. **Scope list:** task brief assumed `design:permission:read`/`design:permission:write` scopes exist. They do not appear in Canva's fetched, authoritative 18-scope table (checked 2026-09-20). If a future Canva changelog adds them, this doc's `last-validated` date should be the trigger to re-check — Canva does version its API (`docs/connect/versions/`, not fetched this pass) and ships a changelog (`docs/connect/changelog/`, not fetched this pass; flag as PARTIAL coverage of point 1's scope-list stability over time).
3. **`docs/connect/mcp-server/` vs `docs/mcp/`:** these are two different products (Dev MCP for building integrations vs. the Canva AI Connector/MCP for driving designs) that share the word "MCP" and are easy to conflate. This doc treats them as distinct; any future ZAO doc citing "the Canva MCP server" should specify which one.

## Also See

- [Doc 2433](../../dev-workflows/2433-mcp-connectors-together/) — DEEP-tier measurement of ZAO's live Canva MCP connector (16 brand kits, 50+ designs) alongside 11 other connectors; this doc supplies the authorization/permission mechanics behind that connector's observed behavior.
- [Doc 2412](../../infrastructure/2412-dead-mcp-servers-vault-board-integration/) — found Canva's connector auth-stub-only at the time it was written; superseded in practice by 2433's later "Canva full" measurement.
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) — measured Canva MCP tool call volume (1 call in the audited window) against the mandated-but-unused tool set.
- [Doc 2473](../../agents/2473-orchestrator-capability-audit/) — measured Canva MCP usage at 76 calls as of 2026-09-07, the highest-volume connector besides Supabase.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| When re-sharing DAG9Qtzie0M (or any future Canva design meant for API edit/copy/export), confirm the owner sets link permission to "Can edit" AND adds the integration's Canva account to the owning team — "Can edit" alone on a link does not unlock copy/download per Finding 2 | Zaal | Manual Canva share-settings change | 2026-09-22 |
| Correct any ZAO doc or prompt that lists `design:permission:read`/`design:permission:write` as real Canva scopes (none found in a `grep -ri "design:permission" research/` sweep during this doc's writing, but flag if one surfaces) | Zaal | Doc edit | wontfix (no instance found yet; revisit if one appears) |
| Re-validate this doc's scope table and tier table against `docs/connect/changelog/` (not fetched this pass) before citing it past 30 days | Zaal | Re-research doc 2515 | 2026-10-20 |

## Sources

- [Authentication - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/authentication/) — FULL, curl + HTML strip
- [Scopes - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/appendix/scopes/) — FULL, curl + HTML strip
- [Capabilities - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/capabilities/) — FULL, curl + HTML strip
- [Get user capabilities - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/api-reference/users/get-user-capabilities/) — FULL, curl + HTML strip
- [Get design - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/api-reference/designs/get-design/) — FULL, curl + HTML strip
- [Get export formats - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/api-reference/designs/get-design-export-formats/) — FULL, curl + HTML strip
- [Create design export job - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/) — FULL, curl + HTML strip
- [API requests & responses - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/api-requests-responses/) — FULL, curl + HTML strip
- [Error responses - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/error-responses/) — FULL, curl + HTML strip
- [Canva concepts - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/canva-concepts/) — FULL, curl + HTML strip
- [Dev MCP server - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/mcp-server/) — FULL, curl + HTML strip (this is the *building-integrations* Dev MCP, not the design-driving MCP — see Contradiction 3)
- [Canva Model Context Protocol (MCP) - Canva MCP Documentation](https://www.canva.dev/docs/mcp/) — FULL, curl + HTML strip
- [MCP tools and rate limits - Canva MCP Documentation](https://www.canva.dev/docs/mcp/tools/) — FULL, curl + HTML strip
- [start-editing-transaction - Canva MCP Documentation](https://www.canva.dev/docs/mcp/tools/start-editing-transaction/) — FULL, curl + HTML strip
- [perform-editing-operations - Canva MCP Documentation](https://www.canva.dev/docs/mcp/tools/perform-editing-operations/) — FULL, curl + HTML strip
- [commit-editing-transaction - Canva MCP Documentation](https://www.canva.dev/docs/mcp/tools/commit-editing-transaction/) — FULL, curl + HTML strip
- [Design edit handoff - Canva MCP Documentation](https://www.canva.dev/docs/mcp/workflows/design-edit/) — FULL, curl + HTML strip
- [Share design notifications - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/webhooks/share-design-notification/) — FULL, curl + HTML strip
- [Design access requested notifications - Canva Connect APIs Documentation](https://www.canva.dev/docs/connect/webhooks/design-access-requested-notification/) — FULL, curl + HTML strip
- [Permissions & Settings - Canva Audit Logs Documentation](https://www.canva.dev/docs/audit-logs/actions/permissions-and-settings/) — FULL, curl + HTML strip
- [Canva Connect APIs sitemap](https://www.canva.dev/sitemap.xml) — FULL, curl (used to enumerate all 111 `/docs/connect/*` and 18 `/docs/mcp/*` URLs and confirm no copy/edit REST endpoints exist)
- [Can't edit shared design - Canva Help Center](https://www.canva.com/help/cant-edit-shared-design/) — FULL, exa web_fetch (curl returned Canva's app-shell homepage, not the article — JS-routed help center)
- [Share your Canva design and collaborate with anyone - Canva Help Center](https://www.canva.com/help/collaborate-with-anyone/) — FULL, exa web_fetch (same curl limitation as above)
- [Sharing and link permissions - Canva Help Center](https://www.canva.com/help/sharing-link-permissions/) — FAILED, ladder exhausted (curl → app shell; exa web_fetch → `CRAWL_UNKNOWN_ERROR`; Wayback Machine → HTTP 429 rate-limited at fetch time). Substance is covered by the two FULL Help Center sources above; this page was not load-bearing for any claim in this doc.
- [Bug: Built-in Canva MCP `start-editing-transaction` hangs indefinitely — anthropics/claude-code#33124](https://github.com/anthropics/claude-code/issues/33124) — FULL, `gh api` (issue body + all 4 comments read directly, not a search snippet)
- [Canva MCP integration Bug — puku-sh/Puku-Editor-issues#128](https://github.com/puku-sh/Puku-Editor-issues/issues/128) — FULL, `gh api` (cited only as a tangential reliability data point — confirms the live Canva MCP server reports "33 tools" and an `mcp.canva.com/authorize?client_id=...` OAuth flow in practice; not about the permission_denied failure mode)
