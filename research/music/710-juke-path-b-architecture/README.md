---
topic: music
type: decision
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 695, 662, 591
original-query: "research this after [the Juke Path B build] and find out the best practices and ways to bring this together"
tier: STANDARD
---

# 710 - Juke Path B: Bringing It Together (Architecture + Best Practices)

> **Goal:** Path B of doc 695 - server-side Juke space creation - is built (PR #608 + #613): the `createJukeSpace` client, the `/api/juke/space` route, the `/live/create` web page, the `scripts/test-juke-space.ts` smoke test. This doc answers the next question: what is the *correct* way to operate it. Four loose ends decide whether Path B is robust or fragile - the expiring `JUKE_USER_TOKEN`, bot-to-route auth, duplicate-space prevention, and whether created spaces are remembered. Recommendations are calibrated to ZAO's real volume (one Juke host account, an estimated 3-5 spaces per week), not a 500-account SaaS.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Where `JUKE_USER_TOKEN` lives | **Ask nickysap the token TTL first.** Long-lived (30+ days) -> keep it an env var. Short-lived (hours) -> a `juke_credentials` Supabase row + on-demand refresh. | Vercel is stateless serverless - a refreshed token cannot live in module memory; the next cold start loses it. An env var only works if the token rarely changes. |
| Token refresh strategy | **Reactive: refresh on `401`, retry once, plus a 30-second expiry buffer. No proactive cron.** | The Truto playbook's proactive-alarm + jitter + distributed-lock stack is built for 500 accounts. ZAO has one host account and ~3-5 creations/week. Reactive is correct and far simpler at this volume. |
| Bot-to-route auth | **Keep the shared password for v1. Compare it with `crypto.timingSafeEqual`, not `===`.** | A plain `===` on a secret is a timing side-channel. Constant-time compare is a 3-line fix. Full HMAC signing is overkill for creating a low-stakes audio room. |
| Single integration point | **KEEP. `juke-api.ts` is the only Juke client; `/api/juke/space` is the only caller path.** Bot + web both POST the route. | Do not copy the Juke client into the `ZAODEVZ/ZAOcowork` bot repo - that duplicates the contract and splits the secrets across two hosts. One client, one env. |
| Persist created spaces | **YES - a `juke_spaces` Supabase table, next iteration.** | Path B currently returns the space id and forgets it. A table enables `/live` to list active spaces, an idempotency key, and an audit trail. |
| Idempotency | **Add an idempotency key once `juke_spaces` exists. Skip for v1.** | A Telegram retry could double-create. At 3-5/week the risk is low now; the table is the natural place to dedupe. |

## What Is Already Built (Codebase Ground Truth)

| Piece | Path | State |
|---|---|---|
| Juke developer client | `src/lib/spaces/juke-api.ts` | `createJukeSpace(input, credentials)` - POSTs `api.juke.audio/v1/developer/spaces`, sends both `X-Juke-Api-Key` + `Authorization: Bearer`, 10s timeout, never throws |
| Create route | `src/app/api/juke/space/route.ts` | Admin session OR `JUKE_CREATE_PASSWORD`; `503` until creds set; `502` on upstream failure |
| Web creator | `src/app/live/create/page.tsx` | Password + title form -> copyable `/live/{id}` link |
| Smoke test | `scripts/test-juke-space.ts` | One-shot real-API check for when credentials land |
| Path A embed | `src/lib/spaces/juke.ts`, `src/components/spaces/JukeEmbed.tsx`, `src/app/live/[spaceId]/page.tsx` | Keyless iframe - shipped, QA'd on production |

Path B is structurally a textbook single-integration-point wrapper already: the SDK-difference and secret-handling concerns are contained in `juke-api.ts`, and swapping providers would touch only that file. The four decisions below are about *operating* it, not rebuilding it.

## The Four Loose Ends

### 1. The expiring `JUKE_USER_TOKEN` - the real risk

Juke's `POST /v1/developer/spaces` needs two credentials: `X-Juke-Api-Key` (a static app secret) and `Authorization: Bearer <JUKE_USER_TOKEN>` (a Juke JWT for the host account, minted by Sign In With Farcaster). JWTs expire. `juke-api.ts` and the route currently read `JUKE_USER_TOKEN` from a static env var - which is only correct if the token is long-lived.

Three industry rules apply even at ZAO's tiny scale:

- **30-second expiry buffer.** Treat a token as expired if it dies within the next 30 seconds, so a create call that takes 10s does not fail mid-flight. (Truto, Unified.to, and OneUptime all converge on a 30s buffer.)
- **Absolute expiry, never relative.** Store the absolute UNIX timestamp, not `expires_in` - relative values drift with latency and cold-start queue time.
- **Classify the failure.** A Juke `500`/`429` means the token is still good - retry later. A `401`/`invalid_grant` means the token is dead - stop, surface a clear "re-authenticate with Juke" message. Never loop retries on a terminal failure.

What ZAO does NOT need: proactive scheduled refresh with randomized 60-180s jitter, per-account distributed mutex locks, refresh-token merging across providers. That machinery exists because a SaaS juggles 500+ accounts each with different provider quirks (Google caps 100 refresh tokens/client, Salesforce admins can silently override token policy, Linear rotates on every use). ZAO has **one** host account on **one** provider. The race conditions that justify mutex locks require concurrent refreshes of the same token; at 3-5 creations a week that essentially never happens.

**Decision path:**
1. Ask nickysap: what is the developer/host token TTL, and is there a non-expiring developer token?
2. **Long-lived (30+ days):** keep `JUKE_USER_TOKEN` as an env var. Re-issue by hand when it expires. Simplest, ship it.
3. **Short-lived (hours/days):** store `{ user_token, refresh_token, expires_at }` in a one-row `juke_credentials` Supabase table. `createJukeSpace` reads it, and on a `401` calls Juke's `POST /v1/auth/refresh`, stores the rotated token, retries once. A single in-process guard is enough concurrency control - no Redis.

This is the single most important question to settle with nickysap, alongside the API key request.

### 2. Bot-to-route auth

The ZAOcoworking bot (Part 2, lands in `ZAODEVZ/ZAOcowork`) will POST `/api/juke/space` with the shared `JUKE_CREATE_PASSWORD`. Bots have no browser session - this password path is how a server-to-server caller gets in. Two refinements:

- **Constant-time compare.** The route currently does `password === ENV.JUKE_CREATE_PASSWORD`. String `===` short-circuits on the first mismatched byte, leaking length/prefix timing. Use `crypto.timingSafeEqual` on equal-length buffers. ~3 lines, closes the side-channel.
- **Do not graduate to OAuth or per-caller keys.** Industry guidance (APIScout, RFC 9700 context) is explicit: OAuth for internal service-to-service auth "adds unnecessary complexity - the authorization server becomes a dependency and failure point for every call." A shared secret in a header is the right tool for one bot calling one route. HMAC request signing is the standard *only* for inbound webhooks (verifying the sender), which this is not.

The Telegram-webhook secret-token pattern (`x-telegram-bot-api-secret-token` validated against env) is the same shape ZAO already uses elsewhere - the password path is consistent with it.

### 3. Idempotency - duplicate spaces

If the bot retries on a flaky Telegram connection, `/api/juke/space` could create two Juke spaces for one intent. The standard fix: the caller sends a unique idempotency key; the server records it and, on a repeat, returns the original result instead of creating again.

At 3-5 creations/week the blast radius of a rare double-create is one extra empty room - low. So: **skip for v1, add it with the `juke_spaces` table** (decision 4), which is the natural store for "have I seen this key."

### 4. Persist created spaces

Right now Path B mints a space, returns `{ id, embedUrl }`, and forgets it. The id only survives if a human copies the link. A small `juke_spaces` table (`id`, `title`, `created_by`, `created_at`, `idempotency_key`) unlocks three things at once:

- `/live` can list "happening now / recent" ZAO spaces instead of requiring a pasted link.
- The idempotency key from decision 3 has a home.
- An audit trail of who created what - useful once the bot and web page are both live.

This is the cleanest next iteration after the credentials land and Path B is proven working end-to-end.

## Findings

| # | Finding | Source |
|---|---|---|
| 1 | Proactive refresh + jitter + distributed mutex locks are designed for many-account SaaS; the trigger for mutex locks is *concurrent refreshes of the same token*, which ZAO's 3-5/week volume never produces | Truto, Unified.to |
| 2 | A 30-second expiry buffer eliminates a whole class of intermittent mid-flight `401`s and is the cheapest single improvement | Truto, Unified.to, OneUptime - all converge |
| 3 | `401`/`invalid_grant` is terminal - stop retrying; `500`/`429` is transient - retry. Looping retries on a dead token burns rate limit and can get the caller IP-throttled | Truto error-classification table |
| 4 | Store absolute expiry timestamps, never relative `expires_in` - relative values drift with network + queue latency | Truto Pattern 3 |
| 5 | OAuth for internal service-to-service auth is an anti-pattern - a shared secret in a header is correct; HMAC signing is for inbound webhooks only | APIScout 2026 API auth guide |
| 6 | A single-integration-point wrapper keeps secrets server-side and means a provider swap touches one file - `juke-api.ts` already follows this | Markaicode, Gusto Embedded |
| 7 | Vercel serverless is stateless between invocations - a refreshed token MUST persist to a store (Supabase), not module memory; an env var is viable only for a long-lived token | Vercel serverless model + Truto durable-scheduling note |
| 8 | Telegram bot -> own-API calls use a shared secret-token header validated server-side; constant-time comparison is the documented norm | imehr/skills telegram-integration; APIScout (`timingSafeEqual`) |

## Recommended End-State Architecture

```
ZAOcoworking bot  ─┐
(ZAODEVZ/ZAOcowork) │  POST /api/juke/space
                    │  { title, password }
/live/create  ──────┤
(web, password)     │
                    ▼
          /api/juke/space  (the ONE caller path)
            - admin session OR timingSafeEqual(password)
            - Zod validate
            ▼
          createJukeSpace()  (the ONE Juke client)
            - reads creds: env (long-lived) OR juke_credentials row (short-lived)
            - 30s expiry buffer; on 401 -> refresh once -> retry once
            ▼
          api.juke.audio/v1/developer/spaces
            ▼
          juke_spaces table  (next iteration: list on /live + idempotency)
```

One client, one route, two callers, secrets on one host. Bot and web are thin - all Juke logic stays in `juke-api.ts`.

## Also See

- [Doc 695](../695-juke-integration-zao/) - the five-path Juke integration map; this doc executes its Path B
- [Doc 662](../662-fishbowlz-revival-juke-mute-lockout/) - FISHBOWLZ-on-Juke; shares the native-vs-web caveat
- [Doc 591](../../farcaster/) - ZAO OS miniapp surface (where a Juke "Live" tab would land)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask nickysap the `JUKE_USER_TOKEN` TTL + whether a long-lived developer token exists | @Zaal | Message | With the API key request |
| Swap `password ===` for `crypto.timingSafeEqual` in `/api/juke/space` | @Zaal | PR | Before the bot ships |
| If token is short-lived: add `juke_credentials` table + on-demand refresh in `createJukeSpace` | @Zaal | PR (needs migration approval) | After nickysap answers |
| Add 30s expiry buffer + `401`-refresh-retry-once to `createJukeSpace` | @Zaal | PR | Same PR as refresh |
| Add `juke_spaces` table - list spaces on `/live` + idempotency key | @Zaal | PR (needs migration approval) | After Path B proven live |
| Run `scripts/test-juke-space.ts` to capture the real create-space response shape | @Zaal | Smoke test | The day credentials land |

## Sources

- [Juke developer docs - juke.audio/llms.txt + /SKILL.md + /developers](https://juke.audio/developers) - [FULL] read in full this session; confirmed two-header auth, `POST /v1/developer/spaces`, `POST /v1/auth/refresh`, SIWF login
- [Handling OAuth Token Refresh Failures in Production - Truto](https://truto.one/blog/handling-oauth-token-refresh-failures-in-production-for-third-party-integrations/) - [FULL] full article fetched; the 4 patterns, error-classification table, and `invalid_grant` breakdown
- [OAuth Token Expiry: How to Check if a Token Is Expired - Unified.to](https://unified.to/blog/oauth_token_expiry_how_to_check_if_a_token_is_expired) - [PARTIAL - exa search highlights; full page not fetched, highlights corroborated Truto on the 30s buffer + single-flight refresh, no new claim relied on it alone]
- [How to Handle Token Refresh in OAuth2 - OneUptime](https://oneuptime.com/blog/post/2026-01-24-oauth2-token-refresh/view) - [PARTIAL - exa highlights; corroborating source for proactive/buffer/rotation, no unique claim depends on it]
- [API Authentication Guide: Keys, OAuth & JWT (2026) - APIScout](https://apiscout.dev/guides/api-authentication-guide) - [PARTIAL - exa highlights; cited for "OAuth for internal service auth is an anti-pattern" + `timingSafeEqual`, both stated verbatim in the highlight]
- [RFC 9700: Best Current Practice for OAuth 2.0 Security - IETF](https://www.ietf.org/rfc/rfc9700.pdf) - [PARTIAL - exa highlights of the spec; referenced only for general token-replay context, not a specific claim]
- [telegram-integration skill - imehr/skills (GitHub)](https://github.com/imehr/skills/tree/main/skills/deployment/telegram-integration) - [FULL] community source; webhook secret-token validation pattern read in full from the exa result
- [The Third-Party API Integration Guide - Markaicode](https://markaicode.com/nextjs-third-party-integration-guide/) - [PARTIAL - WebSearch result summary; cited only for the single-integration-point/wrapper principle, which is well-established]
