# 445 — ZAOstock Monday Progress Report (Apr 20, 2026)

> **Status:** Meeting-ready
> **Date:** 2026-04-20
> **Format:** 5-minute standup — 1 bullet per win
> **Event:** ZAOstock — Oct 3, 2026 — Franklin Street Parklet, Ellsworth ME (Art of Ellsworth / Maine Craft Weekend)

---

## Last 7 Days: What Shipped (25 stock PRs merged Apr 13-20)

- **Volunteer signup live** — public form at `/stock/apply` collects name, skills, availability; stored in `stock_team_members` with `volunteer` role (PR #200)
- **Cypher signup shipped** — artists can submit for the freestyle cypher via `/stock` with day-of time + cypher fields on artist cards (PRs #208, #211)
- **Sponsor outreach drafted** — 3-tier pitch templates (Under $1K local / $1-5K regional / $5K+ presenting) ready to send, pointing to [doc 443](../443-zao-stock-sponsor-pitch-drafts/) + outreach email/DM templates in `scripts/sponsor-outreach-templates.md` (PR #199)
- **Dashboard UX overhaul** — Kanban views on Sponsors + Artists + Todos, Pareto "top 3 need attention" cards, collapsible detail tabs, RSVP tab, simplified layout, feedback pass (PRs #189, #190, #191, #193, #195, #196, #202, #204, #211)
- **Team profiles & auth** — member bios + photos via paste-URL, 4-letter password login, personalized dashboard home, research library links, onboarding modal for new team members (PRs #175, #176, #187, #188, #195, #196)
- **Run-of-show program** — full day-of schedule draft (12pm-6pm, 15-min blocks, WaveWarZ bracket, 5 talks, contingency plans) ready for Tuesday feedback ([doc 428](../428-zaostock-run-of-show-program/))
- **Artist pipeline** — 4 confirmed (AttaBotty, Jango, Hurric4n3Ike, DCoop), outreach templates built, artist Kanban tracking live on dashboard (PRs #172, #190, #193)

## Sponsor Outreach Status

| Tier | Target | Template | Status |
|------|--------|----------|--------|
| Tier 1 (<$1K) | Bangor Savings Bank, Fogtown Brewing | Ready | Drafts in doc 443 |
| Tier 2 ($1-5K) | Regional Maine brands | Ready | Drafts in doc 443 |
| Tier 3 ($5K+) | Presenting sponsor | Ready | Drafts in doc 443 |
| Venue | Heart of Ellsworth | Ready | Pending lock-in |

Funding goal: $25K target, $5K minimum. No sponsors confirmed yet — wave 1 sends this week.

## Artist Pipeline

| Artist | Role | Status |
|--------|------|--------|
| AttaBotty | Production lead, performer | Confirmed |
| Jango | Performer | Confirmed |
| Hurric4n3Ike | WaveWarZ host, performer | Confirmed |
| DCoop | Performer | Confirmed |
| TBD (4-6 more) | Open slots | Outreach templates ready |

## Next 7 Days: Targets (Apr 21-27)

- **Tuesday Apr 21** — team meeting: review run-of-show (doc 428), sponsor pitch feedback, assign wave 1 outreach owners
- **Send wave 1 sponsor emails** — Bangor Savings Bank, Fogtown Brewing, Heart of Ellsworth venue lock
- **Artist outreach round 2** — fill remaining 4-6 performance slots using templates from PR #193
- **Budget spreadsheet** — formalize $25K goal with line items (artist fees, production, permits, insurance $150-300)
- **Grants research** — Levitt Foundation ($40K/yr, Jan 30 deadline for next cycle), Fractured Atlas fiscal sponsorship wording
- **Media capture pipeline** — finalize spec from [doc 433](../433-zao-media-capture-pipeline-spec/) for event day content
- **Permits & insurance** — begin city permit process, get insurance quotes

---

*25 PRs in 7 days. Dashboard is the team's single source of truth. Outreach starts this week.*
