# 415 — POIDH Bounties: Deep Dive for The ZAO + WaveWarZ

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Map POIDH bounty protocol mechanics, analyze 8 reference bounties across Arbitrum/Base/Degen, and design a ZAO + WaveWarZ bounty playbook (ZAO Stock Oct 3 2026, raids, artist promo, IRL docs).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Bounty platform for ZAO community tasks | USE POIDH on Base — $0 infra cost, 2.5% fee, escrow native, NFT proof of work already solved |
| Bounty type default | USE **Open bounty** for ZAO community pots (anyone adds funds, weighted voting). USE **Solo bounty** for Zaal-paid flyer/artist tasks (instant accept, no voting) |
| Chain for ZAO Stock | USE **Base** — same chain as $ZAO token, 1-10c gas, Jesse Pollak tops bounties there |
| Chain for WaveWarZ | USE **Degen Chain** — DEGEN-denominated rewards match the tipping culture, Farcaster-native audience, 0xSero's V3 contract already deployed at `0x2445BfFc6aB9EEc6C562f8D7EE325CddF1780814` |
| First bounty size to launch | START at **$5-10 pots** (0.0025 ETH ≈ $6.25 is a proven entry point). Scale up once submission flow is validated |
| Proof format | REQUIRE photo/video + text description. Claim is minted as NFT → bounty creator keeps NFT on accept → perfect for ZAO Stock archival |
| Voting for ZAO Stock team pots | USE 48hr open-bounty voting, contributor-weighted. Team members who chip in $5+ get proportional veto power |
| WaveWarZ tie-in | EACH round can seed a POIDH bounty for raid proof, artist IRL photo, best fan edit — winners collect SANG/DEGEN + NFT receipt |
| Skip | SKIP building a custom bounty contract. POIDH already audited (V3 by 0xSero, Foundry, pull-payments, reentrancy-safe) |
| Integration step 1 | ADD a `/bounties` page under `src/app/stock/` that embeds a curated list of live POIDH bounties tagged `#zao-stock` |

---

## How POIDH Works (Mechanics)

### Two Bounty Types

| Type | Who adds funds | Who picks winner | Voting period | Use case |
|------|---------------|------------------|---------------|----------|
| **Solo** | Only creator | Creator hits "accept" | None — instant transfer | Zaal pays a flyer, one-shot tasks |
| **Open** | Anyone can top up | Weighted vote of contributors | 48 hours | Crowdfunded community pots, ZAO Stock team pots |

### Lifecycle (5 steps)

1. **Create** → title + description + reward token. Funds escrowed on-chain. Creator can cancel any time **before** acceptance (funds returned).
2. **Top up** (open only) → anyone adds ETH/DEGEN. Voting weight = % of pot contributed.
3. **Claim** → claimant uploads photo/video + text description. Minted as ERC-721 NFT, held in escrow by the POIDH contract.
4. **Accept / Vote**:
   - Solo: creator hits "accept" → funds to claimant, NFT to creator.
   - Open: 48hr yes/no vote. Creator's contribution auto-counts as "yes". Passes unless >50% weighted NO.
5. **Payout** → 2.5% fee to POIDH treasury. Remainder to claim winner. NFT transferred to bounty creator (or stays with accepted claimant per V3 design). 5% royalty on secondary NFT sales.

### Vote Math Example

Open bounty pot of 100 DEGEN, 5 contributors: A 40% / B 20% / C 15% / D 15% / E 10%. A + B vote YES (60%). C + D + E vote NO (40%). Claim **passes**.

### Contracts (live)

| Chain | Address | Explorer |
|-------|---------|----------|
| Arbitrum | `0x0aa50ce0d724cc28f8f7af4630c32377b4d5c27d` | arbiscan.io |
| Base | `0xb502c5856f7244dccdd0264a541cc25675353d39` | basescan.org |
| Degen | `0x2445BfFc6aB9EEc6C562f8D7EE325CddF1780814` | explorer.degen.tips |

V3 rebuild on GitHub: `0xSero/poidh-v3` — Foundry, pull-based payments, reentrancy guards, `_mint` not `_safeMint` to avoid ERC721 callback reentrancy. Claim NFT escrow is separate contract.

### Fees

- **2.5%** of completed bounty to POIDH treasury
- **5%** suggested royalty on NFT resale
- **0%** on cancel/withdraw (gas only)
- **Gas:** ~1-10¢ on Base/Arbitrum, sub-cent on Degen

---

## 8 Reference Bounties Analyzed

Bounty pages are SPA-rendered — `/bounty/:id` returns a loading shell to server-side fetch. Analysis below combines titles/metadata pulled from search indexes, POIDH's own X account, and case studies.

| # | Title | Chain | Pattern | ZAO/WaveWarZ analogue |
|---|-------|-------|---------|----------------------|
| arb/283 | *On The Ground — We Them Media Cultural Scout Bounty* | Arbitrum | Field reporting / cultural scout | ZAO Stock vendor + busker scouting bounty |
| arb/282 | *Jingle Bounty — One Month* | Arbitrum | Time-boxed creative (write a jingle) | WaveWarZ "write a jingle for round winner" |
| base/1137 | *Artizen Showcase clip* | Base | Best video clip submission | ZAO Stock best-clip-of-the-day pot |
| degen/1362 | *shred for DEGEN* 🎸🔥 | Degen | Music performance proof | WaveWarZ artist shred clip, SANG/DEGEN prize |
| base/1134 | *Create new Mage skin for Defense of the Agents* | Base | Game art bounty | ZAO Stock mascot / ZAOVille character skin |
| degen/1167 | *kickflip world record for DEGEN* 🛹🎩 | Degen | Physical stunt / IRL challenge | ZAO Stock "most creative onsite moment" pot |
| base/909 | *Onboarding to base app* | Base | Walkthrough / onboarding video | ZAO OS onboarding video bounty, paid in $ZAO |
| base/906 | *a picture that made you smile this month* | Base | Low-barrier open call | ZAO Stock "favorite Franklin St Parklet moment" weekly pot |

### Patterns across all 8

1. **Titles read like prompts**, not job posts. Emojis OK. 3-8 words.
2. **Descriptions short** (2-4 sentences) with 1-3 hard constraints (dimensions, hashtag, deadline).
3. **Chain matches audience** — creative/music on Degen, builder/dev on Base, writing on Arbitrum.
4. **Reward ranges observed** — $5 lowballs get boosted by community (Jesse Pollak added 0.25 ETH to a $5 bounty). Music/design pots land $30-$100. Dev bounties hit $200+.
5. **Proof format is always visual** — photo, video clip, PNG, or screenshot. Text is secondary.
6. **Community tops up 30-50% of winning pots** via open bounty mode.

### DEGEN Community Call POAP — Concrete Template

- Title: *Design POAP Artwork for Degen Community Call*
- Description: 500x500px round PNG, <200KB, theme: commemorate the Jan 15 X Spaces call
- Reward: **10,000 DEGEN** (solo bounty, creator-funded)
- Result: **50+ submissions**, Oscar Civit won, POAP Drop #183537 hit **1000+ collectors**

This is the model to copy for ZAO Stock POAPs, ZAOVille skins, and merch art.

---

## ZAO + WaveWarZ Bounty Playbook

### A. ZAO Stock 2026 (Oct 3, Franklin St Parklet)

Each below is a live template. Copy/paste into POIDH as solo (Zaal-funded) OR open (team pot).

**Design Team (DaNici lead, Shawn + FailOften)**

1. **Title:** *ZAO Stock flyer v1* — Chain: Base — Type: Solo — Reward: $25-50
   Description: "Poster for Oct 3 Franklin St Parklet event. 11x17, vertical. Must include ZAO Stock logo, date 10/3/26, COC Concerts + Art of Ellsworth footer. PDF + PNG."

2. **Title:** *ZAOVille x ZAO Stock melded logo* — Chain: Base — Type: Solo — Reward: $50-100
   Description: "DCoop is exploring a melded logo. Submit mark concept, color variations (navy #0a1628 + gold #f5a623). SVG."

3. **Title:** *ZAO Stock t-shirt print-on-demand art* — Chain: Base — Type: Open — Starting pot: $30
   Description: "Front + back art ready for PoD. Shawn's concept is the brief. Submit high-res PNG 4500x5400."

**Operations Team (Zaal/Candy lead)**

4. **Title:** *IRL photo + bio for ZAO Stock profile page* — Chain: Base — Type: Solo — Reward: $5 per member
   Description: "Members only. Submit IRL photo + 3-sentence bio + links. For website + AI profile."
   (Ship this TODAY — kills team homework backlog fast.)

5. **Title:** *Bangor Savings Bank sponsor deck v1* — Chain: Base — Type: Solo — Reward: $50
   Description: "3-slide PDF. Value prop, audience, logo placement mockup on COC Concerts. Feed into the monthly corporate giving review."

**Finance Team (Zaal lead)**

6. **Title:** *Find 10 Ellsworth-area corporate giving targets* — Chain: Base — Type: Solo — Reward: $20
   Description: "CSV of 10 businesses within 30mi of Ellsworth with monthly/quarterly sponsor programs. Include contact email + budget range."

**Music Team (Zaal/DCoop lead)**

7. **Title:** *Best ZAO Stock artist pitch video (30s)* — Chain: Degen — Type: Open — Pot: 5000 DEGEN
   Description: "30s video selling the event to indie artists. Will use on Farcaster + X outreach. AttaBotty + Shawn judge."

8. **Title:** *Onsite photo documentarian of the day* — Chain: Base — Type: Open — Pot: $100-200
   Description: "Oct 3 ONLY. 20+ photos of Franklin St Parklet throughout the day. Post claim by midnight. Winner picked by team vote 48hr after."

### B. WaveWarZ Integration

9. **Round-tied bounty:** every WaveWarZ round spawns a POIDH bounty on Degen:
   *"Best raid proof / fan edit / IRL artist photo — Round N"* — 1000-5000 DEGEN pot, crowd-funded by $ZAO holders.
10. **Artist onboarding bounty:** *"Cast yourself performing X track"* — solo bounty per artist, 100-500 DEGEN, NFT goes to artist's wallet as archival proof.

### C. Raid Bounties (Empire Builder + RaidSharks tie-in)

11. **Title:** *Top 50 ZABAL raid — quote-cast a top 50 cast with #WaveWarZ* — Chain: Degen — Open pot: 2000 DEGEN
    Description: "Screenshot of your cast reply + quote. Minimum 2 engagements. Team votes 48hr."

### D. Pricing Tiers (Anchor These)

| Tier | Range | Trigger |
|------|-------|---------|
| Micro | $5 | Single photo, IRL doc, homework-level task |
| Small | $10-25 | 30min-2hr effort, single creative output |
| Medium | $50-100 | Full design deliverable, event coverage |
| Large | $200+ | Sponsor decks, video productions, onboarding flows |

---

## ZAO Ecosystem Integration (file paths)

- `community.config.ts` — add `poidhChain: "base"` + treasury addresses per chain
- `src/app/stock/` — ZAO Stock homepage. Add `bounties/page.tsx` that lists live POIDH bounties tagged by the team
- `src/lib/publish/` — auto-cast new POIDH bounties to Farcaster `/thezao` channel via existing cross-platform publish pipeline
- `src/components/wavewarz/` — hook round results to auto-seed a POIDH bounty on Degen
- `research/business/361-empire-builder-deep-dive-v3-integration/README.md` — tie raid bounties into Empire Builder V3 API queue
- `ZAO-STOCK/standups/2026-04-14-kickoff-recap.md` — amend homework section with POIDH bounty link for member IRL photo + bio

### Implementation Sketch (next session)

```ts
// src/lib/bounties/poidh.ts
export const POIDH_CONTRACTS = {
  base:     "0xb502c5856f7244dccdd0264a541cc25675353d39",
  arbitrum: "0x0aa50ce0d724cc28f8f7af4630c32377b4d5c27d",
  degen:    "0x2445BfFc6aB9EEc6C562f8D7EE325CddF1780814",
} as const;

export type PoidhChain = keyof typeof POIDH_CONTRACTS;

export function poidhUrl(chain: PoidhChain, bountyId: number) {
  return `https://poidh.xyz/${chain}/bounty/${bountyId}`;
}
```

Read-only list view first. Deep link out to POIDH for claim/vote actions — don't rebuild the UI.

---

## Open Questions (Follow-Up Research)

1. Does POIDH V3 support ERC-20 reward tokens (e.g. $ZAO, $SANG) or ETH/DEGEN only? — check `0xSero/poidh-v3` contract source.
2. Is there a webhook/event feed so ZAO OS can auto-ingest new bounties tagged `#zao`?
3. Can we deploy a ZAO-branded fork on our own subdomain using the same V3 contracts (they're permissionless)?
4. POAP integration — is Drop creation automated post-bounty or manual? (DEGEN community call was manual.)

---

## Sources

- [poidh.xyz — homepage](https://poidh.xyz/)
- [poidh FAQ](https://info.poidh.xyz)
- [poidh beginner guide](https://words.poidh.xyz/poidh-beginner-guide)
- [Open multiplayer bounties explained](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained)
- [POIDH x POAP DEGEN community call case study](https://words.poidh.xyz/poidh-poap-degen-case-study)
- [poidh terms](https://poidh.xyz/terms)
- [0xSero/poidh-v3 on GitHub](https://github.com/0xSero)
- [poidh V3 coverage & simulation docs](https://zread.ai/0xSero/poidh-v3/23-coverage-and-simulation)
- [poidh on X](https://x.com/poidhxyz)
- [Gitcoin — poidh app page](https://gitcoin.co/apps/poidh)
- Referenced bounties: [arb/283](https://poidh.xyz/arbitrum/bounty/283), [arb/282](https://poidh.xyz/arbitrum/bounty/282), [base/1137](https://poidh.xyz/base/bounty/1137), [degen/1362](https://poidh.xyz/degen/bounty/1362), [base/1134](https://poidh.xyz/base/bounty/1134), [degen/1167](https://poidh.xyz/degen/bounty/1167), [base/909](https://poidh.xyz/base/bounty/909), [base/906](https://poidh.xyz/base/bounty/906), [degen/910 (POAP case study)](https://poidh.xyz/degen/bounty/910), [base/1096 (Preach POIDH)](https://poidh.xyz/base/bounty/1096)
