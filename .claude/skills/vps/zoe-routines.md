# ZOE Autonomous Routines — Creativity & Community Intelligence

These routines should be added to ZOE's HEARTBEAT.md or TASKS.md as recurring tasks. They use the Neynar API (already in ZOE's MCP/tools) and DuckDuckGo MCP for web search.

## Routine 1: Farcaster Ecosystem Scanner (Daily, 8am EST)

**Purpose:** Surface what's trending across Farcaster — not just /dev and /music but broadly. What casts are getting engagement? What did GM Farcaster curate? What's the vibe?

**ZOE Prompt (add to HEARTBEAT.md):**

```
## Daily: Farcaster Ecosystem Scan (8am EST)

Use the Neynar API to scan Farcaster for what's trending and interesting today.

### Steps:
1. Fetch trending casts from the last 24h:
   `GET /v2/farcaster/feed/trending?limit=25&time_window=24h`

2. Fetch curated feed (GM Farcaster / editorial picks):
   `GET /v2/farcaster/feed/channels?channel_ids=gm,farcaster&limit=20`

3. Scan these channels for high-engagement casts (>50 likes or >10 recasts):
   - /music, /dev, /art, /onchain, /design, /ai, /base, /degen, /creators, /build, /nouns, /purple, /zora
   `GET /v2/farcaster/feed/channels?channel_ids=music,dev,art,onchain,design,ai,base,degen,creators,build,nouns,purple,zora&limit=10`

4. Check what ZAO members are casting:
   Fetch recent casts from ZAO admin FIDs (check community.config.ts for the list)
   `GET /v2/farcaster/feed/user/{fid}/casts?limit=5` for each admin FID

5. Summarize findings and send to Zaal on Telegram:

FORMAT:
```
🔭 Farcaster Daily — [date]

TRENDING (top 3 casts by engagement):
• [author]: [summary] (❤️ X, 🔄 Y) — [channel]
• ...

GM FARCASTER PICKS:
• [summary of curated highlights]

CHANNEL PULSE:
/music: [vibe]
/dev: [vibe]  
/art: [vibe]
[other notable channels]

ZAO MEMBERS ACTIVE:
• [member]: [what they cast about]

💡 ZAO RELEVANCE:
[1-2 sentences: anything here that ZAO should build, respond to, or learn from?]
```

Keep under 500 chars for Telegram readability. If lots of activity, link to a longer note in memory/YYYY-MM-DD.md.
```

## Routine 2: Community Voice Collector (Every 12h)

**Purpose:** Listen to what ZAO members are saying on Farcaster. Surface pain points, feature requests, music they're sharing, conversations they're having.

**ZOE Prompt (add to HEARTBEAT.md):**

```
## Twice Daily: Community Voice Check (8am, 8pm EST)

Monitor ZAO community members' Farcaster activity for insights.

### Steps:
1. Get all ZAO member FIDs from the allowlist/community config
   (188 members — check community.config.ts adminFids + the broader member list)

2. For the top 20 most active members, fetch recent casts:
   `GET /v2/farcaster/feed/user/{fid}/casts?limit=10`

3. Look for:
   - Pain points or complaints (about any platform, not just ZAO)
   - Feature requests or wishes ("I wish..." "someone should build...")
   - Music they're sharing or talking about
   - Conversations with other members
   - Mentions of ZAO, The ZAO, ZOUNZ, or related projects
   - Engagement patterns (who's active, who went quiet)

4. Categorize findings:
   - 🎵 MUSIC: tracks/artists members are excited about
   - 🔧 FEATURE IDEAS: things members wish existed
   - 😤 PAIN POINTS: frustrations or friction
   - 💬 CONVERSATIONS: notable member-to-member threads
   - 📊 ACTIVITY: who's most active, any new members casting

5. If anything is urgent or exciting, send Telegram alert immediately.
   Otherwise, append to daily note: memory/YYYY-MM-DD.md

FORMAT for Telegram (only when noteworthy):
```
👂 Community Voice — [date]

[Category emoji] [Finding]
→ [Member name]: "[quote or paraphrase]"
→ ZAO action: [what we could do about it]

[Repeat for top 2-3 findings]
```
```

## Routine 3: Build-in-Public Content Assist (Daily, 6pm EST)

**Purpose:** Draft build-in-public content based on what ZOE can see — ZAO's GitHub activity, community chatter, and Farcaster trends.

**ZOE Prompt (add to HEARTBEAT.md):**

```
## Daily: Content Draft (6pm EST)

Draft 3 build-in-public post options for Zaal to review.

### Steps:
1. Check today's GitHub activity:
   `gh api repos/bettercallzaal/ZAOOS/commits?since=YYYY-MM-DDT00:00:00Z --jq '.[].commit.message'`

2. Check today's merged PRs:
   `gh pr list --repo bettercallzaal/ZAOOS --state merged --search "merged:>YYYY-MM-DD"`

3. Read today's Farcaster scan from memory (if available)

4. Draft 3 post angles (each under 280 chars):
   A) Technical: what shipped, how it works
   B) Community: what members are doing, how ZAO is responding
   C) Vision: connect today's work to the bigger picture (decentralized music label)

5. Send all 3 to Zaal on Telegram for review/selection.

FORMAT:
```
📝 Content Options — [date]

A) 🔧 TECHNICAL:
[draft post]

B) 👥 COMMUNITY:
[draft post]

C) 🔮 VISION:
[draft post]

Pick one (or remix) and I'll help refine. Say "Farcaster" not "Warpcast".
```
```

## Setup Instructions

To deploy these routines to ZOE, use `/vps deploy` with this content added to HEARTBEAT.md. The routines will run on ZOE's heartbeat cycle (currently 60 minutes). For specific timing (8am, 6pm), ZOE checks the current time at each heartbeat and runs the routine if it's within the window.

### Neynar API Requirements
- ZOE needs the Neynar API key available (check if it's in openclaw.json or environment)
- Rate limits: 300 req/min on Growth plan (more than enough for these scans)
- Key endpoints: `/v2/farcaster/feed/trending`, `/v2/farcaster/feed/channels`, `/v2/farcaster/feed/user/{fid}/casts`
