# 95 — Solana + WaveWarz Integration & Multi-Wallet/Social Settings Redesign

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Evaluate Solana wallet integration, WaveWarz partnership, and redesign the Settings page for multi-chain wallets + multi-social connections

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Solana wallet lib** | `@solana/wallet-adapter-react` v2 — supports Phantom, Solflare, Backpack, 20+ wallets. Proven Next.js compatibility. |
| **Architecture** | Keep Wagmi (EVM) + add Solana adapter side-by-side. Do NOT replace Wagmi. Store Solana pubkey in `users.solana_wallet` column. |
| **WaveWarz integration** | Embed as ecosystem partner + deep-link to battles from the `/wavewarz` Farcaster channel feed. No API exists — partnership-first approach. |
| **Settings redesign** | Restructure into 4 collapsible sections: Identity, Wallets, Socials, Preferences. Add opt-in toggles for each connection. |
| **Solana AI ecosystem** | Not relevant now — `awesome-solana-ai` is DeFi/agent tooling. Revisit when building the ElizaOS agent (doc 48). |
| **DB migration** | Add `solana_wallet`, `twitter_handle`, `instagram_handle`, `soundcloud_url`, `audius_handle` columns to `users` table. |

---

## 1. Solana Wallet Integration

### Why Add Solana Support

- WaveWarz and many music NFT platforms (Sound.xyz competitors like DRiP, Audius' Solana integration) use Solana
- ZAO members may hold SOL-based music NFTs or tokens
- Multi-chain wallet display shows ZAO is chain-agnostic — important for a music community

### How It Works with the Current Stack

**Current state:** ZAO OS uses Wagmi + Viem for EVM wallets (Optimism, Base, Mainnet). Auth is via `iron-session` with wallet signature (SIWE) or Farcaster SIWF.

**Proposed addition:**

```
npm install @solana/wallet-adapter-react @solana/wallet-adapter-wallets @solana/web3.js
```

| Component | Current (EVM) | Addition (Solana) |
|-----------|--------------|-------------------|
| **Wallet lib** | `wagmi` + `viem` | `@solana/wallet-adapter-react` |
| **Connectors** | Injected, WalletConnect, Coinbase | Phantom, Solflare, Backpack |
| **Chains** | Mainnet, Base, Optimism | Solana Mainnet |
| **Auth** | SIWE signature → iron-session | NOT for auth — display/link only |
| **Storage** | `users.primary_wallet` (EVM) | `users.solana_wallet` (new column) |

**Key decision: Solana is opt-in for display, NOT for login.** ZAO's gating is based on EVM Respect tokens on Optimism. Solana wallet is a profile enrichment — members link it so others can see their Solana address (for tipping, NFT sends, etc.).

### Implementation Plan

1. **DB:** `ALTER TABLE users ADD COLUMN solana_wallet TEXT;`
2. **Provider:** Add `SolanaWalletProvider` alongside existing Wagmi provider in `src/app/layout.tsx`
3. **Settings UI:** "Connect Solana Wallet" button in the new Wallets section → signs a message to prove ownership → saves pubkey via `PATCH /api/users/profile`
4. **Profile display:** Show Solana address with SOL icon in ProfileDrawer and ProfileCard
5. **Validation:** Validate Solana address format (base58, 32-44 chars) in the Zod schema

### Solana AI Ecosystem (awesome-solana-ai)

The `solana-foundation/awesome-solana-ai` repo catalogs AI agent frameworks and DeFi tools for Solana:

| Category | Count | Relevance to ZAO |
|----------|-------|-------------------|
| AI Coding Skills (General) | 9 | Low — Anchor/NFT dev skills |
| AI Coding Skills (DeFi) | 17 | None — DEX/lending focus |
| AI Coding Skills (Infra) | 16 | Low — RPCs, bridges, oracles |
| AI Agents | 11 | Medium — ElizaOS + Solana Agent Kit |
| Developer Tools | 13 | Low — MCP integrations, security |

**Relevant for later:** When ZAO builds the ElizaOS agent (see memory: `project_elizaos_agent.md`), the **Solana Agent Kit** could enable the agent to interact with Solana protocols. Not needed now.

---

## 2. WaveWarz Integration

### What Is WaveWarz

**WaveWarZ** is an online music battle platform where community members vote to decide winners of 1v1 music competitions. Built with Next.js. Active on Twitter/X. Has run charity battles (raised $270+ for education).

| Attribute | Detail |
|-----------|--------|
| **Type** | Music battle / community voting platform |
| **Blockchain** | None confirmed — crypto-adjacent audience but no on-chain voting |
| **Farcaster presence** | None found (no channel, no casts) |
| **API** | None public |
| **Tech** | Next.js frontend |
| **Community overlap** | Crypto/music audience aligns with ZAO |

### Current ZAO State

`wavewarz` is already listed as a Farcaster channel in `community.config.ts` line 23:
```ts
channels: ['zao', 'zabal', 'cocconcertz', 'wavewarz'],
```

This means ZAO OS already shows casts from the `/wavewarz` Farcaster channel in the feed. But there's no deeper integration.

### Integration Path

Since WaveWarz has no public API or blockchain integration, the path is **partnership + ecosystem placement:**

1. **Add to ecosystem partners** in `community.config.ts`:
   ```ts
   { name: 'WaveWarZ', description: 'Music battles where the community decides the winner.', url: 'https://www.wavewarz.com', icon: 'battle' }
   ```
2. **Channel feed:** Already showing `/wavewarz` casts — working
3. **Future:** If WaveWarz adds an API or on-chain voting, integrate battle results into the ZAO governance feed or create a "Battles" tab
4. **Deeper idea:** ZAO could host its own WaveWarZ-style battles using the governance module — propose two tracks, community votes via Respect-weighted governance

---

## 3. Settings Page Redesign — Multi-Wallet & Multi-Social

### Current Settings Structure (SettingsClient.tsx — 1100+ lines)

The settings page is a single long scroll with these sections:
1. **Connections** — flat list of 5 items (Wallet, Farcaster, Posting, Messaging, Bluesky) + push notifications
2. **Farcaster Identity** — read-only profile card
3. **ZAO Profile** — editable fields (display name, bio, IGN, real name)
4. **Respect Tokens** — token balances
5. **Messaging** — XMTP preferences (2 toggles)
6. **Write Access** — Farcaster signer
7. **Wallets** — EVM wallet list with visibility toggles
8. **Logout**

### Problems

- **Flat structure doesn't scale.** Adding Solana wallet, Twitter, Instagram, SoundCloud, Audius makes the page overwhelming
- **Connections and Wallets are separate** but conceptually related
- **No concept of "optional social links"** — only Bluesky has connect/disconnect
- **No collapsible sections** — everything is always visible
- **The Connections counter ("3 of 5 connected") is hardcoded** — breaks when adding more

### Proposed Redesign

Restructure into **4 collapsible card sections** with clear opt-in patterns:

```
SETTINGS
├── Identity
│   ├── Farcaster Profile (read-only)
│   ├── ZAO Profile (editable: display name, bio, IGN, real name)
│   └── Respect Tokens
│
├── Wallets
│   ├── Primary Wallet (EVM — login wallet, always connected)
│   ├── Respect Wallet (EVM — if different)
│   ├── Solana Wallet (NEW — opt-in connect via Phantom/Solflare)
│   ├── Verified Addresses (from Farcaster)
│   └── Custody Address (from Farcaster)
│   [Each with copy + visibility toggle]
│
├── Connected Accounts
│   ├── Farcaster (always connected — it's how they logged in)
│   ├── Bluesky (opt-in — existing connect/disconnect)
│   ├── Twitter/X (NEW — opt-in, just store handle)
│   ├── Instagram (NEW — opt-in, just store handle)
│   ├── SoundCloud (NEW — opt-in, just store URL)
│   ├── Audius (NEW — opt-in, just store handle)
│   └── WaveWarZ (NEW — opt-in, just store profile URL)
│   [Each shows green dot if connected, "Connect" button if not]
│
├── Preferences
│   ├── Push Notifications (toggle)
│   ├── Messaging: Auto-join group (toggle)
│   ├── Messaging: Allow external DMs (toggle)
│   └── Write Access / Signer (connect widget)
```

### New Social Fields — Implementation

For Twitter, Instagram, SoundCloud, Audius, WaveWarZ: these are **simple text fields** (handle/URL), not OAuth connections. The user types their handle and we store it. No verification needed initially — these are self-reported social links, like a Linktree.

**DB migration:**
```sql
ALTER TABLE users
  ADD COLUMN solana_wallet TEXT,
  ADD COLUMN twitter_handle TEXT,
  ADD COLUMN instagram_handle TEXT,
  ADD COLUMN soundcloud_url TEXT,
  ADD COLUMN audius_handle TEXT,
  ADD COLUMN wavewarz_profile TEXT;
```

**Zod validation (add to `src/lib/validation/schemas.ts`):**
```ts
solana_wallet: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/).optional(),
twitter_handle: z.string().max(15).regex(/^[a-zA-Z0-9_]+$/).optional(),
instagram_handle: z.string().max(30).regex(/^[a-zA-Z0-9_.]+$/).optional(),
soundcloud_url: z.string().url().includes('soundcloud.com').optional(),
audius_handle: z.string().max(30).optional(),
wavewarz_profile: z.string().url().includes('wavewarz.com').optional(),
```

**Profile API update (`PATCH /api/users/profile`):** Accept these new fields in the request body.

**Profile display:** Show linked socials as icon row in ProfileDrawer (like Linktree mini).

### Dynamic Connection Counter

Replace the hardcoded "X of 5" with:
```ts
const walletConnections = [session.walletAddress, profile.solana_wallet].filter(Boolean);
const socialConnections = [session.fid, blueskyHandle, profile.twitter_handle, ...].filter(Boolean);
```

---

## 4. Implementation Priority

| Phase | Work | Effort |
|-------|------|--------|
| **Phase 1** | Settings UI restructure into collapsible sections | 1 day |
| **Phase 2** | Add social link fields (Twitter, IG, SoundCloud, Audius, WaveWarZ) — text inputs + DB columns | 1 day |
| **Phase 3** | Solana wallet connect (adapter setup + signature verification + storage) | 2 days |
| **Phase 4** | WaveWarZ ecosystem partner entry + governance battle concept | 0.5 days |
| **Phase 5** | Profile display update (show all connected wallets/socials in ProfileDrawer) | 1 day |

---

## Sources

- [awesome-solana-ai](https://github.com/solana-foundation/awesome-solana-ai) — Solana Foundation AI tools catalog
- [WaveWarZ](https://www.wavewarz.com/) — Music battle platform
- [@WaveWarZ on X](https://x.com/WaveWarZ) — WaveWarZ social presence
- [@solana/wallet-adapter](https://github.com/anza-xyz/wallet-adapter) — Official Solana wallet adapter for React
- [Solana Web3.js](https://solana.com/docs/clients/javascript) — Solana JavaScript SDK
- Current codebase: `src/app/(auth)/settings/SettingsClient.tsx`, `src/lib/wagmi/config.ts`, `community.config.ts`
