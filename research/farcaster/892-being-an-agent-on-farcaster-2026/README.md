---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-06-23
superseded-by:
related-docs: 891, 761, 762, 281, 280
original-query: "[DEEP] Being an agent on Farcaster in 2026 - the live operating landscape beyond the bootcamp transcripts. Current Neynar agent tooling, registration + running real agents, reputation/discovery (Neynar score, OpenRank, 8004), mini-apps + Snaps, what works vs fails (spam, shadow-ban, bot detection), notable live agents, costs, best practices for running ZOL well."
tier: DEEP
---

# 892 - Being an Agent on Farcaster in 2026: The Live Operating Landscape

> **Goal:** The current (2026) state of running an autonomous AI agent on Farcaster - tooling, costs, reputation, moderation, what wins vs flops - to operate ZOL (doc 891) well. Web-researched supplement to the bootcamp synthesis in doc 891.

This is the "how it actually works in the wild" companion to [doc 891](../../agents/891-farcaster-agentic-bootcamp-zol/) (the build plan). Doc 891 = how to build ZOL from ZAO's existing code. This doc = what the live ecosystem rewards and punishes, so ZOL is built to win not flop.

---

## Key Decisions

| # | Decision | Why | Evidence |
|---|----------|-----|----------|
| 1 | **Keep ZOL's Neynar user score high from day one - quality casts, not slop** | Score 0-1, weekly refresh (hourly under 30 days). Apps gate input at ~0.55. Clanker/Bracky keep high scores by being useful; LLM slop scores low and gets filtered out of feeds. ZOL must be useful, not chatty. | Neynar User Score docs |
| 2 | **Give ZOL an economic action, not just text - the #1 winner pattern** | Every agent that scaled (Clanker, Bracky, Aethernet) had a token/reward/onchain action. Text-only utility agents (mfergpt, askgina) plateaued. ZOL should *do* something onchain ($ZABAL action, mint, tip), not only reply. | Live-agent pattern analysis |
| 3 | **Webhook + reputation-gating is the proven traction combo - but ZOL polls first (Pi NAT)** | Bracky's 500%+ user growth tracked directly to Neynar webhook + score-gating. ZOL on the Pi can't easily expose a webhook, so poll first (doc 891 decision 2); move to webhook if ZOL graduates to the fleet box. | Bracky case study |
| 4 | **Embed a Snap/Mini App in ZOL's replies - the biggest retention multiplier** | Agents embedding Frames/Mini Apps massively out-retained feed-only agents. Snaps (launched ~Apr 2026) are in-feed interactive units (buttons/polls/tx in the cast) - cheap acquisition surface. ZOL should reply with a Snap, not just text. | Mini App / Snap spec |
| 5 | **SKIP EIP-8004 registration for ZOL v1** | Standard launched Jan 29 2026 with big backers, but research found ZERO Farcaster agents actually registered - Neynar's score is the de-facto reputation layer on Farcaster. 8004 adds friction without Farcaster payoff today. Matches doc 281. Revisit if 8004 gets Farcaster-native adoption. | 8004 adoption scan (zero FC agents found) |
| 6 | **Budget realistically: FID ~$5-10/yr + a Neynar tier + per-cast x402** | FID = storage rent ~$5-10/yr on Optimism (not a big one-time fee). Neynar free tier (~10M credits/mo) likely covers ZOL early; Scale tier is $249/mo if it grows. x402 write = sub-cent USDC/cast on Base. Self-hosting Snapchain reads (<$1k/mo) only matters at scale. | Neynar pricing (partial), Farcaster contracts docs |
| 7 | **Bake in the realism limits - they're also anti-spam-filter insurance** | No official shadow-ban, but slop + always-on + spammy reply patterns tank the Neynar score (the real visibility gate). Cooldowns, skip 25-30% of triggers, randomized delays, alive-hours = both human-feel AND score protection. | Builder playbooks + score mechanics |

---

## Part 1 - The current tooling stack (Neynar-centric)

| Component | What / how | Cost (current as of 2026-06-23) | Certainty |
|-----------|-----------|-------------------------------|-----------|
| **Managed signer** | Neynar sponsors a signer via the signer API (SIWN / developer-managed). The agent never custodies the user's key. | $0 default (sponsored) | HIGH |
| **Self-managed signer** | Own Ed25519 keypair (what ZAO's `farcaster/signer.ts` uses - noble in-process; QKMS can't sign Ed25519). | free (just key custody) | HIGH (codebase) |
| **Webhooks** | Subscribe to cast.created / reactions / follows; payload pushed to your endpoint. Credit-metered. | Free tier ~10M credits/mo, 600 RPM; Scale $249/mo, 60M credits, 1200 RPM. Credit->USD rate NOT published. | MED (credit conversion opaque) |
| **Neynar SDK + Mini App CLI** | Open-source TS SDK + `npx @neynar/create-farcaster-mini-app`. No proprietary "agent kit" product. | Free / OSS | HIGH |
| **x402 paid write hub** | `hub-api.neynar.com submitMessage` with an `X-PAYMENT` header (EIP-3009 USDC on Base). Pay-per-cast instead of a subscription. ZAO already implements this in `farcaster/x402.ts`. | ~0.001-0.01 USDC/call (range; exact rate not published) | MED (codebase confirms 0.001) |
| **FID registration** | On-chain storage rent on the Optimism ID Registry. Third-party toolkits (`rishavmukherji/farcaster-agent`, fid-forge) wrap it. | ~$5-10/yr storage rent (L2 gas negligible). Doc 281 cited ~$1-2 one-shot via toolkits. | MED (figures vary) |
| **Self-hosted reads** | Run a Snapchain / Hypersnap node for free reads instead of the Neynar read API. | <$1k/mo node (200GB snapshot, 2-4h sync). Avoids ~$500/mo Neynar API. | MED |

**Contradiction flagged:** Agent A found a generous free webhook tier (~10M credits/mo); doc 281 + community lore cite "~$500/mo Neynar API." Both can be true - reads/enrichment APIs are the pricey part, webhooks are cheaper. The credit->USD rate is unpublished (behind login), so **confirm ZOL's actual monthly cost on a real Neynar dashboard before committing.**

ZAO already has the hard parts coded: `bot/src/zoe/farcaster/{signer,write,x402,event-stream,read-node}.ts`. The tooling research confirms those are the right primitives.

---

## Part 2 - Discovery, reputation, moderation

- **Neynar user score (the real gate):** 0-1, "confidence the account is high quality." Weekly refresh; hourly for accounts <30 days. Apps commonly gate input at ~0.55. Bots are NOT auto-penalized - Clanker and Bracky hold high scores by being useful. LLM slop + low-effort automation score low and get filtered. **This is the single most important number for ZOL's reach.**
- **OpenRank:** EigenTrust reputation graph, published on Base, global refresh ~every 2h. Interaction weights: mention=12, reply=6, recast=3, like=1, follow=1. Useful signal but Neynar score dominates day-to-day.
- **EIP-8004:** Identity (ERC-721) + Reputation + Validation registries, mainnet Jan 29 2026, 100+ backers (Coinbase, MetaMask, ENS). **But zero Farcaster agents found registered** - one cross-chain example (Obol, Base agent #26522). On Farcaster, Neynar score is the de-facto reputation. **SKIP for ZOL v1.**
- **Moderation reality:** No central shadow-ban or suppression logs. Filtering is (a) economic - storage rent ~$5-10/yr per account, (b) client-side bot-hiding UI, (c) channel-level gating (min score / verified wallet / min followers before an agent can act, e.g. via Newton Protocol policies). Farcaster *added bot-hiding UI rather than removing bots* - implicit acceptance that bots stay; the burden is on each agent to earn score.
- **Spam is real + acknowledged:** documented bot circle-jerk dynamics (Szilágyi's follower count jumped 250 -> 2,700 with zero activity). 250+ agents counted by Jan 2025. So "humans + agents coexist" is true, but the feed is noisy and score-gating is how clients cope.

**Takeaway for ZOL:** reach is gated by the Neynar score, and the score rewards usefulness + punishes slop/spam. ZOL's realism limits (doc 891) double as score insurance.

---

## Part 3 - What the winners did (live agents 2026)

| Agent | Does | Trigger | Scale | Why it worked |
|-------|------|---------|-------|---------------|
| **Clanker** | Deploys ERC-20 + Uniswap V3 LP on reply-mention | webhook | 17,242 tokens, 7.62B volume, 50M fees; ~15% of pump.fun Base volume in 2 wks | Onchain action + fee moat; structured outputs + message queue for nonce safety |
| **Bracky** | NBA/NFL prediction betting, BRACKY rewards | webhook + score-gating + mini-app notifications | 500%+ user growth post-webhook; ~4M mcap | Token rewards + reputation gating + Frame notifications |
| **Aethernet** | Higher's treasury agent - distributes tokens, mints NFTs, posts bounties | mention | 150k treasury, 466k+ NFT mints, 58 ETH incentives | Self-custodial wallet + economic participation |
| **askgina.eth** | Crypto/sports/market analysis, onchain execution | mention (@askgina.eth) | live since Aug 2024; modest | Useful but text/analysis-led; plateaued vs token agents |
| **mfergpt** | Persona reply bot | mention | no quantifiable adoption | Pure persona, no economic loop -> flat |

**The 4 patterns that separated winners from flops:**
1. **Token / reward loop** - users became promoters; the strongest adoption correlate.
2. **Webhook + reputation gating** - precision + spam resistance (Bracky's inflection).
3. **Frame / Mini App / Snap embedding** - in-feed conversion + notifications >> external dashboards (biggest retention multiplier).
4. **Protocol-native wallet** - onchain execution = monetization + trust moat. Read-only/text-only agents flopped.

Meta-lesson: the durable moat was **Neynar's infrastructure** (webhooks, score, signers, Frames), not any single agent. Build ZOL *on* that infra, don't reinvent it.

---

## Part 4 - Mini Apps + Snaps (ZOL's surface)

- **Mini Apps** (formerly Frames v2): web app in a 424x695 modal inside the client. Embedded via `fc:miniapp` OG meta + a `/.well-known/farcaster.json` manifest; wallet auto-connect via `getEthereumProvider()` (EIP-1193); "Sign In with Farcaster" auth. For full flows (multi-step, state, signing). Deploy to a real domain (tunnels break manifest features).
- **Snaps** (launched ~Apr 2026): lightweight in-feed interactive units - buttons, inputs, polls, charts, transactions live *in the cast*. No manifest/upload burden; register via cast metadata. **Best acquisition surface for an agent**: ZOL replies with a Snap (quick interaction), deep-links to a Mini App for complex flows.
- **Hosting:** Railway ($20/vCPU-mo, per-second billing, no hard HTTP timeout to ~15min) is 50-70% cheaper than Vercel for backend-heavy reply agents; Vercel Pro ($20 + $0.128/CPU-hr) has a 60s edge timeout (10s hobby) - the timeout gotcha the bootcamp flagged. For ZOL on the Pi, the Pi *is* the always-on host; a Mini App would deploy separately (Railway/Vercel).

---

## Part 5 - The ZOL operating playbook (do this)

1. **Be useful, not chatty.** One good cast > ten replies. Protects the Neynar score = protects reach.
2. **Realism limits** (doc 891): cooldown (~90s), daily activity budget, alive-hours flag, skip 25-30% of triggers, randomized delays. Human-feel + anti-slop-score.
3. **Idempotency**: dedupe on Neynar's event id, upsert with a TTL > 48h retry window; respond 200 immediately, process async. (Webhooks fire twice; polling double-reads.)
4. **Human-approval gate** for casts + all onchain actions - already enforced in `caster/index.ts`. Reads/likes auto-allow.
5. **Cheap-model routing**: Haiku/small model drafts (already `caster/reason.ts` via OpenRouter), bigger model only for orchestration/safety. ~10-17x cheaper at >500 calls/day.
6. **Lean memory**: front-matter MD shards, nightly re-synthesis (condense the day's casts to 5-10 facts), drop facts >30 days; utility drops past ~20k tokens of memory.
7. **Give ZOL one economic action** (the winner pattern) - e.g. a $ZABAL tip/mint/Snap-driven action - not just text. Gate it behind the approval gate + a spend cap (Privy signer policy, doc 891).

---

## Also See

- [Doc 891](../../agents/891-farcaster-agentic-bootcamp-zol/) - the ZOL build plan (this doc's sibling: landscape vs build)
- [Doc 761](../../agents/761-zao-farcaster-multiagent-quilibrium-stack/) - ZAO Farcaster multi-agent / caster stack
- [Doc 762](../762-quilibrium-stack-verification/) - Neynar write hub + x402 + signer verdict
- [Doc 281](../../agents/281-farcaster-agents-landscape-registration/) - registration paths, cheapest proven FID route
- [Doc 280](../../agents/280-fid-registration-x402-deep-dive/) - FID registration + x402 deep dive

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm ZOL's real monthly Neynar cost on a live dashboard (credit->USD rate is unpublished) | @Zaal | Investigate | Before scaling ZOL |
| Register the FID (doc 891 Phase 0) - keep ZOL's first casts useful to seed a high score | @Zaal | Build | Next session |
| Add a Snap as ZOL's reply surface (acquisition) once it casts | @Zaal | PR | Phase 1-2 |
| Pick ZOL's one economic action ($ZABAL tip/mint) behind the approval gate + spend cap | @Zaal | Decision | Phase 2 |
| Do NOT register EIP-8004 for v1 (zero Farcaster payoff today); re-check in ~3 months | @Zaal | Decision | 2026-09 |

## Sources

- **[FULL]** docs.neynar.com - managed signers, webhooks, dedicated-signer bot guide, SDK / mini-app CLI (`@neynar/create-farcaster-mini-app`)
- **[PARTIAL - pricing page behind login]** dev.neynar.com/pricing - free tier ~10M credits/mo, Scale $249/mo; credit->USD conversion not published
- **[FULL]** docs.farcaster.xyz/reference/contracts - FID storage rent (~$5-10/yr, Optimism ID Registry)
- **[FULL]** miniapps.farcaster.xyz/docs/specification - Mini App spec (424x695, fc:miniapp, /.well-known/farcaster.json, getEthereumProvider), Snaps
- **[FULL]** eips.ethereum.org EIP-8004 - Identity/Reputation/Validation registries, mainnet 2026-01-29
- **[FULL]** OpenRank Farcaster SDK docs - EigenTrust weights (mention=12/reply=6/recast=3/like=1/follow=1), ~2h refresh, Base
- **[FULL]** Neynar User Score docs - 0-1 range, weekly/hourly refresh, ~0.55 threshold
- **[FULL]** Clanker metrics (launch posts + Dune) - 17,242 tokens, 7.62B volume, 50M fees, ~15% pump.fun Base volume
- **[FULL]** Bracky Neynar webhook case study - 500%+ growth, score gating, BRACKY ~4M mcap
- **[FULL]** Aethernet (Higher) public treasury + Zora data - 150k treasury, 466k+ mints, 58 ETH
- **[FULL]** Péter Szilágyi X thread (May 2024) - bot circle-jerk / follower inflation (250 -> 2,700)
- **[PARTIAL]** AskGina / mfergpt - launch + behavior confirmed, 2026 user counts not found
- **[FULL]** Vercel limits (60s Pro edge timeout, $0.128/CPU-hr) + Railway compare ($20/vCPU-mo, ~15min HTTP)
- **[PARTIAL]** webhook idempotency + AI model-routing + agent-memory guides (hookdeck, augmentcode, towardsdatascience) - general best practice, not Farcaster-specific
- **[NO DATA]** Builders Garden x Neynar hackathon agents (Emerge / Among Traders / Hype Man) - no public 2026 launch metrics found; bootcamp transcript coverage is in doc 891
- **[FULL - codebase]** `bot/src/zoe/farcaster/{signer,write,x402,event-stream,read-node}.ts`, `bot/src/zoe/caster/{index,reason}.ts`
