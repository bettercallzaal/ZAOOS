---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-01
related-docs: 361, 582, 583
tier: DEEP
---

# 584 - Empire Builder x Farcaster: Top-Creator Playbooks + Live ZABAL Data

> **Goal:** Go past doc 582 (V3 surface) and doc 583 (idea surface) into the actual live behaviour of the top 20 empires. Pull real distributions, real boosters, real leaderboards from the V3 API; find the patterns that work; turn the top patterns into immediate hot-fixes and Phase-2 changes for the ZABAL integration shipped in PR #412.

---

## Key Decisions / Recommendations

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Hot-fix empire address in config** | UPDATE `src/lib/empire-builder/config.ts` `ZABAL_EMPIRE_ADDRESS` from `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` (legacy iframe profile URL) to `0xe0faa499d6711870211505bd9ae2105206af1462` (V3 API truth as of 2026-05-01). The old address is what Adrian's profile URL shows; the V3 endpoints return the new one. PR-fix on top of #412 today. |
| 2 | **Expose all 7 ZABAL leaderboards** | The discovery call returns 7 slots: ZABAL holders / ZABAL Farcaster-only / Songjam Season 1 / ZAO RESPECT 1/5/26 / Zabal Voting Miniapp / Songjam Season 2 Ep1 / Songjam Season 2 Ep2. Our EmpirePanel slot selector picks slot 0 only. SHIP a small UI follow-up so members can switch between ZABAL holders and the cross-product slots (Songjam, ZAO RESPECT, Zabal Voting Miniapp). High cross-product value. |
| 3 | **Surface raffle vs weighted distinction** | V3 has TWO distribution types in the wild: `raffle` (10 random recipients per drop) and `weighted` (50-100 recipients by score). ZABAL has 32 distributions, alternating raffle+weighted. EB-3 issue (#418) MUST label the type and recipient count, not just amount. |
| 4 | **Add network-effect boosters to ZABAL empire** | glonkybot (rank 9.34, highest) configures 17 ERC20 boosters at 5x for popular Farcaster tokens (CLANKER, ARTBABY, PUSH, BB, MTDV, hmbt, GMYerb, etc). ZABAL currently has only 4 ERC20 boosters (LOANZ, zaal, SANG, ZAAL) + 1 QUOTIENT. PROPOSE to Adrian + Zaal: add CLANKER, $GLANKER, ARTBABY, BB as 3-5x boosters to ride the network effect into top-20. |
| 5 | **Document the undocumented leaderboard_type values** | V3 public docs list only `tokenHolders`. Live: `tokenHolders`, `farToken`, `api`, `null`. Add to Zod schema as accepted enum (already passthrough in our types.ts; no code change, just doc). |
| 6 | **Document the QUOTIENT booster type** | V3 docs list `NFT`, `ERC20`, `QUOTIENT`. ZABAL uses one. Surface this as "Reputation Booster" badge in EB-5 (#419). Likely tied to Quotient social-graph reputation. |
| 7 | **Top-empire owner archetypes** | Two patterns: token-stack (glonkybot — 17 ERC20 boosters cross-rewarding top empires), NFT-collector (ArtBaby — 10 NFT boosters from rodeo + mintclub at 2-5x). PICK the token-stack pattern for ZABAL because (a) ZAO doesn't run an NFT collection at this scale, (b) ZABAL already cross-rewards SongJam token via SANG. Double down. |
| 8 | **Cadence target** | ArtBaby has 59 distributions vs ZABAL 32. Glonkybot data not pulled for distributions but rank suggests very active. INCREASE ZABAL distribution cadence from ~biweekly to weekly to climb the rank metric. Cron the manual UI distribution once write API opens. |
| 9 | **Sentiment monitoring channel** | EB community lives on X + Farcaster, NOT Reddit (Reddit search returns zero). Schedule a weekly `last30days-skill` run on @glankerempire X account + Empire Builder Farcaster channel to track feature launches. |
| 10 | **Sunday Adrian Q&A — extend doc 582 list** | Add: (a) confirm `farToken` vs `tokenHolders` semantics, (b) confirm `api` leaderboard external feed protocol, (c) QUOTIENT booster source (Quotient API?), (d) when does write API + webhook open, (e) any leaderboard slot ordering UI we can hint at, (f) is `total_distributed` USD or token-denominated? |

## Method

1. Pulled `/api/top-empires?limit=20` + `/api/empires?type=top&limit=15` for ground truth at 2026-05-01.
2. For ZABAL specifically: `/api/leaderboards?tokenAddress=0xbB48f19B...`, `/api/leaderboards/<slot1-uuid>`, `/api/empire-rewards/0xbB48f19B.../distribute`, `/api/boosters/0xbB48f19B...`.
3. Comparison: glonkybot (rank #1 by `rank` score) + ArtBaby (rank #1 by `total_distributed`).
4. X sentiment via WebSearch (Reddit dry; X profile gated, used WebSearch results instead).
5. Cross-checked against doc 361 + 582 to flag drift.

## Top 20 Empires (Live, 2026-05-01)

Sorted by `total_distributed` (USD) descending; `rank` is EB's computed rank score:

| # | Empire | Symbol | Distributed | Burned | FC owner | Created | Rank |
|---|--------|--------|-------------|--------|----------|---------|------|
| 1 | ArtBaby | ARTBABY | $10,797 | 5.6B | artstudio48 | 2025-05-26 | 6.69 |
| 2 | Socialized Creators Union | .C.U.M. | $5,349 | 138M | degencummunist.eth | 2025-09-25 | 6.0 |
| 3 | Keep Pushing | push | $4,066 | 1.04B | push- | 2025-03-27 | 7.10 |
| 4 | glonkybot | GLANKER | $4,061 | 456M | diviflyy | 2025-01-27 | **9.34** |
| 5 | BizarreBeasts | BB | $3,854 | 368M | bizarrebeast | 2025-04-07 | 5.76 |
| 6 | Farverse | FARVERSE | $1,900 | 12.9M | mfbevan.eth | 2025-09-22 | 8.01 |
| 7 | MXJXN | MXJXN | $1,436 | 1.13B | mxjxn | 2025-09-30 | 5.75 |
| 8 | BUG | $BUG | $1,412 | 1.08B | olystuart | 2025-04-03 | 5.82 |
| 9 | RTCHT and Clanker | RaTcHeT | $1,309 | 69M | drakhonen.eth | 2025-03-14 | 7.24 |
| 10 | GM from Yerbearserker | GMYerb | $1,236 | 304M | yerbearserker | 2025-04-17 | 6.26 |
| 11 | The Life of a Showgirl | TLOAS | $658 | 1.30B | yerbearserker | 2025-10-02 | 5.81 |
| 12 | hmbt | hmbt | $576 | 111M | siadude | 2025-03-13 | 7.46 |
| 13 | MetaDev | MTDV | $525 | 627M | n/a | 2025 | n/a |
| 14 | JERBEAR | $JBEAR | $500 | 4.48B | jerbearg.eth | 2025-05-24 | 5.81 |
| 15 | Bribe | bribe | $673 | 9.25M | n/a | 2025 | n/a |
| 16 | FLOCK | FLOCK | $158 | 0 | gully-flock | 2025-07-17 | 6.07 |
| 17 | LIT | LIT | $97 | 0 | wearelum | 2025-08-23 | 6.0 |
| 18-20 | XCM / chaton / Silverchronos | various | <$20 | small | n/a | n/a | n/a |

3 specific numbers worth pinning:
- **100x distribution spread** between top empire (ArtBaby $10,797) and bottom of top-20 (LIT $97).
- **glonkybot is rank 9.34** vs the empire-with-most-USD-distributed which is rank 6.69 - rank is NOT just total_distributed.
- **No top-20 empire pre-dates 2025-01** - V2 era only. Whatever V3 added 2026-05-01 launched into a 16-month-old ecosystem.

ZABAL is NOT in top 20. ZABAL's `total_distributed` from our pull is roughly 32 drops * ~$10 avg = **~$320 lifetime** vs the $97 floor of top 20. ZABAL needs ~3x more distribution volume OR a couple bigger drops to break in.

## ZABAL Live State (the data we're integrating against)

### Leaderboards (slot map)

7 active slots, all anchored to empire address `0xe0faa499d6711870211505bd9ae2105206af1462`:

| Slot # | UUID prefix | Name | Type |
|--------|-------------|------|------|
| 1 | a0f3b306 | ZABAL holders | tokenHolders |
| 2 | 709d1f03 | ZABAL (Farcaster Only) | farToken |
| 3 | 7f230066 | Songjam Season 1 | null |
| 4 | 66ea2cb3 | ZAO RESPECT 1/5/26 | null |
| 5 | 5501171d | Zabal Voting Miniapp | api |
| 6 | 1561d2e9 | Songjam Season 2 Ep2 | null |
| 7 | abecadd8 | Songjam Season 2 Ep1 | null |

This is rich. Our PR #412 slot selector defaults to slot 0 (`a0f3b306`), which is correct for the holder leaderboard. But the cross-product slots (Songjam, ZAO RESPECT, Voting Miniapp) are major value: a member can see their rank across SongJam Season 2 + ZAO RESPECT + ZABAL holding from ONE drawer.

### Top 10 ZABAL holders (slot 1, 2026-05-01)

| Rank | @ handle | Score | Lifetime $ |
|------|----------|-------|-------------|
| 1 | ticweb3 | 433M | $8.26 |
| 2 | ohnahji | 362M | $9.54 |
| 3 | diviflyy (Adrian himself) | 297M | $7.41 |
| 4 | gnericvibes | 267M | $2.17 |
| 5 | metamu | 233M | $6.26 |
| 6 | nounishprof | 226M | $6.68 |
| 7 | ezincrypto | 204M | $0 (uncollected) |
| 8 | candytoybox | 176M | $4.08 |
| 9 | rosecityweb3 | 164M | $4.59 |
| 10 | candytoybox (alt wallet) | 162M | $9.93 |

Adrian (`diviflyy`, glonkybot owner) is **rank 3 in our own ZABAL empire**. This is meaningful network-effect signal — building EB integration good for him is good for us.

Lifetime range $0-$9.93 — small absolute amounts; per-drop ($1-$2) but consistent.

### Distributions (last ~3 months)

ZABAL has 32 distributions; most recent 10 (latest first):

| Date | Type | Amount | Recipients | Tx hash prefix |
|------|------|--------|-----------|-----------------|
| 2026-04-29 | raffle | $12.60 | 10 | 0x4bab5ae4 |
| 2026-04-29 | weighted | $12.45 | 50 | 0xb5272a9e |
| 2026-04-22 | raffle | $13.80 | 10 | 0x8a2c1b2d |
| 2026-04-22 | weighted | $14.25 | **100** | 0xcb488ae6 |
| 2026-04-03 | raffle | $14.70 | 10 | 0xd925110f |
| 2026-03-11 | raffle | $5.10 | 10 | 0x558ea153 |
| 2026-03-09 | weighted | $5.00 | 19 | 0x9cb22849 |
| 2026-03-05 | raffle | $5.20 | 10 | 0xd44151ec |
| 2026-02-24 | weighted | $10.11 | 20 | 0x93868b67 |
| 2026-02-17 | raffle | $5.20 | 10 | 0x12d6db4c |

**Pattern:** Drop events come in pairs - one raffle (10 recipients, random) + one weighted (50-100 recipients, by score). Drop frequency was ~weekly in Feb-Mar, scaled to bigger weighted drops in April (100 recipients April 22). Amounts crept from $5 to $14. Cadence is consistent with manual-UI distribution by Zaal once or twice a week.

This validates a key recommendation in doc 583: when write API opens, automate the pair-drop with BANKER (issue EB-8 #426).

### Boosters

| Token / Item | Type | Multiplier | Min holdings |
|--------------|------|------------|---------------|
| LOANZ | ERC20 | n/a (not pulled) | n/a |
| zaal | ERC20 | n/a | n/a |
| SANG | ERC20 | n/a | n/a |
| ZAAL | ERC20 | n/a | n/a |
| REPUTATION BOOSTER | QUOTIENT | n/a | n/a |

ZABAL boosters are sparse and inward-facing (zaal personal tokens + SANG). Compare glonkybot's 17 boosters that span the entire Farcaster top-empire token list at 5x each.

## Top-Empire Playbooks (Two Archetypes)

### Archetype A: Token-Stack (glonkybot, FARVERSE, hmbt)

glonkybot (rank 9.34, the highest in top-20) configures **17 ERC20 boosters** at 5x for popular Farcaster tokens. Hold any of them at the threshold (`10000000000000000000000000` = 10M tokens with 18 decimals) and your glonkybot score multiplies 5x.

Boosters: MYU, GMYerb, BB (BizarreBeasts), MTDV (MetaDev), CLANKER, CLANKERMON, PUSH (Keep Pushing), DICKBUTT, RUNNER, PANGEA, ARTBABY, LUM, REAPS, SAUSAGE, SPARTAN, hmbt + 1 NFT (Rodeo post #29).

Why it works:
- **Network effect.** Holding any of those tokens gets you into THEIR empire too. Glonkybot members are already in 17 other empires. Their multipliers stack.
- **Adrian aligns with what he's building.** Glonkybot is Adrian's own bot; including the top tokens drives engagement back to those empires; those empires reciprocate.
- **5x is the dominant multiplier.** Glonkybot uses 5x for almost everything. Suggests 5x is the "good citizen" multiplier across the ecosystem.

### Archetype B: NFT-Collector (ArtBaby)

ArtBaby (top USD distributor) configures **10 NFT boosters** at 2-5x from rodeo + mintclub platforms. Multipliers shaped to art-world hierarchy: 2x for "any signed original artwork", 5x for specific minted drops ("Blooming", "DreamNow", "Ms Princess", etc).

Why it works:
- ArtBaby is an art empire; NFTs are the native unit.
- Rodeo + mintclub are both Farcaster-native NFT mint platforms. Members are already there.
- 59 distributions in ~12 months = a drop every ~6 days. Heavy cadence drives leaderboard dynamism.

### Why ZABAL should pick Token-Stack

ZAO is not (yet) running an NFT collection at the scale ArtBaby does. ZAO IS running multiple tokens and adjacent empires (SongJam SANG, MAGNETIQ, ZOUNZ, COC Concertz, Empire Builder itself). Add CLANKER, GLANKER, ARTBABY, BB, PUSH as 3-5x ZABAL boosters to ride the same network effect.

## Sentiment + Ecosystem Context

X / Farcaster signals:

- @glankerempire X account exists and posts about EB updates. Two recent posts:
  - "DYK that everyone on Farcaster has an Empire Builder profile? Yup..." (Jul 2025)
  - "Cobuild is a very potent Farcaster mini-app from @rocketman_w that takes the tipping concept..." (Aug 2025)
- "GM Farcaster ep295 with Jordan from Empire Builder" (Oct 2025) is the canonical podcast intro.
- Reddit signal is **zero** for "empire builder" + "boosters" / "tokens" / "Farcaster". The community is on X + Farcaster, not Reddit. Don't waste tier-DEEP cycles on Reddit again for this topic.

Adjacent ecosystem context (Farcaster 2026):

- Clanker (acquired by Farcaster) drives the token-creation pipe. EB picks up where Clanker leaves off (rewards layer for the tokens Clanker creates).
- Cobuild is a related primitive: Zora-creator-coin tipping per Farcaster interaction. EB and Cobuild both bet on "tokens earned through behaviour" but Cobuild is per-interaction, EB is per-distribution-event.
- Faircaster ($fair) is "agent-led capital" using social signals to invest. Same vector as a Phase-3 BANKER-driven distribute on EB.
- LUM (Luminous, Aether AI agent) hit $57M cap in Nov 2024 — proof that an autonomous agent + Clanker + a community can scale a token to real money. ZAO + BANKER + EB write API is the same blueprint.

## Sources

External (verified 2026-05-01):
- [Empire Builder API top-empires](https://empirebuilder.world/api/top-empires?page=1&limit=20)
- [Empire Builder API empires list](https://empirebuilder.world/api/empires?type=top&page=1&limit=15)
- [ZABAL leaderboard discovery](https://empirebuilder.world/api/leaderboards?tokenAddress=0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [ZABAL holders leaderboard](https://empirebuilder.world/api/leaderboards/a0f3b306-169b-4917-a1fa-5e3ea933fa71)
- [ZABAL distributions](https://empirebuilder.world/api/empire-rewards/0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07/distribute)
- [ZABAL boosters](https://empirebuilder.world/api/boosters/0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07)
- [glonkybot boosters](https://empirebuilder.world/api/boosters/0x33ac788bc9ccb27e9ec558fb2bde79950a6b9d5b)
- [ArtBaby boosters](https://empirebuilder.world/api/boosters/0x09f3f0ee2cf938f56bc664ce85152209a7457b07)
- [ArtBaby distributions](https://empirebuilder.world/api/empire-rewards/0x09f3f0ee2cf938f56bc664ce85152209a7457b07/distribute)
- [GM Farcaster ep295 with Jordan from Empire Builder](https://www.youtube.com/watch?v=qRjQxkihNpQ)
- [Farcaster in 2025: The Protocol Paradox - BlockEden](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)
- [Clanker acquired by Farcaster - The Defiant](https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot)
- [@glankerempire on Cobuild](https://x.com/glankerempire/status/1961678025440793018)
- [@glankerempire on profiles](https://x.com/glankerempire/status/1947647704470880728)

Internal:
- `research/business/582-empire-builder-v3-live-launch/README.md`
- `research/business/583-empire-builder-zao-os-integration-ideas/README.md`
- `research/business/361-empire-builder-deep-dive-v3-integration/README.md`
- `community.config.ts:36` (zabal as Farcaster channel)
- PR #412 (MVP integration)
- Issues #413-#427 (15-issue roadmap)

Community sources: X (3 posts), YouTube podcast (1 episode), tech press (2 articles). Reddit signal is zero, confirmed.

## Also See

- [Doc 582](../582-empire-builder-v3-live-launch/) - V3 endpoint surface
- [Doc 583](../583-empire-builder-zao-os-integration-ideas/) - 15-idea ranked surface
- [Doc 361](../361-empire-builder-deep-dive-v3-integration/) - V2 baseline + ZABAL token address
- PR #412 - MVP code shipped 2026-05-01
- Issues #413-#427 - 15 GitHub issues for the build queue

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| **Hot-fix** `ZABAL_EMPIRE_ADDRESS` to `0xe0faa499d6711870211505bd9ae2105206af1462` in `src/lib/empire-builder/config.ts`. Open follow-up PR on top of #412. | @Claude (next session) | PR | Today |
| Add `leaderboard_type` enum hint to types.ts: `tokenHolders | farToken | api | null` (passthrough already, but documents intent) | @Claude | Same fix-up PR | Today |
| Update `EmpirePanel` slot selector copy: tag slot type next to slot name (e.g. "Farcaster Only", "API-fed", "Holders") | @Claude | Same fix-up PR | Today |
| Propose to Adrian + Zaal: add CLANKER + GLANKER + ARTBABY + BB + PUSH ERC20 boosters to ZABAL empire at 3-5x | @Zaal | Telegram DM | Before Sunday 2026-05-04 |
| Sunday Q&A extension: ask Adrian about `farToken` semantics, `api` leaderboard feed, QUOTIENT booster source, `total_distributed` USD vs token denomination | @Zaal | Telegram | Sunday 2026-05-04 |
| Update issue #418 (EB-3 distribution feed) acceptance criteria to require labelling `raffle` vs `weighted` + recipient count | @Claude | Issue edit | Today |
| Update issue #419 (EB-5 boosters dashboard) to surface QUOTIENT type as "Reputation Booster" badge | @Claude | Issue edit | Today |
| Increase ZABAL distribution cadence proposal: weekly pair-drop (raffle + weighted) to ~$15-25/event, target $1K total in 8 weeks | @Zaal | Decision | Discuss in next sync |
| Schedule a recurring `last30days-skill` weekly run on @glankerempire X + Empire Builder Farcaster channel | @Claude | `/schedule` | After this PR merges |
| Pull glonkybot distributions for direct cadence comparison vs ZABAL/ArtBaby | @Claude (next session) | Research follow-up | Optional |

## Risks + Open Questions

| Risk / Question | Mitigation |
|------------------|-------------|
| Empire address mismatch in `config.ts` | Hot-fix today. Existing PR #412 still works if EB resolves the token address upstream, but MVP fragility increases for write-API future. |
| `total_distributed` may be USD-denominated for some empires, token-denominated for ArtBaby | Verify with Adrian. Render both USD + token in UI when known; raw number otherwise. |
| `farToken` filter intent unknown | Could be Farcaster-verified holders only, or Farcaster-account-tied wallets. Clarify before exposing as "Farcaster Only" copy. |
| `api` leaderboard external feed | Could let ZAO push custom scores (raid points, GM streaks) into a ZABAL leaderboard slot. Game-changing if true. Ask Adrian. |
| QUOTIENT booster source unverified | Likely Quotient social-graph reputation. Confirm. |
| Public reads have no rate limit doc | Our 60s cache is conservative. Probably fine but unknown. |

## Staleness Notes

- All API data current as of 2026-05-01. ZABAL distribution count of 32 will grow; re-pull weekly.
- Top 20 empires can shift; rank metric is dynamic. Re-pull monthly.
- Recheck on 2026-05-29 or sooner if Adrian announces feature changes.
