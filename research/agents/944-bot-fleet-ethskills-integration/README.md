---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-03
superseded-by:
related-docs: 339, 899, 601, 143, 942, 890, 911
original-query: "do more research on the bots and how we are set up now with the eth skills things"
tier: STANDARD
---

# 944 - The ZAO Bot Fleet + ETHSkills: how we are set up now, and where ETHSkills plugs in

> **Goal:** One current-state read of the ZAO bot fleet (grounded in the verified doc-899 audit + `bot/src/`), plus what ETHSkills is today and exactly where it should plug into our setup. The short version: our fleet is off-chain and LLM-brained; ETHSkills matters the moment a bot does an on-chain write (deploying a Split, minting the manifesto Hat, submitting to OREC), which is exactly what the whitepaper work now needs.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install ETHSkills for onchain-touching agents** | USE the ETHSkills Claude Code plugin (`/plugin marketplace add austintgriffith/ethskills` then `/plugin install ethskills@ethskills`). Our bots run on Claude Code, so this is a one-line install, not a build. |
| **When to fetch it** | Any agent about to write on-chain (Splits deploy, Hats manifesto mint, OREC submit, token calls) fetches the relevant ETHSkills file first (e.g. `ethskills.com/security/SKILL.md`, `/contract-addresses/SKILL.md`) so it does not ship stale-training Solidity. |
| **Adopt the pattern, not just the source** | ETHSkills IS the pattern ZAO already half-uses (`zabal-games-context` skill). Keep a ZAO-specific onchain-context skill (our verified addresses: Respect on Optimism, ZABAL/SANG on Base) alongside ETHSkills for generic EVM knowledge. |
| **Do NOT revive trading agents to consume it** | Doc 339 aimed ETHSkills at VAULT/BANKER/DEALER trading agents. Those are paused/killed (doc 601). The real ETHSkills consumer now is the whitepaper on-chain work, not autonomous trading. |
| **Scope it to real onchain work** | Most of the fleet (ZOE, ZOL, devz, hermes) is off-chain (Telegram/Farcaster/research/PR). Do not bolt ETHSkills onto bots that never touch a chain. |

## How we are set up now (verified, doc 899 + `bot/src/`)

The fleet is a **ZOE-as-hub** model, off-chain and LLM-brained. Verified against live code and the VPS in doc 899 (2026-06-25), not from stale docs.

| Surface | What it is | Where | On-chain? |
|---------|-----------|-------|-----------|
| **ZOE** (`@zaoclaw_bot`) | The orchestrator/hub. Built + deployed: `decompose.ts`, `dispatch.ts` + `workers.ts` + 8 worker defs, `critics/` (research/comms/task-result), `reflexion.ts`, `learn.ts`, `approvals.ts` (the propose -> y/n -> execute autonomy gate), `call-budget.ts`, 21 test files | `bot/src/zoe/` on VPS 31.97.148.88 | No (concierge + fix-PR pipeline) |
| **ZOL** (`@zolbot`, FID 3338501) | Farcaster agent, Fable-brained. Free self-signed casting via Snapchain signer | Pi (zaal@ansuz), `~/zol/farcaster-agent/` | Reads/writes Farcaster, not EVM |
| **ZAO Devz** (`@zaodevz_bot`) | Group dispatch + hourly learning tip | `bot/src/devz/` | No |
| **Hermes** (reused BY ZOE) | Coder/critic/auto-PR modules, folded into ZOE (not a separate bot) | `bot/src/hermes/` | No (GitHub PRs) |
| **fleet-agent / ecosystem-monitor** | One pulse on code + fleet + social (PR #969) | `bot/src/fleet-agent/` | No |
| **ZAOstock bot** (`@ZAOstockTeamBot`) | Festival team coordination | `bot/` root | No |
| **Bonfire** (`@zabal_bonfire`) | Knowledge-graph recall + ingest | bonfires.ai (external) | No |

**The point:** every live surface is off-chain. They research, dispatch, post, PR, and recall. None of them currently deploy contracts or move tokens. That is by design after doc 601 killed the openclaw squad and the autonomous trading agents.

## What ETHSkills is now (2026-07-03, re-fetched)

ETHSkills (Austin Griffith / BuidlGuidl, MIT, ethskills.com + github.com/austintgriffith/ethskills) is a **knowledge-reference-for-AI-agents**: markdown skill files an agent fetches into context before shipping on-chain, so it does not produce confident-but-wrong Solidity from stale training data. "Give any URL to your AI agent, it reads it and instantly corrects its Ethereum knowledge."

- **15 skill files** (README, 2026-07-03): Why Ethereum, Gas & Costs, Wallets, Layer 2s, Standards (ERC-8004, EIP-7702, EIP-3009), Tools (x402, Blockscout MCP), Money Legos (Uniswap V4), Orchestration (SE2 three-phase), Contract Addresses, Concepts, Security, Frontend UX, Frontend Playbook, Indexing, Protocol. (Doc 339 cited "19 files" in April 2026 - the set was reorganized; treat 339's specific count as stale, its *patterns* still hold.)
- **Consumption:** fetch `ethskills.com/SKILL.md` (the top-level index/TOC) or a topic file like `ethskills.com/gas/SKILL.md` directly into agent context.
- **Claude Code plugin (the key upgrade):** `/plugin marketplace add austintgriffith/ethskills` then `/plugin install ethskills@ethskills`. No clone. Since ZOE and the ZAO agents run on Claude Code, this installs the whole knowledge base into the same harness our bots use.

The concrete corrections it carries (from doc 339, still the canonical capture): gas is fractions of a gwei not 30; Aerodrome is the #1 DEX on Base not Uniswap; use viem not ethers.js; Foundry not Hardhat; Permit2 for approvals; plus verified Base addresses (USDC, WETH, routers, Permit2, ZABAL `0xbB48...0b07`, SANG `0x4ff4...6741`).

## Where ETHSkills actually plugs into OUR setup

The fleet is off-chain today, so ETHSkills is not needed for the concierge/social/PR loops. It becomes load-bearing exactly where the recent whitepaper work points the fleet on-chain:

1. **Minting the manifesto Hat (whitepaper, doc 942).** Signing the manifesto = minting a Hats Protocol hat. Whatever agent or script builds that flow needs correct Hats + EIP-7702/Safe knowledge - an ETHSkills `wallets` / `standards` fetch prevents a stale-training mistake on Hats tree 226. (On-chain writes stay human-gated per the whitepaper.)
2. **Deploying Splits (doc 143).** The two split templates (solo ~100% + transparent collaboration) are on-chain deploys. An agent scaffolding `src/lib/music/splits.ts` or a deploy script should fetch ETHSkills `contract-addresses` + `security` (token decimals, approvals) first. Splits' own no-protocol-fee fact is the profit leg of the whitepaper.
3. **OREC submits (governance).** The "gas-free relayer submit button" (doc 941/942) is on-chain work on Optimism. ETHSkills L2 + gas + wallets skills apply.
4. **Any ZABAL Gamez builder agent.** Builders vibe-coding on-chain for the build-a-thon are the widest ETHSkills audience - point them at the plugin. This is the same pattern as our `zabal-games-context` skill; ETHSkills is the generic-EVM half, ours is the ZAO-specific half.

**The clean division:** ETHSkills = generic, current EVM knowledge (gas, DEXes, standards, addresses). A ZAO onchain-context skill = our specifics (Respect OG/ZOR/OREC on Optimism, ZABAL/SANG on Base, WaveWarZ on Solana, the whitepaper's chain map). An onchain-touching agent fetches both.

## Honest notes

- **Nothing here says re-arm trading.** Doc 339 framed ETHSkills for autonomous trading agents (VAULT/BANKER/DEALER). Those are decommissioned (doc 601). Do not read this doc as a reason to revive them.
- **The count moved.** 339's "19 skill files" is stale; the README lists 15 today. The patterns and address tables in 339 are still the best ZAO-side capture - re-verify any address before an on-chain write.
- **Verify before writing on-chain.** ETHSkills reduces stale-training errors; it does not replace reading the live contract. Confirm addresses/ABIs against the explorer at execution time (as we did confirming Respect OG is live on Optimism).

## Also See

- [Doc 899](../899-zoe-agent-fleet-audit/) - the verified current fleet architecture (this doc's "how we are set up now" source)
- [Doc 339](../339-austin-griffith-clawd-ethskills-agent-patterns/) - the CANONICAL ETHSkills + CLAWD capture (patterns, corrections, Base addresses)
- [Doc 601](../601-agent-stack-cleanup-decision/) - why the trading agents / openclaw squad are killed (do not revive)
- [Doc 143](../../music/143-0xsplits-revenue-distribution/) - Splits (an on-chain deploy where ETHSkills applies)
- [Doc 942](../../governance/942-zao-fractal-whitepaper-outline-v2/) - the whitepaper (manifesto Hat + OREC = the onchain needs)
- [Doc 890](../890-zoe-improvements-reliability-memory-routing/), [Doc 911](../911-bot-per-codebase-ecosystem-monitor/) - fleet direction

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install the ETHSkills Claude Code plugin in the ZOE/agent harness | @Zaal | Config | Before any onchain-write agent work |
| Write a ZAO onchain-context skill (our verified addresses + chain map) to pair with ETHSkills | @Claude | Skill | With whitepaper v1.0 onchain flows |
| Have the manifesto-Hat + Splits-deploy flows fetch ETHSkills (wallets/standards/security) before writing | @Zaal | Build | When the whitepaper onchain work starts |
| Point ZABAL Gamez builders at ethskills.com + the plugin | @Zaal | Context | Ongoing |

## Sources

- [ethskills.com](https://ethskills.com/) [FULL - fetched 2026-07-03: agent knowledge-reference model, 24+ topic areas]
- [github.com/austintgriffith/ethskills](https://github.com/austintgriffith/ethskills) [FULL - fetched 2026-07-03: 15 skill files listed, SKILL.md index, Claude Code plugin install]
- Doc 899 (ZOE Agent-Fleet Architecture Audit, DEEP, 2026-06-25) [FULL - internal, verified against live code + VPS]
- Doc 339 (Austin Griffith CLAWD & ETHSkills patterns, CANONICAL) [FULL - internal]
- `bot/src/` (zoe, zol, devz, hermes, fleet-agent) [FULL - live code, this repo]
- CLAUDE.md Primary Surfaces (the 5 live surfaces + decommission list) [FULL - internal]
