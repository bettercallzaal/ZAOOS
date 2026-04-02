# Sprint 1: Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 4 quick wins — Last.fm OAuth UI, ListenBrainz scrobbling, Bluesky cross-posting, and ZOUNZ event notifications

**Architecture:** Each task is independent. Last.fm backend already exists (`src/lib/music/lastfm.ts` + `src/app/api/music/scrobble/route.ts`), just needs OAuth UI + callback route. ListenBrainz is new but simpler (token-based). Bluesky reuses existing `normalizeForBluesky()` from `src/lib/publish/normalize.ts`. ZOUNZ notifications use existing `createInAppNotification()` + Vercel cron pattern from `src/app/api/cron/follower-snapshot/route.ts`.

**Tech Stack:** Next.js 16, Supabase, Alchemy, @atproto/api, Viem (for ZOUNZ contract reads)

---

## Task 1: Last.fm OAuth Callback Route

**Files:**
- Create: `src/app/api/auth/lastfm/callback/route.ts`

- [ ] **Step 1: Create the OAuth callback route**

```typescript
// src/app/api/auth/lastfm/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSession as getLastfmSession } from '@/lib/music/lastfm';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.redirect(new URL('/settings?error=unauthorized', req.url));
    }

    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/settings?error=no_token', req.url));
    }

    const sk = await getLastfmSession(token);

    await supabaseAdmin
      .from('user_settings')
      .upsert(
        { fid: session.fid, lastfm_session_key: sk },
        { onConflict: 'fid' }
      );

    return NextResponse.redirect(new URL('/settings?lastfm=connected', req.url));
  } catch (error) {
    console.error('[lastfm/callback] Error:', error);
    return NextResponse.redirect(new URL('/settings?error=lastfm_failed', req.url));
  }
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `npx tsc --noEmit 2>&1 | grep -i lastfm`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/lastfm/callback/route.ts
git commit -m "feat: add Last.fm OAuth callback route"
```

---

## Task 2: Last.fm Disconnect Route

**Files:**
- Create: `src/app/api/auth/lastfm/disconnect/route.ts`

- [ ] **Step 1: Create the disconnect route**

```typescript
// src/app/api/auth/lastfm/disconnect/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabaseAdmin
      .from('user_settings')
      .update({ lastfm_session_key: null })
      .eq('fid', session.fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[lastfm/disconnect] Error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/lastfm/disconnect/route.ts
git commit -m "feat: add Last.fm disconnect route"
```

---

## Task 3: Last.fm Connect UI in Settings

**Files:**
- Modify: `src/app/(auth)/settings/SettingsClient.tsx`

Find the settings page and add a Last.fm section. The UI needs:
1. A "Connect Last.fm" button that redirects to `getAuthUrl(callbackUrl)`
2. A "Connected" status with disconnect button when `lastfm_session_key` is set
3. Fetch connection status from `/api/auth/lastfm/status`

- [ ] **Step 1: Create the Last.fm status check route**

```typescript
// src/app/api/auth/lastfm/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAuthUrl } from '@/lib/music/lastfm';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
      .from('user_settings')
      .select('lastfm_session_key')
      .eq('fid', session.fid)
      .single();

    const connected = !!data?.lastfm_session_key;
    const connectUrl = connected ? null : getAuthUrl(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/lastfm/callback`
    );

    return NextResponse.json({ connected, connectUrl });
  } catch (error) {
    console.error('[lastfm/status] Error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add Last.fm section to SettingsClient.tsx**

Read the current SettingsClient.tsx, then add a "Music Scrobbling" section. Add this inside the settings layout, after the existing platform connection sections:

```tsx
// Add to the settings page — "Music Scrobbling" section
function LastfmConnect() {
  const [status, setStatus] = useState<{ connected: boolean; connectUrl: string | null } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/lastfm').then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Last.fm</p>
          <p className="text-xs text-gray-500">Scrobble your ZAO OS plays to Last.fm</p>
        </div>
        {status.connected ? (
          <button
            onClick={async () => {
              setDisconnecting(true);
              await fetch('/api/auth/lastfm/disconnect', { method: 'POST' });
              setStatus({ connected: false, connectUrl: null });
              setDisconnecting(false);
            }}
            disabled={disconnecting}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <a
            href={status.connectUrl || '#'}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20 hover:bg-[#f5a623]/20 transition-colors"
          >
            Connect
          </a>
        )}
      </div>
      {status.connected && (
        <p className="text-[10px] text-green-400 mt-2">Connected — your plays are being scrobbled</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/lastfm/route.ts src/app/(auth)/settings/SettingsClient.tsx
git commit -m "feat: Last.fm connect/disconnect UI in settings"
```

---

## Task 4: ListenBrainz Scrobbling

**Files:**
- Create: `src/lib/music/listenbrainz.ts`
- Modify: `src/app/api/music/scrobble/route.ts` — add ListenBrainz support

- [ ] **Step 1: Create the ListenBrainz client**

```typescript
// src/lib/music/listenbrainz.ts
const API_URL = 'https://api.listenbrainz.org';

export async function submitListen(params: {
  artist: string;
  track: string;
  album?: string;
  timestamp: number;
  userToken: string;
}) {
  const payload = {
    listen_type: 'single',
    payload: [
      {
        listened_at: params.timestamp,
        track_metadata: {
          artist_name: params.artist,
          track_name: params.track,
          ...(params.album ? { release_name: params.album } : {}),
        },
      },
    ],
  };

  const res = await fetch(`${API_URL}/1/submit-listens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${params.userToken}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ListenBrainz error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function submitNowPlaying(params: {
  artist: string;
  track: string;
  album?: string;
  userToken: string;
}) {
  const payload = {
    listen_type: 'playing_now',
    payload: [
      {
        track_metadata: {
          artist_name: params.artist,
          track_name: params.track,
          ...(params.album ? { release_name: params.album } : {}),
        },
      },
    ],
  };

  const res = await fetch(`${API_URL}/1/submit-listens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${params.userToken}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ListenBrainz error ${res.status}: ${text}`);
  }

  return res.json();
}
```

- [ ] **Step 2: Update scrobble route to support both services**

Modify `src/app/api/music/scrobble/route.ts` — after the Last.fm scrobble block, add ListenBrainz:

```typescript
// Add import at top:
import { submitListen, submitNowPlaying } from '@/lib/music/listenbrainz';

// After the Last.fm scrobble block (line ~53), add:
    // ListenBrainz (fire-and-forget, don't block on Last.fm failure)
    if (settings?.listenbrainz_token) {
      try {
        if (action === 'scrobble') {
          await submitListen({
            artist, track, album,
            timestamp: Math.floor(Date.now() / 1000),
            userToken: settings.listenbrainz_token,
          });
        } else {
          await submitNowPlaying({
            artist, track, album,
            userToken: settings.listenbrainz_token,
          });
        }
      } catch (lbError) {
        console.error('[scrobble] ListenBrainz error:', lbError);
      }
    }
```

Also update the Supabase select to include `listenbrainz_token`:
```typescript
    const { data: settings } = await supabase
      .from('user_settings')
      .select('lastfm_session_key, listenbrainz_token')
      .eq('fid', session.fid)
      .single();
```

And update the early return — allow scrobble if EITHER service is connected:
```typescript
    if (!settings?.lastfm_session_key && !settings?.listenbrainz_token) {
      return NextResponse.json({ error: 'No scrobbling service connected' }, { status: 400 });
    }
```

- [ ] **Step 3: Add ListenBrainz token save route**

```typescript
// src/app/api/auth/listenbrainz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const TokenSchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Verify the token works by calling ListenBrainz validate-token
    const verifyRes = await fetch('https://api.listenbrainz.org/1/validate-token', {
      headers: { Authorization: `Token ${parsed.data.token}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.valid) {
      return NextResponse.json({ error: 'Invalid ListenBrainz token' }, { status: 400 });
    }

    await supabaseAdmin
      .from('user_settings')
      .upsert(
        { fid: session.fid, listenbrainz_token: parsed.data.token },
        { onConflict: 'fid' }
      );

    return NextResponse.json({ success: true, username: verifyData.user_name });
  } catch (error) {
    console.error('[listenbrainz] Error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabaseAdmin
      .from('user_settings')
      .update({ listenbrainz_token: null })
      .eq('fid', session.fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[listenbrainz/disconnect] Error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/music/listenbrainz.ts src/app/api/music/scrobble/route.ts src/app/api/auth/listenbrainz/route.ts
git commit -m "feat: add ListenBrainz scrobbling support"
```

---

## Task 5: Bluesky Client Library

**Files:**
- Create: `src/lib/publish/bluesky.ts`

- [ ] **Step 1: Install @atproto/api**

Run: `npm install @atproto/api`

- [ ] **Step 2: Create Bluesky client**

```typescript
// src/lib/publish/bluesky.ts
import { AtpAgent, RichText } from '@atproto/api';
import type { NormalizedContent } from './normalize';

let agentCache: AtpAgent | null = null;

export function isBlueskyConfigured(): boolean {
  return !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD);
}

async function getAgent(): Promise<AtpAgent> {
  if (agentCache) return agentCache;

  const agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({
    identifier: process.env.BLUESKY_HANDLE!,
    password: process.env.BLUESKY_APP_PASSWORD!,
  });

  agentCache = agent;
  return agent;
}

export interface BlueskyPublishResult {
  uri: string;
  cid: string;
  postUrl: string;
}

export async function publishToBluesky(content: NormalizedContent): Promise<BlueskyPublishResult> {
  const agent = await getAgent();

  // Build rich text with auto-detected facets (mentions, links)
  const rt = new RichText({ text: content.text });
  await rt.detectFacets(agent);

  // Upload images (max 4)
  const images: { alt: string; image: { $type: string; ref: { $link: string }; mimeType: string; size: number }; aspectRatio?: { width: number; height: number } }[] = [];
  for (const imageUrl of content.images.slice(0, 4)) {
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) continue;
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const { data } = await agent.uploadBlob(new Uint8Array(buffer), { encoding: contentType });
      images.push({ alt: '', image: data.blob });
    } catch (err) {
      console.error('[bluesky] Image upload failed:', err);
    }
  }

  // Build embed
  let embed: Record<string, unknown> | undefined;
  if (images.length > 0) {
    embed = {
      $type: 'app.bsky.embed.images',
      images,
    };
  } else if (content.embeds.length > 0) {
    embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: content.embeds[0],
        title: '',
        description: '',
      },
    };
  }

  const result = await agent.post({
    text: rt.text,
    facets: rt.facets,
    embed,
    createdAt: new Date().toISOString(),
  });

  // Extract handle for URL
  const handle = process.env.BLUESKY_HANDLE!;
  const rkey = result.uri.split('/').pop();

  return {
    uri: result.uri,
    cid: result.cid,
    postUrl: `https://bsky.app/profile/${handle}/post/${rkey}`,
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/publish/bluesky.ts package.json package-lock.json
git commit -m "feat: add Bluesky client library (@atproto/api)"
```

---

## Task 6: Bluesky Publish Route

**Files:**
- Create: `src/app/api/publish/bluesky/route.ts`

- [ ] **Step 1: Create the publish route (follows X pattern exactly)**

```typescript
// src/app/api/publish/bluesky/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForBluesky } from '@/lib/publish/normalize';
import { publishToBluesky, isBlueskyConfigured } from '@/lib/publish/bluesky';

const publishBlueskySchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1).max(1024),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!isBlueskyConfigured()) {
      return NextResponse.json({ error: 'Bluesky not configured' }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = publishBlueskySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

    const normalized = normalizeForBluesky({ text, castHash, embedUrls, imageUrls, channel });

    const result = await publishToBluesky(normalized);

    await supabaseAdmin
      .from('publish_log')
      .insert({
        platform: 'bluesky',
        cast_hash: castHash,
        platform_post_id: result.uri,
        platform_url: result.postUrl,
        published_by_fid: session.fid,
        text: normalized.text,
        status: 'published',
      });

    return NextResponse.json({ success: true, platformUrl: result.postUrl });
  } catch (err) {
    console.error('[publish/bluesky] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to publish to Bluesky';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/publish/bluesky/route.ts
git commit -m "feat: add Bluesky cross-posting route"
```

---

## Task 7: ZOUNZ Event Monitoring Cron

**Files:**
- Create: `src/app/api/cron/zounz-events/route.ts`

- [ ] **Step 1: Create the cron route**

This route polls the ZOUNZ Governor contract for new proposals and the Auction contract for settlement events. Follows the same auth pattern as `src/app/api/cron/follower-snapshot/route.ts`.

```typescript
// src/app/api/cron/zounz-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { ZOUNZ_GOVERNOR, ZOUNZ_AUCTION } from '@/lib/zounz/contracts';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Minimal ABIs for the reads we need
const governorAbi = [
  {
    name: 'proposalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const auctionAbi = [
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'highestBid', type: 'uint256' },
      { name: 'highestBidder', type: 'address' },
      { name: 'startTime', type: 'uint40' },
      { name: 'endTime', type: 'uint40' },
      { name: 'settled', type: 'bool' },
    ],
  },
] as const;

export async function GET(request: NextRequest) {
  try {
    // Auth: CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const events: string[] = [];

    // --- Check for new proposals ---
    const proposalCount = await client.readContract({
      address: ZOUNZ_GOVERNOR as `0x${string}`,
      abi: governorAbi,
      functionName: 'proposalCount',
    });

    // Get last known count from DB
    const { data: lastState } = await supabaseAdmin
      .from('system_state')
      .select('value')
      .eq('key', 'zounz_proposal_count')
      .single();

    const lastCount = lastState?.value ? Number(lastState.value) : 0;
    const currentCount = Number(proposalCount);

    if (currentCount > lastCount) {
      const newCount = currentCount - lastCount;
      events.push(`${newCount} new proposal(s)`);

      // Get all member FIDs for notifications
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('fid')
        .not('fid', 'is', null)
        .eq('is_active', true);

      const fids = (members || []).map(m => m.fid).filter(Boolean) as number[];

      await createInAppNotification({
        recipientFids: fids,
        type: 'proposal',
        title: 'New ZOUNZ Proposal',
        body: `${newCount} new proposal${newCount > 1 ? 's' : ''} submitted to ZOUNZ Governor`,
        href: '/governance',
      });

      // Update stored count
      await supabaseAdmin
        .from('system_state')
        .upsert({ key: 'zounz_proposal_count', value: String(currentCount) }, { onConflict: 'key' });
    }

    // --- Check auction state ---
    const auction = await client.readContract({
      address: ZOUNZ_AUCTION as `0x${string}`,
      abi: auctionAbi,
      functionName: 'auction',
    });

    const [tokenId, highestBid, , , endTime, settled] = auction;
    const endTimeMs = Number(endTime) * 1000;
    const now = Date.now();
    const minutesLeft = Math.floor((endTimeMs - now) / 60000);

    // Notify if auction ending in < 30 minutes
    if (!settled && minutesLeft > 0 && minutesLeft <= 30) {
      const { data: lastAlert } = await supabaseAdmin
        .from('system_state')
        .select('value')
        .eq('key', `zounz_auction_alert_${tokenId}`)
        .single();

      if (!lastAlert) {
        events.push(`Auction #${tokenId} ending in ${minutesLeft}m`);

        const { data: members } = await supabaseAdmin
          .from('users')
          .select('fid')
          .not('fid', 'is', null)
          .eq('is_active', true);

        const fids = (members || []).map(m => m.fid).filter(Boolean) as number[];

        const bidEth = Number(highestBid) / 1e18;
        await createInAppNotification({
          recipientFids: fids,
          type: 'system',
          title: `ZOUNZ #${tokenId} Auction Ending Soon`,
          body: `${minutesLeft} minutes left — current bid: ${bidEth.toFixed(4)} ETH`,
          href: '/governance',
        });

        await supabaseAdmin
          .from('system_state')
          .upsert({ key: `zounz_auction_alert_${tokenId}`, value: 'sent' }, { onConflict: 'key' });
      }
    }

    return NextResponse.json({
      success: true,
      proposalCount: currentCount,
      auctionTokenId: Number(tokenId),
      auctionSettled: settled,
      events,
    });
  } catch (error) {
    console.error('[cron/zounz-events] Error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create system_state table if not exists**

Check if `system_state` table exists. If not, run this SQL in Supabase:

```sql
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON system_state FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 3: Add Vercel cron config**

Add to `vercel.json` (or create if it doesn't exist):

```json
{
  "crons": [
    {
      "path": "/api/cron/zounz-events",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/zounz-events/route.ts
git commit -m "feat: add ZOUNZ proposal + auction event monitoring cron"
```

---

## Task 8: ListenBrainz UI in Settings

**Files:**
- Modify: `src/app/(auth)/settings/SettingsClient.tsx`

- [ ] **Step 1: Add ListenBrainz section to settings**

Add alongside the Last.fm section — ListenBrainz uses a user token (not OAuth), so it's a simple input field:

```tsx
function ListenBrainzConnect() {
  const [token, setToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/listenbrainz/status').then(r => r.json()).then(data => {
      if (data.connected) setConnected(true);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/listenbrainz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConnected(true);
      setToken('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/listenbrainz', { method: 'DELETE' });
    setConnected(false);
  };

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">ListenBrainz</p>
          <p className="text-xs text-gray-500">Open-source scrobbling — get your token from listenbrainz.org/profile</p>
        </div>
        {connected && (
          <button
            onClick={handleDisconnect}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
      {connected ? (
        <p className="text-[10px] text-green-400 mt-2">Connected — your plays are being scrobbled</p>
      ) : (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your ListenBrainz user token"
            className="flex-1 bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            onClick={handleSave}
            disabled={!token || saving}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add ListenBrainz status route**

```typescript
// src/app/api/auth/listenbrainz/status/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
      .from('user_settings')
      .select('listenbrainz_token')
      .eq('fid', session.fid)
      .single();

    return NextResponse.json({ connected: !!data?.listenbrainz_token });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/settings/SettingsClient.tsx src/app/api/auth/listenbrainz/status/route.ts
git commit -m "feat: add ListenBrainz token UI in settings"
```

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | Last.fm OAuth callback | 1 new route | 5 min |
| 2 | Last.fm disconnect | 1 new route | 3 min |
| 3 | Last.fm settings UI | 1 new route + 1 edit | 10 min |
| 4 | ListenBrainz scrobbling | 2 new files + 1 edit | 15 min |
| 5 | Bluesky client | 1 new file + npm install | 10 min |
| 6 | Bluesky publish route | 1 new route | 5 min |
| 7 | ZOUNZ event cron | 1 new route + SQL + vercel.json | 15 min |
| 8 | ListenBrainz settings UI | 1 edit + 1 new route | 10 min |

**Total: ~8 new files, 3 edits, ~1.5 hours**
