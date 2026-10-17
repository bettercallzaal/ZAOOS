# ZAO XMTP

Private, end-to-end encrypted messages between ZAO Respect holders, on XMTP.

This folder is a self-contained app. It does not import from ZAOOS and does not call ZAOOS. It lives in `apps/zao-xmtp/` only until it gets its own repo (the plan is in ZAOOS research doc 2684). To move it, copy this folder; nothing outside it is needed.

## Who can get in

Anyone holding ZAO Respect: a balance above zero of **OG Respect** (ERC-20, `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`) or **ZOR Respect** (ERC-1155 id 0, `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`), both on Optimism, on the custody address or any verified Ethereum address of their Farcaster account.

Sign-in flow (`src/app/api/auth/verify/route.ts`):

1. Sign In With Farcaster. The server checks the signature against the session nonce and `APP_DOMAIN`.
2. The server reads the FID's verified Ethereum addresses from a Farcaster hub (`src/lib/hub.ts`).
3. One multicall on Optimism reads both balances for every address (`src/lib/respect.ts`).
4. Member: session starts (7 days, then the check runs again). No Respect: 403. **Could not check: 503 "try again", never "not a member".**

## Keys

- The XMTP signing key is an app-made burner key, generated in the browser with `crypto.getRandomValues`, stored in localStorage, never sent to a server, never used on-chain. It holds no funds.
- The app never asks for, accepts or stores a wallet private key or seed phrase.
- Clearing site data loses the XMTP identity and message history on that device. The sign-in page says so.
- The Respect check reads the member's Farcaster addresses, never the burner address.

## Run it

```bash
npm install          # postinstall copies the XMTP WASM into public/
cp .env.example .env.local   # fill in SESSION_SECRET, APP_DOMAIN, SUPABASE_*
npm run dev
npm run typecheck
npm test
npm run build
```

Directory table: apply `supabase/migrations/0001_members_seen.sql` to the app's own Supabase project. It is not applied anywhere yet.

## What is ported from ZAOOS and what is new

Ported with code unchanged (each file carries an origin line; ZAOOS is MIT, same author; em dashes in comments and one label became hyphens): `src/lib/xmtp/client.ts`, `src/contexts/xmtp/*`, `src/contexts/XMTPContext.tsx`, `src/types/xmtp.ts`, `src/components/messages/*` except `ConnectXMTP.tsx`, `src/hooks/useMobile.ts`, `src/hooks/useFocusTrap.ts`, `src/lib/format/timeAgo.ts`, and two test files.

New for this app: the Respect gate, the hub reads, the session, the directory, every API route, the sign-in page, and four small stand-ins that keep the ported UI unchanged (`useAuth`, a wallet hook that reports no wallet, an auto-connect flag that is always on, and a burner-only `ConnectXMTP`).

The API routes keep the ZAOOS paths and response shapes (`/api/members`, `/api/users/xmtp-address`, `/api/search/users`, `/api/users/[fid]`, `/api/users/messaging-prefs`) so the ported context code works unchanged.

`@xmtp/browser-sdk` is pinned to exactly `7.0.0`, the version the ZAOOS lockfile holds. A fresh install of `^7.0.0` resolved 7.1.0 on 2026-10-17, and the ported `messages.ts` does not typecheck against it (`sendText(text, true)` no longer accepts a boolean).

## Not built yet

- The own-wallet option (sign with your wallet instead of a burner key).
- Message history sync across devices, and an XMTP payer wallet (ZAOOS doc 074).
- Stored messaging preferences (the defaults are served: members-only DMs).
- A Content-Security-Policy header.
- Moving ZAOOS `/messages` users over: per Zaal's 2026-10-17 choice, members start fresh here and ZAOOS `/messages` keeps working until graduation.

## Credits

XMTP client code ported from ZAOOS (`bettercallzaal/ZAOOS`, MIT). Uses `@xmtp/browser-sdk` (XMTP, MIT), `@farcaster/auth-kit` and `@farcaster/auth-client` (Farcaster, MIT), viem (MIT), iron-session (MIT). Default hub `https://haatz.quilibrium.com`, the one ZAOOS reads first.
