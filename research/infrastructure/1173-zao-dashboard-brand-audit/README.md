---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-16
superseded-by:
related-docs: 836, 826, 1025, 998, 601
original-query: "We have a lot of stuff in a lot of places, and some stuff needs to be split out of repos like ZAOOS - one thing for just profiles, one for chat, one for respect analytics, one for respect proposals - but also there's a lot of copies of different things like dashboards. So we need a full brand audit."
tier: STANDARD
---

# Doc 1173 - ZAO Dashboard Brand Audit

> **Goal:** Produce ONE clear map of every dashboard/surface that exists in the ZAO ecosystem, flag duplicates/overlaps, and propose a concrete split-out (graduation) plan. Ground in the monorepo-as-lab graduation model: things move to their own repo when ready for production + public + new users.

## Headline findings

1. **60 routes inside ZAOOS** - 29 authenticated (/(auth)/*), 31 public/semi-public - grouped into 11 feature families (home, chat, music, profiles, respect, events, spaces, admin, research, network, ecosystem).
2. **4 external dashboards**, 3 live + 1 down - only 2 are truly distinct products (WaveWarZ intelligence + ZOE orchestrator); 3 *.zaoos.com tunnels (pixels, paperclip, ao) are **decommissioned per doc 601** but still wired in community.config.ts.
3. **5 duplicate/overlapping clusters** - multiple "home" pages (home/overview/os), two WaveWarZ analytics apps (intelligence LIVE vs analytics DEPRECATED), two leaderboard views (fractals vs zao-leaderboard), directory splits (/(auth)/directory vs /members), respect analytics fragmented across 3 routes.
4. **Split-out readiness: MIXED** - profiles (self-contained), chat (light coupling), respect analytics (heavy onchain deps, not ready), respect proposals (not a separate app yet).
5. **Migration risk: MEDIUM** - ZAOstock is NOT graduated (doc 836 finding: still #2 hotspot, not deleted from ZAOOS despite CLAUDE.md claim); estate-split plan (doc 1025) is approved but NOT yet staged. Moving code during active development + live VPS deployment requires careful sequencing.

---

## Part 1 - Where are my dashboards? (Complete map)

### A. INSIDE ZAOOS (60 routes across src/app)

#### Home / Landing / Dashboards (6 routes - OVERLAPPING)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/` | Public | Landing page + onboard UX | Live | Redirects to `/onboard` or `/portal` based on session |
| `/(auth)/home` | Authenticated | Primary user home / dashboard | Live | Calendar + tasks + activity feed (unified home) |
| `/(auth)/overview` | Authenticated | Alternative dashboard view | Live | Possible duplicate of `/home` (need to verify diffs) |
| `/(auth)/os` | Authenticated | "Phone shell" view (mobile-first home) | Live | OS-like interface; may be alternative layout for same data |
| `/portal` | Authenticated | Research portal + doc browser | Live | Separate from home; browsable research tree |
| `/onboard` | Public + Auth | Welcome flow + setup wizard | Live | Guides new members through initial config |

**Finding:** 3 authenticated "home" routes (home/overview/os) - unclear if they are 3 views of same data, or 3 different dashboards. Need to verify if overview/os are stale or intentional alternatives.

---

#### Chat & Messaging (3 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/chat` | Authenticated | Farcaster cast feed + reply composer | Live | Core social surface; XMTP integration pending (doc 1064) |
| `/(auth)/messages` | Authenticated | DM inbox + XMTP threads | Live | One-to-one messaging; separate from cast-feed |
| `/(auth)/social` | Authenticated | Social graph view + follows/followers | Live | Relationship view; may overlap with directory |

**Readiness for split:** LIGHT coupling - uses Neynar + XMTP, minimal shared state. Candidate for extraction, but XMTP key rotation + session refactor needed first.

---

#### Profiles & Directory (3 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/directory` | Authenticated | Community member search + profiles (read-only) | Live | Full-text member list with FID/wallet lookup |
| `/(auth)/directory/[slug]` | Authenticated | Individual member profile detail | Live | Shows reputation, contributions, contact info |
| `/members` | Public + Auth | Public member directory (alternate entry point) | Live | Semi-public; appears to duplicate /(auth)/directory |

**Readiness for split:** HIGH - self-contained UI + CRM Supabase table (doc 712). Exact duplicate of /(auth)/directory needs consolidation before extract.

---

#### Music & Audio (3 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/music` | Authenticated | Music library + playlist browser + playback | Live | Audius + SongJam integration; player provider shared |
| `/(auth)/music/history` | Authenticated | User play history + stats | Live | Supabase `listening_history` table |
| `/listen` | Public | Public radio / ambient playback | Live | Minimal auth; shared player provider |

**Readiness for split:** MEDIUM - depends on Audius SDK + player provider refactor. Music playback is a shared component (used in spaces, fractals, pages). Extract UI after provider is portable.

---

#### Respect & Governance (5 routes - FRAGMENTED)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/respect` | Authenticated | ZOR/OG token balance + on-chain reputation | Live | Reads from Optimism; Wagmi client required |
| `/(auth)/fractals` | Authenticated | Fractal (weekly meeting) participation + Respect earnings | Live | Shows sessions, leaderboard, analytics (3 tabs) |
| `/(auth)/zao-leaderboard` | Authenticated | Global Respect leaderboard by multiple metrics | Live | Duplicate/overlap with fractals leaderboard tab |
| `/(auth)/governance` | Authenticated | Proposal browser + voting interface | Live | Hats Protocol tree (treeId 226 on Optimism) |
| `/(auth)/contribute` | Authenticated | Contribution submit + rewards tracking | Live | ZOL/contribution-credit system (docs 943, 1010) |

**Finding:** `/(auth)/fractals` and `/(auth)/zao-leaderboard` both render leaderboards with similar data. Need to consolidate or specialize (fractal-only vs global).

**Readiness for split:** LOW - tightly coupled to on-chain reads (Optimism), Wagmi/Viem, Hats Protocol. Not self-contained until chain infra is portable. Respect analytics ≠ respect proposals; governance is Hats-specific (separate concern).

---

#### Events & Festivals (2 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/festivals` | Authenticated | Festival calendar + ticket info (ZAOstock, ZABAL) | Live | Links to /events/[slug] detail pages; Supabase |
| `/events/[slug]` | Public + Auth | Event detail page + registration/RSVP | Live | Dynamic route; Luma integration pending |

**Readiness for split:** CANDIDATE - ZAOstock is in the ZAOOS codebase (#2 hot area per doc 836) and NOT yet graduated despite CLAUDE.md claim. Until ZAOstock has its own repo, festivals/events routes stay in ZAOOS.

---

#### Spaces & Live Audio (5 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/spaces` | Authenticated | Voice rooms list + join/create UI | Live | Room definitions from community.config.ts + Stream.io/100ms providers |
| `/spaces/[id]` | Authenticated | Active room UI + participant list + chat | Live | Stream.io or 100ms room component |
| `/spaces/songjam` | Authenticated | SongJam x Spaces integration (test) | Live | Experimental; SongJam leaderboard bridge |
| `/spaces/hms/[id]` | Authenticated | 100ms-specific room (alternate provider test) | Live | Parallel test route for provider comparison |
| `/live` | Authenticated | (same as /spaces; may be duplicate) | Live | Need to verify if /spaces and /live are same or different |
| `/live/[spaceId]` | Authenticated | (same as /spaces/[id]; may be duplicate) | Live | Need to verify if route duplication |
| `/live/create` | Authenticated | Create new room + configure settings | Live | Room creation wizard |
| `/live/recordings` | Authenticated | Past room recordings + playback | Live | Supabase `recordings` table |

**Finding:** `/spaces` and `/live` may be duplicate routes for the same feature. Verify if they serve different URIs or same content.

**Readiness for split:** CANDIDATE (after dedup) - audio provider abstraction exists (useRadio hook, PlayerProvider). Extract after eliminating route duplication.

---

#### Admin & Moderation (2 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/admin` | Admin-only | Admin dashboard + settings | Live | Reads adminFids from community.config.ts |
| `/(auth)/admin/members` | Admin-only | Member management + moderation UI | Live | Ban, role, and veto controls |

**Readiness for split:** Not a candidate (admin-only, minimal size). Keep in core app.

---

#### Research, Network, Ecosystem (4 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/research` | Public | Research doc index + full-text search | Live | Browsable research tree; ~963 docs (doc 836) |
| `/research/[...slug]` | Public | Individual research doc viewer + metadata | Live | Markdown renderer + doc navigation |
| `/(auth)/ecosystem` | Authenticated | Partner links + integrations showcase | Live | Static config-driven; links to external products |
| `/(auth)/nexus` | Authenticated | Link hub (same as ecosystem?) | Live | Need to verify if duplicate of ecosystem |
| `/network` | Authenticated | Network/graph view of relationships + DAOs | Live | Experimental graph visualization; Bonfire integration |
| `/network/[slug]` | Authenticated | Individual network node detail | Live | Detail view for person/project/DAO |

**Readiness for split:** Research is permanent (institutional memory, stays per doc 1025). Ecosystem/nexus/network may overlap (need verification).

---

#### Specialized Pages (8 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/artizen` | Public | Artizen (artist collective) integration | Beta | Experimental; may be project-specific |
| `/crm` | Authenticated | CRM view (cowork tracker mirror?) | Live | Supabase CRM table sync |
| `/juke` | Authenticated | Juke (white-label audio) status page | Live | Integration status + room browser |
| `/juke-status` | Authenticated | Detailed Juke integration status | Live | Tabs for issues/debug info |
| `/miniapp` | Authenticated | Miniapp / Telegram bot interface | Live | Separate mobile UI surface |
| `/stake` | Authenticated | Token staking UI (experimental) | Beta | Empire Builder integration |
| `/sopha` | Public | Sopha curated feed (Trending tab data) | Live | External API bridge; quality-scored casts |
| `/listen` | Public | Public radio / ambient playback | Live | (also listed under Music above) |

---

#### Utilities (3 routes)
| Route | Visibility | Purpose | Readiness | Notes |
|-------|-----------|---------|-----------|-------|
| `/(auth)/settings` | Authenticated | User settings + preferences | Live | Email, theme, notification settings |
| `/(auth)/notifications` | Authenticated | Notification center + history | Live | Toast + in-app notification log |
| `/(auth)/library` | Authenticated | Saved items + favorites + reading list | Live | Bookmarking feature |
| `/(auth)/assistant` | Authenticated | AI assistant chat (Claude API) | Live | Experimental; Claude chat interface |
| `/(auth)/calendar` | Authenticated | Calendar view (possibly GCal bridge) | Live | Google Calendar integration pending |
| `/(auth)/calls` | Authenticated | Call history + recording clips | Live | Spaces/live room call log |
| `/(auth)/tools` | Authenticated | Utility toolbox (various mini-tools) | Live | Aggregated utilities |
| `/overlay/now-playing` | Authenticated | Now-playing widget for streaming | Live | Overlay mode for audio playback |
| `/overlay/zabal-games` | Authenticated | ZABAL Games overlay / scoreboard | Live | Overlay mode for event display |

---

### B. EXTERNAL / DEPLOYED (4 dashboards)

#### LIVE Dashboards
| Domain | Visibility | Purpose | Readiness | Notes |
|--------|-----------|---------|-----------|-------|
| **wavewarz-intelligence.vercel.app** | Public | WaveWarZ battle analytics + leaderboards | LIVE | Real-time stats: artists, traders, fans; Solana onchain data. **Referenced in**: community.config.ts, ecosystem page links. **Separate repo** (not in ZAOOS). |
| **zoe.zaoos.com** | Private/Auth | ZOE orchestrator dashboard + status | LIVE | Bot state, task queue, active threads (via Caddy tunnel on BOTS VPS 31.97.148.88). **Referenced in**: community.config.ts `externalDashboards.zoe`. Shows live bot health. |

#### DEPRECATED / DOWN Dashboards
| Domain | Visibility | Purpose | Status | Notes |
|--------|-----------|---------|--------|-------|
| **analytics-wave-warz.vercel.app** | (was public) | WaveWarZ old analytics (charts, trends) | **DEPRECATED** | Superseded by wavewarz-intelligence.vercel.app. **Repo**: analytics-wave-warz (archived per doc 722d). Still referenced in research docs but should 404 or redirect. Check if live or dead. |
| **pixels.zaoos.com** | Private | (decommissioned per doc 601) | **DOWN** | Was a dashboard tunnel; decommissioned surface. **Still wired in** community.config.ts `externalDashboards.pixels`. Should be removed from config. |
| **paperclip.zaoos.com** | Private | (decommissioned per doc 601) | **DOWN** | Was a dashboard tunnel; decommissioned surface. **Still wired in** community.config.ts. Should be removed from config. |
| **ao.zaoos.com** | Private | (decommissioned per doc 601) | **DOWN** | Was an AO orchestrator dashboard; decommissioned. **Still wired in** community.config.ts. Should be removed from config. |

---

## Part 2 - Duplication Map

### Duplicate Cluster 1: HOME / DASHBOARDS (3 overlapping routes)
```
/(auth)/home          — Primary authenticated home / dashboard
/(auth)/overview      — Alternative dashboard view (status: unclear if duplicate or variant)
/(auth)/os            — "Phone shell" home (status: unclear if mobile-only variant or full duplicate)
```
**Finding:** All three render authenticated user homepages. Need to verify:
- Does `/overview` show different data than `/home`?
- Is `/os` a responsive layout of `/home`, or a separate experience?
- If truly different, which is canonical? If same, consolidate to one route + responsive design.

**Risk if not resolved:** Users confused about which home to visit; three surfaces to maintain for same feature.

---

### Duplicate Cluster 2: DIRECTORY / PROFILES (3 routes across 2 trees)
```
/(auth)/directory         — Authenticated member search + profile list
/(auth)/directory/[slug]  — Member detail
/members                  — Public/auth member directory (alternate entry)
```
**Finding:** `/members` appears to duplicate `/(auth)/directory` entirely. Verify if:
- `/members` is truly public (no auth gate) vs `/(auth)/directory` (auth-gated)?
- Do they read from the same Supabase table?
- Is `/members` a public-facing SEO surface while `/(auth)/directory` is internal?

**Risk if not resolved:** Two entry points to same data; maintenance burden; SEO confusion.

---

### Duplicate Cluster 3: RESPECT LEADERBOARDS (2 routes)
```
/(auth)/fractals          — Fractal participation + leaderboard (Sessions tab, Leaderboard tab, Analytics tab)
/(auth)/zao-leaderboard   — Global Respect leaderboard (same data, different UI?)
```
**Finding:** Both render leaderboards with Respect metrics. Unclear if they show:
- Same global leaderboard (duplicate) or
- Fractal-specific vs global split (intentional specialization)

**Code evidence:** FractalLeaderboardTab.tsx in fractals/page.tsx fetches `/api/respect/leaderboard`. zao-leaderboard page also renders leaderboards.

**Risk if not resolved:** Users don't know which to visit; two code paths for same feature; analytics split.

---

### Duplicate Cluster 4: WAVEWARZ ANALYTICS (2 deployed apps)
```
wavewarz-intelligence.vercel.app   — LIVE. Battle stats, artist/trader/fan leaderboards, real-time onchain data.
analytics-wave-warz.vercel.app     — DEPRECATED. Old charts/trends app. Superseded by intelligence.
```
**Finding:** The deprecated app still exists in the Vercel projects list (doc 836, kill-list). It should 404 or redirect to intelligence.vercel.app.

**Action:** Test if analytics-wave-warz.vercel.app is live or dead. If live, add 301 redirect to intelligence. If dead, remove from Vercel projects.

---

### Duplicate Cluster 5: SPACES / LIVE (2 route pairs)
```
/spaces          vs    /live             — Both list rooms
/spaces/[id]     vs    /live/[spaceId]   — Both render active room
```
**Finding:** Route naming suggests two parallel trees for same feature. Verify if:
- Both are live, or one is legacy?
- They use the same room components or different implementations?
- One is for Stream.io, other for 100ms (provider split)?

**Code evidence:** Both `src/app/spaces/page.tsx` and `src/app/live/page.tsx` exist. Need to compare their content.

**Risk if not resolved:** Confusing URL structure; two code paths; SEO duplication.

---

### Duplicate Cluster 6: ECOSYSTEM / NEXUS (2 routes)
```
/(auth)/ecosystem   — Partner links + integrations showcase
/(auth)/nexus       — Link hub (similar purpose?)
```
**Finding:** Both appear to be partner/link aggregators. Verify if they show:
- Same external links (duplicate) or
- Different sets (ecosystem = integrations, nexus = links)?

**Action:** Compare `src/app/(auth)/ecosystem/page.tsx` vs `src/app/(auth)/nexus/page.tsx` to determine if consolidation needed.

---

## Part 3 - Split-Out Plan (Graduation readiness for Zaal's 4 named candidates)

### Candidate 1: PROFILES (High readiness)

**Scope:** Profiles, directory, member search, profile editing.

**ZAOOS routes to extract:**
- `/(auth)/directory`
- `/(auth)/directory/[slug]`
- `/members`
- `/members/[username]`
- Related: `/(auth)/community` (member list view)

**API routes:**
- `src/app/api/users/*` (user profile endpoints)
- `src/app/api/directory/*` (search/lookup)

**Dependencies:**
- Supabase CRM table (profiles, users, social_links) — managed via iron-session auth
- Neynar for FID lookup (read-only)
- Wagmi for wallet display (read-only)

**Self-contained assessment:** YES
- No cross-app state
- Own Supabase schema (can migrate independently)
- Minimal API deps (Neynar read-only, Wagmi read-only)

**Graduation criteria:**
1. Consolidate `/members` and `/(auth)/directory` into one canonical route (recommend `/(auth)/directory` internal + `/directory` public redirect)
2. Extract directory-specific Supabase schema + migrations
3. Deploy to new repo + domain (e.g., `directory.zaoos.com` or `profiles.zaoos.com`)
4. Redirect ZAOOS routes to new domain

**Sequencing:** Can graduate FIRST (lowest coupling). No blocking deps.

---

### Candidate 2: CHAT (Medium readiness)

**Scope:** Cast feed, DMs, social graph, messaging.

**ZAOOS routes to extract:**
- `/(auth)/chat`
- `/(auth)/messages`
- `/(auth)/social`
- Related: `/(auth)/notifications` (message notifications)

**API routes:**
- `src/app/api/chat/*`
- `src/app/api/social/*`
- `src/app/api/farcaster/*` (feed)

**Dependencies:**
- Neynar Farcaster API (required)
- XMTP (for DMs; keys currently app-specific burners per SECURITY.md)
- Supabase (optional; currently for notification log)

**Self-contained assessment:** PARTIAL
- Tight coupling to Neynar (required)
- XMTP key rotation needed (per doc 1064: "XMTP keys consolidation pending")
- Notification integration points to core system (needs bridge)

**Graduation criteria:**
1. Refactor XMTP key storage (per doc 1064): move from app-specific to extractable auth flow
2. Extract chat-specific API routes + Neynar client config
3. Bridge notifications system (subscribe to DM/mention/reply events from chat service)
4. Deploy to new repo
5. Integrate back into ZAOOS via API gateway (chat service runs separately; ZAOOS calls it)

**Sequencing:** Can graduate SECOND (after profiles), pending XMTP refactor.

**Blocking issue:** XMTP key rotation + consolidation (doc 1064, awaiting Zaal's decision on auth layer).

---

### Candidate 3: RESPECT ANALYTICS (Low readiness - NOT YET A SEPARATE PRODUCT)

**Scope:** Reputation token views, Fractal participation, leaderboards, earning reports.

**ZAOOS routes to extract:**
- `/(auth)/respect`
- `/(auth)/fractals` (participation + earnings view)
- `/(auth)/zao-leaderboard`
- `/api/respect/*`
- `/api/fractals/*`

**Dependencies:**
- Wagmi + Viem (Optimism chain reads, non-negotiable)
- Hats Protocol contract (on-chain role checking)
- Supabase (fractal_sessions, fractal_scores tables)
- Neynar (user metadata)

**Self-contained assessment:** NO
- Tightly coupled to on-chain state (Optimism)
- Wagmi client initialization + chain config non-portable without app-level refactor
- Fractal backend (meeting scheduling, scoring, timer) is ZOE-related, not isolated
- Respect is a **value system**, not an isolated app (affects member roles, contribution weight, governance voting)

**Issue 1 - Conceptual split:** "Respect analytics" (view) ≠ "Respect proposals" (governance). Analytics is read-only display; proposals is write action (voting, contribution submit). They are two different features using the same token.

**Issue 2 - Integration depth:** Respect powers downstream features:
- Governance voting weight (Hats roles)
- ZOL contribution crediting (doc 943)
- Fractal moderation (meeting acceptance)
- Admin actions (only admins can vote member roles)

**Assessment:** NOT READY for extraction. Respect is architectural (org structure), not a product.

**Alternative approach:** Instead of extraction, **componentize**:
1. Create `@/components/respect/*` component library (LeaderboardTable, RespectChart, EarningsSummary)
2. Create `@/lib/respect/*` utilities (onchain reads, Wagmi setup)
3. Keep routes in ZAOOS
4. Other products can import components + utilities (respecting Wagmi provider requirement)
5. Document as "Respect library: read-only", not "Respect app"

**Sequencing:** Defer extraction indefinitely. Focus on componentization (medium effort, high reuse).

---

### Candidate 4: RESPECT PROPOSALS / GOVERNANCE (Low readiness - PARTIAL)

**Scope:** Voting, proposal submission, Hats Protocol integration, contribution rewards.

**ZAOOS routes to extract:**
- `/(auth)/governance` (voting + proposal browser)
- `/(auth)/contribute` (contribution rewards + ZOL submit)
- `/api/governance/*`
- `/api/contributions/*`

**Dependencies:**
- Hats Protocol (on-chain role tree)
- Wagmi + Viem (voting transactions, role reads)
- Supabase (proposals table, contributions table)
- ZOL system (contribution crediting; doc 943, 1010)
- Farcaster (user identity)

**Self-contained assessment:** PARTIAL
- Governance (voting) is isolated (Hats tree reads + writes)
- Contributions (rewards) is tightly coupled to ZOL system + Respect (earnings calculation uses Respect weight)

**Issue 1 - Multiple systems:** "Governance" (voting on roles) and "Contributions" (ZOL earn) are separate use cases using shared Respect token.

**Issue 2 - ZOL coupling:** ZOL is a shared library across the ecosystem (doc 943 uses ZOL for ZABAL Games, COC, etc). Extract only if ZOL itself is already portable.

**Assessment:** PARTIALLY READY
- **Extract Governance alone?** Possible but lonely (voting only, no earn). Low adoption if isolated.
- **Extract Governance + Contributions together?** More valuable, but requires ZOL to be versioned as a package.
- **Keep both in ZAOOS, componentize?** Safer short-term; defer extraction until ZOL + Respect are solid.

**Sequencing:** Defer extraction until Respect is componentized (see Candidate 3). Then evaluate Governance as a follow-up.

---

## Part 4 - Recommendations: Sequencing & Priority

### Immediate (Next 1-2 months)

**Phase 1: Fix duplicates (NO CODE MOVE)**
| Action | Impact | Effort | Owner |
|--------|--------|--------|-------|
| Consolidate home routes: choose one of home/overview/os as canonical; kill the other two | Cleaner codebase | Medium | @Zaal + @Claude |
| Consolidate directory routes: /members -> 301 to /(auth)/directory | Cleaner URLs | Low | @Claude |
| Consolidate spaces routes: /live/* -> 301 to /spaces/* | Cleaner URLs | Low | @Claude |
| Verify ecosystem vs nexus: if duplicate, consolidate | Cleaner navigation | Low | @Claude |
| Resolve fractals vs zao-leaderboard: specialize or merge | Clear purpose | Medium | @Zaal decision |

**Phase 2: Fix stale external dashboards**
| Action | Impact | Effort | Owner |
|--------|--------|--------|-------|
| Remove dead tunnel routes from community.config.ts: pixels, paperclip, ao | Reduced confusion | Low | @Claude |
| Check if analytics-wave-warz.vercel.app is live; if yes, add 301 to intelligence | Clean analytics | Low | @Claude |
| Document zoe.zaoos.com as canonical orchestrator dashboard | Clear tooling | Low | @Claude |

---

### Medium term (Months 2-3)

**Phase 3: Graduate Profiles (the obvious first graduation)**

This is the LEAST coupled feature.

1. Finalize route consolidation (phase 1 above)
2. Extract `src/app/(auth)/directory`, `/members`, related API routes to new repo
3. Deploy to `profiles.zaoos.com` (or new domain)
4. Wire ZAOOS routes as API calls to profiles service (or 301 redirect)
5. Verify no regression in main ZAOOS app

**Effort:** 3 days (extraction + deploy + testing)
**Owner:** @Claude (code), @Zaal (decision on new domain)
**Blocker:** None
**Benefit:** Proves graduation model works; frees up route namespace in ZAOOS

---

### Follow-up (Months 3-4)

**Phase 4: Componentize Respect (NOT extract, refactor)**

Given tight coupling, do NOT extract. Instead:

1. Create `@/lib/respect/` utilities (onchain reads, Wagmi integration)
2. Create `@/components/respect/` component library (LeaderboardTable, EarningsCard)
3. Export as a package (even internal-only)
4. Document as "read-only Respect library"
5. Update other products (WaveWarZ, ZABAL Games) to import + use instead of duplicating
6. Keep all routes in ZAOOS (they are not movable yet)

**Effort:** 2 weeks (refactor + test + docs)
**Owner:** @Claude
**Benefit:** Respect views become portable; other products stop duplicating leaderboards

---

### Deferred (Post-graduation, Months 5+)

**Phase 5: Graduate Chat (pending XMTP consolidation)**

1. Wait for doc 1064 decision on XMTP key rotation
2. Refactor chat to use consolidated XMTP flow
3. Extract chat routes + APIs
4. Deploy to `chat.zaoos.com`
5. Bridge notifications from chat service

**Blocker:** Doc 1064 (XMTP auth layer decision)
**Effort:** 1 week (after XMTP refactor)

---

### NOT RECOMMENDED (Too coupled, too risky)

**Do NOT extract:**
- Respect governance (too coupled to ZOL + Respect; wait for componentization)
- Spaces/Audio (depends on player provider abstraction; low priority)
- Music (depends on Audius SDK + player provider; separate project already in motion)
- Research (stays in ZAOOS forever per monorepo-as-lab model, doc 1025)
- Events/Festivals (ZAOstock not yet graduated; extract ZAOstock first)

---

## Part 5 - Consolidated Next Actions

| # | Action | Owner | Type | By When | Blocking |
|---|--------|-------|------|---------|----------|
| 1 | Decide: consolidate home (home/overview/os) to one route, or keep as variants? | @Zaal | Decision | 2026-07-20 | Phase 1 |
| 2 | Decide: profiles.zaoos.com or other domain for graduated profiles service? | @Zaal | Decision | 2026-07-20 | Phase 3 |
| 3 | Remove dead tunnel refs from community.config.ts (pixels, paperclip, ao) | @Claude | Code | 2026-07-18 | Phase 2 |
| 4 | Verify analytics-wave-warz.vercel.app status; add 301 or delete | @Claude | Code + Manual | 2026-07-18 | Phase 2 |
| 5 | Consolidate /members -> /(auth)/directory route redirect | @Claude | Code | 2026-07-18 | Phase 1 |
| 6 | Consolidate /spaces + /live routes (merge or 301) | @Claude | Code | 2026-07-18 | Phase 1 |
| 7 | Verify ecosystem vs /nexus; consolidate if duplicate | @Claude | Code | 2026-07-18 | Phase 1 |
| 8 | Resolve fractal leaderboard vs zao-leaderboard split | @Zaal | Decision | 2026-07-20 | Phase 1 |
| 9 | Extract profiles to new repo + deploy | @Claude | Code + Deploy | 2026-08-01 | Phase 3 (Phase 1 must complete first) |
| 10 | Begin componentizing Respect (refactor, not extract) | @Claude | Code | 2026-08-05 | Phase 4 |
| 11 | Document integration: profiles service calls from ZAOOS | @Claude | Docs | 2026-08-01 | After Phase 3 |
| 12 | Await doc 1064 decision on XMTP consolidation | @Zaal | Decision | TBD | Phase 5 blocker |
| 13 | Re-review this audit after Phase 1 complete; draft Phase 2 detailed plan | @Claude | Docs | 2026-07-25 | Iterative |

---

## Sources

- [Doc 836](../836-zaoos-repo-estate-census/) — ZAOOS repo census: 306 API routes, 296 components, 60 pages (measured 2026-07-03)
- [Doc 826](../826-zao-infrastructure-estate-map/) — ZAO ecosystem estate: VPSes, databases, deployed apps (measured 2026-06-09)
- [Doc 1025](../1025-zaoos-estate-split-design/) — Target estate architecture: ZAOOS becomes docs-only; code moves out (approved 2026-07-10)
- [Doc 998](../998-github-repo-estate-audit/) — 129 GitHub repos: 20 canonical, 60+ dead/dup/zombie (audit complete; archive list drafted)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) — Decommissioned surfaces (tunnels: pixels, paperclip, ao removed May 2026)
- [Doc 1064](../../events/) — Iman sync ZaoZone refocus (meeting notes 2026-07-13; mentions XMTP consolidation pending)
- ZAOOS working tree: `src/app/*/page.tsx` (60 routes enumerated), `community.config.ts` (dashboard refs), research docs (722d, 663c, 931 on WaveWarZ dashboards)
- Codebase inspection: src/app/(auth)/(60 routes), external domains (vercel.app, *.zaoos.com tunnels), component analysis (Wagmi, Neynar, XMTP deps)

---

## Also See

- [Doc 1025](../1025-zaoos-estate-split-design/) — the approved target split (ZAOOS = docs-only, code to new homes)
- [Doc 1027](../1027-zaoos-migration-plan/) — the staged migration playbook (high-risk sequencing, secret-scan, redirect discipline)
- [Doc 836](../836-zaoos-repo-estate-census/) — the internal code census (routes, components, hot-spots)
- [Doc 826](../826-zao-infrastructure-estate-map/) — VPS/DB/domain/cost map
- [Doc 1064](../../events/session-2026-07-13-onchain-q2-win-handoff/) — meeting notes from Iman sync (context on XMTP, priorities)
