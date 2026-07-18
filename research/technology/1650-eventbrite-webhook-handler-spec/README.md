---
topic: technology, infrastructure, events
type: implementation-spec
status: SPEC READY — build by Aug 15 (before ZAOstock RSVPs come in). Hurricane handoff. 1 PR, ~2h.
last-validated: 2026-07-18
related-docs: 1601-zoe-supabase-integration-patterns, 1625-zao-supabase-schema-reference, 1585-zaostock-attendee-pre-event-welcome-pack, 1615-zoe-architecture-handoff-spec
board-tasks: None (Aug 15 build target per doc 1625)
action-owner: Hurricane (build + wire); Zaal (create Eventbrite webhook in dashboard)
---

# 1650 — ZAOstock Eventbrite Webhook Handler: Implementation Spec

> **What this is:** Hurricane handoff for `POST /api/webhooks/eventbrite-attendee` — the Next.js API route that receives Eventbrite RSVP events, fetches attendee details, upserts to `zaostock_2026_attendees` Supabase table, and triggers the ZOE welcome sequence.
>
> **Build deadline:** Aug 15, 2026 (before ZAOstock RSVPs start coming in volume)
> **Build time:** ~2h
> **Blocked on:** Eventbrite listing going live (doc 1636 spec) + Zaal creating the webhook subscription in Eventbrite dashboard (5 min, see Step 0 below)

---

## Why This Matters

ZAOstock's attendee pipeline is:

```
Eventbrite RSVP → webhook fires → ZAOOS API route → 
Supabase upsert → ZOE welcome email + Telegram notify
```

Without the webhook handler, new attendees are invisible to ZAO OS. Zaal would have to manually export CSV from Eventbrite. The webhook makes attendee management automatic.

**Build target: Aug 15.** ZAOstock Eventbrite page goes live Jul 21 (doc 1636). The webhook handler should be in production before the first wave of RSVPs hits. Even if Eventbrite launches with 50 RSVPs on day 1, we want every attendee in the database automatically.

---

## Step 0 — Zaal: Create Webhook in Eventbrite Dashboard (5 min)

Before Hurricane builds the handler, Zaal needs to register the webhook endpoint with Eventbrite.

**Steps:**
1. Go to eventbrite.com → Account → Developer → Webhooks
2. Click "Add Webhook"
3. Endpoint URL: `https://zaoos.com/api/webhooks/eventbrite-attendee`
4. Events to subscribe: `attendee.updated` (fires on new RSVP + changes)
5. Copy the webhook secret key — add it to Supabase environment secrets as `EVENTBRITE_WEBHOOK_SECRET`
6. Copy the Eventbrite API key — add to environment as `EVENTBRITE_API_KEY` (needed for the second fetch)

**Note:** Eventbrite webhooks use a two-step pattern. The webhook notification tells you SOMETHING changed; you call back to the Eventbrite API to get the full attendee data. The webhook body itself is not enough.

---

## Eventbrite Webhook Payload Format

Eventbrite sends a `POST` with this shape when an attendee registers:

```json
{
  "config": {
    "action": "attendee.updated",
    "user_id": "123456",
    "endpoint_url": "https://zaoos.com/api/webhooks/eventbrite-attendee",
    "webhook_id": "789"
  },
  "api_url": "https://www.eventbriteapi.com/v3/events/EVENT_ID/attendees/ATTENDEE_ID/",
  "api_v3_endpoint": "/v3/events/EVENT_ID/attendees/ATTENDEE_ID/"
}
```

The `api_url` is the key — you must GET this URL (with your Eventbrite API key) to get the actual attendee data.

**Eventbrite attendee API response (relevant fields):**

```json
{
  "id": "ATTENDEE_ID",
  "profile": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "ticket_class_name": "General Admission",
  "status": "Attending",
  "created": "2026-07-21T12:00:00Z",
  "changed": "2026-07-21T12:00:00Z",
  "order_id": "ORDER123"
}
```

---

## Implementation: `src/app/api/webhooks/eventbrite-attendee/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Only handle attendee.updated events
  if (body.config?.action !== 'attendee.updated') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const apiUrl = body.api_url;
  if (!apiUrl) {
    return NextResponse.json({ ok: false, error: 'no api_url' }, { status: 400 });
  }

  // Fetch full attendee data from Eventbrite
  const ebRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${process.env.EVENTBRITE_API_KEY}`,
    },
  });

  if (!ebRes.ok) {
    console.error('Eventbrite API error', ebRes.status, await ebRes.text());
    return NextResponse.json({ ok: false, error: 'eventbrite_api_error' }, { status: 502 });
  }

  const attendee = await ebRes.json();

  // Skip cancelled or not-attending attendees
  if (attendee.status !== 'Attending') {
    return NextResponse.json({ ok: true, skipped: `status=${attendee.status}` });
  }

  const ticketClassName = (attendee.ticket_class_name || '').toLowerCase();
  const ticketType: 'ga' | 'supporter' | 'vip' = 
    ticketClassName.includes('vip') ? 'vip' :
    ticketClassName.includes('supporter') ? 'supporter' : 'ga';

  // Upsert into zaostock_2026_attendees
  const { error: dbError } = await supabase
    .from('zaostock_2026_attendees')
    .upsert({
      name: attendee.profile.name,
      email: attendee.profile.email,
      eventbrite_id: attendee.id,
      ticket_type: ticketType,
      rsvp_date: attendee.created,
    }, { onConflict: 'email' });

  if (dbError) {
    console.error('Supabase upsert error', dbError);
    // Still return 200 to Eventbrite (don't retry on DB errors)
    return NextResponse.json({ ok: false, error: 'db_error' });
  }

  // Trigger ZOE welcome sequence via Telegram (doc 1585 Message 1)
  await triggerWelcomeMessage(attendee.profile.email, attendee.profile.name);

  return NextResponse.json({ ok: true, attendee_id: attendee.id });
}

async function triggerWelcomeMessage(email: string, name: string) {
  // ZOE posts to ZAO Telegram with attendee info
  const tgToken = process.env.ZOE_TG_BOT_TOKEN;
  const tgChatId = process.env.ZAAL_PRIVATE_TG_CHAT_ID; // private chat to Zaal only

  if (!tgToken || !tgChatId) return; // Silent fail — don't block the webhook

  const message = `New ZAOstock RSVP 🎵\n${name} (${email}) — ${new Date().toLocaleDateString()}`;
  
  await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: tgChatId, text: message }),
  }).catch(console.error); // Never throw — Telegram is best-effort
}
```

---

## Environment Variables Required

| Variable | Source | Notes |
|----------|--------|-------|
| `EVENTBRITE_API_KEY` | Eventbrite dashboard → API Keys | Personal OAuth token |
| `NEXT_PUBLIC_SUPABASE_URL` | Already in env | Existing |
| `SUPABASE_SERVICE_KEY` | Already in env | Existing service role key |
| `ZOE_TG_BOT_TOKEN` | `~/.zao/private/tg.env` | ZOE bot token |
| `ZAAL_PRIVATE_TG_CHAT_ID` | `~/.zao/private/tg.env` | Private Telegram chat to Zaal |

No new secrets needed except `EVENTBRITE_API_KEY`. Add it to Vercel environment variables after Zaal creates it in Eventbrite dashboard.

---

## Ticket Type Mapping

From the ZAOstock Eventbrite listing spec (doc 1636):

| Eventbrite ticket class | `ticket_type` in Supabase | Notes |
|------------------------|--------------------------|-------|
| "General Admission" or "Free RSVP" | `ga` | Default |
| "Supporter" or "Supporter Tier" | `supporter` | ~$10-25 |
| "VIP" or "Artist Pass" | `vip` | ZOR holders / artists |

The upsert uses `onConflict: 'email'` — if someone upgrades their ticket (GA → Supporter), the row updates to the new ticket type.

---

## Testing Checklist (Before Aug 15)

1. **Eventbrite test webhook:** Eventbrite dashboard → Developer → Webhooks → "Send Test" button
2. **Verify DB insert:** Check `zaostock_2026_attendees` in Supabase dashboard after test
3. **Verify Telegram notify:** Zaal checks private TG chat for the notification message
4. **Upgrade flow:** Test that upgrading from GA to Supporter updates the Supabase row (not duplicates)
5. **Cancellation handling:** Test that cancelled attendees (`status = "Not Attending"`) are skipped
6. **Rate limit:** Eventbrite sends webhooks sequentially — no rate limit concern for ZAOstock scale (~500 RSVPs)

---

## What Happens After Aug 15

Once the webhook is live:
1. **Sep 1:** ZOE has access to `zaostock_2026_attendees` for the pre-event message sequence (doc 1585)
2. **Sep 19:** ZOE sends Message 2 to all attendees (T-14 logistics brief)
3. **Sep 26:** ZOE sends Message 3 (T-7 WaveWarZ primer)
4. **Oct 3:** ZOE sends Message 4 (day-of reminder)

The full attendee welcome sequence (doc 1585) depends entirely on this webhook being live and the `zaostock_2026_attendees` table being populated.

---

## Sources

- `research/technology/1601-zoe-supabase-integration-patterns/` — `addAttendeeFromEventbrite` pattern (used as basis)
- `research/infrastructure/1625-zao-supabase-schema-reference/` — `zaostock_2026_attendees` table schema
- `research/community/1585-zaostock-attendee-pre-event-welcome-pack/` — 4-message welcome sequence
- `research/events/1636-zaostock-eventbrite-listing-spec/` — ticket types + Eventbrite listing setup
- `research/technology/1615-zoe-architecture-handoff-spec/` — ZOE Telegram notify pattern
- Eventbrite Webhooks API: eventbriteapi.com/v3/webhooks/ (free, no additional cost)
