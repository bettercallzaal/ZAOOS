# Research 109: Optimystics Tooling Ecosystem — ZAO OS Integration Guide

**Date:** 2026-03-22
**Purpose:** Deep technical research on production-ready Optimystics tools for ZAO OS Phase 2 ORDAO integration.

---

## 1. Respect.Games App

### What It Does
Respect.Games is an **async-first** web app for playing the Respect Game without requiring live meetings. Communities submit contributions, review peers' work, and rank them (Level 1-6) to earn soulbound Respect tokens — all asynchronously.

- Groups of 3-6 evaluate contributions
- Each person shares work (~4 min equivalent)
- Group ranks contributions with 2/3+ agreement required
- Results recorded onchain as soulbound ERC-1155 Respect tokens
- Fibonacci-like distribution: Level 6 = most Respect

### Current Status
- **Beta** — available to try at https://respect.games
- Built on Optimism (EVM smart contracts + web frontend)
- Used alongside Optimism Fractal's biweekly Thursday events (17 UTC)

### Open Source Status
- No dedicated public GitHub repository found for the Respect.Games frontend
- The underlying smart contracts (Respect1155, OREC) are open source in the [sim31/ordao](https://github.com/sim31/ordao) repo (GPL-3.0)
- The FRAPPS toolkit references it as one of three core implementations

### Integration with ZAO OS
- **Option A — Link out:** Add a "Respect Game" button in ZAO OS governance section that opens respect.games for ZAO's fractal
- **Option B — Embed via iframe:** If CORS/CSP allows, embed the Respect.Games interface within ZAO OS
- **Option C — Build custom UI using orclient SDK:** Read/write Respect data using `@ordao/orclient` and build a native ZAO-themed experience
- Option C is recommended for Phase 2+ to maintain ZAO's dark navy/gold theme and mobile-first UX

---

## 2. Cignals (Competition App)

### What It Does
Cignals is a **competition/consensus game app** for live events. Communities create custom voting rules to rank performances, speeches, DJ sets, or any competitive activity with onchain attestations.

### How It Differs from Respect.Games
| Feature | Respect.Games | Cignals |
|---|---|---|
| Mode | Async contributions | Live event competitions |
| Purpose | Reputation building | Ranking performances |
| Output | Soulbound Respect tokens | Onchain attestations/rankings |
| Voting | Small group consensus | Flexible custom rules |
| Use case | Weekly governance | Concerts, DJ battles, talent shows |

### Current Status
- **Alpha tested** — 3 live events at Eden Fractal (EF 53, 55, 56)
- ~15 participants with "very high satisfaction"
- Successfully tested "Fractal DJ" competitions (ranking musical selections)
- Basic version available for communities on Optimism
- **Aiming to build full onchain version on OP Mainnet** — timeline not specified
- No public GitHub repository found yet

### ZAO OS Relevance
Cignals is directly relevant to ZAO's music community:
- **WaveWarz integration:** Cignals could power music competition rounds
- **Live event coordination:** Rank DJ sets, song submissions, artist showcases
- **Respect-weighted voting:** Artists with more Respect can have weighted votes
- Monitor development; integrate when onchain version ships

---

## 3. orclient SDK — Deep Dive

### Package Info
- **npm:** `@ordao/orclient` (v1.4.3, published Feb 2026)
- **License:** GPL-3.0
- **29 versions** published, actively maintained by sim31
- **Install:** `npm install @ordao/orclient`

### Dependencies
```
@ordao/ortypes: ^1.4.3
@ordao/ts-utils: ^1.4.3
ethers: ^6.13.0        // NOTE: uses ethers.js, not viem
zod: ^3.23.8
zod-to-json-schema: ^3.23.1
chai: ^4.3.0
```

### Compatibility with ZAO's Stack (wagmi/viem)
**orclient uses ethers.js v6, not viem.** This means:
- Cannot directly use wagmi's `useWalletClient()` hook
- Need a bridge: convert viem WalletClient to ethers Signer
- Use `@wagmi/ethers-adapters` or manual conversion:

```typescript
import { BrowserProvider } from 'ethers';
import { useWalletClient } from 'wagmi';

// Convert viem WalletClient to ethers Signer
const { data: walletClient } = useWalletClient();
const provider = new BrowserProvider(walletClient);
const signer = await provider.getSigner();

// Then use with orclient
const client = orclient.connect(signer);
```

### Full API Surface

#### Initialization
```typescript
// Create context with contract addresses + ornode URL
const context = new ORContext(stateWithOrnode, contractRunner, validate?);
// Or async factory:
const context = await ORContext.create(config);

// Create read-only client
const reader = new ORClientReader(context);

// Create full client (requires signer)
const client = new ORClient(context, config?);
const connected = client.connect(signer);
```

#### Reading Proposals
```typescript
// Get single proposal
const proposal = await client.getProposal(propId);

// Get filtered proposals (newest first)
const proposals = await client.getProposals({
  // Filter by creation time, execution status, vote status, stage, propId
});
```

#### Voting
```typescript
// Simple vote
await client.vote(propId, VoteType.Yes, "optional memo");
// Or structured
await client.vote({ propId, voteType, memo });

// Execute a passed proposal
await client.execute(propId);
```

#### Creating Proposals
```typescript
// Submit breakout room results (core Respect Game flow)
await client.proposeBreakoutResult(request, optionalVote);

// Award Respect to specific account
await client.proposeRespectTo(request, optionalVote);

// Batch award Respect
await client.proposeRespectAccountBatch(request, optionalVote);

// Burn Respect tokens
await client.proposeBurnRespect(request, optionalVote);
await client.proposeBurnRespectBatch(request, optionalVote);

// Custom signal (no onchain action, just a recorded decision)
await client.proposeCustomSignal(request, optionalVote);

// Advance period counter
await client.proposeTick(request, optionalVote);

// Custom contract call (execute arbitrary tx)
await client.proposeCustomCall(request, optionalVote);

// Governance parameter changes
await client.proposeSetPeriods(request, optionalVote);
await client.proposeSetMinWeight(request, optionalVote);
await client.proposeSetMaxLiveYesVotes(request, optionalVote);

// Cancel existing proposal
await client.proposeCancelProposal(request, optionalVote);

// Generic propose
await client.propose(propType, request, optionalVote);
```

#### Reading Respect Balances
```typescript
// Current Respect balance (ERC-1155 based)
const balance: bigint = await client.getRespectOf(ethAddress);

// Legacy/parent Respect balance
const oldBalance: VoteWeight = await client.getOldRespectOf(ethAddress);
```

#### Reading Awards & Tokens
```typescript
// Get Respect award NFTs (filtered, sorted by mint date)
const awards = await client.getAwards({ /* filter by date, recipient, burn status */ });

// Get specific token metadata
const token = await client.getToken(tokenId);
const award = await client.getAward(tokenId);

// Fungible Respect metadata
const meta = await client.getRespectMetadata();
```

#### Reading Votes
```typescript
// Get votes (filtered by proposal, voter, weight, type)
const votes = await client.getVotes({
  // propId, voter, minWeight, voteType
});
```

#### Reading DAO Configuration
```typescript
const periodNum = await client.getPeriodNum();
const nextMeeting = await client.getNextMeetingNum();
const lastMeeting = await client.getLastMeetingNum();
const voteLength = await client.getVoteLength();    // ms
const vetoLength = await client.getVetoLength();    // ms
const minWeight = await client.getMinWeight();
const maxLiveYes = await client.getMaxLiveYesVotes();
```

---

## 4. ornode API

### What It Is
ornode is a **Node.js/Express REST API with MongoDB** that stores off-chain data for ORDAO: proposal metadata, token metadata, and other data not stored onchain.

### Tech Stack
- Node.js + Express + TypeScript
- MongoDB for persistence
- Swagger UI for API docs (at `/swagger-ui/`)
- WebSocket support (resilientWs module)

### API Endpoints (v1)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/v1/putProposal` | Submit a new proposal with metadata |
| GET | `/v1/getPeriodNum` | Get current period number |
| POST | `/v1/getProposal` | Get single proposal by ID (PropId or OffchainPropId) |
| POST | `/v1/getProposals` | Get filtered proposals list |
| POST | `/v1/getToken` | Get token metadata (fungible or award) |
| POST | `/v1/getAward` | Get specific Respect award metadata |
| POST | `/v1/getRespectMetadata` | Get fungible Respect token metadata |
| POST | `/v1/getRespectContractMt` | Get Respect contract metadata |
| POST | `/v1/respectContractMetadata` | Alias for contract metadata |
| GET | `/v1/token/:tokenId` | Get token by ID (URL param, no prefix) |
| POST | `/v1/getAwards` | Get filtered Respect awards list |
| POST | `/v1/getVotes` | Get filtered votes list |

### Accessing ZAO's ORDAO Data
- ZAO's ornode instance would be at a URL like `https://ornode-zao.frapps.xyz` or self-hosted
- **Yes, ZAO OS can read its own ORDAO proposals** via the ornode API
- All input/output uses Zod schemas from `@ordao/ortypes`
- Swagger UI available at the ornode instance for interactive docs

### Example: Read Proposals from ZAO OS
```typescript
// Using orclient (recommended — abstracts ornode + blockchain)
const proposals = await orclient.getProposals();

// Or direct HTTP to ornode
const res = await fetch('https://ornode-zao.frapps.xyz/v1/getProposals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ spec: {} })
});
const { proposals } = await res.json();
```

---

## 5. FRAPPS Deployment

### How frapps.xyz Works
FRAPPS is a deployment platform for fractal apps on Ethereum. Each fractal gets a subdomain (e.g., `zao.frapps.xyz`) serving the ORDAO GUI configured for that fractal's contracts.

### Repository Structure
The [sim31/frapps](https://github.com/sim31/frapps) repo contains:
```
frapps/
├── apps/          # Software for fractal organizations
├── concepts/      # Design patterns and process definitions
└── fractals/      # Per-fractal configuration
    ├── aw-fractal/
    ├── eden-fractal/
    ├── genesis-fractal/
    ├── optimism-fractal/
    └── ordao-fractal/
```

### How to Deploy ZAO's Fractal App
1. Fork or PR the `sim31/frapps` repo
2. Create `fractals/zao-fractal/` directory
3. Add configuration files (intent docs, contract addresses)
4. Submit PR — if sensible, deployed at `https://zao.frapps.xyz`

### Customization
- Each fractal directory contains intent documents (natural language rules for meetings, consensus, respect game)
- Configuration points to smart contracts, ornode instance, and frontend
- The Optimism Fractal example contains: README, intent docs (meeting rules), changelog
- **Note:** No `frapp.json` config file was found in existing fractals — configuration appears to be via intent documents + infrastructure setup rather than a single JSON config

### For ZAO OS Integration
- ZAO can either use `zao.frapps.xyz` as an external link from ZAO OS
- Or self-host the ORDAO GUI (`apps/gui` from the ordao monorepo) with ZAO-specific configuration
- The GUI is a React app for submitting breakout results — can be forked and themed

---

## 6. Fractalgram Technical Details

### What It Is
A **customized Telegram Web A client** for fractal DAO meetings. Extends Telegram with automated poll creation and consensus-building messages during live sessions.

### Tech Stack
- TypeScript (56.3%), HTML (24.4%), JavaScript (13.1%), SCSS (6.1%)
- Webpack + Babel build system
- Jest + Playwright for testing
- **NOT a Telegram Mini App** — it's a full Telegram Web A fork
- Requires Telegram API credentials from my.telegram.org

### License
GPL-3.0 — forks must remain open source

### Repository
[github.com/Optimystics/fractalgram](https://github.com/Optimystics/fractalgram)

### Can It Be Forked for ZAO?
Technically yes, but **not recommended** for ZAO OS because:
- It's a full Telegram client fork (heavy, complex codebase)
- ZAO OS already has its own Farcaster-based chat
- The value of Fractalgram is in automating Telegram polls during live meetings
- Better approach: extract the consensus/polling logic and build it natively in ZAO OS

### What the UI Does During a Live Session
- Automates creation of ranking polls in Telegram groups
- Facilitates breakout room assignments
- Collects consensus results via structured messages
- Submits results onchain via ORDAO integration

---

## 7. OREC Contract ABI

### Contract: Orec.sol
- **License:** GPL-3.0
- **Source:** [sim31/ordao/contracts/packages/orec](https://github.com/sim31/ordao/tree/main/contracts/packages/orec)
- **Related contracts:** Respect1155 (ERC-1155 soulbound tokens), SolidRespect (ERC-20 migration), FractalRespect (legacy)

### Core Data Types

```solidity
enum VoteType { None, Yes, No }
enum Stage { Voting, Veto, Execution, Expired }
enum VoteStatus { Passing, Failing, Passed, Failed }

struct Vote {
    VoteType vtype;
    uint128 weight;      // VoteWeight
}

struct Message {
    address addr;         // Target contract address
    bytes cdata;          // Calldata to execute
    bytes memo;           // Title/description/salt
}

struct ProposalState {
    uint256 createTime;
    uint256 yesWeight;
    uint256 noWeight;
}
```

### Key Function Signatures

#### Proposing & Voting
```solidity
function propose(PropId propId) external
function vote(PropId propId, VoteType voteType, bytes calldata) external
function execute(Message calldata message) external returns (bool)
```

#### Reading State
```solidity
function proposalExists(PropId propId) public view returns (bool)
function isLive(PropId propId) public view returns (bool)
function isVotePeriod(PropId propId) public view returns (bool)
function isVetoPeriod(PropId propId) public view returns (bool)
function getStage(PropId propId) public view returns (Stage)
function getVoteStatus(PropId propId) public view returns (VoteStatus)
function isVoteActive(PropId propId) public view returns (bool)
function getLiveVote(PropId propId, address voter) public view returns (Vote memory)
function voteWeightOf(address account) public view returns (uint128)
function respectOf(address account) public view returns (uint256)
```

#### Admin (onlyOwner — i.e., the DAO itself via proposal)
```solidity
function setRespectContract(IERC165 respect) external onlyOwner
function setMinWeight(uint256 newMinWeight) external onlyOwner
function setPeriodLengths(uint64 newVoteLen, uint64 newVetoLen) external onlyOwner
function setMaxLiveVotes(uint8 newMaxLiveVotes) external onlyOwner
function signal(uint8 signalType, bytes calldata data) external onlyOwner
function cancelProposal(PropId propId) external onlyOwner
```

### How Optimistic Consent Works

**The Three-Phase Lifecycle:**

1. **Voting Period** (`voteLen`): Anyone can propose. Contributors vote Yes to support. A minority with sufficient Respect can push proposals through.

2. **Veto Period** (`vetoLen`): After voting ends, a veto window opens. Contributors can vote No to block.

3. **Execution** (after both periods expire): If the proposal passed, anyone can call `execute()`.

**Passing Threshold:**
```
noWeight * 2 < yesWeight   AND   yesWeight >= minWeight
```
- No-votes have **2x power**: a coalition with just 1/3 of yes-weight can veto
- Minimum weight threshold must be met
- Each voter limited to `maxLiveYesVotes` simultaneous active proposals (anti-spam)

**Security Model:**
- "Trusts a minority of contributors who take the initiative to act"
- Security comes from the time delay — community can easily block bad proposals
- Assumes relatively stable Respect distribution
- Asymmetric veto power prevents hostile takeover

---

## Integration Architecture for ZAO OS Phase 2

### Recommended Approach

```
ZAO OS (Next.js)
├── /governance route
│   ├── ProposalList — uses orclient.getProposals()
│   ├── ProposalDetail — uses orclient.getProposal(id)
│   ├── VotePanel — uses orclient.vote()
│   ├── RespectBalance — uses orclient.getRespectOf()
│   └── BreakoutSubmit — uses orclient.proposeBreakoutResult()
├── /api/governance/* — server-side ornode proxy routes
│   ├── /api/governance/proposals — proxy to ornode getProposals
│   └── /api/governance/respect — proxy to ornode + onchain reads
└── lib/ordao/
    ├── orclient.ts — singleton orclient setup
    ├── ethers-bridge.ts — viem-to-ethers signer conversion
    └── types.ts — re-export relevant ortypes
```

### Key Technical Decisions
1. **ethers.js bridge required** — orclient uses ethers v6, ZAO uses viem/wagmi
2. **ornode can be read server-side** — cache proposals in ZAO's Supabase for faster reads
3. **Voting requires wallet signature** — must happen client-side through wagmi
4. **GPL-3.0 license** — if importing orclient code directly, ZAO OS components using it must be GPL-compatible. Using it as an npm dependency (linking) is generally fine.

### Dependencies to Add
```json
{
  "@ordao/orclient": "^1.4.3",
  "@ordao/ortypes": "^1.4.3",
  "ethers": "^6.13.0"
}
```

---

## Additional Optimystics Tools (Brief Notes)

From the full toolkit inventory:

| Tool | Status | ZAO Relevance |
|---|---|---|
| **Cagendas** | Active | Agenda-setting game; could power ZAO meeting coordination |
| **OPTOPICS** | Active | Topic voting for events; relevant for ZAO community calls |
| **Respect Trees** | Active | Fractal framework for priorities; maps to ZAO's council structure |
| **RetroPolls** | Active | Impact evaluation; could help ZAO distribute retroactive rewards |
| **Firmament** | Active | Git+IPFS infrastructure; long-term decentralization goal |
| **Hats Tree** | Active | Onchain roles; ZAO already researching Hats (doc 59) |

---

## Sources

- [sim31/ordao GitHub](https://github.com/sim31/ordao) — ORDAO monorepo (contracts, orclient, ornode, GUI)
- [Optimystics/frapps GitHub](https://github.com/Optimystics/frapps) — Fractal apps toolkit
- [Optimystics/fractalgram GitHub](https://github.com/Optimystics/fractalgram) — Telegram client fork
- [sim31/frapps GitHub](https://github.com/sim31/frapps) — Deployment config for fractal apps
- [@ordao/orclient on npm](https://www.npmjs.com/package/@ordao/orclient) — Published SDK
- [orclient docs](https://orclient-docs.frapps.xyz) — TypeDoc API reference
- [Optimystics Tools](https://optimystics.io/tools) — Full toolkit listing
- [Respect Game overview](https://optimystics.io/respectgame) — How the Respect Game works
- [Cignals page](https://optimystics.io/cignals) — Competition app details
- [Respect.Games](https://respect.games) — Beta app (connection issues at time of research)
- [Optimism Fractal](https://optimismfractal.com) — Reference implementation community
