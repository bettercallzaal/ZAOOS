---
topic: music
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "music/695-juke-integration-zao, music/710-juke-path-b-architecture, music/662-fishbowlz-revival-juke-mute-lockout"
original-query: "keep researching what else is needed [for the Juke integration after Path B] - space lifecycle, allow_agents, recurring-event scheduling, recording, Path D chat"
tier: STANDARD
---

# 712 - Juke Integration: Remaining Gaps After Path B

> **Goal:** Path B is built (PR #608, #613) and doc [music/710-juke-path-b-architecture](../710-juke-path-b-architecture/) covers how to operate it. This doc answers "what else is needed" to call the Juke integration complete - the five things that came up as loose ends: space lifecycle (knowing when a space ended), the `allow_agents` flag, recurring-event scheduling, recording, and Path D chat.

**CENTRAL CLAIM WAS WRONG, AND WRONG WITHIN A DAY OF PUBLICATION.** The 2026-05-22 version's headline was "most of what's missing is blocked on Juke, not on ZAO" because Juke's API had "no webhooks, no agent API, and no recording control." Juke shipped webhooks and agent-join on 2026-05-23 and a force-end endpoint on 2026-05-24 (all three dated precisely in Juke's own `changelog.json` release feed, re-fetched live 2026-09-25). Recording start/stop is also developer-API-callable today, but its exact ship date is UNKNOWN - Juke's changelog only goes back to 2026-05-23 (its earliest entry) and carries no recording-start/stop entry at all, so this may have shipped without a changelog record, or predates the changelog itself. Do not read the 2026-05-23 and 2026-05-24 dates above as covering recording. ZAO then built the entire integration surface against the new API: webhook registration + verification, agent-join, recording toggle, an authoritative stale-room cron, and a recurring-event script. As of today only one of the five original gaps has a genuinely open item left (ZOE auto-join is built but switched off, waiting on a UX flag from Juke), and Path D remains exactly where doc 695 left it - a separate, not-yet-started workstream.

## Key Decisions

| Gap | 2026-05-22 Verdict | 2026-09-25 Status | Why |
|---|---|---|---|
| Knowing when a space ended | Poll `GET /v1/rooms/{spaceId}` for `room.status` (no webhook existed) | **CLOSED.** Juke shipped `room.finished` webhooks (2026-05-23) plus `POST /v1/developer/spaces/{id}/end` for immediate host/API-triggered end (2026-05-24, Juke PR #174). ZAO's `src/app/api/cron/juke-stale-rooms/route.ts` now treats `GET /v1/developer/spaces/{id}` as authoritative and only falls back to the polling heuristic when `JUKE_API_KEY` is absent. | Juke's own changelog + `src/lib/spaces/juke-api-reads.ts` (ships `GET /v1/developer/spaces/{id}` + `GET /v1/developer/webhooks/{id}` in one client, 2026-05-25). |
| Build a Juke webhook receiver | NO - Juke documented zero webhooks | **REVERSED. YES, and it is built and live.** `POST/GET/DELETE /v1/developer/webhooks` shipped 2026-05-23. ZAO registered a subscription (`src/app/api/juke/admin/register-webhook/route.ts`) and verifies inbound HMAC signatures in `src/lib/spaces/jukeWebhookVerify.ts` / handles them in `jukeWebhookHandlers.ts`. Events: `room.started`, `room.finished`, `participant.joined/left`, `recording.ready`. Native (Farcaster) rooms do NOT fire `participant.*` or `recording.ready` - those still require polling `GET /v1/developer/spaces/{id}`. | juke.audio/SKILL.md "Outbound webhooks" section, re-fetched 2026-09-25 (`curl`, FULL) |
| ZOE / an AI agent inside a Juke room | NOT YET - "agent access is a separate future surface," build nothing | **PARTIALLY REVERSED - built, gated off.** `POST /v1/developer/rooms/{roomId}/agent-join` (free, partner-scoped, own rooms only) shipped 2026-05-23. ZAO's `src/lib/spaces/jukeAgentJoin.ts` calls it and is wired to an auto-join hook on `room.started` webhooks, but the hook is gated behind `ZAO_AUTO_AGENT_JOIN=true` (default off) pending Juke's issue #190 - an agent-visibility flag to hide ZOE from the iframe's participant/avatar bar. Agents publish DATA only in v1 (no audio-publish yet; that is still on Juke's roadmap, unchanged). | `src/lib/spaces/jukeAgentJoin.ts` (code, FULL); Juke SKILL.md "Agents" section (FULL); ZAO manifest `open_asks[].id === 'agent-visibility-flag'` (code, FULL) |
| Recording ZAO events | Host toggles it in the iOS app; ZAO can only READ `room.recording` | **REVERSED.** `POST /v1/rooms/{spaceId}/recording/start\|stop` and `GET /v1/recordings/{spaceId}` (presigned URL) are now developer-API callable, confirmed live in the current SKILL.md. ZAO's `createJukeSpace` now sends a `record` flag on create, defaults it ON in the UI ("Go Live" modal, PR merged 2026-05-26 per `git log`), and stores `recording_url` on `juke_spaces` for the `/live/recordings` shelf. | Juke SKILL.md "Can users record the space?" (FULL, re-fetched 2026-09-25); `src/lib/spaces/juke-api.ts` doc-comment on the `record` field (code, FULL); `src/app/live/recordings/page.tsx` (code, FULL) |
| Recurring-event auto-creation | Build a cron after `juke_spaces` exists; confirm scheduled-space behaviour with nickysap first | **CLOSED.** `scripts/schedule-zao-recurring.ts` pre-creates ZAO's weekly spaces (fractal call, ZAOstock standups) from `scripts/zao-recurring-events.json`, is idempotent (dedupes against `juke_spaces.scheduled_at +/- 30min`), and is "safe to wire into a weekly cron" per its own doc-comment. Pre-start behaviour is now documented: `GET /v1/rooms/{spaceId}` before `scheduled_at` returns `status: "scheduled"` with metadata only, no LiveKit token; the hosted embed renders a live countdown. | `src/lib/spaces/jukeIntegrationManifest.ts` shipped-feature entry `recurring-schedule-script` (code, FULL); Juke SKILL.md "How do I schedule a space?" (FULL) |
| Path D - FIP-2 chat | Separate workstream, not blocked on the Juke key, track under doc 695 | **UNCHANGED - still not started.** Doc [music/695-juke-integration-zao](../695-juke-integration-zao/) still lists it as a scoped-but-unstarted spike ("refactor `src/app/api/spaces/chat` toward the FIP-2 reply-tree pattern"). No new commits found touching `src/app/api/spaces/chat` toward this pattern. | `gh search code` across bettercallzaal/ZAOOS for FIP-2/reply-tree chat work (zero hits); doc 695 body, re-read 2026-09-25 |

## What Is Already Built (Codebase Ground Truth, re-verified 2026-09-25)

| Piece | Path | Notes |
|---|---|---|
| Juke developer API client | `src/lib/spaces/juke-api.ts` | Now documents the `record` flag; still defensive about the undocumented create-space response shape |
| Webhook registration (admin) | `src/app/api/juke/admin/register-webhook/route.ts`, `.../delete-webhook/route.ts` | Wraps Juke's `POST/DELETE /v1/developer/webhooks`; the one-time secret must be copied into `JUKE_WEBHOOK_SECRET` on Vercel by hand |
| Webhook receiver + verification | `src/app/api/juke/webhooks/route.ts`, `src/lib/spaces/jukeWebhookVerify.ts`, `jukeWebhookHandlers.ts` | HMAC verification present; handler updated 2026-05-24 for Juke's shipped payload shape (`event_type`/`event_id` top-level, `data.room_id`) |
| Agent-join client + auto-join hook | `src/lib/spaces/jukeAgentJoin.ts` | Gated by `ZAO_AUTO_AGENT_JOIN` (default off) |
| Authoritative stale-room cron | `src/app/api/cron/juke-stale-rooms/route.ts` | Runs every 30 min (Vercel cron); prefers `GET /v1/developer/spaces/{id}` over webhook timeline; falls back to a heuristic when `JUKE_API_KEY` is absent |
| Recurring-space script | `scripts/schedule-zao-recurring.ts`, `scripts/zao-recurring-events.json` | Idempotent; not yet confirmed wired into an actual cron trigger (see Next Actions) |
| Public integration surfaces | `/juke-status` (HTML), `/api/juke/status` (JSON), `/juke-integration.md` (LLM-readable) | Single source of truth is `src/lib/spaces/jukeIntegrationManifest.ts`; it also diffs Juke's own `https://juke.audio/changelog.json` against `open_asks[].id` to auto-resolve closed asks |
| Bot command | `agent/src/juke-commands.ts` (repo `ZAODEVZ/ZAOcowork`) | Not re-verified this pass (out of scope; no evidence it changed) |

## Findings

| # | Finding | Source |
|---|---|---|
| 1 | Juke shipped a full developer webhook surface (`POST/GET/DELETE /v1/developer/webhooks`, events `room.started`, `room.finished`, `participant.joined/left`, `recording.ready`, HMAC-signed, 4 retries, auto-disable after 10 consecutive failures) on 2026-05-23 - the exact capability the 2026-05-22 doc said did not exist and would not be built for | juke.audio/SKILL.md, `curl`-fetched 2026-09-25 [FULL] |
| 2 | Native (Farcaster-hosted) rooms do NOT fire `participant.*` or `recording.ready` webhooks - only `room.started`/`room.finished`. Polling `GET /v1/developer/spaces/{room_id}` is still required for those two signals on native rooms specifically | juke.audio/SKILL.md, "Webhooks for native rooms" [FULL] |
| 3 | Agent-join now exists as two paths: a paid x402 path (`POST /v1/rooms/{spaceId}/agent-join`, any room with `allow_agents=true`) and a free partner path scoped to an app's own rooms (`POST /v1/developer/rooms/{roomId}/agent-join`, rate-limited 10/min + 100/day, 5 concurrent agents per room, 429 past cap) | juke.audio/SKILL.md "Agents" section [FULL] |
| 4 | Agents still publish data only in v1 - audio-publishing agents (a "speaker" agent role) remain on Juke's roadmap, unchanged since May | juke.audio/SKILL.md [FULL] |
| 5 | Recording is now a developer-callable pair, `POST /v1/rooms/{spaceId}/recording/start\|stop`, plus `GET /v1/recordings/{spaceId}` returning a short-lived presigned `recording_url` - this reverses the 2026-05-22 finding that recording was host-app-only | juke.audio/SKILL.md [FULL] |
| 6 | Juke publishes a structured, CORS-open `changelog.json` feed (`id`, `shipped_at`, `endpoints`, `docs_section`, `resolves[]`) specifically so partners can auto-detect when an open ask has been closed - ZAO's own `/juke-status` page already diffs against it | juke.audio/SKILL.md "Release feed for partner manifests" [FULL]; `src/app/juke-status/page.tsx` (`buildResolutionIndex(changelog)`) [FULL, code] |
| 7 | ZAO's own integration manifest (`jukeIntegrationManifest.ts`) still lists "agents" as an open ask with text written as if agent-join were still unbuilt ("llms.txt + the 2026-05-23 PR still flag agents as a future surface") - that text is now stale; the actual blocker has narrowed to the agent-visibility flag (Juke issue #190), not the join capability itself | `src/lib/spaces/jukeIntegrationManifest.ts`, code read 2026-09-25 [FULL] |
| 8 | Force-ending a room from the server (`POST /v1/developer/spaces/{room_id}/end`) shipped 2026-05-24 as Juke's PR #174, confirmed by Nicky the same day per ZAO's own manifest notes, closing the original webhook-never-fires blind spot from host-side ends | `src/lib/spaces/jukeIntegrationManifest.ts` open-ask history entry, code read 2026-09-25 [FULL] |
| 9 | No evidence found that Path D (FIP-2 reply-tree chat) has moved since doc 695's 2026-05-20 validation - `gh search code` across bettercallzaal/ZAOOS + ZAODEVZ for reply-tree/FIP-2 chat work in `src/app/api/spaces/chat` returned zero relevant hits | `gh search code`, run 2026-09-25 [FULL] |
| 10 | `sim.jukeaudio.com` remains an unrelated multi-zone-audio hardware company, not nickysap's Juke (`juke.audio`) - still worth flagging for anyone searching cold | Carried forward from 2026-05-22 pass; not re-tested this round |

## Also See

- [music/710-juke-path-b-architecture](../710-juke-path-b-architecture/) - how to operate Path B (token lifecycle, bot auth, the `juke_spaces` table)
- [music/695-juke-integration-zao](../695-juke-integration-zao/) - the five-path Juke integration map; Path D lives here, still unstarted as of this pass
- [music/662-fishbowlz-revival-juke-mute-lockout](../662-fishbowlz-revival-juke-mute-lockout/) - FISHBOWLZ-on-Juke; shares the native-vs-web caveat

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update `src/lib/spaces/jukeIntegrationManifest.ts`'s `agents` open-ask text to reflect that agent-join is built and gated on Juke's visibility flag (#190), not on the join capability itself - ship as a small PR | @Zaal | PR (manifest text fix) | 2026-10-03 |
| Confirm whether Juke's issue #190 (agent-visibility flag) has shipped; if yes, flip `ZAO_AUTO_AGENT_JOIN=true` in production | @Zaal | Env var flip + verify | 2026-10-10 |
| Confirm `scripts/schedule-zao-recurring.ts` is actually wired into a live Vercel cron (not just present as a runnable script) - add the cron entry to `vercel.json` if missing | @Zaal | PR (cron wiring) | 2026-10-03 |
| Scope and start the Path D (FIP-2 chat) spike tracked in doc 695 - currently zero commits toward it | @Zaal | Investigation, new doc | 2026-10-17 |
| Re-validate this doc's webhook/agent/recording claims once Juke's `changelog.json` shows another developer-facing release (poll or one-off re-check) | @Zaal | Doc re-check | 2026-12-01 |

## Sources

- [Juke developer docs - juke.audio/llms.txt](https://juke.audio/llms.txt) - [FULL] re-fetched via `curl` 2026-09-25 (HTTP 200, 915 lines); confirms webhooks, agent-join, recording start/stop, `scheduled_at` behaviour all now documented
- [Juke embed/API reference - juke.audio/SKILL.md](https://juke.audio/SKILL.md) - [FULL] re-fetched via `curl` 2026-09-25 (HTTP 200, 643 lines); the primary source for every reversal in the Key Decisions table above - webhook events list, agent-join constraints and rate limits, recording endpoints, native-room webhook caveats, force-end endpoint
- [ZAO codebase: `src/lib/spaces/juke-api.ts`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/spaces/juke-api.ts) - [FULL] read directly
- [ZAO codebase: `src/lib/spaces/jukeAgentJoin.ts`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/spaces/jukeAgentJoin.ts) - [FULL] read directly
- [ZAO codebase: `src/app/api/juke/admin/register-webhook/route.ts`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/app/api/juke/admin/register-webhook/route.ts) - [FULL] read directly
- [ZAO codebase: `src/lib/spaces/jukeIntegrationManifest.ts`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/lib/spaces/jukeIntegrationManifest.ts) - [FULL] read directly; source of the shipped-feature dates and open-ask text quoted above
- [ZAO codebase: `src/app/api/cron/juke-stale-rooms/route.ts`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/src/app/api/cron/juke-stale-rooms/route.ts) - [FULL] read directly
- `git log` on `bettercallzaal/ZAOOS` for the Juke-touching files (`jukeAgentJoin.ts`, `register-webhook/route.ts`, `juke-api.ts`) - [FULL] local git history read directly; confirms shipped-date claims (2026-05-24 to 2026-05-26 range)
- `gh search code` across `bettercallzaal` + `ZAODEVZ` for FIP-2 / reply-tree chat work - [FULL - zero relevant hits, treated as a negative finding, not a failed fetch]
- [Doc music/695-juke-integration-zao](../695-juke-integration-zao/) - [FULL] re-read directly for Path D status
- LiveKit webhook sources cited in the prior version (docs.livekit.io) - not re-fetched this pass; retained only as background context, no longer load-bearing since Juke's own webhook surface now supersedes the "steal it from LiveKit" argument entirely
