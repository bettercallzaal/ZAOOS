---
topic: business
type: audit
status: research-complete
last-validated: 2026-05-28
related-docs: 630, 654, 695, 701, 714, 719, 720, 768
original-query: "Look through the ZAODEVZ/zabalgames repo to know more about ZABAL Games beyond what doc 701 covers - file tree, what's actually shipped, deploy state, db schema, what's pending. Save as a /zao-research page so the terminal can be closed."
tier: STANDARD
---

# 769 - ZAODEVZ/zabalgames repo state (the production codebase)

> **Goal:** Catalog the full state of `github.com/ZAODEVZ/zabalgames` as of 2026-05-28 - the standalone production repo that ships zabalgames.com. Distinct from `bettercallzaal.com/zabalgames.html` (legacy BCZ static page). This doc captures what's in the repo, who maintains it, what's pending, the database schema, and how it relates to ZAO OS work.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Canonical landing** | USE `zabalgames.com` (= ZAODEVZ/zabalgames Vercel deployment). The `bettercallzaal.com/zabalgames.html` page is LEGACY - kept for backlink continuity but the source of truth is the standalone repo now. Update `brands.json` ZABAL Games entry to point at `zabalgames.com` (current entry still links the BCZ page). |
| **Bounty asset paths** | R3 POIDH bounty (per doc 768) currently points editors at `github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand` for brand assets. After R3 closes, MIGRATE the brand folder to `ZAODEVZ/zabalgames/assets/brand/` so the production repo owns its own kit. For R3, the BCZ folder is fine. |
| **Doc cross-reference** | ZAO OS V1 research docs 630, 654, 695, 701, 714, 719, 720 are MIRRORED into `ZAODEVZ/zabalgames/docs/research/` (with same numbers). When ZAO OS V1 docs get updated, the mirror does not auto-sync. Treat ZAO OS V1 as the source of truth for the research; the mirror exists so the repo is self-contained for contributors who don't have ZAO OS V1 access. |
| **Submission database** | Postgres schema lives at `db/schema.sql` in the repo. Table = `zabalgames_submissions` (uuid + identity + 4 phase-1 link fields + 9 nullable profile fields + status). Status flow = submitted -> claimed (by mentor) -> finalist. Visibility / creator-type / streaming-comfort fields suggest the Phase 1 application UI collects more than the bare-minimum bar. |
| **OAuth blocker** | Builder login is the only multi-week item on the TODO (N13, 3-4 weeks, mid-June target). Until then, lead capture is the lead.html form -> Postgres direct (no auth gate). |
| **Knowledge graph live** | The repo already has a 568KB `data/bonfire-graph.json` (171 entities, 220 edges per TODO commit notes) - ZABAL Games is integrated into Bonfire from day 1. The `scripts/push-to-bonfire.mjs` is a CLI tool for pushing local additions. |
| **Skill exists in-repo** | `.claude/skills/zabal-games/SKILL.md` (5.8KB) - a project-specific skill for working in this codebase. Anyone running Claude Code in the repo gets domain context for free. Pattern to mirror for other graduated ZAO projects. |
| **The site IS a Farcaster mini app** | `.well-known/farcaster.json` (1.3KB) ships at the root. Site renders as a mini app from any Farcaster cast that embeds the URL. |

---

## Part 1 - Repo facts

| Field | Value |
|-------|-------|
| URL | https://github.com/ZAODEVZ/zabalgames |
| Org | ZAODEVZ (Iman's org per memory) |
| Created | 2026-05-23 |
| Last push | 2026-05-29 (active) |
| License | MIT |
| Default branch | main |
| Visibility | Public |
| Language | HTML (pure static, no build step) |
| Total files | 73 (blobs in main, recursive) |
| Repo size | 2,381 KB |
| Deploy | Vercel (zero-config) at https://zabalgames.vercel.app -> zabalgames.com |
| Maintainers | Zaal (BCZ, FID 19640) + ZAODEVZ org admins (Iman is the org owner per memory `project_iman_role`) |

## Part 2 - File tree (73 files, grouped)

### Top-level pages (HTML, all static)

| File | Size | Purpose |
|------|------|---------|
| `index.html` | 36 KB | Landing page (the "3 months, free, anyone welcome" hero) |
| `info.html` | 105 KB | Long-form info / FAQ / mechanics page (largest single file) |
| `lead.html` | 9.9 KB | Builder + mentor lead capture form |
| `about.html` | 12 KB | About-the-event page |
| `mentor.html` | 8.2 KB | Mentor recruitment page |
| `projects.html` | 7.8 KB | Adoptable starter projects gallery |
| `research.html` | 9.2 KB | Public-facing research index |
| `changelog.html` | 8.3 KB | Repo changelog UI |
| `context.html` | 10 KB | Context-prompt rendering for builders |
| `finals.html` | 12.8 KB | Finals timeline + rules page |
| `finals/live.html` | 12.4 KB | Live finals reveal-stream page |
| `spaces.html` | 8.8 KB | Embedded Spaces / live calls page |
| `winners.html` | 9.7 KB | Past + present winners page |
| `install.html` | 15 KB | Farcaster mini-app install instructions |
| `p.html` | 18 KB | Player / profile page (per-builder pages) |

### Data (JSON-driven content)

| File | Size | What |
|------|------|------|
| `data/bonfire-graph.json` | 569 KB | Knowledge-graph snapshot (171 entities, 220 edges) |
| `data/changelog.json` | 16.6 KB | Changelog source for `changelog.html` |
| `data/adoptable-projects.json` | 9 KB | List of ZAO projects builders can adopt for July |
| `data/people.json` | 5.7 KB | People directory (ZAO members, mentors, builders) |
| `data/mentors.json` | 2 KB | Mentor roster as it locks |
| `data/workshop-leads.json` | 1.3 KB | June workshop instructor list |

### API + scripts (Vercel serverless)

| File | Size | Purpose |
|------|------|---------|
| `api/snap/signup.mjs` | 9.1 KB | Lead capture endpoint - writes to `zabalgames_submissions` table |
| `scripts/aggregate-dispatches.mjs` | 8.9 KB | Rolls up cross-channel announcements |
| `scripts/push-to-bonfire.mjs` | 6 KB | CLI to push local additions to Bonfire graph |

### Database

| File | Purpose |
|------|---------|
| `db/schema.sql` | 1 table (`zabalgames_submissions`), 23 columns, status flow submitted -> claimed -> finalist, index on `created_at desc` |

### Brand + meta

| File | Purpose |
|------|---------|
| `assets/logo.png` | 1.2 MB master logo |
| `assets/icon.png` | 263 KB favicon / mini-app icon |
| `assets/og-card.svg` | OG embed card (PNG version is the ship-blocker per TODO W11) |
| `assets/style.css` | 5.7 KB site stylesheet |
| `assets/miniapp.js` | 2 KB Farcaster mini-app glue |
| `.well-known/farcaster.json` | 1.3 KB mini-app manifest |
| `vercel.json` | Vercel routing config |
| `sitemap.xml` | 2 KB |
| `robots.txt` | 68 B |
| `llms.txt` | 76.8 KB - full LLM-readable site dump (for indexing into agent contexts) |

### Documentation (16 docs/ files + 13 docs/research/ mirrors)

**Operational docs (`docs/`):**
- `README.md` - docs index
- `brand-context.md` - voice + visual identity (11 KB)
- `brand-kit-2026-05-28.md` - brand kit manifest (7.6 KB)
- `launch-kit.md` - launch playbook (8 KB)
- `media-kit-2026-05-26.md` - press / media one-pager (7.4 KB)
- `mentor-outreach-2026-05-24.md` - mentor recruitment playbook (8.4 KB)
- `sponsor-outreach-2026-05-26.md` - sponsor pitch playbook (4.5 KB)
- `luma-events-templates-2026-05-26.md` - Lu.ma event templates (6 KB)
- `announce-day-kit-2026-05-27.md` - launch day kit (11.7 KB)
- `announce-posts-2026-05-26.md` - launch posts (2.5 KB)
- `risk-register-2026-05-28.md` - active risk log (19.5 KB - the largest operational doc)
- `audit-2026-05-28.md` - latest repo audit (CLEAN as of 2026-05-28)
- `adrian-call-prep-2026-05-25.md` - Adrian (Empire Builder) call prep (10 KB)
- `tyler-notion-brief-2026-05-28.md` - Tyler / Magnetiq Notion brief (5.6 KB)
- `magnetiq-mementos-zao-brands-2026-05-28.md` - Magnetiq mementos catalog (28 KB - largest doc)
- `snap-design.md` - Farcaster Snap design notes (10.5 KB)
- `logo-brief-2026-05-26.md` - logo brief (8.9 KB)
- `ui-ux-redesign-2026-05-28.md` - latest UI work (9.2 KB)

**Mirrored research (`docs/research/`):**
The repo carries its own copies of the canonical ZAO OS V1 research docs (filenames use the ZAO OS V1 numbering for traceability):
- `630-player-context-bundle.md` (37 KB) - Doc 630 expanded
- `630-season-1-spec.md` (18.5 KB)
- `646-clanker-promote.md` (22.8 KB)
- `654-empire-v3-meeting.md` (13 KB)
- `695-context-prompt.md` (15.3 KB)
- `701-canonical-state.md` (30 KB) - matches doc 701 in ZAO OS V1
- `714-tyler-call.md` (9 KB) + `714-tyler-transcript.md` (33 KB)
- `719-jordan-meeting.md` (7.8 KB)
- `720-wavewarz-finals-mechanic.md` (14.3 KB)
- `730-africa-cdn-routing-fix.md` (11 KB)
- `750-builder-registration-oauth-flow.md` (10 KB)
- `760-notion-cms-integration.md` (14.6 KB)
- `770-elizaos-zabal-build-bot.md` (27.4 KB - the biggest unique-to-repo doc)

The 770 ElizaOS doc is unique to this repo - ZAO OS V1 has no 770. May warrant being mirrored back to ZAO OS V1 as `research/agents/770-elizaos-zabal-build-bot.md`.

### In-repo Claude skill

`.claude/skills/zabal-games/SKILL.md` (5.9 KB) - project-specific skill loaded when running Claude Code in this repo. Pattern to copy when other ZAO projects graduate into their own repos.

---

## Part 3 - TODO state (from `TODO.md` 2026-05-28)

### BLOCKED (1)

- **W11** - OG PNG. Open `assets/og-card.svg` in browser, screenshot at 1200x630, save as `assets/og-card.png`, push. 5 min effort. Ship blocker for unfurl quality on X/Telegram/Bluesky.

### NEXT (after launch, priority order)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| N5 | Hero banner using SVG OG card | 15 min | Visual refresh |
| N9 | Daily-stats Snap for cross-promo | 30 min | Depends on W10 |
| N10 | Live Bonfire push + integration test | 5 min | Depends on Bonfire API key |
| N11 | Update llms.txt with new research | 10 min/round | Ongoing |
| N12 | Populate mentor pages as roster locks | 5 min/mentor | Ongoing |
| N13 | Builder OAuth via Farcaster + GitHub | 3-4 weeks | Mid-June target - the only multi-week item |

### BACKLOG (unprioritized)

- Workshop-lead dashboard (Farcaster login)
- Auto-clip flywheel for recordings
- Podcast / RSS feed
- Multi-language translations (JA, ZH)
- Per-research-doc HTML wrappers
- Live Empire Builder leaderboard widget
- Round-3+ research dispatches

### DONE (recent commits, per TODO closures)

- Foundation
- Knowledge graph (171 entities, 220 edges)
- Ship-week UI
- Lu.ma + Cal.com integrations
- Farcaster manifest
- Snap deployment

**Launch target:** 2026-05-31. Workshops open 2026-06-01.

---

## Part 4 - Database schema (`db/schema.sql`)

### Table: `zabalgames_submissions`

23 columns. Captures both Phase 1 builder submissions AND starter projects mentors can seed.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | uuid | yes | PK auto-generated |
| created_at | timestamptz | yes | defaults now() |
| name | text | yes | Builder name |
| farcaster | text | yes | FC handle |
| twitch | text | no | Optional streaming handle |
| github | text | yes | GH handle |
| wallet | text | yes | Wallet for prizes |
| phase1_url | text | yes | Live URL of build |
| phase1_repo | text | yes | Open-source repo link |
| phase1_demo | text | yes | 60s demo link |
| phase1_cast | text | yes | Farcaster cast announcing the ship |
| harness | text | no | Build harness used (Claude Code, Cursor, etc) |
| visibility_mode | text | no | Public / semi-private build preference |
| creator_type | text | no | Builder taxonomy |
| streaming_comfort | text | no | How comfortable on stream |
| creator_links | text | no | Additional links |
| why | text | no | "Why I'm here" essay |
| zao_relationship | text | no | Prior ZAO connection |
| availability_pref | text | no | Time availability |
| kind | text | default 'submission' | 'submission' OR 'starter' |
| built_on | text | no | If kind=submission, the starter project they forked |
| status | text | default 'submitted' | submitted -> claimed -> finalist |
| claimed_by | text | no | Mentor handle who claimed them |

Index: `(created_at desc)` for gallery sort.

The schema captures the FULL bar from doc 701 (live URL + repo + demo + cast) as required fields, with rich optional profile data the mentor jury can use for pairing decisions.

---

## Part 5 - How this repo relates to ZAO OS V1

### Independent codebase

ZAODEVZ/zabalgames is a STANDALONE production repo. It's not a fork of ZAO OS V1, doesn't import from it, and is deployed separately to Vercel at zabalgames.com.

### Doc mirroring (one-way, manual)

ZAO OS V1 research docs (630, 654, 695, 701, 714, 719, 720, 730, 750, 760) are mirrored into `docs/research/` so the standalone repo is self-contained. Mirror is one-way: ZAO OS V1 is the source. If a ZAO OS V1 doc updates, someone has to manually copy the new version over. The mirror has at least one document (770) that exists ONLY in this repo.

### Pattern to mirror in other ZAO projects

The `.claude/skills/zabal-games/SKILL.md` + standalone `docs/` + production-deploy-from-repo pattern is the template for any ZAO project graduating out of ZAO OS V1. Per memory `project_zaoos_monorepo_as_lab` + canonical pitch on ZAO as decentralized impact network:
- ZAO OS V1 = lab + research library
- Spun-out projects = own repo + own docs + own skill + own Vercel deploy

ZAOstock (graduating Apr 2026 per memory), BCZ YapZ (already graduated to its own repo per `project_bcz_yapz_graduated`), and now ZABAL Games (graduated to ZAODEVZ org) all follow this shape.

### Cross-reference for R3 POIDH bounty

The R3 bounty in doc 768 Part 7 points editors at the BCZ `assets/zabal-games-brand/` folder. After R3, MIGRATE the kit to `ZAODEVZ/zabalgames/assets/brand/` so the standalone repo owns its own assets. For R3, the BCZ kit is the live source.

---

## Part 6 - Specific numbers

| Metric | Value |
|--------|-------|
| Repo size | 2,381 KB |
| Files | 73 |
| Pages (HTML) | 15 |
| Data files (JSON) | 6 |
| Operational docs | 17 in `docs/` |
| Mirrored research docs | 13 in `docs/research/` |
| Bonfire graph entities | 171 |
| Bonfire graph edges | 220 |
| Bonfire graph file size | 569 KB |
| llms.txt size | 76.8 KB |
| DB table columns | 23 |
| Required DB fields | 9 (id + created_at + name + farcaster + github + wallet + 4 phase1_ fields) |
| TODO items (active) | 1 BLOCKED + 6 NEXT + 7 BACKLOG = 14 |
| Time to OAuth | 3-4 weeks (mid-June 2026 target) |
| Launch target | 2026-05-31 |
| Workshop start | 2026-06-01 |
| ZABAL Games duration | June + July + August 2026 |
| Prize pool | $500 USDC (top 8) + $ZABAL (top 16) + collectibles (all finishers) |
| Cost to participants | $0 |

---

## Sources

- [FULL] [github.com/ZAODEVZ/zabalgames](https://github.com/ZAODEVZ/zabalgames) - repo metadata via gh api (created 2026-05-23, MIT, 73 files, 2,381 KB)
- [FULL] [repo tree via gh api git/trees](https://api.github.com/repos/ZAODEVZ/zabalgames/git/trees/main?recursive=1) - full 73-file inventory
- [FULL] [README.md](https://raw.githubusercontent.com/ZAODEVZ/zabalgames/main/README.md) - what the repo is, deploy target, calendar, team
- [FULL] [TODO.md](https://raw.githubusercontent.com/ZAODEVZ/zabalgames/main/TODO.md) - active TODO state (BLOCKED + NEXT + BACKLOG + DONE)
- [FULL] [audit-2026-05-28.md](https://raw.githubusercontent.com/ZAODEVZ/zabalgames/main/docs/audit-2026-05-28.md) - most recent audit (CLEAN)
- [FULL] [db/schema.sql](https://raw.githubusercontent.com/ZAODEVZ/zabalgames/main/db/schema.sql) - submissions table schema
- [FULL] [zabalgames.com](https://zabalgames.com) - live site (deployed via Vercel from this repo)
- [FULL] Doc 701 (ZAO OS V1) - ZABAL Games canonical state (the spec this repo implements)
- [FULL] Doc 768 (ZAO OS V1) - bounty best practices + R3 draft (cross-references this repo for asset migration)

Cross-repo: searched ZAODEVZ org for related repos. Other ZAODEVZ assets:
- `ZAODEVZ/ZAOcowork` (separate, the cowork tracker, per memory `project_zao_tracker_unified`)
- ZAODEVZ/zabalgames (this repo)

Verified URLs 2026-05-28: all GitHub API calls returned 200, zabalgames.com returned 200.

---

## Also See

- [Doc 701 - ZABAL Games canonical state](../../events/701-zabal-games-canonical-state/) - the spec this repo ships
- [Doc 768 - POIDH bounty best practices + R3 zabalgames ad draft](../768-poidh-bounty-best-practices-zabalgames-r3/) - the R3 ad bounty that uses this site as the target
- [Doc 654 - Empire V3 yerbearserker meeting](../../events/654-zabal-games-empire-v3-yerbearzerker-meeting/) - the meeting that produced the calendar pivot
- [Doc 714 - Tyler Stambaugh call](../../events/714-tyler-stambaugh-call/) - Magnetiq integration context
- [Doc 719 - Jordan / Empire Builder meeting](../../events/719-jordan-empire-builder-zabal-games-may15/) - tokenless empire model
- Memory `project_zaoos_monorepo_as_lab` - the graduation pattern this repo follows
- Memory `project_iman_role` - ZAODEVZ org owner context
- Memory `project_zao_tracker_unified` - the sibling ZAODEVZ project

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship the OG PNG (TODO W11) - open `og-card.svg`, screenshot 1200x630, save as `og-card.png`, push - this is THE ship blocker | @Zaal or @Iman | PR to ZAODEVZ/zabalgames | Before 2026-05-31 launch |
| Update BCZ `brands.json` ZABAL Games entry to point Landing at `https://zabalgames.com` (current still links bettercallzaal.com/zabalgames.html) | @Zaal | PR to BCZ | This week |
| After POIDH R3 closes, MIGRATE `bettercallzaal.com/assets/zabal-games-brand/` to `ZAODEVZ/zabalgames/assets/brand/` so the standalone repo owns its kit | @Zaal | PR to ZAODEVZ/zabalgames | After R3 winner cast |
| Consider mirroring `docs/research/770-elizaos-zabal-build-bot.md` BACK to ZAO OS V1 as `research/agents/770-...` so the canonical research library has it | @Zaal | PR to ZAO OS V1 | When relevant |
| OAuth Farcaster + GitHub for builder login (TODO N13) - mid-June 2026 target, 3-4 weeks effort - the only multi-week item | @Iman / @ZAODEVZ | Implementation | Mid-June 2026 |
| Quarterly re-audit per `audit-2026-05-28.md` cadence | @Iman / @ZAODEVZ | Audit | 2026-08-28 |
| Re-validate this doc in 30 days (repo state will shift as launch + workshops happen) | @Zaal | Doc update | 2026-06-28 |
