# ZAO OS — Project Memory

> Durable project-level context checked into the repo. Agents + future sessions load this for fast onboarding.
> Not user-scoped. Not session-scoped. Pure architectural + strategic context.
> Last updated: 2026-04-20

---

## What ZAO OS Is

Gated Farcaster social client for **The ZAO** (ZTalent Artist Organization) — decentralized music community on Base chain. 300+ API routes, 279 components, 19 hooks, 240+ research docs.

## Stack

Next.js 16 (Turbopack) + React 19 + Supabase (RLS) + Neynar + XMTP + Stream.io + Wagmi/Viem + Tailwind v4 + iron-session.

## The Four Pillars

1. **Artist Org** — ZTalent showcase, music distribution, rights
2. **Autonomous Org** — VAULT/BANKER/DEALER trading agents, Fractal governance
3. **Operating System** — Farcaster client, Spaces, XMTP messaging, stream audio
4. **Open Source** — Fork-friendly, MIT-licensed patterns, doc-heavy

## Stack Boundaries (hard rules)

- Server-only env vars: `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`. Never exposed to browser.
- All user input: Zod `safeParse` before processing.
- Supabase RLS on every table. Service role = server-side only.
- XMTP keys = app-specific burner keys, never personal wallet keys.
- No `dangerouslySetInnerHTML`.
- Say "Farcaster" not "Warpcast".
- Mobile-first, desktop as enhancement. Dark theme: navy `#0a1628`, gold `#f5a623`.

## Project Map

| Dir | What |
|-----|------|
| `src/app/api/` | 301 route handlers across 54 domains |
| `src/components/` | 279 components by feature |
| `src/hooks/` | 19 custom hooks |
| `src/lib/agents/` | VAULT/BANKER/DEALER autonomous trading bots |
| `src/lib/publish/` | Cross-platform posting (Farcaster/X/Bluesky) |
| `src/lib/db/supabase.ts` | Supabase client |
| `src/lib/auth/session.ts` | iron-session config |
| `src/middleware.ts` | Rate limiting + CORS |
| `community.config.ts` | Branding, channels, admin FIDs, contracts, nav |
| `contracts/` | Solidity (staking, bounty board) |
| `scripts/` | SQL migrations, wallet gen, webhook setup |
| `research/` | 240+ research docs (grep `research/*/README.md`) |
| `evals/` | Eval fixtures for probabilistic flows (VAULT/BANKER/DEALER/ZOE) |

## Agents in the Ecosystem

| Agent | Runs Where | Role |
|-------|-----------|------|
| VAULT | `src/lib/agents/` | Token strategy, safe holds |
| BANKER | `src/lib/agents/` | PnL optimization, trade execution |
| DEALER | `src/lib/agents/` | Market-making, liquidity |
| ZOE | VPS 1 (Hostinger) | Concierge, onboarding, email triage |
| ZOEY | VPS 1 | Sub-agent of ZOE |
| WALLET | VPS 1 | Wallet/signer operations |
| ROLO | VPS 1 | Rolodex / relationship manager |
| ZAAL ASSISTANT | VPS 2 (DigitalOcean) | Personal productivity |
| Composio AO | BetterCallZaal local | Agent orchestrator pilot |

## Key External Infrastructure

- **VPS 1** (Hostinger KVM 2, Docker): ZOE + agent squad, OpenClaw, Paperclip at paperclip.zaoos.com
- **VPS 2** (DigitalOcean 2GB/25GB): ZAAL ASSISTANT (fresh build planned)
- **Vercel**: main web deploy
- **Supabase**: primary DB + auth, RLS enforced
- **Neynar**: Farcaster API (writes + reads)
- **Base chain**: ZABAL token, staking, bounty board
- **Cloudflare tunnel `zao-agents`**: routes paperclip + future agent UIs

## Canonical Research Entry Points

Grep `research/{topic}/README.md` indexes before bulk reads.

| Doc | Topic |
|-----|-------|
| 154 | Skills/commands master reference |
| 232 | MCP server development guide |
| 238 | Claude Tools Top 50 evaluation |
| 365 | Recoupable monorepo + best practices |
| 366 | AGENTS.md monorepo patterns 2026 |
| 367 | Biome migration + shared UI extraction |
| 411 | AI-native engineering team model |
| 414 | AI-native documentation patterns |
| 415 | Composio Agent Orchestrator pilot |
| 422 | Claude Routines → ZAO automation stack |
| 424 | Nested CLAUDE.md + Claudesidian patterns |
| 441 | ECC integration research + plan |
| 442 | ECC top picks ranking |
| 448 | ECC skills teaching guide |

## Claude Code Setup (post 2026-04-20 Path B)

- **Plugins**: everything-claude-code, superpowers, caveman, oh-my-mermaid
- **MCPs**: context7, playwright, grep (app), notion, Gmail, Calendar, Drive + ECC-bundled (github, memory, sequential-thinking, exa)
- **Subagent model**: `haiku` (via `CLAUDE_CODE_SUBAGENT_MODEL`)
- **ECC hooks disabled**: `pre:edit-write:gateguard-fact-force`, `pre:bash:dispatcher` (too aggressive for daily flow)
- **Active ECC skills**: 20 of 183 (see settings.json `skillOverrides`). Keep list: continuous-learning-v2, verification-loop, security-review, eval-harness, nextjs-turbopack, postgres-patterns, database-migrations, hookify-rules, agent-introspection-debugging, skill-stocktake, gateguard, rules-distill, architecture-decision-records, prompt-optimizer, canary-watch, deployment-patterns, mcp-server-patterns, content-hash-cache-pattern, strategic-compact, continuous-learning
- **Custom ZAO skills**: 30+ (see `research/dev-workflows/154-skills-commands-master-reference/`)

## Workflow Commands (quick ref)

- `/worksession` — create branch + work isolation (run at session start)
- `/morning` — daily kickoff ritual
- `/z` — status dashboard
- `/ship` — deploy workflow (runs tests, pushes, creates PR)
- `/qa` — QA test + fix loop
- `/review` — pre-landing PR review
- `/investigate` — root-cause debugging
- `/zao-research` — research library workflow
- `/learn` (ECC) — extract patterns from session (end of day)
- `/harness-audit` (ECC) — score repo harness quality
- `/checkpoint` + `/verify` (ECC) — verification checkpoints
- `/loop` — recurring task runner
- `/reflect` — end-of-day journaling

## Style & Voice

- Say "Farcaster" not "Warpcast".
- Never use emojis (per global CLAUDE.md).
- Never use em dashes — hyphens only.
- Document build steps (build-in-public).
- Never generate personal wallet keys interactively.
- Exact name spellings (The ZAO, WaveWarZ, COC Concertz, BetterCallZaal, Joseph Goats, Huöttöja, SongJam, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Stilo World, Tom Fellenz, Th Revolution, ArDrive).

## Active Decisions (2026)

- **Path B ECC plugin install** (2026-04-20) — use full plugin, filter via skillOverrides instead of cherry-pick.
- **No Redux/Zustand** — React hooks + react-query only.
- **No CSS modules / inline styles** — Tailwind v4 only.
- **Wallet-only auth progression**: ZAO holders first, then Farcaster for posting, then XMTP for messaging.
- **Agent squad runs on VPS** not serverless (stateful, long-lived processes).
- **FISHBOWLZ paused 2026-04-16** — partnering with Juke instead.

## References to Other Memory Systems

- **User auto-memory**: `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` (user-scoped, not checked in). Includes user preferences, feedback rules, active project state. Both sources should stay in sync on structural decisions.
- **CLAUDE.md** (project root): day-to-day instructions Claude must follow. This file (`.claude/memory.md`) = architecture + context. CLAUDE.md = behavior.

## Open TODOs (high-level)

- ENS subnames: code complete, needs on-chain setup session with wallet
- Fractal integration: reconcile OG+ZOR ledgers, OREC submission pipeline
- Spaces: DJ mode fix, screen share, themes, Restream OAuth
- ZAO Stock event: Oct 3 2026, Franklin St Parklet, Ellsworth
- QA coverage: 248 tests across 15 areas, 0/248 manually verified
- VPS 2 (ZAAL ASSISTANT): fresh rebuild planned
- Evals: scaffold 1 fixture per agent (VAULT/BANKER/DEALER/ZOE)

## How to Update This File

Add an ADR under `docs/adr/` for architectural decisions. Summarize the outcome here in ≤2 lines under "Active Decisions". Keep this file skimmable — target under 200 lines.
