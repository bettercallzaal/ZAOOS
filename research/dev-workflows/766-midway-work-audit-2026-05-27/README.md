---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-27
related-docs: "759, 763, 764, 765, 471, 472, 601"
original-query: "go thru all github commits all things that we have done in claude code, update our .claude permissions and then /zao-research a respect post of all things that are midway thoguh being fnisihed and need to be reenginerized even if it was forgotten about yesterday"
tier: DISPATCH
---

# 766 - Midway-work audit (what's started but not finished)

> **Goal:** Surface every started-but-unfinished thread across ZAOOS + ZAOcowork + memory + skills. Comprehensive inventory so nothing rots from being forgotten. 5 parallel sub-agents covered: PRs/branches, code TODOs, research/skill/memory drift, decision-debt, ecosystem heat.

## Note on the word "Respect"

Read as "report" per context ("things that are midway through being finished"). If you meant a ZAO Fractal Respect-flavored post (governance / OREC distribution of Respect for work done), the doc shape would be a fractal-style respect-distribution proposal not an audit. Tell me if pivot needed; default = audit inventory.

## Key Decisions (sorted by leverage, highest first)

| # | Decision | Priority | Why |
|---|----------|----------|-----|
| 1 | **ROTATE Vercel OAuth + audit env vars per Doc 471** | **P0 BLOCKING** | 36 days overdue since the April incident. Security + compliance debt compounds daily. |
| 2 | **FIX the lint failure pattern blocking PRs #710-713 (single root cause)** | P1 | All 4 PRs are `mergeable=true` minus lint. Single fix unblocks 4 merges + 4 weeks of cowork research |
| 3 | **DM Nicky to generate Juke webhook secret** (1 message unblocks Juke F3) | P1 | Juke integration is HOT (9 PRs in 7d) but webhook activation stalled on a one-line fix Nicky must initiate |
| 4 | **RENUMBER doc 759 POIDH-history -> 770** (mine stays since merged + memory-bound) | P2 | Collision causes future-grep confusion; load-bearing doc 759 is the agent-best-practices version (PR #705 merged + ref'd from project_zoe_orchestrator_locked) |
| 5 | **RENUMBER doc 743 WaveWarZ WP v2 -> 767** (cold-outreach stays since merged) | P2 | Same pattern as #4 |
| 6 | **KEEP all 16 orphan memory files** but add ONE-LINE index entries to MEMORY.md | P3 | MEMORY.md is at 27.7KB limit; entries too long. Compact to <150 char lines per file. |
| 7 | **REACTIVATE ZAO Fractal whitepaper authorship sprint** (declared "magnum opus" 2026-05-22, no author session scheduled) | P3 | Foundation research done (doc 718g + 696), 11-chapter outline ready, but stalled waiting for Zaal initiation |
| 8 | **DELETE / archive 3 installed-but-unreferenced skills** (/learned, /evals, /check-env) OR document them | P3 | Skill graveyard cleanup; not blocking but adds discovery overhead |

## P0 - Vercel OAuth rotation (36 DAYS OVERDUE)

Doc 471 (the April 2026 Vercel breach response) flagged this on **2026-04-21** as URGENT. Today is **2026-05-27**. The rotation has not happened.

**What needs rotating** (per project_research_followups_apr21 memory + doc 471):
- Vercel OAuth tokens that were exposed
- Connected env vars on every project (likely including ZAOOS + ZAOcowork + ZAOfractal + any other Vercel-deployed property)
- Sequence per doc 471 phases D-E

**Why it's still open:** decision fatigue + multiple parallel sprints absorbed Zaal's attention. The rotation hasn't been blocking visible features so it kept getting deprioritized.

**Recommended unblock:** schedule a dedicated 30-min session to walk doc 471 phases D-E + rotate. Cannot be parallelized with anything else - requires sole focus on credentials.

## P1 - Lint failure blocking PRs #710 #711 #712 #713

All four PRs fail with identical CI error: `Lint & Typecheck FAILURE`. Sub-agent confirmed all `mergeable=true` minus the lint check.

**Suspected root cause:** the cowork-fork shipped most of these in rapid succession with biome rules that may have evolved between PRs. Single fix probably resolves all 4.

**Recommended unblock:**
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
git checkout ws/research-coordination-layers  # one of the failing branches
npm run lint:biome 2>&1 | head -50            # see what fails
# fix + push - same fix likely applies to other 3 branches
```

## P1 - Juke webhook activation

9 Juke PRs shipped in 7 days (consume Nicky's PR #175, public /listen + /juke pages, recap-cast, end-space button, default + recording toggles, etc). The blocking 10th step is webhook activation, which requires Nicky to auto-generate a secret that ZAO can't request.

**Recommended unblock:** 1 Telegram DM to Nicky asking for the webhook-secret generation. Likely Monday-morning unblock.

## Findings (the 5 audit angles)

### 1. PRs + branch graveyard

**Open PRs (5):**
- #710 doc 763 kanban best practices - LINT FAIL
- #711 doc 764 ZAOcowork next improvements - LINT FAIL
- #712 ZOE Gap 2 dispatch wiring - LINT FAIL (MINE - the headline ship from the 17-Q grill)
- #713 doc 765 coordination layers - LINT FAIL
- #714 .claude permissions expansion - CI in progress (MINE - this terminal just opened)

**Branch sediment:** 951 local branches. ~920 abandoned (>7 days no commits). **ZERO lost-work risk** - top unmerged branches have <=2 commits each, all tied to active PRs.

**Doc number collisions:** 759 (2 versions), 743 (2 versions). 741a-d are intentional subdocs, not a collision.

### 2. Code TODOs + deferred phases

**ZAOOS code TODOs - just 3, all cosmetic:**
- `src/app/api/music/generate/route.ts` - per-user rate limiting
- `src/lib/agents/events.ts` - dead-letter queue (doc 457)
- `src/lib/ordao/client.ts` - full ABI when @ordao/contracts npm package exists

**ZAOcowork code TODOs:** ZERO. Cowork-fork has been shipping disciplined work.

**ZOE README phases:**
- [ ] Phase 3 - fold Devz bot into Hermes webhook
- [ ] Phase 4 - replace zoe-learning-pings python cron (needs ZAO_DEVZ_CHAT_ID env)
- [ ] Phase 5 - Letta-style self-improving human block = **already mapped to Gap 4 in the locked 6-week sprint per doc 759**
- [ ] Phase 6 - TradingAgents debate mode - DEFERRED 2026-05-04 per doc 603

**Empty action bridges:** ZERO. All 322 `## Next Actions` headers in research docs have populated tables. Strong discipline signal.

**No high-leverage code blockers found.** Security/RLS/payment/signing surfaces all ship with full implementation - no TODOs in critical paths.

### 3. Research / skill / memory drift

**Research-doc status drift (6 docs not status:research-complete):**
- `research/music/601-suno-music-generation-deep-tooling-2026/03-cover-art-prompts.md` - draft
- `research/music/601-suno-music-generation-deep-tooling-2026/02-sponsor-me-liner-notes.md` - draft
- `research/events/735-leewardbound-composite-streaming/README.md` - draft
- `research/events/630-zabal-games-claude-code-hackathon-v0/README.md` - draft
- `research/infrastructure/368-notion-vs-custom-festival-planning/README.md` - superseded (good label)
- `research/wavewarz/101-wavewarz-zao-whitepaper/README.md` - superseded (good label)

**FAILED / unescalated PARTIAL sources:** NONE FOUND. 47+ docs properly classify sources. Doc 706 (Avalanche) is a model: 0 FAILED across 26+ sources.

**Skill drift:**
- *Mentioned in docs but NOT installed:* /gitnexus, /ai-employee, /chartgen
- *Installed but unreferenced (potential cruft):* /learned, /evals, /check-env
- *Healthy (3+ doc refs):* /21st, /ask-gpt, /audit-skill, /autoresearch, /bandz-research, /bcz-research, /bonfire, /capture, /clipboard, /codex, /design, /freeze, /graphify, /handoff, /investigate, /last30days, /meeting, /qa, /reddit-fetch, /review, /ship, /zao-research

**Memory drift:**
- 16 orphan memory files NOT indexed in MEMORY.md (no broken links the other way)
- 0 contradictions across project files (Agent Zero properly REJECTED, FISHBOWLZ deprecated consistent)
- 13 memory files >30 days untouched (all reflect locked habits since March, safe to keep)
- MEMORY.md at 27.7KB limit - need compact entries

### 4. Decision debt (the load-bearing audit)

**P0:** Vercel OAuth rotation - 36 days overdue (covered above)

**Aged decisions (sub-agent table):**

| Item | Source | Age | Status |
|------|--------|-----|--------|
| Vercel OAuth rotation phases D-E | Doc 471 + project_research_followups_apr21 | 36 days | P0 BLOCKING |
| Otoco LLC decision (Delaware/Wyoming) | Doc 472 task L | 36 days | ADVISORY |
| Coinflow Checkout Link (Michael Hatch) | Doc 472 task I | 36 days | ADVISORY |
| Hypersnap VPS decision | Doc 599 + project_hypersnap_node_install | 23 days | ADVISORY |
| /21st Magic MCP key | project_21st_dev_skill_live | unknown | ADVISORY |
| Zlank wallet-side coin launch | project_zlank | unknown | ADVISORY (PR #31 deferred) |
| ENS subnames on-chain setup | project_ens_subnames_todo | unknown | ADVISORY |
| Vlad/Singularity engagement | doc 738 | 3 days (29 day window) | ACTIVE |
| WaveWarZ WP refresh | project_wavewarz_whitepaper_refresh_queued | 1 day | ACTIVE |
| Apna Coding integration | doc 736 | 19 days out | FUTURE |

**Parked items completed but not marked:**
- Roddy parklet meeting (met 2026-04-30, memory still says "TBD" from 2026-04-27)

### 5. ZAO ecosystem heat map (15 projects)

| Project | Heat | Last motion | Midway work |
|---------|------|-------------|-------------|
| **ZOE** | HOT | 2026-05-27 PR #712 | Gap 1 decompose.ts + 100-list bootstrap per 6-week sprint |
| **ZABAL Games** | HOT | 2026-05-27 758e fix | Mentor handbook waiting on Zaal-confirmed specifics |
| **Juke** | HOT | 2026-05-27 PR #709 | Webhook secret blocking (DM Nicky) |
| **ZAOville** | EMERGING | 2026-05-26 doc 760 | New companion to ZAOstock, sponsor-bundled |
| **ZAO OS** | WARM | 2026-05-27 PR #714 | Permissions update + miniapp viewer queued |
| **ZAOstock** | WARM | 2026-05-26 doc 760 | Festival logistics (team, sponsors, permits) ongoing |
| **WaveWarZ** | WARM | 2026-05-25 PR #690 | Whitepaper refresh queued post-Alliance |
| **ZAO Fractal** | WARM | 2026-05-22 doc 718g | Whitepaper authorship sprint NEEDED (declared magnum opus) |
| **Cowork-ZAOdevz** | WARM | 2026-05-27 | Phase 2 Supabase swap queued |
| **Hermes** | WARM | 2026-05-05 lock | Foundation, no active motion |
| **Bonfires** | WARM | 2026-05-20 doc 717 | ZOE recap episodes + Hermes learn.ts integration pending |
| **BCZ Nexus** | WARM | 2026-05-07 | Shipped stable, no motion - needs feedback loop |
| **BCZ YapZ** | GRADUATED | 2026-05-06 PR #480 | Archived in own repo |
| **ZAO Fund (Artizen)** | COLD | 2026-05-04 | Setup complete, no visible activity 30+ days |
| **FISHBOWLZ** | DEPRECATED | 2026-05-04 | Killed - Juke partnership stands |

## Cross-cutting themes

### Theme 1: Decision debt > code debt

Code is 3 cosmetic TODOs across the entire ZAOOS monorepo. Cowork has zero. The midway-work IS the decision pile (Vercel OAuth, Otoco LLC, Coinflow, Hypersnap, /21st key, Zlank, ENS). Engineering execution is strong; product/operational decisions accumulate.

### Theme 2: The 6-week ZOE sprint subsumes one of the README phases

ZOE README Phase 5 ("Letta-style self-improving human block") = Gap 4 in the locked sprint per doc 759. When Gap 4 ships in week 4, mark Phase 5 done in the README to retire the dual tracking.

### Theme 3: Lint discipline is the single highest-ROI fix

Same lint pattern fails 4 PRs simultaneously. Fix once, unblock 4 merges. Cowork-fork has been shipping faster than CI rules evolve.

### Theme 4: Ecosystem reactivation gap

ZAO Fractal whitepaper (declared "magnum opus"), BCZ Nexus (shipped no-feedback-loop), ZAO Fund (no signal 30+ days) all need motion. Each is small effort to reactivate, large risk if left to rot.

### Theme 5: Memory hygiene is light-touch needed

16 orphan memory files + 27.7KB MEMORY.md limit = need a compaction pass. Not urgent but creeping.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rotate Vercel OAuth + audit env vars (doc 471 phases D-E) | @Zaal | infra session | 2026-05-30 (P0) |
| Fix lint failure on cowork-fork PRs #710-713 | @Zaal or fork-terminal | bug fix | 2026-05-28 |
| DM Nicky for Juke webhook secret | @Zaal | DM | 2026-05-27 (Monday) |
| Renumber doc 759 POIDH-history -> 770 + 743 WaveWarZ -> 767 | @Zaal | git mv | 2026-05-30 |
| Update Phase 5 in bot/src/zoe/README.md to point at Gap 4 in doc 759 | @Zaal | docs | when Gap 4 ships (week 4) |
| Compact 16 orphan memory entries into MEMORY.md (<150 char each) | @Zaal | memory cleanup | opportunistic |
| Mark Roddy parklet meeting RESOLVED in memory | @Zaal | memory | opportunistic |
| Decide: schedule ZAO Fractal whitepaper authorship sprint OR park explicitly | @Zaal | decision | 2026-05-31 |
| BCZ Nexus feedback-loop decision (track usage / iterate / freeze) | @Zaal | decision | 2026-06-07 |
| ZAO Fund / Artizen visibility push (cohort outreach + community signal) | @Zaal | ops | 2026-06-14 |
| Otoco LLC decision (Delaware vs Wyoming) | @Zaal | legal | 2026-06-07 |
| Hypersnap VPS purchase decision OR explicit kill | @Zaal | decision | 2026-06-02 |
| Audit /gitnexus + /ai-employee + /chartgen referenced-but-missing skills | @Zaal | skill install OR doc-fix | 2026-06-14 |

## Also See

- Doc 471 - the Vercel OAuth breach response (P0 source)
- Doc 472 - Apr 21 followups (Otoco + Coinflow source)
- Doc 599 - Hypersnap VPS context
- Doc 738 - Vlad/Singularity park source
- Doc 743 - cold-outreach (mine, merged) - the doc 743 collision survivor
- Doc 759 - the 17-Q ZOE locked decisions + 6-week sprint plan (load-bearing)
- Doc 763 + 764 + 765 - cowork-fork research (in PRs #710 #711 #713 awaiting lint fix)
- Memory: project_zoe_orchestrator_locked, feedback_no_sub_agent_context_fabrication, project_research_followups_apr21

## Sources

This audit synthesizes 5 parallel sub-agent reports (all returned cleanly, none stalled on watchdog - the tighter STANDARD-tier scope + no-web-fetch rule worked):

- [FULL] Sub-agent A "Open PR + branch graveyard" - returned ~9 min, audited via gh pr list + git log + git for-each-ref
- [FULL] Sub-agent B "Code TODO/FIXME audit + deferred phases" - returned ~11 min, grepped both ZAOOS + ZAOcowork src/ + README files
- [FULL] Sub-agent C "Research doc + skill + memory drift" - returned ~12 min, scanned research/**/*.md frontmatter + skill dirs + memory dir
- [FULL] Sub-agent D "Decision-debt + parked-projects audit" - returned ~6 min, audited memory + research Next Actions tables for past-due
- [FULL] Sub-agent E "ZAO ecosystem project-state audit" - returned ~8 min, heat-mapped 15 projects from memory + git log + research recency
- [FULL] `~/.zao/clipboard/clip-20260527-204942-audit-github-this-week-2026-05-27.html` - this terminal's earlier github PR audit (27 ZAOOS merged + 26 ZAOcowork merged + 4 open + 1 in-flight)
