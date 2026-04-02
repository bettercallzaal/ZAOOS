# 240 -- Stream.io Video SDK Dashboard Configuration

**Date:** 2026-03-31
**Status:** Complete
**Category:** Infrastructure / SDK Reference

---

## 1. Call Types

Stream provides **4 built-in call types** plus the ability to create custom types via the dashboard or API.

| Call Type | Video | Backstage | Ring | Use Case |
|-----------|-------|-----------|------|----------|
| `default` | Enabled | Disabled | Enabled | 1-1 and group video calls |
| `audio_room` | Disabled | Enabled | Disabled | Clubhouse-style audio rooms |
| `livestream` | Enabled | Enabled | Disabled | One-to-many broadcasting |
| `development` | Enabled | Disabled | Disabled | Testing (all permissions open) |

**Custom call types** can be created in the dashboard at **Video & Audio > Call Types** or via API:

```typescript
await client.video.createCallType({
  name: 'zao_listening_room',
  settings: { /* see section 4 */ },
  grants: { /* see section 3 */ },
});
```

Settings can be configured at **three levels** (each overrides the previous):
1. Call type level (dashboard or API)
2. Call instance level (API only, at creation time)
3. Runtime (some settings via SDK methods like `goLive()`)

---

## 2. Full Capabilities / Permissions List (OwnCapability Enum)

Extracted from `GetStream/stream-video-js` source (`packages/client/src/gen/coordinator/index.ts`):

| Capability Constant | String Value | Description |
|---------------------|-------------|-------------|
| `BLOCK_USERS` | `block-users` | Block a user from the call |
| `CHANGE_MAX_DURATION` | `change-max-duration` | Modify call duration limit |
| `CREATE_CALL` | `create-call` | Create new calls |
| `CREATE_REACTION` | `create-reaction` | Send emoji reactions |
| `ENABLE_NOISE_CANCELLATION` | `enable-noise-cancellation` | Toggle Krisp noise cancellation |
| `END_CALL` | `end-call` | End call for all participants |
| `JOIN_BACKSTAGE` | `join-backstage` | Join before call goes live |
| `JOIN_CALL` | `join-call` | Join an active call |
| `JOIN_ENDED_CALL` | `join-ended-call` | Join a call that has ended |
| `KICK_USER` | `kick-user` | Remove user from call |
| `MUTE_USERS` | `mute-users` | Mute other participants |
| `PIN_FOR_EVERYONE` | `pin-for-everyone` | Pin a participant for all viewers |
| `READ_CALL` | `read-call` | View call metadata |
| `REMOVE_CALL_MEMBER` | `remove-call-member` | Remove a member from the call |
| `SCREENSHARE` | `screenshare` | Share screen |
| `SEND_AUDIO` | `send-audio` | Publish audio track |
| `SEND_CLOSED_CAPTIONS_CALL` | `send-closed-captions-call` | Send closed captions |
| `SEND_VIDEO` | `send-video` | Publish video track |
| `START_BROADCAST_CALL` | `start-broadcast-call` | Start RTMP/HLS broadcast |
| `START_CLOSED_CAPTIONS_CALL` | `start-closed-captions-call` | Enable closed captions |
| `START_FRAME_RECORD_CALL` | `start-frame-record-call` | Start frame recording |
| `START_INDIVIDUAL_RECORD_CALL` | `start-individual-record-call` | Start individual track recording |
| `START_RAW_RECORD_CALL` | `start-raw-record-call` | Start raw recording |
| `START_RECORD_CALL` | `start-record-call` | Start composite recording |
| `START_TRANSCRIPTION_CALL` | `start-transcription-call` | Start transcription |
| `STOP_BROADCAST_CALL` | `stop-broadcast-call` | Stop broadcast |
| `STOP_CLOSED_CAPTIONS_CALL` | `stop-closed-captions-call` | Stop closed captions |
| `STOP_FRAME_RECORD_CALL` | `stop-frame-record-call` | Stop frame recording |
| `STOP_INDIVIDUAL_RECORD_CALL` | `stop-individual-record-call` | Stop individual recording |
| `STOP_RAW_RECORD_CALL` | `stop-raw-record-call` | Stop raw recording |
| `STOP_RECORD_CALL` | `stop-record-call` | Stop composite recording |
| `STOP_TRANSCRIPTION_CALL` | `stop-transcription-call` | Stop transcription |
| `UPDATE_CALL` | `update-call` | Update call properties |
| `UPDATE_CALL_MEMBER` | `update-call-member` | Modify member properties |
| `UPDATE_CALL_PERMISSIONS` | `update-call-permissions` | Grant/revoke user permissions |
| `UPDATE_CALL_SETTINGS` | `update-call-settings` | Modify call settings at runtime |

Three permissions are **requestable by users** at runtime: `send-audio`, `send-video`, `screenshare` (when `access_request_enabled` is true on the call type).

---

## 3. Roles & Permission Grants

### 5 Built-in Roles

| Role | Typical Use |
|------|-------------|
| `user` | Default role for authenticated users |
| `moderator` | Can mute/kick/block users |
| `host` | Call creator, can go live, manage backstage |
| `admin` | Full permissions on all calls |
| `call-member` | Explicitly added member of a specific call |

### Custom Roles

Created in the dashboard at **Video & Audio > Roles & Permissions**. Must be created before use in grants.

### Grant Structure

Permissions are assigned per-role per-call-type:

```typescript
await client.video.createCallType({
  name: 'zao_listening_room',
  grants: {
    host: [
      'send-audio', 'send-video', 'mute-users', 'end-call',
      'start-record-call', 'stop-record-call', 'join-backstage',
      'update-call-permissions', 'start-broadcast-call', 'stop-broadcast-call',
      'screenshare', 'block-users', 'kick-user',
    ],
    user: [
      'join-call', 'read-call', 'create-reaction',
    ],
    listener: [ // custom role -- must create in dashboard first
      'join-call', 'read-call',
    ],
    admin: [
      // typically grant everything
    ],
  },
});
```

### Runtime Permission Management

```typescript
// Grant permissions to a specific user on this call
await call.updateUserPermissions({
  user_id: 'user-123',
  grant_permissions: [OwnCapability.SEND_AUDIO],
  revoke_permissions: [OwnCapability.SCREENSHARE],
});

// Mute a user (they can unmute themselves)
await call.muteUser('user-123', 'audio');
await call.muteAllUsers('audio');

// Block (permanent removal), kick (can rejoin)
await call.blockUser('user-123');
await call.kickUser({ user_id: 'user-123' });

// End call for everyone
await call.endCall();
```

**Dashboard path:** `dashboard.getstream.io` > Your App > **Video & Audio** > **Roles & Permissions** > select role + scope

---

## 4. Call Type Settings (Dashboard + API)

### Audio Settings

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `access_request_enabled` | boolean | varies | Allow users to request send-audio |
| `default_device` | `"speaker"` or `"earpiece"` | `"speaker"` | **Required** |
| `mic_default_on` | boolean | true | Mic state when joining |
| `speaker_default_on` | boolean | true | Speaker state when joining |
| `opus_dtx_enabled` | boolean | true | OPUS discontinuous transmission (saves bandwidth) |
| `redundant_coding_enabled` | boolean | true | Redundant audio coding for reliability |
| `hifi_audio_enabled` | boolean | false | High-fidelity audio (stereo, higher bitrate) |
| `noise_cancellation.mode` | `"available"` / `"disabled"` / `"auto-on"` | `"available"` | Krisp noise cancellation |

### Video Settings

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `enabled` | boolean | true | Enable/disable video entirely |
| `access_request_enabled` | boolean | varies | Allow users to request send-video |
| `camera_default_on` | boolean | true | Camera state when joining |
| `camera_facing` | `"front"` / `"back"` / `"external"` | `"front"` | Default camera |
| `target_resolution.width` | number | 1280 | Target video width |
| `target_resolution.height` | number | 720 | Target video height |
| `target_resolution.bitrate` | number | varies | Target bitrate |

### Screensharing Settings

| Setting | Type | Default |
|---------|------|---------|
| `enabled` | boolean | true |
| `access_request_enabled` | boolean | varies |
| `target_resolution` | object | `{ width, height, bitrate }` |

### Recording Settings

| Setting | Type | Options |
|---------|------|---------|
| `mode` | string | `"available"` / `"disabled"` / `"auto-on"` (**Required**) |
| `audio_only` | boolean | Record audio only |
| `quality` | string | `"360p"`, `"480p"`, `"720p"`, `"1080p"`, `"1440p"` + portrait variants |
| `layout.name` | string | `"spotlight"`, `"grid"`, `"single-participant"`, `"mobile"`, `"custom"` |

### Transcription Settings

| Setting | Type | Notes |
|---------|------|-------|
| `mode` | string | `"available"` / `"disabled"` / `"auto-on"` |
| `language` | string | Transcription language |
| `closed_caption_mode` | string | Closed caption behavior |
| `translation` | object | Translation options |

### Backstage Settings

| Setting | Type | Notes |
|---------|------|-------|
| `enabled` | boolean | When true, calls start in backstage mode |
| `join_ahead_time_seconds` | number | Seconds before start time regular users can join (default: 0) |

### Ring / Notification Settings

| Setting | Type | Notes |
|---------|------|-------|
| `auto_cancel_timeout_ms` | number | Auto-cancel unanswered outgoing call |
| `incoming_call_timeout_ms` | number | Timeout for incoming call ring |
| `missed_call_timeout_ms` | number | When to mark as missed |
| `inactivity_timeout_seconds` | number | Session inactivity timeout (5-900) |

### Geofencing

| Setting | Type | Notes |
|---------|------|-------|
| `names` | string[] | Region restrictions: EU, US, China, Russia, Iran, etc. |

### Broadcasting (HLS + RTMP)

| Setting | Type | Notes |
|---------|------|-------|
| `broadcasting.enabled` | boolean | Enable HLS/RTMP broadcasting |
| `broadcasting.rtmp.enabled` | boolean | Enable RTMP egress specifically |
| `broadcasting.rtmp.quality` | string | `"360p"` through `"1080p"` |
| `broadcasting.rtmp.layout.name` | string | `"spotlight"`, `"grid"`, `"single-participant"`, etc. |

### Push Notification Templates

Configured at the **call type level only** (not overrideable per call):
- `call_notification` -- APNS + FCM title/body templates
- `call_ring` -- ring push content
- `call_live_started` -- when call goes live
- `call_missed` -- missed call
- `session_started` -- session start

Templates use Handlebars syntax for dynamic content.

---

## 5. Recording, Transcription & RTMP Egress

### Recording

- **Dashboard:** Enable per call type at **Video & Audio > Call Types > [type] > Recording**
- **Modes:** `disabled` (off), `available` (manual start/stop), `auto-on` (starts automatically)
- **Layouts:** `spotlight` (active speaker large), `grid` (equal tiles), `single-participant`, `mobile`, `custom` (your own webapp as compositor)
- **Quality:** 360p through 1440p including portrait variants
- **Storage:** Configurable storage name for recording files

### Transcription

- **Modes:** Same as recording (`disabled`, `available`, `auto-on`)
- **Closed captions:** Can be started/stopped independently
- **Translation:** Configurable language and translation options
- **Storage:** Separate configurable storage for transcription files

### RTMP Egress (Multi-Destination Broadcasting)

Start broadcasting to external platforms (YouTube, Twitch, Facebook, etc.):

```typescript
await call.startRTMPBroadcasts({
  broadcasts: [
    {
      name: 'youtube_channel',
      stream_url: 'rtmps://x.rtmps.youtube.com/live2',
      stream_key: 'your_stream_key',
    },
    {
      name: 'twitch_channel',
      stream_url: 'rtmp://live.twitch.tv/app',
      stream_key: 'your_twitch_key',
    },
  ],
});

// Stop specific or all
await call.stopRTMPBroadcast('youtube_channel');
await call.stopAllRTMPBroadcasts();
```

**RTMP Ingress (OBS):** Get URL from `useCallIngress()` hook, use user token as stream key.

### goLive() Combined Start

```typescript
await call.goLive({
  start_hls: true,
  start_recording: true,
  start_transcription: true,
  start_closed_caption: true,
  recording_storage_name: 'my-s3-bucket',
  transcription_storage_name: 'my-s3-bucket',
});

// Stop live (keeps recording/transcription running if specified)
await call.stopLive({
  continue_hls: false,
  continue_recording: true,
  continue_transcription: true,
});
```

---

## 6. Noise Cancellation / Audio Processing

**Powered by:** Krisp.ai

### Dashboard Configuration

Set `noise_cancellation.mode` on the call type:
- `"disabled"` -- noise cancellation unavailable
- `"available"` -- users can toggle it on/off
- `"auto-on"` -- enabled by default when joining

### React Implementation

```bash
npm install @stream-io/audio-filters-web
```

```tsx
'use client';
import { NoiseCancellation } from '@stream-io/audio-filters-web';
import { NoiseCancellationProvider, useNoiseCancellation } from '@stream-io/video-react-sdk';

const nc = new NoiseCancellation();

// Wrap your call UI
<NoiseCancellationProvider noiseCancellation={nc}>
  <CallUI />
</NoiseCancellationProvider>

// Inside components:
const { isSupported, isReady, isEnabled, setEnabled, setSuppressionLevel } = useNoiseCancellation();

// Adjust suppression (0-100 scale)
nc.setSuppressionLevel(50); // lower for music content
```

### Platform Support

- Chrome, Firefox, Edge: supported
- Safari 17.4.1+: supported
- Mobile browsers: **not supported** (too CPU-intensive)
- **Next.js App Router:** requires `"use client"` directive
- **Next.js Pages Router:** use `next/dynamic` with `{ ssr: false }`

### Hi-Fi / Stereo Audio

Separate from noise cancellation. Enable `hifi_audio_enabled: true` on the call type for stereo, higher bitrate audio. **Important for music use cases** -- use hi-fi mode with lower noise cancellation suppression to preserve music quality.

---

## 7. Backstage Mode

### How It Works

1. Call is created in backstage mode (when `backstage.enabled: true` on call type)
2. Only users with `join-backstage` capability can access
3. Host calls `goLive()` to open to all users
4. Host calls `stopLive()` to return to backstage (viewers are removed)
5. Calls can transition between backstage and live **multiple times**

### Configuration

```typescript
// Call type level
await client.video.updateCallType('audio_room', {
  settings: {
    backstage: {
      enabled: true,
      join_ahead_time_seconds: 300, // 5 min early access for regular users
    },
  },
});
```

### Default Backstage Behavior by Call Type

| Call Type | Backstage Default |
|-----------|-------------------|
| `audio_room` | **Enabled** |
| `livestream` | **Enabled** |
| `default` | Disabled |
| `development` | Disabled |

---

## 8. Token Generation Best Practices

### User Tokens (JWT)

```typescript
// Server-side only -- NEVER generate tokens client-side
const token = client.generateUserToken({
  user_id: userId,
  validity_in_seconds: 24 * 60 * 60, // 1 day
});
```

### JWT Claims

| Claim | Required | Description |
|-------|----------|-------------|
| `user_id` | Yes (user tokens) | Maps to Stream user |
| `iat` | Yes | Issued-at timestamp (tokens without `iat` are invalid) |
| `exp` | No | Expiry (default: 1 hour if unset) |
| `role` | No | Override global role for this session |
| `call_cids` | No | Restrict to specific calls (e.g., `["default:call1"]`) |

### Call Tokens

Grant additional access to specific calls:

```typescript
const callToken = client.generateCallToken({
  user_id: 'user-123',
  call_cids: ['audio_room:listening-session-1'],
  role: 'host',
  validity_in_seconds: 3600,
});
```

**Important:** Call tokens are additive -- they grant additional access, they cannot restrict existing permissions.

### Token Provider Pattern (Recommended)

```typescript
// Client-side: pass a function that fetches fresh tokens
const client = new StreamVideoClient({
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  user: { id: userId },
  tokenProvider: async () => {
    const res = await fetch('/api/stream/token', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    const { token } = await res.json();
    return token;
  },
});
```

SDK handles automatic refresh when tokens expire.

### Anonymous & Guest Users

- **Anonymous:** No token needed, no WebSocket, can watch livestreams. Not counted toward MAU.
- **Guest:** Temporary account with name/image, no token needed. Counted toward MAU.

---

## 9. Webhook Configuration

### Setup

**Dashboard path:** `dashboard.getstream.io` > Your App > **Video & Audio** > **Webhooks & Events**

Three delivery methods:
1. **HTTP Webhooks** (simplest)
2. **AWS SNS**
3. **AWS SQS**

### Event Filtering

- **All events mode:** Receive everything (new event types auto-included)
- **Specific events mode:** Select which events to receive (new types must be manually added)
- Multiple endpoints supported simultaneously

### Complete Event List

**Call lifecycle:**
`call.created`, `call.updated`, `call.deleted`, `call.ended`

**Participants:**
`call.session_started`, `call.session_ended`, `call.session_participant_joined`, `call.session_participant_left`, `call.session_participant_count_updated`

**Ring/notification:**
`call.ring`, `call.accepted`, `call.rejected`, `call.missed`, `call.notification`

**Moderation:**
`call.blocked_user`, `call.unblocked_user`, `call.kicked_user`, `call.user_muted`, `call.permission_request`, `call.permissions_updated`, `call.member_updated_permission`, `call.moderation_blur`, `call.moderation_warning`

**Members:**
`call.member_added`, `call.member_removed`, `call.member_updated`

**Streaming:**
`call.live_started`, `call.hls_broadcasting_started`, `call.hls_broadcasting_stopped`, `call.hls_broadcasting_failed`, `call.rtmp_broadcast_started`, `call.rtmp_broadcast_stopped`, `call.rtmp_broadcast_failed`

**Recording:**
`call.recording_started`, `call.recording_stopped`, `call.recording_ready`, `call.recording_failed`, `call.frame_recording_started`, `call.frame_recording_stopped`, `call.frame_recording_ready`, `call.frame_recording_failed`

**Transcription:**
`call.transcription_started`, `call.transcription_stopped`, `call.transcription_ready`, `call.transcription_failed`, `call.closed_caption`, `call.closed_captions_started`, `call.closed_captions_stopped`, `call.closed_captions_failed`

**Other:**
`call.reaction_new`, `call.dtmf`, `call.stats_report_ready`, `call.user_feedback_submitted`, `ingress.started`, `ingress.stopped`, `ingress.error`, `custom`

### Security

Every webhook includes these headers:
- `X-WEBHOOK-ID` -- unique ID for deduplication
- `X-WEBHOOK-ATTEMPT` -- retry counter (starts at 1)
- `X-API-KEY` -- your app's API key
- `X-SIGNATURE` -- HMAC signature of request body (verify this!)

### Retry Policy

| Failure Type | Retries |
|-------------|---------|
| HTTP 408/429/5xx | 3 attempts |
| Network errors | 2 attempts |
| Timeouts | 3 attempts |

Individual timeout: 6 seconds. Total with retries: 15 seconds max.

---

## 10. Push Notifications

### Supported Platforms

- **iOS:** APNS (regular + VoIP)
- **Android:** FCM
- **Web:** Not natively supported for video calls (use webhooks + your own web push)

### Trigger Conditions

| Trigger | Push Type |
|---------|-----------|
| `ring: true` on call create | VoIP notification (ringing screen) |
| `notify: true` on call create | Regular push notification |
| Unanswered call | Missed call notification |

### Dashboard Configuration

**Path:** `dashboard.getstream.io` > Your App > **Push Notifications**

Upload credentials:
- **APNS:** Upload `.p8` auth key or `.p12` certificate
- **FCM:** Upload Firebase service account JSON

### Provider Names

Configure in your app's push config:
- iOS: `push_provider_name: "apn-video-production"`
- Android: `push_provider_name: "firebase-video-production"`

### Template Customization

Per call type, customize notification content using Handlebars templates for `title` and `body` fields across APNS and FCM.

---

## 11. Rate Limits & Quotas

### User Rate Limits

Every user: **60 requests/minute** per API endpoint per platform.

### App Rate Limits (Default)

| Endpoint | Per-Minute | Per-Second (burst) |
|----------|-----------|-------------------|
| SendEvent | 10,000 | 333 |
| VideoConnect | 10,000 | 333 |
| GetCall | 1,000 | 33 |
| StartRecording | 300 | 10 |
| DeleteCall | 60 | 2 |

Per-second limit = per-minute limit / 30 (allows burst traffic).

### Platform Independence

Rate limits are tracked **independently** across 4 platform categories:
1. **Server** (Node, Python, Ruby, Go, C#, PHP, Java)
2. **Android** (Kotlin, Java, Flutter, React Native)
3. **iOS** (Swift, Flutter, React Native)
4. **Web** (React, Angular, vanilla JS)

Hitting a limit on server-side does not affect mobile or web clients.

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Total allowed requests |
| `X-RateLimit-Remaining` | Requests left in window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

Exceeded: returns **HTTP 429**.

### Plan Increases

- **Standard:** Case-by-case after integration review
- **Enterprise:** Custom limits based on architectural review

---

## 12. Pricing Summary

### Free Tier

- **$100/month** in free credits (every account, no credit card)
- Equals ~**333,000 audio-only participant minutes**

### Pay-As-You-Go Rates (per 1,000 participant minutes)

| Quality | Cost |
|---------|------|
| Audio Only | $0.30 |
| SD (480p) | $0.75 |
| HD (720p) | $1.50 |
| Full HD (1080p) | $3.00 |
| 2K | $6.00 |
| 4K | $12.00 |

### Add-On Costs (per 1,000 call minutes)

| Feature | Cost |
|---------|------|
| Noise Cancellation | $0.30 |
| Recording (audio) | $1.50 |
| Transcriptions/Captions | $8.00 |
| RTMP In/Out | $15.00 each |

### Billing Notes

- **Participant minute** = time one user is connected to a call
- **Aggregated resolution:** When receiving multiple video streams, resolutions combine for pricing tier
- **Muted/camera-off users** billed at lower livestream viewer rates
- **Recording** billed by call minutes (not participant minutes)
- **Screensharing** adds to aggregated resolution, does not benefit from Dynascale

---

## 13. Dashboard vs Code Configuration

### Dashboard Only (or Dashboard First)

| What | Dashboard Path |
|------|---------------|
| Create/delete call types | Video & Audio > Call Types |
| Create custom roles | Video & Audio > Roles & Permissions |
| Upload push credentials (APNS/FCM) | Push Notifications |
| Set webhook/SQS/SNS endpoints | Video & Audio > Webhooks & Events |
| Select webhook event filters | Video & Audio > Webhooks & Events |
| View API key & secret | App Settings |
| View rate limit usage | Analytics |

### Dashboard or API (Both Work)

| What | Dashboard Path | API Method |
|------|---------------|------------|
| Call type settings (audio/video/recording) | Video & Audio > Call Types > [type] | `createCallType()` / `updateCallType()` |
| Role permission grants | Video & Audio > Roles & Permissions | `grants` in call type config |
| Enable/disable backstage | Call Types > [type] > Backstage | `settings.backstage.enabled` |
| Noise cancellation mode | Call Types > [type] > Audio | `settings.audio.noise_cancellation.mode` |
| Recording mode/quality | Call Types > [type] > Recording | `settings.recording.mode` |
| Push notification templates | Call Types > [type] > Notifications | `notification_settings` in call type |

### Code Only (API/SDK)

| What | Method |
|------|--------|
| Override settings per call instance | `call.update({ settings_override: {...} })` |
| Grant/revoke user permissions at runtime | `call.updateUserPermissions()` |
| Go live / stop live | `call.goLive()` / `call.stopLive()` |
| Start/stop recording/transcription | `call.startRecording()` / `call.stopRecording()` |
| Start/stop RTMP broadcasts | `call.startRTMPBroadcasts()` |
| Mute/block/kick users | `call.muteUser()` / `call.blockUser()` / `call.kickUser()` |
| Generate tokens | `client.generateUserToken()` / `client.generateCallToken()` |

---

## 14. Next.js Reference Projects (GetStream GitHub)

**Main repo:** `github.com/GetStream/stream-video-js`

Sample apps in `sample-apps/react/`:
- `audio-rooms` -- Clubhouse-style audio room (closest to ZAO listening rooms)
- `livestream-app` -- One-to-many broadcasting
- `zoom-clone` -- Full video conferencing
- `messenger-clone` -- WhatsApp-style with video calling
- `react-dogfood` -- Stream's internal testing app (most complete)
- `react-video-demo` -- Basic video demo
- `cookbook-participant-list` -- Participant list patterns
- `egress-composite` -- Custom recording layouts

**Standalone Next.js projects:**
- `GetStream/fullstack-nextjs-whatsapp-clone` -- Next.js + Stream Chat + Video + Vercel
- Blog tutorial: "Building a Conferencing App with Next.js" at `getstream.io/blog/video-conferencing-nextjs/`

### Key Packages

```bash
npm install @stream-io/video-react-sdk
npm install @stream-io/audio-filters-web  # noise cancellation
```

---

## 15. ZAO-Specific Recommendations

For ZAO listening rooms and audio spaces:

1. **Create custom call type** `zao_listening_room` based on `audio_room` defaults
2. **Custom roles:** `dj` (send-audio, screenshare, start-broadcast), `listener` (join-call, read-call, create-reaction), `moderator` (mute-users, kick-user, block-users)
3. **Enable backstage** with `join_ahead_time_seconds: 300` for DJ setup
4. **Hi-fi audio** enabled, noise cancellation set to `"available"` (not auto-on, to preserve music)
5. **Recording** set to `"available"` (hosts start manually)
6. **RTMP egress** enabled for simulcasting to YouTube/Twitch
7. **Token generation** via `/api/stream/token` route with iron-session auth check
8. **Webhooks** for `call.session_participant_joined`, `call.session_participant_left`, `call.recording_ready` to update Supabase

---

## Sources

- [Call Types - React Video Docs](https://getstream.io/video/docs/react/guides/configuring-call-types/)
- [Permissions - Platform API Docs](https://getstream.io/video/docs/api/call_types/permissions/)
- [Settings - Platform API Docs](https://getstream.io/video/docs/api/call_types/settings/)
- [Permissions & Moderation - React Docs](https://getstream.io/video/docs/react/guides/permissions-and-moderation/)
- [Backstage - Platform API Docs](https://getstream.io/video/docs/api/streaming/backstage/)
- [RTMP Broadcasts - Platform API Docs](https://getstream.io/video/docs/api/streaming/rtmp_broadcasts/)
- [Webhooks Overview - Platform API Docs](https://getstream.io/video/docs/api/webhooks/overview/)
- [Webhook Events - Platform API Docs](https://getstream.io/video/docs/api/webhooks/events/)
- [Users & Tokens - Platform API Docs](https://getstream.io/video/docs/api/authentication/)
- [Client & Auth - React Docs](https://getstream.io/video/docs/react/guides/client-auth/)
- [Noise Cancellation - React Docs](https://getstream.io/video/docs/react/guides/noise-cancellation/)
- [Rate Limits - Platform API Docs](https://getstream.io/video/docs/api/misc/rate_limits/)
- [Pricing Guide - Platform API Docs](https://getstream.io/video/docs/api/pricing-guide/)
- [Video Pricing Page](https://getstream.io/video/pricing/)
- [GetStream/stream-video-js GitHub](https://github.com/GetStream/stream-video-js)
- [OwnCapability enum source](https://github.com/GetStream/stream-video-js/blob/main/packages/client/src/gen/coordinator/index.ts)
