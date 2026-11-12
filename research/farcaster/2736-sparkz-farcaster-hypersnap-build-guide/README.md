---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-11-12
related-docs: "farcaster/2418-hypersnap-state-and-zao-feasibility, farcaster/2666-hypersnap-hard-fork-protocol-layer-oct2026, farcaster/2680-zao-farcaster-client-2026, farcaster/2498-neynar-2026-surface-after-siwn, business/1225-sparkz-fc-first-access-gating, security/2087-farcaster-admin-auth-siwf"
original-query: "kkeep[ up daitng sparks reivewi more hypernspa clients and reseach anopensource and ptu it all together in a /zao-research we can share with iman thru the desk and give him alot mre info we learned so he can build it"
tier: DEEP
---

# 2736 - Sparkz build guide for Iman: Farcaster sign-in, Hypersnap and open-source clients

> **Goal:** Give Iman one document with everything the Sparkz lanes learned on 11 and 12 Nov 2026. It covers sign-in, the iPhone shell, Hypersnap, the open-source Farcaster clients worth copying from, and Neynar's 2026 terms, so he can build the next Sparkz steps without re-doing the research.

Written 2026-11-12 by the sparkz lane. It combines three sources: the Sparkz repo at main `7d9611b`, the iman-desk research notes 06, 07 and 08 from 12 Nov (in iman-desk's scratchpad, not committed anywhere), and a fresh DEEP web pass the same evening. Every claim is tagged with the surface it came from. [Certain] means read or measured on 12 Nov. [Likely] means a strong inference. [Unconfirmed] is listed so nobody builds on it.

**Read this first: Hypersnap forked from Snapchain today.** Hypersnap's `docs/shuttle.md` sets the gossip cutover at about 2026-11-12 20:52 UTC. The public Hypersnap node (haatz.quilibrium.com) reported heights past all three shard cutover heights at about 23:11 UTC [Likely, from comparing the two numbers; no fork event was observed]. Hypersnap and Snapchain are now two validator sets, with a "shuttle" relaying signed user messages between them. Cassie Heart, issue #51: "the two forks will drift". Anything Sparkz reads from or writes to Hypersnap from now on lives on one side of that split.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **KEEP Sparkz sign-in as it is: Farcaster's sign-in relay, `verifySignInMessage`, then Sparkz's own HMAC cookie.** Do not move login to Hypersnap. | `verifySignInMessage` checks the FID against Optimism's IdRegistry through an RPC. It never touches a hub, so Hypersnap changes nothing for login [Certain, auth-monorepo source]. The fix shipped today, with `SPARKZ_SESSION_SECRET` set, is live: nonce 200, me 200, and the Farcaster QR code opens [Certain, 16:41 EST]. |
| 2 | **USE the session-secret cookie (option A) now. Session option C (a Supabase sessions table) waits until "sign out everywhere" is needed.** | Zaal ruled A on 12 Nov (vault #516 item 9). 9 of 19 open-source Farcaster apps sampled use the same pattern: verify once, then a cookie signed with an env secret (iman-desk note 08). C is the only option needing no secret and gives real revocation, but no Farcaster app was found using it, so there is no code to copy. |
| 3 | **FIX the iPhone sign-in return trip before the next TestFlight build.** That means `redirectUrl` to a link Sparkz owns, plus re-polling the relay on resume. | auth-monorepo #231 is still open: on Expo, sign-in completes only about 20% of the time after the user comes back from the Farcaster app. #108: iOS drops the deep link if the sign-in channel is created on tap. The fix pattern is three steps: create the channel before the tap, save the channel token, and poll on `appStateChange` [Certain, issues read]. |
| 4 | **USE the Hypersnap `/v2/farcaster/*` read API as a second backend behind one read adapter. Keep Neynar as the first backend for 30 days.** | haatz serves Neynar-shaped JSON with no key and open CORS (40 calls in a row, all 200) [Certain]. Neynar's hosts answer 402 with no key, and the free plan is 10M credits a month [Certain]. The fork (top of doc) means Hypersnap data may drift from Snapchain's, so it is a fallback, not the source of truth yet. |
| 5 | **SKIP gRPC. Talk to Hypersnap over HTTP only.** | `@farcaster/hub-nodejs@0.18.0` failed against haatz on both :3383 and :443 [Certain, own test]. The working clients (Quilcast, Fatline) use HTTP `/v1/submitMessage` with protobuf bytes. |
| 6 | **DO NOT build cast posting off Neynar yet.** | It needs a Sparkz-owned signer: either a gasless `KEY_ADD` or an Optimism KeyRegistry entry. It also needs protobuf message building and a choice of fork. Hypersnap's v2 signer write routes return 501 [Certain, hypersnap-docs-web]. This is a project, not a swap. |
| 7 | **BORROW patterns from MIT clients (Quilcast, Fatline, `farcasterxyz/client`, auth-monorepo examples). Do not copy code from Herocast (AGPL-3.0) or Space (GPL-3.0).** | Licences read from the LICENSE files [Certain]. Copying AGPL or GPL code into Sparkz would change Sparkz's licence obligations. |
| 8 | **TREAT FIDs as strings or BigInt everywhere new code touches them.** | Hypersnap "native" accounts get FIDs from 4,294,967,296 (2^32) upward, sent as JSON strings, and have no Optimism record [Certain, `/v1/nativeRegistration` live: `firstNativeFid` 4,294,967,296, 22-bit proof of work]. They cannot sign in through the official relay [Unconfirmed, but no IdRegistry record exists to check]. |

## 1. What Sparkz runs today (main `7d9611b`, read 12 Nov)

| Piece | Where | State |
|---|---|---|
| Session cookie | `src/lib/session.ts` | `sparkz_session`, HMAC over `{fid, exp}`, 7 days (`SESSION_MAX_AGE = 60*60*24*7`), refuses secrets under 32 characters, `SameSite=None; Secure` so it survives the mini-app iframe, and fails closed when the secret is unset [Certain] |
| Sign-in routes | `src/app/api/auth/{nonce,siwf,siwe,quick,me,logout}/route.ts` | Live. `POST /api/auth/siwf` with `{}` returns 400 from Zod, as it should [Certain] |
| Sign-in libraries | `package.json` | `@farcaster/auth-kit ^0.8.2`, `@farcaster/auth-client ^0.7.1`, `@farcaster/miniapp-sdk ^0.3.0` (npm latest is 0.4.0, published 2026-10-27), `next 16.2.10`, `viem ^2.55.4`, `wagmi ^3.7.3` [Certain] |
| Private alpha lock | `src/lib/alpha-access.ts` | `ALPHA_LOCK = true`. Only the admins plus Iman's FID 1057869 and his wallet can hold a session. Boost and join-the-team are closed, and reading stays open. It is checked only after a verified sign-in [Certain] |
| iPhone shell | `capacitor.config.ts` | Capacitor 8. The WebView loads `server.url = https://trysparkz.com`, so the page origin is the real domain and the SIWF domain check passes [Certain] |
| TestFlight | `scripts/testflight.sh` (#340 to #343) | Signs with the Xcode Apple ID and uploads with an App Store Connect API key through `altool`. It must run from a checkout that has `ios/`, which lives on branch `ios-testflight-build` (origin `65ff17b8`); main has no `ios/`. Builds 1, 2 and 4 are VALID; 3 was never uploaded [Certain, per iman-desk] |
| Free hat | `src/lib/hats.ts`, `src/app/api/hats/claim/route.ts` (#318) | No private key. Members claim through the tree's MultiClaimsHatter from their own wallet. Needs `HATS_MEMBER_HAT_ID`, `NEXT_PUBLIC_HATS_CLAIMS_HATTER` and `OPTIMISM_RPC_URL` set [Certain, `.env.example`] |
| Neynar | `src/lib/adapters/signal-source/farcaster.ts` (cast search), `agent/src/farcaster.ts` (posting through a managed signer) | Dark until `NEYNAR_API_KEY` is set [Certain, iman-desk note 07] |

## 2. What we learned building it (11 to 12 Nov)

1. **The session secret is Sparkz's own stamp, not a Farcaster key.** Farcaster answers "is this FID 19640" once, at sign-in. After that the cookie is the only proof. With `SPARKZ_SESSION_SECRET` unset, sign-in returned 503. Zaal set it in Vercel Production and Preview and redeployed, and the nonce endpoint has returned 200 since 15:20 EST. Anyone holding the secret can forge a session for any FID, so it never leaves Vercel.
2. **The last hop of sign-in is untested by any agent.** A real scan, then the siwf 200, then the cookie, then `me` showing a FID, all need a human Farcaster account. Vercel logs could not show it either: `vercel logs --since 3h` returned 0 records even for a known request. Zaal or Iman runs it once on trysparkz.com/profile.
3. **The alpha lock changes what the site shows.** `/c/<any slug>`, including a made-up one, now returns 200. A plain curl can no longer tell whether the seed data exists, so seed checks need a database read.
4. **Keep the iPhone project on a branch, and push it.** The `ios/` project lived only as 26 unpushed commits in a `/private/tmp` scratchpad until 12 Nov; a reboot would have erased build 4's project. Push before you stop.
5. **#318 removed the relayer.** The old go-live chain (a relayer wallet funded with ETH, plus `HATS_RELAYER_PRIVATE_KEY`) is gone. Members pay their own Optimism gas to claim.
6. **The default Farcaster sign-in link is now farcaster.xyz.** The relay returns `https://farcaster.xyz/~/siwf?channelToken=...`, and warpcast.com answers with a 301 to it. farcaster.xyz's apple-app-site-association claims `*` for the Farcaster iOS app, so the link is a universal link [Certain, iman-desk note 06, measured].

## 3. Sign-in inside the iPhone shell: what to build

| Step | What | Source |
|---|---|---|
| a | Create the relay channel on mount, not on tap. Then `window.open(url)` fires inside the tap, so iOS hands the universal link to the Farcaster app. auth-kit 0.8.2's `SignInButton` already does this when the channel exists before the tap | auth-monorepo #108; auth-kit 0.8.2 dist (note 06) |
| b | Set `redirectUrl` in the `AuthKitProvider` config to a link Sparkz owns. Prefer an https universal link on trysparkz.com; `sparkz://auth` is the fallback. Register it in Info.plist or the associated domains, and handle Capacitor `appUrlOpen` | The official client snapshot calls `Linking.openURL(signatureParams.redirectUrl)` after approval, with no https check on that path (snapshot 2026-10-30, `SignInWithFarcaster.tsx`) [Certain for the snapshot; production may differ]. The relay accepts any string [Certain, note 06] |
| c | Save the `channelToken`, and on `appStateChange` to active call `GET relay.farcaster.xyz/v1/channel/status`, retrying 3 times on network error. auth-kit polls every 1.5 s for 5 minutes and has no resume handling | auth-kit 0.8.2 source; #231 (open) |
| d | Pin `domain: "trysparkz.com"` and `siweUri: "https://trysparkz.com/profile"` (the page that holds the button; `/login` returns 404) in the provider config instead of relying on `window.location` | `verifySignInMessage` compares the domain as an exact string; a `www.` or `capacitor://localhost` origin fails with "Invalid domain" (note 06) |
| e | Inside a Farcaster mini app, do not render the auth-kit button. Call `sdk.actions.signIn({nonce})` and post to `/api/auth/siwf`, or use Quick Auth | miniapps.farcaster.xyz sign-in docs. Quick Auth works only inside a mini-app host, so the Capacitor shell keeps the relay flow |
| f | App Review: check guideline 4.8 (login services; Farcaster-only login may need Sign in with Apple), 1.2 (user-generated content: report, block, filter), 5.1.1(v) (account deletion) and 4.2 (not just a wrapped website) | Apple guidelines [PARTIAL read]. Quilcast ships a WKWebView app with report, mute and block [PARTIAL] |

## 4. Hypersnap, as of 12 Nov

| Fact | Value | Tag |
|---|---|---|
| Repo | `farcasterorg/hypersnap`, GPL-3.0 (LICENSE file), 74 stars, last push 2026-11-12 08:56 UTC, commits by Cassandra Heart | [Certain] |
| Version | Live node and `Cargo.toml`: 0.17.5. GitHub Releases: v0.11.8 (2026-05-07), which is stale. hypersnap.org sample (2026-11-07): 0.16.0 | Contradiction, see section 8 |
| Node size | haatz `/v1/info`: 914.5M messages, 3.36M FID registrations, about 799 GB | [Certain] |
| Reads | `/v1/*` (castsByFid, userDataByFid, onChainSignersByFid, onChainEventsByFid) and `/v2/farcaster/*` (user, user/bulk, feed/trending, cast/search), no key, CORS `*` | [Certain, live] |
| Writes | `POST /v1/submitMessage` exists and parses protobuf; a garbage body gets 400 "Invalid protobuf data". Quilcast posts real casts this way | [Certain the route exists; no valid message was sent] |
| Signers | Onchain KeyRegistry on Optimism (custody wallet pays cents), or a gasless `KEY_ADD` (EIP-712 signed by custody, scoped, sliding TTL; protocol discussion #266) | [Certain, docs plus Quilcast] |
| Rate limits | None documented; haatz sits behind Cloudflare. hypersnap.org showed "1 of 4" public info endpoints online on 2026-11-07 | Do not assume redundancy |
| Running our own | 16 GB RAM, 4 cores, 1.5 TB disk, ports 3381 to 3383, snapshot sync up to 2 hours. Expose reads only, through a Cloudflare Tunnel with a secret header, never raw port 3381 (iman-desk note 07, section B5) | [Certain for specs] |

The /v2 shapes copy Neynar's on purpose, so one serializer can read both backends (hypersnap-docs-web introduction). That is what makes decision 4 cheap.

## 5. Libraries (npm registry, 12 Nov)

| Package | Latest | Published | Use for Sparkz |
|---|---|---|---|
| @farcaster/auth-kit | 0.8.2 | 2026-02-05 | Already in use; the React relay flow |
| @farcaster/auth-client | 0.7.1 | 2026-02-05 | Already in use; `verifySignInMessage` on the server |
| @farcaster/quick-auth | 0.1.0 | 2026-11-09 | Mini-app JWT path. 0.1.0 is a Zod 4 major bump; Sparkz uses Zod, so check compatibility before upgrading |
| @farcaster/miniapp-sdk | 0.4.0 | 2026-10-27 | Sparkz pins ^0.3.0; the upgrade is a separate PR |
| @farcaster/core | 0.21.0 | 2026-10-25 | Message builders, if Sparkz ever posts without Neynar |
| @farcaster/hub-nodejs | 0.18.0 | 2026-10-25 | gRPC; does not reach haatz. Skip |
| @farcaster/hub-web | 0.14.0 | 2026-10-25 | gRPC-web; untested |
| @neynar/nodejs-sdk | 3.177.0 | 2026-07-02 | Only if the Neynar adapter grows |

No `@farcaster/hypersnap` or `@farcaster/snapchain` package exists on npm. Hypersnap from TypeScript means plain `fetch` plus `@farcaster/core` builders.

## 6. Open-source Farcaster clients worth reading

Licence = the head of the LICENSE file, not the GitHub API field. Stars and dates are from 12 Nov.

| Project | Licence | Stars | Last commit | Stack | Sign-in | Reads via | Take from it |
|---|---|---|---|---|---|---|---|
| Quilcast (backmeupplz/quilcast) | MIT | 11 | 2026-11-12 | Preact web, Swift WKWebView iOS, Android WebView | Recovery phrase or wallet, gasless `KEY_ADD` | Hypersnap (haatz) | A WebView iPhone app sent to App Review; protobuf posting over HTTP |
| Fatline (danromero/fatline-monorepo) | MIT | 14 | 2026-11-11 | SwiftUI Mac and iPhone, Chrome extension, Cloudflare Worker | Recovery phrase once, posting key kept in Keychain | Neynar, or any server answering Neynar plus Snapchain routes | A swappable backend setting |
| farcasterxyz/client | MIT (Neynar, Inc.) | 128 | 2026-10-30 | Expo and Next monorepo | It is the approver side of SIWF | Farcaster's closed production API | How the official app handles `redirectUrl` |
| auth-monorepo examples | MIT | 68 | 2026-11-09 | Expo, Next | SIWF relay | n/a | `authkit-expo-demo`: channel created before the tap |
| neynarxyz/create-farcaster-mini-app | MIT | 48 | 2026-11-03 | Next | Mini-app SDK plus Neynar | Neynar | Mini-app manifest setup |
| Herocast (hero-org/herocast) | AGPL-3.0 | 91 | 2026-06-25 | Next, Supabase | Neynar managed signers | Neynar | Ideas only; no code copying |
| Space (blankdotspace/space-system) | GPL-3.0 | 42 | 2026-02-03 | Next, Supabase (a Herocast fork) | Neynar | Neynar | Ideas only |
| Litecast (dylsteck/litecast) | MIT | 69 | 2026-01-15 | Expo | Neynar | Neynar | Small Expo client |
| Selfcaster (GenuineJack/selfcaster) | MIT | 7 | 2026-10-17 | Next, one-click Vercel | Neynar signer | Neynar | One-click deploy |
| Opencast (stephancill/opencast) | MIT | 195 | 2024-09-19 | Next | n/a | Own indexer plus hub | Stale; reference only |

How these apps keep users signed in (iman-desk note 08, 19 apps sampled): 9 use an app-held secret over a cookie or JWT (the Sparkz pattern), 4 use a Quick Auth JWT as the whole session, 3 use Supabase Auth (xupersplit bridges Quick Auth into Supabase with `generateLink`), and 2 keep client-only state. 0 used a database sessions table.

## 7. Neynar in late 2026

| Fact | Value | Tag |
|---|---|---|
| Ownership | Neynar acquired Farcaster from Merkle (reported 2026-01-21). Network School then announced it is acquiring Farcaster (2026-10-15; doc farcaster/2680) | [PARTIAL for Jan, search snippets only; Certain for Oct, per 2680] |
| Free plan | 10M credits a month, 600 requests a minute per endpoint, cast search 120 a minute | [PARTIAL, rate-limits page] |
| Paid | Scale $249 a month (60M credits). Starter $9 and Growth $49 closed to new customers since June 2026 | [PARTIAL] |
| No key | `hub-api`, `snapchain-api` and `api.neynar.com` return 402 with an x402 offer of 0.01 USDC on Base | [Certain, live] |
| SIWN | Deprecated; no new connections after 2026-08-14 | [PARTIAL, docs] |
| Kafka stream | Retired Aug 2026 | [PARTIAL] |

## 8. Contradictions, not resolved

- **Hypersnap version:** v0.11.8 on the Releases page, 0.17.5 on the live node and in `Cargo.toml`, 0.16.0 in the hypersnap.org sample. Trust the node's `/v1/info`.
- **Hypersnap writes:** the hypersnap-docs-web pages (about April 2026) say submission is gRPC only, but Quilcast (Nov 2026) posts protobuf to HTTP `/v1/submitMessage`. The docs are stale on this.
- **FIP number:** the Snapchain CLI README calls gasless `KEY_ADD` "FIP-272", but protocol discussion #272 is validator onboarding and #266 is "Snapchain Signers".
- **Who maintains Hypersnap:** hypersnap.org says Felirami and Arca run the site; the node commits are Cassie Heart's. Both can be true (the site versus the node).
- **Library doc 2418** recommended vanilla Snapchain over Hypersnap if self-hosting (Aug 2026). This doc recommends Hypersnap's /v2 for reads only, because only Hypersnap has the Neynar-shaped API. That reverses 2418 for reads; for running a node, 2418 stands until the fork settles.

## 9. Ranked build plan for Iman

| # | Build | Size | Depends on |
|---|---|---|---|
| 1 | Run one real Farcaster sign-in on trysparkz.com/profile and confirm `/api/auth/me` shows the FID | XS | Nothing |
| 2 | iPhone sign-in return trip: steps 3a to 3d | S | A device test after #1 |
| 3 | `fcRead()` adapter: Neynar v2 first, Hypersnap haatz `/v2/farcaster/*` second, 2 s timeouts | S | One test each of `/user?fid=` and `/cast/search` |
| 4 | Mini-app sign-in through `sdk.actions.signIn` into `/api/auth/siwf` (step 3e) | M | #1 |
| 5 | Handle FIDs as strings or BigInt in new code | S | Nothing |
| 6 | App Review checklist (step 3f) before an external TestFlight or App Store submit | S | Zaal decides on a public beta |
| 7 | Session option C (Supabase sessions table) for revocation | M | A need for "sign out everywhere" |
| 8 | Posting without Neynar (gasless `KEY_ADD`, protobuf, submitMessage) | L | A choice of fork after the 2026-11-12 split |

## Also See

- [farcaster/2418 - Hypersnap state and ZAO feasibility](../2418-hypersnap-state-and-zao-feasibility/)
- [farcaster/2666 - The Hypersnap hard fork: the protocol layer](../2666-hypersnap-hard-fork-protocol-layer-oct2026/)
- [farcaster/2680 - A ZAO Farcaster client after the Network School deal](../2680-zao-farcaster-client-2026/)
- [farcaster/2498 - Neynar's 2026 surface after SIWN](../2498-neynar-2026-surface-after-siwn/)
- [business/1225 - Sparkz Farcaster-first access gating](../../business/1225-sparkz-fc-first-access-gating/)
- [security/2087 - Farcaster admin auth with SIWF](../../security/2087-farcaster-admin-auth-siwf/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| One real Farcaster sign-in on trysparkz.com/profile; done when `/api/auth/me` returns his FID | Iman | Test | 2026-11-14 |
| Sparkz PR: sign-in channel on mount, `redirectUrl`, resume re-poll and pinned domain (section 3, a to d); done when it is merged and a TestFlight build signs in on a phone | Iman | PR | 2026-11-21 |
| Sparkz PR: `fcRead()` adapter with a Neynar plus Hypersnap fallback; done when it is merged with a test of each backend | Iman | PR | 2026-11-28 |
| Decide whether Sparkz reads from the Hypersnap side after the fork, or waits a month to watch drift; done when the ruling is in the vault decisions log | Zaal | Decision | 2026-11-20 |
| Share this doc with Iman through iman-desk; done when iman-desk confirms it has sent it | iman-desk lane | Relay | 2026-11-13 |

## Sources

Read on 2026-11-12. [FULL] means read fully, [PARTIAL - what is missing] and [FAILED - what was tried]. PARTIAL web pages went through WebFetch and gh. The rest of the fetch ladder (exa, Playwright, Wayback) was not run on them, so their facts are tagged PARTIAL above.

1. [farcasterorg/hypersnap repo, commits, LICENSE](https://github.com/farcasterorg/hypersnap) [FULL]
2. [farcasterorg/hypersnap releases](https://github.com/farcasterorg/hypersnap/releases) [FULL]
3. [hypersnap docs/native-registration.md](https://github.com/farcasterorg/hypersnap/blob/main/docs/native-registration.md) [FULL]
4. [hypersnap docs/shuttle.md](https://github.com/farcasterorg/hypersnap/blob/main/docs/shuttle.md) [PARTIAL - first 50 of 107 lines]
5. [hypersnap issue #51, initial validators (community)](https://github.com/farcasterorg/hypersnap/issues/51) [PARTIAL - later comments cut at 500 characters]
6. [hypersnap-docs-web](https://github.com/farcasterorg/hypersnap-docs-web) [PARTIAL - webhooks, mini apps and retention pages unread]
7. [haatz.quilibrium.com /v1/info](https://haatz.quilibrium.com/v1/info), plus /v1 and /v2 reads and a garbage submitMessage, by own curl [FULL]
8. [hypersnap.org](https://hypersnap.org) [PARTIAL - summary only; /docs, /network and /updates not opened]
9. [farcasterxyz/snapchain releases](https://github.com/farcasterxyz/snapchain/releases) [FULL]
10. [Protocol discussion #266, Snapchain Signers](https://github.com/farcasterxyz/protocol/discussions/266) [PARTIAL - first 2,500 characters]
11. [backmeupplz/quilcast](https://github.com/backmeupplz/quilcast) [PARTIAL - README lines cut at 600 characters]
12. [danromero/fatline-monorepo](https://github.com/danromero/fatline-monorepo) [PARTIAL - first 60 to 70 lines of README, SERVER.md, LICENSE]
13. [farcasterxyz/client](https://github.com/farcasterxyz/client) [PARTIAL - targeted greps of a 115 MB repo]
14. [farcasterxyz/auth-monorepo](https://github.com/farcasterxyz/auth-monorepo) (relay, auth-client, authkit-expo-demo) [PARTIAL - excerpts; App.js FULL]
15. [auth-monorepo issue #108 (community)](https://github.com/farcasterxyz/auth-monorepo/issues/108) [PARTIAL - body cut at 900 characters]
16. [auth-monorepo issue #231 (community)](https://github.com/farcasterxyz/auth-monorepo/issues/231) [PARTIAL - body cut at 900 characters]
17. [auth-monorepo issue #171 (community)](https://github.com/farcasterxyz/auth-monorepo/issues/171) [PARTIAL]
18. [auth-monorepo issue #198 (community)](https://github.com/farcasterxyz/auth-monorepo/issues/198) [PARTIAL]
19. [farcasterxyz/quick-auth](https://github.com/farcasterxyz/quick-auth) [FULL README]
20. [Mini app sign-in action](https://miniapps.farcaster.xyz/docs/sdk/actions/sign-in) [PARTIAL - summary]
21. [Mini app Quick Auth](https://miniapps.farcaster.xyz/docs/sdk/quick-auth) [PARTIAL - aud and iss not in summary]
22. [Farcaster docs: create-channel](https://docs.farcaster.xyz/auth-kit/client/app/create-channel) [PARTIAL]
23. [npm registry: @farcaster/quick-auth](https://registry.npmjs.org/@farcaster/quick-auth), plus 15 other packages [FULL for fields printed]
24. [farcasterxyz/hub-monorepo](https://github.com/farcasterxyz/hub-monorepo) [PARTIAL]
25. [Neynar rate limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis) [PARTIAL - first 60 lines]
26. [Neynar SIWN doc](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) [PARTIAL]
27. [api.neynar.com 402 probe](https://api.neynar.com/v2/farcaster/user/bulk) [FULL, own curl]
28. [neynar.com/pricing](https://neynar.com/pricing) [FAILED - HTTP 404; dev.neynar.com/pricing returned 200, content not read]
29. [The Block: Neynar acquires Farcaster](https://www.theblock.co/news/deals/2026-01-21-haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app-386549) [PARTIAL - search snippet only]
30. [hero-org/herocast LICENSE](https://github.com/hero-org/herocast) [PARTIAL - LICENSE head and README grep]
31. [blankdotspace/space-system](https://github.com/blankdotspace/space-system) [PARTIAL]
32. [dylsteck/litecast](https://github.com/dylsteck/litecast) [PARTIAL]
33. [GenuineJack/selfcaster](https://github.com/GenuineJack/selfcaster) [PARTIAL]
34. [stephancill/opencast](https://github.com/stephancill/opencast) [PARTIAL]
35. [neynarxyz/create-farcaster-mini-app](https://github.com/neynarxyz/create-farcaster-mini-app) [PARTIAL - LICENSE head read]
36. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) [PARTIAL - first 100,000 of 114,428 characters]
37. [Capacitor App API](https://capacitorjs.com/docs/apis/app) [PARTIAL - no universal-link setup on that page]
38. [Kiwi News weekly, 17 Apr 2026 (community)](https://buttondown.com/kiwi-news-weekly/archive/kiwi-news-weekly-digest-apr-17-2026-4804/) [PARTIAL]
39. [vrypan: me and Farcaster (community blog, Nov 2025)](https://blog.vrypan.net/2025/11/08/me-and-farcaster-it-s-complicated/) [PARTIAL - dated a year back]
40. Hacker News Algolia, 4 queries (hypersnap, farcaster neynar, snapchain farcaster, sign in with farcaster) [FULL - no relevant results]
41. Reddit search [FAILED - "Your request has been blocked due to a network policy"]
42. bettercallzaal/sparkz at `7d9611b`: `src/lib/session.ts`, `src/lib/alpha-access.ts`, `capacitor.config.ts`, `scripts/testflight.sh`, `src/lib/hats.ts`, `.env.example`, `package.json` [FULL for lines cited]
43. iman-desk notes 06 (sign-in in the Capacitor shell), 07 (auth and Hypersnap) and 08 (session patterns), 12 Nov 2026, in iman-desk's scratchpad, not committed [FULL]
