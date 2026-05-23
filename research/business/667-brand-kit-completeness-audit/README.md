---
topic: business
type: audit
status: research-complete
last-validated: 2026-05-21
original-query: "Does the ZABAL Brand Kit cover all brands in the ecosystem? What's missing or needs clarification? (reconstructed)"
related-docs: 475, 547, 661, 663, 665, 666
tier: DEEP
---

# 667 — Brand Kit Completeness Audit (/zao-research after Doc 666)

> **Goal:** Validate that Doc 666's ZABAL Brand Kit (25 brands at ship) actually covers the full ecosystem. Cross-checked against 35+ bettercallzaal repos + 75+ memory files + 729 research docs + ZAOOS code paths. Result: **6 high-confidence brands were missing (now added to 31 total)** + **5 repos still need Zaal grilling** to determine if they're brands, side projects, or cruft.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Add 6 missing brands surfaced by the audit | DONE in [bettercallzaalwebsite PR #5](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5) follow-up commit | High-confidence, all have repos + memory entries + (some) live ZAOOS code paths |
| Add `governance` as a 9th category | DONE | ZAO Fractals doesn't fit cleanly under core/festivals/music/agency/agents/infra/shows/tools. Governance is a distinct category. |
| Grill Zaal on 5 unclear repos (`crownvics`, `bettercallzaal-coding-hub`, `zski`, `ww`, `16statestreet`) before deciding | DEFER | Per `feedback_grill_one_by_one.md` — ask one at a time. Will do post-merge. |
| Verify whether `ZAO-Video-Editor` (hyphenated) is a duplicate of `ZAOVideoEditor` | DEFER | Same name, different capitalization — could be a fork, duplicate, or migration. Investigate before next kit update. |
| Categorize internal-only repos (quad-sandbox, zaoos-workspace, budget2026) as NOT brands | DONE | Private internals, not customer/contributor-facing surfaces. |
| Categorize empty / dead / superseded repos as NOT brands | DONE | mixer (empty), fractalbotmarch2026 + fractalbotfeb2026 (superseded by April), ZAOFlights (abandoned per Doc 663e). |

## The 6 Brands That Were Missing

| # | Brand | Category | Status | Why Missing? | Source That Surfaced It |
|---|---|---|---|---|---|
| 1 | **ZAO Fractals** | governance (new cat) | active | I rolled it into "The ZAO" card initially; it's distinct enough to stand alone (90+ weeks, two contracts, two ledgers, separate bot, separate frontend at zao.frapps.xyz) | `project_fractal_process.md` + `project_fractal_vision.md` + ZAOOS code paths (`src/app/(auth)/fractals/`, `src/app/api/respect/fractal`, `src/app/api/discord/fractal-live`) |
| 2 | **ZAO Music** | music | building | Doc 475 explicitly named ZAO Music as a DBA under BCZ Strategies — wasn't in initial scan | `project_zao_music_entity.md` + Doc 475 |
| 3 | **ZAO Music Bot (`zaomusicbot`)** | agents | active | Live JS bot, 117KB, last push 2026-03-12 — wasn't in my 663b/c/e audits | `gh repo view bettercallzaal/zaomusicbot` |
| 4 | **ZOUNZ** | music | building | Substantial brand — "Farcaster Music Mini App: AI music gen + Audius + Zora NFT on Base + Attention Markets on Solana." 173KB repo. Has its own `/src/components/zounz/` + `/src/app/api/zounz/` in ZAOOS. | `gh repo view bettercallzaal/ZOUNZ` description; ZAOOS code paths |
| 5 | **BCZ Journal** | shows | active | Active public build-in-public journal + has an open PR (#1) for MWA | `gh repo view bettercallzaal/bcz-journal` + open PR |
| 6 | **textsplitter** | tools | active | Was flagged "purpose unclear" in Doc 663e; clarified during the Bonfires deep-dive (Doc 665) as X Spaces audio → Bonfires kEngram preprocessor | `project_bonfires_zao_integration.md` |

## Updated Brand Kit Totals

| Metric | Before | After |
|---|---|---|
| Total brands | 25 | **31** |
| Categories | 8 | **9** (added Governance) |
| Active | 14 | **17** |
| Building | 6 | **8** |
| Paused | 2 | 2 |
| Graduated | 2 | 2 |
| Experimenting | 1 | 1 |

## Methodology

DEEP-tier /zao-research v2.2 per the upgraded skill. Diff against three sources:

1. **bettercallzaal GitHub org** — `gh repo list bettercallzaal --limit 50` returned 50 repos. Filtered to active, non-fork, non-archived. Checked descriptions + last push dates for each.
2. **Memory files** — `ls ~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_*.md` returned 75+. Scanned filenames for brand keywords.
3. **ZAOOS code paths** — `find src/app src/components -type d` for major brand mount points (zounz, fractals, music, governance, spaces).

Cross-checked each surface against the 25 brands already in `brands.json`. Anything that was an active surface AND not in the JSON was an audit hit.

Note: Step 2.5 (cross-repo grep via `mcp__grep__searchGitHub`) was NOT used here — per Doc 660's note, grep.app's bettercallzaal indexing returns zero results consistently. Stuck with `gh` CLI for ground truth.

## 5 Unclear Repos (Need Zaal Grilling)

These have repos with code but unclear brand status. Adding them blindly would be wrong; asking Zaal one-by-one per `feedback_grill_one_by_one.md`.

| Repo | Last push | Size | Description | Hypothesis | Question to ask |
|---|---|---|---|---|---|
| `crownvics` | 2026-04-13 | 20.8 MB | (blank) | Band site? Steve Peer mentioned "Crown Vics" band in `project_steve_peer.md`. | Is this the Crown Vics band's site? If yes, it's a partner/affiliate brand. |
| `bettercallzaal-coding-hub` | 2026-03-11 | 44 KB | "Personal GitHub hub aggregating all projects with embedded READMEs, filtering, and search" | Meta-aggregator brand similar to nexus/kit. | Should this become the canonical "all my repos" hub, supplanting `/kit.html`'s repo-list role? Or stays a personal scratch? |
| `zski` | 2026-02-27 | 274 KB | (blank) | Could be Zlank predecessor OR a ski/outdoors thing (Zaal is a National Ski Patroller). | What is zski? Ski patrol site? Failed Zlank prototype? |
| `ww` | 2026-02-27 | 3.7 MB | (blank) | Likely an early WaveWarZ prototype. | Should ww be archived? Or is it still alive? |
| `16statestreet` | 2026-02-26 | 337 KB | (blank) | Could be a physical-address venue brand (Maine?). | What's at 16 State Street? Address of a venue / property / office? |

## Repos Confirmed NOT Brands

These were ruled out during the audit:

| Repo | Why Not Brand |
|---|---|
| `quad-sandbox` (private) | QuadWork dev sandbox; internal infra |
| `zao-ui` (private) | Shared design tokens; infrastructure |
| `zao-mono` (private) | Submodule monorepo; infrastructure |
| `zaoos-workspace` (private) | ZOE workspace + agent configs; internal |
| `budget2026` (private) | Personal budget; not a brand |
| `mixer` | 0 KB empty placeholder |
| `fractalbotmarch2026` | Superseded by April version |
| `fractalbotfeb2026` | Older than March; long superseded |
| `ZAOFlights` | Abandoned MVP per Doc 663e |
| `RESUMEV1` | Personal resume artifact |
| `CustomPDFCreator` | Utility, not customer-facing |
| `riverside-group-demo` | BCZ portfolio item; lives as a sub-link in the BCZ card |
| `duodo-snap` / `nouns-snap` / `zabalsnap1` / `ltaesnap` | Snap demo instances built from zlank-snap-template; live under Zlank card as sub-products |

## What The Audit Caught That Doc 666 Missed

Doc 666's claim was "25 brands." The audit revealed the actual count is at least 31 (and potentially 36+ depending on the 5 unclear ones). Catch was:

- I conflated **ZAO Fractals** into **The ZAO** because they share an audience. They're operationally distinct — ZAO Fractals has its own contracts, ledgers, bot, frontend, and governance schedule.
- I conflated **ZAO Music** + **ZAO Music Bot** into the parent ZAO. They're a separate DBA per Doc 475.
- I missed **ZOUNZ** entirely. Despite having dedicated paths in ZAOOS, it didn't show up in my initial inventory because I worked from memory file names, not ZAOOS code paths.
- I missed **textsplitter** as a brand — initially classified as "utility infrastructure" but it's a public OSS repo with a specific use case (Wavewarz Spaces → Bonfires kEngrams), so it deserves a card.
- I missed **bcz-journal** because it had no memory file (yet). The audit picked it up via `gh repo list`.

The fix: the audit method (three independent sources, diff each against the JSON) catches what any single source misses.

## The Generalization

This audit pattern is reusable:
1. Inventory each source independently (`gh repo list`, memory files, code paths).
2. Diff against the canonical JSON.
3. Confidence-grade each diff hit: HIGH (multiple sources confirm), MEDIUM (one source, plausible), LOW (one source, unclear → grill).
4. Add HIGH-confidence hits immediately.
5. Defer MEDIUM/LOW until Zaal can grill the unclear ones.

Should be the standard pattern any time the brand kit gets updated. Could later be automated as a GitHub Action that runs nightly + comments on `brands.json` if any new bettercallzaal repo wasn't in the manifest within 7 days.

## Hard Numbers

- 50 bettercallzaal repos scanned (via `gh repo list bettercallzaal --limit 50`).
- 75+ memory files scanned (filename pattern match).
- ZAOOS code paths checked: `src/app/`, `src/app/api/`, `src/components/`.
- 6 missing brands added (HIGH-confidence).
- 5 repos still need Zaal grill (LOW-confidence: crownvics, bettercallzaal-coding-hub, zski, ww, 16statestreet).
- 13 repos explicitly confirmed NOT brands (private internals + dead repos + sub-instances).
- Total brand count: 25 → 31.
- Total categories: 8 → 9 (added Governance).
- Total ZABAL Brand Kit version: 1.0.0 → 1.1.0.

## Cross-Repo Search Note (Doc 663a Step 2.5)

Per Doc 660 + Doc 664 notes: `mcp__grep__searchGitHub` continues to return zero hits for `bettercallzaal/` org-scoped queries. Indexing gap persists. This audit used `gh` CLI exclusively. Recommend `/zao-research` skill Step 2.5 add a `gh search code` fallback. Tracking as follow-up.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Merge bettercallzaalwebsite PR #5 to ship the 31-brand kit live | @Zaal | PR review | This week |
| Grill the 5 unclear repos one at a time (crownvics, bettercallzaal-coding-hub, zski, ww, 16statestreet) | @Zaal | Conversation | This week |
| After grills: update brands.json again (3rd commit) with whichever became brands | @Zaal | Follow-up PR | After grills |
| Verify ZAO-Video-Editor (hyphenated) vs ZAOVideoEditor — possible duplicate | @Zaal | Investigation | Next sprint |
| Consider automating: GitHub Action that diffs `bettercallzaal` org against brands.json + comments if any active repo isn't in the manifest | @Zaal + Hermes | Future PR | Optional |
| Re-validate brand kit completeness every 30 days (ecosystem moves fast) | @Zaal | Recurring | 2026-06-17 |

## Cross-References

- [Doc 666](../666-zabal-brand-kit-page/) — the brand kit page this audit validates
- [Doc 475](../475-zao-music-entity/) — ZAO Music DBA brief (surfaced ZAO Music as missing)
- [Doc 547](../../community/547-zaostock-master-strategy/) — "infrastructure IS the product" framing
- [Doc 661](../../dev-workflows/661-zaoos-codebase-audit-may-2026/) — 663b/c/e audits that initially listed many of these repos
- [Doc 663](../../dev-workflows/663-zao-research-meta-audit-2026-05-17/) — ecosystem meta-audit that informed the categorization
- [Doc 665](../../agents/665-bonfires-deep-dive-zao-integration/) — clarified textsplitter's purpose
- [bettercallzaalwebsite PR #5](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5) — the kit page + JSON manifest
- `project_fractal_process.md`, `project_fractal_vision.md`, `project_zao_music_entity.md`, `project_bonfires_zao_integration.md`, `project_steve_peer.md` — the memory files that informed missing-brand discovery

## Sources

- `gh repo list bettercallzaal --limit 50 --json name,description,isArchived,isFork` — primary repo inventory
- `gh api repos/bettercallzaal/REPO --jq` — per-repo descriptions
- `find ~/.claude/projects/.../memory/project_*.md` — memory file inventory
- `find src/app src/components -type d` — ZAOOS code path inventory
- Bonfires deep-dive (Doc 665) — clarified textsplitter
- ZAO Music brief (Doc 475) — surfaced ZAO Music
- ZAO Fractal process memory — surfaced ZAO Fractals as distinct from The ZAO
