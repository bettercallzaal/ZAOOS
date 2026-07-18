# 1661 — Africa Battle Week: Artist Recruitment Guide (Sep 22-26, 2026)

**Type:** RECRUITMENT-GUIDE  
**Topic:** ZABAL  
**Status:** START NOW — Africa Battle Week is Sep 22-26. Artist confirmations should be locked by Aug 15 (T-38 days). This doc covers how to find, pitch, and onboard African and diaspora artists for the 5-day WaveWarZ battle series. Owner: Zaal for outreach; ZOE for DM dispatch and onboarding follow-up; ZABAL S2 participants as connectors (regional bridge).

---

## What Africa Battle Week Is

Five days of WaveWarZ battles (Sep 22-26) featuring African and diaspora artists. Day 5 includes a charity battle where 100% of SOL goes on-chain to an Africa-connected arts nonprofit (voted on by ZOR holders, Jul 24-25).

**Why this matters beyond the event:**
- First international expansion of WaveWarZ — press angle for Water & Music, Bankless, Decrypt
- Africa-connected community gets on-chain economic outcomes from music
- "Loser earns" mechanic is especially meaningful in markets where music streaming pays artists near-zero
- ZOR governance voted on matchups — international artists participate in ZAO's governance cadence

**Battle format options:**
- Quick battles: International artist submits a track → battles any WaveWarZ-registered artist
- MAIN battles: ZOR governance vote nominates international artist for featured MAIN

**Target:** ≥5 African/diaspora artists confirmed by Aug 15. At least one MAIN-eligible (ZOR-nominated) by Sep 1.

---

## Artist Profile: Who We're Looking For

**Primary target: Africa-based independent artists**
- Hip-hop, Afrobeats, Afropop, R&B, trap — genres that translate well to battle formats
- Active on Audius OR willing to upload (required for battle track submission)
- Has a Phantom wallet or willing to create one (required to receive SOL payout)
- Producing and releasing music in 2026 (not retired/inactive)

**Secondary target: African diaspora artists**
- Based in US, UK, Europe, Caribbean with African roots
- Connected to African music scenes or culture
- Already in the ZAO/WaveWarZ ecosystem (easier onboarding)

**Existing ZAO artists with African connections (check first):**
- Any ZAO artists from Nigeria, Ghana, Kenya, South Africa, or diaspora — ZOE queries `zao_artists` table for any with African geo tags or handles
- ZABAL S2 applicants from African regions (check Jul 21 - Aug 4 application window)

---

## Recruitment Strategy

### Phase 1: Warm Connections (Jul 21 - Aug 1)

**Step 1: ZABAL S2 applications (open Jul 21)**
ZABAL S2 applications open Jul 21. ZOE adds to the ZABAL S2 application form: "Are you based in Africa or are you an African diaspora artist?" — collect as optional field. Flag applicants who answer yes for Africa Battle Week pipeline.

**Step 2: Existing ZAO community survey**
ZOE posts in Telegram ZAO Public and Farcaster /zao (Jul 23):
```
Calling Africa Battle Week artists.

Do you know an African or diaspora artist who makes music? Africa Battle Week is Sep 22-26 — 5 days of WaveWarZ battles where artists earn SOL on-chain, including the loser.

DM @bettercallzaal or drop a name here.
```

**Step 3: Afri-Love connection (Jul 24)**
Afri-Love is a candidate charity for the Africa Battle Week charity vote. They likely have artist connections. When ZOE contacts Afri-Love about charity wallet setup (doc 1631), ask:
```
"We're also recruiting artists for Africa Battle Week (Sep 22-26). If you know African artists who make music and would be interested in an on-chain battle where they earn SOL — even if they lose — we'd love to connect. Can you share this with your community?"
```

### Phase 2: Direct Outreach (Aug 1 - Aug 15)

**Step 4: ZOE scans WaveWarZ artist history for African-sounding names/handles**
```sql
SELECT display_name, x_handle, audius_handle, total_battles, total_sol_earned
FROM zao_artists
WHERE display_name ILIKE '%atta%' OR display_name ILIKE '%ify%' OR display_name ILIKE '%wale%' 
   OR display_name ILIKE '%amara%' OR display_name ILIKE '%seun%'
-- Expand with other common African name patterns
ORDER BY total_sol_earned DESC;
```

ZOE flags these for Zaal to review — don't assume geography from name alone.

**Step 5: X/Twitter search outreach (Zaal)**
Search terms on X:
- "Afrobeats artist web3"
- "Nigeria music blockchain"
- "Ghana hip-hop NFT"
- "African rapper Audius"
- "Afropop independent artist"

For each relevant artist found, Zaal sends a DM (template below). Goal: 10-15 DMs sent between Aug 1-10.

**Step 6: Farcaster /music and /afrobeats channel search (ZOL)**
ZOL searches for casts in music-adjacent channels that mention African music, Afrobeats, or specific African countries. Flag active users who post music content.

---

## Pitch Templates

### DM for an unknown artist (first contact):

```
Hey [name] — I run ZAO, a music DAO that built WaveWarZ.

WaveWarZ is a prediction market for music battles on Solana. When a battle closes, both artists get paid automatically — including the loser. 1,245 battles settled, $9 SOL to artists so far.

We're running Africa Battle Week Sep 22-26 — 5 days of WaveWarZ battles featuring African and diaspora artists. Battle against a matched opponent, earn SOL win or lose.

All you need: an Audius account and a Phantom wallet. Takes 20 minutes to set up.

Interested? I'd love to have you in for Africa Battle Week.

Zaal
wavewarz.info | @WaveWarZ
```

### DM for an existing ZAO community member with African connections:

```
Hey [name] — I know you're connected to [African music scene / Nigeria / Ghana / etc.].

We're running Africa Battle Week Sep 22-26 — WaveWarZ battles featuring African + diaspora artists. Everyone earns, win or lose.

Do you know artists who would be a good fit? Or want to battle yourself?

Looking for 5+ confirmed artists by Aug 15.
```

### For someone who asks "what's the catch?":

```
No catch. ZAO doesn't take a cut from artist payouts — you receive SOL directly in your Phantom wallet at settlement. The platform earns from the bonding curve spread (fan trading price difference), not from artist payouts.

You'll need:
1. An Audius track to submit as your battle track (free, 20 min to set up)
2. A Phantom wallet to receive SOL (free, 5 min to set up)

That's it. No gas fees for artists. No subscription.
```

---

## Onboarding Confirmed Artists

Once an artist confirms they want to participate:

### Step 1: Audius setup check

ZOE DMs the artist:
```
Welcome to Africa Battle Week!

Before your battle, please:
1. Create an Audius account at audius.co (or send me your handle if you have one)
2. Upload your battle track to Audius (the track you want to battle with)
3. Share your Audius track URL with me

Takes about 20 minutes if you're new to Audius.
```

### Step 2: Phantom wallet setup

If the artist doesn't have a Phantom wallet:
```
You'll need a Phantom wallet to receive your SOL payout.

Phantom wallet (iOS/Android/Chrome extension): phantom.app — takes 5 minutes.

Once created, send me your wallet address (it starts with a number or letter and is about 44 characters long). We'll test it with a small transaction before your battle.
```

### Step 3: Quick battle submission

ZOE sends the quick battle submission link with pre-filled artist info:
```
You're all set!

Submit your Africa Battle Week battle here: [wavewarz.info/submit or relevant URL]

You'll need:
- Your Audius track URL
- Your opponent's Audius track URL (we'll match you if you don't have one)
- Your battle date preference (Sep 22-26)

If you need help finding an opponent, reply here and I'll match you.
```

### Step 4: Confirmation log

ZOE adds confirmed Africa Battle Week artists to Supabase `zao_artists` with tag:
```sql
UPDATE zao_artists 
SET notes = notes || ' | Africa Battle Week Sep 2026'
WHERE display_name = '[artist_name]'
```

ZOE posts to Telegram ZAO Ops after each confirmation:
```
✅ Africa Battle Week artist confirmed: [Artist Name]
Handle: [X or Audius handle]
Battle preference: [day]
Audius track: [URL]
Phantom wallet: [confirmed/pending]
```

---

## Artist Matching Strategy

For quick battles, each Africa Battle Week artist needs a matched opponent.

**Matching options:**
1. **Africa vs. Africa:** Two Africa Battle Week artists battle each other (most thematic, but requires 2+ confirmed)
2. **Africa vs. existing ZAO artist:** Pair Africa Battle Week artist against a ZAO quick battle regular (easier to arrange)
3. **Africa vs. ZABAL S2 artist:** ZABAL S2 Track A artists can volunteer to be opponents

**ZOE matching process:**
```
ZOE: "Hey [existing ZAO artist] — we're running Africa Battle Week Sep 22-26. Want to be a featured opponent against an African artist? You'd still earn your share on-chain."
```

**MAIN battle (Sep 25 featured):**
The Sep 25 MAIN battle (ZAOstock Preview governance session) should feature the highest-profile Africa Battle Week artist vs. a ZAO MAIN circuit artist. ZOR holders vote on the matchup by Sep 1.

---

## Timeline

| Date | Action |
|---|---|
| Jul 21 | ZABAL S2 applications open (flag African applicants) |
| Jul 23 | ZOE posts Africa Battle Week artist callout to Telegram + Farcaster |
| Jul 24 | Contact Afri-Love/charity candidates — ask for artist connections |
| Aug 1 | Zaal begins direct X DM outreach (10-15 DMs) |
| Aug 10 | ZOE follows up with non-responding DMs |
| Aug 15 | **LOCK: ≥5 confirmed artists + all Audius + Phantom confirmed** |
| Sep 1 | ZABAL S2 first session — ask cohort for Africa connectors |
| Sep 1 | ZOR governance vote for Sep 25 MAIN battle artist matchup |
| Sep 10 | ZOE sends pre-event briefing to all confirmed Africa Battle Week artists |
| Sep 22 | Africa Battle Week begins — Day 1 battle |
| Sep 22-26 | 5 days of battles; ZOE posts daily updates |
| Sep 26 | Day 5 charity battle; payout fires; ZOE posts tx hash |

---

## Press Angles (For Water & Music, Mirror Article)

After Africa Battle Week:

**Data to collect:**
- Countries represented (list of artist nationalities/origins)
- Total SOL paid out to Africa Battle Week artists
- Percentage of artists who were new to Web3 (Phantom wallet first created for this event)
- Charity payout TX hash (Sep 26)

**Press angle:**
> "During Africa Battle Week, WaveWarZ ran 5 days of music battles featuring African and diaspora artists on Solana. Artists from [Nigeria, Ghana, Kenya, etc.] received [X] SOL in automatic on-chain payouts — including losing artists. The week closed with a community governance-voted charity payout of [X] SOL to [Charity Name] in [country], fired automatically on-chain with no middleman."

ZOE compiles this stats block Sep 27 and adds to doc 1570 (citable claims).

---

## Related Docs

- 1631 — Africa Battle Week Charity Vote Campaign (ZOR holders vote Jul 24-25 on charity)
- 1616 — Africa Battle Week + ZAOstock Farcaster Coverage Plan (content calendar Sep 22-26)
- 1619 — Fractal Democracy Session Guide (ZOR voting for MAIN battle matchup)
- 1620 — WaveWarZ Quick Battle Onboarding Guide (artist onboarding reference)
- 1626 — ZABAL S2 Curriculum Spec (ZABAL S2 cohort as artist pipeline + connectors)
- 1643 — Africa Battle Week Vote Results Protocol (Sep 26 payout + announcement)
- 1396 — Africa Battle Week Main Brief (parent context doc)
