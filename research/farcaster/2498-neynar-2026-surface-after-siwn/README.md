---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: 2313, 2087, 017, 910, 306, 1094, 2489
original-query: "prob we should /zao-research all the neynar docs"
tier: STANDARD
---

# 2498 - Neynar's 2026 surface for zaalcaster, after Sign In With Neynar was retired

> **Goal:** On 2026-09-17 Zaal turned zaalcaster's sign-in gate on and the Neynar widget answered "Sign In With Neynar has been retired. Developers should migrate to Neynar-managed signers." This doc reads Neynar's current docs (fetched as markdown from docs.neynar.com, never summarized by a model) and says what Neynar offers zaalcaster today: which sign-in to use, what managed signers are and cost, what the Mini App / Agents / OAuth Clients / App Wallet / Webhooks tabs on the app page do, what Snapchain URLs add, and where the credits stand. The zaalcaster lane is building the replacement sign-in at the same time; this doc is the reference it builds against.

> **CORRECTION, 2026-09-25 (central claim, was wrong):** This doc's original v1 said, in two places, that `NEYNAR_API_KEY` was **rotated 2026-09-17**. That did not happen. The secrets lane measured the same day, by hashing (never printing) each copy against the private source: `NEYNAR_API_KEY` is **seven distinct keys across ten locations**, not one key copied around. Rendering the migration would have repointed seven live apps at an eighth key, so the render step was deliberately **not run**, and Zaal ruled the one-key-or-per-app decision **parked until after ZAOstock** (`zao-vault/decisions/grill-2026-09-17-seat-evening.md`, `zao-vault/handoffs/status/secrets.md` line "2026-09-17 15:02 - RENDER NOT RUN"). The real tracker card `handoff:secrets-neynar-rotate` is still `todo`, due 2026-10-10. This doc's own v1 Next Actions row told the seat to close that card as done, and a tracker card (`research-action:2498`) was in fact auto-closed on that false premise - re-verified against Vercel on 2026-09-25: `NEYNAR_API_KEY` in the zaalcaster project shows `created 82d ago`, consistent with no rotation on 09-17 (which was 8 days ago) and inconsistent with the v1 claim. No key value was read, printed, or compared anywhere in this correction.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Sign-in for zaalcaster in a browser (PWA on Zaal's phone, desktop) | **USE Sign In With Farcaster over Farcaster's own relay (relay.farcaster.xyz), verified server-side. Not Neynar.** | Neynar's own doc says the replacement for SIWN is managed signers, and managed signers are a WRITE primitive: "Authorization: this is where an account gives the app certain access privileges", built on top of "Authentication... Sign in with Farcaster (SIWF)". zaalcaster only needs authentication: Zaal writes through the signer he already has, guests only read. Doc 2313 reached the same split for Sparkz on 2026-08-17. The relay was probed live: `POST /v1/channel` returns `{channelToken, url: https://farcaster.xyz/~/siwf?channelToken=..., nonce}`, `GET /v1/channel/status` needs the token as Bearer and 401s without it, and the completed state carries `fid, username, custody, message, signature, authMethod`. Zero npm dependencies, which is zaalcaster's hard rule. |
| 2 | Sign-in when opened inside the Farcaster app (mini app) | **ADD Quick Auth later, not now.** | Quick Auth is "a lightweight service built on top of Sign In with Farcaster" that hands the mini app a JWT; verifying it server-side means fetching Farcaster's JWKS and checking an ES256 signature. Doc 2313 already lifted a 107-line verifier from `ZAODEVZ/zabalgames lib/auth.mjs`. Zaal is testing as a PWA in Safari, where Quick Auth does not exist, so the relay path ships first. |
| 3 | Verifying the relay response | **Verify the SIWE message signature against the custody address, or state plainly that the relay is the trust anchor.** | Farcaster's `verifySignInMessage` checks domain + nonce + signature and accepts an auth-address signature when `acceptAuthAddress` is true. Doing that without a dependency needs secp256k1 recovery plus an IdRegistry read; the first zaalcaster slice trusts the relay over TLS with a per-channel secret token and an HMAC-bound nonce, and says so in code. Upgrade path recorded in Next Actions. |
| 4 | Managed signers for zaalcaster | **KEEP the one signer Zaal has. Do not build a signer-issuing flow for guests.** | Registering a managed signer needs the app's developer key (`FARCASTER_DEVELOPER_MNEMONIC` in Neynar's guide; `APP_SIGNER_PRIVATE_KEY` in `bin/mint-signer.js`, which already does the six-step flow) and a user tap in Warpcast. Sponsorship: Neynar pays and bills credits (`sponsored_by_neynar: true`), or the app pays if it holds 100+ warps. Guests never write in zaalcaster, so a guest signer is cost and liability with no feature behind it. |
| 5 | Webhooks | **STILL NOT DONE. DO NOW: create the webhook in the dashboard and set WEBHOOK_SECRET in Vercel.** | The receiver at `api/webhook.js` already verifies the `X-Neynar-Signature` HMAC-SHA512 header exactly as the docs specify and has been inert since 2026-07-07 for want of the secret. Re-checked 2026-09-25 via `vercel env ls` on the zaalcaster project: no `WEBHOOK_SECRET` or `NEYNAR_WEBHOOK_SECRET` var exists. The v1 deadline for this (2026-09-19) passed with nothing shipped. Free plan includes 10 webhooks. |
| 6 | Agents tab | **Not for zaalcaster. Relevant to ZOL only if ZOL wants a Neynar-hosted signer again.** | "Create Agent" mints a new Farcaster account with Neynar paying the account fee, restricted per developer account, and hands back a `signer_uuid`. Doc 910 moved ZOL to a self-custodied zero-cost Snapchain signer on purpose. |
| 7 | App Wallet tab | **SKIP until an onchain write is wanted.** | A `wallet_id` is "a server-side wallet that you fund with gas tokens" and is REQUIRED for `nft/mint`, `fungible/send`, `storage/buy`, `user/fid`, `user/` (register). zaalcaster's storage-status card reads; nothing buys. |
| 8 | OAuth Clients tab | **Undocumented. Ask before relying on it.** | `docs.neynar.com/llms.txt` (95,381 bytes, the full doc index) has no page for it; the only OAuth entry is a blog post arguing Farcaster does not need OAuth ("Skip OAuth flows - wallet signature = auth"). |
| 9 | Snapchain HTTPS / gRPC URLs | **Ignore for zaalcaster; they matter for a hub-level reader (ZOL, doc 910).** | They are the raw protocol node, keyed by the same API key. zaalcaster reads through the v2 REST wrapper in `lib.js` (`api.neynar.com/v2`). |
| 10 | Plan | **Stay on Free.** | Re-fetched 2026-09-25: Free is still 10M credits/month, 10 webhooks, 5 apps, 600 RPM per endpoint (unchanged since v1); Scale is $249/mo for 60M, 1200 RPM. Starter and Growth are closed to new customers, and the Free tier now shares the former Growth rate limits verbatim. The 0.03 percent credit-usage figure was read off the dashboard in v1 and was not re-read this round (would need the live key in a browser session); marked UNKNOWN for 2026-09-25 rather than repeated. |
| 11 | `NEYNAR_API_KEY` rotation | **DO NOT close the rotation card. It has not happened.** | Corrected 2026-09-25 - see the correction note under Goal. Real state: seven distinct key values across ten locations (Mac, VPS, Pi), migration to one source deliberately not rendered, rotation parked until after ZAOstock, tracker card `handoff:secrets-neynar-rotate` still `todo` due 2026-10-10. |

## Findings

### 1. What Neynar says about SIWN, verbatim from the doc page (markdown fetch, 2026-09-17, re-fetched and confirmed unchanged 2026-09-25)

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
| Set up | this page | API key with Rotate (24h grace unless "immediately revoke" is checked), Client ID, Snapchain HTTPS/gRPC URLs | **NOT rotated** (corrected 2026-09-25; v1 wrongly said "rotated 2026-09-17" - see the correction note) | - |
| SIWN | SIWN page (retired) | authorized origins, permissions | dead | dead |
| Mini App | "Mini App Hosts Notifications" is the only mini-app dashboard doc found | notification token handling for apps that HOST mini apps (a client like Warpcast), not for mini apps themselves | no | no |
| Agents | "Create in UI" | mint a bot account, Neynar pays the account fee, returns a `signer_uuid`; "we restrict the number of agents you can create per developer account" | no | only if ZOL abandons doc 910's self-custodied signer |
| OAuth Clients | none in llms.txt | unknown | still ask Neynar (re-checked 2026-09-25: `llms.txt` still carries no OAuth Clients page, only the "why Farcaster doesn't need OAuth" blog post; no answer recorded in the vault) | - |
| App Wallet | "Managing Onchain Wallets" | server-side wallet, `wallet_id`, funded with gas, required for mint / send / storage buy / register | not yet | maybe for storage buys |
| Webhooks (sidebar) | "Webhooks in Dashboard" + "Verify Webhooks with HMAC Signatures" | target URL + event filters; `X-Neynar-Signature` sha512 HMAC over the raw body | STILL NOT DONE (re-checked 2026-09-25: no `WEBHOOK_SECRET` in Vercel) | ZOL has its own listener |

### 6. Snapchain URLs

`https://snapchain-api.neynar.com` (HTTPS) and `snapchain-grpc-api.neynar.com:443` (gRPC, "meant to be used with the @farcaster/hub-nodejs SDK"), both authenticated with the same `x-api-key`. Snapchain is "the decentralized, peer-to-peer network that powers the Farcaster social network"; these are node endpoints, below the v2 REST API that hydrates users and reactions. `lib.js` uses the REST base `https://api.neynar.com/v2` for every read and write; nothing in zaalcaster needs raw messages. Doc 910's zero-cost self-custodied signer for ZOL is where a hub endpoint matters.

### 7. Plan and credits

From the rate-limits page, "Plan update (June 2026)": Free is 10M credits/month, 10 webhooks, 5 apps, 600 RPM per endpoint (cast search 120 RPM); Scale is $249/mo, 60M credits, 1200 RPM; Starter ($9) and Growth ($49) closed to new customers. Global limit 1,000 RPM on Free. Cast creation: under 1,000 casts per 24h has no storage requirement. The public pricing page at dev.neynar.com/pricing is a JS shell to curl (30 KB, no plan text), so the numbers here come from the docs page only. Re-fetched 2026-09-25: every one of these numbers is unchanged. "Zaal's dashboard: 0.03 percent of credits used" (v1) was not re-read this round - it needs a live dashboard session, not a doc fetch - so it is UNKNOWN as of 2026-09-25 rather than repeated as current.

### 7.5. The rotation correction, in full (2026-09-25)

v1 of this doc said, in the Plan decision and in Next Actions, that the key was rotated on 2026-09-17 and that the tracker card should be closed. Neither was true. `zao-vault/handoffs/status/secrets.md`, entry timestamped 2026-09-17 15:02 ("RENDER NOT RUN: NEYNAR_API_KEY is seven distinct keys, not one; render fix shipped as #283"): before rendering the migration, the secrets lane hashed each target's existing key against the private source, values never read or printed, and found **seven distinct keys across ten locations** - `ZAO OS V1/.env`; `zuke/juke-space-recap/.env`; `zuke/ZAOVideoEditor/.env` together with the VPS `farscout/.env`; `juke-space-recap/.env`; `private/neynar.env` with `private/farcaster-zaal.env`; `zao.env` with `zaoweb/.env.local`; `ZAO OS V1/.env.local`. Rendering would have repointed seven live apps at an eighth key, so it was deliberately not run. Zaal ruled the one-key-or-per-app decision parked to after ZAOstock (`zao-vault/decisions/grill-2026-09-17-seat-evening.md`). The tracker card `handoff:secrets-neynar-rotate` (`zao-tracker search "secrets-neynar-rotate"`) is `todo`, due 2026-10-10 - still open. A second tracker row, `research-action:2498:0ca4a5aae9` ("Close tracker `handoff:secrets-neynar-rotate` (rotation done 2026-09-1...)"), generated from this doc's own v1 Next Actions, shows `done` - it was closed on the strength of this doc's wrong claim, not on any real rotation. Independent confirmation without reading the key: `vercel env ls` on the zaalcaster project (2026-09-25) shows `NEYNAR_API_KEY ... created 82d ago`, which lands in early July, not 8 days ago as a 09-17 rotation would show.

### 8. What zaalcaster already has, from the code (re-read 2026-09-25, `main` at `40448ec`)

- `lib.js`: REST wrapper on `api.neynar.com/v2`, retries 429 with Retry-After, `getSignerInfo()` on `/farcaster/signer`. Unchanged.
- `auth.js` (`12c19e3`, 2026-09-17): cookie session HMAC-signed with `SESSION_SECRET` or a key derived from `NEYNAR_API_KEY`; gate on when `NEYNAR_CLIENT_ID` is set; locked on Vercel without a key. Unchanged since v1.
- **Updated 2026-09-25: `api/auth.js` no longer expects a SIWN callback - the relay flow shipped.** PR #138 ("feat(auth): Sign In With Farcaster over the relay, replacing retired SIWN") merged 2026-09-17, matching this doc's own Next Actions deadline exactly. Follow-up fixes landed the same week: #139 ("phone gets one button, computer gets the QR on the page") and #140 ("bind domain into the sign-in ticket, rate-limit siwf_start, make gate-off opt-in"), also 2026-09-17. `siwf.js` now carries the relay logic; a code comment there confirms decision 3 is still open: "NOT done: recovering the custody address from the SIWE signature (needs secp256k1 recovery, no dependency)" - the relay-trust decision is implemented as documented, not yet upgraded, and the doc's Next Actions deadline for that upgrade (2026-09-24) has passed with nothing shipped.
- `api/webhook.js`: HMAC-SHA512 receiver, inert until `WEBHOOK_SECRET` exists. **Still inert 2026-09-25** - `vercel env ls` shows no such variable.
- `bin/mint-signer.js`: the full managed-signer flow, already proven. Unchanged.
- Quick Auth (Next Actions deadline 2026-10-01, not yet due): no `quickAuth` or `quick-auth` reference anywhere in the repo as of 2026-09-25. Not started, but not yet late.

## Also See

- [Doc 2313](../2313-farcaster-auth-primitives-sparkz/) - the same three-way comparison for Sparkz, 2026-08-17, including the SIWN deprecation date and the zabalgames Quick Auth verifier.
- [Doc 2087](../../security/2087-farcaster-admin-auth-siwf/) - SIWF via auth-client for an admin path; this doc drops the dependency by talking to the relay directly.
- [Doc 017](../017-neynar-onboarding/) - managed signers and sponsorship, 2026-05.
- [Doc 910](../910-free-farcaster-posting-zol/) - ZOL's self-custodied Snapchain signer; why the Agents tab is not for ZOL.
- [Doc 306 (farcaster)](../306-farcaster-protocol-features-gap-analysis/) - 200+ Neynar endpoints mapped.
- [Doc 1094c](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/1094c-farcaster-protocol-updates/) - SIWN and agent-FID notes from July.
- [Doc 2489](../2489-zaalcaster-repos-research-surface/) - the zaalcaster surfaces this sign-in now gates.
- Tracker: `handoff:secrets-neynar-rotate` (status `todo`, due 2026-10-10) - **correction 2026-09-25: the rotation has NOT happened.** Do not close this card. See the correction note under Goal and section 7.5.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DONE 2026-09-17 - relay SIWF shipped in zaalcaster (`api/auth.js` POST actions `siwf_start` / `siwf_poll`, gate button opens the relay URL, session cookie on `completed`), confirmed via merged PR #138 plus follow-ups #139/#140 the same day | zaalcaster lane | PR + merge | 2026-09-17 - met |
| STILL OPEN, deadline passed - verify the SIWE signature server-side (custody or auth address) without a dependency, or record the relay-trust decision permanently in `auth.js`; `siwf.js`'s own comment still says this is not done; shipped = a tampered `fid` in a completed channel is rejected in a test | zaalcaster lane | PR | 2026-09-24 - missed, reset to 2026-10-08 |
| STILL OPEN, deadline passed - create the Neynar webhook (target `https://z.thezao.xyz/api/webhook`, cast.created, `mentioned_fids` and `parent_author_fids` = 19640) and set WEBHOOK_SECRET in Vercel; re-checked 2026-09-25, var absent; shipped = a mention shows in Inbox before the 5-minute poll | @Zaal | Dashboard + env | 2026-09-19 - missed, reset to 2026-10-02 |
| Add Quick Auth for the in-Farcaster mini app path, lifting the zabalgames verifier per doc 2313; not started as of 2026-09-25 but not yet due; shipped = opening z.thezao.xyz inside the Farcaster app signs in silently | zaalcaster lane | PR | 2026-10-01 |
| STILL OPEN, deadline passed - ask Neynar (support link on the app page) what the OAuth Clients tab is and whether it is a login replacement; no answer found in the vault as of 2026-09-25; shipped = answer pasted into this doc as an update | @Zaal | Message | 2026-09-24 - missed, reset to 2026-10-08 |
| DO NOT close tracker `handoff:secrets-neynar-rotate` - it is correctly still open (`todo`, due 2026-10-10). Rotate only after the one-key-or-per-app decision Zaal parked to after ZAOstock; shipped = one key confirmed across all ten locations, then rotated once, then card closed for real | @Zaal | Tracker + PR | 2026-10-10 |
| Re-open and correct the wrongly-closed tracker row `research-action:2498:0ca4a5aae9` ("Close tracker...rotation done 2026-09-17"), or annotate it as based on a since-retracted claim so a future reader does not treat it as proof of rotation | @Zaal | Tracker | 2026-09-26 |

## Sources

Neynar docs, fetched as markdown with `curl` from the `.md` URLs listed in `https://docs.neynar.com/llms.txt` on 2026-09-17, read in full, and RE-FETCHED 2026-09-25 for the SIWN retirement page, the rate-limits page, and `llms.txt` itself - all three confirmed byte-for-byte unchanged in substance (same retirement wording, same Free/Scale numbers, same absence of an OAuth Clients page):
- [SIWN: Connect Farcaster accounts](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) - `[FULL, curl .md, re-verified 2026-09-25]`
- [Write Data with Managed Signers](https://docs.neynar.com/docs/integrate-managed-signers) - `[FULL, curl .md, 2026-09-17]`
- [Mini App Authentication](https://docs.neynar.com/docs/mini-app-authentication) - `[FULL, curl .md, 2026-09-17]`
- [Choose the Right Signer](https://docs.neynar.com/docs/which-signer-should-you-use-and-why) - `[FULL, curl .md, 2026-09-17]`
- [Sponsor Signers](https://docs.neynar.com/docs/two-ways-to-sponsor-a-farcaster-signer-via-neynar) - `[FULL, curl .md, 2026-09-17]`
- [Webhooks in Dashboard](https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard), [Verify Webhooks with HMAC Signatures](https://docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures) - `[FULL, curl .md, 2026-09-17]`
- [Rate Limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis) (includes the June 2026 plan note) - `[FULL, curl .md, re-verified 2026-09-25, numbers unchanged]`
- [Create in UI (agents)](https://docs.neynar.com/docs/create-farcaster-bot-ui), [Managing Onchain Wallets](https://docs.neynar.com/docs/managing-onchain-wallets), [Mini App Hosts Notifications](https://docs.neynar.com/docs/app-host-notifications), [Understanding Signers](https://docs.neynar.com/docs/understanding-signers-in-the-farcaster-protocol-balancing-security-and-convenience), [Quick Auth](https://docs.neynar.com/miniapps/sdk/quick-auth), [Why Farcaster Doesn't Need OAuth 2.0](https://docs.neynar.com/miniapps/blog/oauth), [Snapchain overview](https://docs.neynar.com/snapchain/overview) - `[FULL, curl .md, 2026-09-17]`
- [dev.neynar.com/pricing](https://dev.neynar.com/pricing) - `[PARTIAL: HTTP 200 but a 30 KB JS shell with no plan text; plan numbers taken from the rate-limits doc instead]`

Local re-verification, 2026-09-25 (the source for the rotation correction and code-state updates):
- `~/zao-vault/handoffs/status/secrets.md` and `~/zao-vault/handoffs/secrets.md` - `[FULL, local read, no key value read or printed]` - the 2026-09-17 15:02 entry recording seven distinct keys, ten locations, render not run.
- `~/bin/zao-tracker search "neynar"` and `"secrets-neynar-rotate"` - `[FULL, local command]` - card `handoff:secrets-neynar-rotate` status `todo` due 2026-10-10; card `research-action:2498:0ca4a5aae9` status `done`, wrongly, on this doc's own v1 claim.
- `vercel env ls` on the zaalcaster project - `[FULL, local command, no value printed, only names/ages]` - `NEYNAR_API_KEY` created 82d ago; no `WEBHOOK_SECRET`/`NEYNAR_WEBHOOK_SECRET` present.
- `zaalcaster` repo at `~/Desktop/repos/zaalcaster`, `git log`, `main` at `40448ec` - `[FULL, local read]` - PRs #138/#139/#140 (relay SIWF, merged 2026-09-17), `siwf.js`, `auth.js`, `api/auth.js`, `api/webhook.js`, `bin/mint-signer.js` re-read for current state.

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
