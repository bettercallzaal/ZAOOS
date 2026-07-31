# 2161 - ZAO Brand Audit (ICM boxes, personas, site consistency, gaps)

**Date:** 2026-07-30 (overnight build loop)
**Status:** Audit. Grounded in the repo's ICM box mirror (`research/identity/icm-boxes/`), the persona set (`research/identity/personas/`), the generated site llms.txt files, and the ICM registry (`~/.zao/private/icm-registry.json`). NOTE: the live useicm.com `/llm.txt` API was unresponsive at audit time (returned 0 for every box) - so this audits the REPO source-of-truth mirror, which is what downstream copy is generated from ([[icm-grounding]]). Live-box drift vs the mirror is a flagged follow-up.
**Owner:** Zaal
**Siblings:** [[project_icm_boxes]], `icm-grounding.md`, doc 2155 (Identity Kit), doc 2158 (relationship map), [[project_geo_zao_iconic]], doc 1016/1021 (GEO / boxes-as-bot-brains).

---

## The one-screen picture

| Brand | ICM box content | Site llms.txt | Persona | State |
|-------|:---:|:---:|:---:|-------|
| **The ZAO** (thezao) | YES (rich) | thezao.com | YES | COMPLETE |
| **WaveWarZ** | YES (rich) | wavewarz.com | YES | COMPLETE |
| **ZABAL Games** | YES (rich) | zabalgamez.com | YES | COMPLETE + first fleet brand online |
| **Sparkz** | YES (rich) | - none - | YES | box+persona done; **no site llms.txt generated** |
| **Fractal** | YES (3.7k, in repo) | fractal.thezao.com | no | **DRIFT: box file exists but registry says EMPTY**; no persona |
| **COC Concertz** | EMPTY (draft PR #2755) | - | no | draft written (needs Thy Rev sign-off + publish) |
| **POIDH** | EMPTY (draft PR #2755) | - | no | draft written (needs publish + scope confirm) |
| **ZAOstock** | **EMPTY** | - | no | **biggest gap - flagship festival, Oct 3 2026, no box at all** |
| **Magnetiq** | EMPTY | - | no | box empty, no persona |
| Zaal (personal) | YES | bettercallzaal.com | n/a | complete |
| zao-assistant | YES | - | n/a (operator box) | complete |

Personas exist for 4 brands (thezao, wavewarz, zabalgamez, sparkz) + The ZAO community face; the fleet code + registry (doc 2155, PR #2751/2753) is live with ZABAL provisioned.

## Prioritized gaps (what to fix, in order)

1. **ZAOstock has NO box - and it is the flagship annual festival (Oct 3 2026, Franklin St Parklet).** This is the single most important gap: the one ZAO property with a hard public date + the biggest IRL moment has zero AI-readable canonical context. Anyone/any AI asking "what is ZAOstock" gets nothing canonical. **Highest priority - draft + publish the zaostock box before the Oct push.**
2. **Fractal registry drift.** `fractal.llm.txt` (3,772 chars, good content) exists in the repo and `fractal.thezao.com/llms.txt` is generated - but the ICM registry lists fractal as EMPTY, so the live box was likely never populated from the file. Either publish the box from the file, or fix the registry to point at it. Classic upstream-vs-downstream drift (`icm-grounding.md` is exactly about preventing this).
3. **COC Concertz + POIDH boxes** - drafts written this session (PR #2755). COC needs Thy Revolution sign-off (partnership framing); POIDH needs box-scope + URL confirm. Publish, then generate their personas (completing the persona set).
4. **Sparkz has no site llms.txt.** Box + persona exist, but no `sparkz.*/llms.txt` is generated - so the GEO/AI-answer surface for Sparkz is missing downstream. Generate it from the box (the `build-llms-txt.py` in the boxes dir already does this for others).
5. **Magnetiq box empty** - workshop/launch platform (ZABAL Games workshops run there). Lower urgency than zaostock but a real gap for a live platform.

## The long tail (empty boxes, lower priority)

Registry lists these as EMPTY, likely intentional-for-now: zao-festivals, zao-newsletter, zuke, milk-road, farcaster, loop-engineering, zaolingo, channelz, zaoscout, zlank, zao-video-editor, gmfarcaster. Worth a one-line triage each (which deserve a box vs which are dormant), but not blocking. `zao-festivals` is notable - it is the umbrella over ZAOstock/COC/etc., so it pairs with fixing the zaostock gap.

## Cross-surface consistency (where checked)

- The 5 brands with generated site llms.txt (thezao.com, wavewarz.com, zabalgamez.com, fractal.thezao.com, bettercallzaal.com) are generated FROM the boxes via `build-llms-txt.py` - the correct direction (`icm-grounding.md`: generate outward, don't hand-write in parallel). Good.
- The 4 shipped personas are each derived from their box - consistent by construction.
- **Consistency risk = the live useicm boxes vs the repo mirror.** The mirror is source-of-truth; if a live box was edited directly, it has drifted. The API being down blocked a live-vs-mirror diff this pass - flagged for a supervised recheck with the `/icm` skill (which holds the owner keys).

## What needs Zaal (gated - publishing boxes is his action)

1. **Draft + publish the ZAOstock box** (I can draft it next; publishing is gated). Priority #1 before the Oct festival.
2. **Resolve the fractal drift** - publish the box from `fractal.llm.txt` or fix the registry pointer.
3. **Publish coc-concertz + poidh** from the PR #2755 drafts (COC after Thy Rev sign-off).
4. **Generate the Sparkz site llms.txt** from its box.
5. Decide the long-tail triage (which empty boxes to fill vs retire).

## Method + caveat

Audited the repo mirror + registry + generated files + persona set (all authoritative for what downstream is generated from). The live useicm API was down at audit time, so live-box content quality + live-vs-mirror drift were not verified this pass - do that with the `/icm` skill when the API is back. No live boxes were edited (publishing is gated).

## Source

Repo `research/identity/icm-boxes/` + `personas/` + `~/.zao/private/icm-registry.json`, this session's fleet work (docs 2155/2159, PRs #2751-2755). Written in the overnight loop 2026-07-30.
