---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-09-17
superseded-by:
related-docs: 2313, 2087, 017, 910, 306, 1094, 2489
original-query: "prob we should /zao-research all the neynar docs"
tier: STANDARD
---

# 2498 - Neynar's 2026 surface for zaalcaster, after Sign In With Neynar was retired

> **Goal:** On 2026-09-17 Zaal turned zaalcaster's sign-in gate on and the Neynar widget answered "Sign In With Neynar has been retired. Developers should migrate to Neynar-managed signers." This doc reads Neynar's current docs (fetched as markdown from docs.neynar.com, never summarized by a model) and says what Neynar offers zaalcaster today: which sign-in to use, what managed signers are and cost, what the Mini App / Agents / OAuth Clients / App Wallet / Webhooks tabs on the app page do, what Snapchain URLs add, and where the credits stand. The zaalcaster lane is building the replacement sign-in at the same time; this doc is the reference it builds against.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Sign-in for zaalcaster in a browser (PWA on Zaal's phone, desktop) | **USE Sign In With Farcaster over Farcaster's own relay (relay.farcaster.xyz), verified server-side. Not Neynar.** | Neynar's own doc says the replacement for SIWN is managed signers, and managed signers are a WRITE primitive: "Authorization: this is where an account gives the app certain access privileges", built on top of "Authentication... Sign in with Farcaster (SIWF)". zaalcaster only needs authentication: Zaal writes through the signer he already has, guests only read. Doc 2313 reached the same split for Sparkz on 2026-08-17. The relay was probed live: `POST /v1/channel` returns `{channelToken, url: https://farcaster.xyz/~/siwf?channelToken=..., nonce}`, `GET /v1/channel/status` needs the token as Bearer and 401s without it, and the completed state carries `fid, username, custody, message, signature, authMethod`. Zero npm dependencies, which is zaalcaster's hard rule. |
| 2 | Sign-in when opened inside the Farcaster app (mini app) | **ADD Quick Auth later, not now.** | Quick Auth is "a lightweight service built on top of Sign In with Farcaster" that hands the mini app a JWT; verifying it server-side means fetching Farcaster's JWKS and checking an ES256 signature. Doc 2313 already lifted a 107-line verifier from `ZAODEVZ/zabalgames lib/auth.mjs`. Zaal is testing as a PWA in Safari, where Quick Auth does not exist, so the relay path ships first. |
| 3 | Verifying the relay response | **Verify the SIWE message signature against the custody address, or state plainly that the relay is the trust anchor.** | Farcaster's `verifySignInMessage` checks domain + nonce + signature and accepts an auth-address signature when `acceptAuthAddress` is true. Doing that without a dependency needs secp256k1 recovery plus an IdRegistry read; the first zaalcaster slice trusts the relay over TLS with a per-channel secret token and an HMAC-bound nonce, and says so in code. Upgrade path recorded in Next Actions. |
| 4 | Managed signers for zaalcaster | **KEEP the one signer Zaal has. Do not build a signer-issuing flow for guests.** | Registering a managed signer needs the app's developer key (`FARCASTER_DEVELOPER_MNEMONIC` in Neynar's guide; `APP_SIGNER_PRIVATE_KEY` in `bin/mint-signer.js`, which already does the six-step flow) and a user tap in Warpcast. Sponsorship: Neynar pays and bills credits (`sponsored_by_neynar: true`), or the app pays if it holds 100+ warps. Guests never write in zaalcaster, so a guest signer is cost and liability with no feature behind it. |
| 5 | Webhooks | **DO NOW: create the webhook in the dashboard and set WEBHOOK_SECRET in Vercel.** | The receiver at `api/webhook.js` already verifies the `X-Neynar-Signature` HMAC-SHA512 header exactly as the docs specify and has been inert since 2026-07-07 for want of the secret. Free plan includes 10 webhooks. |
| 6 | Agents tab | **Not for zaalcaster. Relevant to ZOL only if ZOL wants a Neynar-hosted signer again.** | "Create Agent" mints a new Farcaster account with Neynar paying the account fee, restricted per developer account, and hands back a `signer_uuid`. Doc 910 moved ZOL to a self-custodied zero-cost Snapchain signer on purpose. |
| 7 | App Wallet tab | **SKIP until an onchain write is wanted.** | A `wallet_id` is "a server-side wallet that you fund with gas tokens" and is REQUIRED for `nft/mint`, `fungible/send`, `storage/buy`, `user/fid`, `user/` (register). zaalcaster's storage-status card reads; nothing buys. |
| 8 | OAuth Clients tab | **Undocumented. Ask before relying on it.** | `docs.neynar.com/llms.txt` (95,381 bytes, the full doc index) has no page for it; the only OAuth entry is a blog post arguing Farcaster does not need OAuth ("Skip OAuth flows - wallet signature = auth"). |
| 9 | Snapchain HTTPS / gRPC URLs | **Ignore for zaalcaster; they matter for a hub-level reader (ZOL, doc 910).** | They are the raw protocol node, keyed by the same API key. zaalcaster reads through the v2 REST wrapper in `lib.js` (`api.neynar.com/v2`). |
| 10 | Plan | **Stay on Free.** | June 2026 plan change: Free is 10M credits/month, 10 webhooks, 5 apps, 600 RPM per endpoint; Scale is $249/mo for 60M. Starter ($9) and Growth ($49) are closed to new customers. Zaal's dashboard shows 0.03 percent of credits used. |

## Findings

### 1. What Neynar says about SIWN, verbatim from the doc page (markdown fetch, 2026-09-17)

> "Sign In With Neynar is deprecated. SIWN is being retired. New integrations should use Neynar-managed signers instead. Existing connections will keep working; new SIWN connections will stop being issued after Friday, August 14, 2026."

And the routing note on the same page: "If building a mini app, use App auth instead. If you want to design your own frontend, use Neynar Managed Signers." The widget on z.thezao.xyz rendered the retirement notice, so "existing connections keep working" does not cover a first-time sign-in.

Neynar staff on Farcaster, 2026-09-07 (@shreyas-chorge, cast `0x52ec05ce`): "We are planning to deprecate SIWN. (Existing signers will continue working, new signer creation form Neynar will stop). You can still use/migrate to managed signer." Community PSA 2026-08-08 (@10xchris.eth, `0xb660d975`) repeated the August 14 date. A working client built the other way the same month: @antimofm.eth's MyFarcaster (2026-08-03, 19 likes, `0x41d7963f`) ships "SIWF: QR / tap-to-approve in the app (new Neynar managed signers, no popup)", which is the authentication-then-authorization split this doc recommends.

### 2. Authentication vs authorization, in Neynar's own terms

From "Write Data with Managed Signers": "Authentication: This is where an account proves they are who they say they are. Flows like Sign in with Farcaster (SIWF) or login providers like Privy allow this for app logins. Authorization: this is where an account gives the app certain access privileges to take actions on behalf of the account. This is what Neynar signers allow for writing data to the protocol." Then: "If starting logged out, the full flow takes two distinct steps."

zaalcaster's need per role:

| Role | Needs authentication | Needs a signer | Today |
|---|---|---|---|
| Zaal (fid 19640) | yes | yes, already has `ZAAL_SIGNER_UUID` (minted 2026-07-04 via `bin/mint-signer.js`) | signer works; sign-in was SIWN |
| Guest | yes | no, guests are read-only by design (2026-07-14) | sign-in was SIWN |

So the replacement is authentication only, and the write path does not change.

### 3. The three sign-in options compared

| Option | What it is | Dependency | Works in Safari PWA | Works inside Farcaster app | Verdict |
|---|---|---|---|---|---|
| Relay SIWF | `POST relay.farcaster.xyz/v1/channel` with `siweUri` + `domain` (nonce optional, min 8 alphanumerics), user opens `farcaster.xyz/~/siwf?channelToken=` on the phone, app polls `/v1/channel/status` with `Authorization: Bearer <channelToken>` until `state: completed` | none | yes (link opens the Farcaster app) | yes but clunky (link out and back) | USE first |
| Quick Auth | `sdk.quickAuth.getToken()` returns a JWT; backend validates against Farcaster's auth server | `@farcaster/miniapp-sdk` (already loaded from esm.sh for `ready()`) + JWKS verification server-side | no | yes, silent | ADD second |
| Neynar managed signer as login | create signer, sign EIP-712 with the developer key, user approves in Warpcast, poll `GET /v2/farcaster/signer` | none (raw REST) but needs the developer key on the server | yes | yes | write primitive; wrong tool for login |

Relay status payload when completed, from Farcaster's docs: `state, nonce, url, message, signature, authMethod ("custody" | "authAddress"), fid, username, bio, displayName, pfpUrl, verifications, custody, signatureParams {siweUri, domain, nonce, notBefore, expirationTime, requestId, redirectUrl}, metadata {ip, userAgent}, acceptAuthAddress`. Live probe returned `acceptAuthAddress: true` on a fresh channel.

Verification per Farcaster's `verifySignInMessage`: domain "must match the domain in the provided SIWF message", nonce "must match the nonce in the provided SIWF message", signature "provided by the user's Farcaster wallet"; returns `{data, success, fid}`.

### 4. Managed signers: the flow, the key, the cost

Neynar's guide (Next.js) needs `NEYNAR_API_KEY` and `FARCASTER_DEVELOPER_MNEMONIC`, "the mnemonic for your developer account on Farcaster, e.g. @your_company_name". The steps are create signer (`POST /v2/farcaster/signer` returns `signer_uuid` + Ed25519 `public_key`), sign a `SignedKeyRequest` with that developer account, `POST /v2/farcaster/signer/signed_key` (returns `status: pending_approval` and a `signer_approval_url` deep link), show it as a QR on desktop or a tap on mobile, poll until approved. `bin/mint-signer.js` implements exactly this with `APP_SIGNER_PRIVATE_KEY` (the zolbot account signed Zaal's key request on 2026-07-04).

Cost: "The user will need to pay for this on-chain transaction" unless sponsored. Two sponsorship routes: `sponsor: { sponsored_by_neynar: true }` ("we will charge you credits that correspond to the sponsorship fees"), or self-sponsor ("Your application must be signed up on Warpcast and have warps >= 100"). Rate limits for `GET v2/farcaster/signer` are 6,000 RPM on Free and excluded from the global limit, so polling is cheap.

### 5. The app-page tabs, mapped to docs

| Tab | Doc page | What it is | zaalcaster | ZOL |
|---|---|---|---|---|
| Set up | this page | API key with Rotate (24h grace unless "immediately revoke" is checked), Client ID, Snapchain HTTPS/gRPC URLs | rotated 2026-09-17 | - |
| SIWN | SIWN page (retired) | authorized origins, permissions | dead | dead |
| Mini App | "Mini App Hosts Notifications" is the only mini-app dashboard doc found | notification token handling for apps that HOST mini apps (a client like Warpcast), not for mini apps themselves | no | no |
| Agents | "Create in UI" | mint a bot account, Neynar pays the account fee, returns a `signer_uuid`; "we restrict the number of agents you can create per developer account" | no | only if ZOL abandons doc 910's self-custodied signer |
| OAuth Clients | none in llms.txt | unknown | ask Neynar | - |
| App Wallet | "Managing Onchain Wallets" | server-side wallet, `wallet_id`, funded with gas, required for mint / send / storage buy / register | not yet | maybe for storage buys |
| Webhooks (sidebar) | "Webhooks in Dashboard" + "Verify Webhooks with HMAC Signatures" | target URL + event filters; `X-Neynar-Signature` sha512 HMAC over the raw body | DO NOW | ZOL has its own listener |

### 6. Snapchain URLs

`https://snapchain-api.neynar.com` (HTTPS) and `snapchain-grpc-api.neynar.com:443` (gRPC, "meant to be used with the @farcaster/hub-nodejs SDK"), both authenticated with the same `x-api-key`. Snapchain is "the decentralized, peer-to-peer network that powers the Farcaster social network"; these are node endpoints, below the v2 REST API that hydrates users and reactions. `lib.js` uses the REST base `https://api.neynar.com/v2` for every read and write; nothing in zaalcaster needs raw messages. Doc 910's zero-cost self-custodied signer for ZOL is where a hub endpoint matters.

### 7. Plan and credits

From the rate-limits page, "Plan update (June 2026)": Free is 10M credits/month, 10 webhooks, 5 apps, 600 RPM per endpoint (cast search 120 RPM); Scale is $249/mo, 60M credits, 1200 RPM; Starter ($9) and Growth ($49) closed to new customers. Global limit 1,000 RPM on Free. Cast creation: under 1,000 casts per 24h has no storage requirement. Zaal's dashboard: 0.03 percent of credits used. The public pricing page at dev.neynar.com/pricing is a JS shell to curl (30 KB, no plan text), so the numbers here come from the docs page only.

### 8. What zaalcaster already has, from the code

- `lib.js`: REST wrapper on `api.neynar.com/v2`, retries 429 with Retry-After, `getSignerInfo()` on `/farcaster/signer`.
- `auth.js` (main `12c19e3`, 2026-09-17): cookie session HMAC-signed with `SESSION_SECRET` or a key derived from `NEYNAR_API_KEY`; gate on when `NEYNAR_CLIENT_ID` is set; locked on Vercel without a key.
- `api/auth.js`: POST still expects `{fid, signer_uuid}` from the SIWN callback and re-verifies through `getSignerInfo()`. This is the function the relay flow replaces.
- `api/webhook.js`: HMAC-SHA512 receiver, inert until `WEBHOOK_SECRET` exists.
- `bin/mint-signer.js`: the full managed-signer flow, already proven.

## Also See

- [Doc 2313](../2313-farcaster-auth-primitives-sparkz/) - the same three-way comparison for Sparkz, 2026-08-17, including the SIWN deprecation date and the zabalgames Quick Auth verifier.
- [Doc 2087](../../security/2087-farcaster-admin-auth-siwf/) - SIWF via auth-client for an admin path; this doc drops the dependency by talking to the relay directly.
- [Doc 017](../017-neynar-onboarding/) - managed signers and sponsorship, 2026-05.
- [Doc 910](../910-free-farcaster-posting-zol/) - ZOL's self-custodied Snapchain signer; why the Agents tab is not for ZOL.
- [Doc 306 (farcaster)](../306-farcaster-protocol-features-gap-analysis/) - 200+ Neynar endpoints mapped.
- [Doc 1094c](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/1094c-farcaster-protocol-updates/) - SIWN and agent-FID notes from July.
- [Doc 2489](../2489-zaalcaster-repos-research-surface/) - the zaalcaster surfaces this sign-in now gates.
- Tracker: `handoff:secrets-neynar-rotate` (todo, due 2026-10-10) - the rotation happened 2026-09-17; close it.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship relay SIWF in zaalcaster: `api/auth.js` POST actions `siwf_start` / `siwf_poll`, gate button opens the relay URL, session cookie on `completed`; shipped = Zaal signs in on his phone and posts one cast, both recorded in CLAUDE.md with the commit | zaalcaster lane | PR + merge | 2026-09-17 |
| Verify the SIWE signature server-side (custody or auth address) without a dependency, or record the relay-trust decision permanently in `auth.js`; shipped = a tampered `fid` in a completed channel is rejected in a test | zaalcaster lane | PR | 2026-09-24 |
| Create the Neynar webhook (target `https://z.thezao.xyz/api/webhook`, cast.created, `mentioned_fids` and `parent_author_fids` = 19640) and set WEBHOOK_SECRET in Vercel; shipped = a mention shows in Inbox before the 5-minute poll | @Zaal | Dashboard + env | 2026-09-19 |
| Add Quick Auth for the in-Farcaster mini app path, lifting the zabalgames verifier per doc 2313; shipped = opening z.thezao.xyz inside the Farcaster app signs in silently | zaalcaster lane | PR | 2026-10-01 |
| Ask Neynar (support link on the app page) what the OAuth Clients tab is and whether it is a login replacement; shipped = answer pasted into this doc as an update | @Zaal | Message | 2026-09-24 |
| Close tracker `handoff:secrets-neynar-rotate` (rotation done 2026-09-17, 24h grace) | @Zaal | Tracker | 2026-09-18 |

## Sources

Neynar docs, fetched as markdown with `curl` from the `.md` URLs listed in `https://docs.neynar.com/llms.txt` (95,381 bytes) on 2026-09-17, read in full:
- [SIWN: Connect Farcaster accounts](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) - `[FULL, curl .md]`
- [Write Data with Managed Signers](https://docs.neynar.com/docs/integrate-managed-signers) - `[FULL, curl .md]`
- [Mini App Authentication](https://docs.neynar.com/docs/mini-app-authentication) - `[FULL, curl .md]`
- [Choose the Right Signer](https://docs.neynar.com/docs/which-signer-should-you-use-and-why) - `[FULL, curl .md]`
- [Sponsor Signers](https://docs.neynar.com/docs/two-ways-to-sponsor-a-farcaster-signer-via-neynar) - `[FULL, curl .md]`
- [Webhooks in Dashboard](https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard), [Verify Webhooks with HMAC Signatures](https://docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures) - `[FULL, curl .md]`
- [Rate Limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis) (includes the June 2026 plan note) - `[FULL, curl .md]`
- [Create in UI (agents)](https://docs.neynar.com/docs/create-farcaster-bot-ui), [Managing Onchain Wallets](https://docs.neynar.com/docs/managing-onchain-wallets), [Mini App Hosts Notifications](https://docs.neynar.com/docs/app-host-notifications), [Understanding Signers](https://docs.neynar.com/docs/understanding-signers-in-the-farcaster-protocol-balancing-security-and-convenience), [Quick Auth](https://docs.neynar.com/miniapps/sdk/quick-auth), [Why Farcaster Doesn't Need OAuth 2.0](https://docs.neynar.com/miniapps/blog/oauth), [Snapchain overview](https://docs.neynar.com/snapchain/overview) - `[FULL, curl .md]`
- [dev.neynar.com/pricing](https://dev.neynar.com/pricing) - `[PARTIAL: HTTP 200 but a 30 KB JS shell with no plan text; plan numbers taken from the rate-limits doc instead]`

Farcaster docs and relay:
- [AuthKit: createChannel](https://docs.farcaster.xyz/auth-kit/client/app/create-channel), [status](https://docs.farcaster.xyz/auth-kit/client/app/status), [verifySignInMessage](https://docs.farcaster.xyz/auth-kit/client/app/verify-sign-in-message) - `[FULL, curl + HTML strip]`
- `relay.farcaster.xyz` - `POST /v1/channel` (201, channelToken + url + nonce), `GET /v1/channel/status` with and without Bearer (200 pending / 401) - `[FULL, live probe 2026-09-17]`
- [farcasterxyz/auth-monorepo](https://github.com/farcasterxyz/auth-monorepo) - LICENSE file read (MIT); snapshot 68 stars, 46 forks, 29 open issues, last activity 2026-03-30 - `[FULL, gh api]`
- [neynarxyz/siwn](https://github.com/neynarxyz/siwn) - LICENSE file read (MIT); snapshot 4 stars, last commit 2024-10-01, README still points at the retired flow - `[FULL, gh api]`

Community (Farcaster casts read through the v2 cast search with Zaal's key, read-only):
- @shreyas-chorge (Neynar), 2026-09-07, `0x52ec05ce63efd31fa0368467692586b31362f25b` - `[FULL]`
- @10xchris.eth, 2026-08-08, `0xb660d9755d919b36346008eda2ae58aab94f7022` - `[FULL]`
- @antimofm.eth, 2026-08-03, `0x41d7963f92c5d2fe517b6a5184d073a51c0bbd9b`, 19 likes, 5 replies read - `[FULL]`
- Hacker News (Algolia keyless search, "neynar") - `[FAILED: every hit is the footballer Neymar; no relevant thread exists]`
- GitHub issues on neynarxyz repos for "siwn" / "signer" - `[FULL, gh search: 4 hits, all 2024, none about the retirement]`

Local: `zaalcaster` `lib.js`, `auth.js`, `api/auth.js`, `api/webhook.js`, `bin/mint-signer.js`; research docs 2313, 2087, 017, 910, 306, 1094 - `[FULL, local read]`
