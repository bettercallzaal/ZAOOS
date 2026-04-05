# 106 — Home Screen / Dashboard Design for Music Community Platforms

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Design a proper home/dashboard screen for ZAO OS that surfaces all features (music, chat, governance, social, ecosystem) — replacing the current direct-to-chat flow

---

## 1. Discord — Server Home Screen

### Current Layout (Post-March 2025 Redesign)

Discord's major UI overhaul (February-March 2025) restructured navigation significantly:

**Desktop:**
- **Left rail:** Server icon list (vertical strip, ~48px icons)
- **Channel sidebar:** Collapsible, organized by categories (text, voice, forum, stage). Width is now user-adjustable.
- **Header bar:** Consolidated — shows current server name, inbox/notifications, help, and search in one bar
- **Main content area:** The selected channel's messages
- **Member list:** Collapsible right sidebar showing online/offline members with role colors

**Mobile (2025 redesign):**
- **Bottom tab bar:** Home, Messages, Notifications, You — four tabs
- **Home tab:** Shows all servers + DMs in one view
- **Server view:** Channel list as the first screen, then tap into a channel

**Key Onboarding Features:**
- **Welcome Screen:** Up to 5 recommended channels with descriptions, shown to new members on join
- **Community Onboarding:** Multi-step questionnaire that assigns roles and customizes the channel list per member
- **Server Guide:** Admin-customizable "to-do list" for new members (3-5 tasks)

### What ZAO Can Learn from Discord
- Category-based channel organization maps well to ZAO's pillars (Social, Governance, Tools, Contribute)
- The onboarding flow (welcome screen + guided setup) is excellent for a 100-person gated community
- Member list with online indicators creates a sense of "who's here now"
- Voice channels visible in the sidebar normalize jumping into calls

Sources:
- [Discord Desktop Design Change](https://whop.com/blog/discord-new-design/)
- [Discord Mobile Updates](https://support.discord.com/hc/en-us/articles/12654190110999-New-Mobile-App-Updates-Layout)
- [Discord March 2025 UI](https://support.discord.com/hc/en-us/community/posts/30928210948247-New-Discord-UI-March-2025)
- [Discord Redesign Analysis (Medium)](https://medium.com/@negi28.sumit/discords-march-2025-ui-overhaul-loved-or-hated-fff69f5eaebe)
- [Community Server Welcome Screen](https://support.discord.com/hc/en-us/articles/360043913591-Community-Server-Welcome-Screen)
- [Server Guide FAQ](https://support.discord.com/hc/en-us/articles/13497665141655-Server-Guide-FAQ)

---

## 2. Farcaster Clients — Warpcast, Supercast, Nook

### Warpcast (Flagship Client)
- **Layout:** Twitter/X-like feed-first design
- **Home screen:** Algorithmic feed of casts from followed accounts
- **Navigation:** Bottom tab bar on mobile — Home (feed), Search/Explore, Notifications, Profile
- **Channels:** Topic-based feeds (like subreddits), accessible via explore/search. Channel casts do NOT appear in main timeline unless followed
- **Frames:** Mini-apps that run inside casts — polls, mints, games inline in the feed
- **Direction:** Moving toward social + mobile-first experience (acquired Soho.xyz for this)

### Supercast (Power User Client)
- **Differentiators:** Multi-account support, scheduled casts, thread creation, built-in wallets
- **Layout:** Desktop-optimized with more columns/panels visible simultaneously
- **Lists:** User-created feed lists (like Twitter Lists) for organizing different viewing contexts
- **Target:** Crypto-native power users who want more control

### Nook (Community Client)
- **Now defunct/absorbed** but pioneered community-focused Farcaster viewing
- **Approach:** Grouped content by community rather than by individual follow graph

### What ZAO Can Learn from Farcaster Clients
- Feed-first works for open social networks but NOT for a gated community with multiple feature areas
- Channels concept maps directly to ZAO's Farcaster channels (zao, zabal, cocconcertz, wavewarz)
- Frames concept = mini-apps inside the feed — ZAO could embed quick actions in the activity feed
- The multi-client approach proves that the same data can be presented very differently depending on the audience

Sources:
- [How to Use Farcaster and Warpcast (Zerion)](https://zerion.io/blog/how-to-use-farcaster-and-warpcast-zerion-blog/)
- [Supercast Spotlight (Neynar)](https://neynar.com/blog/spotlight-supercast)
- [Farcaster Apps Docs](https://docs.farcaster.xyz/learn/what-is-farcaster/apps)
- [How to Build a Farcaster Client (Pinata)](https://pinata.cloud/blog/how-to-build-a-farcaster-client/)
- [Alt Farcaster Clients Overview](https://artlu.xyz/posts/farcaster-altclients-jul2024/)

---

## 3. Telegram — Chat List Organization

### Home Screen Structure
- **Single list:** All chats (DMs, groups, channels, bots) in one unified chronological list sorted by last message
- **No visual distinction** between DMs, groups, and channels in the default view — all mixed together

### Organization Tools
- **Chat Folders:** Up to 200 custom folders, each holding 100 chats. Tabs appear horizontally above the chat list. Examples: "Music", "DAO", "Friends", "Bots"
- **Emoji folder labels:** Using emoji at the start of a folder name triggers a colorful icon tab
- **Topics (for groups):** Splits a single group chat into threaded sub-conversations, each with its own topic name. The group view becomes a list of topics rather than a single message stream
- **Archive:** Hides inactive chats from the main list
- **Pinned chats:** Up to 5 pinned to the top of any folder

### What ZAO Can Learn from Telegram
- **Folder tabs** are an excellent pattern for filtering a dashboard (e.g., "All", "Music", "Governance", "Social")
- **Topics within groups** maps to ZAO's channel-within-community structure
- The simplicity of "one list, sorted by recency" keeps users coming back to a single entry point
- Pinned items at the top of the home screen could highlight active proposals, now-playing radio, or announcements

Sources:
- [Telegram Topics Guide](https://www.such.chat/blog/telegram-topics-organizing-and-optimizing-your-groups)
- [Organize Telegram Chat Lists](https://hfeu-telegram.com/news/step-by-step-organize-large-telegram-chat-lists-267/)
- [Telegram Chat Folders](https://telegram.org/blog/folders)
- [Organize Telegram Chats in Folders (HowToGeek)](https://www.howtogeek.com/organize-your-telegram-chats-in-folders/)

---

## 4. Slack — Home Tab and Activity View

### 2025 Desktop Redesign (September 2025)

**Left Sidebar Tabs:**
- **Home** — Channel list organized by sections (Starred, Channels, DMs, Apps)
- **DMs** — Dedicated direct message list
- **Activity** — Unified feed combining threads, mentions, reactions, app notifications
- **Later** — Saved/bookmarked messages
- **More** — Additional features

**Activity Feed (Key Innovation):**
- Combines threads, mentions, and reactions into a single chronological view
- Sub-tabs within Activity: Threads, Mentions & Reactions, All
- App notifications are grouped together to reduce noise
- Filtering options: by channel, by type, by time range
- DMs and channel updates set to "All new posts" also appear here

**Home Tab for Apps:**
- Slack allows each installed app to have its own "Home tab" — a custom dashboard surface
- These are built with Block Kit (cards, buttons, dropdowns, images)
- Apps can show personalized information, status dashboards, quick actions

### What ZAO Can Learn from Slack
- **Unified Activity feed** is the key pattern — one place to see everything that happened while you were away
- **Sub-filtering within Activity** (threads vs mentions vs all) prevents overwhelm
- The concept of **app Home tabs** = ZAO could give each pillar (Music, Governance, Social, Tools) its own summary card on the home screen
- **"Later" / Save** functionality lets users bookmark things to return to
- Sidebar organization with sections maps to ZAO's pillar structure

Sources:
- [Consolidated Tabs for Slack Desktop](https://slack.com/help/articles/44134792609555-A-consolidated-set-of-tabs-for-Slack-on-desktop)
- [Slack Redesign with DM Tab and Activity View (Engadget)](https://www.engadget.com/slacks-latest-redesign-has-a-dedicated-dm-tab-and-a-discord-style-activity-view-130032154.html)
- [New Activity View in Slack](https://slack.com/help/articles/46751260742035-Introducing-the-new-Activity-view-in-Slack)
- [Slack App Home Design Guidelines](https://api.slack.com/start/designing/tabs)

---

## 5. Web3 Community Platforms

### Guild.xyz
- **Purpose:** Automated membership management with 100+ integrations
- **Dashboard:** Role-based access control visualization — shows which roles a user holds and what they unlock
- **Key pattern:** "Requirements met" checklist — users see which gates they pass (token balance, Discord role, etc.)
- **Scales from 100 to 1M members** with automated role assignment

### Snapshot (v2)
- **Dashboard:** Space page shows active proposals, past proposals, delegation status
- **Proposal cards:** Title, status (Active/Closed/Pending), vote count, time remaining
- **Key innovation in v2:** Unified governance flow — discussion, delegation, voting, and execution on one platform
- **AI summaries:** Proposals get auto-generated plain-language summaries
- **Delegation dashboard:** See who you've delegated to and your voting power

### Coordinape (v2)
- **Purpose:** Peer-to-peer contribution evaluation and reward distribution
- **Dashboard:** Circle view showing contributors, their allocations, and reputation scores
- **Key pattern:** Visual "give" circles — members allocate tokens to peers they feel contributed most

### JokeRace
- **Purpose:** On-chain contests for community decisions
- **Dashboard:** Active contests on the front page, each showing prompt + submission count + vote count
- **Key pattern:** No-code contest deployment — anyone can create a vote/contest in seconds
- **Rewards dashboard:** "My Rewards" section showing winnings across contests

### Common UX Trends Across Web3 Platforms
- **Wallet-first identity:** Avatar + ENS/address as the primary identifier
- **Proposal/contest cards** with clear status indicators (Active, Ended, Quorum reached)
- **Progressive disclosure:** Show summary first, click for full details
- **AI integration:** Summaries, audio playback of proposals, smart categorization
- **Cross-chain awareness:** Show assets/activity across multiple chains

Sources:
- [Guild.xyz](https://guild.xyz/)
- [UX of Governance: Designing DAO Platforms (Medium)](https://medium.com/coinmonks/the-ux-of-governance-designing-engaging-dao-platforms-6fd26d846ff2)
- [Snapshot DAO Tool Report 2025](https://daotimes.com/snapshot-dao-tool-report-for-2025/)
- [Snapshot Docs](https://docs.snapshot.box/)
- [JokeRace v3 Announcement](https://joke.mirror.xyz/btwtFJKw8tEWGXuZ9rcJiGnldV8-LLUiC0h_Xvu2aSw)
- [20 Dashboard UI/UX Design Principles for 2025 (Medium)](https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795)

---

## 6. Music-First Social Apps

### Sound.xyz
- **Concept:** Listening parties + NFT minting for new releases
- **Home screen:** Discovery feed of new releases with play buttons, collector counts, and artist info
- **Key pattern:** "Collect" button on every track — combines listening with on-chain ownership
- **Direction:** Acquired Soho.xyz, pivoting to social mobile-first experience
- **Revenue model:** Artists keep 100% of revenue, listeners earn rewards for early discovery

### Audius
- **Concept:** Decentralized Spotify — fully on-chain music streaming
- **Home screen:** Trending tracks, playlists, and artist feeds
- **Key features:** Collaborative playlists, social sharing, direct artist payments
- **Discovery:** Genre browsing, mood-based playlists, trending charts

### Key Trends in Music Social Apps (2025-2026)
- **Community-driven discovery:** Social sharing, collaborative playlists, live streaming as core features
- **AI-powered recommendations:** Vector search understanding "vibe" — tempo, mood, energy, sonic texture
- **Social listening gateways:** Platforms turning social feeds into direct listening experiences
- **Fan-artist direct connection:** No middlemen, blockchain-backed payments
- **Shared listening experiences:** Live listening rooms, community radio, synchronized playback

### What ZAO Can Learn from Music Platforms
- **Now Playing** as a persistent element (like Spotify's bottom bar) creates ambient music presence
- **Collect/support** buttons on tracks align with ZAO's respect token economy
- **Listening parties** = ZAO Radio as a social feature, not just background music
- **Discovery feed** mixing new music with social activity (new members, governance votes, etc.)

Sources:
- [Streaming Audio Platforms and Music Discovery in 2026](https://www.audiartist.com/streaming-audio-platforms-music-discovery-2026/)
- [Sound.xyz Product Hunt](https://www.producthunt.com/products/sound-xyz)
- [Web3 Music Industry 2025 (Pooksomnia)](https://pooksomnia.com/theplug/web3-music-industry)
- [Sound.xyz Accessibility Announcement](https://nftnow.com/news/web3-music-platform-sound-xyz-announces-new-era-of-open-accessibility/)
- [Top Web3 Social Media Platforms 2026 (Coinbound)](https://coinbound.io/top-web3-social-media-platforms/)

---

## 7. Hub-and-Spoke Navigation Patterns

### Pattern Definition
A central "hub" screen connects to multiple "spoke" screens. Users always return to the hub to navigate between spokes. This minimizes on-screen noise and works well for apps with distinct task areas.

### When to Use Hub-and-Spoke
- App has 4-8 distinct feature areas (ZAO has 6+: Chat, Music, Governance, Social, Ecosystem, Tools)
- Features are relatively independent (you don't need to see Chat while in Governance)
- Users perform one task at a time rather than monitoring multiple streams
- Works well for communities where the "hub" shows what's happening across all areas

### Card-Based Dashboard vs Feed-Based vs Sidebar Navigation

| Pattern | Best For | Pros | Cons |
|---------|----------|------|------|
| **Card Dashboard** | Multi-feature hubs, DAO dashboards | Scannable, each card = one feature area, flexible layout | Can feel static, requires good hierarchy |
| **Feed-Based** | Social networks, content-heavy apps | Familiar, infinite scroll, real-time updates | Poor for multi-feature discovery, buries features |
| **Sidebar Nav** | Desktop-heavy, workspace apps | Always visible, supports deep hierarchy | Wastes mobile space, feels "enterprise" |
| **Bottom Tab Bar** | Mobile-first, 3-5 core areas | Thumb-friendly, always accessible | Limited to 5 items max, no hierarchy |
| **Hybrid** | Community platforms | Combines cards + feed + tabs | More complex to build |

### Mobile vs Desktop Layout Differences

**Mobile (Bottom Tab Bar + Hub):**
- 5 tabs maximum in bottom bar (3 or 5 recommended for visual rhythm)
- Hub/Home as center tab with elevated icon (FAB-style)
- Each tab leads to a full-screen spoke
- Minimum touch target: 44x44px
- Progressive disclosure: summary first, details on tap

**Desktop (Sidebar + Dashboard):**
- Left sidebar with all navigation items visible
- Main content area shows dashboard cards or feed
- Right sidebar optional for member list, activity, or now-playing
- Can show more information density than mobile

### 2025 Navigation Trends
- **Adaptive navigation:** AI reorders tabs based on user behavior
- **Contextual bottom sheets:** Slide-up panels for quick actions without leaving the current view
- **Gesture-based navigation:** Swipe between sections (like Telegram folder tabs)
- **Persistent audio bar:** Like Spotify, a "now playing" strip that stays across all screens

Sources:
- [Hub-and-Spoke Design (NN/g)](https://www.nngroup.com/articles/customer-service-model/)
- [Hub and Spoke UX Pattern (Prezi)](https://prezi.com/bfjharj-rbfi/ux-pattern-hub-and-spoke/)
- [Bottom Navigation Bar Guide 2025 (AppMySite)](https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/)
- [Bottom Tab Bar Best Practices (UX Planet)](https://uxplanet.org/bottom-tab-bar-navigation-design-best-practices-48d46a3b0c36)
- [Mobile Dashboard UI Best Practices (Toptal)](https://www.toptal.com/designers/dashboard-design/mobile-dashboard-ui)
- [Card-Based UI Design (Smashing Magazine)](https://www.smashingmagazine.com/2016/10/designing-card-based-user-interfaces/)
- [Dashboard Design Best Practices (Justinmind)](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux)
- [Mobile Navigation Patterns (UXPin)](https://www.uxpin.com/studio/blog/mobile-navigation-patterns-pros-and-cons/)

---

## 8. Specific Design Patterns for a Music Community Dashboard

### 8.1 Now Playing / Community Radio

**Pattern: Persistent Bottom Strip**
- Fixed bar at bottom of screen (above tab bar on mobile), showing: album art thumbnail, track name, artist, play/pause, progress bar
- Tapping expands to full-screen player with community listener count
- Shows "X members listening" for communal awareness
- Available on EVERY screen, not just the music section

**Pattern: Hero Card on Home Screen**
- Large card at top of dashboard: "ZAO Radio is Live" with current track, listener count, and join button
- Animated equalizer bars or waveform as visual indicator
- Rotates through radio playlists from `community.config.ts`

### 8.2 Activity Cards

**Song Submissions:**
```
[Album Art] "Track Name" by Artist
Submitted 2h ago | 3 respects | Play
```

**Governance Proposals:**
```
[Vote Icon] "Fund Community Merch Run"
Active - 2 days left | 12/40 voted | Vote Now
```

**New Members:**
```
[Avatar] username.eth joined THE ZAO
1h ago | Welcome them
```

**Respect Tokens:**
```
[Star Icon] @alice gave 5 Respect to @bob
for "incredible remix of the community anthem"
```

### 8.3 Quick-Action Buttons

**Pattern: Action Row or FAB Menu**
- Row of 3-4 circular icon buttons below the hero section:
  - Post to Chat (speech bubble icon)
  - Submit Song (music note + plus icon)
  - Start Call (phone icon)
  - New Proposal (document + plus icon)
- On mobile: could be a single FAB (floating action button) that expands to show these options
- Gold (#f5a623) accent color for primary action, muted for secondary

### 8.4 Member Online Indicators

**Pattern: Avatar Stack with Status Dots**
- Horizontal row of overlapping circular avatars (show first 5-8 online members)
- Green dot on each avatar for "online now"
- "+12 online" counter at the end
- Tapping opens full member list with roles and last-active times

**Pattern: Active Spaces**
- Show active voice/call rooms: "Studio A — 3 members" with join button
- Shows who's in each room via small avatars

### 8.5 Recent Activity Timeline

**Pattern: Grouped Chronological Feed**
- Group activities by time: "Just Now", "Today", "Yesterday", "This Week"
- Each item: avatar + action description + timestamp + optional action button
- Activity types: casts, song submissions, votes, respect given, members joined, proposals created
- Filter tabs at top: All | Music | Governance | Social
- Load more on scroll, WebSocket for real-time prepending of new items

Sources:
- [Activity Feed Design Ultimate Guide (GetStream)](https://getstream.io/blog/activity-feed-design/)
- [Activity Feeds in UI Design (UIKits)](https://www.uinkits.com/blog-post/what-are-activity-feeds-in-ui-design-and-how-to-use-them)
- [Activity Stream Pattern (UI-Patterns)](https://ui-patterns.com/patterns/ActivityStream)
- [Designing Chronological Activity Feeds (Aubergine)](https://www.aubergine.co/insights/a-guide-to-designing-chronological-activity-feeds)
- [10 Activity Feed Ideas (GetStream)](https://getstream.io/blog/activity-feed-ideas/)
- [Card UI Design Examples 2025 (BricxLabs)](https://bricxlabs.com/blogs/card-ui-design-examples)

---

## 9. Recommended Home Screen Architecture for ZAO OS

Based on all research, here is a recommended layout for a 100-member gated music DAO:

### Mobile Layout (Primary — Bottom Up)

```
┌─────────────────────────────────┐
│  THE ZAO              [Bell] [Avatar]  │  <- Header: logo, notifications, profile
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │  ZAO RADIO — NOW PLAYING   ││
│  │  [Art] "Track" by Artist   ││  <- Hero: Now Playing card
│  │  ▶ 7 listening    [Join]   ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  [Post] [Submit Song] [Call] [Vote] │  <- Quick Actions row
├─────────────────────────────────┤
│  Online: [ava][ava][ava] +12 more   │  <- Member presence strip
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Chat  │ │Music │ │Govern│   │  <- Pillar Cards (2x2 or scrollable)
│  │12 new│ │3 new │ │1 vote│   │
│  └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Social│ │Tools │ │Ecosys│   │
│  │5 new │ │      │ │      │   │
│  └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────┤
│  RECENT ACTIVITY                │
│  [All] [Music] [Gov] [Social]   │  <- Filter tabs
│  ─────────────────────────────  │
│  [ava] alice submitted "Flow"   │
│  [ava] bob voted on "Merch..."  │  <- Activity feed
│  [ava] carol joined THE ZAO    │
│  ...                            │
├─────────────────────────────────┤
│ [♫ Now Playing ▶ Track Name ]   │  <- Persistent audio bar
├─────────────────────────────────┤
│  [Home]  [Chat]  [Music]  [Gov]  [More] │  <- Bottom tab bar
└─────────────────────────────────┘
```

### Desktop Layout

```
┌──────────┬────────────────────────────────┬──────────────┐
│ Sidebar  │  Main Content                  │ Right Panel  │
│          │                                │              │
│ THE ZAO  │  ┌──────────────────────────┐  │ NOW PLAYING  │
│ ─────    │  │  Welcome back, Zaal!     │  │ [Album Art]  │
│ Home  *  │  │  3 new since yesterday   │  │ "Track"      │
│ Chat     │  └──────────────────────────┘  │ ▶ 7 online   │
│ Music    │                                │              │
│ Govern   │  Quick Actions                 │ ────────     │
│ Social   │  [Post] [Song] [Call] [Vote]   │ ONLINE (19)  │
│ Ecosys   │                                │ [ava] alice   │
│ Tools    │  ┌─────────┐ ┌─────────┐      │ [ava] bob     │
│ ─────    │  │ Active  │ │ Music   │      │ [ava] carol   │
│ Settings │  │Proposal │ │ Queue   │      │ ...           │
│          │  │ Vote!   │ │ 3 songs │      │              │
│          │  └─────────┘ └─────────┘      │ ────────     │
│          │                                │ ACTIVE CALLS │
│          │  ACTIVITY FEED                 │ Studio A (3) │
│          │  [All][Music][Gov][Social]      │ [Join]       │
│          │  ───────────────────────        │              │
│          │  alice submitted "Flow"         │              │
│          │  bob voted on "Merch..."        │              │
│          │  carol joined THE ZAO           │              │
└──────────┴────────────────────────────────┴──────────────┘
```

### Key Design Decisions

1. **Hub-and-spoke with hybrid navigation:** Home is the hub, pillars are spokes. Bottom tab bar (mobile) + sidebar (desktop) for primary navigation. Home screen uses cards for discovery.

2. **Now Playing is always visible:** Persistent audio bar across all screens (Spotify pattern). Hero card on home screen when radio is active.

3. **Activity feed with filters:** Combined feed of all activity types, filterable by pillar. Grouped by time ("Just Now", "Today", "Earlier"). Real-time updates via WebSocket or polling.

4. **Pillar cards with badge counts:** Each feature area gets a card showing unread/new count. Tapping goes to that section. This surfaces "what's new" without requiring users to check each section.

5. **Quick actions above the fold:** 3-4 most common actions (Post, Submit Song, Call, Vote) immediately accessible. Reduces friction to zero for the most important user actions.

6. **Member presence:** Online member avatars create a sense of community activity. Voice/call rooms shown with participant count and join button.

7. **Mobile-first, 5-tab bottom bar:** Home (center, elevated), Chat, Music, Governance, More (overflow for Social, Ecosystem, Tools, Settings).

### Implementation Notes for Next.js

- Home page at `src/app/(auth)/home/page.tsx` or update the auth layout default route
- Activity feed: New API route `/api/activity/feed` aggregating from Supabase (casts, votes, members, songs)
- Online presence: Supabase Realtime Presence or simple "last seen" polling
- Now Playing state: React context provider wrapping the auth layout, persists across route changes
- Pillar cards: Server component fetching counts, with client-side refresh interval
- Bottom tab bar: Client component in the auth layout, using `usePathname()` for active state
- Quick actions: Client component with modal/sheet triggers for each action
