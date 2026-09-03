# Session brief: ICM deep dive

Written 2026-09-03 by the NYC-itinerary lane, as a cold-start brief for a dedicated
session. Boot this in its own named session (`icm-deep-dive`) — per
`session-boundaries.md`, a new thread gets a new session.

---

## Why this session exists

ICM boxes are declared the **top of the precedence table** in `CLAUDE.md` — brand
truth outranks rules, skills, the research library, the vault, the board, and agent
memory. Nothing else in the estate sits above them.

And yet the tooling that reads and writes them may not exist, the registry is a known
liar, and nobody has audited whether the live boxes still match the repo copies.
Something that outranks everything deserves better than that.

---

## Starting facts (verified 2026-09-03 from the repo, not from memory)

**Boxes in `research/identity/icm-boxes/`:**
- **Live (6 named in the README):** `zaal`, `thezao`, `zabalgamez`, `wavewarz`, `fractal`, `zao-assistant`
- **Also present at root:** `poidh`, `sparkz`, plus `zai.draft`, `zoe.draft`, `zol.draft`
- **In `drafts/`:** `coc-concertz`, `poidh`, `zabalgamez`, `zaostock`, and now `zao-nyc`

> Note the smell: `poidh` and `zabalgamez` exist as BOTH a root box and a draft.
> Which is current? Unknown. That is question one.

**Format:** `# ICM: <Name>` → opening paragraph → `## What it is` → topic sections →
`## Find it` → `## Related boxes`. Tight, composable, facts only.

**Access (from `icm-grounding.md`):**
- Read: `GET https://useicm.com/api/objects/<id>/llm.txt` — **needs browser headers**,
  a plain curl gets 403. Set `User-Agent`, `Origin: https://useicm.com`, `Referer`.
- Write: `PUT /api/objects/<hash>/llm.txt`, body `{"body": "<markdown>"}`,
  `Authorization: Bearer <key>` from `~/.zao/private/icm-keys.json`. **Gated — publishing
  is Zaal's call, never a loop's.**
- Box ids: `~/.zao/private/icm-registry.json`

---

## The four known defects — this is the actual work

### 1. The tooling may not exist, and was never git-tracked
`icm-grounding.md` records (2026-08-19) that the `icm` CLI, `zao-icm.py`, and the
`/icm` skill were **all absent** from the Mac, and that **none of them was ever in
git** — checked across `~/bin`, `~/zaal-dotfiles/bin`, `~/.claude/skills`, and the
history of both repos.

That is a textbook `vanishing-dependencies.md` instance: if something depends on it,
git must hold it.

> ⚠️ **Re-verify before acting.** `thread-discipline.md` carries a hard-won lesson:
> a TOOL STATUS note is a claim with a shelf life, and its own note went stale in two
> days while telling every session to route around a tool that worked. That ICM note
> is two weeks old. **Run `command -v icm`, check the paths, check git history — then
> decide.** Do not rebuild something that already came back.

**Deliverable if genuinely absent:** a git-tracked reader/writer. Read is
unauthenticated and safe to automate; write stays gated.

### 2. The registry lies about content
`icm-grounding.md` states `icm-registry.json` is a **stale mirror** — it lists boxes
as empty that are live. **Ids are reliable; the `content` field is not.** Anything
built on it must curl the endpoint for truth, or the registry must be regenerated
from live reads. Pick one and make it true.

### 3. Nobody has diffed live boxes against the repo copies
The rules contain a genuine ambiguity worth resolving:
- `icm-grounding.md`: *"If the box and a downstream surface disagree, the box wins."*
- `icm-boxes/README.md`: the repo dir is *"the source of truth for edits."*

Both are defensible and they are not the same claim. **Fetch all live boxes, diff
against the repo copies, and write down which direction wins on conflict.** Doc 2411
is the precedent for what an unaudited "it's fine" costs.

### 4. The GEO drift guard exists but is not wired
`build-llms-txt.py --check` is a drift guard that exits 1 on stale generated files.
The README says *"a future CI drift-check can run `--check` on PRs touching this dir."*
It never shipped. That is a one-file GitHub Action and it makes the no-drift invariant
**enforced instead of documented**. Deploy of generated `llms.txt` to live domains
stays gated (Iman/Zaal, doc 1122 gap 4).

---

## The craft question — what makes a context box that actually steers a model

The defects above are engineering. This part is the reason the boxes exist at all,
and it is under-examined:

- **What does a model do with a box it fetches?** Boxes are read by ChatGPT, Claude,
  Cursor — instruction-following differs across them. Has anyone tested the same box
  in three assistants and compared the answers?
- **What is the right length?** Live boxes run 29–50 lines. Is shorter sharper, or
  does a model need the density? This is measurable: same question, boxes of different
  lengths, compare.
- **Facts vs framing.** `thezao.llm.txt` leads with a name correction ("not a record
  label"). Does a negation actually stop a model repeating the wrong framing, or does
  mentioning it reinforce it? Worth an experiment — the answer is not obvious.
- **What does a box do when it is WRONG?** Numbers decay (`state-claims.md`: a claim
  carries its date). `thezao.llm.txt` carries figures verified 2026-07-05 and 2026-07-16.
  What re-validates them, and how does a reader know they are stale?
- **GEO reality check.** The stated goal is owning the AI answer to "what is The ZAO."
  **Has that ever been measured?** Ask three assistants cold, with no box in context,
  and see what comes back. That is the only real scoreboard, and a single run is an
  anecdote — `measurement-traps.md` rule 6 says three runs is a measurement.

---

## Suggested order

1. **Re-verify the tooling** (10 min, and it gates everything else)
2. **Fetch all live boxes → diff against repo** — the audit nobody has run
3. **Resolve the source-of-truth ambiguity** and write it into `icm-grounding.md`
4. **Fix the registry** (regenerate from live, or demote it to ids-only)
5. **Rebuild the missing tooling, git-tracked** — only if step 1 confirms it is gone
6. **Wire the `--check` drift guard into CI**
7. **The craft experiments** — measure before theorizing

Steps 1–4 are audit and cost little. Step 5 is a build. Step 7 is research and is the
part most likely to change what a box should look like.

## Guards

- **Publishing a box is Zaal's, always.** Drafting is free; `PUT` is gated.
- Keys live in `~/.zao/private/` — never printed, never committed (`secret-hygiene.md`).
- Facts only in a box. No invented numbers, dates, or partners
  (`anti-fabrication.md`, and the box README says it independently).
- Absence claims carry their proof — name what you searched
  (`confirm-before-claiming-absence.md`). This brief's own tooling claim is
  second-hand and flagged as needing re-verification.

## Source

Written from `icm-grounding.md`, `CLAUDE.md` (Where Knowledge Lives + ICM section),
`research/identity/icm-boxes/README.md`, and a read of the live box files, 2026-09-03.
Siblings: `vanishing-dependencies.md` (defect 1), `state-claims.md` (dated claims),
`measurement-traps.md` (the craft experiments), `thread-discipline.md` (why to
re-verify a stale TOOL STATUS note).
