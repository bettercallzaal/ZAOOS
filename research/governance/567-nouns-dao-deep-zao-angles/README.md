---
topic: governance
type: market-research
status: research-complete
last-validated: 2026-04-29
related-docs: 432, 458, 475, 502, 547, 565
tier: DEEP
---

# 567 - Nouns DAO Deep Dive: Mechanism Lore + ZAO Angles

> **Goal:** Dusk (`@0xdusk_eth`) flagged something Nouns-related on X (article body locked behind X auth, see Caveats). User asked for a DEEP scrape of Nouns DAO. This doc captures the mechanism lore, ecosystem map, governance scars, and concrete ZAO patterns to steal — cross-validated by GPT-5 via the new `/ask-gpt` loop (Doc 565).

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| ZAO should adopt **Propdates-style public execution logs** for every funded ZAOstock workstream | **YES, BEFORE OCT 3** | Nouns built Propdates after years of "props pass, work disappears" pain. Prop 297 (50 ETH for Archives.wtf continuation) was defeated 32/145/64 — community tired of vibes-funding without legible delivery. ZAO has 5 months and a real festival to ship. Make every workstream an observable object: owner, budget, milestone, payment schedule, Farcaster update URL, deliverable hash, status. |
| ZAO should NOT make ZABAL do everything | **YES, ARCHITECTURAL** | Nouns split governance into specialised bodies: Nouncil (94 delegated voters, 98% participation, voted on 94 props), NOGS (non-Noun-holders pool influence), $NOUNS (fractionalisation, controversial). Translate to ZAO: Farcaster gate = identity, ZABAL = participation/curation, smaller council = operational authority for festival, contributor badges = reputation (non-transferable), full-DAO votes = slow high-threshold treasury moves. |
| Adopt **CC0 by default** for ZAO IP (logos, brand, music drop covers, ZAOstock visuals) | **YES, INHERIT FROM NOUNS WIN** | CC0 is the single highest-leverage thing Nouns did. Enables remix, derivative drops, fan-made products without permission negotiations. ZAO already runs music-first community — make brand IP CC0 explicit so ZABAL holders, fans, performers can build on it. Carve-out: never include sponsor logos / partner marks under ZAO CC0 (those stay with sponsor). |
| Use **TokenBuyer + Payer + Stream Factory** as reference architecture for sponsor + vendor flows | **YES, REFERENCE** | Nouns invested in operational plumbing: TokenBuyer swaps ETH → USDC, Payer handles USDC payments, Stream Factory does payment streams. ZAOstock will need: sponsor pays USD/USDC → ZAO converts/holds → vendor (Wallace Events, talent, etc.) gets paid on schedule. Don't reinvent — model on Nouns contracts; deploy minimal versions on Base. |
| ZAOstock spinout repo + DAO should be a **Nouns Builder fork** | **EVALUATE, NOT YET COMMIT** | Nouns Builder = open protocol for spinning up Nounish DAOs. Many builder DAOs (Yellow, Public Nouns, BASED DAO on Base, Lil Nouns) launched this way. Pros: battle-tested governance, Builder community, Base support. Cons: mechanism is auction-based daily-mint — does not match ZAOstock's festival-cohort shape. **Verdict: read Builder docs in 1 sitting; if shape fits, fork; if not, copy specific contracts a la carte.** |
| Don't fork Nouns' ambiguous treasury / value-accrual politics | **YES, AVOID** | Nouns' 2023 fork lost ~$27M (62 nouns / 20% of treasury) to "rage quit" holders who thought treasury was bleeding on weak proposals. Then forked again, lost more. Don't import that drama. ZAO is small (188 members) + has a real-world festival as the obvious deliverable — different problem. Keep ZABAL value tied to ZAOstock outcomes, not "DAO treasury number-go-up" theatre. |
| Consider **Nouncil-style delegated voting body** for ZAO ops | **YES, AS ZAOSTOCK COUNCIL** | Nouncil = 94 delegated voters, 98% participation, voted on 94 Nouns DAO props. Allowed delegated participation without selling Nouns. ZAOstock could pre-launch a Council (5-9 members, named) that votes on day-of operational decisions: artist swaps, crisis calls, sponsor changes. Members nominated by ZABAL holders, term-limited, public. |

## Caveats / Sources Verified vs Unverified (2026-04-29)

| Claim | Source | Confidence |
|---|---|---|
| Nouns Treasury contract `0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71` | GPT-5 via `/ask-gpt`, web search corroboration | High |
| Nouns Token contract `0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03` | GPT-5 | High |
| Auction House contract `0x830BD73E4184ceF73443C15111a1DF14e495C706` | GPT-5 | High |
| Governor contract `0x6f3E6272A167e8AcCb32072d08E0957F9c79223d` | GPT-5 | High |
| Base $NOUNS contract `0x0a93a7BE7e7e426fC046e204C44d6b03A302b631` | GPT-5 | Medium - verify on Basescan before use |
| Nouncil: 94 nouncillors, 98% participation, 94 props voted | GPT-5, cites Prop 163 | Medium |
| Prop 297 defeated 32/145/64 (Archives.wtf 50 ETH continuation) | GPT-5 | Medium - verify on nouns.com/vote/297 |
| Prop 727 = Nouns DUNA (Wyoming legal entity) | Web search consensus | High |
| 2023 fork: 62 nouns / ~$27M / 20% treasury exited | Blockworks + Decrypt + Coindesk corroborate | High |
| Dusk = founder of GlitterProtocol; pushed Prop 955 (auction reserve 2.8 ETH) | Web search | Medium - exact reserve / outcome unverified |
| **Dusk's article body at `x.com/i/article/2040067263320244224`** | **NOT ACCESSED — X auth required** | **Unknown content** |

**Important:** the dusk X post is just a t.co link to an X Article. The article body is gated behind X login. To answer "do we want to do any of these?" definitively, the article needs manual paste from Zaal's logged-in Comet, OR an authed last30days-skill X session.

## Nouns DAO Mechanism Map (Verified)

### The Core Loop

1. **Auction House** mints 1 Noun per day, 24h English auction, 100% proceeds → Treasury
2. **Treasury / Timelock** holds proceeds, only released by passed governance proposals
3. **Token** = ERC-721 + 1 vote each, irrevocable membership, soulbound-by-norm (transferable but holders rarely sell)
4. **Governor** runs proposal lifecycle: Candidate → Proposal (sponsored by ≥3 Nouns or 1 multi-Noun) → Voting → Queue → Execute
5. **DUNA** (Prop 727) wraps the on-chain DAO in a Wyoming Decentralized Unincorporated Nonprofit Association = legal liability shield without losing decentralisation

### The Operational Plumbing (Built After "Props Pass But Work Stalls")

| Contract | Role | ZAO equivalent need |
|---|---|---|
| **Propdates** (`0xf790A5f59678dd733fb3De93493A91f472ca1365`) | Proposers post execution updates linked to prop ID | Same. ZAO needs `zaostock-updates` contract or doc convention. |
| **TokenBuyer** | Auto-swap ETH → USDC at sane prices for vendor payments | Same. Many ZAO vendors will want USDC. |
| **Payer** | Pays USDC to recipients per governance auth | Same. Paired with TokenBuyer. |
| **Stream Factory** | Spawns vesting/payment streams (Sablier-style) | Same. For artist payouts, multi-month builds. |

### The Mechanism Pluralism

| Layer | Body | Function |
|---|---|---|
| Top | Nouns DAO governance | Treasury moves, big strategic shifts |
| Mid | Nouncil | Delegated voters (94 active per GPT data), faster operational props |
| Mid | NOGS | Non-Noun-holders aggregate vote weight (lowers participation barrier) |
| Open | Prop House | Competitive grant rounds, pop-up funding for projects |
| Open | Small Grants | Smaller ongoing builder support |
| Token-bridge | $NOUNS | Fractionalised access (1 Noun = 1M $NOUNS), planned for L2s incl Base, **controversial + status uncertain** |

## ZAO Translation (Concrete Picks)

### Pick 1 - Adopt Propdates-style execution log

**For ZAO:** add a `bot-config/zaostock/updates/` directory (or repo) where every funded workstream files weekly markdown updates. Each update fronts:

```yaml
prop-id: <ZAOstock workstream slug>
owner: @username
status: in-progress | blocked | complete
last-update: 2026-XX-XX
spent-to-date-usd: $X
deliverables-shipped: [list]
next-milestone: <date>
farcaster-cast-url: <link>
```

Pair with the Ronin pattern from Doc 563. Files commit-trackable, MCP-readable.

### Pick 2 - Steal CC0 brand framing

**For ZAO:** `community.config.ts` adds `brandLicense: "CC0-1.0"` for logos, brand assets, ZAOstock visuals. Sponsor + partner logos explicitly excluded. Pair with Doc 549's `/21st` skill — generated UI components stay derivable + remixable.

### Pick 3 - Spin a ZAOstock Council (Nouncil-style)

**For ZAO:** 5-9 named members, ZABAL-nominated, term ends at festival close + retro. Public mandate: day-of operational decisions, vendor escalations, artist swaps. Decisions logged to `bot-config/zaostock/council-decisions/`. After festival, council disbands or rolls into ZAOstock 2027 prep.

### Pick 4 - Use TokenBuyer + Payer pattern for festival vendor flows

**For ZAO:** sponsor pays USD/USDC → ZAOstock multisig holds → vendor (Wallace Events tents, sound, talent) paid in USDC on schedule via Stream Factory equivalent. **Don't deploy from scratch** — fork Nouns' contracts on Base, audit minimally, deploy. Saves engineering month.

### Pick 5 - Watch Nouns Builder for ZAOstock spinout

**For ZAO:** if ZAOstock spinout repo (memory `project_zaostock_spinout`) wants its own DAO, Nouns Builder is the fastest path. Read the protocol docs, decide auction-based daily-mint vs cohort-mint. Most likely outcome: cherry-pick contracts, not full fork.

## What NOT to Steal

- **Treasury value-accrual theatre:** "DAO ROI" debates burned trust at Nouns. ZAO has a concrete deliverable (festival) — measure ZAO success on attendance, artist payouts, sponsor renewals, not "treasury number".
- **Drama-first culture:** Nouns governance Twitter is a non-stop fight. ZAO is small + has real-world stakes; protect signal-to-noise.
- **Daily-mint auction:** ZAOstock is a single-day event, not a perpetual mint. Auction is wrong shape; cohort-mint or one-time drop is right.
- **$NOUNS-style fractionalisation:** Adds complexity, splits voting power, attracts speculators. ZABAL already does the participation job.

## Re Dusk's X Post (Pending)

**Status:** post resolves to X Article `2040067263320244224`. Article body gated. Dusk is GlitterProtocol founder + pushed Prop 955 (auction reserve 2.8 ETH).

**Inferred read of "do we want to do any of these?":**
- If the article is a list of Nouns proposal patterns to import → **yes, several apply (see Picks above)**
- If it's a list of bidding / participation mechanics for Nouns auctions → **no, ZAO is not buying Nouns; not a treasury allocation we'd make**
- If it's a list of Nouns-funded grant opportunities for music projects → **possibly worth investigating once article is read**

**Action:** Zaal pastes article body (or installs full last30days X session) to unlock final answer. Until then, the doc above is the pre-read.

## Open Loop with GPT-5 (Pass 2 In Flight)

Posed Pass 2 challenges to GPT-5 via `/ask-gpt nouns-zao --resume`:
1. Are $NOUNS L2 mechanics shipped or stuck?
2. Treasury ETH balance + total prop count (April 2026)?
3. Prop House active or spun out? Spinout entity?
4. Did Prop 955 (Dusk's reserve price) pass?
5. Three specific 2025-2026 music-funding props with numbers + outcome

Pass 2 was still grinding when this doc shipped — full log at `~/.zao/gpt-loop/nouns-zao.log`. Wake-up scheduled to fold answers in.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Verify Nouns contract addresses on Etherscan + Basescan before any production use | Zaal | One-shot | Before deploy |
| Read Nouns Builder docs in 1 sitting; decide ZAOstock spinout shape | Zaal | Spike | Next 2 weeks |
| Fold Pass 2 GPT-5 answers into this doc once they land | Auto via wake-up at 10:48 | Update | Today |
| Read dusk article body once X auth resolves; update "Re Dusk's X Post" section | Zaal or future session | Update | Conditional |
| Decide ZAO CC0 default for brand IP — add to `community.config.ts` | Zaal | PR | This week |
| Spin ZAOstock Council (5-9 named members, ZABAL-nominated) | Zaal | Calendar + announcement | Next ZAOstock team meeting |
| Add `bot-config/zaostock/updates/` Propdates-style log convention | Zaal | Spec doc | Before first sponsor commits |
| Cross-validate Nouns contract picks via 2nd Pass GPT-5 + read top 3 retrospective threads on Nouns governance | Future session | Research | This sprint |

## Also See

- [Doc 432 - The ZAO master positioning](../../community/432-tricky-buddha-zao-master-context/) - frame for what ZAO actually is
- [Doc 458 - ZAO Contribution Circles](../) - related governance pattern
- [Doc 475 - ZAO Music entity](../) - DBA + 0xSplits + on-chain attribution context
- [Doc 502 - ZAOstock Circles v1 spec](../502-zaostock-circles-v1-spec/) - existing governance design
- [Doc 547 - Cassie advisor session](../) - infrastructure-is-the-product
- [Doc 565 - /ask-gpt loop](../../dev-workflows/565-ask-gpt-claude-chatgpt-learning-loop/) - the cross-validation mechanism used here
- Memory `project_zao_master_context` - canonical ZAO frame
- Memory `project_zaostock_master_strategy` - festival = proof, infra = product
- Memory `project_zaostock_spinout` - spinout-this-week imperative

## Sources

- [Nouns DAO official](https://nouns.wtf/)
- [Nouns Center](https://nouns.center/)
- [Bankless: Nouns Is Dead, Long Live Nouns](https://www.bankless.com/read/nouns-is-dead-long-live-nouns)
- [Blockworks: Nouns DAO is forking again](https://blockworks.co/news/nouns-fork-two-dao-treasuries-spending)
- [Blockworks: Nouns DAO fork loses half its treasury in 3 days](https://blockworks.co/news/nouns-dao-treasury-fork-governance)
- [Decrypt: $27M Nouns Fork](https://decrypt.co/197400/nouns-fork-disgruntled-nft-holders-exit-27-million-from-treasury)
- [Nouns DAO Treasury on Etherscan](https://etherscan.io/address/0x0bc3807ec262cb779b38d65b38158acc3bfede10)
- [Llama: Nouns Treasury Allocation analysis](https://llama.mirror.xyz/cXx3ed66iXem3yRfTeImIi72RHesHvqXlXsaq-VX9RU)
- [Lil Nouns DAO](https://lilnouns.wtf/)
- [Nouns Builder](https://nouns.build/)
- [Decentralized Music Festival Proposal (discourse)](https://discourse.nouns.wtf/t/proposal-the-decentralized-music-festival-a-value-distribution-mechanism-for-the-music-industry/5284)
- [Tabs.wtf - Nouns contracts list](https://www.tabs.wtf/) (referenced via GPT-5)
- [Nouns.biz contracts guide](https://nouns.biz/nouns-dao-contracts/)
- Live `/ask-gpt nouns-zao` log at `~/.zao/gpt-loop/nouns-zao.log` (this session)

## Staleness

- Treasury figures + active props churn weekly. Re-validate via `nouns.wtf/vote` + `nouns.center` monthly.
- $NOUNS L2 status fast-moving — re-validate quarterly.
- Dusk article body remains unverified until X auth resolved.
- Re-validate by 2026-05-29.
