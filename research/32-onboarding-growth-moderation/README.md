# 32 — Onboarding, Growth, Moderation, Engagement & Discovery

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** How to onboard non-crypto musicians, grow 40→1000, moderate, and keep members engaged

---

## Key Decisions for ZAO OS

### Immediate (Next 30 Days)
1. **Integrate Privy** alongside SIWF — onboard non-crypto musicians via email/Google (free to 1K MAU)
2. **Set up PostHog** — free analytics, 10 lines of code, track retention immediately
3. **Basic moderation:** Neynar user score filtering + community report button + mod queue
4. **Weekly email digest** via Resend (free tier)

### Short-Term (60-90 Days)
5. Referral system: 3 invite codes per member, Respect rewards
6. "Track of the Day" curation feature
7. Web Push notifications for replies and mentions
8. Supabase full-text search

### Medium-Term (3-6 Months)
9. Weekly listening parties, monthly AMAs, quarterly showcases
10. Ambassador program for top 10 most active members
11. Admin analytics dashboard at `/admin/dashboard`
12. Progressive decentralization: membership NFT + on-chain Respect

---

## 1. Web3 Onboarding UX

### The Problem
Traditional web3 onboarding (MetaMask → seed phrase → buy ETH → approve → pay gas) has 90%+ drop-off. For non-crypto musicians, this is a dealbreaker.

### Privy (Recommended)
- Login: Email, SMS, Google, Apple, Twitter/X, Discord, **Farcaster**, passkeys
- Creates embedded wallet automatically — user never sees "wallet" language
- MPC architecture: key shards split across Privy servers + user device + recovery
- Gas sponsorship via Pimlico/Alchemy paymasters
- **Free up to 1,000 MAU** — matches ZAO growth trajectory
- **Already supports Sign In With Farcaster** — preserves existing auth flow
- Used by: Zora, friend.tech, Blackbird

### The Ideal Flow (3 Steps Max)
1. **"Join ZAO"** → Sign in with Google/email/Apple (or Farcaster)
2. **Verify membership** → Enter invite code OR get vouched by existing member
3. **You're in** → Wallet created silently, profile auto-populated

### How to Explain Web3 to Musicians
- Never say "wallet" — say "your ZAO account"
- Never say "sign a transaction" — say "confirm your action"
- Never say "gas fees" — the app pays them silently
- Frame as familiar: "It's like your Spotify artist profile, but you actually own it"
- Only reveal web3 when it benefits them: "You earned 5 Respect tokens — these prove your contributions and can never be taken away"

### Progressive Decentralization
- **Phase 1 (Now-100):** Fully centralized. Supabase allowlist, admin-controlled.
- **Phase 2 (100-500):** Semi-decentralized. Embedded wallets via Privy, Respect on-chain.
- **Phase 3 (500-1000+):** DAO governance. Token-gated access, community votes on members.

### Passkeys
- Biometric auth (Face ID, fingerprint) instead of passwords
- Coinbase Smart Wallet and Privy both support passkeys
- Signs transactions via device secure enclave
- Best for mobile UX

---

## 2. Community Growth (40 → 1000)

### Phase 1: Foundation (40→100, Months 1-3)
- Keep invite-only. Each founding member gets 2-3 invite codes
- Focus on depth: every new member personally welcomed
- Establish culture before scaling
- Goal: 100% post at least once/week

### Phase 2: Controlled Growth (100→300, Months 3-6)
- Increase to 5 invite codes per member
- Referral incentives: 5 Respect for successful referral (active at D30)
- Content-led growth (public clips from ZAO events)
- 2-3 strategic partnerships (music DAOs, NFT platforms)

### Phase 3: Accelerated (300→1000, Months 6-12)
- Open applications with vouch system (1-2 existing members must vouch)
- Ambassador program (top 10% most active)
- Event-driven growth (weekly listening parties, monthly AMAs)
- Cross-platform clips (X, Farcaster, YouTube Shorts, TikTok)

### Referral Program
- Referrer: 5 Respect on join + 5 more at D30 retention
- Referred: 2 Respect welcome bonus
- "Top Recruiters" leaderboard
- Cap: max 10 referrals per person (quality over quantity)
- Accountability: referrer loses rep if referrals get banned

### Content-Led Growth
1. Behind-the-scenes artist content (studio sessions, production breakdowns)
2. Curated playlists shared across platforms ("hear the full discussion inside ZAO")
3. Exclusive artist AMAs with public clips
4. Educational: "How to earn from your music in web3"
5. Collaborative: community remixes, beat challenges, sample packs

### Event Calendar
- **Weekly:** Listening Party (1hr, 3-5 tracks, votes, Respect for featured artists)
- **Monthly:** AMA with notable artist, Remix Challenge (2 weeks), Community Spotlight
- **Quarterly:** Virtual Concert, Compilation Release on Sound.xyz, IRL meetup

### Growth Lessons
- **Sound.xyz:** 0 → 10K collectors in 12 months via "Listening Parties" with limited editions
- **Coop Records:** X Spaces → 200+ listeners → 5% conversion to members
- **Catalog:** Artist evangelism — when someone sold for 2+ ETH, they told everyone

### Hybrid Tier Model

| Tier | Access | Requirement |
|------|--------|-------------|
| **Public** | View curated playlists, read-only highlights | None |
| **Free Member** | Post, listen, basic profile | Sign up + vouch |
| **Core Member** | All channels, vote, earn Respect, events | Membership NFT or 10+ Respect |
| **Curator** | Highlight tracks, moderate, private channels | 50+ Respect |

### Community Health Metrics
- **L7 Engagement:** >40% of members posted/reacted in 7 days
- **D30 Retention:** >60% of new members still active
- **Time to First Post:** <24 hours
- **Thread depth:** >3 replies average
- **NPS:** >50 (quarterly survey)

---

## 3. Content Moderation

### Tiered System

**Tier 1 — Automated (catches 80%):**
- Neynar user score <0.3 → auto-flag
- Known phishing domains → auto-block
- Rate limit: 10 posts/hour
- Duplicate detection: 3+ identical → auto-hide

**Tier 2 — Community Reports (catches 15%):**
- Any member flags with reason (spam, harassment, off-topic, copyright)
- 3 unique flags → auto-hidden pending review
- Respect-weighted: 50+ Respect member's flag counts as 2
- False flagging penalty: weight decreases

**Tier 3 — Moderator Review (catches 5%):**
- 3-5 trusted members with Curator status
- Review queue for flagged content
- Appeals go to 3-person panel (not original mod)

**Jury System (serious disputes):**
- 5 random members (30+ day tenure, 20+ Respect)
- Anonymous vote, majority rules
- Jurors earn Respect for participating

### AI Moderation Stack
- **Perspective API** (Google): Free, real-time toxicity scoring (0-1). Use for every post.
- **OpenAI Moderation API:** Free with API key, second opinion on flagged content.
- **Claude (Haiku):** ~$0.003/check for complex appeals where context matters.

### Music-Specific Policies
1. **Copyright:** Sharing streaming links always OK. Uploaded tracks require rights assertion.
2. **DMCA:** Register agent ($6), documented takedown process, counter-notice.
3. **Explicit content:** Tag/filter system, not banned.
4. **Self-promotion:** For every promo post, engage with 3 others first (enforce via ratio).
5. **Feedback:** Constructive critique OK, personal attacks not.

---

## 4. Notifications & Engagement

### Notification Stack
- **Web Push (Phase 1):** Free, service workers, works on all platforms including iOS 16.4+
- **Farcaster Mini App notifications:** For Warpcast users
- **Push Protocol (Phase 2):** Decentralized, wallet-to-wallet, 30K/mo free
- **Email digests:** Resend (3K emails/mo free) — Monday 10am weekly roundup

### What to Notify

| Priority | Trigger | Method |
|----------|---------|--------|
| **Always** | Reply to your post, @mention, DM, Respect earned | Real-time push |
| **Daily batch** | New member, event scheduled, reactions summary | Daily digest |
| **Weekly** | Community stats, top content, feature updates | Email |
| **Never** | Random channel activity, admin messages | In-app only |

### Engagement Loops
1. **Create** → Share track → **Discover** → Others find it → **Engage** → Listen, react → **Reward** → Earn Respect → **Status** → Unlock Curator → **Motivate** → Create more

### Gamification
- **Streaks:** 7-day engagement streak → bonus Respect (allow 1 freeze/week)
- **Badges:** "First Track", "Curator" (50+ reactions), "Connector" (5 referrals), "OG" (founding 40)
- **Leaderboards:** "Top Curators This Week" (rotate weekly, show top 10 only)
- **Progress bars:** "3 posts away from Curator status"
- **Never:** Pay-to-win, vanity metrics, discouraging rankings

### Preventing Fatigue
- Ask for push permission at day 3 or 5th session (not first visit)
- Max 5 push notifications/day
- Quiet hours (10pm-8am local time)
- Auto-mute notification types ignored 5+ times

---

## 5. Search & Discovery

### Feed Strategy
- **Phase 1 (40-200 members):** Curated highlights at top + chronological. Human curators pin best content.
- **Phase 2 (200-1000):** Add "For You" tab with simple collaborative filtering.
- **Phase 3 (1000+):** OpenRank reputation-based feed curation.

### Music Discovery
- **Collaborative filtering:** Track who reacts to what → find similar members → recommend their liked tracks. Basic SQL at ZAO's scale (no ML needed until 1000+ tracks).
- **"ZAO Weekly Mix":** Every Monday, 5 personalized tracks based on taste neighbors.
- **Novelty bonus:** Always include 1-2 tracks from members the user hasn't interacted with.

### Trending Algorithm (Small Community)
```
score = (positive_reactions + 1) / (total_reactions + 2) × time_decay
time_decay = 1 / (1 + hours_since_post / 24)
```
Post with 5 reactions in 2 hours outranks 10 reactions over 3 days.

### Search Implementation
- **Phase 1:** Supabase full-text search (`tsvector`/`tsquery` + GIN index). Free, good to ~1M rows.
- **Phase 2:** Meilisearch (typo-tolerant, instant, faceted). Self-host on Railway ~$5/mo.

---

## 6. Analytics

### Recommended: PostHog
- Free: 1M events/month
- Features: Funnels, retention cohorts, session recordings, feature flags, A/B testing
- Next.js integration: ~10 lines of code
- Open-source: self-hostable (web3 values)
- Killer feature: Cohort analysis for measuring onboarding changes

### Key Metrics Dashboard

| Layer | Metrics | Check |
|-------|---------|-------|
| **Platform Health** | DAU, WAU, MAU, DAU/MAU ratio, posts/day | Daily |
| **Growth** | New members/week, D1/D7/D30 retention, time to first post | Weekly |
| **Music** | Tracks shared, listen-through rate, curator score, cross-pollination | Weekly |
| **Community Health** | Response time, thread depth, posting Gini coefficient, NPS | Monthly |

### On-Chain Analytics
- **Dune:** Free SQL queries on blockchain data. Build public "ZAO Health" dashboard.
- Track: token distribution, active holders, transaction volume, governance participation.

---

## Sources

- [Privy](https://privy.io/) — [Docs](https://docs.privy.io/)
- [Dynamic](https://dynamic.xyz/) — [Docs](https://docs.dynamic.xyz/)
- [Thirdweb Connect](https://thirdweb.com/connect)
- [Coinbase Smart Wallet](https://www.smartwallet.dev/)
- [PostHog](https://posthog.com/)
- [Perspective API](https://perspectiveapi.com/)
- [Push Protocol](https://push.org/)
- [Resend](https://resend.com/)
- [OpenRank](https://docs.openrank.com/)
- [Meilisearch](https://www.meilisearch.com/)
- [Bluesky Ozone Moderation](https://docs.bsky.app/docs/starter-templates/ozone)
- [Sound.xyz Growth](https://sound.mirror.xyz/)
- [Coop Records](https://coopahtroopa.mirror.xyz/)
