# 80 — Jitsi Meet Live Rooms for ZAO OS

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Embed Jitsi Meet rooms for fractal calls + community meetings

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Provider** | Jitsi Meet (meet.jit.si) — free, no account needed, open source |
| **SDK** | `@jitsi/react-sdk` v1.4.0 — official React wrapper for IFrame API |
| **Mode** | Audio-only default (`startAudioOnly: true`) for fractal voice calls |
| **Room names** | `zao-fractal-week-{N}-{hash}` — predictable but hard to guess |
| **Cost** | $0 — meet.jit.si is free for up to ~100 participants |
| **Migration** | JaaS ($99/mo) for JWT moderation, or self-host for full control |

## Why Jitsi Over Alternatives

| Feature | Jitsi | 100ms | Daily | LiveKit |
|---------|-------|-------|-------|---------|
| Cost | Free | $100+/mo | $9+/mo | Self-host |
| Embed method | iframe (easy) | Components | iframe | Components |
| Audio-only | Yes | Yes | Yes | Yes |
| Recording | Local/Dropbox | Cloud | Cloud | Egress |
| Open source | Yes (Apache 2.0) | No | No | Yes |
| Max participants | ~100 | 10,000+ | 1,000+ | Server-dependent |

## Implementation

Uses `@jitsi/react-sdk` or raw IFrame API. Must be client-only (`ssr: false`).

```typescript
// Room name generation
function getRoomName(weekNumber: number): string {
  return `zao-fractal-week-${weekNumber}-${hashShort(secret + weekNumber)}`;
}
```

Key config: `startAudioOnly: true`, `prejoinConfig: { enabled: false }`, lobby mode for moderation.

## Sources

- [@jitsi/react-sdk](https://www.npmjs.com/package/@jitsi/react-sdk)
- [Jitsi Meet IFrame API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [JaaS Pricing](https://jaas.8x8.vc)
