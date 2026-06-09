---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-06-09
superseded-by:
related-docs: "741, 826"
original-query: "https://x.com/MetaverseDyn/status/2062662268123328752 can you research this for me /zao-research"
tier: QUICK
---

# 827 - MetaDyn Immersive SDK

> **Goal:** Research the MetaverseDyn (MetaDyn) post Zaal forwarded - an immersive/metaverse SDK - and judge its relevance to ZAO Spaces / COC virtual events.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **WATCH, do not adopt - MetaDyn is early and tangential to ZAO's current Spaces stack** | ZAO Spaces is built on LiveKit (doc 741, primary-source endorsed by Leeward) - audio/video real-time, not 3D worlds. MetaDyn is a 3D/digital-twin SDK (Unity 6, Hyperfy, ThreeJS). Different layer. The post had 17 likes / 500 views - pre-traction. No reason to integrate now. |
| 2 | **Note the Hyperfy angle for COC Concertz / future 3D concerts** | MetaDyn targets Hyperfy (an on-chain 3D world engine) among its backends. IF ZAO ever does a 3D virtual venue for COC Concertz or ZAOstock, Hyperfy + a toolkit like MetaDyn is the lane to revisit. Park it against the COC/virtual-events roadmap. |

## Findings

The post (MetaverseDyn / @MetaverseDyn, "MetaDyn", 2026-06-04, 17 likes, ~500 views) announces:

> "Introducing the MetaDyn Platform SDK - Build Your Next-Gen Metaverse. MetaDyn SDK is a robust multi-platform Toolkit to build Immersive Spaces and Digital Twin on Unity 6, Hyperfy, and ThreeJS."

So MetaDyn is a **multi-target 3D/immersive SDK** - one toolkit emitting to three runtimes:
- **Unity 6** - the mainstream game/3D engine (heavy, native/WebGL builds).
- **Hyperfy** - on-chain/web-native 3D world engine (the crypto-metaverse lane).
- **ThreeJS** - the browser WebGL standard.

"Digital Twin" framing suggests it also targets real-space mirroring (events, venues), not just games. It's an announcement with a demo video; no docs/pricing/traction surfaced. Tiny engagement = very early.

**ZAO fit:** marginal today. ZAO's live surface is 2D real-time (LiveKit Spaces, doc 741) plus the Farcaster client. ZAO has no 3D-world product shipping. The only realistic hook is a future 3D venue for COC Concertz or a ZAOstock metaverse stage - speculative. Not a build decision; a bookmark.

## Also See

- [Doc 741](../741-pion-livekit-webrtc-stack/) - LiveKit Spaces pick (ZAO's actual real-time stack)
- [Doc 826](../../dev-workflows/826-past-inbox-nonsocial-drain/) - the inbox drain this follow-up came out of

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Bookmark MetaDyn/Hyperfy for a possible 3D COC Concertz / ZAOstock venue; re-check traction in 2-3 months | @Zaal | Watch | Q3 2026 |

## Sources

- [MetaverseDyn post (MetaDyn Platform SDK)](https://x.com/MetaverseDyn/status/2062662268123328752) `[FULL - FxTwitter; tweet text + demo video URL, 17 likes / 500 views / 2026-06-04]`
