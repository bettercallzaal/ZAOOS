---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-07-14
related-docs: 984, 991, 1092, 1094
original-query: "Farcaster protocol updates relevant to zaalcaster: channels going protocol-level (raised on the 2026-07-14 Adrian call), FIDs for AI agents/droids (Zaal wants to write a FIP about this), and any Sign In With Farcaster / SIWN changes since PR #90 was built (~2026-05)."
tier: STANDARD
---

# 1094c - Farcaster protocol updates: channels, agent FIDs, SIWN (2026-07-14)

> **Goal:** Three specific threads raised on the 2026-07-14 Adrian call (doc 1092) - channels moving to protocol level, FIDs for AI agents/droids, and SIWN/Auth Kit changes since zaalcaster's PR #90 was built. Not a general Farcaster survey.

## Key Decisions

| # | Decision | Recommendation | Reasoning |
|---|----------|----------------|-----------|
| 1 | Zaal's planned FIP about "channels going protocol-level" | WRITE IT - no existing proposal covers this | No active FIP or protocol-team proposal found for moving channel metadata/follows/settings on-protocol. Farcaster's own docs explicitly leave the door open ("channels may be ported to the protocol in the future... or they may be removed entirely") but nothing is drafted. This is genuinely open ground, not duplicate work. |
| 2 | Zaal's planned FIP about "giving FIDs to droids" | DO NOT WRITE - the capability already exists, no FIP needed | Confirmed: Clanker's own docs describe droids as already having "own Farcaster account" today, and Farcaster's ID Gateway already lets any entity (human or agent) register a FID via standard on-chain flows - a March 2026 Farcaster Agent skill update automates this for agents specifically. Redirect Zaal's energy toward the channels FIP instead, or toward a narrower proposal (e.g. agent-FID *discoverability/labeling* conventions) if the real gap is "how do users tell a droid's FID from a human's," not "can droids have FIDs." |
| 3 | zaalcaster's SIWN implementation (PR #90) | NO ACTION NEEDED - no breaking changes found since it was built | The SIWN GitHub repo (neynarxyz/siwn) shows no 2026 releases at all; last tagged version (v1.3.0) predates this year. The widget/flow PR #90 implemented is still current. |

## Findings

### Channels -> protocol level: no active proposal

Channels today are experimental/app-layer: channel CASTS get protocol-level support via FIP-2 ("flexible targets for messages"), but channel metadata, follow lists, and moderation settings live in the client (Farcaster's own servers), not on the Farcaster Hub protocol. Farcaster's own documentation is explicit that this is an open question, not a committed roadmap item.

A October 2025 ecosystem analysis ("Farcaster in 2025: The Protocol Paradox") found Farcaster's own channel development attention going toward channel-specific tokens, rewards, leaderboards, and governance - i.e. the Empire Builder / Clanker layer this doc's sibling docs (1094a/b) already cover - rather than toward protocol-level channel primitives. Read together: Adrian's framing on the call ("Farcaster is trying to lean back into channeling, bring channels back") is about channels-as-a-product-surface regaining attention, not a signal that protocol-level channels are imminent.

### FIDs for agents/droids: already live, not a gap

Two independent confirmations that this already works today:
1. Clanker's own docs describe a Droid as shipping with "its own Farcaster account" as a baseline feature, not a proposed one.
2. A Farcaster Agent skill (dated 2026-03-16) documents agents autonomously registering FIDs and signing keys and posting casts, using Farcaster's existing ID Gateway / on-chain registration contracts - the same registration path any human account uses.

If there's a REAL gap here worth a FIP, based on this research it's more likely to be about labeling/discoverability (how a human tells "this FID is a bot" from the protocol level, not just a client-side badge) than about registration access, which is already open.

### SIWN / Farcaster Auth Kit: no breaking changes found since ~May 2026

| Change | Date | Breaking for zaalcaster? |
|--------|------|---------------------------|
| OAuth 2.0 support for SIWN (backend-driven, no client-side token exposure) | Announced 2024-10-31 (Neynar dev call), status since unclear | No - opt-in addition, not a replacement |
| SIWN v1.3.0 (current widget, `NeynarSigninButton`, `presentationStyle` prop) | 2024-06-04, no later GitHub release found | This is what PR #90 already implements |
| Auth Address support (FIP-11 / "Farcaster Connect") | In progress, no ship date confirmed | Only if zaalcaster later adopts `@farcaster/auth-client` v0.7.0+ directly (it doesn't - it uses Neynar's SIWN widget, not the raw Auth Kit) |

The neynarxyz/siwn GitHub repo shows zero 2026 releases - the exact script/widget PR #90 loads (`https://neynarxyz.github.io/siwn/raw/1.2.0/index.js`) has had no breaking update in the relevant window.

## Also See

- [Doc 984](../../../984-farcaster-ecosystem-recap-jul2026/) - the broader Farcaster ecosystem recap this doc's channels/FID findings extend.
- [Doc 1092](../../1092-zaal-adrian-empire-builder-deep-dive-jul14/) - the call that raised all three threads researched here.
- zaalcaster PR #90 (`bettercallzaal/zaalcaster`) - the SIWN implementation confirmed still-current here.
- [Doc 1094](../) - hub doc.

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|-------------------|
| Draft the channels-protocol-level FIP (the genuinely open one) | @Zaal | Doc / FIP draft | 2026-07-28 | A draft FIP document, either in farcasterxyz/protocol discussions or a ZAOOS research doc first |
| Drop the agent-FID FIP idea; if a real gap exists reframe it as agent-labeling/discoverability and re-scope | @Zaal | Decision | 2026-07-17 | Confirmed in a chat reply or memory update - no code/doc action needed beyond the decision itself |
| No action needed on SIWN - re-check only if Neynar announces a 2026 SIWN release | @Zaal | Monitor | wontfix (conditional) | N/A unless triggered |

## Sources

- [Farcaster Channels documentation](https://docs.farcaster.xyz/learn/what-is-farcaster/channels) [FULL]
- [Farcaster in 2025: The Protocol Paradox](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/) [FULL]
- [Clanker Documentation (droid FID claim)](https://clanker.gitbook.io/documentation) [FULL]
- Farcaster Agent skill, "Termo" (2026-03-16 update) [PARTIAL - agent-produced summary, not the raw skill source verified independently]
- [fid-forge FID registration API](https://fidforge.11211.me/) [PARTIAL - referenced as evidence agent-FID registration tooling exists, not independently exercised]
- [SIWN GitHub releases](https://github.com/neynarxyz/siwn) [FULL - confirms no 2026 release]
- [SIWN documentation, Neynar](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) [FULL]
- [Neynar dev call 2024-10-31 (OAuth for SIWN)](https://neynar.com/blog/neynar-dev-call-103124) [FULL]
- [FIP-11: Sign in with Farcaster](https://github.com/farcasterxyz/protocol/discussions/110) [FULL]
- [Farcaster Connect discussion](https://github.com/farcasterxyz/protocol/discussions/204) [FULL]
