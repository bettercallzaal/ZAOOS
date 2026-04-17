# 418 — Birding Man Festival (Ramble On Farm) — Lessons for ZAOstock

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Analyze Birding Man festival (May 1-2, 2026, Trumansburg NY) as a reference model for ZAOstock (Oct 3, 2026, Ellsworth ME). Extract pricing, programming, partner, and positioning lessons.

---

## Key Decisions — Year 1 Only (2026)

First year = execute clean, don't over-scope. Only adopt the cheap / high-leverage ideas.

| Decision | Year 1 Recommendation |
|----------|----------------------|
| **Partner framing** | USE — replace Gold/Silver/Bronze sponsor tiers with role-named credits ("Broadcast Partner · Whop", "Official Host · Art of Ellsworth"). Pure copy change, zero cost, big credibility lift. |
| **Public break-even + volunteer language** | USE — add one line to `/stock` pitch page: "ZAOstock operates at break-even. Volunteer opportunities available." Signals mission, attracts right backers. |
| **BYOB + kid/dog friendly** | USE — add to public page copy. Matches Ellsworth vibe, zero operational cost. |
| **Sliding-scale tickets (simplified)** | USE a SIMPLE 2-tier: Community $0-25 sliding + Supporter $50-75. Skip the $140 VIP. Keep math easy for year one. |
| **Workshop track** | SKIP for 2026. Execute music-only flawlessly first. Park as Year 2 idea. |
| **Named non-music keynote** | SKIP for 2026 unless a ZAO-community name (Steve Peer intro, a friendly author, etc.) falls into your lap. Don't force it. |
| **Two-day format** | SKIP. Already committed to Oct 3 single day. |
| **Peer call with Harry Greene** | OPTIONAL — 15 min phone call if you have bandwidth, purely intel gathering. Low cost, could yield lessons. |

## Year 2+ Ideas (2027 and beyond — filed away)

Save these for when you have more team bandwidth, a track record, and bigger venue ambitions:

- **Full workshop track** (4-6 concurrent morning sessions: music production, Farcaster 101, songwriting, DAW clinics, mic'ing, ZAO token economics)
- **Two-day format** (Friday evening sponsor cocktail + storytelling + Saturday main event)
- **Third ticket tier** — VIP at $80-120 (reserved seating, artist meet-and-greet, merch bundle)
- **Named keynote/author** — pull a bestseller or respected non-music figure for a 30-min talk
- **Included lunch** (bundle into $50-75 tier with local food truck partnership)
- **Overnight lodging partnership** — partner with local Airbnbs or hotels for attendee packages
- **Post-event afterparty at partner venue** — Steve Peer's Black Moon or similar
- **Multi-stage** (main stage + acoustic corner + DJ booth)
- **Farm-like parallel activity** — walking tours, workshops, parklet garden build-day
- **Sponsor naming rights on stages/workshops** ("The Bangor Savings Main Stage")

## Comparison: Birding Man vs ZAOstock (as currently planned) vs Suggested ZAOstock 2026

| Dimension | Birding Man 2026 | ZAOstock Current | ZAOstock Suggested |
|-----------|------------------|------------------|-------------------|
| Date | May 1-2, 2026 (Fri-Sat) | Oct 3, 2026 (Sat only) | Oct 3, 2026 (Sat only) |
| Location | Ramble On Farm, Trumansburg NY | Franklin St Parklet, Ellsworth ME | Same |
| Duration | ~17 hrs (5:30pm Fri + 9am-11pm Sat) | 1 day (~8 hrs est) | 9am workshops + 1pm-11pm main |
| Programming tracks | Workshops (11) + music + art + forest walks | Music-forward | Music (10 slots) + 4-6 workshops + art vendors |
| Pricing model | Sliding scale $20-$140 | TBD | Sliding scale $0-$40-$80 |
| Headliner type | Author/forester (Ethan Tapper) | Music only (AttaBotty etc) | Add 1 named speaker/keynote |
| Org framing | "Ramble On Farm, supported by Propagate" | "ZAOstock by The ZAO" | "ZAOstock by The ZAO, in partnership with Art of Ellsworth" |
| Parking org | Break-even + volunteers | Budget $15.75K vs $19.3K expenses | Public break-even framing |
| Scale | 40-seat barn + outdoor | Outdoor parklet | Similar scale |
| Vibe tags | BYOB, dog+kid friendly, organic farm | Community, music, web3 | BYOB, dog+kid friendly, community+music+web3 |

## Programming Breakdown — Birding Man Saturday

| Time | Track | Example |
|------|-------|---------|
| 9am-12pm | 11 concurrent workshops | Bird banding, mushroom cultivation, agroforestry tours, forest management |
| 12pm-1pm | Lunch (included in ticket) | — |
| 1pm-5pm | Guided farm tours + forest walks | Led by Ethan Tapper |
| 5pm-8pm | Art show + live bands | Allison & Zoë, Dirt Turtles |
| 8pm-11pm | DJ set on vinyl | DJ Dijon |

**Transferable to ZAOstock Oct 3:**
- 9am-12pm → **Workshop track** (music production, songwriting with Farcaster, ZAO token economics 101, DAW clinics, mic'ing for the street)
- 12pm-1pm → Lunch from local food trucks (bundle in higher-tier ticket)
- 1pm-5pm → Parklet tours + artist meet-and-greets + Ellsworth downtown walk
- 5pm-9pm → Main music lineup (10 slots, 25 min each)
- 9pm-11pm → Afterparty DJ + community hang at sponsor bar (e.g., Steve Peer's Black Moon)

## Specific Numbers to Borrow

| Metric | Birding Man | Apply to ZAOstock |
|--------|-------------|-------------------|
| Ticket low tier | $20 | $0-20 sliding scale (keep community accessible) |
| Ticket full day | $40-$60 | $40-$60 including lunch |
| Ticket VIP | $70-$140 | $80-$120 (VIP = reserved parklet seating + artist meet) |
| Workshop count | 11 concurrent | 4-6 (smaller venue, smaller team) |
| Live music acts | 2 bands + 1 DJ | 10 artists (already planned) |
| Evening barn capacity | 40 seats | Parklet capacity TBD — confirm with Wallace Events |
| Contact / organizer | Harry Greene, 978-501-3888 | Zaal, already set |

## ZAO Ecosystem Integration

**Direct ties to current ZAOstock build:**

- **`src/app/stock/page.tsx`** — public pitch page. Add sliding-scale pricing tiers to the "Attend" section (if that section exists; if not, create it).
- **`scripts/stock-team-meeting-prep.sql`** (just seeded) — the Friday/Saturday prep already covers "finalize sponsor pitch deck copy" and "draft Tuesday meeting agenda" — add a new todo: "design sliding-scale pricing tiers + workshop track lineup" owned by Zaal, due Sat Apr 18.
- **`stock_artists` table** — consider adding a `track` column (music / workshop / speaker) so non-music programming (keynote, workshops) can live in the same pipeline.
- **`stock_timeline`** — add a May milestone: "announce workshop track + sliding-scale tickets" so public pricing goes live ~5 months before event.
- **`community.config.ts`** — if ZAOstock gets its own nav section, add a workshop sub-route.

**Parallel to Propagate / Ramble On:**
The ZAO has a similar dual identity: The ZAO (the community / brand) runs ZAOstock (the event) at a physical venue (Franklin St Parklet). Same structure as Propagate (tech co) → Ramble On (physical farm) → Birding Man (annual festival). Use this framing in pitch decks: "ZAOstock is produced by The ZAO in partnership with Art of Ellsworth at Franklin Street Parklet."

**Potential outreach:**
Harry Greene (Ramble On / Propagate) is reachable at 978-501-3888. Worth a 15-min call to compare notes on small community festival logistics, sliding-scale ticketing, sponsor recruitment. Add as sponsor-outreach-adjacent todo.

## Partner / Sponsor Strategy Lessons

Birding Man names its contributors as:
- **Propagate** — operating partner (agroforestry tech co)
- **Ramble On Farm** — venue + host
- **Ethan Tapper** — featured author + workshop lead
- **Allison & Zoë, Dirt Turtles, DJ Dijon** — music

No "Gold / Silver / Bronze" sponsor language. Everyone is a named partner. Reduces commodification, increases brand warmth.

**Apply to ZAOstock:** ZAOstock sponsor pitch page currently uses Local / Virtual / Ecosystem tracks. Keep the tracks internally for routing, but on the public page name contributors by role: "Main Stage Sponsor · Bangor Savings Bank", "Broadcast Partner · Whop", "Art of Ellsworth · Official Host Partner", "Wallace Events · Tent Partner". Feels more like credits, less like ads.

## Risks / What NOT to Copy

| Element | Why to skip |
|---------|------------|
| Two-day format | Oct 3 is locked + Ellsworth is not a destination town for overnight attendees |
| 11 concurrent workshops | Requires 11 teachers + 11 spaces — overkill for parklet scale |
| Farm camping | No camping available at Franklin St Parklet |
| Sliding scale as high as $140 | Ellsworth median income is ~$55K — cap VIP at ~$80-$120 |
| Audubon-style partnership | ZAO doesn't have an obvious Audubon-equivalent — find local equivalent (Acadia Audubon? MDI Bio Lab?) |

## Next Actions — Year 1 Scope

1. **Sat 4/18** — When finalizing sponsor pitch copy, swap "sponsor tiers" language for "partner credits" framing.
2. **Sat 4/18** — Add one line to `/stock` page: break-even + volunteer + BYOB + kid/dog friendly.
3. **Sat 4/18** — Design 2-tier ticket structure (Community $0-25 sliding, Supporter $50-75). No VIP.
4. **May 2026** — Watch Birding Man happen (after May 2). Post-event, fetch their recap / attendee numbers for benchmark data. Inform Year 2 planning.
5. **Sept 2026** — Before ZAOstock, revisit this doc's Year 2+ list. Pick 2-3 to test in 2027.

## Sources

- [Birding Man festival page — propagateag.com](https://www.propagateag.com/birding-man)
- [Ramble On Farm page — propagateag.com](https://www.propagateag.com/rambleonfarm)
- [Propagate Ag main site](https://www.propagateag.com)
- [Ramble On Farm — Hipcamp listing (Trumansburg NY)](https://www.hipcamp.com/en-US/land/new-york-ramble-on-farm-agroforestry-6p0h08y0)
- [Finger Lakes GrassRoots Festival (nearby peer in Trumansburg)](https://www.musicfestivalwizard.com/festivals/grassroots-finger-lakes-festival-2026/)

## Related ZAO Research

- [270 — ZAOstock planning](../270-zao-stock-planning/)
- [274 — ZAOstock team deep profiles](../274-zao-stock-team-deep-profiles/)
- [364 — ZAO festivals deep research](../364-zao-festivals-deep-research/)
- [369 — Dreamevent framework gap analysis](../369-dreamevent-framework-gap-analysis/)
