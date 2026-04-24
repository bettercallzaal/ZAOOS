---
title: ZAOstock Circles v1 Dashboard Design Spec
date: 2026-04-24
status: design-phase
related_docs: 502 (spec), 501 (onboarding), 499 (governance)
author: Claude Code
---

# ZAOstock Circles v1 Dashboard Design Spec

**Objective:** Design UX flows for flat-org governance dashboard that evolves `/stock/team` from role/scope columns to circles-based team structure, with new pages for circle discovery, proposals, and Respect leaderboard.

**Scope:** 4 new pages + 8 new components + navigation changes to existing `/stock/team` profile page.

**Key Design Constraint:** All changes must protect flatness - no visual hierarchy by tenure, role length, or Respect score. Coordinator badge rotates out explicitly at 8 weeks. Zaal is "Convener" (italic, small tag), not elevated.

---

## Page Inventory & Wireframes

### Page 1: `/stock/team` (Enhanced Team Dashboard)

**Status:** Existing page, UX changes only.

**Changes:**
1. Replace `role` and `scope` columns with single "Circles" column (multi-tag display)
2. Add "My First Week" card at top (only visible <14 days from first_login)
3. Add "Silent Star" warning banner (admin-only, if anyone >40% Q/A last 7 days)
4. Each team member card shows coordinator badge if currently coordinator of any circle

**ASCII Wireframe:**

```
┌─────────────────────────────────────────────────────┐
│  ZAOSTOCK TEAM DASHBOARD                            │
└─────────────────────────────────────────────────────┘

[OPTIONAL] ┌──────────────────────────────────────────┐
"My First │ Welcome, [Name]!                          │
Week"     │ Your buddy: [Name] [DM]                   │
Card only │                                            │
<14 days  │ Pick 1-3 first tasks:                     │
          │ [ ] Doc: Add yourself to member list      │
          │ [ ] Intro in #zaostock (15 min)           │
          │ [ ] Pick 3 circles you're drawn to        │
          │                                            │
          │ Browse circles: [Music] [Ops] [Partners]  │
          │                                            │
          │ How decisions happen → [routing rules]    │
          └──────────────────────────────────────────┘

[OPTIONAL] ┌──────────────────────────────────────────┐
Admin      │ ALERT: Silent Star detected               │
banner     │ >40% of Q/A last 7 days from: [name]     │
only       │ Action: Rotate knowledge duty or docs.   │
           └──────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Team Members                                          │
├──────────────────────────────────────────────────────┤
│ [Avatar] Name              Circles        Status      │
│                                                       │
│          Zaal              [music] [ops]  CONVENER*   │
│          *italic, small,    (no badge)                │
│           gold text                                   │
│                                                       │
│          DCoop             [music]        coordinator │
│          (gold pill,        rotation ends              │
│           8w countdown)     in 6w                     │
│                                                       │
│          FailOften         [ops] [merch]  member     │
│                                                       │
│          Candy             [music]        member     │
└──────────────────────────────────────────────────────┘

[Tap member name] → /stock/team/[slug] profile page
                   (existing, no change)

[Tap circle tag] → /stock/circles/[circle-name]
```

---

### Page 2: `/stock/circles` (Circle Discovery Hub)

**Status:** New page.

**Route:** `/stock/circles`

**Purpose:** Browse all circles, see members, open proposals, join/leave.

**ASCII Wireframe:**

```
┌──────────────────────────────────────────────────────┐
│ CIRCLES                                              │
│ Join circles that match your interests. Min 1, max 5.│
│                                                      │
│ [Filter: All / My Circles / Open] [Sort: Coord End]│
└──────────────────────────────────────────────────────┘

[CircleCard 1]
┌────────────────────────────────────────────────────┐
│ MUSIC                                              │
│ Artist booking, sound, stage programming          │
│                                                    │
│ Coordinator: DCoop (6w remaining)                 │
│ Members: [Avatar] [Avatar] [Avatar] +2 more       │
│ [Expand list] [All members: 7]                    │
│                                                    │
│ Open proposals: 2                                  │
│ [View proposals] → /stock/proposals?circle=music  │
│                                                    │
│ [You're in]                                        │
│ [Leave circle]                                     │
│                                                    │
│ OR                                                 │
│                                                    │
│ [Join this circle]                                 │
└────────────────────────────────────────────────────┘

[CircleCard 2]
┌────────────────────────────────────────────────────┐
│ OPS                                                │
│ Site, power, tents, vendors, logistics            │
│                                                    │
│ Coordinator: FailOften (2w remaining)             │
│ Members: [Avatar] [Avatar] [Avatar] [Avatar] +4   │
│ [Expand list]                                      │
│                                                    │
│ Open proposals: 0                                  │
│                                                    │
│ [Join this circle]                                 │
└────────────────────────────────────────────────────┘

[Similar cards for: PARTNERS, MERCH, MARKETING, HOST]

[All cards use: navy #0a1628 bg, gold #f5a623 accents]
```

---

### Page 3: `/stock/proposals` (Consent Proposals List)

**Status:** New page.

**Route:** `/stock/proposals?circle=[name]`

**Purpose:** View open strategy proposals in Loomio, vote on (silent consent + objection path).

**ASCII Wireframe:**

```
┌──────────────────────────────────────────────────────┐
│ PROPOSALS (Strategy Decisions)                      │
│                                                      │
│ Filtered: [All circles] [Music] [Ops] [Partners]  │
│           [Sort: Most Urgent] [Status: Open Only]  │
└──────────────────────────────────────────────────────┘

[ProposalCard 1 - OPEN]
┌────────────────────────────────────────────────────┐
│                                                    │
│ "Increase set times from 45m to 60m for each      │
│  artist" (Requested by: Shawn @ Music circle)     │
│                                                    │
│ [Music] [Strategy decision]                        │
│                                                    │
│ Silent consent ends: Fri Apr 26, 3pm ET            │
│ ████████░░░ 34h remaining                          │
│                                                    │
│ Consensus so far: 4 silent (yes), 0 objections   │
│ Circle members: 7 total                            │
│                                                    │
│ [If circle member: [Object] [Support] buttons]   │
│ [If not: "Join Music circle to participate"]      │
│                                                    │
│ Decision outcome: PENDING                          │
│ [View full discussion & Loomio link]               │
│                                                    │
└────────────────────────────────────────────────────┘

[ProposalCard 2 - OBJECTION RAISED]
┌────────────────────────────────────────────────────┐
│ "Use Restream for broadcast multistreaming"        │
│ (Requested by: Zaal @ Marketing)                   │
│                                                    │
│ [Marketing] [Ops execution]                        │
│                                                    │
│ Objection raised by: Geek (resolved in chat)      │
│ Decision outcome: RESOLVED (moving forward)        │
│                                                    │
│ [View outcome summary]                             │
└────────────────────────────────────────────────────┘

[ProposalCard 3 - DECIDED]
┌────────────────────────────────────────────────────┐
│ "Partner tier 1 budget $3K"                        │
│                                                    │
│ [Partners] [Strategy]                              │
│                                                    │
│ Decided: Apr 20 - Consent approved                │
│ [View full outcome]                                │
└────────────────────────────────────────────────────┘
```

---

### Page 4: `/stock/respect` (Respect Leaderboard & History)

**Status:** New page.

**Route:** `/stock/respect`

**Purpose:** See who earned Respect, for what, and why. Transparent contribution tracking (not primary sort on team dashboard).

**ASCII Wireframe:**

```
┌──────────────────────────────────────────────────────┐
│ ZAOSTOCK RESPECT                                    │
│ Peer-ranked contributions. Soulbound, not a salary. │
│                                                      │
│ [Sort: Total / Recent] [Circle filter]              │
└──────────────────────────────────────────────────────┘

LEADERBOARD (This Cycle: Apr 1 - Jun 15)
┌────────────────────────────────────────────────────┐
│ Rank  Member        Total   Recent        Emoji    │
├────────────────────────────────────────────────────┤
│ 1.    Zaal          110     +26 (this week)  [star]│
│ 2.    DCoop         68      +10             [music]│
│ 3.    FailOften     42      +0              [gear] │
│ 4.    Shawn         42      +26             [music]│
│ ...                                                 │
│                                                    │
│ [Tap any name] → /stock/respect/[slug]            │
│                 (Full history of all contributions)│
└────────────────────────────────────────────────────┘

RECENT RESPECT EVENTS (Feed)
┌────────────────────────────────────────────────────┐
│ Today                                              │
│                                                    │
│ Shawn earned 26 Respect (Level 4)                 │
│ "Coordinated Trombone section at rehearsal"       │
│ voted by: DCoop, Candy, Iman                       │
│ [+2w ago] [circle: music]                         │
│                                                    │
│ Yesterday                                          │
│                                                    │
│ Zaal earned 26 Respect (Level 4)                  │
│ "Negotiated sponsor deal + contract"              │
│ voted by: FailOften, Geek, Hurric4n3Ike          │
│ [circle: partners]                                │
│                                                    │
│ [Older] → [View full feed]                        │
└────────────────────────────────────────────────────┘
```

**Individual Member Page: `/stock/respect/[slug]`**

```
┌────────────────────────────────────────────────────┐
│ [Avatar] DCoop                                     │
│ Total Respect: 68  (Cycle: 110)                   │
│ Member of: [Music] [Merch]                        │
│                                                    │
│ Earning breakdown:                                 │
│ - Level 4 (42): Artist Booking prep (1x)         │
│ - Level 3 (26): Sound check logistics (2x)       │
│ - Level 2 (0):                                     │
│                                                    │
│ Full history:                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ Apr 15: L4 Artist booking (DCoop voted)      │  │
│ │ Apr 10: L3 Sound engineer coordination       │  │
│ │ Apr 5:  L3 Stage layout design               │  │
│ │ (more...)                                    │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Export as PDF for surplus payout calculation]   │
└────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **CircleCard** (`src/components/stock/circles/CircleCard.tsx`)

**Props:**
```typescript
interface CircleCardProps {
  circle: {
    id: string
    name: string // 'music', 'ops', 'partners', 'merch', 'marketing', 'host'
    description: string
    color?: 'gold' | 'silver' | 'bronze' // optional visual accent
  }
  coordinator: {
    name: string
    rotationEndsAt: Date
  } | null
  memberCount: number
  memberAvatars: Array<{ id: string; name: string; photo_url: string }>
  openProposalCount: number
  currentUserMembership: 'member' | 'not-member' | null
  onJoin: (circleId: string) => Promise<void>
  onLeave: (circleId: string) => Promise<void>
}
```

**Design Notes:**
- Navy background (#0a1628), gold accents (#f5a623)
- Coordinator rotation countdown in small gray text
- Member avatars clickable to expand full list
- "Join" / "Leave" buttons context-sensitive (only if user logged in)
- Mobile: full width, 2 cols on tablet, 3 cols on desktop

---

### 2. **ProposalCard** (`src/components/stock/proposals/ProposalCard.tsx`)

**Props:**
```typescript
interface ProposalCardProps {
  proposal: {
    id: string
    title: string
    description?: string
    circleId: string
    proposedBy: { id: string; name: string }
    decisionType: 'strategy' | 'ops-execution' | 'cross-circle'
    status: 'open' | 'resolved' | 'decided'
    outcome?: 'approved' | 'objection-raised' | 'consensus'
  }
  timeline: {
    createdAt: Date
    silentEndsAt?: Date // for open proposals
    decidedAt?: Date
  }
  consentMetrics: {
    silentYes: number
    objections: number
    circleMemberCount: number
  }
  currentUserRole: 'member' | 'non-member'
  onObjection?: (proposalId: string) => Promise<void>
  onSupport?: (proposalId: string) => Promise<void>
}
```

**Design Notes:**
- Show countdown timer prominently for open proposals (silent window ending)
- Objection button appears only if user is circle member AND proposal is open
- Color-coded by status: gold border for open, gray for decided, red-warning for objection-raised
- Responsive: click card → `/stock/proposals/[id]` for full thread

---

### 3. **FirstWeekCard** (`src/components/stock/team/FirstWeekCard.tsx`)

**Props:**
```typescript
interface FirstWeekCardProps {
  user: {
    id: string
    name: string
    firstLoginAt: Date
  }
  buddy: {
    id: string
    name: string
    telegramHandle?: string
  } | null
  firstTaskOptions: Array<{
    id: string
    title: string
    description: string
    circleId?: string
    estimatedMinutes: number
    status: 'unclaimed' | 'claimed-by-me' | 'claimed-by-other'
  }>
  circles: Array<{
    id: string
    name: string
    description: string
    memberCount: number
  }>
}
```

**Design Notes:**
- Only visible if `Date.now() - user.firstLoginAt < 14 days`
- Buddy name + TG handle with 1-click DM link
- First tasks are selectable (not assigned); user picks what appeals
- Circle map is interactive (click circle → `/stock/circles/[name]`)
- Auto-hide after week 2 (controlled by `firstLoginAt` check)
- Gold background accent, welcoming tone

---

### 4. **SilentStarBanner** (`src/components/stock/team/SilentStarBanner.tsx`)

**Props:**
```typescript
interface SilentStarBannerProps {
  silentMember: {
    id: string
    name: string
    qaRatioLastWeek: number // 0.42 = 42%
  }
  adminOnly: boolean // only visible to admins (check session)
}
```

**Design Notes:**
- Red/warning border (#f5a623 or subtle red)
- Text: "ALERT: Silent Star detected. [Name] answered >40% of Qs this week. Consider rotating knowledge-sharing or doc update."
- CTA: "View Q/A log" → admin view of log
- Only renders if user is admin AND condition is true
- Mobile: full-width sticky at top or dismissible

---

### 5. **CoordinatorBadge** (`src/components/stock/circles/CoordinatorBadge.tsx`)

**Props:**
```typescript
interface CoordinatorBadgeProps {
  coordinatorName: string
  rotationEndsAt: Date
  circleId: string
}
```

**Design Notes:**
- Small pill shape, gold background (#f5a623), dark text
- Text: "coordinator" (lowercase)
- Show countdown: "6w remaining" in small gray text below
- Rotates out at 8w (becomes `null`)
- On individual team card: show all coordinator roles as separate badges

---

### 6. **ConvenerTag** (`src/components/stock/team/ConvenerTag.tsx`)

**Props:**
```typescript
interface ConvenerTagProps {
  circleName?: string // optional, for context
}
```

**Design Notes:**
- Italic, small font size
- Text: "convener"
- Single tag only (not elevated or repeated)
- Gold text, not a pill
- Appears only on Zaal's member card
- NOT a badge / not a rank, just a label for legal role

---

### 7. **RespectLeaderboard** (`src/components/stock/respect/RespectLeaderboard.tsx`)

**Props:**
```typescript
interface RespectLeaderboardProps {
  members: Array<{
    id: string
    name: string
    totalRespect: number
    recentRespect: number
    circleIds: string[]
    avatar_url: string
  }>
  sortBy: 'total' | 'recent'
  filterCircle?: string
  onMemberClick: (memberId: string) => void
}
```

**Design Notes:**
- DO NOT make Respect the primary sort on `/stock/team` (protects flatness)
- Rank by total is OK here, but in team dashboard use join date
- Recent Respect (last cycle) shown in secondary column
- Clickable rows link to `/stock/respect/[slug]`
- Mobile: stack columns, swipe to sort
- Include note: "Respect is earned, not assigned. Payouts from surplus only."

---

### 8. **RespectFeed** (`src/components/stock/respect/RespectFeed.tsx`)

**Props:**
```typescript
interface RespectFeedProps {
  events: Array<{
    id: string
    memberId: string
    memberName: string
    circleId: string
    level: 1 | 2 | 3 | 4 | 5 | 6
    points: 10 | 16 | 26 | 42 | 68 | 110
    reason: string
    votedBy: string[] // [name, name, name]
    earnedAt: Date
  }>
  onMemberClick: (memberId: string) => void
  limit?: number // default 10
}
```

**Design Notes:**
- Show most recent first
- Each event shows member name + points + reason + voter names + circle tag
- Voter names are clickable avatars
- "Recent" = last 7 days, or configurable
- Feed can be filtered by circle

---

## API Routes (Backend)

### 1. `GET /api/stock/circles`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "music",
      "name": "Music",
      "description": "Artist booking, sound, stage programming",
      "coordinator": {
        "id": "...",
        "name": "DCoop",
        "rotationEndsAt": "2026-06-15"
      },
      "memberCount": 7,
      "members": [{ "id": "...", "name": "...", "photo_url": "..." }],
      "openProposalCount": 2
    }
  ]
}
```

### 2. `POST /api/stock/circles/[circleId]/join`
**Request:** `{ userId?: string }`
**Response:** `{ success: true, message: "Joined circle" }`
**Auth:** Check session, return 401 if not authenticated

### 3. `POST /api/stock/circles/[circleId]/leave`
**Request:** `{ userId?: string }`
**Response:** `{ success: true, message: "Left circle" }`
**Auth:** Check session

### 4. `GET /api/stock/proposals?circle=[circleId]&status=[open|resolved|decided]`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "...",
      "circleId": "...",
      "proposedBy": { "id": "...", "name": "..." },
      "decisionType": "strategy",
      "status": "open",
      "silentEndsAt": "2026-04-26T15:00:00Z",
      "consentMetrics": {
        "silentYes": 4,
        "objections": 0,
        "circleMemberCount": 7
      }
    }
  ]
}
```

### 5. `POST /api/stock/proposals/[proposalId]/object`
**Request:** `{ reasonBrief?: string }`
**Response:** `{ success: true, objecterId: "...", createdAt: "..." }`
**Auth:** Verify user is circle member

### 6. `GET /api/stock/respect?circle=[circleId]&sortBy=total|recent`
**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "memberId": "...",
        "memberName": "Zaal",
        "totalRespect": 110,
        "recentRespect": 26,
        "circleIds": ["music", "ops"]
      }
    ],
    "feed": [
      {
        "id": "...",
        "memberId": "...",
        "memberName": "Shawn",
        "level": 4,
        "points": 26,
        "reason": "Coordinated trombone section at rehearsal",
        "votedBy": ["DCoop", "Candy"],
        "earnedAt": "2026-04-24T14:00:00Z",
        "circleId": "music"
      }
    ]
  }
}
```

### 7. `GET /api/stock/respect/[memberId]`
**Response:**
```json
{
  "success": true,
  "data": {
    "member": { "id": "...", "name": "DCoop" },
    "totalRespect": 68,
    "history": [
      {
        "earnedAt": "2026-04-15",
        "level": 4,
        "points": 42,
        "reason": "Artist booking prep",
        "circleId": "music",
        "votedBy": ["Zaal", "Shawn"]
      }
    ]
  }
}
```

### 8. `GET /api/stock/team/first-week-check?userId=[userId]`
**Response:**
```json
{
  "success": true,
  "showCard": true,
  "daysOld": 5,
  "buddy": {
    "id": "...",
    "name": "Candy",
    "telegramHandle": "@candy_handle"
  },
  "firstTasks": [
    {
      "id": "task-1",
      "title": "Doc: Add yourself to member list",
      "description": "Update the member list in Supabase",
      "estimatedMinutes": 30,
      "status": "unclaimed"
    }
  ]
}
```

### 9. `GET /api/stock/team/silent-star-check` (Admin only)
**Response:**
```json
{
  "success": true,
  "alertActive": true,
  "silentMember": {
    "id": "...",
    "name": "PersonX",
    "qaCount": 12,
    "totalQaCount": 28,
    "ratio": 0.43
  },
  "period": "last-7-days"
}
```

---

## Data Schema Additions

### New Supabase Tables

**1. `stock_circles`**
```sql
CREATE TABLE stock_circles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. `stock_circle_members`**
```sql
CREATE TABLE stock_circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id TEXT REFERENCES stock_circles(id),
  member_id UUID REFERENCES stock_team_members(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(circle_id, member_id)
);
```

**3. `stock_coordinators`**
```sql
CREATE TABLE stock_coordinators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id TEXT REFERENCES stock_circles(id),
  member_id UUID REFERENCES stock_team_members(id),
  started_at TIMESTAMP DEFAULT NOW(),
  rotation_ends_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4. `stock_consent_proposals`**
```sql
CREATE TABLE stock_consent_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  circle_id TEXT REFERENCES stock_circles(id),
  proposed_by UUID REFERENCES stock_team_members(id),
  decision_type TEXT CHECK (decision_type IN ('strategy', 'ops-execution', 'cross-circle')),
  status TEXT CHECK (status IN ('open', 'resolved', 'decided')) DEFAULT 'open',
  outcome TEXT CHECK (outcome IN ('approved', 'objection-raised', 'consensus')),
  silent_ends_at TIMESTAMP,
  decided_at TIMESTAMP,
  loomio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**5. `stock_respect_events`**
```sql
CREATE TABLE stock_respect_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES stock_team_members(id),
  circle_id TEXT REFERENCES stock_circles(id),
  level INT CHECK (level BETWEEN 1 AND 6),
  points INT,
  reason TEXT NOT NULL,
  voted_by UUID[] DEFAULT ARRAY[]::uuid[], -- array of voter IDs
  earned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**6. Update `stock_team_members`**
```sql
ALTER TABLE stock_team_members
ADD COLUMN circles TEXT[] DEFAULT ARRAY[]::text[],
ADD COLUMN is_convener BOOLEAN DEFAULT FALSE,
ADD COLUMN first_login_at TIMESTAMP,
ADD COLUMN buddy_id UUID REFERENCES stock_team_members(id);
```

---

## Tailwind Styling Guide

### Colors (From `community.config.ts`)
- **Primary Accent:** `#f5a623` (gold) → use `bg-[#f5a623]`, `text-[#f5a623]`, `border-[#f5a623]/30`
- **Background:** `#0a1628` (navy) → use `bg-[#0a1628]`
- **Surface:** `#0d1b2a` → use `bg-[#0d1b2a]`
- **Surface Light:** `#1a2a3a` → use `bg-[#1a2a3a]`

### Component Classes

**Card Container:**
```tailwind
bg-[#0d1b2a] border border-white/[0.08] rounded-xl p-5
```

**Button - Primary (CTA):**
```tailwind
bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold 
rounded-lg px-4 py-2.5 text-sm transition-colors
```

**Button - Secondary (Join/Leave):**
```tailwind
bg-white/[0.08] hover:bg-white/[0.12] text-gray-300 
border border-white/[0.16] rounded-lg px-3 py-2 text-sm
```

**Badge - Coordinator (Gold Pill):**
```tailwind
bg-[#f5a623] text-black text-xs font-medium rounded-full 
px-2.5 py-1
```

**Badge - Convener (Text Only):**
```tailwind
text-[#f5a623] italic text-xs font-normal
```

**Tag - Circle (Multi-tag):**
```tailwind
bg-white/[0.04] border border-[#f5a623]/50 rounded-full 
px-2.5 py-1 text-xs text-[#f5a623]
```

**Timer / Countdown:**
```tailwind
text-[#f5a623] font-mono text-sm
```

**Alert Banner (Silent Star):**
```tailwind
bg-red-500/10 border border-red-500/30 rounded-lg p-4 
text-red-300 text-sm
```

---

## Mobile-First Responsive Strategy

**Breakpoints:**
- `sm`: 640px — 2-col grid for circles
- `md`: 768px — tablets, 3-col grid
- `lg`: 1024px — desktop, 4-col or list

**Mobile Patterns:**
- Full-width cards on phone, 2 cols on tablet
- Tap circle → overlay modal (not navigation) on mobile
- Swipe to see member list expansion on CircleCard
- Sticky header with coordinator countdown countdown visible on scroll
- Bottom sheet for "My First Week" card options

---

## Accessibility Notes

### Keyboard Navigation
- All buttons: `Tab` to focus, `Space` / `Enter` to activate
- Circle list: arrow keys to move between cards (when focused)
- Coordinator countdown: announced with `aria-live="polite"` for screen readers
- Proposal countdown timer: update ARIA every minute (polite region)

### ARIA Labels
```html
<!-- CircleCard -->
<div aria-label="Music circle: 7 members, coordinator rotation ends in 6 weeks">

<!-- ProposalCard -->
<div role="article" aria-label="Proposal: Increase set times. 34 hours for silent consent.">

<!-- CoordinatorBadge -->
<span aria-label="Current coordinator, rotation ends June 15">coordinator</span>

<!-- CountdownTimer -->
<span aria-live="polite" aria-label="6 weeks, 3 days remaining">6w 3d</span>
```

### Color Contrast
- Text on gold: use `text-black` (not dark gray on gold)
- Text on navy: use `text-gray-300` or `text-white` (min 4.5:1)
- Respect leaderboard rank numbers: bold weight to distinguish

### Semantic HTML
- Use `<article>` for each ProposalCard
- Use `<aside>` for SilentStarBanner
- Use `<nav>` for circle filter controls
- Use `<button>` for all interactive elements (not `<div role="button">`)

---

## "Don't Do" List (Protecting Flatness)

### ANTI-PATTERNS: Explicitly Forbidden

| Anti-Pattern | Why Bad | What to Do Instead |
|---|---|---|
| **Tenure badges** ("member since week 1") | Creates hierarchy by arrival date | Hide tenure; let people introduce themselves |
| **Respect score as primary sort on team** | Turns contribution tracking into ranking system | Sort by join date; put Respect in separate leaderboard |
| **Visually elevating Zaal's card** | Convener != boss; should look like peer | Small italic "convener" tag, same card styling |
| **Role length countdown** ("coordinator for 8w") | Emphasizes power-holding duration | Show rotation-END date + countdown; rotate out at 8w |
| **Silent star silently** (don't show the bot flag) | Invisible hierarchy recreates | Banner visible to admin + affected person; transparent |
| **First-week card never disappears** | New people feel singled out, insecure | Auto-hide at day 15 |
| **Buddy as authority** | Defeats flat org | Explicit: "buddy is a peer mentor, not manager" in onboarding |
| **Proposal outcome decided by Zaal solo** | Convener role creep | Coordinator represents circle consent; Zaal = tiebreaker only |
| **Respect payout instantly** ("You earned $X") | Money = authority | Surplus payout only; note: "if sponsors exceed budget" |
| **Circle membership auto-assigned** | Removes agency | User picks 1-3 circles; no forced assignments |

---

## Implementation Checklist

### Phase 1: Data & Backend (Week 1-2)
- [ ] Create Supabase tables (circles, circle_members, coordinators, proposals, respect_events)
- [ ] Add columns to stock_team_members (circles[], is_convener, first_login_at, buddy_id)
- [ ] Write API routes (all 9 routes listed above)
- [ ] Add RLS policies (no circle member can join/leave another user)
- [ ] Write first-week card logic (check first_login_at < 14 days)
- [ ] Write silent-star detection query (Q/A ratio last 7 days)

### Phase 2: UI Components (Week 2-3)
- [ ] CircleCard component
- [ ] ProposalCard component
- [ ] FirstWeekCard component
- [ ] SilentStarBanner component
- [ ] CoordinatorBadge component
- [ ] ConvenerTag component
- [ ] RespectLeaderboard component
- [ ] RespectFeed component

### Phase 3: Pages (Week 3-4)
- [ ] Enhance `/stock/team` (add circles column, badges, first-week card, silent-star banner)
- [ ] Build `/stock/circles` (circle discovery page)
- [ ] Build `/stock/proposals` (consent proposals list + filters)
- [ ] Build `/stock/respect` (leaderboard + feed)
- [ ] Build `/stock/respect/[slug]` (individual member history)

### Phase 4: Polish & Testing (Week 4-5)
- [ ] Mobile responsive testing (all 4 pages)
- [ ] Accessibility audit (keyboard nav, ARIA, contrast)
- [ ] Zaal review + feedback loop
- [ ] Bug fixes + performance optimization
- [ ] Deploy to staging for team feedback

---

## Risk Assessment & Questions for Zaal

### Risk 1: Coordinator Rotation Timing
**Issue:** If a coordinator leaves before 8w, how do we handle early rotation?
**Current Design:** Assumes clean 8w cycles. Needs fallback policy.
**Zaal Input:** What's the protocol if coordinator steps down early?

### Risk 2: Silent Star False Positives
**Issue:** Zaal might answer more Qs early on (onboarding). Flag might trigger incorrectly.
**Current Design:** 40% threshold + last 7 days. Arbitrary.
**Zaal Input:** What ratio feels like a real "silent star" vs. normal leadership?

### Risk 3: Respect Payouts from "Surplus"
**Issue:** What if sponsors don't exceed budget? Respect becomes "no payout." Demotivating?
**Current Design:** Soulbound token only, payout contingent on surplus.
**Zaal Input:** Should we have a minimum payout pool? Or pure surplus-dependent?

### Risk 4: Proposal Consent Threshold
**Issue:** If 4/7 members are silent, is that "consensus"? Needs explicit rule.
**Current Design:** Spec says "48h silent window = yes," but no objection threshold.
**Zaal Input:** How many objections = veto? Any objection? Majority of objectors?

### Risk 5: Buddy System at Scale
**Issue:** What if a buddy goes inactive? New person lost.
**Current Design:** Bot checks in weeks 1, 2, 4, 8. But what if buddy doesn't respond?
**Zaal Input:** Fallback escalation if buddy unresponsive?

---

## Summary

**Total Pages:** 4 (1 existing + 3 new)
**Total Components:** 8 (6 new + 2 modified)
**Total API Routes:** 9
**New Supabase Tables:** 5
**Design Philosophy:** Flatness-first. All visual affordances explicitly prevent hierarchy by role, tenure, or Respect score. Coordinator badge rotates out. Zaal is convener (small label), not elevated.

**Next Step:** Zaal review + feedback. Once approved, proceed to code phase.

---

**Document Status:** Design Phase Complete
**Author:** Claude Code
**Date:** 2026-04-24
**Version:** 1.0
