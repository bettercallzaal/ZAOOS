# 2269 - Ignite Radio: teardown of a Sui music platform

**Researched:** 2026-08-12
**Tier:** DEEP
**Type:** STANDALONE
**Target:** [igniteradio.xyz](https://igniteradio.xyz/)
**Working repo:** [bettercallzaal/zignite](https://github.com/bettercallzaal/zignite) -
PR #1 carries the same finding plus raw API and on-chain snapshots under `evidence/`.

**Related:** 2197 (web3 music monetization post-mortem - this is a concrete case study
for that doc's verdict), 2267 (WaveWarZ surface map - Ignite Radio links out to
wavewarz.com), 112 (Audius API deep dive - 42% of Ignite's catalogue is re-hosted Audius).

## One-line answer

Ignite Radio is a real, working indie radio platform with roughly a dozen genuinely active
artists, an audience that is mostly those same artists plus the operator's own accounts,
almost no revenue, and a tipping feature that does not work in production.

Researched in two passes on 2026-08-12. The second pass found their per-station stats
endpoint, which **corrected the engagement numbers upward** and sharpened the audience
finding considerably. Corrections are marked inline rather than quietly overwritten.

## How this was grounded

The homepage is a JS shell, so everything below came from one of four sources, never
from `WebFetch`:

| Method | What it gave |
|---|---|
| Headless browser (`/browse`) | Rendered DOM, live click-through of the tip flow, pricing pages |
| Their own public REST API (`curl`) | `/api/stations`, `/api/profiles`, `/api/stats/:id`, `/api/stations/:id/fanclub`, `/api/likes/trending`, `/api/health` |
| Their shipped JS bundle, all 71 chunks (`curl` + read) | Exact tipping source, full API surface, hardcoded treasury addresses |
| Public chain RPC (`curl`) | Sui, Base, Ethereum, Polygon, Solana treasury state |

Raw snapshots are committed under `evidence/`.

**Scope limit I held to:** only public, unauthenticated endpoints were read. Their admin
routes were found in the bundle and deliberately not probed, and no account was created to
reach auth-gated surfaces. Testing someone else's access controls uninvited is not
research, and a few extra data points are not worth doing it.

Every claim below is marked **FULL** (directly observed) or **PARTIAL** (strongly
supported but with a stated gap). Nothing here is inferred from a summary.

---

## Q1. What the app looks like past the JS shell - ANSWERED (FULL)

A complete product, not a landing page. Rendered navigation exposes: Studio, Explore
Directory, Library (history / watch later / liked), Music Streams, Genre Playlists, Live
Radio (FM), Shoutouts, Advertise, Instrumentals, CPM Collabs, Podcasts, News, Audiobooks,
Live Rooms, Embed Builder, and a rewards page.

The rendered hero does not match the meta description this repo previously quoted. The
meta tagline says "tip your favorites". The rendered hero says:

> Sui's #1 Hit Music Station
> Launch live stations, archive broadcasts, and reach listeners worldwide from the browser.

And the mid-page pitch is:

> Curate. Sync. Monetize.
> Ignite Radio is the bridge between decentralized audio and global streaming. Curate your
> sound on Sui, grow a loyal membership, and sync your playlists to Spotify and Apple Music
> with one click.

Worth noting: tipping has been demoted from the pitch. The visible product story is now
curation, memberships and distribution.

Backend is not decentralised. `GET /api/health` returns:

```json
{"status":"ok","database":"sqlite","uptime":82325.128475484,"lastCrashAt":"2026-08-02T15:54:07","crashes24h":0}
```

SQLite, one server, audio served as plain mp3 files from `/uploads/` and `/audio/`. No
Walrus, no IPFS, no on-chain storage.

## Q2. Tipping mechanics - ANSWERED (FULL on the code, PARTIAL on the final render)

**This was a priority question. The finding is that the feature is architecturally trivial
and currently non-functional.**

### What the code does

From the shipped chunk `assets/g2-TipArtistModal-BsZ8VL8Q.js`, deminified:

```js
const MIST_PER_SUI = 1e9, PRESETS = [.1, .5, 1, 5];
const amountMist = Math.round(amount * MIST_PER_SUI);

const tx = new TransactionBlock();
const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountMist)]);
tx.transferObjects([coin], tx.pure(recipient));
const res = await signAndExecute({ transaction: tx });
```

That is a native SUI coin transfer and nothing else.

- **No smart contract.** The only `moveCall` anywhere in the entire bundle is
  `0x1::option::none/some`, which is the Mysten SDK's own serialisation helper. Ignite
  Radio has deployed no Move package. There is no tipping protocol - there is a send button.
- **Custody: none.** Funds go wallet-to-wallet. Ignite Radio never holds them.
- **Platform fee: zero.** No fee, bps, or split logic exists in any chunk. Grepping for
  `platformFee|feeBps|feePercent|commission|royaltySplit|takeRate` returns nothing.
- **Cost per tip:** Sui gas only, paid by the sender. The UI states
  "Transaction on Sui Mainnet - Gas paid by you".
- **Amounts:** presets 0.1 / 0.5 / 1 / 5 SUI, default 0.5, plus a custom field.
- **Recipient:** a SuiNS name if the station has one, otherwise the station's `owner_id`.
- Success links to `suiscan.xyz/mainnet/tx/{digest}`, so this is mainnet.

### Why it does not work

The recipient is bound at the single call site in `assets/g2-Radio-*.js` as:

```js
recipientAddress: station?.owner_id
```

`owner_id` is never returned by the public API. It is absent from both
`GET /api/stations` (all 32 records) and `GET /api/stations/:id`. Confirmed live: the
rendered DOM on `/ignite` contains no Sui address at all, and `/api/stations` is the only
station source the page fetches.

The modal gates on `recipient.startsWith("0x") && recipient.length >= 42`. With
`owner_id` undefined that check fails, and the modal falls to its error branch:

> This station owner hasn't linked a Sui wallet yet.

**PARTIAL:** I confirmed the API never returns `owner_id` and no address exists in the
DOM. I did not connect a wallet, so I did not visually observe that final branch - the
modal renders the "Connect your Sui wallet" state first for a logged-out visitor. The
code path is unambiguous, but the last hop is reasoned, not seen.

### Two secondary defects worth recording

1. The address check `length >= 42` is an Ethereum-length test. Sui addresses are 66
   characters. A 42-character EVM address would pass validation and the tip would be sent
   to an address nobody on Sui controls.
2. Because tips are bare transfers with no contract and no memo, **the platform cannot
   observe its own tipping.** Nothing links a transfer to an artist, a track, or a play.
   This is why `totalEarnings` is 0 for every profile and structurally always will be.
   They have no tip analytics, no royalty splits, and no on-chain proof of support.

## Q3. Where the catalogue comes from - ANSWERED (FULL)

356 tracks across 32 stations. Classified by file path:

| Source | Tracks | Share |
|---|---|---|
| Creator uploads (`/uploads/`) | 161 | 45% |
| Audius imports (`/uploads/audius-*`, ids prefixed `aud_`) | 149 | 42% |
| Seeded or bundled (`/audio/`) | 46 | 13% |

354 of 356 are mp3.

Nearly half the catalogue is **re-hosted Audius audio** - copied onto Ignite's own server,
not streamed or embedded from Audius. That is a different act from embedding and is worth
flagging, though I am not making a legal call on it.

Rights are self-attested by the uploader. The Terms say creators grant Ignite "a
non-exclusive, worldwide license to host, stream, cache, transcode, and display" and
represent that they hold the rights. Only 3 of 32 stations carry any rights metadata at
all; where present it is substantive, e.g. publisher name, IPI numbers, DistroKid as
distributor, and MLC / SoundExchange registration flags.

Nobody "cleared" the catalogue in any centralised sense. It is an upload platform with a
representation-and-warranty clause.

## Q4. Real usage - ANSWERED (FULL)

**This was the other priority question. Supply is real. Demand is not.**

### Supply looks genuine

- 32 stations, created steadily from 2026-05-06 through 2026-08-12, including one created
  the day of this research.
- 53 profiles: 5 in May, 22 in June, 22 in July, 4 in August.
- 356 tracks. Only 3 stations are empty.
- Station owners are real independent artists with real metadata.

This is not a landing page and not a ghost town of bots.

### Demand: an audience of about a dozen, half of them staff

A second research pass found a per-station stats endpoint, `GET /api/stats/:id`, which is
unauthenticated and returns real engagement counters. Swept across all 32 stations:

| Metric | Platform total |
|---|---|
| Likes | 385 |
| Unique listeners (summed per station) | 119 |
| Engagement events | 825 |
| Fanclub memberships | 72 |

The listener figure is **summed per station, so it double-counts** anyone who visited more
than one. It is an upper bound on distinct people, not a headcount.

**The fanclub data is the sharpest signal, because members are named.** Those 72
memberships resolve to just **13 distinct people**. The distribution:

| Account | Clubs joined |
|---|---|
| `harmonyhub` (operator) | 23 |
| `sweetharmonyhub` (operator) | 11 |
| `stormbournedesigns` | 10 |
| `fellenz` | 7 |
| `mozaycalloway` | 7 |
| everyone else (8 accounts) | 14 combined |

The operator's own two accounts account for **34 of 72 memberships, 47%**. The rest are
station owners joining each other's clubs. This is the signature of an empty network:
creators cross-subscribing, with essentially no outside audience behind them. The operator
runs at least four accounts in total - `harmony_hub`, `harmonyhub`, `sweetharmonyhub` and
`igniteradio`.

Other signals:

- Every one of the 53 profiles reports `followers: 0, following: 0, contentCount: 0,
  totalEarnings: 0`. The `totalEarnings` zero is structural, per Q2 - the backend cannot
  see tips.
- 1 of 53 profiles is verified.
- `GET /api/stations/:id/geo` returns `{"countries":[]}` for the stations checked - no
  geographic listener data has accumulated.
- `/api/global-signals` returns `[]`.
- No station has ever been live: `is_live` is false for all 32.

### CORRECTION to the first pass, and a counter that contradicts itself

The first pass reported "28 total likes platform-wide, all time". **That was the wrong
counter.** It came from `GET /api/likes/trending`, which is a different and much sparser
dataset than the per-station `likes` in `/api/stats/:id`.

The two disagree by more than an order of magnitude, and not by a constant factor:

- `/api/likes/trending?limit=500` returns 29 rows totalling 31 likes.
- Per-station `/api/stats/:id` likes sum to 385.
- Velvet Rebellion reports **126 likes** in stats and has **zero** tracks appearing in
  trending at all.

I could not determine from outside which counter is authoritative, and I am not guessing.
Both are reported above. The honest reading is that **385 is the more generous figure and
still small**, and that their own engagement counters are mutually inconsistent - which is
itself a finding about data quality.

One further caveat: my own session contributed to these numbers. Loading `/ignite` played
audio, awarded points, and registered listener events. The counts include me.

### Money, measured on-chain

Their payment page hardcodes treasury addresses per chain. All were queried directly:

| Chain | Address | State |
|---|---|---|
| Sui | `0x868bd552...c7f34e2f` | 3.6995 SUI balance; 14 lifetime txs, 8 of them self-sends; 4 counterparties; last activity 2026-06-26 |
| Ethereum | `0x4b561706Ad0157c64e0F000e2b942aEb1de47e37` | nonce 0, balance 0 |
| Base | same address | nonce 0, balance 0, USDC 0 |
| Polygon | same address | USDC 0 |
| Solana | `2Emhnhn3KcEhaQFaWAZstKL91psYwQs2XTe56H5qTmeQ` | 0.2399 SOL, 1 signature |

The Sui treasury has received roughly 32 SUI gross from outside across its whole life, and
has been idle for about seven weeks. The EVM address has **never sent a transaction on any
chain**, despite the UI marking Ethereum, Base and Polygon as "live" (and Monad as "beta").

Tip volume specifically is **unmeasurable** - see Q2. Tips are indistinguishable from any
other SUI transfer. This is a real limit on the question, not a gap in the research.

### Other health signals

- The Discord invite in the footer and the "Help & Discord" nav link
  (`discord.gg/igniteradio`) is **dead**. Discord's own API returns
  `{"message": "Unknown Invite", "code": 10006}`.
- The X account `@igniteradio_sui` could not be confirmed to exist. Logged-out X and the
  syndication endpoint both returned nothing. **Marked unverified** - logged-out X blocks
  are common enough that I will not call it deleted.
- Their bundle points at `https://fullnode.mainnet.sui.io:443`, whose JSON-RPC is now
  deprecated and returns "Method not found". The tip path signs through the user's wallet
  so this may not break tipping, but any direct reads they do against that endpoint are
  broken.
- `/ignite` polls `/api/stations` seven times per page load with cache-busting query
  params, re-fetching the full 124 KB payload each time.

### "Spark" is not a token

The rewards system is off-chain points in SQLite. `GET /api/points` returns tiers
(Spark, Ember, ...) and awards 25 points for a daily visit. No coin type, no package, no
on-chain component anywhere in the rewards chunk.

## What they charge - ANSWERED (FULL)

Their whole monetization surface, quoted from the pages:

- **Advertising:** "Record or upload your spot. For $10 it runs in the Live Mix rotation
  for 30 days."
- **Shoutouts:** "Record or upload a short shoutout. For $2 it airs on the Ignite Community
  Channel."

Payment is crypto or PayPal (`/api/paypal-orders` exists alongside the chain rails).

Every ad slot currently rendered on the advertise page is a placeholder - "Your Business
Here", "Your Flyer Here", "Blaze designs it for you". No real advertiser is running.

Set against the treasury numbers below, this is the entire business: $2 and $10 line
items, of which almost none have been sold.

## The API surface, and one security note

The app's endpoints were enumerated from the shipped bundle rather than guessed. Beyond
the read endpoints already cited, it includes `/api/import/audius` and
`/api/import/audius/preview?handle=` (so Audius import is a first-class product feature,
not an ad-hoc backfill), `/api/stations/:id/fanclub` and `/fanclub/join`,
`/api/listener/heartbeat` and `/listener/disconnect`, `/api/reels/generate` and
`/reels/candidates`, `/api/stations/:id/geo`, `/api/shoutouts`, `/api/ads`,
`/api/paypal-orders`, `/api/cpm/signup`, and `/api/assistant`.

Two things worth recording:

1. **They do protect the privileged route.** `GET /api/stations/:id/analytics` returns
   `403 {"error":"Unauthorized"}`. Admin routes (`/api/admin/overview`,
   `/api/admin/isrc-report`) exist in the bundle; I did **not** probe them, because
   testing someone else's access controls without permission is not research.
2. **A static `x-api-key` is hardcoded in the client bundle** and sent with write calls
   such as `POST /api/likes`. Any visitor can read it out of the JavaScript. The value is
   deliberately not reproduced in this doc or in `evidence/`. This is worth telling them
   about; see the outreach note in Q6.

## CPM Collabs - the piece closest to ZAO's own model

"Community Powered Music" is a collaboration-matching program on the AM/instrumentals
side. Its stated terms, quoted from the page:

> creators keep 100% ownership of their work, collaboration splits are agreed in writing
> before anything mints, community participation is economic only, and signing up collects
> no funds and creates no obligation

with "CREATORS - 50%" and "Five community slots - locked by agreement before mint - no
pre-mint funds".

It is currently a **signup form** posting to `/api/cpm/signup`, gated behind manual review
("We review every sign-up and connect compatible collaborators"). So it is an intention,
not a shipped mechanic. It is nonetheless the part of their product that overlaps most
directly with what ZAO does with artist splits, and the part most worth watching.

## The parent: Harmony Hub - PARTIAL

Ignite Radio's licensing link points at harmonyhub.love, and the Terms name Harmony Hub as
the operator, so the parent was examined too.

Harmony Hub presents as infrastructure: "The Harmony Provenance Standard", "The Gold
Standard for Digital Reality", "We created the protocol for truth", "Powered by Sui,
Walrus, Seal". Two observations undercut that framing:

1. **The provenance demo is a mockup.** The verification panel renders
   `Hash: 0x[REDACTED_FOR_SECURITY]` next to `Status: AUTHENTICITY CONFIRMED`. That is
   static placeholder text, not a live verification.
2. **The bundle ships seeded fake verified creators.** Four hardcoded profiles -
   `lunarwave`, `nebula.natalie`, `codecrafter`, `orchestra.ai` - each with
   `isVerified: true`, Unsplash stock photos, invented bios, and fabricated stats
   (`followers: 1840, contentCount: 64, totalEarnings: 1290` on one; `contentCount: 85,
   totalEarnings: 2980` on another). Their `walletAddress` values are checked against Sui
   mainnet and **none of the four exist**. They are seeded into localStorage under the key
   `harmonyProfiles`.

**PARTIAL, and the caveat matters:** seed data in a client bundle is ordinary for a
pre-launch product, and I could not confirm whether these profiles are ever displayed to
users as real. The harmonyhub.love homepage would not render in my headless browser. It
threw `TypeError: I is not a function`, but that came after a WebGL context failure caused
by my having no GPU, so **that crash is most likely an artifact of my environment and
should not be reported as their bug.** The `/catalogs` route rendered fine.

Also worth noting: like Ignite Radio, **Harmony Hub has no deployed Move package either**.
The only `moveCall` in its 1.6 MB bundle is the same SDK-internal `0x1::option` helper.

## Q5. Who is behind it - ANSWERED (FULL)

From their Terms of Service, effective July 5, 2026:

> Welcome to Ignite Radio, a creator-owned radio platform operated by Harmony Hub.

and:

> This document is provided for transparency and is being finalized with legal counsel.

- **Operator:** Harmony Hub, i.e. Harmony Hub LLC per the licensing page at
  harmonyhub.love, which Ignite's own footer links to for licensing.
- **Contact:** a Gmail address given in their Terms of Service for legal and DMCA
  notices, plus a `hello@` address on their own domain in the site footer. Both are
  published on their public pages; not reproduced here. Reachable by email; Discord is dead.
- **Sibling product:** harmonyhub.love, "The social platform for Web3 creators", powered
  by Sui, Walrus and Seal. Notably Harmony Hub uses Walrus while Ignite Radio does not.
- Payments accept crypto **or PayPal**.

## Q6. Compete, integrate, or ignore - now answerable

**Recommendation: integrate, cheaply and specifically. Do not compete, and do not ignore.**

Reasoning:

- **Do not compete.** There is nothing here to beat technically. The tipping "mechanic" is
  eight lines of SDK boilerplate with no contract behind it. Any ZAO surface could ship the
  same thing in an afternoon on Base or Solana. Sui buys them nothing we would want -
  their storage is a filesystem, their database is SQLite, their rewards are off-chain
  points, and their own EVM rails have never been used. The chain is branding.
- **Do not ignore.** The asset is the roster. 32 independent artists and 53 profiles who
  chose to show up and upload 356 tracks to an unknown platform is real, hard-won creator
  supply - exactly the thing ZAO spends effort on. Their problem is the opposite of ours
  in kind: they have supply and no audience.
- **But size the roster honestly.** The second pass sharpened this. The engaged core is
  about a dozen people, and the two operator accounts are 47% of all fanclub activity.
  So the acquirable asset is closer to **10 to 15 genuinely active independent artists**
  than to 53 profiles. That is still worth a conversation - it is just a conversation
  about a dozen artists, not a platform.
- **A relationship already exists.** Their sidebar has a WaveWarz page that links out to
  `wavewarz.com`, describing it as "Live music battles you can trade ... artists get paid
  on every trade". There is a `fellenz` profile and station, and a profile with handle
  `zaal` and display name "Zaal Panthaki". Zaal should confirm what is already agreed
  here before anything is proposed. Note their site writes it "WaveWarz", not WaveWarZ.

**Concrete opening move:** email the contact address published in their Terms with two
things they would want to know and cannot easily see themselves:

1. Their tip button is dead in production, because `owner_id` is stripped from the public
   stations API, so the modal always falls to "hasn't linked a Sui wallet yet".
2. A static `x-api-key` is embedded in their client bundle and readable by any visitor.

Both are verifiable in a minute, cost us nothing, and demonstrate competence without
asking for anything. The conversation to have after that is audience-for-supply, not
technology. Send it privately to the operator, not publicly.

**What would change this call:** if a large listener base exists but is invisible to the
counters I could reach. The second pass makes that less likely - `/api/stats/:id` is their
own instrumentation and it reports double-digit listeners per station - but every number
here still comes from counters they wrote, and I cannot audit what those counters miss.

---

## Remaining unknowns

Written as unknown, not filled in.

- **Distinct platform-wide listeners.** The per-station figure double-counts, so 119 is an
  upper bound, and the true number is unknown. The 13 named fanclub members are the only
  hard headcount available.
- **Which like counter is authoritative.** Trending says 31, per-station stats say 385, and
  they cannot both be right.
- Tip volume. Structurally unmeasurable while tips are bare transfers.
- Whether `@igniteradio_sui` exists. Two methods failed to confirm it; logged-out X blocks
  are common enough that I will not call it deleted.
- Whether an agreement already exists between Harmony Hub and ZAO regarding the WaveWarz
  placement.
- Team size and identities beyond the Harmony Hub entity and its contact addresses.
- Whether `owner_id` is exposed on an authenticated Studio endpoint, which would mean
  tipping works for signed-in owners even though it is dead for the public. Not tested:
  it needs an account, and creating one to probe their auth-gated surface goes past
  reading a public site.
- Whether Harmony Hub's seeded demo profiles are ever shown to users as real.

## Evidence

Raw snapshots live in the working repo, [bettercallzaal/zignite](https://github.com/bettercallzaal/zignite),
under `evidence/`, so any number here can be recomputed rather than trusted:

- `stations.json` - `GET /api/stations`, 32 records, 2026-08-12
- `profiles.json` - `GET /api/profiles`, 53 records, 2026-08-12
- `suitx.json` - Sui mainnet inbound transactions to the Ignite treasury

The API endpoints are public and unauthenticated, so all of it is re-fetchable directly.

## How this connects to the rest of the research

Doc **2197** concluded that web3 music monetization has largely failed to pay artists.
Ignite Radio is a clean confirming case: a platform that did the crypto-native thing
correctly on the merits - non-custodial, zero fee, artist gets 100% - and still moved
essentially no money, because the binding constraint was never the payment rail. It was
the audience. That is the same lesson 2197 draws, observed end-to-end in a single
platform.

The practical read for ZAO: shipping a better tipping mechanism is not a differentiator,
because tipping is already eight lines of SDK code that anyone can copy. Distribution is.
