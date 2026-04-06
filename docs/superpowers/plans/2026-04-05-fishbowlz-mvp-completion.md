# FISHBOWLZ MVP Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 4 must-have features for FISHBOWLZ MVP: stale user cleanup, host end room, nav entry point, mobile layout pass.

**Architecture:** Heartbeat-based presence via the existing 5s room poll + a new `heartbeat` PATCH action. Host end room via new `end_room` action. Nav via BottomNav MORE_ITEMS. Mobile via Tailwind responsive utilities on existing components.

**Tech Stack:** Next.js App Router, Supabase (JSONB), 100ms React SDK, Tailwind CSS v4

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/fishbowlz/rooms/[id]/route.ts` | Modify | Add `heartbeat` and `end_room` PATCH actions, prune stale users on every read |
| `src/app/api/fishbowlz/rooms/route.ts` | Modify | Filter ended rooms from default list, prune stale users on GET |
| `src/app/fishbowlz/[id]/page.tsx` | Modify | Add heartbeat interval, host end room button, mobile-responsive layout, redirect on ended |
| `src/app/fishbowlz/page.tsx` | Modify | Mobile-responsive room cards, show ended rooms differently |
| `src/components/navigation/BottomNav.tsx` | Modify | Add FISHBOWLZ to MORE_ITEMS and MORE_MATCH_PATHS |
| `src/components/spaces/HMSFishbowlRoom.tsx` | Modify | Send `beforeunload` leave, mobile-friendly controls |

---

### Task 1: Stale User Cleanup — Server-Side Pruning

**Files:**
- Modify: `src/app/api/fishbowlz/rooms/[id]/route.ts`

Add a `lastSeen` field to speaker/listener JSONB entries. Add a `heartbeat` action. Add a prune function that removes users not seen in 2 minutes. Run prune on every GET and heartbeat.

- [ ] **Step 1: Add prune helper and update FishbowlSpeaker interface**

Add `lastSeen` to the interface and a prune function at the top of the file:

```typescript
interface FishbowlSpeaker {
  fid: number;
  username: string;
  joinedAt: string;
  lastSeen?: string;
}

const STALE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

function pruneStaleUsers(users: FishbowlSpeaker[]): FishbowlSpeaker[] {
  const cutoff = Date.now() - STALE_TIMEOUT_MS;
  return users.filter((u) => {
    const seen = u.lastSeen ? new Date(u.lastSeen).getTime() : new Date(u.joinedAt).getTime();
    return seen > cutoff;
  });
}
```

- [ ] **Step 2: Add heartbeat action to PATCH handler**

Add this block before the generic update section:

```typescript
if (action === 'heartbeat') {
  const { fid } = data;
  if (fid !== session.fid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const room = await supabaseAdmin.from('fishbowl_rooms').select('current_speakers, current_listeners').eq('id', id).single();
  if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const now = new Date().toISOString();
  let speakers: FishbowlSpeaker[] = parseJsonb(room.data.current_speakers, []);
  let listeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);

  // Update lastSeen for this user
  speakers = speakers.map((s) => s.fid === fid ? { ...s, lastSeen: now } : s);
  listeners = listeners.map((l) => l.fid === fid ? { ...l, lastSeen: now } : l);

  // Prune stale users
  speakers = pruneStaleUsers(speakers);
  listeners = pruneStaleUsers(listeners);

  await supabaseAdmin.from('fishbowl_rooms').update({
    current_speakers: speakers,
    current_listeners: listeners,
    last_active_at: now,
  }).eq('id', id);

  return NextResponse.json({ success: true, speakers, listeners });
}
```

- [ ] **Step 3: Add pruning to GET handler**

Update the GET handler to prune stale users before returning:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: room, error } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Prune stale users on read
  if (room.state === 'active') {
    const speakers: FishbowlSpeaker[] = pruneStaleUsers(parseJsonb(room.current_speakers, []));
    const listeners: FishbowlSpeaker[] = pruneStaleUsers(parseJsonb(room.current_listeners, []));

    const speakersChanged = speakers.length !== parseJsonb(room.current_speakers, []).length;
    const listenersChanged = listeners.length !== parseJsonb(room.current_listeners, []).length;

    if (speakersChanged || listenersChanged) {
      await supabaseAdmin.from('fishbowl_rooms').update({
        current_speakers: speakers,
        current_listeners: listeners,
      }).eq('id', id);
      room.current_speakers = speakers;
      room.current_listeners = listeners;
    }
  }

  return NextResponse.json(room);
}
```

- [ ] **Step 4: Add lastSeen to join actions**

In the existing `join_speaker` action, update the new speaker entry:
```typescript
const newSpeakers = [...speakers, { fid, username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
```

Same for `join_listener`:
```typescript
const newListeners = [...listeners, { fid, username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() }];
```

And for `rotate_in`, the new speaker entry:
```typescript
speakers.push({ fid: listenerFid, username: listenerUsername, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() });
```

And the rotated-out speaker moved to listeners:
```typescript
listeners.push({ fid: rotatedOut.fid, username: rotatedOut.username, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString() });
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/fishbowlz/rooms/[id]/route.ts"
git commit -m "feat: FISHBOWLZ stale user pruning — 2-min heartbeat + prune on read"
```

---

### Task 2: Stale User Cleanup — Client-Side Heartbeat + beforeunload

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`
- Modify: `src/components/spaces/HMSFishbowlRoom.tsx`

- [ ] **Step 1: Add heartbeat interval to room page**

In `FishbowlRoomPage`, add a heartbeat interval that fires every 45 seconds. Add this after the existing polling `useEffect`:

```typescript
// Heartbeat — tell server we're still here
useEffect(() => {
  if (!user || !roomId) return;
  if (!isSpeaker && !isListener) return;

  const sendHeartbeat = () => {
    fetch(`/api/fishbowlz/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heartbeat', fid: user.fid }),
    }).catch(() => {}); // best-effort
  };

  // Send immediately on mount
  sendHeartbeat();
  const interval = setInterval(sendHeartbeat, 45_000);

  return () => clearInterval(interval);
}, [user, roomId, isSpeaker, isListener]);
```

- [ ] **Step 2: Add beforeunload leave in room page**

Add this `useEffect` to fire a leave request when the user closes the tab:

```typescript
// Best-effort leave on tab close
useEffect(() => {
  if (!user || !roomId) return;
  if (!isSpeaker && !isListener) return;

  const handleUnload = () => {
    const action = isSpeaker ? 'leave_speaker' : 'leave_listener';
    // Use sendBeacon for reliability during page unload
    navigator.sendBeacon(
      `/api/fishbowlz/rooms/${roomId}`,
      new Blob(
        [JSON.stringify({ action, fid: user.fid })],
        { type: 'application/json' }
      )
    );
  };

  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, [user, roomId, isSpeaker, isListener]);
```

- [ ] **Step 3: Add leave_listener action to the API**

Back in `src/app/api/fishbowlz/rooms/[id]/route.ts`, add a `leave_listener` action block (currently only `leave_speaker` exists). Add it right after the `leave_speaker` block:

```typescript
if (action === 'leave_listener') {
  const { fid } = data;
  if (fid !== session.fid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const room = await supabaseAdmin.from('fishbowl_rooms').select('current_listeners').eq('id', id).single();
  if (!room.data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const rawListeners: FishbowlSpeaker[] = parseJsonb(room.data.current_listeners, []);
  const listeners = rawListeners.filter((l) => l.fid !== fid);
  await supabaseAdmin.from('fishbowl_rooms').update({
    current_listeners: listeners,
    last_active_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.rpc('log_fishbowl_event', {
    p_event_type: 'listener.left',
    p_event_data: JSON.stringify({ roomId: id, fid }),
    p_room_id: id,
    p_session_id: null,
    p_actor_fid: fid,
    p_actor_type: 'human',
  });

  return NextResponse.json({ success: true, listeners });
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/fishbowlz/[id]/page.tsx" "src/app/api/fishbowlz/rooms/[id]/route.ts"
git commit -m "feat: FISHBOWLZ client heartbeat (45s) + beforeunload leave + leave_listener action"
```

---

### Task 3: Host End Room

**Files:**
- Modify: `src/app/api/fishbowlz/rooms/[id]/route.ts`
- Modify: `src/app/fishbowlz/[id]/page.tsx`

- [ ] **Step 1: Add end_room action to API**

Add this block in the PATCH handler before the generic update section:

```typescript
if (action === 'end_room') {
  const roomCheck = await supabaseAdmin.from('fishbowl_rooms').select('host_fid').eq('id', id).single();
  if (!roomCheck.data || roomCheck.data.host_fid !== session.fid) {
    return NextResponse.json({ error: 'Only the host can end the room' }, { status: 403 });
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from('fishbowl_rooms').update({
    state: 'ended',
    current_speakers: [],
    current_listeners: [],
    ended_at: now,
    last_active_at: now,
  }).eq('id', id);

  await supabaseAdmin.rpc('log_fishbowl_event', {
    p_event_type: 'room.ended',
    p_event_data: JSON.stringify({ roomId: id }),
    p_room_id: id,
    p_session_id: null,
    p_actor_fid: session.fid,
    p_actor_type: 'human',
  });

  return NextResponse.json({ success: true, state: 'ended' });
}
```

- [ ] **Step 2: Add End Room button + confirmation to room page**

In `FishbowlRoomPage`, add state for the confirmation dialog:

```typescript
const [showEndConfirm, setShowEndConfirm] = useState(false);
```

Add the `endRoom` handler:

```typescript
const endRoom = async () => {
  await fetch(`/api/fishbowlz/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'end_room' }),
  });
  router.push('/fishbowlz');
};
```

In the header, after the state badge and seats count, add (host only):

```tsx
{isHost && room.state === 'active' && (
  <button
    onClick={() => setShowEndConfirm(true)}
    className="text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
  >
    End Room
  </button>
)}
```

Add the confirmation modal at the bottom of the return, before the closing `</div>`:

```tsx
{showEndConfirm && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-[#1a2a4a] rounded-xl p-6 w-full max-w-sm border border-white/10">
      <h2 className="text-lg font-bold mb-2">End this fishbowl?</h2>
      <p className="text-sm text-gray-400 mb-4">This will disconnect all participants and close the room. Transcripts are preserved.</p>
      <div className="flex gap-3">
        <button
          onClick={endRoom}
          className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
        >
          End Room
        </button>
        <button
          onClick={() => setShowEndConfirm(false)}
          className="flex-1 border border-white/20 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Auto-redirect participants when room ends**

In the existing `fetchRoom` callback, after `setRoom(data)`, add:

```typescript
// Redirect if room has ended
if (data.state === 'ended') {
  setAudioJoined(false);
  router.push('/fishbowlz');
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/fishbowlz/rooms/[id]/route.ts" "src/app/fishbowlz/[id]/page.tsx"
git commit -m "feat: FISHBOWLZ host end room with confirmation + auto-redirect participants"
```

---

### Task 4: Nav Entry Point

**Files:**
- Modify: `src/components/navigation/BottomNav.tsx`

- [ ] **Step 1: Add FISHBOWLZ to MORE_ITEMS**

Insert FISHBOWLZ as the second item in `MORE_ITEMS` (right after Social, before Spaces — it's related to Spaces but distinct):

```typescript
const MORE_ITEMS = [
  { label: 'Social', href: '/social', icon: '👥' },
  { label: 'Fishbowlz', href: '/fishbowlz', icon: '🐟' },
  { label: 'Spaces', href: '/spaces', icon: '🎙️' },
  // ... rest unchanged
] as const;
```

- [ ] **Step 2: Add /fishbowlz to MORE_MATCH_PATHS**

```typescript
const MORE_MATCH_PATHS = ['/ecosystem', '/tools', '/contribute', '/settings', '/social', '/fishbowlz', '/spaces', '/wavewarz', '/members', '/assistant', '/notifications', '/calls', '/library'];
```

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/BottomNav.tsx
git commit -m "feat: add FISHBOWLZ to navigation — More menu + desktop secondary tabs"
```

---

### Task 5: Mobile Layout — Room Detail Page

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`

The current layout uses `flex-col lg:flex-row` which is correct, but the sidebar content needs to stack better on mobile, and controls need bigger tap targets.

- [ ] **Step 1: Make header mobile-friendly**

Replace the current header div with responsive padding and wrapping:

```tsx
<div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
  <div className="flex items-center gap-3 min-w-0">
    <button onClick={() => router.push('/fishbowlz')} className="text-gray-400 hover:text-white shrink-0 p-1">
      ←
    </button>
    <div className="min-w-0">
      <h1 className="text-lg sm:text-xl font-bold truncate">{room.title}</h1>
      <p className="text-xs sm:text-sm text-gray-400">by @{room.host_username}</p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <span className={`text-xs px-2 py-1 rounded-full ${room.state === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
      {room.state}
    </span>
    {isHost && room.state === 'active' && (
      <button
        onClick={() => setShowEndConfirm(true)}
        className="text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
      >
        End
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 2: Make main stage responsive**

Update the main stage section padding and hot seat grid:

```tsx
<div className="flex-1 p-4 sm:p-6">
```

Update the hot seat grid to use responsive columns:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
```

- [ ] **Step 3: Make join controls touch-friendly**

Ensure all buttons have minimum 44px height for mobile tap targets. Update the join controls wrapper:

```tsx
<div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
```

Add `min-h-[44px]` to all join buttons (the gold and border buttons):

```tsx
className="... min-h-[44px] ..."
```

- [ ] **Step 4: Make sidebar responsive**

The sidebar already stacks on mobile via `lg:flex-row`, but add a max-height on mobile to prevent transcript from taking over:

```tsx
<div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[50vh] lg:max-h-none">
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/fishbowlz/[id]/page.tsx"
git commit -m "feat: FISHBOWLZ mobile-first layout — responsive header, grid, tap targets, sidebar"
```

---

### Task 6: Mobile Layout — Room List Page

**Files:**
- Modify: `src/app/fishbowlz/page.tsx`

- [ ] **Step 1: Make header responsive**

```tsx
<div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-[#f5a623]">FISHBOWLZ</h1>
    <p className="text-xs sm:text-sm text-gray-400">Persistent async fishbowl audio spaces</p>
  </div>
  <button
    onClick={() => setShowCreate(true)}
    className="bg-[#f5a623] text-[#0a1628] font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors text-sm sm:text-base min-h-[44px]"
  >
    + Create
  </button>
</div>
```

- [ ] **Step 2: Make room grid single column on mobile**

```tsx
<div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

- [ ] **Step 3: Make create modal mobile-friendly**

Add `max-h-[90vh] overflow-y-auto` to the modal inner div, and ensure inputs have minimum 44px height:

```tsx
<div className="bg-[#1a2a4a] rounded-xl p-5 sm:p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
```

All input elements: add `min-h-[44px]` class.

- [ ] **Step 4: Pad room list content area**

```tsx
<div className="p-4 sm:p-6">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/fishbowlz/page.tsx
git commit -m "feat: FISHBOWLZ mobile-first room list — single column, tap targets, responsive modal"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Lint**

```bash
npx eslint src/components/spaces/HMSFishbowlRoom.tsx src/components/navigation/BottomNav.tsx src/app/fishbowlz/ src/app/api/fishbowlz/ --quiet
```

Expected: 0 errors

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Manual smoke test checklist**

- [ ] Navigate to `/fishbowlz` from More menu (mobile + desktop)
- [ ] Create a room
- [ ] Join as speaker — audio connects
- [ ] Open in second tab, join as listener — shows in listener list
- [ ] Close second tab — listener disappears within 2 minutes
- [ ] Host clicks "End Room" — confirmation shows, room ends, redirect to list
- [ ] Ended room shows "ended" in list
- [ ] All layouts look correct on 375px mobile width
