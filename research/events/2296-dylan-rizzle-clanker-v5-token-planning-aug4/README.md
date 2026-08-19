---
topic: events
type: guide
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: "2287, 2295"
original-query: "/meeting /Users/zaalpanthaki/Downloads/Zaal x dyl - 2026_08_04 18_00 EDT - Recording.mp4"
tier: STANDARD
---

# 2296 - Zaal x Dylan x Rizzle: Clanker v5, droids, and the practice-launch plan

> **Goal:** Recap the 2026-08-04 token-planning call that set the practice launch, the multi-pool Trinity strategy, and the build-own-vs-droid AI direction.

## Meeting

| | |
|---|---|
| Date | 2026-08-04, 18:00 EDT |
| Duration | 57 min |
| Attendees | Zaal, Epic Dylan (Trinity), Rizzle (Trinity Labs / Whipcoin), Samantha (Candy Toy Box) |
| Platform | Video call |
| Transcript | [transcript.md](transcript.md) - RAW (unlabeled); the 2-speaker diarization was invalid for a 4-voice call, so speaker attributions below are content-based, confidence MEDIUM unless self-identified |

## Decisions

| # | Decision | Conf |
|---|---|---|
| 1 | Practice token launch set for "next Tuesday" on the call, live-cast during the stream - the plan that became the Zalcastr launch (now Wed 2026-08-19) | high |
| 2 | Launch mechanics: airdrop up to the 90% max to self, then spread across multiple Trinity pools (ETH pair primary) rather than one pool - "you don't lock people out" and dumps hit their own money, not the curve | high |
| 3 | Sparkz AI infrastructure = BYO-inference ("bring your own tokens") - the only sustainable model without VC subsidy | high |
| 4 | First droid test runs on Zolcaster: the open-source repo whose bot helps organize the repo itself - the flywheel test. Recursive idea beyond it: the bot creates child clankers with droids, fees feeding 50% back up | medium |
| 5 | Rather than building all agent infra: route conversational load to Nainar (~$3/mo) and spend own money only on high-value acts (POIDH bounties, promotions) | medium |

## Actions

| Owner | Action | Why | Done when |
|---|---|---|---|
| zaal | Reach out to Saltorious about agent architecture | Dylan/Zaal both rate him: TriHarness (air-gapped local-LLM screen assistant), Among Traders, now at Bankr - the cost-to-performance person | Conversation had |
| zaal | Create the 4-person text group (Zaal, Dylan, Rizzle, Sam) | Asked for on the call to continue async | Group exists |
| zaal | Upgrade Zolcaster repo for fork-as-namecaster | "Anyone can grab this and create their own basic client" - it is the droid test bed too | Repo forkable with docs |
| zaal | Transparency writeup on the site before launch | "Get everything transparent, write it all down... in the how-to" | How-to live |
| samantha | Fix the pressreleasemarketplace.com API key (Alchemy) | NFT Curator demo failed the live wallet scan on the call | Scan works |
| Open | Research the Farcaster/Nainar airdrop cap | The random-airdrop idea depends on it | Cap known |
| Open (Rizzle/Dylan advising) | Design the pre-launch pooled dev-buy with lock | Zaal wants ecosystem wallets whitelisted into the dev-buy with a sell-lock; Clanker tried and removed this feature | Mechanism chosen |

## The ideas worth keeping (seeds)

- **Token dies when its AI is broke:** v5 fee routing can fund a bot's own
  inference - "our CEO is bankrupt" as an honest death condition, resurrect by
  sending it funds.
- **NFT Curator** (Sam's build, pressreleasemarketplace.com, live on Clanker as
  a droid): watches wallets, turns dead NFTs into threads/casts/newsletters -
  "put your NFTs back to work." Dylan: works for Trinity with minimal changes.
- **Streamer tools kit on Livepeer** - decentralized streaming for individuals,
  open-source, part of the Sparkz distribution suite (connects to the Livepeer
  agent-alpha scouting already in the tracker).
- **Whipcoin's bonding-curve threshold pattern** (Rizzle): the ~$5k ground-floor
  wad means early dumpers dump into their own buy - community protection by
  structure.
- **ABC-token pattern:** commits to open-source repos earn tokens via GitHub
  hook - simple cron, no AI needed.
- Clanker v5 facts (from Tiny Rain Boot's explainer video played on the call):
  modular token types (incl. Base's b20), AMM plug-in adapters, multi-AMM
  launches, live liquidity positions with dual-signed migration, adjustable fee
  routing without relaunch. All as-stated-on-call, UNVERIFIED against docs.

## Key quotes

> "It could also be like an actual determination of when the token dies - when the AI that's running the brand doesn't have enough money to pay itself." - Zaal

> "Basically it's meant to turn your dead NFTs that are in your wallet into content." - Sam, on NFT Curator

> "If that wad is scooped up and those people decide to dump... they're essentially dumping into their own money." - Rizzle, on the Whipcoin curve pattern

> "I'm absolutely here before next Tuesday, after next Tuesday, during next Tuesday - that is one of the things that I'm here to help with." - Dylan

## Also See

- [Doc 2287](../2287-yerb-empire-tokenless-aug14/) - the tokenless-first doctrine this practice launch precedes
- [Doc 2295](../2295-steve-peer-black-moon-logistics-aug15/) - same week, the IRL side
- Memory: `project_papioshu_paperhand`, activation map (saltorious.eth)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Zalcastr launch (the practice run this call planned) | @Zaal | Launch, gated | 2026-08-19 |
| Saltorious outreach | @Zaal | Ops | 2026-08-22 |
| 4-person group chat | @Zaal | Ops | 2026-08-19 |
| Airdrop cap research | @Zaal + Claude | Research | 2026-08-24 |

## Sources

- [FULL] The recording: 57 min, transcribed locally. Raw transcript preserved at `~/.zao/private/meetings/batch-aug17/dyl-raw.txt`. Diarization invalid (2-speaker run on a 4-voice call) - deliberately not used.


## Re-verify pass 2026-08-19 (full transcript re-read vs this doc)

Decision-complete; operational detail the first pass compressed away:

- **Trinity pool architecture, exact:** 50% USDC primary pair, 15% ETH, 15%
  Clanker, remainder bought/staked or feeding the **accumulator bot** that
  compounds fees into new Trinity pairs.
- **Implementation step:** Rizzle recommends a **Gnosis Safe as the Clanker
  admin** before launch; he has tooling and offered a setup call.
- **Airdrop alternative discussed:** stake prior ZAO tokens into a contract
  for a time window = the airdrop list (participation-gated, not snapshot).
- **Whipcoin offered as the working model** to replicate, not just an
  anecdote - the ~$5k bonding-curve floor mechanism is the template.
- **Open risk, unresolved on-call:** droid economics at Clanker's 10% fee
  split - "I feel like it dies out too quickly"; whether fees can sustain a
  droid is THE open question on the recursive design.
- **FEF idea (exploratory):** "Farcaster Eats First" - post to Farcaster
  first, auto-cascade to other platforms later; wants a repo if pursued.
