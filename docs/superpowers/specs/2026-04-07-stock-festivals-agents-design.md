# STOCK + FESTIVALS Agents - Design Spec

> Date: 2026-04-07
> Status: Approved
> Branch: ws/stock-0407-1445

## Summary

Two new agents in the ZOE squad on the VPS (OpenClaw):

- **STOCK** `🎪` - ZAOstock 2026 coordinator (Oct 3, Ellsworth ME)
- **FESTIVALS** `🎶` - All ZAO events manager (virtual, satellite, new proposals)

Both are full agents dispatched through ZOE, visible in the dashboard, accessible to Zaal + core team.

## Agent Definitions

### STOCK

| Field | Value |
|-------|-------|
| ID | `stock` |
| Name | STOCK |
| Emoji | `🎪` |
| Color | `#E11D48` (rose) |
| Role | Event Coordinator |
| Reports to | ZOE |

**Capabilities (v1):**
1. Answer questions about ZAOstock (venue, budget, team, timeline, weather, vendors)
2. Update planning docs (check off timeline items, change vendor/outreach status)
3. Draft outreach (sponsor pitches, press pitches, artist invites, vendor inquiries)
4. Track budget (log expenses/revenue, calculate remaining, flag overages)
5. Remind/nudge (compare current date vs timeline.md, flag overdue items)
6. Research (vendor info, hotel rates, flights, local business details)

**Knowledge base:** Everything in `ZAO-STOCK/` - budget, timeline, vendors, outreach, venue details, team profiles, research docs 213/224/229-232, the zao-stock skill file.

**Voice:** Organized, action-oriented, deadline-aware. Thinks in checklists and next steps.

### FESTIVALS

| Field | Value |
|-------|-------|
| ID | `festivals` |
| Name | FESTIVALS |
| Emoji | `🎶` |
| Color | `#7C3AED` (violet) |
| Role | Events Manager |
| Reports to | ZOE |

**Capabilities (v1):**
1. Answer questions about any ZAO event (past, upcoming, proposed)
2. Manage event calendar (track dates, avoid conflicts, coordinate across events)
3. Support new events (walk community members through planning step by step)
4. Draft promotional content (social posts, Farcaster casts, event announcements)
5. Vendor/venue research for any city
6. Artist/performer coordination (availability, travel, logistics)
7. Sponsor relationship tracking across events
8. Post-event recaps and debriefs

**Knowledge base:** Past events (PALOOZA, ZAO-CHELLA), virtual series (WaveWarZ, COC Concertz), satellite events (ZAO-Ville DMV), event planning templates.

**Voice:** Energetic, community-facing, supportive. Helps anyone throw an event regardless of experience.

**Future vision (not v1):**
- Multilingual support (Spanish, Portuguese, French)
- Timezone-aware scheduling for global members
- Accessibility checklists for IRL events
- Budget scaling templates ($0 virtual to $5K+ festival)
- Credit/recognition tracking for organizers
- Mentorship pairing (experienced organizers help first-timers)
- Open format support (not just music - art, workshops, hackathons, meetups, cyphers)

## File Structure on VPS

```
/home/node/openclaw-workspace/
├── stock/
│   ├── SOUL.md
│   ├── AGENTS.md           # Shared behavioral contract (same as other agents)
│   ├── planning/
│   │   ├── timeline.md     # Copied from ZAO-STOCK/planning/
│   │   ├── budget.md
│   │   ├── vendors.md
│   │   ├── outreach.md
│   │   └── venue-details.md
│   ├── results/
│   ├── tasks/
│   └── drafts/
├── festivals/
│   ├── SOUL.md
│   ├── AGENTS.md
│   ├── events/
│   │   ├── zao-ville/      # DCoop's DMV satellite
│   │   ├── wavewarz/       # Virtual series
│   │   └── templates/      # Scaffold for new events
│   ├── results/
│   ├── tasks/
│   └── drafts/
```

## Dashboard Integration

Add both agents to `/tmp/zoe-dashboard/src/lib/config.ts` AGENTS array:

```typescript
{ id: 'stock', name: 'STOCK', emoji: '🎪', color: '#E11D48', role: 'ZAOstock' },
{ id: 'festivals', name: 'FESTIVALS', emoji: '🎶', color: '#7C3AED', role: 'Events' },
```

Also add to the server's `VALID_AGENTS` whitelist:

```javascript
const VALID_AGENTS = new Set([
  'main', 'zoey', 'builder', 'scout', 'wallet',
  'fishbowlz', 'caster', 'rolo', 'stock', 'festivals'
]);
```

## Implementation Steps

1. Write SOUL.md for STOCK (bake in full knowledge base from zao-stock skill + planning docs)
2. Write SOUL.md for FESTIVALS (event ops identity + past event knowledge + new event support)
3. Create directories on VPS with standard agent files
4. Copy planning docs from ZAO-STOCK/ to stock/planning/ on VPS
5. Create festivals/events/ scaffolding (zao-ville, wavewarz, templates)
6. Add both agents to dashboard config + rebuild + deploy
7. Add both to server VALID_AGENTS whitelist + deploy
8. Test: dispatch a task to STOCK via ZOE, verify response in Feed
9. Test: dispatch a task to FESTIVALS via ZOE, verify response in Feed

## Out of Scope (v1)

- Automatic sync between repo ZAO-STOCK/ and VPS stock/planning/
- Public-facing chatbot on zaoos.com/stock
- Multilingual, timezone, accessibility features (noted for future)
- Budget scaling templates
- Organizer credit tracking
