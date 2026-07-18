# 1605 — WaveWarZ Estate Audit: All Public Repos (Jul 18, 2026)

**Type:** ESTATE-AUDIT  
**Topic:** WaveWarZ  
**Status:** COMPLETE — Jul 18, 2026. Audited all public repos touching WaveWarZ across bettercallzaal/ and ZAODEVZ/. Private repos excluded per HARD RULE (visibility checked first via unauthenticated API before accessing any repo). Repeat audit recommended quarterly or when a new repo is opened.

---

## Scope & Method

- Sources checked: `bettercallzaal/` (all 90+ public repos), `ZAODEVZ/` (all 17 public repos)
- Filter: repos with "wavewarz", "ww", "coc", "battle", "zaostock", or direct WW surface in name/description/README
- Per-repo: description, last push, open PRs, best asset, problem/stale signal
- Visibility gate: `curl -s https://api.github.com/repos/<owner>/<name>` checked before accessing any repo — private repos listed as "skipped - private"

---

## Canonical Map: What Lives Where

| Function | Canonical Repo | Deploy | Status |
|---|---|---|---|
| Battle analytics, stats API, leaderboard | bettercallzaal/wwtracker | wavewarz.info + wavewarz-intelligence.vercel.app | ✅ ACTIVE |
| Live concert platform (COC Concertz) | bettercallzaal/CoCConcertZ | cocconcertz.com | ✅ ACTIVE |
| Stream overlay (OBS/Restream) | bettercallzaal/wavewarz-overlay | wavewarz-overlay.vercel.app | 🟢 STABLE |
| Mobile companion app | bettercallzaal/wavewarzapp | wavewarzapp.vercel.app | ⏸ STALLED |
| WaveWarz on Base L2 (brief + testnet) | bettercallzaal/wwbase | (testnet only) | ⏸ STALLED |
| AI Discord bot (legacy) | bettercallzaal/WARZAI | (none, inactive) | 🔴 STALE |
| ZAOstock festival site + team dashboard | ZAODEVZ/ZAOstock | (TBD) | ✅ ACTIVE |
| Africa Battle Week artist onboarding | ZAODEVZ/WWA-Onboarding-app | Vercel | 🟡 MINIMAL |
| Research + documentation | bettercallzaal/ZAOOS | zaoos.com | ✅ ACTIVE |
| Farcaster /wavewarz channel ops | bettercallzaal/zaalcaster | (local + Vercel) | ✅ ACTIVE |

**Production game engine (wavewarz.com backend):** Not found in any public repo — assumed private or hosted outside GitHub.

---

## Repo-by-Repo Audit

---

### 1. bettercallzaal/wwtracker

**What it is:** Battle analytics and stats tracker. Deploys to wavewarz.info (public API + stats) and wavewarz-intelligence.vercel.app (legacy analytics URL). The `GET /api/public/stats` endpoint (no auth, CORS open, 60s cache) is the source of truth for battle counts, SOL volumes, artist payouts, and trader claims.

| Field | Value |
|---|---|
| Last push | Jul 16, 2026 |
| Open PRs | 30 |
| Primary language | TypeScript/Next.js |
| Deploy URL | wavewarz.info |

**Best in it:**
- `GET /api/public/stats` — public, unauthenticated, real-time battle data (doc 1594 references this)
- Leaderboard with AUDIUS_MAP (Audius handle ↔ X handle mapping for ~12/48 artists where handles differ)
- Community research docs (#31-#37 merged, doc 1576 references)
- Battle history fetch with intelligence feed + WaveWarZ API sync

**Broken/stale signals:**
- 30 open PRs — queue is deep; PR backlog from community research session (#38-#48)
- Speaker-log PR series (#26-#30) — builds failing (directive queue item 2)
- Helius battle-decode script unfinished (directive queue item 3)

**Role in estate:** CANONICAL for analytics and data. All other repos should read stats from `wavewarz.info/api/public/stats`, not maintain their own numbers.

---

### 2. bettercallzaal/CoCConcertZ

**What it is:** Full-stack concert platform at cocconcertz.com. Powers every COC Concertz show (#1-#7 complete, #8 in prep). Next.js + Firebase + Cloudinary + Tailwind. Farcaster Mini App integration live.

| Field | Value |
|---|---|
| Last push | Jul 16, 2026 (PR #29 merged) |
| Open PRs | 20 (all COC #7 post-show + COC #8 prep) |
| Primary language | TypeScript/Next.js |
| Deploy URL | cocconcertz.com |

**Best in it:**
- Full event management (CRUD via admin dashboard)
- Live battle voting widget (anonymous, one-vote-per-session, real-time split bar)
- Artist profiles with OG image generation, performance history, setlist display
- Attendance badge system (per-session claim, voter tier)
- Live chat (Firebase Firestore, no-login)
- Post-show recap generation
- `generate-pilot-report.ts` (PR #53, open) — automation for Saturday morning post-show metrics

**Open PR highlights (20 PRs):**
- #53: generate-pilot-report.ts (pilot metrics report)
- #50: track peak concurrent viewers + pilot report
- #46: COC #7 post-show social templates
- #45: llms.txt for AI discoverability / GEO
- #43: show-day social post drafts
- #39: scraper fix (preserve totalBattles when scraper undercounts)
- #37: CLAUDE.md with COC7 operational lessons

**Role in estate:** CANONICAL for the COC Concertz show format. Not a replacement for wavewarz.com (which runs the actual battles) — CoCConcertZ is the show platform that embeds/displays WW battle results.

---

### 3. bettercallzaal/wavewarz-overlay

**What it is:** OBS/Restream browser-source lower-third overlay. Single HTML file — shows "Now Battling" with artist names and optional subtitle. Gold accent, transparent background, reduced-motion safe.

| Field | Value |
|---|---|
| Last push | Jul 4, 2026 |
| Open PRs | 0 |
| Files | index.html, try.html, vercel.json |
| Usage | Paste deploy URL into Restream's widget URL box with `?left=ARTIST+A&right=ARTIST+B` |

**Best in it:** Extremely minimal, exactly right-sized for the job. Zero maintenance burden.

**Broken/stale:** Nothing — it works, ships, done.

**Role in estate:** STABLE tooling. No changes needed.

---

### 4. bettercallzaal/wavewarzapp

**What it is:** React Native Expo companion app — fan-facing notification + spectator + chat layer. Live web build at wavewarzapp.vercel.app. UI complete with mock data. Firebase/FCM, auth, and Cloud Functions not wired (V1 features listed but not built).

| Field | Value |
|---|---|
| Last push | Jun 16, 2026 |
| Open PRs | 0 |
| Stack | Expo SDK 52, React Native 0.76, TypeScript, Tamagui, Zustand + React Query |
| State | Demo — in-memory mock data only |

**Best in it:**
- Architecture is well-designed (separate from trade app, reads from same Intelligence data)
- Tamagui dark theme + electric purple accent matches WW brand
- The "Join the Battle" deep link pattern is production-ready

**Broken/stale:**
- Firebase native modules not wired → no real push notifications, no real auth
- Last commit Jun 16 — 32 days stale
- Without FCM wired, the core value prop (battle start notifications) doesn't work

**Decision needed:** (1) Assign an owner and a timeline to wire Firebase/FCM — or (2) archive and rebuild within wavewarz.com when the time comes.

---

### 5. bettercallzaal/wwbase

**What it is:** WaveWarz on Base L2 — a whitepaper-quality README + testnet contracts. Looking for a technical co-founder to take it from Base Sepolia testnet to mainnet.

| Field | Value |
|---|---|
| Last push | Jun 16, 2026 |
| Open PRs | 0 |
| State | Testnet only, no active development |

**Best in it:**
- Detailed mechanics spec (EphemeralBattleToken ERC-20 per battle, bonding curve, fee splits)
- Production proof numbers cited (735 battles, 472 SOL at time of writing)
- Clear co-founder ask

**Broken/stale:**
- Last commit Jun 16 — same day as wavewarzapp (likely same session)
- No co-founder matched yet → no active development
- Stats in README are stale (735 battles, 472 SOL vs. current 1,245 battles, 523.991 SOL)

**Decision needed:** (1) Update README stats with current numbers (wavewarz.info/api/public/stats), (2) decide whether to keep this as an active co-founder pitch or move to a private spec.

---

### 6. bettercallzaal/WARZAI

**What it is:** WaveWarZ AI Discord bot powered by ElizaOS. Surfaces on-chain stats, educates traders/artists, community moderation.

| Field | Value |
|---|---|
| Last push | Sep 10, 2025 |
| Open PRs | 0 |
| State | STALE — 10 months old |

**Best in it:** ElizaOS framework choice was ahead of its time; character design and stat-surfacing intent are still relevant.

**Broken/stale:**
- Pre-dates all current bot architecture (ZOE, ZAOscribe, fractalbotjuly2026)
- Sep 2025 — 10 months without a commit
- Likely using outdated stats/API endpoints

**Recommendation:** Archive this repo. The functionality it described has been superseded by ZOE (Telegram ops) and fractalbotjuly2026 (Discord). If Discord bot capability is needed, build from fractalbotjuly2026, not WARZAI.

---

### 7. ZAODEVZ/ZAOstock

**What it is:** ZAOstock 2026 festival dashboard + public site. Graduated from bettercallzaal/zaostock (archived, now has redirect notice) on Apr 29, 2026.

| Field | Value |
|---|---|
| Last push | Jul 18, 2026 (today — PR #29 merged, full audit fixes) |
| Open PRs | 0 |
| Stack | Next.js 16, Supabase, Tailwind v4, iron-session |
| Deploy | (TBD — not public URL seen) |

**Best in it:**
- Team dashboard with 4-letter code login
- Volunteer signup at `/apply`
- Sponsor inquiry at `/sponsor`
- 8 working circles at `/circles`
- Day-of program at `/program`
- Supabase Postgres + RLS for attendee data

**Role in estate:** CANONICAL for ZAOstock Oct 3 event. Correctly separated from wwtracker (which tracks WW battles) and CoCConcertZ (which tracks COC shows).

**bettercallzaal/zaostock + bettercallzaal/zao-stock:** Both archived, both redirect to ZAODEVZ/ZAOstock. No action needed.

---

### 8. ZAODEVZ/WWA-Onboarding-app

**What it is:** Single-page invite app for WaveWarZ Africa × SongChain onboarding. Deployed on Vercel. Static HTML, serves one invite flow for Africa Battle Week participants.

| Field | Value |
|---|---|
| Last push | Jul 2, 2026 |
| Open PRs | 0 |
| State | Minimal, single-purpose |

**Best in it:** Works for the intended purpose.

**Stale/issue:** Will likely become inactive after Africa Battle Week (Sep 22-26). Consider whether to redirect post-event or archive.

---

### 9. bettercallzaal/ZAOOS (wavewarz surface)

Research archive with `research/wavewarz/` as the WW documentation topic. 1,605 docs total (and growing). All WW-relevant research, show briefs, ops checklists, and planning docs live here.

**WW-relevant docs include:** 1599 (H2 2026 calendar), 1597 (ZAOstock line of show), 1576 (COC #8 ops), 1559 (artist management), 1538 (MAIN battle format), and many more.

**Role in estate:** CANONICAL documentation. Every other repo links back to ZAOOS doc numbers for context.

---

### 10. bettercallzaal/zaalcaster

Personal Farcaster client. Includes `/wavewarz` channel feed as a curated view. Used daily by Zaal for reply queue + WW channel monitoring.

| Field | Value |
|---|---|
| Last push | Jul 17, 2026 |
| Open PRs | 2 |
| WW surface | /wavewarz channel feed, reply drafts grounded in ZAO context |

**Role in estate:** Not WW-canonical, but operationally relevant as Zaal's daily Farcaster ops tool.

---

## Repos NOT Found (Skipped - Private or Non-Existent)

| Repo name checked | Result |
|---|---|
| bettercallzaal/wavewarz | Not found (does not exist publicly) |
| bettercallzaal/wavewarz-backend | Not found |
| bettercallzaal/wavewarz-com | Not found |
| bettercallzaal/wavewarz-v2 | Not found |
| bettercallzaal/wavewarz-main | Not found |
| bettercallzaal/wavewarz-core | Not found |

**Implication:** The production wavewarz.com game engine and smart contract interaction layer are either private repos or hosted outside GitHub. The public `wavewarz.info/api/public/stats` endpoint is the only publicly-accessible surface of the production system.

---

## Consolidation Verdict

### Keep and invest
- **wwtracker** — add Hurricane's snippet, close PR backlog, wire Helius decode
- **CoCConcertZ** — close 20 open PRs before COC #8; llms.txt GEO is important
- **ZAOOS/research/wavewarz** — continue doc loop
- **ZAODEVZ/ZAOstock** — live project, ZAOstock Oct 3

### Stable — leave as is
- **wavewarz-overlay** — done, works

### Decision needed (Zaal owns)
- **wavewarzapp** — assign owner to wire Firebase/FCM or archive
- **wwbase** — update stats to current numbers; decide public pitch vs. private spec

### Archive recommended
- **WARZAI** — superseded by ZOE + fractalbotjuly2026; Discord bot if needed = new build, not this

---

## ZOE Action Items

- [ ] After wwbase decision: if keeping public, update README stats from wavewarz.info/api/public/stats
- [ ] After WARZAI decision: ZOE marks "WARZAI archived" in ZAO ops Telegram log
- [ ] ZOE monthly check: `gh api repos/bettercallzaal/wavewarzapp/commits?per_page=1` — alert Zaal if still stale at Sep 1

---

## Related Docs

- 1599 — WaveWarZ H2 2026 MAIN Event Calendar (which shows feed into which repos)
- 1576 — COC #8 Show Day Ops Checklist (CoCConcertZ deployment reference)
- 1574 — WaveWarZ Platform Stats Reference (live API numbers — baseline for wwbase README update)
- 1433 — WaveWarZ H1 2026 Platform Growth Summary (wwtracker stats history)
- 1388 — ZAO Platform Stats Reference (current numbers: 1,245 battles, 523.991 SOL)
