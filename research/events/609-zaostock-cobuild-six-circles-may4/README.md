---
topic: events
type: meeting-transcript
status: research-complete
last-validated: 2026-05-04
related-docs: 274, 364, 425, 428, 547
tier: QUICK
---

# 609 — ZAOstock Co-Build May 4 2026 — Six-Circle Lock + Front-Page Push

> **Goal:** Log Mon 11:30am EST cobuild between Zaal + Sean (Web3Metal) + DQ (Decoup). Three big wins shipped this week, six-circle team structure locked, gaps surfaced via AI audit.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | ZAOstock spun out to **zaostock.com** (off zaoos.com page) | Zaal | shipped |
| 2 | Team circles cut from 8 -> **6**: finance, host, livestream, marketing, music, ops. **Media + partners removed** (absorbed) | Zaal + Sean | locked this call |
| 3 | Merch -> **marketing** (was livestream-bucket from prior rename) | Zaal + Sean | locked |
| 4 | Each circle gets own Telegram topic + 1-sentence responsibility post | Zaal | shipping post-call |
| 5 | **zaostock.com/test** front page open for team feedback (asking everyone to review + propose changes) | Zaal | live |
| 6 | Sean + DQ + Zaal photos/bios on Zal Festivals site as supporting team (cold-post strategy hook) | Sean, DQ, Zaal | this week |
| 7 | Add Web3Metal as official partner via dashboard, test flow at 5pm cobuild | Sean + Zaal | today 5pm |
| 8 | Open Telegram coworking pattern parallel to Discord (Z's COC squad does same) | Zaal | committed |

## Three Big Wins This Week

1. **zaostock.com migration** — clean URL, no PDFs, "one pager" button on main site, easier referral hand-off
2. **Hermes brain on @ZAOstockTeamBot** — natural language commands work alongside dash-commands. `-feedback`, `-edit`, `-regen` available. `-start` opens 1-on-1 chat.
3. **New front page draft** — past + future events, partner showcase, volunteer signup, 3 sponsor tiers (main-stage / broadcast / year-round)

## Six Circle Definitions (locked this call)

| Circle | Responsibility (single-sentence form coming via Hermes) |
|--------|---------------------------------------------------------|
| **Finance** | All money in/out, donations, grants, artist + vendor payouts via Fractured Atlas, receipts, reimbursements, budgets. Source of truth for "can we afford X" |
| **Host** | MC + stage, day-of planning, volunteers, moving things around venue, greeters / guest services, RSVP/ticketing, sponsor + VIP hospitality (combo w/ finance) |
| **Livestream** | Cameras, audio, livestream platforms, photo/video archive, recap reels, day-of coordination support, **community moderation** |
| **Marketing** | How ZAOstock shows up to public + sponsors. Socials, press, sponsor + partner pitches, brand voice, announcements, **merch**, **design** |
| **Music** | Talent side: artist booking, set times, technical riders, hospitality, day-of artist liaison |
| **Ops** | Venue + vendors, **safety / permits / insurance** (w/ host), **contract / legal**, **volunteer pipeline** (w/ host), tech-web hard-gap fallback if bot dies |

## AI-Surfaced Gaps (Hermes audit during call)

| Gap | Owner Circle |
|-----|--------------|
| Tech-web fallback if bot dies (defaults to Zaal currently) | ops |
| Safety / permits / insurance | host |
| Sponsor deal-close | finance |
| Contract / legal | ops |
| Volunteer pipeline | host -> ops |
| Merch | marketing |
| Door / RSVP / ticketing | host |
| Sponsor / VIP hospitality | finance + host |
| Community moderation | livestream |
| Design | marketing |

## Roster Updates

- **Chico** onboarded — project management support
- **Farcaster homie** asked to volunteer (un-named on call)
- **Direvolution** taking lead on livestream circle (was merch), bridging COC concert support
- Local Ellsworth merch printer surfaced — entrepreneur side-hustle, sample shirts already exist (Sam finalized files somewhere, not in team chat yet)

## Tooling Notes

- Discord screen-share flaky on Zaal's machine (re-share required mid-call)
- Spaces.xyz mobile UX too small (Slava feedback echoed); fell back to Google Meet
- Zaostock bot Hermes pipeline: read-write-ship code edits, log feedback `-feedback`, ship edit `-edit`, regen login `-regen` — Zaal needs to test each
- Bot 6am post: `153 days to Oct 3 2026`, in-progress to-dos posted to chat

## Action Bridge

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send 1-sentence responsibility blurb to each of 6 Telegram circle topics | Zaal | bot post | within 30min post-call |
| Pop call recording + transcript into team chat | Zaal | message | post-call |
| Sean adds Web3Metal as official partner via dashboard, test flow | Sean | dashboard test | today 5pm cobuild |
| Sean + DQ submit photo + bio to Zal Festivals site | Sean, DQ | profile add | this week |
| Stand up zalfestivals.com (bare-bones linking page: ZAOpalooza / ZAOchella / ZAOstock buttons) | Zaal | site | this week |
| Send Zelle Festivals logo decoup to Zaal (Candy collab on brand kit) | Zaal -> Candy | asset | this week |
| Prepare Bangor Savings Bank sponsor application | Zaal | doc | next sprint |
| Volunteer reviewer flagged for grant/sponsor app review (un-named on call) | Zaal | intro | before submit |
| Start posting on @zaofestivals X account | Zaal + Sean + DQ | content | this week |

## Also See

- [Doc 274](../274-zao-stock-team-deep-profiles/) — pre-existing team profiles
- [Doc 425](../425-zaostock-dashboard-ui-lean-kanban-patterns/) — dashboard UI patterns (test page being iterated on)
- [Doc 428](../428-zaostock-run-of-show-program/) — run-of-show context
- [Doc 364](../364-zao-festivals-deep-research/) — ZAO Festivals umbrella brand
- [Doc 547](../../community/547-cassie-validation-zaostock-strategy/) — Cassie strategy validation (infra is the product)

## Cross-Memory Updates Needed

- `project_zaostock_spinout.md` — confirm zaostock.com is live (was in-progress)
- `project_zaostock_team_meeting.md` — Mon 11:30am cobuild confirmed running
- `project_zao_stock_team.md` — add Chico (PM), Direvolution (livestream lead), un-named Farcaster volunteer

## Sources

- Live cobuild call recording, 2026-05-04 11:30am EST, Google Meet
- Zaostock bot 6am brief + 6:07am Hermes-ship announcement (in-chat)
- Hermes audit output during call (gap-finder pass on 6 circles)
