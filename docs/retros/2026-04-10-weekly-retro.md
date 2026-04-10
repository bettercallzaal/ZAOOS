# Weekly Retro — 2026-04-10

## Week Summary

The week of Apr 4–10 was ZAO OS's second monster week in a row: 144 commits, 20 merged PRs, and a full sprint across three pillars — hardening auth reliability, expanding Farcaster social features with 10 new API functions, and standing up ZOE's agent infrastructure (dashboard, ROLO rolodex, ZOE inbox via AgentMail). The week closed by fixing lint errors that had been silently breaking CI for 10+ days, and shipping 9 new research docs on fractal governance that position ZAO as the only music-focused fractal in the ecosystem.

---

## By the Numbers

| Metric | Count |
|--------|-------|
| Total commits | 144 |
| Merged PRs | 20 (PRs #121–#140) |
| Issues closed | 2 (#116 auth 500 fixed, #95 Stock improvements) |
| Features (`feat:`) | ~40 |
| Fixes (`fix:`) | ~16 |
| Research docs added | 9 (docs 304–312) |
| New Neynar API functions | 10 |
| Vercel Fluid Compute saved | ~75% limit freed (crons → VPS) |
| ROLO contacts imported | 844 |

**Fix/feature ratio:** Well-balanced — heavy feature week with meaningful quality catches including the 10-day CI blockage finally cleared.

---

## Features Shipped

### Agent Infrastructure
- **ZOE Dashboard** live at `zoe.zaoos.com` — chat command center with agent dispatch, contact search, event feed (PR #130)
- **ROLO Digital Rolodex** — 844 contacts imported from Airtable to Supabase; searchable with filters + inline editing in admin panel (PR #121, #130)
- **Pixel Agents dashboard** at `pixels.zaoos.com` with command panel (PR #130)
- **ZOE Inbox skill** via AgentMail API (`zoe-zao@agentmail.to`) — email links from phone, ZOE researches them via Jina Reader, marks as done (PR #135)
- **Agent Squad tabs** — SquadCircle orbital layout, WarRoomFeed, PipelineFlow task chain with 30s polling (PR #121)
- **Dynamic curriculum** — ZOE learns from yesterday's work automatically (PR #136)
- **Brand voice skill** — `.claude/skills/zao-os/brand-voice.md` for content consistency (PR #136)

### Farcaster Social Features (10 new Neynar API functions)
- **Notifications API** — read + mark seen (PR #139)
- **Mute / Block API routes** — user safety controls (PR #139)
- **Cast delete + AI thread summary** API routes (PR #139)
- **Storage usage** section in settings (PR #139)
- **Popular casts + Best Friends** API routes for member profiles (PR #139)
- **Trending topics** sidebar widget (PR #139)
- **Account verifications** on member profiles (PR #139)
- **DC intent link + mute/block menu** on FollowerCard (PR #139)
- **Upgraded follow suggestions** with Neynar algorithm (PR #139)
- **Follow-batch route** — "Follow All ZAO Members" (PR #139)
- **Mini app discovery tab** on ecosystem page + frame catalog + search (PR #139)

### Infrastructure
- **Cron jobs migrated Vercel → VPS** — freed ~75% of Fluid Compute budget; same auth/logic, just triggered from crontab (PR #134)
- **Sopha API integration** — trending feed now uses authenticated `external/feed` endpoint with curator avatars rendering correctly (PR #131, #132)
- **Knowledge tools installed** — Graphify v0.3.12, MemPalace v3.0.0, Oh-My-Mermaid; research changelog started (PR #136)
- **CLAUDE.md context budget** — token optimization rules to keep sessions lean (PR #136)
- **Build speed** — 8 `serverExternalPackages` added, 2 unused deps removed; Vercel build time cut (PR #129)
- **Vercel Fluid Compute enabled** + cron route maxDuration raised from 10s to 60s (was silently failing DB-heavy jobs) (commits Apr 8–9)

### Stock / Events
- **`/stock` page made public** — no login required; RSVP works with or without Farcaster account (PR #123)
- **Sponsorship section** — replaced rigid pricing tiers with flexible offerings list organized by On-Site / Digital / Partnership (PR #133)
- **STOCK + FESTIVALS agent design specs** — research docs for two new ZOE squad members (PR #133)
- **Music player overlap fix** — all auth pages now have proper bottom clearance; input bar no longer hidden behind player (PR #133)

---

## Bugs Fixed

- **Auth/verify cold-start 502** — four separate PRs (#125, #126, #127, #128) hardened the Farcaster sign-in flow: lazy-init `appClient`, parallelize nonce/Neynar/allowlist, defer nonce consumption until after SIWF success, client retry loop (3x with 2s delay), fire-and-forget user upsert
- **Farcaster sign-in RPC** — switched from `optimism.llamarpc.com` (DNS broken) to `optimism-rpc.publicnode.com` (PR #122)
- **Community page build timeout** — added `force-dynamic` to prevent Vercel static generation from hitting Supabase at build time (PR #140)
- **health_snapshots upsert** — added unique constraint on `snapshot_date` (commit Apr 9)
- **FARCASTER_READ_API_BASE** — missing from env types, breaking Vercel builds (PR #138)
- **2 lint errors** breaking CI for 10+ days — finally cleared Apr 9
- **4 webhook tests** for `@farcaster/miniapp-node` updated to match new package API (Apr 9)
- **Nonce TTL** increased 5→15min + auto-refresh every 10min (PR #128)

---

## Research Shipped

9 new research docs (304–312):
- **304** — Quilibrium, Hypersnap, free Neynar API (haatz.quilibrium.com)
- **305** — Channel moderation & community management (18 Farcaster Client API endpoints)
- **306** — Eden Fractal & OP Fractal deep history (Larimer → Eden on EOS → Genesis Fractal → ZAO Fractal lineage)
- **307** — Farcaster protocol features gap analysis (200+ Neynar endpoints mapped, 47 unused)
- **308** — Snapchain vs Hypersnap protocol deep dive (consensus, sharding, privacy)
- **309** — Karpathy LLM Wiki pattern + codebase-to-wiki compilers
- **310** — Meta TRIBE v2 brain prediction model for content optimization
- **311** — Claude Skills marketplace ecosystem
- **312** — Vibe-coded apps marketing playbook

---

## Wins

- **ZOE inbox is alive.** Email a link from your phone → ZOE reads it, researches it, saves a research doc. This is the workflow we've been building toward — a passive research queue that processes automatically.
- **Auth just works now.** The cold-start 502 was our biggest user-facing bug and it took 4 PRs to fully nail. It's gone. Farcaster sign-in is reliable.
- **ZAO has 47 untapped Neynar endpoints.** We mapped the entire Farcaster protocol gap this week. We know exactly what to build next.
- **ZAO is the only music-focused fractal.** The Eden Fractal research (doc 306) confirmed this position clearly. The lineage runs from Larimer's original vision straight to ZAO. Strong narrative for content.
- **Lint CI is green again.** 10+ days of silent CI brokenness is resolved. The team can ship with confidence.
- **Vercel costs under control.** Cron migration freed ~75% of Fluid Compute budget before we hit the ceiling.

---

## Gaps / Be Honest

- **Revenue still at 2/10.** Six consecutive daily briefs have flagged this. Fan support tipping and artist subscription tiers are scoped and ready to build — they just haven't landed yet. This is next week's priority.
- **ZAO Spotlight feature** — identified as high-leverage in Apr 08 brief, still unbuilt.
- **Lint was broken for 10+ days.** We shipped 100+ commits without a working linter. Fixed now, but worth noting — CI should be the first thing we check when something feels off.
- **No revenue work shipped.** 144 commits and 0 of them move the revenue needle directly. Infrastructure and features are great, but the clock is ticking on monetization.

---

## Job Hunt Status

_No data available in git/daily brief history for this week — track manually._

- Applications sent this week: —
- Responses received: —
- Interviews scheduled: —

---

## Client Pipeline

_No data available in git/daily brief history for this week — track manually._

- Active engagements: —
- Proposals out: —
- Hot leads: —

---

## Engagement Highlights

Notable context from the week:
- Issue #116 (internal server error) was filed by a community member and fixed within 24 hours via the auth hardening sprint — responsive bug resolution.
- The `/stock` page going public (no login required) broadens ZAO's surface area for sponsor and RSVP outreach.
- Eden Fractal deep-dive (doc 306) surfaced strong Farcaster content angles — ZAO's position as the music-native fractal is a compelling narrative for the fractal community.

---

## Build-in-Public Thread

**Draft for Farcaster / X (5 posts):**

---

**1/**
We shipped 144 commits this week on ZAO OS. Auth is finally bulletproof, ZOE has an inbox, and we mapped 47 untapped Farcaster protocol features we haven't built yet.

Here's what happened 🧵

---

**2/**
ZOE (our AI agent) now has an email inbox.

You email a link to zoe-zao@agentmail.to → she reads it with Jina Reader → saves a research doc → marks it done.

That's a passive research queue running 24/7. The kind of infrastructure that compounds.

---

**3/**
We fixed our auth cold-start bug. For real this time.

It took 4 PRs:
→ Lazy-init the SIWF client
→ Parallelize nonce + Neynar + allowlist checks
→ Defer nonce deletion until AFTER verification
→ Client auto-retry on 502

Farcaster sign-in just works now.

---

**4/**
We mapped the entire Farcaster protocol this week.

200+ Neynar endpoints. 47 we haven't touched yet.

Notifications, mute/block, storage, cast delete, best friends, trending topics, mini app discovery — all wired up this week. The ZAO social feed is getting deep.

---

**5/**
The ZAO is the only music-focused fractal in the ecosystem.

We traced the full lineage: Larimer's vision → Eden on EOS → Genesis Fractal → Optimism Fractal → ZAO Fractal.

We're building on a decade of governance philosophy. And we're doing it for musicians.

That's the story.

---

## Next Week Top 3

1. **Revenue unlock — Fan Support tipping.** One API route + one component (`TipButton.tsx`). No dependencies. Has been on the brief for 6 consecutive days. This ships next week.
2. **ZAO Spotlight queue.** Reuses `curationWeight.ts`. `src/app/api/music/spotlight/route.ts` + `SpotlightCard.tsx`. Highest-leverage music feature carry-over.
3. **Farcaster content push.** The fractal lineage research (doc 306) and 47 untapped endpoints story are ready to post. Ship the Build-in-Public thread above. Lean into ZAO's unique position as the music fractal.
