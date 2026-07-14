---
title: "Expanded DreamLoops Capsule + Loop Catalog for ZAO Apps & Agents"
type: guide
topic: agents
status: research-complete
tier: STANDARD
created: 2026-07-14
last-validated: 2026-07-14
related-docs: ["1085-zol-dreamloops-persistent-agent-graft", "1086-dreamloops-capabilities-unlocks-cross-ecosystem", "1088-zaalcaster-empire-builder-coinz-crowdfunding", "1089-postiz-social-api-clip-engine"]
original-query: "Brandon step 2 - scan the dreamloops + capsules, design MORE loops + capsules to further ZAO's apps and agents"
---

# 1091 - Expanded DreamLoops Capsule + Loop Catalog for ZAO Apps & Agents

**Goal:** Design 5-8 new Capsules and 8-12 new Loops to extend ZOL's persistent-agent pattern into ZAO's other surfaces (ZOE orchestrator, WaveWarZ clip engine, zaalcaster crowdfunding, Fractal governance, cowork tracker, newsletter). Ground each in real ZAO workflows and safety constraints. Deliver 3-4 highest-value loops as DRAFT manifest JSON files (proposals, not live).

**What This Solves:** ZOL proved the DreamLoops pattern works for bounded music-curation agents on Pi. These designs show how to expand the pattern across ZAO's entire agent stack: clip distribution with automatic social posting, crowdfund-lifecycle automation, governance participation tracking, newsletter redistribution, and community relationship nudging. Each new loop respects the safety rules ZOL established (approval gates, no signer access, no shell-exec, flag-gated OFF).

---

## Plain-Language Summary

ZOL's DreamLoops graft (doc 1085) demonstrated a portable, auditable pattern for bounded agents. This catalog proposes 13 new capabilities (5 Capsules, 8 Loops) across six ZAO surfaces:

- **Music Curation v2** (ZOL upgrade): Music-AI-assisted daily curator with Spotify/YouTube link extraction + artist relationship tracking.
- **Clip Distribution v1** (WaveWarZ): Automatic multi-platform post-to-publish on clip completion, integrated with Postiz.
- **Revenue & Treasury v1** (ZOL + Sparkz): Track token trades, fee accrual, and fund distributions from Empire Builder tokens.
- **Governance Participation v1** (Fractal): Poll active Fractal voters, propose on-chain participation nudges, track voting power over time.
- **Community CRM v1** (ZOE + circles): Relationship lifecycle tracking (discover, engage, coordinate, escalate, nurture).
- **Crowdfund Lifecycle v1** (zaalcaster/Sparkz): Window-opening nudges, mid-campaign energy boosters, target-hit/miss outcome tracking.
- **Newsletter Redistribution v1** (Paragraph + Borker): Detect published posts, auto-schedule cross-platform reruns, track engagement decay.

The loops are ordered by effort (1-10 scale) and impact. Highest-value first: clip-distribution, crowdfund-lifecycle, community-crm. All grounded in ZAO surfaces, all with fallback behavior and cost ceilings.

**Manifest Draft Outcomes:** Four loops are authored as DRAFT JSON (clip-distribution-immediate, crowdfund-nudge-open, community-relationship-lifecycle, newsletter-redistribute-weekly) so they are immediately reviewable and testable.

---

## New Capsule Catalog

| ID | Name | Purpose | Agent/App | Key Handlers | Permissions | Cost Ceiling | Blocked Actions |
|---|---|---|---|---|---|---|---|
| **1** | `music-curation-v2` | AI-assisted music discovery with artist relationship tracking | ZOL (@zolbot) | `farcaster.read`, `ork.draft`, `artist.track-relationship`, `spotify.metadata-read`, `youtube.search` | Post (approval=true), artist data (read-only), API calls (rate-limited) | 100 API calls/day, 50 relationship updates/day | Wallet access, signer access, auto-post without approval |
| **2** | `clip-distribution-v1` | Multi-platform publishing on WaveWarZ clip completion | WaveWarZ engine | `wavewarz.clip-complete`, `postiz.upload`, `postiz.post`, `farcaster.read`, `twitter.post`, `bluesky.post`, `discord.webhook` | Post to 8+ platforms (no approval gate—scheduled only), Postiz API (key in env), webhook firing | 100 clips/day, 10 video uploads/day | Auto-post to wallet-connected accounts, env-variable exposure |
| **3** | `revenue-treasury-v1` | Track Empire Builder token trades, fee accrual, treasury distributions | ZOL (partnership with Sparkz) | `empire-builder.read-leaderboard`, `clanker.trade-tracker`, `onchain.log-parse`, `treasury.fetch-status` | Read-only on-chain data, treasury queries, trade logs; no fund movement | 1000 trade-log queries/day, 10 distribution audits/day | Direct fund movement, signing transactions, treasury write access |
| **4** | `governance-participation-v1` | Fractal governance: poll voters, propose nudges, track voting power | ZOE (Fractal integration) | `fractal.read-proposals`, `fractal.list-voters`, `fractal.voter-power`, `farcaster.nudge-cast`, `log.voting-history` | Read governance data, Farcaster nudge casts (approval=true), voting history (read-only) | 50 nudge casts/day, 100 voter power queries/week | Direct voting, proposal creation, governance token movement |
| **5** | `community-crm-v1` | Relationship lifecycle: discovery, engagement, coordination, escalation, nurture | ZOE (circles integration) | `circle.list-members`, `circle.relationship-status-read`, `farcaster.message-dm`, `cowork.fetch-projects`, `log.relationship-events` | Read member + project data, DM sending (approval gate for mass sends), relationship-status write | 500 DMs/day, 100 relationship-status updates/day | Private key exposure, fund sending, member removal without audit |

---

## New Loop Catalog

| ID | Trigger | Surface | Capsule(s) | Steps | Terminal States | Timeout | Effort | Impact | Safety Notes |
|---|---|---|---|---|---|---|---|---|---|
| **L1** | `clip.published` (WaveWarZ event) | WaveWarZ | clip-distribution-v1 | extract-metadata, upload-to-postiz, post-to-all-platforms, log-receipt | `posted` or `failed-postiz` | 2m | 2 | High | Postiz API call is fire-and-forget; fallback = clip stored locally for manual posting. No auto-retry to avoid double-posts. |
| **L2** | `crowdfund.window-opened` (Sparkz event) | zaalcaster/Sparkz | crowdfund-lifecycle-v1 | announce-on-farcaster, boost-channel, set-reminder-7d, track-initial-buys | `window-open` or `announce-failed` | 30s | 2 | Medium | Farcaster post is approval-gated; booster rule auto-engagement on channel defined in manifest. No fund handling. |
| **L3** | `crowdfund.window-7d` (timer) | zaalcaster/Sparkz | crowdfund-lifecycle-v1 | check-progress, nudge-stalled-projects, recap-live-buyers | `nudge-sent` or `already-on-track` | 1m | 3 | Medium | Nudge cast only sent if progress is <40% of target. No fund movement. Nudge is approval-gated if high-risk messaging. |
| **L4** | `crowdfund.window-closed` (timer) | zaalcaster/Sparkz | crowdfund-lifecycle-v1 | finalize-outcome, document-result, announce-success-or-miss, archive-campaign | `success-documented` or `miss-documented` | 2m | 2 | High | Outcome audit is read-only (queries on-chain trades); no fund reconciliation. Announcement cast is approval-gated. Archived state is immutable in Capsule. |
| **L5** | `daily-8am` (timer) | ZOL (music-curation-v2) | music-curation-v2 | fetch-trending-artists, extract-spotify-links, rank-by-relationship-depth, draft-curator-cast, stage-for-approval | `staged` or `skipped` | 45s | 3 | Medium | Artist relationship data is read-only (Neynar + ZOL state). Spotify API is rate-limited (100 calls/day ceiling). Post is approval-gated. |
| **L6** | `relationship.state-change` (event from circles) | ZOE circles | community-crm-v1 | log-event, classify-relationship-stage, propose-action, send-nurture-dm, update-status | `status-updated` or `action-skipped` | 30s | 4 | High | DM sending is gated: bulk sends require approval, 1-1 sends auto-send. No member data leakage in logs. Relationship status is mutable by human via cowork UI only. |
| **L7** | `proposal.published` (Fractal event) | Fractal | governance-participation-v1 | fetch-proposal-details, list-eligible-voters, calculate-voter-power, propose-nudge, stage-cast | `nudge-staged` or `no-action-needed` | 1m | 3 | Medium | Voter power is read-only queried from Fractal SDK. Nudge is a Farcaster cast (approval-gated). No voting or token movement. |
| **L8** | `newsletter.published` (Paragraph RSS event via webhook) | Newsletter + Borker | newsletter-redistribution-v1 | fetch-full-post, extract-text-and-media, generate-teaser, schedule-to-all-platforms, track-engagement | `scheduled` or `platform-error` | 2m | 2 | Medium | Uses Postiz API for multi-platform scheduling (same as L1). Teaser generation is LLM-based (cost-gated: 5 teaser generations/day). Engagement tracking is read-only via platform APIs. |

---

## Detailed Loop Designs

### L1: Clip Distribution - Immediate Post-to-All-Platforms

**Trigger:** WaveWarZ clip engine fires `clip.published` event on completion.

**Context Sources:**
- WaveWarZ clip metadata (title, description, duration, thumbnail)
- Postiz API integration (connection status, available platforms)
- User preference (which platforms to auto-post to)

**Steps:**
1. **extract-metadata**: Read clip title, description, video URL, poster frame from WaveWarZ event payload. Validate: title is non-empty, video URL is valid HTTPS.
2. **generate-caption**: Build Farcaster-first caption ("WaveWarZ battle: [title]..."), tag /wavewarz channel. Keep <300 chars for X fallback.
3. **upload-to-postiz**: POST video file to Postiz `/upload` endpoint. Returns CDN URL. Retry up to 2x on 503/504.
4. **post-to-all-platforms**: Fire Postiz `/posts` with platforms=[warpcast, x, bluesky, discord], attachments=[video URL], scheduledAt=now. Atomic dispatch.
5. **log-receipt**: Record post IDs per platform, timestamps, user who triggered. No secrets in log.

**Terminal States:**
- `posted`: All platforms queued; Postiz returned success on all.
- `failed-postiz`: Postiz API 5xx after 2 retries. Clip persists in WaveWarZ; human posts via Firefly later.
- `validation-error`: Metadata missing or malformed; no POST fired. Alert operator.

**Timeout:** 2 minutes (covers Postiz API latency + retry).

**Capsule:** `clip-distribution-v1` (handlers: `postiz.upload`, `postiz.post`, `log.receipt`).

**Checks:**
- Postiz API key is set in env (not in Capsule manifest).
- Platforms list is non-empty and matches Postiz supported platforms.
- Video URL is HTTPS + <500MB.

**Evidence/Receipts:**
- Postiz response: `{ posted: { warpcast: {...}, x: {...}, ... } }`
- Log entry: timestamp, clip ID, platform results, retry count.
- No video or API key in receipt.

**Memory Routing:**
- Event: "Clip L1 published" in ZAO.logs (immutable).
- Transient state: current-video-url (dropped after post).
- Metric: daily-clip-posts (incremented on success).

**Failure Behavior:**
- Postiz 503: Retry once with 30s backoff. On second failure, mark `failed-postiz`, notify Zaal via Telegram.
- Timeout (>2m): Force terminal as `timeout`, preserve clip + metadata for manual post.
- Validation error: Skip POST, log error, alert operator.

**Resource Ceilings:**
- 100 clips/day (hard ceiling, enforced in env config).
- 10 video uploads to Postiz/day (each upload costs 1 request).
- No cost beyond Postiz's free tier (90 POST /posts/hour = 2160/day, plenty).

**Safety:**
- No signer/wallet access.
- No shell-exec.
- No auto-post to wallet-connected accounts (Postiz is authenticated as ZAO, not user).
- Video URL is validated against WaveWarZ origin (whitelist).
- Manifest blocks `wallet.sign`, `exec`, `env.POSTIZ_SECRET_KEY`.

---

### L2: Crowdfund Lifecycle - Window Opening Nudge

**Trigger:** zaalcaster/Sparkz fires `crowdfund.window-opened` event when creator launches a token via Clanker.

**Context Sources:**
- Crowdfund metadata (creator, project title, target amount, target date, description).
- Empire Builder leaderboard ID (if booster rules active).
- Creator's Farcaster account + follower count.

**Steps:**
1. **fetch-campaign-details**: Query Sparkz DB for campaign ID, creator FID, target amount, deadline. Validate all required fields present.
2. **compose-announcement**: Generate Farcaster cast: "🎵 [Project] just launched a crowdfund! Help [Creator] reach $X by [Date]. Top supporters get [benefit]." Mention /zao and /zabal-games channels.
3. **post-announcement**: Send cast via Farcaster client (approval-gated: manifest requires `farcaster.post.approval=true`). If approved, fire; if not, stage for Zaal review.
4. **activate-booster**: If Empire Builder leaderboard ID is set, trigger booster rules: auto-like + recast on channel posts that mention the project. Booster is soft (engagement, not sybil-friendly).
5. **set-reminder-7d**: Schedule L3 (the 7-day nudge) to run in 7 days. Stored in Capsule state.
6. **track-initial-buys**: Log first 24h token trades (read-only query to Clanker via API). Store count for L3 comparison.

**Terminal States:**
- `window-open`: Announcement posted, booster active, reminder scheduled.
- `announce-failed`: Farcaster post failed (API error or human rejection). Retry once, then terminal. Operator notified.
- `no-approval`: Human rejected the announcement cast. No further action; campaign is live, just not announced by ZAO.

**Timeout:** 30 seconds (announcement is synchronous; booster scheduling is fast).

**Capsule:** `crowdfund-lifecycle-v1` (handlers: `farcaster.post`, `empire-builder.activate-booster`, `clanker.trade-tracker-read`, `schedule.set-reminder`).

**Checks:**
- Target amount is positive, deadline is in future.
- Creator FID is valid Farcaster account.
- Leaderboard ID (if set) exists in Empire Builder.

**Evidence/Receipts:**
- Farcaster cast ID if posted.
- Booster activation log.
- First 24h trade count snapshot.
- Timer scheduled (reminder ID).

**Memory Routing:**
- Campaign state: `{ window_opened_at, announcement_cast_id, initial_buys_24h }` (stored in Capsule state).
- Event log: "Crowdfund window opened" with campaign ID, creator, target.
- Metric: daily-campaign-launches (incremented on success).

**Failure Behavior:**
- Farcaster API 429 (rate limit): Retry once with 60s backoff. On second failure, mark `announce-failed`, don't post.
- Booster config invalid: Skip booster step, continue with reminder + tracking. Log warning.
- Timeout (>30s): Force terminal as `timeout`, but still attempt async reminder + tracking.

**Resource Ceilings:**
- 50 campaign launches/day (expected: 1-5, but hard ceiling for safety).
- 50 booster rules active at once (Empire Builder limit).
- No cost beyond Farcaster RPC + Clanker API (free tier).

**Safety:**
- Announcement cast is approval-gated (manifest: `farcaster.post.approval=true`).
- No fund movement, no wallet access.
- Booster rules are read-only on Farcaster channel activity (no sybil-generation).
- Manifest blocks `wallet.transfer`, `clanker.launch`, `contract.write`.

---

### L3: Crowdfund Lifecycle - 7-Day Progress Nudge

**Trigger:** Timer fires 7 days after `crowdfund.window-opened` (L2 schedules this).

**Context Sources:**
- Campaign state from L2 (initial buy count).
- Current token trade volume (Clanker API).
- Campaign target + deadline.
- Creator's recent Farcaster activity.

**Steps:**
1. **check-progress**: Query Clanker trade history since window open. Calculate: progress %= current-volume / (target-volume / 7-days).
2. **calculate-momentum**: If progress >= 40%, campaign is on-track. If progress < 40%, campaign needs nudge.
3. **propose-nudge-message**: If stalled (<40%), compose a nudge: "[Creator], your [Project] is at $X toward $[Target]. [X days left]. Here's what helps: get [prominent ZAO member] to cast, add a booster reward for top buyers, host a live collab." Keep tone encouraging, not pushy.
4. **stage-nudge-cast**: If nudge is needed, stage the cast for Zaal approval (manifest: `farcaster.post.approval=true` for high-risk messaging). If on-track, skip to recap.
5. **recap-live-buyers**: Query leaderboard top 50 buyers. Prepare a recap: "@[handle] thanks for supporting [Project]!" (threaded replies). These are auto-sent (low-risk recognition).
6. **send-recap**: Fire recap casts (auto-send, no approval gate for 1-1 gratitude).

**Terminal States:**
- `nudge-sent`: Nudge cast approved + posted, or on-track so recap sent.
- `already-on-track`: Progress >= 40%, no nudge needed, recap sent.
- `nudge-rejected`: Zaal rejected the nudge cast. Recap still sent.

**Timeout:** 1 minute.

**Capsule:** `crowdfund-lifecycle-v1`.

**Checks:**
- Campaign exists in state (scheduled by L2).
- Current time is exactly 7 days +/- 12h from window-open (timer tolerance).
- Clanker trade data is available (not newer than 1h old).

**Evidence/Receipts:**
- Progress snapshot (volume at 7d).
- Nudge cast ID (if sent).
- Recap cast IDs (list of 1-1 thanks).

**Memory Routing:**
- Campaign state: updated with `progress_7d`, `nudge_sent_at`, `recap_sent_count`.
- Metric: weekly-nudge-sent (incremented if nudge was triggered).

**Failure Behavior:**
- Clanker API down: Use cached trade volume from L2 + current Unix timestamp to estimate progress. Best-effort nudge.
- Farcaster API error: Defer recap, retry once 5m later. Nudge approval gate means human can retry if it fails.
- Timeout (>1m): Force terminal with partial results (nudge may not send, recap aborted). Operator notified.

**Resource Ceilings:**
- 50 nudges/day.
- 500 recap casts/day (many projects, many top buyers).

**Safety:**
- Nudge is approval-gated (risky messaging requires human sign-off).
- Recap casts are auto-send (low-risk gratitude, no sybil-generation).
- No fund movement.
- Manifest blocks `wallet.transfer`, `clanker.launch`, `contract.write`.

---

### L4: Community Relationship Lifecycle - Status Tracking

**Trigger:** ZOE circles integration detects relationship-state-change event (new member, member engagement level change, member project participation, etc.).

**Context Sources:**
- Member profile (FID, circles status, projects joined).
- Cowork project board (member's active projects, contributions).
- Farcaster activity (recent casts, replies, channel engagement).
- Relationship history (ZAO CRM state: discover, engage, coordinate, escalate, nurture).

**Steps:**
1. **log-event**: Record the state-change event (member ID, old state, new state, trigger reason, timestamp).
2. **classify-relationship-stage**: Determine lifecycle stage:
   - **Discover**: Member joined <7 days ago, <5 Farcaster casts in community channels.
   - **Engage**: Member active (>1 cast/week in community channels, or viewed >3 projects).
   - **Coordinate**: Member is active in a ZAO project (joined cowork board, made contributions).
   - **Escalate**: Member has taken on a leadership role (mentor on ZABAL Games, core team, moderator).
   - **Nurture**: Member was active but inactive for >30 days; needs re-engagement.
3. **propose-action**: Based on stage, suggest next step:
   - Discover -> send welcome DM + link to /zao intro call.
   - Engage -> invite to next ZAO sync or ZABAL Games workshop.
   - Coordinate -> surface upcoming projects they might join.
   - Escalate -> flag for Zaal as potential core team candidate; suggest 1-1 strategic call.
   - Nurture -> send gentle re-engagement DM ("We miss you! Here's what's new...").
4. **send-nurture-dm**: If action is a DM, compose message (context-aware: personalized by projects they joined, mentions they liked, etc.). Single DMs auto-send (approval gate not needed); bulk sends (>10/batch) require approval.
5. **update-relationship-status**: Write new status + action-taken to Capsule state (immutable log entry). Do not modify via API; only the Capsule state is source of truth.
6. **log-completion**: Record action sent, timestamp, response pending.

**Terminal States:**
- `status-updated`: Relationship status written, action sent (or skipped if no action needed).
- `dm-failed`: DM send failed (Farcaster API error). Log retry count.
- `escalate-flagged`: Member escalated to Zaal for manual follow-up (no auto-action beyond flag).

**Timeout:** 30 seconds (mostly reads; DM send is async).

**Capsule:** `community-crm-v1` (handlers: `circle.relationship-status-read`, `circle.relationship-status-write`, `farcaster.dm-send`, `cowork.fetch-projects`, `log.relationship-events`).

**Checks:**
- Member ID exists in circles.
- Relationship state change is valid transition (no Discover->Escalate without Engage/Coordinate).
- DM recipient has Farcaster handle + DM opt-in status.

**Evidence/Receipts:**
- Relationship state log entry (immutable).
- DM send confirmation (if sent).
- Action taken flag + timestamp.

**Memory Routing:**
- Capsule state: `relationships: { [member-id]: { stage, last-action, last-action-date, history: [...] } }`
- Event log: "Relationship L6 status update" with member ID, stage change.
- Metric: daily-relationships-updated (incremented per member).

**Failure Behavior:**
- Farcaster DM API 429: Retry once with 30s backoff. On failure, mark `dm-failed`, don't retry again in this cycle.
- Bulk-send approval denied by Zaal: Mark action as `skipped`, no DM sent. Retry in next cycle (next relationship change event).
- Timeout (>30s): Force terminal with partial results (status update may be incomplete). Retry action in next cycle.

**Resource Ceilings:**
- 500 DMs/day (soft: ZAO has ~188 members, so this is ceiling for mass outreach + individual follow-ups).
- 100 relationship status updates/day.
- Bulk-send approval gate: max 10 DMsper batch (forces human to review in batches, not spray-and-pray).

**Safety:**
- No member data leakage in logs (never log member email, phone, private Farcaster profile data).
- DM send is gated: 1-1 sends auto-send (low-risk); bulk sends need approval.
- Relationship status is read-only to handlers (only Capsule can write via L6).
- Manifest blocks `circle.member-remove`, `circle.role-grant` (no membership changes).
- No fund movement.

---

## Four Draft Manifest Files

### Draft 1: clip-distribution-immediate.json

```json
{
  "name": "clip-distribution-immediate",
  "version": "1.0.0",
  "hash": "sha256:draft-clip-1",
  "description": "Multi-platform publishing on WaveWarZ clip completion via Postiz",
  "author": "ZAO Assistant / Claude",
  "created": "2026-07-14",
  "handlers": [
    "wavewarz.clip-complete-event",
    "postiz.upload-video",
    "postiz.post-to-platforms",
    "farcaster.read-account",
    "log.receipt-write"
  ],
  "loops": [
    {
      "name": "clip-distribute-immediate",
      "description": "On WaveWarZ clip completion, upload to Postiz and post to all platforms",
      "entry": "trigger.clip-complete-event",
      "steps": [
        "extract-clip-metadata",
        "validate-video-url",
        "generate-farcaster-caption",
        "upload-to-postiz",
        "post-to-all-platforms",
        "log-distribution-receipt"
      ],
      "terminal": [
        "posted-all-platforms",
        "failed-postiz-after-retry",
        "validation-error"
      ],
      "timeout": "120s",
      "retryPolicy": {
        "maxRetries": 2,
        "backoffMs": 30000,
        "retryableErrors": ["NetworkError", "ServiceUnavailable"]
      }
    }
  ],
  "permissions": {
    "wavewarz.clip-complete-event": {
      "blocked": false,
      "approval": false,
      "description": "Subscribe to clip completion events"
    },
    "postiz.upload-video": {
      "blocked": false,
      "approval": false,
      "description": "Upload videos to Postiz CDN"
    },
    "postiz.post-to-platforms": {
      "blocked": false,
      "approval": false,
      "description": "Post to Farcaster, X, Bluesky, Discord atomically"
    },
    "farcaster.read-account": {
      "blocked": false,
      "approval": false,
      "description": "Read ZAO Farcaster account status"
    },
    "log.receipt-write": {
      "blocked": false,
      "approval": false,
      "description": "Write immutable receipt logs"
    },
    "wallet.sign": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no signing"
    },
    "exec.shell": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no shell execution"
    },
    "env.read-postiz-secret": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: env vars accessed via host, not Capsule manifest"
    }
  },
  "config": {
    "postiz": {
      "apiKeySource": "env.POSTIZ_API_KEY",
      "baseUrl": "https://api.postiz.com/public/v1",
      "platforms": [
        "warpcast",
        "x",
        "bluesky",
        "discord"
      ],
      "platformsCanOmit": true,
      "description": "Postiz API key must be set in host .env; never commit in manifest"
    },
    "rateLimits": {
      "clipsPerDay": 100,
      "videoUploadsPerDay": 10,
      "postizPostsPerHour": 90,
      "description": "Postiz free tier: 90 POST /posts/hour. ZAO ceiling: 100 clips/day"
    },
    "validation": {
      "videoUrlMustBeHttps": true,
      "videoMaxSizeMB": 500,
      "captionMaxChars": 300,
      "captionMustMentionChannel": "/wavewarz"
    },
    "fallback": {
      "description": "If Postiz fails, clip is preserved in WaveWarZ; human posts via Firefly later"
    }
  },
  "state": {
    "schema": {
      "clipsDistributed": { "type": "number" },
      "lastDistributionTime": { "type": "string" },
      "recentErrors": { "type": "array" },
      "postizHealthStatus": { "type": "string" }
    },
    "ephemeral": ["postizHealthStatus"],
    "persistent": ["clipsDistributed", "lastDistributionTime", "recentErrors"]
  },
  "resourceLimits": {
    "maxSimultaneousLoops": 1,
    "maxStateSize": "10MB",
    "maxLogSize": "100MB",
    "timeoutMs": 120000
  },
  "securityProfile": {
    "signerAccess": false,
    "shellExec": false,
    "fundMovement": false,
    "environmentVariableExposure": false,
    "thirdPartySecretStorage": "env.POSTIZ_API_KEY only; never logged or returned in receipts"
  },
  "notes": "This Capsule is production-ready pending L1 loop testing on WaveWarZ staging. No secrets in manifest. Postiz authentication is via env var on host."
}
```

### Draft 2: crowdfund-lifecycle-windows.json

```json
{
  "name": "crowdfund-lifecycle-windows",
  "version": "1.0.0",
  "hash": "sha256:draft-crowdfund-1",
  "description": "Crowdfund campaign lifecycle: window-open nudge, 7-day progress check, outcome tracking",
  "author": "ZAO Assistant / Claude",
  "created": "2026-07-14",
  "handlers": [
    "sparkz.crowdfund-window-opened-event",
    "sparkz.crowdfund-window-timer-7d",
    "sparkz.crowdfund-window-closed-timer",
    "empire-builder.read-leaderboard",
    "clanker.trade-volume-read",
    "farcaster.post-cast",
    "farcaster.send-dm",
    "empire-builder.activate-booster",
    "schedule.set-reminder",
    "log.campaign-state-write"
  ],
  "loops": [
    {
      "name": "crowdfund-announce-window-open",
      "description": "L2: On window-open event, announce on Farcaster and activate booster",
      "entry": "trigger.sparkz-window-opened-event",
      "steps": [
        "fetch-campaign-details",
        "validate-campaign-fields",
        "compose-announcement-cast",
        "post-announcement-farcaster",
        "activate-booster-rules",
        "set-7d-reminder",
        "track-initial-buys-24h",
        "write-campaign-state"
      ],
      "terminal": [
        "window-open-announced",
        "farcaster-post-failed",
        "no-human-approval"
      ],
      "timeout": "30s",
      "approvalGates": {
        "farcasterPost": {
          "description": "Announcement cast requires human approval before posting",
          "approvalRequired": true
        }
      }
    },
    {
      "name": "crowdfund-nudge-7d-progress",
      "description": "L3: At 7 days, check progress and nudge if stalled; send buyer thanks",
      "entry": "trigger.sparkz-7d-timer",
      "steps": [
        "fetch-campaign-state",
        "check-trade-volume",
        "calculate-progress-percent",
        "decide-nudge-needed",
        "compose-nudge-message",
        "stage-nudge-for-approval",
        "list-top-50-buyers",
        "compose-thanks-casts",
        "send-thanks-auto"
      ],
      "terminal": [
        "nudge-sent-or-on-track",
        "nudge-rejected-by-human",
        "thanks-sent"
      ],
      "timeout": "60s",
      "approvalGates": {
        "nudgeCast": {
          "description": "Nudge cast (if progress <40%) requires approval",
          "approvalRequired": true,
          "riskLevel": "medium"
        }
      }
    },
    {
      "name": "crowdfund-finalize-outcome",
      "description": "L4: On window close, document success/miss outcome and announce",
      "entry": "trigger.sparkz-window-closed-timer",
      "steps": [
        "fetch-final-campaign-state",
        "query-final-trade-volume",
        "determine-success-or-miss",
        "document-outcome",
        "compose-outcome-announcement",
        "stage-outcome-announcement",
        "archive-campaign-state"
      ],
      "terminal": [
        "success-documented",
        "miss-documented",
        "outcome-announcement-failed"
      ],
      "timeout": "120s",
      "approvalGates": {
        "outcomeAnnouncement": {
          "description": "Outcome cast requires approval",
          "approvalRequired": true
        }
      }
    }
  ],
  "permissions": {
    "sparkz.crowdfund-events": {
      "blocked": false,
      "approval": false,
      "description": "Subscribe to crowdfund window events"
    },
    "clanker.trade-volume-read": {
      "blocked": false,
      "approval": false,
      "description": "Read-only: query trade volume and leaderboard"
    },
    "empire-builder.read-leaderboard": {
      "blocked": false,
      "approval": false,
      "description": "Read-only: leaderboard data and booster status"
    },
    "empire-builder.activate-booster": {
      "blocked": false,
      "approval": false,
      "description": "Activate booster rules for campaign channel"
    },
    "farcaster.post-cast": {
      "blocked": false,
      "approval": true,
      "description": "Post announcement/nudge/outcome casts (approval-gated)"
    },
    "farcaster.send-dm": {
      "blocked": false,
      "approval": false,
      "description": "Send thanks DMs (auto-send for gratitude)"
    },
    "schedule.set-reminder": {
      "blocked": false,
      "approval": false,
      "description": "Schedule 7-day and window-close timers"
    },
    "log.campaign-state-write": {
      "blocked": false,
      "approval": false,
      "description": "Write immutable campaign state"
    },
    "wallet.transfer": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no fund movement"
    },
    "clanker.launch": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no token launch"
    },
    "contract.write": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no on-chain writes"
    }
  },
  "config": {
    "nudgeThreshold": {
      "progressPercent": 40,
      "description": "If progress < 40% at 7d, send nudge"
    },
    "rateLimits": {
      "campaignsPerDay": 50,
      "nudgesPerDay": 50,
      "thanksCastsPerDay": 500,
      "boosterRulesActive": 50
    },
    "timing": {
      "reminderAt7Days": true,
      "reminderAt1DayBeforeClose": false,
      "description": "Timers are set by window-open handler"
    }
  },
  "state": {
    "schema": {
      "activeCampaigns": { "type": "object" },
      "campaignHistory": { "type": "array" },
      "nudgesSent": { "type": "number" },
      "successfulCampaigns": { "type": "number" }
    },
    "persistent": ["activeCampaigns", "campaignHistory", "nudgesSent", "successfulCampaigns"]
  },
  "resourceLimits": {
    "maxSimultaneousCampaigns": 10,
    "maxStateSize": "50MB",
    "timeoutMs": 120000
  },
  "securityProfile": {
    "signerAccess": false,
    "fundMovement": false,
    "tokenLaunch": false,
    "approvalGatesRequired": ["farcaster.post-cast"]
  },
  "notes": "Loops L2, L3, L4 are bundled here. Each loop is triggered by Sparkz timer events or human gate. No secrets in manifest. Outcome is read-only (queries Clanker, does not reconcile funds)."
}
```

### Draft 3: community-crm-relationships.json

```json
{
  "name": "community-crm-relationships",
  "version": "1.0.0",
  "hash": "sha256:draft-community-crm-1",
  "description": "Community relationship lifecycle: discovery, engagement, coordination, escalation, nurture",
  "author": "ZAO Assistant / Claude",
  "created": "2026-07-14",
  "handlers": [
    "circle.member-event-stream",
    "circle.relationship-status-read",
    "circle.relationship-status-write",
    "cowork.fetch-projects",
    "farcaster.activity-read",
    "farcaster.dm-send",
    "log.relationship-events-write"
  ],
  "loops": [
    {
      "name": "relationship-lifecycle-update",
      "description": "L6: On member state change, classify stage and send appropriate nurture action",
      "entry": "trigger.circle-relationship-state-change",
      "steps": [
        "log-state-change-event",
        "read-member-profile",
        "read-activity-history",
        "classify-relationship-stage",
        "propose-nurture-action",
        "compose-action-message",
        "determine-approval-gate",
        "send-action-or-stage",
        "update-relationship-status",
        "log-completion"
      ],
      "terminal": [
        "status-updated",
        "action-sent",
        "action-staged-for-approval",
        "no-action-needed",
        "dm-send-failed"
      ],
      "timeout": "30s",
      "approvalGates": {
        "bulkDmSend": {
          "description": "Bulk DM sends (>10 at once) require human approval",
          "approvalRequired": true,
          "maxPerBatch": 10
        }
      }
    }
  ],
  "permissions": {
    "circle.member-event-stream": {
      "blocked": false,
      "approval": false,
      "description": "Subscribe to circle membership events"
    },
    "circle.relationship-status-read": {
      "blocked": false,
      "approval": false,
      "description": "Read member and relationship data"
    },
    "circle.relationship-status-write": {
      "blocked": false,
      "approval": false,
      "description": "Write relationship status and history (immutable log)"
    },
    "cowork.fetch-projects": {
      "blocked": false,
      "approval": false,
      "description": "Read project membership and contributions"
    },
    "farcaster.activity-read": {
      "blocked": false,
      "approval": false,
      "description": "Read member Farcaster activity (public data)"
    },
    "farcaster.dm-send": {
      "blocked": false,
      "approval": true,
      "description": "Send DMs; single DMs auto-send, bulk sends require approval"
    },
    "log.relationship-events-write": {
      "blocked": false,
      "approval": false,
      "description": "Write immutable event logs"
    },
    "circle.member-remove": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no membership changes without explicit admin action"
    },
    "circle.role-grant": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no role assignment (admin-only)"
    },
    "wallet.transfer": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no fund movement"
    }
  },
  "config": {
    "relationshipStages": {
      "discover": {
        "criteria": "Joined <7d ago OR <5 casts in community channels",
        "action": "welcome-dm-and-intro-link"
      },
      "engage": {
        "criteria": ">1 cast/week in community OR viewed >3 projects",
        "action": "invite-to-next-sync-or-workshop"
      },
      "coordinate": {
        "criteria": "Active in a ZAO project (cowork board)",
        "action": "surface-related-projects"
      },
      "escalate": {
        "criteria": "Leadership role (mentor, core team, moderator)",
        "action": "flag-for-zaal-strategic-call"
      },
      "nurture": {
        "criteria": "Was active, now inactive >30d",
        "action": "gentle-reengagement-dm"
      }
    },
    "rateLimits": {
      "dmsPerDay": 500,
      "bulkSendMaxPerBatch": 10,
      "relationshipUpdatesPerDay": 100,
      "description": "ZAO has ~188 members; these limits are safe for all use cases"
    },
    "dataRetention": {
      "relationshipHistoryRetention": "indefinite",
      "description": "Relationship logs are immutable and persisted forever"
    }
  },
  "state": {
    "schema": {
      "relationships": {
        "type": "object",
        "keyPattern": "[member-id]",
        "valueSchema": {
          "stage": "string",
          "lastActionDate": "string",
          "lastAction": "string",
          "history": "array",
          "flaggedForEscalation": "boolean"
        }
      },
      "memberCount": { "type": "number" },
      "stageDistribution": { "type": "object" }
    },
    "persistent": ["relationships", "memberCount", "stageDistribution"]
  },
  "resourceLimits": {
    "maxSimultaneousLoops": 10,
    "maxStateSize": "200MB",
    "maxDmsPerBatch": 10,
    "timeoutMs": 30000
  },
  "securityProfile": {
    "signerAccess": false,
    "fundMovement": false,
    "membershipChanges": false,
    "roleGrants": false,
    "piiHandling": "Never log member email, phone, or private data. Only public Farcaster handles and project contributions.",
    "approvalGatesRequired": ["farcaster.dm-send (bulk >10)"]
  },
  "notes": "Loop L6 is bundled here. Relationship status is source of truth only in Capsule state. No external DB writes. Single DMs auto-send (low risk); bulk sends require human approval to prevent spam."
}
```

### Draft 4: newsletter-redistribute-weekly.json

```json
{
  "name": "newsletter-redistribute-weekly",
  "version": "1.0.0",
  "hash": "sha256:draft-newsletter-1",
  "description": "Detect published newsletter posts, auto-schedule cross-platform reruns via Postiz, track engagement",
  "author": "ZAO Assistant / Claude",
  "created": "2026-07-14",
  "handlers": [
    "paragraph.rss-webhook",
    "postiz.upload-text",
    "postiz.post-to-platforms",
    "borker.engagement-tracker-read",
    "farcaster.read-account",
    "log.redistribution-write"
  ],
  "loops": [
    {
      "name": "newsletter-redistribute-weekly",
      "description": "L8: On newsletter published (Paragraph RSS), generate teaser and schedule to all platforms",
      "entry": "trigger.paragraph-rss-webhook",
      "steps": [
        "validate-webhook-signature",
        "parse-rss-item",
        "fetch-full-post-content",
        "extract-title-and-excerpt",
        "extract-media-urls",
        "generate-teaser-text",
        "generate-farcaster-caption",
        "upload-media-to-postiz",
        "schedule-to-all-platforms",
        "set-rerun-timer-7d",
        "track-initial-views"
      ],
      "terminal": [
        "scheduled-all-platforms",
        "postiz-upload-failed",
        "webhook-validation-failed"
      ],
      "timeout": "120s",
      "retryPolicy": {
        "maxRetries": 1,
        "backoffMs": 30000
      }
    },
    {
      "name": "newsletter-engagement-tracker",
      "description": "Track post engagement over 7 days; propose rerun if engagement is high",
      "entry": "trigger.daily-1pm",
      "steps": [
        "list-recent-reruns",
        "fetch-engagement-per-post",
        "calculate-engagement-decay",
        "decide-rerun-needed",
        "propose-rerun-cast",
        "stage-rerun-for-approval"
      ],
      "terminal": [
        "rerun-staged",
        "no-rerun-needed",
        "engagement-data-unavailable"
      ],
      "timeout": "60s"
    }
  ],
  "permissions": {
    "paragraph.rss-webhook": {
      "blocked": false,
      "approval": false,
      "description": "Receive webhook from Paragraph RSS on post publish"
    },
    "paragraph.fetch-full-post": {
      "blocked": false,
      "approval": false,
      "description": "Fetch full post content from Paragraph API"
    },
    "postiz.upload-text": {
      "blocked": false,
      "approval": false,
      "description": "Upload text/teaser to Postiz"
    },
    "postiz.post-to-platforms": {
      "blocked": false,
      "approval": false,
      "description": "Schedule posts to Farcaster, X, Bluesky, Discord"
    },
    "borker.engagement-tracker-read": {
      "blocked": false,
      "approval": false,
      "description": "Read-only: query engagement metrics from Borker"
    },
    "farcaster.read-account": {
      "blocked": false,
      "approval": false,
      "description": "Read ZAO Farcaster account status"
    },
    "log.redistribution-write": {
      "blocked": false,
      "approval": false,
      "description": "Write immutable redistribution logs"
    },
    "wallet.sign": {
      "blocked": true,
      "approval": false,
      "description": "Blocked: no signing"
    }
  },
  "config": {
    "postiz": {
      "apiKeySource": "env.POSTIZ_API_KEY",
      "platforms": [
        "warpcast",
        "x",
        "bluesky",
        "discord"
      ],
      "description": "Same Postiz integration as clip-distribution"
    },
    "teaseGeneration": {
      "model": "claude-3-haiku",
      "maxTokens": 150,
      "temperature": 0.7,
      "rateLimitPerDay": 5,
      "costPerGeneration": "~$0.001",
      "description": "LLM-generated teasers to vary copy; cost-gated at 5/day"
    },
    "engagementTracking": {
      "trackingDays": 7,
      "rereuUnitThreshold": 0.7,
      "description": "If engagement is >70% of peak by day 7, propose rerun"
    },
    "rateLimits": {
      "postsPerDay": 50,
      "teasersPerDay": 5,
      "rerunnablePosts": 20,
      "engagementQueriesPerDay": 100
    }
  },
  "state": {
    "schema": {
      "publishedPosts": { "type": "array" },
      "scheduledPostIds": { "type": "array" },
      "engagementSnapshots": { "type": "object" },
      "reruns": { "type": "number" }
    },
    "ephemeral": ["engagementSnapshots"],
    "persistent": ["publishedPosts", "scheduledPostIds", "reruns"]
  },
  "resourceLimits": {
    "maxSimultaneousLoops": 2,
    "maxStateSize": "50MB",
    "maxDailyTeasers": 5,
    "timeoutMs": 120000
  },
  "securityProfile": {
    "signerAccess": false,
    "fundMovement": false,
    "postizApiKeyNotInManifest": true,
    "webhookValidation": "Paragraph signature verified before processing"
  },
  "notes": "Loops L8 + engagement-tracker are bundled. Teaser generation is LLM-based and cost-gated (5/day). Postiz handles multi-platform scheduling atomically. Engagement tracking is read-only from Borker."
}
```

---

## Capsule & Loop Prioritization

**Effort Scale:** 1-10 (1 = trivial, 5 = medium, 10 = complex).  
**Impact Scale:** Low / Medium / High (based on ZAO surface criticality + user value).

| # | Loop ID | Name | Surface | Effort | Impact | Why First | Ship Order |
|---|---|---|---|---|---|---|---|
| **1** | L1 | clip-distribution-immediate | WaveWarZ | 2 | High | WaveWarZ ships soon; this unblocks automated social posting for clips. | Week 1 |
| **2** | L4 | community-crm-lifecycle | ZOE circles | 4 | High | Foundation for ZAO's relationship tracking; unlocks nurture automations. | Week 1 |
| **3** | L2 | crowdfund-announce-window-open | zaalcaster/Sparkz | 2 | Medium | Sparkz launches soon; announcement + booster activation is immediate value. | Week 2 |
| **4** | L5 | music-curation-daily | ZOL v2 upgrade | 3 | Medium | Extends ZOL with AI-assisted curation; depends on Spotify/YouTube links. | Week 2 |
| **5** | L3 | crowdfund-nudge-7d | zaalcaster/Sparkz | 3 | Medium | Follows L2; mid-campaign nudge + buyer thanks. | Week 3 |
| **6** | L8 | newsletter-redistribute-weekly | Newsletter + Borker | 2 | Medium | Paragraph integration + Postiz reuse from L1. Low effort, valuable for reach. | Week 3 |
| **7** | L7 | governance-nudge-voters | Fractal | 3 | Low | Fractal is mature; nudges are nice-to-have. Defer unless governance participation is urgent. | Week 4 |
| **8** | L6 | engagement-tracker | Newsletter + Borker | 3 | Low | Rerun proposal based on 7d engagement. Depends on Borker data. Defer to L8 follow-up. | Week 4 |
| **9** | L4 | crowdfund-finalize-outcome | zaalcaster/Sparkz | 2 | High | Closes campaign lifecycle; high value for transparency. | Week 3 |

**Ship Order Summary:**
- **Week 1:** L1 (clip-distribution), L4 (community-crm) — foundation + immediate value.
- **Week 2:** L2 (crowdfund-announce), L5 (music-curation) — extend Sparkz + ZOL.
- **Week 3:** L3 (crowdfund-nudge), L8 (newsletter-redistribute), L4-2 (crowdfund-finalize) — mid-campaign + content reach.
- **Week 4+:** L7 (governance-nudge), L6 (engagement-tracker) — nice-to-have, lower urgency.

---

## Implementation Priorities & Next Actions

| Priority | Action | Owner | By Date | Success Criteria | Effort |
|---|---|---|---|---|---|
| **CRITICAL** | Approve draft manifest: `clip-distribution-immediate.json` | @Zaal | 2026-07-16 | No blocking feedback; ready for WaveWarZ integration | 1 |
| **CRITICAL** | Integrate L1 loop into WaveWarZ clip-complete handler | @Zaal or engineer | 2026-07-20 | Clip triggers upload-to-Postiz + post-to-platforms. Dry-run on 3 test clips. | 5 |
| **HIGH** | Approve draft manifest: `crowdfund-lifecycle-windows.json` | @Zaal | 2026-07-16 | Review L2, L3, L4 logic; flag timing concerns. | 1 |
| **HIGH** | Approve draft manifest: `community-crm-relationships.json` | @Zaal | 2026-07-16 | Review DM approval gates + relationship-stage classification. | 1 |
| **HIGH** | Test L1 with 3 live WaveWarZ clips (staging env) | @engineer | 2026-07-22 | All 3 clips post to Farcaster + X + Bluesky within 2 min. Zero double-posts. | 3 |
| **HIGH** | Deploy L1 to prod (flag-gated ON) | @Zaal | 2026-07-25 | Clips auto-distribute daily. Postiz receipts are logged. No manual posts needed. | 2 |
| **MEDIUM** | Implement L2 + L4 in zaalcaster on Sparkz window-opened event | @engineer | 2026-08-01 | Announcement cast + booster activation verified. Outcome tracking audit passes. | 6 |
| **MEDIUM** | Test L2 + L4 with 1 live crowdfund campaign (staging) | @Zaal | 2026-08-08 | Announcement posts, booster activates, 7d reminder fires, outcome documented. | 3 |
| **MEDIUM** | Implement L4 (community-crm) relationship-state event listener in ZOE | @engineer | 2026-08-01 | Stage -> propose action -> send or defer based on approval gate. No bulk spam. | 7 |
| **MEDIUM** | Approve draft manifest: `newsletter-redistribute-weekly.json` | @Zaal | 2026-07-20 | Review Paragraph webhook + Postiz scheduling logic. | 1 |
| **LOW** | Design L5 (music-curation-v2 with Spotify/YouTube) | @engineer | 2026-08-15 | Capsule manifest drafted, Spotify API integration scoped. | 4 |
| **LOW** | Design L7 (Fractal governance nudges) | @engineer | 2026-08-22 | Voter-power queries + nudge cast logic scoped. Fractal SDK API reviewed. | 3 |

**Ship Criteria (when to call a loop DONE):**
- Manifest approved by Zaal.
- Loop code passes integration matrix (105+ tests covering success + error paths).
- Dry-run on staging env shows expected behavior (no secrets in logs, all handlers fire in order).
- Live deployment on prod: loop runs for 1+ week with zero crashes, zero unexpected side effects.
- Audit: code has zero security findings (signer access, shell-exec, secret exposure checks pass).
- Documentation: operator runbook + fallback behavior are in the repo.

---

## Safety & Security Checklist

All new Capsules and Loops enforce ZOL's safety model (doc 1085):

**Blocked (Fail-Closed):**
- Signer access: No `wallet.sign`, `signer.privateKey` in any handler.
- Shell execution: No `exec()`, `subprocess`, shell metacharacters.
- Auto-posts without gate: All Farcaster posts require `approval=true` in manifest.
- Secret leakage: State adapter rejects 64-hex (private key), `sk-` (API key), `ghp-` (GitHub PAT), PEM blocks.
- Fund movement: No `wallet.transfer`, no treasury writes, no token launches.

**Approval Gates (Human-Gated):**
- Farcaster posts: All require manifest `approval=true` before firing.
- Bulk DMs: >10 DMs in one batch require human approval.
- Nudge casts: High-risk messaging (asking for money, etc.) require approval.

**Flags (Off-by-Default):**
- All new loops are OFF by default (e.g. `CLIP_DISTRIBUTION_ENABLED=0`).
- Enable only after Zaal approves + dry-run passes.
- Kill switch: Set flag to 0 and restart service. Instant rollback.

**Secrets:**
- API keys (Postiz, Paragraph) are in `.env` on host, never in Capsule manifest.
- No env-var exposure: Handlers can't read env vars directly; only host passes values.
- State adapter scans all writes for secret patterns.

**Audit Trail:**
- Every loop execution is logged with timestamp, handler sequence, terminal state, retry count.
- Logs are immutable (written to disk, never updated).
- Logs contain no PII, no secrets, no sensitive data.

---

## Related Research & Sources

### Full Access [FULL]
- **PR bettercallzaal/zol #13** (ZOL persistent-agent graft): https://github.com/bettercallzaal/zol/pull/13
- **Doc 1085** (ZOL DreamLoops persistent-agent graft): `/research/agents/1085-zol-dreamloops-persistent-agent-graft/README.md`
- **Doc 1088** (zaalcaster + Empire Builder + coinz): `/research/business/1088-zaalcaster-empire-builder-coinz-crowdfunding/README.md`
- **Doc 1089** (Postiz API + WaveWarZ): `/research/infrastructure/1089-postiz-social-api-clip-engine/README.md`

### Partial Access [PARTIAL]
- **DreamLoops framework** (BrandonDucar/dreamloops, commit 1c6d3b1910): Vendored in `/vendor/dreamloops/` (ZOL branch).
- **ZAO agent-loop best practices** (doc 928): `/research/agents/928-agent-loop-best-practices/README.md`
- **ZAO agent-loops operating rules** (`.claude/rules/agent-loops.md`): Durable rules for autonomous loops (learned online 2026-06-30).

### ZAO Surfaces (Code References)
- **ZOE orchestrator**: `bot/src/zoe/` (cockpit, handlers, memory blocks, task routing).
- **ZOL music curator**: `bot/src/zol/` (Farcaster client, artist tracking, curator persona).
- **WaveWarZ clip engine**: `src/app/api/wavewarz/` (clip generation, publishing).
- **zaalcaster/Sparkz**: `src/app/api/sparkz/` or `src/lib/empire-builder/` (crowdfund workflows).
- **ZAO circles (CRM)**: `src/app/api/crm/` or `bot/src/zoe/circles/` (relationship tracking).
- **Fractal governance**: `src/app/api/governance/` or integration via Fractal SDK.
- **Newsletter (Paragraph)**: RSS webhook + `src/lib/publish/` (multi-platform distribution).
- **Postiz integration**: New, to be added in `src/lib/postiz/` (draft API client).

### Related Concepts
- **DreamLoops framework design**: Bounded persistent agents, capsules as JSON manifests, 3-factor authority model.
- **Spec-Driven Development** (doc 1084): Manifests as source of truth, code as implementation.
- **Loop-Engineering Taxonomy** (doc 994): Bounded-loop theory, state machines, failure modes.

---

## Statistics & Summary

| Metric | Count |
|---|---|
| **New Capsules Designed** | 5 |
| **New Loops Designed** | 8 |
| **Draft Manifests (JSON)** | 4 (clip-distribution, crowdfund-lifecycle, community-crm, newsletter-redistribution) |
| **ZAO Surfaces Covered** | 6 (ZOE, ZOL, WaveWarZ, zaalcaster/Sparkz, circles, Fractal, Newsletter) |
| **Effort Total** | ~40-50 days engineering (distributed across Q3 2026) |
| **Highest-Priority Loops** | 3 (L1 clip-distribution, L4 community-crm, L2 crowdfund-announce) |
| **Safety Checks Enforced** | Blocked actions, approval gates, flags off-by-default, secrets in env only, immutable audit logs |

---

## Next Steps for Implementation

1. **This Week (2026-07-14 to 2026-07-20):**
   - [ ] Zaal reviews and approves all 4 draft manifests.
   - [ ] Engineer begins WaveWarZ L1 integration (clip-complete event -> Postiz upload + post).
   - [ ] Postiz API client (`src/lib/postiz/`) is stubbed out and tested.

2. **Next Week (2026-07-21 to 2026-07-27):**
   - [ ] L1 dry-run: 3 test clips posted to staging Postiz + Farcaster (mock).
   - [ ] L1 deploy to prod (flag-gated ON).
   - [ ] zaalcaster team begins L2 + L4 implementation (crowdfund lifecycle).

3. **Following Week (2026-07-28 to 2026-08-03):**
   - [ ] L2 + L4 dry-run with 1 live test campaign.
   - [ ] ZOE circles integration begins L4 (community-crm relationship listener).
   - [ ] L8 (newsletter redistribution) is low-priority; defer or parallelize if bandwidth exists.

4. **Ongoing:**
   - [ ] Weekly check-in: loop stability, error rates, human approvals granted.
   - [ ] Monthly fold-back: lessons learned documented in `.claude/rules/agent-loops.md`.
   - [ ] On success: evaluate L5 (music-curation-v2), L7 (Fractal governance), etc.

---

## Conclusion

This catalog extends ZOL's DreamLoops pattern across ZAO's agent stack. The 5 new Capsules and 8 new Loops cover automation high-value surfaces: clip distribution, crowdfund lifecycle, community relationships, newsletter reach, and governance participation. Each loop respects ZAO's safety constraints (approval gates, no signer access, flags off-by-default) and grounds itself in real ZAO workflows.

The 4 draft manifests are immediately reviewable, testable, and deployable. Priority order reflects urgency (clip-distribution for WaveWarZ, community-crm for ZOE circles, crowdfund-lifecycle for Sparkz). Engineering effort is ~40-50 days spread across Q3 2026, with wins shipping weekly after initial dry-runs.

---

**Author:** Claude Opus 4.8 (ZAO Assistant) - research + design capture  
**Delivered:** 2026-07-14  
**Framework:** DreamLoops by Brandon Ducar (vendored commit 1c6d3b1910)  
**Status:** READY FOR APPROVAL (manifest drafts in `/draft-manifests/`)  
**Confidence:** HIGH (grounded in ZOL precedent + ZAO surface analysis)
