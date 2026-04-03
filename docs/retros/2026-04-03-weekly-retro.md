# Weekly Retro — 2026-04-03

## Week Summary

One of ZAO OS's most productive weeks on record: 100 commits, 26+ merged PRs, shipping the full public web presence (Stock, Festivals, Community, Calendar, Leaderboard, Nexus), hardening the Farcaster miniapp, and expanding the Paperclip agent ecosystem with two new bidirectional plugins. Nearly half the week was fixes — the codebase is maturing fast and the team is closing quality gaps as quickly as they open new surface area.

---

## By the Numbers

| Metric | Count |
|--------|-------|
| Total commits | 100 |
| Merged PRs | ~26 |
| Closed issues | — (no gh CLI access; check GitHub) |
| Features (`feat:`) | 30 |
| Fixes (`fix:`) | 28 |
| Chores (`chore:`) | 6 |
| Research docs (`research:`) | 6 |
| Docs (`docs:`) | 2 |
| Fix ratio | 48% |

**Fix ratio interpretation:** Near-parity between features and fixes is healthy — the team is shipping ambitiously while closing gaps, not accumulating debt.

---

## Features Shipped

### Public Presence
- **ZAO Stock landing page** (`/stock`) — full content: What is The ZAO, After-Party, Past Events, FAQ, tax-deductible notice (NMC/Fractured Atlas), social links, OG image
- **ZAO Festivals page** (`/festivals`) — festival images organized under `public/images/festivals/`
- **ZAO Leaderboard** (`/leaderboard`) — Respect rankings + podium
- **Calendar** (`/calendar`) — recurring events + subscribe links
- **Community directory** (`/community`) — member directory page
- **Nexus hub** (`/nexus`)

### Social & Community
- **Community tab** — who's online, stats dashboard, activity feed
- **Engagement heatmap** + community milestones + leaderboards
- **Force graph** — better tooltip, zoom controls, search, error boundary
- **Member map** + daily spotlight on community tab
- **Expanded channel clusters** — all members, all channels, your channels
- **Dynamic channel discovery** for conversation clusters
- **Assistant + Notifications** added to BottomNav More menu

### Miniapp & Farcaster
- **fc:miniapp per-page embed tags** + new API tests
- **Miniapp security upgrade** + SDK enhancements + 4 research docs
- **Farcaster Agentic Bootcamp** research (doc 240) — SIWA, ERC-8004, miniapp patterns, sessions 1–3

### Spaces & Audio
- **6 Spaces upgrades** — token refresh, recording, noise cancellation, participants, closed captions, quality
- **Audio provider abstraction** — 100ms + Stream.io selectable per room
- **Stream.io webhook endpoint** + grant config script

### Agent & Research
- **ClawDown poker agent (ZOE)** — research doc + WebSocket client
- **Paperclip plugin: `@zao/plugin-farcaster-notifications`** — bidirectional Farcaster integration
- **Paperclip plugin: `@zao/plugin-supabase-sync`** — bidirectional Supabase connector
- **Q1 2026 Big Wins** research doc + recap post draft + `/big-win` skill
- **`/zao-stock` skill** + DFresh profile + NMC info

### Ecosystem / WaveWarZ
- **Ecosystem sub-page tabs** with persistent iframes (no reload on switch)
- **WaveWarZ tab order fix** — Analytics before Intelligence
- **Customizable sponsorship menu** — two-track: local + digital partners

### Forkability
- `FORK.md`, `AGENTS.md`, `CONTRIBUTING.md` — full forkability documentation

---

## Bugs Fixed

- Spaces speaker role — non-host now explicitly set as speaker on join (issue #78)
- Audio background playback — don't route through AudioContext unless EQ active
- Admin panel — decluttered header, grouped tabs, extracted modal, collapsible stats
- Miniapp SDK — removed non-existent `sdk.create` type and `miniAppOnExit` call
- ESLint warnings blocking CI (under max-warnings 15)
- CI green — jsdom setup, lint fixes, CSP hardening, secret scrub
- Slug URLs, host mic enable, Stream host role
- Twitch embeds CSP unblock + screen share content area height
- Admin spaces list — fixed `select(*)` missing column errors
- Spaces audit fixes — atomic counts, token expiry, realtime, routing, cleanup
- Room creation 500 — missing provider column
- Admin can end spaces + broken guest flow
- `total_respect` = max(calculated, onchain_og) in enrichment
- `@ts-expect-error` cleanup (type declaration now exists)
- 15 medium severity issues — validation, error states, cleanups
- 14 a11y + low severity issues from audit
- 10 component bugs — setState, auth, memory, UX
- 7 critical/high API security + correctness issues

---

## Build-in-Public Draft

**Thread for Farcaster / X (post as separate casts):**

1. **We shipped a lot this week.** 100 commits, ~26 PRs merged into ZAO OS. Public presence is live: `/stock`, `/festivals`, `/community`, `/calendar`, `/leaderboard`, `/nexus`. The ZAO now has a front door.

2. **Miniapp hardening.** We upgraded our Farcaster miniapp with security best practices from the Agentic Bootcamp (SIWA, ERC-8004 patterns). Our app now embeds `fc:miniapp` tags on every relevant page — fans can launch ZAO directly from any Farcaster cast.

3. **Spaces got 6 upgrades.** Token auto-refresh, recording URLs, noise cancellation, participant counts via webhook, closed captions, and quality controls. Plus audio abstraction — we can now swap between 100ms and Stream.io per room.

4. **ZOE (our AI agent) can now play poker.** ClawDown is a WebSocket-based poker agent that runs on our VPS. Separate from music, but same infrastructure — it validates our agentic pipeline for everything we're building next.

5. **Next up:** Respect-weighted music scrobbling, on-chain NFT minting for governance voters, and artist subscription tiers. The decentralized music label is coming into focus.

---

## Next Week Focus

Based on open items and momentum:

1. **Music scrobbling** — 0% complete per research scoreboard; biggest gap in music layer
2. **On-chain NFT minting** for governance participation (Mirror "Subscribe to Mint" adaptation from today's inspiration)
3. **Artist subscription tiers** — inner circle layer on top of existing gate (Sound.xyz lesson)
4. **Nav personalization** — user-level pin/reorder (Linear lesson)
5. **Miniapp gaps** — review Farcaster Agentic Bootcamp sessions 1–3 for remaining hardening items
6. **Lint fix** — `node_modules` issue flagged in today's brief; run `npm install` before anything else
