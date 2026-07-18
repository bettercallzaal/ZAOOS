---
topic: farcaster, protocol
type: fip-draft
status: draft
last-validated: 2026-07-18
related-docs: 1094c-farcaster-protocol-updates, 984-farcaster-ecosystem-recap-jul2026, 1490-creator-coins-ecosystem-jul2026, 1491-clanker-empire-space-prep-jul23
action-owner: Zaal
action-deadline: 2026-07-28
original-query: "Draft FIP: Farcaster channels going protocol-level — context, proposed approach, and open questions for Zaal's submission to farcasterxyz/protocol"
tier: STANDARD
---

# 1495 — Draft FIP: Farcaster Channels at Protocol Level

> **Goal:** Provide the research foundation and a structured pre-draft that Zaal can convert into a formal FIP submission at `github.com/farcasterxyz/protocol/discussions` by 2026-07-28. This doc records why the proposal is needed, what it would specify, and what open questions the Farcaster team would need to answer. Action from doc 1094c (decision #1: "Write it — no existing proposal covers this").

---

## Why This Matters for ZAO

Every ZAO channel — /wavewarz, /sparkz, /zaostock, /zal — currently exists entirely on Warpcast's servers. If Warpcast changes its channel model, disables a channel, or goes down, the community substrate disappears. There is no hub-level record of who follows /wavewarz.

A protocol-level channel would change that:
- **Any Farcaster client** (zaalcaster, miniapps, WaveWarZ frames) could query channel membership from the hub — not from a Warpcast API call.
- **Channel ownership could be provable on-chain**, the same way FID ownership is provable via the ID Registry.
- **Sparkz creator communities** could live in protocol-level channels: the creator registers their channel, followers are on-hub, and any client respects them — not just Warpcast.

This is the long-term foundation for ZAO's "community-as-substrate" model. The FIP itself won't ship tomorrow; the value is in planting the flag, gathering Farcaster team feedback, and being on record when they eventually do address this.

---

## Current State of Channels (What Exists Today)

| Layer | What is protocol-level | What is app-layer only |
|-------|------------------------|------------------------|
| Channel casts | FIP-2 supports `parent_url` on `CAST_ADD` messages, letting casts target a channel URL. This is on the hub. | — |
| Channel follows | NOT on hub. Farcaster's servers store who follows which channel. | You must call Warpcast's API to get channel followers. |
| Channel metadata | NOT on hub. Channel name, description, image are in Warpcast's DB. | Any change Warpcast makes to channel metadata is invisible to other clients. |
| Channel ownership | NOT on-chain. Warpcast controls who can moderate a channel. | No on-chain provable channel ownership exists. |
| Channel creation | NOT on-chain. Creating /wavewarz required creating it in Warpcast's UI. | No trustless channel registry. |

Farcaster's own docs acknowledge this explicitly: *"channels may be ported to the protocol in the future... or they may be removed entirely."* This is the gap the FIP addresses.

---

## Proposed FIP: Channel Registry + On-Hub Follows

### FIP Title (proposed)
**FIP-XX: Protocol-Level Channel Registration and Membership**

### Summary (one paragraph)
Add a `ChannelRegistry` contract to Base (parallel to the existing `IdRegistry`) where anyone can register a unique channel key (e.g., `wavewarz`), link it to their FID, and set a canonical metadata URI. Add two new hub message types — `CHANNEL_FOLLOW` and `CHANNEL_UNFOLLOW` — analogous to the existing `LINK_ADD`/`LINK_REMOVE` types. This makes channel ownership trustless and channel membership verifiable by any Farcaster hub client without depending on Warpcast's API.

### Motivation
1. **Client diversity:** As non-Warpcast clients (zaalcaster, custom miniapps, frames) grow, they need to query channel membership without an API dependency on a specific client's server.
2. **Creator sovereignty:** A creator who builds a community in /their-channel today cannot own that channel in a provable way. Protocol-level registration changes this.
3. **Composability:** On-chain channel ownership enables token-gating at the protocol layer: "only token holders can cast in this channel" becomes an on-chain permission, not a client-enforced rule.
4. **Alignment with FIP-2:** FIP-2 already put channel *casts* on the hub (via `parent_url`). Channel membership is the natural complement.

### Specification (draft — for Farcaster team to finalize)

#### Part 1: ChannelRegistry contract (on Base)

```
ChannelRegistry {
  // channel_key → {fid_owner, metadata_uri, created_at, transfer_locked_until}
  mapping(string => ChannelRegistration) public channels;
  
  function register(string calldata channel_key, uint256 fid, string calldata metadata_uri) external;
  function transfer(string calldata channel_key, uint256 new_fid) external;
  function setMetadata(string calldata channel_key, string calldata metadata_uri) external;
  
  event ChannelRegistered(string indexed channel_key, uint256 indexed fid, string metadata_uri);
  event ChannelTransferred(string indexed channel_key, uint256 indexed new_fid);
}
```

- `channel_key`: lowercase alphanumeric + hyphens, max 64 chars (matches current Warpcast channel IDs).
- `fid_owner`: the FID that registered the channel. Controls metadata and transfers.
- `metadata_uri`: IPFS CID or HTTPS URL pointing to a JSON blob with name, description, image URL, rules.
- Registration is first-come-first-serve (no auction in v1). Existing channels get a migration window.

#### Part 2: Hub message types

Two new `MessageType` values:

```
CHANNEL_FOLLOW = 12      // analogous to LINK_ADD
CHANNEL_UNFOLLOW = 13    // analogous to LINK_REMOVE
```

Message body:
```protobuf
message ChannelFollowBody {
  string channel_key = 1;   // e.g., "wavewarz"
}
```

Validation rules:
- `channel_key` must exist in the ChannelRegistry at message timestamp.
- Signed by the follower's signer (same signing model as all hub messages).
- Stored in the hub's on-disk store, queryable by channel key.

#### Part 3: Migration path

- Warpcast exports all existing channel registrations and follows as of a cutoff block.
- A migration contract lets existing channel creators claim their channel via FID verification (sign a message from their FID to claim).
- Legacy `parent_url` channel casts remain valid — no breaking change to FIP-2.
- 90-day migration window; unclaimed channels become open for registration after that.

### What Changes for Clients

| Client behavior | Today | After FIP |
|-----------------|-------|-----------|
| "Who follows /wavewarz?" | API call to Warpcast's servers | Hub query: `CHANNEL_FOLLOW` messages with `channel_key = "wavewarz"` |
| "Does Zaal own /wavewarz?" | Check Warpcast's channel settings | On-chain: query `ChannelRegistry.channels["wavewarz"].fid_owner` |
| "What's /wavewarz's description?" | Warpcast API | IPFS/HTTP fetch from `metadata_uri` in registry |
| "Is this a valid channel cast?" | FIP-2 `parent_url` check | Same — no change to cast validation |

---

## Open Questions for the Farcaster Team

These are the questions that would make or break the proposal. Ideally raise them in the Discussion thread when filing.

1. **Namespace collisions:** `/wavewarz` is already a Warpcast channel. How does migration handle cases where the registered FID doesn't match who Warpcast considers the owner today? (E.g., if Warpcast created the channel on behalf of a user who doesn't have their FID registered to a key they control.)

2. **Scale:** Current Warpcast has ~10,000+ channels. A migration contract and hub message type needs to handle this volume at hub sync time. Is the approach to index `CHANNEL_FOLLOW` messages per-channel, or is there a lighter-weight approach (e.g., only registering ownership on-chain, leaving follows as optional)?

3. **Permissions and moderation:** The current model lets channel moderators remove casts and ban users. The FIP draft above doesn't spec protocol-level moderation. Should v1 skip permissions entirely (just ownership + follows), or include a permission list?

4. **Metadata URI trust:** If metadata is at an IPFS URI, clients need to resolve it. If it's HTTPS, it's a centralization point. Does the Farcaster team prefer IPFS CID (immutable) or HTTPS with change detection?

5. **Token-gated channels:** Is this FIP the right time to spec channel-level access control (e.g., "must hold token X to cast here"), or should that be FIP-XX+1 built on this foundation?

6. **Snapchain impact:** With Snapchain now live (zero-cost signers), is a hub-level `CHANNEL_FOLLOW` message type viable without spam concerns? Or does the follow action need to be gated (e.g., on-chain payment or FID age)?

---

## Strategic Framing: Why File This Now

The context from Adrian's 2026-07-14 call (doc 1092) was "Farcaster is trying to lean back into channeling, bring channels back." The Farcaster ecosystem recap (doc 984) confirmed channels are product-priority. Filing a FIP now means:

1. Zaal is *ahead* of the protocol team on this specific proposal — genuinely open ground.
2. The discussion thread will surface whether Farcaster team has something already in progress that wasn't public.
3. If they do have something in progress, being early earns a voice in the design.
4. If they don't, Zaal's proposal starts the clock and creates a feedback loop with the team.

The FIP doesn't have to be perfect. It needs to be legible, earnest, and specific enough that the Farcaster team can respond with "yes/no/here's what we're actually doing." A one-pager from a builder is worth more than no proposal.

---

## How to Submit

1. Go to `github.com/farcasterxyz/protocol/discussions`
2. Create a new Discussion: category = "FIPs"
3. Title: `FIP: Protocol-Level Channel Registration and Membership`
4. Body: paste the **Summary**, **Motivation**, **Specification**, and **Open Questions** sections above. Keep it under 600 words initially — a tight proposal gets more responses than a document.
5. Tag: `@v`, `@horsefacts`, or whoever is currently the core protocol team (check recent merged FIPs for reviewers).
6. Post the discussion link in /farcaster and in ZAO Telegram for signal.

---

## Also See

- [Doc 1094c - Farcaster protocol updates: channels, agent FIDs, SIWN](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/1094c-farcaster-protocol-updates/) — established this is open ground, no existing FIP
- [Doc 984 - Farcaster ecosystem recap mid-2026](../984-farcaster-ecosystem-recap-jul2026/) — ecosystem context; channels are back as product priority
- [Doc 1094 - Empire Builder + Clanker context](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/) — Adrian's mention of channels on the Jul 14 call
- [Doc 1490 - Creator coins ecosystem Jul 2026](./1490-creator-coins-ecosystem-jul2026/) — Sparkz use case for protocol-level channels

## Sources

- [FULL] Doc 1094c — Farcaster protocol update research (channels, agent FIDs, SIWN; 2026-07-14)
- [FULL] Doc 984 — Farcaster ecosystem recap (mid-2026)
- [FULL] Farcaster Channels documentation (docs.farcaster.xyz/learn/what-is-farcaster/channels) via 1094c research
- [PARTIAL] FIP-2 ("Flexible Targets for Messages") — the existing protocol support for channel casts via `parent_url`; confirmed in hub message spec
- [PARTIAL] Farcaster ID Registry contract pattern — basis for proposed ChannelRegistry design analogy
