---
topic: identity
type: audit
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2161, 1435, 2155, 1051
original-query: "More stuff to research around all our Branding"
tier: STANDARD
---

# 2286 - The live ICM boxes still name partners we retired

> **Goal:** Run the live-box-versus-mirror comparison doc 2161 flagged and could not do, and report what the public boxes actually say today.

## The finding that needs a decision tonight

**Three live, public, AI-readable ZAO boxes name partners retired on 2026-07-31.**

CLAUDE.md is unambiguous about them:

> Removed 2026-07-31 per Zaal: *"no longer working with magnetiq please do not reference it again or songjam."* [...] Do not re-add these to the glossary, partner lists, or any drafted copy.

The boxes were minted before that instruction and were never updated. Fetched live today:

| Box | What it says |
|---|---|
| **zabalgamez** | *"Entry: register on the site (/enter) with a wallet + GitHub repo; **signups + collectibles run through Magnetiq (app.magnetiq.xyz)**"* |
| **zabalgamez** | *"June: recorded workshops ([...] tools like Claude Code, Empire Builder, POIDH, Juke, **SongJam**)"* |
| **zabalgamez** | *"Signup + collectibles: app.magnetiq.xyz (ZABAL brand)"* |
| **wavewarz** | contains `magnetiq` |
| **magnetiq** | a live box for the retired partner itself, 817 bytes |

The ICM boxes exist so that any assistant fetching *"how do I enter ZABAL Games"* gets the canonical answer. Right now the canonical answer routes people to a retired partner's signup flow.

**This is gated work.** `icm-grounding.md`: creating or editing a box is publishing public content and needs Zaal's explicit OK on the content first. Nothing was edited. This doc reports.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Strip Magnetiq and SongJam from `zabalgamez` and `wavewarz`, and retire the `magnetiq` box.** | Public copy contradicting an explicit standing instruction, on the surface designed to be authoritative |
| 2 | **Settle the Respect holder count before anything else is published.** | `thezao` live says **156 holders (122 OG + 55 ZOR)**; the repo source says **157 (122 OG + 56 ZOR)** - both stamped *"Verified on-chain (2026-07-05)"*, the same date. One is wrong |
| 3 | **Treat the repo mirror as authoritative for the 8 drifted boxes, then regenerate live** - except `zabalgamez`, where live is richer | Direction of drift is not uniform, so a blind sync either way loses content. See the table |
| 4 | **Stop counting `live-snapshots/` as evidence of health.** | 15 of 23 boxes "match" their mirror, but those mirrors are snapshots OF live - the comparison is circular. Of the 9 *authored* sources, **8 have drifted** |
| 5 | **The live API works again.** Doc 2161's blocked follow-up is now runnable on demand | It returned 0 bytes for every box on 2026-07-30; today all 23 return 200 with content |

## What was actually measured

All 23 boxes in `~/.zao/private/icm-registry.json`, fetched from `useicm.com/api/objects/<id>/llm.txt` today.

**23 of 23 returned HTTP 200 with real content.** Sizes 506 - 3,700 bytes. This is the direct reversal of doc 2161's blocker, which recorded the live API *"unresponsive at audit time (returned 0 for every box)"* and filed live-versus-mirror drift as a follow-up nobody has run since.

### Drift, by source type

The repo holds three kinds of file, and conflating them is how this looks healthier than it is:

| Mirror type | Boxes | Result | What it means |
|---|---:|---|---|
| `live-snapshots/*.llm.txt` | 14 | all identical | **Circular.** A snapshot of live matching live proves the snapshot is current, nothing more |
| Authored `*.llm.txt` at root | 7 | **6 drift**, 1 identical (`zao-assistant`) | The real signal |
| `drafts/*.llm.txt` | 2 | **2 drift** | Drafts richer than live - never published |

**So: 8 of 9 authored sources have drifted from what the public sees.**

| Box | Live | Repo source | Direction |
|---|---:|---:|---|
| `zabalgamez` | 2,139 | 974 | **live is RICHER** - repo mirror is stale |
| `thezao` | 2,039 | 2,219 | live thinner, and numbers conflict |
| `wavewarz` | 2,106 | 2,143 | live slightly thinner |
| `fractal` | 1,247 | 3,772 | live is **a third** of the repo source |
| `sparkz` | 2,491 | 5,059 | live is half |
| `poidh` | 1,185 | 3,432 | live is a third |
| `coc-concertz` | 904 | 2,189 (draft) | draft never published |
| `zaostock` | 854 | 5,079 (draft) | draft never published |

**The direction is not uniform**, which is the operationally important part. `icm-grounding.md` says the box is upstream and the box wins - but for `zabalgamez` the live box has content the repo lost, and for five others the repo has content the public never got. Neither side is currently authoritative, and a one-directional sync would destroy real work.

## The numbers that disagree with each other

`thezao` is the most-fetched box and its two versions state different on-chain facts under the **same verification date**:

| Claim | Repo source | Live box |
|---|---|---|
| Respect holders | **157** unique (122 OG + **56** ZOR; 21 both) | **156** unique (122 OG + **55** ZOR, 21 both) |
| Fractal weeks | *"100+ consecutive [...] verified by date calculation, 2026-07-16: 716 days ÷ 7 = 102 complete weeks"* | *"~100+ unbroken weeks"* |
| OREC detail | not stated in the drifted section | *"72-hour voting window + 72-hour veto window"* |
| WaveWarZ traction | **1,245 battles, 524.15 SOL (~$39K) lifetime volume**, 9.07 SOL to artists, 127.34 SOL claimed, ~$1,497 raised for HuRya | **absent from live** |

Two things follow. First, the repo's 157 matches the figure held in memory (`reference_zao_respect_onchain_facts`: 157 holders, Gini 0.73), so **live is the likely-wrong one** - but "likely" is not "verified", and a public box should not carry a number nobody has re-checked on chain.

Second, **the live box is missing the WaveWarZ traction paragraph entirely.** That is the most concrete evidence in the whole corpus - real battles, real volume, real charity total - and it is exactly what an assistant answering *"is WaveWarZ real"* would want. It sits in the repo and not on the public surface.

## What is fine

Worth saying, because 15 boxes are genuinely current and the tooling behaved:

- All 23 boxes resolve and return content. No 404s, no empties, no auth failures.
- `zao-assistant` - the operator layer that links to every other box - is **byte-identical** to its authored source. The hub is correct.
- The `live-snapshots/` mechanism works as designed; it just cannot be used as a drift check on itself.
- The registry at `~/.zao/private/icm-registry.json` resolved every slug to a working id.

## Findings

1. **Retired partners are live in public boxes** - Magnetiq in `zabalgamez` and `wavewarz` plus its own box, SongJam in `zabalgamez`.
2. **The live ICM API is working again**, reversing doc 2161's blocker.
3. **8 of 9 authored sources have drifted**, and the 15 "identical" results are circular.
4. **Drift runs in both directions**, so no blind sync is safe.
5. **`thezao` carries two different holder counts under one verification date.**
6. **The strongest evidence we have - WaveWarZ's traction numbers - is missing from the public box.**

## Also See

- [Doc 2161](../2161-zao-brand-audit/) - the brand audit that filed this exact follow-up and could not run it
- [Doc 1435](../1435-zao-brand-pack-reference-jul2026/) - the brand pack
- [Doc 2155](../2155-per-brand-identity-kit/) - per-brand identity kits
- [Doc 1051](../1051-icm-deep-dive-useicm-brand-masks-geo/) - what ICM is and the GEO argument for it

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve stripping Magnetiq + SongJam from the `zabalgamez` and `wavewarz` boxes and retiring the `magnetiq` box. Publishing is gated - shipped when the live fetch no longer returns those names. | @Zaal | Gated edit | 2026-08-16 |
| Re-verify the Respect holder count on chain and settle 156 vs 157 in one place | @Zaal | Manual | 2026-08-18 |
| Publish the WaveWarZ traction paragraph into the live `thezao` box - it is our best evidence and it is not public | @Zaal | Gated edit | 2026-08-18 |
| Publish the `coc-concertz` and `zaostock` drafts, or delete them if superseded - they have sat unpublished with 2-6x the live content | @Zaal | Gated edit | 2026-08-20 |
| Reconcile `zabalgamez` both ways: pull live's richer copy back into the repo, then republish with the retired partners removed | @Zaal | Gated edit | 2026-08-16 |
| Add a `zao-icm-drift` check that fetches all boxes and diffs against **authored** sources only - never `live-snapshots/` | @Zaal | PR | 2026-08-22 |

## Sources

- `useicm.com/api/objects/<id>/llm.txt` for all 23 registered boxes - **[FULL]** method: `curl` per box with HTTP status and byte count recorded, content saved to disk and diffed. All quotes are from the fetched files, not from a summary.
- `~/.zao/private/icm-registry.json` - **[FULL]** method: read from disk, 23 slug-to-id mappings, every one resolved.
- `research/identity/icm-boxes/` - **[FULL]** method: read from disk. 7 authored `*.llm.txt`, 2 drafts, 14 live-snapshots; normalized-whitespace comparison against each fetched box.
- [Doc 2161](../2161-zao-brand-audit/) - **[FULL]** read from disk; its blocked-follow-up note is quoted verbatim.
- `CLAUDE.md` retirement note - **[FULL]** read from disk, quoted verbatim.
- On-chain re-verification of the holder count - **[FAILED]** not attempted. Settling 156 vs 157 needs a chain query this doc did not run, and I would rather flag the conflict than pick a side.

## Credit

ICM is **useicm.com**'s platform. The box content is ZAO's own, authored by Zaal and the lanes. Doc 2161 did the groundwork and correctly identified this gap; this doc only ran the check it could not.
