# ZAO Stock & ZAO Festivals — Website Pages Spec

## Confirmed Requirements
- **Public pages** (no auth required)
- **ZAO Stock logo:** `ZAO-STOCK/assets/zao-stock-logo.jpeg` (black bg, cream text, lightning + music notes + mountains)
- **Color scheme:** Black/cream from logo + ZAO navy #0a1628 + gold #f5a623
- **Mobile-first**, dark theme

---

## Page 1: ZAO Stock Landing (`/stock`)

### Hero Section
- ZAO Stock logo (large, centered)
- "October 3, 2026"
- "Franklin Street Parklet, Downtown Ellsworth, Maine"
- "Part of Art of Ellsworth: Maine Craft Weekend"
- CTA button: "RSVP Free" (links to simple form or external, TBD)

### About Section
- Short description: what ZAO Stock is, art first / tech invisible
- "A 1-day outdoor music showcase during Maine Craft Weekend. 10 artists. 12pm-6pm. Free entry."

### Lineup Section
- **"Coming Soon"** placeholder for now
- Grid layout ready for artist cards (photo + name + genre)
- Will be populated as artists confirm

### Schedule Section
- "12:00 PM — 6:00 PM"
- "Artists performing throughout the day"
- After-party note: "Continue the evening at Black Moon Public House"
- Detailed set times added later

### Location Section
- Map embed (Mapbox or static image) pointing to Franklin Street Parklet
- Address: "Franklin Street (between Main St & Store St), Ellsworth, ME 04605"
- "Adjacent to City Hall"
- Getting there: driving directions from Bangor (~30 min), Bar Harbor (~20 min)
- Parking note: downtown municipal parking available

### Virtual Section
- "Can't make it in person? We're livestreaming the entire event on ZAO OS"
- Link to ZAO OS Spaces (day-of)
- "Leading up to ZAO Stock: virtual events April-September" — link to /festivals

### Sponsors Section
- "Become a Sponsor" CTA
- Sponsor tier descriptions (Community $500, Stage $2,500, Title $5,000, Founding $10,000)
- Sponsor logos (empty for now, grid ready)

### Support Section
- Giveth donation link
- GoFundMe link
- "Help us bring ZAO Stock to life"

### Footer
- "Presented by The ZAO | Part of Art of Ellsworth: Maine Craft Weekend"
- Links: thezao.com, heartofellsworth.org, mainecraftweekend.org
- Social links

---

## Page 2: ZAO Festivals (`/festivals`)

### Hero
- "ZAO Festivals" header
- "Where music meets community. Art first. Tech invisible."

### Timeline of Events (chronological)

#### Past Events
- **ZAO-PALOOZA** — NYC, NFT NYC 2024
  - 12 artists (6 new to Web3)
  - ZAO Cards on Manifold
  - Community met IRL for first time
  - Photo/recap

- **ZAO-CHELLA** — Wynwood, Miami, Art Basel 2024
  - 10 artists
  - AR art installations
  - WaveWarZ LIVE battle
  - Student $LOANZ Gold Sponsor
  - Photo/recap

#### Upcoming Events (2026)
- **COC Concertz** (Virtual, ongoing)
  - "Live performances inside the metaverse"
  - Free entry, Spatial.io
  - 4 events and counting
  - Hosted by The ZAO + Community of Communities
  - Link: cocconcertz.com

- **ZAO Stock** — Ellsworth, Maine, October 3, 2026
  - Flagship outdoor music festival
  - Part of Maine Craft Weekend
  - Link to /stock page

- **ZAOVille** — DMV (Maryland/DC/Virginia), 2026
  - Regional ZAO festival
  - Organized by DCoop
  - "Same spirit, different city"

### Bottom CTA
- "Want to bring ZAO to your city? Get in touch"
- Contact link

---

## Technical Implementation Notes

### Route Structure
```
src/app/stock/page.tsx          ← Public ZAO Stock page (NO auth group)
src/app/festivals/page.tsx      ← Public ZAO Festivals page (NO auth group)
```

### Components Needed
```
src/components/stock/
├── StockHero.tsx               ← Logo + date + location
├── StockLineup.tsx             ← Artist grid (coming soon state)
├── StockSchedule.tsx           ← Schedule timeline
├── StockLocation.tsx           ← Map + directions
├── StockSponsors.tsx           ← Sponsor tiers + logos
├── StockSupport.tsx            ← Crowdfunding links

src/components/festivals/
├── FestivalsHero.tsx           ← Header
├── FestivalCard.tsx            ← Reusable card for each event
├── FestivalTimeline.tsx        ← Past + upcoming events
```

### Assets
- Logo: `public/images/zao-stock-logo.jpeg` (copy from ZAO-STOCK/assets/)
- Event photos from past events (PALOOZA, CHELLA)

### Data
- No database needed initially — hardcoded event data in components
- Future: Supabase `events` table for dynamic content + RSVP tracking

### Key ZAO OS Patterns to Follow
- `"use client"` for interactive components
- Tailwind CSS v4, dark theme (navy #0a1628, gold #f5a623)
- `@/` import alias
- Mobile-first responsive design
- `next/dynamic` for heavy components if needed
- Follow patterns from existing pages like `src/app/page.tsx` (landing)
