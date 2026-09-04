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

---

# ADDENDUM — the actual scraping answer, and why the calendar is thin

Zaal, 2026-09-04: *"honestly not a lot of web3 events there, please find better
ways to scrape and search."*

## 1. Luma has a public JSON API. No login, no cookies.

This is the real unlock and it is better than the web UI.

| Endpoint | Returns |
|---|---|
| `search_events` | Paginated listings filtered by **city name, custom coordinates, or Luma place ID** |
| `get_event_details` | Host profiles, ticket availability, sold-out status, **full address**, ISO 8601 start/end |

**Coordinate filtering is the feature the IRL tool needs.** "Events within N miles
of where I am sleeping tonight" is a direct query against this, not something that
has to be built. Same for the Jersey-City-vs-Brooklyn cost problem this trip ran
into — that is a distance filter, and the API takes coordinates.

Export formats reported: JSON, CSV, Excel, XML, HTML, RSS.

> ⚠️ **The exact endpoint path is NOT verified.** Search results describe the API
> and its two operations without giving the URL, and `lu.ma` is blocked from this
> container so it could not be confirmed. **Do not write code against a guessed
> path.** Confirm it from an unblocked machine first, or read it off one of the
> wrappers below.

**Wrappers that already do this** (all UNVERIFIED, surfaced via search 2026-09-04):
- Apify: `matyascimbulka/luma-event-scraper`, `aitorsm/luma-events`,
  `haketa/luma-event-scraper`, `scrapesage/luma-scraper`,
  `lexis-solutions/lu-ma-scraper`
- Parse.bot: "Lu.ma Events API - Discover Events by City", "Luma Events API -
  Search & Browse"

Five independent Apify actors for one site is a signal: the API is stable enough
that people build on it, and the discovery layer of the IRL tool is a solved
problem to buy rather than build.

## 2. Telegram cannot be scraped, and that is the finding

Where crypto side events actually get shared is private Telegram groups — and
**private Telegram groups are not discoverable by in-app search and are not
indexed anywhere.** Only the creator can invite. That is by design.

So there is no clever query for this. The only route in is a person who is already
in. **That converts a search problem into a one-line ask**, and there are three
people to ask it of this weekend:

> "What Telegram groups should I be in for NYC crypto/music events?"

Gabe is the obvious first ask — he is already mid-conversation and was at events
Thursday night.

## 3. Why the calendar is genuinely thin — this is not a search failure

Two things stack, and neither is fixable by better scraping:

1. **NFT.NYC ended 2026-09-03.** Side events cluster on conference days and stop.
2. **It is Labor Day weekend.** The city empties. Labor Day 2026 is Monday
   2026-09-07 (first Monday of September, by arithmetic).

A conference tail landing on a holiday weekend is close to the emptiest the NYC
web3 calendar gets all year. **More scraping will keep confirming the same
answer.**

## 4. So invert it — this is the actual move

There are 9-11 people in reach in a city with almost no competing events. That is
not a bad weekend to find a room. **It is an unusually good weekend to be the
room.**

- Posting a small Luma or Partiful for Saturday costs nothing and takes minutes.
- **It is literally Rung 1 of the ZAO NYC ladder** — a coworking day or meetup,
  the rung whose entire job is to produce a roster — and it would happen this
  weekend instead of "this month."
- Zero competing events means the people you already invited have no better offer.
- It gives every conversation from Friday a concrete second touch: *"come through
  Saturday."*
- And it is the first thing ZAO NYC ever does, with a co-lead who lives here.

The counter-argument is real and should be said: a thin turnout at your own first
event is worse than no event. Mitigation is to keep it small and unbranded as a
"launch" — coffee, a table, a time, five people. Rung 1 is a roster-building
exercise, not a debut.

## Sources

Search 2026-09-04 for the Luma API surface and wrappers; search 2026-09-04
confirming private Telegram groups are non-indexed by design. All **PARTIAL** —
every relevant host is blocked from this container.
