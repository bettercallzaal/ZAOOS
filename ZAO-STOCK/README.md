# ZAOstock

> **One-day outdoor music festival - Saturday October 3, 2026 - Franklin Street Parklet, Ellsworth Maine**
> Part of Art of Ellsworth: Maine Craft Weekend (statewide). Run by The ZAO. After-party at Black Moon Public House.

---

## Single Source of Truth

ZAOstock has **two kinds of data**: live operational state (changes daily, queried fast) and documents (drafted, reviewed, printed). Each kind has ONE canonical home. Both are surfaced through the same two entry points: the dashboard and the Telegram bot.

### Data map

| Data | Canonical home | How to read | How to write |
|---|---|---|---|
| **Team roster** | Supabase `stock_team_members` | [/stock/team](https://zaoos.com/stock/team) · bot `/whoami` | bot `/link @user Name` (admin) · SQL migration for new members |
| **Circles + memberships** | Supabase `stock_circles` + `stock_circle_members` | [/stock/circles](https://zaoos.com/stock/circles) · bot `/circles` | dashboard Join/Leave buttons · bot `/join /leave` |
| **Sponsors (CRM)** | Supabase `stock_sponsors` | /stock/team Sponsors tab | dashboard inline edit · bot `/do add sponsor X` |
| **Artists (booking pipeline)** | Supabase `stock_artists` | /stock/team Artists tab | dashboard · bot `/do add artist X confirmed music` |
| **Milestones (timeline)** | Supabase `stock_milestones` | /stock/team Timeline tab | dashboard · bot `/do add milestone X 2026-09-01` |
| **Volunteers** | Supabase `stock_volunteers` | /stock/team Volunteers tab | /stock/apply form · dashboard |
| **RSVPs** | Supabase `stock_rsvps` | /stock/team RSVPs tab | /stock RSVP form |
| **Budget tracker** | Supabase `stock_budget` | /stock/team Budget tab | dashboard inline |
| **Todos / work queue** | Supabase `stock_todos` | /stock/team Home · bot `/mytodos` | dashboard · bot `/do add todo X` |
| **Goals (objectives)** | Supabase `stock_goals` | /stock/team Home | dashboard |
| **Meeting notes** | Supabase `stock_meeting_notes` | /stock/team Notes tab | dashboard · bot `/note <text>` |
| **Ideas / gemba / observations** | Supabase `stock_activity_log` | /stock/team Activity rail | bot `/idea` `/gemba` `/note` |
| **Activity log (audit)** | Supabase `stock_activity_log` | /stock/team Activity rail | auto-logged on every dashboard or bot action |
| **Bot chat registry** | Supabase `stock_bot_chats` + `stock_bot_topics` | bot `/chatinfo` | auto-registered on first message · bot `/setmode /setdigests` (admin) |
| **One-pagers** (sponsor/partner/venue briefings) | Markdown in [`ZAO-STOCK/onepagers/`](onepagers/) | [/stock/onepagers](https://zaoos.com/stock/onepagers) | Claude `/onepager` skill · manual edit + PR |
| **Plans** (run-of-show, vendors, venue, F&B, outreach, budget context) | Markdown in [`ZAO-STOCK/planning/`](planning/) | git + future /stock/plans page | manual edit + PR |
| **Standups / meeting recaps** | Markdown in [`ZAO-STOCK/standups/`](standups/) | git | manual edit + PR · bot `/note` for live capture |
| **Strategic / multi-year vision** | Markdown in [`ZAO-STOCK/research/`](research/) + [`research/community/432`](../research/community/432-zao-master-context-tricky-buddha/) | git | manual edit + PR |
| **Branding + nav config** | [`community.config.ts`](../community.config.ts) | code | PR |
| **Live team chat** | Telegram group (`@ZAOstockTeamBot` is in it) | Telegram | Telegram - noteworthy items captured to DB via bot `/note /idea /gemba /do` |
| **External (email, calls, vendor reach)** | Email / phone (off-system) | inbox | log key outcomes into Supabase via bot `/note` or sponsor/artist tab |

### Architecture in one sentence

**Operational state lives in Supabase. Documents live in markdown. Dashboard + bot are the two read+write surfaces over both. Telegram is the live-chat layer that captures back into Supabase via bot commands.**

### Two entry points (use either, they reflect the same data)

- **Dashboard:** [zaoos.com/stock/team](https://zaoos.com/stock/team) - browser, full editor, all tabs
- **Bot:** `@ZAOstockTeamBot` in Telegram - mobile, fast actions, daily digests at 6am/6pm ET

### Three editing paths

| To change... | Use |
|---|---|
| Live state (sponsors, artists, todos, etc.) | Dashboard inline OR bot `/do <natural language>` |
| A 1-pager body | Claude `/onepager <slug>` skill OR edit `.md` directly + PR |
| A planning doc | Edit `.md` directly + PR |
| Schema / new tables | New SQL migration in `scripts/` + PR |

---

## Confirmed

| Item | Status |
|---|---|
| Date: October 3, 2026 | CONFIRMED |
| Venue: Franklin Street Parklet | CONFIRMED (Heart of Ellsworth permission) |
| City permit lock | IN PROGRESS - Roddy Ehrlenbach meeting Tue 2026-04-28 5pm City Hall |
| Aug 15 dry-run | PROPOSED ($900 budget, 50 invited guests, same venue) |
| Art of Ellsworth umbrella | CONFIRMED (statewide Maine Craft Weekend promotion) |
| Format: 12pm-6pm outdoor showcase + Black Moon after-party | CONFIRMED |
| 10 artists performing | TARGET (lineup TBD) |
| Livestream | CONFIRMED (non-negotiable) |
| Budget range | $5K-$25K (crowdfunding + sponsorships) |
| Team structure | 19 people across 8 self-join circles, Zaal default coordinator |

## Needs action (live - check dashboard for current state)

For the freshest list, query the dashboard or run `/status` in the bot. Static highlights:

| Item | Owner | Status |
|---|---|---|
| Roddy meeting prep + 1-pager | Zaal + Shawn (review) | DRAFT - finalize Sun for Tue 4/28 |
| Steve Peer pitch (Black Moon after-party) | Zaal | NOT YET |
| Wallace Events tent quote | Ops circle | NOT YET - (207) 667-6000 |
| Sound vendor (DRD Audio / Bronson AV) | Ops circle | NOT YET |
| Hotel group rates | Host circle | NOT YET |
| Crowdfunding launch (Giveth + GoFundMe) | Finance circle | NOT YET |
| Sponsorship outreach | Partners circle | NOT YET |
| Public ZAOstock website page | Marketing circle | NOT YET |
| Local food partners pitched | Partners + Ops | NOT YET |
| Artist travel logistics | Music circle | TBD until lineup confirms |

---

## Folder layout

```
ZAO-STOCK/
├── README.md                       ← THIS FILE - the source-of-truth manifest
├── MASTER-PLAN.md                  ← Consolidated strategic plan
├── onepagers/                      ← Sponsor / partner / venue briefings (Claude /onepager skill writes here)
│   └── roddy-parks-rec.md
├── planning/                       ← Operational planning markdown
│   ├── timeline.md
│   ├── budget.md
│   ├── vendors.md
│   ├── venue-details.md
│   ├── run-of-show.md
│   ├── experience.md
│   ├── food-bev.md
│   ├── outreach.md
│   ├── staffing.md
│   ├── contingency.md
│   ├── post-event.md
│   └── visual-brief.md
├── standups/                       ← Meeting recaps + dashboard notes
├── research/                       ← Strategic + member profile research
├── website/                        ← Future public ZAOstock site source
└── assets/                         ← Logos, photos, design assets
```

## Companion entry points (live)

- Dashboard: [zaoos.com/stock](https://zaoos.com/stock) (public landing, RSVP, apply, suggestion box)
- Team dashboard: [zaoos.com/stock/team](https://zaoos.com/stock/team) (auth-gated)
- Circles: [zaoos.com/stock/circles](https://zaoos.com/stock/circles)
- One-pagers: [zaoos.com/stock/onepagers](https://zaoos.com/stock/onepagers)
- Telegram bot: [@ZAOstockTeamBot](https://t.me/ZAOstockTeamBot)

## Companion entry points (research / strategy)

- Multi-year vision: [research/224-zao-stock-multi-year-vision/](research/224-zao-stock-multi-year-vision/)
- Team profiles: [research/232-zao-stock-team-deep-profiles/](research/232-zao-stock-team-deep-profiles/)
- Initial planning: [research/213-zao-stock-planning/](research/213-zao-stock-planning/)
- Master ZAO context: [`research/community/432-zao-master-context-tricky-buddha/`](../research/community/432-zao-master-context-tricky-buddha/)
- Aug 15 dry-run plan: [`research/events/504-aug15-dryrun-planning/`](../research/events/504-aug15-dryrun-planning/)
- Circles v1 spec: [`research/governance/502-zaostock-circles-v1-spec/`](../research/governance/502-zaostock-circles-v1-spec/)
