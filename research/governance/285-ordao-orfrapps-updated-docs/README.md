---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: [56, 58, 102, 103, 104, 105, 106, 109, 114, 184, 188, 285, 306, 346, 498, 702, 703]
original-query: "ORDAO and ORFrapps updated docs April 2026 - deployment, configuration, CLI" (reconstructed)
tier: STANDARD
---

# 285 - ORDAO & orfrapps: Deployment & Configuration (April 2026 Update)

> **Goal:** Document the split between ORDAO (sim31/ordao) and orfrapps (sim31/orfrapps) repos, the new CLI tooling, configuration system (frapp.json), and implications for ZAO OS integration. Cross-reference doc 109 for full ecosystem overview.

## Key Decisions (Recommendations First)

| Recommendation | Rationale | ZAO Action |
|---|---|---|
| **Use orfrapps for deployment tooling** | It's now canonical; moved from Optimystics/frapps in April 2026 | If deploying new ORDAO instance, use sim31/orfrapps CLI |
| **Use frapp.json config format** | Standardized, Zod-validated, supports multi-instance deployments | All fractal config changes → orfrapps format |
| **Integrate orclient for writes** | Abstracts on-chain/off-chain split; handles ornode proposal storage | Phase 2: add to src/lib/ordao/client.ts |
| **Skip privy-react-orclient** | ZAO uses iron-session + SIWF, not Privy | Use orclient directly; no auth wrapper |
| **Stay on zao.frapps.xyz** | Self-hosting duplicates existing infrastructure (nginx, MongoDB, PM2, Linux sysadmin) | Link from ZAO OS; do not self-host ornode |
| **Use check-awards CLI** | Verifies on-chain vs off-chain Respect consistency | Before major fractal migrations |
| **Plan Base expansion** | ORDAO now supports Base; future Superchain (see doc 184) | Defer to 2027; monitor doc 184 progress |

---

## What Changed Since Doc 56 (Feb 2026)

| Dimension | Before (Doc 56, Feb) | Now (April-May 2026) |
|---|---|---|
| **Deployment tooling** | Lived in Optimystics/frapps (ad-hoc scripts) | Moved to sim31/orfrapps (dedicated repo, 9 CLI commands) |
| **frapps repo** | Deployment scripts + configs mixed | Repurposed: fractal index + app definitions only |
| **Documentation** | Minimal ("code-was-docs") | 5 new guides (CLI_REFERENCE, CONFIGURATION, WALKTHROUGH_*, MULTIPLE_DEPLOYMENTS) |
| **CLI tool** | Manual shell scripts | Full `orfrapps` CLI with 9 commands, composable flags, help text |
| **Config format** | Undocumented per-instance setup | `frapp.json` (public) + `frapp.local.json` (secrets) with Zod validation |
| **New contracts** | OREC + Respect1155 only | Added SolidRespect (fixed ERC-20, not used by ZAO) |
| **New libraries** | orclient + ortypes | Added privy-react-orclient (Privy hooks; not used by ZAO) |
| **Network support** | Optimism + OP Sepolia | Added Base + Base Sepolia (enables future Superchain) |
| **Active fractals** | 3 (Eden, Optimism paused, ZAO) | Same 3; Optimism Fractal paused Jan 2026, ZAO only active on OP |

---

## 1. ORDAO Repository: The Monorepo (sim31/ordao)

**sim31/ordao** is the development monorepo. Structure:

```
ordao/
├── contracts/
│   ├── orec/              # OREC: Optimistic Executive Contract
│   ├── respect1155/       # ERC-1155 soulbound Respect tokens
│   └── solid-respect/     # ERC-20 variant (not used by ZAO)
├── libs/
│   ├── orclient/          # Client library - abstracts on-chain/off-chain split
│   ├── ortypes/           # Shared types + Zod validators
│   ├── privy-react-orclient/  # React + Privy hooks (skip for ZAO)
│   └── ts-utils, zod-utils, ethers-decode-error
├── services/
│   └── ornode/            # REST API backend (MongoDB + Node.js)
├── apps/
│   ├── gui/               # React frontend (Chakra UI, TanStack Router)
│   └── orclient-docs/     # Generated TypeDoc site
└── docs/
    └── OREC.md            # Smart contract spec
```

**Core design principle:** "Only proposal hashes live on-chain; full content lives in ornode." This hybrid model keeps gas costs low while maintaining integrity via hash verification.

---

## 2. orfrapps Repository: Production Deployment Tooling (sim31/orfrapps)

### Why a Separate Repo

ORDAO (sim31/ordao) = development environment. orfrapps (sim31/orfrapps) = production deployment + multi-instance management. Different concerns, different repos.

**sim31/orfrapps structure:**

```
orfrapps/
├── fractals/              # Per-fractal configs
│   ├── zaof/              # ZAO Fractal
│   │   ├── frapp.json     # Public (committed)
│   │   └── frapp.local.json  # Secrets (gitignored)
│   ├── ef2/, of/          # Other fractals
├── ordao/                 # Git submodule → sim31/ordao
├── src/                   # CLI TypeScript code
├── docs/                  # 5 guides
├── dist/                  # Generated: proc/, sites/, deployments/
```

### CLI Commands (9 Total)

| Command | Purpose | Typical Flags |
|---|---|---|
| `orfrapps contracts <id>` | Deploy OREC + Respect1155 | `-a` (all: build, deploy, verify) |
| `orfrapps ornode <id>` | Deploy backend service + config | `-a` (all) + `--domain <domain>` |
| `orfrapps gui <id>` | Build + deploy frontend | `-a` + `--domain` |
| `orfrapps ornode-sync` | Sync blockchain events to MongoDB | `-s` (step size, default 8000) |
| `orfrapps ornode-backup` | Backup MongoDB via mongodump | Requires `BACKUP_DIR` env var |
| `orfrapps check-awards` | Verify on-chain/off-chain consistency | `-f, -t` (block range) |
| `orfrapps rsplits` | Generate Respect CSV for splits contracts | `-c` (output) |
| `orfrapps parent-deploy` | Deploy parent Respect token | Networks: optimism, base, opSepolia, baseSepolia |
| `orfrapps orclient-docs` | Rebuild API docs site | `-a` (all) |

### Configuration Files

**frapp.json** (public config, committed):

```json
{
  "id": "zaof",
  "fullName": "ZAO Fractal",
  "frappsSubdomains": ["zao"],
  "deploymentCfg": {
    "network": "optimism",
    "oldRespectAddr": "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",
    "votePeriod": 259200,
    "vetoPeriod": 259200,
    "voteThreshold": "1000",
    "maxLiveYesVotes": 10
  },
  "app": {
    "defBreakoutType": "respectBreakout",
    "startPeriodNum": 0
  }
}
```

**frapp.local.json** (secrets, .gitignored):

```json
{
  "providerUrl": "https://optimism.alchemyapi.io/v2/...",
  "privyAppId": "...",
  "mongoCfg": {
    "url": "mongodb://...",
    "dbName": "zaof_fractal"
  },
  "ornode": {
    "host": "localhost",
    "port": 8090
  }
}
```

All configs validated via Zod at CLI runtime (early failure on errors).

### Deployment Procedure

**High-level (11 steps):**

1. `git clone sim31/orfrapps` + `npm run init`
2. Create `.env` with RPC URLs + deployer private key
3. Run `orfrapps contracts zaof -a` (deploys OREC + Respect1155, 1-5 min)
4. Create `frapp.local.json` with secrets
5. Run `orfrapps ornode zaof -a --domain zaoos.com` (builds + config backend)
6. Copy nginx configs, symlink, reload
7. Create DNS A records for `zao.zaoos.com`
8. Run `certbot --nginx -d zao.zaoos.com` (SSL)
9. Start ornode with PM2
10. Run `orfrapps gui zaof -a --domain zaoos.com` (build + deploy frontend)
11. Verify at `https://zao.zaoos.com`

**Infrastructure requirements:** Linux server, nginx, Node.js 18+, MongoDB, PM2.

---

## 3. ZAO OS Integration Options

### Current State

ZAO OS already has:
- `src/lib/ordao/client.ts` - viem-based read-only OREC reader
- `src/app/api/fractals/*` - API routes
- Contract addresses in `community.config.ts`

**Missing:** Proposal creation, voting, execution (all happen at zao.frapps.xyz currently).

### Integration Approaches

| Approach | Effort | Benefit | Risk | Recommendation |
|---|---|---|---|---|
| Keep viem reads only | 0 hrs | Works now, lightweight | No proposal creation in ZAO OS | Keep short-term |
| Add orclient for writes | 4-6 hrs | Full proposal lifecycle in ZAO OS | ethers.js dependency (not viem) | **DO THIS in Phase 2** |
| Replace with orclient entirely | 8-12 hrs | Single client pattern | Refactor all reads | Skip |
| Custom viem-based orclient wrapper | 16-20 hrs | Pure viem stack | Maintenance burden, fragile to orclient updates | Skip |

**Recommended:** Hybrid (Phase 2). Keep viem for reads; add orclient for writes (proposal creation, voting, execution). Ethers dependency is server-side only (not exposed to browser).

---

## 4. ZAO OS Integration: Next Steps

### Built Already

| Component | File(s) | Status |
|---|---|---|
| **Read OREC state** | `src/lib/ordao/client.ts` | Viem-based, works |
| **API routes** | `src/app/api/fractals/*` | 7 routes (proposals, member, sessions, analytics) |
| **UI** | `src/app/(auth)/fractals/` | Sessions, Proposals, Analytics, Leaderboard, About |
| **Config** | `community.config.ts` lines 105-116 | OREC address, Respect contracts |

### Not Built

- In-app proposal creation
- In-app voting + execution
- Breakout result submission
- Respect distribution triggers

### Phase 2 Files to Modify

| File | Change | Effort |
|---|---|---|
| `src/lib/ordao/client.ts` | Add orclient for writes | 4-6 hrs |
| `src/app/api/fractals/proposals/route.ts` | POST handler (orclient.proposeBreakoutResult) | 2 hrs |
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Vote/execute buttons | 2 hrs |
| `src/app/(auth)/fractals/BreakoutSubmit.tsx` | NEW: breakout result form | 3 hrs |
| `package.json` | Add @ordao/orclient, @ordao/ortypes, ethers | 0.5 hrs |

### Dependencies to Add

```json
{
  "@ordao/orclient": "^1.4.4",
  "@ordao/ortypes": "^1.4.4",
  "ethers": "^6.13.0"
}
```

---

## 5. Important Caveats

From Tadas (sim31) via Eden Fractal Telegram (Feb 2026):

1. **Docs cover deployment only** - ORDAO codebase docs in sim31/ordao still need work
2. **Docs are AI-generated with manual review** - Generally accurate, but test commands in a test env first
3. **Tooling built for infrastructure teams** - Not designed for casual self-deployment by non-operators
4. **GPL-3.0 applies** - All forks/modifications of orfrapps must remain open source

---

## Also See

- **Doc 56 - ORDAO & Respect Game System:** Original design + mechanics
- **Doc 109 - Optimystics Tooling Ecosystem:** Full tool overview (DEEP tier)
- **Doc 184 - Superchain ORDAO:** Cross-chain expansion plans
- **Doc 702 - Fractal Lineage:** Historical context + terminology
- **Doc 703 - ZAO Fractal State:** Current operational status + recommendations

---

## Next Actions

| Action | Owner | When |
|---|---|---|
| **Decision: link vs embed vs self-host zao.frapps.xyz** | @Zaal | Week 1 |
| **Integrate orclient for Phase 2** | @ZAO Dev | June 2026 |
| **Test orfrapps on staging instance** | @DevOps | Post-decision |
| **Document ornode migration plan** | @Zaal | June 2026 |

---

## Sources

**ORDAO:**
- [sim31/ordao GitHub](https://github.com/sim31/ordao) - Monorepo (TypeScript 93.6%, Solidity 5.6%) [FULL]
- [OREC Specification](https://github.com/sim31/ordao/blob/main/docs/OREC.md) - Smart contract design [FULL]
- [orclient README](https://github.com/sim31/ordao/tree/main/libs/orclient) - Client library overview [FULL]

**orfrapps (Deployment):**
- [sim31/orfrapps GitHub](https://github.com/sim31/orfrapps) - CLI + deployment tools (TypeScript 54.5%, Solidity 45.3%) [FULL]
- [CLI Reference](https://github.com/sim31/orfrapps/blob/main/docs/CLI_REFERENCE.md) - All 9 commands [FULL]
- [Configuration Guide](https://github.com/sim31/orfrapps/blob/main/docs/CONFIGURATION.md) - frapp.json format [FULL]
- [Deployment Walkthrough](https://github.com/sim31/orfrapps/blob/main/docs/WALKTHROUGH_DEPLOY.md) - Step-by-step [FULL]

**API & Docs:**
- [orclient-docs.frapps.xyz](https://orclient-docs.frapps.xyz) - TypeDoc API reference [FULL]
- [ZAO frapps deployment](https://zao.frapps.xyz) - Live instance [FULL]

**Cross-reference:**
- Doc 109 (Optimystics ecosystem) - Full tools overview
- Doc 702 (Fractal lineage) - Context + history
