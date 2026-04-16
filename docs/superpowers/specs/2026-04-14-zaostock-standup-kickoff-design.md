# ZAOstock Standup Kickoff - Design Spec

> **Date:** 2026-04-14
> **Status:** Approved
> **Scope:** Living dashboard doc + /stock page team display

---

## Overview

Create the ZAOstock weekly standup system: a living dashboard markdown doc for internal team management, and a public-facing teams section on zaoos.com/stock. Today (April 14) is the kickoff meeting.

## Standup Structure

- **When:** Tuesdays, 10am EST
- **Format:** Each team shares weekly report (what they did + what they need)
- **Teams:** Operations, Finance, Design
- **Roles per team:** Primary lead, secondary lead, team members
- **Attendance:** Logged each week to reward early contributors long-term

---

## Part 1: Living Dashboard Doc

**File:** `ZAO-STOCK/standups/dashboard.md`

### Team Rosters

```
OPERATIONS                FINANCE                  DESIGN
Lead: Zaal                Lead: Zaal               Lead: DaNici
2nd:  AttaBotty           2nd:  Candy              2nd:  Candy
---                       ---                      ---
FailOften                 Tyler Stambaugh          FailOften
Hurric4n3Ike              Ohnahji B                AttaBotty
Swarthy Hatter
DCoop
Steve Peer*
```

*Steve Peer not yet pitched

**Assignment rationale:**
- AttaBotty as Ops 2nd: 20+ years production, ran ZAO-Chella, NFTNYC/Art Basel veteran
- Candy as Finance 2nd: ran $10-25K/send sponsorship pipeline at Milk Road/Impact3
- Candy also on Design: ZAO #2, all WaveWarZ branding, 557 GitHub contributions - bridges both teams
- Tyler on Finance: JPMorgan + Accenture finance background, grant writing experience
- Ohnahji on Finance: community fundraising, 5K NFTs minted, ran weekly education sessions
- FailOften on Ops + Design: NEA/Warhol-funded installations (Ops), Processing/TouchDesigner/Resolume for live visuals (Design)
- Hurric4n3Ike on Ops: live entertainment, WaveWarZ coordination, performing artist
- Swarthy/DCoop on Ops: media/content capture, production support, performing

### Resources Landscape

**External Partners:**

| Resource | What They Bring | Status |
|----------|----------------|--------|
| Heart of Ellsworth / Cara Romano | Venue, volunteers, MCW statewide promo | CONFIRMED |
| Wallace Events | Tent rental, weather backup | NOT CONTACTED |
| One Love Art DAO | Global art nonprofit, 600+ artists | FailOften connection |
| Black Moon Public House / Steve Peer | After-party venue, local music network | VIA STEVE PEER (not yet pitched) |
| Local businesses (Fogtown, Precipice, Atlantic Art Glass, etc.) | Sponsorship + in-kind | NOT CONTACTED |

**Potential Recruits:**
- Other ZAO members with relevant skills
- Ohnahji's ONJU network (education track volunteers)
- FailOften's KCAI students (installations, creative tech)

**Tools & Platforms:**

| Tool | Purpose |
|------|---------|
| Fractured Atlas 501(c)(3) | Tax-deductible sponsorships + donations |
| Giveth | Crypto crowdfunding |
| GoFundMe | Traditional crowdfunding |
| Mirror | Onchain fundraising post |
| 0xSplits | Transparent artist payment splits |
| ZAO OS livestream | Built-in, non-negotiable for the event |
| POAP | Attendance tokens for attendees |

### Attendance Log

Dated entries each Tuesday. Who showed up, who contributed.

### Weekly Notes

Appended each Tuesday with team reports + action items.

---

## Part 2: Today's Agenda (April 14, 2026)

**ZAO STOCK STANDUP - Kickoff**
Tuesday, April 14, 2026 - 10:00 AM EST

1. **Welcome + What This Is** (2 min)
   - Weekly standup, Tuesdays 10am EST
   - Each team reports: what you did, what you need
   - Attendance tracked - early contributors rewarded long-term

2. **Team Structure** (5 min)
   - Three teams: Operations, Finance, Design
   - Each has a lead, a second, and members
   - Present proposed roster, discuss and shuffle

3. **Resources Landscape** (5 min)
   - External partners (confirmed + to contact)
   - Potential recruits from the community
   - Tools and platforms available

4. **Open Discussion + Assignment** (10 min)
   - Confirm or shuffle team assignments
   - Identify immediate gaps
   - Any suggestions for future teams roll into Operations for now

5. **Next Steps + Action Items** (3 min)
   - Each person: one thing you'll do before next Tuesday
   - Note blockers

---

## Part 3: /stock Page Update

Add a "The Team" section to `src/app/stock/page.tsx`.

**What to show publicly:**
- Three team cards (Operations, Finance, Design) with lead + member names
- Confirmed partners section
- Keep it factual - only things that are true right now

**Implementation:**
- Static data arrays in the page component (same pattern as existing `SPONSOR_OFFERINGS`)
- Cards follow existing dark theme (navy bg, gold accent, white/gray text)
- Mobile-first layout, responsive grid

**What NOT to show:**
- Internal assignment rationale
- Contact statuses (NOT CONTACTED, etc.)
- Attendance logs
- Budget details
- Anything speculative or unconfirmed
- Steve Peer's name (not yet pitched - add only after he's confirmed)
