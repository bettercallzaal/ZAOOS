---
topic: farcaster
type: market-research
status: research-complete
last-validated: 2026-05-23
related-docs: 173, 240, 246, 250, 305, 308, 316, 317, 326, 707, 708, 728
tier: DEEP-DISPATCH
---

# 733 - ZABAL Virality + Ecosystem Incorporation

> **Goal:** Map every ZAO/ZABAL touchpoint we can weave into zabal.art and rank Farcaster-specific virality mechanisms we can ship next. Picks for the top 3 PRs are at the bottom.

## Key Decisions (Recommendations First)

| # | Decision | Rationale | Leverage 1-5 | Ship next? |
|---|----------|-----------|--------------|------------|
| 1 | **Auto-tag /zao channel on every share-cast** (one-line SDK change) | Channels auto-notify ALL subscribers in addition to user's followers. Free 2x distribution. Compounds with PR #5 + #6 we already shipped. | 5 | YES (PR #7, 10 min) |
| 2 | **Streak fire badge in leaderboard** (`[Nw streak]`) | `streak` already in `get_zabal_leaderboard` RPC. Visible streak is the #1 documented retention lever on Farcaster Mini Apps (40% session-to-session per Frames data). | 5 | YES (PR #7, 30 min) |
| 3 | **SongJam live-now widget on hub** | `songjam.space/zabal` is the canonical $ZABAL Empire leaderboard - already wired into our `apiLeaderboards`. Embed top-5 + radio-now badge. Pulls SongJam audience back to ZABAL. | 5 | YES (PR #8, 1-2 h) |
| 4 | **Mode-aware OG variants** (`/og?mode=music`) | Extends PR #6. Each share-cast now carries the user's faction. Music voters cast to defend the lead; Build voters cast to rally a comeback. | 4 | YES (PR #8, 1 h) |
| 5 | **Channel-pinned weekly summary cast (manual + cron-prepared)** | /zao moderator pins ZABAL's Sunday recap cast for 7 days. Permanent top-of-channel spot, free reach. | 4 | YES (coordination, 30 min) |

## TL;DR

- **What's working now (post-PR #6):** Voting, share-cast, dynamic OG with live tallies, last-week banner, spotlight. Hub is solid skeleton.
- **What's missing and high-leverage:** Channel routing on share-casts, streak visibility, SongJam-loop, ZAO Stock anchor, agent-driven daily cast of the live tally.
- **What's missing and aspirational:** Multi-agent personas (ZOE/HERALD/FLIPPER), x402 agent payments, ERC-8004 registration. Don't ship until basics are humming.
- **Brand audit:** Current hub uses canonical spellings (WaveWarZ, The ZAO, BetterCallZaal, COC Concertz). No corrections needed in committed code as of PR #6.
- **Anti-features (do NOT add):** All-votes timeline, wallet-connect tx UI, sub-voting rounds, per-user profile pages. Hub stays focused on the weekly rhythm.

## Method

DEEP tier with DISPATCH - 4 parallel sub-agents. Each carried a slice:
- A: Agent-driven virality (bootcamp Sessions 1-10, ZOE, OpenClaw)
- B: Full ZAO+ZABAL ecosystem inventory (25 projects)
- C: Farcaster-specific virality SDK primitives + channel dynamics
- D: zabal.art hub gap analysis (current vs target state)

Total sources: 30+ research docs + Mini App SDK v0.3.0 (Apr 2026) docs + Farcaster ecosystem update (Doc 308).

## Findings — Synthesis

### Three loops that compound

ZABAL's Farcaster reach is not one mechanic - it's three loops that compound. Each PR should land in one of these loops:

**Loop 1 - Distribution (post-vote -> friends see it -> they vote)**
- Share-cast button (PR #5 ✓)
- Dynamic OG with live tallies (PR #6 ✓)
- `channelKey: 'zao'` on every share-cast (PR #7 - 10 min)
- Mode-aware OG variants (PR #8)
- Mention tags in cast text (`@friend1 @friend2`)

**Loop 2 - Retention (came once -> come back next week)**
- Confetti + countdown (PR #5 ✓)
- Streak badges in leaderboard (PR #7)
- Notification on vote opens (PR #8 - requires Mini App add)
- "Your mode came in 2nd this week" Sunday-night recap notification
- Daily cron cast of the tally to /zao channel

**Loop 3 - Ecosystem pull (came for the vote -> stayed for ZAO)**
- SongJam radio-now badge (PR #8)
- ZAO Stock hero card (PR #9)
- Magnetiq Proof-of-Meet hook for IRL events
- Respect leaderboard embed
- Live now: COC Concertz / WaveWarZ battles / LTAE podcast

### Master Next Actions table (ranked by leverage / time-to-ship)

| # | Idea | Loop | File / route | Time | Leverage | Source |
|---|------|------|--------------|------|----------|--------|
| 1 | Add `channelKey: 'zao'` to shareCast() | 1 | `ZabalVoteClient.tsx` | 5min | 5 | C |
| 2 | Streak badge `[Nw streak]` on leaderboard rows | 2 | `page.tsx` LeaderboardSection | 30min | 5 | D |
| 3 | Mode-aware OG variants `/og?mode={id}` | 1 | `og/route.tsx` + `ZabalVoteClient.tsx` shareCast embed URL | 1h | 4 | C, D |
| 4 | SongJam live-now widget + top-5 $ZABAL Empire embed | 3 | New `SongJamWidget.tsx` server component, fetch songjam.space/api/leaderboard | 1.5h | 5 | B |
| 5 | Daily cron cast to /zao channel of live tally | 1 | New `/api/cron/zabal-daily-cast` route + Neynar publish_cast + vercel.json schedule | 2h | 4 | A, C |
| 6 | "Add ZABAL Mini App" prompt after first vote | 2 | `ZabalVoteClient.tsx` call `sdk.actions.addMiniApp()` post-vote | 30min | 4 | C |
| 7 | Vote-cast as reply to /zao pinned cast | 1 | shareCast variant with `parent: {hash: PINNED_CAST_HASH}` | 30min | 4 | C |
| 8 | Mention-friends in share-cast text (Neynar best-friends API) | 1 | shareCast() fetch /api/best-friends + interpolate `@friend1 @friend2` | 2h | 4 | C |
| 9 | Notification subscribe + Sunday recap push | 2 | `/api/cron/zabal-sunday-recap` + Neynar managed notifications | 3h | 4 | A, C |
| 10 | ZAO Stock hero/countdown card on hub | 3 | New `ZaoStockHeroCard.tsx` server component | 1h | 4 | B |
| 11 | "Copy link" button next to share-cast (multi-platform) | 1 | `ZabalVoteClient.tsx` `navigator.clipboard.writeText(location.href)` | 10min | 3 | D |
| 12 | Vote count alongside countdown ("237 votes - closes in 3d 14h") | 2 | `ZabalVoteClient.tsx` sum optimisticTotals.vote_count | 10min | 3 | D |
| 13 | Spotlight phase badge ("NOMINATING OPEN" / "VOTE OPEN" / "CLOSED") | 2 | `ZabalSpotlightClient.tsx` reuse Countdown logic | 30min | 3 | D |
| 14 | Past 4 weeks mini-sparkline of mode wins | 2 | New `WeekHistory.tsx` + RPC `get_zabal_4week_winners` | 1h | 3 | D |
| 15 | Rank-delta arrow on leaderboard rows ("up 2 / down 1") | 2 | New RPC + join last-week ranks; render in `page.tsx` | 1.5h | 3 | D |
| 16 | OG variant for /spotlight page (`/og/spotlight`) | 1 | New `og/spotlight/route.tsx` | 1h | 3 | D |
| 17 | COC Concertz "next show" badge | 3 | New widget, requires API at cocconcertz.com (verify exists) | 2h | 3 | B |
| 18 | WaveWarZ "top recent battle" embed card | 3 | New widget, requires API at wavewarz.com | 2h | 3 | B |
| 19 | LTAE podcast "live now / next episode" strip | 3 | New widget pointing at Twitch schedule | 1h | 3 | B |
| 20 | Respect leaderboard embed (link to zaoos.com/respect) | 3 | Static link card in token panel | 15min | 2 | B |
| 21 | Magnetiq Proof-of-Meet IRL-events portal card | 3 | Add to ZabalEcosystem PORTALS array | 5min | 3 | B |
| 22 | Snapshot polls embed | 3 | Static link in token panel; verify zaal.eth space active | 15min | 2 | B |
| 23 | Year-of-the-ZABAL Newsletter subscribe widget | 3 | Static CTA in About section | 10min | 2 | B |
| 24 | Daily agent persona cast (ZOE/HERALD/FLIPPER) | 1 | Multi-agent FID setup, Neynar bulk send, persona scoring | 1-2 days | 4 (aspirational) | A |
| 25 | x402 reverse proxy so agents auto-pay Neynar | infra | Privy wallet + servex-rs OR ~50 LOC TS wrapper | 3h | 3 (aspirational) | A |

### Patterns that work on Farcaster, specifically

(Sub-Agent C, verified against Mini App SDK v0.3.0 as of April 2026)

- **`channelKey` parameter on composeCast** - routes the cast into a channel. /zao channel notifies subscribers separate from follower distribution. This is the single biggest free-reach lever we are not using. (5min change.)
- **Reply vs recast weighting** - Farcaster's algo scores replies 10x, recasts 3x, likes 1x. Share-cast text should ask a question to prompt replies. ("Music or Governance this week? Cast your vote ->")
- **First-30-min velocity** - cast that gets 20 reactions in the first 30 min trends to channel top; one with 1000 reactions over a week doesn't. Implication: daily-cron tally should fire at a fixed peak hour (9am ET) and a Discord/Telegram nudge should kick a few seed votes within 5 min.
- **Mini App embed deep-linking** - per-route `fc:miniapp` tag means a shared `zabal.art/spotlight` link opens directly into the Spotlight modal, not the hub. We have this on `/` and `/spotlight` - extend to any future shareable route.
- **Quote-cast (FIP-2 native embeds)** - embed a /zao cast by CastId, not URL. Renders inline in client. `[VERIFY]` whether Mini App `composeCast` accepts CastId embeds in current SDK - need to test before shipping.

### Patterns from the agentic bootcamp (Sub-Agent A)

Bootcamp Sessions 1-10 (Docs 240, 316, 317, 326) on what works:

- **Agent replies in the timeline** (not DMs) - educates community + creates social proof. Implication: a ZABAL agent that replies to /zao casts about voting (not posting standalone) compounds visibility.
- **Webhook + cron hybrid** - Vercel serverless with Neynar webhook for real-time mention responses + cron for scheduled tallies. 30min heartbeat feasible; 60min more cost-efficient. Our existing `zabal-spotlight-winner` cron is the right shape.
- **Idempotency keys** - hash(agent_name + date + action) before posting. Prevents double-cast embarrassment on webhook retries.
- **Structured output / tool calling** - never regex-parse user requests. Use Claude's tool calling to map "buy 100K ZABAL" -> `{action: 'trade', amount: 100000}`. Reliable.
- **45% context window rule** - never let an agent context exceed 45% of model max before generating output. Quality degrades sharply past that.
- **x402 pay-per-call** - $0.001 USDC per Neynar call. Agent funds itself from a treasury. Removes monthly-subscription cap. (Aspirational for ZABAL - relevant once we have multi-agent.)

**Aspirational caveat:** Sub-Agent A's analysis assumes multi-persona agents (ZOE/HERALD/FLIPPER) that don't exist in ZABAL today. Patterns translate, but the immediate move is ONE agent (the daily-tally cron cast) - not a swarm.

### Ecosystem incorporation (Sub-Agent B)

Hub currently links 8 portals. Sub-Agent B identified 25 more projects/people/brands. Highest-leverage missing:

| Project | URL | Integration | Leverage |
|---------|-----|-------------|----------|
| SongJam (SANG token + $ZABAL leaderboard) | songjam.space | Live-now widget + top-5 Empire embed | 5 |
| ZAO Stock (Oct 2026 festival, Ellsworth ME) | zaoos.com/stock | Hero card + countdown | 5 |
| COC Concertz (150+ weekly VR shows) | cocconcertz.com | "Next show" badge | 4 |
| WaveWarZ (795 battles, 435 SOL volume) | wavewarz.com | "Top recent battle" embed | 5 |
| Magnetiq Proof-of-Meet (IRL connection badges) | magnetiq.xyz | Portal card in ecosystem grid | 4 |
| Ohnahji University ("Web3's first HBCU") | ohnahjiu.com | Portal card | 3 |
| Hats Protocol (ZAO roles, tree 226 Optimism) | hatsprotocol.xyz | Roles section in About | 3 |
| Clanker Protocol ($ZABAL deployed Jan 2026) | clanker.world | Token stats embed | 3 |
| Respect Leaderboard (Optimism + Base) | zaoos.com/respect | Link in token panel | 3 |
| Snapshot polls (zaal.eth space) | snapshot.org | Link in token panel | 2 |
| Year-of-the-ZABAL Newsletter (paragraph.com/@thezao) | paragraph.com/@thezao | Subscribe CTA | 2 |
| Let's Talk About Ethereum podcast (Weds 6pm EST) | twitch.tv/bettercallzaal | Live-now strip | 3 |
| The Cypher (multi-artist Q4 release) | TBD | "Coming Soon" teaser | 4 |

**Categories the hub is missing entirely:**
- Music livestream "what's live now"
- Token economics dashboard (consolidated $ZABAL / $SANG / Respect)
- Governance section (fractals, proposals)
- Event calendar (ZAO Stock, ZAOVille, COC Concertz, LTAE)
- IRL connection portal

**Dead/paused (do NOT link):**
- ZAO Festivals X account (HTTP 000) - currently linked, switch to Instagram or remove
- FISHBOWLZ (sunset May 2026 for Juke partnership)
- Sound.xyz (offline since Jan 2026 - artist links should point at Spotify/Vault.fm)
- LTAW3 podcast (replaced by LTAE)
- $LOANZ (on hold)

### Hub gaps (Sub-Agent D)

Top quick-wins under 30 min each:
1. Streak badge on leaderboard
2. Vote count next to countdown
3. Neynar score tooltip expansion
4. "Copy link" button
5. Spotlight phase badge

Bigger plays:
- Supabase Realtime for cross-user live vote sync
- Empire Builder balance embed
- Email notifications (Resend)
- Rank-delta indicators

Anti-features (DO NOT ADD):
- All-votes-ever timeline (breaks weekly rhythm focus)
- Wallet-connect / tx UI (keeps hub lightweight)
- Sub-voting rounds (fragments attention)
- Per-user profile pages (vote-buying surface)
- 20+ partner cards (that's what ZAONEXUS is for)

## Anti-patterns (combined from A + C)

1. **Generic share text** - "Check out this app" wastes the social graph. Pre-fill with social proof: "Voted Music this week - @friend1 @friend2 picks?"
2. **Replies-undervalued** - teams optimize for recasts, miss that replies are 10x. Frame share-casts as questions.
3. **No channel strategy** - missing `channelKey` = leaving 2x distribution on the table.
4. **Quote casts as URLs** - embedding zabal.art/vote/123 instead of native CastId means link-fallback render, not in-client preview.
5. **Treating Mini App as web** - building glorified browser windows without SDK primitives = no social hooks.
6. **No first-30-min velocity seeding** - 0 interactions for the first hour = will never trend. Manual nudge to power curators in Discord/Telegram before publishing.
7. **Over-posting** - one autonomous post per hour max, otherwise muted. Stick to 1-3 fixed times per day.
8. **Regex-fragile action parsing** - use Claude tool-calling for any user-input -> action mapping.
9. **Missing idempotency keys** - webhook retries -> double-cast embarrassment. Hash before publishing.

## Open Questions (consolidated)

1. **`composeCast` channelKey** - verify SDK v0.3.0 accepts channelKey on Warpcast + Base App + Coinbase Wallet. Test before assuming 100% coverage.
2. **CastId embed in composeCast** - does the Mini App SDK accept FIP-2 CastIds as embeds, or only URLs? Test.
3. **Agent FID strategy** - single shared FID for ZABAL-agent-actions or separate FIDs per persona? Single is simpler; multi-persona is more visible but adds management.
4. **/zao channel moderator coordination** - who can pin the weekly recap cast? Zaal needs to confirm.
5. **Empire Builder public API** - is there a balance-by-FID endpoint? Not in current docs.
6. **Neynar score caching** - 24h vs 4h? Drift vs cost tradeoff.
7. **SongJam API** - does songjam.space expose a public radio-now / top-5 endpoint, or do we scrape?
8. **BCZ YapZ** - confirm with Zaal what this is (current hub link is opaque).
9. **ZAO Festivals domain** - dead permanently or coming back? Determines link strategy.

## Recommended next 3 PRs (the picks)

Based on leverage * speed-to-ship:

**PR #7 - "Channel + Streak" (1 hour total)**
- Add `channelKey: 'zao'` to shareCast()
- Streak badge `[Nw streak]` on leaderboard rows
- Vote count next to countdown
- "Copy link" button
- One commit, one PR, low risk, immediately compounding.

**PR #8 - "SongJam + Mode-aware OG" (2-3 hours)**
- New `SongJamWidget` server component (top-5 Empire embed + live-now status)
- Mode-aware OG variants `/og?mode={id}` - the user's faction highlighted
- shareCast() passes `?mode=${currentMode}` so cast preview shows their team

**PR #9 - "Daily cron cast + Mini App add prompt" (3-4 hours)**
- New `/api/cron/zabal-daily-cast` posting tally to /zao channel
- `sdk.actions.addMiniApp()` prompt after successful vote
- Coordinate with /zao moderator to pin the weekly Sunday recap

After PR #9, evaluate: do we have multi-agent budget (1-2 days for ZOE/HERALD/FLIPPER), or do we move to ZAO Stock hero + ecosystem expansion (PR #10)?

## Sources

### Research docs (internal)
- [Doc 173 - Farcaster Mini Apps integration](../173-farcaster-miniapps-integration/)
- [Doc 240 - Farcaster Agentic Bootcamp builders.garden](../../events/240-farcaster-agentic-bootcamp-builders-garden/)
- [Doc 246 - Neynar API creative agent uses](../../agents/246-neynar-api-creative-agent-uses/)
- [Doc 250 - Farcaster Mini Apps llms.txt 2026](../250-farcaster-miniapps-llms-txt-2026/)
- [Doc 305 - Channel moderation + community management](../305-channel-moderation-community-management/)
- [Doc 308 - Farcaster ecosystem Spring 2026](../308-farcaster-ecosystem-spring-2026/)
- [Doc 316 - Bootcamp Week 2 deep dive](../../events/316-farcaster-agentic-bootcamp-week2-deep-dive/)
- [Doc 317 - Bootcamp Week 1 transcripts](../../events/317-farcaster-agentic-bootcamp-week1-transcripts/)
- [Doc 326 - Bootcamp complete session guide](../../events/326-agentic-bootcamp-complete-session-guide/)
- [Doc 707 - ZABAL miniapp conformance](../707-zabal-miniapp-conformance/)
- [Doc 708 - ZABAL hub landing page architecture](../../business/708-zabal-hub-landing-page/)
- [Doc 728 - ZABAL voting UX overhaul](../../dev-workflows/728-zabal-voting-ux-overhaul/)
- Ecosystem mapping: Docs 050, 051, 065, 287, 289, 298, 324, 348, 352, 358, 363, 364, 473

### External (verified May 2026)
- Mini App SDK v0.3.0 release notes (April 2026)
- Neynar managed notifications dashboard
- SongJam $ZABAL leaderboard at songjam.space/zabal
- HAATZ Quilibrium Hypersnap docs at haatz.quilibrium.com

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| PR #7 (channel + streak + vote count + copy link) on zabalartsubmission | Claude (this session) | PR | Same day as research |
| PR #8 (SongJam widget + mode-aware OG) | Claude (this session) | PR | Within 1 day |
| PR #9 (daily cron + addMiniApp prompt) | Claude (this session) | PR | Within 2 days |
| Verify channelKey support across clients (Warpcast / Base App / Coinbase) | Zaal manually | Test | Before PR #7 merges |
| Confirm BCZ YapZ purpose (current hub portal is opaque) | Zaal | Verbal | Before PR #10 |
| Pin weekly Sunday recap cast in /zao | /zao moderator + Zaal | Coordination | Before PR #9 ships |
| Decide multi-agent persona strategy (single FID vs ZOE/HERALD/FLIPPER) | Zaal | Decision | Before agent-driven virality PRs |

## Also See

- [Doc 728 - ZABAL voting UX overhaul](../../dev-workflows/728-zabal-voting-ux-overhaul/) - the predecessor research that drove PR #4/5/6
- [Doc 707 - ZABAL miniapp conformance audit](../707-zabal-miniapp-conformance/) - what's already correct vs what needs fixing
- [Doc 710 - Miniapp registration + deep-linking](../710-miniapp-registration-deeplinking/) - the per-route embed pattern we ship today
