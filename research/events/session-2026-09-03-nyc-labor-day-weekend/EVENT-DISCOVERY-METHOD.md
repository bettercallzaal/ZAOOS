# How to find events — the reusable method

Built 2026-09-04 for NYC, written to be reused for any city and any conference
week. This doubles as the source spec for the IRL event tool.

---

## Open these three right now (NYC, today)

| URL | Why this one |
|---|---|
| **`luma.com/nyc/map`** | **Map view.** Location-first, which is the filter that actually matters when your base changes mid-trip. Start here. |
| **`luma.com/discover/nyc/crypto`** | NYC crypto events, live — *not* the spent NFT.NYC satellite list |
| **`partiful.com/explore/nyc`** | The other half of the market. Crypto/tech NYC has largely split across Luma and Partiful |

All blocked from the agent container. Open on the phone.

## Standing NYC calendars worth subscribing to, not just checking

These are recurring calendars, so subscribing once pays off on every future trip:

- **`luma.com/blockchainnyc`** — Blockchain NYC events calendar
- **`luma.com/NYBWEvents`** — New York Blockchain Week events
- **`partiful.com/u/2KgDoRZix3CnC9fcdYUz`** — "Partiful Picks NYC", a curated list

## The pattern nobody tells you

**Major crypto conferences maintain a dedicated Luma calendar just for side
events, at a predictable slug.** Confirmed examples:

- `luma.com/nft-nyc/map` — NFT.NYC's own
- `luma.com/EBCsidevents` — European Blockchain Convention
- `luma.com/ParisBlockchainWeek` — Paris Blockchain Week
- `luma.com/BuildWeek` — Science of Blockchain Conference side events

**So the first move for any conference is: guess the Luma slug.** Try
`luma.com/<conference-name>`, `luma.com/<name>sideevents`, and the conference's
own site for a "side events" or "satellite events" link. That single calendar
usually beats an hour of searching.

## Tools that already exist — check before building

Directly relevant to the IRL event tool, and a `code-restraint.md` rung-2 check:

- **`eventmates.app`** — purpose-built to browse blockchain conferences *and their
  side events*; click a conference, get the full schedule of meetups, parties and
  workshops. This is close to the discovery half of what we were going to build.
- **Apify "Tech Events Scraper — Luma & Partiful with Auto-Tags"** — an existing
  scraper that aggregates both platforms by keyword, city or tag.

**Neither has been evaluated** — both surfaced via search 2026-09-04 and are
blocked from this container. UNVERIFIED. But building a Luma scraper without
looking at these first would be rebuilding something that ships today.

## The ladder — when you land in any city

1. **The conference's own side-event calendar** (guess the Luma slug, per above)
2. **Luma map view for the city** — `luma.com/<city>/map`, location-first
3. **Luma city+topic discovery** — `luma.com/discover/<city>/crypto`
4. **Partiful explore** — `partiful.com/explore/<city>`
5. **Standing city calendars** — subscribe once, benefit forever
6. **The people already texting you.** A personal invite beats every calendar
   above, and this is the step that gets skipped because it feels like it isn't
   "research." Three unread luma links sat in this trip's inbox while hours went
   into searching public lists that turned out to be expired.

## Timing — the thing that broke this trip's search

**A conference's side events cluster on the conference days and stop.** NFT.NYC
2026 ran Sep 1-3; every satellite event that got indexed was Sep 3 or earlier. By
Sep 4 the public calendar was spent, and search kept returning the same five dead
events because those are the ones with inbound links.

**Rule: check the conference dates BEFORE searching its side events.** If you are
past the last day, skip straight to rungs 2-6. Searching rung 1 after the fact
returns confident, well-indexed, expired results — which is worse than nothing,
because it looks like an answer.

## What does not work from an agent container

Measured 2026-09-04, a 14-host sweep, all blocked at the egress proxy:
`ra.co`, `eventbrite.com`, `meetup.com`, `partiful.com`, `dice.fm`, `songkick.com`,
`bandsintown.com`, `web3.career`, `cryptoevents.global`, `supermomos.com`,
`10times.com`, `luminik.io`, `web3voyager.com`, `events.coinpedia.org` — plus
`luma.com`, `lu.ma`, `x.com`, `nft.nyc`, `forkoff.xyz`, `zao.cards`, `useicm.com`
and four keyless Farcaster endpoints tested earlier.

**WebSearch is the only working channel.** It returns titles, URLs and snippets —
enough to find *where* to look, never enough to read a live listing. So the split
is: the agent finds the sources and the method, the human opens them.

That is not a workaround to fix. It is the correct division of labour for this
task, and it is why this file exists as a method rather than a list of events.

## Sources

Search results, 2026-09-04: Luma discovery and calendar URLs, Partiful explore
URLs, EventMates, the Apify Luma/Partiful scraper, and the conference-side-event
calendar pattern (EBC, Paris Blockchain Week, BuildWeek). All **PARTIAL** —
surfaced via search, none independently fetched, because every one is blocked
from this container.
