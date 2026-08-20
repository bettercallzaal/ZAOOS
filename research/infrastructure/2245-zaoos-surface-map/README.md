---
topic: infrastructure
type: reference
status: research-complete
last-validated: 2026-08-07
related-docs: 2239, 836
original-query: "build the map - every live route and page in ZAOOS, one line each, so 'do we have X?' is a lookup instead of a rebuild"
tier: STANDARD
---

# 2245 - ZAOOS Surface Map (READ THIS BEFORE BUILDING ANYTHING)

> **Goal:** Every live page and API route in ZAOOS, one line each, generated from
> the source. The companion to [Doc 2239](../../agents/2239-zoe-capability-map/) (ZOE's
> 102 modules). That one answers "does ZOE have X?"; this answers "does the APP have X?"

## Why this exists (the honest reason)

On 2026-08-07, in a single session, SEVEN proposed builds turned out to already
exist:

| Proposed | Reality |
|---|---|
| on-chain bounty escrow | POIDH already the canonical escrow (doc 1534) |
| Unlock crypto-access integration | already live for event tickets (`src/lib/unlock/`) |
| cross-platform publishers | 9 `/api/publish/*` routes already shipped |
| a compose surface in zaalcaster | full compose UI already there |
| post scheduling | `api/cron/post-due.js` already fires the queue |
| the cowork board in the cockpit | `feed.js` already fetched open tasks |
| ZAO Profiles (leaderboard + rich member profiles) | `/members` already in the bottom nav |

Zaal, the same day: *"I'm honestly so out of the loop. I really wish I learned
more of what's happening and how all my repos are working."* The bottleneck was
never build capacity - it was that nobody could see the surface. **324 API routes
and 60 pages is more than anyone holds in their head.**

## How to use it

- **Before proposing a build:** search this file. If a route or page covers the
  concept, the move is "extend `<path>`", not "add X". This is
  `confirm-before-claiming-absence.md` made cheap.
- **Case-sensitivity warning, learned the hard way:** an absence claim from a
  grep is only as good as the grep. On 2026-08-07 a lowercase search for `wallet`
  reported "wallets are never displayed" - the code says `displayWallet` and
  `primaryWallet`. Always `grep -i`, and read the file before claiming absence.
- **The auth column is a security surface too:** scan it for `public` routes that
  should not be. It is generated from the code (presence of `isAdmin` /
  `getSession` / `CRON_SECRET` / `WEBHOOK_SECRET`), so it reflects reality, not
  intent.

## Regenerate (do this in the same PR as any route/page change)

Walk `src/app`, collect every `route.ts` and `page.tsx`, and read each file's
first header-comment line plus its exported HTTP methods and auth guard. The
generator used for this doc is recorded in the PR that created it - rerun it and
replace the tables below. `zoe-drift.py` catches referenced-but-missing paths.

## Counts (generated 2026-08-07 from main @ 41b00b93)

- **325 API routes**
- **61 pages**
- **58 lib domains**
- **35 component groups**

## Pages

| Path | What |
|---|---|
| `/` |  |
| `/(auth)/admin` |  |
| `/(auth)/admin/members` |  |
| `/(auth)/assistant` |  |
| `/(auth)/calendar` |  |
| `/(auth)/calls` |  |
| `/(auth)/chat` |  |
| `/(auth)/community` |  |
| `/(auth)/contribute` |  |
| `/(auth)/directory` | Directory now lives at /members (public, no auth required) |
| `/(auth)/directory/[slug]` |  |
| `/(auth)/ecosystem` | ── Mini App Discovery Types ─────────────────────────────────────────────────── |
| `/(auth)/festivals` |  |
| `/(auth)/fractals` |  |
| `/(auth)/governance` | All governance functionality (proposals, voting, comments, admin controls) |
| `/(auth)/home` |  |
| `/(auth)/library` |  |
| `/(auth)/messages` |  |
| `/(auth)/music` |  |
| `/(auth)/music/history` |  |
| `/(auth)/nexus` |  |
| `/(auth)/notifications` |  |
| `/(auth)/os` |  |
| `/(auth)/overview` |  |
| `/(auth)/respect` |  |
| `/(auth)/settings` |  |
| `/(auth)/social` |  |
| `/(auth)/tools` |  |
| `/(auth)/wavewarz` |  |
| `/(auth)/zao-leaderboard` |  |
| `/artizen` | zaoos.com/artizen — public page for the ZAO Fund for Emerging Culture, the |
| `/crm` | Private CRM dashboard. Admin-only (iron-session isAdmin). Reads the full |
| `/events/[slug]` |  |
| `/juke` |  |
| `/juke-status` |  |
| `/listen` |  |
| `/live` |  |
| `/live/[spaceId]` |  |
| `/live/create` | Posts to `/api/juke/space`, which is authorised by either an admin session |
| `/live/recordings` | pass a week, so the recording shelf stays scannable. */ |
| `/members` | Revalidate every 5 minutes so the directory stays fresh without always hitting DB |
| `/members/[username]` |  |
| `/miniapp` | ZAO OS Mini App Landing Page |
| `/network` | Public "who I've met" feed. Reads only the crm_contacts_public view (safe |
| `/network/[slug]` | Public per-contact detail page. Reads only the *_public views (safe columns, |
| `/not-allowed` |  |
| `/offline` |  |
| `/onboard` |  |
| `/overlay/now-playing` |  |
| `/overlay/zabal-games` | Generic ZABAL Games stream overlay — a browser source for OBS / Restream Studio |
| `/portal` |  |
| `/publish` | Zaal tapped POST on a ZOE draft and it just echoed the text back (posts/buttons.ts |
| `/research` |  |
| `/research/[...slug]` |  |
| `/sopha` |  |
| `/spaces` |  |
| `/spaces/[id]` |  |
| `/spaces/audit-test` | Isolated multiplayer test room. Open this page in two browsers (or share the |
| `/spaces/hms/[id]` | Type-only imports — the msRoomsDb module itself is server-only (service role) |
| `/spaces/songjam` |  |
| `/stake` |  |

## API routes

| Path | Methods | Auth | What |
|---|---|---|---|
| `/api/100ms/rooms` | GET,POST | session | Mirrors the Stream room create schema so a token gate set in HostRoomModal is |
| `/api/100ms/rooms/[id]` | GET,PATCH | session |  |
| `/api/100ms/rooms/[id]/stage` | GET,POST | session |  |
| `/api/100ms/token` | POST | admin |  |
| `/api/100ms/webhook` | POST | signed | Ingests 100ms server webhooks (parity with the Stream webhook) so rooms react |
| `/api/activity/feed` | GET | session |  |
| `/api/admin/agents` | GET,PATCH | admin |  |
| `/api/admin/agents/status` | GET | admin |  |
| `/api/admin/allowlist` | GET,POST,DELETE | admin |  |
| `/api/admin/apo/prompts` | GET | admin | src/app/api/admin/apo/prompts/route.ts |
| `/api/admin/apo/run` | POST | admin | src/app/api/admin/apo/run/route.ts |
| `/api/admin/audit-log` | GET | admin |  |
| `/api/admin/backfill` | POST | admin |  |
| `/api/admin/broadcast` | POST | admin |  |
| `/api/admin/contacts` | GET,POST,PATCH | admin | Strict contact field schema - bounds every field and rejects unknown keys so |
| `/api/admin/discord-link` | GET,POST,PATCH | admin |  |
| `/api/admin/dormant` | GET | admin | Admin only. Returns active members who haven't been seen in N days, |
| `/api/admin/ens-subnames` | GET,POST,DELETE | admin |  |
| `/api/admin/ens-subnames/requests` | GET,PATCH | admin |  |
| `/api/admin/export` | GET | admin | Prevent spreadsheet formula injection: prefix cells starting with |
| `/api/admin/hidden` | GET | admin |  |
| `/api/admin/member-fid` | GET,PATCH | admin |  |
| `/api/admin/member-fix` | POST | admin |  |
| `/api/admin/member-health` | GET | admin | Admin only. Shows: missing fields, unlinked records, tier mismatches |
| `/api/admin/nexus` | GET,POST,PUT,DELETE | admin |  |
| `/api/admin/onboarding-funnel` | GET | admin |  |
| `/api/admin/poll-config` | GET,PUT | admin |  |
| `/api/admin/quick-stats` | GET | admin | Admin only. Returns counts for members, sessions, respect, dormancy, audit actions |
| `/api/admin/respect-import` | POST | admin | Allow up to 60s on Vercel Pro for this heavy sync |
| `/api/admin/search-users` | GET | admin | Resolve address → ENS name (returns null if none) |
| `/api/admin/spaces` | GET | admin | — List all rooms (admin only) |
| `/api/admin/spaces/[id]` | DELETE | admin | — Permanently delete a room (admin only) |
| `/api/admin/upload` | POST | admin |  |
| `/api/admin/users` | GET,POST,PATCH,DELETE | admin |  |
| `/api/admin/users/import` | POST | admin | — Import all allowlist entries into the users table |
| `/api/agents/health` | GET | cron | Pre-flight check: verify all agent infrastructure is configured |
| `/api/artists/[username]` | GET | session | Session-authenticated. Returns combined profile, songs, respect, social data |
| `/api/artists/featured` | GET | session | Session-authenticated. Returns compact artist cards for horizontal scroll |
| `/api/auth/facebook` | GET | session |  |
| `/api/auth/facebook/callback` | GET | session |  |
| `/api/auth/kick` | GET | session |  |
| `/api/auth/kick/callback` | GET | session |  |
| `/api/auth/lastfm` | GET | session |  |
| `/api/auth/lastfm/callback` | GET | session |  |
| `/api/auth/lastfm/disconnect` | POST | session |  |
| `/api/auth/listenbrainz` | POST,DELETE | session |  |
| `/api/auth/listenbrainz/status` | GET | session |  |
| `/api/auth/logout` | POST | public |  |
| `/api/auth/register` | POST | public | Rate limiting: middleware covers /api/auth/* at 10/min |
| `/api/auth/session` | GET | session |  |
| `/api/auth/signer` | POST | session | SECURITY: This uses the APP's signer wallet (APP_SIGNER_PRIVATE_KEY), |
| `/api/auth/signer/save` | POST | session |  |
| `/api/auth/signer/status` | GET | session |  |
| `/api/auth/siwe` | GET,POST | public |  |
| `/api/auth/twitch` | GET | session |  |
| `/api/auth/twitch/callback` | GET | session |  |
| `/api/auth/verify` | GET,POST | public |  |
| `/api/auth/youtube` | GET | session |  |
| `/api/auth/youtube/callback` | GET | session |  |
| `/api/autocliper/approve` | POST | session | Approve a clip draft for publishing |
| `/api/autocliper/drafts` | GET | session | List all clip drafts by stage |
| `/api/autocliper/ingest` | POST | session | Ingest a video source and create a clip draft |
| `/api/autocliper/publish` | POST | session | Publish an approved clip via Postiz |
| `/api/autocliper/status` | GET | public | Get autocliper system status |
| `/api/bluesky` | GET,POST,DELETE | session | — Get current user's Bluesky connection status |
| `/api/bluesky/feed` | GET | public | — Bluesky Feed Generator endpoint |
| `/api/bluesky/members` | GET,POST,DELETE | admin | — List all Bluesky members tracked for the feed (admin only) |
| `/api/bluesky/sync` | POST | admin | — Sync Bluesky member posts into the feed index (admin only) |
| `/api/bots/status` | GET | admin | Live fleet status, proxied from the cowork control-plane board |
| `/api/broadcast/start` | POST | session |  |
| `/api/broadcast/status` | GET | session |  |
| `/api/broadcast/targets` | GET,POST,DELETE | session |  |
| `/api/casts/delete` | POST | session |  |
| `/api/casts/summary` | POST | session |  |
| `/api/chat/assistant` | POST | session |  |
| `/api/chat/hide` | POST | admin |  |
| `/api/chat/messages` | GET | session | Server-side TTL: first request in each window refreshes from Neynar, |
| `/api/chat/minimax` | POST | session |  |
| `/api/chat/react` | POST,DELETE | session |  |
| `/api/chat/schedule` | GET,POST,PATCH,DELETE | session |  |
| `/api/chat/search` | GET | session |  |
| `/api/chat/send` | POST | session |  |
| `/api/chat/thread/[hash]` | GET | session |  |
| `/api/chat/trending` | GET | session |  |
| `/api/community-issues` | GET,POST | session | — List community-submitted issues |
| `/api/cortex` | GET,POST | session | Executive Cortex API - strategic advisory interface |
| `/api/crm/capture` | GET,POST | public | Public CRM form capture endpoint. Accepts POST requests from Webflow forms |
| `/api/crm/interactions` | GET,POST | admin | Constant-time secret comparison (C-H2). Hashing both sides to a fixed-length |
| `/api/cron/100ms-stale-rooms` | GET | cron | Manual / on-demand trigger for the 100ms ghost-room sweep. The sweep also runs |
| `/api/cron/agents/banker` | GET | cron |  |
| `/api/cron/agents/dealer` | GET | cron |  |
| `/api/cron/agents/vault` | GET | cron | Vercel cron -- runs VAULT agent daily at 6 AM UTC |
| `/api/cron/daily-digest` | GET | cron | Vercel cron — posts a daily summary cast to /zao channel |
| `/api/cron/engagement-collect` | GET | cron |  |
| `/api/cron/follower-snapshot` | GET | cron | Vercel cron-compatible route that: |
| `/api/cron/health-snapshot` | GET | cron | Weekly cron (Sunday midnight UTC) that snapshots community health metrics |
| `/api/cron/heart-recovery` | GET | cron | The Heart's recovery runtime. Runs on a Vercel cron and performs both |
| `/api/cron/juke-stale-rooms` | GET | cron | Sweeps any juke_spaces row still marked `active` that has not seen a |
| `/api/cron/weekly-reflection` | GET,POST | cron | Require CRON_SECRET to be configured |
| `/api/cron/zounz-events` | GET | cron |  |
| `/api/directory` | GET,PATCH | admin | Clamp a non-numeric/negative limit to the default (never pass NaN downstream) |
| `/api/directory/[slug]` | GET | session |  |
| `/api/discord/events` | GET | public | Day-of-week helpers for calculating next occurrence |
| `/api/discord/fractal-live` | GET | public | Returns active fractal sessions and recent completed sessions |
| `/api/discord/intros` | GET | public |  |
| `/api/discord/link` | POST | signed | Body: { discord_id: string, fid: number } |
| `/api/discord/member-stats` | GET | session | Query params: |
| `/api/discord/proposals` | GET | session | Query params: |
| `/api/discord/proposals/vote` | POST | session | Body: { proposalId: number, vote: 'yes' | 'no' | 'abstain' } |
| `/api/discord/sync` | GET,POST | admin | ?type=members | intros | threads |
| `/api/empire-builder/leaderboard` | GET | session |  |
| `/api/empire-builder/me` | GET | session |  |
| `/api/empire-builder/snapshot` | GET | session |  |
| `/api/ens` | GET | public | Public endpoint (no auth) — ENS data is public on-chain |
| `/api/ens/subname-request` | POST | session | Creates a pending request for admin approval |
| `/api/events/[slug]` | GET | public |  |
| `/api/events/create` | POST | admin | Admin-only. Turns "edit the SQL migration" into "make an event". The `events` |
| `/api/events/rsvp` | POST | session |  |
| `/api/events/verify-ticket` | POST | public | Verify whether a person holds the Unlock ticket (key) for an event |
| `/api/fc-identity/check` | GET | public |  |
| `/api/feedback` | POST | session |  |
| `/api/following/online` | GET | session |  |
| `/api/fractals/analytics` | GET | session |  |
| `/api/fractals/matrix` | GET | session |  |
| `/api/fractals/member/[wallet]` | GET | session |  |
| `/api/fractals/proposals` | GET | session | src/app/api/fractals/proposals/route.ts |
| `/api/fractals/sessions` | GET | session | src/app/api/fractals/sessions/route.ts |
| `/api/fractals/webhook` | POST | signed | src/app/api/fractals/webhook/route.ts |
| `/api/grids/battle` | GET | session | Battle Grid query seam |
| `/api/grids/creator` | GET | session | Creator Grid query seam |
| `/api/grids/events` | GET | session | Event Grid query seam |
| `/api/grids/reputation` | GET | session | Reputation Grid query seam |
| `/api/grids/sponsor` | GET | session | Sponsor Grid query seam |
| `/api/hats/check` | GET | session |  |
| `/api/hats/tree` | GET | session |  |
| `/api/juke/admin/agent-join` | POST | admin | Drops a partner-scoped agent (ZOE by default) into a Juke room ZAO owns |
| `/api/juke/admin/delete-webhook` | POST | admin | Admin-only cleanup for orphan webhook subscriptions on Juke's side. Created |
| `/api/juke/admin/end-space` | POST | admin | Calls Juke's developer end-space endpoint to terminate a room the host or |
| `/api/juke/admin/mark-ended` | POST | admin | Manual override that flips a Juke space row to `status: 'ended'` in our DB, |
| `/api/juke/admin/register-webhook` | POST | admin | Server-side wrapper around `POST https://api.juke.audio/v1/developer/webhooks` |
| `/api/juke/partner-token` | GET | session | Mints a short-lived Juke partner JWT for the CURRENT signed-in ZAO user |
| `/api/juke/space` | POST | admin | Constant-time string comparison. Both inputs are SHA-256'd to a fixed |
| `/api/juke/status` | GET | public | Same data as /juke-status (HTML) and /juke-integration.md (markdown). Built |
| `/api/juke/webhooks` | POST | signed | dispatcher (Juke PR 2026-05-23) |
| `/api/library/comments` | GET,POST | session |  |
| `/api/library/delete` | DELETE | admin |  |
| `/api/library/docs` | GET | session |  |
| `/api/library/entries` | GET | session |  |
| `/api/library/submit` | POST | session |  |
| `/api/library/vote` | POST | session |  |
| `/api/livepeer/clip` | POST | session |  |
| `/api/livepeer/stream` | POST | session |  |
| `/api/livepeer/stream/[id]` | GET,DELETE | session |  |
| `/api/members` | GET | session | Returns all active ZAO allowlist members with their profile info |
| `/api/members/[username]` | GET | public |  |
| `/api/members/[username]/friends` | GET | public |  |
| `/api/members/[username]/popular` | GET | public |  |
| `/api/members/directory` | GET | public |  |
| `/api/members/me` | GET,POST | session |  |
| `/api/members/nfts` | GET | session |  |
| `/api/members/profile` | GET | session |  |
| `/api/memory/[userId]/recall` | GET | session |  |
| `/api/memory/[userId]/reflect` | POST | session |  |
| `/api/memory/[userId]/retain` | POST | session |  |
| `/api/memory/community/recall` | GET | session | Community bank ID - uses a shared bank for community-wide memories |
| `/api/miniapp/auth` | GET | public |  |
| `/api/miniapp/auth-context` | POST | admin | Miniapp context-based auth — silent (no SIWF signature prompt) |
| `/api/miniapp/discover` | GET | session | Defensively clamp: a non-numeric/negative limit falls back to the default |
| `/api/miniapp/search` | GET | session |  |
| `/api/miniapp/webhook` | POST | public | Verify webhook signature using Farcaster's official verification |
| `/api/moderation/queue` | GET,PATCH | admin | Admin-only. Returns flagged items pending review |
| `/api/music/artists` | GET | public |  |
| `/api/music/collect` | POST | session |  |
| `/api/music/comments` | GET,POST,DELETE | admin |  |
| `/api/music/curators` | GET | session |  |
| `/api/music/digest` | GET | session |  |
| `/api/music/feed` | GET | session |  |
| `/api/music/frame` | GET | public |  |
| `/api/music/generate` | POST | session | ACE-Step v1.5 via HuggingFace Gradio Space |
| `/api/music/history` | GET | session |  |
| `/api/music/library` | GET,POST | session |  |
| `/api/music/library/like` | GET,POST | session |  |
| `/api/music/library/play` | POST | session | Fire-and-forget from client on each play |
| `/api/music/library/react` | GET,POST | session |  |
| `/api/music/listening-party` | GET,POST | session |  |
| `/api/music/lyrics` | GET | session | ─── In-memory LRU-ish cache (max 500 entries) ───────────────────────────── |
| `/api/music/metadata` | GET | session |  |
| `/api/music/mint` | POST | session |  |
| `/api/music/permaweb` | GET | session |  |
| `/api/music/playlists` | GET,POST | session |  |
| `/api/music/playlists/[id]` | GET | session |  |
| `/api/music/playlists/[id]/tracks` | POST,DELETE | session |  |
| `/api/music/playlists/collaborative` | GET,POST | session | GET — list all public collaborative playlists with counts |
| `/api/music/playlists/collaborative/[id]` | GET,PATCH,DELETE | session | GET — single playlist with tracks + members |
| `/api/music/playlists/collaborative/[id]/join` | POST | session | POST — join a collaborative playlist as contributor |
| `/api/music/playlists/collaborative/[id]/tracks` | POST,DELETE | session |  |
| `/api/music/playlists/collaborative/[id]/vote` | POST | session | POST — vote on a track in a collaborative playlist |
| `/api/music/radio` | GET | session | Disable Next.js fetch cache — Audius data should be fresh |
| `/api/music/resolve` | GET | session |  |
| `/api/music/scrobble` | POST | session |  |
| `/api/music/search` | GET | session |  |
| `/api/music/share-card` | GET | public |  |
| `/api/music/submissions` | GET,POST,DELETE | admin |  |
| `/api/music/submissions/review` | POST | admin | POST - approve or reject a song submission (admin only) |
| `/api/music/submissions/vote` | POST | session |  |
| `/api/music/track-of-day` | GET,POST | session | GET — return today's Track of the Day + current nominations |
| `/api/music/track-of-day/select` | POST | admin | POST — select today's Track of the Day |
| `/api/music/track-of-day/vote` | POST | session | POST — toggle vote on a nomination |
| `/api/music/trending-weighted` | GET | session |  |
| `/api/music/wallet` | GET | session |  |
| `/api/nexus/links` | GET | public | Public API: GET /api/nexus/links |
| `/api/neynar/cast` | POST | session |  |
| `/api/neynar/follow` | POST | session |  |
| `/api/neynar/like` | POST | session |  |
| `/api/neynar/recast` | POST | session |  |
| `/api/notifications` | GET,PATCH | session | — Fetch notifications for the current user |
| `/api/notifications/farcaster` | GET,POST | session | Guard NaN: a non-numeric limit falls back to undefined (let getNotifications |
| `/api/notifications/push/send` | POST | admin |  |
| `/api/notifications/push/subscribe` | POST,DELETE | session |  |
| `/api/notifications/send` | POST | admin | Send push notifications to Farcaster Mini App users via their notification tokens |
| `/api/notifications/status` | GET | session | Returns whether the current user has push notifications enabled |
| `/api/overlay/now-playing` | GET | public | Public GET endpoint for OBS overlays — no auth required |
| `/api/overlay/now-playing/update` | POST | session |  |
| `/api/platforms/facebook` | GET,DELETE | session |  |
| `/api/platforms/facebook/broadcast` | POST | session | Optional: override which page to stream to (defaults to primary page) |
| `/api/platforms/hive` | POST,DELETE | session | — Connect a Hive account to the current user |
| `/api/platforms/kick` | GET,DELETE | session |  |
| `/api/platforms/lens` | POST,DELETE | session | Strict EVM address shape. Validating to 0x + 40 hex chars BEFORE interpolating |
| `/api/platforms/twitch` | GET,DELETE | session | Optional: look up another user's public Twitch info by FID (no secrets) |
| `/api/platforms/youtube` | GET,DELETE | session |  |
| `/api/platforms/youtube/broadcast` | POST | session |  |
| `/api/profile/platforms` | GET | session | — Fetch the current user's connected platform statuses |
| `/api/proposals` | GET,POST,PATCH | admin | — List proposals with vote tallies |
| `/api/proposals/comment` | GET,POST | session | — Get comments for a proposal |
| `/api/proposals/test-publish` | GET | admin | — Debug endpoint to test the publish threshold flow |
| `/api/proposals/vote` | POST | session |  |
| `/api/publish/bluesky` | POST | admin |  |
| `/api/publish/compose` | POST | admin | The missing orchestrator. ZAO already had every publisher (auto-cast, x, |
| `/api/publish/discord` | POST | admin |  |
| `/api/publish/engagement` | GET | admin | — Fetch engagement metrics for published posts |
| `/api/publish/farcaster` | POST | admin | — Publish a governance-approved proposal to @thezao Farcaster account |
| `/api/publish/hive` | POST | session |  |
| `/api/publish/lens` | POST | session |  |
| `/api/publish/status` | GET | session | — Check cross-platform publish status for a given cast hash |
| `/api/publish/telegram` | POST | admin |  |
| `/api/publish/threads` | POST | admin |  |
| `/api/publish/x` | POST | admin |  |
| `/api/respect/event` | POST | admin |  |
| `/api/respect/fractal` | POST | admin |  |
| `/api/respect/leaderboard` | GET | session |  |
| `/api/respect/leaderboard/embed` | GET | public |  |
| `/api/respect/member` | GET | session |  |
| `/api/respect/sync` | POST | admin |  |
| `/api/respect/transfers` | GET | admin |  |
| `/api/scrape` | GET | session |  |
| `/api/search` | GET | session | --------------------------------------------------------------------------- |
| `/api/search/users` | GET | session |  |
| `/api/snapshot/polls` | GET | public | Returns active + recent Snapshot polls for the ZAO space |
| `/api/social/clusters` | GET | session | In-memory cache — 1 hour TTL |
| `/api/social/community-graph` | GET | session | Cache the full graph in memory for 10 minutes (drastically reduces Neynar calls) |
| `/api/social/compare` | GET | session | Per-pair cache — 5 minute TTL |
| `/api/social/engagement` | GET | session | Returns global + personalized OpenRank engagement scores for the given FIDs |
| `/api/social/engagement-heatmap` | GET | session | In-memory cache — 1 hour TTL, keyed by FID |
| `/api/social/growth` | GET | session | Returns member_stats_history for the requested FID over the requested period |
| `/api/social/spotlight` | GET | session | Deterministic: sorts by respect, picks index = dayOfYear % count |
| `/api/social/suggestions` | GET | session | — Follow suggestions for the current user |
| `/api/social/taste-match` | GET | session | Compares current user's liked songs with target user's liked songs |
| `/api/social/trending` | GET | session | Returns top-ranked users in a Farcaster channel via OpenRank |
| `/api/social/trending-topics` | GET | session | Clamp a non-numeric/negative limit to the default (never pass NaN downstream) |
| `/api/social/unfollowers` | GET | session | Returns recent unfollowers for the authenticated user |
| `/api/social/verifications` | GET | public | Intentionally PUBLIC (no session guard): returns a FID's on-chain account |
| `/api/songjam/leaderboard` | GET | public | Cache for 60 seconds |
| `/api/spaces/chat` | GET,POST | session |  |
| `/api/spaces/gate-check` | POST | session |  |
| `/api/spaces/hand-raise` | GET,POST | session |  |
| `/api/spaces/leaderboard` | GET | public |  |
| `/api/spaces/past` | GET | session |  |
| `/api/spaces/scheduled` | GET,POST | session |  |
| `/api/spaces/scheduled/[id]/rsvp` | POST,DELETE | session |  |
| `/api/spaces/session` | POST,PATCH | session |  |
| `/api/spaces/song-request` | GET,POST,PATCH | session |  |
| `/api/spaces/stats` | GET | session |  |
| `/api/spaces/tips` | GET,POST | session |  |
| `/api/spaces/voice-agent/token` | POST | session | Mint a short-lived signed ElevenLabs ConvAI URL for a space voice agent |
| `/api/spore/verify` | GET,POST | public | Spore federation boundary - Phase 4, the externally-reachable verify surface |
| `/api/staking/leaderboard` | GET | public | src/app/api/staking/leaderboard/route.ts |
| `/api/streaks` | GET | session |  |
| `/api/streaks/record` | POST | session |  |
| `/api/stream/rooms` | POST | session |  |
| `/api/stream/rooms/[id]` | GET,PATCH | admin |  |
| `/api/stream/token` | POST | session | Auth guard — prevent unauthenticated token minting |
| `/api/stream/webhook` | POST | public | Verify Stream.io webhook signature |
| `/api/tasks/list` | GET | session |  |
| `/api/twitch/chat` | GET,POST | session |  |
| `/api/twitch/clip` | POST | session |  |
| `/api/twitch/marker` | POST | session |  |
| `/api/twitch/poll` | POST,PATCH | session |  |
| `/api/twitch/prediction` | POST,PATCH | session |  |
| `/api/twitch/stream-info` | GET | session | Get a valid token (auto-refreshes if expired) |
| `/api/upload` | POST | session |  |
| `/api/users/[fid]` | GET | session |  |
| `/api/users/[fid]/followers` | GET | session |  |
| `/api/users/[fid]/following` | GET | session |  |
| `/api/users/block` | POST,DELETE | session |  |
| `/api/users/follow` | POST,DELETE | session |  |
| `/api/users/follow-batch` | POST | session | Batch follow multiple users at once |
| `/api/users/messaging-prefs` | GET,PATCH | session | — return current messaging preferences (with defaults) |
| `/api/users/mute` | POST,DELETE | session |  |
| `/api/users/profile` | GET,PATCH | session |  |
| `/api/users/socials` | GET,PATCH | session |  |
| `/api/users/solana-wallet` | GET,POST,DELETE | session |  |
| `/api/users/storage` | GET | session |  |
| `/api/users/wallet` | GET | session |  |
| `/api/users/wallet-visibility` | GET,PATCH | session |  |
| `/api/users/xmtp-address` | POST | session | Save the user's XMTP-derived address so other members can discover them |
| `/api/wavewarz/artists` | GET | session | Clamp a non-numeric/negative limit to the default (never pass NaN downstream) |
| `/api/wavewarz/battles` | GET | session |  |
| `/api/wavewarz/random-stat` | GET | session |  |
| `/api/wavewarz/sync` | POST | cron | Verify cron secret |
| `/api/webhooks/alchemy` | POST | public | Two webhooks, two signing keys (ZOR ERC-1155 + OG ERC-20) |
| `/api/webhooks/github` | POST | signed | GitHub webhook -> Hermes activity feed |
| `/api/webhooks/neynar` | POST | signed | Extract channel ID from Neynar cast object |
| `/api/zounz/proposals` | GET | session | — Fetch ZOUNZ on-chain proposal count and governance info |
| `/api/zounz/proposals/list` | GET | session | Nouns Builder Goldsky subgraph (may be 404 — falls back to getLogs) |
| `/juke-integration.md` | GET | public | integration. The Juke team's agent can fetch this URL and get a stable, |

## lib domains

__tests__, agents, ai, apo, auth, autocliper, bloodstream, bluesky, broadcast, control-plane, cortex, crm, db, discord, dreamnet, ears, empire-builder, ens, eyes, farcaster, format, gates, grids, hats, heart, jina, library, livepeer, memory, moderation, music, nexus, openrank, ordao, organism, ornode, os, portal, publish, push, respect, scrape, security, snapshot, social, solana, sopha, spaces, spore, staking, stock, twitch, unlock, validation, wagmi, wavewarz, xmtp, zounz

## component groups

admin, badges, calls, chat, community, compose, ecosystem, events, feedback, gate, governance, hats, home, library, members, messages, miniapp, music, navigation, os, portal, providers, pwa, respect, search, settings, shared, social, solana, spaces, streaks, ui, wallet, wavewarz, zounz

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Regenerate this map in the SAME PR as any route/page add or remove | @Zaal (Claude, standing) | Discipline | standing |
| Search this map before proposing any ZAOOS build | @Zaal (Claude, standing) | Discipline | standing |
| Audit the `public` auth rows for anything that should be gated | @Zaal | Security review | 2026-08-14 |
| Re-verify quarterly (next 2026-11-07) | @Zaal (Claude) | Refresh | 2026-11-07 |

## Also See

- [Doc 2239](../../agents/2239-zoe-capability-map/) - ZOE's 102-module map (the agent-side twin).
- `.claude/rules/confirm-before-claiming-absence.md` - the rule this map serves.
