# 1458 — COC #8 Show Brief

**Type:** SHOW-BRIEF  
**Status:** FILL BRACKETS on Jul 21 after date announcement; then ZOE-executable  
**Related:** 1284 (COC #7 show brief), 1451 (COC #8 artist recruitment), 1371 (COC live social playbook), 1395 (COC media kit reusable), 1398 (S2 arc brief)

---

## Fill Order (Jul 21 after date announcement)

1. ZOE fills `[COC8 DATE]` and `[COC8 TIME]` from doc 1428 gate decision
2. Zaal fills `[ARTIST A]` and `[ARTIST B]` after recruitment (doc 1451, locked by Jul 23)
3. ZOE fills `[BATTLE VOTE LINK]` after Hurricane creates the WaveWarZ battle (Jul 24-27)
4. ZOE fills `[SPATIAL LINK]` / venue URL from COC playbook
5. Remaining brackets (viewers, stats) filled live during show

---

## Quick Reference Card (Print + carry on show day)

| Item | Value |
|------|-------|
| Show date | **[COC8 DATE]** |
| Show time | **[COC8 TIME] EST** |
| Show link | **[SPATIAL LINK or TWITCH LINK]** |
| Artist A | **[ARTIST A]** |
| Artist B | **[ARTIST B]** |
| Battle vote link | **[BATTLE VOTE LINK]** |
| Admin link | **[ADMIN PANEL LINK]** |
| Metrics API | `wavewarz.info/api/metrics/coc8` |
| COC run | **Season 2, Show #8 — 8 consecutive months** |

---

## Pre-Show Checklist (Zaal + ZOE, T-24h)

- [ ] Both artists confirmed + tracks uploaded to Arweave (doc 1451 submission checklist)
- [ ] WaveWarZ battle created in admin; battle ID logged
- [ ] [SPATIAL LINK] or venue tested: stream running, audio/video OK
- [ ] Cloudinary key set (env var confirmed with Hurricane)
- [ ] Wallet gate: open-access confirmed (pilot mode from COC #7)
- [ ] ZOE: T-24h social posts scheduled (doc 1371 templates)
- [ ] ZOE: T-30min countdown post scheduled
- [ ] Guest list / artist DMs confirmed for show time

---

## Zaal's Opening Remarks (Paste + Deliver Live)

```
Welcome to COC #8 — Chain of Custody.

This is our 8th consecutive month doing this. 8 shows in a row. No missed months.

For those new: Chain of Custody is a monthly music battle hosted by The ZAO on [SPATIAL/TWITCH LINK]. Two artists submit an original track. You — the community — vote on WaveWarZ. And here's the part that's different from every other battle: the artist who loses still earns from the losing pool.

We believe every piece of music has value. Winning or losing doesn't change that.

Tonight's battle: [ARTIST A] versus [ARTIST B].

Both tracks are live in Arweave — permanent, onchain, yours forever. The vote is live on WaveWarZ. You can bet on the outcome with SOL, and whatever happens, both artists earn.

Vote link: [BATTLE VOTE LINK]

Let's go.
```

---

## WaveWarZ Stats to Name-Drop During Show

Pull live from `wavewarz.info/api/public/stats`:

- "WaveWarZ has completed **[X] battles** total — we're doing battle **[N]** tonight"
- "**[SOL] SOL** has moved through this platform since launch"
- "Losing artists have collectively earned **[SOL] SOL** — that's the whole point"
- "Tonight, both [ARTIST A] and [ARTIST B] earn something regardless of how the community votes"

---

## COC Series Stats to Name-Drop

- "8 consecutive months. 0 missed shows. That's the ZAO."
- "Every COC track is on Arweave. Permanent. CC-BY. Open source forever."
- "COC is proof: you can run a consistent creative institution as a DAO."

---

## WaveWarZ Battle Control Commands

```
# Create battle (Hurricane runs before show, or use admin panel):
POST /api/battles/create
{ "artist1": "[ARTIST A NAME]", "artist2": "[ARTIST B NAME]", "trackA": "[ARWEAVE TX A]", "trackB": "[ARWEAVE TX B]" }

# Check battle status during show:
GET /api/battles/[BATTLE ID]/status

# Close battle (run at show end):
POST /api/battles/[BATTLE ID]/close
```

**Fallback if admin panel down:** Contact Hurricane via Telegram. Do NOT close battle manually.

---

## Show Structure

| Time | What |
|------|------|
| T-30 min | ZOE countdown post across all channels |
| [COC8 TIME] | Show starts; Zaal opening remarks |
| T+5 min | Drop battle vote link live; announce both artists |
| T+10 min | Play [ARTIST A] track (or stream) |
| T+15 min | Play [ARTIST B] track (or stream) |
| T+20 min | Live community voting begins; Zaal engages chat |
| T+30 min | Check live vote count; share stats |
| T+45 min | ZAOstock announcement from stage: "we're bringing COC to Ellsworth, Maine on October 3" |
| T+50 min | Close vote; announce result |
| T+55 min | Winner + loser earnings announced; both thanked |
| T+60 min | Zaal closing remarks; ZAOstock ticket pitch |
| T+65 min | Show ends; ZOE wrap post immediately |

---

## ZAOstock Announcement Script (T+45 min)

```
Before we close out tonight — I want to share something.

COC #9 and #10 are coming. And on October 3, 2026, The ZAO is bringing Chain of Custody to a live outdoor stage in Ellsworth, Maine.

It's called ZAOstock. Free to attend. First-ever live WaveWarZ battle on a public stage. 

Tickets are live now at [Eventbrite URL]. General admission is free. If you want to support, there are paid tiers.

ZAOstock. October 3. Ellsworth, Maine. Bring someone who doesn't know what a DAO is. That's the whole point.
```

---

## Post-Show ZOE Tasks (T+5 min after close)

```
ZOE TASK COC #8 POST-SHOW:
1. Fetch final vote count from /api/battles/[BATTLE ID]/result
2. Calculate artist earnings (loser pool × 1.73%)
3. Post wrap message on X (@bettercallzaal + @wavewarz), Farcaster, Telegram, Discord
   Template: "COC #8 done. [ARTIST WINNER] won, [ARTIST LOSER] earned [X] SOL. [N] live viewers. [N] battle votes. Next: COC #9 [date]."
4. DM both artists their earnings amount + on-chain transaction link
5. Update ZAOOS COC series record (doc 1256) with COC #8 actuals
6. Begin Arweave archive protocol for both tracks
7. Log COC #8 in session count + cite in next governance session
```

---

## Social Templates (ZOE pre-loads Jul 21+)

### T-24h Post (X, scheduled)
```
tomorrow: COC #8

[ARTIST A] vs [ARTIST B]
[COC8 DATE] · [COC8 TIME] EST · [SPATIAL/TWITCH LINK]

both artists earn
community votes on WaveWarZ

free to watch
```

### T-30min Post (X + Farcaster)
```
30 min until COC #8

[ARTIST A] vs [ARTIST B]
vote on WaveWarZ: [BATTLE VOTE LINK]

see you in [SPATIAL/TWITCH LINK]
```

### Post-Show Result (X)
```
COC #8: [ARTIST WINNER] wins

[ARTIST LOSER] earned [X] ◎ for losing

[N] community votes cast
[N] live viewers

COC run continues. 8 months, 0 missed shows.

COC #9: [date if confirmed]
```

### Post-Show Result (Farcaster /cocconcertz)
```
COC #8 result: [ARTIST WINNER] wins — [ARTIST LOSER] earns [X] ◎

The part people don't expect: the loser still gets paid.

That's the ZAO model. Every artist has value. Every track matters.

8 shows in a row. COC continues.

ZAOstock Oct 3 — live battle on a public stage. [Eventbrite URL]
```

---

## Metrics to Capture During Show (ZOE monitors)

From `wavewarz.info/api/metrics/coc8`:
- Peak concurrent viewers (Twitch + Spatial)
- Gallery uploads
- Battle vote count at T+30 and T+50
- Total SOL in battle pool at close

Fallback (if API not available): Screenshot Twitch/Spatial viewer count manually at peak.

---

## Post-Show Pilot Gate (for COC #9 date decision)

From COC #7 pilot framework (doc 1393), COC #8 determines COC #9 date:
- GREAT (>30 viewers, >10 gallery, >20 votes): COC #9 4-6 weeks out
- GREEN (>15 viewers, >5 gallery, >10 votes): COC #9 4-6 weeks out, note stable trajectory
- YELLOW (<15 viewers): COC #9 6-8 weeks — review format before announcing
- RED (<8 viewers): Restructure before COC #9

ZOE: Run pilot gate within 48h of COC #8. DM Zaal the result in Telegram.

---

## North Star Impact

- **IP catalog +0.1**: 2 new Arweave-archived CC-BY tracks
- **Citability +0.1**: 8 consecutive COC shows = citable series record
- **Distribution +0.1**: show night = peak engagement moment for all channels
- **Events +0.1**: COC #8 = 1 step closer to ZAOstock stage show
