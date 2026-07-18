# Zuke HMS Client Component — Implementation Guide (PR-3)

**Doc number:** 1357  
**Status:** READY-TO-IMPLEMENT — server-side complete, client side is the last piece  
**Context:** Multi-provider plan for Zuke: PR-1 (seam, merged) → PR-2 (HMS server-side, PR #18, open) → PR-3 (this guide, client component)  
**Board task:** bc6c214c (Zuke multi-provider graduation), 9238799f (Zuke - finish the audio backend)  
**Related docs:** none prior; ZAOOS has HMSVideoRoom.tsx at src/components/spaces/HMSVideoRoom.tsx (850 lines)

---

## What This PR Needs to Do

PR-3 adds the **browser side** of HMS: a `/live/hms/[id]` page that lets users join a 100ms room via the `@100mslive/react-sdk`. PR-2 handles everything server-side; this PR handles everything client-side.

One hard constraint (non-negotiable per locked product decision): **listening is OPEN** — no ZAO token gate on any listener path. Anyone with the link can listen. Creation stays gated (admin session required).

---

## Step 1: Install the 100ms SDK

```bash
cd /home/zaal/spokes/Zuke
npm install @100mslive/react-sdk
```

As of 2026-07, the package is `@100mslive/react-sdk` at `^0.11.2` (same version ZAOOS uses at `/home/zaal/spokes/ZAOOS/package.json`). Verify latest at npmjs.com/@100mslive/react-sdk.

**Critical:** The `@100mslive/react-sdk` bundle is ~300KB. It MUST load via `next/dynamic` with `{ ssr: false }` so Juke-path pages never download it. Fail to do this and the Juke path's initial bundle grows by 300KB.

---

## Step 2: Create the HMS Room Component

Source of truth: `/home/zaal/spokes/ZAOOS/src/components/spaces/HMSVideoRoom.tsx` (850 lines).

The ZAOOS version handles:
- Audio + video grid
- Active-speaker spotlight (> 4 peers)
- Screen share presenter view
- Emoji reactions (data channel)
- Live transcription (data channel)
- Standard icon controls (mic, cam, screenshare, end)

**What to port vs what to simplify:**

For Zuke PR-3, implement a simpler version — audio-first (Zuke's primary use case is live audio, not video). Full video can come in a follow-up. This keeps PR-3 reviewable.

**File to create:** `src/components/spaces/HMSAudioRoom.tsx`

```tsx
'use client';

// MUST load @100mslive/react-sdk via next/dynamic — never import directly
// at the top level of any file that's on the Juke path.
import dynamic from 'next/dynamic';

const HMSAudioRoomInner = dynamic(
  () => import('./HMSAudioRoomInner'),
  { ssr: false, loading: () => <div>Loading room...</div> },
);

export function HMSAudioRoom({ roomId }: { roomId: string }) {
  return <HMSAudioRoomInner roomId={roomId} />;
}
```

**File to create:** `src/components/spaces/HMSAudioRoomInner.tsx`

```tsx
'use client';

import {
  HMSRoomProvider,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectPeers,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { useEffect, useState } from 'react';

interface Props { roomId: string }

function RoomControls({ onLeave }: { onLeave: () => void }) {
  const actions = useHMSActions();
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const peers = useHMSStore(selectPeers);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-400">{peers.length} in room</div>
      <div className="flex gap-3">
        <button onClick={() => actions.setLocalAudioEnabled(!isAudioOn)}>
          {isAudioOn ? 'Mute' : 'Unmute'}
        </button>
        <button onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
}

function RoomInner({ roomId }: Props) {
  const actions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function join() {
      const res = await fetch('/api/hms/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, role: 'listener' }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      await actions.join({ authToken: data.token, userName: 'Listener' });
    }
    join().catch(e => setError(String(e)));
    return () => { actions.leave().catch(() => {}); };
  }, [roomId, actions]);

  if (error) return <div>Error: {error}</div>;
  if (!isConnected) return <div>Joining...</div>;
  return <RoomControls onLeave={() => actions.leave()} />;
}

export default function HMSAudioRoomInner({ roomId }: Props) {
  return (
    <HMSRoomProvider>
      <RoomInner roomId={roomId} />
    </HMSRoomProvider>
  );
}
```

---

## Step 3: Create the Page Route

**File to create:** `src/app/live/hms/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/db/supabase';
import { HMSAudioRoom } from '@/components/spaces/HMSAudioRoom';
import { isLiveAudioProviderId } from '@/lib/spaces/providers';

interface Props { params: { id: string } }

export default async function HmsRoomPage({ params }: Props) {
  const { id } = params;

  // Validate room exists in DB with hms provider
  const { data: space } = await supabaseAdmin
    .from('juke_spaces')
    .select('id, title, status, provider')
    .eq('id', id)
    .eq('provider', 'hms')
    .single();

  if (!space) return notFound();

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">{space.title}</h1>
      {space.status === 'ended' ? (
        <p>This room has ended.</p>
      ) : (
        <HMSAudioRoom roomId={id} />
      )}
    </main>
  );
}
```

---

## Step 4: Create Live Space via HMS

The existing `/api/live/create` route needs to support `provider: 'hms'`. Check if it already reads the `provider` field from the request body and dispatches via `getLiveAudioProvider()`.

If not, update it:
```ts
// In /api/live/create/route.ts (or equivalent)
import { getLiveAudioProvider, isLiveAudioProviderId } from '@/lib/spaces/providers';

const provider = isLiveAudioProviderId(body.provider) ? body.provider : 'juke';
const audioProvider = getLiveAudioProvider(provider);
const result = await audioProvider.createRoom(input);
if (!result.ok) { /* handle error */ }

// Insert to juke_spaces with provider tag
await sb.from('juke_spaces').insert({
  id: result.room.id,
  title: input.title,
  provider: result.room.provider,
  created_by_fid: session.fid,
  status: 'active',
  embed_url: result.room.embedUrl,
  raw: result.room.raw,
});
```

---

## Step 5: Add to DB (Migration Already Done)

Migration #5 (`scripts/juke-spaces-migration-5.sql`) is already written in PR #18. Apply it to Supabase before deploying.

---

## Env Vars to Add (Vercel)

| Var | Required | Source |
|-----|----------|--------|
| `HMS_ACCESS_KEY` | Yes | 100ms Dashboard → App Settings → Developer |
| `HMS_APP_SECRET` | Yes | 100ms Dashboard → App Settings → Developer |
| `HMS_WEBHOOK_SECRET` | Yes | Any string; match in 100ms Dashboard → Webhooks |
| `HMS_TEMPLATE_ID` | No | 100ms Dashboard → Templates (optional) |

---

## Testing Plan

1. Add HMS env vars to Vercel (or `.env.local` for local test)
2. `POST /api/live/create` with `{ provider: 'hms', title: 'Test Room' }` — should return a 24-char hex room ID and `/live/hms/<id>` embed URL
3. Navigate to `/live/hms/<id>` — should join the 100ms room as a listener
4. POST `/api/hms/token` with the room ID — should return a valid JWT
5. Test webhook: configure 100ms dashboard to hit `/api/hms/webhook`, verify Authorization header check works
6. Check Supabase `juke_spaces` table — row should appear with `provider = 'hms'`

---

## What ZAOOS's HMSVideoRoom.tsx Has (Not in Scope for PR-3)

These features from ZAOOS can be added in follow-up PRs if needed:
- Video grid + screen share (requires video track rendering)
- Emoji reactions via 100ms data channel
- Live transcription via data channel
- Active-speaker spotlight threshold (>4 peers)
- Stage mode (speaker/listener roles with hand-raise)
- Token-gate (explicitly NOT for Zuke — listening is open)

---

## Complexity Estimate

| Step | Effort |
|------|--------|
| npm install + dynamic import wrapper | 15 min |
| HMSAudioRoomInner.tsx (basic join/leave/mute) | 30 min |
| /live/hms/[id] page route | 15 min |
| Wire /api/live/create to provider dispatch | 20 min |
| Manual test end-to-end | 30 min |
| **Total** | **~2h** |

---

## PR-3 Checklist

- [ ] `npm install @100mslive/react-sdk`
- [ ] `src/components/spaces/HMSAudioRoom.tsx` (dynamic import shell)
- [ ] `src/components/spaces/HMSAudioRoomInner.tsx` (join/leave/mute)
- [ ] `src/app/live/hms/[id]/page.tsx` (SSR lookup + render)
- [ ] `/api/live/create` dispatches via `getLiveAudioProvider(provider)`
- [ ] HMS env vars added to Vercel
- [ ] Migration-5 applied to Supabase
- [ ] Manual test: create HMS room → join in browser → webhook fires → DB updates
