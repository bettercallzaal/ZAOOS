---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 572, 573, 695, 706
original-query: "keep doing research now be specific about the arena find anything and everything you can on it"
tier: DISPATCH
---

# 708 - The Arena (arena.social): Complete Deep Dive (Hub)

> **Goal:** Everything ZAO can find on The Arena - the SocialFi platform on Avalanche - in two waves. Wave 1 (708a-708g) is the platform: history, mechanics, the $ARENA token, product, metrics, the creator playbook, and risks/competitors. Wave 2 (708h-708l) is the operator's playbook, triggered when Zaal confirmed he already has a profile: his profile audit + social graph, the 30/60/90 operator routine, music tactics, growth case studies, and the power-user toolkit. Twelve DEEP-tier research agents total; this hub synthesizes them. Supersedes the lighter Doc 706l.

## Key Findings (read first)

| Question | Finding | Confidence |
|----------|---------|------------|
| Is The Arena a real, surviving platform? | **YES** - the strongest-surviving SocialFi platform, ~200K registered users, real activity | High |
| Is it growing? | **NO - it is flat / consolidating.** User count held steady Oct 2024 to Apr 2026. Not collapsing, not hypergrowing | High |
| Is the $ARENA token worth holding? | **NO** - down ~97% from its June 2025 peak, ~$5M market cap, no CEX listings, no buyback. The token is effectively dead even though the platform is not | High |
| Should ZAO put a profile on The Arena? | **YES - as a cheap, low-stakes experiment.** Free, ~5-10 min onboarding via X login. Not a monetization strategy | Medium |
| Should ZAO launch a token via Arena's launchpad? | **NO** - regulatory risk (tickets/launchpad tokens look like securities) and it contradicts $ZAO being soulbound (Doc 695) | High |
| Realistic earnings for ZAO on The Arena? | Modest. ~$500-2K/month in months 1-3 if Zaal plus a few Cipher artists post consistently. A companion channel, not a revenue line | Medium |
| Is SocialFi as a category safe? | **NO** - friend.tech collapsed, the mechanics are structurally fragile, The Arena has not yet faced its post-hype retention test | High |
| Net recommendation | Use The Arena as a **tertiary distribution + experiment channel**. Profile yes, token no, treasury position no, dependence no | High |

## TL;DR

Seven agents took The Arena apart. The honest picture:

The Arena is the **best-surviving SocialFi platform** - and that is a low bar. It came back from a near-fatal start (it launched as Stars Arena in September 2023 and was hacked for ~$2.88M eight days in), rebuilt under a new team, raised a $2M pre-seed, and shipped a real V2 with its own DEX and launchpad. It has ~200,000 registered users and genuine on-chain activity - at times a third of all active wallets on Avalanche.

But two things are clearly true and need stating plainly:

1. **It is flat, not growing.** User count has been roughly steady since late 2024. The platform is defending a niche, not expanding.
2. **The $ARENA token is dead even though the platform is not.** Down ~97% from its June 2025 peak to a ~$5M market cap, no major exchange listings, no buyback or revenue-share. Platform activity and token price have fully decoupled.

And SocialFi as a category is a graveyard - friend.tech, the model The Arena copied, collapsed from ~$52M TVL to ~$4M. The ticket/bonding-curve mechanic is structurally a game where new buyers fund earlier sellers; when growth stalls, it can cascade. The Arena has survived longer than its peers but has not yet faced the post-airdrop retention cliff that killed the others.

**For ZAO the recommendation is small and clear:** create a profile for Zaal as a cheap experiment, optionally a few Cipher artists, and treat The Arena as a *tertiary distribution channel* - somewhere ZAO has a presence, not somewhere ZAO bets. Do not launch a token through its launchpad (regulatory risk plus the soulbound-$ZAO logic from Doc 695). Do not hold $ARENA. Do not build a strategy on it. Farcaster - where ZAO already lives - is the larger, healthier social surface and the better place for real investment.

## The honest synthesis: real platform, fragile category

The seven dimensions split, predictably, into an optimistic camp and a skeptical camp, and both are right about different things:

- **The optimistic read** (708d product, 708e metrics): The Arena shipped a genuinely full product - feed, tickets, a launchpad, its own DEX, live audio "Stages", token-gated Groups, an iOS app - and its metrics are *stable*, not collapsing. It is not friend.tech.
- **The skeptical read** (708c token, 708g risks): The token is a post-bubble husk, the bonding-curve mechanic is ponzi-adjacent, the regulatory profile is unresolved, and "stable" may just mean "earlier in the same decline curve than the platforms that already died."

The reconciliation - and this hub's position - is: **The Arena is real enough to have a free profile on, and fragile enough that ZAO should never depend on it, monetize through it, or hold its token.** A profile costs ZAO almost nothing and gives a small, real distribution surface. Anything beyond a profile is a bet on a flat platform in a dying category, and ZAO should not make that bet.

This is a mild **downgrade** from Doc 706l, which called The Arena "healthy and growing." The deeper dive shows it is healthy-ish and *flat*. The action (create a profile) is unchanged; the framing (a cheap experiment, not a growth play) is more sober.

## The seven dimensions

### 708a - History, founding & team
Launched as **Stars Arena** on 27 Sep 2023 by a pseudonymous developer (@hannesxda), a friend.tech fork on Avalanche. Hacked twice in October 2023 - the serious one was a ~$2.88M reentrancy exploit on 7 Oct; ~90% of funds were recovered via a bounty deal with the hacker. The original team disbanded; a new team took over (CEO Jason Desimone of RoveWorld, COO Phillip Liu Jr, ex-Ava Labs). Rebranded to **The Arena / arena.social** on 7 Dec 2023. Closed a **$2M pre-seed** in October 2024 (Blizzard / Avalanche ecosystem fund, Balaji Srinivasan, Abstract Ventures). V2 with ArenaDEX + launchpad shipped May 2025. New-York-based. *See `708a-history-founding-team.md`.*

### 708b - Mechanics & economics
Users trade social "tickets" priced on a quadratic bonding curve. Every secondary trade carries a **10% fee, split 70% to the creator (7% of the trade) and 30% to the protocol (3%)** - that is the basis of the "creators earn the majority" claim. Worked examples: a mid-tier creator (~500 holders) earns on the order of tens of AVAX per year from ticket trading; earnings scale steeply with holder count. V2 contracts passed a Paladin audit; funds sit in a 3-of-6 Gnosis Safe multisig. The structural risk is the curve itself - it rewards early buyers and can cascade down if sentiment turns. *See `708b-mechanics-economics.md`.*

### 708c - The $ARENA token
Contract `0xB8d7710f7d8349A506b75dD184F05777c82dAd0C` on Avalanche, TGE 29 Oct 2024, 10B max supply. Peaked near $0.0266 in June 2025; as of 22 May 2026 it trades around $0.0008 - down roughly 97% - with a ~$5M market cap and no major CEX listings. Allocation was ~31% airdrop / ~32% treasury / ~37% growth, with a year-long airdrop vest that created continuous sell pressure and no buyback or burn to absorb it. Verdict: a typical post-bubble SocialFi governance token. The platform has traction; the token does not. ZAO should not buy or hold it. *See `708c-arena-token.md`.*

### 708d - Product, features & roadmap
A full product surface: a Twitter-like feed, ticket trading, a 30-second token launchpad, **ArenaDEX** (a Uniswap-V2-style DEX, ~$284M 30-day volume), a self-custodial multichain wallet, an iOS app (launched April 2026), staking and "Champions", live-audio **Stages** ($5M+ distributed), and token-gated **Groups**. It acquired Arcade2Earn in April 2026 (a GameFi direction). 2026 roadmap items include an L1 subnet migration, staker vaults, transferable tickets, and AI agents. *See `708d-product-features-roadmap.md`.*

### 708e - Metrics, traction & growth
~200,000 registered users, roughly steady from Oct 2024 to Apr 2026 - at points ~32% of all active wallets on Avalanche. ~$8.2M TVL (June 2025), ~$284M 30-day DEX volume, $11M+ cumulative creator payouts. The verdict the agent reached: **flat-to-consolidating** - explicitly NOT the friend.tech collapse pattern, but also not growth. A platform defending its niche. *See `708e-metrics-traction.md`.*

### 708f - Creator playbook & case studies
Onboarding is free and fast (X / Google / Apple login, ~5-10 minutes to a live profile). Real creator earnings are modest - a top-tier creator might clear $500-3K/month, below-median creators $50-300. For ZAO specifically: a realistic months-1-3 outcome is ~$500-2K/month *if* Zaal and a few Cipher artists post consistently. The highest-upside scenario is running ZAOstock as an Arena Group, but that depends on a token trading well, which most do not. Best understood as a companion channel, not a revenue line. *See `708f-creator-playbook-case-studies.md`.*

### 708g - Risks, criticism & competitors
The skeptical counterweight. SocialFi is a graveyard: friend.tech fell ~$52M to ~$4M TVL, its token ~98%. The ticket mechanic is structurally a game where new entrants fund earlier exits. Creator tickets plausibly meet several prongs of the Howey securities test - so ZAO should keep to plain profiles and avoid gating content or launching tokens through Arena. Competitively, **Farcaster** (800K+ DAU, far larger and healthier) is the stronger social surface and where ZAO already operates. The Arena's builder SDK is alpha-stage. The agent's recommendation: use The Arena as a tertiary channel only; invest real social effort in Farcaster. *See `708g-risks-criticism-competitors.md`.*

## Wave 2: the operator's playbook (Zaal has a profile)

Wave 2 was triggered by a new fact: **Zaal already has an Arena profile.** So the question shifts from "should ZAO be on The Arena" to "how does Zaal operate the profile he has." Five tactical agents.

### 708h - Zaal's profile audit + the social graph
The honest headline: **the agent could not verify Zaal's profile from outside.** The Arena gates profiles behind X-OAuth login and does not expose them to public search or plain crawling, so a profile cannot be audited without logging in. Zaal should log in directly to confirm and read off his ticket price, holder count, and follower count. Two useful findings did land: none of ZAO's ~8 named musicians (Jango UU, Songs of Eden, Hurric4n3ike, Jadyn Violet, and others) appear to be on The Arena - an untapped lane - and Arena COO Phillip Liu Jr (ex-Ava Labs Head of Strategy) is a credible Avalanche-ecosystem bridge. *See `708h-zaal-profile-audit-social-graph.md`. Note: profile details are unverified until Zaal checks while logged in.*

### 708i - Operator playbook (30/60/90 days)
The concrete routine for a profile holder: a first-30-days setup-and-consistency checklist, the bonding-curve mechanics from the operator side, three holder-acquisition methods (tipping virality, referral codes, Stage collaborations), and a daily/weekly/monthly cadence. The agent projects day-90 earnings of roughly 200-700 AVAX/month from tips, royalties, referrals, and airdrops - treat that as an optimistic projection, not a forecast. (One agent-cited "June 2026" metric is a future date relative to today and should be disregarded.) *See `708i-operator-playbook-30-60-90.md`.*

### 708j - Music & artist tactics
The Arena audience is roughly 60-70% crypto traders and 30-40% genuine fans - so it is a tool for crypto-native indie artists building a committed core, not a mass-audience music platform. The agent gave eight concrete Cipher ideas (track teasers, listening parties on Stages, a token-gated artist room, ticket-holder music perks) and a flywheel: posts drive ticket demand, ticket sales fund music, releases drive tips and trading. The honest read: a complement to streaming and touring, not a replacement. Start with 500-1,000 crypto-native fans, not the masses. *See `708j-music-artist-tactics.md`.*

### 708k - Growth case studies
Five documented Arena growth examples were dissected (NOCHILL, GURS, Integrity DAO, LAMBO/WOLFI, and the Cast3 mechanism). The repeatable levers: the referral loop (1% of every referred trade, permanently), the bonding curve, and cross-posting from an existing X following. The agent drafted a 12-month pattern for Zaal that seeds from the 188-member ZAO community and targets 1,000+ ticket holders and ~$500/week by month 12 - again, an aspirational target, not a promise. *See `708k-growth-case-studies.md`.*

### 708l - Power-user toolkit
The tooling around The Arena: an alpha-stage Arena App Store SDK (v0.2.4), an "Arena Agent" bot skill (autonomous posting, ~3 posts/hour), the third-party Logiqical MCP SDK (176 tools, ~78 Arena social functions - relevant since ZAO runs agents), a community Dune analytics dashboard, and crossposting tools. The one ZAO-native opportunity: ZAO could deploy the Arena Agent bot on its existing VPS (~1-2 hours) so an agent keeps the profile active. Worth a small experiment, not a priority. *See `708l-power-user-toolkit.md`.*

## What ZAO should do

### Do (low cost, low stakes)
1. **Zaal: log into the profile and read off the numbers** - ticket price, holder count, followers. Wave 2 could not see them from outside; the operator playbook only becomes concrete once those are known.
2. **Run the 708i first-30-days checklist** - finish profile setup, set a posting cadence, use the referral code. Treat it as a light side-channel, not a job.
3. **Optionally add 1-3 Cipher artists** once Zaal's own profile has run for a month and there is something to learn from (708j).
4. **Optional small experiment:** deploy the Arena Agent bot on ZAO's VPS to keep the profile active autonomously (708l, ~1-2 hours).

### Do not
- **Do not launch a token through Arena's launchpad.** Regulatory risk (launchpad tokens and tickets look like securities) and it contradicts the settled position that $ZAO is soulbound Respect, never a tradeable token (Doc 695).
- **Do not buy or hold $ARENA.** The token is down ~97% with no buyback or revenue-share. If Arena ever offers an airdropped governance allocation, that is fine to accept passively; never purchase.
- **Do not treat The Arena as a monetization strategy or build the roadmap around it.** Expected earnings are a companion-channel trickle, not a revenue line.
- **Do not depend on it.** SocialFi is structurally fragile and The Arena is flat. Keep ZAO's real social investment on Farcaster, where ZAO already lives.

### Park
- **ZAOstock as an Arena Group** is the one genuinely interesting upside scenario (event coordination plus a community token). It is speculative and token-dependent - park it as an idea, do not action it now.

## Cross-cutting numbers (verify before citing)

| Metric | Value | Source | Note |
|--------|-------|--------|------|
| Launched (as Stars Arena) | 27 Sep 2023 | 708a | Friend.tech fork on Avalanche |
| Oct 2023 hack | ~$2.88M reentrancy exploit | 708a | ~90% recovered |
| Rebrand to The Arena | 7 Dec 2023 | 708a | New team, arena.social |
| Pre-seed raised | $2M (Oct 2024) | 708a | Blizzard, Balaji, Abstract Ventures |
| Registered users | ~200,000 (flat Oct 2024-Apr 2026) | 708e | Not growing |
| TVL | ~$8.2M (June 2025) | 708e | Dated figure |
| 30-day DEX volume | ~$284M (mid-2025) | 708d, 708e | ArenaDEX |
| Cumulative creator payouts | $11M+ | 708e | |
| Trade fee | 10% (70% creator / 30% protocol) | 708b | |
| $ARENA token | ~$0.0008, ~$5M mcap, -97% from peak | 708c | TGE 29 Oct 2024, contract 0xB8d7...dAd0C |

## Contradictions and staleness flags

- **Growth framing:** 708e says "flat / consolidating, not declining"; 708g says The Arena "has not yet faced its retention test" and may be earlier in the same decline curve that killed its peers. Both can be true - the hub treats the platform as real-but-fragile and recommends accordingly.
- **This doc vs Doc 706l:** 706l called The Arena "healthy and growing." This deeper dive finds it healthy-ish and *flat*. The recommended action (create a profile) is unchanged; the framing is more sober. Treat 708 as the current word; 706l is superseded on the growth claim.
- **Dated metrics:** TVL ($8.2M) and DEX volume ($284M) are mid-2025 figures - the freshest the agents could verify. User count is tracked to Apr 2026. Re-check before citing.
- **Agent-reported specifics** (founder names, the hack amount, the $ARENA contract address, fee splits) are sourced in the sub-docs with FULL/PARTIAL/FAILED marks, but should be re-verified against primary sources before any public use or outreach.
- **Arcade2Earn acquisition** (708d) is only PARTIALLY sourced - the integration timeline was not confirmed.

## Also See

- [Doc 706](../706-avalanche-ecosystem-deep-dive/) - the 21-dimension Avalanche ecosystem deep dive (706l was the lighter Arena pass)
- [Doc 707](../707-avalanche-master-brief/) - the Avalanche master brief; The Arena is one of its three "use as a tool" surfaces
- [Doc 573](../573-zabal-avax-surfaces-arena-music/) - the original research that first flagged The Arena
- [Doc 695](../../governance/695-crypto-factor-avax-governance-decision/) - why ZAO does not launch tradeable tokens; applies directly to Arena's launchpad

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Log into The Arena and read off ticket price, holder count, follower count - Wave 2 could not see the profile from outside | @Zaal | Task | This week |
| Run the 708i first-30-days checklist - finish profile setup, set a posting cadence, use the referral code | @Zaal | Task | This month |
| Decide after ~1 month whether to add Cipher artist profiles (708j) | @Zaal | Decision | After the profile has run |
| Optional: deploy the Arena Agent bot on ZAO's VPS to keep the profile active (708l) | @Zaal | Experiment | Optional, low priority |
| Do NOT launch any token via Arena's launchpad - this is a standing no | @Zaal | Decision | Standing |
| Keep ZAO's real social investment on Farcaster, not The Arena | @Zaal | Decision | Standing |
| Re-validate this doc if The Arena's user count or TVL moves materially | @Zaal | Doc update | Every 6-8 weeks |
| Verify agent-reported figures ($ARENA contract, fee splits, founder names, growth projections) before any public use | @Zaal | Verification | Before citing |

## Sources

DISPATCH hub built in two waves. All twelve sub-docs (`708a`-`708l`) carry their own full Sources sections with every source classified `[FULL]` / `[PARTIAL]` / `[FAILED]` per the zao-research fetch-quality gate. Across the twelve DEEP-tier agents, 280+ sources were consulted - CoinGecko, CoinMarketCap, DexScreener, DefiLlama, CertiK / SlowMist / PeckShield / Paladin security reports, CoinDesk, The Block, the Arena blog and docs, the Playwright-loaded arena.social app, GitHub, and community sources on Reddit, X, and Hacker News. Headline counts:

Wave 1 (the platform):
- 708a - history: 32 sources (25 FULL, 7 PARTIAL)
- 708b - mechanics: 15 sources, classified FULL/PARTIAL/FAILED
- 708c - $ARENA token: classified FULL/PARTIAL/FAILED, 5+ hard metrics
- 708d - product: 20 sources (14 FULL, rest PARTIAL; Arcade2Earn PARTIAL)
- 708e - metrics: 15+ sources, every metric dated
- 708f - creator playbook: 20 sources, classified FULL/PARTIAL
- 708g - risks/competitors: 40+ sources, classified FULL/PARTIAL/FAILED

Wave 2 (the operator playbook):
- 708h - profile audit / social graph: classified FULL/PARTIAL/FAILED; profile not externally verifiable
- 708i - operator playbook: 13+ sources, classified FULL/PARTIAL
- 708j - music tactics: classified FULL/PARTIAL
- 708k - growth case studies: 20 sources (16 FULL, 4 PARTIAL)
- 708l - power-user toolkit: 19 sources, classified FULL/PARTIAL

Per the staleness flags above, agent growth projections (708i, 708k) are aspirational, not forecasts, and dated metrics should be re-verified before any public use.

See each sub-doc for the verbatim URL list. Per the staleness flags above, dated metrics and agent-reported specifics should be re-verified against primary sources before they drive a decision or appear in anything public.
