# 308 - Farcaster Ecosystem Spring 2026: Snaps, Neynar Stewardship, FarCon Rome

> **Status:** Research complete
> **Date:** 2026-04-08
> **Goal:** Capture the current Farcaster ecosystem momentum - Neynar's stewardship post-acquisition, Snaps as the new protocol primitive, FarCon Rome, Logos partnership, and ZAO's 3 shipped snaps as evidence of building

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Narrative** | Farcaster is thriving under Neynar stewardship - the protocol is public/free/open, builder energy is high, Snaps are the biggest feature launch since Frames v1 |
| **ZAO's position** | ZAO shipped 3 Farcaster Snaps in 12 days (zabal-snap, nouns-snap, duodo-snap) - USE this for credibility in the ecosystem |
| **Cast strategy** | DRAFT a cast positioning ZAO as active builders on Farcaster Snaps, link to the snap URLs, tag @farcaster_xyz |
| **FarCon Rome** | ATTEND or engage remotely - May 4-5, 2026, the annual Farcaster gathering, urbe.eth organizing |
| **Logos partnership** | MONITOR the Farcaster x Logos Circle (@deca12x thread) - aligned values (decentralized civil society + sufficiently decentralized social) |
| **Mini App discovery** | ZAO already has mini app discovery tab (`src/app/(auth)/ecosystem/page.tsx`, `src/app/api/miniapp/`) - Snaps complement this |

## Farcaster State of Play (April 2026)

### Neynar Acquisition (January 21, 2026)

Neynar acquired Farcaster from Merkle (Dan Romero, Varun Srinivasan) in a deal valued at ~$1 billion. Key facts:

- Farcaster raised $150M in 2024 from Paradigm and a16z but never achieved sustainable growth with a social-first model
- Neynar took over smart contracts, code repositories, mobile app (Warpcast), and Clanker (AI token launchpad)
- Dan Romero and Varun Srinivasan joined stablecoin startup Tempo (announced February 9, 2026)
- Neynar (backed by Haun Ventures) plans a builder-focused roadmap
- **Critical distinction** (from @deca12x): Farcaster the PROTOCOL is public, free, open. The company only owned one of the apps. Users are not locked in - you can switch apps without losing connections.

### Snaps Launch (March 27 - April 8, 2026)

Farcaster Snaps are server-driven interactive apps embedded in casts. ZAO researched this in depth in Doc 295.

- `@farcaster/snap` v1.15.1, 56 releases in 12 days, 300+ commits
- `@farcaster/snap-hono` v1.4.8 (Hono framework integration)
- 16 UI components across 4 categories
- JFS (JSON Farcaster Signatures) for POST authentication
- Free hosting via host.neynar.app (3 projects, 10 deploys/hr, 50MB max)

### ZAO's 3 Shipped Snaps

| Snap | Pages | Features | Key File |
|------|-------|----------|----------|
| **zabal-snap** | 4 | Token dashboard, activity feed, balance checker, leaderboard | `zabal-snap/src/app.ts` |
| **nouns-snap** | 5 | Noun viewer, random noun, live auction, avatar generator | `nouns-snap/src/app.ts` |
| **duodo-snap** | 2 | Home page, music page | `duodo-snap/src/app.ts` |

All 3 use Hono + `@farcaster/snap-hono`, CORS enabled, deployed with Vercel Edge support.

### FarCon Rome (May 4-5, 2026)

The annual decentralized Farcaster conference, organized by urbe.eth (@urbeEth). Rome, Italy. This is the community gathering - not a corporate event.

### Farcaster x Logos Circle (April 8, 2026)

@deca12x (CTO of Agartha, co-founder CherryBuilders, ETHRome) hosted a Farcaster x Logos Network circle:

- **Logos Network**: movement to rebuild civil society using decentralized tech - blockchain, messaging, storage
- **Alignment**: both fight enshittification of social media. Farcaster's sufficiently decentralized approach removes lock-in power.
- **Logos Circles**: spreading in major cities, promoting value-aligned initiatives
- **Rome connection**: urbe.eth bridges both communities

### Snapchain (Infrastructure Layer)

Farcaster's data layer, launched mainnet April 2025:
- Written in Rust, 10,000+ TPS
- Runs for less than $1,000/month
- Transactions are not Turing complete - social operations only (post, like, follow)
- Account-independent, pruned often, easy to shard

## Comparison: Farcaster Ecosystem Health Indicators

| Indicator | Pre-Acquisition (2025) | Post-Acquisition (Spring 2026) | Direction |
|-----------|----------------------|-------------------------------|-----------|
| Protocol development | Slowing (team distracted) | Snaps launched in 12 days, 300+ commits | UP |
| Builder energy | Mixed signals | 3+ snaps from ZAO alone, bootcamp running, Logos partnership | UP |
| Infrastructure | Snapchain launching | Snapchain mainnet, 10K TPS, Neynar API stable | UP |
| Community events | Scattered | FarCon Rome May 4-5, Logos Circles, bootcamp sessions | UP |
| Leadership | Founders stepping back | Neynar focused on builders, Dan/Varun at Tempo | Stable |
| User growth | Stalled | Unknown - need fresh DAU data | Unknown |
| Developer tools | Neynar API, Frames v2 | + Snaps SDK, + host.neynar.app free hosting | UP |

## ZAO OS Integration

### Already built

- **Mini app discovery**: `src/app/(auth)/ecosystem/page.tsx` + `src/components/ecosystem/EcosystemPanel.tsx`
- **Mini app API**: `src/app/api/miniapp/discover/route.ts` + `src/app/api/miniapp/search/route.ts`
- **Frame catalog**: `src/lib/farcaster/neynar.ts` (frame catalog, search, relevant frames functions)
- **3 Farcaster Snaps**: `zabal-snap/`, `nouns-snap/`, `duodo-snap/` - all using `@farcaster/snap-hono`
- **Snaps research**: Doc 295 (deep dive), Doc 304 (Hypersnap + free Neynar API)
- **Mini Apps research**: Doc 173 (integration), Doc 250 (llms-full.txt deep dive)

### What to share (cast content)

ZAO should cast about:
1. Shipping 3 Farcaster Snaps in the first 12 days of the SDK being live
2. The snaps cover different domains: tokens (ZABAL), governance (Nouns), music (Duodo)
3. Building on the sufficiently decentralized protocol - not locked in to any single client
4. FarCon Rome anticipation / Logos alignment

## Draft Cast

> the farcaster community keeps building
>
> we shipped 3 snaps in the first 12 days of the SDK dropping:
>
> - ZABAL snap - token dashboard, balance checker, leaderboard
> - Nouns snap - noun viewer, live auction, avatar generator
> - Duodo snap - music discovery
>
> all built on @farcaster/snap-hono, the new protocol primitive for interactive in-feed apps
>
> snaps are what frames v1 should have been - 16 UI components, JFS auth, persistent state, multi-page flows. server-driven, no client-side code.
>
> protocol is open. builders are building. the neynar era is off to a strong start.
>
> see you at farcon rome

## Sources

- [The Great Convergence - @nichochar (agent convergence context)](https://x.com/nichochar/status/2039739581772554549)
- [Farcaster x Logos Circle - @deca12x](https://x.com/deca12x/status/2041919642742952070)
- [Neynar acquires Farcaster - Neynar Blog](https://neynar.com/blog/neynar-is-acquiring-farcaster)
- [Farcaster founders join Tempo - CoinDesk](https://www.coindesk.com/business/2026/02/09/farcaster-founders-join-stablecoin-startup-tempo-after-neynar-acquires-social-protocol)
- [FarCon Rome](https://www.farcon.eu/)
- [Farcaster Snaps SDK - GitHub](https://github.com/farcasterxyz)
- [Farcaster Docs](https://docs.farcaster.xyz/)
- [Neynar acquires Farcaster - CoinDesk](https://www.coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app)
- [Snapchain launch - The Block](https://www.theblock.co/post/347606/decentralized-social-media-protocol-farcaster-launches-blockchain-like-data-layer-snapchain)
