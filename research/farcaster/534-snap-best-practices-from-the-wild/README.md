---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-04-27
related-docs: 295, 489, 498, 500, 505, 527
tier: STANDARD
---

# 534 — Snap Best Practices From The Wild

> **Goal:** Distill how the small population of production Farcaster Snaps (protocol shipped 2026-03-27, ~one month old) is being built, what the official examples teach, and which of those patterns Zlank should adopt next.

## Key Decisions (Top of File)

| # | Decision | Why | Rank |
|---|---------|-----|------|
| 1 | **Bump Snap response `version` from `'1.0'` to `'2.0'`** in `lib/snap-spec.ts`. | v2 is the current spec; v1 is in the deprecated `version-test` example only. v2 enforces strict stack nesting (which Zlank already produces, so the bump should be near-zero work) | 2 |
| 2 | **Set `zlank.online` apex as Vercel primary domain** so it stops 307-redirecting to `www`. | Confirmed cross-protocol gotcha: Snap clients drop the `Accept` header on 307s and CORS preflights miss the redirect target. Cited by us + Vercel community + Stack Overflow. | 1 |
| 3 | **Stop using `skipJFSVerification: true`** in `app/api/snap/[encoded]/route.ts` POST handler before any feature with persistent state ships. Switch to `verifyJFSRequestBody` + add a permissive emulator-only opt-in via `NODE_ENV !== 'production'`. | Open issue [#137](https://github.com/farcasterxyz/snap/issues/137) flags lack of authenticated-POST examples. Skipping JFS lets anyone forge a vote, a chat entry, or a coin association. | 2 |
| 4 | **Add view-guard pattern** to the GET handler: validate the `?page=` param against the doc's known page IDs and fall through to `home` instead of `pages[0]?.id`. | Matches `element-showcase` + `snap-catalog` official pattern. Stops `?page=garbage` rendering nothing. | 3 |
| 5 | **Keep doing**: content negotiation on a single URL, auto-attribution footer, Redis HINCRBY for vote tallies. | These match the published best-practice list. Don't break them. | 0 |
| 6 | **Skip for now**: AVIF / SVG image upload (silently dropped per [#135](https://github.com/farcasterxyz/snap/issues/135)). PNG/JPG/WEBP/GIF only. | We already enforce this in `/api/upload` allowlist. Confirms the choice. | 0 |

---

## Step 2 — Codebase grounding

Two specifics from current Zlank code that this doc bites on directly:

| File | Line | What's there | Action |
|------|------|--------------|--------|
| `/Users/zaalpanthaki/Documents/zlank/lib/snap-spec.ts` | `version: '1.0'` | Snap response declares v1 envelope | Bump to `'2.0'` (Decision 1) |
| `/Users/zaalpanthaki/Documents/zlank/app/api/snap/[encoded]/route.ts` | `skipJFSVerification: true` | POST handler accepts unsigned bodies | Gate behind dev/emulator only (Decision 3) |

What's already aligned with best practice:
- `lib/kv.ts` — `recordVote` uses `HINCRBY` + 30-day TTL; matches the "lean on per-snap KV state" recommendation.
- `lib/snap-spec.ts` — every page auto-appends `_zlank_sep` + `_zlank_footer` (zlank.online button). Matches "auto-attribution footer" pattern.
- Single-URL content negotiation via `Accept: application/vnd.farcaster.snap+json` already wired in the route handler.

---

## Step 4 — Findings

### A. Production Snaps spotted in the wild (2026-04-13 → 2026-04-27)

| Snap | Builder | URL | Pattern of note |
|------|---------|-----|-----------------|
| FreeTurtle (AI CEO) | @mattlee | [cast](https://farcaster.xyz/mattlee/0xb5e9b30d) · [repo](https://github.com/mtple/FreeTurtle) | Uses the @farcaster/snap KV store for conversational state |
| Anaroth Movie Index | @anaroth | [cast](https://farcaster.xyz/anaroth/0xe0a13674) | Button-driven navigation across many movie cards |
| BFG Casts Vault | @bfg | [cast](https://farcaster.xyz/bfg/0x0a649bf0) | Search + tag filter using `toggle_group` |
| ArjanTupan Daily Spark | @arjantupan | [cast](https://farcaster.xyz/arjantupan/0x6cb4d10f) | Lightweight daily-prompt loop |
| Montoya farfeed | @Montoya | [repo](https://github.com/Montoya/farfeed-snap) | Read-only feed Snap; not yet confirmed cast |

Caveat: corpus is tiny. No production Snap with `swap_token` found yet. No competing no-code Snap builder spotted as of 2026-04-27 — Zlank is first.

### B. Patterns the official `farcasterxyz/snap` examples teach

Source: https://github.com/farcasterxyz/snap/tree/main/examples

| Pattern | Where shown | What it does |
|---------|-------------|--------------|
| URL-param routing | `action-showcase`, `element-showcase`, `snap-catalog` | Every nav button submits to `?view=next` (Zlank uses `?page=`). Same idea. |
| Multi-step form via shared inputs | `snap-catalog` (9 views) | Form inputs accumulate across pages; final view shows results. We don't do this yet. |
| Horizontal button pairs | `action-showcase` | `stack` direction `horizontal` + `gap: "sm"` lets 2-4 buttons sit side-by-side without overflow. |
| `uid()` element-id helper | `action-showcase` | Avoids hand-numbering element keys in long Snaps. We currently number ourselves. |
| View guard | `element-showcase` | `validViews.includes(rawView) ? rawView : 'home'`. We don't validate `?page=`. |

### C. Catalog hard limits (every Snap-builder must respect)

| Element | Constraint | Limit |
|---------|------------|-------|
| `button` | label | 1-30 chars |
| `text` | content | 1-320 chars |
| `badge` | label | 1-30 chars |
| `item` | title / description | 100 / 160 chars |
| `input` | content / label / placeholder | 280 / 60 / 60 chars |
| `toggle_group` | option count / each option | 2-6 / 30 chars |
| `bar_chart` | bars / each label | 1-6 / 40 chars |
| `cell_grid` | cols / rows | 2-32 / 2-16 |
| root container | UI element count | 64 max |
| root container | direct children | 7 max |
| nested container | children per level | 6 max |
| any container | nesting depth | 4 levels max |
| POST handler | server timeout | 5 seconds |

Zlank's existing `lib/blocks.ts` clamp functions already enforce most of these (label slice 30, option slice 6, etc.). The validator added in PR #25 covers the rest.

### D. Best practices to keep doing / start doing

| # | Rule | Why | Status in Zlank |
|---|------|-----|-----------------|
| 1 | Single URL serves both Snap JSON and HTML via `Accept` header content negotiation. | Cleaner DNS, casting, analytics. | DOING |
| 2 | Auto-attribution footer on every Snap. | Viral pull-through to your own site. Mirrors how Frames evolved. | DOING (`_zlank_footer`) |
| 3 | Lean on the @farcaster/snap KV state for vote tallies, cooldowns, leaderboards. | Stateful Snaps are explicitly highlighted as a future direction in the spec; FreeTurtle uses this in production. | DOING via Redis (own infra) |
| 4 | Bump response `version` to `'2.0'`; v1 is deprecated. | Avoids strict-validator surprises in newer FC clients. | NOT YET (we ship v1.0) |
| 5 | Verify JFS POST bodies in production; only skip in dev / emulator. | Authenticated user state otherwise spoofable. | NOT YET (`skipJFSVerification: true` always) |
| 6 | Validate `?page=` against known page IDs. | Avoids broken/blank renders on bad input. | NOT YET (we accept anything) |
| 7 | Prefer Neynar API over hub direct; lower latency, webhooks. | Documented community pain. | NOT APPLICABLE (we don't write to hubs) |

### E. Anti-patterns confirmed by community signal

1. **Aggressive "Add Frame" / "Add Snap" prompts on first load.** Reads as spam to the recipient. ([Builders Garden 2026-03-15](https://paragraph.com/@builders-garden/farcaster-mini-apps-viral))
2. **Auto-prefilled cast text that's pure marketing copy.** Lower share rates than letting the user write their own caption. ([same source](https://paragraph.com/@builders-garden/farcaster-mini-apps-viral))
3. **Over-stuffed single Snap pages** approaching the 64-element / 7-direct-child cap. Hits readability wall on mobile, which is the primary surface.
4. **Direct hub submission for unsigned writes** — multi-hour propagation delay; use Neynar instead.
5. **Apex-domain 307 → www redirect with no CORS on the apex response.** Snap emulator drops the `Accept` header through the redirect, browser CORS preflight fails. Reported by us + by community threads.
6. **Slow POST handlers (>1 second)** — feels hung. The 5-second cap is a backstop, not a target.

### F. Hosting / infra gotchas to monitor

| Gotcha | Symptom | Fix |
|--------|---------|-----|
| Apex 307 strips Accept | Snap emulator says "Network error (CORS or blocked request)" | Set apex as Vercel primary OR add `Vary: Accept` and CORS to redirect target |
| Vercel Bot Protection blocks embed image fetches | Embed card image broken in feed | Exempt image routes from bot challenge |
| Missing `Content-Type: application/vnd.farcaster.snap+json` on Snap response | Client falls back to HTML | We already set this; do not remove |
| AVIF/SVG image upload silently dropped | Image blocks render blank | We allowlist PNG/JPG/WEBP/GIF in `/api/upload` |

### G. Open issues worth tracking

| # | Title | Risk |
|---|-------|------|
| [#137](https://github.com/farcasterxyz/snap/issues/137) | examples: no example demonstrating `verifyJFSRequestBody` | Security — high if Zlank ships persistent user data. |
| [#136](https://github.com/farcasterxyz/snap/issues/136) | validator: dangling `children` references not caught | Silent layout failures during dev. |
| [#135](https://github.com/farcasterxyz/snap/issues/135) | validator: `validateImageUrl` rejects AVIF/SVG | Modern image formats unsupported. |

---

## Frames v2 vs Snaps clarification

A few sources lazily call Snaps "Frames v3." That's wrong. Frames v2 was rebranded to **Mini Apps** (full-screen, persistent state, wallet connect). **Snaps** are a separate, lighter primitive shipped 2026-03-27 for in-feed JSON-driven UI.

Heuristic: tiny interaction → Snap. Full game / form / wallet flow → Mini App. Zlank already serves both surfaces (snap-aware clients render inline, others get the `fc:miniapp` embed card).

---

## Also See

- [Doc 295 — Farcaster Snaps initial research](../295-farcaster-snaps/)
- [Doc 489 — HyperSnap node](../489-hypersnap-farcaster-node-cassonmars/)
- [Doc 500 — Snaps Zlank build platform](../500-snaps-zlank-build-platform/)
- [Doc 505 — Zlank online builder spec](../505-zlank-online-builder-spec/)
- [Doc 527 — Zlank next 3 builds](../527-zlank-next-3-builds/)

---

## Next Actions

| Action | Owner | Type | By when |
|--------|-------|------|---------|
| Set `zlank.online` apex as Vercel primary domain | @Zaal | Vercel dashboard | Today (1-min fix, kills the CORS gotcha) |
| Bump `version: '1.0'` -> `'2.0'` in `lib/snap-spec.ts` + smoke-test all 4 demo Snaps | @Zaal | Code PR in zlank repo | Next zlank session |
| Replace `skipJFSVerification: true` with env-gated branch (dev only) + add `verifyJFSRequestBody` for prod | @Zaal | Code PR in zlank repo | Before any prod marketing push |
| Add view-guard validation in GET handler: reject unknown `?page=` IDs, fall through to home | @Zaal | Code PR in zlank repo | Same PR as v2 bump |
| Watch [#135](https://github.com/farcasterxyz/snap/issues/135), [#136](https://github.com/farcasterxyz/snap/issues/136), [#137](https://github.com/farcasterxyz/snap/issues/137) | @Zaal | GitHub watch | Subscribe |
| Add a "multi-step form" template to `lib/templates.ts` modeled on `snap-catalog` | @Zaal | Code PR in zlank repo | After v2 bump merges |

---

## Sources

Verified live 2026-04-27:

- [farcasterxyz/snap GitHub](https://github.com/farcasterxyz/snap)
- [farcasterxyz/snap examples](https://github.com/farcasterxyz/snap/tree/main/examples)
- [Farcaster Snap docs](https://docs.farcaster.xyz/snap)
- [Issue #135 — AVIF/SVG validator gap](https://github.com/farcasterxyz/snap/issues/135)
- [Issue #136 — dangling children references](https://github.com/farcasterxyz/snap/issues/136)
- [Issue #137 — verifyJFSRequestBody example missing](https://github.com/farcasterxyz/snap/issues/137)
- [Production Snap — @mattlee FreeTurtle](https://farcaster.xyz/mattlee/0xb5e9b30d)
- [Production Snap — @anaroth Movie Index](https://farcaster.xyz/anaroth/0xe0a13674)
- [Production Snap — @bfg Casts Vault](https://farcaster.xyz/bfg/0x0a649bf0)
- [Production Snap — @arjantupan Daily Spark](https://farcaster.xyz/arjantupan/0x6cb4d10f)
- [Open-source example — Montoya farfeed-snap](https://github.com/Montoya/farfeed-snap)
- [Open-source example — mtple FreeTurtle](https://github.com/mtple/FreeTurtle)
- 29 Seconds of Farcaster — April 13 2026 (Paragraph) — discovery feed for the four production Snaps above
- Builders Garden / Paragraph — "How to Build Viral Farcaster Mini-Apps" 2026-03-15 — anti-pattern signal

Community signal: still no Reddit / HN threads with substantive Snap-protocol discussion (re-confirmed since doc 527 — protocol is too new). Re-check after 2026-05-15.
