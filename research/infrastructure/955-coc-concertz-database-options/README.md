---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-03
superseded-by:
related-docs: "098, 176, 352"
original-query: "Database options for COC Concertz: audit current Firebase Firestore setup (passcode auth, admin SDK env vars, client SDK real-time reads) and research alternatives or smarter setups that reduce env-var/credential friction - e.g. Supabase (already a dependency), Vercel-native options (Vercel KV/Postgres), Convex, InstantDB, or keeping Firestore but simplifying credential management. Context: fresh clones need FIREBASE_ADMIN_* keys in .env.local to run seed/update scripts; site is Firestore-first with hardcoded fallbacks. STANDARD tier."
tier: STANDARD
---

# 955 — COC Concertz Database Options: Keep Firestore, Kill the Env Friction

> **Goal:** Decide whether COC Concertz should stay on Firestore, move to Supabase/Convex/InstantDB, or fix the credential pain in place.

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| Migrate off Firestore now? | **NO** | Migration is a rewrite, not a port: 2-6 weeks for an app this size (Cadence 2026 estimate). 476 lines of working Firestore lib code + 15 real-time listener call sites, all functioning. COC traffic (one show/month) sits far inside the free tier (50K reads/day). Zero cost problem to solve. |
| Fix env-var friction? | **YES - two moves, this week** | 1) `vercel link && vercel env pull .env.local` turns fresh-clone setup into two commands - creds already live in Vercel. 2) Patch `firebase-admin.ts` + scripts to fall back to Application Default Credentials (`gcloud auth application-default login`) so NO private key ever sits in a local file. |
| Supabase consolidation? | **LATER, opportunistic** | The app already runs BOTH databases (Supabase wired at `src/lib/supabase.ts` + archive routes). Do not add migration work now; if the archive feature activates and grows, revisit consolidation then. Warning: Supabase free tier pauses projects after 7 days of inactivity - a monthly-show site would get paused between shows; consolidation implies the $25/mo Pro tier. |
| Convex? | **SKIP** | Best-in-class real-time DX (sub-100ms reactive queries) but it is a full rewrite into a proprietary model, US-only managed cloud, $25/dev/mo after free tier. Not justified for a monthly event site whose real-time already works. |
| InstantDB / Vercel KV / Vercel Postgres? | **SKIP** | InstantDB is the youngest option with the smallest community ("Firebase for the Vercel era" positioning, youngju.dev deep dive). Vercel Postgres is now just Neon via marketplace and has no real-time story that beats what COC has. None reduce credential count below the Vercel-env-pull fix. |

## Ground Truth (COC Concertz codebase, checked 2026-07-03)

- `src/lib/db.ts` (294 lines) - client SDK, real-time via onSnapshot; 15 listener/query call sites
- `src/lib/db-server.ts` (85), `src/lib/firebase.ts` (66), `src/lib/firebase-admin.ts` (31) - 476 lines total Firestore plumbing
- `src/lib/supabase.ts` + `src/app/api/archive/{list,upload}/route.ts` - Supabase ALREADY a live dependency (archive feature, dormant pending activation per `docs/TODO-archive-activation.md`)
- 16 operational scripts in `scripts/` all require `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` in `.env.local` - this is the actual friction: a fresh clone cannot run `update-coc7.ts` until someone hand-copies a multiline RSA key
- Firestore rules are client-read-only on core collections; all writes go through `/api/*` Admin SDK routes. App Check inactive (separate issue)
- Real-time load profile: chat + nowPlaying + presence spike ~2 hours/month during shows; effectively zero between shows

## Findings

### 1. The friction is credential distribution, not the database

Every alternative still needs SOME secret to write to the database. The two fixes that remove the pain without touching data:

**Fix A - `vercel env pull` (10 minutes, do first).** The Vercel project already holds every env var. `vercel link` + `vercel env pull .env.local` hydrates a fresh clone in one step. No key copying, no 1Password digging. This also works for the Supabase vars when the archive activates.

**Fix B - Application Default Credentials for scripts (30 minutes).** `firebase-admin` supports `applicationDefault()`: run `gcloud auth application-default login` once per machine, then scripts authenticate as YOU with zero keys in the repo dir ([Firebase Admin setup docs](https://firebase.google.com/docs/admin/setup)). Patch `firebase-admin.ts` to try `applicationDefault()` when `FIREBASE_ADMIN_PRIVATE_KEY` is unset. Caveat from the field: your Google account needs IAM roles on the Firebase project, and Firestore calls may need a quota project set (`gcloud auth application-default set-quota-project <id>`); Firebase AUTH admin operations 403 under gcloud ADC (fix: point GOOGLE_APPLICATION_CREDENTIALS at the `firebase login` credentials instead, per [CodeJam 2024 postmortem](https://www.codejam.info/2024/05/firebase-auth-admin-denied-application-default.html)) - but Firestore access works fine under plain ADC, and COC scripts only touch Firestore, so this does not bite.

### 2. Firestore cost risk is real but not for COC's shape

The known Firestore failure mode is per-read billing under real-time listeners: "a chat room with 100 messages and 50 listeners = 5,000 reads per message" ([BuildPilot 2026](https://trybuildpilot.com/644-convex-vs-firebase-vs-supabase-real-time-2026)); Reddit migrator with 25K users / 10M docs cut $2,500/mo to $150/mo moving to Supabase ([r/Supabase thread](https://www.reddit.com/r/Supabase/comments/1hkf3k2/migrate_from_firestore_to_supabase/)). COC's numbers: free tier = 50K reads/day + 20K writes/day; a show with 50 concurrent viewers and a few hundred chat messages burns a few tens of thousands of reads ONE day a month. If a show ever 10x's (500+ concurrent), the listener multiplier starts to matter - that is the trigger to re-run this decision, not before. Paid rate if ever exceeded: $0.06/100K reads.

### 3. What migration would actually cost

- Firestore -> Supabase or Convex is a rewrite: document model, auth token shape, and listener semantics do not port. 2-6 weeks small-app estimate ([Cadence 2026](https://cadence.withremote.ai/blog/convex-vs-supabase-vs-firebase)); a 14-project agency migration took 6 months and lost Firebase's offline support outright ([Cotera 2026](https://cotera.co/articles/supabase-vs-firebase-comparison))
- COC-specific surface: 476 lines of lib code, 15 listener sites, 16 scripts, firestore.rules -> RLS policy rewrite, plus re-testing the GO LIVE / Now Playing / chat / recap flows that are the product
- Payoff at COC scale: $0/month savings (already free), minus weeks of work. Negative ROI

### 4. If/when consolidation happens, Supabase is the destination

- Already a dependency in the app AND in the ecosystem: ZAO OS runs Supabase (docs 098, 176), the cowork tracker is Supabase, and Zaal's tooling has Supabase MCP access - meaning seed/update operations could become direct SQL through MCP with NO local env at all, the true "smarter, no env" end state
- Vercel Marketplace integration auto-injects `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, anon key, service role key, and JWT secret into the Vercel project, including per-preview-branch values ([Supabase Vercel docs](https://supabase.com/docs/guides/integrations/vercel-marketplace))
- Realtime capacity at COC scale: free tier allows 200 concurrent realtime connections (500 on Pro), latency 200-500ms vs Firestore's 100-200ms - fine for chat, slightly worse for nowPlaying flips, irrelevant at monthly-show cadence
- The blocker: free projects pause after 7 days inactivity - fatal for an always-on public site with monthly spikes. Consolidation = $25/mo Pro, vs $0 today on Firestore

### 5. Convex and InstantDB, for the record

- Convex: reactive-by-default queries, end-to-end TS types, 1M function calls/mo free, $25/dev/mo Pro. Multiple 2026 comparisons agree it is the best real-time DX ([Cadence](https://cadence.withremote.ai/blog/convex-vs-supabase-vs-firebase), [DevToolPicks](https://devtoolpicks.com/blog/convex-vs-supabase-vs-firebase-indie-hackers-2026)). Wrong fit here: proprietary query model, rewrite cost, and COC's real-time is 2 hours/month, not the product moat
- InstantDB: query-graph WebSocket subscriptions, TS-first, youngest community of the set ([youngju.dev BaaS 2026 deep dive](https://www.youngju.dev/blog/culture/2026-05-14-baas-comparison-2026-supabase-firebase-pocketbase-appwrite-convex-instantdb-deep-dive.en)). Too early to bet an operating concert site on

## Also See

- [Doc 098](../098-supabase-database-optimizations/) - Supabase optimization patterns (ZAO OS)
- [Doc 176](../176-supabase-scaling-optimization/) - Supabase scaling
- [Doc 352](../../community/352-coc-concertz-full-context-artist-profiles/) - COC Concertz platform context
- Tracker: no in-flight database tasks found (checked 2026-07-03)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `vercel link && vercel env pull .env.local` in the fresh CoCConcertZ clone; document in README Local Development | @Zaal | 2-command fix | Before running update-coc7.ts (pre Jul 18 show) |
| Patch `src/lib/firebase-admin.ts` + script init to fall back to `applicationDefault()` when FIREBASE_ADMIN_PRIVATE_KEY unset | @Zaal | PR to CoCConcertZ | With the COC #7 PR |
| Add "re-evaluate DB if a show exceeds ~500 concurrent viewers" note to COC ops docs | @Zaal | Doc note | Next ops pass |
| If archive activates (TODO-archive-activation.md): install Vercel-Supabase marketplace integration for auto env injection | @Zaal | Config | On archive activation |

## Sources

- [Convex vs Supabase vs Firebase in 2026 - Cadence blog](https://cadence.withremote.ai/blog/convex-vs-supabase-vs-firebase) [FULL] - verified 2026-07-03
- [Convex vs Firebase vs Supabase for Real-Time Apps (2026) - BuildPilot](https://trybuildpilot.com/644-convex-vs-firebase-vs-supabase-real-time-2026) [FULL] - listener read-multiplier math
- [Convex vs Supabase vs Firebase for Indie Hackers - DevToolPicks](https://devtoolpicks.com/blog/convex-vs-supabase-vs-firebase-indie-hackers-2026) [FULL] - free tier + pause-after-7-days detail
- [Migrate from Firestore to Supabase - r/Supabase](https://www.reddit.com/r/Supabase/comments/1hkf3k2/migrate_from_firestore_to_supabase/) [FULL] - community source; $2,500->$150/mo migrator account
- [Supabase vs Firebase: We Migrated 14 Projects - Cotera](https://cotera.co/articles/supabase-vs-firebase-comparison) [FULL] - migration cost + offline-loss ground truth
- [BaaS 2026 deep dive incl InstantDB - youngju.dev](https://www.youngju.dev/blog/culture/2026-05-14-baas-comparison-2026-supabase-firebase-pocketbase-appwrite-convex-instantdb-deep-dive.en) [FULL]
- [Firebase Admin SDK setup (ADC)](https://firebase.google.com/docs/admin/setup) [FULL] - applicationDefault() path
- [Firebase Auth Admin denied under ADC - CodeJam](https://www.codejam.info/2024/05/firebase-auth-admin-denied-application-default.html) [FULL] - escalated via WebFetch; confirms Firestore works under ADC, 403 is Auth-admin-specific
- [Vercel Marketplace - Supabase docs](https://supabase.com/docs/guides/integrations/vercel-marketplace) [FULL] - auto env-var injection list
