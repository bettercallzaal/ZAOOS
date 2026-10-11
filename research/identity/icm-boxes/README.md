# ICM boxes - AI-readable context for the ZAO ecosystem

**This folder is no longer the source of truth.** Zaal ruled on 2026-10-11 (zao-vault
`decisions/grill-2026-10-09-seat-morning.md`, item 135) that the master copy of every context
box is the [zao-icm](https://github.com/bettercallzaal/zao-icm) repo, folder `boxes/`. The
same text is served at `https://context.thezao.com/<name>`. useicm.com is being frozen.

To change a box, open a PR in zao-icm. Do not edit box text here.

## What is in this folder now

| Path | What it is | Edit here? |
|------|------------|------------|
| `mirror/` | Generated copy of zao-icm `boxes/`, byte for byte, with `MANIFEST.json` (sha256 per box, source commit). Written by zao-icm `bin/mirror-to-zaoos.py` | No. Regenerate it |
| `*.llm.txt` in this folder | The hand-kept copies from before the ruling. Superseded. Kept for now, see below | No |
| `*.draft.llm.txt` and `drafts/` | Drafts for boxes that are not in zao-icm yet | Yes, until each moves to zao-icm |
| `live-snapshots/` | What useicm.com served on the day each file was taken. History | No |
| `build-llms-txt.py` and `generated/` | Per-domain `llms.txt` built from the hand-kept copies. See below | See below |

### Refreshing the mirror

From a zao-icm checkout on `main`, against a ZAOOS branch (never the shared checkout):

```bash
python3 bin/mirror-to-zaoos.py --zaoos <path to this repo> --check   # compare only
python3 bin/mirror-to-zaoos.py --zaoos <path to this repo>           # write mirror/
```

Then open a PR here. The script writes only inside `mirror/` and never commits or pushes.

### The hand-kept copies: kept, not deleted, and why

Measured 2026-10-11 against zao-icm `fd1dac8`. Two of the nine hand-kept boxes are identical to
the master. Seven differ, and three of those are longer here than in the master, so they may
hold text the master lacks. Deleting them now could lose it.

| Hand-kept file | Master file | State | Bytes here / master | Last changed here |
|----------------|-------------|-------|---------------------|-------------------|
| `zabalgamez.llm.txt` | `zabalgamez.llm.txt` | identical | 2,380 / 2,380 | - |
| `zaostock.llm.txt` | `zaostock.llm.txt` | identical | 2,152 / 2,152 | - |
| `fractal.llm.txt` | `fractal.llm.txt` | differs | 3,772 / 1,247 | 2026-07-17 |
| `poidh.llm.txt` | `poidh.llm.txt` | differs | 3,432 / 2,062 | 2026-08-05 |
| `sparkz.llm.txt` | `sparkz.llm.txt` | differs | 5,059 / 3,934 | 2026-07-21 |
| `thezao.llm.txt` | `thezao.llm.txt` | differs | 2,222 / 2,039 | 2026-07-17 |
| `wavewarz.llm.txt` | `wavewarz.llm.txt` | differs | 2,152 / 2,097 | 2026-07-17 |
| `zaal.llm.txt` | `bettercallzaal.llm.txt` | differs | 1,383 / 1,260 | 2026-07-08 |
| `zao-assistant.llm.txt` | `zao-assistant.llm.txt` | differs, same size | 2,631 / 2,631 | 2026-07-10 |

What happens to them, in order:

1. Each differing file is read against the master. Text worth keeping goes into zao-icm by PR;
   the rest is dropped. `fractal.llm.txt` is first, and must take the rulings since it was
   written (vote weight is OG plus ZOR, Season 3 starts 1 December 2026, no decay).
   `thezao.llm.txt` in the master keeps 156 holders (governance/2562, Key Decision 5).
2. `build-llms-txt.py` is pointed at `mirror/` (its `zaal.llm.txt` entry becomes
   `bettercallzaal.llm.txt`) and `generated/` is rebuilt. Until then it still reads the
   hand-kept copies, which is the second reason they stay.
3. Then the hand-kept copies are removed in their own PR.

The three `*.draft.llm.txt` files in this folder (`zai`, `zoe`, `zol`) have no master
counterpart and are untouched.

## Boxes (the hand-kept copies, as they were described before the ruling)

| File | Box | Covers |
|------|-----|--------|
| `zaal.llm.txt` | zaal (bettercallzaal) | Zaal Panthaki - founder, what he runs, how he works, links |
| `thezao.llm.txt` | thezao | The ZAO impact network - canonical framing, Respect/Fractal, lanes |
| `zabalgamez.llm.txt` | zabalgamez | ZABAL Games 3-month build-a-thon - arc, how to enter |
| `wavewarz.llm.txt` | wavewarz | WaveWarZ live-traded music battles |
| `fractal.llm.txt` | fractal | ZAO Fractal - the weekly Respect Game, OREC/ORDAO, OG+ZOR on Optimism |
| `zao-assistant.llm.txt` | zao-assistant | The operator layer - links to every other box |
| `zaostock.llm.txt` | zaostock | ZAOstock, the flagship festival - 2026 edition held Oct 3 in Ellsworth, the seven acts, partners. Master since 2026-10-08; live box is published FROM this file |

## Rules for these boxes
- ZAO = ZTalent Artist Organization (the acronym / etymology). Describe what it IS as a
  decentralized impact network returning profit/data/IP to artists. Use both correctly;
  do NOT describe it as merely "a music community."
- Facts only - no invented numbers or dates. On-chain Respect figures verified 2026-07-05.
- Keep each box tight and composable; link related boxes at the bottom.

## GEO: llms.txt generation (single source, no drift)

> As of 2026-10-11 the "boxes above" this section reads from are the superseded hand-kept
> copies, not the master. See step 2 under "The hand-kept copies". `--check` passed on
> 2026-10-11, so `generated/` matches the hand-kept copies, not necessarily the master.

Doc 1107's GEO plan calls for `llms.txt` on the ZAO domains (`thezao.com`,
`bettercallzaal.com`, `wavewarz.com/.well-known/llms.txt`). But the ICM boxes above
are *already* an AI-readable surface. **Two AI-readable surfaces stating different
facts is the worst GEO outcome** — an LLM that finds both trusts neither. So the
domain `llms.txt` files are **generated FROM these boxes**, not written by hand:
one source of truth, two surfaces, no drift.

`build-llms-txt.py` reads each box and emits a spec-compliant `llms.txt`
(`llmstxt.org`: H1 title, `>` blockquote summary, body, plus a `## Canonical identity`
block giving the exact brand name + `sameAs` cross-links per doc 1107 §5) into
`generated/`.

```bash
python3 build-llms-txt.py            # write generated/<domain>.llms.txt
python3 build-llms-txt.py --check    # drift guard: exit 1 if generated files are stale
python3 build-llms-txt.py --selftest # internal tests
```

Domain → box mapping (edit `DOMAIN_MAP` in the script to add domains):

| Domain | Box | Status |
|--------|-----|--------|
| `thezao.com` | `thezao.llm.txt` | priority (doc 1107) |
| `bettercallzaal.com` | `zaal.llm.txt` | priority (doc 1107) |
| `wavewarz.com` | `wavewarz.llm.txt` | priority (doc 1107, once wavewarz.com is un-parked) |
| `zabalgamez.com` | `zabalgamez.llm.txt` | staged (confirm domain live) |
| `fractal.thezao.com` | `fractal.llm.txt` | staged |

**Workflow:** edit a box → run `build-llms-txt.py` → both surfaces stay consistent.
A future CI drift-check can run `--check` on PRs touching this dir (same pattern as
the research-index guard) to make the no-drift invariant enforced, not just documented.

**Deploy is GATED (Iman / Zaal — GEO lane, doc 1122 gap 4).** Ship each generated file
to `https://<domain>/.well-known/llms.txt` **and** `https://<domain>/llms.txt` (crawlers
check both paths). This directory only drafts the content; a loop never deploys.

## Source
Grounded in the ZAO research library + memory (canonical pitch, Respect on-chain facts,
ZABAL Games state doc, WaveWarZ canonical). Origin: 2026-07-08, from the Chris Dolinsky /
Viniapp brainstorm (doc 952) where ICM + per-project context boxes were decided.
GEO llms.txt generation added 2026-07-24 (doc 1107 review, single-source drift avoidance).
