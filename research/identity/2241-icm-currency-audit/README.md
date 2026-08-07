---
topic: identity
type: audit
status: research-complete
last-validated: 2026-08-07
related-docs: 2218, 1016, 1021
original-query: "ICM currency audit (task #70): every live box vs repo truth - which are stale/drifted, staged update commands, no publishing"
tier: STANDARD
---

# 2241 - ICM currency audit: 23 live boxes vs repo truth

> **Goal:** The ICM boxes are the AI-readable source of truth for every ZAO brand
> (icm-grounding.md: the box wins; downstream is generated FROM it). This audits every
> LIVE box against the repo copies - who drifted, who has no backup, what to publish.

## Method (real fetches, 2026-08-07)

Registry via `python3 ~/bin/zao-icm.py list` (23 live boxes; note: run from `$HOME` -
a worktree cwd breaks it). Each live box fetched from
`useicm.com/api/objects/<id>/llm.txt` (public read). Diffed byte-exact against repo
truth (`research/identity/icm-boxes/` + `drafts/` + `generated/` on main). All 23
fetches FULL, 0 failed.

## The verdict table

| Verdict | Count | Boxes |
|---------|-------|-------|
| IN-SYNC | 1 | zao-assistant |
| DRIFTED, repo richer (updates written, never published) | 7 | thezao, wavewarz, fractal, poidh, sparkz, coc-concertz, zaostock |
| DRIFTED, live richer (live edited, repo stale) | 1 | zabalgamez (live 2139c vs repo 973c) |
| LIVE-ONLY (no repo backup existed) | 14 | bettercallzaal, channelz, farcaster, gmfarcaster, loop-engineering, magnetiq, milk-road, zao-festivals, zao-newsletter, zao-video-editor, zaolingo, zaoscout, zlank, zuke |
| REPO-ONLY (drafted, not yet published) | 4 | zaal, zoe, zai, zol |

Drift detail (repo-richer sizes, live vs repo chars): fractal 1247/3771, poidh
1185/3431, sparkz 2491/5058, zaostock 854/2443, coc-concertz 904/2188, thezao
2039/2218, wavewarz 2106/2142.

## Fixed in this PR (autonomous-safe)

**All 14 LIVE-ONLY boxes + the live-richer zabalgamez are now captured byte-pure into
`research/identity/icm-boxes/live-snapshots/`** (15 snapshots, 0 failed) - so every
live box finally has a repo copy and future audits diff against ground truth. Reading
public boxes into the repo publishes nothing.

## Needs Zaal (publishing is gated - staged, print-only)

1. **Publish the 7 repo-richer updates** (the repo copy is the newer truth per
   icm-grounding.md). Per box: `python3 ~/bin/zao-icm.py update-cmd <slug>` prints the
   gated PUT (owner key from ~/.zao/private/icm-keys.json). Slugs: thezao, wavewarz,
   fractal, poidh, sparkz, coc-concertz, zaostock.
2. **Publish the 4 REPO-ONLY drafts**: zaal + the agent trio (zoe/zol/zai - the
   morning batch already staged on your clipboard page).
3. **Decide zabalgamez direction**: live is richer - either bless the live version
   (replace the repo file with the snapshot: one `cp` from live-snapshots/) or merge.
4. **Retire the magnetiq box**: Magnetiq is retired per the glossary ("do not
   reference") yet its box is LIVE (817c). Recommend delete/archive - your call +
   your key.

## How you use this (30 seconds)

- See any live box: `icm <slug>` in a terminal.
- Compare live vs repo: `diff research/identity/icm-boxes/live-snapshots/<slug>.llm.txt research/identity/icm-boxes/<slug>.llm.txt`
- Re-run this whole audit: the method above; next run diffs against these snapshots.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the 7 update-cmds + 4 create-cmds (publishing, gated) | @Zaal | Gated publish | 2026-08-10 |
| Decide zabalgamez (bless live snapshot or merge) | @Zaal | Decision | 2026-08-10 |
| Retire/delete the live magnetiq box | @Zaal | Gated | 2026-08-10 |
| Re-audit after publishing (same method) | @Zaal (Claude) | Audit | 2026-08-17 |

## Sources

- Registry: `~/bin/zao-icm.py list` (23 live). [FULL]
- 23 live boxes fetched from useicm.com/api (all FULL, 0 failed) + byte-diff vs
  `research/identity/icm-boxes/` on main. [FULL]
- 15 live snapshots captured in this PR (`live-snapshots/`). [FULL]

## Also See

- [Doc 2218](2218-icm-coverage-currency-audit/) - the overnight coverage map this completes (task #70).
