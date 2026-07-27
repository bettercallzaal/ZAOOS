---
topic: security
type: decision
status: research-complete
last-validated: 2026-07-27
superseded-by:
related-docs:
original-query: "can we make this easier - the ADMIN_KEY-paste admin auth on zabalgamez.com/review doesn't seem like the most efficient way to do admin auth. /zao-research a better way (an admin auths by Farcaster FID from desktop AND phone, no shared key)."
tier: STANDARD
---

# 2087 - Farcaster admin auth: replace the ADMIN_KEY paste with Sign In With Farcaster

> **Goal:** Let a ZABAL Gamez admin (identified by their Farcaster FID on the allowlist) moderate from desktop OR phone with a "Sign in with Farcaster" button - no shared ADMIN_KEY to paste, no mini-app registration required.

## Key Decisions (recommendations first)

1. **USE Sign In With Farcaster (SIWF) via `@farcaster/auth-client` for the desktop/web admin path.** It is the framework-agnostic (vanilla-JS) version of AuthKit, works on a plain web page (no mini-app registration), and gives a "Sign in with Farcaster" QR flow that works on desktop (scan with phone) and in-app. The server verifies the signed message with `verifySignInMessage()` and checks the returned FID against the existing allowlist (`Set([19640, 1057869])` in `lib/auth.mjs`). This is exactly the missing piece: today `verifyAdmin` accepts a Quick Auth JWT (only produced inside a registered mini app, which zabalgames is NOT) or a Bearer ADMIN_KEY (clunky, maybe unset) - so admins are effectively locked out on the web. SIWF fills the web gap.
2. **KEEP the ADMIN_KEY Bearer path as a fallback/circuit-breaker during rollout, then remove it.** `verifyAdmin` already supports both; add SIWF as the primary, leave ADMIN_KEY working until SIWF is proven, then drop the shared secret.
3. **DO NOT block on registering the site as a Mini App.** Registration (the `fc:miniapp` embed + `/.well-known/farcaster.json` manifest) is only needed for the in-Warpcast Quick Auth path and for the app to appear in "Your Apps". It is a nice future add (gives phone users a native in-app auth), but SIWF alone solves the actual problem on every surface. Treat mini-app registration as a separate, later enhancement.
4. **SKIP Neynar SIWN for this.** SIWN returns a `signer_uuid` for writing casts on the user's behalf - useful if the admin action posted AS the app, but overkill for "is this FID an admin." It adds a Neynar dependency + managed signer for no gain here.

## Findings

### Why the current setup fails

`verifyAdmin(req, domain)` (lib/auth.mjs) accepts **either** a Farcaster Quick Auth JWT whose FID is on the allowlist, **or** a Bearer `ADMIN_KEY`. Neither works for a normal admin on the web:
- **Quick Auth** only exists inside a **registered Mini App** running in a Farcaster client - and zabalgames is not registered (casting `zabalgamez.com/review` just renders a link preview; it never launches in-app). So the primary path never triggers.
- **ADMIN_KEY** requires pasting a shared secret into a desktop field, and it may not even be set in the Vercel env. Shared secret + manual paste = the friction Zaal flagged.

Result: the admin (FID 19640, on the allowlist) cannot moderate - the go-live blocker (deleting the 3 QA test entries) is stuck behind this.

### The options

| Approach | Desktop | Phone | Mini-app reg? | Shared secret? | Server verify | Fits static HTML + Vercel edge? | Effort |
|---|---|---|---|---|---|---|---|
| **SIWF + `@farcaster/auth-client`** | Yes (QR) | Yes | No | No | `verifySignInMessage()` (domain+nonce+sig) | Yes (vanilla JS) | Medium |
| Quick Auth | in-app only | Yes (in Warpcast) | effectively yes (SDK needs mini-app context) | No | `verifyJwt()` (simplest) | only inside a mini app | Medium |
| Neynar SIWN | Yes | Yes | No | No | signer_uuid + FID | Yes | Low-Med (adds Neynar) |
| Current ADMIN_KEY | Yes (paste) | No | n/a | Yes | Bearer check | Yes (in place) | Zero |

SIWF is the only option that gives a keyless, FID-based admin login on a plain desktop web page without registering a mini app. (Quick Auth is the cleaner server-verify, but its client SDK expects the mini-app context - so it is the right choice only once/if the site is registered as a mini app, as a later add.)

### Implementation sketch (static HTML + Vercel Edge)

**Client (review.html):** a "Sign in with Farcaster" button that runs the auth-client connect flow, shows the QR, polls for completion, then POSTs the signed message to a verify endpoint and stores the returned session token for moderation calls.

```
import { createAppClient, viemConnector } from "@farcaster/auth-client";
const client = createAppClient({ relay: "https://relay.farcaster.xyz", ethereum: viemConnector() });
const { channelToken, url } = await client.connect();   // show `url` as a QR + "open in Warpcast"
// poll client.status(channelToken) until status === "completed" -> POST status.response to /api/admin/verify
```

**Server (`api/admin/verify.mjs`, Vercel edge):** verify the SIWF message, check the FID against the allowlist, issue a short-lived session token the existing `verifyAdmin` will accept.

```
const { success, fid } = await client.verifySignInMessage({ domain, nonce, message, signature });
if (!success || !isAdminFid(fid)) return json({ ok:false }, 403);
// mint a short-lived JWT (jose) with { fid }; verifyAdmin accepts it going forward
```

Then `verifyAdmin` gains a third accepted credential (the SIWF session JWT), alongside the Quick Auth JWT and the ADMIN_KEY fallback. The FID allowlist logic is unchanged. `@farcaster/auth-client` is v0.7.1 (published ~2 weeks before this doc - current), which matters because Farcaster auth moves fast: re-verify the API surface at build time.

## Also See

- `lib/auth.mjs` in ZAODEVZ/zabalgames - `verifyAdmin` + `isAdminFid` (the allowlist this plugs into).
- ZABAL Gamez priority-week bundle (`.handoffs/session-2026-07-27-zabalgamez-priority-week/`) - the go-live blocker this unblocks.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the SIWF admin-auth PR on ZAODEVZ/zabalgames (auth-client button on /review + `api/admin/verify` edge fn + verifyAdmin accepts the SIWF session JWT); keep ADMIN_KEY as fallback; open for Zaal to review (do NOT auto-merge live auth) | @Zaal (assistant opens PR) | PR | 2026-07-29 |
| After merge, delete the 3 QA test entries via the new "Sign in with Farcaster" flow, then Reset all votes (the go-live blocker) | @Zaal | Manual | 2026-07-30 |
| Once SIWF is proven, remove the ADMIN_KEY Bearer fallback (drop the shared secret) | @Zaal | PR | 2026-08-06 |
| Later/optional: register the site as a Mini App (fc:miniapp embed + farcaster.json) for native in-Warpcast Quick Auth | @Zaal | PR | wontfix (revisit-on-need) |

## Sources

- [Sign In With Farcaster (SIWF)](https://docs.farcaster.xyz/developers/siwf) [FULL] - the SIWF spec + QR flow on desktop/phone
- [AuthKit intro](https://docs.farcaster.xyz/auth-kit/introduction) + [auth-client (framework-agnostic)](https://docs.farcaster.xyz/auth-kit/client/introduction) [FULL] - React AuthKit vs vanilla `@farcaster/auth-client`
- [`@farcaster/auth-client` npm](https://www.npmjs.com/package/@farcaster/auth-client) [FULL] - v0.7.1, `verifySignInMessage`
- [verifySignInMessage](https://docs.farcaster.xyz/auth-kit/client/app/verify-sign-in-message) [FULL] - server verify params (domain, nonce, message, signature)
- [Quick Auth (mini apps)](https://miniapps.farcaster.xyz/docs/sdk/quick-auth) [FULL] - JWT path, requires mini-app context
- [Mini App specification](https://miniapps.farcaster.xyz/docs/specification) [FULL] - fc:miniapp embed + farcaster.json (only needed for the mini-app path)
- [Neynar SIWN](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) [FULL] - returns signer_uuid (for write-as-app; overkill here)
