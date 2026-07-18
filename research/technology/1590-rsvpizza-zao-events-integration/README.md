---
topic: technology, events, infrastructure
type: research-doc
status: RESEARCH COMPLETE — Use for ZAOstock Oct 3; too late for ZAOville Jul 25
last-validated: 2026-07-20
related-docs: 611-zaostock-brand-patterns-rsvpizza-iykyk, 1541-zaoville-magnetiq-event-brief, 1524-zaostock-day-of-operations-protocol, 670-iman-call-may18-craig-pizzadao
board-tasks: None (responds to "Dive into RSVPizza repo + dashboard")
action-owner: Iman (repo deep-dive, configured instance); Zaal (decides which events to use it for)
---

# 1590 — RSVPizza Repo + Dashboard Dive: ZAO Events Integration

> **What this is:** Research doc for the board task "Dive into RSVPizza repo + dashboard." RSVPizza (`github.com/PizzaDAO/rsv-pizza`) is PizzaDAO's open-source event management platform. This doc covers the current repo state, what it actually does, how ZAO can use it for ZAOstock Oct 3, and why it's too late for ZAOville Jul 25 (use Magnetiq for that instead).

---

## What RSVPizza Is (Current State)

**RSVPizza** is an open-source event management web app built by PizzaDAO for their worldwide pizza events. It handles the full event lifecycle: partner onboarding, attendee check-in, day-of venue display, and post-event recap.

**Live example:** Any PizzaDAO event page — Zambia, Miami, NYC, etc. The same code runs every local chapter's event.

**Stack:** React/Next.js frontend, Supabase backend, Vercel deployment. This is the same stack ZAO uses (zaalcaster, ZABAL) — ZAO engineers can read this code.

**Key distinction from Eventbrite:**
- RSVPizza is designed for free community events with no ticketing
- Its value is in the day-of operations layer (QR check-in, partner dashboard, venue display)
- Eventbrite handles paid-ticket events and broad discovery
- ZAOstock needs BOTH: Eventbrite for pre-event discovery + RSVPizza for day-of operations

---

## What RSVPizza Does (Pages + Features)

From doc 611 (May 2026 analysis) + current repo reading:

| Page | What it does | ZAO need |
|------|-------------|----------|
| **CheckInPage** | QR code scanner for day-of attendance | ✅ High — ZAOstock day-of check-in (replaces Magnetiq QR if configured) |
| **PartnerDashboardPage** | Sponsors/partners self-edit their booth/profile | ✅ High — 5 ZAOstock sponsors need a self-service portal |
| **PartnerIntakePage** | Onboarding form for new partners | ✅ High — replaces manual email intake for ZAOstock sponsors |
| **DJPage / ArtistPage** | Artist-facing page with set times, technical rider | ✅ Medium — ZAOstock lineup of 8 artists |
| **DisplayPage** | Rotating venue screen (sponsors, lineup, schedule) | ✅ High — ZAOstock venue has a screen; doc 1524 notes it as a gap |
| **GraphicsDashboard** | Generate social media assets from event data | ✅ Medium — post-event recap assets |
| **PublicReportPage** | Post-event recap with photos, attendance, stats | ✅ Medium — ZAOstock post-event report |
| **HostPage** | Host configures the event | ✅ Required — Zaal or Iman sets up the event |
| **AdminPage** | Multi-tier admin management | ✅ Medium — Zaal (host) + Iman (coordinator) |

**What RSVPizza does NOT do:**
- Paid ticket sales (use Eventbrite for that)
- External event discovery (Eventbrite has the audience)
- RSVP capacity limits with waitlists (Eventbrite handles this)

---

## ZAOville Jul 25 — Too Late for RSVPizza

**Decision: Do not attempt RSVPizza for ZAOville.** ZAOville is July 25 — 5 days away. Setting up a new platform, configuring the event, testing check-in, and training the crew takes 2-3 weeks minimum. 

**Use instead:**
- Magnetiq (Kaylan's platform, per doc 1541) — call Zaal had with Kaylan; ZAOville event should be live on Magnetiq by Jul 22
- If Magnetiq isn't ready: use Eventbrite RSVP (PR #2198) + manual headcount at the door

RSVPizza is for ZAOstock. Magnetiq is for ZAOville. Don't mix these up.

---

## ZAOstock Oct 3 — The Right Use Case

ZAOstock has 11 weeks to configure and test RSVPizza. The day-of operations layer is exactly where RSVPizza shines.

**Recommended ZAOstock RSVPizza deployment:**

**Week 1 (Jul 20-27): Iman RSVPizza homework**
- Clone `github.com/PizzaDAO/rsv-pizza`
- Run it locally: `npm install && npm run dev`
- Walk through every page: HostPage → PartnerIntakePage → CheckInPage → DisplayPage
- Ask: "What do I need to configure to run ZAOstock on this?"
- Time: 2-3 hours

**Week 2-3 (Jul 28-Aug 10): Configure ZAOstock event**
- Fork the repo: `bettercallzaal/zaostock-rsv`
- Configure Supabase (same project as zaalcaster cowork tracker, or separate)
- Create the ZAOstock event record in the database
- Customize branding: ZAO colors, logo, ZAOstock fonts
- Add artists (8 lineup slots)
- Add sponsors (5 from doc 1562)

**Week 4-8 (Aug): Run the day-of ops layer**
- PartnerDashboard live for 5 ZAOstock sponsors to self-manage their profiles
- ArtistPage for 8 lineup artists to see their set times + technical riders
- Test CheckIn QR flow with a test run (ZAOville Sep rehearsal or standalone test)

**Sep 1: Live day-of URL**
- PublicReportPage goes live for post-ZAOstock recap
- DisplayPage configured for the Ellsworth venue screen (rotating sponsor logos, schedule)

**Oct 3: Day-of deployment**
- CheckInPage on Iman's iPad: scan attendees as they arrive
- DisplayPage on venue screen: live schedule, sponsor logos, WaveWarZ battle countdown
- PartnerDashboard: sponsors check their booth info

---

## How to Deploy RSVPizza

### Option A: Self-host on Vercel (Recommended)

```bash
# Clone and configure
git clone https://github.com/PizzaDAO/rsv-pizza
cd rsv-pizza
cp .env.example .env.local

# Set env vars:
NEXT_PUBLIC_SUPABASE_URL=<zao supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Deploy
vercel --prod
```

**ZAO Supabase choice:** Either the same Supabase project as cowork-tracker (simplest) or a new ZAOstock-specific project (cleanest separation). Same project = one fewer env config; separate = ZAOstock data is isolated.

### Option B: Ask PizzaDAO to Host

PizzaDAO may be willing to host a ZAOstock instance on their existing RSVPizza infrastructure — especially given ZAO's PizzaDAO Zambia connection (Iman). Ask in the PizzaDAO Discord: "Can we get a ZAOstock instance on rsv.pizza?"

If yes: no Vercel setup, just configure the event in their dashboard.

### Option C: Fork + Modify

Since RSVPizza enforces a reusable component library (`IconInput`, `Checkbox`, etc. — per their CLAUDE.md), ZAO can fork, strip the PizzaDAO branding, and replace with ZAO brand assets relatively quickly. This is the long-term path if ZAO plans to run annual festivals.

---

## PizzaDAO Zambia Connection

From doc 670: Iman attended PizzaDAO Zambia and the "ZAO flyer for PizzaDAO Zambia" is a board task. If ZAO's events are running on RSVPizza, the Zambia chapter may be willing to co-promote ZAOstock or provide a West African artist for Africa Battle Week. This is the double-leverage: RSVPizza as infrastructure AND PizzaDAO Zambia as a distribution channel.

**Action:** When Iman does the RSVPizza homework (Option A Week 1 above), have them simultaneously ask the PizzaDAO Zambia organizer if they'd host a WaveWarZ battle at their next pizza event. ZAO's Africa Battle Week and PizzaDAO Zambia are natural allies.

---

## Recommended Decision (for Zaal)

| When | Tool | Purpose |
|------|------|---------|
| ZAOville Jul 25 | Magnetiq | QR check-in, RSVP, vibes data |
| ZAOstock Oct 3 | RSVPizza + Eventbrite | RSVPizza for day-of ops; Eventbrite for pre-event tickets + discovery |
| Future ZAO Festivals (Year 2+) | RSVPizza only | Full festival ops platform, no Eventbrite needed once ZAO has its own discovery |

---

## Sources

- Doc 611: ZAOstock brand-pattern audit (RSVPizza vs IYKYK — done May 2026; brand patterns extracted)
- Doc 670: Iman call May 18 — Craig bot + PizzaDAO Zambia + ZABAL Games
- Doc 1541: ZAOville Magnetiq integration brief (the ZAOville solution)
- Doc 1524: ZAOstock day-of operations protocol (DisplayPage gap identified there)
- `github.com/PizzaDAO/rsv-pizza` — open source repo (MIT license, Next.js + Supabase)
- Board task: "Dive into RSVPizza repo + dashboard"
