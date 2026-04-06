# 285 — ORDAO & ORFrapps Updated Documentation (April 2026)

> **Status:** Research complete
> **Date:** 2026-04-05
> **Goal:** Document the updated ORDAO and ORFrapps repos — new architecture, deployment tooling, CLI reference, configuration system — and map implications for ZAO OS integration

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **ZAO frapp config** | USE the orfrapps `frapp.json` config format for any future ZAO fractal deployment changes — it's now the canonical way to configure ORDAO instances |
| **orclient in ZAO OS** | USE `@ordao/orclient` (from `libs/orclient/`) instead of raw viem calls in `src/lib/ordao/client.ts` — it abstracts the on-chain/off-chain split and handles proposal content storage on ornode automatically |
| **Repo split awareness** | ORDAO (`sim31/ordao`) = codebase + dev environment. ORFrapps (`sim31/orfrapps`) = production deployment + config. Two repos, two concerns. Do not conflate them |
| **privy-react-orclient** | SKIP for ZAO OS — we use SIWF + iron-session auth, not Privy. Use `orclient` directly instead of the Privy wrapper |
| **Self-hosting vs hosted** | USE hosted deployment at `zao.frapps.xyz` for now — self-hosting requires Linux + nginx + MongoDB + PM2 infrastructure that duplicates the existing frapps.xyz setup |
| **SolidRespect** | SKIP — ZAO uses Respect1155 (ERC-1155 NTTs), not the fixed-distribution ERC-20 variant |
| **check-awards CLI** | USE `orfrapps check-awards` to verify on-chain/off-chain consistency for ZAO's Respect data — catches discrepancies between ornode DB and actual Respect1155 mints |
| **Network support** | ORDAO now supports Optimism, Base, OP Sepolia, and Base Sepolia — ZAO is on Optimism mainnet, but Base support enables future Superchain ORDAO (see Doc 184) |

---

## What Changed Since Doc 56 (Feb 2026)

Doc 56 documented the ORDAO system comprehensively. Here's what's new:

| Change | Before (Doc 56) | Now (April 2026) |
|--------|-----------------|-------------------|
| **Deployment tooling** | Lived in `Optimystics/frapps` | Moved to `sim31/orfrapps` — dedicated repo with CLI, config system, docs |
| **frapps repo** | Deployment scripts + configs | Repurposed as top-level index of fractals, apps, and concepts |
| **Documentation** | Minimal, code-was-the-docs | 5 comprehensive docs: CLI_REFERENCE, CONFIGURATION, WALKTHROUGH_CONFIGURE, WALKTHROUGH_DEPLOY, MULTIPLE_DEPLOYMENTS |
| **CLI tool** | Ad-hoc scripts | Full `orfrapps` CLI with 9 commands, composable flags |
| **Config format** | Undocumented | `frapp.json` + `frapp.local.json` with Zod validation |
| **New contract** | OREC + Respect1155 | Added `SolidRespect` (fixed ERC-20 variant) |
| **New library** | orclient + ortypes | Added `privy-react-orclient` (React hooks + Privy auth wrapper) |
| **Network support** | Optimism + OP Sepolia | Added Base + Base Sepolia |
| **Active instances** | 3 (Eden, Optimism, ZAO) | Still 3, but now with proper config management |

---

## ORDAO Architecture (Updated)

### Package Structure

```
ordao/                          # sim31/ordao — development repo
├── contracts/
│   ├── orec/                   # OREC: Optimistic Respect-based Executive Contract
│   ├── respect1155/            # ERC-1155 non-transferable Respect tokens
│   └── solid-respect/          # NEW: ERC-20 fixed-distribution Respect
├── libs/
│   ├── orclient/               # Client library (on-chain + off-chain abstraction)
│   ├── ortypes/                # Shared TypeScript types + Zod schemas
│   ├── privy-react-orclient/   # NEW: React hooks wrapping orclient + Privy
│   ├── ts-utils/               # General TS utilities
│   ├── zod-utils/              # Zod schema utilities
│   └── ethers-decode-error/    # Smart contract error decoding
├── services/
│   └── ornode/                 # Backend API (proposals, votes, metadata → MongoDB)
├── apps/
│   ├── gui/                    # Frontend (React + Chakra UI + TanStack Router)
│   └── orclient-docs/          # Generated API docs (orclient-docs.frapps.xyz)
└── docs/
    └── OREC.md                 # OREC specification
```

### Dependency Graph

```
apps/gui ──────────────► libs/privy-react-orclient ──► libs/orclient ──► libs/ortypes
                                                                              │
                         services/ornode ──────────────────────────────────────┘
                                                                              │
                                                              contracts/orec ◄┘
                                                              contracts/respect1155
```

### Key Design Principle

> "Only proposal hashes are stored on-chain — full proposal content and metadata lives on the ornode."

This hybrid approach keeps gas costs low while maintaining data integrity through hash verification.

---

## ORFrapps: Deployment & Configuration System

### Why a Separate Repo

Tadas (sim31) explains: ORDAO is oriented toward developing a single DAO's tooling with dev-environment scripts. ORFrapps manages deploying and maintaining multiple ORDAO instances in production. Different concerns prompted different project structures.

### Repository Structure

```
orfrapps/                       # sim31/orfrapps — production deployment
├── fractals/                   # Per-community configurations
│   ├── zaof/                   # ZAO Fractal config
│   │   ├── frapp.json          # Public config (committed)
│   │   └── frapp.local.json    # Secrets (gitignored)
│   ├── ef2/                    # Eden Fractal
│   └── of/                     # Optimism Fractal
├── ordao/                      # Git submodule → sim31/ordao
├── src/                        # CLI implementation
├── docs/                       # 5 documentation files
│   ├── CLI_REFERENCE.md
│   ├── CONFIGURATION.md
│   ├── WALKTHROUGH_CONFIGURE.md
│   ├── WALKTHROUGH_DEPLOY.md
│   └── MULTIPLE_DEPLOYMENTS.md
└── dist/                       # Generated: proc/, sites/, deployments/
```

### CLI Reference (9 Commands)

| Command | Purpose | Key Flags |
|---------|---------|-----------|
| `orfrapps contracts <id>` | Deploy smart contracts | `-b` build, `-d` deploy, `-v` verify, `-a` all |
| `orfrapps ornode <id>` | Configure + build ornode backend | `-c` config, `-s` nginx, `-p` PM2, `-a` all |
| `orfrapps gui <id>` | Build web frontend | `-c` config, `-b` build, `-s` nginx, `-a` all |
| `orfrapps ornode-sync <from> <to>` | Sync blockchain events to DB | `-s` step range (default 8000) |
| `orfrapps ornode-backup` | MongoDB backup via mongodump | Requires `BACKUP_DIR`, `MONGO_DUMP_URI` env vars |
| `orfrapps check-awards` | Verify on-chain/off-chain Respect consistency | `-f` from block, `-t` to block |
| `orfrapps rsplits` | Generate Respect distribution CSV for splits contracts | `-c` output CSV |
| `orfrapps parent-deploy <id> <net>` | Deploy parent fractal Respect | Networks: optimism, base, opSepolia, baseSepolia |
| `orfrapps orclient-docs` | Build orclient API docs site | `-a` all |

### Configuration System

**`frapp.json`** (public, committed):

| Field | Example | Purpose |
|-------|---------|---------|
| `id` | `"zaof"` | 2-12 char identifier |
| `fullName` | `"ZAO Fractal"` | Display name |
| `frappsSubdomains` | `["zao"]` | Domain routing → zao.frapps.xyz |
| `deploymentCfg.network` | `"optimism"` | Target chain |
| `deploymentCfg.oldRespectAddr` | `"0x34cE..."` | Parent ERC-20 Respect token |
| `deploymentCfg.votePeriod` | `259200` | 3 days in seconds |
| `deploymentCfg.vetoPeriod` | `259200` | 3 days in seconds |
| `deploymentCfg.voteThreshold` | `1000` | Min Respect for YES eligibility |
| `deploymentCfg.maxLiveYesVotes` | `10` | Anti-spam limit |
| `app.defBreakoutType` | `"respectBreakout"` | or `"respectBreakoutX2"` |
| `app.startPeriodNum` | `0` | First period number |

**`frapp.local.json`** (secrets, gitignored):

| Field | Purpose |
|-------|---------|
| `providerUrl` | RPC endpoint (Alchemy/Infura) |
| `privyAppId` | Privy auth service ID |
| `mongoCfg.url` | MongoDB connection string |
| `mongoCfg.dbName` | Database name |
| `ornode.host` | Default: `"localhost"` |
| `ornode.port` | Default: `8090` |

All configs validated via Zod schemas — invalid configs fail at CLI command time.

---

## Deployment Walkthrough (11 Steps)

1. `git clone` + `npm run init` + `source ./orfrapps-alias`
2. Create `.env` with RPC URLs + deployer private key
3. `orfrapps contracts <id> -a` — deploys OREC + Respect1155 (1-5 min)
4. Create `frapp.local.json` with provider, Privy, MongoDB credentials
5. `orfrapps ornode <id> -a --domain <domain>` — builds + configures ornode
6. Copy nginx configs → `/etc/nginx/sites-available/`, symlink, reload
7. DNS A records for subdomains
8. `sudo certbot --nginx -d <subdomain>.<domain>` — SSL
9. `npx pm2 start dist/proc/<id>/ornode.pm2.json` — start ornode
10. `orfrapps gui <id> -a --domain <domain>` — build + deploy frontend
11. Verify at `https://<subdomain>.<domain>`

Infrastructure requirements: Linux server, nginx, Node.js 18+, MongoDB, PM2.

---

## Comparison: ZAO OS Integration Options

| Approach | Effort | Benefit | Risk |
|----------|--------|---------|------|
| **Keep current `src/lib/ordao/client.ts`** (raw viem) | 0 hrs | Already works, reads proposals + balances | Duplicates orclient logic, doesn't handle ornode proposal content |
| **Replace with `orclient` library** | 8-12 hrs | Full proposal lifecycle (create/vote/execute), auto-handles on-chain/off-chain split | Adds ethers.js dependency (orclient uses ethers, ZAO uses viem) |
| **Hybrid: keep viem for reads, add orclient for writes** | 4-6 hrs | Best of both — lightweight reads + full write support | Two blockchain client patterns in one codebase |
| **Build custom orclient wrapper with viem** | 16-20 hrs | Clean integration with ZAO's existing viem stack | High effort, fragile to upstream orclient changes |

**Best option for ZAO OS:** Hybrid approach. Keep the existing `src/lib/ordao/client.ts` for read-only operations (it works and is lightweight), but integrate `orclient` for write operations when building the in-app proposal creation/voting UI. The ethers.js dependency is only needed server-side.

---

## ZAO OS Integration

### What's Already Built

- `src/lib/ordao/client.ts` — Direct on-chain reader using viem, reads OREC proposals + Respect balances on Optimism
- `src/app/api/fractals/proposals/route.ts` — API route serving proposal data
- `src/app/api/fractals/member/[wallet]/route.ts` — Per-member fractal data
- `src/app/api/fractals/analytics/route.ts` — Fractal analytics
- `src/app/api/fractals/sessions/route.ts` — Session history
- `src/app/(auth)/fractals/` — Full fractals UI (Sessions, Proposals, Analytics, About, Leaderboard tabs)
- Contract addresses: OREC at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`, ZOR at `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`

### What's Not Built Yet

- In-app proposal creation (currently done at zao.frapps.xyz)
- In-app voting on OREC proposals
- Breakout result submission from within ZAO OS
- Respect distribution execution trigger
- `orclient` integration for write operations

### Key Files to Modify for Deeper Integration

| File | Change |
|------|--------|
| `src/lib/ordao/client.ts` | Add orclient for write operations alongside existing viem reads |
| `src/app/api/fractals/proposals/route.ts` | Add POST handler for creating proposals via orclient |
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Add vote/execute buttons |
| `community.config.ts` | Add ORDAO config section (ornode URL, frapp ID, periods) |
| `package.json` | Add `@ordao/orclient` + `@ordao/ortypes` dependencies |

---

## Tadas's Caveats (From Eden Fractal Telegram, Feb 12 2026)

1. **ORFrapps docs are deployment/maintenance only** — ORDAO repo codebase docs still need updating
2. **Docs are AI-generated** with small manual edits — reviewed and accurate but don't follow console commands blindly
3. **Tooling is not user-friendly** — built for Tadas to manage infrastructure, not for easy self-deployment by anyone
4. **GPL-3.0 license** on orfrapps — all modifications must remain open source

---

## Sources

- [sim31/ordao](https://github.com/sim31/ordao) — ORDAO core monorepo (TypeScript 93.6%, Solidity 5.6%)
- [sim31/orfrapps](https://github.com/sim31/orfrapps) — Deployment tooling + configs (TypeScript 54.5%, Solidity 45.3%)
- [ORFrapps CLI Reference](https://github.com/sim31/orfrapps/blob/main/docs/CLI_REFERENCE.md)
- [ORFrapps Configuration Reference](https://github.com/sim31/orfrapps/blob/main/docs/CONFIGURATION.md)
- [ORFrapps Deployment Walkthrough](https://github.com/sim31/orfrapps/blob/main/docs/WALKTHROUGH_DEPLOY.md)
- [ORFrapps Configuration Walkthrough](https://github.com/sim31/orfrapps/blob/main/docs/WALKTHROUGH_CONFIGURE.md)
- [orclient API Docs](https://orclient-docs.frapps.xyz)
- [Eden Fractal Telegram — Tadas's announcement](https://t.me/edenfractal/1/6225)
- [ZAO Fractal on frapps.xyz](https://zao.frapps.xyz)
- [Doc 56 — ORDAO & Respect Game System](../056-ordao-respect-system/)
- [Doc 184 — Superchain ORDAO Cross-Chain Fractal](../184-superchain-ordao-crosschain-fractal/)
