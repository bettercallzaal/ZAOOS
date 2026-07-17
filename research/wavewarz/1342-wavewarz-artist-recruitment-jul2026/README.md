---
topic: wavewarz/growth
type: STRATEGY
status: ACTIVE
created: 2026-07-17
related-docs: 1275, 1279, 1296, 1302, 1318, 1341
owner: Zaal
---

# 1342 — WaveWarZ Artist Recruitment Strategy (Jul 2026)

> **Distinction from doc 1302 (Artist Onboarding Guide):** Doc 1302 covers what to do AFTER an artist says yes. This doc covers how to find the right artists and get them to say yes in the first place.
>
> **Current state:** 921 unique songs across 1,245 battles. 43-artist verified roster in wwtracker. The pipeline to add new artists is manual and undocumented.
>
> **North Star impact:** distribution 4/10 → 5.0 (new artist audiences), IP catalog 8/10 → 8.5 (more ZAO-affiliated music IP).

---

## Part 1: Ideal Artist Profile (Who to Recruit)

Not every artist is a WaveWarZ fit. The ideal recruit has ALL THREE of:

| Criteria | Why it matters | Signal |
|----------|----------------|--------|
| **Active music producer/artist** | Needs an existing track to battle | Has releases on Audius/SoundCloud/Spotify |
| **Web3-curious or Web3-native** | Needs a Solana wallet to receive payouts | Follows Web3 music accounts, has ENS/Base username |
| **Competitive mindset** | WaveWarZ is a battle — they need to want to win | Active in music communities, posts about craft, responds to challenges |

### Secondary Signals (bonus, not required)
- Already on Audius (track discoverable at battle time)
- ZABAL Games alumni or participant
- Artist based in Maine (ZAOstock local pipeline)
- Has collaborated with existing WaveWarZ roster artists

### Avoid
- Artists who only care about streaming numbers (WaveWarZ is about community voting)
- Artists who are strongly anti-crypto / anti-Web3
- Artists with no existing recorded music (nothing to battle with)

---

## Part 2: Where to Find Them

### Channel 1: Audius (highest conversion rate)
WaveWarZ pulls battle tracks from Audius. Artists already on Audius are pre-qualified.

**Search strategy:**
- Search genres: lo-fi, hip-hop, electronic, R&B, indie (WaveWarZ's strongest genres by battle volume)
- Filter: Tracks with 100-10,000 plays (emerging artists — big artists won't engage cold)
- Look for: Artists who post about "building in public", "new drop", "EP out"
- Command: `curl "https://api.audius.co/v1/users/search?query=<genre-handle>&app_name=wwtracker"` → verify ID before outreach

**Outreach rate:** ~5-10% of cold Audius DMs convert to a first battle (estimate based on current roster)

### Channel 2: ZABAL Games Alumni (hottest leads)
ZABAL builders who make music are the warmest recruits — they already know and trust ZAO.

**Current pipeline:**
- Every ZABAL cohort includes musicians/producers
- ZABAL August Finals (closes Aug 18) will surface the top August builders — check if any make music
- ZABAL Season 2 (Sep-Nov) starts fresh — ask each builder during intro "do you produce music?"

**Expected yield:** 2-3 new artist recruits per ZABAL cohort who also produce music

### Channel 3: Farcaster Music Community
/music and /tunes channels on Farcaster have active music creators.

**Search:**
- `/music` channel on Farcaster: cast artists posting new drops
- `/audiophile`, `/beats`, `/hiphop` — genre channels
- Search for casts containing "new track", "just dropped", "produced by"

**ZOL (Farcaster music scout, FID 3338501):** ZOL (@zolbot) is ZAO's music scout on Farcaster. Use ZOL to surface promising music posts in Farcaster and flag them to Zaal.

**Outreach rate:** ~15-20% Farcaster DMs convert (Web3-native audience, already wallet-capable)

### Channel 4: X / Twitter Music Communities
Artists who post about their music on X.

**Search queries:**
- "new track" + "solana" or "web3"  
- "music NFT" + "independent artist"
- "@wavewarz" mentions (people who already know WaveWarZ but aren't signed up)
- Hashtags: #MusicNFT #IndieArtist #OnchainMusic

**ZOE integration:** ZOE's weekly Tuesday "artist spotlight" posts (TMP-02 from doc 1332) — tag 1 prospective artist each week to get them onto the radar

### Channel 5: Maine Music Scene (ZAOstock pipeline)
Maine-based artists are the highest-value ZAOstock recruits: local attendance, local press angle, easier logistics.

**Sources:**
- Portland Phoenix music listings (maine musicians listed)
- Bowdoin College, Colby College, UMaine student music scenes
- Local bars/venues that host open mics in Ellsworth, Bangor, Portland ME
- Maine Music Awards nominees

**Pitch angle for Maine artists:** "Battle your way onto the ZAOstock stage" — WaveWarZ battle history determines the ZAOstock lineup. This gives Maine artists a concrete goal.

### Channel 6: ZAO Partner Networks
Each WaveWarZ partner brings their own artist communities.

| Partner | Artist pipeline | Action |
|---------|----------------|--------|
| Juke | Audio room artists (Juke /spaces, /live) | Ask Juke team: "Can we invite 3 Juke artists to a WaveWarZ MAIN event?" |
| Magnetiq | IRL event artists (ETH Boulder attendees) | DM Tyler Stambaugh: "Any music-making founders we should invite?" |
| RAM SongChain | African artists (Zambia + regional) | Africa expansion doc 1318: Ram to supply first 3-5 African battlers |
| Empire Builder | ZABAL builder community (some make music) | Cross-check ZABAL roster for music producers |

---

## Part 3: DM Templates

### Template R01 — Cold Audius DM
```
Hey [Artist Name]! Loved [track title] — the [specific thing: beat, lyric, vibe] is exactly what I've been listening to lately.

I'm Zaal from WaveWarZ — we're a music battle platform on Solana where artists battle their tracks and actually earn SOL regardless of who wins (1% of every bet, guaranteed payout).

We've had 921 songs battle, 1,245 battles total. Would you want to enter one? No wallet required upfront — I can walk you through the 2-minute setup.

What do you think?
```

### Template R02 — Farcaster DM (Web3-native)
```
Your [track name] just showed up in my feed via ZOL — it's exactly the kind of track that would do well in a WaveWarZ battle.

We're a Solana music battle platform: artists battle tracks, community bets SOL, winner earns more but loser still collects 1% of volume. 921 songs have battled. 9.09 SOL in guaranteed artist payouts so far.

Want to throw your track in a MAIN event? Takes 10 minutes to set up. wavewarz.info
```

### Template R03 — Maine Artist (ZAOstock angle)
```
Hey [Artist Name]! I saw you perform at [venue/event] and your music has the right energy for what we're building.

WaveWarZ is a music battle platform where 8 artists are selected via on-chain battle history for our first festival — ZAOstock Oct 3 in Ellsworth. The stage goes to artists who compete and win in the battles.

You interested in battling your way to a stage slot? I can explain the full setup if so.

— Zaal (ZAOstock organizer)
```

### Template R04 — ZABAL Alumni Follow-up
```
[Name]! Great to see your [project] in ZABAL — quick question, do you produce music at all?

ZAOstock on Oct 3 in Ellsworth is coming up and we're selecting the 8 artists via WaveWarZ battles. If you have any tracks, you're eligible to compete.

lmk and I'll connect you with the WaveWarZ onboarding doc
```

### Template R05 — Warm Intro (via existing roster artist)
```
[Existing Artist Name] suggested I reach out — they thought your music would be a great match for WaveWarZ.

[use template R01 or R02 from here]
```

---

## Part 4: Recruitment Funnel + Tracking

### Funnel Stages

```
STAGE 0: DISCOVERED — artist found, not contacted
STAGE 1: CONTACTED — DM sent, no reply
STAGE 2: ENGAGED — replied, interested
STAGE 3: ONBOARDED — account set up, track linked
STAGE 4: BATTLE COMPLETE — first battle done
STAGE 5: RECURRING — 3+ battles completed (retained)
```

### ZOE Tracking Protocol

After each outreach:
1. Zaal sends ZOE: "Contacted [name] [platform] [date] [template used]"
2. ZOE logs: Stage 1 → waiting for reply
3. After 7 days without reply: ZOE nudges Zaal "Follow up with [name]?"
4. On reply: ZOE updates stage → Zaal handles personally for onboarding handoff
5. After first battle: ZOE logs Stage 4 → auto-generates "Welcome [name] to WaveWarZ!" post (TMP-02 from doc 1332)

### Weekly Target

| Stage | Target (per week) | Notes |
|-------|------------------|-------|
| Discovered | 10 new artists | Zaal + ZOE scan Audius + Farcaster |
| Contacted | 5 DMs sent | Quality over quantity — personalized only |
| Onboarded | 1 new artist per week | Realistic conversion from 5 contacts |
| Retained (3+ battles) | 1 per month | Depth > breadth |

**From now to ZAOstock Oct 3 (11 weeks):** Target = 10-15 new retained artists on WaveWarZ roster

---

## Part 5: ZAOstock Recruitment Burst

Between Aug 1 and Sep 12, run a focused recruitment campaign targeting the ZAOstock audience:

**"Battle Your Way to ZAOstock" Campaign**
- Tagline: "8 stage slots. Your track vs. the community. Oct 3, Ellsworth ME."
- Channel: @wavewarz X, /zao Farcaster, Instagram @zaostockme (once created per doc 1333)
- Format: Weekly "open challenge" — invite any artist to challenge an existing roster member to a battle
- Stakes: The artist with the best WaveWarZ battle record by Sep 30 earns a ZAOstock slot

**Expected artist applications from campaign:** 20-30 outreach requests → 5-10 new artists onboarded → 2-3 strong ZAOstock qualifier performers

---

## Part 6: Artist Retention After First Battle

Getting an artist to their FIRST battle is the hard part. Keeping them requires:

1. **Personal outreach after battle:** Zaal DMs the artist after their first battle — win or lose — with encouragement and next steps
2. **Payout notification:** ZOE auto-alerts the artist when their SOL payout arrives (1% mechanic)
3. **Leaderboard mention:** TMP-02 (Tuesday artist spotlight, doc 1332) rotates the roster — being mentioned publicly is social proof
4. **Community introduction:** Post artist in /zao Farcaster with their first battle result
5. **ZAOstock connection:** If artist does well in 2+ battles, Zaal flags them as a ZAOstock candidate

**Retention milestone:** Artist who completes 3 battles and receives their payout = high likelihood of staying active

---

## Part 7: North Star Impact

| Action | North Star dimension | Change |
|--------|---------------------|--------|
| 10 new artists onboarded | IP catalog (more ZAO-affiliated music) | 8.0 → 8.3 |
| 5 Maine artists recruited | Distribution (local audience) | 4.0 → 4.5 |
| ZAOstock battle-your-way campaign | Media (press-worthy artist selection process) | 3.5 → 4.0 |
| Partner-sourced artists (Juke/RAM/Empire) | Distribution (new audiences) | 4.5 → 5.0 |
| 10 retained artists (3+ battles each) | Citability (scale = citable) | 8.5 → 8.7 |

**Combined target (11 weeks to ZAOstock):** distribution 4.0 → 5.5

---

*Created: 2026-07-17 | Owner: Zaal | Related: doc 1302 (onboarding), 1275 (artist payout economics), 1279 (competitive landscape), 1318 (Africa expansion), 1341 (MAIN event strategy), 1332 (social calendar TMP-02)*
