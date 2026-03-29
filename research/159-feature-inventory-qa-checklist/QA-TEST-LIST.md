# ZAO OS — Comprehensive QA Test List

**Generated:** 2026-03-28
**Scope:** Full feature inventory across all pages, components, API routes, and interactive elements
**Total tests:** 248

---

## 1. Public Pages (No Auth)

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 1 | `/` | Landing page load | Open root URL when logged out | Logo, hero text, feature badges (Community, Music, Encrypted, Governance), login buttons visible | none | P0 |
| 2 | `/` | Farcaster Sign In | Click "Sign in with Farcaster" button | Farcaster auth-kit popup appears, nonce fetched from server | none | P0 |
| 3 | `/` | Wallet Sign In | Click wallet login button (SIWE) | RainbowKit/wallet connect modal opens | none | P0 |
| 4 | `/` | Discord join link | Click "Join on Discord" in footer section | Opens discord.thezao.com in new tab | none | P2 |
| 5 | `/` | Auto redirect | Visit root URL while logged in | Redirects to /home | login | P0 |
| 6 | `/not-allowed` | Access denied page | Visit when not on allowlist | Shows access denied message with instructions | none | P1 |
| 7 | `/onboard` | Wallet check form | Enter an Ethereum address and submit | Shows allowlist check result (allowed or denied) | none | P1 |
| 8 | `/onboard` | Invalid wallet | Enter invalid address format | Shows "Please enter a valid Ethereum address" error | none | P1 |
| 9 | `/members` | Public directory load | Navigate to /members (no auth required) | Member cards render, sorted by respect by default | none | P0 |
| 10 | `/members` | Search members | Type in search box | Filters member list by name/username in real time | none | P1 |
| 11 | `/members` | Filter presets | Click "Musicians with 100+ Respect" preset chip | Applies category=musician and min_respect=100 filters | none | P1 |
| 12 | `/members` | Sort options | Change sort dropdown (respect/name/recent/active) | Member list reorders correctly | none | P1 |
| 13 | `/members` | Tier filter | Select "Respect Holder" tier filter | Shows only members with respect tokens | none | P1 |
| 14 | `/members` | Category filter | Select a category (e.g., "musician") | Filters to members with that artist profile category | none | P1 |
| 15 | `/members` | Location filter | Select a location from dropdown | Filters to members in that location | none | P2 |
| 16 | `/members` | Platform filter | Filter by platform (audius/spotify/etc.) | Shows only members with that platform linked | none | P2 |
| 17 | `/members` | Has ENS filter | Toggle "Has ENS identity" | Shows only members with ENS names | none | P2 |
| 18 | `/members` | Featured filter | Toggle "Featured artists" | Shows only featured artist profiles | none | P2 |
| 19 | `/members` | Min respect slider | Set minimum respect threshold | Hides members below that threshold | none | P2 |
| 20 | `/members` | Active since filter | Select "7d" / "30d" / "90d" | Shows only members active within that window | none | P2 |
| 21 | `/members/[username]` | Public profile page | Click a member card to view profile | Shows member detail page with bio, platforms, respect | none | P1 |
| 22 | `/spaces` | Public spaces list | Navigate to /spaces | Shows live stages, "Create Stage" button (if logged in) or "Sign in to host" link | none | P0 |
| 23 | `/spaces` | Real-time updates | Another user starts a space | New stage card appears via Supabase realtime subscription | none | P1 |
| 24 | `/spaces/[id]` | Join a space (Livepeer) | Click "Join" on a live stage card | Enters the audio room, gets stream token | none | P0 |
| 25 | `/spaces/hms/[id]` | Join 100ms room | Navigate to an HMS room URL | Loads 100ms audio room with provider label | none | P1 |

---

## 2. Auth Flow

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 26 | `/` | Farcaster login success | Complete Farcaster SIWF flow | Verifies signature, creates session, redirects to /home | none | P0 |
| 27 | `/` | Farcaster login — not on allowlist | Login with Farcaster account not on allowlist | Shows "not on the allowlist" error message | none | P0 |
| 28 | `/` | Farcaster login — expired nonce | Wait too long, then try to sign in | Shows "session may have expired" error, nonce refreshes | none | P1 |
| 29 | `/` | Wallet login (SIWE) | Connect wallet and sign SIWE message | Creates session with wallet address, redirects to /home | none | P0 |
| 30 | `/` | Rate limiting | Attempt 10+ logins rapidly | Returns 429 "Too many login attempts" | none | P1 |
| 31 | `/api/auth/logout` | Logout | Click logout (from sidebar or settings) | Session destroyed, redirected to landing page | login | P0 |
| 32 | `/settings` | Connect Farcaster signer | Click Neynar SIWN button in Write Access section | Signer UUID saved, "Signer Connected" status shows | login | P0 |
| 33 | `/settings` | Signer status check | Visit settings with existing signer | Shows green "Signer active" with truncated UUID | login | P1 |

---

## 3. Home & Feed

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 34 | `/home` | Home page load | Navigate to /home | Shows logo header, streak badge, notification bell, profile avatar | login | P0 |
| 35 | `/home` | Now Playing hero | Have a track playing in the music player | NowPlayingHero section shows current track info | login | P1 |
| 36 | `/home` | Core nav cards | Click Chat / Music / Governance / Social cards | Navigates to correct page | login | P0 |
| 37 | `/home` | Create & Contribute section | Click Spaces / Calls / Contribute / Library cards | Navigates to correct page | login | P1 |
| 38 | `/home` | Ecosystem section | Click Ecosystem / WaveWarZ / Respect / Members cards | Navigates to correct page | login | P1 |
| 39 | `/home` | Settings & Admin section | Click Settings / Notifications / Tools rows | Navigates to correct page | login | P1 |
| 40 | `/home` | Activity feed toggle | Click "Recent Activity" accordion | Expands to show ActivityFeed component; click again to collapse | login | P1 |
| 41 | `/home` | Streak badge | Log in daily | StreakBadge shows current streak count | login | P2 |
| 42 | `/home` | Login streak recording | First login of the day | POST /api/streaks/record fires silently | login | P2 |

---

## 4. Chat & Messaging

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 43 | `/chat` | Channel list load | Open /chat | Default channel (#zao) loads with messages, channel tabs visible | login | P0 |
| 44 | `/chat` | Switch channels | Click different channel tab (from community.config channels) | Messages reload for selected channel | login | P0 |
| 45 | `/chat` | Send message | Type text in compose bar and press Enter | Message posts to Farcaster, appears in feed | login+signer | P0 |
| 46 | `/chat` | Send without signer | Try to compose when no signer connected | SignerConnect CTA shown above compose bar | login | P0 |
| 47 | `/chat` | Reply to message | Click reply on a message, type reply in compose | Reply sends with correct parent hash, reply context shown in compose | login+signer | P0 |
| 48 | `/chat` | Quote cast | Click quote on a message | Quoted cast preview appears in compose bar; sends embed on submit | login+signer | P1 |
| 49 | `/chat` | Thread drawer | Click thread icon on a message | ThreadDrawer opens showing full conversation thread | login | P0 |
| 50 | `/chat` | Like message | Click like/heart on a message | Neynar like API called, heart fills | login+signer | P1 |
| 51 | `/chat` | Recast message | Click recast on a message | Neynar recast API called, recast icon activates | login+signer | P1 |
| 52 | `/chat` | Hide message (admin) | Admin clicks hide on a message | Message removed from feed, marked hidden in DB | admin | P1 |
| 53 | `/chat` | Content filter — All | Select "All" in FeedFilters | Shows all messages | login | P1 |
| 54 | `/chat` | Content filter — Music | Select "Music" filter | Shows only messages containing music URLs/embeds | login | P1 |
| 55 | `/chat` | Content filter — Images | Select "Images" filter | Shows only messages with image embeds | login | P1 |
| 56 | `/chat` | Content filter — Video | Select "Video" filter | Shows only messages with video embeds | login | P1 |
| 57 | `/chat` | Content filter — Links | Select "Links" filter | Shows only messages with URL embeds | login | P1 |
| 58 | `/chat` | Content filter — Text | Select "Text" filter | Shows only text-only messages | login | P1 |
| 59 | `/chat` | Sort — Newest | Select "Newest" sort | Messages sorted newest first | login | P1 |
| 60 | `/chat` | Sort — Most Liked | Select "Most Liked" sort | Messages sorted by like count descending | login | P1 |
| 61 | `/chat` | Sort — Most Replied | Select "Most Replied" sort | Messages sorted by reply count descending | login | P1 |
| 62 | `/chat` | Load more (pagination) | Scroll to bottom of message list | "Load more" triggers, older messages append | login | P1 |
| 63 | `/chat` | Trending tab | Click "Trending" tab | TrendingFeed loads with curated content | login | P1 |
| 64 | `/chat` | Search dialog | Click search icon or Cmd+K | SearchDialog opens; type query to search messages | login | P1 |
| 65 | `/chat` | Song submit | Click "+" icon in header | SongSubmit panel opens for submitting music to the channel | login+signer | P1 |
| 66 | `/chat` | Scheduled posts | Click clock icon in header | SchedulePanel opens showing scheduled posts | login+signer | P1 |
| 67 | `/chat` | FAQ panel | Open sidebar, click FAQ | FaqPanel slides in | login | P2 |
| 68 | `/chat` | Tutorial panel | Open sidebar, click Tutorial | TutorialPanel slides in | login | P2 |
| 69 | `/chat` | Respect panel | Open sidebar, click Respect | RespectPanel slides in | login | P2 |
| 70 | `/chat` | Profile drawer | Click user avatar/name in message | ProfileDrawer opens with user info, follow button, DM option | login | P1 |
| 71 | `/chat` | Sidebar toggle | Click hamburger icon (mobile) or sidebar toggle | Sidebar slides in/out with channels, DMs, XMTP | login | P0 |
| 72 | `/chat` | XMTP auto-connect | Have wallet connected when entering chat | XMTP connects automatically in background | login+wallet | P1 |
| 73 | `/chat` | XMTP DM | Select a DM conversation from sidebar | XMTP MessageThread loads with encrypted messages | login+wallet | P1 |
| 74 | `/chat` | XMTP send message | Type and send in DM view | Message sent via XMTP, appears in thread | login+wallet | P1 |
| 75 | `/chat` | New DM dialog | Click "New DM" in sidebar | NewConversationDialog opens, can search ZAO members | login+wallet | P1 |
| 76 | `/chat` | New Group dialog | Click "New Group" in sidebar | Group creation dialog with name + member selection | login+wallet | P1 |
| 77 | `/chat` | Group info drawer | Click info icon on a group conversation | GroupInfoDrawer shows members, leave/remove options | login+wallet | P1 |
| 78 | `/chat` | Start DM from member list | Click a ZAO member in sidebar member list | Creates DM with that member, opens conversation | login+wallet | P1 |
| 79 | `/chat` | Keyboard shortcuts | Press Cmd+K, Escape, etc. | Search opens on Cmd+K, panels close on Escape | login | P2 |
| 80 | `/messages` | Messages page | Navigate to /messages | MessagesRoom loads with XMTP provider | login | P1 |

---

## 5. Music Player

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 81 | `/music` | Music page load | Navigate to /music | Page loads with Omnibar, TOTD banner, sticky tab bar, all 12 sections | login | P0 |
| 82 | `/music` | Omnibar search | Type a song/artist name in the omnibar | Search results from multiple providers appear | login | P0 |
| 83 | `/music` | Omnibar play | Click a search result | Track plays in the persistent player | login | P0 |
| 84 | `/music` | Radio hero — play/pause | Click play/pause in Radio Hero section | Community radio starts/pauses | login | P0 |
| 85 | `/music` | Radio auto-advance | Current radio track ends | Next track in queue plays automatically | login | P1 |
| 86 | `/music` | Tab bar navigation | Click different tabs (Radio, Discover, Trending, etc.) | Page scrolls smoothly to the corresponding section | login | P0 |
| 87 | `/music` | Tab bar — active tracking | Scroll through the page naturally | Active tab in sticky bar updates via IntersectionObserver | login | P1 |
| 88 | `/music` | Audius Discover | Scroll to Discover section | AudiusDiscover component loads with trending Audius tracks | login | P1 |
| 89 | `/music` | Track of the Day banner | Load music page | TrackOfTheDayBanner shows if TOTD is selected | login | P1 |
| 90 | `/music` | Track of the Day — vote | Navigate to TOTD section, vote for a track | Vote registers, tally updates | login+signer | P1 |
| 91 | `/music` | Track of the Day — admin select | Admin selects TOTD winner | Track saved as Track of the Day | admin | P1 |
| 92 | `/music` | Submissions section | Scroll to Submissions | Shows community-submitted tracks with vote/review options | login | P1 |
| 93 | `/music` | Submit a track | Submit a music URL via SongSubmit modal | Track appears in submissions queue | login+signer | P1 |
| 94 | `/music` | Vote on submission | Click upvote/downvote on a submission | Vote count updates | login | P1 |
| 95 | `/music` | Trending section | Scroll to Trending | Shows respect-weighted trending tracks | login | P1 |
| 96 | `/music` | Respect Trending | Below regular trending | Shows RespectTrending component with weighted curation | login | P1 |
| 97 | `/music` | Playlists section | Scroll to Playlists | Shows community playlists with play buttons | login | P1 |
| 98 | `/music` | Create playlist | Create a new playlist from Playlists section | Playlist saved, appears in list | login | P1 |
| 99 | `/music` | Add to playlist | Use AddToPlaylistButton on a track | Track added to selected playlist | login | P1 |
| 100 | `/music` | AI Music Generator | Scroll to Create section | AiMusicGenerator component loads | login | P1 |
| 101 | `/music` | Generate AI music | Enter prompt and generate | AI-generated music plays back | login | P1 |
| 102 | `/music` | Binaural Beats | Scroll to Binaural section | BinauralBeats component with ambient mixer loads | login | P1 |
| 103 | `/music` | Binaural — frequency adjust | Change frequency sliders | Beat frequency changes audibly via Web Audio API oscillators | login | P1 |
| 104 | `/music` | Liked Songs | Scroll to Liked section | Shows list of songs user has liked | login | P1 |
| 105 | `/music` | Like a song | Click heart/like on any track | Song added to liked list, API call succeeds | login | P1 |
| 106 | `/music` | History section | Scroll to History | Shows listening history with timestamps | login | P1 |
| 107 | `/music` | Top Curators | Scroll to Curators section | Shows leaderboard of top music curators | login | P2 |
| 108 | `/music` | Permaweb Library | Scroll to Permaweb section | Shows tracks stored on Arweave/permaweb | login | P2 |
| 109 | `/music` | Mint Track modal | Click "Mint Track" button in header | MintTrack modal opens with minting flow | login+wallet | P1 |
| 110 | `/music/history` | Full history page | Navigate to /music/history | Shows full listening history | login | P2 |
| 111 | global | Persistent player | Play a track, then navigate to another page | PersistentPlayer continues playing across navigation | login | P0 |
| 112 | global | Expanded player | Click/expand the persistent player bar | ExpandedPlayer shows full artwork, scrubber, queue, lyrics | login | P0 |
| 113 | global | Queue panel | Open queue from expanded player | QueuePanel shows upcoming tracks, allows reorder/remove | login | P1 |
| 114 | global | Crossfade | Enable crossfade in settings, let track end | Smooth crossfade between tracks via dual audio elements | login | P1 |
| 115 | global | MediaSession API | Play a track with system controls visible | Lock screen / notification controls work (play/pause/skip) | login | P1 |
| 116 | global | Sleep timer | Set a sleep timer from player | Playback stops after the set duration | login | P2 |
| 117 | global | Track reactions | React to a currently playing track | Reaction emoji sent, visible to other listeners | login | P2 |
| 118 | global | Lyrics panel | Open lyrics from expanded player | LyricsPanel shows synced lyrics if available | login | P2 |
| 119 | global | Share menu | Click share on a track | ShareMenu shows options: copy link, share to chat, Farcaster | login | P2 |
| 120 | global | Scrobbling — Last.fm | Play 30+ seconds of a track with Last.fm connected | Scrobble sent to Last.fm | login | P2 |
| 121 | global | Scrobbling — ListenBrainz | Play track with ListenBrainz connected | Listen sent to ListenBrainz | login | P2 |

---

## 6. Social Graph (All 5 Tabs)

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 122 | `/social` | Page load | Navigate to /social | Shows PageHeader "Social Graph", 5 tabs, MiniSpaceBanner | login | P0 |
| 123 | `/social` | MiniSpaceBanner | Have an active audio space | Banner shows at top linking to live room | login | P1 |
| 124 | `/social` | Followers tab | Click "Followers" tab | Loads follower list with virtual scrolling | login | P0 |
| 125 | `/social` | Following tab | Click "Following" tab | Loads following list | login | P0 |
| 126 | `/social` | Total count label | View Followers tab | Shows "X followers" count in header subtitle | login | P1 |
| 127 | `/social` | Search users | Type in search box on Followers/Following | Filters visible users by username/display name | login | P0 |
| 128 | `/social` | Sort — Recent | Click "Recent" sort tab | Users sorted by most recently followed | login | P1 |
| 129 | `/social` | Sort — Relevant | Click "Relevant" sort tab | Users sorted by relevance score | login | P1 |
| 130 | `/social` | Sort — Trending | Click "Trending" sort tab | Users sorted by trending metric | login | P1 |
| 131 | `/social` | Sort — Popular | Click "Popular" sort tab | Users sorted by follower count | login | P1 |
| 132 | `/social` | Sort — Mutual | Click "Mutual" sort tab | Users sorted by mutual follow status | login | P1 |
| 133 | `/social` | Sort — ZAO | Click "ZAO" sort tab | Users sorted showing ZAO members first | login | P1 |
| 134 | `/social` | Sort — Inactive | Click "Inactive" sort tab | Inactive accounts shown first, sorted by lowest followers | login | P1 |
| 135 | `/social` | Quick toggle — ZAO | Click "ZAO" quick filter button | Filters to ZAO members only | login | P1 |
| 136 | `/social` | Quick toggle — Mutual | Click "Mutual" quick filter | Shows only mutual follows | login | P1 |
| 137 | `/social` | Quick toggle — No spam | Click "No spam" quick filter | Hides users with Neynar score < 0.55 | login | P1 |
| 138 | `/social` | Quick toggle — Inactive | Click "Inactive" quick toggle | Switches sort to inactive mode | login | P1 |
| 139 | `/social` | Filter count badge | Apply 3 filters | Badge shows "3" on the Filters button | login | P2 |
| 140 | `/social` | Expanded filter panel | Click "Filters" button | Panel expands with Power Badge, Has Bio checkboxes, Min Followers selector | login | P1 |
| 141 | `/social` | Power badge filter | Check "Power badge only" | Shows only users with Farcaster power badge | login | P1 |
| 142 | `/social` | Has bio filter | Check "Has bio" | Shows only users who have a bio | login | P2 |
| 143 | `/social` | Min followers filter | Click "1K+" button | Hides users with < 1000 followers | login | P1 |
| 144 | `/social` | Clear all filters | Click "Clear all filters" | All filters reset to defaults | login | P1 |
| 145 | `/social` | Filter count display | Apply search + filters | Shows "X/Y" filtered count label | login | P2 |
| 146 | `/social` | Infinite scroll | Scroll to bottom of follower list | More users load automatically when cursor exists | login | P1 |
| 147 | `/social` | Follower card — follow button | Click follow on a FollowerCard | Follow API called, button state updates | login+signer | P0 |
| 148 | `/social` | Follower card — unfollow | Click unfollow on already-followed user | Unfollow API called, button state updates | login+signer | P1 |
| 149 | `/social` | Community tab | Click "Community" tab | CommunityGraph loads with force-directed graph visualization | login | P1 |
| 150 | `/social` | Community graph hover | Hover over a node in the graph | Tooltip shows member name, mutuals, engagement | login | P1 |
| 151 | `/social` | Community graph click | Click a node | Node selected, detail card shows | login | P2 |
| 152 | `/social` | Community graph stats | View Community tab | Shows total members, connections, density, most connected | login | P1 |
| 153 | `/social` | Analytics tab | Click "Analytics" tab | SocialAnalytics loads with network stats | login | P1 |
| 154 | `/social` | Analytics — sparklines | View Analytics | Follower/Following/Engagement sparkline charts render | login | P1 |
| 155 | `/social` | Analytics — growth data | View growth metrics | Shows follower change, following change, engagement change | login | P1 |
| 156 | `/social` | Analytics — unfollowers | View unfollower section | Shows recent unfollowers with timestamps | login | P1 |
| 157 | `/social` | Analytics — network stats | View stat cards | Shows ratio, ZAO %, mutual count, power badge %, avg score | login | P1 |
| 158 | `/social` | Analytics — channel rankings | View channel rank section | Shows user ranking in community channels | login | P2 |
| 159 | `/social` | Discover tab | Click "Discover" tab | DiscoverPanel loads with sub-tabs | login | P1 |
| 160 | `/social` | Discover — For You | View "For You" sub-tab | AI-suggested users to follow based on network | login | P1 |
| 161 | `/social` | Discover — ZAO | Click "ZAO" sub-tab | Shows ZAO members you don't follow yet | login | P1 |
| 162 | `/social` | Discover — Search | Click "Search" sub-tab, type query | Searches all Farcaster users with debounce | login | P1 |
| 163 | `/social` | Discover — Follow | Click follow on a suggested user | Follow action fires, user moved to followed state | login+signer | P1 |

---

## 7. Governance & Fractals

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 164 | `/fractals` | Page load | Navigate to /fractals | Shows 7 tabs: Proposals, Live, Events, Sessions, Leaderboard, Analytics, About | login | P0 |
| 165 | `/governance` | Redirect | Navigate to /governance | Redirects to /fractals?tab=proposals | login | P0 |
| 166 | `/fractals` | Proposals tab | Click Proposals tab | Shows community proposals with status badges, vote tallies | login | P0 |
| 167 | `/fractals` | Create proposal | Click "Create Proposal" button (if visible) | Proposal form opens with title, description, category fields | login | P0 |
| 168 | `/fractals` | Vote on proposal | Click For/Against/Abstain on an open proposal | Vote registers, tally updates with respect weight | login | P0 |
| 169 | `/fractals` | Proposal comments | Expand a proposal | ProposalComments section shows, can add comment | login | P1 |
| 170 | `/fractals` | Filter by status | Click status filter (open/approved/rejected/completed/published) | Proposals filter by selected status | login | P1 |
| 171 | `/fractals` | Filter by category | Click category filter (governance/technical/community/etc.) | Proposals filter by category | login | P1 |
| 172 | `/fractals` | ZOUNZ Proposals | Scroll in Proposals tab | ZounzProposals section shows on-chain Governor proposals | login | P1 |
| 173 | `/fractals` | Snapshot Polls | Scroll in Proposals tab | SnapshotPolls shows gasless weekly priority polls | login | P1 |
| 174 | `/fractals` | Create Weekly Poll (admin) | Admin clicks create poll | CreateWeeklyPoll form opens, creates Snapshot poll | admin | P1 |
| 175 | `/fractals` | Discord Proposals | Scroll in Proposals tab | DiscordProposals shows proposals from Discord | login | P1 |
| 176 | `/fractals` | Discord proposal vote | Vote on a Discord proposal | Vote registered via /api/discord/proposals/vote | login | P1 |
| 177 | `/fractals` | Live tab | Click "Live" tab | LiveFractalDashboard shows if fractal session is active | login | P1 |
| 178 | `/fractals` | Events tab | Click "Events" tab | EventsCalendar shows upcoming community events | login | P1 |
| 179 | `/fractals` | Sessions tab | Click "Sessions" tab | SessionsTab shows historical fractal session data | login | P1 |
| 180 | `/fractals` | Leaderboard tab | Click "Leaderboard" tab | FractalLeaderboardTab shows respect rankings | login | P1 |
| 181 | `/fractals` | Analytics tab | Click "Analytics" tab | AnalyticsTab shows fractal participation charts | login | P1 |
| 182 | `/fractals` | About tab | Click "About" tab | AboutTab shows explanation of fractal process | login | P2 |
| 183 | `/fractals` | frapps.xyz link | Click frapps.xyz link in header | Opens external frapps URL in new tab | login | P2 |
| 184 | `/fractals` | Published proposal links | View an approved/published proposal | Shows Farcaster/Bluesky/X publish links or error states | login | P1 |

---

## 8. Respect

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 185 | `/respect` | Page load | Navigate to /respect | Shows header, tab bar, leaderboard data | login | P0 |
| 186 | `/respect` | Leaderboard tab | View default Leaderboard tab | Shows ranked members with total respect, fractal respect, on-chain data | login | P0 |
| 187 | `/respect` | Mindshare tab | Click "Mindshare" tab | MindshareLeaderboard loads with mindshare rankings | login | P1 |
| 188 | `/respect` | Songjam tab | Click "Songjam" tab | SongjamLeaderboard loads with Songjam points | login | P1 |
| 189 | `/respect` | Fractals Hub link | Click "Fractals Hub" link in header | Navigates to /fractals | login | P2 |

---

## 9. Profile & Settings

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 190 | `/settings` | Page load | Navigate to /settings | Shows Accounts, Features, Music, Scrobbling, Socials, Cross-Posting, Identity, Profile, Respect, Messaging, Signer, Wallets, Danger Zone sections | login | P0 |
| 191 | `/settings` | Accounts — Wallet connected | View Accounts section | Shows primary wallet address with "Connected" status | login | P0 |
| 192 | `/settings` | Accounts — Farcaster | View Farcaster row | Shows FID, username, signer status | login | P0 |
| 193 | `/settings` | Accounts — Solana wallet | Connect Solana wallet | LazySolanaWalletConnect flow completes, address saved | login | P1 |
| 194 | `/settings` | Features — XMTP | View Messaging row | Shows connected/disconnected status; link to enable in /messages | login | P1 |
| 195 | `/settings` | Features — Push notifications | Toggle push notifications | Switch enables/disables push, calls /api/notifications/status | login | P1 |
| 196 | `/settings` | Features — Dark mode | Toggle dark mode | Theme switches (though app is dark-first) | login | P2 |
| 197 | `/settings` | Music — Crossfade | Adjust crossfade settings | CrossfadeSettings component saves duration preference | login | P1 |
| 198 | `/settings` | Scrobbling — Last.fm | Click connect Last.fm | LastfmConnect OAuth flow redirects to Last.fm, saves token | login | P1 |
| 199 | `/settings` | Scrobbling — Last.fm disconnect | Click disconnect | Calls /api/auth/lastfm/disconnect, clears connection | login | P1 |
| 200 | `/settings` | Scrobbling — ListenBrainz | Enter ListenBrainz token | Token saved, status shows connected | login | P1 |
| 201 | `/settings` | Socials section | View socials | SocialsSection shows X, Instagram, SoundCloud, Spotify, Audius handles | login | P1 |
| 202 | `/settings` | Edit socials | Edit and save social handles | Handles update in database | login | P1 |
| 203 | `/settings` | Cross-posting section | View cross-posting | CrossPostingSection shows Bluesky, Lens, Hive connection status | login | P1 |
| 204 | `/settings` | Farcaster Identity | View identity section | Shows profile picture, name, username, FID, bio, follower/following counts, role, join date | login | P0 |
| 205 | `/settings` | Share ZID | Click "Share your ZID" button | ShareToFarcaster composes a Farcaster cast with ZID info | login | P1 |
| 206 | `/settings` | ZAO Profile — Edit | Click "Edit" on ZAO Profile section | Form shows with Display Name, Bio, IGN, Real Name fields | login | P0 |
| 207 | `/settings` | ZAO Profile — Save | Fill in fields and click Save | Profile updates saved to database | login | P0 |
| 208 | `/settings` | ZAO Profile — Cancel | Click Cancel while editing | Reverts to previous values | login | P1 |
| 209 | `/settings` | Respect Tokens | View Respect section | Shows Total Respect, Fractals Attended, breakdown of types | login | P1 |
| 210 | `/settings` | Messaging — Auto-join toggle | Toggle "Auto-join ZAO Group" | Preference saved via /api/users/messaging-prefs | login | P1 |
| 211 | `/settings` | Messaging — External DMs | Toggle "Allow External DMs" | Preference saved | login | P1 |
| 212 | `/settings` | Write Access — Signer | View signer section without signer | Shows Neynar SIWN button; connect flow works | login | P0 |
| 213 | `/settings` | Wallets section | View wallets | Shows primary wallet, custody address, verified addresses with copy buttons | login | P1 |
| 214 | `/settings` | Copy wallet address | Click "Copy" on any wallet address | Address copied to clipboard, "Copied" feedback shows | login | P2 |
| 215 | `/settings` | Logout | Click logout button | Session destroyed, redirected to / | login | P0 |

---

## 10. Admin

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 216 | `/admin` | Admin gate | Non-admin visits /admin | Redirects to /home | login | P0 |
| 217 | `/admin` | Page load | Admin visits /admin | Shows 8 tabs: Users, ZIDs, Allowlist, Import, Moderation, Respect, Polls, Discord | admin | P0 |
| 218 | `/admin` | Users tab | View Users tab | UsersTable shows all registered users | admin | P0 |
| 219 | `/admin` | ZIDs tab | Click ZIDs tab | ZidManager shows ZID assignments | admin | P1 |
| 220 | `/admin` | Allowlist tab | Click Allowlist tab | AllowlistTable shows allowlist with manage actions | admin | P0 |
| 221 | `/admin` | Import tab | Click Import tab | CsvUpload shows CSV import form | admin | P1 |
| 222 | `/admin` | Moderation tab | Click Moderation tab | HiddenMessages shows admin-hidden messages | admin | P1 |
| 223 | `/admin` | Respect tab | Click Respect tab | RespectOverview shows respect data dashboard | admin | P1 |
| 224 | `/admin` | Polls tab | Click Polls tab | PollConfigEditor shows poll configuration | admin | P1 |
| 225 | `/admin` | Discord tab | Click Discord tab | DiscordLinkManager shows Discord-Farcaster link management | admin | P1 |
| 226 | `/admin` | Sync Respect button | Click SyncRespectButton | Triggers on-chain respect sync | admin | P1 |
| 227 | `/admin` | Import Respect button | Click ImportRespectButton | Imports respect data from source | admin | P1 |
| 228 | `/admin` | Member CRM link | Click "Member CRM" button | Navigates to /admin/members | admin | P1 |
| 229 | `/admin/members` | Member CRM page | Navigate to /admin/members | Shows member health stats, issues list, member management | admin | P1 |

---

## 11. Spaces

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 230 | `/spaces` | Create Stage | Click "+ Create Stage" | HostRoomModal opens with title, description, theme fields | login | P0 |
| 231 | `/spaces` | Create and join | Fill form and submit | Room created via /api/stream/rooms, redirects to /spaces/[id] | login | P0 |
| 232 | `/spaces` | Room themes | Select a theme in HostRoomModal | Theme applied to room visual styling | login | P2 |
| 233 | `/spaces/[id]` | Audio room controls | Enter a room | Mic mute/unmute, leave room, speaker/listener roles | login | P0 |
| 234 | `/spaces` | Empty state | Visit /spaces with no live rooms | Shows "No live stages right now" message | none | P1 |

---

## 12. Other Pages

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 235 | `/ecosystem` | Page load | Navigate to /ecosystem | Shows app selector bar, active app iframe, action bar | login | P0 |
| 236 | `/ecosystem` | Switch apps | Click different app tabs (WaveWarZ, SongJam, MAGNETIQ, ZOUNZ, etc.) | Iframe switches to selected app URL | login | P0 |
| 237 | `/ecosystem` | Iframe blocked fallback | App iframe fails to load (X-Frame-Options) | Shows error state with "Open externally" button | login | P1 |
| 238 | `/ecosystem` | Copy link | Click "Copy link" button | App URL copied to clipboard | login | P2 |
| 239 | `/ecosystem` | Resources accordion | Click "More Resources" | Expandable section shows categorized Nexus links | login | P1 |
| 240 | `/ecosystem` | Resource search | Type in resource search box | Filters links by title/description/tags | login | P2 |
| 241 | `/wavewarz` | Page load | Navigate to /wavewarz | Shows 3 tabs: Leaderboard, Battles, Arena | login | P1 |
| 242 | `/wavewarz` | Leaderboard | View Leaderboard tab | Shows artist rankings from WaveWarZ | login | P1 |
| 243 | `/wavewarz` | Battles log | Click Battles tab | BattleLog shows recent battle results | login | P1 |
| 244 | `/wavewarz` | Arena iframe | Click Arena tab | WaveWarZ main app loads in iframe | login | P1 |
| 245 | `/wavewarz` | Generate Post | Click GeneratePostButton | Generates a WaveWarZ-related Farcaster post | login+signer | P2 |
| 246 | `/contribute` | Page load | Navigate to /contribute | Shows open source banner, GitHub/Bounties/Docs/Fork links, issue form | login | P1 |
| 247 | `/contribute` | Submit issue | Fill in IssueSubmitForm and submit | Issue created via /api/community-issues | login | P1 |
| 248 | `/contribute` | External links | Click GitHub/Bounties/Documentation links | Open correct GitHub URLs in new tabs | login | P2 |
| 249 | `/library` | Page load | Navigate to /library | Shows submit form, tab bar (Community Submissions / Deep Research) | login | P1 |
| 250 | `/library` | Submit link | Fill SubmitForm and submit | Entry created in library, feed refreshes | login | P1 |
| 251 | `/library` | Community Submissions tab | View Submissions tab | EntryFeed shows submitted entries with votes/comments | login | P1 |
| 252 | `/library` | Vote on entry | Upvote/downvote a library entry | Vote registers via /api/library/vote | login | P1 |
| 253 | `/library` | Comment on entry | Add comment to a library entry | Comment saved via /api/library/comments | login | P1 |
| 254 | `/library` | Delete entry (admin) | Admin clicks delete on an entry | Entry removed via /api/library/delete | admin | P2 |
| 255 | `/library` | Deep Research tab | Click "Deep Research" tab | DeepResearch component shows 130+ research doc index | login | P1 |
| 256 | `/calls` | Page load | Navigate to /calls | Shows Spaces banner, preset rooms (Fractal Call, Open Hangout), custom room form | login | P1 |
| 257 | `/calls` | Join preset room | Click "Join" on Fractal Call | Jitsi room loads full-screen with audio | login | P1 |
| 258 | `/calls` | Create custom room | Enter room name and click "Create & Join" | Custom Jitsi room created and joined | login | P1 |
| 259 | `/calls` | Leave room | Click "Leave" in active call | Returns to room list view | login | P1 |
| 260 | `/calls` | Spaces banner link | Click "Audio Spaces are now on /spaces" | Navigates to /spaces | login | P2 |
| 261 | `/tools` | Page load | Navigate to /tools | Shows ZID ProfileCard, Artist Tools links, Coming Soon items | login | P1 |
| 262 | `/tools` | Profile card | View profile card | Shows ZID, display name, pfp, wallet, respect data | login | P1 |
| 263 | `/notifications` | Page load | Navigate to /notifications | Shows notification list with filter (All/Unread) | login | P0 |
| 264 | `/notifications` | Filter — Unread | Click "Unread" filter | Shows only unread notifications | login | P1 |
| 265 | `/notifications` | Mark single read | Click a notification | Notification marked as read, styling updates | login | P1 |
| 266 | `/notifications` | Mark all read | Click "Mark all read" button | All notifications marked read, badge disappears | login | P1 |
| 267 | `/notifications` | Empty state — Unread | Filter to Unread with none present | Shows "All caught up!" with "View All" button | login | P2 |
| 268 | `/assistant` | Page load | Navigate to /assistant | Shows ZAO Assistant header, suggested questions, input bar | login | P1 |
| 269 | `/assistant` | Suggested question | Click a suggested question chip | Message sends, assistant responds | login | P1 |
| 270 | `/assistant` | Custom question | Type custom question and press Enter/Send | Assistant responds with relevant ZAO knowledge | login | P1 |
| 271 | `/assistant` | Loading state | Send a message | Animated dots show while waiting for response | login | P2 |
| 272 | `/directory` | Redirect | Visit /directory | Redirects to /members | login | P0 |

---

## 13. Navigation

| # | Page/URL | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 273 | global | Bottom nav (mobile) | View on mobile viewport | 5 tabs: Home, Chat, Music, Governance, More | login | P0 |
| 274 | global | Bottom nav — active state | Navigate to /chat | Chat tab highlights with gold accent | login | P0 |
| 275 | global | More menu (mobile) | Tap "More" in bottom nav | Slides up grid with Social, Spaces, Ecosystem, Calls, WaveWarZ, Tools, Contribute, Members, Library, Settings | login | P0 |
| 276 | global | Top nav (desktop) | View on desktop viewport | Top bar with all primary tabs + secondary items inline, overflow dropdown | login | P0 |
| 277 | global | Desktop overflow | Click "..." in desktop top nav | Dropdown shows remaining nav items | login | P1 |
| 278 | global | Now playing indicator (desktop) | Play a track on desktop | Small playing indicator with track name in top nav | login | P1 |
| 279 | global | Notification bell | Click notification bell icon | Navigates to /notifications or shows badge count | login | P0 |
| 280 | global | PageHeader — back button | View page with backHref prop | Back arrow navigates to specified page | login | P1 |
| 281 | global | PWA install prompt | Visit site on supported mobile browser | PWAInstallPrompt appears when conditions met | none | P2 |

---

## 14. API Health

| # | Endpoint | Feature | Test Action | Expected Result | Auth | Priority |
|---|----------|---------|-------------|-----------------|------|----------|
| 282 | `GET /api/auth/session` | Session check | Fetch current session | Returns session data or null | none | P0 |
| 283 | `GET /api/auth/verify` | Nonce endpoint | GET request | Returns { nonce: "..." } | none | P0 |
| 284 | `POST /api/auth/verify` | Login verification | POST with SIWF data | Returns session + redirect or error | none | P0 |
| 285 | `POST /api/auth/siwe` | Wallet login | POST with SIWE message+sig | Creates session for wallet login | none | P0 |
| 286 | `GET /api/chat/messages` | Chat messages | Fetch with channel param | Returns paginated casts | login | P0 |
| 287 | `POST /api/chat/send` | Send cast | POST with text + channel | Cast published to Farcaster | login+signer | P0 |
| 288 | `GET /api/music/radio` | Radio queue | Fetch radio tracks | Returns current radio queue | login | P0 |
| 289 | `GET /api/music/search` | Music search | Search with query param | Returns tracks from multiple providers | login | P0 |
| 290 | `GET /api/respect/leaderboard` | Respect leaderboard | Fetch leaderboard | Returns ranked members with respect data | login | P0 |
| 291 | `GET /api/social/suggestions` | Follow suggestions | Fetch suggestions | Returns personalized follow suggestions | login | P1 |
| 292 | `GET /api/social/community-graph` | Community graph data | Fetch graph | Returns nodes + connections | login | P1 |
| 293 | `GET /api/social/growth` | Growth analytics | Fetch growth data | Returns follower/following sparkline data | login | P1 |
| 294 | `GET /api/social/unfollowers` | Unfollower tracking | Fetch unfollowers | Returns recent unfollower list | login | P1 |
| 295 | `GET /api/notifications` | Notifications | Fetch with limit param | Returns notification list | login | P0 |
| 296 | `POST /api/proposals` | Create proposal | POST with title, description, category | Proposal created in database | login | P0 |
| 297 | `POST /api/proposals/vote` | Vote on proposal | POST with proposal_id + vote | Vote recorded with respect weight | login | P0 |
| 298 | `GET /api/members` | Members list | Fetch members | Returns active community members | none | P0 |
| 299 | `GET /api/spaces/session` | Space session | Fetch room token | Returns stream token for audio room | login | P1 |
| 300 | `POST /api/broadcast/start` | Start broadcast | POST with stream config | Starts RTMP multistream broadcast | login | P1 |
| 301 | `GET /api/broadcast/targets` | Broadcast targets | Fetch saved targets | Returns saved multistream destinations | login | P1 |

---

## 15. Cross-Platform Publishing

| # | Endpoint/Feature | Feature | Test Action | Expected Result | Auth | Priority |
|---|------------------|---------|-------------|-----------------|------|----------|
| 302 | `POST /api/publish/farcaster` | Publish to Farcaster | Trigger publish on approved proposal | Cast published to Farcaster channel | admin | P0 |
| 303 | `POST /api/publish/bluesky` | Publish to Bluesky | Trigger publish on approved proposal | Post published to Bluesky | admin | P1 |
| 304 | `POST /api/publish/x` | Publish to X | Trigger publish on approved proposal | Tweet published to X/Twitter | admin | P1 |
| 305 | `POST /api/publish/telegram` | Publish to Telegram | Trigger publish | Message sent to Telegram channel | admin | P1 |
| 306 | `POST /api/publish/discord` | Publish to Discord | Trigger publish | Message sent to Discord channel | admin | P1 |
| 307 | `GET /api/publish/status` | Publish status | Check publish results | Returns success/failure for each platform | admin | P1 |
| 308 | `POST /api/publish/hive` | Publish to Hive | Trigger publish (scaffolded) | Returns scaffold/not-implemented response | admin | P2 |
| 309 | `POST /api/publish/lens` | Publish to Lens | Trigger publish (scaffolded) | Returns scaffold/not-implemented response | admin | P2 |

---

## Summary by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 62 | Core flows - login, navigation, main page loads, critical actions |
| **P1** | 181 | Important features - filters, sorts, integrations, secondary actions |
| **P2** | 66 | Nice to have - edge cases, coming soon, minor utilities |
| **Total** | **309** | |

## Testing Notes

- **Auth levels:** "none" = public, "login" = any authenticated user, "login+signer" = needs Farcaster signer connected, "login+wallet" = needs wallet connected for XMTP, "admin" = needs admin role
- **Mobile-first:** Test on mobile viewport first, then verify desktop enhancements
- **Real-time:** Spaces and chat rely on Supabase realtime subscriptions -- test with 2 browser tabs
- **XMTP:** Requires wallet connection + XMTP network availability -- may have connection delays
- **Cross-platform publishing:** Requires API keys for each platform to test fully
- **Music player:** Test across page navigations to verify persistent playback
- **Virtual scrolling:** Social page uses @tanstack/react-virtual -- scroll performance matters with large lists
