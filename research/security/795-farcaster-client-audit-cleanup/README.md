---
topic: security
type: audit
status: research-complete
last-validated: 2026-06-02
related-docs: "306, 308, 173, 017, 304"
original-query: "fix the auth-context admin-takeover bypass, then audit our Farcaster client and clean it up"
tier: STANDARD (two independent audit/research sub-agents + parent verification of every HIGH against source)
scope: "src/lib/auth/*, src/app/api/{auth,miniapp,neynar,casts}/*, src/lib/farcaster/*, src/hooks/{useAuth,useMiniApp}, src/components/{compose,social,miniapp}, public/.well-known/farcaster.json"
---

# 795 — Farcaster client security audit + cleanup

> **Goal.** A critical auth-bypass was found in the miniapp silent-auth route. After fixing it, sweep the whole Farcaster-client surface (identity, managed signers, Neynar integration, miniapp, feeds/casts) for anything in the same class, then clean up dead code and hygiene debt. Same bar as docs 770/794: concrete, file:line-cited defects, classified by severity, every HIGH verified against source.

## Method
One `general-purpose` audit sub-agent read the full client surface (auth/signer/neynar/casts routes + hooks + compose/social/miniapp components, ~40 files); one research sub-agent reconciled our Farcaster dependency stack against the mid-2026 ecosystem. The parent (this session) independently verified the crown-jewel credential paths against source (`session.ts`, `signer/save`, `neynar/cast`) and the manifest/notification/SDK-capability gaps against the actual code before trusting the research agent's inferences. Fixes shipped in three waves on branch `claude/amazing-cray-11bSV`.

---

## The kickoff bug — CRITICAL, fixed first

**`/api/miniapp/auth-context` minted a session (including admin) from an UNSIGNED body FID.**

The route accepted `{ fid }` in the POST body and called `saveSession({ fid, ... })`. `saveSession` (`src/lib/auth/session.ts:78`) derives `isAdmin` from `ADMIN_FIDS.includes(data.fid)`, and admin FIDs are public. So any unauthenticated caller could POST an admin's FID (allowlisted by definition) and receive a valid **admin** session cookie — a live account-takeover / privilege-escalation primitive. The route's own header comment acknowledged the trust gap.

**Fix.** Require an `Authorization: Bearer` QuickAuth JWT, verify it against the pinned manifest domain, and take the FID from the verified `payload.sub` — never the body. Invalid/absent token → 401, never a fallback to a body FID. Mirrors the known-good `/api/miniapp/auth`. QuickAuth is silent (a JWT, not a SIWF signature prompt), so the no-prompt UX is preserved. Clients (`MiniAppGate`, `miniapp/page`) now attach the token via `sdk.quickAuth.fetch`. 5 regression tests pin the closed bypass.

---

## (A) Security findings

| id | severity | file:line | problem | status |
|----|----------|-----------|---------|--------|
| auth-context | **CRITICAL** | `api/miniapp/auth-context/route.ts` | session (incl. admin) minted from unsigned body FID | ✅ fixed |
| A1 | **HIGH** | `api/auth/session/route.ts:11` → `lib/auth/session.ts:56` | `signerUuid` (managed-signer posting credential) serialized to the browser via `{ ...session }`, landing in `useAuth` React state app-wide. Only ever consumed client-side as `!!signerUuid`. | ✅ fixed |
| A2 | MED | `middleware.ts` | `/api/casts` absent from the rate-limit table — destructive `casts/delete` and the paid `casts/summary` (Neynar AI) endpoint were unthrottled. | ✅ fixed |
| A3 | LOW (fail-open) | `api/auth/signer/status/route.ts:21-33` | An `approved` signer was bound to the session even when Neynar returned no `fid`, unlike `signer/save` which fails closed. A caller supplying an arbitrary `signer_uuid` could bind an unassociated signer. | ✅ fixed |
| A4 | LOW | `api/auth/siwe/route.ts:83` | SIWE domain validated against the client-controllable `Host` header, inconsistent with the SIWF/miniapp routes which pin to the configured domain. | ✅ fixed (prod pins to `NEXT_PUBLIC_SIWF_DOMAIN`; dev/preview fall back to host) |
| A5 | INFO | — | **IDOR surface is properly closed.** Every mutating Neynar route (`neynar/cast,like,recast,follow`, `casts/delete`, `users/mute,block`) derives `signer_uuid` from the **server session**, never the body — a user cannot act as another FID. `signer/save` verifies `fid === session.fid` AND re-checks ownership with Neynar. `miniapp/webhook` verifies the Farcaster signature via `parseWebhookEvent(raw, verifyAppKeyWithNeynar)`. | verified sound |

### A1 fix detail — the `toPublicSession` boundary

The fix added `toPublicSession()` in `lib/auth/session.ts`, which strips `signerUuid` and is applied at **every** server→client boundary:
- `/api/auth/session` response (covers `useAuth` → `ChatRoom`, `SocialPage`, `Sidebar`),
- the `settings/page.tsx` server-component prop handoff (covers `SettingsClient`, which otherwise serialized the uuid into the RSC payload).

A new client-safe `hasSigner: boolean` on `SessionData` replaces every `!!signerUuid` read. Regression test asserts the raw uuid never appears in the response body.

## (B) Dead / duplicate code removed

- **B1** — deleted three unused exports from `neynar.ts` (`getNeynarUserScore`, `getUserCasts`, `getMuteList`); zero callers repo-wide.
- **B2** — `/api/miniapp/auth` (GET) and `/api/miniapp/auth-context` (POST) were ~90% identical. Extracted `lib/auth/miniapp-quickauth.ts` (`authenticateMiniappToken` + `extractBearerToken`); both routes are now thin wrappers. This also propagated the integer-FID guard and the FID-not-found check to the GET route, which lacked them.
- **B3 / C1** — `neynar/{cast,like,recast,follow}` hand-rolled `fetch` with `process.env.NEYNAR_API_KEY!` (non-null assertion bypassing the validated `ENV` accessor). Routed all four through `neynar.ts` lib helpers (new `publishCast`, `reactToCast`/`likeCast`/`recastCast`, existing `followUser`); the API key is now read once via `ENV`.

## (C/D) Hygiene

- **C4** — `casts/{delete,summary}` parsed `request.json()` outside try/catch (raw 500 on a bad body). Moved inside → clean 400.
- **C3** — `useMiniApp` `composeCast` error now uses `logger.error`, not `console.error`.
- **D3** — SIWE nonce TTL aligned to 15 min (matching `/api/auth/verify`; both share `auth_nonces`).
- **Manifest** — added `canonicalDomain` + minimal `requiredCapabilities: ["actions.ready"]` to `.well-known/farcaster.json`.

### Deliberately deferred (with rationale)
- **C2 — return types on the 34 raw-fetch `neynar.ts` read wrappers.** They return untyped `res.json()`; ~100 call sites consume it as `any` with property access. `Promise<unknown>` would break the build, and writing accurate response interfaces for ~30 Neynar endpoints is a separate typing project disproportionate to a LOW finding. New write helpers added this audit are fully typed.
- **D2 — `ApiResponse<T>` shape consistency.** Per `.claude/rules/typescript-hygiene.md`, applies to NEW routes only; not retrofitting shipped ad-hoc shapes.

---

## Ecosystem reconciliation (research agent vs. reality)

The research agent inferred capabilities from the task description; **ground-truthing against the code corrected most of its "gaps."** What ZAOOS already has:

| Claimed gap | Reality |
|---|---|
| Notification send pipeline ("biggest gap") | **Built** — `notifications/send` reads `notification_tokens`, rate-limits, batches by URL, POSTs sends |
| composeCast / viewProfile / viewCast / addMiniApp | **All in `useMiniApp.ts`** |
| Haptics + capability gating + `sdk.back` | **Present** (haptics gated by `getCapabilities()`) |
| QuickAuth modern API | **Using `sdk.quickAuth.fetch()`** |
| Mutes / blocks | **`users/mute` + `users/block` exist** |
| Manifest `accountAssociation` + `miniapp` key | **Already signed + present** |
| `@farcaster/hub-nodejs` deprecated? | **No** — still canonical typed client (0.16.0 pub 2026-05-21); used by `bot/` + `scripts/`, not `src/` |

**Genuinely open (deferred, not in scope here):**
- `miniapp-sdk` 0.2.3 → 0.3.0 (breaking: Zod v4 + ox 0.14) — M, defer.
- `@neynar/nodejs-sdk` 3.137 → 3.175 — **moot for the client**: not imported in `src` (we use raw `fetch`); only relevant to `bot/`.
- SIWF **Auth Address** support for Base smart wallets — verify `verifySignInMessage` accepts auth-address sigs (likely fine on `auth-client` 0.7.1).

Dependency versions are otherwise current; **nothing in the stack is deprecated.**

---

## Shipped commits (branch `claude/amazing-cray-11bSV`)
1. auth-context bypass fix + 5 regression tests
2. wave 1 — security/correctness (A1–A4, C4)
3. wave 2 — dead code + dedup (B1, B2, B3/C1)
4. wave 3 — hygiene (C3, D3, manifest)

All waves: typecheck clean, affected route tests green. No CRITICAL findings remained after the auth-context fix.

## See also
- `research/farcaster/796-zaoos-farcaster-client-architecture/` — how the client is built (companion doc).
- `.claude/rules/secret-hygiene.md`, `pii-hygiene.md`, `api-routes.md` — the rules this audit enforces.
