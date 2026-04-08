# ZAO OS Daily Learning Curriculum

ZOE delivers one task per day at 7 AM ET via scheduled trigger. Each task is specific to ZAO OS - features to test, code to understand, tools to try, integrations to verify. Not generic AI tips.

**Format:** Read the task, try it during downtime (waiting for agents, waiting for builds), report back what you found.

---

## Week 1: Know Your Codebase

### Day 1: The Activity Feed - 7 data sources in one route
**Explore:** `src/app/api/activity/feed/route.ts`
**Try this:**
1. Read the route - it aggregates casts, songs, votes, proposals, members, fractals, and battles into one feed
2. Hit it locally: `curl http://localhost:3000/api/activity/feed` (with auth)
3. Count how many Supabase tables it queries. Are any of those queries slow?

**Why:** This is the heartbeat of ZAO OS. If this route is slow, the whole app feels slow. 0 tests exist for it.

### Day 2: community.config.ts - the fork file
**Explore:** `community.config.ts` (~282 lines)
**Try this:**
1. Read the entire file - every feature, contract, channel, and admin FID lives here
2. Find the `sopha` config - it's set to `minQualityScore: 0` (disabled). What would it do if enabled?
3. Find the `arweave` config - max audio size is 50MB. Is that enforced in `/api/upload/`?

**Why:** If someone forks ZAO OS, this is the ONLY file they change. You should know every line.

### Day 3: The 19 hooks - what's wired, what's dormant
**Explore:** `src/hooks/`
**Try this:**
1. List all 19 hooks: `ls src/hooks/`
2. Pick 3 you haven't used recently: `useLensAuth`, `useAutoStreamMarker`, `useLiveTranscript`
3. Grep for their imports: `grep -r "useLensAuth" src/` - are they actually imported anywhere?

**Why:** Dormant hooks are either dead code to remove or features waiting to be activated.

### Day 4: Keyboard shortcuts nobody knows about
**Explore:** `src/hooks/useKeyboardShortcuts.ts`
**Try this:**
1. Read the hook - what shortcuts are registered?
2. Open ZAO OS locally and try each one: Cmd+K (search), / (compose), Esc (close panels)
3. Are there shortcuts that should exist but don't? (e.g., Cmd+/ for keyboard shortcut help)

**Why:** Keyboard shortcuts make power users happy. But only if they know they exist.

### Day 5: The music player architecture - 30+ components
**Explore:** `src/components/music/`
**Try this:**
1. Count the components: `ls src/components/music/ | wc -l`
2. Read `src/providers/audio/PlayerProvider.tsx` - this is the brain
3. Find these specific features and check if they're accessible in the UI:
   - `SleepTimer.tsx` - can users set a sleep timer?
   - `AudioFiltersPanel.tsx` - can users adjust EQ?
   - `BinauralBeats.tsx` - can users access binaural beats?

**Why:** 30+ music components exist. Some might be built but not wired into the UI.

### Day 6: Respect tokens - what the code says vs what research says
**Explore:** `src/lib/respect/` and `community.config.ts` respect section
**Try this:**
1. Read the Respect config: OG contract + ZOR contract addresses
2. Read Doc 4 (research) - it describes "tiers and decay"
3. Check the actual code: does it implement tiers? Decay? (Spoiler: NO)
4. Note the discrepancy - research is aspirational, code is truth

**Why:** Known discrepancy. Understanding where research != code prevents building on wrong assumptions.

### Day 7: The 260 untested API routes
**Explore:** `src/app/api/`
**Try this:**
1. Count routes with tests: `find src/app/api -name "__tests__" -type d | wc -l` (answer: ~14)
2. Count total route files: `find src/app/api -name "route.ts" | wc -l` (answer: ~274)
3. Pick ONE untested route you use frequently and read it end-to-end
4. Ask yourself: what would break if the Neynar API changed its response format?

**Why:** 95% of routes have no tests. This is the biggest risk in the codebase.

---

## Week 2: Integrations You Built But May Have Forgotten

### Day 8: Twitch integration - 6 untested routes
**Explore:** `src/app/api/twitch/`
**Try this:**
1. List all Twitch routes: clip, chat, marker, poll, prediction, stream-info
2. Read `src/app/api/twitch/poll/route.ts` - how does it create a Twitch poll?
3. Check: is the Twitch OAuth token still valid? When does it expire?

**Why:** 6 routes, 0 tests. If Twitch changes their API, you won't know until users complain.

### Day 9: Bluesky cross-posting - does it still work?
**Explore:** `src/app/api/bluesky/` and `src/lib/publish/`
**Try this:**
1. Read the Bluesky feed sync route
2. Check `scripts/publish-bluesky-feed.ts` - when was it last run?
3. Test: does the Bluesky member sync still match FIDs to Bluesky handles?

**Why:** Cross-platform publishing is a key feature. If Bluesky broke silently, you'd never know.

### Day 10: ZOUNZ DAO - on-chain governance
**Explore:** `src/app/api/zounz/proposals/` and `src/components/zounz/`
**Try this:**
1. Read `src/lib/zounz/contracts.ts` - what contracts are configured?
2. Read `ZounzProposals.tsx` - how does it fetch proposals from the Governor contract?
3. Check: when was the last ZOUNZ proposal? Is this feature actively used?

**Why:** On-chain governance is a pillar of ZAO OS. Understanding the contract integration matters.

### Day 11: Snapshot weekly polls
**Explore:** `src/app/api/snapshot/` and `src/components/governance/CreateWeeklyPoll.tsx`
**Try this:**
1. Read the Snapshot config in `community.config.ts` - 10 poll choices configured
2. Read `src/lib/snapshot/client.ts` - how does it talk to Snapshot's GraphQL API?
3. Check: is the `zaal.eth` Snapshot space still active?

**Why:** Gasless voting for 188 members. One of the most accessible governance features.

### Day 12: Hats Protocol - role management
**Explore:** `src/app/api/hats/` and `scripts/read-hats-tree.ts`
**Try this:**
1. Run the script: `npx tsx scripts/read-hats-tree.ts` - what roles exist?
2. Read `src/components/hats/HatBadge.tsx` - how are role badges displayed?
3. Check: tree ID 226 on Optimism - is this the right tree?

**Why:** Hats controls who can do what. If the tree is misconfigured, permissions break.

### Day 13: 100ms vs Stream.io - two audio providers
**Explore:** `src/app/api/100ms/` and `src/app/api/stream/`
**Try this:**
1. Check `community.config.ts` - which audio provider is active? (answer: stream)
2. Read both token generation routes - how do they differ?
3. Does any code path still use 100ms? Or is it fully dormant?

**Why:** Two providers configured, one active. Dead code paths create confusion.

### Day 14: The broadcast system - RTMP multistream
**Explore:** `src/app/api/broadcast/` and `src/lib/spaces/rtmpManager.ts`
**Try this:**
1. Read the RTMP manager - it can stream to Twitch, YouTube, Kick, Facebook
2. Read `src/app/api/broadcast/start/route.ts` - what does it actually do?
3. Check: are the platform OAuth connections still working?

**Why:** Broadcasting to 4 platforms simultaneously is a killer feature - if it works.

---

## Week 3: Hidden Features & Unused Components

### Day 15: Farcaster Mini App SDK
**Explore:** `src/hooks/useMiniApp.ts` and research doc 250
**Try this:**
1. Read the hook - it's extensive, hooks into `/api/miniapp/*`
2. Read Doc 250's gap analysis - 11 features NOT YET implemented
3. Pick the easiest gap (haptic feedback) - could you add it to the music player?

**Why:** Mini apps are Farcaster's future. ZAO OS has the hooks but gaps in implementation.

### Day 16: WaveWarZ music battles
**Explore:** `src/app/api/wavewarz/` and `community.config.ts` wavewarz section
**Try this:**
1. Read all 4 routes: artists, battles, sync, random-stat
2. Check the external URLs in config - do they still resolve?
3. Read the WaveWarZ research docs (wavewarz/ folder)

**Why:** Prediction markets for music. 4 routes, 0 tests. Is this feature alive or abandoned?

### Day 17: Arweave / Permaweb music library
**Explore:** `src/components/music/PermawebLibrary.tsx` and the arweave config
**Try this:**
1. Read the component - how does it browse Arweave music?
2. Check `/api/upload/route.ts` - does it enforce the 50MB audio limit from config?
3. Is the Arweave gateway (`arweave.net`) responding?

**Why:** Permanent music storage on Arweave is a differentiator. But only if the upload path works.

### Day 18: Collaborative playlists & listening parties
**Explore:** `src/components/music/CollaborativePlaylists.tsx` and `ListeningParties.tsx`
**Try this:**
1. Read both components - what UI do they render?
2. Grep for their imports - are they used anywhere in the app?
3. If unused: are they complete enough to wire in? Or just stubs?

**Why:** Social music features that could drive engagement. May be complete but unwired.

### Day 19: XMTP private messaging
**Explore:** `src/hooks/useWalletXMTP.ts` and `src/components/messages/`
**Try this:**
1. Read the hook - how does it initialize XMTP?
2. Read `MessagesRoom.tsx` - what's the E2E encrypted chat UI?
3. Check: does XMTP still use the WASM binary in `public/`?

**Why:** Private messaging is Phase 2. Understanding the current state helps plan the launch.

### Day 20: ENS subnames - code complete, needs on-chain setup
**Explore:** `src/hooks/useENS.ts` and `scripts/generate-ens-operator.ts`
**Try this:**
1. Read the hook - how does it resolve ENS names?
2. Read the operator script - what does it generate?
3. Check memory: "ENS subnames: code complete, needs focused on-chain setup session"

**Why:** This has been "almost done" for a while. Understanding the gap helps you finish it.

### Day 21: The admin panel - 30+ untested routes
**Explore:** `src/app/api/admin/`
**Try this:**
1. List all admin routes - member health, backfill, export, contacts, dormant detection
2. Pick one you've never used and read it
3. Ask: could any of these be automated by ZOE?

**Why:** Admin routes are your operational backbone. If they break, you fly blind.

---

## Week 4: Skills, Agents & Your Workflow

### Day 22: Audit your 20 skills - which earn daily use?
**Explore:** `.claude/skills/`
**Try this:**
1. List all skills and their descriptions
2. Rank them: daily use / weekly use / never used / forgot it existed
3. For "never used" skills: are they still relevant? Should they be updated or removed?

**Why:** Doc 276 noted "audit which skills earn daily use vs which are aspirational."

### Day 23: The /zao-research skill - 300+ lines of methodology
**Explore:** `.claude/skills/zao-research/SKILL.md`
**Try this:**
1. Read the full skill - it has 6 mandatory steps, banned phrases, quality checks
2. Run it on a topic: `/zao-research [something you're curious about]`
3. Check: does the output pass all 6 hard requirements?

**Why:** This is your most complex skill. Understanding it makes every research session better.

### Day 24: Your agent squad - ZOE, SCOUT, CASTER, ROLO, STOCK
**Explore:** Via `/vps status`
**Try this:**
1. Check what each agent did in the last 24 hours
2. Send SCOUT a research task via ZOE dispatch
3. Check zoe.zaoos.com - is the dashboard showing real data?

**Why:** 5 agents running 24/7. You should know what they produce and whether it's useful.

### Day 25: GitNexus knowledge graph - 17,627 nodes
**Explore:** Use GitNexus MCP tools
**Try this:**
1. Query: "What are the most connected files in ZAO OS?"
2. Query: "What would break if I changed src/lib/auth/session.ts?"
3. Query: "Show the dependency graph for the music player"

**Why:** Impact analysis before making changes. The graph knows connections you don't.

### Day 26: Test one untested route - write the test
**Explore:** Pick any route from the 260 untested ones
**Try this:**
1. Pick a route you care about (suggestion: `/api/activity/feed`)
2. Read `src/app/api/__tests__/` for examples of how existing tests work
3. Write ONE test for the happy path using `vi.mock()` + Vitest patterns
4. Run it: `npx vitest run src/app/api/activity/__tests__/feed.test.ts`

**Why:** Going from 0 to 1 test on a route is the hardest step. The second test is easy.

### Day 27: The middleware - rate limiting & CORS
**Explore:** `src/middleware.ts`
**Try this:**
1. Read the middleware - how does rate limiting work?
2. What are the per-IP limits? Are they appropriate for 188 members?
3. Check: are there routes that should be rate-limited but aren't?

**Why:** Middleware runs on EVERY request. A bug here affects everything.

### Day 28: Run /autoresearch on a real goal
**Explore:** Any measurable goal
**Try this:**
1. Pick something concrete: "reduce the number of Supabase queries in /api/activity/feed from N to N-2"
2. Run `/autoresearch` with that goal
3. Watch it iterate: modify, verify, keep/discard

**Why:** Autonomous iteration on real codebase goals. See what it finds that you wouldn't.

### Day 29: The cross-platform publish pipeline
**Explore:** `src/lib/publish/`
**Try this:**
1. Read every file in the publish directory
2. Trace the flow: proposal approved -> 1000+ Respect -> auto-publish to Farcaster + Bluesky + X
3. Check: are Lens and Hive still "scaffolded but deferred"?

**Why:** Cross-platform publishing is core to governance output. The pipeline has 3 active + 2 deferred platforms.

### Day 30: Write a custom skill for something you repeat
**Explore:** Your own workflow
**Try this:**
1. Think about what you do every session that's repetitive
2. Look at `.claude/skills/new-route/SKILL.md` as a template (it's simple)
3. Write a 20-line skill and save it to `.claude/skills/`
4. Test it

**Why:** Every repetitive task is a skill waiting to be written. You have 20 skills - make it 21.
