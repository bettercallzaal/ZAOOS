---
topic: farcaster, technology
type: guide
status: research-complete
last-validated: 2026-07-18
related-docs: 1480-zao-mini-app-spec, 1425-wavewarz-farcaster-miniapp-spec, 591-miniapp-production-audit, 575-miniapp-splash-best-practices
original-query: "Farcaster miniapp analytics + distribution — what's missing from the production audit for the ZAO mini-app Phase 1 launch (Aug 15)"
tier: STANDARD
---

# 1492 — Farcaster Mini App: Analytics + Distribution Playbook (July 2026)

> **Goal:** Fill the gap between "built correctly" (covered by docs 575 and 591) and "discovered and retained." Directly supports the ZAO mini-app (doc 1480) Phase 1 launch target of Aug 15, and the send-to-Neynar/Arthur deadline of Jul 25. Everything here applies to the WaveWarZ battle voting frame.

---

## The Distribution Model: Social Graph IS the Channel

Unlike traditional app stores, Farcaster mini-app distribution is primarily social. Every cast that embeds your mini-app as a frame card is a distribution event. The social graph does the work that the App Store does elsewhere.

**What this means for ZAO:** ZOE auto-posts every WaveWarZ battle announcement to /wavewarz. If that cast includes the battle voting frame, every post is distribution. The mini-app is already wired to ZOE's posting cadence — no separate distribution strategy needed at launch. **The battle post IS the ad.**

---

## Discovery Surfaces (Three Tiers)

### Tier 1 — Feed Embeds (Primary)
A cast containing `fc:frame` or `fc:miniapp` metadata renders as an interactive card inside Warpcast:
- Shows battle image (artist A vs B, SOL pool, time remaining)
- [Vote Artist A] / [Vote Artist B] buttons inline
- Tapping a button executes the vote action without leaving Warpcast

This is the highest-reach surface. Every ZOE battle cast reaches /wavewarz followers + any channel the cast appears in.

### Tier 2 — Mini App Catalog / Store
Warpcast maintains an in-app mini-app store. Apps appear there based on:
- Valid `/.well-known/farcaster.json` manifest (accountAssociation required — proves domain ownership linked to a Farcaster FID)
- Populated optional metadata: `subtitle`, `description`, `category`, `tags`, `screenshots`, `heroImage`
- NOT set to `noindex: true`

External aggregators (miniapps.zone, community directories) also index the manifest. These surfaces drive organic discovery from non-followers.

**Action for ZAO mini-app (before Jul 25):** Publish the `/.well-known/farcaster.json` at `wavewarz.info` with full optional metadata. Generate the `accountAssociation` signature (domain→FID binding) using the Mini App Manifest Tool. Category: `games` or `social`. Tags: `music`, `battles`, `wavewarz`, `prediction`.

### Tier 3 — In-App "Add" Prompt
From inside the mini-app, call `sdk.actions.addMiniApp()` at the right moment (after first vote, not on landing) to trigger the add-to-library flow. Users who add the app can receive push notifications — the primary retention loop.

---

## Analytics: Two Layers

### Layer 1 — Built-In Neynar Analytics
If using `@neynar/react`, enable with:
```jsx
<MiniAppProvider analyticsEnabled={true}>
  {children}
</MiniAppProvider>
```
This emits standard engagement events (opens, session duration, button interactions) to Neynar's analytics dashboard. Zero implementation cost.

### Layer 2 — Custom Supabase Analytics (already in spec)
Doc 1480 already includes a `frame_votes` Supabase table:
```sql
CREATE TABLE frame_votes (
  fid BIGINT NOT NULL,
  battle_id TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fid, battle_id)
);
```

This IS the analytics store. From it, derive:

| Metric | Query |
|--------|-------|
| Unique voters per battle | `COUNT(DISTINCT fid) WHERE battle_id = X` |
| Vote conversion rate | unique_voters / impressions (impressions from ZOE's cast analytics) |
| Outcome accuracy | compare choice to winner after battle closes |
| Voter retention | FIDs who voted in 3+ battles (loyal users) |
| Channel breakdown | which casts drove the most votes (cross-ref cast FID → channel) |

**Key engagement signal to track:** `unique_voter_fids / cast_impressions`. If a battle cast gets 500 impressions and 25 votes, that's a 5% interactive conversion rate. Top Farcaster frames historically hit 3-8%. WaveWarZ should aim for 5%+ given the high-energy battle format.

---

## Notification System: The Retention Engine

Farcaster notifications are "the most important tool for retaining users beyond initial onboarding" (Neynar, 2026). Without them, users vote once and forget the mini-app.

### How it works
1. User taps "Enable Notifications" inside mini-app (or is prompted after voting)
2. Farcaster client generates a unique `notificationToken` + `notificationUrl` for that user
3. These are posted to your `webhookUrl` as a `notifications_enabled` event
4. Your server stores `{fid, notificationToken, notificationUrl}`
5. When a battle the user voted on closes → POST to their `notificationUrl`:

```json
{
  "notificationId": "result:battle123:fid456",
  "title": "Your Battle Result Is In",
  "body": "Artist A won! You predicted correctly.",
  "targetUrl": "https://wavewarz.info/battle/123",
  "tokens": ["<notificationToken>"]
}
```

### Rate limits
- Max 1 notification per 30 seconds per app
- Max 100 per day per token
- Idempotent by `(FID, notificationId)` for 24 hours (safe to retry)

### Webhook events to handle
| Event | When | Action |
|-------|------|--------|
| `miniapp_added` | User adds to library | Store FID + notification details |
| `miniapp_removed` | User removes | Mark as inactive, stop notifying |
| `notifications_enabled` | User opts in | Store token + url, start notifying |
| `notifications_disabled` | User opts out | Mark as suppressed |

### Optimal notification triggers for WaveWarZ
1. **Battle result** (high-value, personalized): "Artist A won the battle you voted on"
2. **Battle opening** (re-engagement): "New battle live: [Artist] vs [Artist] — vote now"
3. **Milestone** (social proof): "1,000 votes cast on WaveWarZ battles this week"

**Don't over-notify:** 1 result notification per voted battle + 1 weekly "new battles" digest is the right floor. No spam.

---

## Manifest Checklist for WaveWarZ (Before Jul 25 Send)

File: `wavewarz.info/.well-known/farcaster.json`

```json
{
  "accountAssociation": {
    "header": "<base64url encoded header>",
    "payload": "<base64url encoded payload>",
    "signature": "<base64url encoded signature>"
  },
  "miniapp": {
    "name": "WaveWarZ",
    "subtitle": "Live music battle voting",
    "description": "Vote on live WaveWarZ music battles and track your predictions. SOL-powered artist vs artist showdowns.",
    "iconUrl": "https://wavewarz.info/icon-512.png",
    "homeUrl": "https://wavewarz.info/app",
    "splashImageUrl": "https://wavewarz.info/splash.png",
    "splashBackgroundColor": "#0A0A0A",
    "webhookUrl": "https://wavewarz.info/api/miniapp/webhook",
    "category": "games",
    "tags": ["music", "battles", "prediction", "wavewarz", "web3"],
    "heroImageUrl": "https://wavewarz.info/hero-1200x630.png",
    "screenshotUrls": [
      "https://wavewarz.info/screenshot-1.png",
      "https://wavewarz.info/screenshot-2.png"
    ]
  }
}
```

Generate `accountAssociation` using: [Farcaster Mini App Manifest Tool](https://miniapps.farcaster.xyz/docs/guides/manifest)

---

## Phase 1 Launch Distribution Checklist

**Before Aug 15:**
- [ ] `/.well-known/farcaster.json` live at `wavewarz.info` with accountAssociation signed
- [ ] `fc:frame` embed metadata on battle landing pages
- [ ] `frame_votes` Supabase table created with RLS (FIDs are public; choices can be public)
- [ ] Webhook handler at `/api/miniapp/webhook` (handles added/removed/notifications events)
- [ ] Neynar analytics enabled (`analyticsEnabled={true}` on MiniAppProvider)
- [ ] `sdk.actions.addMiniApp()` prompt after first vote (not on landing)

**After Phase 1 live:**
- [ ] Submit to Warpcast mini-app catalog via Neynar developer portal
- [ ] Submit to miniapps.zone community directory
- [ ] ZOE posts first battle cast with frame embed; track vote conversion rate
- [ ] Post result notification to first cohort of voters (proof of notification system)

---

## Also See

- [Doc 1480 - ZAO Farcaster Mini App product spec](../../technology/1480-zao-mini-app-spec/) — Phase 1 target Aug 15
- [Doc 1425 - WaveWarZ Farcaster Mini App spec for Hurricane](../1425-wavewarz-farcaster-miniapp-spec/)
- [Doc 591 - Mini App production audit](../591-miniapp-production-audit/) — SDK init, auth flows, CSP
- [Doc 575 - Mini App splash best practices](../575-miniapp-splash-best-practices/) — ready() call patterns

## Sources

- [FULL] miniapps.farcaster.xyz/docs/specification — manifest spec, notification system, distribution mechanics
- [FULL] neynar.com/blog/mini-apps-software-as-content — software-as-content distribution model, notification retention
- [PARTIAL] docs.neynar.com/docs/convert-web-app-to-mini-app — `analyticsEnabled` param, manifest tool reference
- [FULL] Doc 1480 — Supabase schema (frame_votes) and Phase 1 architecture
