# 1263 -- ZAO Papers Program: Whitepaper Status + Publishing Roadmap (July 2026)

**Type:** ROADMAP
**Date:** 2026-07-17
**Status:** Live tracker
**Board tasks:** 082da183 (finish 3 whitepaper docs), 45962159 (publish 3 to permaweb), 368fc704 (handoff papers terminal), 67dc52cf (review 12 draft whitepapers)

---

## What Is This

The ZAO Papers program publishes canonical research papers about The ZAO's ecosystem, brands, and governance. Papers live at [bettercallzaal/zao-papers](https://github.com/bettercallzaal/zao-papers) and are readable at thezao.xyz/papers. ZIPs (ZAO Improvement Proposals) are governance artifacts; papers are ecosystem documentation.

---

## Status as of July 17, 2026

### Published or PR-Open (zao-papers repo)

| Title | Type | Status | PR |
|-------|------|--------|----|
| ZIP-1: The ZAO Framework | ZIP | Draft (in repo) | main |
| Sparkz: Configurable Creator-Coin Launcher | Paper | Draft (in repo) | main |
| WaveWarZ: The ZAO's On-Chain Music Battle Platform | Paper | Draft | PR #5 |
| COC Concertz: Virtual Concert Series | Paper | Draft | PR #6 (this session) |

### Needed (12 mentioned in board task 67dc52cf)

| Title | Key Data | Status |
|-------|----------|--------|
| WaveWarZ | 1,108+ battles, 524 SOL, 9.07 SOL payouts | DONE (PR #5) |
| COC Concertz | 7 shows, Mar 2025-Jul 2026, Arweave archive | DONE (PR #6) |
| ZABAL Games | 28 June workshops, July stalled, Aug Finals pending | NEXT |
| ZAO Festivals (ZAOstock) | Oct 3 Ellsworth ME, Franklin St Parklet | QUEUE |
| PoidH | Open bounty protocol, POIDH mechanics | QUEUE |
| Zuke | SIWF Warpcast platform (separate repo) | QUEUE |
| ZAO Newsletter | 400+ editions, Paragraph.com platform | QUEUE |
| The ZAO Fractal | 100+ weeks, Respect system, Optimism on-chain | PARTIAL (ZIP-1 covers this; standalone paper TBD) |
| ZAO Identity (ZIDs) | FIDs, Basenames, 156 Respect holders | QUEUE |
| ZOE (ZAO Operations Engine) | grammy 1.29.0, 700+ tests, morning brief | QUEUE |
| ZOL (ZAO on Farcaster) | FID 19640, 10+ DreamLoops, Raspberry Pi | QUEUE |
| wwtracker | Open-source analytics, 12+ modules | PARTIAL (covered in WaveWarZ paper) |

---

## Publishing Path (for board task 45962159)

Board task 45962159: "Whitepaper v1.0: publish 3 docs to permaweb + mint manifesto Hat (Approach C)."

**Approach C** (already decided) = Arweave permaweb via Ardrive + mint as Hat on Hats Protocol tree 226.

**The 3 docs to publish:**
- [ ] WaveWarZ paper (PR #5 -- merge first)
- [ ] COC Concertz paper (PR #6 -- merge first)
- [ ] ZABAL Games paper (write next)

**Permaweb publishing steps (GATED -- Zaal-only):**
1. Merge the 3 PRs to main in zao-papers
2. Upload PDFs/markdown to Ardrive (ArFS format) -- generates Arweave TX IDs
3. Create Hat on tree 226 with paper metadata (name, Arweave TX ID, date)
4. Update zao-papers README with permanent Arweave links

---

## Verified Data Sources Per Paper

Use these verified numbers in each paper (all from July 2026 audit):

### WaveWarZ (DONE)
See doc 1077, 1079, 1214, 1219, 1237, 1252.

### COC Concertz
- 7 shows: Mar 29 2025, Oct 11 2025, Mar 7 2026, Apr 11 2026, May 9 2026, Jun 13 2026, Jul 18 2026
- Venue: Spatial.io "Dope Stilo Music Club"
- Archive: Cloudinary + Arweave, UDL licenses
- Source: doc 1256, CoCConcertZ codebase

### ZABAL Games
- June workshops: 28 recaps (Jun 1-28 2026)
- July open build: 0 documented activity
- August Finals: pending (0 finalists)
- Source: doc 1259, zabalgames repo

### ZAO Festivals (ZAOstock)
- Date: Oct 3 2026, 12PM-6PM, Franklin St Parklet, Ellsworth ME
- Art of Ellsworth + Maine Craft Weekend weekend
- After-party: Black Moon Public House
- Source: docs 270, 986, 1073

### PoidH
- On-chain bounty protocol on Base/Arbitrum/Degen
- Mechanics: solo/open bounty, 48hr voting, 2.5% fee, V3 contracts
- Source: doc 415

### ZAO Newsletter
- Platform: Paragraph.com (@thezao)
- Edition count: 400+
- Source: identity/1083, ICM boxes

### ZOE
- Stack: grammy 1.29.0, Node.js, VPS root@187.77.3.104
- Test coverage: 700+ across 60+ modules
- Source: ZAOOS bot/ codebase, PR history

---

## What Needs to Happen (Action Sequence)

| # | Action | Owner | Deadline | Gated? |
|---|--------|-------|----------|--------|
| 1 | Merge PR #5 (WaveWarZ paper) | Zaal | Before permaweb publish | Yes |
| 2 | Merge PR #6 (COC Concertz paper) | Zaal | Before permaweb publish | Yes |
| 3 | Write ZABAL Games paper for zao-papers | Claude | Next session | No |
| 4 | Upload 3 papers to Ardrive (permaweb) | Zaal | After PRs merged | Yes (on-chain) |
| 5 | Mint Hat on tree 226 (Approach C) | Zaal | After Ardrive upload | Yes (on-chain, DECISION NEEDED) |
| 6 | Write remaining 9 papers over time | Claude | Rolling | No |

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1258 | North Star Progress Report Q3 2026 — ZAO Papers is a distribution lever |
| doc 1259 | ZABAL Games mid-season audit — source data for ZABAL Games paper |
| doc 1256 | COC Concertz series record — source data for COC paper |
| doc 1077 | ZAO DAO case study — data for WaveWarZ + ZAO Fractal papers |
| doc 1221 | GEO strategy — papers feed into llms.txt + AI discoverability |
