---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-15
related-docs: 695, 630, 681, 649
tier: STANDARD
original-query: "https://x.com/franc0fernand0/status/2077036914276737199 research this"
---

# 1103 - Learn by Building Repos: ZABAL Games Builder Shelf

**Goal:** Curate the 7 "legendary GitHub repos to learn by doing" from @Franc0Fernand0's viral tweet (291 likes) and identify which are actually useful for ZABAL Games builders. Deliver a tight resource shelf for the ZABAL Games portal + a list of ZAO-specific gaps these curated lists do NOT cover.

---

## Key Decisions

### ZABAL Builder Shelf - 3 Repos to Pin

These three repos are directly actionable for ZABAL Games builders (June-July-August 2026, ship real things fast):

1. **project-based-learning** (273k stars) - Core model match. Tutorials for building real applications.
2. **public-apis** (450k stars) - Practical integrations: Farcaster (Neynar), music APIs, on-chain calls.
3. **developer-roadmap** (361k stars) - Reference only: guides for learning paths when stuck (not a study curriculum).

### Skip These Four

- **build-your-own-x**: Deep learning (databases, git clients), not app shipping.
- **OSSU computer-science**: 2-3 year CS degree. ZABAL Games is 3 months.
- **tech-interview-handbook**: Job prep. Wrong audience.
- **awesome-machine-learning**: ML frameworks. ZABAL Games builds creator tools, not ML models.

### ZAO-Specific Gaps (Not Covered by These Repos)

These are the gaps the 7 curated repos leave for ZABAL Games builders:

1. **Farcaster miniapp templates** - The ZAO stack targets Farcaster as the primary social graph. Build tutorials for frames, embedded apps, onchain reads. (Neynar docs exist; a tutorial repo would help.)
2. **Supabase + RLS patterns** - ZAOOS uses Supabase with row-level security as the database. Builders need real examples of RLS policies + auth flows.
3. **Next.js 16 + React 19 on Supabase** - ZAOOS stack. A template or 3-4 tutorials for this combo would ship faster than sourcing from multiple docs.
4. **Wagmi/Viem wallet integration** - Web3 is invisible infrastructure in ZABAL, but wallet connection is not optional. Good Wagmi patterns repo would help.
5. **Music/creator platform APIs** - Spotify, YouTube Music, Audius, ArDrive, etc. A curated list of creator-focused APIs (vs generic API list).
6. **Agent building with Hermes** - The ZAO's framework. A 3-5 example bot repo using the Hermes pattern (async task + shared state + handoff).

---

## Verification: Star Counts vs Reality

| Repo | Claimed (Tweet) | Real Stars (2026-07-15) | Delta | Status |
|------|-----------------|------------------------|-------|--------|
| build-your-own-x | 525k | 525,402 | +402 | ACCURATE |
| public-apis | 450k | 450,270 | +270 | ACCURATE |
| developer-roadmap | 361k | 361,035 | +35 | ACCURATE |
| project-based-learning | 273k | 273,434 | +434 | ACCURATE |
| OSSU computer-science | 206k | 206,129 | +129 | ACCURATE |
| tech-interview-handbook | 141k | 140,958 | -42 | ACCURATE (slight decay) |
| awesome-machine-learning | 73k | 73,466 | +466 | ACCURATE |

All repos verified active (updated within 48h of 2026-07-15). Tweet star counts are current.

---

## Use/Skip Matrix

| Repo | Real Stars | Scope | USE/SKIP for ZABAL | Reason |
|------|-----------|-------|------------------|--------|
| **project-based-learning** | 273k | Tutorials for real apps (games, webs, mobile, IoT) | USE - Core Shelf | "Learn by doing" is ZABAL's entire model. Direct alignment. Ship real projects in 3 months. |
| **public-apis** | 450k | Curated list of free APIs (1,300+ across categories) | USE - Core Shelf | Builders integrate APIs constantly. Farcaster (Neynar), music, on-chain. Practical reference. |
| **developer-roadmap** | 361k | Interactive visual learning paths (frontend, backend, DevOps, etc.) | REFERENCE - Core Shelf | Use when stuck on "what to learn next." Not a study curriculum (that takes months). Visual guide only. |
| **build-your-own-x** | 525k | Deep implementation guides (git, Docker, database engines, editors) | SKIP | Builds infrastructure, not apps. ZABAL builders ship Farcaster apps, not git clients. Fundamentals, not speed. |
| **OSSU computer-science** | 206k | Full degree-level CS curriculum (100+ courses, 2-3 years) | SKIP | Wrong timescale. ZABAL Games is 3 months (6 weeks for July open build). Curriculum is for career changers, not ship-now builders. |
| **tech-interview-handbook** | 141k | Interview prep (behavioral, algorithms, negotiation, etc.) | SKIP | Wrong context entirely. ZABAL Games is about shipping, not job hunting. Builders are already developers or learning-by-shipping. |
| **awesome-machine-learning** | 73k | Curated ML frameworks and libraries by language | SKIP | Domain mismatch. ZABAL Games builders make creator platforms and music tools, not ML models. No ML in the June workshops. |

---

## The ZAO-Specific Gaps (Detailed)

### 1. Farcaster Miniapp Templates

**The problem:** Farcaster is ZAO's primary social graph. Frames are the interaction layer. But there's no beginner-friendly "build your first Farcaster app" repo in the 7 curated lists.

**What exists:** Neynar docs + frame.js docs. Both solid, but scattered.

**What ZABAL Games needs:** A 3-5 example repo (frames, embedded apps, onchain reads via Neynar) that builders can fork. Bonus: deploy to testnet in 10 minutes.

**Repo model:** `zabal-games/farcaster-miniapp-starter` with:
- Simple hello-world frame
- Neynar API integration (user info, followers)
- State persistence (simple)
- Deployment guide (Vercel)

### 2. Supabase + RLS Patterns

**The problem:** ZAOOS uses Supabase with row-level security. Most builders have never touched RLS. Every auth flow + data isolation requires it.

**What exists:** Supabase docs have RLS info. Generic.

**What ZABAL Games needs:** 2-3 real RLS policy examples (user owns their data, admin can see all, public reads only). A pattern for "user creates a form, only they see responses" or "artist publishes a song, only followers can listen."

**Repo model:** ZAO's existing `supabase/migrations/` folder + comments explaining each RLS policy. Or a standalone starter with the 4 core patterns (user data, public, admin, shared teams).

### 3. Next.js 16 + React 19 on Supabase

**The problem:** ZAOOS runs this stack. But the combo is new (Next.js 16 released mid-2026, React 19 shipped early 2026). Most tutorials online use older versions.

**What exists:** Official docs for each (Next.js, React, Supabase), but they assume you stitch them together.

**What ZABAL Games needs:** A 1-2 hour starter template or tutorial (GitHub repo + blog post) showing:
- File structure (app router, not pages)
- Supabase client setup
- Auth flow (email or passkey)
- A simple data fetch component
- Deployment steps

**Repo model:** `zabal-games/nextjs-supabase-starter` - fork and build.

### 4. Wagmi/Viem Wallet Integration

**The problem:** Base mainnet. Builders need wallet connect + signing. Wagmi and Viem are the ZAO standard (not ethers.js).

**What exists:** Wagmi docs, Viem docs. Both are solid. But step-by-step "add wallet to your app" is scattered.

**What ZABAL Games needs:** A 30-minute tutorial (GitHub + blog) for "plug Wagmi into your Next.js app" showing:
- RainbowKit setup
- Sign message
- Send transaction
- Error handling
- Testnet + mainnet toggle

**Repo model:** `zabal-games/wagmi-viem-starter` - one Next.js page that does all four.

### 5. Music/Creator Platform APIs

**The problem:** The 7 repos have `public-apis` (450k stars, 1300+ APIs). But ZAO is music-first. Builders need Spotify, Apple Music, Audius, YouTube Music, ArDrive, etc.

**What exists:** Scattered docs per platform. Generic "free APIs" list has music but doesn't surface creator-specific ones.

**What ZABAL Games needs:** A curated list (GitHub repo or notion) of creator + music APIs with:
- Spotify Web API (search, playlist, auth)
- Audius (onchain music)
- YouTube Music / YouTube Data API
- Apple Music (API limits)
- ArDrive (decentralized file upload)
- Lyrics APIs (Genius, Musixmatch)
- Audio APIs (Cloudinary, Mux for processing)
- Per API: auth method, rate limits, free tier, ZAO use case example

### 6. Agent Building with Hermes

**The problem:** The ZAO runs an agent fleet (ZOE, the codebase has Hermes as the framework). If a ZABAL Games builder wants to extend it or build an agent, they need patterns.

**What exists:** Doc 695 mentions the Hermes pattern. `ZAOOS/src/lib/agents/` has code. No tutorial.

**What ZABAL Games needs:** A 3-5 example agent repo showing:
- One simple bot (task runner, reminder, slack-like notify)
- The Hermes pattern (async task, shared state, handoff)
- Deployment to a VPS
- Testing patterns

**Repo model:** `zabal-games/hermes-agent-starter` - a minimal bot that uses the Hermes skeleton + does one real thing (e.g., polls a webhook and posts to Telegram).

---

## Recommendation: ZABAL Games Portal Integration

**Include in the ZABAL Games portal / workshop library:**

1. **Pin the 3-repo shelf** on the "Resources" page:
   - project-based-learning (tutorial hub)
   - public-apis (API reference)
   - developer-roadmap (learning paths)

2. **Link out to ZAO-specific starters:**
   - Farcaster miniapp starter
   - Supabase + RLS patterns guide
   - Next.js 16 + Supabase template
   - Wagmi/Viem wallet starter
   - Creator APIs curated list
   - Hermes agent starter

3. **Create a ZABAL Games Resources README** with:
   - Quick links to the 3 core repos
   - ZAO tech stack (Next.js, Supabase, Farcaster, Base)
   - "First 30 minutes" checklist (install Node, git clone starter, run dev server)
   - Mentor Slack channel for questions

This keeps the shelf tight (3 foundational, 6 ZAO-specific) and avoids overwhelming builders with 100+ repos.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Link the 3-repo shelf in ZABAL Games portal / workshop library | @Zaal | Integration | Before July open build (2026-07-01) |
| Create ZAO-specific starter repos (prioritize Farcaster miniapp + Supabase patterns first) | @Iman / @Hurric4n3ike | Build | Rolling (Farcaster by 2026-07-01, others by 2026-08-01) |
| Write "First 30 minutes" onboarding checklist for ZABAL builders | @candytoybox / @Samantha | Docs | Before June workshops |
| Add creator APIs list to resources | @Zaal | Curation | Before July build starts |

---

## Sources

- **Verified 2026-07-15:** All 7 repos exist, star counts are current, last updated within 48h of verification.
  - build-your-own-x: 525,402 stars, https://github.com/codecrafters-io/build-your-own-x
  - public-apis: 450,270 stars, https://github.com/public-apis/public-apis
  - developer-roadmap: 361,035 stars, https://github.com/kamranahmedse/developer-roadmap
  - project-based-learning: 273,434 stars, https://github.com/practical-tutorials/project-based-learning
  - OSSU computer-science: 206,129 stars, https://github.com/ossu/computer-science
  - tech-interview-handbook: 140,958 stars, https://github.com/yangshun/tech-interview-handbook
  - awesome-machine-learning: 73,466 stars, https://github.com/josephmisiti/awesome-machine-learning

- **ZABAL Games context:** Doc 695 (ZABAL Games context prompt), Doc 630 (ZABAL Games spec), Doc 681/682 (ZAOstock standups), Doc 649 (84-repo builder survey)
- **Tweet source:** @Franc0Fernand0, July 14 2026 (291 favs, 15k views), fetched via fxtwitter
- **ZAO tech stack:** CLAUDE.md (ZAOOS), Doc 695 (canonical context)
- **ZAO memory:** project_zabal_games, project_zabal_games_magnetic_build, user_zaal builder patterns

