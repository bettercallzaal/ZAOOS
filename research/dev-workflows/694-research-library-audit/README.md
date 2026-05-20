---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 693
tier: DISPATCH
---

# 694 - Research Library Audit: All 649 Live Docs Scored

> **Goal:** Score every live research doc for quality, find where information was lost or never finished, and produce a triage plan.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | RUN a scripted metadata pass on the 111 REVALIDATE docs - refresh `last-validated`, fill missing frontmatter | The single most common defect is metadata debt, not bad research. It is cheap to fix in bulk and does not need re-research. |
| 2 | RE-RESEARCH the ~40 HIGH-priority thin docs in batches, using the doc 693 fixed fetch chain | These are genuinely incomplete - stubs, missing Sources, info loss. They are the real "missed info." |
| 3 | MOVE the 12 ARCHIVE docs to `research/_archive/` and set `superseded-by` where applicable | They are superseded or about killed projects (FISHBOWLZ etc) - clear them out of the live set. |
| 4 | DEFER the ~77 MED/LOW RE-RESEARCH docs - do them after the HIGH batch or when their topic next comes up | Re-researching all 117 at once is not worth it; the HIGH subset is where the value is. |
| 5 | START the next research sprint with farcaster/ - it is the worst folder (23 of 59 thin) | 39% of the Farcaster docs are RE-RESEARCH; the foundational ones (Hub API, Neynar onboarding) have no Sources. |

## The Numbers (649 live docs, _archive's 80 excluded)

| Verdict | Count | Share | Meaning | Fix |
|---------|-------|-------|---------|-----|
| FINE | 408 | 63% | Solid, current, well-sourced | None |
| REVALIDATE | 111 | 17% | Good content, stale or missing dates | Scripted metadata refresh |
| RE-RESEARCH | 117 | 18% | Thin: stubs, missing Sources, info loss | Real re-research (doc 693 tool chain) |
| ARCHIVE | 12 | 2% | Superseded / dead project | Move to _archive |

**The honest headline:** the library is 63% solid. The problem Zaal felt is real but it splits in two - most of it is **metadata debt** (cheap), and a real **~117-doc thin tier** (the actual missed info). It is NOT 649 docs of lost information.

## What "Thin" Actually Means Here

The audit expected the doc 693 failure mode (info lost in fetching) to dominate. It does not. The dominant defect across all 8 folders is **unfinished structure**:

- **Missing frontmatter / no `last-validated`** - whole ranges (dev-workflows 500-600, agents 026-247) created in research sprints without standardized frontmatter.
- **No Goal statement** - business/identity alone had 7 of 12 RE-RESEARCH docs with no `> Goal` line.
- **No Sources section** - identity docs 544, 545, 570; farcaster docs 2, 17, 173, 295.
- **Stubs** - docs that promise a lot in the title and deliver ~50-80 lines (music 333/334, agents 262/266, community 624).

True fetch-loss (the doc 693 problem) is the minority: farcaster 505/589 ("info_loss_thin_sources"), community 590 ("sources lost to 404s"), agents 466 ("6 info-loss signals"). Real, but not the bulk.

## Worst Folders (re-research density)

| Folder | Total | RE-RESEARCH | Density |
|--------|-------|-------------|---------|
| farcaster + cross-platform | 59 | 23 | 39% |
| dev-workflows | 122 | 32 | 26% |
| community + governance | 75 | 20 | 27% |
| infrastructure + security | 56 | 16 | 29% |
| business + identity | 74 | 12 | 16% |
| music | 84 | 10 | 12% |
| agents | 120 | 4 | 3% |
| events + wavewarz + root | 59 | 0 | 0% |

agents/ and events/ are healthy. farcaster/ is the priority cleanup.

## Consolidated HIGH-Priority RE-RESEARCH List (~40 docs)

Re-research these first. Full per-folder tables in this folder's other files.

| Folder | HIGH-priority docs |
|--------|--------------------|
| farcaster | 2 (Hub API), 17 (Neynar FID/signers), 173 (Mini Apps), 260 (Neynar acquisition), 295 (Snaps), 505 (zlank spec), 586-589 (Hypersnap/Cassie), 591a-e (mini-app SDK suite), 594-598 (FIP live activity) |
| dev-workflows | 196, 238, 362, 506, 507, 549a-549e (21st suite) - 29 HIGH total, see dev-workflows.md |
| community + governance | 590 (Substack models), 624 (Nexus Portal), 59 (Hats Tree), 500 (DAO events), 502 (ZAOstock Circles) |
| business + identity | 5 (zao-identity), 258 (SANG buyback), 264 (LinkedIn playbook), 271 (knowledge graph), 333 (music licensing), 352 (paragraph x402 - 2 broken links), 543/544/545/549/570 (Bonfire/KG suite), 641 (Whop) |
| music | 334 + 333 (AI music speakers - Oct 3 time-sensitive), 601 (Suno tooling), 261 (AI music pipeline), 340 (remote collab tools) |
| infrastructure + security | 471 (Vercel OAuth breach - P0 security) |
| agents | 466 (ao-ui-button-audit), 673 (zao-craig-spec) |

Time-sensitive within this list: **music 333/334** (ZAO Stock Oct 3 speaker curation) and **infrastructure 471** (P0 security event).

## Per-Folder Audit Tables

Full triage for every one of the 649 docs is in this folder:

- [dev-workflows.md](./dev-workflows.md) - 122 docs
- [agents.md](./agents.md) - 120 docs
- [music.md](./music.md) - 84 docs
- [business-identity.md](./business-identity.md) - 74 docs
- [infrastructure-security.md](./infrastructure-security.md) - 56 docs
- [farcaster-crossplatform.md](./farcaster-crossplatform.md) - 59 docs
- [events-wavewarz-root.md](./events-wavewarz-root.md) - 59 docs
- [community-governance.md](./community-governance.md) - 75 docs

## Method + Caveats

- 8 parallel research agents, one per folder group, scored each doc on Sources health, completeness vs Goal, and staleness vs 2026-05-20.
- `research/_archive/` (80 docs) was excluded by design.
- Verdicts are a fast scan, not a deep re-read - a doc marked RE-RESEARCH might just need its frontmatter fixed; confirm per-doc before redoing.
- The audit agents themselves did NOT re-fetch sources - they judged from each doc's own text. A FINE verdict means "looks solid", not "every cited URL re-verified live."

## Sources

This is an internal audit; sources are the 649 research docs themselves under `research/`. Method draws on [Doc 693](../693-zao-research-fetch-quality-audit/) (fetch-quality findings).

## Also See

- [Doc 693](../693-zao-research-fetch-quality-audit/) - the fetch-quality skill fix this audit operationalizes

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Scripted metadata-refresh pass on the 111 REVALIDATE docs | @Zaal decision | Batch fix | On approval |
| Re-research the ~40 HIGH docs in batches via doc 693 tool chain | @Zaal decision | Re-research | On approval |
| Prioritize music 333/334 (Oct 3 speakers) + infra 471 (P0 security) in the first batch | @Claude | Re-research | First |
| Move the 12 ARCHIVE docs to research/_archive/ | @Claude | Cleanup | On approval |
| Start the re-research sprint with the farcaster/ folder (worst density) | @Zaal | Decision | After HIGH batch |
