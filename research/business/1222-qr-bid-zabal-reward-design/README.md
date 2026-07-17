---
topic: business
type: design-spec
status: design-complete
last-validated: 2026-07-17
related-docs: 91fcac2e (board task), 1096 (Sparkz deep design), 626 (Empire Builder POIDH airdrop), 625 (POIDH playbook)
tier: STANDARD
original-query: "Design the mechanic for Zaal to pay ONE QR bid per actively-submitted ZABAL project. Verify QR coin bidding mechanics on Base. Zaal pays (gated) - design only."
---

# 1222 - QR-Bid-Per-ZABAL-Submission Reward Design

> **Purpose:** Specify the mechanic for rewarding each actively-submitted ZABAL Gamez project with one QR coin bid (funded by Zaal). Define "actively submitted," calculate cost exposure, outline execution steps, and flag the verification items Zaal must resolve before paying.

## TL;DR decision

**Recommended mechanic:** Zaal sends a one-time transfer of $QR tokens (1 bid-unit per project = 1 POIDH bounty on the `qr.xyz` daily auction) to each builder's wallet address. This is NOT a vote or an auction bid on behalf of the builder - it is a direct token transfer that gives each builder the purchasing power to place their own bid in the QR auction if they choose. Zaal stays out of the builder's auction strategy.

**Alternatively (simpler):** Skip the QR auction mechanic entirely and just transfer a fixed $QR amount to each qualifying builder's wallet as a thank-you. The "bid" framing was a design question, not a requirement.

---

## Background: What is QR Coin?

$QR (contract: verify on Base via Basescan before executing) is a Farcaster-native ERC-20 launched February 2025 via Clanker on Base. Key characteristics from doc 1096:

- **Daily auction mechanic:** Every 24h, the `qr.xyz` site holds a sealed-bid auction for a QR code NFT (a branded, scannable code that redirects to a URL of the winner's choice). Bidders commit $QR tokens; the highest bidder wins the NFT and the redirect slot; all losers receive instant refunds. The NFT is a 24h marketing asset (the QR redirect is live for that day).
- **Peak market cap:** $4.3M (Feb-Mar 2025), settled to ~$1.8-2M by mid-2025.
- **Launched via Clanker** on Base - same launch rail Sparkz uses.
- **Physical-digital hybrid:** The QR code can be printed, placed on merch, etc. - giving it real utility beyond speculation.
- **Sybil resistance:** One bid per wallet per auction. Instant refund means no capital lockup beyond the winning bid.

### What "one QR bid" costs

This requires live verification before Zaal executes (prices are volatile):

| Item | What to check | Where |
|---|---|---|
| $QR token contract | Verify the canonical Base contract address | `qr.xyz` or Basescan |
| Current $QR price (USD) | Spot price | Uniswap/Aerodrome $QR/WETH pool on Base |
| Minimum daily auction bid | The floor bid that actually competes | `qr.xyz` live auction page |
| Gas cost for token transfer | Estimate at current Base gas | Basescan gas tracker |

**Estimated cost range (design-time estimate, unverified):** If the floor bid in the daily auction is ~500-2000 $QR, and $QR trades at $0.001-0.005 USD, the per-builder cost is roughly $0.50-$10 in $QR plus gas (~$0.01 on Base). With 3 builders currently active, total exposure is $1.50-$30 in $QR tokens.

---

## Defining "Actively Submitted"

A ZABAL Gamez project counts as "actively submitted" for the QR bid reward if ALL of the following are true:

1. **`intake_ready: true`** in `data/builder-submissions.json` (meaning the project is live/working, not planned).
2. **At least one working URL** (`live` or `repo` field populated, returns 200).
3. **Track declared** (`artist`, `builder`, or `creator`).
4. **Builder has a wallet address** (needed for $QR token transfer; OR a Farcaster FID that can be resolved to a wallet via Neynar).

### Current qualifying projects (from builder-submissions.json, 2026-07-17)

| Builder | Project | Track | Wallet Available? |
|---|---|---|---|
| ghostmintops | ZABAL Recording Scout | builder | Needs wallet from entry.html register |
| ghostmintops | Proof Drop | builder | Needs wallet |
| ghostmintops | WaveWarZ Gravity Board | builder | Needs wallet |
| ghostmintops | Founder Nexus | builder | Needs wallet |
| ghostmintops | DreamNet Publishing | creator | Needs wallet |
| ghostmintops | ZAO music | artist | Needs wallet |
| branth | WaveWarZ Bridge Portal | builder | Needs wallet |
| jdwalka | Chroma Poker | builder | Needs wallet |
| jdwalka | Predictive apps Space | creator | Needs wallet |

**Total: 9 qualifying projects** across 3 builders. Zaal pays 9 QR bid-units.

**To consolidate per-builder (not per-project):** 3 builders = 3 bid-units. The task says "per project" so the 9-bid interpretation is what the board task specifies. Zaal should confirm: per-project or per-builder?

---

## Execution Steps (Zaal-Gated)

### Pre-flight (Zaal verifies before spending)

1. **Resolve the canonical $QR token address on Base.** Do NOT use any address from a search engine or DM - only from `qr.xyz` or the Clanker launchpage.
2. **Check the live auction floor bid** at `qr.xyz` (the daily auction page). Note the minimum winning bid from recent auctions (usually visible in auction history).
3. **Calculate cost:** (floor bid per auction) * (9 projects OR 3 builders, Zaal's call) * ($QR spot price) + gas.
4. **Confirm each builder's wallet.** Resolve from `zabal:builds` Redis key (from `api/register.mjs`) or ask builders to post their wallet in /zabal.

### Execution options

**Option A: Direct token transfer (simplest)**
- Zaal holds or acquires $QR tokens
- Transfers `bid_unit_amount` $QR to each builder's wallet
- Builders can then bid in the daily auction themselves (or hodl)
- Gas: ~9 ERC-20 transfers on Base = ~$0.10 total
- Zaal does NOT control how builders use the tokens

**Option B: Zaal bids on builders' behalf**
- Zaal places 9 bids in the `qr.xyz` daily auction (one per project)
- Each bid nominates a URL (point to `zabalgamez.com/builder/handle` or the project live URL)
- If Zaal's bid wins any auction, the QR code redirect goes to that builder's project
- Cost: Zaal wins 0 to N auctions; refunded for all losing bids except gas
- Risk: Zaal may win 0 auctions if other bidders outbid; or win all 9 if bids are high enough
- This option has high variance in cost and builder benefit

**Option C: Buy QR code NFTs from secondary**
- If auction bids are too competitive, buy existing QR code NFTs from secondary marketplaces
- Less elegant (not the primary mechanic) but deterministic cost

**RECOMMENDATION:** Option A (direct token transfer). Builders receive the $QR and can bid themselves or sell. Zaal's cost is fixed and predictable. The "bid" is the token itself - each builder now has the purchasing power for one auction bid.

---

## Cost Exposure Summary (to verify before executing)

| Scenario | Projects | $QR per unit | Total $QR | USD at $0.002/token |
|---|---|---|---|---|
| Per-project (current) | 9 | 1,000 | 9,000 QR | ~$18 |
| Per-builder | 3 | 1,000 | 3,000 QR | ~$6 |
| If floor bid is 2,000 QR | 9 | 2,000 | 18,000 QR | ~$36 |
| If floor bid is 500 QR | 3 | 500 | 1,500 QR | ~$3 |

All USD estimates assume $QR = $0.002. Verify on Uniswap/Aerodrome before executing.

---

## Open Questions for Zaal

1. **Per-project or per-builder?** 9 bids vs. 3 bids changes cost 3x.
2. **What does the builder get?** Token transfer (they bid themselves) or Zaal bids for them?
3. **Is $QR the right coin?** The "QR bid" framing might be metaphorical - if the intent is just "reward builders with something," a ZABAL airdrop (doc 626 Empire Builder pattern) or a POIDH bounty claim is more native to the ZAO ecosystem.
4. **Wallet resolution:** How will Zaal get builder wallets? From `api/register.mjs` Redis key `zabal:builds`, from the QV voting form (if builders include wallet), or by direct DM request.

---

## Alternative: ZABAL Gamez POIDH Bounty (simpler, native)

If the QR coin mechanic is complex (Zaal flagged "may not be easy"), a simpler alternative that achieves the same "reward each submitted project" goal:

- Create a POIDH open bounty on Base (doc 625 playbook): "ZABAL Gamez July Builder Reward Pool - one claim per submitted project."
- Fund with 0.009 ETH (3 builders * 0.003 ETH each) or scale per project.
- Accept claims from builders with their project URL as the proof.
- Award via POIDH solo acceptance.

Cost: 0.009 ETH + 2.5% protocol fee = ~0.00922 ETH (~$0.25-$0.30 at $27 ETH). Dramatically cheaper and more battle-tested. ZAO already has a POIDH album and playbook.

---

## Sources

- Board task `91fcac2e-11bc-47c1-a4f8-9056a3f94622`
- Doc 1096 (Sparkz deep design - QR coin case study section)
- Doc 625 (POIDH playbook)
- Doc 626 (Empire Builder ZABAL POIDH airdrop architecture)
- `data/builder-submissions.json` (zabalgames repo, PR #551)
