---
topic: dev-workflows
type: decision
status: design-complete — awaiting CALCOM_API_KEY from Zaal (step 1)
last-validated: 2026-07-17
related-docs: 154, 815, 944
original-query: "wire Cal.com MCP into ZOE so it can manage Zaal's calendar + protect build time"
tier: STANDARD
---

# 1253 — Cal.com MCP + ZOE: Calendar Wiring Design

**Doc:** 1253
**Type:** DECISION
**Status:** Design complete — live wiring blocked on Zaal generating `CALCOM_API_KEY`
**Written:** 2026-07-17 (coc-loop session 18)

---

## Why This Matters

ZOE routes Telegram DMs, schedules morning briefs, and orchestrates the fleet — but has no calendar context. It cannot tell Zaal "you have a focus block now" or book a slot for someone asking for a meeting. The result: Zaal's build time leaks because he answers scheduling DMs manually during deep-work windows.

Cal.com's official MCP server exposes scheduling as tools Claude (and therefore ZOE) can call server-side. Wiring it in gives ZOE:
1. **Availability lookup**: "Is Zaal free Thursday 4pm?" → live answer from Cal.com
2. **Booking creation**: "Schedule a 30-min call with Tom at noon" → creates booking, sends invite
3. **Focus-block enforcement**: ZOE knows Zaal's next free slot and routes DMs to async if he is in a block

---

## The MCP Config

Add to `~/.claude/settings.json` (Zaal's Mac, where Claude Code runs):

```json
{
  "mcpServers": {
    "calcom": {
      "command": "npx",
      "args": ["-y", "@calcom/mcp", "--apiKey", "${CALCOM_API_KEY}"],
      "env": {
        "CALCOM_API_KEY": "cal_live_xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

The package `@calcom/mcp` (npm) is Cal.com's official MCP server. It exposes these tools:

| Tool | Use |
|------|-----|
| `calcom_getAvailability` | Check free slots for a given date range |
| `calcom_createBooking` | Book a slot (requires attendee email + eventTypeId) |
| `calcom_cancelBooking` | Cancel by booking uid |
| `calcom_rescheduleBooking` | Reschedule by booking uid |
| `calcom_listBookings` | Upcoming bookings in a window |
| `calcom_getEventTypes` | List available meeting types |

---

## CALCOM_API_KEY — how to generate (Zaal-gated, ~2 min)

1. Log in at **app.cal.com** → Settings → API Keys
2. Create key, label it "ZOE/Claude Code", no expiry
3. Add `CALCOM_API_KEY=cal_live_...` to `~/.claude/settings.json` under the calcom MCP env block above
4. Restart Claude Code session

This is the ONLY manual step. Everything below runs automatically after the key is in.

---

## ZOE Integration Design

ZOE (bot in `bot/src/zoe/`) gains calendar awareness through two new helpers:

### Phase 1: Availability relay (read-only, zero risk)

```typescript
// bot/src/zoe/calendar.ts (new)
// Called when ZOE detects a scheduling-intent DM ("can we meet", "are you free")

export async function getNextAvailableSlot(daysAhead = 7): Promise<string> {
  // ZOE calls calcom_getAvailability via MCP, returns human-readable slot
  // Falls back to "DM Zaal directly" if MCP unavailable
}

export async function isInFocusBlock(): Promise<boolean> {
  // Returns true if Zaal has a booking right now (no gap in cal = block)
  // Used by morning brief + DM routing
}
```

**Morning brief integration** (`bot/src/zoe/brief.ts`): append one line — "Focus blocks today: 10am–1pm, 4–6pm (from Cal.com)". Zero new ENV vars needed after the key is wired.

### Phase 2: Booking creation (gated, Telegram tap-to-approve)

When a DM says "can we get 30 min this week":
1. ZOE calls `calcom_getAvailability` → finds 3 open slots
2. ZOE replies with the 3 options as a Telegram inline keyboard
3. Zaal taps one → ZOE calls `calcom_createBooking` with attendee info
4. Booking confirmed, invite sent automatically

Gate: TELEGRAM approval required for every booking creation — ZOE never creates a booking without Zaal tapping Approve. This matches the capped-spend tap-to-approve pattern from doc 1226.

### Phase 3: Focus-block enforcement (informational only)

ZOE flags DMs that arrive during focus blocks with:
> "Zaal is in focus block until 1pm. I'll surface this in the next brief."

No DMs are blocked or dropped — just labeled and queued in the afternoon brief. This protects deep work without hiding messages.

---

## Phased Rollout

| Phase | Scope | Gate | ETA |
|-------|-------|------|-----|
| 0 | CALCOM_API_KEY generated + MCP config added | Zaal generates key | Day 0 |
| 1 | Morning brief includes today's focus blocks (availability read) | No gate — read-only | Day 1 |
| 2 | DM routing labels scheduling-intent messages + shows next slot | No gate — informational | Day 3 |
| 3 | Tap-to-approve booking creation from Telegram inline keyboard | Zaal approves each booking | Day 7 |

---

## Files to Create / Edit (turnkey once key lands)

| File | Change |
|------|--------|
| `~/.claude/settings.json` | Add `calcom` MCP server block (Zaal does this once) |
| `bot/src/zoe/calendar.ts` | New: `getNextAvailableSlot()`, `isInFocusBlock()`, `formatFocusBlocks()` |
| `bot/src/zoe/brief.ts` | Add focus-block line using `formatFocusBlocks()` |
| `bot/src/zoe/tg-interactions.ts` | Route scheduling-intent DMs through `isInFocusBlock()` label |
| `bot/src/zoe/__tests__/calendar.test.ts` | Unit tests: mock MCP client, test each helper |

The `calendar.ts` module should mock `process.env.CALCOM_API_KEY` at test time — no real Cal.com calls in CI.

---

## Why Not Google Calendar MCP?

Cal.com MCP is the right choice here:
- Cal.com is Zaal's booking surface (already linked from bio, ZOE knows the URL)
- Google Cal MCP requires OAuth + token refresh complexity; Cal.com API key = one env var
- Cal.com returns availability in the exact format needed (ISO slots, no parsing)
- Cal.com's booking creation handles invite emails automatically

---

## Next Actions

| Action | Owner | When |
|--------|-------|------|
| Generate `CALCOM_API_KEY` in Cal.com Settings | Zaal | Today (2 min) |
| Add MCP config to `~/.claude/settings.json` | Zaal | Same session |
| Build `bot/src/zoe/calendar.ts` + tests + brief integration | coc-loop | After key lands |
| Test Phase 1 (focus blocks in morning brief) | Zaal | Day 1 |
| Build Phase 2 tap-to-approve booking flow | coc-loop | After Phase 1 validated |
