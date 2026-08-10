---
topic: business
type: guide
status: research-complete
last-validated: 2026-08-10
related-docs: 674
tier: STANDARD
---

# 683 - Artizen Fund: Platform Mechanics + Fund Director Guide

> **Goal:** Document how Artizen works as a platform and how Zaal can run the ZAO Fund for Emerging Culture well as its fund director.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | TREAT the ZAO Fund as a recurring ZAO surface, not a one-off | Artizen funds run season after season; the 28 S6 grantees are a standing network if Zaal nurtures them. See [Doc 674](../../events/674-edge-esmeralda-artizen-telamon-outreach/). |
| 2 | The single lever that matters this season: drive artifact sales | Match funding is 1:1 on artifact sales. A grantee with no sales gets near-zero match. Zaal's job as director = help grantees sell. |
| 3 | RECRUIT a second sponsor for the ZAO Fund before S7 | The fund currently shows $10,000, sponsored by Artizen itself. A project backed by 2+ funds gets match multiplied. More sponsors = more pull for grantees. |
| 4 | DO NOT promise grantees a fixed payout amount | Payout = their artifact sales + match (while funds last) + any prize. It is variable by design. The welcome emails in Doc 674 correctly avoid fixed numbers. |
| 5 | SKIP building any Artizen integration into ZAOOS | The fund is operated entirely on artizen.fund. `grep -ri artizen src/` = 0 hits; no code surface needed. |

## Updated 2026-08-10

Four material changes since May 2026 last-validation (sources all PARTIAL — artizen.fund blocked by egress proxy; confirmed from search result snippets and page titles):

1. **Total awarded has grown substantially.** The platform leaderboard page title reads **"$1,889,990 awarded"** (another project page shows $2,638,082 — exact figure depends on season scope). The "$750,000+" figure in this doc is significantly outdated. Source: `artizen.fund/index/leaderboard` page title (PARTIAL).

2. **Artizen Endowment launched (~October 2025) — new funding primitive.** Artizen launched a $4M endowment backed by an **ART token**. ART mints new tokens or buys on open market (whichever cheaper), with a cut of every transaction flowing into the endowment. Each ART token is treasury-backed with a rising floor price. The platform's mission statement shifted to "build the largest endowment in the world for human creativity." This is an entirely new product layer not in the original doc. Source: search snippets citing `news.artizen.fund/p/infinite-money-glitch` and `news.artizen.fund/p/largest-endowment-in-the-world` (PARTIAL).

3. **"Fluid quadratic funding" label dropped.** Artizen moved away from QF branding after running into Sybil attacks and confusing UX — "fans felt misled, creators felt cheated." The 1:1 match mechanics are unchanged but the "fluid quadratic funding" description in the Mechanics section below is now outdated; Artizen no longer uses that framing. Source: search snippet citing `news.artizen.fund/p/keep-it-simple-stupid` (PARTIAL).

4. **Season 6 closed; Season 7 is live.** As of 2026-05-20 there were ~32 days left in S6, so S6 closed approximately late June 2026. Season 7 is confirmed running (`artizen.fund/index/leaderboard/?season=7` returns a live leaderboard). ZAO Fund S7 participation status: unverified (direct fetch blocked). Source: artizen.fund URL in search results (PARTIAL).

5. **"$1M for Community Funds" accelerator deadline passed.** Applications were open through end of March 2026. The next cohort timing is TBD. The action item below to "Check eligibility before S7" is past-due for this cohort; watch for next cohort announcement. Source: search summary of `news.artizen.fund/p/1-million-for-community-funds` (PARTIAL).

## What Artizen Is

Web3 crowdfunding + match-funding platform for projects at the intersection of art, science, technology, and culture. Founder: **René Pinnell**. Raised **$2.2M** in May 2023 (backers: ConsenSys, Animoca Brands, Protocol Labs). Has awarded **~$1.9M+** to date (was $750K+ in May 2026; see Updated 2026-08-10 above). Mission framing (updated ~Oct 2025): "build the largest endowment in the world for human creativity."

## How The Mechanics Work

| Element | Detail |
|---------|--------|
| **Artifact** | Open-edition NFT, **$10** flat. 100% of the $10 goes directly to the creator. |
| **Match funding** | 1:1 instant. Every $1 in artifact sales unlocks $1 from each Fund backing the project, while that fund's match pool lasts. |
| **Multiple funds** | A project curated into 2+ funds gets match from each - the multiplier is the whole incentive to seek broad backing. |
| **Fund split** | 10% of a fund = cash prize for the top-selling project (the "Artizen Prize"). 90% = split equally across curated projects as available match. |
| **Season phases** | 1) **Curation** - communities/funds select projects. 2) **Competition** - projects sell artifacts, unlock match, climb the leaderboard. |
| **Payout** | One combined payout at season end: artifact sales + match + any prize. |
| **Formula** | ~~Artizen calls it "fluid quadratic funding"~~ — label dropped as of 2026 (see Updated above). The 1:1 match mechanics are unchanged. |

## Running a Fund (Zaal's Role)

Zaal is fund director of the **ZAO Fund for Emerging Culture**. Current state (2026-05-20): Season 6, **$10,000** total, sponsored by Artizen, **28 accepted projects**, ~32 days left in the season. S6 closed ~late June 2026; Season 7 is now live (started May 1, 2026).

Artizen runs an **Accelerator for Community Funds** - a 12-week program for community leaders to launch and grow a fund:

| Month | Focus |
|-------|-------|
| Month 1 | Best practices for attracting project submissions + securing small-dollar sponsors |
| Month 2 | Hands-on support securing major brand sponsorships |
| Month 3 | Sustaining + scaling the fund for long-term impact |

- Weekly group session led by René Pinnell.
- Accepted funds receive **up to $50,000** to launch (the "$1 Million for Community Funds" program, Dec 2025).
- **Accelerator application deadline passed** (was end of March 2026). Watch for next cohort announcement.

## Fund Director Findings (How To Make The ZAO Fund Win)

| Finding | Action |
|---------|--------|
| Match only fires on artifact sales | The welcome email (Doc 674) already tells grantees to rally their community - reinforce this in every touchpoint |
| More sponsors = more match per project | Pitch brands/individuals to co-sponsor the ZAO Fund; each one multiplies every grantee's match |
| The top seller takes a 10% cash prize | Expect grantees to compete hard near season end; that competition drives total artifact volume, which is good for the fund |
| Curation is the director's leverage point | Who Zaal lets into the fund shapes its identity; "Emerging Culture" should stay a real filter, not open-door |
| Funds compound across seasons | Grantees who do well in S6 are warm leads for S7; the 28-project network is an asset |
| **NEW: Artizen Endowment + ART token** | A new investment primitive exists alongside match funding. The ART token (treasury-backed, rising floor) funds the Artizen Endowment. Explore whether ZAO Fund participation integrates with this layer. |

## Community / Independent Signal

- Artizen has a public **Trustpilot** review page (artizen.fund) - reviews skew positive from creators citing real funding outcomes; full rating not verified in this pass (page returned 403 to automated fetch).
- Listed in the **Gitcoin** ecosystem of public-goods funding apps - signal of legitimacy in the QF/public-goods world. René Pinnell has hosted Gitcoin founder Kevin Owocki on the Artizen newsletter podcast (Feb 2026).
- Independent coverage: Decrypt, NFTevening, Decential Media (2023-2024) - all describe the model favorably; no substantive published criticism surfaced in this STANDARD pass.

## Staleness Notes

- **$2.2M raise**: figure from May 2023; current raise total not re-verified in this pass.
- **~$1.9M+ awarded**: updated from $750K+ per leaderboard page title. Exact total varies by page; verify on artizen.fund before public quoting. PARTIAL source.
- **ART token / Endowment mechanics**: confirmed from search result snippets only. Full terms at news.artizen.fund (blocked in this run). Verify before making investment decisions.
- **ZAO Fund S7 status**: direct fetch blocked; whether ZAO Fund is running in S7 is unverified — check artizen.fund/index/mf/zao-fund-for-emerging-culture?season=7.
- `news.artizen.fund/p/artizen-playbook` and `/p/ultimate-guide-to-raising-money` appeared in search but returned 404 on fetch - the newsletter index is live, individual slugs have changed. Use the newsletter home.

## Sources

- [Artizen Fund - homepage](https://artizen.fund/) (BLOCKED in Aug 2026 run)
- [Artizen Fund on Gitcoin](https://gitcoin.co/apps/artizen-fund) (BLOCKED in Aug 2026 run)
- [Artizen Newsletter (René Pinnell, Substack)](https://news.artizen.fund/) (BLOCKED in Aug 2026 run)
- [Artizen Accelerator for Community Funds](https://news.artizen.fund/p/artizen-accelerator-for-community) (BLOCKED)
- ["$1 Million for Community Funds"](https://news.artizen.fund/p/1-million-for-community-funds) (PARTIAL — search snippet)
- ["Keep It Simple, Stupid" — QF mechanics change](https://news.artizen.fund/p/keep-it-simple-stupid) (PARTIAL — search snippet)
- ["Infinite Money Glitch" — ART token / Endowment](https://news.artizen.fund/p/infinite-money-glitch) (PARTIAL — search snippet)
- [Artizen Leaderboard — Season 7](https://artizen.fund/index/leaderboard/?season=7) (PARTIAL — URL confirmed in search)
- [Artizen Fund Raises $2.2M (Decrypt)](https://decrypt.co/139682/artizen-fund-raises-2-2-million-to-create-nft-cultural-artifacts)
- [Artizen is Helping Fund Human Creativity (Decential Media)](https://www.decential.io/articles/artizen-is-helping-fund-human-creativity-in-a-digital-world)
- [Artizen Trustpilot reviews](https://www.trustpilot.com/review/artizen.fund)
- [ZAO Fund for Emerging Culture (S6)](https://artizen.fund/index/mf/zao-fund-for-emerging-culture?season=6)

## Also See

- [Doc 674](../../events/674-edge-esmeralda-artizen-telamon-outreach/) - ZAO Fund S6 grantee outreach: welcome emails for all 28 accepted projects

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|----------|
| Verify ZAO Fund S7 status on artizen.fund (is it running? needs curation?) | @Zaal | Verification | ASAP |
| Confirm current Artizen awarded-total on artizen.fund before any public quote | @Zaal | Verification | Before any public quote |
| Watch for next "$1M for Community Funds" accelerator cohort (March 2026 deadline passed) | @Zaal | Watch | Ongoing |
| Pitch 1-2 brands/individuals to co-sponsor the ZAO Fund for S7/S8 | @Zaal | Outreach | Before next curation |
| Research ART token / Artizen Endowment: does ZAO Fund participation integrate with it? | @Zaal | Decision | Before S8 |
| Decide the curation filter for ZAO Fund S7/S8 - keep "Emerging Culture" tight | @Zaal | Decision | Before next curation |
