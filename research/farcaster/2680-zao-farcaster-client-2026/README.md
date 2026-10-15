---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-10-15
related-docs: "1501, 2313, 2385, 2489, 2498, 2666"
original-query: "Stop everything highest priority build a working farcaster client for the zao for people to use recent news networks Tate acquired farcaster lots happening imma be afk for an hour please do research with as much as you can and prep our zao client using everything we are working towards with zao v3 (Zaal, relayed by the seat 2026-10-15; this lane owns the research half, a sibling lane owns the build)"
tier: DEEP
---

# 2680 - A ZAO Farcaster client after the Network School deal

> **Goal:** Confirm from primary sources what changed for Farcaster on 15 Oct 2026, read the client stack as it stands today, and say what a ZAO client should reuse, build and avoid in 30 days.

Written Thu 15 Oct 2026, 16:2x to 17:3x EDT (clock from `date`), in one hour, by the research lane. Every claim below was fetched this run unless marked UNVERIFIED or carried from a named earlier doc.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **"Networks Tate" is Network School, Balaji Srinivasan's.** The deal is real: Neynar's CEO cast "Network School is acquiring Farcaster" on 2026-10-15 at 17:47 UTC, and Dan Romero quoted it 44 minutes later with "Excited for the next chapter!" mentioning FID 37 (Balaji). Terms: not disclosed. | Primary casts read from the public hub (Haatz), hashes in Sources. |
| 2 | **BUILD the ZAO client on ZAOOS, not on a fork.** ZAOOS (MIT) began as the gated ZAO client and already carries Sign In With Farcaster (Auth Kit, auth-client, Quick Auth), Neynar managed signers through the app FID 19640, signer provenance and a fresh write-authority check before every write, channel config for /zao, /zabal, /cocconcertz, /wavewarz, and a /miniapp route. | `package.json:49-62`, `src/lib/farcaster/*.ts`, `src/app/api/auth/signer/route.ts`, `community.config.ts:36`. |
| 3 | **BORROW from `farcasterxyz/client`, credit it, do not fork it.** It is the official client's monorepo snapshot, mobile and web, MIT ("Copyright (c) 2026 Neynar, Inc."), published 2026-09-30. Its README says both clients point "to the current production API by Farcaster", which is the backend now moving to Network School: a fork inherits an API we do not control. | LICENSE and README read from GitHub this run. |
| 4 | **Do NOT copy zingfisher code into the client. Call it across an API.** zingfisher is a CharmVerse fork; its LICENSE is CharmVerse's dual licence: GNU AGPL v3, or a paid commercial licence. Copying its code into ZAOOS (MIT) makes the copied parts AGPL. ZIDs, member profiles and roles cross the boundary as data. | zingfisher `LICENSE`, read this run. |
| 5 | **KEEP Neynar for the first 30 days, and keep the hub fallback warm.** Neynar's team mostly joins Network School; whether the Neynar API product continues as is was not stated by anyone today. ZAOOS already reads from the Haatz public hub as a fallback (doc 2666). Free tier today: 10M credits a month, 600 requests a minute per endpoint. | Neynar's rate-limits doc (raw markdown), the announcement cast, doc 2666. |
| 6 | **Make "real people" the ZAO client's feature, not a bolt-on.** Network School's stated direction is proof of humanity and moderation. A members-only client gated by ZAO membership (ZID, Respect) already answers that question for our community. | Balaji, 2026-02-18: "Would like to see a Farcaster client with pangram.com and proof of human integrated." The moderation and rebrand details are single-sourced (decision 7). |
| 7 | **Treat the rebrand and the new rules as UNVERIFIED until Balaji posts them.** One outlet says Farcaster becomes "Network State Protocol" with AI moderation, proof of humanity and a Singapore-style code of conduct, and that users will vote and get an NFT. The announcing cast says only "Balaji will share more on this." His last 10 X posts (newest 12:48 UTC) and his casts (newest 30 Aug) do not mention it. | Cryptobriefing article (one source), FxTwitter, hub. |

## 1. The acquisition, from primary sources

| Fact | Source | Grade |
|---|---|---|
| "Network School is acquiring Farcaster. We're transferring the Farcaster app, the protocol repositories, and related products to Network School." | Neynar CEO (FID 194), cast 0x5d4797540c, 2026-10-15 17:47 UTC | FULL |
| "We ran a broad process and received several strong proposals. Farcaster needs a different operating model for its next stage." Network School "has the resources to fund Farcaster" and a vision of Farcaster "as a digital complement to physical network states". | same cast | FULL |
| "Most of the Neynar team will be joining Network School to continue building Farcaster." He and Manan "will be moving on to something new." Two hours later: "I don't work here anymore." | same cast; cast 0x585d0d50, 20:02 UTC | FULL |
| Dan Romero (FID 3): "Excited for the next chapter!" quoting the announcement and mentioning FID 37; "Great run!" as a reply. | casts 0x9579611f and 0xccd7b68b, 18:31 UTC | FULL |
| Asked whether third-party clients could lose Neynar's APIs, Neynar's CEO: "I doubt it though given they are pro open source clients and developers building their own clients." | cast 0xc433d9db, 20:10 UTC, replying to "Not sure if they will ban people from using neynar api's" | FULL (an opinion, not a policy) |
| Terms and price: not disclosed. | the cast and the article | FULL |
| Rename to "Network State Protocol", AI moderation, proof of humanity, Singapore-modelled conduct code, a user vote with an onchain NFT for those who opt in; protocol "expected to stay open and permissionless". | cryptobriefing.com, 2026-10-15 | PARTIAL: one secondary outlet, not in any primary post read |
| The previous owner: Neynar bought Farcaster from Merkle Manufactory on 2026-01-21, including the protocol, the official client and Clanker. | Neynar's blog index ("Neynar will maintain Farcaster protocol, run the Farcaster client and operate Clanker"); cryptobriefing; @neynar cast 0x3a4612cc ("since january 21, 2026") | FULL |
| Balaji's last Farcaster cast on Farcaster itself, 2026-04-28: "Farcaster is still the best protocol of its kind. Much potential remains." On 2026-01-22: "I want to see the Farcaster protocol grow". | hub, FID 37 | FULL |

**What changes for a third-party client, as of today:** nothing has changed yet, and nothing was announced for third-party clients. The app, the protocol repositories and "related products" move; the hubs (Snapchain) are a network, not a product, and the transfer does not mention them. Whether Neynar's API, signer sponsorship and the mini app catalogue stay where they are is UNKNOWN. That is the main risk below.

## 2. The client stack today

| Piece | What it is today | Source | Grade |
|---|---|---|---|
| Neynar plans | **Free**: 10M credits a month, 10 webhooks, 5 apps, 600 requests a minute (10 a second) per endpoint. **Scale**: $249 a month, 60M credits, 1,200 a minute. **Enterprise**: custom. Starter ($9) and Growth ($49) "no longer offered to new customers" since June 2026. | docs.neynar.com rate-limits page, raw markdown | FULL |
| Neynar reach claim | "2.6M+ accounts, thousands of developers and agents, and $500M+ in connected wallets" | neynar.com home | FULL (their claim) |
| Sign In With Farcaster | Auth Kit is "a React library that lets users log in to your app with a Farcaster account": a button, a QR scan or tap to approve in Farcaster, a signature verified by the app. Sign In With Neynar was retired 2026-08-14 (doc 2498). | docs.farcaster.xyz/auth-kit/introduction | FULL |
| Writing as the user | Managed signers: the app registers a signer for each user; generating one "requires paying onchain fees", sponsored by the developer account (`FARCASTER_DEVELOPER_MNEMONIC` in Neynar's guide). ZAOOS does this as FID 19640 with `APP_SIGNER_PRIVATE_KEY`. | docs.neynar.com managed signers; `src/app/api/auth/signer/route.ts:1-5` | FULL |
| Mini apps | `@farcaster/create-mini-app`, the SDK with Quick Auth, Ethereum and Solana wallets, manifests; developer mode for previews. | miniapps.farcaster.xyz getting started | FULL |
| The network | Snapchain, "the decentralized, peer-to-peer network that powers the Farcaster social network"; read nodes anyone can run; HTTP and gRPC APIs. The Hypersnap hard fork is a separate track (doc 2666). | snapchain.farcaster.xyz | FULL |

**Open-source code to learn from (LICENSE files read, not the API field):**

| Repo | Last push | Licence (from the file) | Use |
|---|---|---|---|
| `farcasterxyz/client` (official client snapshot, mobile and web, no wallet) | 2026-09-30 | MIT, Neynar, Inc. | Reference for feeds, threads, composer, notifications UI. Credit in code. |
| `farcasterxyz/hub-monorepo` | 2026-08-04 | MIT, Merkle Manufactory | Hub client libraries (ZAOOS has `@farcaster/hub-nodejs`). |
| `farcasterxyz/auth-monorepo` | 2026-03-30 | MIT | Auth Kit and auth-client source. |
| `farcasterxyz/miniapps` | 2026-08-04 | MIT | Mini app SDK. |
| `neynarxyz/farcaster-examples` | 2026-07-31 | MIT | Signer and webhook examples. |
| `bettercallzaal/zaalcaster` (ours) | 2026-09-21 | MIT | Unanswered inbox, channel feeds, reply drafts. |
| `bettercallzaal/channelz` (ours, private) | 2026-10-08 | no LICENSE file | Channels sorted by favourites; Neynar proxied server-side. |

## 3. Community clients in the last month (GitHub, pushed since 2026-09-01)

| Client | What | Licence | Last push |
|---|---|---|---|
| `homebasedotlove/home` | "Homebase's Farcaster client" | MIT | 2026-10-14 |
| `pierce403/hypecast` | "great opportunity for a new Farcaster client" | none | 2026-10-15 |
| `backmeupplz/farcaster-tui` | terminal client | MIT | 2026-10-08 |
| `farcasterxyz/client` | the official snapshot above | MIT | 2026-09-30 |

Neynar's CEO, today: "opus 5.5 one shots a client with docs.neynar". Building a basic client is now cheap; the moat is the community and the rules, which is decision 6. Supercast and Recaster stay the independent power-user clients (doc 2385, not re-checked today).

## 4. What a ZAO client needs in 30 days

**Reuse from ZAOOS (inventory read this run):** Auth Kit and Quick Auth sign-in; the managed signer flow on FID 19640; `write-authority.ts` (a fresh signer check before every write), `signer-provenance.ts` and `signer-authority-filter.ts` (casts from a removed key are not served), `hidden-casts.ts` and `cast-tombstone.ts` (moderation and deletes); the `/api/casts`, `/api/neynar`, `/api/notifications` routes; the channel list in `community.config.ts:36`; `/miniapp` for the in-Farcaster version; XMTP for DMs (`@xmtp/browser-sdk`).

**Reuse from V3 (zingfisher), as data across an API:** the ZID (ZAO identity) per member, the member profile store, and the role decision that PR #5 moved onto CharmVerse token gates; wallet sign-in merged 2026-10-15 behind `NEXT_PUBLIC_ZAO_REAL_SIGNIN` (PR #9). The client asks zingfisher "is this FID a member, what ZID, which roles", never imports its code (decision 4).

**Build (the sibling lane's list, in order):**
1. A members-first home: /zao, /zabal, /wavewarz, /cocconcertz in one feed, members' casts marked by ZID.
2. Sign-in: Sign In With Farcaster, then the membership check; a non-member reads, a member writes.
3. Compose, reply, recast, like through the managed signer, with the write-authority check already in ZAOOS.
4. Notifications for mentions and replies (ZAOOS route plus a Neynar webhook, the one doc 2498 says is still not created).
5. The same app as a mini app inside Farcaster (Quick Auth).

**Risks, ranked:**
1. **Neynar's future is unknown today.** Mitigation: the Haatz read fallback stays wired; nothing new depends on a Neynar-only endpoint without a hub equivalent; budget for Scale ($249) only if the free 10M credits run out.
2. **Signers cost onchain fees per new member**, paid by the app FID's wallet. Measure before opening sign-ups to more than the 188 members.
3. **Network School's rules may reach clients** (moderation, proof of humanity). UNVERIFIED today; a members-only client is on the right side of it either way.
4. **Licences:** AGPL on zingfisher (decision 4); credit `farcasterxyz/client` (MIT) at every use site.
5. **The Hypersnap fork** may split the network later (doc 2666): keep FID 19640's keys where they are.

## Also See

- [Doc 2666](../2666-hypersnap-hard-fork-protocol-layer-oct2026/) - the Hypersnap fork and the haatz read fallback.
- [Doc 2498](../2498-neynar-2026-surface-after-siwn/) - Neynar after Sign In With Neynar was retired.
- [Doc 2489](../2489-zaalcaster-repos-research-surface/) - zaalcaster.
- [Doc 2385](../2385-farcaster-client-landscape-aug2026/) - the client landscape in August.
- [Doc 2313](../2313-farcaster-auth-primitives-sparkz/) - auth primitives.
- [Doc 1501](../1501-warpcast-product-changes-jul2026/) - the app's product changes in July.

## Next Actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Build the members-first client on ZAOOS per section 4 | sibling build lane | PRs | 30 days from 2026-10-15 |
| Watch Balaji's X and casts for the rules and the rename; update decision 7 | research lane | doc update | the day he posts |
| Ask Neynar (their Slack) whether the API, signer sponsorship and plans continue under Network School | Zaal or the seat | message (outbound, his tap) | this week |
| Create the Neynar webhook doc 2498 says is missing | Zaal | dashboard tap | before notifications ship |
| Decide the zingfisher membership API (FID to ZID and roles) | V3 lane | spec | week 1 |

## Sources

- [FULL] Hub casts, read raw from https://haatz.quilibrium.com/v1 (`castById`, `castsByFid`): Neynar CEO FID 194 casts 0x5d4797540c (17:47 UTC), 0x585d0d50, 0xc433d9db, 0x0bca8224 and its parent from FID 230238; Dan Romero FID 3 casts 0x9579611f, 0xccd7b68b; Balaji FID 37 casts 0xb0c7ccbe, 0xb1152158, 0x544f1bc5; @neynar FID 6131 cast 0x3a4612cc. Method: curl, JSON.
- [FULL] Balaji's last 10 posts on X via https://api.fxtwitter.com/2/profile/balajis/statuses (newest 12:48 UTC; no mention of the deal). Method: FxTwitter JSON.
- [PARTIAL - one secondary source for the rename and rules] https://cryptobriefing.com/network-school-acquires-farcaster-network-state-protocol/ (curl, stripped).
- [FULL] https://cryptobriefing.com/neynar-farcaster-acquisition/ and https://neynar.com/blog (index) for the January deal.
- [FAILED] https://www.cryptopolitan.com/farcaster-sold-billion-dollar-valuation/ (403).
- [FULL] https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis.md (raw markdown); https://neynar.com/ (home, reach claim).
- [FAILED] https://neynar.com/pricing (404); [PARTIAL] https://dev.neynar.com/pricing (script-rendered, one line).
- [FULL] https://docs.neynar.com/docs/integrate-managed-signers; https://docs.farcaster.xyz/auth-kit/introduction; https://miniapps.farcaster.xyz/docs/getting-started; https://snapchain.farcaster.xyz/. Method: curl, stripped.
- [FULL] GitHub REST: LICENSE files and READMEs of farcasterxyz/client, hub-monorepo, auth-monorepo, miniapps, neynarxyz/farcaster-examples, bettercallzaal/zingfisher, zaalcaster, channelz; repository search for Farcaster clients pushed since 2026-09-01; zingfisher pulls #1 to #9.
- [FULL] Community source: the Farcaster casts above are the community record; the open question about Neynar's APIs came from a community member's cast.
- [FULL] ZAOOS at origin/main fa8791d7 era, read this run: `package.json`, `src/lib/farcaster/`, `src/app/api/auth/`, `community.config.ts`, `LICENSE` (MIT).
