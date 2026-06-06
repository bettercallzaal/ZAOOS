---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-31
superseded-by:
related-docs: 674, 745, 790, 794
original-query: "/inbox - forwarded X post by +MemeForTrees: 'You can mint and redeem charity fund tokens here for 1USDC any time. If you hold a charity token you earn more of that charity token always redeemable 1:1 for USDC, while you hold a stream of funding is also going to the charity of your choice. For normies this still seems risky'"
tier: STANDARD
---

# 791 — Charity-Fund Token Mechanism: Mint/Redeem-at-1-USDC + Hold-to-Earn + Funding Stream (MemeForTrees / regen funding lens for ZAO)

> **Goal:** Decode the regen/impact funding mechanism in a forwarded MemeForTrees post and decide whether the "redeemable-at-par charity token with a funding stream" pattern is worth adopting for the ZAO Fund / Impact Concert / ZAOstock fundraising surfaces.

## Key Decisions (Recommendations First)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | The mechanism is interesting; the SPECIFIC project (MemeForTrees / $MfT) is NOT a partner candidate | $MfT is a deflationary meme/game token (Baselings game, "share memes to fund trees") with 20 holders and $0 trading volume as of this research. The funding-stream framing in the tweet is aspirational marketing, not audited mechanism. Treat as inspiration, not integration. | @Zaal |
| 2 | The redeemable-at-par + funding-stream PATTERN fits the ZAO Fund (Artizen, doc 674) and Jose's Impact Concert (doc 745) - INVESTIGATE a stablecoin-backed version | The honest version of "mint/redeem at 1 USDC + a cut streams to charity" is a fully-reserved stablecoin vault where yield (not principal) funds the cause. That removes the "for normies this still seems risky" objection the poster themselves flags. | @Zaal |
| 3 | SKIP any design where the "hold-to-earn more of the token" part is funded by new buyers | That is the exact reflexive-token failure mode doc 790's sibling research (Nicky Sap, doc 792) documents at 99% failure. A par-redeemable token whose yield comes from a real reserve is fine; one whose "earn more" comes from inflation/new deposits is a ponzi shape. | @Zaal |

## What the post actually says (Item 1, FULL)

+MemeForTrees (X handle `MemeForTrees`, 2026-05-30, 14 favs, with photo), verbatim:
> "You can mint and redeem charity fund tokens here for 1USDC any time. If you hold a charity token you earn more of that charity token always redeemable 1:1 for USDC, while you hold a stream of funding is also going to the charity of your choice. For normies this still seems risky"

Decoded mechanism (4 claims):
1. **Mint/redeem at par** - 1 charity token <-> 1 USDC, any time, both directions. Implies a fully-reserved USDC vault (this is the credible part).
2. **Hold-to-earn** - holding the token accrues more of the same token (yield).
3. **Funding stream** - while held, a stream of funding also goes to the holder's chosen charity.
4. **Self-aware risk flag** - the poster concedes "for normies this still seems risky", i.e. the UX/trust gap is unsolved.

The mechanism is a **par-redeemable charity stablecoin with a yield + donation stream**. The open question (unanswered in the post): where does the "earn more" + "funding stream" yield come from? If from reserve yield (e.g. USDC lent / T-bill-backed), it is sustainable. If from token inflation or new mints, it is reflexive and fails.

> **Update 2026-05-31 (Doc 794):** the actual mint/burn page (tasern.quest/fund/mint.html) answers this. Yield = Aave V3 USDC lending, split 33.33% holders / 33.33% Meme for Trees / 33.34% ops, principal redeemable 1:1 any time, immutable, no admin keys, "follows aUSDC legal precedent - deposit position, not a payment instrument." It is the SUSTAINABLE (reserve-funded) shape, and the charity vault is LIVE, not aspirational. See [Doc 794](../794-tasern-charity-vaults-refi-funding-pattern/).

## Who MemeForTrees is (grounding)

- $MfT token on Base: `0x8FB87d13B40B1A67B22ED1a17e2835fe7e3a9bA3`, deployed 2026-04-24, 18 decimals, ~20 holders, $0 volume at research time (TheBitTimes). Small, early, illiquid.
- Founder: jamesmagee on Farcaster (Erie, PA; `jamesmageeccc` on X; site carbon-counting-club.com). Tagline: "Share memes to fund trees."
- Token is **deflationary via a game** (Baselings - an MCP-driven pet/yield game where actions burn $MfT supply, with guardrailed agent DeFi swaps: max $0.10/swap, $5/day/wallet, allowlisted tokens). This is a meme/regen-game economy, NOT a charity-stablecoin product. The tweet's "charity fund token" framing is a separate/aspirational pitch.

So: the project is a regen-flavored meme/game token, not a clean charity-stablecoin. The IDEA in the tweet is more interesting than the implementation.

## ZAO Application

ZAO is positioned as a "decentralized impact network" (memory: zao_canonical_pitch) and already runs impact-funding surfaces:
- ZAO Fund for Emerging Culture on Artizen (doc 674) - a match fund.
- Jose Acabrera's monthly Impact Concert on the 22nd, ETH + quadratic funding (doc 745).
- ZAOstock fundraising ($7K min / $20K target, Fractured Atlas fiscal sponsorship).

The par-redeemable + funding-stream pattern, done honestly (reserve-yield-funded, not inflation-funded), could be a "ZAO Impact Token" where supporters park USDC, principal stays redeemable at par, and the yield streams to a chosen ZAO cause (an artist, ZAOstock, the match fund). The pitch to a "normie": your money is never at risk (redeem 1:1 any time), only the yield is donated. That is a materially safer story than any creator-coin or meme token - and it is the inverse of the creator-coin delusion documented in doc 792.

## Also See

- [Doc 674](../674-*/) - ZAO Fund for Emerging Culture (Artizen match fund)
- [Doc 745](../../farcaster/745-*/) or memory project_jose_acabrera - Impact Concert, ETH + QF
- [Doc 792](../792-nicky-sap-juke-founder-worldview-farcaster-strategy/) - why reflexive creator/social tokens fail (the anti-pattern this avoids)
- [Doc 790](../../dev-workflows/790-agentic-coding-workflows-claudemd-swarms-vibecoding/) - the inbox cluster this came from

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide if a reserve-yield-funded "ZAO Impact Token" is worth a spec (vs just keeping Artizen + QF) | @Zaal | Decision | Q3 planning |
| If yes: spec the reserve mechanism (where yield comes from) BEFORE any token design | @Zaal | Research doc | After decision |
| Do NOT integrate / endorse $MfT - log as inspiration only | @Zaal | Note | Done |

## Sources

- [+MemeForTrees X post (charity fund token mechanism)](https://x.com/MemeForTrees/status/2060692245662101927) - `[FULL - tweet text + media fetched via syndication endpoint]`
- [MemeForTrees ($MfT) token stats - TheBitTimes](https://thebittimes.com/token-MfT-BASE-0x8FB87d13B40B1A67B22ED1a17e2835fe7e3a9bA3.html) - `[FULL]`
- [MemeForTrees (jamesmagee) Farcaster profile - Web3.bio](https://web3.bio/jamesmagee.farcaster) - `[FULL]`
- [Baselings MCP (the $MfT burn/game economy)](https://mcpservers.org/th/servers/www-npmjs-com-package-baselings-mcp) - `[FULL]`
