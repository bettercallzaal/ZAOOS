---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-04-30
related-docs: 311
tier: STANDARD
---

# 570 — ZAOstock Landing Redesign: Godly + Festival Patterns

> **Goal:** Move the ZAOstock public landing from a uniform list of dark cards to a poster-grade festival site that sells the experience. Concrete patterns from godly.website + working festival sites, mapped to current page sections.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | DROP `max-w-2xl` on hero. Go full-bleed (100vw, padded) for hero + lineup + past events | Current narrow column reads as a doc, not a poster. Festivals sell atmosphere, atmosphere needs width. |
| 2 | USE a kinetic CSS marquee for the lineup row, even pre-announce | The "Full lineup coming soon" text card is dead space. Acid-yellow scrolling marquee teases scale + builds FOMO with zero JS. Pattern lifted from VOLTAGE/Sonic Fest + Coachella. |
| 3 | USE one display type family for headers (e.g. PP Neue Machina, Editorial New, or Migra) + keep system sans for body | Single sans across all sections is the #1 reason the page reads "basic". Two-family system instantly elevates. |
| 4 | USE the gold `#f5a623` as a true acid accent — high contrast on dark, never gradient-faded into nothing | Current gradients (`from-[#f5a623]/15 via-[#f5a623]/5 to-transparent`) wash the brand color out. Hard contrast > soft glow for festival posters. |
| 5 | ADD a structured fact strip near hero: DATE / VENUE / TIME / GENRE / AFTERPARTY in a 5-col mono-style row | MUTEK + VOLTAGE + Field Day all use this. Festival visitors scan facts first, copy second. |
| 6 | USE asymmetric 2-col layouts below the fold (story left, facts right; cypher big, team small) | Current vertical-stack-of-equal-cards has no visual rhythm. Asymmetry creates hierarchy. |
| 7 | USE image-led past event cards (even with placeholder gradients + big type for now) | Past Events as text-only kills FOMO. Glastonbury + Paleo build their entire identity off past-edition imagery. |
| 8 | ADD a mobile sticky action bar (RSVP / Volunteer / Cypher) | Three CTAs are scattered down the page. Festival pages convert via persistent CTA. |

## Patterns Worth Stealing

- **Asymmetric grid-breaking hero** (godly.website featured Spring/Summer, Lusion, Tatem; VOLTAGE/Sonic Fest demo) — text and date overlap, type breaks the grid, one acid accent color.
- **Kinetic typographic marquee for lineup** (VOLTAGE/Sonic Fest, Coachella, Primavera) — pure CSS infinite horizontal scroll of artist names in massive type, no JS, perfect Lighthouse.
- **5-column fact strip** (MUTEK Montreal, Field Day) — `DATE | VENUE | TIME | CAPACITY | AFTERPARTY` mono-style, all caps, tiny labels above values.
- **Poster-as-hero** (Paleo, MUTEK, Glastonbury) — annual identity is graphic art, not a hero photo. ZAOstock can ship a Year 1 poster from the volunteer pool.
- **FOMO ticket / RSVP language** (VOLTAGE: "Once they're gone, they're gone") — Currently RSVP copy is "Be the first to know". Sharper: "Limited capacity. Get on the list before tickets drop."
- **Color modes / accessibility toggle** (Glastonbury 2025) — Greyscale + high-contrast modes are a power move for community accessibility. ZAOstock could add a `?contrast=high` query.
- **Manifesto block** (VOLTAGE: "If you leave sober, we have failed.") — One short, bold, opinionated line per festival. ZAOstock's "Operates at break-even / no margin / no extraction" is buried in a chip row when it deserves a 4xl headline.
- **Massive fluid typography as load-bearing structure** (godly.website common move) — `clamp(3rem, 12vw, 12rem)` size for hero. Type IS the layout.

## ZAOstock-Specific Recommendations (mapped to `src/app/page.tsx`)

### Hero (lines 132-143)
- Full-bleed (drop max-w-2xl wrapper for this section). Center align stays.
- Massive display headline: `ZAOstock` at clamp(4rem, 14vw, 12rem), display family, tracking tight.
- Beneath: split into 5-col mono fact strip — `OCT 03 2026 / FRANKLIN ST PARKLET / 12-6 PM / 10 ARTISTS / AFTERPARTY @ BLACK MOON`. All-caps 11px labels, sans-serif 14-16px values, separated by `|`.
- Drop the rounded chip date pill — it competes with the headline.
- Background: subtle dot/grid pattern OR a single large hero photo (Ellsworth main street, Acadia coast, or Year-1 poster art).

### Countdown (lines 146-148)
- Keep, but place INSIDE the fact strip, not its own card. Or scale up to 6xl numbers and put under hero, no card chrome.

### About (lines 151-165)
- Split 2-col on desktop: left = paragraph copy, right = key facts as `<dl>` (Crossroads of Downeast, Maine Craft Weekend, walk-on day, free entry status).
- Pull-quote: "Where every car heading to Acadia passes through" at 3xl, gold accent rule.

### How We Run It (lines 168-181)
- Promote from chip-row buried section to a manifesto block.
- Single line at 4xl: "Built by the community. No margin. No extraction."
- 3 stat tiles below: `100% to artists+production` / `0% margin` / `501(c)(3) deductible`.

### Lineup (lines 184-190)
- Replace dead "coming soon" card with kinetic CSS marquee:
  - 10 placeholder slots: `TBA · TBA · DJ · TBA · TBA · CYPHER · TBA · DJ · TBA · TBA`
  - Scrolling left-to-right at ~30s loop, gold-on-navy, 6xl type.
  - Single sentence under: "Lineup announced August 2026. RSVP to get notified."

### Team (lines 193-199)
- Current `PublicTeamGrid` likely uniform. Recommend mosaic: 1 large featured member (Tom Fellenz / lead organizer) + 6 small + 4 medium. Mix sizes via CSS grid `grid-auto-flow: dense`.
- Hover state: name + role overlay (currently only avatar).

### Partners (lines 202-217)
- Replace 2-col text cards with logo grid. Solicit logos from the 3 confirmed partners.
- "Confirmed" pill stays; pending partners get a dotted border instead of solid.

### Cypher CTA (lines 220-234)
- Promote to secondary hero. Full-bleed on mobile, 60vw on desktop.
- Add visual element: vinyl/waveform/cypher graphic on the right.
- Keep gold button — make it bigger (text-base, py-4).

### Volunteer (lines 237-261)
- Combine with RSVP into a `JOIN` block: 2-col grid, Volunteer left, RSVP right.
- Sticky-bar this pair to mobile bottom on scroll.

### Sponsorship (lines 286-313)
- Keep 3-tier structure but redesign tier cards as poster panels:
  - Big tier name in display type, gold rule under, items as numbered list (not bullets).
  - Tiers stack on mobile, 3-up on desktop.
- Move "All contributions tax-deductible via Fractured Atlas" to a callout strip with the seal/logo, not buried in paragraph.

### Past Events (lines 316-327)
- Image-led cards. Even placeholder: gradient + huge year + name overlay.
- 2-up grid on desktop. Add a third "ZAOstock 2026 — coming up" forward-looking card to bridge past + future.

### Footer (lines 345-350)
- Keep minimal. Add a "Color mode" toggle (normal / greyscale / high-contrast) inspired by Glastonbury — useful + signals accessibility care.

## Components to Build

1. `<LineupMarquee>` — pure CSS infinite scroll, takes `slots: string[]`, `speed: number`.
2. `<DisplayHero>` — full-bleed wrapper with massive type + fact strip slot.
3. `<FactStrip>` — 5-col responsive `<dl>` with mono labels + sans values.
4. `<StatTile>` — number + label, used in How-We-Run-It and Volunteer counter.
5. `<TeamMosaic>` (replace `<PublicTeamGrid>` or extend) — scale-variation grid.
6. `<TierPanel>` — sponsor tier as poster panel.
7. `<PastEventCard>` — image/gradient hero + year + name overlay.
8. `<StickyActionBar>` — mobile-only fixed bottom dock with RSVP + Volunteer + Cypher.
9. `<ColorModeToggle>` — normal / greyscale / high-contrast (CSS var swap).

## Type System (concrete)

- Display: PP Neue Machina (paid), or free alts: Space Grotesk Bold, Bricolage Grotesque, Migra Italic. Use for `<h1>`, `<h2>`, marquee, manifesto.
- Body: Inter or system sans (current). Use for paragraphs + labels.
- Mono accent: JetBrains Mono or IBM Plex Mono for the fact strip labels.
- Sizes: hero clamp(4rem, 14vw, 12rem); section headers clamp(2.5rem, 6vw, 5rem); body 15-16px; mono labels 11px uppercase tracking-[0.15em].

## Color (concrete)

- Keep navy `#0a1628` (bg) + card `#0d1b2a`.
- Promote gold `#f5a623` to acid accent — high contrast, no fade-out gradients except on hero scrim.
- Add a single secondary: forest green `#1a4d3a` or warm rust `#c4471f` (one, not both) for cypher/past-events differentiation. Maine + harvest-season vibe.
- Border: `white/[0.08]` is fine. Promote to `white/[0.12]` for primary cards to lift them.

## Also See

- [Doc 311 — Vibe-coded apps marketing playbook](../../311-vibe-coded-apps-marketing-playbook/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve direction (full-bleed + marquee + display type) | @Zaal | Decision | Before code work |
| Pick display font (Space Grotesk free vs PP Neue Machina paid) | @Zaal | Decision | Before code work |
| Source Year-1 hero poster art (volunteer artist commission) | @Zaal | Outreach | 2026-05-15 |
| Build `LineupMarquee` + `DisplayHero` + `FactStrip` components | @Claude | PR | 2026-05-07 |
| Refactor `src/app/page.tsx` to new section structure | @Claude | PR | 2026-05-07 |
| Solicit partner logos from Heart of Ellsworth, Town of Ellsworth, Fractured Atlas | @Zaal | Outreach | 2026-05-15 |
| Add color-mode toggle (Glastonbury-style accessibility) | @Claude | PR | After main redesign |

## Sources

- [Godly homepage](https://godly.website/) — verified 2026-04-30. Tag pages `/tags/music` + `/tags/dark` returned CRAWL_NOT_FOUND via Exa. Homepage shows the curated set used for pattern extraction.
- [VOLTAGE / Sonic Fest template demo](https://sonic-fest-template.pagesmith.app/) — verified 2026-04-30. Live demo of asymmetric hero + kinetic marquee + manifesto pattern. Strongest single reference for ZAOstock's redesign.
- [Sonic Echo Fest Template / Pagesmith](https://pagesmith.ai/templates/music/sonic-echo-fest) — verified 2026-04-30. Teardown of brutalist festival template, useful for the pattern vocabulary (asymmetric hero, fluid type, CSS marquee).
- [Glastonbury Festival — Line-Up 2025](https://glastonburyfestivals.co.uk/line-up/line-up-2025/?view=poster) — verified 2026-04-30. Color-mode toggle pattern + poster-view lineup display.
- [Paleo Festival — 2025 poster](https://yeah.paleo.ch/en/2024/11/27/affiche-2025) — verified 2026-04-30. Poster-as-hero / annual identity-as-art reference.
- [MUTEK Montreal — 26th edition poster](https://montreal.mutek.org/en/news/official-poster-for-the-26th-edition) — verified 2026-04-30. Minimalist + geometric reference for music-festival graphic identity.
- [Add to Calendar Pro — 8 Inspiring Event Landing Page Examples for 2025](https://add-to-calendar-pro.com/articles/event-landing-page-examples) — verified 2026-04-30. Synthesis of Coachella/Bonnaroo patterns: video hero, lineup-as-art, FOMO mechanics.
- [Creative Boom — Echo Festival branding brief](https://www.creativeboom.com/inspiration/boom-brief-3-how-you-met-our-challenge-to-brand-a-coastal-festival/) — verified 2026-04-30. Bold typography + acid color palette references.
- [Bootcamp / Shivam Maan — Divine landing page case study](https://bootcamp.uxdesign.cc/ui-ux-case-study-designing-a-landing-page-for-divines-first-live-show-since-the-pandemic-d4116fbc449a) — verified 2026-04-30. Hero anatomy + lineup hierarchy walkthrough.
