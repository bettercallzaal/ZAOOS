---
topic: dev-workflows
type: DECISION
status: active
last-validated: 2026-10-23
related-docs: []
original-query: "can u see if theres any good opensource repos for this" (Zaal, relayed by the seat on 2026-10-23: open-source flight search and fare watching for a December trip to Singapore; a QUICK refresh of the flights lane's 13 Oct 2026 survey, GitHub first, covering cash fare search, award or points search, and a price-drop watch); second ask relayed the same day: "whats the deal with other ai things for this thing i want" (hosted AI travel assistants, price prediction, the Expedia connector)
tier: QUICK
---

# 2712 - Flight search for the Singapore trip: open-source tools and AI travel assistants, a refresh (23 Oct 2026)

A QUICK refresh of the flights lane's 13 Oct 2026 survey, which is kept in the vault and not repeated here. That survey found `fast-flights` 3.1.0 working keyless on this Mac and the `fli` MCP server failing. The ZAO fare watch that came out of it, `bin/zao-fare-watch` in zaal-dotfiles (#525, merged), watches two one-way legs for the trip.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **EXTEND the existing fare watch. Adopt nothing new for cash fares.** | Nothing on GitHub since 13 Oct beats what is installed. `fast-flights` is still the best keyless cash source, and it ran here today. |
| 2 | **PIN `fast-flights` to its `dev` branch (commit `4261437c`, MIT) wherever the fare watch calls it.** | Run on this Mac at 16:47 EDT, one search, a December BOS-SIN one-way, 1 adult, economy. The PyPI 3.1.0 release returned **12** results; `dev` at `4261437c` returned **96**. The cheapest five were identical ($1,369 American and Qatar, $1,380 JetBlue and Qatar, $1,388 Air France and KLM). The `dev` branch carries two fixes made after 3.1.0 (18 Aug 2026): "request the complete result set with tfu (#115)" (21 Sep) and "Fix omitted result groups and crashes on unpriced itineraries (#114)" (11 Sep). |
| 3 | **Note in passing: the watch's fast-flights path never runs for this trip.** Read in `bin/zao-fare-watch`: fast-flights is used only "if the fast_flights package is importable AND the leg has no max_hours", and both legs have a max-hours rule. So the curl parser is the only live source. | If curl breaks, the watch has no second source. Giving the fast-flights rows a duration (or relaxing that guard) is the extension worth building. |
| 4 | **Award search: SKIP until Zaal decides to pay.** Every working award tool needs a seats.aero Pro key (about $8 a month, per the travel-hacking-toolkit README). That is a money decision, and Zaal's. | If he says yes, `olsonbd/seats-aero-mcp` (MIT) or seats.aero's own official MCP is the route, not a build. |
| 5 | **SKIP `trvl` and LetsFG.** | `trvl`'s LICENSE is PolyForm Noncommercial and the tool reads browser cookies. LetsFG is a booking service: it holds the fare on a card on file. Booking and payment are out of scope for an agent here. |
| 6 | **Do not wire `fli` yet.** | No PyPI release since 0.9.0 (21 May 2026), the version that failed here on 13 Oct. Its last commits (20 Sep) are unreleased CLI and empty-result messaging fixes. |

## Findings

Metadata from `gh api repos/<r>` at about 16:40 EDT on 2026-10-23. Licences are read from each repo's LICENSE file, not the API field. "Keyless here" means it was run on this Mac today, or the README says so (marked).

| Repo | Stars | Last push | Licence (file) | Use | Keyless here |
|---|---|---|---|---|---|
| AWeirdDev/flights (`fast-flights`) | 2,112 | 2026-10-19 | MIT | Google Flights client, cash fares | **Yes, run today** (3.1.0 and `dev`) |
| punitarani/fli | 3,236 | 2026-09-20 | MIT | Google Flights library and MCP server | Failed on 13 Oct; no new release since |
| borski/travel-hacking-toolkit | 709 | 2026-10-19 | MIT | 42 skills and 6 MCP servers for Claude Code: cash, points, awards | README: 5 free MCP servers need no keys (Skiplagged, Kiwi, Trivago, Ferryhopper, Airbnb); award search needs `SEATS_AERO_API_KEY`. Not run |
| olsonbd/seats-aero-mcp | 4 | 2026-10-21 | MIT (fork of kwonye/seats-aero-mcp, MIT) | seats.aero award MCP, Pro mode | Needs a seats.aero Pro key. Not run |
| gavgrego/seats.aero-mcp-server | 27 | 2026-10-13 | **No LICENSE file** (all rights reserved) | seats.aero award MCP | Needs a key; its README now points to seats.aero's official MCP |
| seats.aero official MCP | n/a | n/a | proprietary service | Award availability | Auth not read (page needs JavaScript) |
| MikkoParkkola/trvl | 89 | 2026-10-23 | **PolyForm Noncommercial 1.0.0** | Travel MCP: Google Flights, Kiwi and Skiplagged merged, price watches | README: "No personal API key for default search". Not run |
| LetsFG/LetsFG | 2,186 | 2026-10-21 | MIT (API field said NOASSERTION) | Hosted flight and hotel search **and booking** | Needs a connect step at letsfg.co; booking holds a card |

Price-drop watch repos: a GitHub search for "flight price tracker", "fare alert" and "flight price drop" (6 each, sorted by stars) found nothing above 44 stars, and the top one (kiinami/vfd) was last pushed on 2025-03-08. Nothing there to adopt over the installed watch.

Licence note, unchanged from 13 Oct: MIT on the code says nothing about Google's terms. Every Google Flights reader here works without an agreement with Google. That is fine for pricing Zaal's own trips, and not a basis for a public product.

## Hosted AI travel tools (added at the seat's request: "whats the deal with other ai things for this thing i want")

| Tool | What it does | Cost | Books, or only searches | Can an agent here drive it | Privacy |
|---|---|---|---|---|---|
| **Expedia connector** (already connected to Claude) | Flight search with fares, bag rules and change fees. Its tool description also mentions price forecasts | Free to search | **Search only.** Booking is a "Book on Expedia" link Zaal opens himself | **Yes, run today.** The same December BOS-SIN one-way returned $1,368.20 (American and Qatar, 2 stops, 25h15) as cheapest, which matches Google's $1,369, and also a one-stop Emirates option at $1,495.50, 21h20. No forecast came back in this response | The tool asks the caller to send every user message from the conversation verbatim as `query_text`. An agent should send only the search itself, never a whole conversation |
| **Google Flights price tracking** | Emails a price drop for a tracked route and date | Free | Search and alerts; booking goes to the airline or an agency | No; it lives in Zaal's Google account | Google account |
| **Google AI Mode agentic booking** | Describe the trip in words, compare, then "complete the booking with the partner of your choice" (Google's blog, as quoted by Skift) | n/a | Will book through partners (Expedia, Booking.com and others) | No | Google account. Google said in Nov 2025 "We're just starting work on this", so do not plan on it for this trip |
| **Hopper** | Buy-or-wait predictions and "Price Freeze" | Free app; Price Freeze is paid | Books | No | Account and card. The Going guide calls its predictions "self-reported, not guaranteed". One source (the Rework guide, Jul 2026) says Hopper paid $35 million to settle FTC charges on 2 Jul 2026 over Price Freeze marketing and pre-selected fees. **UNVERIFIED**: the ftc.gov search returned 404 and no second source was read |
| **Kayak** | "Ask AI" chat search (replaced its AI Mode in Apr 2026), Price Forecast, price alerts | Free | Search; books through partners | No | Kayak account for alerts |
| **ChatGPT agent** (and Claude or Gemini in a browser) | Reads Skyscanner, Google Flights and Kayak pages | Plan cost | Cannot finish checkout: the Going guide reports a 2026 test where it "couldn't complete a booking because checkout steps require verification it can't pass" | Partly, through a browser | The same test found the cheapest fare "only about two-thirds of the time". Verify every fare |
| **LetsFG** (above) | Hosted search and booking for agents | Free search; booking holds a card | Books | Yes, as an MCP, after a connect step | A card on file. Out of scope |

## Recommendation for the Singapore trip

1. **Use now:** turn on Google Flights price tracking for both legs in Zaal's own Google account (free, a minute, nothing to build). Use the Expedia connector for a quick second price from any Claude session.
2. **Extend, do not build:** keep `zao-fare-watch` as the daily record, pin fast-flights to `dev` `4261437c`, and make it a working second source for the max-hours legs (decision 3 above).
3. **Book it himself** on the airline's site or through the Expedia link. No agent books or pays.
4. **Skip:** Hopper's Price Freeze (paid, and the FTC claim above), ChatGPT's agent for this trip, and every award tool until the seats.aero spend is decided.

## Next actions

| Action | Owner | Where |
|---|---|---|
| Pin `fast-flights` to `dev` `4261437c` in the fare watch's fast-flights path, and give its rows a duration so the max-hours legs can use it as a second source | a dotfiles lane, PR-only | `bin/zao-fare-watch`, zaal-dotfiles |
| Turn on Google Flights price tracking for both legs | Zaal | his Google account |
| Decide whether to pay for seats.aero Pro (about $8/mo) for award search | Zaal | the grill |
| Re-test `fli` after its next PyPI release | any lane | `pypi.org/project/flights` |

## Sources

- [FULL] https://api.github.com/repos/AWeirdDev/flights, its commits and LICENSE, via `gh api` (raw JSON)
- [FULL] https://pypi.org/pypi/fast-flights/json (raw JSON, curl): latest 3.1.0, uploaded 2026-08-18
- [FULL] https://pypi.org/pypi/flights/json (raw JSON, curl): latest 0.9.0, uploaded 2026-05-21
- [FULL] https://api.github.com/repos/punitarani/fli and its commits, via `gh api`
- [FULL] https://github.com/borski/travel-hacking-toolkit README and LICENSE, via `gh api` (base64-decoded raw text)
- [FULL] https://github.com/olsonbd/seats-aero-mcp README and LICENSE, via `gh api`
- [FULL] https://github.com/gavgrego/seats.aero-mcp-server README via `gh api`; the LICENSE endpoint returned nothing
- [FULL] https://github.com/MikkoParkkola/trvl README and LICENSE, via `gh api`
- [FULL] https://github.com/LetsFG/LetsFG README and LICENSE, via `gh api`
- [PARTIAL - the page renders its setup with JavaScript; only the heading text was read] https://seats.aero/mcp, via curl and an HTML strip
- [FULL] GitHub repository search (`gh search repos`, 7 queries, 6 results each, by stars) for the price-watch and award categories
- [FULL] A local run: `uvx --with fast-flights==3.1.0` and `uvx --with "fast-flights @ git+https://github.com/AWeirdDev/flights@4261437c..."`, the same script, 2026-10-23 16:47 EDT
- [FULL] The Expedia connector's `search_flights` tool, called from this session at about 16:55 EDT (same route and date)
- [FULL] https://resources.rework.com/tools/ai-tools/best-ai-tools-for-travel-planning-2026 (curl and an HTML strip; "Updated Jul 17, 2026")
- [FULL] https://www.going.com/guides/best-ai-tools-for-cheap-flights-2026 (curl and an HTML strip)
- [FULL] https://skift.com/2025/11/17/google-is-building-agentic-travel-booking/ (curl and an HTML strip; Adriana Lee, 17 Nov 2025)
- [FAILED - HTTP 404] https://www.ftc.gov/search?search_api_fulltext=Hopper, tried as a second source for the Hopper settlement
- Community source: the travel-hacking-toolkit README is a practitioner's write-up (Michael Borohovski, MIT), and is the source for the seats.aero Pro price

Credit: `fast-flights` by AWeirdDev (MIT); `fli` by punitarani (MIT); travel-hacking-toolkit by Michael Borohovski (MIT); seats-aero-mcp by Kwon Ye, maintained by olsonbd (MIT).
