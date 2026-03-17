# ZAO OS — QA Test Checklist

Walk through each section one at a time. Check the box when confirmed working.

---

## 1. Landing Page (`/`)

- [ ] Page loads with logo, "THE ZAO", "Where music artists build onchain"
- [ ] 4 feature pills visible: Community, Music, Encrypted, Governance
- [ ] Farcaster "Sign in" button is primary (top)
- [ ] "no Farcaster? use wallet" divider + Connect Wallet button below
- [ ] "Not a member yet?" section at bottom with Discord link
- [ ] Discord link opens discord.thezao.com in new tab
- [ ] If already logged in, auto-redirects to `/chat`

## 2. Farcaster Login

- [ ] Click Farcaster Sign In → auth modal appears
- [ ] Sign with Farcaster → "Verifying access..." shown
- [ ] Allowlisted user → redirects to `/chat`
- [ ] Non-allowlisted user → redirects to `/not-allowed`
- [ ] Cancel auth → stays on landing page, no error

## 3. Wallet Login

- [ ] Click Connect Wallet → RainbowKit modal appears
- [ ] Connect MetaMask/Coinbase/etc → SIWE signature requested
- [ ] Sign → allowlist check → redirect to `/chat`
- [ ] Non-allowlisted wallet → `/not-allowed`

## 4. Chat Feed (`/chat`)

- [ ] Feed loads with recent casts from #zao channel
- [ ] Channel list in sidebar: #zao, #zabal, #cocconcertz, #wavewarz
- [ ] Click different channel → feed switches
- [ ] Scroll up → "Scroll up for older messages" sentinel appears → loads more
- [ ] Each cast shows: avatar, name, timestamp, text
- [ ] Casts with `parent_hash` show "reply" label
- [ ] Music URLs render as embeds (Spotify, Audius, SoundCloud, YouTube)
- [ ] Image embeds display inline
- [ ] Link previews show OG card

## 5. Posting (requires Farcaster signer)

- [ ] Without signer: compose bar shows "Connect Farcaster to post in channels..."
- [ ] "Give Access to posting using ZAO OS with Neynar (Optional)" banner visible
- [ ] Click to set up signer → Neynar SIWN flow
- [ ] After signer: compose bar active, can type
- [ ] Type message → click Send → cast appears in feed
- [ ] Reply to cast → "Replying to @name" context shown → sends as reply
- [ ] Quote cast → quoted cast preview in compose bar → sends with embed
- [ ] Cross-post: click share icon → channel checkboxes appear → post to multiple

## 6. Reactions

- [ ] Click heart on a cast → fills, count increments
- [ ] Click again → unfills, count decrements
- [ ] Click recast icon → count updates
- [ ] Without signer → no reaction (silent fail or error)

## 7. Thread View

- [ ] Click reply count on a cast → thread drawer opens
- [ ] Shows parent cast + all replies
- [ ] Can reply within thread
- [ ] Close thread → returns to feed

## 8. Search

- [ ] Click search icon → search dialog opens
- [ ] Type query → results appear
- [ ] Click result → opens thread
- [ ] Search for `%` → should return NO results (wildcard escaped)
- [ ] Press Escape → closes search

## 9. XMTP Messaging

### Enable Messaging
- [ ] Sidebar shows "Connect Wallet" if no wallet, or "Enable Messaging" if wallet connected
- [ ] Click Enable Messaging → wallet signature popup
- [ ] Sign → XMTP connects, DMs and Groups sections appear
- [ ] "Reset Messaging" button visible at bottom of Groups section

### Direct Messages
- [ ] DMs section shows existing conversations
- [ ] Click + → New DM dialog, search ZAO members
- [ ] Select member → creates DM, opens thread
- [ ] Send message → appears in thread
- [ ] Hover DM in sidebar → X button appears → click to hide
- [ ] Incoming DM shows sender's name (not "Unknown")

### Groups
- [ ] Groups section shows ZAO General + any other groups
- [ ] Click + → New Group dialog, set name, add members
- [ ] Create group → appears in sidebar
- [ ] Send message in group → appears for all members
- [ ] Click info icon on group → Group Info drawer opens
- [ ] "Leave Group" button → confirms → removes you from group
- [ ] "Hide from list" → hides locally

### Reset Messaging
- [ ] Click "Reset Messaging" → clears XMTP state
- [ ] Enable Messaging button reappears
- [ ] Can re-enable with wallet

### Messageable Members
- [ ] Messageable section shows members who have XMTP enabled
- [ ] Refresh button (circular arrows) → re-checks canMessage
- [ ] Not on XMTP section shows members without XMTP + tag button

## 10. Notifications

### Bell Icon
- [ ] Notification bell visible in header on all pages
- [ ] Unread count badge shows if notifications exist
- [ ] Click bell → dropdown with recent notifications
- [ ] Click notification → navigates to relevant page

### Notifications Page (`/notifications`)
- [ ] Page shows all notifications with All/Unread filter
- [ ] Unread notifications have gold dot and highlighted background
- [ ] Click "Mark all read" → all dots disappear
- [ ] Click individual notification → marks as read, navigates to href

### Notification Triggers
- [ ] Someone posts in channel → notification for other members
- [ ] Someone reacts to your cast → notification for you
- [ ] New proposal created → notification for all members
- [ ] Vote on your proposal → notification for you
- [ ] Comment on your proposal → notification for you
- [ ] New member first login → notification for admins

## 11. Governance (`/governance`)

### Respect Overview Tab
- [ ] Shows "Your Respect" card with vote weight
- [ ] Shows on-chain stats (OG, ZOR, Members, Holders)
- [ ] Leaderboard shows top 10 with ranks
- [ ] Your entry highlighted with "(you)"

### Proposals Tab
- [ ] "+ New Proposal" button visible (if you have respect)
- [ ] Create proposal: title, description, category dropdown
- [ ] Categories match: general, treasury, governance, technical, community
- [ ] Submit → proposal appears in list
- [ ] Vote For/Against/Abstain → tally updates
- [ ] Click comment count → expands comments
- [ ] Post comment → appears in thread

## 12. Respect Leaderboard (`/respect`)

- [ ] Full leaderboard with all members
- [ ] Shows: rank, name, total respect, fractal count, on-chain OG, on-chain ZOR
- [ ] Click member → expands to show fractal history (if data exists)
- [ ] First respect date shown per member

## 13. Social (`/social`)

- [ ] Tabs: Followers, Following, Community, Discover
- [ ] Follower/Following lists load with avatars and names
- [ ] Search filters the list
- [ ] Follow/Unfollow buttons work
- [ ] Click member → profile drawer opens

## 14. Settings (`/settings`)

### Connections Section
- [ ] Wallet: green dot, shows address
- [ ] Farcaster: green/gray dot, shows @username or "Not connected"
- [ ] Posting: green/gray dot, shows "Enabled" or "Connect Farcaster first"
- [ ] Messaging: green/gray dot, shows "Enabled" or "Auto-enables with wallet"

### Profile Section
- [ ] Shows display name, username, avatar, FID, ZID, role
- [ ] Shows wallet addresses

### Logout
- [ ] Click "Log out" → redirects to landing page
- [ ] Session cleared, can't access protected pages

## 15. Tools (`/tools`)

- [ ] Profile card shows your info
- [ ] Social Graph → links to `/social`
- [ ] Cross-Post → links to `/chat` with description
- [ ] AI Agent → "Coming soon"
- [ ] Taste Profile → "Coming soon"

## 16. Contribute (`/contribute`)

- [ ] GitHub link → opens repo in new tab
- [ ] Bounties → opens GitHub issues with bounty label
- [ ] Documentation → opens research folder
- [ ] Fork Guide → opens forking instructions

## 17. Admin Panel (`/admin`)

**Access:** Only visible for admin users

### Header
- [ ] "Import from Airtable" button visible
- [ ] "Sync Respect" button visible
- [ ] "Back to chat" link

### Sync Respect
- [ ] Click Sync Respect → spinner → pulls on-chain OG + ZOR balances
- [ ] Success toast shows "Synced X/Y members"

### Import from Airtable
- [ ] Click Import → spinner → pulls from Airtable API
- [ ] Success toast shows imported count
- [ ] Requires AIRTABLE_TOKEN env var

### Users Tab
- [ ] Search users by name/wallet/FID
- [ ] Filter by role (Beta/Member/Admin)
- [ ] Expand user → shows all details
- [ ] Edit user fields
- [ ] Shows last login date

### ZIDs Tab
- [ ] Shows members eligible for ZID assignment
- [ ] "Assign ZID" button per member
- [ ] Shows respect amounts

### Allowlist Tab
- [ ] Search/add members
- [ ] Farcaster search to add by username
- [ ] Backfill FIDs button
- [ ] Expand member → shows all wallets (Primary, Farcaster, Verified, ZAO)

### Import Tab
- [ ] CSV drag-and-drop upload
- [ ] Format: name, wallet_address
- [ ] Shows import results

### Moderation Tab
- [ ] Shows hidden messages count
- [ ] Lists hidden casts with hash and date

### Respect Tab
- [ ] Stats cards: Members with Respect, Sessions, Total Distributed, On-chain
- [ ] Member table sorted by total respect
- [ ] Shows all respect fields per member

## 18. Music

- [ ] Radio button in sidebar → plays community playlist
- [ ] Music player appears at bottom with controls
- [ ] Play/pause, prev/next, scrubber work
- [ ] Song submit → paste URL → validates → adds to queue
- [ ] Music embeds in casts play inline

## 19. Mobile

- [ ] Landing page responsive on phone
- [ ] Chat feed scrollable, compose bar at bottom
- [ ] Sidebar opens via hamburger menu
- [ ] Messages page works on mobile
- [ ] All modals/dialogs are full-width on small screens
- [ ] Touch targets are large enough (44px min)

## 20. Error Handling

- [ ] Error boundary catches crashes → "Something went wrong" + Reload button
- [ ] Network errors show toast/banner with retry
- [ ] Invalid form inputs show clear error messages
- [ ] Rate limited (429) → appropriate message shown
- [ ] Expired session → redirects to login

---

## Quick Smoke Test (5 minutes)

If you just want to verify the core flow:

1. [ ] Load landing page → see login options
2. [ ] Sign in with Farcaster → lands on chat feed
3. [ ] See casts in #zao channel
4. [ ] Post a cast (if signer set up)
5. [ ] Click notification bell → see notifications
6. [ ] Go to /governance → see proposals
7. [ ] Go to /respect → see leaderboard
8. [ ] Go to /settings → see connections status
9. [ ] Open sidebar → see DMs/Groups (if XMTP enabled)
10. [ ] Go to /admin → see admin panel (if admin)
