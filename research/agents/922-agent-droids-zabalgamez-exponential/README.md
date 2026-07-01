---
topic: agents
type: decision
status: research-complete
last-validated: 2026-06-30
related-docs: 084, 281, 262, 268
original-query: "DEEP (DISPATCH). AI bot agents + tokens on Farcaster, and how a fleet of agents could be EXPONENTIAL for ZABAL Gamez. Ground in Clanker Droids. ZABAL is tokenless by design, already runs ZOE + Zol bot + Empire Builder + Bonfire bot. Decision pre-made: launch a standalone zabaldroid (no token) as a buildathon concierge. Dispatch sub-agents on: agent-token economy, droid economics/runway, brand/positioning, the exponential fleet play, risks. Output prioritized do-next + honest exponential-vs-hype verdict."
tier: DISPATCH
---

# 922 - Agent droids for ZABAL Gamez: the exponential play, and why not Clanker

> **Goal:** Decide how ZABAL Gamez should use AI agents. Five-agent DEEP dispatch on the
> Clanker droid economy, droid economics, brand fit, the fleet/exponential play, and risk.
> Honest verdict, scoped to a tokenless free build event.

## Key Decisions (do these first)

| # | Decision | Why |
|---|----------|-----|
| 1 | DO build a zabaldroid concierge. SKIP launching it through Clanker. | The agent idea is right. The Clanker vehicle is wrong for a tokenless brand - Clanker IS a token-launch tool, its tokens fail ~99% in 48h, and "we launched on Clanker" reads as memecoin-adjacent even with no token. Build self-hosted instead. |
| 2 | BUILD it self-hosted on Neynar, brained by the ZOE/Zol stack you already run. | Full control of voice + safety, no Clanker memecoin optics, no token signal, and it composes with ZOE + Empire Builder + Bonfire. This is also what "through ZOE/Zol" originally meant - a Clanker droid can't do that (Clanker hosts its own brain). |
| 3 | Make the droid a friction-remover, not a poster. Measure retention + shipping velocity, NOT casts. | The real exponential is keeping June attendees active in August (target 70% vs the 20-30% norm) and shipping 2-3x faster - not viral bot posts. Agents-alone = slop (Moltbook: 1.5M agents, only 17K humans). |
| 4 | Compose the existing bots into a 4-agent fleet with clean division of labor. | ZOE onboards -> Empire Builder ranks ships -> Zol bot pays micro-bounties -> zabaldroid runs event/recording coordination. Each feeds the next; no overlap. |
| 5 | If you still want the Clanker standalone droid for speed: treat it as a throwaway experiment, fund it ($500 = 1-3 months), human-confirm every cast, and never let it go silent. | Unfunded droid = looks abandoned = worse than not launching. A tokenless brand on Clanker also carries the optics tax in #1. |

## The honest verdict: exponential vs hype
Agents are exponential for ZABAL **only** if they remove a concrete builder bottleneck (onboarding,
ship-visibility, micro-payouts, recording/indexing) and you measure outcomes. They are NOT
exponential as social-growth posters - that path is Moltbook (1.5M agents, ~17K real humans, a
public security breach, dismissed as slop). Clanker's own proof point cuts the same way: agents
generate real value when wired to outcomes ($LUM hit $80M in a week via Clanker automation),
and pure agent chatter generates noise. ZABAL's edge is that its agents can be tied to real
builder outcomes (ship, earn ZOLs, get a recording shipped) with humans owning judgment.

## Findings (with numbers)

**The economy is real but past its peak, and Farcaster itself is wobbling.**
- Clanker: $13.8B all-time volume, 436K+ tokens deployed, but the CLANKER token is -89% from ATH and daily volume settled to ~54% of the Feb 2026 peak. ~99% of Clanker tokens fail to hold liquidity 48h; under ~20 ever reached $100K mcap.
- Neynar acquired Farcaster (Jan 21, 2026). Farcaster DAU fell ~40% and revenue ~85% through late 2025; founders publicly said the model "doesn't work" pre-acquisition. Bot inflation is 10-15x humans (reported DAU 40-60K vs ~4,360 power-badge users).

**Economics of a standalone (no-token) droid.**
- Burn ~$150-600/month (LLM inference + Farcaster API + state + gas). A $500 USDC top-up = ~1-3 months runway; it pauses at zero and reads as abandoned.
- A token would only self-fund the droid at ~$100K/month trading volume (0.4% creator LP share covering ~$400/mo). ZABAL has no path to that volume and no reason to want it. Standalone/top-up is correct; the cost is small and predictable.

**Brand fit: tokenless + Clanker is contradictory.**
- Clanker's entire product is token deployment; Farcaster's own stated reason for no token is "to avoid speculative activity that attracts bots." Launching a ZABAL agent via Clanker signals the opposite of the brand. Farcaster's trusted utility bots (@remindme, @events, @ballot, @paragraph) are token-free and community-accepted - the model to copy.
- Legal: Air Canada (Feb 2024) was held liable for its chatbot inventing a refund policy. A brand owns what its agent says. That mandates human-confirmed casts + sandboxed replies.

**Risk reality (the skeptic pass).**
- Saturation: standard Farcaster user behavior is "mute aggressively." A generic, unfunded, or spammy droid is invisible within weeks.
- Prompt injection: ~94% of agents are vulnerable (Straiker); Moltbook's autonomous repliers executed injected prompts. Autonomous replies MUST be sandboxed (no external actions) and rate-limited.
- Optics tax: memecoin-association even when tokenless. Mitigate with explicit "no token, free build event" messaging baked into the voice (already done in the zabaldroid voice draft).
- Regulatory: GOOD news - SEC/CFTC exempted meme coins from securities registration (Mar 17, 2026), so a tokenless droid carries zero securities risk.

## The fleet design (the compounding part)

| Agent | Job | Why it (and not another) |
|-------|-----|--------------------------|
| ZOE | Onboarding + track routing (3-question intake, "go to this workshop") | Only conversational agent; others are mechanical |
| Empire Builder | Ship tracker + leaderboard (commits tagged, "shipping this week" cast) | Built for reputation math; tokenless leaderboard already live |
| Zol bot | Micro-bounty routing + ZOL payouts ($5-20 tasks) | Tied to the ZOL economy; keeps builders earning through the Aug lull |
| zabaldroid | Event/recording coordination (going-live posts, speaker/recording indexing, registrant reminders) | Needs Farcaster webhooks + the recording pipeline; frees ~4-6h human overhead per workshop |

Compounding loop: ZOE onboards -> first ship shows on Empire Builder -> Zol bot offers a bounty
-> zabaldroid ships their recording -> repeat. The leverage is friction removal, so more builders
stay active and ship faster, which is the only honest exponential here.

## Codebase ground truth
ZABAL already runs the agent surface this builds on: `api/bonfire-ask.mjs` (the Bonfire bot Q&A),
`api/empire-leaderboard.mjs` (the tokenless Empire Builder read), and `assets/miniapp.js`
(`window.ZABAL` composeCast/viewProfile helpers). A self-hosted zabaldroid slots in here, not on Clanker.

## Also See
- [Doc 084](../084-farcaster-ai-agents-landscape/) - Farcaster AI agents landscape
- [Doc 281](../281-farcaster-agents-landscape-registration/) - agent registration
- [Doc 262](../262-virtuals-protocol-agent-rail/) - Virtuals agent rail
- [Doc 268](../268-milady-ai-elizaos-evolution/) - ElizaOS evolution

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build zabaldroid self-hosted on Neynar (own FID), brained by ZOE/Zol; do NOT launch via Clanker | @Zaal | Build | July |
| Reuse the drafted zabaldroid voice (ZM, no-emoji, no-em-dash, "no token" denial baked in) | @Zaal | Config | With build |
| Sandbox autonomous replies (no external actions, rate-limit, few-deep) + human-confirm all top-level casts | @Zaal | Build | Before live |
| Wire the 4-agent division of labor (ZOE/Empire/Zol/zabaldroid) so they compose, not overlap | @Zaal | Build | July-Aug |
| Define success metric: % of June attendees active in August + July project count - not cast volume | @Zaal | Decision | Before launch |
| If experimenting with the Clanker standalone droid anyway: fund $500, human-confirm casts, monitor first 10 casts, kill-switch ready | @Zaal | Experiment | Optional |

## Addendum (2026-06-30): AIRGAP, x402, and the honest partner reframe
New input: Zaal has a founder relationship with AIRGAP (Zin0x) and wants to launch a zabaldroid
"through AIRGAP", noting Neynar now owns both Farcaster and Clanker (one native stack). This
updates - but does not overturn - the verdict.

- **What AIRGAP actually is:** a market-intelligence agency, not a droid launcher. Its product is
  9 monitoring agent types (X Monitor, Farcaster Intel, Launch Scanner, Wallet Watcher, Account
  Stalker, Contract Monitor, Discord/Telegram Monitor, Custom). Wallet-native (SIWE), funded per-poll
  in USDC via x402, signals route to Telegram/webhook/in-app, $AIRGAP holders get free usage. Its
  docs do NOT cover "launch a droid" - **Gappy ($GAPPY) is a Clanker-rails showcase droid, in the
  first Clanker Droid cohort, funded by a $1000 CEF grant.** So "launch through AIRGAP" is undefined -
  confirm with Zin0x whether it grants AIRGAP's monitoring capabilities or is just his help on the
  Clanker deploy flow.
- **x402 (the autonomous-compute mechanic):** Coinbase's HTTP-402 protocol - an agent pays USDC
  per API call (~200ms settle, Coinbase facilitator free tier 1,000 tx/mo then ~$0.001/tx). This is
  how a droid funds its own compute with no human in the loop - the "autonomous revenue generator."
- **The ZHC thesis is real but early (Galaxy, Mar 2026):** "Zero-Human Companies" - agents that
  earn real onchain revenue; the token is "the account the agent spends from" (Zin0x's exact line).
  Felix Craft cleared $120K in 30 days from product lines, not token fees - but that is the rare
  exception; most agent-tokens still just extract.
- **The Neynar point is fair:** Neynar owning Farcaster + Clanker makes this the native stack, not a
  fringe launchpad - it softens doc 922's memecoin-optics objection for a NO-TOKEN droid.

**Reframed ZABAL play (the genuinely good use, still tokenless):** the highest-value AIRGAP
capability for a build event is not a token-droid - it is the **monitoring agents as the buildathon
nervous system**: a Farcaster Intel + Custom agent watching the /zabal channel and #zabalgamez for
new builders, ships, and questions, routed to the team's Telegram so no builder is ever missed. Pair
that with the no-token zabaldroid concierge for the human-facing voice. Net: experiment freely with a
no-token droid (low stakes, on-brand), and separately trial AIRGAP's intel agents for the real
leverage. Also worth a shot: apply for a Clanker CEF "Fresh Clank" builder grant like AIRGAP got.

## Sources
- Gate Wiki - What is Clanker (AI token launch on Base) - https://www.gate.com/crypto-wiki/article/what-is-clanker-clanker-and-how-does-its-ai-powered-token-launch-platform-work-on-base-20260106 [FULL]
- The Block - Clanker $13M revenue from 200K+ tokens - https://www.theblock.co/post/349549/clanker-team-earns-13-million-in-revenue-from-over-200000-tokens-on-base-in-just-five-months [FULL]
- The Defiant - Farcaster acquires Clanker (CLANKER +350%) - https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot [FULL]
- Neynar - Building AI agents on Farcaster - https://neynar.com/blog/building-ai-agents-on-farcaster [FULL]
- Clanker docs - creator rewards and fees (0.4% LP share math) - https://clanker.gitbook.io/clanker-documentation/general/creator-rewards-and-fees [FULL]
- Base - network fees - https://docs.base.org/base-chain/network-information/network-fees [FULL]
- Forbes - Moltbook: swarm intelligence or AI slop? (1.5M agents, 17K humans) - https://www.forbes.com/sites/the-prompt/2026/02/03/moltbook-swarm-intelligence-or-ai-slop/ [FULL]
- Fortune - Moltbook security disaster - https://fortune.com/2026/02/02/moltbook-security-agents-singularity-disaster-gary-marcus-andrej-karpathy/ [FULL]
- SEC - landmark crypto/meme-coin guidance (Mar 17, 2026) - https://www.sec.gov/newsroom/press-releases/2026-30-sec-clarifies-application-federal-securities-laws-crypto-assets [FULL]
- DL News - bots invading Farcaster - https://www.dlnews.com/articles/web3/farcaster-users-could-use-frames-and-nfts-to-stop-bots/ [FULL]
- Straiker - 94% of AI agents vulnerable to prompt injection - https://www.straiker.ai/blog/why-94-of-ai-agents-are-vulnerable-to-prompt-injection----and-what-to-do-about-it [FULL]
- InspectAgents - AI chatbot failures 2025-2026 (Air Canada, DPD, Taco Bell) - https://www.inspectagents.com [PARTIAL - aggregator; primary incidents (Air Canada ruling Feb 2024, DPD Jan 2024) corroborated by The Register + TIME]
- a16z - awesome-farcaster (utility bots: remindme, events, ballot, paragraph) - https://github.com/a16z/awesome-farcaster [FULL]
- LangChain - State of Agent Engineering (95% pilots fail, ROI data) - https://www.langchain.com/state-of-agent-engineering [FULL]
- CoinGecko - 2025 State of Memecoins report (failure rates) - https://assets.coingecko.com/reports/2025/CoinGecko-2025-State-of-Memecoins-Report.pdf [PARTIAL - summary stats]
- AIRGAP - site + docs/user-guide (9 agent types, x402 per-poll funding, signal routing) - https://airgap.finance/docs/user-guide [FULL]
- AIRGAP - Farcaster "CLANKER LEGION / Gappy droid" cast (Gappy fee routing, first Droid cohort) - https://farcaster.xyz/airgap/0x23125d69 [FULL]
- Coinbase - x402 protocol (agentic pay-per-call, HTTP 402, USDC on Base) - https://www.coinbase.com/developer-platform/discover/launches/x402 [FULL]
- Coinbase CDP - x402 facilitator (1,000 free tx/mo then $0.001/tx) - https://docs.cdp.coinbase.com/x402/welcome [FULL]
- Galaxy Research - Zero-Human Companies: agents earning onchain revenue (Felix $120K/30d) - https://www.galaxy.com/insights/research/zero-human-companies-ai-agents-defi-crypto [FULL]
- AInvest - Clanker $50M fee engine + CEF grants (14% CLANKER bought back) - https://www.ainvest.com/news/clanker-50m-fee-engine-recycler-price-flow-2604/ [FULL]
