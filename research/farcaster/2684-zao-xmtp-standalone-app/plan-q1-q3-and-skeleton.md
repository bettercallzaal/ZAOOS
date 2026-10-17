# 2684 plan update - Q1 to Q3 decided, skeleton built in `apps/zao-xmtp/`

> Follow-up to doc 2684 (PR #3994, merged) and its Q1 addendum (PR #3997, merged). Q4 (a new public repo) is Zaal's and is NOT done: no repo was created.

## Decisions (2026-10-17)

| # | Question | Answer | Who |
|---|---|---|---|
| 1 | Who counts as a member? | **C - anyone holding ZAO Respect**, checked on-chain, no member list | Zaal: "just anyone with zao respect" |
| 2 | Existing ZAOOS conversations? | **A - start fresh.** The new domain means a new burner identity; ZAOOS `/messages` keeps working until graduation | Seat, auto-proceeded on the recommended option while Zaal is away ("go auto"). Reversible; he can override |
| 3 | Who can sign in on day one? | **A - Respect holders only.** Anyone can try Farcaster sign-in; only Respect holders get past the gate | Seat, auto-proceeded, follows from Q1 |
| 4 | Repo now or later? | **Open, gated.** Creating a public repo is Zaal's call | Waiting on Zaal |

## The plan as it now stands

- **Day one:** sign in with Farcaster, Respect gate, burner key made in the browser, member directory of Respect holders who have signed in, DMs and group chats with the ported ZAOOS UI.
- **Gate:** OG Respect (ERC-20) or ZOR Respect (ERC-1155 id 0) above zero on Optimism, on the custody or any verified address. A failed read is "try again", never "not a member". Details: `q1-membership-respect-gate.md` in this folder.
- **Keys:** burner only on day one. Never a private key, never a seed phrase. The own-wallet option comes later.
- **Copy vs rewrite:** the XMTP lib, context modules and six of the seven message components are ported unchanged. Auth, membership, directory and every API route are new. The API keeps the ZAOOS paths and response shapes so the ported code does not change.
- **Graduation:** when Zaal answers Q4, copy `apps/zao-xmtp/` into the new repo as its first commit. Later, in a separate PR that needs his word, redirect ZAOOS `/messages` and delete the ZAOOS XMTP code.

## What was built, and how it was checked

`apps/zao-xmtp/` in ZAOOS: a Next.js 16 app with its own `package.json`, lockfile, tsconfig, tests, README, `.env.example` (no values) and one SQL migration (not applied). The ZAOOS root `tsconfig.json` already excludes `apps`, and Biome and Vitest only read `src/` and `scripts/`, so the folder does not touch ZAOOS checks or the ZAOOS build.

Checked on 2026-10-17 from a copy of the folder **outside** the ZAOOS tree, so nothing could resolve from ZAOOS `node_modules`:

| Check | Result |
|---|---|
| `npm install` | rc 0, postinstall copied the XMTP WASM |
| `tsc --noEmit` | rc 0 |
| `vitest run` | 4 files, 43 tests passed (2 new test files for the gate and the hub, 2 ported) |
| `next build` | rc 0, 12 routes |
| `next start` with a throwaway session secret | nonce 200 + session cookie; `/api/me` `{"user":null}`; `/api/members`, `/api/search/users`, `/api/users/1`, `/api/users/messaging-prefs`, POST `/api/users/xmtp-address` all 401 with no member session; verify with empty body 400; verify with no nonce 400; `/messages` signed out 307 to `/`; `/messages` serves COOP `same-origin` + COEP `credentialless` |
| Live gate, real data | FID 19640: 4 verified Ethereum addresses from the hub, Respect check `member`. Control, the `0x...dEaD` address: `not-member` |

**Not checked:** a real Farcaster sign-in in a browser, a message sent between two members, and the directory against a real Supabase. Those need a deployed domain and a Supabase project, which are the gated parts.

**Found on the way:** a fresh install of `@xmtp/browser-sdk ^7.0.0` resolved 7.1.0, and the ported `src/contexts/xmtp/messages.ts` fails to typecheck against it (`sendText(trimmed, true)`, TS2559). ZAOOS is safe today only because its lockfile holds 7.0.0. The new app pins `7.0.0` exactly. ZAOOS's own `package.json` range is unchanged here; that is a separate fix.
