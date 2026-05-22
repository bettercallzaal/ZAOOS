---
topic: music
type: decision
status: research-complete
last-validated: 2026-05-20
superseded-by:
related-docs: 662, 661h, 591, 547, 508
original-query: "juke integration for the zao"
tier: STANDARD
---

# 695 — Juke Integration For The ZAO (Ecosystem-Wide Map)

> **Goal:** Decide where Juke — the Farcaster-native live-audio app by nickysap — fits across the whole ZAO ecosystem, not just FISHBOWLZ. Doc 662 already covers the FISHBOWLZ-on-Juke build deeply. This doc zooms out: ZAO OS already ships its own web audio Spaces (Stream.io + 100ms, provider-adapter pattern). Juke is architecturally different — iOS-native, Farcaster-native, LiveKit transport. The question is not "replace ZAO Spaces with Juke" — it is "use Juke for the things Juke is uniquely good at, keep ZAO Spaces for the things it is good at, and steal Juke's best ideas regardless." Plus: Zaal already hosts spaces on Juke, so the partnership is live, not hypothetical.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Replace ZAO OS web Spaces (Stream/100ms) with Juke | **NO** | ZAO OS Spaces is a working web/in-app audio system with a clean provider-adapter (`AudioRoomAdapter` → `HMSRoomAdapter` / `StreamRoomAdapter`, `AudioProvider` enum). Juke's own founder says web/PWA is unsuitable for live audio — background audio dies on lock. Ripping out a working web system to bolt on a tool that is weak at web is a downgrade. |
| First Juke integration for ZAO | **Juke hosted iframe embed** | Zero API keys, one `<iframe>` tag, ships in a day. Put a "ZAO Live on Juke" surface in the ZAO OS miniapp / a nav tab. Listen-in + SIWF participation handled by Juke's UI. Lowest cost, lowest risk, immediate. |
| Apply for Juke developer API keys | **YES — after the iframe ships** | `POST /v1/developer/spaces` lets ZAO auto-create a Juke space for each recurring event (ZAOstock standups, fractal calls, COC Concertz nights). Server-side key only. Needed for programmatic + branded rooms. |
| FISHBOWLZ-on-Juke via the web SDK (doc 662's plan) | **RE-SCOPE — flag the native-vs-web gap** | Doc 662 assumed `@juke/audio-sdk` + custom web UI. But nickysap built Juke native *specifically because* web/PWA kills background WebRTC audio in seconds. A FISHBOWLZ web app on Juke's web SDK fights the exact battle Juke already lost. Re-scope: FISHBOWLZ as a room *type / co-branded format inside Juke's native app*, or accept the web SDK is listen-heavy. Lock this with nickysap. |
| Adopt Juke's FIP-2 chat pattern in ZAO OS Spaces | **YES — independent of any Juke dependency** | Juke's chat = a Farcaster cast's reply tree, fed by an ephemeral Neynar webhook. Zero chat DB, zero WebSocket text server, cross-client visible, permanent on-graph artifact. ZAO OS already uses Neynar. This is a free architecture win — steal the idea. |
| Position ZAO as a Juke flagship community | **YES** | Zaal already hosts on Juke (confirmed by @farcaster, 2026-04-24). nickysap offered to open-source the Juke codebase + SPEC.md "if there's demand." ZAO being an early anchor community = co-marketing leverage + influence over the roadmap + early access to the open-source drop. |

## What Juke Actually Is (Grounding)

Built by Nicky Sap (`@nickysap` on Farcaster). Announced 2026-03-27 in his Substack "Farcaster Was 'Dead,' So I Started Building." A 3-day build: spec on day 1, AI agent swarm (10 parallel agents) executing an 800-line `SPEC.md`, TestFlight on day 3.

Hard facts:

- **iOS-native, TestFlight open beta.** React Native + Expo bare workflow. Android "coming soon." Web is *not* a first-class path.
- **LiveKit transport** — open-source WebRTC SFU, chosen explicitly to avoid vendor lock-in as costs scale.
- **Auth = Sign In With Farcaster (SIWF/SIWN)**, EIP-4361-based. The signed message carries the requesting domain, which the Farcaster client shows at approval — closes QR-phishing.
- **Chat = Farcaster reply tree** (the "FIP-2 trick"). Host casts a space announcement; that cast's replies *are* the chat. An ephemeral Neynar webhook streams replies in live, then is torn down when the space ends. Zero chat infra. Cross-client visible. Permanent on-graph artifact.
- **No token.** nickysap stated this explicitly. Planned monetization: charge *hosts* for premium — scheduled spaces, custom links, analytics, recordings/replays, clipping. Core experience stays free.
- **Maybe open-source.** nickysap said the codebase + `SPEC.md` "could become a resource for the ecosystem… happy to explore it if there's demand." Not open yet.

### Why "native" matters (the constraint that shapes everything)

From the Substack, verbatim paraphrase: iOS kills background WebRTC connections within seconds. Live audio needs `AVAudioSession` in `.playAndRecord` mode, `UIBackgroundModes: audio` in Info.plist, and a native Swift module handling phone-call / Siri / Bluetooth interruptions. "If the audio dies when you lock your phone, nothing else matters." A PWA cannot do this.

**Implication for ZAO:** Juke's *web* SDK + iframe are real and usable — but they are best for **listen-in, lobby, and embed surfaces**, not for being the primary place a mobile user *speaks* for an hour. The strong Juke experience is the native iOS app. Any ZAO plan that routes serious mobile speaking through Juke's web layer is swimming upstream.

## What ZAO Already Has (Codebase Ground Truth)

ZAO OS already ships a full web audio-room system. This is the thing Juke does *not* replace.

| Piece | Path | Note |
|---|---|---|
| Provider router | `src/components/spaces/AudioRoomAdapter.tsx` | Routes by `room.provider`; lazy-loads one SDK per room |
| Provider adapters | `src/components/spaces/HMSRoomAdapter.tsx`, `StreamRoomAdapter.tsx` | 100ms and Stream.io implementations of the same join/leave interface |
| Provider enum | `src/lib/spaces/roomsDb.ts` (`AudioProvider`, default `'stream'`) | Currently `'stream' \| '100ms'` |
| Room create API | `src/app/api/stream/rooms/route.ts` | `provider: z.enum(['stream','100ms'])` |
| Token API | `src/app/api/100ms/token/route.ts` | Per-provider token mint |
| Spaces APIs | `src/app/api/spaces/` | `hand-raise`, `tips`, `song-request`, `chat`, `scheduled`, `leaderboard`, `stats` |
| ~40 Spaces components | `src/components/spaces/` | `HandRaiseQueue`, `MicButton`, `SpeakersGrid`, `BroadcastPanel`, `ClosedCaptions`, `FishbowlChat`, etc. |
| Audio deps | `package.json` | `@100mslive/react-sdk ^0.11.2`, `@stream-io/video-react-sdk ^1.34.1` |

The adapter pattern means a `JukeRoomAdapter` *could* slot in as a third provider — **but** see the native-vs-web caveat. Juke as a third adapter only makes sense for an *embed/listen* room type, not a full speaking room. Don't model Juke as "just another Stream/100ms."

Negative signal: a `grep` for `juke` across the bettercallzaal GitHub org returned **zero hits** (verified 2026-05-20). No ZAO repo has touched Juke yet. This integration is greenfield.

## The Five Integration Paths, Ranked

| # | Path | Effort (1-10) | Keys? | What it unlocks | Verdict |
|---|---|---|---|---|---|
| A | **Hosted iframe embed** — `https://juke.audio/embed/{spaceId}` | 2 | None | A "ZAO Live" listen-in surface in the miniapp / a nav tab. Juke renders the whole UI. | **SHIP FIRST** |
| B | **Developer API — server-side room creation** — `POST /v1/developer/spaces` with `X-Juke-Api-Key` | 4 | Server only | Auto-create branded Juke spaces for recurring ZAO events (standups, fractal, COC). | **SHIP SECOND** |
| C | **SDK + custom UI** — `@juke/audio-sdk` | 8 | Server only | doc 662's FISHBOWLZ build. Custom moderation (mute-lockout). | **RE-SCOPE — native-vs-web gap** |
| D | **Adopt the FIP-2 chat pattern** in ZAO OS Spaces | 3 | None (uses existing Neynar) | Kill ZAO's chat DB for Spaces; cross-client, on-graph chat. No Juke dependency. | **DO IN PARALLEL** |
| E | **ZAO as Juke flagship community** (co-marketing, roadmap input, OSS access) | 1 | None | Partnership leverage, early open-source drop, influence. | **ONGOING** |

### Path A — the iframe (do this first)

```html
<iframe
  src="https://juke.audio/embed/{spaceId}"
  title="Juke live audio space"
  allow="autoplay; microphone"
  style="width:100%;max-width:480px;height:720px;border:0;border-radius:24px;"
></iframe>
```

No API key. The iframe handles room metadata, anonymous listening, SIWF sign-in, reactions, hand-raise, mic control, LiveKit connection. Honor the "Powered by Juke" attribution (non-negotiable per Juke's branding rules). ZAO's gold `#f5a623` accent can stay; Juke's spec is "keep attribution," not "match exact palette."

Where it lands: a "ZAO Live" tab or card in the ZAO OS Farcaster miniapp (Quick Auth works in miniapp context per Juke's auth ladder). The miniapp is the right home because Juke is Farcaster-native and the ZAO miniapp audience is already Farcaster-signed-in (see doc 591).

### Path B — developer API for recurring events

ZAO runs recurring audio-worthy events: ZAOstock Monday 11:30am cobuild + Tuesday 10am standup, the weekly fractal call (Mondays 6pm EST), COC Concertz nights. A small server route — `/api/juke/space` — calls `POST /v1/developer/spaces` to mint a branded Juke space on a schedule, then surfaces the join link in Telegram / the miniapp. Key lives server-side only (`JUKE_API_KEY`), never in browser/bundle/iframe params — Juke's docs are explicit on this.

Apply at `juke.audio/developers`: sign in → request access → await approval → create app → create key (secret shown once).

### Path C — the FISHBOWLZ re-scope

Doc 662 designed FISHBOWLZ as a standalone Next.js app using `@juke/audio-sdk` + a custom web UI to enforce the novel "mute-lockout" moderation rule. That doc's own open question #1 ("is there a server-side demote endpoint?") is still unanswered — and this doc adds a second, larger problem doc 662 under-weighted:

**FISHBOWLZ-as-a-web-app on Juke's web SDK inherits the exact background-audio failure nickysap built native to escape.** A web FISHBOWLZ where mobile users speak for an hour will drop audio on screen-lock. That is not a moderation-rule problem — it is a platform problem.

Re-scope options to put to nickysap:
1. FISHBOWLZ becomes a **room format / template inside Juke's native app** (best mobile audio, Juke owns the hard native bits, ZAO owns the format + moderation rules if Juke exposes role hooks).
2. FISHBOWLZ web app accepts that its web tier is **listen + lobby + recap**, and speaking is "open the Juke app." Honest about the constraint.
3. FISHBOWLZ stays on ZAO's existing Stream/100ms web stack (which *is* built for web) and Juke is used only for the Farcaster-native discovery + the FIP-2 chat. This keeps the working web speaking path.

Doc 662's 7 open questions for nickysap still stand and should be asked alongside this re-scope. Doc 662 is not wrong — it just needs the native-vs-web reality folded in before any code lands.

### Path D — steal the FIP-2 chat pattern

This is the highest-leverage *idea* in the whole research, and it needs no Juke dependency at all. ZAO OS Spaces currently has `src/app/api/spaces/chat` — a chat backend. Juke's pattern replaces that entire backend with: host's space-announcement cast → reply tree → ephemeral Neynar webhook streaming replies into the room UI → webhook torn down at space end. Result: no chat DB, no WebSocket text server, chat visible from *any* Farcaster client, and a permanent on-graph thread artifact after the space ends. ZAO already runs Neynar. This is a clean refactor target for ZAO OS Spaces independent of everything else here.

### Path E — flagship community

Zaal already hosts spaces on Juke — confirmed publicly by the `@farcaster` account on 2026-04-24: "great convo between @nickysap x @zaal x @rish love seeing you host these on @jukeaudio!" A recorded space exists (`x.com/nicky_sap/status/2047770959403516069`). The partnership is not hypothetical. Being a visible early anchor community gives ZAO co-marketing and a seat at the roadmap table — and first dibs if/when nickysap open-sources the Juke codebase + `SPEC.md`.

## Risks To Weigh

| Risk | Severity | Note |
|---|---|---|
| **Farcaster may build native audio spaces itself** | Medium-High | On 2026-04-25 rish (Neynar) said `@degeneer03` (fireside), `@nickysap` (juke), `@moe` (spaces) all told him Farcaster should have native audio — and that Farcaster client "might build" it. If the Farcaster monolith ships native spaces, third-party audio apps including Juke lose their moat. Mitigation: ZAO's low-cost paths (iframe, FIP-2 chat) survive a pivot; don't over-invest in Juke-specific custom code (Path C) until this resolves. |
| **Juke is a 1-person, ~2-month-old, beta project** | Medium | TestFlight beta since late March 2026. One developer. No published pricing, SLA, webhooks, recording API, or rate limits (confirmed absent from `llms.txt`). ZAO should not make Juke a hard dependency for anything mission-critical (e.g. paid ZAOstock events) until it has a track record. |
| **Web SDK background-audio limitation** | Medium | Covered above — affects Path C. Not a bug, a platform constraint. |
| **No demote/role-revoke endpoint, no webhooks** | Medium | doc 662 open question #1-2. Blocks server-side enforcement of custom moderation. Lock with nickysap. |
| **`@juke/audio-sdk` not published to npm** | Low | SKILL.md says "when published… until then copy `lib/juke-embed-sdk.ts`." A grep for `juke-embed-sdk` across GitHub returned zero public hits (2026-05-20). The iframe path (A) has no such dependency. |
| **Crowded field** | Low | FarHouse, Fireside (degeneer03), Spaces (moe) all exist. Juke's edge is native background audio + the FIP-2 chat. ZAO's bet rides on those holding. |

## Juke API Surface (verified 2026-05-20, unchanged from doc 662's 2026-05-17 fetch)

Re-fetched `juke.audio/llms.txt` + `juke.audio/SKILL.md` today — **identical** to doc 662's capture. Stable for now.

- **3 integration paths:** hosted iframe (no keys) / SDK custom UI (`createJukeEmbedSdk` from `@juke/audio-sdk`) / developer keys (`X-Juke-Api-Key`, server-side).
- **12 SDK methods:** `getSpace`, `joinAnonymousListener`, `startSiwfFlow`, `pollSiwfStatus`, `completeSiwfLogin`, `joinAuthenticated`, `leaveSpace`, `refreshToken`, `sendReaction`, `raiseHand`, `connectAudio`, `enableMicrophone`.
- **5 public REST endpoints:** `GET /v1/rooms/{id}`, `POST /v1/rooms/{id}/anonymous-join`, `POST /v1/rooms/{id}/join`, `POST /v1/rooms/{id}/raise-hand`, `POST /v1/rooms/{id}/token`.
- **10 developer endpoints** under `/v1/developer/*` incl. `POST /v1/developer/spaces` (room creation). Rotate/revoke require SIWF within the last 5 minutes.
- **Permission ladder:** public metadata → anonymous listen → SIWF participate → Quick Auth in miniapps → native iOS → speaking (host-promoted only). Anonymous token: `can_subscribe=true`, `can_publish=false`.
- **Branding (mandatory):** navy `#0f0f23`, terracotta `#D85A30`, purple `#855DCD`; keep "Powered by Juke" attribution; never bypass host permission.
- **Still absent from docs:** pricing tiers, SLA, webhooks, recording/transcription, rate limits.

## Hard Numbers

- Juke: built in **3 days**, **10** parallel AI agents, **800**-line `SPEC.md`, announced **2026-03-27**.
- ZAO OS Spaces: **2** existing audio providers (Stream.io, 100ms), **~40** components in `src/components/spaces/`, **0** Juke references in the entire bettercallzaal GitHub org.
- Juke API: **12** SDK methods, **5** public + **10** developer endpoints, **0** webhooks / recording endpoints published.
- Integration path A effort: **2/10**. Path D (FIP-2 chat): **3/10**. Path C (custom SDK FISHBOWLZ): **8/10**.
- **1** developer behind Juke; **0** published pricing.
- **5** integration paths identified; recommended order: A → B → D (parallel) → C (re-scoped) → E (ongoing).

## Also See

- [Doc 662](../662-fishbowlz-revival-juke-mute-lockout/) — FISHBOWLZ on Juke, the mute-lockout moderation model, the 7 open questions for nickysap. This doc adds the native-vs-web caveat to 662's Path C.
- [Doc 661h](../../dev-workflows/661-zaoos-codebase-audit-may-2026/661h-graduation-readiness/) — graduation-readiness audit; FISHBOWLZ stale-code finding.
- [Doc 591](../../farcaster/591-miniapp-production-audit/) — ZAO OS Farcaster miniapp; the home for the Path A iframe.
- [Doc 547](../../community/547-cassie-advisor-ai-human-coordination-validation/) — Cassie validation: "infrastructure IS the product"; Juke audio is infra for ZAO/ZAOstock/COC events.
- [Doc 508](../../dev-workflows/508-creator-infra-mini-apps-token-burn-signals-apr25/) — creator infra + mini apps context.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Build the Path A "ZAO Live on Juke" iframe surface in the ZAO OS miniapp (one of Zaal's existing Juke `spaceId`s) | @Zaal | PR | This sprint |
| DM nickysap — share this doc + doc 662; raise the native-vs-web FISHBOWLZ re-scope and doc 662's 7 open questions in one thread | @Zaal | DM | This week |
| Apply for Juke developer API access at `juke.audio/developers` | @Zaal | Account | After nickysap convo |
| Spike: refactor `src/app/api/spaces/chat` toward the FIP-2 reply-tree pattern (Path D) — scope a follow-up doc | @Zaal | Investigation | Next sprint |
| Watch the "Farcaster may build native spaces" signal (rish, 2026-04-25) — re-check before any Path C investment | @Zaal | Recurring check | Before FISHBOWLZ sprint |
| Update memory: add `project_juke_integration.md` (ecosystem map) linking `project_fishbowlz_revival` / doc 662 | @Zaal | Memory update | After doc merge |
| Re-validate this doc in 45 days — Juke is a fast-moving beta | @Zaal | Recurring check | 2026-07-04 |

## Sources

- [Juke llms.txt](https://juke.audio/llms.txt) — primary API reference, re-fetched verbatim 2026-05-20 `[FULL]`
- [Juke SKILL.md](https://juke.audio/SKILL.md) — integration recipes, re-fetched verbatim 2026-05-20 `[FULL]`
- [Juke landing page](https://juke.audio/) — "Live Audio on Farcaster," iOS TestFlight beta `[FULL]`
- ["Farcaster Was 'Dead,' So I Started Building" — Nicky Sap, Substack, 2026-03-27](https://nickysap.substack.com/p/farcaster-was-dead-so-i-started-building) — Juke origin story, native-vs-web rationale, FIP-2 chat trick, monetization plan, possible open-source `[FULL — fetched via exa web_fetch]`
- [GM Farcaster ep361, 2026-04-27](https://www.gmfarcaster.com/episodes/ep361) — community source; the rish quote on Farcaster maybe building native spaces (degeneer03/nickysap/moe), and the @farcaster cast confirming Zaal hosts on Juke `[FULL — fetched via exa web_fetch]`
- [Recorded zaal x nickysap x rish space](https://x.com/nicky_sap/status/2047770959403516069) — referenced by the @farcaster cast above; recorded audio, not transcribed `[PARTIAL — audio artifact, existence confirmed via the @farcaster cast, contents not transcribed]`
- ZAO OS codebase: `src/components/spaces/AudioRoomAdapter.tsx`, `src/lib/spaces/roomsDb.ts`, `src/app/api/stream/rooms/route.ts`, `src/lib/portal/destinations.ts`, `package.json` `[FULL]`
- GitHub org search `bettercallzaal/` for `juke` — zero hits, 2026-05-20 (negative signal: greenfield) `[FULL]`
- [Doc 662](../662-fishbowlz-revival-juke-mute-lockout/README.md) — internal, the FISHBOWLZ-on-Juke decision doc this doc extends `[FULL]`
