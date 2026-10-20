---
topic: business
type: build-spec-research
status: research-complete, awaiting Zaal approval before any build
last-validated: 2026-10-20
related-docs: 2529, 1692
original-query: "lets open a lane on wavewarz and zao trading cards digital and i want to eventually make a card design creator" (Zaal, 2026-10-19)
tier: STANDARD
---

# 2689 - WaveWarZ and ZAO Digital Cards, and a Card Design Creator

> **Goal:** Extend doc 2529 (artist trading cards, feasibility) from "three cards for three artists" to two digital card lines - WaveWarZ fighter cards and ZAO member/artist cards - and a tool where a person picks a template, drops in an artist's own image and fields, previews, and exports a PNG.

This is a follow-up to [2529](../2529-zao-artist-trading-cards/), not a replacement. 2529 still holds the precedent (ZAO-CHELLA, December 2024, AttaBotty + DaNici), the physical print pricing (UPrinting), the digital-first recommendation and the consent rule. Nothing here re-derives those.

## Hard rules for everything in this doc

1. **No AI-made visuals.** Zaal's ruling of 2026-10-08 (Maine): AI for code is fine; posters, promo, share images and site looks are not AI-made, and Brian (North Creek) leads design. Card templates are designed by Brian or by the artist. Code lays out fields and exports a file. Code never generates, restyles, upscales or fills in art.
2. **Every artist approves their own card before it is public.** Same rule as 2529, same pattern: a per-artist approval link, never a blanket team decision.
3. **Visible credit on every card:** the artist, the photographer of the image, and the template designer. If the photographer is unknown, the card says so rather than leaving the line off (`credit-attribution.md`).
4. **Nothing minted, sold, priced or posted** by this work. On-chain, money and outbound are Zaal's.
5. **Contributed templates become ZAO-owned** and are credited as "designed by", never co-owned (Zaal, 2026-10-14).

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Which cards first | **ZAO first: ZAO Festivals artists** (Zaal, 2026-10-20). WaveWarZ cards follow. The existing ZAO CARDS - ZAO-PALOOZA EDITION collection at zao.cards is the line to continue, not a new one (see (b)). |
| Extend 2529 or new doc | New doc that cites 2529 (this one). 2529 is a validated feasibility record with a frozen date; appending a build spec to it would blur what was validated when. Auto-proceeded, override anytime. |
| WaveWarZ card data | Use the **fighter cards that already exist**: `tools/fighter-cards.py` in `bettercallzaal/wavewarz-protocol` (private repo) emits one card per artist from the on-chain battle record. Show records, not money-as-skill. |
| Rating on the card | **Do not print a rating yet.** The tool itself labels its rating "a choice this tool labels, not a decision anybody has taken". Records (wins, losses, streaks, upsets) are decided; the rating is not. Zaal's call. |
| ZAO card data | Start from the ZAOstock artist fields that already exist (name, genre, city, bio, photo, socials) plus a Farcaster profile. No new data model for v1. |
| Format | One PNG per card (portrait) plus a 3:2 landscape share version for Farcaster; a web card page per approved card later. Mini app only after both exist. |
| Creator: build vs adopt | **Build a thin creator on the browser's native Canvas 2D API, zero new dependencies.** No surveyed editor fits: the good ones are commercial or license-keyed, the free ones are whiteboards or general photo editors. `react-konva` (MIT) is the upgrade path if free-form drag and resize is ever wanted. |
| Repo home | **ZAOOS first (the lab), at `/cards`**, graduating to its own repo when it is public and attracting users, per the lab model in CLAUDE.md. Reasons below. |

## Findings

### (a) WaveWarZ cards - what the data already supports

WaveWarZ already has fighter cards as data. `tools/fighter-cards.py` (wavewarz-protocol, origin/main; output file last changed 2026-10-10, commit `3702ff9`) reads the emitted battle record and writes `fighter-cards.json`. Measured from that file on 2026-10-19:

- **109 artists** carry a card; **35 are ranked**, **74 are provisional** (fewer than 10 ranked battles, the tool's `provisional_below: 10`).
- Battles counted: **1,237 ranked of 1,643 total** - "settled on chain AND a judged result_winner, Zaal 2026-10-10". Self-battles are included (319), per Zaal 2026-09-12.
- Fields per card: `eligible_battles`, `sport_wins`, `sport_losses`, `sport_win_rate`, `market_wins`, `market_losses`, `longest_win_streak`, `upset_wins`, `upset_losses`, `opponents_faced`, `self_battles`, `first_battle`, `last_battle`, `volume_of_battles_sol`, `elo`, `provisional`, `self_battle_share`, and the key `artist_wallet`.
- Identity is the artist wallet ("1:1 with an Audius handle across 28 artists checked"). **The card file holds no artist name or image.** A display name comes from the catalogue import (`spec/CATALOGUE-EXPORT.md`, `artist_name` "the display name. Never an identifier"), and the image must come from the artist.

The PRD in the same repo already sketches the card (`spec/WBS-1-PRD-v1.0.md` section 35, "Global Artist Record ... This is the portable fighter card for music") and section 37 sets a rule the card should keep: "Money and competitive skill should not be collapsed into one metric."

**Proposed WaveWarZ card face (v1):**

| Slot | Source field | Note |
|---|---|---|
| Artist name | catalogue `artist_name` | artist confirms spelling |
| Artist image | supplied by the artist | never generated, never scraped without consent |
| Record | `sport_wins` - `sport_losses` | the judged record |
| Market record | `market_wins` - `market_losses` | shown separately, per PRD section 37 |
| Best streak | `longest_win_streak` | |
| Upsets | `upset_wins` | |
| Opponents faced | `opponents_faced` | |
| Active since | `first_battle` (unix time to month/year) | |
| Provisional badge | `provisional` | 74 of 109 would carry it today |
| Credits line | artist, photographer, template designer | rule 3 |
| Data stamp | "battle record as of YYYY-MM-DD" | every figure moves, so the card is dated |

Left off v1 on purpose: `elo` (undecided, above) and `volume_of_battles_sol`. The tool's own note says that figure "is the volume of battles the artist appeared in, NOT their share" - both sides carry the whole figure - so on a card it would read as the artist's earnings when it is not. Whether any SOL figure goes on a public card is Zaal's call.

Prior card-adjacent work: doc [1692](../../technology/1692-wavewarz-farcaster-mini-app-spec/) specs a battle share card (one battle, two artists) for a Farcaster mini app. That is a per-battle card; this is a per-artist card. They share the share-image plumbing, not the data. The public `bettercallzaal/wavewarzapp` repo has `src/components/BattleCard.tsx`, a UI component, not an image exporter (path read from the repo tree, file not opened).

### (b) ZAO cards - member and artist cards

**These come first.** Zaal, 2026-10-20: "ZAO first ZAO Festivals we have some made from ZAO PALOOZA zao.cards under the zao wallet, i wanna do more".

**The line already exists, and 2529 missed it.** 2529 found the ZAO-CHELLA cards (December 2024) but not this earlier set:

- `https://zao.cards` redirects (a 307, then HTTP 200 at the end of the chain, fetched 2026-10-20) to a Manifold page by `@the-zao`, titled "ZAO CARDS - ZAO-PALOOZA EDITION | THE ZAO", described as "ZAO CARDS - FROM ZAO-PALOOZA 4/3/24".
- The archived ZAO Nexus link lists carried a per-artist subdomain pattern. Two examples are "Mint Attabotty ZAO-PALOOZA Card" at `https://attabotty.zao.cards` and "ZAO-PALOOZA Artist Cards" at `https://zao.cards` (`research/_archive/nexus-versions/ZAONEXUS-current/links.ts`).
- Doc 231 credits ZAO-PALOOZA (April 2024) with "Trading card design" (`research/_archive/231-community-profiles-tyler-candy-swarthy-dcoop`).
- Per Zaal, the collection sits under the ZAO wallet.

I could not read the card list itself, because the Manifold page renders its cards with JavaScript and the raw HTML carries no card data. So this doc does not say how many cards exist, who is on them, or which chain or contract holds them.

**What this changes.** New ZAO cards should continue the ZAO CARDS line, with the same name, the same domain and a matching look, rather than start a second brand. But that collection is minted, so adding a card to it is an on-chain action and stays Zaal's. The creator in (d) makes the approved PNG. Whether a card then joins the Manifold collection is a separate decision, made card by card.

The fields that already exist and are already artist-controlled are the ZAOstock `PublicArtist` shape (`ZAODEVZ/ZAOstock` `src/lib/artists.ts`, read 2026-10-19): `name`, `genre`, `city`, `bio`, `photo_url`, `logo_url`, `socials`. 2529 records that `photo_url` changes there go through the artist's own claim-token link, which is the consent pattern to reuse.

Proposed ZAO card face: name, image (artist-supplied), genre, city, a one-line bio the artist writes, one ZAO moment (for example "played ZAOstock 2026" or "ZAO-CHELLA 2024"), a Farcaster handle, and the credits line. Anything numeric (ZOLs, Respect, points) is left off v1 until Zaal says which ZAO number, if any, belongs on a public card.

### (c) Digital formats that fit

| Format | What it is | Constraint (fetched) | Where it lives | Cost |
|---|---|---|---|---|
| Card PNG (portrait) | The card itself, for posting and printing | none beyond the template | exported to the person's device | design time only (2529) |
| Share PNG (3:2) | The portrait card centred on a landscape background | Farcaster embeds: `imageUrl` "Must be 3:2 aspect ratio", max 1024 chars; displayed "in a 3:2 ratio with a button underneath" | same export | none |
| Web card page | `/cards/<slug>`, one per approved card, carries `fc:miniapp` meta so a cast shows the card | 3:2 image above; mini app `heroImageUrl` is 1200 x 630 | ZAOOS route | runs inside the existing Next.js app, no new paid service |
| Mini app | Browse cards inside Farcaster | full spec above | later, only after the first two exist | build time |

ZAOOS already renders images server-side two ways, so a web card page needs no new machinery: `src/app/og/route.tsx` uses `ImageResponse` from `next/og`, and `src/app/api/music/share-card/route.ts` builds an SVG share card with Zod-validated, XML-escaped fields. A card page extends those, it does not add a third renderer.

Physical stays as 2529 left it: UPrinting, re-quote at the real quantity, only after a digital card is approved.

### (d) The card design creator

**What it does (v1):** pick a template, drop in an image, fill fields, see the card update live, export PNG (portrait and 3:2). Nothing uploads: the image stays in the browser and the PNG is saved to the person's device. Publishing a card is a separate, approval-gated step.

**What a template is:** a frame image designed by Brian or the artist (PNG or SVG) plus a small JSON file naming the slots - the photo box, each text field with its position, font, size and colour, and the credits line, which is mandatory and cannot be hidden. Code places content into the slots. It does not draw the frame.

#### OSS survey (licences read from the GitHub and npm APIs, 2026-10-19)

| Project | Licence | Stars | Last push | Fit |
|---|---|---|---|---|
| fabricjs/fabric.js | MIT | 31,505 | 2026-10-17 | Full canvas object model. Strong, but more editor than v1 needs. |
| konvajs/konva + react-konva | MIT (both; konva's API field reads NOASSERTION, its LICENSE file reads MIT) | 14,876 / 6,436 | 2026-10-15 | Best upgrade path: React bindings, made for "design editors". |
| salgum1114/react-design-editor | MIT | 1,710 | 2026-10-11 | A general design editor; heavy to strip down to one card. |
| layerhub-io/layerhub-io | MIT | 106 | 2023-10-23 | Small, Canva-style; low adoption and no push in three years. |
| Polotno SDK | npm: "SEE LICENSE IN LICENSE.md"; pricing page: "One commercial license ... from low hundreds to 20-30k+" | n/a | n/a | Commercial. Out: money is Zaal's and it is not open source. |
| tldraw/tldraw | tldraw license: free in development, production needs a licence key | 50,994 | 2026-10-19 | Out for a public tool: production terms. |
| excalidraw/excalidraw | MIT | 134,199 | 2026-10-19 | A hand-drawn whiteboard. Wrong shape. |
| scaleflex/filerobot-image-editor | MIT | 1,923 | 2026-06-16 | Photo crop/filter editor; could serve the crop step only. |
| nhn/tui.image-editor | MIT | 7,671 | 2023-11-20, **archived** | Out: archived. |
| Investigamer/cardconjurer | **no licence** | 244 | 2024-08-06 | The closest shape (a card maker), but no licence means no right to reuse. Out. |
| hackjutsu/HeroCards | MIT | 146 | 2018-08-03 | A playing-card maker; stale. Reference only. |
| bubkoo/html-to-image | MIT | 7,256 | 2026-05-28 | DOM to PNG. Not needed if the card is drawn on a canvas. |
| vercel/satori | MPL-2.0 | 14,112 | 2026-10-19 | Already inside `next/og`, which ZAOOS uses. Server-side only. |

GitHub searches for "card maker", "trading card creator" and "card generator template" (sorted by stars) surfaced mostly game-specific makers (Yu-Gi-Oh!, Magic, Here To Slay) and media title cards; none is a general template-plus-fields tool with a licence that fits.

#### Build vs adopt: build, thin, on native Canvas

Running the code-restraint ladder: no surveyed editor fits as-is (commercial, licence-keyed, unlicensed, archived, or the wrong shape), and the job is narrow. The browser's own Canvas 2D API draws the frame, clips the photo, writes the text and exports a PNG (`canvas.toBlob`). That is rung 4, a native platform feature, and it means **no new dependency** for v1. If free-form drag, resize and layers are wanted later, `react-konva` (MIT) is the adopt-path; it is a new dependency and therefore an ask-first.

Inventory before recommending this: a GitHub code search of the `bettercallzaal` and `ZAODEVZ` orgs on 2026-10-19 for `react-konva`, `fabric`, `html-to-image` and "trading card", plus a repo-name scan for card/creator/design/studio/template/share, found no card editor. The nearest thing is `bettercallzaal/CustomPDFCreator` (public, MIT, React 18 + Vite, one component `src/PDFBuilder.jsx`), a PDF builder rather than an image template tool. The searches did not open every hit, and the code search returned nothing at all for `ZAODEVZ`, which may mean no matches or may mean the search does not index that org; so read this as "not found", not "proven absent".

#### Repo home: ZAOOS `/cards`, graduate later

- ZAOOS is the lab, and the CLAUDE.md lab model says things are prototyped there and graduate to their own repo, domain and DB once ready for production, public sharing and new users.
- The share-image plumbing (`next/og`, the SVG share-card route), Zod conventions, Farcaster mini app work and the Supabase stack are already in ZAOOS.
- The WaveWarZ data lives in a **private** repo. A card page should never pull that repo in; it should take a small, per-artist, approved export (name, the fields in the table above, the as-of date). That keeps the private record private and makes the approval step the gate on what is public.
- Alternatives, for Zaal: the public `wavewarzapp` repo (WaveWarZ cards only), or a new `zao-cards` repo now (cleaner, but nothing to share yet).

### How a card goes from draft to public (proposed)

1. Someone makes a draft in the creator using a Brian- or artist-made template. It stays on their device.
2. The draft goes to the artist through a per-artist approval link (the 2529 / ZAOstock claim-token pattern).
3. The artist approves, or edits fields and approves. Only then does an image get stored and a `/cards/<slug>` page exist.
4. Posting, minting, selling or printing the card is a separate decision, Zaal's.

## Questions only Zaal can answer

1. ANSWERED 2026-10-20: ZAO first, ZAO Festivals artists, continuing ZAO CARDS (zao.cards). Still open: which festival roster first (ZAO-PALOOZA artists without a card yet, ZAO-CHELLA, or the ZAOstock 2026 acts), and which names on it.
1b. Do new cards join the existing Manifold collection under the ZAO wallet (on-chain, card by card), or ship as approved PNGs first and join later?
1c. The ZAO-PALOOZA card designs: who made them, and are the source files available? A new template should match them, and the designer gets credit.
2. Does a WaveWarZ card show a rating at all, and if so which one? The current rating basis is labelled undecided by its own tool.
3. Does any SOL figure go on a public card?
4. Brian's scope and timing for the first template, and how he wants his credit line to read. (His facts.)
5. Repo home: ZAOOS `/cards` (recommended), `wavewarzapp`, or a new repo.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Approve or redirect this doc | @Zaal | Decision | before any build |
| Answer questions 1-5 above | @Zaal | Decision | before the v1 PR |
| First card template (frame + slot list) | Brian (North Creek), via @Zaal | Design | after approval |
| v1 creator PR: `/cards/create`, native Canvas, one template, PNG export, no upload | cards lane | Build (PR-only) | after approval |
| Per-artist approval link and `/cards/<slug>` page | cards lane | Build (PR-only) | after v1 and after an artist says yes |

## Sources

- [2529 ZAO Artist Trading Cards: Feasibility](../2529-zao-artist-trading-cards/) - precedent, pricing, consent rule [FULL - read from origin/main 2026-10-19]
- [1692 WaveWarZ Farcaster Mini App Spec](../../technology/1692-wavewarz-farcaster-mini-app-spec/) - per-battle share card [FULL - read]
- `bettercallzaal/wavewarz-protocol` (private), origin/main 2026-10-19: `data/chain-snapshot-2026-09-06/fighter-cards.json`, `tools/fighter-cards.py`, `spec/WBS-1-PRD-v1.0.md` sections 35 and 37, `spec/CATALOGUE-EXPORT.md` [FULL - method: `git show origin/main:<path>`, counts computed with a JSON parse of the file]
- [zao.cards](https://zao.cards) - redirects to the Manifold page "ZAO CARDS - ZAO-PALOOZA EDITION" by @the-zao [PARTIAL - method: curl -L, title and meta tags read from the raw HTML on 2026-10-20; the card list is JavaScript-rendered and was not read]
- `research/_archive/nexus-versions/ZAONEXUS-current/links.ts` - the attabotty.zao.cards per-artist pattern [FULL - git grep of origin/main]
- `ZAODEVZ/ZAOstock` `src/lib/artists.ts` - `PublicArtist` fields [FULL - method: GitHub contents API]
- ZAOOS `src/app/og/route.tsx`, `src/app/api/music/share-card/route.ts` - existing renderers [FULL - read]
- [Farcaster Mini Apps specification](https://miniapps.farcaster.xyz/docs/specification) - 3:2 embed image, 1200 x 630 hero image [FULL - method: curl + HTML strip, quoted from page text]
- [Polotno pricing](https://polotno.com/pricing) - commercial licence wording [FULL - method: curl + HTML strip]; npm registry `polotno` latest 4.16.1 licence field [FULL - registry JSON]
- GitHub REST API `repos/<owner>/<repo>` for each project in the survey table (stars, licence SPDX id, last push, archived) and `repos/<owner>/<repo>/license` for konva and tldraw [FULL - method: `gh api`, raw JSON and raw LICENSE text, 2026-10-19]
- npm registry `latest` for fabric 7.4.0, konva 10.9.0, react-konva 19.3.2, html-to-image 1.11.13, satori 0.63.0, @resvg/resvg-js 2.6.2 (licence fields) [FULL - registry JSON]
- `polotno.com/docs/license` [FAILED - HTTP 404]
- Zaal's answer on which cards come first: his reply to this lane in the Orca cards terminal, 2026-10-20, quoted verbatim in (b)
- Zaal's rulings cited: no AI-made public design (2026-10-08, vault decisions item 53 and item 61), no co-ownership of ZAO IP (2026-10-14, item 217), ranked-battle and self-battle rules (2026-10-10, 2026-09-12, as quoted inside `tools/fighter-cards.py`)
