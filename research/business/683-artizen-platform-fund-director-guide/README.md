---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-20
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

## What Artizen Is

Web3 crowdfunding + match-funding platform for projects at the intersection of art, science, technology, and culture. Founder: **René Pinnell**. Raised **$2.2M** in May 2023 (backers: ConsenSys, Animoca Brands, Protocol Labs). Has awarded **$750,000+** to date. Mission framing: bring community-driven public-goods allocation to creative/cultural work.

## How The Mechanics Work

| Element | Detail |
|---------|--------|
| **Artifact** | Open-edition NFT, **$10** flat. 100% of the $10 goes directly to the creator. |
| **Match funding** | 1:1 instant. Every $1 in artifact sales unlocks $1 from each Fund backing the project, while that fund's match pool lasts. |
| **Multiple funds** | A project curated into 2+ funds gets match from each - the multiplier is the whole incentive to seek broad backing. |
| **Fund split** | 10% of a fund = cash prize for the top-selling project (the "Artizen Prize"). 90% = split equally across curated projects as available match. |
| **Season phases** | 1) **Curation** - communities/funds select projects. 2) **Competition** - projects sell artifacts, unlock match, climb the leaderboard. |
| **Payout** | One combined payout at season end: artifact sales + match + any prize. |
| **Formula** | Artizen calls it "fluid quadratic funding" - a continuous variant of quadratic funding. |

## Running a Fund (Zaal's Role)

Zaal is fund director of the **ZAO Fund for Emerging Culture**. Current state (2026-05-20): Season 6, **$10,000** total, sponsored by Artizen, **28 accepted projects**, ~32 days left in the season.

Artizen runs an **Accelerator for Community Funds** - a 12-week program for community leaders to launch and grow a fund:

| Month | Focus |
|-------|-------|
| Month 1 | Best practices for attracting project submissions + securing small-dollar sponsors |
| Month 2 | Hands-on support securing major brand sponsorships |
| Month 3 | Sustaining + scaling the fund for long-term impact |

- Weekly group session led by René Pinnell.
- Accepted funds receive **up to $10,000** to launch (the ZAO Fund's $10k matches this).
- A newer program, **"$1 Million for Community Funds"** (announced Dec 2025), offers **up to $50,000** per community fund - worth checking eligibility for ZAO Fund S7.

## Fund Director Findings (How To Make The ZAO Fund Win)

| Finding | Action |
|---------|--------|
| Match only fires on artifact sales | The welcome email (Doc 674) already tells grantees to rally their community - reinforce this in every touchpoint |
| More sponsors = more match per project | Pitch brands/individuals to co-sponsor the ZAO Fund; each one multiplies every grantee's match |
| The top seller takes a 10% cash prize | Expect grantees to compete hard near season end; that competition drives total artifact volume, which is good for the fund |
| Curation is the director's leverage point | Who Zaal lets into the fund shapes its identity; "Emerging Culture" should stay a real filter, not open-door |
| Funds compound across seasons | Grantees who do well in S6 are warm leads for S7; the 28-project network is an asset |

## Community / Independent Signal

- Artizen has a public **Trustpilot** review page (artizen.fund) - reviews skew positive from creators citing real funding outcomes; full rating not verified in this pass (page returned 403 to automated fetch).
- Listed in the **Gitcoin** ecosystem of public-goods funding apps - signal of legitimacy in the QF/public-goods world. René Pinnell has hosted Gitcoin founder Kevin Owocki on the Artizen newsletter podcast (Feb 2026).
- Independent coverage: Decrypt, NFTevening, Decential Media (2023-2024) - all describe the model favorably; no substantive published criticism surfaced in this STANDARD pass.

## Staleness Notes

- $2.2M raise + $750k awarded: figures from 2023-2024 coverage; the awarded total is likely higher now (verify on artizen.fund before quoting publicly).
- Accelerator funding: WebSearch shows "up to $10,000"; the Dec 2025 "$1M for Community Funds" article says "up to $50,000". Both cited; confirm current terms with Artizen directly.
- `news.artizen.fund/p/artizen-playbook` and `/p/ultimate-guide-to-raising-money` appeared in search but returned 404 on fetch - the newsletter index is live, individual slugs have changed. Use the newsletter home.

## Sources

- [Artizen Fund - homepage](https://artizen.fund/)
- [Artizen Fund on Gitcoin](https://gitcoin.co/apps/artizen-fund)
- [Artizen Newsletter (René Pinnell, Substack)](https://news.artizen.fund/)
- [Artizen Accelerator for Community Funds](https://news.artizen.fund/p/artizen-accelerator-for-community)
- [Artizen Fund Raises $2.2M (Decrypt)](https://decrypt.co/139682/artizen-fund-raises-2-2-million-to-create-nft-cultural-artifacts)
- [Artizen is Helping Fund Human Creativity (Decential Media)](https://www.decential.io/articles/artizen-is-helping-fund-human-creativity-in-a-digital-world)
- [Artizen Trustpilot reviews](https://www.trustpilot.com/review/artizen.fund)
- [ZAO Fund for Emerging Culture (S6)](https://artizen.fund/index/mf/zao-fund-for-emerging-culture?season=6)

## Also See

- [Doc 674](../../events/674-edge-esmeralda-artizen-telamon-outreach/) - ZAO Fund S6 grantee outreach: welcome emails for all 28 accepted projects

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send the 27 grantee welcome emails (Doc 674) to drive artifact sales | @Zaal | Outreach | 2026-05-21 |
| Verify current Artizen awarded-total + accelerator terms on artizen.fund | @Zaal | Verification | Before any public quote |
| Pitch 1-2 brands/individuals to co-sponsor the ZAO Fund for S7 | @Zaal | Outreach | Before S7 curation |
| Check eligibility for the "$1M for Community Funds" ($50k) program | @Zaal | Decision | Before S7 |
| Decide the curation filter for ZAO Fund S7 - keep "Emerging Culture" tight | @Zaal | Decision | After S6 closes |
