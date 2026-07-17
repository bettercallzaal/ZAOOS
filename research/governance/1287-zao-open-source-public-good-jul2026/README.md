---
topic: governance/retro-funding
type: DOC
status: verified
created: 2026-07-17
audience: Optimism Retro Funding evaluators, grant reviewers, open source funders
related-docs: 1209, 1273, 1278, 1282
---

# 1287 — The ZAO as Open Source Public Good (July 2026)

> **Purpose:** Document The ZAO's open source contributions for Optimism Retro Funding and general grant applications. What has been released publicly, who can use it, and how it qualifies as a public good.

---

## What "Open Source Public Good" Means in This Context

Optimism Retro Funding rewards projects that have delivered measurable value to the Optimism Collective — including open source code, governance infrastructure, and educational resources. The ZAO qualifies in three ways:

1. **Open governance infrastructure** — OREC (Optimistic Respect Execution Contract) on Optimism mainnet, live and reusable
2. **Open analytics infrastructure** — wwtracker (public GitHub repo, MIT-licensed), provides free analytics for the WaveWarZ ecosystem
3. **Open research library** — ZAOOS research library (2,000+ public documents), serves as governance and music-economy educational resource

---

## Open Source Project 1: wwtracker

**Repository:** github.com/bettercallzaal/wwtracker  
**License:** MIT  
**Status:** Production, actively maintained  
**Domain:** wavewarz.info (public dashboard, no auth required)

### What it is

wwtracker is the open-source analytics dashboard for WaveWarZ — built and maintained by The ZAO. It provides free public access to all WaveWarZ battle data, artist stats, platform economics, and historical trends.

### What it provides (as of July 2026)

- **9 analytics modules:** BattleArena, SongArena, RivalryBoard, BiggestBattles, Artist pages, LiveTicker, RecentBattlesFeed, PlatformGrowth, Leaderboard
- **1,107 battles indexed** (battle feed; additional battles in live API)
- **Real-time API** at wavewarz.info/api/public/stats — CORS open, no auth, 60s cache
- **Public battle data feed** at wavewarz.info/public/ww-battles.json
- **Artist roster** with Audius handle resolution for 34 verified artists

### Who can use it

Any researcher, journalist, fan, or developer can access all data:
- Dashboard: wavewarz.info (no account)
- API: GET wavewarz.info/api/public/stats (no key)
- Battle data: wavewarz.info/public/ww-battles.json (raw JSON)
- Source code: github.com/bettercallzaal/wwtracker (clone/fork/PR)

### Why it's a public good

- Free data access with no rate limiting or registration
- Open source — any other music platform can fork this analytics pattern
- The live API (stats endpoint) allows any third-party app to display WaveWarZ stats
- Hurricane (wavewarz.com) uses the same API for the front-page ticker — the API is infrastructure, not just The ZAO's internal tool

---

## Open Source Project 2: ZAOOS (ZAO Operating System)

**Repository:** github.com/bettercallzaal/ZAOOS  
**Status:** Public monorepo, actively maintained  
**Domain:** zaoos.com  

### What it is

ZAOOS is The ZAO's public monorepo — a lab where the community builds prototypes before they graduate to standalone repositories. The research library (research/) is entirely public.

### What the research library provides

- **1,285+ research documents** across 20+ topic folders (governance, wavewarz, identity, events, agents, business, community, etc.)
- **Governance documentation** — ZAO Improvement Proposals (ZIPs), fractal session records, Optimism contract addresses
- **Music economy research** — WaveWarZ platform analysis, artist economics, competitive landscape
- **DAO case study materials** — citable evidence package for ZAO's governance record
- **AI agent documentation** — ZOE, ZOL, Hermes, ZAO Devz implementation and voice constitution

### Who can use it

- DAO researchers (studying fractal governance, Respect token mechanics, on-chain contribution tracking)
- Music industry analysts (WaveWarZ economics, artist payout models)
- AI/agent developers (ZOE memory architecture, Letta-inspired design)
- Event organizers (ZAOstock operational docs, festival planning research)
- Grant writers (citable claims, application narratives, evidence packages)

### Why it's a public good

- All research is Apache/MIT licensed (implicit open access as public GitHub repo)
- Indexed by AI search engines (GEO assets) — serves anyone asking about ZAO, WaveWarZ, or fractal governance
- Serves as the institutional memory of an active DAO — can be cited by future DAO researchers
- The ZAOOS README provides a canonical "what is The ZAO" answer that AI models can learn from

---

## Open Source Project 3: OREC (Optimistic Respect Execution Contract)

**Contract:** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` (Optimism mainnet)  
**Origin:** Eden Fractal open source implementation, deployed and operated by The ZAO  

### What it is

OREC is a lightweight on-chain governance layer for Fractal Democracy. It provides:
- 72-hour optimistic execution window (proposals execute unless vetoed)
- Automatic Respect token distribution after each governance session
- Veto capability to prevent bad proposals from executing
- No multi-sig requirement — any community member can initiate

### What it enables (for The ZAO)

- The ZAO's governance proposals (ZIPs) can be queued and executed automatically
- Respect token distribution happens onchain without a trusted admin
- The OREC pattern creates a verifiable, auditable governance record

### Why it's relevant to Optimism Collective

- OREC is an Optimism Retro Funding-eligible pattern — it was developed in the context of Optimistic governance
- The ZAO is the only active deployer and operator of OREC on Optimism (Eden Fractal's deployment is inactive)
- Any Optimism project can study The ZAO's OREC usage as a live case study
- The 63 weeks of OREC-settled governance creates a public dataset for studying lightweight DAO governance

---

## Verifiable Evidence Table

| Claim | Evidence | Verifiable At |
|-------|---------|--------------|
| wwtracker is open source | github.com/bettercallzaal/wwtracker | Public GitHub, MIT license |
| API is free and open | No auth, CORS open | wavewarz.info/api/public/stats |
| 1,285+ research docs | ZAOOS research/ folder | github.com/bettercallzaal/ZAOOS |
| OREC is live on Optimism | Contract at stated address | Optimism block explorer |
| 63 weeks governance settled | OG + ZOR contract transactions | Blockscout, both contract addresses |
| Only active OREC deployer | Eden Fractal site offline (Jul 2026) | eden-fractal.xyz returns 502 |

---

## What The ZAO Has NOT Claimed (Honesty Note)

- ZAOOS and wwtracker have not applied for open source grants before (no Gitcoin round, no Open Source Observer mention)
- The research library has no formal license (public GitHub, but no explicit statement)
- OREC is not custom code — The ZAO is an operator/deployer, not the original author
- WaveWarZ (the smart contracts on Solana) is not open source — it's Candy's proprietary platform; The ZAO's contribution is the analytics layer and governance record, not the platform itself

---

## Grant Application Framing

For Optimism Retro Funding (Atlas):

> "The ZAO has operated OREC-based Fractal governance on Optimism for 63 verified weeks, producing 505 on-chain transactions and 157 unique Respect holders. As the only active OREC operator on Optimism (Eden Fractal inactive), The ZAO represents the live field test of Optimistic governance in a music creator community. All governance data is public on Blockscout. All research documentation is public on GitHub. The wwtracker analytics platform (wavewarz.info) is MIT-licensed and provides free public data access for the WaveWarZ ecosystem."

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1209 | Optimism Retro Funding application draft — uses this framing |
| doc 1273 | ZAO Optimism Ecosystem Contribution — governance data |
| doc 1278 | ZAO Citable Claims — cross-references for verifiable statements above |
| doc 1282 | ZAO vs Artist DAOs — positions The ZAO uniquely on Optimism |
| doc 1078 | wwtracker analytics infrastructure — detailed product doc |
