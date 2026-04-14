# ZAO Stock Standup Kickoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the living dashboard doc for ZAO Stock standups and add a public Teams section to zaoos.com/stock.

**Architecture:** Two deliverables - (1) a markdown dashboard at `ZAO-STOCK/standups/dashboard.md` with team rosters, resources, attendance log, and today's agenda, (2) update `src/app/stock/page.tsx` with static team data arrays and new sections for Teams and Partners. No new components needed - the page is a server component with static data.

**Tech Stack:** Next.js (server component), Tailwind CSS v4, Markdown

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `ZAO-STOCK/standups/dashboard.md` | Living team dashboard - rosters, resources, attendance, weekly notes |
| Modify | `src/app/stock/page.tsx` | Add TEAMS and PARTNERS data arrays + render team cards and partners section |

---

### Task 1: Create the Living Dashboard Doc

**Files:**
- Create: `ZAO-STOCK/standups/dashboard.md`

- [ ] **Step 1: Create the standups directory and dashboard file**

```markdown
# ZAO Stock - Team Dashboard

> **Standup:** Tuesdays, 10:00 AM EST
> **Format:** Each team reports what they did + what they need support on
> **Started:** April 14, 2026

---

## Team Rosters

### Operations
| Role | Person | Strengths |
|------|--------|-----------|
| **Lead** | Zaal | ZAO founder, project vision, tech, partnerships |
| **2nd** | AttaBotty | 20+ years production, ZAO-Chella organizer, NFTNYC/Art Basel |
| Member | FailOften | NEA/Warhol-funded installations, KCAI professor, Processing/TouchDesigner |
| Member | Hurric4n3Ike | Live entertainment, WaveWarZ (647 battles), performing artist |
| Member | Swarthy Hatter | Media/content capture, cross-fractal community bridging |
| Member | DCoop | Performing artist, production support, ZAOVille parallel event |
| Member | Steve Peer* | 37 years Ellsworth music, Black Moon Public House, local network |

*Not yet pitched

### Finance
| Role | Person | Strengths |
|------|--------|-----------|
| **Lead** | Zaal | Budget oversight, crowdfunding strategy, partnerships |
| **2nd** | Candy | Milk Road/Impact3 sponsorship pipeline ($10-25K/send), grant knowledge |
| Member | Tyler Stambaugh | JPMorgan + Accenture finance, Magnetiq COO, grant writing |
| Member | Ohnahji B | Community fundraising, 5K NFTs minted, education-track funding |

### Design
| Role | Person | Strengths |
|------|--------|-----------|
| **Lead** | DaNici | Blender, animation, digital painting, festival visual identity |
| **2nd** | Candy | ZAO #2, WaveWarZ branding, dApp design, 557 GitHub contributions |
| Member | FailOften | Processing/TouchDesigner/Resolume for live visuals, Times Square projections |
| Member | AttaBotty | 10K+ NFTs, Base Onchain Registry, electronic music production |

---

## Resources Landscape

### External Partners

| Resource | What They Bring | Status |
|----------|----------------|--------|
| Heart of Ellsworth / Cara Romano | Venue, volunteers, MCW statewide promo | CONFIRMED |
| Wallace Events | Tent rental, weather backup | NOT CONTACTED |
| One Love Art DAO | Global art nonprofit, 600+ artists | FailOften connection |
| Black Moon Public House / Steve Peer | After-party venue, local music network | VIA STEVE PEER (not yet pitched) |
| Local businesses (Fogtown, Precipice, Atlantic Art Glass, etc.) | Sponsorship + in-kind | NOT CONTACTED |

### Potential Recruits

- Other ZAO members with relevant skills (content creators, developers, musicians)
- Ohnahji's ONJU network (education track volunteers)
- FailOften's KCAI students (installations, creative tech)

### Tools & Platforms

| Tool | Purpose |
|------|---------|
| Fractured Atlas 501(c)(3) | Tax-deductible sponsorships + donations |
| Giveth | Crypto crowdfunding |
| GoFundMe | Traditional crowdfunding |
| Mirror | Onchain fundraising post |
| 0xSplits | Transparent artist payment splits |
| ZAO OS livestream | Built-in, non-negotiable for the event |
| POAP | Attendance tokens for attendees |

---

## Attendance Log

### April 14, 2026 - Kickoff
| Name | Present | Notes |
|------|---------|-------|
| Zaal | | |
| AttaBotty | | |
| DaNici | | |
| FailOften | | |
| Hurric4n3Ike | | |
| Candy | | |
| Tyler Stambaugh | | |
| Ohnahji B | | |
| Swarthy Hatter | | |
| DCoop | | |

---

## Weekly Notes

### April 14, 2026 - Kickoff Meeting

**Agenda:**
1. Welcome + what ZAO Stock standup is (2 min)
2. Team structure explanation + roster reveal (5 min)
3. Resources landscape - who and what is available (5 min)
4. Open discussion + team assignment shuffling (10 min)
5. Next steps + action items (3 min)

**Key Points:**
- First official standup with team structure
- Three teams: Operations, Finance, Design
- Future suggestions join Operations until a new team is warranted
- Attendance tracked to reward early contributors long-term

**Action Items:**
- [ ] _To be filled during/after meeting_

---

_Template for future weeks:_

<!--
### [Date] - Week N

**Operations Report:**
- Did:
- Need:

**Finance Report:**
- Did:
- Need:

**Design Report:**
- Did:
- Need:

**Action Items:**
- [ ]
-->
```

- [ ] **Step 2: Commit**

```bash
git add ZAO-STOCK/standups/dashboard.md
git commit -m "docs: ZAO Stock standup dashboard - kickoff April 14"
```

---

### Task 2: Add Teams and Partners to /stock Page

**Files:**
- Modify: `src/app/stock/page.tsx`

- [ ] **Step 1: Add TEAMS data array after PAST_EVENTS**

Add this after the `PAST_EVENTS` array (line 53) in `src/app/stock/page.tsx`:

```typescript
const TEAMS = [
  {
    name: 'Operations',
    emoji: '',
    lead: 'Zaal',
    second: 'AttaBotty',
    members: ['FailOften', 'Hurric4n3Ike', 'Swarthy Hatter', 'DCoop'],
  },
  {
    name: 'Finance',
    emoji: '',
    lead: 'Zaal',
    second: 'Candy',
    members: ['Tyler Stambaugh', 'Ohnahji B'],
  },
  {
    name: 'Design',
    emoji: '',
    lead: 'DaNici',
    second: 'Candy',
    members: ['FailOften', 'AttaBotty'],
  },
];

const PARTNERS = [
  { name: 'Heart of Ellsworth', role: 'Venue + MCW statewide promotion', confirmed: true },
  { name: 'Fractured Atlas', role: '501(c)(3) fiscal sponsor', confirmed: true },
  { name: 'Black Moon Public House', role: 'After-party venue', confirmed: false },
  { name: 'Wallace Events', role: 'Tent rental + weather backup', confirmed: false },
];
```

- [ ] **Step 2: Add Teams section JSX after the Lineup section**

Insert after the `{/* Lineup */}` section (after line 118) in `src/app/stock/page.tsx`:

```tsx
{/* Team */}
<section className="space-y-3">
  <p className="text-xs text-gray-500 uppercase tracking-wider px-1">The Team</p>
  <div className="space-y-3">
    {TEAMS.map((team) => (
      <div key={team.name} className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="bg-gradient-to-r from-[#f5a623]/20 to-transparent px-4 py-2.5">
          <span className="font-bold text-sm text-[#f5a623]">{team.name}</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 rounded-full px-2.5 py-1 font-medium">
              {team.lead}
              <span className="text-[10px] text-[#f5a623]/60">Lead</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-full px-2.5 py-1">
              {team.second}
              <span className="text-[10px] text-gray-500">2nd</span>
            </span>
            {team.members.map((m) => (
              <span key={m} className="text-xs bg-white/[0.04] text-gray-400 border border-white/[0.06] rounded-full px-2.5 py-1">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Add Partners section JSX after the Team section**

Insert immediately after the Team section:

```tsx
{/* Partners */}
<section className="space-y-3">
  <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Partners</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {PARTNERS.map((partner) => (
      <div key={partner.name} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white text-sm">{partner.name}</p>
          {partner.confirmed && (
            <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 rounded-full px-1.5 py-0.5">Confirmed</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{partner.role}</p>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Verify the build compiles**

Run: `cd /Users/zaalpanthaki/Documents/ZAO\ OS\ V1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/stock/page.tsx
git commit -m "feat(stock): add team rosters and partners to /stock page"
```
