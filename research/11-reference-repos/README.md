# Reference Repositories

> All repos being tracked for ZAO OS development

## Core Protocol

| Repo | Purpose | Status |
|------|---------|--------|
| [farcasterxyz/protocol](https://github.com/farcasterxyz/protocol) | Farcaster protocol specification | Researched ✅ |
| [farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) | Hub node + SDKs (`hub-nodejs`, `hub-web`, `core`) | Researched ✅ |

## Infrastructure

| Repo | Purpose | Status |
|------|---------|--------|
| [QuilibriumNetwork](https://github.com/QuilibriumNetwork) | Decentralized compute/storage/networking | Researched ✅ |
| [Hats-Protocol/hats-anchor-app](https://github.com/Hats-Protocol/hats-anchor-app) | NFT-based role hierarchies for DAOs | Researched ✅ |

## Tools & Clients

| Repo | Purpose | Status |
|------|---------|--------|
| [farcasterorg/hypersnap](https://github.com/farcasterorg/hypersnap) | Farcaster tooling | Needs manual review ⚠️ |

## AI & Memory

| Repo | Purpose | Status |
|------|---------|--------|
| [GoogleCloudPlatform/generative-ai/.../always-on-memory-agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent) | Persistent AI memory patterns | Researched ✅ |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Claude persistent memory tool | Researched ✅ |

## API Resources

| Repo | Purpose | Status |
|------|---------|--------|
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | Curated list of public APIs | Researched ✅ |

---

## NPM Packages to Use

| Package | Purpose |
|---------|---------|
| `@farcaster/hub-nodejs` | Node.js gRPC client for Farcaster hubs |
| `@farcaster/hub-web` | Browser gRPC-Web client |
| `@farcaster/core` | Message builders, crypto, protobuf types |
| `@farcaster/auth-kit` | "Sign In With Farcaster" React components |
| `@farcaster/auth-client` | Headless SIWF auth |
| `@farcaster/frame-sdk` | Frames v2 SDK |
| `@neynar/nodejs-sdk` | Neynar REST API wrapper |
| `@zoralabs/protocol-sdk` | Zora NFT protocol |
| `viem` | Ethereum client library |
| `wagmi` | React hooks for Ethereum |
| `@hatsprotocol/sdk-v1-core` | Hats Protocol core SDK (role management) |
| `@hatsprotocol/sdk-v1-subgraph` | Query hat trees via The Graph |
| `@hatsprotocol/modules-sdk` | Deploy/configure eligibility modules |
| `howler` | Audio playback library |
| `prisma` | PostgreSQL ORM |

---

## External APIs

| Service | Endpoint | Auth | Purpose |
|---------|----------|------|---------|
| Neynar | `api.neynar.com/v2` | API key | Farcaster data, feeds, managed signers |
| Pinata Hub | `hub.pinata.cloud` | Free | Direct hub access |
| Audius | `discoveryprovider.audius.co/v1/` | None | Decentralized music streaming |
| Sound.xyz | `api.sound.xyz/graphql` | GraphQL | Music NFT data |
| Spinamp | `api.spinamp.xyz` | — | Aggregated on-chain music |
| EAS | Base contract | On-chain | Attestation service for ZIDs/Respect |
