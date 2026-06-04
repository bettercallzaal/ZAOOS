# 796 — The WIP Meetup: Longest-Running Web3 Metaverse Meetup

> **Status:** Research complete
> **Date:** June 4, 2026
> **Type:** STANDALONE — external community/event analysis (reference model)
> **Goal:** Decide what The ZAO should steal from The WIP Meetup's 7-year weekly metaverse-meetup playbook for ZAOstock, the 3D portal hub, and the weekly community ritual.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Steal the weekly ritual** | COPY WIP's "same time, every week, forever" cadence — every Thursday 12pm PT since 2019 (370+ consecutive weeks). ZAO has no single fixed weekly metaverse anchor; the WaveWarZ Sunday battle (doc 442) is the closest. ADD a fixed weekly ZAO room call so members build muscle memory. |
| **Use Hyperfy as the 3D venue** | EVALUATE Hyperfy for the ZAO portal hub instead of building bespoke R3F rooms. WIP runs its whole community inside Hyperfy (`hyperfy.io/wip`), which now ships AI-agent NPCs natively — directly relevant to dropping ZOE into a 3D space. This supersedes the heavy custom-3D approach flagged in doc 313 and aligns with the lightweight-portal pivot in doc 319. |
| **Format: alpha-drop + open-mic** | ADOPT WIP's format — a short "latest happenings" alpha drop, then open the floor. Low production cost, high retention. Maps to the run-of-show flex-block pattern already drafted for ZAOstock in doc 428. |
| **Token-for-attendance precedent** | NOTE the WIP→$HYPER allocation: loyal weekly attendees received a $HYPER token allocation in the Jan 2026 launch. This is a live precedent for rewarding ZAO ritual attendance with Respect (see `src/app/api/respect/`). |
| **Don't build a new bot for this** | Per CLAUDE.md "no new bots without doc" — a ZAO weekly metaverse call needs NO new agent. Announce via existing ZOE (`@zaoclaw_bot`) and the portal hub, not a new process. |

---

## What The WIP Meetup Is

The WIP ("Work In Progress") Meetup is the **longest-running web3 metaverse meetup** — held every **Thursday at 12pm PT / 20:00 UTC since 2019** (~370+ weekly sessions as of June 2026). It is run by **niftytime, rizzle, and Meme**, who "drop alpha on the community" each week. The community gathers inside **Hyperfy** at `hyperfy.io/wip` ("WIP Ground Zero"), a browser-based 3D virtual world.

ENS identity: `thewipmeetup.eth`. Blog: `mirror.xyz/blog.thewipmeetup.eth`. X: `@theWIPmeetup`. The site `thewipmeetup.com` is a thin landing page (returns HTTP 403 to scrapers; content lives on Mirror, X, YouTube, and inside Hyperfy).

### Why it matters to ZAO
ZAO is building a 3D portal hub (docs 313/315/319) and runs IRL/virtual events (ZAOstock, doc 270). WIP is a 7-year proof that a tiny crew can sustain a virtual-world community on **one fixed weekly ritual + one persistent 3D room** — exactly the shape ZAO's portal hub should take.

---

## Comparison: Weekly Virtual-Community Formats

| Format | Cadence | Venue | Production cost | Persistence (years) | Fit for ZAO |
|--------|---------|-------|-----------------|---------------------|-------------|
| **The WIP Meetup** | Thursday 12pm PT, weekly | Hyperfy 3D world | Very low (1 room, 3 hosts) | 7 (since 2019) | HIGH — steal the ritual + venue |
| **WaveWarZ Sunday battle** (doc 442) | Sunday, weekly | X Space + app | Low-medium | <1 | Already ZAO's de-facto ritual; pair with a 3D room |
| **X Spaces / Twitter audio** (doc 279) | Ad-hoc | Audio-only | Low | n/a | Good for reach, no spatial presence |
| **Custom R3F rooms** (doc 313) | n/a (not shipped) | Bespoke Three.js | HIGH (build + maintain) | 0 | SKIP heavy build — doc 319 already pivoted to lightweight |

WIP wins on durability-per-dollar: a single Hyperfy room + a recurring calendar slot has outlasted every heavily-produced metaverse launch (Hyperfy itself, launched 2022, hit a **$275M market cap within 24 hours** of its Jan 5 2026 $HYPER launch — the WIP community had skin in that game via a token allocation).

---

## ZAO OS Integration

| WIP element | ZAO surface to wire it into | File / path |
|-------------|-----------------------------|-------------|
| Persistent 3D room (Hyperfy) | Lightweight 3D portal hub | `research/infrastructure/319-lightweight-3d-portal-hub/` |
| AI-agent NPC in the world | ZOE concierge in the portal | `bot/src/zoe/`, `src/lib/agents/` |
| Weekly ritual cadence | Community nav + events | `community.config.ts` (nav), `src/app/api/notifications/` |
| Attendance → token reward | Respect-weighted reward | `src/app/api/respect/` |
| Event recap distribution | Existing `/meeting` + recap flow | `research/events/_meetings-index.md` |

Concretely: add a fixed weekly "ZAO Room" entry to the nav in `community.config.ts`, announce it through `src/app/api/notifications/`, and (if a 3D venue is wanted) point the portal hub from doc 319 at a Hyperfy world rather than a bespoke R3F build. ZOE announces and recaps via `@zaoclaw_bot` — no new bot, per CLAUDE.md Primary Surfaces rules.

---

## Reference: Hyperfy as a 3D Venue

| Attribute | Detail |
|-----------|--------|
| Launched | 2022; v2 (AI-agent focus) + $HYPER token Jan 5, 2026 |
| Access | Browser-based, no install — fits ZAO's "worst-Android compatible" constraint (doc 319) |
| AI agents | Native NPC/agent support in v2 — drop-in path for ZOE |
| WIP world | `hyperfy.io/wip` ("WIP Ground Zero") |
| Token | $HYPER — opened ~$3M mcap, peaked ~$275M in <24h |

This is the single biggest steal: ZAO does not need to build a metaverse engine. WIP proves Hyperfy is enough, and Hyperfy's v2 agent support means ZOE can live in the room.

---

## Sources

- [The WIP Meetup — Mirror blog](https://mirror.xyz/blog.thewipmeetup.eth)
- [@theWIPmeetup on X](https://x.com/thewipmeetup)
- [WIP Ground Zero — Hyperfy world](https://hyperfy.io/wip)
- [WIP Meetup Members Secure Hyperfy $HYPER Tokens — NFT Plazas](https://nftplazas.com/wip-meetup-members-secure-hyperfy-hyper-tokens/)
- [Hyperfy Launch Revives Metaverse Narrative with AI Agent Integration — The Defiant](https://thedefiant.io/news/nfts-and-web3/hyperfy-launch-revives-metaverse-narrative-with-ai-agent-integration)
- [Doc 319 — Lightweight 3D Portal Hub](../../infrastructure/319-lightweight-3d-portal-hub/)
- [Doc 313 — Metaverse & 3D Virtual World](../../infrastructure/313-metaverse-3d-virtual-world-zao/)
- [Doc 442 — WaveWarZ Sunday Battle Recap](../442-wavewarz-sunday-battle-recap-socials/)
