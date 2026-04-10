# BetterCallZaal Master TODO

> Last updated: 2026-04-10
> Priority: P0 = this week, P1 = this month, P2 = next month, P3 = someday

---

## BCZ AGENT (Agent Zero on VPS - Business Operations)

Purpose: BetterCallZaal Strategies business machine. Handles client pipeline, job hunting, ZAO Stock coordination, sponsorship outreach, team management, cold outreach automation.

### Setup
- [ ] **P0** Upgrade VPS from 2GB to 4GB ($12-18/month)
- [ ] **P0** Deploy Agent Zero on VPS (`docker run` one-liner)
- [ ] **P0** Configure: Minimax M2.7 primary + Anthropic API fallback
- [ ] **P0** Build Telegram bridge (relay script - separate bot from ZOE)
- [ ] **P0** Load business context: BCZ services, resume versions, target companies, client pipeline, ZAO Stock status
- [ ] **P1** Configure profiles: client-outreach mode, job-hunt mode, event-planning mode

### Business Automation
- [ ] **P1** Job board scraping task (RemoteOK, HN, web3.career, WWR, LinkedIn)
- [ ] **P1** Browser automation for job research + applications
- [ ] **P1** Cold outreach drafting: web3 projects + Bar Harbor local businesses
- [ ] **P1** Find businesses with low Google/Yelp rankings (automated scraping)
- [ ] **P1** Resume tailoring per role type (5 versions auto-generated)
- [ ] **P1** Application pipeline tracking in Supabase
- [ ] **P2** Sponsorship outreach automation for ZAO Stock
- [ ] **P2** Test agent-to-agent communication with FailOften's Agent Zero

---

## ZOE (Vercel Serverless - Personal Daily Driver)

Purpose: Zaal's personal assistant on Telegram. Morning briefs, voice memos, content drafts, Farcaster engagement, calendar awareness. Lightweight, free, always responsive.

### Setup
- [ ] **P0** Fork bootcamp agent repo, set up Privy wallet for ZOE (Session 6)
- [ ] **P0** Deploy ZOE webhook + cron to Vercel (free tier, only runs when triggered)
- [ ] **P0** Register ZOE on ERC-8004 via 8004scan (100K+ agents already there)
- [ ] **P0** Connect to existing @zaoclaw_bot Telegram
- [ ] **P0** Load personal context: USER.md, SOUL.md, AGENTS.md, schedule

### Daily Features
- [ ] **P0** Morning brief at 4:30 AM (projects, calendar, top 3 priorities)
- [ ] **P0** DND-aware schedule (quiet during work hours, active in windows)
- [ ] **P1** Voice memo transcription -> content drafts (Farcaster, X, LinkedIn, Newsletter)
- [ ] **P1** One-at-a-time Farcaster engagement opportunities with draft replies
- [ ] **P1** x402 pay-per-call for Neynar writes (~$0.001/call vs $99/mo)
- [ ] **P1** Emerge-style viral loop - ZOE replies in /zao timeline (Session 8)
- [ ] **P1** Wire SIWA auth for agent-to-agent interactions
- [ ] **P2** Google Calendar MCP integration
- [ ] **P2** Evaluate MPP for streaming payments (fractal meetings, live rooms)
- [ ] **P3** Multi-agent coordination via Quilibrium (await Session 10 transcript)

---

## BOOTCAMP (Farcaster Agentic Bootcamp - Feed Full Transcripts)

- [ ] **P0** Feed Session 6 full transcript to Claude Code (urbe eth - Build a Farcaster Agent)
- [ ] **P0** Feed Session 7 full transcript (Samuel Zeller - Embedded Capital, x402, MPP)
- [ ] **P0** Feed Session 8 full transcript (ATown/Emerge - Going Viral, viral loop mechanics)
- [ ] **P0** Feed Session 9 full transcript (Vittorio/EF - ERC-8004 Identity & Reputation)
- [ ] **P0** Feed Session 10 full transcript (Cassie Heart/Quilibrium - Multi-Agent Coordination)
- [ ] **P1** Research doc for each session with specific code patterns and implementation steps
- [ ] **P1** Update doc 316 with full transcript insights for each session
- [ ] **P2** Enter FarHack Online 2026 with ZOE as submission

---

## ZAO STOCK (Oct 3 - Franklin St Parklet)

### Structure (from FailOften framework)
- [ ] **P0** Finalize 3-entity model: ZAO (talent/programming) + New Media Commons (funding/fiscal sponsorship via Fractured Atlas) + ENTERACT (technical build)
- [ ] **P0** Document how BCZ Strategies fits (Zaal's LLC, the entity that contracts/invoices/gets paid)
- [ ] **P0** Write internal ecosystem document (branding, structure, funding lanes, relationships)
- [ ] **P1** Define the 3 funding lanes: Paid (direct contract), Sponsored (ZAO brings sponsors), Funded (grants via NMC/Fractured Atlas, tax-deductible)

### Team + Standups
- [ ] **P0** Define team structure: Finance (Dr. Tricky/Cole), AV, Design/Branding, Operations (Zaal)
- [ ] **P0** Write basic agenda template for Tuesday standups (5 min overall + 10 min per team)
- [ ] **P0** Message each team member 1-on-1 to assign roles
- [ ] **P0** Merge PR #141 (team dashboard) and run Supabase migration
- [ ] **P0** Run seed script to create team member passwords
- [ ] **P0** Share passwords with team via DM (FailOften, AttaBotty/Cole, Dr. Tricky, etc.)
- [ ] **P1** Invite Bar Harbor Chamber event managers to Tuesday meeting (wait ~1 month to formalize)

### Sponsorship + Funding
- [ ] **P0** Create sponsorship package document (bronze/silver/gold tiers + past event photos showing sponsor visibility)
- [ ] **P0** Ask FailOften: how does NMC/Fractured Atlas fiscal sponsorship activate? What's the process?
- [ ] **P1** Identify 2-3 grant/funding paths (FailOften to lead, Q3/Q4 grant cycles open $10K-$100K doors)
- [ ] **P1** Source past event photos for sponsorship deck (show the tiers - small logos at bottom = bronze, readable names = silver, "presented by" = gold)
- [ ] **P1** Define what contracts look like for team members (FailOften to draft)

### Production + Logistics
- [ ] **P0** Pitch Steve Peer on co-curating the music lineup
- [ ] **P1** Get Wallace Events tent rental quote (weather backup)
- [ ] **P1** Sound/PA vendor research (Ellsworth/Bangor area)
- [ ] **P1** Build timeline with deadlines (work backward from Oct 3)
- [ ] **P1** Identify existing local events to co-produce (offer AV/lighting/streaming they don't have)
- [ ] **P1** Cole (AttaBotty) to connect with Alliance Events model for sponsorship approach

### Brand + Content
- [ ] **P1** Create brand kit (language, visuals, how to talk about ZAO - "safe language" from FailOften doc)
- [ ] **P1** Build Claude Code skill for ZAO Stock promotion (auto-generates pitch content)
- [ ] **P2** Sunday livestream of band at bar owner's house = first content piece for ZAO Stock portfolio

---

## JOB HUNT ($35+/hr virtual)

- [ ] **P0** Update resume to include: digital marketing, events, community building, AI agents
- [ ] **P0** Create 5 resume versions: Web3 DevRel, Engineering, AI/Automation, Marketing, PM
- [ ] **P1** Mass apply to 5-10 jobs per day (Agent Zero automates research + drafting)
- [ ] **P1** Draft cold DM template for Farcaster (warm intro to target companies)
- [ ] **P1** Apply to Neynar, Lazer, Base, Quorum, Solana roles specifically
- [ ] **P1** Set up LinkedIn profile for remote job visibility
- [ ] **P1** Track all applications in pipeline (Supabase table or simple spreadsheet)
- [ ] **P2** FAA Part 107 drone test (few months out, enables drone photography gig)

---

## CLIENT PIPELINE (BetterCallZaal Strategies)

### Local (Bar Harbor - April/May is the window before tourist season)
- [ ] **P0** Cold pitch local businesses (April-May window before Memorial Day - after May you can't reach business owners)
- [ ] **P0** Find businesses with low Google/Yelp rankings to pitch website/marketing help (agent can scrape this)
- [ ] **P0** Position as "digital marketer for musicians" - people jump at this, it's the entry point
- [ ] **P1** Follow up with bar owner on bartending gig + consulting relationship
- [ ] **P1** Sunday: livestream band at bar owner's house (iPhone for now, start content portfolio)
- [ ] **P1** Co-produce existing events (provide AV/lighting/streaming they don't have) instead of creating new ones
- [ ] **P2** Get proper camera for video/photography services
- [ ] **P2** FAA Part 107 drone test (someone already asking for drone shots)

### Web3 + Remote
- [ ] **P1** Draft cold email/DM templates: web3 projects needing marketing/dev/agents
- [ ] **P1** Build case studies from ZAO (1000+ users, zero exploits), WaveWarZ ($50K volume), FISHBOWLZ
- [ ] **P1** Create consulting services one-pager (digital marketing, web dev, video, events, AI agents)
- [ ] **P2** Build portfolio page on bettercallzaal.com

### Revenue Strategy (from FailOften meeting)
- [ ] **P1** Don't create events from scratch - co-produce existing ones (BCZ gets paid to produce)
- [ ] **P1** Take in sponsorship money (not spend money to sponsor) - BCZ handles production, sponsors pay
- [ ] **P1** Set minimum parameters for every opportunity (financial, structural, or reputational return) - don't say yes to everything
- [ ] **P2** Agency model: Zaal does comms, ZAO community members do the work, everyone gets paid from project budget

---

## SOCIAL / BRAND

- [ ] **P0** Post build-in-public content about ZOE v2 agent work (Farcaster + X)
- [ ] **P1** Engage strategically on Farcaster daily (3-5 replies that position as builder)
- [ ] **P1** Start voice memo -> content pipeline (record thoughts, ZOE drafts posts)
- [ ] **P1** Draft newsletter for Year of the ZABAL
- [ ] **P2** Cross-post content to LinkedIn for job visibility

---

## ZAO OS (Code)

- [ ] **P0** Merge PR #141 (ZAO Stock team dashboard) + run migration + seed script
- [ ] **P1** Run Supabase migration for business dev tables (job_applications, client_pipeline, engagement_queue, content_drafts)
- [ ] **P1** Merge ws/zoe-v2-foundation branch to main
- [ ] **P2** Continue feature development (based on open issues)
- [ ] **P2** Update research index with docs 313 (token optimization)

---

## QUILIBRIUM (Budget Dev Infrastructure)

- [ ] **P1** Monitor quilibrium-js-sdk-channels repo for TypeScript SDK stability
- [ ] **P2** Test Q Storage (5GB free) for decentralized media backup
- [ ] **P2** Evaluate Quorum messenger as XMTP alternative for ZAO E2EE messaging
- [ ] **P3** Explore Klearu (E2EE ML) for private LLM inference
- [ ] **P3** Explore running a Q node for QUIL earnings ($0.013/token, generational emissions)

---

## ZAO ECOSYSTEM (Other Projects)

- [ ] **P1** WaveWarZ: check status, any blocked items
- [ ] **P1** ZAO Fractals: prep for Monday 6pm meeting
- [ ] **P1** Newsletter: draft this week's edition
- [ ] **P2** FISHBOWLZ: check fishbowlz.com status
- [ ] **P2** ZABAL: token/brand updates
- [ ] **P3** LTAE: Let's Talk about ETH planning

---

## DONE (move completed items here with date)

- [x] 2026-04-10: Upgrade OpenClaw to v2026.4.9
- [x] 2026-04-10: Remove 7 sub-agents (ZOEY, WALLET, BUILDER, SCOUT, FISHBOWLZ, CASTER, ROLO)
- [x] 2026-04-10: Write SOUL.md, USER.md, AGENTS.md, MEMORY.md, HEARTBEAT.md
- [x] 2026-04-10: Install Claude Code CLI on VPS + OAuth token
- [x] 2026-04-10: Set up 4 VPS crons (morning, lunch, evening, friday)
- [x] 2026-04-10: Write Supabase migration for business dev tables
- [x] 2026-04-10: Deploy job scanner script on VPS
- [x] 2026-04-10: Redesign 3 Remote Triggers for ZOE v2
- [x] 2026-04-10: Research Agent Zero, pi.dev, agent memory systems
- [x] 2026-04-10: ZOE v2 design spec + Phase 1 plan
- [x] 2026-04-10: Research doc 313 (agent token optimization)
- [x] 2026-04-10: Built ZAO Stock team dashboard (PR #141) - 3 tables, password auth, goals/todos/roles
- [x] 2026-04-10: Created meeting agenda HTML for FailOften sync
- [x] 2026-04-10: Processed meeting transcript + FailOften framework doc into action items
- [x] 2026-04-10: Updated public /stock page (removed placeholder artist grid)
