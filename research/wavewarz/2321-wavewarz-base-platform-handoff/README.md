---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "2320, 2374"
original-query: "WW Base handoff (onenote/todo/ww-base.md, 681L) -> ZAOOS research doc (organizer lane queued item, 2026-08-18). Source: Samantha (Candy / @candytoybox) full platform audit dated April 9, 2026."
tier: STANDARD
---

# 2321 - WaveWarZ Base Platform: the Candy Handoff (April 2026 audit, ingested)

> **Goal:** Land Samantha (Candy / @candytoybox)'s complete WaveWarZ Base handoff - contracts, deployments, trading brain, access checklist - in the research library so the mainnet co-build has a citable baseline. PUBLIC-REPO REDACTED: wallet addresses and the Supabase project ref live only in the private vault mirror (`~/zao-vault/onenote/todo/ww-base.md`), per the source doc's own instruction.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Where the full unredacted handoff lives | **Private vault mirror `~/zao-vault/onenote/todo/ww-base.md` (681 lines) + raw at `~/.zao/private/onenote-sweep/`** | ZAOOS is a public repo; the source doc says "do not commit this file to a public repo without redacting wallet addresses". This doc carries the architecture + status; the wallet/env tables stay private. |
| What WaveWarZ Base is | **The agentic WaveWarZ: AI agents battle on Base L2 with the same bonding-curve mechanics as WaveWarZ Solana** | Prove mechanics with agents on testnet -> mainnet -> connect real artist profiles. WaveWarZ Solana stays the live-artist production platform. |
| Zaal's role | **Internal + External Communications: mainnet deployment strategy, agent battle choreography design, product roadmap co-ownership, partnerships** | Stated in the handoff's onboarding section. Access checklist (GitHub org, Vercel, Railway, Supabase, CDP) is step 0 - none of it verified granted as of 2026-08-18. |
| Credential handling | **CDP keys via portal invite (Option A) or separate keyset (Option B), never chat/email** | Three CDP env values control all four managed wallets; source: "if lost, wallet access is unrecoverable". One wallet (`0x510B...`) already compromised + retired March 2026 - treat the platform as having live threat history. |

## Findings (inventory as of the April 9, 2026 audit)

### Contracts - Base Sepolia testnet (chain 84532), Foundry, Solidity 0.8.28
Three contracts deployed Feb 21, 2026, verified on Basescan (public infrastructure, safe to cite):
- `WaveWarzBase` `0xa4B10AF81E3ED591A5d5b1D621bB6B76C9D4CA43` - battle lifecycle, EphemeralBattleToken, fee distribution (22.7 KB source)
- `WaveWarzMusicNFT` `0x813c13d534660E85E37ee71bd3595724FC9D782A` - ERC-721 artist certificates
- `WaveWarzMarketplace` `0x227a3B842d8692a5bB961395f301Eff83B0499F5` - bonding curve trading
Mainnet: NOT deployed - the next milestone.

### Wallets
- 3 Coinbase CDP managed agent wallets (nova / wavex / lil-lob roles: Artist A + deployer, Artist B + trader, Platform + trader), testnet-funded. Addresses in the vault mirror.
- 1 Base-mainnet trading executor wallet (~$10-35 USDC live) + 1 Solana executor wallet (0.5 SOL minimum). Addresses/keys in the vault mirror + Vercel/Railway env vaults.
- 1 RETIRED compromised wallet (March 2026) - never reuse.
- Credentials: Vercel env vault + PassFX (Samantha) + Railway service env. Names-only documented; `CREDENTIALS_GUIDE.md` in the repo is the walkthrough.

### Repos (github.com/CandyToyBox org)
`wavewarz-base` (contracts + frontend + backend), `trading-system` (AI brain + executors), `wavewarz-clips-hq` (Telegram content pipeline), `wavewarz-merch-shop` (e-commerce, in development).

### Deployments
- Vercel: frontend (Next.js 14.1.0 + OnchainKit 0.35.0 + Wagmi 2.5.0, broadcast-terminal aesthetic, 5 pages, WebSocket real-time), trading brain (Python/FastAPI), clips-hq, analytics-v2 (React/Vite), merch shop.
- Railway: backend (Fastify 4.25.0, port 3001), executor-base (Express 5.2.1, 0x Protocol v2), executor-solana (Express 5.2.1, Jupiter v6).
- Supabase: 8 tables across two clusters - trading (`trades`, `agent_status`, `market_snapshot`, `agent_portfolio`) and battles (`base_battles`, `base_trades`, `base_agents`, `base_leaderboard`); 2 migrations in `trading-system/infra/supabase/migrations/`. Project ref in the vault mirror.

### Trading brain loop (live)
GitHub Actions every 5 min -> Brain `/api/trade` (Vercel, Claude for reasoning) -> TradeIntent JSON -> executor (Base via 0x, or Solana via Jupiter) -> TradeResult -> Supabase. Guardrails in env: `CONFIDENCE_THRESHOLD=0.65`, `BASE_TRADE_SIZE_USD=2.0`, `MAX_TRADES_PER_DAY=4`, `MAX_DAILY_LOSS_USD=1.0`, `COOLDOWN_AFTER_LOSS_MINUTES=30`, `MODE=paper|live`.

### x402 payments
`@coinbase/x402` 2.1.0 wired into executor-base on `eip155:8453`: signal $0.02, rebalance $0.50, service $0.10. Integrated, NOT yet monetized.

### Working vs pending (audit's own ledger)
Working (13 items): contracts deployed, 3 CDP wallets funded, frontend/backend/brain/executors all live, Supabase schema, x402 integrated, WebSocket real-time, 5-min scheduler, CDP SDK v2 migration handled.
Pending (8): Base mainnet deploy, x402 monetization live, Suno AI music integration (keys needed), fee-distribution stress test, monitoring/alerting, automated Supabase backups, private-key migration out of .env files, merch shop launch.

### Co-build agenda (from the handoff)
1. Mainnet go-live checklist (define together)
2. Agent battle choreography (initiate/trade/settle programmatically)
3. Postiz-driven social layer broadcasting Base battles
4. x402 route activation timing (before or after mainnet)
5. Real WaveWarZ Solana artist-profile integration

### Repo docs to read first
`wavewarz-base/`: README, DEPLOYMENT-CHECKLIST, COINBASE-CDP-V2-MIGRATION, CREDENTIALS_GUIDE, VERCEL-DEPLOYMENT. `trading-system/`: ENV_FILES_LESSON, SETUP_CHECKLIST, FAST_DEPLOY_CHECKLIST, DEPLOYMENT_GUIDE, `apps/brain-python/30_DAY_ROADMAP.md`.

## Staleness

The audit is dated April 9, 2026 - 4 months old at ingestion. Deploy states, funding levels, and the pending list need re-verification with Samantha before any mainnet planning. This doc records the handoff faithfully; it does NOT claim current state.

## Also See

- [Doc 2320](../../dev-workflows/2320-logging-obsidian-capture-completeness/) - the capture convention this ingestion follows
- Private vault mirror: `~/zao-vault/onenote/todo/ww-base.md` (full wallet/env tables + access checklist)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this doc; shipped = PR merged on main | @Zaal | PR review | 2026-08-21 |
| Run the ZAAL access checklist with Samantha (GitHub org, Vercel, Railway, Supabase, CDP Option A) - shipped = all 6 completion checks in the vault mirror ticked | @Zaal + @Samantha | outreach (Zaal's tap) | 2026-08-28 |
| Re-verify audit state with Samantha (deploys still live? funding? pending list changes since April) - shipped = dated addendum appended to this doc | @Zaal | message + doc update | 2026-08-28 |
| Fold the compromised-wallet history + CDP key locations into the zao-rotate security block context - shipped = line added to handoffs/security-rotation.md | organizer lane | vault edit | 2026-08-19 |

## 2026-08-22 Review Notes

- **Audit age:** 4.5 months old as of this review (April 9 → Aug 22). The re-verification with Samantha (@candytoybox) was due 2026-08-28 — still upcoming. This doc remains the best available baseline until then.
- **Farcaster operator crisis context (doc 2374):** The WaveWarZ miniapp opportunity on Farcaster is MORE urgent given the operator uncertainty, not less. WaveWarZ Bracket Wars (see doc 2374 §WaveWarZ miniapp opportunity) was identified as the fastest ZAO product to ship before ecosystem restructuring. This Base platform (agentic AI battles) is a parallel track; the Farcaster miniapp spec should reference this doc for the Base infrastructure that will back the agent-battle content.
- **x402 integration:** WaveWarZ Base already has `@coinbase/x402` 2.1.0 wired (not yet monetized). The Warpee API also uses x402 (doc 1477). These two stacks share the payment primitive — worth noting for any joint demo.
- **Compromised wallet addendum:** the security-rotation.md brief should mention the retired `0x510B...` wallet. This action was due 2026-08-19; `~/zao-vault/handoffs/security-rotation.md` was NOT found on the Linux machine as of 2026-08-22. Will land with the security rotation block (board 9417).

## Sources

- Samantha (Candy / @candytoybox), "WaveWarz Base Platform - Full Handoff Document" + "Quick Brief for ZAAL" + "ZAAL Access Checklist", April 9, 2026 - [FULL - private vault mirror `~/zao-vault/onenote/todo/ww-base.md`, 681 lines, captured from OneNote 2026-08-18]
- [WaveWarzBase on Basescan (Sepolia)](https://sepolia.basescan.org/address/0xa4B10AF81E3ED591A5d5b1D621bB6B76C9D4CA43) - [PARTIAL - address cited from the handoff; on-chain state not re-verified this session]
