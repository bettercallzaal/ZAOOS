---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs: 968
original-query: "What features make a personal Farcaster client a daily driver, and what should zaalcaster add next? Ground in OSS + power-user clients (herocast, goatcast, Recaster, Supercast, Warpcast/Farcaster app, Firefly), Farcaster-native primitives (channels, frames/mini apps, tips, verifications, trending, embeds, threads), AI-assist angles unique to zaalcaster (voice drafts, digest, priority triage, thread recap), and ZAO surfaces (spaces DJ, WaveWarZ, /zao). zaalcaster today = tabbed web client (Feed, Inbox triage+draft, Channels, Compose) + CLI + Chrome DJ extension, single-user behind Vercel auth, Neynar v2, dependency-free vanilla JS. Deliver a prioritized backlog: build next / skip, effort vs value."
tier: STANDARD
---

# 969 — zaalcaster Daily-Driver Feature Backlog

> **Goal:** Prioritized backlog for zaalcaster as Zaal's daily Farcaster app. What to build next, what to skip, why - effort vs value for a single-user vanilla-JS client on Neynar v2.

## Key Decisions (recommendations first)

| # | Build next | Why | Effort | Neynar has it? |
|---|-----------|-----|--------|----------------|
| 1 | **Search (people + casts)** | Core daily verb; `lib.searchCasts` already exists, add `/api/search` + a tab | LOW | yes (/cast/search, /user/search) |
| 2 | **Tap-to-thread view** | Read a full conversation in-app instead of bouncing to farcaster.xyz; `getConversation` exists | LOW-MED | yes (/cast/conversation) |
| 3 | **Profile view** | Tap a user -> bio, counts, their casts; `getUser` + `getUserCasts` exist | LOW-MED | yes |
| 4 | **AI daily digest ("what I missed")** | THE differentiator - no other client summarizes your feed in your context; reuse voice.js infra | MED | reads + model |
| 5 | **Priority triage in Inbox** | Rank inbound by sender (mutual, neynar score, power badge) so the important replies float up | LOW-MED | yes (viewer_context, score) |
| 6 | **Quote cast** | Engagement primitive; `postCast` already takes embeds - add a quote path in Compose | LOW-MED | yes (embeds cast_id) |
| 7 | **Bookmarks / saved** | Daily habit (Warpcast has a bookmark button on every post); start local, add Neynar bookmark API if present | MED | partial |
| 8 | **Full notifications tab + keyword mute** | You have unanswered-only Inbox; add all-types view + keyword mute (Supercast's killer feature) building on the spam filter | LOW-MED | yes (/notifications) |
| 9 | **Cast-to-/zao + WaveWarZ quick actions** | ZAO-native: one-tap post to /zao, surface WaveWarZ battles; Compose already supports channelId | LOW | yes |

## What to SKIP (and why)

| Skip | Why for zaalcaster |
|------|---------------------|
| **Frames / Mini App rendering** | THE Farcaster feature (interactive sandboxed webviews, wallet, SDK) but VERY high effort for vanilla-JS single-user. Open frames in the Farcaster app for now. Revisit only if it becomes a daily need. |
| **Onchain tips (DEGEN/USDC)** | Needs a connected wallet + signing UX. High effort, low marginal value - tip from the Farcaster app. |
| **DMs / Direct Casts** | Separate messaging system; med-high effort. Use the Farcaster app for DMs until there's a clear daily need. |
| **Multi-account** | zaalcaster is single-user by design (Zaal's creds, behind Vercel auth). Explicitly not needed. |
| **Scheduled posts** | Needs a cron/queue + storage. Med effort, occasional value - defer behind the daily-read features. |
| **Analytics dashboards** | Not daily-driver core; herocast/Supercast territory. Skip. |

## Findings

### The daily-driver feature set (what every serious client ships)

From the Farcaster app (formerly Warpcast), Supercast, Recaster, goatcast, and the community guides:

- **Bookmarks** - a bookmark button on every post; "save for later" is a core habit ([matcha guide], [Shitcaster's Guide]).
- **Keyword muting** - Supercast's signature. The power-user mantra is "subscribe widely, mute aggressively" ([DEXTools 2026 guide]).
- **DMs / Direct Casts** - a first-class tab in the flagship app.
- **Quote casts + mixed embeds** - a top engagement tactic ([percs.app]): "combine frames with images or quotes."
- **Frames / Mini Apps** - the defining primitive. Frames became Mini Apps (Dan Romero, Apr 2025): full sandboxed web-apps inside a cast - polls, mints, tips, RSVP, games. "programmable social internet" ([DEXTools]). Highest value, highest build cost.
- **Tips** - DEGEN culture + weekly $1 USDC tips from your Warplet ([Shitcaster's Guide]).
- **Channels as RSS** - treat channels like feeds; refresh your channel list every couple months ([DEXTools]).
- **Selective notifications** - "notification fatigue is a real risk"; granularity matters ([DEXTools]).
- **Columns / decks** - goatcast: TweetDeck-style multi-feed monitoring for power users.
- **Search, threading, analytics, scheduled posts, starter packs, power badge** - the long tail.

### zaalcaster's real edge is AI on your own graph

Every client above competes on feed quality + craft. zaalcaster is single-user with your creds and already has `voice.js` (drafts in your voice, grounded in ZAO context). Nobody else can do AI on YOUR inbox/feed with YOUR context. So the highest-leverage differentiators are the AI items (#4 digest, #5 priority triage, plus thread-recap and the existing voice drafts), not re-implementing frames or tips that the Farcaster app already does well. Build reading-completeness (search, threads, profiles, quote, bookmarks) so it's a real client, then lean into the AI layer that makes it worth opening over Warpcast.

### Codebase reality (what's already wired, cuts effort)

zaalcaster repo already has, in `lib.js`: `searchCasts`, `getConversation`, `getUser`, `getUserCasts`, `getUnansweredInbound`, `postCast` (embeds + channelId + parent), `postReaction`, `getFollowingFeed`/`getTrendingFeed`/`getChannelFeed`, and `voice.js` (`generateDrafts`). So items 1-3, 6, 9 are mostly "add an endpoint + a tab," not new integrations. The spam filter (`loadSpamSet`) is the base for keyword mute (#8).

## Also See

- [Doc 968](../../infrastructure/968-juke-space-audio-publish-paths/) — Juke space audio publish paths (spaces DJ decision)
- zaalcaster repo: `lib.js`, `voice.js`, `public/index.html` (tabbed client), `api/*`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship Search tab (/api/search + UI) in zaalcaster - PR merged | @Zaal | PR | 2026-07-08 |
| Ship tap-to-thread + profile view (reuse getConversation/getUser) - PR merged | @Zaal | PR | 2026-07-10 |
| Ship AI daily digest ("what I missed") on the feed - PR merged | @Zaal | PR | 2026-07-12 |
| Ship priority triage sort in Inbox (rank by mutual/score) - PR merged | @Zaal | PR | 2026-07-12 |
| Decide frames-rendering: defer vs build - written decision in CLAUDE.md | @Zaal | Decision | 2026-07-15 |

## Sources

- [DEXTools: What Is Farcaster - Decentralized Social Protocol Guide 2026](https://www.dextools.io/tutorials/what-is-farcaster-decentralized-social-protocol-guide-2026) `[FULL]` — clients (Supercast keyword-muting/threading/analytics, Recaster reader), frames v2 -> mini apps, power-user habits (channels as RSS, mute aggressively, selective notifications). 2026-05-18.
- [A Shitcaster's Guide to Farcaster (paragraph.com/@readme)](https://paragraph.com/@readme/guide) `[FULL]` — culture glossary: tips/DEGEN, weekly $1 USDC tips, mini apps, signers, starter packs, storage caps, clients (Super, Recaster, Base app).
- [7 Tactics for Better Engagement on Farcaster (percs.app)](https://percs.app/blog/7-tactics-farcaster/) `[FULL]` — quote casts, mixed embeds, DMs/Direct Casts tab, composer actions, channel targeting, power badges.
- [matcha: Get started on Farcaster](https://blog.matcha.xyz/article/get-started-on-warpcast) `[FULL]` — bookmarks + Actions button on posts, frames, channels, mini apps.
- [Dan Romero: Frames are now Mini Apps (Apr 2025)](https://danromero.org/frames-now-mini-apps.html) `[PARTIAL - headline + thesis read, not full essay]` — frames became full-featured in-feed web apps.
- [goatcast (GitHub)](https://github.com/goatcast/goatcast) `[FULL]` — TweetDeck-style columns/desks, real-time multi-feed monitoring; the columns pattern for zaalcaster's later deck view.
- [Dexarbor: Farcaster Frames must-have mini-apps](https://dexarbor.com/blog/farcaster-frames-must-have-mini-apps-for-best-social-ux/) `[FULL]` — frame types (poll, mint, tip, RSVP, discovery) - the surface zaalcaster defers.
