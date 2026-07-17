# ICM boxes - AI-readable context for the ZAO ecosystem

ICM (useicm.com) gives every person/project a permanent, AI-readable address holding an
`llm.txt`-style plain-text context that any assistant (ChatGPT, Claude, Cursor) can fetch.
These are the ZAO ecosystem's context boxes - source of truth kept here, pasted into
useicm.com to mint each box. Cousin of our GEO / llms.txt work (own the AI answer for
"what is The ZAO").

## Boxes

| File | Box | Covers |
|------|-----|--------|
| `zaal.llm.txt` | zaal (bettercallzaal) | Zaal Panthaki - founder, what he runs, how he works, links |
| `thezao.llm.txt` | thezao | The ZAO impact network - canonical framing, Respect/Fractal, lanes |
| `zabalgamez.llm.txt` | zabalgamez | ZABAL Games 3-month build-a-thon - arc, how to enter |
| `wavewarz.llm.txt` | wavewarz | WaveWarZ live-traded music battles |
| `fractal.llm.txt` | fractal | ZAO Fractal - the weekly Respect Game, OREC/ORDAO, OG+ZOR on Optimism |
| `zao-assistant.llm.txt` | zao-assistant | The operator layer - links to every other box |

## Rules for these boxes
- ZAO = ZTalent Artist Organization (the acronym / etymology). Describe what it IS as a
  decentralized impact network returning profit/data/IP to artists. Use both correctly;
  do NOT describe it as merely "a music community."
- Facts only - no invented numbers or dates. On-chain Respect figures verified 2026-07-05.
- Keep each box tight and composable; link related boxes at the bottom.

## GEO: llms.txt generation (single source, no drift)

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
GEO llms.txt generation added 2026-07-17 (doc 1107 review, single-source drift avoidance).
