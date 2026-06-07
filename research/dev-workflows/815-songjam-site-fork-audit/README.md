# 815 — Songjam-Site Fork Audit + Voice-Agent Port

**Date:** 2026-06-07
**Source repo:** `github.com/SongjamSpace/songjam-site` (Next.js 15 / React 19 / Tailwind v4)
**Ask:** Audit Songjam's public site and fork the useful parts into ZAO OS so ZABAL can use them to upgrade the dev environment.
**Permission:** Songjam team gave verbal OK to reuse code (confirmed by Zaal 2026-06-07). No LICENSE file exists on the repo, so reuse is permission-based, not license-based — keep it internal to the lab until a license lands.

---

## TL;DR

**A wholesale fork would be a downgrade.** ZAO OS already ships a more mature, more secure version of ~90% of what songjam-site does. The only genuinely additive capability is the **ElevenLabs conversational voice agent** that drops into a live space. That is the piece worth porting, and this doc ships a secured prototype of it.

---

## What Songjam-site actually is

Public marketing/leaderboard site for Songjam ("agentic CRM for X Spaces"). Key surfaces:

| Songjam feature | File(s) |
|---|---|
| Live audio rooms (100ms + Firestore) | `components/LiveAudioRoom.tsx` (~1,850 lines) |
| ElevenLabs voice agent "$ADAM" | `components/agent-conversation.tsx` |
| Mindshare / X-engagement leaderboard | `components/mindshare-leaderboard.tsx`, `hooks/useSpacePoints.ts` |
| **$ZABAL Empire S2 page (already ZABAL-branded)** | `app/zabal/page.tsx` |
| Staking balance checker (Alchemy) | `lib/staking.ts` |
| Token routes (100ms / Stream) | `app/api/100ms/token`, `app/api/stream-token` |

Stack: Next 15, React 19, Tailwind v4, Supabase, Neynar, Stream.io video, 100ms, ElevenLabs, Privy, Firebase, Solana kit, Ethers, OpenAI.

## Overlap with ZAO OS — most of it is already here

| Songjam dependency | Already in ZAO OS? |
|---|---|
| `@100mslive/react-sdk`, `hms-video-store` | ✅ yes (newer) |
| `@stream-io/video-react-sdk`, `node-sdk` | ✅ yes (newer) |
| `@privy-io/*` | ✅ `@privy-io/node` (we use iron-session + wagmi/rainbowkit on the client) |
| Solana, Neynar, Supabase, react-query | ✅ yes |
| `firebase` | ❌ — **redundant with Supabase, do NOT bring** |
| `@elevenlabs/react` | ❌ — **the one genuine gap** |

ZAO OS equivalents that already exist and are better:
- `src/components/spaces/` — 40+ components: `HMSRoom`, `HMSFishbowlRoom`, `HMSRoomAdapter`, `AudioRoomAdapter`, `HandRaiseQueue`, `ClosedCaptions`, `RoomReactions`, `RoomMusicPanel`, `PermissionRequests`, … Songjam's single 1,850-line `LiveAudioRoom.tsx` is a less-decomposed subset of this.
- `src/components/respect/SongjamLeaderboard.tsx` + `src/app/api/songjam/leaderboard/route.ts` — already consumes Songjam's own leaderboard worker for `bettercallzaal_s2`, with empire/staking multipliers, caching, Zod. The mindshare leaderboard is **already ported**.
- `src/app/api/100ms/token/route.ts` — Zod + session guard + FID match + role validation + audit log + server-only `HMS_APP_SECRET`.

## Security audit — do NOT copy Songjam's auth/secret patterns

Songjam's code violates `.claude/rules/secret-hygiene.md` in several places. These are the things to explicitly NOT port:

| Songjam pattern | Problem | ZAO rule |
|---|---|---|
| `NEXT_PUBLIC_STREAM_API_SECRET` in `stream-token/route.ts` | **Stream API *secret* exposed to the browser** | secrets are server-side only |
| `NEXT_PUBLIC_ADAM_AGENT` agent id in `agent-conversation.tsx` | agent id shipped to client, session started client-side with no auth | server-mint short-lived tokens |
| `NEXT_PUBLIC_API_KEY` (Alchemy) | API key in browser | server-side only |
| `/api/100ms/token` mints on any `userId` | no auth, no ownership check | session guard + ownership |
| client tools call `window.open(...)` on agent instruction | unvalidated redirects | allowlist actions |

ZAO already does all of these correctly. The lesson: **reference Songjam's UX, re-implement the plumbing to our standards.**

---

## Decision

1. **Do NOT** fork `LiveAudioRoom.tsx`, the Stream/100ms token routes, the Firebase room store, or the mindshare leaderboard — we have better versions.
2. **Do NOT** add `firebase` or `@privy-io/react-auth` — redundant with Supabase / our existing auth.
3. **DO** port the missing capability: an **ElevenLabs conversational voice agent** that can join a ZAO space, re-skinned as a ZOE persona and secured (server-minted signed URL, session-gated, no `NEXT_PUBLIC` secrets). This is the actual dev-environment upgrade ZABAL can build on.
4. **New dependency:** `@elevenlabs/react` — the only new package. Needs Zaal's explicit approval per CLAUDE.md before merge (`npm install @elevenlabs/react`).

## Prototype shipped in this branch

| File | What | New dep? |
|---|---|---|
| `src/lib/agents/voice/elevenlabs.ts` | Server helper: mints a short-lived signed ElevenLabs ConvAI URL using server-only `ELEVENLABS_API_KEY` | none |
| `src/app/api/spaces/voice-agent/token/route.ts` | Session-guarded, Zod-validated route returning the signed URL (agent allowlist, no client secrets) | none |
| `src/app/api/spaces/voice-agent/token/__tests__/route.test.ts` | Vitest coverage: auth guard, validation, success, error paths | none |
| `src/components/spaces/SpaceVoiceAgent.tsx` | Client widget: ElevenLabs `useConversation`, navy/gold, mobile-first, fetches signed URL from our route | `@elevenlabs/react` |

### New env vars (add to `.env.example`, set server-side only)
```
ELEVENLABS_API_KEY=...           # server-only, NEVER NEXT_PUBLIC
ELEVENLABS_SPACE_AGENT_ID=...    # ConvAI agent id for the ZOE space agent
```

### Verification status
- Server route + helper + test follow `.claude/rules/api-routes.md` and `tests.md` and use zero new deps.
- `SpaceVoiceAgent.tsx` imports `@elevenlabs/react`; **build/typecheck of that file is unverified until the dep is approved + installed.** It is not yet imported by any page, so it won't enter the production bundle until wired in.

## Follow-ups (need Zaal approval)
- Approve + `npm install @elevenlabs/react`, then `npm run typecheck`.
- Create the ZOE ConvAI agent in the ElevenLabs dashboard; populate the two env vars.
- Wire `SpaceVoiceAgent` into a space page (e.g. `src/app/spaces/[id]/page.tsx`) behind a feature flag for a ZABAL demo.
- Define the agent's client-tool allowlist (raise hand, surface leaderboard, post capture to ZOE) — no raw `window.open`.

## Related prior research
- `research/_archive/119-songjam-audio-spaces-embed/` — earlier Songjam embed work
- `research/infrastructure/741d-zoe-voice-agent-blueprint/`, `741c-voice-agent-stack-comparison/`
- `research/agents/325-elevenlabs-agents-voice-ai-platform/`
- `research/music/079-songjam-music-player-research/`
