# 223 -- Smart Contract Development Guide for ZAO OS

> **Status:** Research complete
> **Date:** March 30, 2026
> **Goal:** Definitive guide for writing, testing, deploying, and verifying smart contracts for ZAO OS on Base and Optimism
> **GitHub Issue:** #27
> **Builds on:** Doc 78 (Nouns Builder), Doc 131 (On-Chain Governance), Doc 143 (0xSplits), Doc 155 (Music NFT E2E)

---

## Key Decisions / Recommendations

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Framework** | Foundry (primary) + Hardhat (scripting fallback) | Foundry compiles 2-5x faster, native Solidity tests, built-in fuzzing. Hardhat only for JS deploy scripts if needed. |
| **Solidity version** | 0.8.24+ with `--via-ir` optimization | Latest stable, required by OpenZeppelin 5.x, enables Yul IR pipeline for gas savings |
| **Contract library** | OpenZeppelin Contracts v5.0 | ERC-721, ERC-1155, Governor, AccessControl -- all audited and battle-tested |
| **Chain targets** | Base (chain ID 8453) + Optimism (chain ID 10) | ZOUNZ DAO already on Base; Respect/OREC already on Optimism. No new chains. |
| **Testing strategy** | Foundry fuzz tests + fork tests against live Base/Optimism state | Fork testing catches integration issues with deployed ZOUNZ/OREC contracts |
| **Verification** | `forge verify-contract` with Basescan/Optimistic Etherscan API keys | Automated in deploy scripts, not manual upload |
| **Monorepo layout** | `contracts/` directory at repo root alongside `src/` | Keeps contracts co-located with the Next.js app; ABI artifacts imported into `src/lib/` |

---

## Part 1: Framework Comparison

### Foundry vs Hardhat vs Remix

| Criteria | Foundry | Hardhat | Remix |
|----------|---------|---------|-------|
| **Language** | Solidity (tests + contracts) | JavaScript/TypeScript | Browser IDE |
| **Compile speed** | 2-5x faster than Hardhat | Baseline | N/A (browser) |
| **Test speed** | Native Solidity, 5x faster on large suites | Mocha + ethers.js | Manual only |
| **Fuzzing** | Built-in (`forge test --fuzz-runs 10000`) | Requires plugin (echidna) | None |
| **Fork testing** | `forge test --fork-url $RPC` (one flag) | Hardhat Network forking (config) | No fork support |
| **Deploy tooling** | `forge create` or `forge script` | `hardhat run` + ethers.js | Manual deploy button |
| **Verification** | `forge verify-contract` (CLI, one command) | `hardhat-verify` plugin | Built-in Etherscan link |
| **Gas reports** | `forge test --gas-report` (built-in) | `hardhat-gas-reporter` plugin | None |
| **Learning curve** | Moderate (must know Solidity well) | Low (JS developers feel at home) | Lowest (browser, no setup) |
| **CI integration** | Excellent (`foundryup` + `forge test`) | Good (`npx hardhat test`) | Poor (browser-only) |
| **Best for ZAO** | Primary: all contract dev + testing | Secondary: JS deploy scripts if complex | Prototyping only |

**Verdict:** Foundry for all contract development, testing, and deployment. Hardhat only if a specific plugin (like OpenZeppelin Upgrades) has no Foundry equivalent. Remix for quick one-off prototyping.

---

## Part 2: ZAO OS Existing Contract Landscape

ZAO OS already interacts with 8 deployed contracts across 3 chains. No custom contracts have been written yet -- all are third-party deployments read via viem.

### Contracts Currently Integrated

| Contract | Chain | Address | Interaction Type | File |
|----------|-------|---------|-----------------|------|
| ZOUNZ Token (ERC-721) | Base | `0xCB80Ef04...c883` | Read (tokenURI, totalSupply, ownerOf) | `src/lib/zounz/contracts.ts` |
| ZOUNZ Auction | Base | `0xb2d430...4bfb` | Read + Write (auction state, createBid) | `src/components/zounz/ZounzAuction.tsx` |
| ZOUNZ Governor | Base | `0x9d98ec...17f` | Read + Write (proposals, castVote) | `src/components/zounz/ZounzCreateProposal.tsx` |
| ZOUNZ Treasury | Base | `0x2bb5fd...13f` | Read only (balance) | `src/lib/zounz/contracts.ts` |
| OREC (Governance) | Optimism | `0xcB05F9...532` | Read (proposals, respectOf, voteWeight) | `src/lib/ordao/client.ts` |
| ZOR Respect1155 | Optimism | `0x9885CC...45c` | Read (balanceOf) | `src/lib/ordao/client.ts` |
| Hats Protocol | Optimism | `0x3bc1A0...137` | Write (mintHat) | `src/components/hats/HatManager.tsx` |
| ENS NameWrapper | Mainnet | `0xD4416b...401` | Write (setSubnodeRecord) | `src/lib/ens/subnames.ts` |

### Current Integration Pattern

All contract reads use viem `createPublicClient` with `readContract()`. All writes use wagmi `useWriteContract()` hook on the client side. ABIs are defined inline using `parseAbi()` (human-readable) or literal ABI arrays. No ABI is imported from compiled artifacts.

---

## Part 3: Foundry Setup for ZAO OS

### Directory Structure

```
ZAO OS V1/
  contracts/                    # NEW -- Foundry project root
    foundry.toml                # Foundry config
    src/                        # Solidity source files
      ZAOMusicEdition.sol       # Music NFT (ERC-1155 open editions)
      RespectVotesWrapper.sol   # ERC20Votes wrapper around Respect1155
      ZAOSplitFactory.sol       # 0xSplits factory for per-release splits
    test/                       # Solidity tests
      ZAOMusicEdition.t.sol
      RespectVotesWrapper.t.sol
    script/                     # Deploy scripts (Solidity)
      DeployMusicEdition.s.sol
      DeployToBase.s.sol
    lib/                        # Git submodule dependencies
      forge-std/
      openzeppelin-contracts/
  src/                          # Existing Next.js app
    lib/
      contracts/                # NEW -- generated ABI imports
        abis/                   # JSON ABIs copied from contracts/out/
        addresses.ts            # Deployed addresses per chain
```

### Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize contracts directory
cd "ZAO OS V1"
mkdir contracts && cd contracts
forge init --no-commit

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
forge install foundry-rs/forge-std
```

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
via_ir = true
optimizer = true
optimizer_runs = 200
evm_version = "cancun"

[profile.default.fuzz]
runs = 10000
max_test_rejects = 100000

[rpc_endpoints]
base = "${BASE_RPC_URL}"
base_sepolia = "https://sepolia.base.org"
optimism = "${OPTIMISM_RPC_URL}"
optimism_sepolia = "https://sepolia.optimism.io"

[etherscan]
base = { key = "${BASESCAN_API_KEY}", url = "https://api.basescan.org/api" }
optimism = { key = "${OPTIMISM_ETHERSCAN_API_KEY}", url = "https://api-optimistic.etherscan.io/api" }
```

---

## Part 4: Contract Candidates for ZAO OS

Based on the existing codebase and research docs 131, 143, and 155, these are the 4 contracts ZAO should write:

### Contract 1: ZAOMusicEdition (ERC-1155 Open Editions on Base)

**Purpose:** Let ZAO artists mint music NFTs as open editions. Collectors buy editions; revenue flows through 0xSplits.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ZAOMusicEdition is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Edition {
        address artist;
        address splitAddress;   // 0xSplits contract for revenue
        string  arweaveUri;     // ar://... permanent metadata
        uint256 price;          // Price in wei (0 = free mint)
        uint256 maxSupply;      // 0 = unlimited
        uint256 totalMinted;
        bool    active;
    }

    uint256 public nextEditionId;
    mapping(uint256 => Edition) public editions;

    event EditionCreated(uint256 indexed editionId, address indexed artist, string arweaveUri);
    event Collected(uint256 indexed editionId, address indexed collector, uint256 amount);

    // Artist creates edition, revenue split set at creation
    function createEdition(
        string calldata arweaveUri,
        address splitAddress,
        uint256 price,
        uint256 maxSupply
    ) external returns (uint256 editionId);

    // Collector mints (pays price * amount)
    function collect(uint256 editionId, uint256 amount) external payable;

    // Revenue auto-forwarded to splitAddress on collect()
}
```

**Why ERC-1155 over ERC-721:** Gas cost per mint is 40-90% lower for batch operations. Sound.xyz uses ERC-721A, but for open editions where every token has identical metadata, ERC-1155 is the right standard. Each edition ID maps to one track; multiple collectors hold the same token ID.

### Contract 2: RespectVotesWrapper (ERC20Votes on Optimism)

**Purpose:** Wrap the existing Respect1155 balance into an ERC20Votes-compatible interface so it can plug into OpenZeppelin Governor for on-chain Respect-weighted governance.

This enables Doc 131's "Phase 3" -- custom Governor with Respect-weighted voting. The wrapper reads `balanceOf(account, 0)` from ZOR Respect1155 at `0x9885CC...45c` and exposes `getVotes(address)` for Governor compatibility.

### Contract 3: ZAOSplitFactory (Base)

**Purpose:** Thin wrapper around the 0xSplits SDK that creates immutable splits per music release with ZAO Treasury hardcoded as a 10% recipient. Matches the architecture described in Doc 143.

Default split: Artist 80% / ZAO Treasury 10% / Curator 10%.

### Contract 4: ZAOGovernor (Optimism -- Future)

**Purpose:** OpenZeppelin Governor deployed on Optimism that uses RespectVotesWrapper for vote weight. Replaces the current Supabase-based proposal system with trustless on-chain execution.

This is the "endgame" from Doc 131, Phase 3. Depends on Contract 2 being deployed first.

---

## Part 5: Deployment Workflow

### Deploy to Base (Mainnet)

```bash
# Set environment variables
export BASE_RPC_URL="https://mainnet.base.org"
export BASESCAN_API_KEY="your-key"
export DEPLOYER_PRIVATE_KEY="your-deployer-key"  # NOT a user key

# Deploy
forge script script/DeployMusicEdition.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Manual verification (if broadcast verification failed)
forge verify-contract \
  --chain base \
  --compiler-version v0.8.24 \
  <DEPLOYED_ADDRESS> \
  src/ZAOMusicEdition.sol:ZAOMusicEdition
```

### Deploy to Optimism

```bash
export OPTIMISM_RPC_URL="https://mainnet.optimism.io"
export OPTIMISM_ETHERSCAN_API_KEY="your-key"

forge script script/DeployRespectWrapper.s.sol \
  --rpc-url $OPTIMISM_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $OPTIMISM_ETHERSCAN_API_KEY
```

### Deploy to Testnet First

Always deploy to Base Sepolia (`https://sepolia.base.org`, chain ID 84532) and OP Sepolia (`https://sepolia.optimism.io`, chain ID 11155420) before mainnet. Testnet ETH is free from the Base and Optimism faucets.

### Gas Cost Estimates

| Contract | Estimated Deployment Gas | Cost at 0.01 gwei (Base) | Cost at 0.001 gwei (Optimism) |
|----------|-------------------------|--------------------------|-------------------------------|
| ZAOMusicEdition | ~2,500,000 gas | ~$0.05 | ~$0.005 |
| RespectVotesWrapper | ~1,200,000 gas | ~$0.02 | ~$0.002 |
| ZAOSplitFactory | ~800,000 gas | ~$0.01 | ~$0.001 |
| ZAOGovernor | ~4,000,000 gas | ~$0.08 | ~$0.008 |

Total estimated deployment cost across both chains: under $0.20 at current L2 gas prices.

---

## Part 6: Integrating Compiled ABIs into the Next.js App

After `forge build`, Foundry outputs full JSON ABIs to `contracts/out/`. The workflow to get them into the Next.js app:

### Step 1: Copy ABI after build

```bash
# In package.json scripts:
"contracts:build": "cd contracts && forge build",
"contracts:abi": "node scripts/copy-contract-abis.js"
```

### Step 2: ABI extraction script

```typescript
// scripts/copy-contract-abis.ts
import fs from 'fs';
import path from 'path';

const CONTRACTS = ['ZAOMusicEdition', 'RespectVotesWrapper', 'ZAOSplitFactory'];
const OUT_DIR = path.resolve('contracts/out');
const ABI_DIR = path.resolve('src/lib/contracts/abis');

fs.mkdirSync(ABI_DIR, { recursive: true });

for (const name of CONTRACTS) {
  const artifact = JSON.parse(
    fs.readFileSync(path.join(OUT_DIR, `${name}.sol`, `${name}.json`), 'utf8')
  );
  fs.writeFileSync(
    path.join(ABI_DIR, `${name}.json`),
    JSON.stringify(artifact.abi, null, 2)
  );
}
```

### Step 3: Type-safe contract config

```typescript
// src/lib/contracts/addresses.ts
import { base, optimism } from 'viem/chains';

export const ZAO_CONTRACTS = {
  musicEdition: {
    address: '0x...' as `0x${string}`,  // Filled after deployment
    chain: base,
  },
  respectWrapper: {
    address: '0x...' as `0x${string}`,
    chain: optimism,
  },
  splitFactory: {
    address: '0x...' as `0x${string}`,
    chain: base,
  },
} as const;
```

This replaces the current pattern in `src/lib/zounz/contracts.ts` where ABIs are manually transcribed via `parseAbi()`. Compiled ABIs guarantee type correctness and catch function signature mismatches at build time.

---

## Part 7: Testing Strategy

### Unit Tests (Foundry)

```solidity
// contracts/test/ZAOMusicEdition.t.sol
contract ZAOMusicEditionTest is Test {
    ZAOMusicEdition edition;
    address artist = makeAddr("artist");
    address collector = makeAddr("collector");
    address treasury = makeAddr("treasury");

    function setUp() public {
        edition = new ZAOMusicEdition("https://arweave.net/{id}");
    }

    function testCreateEdition() public {
        vm.prank(artist);
        uint256 id = edition.createEdition("ar://abc123", treasury, 0.001 ether, 0);
        assertEq(id, 0);
        (address a,,,,,,) = edition.editions(0);
        assertEq(a, artist);
    }

    function testCollectPaysToSplit() public {
        // ... verify ETH flows to split address
    }

    // Fuzz test: random prices and amounts
    function testFuzzCollect(uint96 price, uint8 amount) public {
        vm.assume(price > 0 && price < 1 ether);
        vm.assume(amount > 0 && amount < 100);
        // ... create edition with fuzzed price, collect fuzzed amount
    }
}
```

### Fork Tests (Against Live Contracts)

```bash
# Test against live ZOUNZ contracts on Base
forge test --fork-url https://mainnet.base.org --match-contract ZounzIntegrationTest

# Test against live OREC on Optimism
forge test --fork-url https://mainnet.optimism.io --match-contract RespectWrapperForkTest
```

Fork tests verify that the new contracts interact correctly with the 8 already-deployed contracts listed in Part 2.

### CI Pipeline

```yaml
# .github/workflows/contracts.yml
name: Contracts
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: cd contracts && forge build
      - run: cd contracts && forge test --gas-report
      - run: cd contracts && forge coverage
```

---

## Part 8: Security Checklist

Before deploying any contract to mainnet:

1. **Reentrancy:** All ETH transfers use Checks-Effects-Interactions pattern or OpenZeppelin ReentrancyGuard
2. **Access control:** Use OpenZeppelin AccessControl (role-based) not raw `onlyOwner`
3. **Integer overflow:** Solidity 0.8.24 has built-in overflow checks; no SafeMath needed
4. **Front-running:** Auction bids use commit-reveal if necessary (ZOUNZ Auction already handles this)
5. **Upgradability:** Do NOT use proxies unless governance-controlled upgrades are required. Immutable contracts are safer.
6. **Gas limits:** All loops are bounded (no unbounded iteration over arrays)
7. **External audit:** For contracts holding >$10K in value, get at least 1 independent audit (Code4rena, Sherlock, or manual review)
8. **Testnet first:** Every contract deployed to Base Sepolia + OP Sepolia with full test pass before mainnet

---

## Part 9: Environment Variables

New env vars required (server-side only, never exposed to browser):

```env
# contracts/.env (Foundry deployment -- gitignored)
BASE_RPC_URL=https://mainnet.base.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASESCAN_API_KEY=...
OPTIMISM_ETHERSCAN_API_KEY=...
DEPLOYER_PRIVATE_KEY=...   # Generated via scripts/generate-wallet.ts, NOT a personal key
```

These are separate from the Next.js `.env.local` and must never be committed to git.

---

## Part 10: Implementation Priority

| Priority | Contract | Chain | Effort | Depends On | Doc |
|----------|----------|-------|--------|------------|-----|
| 1 | ZAOMusicEdition | Base | 16 hrs | 0xSplits SDK | 155, 143 |
| 2 | ZAOSplitFactory | Base | 8 hrs | None | 143 |
| 3 | RespectVotesWrapper | Optimism | 12 hrs | Respect1155 analysis | 131, 58 |
| 4 | ZAOGovernor | Optimism | 20 hrs | RespectVotesWrapper | 131 |

Total estimated effort: 56 hours across all 4 contracts.

Contract 1 (ZAOMusicEdition) is the highest-value target because it enables the entire music NFT pipeline described in Doc 155 -- artists upload to Arweave, mint on Base, collectors buy, revenue auto-splits.

---

## Sources

- [Base Foundry Deployment Guide](https://docs.base.org/learn/foundry/deploy-with-foundry) -- Official Base documentation for deploying with Foundry
- [Foundry vs Hardhat Performance Comparison](https://chainstack.com/foundry-hardhat-differences-performance/) -- Detailed benchmarks on compile and test speed
- [Optimistic Etherscan Contract Verification](https://docs.optimism.etherscan.io/tutorials/verifying-contracts-programmatically) -- Programmatic verification on OP Mainnet
- [Nouns Builder Smart Contract Architecture](https://github.com/ourzora/zora-docs/blob/main/docs/smart-contracts/nouns-builder/intro.mdx) -- Manager, Token, Auction, Governor contract docs
- [Code4rena Nouns Builder Audit](https://github.com/code-423n4/2022-09-nouns-builder) -- Full security audit of Nouns Builder contracts
- [0xSplits SDK](https://github.com/0xSplits/splits-sdk) -- JavaScript SDK for building apps on 0xSplits
- [0xSplits Core Contracts](https://github.com/0xSplits/splits-contracts) -- Solidity source for split, waterfall, and swapper contracts
- [Sound.xyz Protocol Technical Deep Dive](https://sound.mirror.xyz/kkecS95u8VuB7b08kCmaooRTBVHqp3AdyAsszY7PA8k) -- Sound Protocol architecture (ERC-721A approach)
- [Hardhat vs Foundry 2026](https://metamask.io/news/hardhat-vs-foundry-choosing-the-right-ethereum-development-tool) -- MetaMask comparison of development frameworks
- [Smart Contract Frameworks 2026](https://www.nadcab.com/blog/smart-contract-frameworks-explained) -- Market share data: Hardhat 60%, Foundry 30%
