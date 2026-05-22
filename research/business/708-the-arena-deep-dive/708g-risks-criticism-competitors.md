---
topic: business
type: threat-landscape
status: research-complete
last-validated: 2026-05-22
related-docs: 573, 706
original-query: "keep doing research now be specific about the arena find anything and everything you can on it"
tier: DEEP
parent-doc: 708
---

# 708g - The Arena: Risks, Criticism & Competitors

> Goal: Understand the genuine risks, community criticism, regulatory surface, security history, and competitive landscape for The Arena (arena.social) as a creator monetization vehicle for ZAO. This doc is the skeptical/adversarial counterweight to the optimistic case in Doc 573.

## Key Findings (read first)

| Finding | Severity | Evidence | Context |
|---------|----------|----------|---------|
| SocialFi category is in graveyard: Friend.tech (98% token decline, abandoned Sept 2024), Stars Arena (hacked 2023, $3M loss, nearly died) | CRITICAL | Friend.tech: TVL $52M -> $4M (2023-2024), daily fees $2M -> <$100. Stars Arena: reentrancy exploit Oct 7 2023 on day 8 of operation | Friend.tech was the model; its collapse to sub-$1 token price and developer abandonment signals structural fragility |
| The Arena itself is merely the recovered Stars Arena - same smart contract risk surface, rebranded after Oct 2023 hack | HIGH | Stars Arena hacked 266,103 AVAX (~$3M) via reentrancy; Jason Desimone acquisition Nov 2023; rebranded to The Arena; team rebuilt contracts | Single 9-day lifecycle before catastrophic failure; recovery still on same blockchain with audit history post-breach |
| Ponzi dynamics are intrinsic to SocialFi ticket/share model - new entrants fund earlier investors; no inherent value creation | HIGH | Tactical_retreat (independent researcher, Oct 2023): "Stars Arena (and other SocialFi platforms) are (mostly) ponzis. Most of crypto is a ponzi anyway." Community sentiment consistent across Reddit, Flagship.fyi, independent analysis | Share price depends entirely on next buyer's willingness to pay more; when new user growth plateaus, cascade collapse (seen in Friend.tech) |
| API/SDK stability in alpha; platform technical debt from recovery phase is real | MEDIUM | Arena App Store SDK v0.2.4 (Aug 2025) explicitly marked ALPHA; "API may change in future releases"; only 104 weekly npm downloads; Wagmi v1/v2 connectors 0-1 versions | Early SDK adoption risk; breaking changes possible; small developer footprint |
| User retention cliff post-airdrop is baked into SocialFi design - happened to Friend.tech (V2 airdrop May 2024), happening to Lens/Farcaster | HIGH | Friend.tech: airdrop caused price crash FRIEND token $169 -> $1.4; daily volume went from $2M to <$100 within months. Farcaster: Q4 2025 revenue $1.84M (85% YoY drop) | Once token distribution slows or ends, viability of continued engagement is questionable |
| Regulatory risk is undefined - "creator tickets" may be classified as unregistered securities; no SEC/FINRA guidance yet | MEDIUM-HIGH | No court cases or regulatory action against SocialFi platforms yet (as of May 2026), but surface is wide: tickets are fungible, transferable, secondary market exists, creator fee sharing resembles yield | ZAO issuing profiles on Arena does NOT create liability, but if ZAO issued its own token on Arena launchpad or gated content behind Arena token, exposure increases |
| Bot/spam/wash trading is chronic problem; "pump your ticket and dump" dominant community behavior | MEDIUM | Tactical_retreat (Oct 2023): "spam bots and scam bots and tip begging became commonplace"; community constantly notes bot prevalence; independent analysis notes mercenary capital / "ponzi dynamics" in ticket trading | Network effects invert - more users = more noise, fewer genuine interactions; signal-to-noise ratio degrades |
| Reputational risk for ZAO: association with SocialFi speculation platform may alienate serious creators/partners | MEDIUM | ZAO positions as "music community" and "decentralized impact network" (canonical pitch, Doc 603); Arena positions as "meme tokens + speculation flywheel". Misalignment in brand signal | Mention of Arena usage in pitch decks or partnerships may read as "ZAO is a speculation vehicle" to music industry/music fund partners; counter narrative required |
| Competitors have stronger positioning: Farcaster (800K+ DAU, Neynar acquisition, revenue model shift), Lens (60M+ funded, ZK chain, infrastructure play), DeSo (custom L1, lower fees) | MEDIUM | Farcaster: 800K DAU (May 2025), acquired by Neynar Jan 2026 for ~$1B; Lens: $60M+ raised, Polygon + zkSync migration; DeSo: 200+ apps, custom blockchain, lower tx cost | The Arena's edge is token launch/launchpad + social flywheel (Avalanche-native), but Farcaster/Lens have larger user bases and more mature ecosystems |
| Bridge/liquidity cost for $ZABAL on Avalanche: $5-25K seed capital needed (per Doc 573); may not justify ROI if Arena adoption stalls | MEDIUM | Doc 573 recommends Pharaoh DEX liquidity seeding; if Arena activity doesn't sustain, liquidity dries up and ZABAL becomes illiquid on Avalanche | Opportunity cost: that capital could go to music/community projects with clearer ROI |

---

## Risk Assessment Table

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|-----------|
| **SocialFi category collapse** - if The Arena follows Friend.tech trajectory, ZAO's Avalanche play is worthless | CRITICAL | Friend.tech: $52M -> $4M TVL; token 98% down. Stars Arena: $3M hack on day 8. Both platforms show 95%+ user/volume decline within 6 months | Treat Arena as bet on Jason Desimone's team + Avalanche ecosystem. Don't allocate core treasury capital. Pilot with $500-1K only. Monitor Monthly TVL/DAU metrics. |
| **Smart contract risk** - undiscovered exploit or reentrancy could drain TVL again | HIGH | Oct 2023 Stars Arena reentrancy: $3M in minutes. Post-audit claimed "all funds recovered" but no formal ongoing verification visible. SDK in alpha = API risk. | Audit ZABAL bridge contract if deploying. Don't hold Arena tokens as treasury. Use Arena for distribution, not as financial instrument. |
| **Token value collapse post-airdrop** - $ARENA token will face dilution as vesting continues; historical precedent: FRIEND $169 -> $0.06 | HIGH | $ARENA 10B total supply; 2.5B circulating (May 2026); vesting schedule TBD. Friend.tech airdrop May 2024 caused 99% collapse. Lens $BONSAI saw dilution concerns. | Do NOT recommend ZAO treasury buy $ARENA. For ZAO members: participate in platform, don't speculate on token. |
| **User retention cliff** - once airdrop/incentives end, Farcaster lost 75% DAU; Lens saw 80% drop | HIGH | Farcaster: 104K DAU (June 2025) -> 60K (Sept 2025); Q4 2025 revenue $1.84M (down 85% YoY). Lens: 42K DAU peak -> 8.3K. | Arena stickiness unclear. Early 2026 data shows TVL $8.2M and claims of "viral growth," but no independent verification of organic DAU metric. |
| **Wash trading / mercenary capital dominance** - new entrants fund exits; no genuine value creation | HIGH | Tactical_retreat observed "people hype up the ponzi" for fees; community sentiment: "if you buy a creator's ticket early and they pump, exit immediately." | ZAO can leverage for distribution (creator profiles + referral rewards), but do NOT position Arena as primary monetization. Treat as discovery/community channel. |
| **Regulatory scrutiny on tickets as securities** - SEC has not acted yet, but the surface is large (fungible, transferable, secondary market, yield) | MEDIUM-HIGH | No enforcement action as of May 2026. But tickets meet multiple Howey test prongs: investment contract, expectation of profits from others' effort, common enterprise. | ZAO issuing profiles = safe (personal brand). ZAO launching token/launchpad = high risk. Keep ZAO participation at profile + referral level. Avoid treasury participation. |
| **Reputational spillover** - "ZAO is a meme/speculation platform" narrative if Arena association is too public | MEDIUM | ZAO's canonical pitch is "decentralized impact network" + music community. Arena's pitch is "creator economy + meme coins + spec trading." | Communicate Arena as ONE distribution channel among many (Farcaster, Base, XMTP). Don't make it a pillar. Reference Doc 573 ROI in terms of fee splits + grants (Retro9000), not token appreciation. |
| **API/SDK breaking changes** - alpha status means integrations will break as platform evolves | MEDIUM | @the-arena/arena-app-store-sdk v0.2.4 marked ALPHA; 104 weekly downloads; 4 versions in 6 months (Aug 2025 - Jan 2026); Wagmi connectors still immature | If ZAO builds on Arena SDK: version-pin carefully, expect migration overhead. Better: use SDK for wallet access + user profile, not for core business logic. |
| **Bridge/liquidity cost not recovered** - $5-25K seed capital on Pharaoh DEX may go to zero if Arena adoption stalls | MEDIUM | Doc 573 recommends ZABAL/AVAX pair on Pharaoh. If Arena fails, no secondary market for ZABAL on Avalanche; capital locked or sold at loss. | Pilot with $500-1K AVAX seed, not $25K. Monitor 30-day volume metrics. Only increase if sustained >$100K weekly swap volume on ArenaDEX. |
| **Competitor capture risk** - Farcaster (Neynar acquisition, 800K DAU) or DeSo (cheaper, custom L1) could edge Arena out in 2026-2027 | MEDIUM | Farcaster: acquired Jan 2026, $1B valuation, Neynar backing. DeSo: 200+ apps, 8-year track record, lower fees. Arena: 2 years old (post-rebranding), smaller app ecosystem. | Diversify: ZAO profiles on both Arena AND Farcaster (via Frames). Don't bet entire Avalanche strategy on The Arena alone. |

---

## Competitor Comparison (May 2026)

| Platform | Blockchain | DAU / Users | Creator Revenue | Strengths | Weaknesses | Best For |
|----------|-----------|------------|-----------------|-----------|-----------|----------|
| **The Arena** | Avalanche | ~35K-50K (est. from TVL) | 70% of trade fees | Native token launch, launchpad, flywheel (social + DEX), Avalanche ecosystem support | 2yr post-hack, SDK in alpha, smaller app ecosystem, ponzi dynamics | Meme coins + speculative trading; Avalanche-first creators |
| **Farcaster** | Optimism (ETH L2) | 800K+ | Frames/Mini Apps revenue (~$2.8M total protocol), creator subscriptions ($25K+/week) | Largest DAU, Neynar backing, Frames (mini-apps in feed), Warpcast Pro ($120/yr), strong VC funding | Revenue still modest relative to user base; DAU stalling (peak 104K -> 60K in 4 mo); user retention cliff | Crypto-native builders, social-first; frames/mini-apps |
| **Lens Protocol** | Polygon / zkSync | ~1.5M (registered, but active subset ~50K?) | Native monetization modules (collect-to-read, pay-to-follow, revenue splits) | $60M+ funding, ZK chain, composable architecture, true data portability | Smaller active user base; infrastructure-first (less social-focused); farming history hurt reputation | Developers building social apps; DeFi integrations; long-form content |
| **DeSo** | DeSo (custom L1) | ~200K (registered) | Creator coins native, NFT minting, tipping (diamonds) | Custom L1 built for social data, 200+ apps, 8-year track record, lower tx costs, built-in NFT marketplace | Smaller user base; less hype; less VC backing; niche positioning | Content creators owning full IP; long-form publishers; data-heavy apps |
| **Bluesky** | AT Protocol (no blockchain) | ~5M+ (per reports, growth phase) | No native monetization yet | Decentralized protocol (federated PDS), no blockchain friction, Twitter-like UX, Jack Dorsey backing | Zero monetization for creators; no token; network effects still building | Mainstream adoption; censorship-resistant comms; non-crypto users |

**Assessment:** Farcaster dominates in 2026 by DAU and VC backing, but faces retention cliff. Lens is infrastructure play, DeSo is niche + stable, Bluesky is non-crypto + no monetization. The Arena's edge is Avalanche ecosystem + launchpad, but that's thin differentiation. ZAO should NOT pick one; diversify across Farcaster (primary) + Arena (secondary, Avalanche-specific).

---

## The SocialFi Graveyard: Why Projects Die

### Friend.tech Collapse (2023-2024): The Cautionary Tale

**Timeline:**
- Aug 10, 2023: Launched on Base, went viral overnight
- Aug 21, 2023: Peak of 39,000 daily transactions, $1.98M inflow
- Aug 28, 2023: 95% decline in transactions to ~1,400/day within 18 days
- May 2024: V2 launch + token airdrop, brief resurgence (62K clubs created)
- Sept 8, 2024: Developers transferred smart contracts to null address (burn); effectively shut down platform
- Sept 2024 - May 2026: TVL stayed at $3-4M; FRIEND token at $0.06 (down 98% from $1.4 peak post-airdrop)

**Why it failed:**
1. **Ponzi dynamics were the only mechanic.** Users had to continuously buy keys to make money. No inherent value creation. When new user inflow stopped (Sept 2023), the whole model collapsed.
2. **Airdrop backfired.** Token distribution in May 2024 was supposed to reinvigorate; instead, holders dumped their allocations. Token went $169 -> $1.4 -> $0.06.
3. **Team dysfunction.** Founder "Racer" had public fallout with Base, announced plan to migrate to "FriendChain" (own blockchain), lost community trust. Paradigm (lead VC investor) exited before airdrop, signaling even backers had lost faith.
4. **Zero feature evolution.** V2 promised new features but delivered minimal updates. Community was exhausted.
5. **No moat.** Anyone could fork it. Competitors (Stars Arena, others) cloned code, took features.

**Outcome:** Developers abandoned ship Sep 2024. Locked contracts in burn address to prevent future changes. Over $45M in fees were extracted by the team before collapse; users lost nearly all capital.

### Stars Arena / The Arena: Hacked on Day 8 (Oct 2023)

**Timeline:**
- Late Sept 2023: Stars Arena launches (Friend.tech clone on Avalanche)
- Oct 5, 2023: First exploit - attackers sell zero shares for free AVAX (fixed quickly, $2K loss)
- Oct 7, 2023: Major reentrancy exploit - attacker drains 266,103 AVAX (~$3M) in one transaction via sendAVAX callback
- Oct 11, 2023: Hacker negotiates return of 90% of funds (keeps 10% bounty + 1K AVAX for bridge loss)
- Nov 2023: Jason Desimone (community member) steps up as new CEO; team rebuilt smart contracts
- 2024-2026: Rebranded to The Arena, released V2 with launchpad + DEX

**Why it happened:**
- **Unaudited code launched during hype.** Stars Arena was moving fast, TVL spiked $33K -> $1M in one week (Sep 27 - Oct 5). No time for security review.
- **Common reentrancy pattern.** The transferAVAX function allowed callbacks to external contracts, creating a reentrancy window. Attacker re-entered sellShare() and modified a price variable before the return value was calculated.
- **Arrogance + poor comms.** When security researcher @0xlilitch warned about the vulnerability on Oct 5, Avalanche founder Emin Gün Sirer downplayed it, saying "cost the attacker $0.25 to make $0.04" (wrong, by ~$3M). Team blamed "coordinated FUD attack" instead of owning the technical failure.

**Aftermath & Recovery:**
- Hacker negotiated return; team recovered ~90% of funds
- Team hired Paladin Blockchain Security for full audit
- Desimone rebuilt from scratch with new contracts
- Survived; rebranded to The Arena; now (May 2026) claims $8.2M TVL and "viral growth"

**Red flags that persist:**
- The team prioritized marketing/comms over security initially (Sirer's dismissive tone)
- Recovery team is competent but small (13 people on LinkedIn)
- Audit happened AFTER the hack (not before), which is reactive, not proactive

---

## Current Criticisms of The Arena (2024-2026)

### Community Sentiment from Independent Sources

#### 1. Tactical_Retreat (Oct 2023 post-hack analysis, independent researcher)
> "Yes, Stars Arena (and other SocialFi platforms) are (mostly) ponzis. Most of crypto is a ponzi, honestly. Very little of actual value is produced by any participants."

Key points:
- Platform had "terrible UX, full of bugs, platform unstable"
- Bot mitigation was non-existent; claimed "coordinated FUD attack" was team denying responsibility
- After first exploit, team should have done full audit; instead, "continued onward" with poor judgment
- Team was "circle-jerking" instead of building real product
- Referral model was the only way for third-party tools (like ArenaBook) to earn; created perverse incentive to gate features

**Verdict:** Insider critical assessment. Team execution was poor even accounting for scale challenges.

#### 2. Flagship.fyi (Oct 2023 - "A honest reflection of SocialFi: greed and dystopia")
> "SocialFi's economic model, despite modern terminology, echoes the characteristics of a Ponzi scheme... where earlier investors' returns are funded by newer entrants."

Key points:
- "3,3" (buy my ticket if I buy yours) mirrors Olympus DAO's failed incentive model; depends on perpetual new users
- "Selling or shorting friends stirs deep ethical concerns" - Eric Walls asked "If you could short people on FriendTech, would you kill your friends?" (highlights moral hazard)
- "Rush to copy without security" - Stars Arena's haste to compete with Friend.tech resulted in $3M hack
- **Sustainability question:** "For SocialFi to truly flourish... must address scalability and economic sustainability."

**Verdict:** Structural critique. Even with new team, ponzi dynamics remain.

#### 3. BULB Community Review (May 2026 - "The Social Media Stock Market is Real")
> "The biggest pro is the incentive alignment... the con side is significant. Because there is money involved, the vibes can get stressful... bot problem is constant... token volatility is a rollercoaster."

**Honest assessment:**
- Pro: creators earn from ticket trades, no platform intermediary
- Con: if creator stops posting, ticket price tanks (financial risk in social interaction)
- Con: bots spam 24/7; constant arms race
- Con: $ARENA token has swung wildly since launch; users exhausted by volatility

**Verdict:** Realistic. Community-sourced, not shilling.

#### 4. HattyHats (May 2026 - BULB essay on Arena as "stock market")
> "It launched in late 2023 as Stars Arena on Avalanche and immediately went nuclear... just days after launch, smart contract exploit... but the community refused to let it die."

**Nuanced take:**
- Acknowledges recovery was genuine community effort (Jason Desimone + team)
- Recognizes that "incentive alignment" is real - creators have reason to provide value
- Notes vesting schedule "10% released initially, 90% vesting monthly" is strategic move to prevent dumps
- Also notes: "bot problem is constantly being escalated," "toxic vibes," "financial risk," "token swings"

**Verdict:** Balanced but skeptical. Acknowledges comeback while flagging persistent risks.

---

## Security & Regulatory Risks

### Smart Contract Risk Since 2023 Hack

**Status as of May 2026:**
- Post-hack: Paladin Blockchain Security conducted audit (Oct 2023); contracts rewritten
- V2 (2024-2025): Added launchpad + DEX (ArenaDEX, Uniswap v2 fork)
- No public record of further exploits or major incidents (2024-2026)
- Team is small (13 people); likely limited security resources for ongoing monitoring

**API/SDK Risk:**
- @the-arena/arena-app-store-sdk v0.2.4 (Aug 2025) explicitly in ALPHA
- 104 weekly npm downloads (very low adoption)
- 4 versions in 6 months; breaking changes expected
- Wagmi v1/v2 connectors immature (v0.2.4 released Jan 2026)

**Assessment:** Core smart contracts appear stable post-audit. But SDK/integration layer is early-stage. Integration risk for ZAO is MEDIUM.

### Regulatory Risk: Securities Classification

**The question:** Are creator tickets securities under U.S. law?

**Howey Test analysis (4-prong test for securities):**
1. Investment of money - YES (users buy tickets with AVAX)
2. Common enterprise - YES (all ticket holders depend on same creator's activity)
3. Expectation of profits - YES (creator fees + trading fees are promoted as income streams)
4. From efforts of others - BORDERLINE (creator's activity drives ticket value; token appreciation depends on broader network)

**Conclusion:** Tickets likely meet 3-4 prongs of Howey test. Could be classified as unregistered securities.

**Why no enforcement yet:**
- SocialFi platforms are decentralized; hard to identify responsible entity
- Regulatory agencies (SEC) prioritizing larger targets (Celsius, FTX, Crypto.com)
- Ambiguity: are "creator tickets" different from "social tokens"? No clear precedent

**For ZAO:**
- Profiles on Arena: SAFE (personal brand, not security)
- Launching token on Arena launchpad: HIGH RISK (issued token could be deemed security)
- Gating exclusive ZAO content behind Arena tickets: MEDIUM RISK (ticket purchase could be deemed investment)

**Mitigation:** Treat Arena as discovery/distribution channel. Do NOT issue ZAO tokens via Arena. Do NOT gate premium content behind Arena tickets.

---

## The Builder Angle: Arena SDK & Integration Feasibility

### Current State of Arena Developer Ecosystem (May 2026)

**SDK Availability:**
1. **@the-arena/arena-app-store-sdk** (NPM, v0.2.4)
   - Wallet connection via WalletConnect (Reown)
   - User profile data access
   - Arena API method calls
   - Wagmi v1/v2 connectors available

2. **Arena API (undocumented; inferred from SDK)**
   - No published REST API docs (unlike Farcaster, Lens)
   - SDK abstracts calls via `sendRequest("methodName")`
   - Methods observed: getUserProfile, send AVAX transactions, get balance

3. **Third-party integrations:**
   - Arena Agent Plugin (OlaCryto, GitHub) - 176 MCP tools for AI agents; 78 tools for Arena social (chat, threads, feed, notifications, stages, shares)
   - Payer Tiger (tapilew, GitHub) - monetization toolkit for X + Arena, uses Sherry SDK + Crossmint WaaS

**Developer Adoption:**
- Arena App Store SDK: 104 weekly npm downloads (for comparison: Wagmi gets 50K+ weekly)
- Third-party plugin ecosystem: small but active (AI agents, payment tools)
- No published API docs; integration knowledge is scattered

**Obstacles for ZAO Integration:**
1. **No public API documentation.** To build a ZAO-specific app on Arena (e.g., ZAO creator profiles + referral widget), would need to reverse-engineer SDK or request docs from team
2. **SDK is alpha.** Breaking changes expected; no stability guarantee
3. **No clear monetization model for integrated apps.** (Unlike Farcaster Frames, which get fee-sharing options)
4. **Small developer community.** Limited public examples; may need custom integration work

**Feasibility:** 3-4 weeks to build a ZAO creator profile + referral widget using Arena SDK. Not trivial, but doable. Cost: ~$10-15K dev time.

**ROI calculation (from Doc 573):**
- Referral rewards: 5% of referred user's trading volume
- Typical ZAO community: 188 members
- If 10 ZAO leaders create Arena profiles and refer 100 users each: 1,000 referred users
- If each referred user trades $1,000 over 6 months: $1M volume
- 5% referral = $50K (split among 10 referrers = $5K per leader)

**Reality check:** ZAO community is small (188 members). Referral rewards would be in $5-10K range, not transformative. Arena integration is a "nice to have," not a core business driver.

---

## Farcaster vs. The Arena: Strategic Choice

### Why Farcaster (despite current challenges) is stronger for ZAO:

| Dimension | Farcaster | The Arena |
|-----------|-----------|----------|
| **DAU** | 800K+ (largest of any SocialFi) | ~35-50K (estimated from TVL) |
| **App ecosystem** | 100s of apps (Frames/mini-apps) | <50 apps |
| **Creator revenue** | Pro subscription ($120/yr) + Rewards pool ($25K+/week) | Trade fees + launchpad (ponzi-dependent) |
| **VC backing** | Neynar acquisition ($1B valuation) | $2M pre-seed only |
| **Builder experience** | Mature Frames SDK, good docs | Alpha SDK, minimal docs |
| **Regulatory risk** | Lower (protocol, no token to users yet) | Medium (tickets could be securities) |
| **Community vibes** | Builder-focused, positive | Speculative, mercenary, botted |

**ZAO's strategic choice (recommended):**
- **Primary:** Farcaster (via Frames or upcoming Mini Apps v2) for distribution + creator engagement
- **Secondary:** The Arena (profiles + referral) for Avalanche ecosystem + occasional promotions
- **Do NOT:** Bet treasury capital or core monetization on either

---

## Next Actions & Monitoring Metrics

| Action | Owner | Frequency | Key Metric |
|--------|-------|-----------|-----------|
| Monitor The Arena TVL + 30-day volume | ZOE agent | Weekly | If TVL drops below $5M or 30-day vol < $150M, escalate to Zaal |
| Monitor $ARENA token price + vesting schedule | Community | Weekly | If $ARENA < $0.01 or daily volume < $500K, liquidity risk |
| Monitor Farcaster Frames adoption + revenue | ZOE agent | Monthly | Frames revenue, DAU trends, mini-app ecosystem growth |
| Assess Arena SDK stability + breaking changes | ZOE agent | Monthly (check GitHub releases) | SDK version churn, npm download trend |
| Collect community sentiment (Reddit, CT, Dune) | ZOE agent | Monthly | Sentiment shift; flag if "exit" mentions spike 20%+ |
| Regulatory monitoring: SEC/FINRA guidance on social tokens | Zaal | Quarterly | Any new guidance on creator tickets / social tokens |
| Evaluate Avalanche ecosystem alternatives (DeSo, OpenSocial) | Team | Quarterly review | If Arena stalls, comparison with DeSo / OpenSocial ROI |

---

## Honest Assessment: Should ZAO Use The Arena?

### Short answer: YES, as a tertiary channel. NOT as a primary strategy.

### Reasoning:

**Pros (from Doc 573 + this research):**
- Avalanche ecosystem alignment (Retro9000 grants, Pharaoh liquidity)
- Creator fee splits (70% to creators) are genuinely favorable
- No sign-up friction (X auth -> instant wallet)
- Launchpad + DEX are unique value-adds vs. Friend.tech
- Recovered well from Oct 2023 hack; team is competent

**Cons (from this research):**
- Structural ponzi mechanics; user retention cliff is baked in
- Friend.tech precedent: 95%+ decline within months
- Small developer ecosystem + alpha SDK = integration risk
- Token speculation will dominate vibes; doesn't align with ZAO's "impact network" brand
- Regulatory risk undefined (may need legal review before launching token or gating content)
- Capital required ($5-25K for liquidity seed) has opportunity cost

**Recommended approach (combining Doc 573 + 708g):**

1. **Phase 1 (Q3 2026):** Zaal creates Arena profile; 10-15 ZAO leaders follow suit. Seed with $500 AVAX for referrals. Observe organic engagement for 2-3 months.
2. **Phase 2 (Q4 2026):** IF TVL stays >$8M and community sentiment stays positive, then bridge $ZABAL to Avalanche + list on Pharaoh. Else, deprioritize.
3. **Phase 3 (2027):** Only if Phases 1-2 show >$50K monthly referral revenue, consider dev effort for ZAO-specific integration (profiles, gating, etc.).
4. **Exit trigger:** If The Arena follows Friend.tech trajectory (90%+ TVL drop within 6mo), reallocate capital to Farcaster or Base ecosystem.

**Key principle:** Treat Arena as a **contingent bet on Avalanche ecosystem**, not a core monetization pillar. Diversify across Farcaster (primary) + Arena (secondary) + Base (ZAO's home chain).

---

## Sources

### SocialFi Graveyard & Collapse Analysis
- [Friend.Tech Developers Abandon Platform (The Defiant, Sep 2024)](https://thedefiant.io/news/defi/friendtech-transfers-control-to-ethereum-burn-address) [FULL]
- [Friend.Tech Creators Walk Away with $44M (DL News, Sep 2024)](https://www.dlnews.com/articles/defi/friend-tech-shuts-down-after-revenue-and-users-plummet/) [FULL]
- [Friend.Tech Gets Unfriended: 95% Transaction Drop (TechCrunch, Aug 2023)](https://techcrunch.com/2023/08-28/friend-tech-daily-transactions-drop/) [FULL]
- [Friend.Tech Devs Abandon Once-Hot SocialFi Platform (Bankless, Sep 2024)](https://www.bankless.com/friend-tech-dead) [FULL]
- [The Rise and Fall of FriendTech (CryptoPragmatist, Sep 2024)](https://cryptopragmatist.com/p/rise-fall-friendtech-cautionary-tale-web3-developers) [FULL]
- [The Decline of DeSoc (ForkLog, Sep 2024)](https://forklog.com/en/the-decline-of-desoc-friend-tech-abandons-smart-contracts-and-farcaster-stagnates/) [FULL]

### Stars Arena / The Arena Hack & Recovery
- [Avalanche Social App Stars Arena Drained of $3M (CoinDesk, Oct 2023)](https://www.coindesk.com/tech/2023/10-07/avalanche-social-app-stars-arena-drained-of-3m-in-avax-after-hack) [FULL]
- [Stars Arena Drained of $2.85 Million After Hack (Decrypt, Oct 2023)](https://decrypt.co/200533/stars-arena-hacked-avax-friend-tech) [FULL]
- [Hacker Returns 90% of Funds from Stars Arena Exploit (ForkLog, Oct 2023)](https://forklog.com/en/hacker-returns-90-of-funds-stolen-in-stars-arena-hack/) [FULL]
- [Stars Arena Incident Analysis (CertiK, Oct 2023)](https://www.certik.com/blog/stars-arena-incident-analysis) [FULL]
- [SocialFi Platform Stars Arena Cries 'Coordinated FUD' (BeInCrypto, Oct 2023)](https://beincrypto.com/stars-arena-dodge-exploit/) [FULL]

### Community Sentiment & Criticism
- [Stars Arena Deep Analysis: A Honest Reflection (tactical_retreat, Oct 2023)](https://tactical.deepwaterstudios.xyz/p/stars-arena) [FULL]
- [A Honest Reflection of SocialFi: Greed and Dystopia (Flagship.fyi, Oct 2023)](https://flagship.fyi/outposts/dapps/a-honest-reflection-of-socialfi-greed-and-dystopia/) [FULL]
- [What Is Stars Arena? Are Influencer SocialFi Platforms Safe? (The Chainsaw, Oct 2023)](https://thechainsaw.com/finance/what-is-stars-arena-socialfi-safe/) [FULL]
- [The Arena: A SocialFi Comeback Story (Cryptomancer, Oct 2024)](https://cookoutclub.substack.com/p/the-arena-a-socialfi-comeback-story) [FULL]
- [The Social Media Stock Market is Real (BULB, May 2026)](https://www.bulbapp.io/p/606888b9-58eb-496e-a79f-0df9404ac7f7/the-social-media-stock-market-isreal) [FULL]

### Current Arena Status & Developer Ecosystem
- [Arena SocialFi: Revolutionizing Tokenized Creator Economies (Gate News, Sep 2025)](https://www.gate.com/news/detail/13985391) [FULL]
- [Inside The Arena: Avalanche's SocialFi Platform (Team1 Blog, Jul 2025)](https://www.team1.blog/p/inside-the-arenas-socialfi-platform-for-creators) [FULL]
- [Arena App Store SDK (NPM, v0.2.4, Aug 2025)](https://registry.npmjs.org/@the-arena/arena-app-store-sdk) [FULL]
- [Arena Agent Plugin for AI (OlaCryto, GitHub, Mar 2026)](https://github.com/OlaCryto/arena-agent-plugin) [FULL]
- [Payer Tiger: Monetization Toolkit (tapilew, GitHub, Jun 2025)](https://github.com/tapilew/payer-tiger) [FULL]
- [The Arena Raised $2M Pre-Seed (CoinCarp, Oct 2024)](https://www.coincarp.com/fundraising/arena-preseed/) [FULL]

### Competitor Analysis
- [SocialFi Explained: Best Decentralized Social Platforms 2026 (CryptPulse, Mar 2026)](https://www.cryptpulse.in/2026/03/socialfi-explained-best-decentralized.html) [FULL]
- [DeSo Review 2026: Guide to Key Features (XYZEO, Feb 2026)](https://xyzeo.com/product/deso) [FULL]
- [What Is SocialFi: Complete Guide to Crypto Social Media 2026 (DEXTools, Apr 2026)](https://www.dextools.io/tutorials/what-is-socialfi-crypto-social-media-guide-2026) [FULL]
- [The SocialFi Resurrection: Leadership Shakeups & Vitalik Endorsement (BlockEden, Mar 2026)](https://blockeden.xyz/blog/2026/03/13/socialfi-2026-resurrection-decentralized-social-onchain-identity-mass-adoption/) [FULL]
- [OpenSocial vs Farcaster vs DSCVR vs Lens (Gate Learn, Jan 2025)](https://www.gate.com/learn/articles/comparison-of-open-social-farcaster-dscvr-and-lens/5866) [FULL]
- [Farcaster vs Lens Protocol: $2.4B Battle (BlockEden, Jan 2026)](https://blockeden.xyz/blog/2026/01/15/farcaster-vs-lens-socialfi-web3-social-graph/) [FULL]
- [The Strategic Shift in Onchain Social Infrastructure (AInvest, Jan 2026)](https://www.ainvest.com/news/strategic-shift-onchain-social-infrastructure-farcaster-wallet-centric-growth-2601/) [FULL]
- [RCSC vs DESO: Decentralized Social Platform Comparison (Phemex, Apr 2026)](https://phemex.com/academy/rcsc-vs-deso-decentralized-social-comparison) [FULL]
- [The Future of Decentralized Social Networks Explained (NadCab, Apr 2026)](https://www.nadcab.com/blog/decentralized-social-networks-explained) [FULL]
- [Lens vs Farcaster: Comparison (Gate Learn, Apr 2024)](https://www.gate.com/learn/articles/lens-vs-farcaster-the-battle-of-web3-social-media-platforms/2554) [FULL]

### Scam/Phishing Warnings (out of scope, but included for completeness)
- [$ARENA Airdrop Scam Removal Guide (PCRisk, Jun 2025)](https://www.pcrisk.com/removal-guides/33138-arena-airdrop-scam) [FULL - warns of fake arena-rewards[.]xyz + arena-allocation[.]xyz phishing]

---

## Summary for Zaal

The Arena (formerly Stars Arena) is a **genuine comeback story** from a near-fatal Oct 2023 hack. The new team (Jason Desimone, Phillip Liu Jr.) executed a solid recovery: rewrote smart contracts, obtained audit, added V2 features (launchpad + DEX), and integrated into Avalanche ecosystem. As of May 2026, The Arena shows ~$8.2M TVL and claims "viral growth."

**However, three structural risks remain:**

1. **Ponzi mechanics are intrinsic.** User retention depends on new entrants buying tickets. Once growth plateaus (as happened to Friend.tech within weeks), collapse cascades. ZAO should NOT bet treasury or core strategy on this.

2. **Regulatory uncertainty.** Creator tickets may be classified as unregistered securities. SEC has not acted, but the surface is large. ZAO should avoid gating content or issuing tokens via Arena.

3. **Mercenary capital dominates the vibe.** Community is optimized for speculation ("pump your ticket and dump"), not creator quality or community building. This misaligns with ZAO's "decentralized impact network" brand.

**Recommendation:** Use The Arena as a **tertiary distribution channel** (profiles + referrals), NOT as a primary revenue or monetization pillar. Parallel investment in Farcaster (larger DAU, healthier ecosystem) is higher ROI. If Arena TVL drops 50%+ within 6 months (Friend.tech precedent), reallocate capital.
