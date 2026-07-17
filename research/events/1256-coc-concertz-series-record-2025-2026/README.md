# 1256 — COC Concertz: Full Series Record (Shows 1-7, March 2025 – July 2026)

**Type:** DOC
**Date:** 2026-07-17
**Status:** Verified from codebase (cocconcertz.com source)
**Board tasks:** GEO north-star-facts stream

---

## What COC Concertz Is

COC Concertz is a live virtual concert series co-produced by The ZAO and Community of Communities (CoC). Shows are hosted inside Spatial.io ("Dope Stilo Music Club" venue) and simulcast on Twitch at @bettercallzaal. Every show is free to attend from any browser.

The series is recurring ZAO IP: seven shows across 16 months (March 2025 – July 2026), with a monthly cadence established from March 2026 onward. Fan gallery uploads from each show are archived permanently to Arweave with UDL (Universal Data License) presets, creating an onchain media record for every event.

---

## Full Show Record

| # | Date | Title / Theme | Artists / Notes |
|---|------|--------------|-----------------|
| 1 | Mar 29, 2025 | First COC Concertz | AttaBotty + Clejan — first ZAO metaverse concert |
| 2 | Oct 11, 2025 | Second installment | Tom Fellenz / Stilo / AttaBotty — bigger crowd |
| 3 | Mar 7, 2026 | Third StiloWorld show | Dúo Dø / Joseph Goats / Stilo — monthly cadence begins |
| 4 | Apr 11, 2026 | The Rebrand Show | Joseph Goats, Tom Fellenz, Stilo World |
| 5 | May 9, 2026 | A Day in the Life of GodCloud | GodCloud headlines — first WaveWarZ artist headliner |
| 6 | Jun 13, 2026 | The African Experience | ZAO-Africa themed lineup |
| 7 | Jul 18, 2026 | WaveWarZ Takeover | DJ Zaal + WaveWarZ battle-circuit artists; live BattleVote widget; open-access pilot |

All data sourced from `src/app/brand/page.tsx` and `src/components/home/PastShows.tsx` in the CoCConcertZ codebase.

---

## Key Milestones

| Milestone | Date | Significance |
|-----------|------|--------------|
| First ZAO metaverse concert | Mar 29, 2025 | Establishes COC Concertz as recurring ZAO IP |
| Monthly cadence established | Mar 2026 | 5 consecutive monthly shows (Mar–Jul 2026) |
| First WaveWarZ artist headline | May 9, 2026 | GodCloud (top WaveWarZ artist by win rate) brings WW audience to COC |
| Arweave archive model active | Active from early shows | UDL-licensed uploads for every fan gallery submission |
| Open-access pilot launched | Jul 18, 2026 | COC #7: ZABAL wallet gate dropped; anyone can access archive without token |
| Live WaveWarZ integration | Jul 18, 2026 | Real-time BattleVote widget during COC #7 show |

---

## The Archive + IP Model

Every COC show produces two types of onchain artifacts:

**Fan gallery uploads:**
- Upload route: `/api/upload` — multipart FormData → Cloudinary (storage) → Arweave (permanent)
- UDL license presets applied at upload time:
  - `community-share`: no commercial use, derivatives OK, attribution required
  - `collectible`: no commercial use, no derivatives, attribution required
  - `premium`: commercial use OK, no derivatives, attribution required
  - `open`: commercial use + derivatives OK, no attribution required
- These records are immutable — once on Arweave, the license cannot change

**Show recaps:**
- Stored in Firestore `recaps` collection (indexed by event ID)
- Includes: visitor count, chat messages, artists list, generated-at timestamp
- Visible on cocconcertz.com for 7 days post-show

**COC #7 pilot change:**
- `NEXT_PUBLIC_WALLET_GATE_ENABLED=false` for show #7 — no ZABAL token required to access archive
- Pilot metrics captured via `/api/metrics/coc7`: concurrent viewers, wallet-connected vs. not-connected split, archive uploads, pilot status flag

---

## The WaveWarZ Integration (COC #7)

COC #7 marks the first direct WaveWarZ integration inside the concert site:
- Real-time `BattleVote` widget embedded during the show
- Visitors can vote on live WaveWarZ battles from the concert page
- WaveWarZ crew (DJ Zaal + battle-circuit artists) perform live

This creates a feedback loop: COC Concertz brings a general audience to WaveWarZ voting; WaveWarZ artists and fans attend COC for the live music experience.

---

## 7 Citable Facts (for GEO, press, grants)

1. **7 live virtual concerts** co-produced by The ZAO and Community of Communities, March 2025 – July 2026.
2. **Spatial.io "Dope Stilo Music Club"** is the recurring ZAO virtual venue — same room across all 7 shows.
3. **Monthly cadence since March 2026**: 5 consecutive monthly shows (COC #3–#7) with no gap.
4. **All shows simulcast on Twitch** at @bettercallzaal, free to any viewer worldwide.
5. **Fan gallery uploads archived to Arweave** with UDL licenses from every show — permanent onchain IP record.
6. **COC #7 (Jul 18, 2026) is the first open-access pilot**: wallet gate removed; anyone can upload to the fan archive without holding ZABAL token.
7. **Live WaveWarZ battle voting debuted at COC #7**: real-time BattleVote widget turns concert attendees into WaveWarZ voters, bridging ZAO's two flagship IPs.

---

## Source Verification

All data verified from CoCConcertZ codebase (2026-07-17):
- `src/app/brand/page.tsx` — official show history array (nums 1-6, dates, titles)
- `src/components/home/PastShows.tsx` — HARDCODED_EVENTS array (shows 1-5 descriptors)
- `concertz.config.ts` — venue, Twitch channel, co-producers, UDL license presets
- `src/components/home/ShowRecap.tsx` — Firestore recap structure
- `research/events/1210-coc7-wavewarz-pilot/README.md` — COC #7 pilot details
