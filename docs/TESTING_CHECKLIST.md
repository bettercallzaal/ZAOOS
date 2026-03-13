# ZAO OS — Feature Testing Checklist

Test every feature thoroughly on **mobile (Farcaster mini app + mobile browser)** and **desktop browser**. Check the box when verified working.

---

## 1. Authentication & Gating

### Landing Page (`/`)
- [ ] Logo and "THE ZAO" title render correctly
- [ ] Loading spinner shows while checking auth
- [ ] "Sign in with Farcaster" button appears and works
- [ ] If already logged in, auto-redirects to `/chat`
- [ ] Mini app: QuickAuth auto-authenticates inside Farcaster client

### Not Allowed Page (`/not-allowed`)
- [ ] Shows lock icon and "Not on the list yet" message
- [ ] "Request Access in /zao" button opens Farcaster compose with @zaal mention
- [ ] "Back to home" link works

### Session Management
- [ ] Session persists across page refreshes
- [ ] Logout clears session and redirects to `/`
- [ ] Session expires after expected duration
- [ ] Cannot access `/chat` or `/admin` without valid session

---

## 2. Signer Setup

- [ ] If no signer: SignerConnect banner appears above compose bar
- [ ] Signer approval flow opens in Farcaster client
- [ ] After approval, compose bar switches to direct posting mode
- [ ] Signer status persists across page refreshes
- [ ] Without signer: compose bar shows "Post via Farcaster" with external link icon

---

## 3. Chat — Channel Navigation

### Sidebar
- [ ] Desktop: sidebar is always visible
- [ ] Mobile: hamburger menu opens/closes sidebar
- [ ] Three channels visible: #zao, #zabal, #cocconcertz
- [ ] Active channel is highlighted
- [ ] Switching channels loads correct messages
- [ ] "Respect" link in sidebar navigates to `/respect`
- [ ] User avatar and name shown in sidebar
- [ ] Logout button works

### Channel Switching
- [ ] Messages clear and reload when switching channels
- [ ] Loading spinner appears during fetch
- [ ] Music player stops when switching channels
- [ ] Thread drawer closes when switching channels

---

## 4. Chat — Messages

### Message Display
- [ ] Messages load and display oldest-first (bottom = newest)
- [ ] **Scroll starts at the bottom** showing most recent messages
- [ ] Author avatar, display name, and username shown
- [ ] Timestamps: relative for <24h ("2m ago"), date for older ("Mar 13, 9:03 AM")
- [ ] Long messages wrap correctly without overflow
- [ ] Empty channel shows "No messages yet" with prompt

### Scroll Behavior
- [ ] Initial load: scrolled to bottom
- [ ] Channel switch: snaps to bottom instantly
- [ ] New message: smooth scrolls to bottom
- [ ] Can scroll up to read history, stays in position
- [ ] Few messages: anchored to bottom of viewport (not top)

### Embeds & Media
- [ ] Image embeds render inline
- [ ] Link previews show OG title/description/image
- [ ] Quoted casts render with author + text preview
- [ ] Video embeds render (if any)

### Reactions
- [ ] Like count and recast count visible on messages
- [ ] Like button highlights if you've liked
- [ ] Recast button highlights if you've recasted
- [ ] Tapping like/recast calls the API

---

## 5. Chat — Compose Bar

### Basic Posting
- [ ] Textarea accepts input up to 1024 chars
- [ ] Enter sends message (without Shift)
- [ ] Shift+Enter creates newline
- [ ] Send button disabled when empty or sending
- [ ] Sending spinner shows during post
- [ ] Message appears in feed after sending
- [ ] Without signer: opens Farcaster compose in new tab

### @Mention Autocomplete
- [ ] Typing `@` followed by characters shows dropdown
- [ ] Dropdown shows profile pictures, display names, usernames
- [ ] Arrow keys navigate the dropdown
- [ ] Enter/Tab selects the highlighted user
- [ ] Escape closes the dropdown
- [ ] Selected username inserts into textarea with trailing space
- [ ] Debounced search (no request per keystroke)

### Cross-Post
- [ ] Share icon shows next to compose bar (signer only)
- [ ] Tapping shows other channel pills (#zabal, #cocconcertz)
- [ ] Selecting channels highlights them gold
- [ ] Badge shows count of selected channels
- [ ] Send button shows "Post (2)" or "Post (3)" with count
- [ ] Message posts to primary + selected channels
- [ ] Channel pills don't show the current channel

### Quote Posts
- [ ] Quote button visible on messages (hover on desktop, always on mobile)
- [ ] Tapping quote shows preview in compose bar
- [ ] X button removes the quote
- [ ] Sending with quote embeds the original cast
- [ ] Quoted cast appears as embed in the posted message

### Image Upload (NEW)
- [ ] Image icon appears next to compose bar (signer only)
- [ ] Tapping opens file picker
- [ ] Only accepts JPEG, PNG, GIF, WebP
- [ ] Files over 5MB rejected
- [ ] Selected image shows preview above input
- [ ] X button removes the image
- [ ] Upload spinner shows during send
- [ ] Image appears as embed in the posted cast
- [ ] Can send text + image together

---

## 6. Search (NEW — Cmd+K)

- [ ] Search icon in header opens search dialog
- [ ] `Cmd+K` (Mac) / `Ctrl+K` (Windows) opens search
- [ ] Search input auto-focuses
- [ ] Typing 2+ characters triggers search
- [ ] Results show author avatar, name, date, and highlighted matching text
- [ ] Arrow keys navigate results
- [ ] Enter opens the selected result as a thread
- [ ] Escape closes the dialog
- [ ] Clicking backdrop closes the dialog
- [ ] "No messages found" shows for zero results
- [ ] Keyboard shortcut hints shown in empty state
- [ ] Searches within the current channel only

---

## 7. Keyboard Shortcuts (NEW)

- [ ] `Cmd+K` / `Ctrl+K` — opens search dialog
- [ ] `/` — focuses compose bar (only when not in an input)
- [ ] `Escape` — closes the topmost panel (search → thread → music → sidebar)
- [ ] `Cmd+B` / `Ctrl+B` — toggles sidebar
- [ ] `M` — toggles music sidebar (only when not in an input)

---

## 8. Scheduled Casts (NEW)

- [ ] Clock icon in header opens schedule panel
- [ ] Empty state shows "No scheduled posts" with instructions
- [ ] Creating a scheduled cast via API stores it
- [ ] Pending casts listed with channel, time, and text preview
- [ ] Cancel button removes a scheduled cast
- [ ] Failed casts show error message and red badge
- [ ] Due casts auto-process when schedule panel opens

### To test scheduling (via browser console or API):
```js
// Create a scheduled cast (5 minutes from now)
fetch('/api/chat/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Test scheduled post',
    channel: 'zao',
    scheduledFor: new Date(Date.now() + 5 * 60000).toISOString(),
  })
}).then(r => r.json()).then(console.log)
```

---

## 9. Threads

- [ ] Reply count shown on messages with replies
- [ ] Tapping reply count / thread icon opens thread drawer
- [ ] Thread drawer shows parent cast with border separator
- [ ] Replies listed below with reply count badge
- [ ] Reply input at bottom of drawer
- [ ] Enter sends reply to thread
- [ ] "No replies yet" shown for threads without replies
- [ ] Close button (X) and backdrop click close drawer
- [ ] Thread auto-refreshes every 30 seconds

---

## 10. Music Player

### Music Detection
- [ ] Spotify links auto-detected and create play button
- [ ] SoundCloud links detected
- [ ] YouTube links detected
- [ ] Audius links detected
- [ ] Sound.xyz links detected
- [ ] Apple Music links detected (opens externally)
- [ ] Tidal links detected (opens externally)
- [ ] Bandcamp links detected
- [ ] Direct audio file URLs (.mp3, .wav, .flac) play inline

### Playback
- [ ] Play button in message starts playback
- [ ] Global player bar appears at bottom
- [ ] Play/pause toggle works
- [ ] Progress bar shows current position
- [ ] Duration displays correctly (NOT "83:19 / 2094:50")
- [ ] Seek by clicking progress bar works
- [ ] Skip forward/backward buttons work

### Music Sidebar
- [ ] Music note icon in header toggles sidebar
- [ ] Dot badge appears when queue has tracks
- [ ] Sidebar lists all music links from current channel
- [ ] Platform badges show correct colors (Spotify green, SoundCloud orange, etc.)
- [ ] Tapping a track in sidebar starts playback
- [ ] Desktop: sidebar opens automatically when music starts

### Song Submissions
- [ ] Plus icon in header opens submit panel
- [ ] URL input validates music links
- [ ] Optional title, artist, note fields
- [ ] Submit button saves to database
- [ ] Submissions list shows with platform badges
- [ ] Play buttons work on submissions
- [ ] Delete button works on own submissions
- [ ] Duplicate URLs rejected

---

## 11. Admin Dashboard (`/admin`)

**Access: Only FID 19640 (Zaal)**

### Members Tab
- [ ] Stats cards: total members, active, with FID, with wallet
- [ ] Member table with name, FID, wallet, status
- [ ] Add member form (collapsible)
- [ ] Remove member button with confirmation
- [ ] Toast notifications for actions

### Import Tab
- [ ] Drag & drop CSV upload zone
- [ ] File picker fallback
- [ ] Preview of parsed rows before import
- [ ] Import button with progress
- [ ] Handles duplicates gracefully

### Moderation Tab
- [ ] Hidden messages list with stats
- [ ] Empty state when no hidden messages
- [ ] Unhide button restores messages

### Access Control
- [ ] Non-admin users cannot access `/admin`
- [ ] Admin link only appears in sidebar for Zaal

---

## 12. Mini App (Farcaster Client)

- [ ] App loads inside Farcaster client (Warpcast, etc.)
- [ ] QuickAuth auto-authenticates without manual sign-in
- [ ] `sdk.actions.ready()` fires (no infinite loading spinner)
- [ ] Safe area insets respected (no content behind notch/home bar)
- [ ] `.well-known/farcaster.json` accessible at `zaoos.com/.well-known/farcaster.json`
- [ ] Splash screen shows ZAO logo with navy background
- [ ] Notification webhook receives events (add/remove/enable/disable)
- [ ] Push notifications arrive when another member posts

---

## 13. Push Notifications

- [ ] Mini app webhook stores notification tokens on `miniapp_added`
- [ ] Tokens disabled on `miniapp_removed` / `notifications_disabled`
- [ ] New message triggers notification to all other members
- [ ] Notification shows author name + message preview
- [ ] Tapping notification opens zaoos.com/chat
- [ ] Invalid tokens get disabled after failed delivery

---

## 14. Performance & Edge Cases

- [ ] Page loads in <3 seconds on 4G
- [ ] No layout shift during load
- [ ] Works in landscape orientation
- [ ] Works with browser zoom (125%, 150%)
- [ ] Handles network errors gracefully (error banners, not crashes)
- [ ] Tab visibility: polling pauses when tab hidden, resumes on focus
- [ ] Rapid channel switching doesn't cause stale data
- [ ] 1024-char message sends and displays correctly
- [ ] Special characters in messages (<, >, &, quotes) render safely
- [ ] Rate limiting: appropriate error shown when hitting limits

---

## 15. Supabase Setup Verification

- [ ] `channel_casts` table exists with correct schema
- [ ] `hidden_messages` table exists
- [ ] `allowlist` table exists
- [ ] `song_submissions` table exists
- [ ] `notification_tokens` table exists
- [ ] `scheduled_casts` table exists (new — run migration SQL)
- [ ] `uploads` storage bucket exists and is **public**
- [ ] RLS policies active on all tables

---

## Test Environments

| Environment | URL | Notes |
|---|---|---|
| Production | zaoos.com | Vercel deployment |
| Mini App | Inside Farcaster client | Test QuickAuth + notifications |
| Mobile Browser | zaoos.com on phone | Test responsive UI |
| Desktop | zaoos.com on laptop | Test keyboard shortcuts |

---

*Last updated: 2026-03-13*
