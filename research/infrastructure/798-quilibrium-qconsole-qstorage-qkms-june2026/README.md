---
topic: infrastructure
type: research
status: research-complete
last-validated: 2026-06-06
related-docs: [314-quilibrium-network-comprehensive-deep-dive, 304-quilibrium-hypersnap-free-neynar-api, 309-snapchain-hypersnap-protocol-deep-dive, 762-quilibrium-stack-verification]
original-query: "Research more about Quilibrium - what's new since May 2026, Quorum messenger, JS SDK / integration path, QUIL token / node economics"
tier: FULL
---

# 798 - Quilibrium June 2026 Update: QConsole, QStorage, QKMS, Quorum

> **Status:** Research complete
> **Date:** June 6, 2026
> **Goal:** Update doc 314 (deep dive, validated 2026-05-21) with net-new developments across four angles: what's new since May, Quorum messenger, JS SDK / integration path, and QUIL token / node economics.
> **Supersedes nothing** - this is an additive delta on top of docs 314 (ecosystem deep dive) and 304 (haatz free Farcaster API).

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **QStorage (S3-compatible) for ZAO media** | BUILD NOW - the "Q4 2026" item from doc 314 can be pulled forward. S3-compatible endpoint means the existing `@aws-sdk/client-s3` works with near-zero code. 5GB free, egress underwritten. Use for decentralized backup of music/art assets |
| **QKMS for agent wallet key security** | SPIKE - highest-value new finding. QKMS is an embedded-wallet SDK (Privy/Turnkey competitor) with threshold MPC. Use a 2-of-3 split so no single machine holds `APP_SIGNER_PRIVATE_KEY` for the VAULT/BANKER/DEALER agents. Directly reinforces `.claude/rules/secret-hygiene.md` |
| **QKMS for member embedded wallets** | SKIP for now - ZAO already has Farcaster/SIWE auth. Marginal benefit, and QKMS still beta (no social login, no key export yet) |
| **haatz / Hypersnap free Farcaster API** | KEEP - unchanged from docs 304/314. Now has OFFICIAL API docs (was reverse-engineered before). Resolve doc 304's "write endpoints unknown" gaps against the official docs |
| **Quorum messenger as XMTP replacement** | STUDY, do not migrate - repos now public + active, but still beta and no mature web SDK. XMTP stays production (`src/contexts/XMTPContext.tsx`) |
| **Run a Quilibrium node / hold QUIL** | SKIP - unchanged. QUIL ~$0.015-0.023, mcap ~$14-20M, thin liquidity. No ZAO need |

## What Changed Since Doc 314 (the headline)

The biggest shift since the May deep dive is that **Quilibrium became buildable**. Doc 314 rated it "WATCH closely - not ready for production." That changed with the launch of **QConsole**, a developer control plane that exposes two production services (QStorage + QKMS) behind AWS-style credentials.

### QConsole - AWS-style control plane
`https://qconsole.quilibrium.com`

- **Passkey onboarding** - no seed phrase (uses secure enclaves / HSMs when available)
- **Hierarchical IAM keys** - like AWS accounts. Create custom roles with least-privilege scoping per service or user
- Capabilities: view balances, connect APIs, **deploy static websites**, **launch QCL tokens** (Quilibrium's contract language)
- Credentials issued as **S3-style access key + secret key**

## Angle 1 - JS SDK / Integration Path (biggest upgrade)

Doc 314 listed "JS SDK immaturity" as the #1 blocker (channels SDK at 1 star). That blocker is now **partially removed** because storage no longer needs a bespoke SDK.

| Surface | Package / Endpoint | Status | ZAO read |
|---------|-------------------|--------|----------|
| **QStorage** | `https://qstorage.quilibrium.com` (S3 API) | Production | BUILD NOW - use `@aws-sdk/client-s3` |
| **QKMS** | `@quilibrium/qkms-sdk-react`, `-node`, `-sdk` | Beta (published) | Spike for agent keys |
| **Channels** | `quilibrium-js-sdk-channels` (MIT) | 1 star, Apr 15 2026 | Still immature - messaging not ready |

### QStorage = S3-compatible object storage
- Endpoint: `https://qstorage.quilibrium.com`
- Same auth model as Amazon S3: pass QConsole access key + secret key
- "Bucket" model identical to S3, but contents are **encrypted and spread across the network's shards and nodes**
- Works with any S3-compatible client/SDK by repointing the endpoint
- **5GB free tier** (mirrors AWS), **egress underwritten** by the network's query-execution model (no surprise retrieval bills)

Integration sketch for ZAO (`src/lib/storage/qstorage.ts`):
```typescript
import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.QSTORAGE_ENDPOINT // https://qstorage.quilibrium.com
const accessKeyId = process.env.QSTORAGE_ACCESS_KEY // from QConsole, server-only
const secretAccessKey = process.env.QSTORAGE_SECRET_KEY // from QConsole, server-only

export const qStorage = new S3Client({
  endpoint,
  region: 'auto',
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
})
```
(Keys are server-only env vars - never expose to the browser, per `.claude/rules/api-routes.md`.)

## Angle 2 - QKMS: Embedded-Wallet Platform (the sleeper)

Doc 314 described QKMS abstractly as "key management." It is in fact a **full embedded-wallet SDK** - a Privy / Web3Auth / Turnkey competitor.

| Aspect | Detail |
|--------|--------|
| Tagline | "Create and manage wallets across multiple chains using distributed key generation - no single party ever holds the full private key" |
| Packages | `@quilibrium/qkms-sdk-react`, `@quilibrium/qkms-sdk-node`, `@quilibrium/qkms-sdk` |
| Crypto | Threshold MPC: DKLs23, FROST, Feldman VSS |
| Default ceremony | 2-of-2 (browser + server sidecar). Also 2-of-3, 3-of-5 |
| Server | `https://qkms.quilibrium.com` |
| Auth | Email OTP, wallet signature (MetaMask), JWT via the QNZM auth bridge |
| Setup | Create QNZM account -> generate Client API Key in QNZM IAM -> pass `appId` + `clientKey` |
| Maturity | Beta - no social login, SMS OTP, key export, key refresh, or MFA yet |

React usage:
```javascript
import { QkmsProvider, useCreateWallet } from '@quilibrium/qkms-sdk-react'
// <QkmsProvider appId="<qnzm-account-id>" config={{ qkmsServer: 'https://qkms.quilibrium.com' }} />
const { createWallet } = useCreateWallet()
await createWallet({ chainType: 'ethereum' })
```

### The sharp ZAO use case: secure the agent keys
The marginal use of QKMS is member embedded wallets - but ZAO already authenticates members via Farcaster/SIWE, so the benefit is small.

The **high-value** use is the autonomous agents. `src/lib/agents/` (VAULT/BANKER/DEALER) currently sign transactions with a single `APP_SIGNER_PRIVATE_KEY` - a single point of compromise that `.claude/rules/secret-hygiene.md` exists to mitigate. A QKMS **2-of-3 threshold split** (agent process + server sidecar + cold share) means no machine ever holds the full agent key. Compromise of one host does not expose signing capability. This is a genuine security upgrade aligned with existing ZAO security rules, not a novelty integration.

**Caveat:** QKMS is beta with no key export. A migration path off QKMS must be validated before trusting it with production agent funds. Treat as a spike, not a production cutover.

## Angle 3 - QUIL Token / Node Economics (unchanged)

| Metric | Doc 314 (April) | Now (June 2026) |
|--------|-----------------|-----------------|
| QUIL price (native) | $0.0131 | ~$0.0153 |
| wQUIL price | - | ~$0.0227 |
| Market cap | $11.81M | ~$14-20M (sources vary) |
| Circulating supply | 902.28M | 902.28M |
| Liquidity | Thin ($16K/day) | Still thin |

- Roughly flat-to-slightly-up. Fair-launch, mining-only, "not for speculation" stance unchanged.
- Node hardware floor unchanged (v2.1 Bloom: 8 vCore / 16GB / 32GB optimal).
- **Recommendation unchanged: SKIP** running a node and SKIP QUIL as an investment. No ZAO need; minimal rewards at the hardware floor.

## Angle 4 - Quorum Messenger + Protocol Roadmap

### Quorum (flagship P2P E2EE group messenger)
- Repos now **public + active**: `quorum-desktop` (34 stars, Jun 5), `quorum-mobile` (41, Jun 2), `quorum-shared`. Daily commits.
- **Live features:** QNS (`.q` names + marketplace, priced in QUIL/wQUIL/USDC); **Quorum Apex** (monthly crypto subscription, QUIL first) with a **Sponsor feature** - community creators get sponsored by Apex subscribers and earn monthly (up to 4 sponsorships per subscriber).
- World's first P2P E2EE *group* messenger, no phone number, free base tier.
- **vs XMTP:** Quorum is fully P2P + passkey auth, but still beta and lacks a mature web SDK. Verdict from doc 314 holds: **study, do not migrate.** XMTP stays production.

### Protocol roadmap
- Still **v2.1 Bloom** in production.
- **Equinox** targeted Q2/Q3 2026 (imminent): serverless functions, fast distributed DBs, encrypted streaming.
- **Event Horizon** Q3/Q4 2026: distributed AI model training.
- Rising mainstream crypto-media coverage framing Quilibrium as "the next ICP" / "decentralized AWS" (Bitget, Gate, ChainCatcher).

## QCL / Bedlam - The App-Deployment Layer (additive to doc 314)

For network-native apps (beyond just storage/keys), Quilibrium uses **QCL (Q Compute Language)**:

- QCL is a **subset of Go**. Constraints: primitive types must have bounded sizes (`int` -> `int8/int16/int32`), arrays must be bounded (`[]byte` -> `[8]byte`).
- The compiler is **Bedlam** - doc 314 listed `bedlam` only as a "network testing/chaos tool"; it is also the QCL compiler. It compiles QCL into **OT circuits** (oblivious-transfer circuits) so computation runs privately over the oblivious hypergraph, and defines the RDF data schema + hypergraph relationships.
- **Deploy flow:** publish RDF schema -> compile QCL -> pay a QUIL fee. The `qclient` CLI does it in one step. You can deploy apps, tokens, files, and hypergraph schemas.

**ZAO read:** This is the path for the doc-314 "2027: deploy ZAO-specific curation/moderation logic as a QCL app" item. It is niche (Go-subset, requires QUIL fees, OT-circuit model) and only worth it once a privacy-preserving compute need is concrete. **Not now** - QStorage + QKMS cover the near-term value without writing QCL.

## Farcaster / haatz Touchpoint (additive to doc 304)

- haatz is still live and is ZAO's current Quilibrium touchpoint (`src/lib/farcaster/neynar.ts` dual-provider, free reads).
- **New:** there is now an OFFICIAL Hypersnap API docs site with an interactive playground at `hypersnap-docs.qstorage.quilibrium.com` (itself hosted on QStorage - they are dogfooding static hosting). Doc 304's endpoint table was reverse-engineered; the official docs can now resolve the "write endpoints: unknown" gaps.
- The farcasterorg logo is now CC0.

## Open Questions / Needs a Human Browser

The Quilibrium docs site (`docs.quilibrium.com`), the QStorage-hosted Hypersnap docs, and the npm registry all hard-block automated fetch behind Cloudflare. The following were confirmed via GitHub repos + multiple search sources but need a browser visit to nail down exactly:

1. Exact published version numbers + weekly download counts for the `@quilibrium/qkms-sdk-*` packages
2. The official Hypersnap write-endpoint list (does haatz support cast posting / follows / signer creation, or read-only?)
3. QStorage pricing tiers above the 5GB free tier
4. QKMS key-export / migration-off path (blocker for production agent funds)

## Updated ZAO Recommendation Matrix

| Service | Maturity | Doc 314 (May) | Now (June) |
|---------|----------|---------------|------------|
| haatz free Farcaster reads | Live + documented | KEEP | KEEP |
| QStorage (S3 media backup) | Production | "Q4 2026" | **BUILD NOW** |
| QConsole | Live | n/a | Onboard, create IAM keys |
| QKMS (agent key security) | Beta | n/a (mislabeled) | **SPIKE - highest value** |
| QKMS (member wallets) | Beta | n/a | SKIP (already have SIWE) |
| Quorum messenger | Beta, public | Study | Study (XMTP stays) |
| Run node / hold QUIL | Thin/unchanged | SKIP | SKIP |

## Sources

- [QConsole](https://qconsole.quilibrium.com/)
- [QStorage Getting Started](https://docs.quilibrium.com/docs/api/q-storage/api-reference/getting-started/)
- [QStorage Overview](https://docs.quilibrium.com/docs/api/q-storage/overview/)
- [QKMS Overview](https://docs.quilibrium.com/docs/api/q-kms/overview/)
- [Credentials](https://docs.quilibrium.com/docs/api/credentials/)
- [Q Service APIs](https://docs.quilibrium.com/docs/build/q-service-apis/)
- [qkms-sdk (GitHub)](https://github.com/QuilibriumNetwork/qkms-sdk)
- [Quilibrium GitHub org](https://github.com/QuilibriumNetwork)
- [Quorum Messenger](https://www.quorummessenger.com/)
- [QNS-live announcement (X)](https://x.com/QuilibriumInc/status/2008942317458149600)
- [Hypersnap API docs](https://hypersnap-docs.qstorage.quilibrium.com/)
- [Bitget: "Will Quilibrium be the next ICP?"](https://www.bitget.com/news/detail/12560604065405)
- [Gate: Decentralized computing / next ICP](https://www.gate.com/learn/articles/the-new-story-of-decentralized-computing-will-quilibrium-be-the-next-icp/3379)
- Internal: doc 314 (Quilibrium deep dive), doc 304 (haatz free Neynar API), doc 309 (Snapchain/Hypersnap), doc 762 (Quilibrium stack verification)
</content>
</invoke>
