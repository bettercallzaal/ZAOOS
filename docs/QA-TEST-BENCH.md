# ZAO OS — Detailed Test Bench

Every test specifies the **exact text, exact element, and exact condition** from the source code. Walk through one at a time.

---

## 1. LANDING PAGE (`/`)

### 1.1 Loading State
- [ ] Background is navy `#0a1628`
- [ ] Logo: 128x128 `/logo.png` with rounded corners
- [ ] Heading: **"THE ZAO"** in gold-to-yellow gradient
- [ ] Spinning loader: gold border with transparent top

### 1.2 Full Landing (after session check fails)
- [ ] Logo: 100x100 with gold shadow
- [ ] Heading: **"THE ZAO"** (gradient `#f5a623` → `#ffd700`)
- [ ] Tagline: **"Where music artists build onchain"** (gray-300)
- [ ] Subtitle: **"A gated community for creators who govern, collaborate, and grow together"** (gray-500)
- [ ] 4 feature pills in a row: **Community**, **Music**, **Encrypted**, **Governance** (each with icon)
- [ ] Farcaster Sign In button (primary, top position)
- [ ] Divider text: **"NO FARCASTER? USE WALLET"** (uppercase, gray-600)
- [ ] Connect Wallet button (gold gradient, full width)
- [ ] Footer card: **"Not a member yet?"** heading
- [ ] Footer text: **"Join the community, participate in fractal calls, and earn your ZAO to unlock access."**
- [ ] Discord button: **"Join on Discord"** (purple `#5865F2`, links to `discord.thezao.com`)

### 1.3 Auto-redirect
- [ ] If already logged in → immediately redirects to `/chat` (no landing shown)

---

## 2. FARCASTER LOGIN

### 2.1 Sign In Flow
- [ ] Click Farcaster button → auth modal appears (QR code or deep link)
- [ ] After signing → text appears: **"Verifying access..."** (gray-400)
- [ ] Allowlisted user → redirects to `/chat`
- [ ] Non-allowlisted → redirects to `/not-allowed`

### 2.2 Error States
- [ ] Invalid signature → red error text shown below button
- [ ] Error auto-refreshes nonce for retry
- [ ] Cancel auth modal → stays on landing, no error

### 2.3 Not Allowed Page
- [ ] Lock icon (gray, opacity-60)
- [ ] Heading: **"Not on the list yet"**
- [ ] Text: **"ZAO OS is currently invite-only for ZAO community members."**
- [ ] Link: **"← Back to home"** (navigates to `/`)

---

## 3. WALLET LOGIN

### 3.1 Button States
| State | Button Text | Disabled |
|-------|-----------|----------|
| Idle | **"Connect Wallet"** | No |
| Connecting | **"Connecting..."** + spinner | Yes |
| Signing | **"Sign message in wallet..."** + spinner | Yes |
| Verifying | **"Verifying..."** + spinner | Yes |

### 3.2 Hint Text
- [ ] If MetaMask detected: **"MetaMask, Coinbase, WalletConnect & more"**
- [ ] Otherwise: **"WalletConnect, Coinbase & more"**

### 3.3 SIWE Message
- [ ] Statement shown in wallet: **"Sign in to ZAO OS"**
- [ ] Chain ID: 1 (Ethereum mainnet)

### 3.4 Errors
- [ ] Rejected signature: **"Signature rejected. Try again."**
- [ ] Wallet disconnect on error

---

## 4. CHAT FEED (`/chat`)

### 4.1 Channel Sidebar
- [ ] Channels listed: **# zao**, **# zabal**, **# cocconcertz**, **# wavewarz**
- [ ] Active channel highlighted gold (`bg-[#f5a623]/10`)
- [ ] Click channel → feed switches

### 4.2 Feed Loading
- [ ] Spinner + **"Loading messages..."** (gray-500)

### 4.3 Empty Channel
- [ ] Icon: message bubble
- [ ] Text: **"No posts yet"**
- [ ] Subtext: **"Be the first to post in #{channelId}"**

### 4.4 Messages
- [ ] Each cast: avatar (clickable) + **display name** (white, clickable → profile) + **timestamp** (gray-500)
- [ ] Timestamp format: "just now" / "Xm ago" / "Xh ago" / "Mon DD, HH:MM AM/PM"
- [ ] Cast text: gray-300, preserves line breaks (`whitespace-pre-wrap`)
- [ ] Casts with `parent_hash` show **"reply"** label with arrow icon above author name

### 4.5 Pagination
- [ ] Scroll to top → sentinel div appears
- [ ] While loading more: small gold spinner
- [ ] While idle: **"Scroll up for older messages"** (gray-600)
- [ ] When no more: sentinel hidden

### 4.6 Thread Indicator
- [ ] Casts with replies show button: **"X reply/replies"** + **"View thread →"**
- [ ] Gold accent (`bg-[#f5a623]/5`)
- [ ] Click → ThreadDrawer opens

---

## 5. COMPOSE BAR

### 5.1 Placeholder Text
| Condition | Placeholder |
|-----------|------------|
| Replying | **"Reply to {authorName}..."** |
| Quoting | **"Add a comment..."** |
| Has signer | **"Message #{channel}... (type @ to mention)"** |
| No signer | **"Connect Farcaster to post in channels..."** |

### 5.2 Signer Banner
- [ ] Text: **"Give Access to posting using ZAO OS with Neynar (Optional)"**

### 5.3 Send Button Text
| State | Text |
|-------|------|
| Sending | **"Sending"** |
| Cross-posting | **"Post ({channelCount + 1})"** |
| Normal | **"Post"** |

### 5.4 Cross-Post UI
- [ ] Click share icon → checkboxes appear: other channels (excluding current)
- [ ] Label: **"Also post to:"**
- [ ] Selected: gold border + background
- [ ] Badge count on share icon

### 5.5 No Signer Fallback
- [ ] Opens Farcaster compose URL in new tab
- [ ] Footer text: **"Opens in Farcaster to post to /{channel} channel"**

---

## 6. REACTIONS

### 6.1 Like Button
- [ ] Heart icon: **filled red** when liked (`text-red-400 bg-red-400/10`)
- [ ] Heart icon: **outline gray** when not liked (`text-gray-500`)
- [ ] Count shown only if > 0
- [ ] No signer: `opacity-40, cursor-default`

### 6.2 Recast Button
- [ ] Loop icon: **green** when recasted (`text-green-400 bg-green-400/10`)
- [ ] Loop icon: **gray** when not (`text-gray-500`)
- [ ] Count shown only if > 0

### 6.3 Optimistic Updates
- [ ] Click → UI updates immediately
- [ ] API failure → reverts to previous state

---

## 7. THREAD DRAWER

- [ ] Width: 420px on desktop, full-screen on mobile
- [ ] Header: **"Thread"** with X close button
- [ ] Loading: spinner + **"Loading thread..."**
- [ ] Reply count: **"{N} reply/replies"** in gold
- [ ] Empty replies: **"No replies yet"**
- [ ] Reply input placeholder: **"Reply..."** (with signer) or **"Reply via Farcaster..."** (without)
- [ ] Enter sends, Shift+Enter newline
- [ ] Thread polls every 30 seconds

---

## 8. SEARCH

- [ ] Min query length: 2 characters
- [ ] Below 2: **"Query must be at least 2 characters"**
- [ ] Wildcard `%` escaped → returns no results (not all messages)
- [ ] Results show: avatar, name, text preview, timestamp

---

## 9. XMTP MESSAGING

### 9.1 Sidebar States

| State | Section Title | Button/Content |
|-------|-------------|----------------|
| No wallet, not connecting | **"Messages"** | **"Connect Wallet"** / "Required for encrypted messaging" |
| Wallet connected, XMTP off | **"Messages"** | **"Enable Messaging"** / "Sign with your wallet to activate" |
| Wallet connected, error | **"Messages"** | **"Retry Connection"** / "Sign with your wallet to activate" |
| Connecting | **"Messages"** | 4 skeleton rows + spinner + **"Setting up encrypted inbox..."** |
| Connected, error | **"Messages"** | Error: **"Connection issue"** + {error} + **"Retry"** + **"Reset"** |
| Connected, no DMs | **"Direct Messages"** | **"No direct messages yet"** |
| Connected, no groups | **"Groups"** | **"No groups yet"** |

### 9.2 DM Row
- [ ] Avatar + **peer display name** (or **"Unknown"** if unresolved)
- [ ] Last message preview + timestamp (e.g., "5m", "2h", "3d")
- [ ] Unread badge: gold, shows count (max "99+")
- [ ] Hover → X button appears (red on hover)
- [ ] Active: gold background

### 9.3 Group Row
- [ ] Group icon (gold) + **#{group name}** + member count
- [ ] Hover → info button appears
- [ ] Unread badge same as DM

### 9.4 Reset Messaging
- [ ] Button always visible when XMTP connected: **"Reset Messaging"** (gray, red on hover)
- [ ] Also shown in error state alongside Retry

### 9.5 Messageable Section
- [ ] Header: **"Messageable"** with green count badge
- [ ] Refresh button (circular arrows)
- [ ] Empty: **"No members messageable"**
- [ ] Each member: avatar + green dot + name + last seen (e.g., **"Active now"**, **"5m ago"**)

### 9.6 Not on XMTP Section
- [ ] Header: **"Not on XMTP"** with gray count
- [ ] Collapsed by default
- [ ] Each member: dimmed avatar + name + **@username** link (gold) + megaphone icon
- [ ] Megaphone pre-fills cast: **"@{username} enable XMTP messages on ZAO OS so I can ping you! 🎵"**

### 9.7 ConnectXMTP Page (/messages)
- [ ] Heading: **"Private Messaging"**
- [ ] Description: **"End-to-end encrypted messaging powered by XMTP. DM other ZAO members or create private group chats."**
- [ ] Sub-description: **"Connect your wallet to create your messaging identity. Your wallet address becomes your XMTP identity."**
- [ ] No wallet: **"Connect Wallet"** button (RainbowKit)
- [ ] Wallet ready: **"Enable Messaging"** button
- [ ] Connecting: **"Setting up messaging..."** + spinner

### 9.8 Message Thread States
| State | Heading | Message |
|-------|---------|---------|
| Idle | **"Private Messages"** | "Enable messaging in the sidebar..." |
| Connecting | **"Connecting to XMTP"** | "Setting up your encrypted inbox..." |
| Error | **"Connection Failed"** | {error text} + **"Retry Connection"** button |
| Connected, none selected | **"No Conversation Selected"** | "Select a conversation..." + **"New Direct Message"** + **"Create Group Chat"** |
| Empty conversation | **"No messages yet"** | "Say hello to start the conversation" |

### 9.9 Message Bubbles
- [ ] From me: gold background (`bg-[#f5a623]`), black text
- [ ] From other: dark background (`bg-[#1a2a3a]`), gray-100 text
- [ ] Sender name in gold for first message in sequence
- [ ] Date dividers: **"Today"**, **"Yesterday"**, or **"Monday, Mar 17"**
- [ ] Encryption banner: **"End-to-end encrypted"** + **"Only you and {name} can read these messages"**

### 9.10 Message Compose (XMTP)
- [ ] Placeholder: **"Message {peerName}..."** (DM) or **"Message #{groupName}..."** (group)
- [ ] Max length: 4000 characters
- [ ] Over limit: **"Message too long (max 4000 characters)"**
- [ ] Send error: **"Message failed to send. Tap to retry."** (red)
- [ ] Encryption indicator: lock icon + **"encrypted"** (green)

### 9.11 New Conversation Dialog
- [ ] DM tab title: **"New Message"**
- [ ] Group tab title: **"New Group"**
- [ ] DM search placeholder: **"Type a username..."**
- [ ] ZAO Members label: **"ZAO Members — tap to message"**
- [ ] Reachable badge: **"XMTP"** (green)
- [ ] Non-reachable: **"Not on XMTP"** (gray)
- [ ] Group name placeholder: **"e.g. ZAO Producers"**
- [ ] DM button: **"Start Chat"**
- [ ] Group button: **"Create Group"**

### 9.12 Group Info Drawer
- [ ] Header: **"Group Info"**
- [ ] Members section: **"Members ({count})"**
- [ ] Leave: **"Leave Group"** → confirm: **"Leave this group? You'll need to be re-added by a member."**
- [ ] Hide: **"Hide from list"** → confirm: **"Hide this group from your list? It will reappear when you get a new message."**

### 9.13 Error Messages (exact strings from XMTPContext)
- [ ] Tab lock: **"ZAO OS messaging is open in another tab. Please close the other tab first."**
- [ ] DM fail: **"Failed to start conversation. The recipient may not have XMTP enabled."**
- [ ] Group fail: **"Failed to create group. Some members may not have XMTP enabled."**
- [ ] Send fail: **"Failed to send message. Please try again."**
- [ ] Stream disconnect: **"Live updates disconnected. New conversations may not appear automatically."**

---

## 10. NOTIFICATIONS

### 10.1 Bell Icon
- [ ] Unread badge: gold, shows count (max **"99+"**)
- [ ] Click → dropdown with recent notifications
- [ ] **"Mark all read"** button (if unread > 0)

### 10.2 Notifications Page (`/notifications`)
- [ ] Header: **"Notifications"** with unread badge
- [ ] Filters: **"All"** | **"Unread"**
- [ ] Empty (all): **"No notifications yet"**
- [ ] Empty (unread): **"No unread notifications"**
- [ ] **"Mark all read"** link (gold)
- [ ] Unread items: gold dot + highlighted background (`bg-[#f5a623]/5`)
- [ ] Read items: no dot, plain background

### 10.3 Notification Types
| Type | Example Title |
|------|-------------|
| message | "{name} in #zao" |
| proposal | "{name} created a proposal" |
| vote | "{name} voted on your proposal" |
| comment | "{name} commented on your proposal" |
| member | "New member joined ZAO OS" |

---

## 11. GOVERNANCE (`/governance`)

### 11.1 Tabs
- [ ] **"Respect Overview"** | **"Proposals ({count})"**

### 11.2 Your Respect Card
- [ ] Label: **"YOUR RESPECT"** (uppercase, gold)
- [ ] Large number: total respect
- [ ] Has respect: **"Your vote weight in proposals"**
- [ ] No respect: **"Earn respect to vote on proposals"**
- [ ] Rank: **"#{rank}"** of **"{total} members"**
- [ ] No wallet: **"Your wallet isn't linked yet. Ask an admin to add your FID to see your Respect here."**

### 11.3 Stats Grid (2x2)
- [ ] **OG Respect** / **ZOR Respect** / **Members** / **Holders**

### 11.4 Leaderboard (top 10)
- [ ] Rank badges: 🥇 🥈 🥉 or number
- [ ] Current user: name + **"(you)"** suffix
- [ ] ZID badge: **"ZID #{number}"**

### 11.5 Create Proposal
- [ ] Button: **"+ New Proposal"** (gold)
- [ ] Title placeholder: **"Proposal title"**
- [ ] Description placeholder: **"Describe your proposal..."**
- [ ] Category dropdown: **General** | **Technical** | **Community** | **Governance** | **Treasury**
- [ ] Submit button: **"Submit Proposal"** → **"Submitting..."**

### 11.6 Proposal Cards
- [ ] Category badges: general=gray, technical=blue, community=purple, governance=gold, treasury=green
- [ ] Vote buttons: **"For"** (green) | **"Against"** (red) | **"Abstain"** (gray)
- [ ] Vote buttons ONLY shown when `status === 'open'` AND deadline not expired
- [ ] Closed badges: **"Approved"** (green) | **"Rejected"** (red) | **"Completed"** (blue)
- [ ] Comments toggle: **"{N} comments"** (clickable)

### 11.7 Deadline Countdown
- [ ] Proposals with future deadline show: **"Xd Xh remaining"** (gold text)
- [ ] Proposals with deadline < 24h show: **"Xh Xm remaining"** (gold text)
- [ ] Proposals with expired deadline show: **"Voting closed"** (red text, red background)
- [ ] Expired proposals hide vote buttons even if status is still 'open'

### 11.8 Admin Status Controls (admin only)
- [ ] Open proposals show: **"Approve"** (green) + **"Reject"** (red) buttons
- [ ] Approved proposals show: **"Mark Completed"** (blue) button
- [ ] Rejected/Completed proposals show: **"Reopen"** (gold) button
- [ ] While updating: buttons disabled, shows **"Updating..."**
- [ ] After status change: proposal list refreshes with new status
- [ ] Non-admin users: NO status buttons visible

---

## 12. RESPECT (`/respect`)

### 12.1 Header
- [ ] Title: **"Fractal Respect"**

### 12.2 Your Respect Card (same as governance but with fractal details)
- [ ] Fractal count: **"{N} fractal(s) attended · since {date}"**
- [ ] No data: **"No respect earned yet"**

### 12.3 Stats (3 columns)
- [ ] **Members** / **Total Respect** / **Active**

### 12.4 Leaderboard Table
- [ ] Columns: rank, name, meta, total, breakdown
- [ ] Breakdown: **"{N} frac"** **"{N} OG"** **"{N} ZOR"**
- [ ] Click row → expands detail panel
- [ ] Detail shows: Fractal, On-chain OG, On-chain ZOR, Fractals count, Hosted count, First Respect date
- [ ] Fractal history: session date, name, rank, **"+{score}"** (gold)

### 12.5 Empty/Loading
- [ ] Loading: spinner + **"Loading respect data..."**
- [ ] No data: **"No respect data found."**
- [ ] No history: **"No fractal history recorded yet."**

---

## 13. SETTINGS (`/settings`)

### 13.1 Connections Section
| Connection | Connected | Not Connected |
|-----------|-----------|---------------|
| Wallet | Green dot + truncated address | (always connected) |
| Farcaster | Green dot + **@username** | Gray dot + **"Not connected"** |
| Posting | Green dot + **"Enabled"** | Gray dot + **"Connect Farcaster first"** (gold) |
| Messaging | Green dot + **"Enabled"** | Gray dot + **"Auto-enables with wallet"** |

### 13.2 Profile Section
- [ ] Label: **"PROFILE"** (uppercase)
- [ ] ZID badge: **"ZID #{number}"** (gold)
- [ ] Role shown (capitalized)

### 13.3 Write Access
- [ ] Connected: **"Signer Connected"** + **"You can post directly to Farcaster from ZAO OS"**
- [ ] Not connected: **"Signer Not Connected"** + **"Connect to post casts, reply, and react directly from ZAO OS"**

### 13.4 Logout
- [ ] Button: **"Sign Out"** (red)
- [ ] Clears session → redirects to `/`

---

## 14. ADMIN (`/admin`)

### 14.1 Header
- [ ] Title: **"ZAO Admin"** (gold)
- [ ] Subtitle: **"Manage your community"**
- [ ] Buttons: **"Import from Airtable"** | **"Sync Respect"** | **"← Back to chat"**

### 14.2 Tabs
- [ ] **👤 Users** | **🏷 ZIDs** | **👥 Allowlist** | **📄 Import** | **🛡 Moderation** | **🏅 Respect**

### 14.3 Sync Respect Button States
| State | Text |
|-------|------|
| Idle | **"Sync Respect"** |
| Loading | spinner + **"Syncing…"** |
| Success | Toast: **"Synced {N}/{total} members"** (green, auto-dismiss 5s) |
| Error | Toast: **"{error}"** (red, with X dismiss) |

### 14.4 Import Airtable Button States
| State | Text |
|-------|------|
| Idle | **"Import from Airtable"** |
| Loading | spinner + **"Importing…"** |
| Success | Toast: **"Imported {N} members"** (green, auto-dismiss 5s) |
| Error | Toast: **"{error}"** (red, with X dismiss) |

### 14.5 Users Tab Stats
- [ ] 4 cards: **Total Users** (white) | **Beta (wallet)** (yellow) | **Members (FID)** (green) | **Admins** (purple)

### 14.6 Allowlist Wallet Badges
- [ ] **Farcaster** (blue) | **Primary** (gold) | **Verified** (green) | **ZAO** (gold) | **ENS** (purple)

### 14.7 Respect Tab
- [ ] 4 stats: **Members with Respect** | **Fractal Sessions Recorded** (gold) | **Total Respect Distributed** (green) | **On-chain Balances** (purple)
- [ ] Table columns: **#**, **Name**, **Wallet**, **Total**, **Fractal**, **OG**, **ZOR**, **Fractals**, **First Respect**
- [ ] Top 3 rows highlighted gold

### 14.8 Moderation Tab
- [ ] Empty: **"No hidden messages — all clear"**

### 14.9 Import Tab
- [ ] Drop zone text: **"Drag & drop your CSV here"**
- [ ] Format: **"name, wallet_address (one per line, no header)"**
- [ ] Success: **"Successfully imported {N} members"** (green)

---

## 15. QUICK SMOKE TEST (5 min)

1. [ ] Load `/` → see landing page with login options
2. [ ] Sign in → lands on `/chat` with #zao feed
3. [ ] See casts with avatars, names, timestamps
4. [ ] Click notification bell → dropdown appears
5. [ ] Navigate to `/governance` → see Respect Overview + Proposals tabs
6. [ ] Navigate to `/respect` → see leaderboard
7. [ ] Navigate to `/settings` → see Connections section with green/gray dots
8. [ ] Check sidebar → see Direct Messages / Groups sections (if XMTP enabled)
9. [ ] Navigate to `/admin` → see 6 tabs + Sync/Import buttons (if admin)
10. [ ] Click **"Sign Out"** → back to landing page
