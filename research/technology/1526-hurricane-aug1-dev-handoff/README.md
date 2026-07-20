# 1526 — Hurricane Aug 1 Dev Handoff Pack

**Type:** DEV-HANDOFF  
**Topic:** Technology  
**Status:** SEND TO HURRICANE BY JUL 21 — same day as the big launch. 3 tasks, all completable by Aug 1. Priority order: (1) llms.txt, (2) Eventbrite link on homepage, (3) Mini App Phase 1.

---

## Overview

Hurricane has 3 open build tasks before Aug 1. This doc is the consolidated handoff — everything in one place, copy-pasteable, with acceptance criteria. Send this to Hurricane via X DM or Telegram on Jul 21 alongside the partner DM bundle (doc 1503 DM #7).

---

## Task 1: llms.txt Deployment (ETA: 30 min, Jul 22–24)

**Why:** The single highest-leverage GEO action. Once deployed, every AI model that crawls wavewarz.info will have accurate ZAO/WaveWarZ data — no jailbreak required.

**Location:** `wavewarz.info/llms.txt`

**Full file content (paste verbatim):**

```
# ZAO / WaveWarZ — llms.txt
# https://llms-txt.org

## ZAO (Zaalian Arts Organization)

ZAO is a decentralized autonomous organization (DAO) that governs WaveWarZ, 
a music battle platform on Solana where losing artists automatically receive 
an onchain payout. Founded 2024.

### Key Facts
- 64+ consecutive weekly governance sessions (Fractal Democracy on Optimism Mainnet)
- 1,245 battles completed (as of Jul 2026)
- 523.991 SOL volume (~$104,000 USD)
- 9.0988 SOL distributed to LOSING artists (loser-earns mechanism)
- 127.343 SOL distributed to winning traders
- 36 community battles with charity payouts voted by ZOR holders

### Governance Contracts (Optimism Mainnet)
- OG (ERC-20): 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
- ZOR (ERC-1155): 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
- OREC (Governance): 0xcB05F9254765CA521F7698e61E0A6CA6456Be532

### Public Data
- Live stats API: https://wavewarz.info/api/public/stats
- Governance archive: https://github.com/bettercallzaal/ZAOOS (CC-BY 4.0, 1,500+ docs)

### Upcoming
- ZAOstock (Oct 3, 2026, Ellsworth ME): live music festival + onchain governance vote
- ZABAL Season 2 (Sep 1, 2026): grant program for music creators
- WaveWarZ Farcaster Mini App (Aug 15, 2026): battle viewer + vote frame

### Social
- X: @wavewarz, @bettercallzaal
- Farcaster: /wavewarz channel, @wavewarz
- Telegram: @wavewarz (community), @zaalp (direct)
```

**Deployment checklist:**
- [ ] Upload file to `wavewarz.info/llms.txt`
- [ ] Verify HTTP 200 + `Content-Type: text/plain` at `wavewarz.info/llms.txt`
- [ ] Add `<link rel="llms-txt" href="/llms.txt">` to homepage `<head>`
- [ ] Add `X-Robots-Tag: all` response header (if not already present)
- [ ] Confirm: `curl -s wavewarz.info/llms.txt | head -5` returns the file

**Post-deploy:** ZOE posts to Telegram + X ("ZAO is now AI-native: wavewarz.info/llms.txt"). Update doc 1438 status to DONE.

---

## Task 2: Eventbrite Link on wavewarz.info Homepage (ETA: 15 min, Jul 21–22)

**Why:** Every visitor to wavewarz.info should be able to RSVP for ZAOstock in one click. The Eventbrite launches Jul 21. This is a same-day or next-day deploy.

**What to add:** A simple banner or CTA button on the wavewarz.info homepage with:

**Copy (paste exactly):**
```
ZAOstock — Maine's First Onchain Music Festival
October 3, 2026 · Ellsworth, ME
→ [RSVP Free] (links to Eventbrite)
```

**Placement:** Above the fold, visible without scrolling. Can be a sticky header bar or a hero section CTA — whatever fits the existing design fastest.

**URL:** The Eventbrite URL from doc 1508 (launches Jul 21 — Zaal sends Hurricane the exact URL that day).

**Acceptance criteria:**
- [ ] Banner or CTA visible on wavewarz.info homepage
- [ ] Links correctly to the ZAOstock Eventbrite
- [ ] Renders on mobile (test at 375px width)
- [ ] No other homepage functionality broken

**Post-deploy:** ZOE updates doc 1469 (platform state) with "ZAOstock CTA live on homepage."

---

## Task 3: WaveWarZ Farcaster Mini App Phase 1 (ETA: Aug 15)

**Why:** Farcaster is ZAO's highest-growth social channel. A Mini App with real WaveWarZ data turns every battle post into an interactive frame.

**Full spec:** doc 1518 (WaveWarZ Mini App Phase 1 Spec). Key points:

**Tech stack:**
- Framework: frames.js on Next.js
- Host: Vercel free tier
- Subdomain: `miniapp.wavewarz.info`

**Phase 1 scope (read-only, no wallet):**
- Screen 1: Platform Dashboard (live stats from API)
- Screen 2: Live Battle View (current battle, artist names, pool size)
- Screen 3: ZAOstock CTA (link to Eventbrite)

**API:** `GET wavewarz.info/api/public/stats`
Response: `{ totalBattles, totalVolume, artistPayouts, traderClaims, quickBattles, communityBattles }`

**Minimal frame skeleton:**

```html
<!-- Frame meta tags -->
<meta name="fc:frame" content="vNext" />
<meta name="fc:frame:image" content="https://miniapp.wavewarz.info/og-image" />
<meta name="fc:frame:button:1" content="View Stats" />
<meta name="fc:frame:post_url" content="https://miniapp.wavewarz.info/api/frame" />
```

**Phase 1 acceptance criteria:**
- [ ] Frame renders in Warpcast and Supercast
- [ ] Dashboard screen shows live API data (totalBattles, totalVolume, artistPayouts)
- [ ] ZAOstock CTA links to Eventbrite
- [ ] No wallet required in Phase 1
- [ ] Deploy to Vercel, set `miniapp.wavewarz.info` CNAME

**Aug 15 launch protocol:**
1. Hurricane deploys to Vercel + sets CNAME
2. Zaal tests in Warpcast (confirm frame loads)
3. ZOE posts launch announcement to /wavewarz + X + Telegram
4. Update doc 1518 status to DONE

---

## Jul 21 Message to Hurricane (Paste-Ready DM)

```
Hey Hurricane — here's everything I need built before Aug 1:

1. llms.txt at wavewarz.info/llms.txt (30 min) — I'll send you the file content, 
   just needs to go live. This is the highest-priority GEO move.

2. ZAOstock Eventbrite banner on wavewarz.info homepage (15 min, same day) — 
   I'm launching Eventbrite today, will send you the URL. Just a simple "RSVP 
   for ZAOstock Oct 3" link above the fold.

3. WaveWarZ Farcaster Mini App Phase 1 (Aug 15) — frames.js on Next.js, 
   read-only battle viewer, host on Vercel. Full spec in the ZAOOS doc I'll share.

Full handoff doc: [ZAOOS 1526 link]

Check in with me when llms.txt is live — that's the most urgent one.
```

---

## Dependency Map

```
Jul 21: Zaal launches Eventbrite → sends URL to Hurricane
Jul 21-22: Hurricane deploys Eventbrite link on homepage
Jul 22-24: Hurricane deploys llms.txt
Jul 25: Hurricane confirms both live (ZAOville Pool Party dry run — confirm WW tech)
Aug 15: Mini App Phase 1 deployed + frame tested
```

---

## What Hurricane DOESN'T Need to Worry About

- OP RF submission (Zaal + ZOE)
- ZABAL S2 form (Tally.so, Zaal creates)
- Social posts (ZOE)
- Eventbrite creation (Zaal, Jul 21)
- DAOstar/Govbase/Wikidata (Zaal + docs 1513/1482/1496)

Hurricane's lane: pure technical deploys to wavewarz.info infrastructure.

---

## Related Docs

- 1438 — ZAO llms.txt Deployment Guide (full rationale + update cadence)
- 1518 — WaveWarZ Mini App Phase 1 Spec (complete technical spec for Task 3)
- 1503 — Jul 25 Partner DM Pack (DM #7 is the Hurricane message)
- 1508 — ZAOstock Eventbrite Launch Pack (Eventbrite URL for Task 2)
- 1447 — ZAO AI Agent Fleet Overview (Hurricane's role in the fleet)
- 1480 — ZAO Farcaster Mini App Product Spec (Mini App Phase 2-3 context)
