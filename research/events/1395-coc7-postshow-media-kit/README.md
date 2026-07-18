---
topic: events/coc-concertz
type: MEDIA-KIT
status: TEMPLATE — fill actuals from pilot report (Sat Jul 19) before sending
created: 2026-07-18
related-docs: 1256, 1393, 1300, 1390
owner: Zaal (approves) + ZOE (drafts X thread, FC cast from these blocks)
---

# 1395 — COC #7 Post-Show Media Kit (Jul 18, 2026)

> **When to use:** Saturday Jul 19 after running `npx tsx scripts/generate-pilot-report.ts`. Fill the placeholders in brackets. Send the press release block to Hypebot (doc 1388) and Water & Music (doc 1389) editors. Use the fact sheet for grant narrative (Fractured Atlas, Fisher). Use the social block for the X recap thread and Farcaster long-cast.

---

## Fill These First (from Pilot Report + Manual Sources)

| Placeholder | Source | Fill Here |
|-------------|--------|-----------|
| `[PEAK_VIEWERS]` | Firestore `stats/visitors_peak` (pilot report) | ___ |
| `[GALLERY_UPLOADS]` | Firestore `gallery` count (pilot report) | ___ |
| `[ARCHIVE_UPLOADS]` | Supabase `archive_uploads` (pilot report) | ___ |
| `[UNIQUE_WALLETS]` | Supabase `archive_uploads` unique (pilot report) | ___ |
| `[BATTLE_VOTES_1]` | `manage-battle.ts status` — Battle 1 total votes | ___ |
| `[BATTLE_VOTES_2]` | `manage-battle.ts status` — Battle 2 total votes | ___ |
| `[BATTLE_1_WINNER]` | `manage-battle.ts status` — Battle 1 winner name | ___ |
| `[BATTLE_2_WINNER]` | `manage-battle.ts status` — Battle 2 winner name | ___ |
| `[TWITCH_PEAK]` | Twitch Analytics → Stream Summary → Peak viewers | ___ |
| `[SPATIAL_PEAK]` | Spatial admin (if available) — peak room attendees | ___ |
| `[CONTEST_ENTRIES]` | Firestore `contestEntries` count (pilot report) | ___ |
| `[HEADLINE_QUOTE]` | Zaal's post-show quote (write after the show) | ___ |

---

## Block 1: Press Release (fill → send to Hypebot + Water & Music)

```
FOR IMMEDIATE RELEASE — July 19, 2026

THE ZAO RUNS FIRST OPEN-ACCESS VIRTUAL CONCERT WITH LIVE ON-CHAIN VOTING

COC Concertz #7 drew [PEAK_VIEWERS] concurrent viewers and archived [ARCHIVE_UPLOADS]
fan uploads permanently to Arweave — no ticket, no token required.

BROOKLYN / ONLINE — The ZAO, a decentralized music network co-founded by DJ Zaal Panthaki
(BetterCallZaal), completed its seventh virtual concert on July 18, 2026 inside Stilo World
(Spatial.io). For the first time in the series' history, access was completely open: no ZABAL
token, no waitlist, no admission fee.

Key numbers from COC #7: WaveWarZ Takeover:
• [PEAK_VIEWERS] peak concurrent viewers on cocconcertz.com
• [TWITCH_PEAK] peak viewers on Twitch (@bettercallzaal)
• [GALLERY_UPLOADS] fan photos and clips uploaded during the show
• [ARCHIVE_UPLOADS] files permanently archived to Arweave with UDL licenses
• [UNIQUE_WALLETS] unique contributor wallets — all uploads are independently owned IP
• [BATTLE_VOTES_1] + [BATTLE_VOTES_2] live WaveWarZ battle votes from the audience
• Battle results: [BATTLE_1_WINNER] won Battle 1; [BATTLE_2_WINNER] won Battle 2

COC Concertz is a monthly virtual concert series that integrates live music with on-chain
participation tools. Shows are hosted inside Spatial.io's "Dope Stilo Music Club" and
simulcast on Twitch for free. Artists who perform inside the metaverse are the same artists
who compete on WaveWarZ, The ZAO's live music battle platform (1,245+ battles on Solana,
$39K+ total SOL volume as of July 2026).

"[HEADLINE_QUOTE]" — Zaal Panthaki, COC Concertz producer

The fan archive from COC #7 is permanently accessible at cocconcertz.com/archive. Each file
carries a Universal Data License (UDL) preset — ensuring artists and fans retain IP rights
to the media they create, without a label or platform acting as intermediary.

COC #8 is planned for August 2026. Date TBD; see cocconcertz.com.

Media contact: zaalp99@gmail.com
Farcaster: @zaal / @cocconcertz
X: @bettercallzaal
```

---

## Block 2: Grant Fact Sheet (for Fractured Atlas / Fisher narrative)

Use these bullet points in the project narrative sections of grant applications. They are factual, citable, and not puffery.

**What COC Concertz is:**
- Monthly virtual concert series, 7 shows March 2025 – July 2026
- Venue: Spatial.io "Dope Stilo Music Club" + Twitch simulcast
- Free to attend globally; no geographic, financial, or technical barrier
- Co-produced by The ZAO (decentralized music network) and Community of Communities

**Impact numbers from COC #7 (July 18, 2026):**
- `[PEAK_VIEWERS]` concurrent page viewers
- `[ARCHIVE_UPLOADS]` permanent fan media artifacts created, stored on Arweave
- `[UNIQUE_WALLETS]` distinct contributors — each artist/fan retains own IP rights
- WaveWarZ integration: `[BATTLE_VOTES_1 + BATTLE_VOTES_2]` total live audience votes across battles
- First open-access pilot: ZABAL wallet gate removed, widening audience to general public

**Series track record:**
- 7 shows over 16 months with no gap since March 2026 (5 consecutive monthly shows)
- Recurring venue — same Spatial room across all shows; stable community gathering point
- Fan gallery archives from every show are stored permanently on Arweave (UDL license)
- All shows free; artists paid via WaveWarZ battle revenue (1% of every on-chain trade)

**Connection to mission:**
- Artists in COC #7 lineup earned their stage via WaveWarZ battles (community-judged, not label-approved)
- COC #7 pilot removed the ZABAL token requirement — proving the model works for general audiences, not just insiders

---

## Block 3: X Thread (post Saturday, tag artists)

```
Thread: COC #7 recap

1/ Last night was COC Concertz #7: WaveWarZ Takeover.

Here's what happened. 🧵

2/ Numbers from the first open-access COC pilot:
→ [PEAK_VIEWERS] peak viewers on cocconcertz.com
→ [TWITCH_PEAK] peak viewers on Twitch
→ [GALLERY_UPLOADS] fan uploads
→ [ARCHIVE_UPLOADS] files archived to Arweave forever
→ [BATTLE_VOTES_1 + BATTLE_VOTES_2] live battle votes

3/ The WaveWarZ format debuted on COC for the first time.

[BATTLE_1_WINNER] won Battle 1.
[BATTLE_2_WINNER] won Battle 2.

Every vote was live, from the audience, onchain.
No label decided the winner.

4/ Every media file uploaded goes to Arweave with a UDL license.

[ARCHIVE_UPLOADS] permanent artifacts from last night's show.
The artists and fans who created them own them.
Forever.

5/ We're building a show that works without gatekeeping.

7 shows. 16 months. No ticket price. No token required for COC #7.

COC #8 is coming in August. Details soon.

6/ 📸 Archive: cocconcertz.com/archive
🎧 Next show: cocconcertz.com
🪖 Join the ZAO: thezao.xyz

[tag WaveWarZ artists: @wifiiswater @GeEkMyTh_ETH @Cryptogodlui @cannonjones973]
```

---

## Block 4: Farcaster Long-Cast (post Saturday morning)

```
COC #7 recap

[PEAK_VIEWERS] viewers peak on the site.
[TWITCH_PEAK] on Twitch.
[GALLERY_UPLOADS] fan uploads. [ARCHIVE_UPLOADS] on Arweave. [UNIQUE_WALLETS] wallets.

First open-access pilot.
No token required.
The model still works.

WaveWarZ battles ran with live audience votes from inside the concert site.
[BATTLE_1_WINNER] won Battle 1. [BATTLE_2_WINNER] won Battle 2.

7 shows. 16 months.
Monthly since March 2026.

COC #8: August.
Full lineup from the WaveWarZ circuit.

Archive: cocconcertz.com/archive
/cocconcertz
```

---

## Sending Checklist

- [ ] Run pilot report → fill all placeholders above
- [ ] Write Zaal's headline quote (1–2 sentences, honest, not hype)
- [ ] Send press release to Hypebot contact (doc 1388: X DM + email template)
- [ ] Send press release to Water & Music (doc 1389: Cherie Hu pitch)
- [ ] Post X thread (tag artists)
- [ ] Post Farcaster long-cast in /cocconcertz
- [ ] Update Fractured Atlas / Fisher application narratives with final numbers
- [ ] Archive this filled media kit in ZAOOS research (for historical record)
