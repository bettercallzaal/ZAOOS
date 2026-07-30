---
topic: media
type: audit
status: needs-zaal-approval
last-validated: 2026-07-30
related-docs: 2135, 2136
original-query: "Board #45: review/delete the uncertain Downloads recordings"
tier: QUICK
---

# 2141 - Downloads recordings triage (board #45) - 44 files, 15.6 GB, zero deleted

> **Goal:** Make Zaal's #45 review a 5-minute pass instead of a folder crawl. Full inventory scanned 2026-07-30 (find, read-only), triaged into four buckets with a recommendation each. NOTHING was deleted or moved - deletion is destructive and stays Zaal's tap.

## Totals

44 audio/video files directly in ~/Downloads, **15.6 GB**. This is separate from the ~30 GB `~/Movies` preservation risk flagged in docs 2135/2136.

## Bucket 1 - DELETE CANDIDATES, trivial (4 files, ~10 MB)

| File | Why |
|------|-----|
| grok-video-...027.mov + " (1)" + " (2)" | Same 1 MB AI clip downloaded 3 times on 07-29 - keep one at most |
| coc-clip-test.mp4 (7 MB) | A test artifact by name |

## Bucket 2 - PROCESSED ALREADY - recap doc exists (5 files, ~2.5 GB)

The /meeting pipeline captured these; the raw file is redundant IF Zaal does not want the media itself:

| File | Size | Evidence |
|------|------|----------|
| Ohnahji + Zaal strat sesh 07-02 | 798 MB | doc 950 |
| real Empire build sesh x zabal gamez 07-03 | 658 MB | doc 948 |
| Arun x zaal 07-19 | 161 MB | doc 1766 |
| imanxzaalmeeting7.7.26.wav | 291 MB | iman-sync recap series (spot-check the 07-07 one before deleting) |
| jamesconvomwa.mp4 | 538 MB | docs 900/2101 (james) - confirm this is that conversation |

## Bucket 3 - KEEP - ZAO Music submissions + brand assets (10 files, ~250 MB)

The `*_prod_*.wav` stems (Backwoods, Lookout, Flip_The_Switch, TAKE_YOUR_MEDICINE, NEW_GAME, LIT, Ice, FANFO - 8 stems, Jul 25) + `Zabal Gamez ad 2 FIN.mp3` + `aziz&zaalbaraza.wav` (Baraza thread, doc 2029). These are submissions/assets, not clutter - recommendation: move to the music archive location, never delete.

## Bucket 4 - ZAAL'S REVIEW - unprocessed or preservation-relevant (25 files, ~12.8 GB)

- **3 numbered mp4s** (2795944222... 2.2 GB, 2806783177... 769 MB, 2807394589... 739 MB) - Twitch-style VOD ids; per docs 2135/2136 expiring VODs are the preservation risk, so these may be the ones worth KEEPING/archiving, not deleting.
- **Restream/stream VODs:** just-chatting-Jul-14 (1.0 GB), zabal-gamez-coding-w_diviflyy-Jul-08 (730 MB) - content-everywhere repurpose sources.
- **1:1 recordings with NO recap doc found:** William 07-21, Sifat 07-27, Zach l 07-17, Vishnu 07-08 + 07-16, Greg X ZAO 07-01, Jeff (artizen) 07-07, Viniapp brainstorm 06-29, gho-st m-in tops 07-03, chrisdol, nounish (1.2 GB), Rishabh 07-13 - candidates for a /meeting pass BEFORE any delete decision.
- **Craig mixes:** craig-zZU7vHkMbdws (1.6 GB), craig-sVUbGHuoIJIq (600 MB), craig-KX0vU56smGVK (396 MB) - check which meetings they belong to.
- **X Spaces:** 4 space_*.mp4 (06-27 to 07-21) + farcaster-intern-ama.ogg.

## Recommended sequence

1. Zaal deletes Bucket 1 now (10 MB, zero risk).
2. Bucket 3 moves to the music archive (one drag).
3. Bucket 2: confirm each recap covers it, delete or archive the raw.
4. Bucket 4: run /meeting on the no-recap 1:1s worth capturing; archive the VODs per the docs 2135/2136 preservation plan; then delete the rest.

Full size-sorted listing preserved in this doc's source scan (44 rows, du -m).

## Sources

- First-party: read-only find/du scan of ~/Downloads, 2026-07-30 [FULL]
- research/events/ recap index cross-reference (docs 948/950/1766/900/2101) [FULL]
