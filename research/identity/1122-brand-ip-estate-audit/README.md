---
topic: identity
type: audit
status: research-complete
last-validated: 2026-07-15
related-docs: 1107, 1115, 1108, 683, 475, 876
original-query: "audit the brand identity and all the brand assets including code repos pictures videos websites spaces and anything thats IP"
tier: DISPATCH
---

# 1122 - Brand + IP Estate Audit (2026-07)

> **Goal:** One map of everything The ZAO ecosystem owns - media assets, domains, social handles, papers, code, music IP, and legal protection - with the ranked gap list. Two parallel collectors (local asset scan + web/IP sweep) synthesized with docs 1107 (search presence) and 1115 (code estate). Claims the collectors got wrong are corrected here (noted inline).

## Key Decisions (the ranked gap list)

| # | Gap | Fix | Cost | Owner | By When |
|---|-----|-----|------|-------|---------|
| 1 | 64GB of media exists ONLY on the Mac - zero offsite copies. Includes irreplaceable recordings (ZABAL Fireside 2.3GB, COC #6 2.2GB, 7+ Spaces, Craig multitracks). | Tonight: external drive / Time Machine. Then ArDrive/Arweave for permanence. | $0 tonight; ArDrive ~cost of storage | @Zaal | 2026-07-16 |
| 2 | Apex DNS broken on bettercallzaal.com, zlank.online, zaoos.com - all three bare domains point to a dead AWS IP (18.204.152.241) while www works on Vercel. (Collector called this "3 sites down" - wrong; it is stale apex A-records.) | In each DNS provider: apex A -> 76.76.21.21 (or ALIAS cname.vercel-dns.com). | $0, ~5 min/domain | @Zaal | 2026-07-17 |
| 3 | ZERO registered trademarks across all 13 brands. Known collisions: ZAO (Russian band + US restaurant chain), BetterCallZaal (Better Call Saul proximity), Sparkz (crowded), WaveWarZ (Wave Wars variants). Exposure HIGH. | Counsel review + USPTO filings on the core marks (The ZAO, WaveWarZ, ZABAL). Research only - decision with Greg. | $2-5K | @Zaal + Greg | 2026-09-01 |
| 4 | llms.txt missing on all 10 domains; only 2 have JSON-LD. (Collector claimed "overdue TODAY" - wrong; doc 1083 batch-1 target is 2026-07-28.) | Deploy llms.txt per the GEO plan (doc 1016/1083). | Low | @Iman | 2026-07-28 |
| 5 | Handle hygiene: X display name "+Zaal (on farcaster)" hides the brand; YouTube @bettercallzaal invisible vs Better Call Saul; "Wave Warz Zm" misspelling; IG/TikTok bios frozen on 2024; @wavewarsmusic squatting on IG. | The doc 1107 fix list (display name = 30 seconds). | $0 | @Zaal | 2026-07-22 |
| 6 | Brand kits fragmented: best kit is zpoidh/assets/brand-kits/zabal-games (has metadata docs); a 5.6GB exact-duplicate assets dir (zabalgamez vs zabalgames-work) is drift risk; WYAGTDWI partner logos single-copy in ~/Desktop/downloads; NO master kits for The ZAO, WaveWarZ, BCZ. | One brand-kits/ home (zpoidh pattern) per brand; kill the duplicate dir; commit partner logos. | $0, a cleanup pass | @Zaal (approve) + loop (PR) | 2026-08-01 |

## What we own (verified inventory)

### Media + assets (local scan, 2026-07-15)
- ~64GB across ~/Downloads (9GB recordings), ~/Desktop/downloads (41GB archive + editing + logos), ~/Movies (13GB long-form), repo assets (~15GB across zabalgamez/zpoidh dirs).
- Notable: full ZABAL Games brand kit (logo, wordmark SVG, palettes, embed cards, promo audio) - the zpoidh copy is the curated one (README + asset-inventory.md + phrases.md).
- Backup state: Dropbox symlink exists but syncs NO brand assets; no ArDrive folder found; git covers small assets only (video never committed).

### Web estate
- Domains LIVE + canonical: thezao.com (primary), thezao.xyz (app/tracker; 307 should be 301 per doc 1107), wavewarz.info, zabalgamez.com, zaostock.com, cocconcertz.com (redirect).
- Domains broken at apex (gap 2): bettercallzaal.com, zlank.online, zaoos.com.
- Handles secured (13): FC @zaal + 6 channels, X @bettercallzaal/@WaveWarZ/@zaofestivals/@ZABALGamiezOfficial/@POIDH_Music, Paragraph @thezao, 3-4 Telegram groups (500-800 members).
- Handles needing work (16) + squatted (@wavewarsmusic on IG); ZOUNZ has zero presence anywhere.

### Papers + permanence
- ICM boxes: 14 live + owned on useicm.com (keys held at ~/.zao/private/icm-keys.json).
- zao-papers repo + ZIP-1 (genesis framework doc, shipped 2026-07-15) - the canonical framework now has a home.
- Paragraph newsletter (daily), whitepaper draft 4.5 (in repo, no public PDF), Arweave/BazAR configured for music NFTs.
- Gap: papers + brand kits not permanently archived (Arweave) - same fix as gap 1 step 2.

### Music + content IP (the strong suit)
- Artist-first model fully documented + enforced on-chain: artists keep 100% of masters; 90-day revocable participation; 0xSplits 80/10/10; DistroKid no-commission; WaveWarZ pays artists per trade on-chain.
- Gaps: artist participation agreement template not committed to a repo; community-content ownership (Fractal/Space recordings) undefined; Thy Revolution (personal) vs ZAO (institutional) IP split not formalized.

### Code (see doc 1115)
- 97 active repos, audited + mapped 2026-07-15; nothing broken; consolidation plan = doc 1025/1027 estate split.

### Legal entities
- BCZ Strategies LLC (Delaware) live + canonical; WaveWarZ LabZ LLC (Texas) forming; ZAO Music = DBA under BCZ; The ZAO itself intentionally has no entity yet; Colorado A-Corp queued 2027 (doc 876).

## Corrections to collector claims (do not repeat these as fact)
- "3 domains DOWN" -> apex DNS stale, www fine on Vercel (verified via dig + curl 2026-07-15).
- "llms.txt overdue TODAY (2026-08-05)" -> today is 2026-07-15; the doc-1083 target is 2026-07-28. On track, not overdue.
- "ZAOstock GBP overdue 14 days" -> the doc-1107 target for GBP was 2026-08-01; not yet due.

## Next Actions

| Action | Owner | Type | By When | Shipped criteria |
|--------|-------|------|---------|-----------------|
| External-drive backup of ~/Movies + ~/Desktop/downloads + ~/Downloads | @Zaal | Manual | 2026-07-16 | A second copy exists off the Mac |
| Fix apex DNS on the 3 domains (A 76.76.21.21) | @Zaal | Manual | 2026-07-17 | curl https://bettercallzaal.com returns 200/30x |
| Take the trademark question set to Greg (marks, collisions, filing order) | @Zaal | Counsel | 2026-07-25 | Counsel call held; filing decision recorded |
| ArDrive permanence pass (recordings + brand kits + papers) | @Zaal + loop | Build | 2026-08-08 | Assets visible on Arweave; manifest committed |
| Brand-kit consolidation PR (one home per brand, kill duplicate dir, commit partner logos) | loop | PR | 2026-08-01 | PR open; duplicate dir removed; kits under brand-kits/ |
| Commit artist participation agreement template + community-content ownership policy | @Zaal + Greg | Docs | 2026-08-15 | Both committed to zao-papers or ZAOOS |

## Also See
- [Doc 1107] search/handle presence - the SEO fix list. [Doc 1115] code estate. [Doc 1108] Sparkz legal framing (same counsel thread). [Doc 475] ZAO Music entity. [Doc 876] A-Corp philosophy. zao-papers ZIP-1 (the framework on record).

## Sources
- [FULL] Local filesystem scan agent (read-only, 2026-07-15) - counts/sizes verified via find/du.
- [FULL] Web/IP sweep agent (2026-07-15) - domains fetched live, handles cross-checked vs doc 1107; trademark reality from search (USPTO deep search still pending, flagged for counsel).
- [FULL] Apex-DNS verification by the orchestrating session (dig + curl, 2026-07-15) - the corrected diagnosis.
- Verified live: https://thezao.com (200), https://thezao.xyz (200), https://www.bettercallzaal.com (307-Vercel), apex bettercallzaal.com/zlank.online/zaoos.com (dead AWS IP 18.204.152.241).
