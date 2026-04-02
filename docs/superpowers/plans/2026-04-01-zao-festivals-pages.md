# ZAO Festivals & ZAO Stock Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public `/festivals` and `/stock` pages on ZAO OS for promoting ZAO events (ZAO-PALOOZA, ZAO-CHELLA, COC Concertz, ZAO Stock, ZAOVille)

**Architecture:** Two public Next.js pages (no auth required) with static/hardcoded content. The `/festivals` page is the hub for all ZAO events. The `/stock` page is the dedicated ZAO Stock October 3 2026 landing page. Both follow the existing landing page pattern (`src/app/page.tsx`) — dark theme, gold accents, mobile-first.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, `next/image` for optimized images, server components (no client-side state needed initially)

---

### Task 1: Copy Logo Asset to Public

**Files:**
- Create: `public/images/zao-stock-logo.jpeg`

- [ ] **Step 1: Copy the ZAO Stock logo to public folder**

```bash
cp "ZAO-STOCK/assets/zao-stock-logo.jpeg" "public/images/zao-stock-logo.jpeg"
```

- [ ] **Step 2: Verify file exists**

```bash
ls -la public/images/zao-stock-logo.jpeg
```
Expected: File exists, ~200KB+

- [ ] **Step 3: Commit**

```bash
git add public/images/zao-stock-logo.jpeg
git commit -m "assets: add ZAO Stock logo"
```

---

### Task 2: ZAO Stock Landing Page (`/stock`)

**Files:**
- Create: `src/app/stock/page.tsx`

- [ ] **Step 1: Create the stock route directory**

```bash
mkdir -p src/app/stock
```

- [ ] **Step 2: Write the ZAO Stock page**

```tsx
// src/app/stock/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ZAO Stock — October 3, 2026 | Ellsworth, Maine',
  description:
    'A 1-day outdoor music festival during Maine Craft Weekend. 10 artists. Art first. Tech invisible. Franklin Street Parklet, Downtown Ellsworth.',
  openGraph: {
    title: 'ZAO Stock — October 3, 2026',
    description:
      'A 1-day outdoor music festival during Maine Craft Weekend. Art first. Tech invisible.',
    url: 'https://zaoos.com/stock',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO Stock — October 3, 2026',
    description:
      'A 1-day outdoor music festival during Maine Craft Weekend. Art first. Tech invisible.',
  },
};

const SPONSOR_TIERS = [
  { name: 'Community', price: '$500', perks: 'Logo on event page + social shoutout' },
  { name: 'Stage', price: '$2,500', perks: 'Stage naming, logo at venue, 2 VIP passes' },
  { name: 'Title', price: '$5,000', perks: '"Presented by" billing, prime placement, 5 VIP' },
  { name: 'Founding', price: '$10,000', perks: 'Multi-year partnership, permanent recognition' },
];

export default function StockPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a1628] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#f5a623]/[0.015] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Nav back */}
        <nav className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            &larr; ZAO OS
          </Link>
          <Link
            href="/festivals"
            className="text-gray-400 hover:text-[#f5a623] text-sm transition-colors"
          >
            All Festivals
          </Link>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center px-6 pt-8 pb-12">
          <Image
            src="/images/zao-stock-logo.jpeg"
            alt="ZAO Stock Music Event"
            width={300}
            height={300}
            className="rounded-2xl shadow-2xl shadow-[#f5a623]/10 mb-8"
            priority
          />
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight text-center">
            October 3, 2026
          </h1>
          <p className="text-[#f5a623] text-lg md:text-xl font-medium mb-1">
            Franklin Street Parklet
          </p>
          <p className="text-gray-400 text-sm mb-1">Downtown Ellsworth, Maine</p>
          <p className="text-gray-500 text-xs mb-8">
            Part of Art of Ellsworth: Maine Craft Weekend
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
              12pm &ndash; 6pm
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
              10 Artists
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
              Free Entry
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400">
              Livestreamed
            </span>
          </div>
        </section>

        {/* About */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">About</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            ZAO Stock is The ZAO&apos;s flagship outdoor music festival &mdash; a day of live
            performances celebrating independent artists who own their work. Art first. Tech
            invisible.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Embedded within the 9th Annual Art of Ellsworth: Maine Craft Weekend, ZAO Stock
            brings the global onchain music community to Downeast Maine for craft demos,
            live music, and community connection &mdash; with an after-party at Black Moon
            Public House.
          </p>
        </section>

        {/* Lineup */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Lineup</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
            <p className="text-2xl mb-2">&#127925;</p>
            <p className="text-gray-300 font-medium mb-1">Coming Soon</p>
            <p className="text-gray-500 text-sm">
              10 artists performing throughout the day. Stay tuned.
            </p>
          </div>
        </section>

        {/* Schedule */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Schedule</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <span className="text-[#f5a623] text-sm font-mono w-20 shrink-0">12:00 PM</span>
              <span className="text-gray-300 text-sm">Doors open &mdash; ZAO Stock begins</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[#f5a623] text-sm font-mono w-20 shrink-0">12 &ndash; 6</span>
              <span className="text-gray-300 text-sm">
                Live performances, DJ sets, community vibes
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[#f5a623] text-sm font-mono w-20 shrink-0">6:00 PM</span>
              <span className="text-gray-300 text-sm">
                Sunset &rarr; After-party at Black Moon Public House
              </span>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Location</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <p className="text-white font-medium mb-1">Franklin Street Parklet</p>
            <p className="text-gray-400 text-sm mb-1">
              Franklin St (between Main St &amp; Store St)
            </p>
            <p className="text-gray-400 text-sm mb-4">Ellsworth, ME 04605</p>
            <p className="text-gray-500 text-xs mb-4">
              Adjacent to City Hall &bull; Downtown Ellsworth &bull; ~30 min from Bangor &bull; ~20
              min from Bar Harbor
            </p>
            <a
              href="https://maps.google.com/?q=Franklin+Street+Parklet+Ellsworth+Maine"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#f5a623] text-sm hover:underline"
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        </section>

        {/* Livestream */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Watch Live</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
            <p className="text-gray-300 text-sm mb-2">
              Can&apos;t make it to Ellsworth? We&apos;re livestreaming the entire event.
            </p>
            <p className="text-gray-500 text-xs">
              Livestream link will appear here on October 3.
            </p>
          </div>
        </section>

        {/* Sponsors */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Become a Sponsor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPONSOR_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
              >
                <p className="text-[#f5a623] font-bold text-lg">{tier.price}</p>
                <p className="text-white font-medium text-sm mb-1">{tier.name}</p>
                <p className="text-gray-500 text-xs">{tier.perks}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-4">
            <a
              href="mailto:zaal@thezao.com?subject=ZAO%20Stock%20Sponsorship"
              className="text-[#f5a623] text-sm hover:underline"
            >
              Contact us about sponsorship &rarr;
            </a>
          </p>
        </section>

        {/* Support */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Support ZAO Stock</h2>
          <p className="text-gray-400 text-sm mb-4">
            Help us bring ZAO Stock to life. Every contribution goes directly to artist travel,
            production, and making this event happen.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://giveth.io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-sm font-medium hover:bg-[#f5a623]/15 transition-colors"
            >
              Donate on Giveth
            </a>
            <a
              href="https://gofundme.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              GoFundMe
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/[0.06] max-w-2xl mx-auto">
          <p className="text-gray-500 text-xs text-center mb-2">
            Presented by{' '}
            <a href="https://thezao.com" className="text-gray-400 hover:text-white">
              The ZAO
            </a>{' '}
            &bull; Part of{' '}
            <a
              href="https://www.heartofellsworth.org/artofellsworth"
              className="text-gray-400 hover:text-white"
            >
              Art of Ellsworth
            </a>
            :{' '}
            <a
              href="https://mainecraftweekend.org"
              className="text-gray-400 hover:text-white"
            >
              Maine Craft Weekend
            </a>
          </p>
          <p className="text-gray-600 text-xs text-center">
            Art first. Tech invisible. Community forever.
          </p>
        </footer>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and verify page renders**

```bash
npm run dev
```
Open `http://localhost:3000/stock` — should see the ZAO Stock landing page with logo, date, all sections.

- [ ] **Step 4: Commit**

```bash
git add src/app/stock/page.tsx
git commit -m "feat: add ZAO Stock landing page (/stock)"
```

---

### Task 3: ZAO Festivals Page (`/festivals`)

**Files:**
- Create: `src/app/festivals/page.tsx`

- [ ] **Step 1: Create the festivals route directory**

```bash
mkdir -p src/app/festivals
```

- [ ] **Step 2: Write the ZAO Festivals page**

```tsx
// src/app/festivals/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ZAO Festivals — Where Music Meets Community',
  description:
    'ZAO brings music artists together IRL and virtually. ZAO-PALOOZA, ZAO-CHELLA, COC Concertz, ZAO Stock, ZAOVille.',
  openGraph: {
    title: 'ZAO Festivals',
    description: 'Where music meets community. Art first. Tech invisible.',
    url: 'https://zaoos.com/festivals',
  },
};

interface FestivalEvent {
  name: string;
  location: string;
  date: string;
  description: string;
  status: 'past' | 'upcoming' | 'ongoing';
  link?: string;
  externalLink?: string;
  highlights?: string[];
}

const EVENTS: FestivalEvent[] = [
  {
    name: 'ZAO-PALOOZA',
    location: 'NYC — NFT NYC 2024',
    date: 'April 2024',
    description:
      '12 artists (6 new to Web3) performed live. ZAO Cards on Manifold. The community met in person for the first time.',
    status: 'past',
    highlights: ['12 artists', '6 new to Web3', 'ZAO Cards on Manifold'],
  },
  {
    name: 'ZAO-CHELLA',
    location: 'Wynwood, Miami — Art Basel 2024',
    date: 'December 2024',
    description:
      '10 artists performed with AR art installations, collectible trading cards, and a WaveWarZ LIVE battle. Student $LOANZ Gold Sponsor.',
    status: 'past',
    highlights: ['10 artists', 'AR art installations', 'WaveWarZ LIVE', 'Art Basel'],
  },
  {
    name: 'COC Concertz',
    location: 'Virtual — Spatial.io',
    date: 'Ongoing',
    description:
      'Live performances inside the metaverse. Free entry. No tickets needed. Bringing ZAO artists to virtual stages around the world.',
    status: 'ongoing',
    externalLink: 'https://cocconcertz.com',
    highlights: ['4 events and counting', 'Free entry', 'Spatial.io'],
  },
  {
    name: 'ZAO Stock',
    location: 'Ellsworth, Maine',
    date: 'October 3, 2026',
    description:
      'The flagship outdoor music festival. 10 artists. 12pm-6pm at the Franklin Street Parklet during Art of Ellsworth: Maine Craft Weekend.',
    status: 'upcoming',
    link: '/stock',
    highlights: ['10 artists', 'Maine Craft Weekend', 'Livestreamed', 'Free entry'],
  },
  {
    name: 'ZAOVille',
    location: 'DMV (Maryland / DC / Virginia)',
    date: '2026',
    description:
      'A regional ZAO festival bringing the same spirit to the DMV. Same name, different city, independent team.',
    status: 'upcoming',
    highlights: ['DMV area', 'Independent team', 'Same ZAO spirit'],
  },
];

function StatusBadge({ status }: { status: FestivalEvent['status'] }) {
  const styles = {
    past: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    ongoing: 'bg-green-500/10 text-green-400 border-green-500/20',
    upcoming: 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20',
  };
  const labels = { past: 'Past', ongoing: 'Ongoing', upcoming: 'Upcoming' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function FestivalsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a1628] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            &larr; ZAO OS
          </Link>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center px-6 pt-8 pb-12">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-3 tracking-tight">
            ZAO Festivals
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-1">
            Where music meets community
          </p>
          <p className="text-gray-500 text-sm">Art first. Tech invisible.</p>
        </section>

        {/* Events */}
        <section className="px-6 pb-16 max-w-2xl mx-auto">
          <div className="space-y-4">
            {EVENTS.map((event) => (
              <div
                key={event.name}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-white font-bold text-lg">{event.name}</h3>
                    <p className="text-gray-400 text-sm">{event.location}</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-[#f5a623] text-sm font-medium mb-2">{event.date}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">
                  {event.description}
                </p>
                {event.highlights && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.highlights.map((h) => (
                      <span
                        key={h}
                        className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                {event.link && (
                  <Link
                    href={event.link}
                    className="text-[#f5a623] text-sm font-medium hover:underline"
                  >
                    Learn more &rarr;
                  </Link>
                )}
                {event.externalLink && (
                  <a
                    href={event.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f5a623] text-sm font-medium hover:underline"
                  >
                    Visit site &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-12 max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2">Want to bring ZAO to your city?</h2>
          <p className="text-gray-400 text-sm mb-4">
            We&apos;re building a multi-city festival network. Get in touch.
          </p>
          <a
            href="mailto:zaal@thezao.com?subject=ZAO%20Festival%20In%20My%20City"
            className="inline-flex px-4 py-2 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-sm font-medium hover:bg-[#f5a623]/15 transition-colors"
          >
            Get in touch &rarr;
          </a>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/[0.06] max-w-2xl mx-auto">
          <p className="text-gray-600 text-xs text-center">
            Presented by{' '}
            <a href="https://thezao.com" className="text-gray-400 hover:text-white">
              The ZAO
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```
Open `http://localhost:3000/festivals` — should see all 5 events (PALOOZA, CHELLA, COC Concertz, ZAO Stock, ZAOVille) with status badges.

- [ ] **Step 4: Commit**

```bash
git add src/app/festivals/page.tsx
git commit -m "feat: add ZAO Festivals page (/festivals)"
```

---

### Task 4: Create ZAO-STOCK Media Folder

**Files:**
- Create: `public/images/festivals/` directory (for future event photos/media)

- [ ] **Step 1: Create the festivals images directory and move logo**

```bash
mkdir -p public/images/festivals
cp public/images/zao-stock-logo.jpeg public/images/festivals/zao-stock-logo.jpeg
```

- [ ] **Step 2: Update the stock page image path**

In `src/app/stock/page.tsx`, change the Image src:
```tsx
// Change:
src="/images/zao-stock-logo.jpeg"
// To:
src="/images/festivals/zao-stock-logo.jpeg"
```

- [ ] **Step 3: Remove the old location**

```bash
rm public/images/zao-stock-logo.jpeg
```

- [ ] **Step 4: Verify dev server still shows logo correctly**

```bash
npm run dev
```
Open `http://localhost:3000/stock` — logo should still render.

- [ ] **Step 5: Commit**

```bash
git add public/images/festivals/ src/app/stock/page.tsx
git commit -m "chore: organize festival images into public/images/festivals/"
```

---

### Task 5: Build Check

**Files:**
- None (verification only)

- [ ] **Step 1: Run the linter**

```bash
npm run lint
```
Expected: No errors related to stock/ or festivals/ pages.

- [ ] **Step 2: Run the build**

```bash
npm run build
```
Expected: Build succeeds. Both `/stock` and `/festivals` are listed as static pages in the build output.

- [ ] **Step 3: Verify both pages in production build**

```bash
npm run start
```
Open `http://localhost:3000/stock` and `http://localhost:3000/festivals` — both render correctly.

- [ ] **Step 4: Final commit if any lint fixes were needed**

```bash
git add -A
git commit -m "fix: lint fixes for festivals pages"
```

---

## Summary

| Task | What | Files | Time |
|------|------|-------|------|
| 1 | Copy logo asset | `public/images/zao-stock-logo.jpeg` | 1 min |
| 2 | ZAO Stock page | `src/app/stock/page.tsx` | 5 min |
| 3 | ZAO Festivals page | `src/app/festivals/page.tsx` | 5 min |
| 4 | Organize media folder | `public/images/festivals/` | 2 min |
| 5 | Build check | Verification | 3 min |

**Total: ~16 minutes**

Both pages are server components (no `"use client"`) — pure static HTML, zero JS shipped to client, instant load. Future enhancements (RSVP form, artist grid with images, countdown timer) can add `"use client"` components as needed.
