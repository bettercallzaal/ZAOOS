---
topic: business
type: build-spec-research
status: research-complete, awaiting Zaal approval before any build
last-validated: 2026-10-20
related-docs: 2689, 2529
original-query: "i actually wanna start designing a card builder UI for Artists thats the most importnat thing and giving them as much oiptions adn functionality as they can for their cretor its essietnally an NFT creator tool but speicifally for getting them on a ZAO trading card, lets reserach" (Zaal, 2026-10-20)
tier: STANDARD
---

# 2690 - ZAO Card Builder: an Artist-Facing Card and NFT Creator

> **Goal:** Design the tool an artist uses to make their own ZAO trading card, with as many options as possible. The output is a finished card image plus NFT-ready metadata, so an approved card can join the ZAO CARDS collection.

This doc builds on [2689](../2689-wavewarz-zao-digital-cards-and-card-creator/), which covered card data, formats and the open-source editor survey (ZAOOS PR #4042, open as of 2026-10-20). 2689 recommended a thin creator with fixed slots. Zaal's 2026-10-20 direction changes that: the builder is now the main product, it is for artists, and it should give them as much control as possible. This doc revises the 2689 creator recommendation to match.

## What changed since 2689

| 2689 said | 2690 says | Why |
|---|---|---|
| A thin creator on native Canvas 2D, no new dependencies | A full layer editor on `react-konva` (MIT), which is a new dependency and so an ask-first | "As much options and functionality as they can" needs layers, drag, resize, rotate and undo. Hand-building all of that on raw canvas would rebuild what Konva already does. |
| Templates come from a designer; code fills the slots | Artists design their own card on a ZAO frame, and can start from a blank one | The artist is the designer. That is the strongest answer to the no-AI rule: the art is theirs. |
| Output is a PNG | Output is a PNG plus a metadata JSON that follows the ERC-721/1155 schema | Zaal: "essentially an NFT creator tool". |
| Which cards first: open | **ZAO-PALOOZA artists without a card yet** | Seat auto-proceeded on option A, 2026-10-20, and the logged choice can be overridden. Zaal had already said "ZAO first ZAO Festivals" on 2026-10-20. |

## Hard rules (carried from 2689, still binding)

1. **No AI-made visuals.** The builder has no generate, restyle, upscale, "magic fill" or AI background removal. Artists bring their own images. Plain adjustments the artist controls by hand (crop, rotate, brightness, contrast, saturation) are not generation and are allowed. Zaal ruled this on 2026-10-08. As of 2026-10-20, Brian (North Creek) leads design for North Creek branding and ZAO Festivals sponsorships, and Zaal approves the rest. ZAO frame designs therefore need Zaal's approval.
2. **The artist approves their own card,** and nothing is public before that.
3. **Visible credits on the card:** the artist, the photographer and the frame designer. "Unknown" is written out when a credit is not known; the line is never just left off.
4. **The builder never mints, lists, prices or posts.** It produces files and a draft. Adding a token to the ZAO CARDS collection is an on-chain action from the ZAO wallet, and it is Zaal's, card by card.
5. **Frames are original.** Card Conjurer, the best-known fan card maker, says it was forced offline when "Wizards of the Coast served the original creator and webhost of the site with Ceas and Desist paperwork" (its README). ZAO frames must not imitate any branded card game's layout or marks.
6. **Contributed frames and templates become ZAO-owned,** credited as "designed by". Nothing is co-owned (Zaal, 2026-10-14).

## The builder, feature by feature

Grouped by what the artist is doing. The **v1** column is the first PR; everything else is v2 or later. The list is long on purpose, because Zaal asked for maximum options; the v1 column is what keeps the first PR shippable.

### 1. Start

| Feature | v1 | Notes |
|---|---|---|
| Sign in with Farcaster | yes | ZAOOS already ships `@farcaster/auth-kit` and `@farcaster/miniapp-sdk` (package.json). The draft is tied to the artist's FID. |
| Choose a ZAO frame (ZAO-PALOOZA style, festival editions, blank) | yes | Frames are files plus a slot list, designed by people (rule 1). |
| Start from a blank card | yes | For artists who want full control. |
| Import a previous card as a starting point | v2 | |

### 2. Art

| Feature | v1 | Notes |
|---|---|---|
| Upload their own photo or artwork (PNG, JPG, WebP) | yes | The image stays in the browser until the artist submits. |
| Crop, zoom and rotate inside the art window | yes | `react-easy-crop` (MIT, 6.2.4 on npm) or Konva's own transformer. |
| Several image layers (logo, sticker, second photo) | yes | Konva layers. |
| Manual adjustments: brightness, contrast, saturation, blur | v2 | Konva filters. Artist-controlled, not generated. |
| Background removal | no | Usually done with an AI model, so it is out unless Zaal rules otherwise (question 4). |

### 3. Text and stats

| Feature | v1 | Notes |
|---|---|---|
| Name, title line, one-line bio | yes | |
| Free text boxes anywhere on the card | yes | |
| Fonts from a curated open-licence set | yes | google/fonts README: "Most of the fonts in the collection use the SIL Open Font License, v1.1" and "always read the license for every font". Only fonts whose licence file has been checked go in the list. |
| ZAO stat block (festival played, year, genre, city, ZAO moment) | yes | Each value is entered by the artist or comes from an existing record (the ZAOstock `PublicArtist` fields in 2689). |
| WaveWarZ stat block (record, streak, upsets) | v2 | Fields per 2689. Rating and SOL figures stay off until Zaal decides (2689 question 2). |
| Text colour, size, alignment, outline, shadow | yes | |

### 4. Style

| Feature | v1 | Notes |
|---|---|---|
| Frame colourways (ZAO navy and gold as the default, plus alternates) | yes | |
| Border, corner radius, background colour or gradient | yes | |
| Holo or foil look in the web preview (tilt and glare) | v2 | Reference: `simeydotme/pokemon-cards-css`, which is **GPL-3.0**. Its CSS cannot be vendored into ZAOOS without GPL obligations, so ZAO writes its own effect and credits that project as inspiration. The same author's `hover-tilt` shows MIT on GitHub but MPL-2.0 on npm 1.0.0; check which applies before using it. |
| Rarity or edition badge (for example "PALOOZA 1 of 1") | yes, as a label only | It describes the card. It does not set supply or price, which stay Zaal's. |

### 5. Back of the card

| Feature | v1 | Notes |
|---|---|---|
| A card back with a longer bio, credits, links and a QR to the artist's page | v2 | UPrinting sells trading cards printed "Front Only" or "Front and Back" at 2.5" x 3.5", so a back is useful for physical cards too. |

### 6. Music on the card

| Feature | v1 | Notes |
|---|---|---|
| A song snippet attached to the card | v2 | OpenSea's `animation_url` accepts "GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, and OGA", and "It can also point to an HTML page". A ZAO music card can therefore carry the artist's own track. Only a track the artist owns and has cleared, credited on the card (`credit-attribution.md`). |

### 7. Credits (mandatory, cannot be hidden)

Artist, photographer and frame designer, with "unknown" written out when a credit is not known (rule 3). The builder refuses to export without the credit line.

### 8. Preview and export

| Feature | v1 | Notes |
|---|---|---|
| Live preview while editing | yes | |
| Undo and redo | yes | Konva state snapshots. |
| Export card PNG (portrait, 2.5:3.5 ratio) | yes | Matches the 2.5" x 3.5" printed trading card (UPrinting). |
| Export 3:2 share PNG for Farcaster | yes | 2689: Farcaster embeds "Must be 3:2 aspect ratio". |
| Export a 4:5 NFT image | yes | EIP-721 suggests images "at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive". A 2.5:3.5 card is narrower than 4:5, so the NFT version pads the card onto a 4:5 canvas instead of cropping it. EIP-721 words this as "Consider", a recommendation, not a requirement. |
| Export a metadata JSON | yes | See the next section. |
| Print-ready export with bleed | v2 | The bleed size has not been looked up for this doc. Get it from the print vendor's file spec before building. |

### 9. Save and submit

| Feature | v1 | Notes |
|---|---|---|
| Save a draft and come back | yes | v1 can keep the draft in the browser. Saving it on the server needs a table, and a schema change is an ask-first. |
| Submit for review | yes | The artist confirms the card and the credits. This is the artist's approval (rule 2). |
| ZAO review queue | v2 | Zaal or a reviewer he names sees submitted cards, approves or asks for changes. |
| Mint into ZAO CARDS | never in the builder | Zaal's, from the ZAO wallet (rule 4). |

## NFT metadata the builder writes

The builder writes the token metadata JSON so that an approved card is ready to mint without re-entering anything. These fields come from the standards, as fetched on 2026-10-20:

- **EIP-721** "ERC721 Metadata JSON Schema": `name`, `description`, `image`.
- **EIP-1155** adds the `{id}` substitution rule: "If the string {id} exists in any URI, clients MUST replace this with the actual token ID in hexadecimal form".
- **OpenSea "Media and traits"**: `animation_url`, `attributes`, `background_color` ("A six-character hexadecimal background color without a leading `#`") and `external_url`. Each attribute has a `value`, an optional `trait_type`, and an optional `display_type` of `number`, `date` ("Unix time in seconds"), `boost_number` or `boost_percentage`. Also: "A numeric value wrapped in quotes is treated as a string."

Proposed ZAO card attributes:

| trait_type | value | display_type |
|---|---|---|
| Artist | artist name | none (string) |
| Edition | "ZAO-PALOOZA" or another festival | none |
| Festival year | 2024 | `number` |
| Genre | from the artist | none |
| City | from the artist | none |
| Photographer | name or "Unknown" | none |
| Frame designer | name | none |
| Card made | Unix seconds | `date` |

Where metadata lives: OpenSea's "Metadata storage" page lists a hosted URL, IPFS (`ipfs://`), Arweave (`ar://`) or on-chain, and warns "Onchain metadata increases gas costs". Which one ZAO CARDS uses today was not measured here (question 3).

## How a card reaches ZAO CARDS

The existing collection is on Manifold (2689: zao.cards redirects to "ZAO CARDS - ZAO-PALOOZA EDITION" by @the-zao). What Manifold's docs say, fetched as markdown from docs.manifold.xyz on 2026-10-20:

- The **Manifold Client SDK** is for buyers' storefronts, not for creating tokens: "Custom storefronts - Fetch products, check allocations, verify allowlists ... Trusted checkout flows". So the SDK is not how an artist's card gets created.
- Creator Core contracts expose `mintBaseNew(address[] to, uint256[] amounts, string[] uris)` for ERC-1155, which "Mints a completely new token with the given amount **without** an extension".
- Manifold Studio is the web app the collection's owner uses.

So the clean split is: **the builder makes the image and the metadata JSON; the ZAO wallet creates the token** in Manifold Studio or through Creator Core. The builder never holds a key and never sends a transaction. This doc did not check whether the ZAO CARDS contract is ERC-721 or ERC-1155, which chain it is on, or who its admins are (question 3).

## Engine and repo home

- **Engine: `react-konva` (MIT, 6,436 stars, pushed 2026-10-15) on `konva` (MIT).** It does layers, a transformer for drag, resize and rotate, filters, and canvas export. The alternative is `fabric` (MIT, 31,506 stars, pushed 2026-10-20), which is just as capable but not React-first. Either one is a new dependency, which is an ask-first under the repo rules, so it is question 5 below. Commercial editors (Polotno), licence-keyed ones (tldraw) and unlicensed ones (Card Conjurer) were ruled out in 2689 and stay out.
- **Home: ZAOOS `/cards/create`,** as 2689 recommended. Farcaster sign-in, Supabase, Zod conventions and the share-image renderers are already there. It graduates to its own repo when it is public and attracting artists.
- **Mobile first.** Artists are on phones, and the dark theme is the default, per the repo rules.

## Lessons from existing card makers

- `lauqerm/ygocarder` puts UI speed first: "Most of the changes can be made with just a single click or keystroke". It also credits its template artists by name at the top of its README, which is the model for frame credits.
- `hackjutsu/HeroCards` (MIT) builds cards from a JSON description of each character. That is the same shape as the metadata JSON here, so a card can be rebuilt from its own metadata.
- Card Conjurer: see rule 5. It also has no licence on GitHub, so it cannot be reused.

## Questions only Zaal can answer

1. Approve this direction, a full artist-facing editor, over 2689's thin slot creator?
2. Who designs the ZAO frames, starting from the ZAO-PALOOZA look? You approve them; who makes them, and do the ZAO-PALOOZA source files still exist?
3. ZAO CARDS facts: which chain, ERC-721 or ERC-1155, which wallet is admin, and where its metadata lives today. These are your facts, or a read of the contract you approve.
4. Background removal: allowed or not? It is usually an AI model, so it is out by default.
5. Approve adding `react-konva` and `konva` (new dependencies)?
6. Server-side drafts need a Supabase table (a schema change). Approve that for v1, or start with drafts kept only in the browser?

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Answer questions 1 to 6 | @Zaal | Decision | before the v1 PR |
| First ZAO frame, matched to the ZAO-PALOOZA cards | designer Zaal names | Design | after question 2 |
| v1 builder PR: `/cards/create`, the v1 rows above, exports PNG and metadata JSON, nothing uploaded or minted | cards lane | Build (PR-only) | after questions 1 and 5 |
| Reach out to the first ZAO-PALOOZA artists | @Zaal | Outreach | after v1 works |

## Sources

- [2689](../2689-wavewarz-zao-digital-cards-and-card-creator/) and [2529](../2529-zao-artist-trading-cards/) [FULL - ZAOOS docs, 2689 read on its PR branch]
- [EIP-721](https://eips.ethereum.org/EIPS/eip-721) - metadata schema and the image size and aspect advice [FULL - method: curl + HTML strip, quoted from page text]
- [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155) - `{id}` substitution [FULL - method: curl + HTML strip]
- [OpenSea Media and traits](https://docs.opensea.io/docs/media-and-traits.md) - attributes, display types, `animation_url` formats [FULL - method: curl of the .md page]
- [OpenSea Metadata storage](https://docs.opensea.io/docs/metadata-storage.md) - IPFS, Arweave, on-chain [FULL - method: curl of the .md page]
- [Manifold docs index](https://docs.manifold.xyz/llms.txt), [Client SDK readme](https://docs.manifold.xyz/client-sdk/readme.md), [ERC1155 functions](https://docs.manifold.xyz/manifold-for-developers/smart-contracts/manifold-creator/contracts/creator-core/erc1155-functions.md) [FULL - method: curl of llms.txt and .md pages]
- [docs.manifold.xyz](https://docs.manifold.xyz/), [studio.manifold.xyz](https://studio.manifold.xyz/), [help.manifold.xyz](https://help.manifold.xyz/) [FAILED - JavaScript-rendered, under 500 bytes of text; used the .md pages above instead]
- [ZORA docs llms.txt](https://docs.zora.co/llms.txt) - now "the ZORA Coins Protocol - a protocol for creating and trading ERC-20 media coins on Base", so not a trading-card fit [FULL - method: curl]
- [UPrinting trading cards](https://www.uprinting.com/trading-cards.html) - 2.5" x 3.5", front only or front and back [FULL - method: curl + HTML strip]
- GitHub REST API `repos/<owner>/<repo>` and READMEs for react-konva, fabric.js, react-easy-crop, pokemon-cards-css, hover-tilt, zora-protocol, creator-core-solidity, thirdweb js, google/fonts, HeroCards, ygocarder, cardconjurer [FULL - method: `gh api`, raw JSON and README text, 2026-10-20]
- npm registry `latest` for react-easy-crop 6.2.4 (MIT) and hover-tilt 1.0.0 (MPL-2.0) [FULL - registry JSON]
- ZAOOS `package.json` - the Farcaster auth and mini app packages, viem and wagmi present, no konva or fabric [FULL - grep]
- Zaal's direction, 2026-10-20, in the Orca cards terminal (quoted in the frontmatter); the seat's roster auto-proceed, option A, 2026-10-20, relayed to this lane; Zaal's rulings of 2026-10-08 (no AI visuals; Brian's scope narrowed 2026-10-20) and 2026-10-14 (no co-ownership)
