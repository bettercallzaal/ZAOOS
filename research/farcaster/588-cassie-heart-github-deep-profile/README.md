---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-02
related-docs: 304, 309, 489, 586, 587
tier: DEEP
---

# 588 - Cassie Heart (CassOnMars) GitHub Deep Profile

> **Goal:** Comprehensive map of Cassandra Heart's public GitHub presence so ZAO can engage her with maximum precision. Built from primary GitHub data (events, repos, gists, issues, discussions) on 2026-05-02. Pairs with Doc 587 (ecosystem) and Doc 586 (install playbook).

## Headline

Cassie Heart is shipping at near-solo founder velocity across two protocols (Quilibrium + Hypersnap) plus personal medical research, with a 12-year coding history (Scala -> .NET -> Rust + cryptography). She has filed **11 FIPs in farcasterorg/protocol in 7 weeks** (Feb 21 - Apr 7 2026), authored a complete vision dump for Hypersnap, and explicitly named "we lost a lot of artists" as a problem Hypersnap exists to solve. **ZAO is her target persona.** Her communication preferences are sharp (PRs over DMs, code over docs, technical pushback over agreement). Her validator path is also more open than Snapchain mainnet (FIP-13 Open Consensus = permissionless epoch-based registration, no Neynar 6-month election).

## Profile Metadata (Verified 2026-05-02)

| Field | Value |
|---|---|
| Real name | Cassandra Heart |
| GitHub | [CassOnMars](https://github.com/CassOnMars) |
| GitHub ID | 7929478 |
| Joined GitHub | **2014-06-19** (12 years) |
| Public repos | **52** |
| Public gists | **1** (the hypersnap one, 2026-04-18) |
| Followers | 419 |
| Following | **17** (curated, see below) |
| Email | private |
| Twitter | **@cass_on_mars** |
| Blog | quilibrium.com (no personal blog active) |
| Old blog | doctorless.github.io (6 posts, **dormant since 2017-08-19**) |
| Public org memberships | 0 (org membership privacy-gated) |
| Profile updated | 2026-04-08 |
| Farcaster | [@cass.eth](https://farcaster.xyz/cass.eth), FID 1325, ~403K followers |

## Lifetime Contribution Arc

**224 merged PRs lifetime** (per GitHub search `author:CassOnMars type:pr is:merged` on 2026-05-02). Arc by year:

| Era | Years | Stack | Notable repos |
|---|---|---|---|
| University | 2012-2014 | Scala | German IT-Security coursework (`ITS-2012-WS-A3-BRTT`) |
| Server Eng | 2015-2017 | Scala / Java | Many Play Framework forks, AMQP, JDBC, scala-slack, sbt-protobuf, play-cxf, RabbitMQ clients |
| Avalara (tax SaaS) | 2018-2019 | C# / Scala | `AvaTax-REST-V2-JRE-SDK`, `AvaTaxClientLibrary`. Confirmed Avalara employment via repo names. |
| Personal projects | 2017-2021 | C# / JS / HTML | Old blog `doctorless.github.io` (2017), `redux-saga` fork (2019), `Wordler` (2022), `CodeWolfpackSession1` (livecoding stream artefact) |
| Cryptography pivot | 2022 | C# | **`TripleRatchet`** (8 stars, P-256 + SHA-3 + multiparty), **`Wesolowski-VDF`** (4 stars, GMP big-num, GPLv2/LGPLv3), **`Timelock`** (8 stars, RSA-style time-lock from RSW96), `Wolfpack-Double-Ratchet`. These are the public references for Quilibrium's hardened cryptography. |
| Quilibrium (founder) | 2023-present | Go (`ceremonyclient`) + JS (SDK) | Sole BDFL. Network mainnet 2024-09 (Bloom), Dusk shipped Q1 2025. |
| ex-Coinbase + ex-Farcaster | (overlapping) | various | Per bio. ex-Coinbase confirmed via social graph; ex-Farcaster confirmed by farcasterorg founding. |
| farcasterorg + Hypersnap | 2026-01-05 onwards | Rust | **First Hypersnap commit: 2026-01-05** (PR #1 "Initial draft of hypersnap"). Org founded 2026-02-15. 11 FIPs filed Feb 21 - Apr 7. |
| Personal medical research | 2026-04-11 onwards | Python | **`heds-kks-sim`** (1 star) - 64-state ODE QSP model + MD simulations of HAE drugs in hypermobile Ehlers-Danlos syndrome KKS targeting. PhD-tier work. **Off-limits for ZAO outreach.** |

## The 11 FIPs Catalogue (Cassie's Hypersnap Vision Dump)

All filed in `farcasterorg/protocol` Discussions between **2026-02-21 and 2026-04-07**. This is her complete Hypersnap thesis:

| # | Date | Title | TLDR | Status / ZAO Relevance |
|---|---|---|---|---|
| 1 | 2026-02-15 | **Hypersnap Meeting Notes 2026-01-06** | Founding mission. "We lost a lot of artists." 5 highest-leverage actions: query layer, template+SDK client, channels+curation primitive, miniapp on-ramp, native monetization. **"Product Managers: Go away."** | This is the doc to read first. ZAO is her target persona for "creator/artist retention." |
| 3 | 2026-02-15 | Hypersnap Meeting Notes 2026-01-29 | Follow-up meeting | Process |
| 4 | 2026-02-15 | Hypersnap Fork Meeting 2026-02-15 | Fork retro | Process |
| 5 | 2026-02-15 | FIP: Opportunity For Another Chain (Imported) | Imported from upstream Snapchain | Reference |
| 6 | 2026-02-15 | FIP: Opportunity For Another Consensus (Imported) | Imported | Reference |
| 7 | 2026-02-15 | FIP: Opportunity For Another Curator (Imported) | Imported | Reference |
| 11 | 2026-02-21 | **FIP: Functional Signers** | MPC/FROST threshold signing for FIDs. Replaces single-key signer with multi-party signers. | Cassie's spec; later imported as upstream Snapchain FIP-262. Cutover **2026-05-07 17:00 UTC** for upstream. |
| 13 | 2026-02-22 | **FIP: Open Consensus for Hypersnap Validators** | **Permissionless epoch-based validator registration.** EPOCH_LENGTH = 432,000 blocks (~5 days). Validator submits `HyperValidatorRegistration` event signed by ed25519 key + operator FID, activates after 2-epoch buffer. **No election. No Neynar approval.** Snapchain block hash seeds randomness for leader selection. | **CRITICAL FOR ZAO.** This is the path: register, wait ~10 days, become a Hypersnap validator. Re-read this section before claiming a slot. |
| 14 | 2026-02-22 | FIP: Native Channels | Channels as first-class protocol primitive (vs current ad-hoc URL-based parent_url). | Future ZAO channels could be protocol-native. |
| 15 | 2026-02-22 | FIP: Native Miniapp Indexing | Snaps and miniapps indexed at protocol layer. | ZAO miniapps (jukebox, etc) become discoverable natively. |
| 16 | 2026-02-22 | **FIP: GraphQL Query Layer** | Single endpoint, field selection, batching, subscriptions. Solves "4 HTTP calls to render one cast" problem. Sits on top of existing store. | **HIGH ZAO IMPACT.** Replaces our 3-tier failover stack with one query. Our bot fleet collapses. Implementation status: spec only, not built yet. |
| 17 | 2026-02-23 | **FIP: Proof of Quality** | Trust-weighted (Web of Trust over social graph) + uniqueness-adjusted (r9k-style content fingerprinting) fee mechanism. Highly-trusted + novel content = near-zero fees. Untrusted or repetitive = progressively higher cost. | Anti-spam economics. Decouples token from quality measurement. |
| 19 | 2026-03-24 | **FIP: Proof of Work Tokenization (the $HYPS spec)** | 3 work markets: **Data Availability, Growth, Application Usage**. Credibility scalar = FID age (OP transfer events) + social graph position + interaction diversity. Nodes attest to FIDs. **Anti-speculative, anti-hashcash.** Depends on FIP-13 + FIP-17. **Direct critique of Neynar acquisition:** "the gap between operating cost and revenue widens, which has lead to the corporate ownership of the previous snapchain architecture." | Hypersnap token spec. ZAO node could earn a share via Application Usage market if we run for users + ship apps. Treat as zero-EV bonus, but well-spec'd if it lands. |
| 20 | 2026-03-24 | Farcaster Token Call | Companion call/discussion to FIP-19 | Process |
| 21 | 2026-04-07 | **FIP: Snap Compute** | Turing-complete client-side bytecode VM (SnapVM, stack-based, gas-metered) inside snaps. Compiled from SnapScript. Snap survives server going offline. Pure + deterministic. | Combined with FIP-19 Application Usage market = miniapp builder rewards. ZAO's miniapp catalog could earn protocol-native fees. |

**Pattern recognition:** FIPs 11/13/16 are infrastructure (signers, validators, query). FIPs 14/15/17/21 are user-facing primitives (channels, miniapps, quality, compute). FIP-19 ties it together with economics. **It's a complete protocol redesign disguised as 11 separate FIPs.**

## FIP-13 Open Consensus - The ZAO Validator Path

If FIP-13 ships, ZAO becomes a Hypersnap validator without Neynar's approval. Spec excerpt:

```protobuf
enum HyperValidatorEventType {
  HYPER_VALIDATOR_EVENT_TYPE_NONE = 0;
  HYPER_VALIDATOR_EVENT_TYPE_REGISTER = 1;
  HYPER_VALIDATOR_EVENT_TYPE_DEREGISTER = 2;
}

message HyperValidatorEventBody {
  bytes validator_key = 1;       // Ed25519 public key, 32 bytes
  uint64 registration_epoch = 2; // current epoch
  bytes operator_fid = 3;        // FID 19640 (zaal app FID)
}
```

Process:
1. ZAO generates ed25519 keypair on Hypersnap node
2. Sign + submit `HyperValidatorRegistration` event during epoch N-1 with our pubkey + FID 19640
3. Event included in hyper block during epoch N-1
4. At epoch N+1 boundary (~10 days later), all nodes recompute active set
5. ZAO begins participating in hyper consensus

Constants:
- EPOCH_LENGTH = 432,000 blocks (assuming 1 block/sec, ~5 days each)
- EPOCH_BUFFER = 1 epoch
- Total time-to-active = ~10 days from registration

**Caveat:** FIP-13 is a draft. Not implemented yet (spec only, filed 2026-02-22, no PR linking shipped code). Watch for the `farcasterorg/hypersnap` PR that lands `HyperValidatorRegistration` event handler.

## Founding Mission - Direct Quotes from FIP-1

[Discussion #1, 2026-02-15](https://github.com/orgs/farcasterorg/discussions/1):

> "Foster a shift in culture from gambling/speculation to long-form / high-quality content"

> "Make Farcaster clients meaningfully easier to build... 'simple message scheduling' as a first-class capability"

> "Data & analytics need a real 'query layer,' not bespoke indexers... had to build a custom Neynar indexer to do custom queries"

> "If there's a token: it should reward securing the network, building clients/mini-apps, and producing quality content. Concern: money distorts behavior; question whether Hypersnap could coordinate curation/behavior *without* a token (AT Proto mentioned as an example counterpoint)"

> "Curation is seen as a missing layer"

> **"Pain point: 'we lost a lot of artists.' Hypothesis: feeds focusing on media didn't translate into retaining that creator cohort"**

> "How can I help? Developers: Contribute to Hypersnap... Build on both: miniapps, clients, integrations, ai agents, other tools"

> "**Creators/Artists:** Sanity check us! Do these proposals make sense to you? Are there alternatives that can work better? Be a pioneer - join in our experiments of these proposals, tell us what works, what doesn't"

> "**Product Managers:** Go away."

**ZAO direct alignment:** ZAO is a Farcaster client for music + creator community. Cassie literally listed creator/artist retention as a Hypersnap goal. ZAO running Hypersnap + giving feedback on the creator experience IS what she asked for. We do not need to invent a hook.

## Activity Pattern (Last 100 Public Events)

**Date range covered:** 2026-04-03 to 2026-05-02 (30 days, 56 events captured).

**Event mix:**
- 29 PushEvent (commits)
- 10 PullRequestEvent
- 8 CreateEvent (branches/repos)
- 5 PullRequestReviewEvent (mostly `dismissed` reviews)
- 2 DiscussionEvent (FIP threads)
- 1 IssueCommentEvent
- 1 ForkEvent

**Repo focus (last 30d):**
- 26 events on `farcasterorg/hypersnap`
- 19 events on `QuilibriumNetwork/monorepo`
- 2 each on `farcasterorg/hypersnap-docs-web`, `farcasterorg/protocol`, `farcasterorg/snap`, `farcasterxyz/snap`
- 1 each on `QuilibriumNetwork/qkms-sdk`, `CassOnMars/heds-kks-sim`

So: ~50% Hypersnap, ~33% Quilibrium core, ~17% docs + spec + personal.

**Hour-of-day (UTC), top buckets:**

```
01:00 ###       (3)
02:00 ########  (8) <- peak
04:00 #####     (5)
07:00 ####      (4)
12:00 ####      (4)
13:00 ##        (2)
... (16-22 UTC near silent)
```

**Wichita CT** = UTC-5 (CST) / UTC-4 (CDT, summer). Mapping:
- UTC 01-15 = CT 8pm-10am previous day onwards. **Peak at 9pm CT** (UTC 02 in CDT).
- UTC 16-22 = CT 11am-5pm. Quiet. **She sleeps midday.**
- This is a **flipped circadian** pattern. Standard Anthropic-team availability hours (US ET 9am-6pm) overlap with her quiet window.

**Day-of-week:**
- Mon 13, Tue 8, Wed 14, Thu 5, Fri 2, Sat 10, Sun 4
- **Wed + Mon are heaviest. Fri is dead.** Saturday is on. No clean weekend break.

**Implications for ZAO:**
- File PRs Tue evening US-time so she sees them Wed peak
- Avoid Fri-Sun expectations
- Comments on her PRs / issues land best between her UTC 22-04 active window (CT 5pm-11pm)

## Tone Sample (Recent PR Comment)

[`farcasterorg/hypersnap` PR #10, 2026-04-26 20:24 UTC](https://github.com/farcasterorg/hypersnap/pull/10#issuecomment-4322924137):

> "I'd agree with your concerns overall if those items weren't optional features for people who want to have a no-nonsense easy way to replicate neynar APIs end to end. It's not technically part of proto..."

**Pattern:** Acknowledge concern (1 phrase). Provide condition that defeats it (1 phrase). State the user need (1 phrase). Anchor to scope ("not technically part of proto..."). No softening, no apology, no "happy to discuss" hedging.

**Replication recipe for our PR comments:**
- Lead with the technical fact, not the social pleasantry
- If pushing back: "Agree IF X, but X-not-applies because Y"
- If asking: state the user need, anchor to scope
- Avoid "just", "really", "kind of", "I think maybe"

## Crypto Repos (Quilibrium's Public References)

Three repos from 2022 are direct references for Quilibrium's hardened crypto stack. These are the public, educational versions; Quilibrium has the production versions.

### TripleRatchet (8 stars, C#)

> "An example implementation of the Triple-Ratchet algorithm, which extends the Double-Ratchet algorithm with a multiparty room context. This is not hardened for production use - this is for educational purposes only. The Quilibrium codebase will include a hardened version (among other cryptography)."

Differences from Signal's Double-Ratchet:
- X3DH consumes a **signed** identity key (key hygiene)
- All keys P-256 (browser + hardware crypto support)
- SHA-3 hashing
- **Multiple parties, not just two-party**

### Wesolowski-VDF (4 stars, C#)

> "An implementation of the Wesolowski VDF [Verifiable Delay Function]. Heavily borrows formulae from Chia project. This does not produce proofs compatible with Chia Network, as the hash function chosen differs (SHA-3 vs SHA-256)..."

License: GPLv2 / LGPLv3 dual (because of GMP big-num dep). Caveat from Cassie:

> "may be susceptible to timing attacks, may cause your printer to halt and catch fire, etc. Use at your own risk."

### Timelock (8 stars, C#)

> "Uses the RSA-style timelock puzzle to make a ciphertext decryptable, but only after a configured amount of time has passed. See https://people.csail.mit.edu/rivest/pubs/RSW96.pdf for more details."

(Rivest-Shamir-Wagner 1996 paper.)

### What this tells us

Cassie thinks deeply about cryptographic primitives at the implementation level. Don't argue crypto with her unless we are very, very sure. Do learn from these references when designing ZAO's signature/auth flows.

## qkms-sdk (NEW Apr 13 2026) - Direct ZAO Touchpoint

[github.com/QuilibriumNetwork/qkms-sdk](https://github.com/QuilibriumNetwork/qkms-sdk) - branch master created 2026-04-13.

> "Embedded wallet SDK backed by QKMS threshold MPC key management. Create and manage wallets across multiple chains using distributed key generation - no single party ever holds the full private key."

Packages:
- `@quilibrium/qkms-sdk-core` (SigV4 RPC, MPC sidecar)
- `@quilibrium/qkms-sdk-react` (React hooks)
- `@quilibrium/qkms-sdk-react/solana`
- `@quilibrium/qkms-sdk-react/extended-chains` (Cosmos, Sui, Stellar)
- `@quilibrium/qkms-sdk-node` (server-side)
- `@quilibrium/qkms-sdk` (vanilla JS)

Supported keys: secp256k1 (DKLs23), Ed25519 (FROST), BLS12-381, BLS48-581 (Feldman VSS), Decaf448 (Threshold Schnorr), Ed448 (FROST), RSA 2048/3072/4096 (Shoup threshold / Paillier DKG).

**Read of this:** This is a Privy / Dynamic / Magic competitor with privacy-preserving wallet creation. ZAO currently uses iron-session + Wagmi for wallet UX. Worth evaluating qkms-sdk for the music-platform privacy story. But it's brand new (1.5 weeks old) - too early to bet on production.

## Following List (17 People, Curated)

| Handle | Likely role | Signal |
|---|---|---|
| @Treit | C# performance benchmarker | Craft / perf focus |
| @LPeter1997 | Compiler / language design | Tooling depth |
| @dustinmoris | Maintainer of dustinmoris/CI-Meow + .NET tools | .NET community |
| @swharden | Python scientific (sci-py vis) | Scientific computing |
| @GavinJoyce | Ember.js OG | JS legacy + craft |
| @NebuPookins | Java exception lib | Niche tooling |
| @sethetter | Web dev | Personal connection |
| @ianunruh | Infra eng | Personal connection |
| @pfletcherhill | Pete Fletcher-Hill | Possible Coinbase alum |
| @ADHDExtreme | Self-explanatory | Possible neurodivergent self-id |
| @cacktopus | Indie dev | Indie scene |
| @klutzworthy | Personal | Personal connection |
| @SakuraIsayeki | Indie dev | Personal connection |
| @jenna-t | Personal | Personal connection |
| @simplySnarky | Personal | Personal connection |
| @petricadaipegsp | Personal | Personal connection |
| @OrganizationUsername | Joke | Personal |

**Read of this:** Tiny following list = curated. **Zero major crypto/web3 names.** No Vitalik, Dan Romero, Varun, varun, dwr.eth, jacobs, balaji. She follows craft/tools people, not status. Suggests she does NOT respect status-based endorsement. The intro vector is contribution depth, never namedrop.

## Starred Repos (23 visible)

Notable selections:
- `coinbase/kryptology` (Go ECC libs, 868 stars) - she's ex-Coinbase
- `swyxio/spark-joy` (UX delight resources, 9.7K stars) - cares about user delight
- `tonsky/FiraCode` (font, 81K stars) - aesthetics
- `playframework/playframework` (12K stars) - her old Scala stack
- `zio/zio-quill` (compile-time SQL, 2K stars) - type-safe queries (relevant to FIP-16 GraphQL?)
- `Treit/MiscBenchmarks` (C# perf) - friend's perf playground
- `LanguageDev/Yoakke` (compiler libs in .NET) - her language-design interest
- `wesleyraptor/streamingphish` (ML phishing detection) - security
- `sirouk/quilibrium-node-exporter` (Prometheus exporter for Q) - operator-tooling acknowledgement
- `wwwtyro/cryptico` (RSA + AES JS, 1.2K stars) - applied crypto

## Old Blog `doctorless.github.io` (Dormant Since 2017)

Posts:
1. 2017-01-08 - rust-phone-part-0
2. 2017-01-11 - rust-phone-part-1
3. 2017-08-11 - "Your Company Should Have a Red Team"
4. 2017-08-12 - thinking-like-a-hacker-part-1
5. 2017-08-14 - thinking-like-a-hacker-part-2
6. 2017-08-19 - thinking-like-a-hacker-part-3

**Read of this:** 2017 vibe was *Rust-on-phones experimentation + offensive security mindset*. She stopped blogging Aug 2017 and never returned. Communication moved to code + protocol specs + casts.

## What ZAO Should NOT Do (Distilled)

1. **Do not DM Cassie on Farcaster or X.** Use GitHub issues / PRs / cast replies on her own threads.
2. **Do not name-drop.** "We know X who knows you" is anti-signal. Lead with code.
3. **Do not pitch.** Investments, partnerships, syndicates - all dead on arrival.
4. **Do not soften.** "Just wanted to check in" - delete. Lead with technical state.
5. **Do not invoke "AI-first" or "vibe coding" carelessly.** She included it in FIP-1 ("docs should optimize for AI-first / vibe-coding developers") but pejoratively. Use only if directly addressing docs UX.
6. **Do not ELI5 anything.** Assume she has read the source code you're referencing.
7. **Do not engage on hEDS / KKS / medical research.** It's her personal thing. Off-limits.
8. **Do not invoke product-management vocabulary.** "Roadmap, sprint, north-star, OKR" all bounce. She wrote "Product Managers: Go away." literally.
9. **Do not assume Friday or Sunday response.** Per activity heatmap, those days are dead.
10. **Do not repeat the Snapchain election framing as the only validator path.** FIP-13 is the open path.

## What ZAO SHOULD Do (Concrete)

1. **Run Hypersnap node first** (Doc 586). Quote sync time + p99 endpoint latency in any future PR or comment. Empirical credibility.
2. **Implement Hypersnap Issue #17** (notification aggregation, by stephancill). Adds the 8 unit tests + 1 integration test the issue calls for. Open PR after node is stable.
3. **File a follow-up issue: "ZAO music-creator integration - field report."** Bullet:
   - X casts/day from N artists in /zao channel
   - Y reactions, Z storage units rented
   - Specific endpoint that's slow under our load
   - One concrete fix proposal
   This is the artist-retention signal she explicitly asked for in FIP-1.
4. **Comment on FIP-19 thread** with: "ZAO running a Hypersnap read node + 4 polling bots. Application Usage market quantification: at our current traffic of [N reads/sec], the Application Usage credit would be [X]. Happy to be a quantification testbed once metering ships."
5. **Comment on FIP-13 thread** with: "ZAO interested in registering as Hyper validator at first epoch boundary after spec ships. We'll provide the operator FID 19640 and ed25519 key. Where does the registration event get submitted (mempool topic name)?"
6. **Reference TripleRatchet + her crypto repos** in any signing/key-management PR we open. Shows we read her stack.
7. **Wait for v0.11.7 release** (will include FIP-11 functional signers cutover). Test on testnet box before mainnet.
8. **Time PR submissions Tue UTC 22:00** (= Wed CT 5pm = her Wed peak the next day).

## Verified URLs (May 2 2026)

### Profile + activity
- https://github.com/CassOnMars (profile, 52 repos, 419 followers)
- https://github.com/CassOnMars?tab=repositories&sort=pushed (sorted recent activity)
- https://api.github.com/users/CassOnMars/events/public (public events, 56 in last 30d)
- https://api.github.com/users/CassOnMars/gists (1 gist total)
- https://api.github.com/users/CassOnMars/following (17 people)
- https://api.github.com/users/CassOnMars/starred (23 visible)

### Founding mission + FIP catalogue
- https://github.com/orgs/farcasterorg/discussions/1 - Hypersnap Meeting Notes 2026-01-06 (founding doc)
- https://github.com/orgs/farcasterorg/discussions/13 - **FIP: Open Consensus** for ZAO validator path
- https://github.com/orgs/farcasterorg/discussions/16 - FIP: GraphQL Query Layer
- https://github.com/orgs/farcasterorg/discussions/17 - FIP: Proof of Quality
- https://github.com/orgs/farcasterorg/discussions/19 - FIP: Proof of Work Tokenization (the $HYPS spec)
- https://github.com/orgs/farcasterorg/discussions/21 - FIP: Snap Compute

### Crypto refs
- https://github.com/CassOnMars/TripleRatchet (P-256 + SHA-3 multiparty Triple-Ratchet, 8 stars)
- https://github.com/CassOnMars/Wesolowski-VDF (Chia-derived, SHA-3, 4 stars, GPL/LGPL dual)
- https://github.com/CassOnMars/Timelock (RSA-style, RSW96 paper, 8 stars)

### NEW Cassie projects
- https://github.com/QuilibriumNetwork/qkms-sdk (threshold MPC wallet SDK, branch master 2026-04-13)
- https://github.com/farcasterorg/snap (Cassie's fork of upstream Snaps)
- https://github.com/farcasterorg/hypersnap-docs-web (docs site, branch master 2026-04-11)

### Old blog + history
- https://github.com/CassOnMars/doctorless.github.io/tree/master/_posts (6 posts, last 2017-08-19)
- https://web3galaxybrain.com/episode/Cassandra-Heart-Founder-of-Quilibrium (early 2024 podcast)

### Relevant external signals
- https://farcaster.xyz/cass.eth (Farcaster, FID 1325)
- https://twitter.com/cass_on_mars (X handle)
- https://www.coingecko.com/en/coins/wrapped-quil (QUIL price tracker)

### Internal cross-references
- research/farcaster/586-hypersnap-node-vps-install-playbook/ (install playbook)
- research/farcaster/587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/ (broad ecosystem)

## Open Questions for Future Audits

1. **Identities of farcasterorg's other ~7 members.** Only 6 names mappable publicly.
2. **FIP-13 Open Consensus implementation status.** Is `HyperValidatorRegistration` event handler actually wired? Watch for the PR.
3. **Cassie's Quilibrium team size.** ~24 devs estimated June 2024 per Mint Ventures. Current size unknown.
4. **Twitter @cass_on_mars activity.** We have the handle but didn't pull tweets - x.com gates non-auth fetches. Use last30days-skill if needed.
5. **Whether FIP-19 has a target launch block height yet.** Still spec-only as of 2026-05-02.
6. **What 2017 "thinking-like-a-hacker" series said.** Old blog content might reveal her offensive-security posture - useful context for security PR conversations.
7. **Confirm she still considers herself "ex-Farcaster"** vs current contributor (her bio says ex; but she clearly drives FIPs). Wording matters in any external reference.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install Hypersnap node per Doc 586 | Claude session | Ops | After GTHost VPS purchase |
| After node stable for 7 days, implement Issue #17 PR | Claude session + @Zaal | Code | Within 2 weeks of node going live |
| Comment on FIP-13 thread with ZAO interest in validator registration | @Zaal | Outbound | Once node is stable |
| Comment on FIP-19 thread with ZAO Application Usage data | @Zaal | Outbound | Once we have 30 days of traffic data |
| Re-validate this doc | Claude | Audit | 2026-06-02 (30-day SLA) |
| Watch for FIP-13 implementation PR | Claude | Monitor | Weekly |
| Pull @cass_on_mars X activity via last30days-skill | Claude | Research | If/when relevant |
| Read 2017 "thinking-like-a-hacker" 3-part blog series | Claude | Background | Optional |

## Bottom Line

Cassie is a 12-year coder, founder-mode, code-first. ZAO's profile - Farcaster client for music + creators - is the exact persona Hypersnap exists to support. She has filed the 11 FIPs that define what Hypersnap will become; we should read them all and respond to the ones that touch us (13 + 16 + 17 + 19 + 21). Engagement is technical, asynchronous, and patient. Best moves: run the node, file the PR on Issue #17, file the field report, comment on FIP-13 and FIP-19. Avoid: DMs, hedging, status-namedrops, product-management vocabulary, and her personal medical research project. The validator path via FIP-13 is dramatically more open than Snapchain's; if the spec ships, ZAO can self-register and become a Hypersnap validator within ~10 days.
