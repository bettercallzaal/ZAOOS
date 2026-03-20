# ZAO OS — Integration Test Bench

Tests for features built in the current session: MiniApp gating, cross-posting (Farcaster + Bluesky), Share to Farcaster templates, persistent music player, quick add song, ZOUNZ auction, ecosystem panel, Jitsi calls, push notifications, and mobile-specific behaviors.

Every test uses checkbox format. Walk through one at a time. Where behavior differs between desktop and mobile, both variants are listed.

---

## 1. MINIAPP TESTING

### 1.1 Detection and SDK Initialization
- [ ] **MiniApp detection in Farcaster client** — Open ZAO OS as a Mini App inside Warpcast or another Farcaster client. The `useMiniApp` hook should detect `sdk.isInMiniApp() === true`, call `sdk.actions.ready()` to dismiss the splash screen, and set `sdkReady` to true. Verify the splash screen disappears promptly.
- [ ] **Web fallback detection** — Open ZAO OS in a regular browser (Chrome, Safari). The hook should detect `isInMiniApp === false` and set state to `'web'`. The app renders normally without any MiniApp-specific behavior.
- [ ] **Safe area insets applied** — In a MiniApp context on a device with a notch (e.g., iPhone 15), verify that `context.safeAreaInsets` returns non-zero values for `top` and `bottom`. Content should not be obscured by the notch or home indicator.
- [ ] **User FID from context** — In the MiniApp, verify that `context.userFid` is populated with the signed-in Farcaster user's FID (check via console or DevTools).

### 1.2 MiniApp Gate (`MiniAppGate`)
- [ ] **Quick Auth flow** — Open ZAO OS as a Mini App. The gate should show "Signing you in..." with a spinner while `sdk.quickAuth.fetch('/api/miniapp/auth')` runs. If the user is an allowlisted member, state becomes `'allowed'` and the user is redirected to `/chat`.
- [ ] **Denied user screen** — Open ZAO OS as a Mini App with a non-allowlisted Farcaster account. After Quick Auth, the screen should show: "THE ZAO" heading, "Hey {username}!" greeting, "ZAO OS is currently invite-only" message, and a "Request Access in /zao" button.
- [ ] **Request access button** — On the denied screen, tap "Request Access in /zao". It should open the Farcaster compose URL with pre-filled text "@zaal requesting access to ZAO OS!" in the /zao channel.
- [ ] **Web context passthrough** — In a regular browser, `MiniAppGate` should immediately render `children` without any auth gate UI. States `'checking'`, `'web'`, and `'allowed'` all render children.
- [ ] **Quick Auth failure fallback** — If `sdk.quickAuth.fetch` throws or returns a non-OK response, the gate should fall back to `'web'` state and render the normal app (not a broken screen).

### 1.3 MiniApp Compose Cast
- [ ] **SDK composeCast** — In the MiniApp, trigger any "Share to Farcaster" button. Instead of opening a warpcast.com URL, it should use `sdk.actions.composeCast()` to open the native Farcaster compose UI with pre-filled text and embeds.
- [ ] **composeCast fallback** — If `sdk.actions.composeCast()` fails or returns unsuccessful, the component should fall back to opening the warpcast.com compose URL in a new window.

---

## 2. POSTING FEATURES

### 2.1 Compose Bar Basics
- [ ] **Placeholder with signer** — With a signer connected, the compose bar placeholder reads: "Message #{channel}... (type @ to mention)" where `{channel}` is the current channel (e.g., "zao").
- [ ] **Placeholder without signer** — Without a signer, the placeholder reads: "Connect Farcaster to post in channels..."
- [ ] **No signer fallback** — Without a signer, clicking "Post" opens a new tab to `https://warpcast.com/~/compose?text={encoded}&channelKey={channel}`. Below the compose bar, helper text reads: "Opens in Farcaster to post to /{channel} channel"
- [ ] **Send button states** — The Post button shows: "Post" normally, "Sending" with spinner while sending, "Post (N)" when cross-posting to N additional destinations.
- [ ] **Enter to send** — Press Enter (without Shift) in the textarea to send. Shift+Enter inserts a newline.
- [ ] **Max length** — Text is limited to 1024 characters (`maxLength={1024}`).

### 2.2 Cross-Post to Farcaster Channels
- [ ] **Open cross-post panel** — Click the share icon (left-most action button above the textarea). A row appears labeled "Also post to:" with pill buttons for each channel except the current one.
- [ ] **Select channels** — Tap channel pills to toggle them. Selected channels show gold border and background (`border-[#f5a623] bg-[#f5a623]/10`). Unselected channels show gray border.
- [ ] **Badge count on icon** — When one or more cross-post destinations are selected, a small gold badge appears on the share icon showing the count (channels + Bluesky if toggled).
- [ ] **Close cross-post panel** — Click the share icon again to close the panel. All selections are cleared.
- [ ] **Cross-post sends to multiple channels** — Write a message, select 2 additional channels, click "Post". Verify the message appears in all 3 channels (primary + 2 cross-posted). Button text should read "Post (3)" (2 channels + 1 Bluesky or 2 channels + primary).

### 2.3 Cross-Post to Bluesky
- [ ] **Bluesky toggle visible** — In the cross-post panel, a "Bluesky" pill button appears after the Farcaster channel pills.
- [ ] **Bluesky toggle styling** — When selected, the Bluesky pill shows blue styling (`border-blue-400 bg-blue-400/10 text-blue-400`). When unselected, it shows gray.
- [ ] **Bluesky toggle in count** — Enabling Bluesky adds 1 to the badge count on the share icon.
- [ ] **Bluesky cross-post parameter** — When Bluesky is toggled on and the user sends, `crossPostBluesky: true` is passed to the `onSend` callback. Verify in DevTools that the send API call includes the Bluesky flag.
- [ ] **Title tooltip** — Hovering over the Bluesky button shows tooltip: "Cross-post to @thezao on Bluesky"

### 2.4 Image Upload
- [ ] **Attach image** — Click the image icon (second action button). File picker opens, accepting JPEG, PNG, GIF, WEBP.
- [ ] **Preview shown** — After selecting an image, a thumbnail preview appears above the compose bar with a red X to remove it.
- [ ] **Size limit** — Files over 5 MB are silently rejected (no preview shown).
- [ ] **Upload on send** — When sending with an image attached, the image uploads to `/api/upload` first, then the returned URL is embedded in the cast.
- [ ] **Upload spinner** — During image upload, a spinner overlay appears on the preview thumbnail.

### 2.5 Scheduled Posts
- [ ] **Schedule toggle** — Click the clock icon (third action button). A datetime picker appears with label showing the user's timezone.
- [ ] **Min time enforced** — The datetime picker's `min` attribute is set to 1 minute in the future.
- [ ] **Schedule button** — After picking a time, click "Schedule" to submit. The post is sent to `/api/chat/schedule`.
- [ ] **Cancel schedule** — Click "Cancel" to dismiss the schedule picker without scheduling.

### 2.6 Mention Autocomplete
- [ ] **Trigger** — Type "@" followed by at least 1 character. The `MentionAutocomplete` dropdown appears above the compose bar.
- [ ] **Selection** — Click or press Enter on a username to insert it. The "@query" text is replaced with "@username " (with trailing space).
- [ ] **Dismiss** — Press Escape or click outside to close the dropdown.

---

## 3. SHARE TO FARCASTER

### 3.1 Component Variants
- [ ] **Icon variant** — `variant="icon"` renders a small share icon button (16x16 SVG). Hover color: gold. Title attribute: "Share to Farcaster".
- [ ] **Button variant** — `variant="button"` renders a styled button with purple background (`bg-purple-500/10 text-purple-400`), share icon, and label text.
- [ ] **Compact variant** — `variant="compact"` renders a tiny inline button with 12x12 icon and 10px text. Used in footers.

### 3.2 Share States
- [ ] **Idle state** — Shows the share icon (icon variant) or label text (button/compact).
- [ ] **Sharing state** — Shows a gold spinning loader. Button is disabled.
- [ ] **Shared state** — Shows a green checkmark icon (icon variant) or "Shared!" text (button/compact). Reverts to idle after 3 seconds.

### 3.3 Share Templates (verify each opens correct compose URL)
- [ ] **Song template** — `shareTemplates.song("Track Name", "Artist", "https://url")` produces: text = `Listening to "Track Name" by Artist on ZAO OS\n\nMusic artists building onchain`, embed = the URL, channel = "zao".
- [ ] **Respect rank template** — `shareTemplates.respectRank(5, 1200)` produces: text = `Ranked #5 with 1,200 Respect in The ZAO\n\nMusic artists building onchain`, embed = `https://zaoos.com/governance`, channel = "zao".
- [ ] **Proposal created template** — `shareTemplates.proposal("My Proposal", "created")` produces: text = `New proposal in The ZAO: "My Proposal"\n\nVote now on ZAO OS`, embed = governance URL.
- [ ] **Proposal voted template** — `shareTemplates.proposal("My Proposal", "voted")` produces: text = `Just voted on "My Proposal" in The ZAO\n\nGovernance by the community, for the community`.
- [ ] **Profile template (with ZID)** — `shareTemplates.profile(42, "ArtistName")` produces: text = `ZID #42 in The ZAO — ArtistName\n\nMusic artists building onchain`.
- [ ] **Profile template (no ZID)** — `shareTemplates.profile(null, "ArtistName")` produces: text = `ArtistName in The ZAO\n\nMusic artists building onchain`.
- [ ] **ZOUNZ auction template** — `shareTemplates.zounzAuction("15", "0.05")` produces: text = `ZOUNZ #15 is live — current bid: 0.05 ETH\n\nZABAL Nouns DAO on Base`, embed = nouns.build URL with token ID, channel = "zabal".
- [ ] **Invite template** — `shareTemplates.invite()` produces: text = `Music artists building onchain\n\nThe ZAO — a gated community for creators who govern, collaborate, and grow together`, embed = `https://zaoos.com`, channel = "zao".
- [ ] **Song submission template** — `shareTemplates.songSubmission("Track", "Great song!")` produces text including the note. Without a note, the note line is omitted.
- [ ] **Welcome member template** — `shareTemplates.welcomeMember("newuser")` produces: text = `Welcome @newuser to The ZAO!\n\nMusic artists building onchain`.
- [ ] **Custom template** — `shareTemplates.custom("Hello world", ["https://example.com"], "zao")` passes through text, embeds, and channel verbatim.

### 3.4 Compose URL Construction
- [ ] **URL structure** — When not in MiniApp and not using signer, clicking share opens `https://warpcast.com/~/compose?text={encoded}&embeds[]={url}&channelKey={channel}` in a new window.
- [ ] **Multiple embeds** — If the template has multiple embeds, each is appended as a separate `embeds[]` parameter.
- [ ] **No channel** — If the template has no channel, the `channelKey` parameter is omitted.

### 3.5 Signer Mode
- [ ] **Direct post via signer** — When `useSigner={true}`, clicking share POSTs to `/api/chat/send` with `{ text, channel, embedUrls }`. On success, shows "Shared!" confirmation.
- [ ] **Signer failure fallback** — If the API call fails, falls back to opening the compose URL.

### 3.6 MiniApp Mode
- [ ] **SDK compose in MiniApp** — When running inside a Farcaster MiniApp, clicking any share button calls `composeCast()` via the SDK instead of opening a URL.
- [ ] **MiniApp fallback** — If `composeCast()` fails, falls back to `openComposeUrl()`.

---

## 4. MUSIC PLAYER

### 4.1 Persistent Player Visibility
- [ ] **Shows when track loaded** — Navigate to any page other than `/chat` with a track playing. The persistent player bar appears fixed above the bottom nav.
- [ ] **Hidden on chat page** — Navigate to `/chat`. The persistent player is hidden (ChatRoom has its own GlobalPlayer). Verify via `pathname.startsWith('/chat')` check.
- [ ] **Hidden when no track** — With no track loaded (`player.metadata === null`), the persistent player does not render.
- [ ] **Position (mobile)** — On mobile, the player sits at `bottom: 56px` (above the 56px bottom nav bar). CSS: `bottom-14`.
- [ ] **Position (desktop)** — On desktop, the player sits at `bottom: 0`. CSS: `md:bottom-0`.

### 4.2 Player UI Elements
- [ ] **Artwork** — Shows the track's artwork image (40x40 rounded-lg). If no artwork, shows a music note icon on a gradient background.
- [ ] **Playing indicator** — When playing, three animated bouncing gold bars appear on the artwork, and the artwork gets a gold ring (`ring-1 ring-[#f5a623]/30`).
- [ ] **Track info** — Track name (white, truncated) and artist name (gray-400, truncated) are displayed.
- [ ] **Time display** — Shows "MM:SS / MM:SS" format (current position / total duration) in 9px gray text.
- [ ] **Progress bar** — A thin gold bar at the top of the player shows playback progress. Width transitions smoothly (`transition-[width] duration-300`).
- [ ] **Platform badge** — A small pill shows the platform type. "applemusic" shows as "Apple", "soundxyz" shows as "Sound", others show their type name capitalized.

### 4.3 Player Controls
- [ ] **Play/pause toggle** — Tap the circular white button to toggle play/pause. Shows pause icon (two bars) when playing, play icon (triangle) when paused.
- [ ] **Loading state** — While audio is loading, the play button shows a spinning loader instead of play/pause icon. Button is disabled.
- [ ] **Close player** — Tap the X button (small, gray, right-most) to stop playback and hide the player.
- [ ] **Share button** — The share icon between track info and platform badge triggers `ShareToFarcaster` with the song template populated from current track metadata.

### 4.4 Quick Add Song (`QuickAddSong`)
- [ ] **Floating button visible** — When no track is playing and the quick add sheet is closed, a gold circular "+" button appears at `bottom-20 right-4` (mobile) or `bottom-4` (desktop).
- [ ] **Floating button hidden** — When a track is playing (persistent player visible), the floating button is hidden to avoid overlap.
- [ ] **Open bottom sheet** — Tap the "+" button. A bottom sheet slides up from the bottom with a drag handle, "Add a Song" header, and close button.
- [ ] **Backdrop dismiss** — Tapping the dark backdrop behind the sheet closes it.

### 4.5 URL Detection and Metadata
- [ ] **Valid URL detection** — Paste a Spotify track URL (e.g., `https://open.spotify.com/track/abc123`). The input border turns green, and a green checkmark appears.
- [ ] **Invalid URL detection** — Type a non-music URL. The input border turns red. No metadata loads.
- [ ] **Auto-fetch metadata** — After pasting a valid music URL, metadata auto-fetches after a 500ms debounce. A spinner appears in the input while loading.
- [ ] **Metadata preview card** — When metadata loads, a card appears showing: artwork (48x48), track name, artist name, platform badge (e.g., "Apple Music", "Sound.xyz"), and a play preview button.
- [ ] **Play preview** — Tap the play button on the metadata card. The track starts playing in the persistent player.

### 4.6 Supported Platforms (8 platforms)
Test URL recognition for each platform by pasting a URL into the Quick Add input:
- [ ] **Spotify** — `https://open.spotify.com/track/...` — input turns green, type detected as "spotify"
- [ ] **Apple Music** — `https://music.apple.com/us/album/...` — detected as "applemusic"
- [ ] **SoundCloud** — `https://soundcloud.com/artist/track` — detected as "soundcloud"
- [ ] **YouTube** — `https://youtube.com/watch?v=...` or `https://youtu.be/...` — detected as "youtube"
- [ ] **Tidal** — `https://tidal.com/browse/track/...` — detected as "tidal"
- [ ] **Bandcamp** — `https://artist.bandcamp.com/track/trackname` — detected as "bandcamp"
- [ ] **Audius** — `https://audius.co/artist/track` — detected as "audius"
- [ ] **Sound.xyz** — `https://sound.xyz/...` — detected as "soundxyz"
- [ ] **Direct audio** — URL ending in `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac` — detected as "audio"

### 4.7 Song Submission
- [ ] **Submit with metadata** — Paste a valid URL, wait for metadata, optionally add a note in "Why this song?" field, click "Add Song" (button text shows `Add "{trackName}"`). POST to `/api/music/submissions` succeeds.
- [ ] **Success feedback** — On success, green feedback bar shows "Song added!". The track auto-plays in the persistent player. After 1.5 seconds, the sheet closes and fields reset.
- [ ] **Error feedback** — On API error, red feedback bar shows the error message. Disappears after 3 seconds.
- [ ] **Share after submit** — After successful submission, a "Share to Farcaster" button appears using the `songSubmission` template.
- [ ] **Submit disabled states** — The "Add Song" button is disabled when: submitting, URL is empty, or URL is not a recognized music URL.
- [ ] **Platform hint text** — Below the submit button, small text reads: "Spotify, Apple Music, SoundCloud, YouTube, Tidal, Bandcamp, Audius, Sound.xyz"

---

## 5. BLUESKY INTEGRATION

### 5.1 Connect Account (Settings Page)
- [ ] **Bluesky row in connections** — Settings page shows a Bluesky connection row with a colored dot: blue when connected, gray when not.
- [ ] **Connect form toggle** — When not connected, clicking the Bluesky row reveals a form with two inputs: handle and app password.
- [ ] **Handle input** — Placeholder: handle field for entering your Bluesky handle (e.g., "user.bsky.social").
- [ ] **App password input** — Password field for entering a Bluesky App Password (not the account password).
- [ ] **Connect button** — "Connect Bluesky" button. While verifying, shows "Verifying..." and is disabled.
- [ ] **Successful connection** — On success, the form closes, the Bluesky row shows blue dot + "@{handle}" text, and a "Disconnect" link appears.
- [ ] **Invalid credentials error** — Enter wrong credentials. Error message appears: "Invalid Bluesky credentials. Make sure you use an App Password, not your account password."
- [ ] **Connection count** — The settings progress indicator counts Bluesky as one of 5 possible connections (wallet, Farcaster, signer, XMTP, Bluesky).

### 5.2 Disconnect Account
- [ ] **Disconnect link** — When connected, a red "Disconnect" link appears next to the handle. Click it to send `DELETE /api/bluesky`.
- [ ] **Post-disconnect state** — After disconnecting, the row reverts to gray dot + "Connect" button. Bluesky DID, handle, and app password are cleared from the database.

### 5.3 Bluesky API Routes
- [ ] **GET /api/bluesky (status check)** — Returns `{ connected: true/false, handle: "..." }` for the current user. Requires session auth (401 if not logged in).
- [ ] **POST /api/bluesky (connect)** — Body: `{ handle, appPassword }`. Verifies credentials by logging into `bsky.social`, stores DID + handle + app password in the users table. Returns `{ success: true, handle, did }`.
- [ ] **POST /api/bluesky (missing fields)** — Body: `{}` or missing fields. Returns 400: "Handle and app password are required".
- [ ] **DELETE /api/bluesky (disconnect)** — Clears `bluesky_did`, `bluesky_handle`, and `bluesky_app_password` from the user's row. Returns `{ success: true }`.

### 5.4 Cross-Post to Bluesky (Backend)
- [ ] **postToBluesky with user credentials** — When a user has connected Bluesky and sends a post with the Bluesky toggle on, `postToBluesky()` is called with their stored credentials. Verify the post appears on their Bluesky profile.
- [ ] **postToBluesky with community account** — When no user credentials are available, falls back to the community Bluesky account (env vars `BLUESKY_HANDLE` + `BLUESKY_APP_PASSWORD`). Returns null if env vars are not set.
- [ ] **Text truncation** — Bluesky has a 300-character limit. Text longer than 270 characters (270 to leave room for a link) is truncated with "..." appended. Verify long posts are properly truncated.
- [ ] **Rich text facets** — Links and mentions in the post text are detected via `RichText.detectFacets()` and rendered as clickable links on Bluesky.
- [ ] **Session caching** — The community agent caches its session for 30 minutes. Making two posts within 30 minutes should not trigger two logins.

---

## 6. ZOUNZ AUCTION

### 6.1 Loading State
- [ ] **Spinner on load** — When the ZounzAuction component mounts, it shows a spinner with "Loading ZOUNZ auction..." while fetching on-chain data from Base.

### 6.2 Auction Display
- [ ] **NFT image** — The current auction token's image is displayed in a square aspect-ratio container. Image is fetched from the token's `tokenURI` (supports both base64 data URIs and HTTPS URLs).
- [ ] **Token name** — Shows the token name from metadata (e.g., "ZOUNZ #15") or falls back to "ZOUNZ #{tokenId}".
- [ ] **nouns.build link** — A small "nouns.build" link in the header opens the token on `nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883/{tokenId}` in a new tab.
- [ ] **Current bid display** — Shows the highest bid in ETH (e.g., "0.05 ETH") or "No bids" if no bids exist. Below the bid, shows the bidder's truncated address (e.g., "0x1234...abcd").
- [ ] **Your bid indicator** — If the connected wallet is the highest bidder, "(you)" appears in gold next to the address.
- [ ] **Countdown timer** — Shows time remaining in "Xh Xm Xs" format, updating every second. When the auction ends, shows "Auction ended" in red.

### 6.3 Placing a Bid
- [ ] **Bid input** — Number input with step 0.001, placeholder shows minimum bid amount (e.g., "0.055 ETH min"). "ETH" label shown inside the input.
- [ ] **Min bid calculation** — Minimum next bid = current highest bid + (highest bid * minBidIncrement / 100). If no bids, minimum = reserve price or 0.001 ETH.
- [ ] **Bid button states** — "Bid" normally, "Bidding..." while transaction is pending, "Confirming..." while waiting for confirmation.
- [ ] **Bid button disabled** — Disabled when: wallet not connected, no bid amount entered, bid below minimum, or transaction in progress.
- [ ] **Wallet not connected message** — When wallet is not connected, shows "Connect your wallet to bid" below the input.
- [ ] **Bid error** — If the transaction fails, the first line of the error message is shown in red text.
- [ ] **Bid success** — "Bid placed successfully!" appears in green. The bid input clears and auction data refreshes.
- [ ] **Auto-refresh** — Auction state refreshes every 15 seconds to show new bids from other users.

### 6.4 Ended/Settled States
- [ ] **Ended auction** — When `endTime` has passed, bid input is hidden. Shows: "Auction ended -- waiting for settlement".
- [ ] **Settled auction** — When `settled === true`, shows: "Auction settled".

### 6.5 Error State
- [ ] **Fetch error** — If on-chain data fails to load, shows error text in red + a "View on nouns.build" link as fallback.

### 6.6 Share and Footer
- [ ] **Share button** — Compact "Share" link in footer triggers the ZOUNZ auction share template with current token ID and bid amount. Channel = "zabal".
- [ ] **Min increment display** — Footer shows "Min: {N}%" indicating the minimum bid increment percentage.
- [ ] **DAO label** — Footer shows "ZABAL Nouns DAO on Base".

---

## 7. ECOSYSTEM TAB

### 7.1 ZOUNZ Auction Featured
- [ ] **Auction at top** — The ZOUNZ Auction component renders at the top of the ecosystem panel under the heading "ZOUNZ Auction".
- [ ] **Dynamic import** — ZounzAuction is loaded via `next/dynamic` with `ssr: false`. It should not flash or break on initial page load.

### 7.2 Partner Cards
- [ ] **Partners listed** — All partners from `communityConfig.partners` are listed as expandable cards below the auction. Each shows an emoji icon, name, and description.
- [ ] **Section headers** — "ZABAL Partner Apps" label and "Tap a partner to open their ZABAL integration inline." instruction text appear above the cards.
- [ ] **Icon mapping** — Partner icons map to emojis: magnet = magnet, music = musical note, castle = castle, rocket = rocket, coin = coin, nouns = house symbol. Unmapped icons show a link emoji.

### 7.3 Expand/Collapse
- [ ] **Expand partner** — Click a partner card. The card expands to show an iframe embed of the partner's ZABAL-specific URL (e.g., SongJam shows `songjam.space/zabal`).
- [ ] **Collapse partner** — Click the same partner card again. The iframe collapses.
- [ ] **Single expand** — Only one partner can be expanded at a time. Expanding a new one collapses the previous.
- [ ] **Chevron rotation** — The chevron icon rotates 180 degrees when expanded.

### 7.4 Iframe Embeds
- [ ] **Iframe dimensions** — Expanded iframe is full-width with `height: 70vh` and `min-height: 400px`.
- [ ] **Sandbox attributes** — Iframe has sandbox: `allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation`.
- [ ] **Lazy loading** — Iframes use `loading="lazy"` to avoid loading until expanded.
- [ ] **Footer bar** — Below each iframe, a footer shows the embed URL (without "https://") and an "Open in new tab" link.

### 7.5 External Link
- [ ] **Open link** — Each partner card has a small "Open" link that opens the partner URL in a new tab. Clicking "Open" does NOT expand/collapse the card (uses `e.stopPropagation()`).

### 7.6 Known Partner Embed URLs
Verify each partner loads its ZABAL-specific URL (not a generic URL):
- [ ] **SongJam** — `https://songjam.space/zabal`
- [ ] **Empire Builder** — `https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af`
- [ ] **Incented** — `https://incented.co/organizations/zabal`
- [ ] **MAGNETIQ** — `https://app.magnetiq.xyz`
- [ ] **Clanker** — `https://clanker.world`
- [ ] **ZOUNZ** — `https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883`

---

## 8. CALLS / JITSI

### 8.1 Room List Page (`/calls`)
- [ ] **Page header** — Shows "Calls" heading with a "Back to Tools" link to `/tools`.
- [ ] **Preset rooms** — Three preset rooms are listed under "Rooms" label:
  1. "Fractal Call" — "Weekly governance and coordination call" — audio-only (microphone icon)
  2. "Music Listening Room" — "Listen to tracks together and give feedback" — audio-only (microphone icon)
  3. "Open Hangout" — "Casual voice chat -- drop in anytime" — video enabled (camera icon)
- [ ] **Join button** — Each preset room shows a gold "Join" badge on the right side.
- [ ] **Room card hover** — Hovering a room card highlights the border gold (`hover:border-[#f5a623]/40`).

### 8.2 Custom Room Creation
- [ ] **Create section** — Below preset rooms, a "Create a Room" section with a text input and "Create & Join" button.
- [ ] **Room name input** — Placeholder: "Room name..." with max length 60 characters.
- [ ] **Create button disabled** — "Create & Join" button is disabled when the input is empty.
- [ ] **Enter to create** — Pressing Enter in the input field creates and joins the room.
- [ ] **Room name sanitization** — Custom names are sanitized: lowercased, non-alphanumeric characters replaced with hyphens, leading/trailing hyphens stripped.
- [ ] **Unique room names** — Generated Jitsi room names follow pattern `zao-{slug}-{timestamp+random}` to avoid collisions.

### 8.3 Active Call View
- [ ] **Full-screen layout** — When a room is joined, the page switches to a full-screen call view (`fixed inset-0 z-50`) with the Jitsi iframe filling the viewport.
- [ ] **Call header** — Shows a green pulsing dot, the room label, and a red "Leave" button.
- [ ] **Leave button** — Clicking "Leave" returns to the room list.
- [ ] **Jitsi ready-to-close** — When the Jitsi meeting ends via the hangup button inside the iframe, `onReadyToClose` fires and returns to the room list.

### 8.4 Jitsi Configuration
- [ ] **Audio-only mode** — Rooms marked `audioOnly: true` start with video muted and audio-only mode enabled. The camera is off by default.
- [ ] **Video mode** — Rooms marked `audioOnly: false` start with video unmuted.
- [ ] **No prejoin screen** — Prejoin is disabled (`prejoinConfig: { enabled: false }`). Users join immediately.
- [ ] **Toolbar buttons** — Only these buttons appear: microphone, camera, chat, raisehand, participants-pane, hangup, tileview. No recording, screen sharing, etc.
- [ ] **No watermarks** — Jitsi watermarks are hidden (`SHOW_JITSI_WATERMARK: false`).
- [ ] **Domain** — Jitsi uses the public `meet.jit.si` domain.

### 8.5 Mobile-Specific Calls
- [ ] **Full-screen on mobile** — The call view fills the entire screen on mobile, with no bottom nav visible.
- [ ] **Leave button accessible** — The "Leave" button in the header remains accessible on mobile (not hidden behind safe areas).

---

## 9. PUSH NOTIFICATIONS

### 9.1 Notification Status (Settings)
- [ ] **Status fetch on load** — When settings page loads, `GET /api/notifications/status` is called. The push notification toggle reflects the current status.
- [ ] **Toggle visible** — A toggle switch for push notifications appears in the settings connections/notifications section.

### 9.2 Enable Notifications (MiniApp only)
- [ ] **MiniApp requirement** — Push notification toggle only works inside a Farcaster MiniApp. In a regular browser, the toggle does nothing (function returns early if `!inMiniApp`).
- [ ] **Enable flow** — Toggling ON calls `sdk.actions.addMiniApp()`. If the user accepts, `notificationDetails` is returned and `pushEnabled` is set to true.
- [ ] **Enable state persistence** — After enabling, refreshing the page should show the toggle as ON (fetched from `/api/notifications/status`).

### 9.3 Disable Notifications
- [ ] **Disable flow** — Toggling OFF sends POST to `/api/miniapp/webhook` with `{ event: 'notifications_disabled', fid }`. The toggle switches to OFF.
- [ ] **Toggle loading state** — While toggling, the button shows a loading/disabled state (`pushToggling` prevents double-taps).

### 9.4 Send Notifications (Admin API)
- [ ] **Admin-only access** — POST `/api/notifications/send` as non-admin returns 403 "Unauthorized".
- [ ] **Valid request** — POST with `{ recipientFids: [12345], title: "Test", body: "Hello", targetUrl: "https://zaoos.com/chat" }` sends a notification. Returns `{ sent: N, skipped: N }`.
- [ ] **Zod validation** — Missing or invalid fields return 400 with details:
  - `recipientFids` must be array of positive integers (min 1, max 500)
  - `title` must be 1-100 characters
  - `body` must be 1-500 characters
  - `targetUrl` must be a valid URL
- [ ] **Rate limiting: per-user 30s** — Sending two notifications to the same FID within 30 seconds: the second is skipped (not sent).
- [ ] **Rate limiting: daily 100** — After 100 notifications to a FID in 24 hours, further notifications are skipped.
- [ ] **Invalid token handling** — If Farcaster's notification endpoint reports a token as invalid, the token is disabled in the database (`enabled: false`).
- [ ] **No eligible tokens** — If no users have enabled tokens, returns `{ sent: 0, skipped: N, errors: [] }`.
- [ ] **Notification logging** — Successful sends are logged to the `notification_log` table with fid, title, body, target_url, and timestamp.

---

## 10. PROFILE ENRICHMENT

### 10.1 Enriched Profile API (`GET /api/members/profile?fid=NUMBER`)
- [ ] **Auth required** — Returns 401 without a session.
- [ ] **FID validation** — Invalid FID (non-numeric, negative, zero) returns 400 with Zod errors.
- [ ] **Neynar data** — Response includes: `fid`, `username`, `displayName`, `pfpUrl`, `bio`, `followerCount`, `followingCount`, `powerBadge`, `verifiedAddresses`, `solAddresses`.
- [ ] **Viewer context** — Response includes `viewerContext` showing whether the current user follows/is followed by the target.
- [ ] **ZAO membership** — `isZaoMember: true/false` based on allowlist. Includes `zaoName`, `zid`, `blueskyHandle`.
- [ ] **Active channels** — `activeChannels` array with channel ID, name, and image URL (up to 20 channels).
- [ ] **Community stats** — `communityStats` object with `songsSubmitted`, `proposalsCreated`, `votesCast` counts.
- [ ] **Graceful degradation** — If any data source fails (Neynar down, Supabase table missing), other fields still return. Uses `Promise.allSettled` for all 7 parallel queries.
- [ ] **User not found** — If Neynar returns no user for the FID, returns 404: "User not found on Farcaster".

---

## 11. MOBILE-SPECIFIC TESTING

### 11.1 iOS Zoom Prevention
- [ ] **No zoom on input focus** — On iOS Safari, focusing a text input should NOT trigger page zoom. Verify inputs use `text-base` (16px) or larger font size (inputs in ComposeBar and QuickAddSong both use `text-base md:text-sm`).
- [ ] **Quick Add input** — The "Paste any music link..." input uses `text-base md:text-sm`. On mobile this renders at 16px, preventing iOS zoom.
- [ ] **Note input** — The "Why this song?" input also uses `text-base md:text-sm`.

### 11.2 Touch Targets
- [ ] **Persistent player play button** — 36x36 pixels (`w-9 h-9`), meets the 44px WCAG recommendation when including padding. Button uses `active:scale-95` for tactile feedback.
- [ ] **Quick Add floating button** — 48x48 pixels (`w-12 h-12`), exceeds minimum touch target.
- [ ] **Close buttons** — All close/X buttons are at least `p-1` padding around the icon, giving sufficient touch area.
- [ ] **Compose bar action buttons** — Each action button (cross-post, image, schedule) has `p-1.5` padding for adequate touch targets.

### 11.3 Bottom Nav Stacking
- [ ] **Persistent player above nav** — On mobile, the persistent player renders at `bottom: 56px` (above the bottom nav). Both are visible simultaneously without overlap.
- [ ] **Quick Add button position** — The floating "+" button renders at `bottom-20` (80px) on mobile, above both the bottom nav and potential persistent player.
- [ ] **Quick Add hidden with player** — When a track is playing (persistent player visible), the floating "+" button is hidden to prevent UI clutter.
- [ ] **Call view hides nav** — The Jitsi call view uses `fixed inset-0 z-50`, completely covering the bottom nav.

### 11.4 Safe Areas
- [ ] **MiniApp safe area insets** — In a Farcaster MiniApp on iPhone, safe area insets from `useMiniApp().context.safeAreaInsets` should be respected. Content should not render under the notch or home indicator.
- [ ] **Bottom sheet safe area** — The QuickAddSong bottom sheet anchors to `inset-x-0 bottom-0` and has internal padding. On devices with a home indicator, content should remain above the safe area.
- [ ] **Call view safe area** — The Jitsi call header with the "Leave" button should remain accessible above the notch area.

### 11.5 Bottom Sheet Behavior
- [ ] **Slide-up animation** — Opening QuickAddSong triggers `animate-slide-up` animation on the bottom sheet.
- [ ] **Max height** — The bottom sheet has `max-h-[70vh]` to prevent it from covering the entire screen.
- [ ] **Drag handle** — A small gray bar (`w-10 h-1 rounded-full bg-gray-700`) appears at the top as a visual drag handle.
- [ ] **Backdrop dismiss** — Tapping the dark overlay (`bg-black/60`) behind the sheet closes it.

### 11.6 Responsive Layout Differences

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Persistent player position | `bottom-14` (above nav) | `md:bottom-0` (flush) |
| Quick Add "+" position | `bottom-20 right-4` | `md:bottom-4` |
| Input font sizes | `text-base` (16px, no zoom) | `md:text-sm` (14px) |
| Call view | Full-screen, covers nav | Full-screen |
| Bottom sheet | Full-width, 70vh max | Full-width, 70vh max |
| Ecosystem iframes | Full-width, scrollable | Full-width, 70vh height |

---

## 12. QUICK INTEGRATION SMOKE TEST (10 min)

1. [ ] Open `/chat` -> write a message -> click cross-post icon -> select another channel + Bluesky -> send. Verify post appears in primary channel. Check DevTools for cross-post API params.
2. [ ] Navigate to `/settings` -> scroll to Bluesky connection -> enter valid handle + app password -> click "Connect Bluesky" -> verify blue dot and handle appear.
3. [ ] Navigate away from `/chat` to `/governance` -> play a song from the music tab first -> verify persistent player appears above bottom nav with correct track info.
4. [ ] Tap the "+" floating button -> paste a Spotify URL -> verify metadata loads -> add optional note -> submit -> verify "Song added!" feedback and auto-play.
5. [ ] Navigate to ecosystem tab -> verify ZOUNZ auction loads with NFT image and bid data -> expand a partner card -> verify iframe loads.
6. [ ] Navigate to `/calls` -> tap "Fractal Call" -> verify Jitsi loads in full-screen audio-only mode -> tap "Leave" -> return to room list.
7. [ ] On any page, tap a "Share to Farcaster" button -> verify compose URL opens with correct pre-filled text and embeds.
8. [ ] Check the persistent player close button (X) -> verify player disappears and floating "+" button reappears.
9. [ ] On mobile device: verify bottom nav, persistent player, and floating button all stack correctly without overlap.
10. [ ] In MiniApp context (if available): verify Quick Auth, safe area insets, and SDK compose cast all work.
