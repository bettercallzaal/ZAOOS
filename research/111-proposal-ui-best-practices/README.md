# 111 — Proposal UI Best Practices for ZAO OS

> **Status:** Research complete
> **Date:** March 22, 2026
> **Goal:** Redesign the proposals tab in ZAO OS to follow DAO governance UI best practices from Snapshot, Tally, Nouns Agora, and Commonwealth

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Current state** | ProposalsTab.tsx is a flat list with no voting buttons, no comments, no filters, no publish text field, no category badges — needs major upgrade |
| **Card design** | Expandable proposal cards — collapsed shows title/author/status/vote bar, expanded shows full description, voting buttons, comments, publish preview |
| **Voting UI** | Inline For/Against/Abstain buttons with Respect weight shown, vote confirmation, animated vote bar |
| **Category filter** | Pill row at top — All, Governance, Music, WaveWarZ, Social, etc. |
| **Status filter** | Pill row — All, Open, Published, Closed |
| **Publish text** | Show in create form AND in expanded card view — "If approved, this will be posted to /wavewarz (or @thezao)" |
| **Mobile-first** | 44px touch targets, thumb-zone voting buttons, swipe-to-vote (stretch goal) |
| **Comments** | Already built (`ProposalComments.tsx`) but not wired into ProposalsTab — wire it in |
| **Generate Post** | "Generate WaveWarZ Post" button visible at top of proposals list |

---

## Part 1: Current State Problems

`src/app/(auth)/fractals/ProposalsTab.tsx` (226 lines) has these issues:

1. **No voting buttons** — users can see vote tallies but can't actually vote from this tab
2. **No publish text field** in create form — WaveWarZ/social proposals can't set what gets published
3. **No category filtering** — all proposals shown in one flat list
4. **No status filtering** — can't filter open vs closed vs published
5. **No comments** — `ProposalComments` component exists but isn't imported
6. **No expand/collapse** — can't read full proposal description without clicking
7. **No category badges** — category shows as plain text `/governance` instead of colored badge
8. **No "Generate WaveWarZ Post" button** — the component exists but isn't in ProposalsTab
9. **Minimal vote bar** — just a green bar, no labels for threshold, no "X of 1000R needed"
10. **No author avatar** — author shown as text only, no pfp

---

## Part 2: What Top Platforms Do

### Snapshot (snapshot.box)
- **Card layout:** Each proposal is a card with title, author avatar, status badge (Active/Closed/Pending), vote count, time remaining
- **Status badges:** Colored pills — green (Active), gray (Closed), yellow (Pending)
- **Vote bar:** Shows For/Against/Abstain as a segmented bar with percentages
- **Filters:** Space filter, status filter (All/Active/Pending/Closed), search
- **Mobile:** Full-width cards, large touch targets for voting
- **Key pattern:** "Single-question voting" — each proposal asks one clear question

### Tally (tally.xyz)
- **Card layout:** Title, proposer avatar + name, status badge, vote breakdown
- **Status flow:** Pending -> Active -> Succeeded/Defeated -> Queued -> Executed
- **Vote bar:** Green/red/gray segmented bar with exact numbers
- **Delegation:** Prominent delegate voting power display
- **Key pattern:** "Threshold indicator" — shows how close to quorum/passing

### Nouns (nouns.wtf/vote via Agora)
- **Card layout:** Proposal number, title, status, vote count
- **Status badges:** For (green), Against (red), Abstain (gray) with large numbers
- **Expand:** Click card to see full proposal body + vote history
- **Key pattern:** "Proposal ID numbering" — each proposal gets a sequential number

### Commonwealth (commonwealth.im)
- **Card layout:** Title, author, body preview (2 lines), reaction counts, comment count
- **Threaded comments** below each proposal
- **Key pattern:** "Discussion-first" — proposals start as discussions before formal vote

---

## Part 3: Recommended ZAO OS Proposal Card Design

### Collapsed Card (default in list)

```
┌─────────────────────────────────────────────┐
│  [Avatar] Author Name          [WaveWarZ] ● │ <- category badge + status dot
│                                              │
│  Proposal Title Here                         │
│  First line of description preview...        │
│                                              │
│  ████████████░░░░░░░░  650 / 1000 R          │ <- vote bar with threshold
│  3 for · 1 against · 0 abstain · 2 comments  │
│                                              │
│  [For ✓] [Against ✗] [Abstain ○]            │ <- vote buttons (if open)
└─────────────────────────────────────────────┘
```

### Expanded Card (on tap)

```
┌─────────────────────────────────────────────┐
│  [Avatar] Author Name          [WaveWarZ] ● │
│  Proposal Title Here                         │
│                                              │
│  Full description text shown here with       │
│  all the details the proposer wrote...       │
│                                              │
│  ┌─ PUBLISH PREVIEW ─────────────────────┐  │
│  │ If approved, this will post to         │  │
│  │ /wavewarz Farcaster channel:           │  │
│  │                                        │  │
│  │ "43 Artists on WaveWarZ -- hip-hop,    │  │
│  │ R&B, and more..."                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ████████████░░░░░░░░  650 / 1000 R          │
│                                              │
│  [For ✓] [Against ✗] [Abstain ○]            │
│                                              │
│  ── Comments (2) ──────────────────────────  │
│  @zaal: This is a great idea                 │
│  @stilo: Agreed, let's do it                 │
│  [Add comment...]                            │
└─────────────────────────────────────────────┘
```

---

## Part 4: Category + Status Filtering

### Filter Bar (above proposal list)

```
[All] [Open ●] [Published] [Closed]    <- status pills
[All] [Governance] [Music] [WaveWarZ] [Social] [Funding] [Technical]  <- category pills
```

Two rows of pill filters. Active pill gets gold highlight. Counts shown as dots or badges.

### Category Colors (already defined in code)

| Category | Color |
|----------|-------|
| governance | gold |
| music | blue |
| wavewarz | emerald |
| social | pink |
| funding | green |
| community | purple |
| technical | blue |
| general | gray |

---

## Part 5: Voting Interface

### Vote Buttons

Three buttons in a row, each with icon + label:
- **For** — green, checkmark icon
- **Against** — red, X icon
- **Abstain** — gray, circle icon

On tap: show confirmation with "You're voting FOR with X Respect weight. Confirm?"

After voting: button state changes to "Voted For" (disabled, green highlight), other buttons dim.

### Vote Bar with Threshold

```
████████████░░░░░░░░  650 / 1000 Respect
```

- Green fill = For votes weight
- Red fill from right = Against votes weight
- Gray = remaining to threshold
- Show "650 / 1000 Respect" text
- When threshold reached, show "Threshold reached — ready to publish"

---

## Part 6: Publish Preview in Create Form

When creating a proposal with WaveWarZ or Social category, show:

```
┌─ WHAT GETS PUBLISHED ────────────────────┐
│                                          │
│ Channel: /wavewarz (or /zao)             │
│ Account: WaveWarZ (or @thezao)           │
│                                          │
│ [textarea for publish text]              │
│                                          │
│ This text will auto-publish when the     │
│ proposal reaches 1000 Respect in votes.  │
└──────────────────────────────────────────┘
```

For non-publishing categories, this section is hidden.

---

## Part 7: Implementation Plan

### Priority 1: Fix Critical Gaps (2-3 hours)
1. Add publish text field to ProposalsTab create form
2. Add voting buttons (For/Against/Abstain) to each proposal card
3. Add category badge to proposal cards (colored pill)
4. Wire in ProposalComments to expanded card view
5. Add GeneratePostButton to ProposalsTab

### Priority 2: Filter + Sort (1-2 hours)
1. Category filter pill row
2. Status filter pill row
3. Sort by: newest, most votes, closest to threshold

### Priority 3: Card Redesign (2-3 hours)
1. Expand/collapse cards on tap
2. Author avatar in card header
3. Vote bar with threshold indicator ("650 / 1000 R")
4. Description preview (2 lines collapsed, full expanded)
5. Comment count + inline comments on expand

### Priority 4: Polish (1-2 hours)
1. Vote confirmation modal
2. "Voted" state on buttons after voting
3. Publish preview in expanded view
4. Mobile touch target optimization (44px min)
5. Animate vote bar changes

---

## Part 8: Files to Change

| File | Change |
|------|--------|
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Major rewrite — add voting, filtering, publish text, comments, card redesign |
| `src/components/governance/ProposalComments.tsx` | Already exists — wire into ProposalsTab |
| `src/components/wavewarz/GeneratePostButton.tsx` | Already exists — import into ProposalsTab |
| `src/app/api/proposals/vote/route.ts` | Already exists — ProposalsTab needs to call it |
| `src/app/api/proposals/comment/route.ts` | Already exists — ProposalsTab needs to call it |

**Key insight:** Most of the backend is already built. The voting API, comments API, and publish threshold logic all exist. The ProposalsTab just doesn't use them.

---

## Sources

- [Snapshot Docs](https://docs.snapshot.box/) — Vue 3 governance UI, status badges, vote bars
- [Tally](https://www.tally.xyz/) — Proposal cards with threshold indicators, delegate voting
- [Nouns DAO Vote](https://nouns.wtf/vote) — Proposal numbering, expand/collapse, Agora governance
- [Agora Source](https://github.com/voteagora/agora) — Open source DAO governance platform
- [DAO Governance Voting Tools Guide](https://blog.sablier.com/dao-governance-voting-tools-the-ultimate-guide-2024/) — Comprehensive comparison
- [Badge UI Patterns](https://mobbin.com/glossary/badge) — Status badge design best practices
- [UI Patterns — Status](https://ui-patterns.com/patterns/Status) — Status indicator patterns
- ZAO OS Codebase: `src/app/(auth)/fractals/ProposalsTab.tsx`, `src/components/governance/ProposalComments.tsx`, `src/app/api/proposals/vote/route.ts`
