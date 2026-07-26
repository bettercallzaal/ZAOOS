---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-26
superseded-by:
related-docs:
original-query: "/zao-research https://github.com/shriyashsoni?tab=repositories - see if there's anything we can take from that (Shriyash Soni, ZABAL Games mentor)."
tier: STANDARD
---

# 2085 - Shriyash Soni: what ZAO can take from his repos

> **Goal:** Scan ZABAL Games mentor Shriyash Soni's GitHub for patterns, stacks, or code ZAO can actually adopt - and name the few worth acting on vs. the noise.

## Key Decisions (recommendations first)

1. **Steal the pattern, not the repo: AI-sentiment -> on-chain execution (Narrative-Forge).** The reusable shape is external-data -> LLM inference -> signed on-chain tx (Gemini 1.5 Flash -> Wagmi/Viem). ZAO's version: an artist/creator signal -> auto-allocate rewards or update a creator index. This is the single most ZAO-aligned thing in his repos and maps onto the ZOL score + treasury work we already have.
2. **Adopt the dashboard-analytics UI pattern (YieldMind) for ZAO Devz / creator tiers.** Risk/tier cards -> per-tier aggregated activity -> 7-day sparklines, on TanStack Query v5. Directly reusable for the ZAO Devz dashboard, creator contribution tiers (Solo/Band/Collective), and ZABAL Games cohort analytics. Lowest-effort, highest-fit adoption.
3. **File FHE-for-private-reputation (ConfidentialCredit / Fhenix) as a "someday" R&D flag, not now.** A "Creator Loan Protocol" that scores a creator on on-chain history without exposing income is thesis-aligned but heavy (FHE is early, adds a new chain + protocol dep). Park it as a known option, do not build.
4. **Do NOT switch to Convex.** Shriyash builds fast on Convex (zero-infra serverless). ZAO runs Supabase + iron-session + RLS deliberately (more control, our whole security model depends on it). Convex trades that control for speed - wrong trade for us. Note it exists; keep Supabase.
5. **The bigger opportunity is the person, not the code.** He's a 19-yo who ships real deployed protocols across 10+ chains and already scaled a 20k-dev community (Apna Coding) - and he's already a ZABAL Games mentor. The highest-value move is deepening that relationship (co-develop creator education / a ZABAL build), not lifting a repo.

## Findings

### Who he is

Shriyash Soni (19, Jabalpur, India) - full-stack engineer + founder at the AI x blockchain intersection. Junior SWE @ Biz First AI, GSoC 2026 mentor @ OWASP, founder of Apna Coding (20,000+ devs) and Apna Counsellor (AI EdTech). StartMIT scholar, Harvard Alumni Entrepreneurs scholar, YC VibeCon top 30 of 25,000. Ships **real deployed contracts** (not toys) across Solana, Polygon, Ethereum, Stellar, Celo, Flow, Algorand, Aleo. Pattern: infrastructure-first (build the protocol) then wrap it in polished UI (Next.js / React 19 / Shadcn / Framer Motion). Already a ZABAL Games mentor in ZAO's orbit.

### Repos (most relevant to ZAO)

| Repo | Stack | Stars | What it is | Adopt? |
|------|-------|-------|-----------|--------|
| Narrative-Forge | React 18 + FastAPI, Gemini 1.5 Flash, Wagmi | 0 | AI sentiment -> on-chain oracle/execution (Sepolia + L2) | Pattern - yes |
| YieldMind (Polygon) | React/TS/Solidity, TanStack Query v5 | 3 | AI DeFi yield optimizer, 3-tier vaults + per-vault 7-day analytics | UI pattern - yes |
| ConfidentialCredit | Next.js 16 + Solidity, Fhenix FHE | 0 | Privacy-preserving undercollateralized lending (blind credit scoring) | R&D flag only |
| AnchorVault | TS + Soroban/Rust, Stellar Mainnet | 1 | Remittance liquidity pools; LPs fund off-ramp settlement | Only if cross-border payouts |
| Brixs | Vite + React 19 + Tailwind v4 + Convex | 0 | AI smart-contract automation; 80% faster deploy | Note Convex, don't adopt |
| OpenHire | JS + Convex | 0 | OSS ATS / career portal, real-time sync | Not relevant |

Numbers: most repos are recent (updated 2026), low-star (they're founder projects, not community libs) - so the value is in the **patterns + the builder**, not battle-tested OSS. That is the honest read: nothing here is a drop-in library; several are worth studying.

### The one thing that maps cleanest onto ZAO

Narrative-Forge's AI -> on-chain loop is the same shape ZAO would use to turn a creator signal (a trending cast, a WaveWarZ result, a ZOL reputation change) into an automated action (reward allocation, index update). ZAO already has the pieces (Wagmi/Viem, the agent stack, ZOL scores); his repo is a working reference for wiring LLM inference into a signed transaction with a human-gated approval. Study it before building any "signal -> on-chain" automation.

## Also See

- ZABAL Games mentor context (Shriyash is on the mentor list) - `research/` ZABAL Games program docs.
- [Doc 1098](../1098-sparkz-configurable-ai-advisor/) - Sparkz (creator-coin + AI advisor); the AI->onchain pattern above informs the advisor's action layer.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Bookmark Narrative-Forge as the reference when building any ZAO "creator signal -> on-chain action" automation; link it in the Sparkz/ZOL action-layer notes | @Zaal | Doc link | 2026-08-15 |
| Apply the YieldMind tier-cards + 7-day-sparkline pattern to the ZAO Devz dashboard when that page is next touched (thezao.xyz/zaal dashboard task) | @Zaal | PR (when dashboard built) | 2026-08-22 |
| Raise co-developing creator education / a ZABAL build with Shriyash at the next mentor touchpoint (he scaled Apna Coding to 20k devs) | @Zaal | Outreach | 2026-08-08 |
| Leave FHE-private-reputation + Stellar-payouts as parked R&D flags - revisit only if a creator-lending or cross-border-payout need becomes concrete | @Zaal | wontfix (revisit-on-need) | wontfix |

## Sources

- [GitHub profile + README](https://github.com/shriyashsoni) [FULL]
- [Narrative-Forge](https://github.com/shriyashsoni/Narrative-Forge) + live https://narrative-forge-1nah.vercel.app [FULL]
- [AnchorVault](https://github.com/shriyashsoni/anchorvault) + live https://anchorvault.xyz [FULL]
- [Brixs](https://github.com/shriyashsoni/brixs) [PARTIAL - README only]
- [YieldMind on Polygon](https://github.com/shriyashsoni/yield-mind-on-polygon) [PARTIAL - README only]
- [ConfidentialCredit](https://github.com/shriyashsoni/CONFIDENTIALCREDIT) [PARTIAL - README only]
- [OpenHire](https://github.com/shriyashsoni/OpenHire) [PARTIAL - README only]
- Apna Coding / Apna Counsellor [FAILED - private/not on GitHub, referenced in profile]
