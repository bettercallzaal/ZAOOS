---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: [56, 58, 102, 103, 104, 105, 106, 109, 114, 184, 188, 285, 306, 346, 498, 698, 699]
original-query: "Optimystics tooling ecosystem status 2026 - ORDAO, orfrapps, Respect.Games, Cignals, fractalgram integration" (reconstructed)
tier: DEEP
---

# 109 - Optimystics Tooling Ecosystem

> **Goal:** Map the current state of all Optimystics tools (ORDAO/OREC, orfrapps, Respect.Games, Cignals, fractalgram, Respect Trees, etc.), verify production readiness, and recommend ZAO OS integration paths. Cross-reference with docs 698 (fractal lineage) and 699 (ZAO Fractal state).

## Key Decisions (Recommendations First)

| Decision | Recommendation | Why |
|----------|---|---|
| **orclient version for ZAO OS** | Use `@ordao/orclient` v1.4.4 (published April 2, 2026) with ethers bridge | Latest stable, active maintenance (3+ commits since April 2, GPL-3.0 compatible) |
| **Async Respect Game app** | Do not build on respectgame.app - it is not in active development (per Dan SingJoy, May 2026) | If ZAO wants async games, build native on @ordao/orclient or see doc 664 |
| **Cignals status** | Consider community fork/spec if ZAO wants music-competition ranking at live events | Still "in development" but tested at 3+ Eden Fractal sessions; demo videos released May 2026 |
| **Fractalgram for ZAO** | NOT recommended for ZAO OS integration (heavy fork, Telegram-only) | Use fractalgram at external Telegram sessions; keep ZAO OS consensus logic natively built |
| **frapps subdomains** | Confirm zao.frapps.xyz, of.frapps.xyz, eden-fractal.frapps.xyz resolve; verify DNS/SSL quarterly | Deployment stable but no monitoring dashboard in docs |
| **ORDAO deployment** | Hosted at zao.frapps.xyz is production; self-hosting duplicates existing infra | orfrapps repo (sim31/orfrapps) is now canonical for deployment tooling (moved from Optimystics/frapps) |

---

## 1. respectgame.app - Async Respect Game App

### What It Does

respectgame.app is an async-first web app for playing the Respect Game without requiring live meetings. Community members coordinate by writing - submitting contributions and ranking each other on a self-paced schedule, often with no scheduled meeting at all. Results are minted on-chain as soulbound ERC-1155 Respect tokens on a Fibonacci-curve payout.

### Current Status: NOT in active development (verified May 2026)

Primary source: Dan SingJoy (Eden Fractal founder), written response, May 2026.

- The app is `respectgame.app`, built by @cxzvnk's team.
- Dan's assessment: "a promising app and includes many excellent features."
- It is NOT currently in active development - per Dan, the lead developer "has been working on another project lately."
- Dan's broader verdict on async fractal tooling: "Asynchronous fractal apps have great potential, but in my experience the simplest and most effective solution so far has been to meet at a consistent time."

Correction: a March 2026 draft of this doc described an active "v2 rebuild" of this app (new consensus algorithm, AI contribution summaries, liquidity-pool rewards, a mid-June 2026 launch) attributed to a developer named "Vlad". That could not be confirmed and is contradicted by Dan SingJoy's primary-source account. Treat the async Respect Game app as dormant, not as a tool with an imminent v2. The respectgame.app site loads as a JavaScript app shell that does not render to fetch tools - the status above is sourced from Dan SingJoy directly.

### Open Source

- ORDAO contracts (Respect1155, OREC): GPL-3.0, in [sim31/ordao](https://github.com/sim31/ordao).
- The respectgame.app frontend and contract repo location is not confirmed.

### Integration Options for ZAO OS

1. **Do not depend on respectgame.app** - it is not actively maintained; pointing ZAO members at a dormant app is a dead end.
2. **Build ZAO-native async UI** - if ZAO wants async Respect Games, build on `@ordao/orclient`, or pursue the GitHub-native fractal idea in doc 664.
3. **Keep the synchronous Monday 6pm fractal as the primary mode** - this matches Dan SingJoy's experience that a consistent meeting time is the simplest, most effective approach.

---

## 2. Cignals - Live Event Competition App

### What It Does

Cignals is a **synchronous competition/ranking app** for live fractal events. Communities gather, propose speeches/DJ sets/performances, vote in real-time, and record results on-chain via ORDAO integration.

- Real-time ranking UI during live sessions
- Flexible voting modes: simple majority, consensus (2/3), custom thresholds
- Onchain attestation of results (via OREC contract)
- Can distribute Respect or attestation tokens to winners
- Designed for 1-2 hour sessions; pairs with Fractalgram for Telegram coordination

### Current Status: Active Development

| Metric | Value | Source |
|---|---|---|
| **Latest public event** | Eden Fractal events at video timestamps; Cignals demo videos (May 2026) | optimystics.io/videos |
| **Known live tests** | 3+ Eden Fractal sessions (speakers ranking, musical selections) | Optimystics YouTube, ~15 participants |
| **Satisfaction score** | "Very high" from pilot participants | optimystics.io/cignals overview |
| **Chain support** | Optimism (OP Mainnet); planning Base expansion | Optimystics roadmap |
| **Public repo** | None yet; code likely in Optimystics private or Vlad's branch | GitHub org survey |
| **Onchain version** | "In development" (timeline TBD) | optimystics.io/tools |

### ZAO Music Community Fit

Cignals directly aligns with ZAO's music-first positioning:

- **WaveWarZ contests:** Rank music drops, voting per session
- **Live event ranking:** Concert performances, DJ battles, song submissions at ZAO events
- **Respect-weighted voting:** Members with higher Respect get proportional voting weight (phase 2+)
- **Festival integration:** Use at ZAOstock 2026 (Oct 3) or earlier ZAO events

**Recommendation:** Spec out a ZAO fork of Cignals logic once Optimystics ships the onchain version (target: June 2026). Doc 698 lineage + 699 state provide context for how Respect distribution works.

---

## 3. orclient SDK - Client Library for ORDAO

### Package Info

| Field | Value |
|---|---|
| **npm** | `@ordao/orclient` |
| **Latest version** | v1.4.4 (published April 2, 2026) |
| **License** | GPL-3.0 |
| **Versions published** | 22+ (actively maintained by sim31 + dependabot) |
| **Repo** | sim31/ordao/libs/orclient |
| **Install** | `npm install @ordao/orclient @ordao/ortypes` |

### Core Dependencies

- `@ordao/ortypes` ^1.4.4 - Shared TypeScript interfaces + Zod validators
- `ethers` ^6.13.0 - **Note:** orclient uses ethers.js, ZAO OS uses viem/wagmi
- `zod` ^3.23.8 - Schema validation
- `zod-to-json-schema` - Converts Zod to JSON Schema for API docs

### Key Design Pattern

"Only proposal hashes are stored on-chain - full proposal content and metadata lives on ornode." orclient abstracts the split:
- Translates user input → contract calls
- Uploads proposal metadata to ornode (off-chain DB)
- Merges on-chain state + off-chain content into consistent reads

### Compatibility with ZAO's Stack (wagmi/viem)

**orclient uses ethers.js v6, not viem** - different client libraries, same underlying EVM provider.

**For writes (voting, proposal submission):**
- Convert viem WalletClient to ethers Signer
- Use `@wagmi/ethers-adapters` or manual bridge:

```typescript
import { BrowserProvider } from 'ethers';
import { useWalletClient } from 'wagmi';

const { data: walletClient } = useWalletClient();
const provider = new BrowserProvider(walletClient?.transport?.mode?.transport || walletClient);
const signer = await provider.getSigner();

const orclient = new ORClient(context);
const connected = orclient.connect(signer);
```

**For reads (proposals, balances):**
- orclient's ORClientReader is network-agnostic
- Pairs with ornode HTTP API (no signer needed)
- Alternative: Use ZAO OS's existing viem-based `src/lib/ordao/client.ts` for reads only

### orclient API Surface (Key Methods)

**Initialization:**
```typescript
const context = new ORContext(state, runner, validate?);
const reader = new ORClientReader(context);  // Read-only
const client = new ORClient(context); 
const connected = client.connect(signer);  // Connect for writes
```

**Read Proposals:**
```typescript
const proposal = await client.getProposal(propId);
const proposals = await client.getProposals({ filter });
```

**Voting:**
```typescript
await client.vote(propId, VoteType.Yes, "memo");
await client.execute(propId);
```

**Propose (core Respect Game flows):**
```typescript
// Submit breakout group results
await client.proposeBreakoutResult(request, optionalVote);

// Award Respect to one account
await client.proposeRespectTo(request, optionalVote);

// Award Respect batch
await client.proposeRespectAccountBatch(awards[], optionalVote);

// Burn Respect
await client.proposeBurnRespect(request, optionalVote);

// Custom governance signal
await client.proposeCustomSignal(data, optionalVote);

// Governance parameter changes
await client.proposeSetPeriods(newLengths, optionalVote);
await client.proposeSetMinWeight(newThreshold, optionalVote);
```

**Read Respect / Balances:**
```typescript
const balance = await client.getRespectOf(ethAddress);  // Current (ERC-1155)
const oldBalance = await client.getOldRespectOf(ethAddress);  // Legacy ERC-20
const awards = await client.getAwards({ filters });
```

**Read DAO Config:**
```typescript
const periodNum = await client.getPeriodNum();
const voteLength = await client.getVoteLength();  // milliseconds
const minWeight = await client.getMinWeight();
```

For full API docs, see [orclient-docs.frapps.xyz](https://orclient-docs.frapps.xyz)

---

## 4. ornode - Off-Chain Proposal Backend

### What It Is

ornode is a **Node.js/Express REST API backed by MongoDB** that stores proposal metadata and votes for ORDAO. On-chain OREC only stores proposal hashes; full content lives in ornode.

### Tech Stack

- Node.js 18+ + Express + TypeScript
- MongoDB for persistence
- Swagger UI at `/swagger-ui/`
- Zod validation (schemas from `@ordao/ortypes`)

### Core Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/putProposal` | POST | Submit a new proposal with metadata |
| `/v1/getProposal` | POST | Fetch one proposal (on-chain + off-chain merged) |
| `/v1/getProposals` | POST | Fetch filtered list (newest first) |
| `/v1/getAwards` | POST | List Respect awards (metadata + mint status) |
| `/v1/getVotes` | POST | Fetch votes for a proposal |
| `/v1/getPeriodNum` | GET | Current period number |
| `/v1/getRespectMetadata` | POST | Token metadata |
| `/v1/token/:tokenId` | GET | Token details by ID |

### For ZAO OS

**Current deployment:** `zao-ornode.frapps.xyz` (status: [PARTIAL - endpoint down as of May 2026, per doc 699])

orclient abstracts ornode + on-chain reads, so integrate via orclient rather than direct HTTP. If ornode is down:
- orclient.getProposals() will fail until ornode restarts
- Fallback: Read on-chain state only via viem (proposals hashes, votes, balances)
- Action: Stand up replacement ornode or formally retire it (see doc 699 recommendations)

---

## 5. frapps Deployment Platform

### What It Is

frapps.xyz is a **multi-tenant deployment platform** that hosts ORDAO instances for different fractals. Each fractal gets a subdomain (e.g., `zao.frapps.xyz`, `of.frapps.xyz`, `eden-fractal.frapps.xyz`).

### Repository Structure

**sim31/frapps** (top-level index of fractals + apps + concepts):
```
frapps/
├── apps/              # Fractal software (gui, other UIs)
├── concepts/          # Design docs + Respect Game rules
└── fractals/          # Per-fractal configs
    ├── zaof/          # ZAO Fractal
    ├── of/            # Optimism Fractal
    ├── ef2/           # Eden Fractal (after Base migration)
    └── ...
```

**sim31/orfrapps** (deployment tooling, moved from Optimystics/frapps in April 2026):
```
orfrapps/             # NEW: production deployment repo
├── fractals/          # Per-fractal config (frapp.json + secrets)
├── src/               # CLI implementation
├── docs/              # 5 guides (CLI, Config, Deploy, etc.)
└── dist/              # Generated: proc/, sites/, deployments/
```

### Deployment Tooling (orfrapps)

**9 CLI commands** for managing ORDAO instances:

| Command | Purpose | Key Flags |
|---|---|---|
| `orfrapps contracts <id>` | Deploy OREC + Respect1155 | `-a` = all steps |
| `orfrapps ornode <id>` | Deploy backend + MongoDB | `-a` = all steps |
| `orfrapps gui <id>` | Build frontend UI | `-a` = all steps |
| `orfrapps check-awards` | Verify on-chain/off-chain Respect consistency | `-f, -t` = block range |
| `orfrapps ornode-sync <from> <to>` | Sync blockchain events to DB | `-s` = step size |
| `orfrapps rsplits` | Generate Respect distribution CSV | `-c` = output |
| `orfrapps parent-deploy <id>` | Deploy parent Respect (for sidechain) | networks: optimism, base, opSepolia, baseSepolia |

### Configuration (frapp.json)

ZAO's config at `orfrapps/fractals/zaof/frapp.json`:

| Field | Value | Purpose |
|---|---|---|
| `id` | `zaof` | Identifier |
| `fullName` | `ZAO Fractal` | Display name |
| `deploymentCfg.network` | `optimism` | Target chain |
| `deploymentCfg.votePeriod` | `259200` | 3 days (seconds) |
| `deploymentCfg.voteThreshold` | `1000` | Min Respect to vote |
| `app.defBreakoutType` | `respectBreakout` | or `respectBreakoutX2` |

Secrets in `frapp.local.json` (gitignored): RPC URL, Privy App ID, MongoDB connection string.

### For ZAO OS Integration

- **Option A:** Link to `zao.frapps.xyz` from ZAO OS `/fractals` page
- **Option B:** Embed frapps GUI as iframe (check CORS/CSP)
- **Option C:** Self-host GUI from ordao/apps/gui with ZAO branding (16-20 hrs effort, duplicates existing frapps infrastructure)

---

## 6. Fractalgram - Telegram Web Client for Live Sessions

### What It Is

Fractalgram is a **fork of Telegram Web A** tailored for live fractal meetings. It automates poll creation, breakout room coordination, and on-chain result submission during synchronous Respect Game sessions.

### Tech Stack

- TypeScript 56.3%, HTML 24.4%, JavaScript 13.1%, SCSS 6.1%
- Webpack + Babel
- Jest + Playwright testing
- **Not a Telegram Mini App** - full Telegram Web client fork
- Requires Telegram API credentials from my.telegram.org

### Repo

[github.com/Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) - Last updated May 20, 2025. License: GPL-3.0 (forks must remain open source).

### What It Does

- Automates ranking poll creation in Telegram groups during live sessions
- Breakout room role assignment
- Consensus result collection (2/3 agreement on rankings)
- Direct on-chain submission to ORDAO/OREC

### NOT Recommended for ZAO OS

**Why:** It's a heavy, complex Telegram fork. Better alternatives:

1. **Keep Fractalgram in Telegram** - Use it at external ZAO meetings (Monday 6pm Discord call)
2. **Build ZAO-native async** - build on `@ordao/orclient`, or explore the GitHub-native fractal idea (doc 664). Do not wait on respectgame.app; it is dormant.
3. **Avoid the fork cost** - Fractalgram maintenance burden is high; Optimystics is the only active maintainer

**If ZAO wants live session automation:** Extract polling logic from Fractalgram and build native ZAO OS UI (React + Chakra) instead. Can reuse ORDAO contract logic via orclient.

---

## 7. OREC Smart Contract - Optimistic Respect-based Executive Contract

### Contract Details

**Address (Optimism mainnet):** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

| Metric | Value |
|---|---|
| **Repo** | [sim31/ordao/contracts/packages/orec](https://github.com/sim31/ordao/tree/main/contracts/packages/orec) |
| **License** | GPL-3.0 |
| **Language** | Solidity |
| **Total txns** | ~242 (as of May 21, 2026) [FULL] |
| **Active signers (for submission)** | 2 wallets: zaal.eth, civilmonkey.eth [FULL] |

**Related contracts:**
- **Respect1155** - ERC-1155 soulbound Respect tokens (non-transferable)
- **OG Respect (ERC-20)** - Legacy pre-ORDAO token on Optimism
- **SolidRespect** - ERC-20 fixed-distribution variant (not used by ZAO)

### Core Governance Model: Three-Phase Lifecycle

**Phase 1 - Voting Period (default: 3 days)**
- Any member can propose
- Yes-voters (Respect-weighted) support
- Proposal passes if: `yesWeight >= minWeight` AND `yesWeight > noWeight * 2`

**Phase 2 - Veto Period (default: 3 days)**
- Veto window opens after voting ends
- No-voters can block passed proposals
- Veto succeeds if: `noWeight * 2 >= yesWeight`

**Phase 3 - Execution (after both periods expire)**
- Anyone can trigger on-chain execution
- Proposals that passed veto are now executed

**Anti-spam:** Each voter limited to `maxLiveYesVotes` simultaneous active proposals (~10 typically).

### Key Insight: Optimistic Consent

"Trust a minority of contributors who take the initiative to act." Security model:
- Time delay allows easy blocking of bad proposals
- Asymmetric veto power (No votes count 2x) prevents hostile takeover
- Works best with stable Respect distribution (monitor via doc 699, 115 reconciliation)

---

## 8. ZAO OS Integration Paths (Phase 2+)

### Current State

**Already built in ZAO OS:**
- `src/lib/ordao/client.ts` - viem-based read-only OREC contract reader (proposals, Respect balances)
- `src/app/api/fractals/*` - API routes serving fractal data
- `src/app/(auth)/fractals/` - Full UI (Sessions, Proposals, Leaderboard, Analytics tabs)
- Contract addresses in `community.config.ts` (lines 105-116): OREC + OG/ZOR Respect tokens

**Not built yet:**
- In-app proposal creation (currently at zao.frapps.xyz)
- In-app voting + execution
- Breakout result submission from ZAO OS
- Async proposal support (build native on @ordao/orclient; respectgame.app is dormant)

### Recommended Integration (Phase 2)

**Use orclient for write operations + keep existing viem reads:**

```typescript
// File: src/lib/ordao/orclient-bridge.ts
import { ORClient, ORContext } from '@ordao/orclient';
import { BrowserProvider } from 'ethers';

export async function createORClientForViem(walletClient) {
  // Convert viem -> ethers
  const provider = new BrowserProvider(walletClient);
  const signer = await provider.getSigner();
  
  // Initialize orclient
  const context = new ORContext(zaoConfig);
  const client = new ORClient(context);
  return client.connect(signer);
}
```

**Update ZAO OS routes:**

| File | Change |
|---|---|
| `src/app/api/fractals/proposals/route.ts` | Add POST handler (orclient.proposeBreakoutResult) |
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Add vote/execute buttons |
| `community.config.ts` | Add ornode URL, contract addresses (already done) |
| `package.json` | Add deps: `@ordao/orclient @ordao/ortypes ethers ^6.13` |

### License Consideration

- orclient is GPL-3.0; ZAO OS is MIT
- Using orclient as npm dependency = linking, which is compatible
- If copy-pasting code from orclient into ZAO OS, those components must stay GPL-3.0
- Recommendation: Import orclient as a module, do not inline its code

### Dependencies to Add

```json
{
  "@ordao/orclient": "^1.4.4",
  "@ordao/ortypes": "^1.4.4",
  "ethers": "^6.13.0"
}
```

---

## 9. Other Optimystics Tools (Brief Scan)

| Tool | Status | ZAO Fit | Notes |
|---|---|---|---|
| **Respect Trees** | Active | Medium | Fractal priority mapping; ZAO uses Council structure instead |
| **RetroPolls** | Active | Low | Impact evaluation; ZAO focuses on weekly sessions, not retroactive |
| **Cagendas** | In dev | Medium | Agenda-setting game; ZAO could use for meeting topics |
| **OPTOPICS** | In dev | Low | Topic voting; less relevant than in-session ranking |
| **Firmament** | Long-term | Future | Git+IPFS decentralization; not immediate priority |
| **Hats Protocol** | Via sim31 | Pending | Onchain roles; ZAO exploring integration (see doc 59) |

---

## Also See

- **Doc 56 - ORDAO & Respect Game System:** Comprehensive original design (Feb 2026)
- **Doc 102-114 - Fractal governance deep dives:** Respect mechanics, game theory, contract audit
- **Doc 184 - Superchain ORDAO:** Cross-chain governance planning
- **Doc 285 - orfrapps Updated Docs:** Deployment, configuration, CLI reference
- **Doc 698 - Fractal Lineage:** Complete history (Fractally -> Eden -> Optimism -> ZAO)
- **Doc 699 - ZAO Fractal Current State:** Operational status, recommendations (May 2026)

---

## Next Actions

| Action | Owner | Timeline | Why |
|---|---|---|---|
| **Choose: Link vs embed vs self-host zao.frapps.xyz** | @Zaal | Week 1 | Unblock ZAO OS `/fractals` page UX decision |
| **Integrate orclient for proposal creation** | @ZAO Dev | Phase 2 (Jun) | Enable in-app voting without zao.frapps.xyz fallback |
| **Decide async-fractal approach** | @ZAO Dev | Jun 2026 | Build native on @ordao/orclient or pursue doc 664 GitHub-native fractal; respectgame.app is dormant |
| **Document Fractalgram setup for live sessions** | @Zaal | Ongoing | Help non-technical members (Tanja, etc) use Discord bot + Telegram |
| **Evaluate Cignals fork for ZAOstock music ranking** | @Zaal + Cassie | May-Jun | Prepare event automation (Oct 3 deadline) |

---

## Sources

**ORDAO & orclient:**
- [sim31/ordao GitHub](https://github.com/sim31/ordao) - Main monorepo [FULL]
- [sim31/orfrapps GitHub](https://github.com/sim31/orfrapps) - Deployment tooling + CLI [FULL]
- [@ordao/orclient npm](https://www.npmjs.com/package/@ordao/orclient) - v1.4.4 (April 2026) [FULL]
- [orclient-docs.frapps.xyz](https://orclient-docs.frapps.xyz) - API reference [FULL]
- [orfrapps CLI Reference](https://github.com/sim31/orfrapps/blob/main/docs/CLI_REFERENCE.md) - Command reference [FULL]

**Respect Game & Fractalgram:**
- [optimystics.io/respectgame](https://optimystics.io/respectgame) - Theory + mechanics [FULL]
- [optimystics.io/cignals](https://optimystics.io/cignals) - Competition app [PARTIAL - page has encoding issues]
- [Optimystics/fractalgram GitHub](https://github.com/Optimystics/fractalgram) - Telegram fork [FULL]

**Respect.Games:**
- [respectgame.app](https://respectgame.app) - async Respect Game app by @cxzvnk's team [PARTIAL - JS app shell, will not render to WebFetch or exa; status sourced from Dan SingJoy's written account, May 2026]
- [optimystics.io/respect-games-app](https://optimystics.io/respect-games-app) - Overview + features [FULL]

**Deployment & frapps:**
- [sim31/frapps GitHub](https://github.com/sim31/frapps) - Fractal configs [FULL]
- [optimystics.io/tools](https://optimystics.io/tools) - Toolkit overview [FULL]

**Cross-reference docs:**
- Doc 698 (Fractal Lineage) - History + terminology [FULL]
- Doc 699 (ZAO Fractal State) - Current ops + recommendations [FULL]
