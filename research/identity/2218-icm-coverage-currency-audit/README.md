---
topic: identity
type: audit
status: in-progress
last-validated: 2026-08-06
related-docs: "1016, 1021, 1051, 2154"
original-query: "Look through our past repos/projects/ideas, make an ICM box for each one, and use that to parse whether new info is needed (update-wise) - get all our infra current with the best from Brandon and community. Overnight loop."
tier: DISPATCH
---

# 2218 - ICM Coverage + Currency Audit (overnight loop tracking doc)

> **Goal:** One map of every real ZAO project/product/idea, whether it has an ICM
> box, and whether it is CURRENT vs needs new info. The overnight loop works through
> this table: draft the missing boxes + audit each against community-validated
> sources (GitHub-first), all PR-only. Zaal publishes the live boxes (gated).

## Operating rules (the loop is bound by these)

- **PR-only, drafts only.** The loop DRAFTS ICM box content into
  `research/identity/icm-boxes/` and writes audit findings here. It NEVER creates or
  edits a LIVE ICM box on useicm.com - that is publishing public content = **Zaal's
  gated action** (`icm-grounding.md`). No live-infra edits, no outbound, no spend.
- **Grounded, GitHub-first.** Each box/audit is grounded on the project's memory +
  repo + existing box + a real source scan in the order GitHub -> Farcaster -> Reddit
  -> X ([[feedback_research_source_hierarchy]]). No fabricated facts (`anti-fabrication.md`).
- **Batched + self-reporting.** Process a batch per tick, PR it, update the status
  table below. Cost-capped; empty work-list = stop (`agent-loops.md` rule 5).
- **Brand-safe.** Use exact brand spellings (WaveWarZ, The ZAO, ZABAL, BetterCallZaal);
  ZAO voice = prose; no Magnetiq/SongJam.

## Status legend
- **ICM:** none / draft (repo) / live (published) / draft+live
- **Currency:** current / STALE (new info found) / unknown (not yet audited)

## The map (work-list)

### Tier A - brands with an existing box (AUDIT for currency first)
| Project | ICM | Currency | Notes / update lead |
|---------|-----|----------|---------------------|
| The ZAO | draft+live | unknown | audit vs latest identity (doc 2154) |
| WaveWarZ | draft+live | unknown | canonical doc 743; Solana+Base |
| ZABAL Games | draft+live | unknown | Aug buildathon; workshop surfaces |
| Sparkz | draft+live | unknown | creator-coin launcher; Zoostr launch |
| Fractal | draft+live | unknown | whitepaper doc 696 |
| POIDH | draft+live | unknown | bounty + judging arch |
| COC Concertz | draft | unknown | graduated repo |
| ZAOstock | draft | unknown | Oct 3 2026 date |
| BetterCallZaal | draft+live | unknown | personal brand |
| zaal (person) | draft+live | unknown | deep profile doc 2136 |
| zao-assistant | draft+live | unknown | operator layer |

### Tier B - real products/repos likely WITHOUT a box (DRAFT + audit)
| Project | ICM | Currency | Source of truth |
|---------|-----|----------|-----------------|
| ZOE (orchestrator) | none | unknown | `bot/src/zoe/`; the whole agent stack |
| DreamNet / Spore SDK | none | unknown | docs 2184/2138; BrandonDucar/dreamnet-spore-sdk |
| Bonfire | none | unknown | bonfires.ai; knowledge graph |
| ZOL | none | unknown | @zolbot, doc 891 |
| ZAI (community agent) | none | unknown | public community agent |
| Juke / zao_music_entity | none | unknown | nickysap; music partnership |
| channelz | none | unknown | repo |
| zlank | none | unknown | repo |
| zartizen | none | unknown | repo |
| zaoscout | none | unknown | repo |
| zao_video_editor | none | unknown | repo |
| Farcaster Eats | none | unknown | FC-login content gate |
| DreamStarter (Arun) | none | unknown | Pi; video clipper |
| f2dc | none | unknown | FC-2-Devcon crowdfund coin |
| Culture Coins / Meme Engine | none | unknown | Brandon paper -> Sparkz |
| ZAO Fund (Artizen) | none | unknown | S6 |
| ZAO Festivals (umbrella) | none | unknown | history + umbrella |

(The loop expands this from the ~246 `project_*` memories, filtering PEOPLE +
collaborators + one-off threads OUT - only standalone projects/products/ideas get a
box. A person like a collaborator is NOT a project box.)

## Per-project loop procedure (each item)

1. **Ground:** read the project's `project_*` memory + its repo (if any) + its
   existing box draft.
2. **Source scan (GitHub-first):** search GitHub (repo + author profile + related
   projects + history), then Farcaster, Reddit, X, for NEW info since the last update -
   especially "best stuff from Brandon" (DreamNet/Spore patterns) + community best-practice.
3. **Draft/refresh the box** into `research/identity/icm-boxes/<slug>.draft.llm.txt`
   (brand-safe, grounded, prose).
4. **Currency verdict:** current / STALE + the specific new info the project should
   absorb. Record it in the table above (this doc, updated per batch).
5. **PR the batch.** Zaal reviews; publishes the live box himself (gated).

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Overnight loop: draft ICM + currency-audit each Tier A then Tier B project, PR-only, update this map | Claude (loop) | PR | rolling |
| Review drafted boxes + publish the live ones on useicm.com | Zaal | gated | after review |
| Act on STALE flags (absorb the new info into each project) | Zaal | decision | rolling |

## Sources
- Doc 1016 (GEO), 1021 (boxes as bot brains), 1051 (ICM deep dive), 2154 (ZOE identity) [repo].
- `research/identity/icm-boxes/` (existing box drafts) + `.claude/rules/icm-grounding.md` [repo].
- Community sources per item, GitHub-first ([[feedback_research_source_hierarchy]]).
