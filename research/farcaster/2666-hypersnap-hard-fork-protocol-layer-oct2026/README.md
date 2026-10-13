---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-10-13
superseded-by:
related-docs: "309, 489, 586, 587, 588, 643, 761, 1607, 2374, 2381, 2386, 2418"
original-query: "Cassie's 12 Oct 2026 thread: Hypersnap hard fork at epoch 1, PoW, quantum-safe keys, two-way relay, private $SNAP, retro claims close 31 Oct, Neynar not engaging on the acquisition proposal. Protocol-layer deep dive (consensus, PoW, epochs, block production, quantum key migration, relay trust model, $SNAP privacy, spend limits, builder APIs, open questions), then what changes for ZAO OS, ZOE/ZOL, the Farcaster CRM and members, and Cassie's GitHub with licenses."
tier: DEEP
---

# 2666 - The Hypersnap hard fork: the protocol layer, and what it changes for ZAO

> **Goal:** Read the actual proposal and code behind Cassie's 12 Oct 2026 thread,
> separate what is specified from what is built, and say what ZAO should do.

**This doc updates, and does not replace, doc 2418** (Hypersnap state, 2026-08-25)
and doc 2386 (Snapchain hub economics). Those docs were right about the August
state. What changed on 12 Oct is the plan: Hypersnap is no longer pitched as a
side chain alongside Snapchain but as a **hard fork with its own blocks from
epoch 1**.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Do NOT migrate FID 19640 to a quantum-safe key yet.** It is ZAO's app FID, not only Zaal's personal account. | ZAO OS writes through "Neynar managed signers on behalf of the app (FID 19640)" (`src/app/api/auth/signer/route.ts:13`). Under the proposal, once an FID migrates, **Hypersnap rejects its Ed25519-only messages** (discussion #19, section 16.8 acceptance table). Neynar signers are Ed25519. So after a migration, everything ZAO posts as 19640 through Neynar would still land on Snapchain but **stop appearing on Hypersnap**. This is a reading of the spec; nothing is built yet (decision 4). |
| 2 | **Keep ZAO OS on Neynar plus the haatz read fallback. Add no new dependency on either network.** | The fork does not touch Snapchain. Haatz reports version 0.13.5 and is an epoch-0 Snapchain read node today (`/v1/info`, 2026-10-13). The @neynar account itself recommends "dual-read/write sdk adapters so apps can swap farcaster and hypersnap backends without rewrites" (cast `0xbf0b181f65`, 2026-10-12). ZOE already has that shape (`bot/src/zoe/farcaster/read-node.ts:9-10`). |
| 3 | **Before the pivot, decide which network haatz follows, and stop relying on haatz for read-after-write.** | After the pivot, a message written via Neynar reaches Hypersnap only through a relay, and **relayed messages pay normal Hypersnap fees; if the FID's fee balance is not enough, Hypersnap rejects the message** (Appendix A.6). If haatz follows Hypersnap, ZOE and ZOL could post successfully and then fail to read back their own casts. |
| 4 | **Treat the quantum-safe keys, the relay and the pivot as SPEC, not software.** | A grep of `farcasterorg/hypersnap` on `main` (3dc7df1, 2026-08-28) and on `pow` (2026-07-08) for `falcon`, `hypersnap-relay`, `PIVOT_HEIGHT` and `CustodyMigration` found **zero** hits on both. The control term `snapchain` hits 770 times on `main`. The Falcon primitives exist in the Quilibrium monorepo (`crates/quil-crypto/src/falcon.rs`) but are not wired into Hypersnap in any branch checked. |
| 5 | **Do not hold, sell or build on $SNAP privacy claims until QCT3 is audited.** | The thread says $SNAP is "privacy-preserving". The spec has a **transparent ledger plus an optional shielded pool**, and "QCT3 has no audit, and its crates are marked as experimental. Set `QCT_ACTIVATION_EPOCH` after an audit" (section 18, open question 5). |
| 6 | **Members with a retro allocation must claim by 31 Oct.** Zaal already claimed (FID 19640, about 12,226 SNAPs on the public endpoint). | Cassie, cast `0x0ea95ebb29`: "claims close 31 Oct. after that, any unclaimed rewards are effectively burned." A member can check with no sign-in: `https://api.hypria.app/api/snaps/<fid>` (200 with an amount, 404 with none). Claiming needs Farcaster sign-in, a wallet and gas, so it is each member's own action. |
| 7 | **Reuse from Cassie's side: read, don't fork.** Reuse from Neynar's side: the MIT repos are fair game. | `farcasterorg/hypersnap` is GPL-3.0 and the Quilibrium monorepo is AGPL-3.0, both read from their LICENSE files. `farcasterorg/snap` and `farcasterorg/client-snapshot` are MIT, "Copyright (c) 2026 Neynar". |

## "Snap" means three different things

| Name | What it is | Owner, license |
|---|---|---|
| **Snapchain** | Farcaster's consensus network today: Malachite (Tendermint) BFT, about one-second blocks | Neynar runs it; GPL-3.0 |
| **Hypersnap** | Cassie's fork of Snapchain; after epoch 1 it makes its own blocks | `farcasterorg/hypersnap`, GPL-3.0, maintained by Cassie (CassOnMars) |
| **$SNAP** | Hypersnap's token. Retro rewards are already distributed on Ethereum. hypria.app shows `TOTAL_SUPPLY` 2,000,000,000 and `PROOF_OF_GROWTH_RETRO_REWARDS` 200,000,000; the FIP keeps both symbolic | Hypersnap protocol |
| **Snaps** (a fourth, unrelated) | Small apps embedded in casts | `farcasterorg/snap`, MIT, "Copyright (c) 2026 Neynar"; ZAO's snap work is in `bettercallzaal/zlank` |

## Timeline

| Date | Event | Source |
|---|---|---|
| 2026-01-21 | Neynar acquired Farcaster from Merkle | @neynar cast `0xac5f9359c4`, and doc 2374 (Neynar blog) |
| 2026-03-24 | FIP "Proof of Work Tokenization" opened | `github.com/orgs/farcasterorg/discussions/19` |
| 2026-06-12 | Cassie's ZABAL Gamez workshop on the protocol | `ZAODEVZ/zabalgames` transcript `2026-06-12-cassie-farcaster-protocol.md` |
| 2026-06-23 | Neynar's topocount on "Snapchain under the hood", also ZABAL Gamez | same repo, `2026-06-23-snapchain-under-the-hood.md` |
| 2026-08-17 | Rish: looking for a "new home / team" for Farcaster, Clanker and Neynar | @neynar cast `0xac5f9359c4`, doc 2374 |
| 2026-08-22 | Proposals received, no more bids taken | @neynar cast `0xac5f9359c4` |
| 2026-10-12 02:41Z | FIP #19 body last edited (sections 16, 17 and Appendix A) | discussion metadata |
| 2026-10-12 02:53Z | Cassie's 11-cast thread (FID 1325) | Hub `castsByFid`, keyless |
| 2026-10-13 | Cassie: "silence is a synonym for 'get fucked'" about the investor non-response | cast `0xfa63db9edc` |
| 2026-10-31 | Retro claims close | cast `0x0ea95ebb29` |
| Epoch 1 | Pivot. **No date is published**; `PIVOT_HEIGHT` is "a constant in the release" (17.2) and no release with it exists | discussion #19, grep above |

## 1. Consensus, today and after the fork

**Snapchain today.** Cassie at the 12 June workshop: "validators on Snapchain are
controlled by Neynar - there are six validators, five are Neynar, one is Uno.
Control of the validator set is effectively control of the network" [06:28]. Its
consensus is "Malachite - a Rust implementation of Tendermint ... if over
one-third of validators are offline, broken, or malicious, the network halts. But
it's blindingly fast, which has led to Snapchain's one-second block times" [25:12].

**Hypersnap epochs** (discussion #19, Overview and section 4):

| Epoch | What happens |
|---|---|
| 0 | Hypersnap nodes are Snapchain read nodes. No Hypersnap blocks. The retro distribution already happened on Ethereum. |
| 1 | **Pivot.** Hypersnap makes its own blocks for shards 0, 1 and 2. The token ledger, bridge, work markets and post-quantum rules start. |
| 2+ | Own blocks only; dynamic validator membership. |

**Block production** (4.2, 4.3, 4.9):

- 12-second blocks (`propose_time` 6s, prevote 3s, precommit 3s), up to 12,000 messages a block, so about 1,000 messages a second per shard. Finality is "approximately 4 to 5 seconds after the proposal".
- `EPOCH_LENGTH = 36,000` shard-0 blocks, about 5 days. A change announced in epoch N takes effect in epoch N+2.
- Every validator has weight 1. A certificate needs more than 2/3 of the total weight.
- The proposer comes from a per-epoch permutation seeded by `keccak256("hypersnap-epoch-seed-v1" || e || H_last(e-1))`, because the post-quantum signatures are randomized and "cannot operate as a VRF". This leaves one grinding point per epoch (open question 6).
- The bootstrap validator set for epochs 1 and 2 comes from a **genesis validator file** whose hash ships in the release (17.3). **Who is on that file is not public.** It is the single most important unknown for judging decentralization at launch.

**"Proof of work" is not hashcash.** The FIP is explicit: "The work markets do not
use hashcash proof of work. They use protocol-native types of work". There are
three markets, all weighted by a credibility scalar built from FID age (anchored
to Optimism transfer events), graph position and interaction diversity:

1. **Data availability**: challenge-response proofs that a node holds data (section 5).
2. **Growth (social PoW)**: rewards for keeping users active, explicitly "Reward Maintenance, Not Referral" (6.4).
3. **Application usage**: signed receipts from apps (section 7).

Each node must be bound to one FID by an attestation (section 3), which makes node
operators accountable by identity.

## 2. Quantum-safe keys and the FID registry

**Schemes** (16.2, 16.3):

| Layer | Scheme |
|---|---|
| Validator consensus | LWE-FSA signatures, aggregated as LWE-MS2 (unstructured lattices) |
| Bridge anchors on EVM | CERT-STARK, a hash-based proof over the certificate |
| User keys: custody, signers, spend keys, node keys | **Falcon-512** (FN-DSA-512): 897-byte public key, signature of 666 bytes or less |
| Confidential tokens | QCT3 (module lattices) |
| Hashes and state | Keccak-256, SHAKE |

The design deliberately avoids ML-KEM (Kyber) and ML-DSA (Dilithium) (16.1, rule 2).

**How an FID migrates** (16.9). One `CUSTODY_MIGRATION` message carries a Falcon
custody key, an optional Falcon recovery key, an EIP-712 signature from the FID's
current Optimism custody address, and a proof of possession from the new key.

- **Permanent.** "An FID cannot go back to classical custody."
- After migration, Hypersnap **ignores** the FID's Optimism `IdRegistry` transfers and recovery changes, and its `KeyRegistry` adds and removes. It keeps using `StorageRegistry`. In the spec's words, "The custody of the FID on snapchain can be different from its custody on Hypersnap."
- **Signers.** A migrated FID's signers must be a dual Ed25519+Falcon pair, or Falcon-only (16.10). Ed25519-only messages are rejected (16.8).
- **Tokens.** An FID that has not migrated can receive tokens but "cannot send, stake, lock, or shield tokens" (16.11). Cassie's thread says the same: you must switch "before you can send or spend tokens".

**What stays classical** (16.14): FIDs that have not migrated, the Optimism root
of trust (registration, storage rent), accounts on destination chains, the libp2p
transport, and all of Snapchain.

## 3. Spend-limit grants for apps

Section 16.11. The FID's Falcon custody key doubles as the **account key**. With
one `SPEND_KEY_ADD` it authorizes an app's spend key, which carries:

- `epoch_cap`: the most it can move per epoch (about 5 days)
- `expires_at_epoch`: the last epoch in which it is valid
- `allowed_recipients`: empty means anyone
- `app_fid`: for information only

A spend key **can** make transfers and fee deposits within its cap. It **cannot**
stake, lock to another chain, shield, or add keys. Its "maximum loss is
`epoch_cap` for each epoch, until the revocation or the expiry of the key". The
account key can revoke it, and so can the key itself. A custody change revokes
all spend keys. App *signers* (the keys that post) cannot move tokens at all.

**Why ZAO cares:** this is the safe shape for paying artists from an app, and the
opposite of what doc 2576 found in Quidli's client (no spend cap at all).

## 4. $SNAP privacy, as specified

The thread: "the $SNAP token on hypersnap, and any tokens created on hypersnap,
are privacy-preserving. you are always in control about who can see what you
have." The spec is narrower:

- Balances start on a **transparent ledger**. `QCT_SHIELD` moves tokens into a **shielded note pool**, and only the account key can do that, not a spend key (16.11, 16.12).
- QCT3 uses lattice commitments, a nullifier per spend, and one LaBRADOR zero-knowledge proof per transaction. Amount memos are encrypted with sntrup761 plus AES-256-GCM. The crates are `quil-lattice-ct` and `quil-lattice-proof-sys` from the Quilibrium monorepo, which do exist there (GitHub code search, 2026-10-13).
- Outbound bridge amounts are revealed at the bridge: "nobody knows the amounts until you hit the bridge (which has to indicate how much, or you couldn't mint)" (workshop [37:33]).
- The QCT3 activation epoch is gated on an audit that has not happened (open question 5).

**So:** privacy is opt-in, and it switches on after an audit. It is not on by default at the pivot.

## 5. The two-way relay: trust model and what "compatible posts" excludes

Appendix A. `hypersnap-relay` is a separate binary that "holds no validator key, no
custody key, and no signer key. It cannot sign messages." Anyone can run one, and
several can run at once. It "can forward only messages that users signed. It
cannot forge a message. **It can delay or drop messages.**" It is not part of
consensus.

**Excluded from Hypersnap to Snapchain** (outbound filter, A.4): HyperMessages
and hyper-only types; Falcon-only messages; messages from hyper-native FIDs
(`fid >= 2^63`); `KEY_ADD`s that are not Ed25519 with an EIP-712 custody
signature.

**Parity limits** (A.6):

- A migrated FID's Ed25519-only posts to Snapchain never appear on Hypersnap.
- Relayed messages pay Hypersnap fees, and are rejected if the FID has no fee balance. "Some snapchain users have no fee balance. The effect on parity is not measured" (open question 9).
- "Snapchain nodes can limit the rate of the relay worker or block it." Neynar runs five of Snapchain's six validators, so **in practice the relay runs at Snapchain's discretion.**
- The relay does not carry on-chain events or fname proofs. Each Hypersnap validator reads Optimism and "the fname server" itself (17.6). **The fname server stays a dependency.**

**Cassie's "you won't lose your audience" holds for the common case.** That is an
unmigrated FID with a fee balance, posting standard message types, while
Snapchain tolerates the relay.

## 6. What a builder like ZAO OS would call

- **HTTP on :3381, shaped like Neynar's API v2.** `src/api/http.rs` on `main` defines **156 unique `/v2/farcaster/...` routes** (for example `/v2/farcaster/cast` at line 404, `/v2/farcaster/user/bulk` at line 478), plus notifications and webhooks handlers. This is why ZOE can treat a Hypersnap node and Neynar as interchangeable read backends.
- **gRPC on :3383** (the hub API, also what the relay uses), and the Snapchain-compatible `/v1/...` hub HTTP API that haatz serves today.
- The roadmap Cassie gave on 12 June (five North Stars): a query layer (shipped), a client template plus SDK, channels and curation as first-class primitives, mini app discovery at the protocol level instead of behind "Neynar's internal APIs", and native monetization [43:22-46:33].

## 7. Retro rewards

Section 10.1: "The retroactive distribution is complete ... All allocations are
fully vested ... The retroactive tokens are on Ethereum." After the pivot,
holders bridge them in with the inbound bridge. **The genesis state gives every
FID a balance of zero** (17.4); nothing is airdropped onto Hypersnap. The claim
deadline is in Cassie's cast, not in the FIP. The FIP has no claim window, and
the hypria.app bundle has no deadline string (grepped 2026-10-13).

## 8. Open questions, the proposal's own list (section 18)

1. LWE-FSA parameters still to be chosen with the lattice estimator.
2. LWE-MS2 needs a security proof for unstructured LWE and SIS.
3. The CERT-STARK system (FRI STARK or WHIR) is not chosen, and its EVM gas cost is not measured.
4. Block time: this FIP says 12s, a sibling FIP says 3s.
5. QCT3 has no audit.
6. Seed grinding, one point per epoch.
7. Optional aggregation of Falcon signatures.
8. **Bridge governance**: no process yet for putting a bridge upgrade or pause into a block.
9. **Relay parity and fees**: not measured.

**Added by this doc, unanswered in any source fetched:**

10. Who is in the genesis validator file?
11. When is `PIVOT_HEIGHT`?
12. Which network will haatz follow after the pivot?
13. Will Snapchain tolerate the relay?

## 9. The acquisition, stated carefully

- **Neynar's account (FID 6131), 2026-10-12:** "neynar acquired farcaster from merkle on january 21, 2026, then rish said on august 17 they'd started looking for a 'new home / team' ... as of august 22, he said they'd received proposals and weren't taking more bids ... nothing was finalized yet and products would keep working normally."
- **Cassie, 10/11:** "since our initial discussions, neynar hasn't talked with us about our proposal. our read: that likely means a different buyer is being chosen, one they don't expect to be community aligned. we can't wait to find out, so we're moving forward with the hard fork."

**What is known:** a sale process exists and is closed to new bids. **What is not
known:** the buyer, the timing, and whether it closes at all. Cassie's "different
buyer" is her read, labelled as such in her own words.

## 10. What changes for ZAO

| Surface | Today (measured on origin/main 2026-10-13) | Exposure to the fork | Action |
|---|---|---|---|
| **ZAO OS app** | 35 files call `api.neynar.com` and 61 reference `NEYNAR_API_KEY`. **No file imports `@neynar/nodejs-sdk` or `@neynar/react`**, though both are in `package.json`. Writes use Neynar managed signers for FID 19640. Optional read proxy (`src/lib/env.ts:88`). | Low before the pivot. After it, ZAO's posts reach Hypersnap only via the relay, subject to fees. | No change now. Consider removing the two unused Neynar packages (separate PR, ask first). |
| **ZOE** | `read-node.ts`: tier 1 is a self-hosted Hypersnap node on :3381, tier 2 is haatz or Neynar (`read-node.ts:9-10, 17`). `event-stream.ts` subscribes to Hypersnap gRPC (doc 761). | **High after the pivot** if haatz or the node follows Hypersnap: read-after-write breaks for any post that fails the relay's fee check. | Before the pivot: pin which network each read tier follows, and add a parity probe that posts, then reads back, and alerts on a miss. |
| **ZOL** | Reads /zabal via `readV2` (Hypersnap node), writes through Neynar or a hub (doc 1607). | Same as ZOE. | Same parity probe. |
| **Farcaster CRM** | Built from haatz `castsByFid` and `user/bulk` (vault `handoffs/status/zao-socials.md`, `zabalgamez-submitter-fids`). | Hypersnap-only content (Falcon-only and hyper-native FIDs) will not exist on Snapchain, and the reverse for migrated FIDs. | Tag every CRM row with the network it was read from after the pivot. |
| **Members** | Respect and governance are on Optimism, not Farcaster. | Retro claims; a possible future of free channels and FIDs that need no paid account (Cassie: channels free on Hypersnap [49:24]; `NATIVE_ONBOARD` hyper-native FIDs, 16.9). | Tell members about the 31 Oct claim (each claims for themselves). The onboarding blocker from the 20 June fireside (a person in Zambia could not pay for an account) is exactly what hyper-native FIDs could fix. **Watch, do not promise.** |
| **FID 19640** | Zaal's account and the app FID | Migrating it breaks ZAO's Ed25519 writes on Hypersnap | Key Decision 1 |

## 11. Cassie's GitHub and what ZAO could reuse

Doc 588 has the full profile. As of 2026-10-13:

| Repo | License (from the LICENSE file) | Last push | Reuse for ZAO |
|---|---|---|---|
| `farcasterorg/hypersnap` | GPL-3.0 | default branch 2026-08-28; FIP edited 2026-10-12 | **Read, run, don't vendor.** Running it as a service is fine; shipping modified code means GPL obligations. The `/v2` API shape is the useful part, and ZOE already uses it. |
| `QuilibriumNetwork/monorepo` | AGPL-3.0 | 2026-10-13 | **Do not vendor.** AGPL reaches network use. The Falcon and QCT3 crates are reference reading only. |
| `QuilibriumNetwork/quorum-mobile`, `quorum-desktop` | GPL-3.0 and AGPL-3.0 per the API (LICENSE files not read) | Oct and Aug 2026 | Reference for the Quorum audio-spaces idea (doc 788). UNVERIFIED license. |
| `CassOnMars/*` (52 public repos) | mixed | The most recent pushes are an unrelated medical sim (2026-04) and a Snapchain fork (2026-02) | Nothing current to reuse. Her active work lives in the two orgs above. |
| `farcasterorg/snap` | MIT, "Copyright (c) 2026 Neynar" | 2026-08-29 | **Yes.** The Snaps spec, `@farcaster/snap`, an emulator and templates. Directly relevant to `zlank`. |
| `farcasterorg/client-snapshot` | MIT, "Copyright (c) 2026 Neynar, Inc." | 2026-08-29 | **Yes, as a reference.** The full Farcaster mobile and web client "without the Farcaster Wallet implementation"; its README says "Fork it and build on it". |

**Lookalike warning:** GitHub search for "hypersnap" returns Windows "HyperSnap"
download repos (for example `back-degrin/Hypersnap`, pushed 2026-10-13). Those are
a screenshot-tool namesake, and at least one is a download landing page. Only
`farcasterorg/hypersnap` is the protocol.

## Also See

- [Doc 2418](../2418-hypersnap-state-and-zao-feasibility/): its decisions 1 to 4 stand. Decision 3 ("run vanilla snapchain if ZAO ever self-hosts") now needs re-asking after the pivot, because "vanilla" will mean picking a side.
- [Doc 2386](../2386-snapchain-hub-economics-governance-aug2026/), [Doc 2374](../2374-farcaster-operator-crisis-aug2026/): the operator crisis and hub economics in August.
- [Doc 309](../309-snapchain-hypersnap-protocol-deep-dive/), [Doc 588](../588-cassie-heart-github-deep-profile/), [Doc 761](../../agents/761-zao-farcaster-multiagent-quilibrium-stack/), [Doc 1607](../1607-zol-zabal-channel-autopost-spec/)
- [Doc 2576](../../identity/2576-quidli-social-registry-agent-payments/): Quidli, the counterexample on spend limits
- Vault `notes/cassie-zabal-gamez-where-it-left-off-2026-10-13.md`: the Cassie thread from the ZABAL Gamez side

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Tell ZAO members with a Farcaster account to check `api.hypria.app/api/snaps/<fid>` and claim before 31 Oct (outbound, so Zaal's tap). SHIPPED = one post or newsletter line | @Zaal | Outbound | 2026-10-24 |
| Do not migrate FID 19640. Revisit when a Hypersnap release ships custody migration. SHIPPED = a line in the vault decisions folder | @Zaal | Decision | 2026-10-20 |
| ZOE/ZOL parity probe: post, read back from each read tier, alert on a miss. SHIPPED = a merged PR with a test | Claude Code lane | PR | before the pivot |
| Re-check the repo for `PIVOT_HEIGHT`, `falcon` and `hypersnap-relay`, and the genesis validator file. **Invalidation condition:** any hit means decision 4 is out of date. SHIPPED = a dated delta here | lane | Re-research | 2026-11-01 |
| Ask Cassie (warm, via the Hypersnap group chat Zaal is in) who is in the genesis validator file and which network haatz follows after the pivot | @Zaal | Outbound | open |

## Sources

All fetched 2026-10-12 to 2026-10-13, keyless, nothing signed or spent.

- `github.com/orgs/farcasterorg/discussions/19`, "FIP: Proof of Work Tokenization" - **[FULL, method: GitHub GraphQL, body plus all 31 comments saved to disk, 35,255 words; body last edited 2026-10-12T02:41:44Z]**. Sections 4, 10, 16, 17, 18 and Appendix A read in full.
- Discussions #11 (Functional Signers) and #13 (Open Consensus) - **[FULL, method: GitHub GraphQL]**; listed for completeness, not quoted.
- `farcasterorg/hypersnap` `main` at 3dc7df1 and branch `pow` at f4fc4afc - **[FULL, method: git clone --depth 50, git grep]**; LICENSE header read.
- `farcasterorg/hypersnap` branches and PRs - **[FULL, method: gh api]**
- `farcasterorg/snap`, `farcasterorg/client-snapshot` README and LICENSE - **[FULL, method: gh api contents]**
- `QuilibriumNetwork/monorepo` LICENSE; code search for `quil-lattice-ct` and `falcon` - **[FULL, method: gh api, gh search code]**
- Cassie's thread, FID 1325, casts `0xdea9eb05dd` to `0x9975084a4d`, plus `0xfa63db9edc` - **[FULL, method: haatz.quilibrium.com `/v1/castsByFid`, raw JSON]**
- @neynar (FID 6131) casts `0xac5f9359c4`, `0xbf0b181f65`, `0x3b76e08bb2` - **[FULL, method: haatz `/v1/castsByFid`]**
- Replies to all 11 thread casts - **[FULL, method: haatz `/v1/castsByParent`, 35 replies from 32 FIDs]**; no reply from @neynar or @rish among them.
- `haatz.quilibrium.com/v1/info` - **[FULL, method: curl, JSON]**
- `hypria.app` bundle `index-CvxNqQnA.js` and `api.hypria.app/api/snaps/{fid}` - **[FULL, method: curl; controls FIDs 0 and 999999999 return 404]**
- ZABAL Gamez workshop transcripts, 2026-06-12 (Cassie) and 2026-06-23 (topocount) - **[FULL, method: gh api contents, `ZAODEVZ/zabalgames`]**
- ZAOOS code on origin/main - **[FULL, method: git grep, counts with a looser-pattern recheck]**
- Docs 2374, 2418, 588 - **[FULL, method: git show origin/main]**
- `docs.quid.li`, Neynar blog - not fetched this run; Neynar blog facts come via doc 2374 and @neynar's own cast.
