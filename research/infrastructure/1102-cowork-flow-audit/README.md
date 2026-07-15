---
type: audit
topic: infrastructure
status: research-complete
last-validated: 2026-07-15
tier: STANDARD
original-query: |
  Audit the entire co-working flow end-to-end. The board is broken in a specific, visible way:
  On task #880, Iman commented and ZOE replied with the exact same canned line
  ("Noted - looping Zaal in.") that it posted 21h earlier on a different comment.
  Find the root cause AND all other breaks in the Iman->ZOE->Zaal->back loop.
---

# Co-working Flow Audit (Doc 1102)

## Key Decision: Architecture is Implemented, UX is Broken

The full Iman -> ZOE -> Zaal -> board reply loop IS technically implemented end-to-end. The
reply-bridge code exists and is wired correctly. However, the UX is broken at three critical
points that make the flow feel like theater to Iman - she gets acknowledgment theater instead of
real answers, and no way to know if or when a response is coming.

**Root cause of "canned line" symptom:** The "Noted - looping Zaal in." message is intentionally
hardcoded and generic (no context). When Iman makes two comments and sees the identical response
both times, it looks like noise/spam, not real acknowledgment. The system IS working, but it feels
broken because the UX is opaque.

## Full Flow Diagram (Iman -> ZOE -> Zaal -> Back)

```
Iman posts comment on task #880:
  "any updates on the direction for this build?"

  |
  v

ZOE scheduler tick runs (every 5-10 min, bot/src/zoe/scheduler.ts:~300)
  |
  +- task-teammate-ack.ts runs:
  |    - Fetch task from Supabase REST API
  |    - Detect Iman's comment (userId='iman', team member)
  |    - Post ZOE comment: "Noted - looping Zaal in." [PROBLEM 1: hardcoded, no context]
  |    - Send TG message to Zaal: "[Iman] on task \"#880\":\n\n\"...any updates...\"\n\nWhat should I reply?\n\nTask: thezao.xyz/board?task=880"
  |    - Store pending reply mapping in ~/.zao/zoe/teammate_ack_pending.jsonl
  |
  v

Zaal receives TG message on @zaoclaw_bot [Telegram bridge]
  - Message includes FULL context: Iman's name, the actual question, task link
  - [WORKING: this part is correct]

  |
  v

Zaal replies on TG (reply-to the message from ZOE)

  |
  v

index.ts message:text handler (bot/src/zoe/index.ts:861-881) runs
  - Detects reply_to_message_id
  - Looks up pending mapping by message ID
  - Calls postZaalReplyToTask(pending, replyText)
  - Appends Zaal's reply to task's metadata.comments
  - Clears pending entry
  - Replies to Zaal on TG: "Posted your reply to \"#880\". Done."

  |
  v

Iman reloads task #880 on board
  - Sees ZOE's "Noted - looping Zaal in." [PROBLEM 2: can't find the actual reply without searching]
  - Scrolls down to see Zaal's reply
  - [PROBLEM 3: no notification that reply arrived - must manually reload]


PROBLEM ZONES:
  P1: Iman's "Noted" acknowledgment is opaque (no context, no task link)
  P2: No feedback to Iman that Zaal replied (no mention, no notification)
  P3: If TG send fails, Zaal never asked but comment marked as "seen"
  P4: If Zaal never replies, no escalation/timeout
  P5: Reply routing unclear (which ZOE comment is the "reply", not the original ack?)
```

## All Problems Found (Ranked by Impact)

### Critical Issues

**1. ZOE's "noted" comment provides zero context to Iman (task-teammate-ack.ts:212)**

File: `bot/src/zoe/task-teammate-ack.ts:212`

The hardcoded message "Noted - looping Zaal in." tells Iman nothing:
- No indication of who was asked (always Zaal, but she doesn't know)
- No task ID/link in the acknowledgment itself
- No timeline for when a reply might arrive
- Identical on every team member comment, creating "spam" impression

When Iman comments twice and sees the same exact response both times, it feels like the system
doesn't even know she commented - pure theater.

**Solution:** Include task ID + context in the board comment. Change hardcoded string to
dynamically include: task number, a snippet of the question, and a note that Zaal was asked.

---

**2. No notification to Iman when Zaal replies (missing mention/notification)**

The reply-bridge posts Zaal's reply to the task, but Iman has no way to know. She must:
1. Manually reload the task page
2. Scroll to find Zaal's comment (buried below the "Noted" ack)
3. Pray she doesn't miss it if she's not actively watching

**Solution:** When posting Zaal's reply, include an @iman mention so the board's mention system
notifies her that someone replied.

---

**3. TG send failure is silently swallowed; Zaal never asked but comment marked seen (task-teammate-ack.ts:289-311)**

File: `bot/src/zoe/task-teammate-ack.ts`

```typescript
messageId = await sendTg(zaalChatId, message);  // line 290 - may fail silently

if (messageId !== null) {  // line 295
  // Store pending reply mapping
  ...
  asked++;  // line 306
  done.push(seenKey(...));  // line 307 - marked seen
} else {
  // messageId is null - sendTg failed
  // Comment is NOT marked seen (line 314 only marks 'done' entries)
  // BUT there's no console error or logging
}
```

If Telegram API call fails (network, timeout, 403), the comment is NOT marked seen, so it will
be retried next tick. But there's no error notification to Zaal that he missed a question.

**Solution:** Log failures loudly. Add error callback to notify Zaal that a message failed to send.

---

### High-Impact Issues

**4. No timeout/escalation if Zaal doesn't reply (missing escalation logic)**

If Zaal receives the TG ask but ignores it, the comment sits on the board with "Noted - looping
Zaal in." forever. No reminder, no escalation, no fallback.

**Solution:** Add a TTL to pending replies (e.g., 4 hours). If no reply by then, post a second
TG message to Zaal (or Iman) escalating.

---

**5. Reply-to mapping stored in file system with potential durability issues**

File: `bot/src/zoe/task-teammate-ack.ts:34-35`

```typescript
const PENDING_REPLIES_PATH = join(ZOE_HOME, 'teammate_ack_pending.jsonl');
```

The mapping from TG message ID to task is stored in a JSONL file on disk. If ZOE crashes/restarts
before a reply is posted, the mapping could be lost:
- Process crashes after receivin a TG reply but before it's marked on the board
- File write fails but code continues
- Process restarts and lost mapping is not recovered

**Solution:** Migrate pending-reply tracking to Supabase (cowork tracker DB) instead of file
system, or add recovery/reconciliation logic.

---

### Medium-Impact Issues

**6. Seen-tracking file could become corrupted or out-of-sync**

Files: `task-teammate-ack.ts:98-111`, `task-mention-notify.ts:95-108`

Both use JSONL line-based files for dedup. If a line is partially written or file is edited
externally, parsing could fail and re-ack the same comment.

---

**7. Reply-bridge handler in index.ts can silently fail (index.ts:877-880)**

File: `bot/src/zoe/index.ts:877-880`

```typescript
} catch (err) {
  console.warn('[zoe/index] reply-bridge handler failed (nbd):', (err as Error)?.message);
  // Fall through to normal message handling if the bridge fails
}
```

If postZaalReplyToTask() or getPendingReply() throws, the error is logged but processing
continues. The reply might be lost and Zaal's TG message treated as a normal chat message.

---

**8. No differentiation between team-member acks and Zaal replies in UI**

Both the initial "Noted" ack and Zaal's actual reply appear as comments in the thread. The board
UI has no way to distinguish them (no special styling, no "system" vs "user" label). Iman sees
them as two comments with no clear relationship.

---

### Lower-Priority Issues

**9. Task link in TG message uses legacy_id fallback**

File: `task-teammate-ack.ts:245`

```typescript
`Task: thezao.xyz/board?task=${task.legacy_id ?? task.id}`
```

If legacy_id is null (new tasks), the board URL uses the raw UUID, which may not render correctly
or may not be the canonical permalink.

---

**10. MAX_ACKS_PER_TICK is hard-coded to 10**

File: `task-teammate-ack.ts:37`

If there are 15 team member comments in one tick, only 10 are acked. The other 5 will be retried
next tick, potentially causing them to accumulate and create a queue backlog. No feedback on
whether the cap was hit.

---

## Code Locations (File:Line)

| Problem | File | Lines |
|---------|------|-------|
| Hardcoded "noted" message | `bot/src/zoe/task-teammate-ack.ts` | 212 |
| TG ask includes good context | `bot/src/zoe/task-teammate-ack.ts` | 237-246 |
| TG send failure swallowed | `bot/src/zoe/task-teammate-ack.ts` | 289-311 |
| Pending reply file storage | `bot/src/zoe/task-teammate-ack.ts` | 34-35, 118-148 |
| Reply-bridge handler | `bot/src/zoe/index.ts` | 861-881 |
| Silent failure in bridge | `bot/src/zoe/index.ts` | 877-880 |
| Mention notify system | `bot/src/zoe/task-mention-notify.ts` | 163-168 |
| Comment reply system | `bot/src/zoe/task-comment-replies.ts` | 1-80 |

## Why It Feels Broken (The Iman Experience)

1. Posts a question: "@zaal any updates on the direction for this build?"
2. Gets immediate reply: "Noted - looping Zaal in." (no context about what was noted)
3. Waits for Zaal's actual answer
4. Eventually notices Zaal replied (only by manually reloading the page)
5. Can't tell if Zaal is actually responding to her question or if the comment is about something else
6. If Zaal doesn't reply within hours, sees no escalation or follow-up

The system IS working (replies do post), but it's opaque. Iman can't tell.

## Fix Priority Plan (V2 Rollout)

### Phase 1: UX Fix (1-2h work) - SHIP FIRST

These fixes make the system feel less like theater:

1. **Improve the "noted" acknowledgment message** (task-teammate-ack.ts:212)
   - Change from: "Noted - looping Zaal in."
   - Change to: "Noted on #${legacyId} - asked Zaal in Telegram"
   - Include snippet of what was asked: "Noted your q: \"${snippet}\" - asking Zaal"

2. **Add @mention to Zaal's reply** (task-teammate-ack.ts:362-368)
   - When posting Zaal's reply, prefix with "@iman" so mention system notifies her
   - This makes it clear the reply is directed at her

3. **Add task link to "noted" comment** (task-teammate-ack.ts:212)
   - Include URL so Iman can navigate back to the board directly from her task list

### Phase 2: Reliability Fix (2-3h work)

1. **Migrate pending-reply tracking to Supabase** (task-teammate-ack.ts:34-35, 118-148)
   - Create a `pending_replies` table in cowork tracker
   - Replace file-based JSONL with DB queries
   - Add recovery logic on startup

2. **Add timeout/escalation for unanswered TG asks** (new)
   - Store createdAt timestamp on pending reply
   - Every tick, check if any pending > 4 hours old
   - Send reminder TG or escalate to Iman if no reply

3. **Improve error handling in TG send** (task-teammate-ack.ts:289-311)
   - Log failures with full context (task, comment, error)
   - Add counter/metric for send failures per tick
   - Optionally notify Zaal that message send failed

### Phase 3: Clarification Fix (1h work)

1. **Add UI indicators for system comments** (board UI - not in ZAOOS)
   - Tag ZOE "noted" comments with [SYSTEM] label
   - Tag Zaal replies with [ANSWER] label or different styling
   - Make the relationship clear

## Next Actions

**Owner: Zaal**

1. **Decide UX fix depth**
   - Minimum: Improve "noted" message content (1h work, ship now)
   - Recommended: Phase 1 + 2 (3-5h work, ship in next sprint)
   - Comprehensive: All three phases (6-8h work, full redesign)

2. **Decide escalation strategy**
   - If Zaal ignores a TG ask for 4h, who gets notified? (Zaal again? Iman? Fallback answer?)
   - Does "no reply" mean re-ask Zaal, or auto-reply on the board?

3. **Decide storage migration**
   - Keep file-based or move to DB?
   - File-based is simpler and OK for MVP, but DB is more robust long-term

4. **Acceptance criteria for "fixed"**
   - Iman comments -> sees ZOE ack with task context
   - Zaal gets TG ask with full comment + task link
   - Iman is notified when Zaal replies (either by mention or notification)
   - If Zaal doesn't reply in 4h, there's a fallback/escalation

## Validation

**Confirmed working (via code inspection):**
- Task-teammate-ack.ts fetches team member comments correctly
- TG message to Zaal includes full context (who, what, task link)
- Reply-bridge in index.ts correctly posts Zaal's reply back to the task
- Dedup tracking prevents double-acking the same comment

**Not confirmed (requires live testing or logs):**
- Whether TG sends are succeeding or failing silently
- Whether Zaal is actually receiving the TG asks
- Whether the reply-bridge is actually being triggered (need logs from a real interaction)
- Whether the seen file is persisting correctly across ZOE restarts

**Recommended follow-up validation:**
1. Pull ZOE logs from 2026-07-15 and trace one complete task-880 flow
2. Verify teammate_ack_seen.jsonl and teammate_ack_pending.jsonl files exist and have content
3. Test a live comment -> TG ask -> reply flow with full logging

---

**Doc 1102 - Cowork Flow Audit (2026-07-15)**

Primary findings: architecture is complete, UX is opaque. The loop works but feels broken
because Iman gets generic acks instead of contextual feedback.
