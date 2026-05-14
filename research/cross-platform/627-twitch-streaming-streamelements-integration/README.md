---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 214, 192, 215, 217, 233, 275
tier: STANDARD
---

# 627 - Twitch Streaming + StreamElements Integration for ZAO

> **Goal:** Map Twitch streaming creator-tooling layer (StreamElements) to ZAO ecosystem use cases - COC Concertz live broadcasts, BetterCallZaal personal streams, FISHBOWLZ revival, WaveWarZ event coverage. Doc 214 covers raw Helix API. This doc covers the overlay/alert/tipping/loyalty layer that sits on top, plus 2026 Twitch direction (EventSub Conduits, IRC sunset).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Creator-tooling vendor** | USE StreamElements over Streamlabs - lower CPU (3-5%), free overlay templates, less aggressive monetization, browser-based dashboard fits ZAO cloud-first stack |
| **Auth model for ZAO -> SE** | USE JWT for Zaal's own channels (BCZ, COC Concertz house channel). USE OAuth2 if ZAO ever onboards external creators (multi-tenant) |
| **Realtime alert pipe** | USE StreamElements WebSocket (Socket.IO 2.2+ at `realtime.streamelements.com`) for tip/follow/sub/cheer/raid events. Mirror into Supabase `events` table for ZAO dashboard |
| **Twitch chat strategy** | MIGRATE off IRC to EventSub WebSocket + Helix send-message. IRC has new concurrent-join limits and is deprecation-flagged |
| **Scaling chat across multi-creator** | USE Twitch Conduits transport - shard EventSub across WebSocket workers, single subscription pool |
| **Affiliate path for ZAO creators** | TARGET 50 followers + 500 broadcast minutes + 7 days + 3 avg viewers in 30 days. Sub revenue split = 50%, $2.50 per Tier 1 sub. Bits = $0.01 each. Payout NET 15 above $50 |
| **OBS-side software** | USE OBS Studio + StreamElements browser-source overlay (single source, low CPU). SKIP OBS.Live (StreamElements' OBS fork) - extra fork to maintain |
| **Skip for now** | StreamElements Sponsorships (SE.SP) - invitation-only, not a fit for ZAO's owned-distribution thesis. Streamlabs Desktop - desktop-only, locks creators into Logitech ecosystem |

---

## Part 1 - StreamElements Feature Catalog

StreamElements is a cloud-hosted creator tooling stack. Free for all features used here. Splits into 6 product surfaces:

| Surface | What It Does | ZAO Use Case |
|---------|-------------|--------------|
| **Overlay Editor** | Browser-based scene builder. Outputs single browser-source URL for OBS. Supports HTML/CSS/JS custom widgets | COC Concertz lower-thirds with artist name pulled from set list. BCZ stream cards branded with `bettercallzaal.com` |
| **Alerts** | Animated visual + sound triggers on tip/follow/sub/cheer/raid/host | Trigger ZAO Respect drop on cheer over X bits. Animate FISHBOWLZ logo on raid in |
| **Chatbot** | Commands, counters, spam filters, modules, quotes, timers, variables. Twitch-only | `!zao` command links to bettercallzaal.com. `!fid` returns viewer Farcaster FID via custom variable |
| **Tip Page** | Hosted donation page with presets. Supports PayPal, Stripe, crypto (limited). Default UI clunky - needs custom CSS | Drop-in for any ZAO creator. CSS theme to match ZAO orange/cyan |
| **Loyalty Store** | Channel-currency system. Viewers earn watching, redeem rewards (sound effects, song requests, TTS messages, gift codes) | Maps to Respect concept - parallel currency for casual viewers vs Respect for community members |
| **Sponsorships (SE.SP)** | Invitation-only marketplace connecting brands to creators. Native ad reads | SKIP - not aligned with ZAO sovereignty thesis |

### What StreamElements does NOT do

- Multi-platform streaming (no RTMP fan-out) - ZAO already has this via Stream.new + Restream patterns (Doc 192, 215)
- Native Kick support - chat only, no overlays. If Kick matters, use Streamlabs instead
- Mobile broadcasting - browser overlays only, no mobile-app capture

---

## Part 2 - StreamElements API + Realtime

### Auth: JWT vs OAuth2

| Mode | Use For | How |
|------|---------|-----|
| **JWT** | Single channel (yours) | Copy from `streamelements.com/dashboard/account/channels`. No refresh - regenerate when expired. Pass as `Authorization: Bearer <jwt>` |
| **OAuth2** | Multi-tenant app (ZAO onboarding external creators) | Standard OAuth2 dance. Refresh token works |

Decision for ZAO: start with JWT for Zaal's BCZ + COC Concertz house channels. Move to OAuth2 only when external creator self-onboarding ships.

### REST API

Base: `https://api.streamelements.com/kappa/v2/`
- `/channels/{channel}` - channel metadata
- `/tips/{channel}` - tip history (read), create test tip
- `/loyalty/{channel}/leaderboard` - top earners
- `/store/{channel}/items` - manage redeemable rewards
- `/bot/commands/{channel}` - chatbot command CRUD
- `/activities/{channel}` - unified event feed (tips, follows, subs, etc)

### WebSocket Realtime

```
URL: https://realtime.streamelements.com
Transport: Socket.IO 2.2+
Auth: socket.emit('authenticate', { method: 'jwt', token: JWT_TOKEN })
        OR { method: 'oauth2', token: ACCESS_TOKEN }
Heartbeat: server PING every 30s, client must PONG within 70s
```

Subscribe events:

| Event | Fires On | Payload Fields |
|-------|----------|----------------|
| `event` | tip, follow, sub, cheer, raid, host (live) | `type`, `provider` (twitch/youtube/facebook), `data.username`, `data.amount`, `data.message`, `data.tier`, `data.streak` |
| `event:test` | dashboard test trigger | Same shape, `isMock: true` |
| `event:update` | session counter change | Running totals |
| `event:reset` | session reset | Empty |

### Integration sketch for ZAO OS

```typescript
// src/lib/streamelements/realtime.ts (proposed - does not exist yet)
import { io } from 'socket.io-client';

export function subscribeStreamElements(jwt: string, onEvent: (e: SEEvent) => void) {
  const socket = io('https://realtime.streamelements.com', { transports: ['websocket'] });
  socket.on('connect', () => {
    socket.emit('authenticate', { method: 'jwt', token: jwt });
  });
  socket.on('event', onEvent);
  return () => socket.disconnect();
}
```

Mirror into Supabase `stream_events` table -> ZOE can react (e.g., post a Farcaster cast on big tip, drop Respect on raid).

---

## Part 3 - Twitch Streaming 2026 Direction

### IRC Deprecation Path

Twitch IRC chat is functionally end-of-life:
- Concurrent-join limits added in 2025 - bots that connect to many channels hit caps fast
- TwitchIO 3.x removed IRC from core; chat events flow through EventSub
- Helix `POST /helix/chat/messages` is the new send path (scope: `user:write:chat`)

**Migration moves required:**

| Old | New | Scope |
|-----|-----|-------|
| IRC `JOIN #channel` | EventSub subscription `channel.chat.message` | `user:read:chat` |
| IRC `PRIVMSG` | `POST /helix/chat/messages` | `user:write:chat` |
| IRC connection state | EventSub WebSocket session_id | - |

ZAO action: update doc 214's scope plan - add `user:read:chat` + `user:write:chat` to Phase 1.

### EventSub Transports (Pick One)

| Transport | When | Pros | Cons |
|-----------|------|------|------|
| **WebSocket** | Single-process bot, dev/test | Simple. No public endpoint needed | One socket = max 300 subscriptions |
| **Webhook** | Server with public HTTPS | High volume, durable | Must verify HMAC, handle retries |
| **Conduits** | Multi-creator scale | Single subscription pool, shard across N WebSocket workers | More complex setup |

ZAO recommendation: WebSocket per creator for now, Conduits when ZAO hits 10+ active streamers.

### EventSub WebSocket Keepalive

EventSub server sends Keepalive messages every ~10s. Client does NOT need to respond. Use for liveness; if no message in 30s, reconnect.

### Recent Beta Endpoints (2026)

- `GET /helix/channels/power-ups` - broadcaster custom Power-ups (open beta)
- EventSub `channel.power_up.redemption` - notifications when viewers redeem (open beta)

### Affiliate vs Partner Economics

| Tier | Threshold (30-day rolling) | Sub split | Other |
|------|---------------------------|-----------|-------|
| **Affiliate** | 50 followers, 500 min broadcast, 7 unique days, 3 avg concurrent viewers | 50% | Bits, ad rev share, channel points, 14-day VOD |
| **Partner** | 75 avg concurrent, 12 unique days, 25 hours | 50-70% (varies) | Priority support, Partner badge, more emote slots |

Payout: $50 minimum, NET 15 (paid 15 days after end of month threshold crossed).

Sub price tiers: $4.99 / $9.99 / $24.99. Bits: $0.01 each.

ZAO COC Concertz house channel is most likely Affiliate target - virtual concerts often pull 10-30 concurrent which clears the bar.

---

## Part 4 - Mapping to ZAO Ecosystem Projects

### COC Concertz (highest fit)

- House Twitch channel for streaming sets
- StreamElements: artist lower-third overlay pulled from set list, tip page splits to artist + COC, loyalty points double as concert raffle entries
- EventSub: `stream.online` -> auto-cast "live now" to Farcaster, post to ZAO OS `/spaces`
- Action: spin up house channel, configure SE, wire EventSub to ZOE

### BetterCallZaal (medium fit)

- Personal streaming (consulting AMAs, build-in-public sessions, music drops)
- StreamElements overlays branded with ZAO orange/cyan + Syne font
- Tip page redirects to crypto donate or Coinflow
- Mini app integration: when stream goes live, BCZ Farcaster mini app shows live indicator
- Action: register Twitch app, configure SE, add live state to `index.html`

### FISHBOWLZ (paused, but planning)

- Was audio-rooms; if revived post-Juke, video rooms via Twitch streaming layer becomes optional
- StreamElements not critical here - more a Stream.new + Whip/Whep play (Doc 233, 275)
- Action: revisit when FISHBOWLZ unpauses

### WaveWarZ + ZAO OS

- Event coverage streams (artist showcases, prediction-market debates)
- Same SE setup as COC, different theme
- Action: piggyback on COC Concertz house channel infra

---

## Part 5 - Current ZAO OS Twitch Code (Ground Truth)

| File | What's there |
|------|--------------|
| `src/app/api/auth/twitch/route.ts` | OAuth init, 3 scopes (see Doc 214) |
| `src/app/api/auth/twitch/callback/route.ts` | Token exchange, save to `connected_platforms` |
| `src/app/api/platforms/twitch/route.ts` | GET/DELETE platform connection |
| `src/components/settings/TwitchConnect.tsx` | Connect/disconnect UI |
| `src/components/spaces/BroadcastModal.tsx` | Multi-platform broadcast picker |

**Gaps for full StreamElements + EventSub setup:**

1. No `src/lib/streamelements/` directory exists yet
2. No `stream_events` Supabase table yet
3. EventSub subscriptions not wired (Doc 214 P1 work)
4. Chat send-message scope not requested
5. Conduits not used (premature - need 10+ creators first)

---

## Part 6 - Community Sentiment Snapshot

Synthesizing across r/Twitch, r/streaming threads, comparison reviews (StreamScheme, Restream, Nerd or Die, Castr, FragileGFX), Trustpilot:

**Pro-StreamElements consensus:**
- "doesn't try to nickel and dime me as much as Streamlabs" (Trustpilot review pattern)
- Lower CPU than Streamlabs Desktop (cloud rendering)
- Free overlay templates (Streamlabs paywalls many)
- Browser-based = no app install, fits remote creators

**Anti-StreamElements signal:**
- Smaller user base than Streamlabs - fewer Stack Overflow answers, fewer YouTube tutorials
- Default tip page UI is "clunky" - needs custom CSS to look good
- Kick support is chat-only, no overlays (vs Streamlabs full Kick native)
- Less polished onboarding for first-time streamers

**Verdict for ZAO:** Pro-SE outweighs cons. ZAO already has design talent for tip page CSS. ZAO is not Kick-first. Lower CPU matters when streaming alongside heavy app workloads.

---

## Also See

- [Doc 214 - Twitch API Deep Integration](../214-twitch-api-deep-integration/) - Helix endpoint map, scope expansion plan
- [Doc 192 - Multiplatform Streaming RTMP](../../infrastructure/192-multiplatform-streaming-rtmp/) - RTMP fan-out architecture
- [Doc 215 - OBS / Restream / Streamyard](../../infrastructure/215-obs-restream-streamyard-feature-analysis/) - Comparison of streaming software
- [Doc 217 - AV Quality Optimization](../../infrastructure/217-av-quality-optimization-live-streaming/) - Bitrate, codec, latency
- [Doc 233 - Spaces Streaming Audit](../../infrastructure/233-spaces-streaming-full-audit/) - ZAO OS streaming surface
- [Doc 275 - Stream Video SDK Configuration](../../infrastructure/275-stream-video-sdk-dashboard-configuration/) - GetStream.io dashboard

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set up COC Concertz house Twitch channel + connect StreamElements (free tier) | @Zaal | Ops | 2026-05-23 |
| Add `user:read:chat` + `user:write:chat` to Twitch OAuth scope plan in Doc 214 | @Zaal | Doc update | 2026-05-16 |
| Spike `src/lib/streamelements/realtime.ts` against Zaal's personal SE JWT | @Zaal | PR | 2026-05-30 |
| Schema: add `stream_events` table to Supabase (provider, channel_id, event_type, payload jsonb, ts) | @Zaal | Migration | 2026-05-30 |
| Migrate any IRC bot code in ZAO OS to EventSub WebSocket transport | @Zaal | PR | After Doc 214 P1 ships |
| Add Twitch Affiliate eligibility tracker to ZAO OS dashboard (counts followers/min/days/avg viewers per connected channel) | @Team | Feature | Future sprint |
| BCZ: add Twitch live-state badge to `index.html` (poll Helix `/streams` every 60s) | @Zaal | PR | 2026-05-23 |
| Revisit FISHBOWLZ streaming layer post-Juke partnership unfreeze | @Zaal | Decision | When FISHBOWLZ unpauses |

---

## Sources

- [StreamElements Documentation](https://docs.streamelements.com/) - chatbot, overlays, websockets index. Verified 2026-05-09
- [StreamElements API OAuth2 Reference](https://dev.streamelements.com/docs/api-docs/cd02cda5171ea-o-auth2) - OAuth2 vs JWT auth modes. Verified 2026-05-09
- [StreamElements WebSocket docs (GitHub)](https://github.com/StreamElements/api-docs/blob/main/docs/Websockets.md) - Socket.IO 2.2+, event payload shapes. Verified 2026-05-09
- [StreamElements Quick-Start Guide](https://support.streamelements.com/hc/en-us/articles/10474662182162-Quick-Start-Guide) - Overlay editor, alerts, loyalty. Verified 2026-05-09
- [StreamElements Sponsorships overlay](https://support.streamelements.com/hc/en-us/articles/23284211803282-How-to-Add-the-Sponsorship-Overlay-to-Your-OBS-Studio) - SE.SP product context. Verified 2026-05-09
- [StreamElements features page](https://streamelements.com/features) - Product surface list. Verified 2026-05-09
- [Twitch Migrating from IRC](https://dev.twitch.tv/docs/chat/irc-migration/) - IRC -> EventSub migration. Verified 2026-05-09
- [Twitch EventSub docs](https://dev.twitch.tv/docs/eventsub/) - Transports, Conduits, WebSocket keepalive. Verified 2026-05-09
- [Twitch Product Lifecycle](https://dev.twitch.tv/docs/product-lifecycle/) - PubSub legacy status. Verified 2026-05-09
- [Twitch Affiliate Program](https://help.twitch.tv/s/article/joining-the-affiliate-program) - Affiliate thresholds, sub split. Verified 2026-05-09
- [Twitch Monetized Streamer Agreement](https://legal.twitch.com/en/legal/monetized-streamer-agreement/) - Payout terms. Verified 2026-05-09
- [Streamlabs vs StreamElements 2026 - StreamScheme](https://www.streamscheme.com/streamlabs-vs-streamelements/) - Comparison, community sentiment. Verified 2026-05-09
- [Streamlabs vs StreamElements - Restream Learn](https://restream.io/learn/comparisons/streamlabs-vs-streamelements/) - Architecture differences. Verified 2026-05-09
- [Streamlabs vs StreamElements - Nerd or Die](https://nerdordie.com/blog/tutorials/streamlabs-vs-streamelements/) - Overlay templates, customization. Verified 2026-05-09
- [StreamElements Reviews - Trustpilot](https://www.trustpilot.com/review/streamelements.com) - Customer review aggregate. Verified 2026-05-09
- [twitch4j EventSub WebSocket](https://twitch4j.github.io/eventsub/websocket/) - Keepalive behavior reference. Verified 2026-05-09
