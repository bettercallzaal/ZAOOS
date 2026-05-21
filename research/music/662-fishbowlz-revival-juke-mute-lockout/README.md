---
topic: music
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 601, 661, 661a, 661h, 660
supersedes: project_fishbowlz_deprecated (memory)
original-query: "Can FISHBOWLZ be revived on top of Juke - what co-host and mute-lockout moderation model would work? (reconstructed)"
tier: DEEP
---

# 662 — FISHBOWLZ Revival on Juke (Co-Host + Mute-Lockout Moderation Model)

> **Goal:** Capture Zaal's new FISHBOWLZ design. Two changes from the killed 2026-05-04 version: (1) **build on Juke's audio stack** instead of custom Privy + LiveKit; (2) **new moderation model** — 4+ permanent co-hosts always have mic; audience speakers get the mic via raised hand → co-host pick, but **muting the mic revokes their permission**, so any next contribution requires re-raising the hand. This pattern doesn't exist in Clubhouse, X Spaces, or Discord Stage. Doc covers the Juke API surface, the implementation plan, what to keep/delete from the old FISHBOWLZ code in this repo + the standalone repo, and the open questions to lock with the Juke team before any code lands.
>
> **Status reversal:** This doc overrides `project_fishbowlz_deprecated.md` (the "killed 2026-05-04, no resurrection without explicit reverse" memory). Zaal gave the explicit reverse on 2026-05-17.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Build new FISHBOWLZ on Juke's audio stack vs. custom (LiveKit + Privy) | **JUKE** | Juke's permission model already has listener/speaker/co-host/host. Mic access already requires host promotion server-side. `raiseHand()` already in SDK. LiveKit under the hood. Built-in Farcaster SIWF auth. Skips ~80% of the custom work the old FISHBOWLZ rebuilt from scratch. |
| Use Juke iframe vs. Juke SDK + custom UI | **SDK + custom UI** | Iframe gives Juke's UI. The mute-lockout rule is non-standard moderation — it needs custom client + server logic. Iframe doesn't expose hooks for "on-mute → revoke speaker token". SDK does. |
| Use Juke developer API keys | **YES** | Server-side enforcement of mute-lockout requires `X-Juke-Api-Key` calls to revoke speaker role. Iframe alone can't do this. |
| Standalone repo (`/Users/zaalpanthaki/Documents/fishbowlz/`) vs. ZAOOS monorepo | **STANDALONE** | Per `feedback_fishbowlz_standalone_only.md` — standalone is the source of truth. ZAOOS code is stale by design. |
| Delete the 22 stale ZAOOS FISHBOWLZ files | **YES** | Old design (custom audio + Privy + custom transcripts) doesn't match new Juke-powered direction. Per Doc 661a + 661h audit (P0 delete). Per `feedback_fishbowlz_standalone_only.md` — don't sync from ZAOOS to standalone. |
| Keep the agentic-participants three-tier design (Admin / ZOEY / BYOK) from `project_fishbowlz_agents_design.md` | **PARTIAL** | The Admin agent role maps cleanly to "automated co-host" in the new model. ZOEY + BYOK personal agents are a Phase 2 concern; ship the human-moderation core first. |

## What's New About The Moderation Model

This is the central question of the doc. The mute-lockout rule does not exist on any major platform.

### The Rule, In One Paragraph

A room has 4+ permanent co-hosts who have their mic on whenever they want (toggle freely without losing their seat). Audience members are listeners by default. A listener raises their hand. A co-host picks them. The listener gets the mic. **The instant the audience speaker turns off their mic — for any reason — they're demoted back to listener. To speak again, they must re-raise their hand and be re-picked.** Co-hosts are exempt; their mic toggle is purely audio, not role.

### Comparison To Existing Platforms

| Platform | Self-mute behavior for audience speaker | Source |
|---|---|---|
| **Clubhouse** | Stays on stage as muted speaker; unmute is one tap | Clubhouse Knowledge Center |
| **X Spaces** | Stays as muted speaker; host can mute, but listener must unmute themselves once granted permission | Twitter/X help |
| **Discord Stage** | Stays as muted speaker; "Move to Audience" is a separate moderator action | Discord Support |
| **Telegram Voice Chat** | Stays as muted speaker; admin removes manually | — |
| **Spaces by Wisp** | Stays; mute is local | — |
| **FISHBOWLZ (new, doc 662)** | **AUTO-DEMOTES on self-mute** | This doc |

The pattern is novel. The closest precedent is a meeting tool's "leave-and-rejoin" flow — but those are explicit leaves, not implicit-via-mute.

### Why The Rule Helps

1. **No mic hogging.** A speaker can't grab the mic, mute briefly, then re-grab. Every re-entry costs a hand-raise + a co-host approval.
2. **Punchier contributions.** Knowing "this is your one shot, mute = done" forces speakers to make their point efficiently.
3. **Equity-by-default.** Hand-raise queue is a true FIFO of want-to-speak. Co-hosts pick from it; no advantage to having "spoken before."
4. **Co-host signal.** The 4+ co-hosts are the curators — they can always speak + always decide who else does. Clear role boundary.
5. **Lower moderation cost.** No need for explicit "kick" actions in routine cases — self-mute is the natural exit.

### Why The Rule Hurts (Costs)

1. **Back-and-forth conversation gets clunky.** If a co-host asks the speaker a follow-up question, the speaker had better not mute first. Need UX cue: "Don't tap mute until you're fully done."
2. **Accidental mutes are punishing.** Mobile UX = thumb hits mute by accident → speaker is gone. Mitigation: confirmation modal on first mute per session? Or just accept the cost (lean into the "one-shot" framing).
3. **Reduced safety valve.** Sometimes a speaker wants 5 seconds of silence to think, then resume. Now silence = exit. Mitigation: a "Pause" button that's distinct from "Mute and end my turn"? Or accept the loss.
4. **Co-host coordination burden.** With 4+ co-hosts, they need a shared mental model of when to re-promote a recent speaker who got re-queued. Some UX surface showing recent-speaker history would help.

### Open UX Questions To Lock Before Build

| Question | Default | Alternative |
|---|---|---|
| First-time mute confirmation modal? | NO (lean into one-shot) | YES with "Don't show again" toggle |
| Show recent speakers in co-host queue UI for re-promote? | YES (last 5) | NO (force re-raise) |
| Hand-raise stays raised after a speaker turn ends? | NO (auto-lower) | YES (must explicitly drop) |
| Co-host can self-mute without demotion? | YES (co-hosts are exempt) | — |
| Can a co-host be demoted by another co-host? | NO (only host can demote co-hosts) | YES (peer demotion among co-hosts) |
| Co-host count cap? | None | 4-10 |

## The Juke API Surface (Verbatim From llms.txt + SKILL.md)

Pulled 2026-05-17 from `https://juke.audio/llms.txt` + `https://juke.audio/SKILL.md`. Verbatim quotes; verify against current docs at https://juke.audio/developers before integration.

### Three Integration Paths

1. **Hosted Iframe** — `https://juke.audio/embed/{spaceId}`. No API key. Visitors listen anonymously; Farcaster SIWF triggers when participating. **Not used for FISHBOWLZ** because the iframe is Juke's UI; can't enforce mute-lockout.
2. **Custom SDK** — `@juke/audio-sdk`. Methods: `joinAnonymousListener()`, `startSiwfFlow()`, `pollSiwfStatus()`, `completeSiwfLogin()`, `joinAuthenticated()`, `getSpace(id)`, `leaveSpace(id)`, `refreshToken(id)`, `sendReaction(id, reaction)`, `raiseHand(id, raised)`, `connectAudio(joinResponse)`, `enableMicrophone()`. **This is the FISHBOWLZ client tier.**
3. **Server-side Developer Keys** — `X-Juke-Api-Key` header. Apply at `juke.audio/developers`. Approved → create/rotate/revoke keys. Endpoint `POST /v1/developer/spaces` creates rooms. **This is the FISHBOWLZ server tier — needed for mute-lockout enforcement.**

### Permission Model (verbatim)

> "Permission model enforces role-based access (listener, speaker, co-host, host) server-side. Mic access requires host promotion."

That's exactly the four roles we need. The mute-lockout rule adds one server-side transition: `speaker → listener on self-mute`.

### Auth Hierarchy (verbatim)

> "Public metadata → Anonymous listening → SIWF (web) → Quick Auth (miniapps) → Native iOS → Speaking (host-approved only)."

For FISHBOWLZ: anyone can listen anonymously; raising hand requires Farcaster sign-in; speaking requires co-host promotion.

### Endpoints (verbatim)

Public:
```
GET  /v1/rooms/{spaceId}
POST /v1/rooms/{spaceId}/anonymous-join
POST /v1/rooms/{spaceId}/join
POST /v1/rooms/{spaceId}/raise-hand
POST /v1/rooms/{spaceId}/token
```

Developer (server-side, `X-Juke-Api-Key`):
```
GET  /v1/developer/status
POST /v1/developer/application
GET  /v1/developer/apps
POST /v1/developer/apps
GET  /v1/developer/apps/{appId}/keys
POST /v1/developer/apps/{appId}/keys
POST /v1/developer/apps/{appId}/keys/{keyId}/reveal
POST /v1/developer/apps/{appId}/keys/{keyId}/rotate
POST /v1/developer/apps/{appId}/keys/{keyId}/revoke
POST /v1/developer/spaces
```

### What's Missing From The Public Docs

The published `llms.txt` does NOT enumerate:
- An explicit "demote speaker to listener" endpoint
- Webhook events for mic-mute / speaker-state-change
- A "set role" or "issue role-scoped token" endpoint

Without these, the mute-lockout rule cannot be enforced server-side. Either:
1. **Ask Juke (via nickysap) to confirm or expose those endpoints.** Best path.
2. **Do client-side enforcement only.** Detect self-mute in our UI, call `leaveSpace()` + `joinAnonymousListener()`. This works for honest clients but is bypassable.
3. **Inspect Juke's token model.** The public `POST /v1/rooms/{spaceId}/token` and the developer key model likely already mint role-scoped tokens; we may be able to issue a "listener" token to a former speaker. Need to verify with the dev team.

**This is a P0 question to lock with nickysap / Juke team before sprint kickoff.**

### Design / Branding Rules (verbatim)

> "Base color navy `#0f0f23`, accent terracotta `#D85A30`, secondary purple `#855DCD`. Maintain visible 'Powered by Juke' attribution; never bypass host permissions or hide canonical source identity."

ZAO's palette is navy `#0a1628` + gold `#f5a623` (per CLAUDE.md). The navies are close but not identical. Decision: keep ZAO gold accent on FISHBOWLZ; honor "Powered by Juke" attribution at the bottom; navy can be ZAO's `#0a1628` because Juke's spec is "Maintain attribution," not "Match exact palette." Verify with Juke before launch.

## Implementation Plan (Phase 1: Core Mute-Lockout)

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Browser (FISHBOWLZ standalone repo, Next.js)                 │
│                                                              │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │ Audience UI         │    │ Co-Host Console            │  │
│  │ - Listen anon       │    │ - Permanent mic toggle     │  │
│  │ - "Raise hand" btn  │    │ - Raised-hand queue        │  │
│  │ - SIWF on first     │    │ - "Grant mic" picker       │  │
│  │   participate       │    │ - "End their turn" button  │  │
│  └─────────────────────┘    └────────────────────────────┘  │
│                       │                       │              │
│            @juke/audio-sdk client wrapper                    │
│        + custom mute-detect + auto-demote handler            │
└───────────┬──────────────────────────────────────────────────┘
            │ HTTPS
┌───────────▼──────────────────────────────────────────────────┐
│ FISHBOWLZ server (Next.js API routes in standalone repo)     │
│                                                              │
│  /api/room/create     POST → Juke /v1/developer/spaces       │
│  /api/room/grant-mic  POST → Juke role-promote endpoint (?)  │
│  /api/room/revoke-mic POST → Juke role-revoke endpoint (?)   │
│  /api/room/hooks      webhook receiver for Juke events (?)   │
│                                                              │
│  Holds JUKE_API_KEY in env (never browser)                   │
└───────────┬──────────────────────────────────────────────────┘
            │ X-Juke-Api-Key
┌───────────▼──────────────────────────────────────────────────┐
│ api.juke.audio (Juke server + LiveKit)                       │
└──────────────────────────────────────────────────────────────┘
```

### Key Server-Side Flows

**Create room (host action):**
1. Host clicks "New FISHBOWLZ room"
2. Our `/api/room/create` calls Juke `POST /v1/developer/spaces` with title + co-host FIDs
3. Juke returns `spaceId`; we store + emit room URL

**Co-host promotion (at room create OR pre-room):**
- The 4+ co-hosts get speaker/co-host tokens at the start. They're never demoted by the mute-lockout rule.

**Audience hand-raise → grant mic:**
1. Audience taps raise-hand → SDK call `raiseHand(spaceId, true)` → Juke server
2. Juke pushes the raised hand to co-host clients (via LiveKit signaling or webhook)
3. Co-host taps "Grant mic" → our `/api/room/grant-mic` → Juke role-promote endpoint
4. Audience client receives new token → mic becomes available → speaker turn begins

**The mute-lockout (THE NEW RULE):**
1. Audience speaker taps mute (or accidentally mutes)
2. Client detects mic state transition `unmuted → muted`
3. Client calls `/api/room/revoke-mic` with their FID + spaceId
4. Server calls Juke role-revoke (endpoint TBD) → audience speaker's token becomes listener-only
5. Audience client sees role downgrade → UI shows "Raise hand again to speak"
6. (Server-side enforcement: even if client doesn't call revoke, Juke webhook on mic-mute should trigger same flow — VERIFY this hook exists)

### Phase 1 Scope

- [ ] Develop application: apply for Juke developer access at `juke.audio/developers`
- [ ] Confirm 3 open questions with Juke team (demote endpoint, webhooks, token model)
- [ ] Scaffold standalone fishbowlz repo with Next.js + `@juke/audio-sdk`
- [ ] Build audience UI (listen, raise hand, see who's speaking)
- [ ] Build co-host console (always-on mic toggle, raised-hand queue, grant/end mic)
- [ ] Implement mute-lockout: client detect + server-side revoke + (if available) webhook fallback
- [ ] Cohost identity: hardcoded list of 4-6 FIDs in env initially; tokens minted on room create

### Phase 2 (Defer)

- Tip jar (the old code had `TipButton.tsx`; re-add post-Juke baseline)
- Reactions (`sendReaction()` is in Juke SDK; UI overlay only)
- Transcripts + recap (old code had this; re-add when Juke audio recording / transcription is exposed)
- Agentic participants (Admin / ZOEY / BYOK per `project_fishbowlz_agents_design.md`) — depends on Juke webhooks + room-event APIs being available

## What To Delete From ZAOOS

Per Doc 661a (primary-surface drift) + 661h (graduation-readiness) audits + `feedback_fishbowlz_standalone_only.md`, the ZAOOS copy is stale and shouldn't drift into the new build. **All 22 files are safe to delete in a follow-up PR**:

| Path | File count | Purpose | Status |
|---|---|---|---|
| `src/app/fishbowlz/` | 4 | Old pages (page, loading, [id]/page, [id]/opengraph-image) | Delete |
| `src/app/api/fishbowlz/` | 13 | Old routes (gate-check, recap, transcripts, chat, sessions, users, rooms, export, events, invites, transcribe, webhook/privy, rooms/[id]) | Delete |
| `src/components/fishbowlz/` | 5 | Old UI components (Reactions, OnboardingModal, RoomCardSkeleton, EmptyState, TipButton) | Delete; some patterns useful as reference but not as imports |

Same pattern as the ZAOstock removal (PR #544): git tag `pre-fishbowlz-removal-2026-05-XX` for archive, middleware redirect for any leftover `/fishbowlz/*` paths (none currently per audit — verify), then delete.

## What To Reuse From The Standalone Repo

The standalone `/Users/zaalpanthaki/Documents/fishbowlz/` had (per `feedback_fishbowlz_standalone_only.md`):
- Camera / screen share
- Anonymous listen mode
- Reconnection handler
- authFetch
- guestMode
- Room filters
- Gating UI
- Transcript grouping
- Seat collapse
- AI recap

For the Juke-powered rebuild, most of the audio layer is replaced by Juke. But the OUTER LAYER (gating UI, room filters, transcript grouping, AI recap) is still valuable IF Juke exposes the audio events to build on.

**Action:** before any new code, audit the standalone repo's recent state (per the protect-the-standalone rule). The repo isn't visible from this session; need a separate worksession from inside that repo's worktree. Don't sync, don't copy.

## Open Questions To Lock With Juke (P0 Before Sprint)

1. **Is there a server-side `demote speaker to listener` endpoint?** Critical for the mute-lockout rule. If not, what's the recommended pattern (token reissue, room rejoin)?
2. **Are there webhooks for mic state changes** (unmuted/muted/permission-revoked)? Without these, mute-lockout is client-trust-only and bypassable.
3. **Token model:** Does `POST /v1/rooms/{spaceId}/token` mint role-scoped tokens? Can we mint a "listener" token for a current speaker to effectively demote them?
4. **Co-host cap:** Is there a hard limit on co-hosts per space? Zaal wants 4+, comfortably up to maybe 10. Juke's docs don't enumerate the cap.
5. **Pricing model:** The published docs don't show pricing for developer API usage. Is it free during beta? Per-space? Per-listener-minute?
6. **Recording / transcription:** Does Juke expose recorded audio + transcript via API for AI recap + post-room artifacts (the old FISHBOWLZ feature set)? If yes, what's the spec? If no, that's Phase 2 build-our-own.
7. **Co-host event-bus access:** Can a co-host's client subscribe to "audience X raised hand" events in real time without polling? Likely yes (LiveKit signaling), confirm SDK exposes the hook.

## Adjacent Insights From Other Surfaces

- **Per Doc 661h (graduation-readiness):** FISHBOWLZ was flagged P0 DELETE. With this revival, the audit's finding flips on FISHBOWLZ specifically — the new direction supersedes that finding. Note that this is the ONLY audit finding to flip in 661; the FISHBOWLZ-cleanup PR that was queued can still happen for the ZAOOS-side stale code (per "What To Delete From ZAOOS" above).
- **Per Doc 547 (Cassie validation):** "Infrastructure IS the product." FISHBOWLZ on Juke is infrastructure for The ZAO + ZAOstock + COC Concertz to host audio events. The festival use case alone justifies the build.
- **Per `project_zaostock_team_meeting.md`:** Monday 11:30am EST cobuild + Tuesday 10am EST standup. Both are recurring sync calls that could pilot FISHBOWLZ in production once stable.
- **Per Doc 660 (X content extraction):** The /fetch + /zao-research no-login chain proved valuable for grabbing Juke's `llms.txt` + `SKILL.md` immediately for this doc. That's the chain in action.

## Hard Numbers

- 22 stale ZAOOS FISHBOWLZ files (4 pages + 13 routes + 5 components), last commit 2026-04-25.
- 5 FISHBOWLZ memory files (project_fishbowlz_*, feedback_fishbowlz_*).
- Juke SDK exposes 12 methods (`joinAnonymousListener`, `startSiwfFlow`, `pollSiwfStatus`, `completeSiwfLogin`, `joinAuthenticated`, `getSpace`, `leaveSpace`, `refreshToken`, `sendReaction`, `raiseHand`, `connectAudio`, `enableMicrophone`).
- 5 public Juke endpoints + 12 developer endpoints (per llms.txt).
- 4+ co-hosts per room (Zaal's target).
- 0 platforms found that auto-demote on self-mute (Clubhouse, X Spaces, Discord Stage, Telegram Voice Chats all keep speaker role after self-mute). The pattern is novel.
- 7 open questions to lock with Juke team before sprint kickoff.

## Sources

- [Juke llms.txt](https://juke.audio/llms.txt) — primary API reference (fetched verbatim 2026-05-17)
- [Juke SKILL.md](https://juke.audio/SKILL.md) — integration skill description (fetched verbatim 2026-05-17)
- [Juke developer portal](https://juke.audio/developers) — apply for API access
- [nickysap on Farcaster](https://farcaster.xyz/nickysap) — partnership lead
- [nickysap's Substack](https://nickysap.substack.com/) — Farcaster + Juke context
- [Discord Stage Channels FAQ](https://support.discord.com/hc/en-us/articles/1500005513722-Stage-Channels-FAQ) — comparison precedent
- [Clubhouse Live Rooms guide](https://support.clubhouse.com/hc/en-us/articles/20085669217171-Creating-Live-Rooms) — comparison precedent
- [Clubhouse mod tips (Kendra Ramirez Digital)](https://kendraramirez.com/master-mod-tips-for-clubhouse/) — mod-side workflow detail
- [Twitter/X Spaces help](https://help.twitter.com/en/using-twitter/spaces) — comparison precedent
- [X Spaces hosting guide 2026 — Tweet Archivist](https://www.tweetarchivist.com/twitter-spaces-hosting-guide-2025) — mute-and-restore detail
- [How to mute X Spaces — Alphr](https://www.alphr.com/how-to-mute-twitter-spaces/) — mute mechanics detail
- ZAOOS standalone FISHBOWLZ repo path: `/Users/zaalpanthaki/Documents/fishbowlz/` (per `feedback_fishbowlz_standalone_only.md` — edit there, never sync from ZAOOS)
- Memory: `project_fishbowlz_deprecated.md` (the kill notice this doc overrides)
- Memory: `project_fishbowlz_agents_design.md` (Admin / ZOEY / BYOK three-tier agent design, Phase 2 candidate)
- Memory: `project_fishbowlz_status.md`, `project_fishbowlz_agents_design.md`, `feedback_fishbowlz_push_standalone.md`, `feedback_fishbowlz_standalone_only.md`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DM nickysap on Farcaster — share this doc, lock 7 open questions | @Zaal | DM | This week |
| Apply for Juke developer API access at juke.audio/developers | @Zaal | Account | After nickysap convo |
| Update memory: flip `project_fishbowlz_deprecated.md` → mark superseded by doc 662; add new `project_fishbowlz_revival.md` with the design summary | @Zaal | Memory update | After doc merge |
| Open follow-up PR to delete 22 stale ZAOOS FISHBOWLZ files (separate from this research PR) | @Zaal | Cleanup PR | After Juke convo locks the direction |
| Audit current state of standalone repo `/Users/zaalpanthaki/Documents/fishbowlz/` (from inside that repo's worktree) — what survives vs gets rebuilt | @Zaal | Repo audit | Before sprint kickoff |
| Decide co-host roster (initial 4-6 FIDs to seed) | @Zaal | Decision | Pre-sprint |
| Decide UX answers to the 6 open questions in "Open UX Questions To Lock Before Build" | @Zaal | Decision | Pre-sprint |
| Re-validate this doc in 60 days (Juke API surface will likely evolve) | @Zaal | Recurring check | 2026-07-17 |
