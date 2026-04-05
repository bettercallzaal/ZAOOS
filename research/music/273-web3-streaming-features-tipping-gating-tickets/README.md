# 273 — Web3 Streaming Features: Wallet Tipping, Token-Gated Rooms, NFT Tickets

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Research wallet-to-wallet tipping during live rooms, token-gated room access (ERC-20/721/1155), and NFT ticketing for scheduled rooms in ZAO OS
> **Updates:** Doc 213 (spaces architecture), Doc 160 (audio spaces landscape), Doc 012 (gating), Doc 155 (music NFT implementation)

---

## Part 1: Existing ZAO OS Infrastructure Audit

### What We Already Have

| Capability | File(s) | Status |
|-----------|---------|--------|
| **Wagmi v2 config** | `src/lib/wagmi/config.ts` | Mainnet, Base, Optimism chains configured |
| **RainbowKit wallet connect** | `src/app/providers.tsx`, `src/components/providers/RainbowKitWrapper.tsx` | Lazy-loaded, SSR-safe |
| **SIWE auth (wallet login)** | `src/components/gate/WalletLoginButton.tsx`, `src/app/api/auth/siwe/route.ts` | Full SIWE flow with nonce |
| **Viem public clients** | `src/lib/zounz/contracts.ts`, `src/lib/hats/client.ts` | `readContract` / `parseAbi` patterns established |
| **On-chain contract reads** | `src/lib/zounz/contracts.ts` | ZOUNZ Token (ownerOf, balanceOf), Auction (createBid payable), Governor |
| **Hats Protocol gating** | `src/lib/hats/gating.ts` | Permission-based access via on-chain hat verification |
| **Allowlist gating** | `src/lib/gates/allowlist.ts` | FID + wallet address allowlist checks |
| **Supabase Realtime** | `src/hooks/useListeningRoom.ts` | Live room state via Supabase channels |
| **Spaces / live rooms** | `src/app/spaces/`, `src/components/spaces/` | Stream.io + 100ms providers, RTMP multistream |
| **Session auth** | `src/lib/auth/session.ts` | iron-session with wallet address in session |
| **useWriteContract patterns** | `src/components/zounz/ZounzAuction.tsx` | Existing `createBid` payable transaction flow |

### Key Takeaway

ZAO OS already has the full wallet stack (wagmi, viem, RainbowKit, SIWE), on-chain read patterns (balanceOf, ownerOf via Hats and ZOUNZ), and a payable write transaction pattern (auction bidding). All three features below can be built on this foundation without new dependencies.

---

## Part 2: Wallet-to-Wallet Tipping During Live Rooms

### 2.1 How Other Platforms Handle Tipping

| Platform | Mechanism | Token(s) | Chain | UX |
|----------|-----------|----------|-------|-----|
| **Farcaster / DEGEN** | Comment-based (`100 $DEGEN`), off-chain allowance system, claim later | $DEGEN | Base | Zero-gas for tipper; daily allowance resets 8am UTC; claimed end-of-month |
| **Farcaster / Warps** | In-app currency purchased with fiat, sent to casters | Warps (off-chain) | N/A | Fiat on-ramp, instant delivery |
| **Friend.tech** | Buy/sell "keys" of creators; 10% fee (5% creator, 5% platform) | ETH | Base | Bonding curve pricing |
| **Stars Arena** | Fork of Friend.tech + explicit tipping + public threads | AVAX | Avalanche | Direct tip button |
| **Sound.xyz** | Collect/mint = tip; free editions 0.000777 ETH (0.000555 to artist) | ETH | Base/Optimism | "Collect" button on tracks |
| **Zora** | Collect posts; $ENJOY and $ZORA tokens for tipping in comments | ETH, $ENJOY, $ZORA | Zora Network | Inline comment tips |
| **Streamlabs (Twitch)** | Crypto tipping widget; BTC, ETH, LTC, BCH | Multi | Multi | Stream overlay alert |
| **$ZAP Protocol** | SDK for tipping, subscriptions, digital assets in streaming | Multi | Multi | Platform-integrated SDK |
| **Coop Records** | Mint songs = earn $COOP + $LOUDER tokens; subscription model | $COOP, $LOUDER | Base | Mint-to-earn |

### 2.2 Recommended Approach for ZAO OS

**Two tipping modes:**

#### Mode A: Native ETH Tips (simplest, ship first)
- User clicks "Tip" on a speaker/DJ in a live room
- Preset amounts: 0.001, 0.005, 0.01 ETH (or custom)
- Uses `useSendTransaction` from wagmi — already proven pattern
- Transaction goes directly wallet-to-wallet (no smart contract needed)
- Chain: **Base** (low gas, ~$0.001 per tx)

#### Mode B: ERC-20 Token Tips (USDC, $DEGEN, community token)
- Uses `useWriteContract` with ERC-20 `transfer(to, amount)` ABI
- For USDC: contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` on Base
- Requires one-time `approve` if using transferFrom pattern (not needed for direct `transfer`)
- Preset amounts: $1, $5, $10 USDC

#### Mode C: Off-Chain Respect Tips (zero gas, social layer)
- Tip Respect points during live rooms (already have Respect system)
- Supabase insert, no on-chain tx required
- Good for low-stakes engagement

### 2.3 Wagmi Implementation Patterns

**ETH tip (already supported by existing stack):**
```
useSendTransaction → { to: recipientAddress, value: parseEther("0.005") }
useWaitForTransactionReceipt → confirmation UI
```

**ERC-20 tip:**
```
useWriteContract → { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'transfer', args: [recipient, amount] }
useWaitForTransactionReceipt → confirmation UI
```

**Key UX decisions:**
- Show tip animations overlaid on the room (confetti, floating amounts)
- Aggregate tips in a leaderboard sidebar
- Store tip history in Supabase for reputation/leaderboard
- Use Supabase Realtime to broadcast tip events to all room participants

### 2.4 Fiat On-Ramp Option

**Coinbase Onramp API** — headless integration, Apple Pay support, no Coinbase account required, guest checkout. Lets non-crypto users buy ETH/USDC directly in the tip flow. Base chain supported natively.

---

## Part 3: Token-Gated Rooms

### 3.1 How Token Gating Works

1. Room creator sets a **gate rule** when creating a room: "Must hold [contract] on [chain]"
2. When a user tries to join, server calls `readContract` with `balanceOf(userAddress)` on the token contract
3. If balance >= minimum threshold, access granted; otherwise, show "You need [token] to enter"

### 3.2 Supported Token Standards

| Standard | Check Method | Use Case |
|----------|-------------|----------|
| **ERC-20** | `balanceOf(address) >= minAmount` | Hold 100 $DEGEN, hold any amount of community token |
| **ERC-721** | `balanceOf(address) >= 1` | Hold any NFT from collection (e.g., ZOUNZ) |
| **ERC-721 specific** | `ownerOf(tokenId) == address` | Hold a specific token ID |
| **ERC-1155** | `balanceOf(address, tokenId) >= 1` | Hold specific edition/token type |

### 3.3 Existing Solutions Comparison

| Solution | Approach | Pros | Cons |
|----------|----------|------|------|
| **thirdweb SDK** | React hooks + contract detection, auto-detects ERC type | Batteries-included, handles all standards | Extra dependency (large SDK), vendor lock-in |
| **tokengate (npm)** | Lightweight JS module for Ethereum token gating | Minimal, open-source (MIT) | Limited to Ethereum, no multi-chain |
| **Privy** | Auth + embedded wallets + token gating | Great UX for non-crypto users | Pricing, another auth layer |
| **Custom (viem + wagmi)** | `readContract` with balanceOf ABI | No new deps, full control, ZAO already has patterns | Must handle each standard manually |

### 3.4 Recommended Approach for ZAO OS

**Build custom using existing viem/wagmi stack.** ZAO OS already has:
- `readContract` patterns in `src/lib/hats/client.ts` and `src/lib/zounz/contracts.ts`
- Public clients for Mainnet, Base, Optimism
- Wallet address in session (`src/lib/auth/session.ts`)

**Server-side gate check (API route):**
```
// src/lib/gates/tokenGate.ts
createPublicClient → readContract({ address: contractAddress, abi: erc721Abi, functionName: 'balanceOf', args: [walletAddress] })
```

**Minimal ABI needed (universal):**
```
ERC-20:   balanceOf(address) returns (uint256)
ERC-721:  balanceOf(address) returns (uint256)
ERC-1155: balanceOf(address, uint256) returns (uint256)
```

### 3.5 Database Schema Addition

```sql
-- Add to spaces_sessions or create new table
ALTER TABLE spaces_sessions ADD COLUMN gate_config JSONB DEFAULT NULL;

-- gate_config example:
-- {
--   "type": "erc721",
--   "chain": "base",
--   "contract": "0xCB80Ef04DA68667c9a4450013BDD69269842c883",
--   "minBalance": 1,
--   "label": "ZOUNZ Holders Only"
-- }
```

### 3.6 Gate Presets for ZAO OS

| Preset | Contract | Chain | Min Balance | Description |
|--------|----------|-------|-------------|-------------|
| ZOUNZ Holders | `0xCB80...2883` | Base | 1 | ZOUNZ NFT holders only |
| Respect Holders | (Optimism ORDAO) | Optimism | 1 | Anyone with Respect tokens |
| $DEGEN Holders | `0x4ed4...` | Base | 1000 | Hold 1000+ $DEGEN |
| Custom ERC-20 | User-specified | Any | User-specified | Any ERC-20 token |
| Custom NFT | User-specified | Any | 1 | Any ERC-721/1155 collection |

---

## Part 4: NFT Tickets for Scheduled Rooms

### 4.1 Platform Landscape (2026)

| Platform | Chain | Key Feature | Pricing |
|----------|-------|-------------|---------|
| **Unlock Protocol** | Multi-chain (Ethereum, Polygon, Base, etc.) | "Lock" smart contracts, QR check-in, RSVP approval, airdrop tickets | Free to deploy, gas only |
| **GET Protocol** | Polygon | White-label, 200+ events/month, 121 countries, secondary market royalties | Per-ticket fee |
| **GUTS Tickets** | Polygon | Dynamic rotating QR codes, acquired by CM.com | Enterprise pricing |
| **SeatLabNFT** | NEAR | NFC authentication, $SEAT governance token | Per-ticket fee |
| **YellowHeart** | Ethereum | Music-focused (Maroon 5, Kings of Leon), secondary royalties | Per-ticket fee |
| **Oveit** | Multi-chain | Sell NFT tickets with fiat + crypto, event management suite | SaaS pricing |
| **thirdweb** | Any EVM | Deploy custom ERC-721/1155 ticket contracts, React SDK | Free (gas only) |

### 4.2 Recommended Approach: Unlock Protocol + Custom

**Why Unlock Protocol:**
- Open-source, battle-tested smart contracts
- Deploys on **Base** (matches ZAO OS chain preference)
- Built-in QR code verification — no app needed for door check
- Supports free + paid tickets, soulbound (non-transferable) option
- Has a published thirdweb contract (`PublicLock`) for direct deployment
- Time-bound NFTs (memberships that expire) — perfect for scheduled rooms

**How it works for ZAO OS scheduled rooms:**
1. Host creates a scheduled room in ZAO OS
2. Host enables "NFT Ticket" toggle, sets price (0 for free) and capacity
3. ZAO OS deploys an Unlock `PublicLock` contract on Base via thirdweb or direct deployment
4. Users mint/purchase ticket NFTs from the room's event page
5. At room start time, the join flow checks `balanceOf` on the lock contract
6. Optionally: ticket is burned on entry (one-time use) or kept as collectible POAP

### 4.3 Mint-and-Burn Pattern

For one-time-use tickets (burn on entry):

**Smart contract approach:**
- ERC-721 with `burn(tokenId)` function
- Only the contract owner (ZAO OS backend) or ticket holder can burn
- On room join: verify ownership, burn ticket, grant access
- Burned ticket leaves on-chain proof of attendance

**Simpler approach (recommended for V1):**
- Use Unlock Protocol's built-in expiration (time-bound keys)
- Ticket NFT auto-expires after event end time
- No burn needed — expired keys = used tickets
- Attendees keep the NFT as a collectible/POAP after expiry

### 4.4 Architecture Decision: ERC-721 vs ERC-1155

| Factor | ERC-721 | ERC-1155 |
|--------|---------|----------|
| **Uniqueness** | Each ticket unique token ID | Multiple tickets share same token ID |
| **Gas cost** | Higher per-mint | Lower (batch mint) |
| **Best for** | VIP/limited rooms (<100 tickets) | Large events (100+ tickets) |
| **Metadata** | Per-token URI | Shared URI per type |
| **Burn** | Simple `burn(tokenId)` | `burn(address, tokenId, amount)` |
| **Recommendation** | Use for ZAO OS (small community, <50 members per room) | Consider later for festivals/large events |

---

## Part 5: Comparison Table — All Three Features

| Feature | Complexity | New Dependencies | Gas Cost | Chain | Ship Timeline |
|---------|-----------|-----------------|----------|-------|---------------|
| **ETH Tipping** | Low | None | ~$0.001 (Base) | Base | Week 1 |
| **ERC-20 Tipping (USDC)** | Low-Medium | None | ~$0.001 (Base) | Base | Week 1-2 |
| **Respect Tips (off-chain)** | Low | None | $0 | N/A | Week 1 |
| **Token-Gated Rooms** | Medium | None | $0 (read-only) | Any | Week 2-3 |
| **NFT Tickets (Unlock)** | Medium-High | `@unlock-protocol/unlock.js` or direct contract | ~$0.01-0.05 (Base) | Base | Week 3-4 |
| **NFT Tickets (Custom)** | High | Smart contract deployment | ~$0.01-0.05 (Base) | Base | Week 4-6 |
| **Fiat On-Ramp (Coinbase)** | Medium | Coinbase Onramp SDK | $0 (API) | Base | Week 2-3 |

---

## Part 6: Implementation Plan

### Phase 1: Tipping (Week 1-2)

| Step | File | Action |
|------|------|--------|
| 1 | `src/lib/web3/tip.ts` | Create tip utility: ETH and ERC-20 transfer helpers |
| 2 | `src/hooks/useTip.ts` | Hook wrapping `useSendTransaction` + `useWriteContract` with preset amounts |
| 3 | `src/components/spaces/TipButton.tsx` | Tip button component: amount picker, recipient display, confirmation |
| 4 | `src/components/spaces/TipOverlay.tsx` | Floating animation overlay for incoming tips |
| 5 | `src/components/spaces/TipLeaderboard.tsx` | Tip totals per room, sorted by amount |
| 6 | `src/app/api/tips/record/route.ts` | Record tip tx hash + metadata in Supabase for history |
| 7 | `supabase/migrations/xxx_tips.sql` | `tips` table: `id, room_id, from_fid, to_fid, tx_hash, amount, token, chain, created_at` |
| 8 | `src/components/spaces/RoomView.tsx` | Integrate TipButton into room controls |

### Phase 2: Token-Gated Rooms (Week 2-3)

| Step | File | Action |
|------|------|--------|
| 1 | `src/lib/gates/tokenGate.ts` | Server-side balance check: `readContract` for ERC-20/721/1155 |
| 2 | `src/lib/gates/constants.ts` | Gate presets (ZOUNZ, Respect, $DEGEN, custom) |
| 3 | `src/components/spaces/GateConfig.tsx` | UI for room creator to set gate rules |
| 4 | `src/components/spaces/HostRoomModal.tsx` | Add gate configuration to room creation flow |
| 5 | `src/app/api/spaces/join/route.ts` | Gate check before allowing room join |
| 6 | `src/components/spaces/GateBadge.tsx` | Badge on room cards showing gate type |
| 7 | `supabase/migrations/xxx_room_gates.sql` | Add `gate_config JSONB` to `spaces_sessions` |

### Phase 3: NFT Tickets (Week 3-5)

| Step | File | Action |
|------|------|--------|
| 1 | `src/lib/tickets/unlock.ts` | Unlock Protocol integration: deploy lock, check key ownership |
| 2 | `src/components/spaces/TicketConfig.tsx` | UI for setting ticket price, capacity, transferability |
| 3 | `src/components/spaces/ScheduleRoomModal.tsx` | Add ticket toggle to scheduled room creation |
| 4 | `src/components/spaces/TicketMint.tsx` | Mint/purchase ticket component with wallet or fiat |
| 5 | `src/app/api/tickets/verify/route.ts` | Verify ticket ownership on room join |
| 6 | `src/components/spaces/TicketBadge.tsx` | Show ticket count, sold/remaining on room cards |
| 7 | `supabase/migrations/xxx_tickets.sql` | `ticket_events` table: `id, room_id, lock_address, chain, price, capacity, created_at` |

### Phase 4: Polish (Week 5-6)

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/spaces/TipHistory.tsx` | User's tip history page |
| 2 | `src/components/spaces/CoinbaseOnramp.tsx` | Fiat on-ramp for non-crypto users |
| 3 | `src/components/spaces/AttendancePOAP.tsx` | Post-event attendance NFT/badge |
| 4 | `community.config.ts` | Add tip/gate/ticket defaults to community config |

---

## Part 7: Database Schema

### Tips Table

```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  from_fid BIGINT NOT NULL,
  from_wallet TEXT NOT NULL,
  to_fid BIGINT NOT NULL,
  to_wallet TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL,          -- stored as string to preserve precision
  token TEXT NOT NULL DEFAULT 'ETH',  -- 'ETH', 'USDC', 'DEGEN', 'RESPECT'
  chain TEXT NOT NULL DEFAULT 'base',
  usd_value NUMERIC(10,2),      -- approximate USD value at time of tip
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboards
CREATE INDEX idx_tips_room ON tips(room_id, created_at DESC);
CREATE INDEX idx_tips_to ON tips(to_fid, created_at DESC);

-- RLS: anyone can read tips, only server can insert
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY tips_read ON tips FOR SELECT USING (true);
```

### Room Gates (extend existing table)

```sql
ALTER TABLE spaces_sessions ADD COLUMN IF NOT EXISTS gate_config JSONB DEFAULT NULL;
-- gate_config: { type, chain, contract, minBalance, label }
```

### Ticket Events

```sql
CREATE TABLE ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  lock_address TEXT,             -- Unlock Protocol lock contract
  chain TEXT NOT NULL DEFAULT 'base',
  price TEXT NOT NULL DEFAULT '0',
  currency TEXT NOT NULL DEFAULT 'ETH',
  capacity INT NOT NULL DEFAULT 50,
  tickets_sold INT NOT NULL DEFAULT 0,
  is_transferable BOOLEAN DEFAULT false,
  is_burnable BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_events_room ON ticket_events(room_id);
```

---

## Part 8: Security Considerations

| Risk | Mitigation |
|------|-----------|
| **Tip to wrong address** | Confirm recipient identity (show Farcaster name + PFP) before sending |
| **Gas estimation failure** | Use `useSimulateContract` before `useWriteContract`; show estimated gas |
| **Token gate spoofing** | Gate checks MUST be server-side (`readContract` in API route), never client-only |
| **Flash loan attacks on gating** | Cache balance checks for 60s; for high-value rooms, require balance at block N-10 |
| **NFT ticket scalping** | Use soulbound (non-transferable) tickets or Unlock Protocol transfer restrictions |
| **Re-entry with burned ticket** | Store burn tx hash in Supabase; check both on-chain balance AND burn record |
| **Private key exposure** | All writes use user's connected wallet (wagmi); ZAO OS never holds user keys |
| **Fiat on-ramp fraud** | Coinbase Onramp handles KYC/AML; tips only processed after on-chain confirmation |

---

## Part 9: Sources

### Wagmi / Viem
- [Wagmi Send Transaction Guide](https://wagmi.sh/react/guides/send-transaction)
- [useSendTransaction Hook](https://wagmi.sh/react/api/hooks/useSendTransaction)
- [useWriteContract Hook](https://wagmi.sh/react/api/hooks/useWriteContract)
- [Wagmi Write to Contract Guide](https://wagmi.sh/react/guides/write-to-contract)
- [Viem readContract](https://viem.sh/docs/contract/readContract.html)

### Token Gating
- [thirdweb NFT Gated Website Guide](https://blog.thirdweb.com/guides/nft-gated-website/)
- [thirdweb NFT Gated Website Example (GitHub)](https://github.com/thirdweb-example/nft-gated-website)
- [tokengate npm module (GitHub)](https://github.com/marcusmolchany/tokengate)
- [Token Gated Access — Formo](https://formo.so/blog/token-gated-access-the-hidden-key-to-building-exclusive-web3-communities)
- [Token Gating Guide — LKI Consulting](https://lkiconsulting.io/marketing/token-gating-in-crypto-and-web3/)

### NFT Ticketing
- [Unlock Protocol — How to Sell NFT Tickets](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/)
- [Unlock Protocol Home](https://unlock-protocol.com/)
- [NFT Tickets in 2026 — ndlabs](https://ndlabs.dev/nft-tickets)
- [NFT Ticketing Platforms 2026 — glavx](https://glavx.org/nft-ticketing-platforms-and-solutions-for-events-in)
- [Tokenized Tickets — Chainlink](https://chain.link/article/tokenized-tickets-event-access)
- [thirdweb PublicLock (Unlock) Contract](https://thirdweb.com/unlock-protocol.eth/PublicLock)
- [OpenZeppelin ERC-721 Burnable](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721)

### Tipping / Monetization
- [DEGEN Tipping on Farcaster — Matcha](https://blog.matcha.xyz/article/degen-token-on-farcaster)
- [DEGEN Official](https://www.degen.tips/)
- [Sound.xyz — Onchain Music 101](https://splits.org/blog/onchain-music-101/)
- [Zora Ecosystem Guide — Zerion](https://zerion.io/blog/guide-to-the-zora-ecosystem/)
- [Web3 Streaming Platforms — TokenMinds](https://tokenminds.co/blog/web3-marketing/web3-streaming-platforms)

### Fiat On-Ramp
- [Coinbase Onramp](https://www.coinbase.com/developer-platform/products/onramp)
- [Coinbase Onramp API Docs](https://docs.cdp.coinbase.com/onramp/docs/api-overview)
- [Coinbase Payments MCP](https://thepaypers.com/crypto-web3-and-cbdc/news/coinbase-rolls-out-payments-mcp)

### Music NFT Platforms
- [Sound.xyz Collecting Model](https://splits.org/blog/onchain-music-101/)
- [Invest in Music — Mint Free](https://investinmusic.mirror.xyz/SkPvYbMCCFPSYSDG0ysq3sanDBZD6_njNFgRniTM7zY)
- [Web3 Payments Interface Tutorial](https://dev.to/ephcrat/build-a-web3-payments-interface-with-react-ethersjs-rainbowkit-chakra-ui-3khi)
