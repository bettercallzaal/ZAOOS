---
topic: farcaster
type: decision
status: awaiting-zaal
created: 2026-08-22
last-validated: 2026-08-22
board-task:
related-docs: "1425-wavewarz-farcaster-miniapp-spec, 2374-farcaster-operator-crisis-aug2026, 2379-wavewarz-public-repos-aug2026, 2313-farcaster-auth-primitives-sparkz"
original-query: "WaveWarZ miniapp spec (doc 1425) — assess if it can ship before ecosystem restructures (doc 2374 action item, due 2026-08-25)"
tier: STANDARD
---

# 2380 - WaveWarZ Farcaster Miniapp: Ship Assessment (Aug 2026)

> **Context:** Doc 1425 (July 2026) specified the WaveWarZ Farcaster miniapp with an
> Aug 1-15 build window and Aug 15 launch with Juke MAIN event. It is now Aug 22. The
> window has elapsed. No miniapp code exists in any public WaveWarZ repo (doc 2379).
> Doc 2374 action item (due Aug 25): assess if it can ship before the Farcaster
> ecosystem restructures following the Neynar operator announcement (Aug 17, 2026).

## Verdict

**Yes, it can still ship. The Oct 3 ZAOstock window is 41 days out. That is enough for V1.**

The Farcaster operator crisis makes this MORE urgent to ship, not less. The miniapp SDK is fully protocol-level — no dependency on Neynar's API or whatever operator succeeds them. The competitive window (Bracket confirmed as top-used miniapp, no music battle equivalent live) is still open. The spec is complete. The only missing piece is a builder who starts.

The Aug 15 window was missed. The Oct 3 window must not be.

## Updated Situation (Aug 22, 2026 vs July 2026 Spec)

| Factor | July 2026 (doc 1425) | Aug 22, 2026 |
|--------|---------------------|--------------|
| Operator landscape | Neynar stable | Neynar seeking new operator (Aug 17) |
| Miniapp SDK | Protocol-level (assumed) | Protocol-level CONFIRMED (doc 2313 addendum) |
| Bracket (competition) | Referenced as emerging | CONFIRMED as one of top-used miniapps (doc 2374) |
| Aug 15 launch target | Future | MISSED — no code exists |
| Hurricane build | Expected Aug 1-15 | Did not happen (no public repo) |
| Next window | Aug 15 (MAIN event) | Oct 3 ZAOstock festival (41 days) |
| Frame/miniapp SDK risk | Low | Low (unchanged — operator-agnostic) |

## Farcaster Operator Risk for the Miniapp: NONE

The specific risk that must be ruled out: does the Neynar operator transition affect WaveWarZ's ability to ship and run a Farcaster miniapp?

**Answer: No.** Reason:

1. **Frame/miniapp rendering is protocol-level.** The miniapp SDK (frames v2 / miniapps spec) is governed by the Farcaster protocol, not by any operator. Clients (farcaster.xyz, third-party clients) render miniapps from the cast embed — the operator controls the app experience, not the protocol rules.

2. **Cast publishing is protocol-level.** Publishing the cast that embeds the miniapp goes through a hub (ZOL uses hub-api.neynar.com, which has a 1-line swap path per doc 2378). Even if Neynar's hub goes down, the cast can be published through any public hub.

3. **Miniapp auth (Quick Auth JWT) is protocol-level.** Doc 1425 spec requires wallet auth. Doc 2313 confirmed: Quick Auth JWT is issued by `auth.farcaster.xyz` (protocol, not Neynar). SIWF via auth-kit is also protocol-level. Zero Neynar dependency.

4. **Miniapp discovery may change.** If a new operator changes how miniapps are discovered in farcaster.xyz, the browse tab could be reshuffled. This is the ONLY real risk — and it's reputational (would need to re-surface in a new operator's discovery layer), not technical (the miniapp itself keeps working).

**Risk verdict:** SAFE to build now. An ecosystem restructure might require re-submission to a new operator's registry, but will not break a deployed miniapp.

## What Changes About the Build

Doc 1425 spec is still valid. The core screens (Battle Preview → Bet Input → Wallet Connect → Bet Confirmed → Battle Result) are unchanged. The required API endpoints are unchanged.

**What's different now:**

1. **Builder path:** Hurricane was the designated builder (doc 1425 "for Hurricane"). No progress was made. Options now:
   - **Option A:** Claude scaffolds the miniapp skeleton (Next.js + Farcaster frames SDK + WaveWarZ API client) as a starting point, Hurricane or another developer completes it. Estimated scaffold: 2-3 hours of Claude work → reviewer-ready skeleton.
   - **Option B:** Find a different developer to build it in the ZAO ecosystem or via the co-founder search (CandyToyBox/wavewarz-base is already recruiting — could scope miniapp as part of the pitch).
   - **Option C:** Zaal builds it directly. The spec is complete and the stack is familiar (Next.js, OnchainKit). V1 is ~50-100 lines of frames SDK + 3 WaveWarZ API calls.

2. **API readiness:** Doc 1425 specifies 5 endpoints (`/battles/active`, `/battles/{id}`, `/battles/{id}/result`, `/battle/bet`, `/artists/{id}`). Whether these exist on the Solana API (wavewarz.info) is unverified. This is the first thing to check.

3. **ZAOscout connection:** `bettercallzaal/ZAOscout` has "WaveWarZ stats + battles" scrapers. If the API endpoints aren't built, the scraper data could substitute for read-only V1 (no betting — just Battle Preview display). That's a leaner V1.

## Updated Timeline for Oct 3

| Task | Time | By When |
|---|---|---|
| Verify WaveWarZ API endpoint availability | 30 min | Aug 23 |
| Decision: build path (Claude scaffold / Hurricane / Zaal) | 30 min | Aug 24 |
| Scaffold V1 codebase (Option A: Claude does this) | 2-3h | Aug 25 |
| API integration + testing | 2 days | Aug 28 |
| Farcaster miniapp manifest + domain verification | 2h | Aug 28 |
| Test with Farcaster dev tools (warpcast.com/~/developers) | 1 day | Aug 29 |
| ZOE posts first miniapp-enabled cast | 1h | Aug 30 |
| Live for ZAOstock battle cast | — | Oct 3 |

**This is achievable.** The schedule has 33 days of buffer after Aug 30.

## What Zaal Must Decide

**DECISION A:** Is Hurricane still the builder? If not, who is?
- [ ] Claude scaffolds skeleton + Hurricane finishes
- [ ] Claude scaffolds skeleton + Zaal finishes
- [ ] Hurricane builds from scratch (need to re-engage)
- [ ] Add to Base co-founder brief

**DECISION B:** V1 scope — bet-enabled or view-only?
- [ ] Full V1 (bet flow + wallet auth) — requires `/battle/bet` POST endpoint live
- [ ] View-only V1 (battle preview + link to wavewarz.com to bet) — no API dependency, fastest to ship

View-only V1 is the safer first bet: it works even if the bet API isn't ready, ships faster, still hits the Farcaster distribution goal (cast engagement + click-through), and adds real betting in V2 once the API is verified.

**DECISION C:** Does Claude scaffold the codebase this session?
- [ ] Yes — produce a minimal Next.js frames v2 skeleton (PR to a new repo or fork of CandyToyBox/wavewarz-base)
- [ ] No — Zaal will engage Hurricane first

## Also See

- [Doc 1425](../1425-wavewarz-farcaster-miniapp-spec/) — the original spec (screens, API endpoints, V1 scope)
- [Doc 2374](../2374-farcaster-operator-crisis-aug2026/) — Farcaster operator crisis + why miniapp is urgent
- [Doc 2379](../../wavewarz/2379-wavewarz-public-repos-aug2026/) — confirmed no miniapp code in any public repo
- [Doc 2313](../2313-farcaster-auth-primitives-sparkz/) — Quick Auth JWT + SIWF are protocol-level (operator-agnostic)

## Sources

- [INTERNAL] Doc 1425 — WaveWarZ Farcaster miniapp spec (July 2026)
- [INTERNAL] Doc 2374 — Bracket confirmed as top-used miniapp; miniapp SDK is operator-agnostic
- [INTERNAL] Doc 2379 — confirmed zero public miniapp code as of 2026-08-22
- [INTERNAL] Doc 2313 — Quick Auth JWT + SIWF are protocol-level (auth.farcaster.xyz, not Neynar)
- [INTERNAL] Doc 2378 — ZOL hub submission has a 1-line swap path for any operator transition
