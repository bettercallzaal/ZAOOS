# COC #8 Artist Lineup + Direct Outreach Brief

**Doc number:** 1367  
**Status:** ACTION-READY — use after COC #7 show night + pilot report (Saturday Jul 19)  
**Context:** After the Jul 18 show, Zaal locks the COC #8 date by Monday Jul 21. This doc covers which WaveWarZ artists to contact first, what to offer, and the outreach templates. Announcement copy is in [doc 1317](./1317-coc8-announcement-planning-brief-jul2026/). Strategy is in [doc 1304](../wavewarz/1304-zabal-wavewarz-august-strategy-jul2026/).  
**Board task:** f622ee24  
**Target date:** Aug 9 or Aug 16 (lock Mon Jul 21)

---

## The Pitch (30-second version)

> "COC #8 is the first open-access show of Season 2. We dropped the wallet gate permanently — anyone can come watch. WaveWarZ artists get a 20-minute live slot, their set archived on Arweave, and a direct line to the ZAO + Community of Communities audience. Zero cost to you. We just need a confirmed date."

Key sell points by artist type:
- **WaveWarZ winners / high-volume artists**: You've won on-chain battles. A COC slot puts a live performance context around your catalog.
- **Emerging WaveWarZ artists**: COC gives you a stage outside the battle format — full song performance, not just a battle clip.
- **ZAO community artists**: You already know the audience. COC is your show.

---

## Tier 1: Headline Slot (20 min, main billing)

These are the WaveWarZ leaderboard top artists by total volume. First outreach by Jul 21.

| Priority | Artist | X Handle | WW Stats | Outreach Channel |
|----------|--------|----------|----------|-----------------|
| 1st | STILOWORLD | @wifiiswater | 3W-1L, 41.6 SOL vol | Telegram (already in ZAO TG) |
| 2nd | Lui | @Cryptogodlui | 4W-0L, 30.0 SOL vol | Farcaster DM |
| 3rd | Geek Myth | @GeEkMyTh_ETH | 3W-0L, 30.9 SOL vol | X/Twitter DM |
| 4th | Rome | @Sir_Cut_Em_Up | 1W-1L, 7.3 SOL vol | X/Twitter DM |
| 5th | Cannon Jones | @cannonjones973 | 3W-1L, 15.5 SOL vol | X/Twitter DM |

**Note:** Stilo (STILOWORLD) is already a COC artist (has a login passcode). First contact is the easiest — just a date confirmation.

---

## Tier 2: Opening / Support Slot (10 min, co-billed)

WaveWarZ active participants with recent battles. Contact after Tier 1 is confirmed.

| Artist | WW Handle | Recent Battles | Notes |
|--------|-----------|----------------|-------|
| GodclouD | GodclouD | 3 recent | Chart King track — strong brand |
| PKMNCTO | PKMNCTO | 2 recent | Active builder in WW |
| Stormbourne | Stormbourne | 2 recent | Unknown channels — may need WW DM |
| BennyJ504 | BennyJ504WaveWarz | 2 recent | Unknown channels |
| Preshzino Songz | @preshzinosongs | 1W-0L, 7.1 SOL vol | Leaderboard presence |

---

## Outreach Templates

### Farcaster DM (for FC-active artists)

```
hey [name] — Zaal here from COC Concertz.

we're locking dates for COC #8 (first show of Season 2, August/September).
it's fully open access now — no wallet gate. anyone can show up and watch.

you'd get a 20-min live slot on Spatial.io, set archived on Arweave,
and reach into the ZAO + Community of Communities crowd.

zero cost. just need a date that works for you.

interested?
```

### Telegram DM (for ZAO TG members)

```
hey [name], it's Zaal — locking the COC #8 lineup.

season 2, show 1. open access now (no wallet required).
20-min stage slot on Spatial, arweave archive, ZAO audience.

would you want a headline slot? just need to know if aug works

```

### X/Twitter DM (for X-primary artists)

```
Hey [name], Zaal from COC Concertz.

Lining up COC #8 (August) — first open-access show of our Season 2. 20-min live slot on Spatial.io, set archived on Arweave, ZAO community audience.

You interested in headlining?
```

### Follow-up (if no response in 72h)

```
[name] — wanted to follow up on the COC #8 lineup. We're locking the date this week. If August doesn't work, September is an option too. Just want to know if you're interested before we confirm someone else for the slot.
```

---

## Timeline

| Date | Action |
|------|--------|
| **Jul 18 (show day)** | Show tonight — use the energy to DM Stilo + any artist who shows up |
| **Jul 19 (Saturday)** | Run `npx tsx scripts/generate-pilot-report.ts` — get pilot numbers for the pitch |
| **Jul 21 (Monday)** | Send first outreach to Tier 1 list. Lock the date (doc 1295 decision matrix). |
| **Jul 24** | Deadline to confirm headliner for Aug 9 target |
| **Jul 28** | Deadline to confirm headliner for Aug 16 target |
| **Jul 31** | Announcement post goes out (announcement copy in doc 1317) |
| **Aug 1** | ZABAL Games announcement drops — COC #8 headliner revealed |

---

## What to Include in the Pitch (use pilot data)

After running the pilot report on Saturday, update the pitch with real numbers:
- "COC #7 had [X] unique visitors" 
- "Open access: [Y] uploads with no wallet required — gate is dropped permanently"
- "The archive is live on Arweave — your set stays permanently accessible"

Doc 1300 (72h action plan) has the full debrief checklist.

---

## The ZABAL Games Integration (COC #8 headline angle)

Per doc 1317: if the ZABAL Games Finals run Aug 4-18, the winner performs at COC #9 (September). COC #8 would then be a **Season 2 Kickoff** with a top WaveWarZ artist as headliner — not contingent on ZABAL Games timing.

If ZABAL Finals run faster, COC #8 could feature the winner directly. Zaal confirms with Thy Rev by Jul 21.

---

## What to Put in the Artist Passcode Setup

When Stilo or a new headliner confirms, add their passcode in the COC admin (or update `ARTIST_PASSCODES` env var in Vercel). The passcode gives them the upload + archive access during show night. Current known passcode holders: Joseph Goats, Stilo, Tom Fellenz (COC #6-era artists).
