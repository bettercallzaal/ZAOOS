# 94 — Content Moderation, Onboarding UX & Community Analytics

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Design content moderation pipeline, improve onboarding UX, and add community analytics for ZAO OS's 100-member gated Farcaster music community

---

## Key Decisions / Recommendations

| Gap | Recommendation | Effort | Cost |
|-----|---------------|--------|------|
| **Content moderation** | OpenAI Moderation API (free, multimodal) + PurgoMalum (free profanity filter) + report button + mod queue. **Do NOT use Perspective API** (sunsetting Dec 2026) | ~1 day CC | $0 |
| **Onboarding UX** | OnboardJS for persistent checklist + Driver.js for tooltip tours + Respect rewards per step. Keep existing TutorialPanel | ~1 day CC | $0 |
| **Analytics** | PostHog free tier (1M events/mo) + Supabase-native admin dashboard for community metrics | ~3 hours CC | $0 |

---

## 1. Content Moderation Pipeline

### 4-Layer Architecture

**Layer 1: Pre-publish text screening** (every outbound cast)

| Tool | Purpose | Cost | Integration |
|------|---------|------|-------------|
| **PurgoMalum** | Fast profanity filter (no auth, no key) | Free, 100 req/hr/IP | GET `https://www.purgomalum.com/service/containsprofanity?text=...` |
| **OpenAI Moderation API** | 11-category scoring (hate, harassment, sexual, violence, self-harm) | Free for all OpenAI API users | POST `https://api.openai.com/v1/moderations` |

Flow in `/api/chat/send/route.ts`:
1. PurgoMalum check (instant) → if profanity, reject with message
2. OpenAI `omni-moderation-latest` → if any category flagged, auto-hide + notify admin
3. If borderline (scores > 0.5 but not flagged), allow but add to review queue

**WARNING:** Doc 92 recommends Perspective API — **do NOT use it.** Google is sunsetting Perspective API December 31, 2026. Use OpenAI's moderation instead (free, multimodal, better accuracy).

**Layer 2: Image moderation**
- OpenAI `omni-moderation-latest` accepts images alongside text in the same API call
- Pass base64 or URL — detects sexual, violence, self-harm imagery
- No additional tool needed for 100-member community

**Layer 3: Farcaster-native moderation**
- Neynar Ban API: `POST /v2/farcaster/ban` — bans user from your app's view
- Neynar user score: filter users with `score < 0.3` as potential spam
- Channel moderation: "Main" vs "Recent" feed curation

**Layer 4: Human-in-the-loop reports**

New `reports` table:
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL,
  reporter_fid INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL, -- 'spam', 'harassment', 'off-topic', 'other'
  status TEXT DEFAULT 'pending', -- 'pending', 'dismissed', 'actioned'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Rules:
- 3 unique reports on same cast = auto-hide pending review
- Respect-weighted: members with 50+ Respect get double-weight flags
- Mod queue in Admin Panel (extend existing `HiddenMessages` component)

### Moderating AI-Generated Content (ElizaOS Agent)
1. All agent casts go through same OpenAI moderation pipeline before publishing
2. Cap agent at 5 casts/hour (counter in Supabase)
3. Bot badge in UI to distinguish AI from human casts
4. Admin kill switch to pause all agent posting

---

## 2. Onboarding UX

### Current State
- `/onboard` page: wallet-check form
- `TutorialPanel`: 7-step modal walkthrough (not tracked)
- No progress persistence, no gamification, no completion metrics

### Recommended Stack

| Tool | Purpose | Size | URL |
|------|---------|------|-----|
| **OnboardJS** | Persistent checklist with Supabase integration | ~5KB | [onboardjs.com](https://onboardjs.com/) |
| **Driver.js** | Tooltip tours attached to real UI elements | ~5KB | [driverjs.com](https://driverjs.com) |

**Do NOT use:** react-joyride (broken on React 19), Shepherd.js (commercial license), intro.js (paid).

### Progressive Disclosure Flow

| Step | User Action | Web3 Under the Hood |
|------|------------|---------------------|
| 1. Connect | Sign in with wallet or Farcaster | Allowlist check |
| 2. Profile | Set name + avatar + bio | Write to `members` table |
| 3. Explore | Browse channels, listen to music | No signing needed |
| 4. First reaction | Like someone's cast | Farcaster signer approval (one-time) |
| 5. First cast | Post introduction in #zao | Signer already approved |
| 6. First DM | Send a private message | XMTP key generation |
| 7. First music share | Submit a song | Uses existing `song_submissions` |

Key: let users consume content BEFORE requiring any signing or key generation.

### Gamification with Respect

| Step | Respect Reward |
|------|---------------|
| Complete profile | +2 Respect |
| First cast in #zao | +2 Respect |
| First reaction to music | +1 Respect |
| First DM sent | +1 Respect |
| Invite a friend who joins | +5 Respect |
| 7-day activity streak | +3 Respect |

Display as progress bar: "5/7 steps — 4 Respect earned"

Store in `onboarding_progress` table:
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fid, step_id)
);
```

### Metrics to Track

| Metric | Target |
|--------|--------|
| Time to first cast | < 24 hours |
| Onboarding completion rate | > 70% |
| D7 retention | > 60% |
| D30 retention | > 40% |
| Signer connection rate | > 80% |

---

## 3. Community Analytics

### Two-Layer Approach

**Layer 1: PostHog (product analytics)**

| Feature | Free Tier |
|---------|-----------|
| Analytics events | 1M/month (ZAO uses <50K) |
| Session replays | 5K/month |
| Feature flags | 1M requests/month |
| Data retention | 1 year |

Install: `npm i posthog-js posthog-node` + create `PostHogProvider` wrapper.

Track custom events:
```typescript
posthog.capture('music_play', { song_id, artist, source });
posthog.capture('governance_vote', { proposal_id, vote });
posthog.capture('message_send', { channel });
posthog.capture('onboarding_step', { step, method });
```

**Layer 2: Supabase-native admin dashboard**

Build from existing tables — no new tools needed:

| Metric | Query Source |
|--------|-------------|
| Active members (7d) | `channel_casts` table |
| Message volume | `channel_casts` aggregate |
| Governance participation | `proposal_votes` / total members |
| Top contributors | `channel_casts` GROUP BY author |
| Music submissions | `song_submissions` count |
| Onboarding funnel | `onboarding_progress` table |
| Respect distribution | `respect_balances` table |

Add "Analytics" tab to Admin Panel with charts using `@tanstack/react-query` to fetch from new `/api/admin/analytics` route.

**Skip:** Plausible (no free tier), Matomo (PHP stack), Google Analytics (privacy concerns, ad blockers).

---

## Implementation Priority (All 3 Gaps)

| Priority | What | Effort | Impact |
|----------|------|--------|--------|
| **P0** | OpenAI moderation in `/api/chat/send` | 2-3 hours | Content safety for all casts |
| **P0** | PostHog integration (client + server) | 30 min | Immediate visibility into usage |
| **P1** | Report button + mod queue UI | 1 day | Community self-moderation |
| **P1** | Onboarding checklist (OnboardJS + Supabase) | 1 day | Better new member activation |
| **P1** | Supabase admin analytics tab | 3 hours | Community health dashboard |
| **P2** | Gamification (Respect for onboarding steps) | 3 hours | Retention boost |
| **P2** | Driver.js tooltip tour | 4 hours | Better first-time UX |
| **P2** | Image moderation (OpenAI multimodal) | 2 hours | Prevents inappropriate uploads |
| **P3** | Agent content gate (pre-publish for ElizaOS) | 3 hours | Safe AI-generated casts |
| **P3** | Advanced metrics (D7/D30 retention, funnels) | 4 hours | Growth insights |

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| **32** — Onboarding/Growth/Moderation | Original research. This doc adds specific tools, pricing, React 19 compatibility |
| **90** — AI-Run Community Agent OS | Agent moderation gate needed for ElizaOS casts |
| **92** — Public APIs Update | Recommended Perspective API — **OUTDATED**, use OpenAI Moderation instead (Perspective sunsetting Dec 2026) |
| **66** — Backend Testing Strategy | Test strategy for API routes. Doc 93 updates with table-driven approach |

---

## Sources

- [OpenAI Moderation API](https://platform.openai.com/docs/models/omni-moderation-latest) — free, multimodal
- [PurgoMalum](https://www.purgomalum.com/) — free profanity filter, no auth
- [Perspective API Sunset Notice](https://medium.com/tisanelabs/goodbye-perspective-api-79da0f237b3f) — Dec 31, 2026
- [Neynar Moderation](https://docs.neynar.com/docs/mutes-blocks-and-bans) — ban, mute, block
- [OnboardJS](https://onboardjs.com/) — headless onboarding with Supabase
- [Driver.js](https://driverjs.com) — lightweight tooltip tours, React 19 compatible
- [PostHog Pricing](https://posthog.com/pricing) — 1M events/mo free
- [PostHog Next.js Guide](https://posthog.com/docs/libraries/next-js)
- [Farcaster Channel Moderation](https://paragraph.com/@clauswilke/farcaster-channel-moderation)
