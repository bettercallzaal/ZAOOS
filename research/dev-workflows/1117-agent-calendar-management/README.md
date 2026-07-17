---
title: "Agent-Managed Calendar Systems: 2026 Architecture for ZOE"
tier: DEEP
type: research
owner: "@zaal"
status: draft
date_started: 2026-07-17
---

# Doc 1117 - AI Agent Calendar Management: 2026 Deep Research

## Executive Summary

Zaal's frustration: his assistant (ZOE) cannot actually manage his calendar (Google Calendar + Calendly + Cal.com). This doc surveys how people are solving calendar management with AI agents in 2026 and recommends a phased architecture for ZOE.

**Recommendation: Cal.com is the most agent-manageable platform** because it offers:
- Full API + MCP server (34 tools, no gatekeeping)
- Self-hostable (open-source)
- Direct availability/booking control without platform limitations
- Real-time agent writes back to integrated Google Calendar/Outlook

**ZAO Path: Start with Cal.com MCP → wire into ZOE → defend Zaal's focus time (Tue nights, Sat mornings, 4-7pm builds).**

---

## The Problem

Today, ZOE (grammY Telegram bot, MCP-connected) can:
- Remind Zaal of calendar events
- Answer "what's on my calendar?"
- Send calendar snapshots to Telegram

ZOE cannot:
- Create events (Zaal asks ZOE to "book my 3-hour build session 4-7pm Thursday", it stays a Telegram note)
- Move/reschedule existing events when conflicts arise
- Enforce "no meetings Tue 8pm-midnight" or "Sat 5am-noon" (focus time)
- Coordinate with Calendly bookers ("I have those slots open but I'm in a meeting, suggest next week instead")
- Create Calendly event types or adjust availability rules

**Why this matters:** Zaal's schedule is the bottleneck for decisions, partnerships, and focus. A real agent-managed calendar is the difference between "reactive calendar firefighting" and "proactive calendar as productivity OS."

---

## 2026 Calendar Agent Ecosystem

### Platform Capability Matrix

| Capability | Google Calendar | Calendly | Cal.com | Reclaim AI |
|---|---|---|---|---|
| **Create events via agent** | Yes (MCP 8 tools) | Yes (Scheduling API) | Yes (API 34 tools) | Yes (MCP 40 tools) |
| **Read free/busy** | Yes (MCP suggest_time) | Yes (event_type_available_times) | Yes (get_availability) | Yes (MCP read) |
| **Reschedule/move events** | Yes (update_event) | Partial (reschedule links) | Yes (reschedule_booking) | Yes (MCP write) |
| **Manage availability schedules** | No API for this | Limited (event type only) | Yes (full schedule API) | Yes (focus time blocks) |
| **Set focus time / block calendar** | No (agent cannot) | No (agent cannot) | Yes (availability API) | Yes (core feature via MCP) |
| **Delete/cancel events** | Yes (delete_event) | Yes (invitee can cancel) | Yes (cancel_booking) | Yes (MCP write) |
| **MCP server available** | Yes (official Google) | Yes (official Calendly) | Yes (official Cal.com) | Yes (official Reclaim) |
| **Self-hostable** | No | No | Yes (open-source, AGPLv3) | No |
| **Integrated to other calendars** | N/A (is the calendar) | Yes (syncs Google/Outlook) | Yes (reads Google/Outlook, writes back) | Yes (reads all, writes to Google/Outlook) |
| **Per-user cost** | Free (Google account) | $12/mo (Standard) | Free self-hosted, $15/mo cloud | $8/mo (Reclaim) |
| **Best for agent control** | Read-heavy; limited write scope | Booking-only (no focus time) | Full control (availability, bookings, focus) | Focus time + bookings |

---

## Deep Dives: Each Platform

### 1. Google Calendar + MCP

**Official MCP Server:** Managed by Google (remote, no local setup)

**8 Tools:**
1. `create_event` - Add calendar events
2. `delete_event` - Remove events
3. `get_event` - Retrieve event details
4. `list_calendars` - View available calendars
5. `list_events` - Retrieve events by filter
6. `respond_to_event` - Accept/decline invites
7. `suggest_time` - Find available slots
8. `update_event` - Modify existing events

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `https://www.googleapis.com/auth/calendar.events.freebusy`
- `https://www.googleapis.com/auth/calendar.events.readonly`

**Agent Capabilities:**
- Read calendar data and free/busy
- Create/update/delete events
- Suggest meeting times based on availability
- Accept calendar invites

**Limitations:**
- Cannot create or manage custom availability schedules (e.g., "always block 4-7pm for builds")
- Cannot move events en masse (focus time protection requires per-event logic)
- Cannot manage Calendly or Cal.com through Google Calendar; must go through those platforms' APIs

**Best Use Case:** Core read + basic write for ZOE. Use with Calendly/Cal.com for booking-layer control.

---

### 2. Calendly API + Scheduling API

**MCP Server:** Official (Calendly MCP server available 2026)

**Key Agent Operations:**
1. **Event type discovery** - `/event_types` - Map intent to booking type
2. **Availability checking** - `/event_type_available_times` - Up to 31 days ahead
3. **Meeting creation** - `POST /invitees` - Schedule events with attendee details
4. **Rescheduling** - Generate reschedule URLs (partial automation)

**Agent Capabilities:**
- Check what event types are available
- Find available slots for a specific event type
- Create bookings on behalf of users
- Add attendee questions/answers
- Attach custom tracking data (utm_source, utm_campaign)
- SMS reminder setup

**Limitations:**
- **Paid plan required** - Must be on Calendly paid tier to access Scheduling API
- **No availability management** - Cannot change "open slot" hours; only event types and their availability rules
- **Reschedule is manual** - Agent can generate a reschedule link for the invitee; cannot directly move meetings
- **No focus time blocks** - Cannot tell Calendly "I'm unavailable 4-7pm daily"
- **Booking-only** - Designed for inbound bookings, not for managing the calendar owner's own events

**Best Use Case:** Inbound customer/partner booking coordination. Not suitable for Zaal's internal calendar management.

---

### 3. Cal.com API v2 + MCP Server (RECOMMENDED FOR ZAO)

**MCP Server:** Official, cloud-hosted at `mcp.cal.com/mcp` or local via API key

**34 Tools Across 7 Categories:**

**User & Profile:**
- Retrieve/update authenticated user profile

**Event Types:**
- Create, read, update, delete event types
- Manage custom questions and routing

**Bookings (Core):**
- List bookings with filters
- Create new bookings
- Reschedule existing bookings
- Cancel appointments
- Confirm pending bookings
- Mark attendees absent/present
- Manage attendee lists

**Schedules (Key for Focus Time):**
- Create, read, update, delete schedules
- Set availability windows per schedule
- Define default schedule

**Availability & Time:**
- `get_availability` - Check available time slots
- Query busy times from integrated calendars

**Conferencing:**
- List compatible conferencing apps (Zoom, Teams, Google Meet)

**Organization:**
- Manage team memberships
- Calculate booking slots per routing form
- Retrieve organization routing forms

**Agent Capabilities:**
- Full CRUD on bookings (create, reschedule, cancel)
- Full schedule management (set availability windows, change when open/closed)
- Real-time availability queries
- Write changes back to Google Calendar / Outlook (integrated)
- Support instant bookings for urgent requests
- Multi-user/team coordination

**Authentication:**
- API Key (Settings → Developer → API Keys)
- OAuth 2.1 for cloud MCP server (no local setup)

**Limitations:**
- Cal.com cloud pricing: $15/user/month (if using managed SaaS)
- Self-hosted is free (open-source, AGPLv3) but requires infra

**Best Use Case:** **ZAO's primary calendar management platform.** Full control over Zaal's availability, bookings, and focus time. Can defend "no meetings 4-7pm" automatically.

**Cal.com Architecture for ZAO:**
```
Zaal's Calendar Ecosystem:
  Google Calendar (source of truth for his personal events)
    ↓ (Cal.com reads free/busy)
  Cal.com (scheduling layer + availability management + agent writes)
    ↓ (Cal.com writes confirmed bookings + rescheduled meetings back)
  Google Calendar (updated with agent actions)

Alongside:
  Calendly (for public event-type booking if he keeps it for partners)
    ↓ (Cal.com can manage availability rules, not directly integrate)
  
Agent Flow (ZOE):
  Zaal via Telegram: "@zoe_bot set my Tue 8pm-midnight as focus time"
  ↓
  ZOE calls Cal.com MCP: `update_schedule` (set availability window)
  ↓
  Cal.com marks those slots as unavailable
  ↓
  Any future bookings (Calendly, Cal.com, email) route around that time
  ↓
  Confirmation back to Zaal via Telegram
```

---

### 4. Reclaim AI + Claude MCP

**MCP Server:** Official, added via `claude mcp add -t http https://mcp.reclaim.ai`

**40 Tools:**
- Tasks management
- Habit blocking (personal focus time)
- Calendar event CRUD
- Focus time protection
- Analytics/insights

**Agent Capabilities:**
- Protect focus time (core differentiator)
- Block calendar for habits and deep work
- Negotiate meeting times automatically
- Read & write to Google Calendar and Outlook

**Limitations:**
- Not designed for booking coordination (like Calendly/Cal.com)
- Focus on personal productivity, not team/partner scheduling
- No self-hosting (SaaS only)

**Best Use Case:** **Complementary to Cal.com.** Reclaim handles Zaal's personal focus time + habit protection; Cal.com handles partner bookings and public availability. Together they create a complete system.

**Cost:** $8/user/month

---

## MCP Servers Available (2026 Ecosystem)

| Platform | MCP Server | Setup | Tools | Transport |
|---|---|---|---|---|
| Google Calendar | Official (Google Workspace) | Cloud-hosted (managed) | 8 | Remote HTTP |
| Calendly | Official | Cloud-hosted | N/A (Scheduling API) | Remote HTTP |
| Cal.com | Official | Cloud-hosted OR local | 34 | HTTP + stdio |
| Reclaim AI | Official | HTTP add (claude mcp add) | 40 | HTTP |
| Reclaim AI | Community (unofficial) | Local setup | 40 | stdio |
| Google Calendar | Community (nspady/google-calendar-mcp) | Local setup | 13 | stdio |

**Recommended for ZAO:** Google Calendar (official) + Cal.com (official) + optionally Reclaim AI (for focus time).

---

## Security & Permissions Considerations

### Scope Minimization
- Google Calendar MCP: Defaults to read-only (list, suggest) with write requiring explicit approval per action
- Cal.com MCP: Requires API key; Zaal controls which scopes are granted
- Reclaim AI MCP: Per-tool approval (Claude defaults to "needs approval" for calendar writes)

### Best Practice
- Zaal approves ZOE's first 3-5 booking operations to establish trust
- After that, ZOE can auto-manage recurring tasks (e.g., defending 4-7pm daily)
- High-stakes writes (cancel a meeting) still require approval

### Data Flow
Cal.com as the middle layer means:
- Zaal's Google Calendar data is never directly exposed to ZOE (Cal.com reads it, ZOE only sees Cal.com's availability API)
- ZOE writes to Cal.com → Cal.com syncs to Google Calendar
- No credential leakage (Cal.com holds the Google OAuth token, ZOE only has Cal.com API key)

---

## ZAO Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal:** ZOE can read calendar and suggest booking times

**Steps:**
1. Generate Cal.com API key (Zaal in Settings → Developer → API Keys)
2. Wire Cal.com MCP into ZOE (add to bot's mcp.json config)
3. Test: `/zoe read my calendar for next week`
4. Test: `/zoe find 1-hour slots on Wed or Thu`

**API Key Management:**
- Zaal generates a Cal.com API key, stores in bot/.env
- Never commit to git (already in .gitignore)

**Example ZOE Prompt Extension:**
```
You have access to Cal.com's scheduling API via MCP.
When Zaal asks about his calendar, availability, or booking suggestions:
- Use cal_com:get_availability to find open slots
- Propose times in Telegram
- Do NOT create/modify events yet (Phase 2)
```

### Phase 2: Basic Writes (Week 2-3)
**Goal:** ZOE can create events, respecting focus time

**Steps:**
1. Add logic to ZOE: when Zaal says "book my 3-hour build session Thu 4-7pm", ZOE creates a Cal.com booking for that time
2. Enforce focus blocks: ZOE refuses to schedule meetings during:
   - Tue 8pm-midnight
   - Sat 5am-noon
   - Daily 4-7pm (his build time)
3. Confirmation: ZOE posts to Telegram "Created: Thu 4-7pm Build Session → Google Calendar synced"

**Data Model (ZOE Memory):**
```json
{
  "zaal_schedule": {
    "focus_blocks": [
      { "day": "Tuesday", "start": "20:00", "end": "23:59", "label": "Focus Time" },
      { "day": "Saturday", "start": "05:00", "end": "12:00", "label": "Morning Walk / Prep" },
      { "daily": "16:00-19:00", "label": "Build Time" }
    ],
    "meeting_available": "Mon, Wed, Thu, Fri; 9am-4pm"
  }
}
```

### Phase 3: Rescheduling & Coordination (Week 4)
**Goal:** ZOE can move meetings to resolve conflicts

**Steps:**
1. When a booking attempt conflicts with focus time:
   - ZOE suggests alternative slots: "I have Wed 2-3pm or Thu 10-11am open"
   - If Zaal approves, ZOE either:
     a. Asks the requestor to pick from the alternatives
     b. (Advanced) Auto-rebooks if requestor agrees via Calendly/Cal.com
2. When Zaal says "move my 2pm meeting Thursday to next Wednesday", ZOE reschedules via `cal_com:reschedule_booking`

**Coordination Flow:**
```
Partner books via Calendly (or Cal.com) → Conflict detected (during 4-7pm)
↓
ZOE checks Zaal's focus blocks
↓
ZOE marks event as "pending confirmation" in Cal.com
↓
ZOE notifies Zaal: "Partner wants 4-5pm Thu (your build time). Suggest Wed 2-3pm or open Thu 7pm?"
↓
Zaal replies via Telegram
↓
ZOE either cancels/reschedules, or pings partner with alternatives
```

### Phase 4: Reclaim AI Integration (Week 5, optional)
**Goal:** Deeper focus time protection + habit syncing

**Steps:**
1. Add Reclaim MCP to ZOE (separate from Cal.com)
2. Zaal's habits (e.g., "2hr deep work every Wed 2-4pm") auto-block in both Cal.com and Reclaim
3. When Reclaim sees a scheduling request during habit time, it notifies ZOE
4. ZOE coordinates: "Reclaim is protecting your Wed focus time; I'm suggesting Thu 10am instead"

**Optional:** Full merge into single workflow if both platforms' data sync cleanly.

---

## Recommended Architecture for ZOE

```
┌─────────────────────────────────────────────────────────────────┐
│ Zaal's Calendar Ecosystem                                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│  Google Calendar     │    │  Calendly            │
│  (master calendar)   │    │  (booking widget)    │
│  (personal events)   │    │  (partners book)     │
└──────┬───────────────┘    └──────┬───────────────┘
       │                           │
       │ (read free/busy)          │ (read availability rules)
       │                           │
       ▼                           ▼
┌────────────────────────────────────────────────┐
│ Cal.com (Scheduling Layer)                    │
│ - Manages Zaal's availability windows         │
│ - Enforces focus time blocks                  │
│ - Coordinates all bookings                    │
│ - MCP API (34 tools)                          │
└────────┬───────────────────────────────────────┘
         │
         │ (write bookings + reschedules)
         │
         ▼
    Google Calendar
    (synced events)

┌────────────────────────────────────────────────┐
│ ZOE (Telegram Bot, grammY)                    │
│ - Connected to Cal.com MCP                    │
│ - Reads Zaal's instructions via Telegram      │
│ - Enforces focus blocks programmatically      │
│ - Notifies Zaal of conflicts & resolutions    │
│ - Manages multi-step rescheduling             │
└────────────────────────────────────────────────┘
```

**Data Flow Example: "Book my meeting with Iman on Wed"**

1. Zaal: `/zoe book a 1-hour call with Iman on Wednesday`
2. ZOE queries Cal.com: `get_availability(start_date="Wed", duration=1h)`
3. Cal.com returns: "Wed 9am-12pm, 1-4pm available" (respecting focus blocks)
4. ZOE replies: "Wed 10-11am or 2-3pm. Which works for Iman?"
5. Zaal: "1-hour call with Iman Wed 2-3pm, Zoom meeting"
6. ZOE calls Cal.com: `create_booking(event_type_id=..., start_time="2pm Wed", attendee="iman@...")`
7. Cal.com creates booking → triggers Google Calendar sync
8. Google Calendar updated
9. ZOE confirms in Telegram: "Set: Wed 2-3pm with Iman (Zoom link sent to iman@...)"

---

## Next Actions (For Zaal & Team)

| Action | Owner | Timeline | Details |
|---|---|---|---|
| **Generate Cal.com API key** | @Zaal | This week | Settings → Developer → API Keys. Store in `bot/.env` as `CALCOM_API_KEY`. Never commit. |
| **Decide: Cal.com self-hosted or SaaS?** | @Zaal | This week | SaaS ($15/mo) = faster setup. Self-hosted (AGPLv3) = full control. Recommend SaaS for Phase 1. |
| **Plan ZOE's focus blocks** | @Zaal | This week | Formalize: Tue 8pm-midnight, Sat 5am-noon, daily 4-7pm. Add to `bot/zoe/human.md` memory. |
| **Wire Cal.com MCP to ZOE** | @claude_code | Week 2 | Add `cal.com` to `bot/src/zoe/mcp.json`. Install cal.com npm package if needed. |
| **Build Phase 1 skill** | @claude_code | Week 2 | `/zoe calendar` command: read events, suggest times. No writes yet. Test locally. |
| **Build Phase 2 skill** | @claude_code | Week 3 | `/zoe book <event> <time>` with focus-block enforcement. Approval gate for first 5 operations. |
| **Integrate Reclaim AI (optional)** | @claude_code | Week 5 | Only if focus time automation is critical. Start with Cal.com; add Reclaim later if needed. |
| **Test live on VPS** | @claude_code | Week 4 | Deploy ZOE update to @zaoclaw_bot. Have Zaal book 5 meetings via Telegram. Verify Google Calendar syncs. |
| **Measure friction** | @Zaal | Week 4+ | Post-test: How much time did it save? Did it catch conflicts? Did focus time get protected? Adjust. |

---

## Sources & References

**Google Calendar MCP:**
- [Configure the Calendar MCP server | Google for Developers](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server)
- [Google Calendar MCP Server — AI Scheduling | MintMCP](https://www.mintmcp.com/google-calendar)

**Calendly API & Agents:**
- [How to display the scheduling page for users of your app | Calendly Developer](https://developer.calendly.com/schedule-events-with-ai-agents)
- [Scheduling API now available | Calendly Community](https://community.calendly.com/api-webhook-help-61/scheduling-api-now-available-4825)

**Cal.com API & MCP:**
- [Cal.com Agents - Scheduling AI for Every Platform](https://cal.com/agents)
- [Cal.com Docs: Agents](https://cal.com/docs/agents)
- [Connect Cal.com to Claude with MCP | Setup Guide](https://cal.com/blog/how-to-connect-calcom-to-claude-using-mcp)
- [Cal.com MCP Server Documentation](https://cal.com/docs/mcp-server)
- [Cal.com vs. Calendly | The Ultimate Comparison Guide 2026](https://cal.com/blog/cal-com-vs-calendly-the-ultimate-guide)

**Reclaim AI & Claude:**
- [Manage Your Calendar from Claude via MCP | Reclaim.ai](https://reclaim.ai/integrations/claude)
- [Reclaim 2.0 + Claude integration | Reclaim.ai Help Center](https://help.reclaim.ai/en/articles/15265289-reclaim-2-0-claude-integration)

**AI Scheduling Landscape 2026:**
- [Motion vs Reclaim AI vs Clockwise – A Complete Guide for Marketing Leaders in 2026](https://genesysgrowth.com/blog/motion-vs-reclaim-ai-vs-clockwise)
- [AI Agent for Scheduling: 2026 Buyer Guide](https://perplexityaimagazine.com/ai-tools/ai-agent-for-scheduling-2026-buyer-guide/)
- [Calendar & Meetings MCP Servers: Real-Time Scheduling Actions for AI Agents](https://unified.to/blog/calendar_and_meetings_mcp_servers_real_time_scheduling_actions_for_ai_agents)

**Integration & Best Practices:**
- [Google Calendar MCP vs API for AI Agents: How to Choose](https://www.scalekit.com/blog/google-calendar-mcp-vs-api)
- [Best Calendar and Scheduling API for Developers: 2026 Comparison — Vennio](https://vennio.app/blog/best-scheduling-api-for-developers-2026)

---

## Appendix: Quick Command Reference

**For Zaal (via Telegram to ZOE, once Phase 2+ deployed):**
- `/zoe what's on my calendar Wed?` → Lists events
- `/zoe find 1hr slots next week` → Shows available times
- `/zoe book call with Iman Thu 2-3pm` → Creates booking
- `/zoe set my focus blocks: Tue 8pm-midnight, Sat 5am-noon, daily 4-7pm` → Stores in memory
- `/zoe move my 2pm meeting to Thu 10am` → Reschedules

**For Developers (MCP setup):**
```bash
# Cal.com MCP (Claude Code)
claude mcp add -t http https://mcp.cal.com/mcp

# Reclaim AI MCP (optional)
claude mcp add -t http https://mcp.reclaim.ai

# Google Calendar MCP (already available via Google Workspace)
```

**API Key Setup:**
```bash
# Store in bot/.env (never commit)
CALCOM_API_KEY=<generated from Cal.com Settings>
GOOGLE_CALENDAR_API_KEY=<if self-managed>
RECLAIM_API_KEY=<generated from Reclaim settings>
```

---

## Conclusion

**Cal.com is the best agent-manageable platform for ZAO** because:
1. **Full API control** (34 tools) vs. Calendly's booking-only scope
2. **Availability management** (can enforce focus blocks) vs. Google Calendar's lack of schedule API
3. **Self-hostable** (open-source, AGPLv3) for long-term control
4. **Official MCP server** with no external dependencies
5. **Seamless Google Calendar sync** (reads + writes back)

**ZOE's calendar management can ship in 5 weeks** (Phase 1-3) with:
- Week 1: Read-only (suggest times)
- Week 2-3: Basic writes (create events respecting focus blocks)
- Week 4: Full rescheduling + conflict resolution
- Week 5+: Optional Reclaim AI integration for advanced focus protection

**First concrete step:** Zaal generates a Cal.com API key this week. That's the accelerant.

