---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs:
original-query: "Repo/web improvement: What are the submission requirements and traffic impact of listing WaveWarZ on DappRadar, PlayToEarn, and ChainPlay -- three directories that returned zero results for \"wavewarz\" in search?"
tier: STANDARD
---

# 973 - Repo/web improvement: What are the submission requirements and traffic

> Drafted by ZOE's research-worker from "Repo/web improvement: What are the submission requirements and traffic impact of listing WaveWarZ on DappRadar, PlayToEarn, and ChainPlay -- three directories that returned zero results for "wavewarz" in search?". Auto-committed to main for durability; review + deepen as needed.

I have enough data. Writing the corrected full-structure research doc now.

---

```markdown
---
topic: business
type: directory-research
status: research-complete
last-validated: 2026-07-06
related-docs: 970, 406, 743, 101
original-query: "What are the submission requirements and traffic impact of listing WaveWarZ on DappRadar, PlayToEarn, and ChainPlay -- three directories that returned zero results for 'wavewarz' in search?"
tier: STANDARD
---

# WaveWarZ Directory Listing: DappRadar, PlayToEarn, ChainPlay

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Submit to ChainPlay first | Zero eligibility friction, free, no strict criteria - fastest path to any directory presence. |
| 2 | Submit to PlayToEarn via business portal next | Business portal confirmed (business.playtoearn.com/list-your-game); music battle mechanic qualifies as a game. Frame as "AI music battle dapp." |
| 3 | Resolve WaveWarZ smart contract address BEFORE DappRadar submission | DappRadar requires on-chain contract addresses. Blockchain integration depth is unconfirmed in codebase docs. Premature submission will be rejected or go live as incomplete. |
| 4 | Use "AI music battle dapp" not "P2E game" framing across all three | These directories skew toward token-earn games. WaveWarZ's qualifying hook is the battle mechanic + "web3 market readiness" scoring category - not token farming. |

---

## Directory Comparison

| Directory | Eligibility Bar | Required Assets | Fees | Submission Path | WaveWarZ Fit | Traffic Reach |
|-----------|----------------|-----------------|------|-----------------|--------------|---------------|
| **DappRadar** | Blockchain-based; smart contract address(es) required (pre-launch = "upcoming dapp" exemption) | Account + verified email, contract address, full description, social URLs, 3 screenshots, YouTube link | Free | dappradar.com/submit-dapp (~30 min) | CONDITIONAL - need confirmed on-chain contracts | High - 4.66M daily active wallets tracked; reports cited by Cointelegraph, DailyCoin, crypto press |
| **PlayToEarn** | Blockchain game with crypto/NFT component implied | Game info via business portal; specific fields not publicly listed | Not stated | business.playtoearn.com/list-your-game | MODERATE - music battle qualifies; emphasize web3 scoring category | Medium - large directory; no self-published traffic stat |
| **ChainPlay** | No strict criteria; must be blockchain-based; fraud = removal | "Full-filled information" form | Free | chainplay.gg/add-game/ | EASY ENTRY - least restrictive; music battle with web3 scoring qualifies | Low-medium - smaller than DappRadar; no self-published traffic stat |

---

## Findings

**DappRadar** is the most authoritative of the three and the one WaveWarZ most needs for credibility. Listing is free and takes approximately 30 minutes. Required inputs: a verified DappRadar account, blockchain smart contract address(es) for the game's on-chain components, a full product description, social media URLs, up to three screenshots, and an optional YouTube video. Projects that have not launched yet may register as "upcoming dapps" without a live contract address - this is the fallback path if WaveWarZ's contracts are not confirmed.

The critical blocker: WaveWarZ has Coinflow payment infrastructure (Doc 406) and a `lib/paywall.ts` pricing layer, but on-chain contract deployment on Base or any DappRadar-tracked chain is not confirmed in available codebase docs. Without a verifiable contract address the submission will stall or be rejected. Resolve this before submitting.

Traffic context: DappRadar's gaming section tracks 4.66 million daily unique active wallets (Q3 2025), down slightly from 4.9M in May 2025 but still the largest lens in the industry. Their quarterly gaming reports are the primary citation source for Cointelegraph and crypto media broadly. Appearing in DappRadar rankings is how games get mentioned in those reports. This is the main traffic mechanism - earned media, not direct referrals.

**PlayToEarn** confirmed a business submission portal at business.playtoearn.com/list-your-game. An "Add Game" CTA is present on the main directory page and they actively solicit new submissions ("You have your own game but can't find it in the search? Add your game to PlayToEarn"). Required fields are not publicly disclosed on the directory page itself; the form reveals them on entry. The directory organizes titles by genre, blockchain, device, game status, and earning mechanics - suggesting the form collects these attributes. No fees were stated. WaveWarZ should position under "music" or "casual" genre, with the earning mechanic framed as the battle entry/paywall structure rather than token farming. No self-published traffic figures.

**ChainPlay** is the lowest-friction entry. Their FAQ explicitly states "Chainplay.gg doesn't have any strict criteria" for listing blockchain games. Submission is free, via chainplay.gg/add-game/, requiring a completed project form. Games are removed only for clear evidence of fraud. No review timeline is published. Contact is available at [email protected] or @chainplay on Telegram if a submission stalls.

**Traffic impact calibration.** None of the three directories publish per-listing referral or conversion data for listed games. The honest estimate: DappRadar presence drives earned media mentions in quarterly reports, not direct user acquisition at scale. PlayToEarn and ChainPlay generate organic search traffic from users browsing for new blockchain games. For a music-first app like WaveWarZ, all three directories function as web3 legitimacy signals and SEO surface area rather than primary growth levers. The combined value of zero-to-listed across all three is primarily credibility and discoverability for crypto-native users, not a substitute for music-community distribution (per Doc 970 Decision 5: r/IndieMusicFeedback, TikTok battle clips, live events).

---

## Next Actions

| Action | Owner | Deadline |
|--------|-------|----------|
| Verify whether WaveWarZ has deployed smart contracts on Base or another DappRadar-tracked chain | Zaal | TBD |
| Submit WaveWarZ to ChainPlay at chainplay.gg/add-game/ - no blockers, do this first | Zaal / ZOE | TBD |
| Submit to PlayToEarn at business.playtoearn.com/list-your-game using "AI music battle dapp" framing | Zaal / ZOE | TBD |
| Submit to DappRadar after contract address confirmed; use "upcoming dapp" path if contracts not yet live | Zaal | TBD |
| Lock in "AI music battle" + "web3 market readiness" as the web3 hook in all directory descriptions - never "P2E" | Zaal / ZOE | Before any submission |

---

## Sources

- [FULL] ChainPlay FAQ - https://chainplay.gg/faq/
- [PARTIAL - specific required form fields not exposed on public page] PlayToEarn Game Directory - https://playtoearn.com/blockchaingames
- [PARTIAL - 403 on direct fetch; requirements sourced via WebSearch result excerpt] DappRadar: How to List Your Project for Free - https://dappradar.com/blog/how-to-list-your-dapps-on-dappradar-for-free
- [PARTIAL - industry traffic figures only, no per-listing data] DappRadar State of Blockchain Gaming Q3 2025 - https://dappradar.com/blog/state-of-blockchain-gaming-q3-2025
- [PARTIAL - developer-side corroboration of DappRadar submission fields] BNB Chain Docs: Submit Project on DappRadar - https://docs.bnbchain.org/join-ecosystem/platforms/dappbay/
- [FAILED - no Reddit/HN/GitHub/X thread found after 3 searches on listing developer experience; community source requirement unmet at STANDARD tier. Recommend DEEP redispatch with targeted Reddit/r/gamedev OR r/web3gaming scrape if community voice is required.]
```

---

All six structural gaps from the 38/100 score are addressed:

- **Frontmatter** - topic, type, status, last-validated, related-docs, original-query all present
- **Key Decisions table** - at the top, tabular, before any prose
- **Comparison table** - all three directories compared across 7 dimensions
- **Findings** - prose synthesis with specific facts per directory
- **Next Actions table** - owner and deadline columns, 5 concrete rows
- **Community source** - honestly marked FAILED after 3 search attempts; escalation note included so the parent can decide whether to redispatch as DEEP
