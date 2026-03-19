# ZAO OS — Backend Test Bench

Manual + automated verification for every API route. Tests what the frontend can't show you.

**How to use:** Open browser DevTools Network tab. Perform each action. Check the API response matches expected behavior.

---

## 1. AUTH ROUTES

### 1.1 Session Guard (every protected route)
- [ ] Open incognito → hit `/api/chat/messages` directly → **401** `{ error: "Unauthorized" }`
- [ ] Open incognito → hit `/api/admin/users` directly → **401** `{ error: "Unauthorized" }`
- [ ] Open incognito → hit `/api/proposals` directly → **401** `{ error: "Unauthorized" }`

### 1.2 Admin Guard
- [ ] Log in as **non-admin** → hit `/api/admin/users` → **403** `{ error: "Admin access required" }`
- [ ] Log in as **non-admin** → hit `/api/respect/sync` (POST) → **403** `{ error: "Forbidden" }`
- [ ] Log in as **non-admin** → PATCH `/api/proposals` → **403** `{ error: "Forbidden" }`

### 1.3 Session Lifecycle
- [ ] Sign in via Farcaster → `/api/auth/session` returns `{ fid, username, displayName, isAdmin, ... }`
- [ ] Sign in via wallet → `/api/auth/session` returns `{ walletAddress, authMethod: "wallet", ... }`
- [ ] POST `/api/auth/logout` → session cleared → next `/api/auth/session` returns **401**

### 1.4 Allowlist Gating
- [ ] Non-allowlisted Farcaster account → verify returns `{ error: "Not on the allowlist" }` or redirects to `/not-allowed`
- [ ] Non-allowlisted wallet → SIWE returns **403** with allowlist error

---

## 2. INPUT VALIDATION (Zod)

### 2.1 Chat Send
- [ ] POST `/api/chat/send` with `{}` → **400** with Zod field errors
- [ ] POST `/api/chat/send` with `{ text: "" }` → **400** (min 1 char)
- [ ] POST `/api/chat/send` with 1025-char text → **400** (max 1024)
- [ ] POST `/api/chat/send` with `{ text: "<script>alert(1)</script>" }` → should succeed (text is escaped on render, not rejected)

### 2.2 Proposals
- [ ] POST `/api/proposals` with `{}` → **400** with field errors
- [ ] POST `/api/proposals` with `{ title: "x", description: "y", category: "invalid" }` → **400** category enum error
- [ ] POST `/api/proposals` with past `closes_at` → **400** "must be in the future"
- [ ] POST `/api/proposals` with all valid fields → **200** with proposal object

### 2.3 Voting
- [ ] POST `/api/proposals/vote` with `{ proposal_id: "not-a-uuid", vote: "for" }` → **400**
- [ ] POST `/api/proposals/vote` with `{ proposal_id: "<valid-uuid>", vote: "maybe" }` → **400** vote enum error
- [ ] POST `/api/proposals/vote` on a closed proposal → **400** "no longer open for voting"

### 2.4 Chat Hide (Admin)
- [ ] POST `/api/chat/hide` with `{ castHash: "invalid" }` → **400** regex validation fail
- [ ] POST `/api/chat/hide` with valid hash as non-admin → **403**

### 2.5 Allowlist
- [ ] POST `/api/admin/allowlist` with `{}` → **400** (needs fid or wallet)
- [ ] POST `/api/admin/allowlist` with `{ wallet_address: "not-an-address" }` → **400** regex fail
- [ ] DELETE `/api/admin/allowlist` with `{ id: "not-a-uuid" }` → **400**

### 2.6 Validation Gaps (Known — Manual Validation Only)
- [ ] POST `/api/users/follow` with `{ targetFid: "not-a-number" }` → verify it returns error (uses manual typeof check, not Zod)
- [ ] DELETE `/api/music/submissions` with `{ id: "not-a-uuid" }` → verify handled
- [ ] POST `/api/upload` with file > 5MB → verify **400** rejection
- [ ] POST `/api/upload` with non-image MIME type → verify **400** rejection

---

## 3. RATE LIMITING

### 3.1 Critical Routes
- [ ] Hit `/api/chat/send` **11 times** in 60 seconds → 11th request returns **429** `{ error: "Too many requests" }` with `Retry-After` header
- [ ] Hit `/api/admin/users` **6 times** in 60 seconds → 6th returns **429**
- [ ] Hit `/api/auth/verify` **11 times** in 60 seconds → 11th returns **429**

### 3.2 Rate Limit Headers
- [ ] 429 response includes `Retry-After` header with seconds value

---

## 4. GOVERNANCE BACKEND

### 4.1 Proposal Lifecycle
- [ ] POST `/api/proposals` → creates proposal with `status: "open"`
- [ ] PATCH `/api/proposals` as admin `{ id, status: "approved" }` → **200** `{ success: true }`
- [ ] PATCH `/api/proposals` as admin `{ id, status: "completed" }` → **200**
- [ ] PATCH `/api/proposals` as admin `{ id, status: "open" }` → **200** (reopen)
- [ ] PATCH `/api/proposals` as non-admin → **403**

### 4.2 Voting
- [ ] POST `/api/proposals/vote` on open proposal → **200** with `{ vote, respectWeight }`
- [ ] Vote again on same proposal → upsert (changes vote, not duplicate)
- [ ] Vote on non-open proposal → **400**
- [ ] Vote on proposal with expired `closes_at` → **400** "Voting period has ended"
- [ ] Verify `respectWeight` in response matches on-chain OG + ZOR balance

### 4.3 Comments
- [ ] POST `/api/proposals/comment` with valid body → **200**
- [ ] GET `/api/proposals/comment?proposal_id=<uuid>` → returns comments array
- [ ] POST with empty body → **400**

### 4.4 Vote Tallies (GET /api/proposals)
- [ ] Response includes `tally.for.count`, `tally.for.weight`, `tally.against.*`, `tally.abstain.*`
- [ ] `tally.totalWeight` = sum of all vote weights
- [ ] `tally.totalVoters` = count of all votes
- [ ] `commentCount` matches actual comment count

---

## 5. RESPECT BACKEND

### 5.1 Leaderboard
- [ ] GET `/api/respect/leaderboard` → returns `{ leaderboard: [...], stats: {...}, currentFid, currentWallet }`
- [ ] Leaderboard entries have: `rank`, `name`, `wallet`, `ogRespect`, `zorRespect`, `totalRespect`
- [ ] Stats include: `totalMembers`, `totalOG`, `totalZOR`, `holdersWithRespect`

### 5.2 Sync (Admin)
- [ ] POST `/api/respect/sync` as admin → returns `{ synced, total, errors }`
- [ ] Verify `respect_members` table updated with on-chain balances
- [ ] Non-admin → **403**

### 5.3 Fractal Session Recording (Admin)
- [ ] POST `/api/respect/fractal` with valid session data → **200**
- [ ] Verify scores written to `fractal_scores` and `respect_members.fractal_respect` updated

### 5.4 Member Detail
- [ ] GET `/api/respect/member?fid=<fid>` → returns member with fractal history
- [ ] GET `/api/respect/member?wallet=<address>` → same data via wallet lookup

---

## 6. CHAT BACKEND

### 6.1 Messages
- [ ] GET `/api/chat/messages?channel=zao` → returns `{ casts: [...], hasMore, cursor }`
- [ ] Each cast has: `hash`, `text`, `author`, `timestamp`, `reactions`, `replies`
- [ ] Pagination: use `cursor` param → returns older messages
- [ ] Invalid channel → returns empty casts (not error)

### 6.2 Send
- [ ] POST `/api/chat/send` with text + channel → **200** with cast object
- [ ] Cross-post: `{ text, channel: "zao", crossPostChannels: ["zabal"] }` → posts to both
- [ ] Without signer → **400** "Signer required"

### 6.3 Reactions
- [ ] POST `/api/chat/react` with `{ hash, type: "like" }` → **200**
- [ ] DELETE `/api/chat/react` with same → removes reaction
- [ ] Without signer → **400**

### 6.4 Thread
- [ ] GET `/api/chat/thread/<hash>` → returns parent cast + replies array
- [ ] Invalid hash format → **400**

### 6.5 Search
- [ ] GET `/api/chat/search?q=test&channel=zao` → returns matching casts
- [ ] Query < 2 chars → **400**
- [ ] SQL injection attempt: `q=%25` (wildcard) → should return empty, not all messages

---

## 7. ADMIN BACKEND

### 7.1 Users
- [ ] GET `/api/admin/users` → returns users with pagination
- [ ] GET `/api/admin/users?role=admin` → filters by role
- [ ] PATCH `/api/admin/users` → updates user fields

### 7.2 Allowlist
- [ ] GET `/api/admin/allowlist` → returns all entries
- [ ] POST → adds entry (with duplicate detection → **409**)
- [ ] DELETE → removes entry

### 7.3 Respect Import (Airtable)
- [ ] POST `/api/admin/respect-import` → imports from Airtable
- [ ] Verify error response does NOT leak raw Airtable error messages (info leakage fix needed)

### 7.4 Sync Respect
- [ ] POST `/api/respect/sync` → updates on-chain balances
- [ ] Response: `{ synced: N, total: M, errors: [...] }`

---

## 8. MUSIC BACKEND

### 8.1 Submissions
- [ ] POST `/api/music/submissions` with URL → **200** (or **409** if duplicate)
- [ ] GET `/api/music/submissions` → returns submissions list
- [ ] DELETE as owner → **200**
- [ ] DELETE as non-owner non-admin → **403**

### 8.2 Metadata
- [ ] GET `/api/music/metadata?url=<spotify-url>` → returns title, artist, artwork
- [ ] GET with invalid URL → graceful fallback (not crash)
- [ ] GET with unsupported platform → returns basic metadata or error

---

## 9. NOTIFICATIONS BACKEND

### 9.1 Read
- [ ] GET `/api/notifications` → returns notifications for current user
- [ ] GET `/api/notifications?unread_only=true` → filters to unread
- [ ] Verify you CANNOT see other users' notifications (RLS)

### 9.2 Mark Read
- [ ] PATCH `/api/notifications` with notification IDs → marks as read

---

## 10. SECURITY HEADERS

- [ ] Any API response includes `X-Frame-Options: DENY`
- [ ] Any API response includes `X-Content-Type-Options: nosniff`
- [ ] Any API response includes `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Any API response includes `Strict-Transport-Security` header
- [ ] `/messages` page responses include `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`

---

## 11. WEBHOOK SECURITY

### 11.1 Neynar Webhook
- [ ] POST `/api/webhooks/neynar` without HMAC header → **401**
- [ ] POST with invalid HMAC → **401**
- [ ] POST with valid HMAC + cast data → **200**, cast stored in DB

### 11.2 Mini App Webhook
- [ ] POST `/api/miniapp/webhook` with non-member FID → silently accepted (200) but not processed
- [ ] POST with member FID → processed normally

---

## 12. ERROR HANDLING SPOTS TO CHECK

### 12.1 Known Issues (from audit)
- [ ] `/api/admin/respect-import` — trigger an error → verify response does NOT contain raw error message (currently leaks)
- [ ] `/api/auth/session` — verify graceful 500 if session read fails (no try/catch currently)
- [ ] `/api/users/wallet` — verify graceful error if getUserByFid throws (no try/catch currently)
- [ ] `/api/members` — verify page still loads if Neynar is down (silently degrades)

### 12.2 Fire-and-Forget Verification
- [ ] Send a chat message → check DevTools for the POST response time (should return fast, not wait for notifications)
- [ ] Create a proposal → check response returns immediately (notifications are async)
- [ ] Vote on a proposal → check response returns immediately

---

## 13. SUPABASE RLS VERIFICATION

### 13.1 Run supashield (when available)
```bash
supashield audit --url "$SUPABASE_DB_URL"
supashield coverage --url "$SUPABASE_DB_URL"
```

### 13.2 Manual RLS Checks
- [ ] `proposals` table has RLS enabled
- [ ] `proposal_votes` table has RLS enabled
- [ ] `proposal_comments` table has RLS enabled
- [ ] `notifications` table has RLS enabled (run `scripts/add-notifications-rls.sql` if not)
- [ ] `users` table has RLS enabled
- [ ] `allowlist` table has RLS enabled
- [ ] `hidden_messages` table has RLS enabled

---

## QUICK BACKEND SMOKE TEST (5 min, DevTools Network tab)

1. [ ] Sign in → `/api/auth/session` returns 200 with your FID
2. [ ] Load chat → `/api/chat/messages?channel=zao` returns casts array
3. [ ] Load governance → `/api/proposals` returns proposals with tallies
4. [ ] Load governance → `/api/respect/leaderboard` returns leaderboard + stats
5. [ ] Open incognito → hit any `/api/` route → get 401
6. [ ] Check any response headers → security headers present
7. [ ] Load admin (if admin) → `/api/admin/users` returns user list
8. [ ] Load notifications → `/api/notifications` returns your notifications only
