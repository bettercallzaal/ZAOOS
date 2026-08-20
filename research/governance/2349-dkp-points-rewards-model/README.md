---
topic: governance
type: research
status: research-complete
last-validated: 2026-08-20
related-docs: 2345, 941, 935, 696, 1770
original-query: "Research DKP (World of Warcraft) as a points/rewards model - input to ZOLs + the fractal-respect bounty design (board card 0252bda4)"
tier: QUICK
---

# 2349 - DKP (Dragon Kill Points) as a Points/Rewards Model

> **Goal:** Board card 0252bda4 (P3, from the OneNote Zaal-todos sweep): ground what
> DKP actually is and extract what transfers to ZOLs and to the respect-awarded
> bounty board (doc 2345). Grounded per research-grounding.md - one FULL raw fetch
> carries every specific claim; five failed fetches are listed, and nothing from
> them is cited.

## What DKP is (all claims from the Wikipedia article, fetched raw, FULL)

- **A private points economy on a social contract.** DKP is a semi-formal
  score-keeping system guilds use to allocate scarce raid loot. Invented for
  EverQuest in 1999 by Thott (guild "Afterlife"), named for the dragons Lady Vox
  and Lord Nagafen. Points are earned by participating in raids and **spent** on
  dropped items. They are "not the same thing as the virtual currency provided by
  the game company... The points themselves represent only the social contract
  that guilds extend to players. Should that player leave the guild or the guild
  disband, those points become valueless."
- **The allocation problem it solves:** a 25-person raid may see only 2-3 items
  drop. Small groups use dice rolls; at scale, formal point systems emerge.
- **Three canonical variants:**
  1. **Zero-sum DKP** - the winner pays the item's price and that exact amount is
     divided among the rest of the raid; net change is zero. Inflation-free by
     construction.
  2. **Simple DKP** - fixed price list per item, fixed points per raid attended.
     No redistribution; supply grows every raid.
  3. **Auction DKP** - prices are hard to set centrally ("analysis of a particular
     item can be subjective and laborious" - Castronova & Fairfield), so guilds
     auction items in open-ascending or sealed-bid (first/second-price) formats.
- **What the scholarship says it really does:** Mortensen calls DKP a "social
  stabilizer" - players who attend and follow the rules reap rewards, an
  incentive "to remain in the social system (the guild) longer than they might
  otherwise." Malone: the points are "a melange of cultural and material
  capital... crosses the line between material and symbolic." Buying DKP with
  real money is "almost unheard of."
- **Documented failure modes:** selfish bidding is socially costly (an item can
  go to whoever hoards points, not who best uses it - Chen); price-setting is
  labor for leadership (Castronova); points accumulate indefinitely between
  raids (hoarding is structural in simple DKP).

## The one structural difference from Respect

**DKP is earn-then-SPEND; Respect is earn-only.** A DKP balance is drawn down at
redemption; Respect (soulbound, doc 696) is permanent governance weight. That
difference decides where each lesson lands:

| DKP property | Where it maps in ZAO |
|---|---|
| Valueless outside the guild (social contract, non-transferable) | Already Respect's soulbound property - DKP is 25 years of precedent that this WORKS as a retention/fairness device |
| Spendable points redeeming scarce things | **ZOLs**, not Respect. If ZOLs ever redeem anything scarce (merch, artist slots, judging seats, priority), ZOLs are DKP and inherit its whole design space |
| Zero-sum award (winner pays the raid) | A ZOLs option if redemption launches: keeps supply flat, kills inflation worry (doc 935's concern) without decay |
| Auctions instead of price lists | If ZOLs redeem scarce one-off things, auction them - do not hand-price them; Castronova's price-setting pain is the warning |
| Points-per-raid attendance | The exact shape of camera-on +10 and bounty-tier awards (docs 1770, 2345) - flat, legible, per-event |
| Social stabilizer (retention via accrued stake) | The function the weekly fractal already performs; validates bounties as a third earning surface (2345) - remote builders accrue the same stake |
| Hoarding + selfish-bid failure modes | If redemption exists, expect hoarding; a decay or use-it window is the standard counter - which is doc 941's Active/Banked split territory |

## What this changes for the two target designs

1. **Doc 2345 (respect bounty board): nothing to change.** Bounty respect is
   earn-only per judged artifact - it inherits DKP's stabilizer effect with none
   of its spend-side problems (no prices, no auctions, no hoarding, because
   nothing is redeemed). The design's "not DKP-spendable" note is confirmed
   right.
2. **ZOLs: the real DKP heir.** The moment ZOLs become redeemable, pick the
   variant deliberately: zero-sum or auction beats a hand-maintained price list,
   and an expiry/decay window beats unlimited hoarding. Until redemption exists,
   ZOLs-as-recognition needs none of this machinery. Recommend: park this doc as
   the input to any future "ZOLs redemption" design and do not build ahead of
   need (code-restraint rung 1).
3. **Doc 941 (decay proposal): one caution.** DKP-community decay practice is
   often cited as precedent, but every source that would ground it FAILED this
   run (below). Do not cite "DKP guilds decay points" in the whitepaper or 941
   materials until a real source is fetched. The Wikipedia article documents
   accumulation between raids, not decay.

## Sources (per research-grounding.md)

| Source | Method | Status |
|---|---|---|
| en.wikipedia.org/wiki/Dragon_kill_points | curl, raw wikitext via action=raw, 14.6KB read in full | **FULL** - every specific claim above |
| Castronova & Fairfield, "Dragon Kill Points: A Summary Whitepaper" (2006, SSRN 958945); Malone (2009, Games and Culture); Mortensen (2006); Chen (2008) | Quoted AS CITED INSIDE the Wikipedia article - the papers themselves were not fetched | PARTIAL (secondhand) |
| warcraft.wiki.gg/wiki/DKP and /wiki/EPGP | curl | **FAILED** - wiki.gg bot-blocked |
| wowpedia.fandom.com DKP + EPGP (action=raw) | curl | **FAILED** - Cloudflare challenge |
| papers.ssrn.com abstract 958945 | curl | **FAILED** - Cloudflare challenge |
| web.archive.org EPGP capture | curl | **FAILED** - returned Wayback frame, no article text |

EPGP (the effort-points/gear-points ratio variant) is therefore **UNVERIFIED this
run** and deliberately unused above.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Card 0252bda4: mark done with this doc as proof | metawall / Zaal | Board | On merge |
| If/when ZOLs redemption is designed, start from the mapping table here | future lane | Design | On demand |
| Before citing DKP decay anywhere in 941/whitepaper material, fetch a real source (EPGP docs, guild archives) | any lane | Verification | Before cite |
