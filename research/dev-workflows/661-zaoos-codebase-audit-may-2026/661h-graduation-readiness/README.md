---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 547, 601, 610, 661
tier: STANDARD
parent-doc: 661
---

# 661h - Graduation-Readiness Audit

Lab audit of every distinct thing currently in ZAOOS monorepo against three graduation dimensions: production-ready (tests, no critical TODOs, no exposed secrets), public-share-ready (LICENSE, README, clean git), new-user-attracting (story, on-ramp, marketing). Scores assign verdicts: GRADUATE NOW / GRADUATE NEXT QUARTER / NEEDS-WORK / DELETE / KEEP-IN-LAB.

## Lab Inventory

| Thing | Lives at | Prod-ready? | Share-ready? | User-ready? | Verdict | Blocker |
|---|---|---|---|---|---|---|
| **ZAOOS Farcaster Client** (original) | `src/app/(auth)`, `src/components/chat/home/community` (24 components, 12 API routes) | PARTIAL: 0/38 tests, no critical TODOs, 324 API routes ship | NO: no LICENSE, no top-level README | PARTIAL: story exists (gated community client) but no public-facing landing | KEEP-IN-LAB | 38 tests needed, clean build proof, public onboarding doc |
| **ZAOstock 2026** | `src/app/stock/` (63 files), `bot/src/teams/` (10 files + @ZAOstockTeamBot) | YES: stable, last commit e9903912 (doc 604), 0 critical blockers | PARTIAL: has README scripts/stock-archive/ but no top-level public doc | NO: team dashboard is internal-only, no external story/landing | GRADUATE NEXT QUARTER | Spinout repo + DB ready (PR #480 pattern), public site/branding needed, own domain (stock.zao.com?), redirect routes from ZAOOS |
| **ZOE Agent Stack** | `bot/src/zoe/` (23 .ts files), 4-block Letta memory | YES: actively deployed @zaoclaw_bot, 5am brief shipped (PR #539) | NO: no LICENSE, no README | PARTIAL: Telegram-native story known internally | KEEP-IN-LAB | Agent runners live in bot/ not src/, stays proprietary until graduation doc written |
| **Hermes Auto-PR Pipeline** | `bot/src/hermes/` (11 .ts files), coder+critic+PR-auto | YES: shipped, doc 607 three-bot model | NO: no README, integration docs only | NO: specialized internal tool, not user-facing | KEEP-IN-LAB | Not a product, stays in lab as operational infra |
| **ZAO Devz (@zaodevz_bot)** | `bot/src/devz/` (4 .ts files), group dispatch | YES: working, pending Phase 3 fold into Hermes | PARTIAL: doc 601 explains model | NO: internal group tool | KEEP-IN-LAB | Merge into Hermes per doc 601, then delete from lab |
| **Music Player + NFT** | `src/components/music/` (30+), `src/providers/AudioPlayer.tsx`, `src/app/api/music/` (39 routes) | PARTIAL: 0/38 tests, AudioPlayer.tsx no TODOs but 78 files total | NO: no public README, no license | PARTIAL: component library exists but no standalone story | NEEDS-WORK | Test coverage needed, separate docs for reusable patterns (Sonata/Herocast reference), consider standalone package or graduate as music.zao.com micro-app |
| **Spaces (Live Audio)** | `src/app/spaces/`, `src/components/spaces/` (61 files), HMS integration | PARTIAL: last commit b967d95d (Apr 24), no critical TODOs | NO: no README, HMS token handling documented only in code | PARTIAL: feature story known but no external landing | NEEDS-WORK | Tests needed, HMS credential strategy doc, user onboarding guide, consider own branded domain (spaces.zao.com) |
| **Governance / Respect / Hats** | `src/components/governance/`, `src/components/respect/`, `src/components/hats/` (15 files) | PARTIAL: no tests found, minimal active dev | NO: scattered across 3 subdirs, no consolidated README | NO: internal voting/credentialing tools | KEEP-IN-LAB | Research-only until community governance roadmap solidifies |
| **FISHBOWLZ** | `src/app/fishbowlz/`, `src/components/fishbowlz/` (5 files) | NO: paused 2026-04-16, killed 2026-05-04 per CLAUDE.md | N/A | N/A | DELETE | Partnership pivoted to Juke (nickysap) Farcaster audio client. Remove src/app/fishbowlz/, src/components/fishbowlz/, redirect /fishbowlz → juke.xyz |
| **POIDH Integration** | grep shows 0 references in src/ | N/A | N/A | N/A | DELETE | No implementation, live only at poidh.xyz. Remove from future planning. |
| **Empire Builder V3 + ZABAL** | `src/app/api/empire-builder/` (snapshot route), `src/lib/empire-builder/` | PARTIAL: snapshot route working, ZABAL token integrated | NO: no top-level README | PARTIAL: integrated into ecosystem but no standalone story | KEEP-IN-LAB | External product (empirebuilder.world). ZAOOS integration is read-only; stays in lab as context sink |
| **ZOUNZ + Streaks** | `src/components/zounz/`, `src/components/streaks/`, `src/app/api/` (10 files) | PARTIAL: no test coverage | NO: no README | PARTIAL: incentive/contribution tracking, not user-facing | KEEP-IN-LAB | Research-only until contribution model shipping decision |
| **Bounty Board** | `contracts/` (Solidity), grep shows 2 references | PARTIAL: smart contracts exist, API integration minimal | NO: no public contract ABIs published | NO: internal tool only | KEEP-IN-LAB | Wait for on-chain activation decision. Research doc needed before graduation. |
| **Pixel Agents** | Referenced in config (pixels.zaoos.com), external service | N/A | External | N/A | KEEP-IN-LAB (External) | Not a ZAOOS product; external service link only. |
| **Miniapp Frame / OG** | `src/app/miniapp/`, `src/app/og/` (4 files) | PARTIAL: simple pages, no test coverage | PARTIAL: linked in config | PARTIAL: Farcaster frame scaffold | NEEDS-WORK | Miniapp strategy doc needed. Define: is this a pattern library or a standalone product? If standalone, ship own repo/domain. If pattern, document + examples. |
| **Portal (Team Directory)** | `src/app/portal/`, `src/components/portal/` | PARTIAL: mostly UI, no tests | PARTIAL: internal wiki at portal.zaoos.com | NO: team roster directory, not customer-facing | KEEP-IN-LAB | Use for admin/member tools; stay in lab until public member search feature ships |
| **Admin / Moderation** | `src/components/admin/` | PARTIAL: internal tools only | N/A | N/A | KEEP-IN-LAB | Internal operations surface; never graduates |
| **Publish (Cross-Post)** | `src/lib/publish/` (utilities) | YES: ships to Farcaster/X/Bluesky per CLAUDE.md | PARTIAL: internal patterns | PARTIAL: used by ZOE/Hermes | KEEP-IN-LAB | Core infrastructure, stays in lab as shared library |

## Immediate Graduation Candidates

**NONE.** ZAOstock is closest but blocked on spinout infrastructure (own repo/DB/domain), which is already scoped (PR #480 pattern for BCZ YapZ). Other candidates need either infrastructure work (Music, Spaces) or strategic decisions (Miniapp, Governance).

## Next-Quarter Candidates

### ZAOstock 2026 (1-2 weeks once spinout infra ready)

- **Spinout to:** github.com/bettercallzaal/zaostock (or zaofestivals/zaostock)
- **Database:** Own Supabase project (documented in PR #477)
- **Domain:** stock.zao.com or zaostock.co
- **Code deletion:** `src/app/stock/` (40 components), `bot/src/teams/` (10 files)
- **Redirect strategy:** Keep `/stock` route, redirect to new domain + 301 to live events page
- **Blockers:** Verify spinout scripts in `scripts/zaostock-spinout/` are current; test data migration

### Music Player as Standalone Package (2 weeks, depends on architecture decision)

- **Option A (Micro-app):** own domain music.zao.com, own repo, npm package for reuse
- **Option B (Research library):** stay in ZAOOS, publish research doc on patterns (Sonata, Herocast ports)
- **Recommendation:** Option A. Music is ZAOOS's heaviest subsystem (39 API routes, 30+ components). Decoupling reduces main build size, enables shared code across WaveWarZ + COC Concertz + future music products
- **Blockers:** Test coverage, AudioPlayer refactor to drop app-specific deps

### Spaces (Live Audio Rooms) (2-3 weeks)

- **Spinout to:** own repo, spaces.zao.com
- **Database:** Use ZAO OS DB (read-only Sessions table for gating)
- **Dependencies:** 100ms SDK (HMS). Clean HMS token strategy + env var docs
- **Blockers:** User onboarding guide, test coverage (currently 0), public landing page

## Delete-Instead-Of-Graduate

### FISHBOWLZ (Immediate)

- **Why:** Paused 2026-04-16, killed 2026-05-04 per CLAUDE.md. Partnership pivoted to Juke (nickysap) Farcaster audio client.
- **Action:** `git rm src/app/fishbowlz/ src/components/fishbowlz/` (9 files)
- **Redirect:** `/fishbowlz` → `https://juke.xyz` (or remove route entirely)
- **Timeline:** Next PR
- **Rationale:** Dead experiment. No retention signal. Don't carry forward.

### POIDH Integration (Immediate)

- **Why:** 0 code references in src/. Live only externally at poidh.xyz. Integration was planned, never shipped.
- **Action:** Remove from future roadmap. POIDH stays external.
- **Timeline:** Housekeeping in next research doc

### Miniapp Frame (Clarify or Delete, 1 week)

- **Blocker:** Is this a Farcaster frame pattern library or a product? If pattern, document + stay in lab. If product, need shipping decision + domain.
- **Recommendation:** Write doc 662 "Miniapp Frame Strategy" before any code change. If no decision, delete.

## Keep-In-Lab (Still Experimenting)

- **ZOE, Hermes, ZAO Devz** (Agent stack) - Active, owned, strategic. Stay in lab until graduation criteria met (docs, standalone runner, CLI)
- **Governance/Respect/Hats** - Community voting/credentialing research. Stays until governance roadmap locks
- **Bounty Board (Contracts)** - Smart contracts exist, integration minimal. Wait for on-chain activation roadmap
- **ZOUNZ/Streaks** - Contribution tracking research. Stay until contribution model ships
- **Portal** - Internal team directory. Stays in lab unless public member search ships
- **Publish utilities** - Shared infrastructure (Farcaster/X/Bluesky posting). Core lib, never graduates
- **Empire Builder Integration** - External service sink. Stay in lab as read-only integration example

## Recommended Actions (P0/P1/P2)

### P0 (This Week)

- **Delete FISHBOWLZ** (9 files): `git rm src/app/fishbowlz/ src/components/fishbowlz/` + route redirect. Owner: Zaal. Est: 30 min
- **Clean POIDH references** (grep): Remove from future docs/config. Owner: Zaal. Est: 15 min

### P1 (Next 2 Weeks)

- **Write doc 662 "Miniapp Frame Strategy":** Is it pattern or product? Stay or go? Owner: Zaal + Claude Code. Est: 1 session
- **Verify ZAOstock spinout scripts:** Check `scripts/zaostock-spinout/` against PR #480 (BCZ YapZ) for completeness. Owner: Claude Code (research). Est: 2 hours
- **Run test coverage report:** `npm run test -- --coverage src/components/music src/app/spaces` - identify gaps for graduation blocking. Owner: Claude Code. Est: 1 hour

### P2 (Next Month)

- **Music Player refactor roadmap:** Define Option A vs B, write doc 663 "Music as Standalone Product". Owner: Zaal + team. Est: planning session
- **Spaces onboarding guide:** Screenshot walkthrough + HMS token setup doc. Owner: Claude Code. Est: 4 hours
- **Graduation checklists per product:** Create sub-docs under 661 for each candidate (ZAOstock, Music, Spaces). Template: prod-ready, share-ready, user-ready, blockers, dates. Owner: Claude Code. Est: 8 hours total

## Lab Hygiene

**Decommissioned (do NOT restart per CLAUDE.md 2026-05-04):**
- openclaw container + 7-agent squad
- Composio AO orchestrator
- ZOE v2 / Agent Zero migration
- 10-bot branded fleet (folds into ZOE memory blocks)
- FISHBOWLZ (paused, now killed)

**Never create new bots without doc:** Per CLAUDE.md, any new Telegram bot or autonomous loop requires numbered research doc + Zaal approval. New brand voices go to `bot/src/zoe/` memory blocks, not separate bots.

## Summary

- **Ready now:** None. ZAOstock closest but needs spinout infrastructure.
- **Ready next quarter:** ZAOstock (1-2 weeks once infra verified), Music (conditional on arch decision), Spaces (2-3 weeks)
- **Delete now:** FISHBOWLZ (9 files), POIDH references (0 code)
- **Keep in lab:** 11 subsystems (agents, governance, bounty, utilities, infra)
- **Needs clarification:** Miniapp frame (pattern or product?)

Lab size: 324 API routes, 293 components, 23 hooks, 540+ research docs. Graduation pressure: low. Only ship when story + marketing surface ready.

## Sources

- CLAUDE.md: Lab philosophy, primary surfaces, decommissioned items, boundaries
- PR #480: BCZ YapZ graduated pattern (template for ZAOstock spinout)
- Doc 601: Agent stack cleanup decision (ZOE/Hermes canonical, no openclaw/Agent Zero)
- Doc 604: ZOE scaffold + concierge agent research
- Doc 607: Three-bot operating model (ZOE/Hermes/Devz)
- Doc 610: ZAOstock database consolidation (May 4-5)
- Doc 547: ZAOstock infrastructure is the product
- Scripts: `zaostock-spinout/` - graduation tooling
