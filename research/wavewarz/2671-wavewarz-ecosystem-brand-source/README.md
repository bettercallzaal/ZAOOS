---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "743, 2668, 2670, 608, 711"
original-query: "lets make a side part of the wavezstation terminal bringing together the branding of the wavewarz ecosystem. One brand source for the WaveWarZ ecosystem: the family map, the one spelling for each name, a re-verification with real fetches of the 10 Oct SEO and GEO gap audit of wavewarz.com (empty homepage body, sitemap 404, robots, llms.txt 404, the Bitget listing and its WARZ token claim) and the same checks for wavezstation.com, drafts the team can ship, and the audit's 8 fixes ranked by effort."
tier: STANDARD
---

# 2671 - The WaveWarZ ecosystem: one brand source, and the SEO and GEO audit re-checked

> **Goal:** One place that says what each WaveWarZ product is, how its name is spelled, what the two sites currently give a search engine or an AI assistant to read, and what to ship first so the team defines the brand instead of third parties.

Every fetch below was made on **2026-10-13 between 22:55 and 23:00 UTC** with curl, and the raw response was read, not a summary of it. Nothing was posted, deployed or sent. The sites belong to the WaveWarZ team to change.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | USE **WaveWarZ** and **WaveZStation**, exactly, everywhere. | Those are the spellings in each site's own title and visible text. Section 2 has the wrong-spellings list. |
| 2 | COPY what wavewarz.info already does onto wavewarz.com and wavezstation.com. | The team's own analytics site has a sitemap, crawler rules, an llms.txt, a canonical tag and structured data. The two product sites have none of them. The know-how is in the house. |
| 3 | SHIP an llms.txt and a real robots.txt on both product sites first. | Four files, no design work. Both sites return 404 for llms.txt and sitemap.xml today; one has a robots file with no rules and the other has no robots file. |
| 4 | PUT TEXT in the wavewarz.com homepage. | The page a crawler receives has a title, a description and **zero characters of visible body text**. Its /how-it-works and /docs pages return 200 and their bodies are also empty; the only words on them are the site title in the `<title>` tag. |
| 5 | ASK the team one question about the "WARZ" token before publishing any "no token" line, then ask Bitget to correct its listing if the answer is what the team's site says. | Bitget describes a native WARZ token with a market cap. The team's site says "no platform token". The token address Bitget gives exists on Solana and has a supply of zero. |
| 6 | TREAT the audit's search-ranking and competitor claims as UNVERIFIED. | They rest on search result pages that were not re-run here. |

## 1. The family map

| Name | What it is, in one sentence | Chain and money | Site | Who runs it |
|---|---|---|---|---|
| **WaveWarZ** | Live music battles: two artists or two songs go head to head and fans trade short-lived battle tokens on who wins, with the artist paid on every trade. | Solana, SOL | wavewarz.com | Hurric4n3Ike (founder, developer, MC), Candytoybox (design, marketing), Zaal (ecosystem, partnerships), per the WaveWarZ ICM box |
| **WaveZStation** | Buy into a song instead of streaming it: every purchase pays the artist 45%, earlier buyers of that song 45% and the platform 10%. | Base, USDC | wavezstation.com | the WaveWarZ team, with the WaveWarZ developer building the site and listing the songs: as stated by Zaal, 2026-10-13. The site itself names no team. |
| **WaveWarZ Intelligence** | The scoreboard: every battle, volume, payout and leaderboard, read from the chain, with a free public API. | reads Solana | wavewarz.info | WaveWarZ, per the site: its footer reads "2026 WaveWarZ. All rights reserved." and its llms.txt names wavewarz.com as the main platform. Which team member deploys it is not stated on the site. |
| **wwtracker** | The lab: an open-source tracker of the treasury, the fee model and the decoded program, where new views are prototyped before they move to the main sites. | reads Solana | wwtracker.vercel.app, repo bettercallzaal/wwtracker (MIT) | Zaal |
| **The protocol and SDK** | The written standard for what a "battle" and a "song" are across the products, plus read-only code to query them. | n/a | not public yet | Zaal |
| **WaveWarZ Africa** | Per-country battle leagues run with a partner network. | Solana | appears on wavewarz.info as the handle WaveWarzAfrica | announced 4 May 2026 with RAM SongChain ([doc 608](../../events/608-wavewarz-africa-ram-songchain-may4/)); the partner's own spelling of its name is to be confirmed |
| **The AI Tournament** | A bracket of AI artists battling on WaveWarZ. | Solana, SOL | on wavewarz.info when live | a WaveWarZ event: [doc 743](../743-wavewarz-whitepaper-v2-deep-dive/) records registration for an 8 or 16 slot AI Artist Tournament on the WaveWarZ roadmap. Who organises it is not separately sourced here. In the public battle data, the series on 19 and 20 July 2026 is the largest two days in the platform's history (342 SOL). |

How they relate: WaveWarZ is the event, WaveZStation is the catalogue, Intelligence is the record, wwtracker is the workshop, the protocol is the grammar they are meant to share. The artists overlap across the first two; the wallets and ledgers do not, because they are on different chains.

What is and is not sourced in the last column: the WaveWarZ row comes from the ICM box, the Intelligence row from the site's own footer and llms.txt, the WaveZStation row from Zaal's statement, and the tournament row from doc 743. Two things no source here says: whether a company stands behind the products, and who deploys wavewarz.info. Both are questions for the team.

## 2. Naming

| Product | The one spelling | Evidence | Do not write |
|---|---|---|---|
| WaveWarZ | **WaveWarZ** | wavewarz.com `<title>` "WaveWarZ Music Battles" and `og:site_name` "WaveWarZ"; 8 of 9 capitalised uses in wavewarz.info's visible text | Wave Wars, WaveWars, WaveWarz, Wave Warz, Wave WarZ, Wavewarz, Wave War Z |
| WaveZStation | **WaveZStation** | wavezstation.com `<title>` "WaveZStation"; 6 of 6 uses in its visible home text; 14 of 17 capitalised uses on its docs page | Wave Station, WaveStation, Wavestation, Wavezstation, WavezStation, WaveZ Station |
| WaveWarZ Intelligence | **WaveWarZ Intelligence** | wavewarz.info `<title>` and `og:site_name` | WaveWarz Intelligence, Wave Warz Intel |

Notes:

- Lower case is correct in domains and handles (wavewarz.com, x.com/wavewarz). That is an address, not the name.
- "WavezStation" appears a few times inside wavezstation.com's own page source and docs. It is the team's own slip and worth a find-and-replace.
- "wavestation" is also a payment-processor merchant ID used for WaveWarZ (docs 743 and 406). It is an identifier, not a product name, and should never appear in copy.
- The one large third-party page about the brand, Bitget's, spells it "WaveWarz".
- The WaveWarZ ICM box, the canonical AI-readable description of the brand, does not mention WaveZStation at all. It should.

## 3. The audit, re-checked

The audit was a crawler's-eye read of wavewarz.com dated 10 October. Each claim below was fetched again.

### 3.1 wavewarz.com

| Audit claim | Result | What the raw response shows |
|---|---|---|
| Homepage has no crawlable text, only title and meta | **CONFIRMED** | 200, 11,786 bytes. `<title>` "WaveWarZ Music Battles", a description, Open Graph and Twitter tags. Visible text inside `<body>` after removing scripts and styles: **0 characters**. No `<h1>`, no JSON-LD. |
| /sitemap.xml is 404 | **CONFIRMED** | 404, an HTML error page |
| robots.txt has no directives | **CONFIRMED** | 200, 1,248 bytes, every line a comment (a content-signals preamble). Lines starting with User-agent, Allow, Disallow, Sitemap or Content-Signal: **0**. Control: the same count on wavewarz.info's robots.txt is 69. |
| /llms.txt is 404 | **CONFIRMED** | 404 |
| No FAQ, how-it-works or about page | **PARTLY, and worse than stated** | /about and /faq are 404. /how-it-works and /docs return **200** with **0 characters** of visible text in the body. The only words on either page are "WaveWarZ Music Battles" in the `<title>` tag. A crawler sees pages that exist and say nothing. (Corrected 2026-10-13: this row first said 22 and 24 characters of visible text; that count had included the title.) |
| Best content lives off-domain (litepaper, artist form) | NOT RE-CHECKED | the litepaper and the form were not fetched |
| Brand query not owned; competitors rank on category terms | **UNVERIFIED** | search result pages were not re-run |
| Litepaper figures (800 to 2,500 dollars a match, 50+ artists), a 16,000 dollar clip | **UNVERIFIED** | not fetched. Measured instead: the median Sunday main-event day in 2026 did 5.14 SOL |

Control for all the 404s: the same three paths on a site known to have them returned 200.

### 3.2 The Bitget listing and the WARZ token

The page exists: `web3.bitget.com/dapp/wavewarz-32820`, fetched raw (200, 549 KB). It says, in its own words:

- users "support their favorite artists using the native WARZ token";
- WaveWarz "successfully launched its native token (WARZ) on the Solana network, reaching a notable All-Time High market cap of $43.1K";
- the token generation event "took place in late 2024 when the bonding curve was completed and liquidity was migrated to Raydium";
- "The current market capitalization is estimated at approximately $3.2K to $5K";
- and it gives a contract address for buying it.

Against that:

| Check | Result |
|---|---|
| What the team's own site says | wavewarz.info, visible text: "Every trade is denominated in SOL - no platform token, no middleman." Doc 743 records the same from the whitepaper: all trades in SOL, no platform token. |
| Does the address Bitget gives exist? | Yes. Solana `getAccountInfo` on `pQoJ6m...4YPX` returns a Token-2022 mint with on-chain metadata name "Warz", symbol "WARZ", 6 decimals, no mint authority. Control: the same call on the USDC mint returns a mint with a supply in the trillions of base units. |
| Its supply | **0.** A token with nothing in circulation cannot have the market capitalisation the page states today. |
| Who created it | UNKNOWN. The mint's update authority is an address this doc cannot tie to anyone. |
| Timeline | The page puts the token launch in late 2024. The first WaveWarZ battle in the public API is 28 May 2025. |

**Verdict: UNVERIFIED, and contradicted by the team's own published statement.** The page describes a platform token as central to how WaveWarZ works. The product, as the chain and the team's site show it, runs on SOL with tokens that live only for the length of a battle. Whether anyone on the team ever created the "Warz" mint is the one fact missing; it decides whether the fix is "ask Bitget to remove a token that was never ours" or "ask Bitget to say the token is retired". Either way it is a correction for the team to request, and until it is made, the most complete third-party description of the brand tells readers to go and buy something with no supply.

The page also carries the spelling "WaveWarz" throughout and files the product under Music and Entertainment next to a direct competitor.

### 3.3 The same four checks on wavezstation.com

| Check | Result |
|---|---|
| Homepage body | 200, 45,336 bytes. **1,085 characters** of visible text: the pitch and the four steps are real server-rendered text. The "Live Pools" section, the part with actual songs, says "Loading...". One `<h1>`. |
| Head | `<title>` "WaveZStation", description "Web3 music platform". **No Open Graph tags, no Twitter tags, no JSON-LD, no canonical.** |
| /robots.txt | **404** (an HTML error page) |
| /sitemap.xml | **404** |
| /llms.txt | **404** |
| Song pages | every song page serves the same title and description, with the song filled in by the browser afterwards ([doc 2670](../2670-wavezstation-improvements-ranked/), rank 1) |

So WaveZStation is slightly better than wavewarz.com on body text and worse on everything in the head.

### 3.4 The site that already does it right

| | wavewarz.com | wavezstation.com | wavewarz.info |
|---|---|---|---|
| Visible body text | 0 chars | 1,085 chars | 5,433 chars |
| robots.txt | comments only | 404 | 200, with rules for named AI crawlers |
| sitemap.xml | 404 | 404 | 200, 15 URLs |
| llms.txt | 404 | 404 | 200, 1,784 bytes: what it is, fees, API |
| JSON-LD | none | none | present |
| Open Graph | present | none | present |
| Canonical tag | none | none | present |

Everything the audit asks for on wavewarz.com already exists one domain over. That changes the job from "learn SEO" to "copy four files and a layout pattern".

## 4. What was drafted

Ready-to-ship files were written for the team and are held privately until the team has answered the token question, since two of them state "no platform token":

- an llms.txt for wavewarz.com and one for wavezstation.com;
- "How it works" and FAQ copy for both, using only measured numbers, each with its source and the date 13 Oct 2026;
- Organization and FAQPage JSON-LD for wavewarz.com, WebSite and Organization JSON-LD for wavezstation.com, and per-song title and Open Graph tags;
- a robots.txt shape and a first sitemap list;
- an outline for a "who runs it, fees and risks" page, with blanks only the team can fill (legal entity, contact, audits, key holders, flat fees).

The numbers those drafts use, so they can be checked here:

| Number | Source | Read |
|---|---|---|
| 1,618 battles: 191 main-event battles in 64 main events, 1,393 quick, 34 community | wavewarz.info/api/public/stats | 13 Oct 2026 22:59 UTC |
| 980.97 SOL traded, all time | same | same |
| 15.28 SOL paid to artists; 503.59 SOL claimed by traders in 3,471 withdrawals | same | same |
| First battle 28 May 2025 | wavewarz.info/api/public/battles | 13 Oct 2026 |
| 1.5% per trade (1.0% artist, 0.5% platform); losing pool split 50 / 40 / 5 / 2 / 3 | wavewarz.info/llms.txt, the team's own text | 13 Oct 2026 |
| WaveZStation: 234 purchases, 1,956.30 USDC, 35 buyers, 31 songs, 880.34 USDC to artists, 45 / 45 / 10 exact | contract events, [doc 2668](../2668-wavezstation-onchain-ground-truth/) | 13 Oct 2026 |

## 5. The audit's eight fixes, ranked for this team by effort

"Deploy" means a change to wavewarz.com or wavezstation.com, which only the sites' developer can ship.

| Order | Audit fix | Effort | Who it needs | Note |
|---|---|---|---|---|
| 1 | Fix 2: sitemap.xml, real robots rules, llms.txt, Organization and FAQ schema | **Hours.** Drafts exist. | Hurricane to deploy on both sites | The pattern is already live on wavewarz.info. |
| 2 | Fix 4 (second half): one spelling everywhere | **Hours.** | Candy for copy and assets; Hurricane for the find-and-replace in the sites | Section 2 is the list. Includes the team's own "WavezStation" slips. |
| 3 | Fix 1: server-render the homepage with real copy | **A day or two.** Copy drafted. | Hurricane | The single biggest gap: 0 characters today. /how-it-works and /docs need the same. |
| 4 | Fix 3: on-domain pages (How it works, FAQ, About, risks, For artists) | **Days.** Copy and outline drafted; the team fills the blanks. | Candy for copy and design, Hurricane to deploy, all three for the "who runs it" facts | /how-it-works already has a URL that returns 200. |
| 5 | Fix 6: correct or claim the Bitget listing; add directory listings | **An hour to ask, then waiting.** | The team decides the token answer first; then whoever holds the brand's accounts makes the request | Blocked on one question, not on work. |
| 6 | Fix 4 (first half): move the litepaper to wavewarz.com/docs | **A day.** | Hurricane, with whoever owns the litepaper text | /docs exists and is empty. |
| 7 | Fix 5: a page per battle and per artist | **Weeks on wavewarz.com; partly done already.** | Hurricane for wavewarz.com | wavewarz.info already has battle and leaderboard pages in its sitemap. Linking to them from wavewarz.com is the cheap version. |
| 8 | Fix 7 and Fix 8: comparison content and a press pitch | **Ongoing.** | Zaal and Candy; no deploy needed for the pitch | The pitch needs numbers the team will stand behind. The measured ones are in section 4; the litepaper's and the clip's are unverified. |

The first two rows are an afternoon and need no new copy to be approved, apart from the token line.

## 6. What this did not check

- Search result pages for the brand name or for category terms, and the competitors the audit names.
- The litepaper, the artist application form, and the press article.
- Whether Bitget offers a claim or correction process, and how long it takes.
- Wikipedia, Wikidata, Crunchbase or Solana directory listings.
- Any analytics or Search Console data. None was available.

## Also See

- [Doc 743 - WaveWarZ whitepaper v2 deep dive](../743-wavewarz-whitepaper-v2-deep-dive/)
- [Doc 2668 - WaveZStation on-chain ground truth](../2668-wavezstation-onchain-ground-truth/)
- [Doc 2670 - WaveZStation improvements, ranked](../2670-wavezstation-improvements-ranked/)
- [Doc 608 - WaveWarZ Africa](../../events/608-wavewarz-africa-ram-songchain-may4/)
- `research/identity/icm-boxes/wavewarz.llm.txt` - the repo copy of the WaveWarZ ICM box

## Next Actions

| # | Action | Owner | Type | Done when |
|---|---|---|---|---|
| 1 | Ask the team whether anyone on it created the "Warz" token | Zaal | his question to ask | a yes or a no, in writing |
| 2 | Take the drafted files to the team | Zaal | his to hand over | Hurricane has the four files for each site |
| 3 | Ship llms.txt, robots.txt and sitemap.xml on both product sites | Hurricane | deploy | all three return 200 on both domains |
| 4 | Put the homepage copy in the server-rendered HTML of wavewarz.com | Hurricane | deploy | a curl of the homepage shows the "what it is" paragraph |
| 5 | Request the Bitget correction once row 1 is answered | the team | outbound, theirs | the page no longer describes a native token, or describes it accurately |
| 6 | Add WaveZStation to the WaveWarZ ICM box and refresh its May figures | Zaal-gated box edit | box update | the box names both products and carries October numbers |
| 7 | Re-run section 3 after rows 3 and 4 ship | wavewarz lane | curl | every CONFIRMED row reads FIXED |

## Sources

1. https://www.wavewarz.com/ and its /robots.txt, /sitemap.xml, /llms.txt, /docs, /how-it-works, /about, /faq - curl, raw HTML and text, 22:55 to 22:58 UTC. [FULL]
2. https://www.wavezstation.com/ and its /robots.txt, /sitemap.xml, /llms.txt - curl, raw. [FULL]
3. https://wavewarz.info/ and its /robots.txt, /sitemap.xml, /llms.txt - curl, raw. [FULL]
4. https://wavewarz.info/api/public/stats, /battles and /events - raw JSON. [FULL]
5. https://web3.bitget.com/dapp/wavewarz-32820 - located with a web search, then fetched with curl and quoted from the raw HTML. [FULL for the quoted passages]
6. Solana mainnet `getAccountInfo` on the token address the Bitget page gives, and on the USDC mint as a control, via https://api.mainnet-beta.solana.com. [FULL]
7. The live WaveWarZ ICM box on useicm.com, fetched raw (2,096 bytes), and the repo copy at `research/identity/icm-boxes/wavewarz.llm.txt`. [FULL]
8. The 10 October SEO and GEO gap audit of wavewarz.com, supplied by Zaal. [FULL: read end to end; it is the thing being checked, not a source of facts]
9. ZAOOS docs 743, 2668, 2670 and 608. [PARTIAL: 743 and 608 by keyword]
10. A control site for the 404 checks (docs.anthropic.com robots.txt, sitemap.xml, llms.txt all 200). [FULL]
11. Community: none. No forum or social discussion of the brand was searched for this doc; the audit's own search sampling is marked UNVERIFIED above.
