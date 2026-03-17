# ZAO OS Code Audit Results — 2026-03-16

## Farcaster Chat Audit

### Critical
- **C1: React endpoint missing Zod validation** — `/api/chat/react` doesn't validate `hash` with `castHashSchema`. Arbitrary strings hit Neynar.
- **C2: React endpoint has no rate limit** — not covered in middleware. Spam risk for Neynar API credits.

### Important
- **I1: Stale reaction counts** — `Message.tsx` uses `useState` for likes/recasts from props. After mount, never syncs with refreshed poll data.
- **I2: No rate limit on chat reads** — `/api/chat/messages` and `/api/chat/thread` not rate-limited.
- **I3: Thread reply hardcodes "zao" channel** — `ThreadDrawer.tsx` always uses `channelKey=zao` regardless of active channel.
- **I4: `hideMessage` has no try/catch** — network errors bubble as unhandled promise rejections.
- **I5: `useChat` dedup can cause stale data** — skips `setMessages` if top hash unchanged, missing reaction/reply count updates.

### Suggestions
- `ChatRoom.tsx` is ~644 lines with 20+ state hooks — extract into custom hooks.
- `onEnded` effect fires every render without dependency array.
- Duplicate `timeAgo` utility in Sidebar and ConversationList.

---

## XMTP Messaging Audit

### Critical
- **C1: localStorage key lacks validation** — stored XMTP private key cast without format check. Corrupted data causes cryptic errors.
- **C2: No message length limit** — no `maxLength` on textarea or in `sendMessage`. DoS vector.

### Important
- **I1: XMTP address persistence is fire-and-forget** — no retry on `/api/users/xmtp-address` failure. Member stays undiscoverable.
- **I2: ZAO General auto-creation is fragile** — name-based matching, no dedup for simultaneous connects, no group size cap.
- **I3: Stale closure in `sendMessage`** — reads `activeConversationId` from state closure instead of ref. Could send to wrong conversation.
- **I4: `disconnectWallet` is async but typed as void** — cleanup errors silently swallowed.
- **I5: Serial DB backfill in `/api/members`** — one update per member during GET request.

### Suggestions
- Duplicate `timeAgo` utility.
- `XMTPContext.tsx` at ~1230 lines should be split into sub-hooks.
- Identical ternary branches in MessageThread bubble rounding.
- `as any` cast in `createXMTPClient` masks SDK type changes.

---

## Auth & Security Audit

### Critical
- **C1: SIWF verify has no server-side nonce** — nonce/domain come from client body. Captured SIWF message+signature can be replayed indefinitely.
- **C2: Webhook HMAC verification is optional** — when `NEYNAR_WEBHOOK_SECRET` unset, requests bypass signature verification.

### Important
- **I1: `isAdmin` baked into session for 7 days** — removed admins retain access until session expires.
- **I2: Admin user endpoints lack Zod validation** — POST/PATCH on `/api/admin/users` use manual destructuring.
- **I3: Rate limiter uses spoofable `x-forwarded-for`** — should prefer `x-real-ip` on Vercel.
- **I4: Upload route trusts user file extension** — could enable stored XSS with `.html`/`.svg` extension.
- **I5: `/api/music/metadata` has no auth** — SSRF proxy risk.
- **I6: In-memory nonce store won't survive serverless cold starts** — SIWE nonces can't validate cross-instance.

### Suggestions
- No `Content-Security-Policy` header.
- Rate limit key is per-exact-path, not per-route-group.
