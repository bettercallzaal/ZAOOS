# 280 — FISHBOWLZ: MVP to SaaS-Ready Roadmap

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Define the path from working MVP to polished, demo-ready product for investors/partners

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Phase 1 priority** | UI polish + rate limiting — these are the "first impression" blockers |
| **Real-time approach** | SKIP WebSocket for now — 3s polling is fast enough for <100 users. Revisit at 500+ concurrent |
| **Moderation** | USE host-only kick/mute first — full mod tools are overkill for 188 members |
| **Onboarding** | ADD empty-state illustrations + "How it works" modal — users won't know what a fishbowl is |
| **Monetization hook** | SKIP for V1 — focus on engagement metrics first, monetize after product-market fit |
| **Farcaster Mini App** | ADD frame metadata to room casts — in-feed joining is the growth hack |
| **Token launch** | DEFER $FISHBOWLZ token until 50+ weekly active rooms — premature token = dead token |

## Current State Audit (What's Built)

| Area | Files | Lines | Status |
|------|-------|-------|--------|
| Pages | 2 (list + detail) | 918 | Complete |
| API Routes | 7 endpoints | 988 | Complete |
| Components | 5 | 571 | Complete |
| Utilities | 2 (logger + cast) | 251 | Complete |
| Database | 5 tables + 3 migrations | 153 | Complete |
| HMS Audio | Token + room mgmt | 125 | Complete |
| **Total** | **21 files** | **3,006** | **MVP functional** |

## Comparison: FISHBOWLZ vs Competitors

| Feature | FISHBOWLZ | Clubhouse | X Spaces | Discord Stage | Huddle01 |
|---------|-----------|-----------|----------|---------------|----------|
| Persistent rooms | YES | NO | NO | YES | NO |
| Async transcripts | YES | NO | NO | NO | NO |
| Hot seat rotation | YES | NO | NO | NO | NO |
| Web3 native | YES (Farcaster) | NO | NO | NO | YES |
| Text chat alongside audio | YES | YES | YES | NO | YES |
| Pricing | Free (100ms free tier) | Free | Free/$2.99-9.99 | Free (Nitro) | $320/node |
| Max participants | 100 (100ms limit) | 8,000 | 10,000+ | 10,000 | 10,000 |
| Open source | YES | NO | NO | NO | Partial |

**FISHBOWLZ differentiator:** Only product combining persistent rooms + async transcripts + hot seat rotation + Farcaster-native identity. No competitor does all 4.

## ZAO OS Integration

Current implementation spans these files:
- Pages: `src/app/fishbowlz/page.tsx`, `src/app/fishbowlz/[id]/page.tsx`
- API: `src/app/api/fishbowlz/{rooms,chat,events,sessions,transcribe,transcripts}/route.ts`
- Components: `src/components/spaces/{HMSFishbowlRoom,FishbowlChat,TranscriptInput}.tsx`
- Lib: `src/lib/fishbowlz/{logger,castRoom}.ts`
- Nav: `src/components/navigation/BottomNav.tsx` (MORE_ITEMS entry)
- DB: `supabase/migrations/20260404_fishbowlz.sql`, `20260405_fishbowl_chat.sql`, `20260405_fishbowl_scheduled.sql`

## Phase 1: Polish for Demo (1-2 days)

**Goal:** Make it look professional enough to show an investor or partner.

### 1.1 UI Polish
- [ ] Loading skeleton animations (replace "Loading rooms..." text)
- [ ] Empty state illustrations ("No rooms yet — create the first one!")
- [ ] Room card hover animations (subtle scale + shadow)
- [ ] Consistent border radius (currently mix of rounded-lg and rounded-xl)
- [ ] Speaker avatars use Farcaster pfp (already have `host_pfp`, extend to speakers)
- [ ] Smooth transitions on join/leave (fade in/out speakers)
- [ ] "How FISHBOWLZ works" onboarding modal (first visit)

### 1.2 Critical Bug Fixes
- [ ] Rate limiting on POST endpoints (prevent spam)
- [ ] Scheduled room auto-activation (cron or Vercel Edge function)
- [ ] Error toast notifications (instead of silent failures)
- [ ] Chat message dedup on fast double-send

### 1.3 Missing Interactions
- [ ] Host can kick a speaker (move to listeners)
- [ ] Host can mute a speaker
- [ ] Listeners can "raise hand" to join hot seat
- [ ] Emoji reactions (floating reactions like IG Live)
- [ ] Sound effects on join/leave/rotate

## Phase 2: Multi-User Experience (3-5 days)

**Goal:** Make it work great with 5-20 people simultaneously.

### 2.1 Real-Time Feel
- [ ] Reduce polling to 3s for room state (currently 5s)
- [ ] Optimistic UI updates (show join immediately, reconcile on next poll)
- [ ] Typing indicator in chat
- [ ] "X is speaking" visual indicator (audio level bars, not just green ring)
- [ ] Notification sound when someone joins your room

### 2.2 Speaker Management
- [ ] Hand raise queue with position indicator
- [ ] Auto-rotation timer (configurable: 5min, 10min, 15min per speaker)
- [ ] "Next up" preview showing who rotates in
- [ ] Speaker time display (how long each person has been in hot seat)

### 2.3 Room Types
- [ ] **Open fishbowl** — anyone can join hot seat (current default)
- [ ] **Moderated** — host approves speakers from hand raise queue
- [ ] **Listening party** — host plays music, listeners react (Spotify Greenroom model)
- [ ] **Interview** — 2 fixed seats + audience

### 2.4 Transcript Enhancement
- [ ] AI summary of transcript (Claude API) on room end
- [ ] Export transcript as Markdown/PDF
- [ ] Highlight key moments (host can mark)
- [ ] Search within transcripts

## Phase 3: Growth & Distribution (1-2 weeks)

**Goal:** Get users from outside ZAO.

### 3.1 Farcaster Distribution
- [ ] Mini App metadata in room casts (join-in-feed without leaving FC client)
- [ ] Cast room highlights as clips
- [ ] Auto-thread transcript segments as reply casts
- [ ] Room recap cast with AI summary

### 3.2 Embeddable Widget
- [ ] `/fishbowlz/embed/[slug]` — iframe-embeddable room viewer
- [ ] OG image generation for room links (dynamic social cards)
- [ ] Room status webhook (notify external systems when rooms start/end)

### 3.3 Onboarding Flow
- [ ] Landing page at `/fishbowlz` for non-authenticated users (show active rooms, invite to sign up)
- [ ] "Join as guest" mode (listen-only, no auth required)
- [ ] Progressive auth: listen free → sign in to speak → connect wallet for gated rooms

### 3.4 Analytics Dashboard
- [ ] Room analytics: total time, peak listeners, speaker count
- [ ] Host dashboard: my rooms, total listeners, transcript word count
- [ ] Community stats: most active hosts, most popular rooms, peak hours

## Phase 4: Monetization (when PMF confirmed)

### 4.1 Revenue Hooks (build now, activate later)
- [ ] Ticketed rooms (USDC/ETH gate to join)
- [ ] Tip speakers (micro-payments during live room)
- [ ] Premium rooms (recording, AI summary, higher participant limit)
- [ ] Brand rooms (sponsored fishbowls with custom branding)

### 4.2 Token Integration
- [ ] $FISHBOWLZ token via Clanker (when 50+ weekly rooms)
- [ ] Fee → SANG buyback mechanic (from ZABAL research doc 258)
- [ ] Speaker rewards (earn tokens for hot seat time)
- [ ] Room creator rewards (earn tokens when your room gets listeners)

## What Makes This a 10/10 Product

The gap between "working MVP" and "show-stopping demo" is mostly **feel**, not features:

1. **Instant feedback** — every action has a visual response (not just state changes on next poll)
2. **Sound design** — subtle join/leave/rotate sounds make it feel alive
3. **Empty states** — every empty section has an illustration and CTA, not just gray text
4. **Error handling** — toast notifications instead of silent failures
5. **Onboarding** — first-time user understands the fishbowl concept in 10 seconds
6. **Social proof** — show "X rooms created this week" or "Y minutes of conversation" on the list page

## Sources

- [Clubhouse pivots to async](https://www.theverge.com/2023/4/27/23700549/clubhouse-layoffs-more-than-half-staff) — 50%+ layoffs April 2023
- [X Spaces monetization](https://help.twitter.com/en/using-x/spaces) — ticketed spaces $1-$999
- [Huddle01 node sale](https://docs.huddle01.com/) — 46,900 nodes at $320 each, October 2024
- [100ms pricing](https://www.100ms.live/pricing) — 10,000 free minutes/month
- [Farcaster Mini Apps](https://docs.farcaster.xyz/developers/frames/v2/spec) — frame spec for in-feed interactions
- [Spotify Greenroom post-mortem](https://www.theverge.com/2022/6/16/23170487/spotify-greenroom-live-shut-down) — 275K downloads total, dead April 2023
