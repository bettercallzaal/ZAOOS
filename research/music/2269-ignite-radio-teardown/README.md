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

Ignite Radio is a real, working, modestly-populated indie radio platform with a genuine
creator base and effectively zero listeners, zero revenue, and a tipping feature that
does not currently work in production.

## How this was grounded

The homepage is a JS shell, so everything below came from one of four sources, never
from `WebFetch`:

| Method | What it gave |
|---|---|
| Headless browser (`/browse`) | Rendered DOM, live click-through of the tip flow |
| Their own public REST API (`curl`) | `/api/stations`, `/api/profiles`, `/api/likes/trending`, `/api/health` |
| Their shipped JS bundle (`curl` + read) | Exact tipping source code, hardcoded treasury addresses |
| Public chain RPC (`curl`) | Sui, Base, Ethereum, Polygon, Solana treasury state |

Raw snapshots are committed under `evidence/`.

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

### Demand is close to nil

- **28 total likes, platform-wide, all time**, spread over 26 tracks. The most-liked track
  has 2 likes. 12 of the 28 landed on a single day (2026-08-06), consistent with one
  person clicking through the catalogue in one session.
- **Every one of the 53 profiles reports `followers: 0, following: 0, contentCount: 0,
  totalEarnings: 0`.** Not one non-zero stat anywhere.
- 1 of 53 profiles is verified.
- `/api/global-signals` returns `[]`.
- No station has ever been live: `is_live` is false for all 32.

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
- **A relationship already exists.** Their sidebar has a WaveWarz page that links out to
  `wavewarz.com`, describing it as "Live music battles you can trade ... artists get paid
  on every trade". There is a `fellenz` profile and station, and a profile with handle
  `zaal` and display name "Zaal Panthaki". Zaal should confirm what is already agreed
  here before anything is proposed. Note their site writes it "WaveWarz", not WaveWarZ.

**Concrete opening move:** email the contact address published in their Terms, note that their tip button is
broken in production because `owner_id` is stripped from the public stations API, and use
that as the opener. It is a genuinely useful, verifiable bug report that costs us nothing
and demonstrates competence. The conversation to have after that is audience-for-supply,
not technology.

**What would change this call:** if their listener numbers are real but simply not exposed
through the likes/points surface. Nothing observed suggests that, but engagement was
measured through their own counters, which could be under-instrumented.

---

## Remaining unknowns

Written as unknown, not filled in.

- Actual listener counts. There is no plays or listens counter in any public endpoint.
- Tip volume. Structurally unmeasurable while tips are bare transfers.
- Whether `@igniteradio_sui` exists.
- Whether an agreement already exists between Harmony Hub and ZAO regarding the WaveWarz
  placement.
- Team size and identities beyond the Harmony Hub entity and its contact email.
- Whether `owner_id` is exposed on any authenticated Studio endpoint, which would mean
  tipping works for signed-in owners viewing their own station.

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
