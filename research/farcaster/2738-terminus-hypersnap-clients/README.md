---
topic: farcaster
type: comparison
status: research-complete
last-validated: 2026-11-19
superseded-by:
related-docs: "2736, 2666, 2418, 2385, 309, 304"
original-query: "resaerch terminus and how it work sand other hypersnap clients"
tier: STANDARD
---

# 2738 - Hypersnap clients (Quilcast, Castora, Arches, Cabildo), Hypersnap itself, and "Terminus"

> **Goal:** Say what a Hypersnap client is, which ones exist on 19 Nov 2026, how they sign in and talk to the network, and what Sparkz can build on Hypersnap next. Scope widened mid-run by Zaal ("dive into more things for hypersnap").
>
> **Builds on [doc 2736](../2736-sparkz-farcaster-hypersnap-build-guide/) (12 Nov),** which already covers Sparkz sign-in, the 12 Nov hard fork, HTTP-not-gRPC, Neynar, and ten open-source Farcaster clients with licences. This doc adds only what changed or was missing: the Hypersnap-only clients and tools (Castora, Arches, Cabildo, client-snapshot), Quilcast's state a week later, live node figures, the governance and token discussions, the Terminus search, and a build order now that Sparkz has a signer on main.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **"Terminus" is NOT FOUND.** Do not plan on it until Zaal names its link or author. | Searched hypersnap.org's full docs (190,486 bytes, 0 hits; the same file has 312 hits for "hypersnap"), the farcasterorg/hypersnap repo, GitHub repo search ("terminus farcaster", "terminus hypersnap"), and the ZAO research library and vault. Not searched: X, farcaster.xyz casts, Discord. It may be a client launched outside GitHub, or a different name. |
| 2 | **USE Quilcast as the reference Hypersnap client.** | Open source (MIT, LICENSE file read), live web + iPhone + Android apps, last commit 2026-11-20, release v1.1.1 on 2026-11-06. It reads the public node's HTTP API and submits browser-signed protobuf messages to `/v1/submitMessage`, the same pattern Sparkz already uses. |
| 3 | **KEEP Sparkz on the same Farcaster FIDs, and know which side of the fork it reads.** No new identity work is needed. | Hypersnap reads FIDs, custody and signers from the on-chain IdRegistry and KeyRegistry, so a Sparkz user's FID is the same on both sides. But Hypersnap hard-forked from Snapchain on about 2026-11-12 (two validator sets, with a "shuttle" relaying signed messages; [doc 2736](../2736-sparkz-farcaster-hypersnap-build-guide/), [doc 2666](../2666-hypersnap-hard-fork-protocol-layer-oct2026/)). Messages from native FIDs (from 2^32, registered by proof of work) and gasless signers exist only on the Hypersnap side. |
| 4 | **SKIP any token or reward plan.** | Tokenomics are open proposals only (FIP discussions #19 and #26). hypersnap.org says "no buy/claim flow or guaranteed reward promise", and running a node "is not a guaranteed token-reward programme". |
| 5 | **Build order for Sparkz:** post a Spark to Hypersnap first (the signer already exists), then a Hearth feed read from the public node, then mini-app notifications. See "What Sparkz could build". | Each step reuses code already on Sparkz main. |

## What Hypersnap is (facts, 19 Nov 2026)

| Fact | Value | Source |
|---|---|---|
| What it is | "a Rust implementation of a Farcaster node", whose HTTP API at `/v2/farcaster/*` mirrors the Farcaster v2 API shape so existing SDKs work | hypersnap.org docs, Introduction |
| Relation to Snapchain | A fork: GitHub tagline "Snapchain, made hyperdimensional". The contributor list carries Snapchain's history (aditiharini 245, sanjayprabhu 154, adityapk00 75 commits), with CassOnMars (Cassie Heart, Quilibrium) at 120 and doing current work. Since the ~2026-11-12 cutover it is a separate validator set (doc 2736) | GitHub API, farcasterorg/hypersnap |
| Licence | GPL-3.0 (LICENSE file read) | raw LICENSE |
| Activity | created 2026-01-04; last push 2026-11-17; 76 stars, 28 forks; last 5 commits 14-16 Nov 2026 by Cassandra Heart (rate limiter, streaming snapshots, native-FID block deadline fix, authenticated gossip). Releases v0.11.6 (2026-03-31) and v0.11.8 (2026-05-07), while the live node reports version 0.17.15, so GitHub releases lag the deployed code | GitHub API; node `/v1/info` |
| Live public node | `https://haatz.quilibrium.com`, run by Quilibrium. At 19 Nov 2026 it reports 914,654,984 messages, 3,358,375 FID registrations, ~799 GB, 2 data shards | `curl https://haatz.quilibrium.com/v1/info` |
| Ports | HTTP `:3381` (reads, webhooks, mini apps); gRPC `:3383` (consensus, gossip, message submission) | hypersnap.org docs |
| Identity | FID from on-chain IdRegistry; custody address (EIP-712 signs management calls); Ed25519 signers from KeyRegistry sign casts. "It is not an identity system" | hypersnap.org docs, Farcaster identity |
| New on Hypersnap | **Gasless signers**: KEY_ADD / KEY_REMOVE as network messages, with no KeyRegistry transaction. **Native accounts**: FIDs from 2^32, registered by custody signature plus proof of work | farcasterorg/hypersnap docs/native-registration.md; Quilcast README |
| Read API | Public, no keys, no logins: user by FID or username, cast by hash, following and trending feeds, search, batch hydration | hypersnap.org docs |
| Write API | Protobuf messages signed by an FID signer, submitted over gRPC or the node's `/v1/submitMessage` | hypersnap.org docs; Quilcast README |
| Extras | Webhooks (EIP-712 signed, HMAC deliveries) and the full Farcaster Mini App spec including notifications | hypersnap.org docs |
| Governance | 26 discussions in farcasterorg/protocol; most active is "FIP: Proof of Work Tokenization" (#19, 36 comments, updated 2026-11-03), then Native Channels (#14), Snap Compute (#21), Open Consensus for validators (#13) | GitHub GraphQL, farcasterorg/protocol discussions |
| Node cost | 16 GB RAM floor and about 129 MB/day disk in hyper mode; full figures in doc 2418 | [doc 2418](../2418-hypersnap-state-and-zao-feasibility/) |

## Hypersnap clients and tools

| Name | What | Sign-in / keys | Reads / writes | Open source | Activity |
|---|---|---|---|---|---|
| **Quilcast** (quilcast.com, by Nikita Kolmogorov / backmeupplz) | Full client: web, iPhone, Android. Feeds, threads, notifications with Web Push, DMs and Spaces relayed from farcaster.xyz, wallet with LI.FI swaps, mini apps, scheduled casts, MySpace-style profiles, 22 languages | Recovery phrase (same derivation as Warpcast), or an external wallet as custody that signs a gasless KEY_ADD; keys stay in browser IndexedDB. Can create a new FID for about $0.20 of ETH on Optimism | Reads the public node's HTTP API; writes browser-signed protobuf to `/v1/submitMessage` | MIT | created 2026-10-20, last commit 2026-11-20, v1.1.1 on 2026-11-06, 11 stars |
| **Terminus** | NOT FOUND (see Decision 1) | - | - | - | - |
| **Castora Desktop** (arcabotai) | Tauri v2 desktop client, macOS first; feed, compose, account panels | Signer key in the OS keychain; V1 existing FIDs only | Reads `haatz.quilibrium.com`; Phase 0 write spike (CastAdd encoder) | No LICENSE file found | created 2026-06-01, last push 2026-06-02 (stalled) |
| **Arches / Hypersnap Lite** (jpfraneto) | Lite is a write-only self-hosted relay; Arches adds a one-command community client (domain, web UI, local feed, Redis/Postgres) | Admin FID set at install | Writes only, through the relay | GPL-3.0 | created 2026-05-28, last push 2026-05-29 |
| **Cabildo** (arcabotai) | Async public forum for Hypersnap builders; maps posts to casts | Not documented in the README | gRPC HubService (GetCastsByParent, SubmitMessage) | No LICENSE file found | created and last pushed 2026-05-18 |
| **client-snapshot** (farcasterorg) | Snapshot of the Farcaster client monorepo (mobile + web), without the Farcaster Wallet | Reference only; backend and identity are "integration work" | - | (not read) | pushed 2026-08-29 |
| **hypersnap.org** (Felirami / Arca) | Community docs, playground, developments log, /snap economics notes | - | Uses the public node | (not read) | last push 2026-11-15 |

## What Sparkz could build on Hypersnap (ranked by effort)

Sparkz already ships Hypersnap plumbing on main: `src/app/_components/HypersnapSigner.tsx` (browser Ed25519 key, custody wallet signs a gasless KEY_ADD), `src/lib/hypersnap-proto.ts`, `src/lib/hypersnap-vault.ts`, `src/lib/hypersnap.ts`, and routes `src/app/api/hypersnap/{signer,submit,profile,health}/route.ts`. Notes in `docs/HYPERSNAP.md`.

| Rank | Build | Effort | Files it touches |
|---|---|---|---|
| 1 | **Cast a Spark to Hypersnap** when it goes live ("PR 3" in the HypersnapSigner comment): sign a CastAdd with the browser key and submit | Small, signer and submit route exist | `src/lib/hypersnap-proto.ts` (CastAdd encoder), `src/app/_components/HypersnapSigner.tsx`, `src/app/api/hypersnap/submit/route.ts`, and the Spark UI from sparkz #418 |
| 2 | **Hearth activity feed from the public node**: show casts that mention a Hearth's URL or channel, read with no keys | Small to medium | `src/lib/hypersnap.ts` (read client), a component on the Hearth page `src/app/c/[slug]/page.tsx` |
| 3 | **Mini-app notifications through Hypersnap** ("a Hearth you back lit a Spark"), using Hypersnap's mini-app send endpoint instead of only native push in build 7 | Medium; needs mini-app registration signed by the custody key | `src/app/.well-known/farcaster.json/route.ts`, a new send helper next to `src/lib/hypersnap.ts` |
| 4 | **Webhook into Sparkz**: Hypersnap's signed webhooks for reactions on a Hearth's casts, counted as backing signals | Medium | a new webhook route under `src/app/api/hypersnap/`, storage is a DB migration (Zaal approves) |
| 5 | **Native FID onboarding** for people with no Farcaster account (proof-of-work registration) | Large, and the free-onboarding proposal is not live yet (hypersnap.org lists it as "proposal") | `src/app/api/auth/`, `src/lib/session.ts`; skip until activated |

## Also See

- [Doc 2736 - Sparkz build guide: Farcaster sign-in, Hypersnap and open-source clients](../2736-sparkz-farcaster-hypersnap-build-guide/) - read this first; the ten-client licence table lives there
- [Doc 2666 - The Hypersnap hard fork: the protocol layer](../2666-hypersnap-hard-fork-protocol-layer-oct2026/)
- [Doc 2418 - Hypersnap state and ZAO feasibility](../2418-hypersnap-state-and-zao-feasibility/) - node hardware, cost, licence detail
- [Doc 2385 - Farcaster client landscape (Aug 2026)](../2385-farcaster-client-landscape-aug2026/)
- [Doc 309 - Snapchain and Hypersnap protocol deep dive](../309-snapchain-hypersnap-protocol-deep-dive/)
- [Doc 304 - Quilibrium Hypersnap as a free Neynar API](../304-quilibrium-hypersnap-free-neynar-api/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Send the Terminus link or author name, so it can be added to the clients table | Zaal | Reply | When convenient |
| Plan "Cast a Spark to Hypersnap" after sparkz #418 lands | sparkz lane | PR plan | After #418 merges |
| Try Quilcast with a ZAO FID to see a working Hypersnap client end to end | Zaal | Test | Optional |

## Sources

- [farcasterorg/hypersnap repo and README](https://github.com/farcasterorg/hypersnap) [FULL]
- [Hypersnap LICENSE](https://raw.githubusercontent.com/farcasterorg/hypersnap/main/LICENSE) [FULL]
- [Native registration doc](https://github.com/farcasterorg/hypersnap/blob/main/docs/native-registration.md) [FULL]
- [hypersnap.org full docs (llms-full.txt)](https://hypersnap.org/llms-full.txt) [FULL - intro, identity and auth sections read; API reference skimmed by heading]
- [Public node status](https://haatz.quilibrium.com/v1/info) [FULL - live JSON, 19 Nov 2026]
- [Quilcast README and LICENSE](https://github.com/backmeupplz/quilcast) [FULL]
- [Castora Desktop](https://github.com/arcabotai/castora-desktop), [Cabildo](https://github.com/arcabotai/cabildo), [Hypersnap Lite](https://github.com/jpfraneto/hypersnap-lite), [hypersnap.org repo](https://github.com/arcacomputer/hypersnapweb) [PARTIAL - README head and LICENSE only]
- [farcasterorg protocol discussions (community)](https://github.com/orgs/farcasterorg/discussions/19) [PARTIAL - titles, comment counts and dates from the GitHub API; thread bodies not read]
- Terminus [FAILED - hypersnap.org docs, farcasterorg repo, GitHub repo search and the ZAO library and vault searched; DuckDuckGo returned a CAPTCHA and Google returned no results; X, farcaster.xyz and Discord not searched]
