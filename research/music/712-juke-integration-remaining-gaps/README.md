---
topic: music
type: decision
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 695, 710, 662
original-query: "keep researching what else is needed [for the Juke integration after Path B] - space lifecycle, allow_agents, recurring-event scheduling, recording, Path D chat"
tier: STANDARD
---

# 712 - Juke Integration: Remaining Gaps After Path B

> **Goal:** Path B is built (PR #608, #613) and doc 710 covers how to operate it. This doc answers "what else is needed" to call the Juke integration complete - the five things that came up as loose ends: space lifecycle (knowing when a space ended), the `allow_agents` flag, recurring-event scheduling, recording, and Path D chat. The headline: **most of what's missing is blocked on Juke, not on ZAO.** Juke's developer API documents no webhooks, no agent API, and no recording control. ZAO's own remaining buildable surface is small and clear.

## Key Decisions

| Gap | Verdict | Why |
|---|---|---|
| Knowing when a space ended | **Poll `GET /v1/rooms/{spaceId}` and read `room.status`.** | Juke exposes no webhook. `room.status` is a real field (`'active'` is confirmed verbatim in Juke's docs). The `juke_spaces` table (doc 710) marks a space closed when its status leaves `active`. |
| Build a Juke webhook receiver | **NO - do not build one.** | Juke's developer API documents zero webhooks. LiveKit, Juke's transport, has `room_finished` and 11 other events - but that surface belongs to Juke's LiveKit project, not ZAO's. Polling is the only path open to ZAO. |
| ZOE / an AI agent inside a Juke room | **NOT YET. Keep sending `allow_agents`, build nothing.** | Juke's own docs say verbatim: "agent access is a separate future surface." The flag is a forward-declaration for a feature Juke has not shipped. Building ZOE-in-Juke now is building against vapor. |
| Recording ZAO events | **The host toggles it in the Juke iOS app. ZAO can READ `room.recording`, not control it.** | `room.recording` is a host-side room setting the API surfaces read-only. There is no ZAO-callable record / replay / clip endpoint. |
| Recurring-event auto-creation | **Build a cron AFTER the `juke_spaces` table - pre-create the Mon/Tue standup + fractal spaces with `scheduled_at`. Confirm pre-start behaviour with nickysap first.** | `scheduled_at` accepts a future ISO timestamp, but whether listeners can join early or see metadata before start is undocumented. |
| Path D - FIP-2 chat | **Separate workstream. Not blocked on the Juke key. Track it under doc 695 Path D.** | Juke's chat is a Farcaster reply tree fed by an ephemeral Neynar webhook - a pattern ZAO can steal into its own Spaces chat with zero Juke dependency. |

## What Is Already Built (Codebase Ground Truth)

| Piece | Path | PR |
|---|---|---|
| Juke developer client | `src/lib/spaces/juke-api.ts` | #608, #613 |
| Create route (admin OR password) | `src/app/api/juke/space/route.ts` | #608, #613 |
| Web creator | `src/app/live/create/page.tsx` | #613 |
| Path A embed | `src/lib/spaces/juke.ts`, `src/components/spaces/JukeEmbed.tsx`, `src/app/live/[spaceId]/page.tsx` | #595, #598 |
| `/juke` bot command | `agent/src/juke-commands.ts` (repo `ZAODEVZ/ZAOcowork`) | ZAOcowork PR #3 |
| Architecture / operations | `research/music/710-juke-path-b-architecture` | #616 |

## The Five Gaps

### 1. Space lifecycle - knowing when a space ended

Juke's developer API documents **no webhooks**. There is no `space.ended` callback ZAO can subscribe to. Searched `juke.audio/llms.txt` and `/SKILL.md` in full - zero mention of webhooks, callbacks, or event subscriptions.

What Juke *does* expose: `GET /v1/rooms/{spaceId}` returns a room object with a **`room.status`** field. Juke's own embed docs check `room.status === 'active'` verbatim, which confirms the field exists and that `'active'` is one of its values (the ended/scheduled values are not documented - ask nickysap).

So ZAO's only lifecycle mechanism is **polling**: when the `juke_spaces` table from doc 710 exists, a light poller reads `GET /v1/rooms/{id}` for each space still marked open and closes any whose status has left `'active'`. At ZAO's volume (single digits of spaces a week) a poll every few minutes for only the open rows is trivial - no cron storm, no rate-limit concern.

Contrast for context: **LiveKit, the SFU Juke runs on, has a complete webhook surface** - `room_started`, `room_finished`, `participant_joined`, `participant_left`, `egress_started`/`egress_ended`, and 6 more, delivered as POSTs with `Content-Type: application/webhook+json`. LiveKit's own field guide calls webhooks "ideal for maintaining a 'room state' model outside of LiveKit." The lifecycle signal physically exists one layer down - Juke simply has not re-exposed it in its developer API. This is a clean, specific ask for nickysap: surface `room_finished` (and `participant_*`) as a developer webhook.

### 2. AI agents - the `allow_agents` flag

`createJukeSpace` already sends `allow_agents` in the create body. But Juke's docs are explicit, verbatim: **"Do not treat MCP or agent participation as part of the normal embed path. Agent access is a separate future surface."**

So `allow_agents: true` is a forward-declaration. There is no agent SDK, no agent join flow, no documented behaviour. **Do not build ZOE-into-a-Juke-room yet** - there is nothing to build against. Keep passing `allow_agents` (harmless, and it future-proofs the create call). Revisit when Juke ships the agent surface.

For reference, LiveKit again has the mature pattern here (an Agents framework, an `AgentDispatchService` API for dispatching agents to rooms) - so when Juke opens its agent surface it will likely resemble LiveKit's. A ZAO agent-in-Juke is a real future capability, just not a now-capability.

### 3. Recording ZAO events

`room.recording` exists as a **host-side setting** on the room; Juke's docs say "the embed surfaces it as read-only metadata." There is no ZAO-callable endpoint to start/stop a recording, and no documented replay or clip API (Juke lists recordings/replays/clipping as planned *host-premium* features, not developer-API features).

Practical consequence for ZAO events (fractal calls, standups worth keeping): **the host enables recording inside the Juke iOS app** when they start the space. ZAO's only API role is to *read* `room.recording` and, if it wants, show a "recording" badge on `/live/{id}`. Do not plan an auto-record pipeline - the control surface does not exist.

### 4. Recurring-event auto-creation

ZAO's audio-worthy recurring events are concrete: the ZAOstock Monday 11:30am cobuild + Tuesday 10am standup, the weekly fractal call (Mondays 6pm EST), COC Concertz nights. The create body already accepts `scheduled_at` (a future ISO timestamp).

So a cron *could* pre-create each week's spaces and post the links to Telegram. But two unknowns block a clean build: (a) what `room.status` a not-yet-started scheduled space reports, and (b) whether listeners can join, or see metadata, before `scheduled_at`. Both are undocumented. **Sequence: ship the `juke_spaces` table first, confirm scheduled-space behaviour with nickysap, then add the cron.** Not before - a cron that creates spaces nobody can see early is worse than on-demand creation.

### 5. Path D - FIP-2 chat

Doc 695's Path D - adopting Juke's chat pattern (a Farcaster cast's reply tree as the chat layer, fed by an ephemeral Neynar webhook) into ZAO OS Spaces - is **independent of everything in Path B**. It needs no Juke key, no Juke API. It is its own workstream and should stay tracked under doc 695, not folded into the Path B punch list. Flagged here only so it is not forgotten: it remains the highest-leverage *idea* from the Juke research and ZAO already runs Neynar.

## Findings

| # | Finding | Source |
|---|---|---|
| 1 | Juke's developer API documents zero webhooks - no space-lifecycle event delivery exists for ZAO to consume | juke.audio/llms.txt + /SKILL.md |
| 2 | `room.status` is a real field on `GET /v1/rooms/{spaceId}`; `'active'` is a confirmed value - polling it is the only end-detection path | juke.audio/SKILL.md (verbatim `room.status === 'active'`) |
| 3 | Agent access is explicitly "a separate future surface" - `allow_agents` is a flag for an unreleased feature | juke.audio/SKILL.md (verbatim) |
| 4 | `room.recording` is a host-side toggle exposed read-only; no developer record/replay/clip API | juke.audio/SKILL.md |
| 5 | LiveKit (Juke's transport) has 12 webhook event types incl. `room_finished` - the lifecycle signal exists one layer below Juke's API | LiveKit WebhookEventNames + field guide |
| 6 | `scheduled_at` accepts a future timestamp; pre-start behaviour (early join, metadata visibility) is undocumented | juke.audio/llms.txt |
| 7 | `sim.jukeaudio.com` is an unrelated multi-zone-audio hardware company - not nickysap's Juke; do not confuse the two when searching | WebSearch (juke.audio is the correct Farcaster Juke) |

## Questions For nickysap

1. Will Juke surface a developer **webhook** for `room_finished` / `participant_*`? (LiveKit already emits these underneath.)
2. What are the full set of `room.status` values - what does an ended space, and a not-yet-started scheduled space, report?
3. For a `scheduled_at` space: can listeners join before start? Is metadata public before start?
4. When does the **agent surface** open, and what will it look like?
5. Is there any plan for a developer-controllable **recording/clip** API, or will recording stay host-app-only?

(These join the doc 710 question on `JUKE_USER_TOKEN` lifetime - all to be asked alongside the API key request.)

## Also See

- [Doc 710](../710-juke-path-b-architecture/) - how to operate Path B (token lifecycle, bot auth, the `juke_spaces` table)
- [Doc 695](../695-juke-integration-zao/) - the five-path Juke integration map; Path D lives here
- [Doc 662](../662-fishbowlz-revival-juke-mute-lockout/) - FISHBOWLZ-on-Juke; shares the native-vs-web caveat

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the 5 questions above to the nickysap message (with the doc 710 token-TTL question) | @Zaal | Message | With the API key request |
| Ship the `juke_spaces` Supabase table (doc 710) - prerequisite for lifecycle polling + the cron | @Zaal | PR (needs migration approval) | After Path B proven live |
| Add a lightweight poller: read `room.status` for open `juke_spaces` rows, close any not `active` | @Zaal | PR | After the table lands |
| Show a read-only "recording" badge on `/live/{id}` from `room.recording` | @Zaal | PR | Optional, low priority |
| Recurring-event cron (`scheduled_at` for Mon/Tue standup + fractal) | @Zaal | PR | After nickysap confirms scheduled-space behaviour |
| Keep Path D (FIP-2 chat) tracked under doc 695 - do not fold into Path B | @Zaal | Doc | Ongoing |

## Sources

- [Juke developer docs - juke.audio/llms.txt](https://juke.audio/llms.txt) - [FULL] fetched in full; confirmed no webhooks, `scheduled_at` field, agent surface deferred
- [Juke embed/API reference - juke.audio/SKILL.md](https://juke.audio/SKILL.md) - [FULL] fetched in full; `room.status === 'active'`, `room.recording` read-only, "agent access is a separate future surface" verbatim
- [LiveKit Webhooks & events](https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events.md) - [PARTIAL - exa highlights; used only to establish LiveKit has a webhook surface, a non-load-bearing comparison]
- [LiveKit WebhookEventNames (server SDK, GitHub-published)](https://docs.livekit.io/reference/server-sdk-js/types/WebhookEventNames.html) - [FULL] the complete 12-event list read verbatim from the exa result
- [LiveKit - Best practices for managing webhook event streams](https://livekit.io/field-guides/guide/managing-webhook-event-streams) - [PARTIAL - exa highlights; corroborates the "maintain room state outside the SFU" purpose, no unique claim depends on it]
- [LiveKit JS Server SDK (livekit/server-sdk-js, GitHub)](https://docs.livekit.io/server-sdk-js) - [FULL] community/code source; `WebhookReceiver` usage + `application/webhook+json` content type read in full from the exa result
- WebSearch "Juke audio Farcaster nickysap developer API agents" - [FULL] result list reviewed; surfaced the `sim.jukeaudio.com` false-match (unrelated hardware vendor) - no usable Juke-specific page beyond the docs already cited
