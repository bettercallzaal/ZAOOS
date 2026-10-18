---
topic: farcaster
type: decision
status: graduated - the app lives at github.com/bettercallzaal/zao-xmtp
last-validated: 2026-10-18
related-docs: "074, 2680, 2245"
original-query: "can we make a new separate app that is just ZAO XMTP please (Zaal, relayed by the seat 2026-10-17)"
tier: QUICK
---

# 2684 - ZAO XMTP as its own app: what exists in ZAOOS, and a graduation plan

> Waits on Zaal: four scope questions at the bottom. No repo is created until he answers; a new public repo is his call.
>
> **Update 2026-10-17:** Q1 to Q3 are decided and the app skeleton is built in `apps/zao-xmtp/`. See `q1-membership-respect-gate.md` and `plan-q1-q3-and-skeleton.md` in this folder. Q4 (the repo) is still Zaal's.

> **Graduated 2026-10-18:** Zaal created the public repo `bettercallzaal/zao-xmtp`. The app's history (#4000, #4002) was pushed there as its first commits, and `apps/zao-xmtp/` was deleted from ZAOOS (Monorepo as Lab: no drift). Mentions of `apps/zao-xmtp/` in this folder are history; the code now lives at https://github.com/bettercallzaal/zao-xmtp. This folder stays in ZAOOS as the research record.

> **Update 2026-10-18:** whether XMTP fees apply today was re-checked against XMTP's own sources: UNKNOWN, no source newer than 2026-04-08 says mainnet launched. See `xmtp-fee-status.md`.

## Summary

ZAOOS already has a full XMTP messaging surface: DMs and groups between ZAO members at `/messages`, using an app-generated burner key per FID that never leaves the browser. It is 4,858 lines (`wc -l`, 2026-10-17, tests excluded) across the lib module, the context modules, seven components, one hook, one route and the types file. Most of it can be copied into a standalone app as-is. What has to be rewritten is everything that touches the ZAOOS session and the ZAOOS Supabase tables, because membership today is a row in the ZAOOS `allowlist` table.

One thing is not a code question and decides the plan: a burner key lives in the browser's localStorage for one origin. A new domain cannot read the ZAOOS key, so a member who opens the new app gets a new XMTP identity and does not see their existing ZAOOS conversations. See question 2.

## Step 1 - Inventory (read from `origin/main` on 2026-10-17)

| What | Where | State |
|---|---|---|
| SDK | `package.json:88` `@xmtp/browser-sdk ^7.0.0`; installed `node_modules/@xmtp/browser-sdk/package.json` reads 7.0.0 | BUILT |
| XMTP env | `src/lib/xmtp/client.ts` `XMTP_ENV = 'production'` | BUILT |
| WASM copy | `package.json:6` postinstall copies `@xmtp/wasm-bindings/dist/bindings_wasm_bg.wasm` to `public/` | BUILT |
| Next config | `next.config.ts:53` and `:89` list the XMTP packages; `:139` notes COOP/COEP lives in middleware | BUILT |
| Cross-origin isolation | `src/middleware.ts:89-96` decides which pages mount the provider (`/messages` always, `/chat` only with the flag); `:176-177` set COEP `credentialless` + COOP `same-origin`; `:109` CSP `wasm-unsafe-eval` | BUILT |
| Burner key | `src/lib/xmtp/client.ts` `getOrCreateLocalKey(fid)`: 32 random bytes from `crypto.getRandomValues`, stored in localStorage as `zaoos-xmtp-local-key-<fid>`, never sent to a server, holds no funds | BUILT |
| Own-wallet option | `client.ts` `createWalletSigner` + `src/hooks/useWalletXMTP.ts`: uses the wallet's `signMessage` callback only, never a private key | BUILT |
| Local DB encryption | `client.ts` `getDbEncryptionKey`: per-address key in localStorage, encrypts the SDK's browser store | BUILT |
| Client state | `src/contexts/xmtp/`: `connection.ts` (330 lines), `conversations.ts` (355), `messages.ts` (354), `members.ts` (296), `groups.ts` (170), `XMTPProvider.tsx` (342), `types.ts` (154); `src/contexts/XMTPContext.tsx` re-exports | BUILT |
| UI | `src/components/messages/`: `MessagesRoom` (466), `MessageThread` (417), `NewConversationDialog` (743), `ConversationList` (242), `GroupInfoDrawer` (227), `ConnectXMTP` (218), `MessageCompose` (153); page `src/app/(auth)/messages/page.tsx` | BUILT |
| Member discovery | `src/contexts/xmtp/members.ts:38` fetches `/api/members`, then `canMessage` on members' addresses (`:81`) | BUILT |
| Membership source | `src/app/api/members/route.ts:14-28`: session required, reads ZAOOS Supabase `allowlist` where `is_active`, joins `users.xmtp_address` | BUILT, ZAOOS-only |
| Address publish | `src/app/api/users/xmtp-address/route.ts`: session + Zod, writes `users.xmtp_address` for the session FID | BUILT, ZAOOS-only |
| FID auto-connect | `src/lib/xmtp/auto-connect-flag.ts`: on only when `NEXT_PUBLIC_XMTP_AUTO_CONNECT` is exactly `true`; default OFF. Last change PR #3965, 2026-10-16 | BUILT, FLAGGED OFF by default |
| Tests | `src/lib/xmtp/__tests__/client.test.ts`, `src/contexts/xmtp/__tests__/members.canmessage.test.ts`, `src/components/messages/__tests__/MessagesRoom.autoconnect.test.tsx`, two route tests under `src/app/api/users/xmtp-address/__tests__/` | `npx vitest run` on those paths, 2026-10-17, from the `feat/farcaster-visitor-role` checkout (not a fresh origin/main): 3 files, 32 tests passed |
| Payer wallet / history sync | A grep of `origin/main:src` for `payer`, `gatewayHost`, `sendSyncRequest`, `historySync` found nothing | NOT BUILT. Doc 074 (2026-03-19) recommended both; whether XMTP fees apply today: UNKNOWN as of 2026-10-18, see `xmtp-fee-status.md` |
| Research | Doc 074 (XMTP v3 browser SDK, MLS), `_archive/013-chat-messaging`, doc 2680 (lists XMTP as reused for DMs in the Farcaster client), doc 2245 (surface map) | - |

**What works in production: UNKNOWN.** I did not read the production value of `NEXT_PUBLIC_XMTP_AUTO_CONNECT` (Vercel is off-limits to lanes) and did not send a live message. "Works" above means built and unit-tested, nothing more.

## Step 2 - The standalone app

**Name and home (proposed):** repo `bettercallzaal/zao-xmtp`, MIT like ZAOOS, own domain later. Clone, `npm install`, `npm run dev`, no import from or call into ZAOOS.

**Day one does three things:**
1. A member signs in and gets an XMTP identity without a wallet popup (burner key), or connects their own wallet if they prefer (signature only).
2. A member directory showing which ZAO members are reachable on XMTP.
3. DMs and group chats between members, with the existing thread, compose and group-info UI.

Nothing else on day one: no feeds, no music, no agents.

**Stack:** Next.js 16, React 19, Tailwind v4 (navy `#0a1628`, gold `#f5a623`), `@xmtp/browser-sdk` 7, viem for the burner signer, Sign In With Farcaster for identity (FID is what the burner key is keyed on today), iron-session cookie. The membership store depends on question 1.

**Keys - unchanged rules:**
- Burner key generated in the browser, kept in localStorage, never sent to a server, never used on-chain, holds no funds.
- Own wallet only through `signMessage`. The app never asks for, accepts or stores a private key or seed phrase.
- New on day one: a visible warning that clearing site data loses the XMTP identity (doc 074 asked for this; it is not in the ZAOOS UI today), and an optional "link my wallet" step so the identity survives a lost browser.

**Copy versus rewrite:**

| Copy as-is (with an origin comment) | Rewrite |
|---|---|
| `src/lib/xmtp/client.ts` (rename the `zaoos-` storage prefixes only if question 2 says so) | Auth: ZAOOS `getSessionData` / iron-session setup becomes the app's own SIWF session |
| `src/contexts/xmtp/*` | `/api/members`: reads the ZAOOS `allowlist` table today; becomes the app's own membership check (question 1) |
| `src/components/messages/*` | `/api/users/xmtp-address`: writes the ZAOOS `users` table today; becomes the app's own table |
| `src/types/xmtp.ts`, the XMTP tests | Navigation hooks into ZAOOS (`CommandPalette`, `CommandCenterShell`, chat `Sidebar`, `app-manifest.ts`) are dropped |
| Middleware COOP/COEP + CSP lines, `next.config.ts` XMTP entries, the postinstall WASM copy | The FID auto-connect flag becomes the default path, not a flag |

**Graduation, per the Monorepo-as-Lab rule:** once the new app is live and members are on it, `/messages` in ZAOOS redirects to the new domain and the XMTP code is deleted from ZAOOS so the two do not drift. That deletion is a later, separate PR and needs Zaal's word; this doc does not schedule it.

## Step 3 - Scope questions for Zaal (recommended first)

1. **Who counts as a member?** A: the app keeps its own copy of the member list (its own Supabase, seeded once from the ZAOOS allowlist, then managed in the new app) - truly standalone. B: the app asks a small read-only ZAOOS endpoint "is FID X a member" - one live dependency. C: gate on an on-chain holding (for example Respect on Optimism, `community.config.ts:105`), no database for membership at all.
2. **What happens to conversations members already have in ZAOOS?** A: new app, new burner identity, start fresh, and ZAOOS `/messages` keeps working until graduation. B: members who want continuity link their own wallet in both apps so the same XMTP identity appears in each. C: build a one-time key handoff from ZAOOS to the new domain (moves a secret across origins - the most work and the most risk).
3. **Who can sign in on day one?** A: ZAO members only, everyone else sees a "members only" page. B: anyone with a Farcaster account can sign in, but only members appear in the directory and can start a chat. C: open to anyone, ZAO members get a badge.
4. **Repo now or later?** A: create `bettercallzaal/zao-xmtp` public once these are answered and port the code in one PR. B: create it private first, go public at graduation. C: build it inside ZAOOS under its own route first, and graduate later.

## Sources

- All file and line references: `git show origin/main:<path>` in ZAOOS, 2026-10-17 (FULL, read directly).
- Installed SDK version: `node_modules/@xmtp/browser-sdk/package.json`, 2026-10-17.
- Doc 074 recommendations: `research/farcaster/074-xmtp-v4-mls-encryption/README.md`, read this run. Its claims about XMTP fees and history sync are from 2026-03 and were not re-fetched (UNVERIFIED as of today).
