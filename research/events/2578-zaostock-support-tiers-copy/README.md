---
topic: events
type: decision
status: research-complete
last-validated: 2026-09-29
related-docs: 557, 1429, 418
original-query: "A 1:1 with someone on the ZAO team before the event. we need to rephrase the whole ticketing and pricing part lets brainstorm and rewrite all of that /zao-research and deep think through options and com eback to me with a few"
tier: STANDARD
---

# 2578 - ZAOstock support tiers: rewriting the /tickets pricing copy four days out

> **Goal:** Replace the /tickets "ticketing and pricing" copy with wording that promises only what the team can deliver by Sat 3 Oct 2026, keeps the three live Stripe links, and reads right to a local Ellsworth crowd.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE Option B ("Keep it free") as the default.** Free to attend up top; the three paid tiers become ways to keep it free, named Chip in / Friend / Backer. | Every free-concert series in the sample leads with "free" and frames money as keeping it free (Point Loma, Levitt, Grant Park, Athens). It removes the contradiction in "Four ways in" next to "patronage, not admission". |
| 2 | **DROP the "1:1 with someone on the ZAO team before the event" promise from the page now**, whichever option wins. Honour it for anyone who already paid. | Four days out, with no scheduling system on file, it is the one line that can visibly fail. Zaal flagged it himself. |
| 3 | **DROP "Credited as a supporter on the festival page"** unless a supporters list ships before Saturday. Replace it with "thanked from the stage" (the MC script already carries sponsor thank-yous) or nothing. | No supporters list exists on the site (checked 2026-09-29: no page renders one). A promise with no page behind it is the same class of defect as the ADA restroom line removed in ZAOstock #399. |
| 4 | **DROP "50 spots" / "20 spots" and "Round 1 goal: $1,000".** | Scarcity on a gift reads as a sales tactic; "round" is crowdfunding jargon to a local crowd; no progress figure is shown, so the goal cannot be read against anything. |
| 5 | **Stripe product names must change with the copy**, or checkout will say "Pro Ticket" after the page stops saying it. | Stripe Payment Links show the product name at checkout (noted to Finance on 2026-09-29). Zaal owns the Stripe dashboard. |

## The problem, measured

Read from the live page, `https://zaostock.com/tickets`, on 2026-09-29 17:3x EDT (curl plus HTML strip), and from `src/app/tickets/page.tsx` and `src/content/site.ts` (`SUPPORT_TIERS`, `PRO_TICKET`, `PRO_ROUND`) in ZAODEVZ/ZAOstock at `365b06c4`.

| Line on the page | What is wrong with it |
|---|---|
| "Four ways in." | Admission is free. Money is not a way in, and the next line says so: "This is patronage, not admission". |
| "Pro Ticket" | It is not a ticket. The FAQ has to explain "Nothing here buys access". |
| "A 1:1 with someone on the ZAO team before the event." | No scheduling mechanism, owner or buyer list is on file. Four days left. |
| "Credited as a supporter on the festival page." (all 3 tiers) | No supporters list exists on the site. |
| "50 spots" / "20 spots" | Scarcity on a donation. |
| "Round 1 goal: $1,000, counting every supporter at any tier" | Jargon, and no progress number is shown. |
| "What is the difference between them - Only the 1:1 on the Pro Ticket." | The only difference between $20 and $50 is the promise in row 3. |
| Weather: "The parklet is open to the sky, so dress for it." | True for dry weather, but the rain plan moves the day indoors to Black Moon (ZAOstock #368). Not a pricing line, but it sits in the same block. |

## Options

| | A. Honest minimum | B. Keep it free (recommended) | C. One tier plus "any amount" |
|---|---|---|---|
| Idea | Same structure and names; cut only the lines that promise something undeliverable | Reframe the whole block: free up top, money keeps it free | Collapse to one card-support button plus Giveth |
| Headline | "Free to attend. Ways to help." | "Free. Help keep it that way." | "Free. Chip in if you can." |
| Tiers | Fan $1 / Supporter $20 / Pro $50 | Chip in $1 / Friend $20 / Backer $50 | "Give $20" only (the $1 and $50 links stay live but unlisted) |
| 1:1 | Removed | Removed | Removed |
| "Credited" | "Thanked from the stage" | "Thanked from the stage" | None |
| Stripe rename needed | Pro Ticket to Pro | All three | None if only Supporter is shown |
| Risk | Still reads like a ticket shop | Needs three product renames in Stripe today | Loses the $50 givers; the r/EventProduction organizer below reports people pick the middle option when shown three |
| Time to ship | 30 min | 45 min plus Zaal's Stripe edits | 30 min |

Why B over A: the defect is the frame, not only three lines. Every sampled free series ("keeping the concerts free is not free", Point Loma) sells continuity, not access. Why B over C: an organizer running free-base events reports that "people usually pick the middle donation option", so a three-price ladder earns more than a single ask, and the $20 middle is already the default.

## What every option keeps

- The three Stripe Payment Links, byte-identical (`STRIPE_LINKS` in `src/content/site.ts`).
- Giveth as the crypto path (Zaal, 2026-09-29: "just keep the giveth as this side as a pay with crypto option").
- "Break-even" and no margin language (standing rule: imply it, never say "no extraction").
- No tax-deductible claim. The sampled US series say "tax-deductible" because they are 501(c)(3)s; The ZAO is not fiscally sponsored (vault `project_zao_fiscal_sponsor`), so that line must not be borrowed.

## Findings from outside

| Source | What it does | What to take |
|---|---|---|
| Point Loma Summer Concerts (OB Rag, 2026-05-28) | "Friends" levels with recognition; "keeping the concerts free is not free"; asks "what would that experience be worth if you had to buy tickets?" | The keep-it-free frame; the value question |
| Levitt Pavilion SteelStacks (Donorbox) | $5 to $150 presets plus custom, "Friends of Levitt" | Small presets plus a named friend tier |
| Oakridge Concerts in the Park | Friend $25 / Supporter $50 / Patron $100, donation stations at each concert | Named levels; on-site giving |
| Apex PRD Summer Concert Series | Note-named levels ($10 Eighth Note to $250 Chord); "donations are acknowledged at the concerts" | Thank-from-the-stage recognition |
| r/EventProduction thread 1qcdtzf (2026-01-14) | Free base plus suggested donations; "people usually pick the middle donation option" | Keep three prices, $20 in the middle |

## Also See

- [557 - Onchain festival ticketing for ZAOstock](../../dev-workflows/557-onchain-festival-ticketing-zaostock/)
- [1429 - ZAOstock ticket launch content kit](../1429-zaostock-ticket-launch-jul21-content-kit/)
- [418 - Birding Man festival analysis](../418-birding-man-festival-analysis/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick A, B or C (default B) | Zaal | Decision | 2026-09-30 |
| Ship the chosen copy as a ZAOstock PR, merged via Dotfiles; page live | zaostock lane | PR | 2026-09-30 |
| Rename the Stripe products to match (B: Chip in / Friend / Backer) | Zaal | Stripe dashboard | 2026-09-30 |
| List anyone who already bought the $50 tier and book their 1:1 after the festival; list sent to Zaal | Zaal | Stripe export | 2026-10-02 |
| Add a one-line thank-you to supporters in the MC script; line in the script | zaostock lane | PR | 2026-10-01 |

## Sources

- [ZAOstock /tickets, live](https://zaostock.com/tickets) [FULL - curl plus HTML strip, 2026-09-29]
- [Point Loma Summer Concert Series Needs the Community's Help, OB Rag](https://obrag.org/2026/05/point-loma-summer-concert-series-needs-the-communitys-help/comment-page-1/) [PARTIAL - exa search highlights; quotes checked against the highlight text only]
- [Support free music at Levitt!, Donorbox](https://donorbox.org/levitt) [PARTIAL - exa search highlights]
- [Oakridge Concerts in the Park - Support the Music](https://oakridgeconcerts.com/support-the-music) [PARTIAL - exa search highlights]
- [Apex PRD Summer Concert Series Friend Form](https://apexprd.org/summer-concert-series-friend-form/) [PARTIAL - exa search highlights]
- [Grant Park Music Festival - Support](https://www.grantparkmusicfestival.com/support/) [PARTIAL - exa search highlights]
- [r/EventProduction: Sliding scale tix for small event](https://www.reddit.com/r/EventProduction/comments/1qcdtzf/sliding_scale_tix_for_small_event/) [FULL - Arctic Shift via zao-fetch-reddit.sh, 11 comments]

The PARTIAL sources are used only for tier names and framing, which the highlights show verbatim; no figure in the decision rests on them.
