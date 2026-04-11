# 349 -- ZABAL Staking: Simple Contracts + Farcaster Mini App Options

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Find the simplest open-source staking contract for ZABAL (100M minimum stake) that works on Base with a Farcaster Mini App frontend for mobile promoters

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Staking contract** | FORK `ClawdVictionStaking.sol` (doc 340) -- simplest conviction-style contract, already audited, MIT, 887K gas to deploy ($0.50 on Base). Change CLAWD address to ZABAL, minimum from 1,000 to 100,000,000 (100M). No reward token needed -- conviction IS the reward |
| **Why not thirdweb** | SKIP thirdweb Staking20Base -- requires a separate reward token (we don't want to mint a second token). ClawdViction is simpler: stake ZABAL, earn conviction (time-weighted score), no separate rewards token |
| **Why not ERC-4626** | SKIP ERC-4626 vaults for staking -- designed for yield-bearing deposits (Aave, Compound). We want conviction scoring, not yield. ERC-4626 adds unnecessary complexity |
| **Why not Ryfts/RYFT** | SKIP RYFT -- it's a hybrid NFT composability layer across 70+ chains, not a simple staking solution. Overkill for ZABAL's $14K FDV. Could revisit for NFT wrapping/composability later |
| **Mini App frontend** | USE Farcaster Mini App with wagmi + `@farcaster/miniapp-wagmi-connector`. Base is default chain. EIP-5792 batch txs for approve+stake in one confirmation. Mobile-first, works inside Farcaster client |
| **Mini App hosting** | HOST at zaoos.com/stake as a Mini App route. Add to `/.well-known/farcaster.json` manifest. Promoters open it directly in Farcaster |
| **Staking formula** | USE conviction = amount_staked * seconds_staked (same as ClawdViction). 100M ZABAL staked for 30 days = 259.2T conviction units. More tokens * more time = more weight in oracle rewards |
| **Minimum stake** | SET at 100,000,000 ZABAL (100M). At current price ($0.0000001429) that's $14.29 worth. Meaningful enough to prevent gaming, low enough for promoters to participate |

---

## Comparison: Staking Contract Options

| Contract | Complexity | Reward Model | Deploy Cost | Audited | Mini App Ready | ZAO Fit |
|----------|-----------|-------------|------------|---------|---------------|---------|
| **ClawdViction** (fork) | LOW -- 3 functions (stake/unstake/getConviction) | Conviction = amount * time. No reward token | $0.50 (887K gas) | YES (MIT, audited) | YES -- simple read/write | **BEST** -- exactly what we need |
| **thirdweb Staking20Base** | MEDIUM -- requires reward token + minter role | APY-based rewards in separate token | ~$1-2 | YES (thirdweb audited) | YES -- thirdweb SDK | NO -- don't want separate reward token |
| **ERC-4626 Vault** (Bankr stakr) | HIGH -- yield-bearing vault pattern | Deposit/withdraw shares model | ~$1-2 | YES (OZ standard) | YES | NO -- designed for DeFi yield, not conviction |
| **Custom simple contract** | LOW -- but unaudited | Custom (whatever we want) | $0.50 | NO | YES | RISKY -- ClawdViction already exists |
| **ParaState SimpleStaking** | LOW -- stake/unstake with time lock | Fixed lock period, no conviction | $0.50 | NO | YES | NO -- time lock is wrong model, we want flexible |
| **RYFT dRYFT** | HIGH -- hybrid NFT + cross-chain | Flux Crates, loyalty tiers | Unknown | Unknown | PARTIAL | NO -- overkill, 70+ chains, not what we need |

---

## ClawdViction Staking for ZABAL

### Contract Changes (3 edits)

```diff
// Original ClawdVictionStaking.sol
- IERC20 public clawd;
+ IERC20 public zabal;

// Constructor
- constructor(address _clawd) {
-     clawd = IERC20(_clawd);
+ constructor(address _zabal) {
+     zabal = IERC20(_zabal);

// Minimum stake
- require(amount >= 1000 * 1e18, "Minimum 1000 tokens");
+ require(amount >= 100_000_000 * 1e18, "Minimum 100M ZABAL");
```

### Key Functions

| Function | What It Does | Gas |
|----------|-------------|-----|
| `stake(uint256 amount)` | Deposit ZABAL. Creates stake entry with timestamp. Updates totals | ~65K |
| `unstake(uint256 stakeIndex)` | Withdraw ZABAL. Calculates earned conviction. Resets position | ~50K |
| `getClawdviction(address)` | O(1) live conviction: `accrued + totalStaked * now - weightedStakeSum` | View (free) |
| `getActiveStakes(address)` | Returns arrays of amounts + timestamps | View (free) |

### Conviction Math

```
conviction = amount_staked * seconds_staked

Examples at 100M ZABAL minimum:
- 100M staked for 1 day  = 8.64T conviction
- 100M staked for 7 days = 60.48T conviction
- 100M staked for 30 days = 259.2T conviction
- 1B staked for 30 days  = 2,592T conviction (10x more tokens = 10x more conviction)

The formula naturally rewards:
- More tokens staked (linear scaling)
- Longer staking duration (linear scaling)
- Both compound: 10x tokens * 10x time = 100x conviction
```

---

## Farcaster Mini App Staking UI

### Architecture

```
Farcaster Client (mobile)
  └── Opens Mini App at zaoos.com/stake
       │
       ├── wagmi config with @farcaster/miniapp-wagmi-connector
       ├── Base chain as default
       ├── Read: getClawdviction(address) for conviction display
       ├── Read: getActiveStakes(address) for position list
       ├── Write: approve ZABAL + stake (EIP-5792 batch = 1 confirmation)
       └── Write: unstake (single tx)
```

### wagmi Config for Mini App

```typescript
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';

export const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [farcasterMiniApp()],
});
```

### Staking Flow (Mobile UX)

```
1. Promoter opens zaoos.com/stake in Farcaster
2. Wallet auto-connects (Farcaster SDK, no wallet picker needed)
3. Shows: current conviction, active stakes, ZABAL balance
4. "Stake ZABAL" button:
   a. Input amount (min 100M, slider or preset buttons: 100M / 500M / 1B)
   b. EIP-5792 batches approve + stake into ONE confirmation
   c. User sees Farcaster wallet preview, taps confirm
   d. Stake active, conviction starts accruing
5. "Unstake" button per position:
   a. Shows conviction earned for this position
   b. Single tx, ZABAL returns to wallet
   c. Conviction from this position crystallizes (stays earned)
```

### EIP-5792 Batch Transaction (approve + stake in 1 click)

```typescript
import { useSendCalls } from 'wagmi';
import { encodeFunctionData, parseUnits } from 'viem';

function StakeButton({ amount }: { amount: bigint }) {
  const { sendCalls } = useSendCalls();

  return (
    <button onClick={() => sendCalls({
      calls: [
        {
          to: ZABAL_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [STAKING_CONTRACT, amount],
          }),
        },
        {
          to: STAKING_CONTRACT,
          data: encodeFunctionData({
            abi: stakingAbi,
            functionName: 'stake',
            args: [amount],
          }),
        },
      ],
    })}>
      Stake {formatUnits(amount, 18)} ZABAL
    </button>
  );
}
```

One tap. No "approve" then "stake" two-step flow. Farcaster wallet handles both in one confirmation.

---

## How Staking Connects to the Oracle (doc 347)

```
Promoter stakes 500M ZABAL
  → Conviction accrues: 500M * seconds
  → After 7 days: 302.4T conviction
  → Oracle reads getClawdviction(promoter)
  → Calculates trust_mult: sqrt(conviction / 1e15) capped at 2.0
  → Promoter's content rewards scaled by trust_mult
  → Active staker with 302T conviction gets ~1.74x on rewards
  → Unstaked promoter gets 0.33x (minimum trust)
```

**The staking IS the anti-gaming mechanism.** Bots won't lock up 100M ZABAL ($14.29) and wait days to earn conviction. Real promoters will because they believe in the ecosystem.

---

## ZAO Ecosystem Integration

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/stake/page.tsx` | Farcaster Mini App staking page |
| `src/app/stake/StakeClient.tsx` | Client component with wagmi hooks |
| `src/lib/staking/contract.ts` | Contract address + ABI + read helpers |
| `contracts/ZabalConviction.sol` | Forked ClawdViction (3 line changes) |
| Update `/.well-known/farcaster.json` | Add /stake route to Mini App manifest |

### Existing Files Referenced

| File | Connection |
|------|-----------|
| `src/lib/agents/types.ts` | Add ZABAL_STAKING_CONTRACT address |
| `src/lib/oracle/scoring.ts` (future) | Read conviction for reward multiplier |
| `src/components/respect/SongjamLeaderboard.tsx` | stakingMultiplier already displayed |
| `community.config.ts` | Add staking contract address |

---

## Deployment Checklist

| Step | Cost | Time |
|------|------|------|
| Fork ClawdViction, change 3 lines | $0 | 10 min |
| Deploy to Base mainnet | $0.50 | 5 min |
| Build Mini App page (`/stake`) | $0 | 1 day |
| Add to farcaster.json manifest | $0 | 5 min |
| Test on Farcaster mobile | $0 | 30 min |
| Fund staking contract (no funding needed -- users deposit) | $0 | -- |
| **Total** | **$0.50** | **~1 day** |

---

## Sources

- [ClawdViction Contract](https://github.com/clawdbotatg/clawdviction) -- MIT, audited, deployed on Base
- [thirdweb ERC20 Staking Guide](https://blog.thirdweb.com/guides/build-an-erc20-staking-smart-contract-web-application/)
- [Farcaster Mini App Wallet Guide](https://miniapps.farcaster.xyz/docs/guides/wallets)
- [Farcaster Miniapp Wagmi Connector](https://www.npmjs.com/package/@farcaster/miniapp-wagmi-connector)
- [EIP-5792 Batch Transactions](https://eips.ethereum.org/EIPS/eip-5792)
- [RYFT Token](https://entertheryft.com/ryft-token/)
- [ParaState Simple Staking](https://github.com/ParaState/simple-staking-smart-contract)
- [Doc 340 - ClawdViction Deep Dive](../../agents/340-clawd-patterns-deep-dive-4-systems/)
- [Doc 347 - ZAO Oracle](../347-zao-oracle-outcome-verification/)
- [Doc 348 - SongJam Points](../../community/348-songjam-points-system-deep-dive/)
