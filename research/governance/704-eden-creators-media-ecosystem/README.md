---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 103, 104, 106, 109, 306, 498, 664, 702, 703
original-query: "research the Eden Creators Notion (edencreators.notion.site) - the Eden Fractal media and content ecosystem"
tier: STANDARD
---

# 704 - Eden Creators: The Eden Fractal Media Studio and Content Garden

> **Goal:** Document Eden Creators - the media and content arm of the Eden Fractal ecosystem - what it is, what it publishes, the "Garden" knowledge hub, and the practical fetch path for getting at its content.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Treat Eden Creators as a distinct third entity in the fractal ecosystem - separate from Eden Fractal (the governance community) and Optimystics (the dev team) | Eden Creators is the media/outreach studio; conflating it with Eden Fractal loses the distinction |
| For any automated fetch, use `edencreators.com`, NEVER `edencreators.notion.site` | The notion.site subdomain is a pure JavaScript shell - no fetch tool can render it (see Fetch Notes). The custom domain `edencreators.com` serves the same Notion content and renders cleanly |
| Flag the Eden Fractal schedule as UNRESOLVED - sources disagree on day, time, and cadence | edencreators.com/events and edenfractal.com/respectgame give conflicting schedules (see Findings 4). Do not assert one until verified with Eden directly |
| Update docs that cite Eden Fractal at "130+ events" - the video series is at EF 138+ as of spring 2026 | edenfractal.com/videos and edencreators.com confirm EF 138; "130+" is a stale floor |
| Mine the Eden Creators "Garden" before doing fresh fractal-ecosystem research | The Garden is a 200+ resource hub covering the entire fractal / Optimism / governance space - much faster than open-web search |

## 1. What Eden Creators Is

Eden Creators is, in its own words, "a media studio dedicated to raising awareness about the benefits of fractal consensus processes, developing prosocial games, and growing communities."

It is the media and outreach arm of the Eden Fractal ecosystem. The ecosystem now has three distinguishable entities:

| Entity | Role |
|--------|------|
| **Eden Fractal** | The governance community - runs the Respect Game, the live coordination practice |
| **Optimystics** | The dev team (Tadas / sim31, Dan SingJoy, others) - builds ORDAO, OREC, orclient, frapps, Fractalgram |
| **Eden Creators** | The media studio - 300+ videos, ~12 shows since 2021, weekly gameshow events, the Garden knowledge hub |

Eden Creators has produced over 300 videos and roughly a dozen shows documenting collaborative governance since 2021. It frames its mission as raising awareness of fractal consensus, developing prosocial games, and growing communities.

## 2. Web Presence

| Surface | URL | Notes |
|---------|-----|-------|
| Main site | `edencreators.com` | Custom domain fronting a Notion workspace. Renders to fetch tools. Use this. |
| Notion workspace | `edencreators.notion.site` | Same content, raw Notion subdomain. Pure JS shell - unfetchable by automated tools. |
| YouTube | `youtube.com/@EdenCreators` | 300+ videos. Previously cited in ZAO docs as "Eden Creators YouTube" / `@Optimystics_` |
| X | `x.com/@EdenCreators_` | |
| Events calendar | `lu.ma/edencreators` | RSVP hub for Eden Fractal + Optimism Fractal events |
| Telegram | linked from edencreators.com | |

Site navigation: **Videos | Events | Garden | Websites**. The site also exposes a "site database" of community stories, draft pages, and show notes.

## 3. The Garden - a 200+ resource knowledge hub

The Garden is described as "a blog, but more lively, iterative, and fractal" - it showcases projects, initiatives, and communities in development, with 200+ linked resources. It is effectively a map of the entire fractal / Optimism / governance space and is worth mining before any fresh open-web fractal research.

Garden topic clusters:

| Cluster | Items |
|---------|-------|
| Games & gamification | Fractal DJ, Consensus Games, Decentralizing Governance with Games, Speeches |
| Tools & infrastructure | Cignals, Consortium, Firmament, Eden Smart Proxy, Eden Research, Eden Talk, Notion |
| Community coordination | Cagendas, Vlalendas, Agendas, Ideathons, Pitch Sessions, Open Mic Night |
| Movies & media | DAMS (Decentralized Autonomous Movie Studios), Creator Talk, Shows, YouTube |
| Governance | Fractal Forums, Consensus, Interim, MSIG, Code of Conduct, Elections |
| Blockchain | EOS, Antelope, EVM, Layer 2, Optimism, Base, Zora, Mantle, Alien Worlds |
| Funding & public goods | Pomelo, Funding Fractals, RetroPGF, Allo Protocol, Endaoment |
| Philosophy & vision | Eden's Mission, Independence, Renaissance, Extropianism, Infinite Games, Arc |
| Communities | Genesis Fractal, Optimism Fractal, Spanish Speaking Fractal, FAA Art Fractal, Roy Fractal |

### Garden tools and concepts (researched 2026-05-21)

Detail on the Garden items not previously documented in the ZAO library:

| Item | What it is | Status / note |
|------|------------|---------------|
| **Consortium** | A voting application for communities to make decisions, signal opinions, and measure consensus | Garden tool; overlaps with ORDAO/OREC voting |
| **Cagendas** | A social coordination game for creating agendas, choosing discussion topics, and making decisions together | Garden tool; the most directly reusable for ZAO |
| **Vlalendas** | A Cagendas variant - helps communities create agendas, allocate time, and choose discussion topics | Garden tool |
| **Eden Smart Proxy** | A smart contract enabling governance functionality for the `eden.fractal` account, to facilitate community meetings | Garden tool |
| **Firmament** | A system for fractal cooperation, consensus games, and independent community computing on Git + IPFS | INACTIVE - developed for months, now dormant |
| **DAMS** | Decentralized Autonomous Movie Studios - a model for communities to collaborate on videos | Concept / initiative |
| **Eden Research** | A networked-thought note-taking tool (lineage of Roam Research, Athens, Obsidian, logseq), EOS-rooted | Garden tool |
| **Eden Talk** | A Web3 community forum for Eden, EOS, fractal cooperation, and creative collaboration | Garden tool |
| **Creator Talk** | A community forum and show for creators to discuss collaborative projects | Garden tool / show |

The `Cagendas` / `Vlalendas` agenda games are the most directly reusable for ZAO - a lightweight way to run agenda-setting and topic prioritization, adjacent to the Respect Game. `Consortium` overlaps with ORDAO/OREC voting. `Firmament` is dormant. See doc 109 for the production Optimystics tooling (ORDAO, orclient, frapps, Fractalgram, Cignals).

## 4. Video shows + the schedule conflict

Eden Creators runs 10+ video series:

- Eden Fractal (the flagship - EF 1 through EF 138+ as of spring 2026, recent episodes EF 135 "Fractal Governance Awakening", EF 136 "Seeds of Consensus", EF 137 "Root Networks", EF 138 "Planting Seeds Before Spring Break")
- Eden Town Hall, Genesis Fractal, Hot Sauce, Alien Worlds Fractal, Intro to Alien Worlds, Fractally on EOS Brainstorming Sessions, Intro to Eden & Fractally, Eden Creators Originals, World Talent Economy Forum
- Plus Fireside Chats with Daniel Larimer and Chief Delegate Meetings

**The Eden Fractal video count reaches EF 138+** - this corrects ZAO docs that cite Eden at "130+ events".

### UNRESOLVED: Eden Fractal schedule conflict

Two Eden-controlled pages give contradicting schedules for the Eden Fractal Respect Game:

| Source | Day | Time | Cadence |
|--------|-----|------|---------|
| `edencreators.com/events` | Wednesday | 16:00 UTC | Weekly |
| `edenfractal.com/respectgame` | Thursday | 17:00 UTC | Biweekly ("biweekly events on Thursdays at 17 UTC") |

The `edencreators.com/events` page also still lists Optimism Fractal as an active Thursday 17:00 UTC event, even though Optimism Fractal paused in January 2026 - so that events page may carry stale entries. ZAO research docs 103 / 106 / 306 / 698 currently describe Eden Fractal as biweekly. This conflict is not resolvable from public sources alone and should be confirmed with Eden Fractal directly (Zaal is in contact with Dan SingJoy and Tadas). Do not assert a single schedule until then.

## 5. Fetch Notes (how to get at this content)

`edencreators.notion.site` defeated the full fetch ladder on 2026-05-21:

- WebFetch - returned an empty shell (only the word "Notion")
- exa web_fetch - rate-limited (free MCP tier exhausted)
- Playwright MCP - the browser-bridge extension is not installed in this environment
- Wayback Machine - has a 2025-04-09 snapshot, but it only captured the generic Notion shell, not the rendered workspace
- Notion API (`getPublicPageData`) - returned a 502 "Cross-cell memcached" error

The working path: `edencreators.com` is the same Notion workspace published on a custom domain, and it DOES render to WebFetch. Crawl `edencreators.com` and its sub-paths (`/garden`, `/events`, `/videos`) instead of the notion.site subdomain. This is the general pattern - when a `*.notion.site` page is needed, check for a custom-domain mirror first.

## Also See

- [Doc 106](../../community/106-dan-singjoy-eden-fractal-deep-dive/) - Dan SingJoy and Eden Fractal deep dive
- [Doc 109](../109-optimystics-tooling-ecosystem/) - Optimystics tooling (Cignals and other Garden tools appear here)
- [Doc 306](../306-eden-fractal-op-fractal-deep-history/) - Eden Fractal and Optimism Fractal deep history
- [Doc 702](../702-respect-fractal-lineage/) - the full Respect and fractal governance lineage
- [Doc 703](../703-zao-fractal-current-state-may-2026/) - ZAO Fractal current state

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm the real Eden Fractal Respect Game day/time/cadence with Dan SingJoy or Tadas | Zaal | Outreach | Next Eden contact |
| Update Eden event count to "EF 138+" in docs 103, 106, 306 on their next revision | Research | Doc update | Next re-validation |
| Evaluate the Cagendas / Vlalendas agenda games for ZAO Fractal topic prioritization | Zaal | Research | When fractal tooling is revisited |
| When a *.notion.site page is needed in future research, check for a custom-domain mirror first | Research | Process | Ongoing |

## Sources

- [edencreators.com](https://edencreators.com) - [FULL] Eden Creators main site, mission, navigation, related properties
- [edencreators.com/garden](https://edencreators.com/garden) - [FULL] the Garden resource hub, 200+ items, full topic taxonomy
- [edencreators.com/events](https://edencreators.com/events) - [FULL] Eden Fractal + Optimism Fractal event listings and schedules
- [edencreators.com/videos](https://edencreators.com/videos) - [PARTIAL - page is a self-described "draft article" with no total video count] show and series list
- [edencreators.com/websites](https://edencreators.com/websites) - [FAILED - HTTP 404, path does not exist]
- [edencreators.notion.site](https://edencreators.notion.site) - [FAILED - JS shell; WebFetch empty, exa rate-limited, Playwright bridge unavailable, Wayback shell-only, Notion API 502. Use edencreators.com instead]
- [edenfractal.com/videos](https://edenfractal.com/videos) - [FULL] Eden Fractal video series, EF 135-138 recent episodes
- [edenfractal.com/respectgame](https://edenfractal.com/respectgame) - [FULL] Respect Game rules and the "biweekly Thursdays 17 UTC" schedule claim
- WebSearch "Eden Creators Eden Fractal" - [FULL] confirmed Eden Creators as a media studio, channel directory
