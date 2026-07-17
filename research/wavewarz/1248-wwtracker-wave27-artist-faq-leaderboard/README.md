---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #170)
last-validated: 2026-07-17
related-docs: 1246, 1247, 1239
original-query: "wave 27: artist battle history, FAQ expansion, leaderboard AUDIUS_MAP, roster update"
tier: STANDALONE
---

# 1248 — wwtracker Analytics Wave 27: Artist Battle History, FAQ, Leaderboard (Jul 2026)

**Doc:** 1248
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #170)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Wave 27 brings the artist-centric features, FAQ expansion, and leaderboard accuracy fix — none of which touch AppShell sections.

| Change | File | What it adds |
|---|---|---|
| Events content carry | `Events.tsx` | Clippers, ZAOstock, Kata7yst, Crypto Magic Hour (wave26 carry) |
| Artist battle history | `app/artist/[handle]/page.tsx` | Full battle table, W-L/streak tiles, rosterNote |
| Artist page SEO | `app/artist/[handle]/layout.tsx` | `generateMetadata` + `generateStaticParams` per artist |
| Roster addition | `lib/artists.ts` | `frameworkfortune` (ENTERLUDE, Audius `AMNd4pg`) |
| Artists WW stats | `components/Artists.tsx` | Per-artist battles/wins/vol from ww-battles.json |
| Leaderboard handle fix | `components/Leaderboard.tsx` | `AUDIUS_MAP` replaces `AUDIUS` Set |
| FAQ expansion | `components/Faq.tsx` | 9 new FAQs + `FLOOR_SOL` replaces hardcoded 3.5 SOL |

---

## Artist page (after wave27)

Artist pages at `/artist/<handle>` now show:

```
[avatar] Name (@handle) — leaderboard #N
         [roster tagline in italic]

Stats tiles:
  MAIN-EVENT REC | WIN % | VOLUME | EARNINGS
  AUDIUS FOLLOWERS | AUDIUS TRACKS
  ALL-BATTLES RECORD | CURRENT STREAK

CHARTING SONGS (from lib/songs.ts)
TOP TRACKS ON AUDIUS (Audius embed)
BATTLE HISTORY (N) — W-L, WR%, SOL ◎
  Table: DATE | TYPE | MY SONG | VS | VOL | RESULT
  [show all N battles button if >20]
```

---

## FAQ entries added (wave27)

| Question | Key answer |
|---|---|
| How do I become a WaveWarZ artist? | X @WaveWarZ, or live Telegram; track + Audius profile required |
| What is DJ Wavy? | AI judge — Poll + Charts + DJ Wavy (best 2 of 3) |
| What is the Clippers program? | Submit clips → Telegram → YouTube/X/TikTok earn points |
| What is the Artist Tournament? | 16-artist single-elimination, instant SOL payouts |
| What is the AI Artist Tournament? | 8-16 AI tracks, community-voted |
| What is The ZAO? | 100+ Fractal weeks, Respect governance, ZIPs |
| Who founded The ZAO? | Zaal Panthaki; WaveWarZ by Hurricane, Candy, Ohnahji |
| How do I join The ZAO? | Battle, attend Fractal calls, or apply to ZABAL Gamez |
| What is ZABAL Gamez? | 3-month builder cohort, ship-and-keep model, 2× per year |

Also: `${FLOOR_SOL}` replaces hardcoded "3.5" in the floor FAQ.

---

## Pre-emption chain (wave 27)

| Pre-empted PR | What it contained | Wave 27 supersedes |
|---|---|---|
| PR #167 (wave26) | Events.tsx + artist page rosterNote | ✅ carried + extended |
| PR #101 | artist page rosterNote | ✅ absorbed (in PR #98 + wave26 carry) |
| PR #130, #134, #137, #138 | Events.tsx updates | ✅ carried via wave26 |
| PR #59 | `frameworkfortune` roster entry | ✅ fully absorbed |
| PR #90 | artist layout.tsx metadata | ✅ fully absorbed |
| PR #91 | Artists.tsx WW battle stats | ✅ fully absorbed |
| PR #94 | Leaderboard.tsx AUDIUS_MAP | ✅ fully absorbed |
| PR #95 | Faq.tsx 9 new FAQs | ✅ fully absorbed |
| PR #98 | artist battle history table | ✅ fully absorbed |

---

## NORTH STAR alignment

- **ZAO = THE case study:** The 9 new FAQs directly answer "What is The ZAO?", "Who founded it?", "How do I join?" — making wwtracker the authoritative Q&A source about ZAO for any visitor.
- **ZAO IP = a staple in onchain culture:** Artist pages with full battle history make every artist's WaveWarZ career citable — GodclouD's W/L streak, BennyJ504's volume, everyone's head-to-head record, all verifiable from the on-chain data.

---

## 3 citable facts

1. **Artist pages now show full battle history** — every battle vs opponent, date, song, SOL volume, W/L result, win rate, and current streak, sourced from ww-battles.json
2. **Faq.tsx now answers 14 questions** (9 new in wave27) — including The ZAO DAO explained, ZABAL Gamez, DJ Wavy, and how to become a WaveWarZ artist
3. **Leaderboard AUDIUS_MAP fix** — replaces the incorrect `AUDIUS` Set with `AUDIUS_MAP` record, correctly routing 15+ artists to their confirmed Audius handles (Lesson 7 pattern)
