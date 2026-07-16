---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-07-16
superseded-by:
related-docs: 354, 355, 897, 912, 1089, 1107, 1112, 1128
original-query: "Platform management strategy doc: how ZAO manages ALL platforms (X, Farcaster, Instagram, TikTok, YouTube, LinkedIn, Facebook, Discord, Telegram) as ONE system. One-system design (content sources → clipping → scheduling → per-platform accounts), tooling picks, and CLIPPING ACCOUNTS plan."
tier: STANDARD-DEEP
---

# 1170 - ZAO Platform Management: One-System Design

> **Goal:** Treat 9 platforms as a single system — one content pipeline that feeds everything. No per-platform manual reinvention. Tooling is locked. Clipping accounts are spec'd and ready for Zaal to create + paste keys.

---

## Quick Decisions (read this first)

| Decision | Call | Why |
|----------|------|-----|
| **Cross-posting default** | Firefly (Farcaster + X simultaneously) | Battle-tested, handle-resolving, Zaal already uses it |
| **Clip distribution** | Postiz API (fire-and-forget to 15+ platforms) | Atomic multi-platform; POSTIZ_API_KEY already in zaalclip |
| **Live streaming hub** | Restream (OBS → Restream → 30+ platforms) | Already adopted (doc 912); zero extra encode per platform |
| **Clip engine** | zaalclip (Livepeer) → Postiz → platforms | Livepeer generates clip → Postiz distributes it |
| **ZOE posting** | src/lib/publish + approval gate (Telegram) | Battle-tested; do NOT replace with Postiz for ZOE posts |
| **TikTok/short-form** | zaalclip clips + (Flow Stage TBD — pending clarification) | zaalclip for auto-clips; Flow Stage tool for batch TikTok export once confirmed |
| **Account creation** | Zaal-gated (see Clipping Accounts Plan below) | Never automated; this doc preps names/bios/keys format |
| **Platforms to deprioritize now** | Facebook, LinkedIn | Low ROI for ZAO audience in 2026; post there via Postiz passively |

---

## The One-System Design

```
CONTENT SOURCES
├── Live streams (OBS + Restream Studio)
├── WaveWarZ battles (zaalclip / Livepeer)
├── ZABAL Games sessions (recorded via Restream Studio)
├── ZNN archive segments (zaoscribe → spacetovideo → ZAOVideoEditor)
├── Build-in-public updates (Zaal writes, ZOE assists)
└── Research/docs (ZOE summarizes for social)

        ↓ Clip / Format ↓

CLIPPING LAYER
├── zaalclip (Livepeer) — WaveWarZ battle highlights, stream clips (up to 60s)
├── Flow Stage (PENDING - see doc 1169) — batch TikTok non-AI video generation
├── OBS recording → local file → manual trim (longform YouTube)
└── Screenshots / images → Zaal uploads manually via Firefly

        ↓ Route ↓

ROUTING LAYER
├── Manual (Zaal) + Firefly → X + Farcaster (primary day-to-day posts)
├── ZOE approval gate → src/lib/publish → FC + X + BS + TG + Discord (teaser & agent posts)
├── Postiz API → 15+ platforms (clip distribution, automated, no approval needed for clips)
└── Restream → YouTube + Twitch + X Live + TikTok Live (live streams)

        ↓ Land on ↓

PER-PLATFORM ACCOUNTS
├── X: @bettercallzaal (personal/brand) + @zaoclipz (clip account, TO CREATE)
├── Farcaster: @zaalcaster (primary) — /zabal channel
├── Instagram: @bettercallzaal (existing) + @zaoclipz (clip account, TO CREATE)
├── TikTok: @bettercallzaal (TO VERIFY/CREATE) + @zaoclipz (TO CREATE)
├── YouTube: @bettercallzaal (existing) + ZNN channel (TO CREATE - doc 1128)
├── LinkedIn: @bettercallzaal (personal brand consulting)
├── Facebook: The ZAO page (events/COC Concertz posts)
├── Discord: ZAO server (clips + bot posts via webhook)
└── Telegram: @zaoclaw_bot / ZAO community group
```

---

## Tooling Stack (Locked Picks)

| Tool | Role | Cost | Status |
|------|------|------|--------|
| **Firefly** | Zaal's daily posting client — X + Farcaster simultaneous, handle resolution | Free | Active |
| **Restream** | Live multistream hub (30+ platforms, single upstream) | $16-$49/mo | Active |
| **OBS** | Local encoder for scene-heavy shows (WaveWarZ) | Free | Active |
| **zaalclip (Livepeer)** | WaveWarZ battle clips + stream highlight clips | Per-minute (Livepeer Growth) | Active |
| **Postiz API** | Atomic clip-to-all-platforms distribution (15+ in one call) | SaaS (zaalclip has POSTIZ_API_KEY) | Active |
| **src/lib/publish** | ZOE's approval-gated posting (Farcaster, X, Bluesky, Discord, Telegram, Threads) | $0 (self-built) | Active |
| **Flow Stage** | Batch non-AI TikTok video export (pending — see 1169) | TBD | PENDING |
| **Postiz (scheduling UI)** | Optional: schedule future posts via Postiz dashboard | SaaS | Available |

**Do NOT add:** Buffer, Hypefury, Typefully, or any SaaS that duplicates Firefly + Postiz. The stack is complete.

---

## Platform-by-Platform Breakdown

| Platform | Primary Account | Content | Cadence | Post Method | Priority |
|----------|----------------|---------|---------|-------------|----------|
| **Farcaster** | @zaalcaster | Governance, build-in-public, ZABAL, short takes | 1-3x/day | Firefly (manual) | P1 |
| **X** | @bettercallzaal | Same as FC + link-in-reply for events | 1-3x/day | Firefly (manual) | P1 |
| **YouTube** | @bettercallzaal | Long-form streams, WaveWarZ VODs, Shorts | 1x/week min | OBS recording → upload | P1 |
| **Discord** | ZAO server | WaveWarZ clips, bot posts, community | Per-event | src/lib/publish / webhook | P2 |
| **Telegram** | ZAO community | ZOE updates, clips, announcements | Per-event | ZOE / @zaoclaw_bot | P2 |
| **Instagram** | @bettercallzaal | Reels, WaveWarZ clips, ZAO-STOCK visuals | 2-4x/week | Postiz API (clips) | P2 |
| **TikTok** | @bettercallzaal | Short WaveWarZ clips, ZABAL snippets | Daily ideally | Postiz API (clips) | P2 |
| **Bluesky** | @bettercallzaal | Mirror of FC posts (via ZOE broadcast) | Per ZOE post | src/lib/publish | P3 |
| **LinkedIn** | Zaal Panthaki | BCZ consulting, professional build-in-public | 1x/week | Postiz API | P3 |
| **Facebook** | The ZAO Page | COC Concertz events, ZAO-STOCK promo | Per-event | Postiz API | P3 |
| **Threads** | @bettercallzaal | Mirror of IG (via src/lib/publish) | Per ZOE post | src/lib/publish | P3 |
| **Twitch** | ZAO channel | WaveWarZ battles live | Per-battle | OBS → Restream | P3 |

---

## Clipping Accounts Plan

One clip-focused account per visual platform — separate from the main brand account. Goal: high-cadence clip posting without polluting the brand voice account's feed. Zaal creates the accounts; this doc has everything ready to paste.

### Why clip accounts?

- WaveWarZ clips (60s) and ZABAL snippets are high-volume (2-5/day when active)
- Mixing clips with thoughtful brand posts on @bettercallzaal hurts both
- Dedicated clip accounts can be fully automated via Postiz (no approval gate needed for clips)
- Each clip account links back to main in bio → funnel

### Clip Account Specs (ready to create)

#### X: @zaoclipz

| Field | Value |
|-------|-------|
| **Handle** | @zaoclipz |
| **Display name** | ZAO Clipz |
| **Bio** | Best moments from WaveWarZ battles, ZABAL Games, and ZAO streams. Main: @bettercallzaal |
| **Profile pic** | ZAO logo (gold on navy) |
| **Banner** | WaveWarZ battle still |
| **Pinned post** | "We clip the best WaveWarZ battles so you don't miss them. Follow @bettercallzaal for the full story." |
| **Content cadence** | 1-3 clips/day (auto-post via Postiz) |
| **Post method** | Postiz API: auto-distribute on clip ready |
| **Key needed** | X OAuth 1.0a (4 keys) → paste into Postiz integration |

#### Instagram: @zaoclipz

| Field | Value |
|-------|-------|
| **Handle** | @zaoclipz |
| **Display name** | ZAO Clipz |
| **Bio** | WaveWarZ highlights + ZABAL Gamez clips. Battles every week. → @bettercallzaal |
| **Profile pic** | ZAO logo |
| **Content cadence** | 1-2 Reels/day (auto-post via Postiz) |
| **Post method** | Postiz API: IG Graph API token |
| **Key needed** | Instagram Graph API token (via Meta developer) → paste into Postiz integration |

#### TikTok: @zaoclipz

| Field | Value |
|-------|-------|
| **Handle** | @zaoclipz |
| **Display name** | ZAO Clipz |
| **Bio** | Music battle clips. WaveWarZ. ZABAL. Building music on-chain. @bettercallzaal |
| **Content cadence** | 1-3 clips/day + (Flow Stage batch drops when confirmed) |
| **Post method** | Postiz API: TikTok OAuth token |
| **Key needed** | TikTok OAuth token → paste into Postiz integration |
| **Note** | TikTok restricts some content; check Postiz content restrictions notice per clip |

#### YouTube: ZNN / ZAO Clips channel

| Field | Value |
|-------|-------|
| **Channel name** | ZNN — ZAO News Network |
| **Handle** | @zaonewsnetwork |
| **Description** | 24/7 ZAO ecosystem content. WaveWarZ battles, ZABAL Games sessions, build-in-public. Main: @bettercallzaal |
| **Content cadence** | Shorts: 2-3/week auto-uploaded; long-form: per-stream VOD |
| **Post method** | OBS recording → manual upload OR Postiz API (YouTube Shorts) |
| **Key needed** | Google API OAuth (YouTube Data API v3) → Postiz integration |
| **Note** | See doc 1128 for full ZNN 24/7 architecture (OBS + Livepeer + Restream) |

---

## Integration Checklist (Zaal creates accounts → pastes keys)

When Zaal creates each account, the setup is:

1. **Create account** with specs above
2. **Connect to Postiz:** Postiz dashboard → Channels → Add Channel → paste OAuth / API token
3. **Test:** POST one test clip via Postiz API (use `curl` or Postiz dashboard)
4. **Wire to zaalclip:** add the Postiz channel ID to the clip engine's platform list

```bash
# Test a clip via Postiz API (replace <API_KEY> and <CHANNEL_ID>)
curl -X POST https://api.postiz.com/public/v1/posts \
  -H "Authorization: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test clip - WaveWarZ highlights",
    "platforms": [{"id": "<CHANNEL_ID>", "settings": {}}],
    "scheduledAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
  }'
```

5. **Verify** clip appears on platform within 2 min
6. **Enable auto-fire** in clip engine (zaalclip: on successful clip → POST to Postiz)

---

## X Display Name Fix (from doc 1107)

Before doing anything else on X, fix the display name on @bettercallzaal:
- **Current:** "+Zaal (on farcaster)" — no brand value in SERPs
- **Fix:** Change to "Zaal | BetterCallZaal" or "Zaal Panthaki | BetterCallZaal"
- **How:** X Settings → Your Account → Account Information → Name
- **Impact:** Fixes brand signal in SERPs, Perplexity, Claude AI answers

---

## Known Gaps / Open Items

| Item | Status | Owner |
|------|--------|-------|
| Flow Stage doc (1169) | PENDING — waiting for Zaal to clarify which product | Zaal confirm, then social loop |
| @zaoclipz accounts across platforms | NOT CREATED — Zaal must create + paste keys | Zaal |
| X display name @bettercallzaal | NOT FIXED — 5-min change, high SEO impact | Zaal |
| YouTube @bettercallzaal channel SEO | NOT FIXED — update description, tags, about | Zaal |
| ZNN channel creation (doc 1128 MVP path) | NOT STARTED — requires Livepeer Growth tier + VPS encoder | Zaal approval |
| Postiz channel IDs for clip engine | NOT WIRED — pending account creation | After accounts created |
| Facebook The ZAO Page | STATUS UNKNOWN — verify page exists/active | Zaal check |

---

## Sources

- [FULL] Doc 354 - ZAO Cross-Posting Infrastructure Audit (`research/cross-platform/354-cross-posting-infrastructure-audit/`)
- [FULL] Doc 355 - Autonomous Social Distribution 2026 (`research/cross-platform/355-autonomous-social-distribution-2026/`)
- [FULL] Doc 897 - ZAO Social Posting Playbook (`research/community/897-zao-social-posting-playbook/`)
- [FULL] Doc 912 - Restream vs StreamYard vs OBS (`research/infrastructure/912-restream-vs-streamyard-vs-obs-workflow/`)
- [FULL] Doc 1089 - Postiz API/MCP/N8N (`research/infrastructure/1089-postiz-social-api-clip-engine/`)
- [FULL] Doc 1107 - SEO + GEO Strategy for ZAO Social Profiles (`research/identity/1107-seo-social-profiles/`)
- [FULL] Doc 1112 - Platform Profile Content: FC + X drafts (`research/community/1112-platform-profile-content/`)
- [FULL] Doc 1128 - ZNN 24/7 Livepeer Channel (`research/infrastructure/1128-znn-24-7-livepeer-channel/`)
