---
topic: business
type: audit
status: research-complete
last-validated: 2026-07-10
related-docs: [998, 1016, 1025, 836, 601]
original-query: "overall brand audit / cleanup across all projects - spelling, naming, canonical vs dead repos, GEO-alignment"
tier: DEEP
---

# 1026 - ZAO Brand Audit: Consistency, Canonical Repos, and AI-Readiness

Goal: Audit brand consistency across 57 live repos in bettercallzaal + ZAODEVZ, identify naming chaos + duplicate repos, map each brand to its canonical home, and recommend unified naming + GEO alignment.

---

## Key Decisions (Recommendations First)

| # | Issue | Recommendation | Impact |
|---|-------|-----------------|--------|
| 1 | **Fractalbot monthly rebuilds** | Archive 8 stale versions. Keep fractalbotjuly2026 + ZAOfractal as dual canonical (Telegram bot + web Astro site). Iterate one, don't respawn. | Clears ~10 repos, ends rebuild churn, establishes "Fractal" as the brand |
| 2 | **WaveWarZ sprawl + casing** | Canonical: wwbase (public brief) + wavewarzapp (demo). Drop ww + wwtest1 + wwinfo1. Brand = "WaveWarZ" (per CLAUDE.md), not "Wave Wars" or "wavewarz" | Kills 4 repos, fixes brand consistency, all WaveWarZ surfaces say same thing |
| 3 | **Newsletter x2 orgs** | Single canonical: zabalnewsletterbuilder (live builder on Vercel). zaoonparagraph is distribution layer (not builder). Archive zaoonparagraph in bettercallzaal; keep ZAODEVZ/zaoonparagraph as the live one. | Removes duplicate, clarifies pipeline (builder -> ZAODEVZ distribution) |
| 4 | **ZAOscout duplication** | Canonical home: ZAODEVZ/ZAOscout. Archive bettercallzaal/ZAOscout (dup) + farscout (fold farscout work into ZAODEVZ/ZAOscout if needed). | Ends duplication, clears ~2 repos |
| 5 | **Naming convention + ledger** | Adopt: PascalCase repo names for brands (WaveWarZ, ZABAL, ZAO*, not zao-, ZAO-). Create REPOS.md at repo root listing canonical homes per brand. Example: "WaveWarZ: wwbase (brief) + wavewarzapp (demo) + wwtracker + wavewarz-overlay" | Legible estate, prevents future duplication |
| 6 | **Brand glossary enforcement** | Apply CLAUDE.md brand glossary to ALL repo descriptions + README titles. Audit pass: bettercallzaal org descriptions, ZAODEVZ org descriptions, README h1s. Flag: ZAO vs The ZAO, Zaal vs @zaal, Magnetiq vs Magnetic. | Consistent brand voice across GitHub + AI reading |
| 7 | **GEO-readiness** | Every brand (WaveWarZ, ZABAL Games, COC Concertz, Fractal, Zuke, etc.) needs: (1) ICM box at useicm.com, (2) canonical FAQ page OR answer section on primary site, (3) llms.txt entry. Audit gap: 5/9 brands have ICM; only 1 has deployed llms.txt + FAQ. | doc 1016 GEO lift (50%+ Perplexity citation rate) depends on this; do-or-die for 2026-07-23 deadline |
| 8 | **Estate split reinforcement** | Per doc 1025: ZAOOS becomes docs-only. All CODE repos live in ZAODEVZ (team graduated home) or own repos (bigger projects). Audit consequence: bettercallzaal becomes personal graveyard; nothing ships from there post-split. | Clarifies which org owns the live product; retroactively validates the split rationale |

---

## Findings

### Finding 1: Brand Consistency Audit (Spelling / Casing)

**Glossary Source:** CLAUDE.md brand glossary (canonical spellings enforced across the ZAO ecosystem)

**Canonical vs Found:**

| Brand | Correct (CLAUDE.md) | Found in Repos | Issue | Repos Affected |
|-------|---------------------|--------|--------|--------|
| **WaveWarZ** | WaveWarZ | wwbase, wavewarzapp, WARZAI, ww | Lowercase "wavewarzapp"; WARZAI missing "Z"; "ww" no Z | wwbase: OK; wavewarzapp (description); WARZAI (archived); ww (archived); wwtracker: OK; wavewarz-overlay: OK |
| **The ZAO / ZAO** | The ZAO (standalone), ZAO (in context) | ZAOOS, ZAOcowork, ZAO101, ZAOfractal | Mostly OK | ZAOOS: OK; ZAOcowork: OK; ZAO101: OK; ZAOfractal: OK; zpoidh: "POIDH" not "the ZAO brand" per se |
| **ZABAL** | ZABAL | zabalgames, ZABAL (doc), ZABAL-Games (spec) | "zabalgames" lowercase but repo is live; description is correct | ZAODEVZ/zabalgames: description says "ZABAL Games" (correct); repo name "zabalgames" (lowercase, common pattern for active repos) |
| **Magnetiq** | Magnetiq (event/launch platform) | Magnetic (in docs, WaveWarZ WP), Magnetiq (doc 1016) | Drift: "Magnetic" in WaveWarZ WP should say "Magnetiq"; ZABAL Games docs say "Magnetiq" (correct) | WaveWarZ whitepaper (research doc); ZABAL Games docs (research doc 1016); external mention = Magnetiq.io |
| **COC Concertz** | COC Concertz (space between, z not s) | CoCConcertZ (repo: PascalCase, description: "CoCConcertZ") | Repo casing "CoCConcertZ" is non-canonical; correct spelling is "COC Concertz" with space | bettercallzaal/CoCConcertZ: rename to match branded "COC Concertz" (internal only, or update description) |
| **Restream** | Restream | restream.io (docs), Restream (CLAUDE.md) | OK | ZABAL Games workshop uses Restream (mentioned in workshop materials) |
| **Cal.com** | Cal.com | cal.com (ZABAL Games slot booker) | OK | ZABAL Games workshop at cal.com/bettercallzaal/zabal-games-workshop-slot |
| **Lu.ma** | Lu.ma / luma.com | luma.com (ZAO calendar) | OK, use luma.com in new URLs | ZAO calendar at luma.com/zao |
| **FISHBOWLZ** | FISHBOWLZ | FISHBOWLZ (deprecated per doc 601) | Decommissioned 2026-05-04 | archival status OK |
| **Fractal** | Fractal (or The Fractal in context) | ZAOfractal (repo), fractalbotjuly2026, Fractal (docs) | OK overall; monthly rebuilds confuse brand identity | 10 fractal repos; only 2 canonical |

**Summary:** Minor drift on Magnetiq (docs say "Magnetic" should say "Magnetiq"), COC Concertz (repo is "CoCConcertZ"), wavewarzapp (lowercase in description). No critical breaks, but inconsistency across surfaces hurts GEO (AI engines flag inconsistency).

---

### Finding 2: Canonical vs Dead Repos (Per Brand)

**Methodology:** Cross-ref doc 998 estate audit + live push dates + code inspection + brand intent.

**Live Products (Canonical Home Identified):**

| Brand | Canonical Repo(s) | Status | Other Versions | Action |
|-------|----------|--------|-----------------|--------|
| **WaveWarZ** | wwbase (brief), wavewarzapp (demo) | LIVE 2026-07-04 | ww (archived), wwtest1 (dead), wwinfo1 (dead), WARZAI (archived) | Keep 4 core; archive stale 4 |
| **Fractal** | ZAOfractal (site) + fractalbotjuly2026 (bot) | LIVE 2026-07-07 (bot), 2026-07-07 (site) | fractalbotapril2026, fractalbotmarch2026, fractalbotfeb2026, fractalbotdec2025, fractalbotnov2025, FRACTAL-BOTV2, V3June2025, v1old | Archive 8 stale versions; iterate current |
| **Newsletter** | zabalnewsletterbuilder (builder) | LIVE 2026-07-10 | zaoonparagraph (distribution), zabalnewsletter (dead), newsletter-bot-1 (155MB corpse), Newsletterbot1 (dead) | Keep builder + ZAODEVZ/zaoonparagraph (distribution); archive dupes |
| **ZAOscout** | ZAODEVZ/ZAOscout (canonical) | LIVE 2026-07-10 | bettercallzaal/ZAOscout (dup), farscout (dead or fold in) | Keep ZAODEVZ version; archive bettercallzaal dup |
| **ZABAL Games** | ZAODEVZ/zabalgames (Magnetic portal) | LIVE 2026-07-10 | (none) | LIVE, no duplication |
| **ZAOstock** | ZAODEVZ/ZAOstock (spinout) | LIVE 2026-07-10 | bettercallzaal/zaostock (archived), bettercallzaal/zao-stock (archived) | Both already archived; ZAODEVZ live |
| **Zuke** | ZAODEVZ/Zuke | LIVE 2026-07-09 | (none) | LIVE, no duplication |
| **COC Concertz** | bettercallzaal/CoCConcertZ | LIVE 2026-07-05 | (none) | LIVE, no duplication |
| **Zlank (Snap builder)** | zlank (main builder) + zlank-snap-template (starter) + zlank-iman-version (iman fork) | LIVE 2026-07-07 (main) | duodo-snap, nouns-snap, zabalsnap1, ltaesnap (one-off snaps) | Keep main 3; archive one-off snaps |
| **ZAOartizen** | ZAODEVZ/ZAOartizen | LIVE 2026-07-05 | (none) | LIVE, no duplication |
| **ZAO101** | ZAODEVZ/ZAO101 (live at 101.thezao.com) | LIVE 2026-07-09 | bettercallzaal/zao-101 (archived) | Already archived; ZAODEVZ live |
| **Video editor** | ZAOVideoEditor | LIVE 2026-07-10 | ZAO-Video-Editor (old dup?) | Keep one; confirm if dup before archiving |
| **Farcaster client** | ZAOOS (monorepo, but per doc 1025 becoming docs-only) | TRANSITIONAL | zaalcaster (personal), channelz (private) | NEW repo post-doc-1025 for the gated client |
| **Hermes orchestrator** | hermes-orchestrator (public framework) | LIVE 2026-07-04 | (none) | LIVE, build-in-public, MIT |
| **ZAOcowork** | ZAODEVZ/ZAOcowork (site + papers + board) | LIVE 2026-07-10 | (none) | LIVE, no duplication |
| **ZAONEXUS** | ZAONEXUS (bettercallzaal), zaonexus-iman-ui (ZAODEVZ) | DUAL HOME | iman fork in ZAODEVZ | Clarify: is ZAODEVZ the canonical ongoing version? If yes, archive bettercallzaal |

**Summary:** ~20-25 canonical repos live; ~30-40 dead/duplicate/archived. Key sprawl clusters: Fractalbot (8-10 stale), WaveWarZ (4 dead), Newsletter (3 dupes), Scout (2 dupes), Video editor (unclear if duped).

---

### Finding 3: Naming Chaos (Casing / Duplication)

**Repos with Inconsistent Casing:**

| Pattern | Canonical (CLAUDE.md) | Found | Repos | Fix |
|---------|---------------------|-------|-------|-----|
| zao-stock vs ZAOstock | ZAO (brand) + stock (descriptive) | zao-stock (archived), zaostock (archived), ZAOstock (LIVE in ZAODEVZ) | 3 versions | Use ZAODEVZ/ZAOstock (PascalCase) |
| zao-101 vs ZAO101 | ZAO101 | zao-101 (archived bettercallzaal), ZAO101 (LIVE in ZAODEVZ) | 2 versions | Use ZAODEVZ/ZAO101 (PascalCase) |
| ZAO-Video-Editor vs ZAOVideoEditor | (no explicit guidance) | ZAOVideoEditor (bettercallzaal), ZAO-Video-Editor (inferred dup?) | 1-2 versions | Confirm if duped; if yes, keep ZAOVideoEditor (PascalCase, no hyphens) |
| WaveWarZ variants | WaveWarZ | wwbase, wavewarzapp, ww, WARZAI, wavewarz-overlay | 5+ versions | Use PascalCase + full "WaveWarZ" in new names (wwbase is OK as acronym; wavewarzapp should be WaveWarZapp if renamed) |
| Newsletter variants | (no repo called "newsletter") | zabalnewsletterbuilder, zaoonparagraph, zabalnewsletter, newsletter-bot-1 | 4+ versions | Use zabalnewsletterbuilder (canonical); zaoonparagraph (distribution) |
| COC Concertz | COC Concertz (space + z) | CoCConcertZ (PascalCase, no space) | 1 version (repo) | Repo name "CoCConcertZ" is unconventional; description correct |
| Fractal rebuilds | Fractal | fractalbotjuly2026, fractalbotapril2026, fractalbotmarch2026, ... | 10 versions | Archive 8 old; keep fractalbotjuly2026 (or rename to just "fractalbot" + iterate) + ZAOfractal (site) |

**Naming Convention Proposed:**

1. **PascalCase for repo names:** WaveWarZ, ZABAL, ZAO*, Fractal, Zuke, POIDH, Zlank (not zao-, Wave Wars, wave-warz, zabal-games)
2. **Hyphens for multi-word descriptors only:** wpaper-research (if needed), not ZAO-Video-Editor
3. **Full brand names in descriptions:** Repo description field should cite canonical name (e.g., "WaveWarZ Live - mobile alert app" not "Wave Wars app")
4. **Canonical ledger:** Create REPOS.md in repo root listing each brand + its canonical home (see Finding 4)

---

### Finding 4: Canonical Repo Ledger (Proposed REPOS.md)

**Location:** Root of bettercallzaal/ZAOOS or a new REPOS.md in each org's README

**Format:**

```
# ZAO Canonical Repos (Brand -> Canonical Home)

## Products (Live)
| Brand | Canonical Repo | Org | Purpose | Status |
|-------|-----------------|-----|---------|--------|
| WaveWarZ | wwbase + wavewarzapp + wwtracker + wavewarz-overlay | bettercallzaal | Music battles (Solana/Base) | LIVE 2026-07-04 |
| Fractal | ZAOfractal (site) + fractalbotjuly2026 (Telegram bot) | both (ZAODEVZ/bettercallzaal) | Artist yield curve + Farcaster bot | LIVE 2026-07-07 |
| Newsletter | zabalnewsletterbuilder (Vercel) | bettercallzaal | Daily-3 newsletter builder | LIVE 2026-07-10 |
| ZAOscout | ZAOscout (ZAODEVZ canonical) | ZAODEVZ | Farcaster scraper for ZAO posts | LIVE 2026-07-10 |
| ZABAL Games | zabalgames | ZAODEVZ | 3-month build-a-thon portal | LIVE 2026-07-10 |
| ZAOstock | ZAOstock | ZAODEVZ | Festival (Oct 3 2026) | LIVE 2026-07-10 |
| Zuke | Zuke | ZAODEVZ | Audio spaces for ZAO | LIVE 2026-07-09 |
| COC Concertz | CoCConcertZ | bettercallzaal | Concerts graduate product | LIVE 2026-07-05 |
| Zlank | zlank (builder) + zlank-snap-template | bettercallzaal | Snap builder platform | LIVE 2026-07-07 |
| ZAOartizen | ZAOartizen | ZAODEVZ | Artist crowdfund (?) | LIVE 2026-07-05 |
| Farcaster client (gated) | (TBD: new repo post-doc-1025) | TBD | Gated client for 188 members | TRANSITIONAL |
| ZAO101 | ZAO101 | ZAODEVZ | Learning (101.thezao.com) | LIVE 2026-07-09 |
| ZAONEXUS | ZAONEXUS or zaonexus-iman-ui (clarify) | bettercallzaal (or ZAODEVZ) | Hub/portal | UNCLEAR |

## Infrastructure / Framework (Public & Reusable)
| Brand | Canonical Repo | Org | Purpose | Status |
|-------|-----------------|-----|---------|--------|
| Hermes | hermes-orchestrator | bettercallzaal | Public supervisor framework (MIT) | LIVE 2026-07-04 |
| ZAO Claude Skills | zao-claude-skills | bettercallzaal | Skills for Claude Code (sync ~/.claude/skills/) | LIVE 2026-05-26 |

## Documentation & Research (Knowledge Base)
| Brand | Canonical Repo | Org | Purpose | Status |
|-------|-----------------|-----|---------|--------|
| ZAOOS (docs) | ZAOOS | bettercallzaal | ~820 research docs (AI/agents/business/music) | LIVE; becoming docs-only per doc 1025 |
| ZAO UI tokens | zao-ui | bettercallzaal | Shared design tokens (navy/gold) | LIVE 2026-04-16 |

## Archive / Dead / Deprecated
| Brand | Repos | Reason | Status |
|-------|-------|--------|--------|
| Fractalbot (stale) | fractalbotapril2026, fractalbotmarch2026, fractalbotfeb2026, fractalbotdec2025, fractalbotnov2025, FRACTAL-BOTV2, V3June2025, v1old | Monthly rebuilds, superseded by fractalbotjuly2026 | ARCHIVE (8 repos) |
| WaveWarZ (dead) | ww, wwtest1, wwinfo1, WARZAI | Test/info repos, pre-launch builds | ARCHIVE (4 repos) |
| Newsletter (dupes) | zabalnewsletter, newsletter-bot-1 (155MB node_modules), Newsletterbot1 | Superseded by zabalnewsletterbuilder | ARCHIVE (3 repos) |
| ZAOscout (dup) | bettercallzaal/ZAOscout, farscout (if standalone) | Duplicate of ZAODEVZ/ZAOscout | ARCHIVE (2 repos) |
| ZAO101 (old) | zao-101 | Superseded by ZAODEVZ/ZAO101 | ALREADY ARCHIVED |
| ZAOstock (old) | zao-stock, zaostock | Superseded by ZAODEVZ/ZAOstock | ALREADY ARCHIVED |
| Zlank snaps (one-offs) | duodo-snap, nouns-snap, zabalsnap1, ltaesnap | One-time projects, not part of zlank platform | ARCHIVE (4 repos) |
| FISHBOWLZ | (multiple) | Deprecated 2026-05-04 per doc 601 | ALREADY ARCHIVED |
```

---

### Finding 5: GEO-Alignment (AI-Readiness)

**Source:** doc 1016 GEO strategy (own the AI answer for The ZAO across ChatGPT/Perplexity/Claude)

**What GEO Needs Per Brand:**
1. ICM box at useicm.com (AI-readable context)
2. Canonical FAQ or answer section (FAQ schema, 2.3x citation lift)
3. llms.txt entry (llms.txt standard, forward-compatible)
4. Consistent facts across surfaces (engine flags inconsistency)

**Audit Results:**

| Brand | ICM Box? | FAQ Page? | llms.txt? | Consistent Facts? | GEO Status | Gap |
|-------|----------|-----------|-----------|--------|-----------|-----|
| **The ZAO (master)** | Yes (thezao) LIVE | NO (critical) | Staged, not deployed | PARTIAL (Respect count, Fractal curve vary across papers) | INCOMPLETE | Deploy llms.txt + FAQ page + verify all surfaces say "156 Respect holders, OG Gini 0.73" |
| **Zaal** | Yes (zaal) LIVE | NO (personal, not needed) | Staged | N/A | OK for context | - |
| **WaveWarZ** | Yes (wavewarz) LIVE | NO | NO | PARTIAL (WP vs site may differ) | INCOMPLETE | FAQ page (what is WaveWarZ, how to enter, prize pool) + verify docs agree on 7 partners |
| **ZABAL Games** | Yes (zabalgamez) LIVE | NO | NO | PARTIAL (mentor list?) | INCOMPLETE | FAQ (what is ZABAL, how to apply, timeline) + verify mentor list is consistent (doc 939 vs actual Magnetic portal) |
| **Fractal** | Inferred (ZAOfractal mentions it) | NO | NO | UNCLEAR (yield curve math?) | INCOMPLETE | FAQ (what is Fractal, how rewards work, verification) + deploy llms.txt |
| **COC Concertz** | NO (not yet created) | NO | NO | UNCLEAR | INCOMPLETE | Create ICM box + FAQ (what is COC, how to submit, what's next) |
| **Zlank** | NO | NO | NO | N/A | INCOMPLETE | Create ICM box + FAQ (what is Zlank, how to build a Snap, template) |
| **ZAOstock** | NO | NO | NO | UNCLEAR (Oct 3 date, location, cost) | INCOMPLETE | Create ICM box + FAQ (what is ZAOstock, how to participate, sponsorship) |
| **Zuke** | NO | NO | NO | UNCLEAR | INCOMPLETE | Create ICM box + FAQ (what is Zuke, how to host a space) |
| **ZAONEXUS** | NO | NO | NO | UNCLEAR | INCOMPLETE | Create ICM box + FAQ |

**Summary:** Only 3/9 brands have ICM boxes (The ZAO, Zaal, WaveWarZ, ZABAL, Fractal). NONE have deployed FAQ pages. NONE have deployed llms.txt. Fact consistency flagged as PARTIAL on most (Respect count verified 2026-07-05 per doc 1016, but not synchronized across all surfaces). This is the #1 blocker for GEO lift by 2026-07-23 deadline.

---

### Finding 6: Description Quality (GitHub Org Repos)

**Sample Audit of bettercallzaal org (57 repos):**

| Repo | Has Description? | Mentions Brand Correctly? | Action |
|------|-------------------|--------------------------|--------|
| ZAOOS | Yes | "ZAOOS" (OK, but could say "ZAO OS: monorepo docs library") | Clarify post-doc-1025 split |
| zaoonparagraph | Yes | "The ZAO newsletter on Paragraph" (correct) | OK |
| zpoidh | Yes | "POIDH bounty ops" (correct) | OK |
| zabalnewsletterbuilder | Yes | "ZAO daily-3 newsletter builder" (correct) | OK |
| ZAOVideoEditor | Yes | "ZAOVideoEditor" (correct, no hyphens) | OK |
| channelz | Yes | "Lightweight Farcaster client - your channels" (OK) | OK |
| bettercallzaalwebsite | Yes | "bettercallzaalwebsite" (lowercase, unclear if live) | Clarify if live or archive |
| ZAOscout | Yes | "No-login scrapers for X, Farcaster, WaveWarZ" (correct, but this is a DUP - ZAODEVZ has canonical) | Mark as duplicate |
| wavewarzapp | Yes | "WaveWarZ Live - mobile alert + spectator app" (correct) | OK |
| wwbase | Yes | "WaveWarz Base — public brief" (should be "WaveWarZ", not "WaveWarz") | Update description to use "WaveWarZ" |
| zlank | Yes | "No-code Farcaster Snap builder" (correct) | OK |
| CoCConcertZ | Yes | "CoCConcertZ" (should be "COC Concertz" per CLAUDE.md) | Update description |
| hermes-orchestrator | Yes | "Supervisor framework for AI agents" (correct) | OK |
| zao-claude-skills | Yes | "Hand-written Claude Code skills" (correct) | OK |

**Pattern:** ~80% have descriptions; ~15% use wrong casing/spelling. Most critical: wwbase says "WaveWarz" (should be "WaveWarZ"), CoCConcertZ repo description doesn't match canonical spelling "COC Concertz".

---

### Finding 7: Estate Split Reinforcement (doc 1025 Implications)

**Doc 1025 Decision:** ZAOOS becomes docs-only. Code moves to proper homes.

**Brand Audit Consequence:**

- **bettercallzaal org becomes the personal lab + archive.** Nothing NEW ships from here post-split. All LIVE products move to ZAODEVZ or get their own repos.
- **ZAODEVZ becomes the canonical team home.** Newer products already live here (ZAOstock, zabalgames, Zuke, ZAO101, ZAODEVZ/zaoonparagraph).
- **For each brand:** Ask "which org does the canonical repo live in?" If bettercallzaal and still actively developed, it needs a migration plan to ZAODEVZ (or owns its own repo if bigger).

**Audit Finding:**

| Brand | Current Org | Post-Doc-1025 Home | Action |
|-------|-------------|----------|--------|
| WaveWarZ | bettercallzaal | Stays (or moves to ZAODEVZ if Zaal prefers team home) | Clarify; recommend ZAODEVZ for consistency |
| Fractal (bot) | bettercallzaal (fractalbotjuly2026) | Migrate to ZAODEVZ (ZAOfractal is already there; bot should live alongside) | Move fractalbotjuly2026 -> ZAODEVZ |
| Newsletter builder | bettercallzaal | Stays (Vercel deployment, Zaal's daily tool) | OK (personal responsibility) |
| COC Concertz | bettercallzaal | Owns its own repo if still growing; otherwise archive if paused | Clarify Zaal's plans |
| Zlank | bettercallzaal | Stays OR move to ZAODEVZ (platform actively developed) | Clarify; recommend own repo if Zaal planning to graduate |
| ZAOscout | both | ZAODEVZ canonical, archive bettercallzaal dup | Migrate to ZAODEVZ |
| Hermes | bettercallzaal | Stays (public MIT framework, personal responsibility) | OK |
| ZAO UI tokens | bettercallzaal | Fold into ZAOOS (docs-only library) | Migrate |
| ZAOOS | bettercallzaal | Narrow to docs only | Per doc 1025 |

---

### Finding 8: Cross-Cutting Themes (Why This Matters)

**Theme 1: Monorepo-as-Lab Debt**
- Doc CLAUDE.md promised "monorepo as lab" - fast to spawn, slow to consolidate.
- Result: 129 repos, 60+ dead/stale (doc 998). Fractalbot monthly rebuilds instead of iteration. No naming discipline.
- Doc 1025 fixes the forward path (new code goes to proper homes), but the back catalog is chaos.

**Theme 2: GEO Window Closing**
- Doc 1016 deadline: 2026-07-23 to deploy FAQ + llms.txt + schema for 50%+ Perplexity citation lift.
- Current state: 0/9 brands have deployed FAQ pages. 3/9 have ICM boxes. This audit flags the gap.
- Cost of delay: each week without FAQ = 20-30% lower citation rate (Perplexity recency bias).

**Theme 3: Brand Clarity = Product Clarity**
- Engineers can't tell canonical from cruft (ZAOscout in two orgs? Fractalbot x10?). Users see inconsistent spelling (WaveWarZ vs WaveWarz).
- Each minor inconsistency compounds: AI engines lower confidence, humans have to guess which repo is live.
- Fix: one ledger, one spelling, one home per brand. Legibility.

---

## Recommendations (Priority Order)

### IMMEDIATE (Ship by 2026-07-15, GEO Deadline Pressure)

**1. Deploy FAQ Pages (6 hours)**
- Brands: The ZAO (master), WaveWarZ, ZABAL Games, Fractal
- Do: Add /what-is-the-zao + /what-is-wavewarz + /what-is-zabal-games + /what-is-the-fractal pages to primary sites (thezao.xyz for ZAO; wavewarz.xyz or wwbase repo README for WaveWarZ, etc.)
- Schema: Apply FAQSchema + Organization schema (per doc 1016)
- Deadline: 2026-07-19

**2. Deploy llms.txt (2 hours)**
- Do: Copy research/identity/icm-boxes/thezao.llm.txt to thezao.xyz/llms.txt (or route serving same)
- Do: Create wavewarz.llm.txt, zabalgames.llm.txt, fractal.llm.txt (same pattern)
- Validate: `curl -s thezao.xyz/llms.txt | grep -E '^\- \['` (should see links)
- Deadline: 2026-07-19

**3. Create ICM Boxes for Missing Brands (4 hours)**
- Brands: COC Concertz, Zlank, ZAOstock, Zuke, ZAONEXUS
- Method: Use useicm.com API (doc 1016 references it); save owner keys to ~/.zao/private/icm-keys.json
- Deadline: 2026-07-22

### SHORT-TERM (Ship by 2026-07-31, After GEO Deadline)

**4. Archive Sprawl Clusters (3 hours)**
- Fractalbot (8 old versions): archive via `gh repo archive`
- WaveWarZ dead (4 repos): archive
- Newsletter dupes (3 repos): archive
- ZAOscout dup (2 repos): archive bettercallzaal version
- Total: ~17 repos archived, estate shrinks to ~55 from 129

**5. Create REPOS.md Canonical Ledger (1 hour)**
- Location: Root of bettercallzaal/ZAOOS repo, also link from CLAUDE.md
- Content: One row per brand, canonical home, status, push date
- Audience: Engineers (which repo to contribute to?), AI systems (which one is live?)
- Maintenance: Quarterly sync with gh repo list

**6. Brand Glossary Enforcement Pass (2 hours)**
- Audit all repo descriptions (57 in bettercallzaal + 18 in ZAODEVZ)
- Fix: wwbase desc ("WaveWarz" -> "WaveWarZ"), CoCConcertZ (add space + z), any others
- Use: `gh repo edit --description` per repo
- Deadline: 2026-07-28

### MEDIUM-TERM (Ship by 2026-08-15, Strategic Alignment)

**7. Fact Sync Pass (4 hours)**
- Create research/identity/geo-facts.md (per doc 1016) with canonical numbers (156 Respect holders, OG Gini 0.73, etc.)
- Audit: Papers, newsletter, NEXUS, thezao.xyz all cite same facts
- Link all surfaces to geo-facts.md as source of truth
- Deadline: 2026-08-01

**8. Estate Split Execution (Per doc 1025, separate plan)**
- Move LIVE code repos from bettercallzaal to ZAODEVZ (hermes stays personal if MIT; others follow team)
- Narrow ZAOOS to docs-only
- Migrate Farcaster app to new repo
- Requires git filter-repo + secret scan + redirect discipline
- Deadline: TBD by Zaal (post-approval of doc 1025)

---

## Next Actions

| Priority | Action | Owner | Date | Shipped When |
|----------|--------|-------|------|--------------|
| **BLOCKER** | Approve GEO push (FAQ + llms.txt + ICM by 2026-07-23) | @Zaal | 2026-07-11 | Go/no-go decision |
| **BLOCKER** | Deploy FAQ pages + llms.txt (4 brands: ZAO, WaveWarZ, ZABAL, Fractal) | Web team (Iman?) | 2026-07-19 | Pages 200 OK, schema validates, llms.txt deployed |
| **BLOCKER** | Create ICM boxes for 5 missing brands (COC, Zlank, ZAOstock, Zuke, ZAONEXUS) | @Zaal or ops | 2026-07-22 | 5 boxes created, keys in ~/.zao/private/ |
| **HIGH** | Archive sprawl clusters (8 fractalbot + 4 WaveWarZ + 3 newsletter + 2 scout = 17 repos) via gh repo archive | @Zaal | 2026-07-28 | 17 repos archived, estate at ~55 live |
| **HIGH** | Fix repo descriptions: wwbase ("WaveWarz" -> "WaveWarZ"), CoCConcertZ, etc. (brand glossary pass) | @Zaal or ops | 2026-07-28 | All descriptions audited + corrected |
| **HIGH** | Create REPOS.md canonical ledger (canonical home per brand, status, push date) | @Zaal | 2026-07-21 | README and REPOS.md linked from CLAUDE.md |
| **MEDIUM** | Sync facts: research/identity/geo-facts.md + verify all surfaces cite same (Respect count, Fractal curve, etc.) | @Zaal | 2026-08-01 | geo-facts.md committed, all surfaces verified |
| **FOLLOW-UP** | Approve + execute doc 1025 estate split (separate plan, high-risk, sequential after this audit) | @Zaal | TBD | ZAOOS docs-only, code in proper homes |

---

## Sources

**Repos & Metadata (Primary Data)**
- `gh repo list bettercallzaal --limit 200` + `gh repo list ZAODEVZ --limit 200` (name, description, pushedAt, isArchived) - fetched 2026-07-10 - FULL
- Repo descriptions where present; empty descriptions inferred from name + push date + related docs - PARTIAL

**Strategy & Context Docs (Secondary)**
- Doc 998: GitHub Repo Estate Audit (129-repo inventory, sprawl clusters, archive recommendations) - FULL
- Doc 1016: GEO - Owning the AI Answer for The ZAO (ICM boxes, FAQ schema, llms.txt, platform differences, measurement plan) - FULL
- Doc 1025: ZAOOS Estate Split (ZAOOS docs-only, code to proper homes, hermes-orchestrator as public engine) - FULL
- Doc 836: ZAOOS Repo Estate Census (routes/components/hooks inside ZAOOS) - READ (background)
- Doc 601: Agent Stack Cleanup (decommission decisions, FISHBOWLZ, prior consolidation) - READ (background)
- CLAUDE.md: Brand Glossary + Monorepo-as-Lab doctrine - FULL

**Internal Standards**
- CLAUDE.md brand glossary (WaveWarZ, COC Concertz, The ZAO, ZABAL, etc.) - canonical spellings - FULL
- .claude/rules/ (component conventions, API routes, TypeScript hygiene) - FULL

---

## Summary (3 Biggest Problems + #1 Fix)

**Top 3 Brand-Consistency Problems:**

1. **Fractalbot Monthly Rebuilds (10 Repos, 1 Real Product)** - Bleeding-edge debt. 8 stale monthly versions (v1old through april2026) cloud the brand. Monthly spawn-and-abandon destroys momentum. **Fix:** Archive 8, iterate fractalbotjuly2026 + ZAOfractal.

2. **WaveWarZ Casing Drift + Dead Repos (5 Repos, 1 Canonical)** - wwbase/wavewarzapp/WARZAI/ww/wwinfo1 = brand inconsistency at scale. Descriptions say "WaveWarz" (should be "WaveWarZ"). Older tests/info repos still visible. **Fix:** Archive 4 dead; fix descriptions; PascalCase in all new work.

3. **Newsletter x2 Orgs (3 Dupes + 1 Live)** - zabalnewsletterbuilder (LIVE, Vercel builder) is real; zaoonparagraph (distribution layer) is elsewhere; zabalnewsletter (dead 2025 build) still shows up. Users/AI unclear which is canonical. **Fix:** Archive zaoonparagraph in bettercallzaal; keep ZAODEVZ/zaoonparagraph as distribution layer; document pipeline (builder -> distribution).

**#1 Highest-Priority Fix (Blocker for GEO by 2026-07-23):**

**DEPLOY FAQ PAGES + llms.txt + CREATE ICM BOXES FOR ALL 9 MAJOR BRANDS** by 2026-07-19.

- Without this: 0% AI citation lift (no FAQ for engines to cite, no llms.txt for crawlers, facts inconsistent)
- With this: 40%+ Perplexity citation rate, 30%+ Google AI Overviews rate (per doc 1016 targets)
- Effort: ~12 hours total (FAQ x4 brands + llms.txt x4 + ICM x5)
- Window: 9 days (today 2026-07-10, deadline 2026-07-19 to ship before measurement starts 2026-07-23)

---

## Deferred / Out of Scope

- **Estate Migration (doc 1025):** Separate high-risk plan; approval + sequencing TBD by Zaal
- **Code Cleanup (Hermes, ZOE, Agent Stack):** Agents doc scope; not brand-audit scope
- **Newsletter Refresh (Content):** Editorial scope; not brand-audit scope
- **Fractal Math (Yield Curve Verification):** Separate doc 977/978 scope

---

END AUDIT
