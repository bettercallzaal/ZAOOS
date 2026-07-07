---
topic: farcaster
type: market-research
status: research-complete
last-validated: 2026-07-07
superseded-by:
related-docs: 84, 073, 308, 306, 527, 468, 587, 891, 278
original-query: "Research how apps/tokens grew on Farcaster (distribution playbooks, what worked) + read the Farcaster agentic bootcamp docs. Apply to growing $zaalcaster - a personal open-source Farcaster client with a support/attention token (earn-by-contributing + hold-for-standing blend, reply-queue boosts, Clanker/Empire launch rail, Monday 2026-07-13 target)."
tier: DISPATCH
---

# 987 - $zaalcaster Support-Token Growth Playbook

> **Goal:** How to launch and grow $zaalcaster - a support/attention token for Zaal's open-source personal Farcaster client - using what actually made Farcaster apps and tokens grow (and what killed the rest).

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Core mechanic is de-risked | SHIP IT - the shape is proven | Bountycaster pushed $1.5M through 2,967 in-feed paid actions with a credible human curating. Noice already runs "personal token burns when someone requests your action + tip." $zaalcaster = the same shape. Not novel = not risky. |
| 2 | Launch rail | Clanker v4 NOW, not waiting for v5 | Clanker is first-party (Neynar-owned), $7.62B volume, v4 gives 0.2% WETH fee routed to the creator - that fee stream IS a treasury separate from tips. v5 timing is a nice-to-have, not a blocker. |
| 3 | Your 50% self-hold | REDUCE or LOCK-LONG + publish it | Founder holding 50-70% is the #1 documented "grifty" red flag. DEGEN/Noice did community-weighted distribution + small locked founder share. Either cut to ~10-15% or lock the 50% 2-4yr with a public vesting contract and say so loudly. |
| 4 | Earn side (contributor rewards) | Deterministic retroactive, NOT airdrop | Cassie Hart / Hypersnap model + the whole Farcaster ethos: "you did X, formula grants Y" reads legit; surprise airdrops read as farming bait. Aligns with ZAO Respect. |
| 5 | Anti-spam floor | Min hold ~1,000 $zc to enter queue + 1 free bump/day (non-stackable) + reputation weighting | The single biggest difference between DEGEN (486k holders, 3yr retention) and dead pump tokens. Non-stackable daily cap tripled tips-per-capita in the research. |
| 6 | Ranking formula | tokens_held x neynar_score x mutual-follow, THEN your judgment | Prevents whale-spam (the thing that makes a queue useless). You already read all three signals in zaalcaster. Keeps "I'm the final ranker" real. |
| 7 | Growth engine | The open-source repo + build-in-public casting IS the marketing | Dan Romero grew Farcaster "doing things that don't scale." The reply itself is a shareable receipt (flex/invite loop). Don't market the token; let the mechanic + repo generate content. |
| 8 | Study/interop | Look hard at Noice before building tip-processing | Noice (live, via Clanker) already does personal-token-burns-on-request. Building on / interoperating with it may beat rebuilding the money plumbing for Monday. |

## Findings

### A. The core mechanic is already proven on Farcaster (twice)
- **Bountycaster** (Linda Xie / @pirosb3): post a task + cash reward, others claim/deliver/get paid, ALL inside a Frame. $1.5M across 2,967 bounties by 2026. Lesson: embed the paid action in-feed + let a credible human's reputation seed it. $zaalcaster is "Bountycaster where the bounty is a person's attention."
- **Noice** (live, launched via Clanker May 2025): personal tokens ($tk) that **burn when someone requests your action** (a like, a reply); requests carry an attached tip; top tipper/day gets +100 USDC. This is ~80% of the $zaalcaster reply-queue mechanic, already live and working. 30% supply locked 1mo, 20% airdrop at launch (trust signal).

### B. What made Farcaster tokens durable (DEGEN as the gold standard)
- $120M+ mcap, 486,385 holders (Oct 2025), 3+ year retention, became the default mini-app token over USDC/WETH.
- The mechanics that did it: (1) **daily non-stackable allowance** - you lose nothing by spreading it, kills hoarding, incentivizes sharing (tripled tips-per-capita vs unlimited); (2) **staking gate** (10k, 3mo lock) = commitment signal + sybil resistance; (3) **P2P tipping visible in-feed** ("69 $DEGEN") = every tip is a broadcast; (4) **cube-root follower scoring** = whales can't game the reward pool.
- Academic backing (ACM MOMACS 2025, "Beyond Single-Tokenomics"): durable tokens have multiple value-capture pathways, utility beyond speculation, community governance, and are **embedded in platform functionality** rather than standalone financial instruments. Multi-token ecosystems had 5x fewer boom-bust cycles.

### C. What killed the rest
- **friend.tech**: keys = access to influencer chat. Zero utility beyond speculation. When buying stopped, only exit was selling into the curve. Deposits -92%, token -98%, creators exited (irreversible) by Apr 2026.
- **pump.fun**: creator fees didn't align with holders - "fee recipients weren't the same people holding/trading." Incentive divorced from action. 80% launch-rate drop.
- **Most Clanker tokens**: token-first, no utility. "Single friend-group burst then volume collapses." 21,870 launched in ONE day (Feb 2026) - a graveyard. The survivors (Bankr, Noice, WYDE) all bound the token to a real utility flow.
- **The lesson that protects $zaalcaster**: it has utility from second one (access to a working client + a real reply). That is the moat over the graveyard.

### D. Distribution playbook (how Farcaster apps actually got users)
- **Frames/Mini-apps = zero-friction discovery**: Frames v1 (Jan 2024) drove 1,722% DAU growth over 5 months. Bracket, Build, Bountycaster hit traction "almost entirely through Frame embeds," no paid marketing.
- **The 5 growth loops**: (1) Claim+Flex+Invite receipt loop, (2) Weekly Drop+Streak, (3) Collab Quest, (4) One-Tap Utility (shareable output), (5) Notification Re-engagement (only ping with a clear next step).
- **Channels**: post in 2-3 niche channels max (/zao, /wavewarz, /founders); volume kills reputation, relevance builds it.
- **Build-in-public**: cast the build, gather feedback, followers become evangelists who recast the launch. The repo is the pitch.
- **Reality check**: Farcaster is ~40-100k engaged users (down from ~104k peak), high-quality crypto-native builders. Niche-over-scale is correct positioning. Do NOT chase DAU.

### E. Aligned vs grifty (the reputation knife-edge)
- **Aligned signals**: multi-token ecosystem, fee recycling (buyback/burn), creator-controlled fees, transparent leaderboard criteria, utility binding, community-weighted distribution, small + locked founder allocation.
- **Grifty signals**: founder holds 60-70%, unlimited/no-floor tipping (pay-to-spam), token-price-only value, silence on splits, rug vector, single-use "buy to rank today" with no compounding.
- **The framing that works**: "Hold $zaalcaster to get standing in my reply queue. X% of fees fund a community pool you vote on. I hold Y% (locked Z years). Contributors earn it by adding value." vs the grifty "buy to rank, no caps, no transparency."

### F. Anti-spam floor - what people converged on
- Minimum tip floor: 0.2 USDC (Farcaster tips) to 1-2 USDC (Noice).
- Reputation weighting: follower cube-root, verified/power badge, mutual follows.
- Proof-of-personhood (Gitcoin Passport) to gate the initial claim (~95% sybil reduction in LayerZero/Berachain precedent).
- Staking gate + non-stackable daily allowance.
- **For $zaalcaster**: hold ~1,000 $zc to enter the priority queue; 1 free bump/day, extra bumps cost (non-stackable); rank = tokens x neynar_score x mutual, then Zaal's judgment.

## The $zaalcaster growth plan (synthesis)

1. **Utility-first framing** - lead every message with "the token does something" (reply access to a working, open client), never "the token exists."
2. **Launch on Clanker v4** - the launch is itself a cast (native content moment); the 0.2% creator fee becomes an ongoing treasury separate from tips.
3. **Distribution allocation, not self-hold** - reduce the 50% self-hold or lock it long + publish the vesting. Weight early distribution to your real graph (top engagers, mutuals, best-friends - all readable in-app) via deterministic retroactive grants, not a splashy airdrop.
4. **The reply is the receipt** - when you reply to a boosted cast, the backer gets a shareable "backed via $zaalcaster" moment -> flex -> their audience discovers the tool. Build the flex/invite loop into the mechanic.
5. **Earn = contribution** - valuable PRs, suggestions that ship, shares that drive real signups earn $zc by a stated formula at your judgment. "Add value, own a piece."
6. **Anti-spam floor from day 1** - min hold + non-stackable daily bump + reputation weighting, so it never becomes pay-to-spam (the thing you explicitly want to avoid).
7. **Cast the build** - the open-source repo + build-in-public is the growth engine; 2-3 channels; only notify with a clear next step.

## Also See
- [Doc 84](../../agents/084-farcaster-ai-agents-landscape/) - Clanker landscape, bot distribution, best practices
- [Doc 527](../505-zlank-online-builder-spec/) - Zlank token-launch paths (Clanker / Zora Coins / Empire)
- [Doc 468](../../agents/468-zao-farcaster-hub-poidh-hypersub-dual-hub/) - Hypersub subscription mechanics
- [Doc 891](../../agents/891-farcaster-agentic-bootcamp-zol/) - Farcaster agentic bootcamp shipping patterns
- [Doc 587](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/) - anti-airdrop / deterministic-distribution ethos, no Farcaster protocol token

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide 50% self-hold: cut to ~10-15% OR lock 2-4yr with a public vesting contract - reply-list PR blocked until locked | @Zaal | Decision | 2026-07-10 |
| Evaluate Noice interop vs build-from-scratch for tip/burn plumbing (spike doc or 30-min read) - PR the decision to zaalcaster CLAUDE.md | @Zaal | Investigate | 2026-07-10 |
| Ship the reply-list feature (submit form + balance read + ranked queue + reply-marks-delivered) as a PR to zaalcaster, read-only + wallet-signs-own-tip, no contract deploy | @Zaal | PR | 2026-07-13 |
| Lock token config (Clanker v4 params, supply, distribution %, floor=1000 hold, 1 free bump/day, rank formula) in a zaalcaster TOKENOMICS.md | @Zaal | PR | 2026-07-12 |
| Polish the public repo README (what it is, how to fork, the token pitch: utility-first) | @Zaal | PR | 2026-07-12 |
| One-pager + landing for the Monday launch | @Zaal | Page live | 2026-07-13 |

## Sources

Internal (ZAO research library, read FULL): docs 84, 073, 308, 306, 527, 468, 587, 891, 278.

Web (via research subagents 2026-07-07):
- [Going DEGEN - Designing Tokenomics](https://designingtokenomics.com/designing-tokenomics-blog/going-degen-the-degen-token-thats-taken-farcaster-by-storm) [FULL]
- [Degen token - Matcha Blog](https://blog.matcha.xyz/article/degen-token-on-farcaster) [FULL]
- [Noice: Unlocking Social Finance - Neynar](https://neynar.com/blog/noice-unlocking-the-new-era-of-social-finance) [FULL]
- [Creator Rewards & Fees - Clanker Docs](https://clanker.gitbook.io/clanker-documentation/general/creator-rewards-and-fees) [FULL]
- [Farcaster Acquires Clanker - The Defiant](https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot) [FULL]
- [Friend.tech Shuts Down - DL News](https://www.dlnews.com/articles/defi/friend-tech-shuts-down-after-revenue-and-users-plummet/) [FULL]
- [Why Pump.fun Tokens Crash - Yellow](https://yellow.com/learn/pump-fun-token-crash-explained) [FULL]
- [5 Farcaster Frames Growth Loops - Medium](https://medium.com/@bhagyarana80/5-farcaster-frames-growth-loops-worth-stealing-1dec934f8923) [FULL]
- [How to Build Viral Mini Apps - Neynar Docs](https://docs.neynar.com/docs/mini-app-virality-guide) [FULL]
- [The Farcaster Growth Playbook - Safary](https://blog.safary.club/p/the-farcaster-growth-playbook) [FULL]
- [Beyond Single-Tokenomics (ACM MOMACS 2025)](https://arxiv.org/pdf/2511.00827) [PARTIAL - abstract + key findings, full PDF not deep-read]
- [Proof-of-Personhood: Solving Sybil Attacks](https://digitap.app/news/guide/proof-of-personhood-solving-sybil-attacks) [FULL]
- [Farcaster in 2025: The Protocol Paradox - BlockEden](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/) [FULL]
