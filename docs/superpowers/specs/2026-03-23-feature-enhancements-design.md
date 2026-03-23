# Feature Enhancements — Design Spec

> **Date:** March 23, 2026
> **Status:** Approved
> **Scope:** Improvements to already-built features — not new features
> **Goal:** Polish what's shipped so current members get a better experience

---

## Priority Tiers

### Tier 1: High Impact (ship first)

These fix real broken experiences or major UX gaps.

### Tier 2: Medium Impact — Quick Wins (1-4 hours each)

Small, scoped improvements that each make one feature noticeably better.

### Tier 3: Low Impact — Polish (when convenient)

Nice-to-haves that improve edge cases or add minor convenience.

---

## Tier 1: High Impact

### 1.1 Music Player — Auto-Skip on Error

**Problem:** When a track fails to load (broken URL, service down, CORS), playback stalls. The user sees an error banner but must manually click next. In radio mode this kills the experience.

**Fix:**
- In `src/components/music/GlobalPlayer.tsx`, add auto-skip after 5-second timeout on error
- Show brief toast: "Skipped [track] — failed to load"
- Add a "Retry" button alongside the skip
- If 3 consecutive tracks fail, pause and show "Having trouble playing. Check your connection."

**Files:**
- Modify: `src/components/music/GlobalPlayer.tsx`
- Modify: `src/providers/audio/PlayerProvider.tsx` (error state + auto-advance logic)

### 1.2 Governance — Vote Breakdown View

**Problem:** Users can see vote totals but not WHO voted or how much weight each voter carried. This undermines governance transparency — the whole point of respect-weighted voting.

**Fix:**
- Add expandable voter list to each proposal card in governance page
- Show: voter name/pfp, vote direction (for/against), vote weight, % of total
- Sort by weight descending
- Link voter name to their profile

**Files:**
- Modify: `src/app/(auth)/governance/page.tsx`
- Modify: `src/app/api/proposals/route.ts` (include voter details in GET response)
- May need: `src/app/api/proposals/voters/route.ts` (new route if voter data is separate)

### 1.3 Activity Feed — Complete Coverage

**Problem:** Activity feed may not include all content types. Governance votes, fractal sessions, and respect events may be missing or inconsistently populated.

**Fix:**
- Audit `src/app/api/activity/feed/route.ts` — verify all 8 activity types actually return data
- Add missing queries for any types returning empty arrays
- Ensure each activity type deep-links to the right page (not just `/governance` but `/governance?id=X`)

**Files:**
- Modify: `src/app/api/activity/feed/route.ts`
- Modify: `src/components/home/ActivityFeed.tsx` (deep-link hrefs)

### 1.4 Chat Search — Scope Clarity

**Problem:** Search only covers Farcaster casts, not XMTP DMs. Users expect unified search but get partial results with no indication of scope.

**Fix (Phase 1 — label scope):**
- Add "Searching channel messages" subtitle in SearchDialog
- Add grayed-out "DM search coming soon" label

**Fix (Phase 2 — XMTP search):**
- XMTP MLS doesn't support server-side search (E2E encrypted)
- Client-side search: index decrypted messages in memory, search locally
- Show results in separate "DMs" tab within SearchDialog

**Files:**
- Modify: `src/components/chat/SearchDialog.tsx`
- Phase 2: `src/contexts/XMTPContext.tsx` (add message index)

---

## Tier 2: Medium Impact — Quick Wins

### 2.1 ComposeBar — Visible Character Count

**Problem:** 1024-char Farcaster limit exists but users have no feedback while typing.

**Fix:** Add `{text.length}/1024` counter below compose input. Turn gold at 900, red at 1000.

**Files:**
- Modify: `src/components/chat/ComposeBar.tsx`

### 2.2 Chat — Scroll-to-Bottom Button

**Problem:** When user scrolls up in active chat, new messages arrive below but there's no way to jump back down.

**Fix:** Floating "New messages" pill at bottom of MessageList when scrolled up. Click to scroll to latest.

**Files:**
- Modify: `src/components/chat/MessageList.tsx`

### 2.3 Music Embeds — Add to Queue Button

**Problem:** Users discover music in chat but can't add it to their queue without navigating to the music page.

**Fix:** Add small queue icon button on each MusicEmbed card. Clicking adds the track to `useMusicQueue`.

**Files:**
- Modify: `src/components/music/MusicEmbed.tsx`
- Modify: `src/hooks/useMusicQueue.ts` (expose `addToQueue` method)

### 2.4 Track of the Day — Share to Chat

**Problem:** TOTD has play but no way to broadcast the pick to the community.

**Fix:** Add "Share to #zao" button using existing `ShareToFarcaster` component with pre-filled text: "Today's Track of the Day: [title] by [artist] [link]"

**Files:**
- Modify: `src/components/music/TrackOfTheDay.tsx`

### 2.5 ProfileDrawer — Start DM Button

**Problem:** Can't DM someone from their chat profile popup. Must navigate to messages, create new conversation, find their address.

**Fix:** Add "Message" button in ProfileDrawer that navigates to `/messages?newDm=[address]` (or opens XMTP conversation directly if addresses known).

**Files:**
- Modify: `src/components/chat/ProfileDrawer.tsx`
- Modify: `src/components/messages/MessagesRoom.tsx` (handle `newDm` query param)

### 2.6 Streaks — Wire to All Activity Types

**Problem:** Streaks only trigger on login via HomePage. Actual activities (posting, voting, reacting, submitting music) don't count.

**Fix:** Call `/api/streaks/record` with appropriate `activityType` from:
- `src/app/api/chat/send/route.ts` (cast)
- `src/app/api/chat/react/route.ts` (reaction)
- `src/app/api/proposals/vote/route.ts` (vote)
- `src/app/api/proposals/comment/route.ts` (comment)
- `src/app/api/music/submissions/route.ts` (submission)

Each route adds one line after successful action:
```typescript
fetch(`${baseUrl}/api/streaks/record`, {
  method: 'POST',
  body: JSON.stringify({ activityType: 'cast' }),
  headers: { cookie: req.headers.get('cookie') || '' },
});
```

Fire-and-forget — don't await, don't block the response.

**Files:**
- Modify: 5 API routes listed above (one line each)

### 2.7 Notifications — Type Filters

**Problem:** Notification list is flat. Users with many notifications can't find specific types (votes on their proposals, new members, etc.).

**Fix:** Add filter pills above notification list: All | Proposals | Votes | Comments | Members | Music

**Files:**
- Modify: `src/app/api/notifications/route.ts` (add `type` query param filter)
- Modify: notification UI component (add filter pills)

### 2.8 Music Queue — Persist Across Refresh

**Problem:** Queue is built per-session from messages. Page refresh = queue gone.

**Fix:** Save current queue to `localStorage` on every change. Restore on mount. Clear when user explicitly empties queue.

**Files:**
- Modify: `src/hooks/useMusicQueue.ts`

### 2.9 Admin — Styled Confirmation Modals

**Problem:** Destructive admin actions (deactivate user, remove from allowlist, hide message) use native `confirm()` — inconsistent with the app's design.

**Fix:** Replace all `confirm()` calls with a shared `ConfirmDialog` component. Red "Confirm" button for destructive actions.

**Files:**
- Create: `src/components/ui/ConfirmDialog.tsx`
- Modify: `src/components/admin/UsersTable.tsx`
- Modify: `src/components/admin/AllowlistTable.tsx`
- Modify: `src/components/admin/HiddenMessages.tsx`

### 2.10 Radio + Queue Integration

**Problem:** Radio and manual queue are completely separate. Starting radio clears queue. Queueing a track stops radio. User must choose one or the other.

**Fix:** Allow manual queue additions while radio is playing. When queue is empty, resume radio. Manual tracks take priority (play next), then radio continues.

**Files:**
- Modify: `src/hooks/useMusicQueue.ts`
- Modify: `src/hooks/useRadio.ts`
- Modify: `src/providers/audio/RadioProvider.tsx`

---

## Tier 3: Low Impact — Polish

### 3.1 Image Upload — Pre-Upload Size Feedback

Show file size next to preview. If > 5MB, show warning before upload attempt instead of failing after.

**Files:** `src/components/chat/ComposeBar.tsx`

### 3.2 Notifications — Group by Actor

Group consecutive notifications from the same actor: "Zaal voted on 3 of your proposals" instead of 3 separate notifications.

**Files:** Notification UI component

### 3.3 XMTP — Typing Indicators

XMTP MLS supports custom content types. Implement typing indicator as a lightweight content type broadcast.

**Files:** `src/contexts/XMTPContext.tsx`, `src/components/messages/MessageThread.tsx`

### 3.4 Search — Channel Scope Toggle

Add "This channel" / "All channels" toggle in SearchDialog.

**Files:** `src/components/chat/SearchDialog.tsx`, `src/app/api/chat/search/route.ts`

### 3.5 Activity Feed — Real-Time Updates

Replace 15-second polling with Supabase Realtime subscription for instant activity updates.

**Files:** `src/components/home/ActivityFeed.tsx`

### 3.6 NowPlayingHero — TOTD Deep-Link

TOTD link in hero should scroll to the TOTD section on `/music` page, not just navigate to the page.

**Files:** `src/components/home/NowPlayingHero.tsx`, `src/components/music/MusicPage.tsx`

---

## Implementation Order

### Batch 1: Music Polish (1-2 days)
- 1.1 Auto-skip on error
- 2.3 Music embeds → add to queue
- 2.8 Queue persistence (localStorage)
- 2.10 Radio + queue integration
- 2.4 TOTD share to chat

### Batch 2: Chat & Social Polish (1-2 days)
- 2.1 Character count
- 2.2 Scroll-to-bottom button
- 2.5 ProfileDrawer → Start DM
- 1.4 Search scope clarity (Phase 1 — label only)

### Batch 3: Governance & Notifications (1-2 days)
- 1.2 Vote breakdown view
- 2.7 Notification type filters
- 1.3 Activity feed complete coverage

### Batch 4: Streaks & Admin (half day)
- 2.6 Wire streaks to all activity types
- 2.9 Styled confirmation modals

### Batch 5: Polish (whenever)
- Tier 3 items as time allows

---

## Out of Scope

- New features (cross-posting, Hats, AI agent) — separate specs exist
- XMTP search (Phase 2) — complex due to E2E encryption, needs own spec
- XMTP typing indicators — needs XMTP content type research
- Queue reordering UI — nice-to-have, not blocking
