# 2238 - Fleet research digest, August 2026

Ten research briefs answered via fleet relay 2026-08-05 to 08-07, preserved here so the work is greppable instead of chat-only. Each brief was web-grounded at answer time; sources inline. Sections ordered as asked.

---

## 1. MEV on L2s: does it exist, who captures it, small swaps

- L1-style public-mempool sandwiching is mostly dead on major L2s - Arbitrum/Base/OP run centralized sequencers with private mempools. Research (arxiv 2601.19570) finds sandwiching "rare, unprofitable, largely absent" there. What thrives: atomic arbitrage, liquidations, ordering races.
- Who captures: increasingly the CHAIN. Arbitrum Timeboost = sealed-bid auction for an express lane, revenue to the chain/DAO. OP Stack (Base) = priority-fee races, sequencer (Coinbase) collects. Searchers keep the arb spread; auctions tax the right to be first. Trust assumption: sequencer does not front-run its users; decentralization (multi-party sequencer late 2026, Superchain shared sequencing/Espresso) aims to replace that trust.
- Small swaps: sandwich risk near zero on blue-chip pairs (the private mempool protects, not the slippage setting); MEV is still paid indirectly via LVR-widened spreads and volatile-period priority fees. Hygiene: aggregators, tight slippage, avoid thin pools. This is also why small-ticket live trading (WaveWarZ-style) is viable off L1.
- Sources: docs.arbitrum.io/how-arbitrum-works/timeboost, thedefiant.io Timeboost article, arxiv.org/html/2601.19570, eco.com L2 sequencer explainers.

## 2. Solidity security 2026: top real exploit classes, last 12 months

- Macro: H1 2026 = most-hacked half-year by COUNT (~$1.3B / 344 incidents, CertiK) but dollars down 74% from 2022 peak. Structural shift: code bugs = most incidents, keys = most money (TRM: $444M across 33 wallet-compromise incidents vs $151M across 204 code incidents).
- Class 1 - privileged access / key compromise (~40% of H1 losses): Drift ~$295M (dev-machine malware), Humanity, Resolv, Wasabi, Gravity Bridge, Fluid, StablR, Polymarket. Lesson: timelocks, multisig on privileged functions, assume the admin key leaks.
- Class 2 - rounding/precision-direction: Balancer v2 ~$120M (Nov 2025) rounding-direction flaw; Cetus $223M overflow-check gap. Round against the user; fuzz math invariants.
- Class 3 - modern reentrancy (cross-contract/read-only): GMX V1 $42M via ETH-refund handoff manipulating internal pricing. CEI is not enough across contract boundaries.
- Class 4 - oracle manipulation: Blend Pools V2, Aave V3 edge market, Sharwa, Edel, Ploutos. Flash loans amplify, thin liquidity enables.
- Class 5 - business-logic/input-validation: highest incident count; GMX's enabler was a contract address accepted where a wallet was assumed.
- Takeaway: audits that stop at contract code cover the most incidents and miss the most dollars.
- Sources: CertiK Hack3D H1 2026, TRM Labs H1 2026, The Block/Blockaid, yellow.com exploit review, Hacken vulnerability guide.

## 3. ZK tooling for app developers: Noir, circuits, practical uses

- Two lanes: circuit DSLs (Noir, Circom, o1js) for app-specific privacy features; zkVMs (SP1, RISC Zero) to prove arbitrary Rust with no circuit thinking, at higher proving cost.
- Noir: Aztec's Rust-like language, 1.0 pre-release; backend-agnostic via ACIR (Barretenberg UltraPlonk/UltraHonk today); browser proving now practical; Solidity verifier generation built in. Audit-world caveat: under-constrained circuits are the silent classic bug; ZK audits scarce and pricey (Nethermind Noir deep-dive).
- Shipping uses: zkPassport-style credentials, zkEmail, zkTLS (prove web2 data), private voting (Respect-weighted private ballots = textbook Noir circuit for the ZAO), game hidden state, proof-of-reserves.
- Pitfalls: proving time is the UX tax; fast-moving toolchains - pin versions.
- Sources: aztec.network Noir 1.0 + beta posts, nethermind.io Noir audit deep-dive, github.com/succinctlabs/sp1, threesigma.xyz Noir explainer.

## 4. Stablecoin rails for agent payments: USDC + EIP-3009

- EIP-3009 transferWithAuthorization (native in USDC): payer signs EIP-712 message (from, to, value, validity window, random nonce); ANYONE can submit. Gasless for payer, push-not-pull (no allowance to drain, unlike approve/2612), parallel-safe nonces, time-boxed.
- x402 (Coinbase, May 2025): HTTP 402 + signed 3009 authorization in a retry header; facilitator verifies + settles USDC (Base). Adoption by Apr 2026: ~165M transactions, $50M volume, 69k agents; Visa/Mastercard/Stripe among 40+ foundation members; Cloudflare Agents SDK + MCP integration; 20k+ Apify Actors behind it.
- Risks: facilitator trust (arxiv 2605.30998 free-riding/settlement-gap analysis); avg ticket ~$0.30 - micropayment rail today; agent-side discipline (budgets, validity windows, allowlists, human gate above threshold) is the real security model.
- ZAO angle: plumbing for ZOL bot paying its own API calls; pairs with the MIDAO legal-entity wrapper thread.
- Sources: blockscout x402 post, eco.com x402 explainers, rzlt.io 2026 explainer, apify x402 post, arxiv 2605.30998, arxiv 2606.26028.

## 5. Prediction markets on Base: Polymarket, Hunch, agent betting

- Premise fix: Polymarket settles on POLYGON, not Base. Mechanics benchmark: CTF paired ERC-1155 outcome tokens fully USDC-collateralized (prices = probabilities), off-chain CLOB + on-chain settlement, UMA optimistic oracle resolution.
- Agent layer 2026: official Polymarket agents repo; 37%+ of AI agents positive P&L vs under half that for humans; Polystrat 4,200+ trades in month one; UnifAI PolyArena = six frontier models trading live as spectacle. Agent edge = temperament, not clairvoyance.
- Hunch (playhunch.xyz) = the Base-native consumer one: swipe-feed market, USDC on Base, a trading-desk agent under every bet (routing/management), creator flywheel (Hunch Crew pays USDC for content, 20% referral share).
- "AgenticBets" resolves to AgentBets.ai - a developer resource for the agent-betting stack (identity, wallets, Polymarket/Kalshi APIs), not a market.
- Pattern: three separating layers - market plumbing, agent execution, consumer attention surface. Mirrors the WaveWarZ thesis (music battles as prediction-market UX) and AI Music Tourney (agent-vs-agent as content).
- Sources: en.wikipedia.org/wiki/Polymarket, github.com/Polymarket/agents, coindesk agents piece, cyberk.io, playhunch.xyz, agentbets.ai.

## 6. ERC-8004: how an identity gets paid + Sparkz pairing

- 8004 (mainnet Jan 2026) = three registries (Identity, Reputation, Validation); deliberately excludes payments. AgentId = ERC-721 pointing to an AgentCard JSON (capabilities, endpoints, receiving address).
- Payment chain: discover via registry -> endpoint 402s -> x402/EIP-3009 USDC to the card's address -> client posts feedback to ReputationRegistry keyed to agentId. SDKs ship both standards together (0xgasless agent-sdk). Risk: card's payment address is convention, not enforced - verify card signature or revenue redirects while reputation accrues.
- Sparkz pairing: YES - as revenue-backed agent coins. x402 receipts = verifiable on-chain income tied to agentId, giving an agent's Sparkz coin auditable fundamentals humans cannot fake. Plumbing = a splitter as the receiving address (treasury % / coin stakers %). Reputation registry doubles as a public fundamentals feed. Caveats: revenue-share coins walk toward securities - the MIDAO agent-LLC wrapper is the answer shape; x402 ticket sizes today fund narrative, not valuations. ZOL bot = natural pilot of all three.
- Sources: eips.ethereum.org/EIPS/eip-8004, quicknode 8004 dev guide, cobo 8004 post, eco.com 8004 explainer, github.com/0xgasless/agent-sdk.

## 7. x402 v2 extensions: non-exact schemes and their authors

- V2 (Dec 2025): spec/SDK/facilitator separation; schemes are plug-ins; lifecycle hooks; dynamic payTo. v1's exact (one 3009 signature = one amount) becomes just the first scheme.
- upto: spec in x402-foundation/x402 specs/schemes/upto - amount is phase-dependent (max at verify, actual consumption at settle). The capped-autonomy primitive - maps to "agent may spend up to N per task".
- deferred (author: Cloudflare, for pay-per-crawl): credential up front, server meters, batch settlement on its own cadence - makes sub-cent calls viable below the gas floor.
- streaming: composed from deferred/upto (continuous consumption, periodic checkpoints), not standalone yet.
- subscription/recurring: dynamic payTo + smart-account programmability (Nevermined's session-key spending rules approach).
- Governance: x402 Foundation (Coinbase + Cloudflare, Linux Foundation Apr 2026); 22 launch members incl. Visa, Mastercard, Amex, Stripe, Adyen, Fiserv, Circle, Google, Microsoft, AWS, Shopify, Polygon, Solana Foundation. Expect processor members to drive recurring schemes as Cloudflare drove deferred.
- Sources: x402.org/writing/x402-v2-launch, github x402-foundation upto spec, coinbase x402 foundation announcement, nevermined programmable x402, policylayer streaming glossary.

## 8. Remote access to a Windows media workstation over Tailscale

- Verdict: Sunshine + Moonlight for editing (sub-30ms, HEVC 4:4:4 at up to 500 Mbps, HDR - only stack near color-judgeable), RDP as admin/headless fallback (50-150ms; 4:4:4 only via "Prioritize H.264/AVC 444" GPO; separate session logs out console - dongles/capture cards may object), RustDesk for no-install rescue (unique portable no-admin mode; service needed for unattended + UAC).
- Admin matrix: RDP = admin once to enable (Pro only); Sunshine = admin install (service + virtual display driver + firewall); RustDesk = portable without admin, service with.
- Tailscale notes: verify direct (not DERP-relayed) or latency doubles; RDP-into-box kills the Sunshine session (fallback, not parallel); bind RustDesk to tailnet, disable public rendezvous.
- Sources: superrendersfarm 2026 comparison, techsngames Moonlight guide, LizardByte 4:4:4 discussion.

## 9. OBS websocket automation: what people actually ship

- obs-websocket v5 built into OBS 28+; multiple simultaneous clients; libraries obs-websocket-js / simpleobsws; Streamer.bot = local-first no-code hub.
- Shipping patterns: (1) event-driven scene automation (chat/redeems/follows -> scenes); (2) record automation + auto-filing (the pattern that prevents VOD-expiry losses); (3) THE clip pattern - always-on replay buffer + !clip redeem -> SaveReplayBuffer -> watcher script -> ffmpeg 9:16 crop -> review folder; (4) AI highlight layer - chat-velocity spike detection is ~50 lines and 80% of the value (cloud tools like TL;DR do multi-signal scoring); (5) multi-PC orchestration.
- ZAO-shaped stack: replay buffer + Streamer.bot redeem + Python watcher feeding the zaalclip/Postiz lane; each shipped clip flips dist.clips in ZM. An afternoon of wiring.
- Sources: getvpe obs-websocket + scene-automation guides, docs.streamer.bot (recording, replay buffer), extensions.streamer.bot auto-clip-scanner.

## 10. Self-hosted media server on Windows (1.5TB, GTX 1660)

- Verdict: Jellyfin. Free NVENC transcode out of the box; Plex hw transcode is behind Plex Pass ($249.99 lifetime post-Apr-2025 hike, remote streaming paywalled); Emby same paywall shape.
- GTX 1660 = Turing NVENC (RTX-20-series encoder class): H.264 + HEVC 8/10-bit encode with B-frames, HEVC/VP9 decode, no AV1 encode (irrelevant for serving). Session cap 8 on current drivers (patch removes); realistically 4-6 simultaneous 1080p transcodes. CUDA tone mapping works.
- Setup: run as Windows service; enable NVENC + tone mapping; design for DIRECT PLAY (transcode is the fallback); serve over Tailscale = free remote streaming with zero port forwarding (exactly what Plex now charges for); keep the box awake.
- ZAO angle: vault + raw stream archive served internally via Jellyfin over the tailnet - editors browse/scrub remotely (Moonlight to edit on-box, Jellyfin to browse), nothing leaves the tailnet.
- Sources: tech-insider.org Jellyfin vs Plex 2026, techfuelhq GPU transcode 2026, corelab.tech guide, selfhosting.sh.

---

Also handled via relay in this window (not research, recorded for the trail): zpoidh duplicate-PR calls (#22 over #21 - real-data tests + single-language suite; #33 over #28 - deterministic backbone honors "AI-assisted, never AI-decides", #28 reworkable as score-proposer) and the R3 POIDH winner cast review for @femmie (verified on-chain payout + brand rules, packaged for Iman review via clipboard).

---

## 11. Addendum (2026-08-08): YouTube-side constraints for the 24/7 channel + upload automation

The missing half of the desktop-h2ov6da channel plan (section 10 territory) - what YouTube itself allows:

- THE 12-HOUR ARCHIVE WALL: YouTube streams over 12 hours are NOT auto-archived - the VOD is simply never created, and watch-hours from unarchived streams do not count toward the 4,000-hour monetization requirement. A literal 24/7 stream builds zero monetization credit and leaves no replay. Mitigation that costs nothing: run the channel as programming blocks under 12h (scheduled service restart every ~11.5h, or the 6pm-2am block idea from the bandwidth analysis) - each block archives normally. Sources: support.google.com/youtube/answer/6247592, space-node.net duration-limits writeup, streamrecorder.io.
- LOOPED-CONTENT POLICY: unlimited stream duration is allowed and 24/7 loop channels are permitted to EXIST, but "reused/repetitious content" rules gate MONETIZATION, not presence. For ZNN's distribution-first goal this is acceptable; just do not build revenue projections on a loop channel.
- UPLOAD QUOTA REVOLUTION (this changes our automation math): Google cut videos.insert from ~1,600 quota units to ~100 on 2025-12-04 - from 6 uploads/day to ~100/day on the free default - and since 2026-06-01 uploads bill to their own daily bucket separate from read/search quota. Consequence: the Twitch-mirror uploader, batch archive backfill, and ZM auto-ingest can all run on the free tier with no compliance audit at ZAO scale. The audit form (developers.google.com quota_and_compliance_audits) is only needed far beyond this. Sources: getphyllo.com and blotato.com 2026 quota guides.
- Practical notes: use resumable uploads for big VOD files, default archive mirrors to unlisted, one playlist per show to keep the channel navigable, and remember uploads still need the channel advanced-verification for >15min videos.

Net: the 24/7 channel should be a segmented block channel (archives + monetization-safe), and the upload-automation lane that every preservation design leaned on is now quota-cheap enough to just build.
