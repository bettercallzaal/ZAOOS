# 1624 — ZAO Agent Fleet Reference: ZOE + ZOL + Hurricane

**Type:** SYSTEM-REFERENCE  
**Topic:** Agents  
**Status:** ACTIVE — canonical reference for ZAO's three AI agents as of Jul 2026. Each agent has a distinct role, data access pattern, and output channel. Update when an agent's scope changes or a new agent is introduced. This doc is the "who does what" guide for anyone building on or extending ZAO's agent infrastructure.

---

## Why Three Agents

ZAO runs three specialized agents rather than one general agent because:
- **Separation of concerns:** Community communication (ZOE), Farcaster/social (ZOL), and build operations (Hurricane) have different failure modes — a bad ZOL cast doesn't affect Hurricane's code builds
- **Blast radius:** Each agent has minimal permissions outside its domain — ZOL can't touch Supabase write, Hurricane can't tweet
- **Context window:** Each agent can maintain focused context for its domain rather than tracking all of ZAO simultaneously

---

## Agent 1: ZOE — Community Intelligence & Automation

**Full name:** ZOE (ZAO Operations Entity)  
**Scope:** ZAO community operations, event automation, grant tracking, EOD reports, alert cadences  
**Model:** Claude (current generation)  
**Primary data sources:** WaveWarZ API (wavewarz.info/api/public/stats), Supabase (zao_artists, zaostock_2026_attendees, zabal_s2_participants), Eventbrite API  
**Output channels:** Telegram (ZAO main + Zaal private), X (@WaveWarZ posts), Farcaster (via Neynar signer — see below), Email (newsletter via Beehiiv/Substack)

### ZOE's Core Jobs

| Job | Trigger | Output |
|---|---|---|
| Daily EOD report | Cron (8PM ET) | Telegram to Zaal: WaveWarZ stats / ZABAL / ZAOstock / Decisions Needed / Upcoming |
| Battle result announcement | WW API event (battle closes) | X post + Farcaster /wavewarz cast with result + tx hash |
| Grant deadline alert | Date-triggered cron | Telegram ping to Zaal |
| Event day automation | Date+time cron | X + Farcaster + Telegram posts per event schedule |
| ZABAL S2 tracking | Manual trigger or cron | Supabase write (is_zabal_s2, attendance) |
| Newsletter send | Manual trigger (Zaal approval) | Beehiiv/Substack API send |
| Artist DM onboarding | Manual trigger or referral webhook | DM to new artist via X or Telegram |

### ZOE's Neynar Cast Pattern

```typescript
async function castToFarcaster(text: string, channelId: string) {
  await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': NEYNAR_API_KEY },
    body: JSON.stringify({ signer_uuid: NEYNAR_SIGNER_UUID, text, channel_id: channelId })
  })
}
```

**ZOE environment variables:**
- `WW_API_URL=https://wavewarz.info/api/public/stats`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `NEYNAR_API_KEY`, `NEYNAR_SIGNER_UUID`
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (main channel), `TELEGRAM_ZAAL_CHAT_ID` (private)
- `EVENTBRITE_API_KEY`

### ZOE Approval Protocol

ZOE has three operation modes:
- **Auto-post:** Standard battle results and cron-scheduled posts — no approval needed
- **Draft-and-send:** Event announcements and newsletters — ZOE prepares, sends preview to Zaal, waits for "OK" or HOLD
- **GATED:** Anything involving spend, deploys, or novel content — ZOE stops and says "DECISION NEEDED"

---

## Agent 2: ZOL — Farcaster Community Agent

**Full name:** ZOL (ZAO On-chain Listener / Farcaster agent)  
**Scope:** Farcaster social layer — cast monitoring, community replies, channel building (/wavewarz, /zabal, /zao)  
**Model:** Claude (current generation, smaller context window than ZOE)  
**Primary data sources:** Neynar webhooks (mentions, replies, new followers), Farcaster channel feeds  
**Output channels:** Farcaster casts only (no X, no Telegram — ZOL is Farcaster-native)

### ZOL's Core Jobs

| Job | Trigger | Output |
|---|---|---|
| Reply to WaveWarZ mentions | Neynar webhook (mention of @wavewarz) | Farcaster reply |
| Welcome new /wavewarz followers | Neynar follower webhook | Farcaster DM or welcome cast |
| Daily /wavewarz channel post | Cron (varies by campaign) | Cast with stats + CTA |
| /zabal channel post | Cron (ZABAL campaign) | Cast per doc 1607 spec |
| ZOR holder cast | Manual trigger | Cast to /zao with governance milestone |

### ZOL vs ZOE: When to Use Which for Farcaster

| Action | Who Does It |
|---|---|
| Live event battle result cast | ZOE (event-triggered, has WW API access) |
| Reply to a community member's cast | ZOL (conversational Farcaster agent) |
| Daily channel warmup post | ZOL (channel-native cadence) |
| ZAOstock Oct 3 coverage casts | ZOE (time-triggered, has full event schedule) |
| Responding to a /zabal member question | ZOL |

**Rule of thumb:** ZOE handles *scheduled* and *event-triggered* casts with data. ZOL handles *conversational* and *community-reactive* casts.

### ZOL DreamLoop System

ZOL uses "DreamLoops" — named automation loops that run on a schedule or event trigger. Each DreamLoop has:
- A `loopType` string (e.g., `zabal-battle-result-v1`)
- A draft-approve flow (ZOL drafts → Zaal approves in 5 min window → ZOL posts, or auto-posts for standard loops)
- A channel target (`/wavewarz`, `/zabal`, or `/zao`)

**Current DreamLoops (as of Jul 2026):**
- `battle-result-v1`: Quick battle result cast to /wavewarz
- `zabal-weekly-thread-v1`: Monday thread in /zabal
- `artist-spotlight-v1`: Artist spotlight cross-post /wavewarz → /zao

---

## Agent 3: Hurricane — Build Operations Agent

**Full name:** Hurricane  
**Scope:** Code builds, Supabase schema changes, API integrations, test runs — the dev automation layer  
**Model:** Claude Code (full tool access in dev environment)  
**Primary data sources:** GitHub repos (wwtracker, CoCConcertZ, ZAOOS), Supabase (via CLI or API), local dev environment  
**Output channels:** GitHub PRs, Supabase migrations, Telegram to Zaal (build status)

### Hurricane's Core Jobs

| Job | Trigger | Output |
|---|---|---|
| Build `zao_artists` Supabase table | Manual (Zaal: "Hurricane, build the artist table") | PR to wwtracker or ZAOOS with migration |
| Run smoke tests on wwtracker API | Manual or post-PR hook | Test report to Telegram |
| Sync ZAOstock Eventbrite attendees → Supabase | Manual or webhook | Supabase `zaostock_2026_attendees` rows |
| Deploy CoCConcertZ show page | Manual (post Zaal approval) | Vercel deploy + PR |
| Build ZABAL S2 application form backend | Manual | Supabase tables + API route PR |

### Hurricane Build Checklist (from doc 1615)

Critical milestones in order:
- [ ] **Aug 15:** Smoke test wwtracker `/api/public/stats` — confirm COC #8 show day readiness
- [ ] **Aug 22:** Build `zao_artists` Supabase table with initial population from WW API
- [ ] **Sep 1:** Wire ZOE Eventbrite webhook → `zaostock_2026_attendees` Supabase table
- [ ] **Sep 30:** Arm all ZOE automations for ZAOstock Oct 3 (8PM ET test run Sep 30)
- [ ] **Nov 20:** ZABAL S2 graduation ceremony Supabase updates

### Hurricane Blast Radius Rules

- Hurricane has read/write access to Supabase but is not authorized to drop tables or delete production data
- Hurricane deploys require Zaal approval (Telegram "OK" before Vercel deploy)
- Hurricane does not have X or Farcaster posting access
- Hurricane does not manage private keys or wallets — those are Zaal's domain

---

## Agent Coordination: How They Work Together

The common flow for a WaveWarZ MAIN battle:

```
ZOR vote closes (governance, Zaal facilitated)
    ↓
Zaal triggers WaveWarZ battle creation (wavewarz.info/admin)
    ↓
WW API emits battle-open event
    ↓
ZOE picks up event → posts "Battle is LIVE" to X + Farcaster /wavewarz + Telegram
    ↓
ZOL monitors /wavewarz for community reactions → replies to mentions
    ↓
Battle closes, WW API emits settlement event
    ↓
ZOE picks up settlement → posts "Winner: [name], Loser earned [X] SOL" to X + Farcaster + Telegram
    ↓
ZOL follows up in /wavewarz with community engagement cast
    ↓
Hurricane (if needed): updates `zao_artists` SOL totals in Supabase
```

---

## Agent Fleet Expansion (Future)

| Agent | Status | Notes |
|---|---|---|
| ZOE | Live | Core community agent — operational |
| ZOL | Active (PR #61 in progress) | DreamLoop system partially live |
| Hurricane | Active | Build agent operational |
| **ZAO Oracle** | Planned | On-chain outcome verification for ZABAL rewards (doc 347) |
| **ZAO Nexus** | Planned | Rebrand of main ZAO OS interface; may get its own agent layer |

---

## Related Docs

- 1615 — ZOE Architecture and Handoff Spec (full ZOE system map + env vars)
- 1607 — ZOL /zabal Channel Auto-Post DreamLoop Spec
- 1604 — ZAO Artist Directory Spec (Supabase table Hurricane builds)
- 1601 — ZAO OS Supabase Patterns (database patterns both ZOE and Hurricane use)
- 1619 — Fractal Democracy Session Guide (ZOE's session automation role)
