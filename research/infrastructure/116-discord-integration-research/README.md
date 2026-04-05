# Doc 116 — Discord Integration Research for ZAO OS

**Date:** 2026-03-22
**Status:** Research complete
**Goal:** Connect ZAO OS (Next.js on Vercel) with the Discord bot and Discord API

---

## 1. Discord REST API from Server-Side (No Bot Process Needed)

### The Package: `@discordjs/rest`

The official Discord.js team maintains a standalone REST package that works without the Gateway (no WebSocket bot process needed). This is exactly what ZAO OS needs.

```bash
npm install @discordjs/rest discord-api-types
```

- **Package:** `@discordjs/rest`
- **Docs:** https://discord.js.org/docs/packages/rest/stable
- **Requires:** Node.js 22.12.0+
- **Key feature:** Built-in rate limit handling (automatic retry on 429)
- **Companion:** `discord-api-types` provides typed route helpers and API types

### Basic Usage in a Next.js API Route

```typescript
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

// Create once, reuse across requests (module-level singleton)
const discord = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

// GET channel messages
const messages = await discord.get(Routes.channelMessages('CHANNEL_ID'), {
  query: new URLSearchParams({ limit: '50' }),
});

// GET guild members
const members = await discord.get(Routes.guildMembers('GUILD_ID'), {
  query: new URLSearchParams({ limit: '100' }),
});
```

### Edge Runtime Compatibility

For edge/serverless environments where native Node.js fetch may not be available:

```typescript
const discord = new REST({ version: '10', makeRequest: fetch }).setToken(TOKEN);
```

This makes it compatible with Vercel serverless functions. Standard Node.js runtime (not Edge) is recommended since `@discordjs/rest` uses Node.js APIs internally.

### What You Can READ with a Bot Token

With a bot token + appropriate permissions, you can read:
- **Channel messages** — `GET /channels/{id}/messages`
- **Channel info** — `GET /channels/{id}`
- **Guild members** — `GET /guilds/{id}/members` (requires GUILD_MEMBERS intent)
- **Guild channels** — `GET /guilds/{id}/channels`
- **Threads** — `GET /channels/{id}/threads/archived/public`
- **Thread members** — `GET /channels/{id}/thread-members`
- **User info** — `GET /users/{id}`
- **Pins** — `GET /channels/{id}/pins`

---

## 2. Specific Discord Endpoints ZAO Needs

### Read #introductions Posts

```typescript
// GET /channels/{channel_id}/messages
const introMessages = await discord.get(
  Routes.channelMessages(INTROS_CHANNEL_ID),
  { query: new URLSearchParams({ limit: '100' }) }
);
```

- Returns up to 100 messages per request
- Use `before` or `after` params for pagination
- Bot needs: `VIEW_CHANNEL` + `READ_MESSAGE_HISTORY` permissions in that channel

### Read Member List

```typescript
// GET /guilds/{guild_id}/members
const members = await discord.get(
  Routes.guildMembers(GUILD_ID),
  { query: new URLSearchParams({ limit: '1000' }) }
);
```

- Returns up to 1000 members per request
- Use `after` param (user ID) for pagination through large guilds
- **Requires:** GUILD_MEMBERS privileged intent (enable in Discord Developer Portal > Bot > Privileged Gateway Intents)

### Read Fractal Session Threads

```typescript
// GET /channels/{channel_id}/threads/archived/public
const archivedThreads = await discord.get(
  Routes.channelThreads(FRACTALS_CHANNEL_ID, 'archived', 'public')
);

// For active threads in a guild:
// GET /guilds/{guild_id}/threads/active
const activeThreads = await discord.get(
  Routes.guildActiveThreads(GUILD_ID)
);
```

### Get OAuth-Linked User Info

```typescript
// After OAuth2 flow, using the user's Bearer token (not bot token)
const userRest = new REST({ version: '10', authPrefix: 'Bearer' }).setToken(userAccessToken);
const user = await userRest.get(Routes.user());
// Returns: { id, username, discriminator, avatar, ... }
```

### Required Bot Permissions

| Permission | Bit | Hex | Purpose |
|---|---|---|---|
| VIEW_CHANNEL | 10 | `0x400` | See channels |
| READ_MESSAGE_HISTORY | 16 | `0x10000` | Read messages in channels |
| (Privileged Intent) | — | — | GUILD_MEMBERS intent for member list |

**Combined permission integer:** `0x10400` = `66560`

Bot invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=66560&scope=bot
```

---

## 3. Rate Limits

### Global Limit
- **50 requests per second** across all endpoints (per bot token)

### Per-Route Limits
- Discord does not publish fixed per-route numbers; they vary and can change
- The `@discordjs/rest` package handles rate limits automatically (queues requests, respects `retry_after`)
- Rate limit headers on every response:
  - `X-RateLimit-Limit` — max requests for this route
  - `X-RateLimit-Remaining` — requests left in current window
  - `X-RateLimit-Reset` — Unix timestamp when limit resets
  - `X-RateLimit-Reset-After` — seconds until reset
  - `X-RateLimit-Bucket` — unique bucket identifier
  - `X-RateLimit-Scope` — `user`, `global`, or `shared`
- On 429: response includes `retry_after` (seconds) and `global` (boolean)

### Practical Guidance for ZAO OS
- Reading messages from a few channels periodically (every 5-10 min) will be well within limits
- `@discordjs/rest` queues and retries automatically; no manual rate limit code needed
- Cache results in Supabase to avoid repeat fetches

---

## 4. Discord OAuth2 for User Linking

### Flow: Link Discord Account to Existing ZAO OS User

Since ZAO OS uses Farcaster-first auth (iron-session), Discord OAuth is for **account linking**, not primary login.

#### Step 1: Authorization URL

```typescript
const DISCORD_AUTH_URL = 'https://discord.com/oauth2/authorize';
const params = new URLSearchParams({
  client_id: process.env.DISCORD_CLIENT_ID!,
  response_type: 'code',
  redirect_uri: 'https://zaoos.xyz/api/auth/discord/callback',
  scope: 'identify guilds.members.read',
  state: crypto.randomUUID(), // Store in iron-session to prevent CSRF
});
// Redirect user to: `${DISCORD_AUTH_URL}?${params}`
```

#### Step 2: Callback — Exchange Code for Token

```typescript
// POST https://discord.com/api/oauth2/token
const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: 'https://zaoos.xyz/api/auth/discord/callback',
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
  }),
});
const { access_token, refresh_token, expires_in } = await tokenRes.json();
```

#### Step 3: Fetch Discord User + Store Link

```typescript
// GET /users/@me with user's Bearer token
const userRes = await fetch('https://discord.com/api/v10/users/@me', {
  headers: { Authorization: `Bearer ${access_token}` },
});
const discordUser = await userRes.json();
// { id: '123456789', username: 'zaal', avatar: '...', ... }

// Store in Supabase: link discord_id -> fid/wallet
await supabaseAdmin.from('user_discord_links').upsert({
  fid: session.fid,
  discord_id: discordUser.id,
  discord_username: discordUser.username,
  access_token: encrypt(access_token),   // Encrypt before storing
  refresh_token: encrypt(refresh_token),
  expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
});
```

#### Scopes Needed

| Scope | Purpose |
|---|---|
| `identify` | Get Discord user ID, username, avatar via `/users/@me` |
| `guilds.members.read` | Check if user is in The ZAO Discord server via `/users/@me/guilds/{guild_id}/member` |

#### Matching Discord User to ZAO OS User

The link chain: **Discord ID <-> FID <-> Wallet Address**

- User logs into ZAO OS with Farcaster (has FID + wallet in session)
- User clicks "Link Discord" -> OAuth flow
- On callback, store `discord_id` alongside their `fid` in `user_discord_links`
- Bot's `wallets.json` maps Discord ID -> wallet, which can cross-reference

---

## 5. Webhook from Bot to ZAO OS

### Receiving Webhooks on Vercel

The existing Neynar webhook pattern at `/api/webhooks/neynar/route.ts` is the exact template. Create a parallel route:

```typescript
// src/app/api/webhooks/discord-bot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Bearer token
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token || token !== ENV.DISCORD_BOT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Alternatively: HMAC signature verification (more secure)
  // const sig = req.headers.get('X-Bot-Signature') ?? '';
  // const expected = crypto.createHmac('sha256', ENV.DISCORD_BOT_WEBHOOK_SECRET)
  //   .update(rawBody).digest('hex');
  // if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  // }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = payload.type as string;

  try {
    switch (eventType) {
      case 'fractal.session_started':
        await handleSessionStarted(payload);
        break;
      case 'fractal.session_completed':
        await handleSessionCompleted(payload);
        break;
      case 'fractal.scores_submitted':
        await handleScoresSubmitted(payload);
        break;
      case 'intro.new':
        await handleNewIntro(payload);
        break;
      case 'proposal.created':
        await handleNewProposal(payload);
        break;
      default:
        console.log(`[discord-bot-webhook] Unknown event type: ${eventType}`);
    }
  } catch (err) {
    console.error('[discord-bot-webhook] Processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

### Webhook Authentication Options

1. **Bearer Token (simple):** Bot sends `Authorization: Bearer <shared-secret>`. Compare against env var. This is what the bot already does.
2. **HMAC Signature (better):** Bot signs the payload body with a shared secret, sends signature in a header. Verify with `crypto.timingSafeEqual`. Follows the same pattern as the Neynar webhook.
3. **IP Allowlist:** Not practical since bot may run on varying IPs.

Recommendation: Use HMAC signature verification. Add to the Python bot:
```python
import hmac, hashlib
signature = hmac.new(WEBHOOK_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
headers = {'X-Bot-Signature': signature, 'Content-Type': 'application/json'}
```

### Storing Real-Time Session State

**Supabase is the right choice** (not in-memory, which resets between serverless invocations):

```sql
-- Fractal session live state
CREATE TABLE fractal_live_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_thread_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'waiting',  -- waiting, active, scoring, completed
  host_discord_id text,
  host_name text,
  participants jsonb DEFAULT '[]',
  started_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE fractal_live_sessions;
```

### Supabase Realtime to Push Updates to /fractals Page

Yes, this works well with the existing Supabase setup:

```typescript
// Client-side hook: useFractalLive.ts
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useFractalLive() {
  const [liveSession, setLiveSession] = useState(null);

  useEffect(() => {
    const channel = supabase
      .channel('fractal-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fractal_live_sessions',
        },
        (payload) => {
          setLiveSession(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return liveSession;
}
```

Flow: Bot webhook -> ZAO OS API route -> Supabase upsert -> Supabase Realtime -> Client auto-updates

---

## 6. Syncing Bot Data to Supabase

### The Bot's Data Files

| File | Content | Sync Strategy |
|---|---|---|
| `wallets.json` | Discord ID -> wallet address | Webhook push on change |
| `history.json` | Fractal session history | Webhook push on session complete |
| `intros.json` | #introductions messages | Webhook push on new intro |
| `proposals.json` | Governance proposals | Webhook push on new proposal |

### Option A: Webhook Push (Recommended)

Bot sends data to ZAO OS API endpoints on each change. Best for real-time updates.

```
Bot detects change -> POST https://zaoos.xyz/api/webhooks/discord-bot
                      (with HMAC signature + JSON payload)
                   -> ZAO OS validates + writes to Supabase
```

**Pros:** Real-time, bot controls when data syncs, ZAO OS validates input
**Cons:** Requires bot code changes to send webhooks

### Option B: Bot Writes Directly to Supabase (Also Good)

Add `supabase-py` to the Python bot:

```bash
pip install supabase
```

```python
from supabase import create_client

supabase = create_client(
    "https://your-project.supabase.co",
    "your-service-role-key"  # Or a dedicated bot role key
)

# Write fractal session
supabase.table("fractal_sessions").upsert({
    "session_date": "2026-03-22",
    "name": "Fractal #47",
    "host_name": "Zaal",
    "participant_count": 6,
    "scores": scores_dict,
}).execute()
```

**Pros:** Simple, direct, no middleware
**Cons:** Bot needs Supabase credentials, harder to validate/transform data, tighter coupling

### Option C: ZAO OS API Endpoint for Bot Sync

Create dedicated sync endpoints the bot calls:

```
POST /api/discord/sync/wallets    — bot pushes wallets.json
POST /api/discord/sync/sessions   — bot pushes session data
POST /api/discord/sync/intros     — bot pushes intro messages
POST /api/discord/sync/proposals  — bot pushes proposals
```

Each endpoint validates with Zod, authenticates with Bearer token, writes to Supabase.

**Pros:** Clean separation, ZAO OS owns the schema, input validation
**Cons:** More endpoints to maintain

### Recommendation: Hybrid (Option A + B)

- **Real-time events** (session started, scores submitted): Webhook push (Option A) -> Supabase -> Realtime to client
- **Bulk data** (wallets, full history): Bot writes directly to Supabase (Option B) on a schedule or startup
- **Initial migration:** One-time script to import existing JSON files into Supabase tables

---

## 7. Bot Token Security

### Environment Variables for Vercel

Add to Vercel project settings (Settings > Environment Variables):

```
DISCORD_BOT_TOKEN=MTk4NjIy...          # Bot token for REST API calls
DISCORD_CLIENT_ID=123456789012345       # OAuth2 application client ID
DISCORD_CLIENT_SECRET=abcdef...         # OAuth2 client secret
DISCORD_BOT_WEBHOOK_SECRET=random...    # Shared secret for webhook verification
DISCORD_GUILD_ID=123456789012345        # The ZAO Discord server ID
```

### Security Rules

- **NEVER** prefix with `NEXT_PUBLIC_` — these must stay server-only
- Only use in files under `src/app/api/` or `src/lib/` (server-side)
- Add to `src/lib/env.ts`:

```typescript
// Discord (optional — only needed when Discord features are enabled)
DISCORD_BOT_TOKEN: optionalEnv('DISCORD_BOT_TOKEN'),
DISCORD_CLIENT_ID: optionalEnv('DISCORD_CLIENT_ID'),
DISCORD_CLIENT_SECRET: optionalEnv('DISCORD_CLIENT_SECRET'),
DISCORD_BOT_WEBHOOK_SECRET: optionalEnv('DISCORD_BOT_WEBHOOK_SECRET'),
DISCORD_GUILD_ID: optionalEnv('DISCORD_GUILD_ID'),
```

---

## 8. `@discordjs/rest` Package Details

| Property | Value |
|---|---|
| Package | `@discordjs/rest` |
| Companion types | `discord-api-types` |
| Min Node.js | 22.12.0 |
| Rate limit handling | Built-in (automatic queue + retry) |
| Serverless compatible | Yes (use `makeRequest: fetch` for edge) |
| Gateway required | No |
| Auth method | Bot token or OAuth2 Bearer |

### Vercel Runtime Notes

- Use **Node.js runtime** (not Edge) for best compatibility — set in route config:
  ```typescript
  export const runtime = 'nodejs';
  ```
- The package works in standard Vercel serverless functions out of the box
- Module-level `REST` instance is reused across warm invocations (Vercel keeps lambda warm)

---

## 9. Implementation Plan

### Phase 1: Webhook Receiver (Immediate)

1. Add env vars to Vercel: `DISCORD_BOT_WEBHOOK_SECRET`
2. Create `/api/webhooks/discord-bot/route.ts` (follow Neynar webhook pattern)
3. Create Supabase tables: `fractal_live_sessions`, `discord_intros`, `user_discord_links`
4. Enable Supabase Realtime on `fractal_live_sessions`
5. Add rate limit config in `middleware.ts` for `/api/webhooks/discord-bot`

### Phase 2: REST API Reader

1. `npm install @discordjs/rest discord-api-types`
2. Create `src/lib/discord/client.ts` — singleton REST client
3. Create `/api/discord/messages/route.ts` — cached channel message reader
4. Create `/api/discord/members/route.ts` — guild member list
5. Cache Discord data in Supabase (avoid repeated API calls)

### Phase 3: OAuth2 Linking

1. Add `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` to Vercel
2. Register redirect URI in Discord Developer Portal
3. Create `/api/auth/discord/route.ts` — initiates OAuth flow
4. Create `/api/auth/discord/callback/route.ts` — handles callback, links accounts
5. Create `user_discord_links` table in Supabase

### Phase 4: Bot Direct Supabase Write

1. Add `supabase-py` to the Python bot
2. Give bot a dedicated Supabase service role (or use the existing one)
3. Bot writes sessions/scores directly on completion
4. ZAO OS reads from Supabase (already does this for `/fractals`)

---

## 10. File Structure

```
src/
├── lib/
│   └── discord/
│       ├── client.ts          # REST client singleton
│       ├── types.ts           # Discord-specific types
│       └── cache.ts           # Supabase caching layer
├── app/
│   └── api/
│       ├── webhooks/
│       │   └── discord-bot/
│       │       └── route.ts   # Receive bot webhooks
│       ├── discord/
│       │   ├── messages/
│       │   │   └── route.ts   # Read channel messages
│       │   └── members/
│       │       └── route.ts   # Read guild members
│       └── auth/
│           └── discord/
│               ├── route.ts           # Initiate OAuth
│               └── callback/
│                   └── route.ts       # OAuth callback
└── hooks/
    └── useFractalLive.ts      # Supabase Realtime subscription
```

---

## Sources

- [@discordjs/rest docs](https://discord.js.org/docs/packages/rest/stable)
- [Discord API Reference](https://docs.discord.com/developers/reference)
- [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2)
- [Discord Rate Limits](https://docs.discord.com/developers/topics/rate-limits)
- [Discord Permissions](https://docs.discord.com/developers/topics/permissions)
- [NextBot — Next.js Discord Bot Template](https://github.com/jzxhuang/nextjs-discord-bot)
- [Vercel's Next.js Discord Bot](https://github.com/vercel/nextjs-discord-bot)
- [Deploying Discord Bot as Vercel Serverless Function](https://ianmitchell.dev/blog/deploying-a-discord-bot-as-a-vercel-serverless-function)
- [supabase-py GitHub](https://github.com/supabase/supabase-py)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Building a Discord Bot with Supabase](https://supabase.com/docs/guides/functions/examples/discord-bot)
- [Next.js Discord OAuth Guide](https://github.com/alii/nextjs-discord-oauth)
