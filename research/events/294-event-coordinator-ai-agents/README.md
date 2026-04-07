# Research Doc 294 - Event Coordinator AI Agents

> Date: 2026-04-07
> Author: Claude (research)
> Status: Complete
> Related: Doc 213 (ZAO Stock planning), Doc 224 (multi-year vision), spec `docs/superpowers/specs/2026-04-07-stock-festivals-agents-design.md`

## Key Decisions

1. **STOCK agent should be a production-grade runsheet operator, not just a doc tracker.** Festival management platforms (FestivalPro, Crescat, Beatswitch) prove that the winning feature set is: runsheet/cue sheet execution, vendor advancing workflow, and artist logistics coordination. STOCK should replicate these capabilities as an AI agent operating on markdown files + Supabase, not require a $249/mo SaaS subscription.

2. **Use Unlock Protocol for on-chain ticketing (free tier).** POAP handles proof-of-attendance (ZAO Stock already plans POAPs). Unlock Protocol handles actual ticketing with NFT-based entry, QR verification, and soulbound options. GET Protocol is overkill for a 200-person festival. All three are complementary, not competing.

3. **The "agent advantage" over SaaS tools is action, not tracking.** An AI agent that can draft a vendor email, generate a day-of runsheet from timeline.md, calculate budget remaining, and flag overdue tasks is more valuable than any dashboard. The spec already captures this (capabilities v1 items 3-6). This research validates that framing and adds 12 specific capabilities the spec doesn't cover yet.

4. **FESTIVALS agent should include an event proposal wizard.** Partiful and Luma succeed because they make event creation frictionless (under 2 minutes). FESTIVALS should walk any ZAO member through: date/location/budget/format/artist wishlist, then generate a planning scaffold automatically.

5. **Volunteer coordination is the biggest gap in the current spec.** Every festival management platform (Rosterfy, Volgistics, CERVIS, Get Connected) has dedicated volunteer modules with shift scheduling, automated reminders, and day-of check-in. The STOCK spec mentions 15-20 volunteers but has no coordination system. The agent should manage this.

6. **Day-of operations need a separate "show mode" capability.** Crescat's Show Mode (locked show caller, real-time cue execution, stage-specific views) is the gold standard. STOCK should have a simplified version: a runsheet that ticks through cues in real-time, sends notifications to crew at each transition, and logs actual vs. planned times.

## Platform Comparison

### Event Planning Platforms

| Platform | Strengths | Weaknesses | Price | Agent-Relevant Features |
|----------|-----------|------------|-------|------------------------|
| **Luma (Lu.ma)** | Beautiful event pages, 1000+ integrations (Slack, Salesforce, Google Calendar), API with event/guest/ticket management | No production tools, no runsheet, API requires Luma Plus subscription | Free (basic), $59/mo (Plus), $249/mo (Premium) | Guest import API, invitation automation, webhook triggers |
| **Partiful** | Best-in-class RSVP UX, emoji reactions, guest questions (dietary, contributions), text blasts without app install | No API publicly documented, no production/vendor tools, consumer-focused | Free (personal), Business/Enterprise tiers | RSVP with structured questions, automatic reminders, text blast coordination |
| **Eventbrite** | Industry standard ticketing, comprehensive API (v3, 2000 req/hr), OAuth 2.0, MCP server exists for AI integration | $2/ticket + $0.99 fee, no production management, no artist coordination | Free + per-ticket fees | Full event CRUD API, attendee management, order tracking, analytics export |
| **FestivalPro** | Purpose-built for festivals: artist advancing, tech specs per stage, drag-drop scheduling, vendor document upload, volunteer shift management, accreditation | Expensive, no AI integration, no API documented | From $249/mo (subscription) | Artist rider management, stage scheduling, vendor advancing workflow, volunteer shifts |
| **Crescat** | Running Order with Show Mode (locked show caller, real-time cues), drag-drop scheduler, crew shift management, day sheets, checklist templates, mobile app | Smaller ecosystem, less artist-specific than FestivalPro | Contact for pricing | Show Mode for day-of execution, running order templates, stage/prompter/wardrobe views |
| **Beatswitch** | Intelligent CRM for artist/agent contacts, automated advancing workflow with milestones, timetable builder, credential management | Production-focused only, no ticketing, no volunteer tools | Contact for pricing | Automated artist advancing with deadlines, CRM for booking agents, centralized file management |
| **Prism.fm** | Live music industry standard (10,000+ venues), shared holds calendar, offer generation, settlement, box office analytics across network | Venue/promoter focused (not festival), expensive for small events | Contact for pricing | Artist box office data (Prism Insights), offer templates, financial forecasting |

### On-Chain Ticketing Protocols

| Protocol | What It Does | Chain | ZAO Stock Fit | Cost |
|----------|-------------|-------|---------------|------|
| **POAP** | Proof-of-attendance collectible badges | Gnosis Chain | Attendance proof, community memories, unlock future benefits | Free to mint |
| **Unlock Protocol** | NFT ticketing with QR verification, soulbound option, CAPTCHA anti-bot, attendee CSV export | Base, Polygon, Ethereum, others | Entry tickets, transferable or soulbound, door scanning | Free (self-serve), gas only |
| **GET Protocol (OPEN)** | Full ticketing infrastructure, white-label ticket shops, mobile app, anti-scalp | Polygon | Overkill for Year 1 (designed for 10K+ events) | Per-ticket fee |
| **Zupass** | ZK-proof identity/ticketing, anonymous voting, gated access (Telegram, Discord) | N/A (ZK proofs, not on-chain storage) | Privacy-preserving attendance verification, gated community access | Free (open source) |

### Web3 Event Coordination Tools (DAO Ecosystem)

| Tool | Used By | What It Does |
|------|---------|-------------|
| **Luma** | ETH Denver 2026 side events, most web3 conferences | Event pages, RSVP, calendar aggregation |
| **Zupass** | Zuzalu, Devcon, Devconnect | ZK identity, event gating, anonymous polls |
| **Social Layer** | Zuzalu pop-up cities (Vitalia, Edge Esmeralda, ShanhaiWoo) | Coordination calendar, interactive map, cross-event scheduling |
| **Lemonade** | Pop-up city ecosystem | Community-owned event platform, on-chain rewards |
| **Zuzalu.city** | Derivative Zuzalu events | Decentralized CommunityOS, role-based permissions, POAP/Zupass gating |
| **IceBreaker** | FarCon 2024 | NFC-enabled networking passes, contact exchange via phone tap |
| **Kickback** | Ethereum meetups | Stake-to-RSVP (deposit returned on attendance, no-show funds go to pool) |

### AI Event Planning Tools (Open Source)

| Project | Tech Stack | What It Can Do | Stars | License |
|---------|-----------|----------------|-------|---------|
| **ai-event-assistant** (aymen-mouelhi) | Next.js + LangChain | AI-assisted planning queries, event organization suggestions | Small | Open source |
| **AIEventPlanner** (warrenshiv) | GPT-3.5 Turbo | Theme-based activity suggestions, schedule creation, budget estimation | Small | Open source |
| **ai-event-planner** (atef-ataya) | Google ADK + Gemini + GPT + Streamlit | Multi-agent orchestration, venue suggestions, decor planning, PDF export, voice | Small | Open source |

None of these are production-ready for festival coordination. They handle consumer party planning, not multi-vendor production. The ZAO agents would be more sophisticated than any existing open-source alternative.

## What Production Companies Actually Track

Based on research into professional event production workflows (Guidebook, Ticket Fairy, Propared, Event Intelligence):

### Pre-Event (Months Out)
- **Artist advancing** - Collecting tech riders, hospitality riders, stage plots, input lists, backline requirements. Typical timeline: 8-12 weeks before show.
- **Vendor contracts** - Signed agreements with payment schedules (typically 50% deposit, 50% on delivery).
- **Insurance** - Event liability policy ($1M-$2M general liability standard for outdoor festivals).
- **Permits** - Mass gathering permits (45 days before in Ellsworth per Chapter 14), liquor permits for Black Moon (Title 28-A, Section 1054).
- **Site plan** - Scaled map showing stage, vendor locations, power drops, ADA paths, emergency exits, medical station.

### Week-Of
- **Load-in schedule** - Rigging first, then lighting, then audio, then scenic. Typically 24-48 hours before doors.
- **Sound check schedule** - Reverse order of performance (headliner checks first, opener last). 15-30 min per artist.
- **Green room / artist hospitality** - Rider fulfillment, warm-up space, meal schedule.
- **Credential distribution** - Artist, crew, VIP, vendor, volunteer badges/wristbands.

### Day-Of
- **Master runsheet** - Minute-by-minute: doors, set times, changeovers, curfew, load-out. Example for ZAO Stock:
  ```
  11:00  Load-in / sound check
  11:45  Volunteer orientation
  12:00  DOORS - Artist 1 (30 min set)
  12:30  Changeover (10 min)
  12:40  Artist 2 (30 min set)
  ...
  17:30  Final artist (30 min set)
  18:00  Curfew - transition to Black Moon
  18:30  Load-out begins
  ```
- **Emergency contacts sheet** - Venue manager, sound engineer, medical, police non-emergency, hospital (Maine Coast Memorial, 50 Union St, 5 min drive).
- **Weather call protocol** - Who makes the call, at what threshold (lightning within 8 miles = mandatory 30-min pause), how to communicate to attendees (PA system, text blast).
- **Waste management** - Trash/recycling/compost stations, post-event cleanup crew.
- **Parking/transportation** - Designated parking (City Hall lot?), rideshare drop-off, ADA parking.

### Post-Event
- **Settlement** - Reconcile all revenue (tickets, tips, merch, sponsors) against expenses. 0xSplits for transparent artist payments.
- **Content delivery** - Photos/video to artists within 48 hours (for social posting while momentum is high).
- **Debrief** - What worked, what broke, what to change for Year 2. Structured format: timeline adherence, audience count, budget variance, vendor ratings.

## Music Festival-Specific Features

### Artist Scheduling
- **Equal sets** - ZAO Stock plans 10 artists across 6 hours = 30 min sets with 6 min changeovers. That's tight. FestivalPro recommends minimum 10-min changeover for bands, 5-min for DJs.
- **Sound check order** - Headliner first (most complex setup), opener last. Schedule: 2 hours before doors for 6 artists max.
- **Stage plot sharing** - Each artist provides: input list (channels needed), monitor needs, backline (what they bring vs. what's provided), power requirements.

### Sound Check Coordination
- **Channel patch list** - Compiled from all artist input lists. Sound engineer needs this 1 week before show minimum.
- **Backline sharing** - Drum kit, amps shared between artists to speed changeovers. Document what's shared vs. artist-provided.
- **Monitor mixes** - Each artist needs their own monitor mix saved. Digital console makes this fast (recall per artist).

### Weather Contingencies (ZAO Stock-Specific)
- October in Ellsworth: wettest month (4.8 inches avg), 34% rain chance on any day, 82% humidity, 12.5 mph wind average.
- Wallace Events tent is mandatory backup (frame tent, not pole - more wind resistant).
- **Decision timeline**: Weather call 6 hours before (6 AM for noon show). Secondary check 2 hours before (10 AM). If rain starts during show: tent is already set up, continue. If lightning: mandatory 30-min pause, PA announcement.

### Merch Coordination
- Table/booth space at venue
- Cash + card payment (Square, Stripe reader)
- Artist merch separation (each artist's merch clearly labeled)
- Revenue tracking per artist (for post-event settlement)

## 12 Capabilities Missing from Current STOCK/FESTIVALS Spec

The existing spec (`docs/superpowers/specs/2026-04-07-stock-festivals-agents-design.md`) covers 6 STOCK capabilities and 8 FESTIVALS capabilities. Based on this research, these should be added:

### STOCK Agent Additions

| # | Capability | What the Agent Does | Can AI Do This? |
|---|-----------|--------------------|----|
| 7 | **Runsheet generation** | Generate minute-by-minute day-of schedule from timeline.md + confirmed artists. Auto-calculate changeover times. Output as markdown + exportable PDF. | YES - deterministic calculation + formatting |
| 8 | **Sound check schedule** | Generate reverse-order sound check schedule from performance order. Include setup/teardown estimates per artist type (band vs. DJ vs. solo). | YES - template-based generation |
| 9 | **Volunteer shift scheduling** | Create shift blocks for 15-20 volunteers across: setup (11 AM), doors (12 PM), active (12-6 PM), teardown (6-8 PM). Auto-assign based on availability. Send reminders. | YES - scheduling + notification |
| 10 | **Weather decision protocol** | Monitor weather API for Ellsworth, ME on event day. At 6 AM and 10 AM, generate weather report with go/no-go recommendation. Flag if lightning risk > 20% or sustained rain > 60%. | YES - API call + decision logic |
| 11 | **Emergency contacts sheet** | Generate formatted emergency contacts doc: venue manager (Cara Romano), nearest hospital (Maine Coast Memorial, 207-664-5311, 5 min drive), police non-emergency (207-667-2168), sound vendor on-site contact, team lead contacts. | YES - template generation |
| 12 | **Post-event settlement** | Calculate revenue (tickets + tips + sponsors + merch) minus expenses. Generate 0xSplits allocation for artist payments. Produce variance report (budget vs. actual). | YES - math + report generation |

### FESTIVALS Agent Additions

| # | Capability | What the Agent Does | Can AI Do This? |
|---|-----------|--------------------|----|
| 9 | **Event proposal wizard** | Walk any ZAO member through: event type, date, location, budget range, format, artist wishlist, venue requirements. Generate a planning scaffold (timeline, budget template, vendor checklist). Under 5 minutes. | YES - conversational wizard + template generation |
| 10 | **Accessibility checklist** | Generate ADA compliance checklist for any venue: wheelchair routes, accessible restrooms, designated viewing areas, assistive listening, service animal accommodations, accessible parking. Flag gaps. | YES - checklist generation from venue details |
| 11 | **Cross-event deconfliction** | Check proposed event dates against all ZAO events, major web3 conferences (ETH Denver, Devcon, FarCon), and local calendar conflicts. Flag overlaps. | YES - calendar query + conflict detection |
| 12 | **Sponsor CRM** | Track sponsor relationships across all ZAO events. Know that Fogtown Brewing sponsored ZAO Stock 2026 at Community tier, so when FESTIVALS plans ZAO-Ville, it can suggest approaching them for the DMV event at the same tier. | YES - relationship tracking + suggestions |
| 13 | **Budget scaling templates** | Given an event size (virtual, 50-person meetup, 200-person festival, 500-person conference), generate appropriate budget with category percentages based on industry benchmarks. | YES - template math |
| 14 | **Post-event content coordinator** | After an event: remind content team to deliver photos/video within 48 hours, draft thank-you posts for sponsors/artists/volunteers, generate recap cast for Farcaster, trigger social distribution via CASTER agent. | YES - drafting + scheduling + inter-agent dispatch |

## What an Agent Can DO vs. Just Track

| Action | Track Only | Agent Can Execute |
|--------|-----------|-------------------|
| Vendor list | List vendors with status | Draft personalized outreach email for each vendor with specific ask, pricing context, and follow-up date |
| Budget | Show remaining balance | Flag when spending exceeds 90% of category budget, suggest reallocation, generate expense report |
| Timeline | Show checklist with dates | Compare current date to deadlines, send nudge notifications for items overdue by > 3 days, suggest priority reordering |
| Artist coordination | List confirmed artists | Draft tech rider request email, compile input lists into master channel patch, generate sound check schedule |
| Sponsorship | Track who's been contacted | Draft tier-appropriate pitch email referencing the sponsor's connection to ZAO (e.g., "Fogtown Brewing - your Pine St location is 3 blocks from the Parklet"), generate follow-up sequence |
| Volunteer management | List volunteer names | Generate shift schedule, send automated reminders 48h and 2h before shift, provide day-of check-in tracking |
| Weather | Show forecast | Pull weather API at scheduled intervals, generate go/no-go recommendation based on threshold criteria, draft attendee communication if weather changes |
| Post-event | Collect feedback | Generate settlement report, draft thank-you messages, create recap content, trigger social distribution |

## Recommended Tech Stack for Agent Capabilities

| Capability | Implementation | Complexity |
|------------|---------------|-----------|
| Runsheet/schedule generation | LLM generates from structured markdown data. Output: markdown + PDF (via puppeteer or react-pdf). | Low |
| Weather monitoring | OpenWeatherMap API (free tier: 1000 calls/day). Cron job on VPS, results to Supabase. | Low |
| Email drafting | LLM generates draft, stored in `drafts/` directory on VPS. Human reviews before sending. Never auto-send. | Low |
| Budget tracking | Parse budget.md, calculate totals, flag overages. Store transaction log in Supabase. | Low |
| Volunteer scheduling | Supabase table for shifts/volunteers. Agent generates schedule, volunteers self-serve via web UI. | Medium |
| Sponsor CRM | Supabase table linking sponsors to events/tiers/contacts/history. Agent queries and suggests. | Medium |
| On-chain ticketing | Unlock Protocol smart contract deployment on Base. Integration with existing RSVP flow. | Medium |
| Show Mode (day-of) | Real-time runsheet with WebSocket updates. Show caller interface. Clock-based auto-advance. | High |
| Inter-agent dispatch | STOCK dispatches to CASTER (social posts), WALLET (0xSplits), ZOEY (task execution). Via ZOE orchestrator. | Medium |

## Concrete Numbers

- **FestivalPro**: 550+ events worldwide, unlimited contacts per account, pricing from $249/mo
- **Prism.fm**: 10,000+ venues in network, used to plan hundreds of thousands of events
- **Eventbrite API**: 2,000 requests/hour rate limit, OAuth 2.0 authentication
- **Unlock Protocol**: Free self-serve tier, supports Base/Polygon/Ethereum/10+ chains
- **GET Protocol**: Processed 2M+ NFT tickets across multiple ticketing companies
- **Rosterfy**: Used for Super Bowl, SXSW volunteer coordination
- **ZAO Stock specifics**: 10 artists, 6-hour show (12-6 PM), 15-20 volunteers, $5K-$25K budget, 34% rain chance Oct 3
- **Crescat Show Mode**: Single locked show caller, real-time cue execution, multiple crew views (stage/prompter/wardrobe)
- **Weather threshold for outdoor festivals**: Lightning within 8 miles = mandatory 30-min pause (industry standard)
- **Post-event content delivery**: Industry best practice is photos to artists within 48 hours
- **Changeover time**: 10 min minimum for bands, 5 min for DJs (FestivalPro recommendation)
- **Sound check allocation**: 15-30 min per artist, reverse performance order

## ZAO OS File Paths

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-04-07-stock-festivals-agents-design.md` | Current agent spec (update with findings from this doc) |
| `ZAO-STOCK/planning/timeline.md` | Month-by-month checklist (STOCK agent knowledge base) |
| `ZAO-STOCK/planning/budget.md` | Budget tracker - $5K min / $25K goal (STOCK agent knowledge base) |
| `ZAO-STOCK/planning/vendors.md` | Vendor contacts and status (STOCK agent knowledge base) |
| `ZAO-STOCK/planning/outreach.md` | Sponsorship tiers + outreach tracker (STOCK agent knowledge base) |
| `ZAO-STOCK/planning/venue-details.md` | Parklet specs, Black Moon, weather data, day-of flow (STOCK agent knowledge base) |
| `src/app/stock/page.tsx` | Public ZAO Stock festival page |
| `src/app/stock/RSVPForm.tsx` | RSVP form component |
| `src/app/(auth)/festivals/page.tsx` | Authenticated festivals listing page |
| `src/app/api/events/rsvp/route.ts` | RSVP API endpoint (Zod validated, Supabase insert) |
| `src/components/admin/agents/constants.ts` | Agent definitions (add STOCK + FESTIVALS here) |
| `supabase/migrations/20260406_agent_events.sql` | Agent event logging schema |

## Implementation Priority

### Phase 1 (Ship with v1 agents)
1. Runsheet generation from timeline.md
2. Budget calculation and overage alerts
3. Vendor email drafting (outreach.md as source)
4. Timeline nudges (compare dates, flag overdue)
5. Event proposal wizard (FESTIVALS)

### Phase 2 (Pre-event, by August 2026)
6. Volunteer shift scheduling + reminders
7. Weather monitoring integration (OpenWeatherMap)
8. Sound check schedule generation
9. Emergency contacts sheet
10. Accessibility checklist generation

### Phase 3 (Day-of and post-event)
11. Simplified Show Mode (markdown runsheet with clock)
12. Post-event settlement + 0xSplits allocation
13. Post-event content coordination (dispatch to CASTER)
14. Sponsor CRM with cross-event history

### Phase 4 (Multi-event scaling)
15. On-chain ticketing via Unlock Protocol
16. Cross-event deconfliction calendar
17. Budget scaling templates
18. Organizer credit/reputation tracking

## Sources

- [Luma API Documentation](https://help.luma.com/p/luma-api)
- [Partiful - Event Planning](https://partiful.com)
- [Eventbrite Platform & API](https://www.eventbrite.com/platform/)
- [Eventbrite MCP Server](https://skywork.ai/skypage/en/event-management-eventbrite-mcp/1980100033955274752)
- [FestivalPro - Features](https://www.festivalpro.com/features/features.html)
- [FestivalPro - Artist Backstage Scheduling](https://www.festivalpro.com/festival-management/3782/news/2025/5/20/)
- [Crescat - Running Order / Show Mode](https://crescat.io/features/running-order)
- [Crescat - Features](https://crescat.io/features)
- [Beatswitch - Artist Management](https://www.beatswitch.com/products/artists)
- [Prism.fm - Venue & Promoter Software](https://prism.fm/why-prism-for-venues-and-promoters/)
- [Unlock Protocol - NFT Event Ticketing](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/)
- [GET Protocol / OPEN Ticketing Ecosystem](https://get-protocol.io/)
- [POAP - Proof of Attendance Protocol](https://learn.opensea.io/learn/nft/what-is-poap)
- [Zupass - Zero Knowledge Passport (GitHub)](https://github.com/proofcarryingdata/zupass)
- [Zuzalu Pop-Up Cities Case Study (Gitcoin)](https://gitcoin.co/case-studies/zuzalu-and-pop-up-cities-temporary-coordination-experiments)
- [Zuzalu.city Software Townhall (Medium)](https://medium.com/@Zuzalu_city/zuzalu-software-townhall-october-zuzalu-city-private-event-beta-launch-d15d70c758df)
- [FarCon - Decentralized Farcaster Conference](https://farcon.xyz/)
- [AI Agents for Event Management (Virtual Workforce)](https://virtualworkforce.ai/ai-agents-for-event-management/)
- [Rosterfy - Volunteer Management](https://www.rosterfy.com/)
- [CERVIS - Festival Volunteer Software](https://www.cervistech.info/festivals-events-volunteer-management-software)
- [ADA Event Accessibility Guide](https://adata.org/guide/planning-guide-making-temporary-events-accessible-people-disabilities)
- [Outdoor Weather Contingency Checklist](https://www.popprobe.com/checklist-library/events/event-planning/b27-eve-outdoor-weather-contingency-checklist)
- [Stage Manager Guide - Festival Production](https://festivalandeventproduction.com/special-guides/stage-manager-guide/)
- [Ticket Fairy - Building Festival Team Roles](https://www.ticketfairy.com/blog/building-your-festival-team-roles-and-responsibilities/)
- [Propared - Vendor Scheduling Tips](https://www.propared.com/blog/3-quick-tips-for-building-event-schedules-that-make-sense-for-vendors/)
- [ai-event-assistant (GitHub)](https://github.com/aymen-mouelhi/ai-event-assistant)
- [AIEventPlanner (GitHub)](https://github.com/warrenshiv/AIEventPlanner)
