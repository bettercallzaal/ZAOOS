---
topic: community
type: comparison
status: research-complete
last-validated: 2026-10-28
superseded-by:
related-docs: "dev-workflows/2111-anti-ai-slop-web-design, business/2126-repo-web-improvement-does-the-competing-thezao, dev-workflows/2564-ui-improvement-audit-tools, identity/1383-zao-front-door-consolidation-jul2026"
original-query: "i like this as a side page but we gotta do deep resarehc on the best of websites and showcase waht we have thats unique is the a dao that is focsued on longterm growth and whales who are invesitng their time also artist and bringing the profitmargin data nad ip right sot indpenetdwes"
tier: DEEP
---

# 2718 - Homepage benchmark: how the best DAO, artist-owned and long-term sites show what is unique, and what thezao.com should do

> **Goal:** Give a human designer a structure, a proof plan and an interaction brief for the thezao.com first screen and first scroll, built from 24 fetched sites, so the page shows a DAO built for the long term, whales who invest time, artists first, and profit margin, data and IP returned to independent artists.

Scope note (Zaal ruling, item 53): this doc recommends STRUCTURE, CONTENT, PROOF and INTERACTION. It supplies no mockups and no generated imagery. The look is set by Zaal or a human designer. Palette on the live site is navy `#03182f` and gold `#f5c518` (`app/globals.css` on origin/main, lines 11 and 14), while `lib/constants.ts` still says `#141e27` and `#e0ddaa`; that mismatch is already flagged in the 2026-10-28 website audit and is not resolved here.

## Key Decisions

| # | Decision | Why (evidence) |
|---|---|---|
| 1 | USE one plain sentence as the H1 that names the model, and put a live proof strip directly under it. Do not lead with a metaphor, a toy or a player. | The only fully dead set among the artist-first sites (Catalog, Sound.xyz, Resonate, Ampled) all led with the product promise and none could prove longevity. The survivors that hold trust (Bandcamp, Stocksy, Nouns) put a number or a rule on the first screen: Bandcamp "Fans have paid artists $1.82 billion" with a live feed; Stocksy "50-75% royalties"; Nouns "One Noun, every day, forever." |
| 2 | USE the Respect numbers as the first-scroll hero stat row: 168 unique holders, 100+ weeks, 72 weeks settled on-chain, 0 tokens for sale. Print the caveats next to them (no unbroken streak claimed; OG has had no new mints since 2025-12-20; OG Gini about 0.73). | "Whales who invest their time" is only believable if it is checkable. The ICM box (`context.thezao.com/thezao`, `/fractal`) carries these figures with contract addresses. Metagov and Protocol Guild win trust by showing membership rules and registries, not slogans. Printing the Gini is the move no peer makes, and it is the one that stops the claim reading as a DAO cliche. |
| 3 | USE a "time is the stake" explainer as ONE interactive component, not a section of prose: a week of the Respect Game stepped through (contribute, rank in small room, Fibonacci payout, soulbound Respect minted). | Nouns explains its whole mechanism as a 10-line summary with one rule per line ("One Noun is equal to one vote"). The ZAO's rule ("Respect is soulbound, so it measures contribution, not capital") fits the same form. The current homepage buries this as a two-card "Buy tokens, buy power vs Show up, earn Respect" block below WaveWarZ (`app/page.tsx`, Governance section). Move it up. |
| 4 | USE "artists first, and here is what they actually receive" with the real WaveWarZ payout figure: 15.77 SOL (about $1,571) paid to artists on 1,002.95 SOL volume, plus 520.93 SOL claimed by traders in 3,559 withdrawals (public API, 2026-10-29 02:12 UTC). State it as is. | Stocksy and Catalog both made the artist take the hero ("pay 50-75%", "Earn 100% on digital download sales"). The ZAO's equivalent is a receipt. The honest figure is small, and a small true number beats a large vague one: the Kickstarter charter and Catalog's own shutdown note ("facilitated over $3 million") are the two most credible texts surveyed because they state a figure and a limit. |
| 5 | USE a "charter" block for profit margin, data and IP: three short commitments in the Kickstarter charter style ("will never sell user data", "will not claim rights just because it can"), each linked to the document that enforces it. Only publish a commitment that a repo, contract or paper already backs. | Kickstarter's charter and Ampled's published bylaws are the strongest "IP and data" proof in the survey. The ZAO has the language (llms.txt: "profit margin, data, and IP rights") and no public clause list. Writing the clauses is Zaal's decision; the page only needs a slot. See Next Actions. |
| 6 | USE a "long-term" band built from dated receipts, not adjectives: the Respect Game start date (2024-07-30), weeks run, ZAOstock 2026-10-03 (seven acts, free, Ellsworth Maine), ZABAL Gamez Season 1 (31 workshops, 31 projects, 15 builders), and a visible "last updated" stamp. Add a pause-honest note on what stopped (OG minting). | Long Now's homepage proves long-term with a manifesto line and the date style "02025" (five-digit year) and nothing else. Four artist-first platforms in this survey are closed (Catalog 2026-03-09, Sound.xyz 2026-01-16, Resonate 2024 to 2026, Ampled 2019 to 2023). A site that says "long-term" with no dated record reads as the same promise they all made. |
| 7 | KEEP The Player (#73) as a side page, as Zaal asked. Audius and Bandcamp show that a player earns its place on a music destination, not on the front door of an organisation. | Bandcamp's front door is a live "selling right now" feed plus editorial, not a player. Audius leads with "40,000+ monthly active artists" and contests. Neither makes the player the proof of the organisation. |
| 8 | ADOPT from existing concepts: Index (#68, numbered true facts, each linking to its source) as the proof-strip pattern; Paper (#72, live front page) as the data-freshness pattern, scoped to a single "what is happening this week" strip fed by Luma and Paragraph; Room (#70) only as a link-out once consent per member face is settled. REJECT Desk (#69) and Map (#74) for the first scroll. | Index matches Nouns and Bandcamp (numbers with a rule behind them). Paper matches Bandcamp's live feed and Are.na's "15 years and 81 days" counter. Desk and Map are metaphor-first, the pattern the r/dao and HN threads call out as unclear (Findings 6). |
| 9 | STOP calling the whole page "decentralized impact network for artists" as the eyebrow without the plain version. USE the sentence form in the H1 test below. | HN comment on a landing page: "Make your front page clearly state what the heck is going on", with the Free Software Foundation's first sentence as the model (news.ycombinator.com/item?id=36399910). The Reddit r/TheDao thread (2016) makes the same complaint about "fluffy and abstract" mission copy. |

H1 test sentences for the designer to pick from, written to the FSF standard (one sentence, says who, what, for whom, and how the vote works). These are candidate copy for Zaal to edit, not final: "The ZAO is an artist organization where the vote is earned by showing up each week, not bought." and "The ZAO returns profit margin, data and IP rights to independent artists, and governs itself with a vote that cannot be bought."

## Findings

### 1. What the survey shows at a glance

Of the 24 sites read, 4 artist-first platforms are closed (Catalog, Sound.xyz, Resonate, Ampled), 1 DAO peer is paused (Optimism Fractal, moved to Eden Fractal), and Optimism's own homepage no longer talks to a community at all (it pitches "Onchain infrastructure for enterprises"; the Collective lives on gov.optimism.io as a forum). The sites that are alive and trusted have one thing in common: a rule or a number on the first screen that a reader can check.

### 2. The ZAO has a claim no surveyed site makes

No surveyed DAO site says "your power here cannot be bought" and backs it with a soulbound token, a weekly ranking and a holder count. Nouns says one Noun is one vote (capital). Optimism, Gitcoin and Developer DAO say "govern" with no mechanism shown. Optimism Fractal and Eden run the same Respect Game but their site is a calendar and a pause notice. This is the unique slot, and the current homepage states it in prose well down the page.

### 3. Honest numbers beat large numbers

Optimism leads with "$31.8T stablecoin settlement" and "800M monthly transactions"; those are infrastructure stats for enterprise buyers and say nothing about people. Bandcamp's "$1.82 billion" works because it is paid to artists and sits beside a live sales feed with a joke ("when you hear nobody pays for music anymore, that is just The Man spreading his agenda"). The ZAO's equivalents are small and true: 1,668 battles, 1,002.95 SOL volume, 15.77 SOL to artists (WaveWarZ API, 2026-10-29), 168 Respect holders (Optimism, 2026-10-22). Show the artist payout figure in plain view; hiding it while showing volume is the pattern the 2026-10-28 audit's "Receipts, not vanity" line already promises against.

### 4. The shutdown notes are the best copy in the survey

Catalog's closing note (fin.catalog.works) gives a timeline (uploads off 2026-03-02, site off 2026-03-09, codebase open sourced), a figure ("over $3 million to independent artists and labels") and a permanence promise (music after 2022-04-19 on Arweave). Sound.xyz's note says what stays ("Your proof of support lives onchain") and how artists claim funds. Ampled's page is an archive with bylaws, documentation, people and an open source codebase. The lesson for a long-term DAO: a site that proves what survives if the team stops is a stronger long-term signal than a roadmap. USE a "If The ZAO stopped tomorrow" panel: what is on-chain (Respect on Optimism), what is open source, what artists keep.

### 5. Long-term is shown by time-scale design, not by the word

Long Now writes the year as "02025" and opens with a quote ("Civilizations with longer nows look after things better") and a manifesto that ends "Will you join us?". Are.na shows "For the last 15 years and 81 days" as a live counter. Protocol Guild's front page is a mechanism description plus donation addresses and an annual reports link. Pattern: a counter in years and days since a dated start, and one sentence that sets the unit of time. For The ZAO the dated start is 2024-07-30 (first Respect Game). Do not claim an unbroken streak: the ICM box states periods 71, 72 and 103 have no on-chain mints.

### 6. Community sources: DAO sites feel generic because they hide the mechanism

- r/dao, "Why DAO all have the same design?" (2022-01-12): replies include "Copypasta" and a founder admitting "We used a very similar template to Wonderland... easiest for smart contract integration".
- r/TheDao (2016-05-07): "very fluffy and abstract. We need a really concrete way to describe what this all is", contrasted with Ethereum's first paragraph.
- r/ethdev (2022-02-27), "Why do all NFT Project Websites look the same?": the dominant answer is that every site has the same goals, "explain the NFT and sell it".
- HN item 35119893 (2023-03-12) on a DAO treasury run from a Google Form: "Calling an organization a DAO does not make it a DAO." A reader who has seen this will test thezao.com's claims. Show the contract, not the word.
- Rocket Pool governance thread (2022-05): a mix of "soul" praised and "looks almost like a scam" from newcomers. Contradiction not resolved: one side wants personality, one wants legitimacy. The ZAO answer is receipts plus a human voice.

### 7. Design-awards references are used only to find exemplars

Awwwards music nominees (checked 2026-10-28) lean to portfolios, festivals and single-artist sites (Kelvin Music Festival 2027, Overworld Audio, Daddy Yankee); none is a DAO or co-op. siteinspire's current listing includes MamboMambo Coop and Carriere Scene; the MamboMambo page itself failed to fetch (FAILED), so it is a lead, not evidence. Godly's recent feed is motion and 3D, relevant for interaction ideas and not for community structure. Use these only for typography, rhythm and motion references that a human designer picks.

## Comparison table (24 sites)

Status as of 2026-10-28. FULL means read in full, see Sources for the per-site mark.

| # | Site | Group | Above the fold | How it proves claims | Distinctive | Steal | Avoid |
|---|---|---|---|---|---|---|---|
| 1 | optimism.io | DAO | "Onchain infrastructure for enterprises"; logos of Upbit, Bitpanda, Celo | Stat tiles: 800M monthly tx, $31.8T settled, 60% of Ethereum tx | Community is gone from the front door; Collective on gov.optimism.io | Specific, dated stats ("in 2026") | Pitching a buyer when your members are the audience |
| 2 | gitcoin.co | DAO | "Fund What Matters"; directory of public goods funding | Campaign list, research library, case studies | Repositioned as a reference library | A research and receipts library as depth | A homepage that is a table of contents |
| 3 | nouns.wtf | DAO | "One Noun, Every Day, Forever." plus dated header | 11-line rules summary; proposal numbers on each video (Prop 113, Prop 190) | Mechanism fits in one screen; every asset cites its proposal | One rule per line; cite the vote behind each thing | Capital-weighted vote is the opposite story |
| 4 | fwb.help | DAO | FWB FEST 2026 (Idyllwild, 31 Jul to 2 Aug), World Build program | Event and program dates | Homepage is a campaign board | Next real-world event as the lead | No statement of what the DAO is (PARTIAL read) |
| 5 | protocol-guild docs | DAO | Three components: eligibility framework, member registry, donation contracts | Registry, split contract, donate addresses on 9 chains, annual reports | Quotes Asimov; "a commons of peers and their collaborative effort over time" | Registry and addresses on the front page | Docs-site chrome |
| 6 | developerdao.com | DAO | "DEVELOPER OWNED & GOVERNED COMMUNITY" | Vibe, Learn, Build, Govern as four verbs | Four-word model | Four-verb summary | No numbers, no members, partners as proof |
| 7 | bankless.com | DAO-adjacent media | Dated analysis headlines, podcast, sponsor slot | Bylines and relative dates ("1 day ago") | A living front page | Freshness stamps on every item | Sponsor-first top bar |
| 8 | metagov.org | DAO | Mission, vision, three pillars, values (Openness, Inclusivity, Rigor) | Pillars map to funded structure | "Chaos / Order" toggle | Values as nouns with one-line definitions | Long text-only page (32 KB) |
| 9 | optimismfractal.com | Fractal peer | "Optimism Fractal Is Paused", moving to Eden Fractal | Council approval linked | Honest pause banner | Say plainly what has stopped | Leaving the Respect Game with no live count |
| 10 | eden.fun | Fractal peer | FAILED (connection error, SSL error on edenfractal.com) | n/a | n/a | n/a | n/a |
| 11 | resonate.coop | Artist co-op | Closed notice: "in operation from 2017 - 2024... officially closed" | Dated range | "Stream to own" and Community Credentials | A dated range as honesty | Closing with no data export note |
| 12 | catalog.works | Artist-first | "Catalog is no longer active" over the old pitch | 12% / 50-40-10 split widgets, "$3 million" in the closing note | Splits shown as numbers, not words | Show the split numbers in the hero | Pitch without longevity |
| 13 | sound.xyz | Artist-first | "Sound.xyz is now offline as of January 16, 2026" | "What stays" list; contracts and storage | Opens with what survives | A "what stays" panel | n/a |
| 14 | audius.co | Artist-first | "Audius is made for us"; 40,000+ monthly active artists | Contest cards with names | "Who is Audius made for?" in three roles | Role-based entry (artist, label, listener) | Free-forever claims with no payout figure |
| 15 | bandcamp.com | Artist-first | Live "selling right now" feed; "$1.82 billion" paid to artists | Live feed; yesterday's count (75,603 records) | A joke next to a proof | A live receipt feed with a human voice | Keep it out of the first screen if the API is down |
| 16 | ampled.com | Artist co-op | "Ampled (2019-2023)" archive | Bylaws, documentation, people, zines, open source codebase | Co-op documents are first-class | Publish bylaws | n/a |
| 17 | patreon.com | Creator platform | "Create on your terms"; role menus (podcasters, musicians) | Feature lists | Role-first navigation | Role pages | Generic SaaS shape; the archetype the audit calls template |
| 18 | stocksy.com/about | Artist co-op | "Premium by Principle"; "never generative AI" | "50-75% royalties", 2M+ assets, "only 1% of applicants accepted" | A stance against AI-made work as a brand rule | Put the artist take and the stance in one line | Home returned 403 to curl (read via exa) |
| 19 | longnow.org | Long-term | Manifesto, "02025", Eno quote | One idea per screen | Five-digit year | Time-scale language | No live data |
| 20 | are.na | Long-term | "15 years and 81 days" counter; "No ads, no personalized recommendations" | A counter and a refusal | Refusals as features | Counters, refusals | n/a |
| 21 | mozilla.org | Long-term | "Internet for people, not profit" | Manifesto link in menu | Four-word value line | Values line | Heavy chrome (cookie wall, language list) |
| 22 | kickstarter.com/charter | Long-term | "Kickstarter is a Benefit Corporation" | Charter with dated commitments ("will never sell user data") | Commitments written as "will" and "will not" | The charter format | n/a |
| 23 | siteinspire / Godly | Design awards | Showcase grids | Curated | Filters for Unusual Layout, Art | Use as exemplar sources | Do not copy motion trends |
| 24 | awwwards.com music | Design awards | Nominee grid with Site of the Day marks | Jury | Music sites are mostly single-artist | Look at typography | No community or co-op exemplars in the music list |

## Patterns to steal

1. One rule per line (Nouns). The Respect rule becomes five lines: earned weekly, ranked by peers, soulbound, cannot be bought, measured on-chain.
2. A live receipt feed with a human voice (Bandcamp). WaveWarZ battles and payouts, Luma events, newest Paragraph post, each stamped "updated N minutes ago".
3. A counter in years and days since a dated start (Are.na, Long Now). Since 2024-07-30.
4. A charter with "will" and "will not" (Kickstarter) and published bylaws (Ampled), linked.
5. A "what stays" panel (Sound.xyz, Catalog). The Respect ledger is on Optimism; the code is open; the artist keeps rights.
6. A registry as proof (Protocol Guild). A public, linkable list of Respect holders, not faces.
7. A refusal as a feature (Are.na "No ads"; Stocksy "never generative AI"). The ZAO's refusal is "no vote for sale".
8. A plain first sentence (FSF, per HN). Pick one H1 sentence from the list above.
9. Honest status banners (Optimism Fractal pause, Ampled archive). Print what is paused (OG minting since 2025-12-20).

## Anti-patterns

1. Metaphor first screens (mixing console, map, rings) that need a tap before the claim appears. The HN and Reddit threads treat unexplained animation as a failure.
2. Enterprise stats for a community (Optimism's $31.8T).
3. Template shape: label, heading, paragraph, card, repeated seven times (the audit's own diagnosis of the live home).
4. Governance with no mechanism shown (Developer DAO "Govern").
5. Claiming a streak or a holder base the ledger does not carry (periods 71, 72, 103).
6. Zero shown as a measurement. `lib/wavewarz.ts` already refuses this (`statsFrom` returns null on a missing field); keep that for every new feed.
7. Embedding a third-party widget with its own theme at a fixed height (the Luma iframe at 520 px).
8. Long-term claimed by adjective with no dated record (every closed platform in the survey).

## Recommended homepage structure (first screen, then first scroll)

Order and feed for each section. Designer chooses form and look.

| # | Section | What it shows (STRUCTURE and PROOF) | Live data feed |
|---|---|---|---|
| 1 | First screen: H1 sentence plus proof strip | One-sentence statement (artists, vote you earn, rights returned). Under it a strip of four checkable numbers: Respect holders, weeks of the Respect Game, battles, SOL paid to artists. Two links only: "How the vote works" and "See the receipts". | Respect holders: Blockscout token-holders API for OG `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` and ZOR `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (dedupe holders on both); weeks: computed from 2024-07-30; battles and payouts: `https://wavewarz.info/api/public/stats` |
| 2 | Time is the stake | One stepped interaction of a Respect Game week; one line that Respect cannot be bought; the real distribution caveat (OG Gini about 0.73, no OG mints since 2025-12-20) in small print beside it. | Static plus the holder count above; Gini is a dated manual figure with its measure date shown |
| 3 | Artists first, and what they receive | Three sentences on profit margin, data and IP, then the WaveWarZ artist payout against volume (15.77 SOL of 1,002.95 SOL) and the top battle artists. | `wavewarz.info/api/public/stats` (`artistPayouts.totalSol`, `volume.totalSol`), `/leaderboards/artists` (already in `lib/wavewarz.ts`) |
| 4 | The charter | Three "will" and "will not" commitments on margin, data and IP, each linked to its backing document. Hidden until Zaal supplies the wording. | Static; links to `/papers` |
| 5 | Long-term record | Dated receipts: Respect Game start, ZAOstock 2026-10-03, ZABAL Gamez Season 1, COC Concertz as a 50/50 partnership (never "The ZAO's COC"). A "what stays if we stopped" panel. | Static dated entries plus Paragraph RSS (`https://api.paragraph.com/blogs/rss/@thezao`) for the latest post |
| 6 | This week | Next three events and the newest post, each with an "updated" stamp. Replace the Luma iframe with a native list if Luma exposes a feed. | Luma calendar (luma.com/zao, `cal-jPH4al7AMlXzdNN`); Paragraph RSS |
| 7 | Join | Role-based entry (artist, builder, fan) in the Audius pattern; one primary action per role. The Player (#73) lives here as a link to the side page. | Static |

## Existing concept PRs: supported or rejected

| PR | Verdict | Reason |
|---|---|---|
| #68 Index | SUPPORTED as the proof strip | Numbered facts with a link to the source match Nouns and Bandcamp. Count-up animation is optional; keep numbers readable without it. |
| #69 Desk | REJECTED for first scroll | Metaphor first; the claim needs a tap. Keep as an interaction idea for section 7 only if a designer wants it. |
| #70 Room | PARTIAL | Showing members supports "people invest time", but faces need consent; Protocol Guild shows a registry list instead. Link out, not hero. |
| #72 Paper | SUPPORTED for section 6 | A live front page matches Bandcamp and Bankless freshness. |
| #73 Player | KEPT as side page | Zaal's ruling; Bandcamp and Audius support a player on music pages, not the organisation front door. |
| #74 Map | REJECTED for first scroll | Hides the mechanism; useful on `/nexus`. |

All six PRs are open and the last three are marked on hold in their titles (`gh pr view`, 2026-10-28). Sibling-PR rules (own routes, no shared file) stay in force.

## Contradictions and open points

- doc `identity/1383-zao-front-door-consolidation-jul2026` recommends killing thezao.com and canonicalising thezao.xyz. The site repo `CLAUDE.md` mandate (2026-07-21) keeps thezao.com. This doc follows the repo mandate. Number 1383 is ambiguous (three docs share it); the full path is used.
- The ICM box still points Find it to thezao.xyz while `public/llms.txt` says thezao.xyz is Co-Works (audit item 3). Zaal-gated.
- "100+ weeks" (116 calendar weeks to 2026-10-22) versus "72 settled on-chain weeks": show both, never "unbroken". Source: ICM `/fractal`.
- COC Concertz: a 50/50 joint venture led by Thy Revolution. Do not present it as a ZAO property.
- Not measured: real phone rendering, Lighthouse, and whether visitors understand the H1. A 5-person test with the candidate sentences is in Next Actions.

## Also See

- [Doc 2111 - anti-AI-slop web design](../../dev-workflows/2111-anti-ai-slop-web-design/)
- [Doc 2126 - thezao.xyz vs thezao.com](../../business/2126-repo-web-improvement-does-the-competing-thezao/)
- [Doc 2564 - UI improvement audit tools](../../dev-workflows/2564-ui-improvement-audit-tools/)
- [Doc 1383 - front door consolidation](../../identity/1383-zao-front-door-consolidation-jul2026/)
- Site repo: `app/page.tsx`, `lib/constants.ts`, `lib/wavewarz.ts`, `public/llms.txt`, `app/globals.css` (bettercallzaal/zao-website, origin/main)
- Vault: `~/zao-vault-worktrees/thezao/notes/website-audit-2026-10-28.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick one H1 sentence from the candidates (or write your own); shipped when the sentence is in the site brief | Zaal | Decision | 2026-10-31 |
| Write the three charter commitments on profit margin, data and IP, each naming the document that backs it; shipped when the text is in the vault and linked from `/papers` | Zaal | Decision | 2026-11-04 |
| Hand this doc to the designer with Zaal's pick; shipped when the designer confirms receipt and a first wireframe of sections 1 to 3 exists | Zaal via lane (10) website | Handoff | 2026-11-05 |
| Add a Respect holder count and weeks counter to `lib/` as server-fetched, null-on-failure helpers beside `lib/wavewarz.ts`; shipped when the PR is merged and tests cover a mutated payload | lane (10) website | PR | 2026-11-07 |
| Surface `artistPayouts.totalSol` next to `volume.totalSol` in the WaveWarZ stats helper; shipped when a PR is merged and the homepage prints both | lane (10) website | PR | 2026-11-07 |
| Ask the WaveWarZ lane (Candy) to confirm the `artistPayouts` figure is the number to show publicly; shipped when a written yes or a corrected figure is in the lane note | Zaal via /candy | Confirmation | 2026-11-04 |
| Run a 5-person first-screen test (what is it, who is it for, how do you get a vote) on the candidate H1s once a designer wireframe exists; shipped when answers are logged in the vault | Zaal | Test | 2026-11-12 |
| Fix the ICM box Find it lines (thezao.com not thezao.xyz) so AI answers match the site | Zaal | ICM edit | 2026-11-04 |
| Retry the failed sources (eden.fun, edenfractal.com, mambomambo.coop) with a browser fetch and add Eden Fractal as a peer row | lane (10) website | Re-research | 2026-11-11 |

## Sources

Marks: FULL means content fetched and read; PARTIAL names what is missing; FAILED names what was tried. All fetched 2026-10-28 unless stated. Methods: `curl` with a browser user agent and text extraction, then exa `web_fetch_exa` for JS-heavy or blocked pages.

DAOs and communities
1. [Optimism](https://optimism.io) [FULL] - enterprise pitch and stat tiles. Also https://gov.optimism.io [FULL] - Collective forum list (Working Constitution thread 628 replies; "Is Optimism Dying?" 17 replies, 2026-10-16).
2. [Gitcoin](https://www.gitcoin.co) [FULL]
3. [Nouns DAO](https://nouns.wtf) [FULL via exa; curl returned 208 bytes of JS shell]
4. [Friends With Benefits](https://www.fwb.help) [PARTIAL - homepage is an event and program banner only; no About page read after the curl 000 and exa fallback]
5. [Protocol Guild docs](https://protocol-guild.readthedocs.io) [FULL]
6. [Developer DAO](https://www.developerdao.com) [FULL]
7. [Bankless](https://www.bankless.com) [FULL]
8. [Metagov](https://metagov.org) [FULL]
9. [Optimism Fractal](https://optimismfractal.com) [FULL]
10. [Eden / Eden Fractal](https://eden.fun) [FAILED - curl status 000, exa CRAWL_UNKNOWN_ERROR; edenfractal.com CRAWL_SSL_ERROR; known only through the Optimism Fractal pause notice]

Artist-owned and artist-first
11. [Resonate](https://www.resonate.coop) [FULL - a closure notice, short]
12. [Catalog](https://catalog.works) [FULL] and [closing note](https://fin.catalog.works/) [FULL]
13. [Sound.xyz](https://www.sound.xyz) [FULL]
14. [Audius](https://audius.co) [FULL via exa]
15. [Bandcamp](https://bandcamp.com) [FULL]
16. [Ampled](https://ampled.com) [FULL]
17. [Patreon](https://www.patreon.com) [FULL for navigation and hero; creator pages not read individually]
18. [Stocksy about](https://www.stocksy.com/about) [FULL via exa; home returned 403 to curl]

Long-term and slow
19. [Long Now](https://longnow.org) [FULL]
20. [Are.na](https://www.are.na) [FULL]
21. [Mozilla](https://www.mozilla.org) [FULL for hero and menu]
22. [Kickstarter charter](https://www.kickstarter.com/charter) [PARTIAL - first ~2,500 characters read via exa; curl returned 403]

Design awards (exemplar finding only)
23. [siteinspire](https://www.siteinspire.com) [FULL - listing]; [Godly](https://godly.website) [FULL - listing]; [Awwwards music nominees](https://www.awwwards.com/websites/music/) [FULL - listing]. [MamboMambo Coop](https://mambomambo.coop) [FAILED - exa CRAWL_UNKNOWN_ERROR].

Community sources
24. [r/dao: Why DAO all have the same design?](https://www.reddit.com/r/dao/comments/s25nly/why_dao_all_have_the_same_design/) [FULL - 5 comments via exa]
25. [r/TheDao: The Website Copy Needs to Be Improved](https://www.reddit.com/r/TheDao/comments/4i8u5s/the_website_copy_needs_to_be_improved/) [PARTIAL - post and quoted comment via exa]
26. [r/ethdev: Why do all NFT Project Websites look the same?](https://www.reddit.com/r/ethdev/comments/t2xypu/why_do_all_nft_project_websites_look_the_same/) [PARTIAL - top comments only]
27. [HN 35119893: PeopleDAO Google Form thread](https://news.ycombinator.com/item?id=35119893) [PARTIAL - excerpt via exa]
28. [HN 36399910: Show HN landing page feedback](https://news.ycombinator.com/item?id=36399910) [PARTIAL - excerpt via exa]
29. [Rocket Pool governance: New Design for RocketPool's Website](https://dao.rocketpool.net/t/new-design-for-rocketpools-website/569) [PARTIAL - excerpt via exa]

The ZAO grounding
30. ICM masters [FULL]: https://context.thezao.com/thezao, /fractal, /wavewarz, /zaostock, /zabalgamez, /coc-concertz.
31. Site repo origin/main [FULL]: `app/page.tsx`, `lib/constants.ts`, `lib/wavewarz.ts`, `public/llms.txt`, `app/globals.css` (lines 11, 14 for the palette).
32. WaveWarZ public API stats endpoint https://wavewarz.info/api/public/stats [FULL - fetched 2026-10-29 02:12 UTC: 1,668 battles, 1,002.9548 SOL, artist payouts 15.7655 SOL, trader claims 520.9295 SOL in 3,559 withdrawals]. The API docs page (wavewarz.info/api-docs) was not fetched; the endpoint paths come from `lib/wavewarz.ts`.
33. Luma calendar https://luma.com/zao [HTTP 200 only - page content not read]; Paragraph RSS https://api.paragraph.com/blogs/rss/@thezao [FULL for the channel header; feed items not read].
34. Vault note `website-audit-2026-10-28.md` [FULL].
