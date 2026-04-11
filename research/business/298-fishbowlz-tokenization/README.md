# 298 - FISHBOWLZ Tokenization: Token Design, Fee Splits, and ZABAL Auto-Buyback

> **Status:** Research complete
> **Date:** 2026-04-07
> **Goal:** Design the complete FISHBOWLZ token economy - token deployment on Base, room creation fees, fee split model, ZABAL auto-buyback mechanism, and token-gated feature tiers
> **Updates:** Doc 255 (FISHBOWLZ spec), Doc 258 (ZABAL/SANG buyback), Doc 283 (Privy embedded wallets + token mechanics), Doc 222 (payment infrastructure)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Token standard** | ERC-20 on Base (chainId 8453). Deploy via Clanker SDK v4 for automatic Uniswap V4 pool creation. Fixed supply of 100,000,000,000 (100B) $FISHBOWLZ tokens, 18 decimals |
| **Room creation fee** | 10,000 $FISHBOWLZ per room (flat fee). Burned on creation - not sent to treasury. At launch price (~$0.00001/token), this equals ~$0.10 per room. As token price rises, reduce the fee amount via governance vote |
| **Fee split on tips** | 70% to speaker / 20% to ZABAL auto-buyback / 10% to FISHBOWLZ protocol treasury. Implemented via on-chain PaymentSplitter contract on Base |
| **ZABAL auto-buyback** | Accumulate ETH/USDC from the 20% fee share in a treasury contract. WALLET agent executes weekly swaps via Aerodrome on Base (deepest ZABAL liquidity). Target: $5-10/week initially given ZABAL's $552 liquidity |
| **Buyback execution** | Use Aerodrome Router on Base (not Uniswap V3/V4 - Aerodrome has deeper Base-native liquidity). WALLET agent (server-side Privy wallet) calls swap with 2% max slippage. Bought ZABAL sent to ZAO treasury multisig |
| **Token-gated tiers** | Three tiers: Free (0 tokens, 1 room, 5 listeners), Basic (1,000 $FISHBOWLZ, 3 rooms, 25 listeners), Premium (100,000 $FISHBOWLZ, unlimited rooms, 100 listeners, agent participants, recording) |
| **Token distribution** | 40% Uniswap V4 liquidity (via Clanker), 20% ZAO treasury, 15% community rewards (speaker tips pool), 10% team vesting (12-month linear), 10% airdrop to existing ZAO members, 5% ecosystem partnerships |
| **DEX for swaps** | Aerodrome Finance - the dominant DEX on Base with deepest liquidity. Use Aerodrome Router for all protocol swaps (buyback + in-app buy). Uniswap V4 pool from Clanker serves as the primary market |
| **Gas sponsorship** | Use Coinbase Base Paymaster (free) for all user token transactions. Users never pay gas on Base. Enabled via Privy embedded wallet + paymaster integration (Doc 283) |
| **Launch timing** | Deploy $FISHBOWLZ via Clanker immediately. Wire fee split contract within 1 week. Enable ZABAL buyback within 2 weeks. Token-gated tiers within 3 weeks |

---

## Comparison of Tokenization Models

### Model 1: Bonding Curve (friend.tech Style)

**How it works:** Each room gets its own bonding curve. Price increases quadratically as more people "buy into" a room. Selling your position returns ETH minus fees.

**friend.tech formula:** `price = supply^2 / 16000` ETH, where supply is total keys outstanding.

**Fee structure:** 10% total on every buy/sell (5% to protocol, 5% to room creator).

| Metric | Value |
|--------|-------|
| Revenue at 100 rooms, 50 avg buyers | ~$12,500 in fees (at friend.tech-scale pricing) |
| Complexity | HIGH - need bonding curve contract per room or factory pattern |
| User friction | HIGH - buying/selling feels speculative, not social |
| Speculation risk | HIGH - rooms become pump-and-dump vehicles |

**Verdict: REJECT.** friend.tech generated $52M in fees but collapsed because rooms became speculative assets, not social spaces. Users bought keys for profit, not to participate. friend.tech's user retention dropped 97% within 6 months of launch. FISHBOWLZ rooms should be valued for conversation quality, not speculation.

### Model 2: Flat Fee + Burn (Recommended)

**How it works:** Creating a room costs a fixed amount of $FISHBOWLZ tokens. Tokens are burned (permanently removed from supply). Tipping speakers costs ETH/USDC with a percentage fee split.

| Metric | Value |
|--------|-------|
| Room creation fee | 10,000 $FISHBOWLZ (burned) |
| Tip fee split | 70% speaker / 20% ZABAL buyback / 10% treasury |
| Revenue at 100 rooms/month + $500 tips/month | $50/month protocol revenue + 100K tokens burned |
| Complexity | LOW - one ERC-20 + one splitter contract |
| User friction | LOW - buy tokens once, create rooms, tip speakers |
| Speculation risk | LOW - token has utility (room creation) not just speculation |

**Verdict: ADOPT.** Flat fee + burn creates deflationary pressure proportional to platform usage. More rooms created = more tokens burned = higher scarcity. The tip fee split funds the ZABAL buyback automatically. This is the DEGEN model (community utility token) not the friend.tech model (speculative asset).

### Model 3: Subscription / Time-Based

**How it works:** Rooms stay open as long as the creator pays a recurring fee (daily/weekly). Fee paid in $FISHBOWLZ or ETH. Room closes when funding runs out.

| Metric | Value |
|--------|-------|
| Room maintenance fee | 1,000 $FISHBOWLZ/day or 0.001 ETH/day |
| Revenue at 50 active rooms | $1.50/day = $45/month in protocol fees |
| Complexity | MEDIUM - need timer/escrow contract or cron job |
| User friction | MEDIUM - must remember to fund room |
| Speculation risk | LOW |

**Verdict: DEFER to v2.** Good model for "rooms stay open as long as they're funded" but adds complexity. For v1, rooms persist for free (FISHBOWLZ's core differentiator is persistence). Add room funding as a premium feature in v2 when there's demand for always-on rooms with guaranteed uptime.

### Model 4: Unlonely-Style Creator Tokens (Per-Room Tokens)

**How it works:** Each room can issue its own sub-token. Room token holders get perks (explosive chat, badges, voting on topics). Creator sets price.

| Metric | Value |
|--------|-------|
| Revenue | Varies per creator |
| Complexity | VERY HIGH - token factory + per-room economy |
| User friction | HIGH - too many tokens |
| Speculation risk | HIGH - fragmented liquidity |

**Verdict: REJECT for v1.** Token fragmentation kills liquidity. One token ($FISHBOWLZ) is simpler for users. Per-room NFTs (not tokens) could work in v2 as collectible access passes.

### Comparison Summary

| Model | Complexity | User Friction | Revenue | Speculation Risk | Verdict |
|-------|-----------|---------------|---------|-----------------|---------|
| Bonding curve (friend.tech) | High | High | High (short-term) | Very High | REJECT |
| **Flat fee + burn** | **Low** | **Low** | **Medium (sustainable)** | **Low** | **ADOPT** |
| Subscription/time | Medium | Medium | Medium | Low | DEFER v2 |
| Per-room tokens (Unlonely) | Very High | High | Varies | High | REJECT |

---

## FISHBOWLZ Token Design

### Token Parameters

| Parameter | Value |
|-----------|-------|
| Name | FISHBOWLZ |
| Symbol | FISHBOWLZ |
| Chain | Base (chainId 8453) |
| Standard | ERC-20 |
| Total Supply | 100,000,000,000 (100B) |
| Decimals | 18 |
| Deployment | Clanker SDK v4 (auto Uniswap V4 pool) |
| Initial Liquidity | 0.1 ETH devBuy via Clanker |

### Token Distribution

| Allocation | Amount | % | Lockup |
|------------|--------|---|--------|
| Uniswap V4 liquidity (via Clanker) | 40,000,000,000 | 40% | Permanent (LP locked) |
| ZAO treasury | 20,000,000,000 | 20% | Multisig controlled |
| Community rewards pool | 15,000,000,000 | 15% | Distributed over 24 months |
| Team | 10,000,000,000 | 10% | 12-month linear vesting |
| Airdrop to ZAO members | 10,000,000,000 | 10% | Snapshot of 188 ZAO holders |
| Ecosystem partnerships | 5,000,000,000 | 5% | Case-by-case |

### Room Creation: Flat Fee + Burn

When a user creates a FISHBOWLZ room:

1. User holds $FISHBOWLZ in their Privy embedded wallet
2. Frontend calls `approve()` on $FISHBOWLZ contract for the RoomFactory contract
3. `RoomFactory.createRoom()` transfers 10,000 $FISHBOWLZ from user and calls `burn()`
4. Room is created in Supabase + 100ms
5. Token supply permanently decreases by 10,000

**Burn math at scale:**
- 100 rooms/month = 1,000,000 tokens burned/month = 0.001% of supply
- 1,000 rooms/month = 10,000,000 tokens burned/month = 0.01% of supply
- 10,000 rooms/month = 100,000,000 tokens burned/month = 0.1% of supply

The burn rate scales with platform adoption. At 10,000 rooms/month, 1.2% of total supply is burned annually.

### Tip Fee Split: 70/20/10

When a user tips a speaker in a FISHBOWLZ room:

```
User sends 0.01 ETH tip
  -> PaymentSplitter contract receives 0.01 ETH
  -> 0.007 ETH (70%) sent to speaker wallet
  -> 0.002 ETH (20%) sent to ZABAL buyback accumulator
  -> 0.001 ETH (10%) sent to FISHBOWLZ protocol treasury
```

**Why 70/20/10:**
- 70% to speaker: competitive with Twitch (50%), YouTube (70%), and friend.tech (50%). Speakers must feel well-compensated to stay on the platform.
- 20% to ZABAL buyback: the core flywheel - FISHBOWLZ usage directly increases ZABAL demand. This is the "embedded capital" mechanism.
- 10% to protocol: covers infrastructure costs (100ms audio, Supabase, Vercel). At $500/month in tips, protocol earns $50/month.

### ZABAL Auto-Buyback Mechanism

The 20% fee share accumulates in a buyback contract. The WALLET agent (Privy server wallet) executes periodic swaps.

**Architecture:**

```
Tip fees (20% share)
  -> BuybackAccumulator contract (Base)
  -> Accumulates ETH until threshold (0.01 ETH minimum)
  -> WALLET agent calls accumulator.release()
  -> ETH sent to WALLET agent EOA
  -> WALLET calls Aerodrome Router:
     swapExactETHForTokens(
       amountOutMin: calculatedWithSlippage,
       routes: [{ from: WETH, to: ZABAL, stable: false }],
       to: ZAO_TREASURY_MULTISIG,
       deadline: block.timestamp + 300
     )
  -> ZABAL arrives in ZAO treasury multisig
  -> Event emitted: BuybackExecuted(ethSpent, zabalReceived, timestamp)
```

**Why Aerodrome over Uniswap:**
- Aerodrome is the dominant DEX on Base with $1B+ TVL
- ZABAL's Uniswap V4 pair has only $552 liquidity (Doc 258)
- Aerodrome's ve(3,3) model incentivizes deeper liquidity for Base tokens
- If ZABAL migrates to Aerodrome pool, buyback becomes more efficient
- Aerodrome Router is simpler to integrate than Uniswap V4 Universal Router

**Buyback frequency and sizing (from Doc 258):**

| Weekly Tip Volume | Buyback Amount (20%) | ZABAL Bought (at $0.0000001429) | % of ZABAL MCap |
|-------------------|---------------------|---------------------------------|-----------------|
| $25/week | $5/week | 34,989,503 ZABAL | 0.24% |
| $50/week | $10/week | 69,979,006 ZABAL | 0.49% |
| $250/week | $50/week | 349,895,031 ZABAL | 2.45% |
| $500/week | $100/week | 699,790,063 ZABAL | 4.90% |

**Risk mitigation:**
- Set 2% max slippage on all swaps
- If slippage exceeds 2%, skip that week and accumulate for next cycle
- ZABAL liquidity is thin ($552) - never swap more than 5% of pool liquidity in one transaction
- Log every buyback to Supabase `buyback_events` table for transparency

### Token-Gated Feature Tiers

| Tier | $FISHBOWLZ Required | Rooms | Max Listeners | Features |
|------|---------------------|-------|---------------|----------|
| **Free** | 0 | 1 active room | 5 | Basic audio, text chat |
| **Basic** | 1,000 (hold) | 3 active rooms | 25 | + Recording, + room themes, + emoji reactions |
| **Premium** | 100,000 (hold) | Unlimited | 100 | + Agent participants, + transcription, + broadcast to X/YouTube, + priority hot seat |

**Implementation:** Use existing `checkTokenGate()` in `src/lib/fishbowlz/tokenGate.ts`. The function already reads ERC-20 balances on Base. Plug $FISHBOWLZ contract address and check balance thresholds at room creation time.

**At current estimated launch price (~$0.00001/token):**
- Free: $0
- Basic: $0.01 (essentially free - encourages adoption)
- Premium: $1.00 (accessible entry point)

As token price increases, tier thresholds can be reduced via governance.

---

## Smart Contracts Required

### 1. $FISHBOWLZ Token (Clanker Deployment)

No custom contract needed. Clanker SDK v4 deploys a standard ERC-20 with `burn()` function and creates a Uniswap V4 pool in a single transaction.

```typescript
// scripts/launch-fishbowlz-token.ts (already scaffolded in Doc 283)
const { txHash, waitForTransaction } = await clanker.deploy({
  name: 'FISHBOWLZ',
  symbol: 'FISHBOWLZ',
  tokenAdmin: DEPLOYER_ADDRESS,
  devBuy: { eth: '0.1' }, // seed initial liquidity
});
```

### 2. RoomFactory (Burn on Create)

```solidity
// contracts/RoomFactory.sol
contract RoomFactory {
    IERC20 public fishbowlzToken;
    uint256 public roomCreationFee = 10_000 * 1e18; // 10,000 FISHBOWLZ
    address public admin;

    event RoomCreated(address indexed creator, string roomId, uint256 feeBurned);

    function createRoom(string calldata roomId) external {
        fishbowlzToken.transferFrom(msg.sender, address(this), roomCreationFee);
        // Burn the tokens (Clanker ERC-20 supports burn)
        IERC20Burnable(address(fishbowlzToken)).burn(roomCreationFee);
        emit RoomCreated(msg.sender, roomId, roomCreationFee);
    }

    function setFee(uint256 newFee) external {
        require(msg.sender == admin, "Not admin");
        roomCreationFee = newFee;
    }
}
```

### 3. TipSplitter (70/20/10)

```solidity
// contracts/TipSplitter.sol
contract TipSplitter {
    address public zabalBuybackAccumulator;
    address public protocolTreasury;

    event TipSplit(address indexed speaker, uint256 speakerAmount, uint256 buybackAmount, uint256 treasuryAmount);

    function tipSpeaker(address speaker) external payable {
        uint256 total = msg.value;
        uint256 speakerShare = (total * 70) / 100;
        uint256 buybackShare = (total * 20) / 100;
        uint256 treasuryShare = total - speakerShare - buybackShare;

        payable(speaker).transfer(speakerShare);
        payable(zabalBuybackAccumulator).transfer(buybackShare);
        payable(protocolTreasury).transfer(treasuryShare);

        emit TipSplit(speaker, speakerShare, buybackShare, treasuryShare);
    }
}
```

### 4. BuybackAccumulator

```solidity
// contracts/BuybackAccumulator.sol
contract BuybackAccumulator {
    address public walletAgent; // Privy server wallet
    uint256 public minReleaseThreshold = 0.01 ether;

    event BuybackReleased(address indexed agent, uint256 amount);

    receive() external payable {} // Accept ETH from TipSplitter

    function release() external {
        require(msg.sender == walletAgent, "Not authorized");
        require(address(this).balance >= minReleaseThreshold, "Below threshold");
        uint256 amount = address(this).balance;
        payable(walletAgent).transfer(amount);
        emit BuybackReleased(walletAgent, amount);
    }
}
```

---

## ZAO OS Integration

### Existing Files (No Changes Needed)

| File | What It Does | How FISHBOWLZ Token Uses It |
|------|-------------|----------------------------|
| `src/lib/fishbowlz/tokenGate.ts` | Checks ERC-20 balance on Base via viem `readContract` | Plug $FISHBOWLZ contract address for tier checks (1,000 / 100,000 thresholds) |
| `src/app/api/fishbowlz/gate-check/route.ts` | API endpoint calling `checkTokenGate()` | Returns `{ allowed, balance, required }` for room creation |
| `src/components/spaces/TokenGateSection.tsx` | UI for configuring token gate on room creation | Already supports ERC-20 + Base chain selection |
| `src/lib/wagmi/config.ts` | Wagmi config with Base chain | Already configured for Base (chainId 8453) |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/fishbowlz/TipButton.tsx` | Replace direct ETH send with TipSplitter contract call. Change `sendTip()` to call `TipSplitter.tipSpeaker(speakerAddress)` with ETH value. Remove the current event-logging-only approach |
| `src/app/api/fishbowlz/rooms/route.ts` | Add on-chain room creation fee check. Before creating room in Supabase/100ms, verify `RoomFactory.createRoom()` transaction succeeded. Accept `txHash` in request body, verify on-chain |
| `community.config.ts` | Add `fishbowlz.tokenAddress`, `fishbowlz.tipSplitterAddress`, `fishbowlz.roomFactoryAddress`, `fishbowlz.buybackAccumulatorAddress` to the config object |
| `src/app/fishbowlz/page.tsx` | Add tier badge display based on user's $FISHBOWLZ balance. Show "Free / Basic / Premium" next to username |
| `src/app/fishbowlz/[id]/page.tsx` | Add TipButton with on-chain splitting. Show room creation fee if user is creating |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/fishbowlz/contracts.ts` | Contract addresses + ABIs for RoomFactory, TipSplitter, BuybackAccumulator, $FISHBOWLZ token |
| `src/lib/fishbowlz/tiers.ts` | Tier definitions: balance thresholds, feature flags per tier, `getUserTier(balance)` helper |
| `src/components/fishbowlz/BuyTokenButton.tsx` | In-app $FISHBOWLZ purchase via Aerodrome/Uniswap swap (scaffolded in Doc 283) |
| `src/components/fishbowlz/TokenBalance.tsx` | Display user's $FISHBOWLZ balance + current tier |
| `src/components/fishbowlz/BuybackDashboard.tsx` | Public dashboard showing cumulative ZABAL bought back, total tips, burn stats |
| `src/app/api/fishbowlz/buyback/route.ts` | Endpoint for WALLET agent to trigger buyback. Validates agent auth, calls accumulator.release(), executes Aerodrome swap |
| `src/app/api/fishbowlz/burn-stats/route.ts` | Read on-chain burn events from RoomFactory, return total burned + burn rate |
| `contracts/RoomFactory.sol` | Room creation with token burn |
| `contracts/TipSplitter.sol` | 70/20/10 fee split |
| `contracts/BuybackAccumulator.sol` | ETH accumulator for ZABAL buyback |
| `scripts/deploy-fishbowlz-contracts.ts` | Deploy all 3 contracts to Base using Foundry or Hardhat |

### Database Changes

```sql
-- New table: track all on-chain buyback events
CREATE TABLE fishbowlz_buybacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  eth_spent NUMERIC NOT NULL,
  zabal_received NUMERIC NOT NULL,
  zabal_price_at_swap NUMERIC,
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table: track room creation burns
CREATE TABLE fishbowlz_burns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL,
  creator_fid BIGINT NOT NULL,
  tokens_burned NUMERIC NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add token tier to rooms table
ALTER TABLE fishbowlz_rooms ADD COLUMN required_tier TEXT DEFAULT 'free'
  CHECK (required_tier IN ('free', 'basic', 'premium'));

CREATE INDEX idx_buybacks_date ON fishbowlz_buybacks(executed_at DESC);
CREATE INDEX idx_burns_creator ON fishbowlz_burns(creator_fid);
```

---

## The Flywheel

```
More FISHBOWLZ users
  -> More room creation (tokens burned -> deflation)
  -> More tipping (ETH flows through TipSplitter)
  -> 20% of tips -> ZABAL buyback
  -> ZABAL price increases
  -> ZAO treasury grows
  -> ZAO funds more FISHBOWLZ development
  -> Better product -> More users
```

This is the "embedded capital" model from the Farcaster Agentic Bootcamp (Apr 7 session). FISHBOWLZ doesn't just generate revenue - it generates demand for ZABAL. Every tip on FISHBOWLZ is a ZABAL buy order.

---

## Revenue Projections

### Conservative (Month 1-3)

| Metric | Value |
|--------|-------|
| Active rooms | 20/month |
| Tips volume | $100/month |
| Room burns | 200,000 $FISHBOWLZ/month |
| ZABAL buyback | $20/month ($5/week) |
| Protocol treasury | $10/month |

### Growth (Month 6)

| Metric | Value |
|--------|-------|
| Active rooms | 200/month |
| Tips volume | $2,000/month |
| Room burns | 2,000,000 $FISHBOWLZ/month |
| ZABAL buyback | $400/month ($100/week) |
| Protocol treasury | $200/month |

### Scale (Month 12)

| Metric | Value |
|--------|-------|
| Active rooms | 1,000/month |
| Tips volume | $10,000/month |
| Room burns | 10,000,000 $FISHBOWLZ/month |
| ZABAL buyback | $2,000/month ($500/week) |
| Protocol treasury | $1,000/month |

At month-12 scale, FISHBOWLZ has burned 0.1% of total supply and bought back $24,000 worth of ZABAL annually.

---

## Implementation Priority

| Phase | Work | Effort | Timeline |
|-------|------|--------|----------|
| **Phase 0: Token Launch** | Deploy $FISHBOWLZ via Clanker SDK. Announce on Farcaster. Airdrop to 188 ZAO members | 2 hrs | Day 1 |
| **Phase 1: Tip Splitting** | Deploy TipSplitter contract. Update `TipButton.tsx` to use contract. Wire fee split | 8 hrs | Week 1 |
| **Phase 2: Room Creation Fee** | Deploy RoomFactory contract. Update room creation flow. Add burn verification | 6 hrs | Week 1-2 |
| **Phase 3: Token Gating** | Add tier logic to `tokenGate.ts`. Show tier badges. Gate features per tier | 4 hrs | Week 2 |
| **Phase 4: ZABAL Buyback** | Deploy BuybackAccumulator. Wire WALLET agent swap logic via Aerodrome. Add buyback dashboard | 10 hrs | Week 2-3 |
| **Phase 5: Buy Button** | In-app $FISHBOWLZ purchase via Aerodrome swap. BuyTokenButton component | 4 hrs | Week 3 |
| **Total** | | **34 hrs** | **3 weeks** |

---

## Comparison with DEGEN Token Model

DEGEN is the closest successful precedent on Farcaster/Base:

| Feature | DEGEN | $FISHBOWLZ (Proposed) |
|---------|-------|----------------------|
| Chain | Base | Base |
| Launch | Clanker-style (community airdrop) | Clanker SDK v4 |
| Supply | 36.97B | 100B |
| Primary use | Tipping casts on Farcaster | Tipping speakers + room creation |
| Fee model | 10% lottery fee on tips (introduced Aug 2025) | 30% fee split (20% ZABAL buyback + 10% treasury) |
| Burn mechanism | None (inflationary via allowances) | Room creation burn (deflationary) |
| Staking | 10,000 DEGEN minimum for tip allowance | 1,000 / 100,000 for feature tiers |
| Buyback | None | 20% of all tips -> ZABAL buyback |
| FDV at launch | ~$0 (airdrop) | ~$10K-50K (Clanker devBuy) |

**Key difference:** DEGEN is inflationary (new allowances issued daily). $FISHBOWLZ is deflationary (room creation burns tokens). DEGEN has no parent-token buyback. $FISHBOWLZ feeds 20% of all protocol revenue into ZABAL.

---

## Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| Low initial liquidity for $FISHBOWLZ | High | Seed 0.1 ETH via Clanker devBuy. ZAO treasury provides additional liquidity on Aerodrome |
| ZABAL buyback moves price too much (thin liquidity) | Medium | Cap single buyback at 5% of ZABAL pool liquidity. Accumulate and execute weekly, not per-tip |
| Room creation fee too high as token appreciates | Medium | Admin function `setFee()` on RoomFactory. Governance vote to reduce fee |
| Smart contract bugs in TipSplitter | High | Use OpenZeppelin `PaymentSplitter` as base. Audit before mainnet. Start with small tip amounts |
| Regulatory classification as security | Medium | $FISHBOWLZ has clear utility (room creation, tipping). No promise of profit. Distributed via Clanker (no ICO). Burns reduce supply based on usage, not team action |
| Users don't buy $FISHBOWLZ to create rooms | Medium | Keep Free tier functional. Room creation fee is the premium feature, not the entry point |

---

## Sources

- [friend.tech Deep Dive - Bonding Curve Model](https://medium.com/coinmonks/a-deep-dive-into-friend-tech-5fb40bd6b034) - quadratic bonding curve formula, 10% fee structure (5% protocol + 5% creator)
- [friend.tech Fee Sustainability Analysis](https://www.theblock.co/post/252072/friend-tech-users-have-earned-12-million-in-fees-but-is-it-sustainable) - $12M fees generated, retention concerns
- [Uniswap UNIfication: Protocol Fee Buyback-and-Burn](https://blog.uniswap.org/unification) - fee switch activation, $596M UNI burn via token jar + fire pit mechanism
- [Uniswap Fee Switch Explained](https://web.ourcryptotalk.com/blog/uniswap-fee-switch-change-explained) - 1/4 to 1/6 of fees routed to buyback
- [Buyback and Burn Mechanism Explained](https://tokenomics-learning.com/en/buyback-and-burn-2/) - BNB Auto-Burn quarterly model, supply reduction mechanics
- [Aerodrome Finance - Base DEX](https://aerodrome.finance/) - dominant DEX on Base, ve(3,3) model, deepest Base-native liquidity
- [Aerodrome Guide - CoinGecko](https://www.coingecko.com/learn/what-is-aerodrome-finance-aero-base) - $1B+ TVL, fee distribution to veAERO lockers, Momentum Fund buyback
- [DEGEN Token - Community Currency of Farcaster](https://learn.bybit.com/en/memes/what-is-degen-token) - 10,000 DEGEN staking requirement, daily tip allowances, Degen Mini App
- [DEGEN Tip System and Lottery Fee](https://www.degen.tips/) - 10% lottery fee on tips (Aug 2025), Farcaster-native tipping
- [Uniswap V4 Hooks - Swap Fee Customization](https://docs.uniswap.org/contracts/v4/concepts/hooks) - dynamic fees, hook-allocated swap fees, custom accounting
- [Unlonely - Crypto Livestreaming with Channel Tokens](https://www.rootdata.com/Projects/detail/Unlonely?k=MTAzODA%3D) - per-creator tokens, channel arcade, NFC clips
- [Pump.fun Bonding Curve Mechanics 2026](https://flashift.app/blog/bonding-curves-pump-fun-meme-coin-launches/) - $69K bonding curve completion, 0.5 SOL creator reward
- [Clanker SDK v4 Docs](https://clanker.gitbook.io/clanker-documentation/sdk/v4.0.0) - ERC-20 + Uniswap V4 pool in single tx, 100B fixed supply, dynamic fees
- [Privy Embedded Wallets + Token Mechanics (Doc 283)](../283-privy-embedded-wallets-fishbowlz-token-mechanics/) - wagmi integration, fee split patterns, server wallet ops
- [ZABAL/SANG Buyback Research (Doc 258)](./258-zabal-sang-buyback/) - ZABAL on-chain data, $14K FDV, $552 liquidity, buyback math

---

## Related Docs

- [255 - FISHBOWLZ Spec](../../music/255-fishbowlz-spec/) - core product spec, MVP features, post-MVP roadmap
- [258 - ZABAL + SANG Buyback](../258-zabal-sang-buyback/) - ZABAL/SANG on-chain data, buyback math, WALLET agent flow
- [283 - Privy Embedded Wallets](../283-privy-embedded-wallets-fishbowlz-token-mechanics/) - wallet integration, token gate wiring, swap code, fee split patterns
- [282 - Privy Auth for FISHBOWLZ](../282-privy-auth-fishbowlz-integration/) - auth setup, embedded wallet creation on login
- [284 - Privy Full Feature Set](../284-privy-full-feature-set-fishbowlz/) - complete Privy capabilities for FISHBOWLZ
- [222 - Payment Infrastructure](../222-payment-infrastructure-stripe-coinbase/) - Stripe, Coinbase Commerce, 0xSplits for broader ZAO payments
- [290 - FISHBOWLZ Agentic Participants](../../agents/290-fishbowlz-agentic-participants/) - AI agents joining rooms as speakers/listeners
