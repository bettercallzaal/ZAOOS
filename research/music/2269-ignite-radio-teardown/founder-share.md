# Notes for the Ignite Radio / Harmony Hub team

**From:** The ZAO
**Date:** 2026-08-12
**Context:** Ignite Radio sponsors WaveWarZ, so we spent a day genuinely understanding
the platform rather than skimming it. Along the way we found a few things we would want
someone to tell us. Sharing them because you are on our side of the fence.

Everything here was found from the outside using only public, unauthenticated endpoints
and your shipped JavaScript. **We did not probe your admin routes, and we did not create
an account to reach anything auth-gated.** Where that limits our confidence, we say so.

All findings were re-verified against your current build, `g2-index-Bs0eLnht.js`, on
2026-08-12 - including after you shipped a new bundle mid-way through our look.

---

## 1. The Tip button does not work in production - P0

This is the one we would want to know first, because tipping is in your own marketing copy
and it is the feature we were most interested in.

**What happens:** for a logged-out visitor on `/ignite`, the tip modal can never reach the
send state. It falls through to *"This station owner hasn't linked a Sui wallet yet"*
regardless of which station is playing, and regardless of whether that owner has a wallet.

**Why:** the modal receives its recipient as

```js
recipientAddress: station?.owner_id
```

but `owner_id` is not present in the public stations payload. Verified today:

```bash
curl -s https://igniteradio.xyz/api/stations \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(any('owner_id' in s for s in d))"
# -> False
```

It is absent from `GET /api/stations` and from `GET /api/stations/:id`, and no Sui address
appears anywhere in the rendered DOM on `/ignite`. With `owner_id` undefined, the gate

```js
recipient.startsWith("0x") && recipient.length >= 42
```

is false, so the modal renders the "hasn't linked a wallet" branch every time.

**Caveat, and it is a real one:** we could not log in, so we could not check whether an
authenticated session receives `owner_id` from a different path. If your Studio or
dashboard hydrates stations from an authenticated endpoint, the behaviour there may
differ. What we can say with confidence is that **the public, logged-out path cannot
tip anyone.**

**Also worth a look while you are in there:** the length check `>= 42` is an Ethereum
address length. Sui addresses are 66 characters (`0x` + 64 hex). A 42-character EVM
address would pass validation and the transfer would be addressed to something nobody
controls on Sui. Suggest `=== 66`, or the SDK's own `isValidSuiAddress`.

## 2. A static API key is shipped in your client bundle - P0

Your frontend carries a hardcoded `x-api-key` (7 literal occurrences in the current
bundle, beginning `8c73d9`). We are deliberately not writing the full value down here, in
this repo, or anywhere public - **ask us and we will send it to you directly.** You can
find it yourself by searching the bundle for `x-api-key`.

It is attached to write calls including:

```
POST /api/stations       POST /api/profiles       POST /api/claim
POST /api/likes          POST /api/playlists      POST /api/points/award
POST /api/points/merge   POST /api/engagement     POST /api/listener/heartbeat
```

Anything shipped to a browser is public, so this key is readable by every visitor. The
ones that would concern us most are `/api/stations`, `/api/profiles` and `/api/claim` -
station creation, profile creation, and claiming.

**We did not test whether the key actually authorises those writes.** Doing that would
mean writing to your production database uninvited, which is not ours to do. So treat
this as "please check", not "confirmed exploitable". If server-side session auth is the
real gate and this key is vestigial, the fix is just deleting it.

To your credit, the thing that *should* be locked is locked: `GET /api/stations/:id/analytics`
correctly returns `403 Unauthorized`.

## 3. You cannot measure your own tipping - P1, architectural

Not a bug, but probably the most consequential thing on this list.

Tips are bare native SUI transfers:

```js
const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountMist)]);
tx.transferObjects([coin], tx.pure(recipient));
```

No Move call, no memo, no event. That has real virtues - non-custodial, zero fee, artist
receives 100%, nothing to audit. But it means **an Ignite tip is indistinguishable
on-chain from any other SUI transfer.** Nothing links it to a station, a track, a play,
or a listener.

Consequences you may already be feeling:

- `totalEarnings` reads 0 on every profile and structurally always will, because the
  backend has no way to observe a tip. Right now every artist on the platform sees zero
  earnings whether or not anyone tipped them.
- You have no tip analytics, so you cannot tell an artist "you earned X this month" -
  which is exactly the number that keeps artists coming back.
- No leaderboards, no "top supporter", no split logic, no proof-of-support.

**Cheapest fix that keeps every virtue:** keep the transfer exactly as is, and emit an
event alongside it. A tiny Move module with a `tip(recipient, station_id, track_id)`
entry function that performs the same transfer and emits an event gets you a queryable
record without touching custody or taking a fee. Failing that, even having the client
POST the tx digest back to your own API after a successful signature would let you
reconcile against chain state and populate `totalEarnings` today.

Worth saying plainly: you currently have no smart contract deployed at all - the only
`moveCall` in the bundle is the SDK's internal `0x1::option` helper. That is a
defensible choice, and this suggestion is the smallest possible departure from it.

## 4. Smaller things - P2

**Your Discord invite is dead.** Both the footer link and the "Help & Discord" nav item
point at `discord.gg/igniteradio`, which Discord's API reports as invalid:

```bash
curl -s "https://discord.com/api/v9/invites/igniteradio?with_counts=true"
# {"message": "Unknown Invite", "code": 10006}
```

Since that is your only community entry point in the UI, it is likely costing you signups
from people who are already interested enough to click.

**Your Sui RPC endpoints are deprecated.** The bundle references
`fullnode.mainnet.sui.io:443` (also testnet and devnet). Public JSON-RPC on those hosts
now returns:

> Method not found. JSON-RPC on public fullnodes has been deprecated. Please migrate to
> gRPC or GraphQL endpoints.

The tip flow signs through the user's wallet so it probably is not affected, but any
direct reads you do against those hosts are already failing. `sui-rpc.publicnode.com`
still answers JSON-RPC if you want a drop-in while you migrate.

**`/ignite` re-fetches the full station list about seven times per page load**, each with
a cache-busting query param, at roughly 124 KB per response. Deduping that is close to a
megabyte saved per visit.

**Two engagement counters disagree.** `/api/stats/:id` and `/api/likes/trending` do not
reconcile - per-station likes sum to 385 while trending totals 31, and Velvet Rebellion
reports 126 likes in stats while appearing in trending zero times. One of them is probably
misleading you about what is working on the platform.

## 5. Two things we would want flagged if we were you

Raising these privately, in the spirit they are meant.

**Re-hosted Audius audio.** About 42% of the catalogue (149 of 356 tracks) is served from
your own origin under `/uploads/audius-*` with `aud_` ids - copies on your server rather
than embeds or streams from Audius. Hosting a copy is a materially different act from
embedding, with different licensing exposure, and your Terms put the rights representation
on the uploading creator. We are not making a legal call and we are not lawyers. We just
would not want to discover that framing late.

**Harmony Hub ships seeded demo creators marked as verified.** In the harmonyhub.love
bundle there are four hardcoded profiles - `lunarwave`, `nebula.natalie`, `codecrafter`,
`orchestra.ai` - each with `isVerified: true`, Unsplash stock photography, and fabricated
stats (one shows `followers: 1840, totalEarnings: 1290`; another `totalEarnings: 2980`).
Their `walletAddress` values do not exist on Sui mainnet. They are seeded into
localStorage under the key `harmonyProfiles`. Separately, the provenance panel on
`/catalogs` renders `Hash: 0x[REDACTED_FOR_SECURITY]` beside `Status: AUTHENTICITY CONFIRMED`.

**Our caveat is genuine here:** seed data in a pre-launch bundle is completely ordinary,
and we could not confirm whether any of it is ever displayed to a user as real - the
harmonyhub.love homepage would not render in our headless browser. We flag it only because
the surrounding product is positioned as a provenance and verification standard, and
fabricated verified profiles with invented earnings are the specific thing that would be
costly to be caught with in that context. Entirely possible this is already on your list.

## 6. What we think you have got right

Not padding - these are things we noticed because they are not the default.

- **The tipping design is genuinely correct in its values.** Non-custodial, no platform
  fee, artist gets 100%, no contract to trust. Most platforms would have taken a cut and
  called it a protocol.
- **You protected the endpoint that mattered.** Analytics is properly 403'd.
- **The artist metadata is real where it exists** - IPI numbers, publisher, DistroKid,
  MLC and SoundExchange registration flags on the stations that filled it in. That is
  unglamorous rights plumbing that most music startups skip entirely.
- **CPM Collabs is the most interesting thing you are building**, from where we sit.
  Creators keeping 100% with splits agreed in writing before anything mints is close to
  how ZAO thinks about artist splits. If you want a design partner on that, we are
  genuinely interested.
- **You have real independent artists uploading real catalogue.** 356 tracks is not
  nothing, and creator supply is the hard half.

## 7. The honest part

Since you sponsor WaveWarZ and we are in the same family, the useful version of this note
includes the uncomfortable bit.

From the outside, the constraint on Ignite does not look like product or technology. It
looks like audience. Your fanclub endpoint names its members, and across all stations the
72 memberships resolve to 13 distinct people - with `harmonyhub` and `sweetharmonyhub`
accounting for 34 of them between them. The treasury numbers point the same way.

We say that not as a knock but because we have the opposite problem in places, and that
asymmetry is the actual reason to talk. Fixing the tip button and shipping a tip event
would at least mean that when the audience does arrive, the money and the credit land
where they should - and artists can finally see a number that is not zero.

Happy to walk through any of this live, hand over the API key value directly, or dig
further into anything here.
