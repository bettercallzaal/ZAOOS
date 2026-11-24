---
topic: business, farcaster, identity
type: decision
status: research-complete
last-validated: 2026-11-23
superseded-by:
related-docs: "business/2376-sparkz-vs-zora-creator-coins, business/1097-sparkz-competitive-landscape, agents/2229-clawd-attest-eas-trust-adopt, business/2251-sparkz-rebrand-and-modular-architecture, farcaster/2384-creator-coins-ecosystem-aug2026, infrastructure/2737-capacitor-testflight-pipeline"
original-query: "UI changes worth considering for the Hearth page (src/app/c/[slug]/page.tsx) great ideas for all of them we wanna be unique among other launchers out there as a community first platform foused on how we can get the client / customer / artists the exact onchain expierience that they want, lets /zao-research this tbh and deep dive on this we can make lots of imrpovement to sparkz UI since the backend mostly works"
tier: DISPATCH
---

# 2741 - Sparkz Hearth page UI: onchain to the depth each artist chooses

> **Goal:** Turn the Sparkz Hearth page into the community-first, non-launcher page it is meant to be: every artist or client picks how much of their Hearth's offchain record goes onchain, using open community tools (EAS, a merkle root, Farcaster mini app embeds), with no price chart, no ticker and no Sparkz token.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE an "Onchain depth" ladder per Hearth, chosen by the owner: Offchain, Signed, Anchored, Collectible, Token.** Show the current rung on the Hearth header. | This is the one thing no launcher offers. Zora auto-creates a coin for every account and the activation is "permanent" (Zora support). Clanker, Bankr and Pump.fun make a token the first and only object. Sparkz makes the token the last, optional rung. |
| 2 | **USE EAS on Base for proof: offchain signed attestations by default (zero gas), and an onchain attestation only when the owner presses Anchor.** EAS is a Base predeploy at `0x4200000000000000000000000000000000000021`, schema registry `...0020` (docs.base.org). Contracts and SDK are MIT (LICENSE files read). | A community tool Sparkz does not own, readable by any wallet or explorer. The EAS docs recommend this exact pattern: "store only hashes or references to offchain data" and "timestamp the UID of the offchain attestation onchain". |
| 3 | **USE one merkle root per Hearth snapshot, built with `@openzeppelin/merkle-tree` (MIT, 541 stars).** One transaction covers the whole history; any single record can be proved later against the root. | Cost does not grow with the number of Sparks or backers. EAS docs name merkle-root "private data attestations" as their own pattern. |
| 4 | **USE a Proof tab next to About, Sparks and Backers.** It lists every record (Spark lit, backing, contributor credit) with its state: Recorded, Signed, Anchored on Base (link to the tx on Basescan). | It makes the moat (the accumulating data, CLAUDE.md) visible. Paid backings already carry `provider_ref` (txhash) and `chain` in `hearth_backers` (migration 0001), so a first version needs no migration. |
| 5 | **USE a Timeline, never a chart.** Dated Sparks, backings, contributors and milestones in date order, at the top of the Sparks tab. | Launchers lead with price and market cap. Timeline is the Hearth's real asset. Juicebox's activity feed and Patreon's posts feed show the pattern works for backers. |
| 6 | **USE support language and fixed tiers, following Paragraph.** "Back" and "support", never "buy"; three fixed tiers; a "most supported" signal, never market cap. | Paragraph shipped exactly this to keep coins "not rooted in speculation": "support instead of buy", "3 tiers to choose from", "a popularity indicator instead of showing the market cap". |
| 7 | **USE signed contributor credits.** Each contributor signs their own credit as an EAS offchain attestation (free). The credit shows "signed by @name" on the Hearth. | Credit is the attribution layer the manifesto already promises ("an attribution mechanism", src/app/manifesto/page.tsx:63). Signed by the person, not asserted by the owner. |
| 8 | **USE Export my Hearth: a JSON download with the merkle proofs, plus an "Anchored" badge on Explore cards.** | Sound.xyz moving to maintenance and going offline stranded artist pages. An export that verifies offline against the onchain root means a Hearth survives Sparkz. |
| 9 | **USE a Farcaster mini app embed per Spark: a 3:2 image and one "Back this Spark" button (title max 32 characters).** | The mini app spec makes feeds the "primary discovery point". Paragraph's collect from feed is the reference. |
| 10 | **KEEP paid backing out of the iOS app UI.** Boost (free) stays; any paid backing in the iOS shell opens the website. | Apple treats fan-to-creator payments as digital goods: Patreon must move all creators to in-app purchase by 1 Nov 2026 at 30% (15% after a year), and its iOS users pay on the web to avoid it (MacRumors, 28 Jan 2026). Today no Sparkz UI posts to `/api/backers`, so the 29 Nov submission is not affected. |
| 11 | **SKIP for the Hearth page: price chart, market cap, ticker, money-ranked holder lists, auto-created coins, irreversible activation, creation-count bragging.** | Each one appears in the documented failures below (99% of Zora coins dead within five transactions; Pump.fun 0.26% graduation; Base "100,000 launches a day" while active addresses fell). |
| 12 | **SKIP Hypercerts, Sign Protocol and Verax for now. Arweave only as an optional export target, after a live price check.** | Hypercerts is a funding-impact protocol whose stack is moving to ATProto; Sign ties to the SIGN token; Verax maintenance was not confirmed. EAS covers the need with fewer parts. |

## The Onchain depth ladder (decision 1, in full)

Each rung is a choice the owner makes in Hearth settings. Fans never need a wallet below rung 4.

| Rung | Name | What is onchain | Fan needs | Cost to owner | Maps to |
|---|---|---|---|---|---|
| 0 | Offchain | Nothing. Records live in the Sparkz database. | Nothing; card or free boost | 0 | Every Hearth today |
| 1 | Signed | Nothing onchain. Each record and credit is an EAS offchain attestation, signed by the owner or contributor wallet. | Nothing | 0 gas | Contributor credits |
| 2 | Anchored | One EAS attestation on Base holding the merkle root of the Hearth snapshot. | Nothing | One Base tx per anchor (gas not yet measured; see Next Actions) | Proof tab, Anchored badge |
| 3 | Collectible | A Spark of kind `nft` can be collected (free or paid) as an onchain edition. | Wallet or embedded wallet | Per the rail chosen | `sparks.kind = 'nft'` (migration 0008) |
| 4 | Token | Graduation through the existing Clanker / 0xSplits path. | Wallet | Per Clanker | `sparks.kind = 'token'`, business/2376 |

The Spark kinds already in the schema (`moment`, `token`, `nft`, `bounty`, `event` in `supabase/migrations/0008_sparks.sql`) are the per-Spark version of the same choice. The ladder is the Hearth-level default; each Spark can sit on its own rung. That is the "exact onchain experience they want": a fan-only artist stays on rung 0 forever and the page still looks complete; a crypto-native project goes to rung 4 with every earlier rung visible as history.

## Codebase grounding (Sparkz main, 193525a)

| What | Where | What it means for the UI |
|---|---|---|
| Hearth page: header, Backers/Boosts stats, Boost box, then tabs About / Sparks / Backers | `src/app/c/[slug]/page.tsx` (472 lines; tabs from line 358) | The Proof tab is a fourth `HearthTabs` pane; the Timeline goes at the top of the Sparks pane. |
| Stats render only when there is something to count | `src/app/c/[slug]/page.tsx:342` | Keep that rule for the depth badge: no badge on rung 0, so a new Hearth never looks empty. |
| Backers list shows a masked id and a `kind` label | `src/app/c/[slug]/page.tsx` Backers pane, `maskBacker` | Add a "Proof" link when `provider_ref` and `chain` are set. No migration. |
| `hearth_backers.provider_ref` (txhash) and `chain` | `supabase/migrations/0001_capsule_foundation.sql:60-61` | Onchain backings already carry the data the Proof tab shows. |
| Spark kinds | `supabase/migrations/0008_sparks.sql:17` | Per-Spark rung, see the ladder. |
| No UI posts to `/api/backers` | `git grep api/backers` on main: only the route itself | Paid backing has no in-app UI today; decision 10 is a guardrail for when it does. |
| 0xSplits as attribution | `src/app/manifesto/page.tsx:63`, `docs/STACK.md:13` | Contributor credits (decision 7) extend a promise the site already makes. |
| "IPFS/Arweave receipts" deferred to v1.5 | `docs/research/sparkz-improvements-and-plugin-system.md:116` | This doc replaces that line with EAS + merkle root, Arweave optional. |

## Findings: what launchers show, and what fails

| Product | Page leads with | Creator gets | Documented outcome |
|---|---|---|---|
| Zora (creator and content coins, Base) | Market cap, price, holders, recent trades | 1B supply creator coin, half vesting over 5 years; a share of the 1% trade fee (Zora's support page and docs disagree on the split) | 99% of tokens (6.45M of 6.52M) fail within five transactions; only 0.3% trade after 48 hours (Nicky Sap, 30 Dec 2025). Nick Shirley coin $15M peak to $74,900 by 27 Jan 2026 (The Block). |
| Clanker (Farcaster/Base) | Token page with 30-day creator earnings | 40% of a 1% fee, 60% to protocol (crypto.news, 3 Apr 2026) | Over $50M cumulative protocol fees; daily launches near 13,000 (crypto.news). business/1097 records 95% of tokens failing within 48 hours. |
| Pump.fun (Solana) | Bonding curve chart, graduation bar | Tiered creator fees; Jan 2026 fee sharing across up to 10 wallets (The Block) | 7-day graduation rate 0.26% by June 2026; revenue $800K/day vs $4.8M/day six months earlier (The Block, 16 Jun 2026). |
| Bankr (Base) | Token detail with a Claim button | 15% creator allocation of 100B, 1-year vest; 1.2% swap fee | Gated to Bankr Club; anti-snipe fee from 80% over about 14 seconds (Bankr support). |
| Paragraph coins | Post with a support side rail | Coin per post | Deliberately "not rooted in speculation": support wording, 3 tiers, popularity not market cap (Paragraph blog). |
| Gitcoin GG24 on Giveth | Project page with donation history | Quadratic matching | $300,000 matching, 3,042 donations, 1,286 donors, 64 projects (Gitcoin forum, 27 Nov 2025). Shows history-first pages fund public goods. |
| Patreon (non-crypto) | Tiers, posts feed | Standard plan 10% for pages after 4 Aug 2025 | Apple IAP mandate by 1 Nov 2026 (MacRumors). |

### Community sentiment

- **Reddit r/BASE, "Zora? The future of the creator economy or just a casino" (16 Oct 2025, 7 points, 6 comments):** "Discovery is broken", "Speculation > Creation", "millions of hyper specific, illiquid content coins". Top reply: quality cannot stand out "amid the sheer quantity".
- **Reddit r/CryptoScams (22 Sep 2025, 19 points):** Zora's top creator coin was removed overnight with 4,000+ holders affected. This is a platform-risk story: a creator who does not own their record can lose it.
- **Blockworks (13 Aug 2025):** artist Justin Blau: "There is nothing wrong with speculation, just call it what it is. This disguising narrative is dangerous." Visual artist ThankYouX: Zora "adds a purely speculative element which isn't what art is about". Top Zora accounts by market cap included a porn account, an AI art account and meme accounts.
- **Nicky Sap, "The Creator Coin Delusion" (Substack, 30 Dec 2025):** a creator in the comments, three years making content, earned more from minting a podcast than from Zora or Clanker coins and "lost premium subscribers due to token".
- **Hacker News 46801419 (28 Jan 2026, 1,116 points, 917 comments) on Apple taking 30% of Patreon in iOS:** top replies argue "not every little thing needs an app" and for web checkout. This supports decision 10.
- **Hacker News 47050300 (17 Feb 2026, 152 points):** "Isn't all memecoin just a pump and dump anyways?" General memecoin fatigue: the word "token" carries baggage for the fans Sparkz wants.

**Read:** the market already believes launchers are casinos. Sparkz's advantage is not a better token, it is a page where the money layer is optional and the history is the product.

## UI spec, one block per idea

1. **Depth badge (header).** A small pill next to the status pill: "Signed", "Anchored on Base 12 Nov", "Collectible", "Token". Hidden on rung 0. Tap opens the Proof tab.
2. **Proof tab.** Rows: icon, plain sentence ("Zaal lit the Spark 'Album drop'", "a supporter backed with 10 USDC"), date, state chip. Anchored rows link to `basescan.org/tx/<hash>`. Footer: "Verify this Hearth yourself" with the root and a download link. Empty state: "This Hearth keeps its record on Sparkz. The owner can sign or anchor it any time."
3. **Anchor button (settings, owner only).** Shows what will be written ("1 record on Base: the fingerprint of 38 records"), the estimated fee, and that nothing personal goes onchain (only the root). Uses the owner's wallet; Sparkz holds no key. After success: the badge updates and the Proof tab marks rows Anchored.
4. **Contributor credits (About tab).** Grid of people with role ("mixing", "cover art", "code") and a "Signed" mark when they have signed. Invite link asks the contributor to sign in and sign. Unsigned credits show as "Added by the owner".
5. **Timeline (Sparks tab top).** Vertical, newest first, grouped by month. Spark lit, Spark done, first backer, 10th backer, contributor joined, anchored. No numbers styled like market data.
6. **Support wording.** Backers stat becomes "Supporters"; Boosts stays. Three fixed backing tiers when paid backing ships. Explore "most supported" ranks by count of supporters, never by money.
7. **Collect a Spark from the feed.** Each Spark page carries an `fc:miniapp` embed: 3:2 image of the Spark, button "Back this Spark" (under 32 characters), opening the Spark inside the mini app.
8. **Export my Hearth (settings).** One JSON file: records, merkle proofs, root, EAS UID. A "How to verify" note. Explore cards for anchored Hearths carry the same Anchored pill.

## Contradictions and staleness

- **Zora fee:** the support page says creators earn 1% of every trade; the docs say the 1% fee is split across creator, referrers, protocol and LP. Unresolved; not needed for this decision.
- **Sound.xyz status:** sources give maintenance mode (May 2025) and offline (16 Jan 2026). Both are secondary; the stranding lesson holds either way.
- **Water and Music onboarding study** (card checkout shares like RCRDSHP 95%) is from 8 Mar 2022. It is over three years old, so this doc does not lean on its numbers.
- **EAS gas on Base:** not measured by any source found. Next Actions has a Base Sepolia measurement.
- **Arweave per-MB price:** the Turbo pricing page gave placeholder-looking figures. Not used.

## Also See

- [business/2376 - Sparkz vs Zora Creator Coins](../2376-sparkz-vs-zora-creator-coins/) - the token-timing and 0xSplits differentiation this ladder builds on
- [business/1097 - Sparkz competitive landscape](../1097-sparkz-competitive-landscape/) - Clanker failure-rate baseline
- [agents/2229 - claude-p-attest, EAS web of trust](../../agents/2229-clawd-attest-eas-trust-adopt/) - EAS on Base, read-first, signs nothing
- [business/2251 - Sparkz rebrand and modular architecture](../2251-sparkz-rebrand-and-modular-architecture/) - Hearth as hub, integrations as spokes (number 2251 also names an infrastructure doc; this link is the business one)
- [farcaster/2384 - Creator coins ecosystem, Aug 2026](../../farcaster/2384-creator-coins-ecosystem-aug2026/)
- [infrastructure/2737 - Capacitor TestFlight pipeline](../../infrastructure/2737-capacitor-testflight-pipeline/) - the iOS submission decision 10 protects

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide the Onchain depth ladder and the five rung names; shipped when a Decisions row exists | Zaal | Decision | 2026-12-01 |
| Build the Timeline at the top of the Sparks tab and the "Supporters" wording, UI only, no migration; shipped when the sparkz PR is open and green | sparkz lane | PR | 2026-12-05 |
| Build the Proof tab v0 from existing `provider_ref`/`chain` data, with Basescan links, no migration; shipped when the sparkz PR is open and green | sparkz lane | PR | 2026-12-08 |
| Add the `fc:miniapp` "Back this Spark" embed to Spark pages; shipped when a cast of a Spark URL shows the button | sparkz lane | PR | 2026-12-10 |
| Approve or refuse two new packages (`@ethereum-attestation-service/eas-sdk` 2.10.0, `@openzeppelin/merkle-tree`) and the anchors/credits migration; shipped when a Decisions row exists | Zaal | Decision | 2026-12-08 |
| Measure one EAS attestation's gas on Base Sepolia and record gasUsed in this doc; shipped when the number is in this doc | sparkz lane | Research | 2026-12-10 |
| Register the Sparkz Hearth-root schema on Base EAS and build the owner Anchor button and Export my Hearth; shipped when the sparkz PR is open with the HOLD line | sparkz lane | PR | 2026-12-19 |
| Add an iOS-shell guard so any future paid-backing UI opens the website; shipped when a test proves the guard | sparkz lane | PR | 2026-12-19 |

## Sources

Dispatch note: three research subagents ran in parallel (launchers, inscription tools, community-first UX); the parent re-fetched every source that carries a decision. Sources still PARTIAL say what is missing; none of them carries a decision alone.

- [Base contract addresses (EAS predeploys)](https://docs.base.org/chain/base-contracts) [FULL] - EAS `0x42..21`, schema registry `0x42..20`, same on Base Sepolia.
- [EAS docs, Onchain vs Offchain (source file)](https://github.com/ethereum-attestation-service/eas-docs-site/blob/main/docs/core--concepts/onchain-vs-offchain.md) [FULL] - read through the GitHub API; the rendered docs.attest.org page returned a broken Docusaurus shell.
- [EAS SDK repo](https://github.com/ethereum-attestation-service/eas-sdk) [FULL for LICENSE: MIT, Copyright 2020 Leonid Beder; 145 stars; last push 2026-08-27]. Version 2.10.0 from npm [PARTIAL - npm view only, release notes not read].
- [OpenZeppelin merkle-tree](https://github.com/OpenZeppelin/merkle-tree) [FULL] - README and LICENSE (MIT, zOS Global Limited); 541 stars, 7 open issues.
- [Paragraph, Introducing Coins](https://paragraph.com/@blog/coins) [FULL] - support wording, 3 tiers, popularity indicator.
- [Farcaster Mini Apps specification](https://miniapps.farcaster.xyz/docs/specification) [FULL for the embed schema] - 3:2 image, button title max 32 characters, `launch_frame`.
- [Gitcoin GG24 OSS QF on Giveth retrospective](https://gov.gitcoin.co/t/gg24-oss-qf-on-giveth-retrospective/24890) [FULL] - 27 Nov 2025 figures.
- [MacRumors, Apple to take up to 30% cut from Patreon creators](https://www.macrumors.com/2026/01/28/patreon-apple-tax/) [FULL] - 1 Nov 2026 deadline, web checkout workaround.
- [Hacker News 46801419](https://news.ycombinator.com/item?id=46801419) [FULL for the top 5 comment threads, read through the Algolia items API]
- [Hacker News 47050300](https://news.ycombinator.com/item?id=47050300) [FULL for the top 5 comment threads, Algolia items API]
- [Reddit r/BASE, Zora casino thread](https://www.reddit.com/r/BASE/comments/1o8alv1/zora_the_future_of_the_creator_economy_or_just_a/) [FULL] - post and top comments, through exa (direct Reddit fetch returned 403).
- [Reddit r/CryptoScams, Zora top creator removed](https://www.reddit.com/r/CryptoScams/comments/1nnxdvr/warning_zora_nuked_their_1_creators_coin/) [PARTIAL - post body only, comments not read; allegations unverified, used only as a platform-risk example]
- [Blockworks, Users debate Zora](https://blockworks.com/news/zora-app-accounts-debate) [FULL] - 13 Aug 2025; Blau and ThankYouX quotes.
- [Nicky Sap, The Creator Coin Delusion](https://nickysap.substack.com/p/the-creator-coin-delusion) [FULL for the claims and the creator comment quoted]
- [Zora support, creator coins](https://support.zora.co/en/articles/6316801) [FULL, read by subagent] - activation is permanent, supply, 1% fee.
- [Stovetop, Content coins won't help creators](https://stovetop.substack.com/p/content-coins-wont-help-creators) [FULL, read by subagent]
- [The Block, Nick Shirley token and Base activity](https://www.theblock.co/news/ecosystems/2026-01-27-nick-shirley-token-base-zora-surge-lack-activity-387106) [FULL, read by subagent]
- [The Block, Clanker revenue Apr 2025](https://www.theblock.co/post/349549) [FULL, read by subagent]
- [crypto.news, Clanker ecosystem fund](https://crypto.news/clanker-launches-ecosystem-fund-to-recycle-fees-into-creators-and-community/) [FULL, read by subagent] - 40/60 split, $50M cumulative.
- [The Block, Pump.fun creator fee overhaul](https://www.theblock.co/post/384975/pump-fun-overhauls-creator-fees-token-launches-highest-daily-september) [FULL, read by subagent]
- [The Block, Pump.fun activity craters](https://www.theblock.co/news/ecosystems/2026-06-16-pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps-404806) [FULL, read by subagent]
- [Bankr support, launching a token](https://bankr-support.support.site/article/launching-a-token) [FULL, read by subagent]
- [Water and Music, music NFT onboarding study](https://www.waterandmusic.com/from-protocols-to-people-music-nft-platforms-onboarding/) [PARTIAL - intro read; published 8 Mar 2022, stale, not relied on]
- [Hypercerts docs](https://docs.hypercerts.org/) [PARTIAL - architecture overview only; contributor-record and anchoring detail not found. Supports the SKIP only]
- [ar.io Turbo pricing](https://docs.ar.io/apis/turbo/upload-service/pricing/) [PARTIAL - no usable per-MB figure; Arweave left optional]
- [Clanker docs FAQ](https://clanker.gitbook.io/clanker-documentation/users/faq) [FAILED - 404 on the URL from search; Clanker figures taken from crypto.news and The Block instead]
- Reddit search and JSON endpoints [FAILED - 403 from WebFetch and curl; Reddit threads above were read through exa instead]
