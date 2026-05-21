---
topic: business
type: comparison
status: research-complete
last-validated: 2026-05-20
original-query: "What brand patterns does ZAOstock need from RSV.Pizza and IYKYK? How do we segment musicians vs artists vs organizers? (reconstructed)"
related-docs: 502, 547, 609, 610
tier: STANDARD
---

# 611 - ZAOstock brand-pattern audit: RSV.Pizza + IYKYK / blank.space + contributor entry-page design

> **Goal:** Identify brand-building patterns ZAOstock is missing by comparing to two reference sites (RSV.Pizza for production festival ops, IYKYK / blank.space for community-vibe ecosystem). Propose three contributor entry-points (musicians, artists, event organizers) so each persona has a clear door into ZAOstock.

## Key Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Add 3 contributor entry pages to zaostock.com: `/musicians`, `/artists`, `/event-organizers` | **NEW - approved May 7** |
| 2 | Adopt RSV.Pizza per-role surfaces pattern: PartnerDashboard, CheckIn, DJ-side, Public Recap | Sequence: PartnerDashboard first (todo exists), CheckIn pre-Oct 3, others after Year 2 |
| 3 | Lean into IYKYK insider-vibe language without overdoing it - frame ZAO Festivals as ecosystem not just event | Apply on home + entry pages |
| 4 | Add reusable component library enforcement (RSV.Pizza pattern) | Document in CONTRIBUTING.md when next refactor lands |

## What RSV.Pizza has that we are missing (from earlier doc-research of their GitHub)

Pages they ship that ZAOstock lacks:

| Page they have | What it does | ZAOstock equivalent |
|---|---|---|
| **CheckInPage** | QR-code scan for day-of attendance | None - todo exists |
| **PartnerDashboardPage** | Partners self-edit their profile and assets | None - "Get Web3Metal live" todo |
| **PartnerIntakePage** | Onboarding form for new partners | None - manual SQL only |
| **DJPage** | Talent-facing surface (set times, technical riders, hospitality) | Could be a `/musicians` entry page |
| **DisplayPage** | Venue screen content rotation (sponsors, lineup, schedule) | None - day-of gap |
| **GraphicsDashboard** | Generate social media assets from event data | None - manual design only |
| **PostComposerPage** | Compose content from event data | None |
| **PublicReportPage** + **PublicVenueReportPage** | Post-event recap landing page | `/onepagers` exists but is a generic 1-pager system, not event recap |
| **HostPage** | Host configures their event | We have `/team` but no per-event configurer |
| **AdminPage** + **UnderbossDashboard** | Multi-tier admin | We have `/team` flat |

Engineering hygiene RSV.Pizza enforces (per their CLAUDE.md):
- **Reusable component library**: `IconInput`, `Checkbox`, `ClickableEmail`, `CustomUrlInput`, `LocationAutocomplete`, `TimezonePickerInput`, `Layout`, `HostsList`, `TableRow`, `LoginModal`. Rule: "Never create raw `<input>` elements - use `IconInput`."
- **Branching convention**: `{task-id}-{short-name}` (no `feature/` prefix)
- **`plans/` folder**: every non-trivial task gets a written implementation plan before code
- **Bland AI integration** for automated vendor calls (way ahead of us; defer)

## What IYKYK / blank.space brings (vibe + ecosystem)

IYKYK on blank.space = "Social hub for the IYKYK community. Create, customize, and explore the IYKYK ecosystem."

Adjacent: iykyk.com - "share yourself, on purpose" - personal destination for "creators, founders, service providers, and people who want one clean place to share their work and be reachable without the noise."

**Patterns worth borrowing:**

1. **Insider-vibe language as a brand asset.** "If You Know, You Know." ZAOstock has some of this with The ZAO but does not lean into it. We could lean into "ZAO" as the cultural cue without crypto-coding.
2. **Personal customization at the user level.** Each member of the community has a customizable space. ZAOstock's `/team/m/[slug]` does this for teammates - we could extend to musicians/artists/partners.
3. **Ecosystem framing.** Not just an event - an ecosystem with multiple surfaces (festival, podcast, community, content, partnerships). ZAO Festivals already has this latent (PALOOZA + CHELLA + ZAOstock + ZAOville) but does not communicate it as an ecosystem on the home page.
4. **"Share yourself, on purpose" copy ethos.** Lower the friction for community members to manifest themselves on our surfaces - removes the "what do I post?" anxiety with a clear "this is the door."

## What ZAOstock has that's distinctive

For balance: things ZAOstock does well that the reference sites do not:

1. **6-circle scope model** (post May 5 consolidation) - clearer team org than RSV.Pizza's flat or IYKYK's none
2. **Telegram bot integration** (ZAOstockTeamBot with /charter, /circles, /timeline_done) - team ops via chat
3. **Lu.ma calendar integration** as the ticketing backbone (700+ warm audience already)
4. **Fiscal sponsor architecture** (NMC + Fractured Atlas, post May 7 correction) handled with proper legal language
5. **Lineage story** (PALOOZA NYC + CHELLA Miami + now ZAOstock) is real, not aspirational
6. **Open partner concept** (track=partner in sponsors) - Web3Metal as first row, blueprint for project-collaborator partnerships

## NEW: Three contributor entry-pages design

Each entry page is a landing for ONE persona walking into ZAOstock cold. Each answers:
1. What ZAOstock is *from your perspective*
2. What you get
3. What we ask
4. How to plug in

### `/musicians` - For independent artists who want to play

**Hero:** "Made music nobody is paying you to make? You are who we built this for."
**Subhead:** "ZAOstock is a one-day outdoor festival in Ellsworth Maine on October 3, 2026. Every artist on stage was discovered through The ZAO, a community of 100+ independent musicians."

**What you get:**
- A real stage in front of a real audience (target: 200-400 in person, 1K+ livestream)
- Travel + lodging covered or crowdfunded via Giveth / GoFundMe (per-artist pool)
- Recording of your set, photo from the day, recap reel inclusion
- Direct line into the ZAO music community (100+ people who already care about independent artists)
- 100% of any merch / tip revenue you generate on-site

**What we ask:**
- 25-minute set window
- Standard technical rider (we will work with your needs)
- Show up to soundcheck day-of
- Help share when we post your slot

**How to plug in:**
- Submit through The ZAO open call (link)
- Or DM Zaal directly if you have a referral
- Cutoff: ~one month before the event
- Independent + ZAO-vetted only - this is not a pay-to-play festival

**Subnav:** Past festivals (PALOOZA + CHELLA recordings) | Lineup so far | FAQ for musicians

---

### `/artists` - For visual artists, designers, photographers

**Hero:** "Build the visual identity of a festival people remember."
**Subhead:** "ZAOstock needs visual artists across the build. Posters, signage, on-site installations, photography, motion. Your work becomes part of the ZAO Festivals lineage."

**What you get:**
- Named credit on every surface your work appears (zaostock.com, social, day-of signage, recap)
- A real piece in your portfolio - a festival people travel to see
- Direct collaboration with Candy + DCoop on the brand kit + logo work
- Pay or revenue-share depending on the project (one-off poster vs. installation - we work it out per piece)
- Day-of access + crew shirt + meals on site
- Eligible for finders fee / management fee structure (5%/10%/15%) if you bring a partner relationship

**What we ask:**
- Bring your work or portfolio when you reach out
- Be willing to iterate - this is a community-build, not a client deal
- Show up day-of if your work is on-site (installations, photography, etc)
- Help share when we feature your work

**How to plug in:**
- Reply via the artist intake form (link)
- Or DM Candy / DCoop / Zaal directly with portfolio
- Bring an idea, not a pitch deck

**Subnav:** Past visual work (PALOOZA + CHELLA archive) | Brand kit guide | Open briefs

---

### `/event-organizers` - For people who want to run their own ZAO chapter

**Hero:** "Built a community? Run your own ZAO."
**Subhead:** "ZAOstock is the third event in the ZAO Festivals series after PALOOZA NYC and CHELLA Miami. The next one could be yours - in your city, with your community, under the ZAO Festivals umbrella."

**What you get:**
- The full ZAOstock playbook (run-of-show, sponsor framework, fiscal sponsor infrastructure via NMC + Fractured Atlas, finders fee structure, livestream rig, partner template)
- Access to the 100+ artist ZAO community for booking
- Brand co-presentation (your event runs as ZAO-{YourCity} with shared visual identity)
- Coaching from Zaal + the team during your first event
- Revenue split per event - we work out the deal per-city based on what you bring

**What we ask:**
- Real local roots in your city (you can answer "why your city?" without flinching)
- Capacity to land a venue + permits + day-of crew - we coach but you operate
- Participation in the broader ZAO Festivals brand (not your own competing brand)
- Honest financial reporting - same break-even ethos that shapes ZAOstock

**How to plug in:**
- Apply via the event-organizer intake form (link)
- Or schedule a 30-min intro call with Zaal
- Open conversations now for 2027 events - first city to commit gets the slot

**Subnav:** Past events (PALOOZA + CHELLA recap pages when built) | Operator playbook | FAQ for organizers

---

## Implementation pattern (reusable for all 3 pages)

Each page uses the same component spine:

```
<EntryPageHero
  persona={...}
  hero={...}
  subhead={...}
/>
<WhatYouGet items={[...]} />
<WhatWeAsk items={[...]} />
<HowToPlugIn ctas={[...]} />
<EntryPageFooter linkBack="/" />
```

This becomes a generic `EntryPage` component in `src/components/entry/` plus 3 thin wrappers - one per persona. Future personas (volunteers, sponsors-self-serve, artists-already-with-an-ask) can spin up by adding new wrappers.

## Action Bridge - new todos spawned

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build EntryPage component + 3 thin wrappers (`/musicians`, `/artists`, `/event-organizers`) | Marketing + Ops | code | Pre-deck week (May 14) ideally; otherwise post-deck |
| Wire entry-page CTAs to forms (musician intake, artist intake, event-organizer intake) | Marketing | code | After EntryPage scaffold lands |
| Add link-out from main `/` nav once pages exist (replaces or supplements current Volunteer / Sponsor) | Marketing | nav update | Same PR as EntryPage |
| Build PartnerDashboardPage pattern (RSV.Pizza-inspired) so Shawn can edit Web3Metal partner profile | Ops | code | Q2 2026 |
| Build CheckInPage with QR codes for Oct 3 attendance | Host + Ops | code | Pre-Oct 3 |
| Build PublicReportPage for post-event recap | Marketing + Livestream | code | Post-Oct 3 |
| Document reusable component library + add CONTRIBUTING.md rule "no raw inputs - use IconInput" pattern | Ops | docs | Next refactor |

## Also See

- [Doc 502](../../governance/502-zaostock-circles-v1-spec/) - 6-circle structure
- [Doc 547](../../community/547-cassie-validation-zaostock-strategy/) - Cassie strategy validation
- [Doc 609](../../events/609-zaostock-cobuild-six-circles-may4/) - May 4 cobuild meeting transcript
- [Doc 610](../../infrastructure/610-zaostock-database-consolidation-may4-5/) - DB consolidation post-mortem

## Sources

- [RSV.Pizza homepage](https://rsv.pizza) - JS-rendered, used GitHub repo source for component + page inventory
- [PizzaDAO/rsv-pizza GitHub](https://github.com/PizzaDAO/rsv-pizza) - earlier session research, page list + CLAUDE.md component rules
- [IYKYK on blank.space](https://iykyk.blank.space) - meta description: "Social hub for the IYKYK community. Create, customize, and explore the IYKYK ecosystem."
- [iykyk.com](https://iykyk.com) - "share yourself, on purpose" framing for related but separate brand
- Doc 609 (May 4 ZAOstock cobuild) - 6-circle structure that informs entry-page audiences
