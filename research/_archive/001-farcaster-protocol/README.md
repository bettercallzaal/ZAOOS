# Farcaster Protocol

> Source: [github.com/farcasterxyz/protocol](https://github.com/farcasterxyz/protocol) | [docs.farcaster.xyz](https://docs.farcaster.xyz)

## What Is Farcaster?

A **sufficiently decentralized social protocol** with a hybrid onchain/offchain architecture.

---

## Architecture

### Onchain Layer (OP Mainnet, Chain ID 10)

Smart contracts handle identity and key management:

| Contract | Address | Purpose |
|----------|---------|---------|
| **IdRegistry** | `0x00000000Fc6c5F01Fc30151999387Bb99A9f489b` | Manages FIDs (Farcaster IDs) — unique uint256 per user |
| **KeyRegistry** | `0x00000000Fc1237824fb747aBDE0FF18990E59b7e` | Maps FIDs → Ed25519 signing keys (app signers) |
| **StorageRegistry** | `0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D` | Message storage quotas (purchased in ETH on OP) |
| **IdGateway** | — | Mediates FID registration |
| **KeyGateway** | — | Mediates key addition |
| **Bundler** | — | Bundles registration + key + storage in one tx |

### Offchain Layer (Farcaster Hubs)

- P2P gossip network via **libp2p**
- Stores and propagates social data (messages)
- Uses **CRDTs** for conflict resolution — all hubs converge to same state
- Syncs via **Merkle trie-based diff sync**
- Reference implementation: **Hubble** ([hub-monorepo](https://github.com/farcasterxyz/hub-monorepo))

---

## Message Structure (Protobuf)

```protobuf
Message {
  data: MessageData         // actual content
  hash: bytes               // Blake3 hash of serialized data
  hash_scheme: BLAKE3
  signature: bytes           // Ed25519 signature over hash
  signature_scheme: ED25519
  signer: bytes              // public key (must be in KeyRegistry)
}

MessageData {
  type: MessageType
  fid: uint64
  timestamp: uint32          // Farcaster epoch (seconds since 2021-01-01)
  network: FARCASTER_MAINNET
  body: oneof { CastAddBody, ReactionBody, LinkBody, ... }
}
```

**Farcaster Epoch:** Timestamps = seconds since Jan 1, 2021 00:00:00 UTC (NOT Unix epoch).

---

## Message Types

### Casts (Posts)
| Type | Description |
|------|-------------|
| `CastAdd` | Create a post — up to 1024 bytes UTF-8, 2 embeds, mentions, parent for replies/channels |
| `CastRemove` | Delete a post by target hash |

```
CastAddBody {
  text: string                    // up to 1024 bytes
  embeds: Embed[]                 // URLs or CastId references (max 2)
  mentions: uint64[]              // FIDs mentioned
  mentionsPositions: uint32[]     // byte positions in text
  parentCastId: CastId            // for replies (fid + hash)
  parentUrl: string               // for channel-targeted casts
  type: CAST (0) | LONG_CAST (1)
}
```

### Reactions
| Type | Description |
|------|-------------|
| `ReactionAdd` | Like (type=1) or Recast (type=2) a cast |
| `ReactionRemove` | Remove a reaction |

### Links (Social Graph)
| Type | Description |
|------|-------------|
| `LinkAdd` | Follow a user (`type: "follow"`, `target_fid`) |
| `LinkRemove` | Unfollow |

### User Data (Profile)
| Field | Type Value | Max Size |
|-------|-----------|----------|
| PFP | 1 | Profile picture URL |
| Display Name | 2 | 32 bytes |
| Bio | 3 | 256 bytes |
| URL | 5 | Homepage URL |
| Username | 6 | fname |

### Verifications
- `VerificationAddEthAddress` — Link Ethereum address to FID
- `VerificationRemove` — Remove verification

### Frames
- `FrameAction` — User interaction with a Frame mini-app

### Username Proofs
- `UsernameProof` — Prove ownership of fname or ENS name

---

## Storage Limits (Per Unit)

| Resource | Limit |
|----------|-------|
| Casts | 5,000 |
| Reactions | 2,500 |
| Links (follows) | 2,500 |
| User Data | 50 |
| Verifications | 50 |

When limits exceeded → oldest messages pruned (CRDT last-write-wins).

---

## Channels

- Organized via `parentUrl` on casts (e.g., `https://farcaster.group/music`)
- Channel moderation is **application-layer**, not protocol-enforced
- Warpcast maintains a channel registry

---

## FNames (Usernames)

- Offchain usernames managed by `fname.farcaster.xyz`
- ENS names also supported (set text record)
- Free (one per FID)

---

## Authentication

### Custody Address vs Signers
- **Custody Address**: Ethereum address that owns the FID. Ultimate authority.
- **App Signers (Ed25519)**: Registered in KeyRegistry. Used for day-to-day message signing.

### Sign In With Farcaster (SIWF)
1. App generates nonce → presents sign-in request
2. User signs with custody address (via Warpcast)
3. App verifies signature → looks up FID
4. App now knows user's FID

### Signer Registration (for write access)
1. App generates Ed25519 keypair
2. App creates SignedKeyRequest (EIP-712 signed)
3. User approves via Warpcast deep link
4. Key registered in KeyRegistry on-chain
5. App can now sign and submit messages

---

## Key Takeaways for ZAO OS

- FIDs are the core identity primitive — ZIDs will wrap FIDs
- Ed25519 signing is mandatory for all writes
- Channels (`parentUrl`) can organize music content
- Storage must be purchased — consider UX for new users
- CRDTs mean eventual consistency — design UI accordingly
