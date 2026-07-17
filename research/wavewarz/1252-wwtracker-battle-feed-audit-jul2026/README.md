# 1252 — WaveWarZ Battle Feed Data Quality Audit + July 2026 Weekly Peak

**Type:** STANDALONE  
**Date:** 2026-07-17  
**Status:** Verified — data from public/ww-battles.json (1,108 battles) + wavewarz.info/api/public/stats

---

## Summary

A parser bug in wwtracker's battle-intelligence scraper (PR #175, fixed 2026-07-17) caused battles where an artist name contains a literal double-quote character to be silently dropped from `public/ww-battles.json`. The fix surfaced 19 previously-missing battles and revealed that the week of **Jul 10–17, 2026 was the highest-recorded weekly battle volume in WaveWarZ history at 42 battles / 9.45 SOL**.

---

## The Bug

**Component:** `scripts/recap/battle-parser.ts` — `unescapeFlight()` function  
**Root cause:** React Server Components embed battle data in an HTML flight payload where string delimiters are encoded as `\"` (backslash + quote). When an artist name itself contains a literal `"` (e.g. `GodclouD ft Oly "Luchador"`), the encoding produces `\\\"` (3 backslashes + quote) in the raw HTML. A single-pass `replace(/\\"/g, '"')` reduces this to `\\"` — which JSON.parse interprets as a backslash followed by a string-terminator, throwing a parse error. That battle was then silently skipped.

**Fix:** Two passes of the same replacement. After pass 1: `\\\"` → `\\"`. After pass 2: `\\"` → `\"` — a valid JSON escape for a literal `"` inside a string value.

**Affected battle:** #1784164533 — `GodclouD ft Oly "Luchador"` vs `Molly Lucy Mary J` — Jul 16, 2026 — **1.8694 SOL** volume.

This was the highest-volume quick battle of the week and was invisible to all analytics until the fix. Any analytics from 2026-05-28 through 2026-07-16 that relied on the battles feed would also miss any other battles with embedded quotes in artist names.

---

## Impact: Battles Discovered

| # before fix | # after fix | Delta |
|---|---|---|
| 1,089 | 1,108 | +19 |

The 19 new battles span Jul 15–17, 2026. One (the Luchador battle) was due to the parser fix. The other 18 were new battles from the intelligence feed that had posted after the last fetch.

---

## July 2026 Weekly Peak: Jul 10–17

| Metric | Value |
|---|---|
| Battles | 42 |
| Total volume | 9.4502 SOL (~$711 at $75.29) |
| Battle types | All QUICK battles |
| Active days | 6 of 7 (Jul 10, 11, 14, 15, 16, 17) |
| Busiest day | Jul 11 (10 battles) |
| Top battle | GodclouD ft Oly "Luchador" vs Molly Lucy Mary J — 1.8694 SOL (Jul 16) |
| Closest battle | Easy To Love vs Hypnotic — 4% margin (Jul 17) |
| Most active artist | GodclouD (9 battles), _0xQuan (8), BennyJ504WaveWarz (7) |

**Significance:** 42 battles / 9.45 SOL in 7 days = average of 6 battles per day and 1.35 SOL/day. At $75.29/SOL, this translates to ~$102/day in trading volume during the week.

---

## GodclouD Artist Record (as of 2026-07-17)

| Metric | Value |
|---|---|
| Handle-tagged battles | 24 |
| Wins | 17 |
| Losses | 7 |
| Win rate | 70.8% |
| Total volume generated | 11.1145 SOL |

GodclouD is the most-tracked artist in the WaveWarZ battle feed — they featured in 9 of the 42 battles during the July 10–17 week. Their songs span aliases/collaborations including Cannon Jones973 songs and the "Luchador" collab.

---

## Platform Stats (2026-07-17T17:15Z)

| Metric | Value |
|---|---|
| Total battles | 1,245 |
| Total volume | 524.15 SOL (~$39,453 at $75.29) |
| Quick battles | 1,047 |
| Main event battles | 50 (across 162 multi-round bouts) |
| Community battles | 36 |
| Artist payouts | 9.07 SOL (~$683) |
| Platform revenue | 17.44 SOL (~$1,313) |
| Trader claims (claimShares) | 127.34 SOL (~$9,588) — 939 withdrawals |

---

## 4 Citable Facts

1. **42 battles / 9.45 SOL in Jul 10–17, 2026** — the highest-recorded weekly volume in WaveWarZ history (verified from 1,108 parsed battles).
2. **Parser bug discovered Jul 17, 2026** — battles with embedded `"` in artist names were silently dropped; the fix surfaced a 1.87 SOL battle that had been invisible for 24+ hours.
3. **GodclouD: 24 tagged battles, 70.8% win rate, 11.11 SOL volume** — leading artist by battle frequency and volume in the wwtracker feed.
4. **WaveWarZ platform total: 1,245 battles / 524.15 SOL / $39,453 all-time volume** as of 2026-07-17.

---

## Related Docs

- [1079](../1079-wavewarz-battle-intelligence-layer/) — original battle intelligence layer
- [1211](../1211-wavewarz-artist-economy-jul2026/) — per-artist earnings estimate
- [1078](../1078-wwtracker-analytics-infrastructure/) — wwtracker analytics infrastructure
- [974](../974-wavewarz-financials-snapshot-2026-07/) — financial snapshot

## Related PRs

- wwtracker PR #175: battle parser fix + 19 new battles + stats refresh
- wwtracker PR #164: weekly recap 2026-07-17 (corrected)
