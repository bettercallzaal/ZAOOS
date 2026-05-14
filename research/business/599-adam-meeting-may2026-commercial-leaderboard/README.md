---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-14
related-docs: 582, 583, 585
tier: QUICK
---

# 599 - Adam Sync (May 2026): Leaderboard Reset, ZAOstock Commercial Model, Adam's Bandwidth

> **Goal:** Capture the May 2026 Zaal x Adam call - decisions on the leaderboard reset, Adam's reduced near-term bandwidth, his volunteer offer to build a ZAOstock commercial model, and the action items each owner walked away with.

---

## Key Decisions / Recommendations

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | Reset the leaderboard: remove X/Twitter data entirely, keep only Spaces + Farcaster | Adam + Legash | Agreed, not yet executed |
| 2 | Leaderboard displayed date range changes to May-to-now (was April-to-now) | Adam to ask Legash | Agreed |
| 3 | Draw a line under the Q1 monthly-subscription deal - it never took off, stop billing Zaal for it | Adam | Adam offered; Zaal did not formally close it on the call |
| 4 | Leaderboard moves to a clean API into Empire Builder; the standalone page becomes a read-only view; total points + rewards live in Empire Builder | Zaal | Zaal to PR an Empire Builder API endpoint |
| 5 | Next Zaal x Adam call is dedicated to the ZAOstock commercial model | Both | Scheduled as the next call |
| 6 | Zaal + Adam move to a 2-3x per week meeting cadence, each bringing an agenda | Both | Agreed |
| 7 | Adam helps build the ZAOstock commercial model as a volunteer, even if ZAOstock runs as a loss leader | Adam | Offered, accepted |

---

## Participants + Context

- **Zaal** - ZAOstock lead, building the pitch + Luma, running point on partnerships. Taking on a new paid software-build side gig (see Section 1).
- **Adam** - long-standing technical/commercial collaborator. Built the leaderboard tooling with Legash (engineer). Now building an agentic payment system as his main focus.

This was a voice-transcribed casual call, mid-May 2026. ZAOstock is October 3, 2026 - roughly 4.5 months out at the time of the call.

---

## 1. Zaal's Bandwidth Change

Zaal is taking on a paid hourly software-build side gig for a Bar Harbor landscaping company.

- **Structure:** on the company's payroll, paid hourly, consulting-style - building their software from scratch.
- **Keeps his current job** for the benefits; the side gig stacks on top.
- **Near-term cost:** a 1-2 month ramp where Zaal steps back from some ZAO work while he gets situated.
- **Long-term gain:** lets Zaal pay off the debt he owes his retirement fund and financially situate himself - explicitly framed as getting himself "as good as I can be for October's event."
- **Local upside:** the landscaping owner is another Bar Harbor business owner - can open local connections, already lined up a second potential consulting gig for Zaal. Owner is flexible and fine with Zaal posting about the company on social + continuing open-source coding.
- **Coverage plan:** Zaal can do 10-20 hrs/week on the side gig, and Iman can work ZAO tasks alongside Zaal while Zaal is at his full-time job - part of why Zaal has been ramping Iman up.

**Implication for ZAOstock:** Zaal stays the lead but is bandwidth-constrained for ~1-2 months. Mitigation: Iman covers more execution, and Adam's highest-leverage contribution shifts to the commercial-model thinking (Section 3), not hands-on build.

---

## 2. The Leaderboard - Reset + Decisions

Zaal wants the leaderboard reset and slimmed down.

| Item | Decision |
|------|----------|
| X/Twitter data | Remove completely. The scraper for X was the expensive, fragile part - Legash originally "freaked out" about the server load. |
| Remaining data sources | Keep Spaces + Farcaster only. |
| Displayed date range | Change to May-to-now (currently April-to-now). |
| Existing stats | Download/export the current stats first if it is easy - nice-to-have, not a blocker. |
| Server cost | Adam + Legash to figure out the new monthly cost with the X scraper removed. Zaal wants it kept running as cheap as possible; if costs are still a problem Zaal will self-host and is fine covering server costs himself. |
| Q1 monthly-subscription deal | Agreed at the start of the year, never took off (the token-launch business model Adam envisioned did not materialize). Adam offered to "draw a line under it." Zaal did not formally close it on the call - **open thread.** |

**Zaal's forward plan for the leaderboard:**
- Expose leaderboard data through a clean API into **Empire Builder** (see docs 582, 583, 585).
- Empire Builder becomes the home for total points + rewards; the standalone leaderboard page becomes just a view of the same data.
- Zaal will PR an Empire Builder API endpoint to make this work.
- Zaal also wants this wired to his new Spaces - so active participants who join and talk in the space can be tracked and rewarded.

---

## 3. Adam's Commercial Offer for ZAOstock

Adam wants to help think through a real commercial model for ZAOstock - **as a volunteer**, explicitly fine with ZAOstock being a loss leader in year 1.

- Adam could potentially help line up **backing / financing** for the festival and expose Zaal to financing contacts ("my favorite people to financing opportunities").
- Adam referenced standard festival economics: tiered tickets + selling beverages are how festivals make money.
- Adam noticed Zaal had started the Pro Ticket tier (the $50, 20-spot crowdfunding round - see `src/app/page.tsx` Pro Ticket section in the zaostock repo) and flagged that as the kind of mechanism worth developing.
- Adam pointed to a grassroots Art-Basel-adjacent Miami festival as a model - amazing artists, grassroots vibe, "people love getting in on the ground floor." (Adam to dig out the name.)
- Adam: if ZAOstock can land a genuinely big artist, there may be room to "wangle something" with artist management.
- **Next call is dedicated to this.** Zaal to brainstorm commercial-model ideas and send them to Adam async over the next couple of days, so the next call is a working session, not a cold start.

This thread overlaps with the planned 3-way Zaal + Adam + FailOften commercial conversation already tracked as a task.

---

## 4. Zaal's ZAOstock Updates (shared with Adam)

- **Pitch + Luma:** in progress. (Luma has since gone live at ticket.zaostock.com.)
- **ZABAL Games:** a vibe-coding challenge concept - give people a context pack about The ZAO, they build something for the ecosystem, then stream + distribute it. Framed as a big attention-getter. Zaal to send Adam a link.
- **OKX sponsorship target:** Zaal has a friend at OKX who shares what OKX is sponsoring. Angle: OKX may not sponsor ZAOstock directly, but could sponsor The ZAO to attend events like DevCon India. Zaal is attacking this on his end.
- **Farcaster focus:** Zaal is heavily focused on Farcaster personally - has built a reputation there and is getting strong signal. "Everyone's sleeping on it."
- **Cross-Spaces audio API:** a Spaces-app contact sent Zaal an API connection so anyone from any Spaces client can interact - even from Zaal's own website or another client.
- **3 ZAOstock partnership tiers:** (1) day-of physical / on-site sponsorship, (2) online broadcast sponsorship, (3) year-round sponsorship ("bring your branding, we bring customers to your thing too").

---

## 5. Working Cadence

Both agreed the current pace is too slow for the volume of decisions in front of them.

- Move to **2-3x per week** check-ins (the pace they ran before), even if some are just 2-minute "still doing X, not doing Y" syncs.
- Each person brings an agenda so the time is high-value.
- Zaal's stated workflow: pull the call transcript into his AI and ask "what are the next steps" - which is exactly how this doc was produced.

---

## Open Threads (Unresolved on the Call)

| Thread | Why it's open |
|--------|---------------|
| Q1 monthly-subscription deal formal close | Adam offered to end it; Zaal acknowledged the model didn't work but did not explicitly say "yes, close it." Needs a one-line confirmation. |
| New monthly server cost for the slimmed leaderboard | Adam + Legash have not produced the number yet. |
| ZAOstock commercial model | Entire model is the subject of the next call. Nothing decided yet beyond "Adam helps as a volunteer." |
| The Miami grassroots-festival reference | Adam to dig out the name as a model to study. |

---

## Also See

- [Doc 582 - Empire Builder V3 Live Launch](../582-empire-builder-v3-live-launch/)
- [Doc 583 - Empire Builder x ZAO OS Integration Ideas](../583-empire-builder-zao-os-integration-ideas/)
- [Doc 585 - Empire Builder Test Loop Ideas Iteration 2](../585-empire-builder-test-loop-ideas-iteration-2/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm to Adam: formally close the Q1 monthly-subscription deal | @Zaal | Message | Next call |
| Ask Legash: remove X scraper, change leaderboard display to May-to-now, export current stats if easy | @Adam | Task | This week |
| Produce the new monthly server cost for the slimmed leaderboard | @Adam + Legash | Task | Before next call |
| PR an Empire Builder API endpoint to expose leaderboard data | @Zaal | PR | TBD |
| Brainstorm ZAOstock commercial-model ideas, send to Adam async | @Zaal | Doc | Next couple of days |
| Bring commercial-model thinking to the next call | @Adam | Meeting prep | Next call |
| Dig out the name of the grassroots Art-Basel-adjacent Miami festival | @Adam | Lookup | Next call |
| Send Adam the ZABAL Games concept link | @Zaal | Message | This week |
| Pursue OKX sponsorship via the OKX-friend contact (angle: sponsor ZAO to attend DevCon India etc.) | @Zaal | Outreach | Ongoing |
| Submit bio + photo for the team dashboard | @Adam | Task | ASAP |
| Move Zaal x Adam syncs to 2-3x per week with agendas | @Both | Calendar | Starting now |

## Sources

- Zaal x Adam call, voice-transcribed, mid-May 2026 (primary source).
- ZAOstock Luma event: [ticket.zaostock.com](https://ticket.zaostock.com) (302 -> luma.com/vhwv9n2h)
- ZAOstock festival page: [zaostock.com](https://zaostock.com)
- Empire Builder integration context: research docs 582, 583, 585 in this library.
