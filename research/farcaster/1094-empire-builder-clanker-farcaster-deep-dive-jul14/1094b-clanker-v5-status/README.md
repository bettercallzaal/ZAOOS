---
topic: farcaster
type: market-research
status: research-complete
last-validated: 2026-07-14
related-docs: 988, 991, 1092, 1094
original-query: "Is Clanker v5 live yet? What changed from v4? Any new droid/agent-attached-to-token functionality? Current market state and any regulatory news. Confirm the fee-split/admin-recipient mechanics Adrian described on the 2026-07-14 call."
tier: STANDARD
---

# 1094b - Clanker v5 status (2026-07-14)

> **Goal:** Confirm whether Clanker v5 is live, what it changes, and validate the fee-split mechanics Adrian (Empire Builder) described in doc 1092 - this directly affects doc 988 (zaalcaster's own token launch plan, which has been explicitly waiting on "v5 timing").

## Key Decisions

| # | Decision | Recommendation | Reasoning |
|---|----------|----------------|-----------|
| 1 | Doc 988's "launch Monday on current Clanker vs wait for v5" open question | v5 is NOT live - launch on current Clanker (v4) if/when Zaal proceeds, do not wait | v5 is still in third-party security audit as of 2026-07-14, no ship date announced. Doc 988's Monday-target framing (written 2026-07-07) predates this confirmation; the "wait for v5" branch of that decision is now moot until an audit-complete announcement appears. |
| 2 | Adrian's fee-split claim from doc 1092 ("Clanker allows you admin rights over the recipient... you decide how many recipients there are at the start") | CONFIRMED accurate, with a specific number | Up to 7 total reward recipients at deployment, each with an independent Admin Address that can override its own Reward Recipient wallet later. Percentages must sum to exactly 100% and are otherwise immutable per-recipient (only the recipient's WALLET can change, not their %). |
| 3 | Should zaalcaster's own token plan (doc 988) assume droid/agent-token functionality is available | NO, not yet - treat as unconfirmed | The "droid ships with your token, own Farcaster account, compute funded by LP fee carve-out" framing is documented at a product level (Clanker's own docs + CMC explainer) but the exact v5-specific changes to it are NOT yet published - Clanker's June 25 audit-announcement post solicited "last minute feature requests," implying scope is still moving. |

## Findings

### Clanker v5: not live, in audit

Confirmed via a direct Clanker post: "sending v5 to audit soon, any last minute feature requests?" (@clanker_world, 2026-06-25). No follow-up ship announcement found as of 2026-07-14. Third-party security audit is the blocking step; no public ETA.

### What's confirmed for v5 vs v4

| Change | Detail | Confidence |
|--------|--------|------------|
| B20 token standard | Base's native precompiled token standard (Rust-based, built-in roles/transfer-policies/supply-caps/pausing/ERC-2612 permit) went live on Base mainnet 2026-06-25 (delayed from an earlier date due to post-Beryl-upgrade consensus issues, actually completed 2026-07-08 per a follow-up report). Clanker v5 is expected to adopt B20 as the default token spec. | CONFIRMED for B20 itself (on Base mainnet); v5's adoption of it is a single community-post claim, not yet in official Clanker docs - treat the Clanker-side half as PARTIAL |
| Droid/agent functionality | Existing product surface (see below), scope of v5-specific changes unconfirmed | PARTIAL |
| Fee/recipient mechanics | No changes documented for v5 - see Key Decision #2 for the current (v4) mechanics, unchanged as of this research | CONFIRMED (v4 baseline), v5 delta UNKNOWN |

### Droid / agent-attached-token feature (current product surface, pre-v5)

A "Droid" is an AI agent deployed WITH a token (not attached after the fact, in the current documented flow): its own Farcaster account, a customizable personality, and compute funded by a carve-out of the token's Uniswap V3 LP fee rewards. Integration is prompt-based: `add clanker skill https://clanker.world/skill/skill.md` added to an agent's own prompt lets that agent deploy and manage tokens autonomously via Farcaster casts. Once live, the Droid becomes the token's Farcaster-facing presence - it can respond to holders, facilitate discussion, and (scope unclear) perform some token-management actions.

**What's still unknown**: whether v5 lets a Droid be ATTACHED to an already-existing token (vs only at initial deployment), and the exact boundary of "token management" the Droid can perform (marketing copy? liquidity actions? nothing beyond casting?).

### Market state (current as of 2026-07-14 research)

| Metric | Value | Source |
|--------|-------|--------|
| Lifetime Clanker-launched volume | $17.5B | CoinGecko |
| 24h trading volume (all Clanker tokens) | $166.1M | CoinGecko |
| Protocol fees, annualized run rate | ~$32.5M (based on ~$89k/day July average) | derived from CMC sentiment data |
| Protocol fee growth, June -> July | +37% ($65k/day -> $89k/day average) | CMC |
| CLANKER token price / market cap | $15.12 / $14.9M | CoinGecko |
| Token-creation peak (2026) | 21,870 tokens in a single day, 2026-02-02 | CMC |
| Sentiment | 32.1% bullish / 12.1% bearish / 67.9% neutral, composite 3.9/5.0 | CMC sentiment tracker |

No documented security incidents, exploits, or rug events specific to the Clanker platform between May and July 2026. LP-lock-to-2100 remains the primary structural anti-rug mechanism (unchanged since v4).

### Regulatory

No SEC or other enforcement action, investigation, or specific warning found targeting Clanker, Farcaster, or Clanker-launched tokens. Broader 2026 US context is comparatively permissive: SEC removed "crypto" as a standalone 2026 examination-priority category, and DTC received a no-action letter (Dec 2025) enabling blockchain tokenization pilots in H2 2026. Nothing in this broader trend is Clanker-specific.

## Also See

- [Doc 988](../../../business/988-zaalcaster-token-launch-plan/) - zaalcaster's own token launch plan, explicitly gated on Clanker v5 timing.
- [Doc 991](../../991-empire-builder-tokenless-empire-airdrop/) - the Triple-A tokenless-first framework Clanker/Empire Builder are both built around.
- [Doc 1092](../../1092-zaal-adrian-empire-builder-deep-dive-jul14/) - source of the fee-split claim confirmed here.
- [Doc 1094](../) - hub doc.

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|-------------------|
| Update doc 988's open question ("Monday-on-current vs wait-for-v5") with this doc's finding (v5 not live, no ETA) | @Zaal | Doc edit | 2026-07-17 | Doc 988 references this doc and removes the stale "wait for v5" framing |
| Re-check Clanker's X account + gitbook changelog for a v5 ship announcement | @Zaal | Investigate | 2026-08-01 | Answer captured as an update note on this doc (last-validated bumped) or a new doc if v5 ships |
| If v5 ships before zaalcaster's own token launch, re-verify the droid/agent-token feature scope before designing around it | @Zaal | Investigate | wontfix (conditional - only if v5 ships) | Follow-up doc section or new doc |

## Sources

- [@clanker_world v5-audit announcement](https://x.com/clanker_world/status/2070258419714670710) [PARTIAL - X blocked direct fetch, content recovered via search results, not the raw tweet page]
- [Clanker.world homepage](https://www.clanker.world/) [FULL]
- [Clanker Documentation](https://clanker.gitbook.io/documentation) [FULL]
- [Clanker v4 Core Contracts](https://clanker.gitbook.io/documentation/references/core-contracts/v4) [FULL]
- [Clanker Creator Rewards & Fees](https://clanker.gitbook.io/clanker-documentation/general/creator-rewards-and-fees) [FULL]
- [Clanker.world Deployments docs](https://clanker.gitbook.io/documentation/general/token-deployments/clanker.world-deployments) [FULL]
- [KuCoin community post on Clanker V5](https://www.kucoin.com/news/community/CLANKER/6a3e31fa38c88c0007a63108) [PARTIAL - limited technical detail]
- [Crypto Briefing - Base unveils B20 token standard](https://cryptobriefing.com/base-unveils-b20-token-standard-enhancing-onchain-asset-management/) [FULL]
- [CryptoTimes - B20 delayed to July 8](https://www.cryptotimes.io/2026/07/08/b20-to-go-live-on-base-mainnet-on-july-8-after-major-delay/) [PARTIAL]
- [CoinGecko - tokenbot (CLANKER)](https://www.coingecko.com/en/coins/tokenbot-2) [FULL]
- [CoinMarketCap - What is Clanker](https://coinmarketcap.com/cmc-ai/tokenbot-2/what-is/) [FULL]
- [Chainstack - What is the B20 standard](https://chainstack.com/what-is-b20-base-token-standard/) [FULL]
- [The Defiant - Farcaster acquires Clanker](https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot) [FULL]
- [US Crypto Policy Tracker](https://www.lw.com/en/us-crypto-policy-tracker/regulatory-developments) [FULL]
- [DL News - key 2026 US crypto regulation dates](https://www.dlnews.com/articles/regulation/key-dates-for-us-crypto-regulation-in-2026/) [FULL]
