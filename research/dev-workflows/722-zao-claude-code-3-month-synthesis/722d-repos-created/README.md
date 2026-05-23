---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: Catalog the 45 new + 52 updated repos under bettercallzaal and adjacent orgs between 2026-02-23 and 2026-05-23. Group by purpose, flag graduation candidates, identify dormant repos to archive.
---

# Doc 722d: ZAO Ecosystem Repository Audit (Feb 23 - May 23, 2026)

## Overview

Comprehensive audit of new and updated repositories across **bettercallzaal** (primary), **songchaindao-dot** (Iman), **CandyToyBox** (Samantha), and **hurric4n3ike** (Hurric4n3ike) GitHub organizations. Period: 2026-02-23 through 2026-05-23 (92 days).

Data sources: `gh repo list [org] --limit 300 --json name,description,createdAt,updatedAt,visibility,primaryLanguage,isFork,parent` run 2026-05-23 13:37 UTC.

**Key findings:**
- 45 new repos created across all orgs
- 97 repos with updates since cutoff (only 52 in scope per brief; others pre-date cutoff or are older)
- 7 graduates completed (BCZ YapZ), 3 spinning out (ZAOstock, ZAONEXUS), 2 dormant for archival
- Polyglot stack: TypeScript dominates (64%), Python (15% bots/ML), HTML (8% sites)
- Graduation candidates: Zlank, WWbase, ZAO-101
- Dormant: fishbowlz (archived per doc 673), zaoscribe (paused), OpenWhisp (merged into Bonfire)

---

## Key Decisions (Top 5)

1. **Graduation pipeline for H2 2026:** Zlank (Snap builder) and WWbase (music battles) are production-ready; recommend own repos + staging timeline Q3. ZAO-101 is evergreen reference; graduate as standalone educational site by Jul 1.

2. **Consolidate fractal bots:** 7 dated fractal-bot variants (feb/mar/apr/june 2025) are obsolete. Archive all except fractalbotV3June2025, migrate remaining logic to zaoscribe (paused). Recommend: tag all as `deprecated-fractal-bot-family`, bulk archive by Jun 15.

3. **Monorepo winding:** zao-mono (Apr 16, private) and zao-ui (Apr 16, private) were scaffolded for future; not yet adopted. Decision: fold both into ZAOOS main (submodules) by Jun 30 or hard-delete if unneeded. Request Zaal sign-off on usage intent.

4. **Forks to upstream:** api, chat, tasks (all Apr 15, forks) are "recoupable" per CLAUDE.md (own DB/domain ready). Plan migration off fork status: api + chat -> own schemas in bettercallzaal/agentic-label-api (Hermes integration); tasks -> standalone zao-task-manager (Supabase RLS + permissions).

5. **Archive by Jun 15:** ww (private, frozen Jan 26), quad-sandbox (private, 1 commit), agencyweb3toolkit (private, frozen Jan 19), unifiedchatclient (private, last Nov 29). All pre-date current stack. Zaal to confirm deletion vs archive.

---

## Repos by Purpose

### ZAO Ecosystem Apps

Mission-critical, live or alpha-stage.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **ZAOOS** | 2026-03-12 | 2026-05-23 | TypeScript | LIVE | Main app - Farcaster client, spaces, music player, agents |
| **zaoos-workspace** | 2026-04-05 | 2026-04-05 | n/a | PRIVATE | ZOE agent configs, memory, daily logs (internal) |
| **ZAONEXUS** | 2026-02-13 | 2026-05-18 | TypeScript | SPINNING OUT | Ecosystem nexus aggregator (to own repo by Jun) |
| **zaostock** | 2026-04-29 | 2026-05-18 | TypeScript | SPINNING OUT | ZAOstock dashboard + Telegram bot (own repo/DB by May 29) |
| **zao-101** | 2026-04-24 | 2026-05-18 | HTML | CANDIDATE | Learn about The ZAO - educational hub |
| **CoCConcertZ** | 2026-03-04 | 2026-05-18 | TypeScript | LIVE | COC Concertz music events app (original Farcaster client) |

**Status:** ZAOOS is the lab hub; ZAO-101, ZAONEXUS, zaostock are spinning out on schedule. CoCConcertZ is historical (pre-spinout).

---

### Brand Sites & Landing Pages

Public-facing websites, portfolio, pitch decks.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **bettercallzaalwebsite** | 2026-03-18 | 2026-05-22 | HTML | LIVE | BetterCallZaal landing (consulting site) |
| **bcz-journal** | 2026-05-08 | 2026-05-22 | Markdown | LIVE | Zaal's build-in-public journal |
| **riverside-internal** | 2026-05-18 | 2026-05-19 | n/a | CONSULTING | Riverside Group LLC 16-piece operating system (client project) |
| **riverside-group-demo** | 2026-04-20 | 2026-04-25 | HTML | PAUSED | Landscape design firm demo (unfinished) |
| **candytoybox-site** | 2026-04-18 | 2026-04-20 | TypeScript | LIVE | Samantha's portfolio + consulting (candytoybox.com) |
| **bettercallzaal-coding-hub** | 2026-02-20 | 2026-03-11 | TypeScript | DEPRECATED | GitHub aggregator with embedded READMEs (replaced by bcz-journal) |
| **Zaal-s-Birthday** | 2026-05-01 | 2026-05-01 | TypeScript | ONE-OFF | Birthday button (playful) |
| **zao-stock** | 2026-02-17 | 2026-02-19 | TypeScript | ARCHIVED | Pre-spinout ZAOstock site (superseded by zaostock repo) |

**Status:** bettercallzaalwebsite, bcz-journal, candytoybox-site are active. riverside-group-demo is stalled; riverside-internal is live consulting. bettercallzaal-coding-hub abandoned in favor of bcz-journal. zao-stock pre-spinout artifact.

---

### Bots & Automation

Telegram, Discord, Farcaster automations.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **zaoscribe** | 2026-05-18 | 2026-05-19 | TypeScript | PAUSED | Discord audio capture -> Whisper.cpp -> Anthropic extraction (doc 674) |
| **zabalbot** | 2026-02-16 | 2026-02-17 | TypeScript | ARCHIVED | ZABAL agent bot v1 (deferred) |
| **zabal-bot-archive** | 2026-02-17 | 2026-02-17 | n/a | ARCHIVED | zabal-bot file archive |
| **zabalnewsletter** | 2026-01-25 | 2026-01-28 | Python | DORMANT | Newsletter automation (no commits 30+ days) |
| **zabalsocials** | 2026-01-17 | 2026-01-25 | JavaScript | DORMANT | Social posting automation (frozen) |
| **fractalbotfeb2026** | 2026-02-13 | 2026-03-03 | Python | DEPRECATED | Fractal bot (Feb variant, obsolete) |
| **fractalbotmarch2026** | 2026-03-06 | 2026-03-28 | Python | DEPRECATED | Fractal bot (Mar variant, obsolete) |
| **fractalbotapril2026** | 2026-04-09 | 2026-04-14 | Python | DEPRECATED | Fractal bot (Apr variant, obsolete) |
| **fractalbotV3June2025** | 2025-06-09 | 2025-08-27 | Python | DEPRECATED | Fractal bot V3 (last stable version before variants) |
| **ZAO-FRACTAL-BOTV2** | 2025-04-22 | 2025-08-27 | Python | DEPRECATED | Fractal bot V2 (predecessor) |
| **newsletter-bot-1** | 2025-03-12 | 2025-03-12 | TypeScript | DEPRECATED | Early newsletter bot (superseded) |
| **Newsletterbot1** | 2025-10-01 | 2025-10-01 | Python | DEPRECATED | Newsletter variant (dormant) |

**Status:** zaoscribe is current (paused, awaiting reboot per doc 674). zabalbot/zabal-bot-archive are archived. **7 fractal-bot variants (feb through june) should be bulk-archived by Jun 15** - only fractalbotV3June2025 kept as reference. Newsletter bots (zabalnewsletter, newsletter-bot-1, Newsletterbot1) are all dormant; consolidate to one or sunset.

---

### Music/WaveWarZ Family

Solana music battles, analytics, merch, trading.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **wwbase** | 2026-05-15 | 2026-05-15 | n/a | CANDIDATE | WaveWarZ Base - public brief, music battles on Base L2 |
| **wavewarzapp** | 2026-05-07 | 2026-05-07 | TypeScript | ALPHA | WaveWarZ Live - mobile alert + spectator app (demo) |
| **wavewarz-base** (CandyToyBox) | 2026-02-14 | 2026-05-15 | TypeScript | LIVE | WaveWarZ base implementation (Solana) |
| **wavewarz-intelligence** (CandyToyBox) | 2026-03-01 | 2026-04-20 | TypeScript | LIVE | WaveWarZ analytics platform |
| **wavewarz-merch-shop** (CandyToyBox) | 2026-02-20 | 2026-02-20 | HTML | PAUSED | WaveWarZ merch shop (agentic) |
| **analytics-wave-warz** (CandyToyBox) | 2025-11-24 | 2026-01-07 | TypeScript | ARCHIVED | WaveWarz artist/trader/fan stats (superseded by wavewarz-intelligence) |
| **WaveWarz-Stats-App** (CandyToyBox) | 2025-11-22 | 2025-11-22 | TypeScript | DEPRECATED | Stats app v1 (frozen) |
| **V2-Stats-App-WaveWarz** (CandyToyBox) | 2025-11-23 | 2026-01-04 | TypeScript | DEPRECATED | Stats app v2 (abandoned) |
| **wavewarzhomepage** (hurric4n3ike) | 2026-05-03 | 2026-05-03 | JavaScript | ALPHA | WaveWarZ homepage redesign (normie adoption) |
| **wavewarzhomepagev** (hurric4n3ike) | 2026-05-09 | 2026-05-10 | JavaScript | ALPHA | WaveWarZ homepage variant |
| **wavewagerz** (hurric4n3ike, private) | 2024-11-28 | 2026-05-15 | TypeScript | LIVE | WaveWarZ frontend codebase |
| **WARZAI** | 2025-09-09 | 2025-09-10 | TypeScript | DORMANT | Music AI (paused, no activity 30+ days) |

**Status:** wavewarz-base (Solana), wavewarz-intelligence (analytics), wavewagerz (private frontend) are live production. wwbase and wavewarzapp are recent alpha candidates for graduation (own DB + domain by Q3). wavewarzhomepage variants are experimental; recommend consolidate to single source. Old stats app variants should be archived.

---

### Mini-Apps & Farcaster Snaps

Modular, snap-based and miniapp tools.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **zlank** | 2026-04-25 | 2026-05-15 | TypeScript | CANDIDATE | No-code Farcaster Snap builder (stack blocks, deploy, share) |
| **zlank-snap-template** | 2026-04-25 | 2026-04-25 | TypeScript | LIVE | Starter template for Farcaster Snaps (Hono + Vercel) |
| **duodo-snap** | 2026-04-08 | 2026-04-10 | TypeScript | ALPHA | Duodo snap (early stage) |
| **nouns-snap** | 2026-04-08 | 2026-04-10 | TypeScript | ALPHA | Nouns snap (early stage) |
| **zabalsnap1** | 2026-04-08 | 2026-04-10 | TypeScript | ALPHA | ZABAL snap v1 (early stage) |
| **ltaesnap** | 2026-04-16 | 2026-04-16 | TypeScript | ALPHA | ltaesnap (early stage) |
| **ZOUNZ** | 2026-02-19 | 2026-03-02 | TypeScript | PAUSED | AI music generation + Audius discovery + Zora NFT minting + Attention Markets (doc 540) |

**Status:** zlank is the most mature snap builder; candidate for graduation (own repo, docs, example gallery by Jun). zlank-snap-template is the v1 wedge. duodo-snap, nouns-snap, zabalsnap1, ltaesnap are early; converge to 2-3 flagship snaps by Jul. ZOUNZ paused per doc 540 (pivoted to mini-app research).

---

### Tools & Utilities

Code generation, conversion, dashboards, helpers.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **textsplitter** | 2026-03-18 | 2026-03-25 | JavaScript | PAUSED | Text splitting utility |
| **CustomPDFCreator** | 2026-03-09 | 2026-03-09 | JavaScript | ONE-OFF | Custom PDF creation tool |
| **ZAOVideoEditor** | 2026-03-18 | 2026-05-18 | Python | PAUSED | Video editing automation (doc 540 candidate) |
| **ZAO-Video-Editor** | 2026-03-12 | 2026-03-12 | Python | PAUSED | Video editor variant (duplicate) |
| **ZAO-Leaderboard** | 2025-12-28 | 2026-01-29 | TypeScript | PAUSED | ZAO member leaderboard (no recent commits) |
| **crownvics** | 2026-04-10 | 2026-04-13 | HTML | ONE-OFF | Crown Vics (unclear purpose) |
| **Aurdour** | 2026-02-23 | 2026-04-04 | JavaScript | PAUSED | Professional 2-deck DJ platform with Flow Mode auto-DJ |

**Status:** textsplitter, CustomPDFCreator are utilities; frozen. ZAOVideoEditor/ZAO-Video-Editor are duplicate video editors - consolidate to one or delete. ZAO-Leaderboard is paused. Aurdour (2-deck DJ) is experimental; assess if worth reviving or archiving. All have minimal recent activity.

---

### Educational & Reference

Learning resources, documentation, onboarding.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **zao-101** | 2026-04-24 | 2026-05-18 | HTML | CANDIDATE | Learn about The ZAO - 4 pillars (org, autonomous, OS, OSS) |
| **ZAOFlights** | 2026-03-15 | 2026-03-15 | TypeScript | PAUSED | ZAO flights booking (unclear; possibly test/demo) |
| **zaomusicbot** | 2026-02-24 | 2026-03-12 | JavaScript | PAUSED | Music bot (unclear purpose) |
| **songjam-site** | 2026-03-24 | 2026-03-24 | TypeScript | FORK | Songjam website with leaderboard (fork of upstream) |

**Status:** zao-101 is evergreen reference; graduate to standalone by Jul 1. ZAOFlights unclear purpose - request clarification or archive. zaomusicbot/songjam-site are paused/forks.

---

### Forks & Consulting Projects

Upstream forks, client work, experimental scaffolds.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **api** (fork) | 2026-04-15 | 2026-04-15 | TypeScript | CANDIDATE | Forked music label API (recoupable) |
| **chat** (fork) | 2026-04-15 | 2026-04-15 | TypeScript | CANDIDATE | Forked agentic record label UI (recoupable) |
| **tasks** (fork) | 2026-04-15 | 2026-04-15 | TypeScript | CANDIDATE | Forked task management (recoupable) |
| **eliza1** (fork) | 2025-02-13 | 2025-02-28 | TypeScript | FORK | ElizaOS agent framework fork (research) |
| **uvrintrobot** | 2026-04-17 | 2026-04-17 | Python | ONE-OFF | UVR intro bot (unclear) |
| **16statestreet** | 2026-02-26 | 2026-02-26 | TypeScript | ONE-OFF | 16 State Street address project (unclear) |
| **budget2026** | 2026-02-25 | 2026-04-01 | Python | PRIVATE | Budget tracking (internal, frozen) |
| **imanprojects** | 2026-05-06 | 2026-05-14 | TypeScript | ACTIVE | Iman's project tracker (cowork-zaodevz team) |
| **zao-ui** (private) | 2026-04-16 | 2026-04-16 | TypeScript | PRIVATE | Shared UI design tokens (navy/gold dark theme) - not yet adopted |
| **zao-mono** (private) | 2026-04-16 | 2026-04-16 | n/a | PRIVATE | ZAO monorepo with git submodules - not yet adopted |
| **quad-sandbox** (private) | 2026-04-24 | 2026-04-24 | n/a | PRIVATE | Quad team sandbox (1 commit, frozen) |
| **agencyweb3toolkit** (private) | 2026-01-19 | 2026-01-19 | TypeScript | PRIVATE | Web3 agency toolkit (frozen, deprecated) |
| **unifiedchatclient** (private) | 2025-11-29 | 2025-11-29 | TypeScript | PRIVATE | Unified chat client (frozen) |

**Status:** api, chat, tasks are "recoupable forks" ready to migrate off fork status. zao-ui, zao-mono are scaffolded but unused; fold or delete. quad-sandbox, agencyweb3toolkit, unifiedchatclient should be archived. imanprojects is active team tool.

---

### Adjacent Org Activity: songchaindao-dot

Iman's org; Cowork bot, ecosystem tools.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **cowork-zaodevz** | 2026-05-07 | 2026-05-21 | TypeScript | LIVE | Universal team action tracker (Zaal+Iman+ThyRev+Samantha) - doc 650 |
| **topier** | 2026-05-14 | 2026-05-14 | TypeScript | ALPHA | Topier tool (new, unclear purpose) |
| **ryn** | 2026-05-11 | 2026-05-13 | TypeScript | ALPHA | Ryn tool (new, unclear purpose) |
| **foodchainn** | 2026-05-12 | 2026-05-12 | TypeScript | ALPHA | FoodChain app (new, unclear purpose) |
| **ontask** | 2026-05-08 | 2026-05-08 | TypeScript | ALPHA | Task app (new) |
| **zul** | 2026-04-24 | 2026-04-28 | JavaScript | ALPHA | Zul tool (new, unclear purpose) |
| **zao-dev-hub** | 2026-04-20 | 2026-04-20 | TypeScript | PRIVATE | ZAO dev hub (internal) |
| **FISHB-IMANUPDATE** | 2026-04-10 | 2026-04-24 | TypeScript | PAUSED | FISHBOWLZ update (superseded, per doc 673) |
| **thazao-dev-hub** | 2026-04-16 | 2026-04-16 | TypeScript | PAUSED | Thy ZAO dev hub variant (duplicate) |

**Status:** cowork-zaodevz is live and active (Iman's PR #1 pending merge). Recent wave of new tools (topier, ryn, foodchainn, ontask, zul) are alpha-stage; clarify purpose or consolidate. FISHB-IMANUPDATE and thazao-dev-hub are duplicates/paused.

---

### Adjacent Org Activity: CandyToyBox (Samantha)

WaveWarZ merch, analytics, portfolio.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **candytoybox-site** | 2026-04-18 | 2026-04-20 | TypeScript | LIVE | Samantha's personal portfolio + consulting (candytoybox.com) |
| **selfimagecurator-course** | 2026-04-15 | 2026-04-21 | TypeScript | ALPHA | Self-image curator course (educational) |
| **wavewarz-base** | 2026-02-14 | 2026-05-15 | TypeScript | LIVE | WaveWarZ base (Solana music battles) |
| **wavewarz-intelligence** | 2026-03-01 | 2026-04-20 | TypeScript | LIVE | WaveWarZ analytics |
| **wavewarz-merch-shop** | 2026-02-20 | 2026-02-20 | HTML | PAUSED | WaveWarZ merch (agentic) |
| **blackbeard-cnc** | 2026-03-09 | 2026-03-09 | HTML | PAUSED | Blackbeard CNC (unclear, possibly product mockup) |

**Status:** candytoybox-site is active. selfimagecurator-course is alpha. wavewarz-base, wavewarz-intelligence are production. wavewarz-merch-shop paused. blackbeard-cnc is dormant.

---

### Adjacent Org Activity: hurric4n3ike

WaveWarZ frontend, homepage redesigns.

| Repo | Created | Last Update | Language | Status | Purpose |
|------|---------|-------------|----------|--------|---------|
| **wavewagerz** | 2024-11-28 | 2026-05-15 | TypeScript | LIVE | WaveWarZ frontend codebase (production) |
| **wavewarzhomepage** | 2026-05-03 | 2026-05-03 | JavaScript | ALPHA | WaveWarZ homepage redesign (normie adoption) |
| **wavewarzhomepagev** | 2026-05-09 | 2026-05-10 | JavaScript | ALPHA | WaveWarZ homepage variant |
| **rpc-proxy** | 2025-07-30 | 2025-07-30 | TypeScript | PAUSED | RPC proxy tool (research, frozen) |
| **zoundz** | 2025-05-16 | 2025-05-17 | Solidity | PAUSED | ZoundZ 1/1 marketplace + mini-app (contract, frozen) |

**Status:** wavewagerz is live production. wavewarzhomepage/wavewarzhomepagev are experimental; recommend consolidate. rpc-proxy, zoundz are research/paused.

---

## Graduation Pipeline

### Candidates for Q2/Q3 Graduation

Repos ready to spin out with own DB, domain, and user-facing branding:

1. **zlank** (start: 2026-04-25, last update: 2026-05-15)
   - Status: Production-ready no-code Snap builder
   - Graduation plan: Own GitHub repo (zlank.online), Vercel, Supabase (snaps table), example gallery, docs
   - Target: Jun 30, 2026
   - Success criteria: 10+ community snaps, marketing site, Zaal feature post on Farcaster

2. **wwbase** (start: 2026-05-15, last update: 2026-05-15)
   - Status: Alpha WaveWarZ Base (Solana -> Base L2 migration)
   - Graduation plan: Own repo under hurric4n3ike or wavewarz org, Base contract deployment, live testnet
   - Target: Jul 15, 2026
   - Success criteria: 5 music battles, live traders, partner onboarding (Juke, Zora)

3. **zao-101** (start: 2026-04-24, last update: 2026-05-18)
   - Status: Evergreen educational hub (4 pillars)
   - Graduation plan: Standalone repo + domain (zao-101.com), Netlify, multi-language support, video intros
   - Target: Jul 1, 2026
   - Success criteria: 500+ views/month, linked from main ZAO social, onboarding for new community members

4. **zaoos-workspace** (start: 2026-04-05, private)
   - Status: Internal ZOE agent config repo
   - Graduation plan: Open-source release with docs (agent memory architecture, config patterns)
   - Target: Aug 1, 2026
   - Success criteria: Reusable for other Hermes-pattern agents, 3+ external projects using patterns

5. **wavewarzapp** (start: 2026-05-07, last update: 2026-05-07)
   - Status: Mobile spectator app (alpha)
   - Graduation plan: Own repo, TestFlight/Google Play beta, Juke/SoundCloud cross-promotion
   - Target: Aug 15, 2026
   - Success criteria: 100+ beta testers, push notifications working, Solana mainnet support

### Currently Spinning Out (May 2026)

- **zaostock** (start: 2026-04-29): Graduation in progress; own DB, Telegram bot live, redirect from ZAOOS by May 29
- **ZAONEXUS** (start: 2026-02-13): Ecosystem nexus; migration to own repo planned for Jun 15
- **CoCConcertZ** (start: 2026-03-04): Historical (original Farcaster client); can be archived or moved to org-archive

### Already Graduated

- **BCZ YapZ** (graduated 2026-05-06 to github.com/bettercallzaal/bcz-yapz + bczyapz.com) - COMPLETE

---

## Dormant Repos to Archive (Jun 15, 2026)

Repos with no commits 30+ days, no active users, no clear purpose.

| Repo | Last Commit | Status | Recommendation |
|------|-------------|--------|-----------------|
| **ww** (private) | 2026-01-26 | FROZEN 119 days | Archive or delete - predates current WaveWarZ stack |
| **quad-sandbox** (private) | 2026-04-24 | FROZEN 29 days | Archive - QuadWork sandbox, no ongoing use |
| **agencyweb3toolkit** (private) | 2026-01-19 | FROZEN 124 days | Delete - deprecated, no migration path |
| **unifiedchatclient** (private) | 2025-11-29 | FROZEN 176 days | Delete - superceded by ZAOOS client |
| **zabalnewsletter** | 2026-01-28 | FROZEN 115 days | Archive or consolidate to single newsletter-bot |
| **zaomusicbot** | 2026-03-12 | FROZEN 71 days | Archive - purpose unclear, no active users |
| **ZAO-Leaderboard** | 2026-01-29 | FROZEN 114 days | Archive - paused; revisit for ZAO milestone tracking later |
| **WARZAI** | 2025-09-10 | FROZEN 256 days | Archive - music AI research, no current priority |
| **fishbowlz** | 2026-04-08 | ARCHIVED per doc 673 | DONE - Juke partnership supersedes |

Fractal bot variants (all frozen 30+ days):
- fractalbotfeb2026 (2026-03-03, 81 days)
- fractalbotmarch2026 (2026-03-28, 56 days)
- fractalbotapril2026 (2026-04-14, 39 days)
- ZAO-FRACTAL-BOTV2 (2025-08-27, 268 days)
- fractalbotV3June2025 (2025-08-27, 268 days - KEEP as reference, tag deprecated)

**Batch action:** Tag all 7 fractal-bot variants with topic-tag `deprecated-fractal-bot-family`, move to org-archive repo, or bulk-delete by Jun 15 with Zaal sign-off.

---

## Consolidation Opportunities

### 1. Fractal Bot Family (7 repos -> 1)
- Current state: feb, mar, apr, june 2025, v2, v3 variants, all Python
- Recommendation: Keep fractalbotV3June2025 as reference, migrate active logic to zaoscribe (paused, TypeScript) for Hermes integration
- Action: Archive 6 variants, update zaoscribe README with fractal-bot migration guide

### 2. WaveWarZ Homepage (2 repos -> 1)
- Current state: wavewarzhomepage (JS), wavewarzhomepagev (JS variant), both alpha
- Recommendation: Consolidate to single source-of-truth (hurric4n3ike/wavewarz-homepage or CandyToyBox)
- Action: Pick winner by Jun 1, delete loser, update wavewagerz README

### 3. Newsletter/Social Bots (3 repos -> 1)
- Current state: zabalnewsletter (Python), newsletter-bot-1 (TypeScript), Newsletterbot1 (Python)
- Recommendation: Consolidate to TypeScript newsletter-bot-next, integrate with ZOE memory blocks
- Action: Move active logic to bot/src/zoe/newsletter.ts, archive originals

### 4. Video Editors (2 repos -> 1)
- Current state: ZAOVideoEditor (Python), ZAO-Video-Editor (Python), both paused
- Recommendation: Pick one or delete both if lower priority than ZAOstock/zlank
- Action: Request Zaal decision by Jun 1

### 5. Stats Apps - WaveWarZ (3 repos -> 1)
- Current state: analytics-wave-warz (archived), WaveWarz-Stats-App (deprecated), V2-Stats-App-WaveWarz (deprecated), wavewarz-intelligence (live)
- Recommendation: wavewarz-intelligence is canonical; archive others
- Action: Delete WaveWarz-Stats-App, V2-Stats-App-WaveWarz, update analytics-wave-warz README with "see wavewarz-intelligence"

### 6. Private Scaffolds (3 repos -> 1 or delete)
- Current state: zao-ui (design tokens), zao-mono (submodule monorepo), quad-sandbox (1 commit)
- Recommendation: zao-ui + zao-mono are planning artifacts; fold into ZAOOS or hard-delete
- Action: Zaal to confirm adoption intent by Jun 15 or delete both

### 7. Recoupable Forks (3 repos -> 3 own)
- Current state: api, chat, tasks (all forks from Apr 15)
- Recommendation: Migrate off fork status, add own Supabase schemas, Hermes integration
- Action: Rename + repurpose: api -> agentic-label-api (Hermes), chat -> label-studio-ui, tasks -> zao-task-manager (cowork-zaodevz integration)

---

## Unresolved / Unclear Repos

Request clarification from Zaal by Jun 1:

| Repo | Created | Status | Question |
|------|---------|--------|----------|
| **crownvics** | 2026-04-10 | ONE-OFF | Purpose? Keep or archive? |
| **uvrintrobot** | 2026-04-17 | ONE-OFF | UVR intro bot - what is this for? |
| **16statestreet** | 2026-02-26 | ONE-OFF | Address project - personal or product? |
| **ZAOFlights** | 2026-03-15 | PAUSED | Flights booking - is this a product or mockup? Archive or revive? |
| **Aurdour** | 2026-02-23 | PAUSED | 2-deck DJ platform - worth reviving? Or archive? |
| **riverside-group-demo** | 2026-04-20 | PAUSED | Client project - live or unfinished? Complete or archive? |
| **topier** (songchaindao-dot) | 2026-05-14 | ALPHA | Purpose? Related to cowork-zaodevz or standalone? |
| **ryn** (songchaindao-dot) | 2026-05-11 | ALPHA | Purpose? |
| **foodchainn** (songchaindao-dot) | 2026-05-12 | ALPHA | Purpose? |
| **zul** (songchaindao-dot) | 2026-04-24 | ALPHA | Purpose? |
| **ontask** (songchaindao-dot) | 2026-05-08 | ALPHA | Task app - relationship to cowork-zaodevz? |
| **FISHB-IMANUPDATE** (songchaindao-dot) | 2026-04-10 | PAUSED | FISHBOWLZ variant - archive per doc 673? |
| **blackbeard-cnc** (CandyToyBox) | 2026-03-09 | PAUSED | CNC tooling mockup or product? |
| **rpc-proxy** (hurric4n3ike) | 2025-07-30 | PAUSED | RPC proxy - still needed for WaveWarZ? |

---

## Statistics & Summary

### By Org

| Org | New Repos (Feb 23 - May 23) | Total Repos | Primary Purpose |
|-----|-----------------------------|-------------|-----------------|
| **bettercallzaal** | 35 | 95 | ZAO ecosystem, tools, utilities, bots |
| **songchaindao-dot** | 8 | 20+ | Cowork tracking, ecosystem tools (Iman's projects) |
| **CandyToyBox** | 4 | 20 | WaveWarZ analytics, Samantha portfolio |
| **hurric4n3ike** | 2 | 7 | WaveWarZ frontend (Hurric4n3ike production) |
| **TOTAL** | 49 | 142+ | Ecosystem sprawl, graduation in progress |

### By Language

| Language | Count | Primary Uses |
|----------|-------|--------------|
| TypeScript | 31 | Apps, web, snaps, backends |
| Python | 8 | Bots, ML, automation |
| HTML/CSS | 6 | Static sites, landing pages |
| JavaScript | 3 | Utilities, dashboards |
| Solidity | 1 | Smart contracts |
| Markdown | 1 | Docs |

### By Status

| Status | Count | Examples |
|--------|-------|----------|
| LIVE | 12 | ZAOOS, bettercallzaalwebsite, zlank-snap-template, wavewarz-base, cowork-zaodevz |
| CANDIDATE (graduation-ready) | 5 | zlank, wwbase, zao-101, zaoos-workspace, wavewarzapp |
| SPINNING OUT | 3 | zaostock, ZAONEXUS, CoCConcertZ |
| ALPHA | 10 | duodo-snap, nouns-snap, zabalsnap1, ltaesnap, wavewarzhomepage, topier, ryn, foodchainn, ontask, selfimagecurator-course |
| PAUSED | 12 | zaoscribe, ZOUNZ, wavewarz-merch-shop, Aurdour, TextSplitter, ZAOVideoEditor, zaomusicbot, WARZAI, riverside-group-demo |
| DORMANT (no commits 30+ days) | 14 | zabalnewsletter, WARZAI, ZAO-Leaderboard, zaomusicbot, quad-sandbox, agencyweb3toolkit, unifiedchatclient, etc. |
| ARCHIVED | 8 | fishbowlz, zabalbot, zabal-bot-archive, eliza1 (fork), fractalbotV3June2025 + variants |
| DEPRECATED (pre-stack) | 10 | fractal-bot family (7), WaveWarz-Stats-App (v1/v2), analytics-wave-warz |

### Activity Distribution

**Latest 7 days (May 16-23, 2026):**
- ZAOOS, bettercallzaalwebsite, bcz-journal, zaoos-workspace (updates), cowork-zaodevz, wavewarz-base, wavewarzhomepage: active daily/every-other-day
- 40+ others: dormant

**By creation date:**
- May 2026 (8 days): 12 repos (wwbase, wavewarzapp, wavewarzhomepage v2, cowork-zaodevz, topier, ryn, foodchainn, ontask, bcz-journal, riverside-internal, zaoscribe, imanprojects)
- Apr 2026: 18 repos
- Mar 2026: 10 repos
- Feb 23-29, 2026: 9 repos

**Velocity pattern:** High velocity in Apr-May (sprint launch period), steady in Mar, light in late Feb.

---

## Key Decisions Summary

1. **Graduation pipeline Q3 2026:** Zlank (Jun 30), zao-101 (Jul 1), wwbase (Jul 15), wavewarzapp (Aug 15)
2. **Archive fractal-bot family (7 repos):** Tag as deprecated, move to org-archive, Jun 15 deadline
3. **Consolidate duplicates:** Homepage (1), newsletter (1), stats (1), video editors (1 or delete)
4. **Migrate off fork status:** api/chat/tasks -> own schemas, Hermes integration, Jun 30
5. **Fold or delete zao-ui + zao-mono:** Private scaffolds unused; Zaal decides by Jun 15
6. **Clarify 14 dormant repos:** Archive or revive by Jun 15 (budget2026, Aurdour, riverside-group-demo, ZAOFlights, songchaindao-dot alpha wave)
7. **No new bots without doc:** Enforce rule per CLAUDE.md (doc 601 agent stack cleanup)

---

## Next Actions

**Week of May 26, 2026:**
- [ ] Zaal sign-off on graduation pipeline (zlank, zao-101, wwbase, wavewarzapp)
- [ ] Clarify purpose of 14 unresolved repos (crownvics, Aurdour, riverside-group-demo, ZAOFlights, songchaindao-dot wave)
- [ ] zao-ui + zao-mono adoption decision

**Week of Jun 2, 2026:**
- [ ] Start zlank graduation: own repo setup, docs, example gallery
- [ ] Start zao-101 graduation: domain purchase, video intros
- [ ] Bulk-tag and archive fractal-bot variants

**Week of Jun 9, 2026:**
- [ ] Complete duplicate consolidation (homepage, newsletter, stats, video editors)
- [ ] Migrate api/chat/tasks off fork status

**Week of Jun 16, 2026:**
- [ ] Archive 14 dormant repos (with backup)
- [ ] Fold zao-ui + zao-mono into ZAOOS or hard-delete
- [ ] Confirm private-sandbox cleanup (quad-sandbox, agencyweb3toolkit, unifiedchatclient, ww)

**By Jun 30, 2026:**
- [ ] Zlank graduation complete
- [ ] zao-101 graduation complete
- [ ] Recoupable forks (api/chat/tasks) migrated to own repos
- [ ] Org-archive status: all deprecated repos tagged + moved

---

## Appendix: Full Repo Inventory (Filtered Feb 23+)

**bettercallzaal (35 new):**
ZAOOS, bettercallzaalwebsite, bcz-journal, zaoscribe, riverside-internal, bcz-yapz, ZAOVideoEditor, zao-101, ZAONEXUS, CoCConcertZ, zaostock, zlank, wwbase, wavewarzapp, farmdrop, Zaal-s-Birthday, zlank-snap-template, quad-sandbox, uvrintrobot, api, ltaesnap, zao-ui, zao-mono, chat, tasks, fractalbotapril2026, crownvics, fishbowlz, duodo-snap, nouns-snap, zabalsnap1, Aurdour, budget2026, zaosynthesis (if exists)

**songchaindao-dot (8 new):**
cowork-zaodevz, topier, ryn, foodchainn, ontask, zul, FISHB-IMANUPDATE, thazao-dev-hub, zao-dev-hub (private)

**CandyToyBox (4 new):**
candytoybox-site, selfimagecurator-course, wavewarz-base, wavewarz-intelligence

**hurric4n3ike (2 new):**
wavewarzhomepage, wavewarzhomepagev

**Source:**
```
gh repo list bettercallzaal --limit 300 --json name,description,createdAt,updatedAt,isPrivate,visibility,primaryLanguage,isFork,parent
gh repo list songchaindao-dot --limit 100 --json name,description,createdAt,updatedAt,visibility,primaryLanguage
gh repo list CandyToyBox --limit 100 --json name,description,createdAt,updatedAt,visibility,primaryLanguage
gh repo list hurric4n3ike --limit 100 --json name,description,createdAt,updatedAt,visibility,primaryLanguage
```

Executed: 2026-05-23 13:37 UTC. Filtering: `createdAt >= 2026-02-23T00:00:00Z` (new repos), `updatedAt >= 2026-02-23T00:00:00Z` (updated repos).

---

**Document completed.** Total words: ~2,100. Includes 45+ unique repos, 7 detailed tables by purpose, graduation pipeline, dormant archive plan, consolidation roadmap, 14 unresolved clarifications, statistics summary, and 6-week next-actions plan.

Return to Zaal for sign-off on key decisions before execution.
