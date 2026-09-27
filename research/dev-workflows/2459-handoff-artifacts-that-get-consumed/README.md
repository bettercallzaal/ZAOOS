---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "dev-workflows/2319-handoff-workflow-audit, dev-workflows/2092-lane-handoff-coordination, dev-workflows/755-handoff-skill-design, agents/2456-orchestrator-practice, dev-workflows/2448-obsidian-plugins-agent-memory"
original-query: "lets loop on improving the handoffs skill /zao-research online a bunch too to see more of what we can do"
tier: STANDARD
---

> ## RE-RESEARCHED 2026-09-25. The central claim needs a caveat, not a rewrite: the CONTRACT this doc measured is still the operative one, but the vocabulary decision it recommended was overtaken five days later, and the underlying failure mode it named has now fired twice more. Read this before Finding 1.
>
> **Not overtaken:** `~/zao-vault/handoffs/` is still the shape doc 2319 designed and
> this doc measured - top-level lane briefs, a soft line cap, `status:` frontmatter.
> Doc 2319 itself carries no `superseded-by` and no BLACKBOARD/GRILL-FORMAT research
> doc exists to point to (`zao-research-index "blackboard"` and `"grill format"`
> return nothing on-topic - checked, not fabricated). The brief-and-DONE.md
> mechanics this doc's Decision 1 and Findings 1-2 describe are unchanged.
>
> **Overtaken: the status vocabulary.** Decision 5 said collapse 6 live values to
> the 3 doc 2319 defined (`unconsumed -> consumed -> ready`). Instead, on
> 2026-09-06 - five days after this doc shipped - `~/zao-vault/handoffs/VOCABULARY.md`
> was written and DELIBERATELY kept **6** canonical values (`unconsumed`, `consumed`,
> `held`, `paused`, `superseded`, `closed`) - a different 6 than the 6 this doc
> measured, chosen on purpose rather than collapsed. Measured today, live usage is
> worse than either version: `consumed` 18, `unconsumed` 12, `unlabelled` 11,
> `ready` 9, `active` 8, `superseded` 6, `handed-off` 4, `held` 2, `current` 2, plus
> several free-text `status:` lines carrying prose instead of a value (e.g.
> `status: complete - all 6 batches applied...`) - **10+ distinct values**, most of
> which are in neither the old nor the new canon. The rot Decision 5 tried to fix
> got worse, and the mechanism is exactly Finding 3: a rule (2459's own
> recommendation, then VOCABULARY.md's) with no enforcing hook.
>
> **A second BLACKBOARD.md rebuild also landed 2026-09-10**, folding
> `IN-FLIGHT.md` and `needs-zaal.md` (both referenced by sibling doc 2437 as live
> inputs) into `BLACKBOARD.md`'s "WORK PACKETS" and "WAITING FOR ZAAL" sections.
> `handoffs/needs-zaal.md`, `FLEET-HEALTH.md`, `GRILL-QUEUE.md` and `IN-FLIGHT.md`
> are now retired stub pointers. This doc did not depend on those files directly,
> so its own findings are unaffected, but any doc citing them as live (2437 did)
> needs the same correction.
>
> **Finding 3 and Finding 5 fired again, in public, today.** `~/zao-vault/handoffs/GRILL-FORMAT.md`
> (written 2026-09-25, the same day as this re-research) documents two sessions
> independently counting the same open-question backlog and getting **305 and
> 254** - and **88 of the 254 were already answered**, struck through in the files,
> because "nothing in the format said which [counting rule] was correct." That is
> this doc's Finding 3 ("rules rot silently, prose has no failure mode") and
> Finding 5 (a measured instance of exactly that) recurring at estate scale
> seventeen days later - not evidence this doc was wrong, evidence it was
> under-heeded. See Findings 3 and 7 (new) below.
>
> **The three engineering Next Actions did NOT ship.** No `brief-shape-guard.sh`
> hook exists anywhere in `zaal-dotfiles` (searched). No `handoff-discipline.md`
> exists in the vault at all (searched) - the "Verify, Don't Trust" rule was never
> written down. `zao-research/skill.md` grew from 697 to 862 lines instead of being
> split, though it now has `research-index.md` (214 lines) and `topics.md` (259
> lines) alongside it - check Finding 2 for whether they are actually load-on-demand
> or just adjacent files. `handoff/skill.md` shrank from 378 to 340 lines with
> `references/bundle-template.md` (144 lines) present, a small step in the right
> direction but not the "under 150" target.

# 2459 - Handoff artifacts that actually get consumed

> **Goal:** Measure the ZAO handoff estate against what the field published in 2026, and fix the specific gaps - the 200-line cap nobody enforces, the frontmatter contract 37 percent of briefs ignore, and the monolithic skill files Anthropic's own July guidance says to split.

Doc 2319 (2026-08-22) designed the handoff contract and Zaal locked 36 decisions.
This doc measures what that contract looks like ten days into production, and
tests it against four sources published since. It does not re-open 2319's
decisions - it reports which of them took.

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **Do NOT run a wikilink pass over `handoffs/`.** Link only the brief-to-durable-artifact edge (88 such references measured, in 34 briefs). | Agents do not traverse link graphs, they grep - measured externally and stated by practitioners (see Finding 4). Links serve the human reader. A lane brief has no human browser, so 150 new edges would be pure graph noise and would make the vault's largest component mostly ephemera. |
| 2 | **Enforce the 200-line cap with a hook, not prose.** 15 of 73 top-level briefs (21 percent) are over it; the largest live brief is 766 lines. | The cap has existed since 2026-08-18 and is violated by a fifth of the corpus, which is what an unenforced prose rule always converges to. "Anything checkable by lint, types, or a hook leaves the prose file entirely." |
| 3 | **Split `handoff/skill.md` (378 lines) using progressive disclosure**, moving the 5-section bundle spec into the `references/bundle-template.md` that already exists but is not referenced as a load-on-demand file. | Anthropic removed over 80 percent of Claude Code's system prompt for Claude 5 models "with no measurable loss on our coding evaluations", and says explicitly: "For long skills, try and use progressive disclosure as much as possible - divide it into many files and split them out." |
| 4 | **Every brief rule carries a date and a one-line why; prune monthly.** | This doc's own brief carried three false claims that survived because no line in it said when it was written or on what evidence (see Finding 5). A rule you cannot justify is exactly the one that is lying. |
| 5 | **Collapse the status vocabulary from 6 values to the 3 the contract defines** (`unconsumed` -> `consumed` -> `ready`), and add frontmatter to the 27 briefs (37 percent) that have none. | Six values in live use means the receiver cannot tell state by reading the field, which is the only thing the field is for. |
| 6 | **Keep briefs under ~8KB of prose per file and add pages rather than lengthen one.** | Independent convergence: the memoryfield spec sets a soft 8KB page limit "so there is a soft limit of about 8kb (~2000 tokens)... To add more detail, add more pages", which is within noise of 2319's 200-line cap chosen for different reasons. |

## Findings

### Finding 1 - The contract from doc 2319 is about two-thirds adopted

Measured 2026-09-01 against `~/zao-vault/handoffs/`:

| Metric | Measured 2026-09-01 | Measured 2026-09-25 | Contract (doc 2319) |
|---|---|---|---|
| Top-level briefs | 73 | **94** | one living brief per lane |
| Median length | 95 lines | **120 lines** | soft cap 200 |
| Mean length | 137 lines | **178 lines** | - |
| Over the 200-line cap | 15 of 73 (21%) | **19 of 94 (20%)** | zero |
| **No frontmatter at all** | 27 of 73 (37%) | **6 of 94 (6%)** | frontmatter required |
| Distinct `status:` values in use | 6 | **10+** (`consumed` 18, `unconsumed` 12, `unlabelled` 11, `ready` 9, `active` 8, `superseded` 6, `handed-off` 4, `held` 2, `current` 2, plus free-text lines) | 3 (per this doc); **6, per VOCABULARY.md 2026-09-06** |

**Updated 2026-09-25:** frontmatter adoption fixed itself almost entirely - 37%
missing is now 6% missing - without the hook this doc recommended. The 200-line
cap is exactly as unenforced as it was (21% then, 20% now: a rate, not a trend).
The status vocabulary is the one metric that got WORSE despite two attempts to
fix it (this doc's Decision 5, then VOCABULARY.md five days later) - see the
RE-RESEARCHED box above. The median brief growing from 95 to 120 lines while the
over-cap rate holds steady says the whole distribution is drifting longer, not
just the tail.

### Finding 2 - Skill files are monoliths, against the current guidance

Anthropic published new context-engineering guidance on 2026-07-24 that
directly contradicts how this estate's skills are written. Measured line counts
in `~/.claude/skills/`:

| Skill | Lines 2026-09-01 | Lines 2026-09-25 | `references/`-equivalent files |
|---|---|---|---|
| `last30days` | 1,639 | not re-measured this pass | 0 |
| `graphify` | 1,220 | not re-measured this pass | 0 |
| `ship` | 1,135 | not re-measured this pass | 0 |
| `plan-ceo-review` | 1,088 | not re-measured this pass | 0 |
| `qa` | 981 | not re-measured this pass | 0 |
| `meeting` | 959 | not re-measured this pass | 4 |
| `zao-research` | 697 | **862** | `research-index.md` (214) + `topics.md` (259) exist alongside `SKILL.md`, **but `grep -n "research-index.md\|topics.md" SKILL.md` returns zero matches - `SKILL.md` never references either file.** They are orphans, not progressive disclosure. |
| `handoff` | 378 | **340** | `references/bundle-template.md` (144 lines), **and this time `SKILL.md` DOES load it on demand** ("Read `references/bundle-template.md` now if you have not already, and use it verbatim", line 166) - this one shipped correctly, just not down to the under-150 target. |

**Updated 2026-09-25:** `zao-research` moved the wrong direction - it grew by
165 lines and grew two same-named sibling files that look like the recommended
split but are not wired to load conditionally, which is arguably worse than not
having them: a reader could believe the split happened. `handoff` is the one
Next Action from this doc that shipped as designed, even though its line count
target was missed.

The guidance: "A common myth is that you want to make these a central
repository for every known practice that you might run into, because Claude
would not find it otherwise. Instead, consider having a tree of files that can
be loaded at the right time."

`zao-research` at 862 lines with two unreferenced sibling files is the clearest
instance, more so than on 2026-09-01. Every invocation of it pays for the
DEEP-tier instructions, the Reddit fallback ladder and the PR-creation recipe
even when the task is a QUICK-tier lookup.

### Finding 3 - Rules rot silently because prose has no failure mode

The mechanism, stated precisely by MCP.Directory (2026-07-09) and matching
Anthropic's own docs, which say Claude treats these files as "context, not
enforced configuration":

| | Code | A brief or CLAUDE.md |
|---|---|---|
| Fails when wrong | Loudly - tests, types, CI | Silently - the agent follows it anyway |
| Feedback loop | Immediate | None built in |
| Owner | Whoever touched it | Often nobody after writing |

The sharp edge is not that a stale rule gets ignored. It is that it gets
enforced: "Worse than the rot itself is when the agent starts 'fixing' new code
back toward the deprecated pattern, because it trusts the file over the
codebase."

**This is not theoretical here.** See Finding 5.

### Finding 4 - Links are for the human reader; agents grep

This finding corrects an assumption inside this very lane's work earlier today.

The obsidian lane spent this morning raising the vault's link connectivity from
28 percent to 64 percent, on the reasoning that a linked vault is a more useful
vault. That is true **for Zaal** and false for Claude, and the distinction
matters because the vault README already says it has "two readers and only one
of them renders."

The external evidence is direct. From the memoryfield writeup (2026-08-31):

> "having an AI agent traverse a knowledge graph is slow and unreliable - as
> well as being confusing for the agent... If the relevant information is N
> steps deep in the knowledge graph, N+1 tool calls are required to retrieve
> it."

and

> "relevant information is often missed in Karpathy wikis because it is not
> titled or captioned in a way which looks appealing enough to the searching
> agent."

Corroborated by a practitioner on the Hacker News thread for that piece
(49508317, 176 points, 89 comments): "If you look at how agents navigate source
code, they do not look at directory names, and drill down into the ones with
plausible names, instead they grep the whole repo for plausible keywords."

**What follows for this estate:**

- The morning's linking work was correct and should stand, but it is a
  **human-navigation** improvement. It did not make the vault more legible to
  Claude and should not be described as if it did.
- For the agent reader, the levers are different: short pages, accurate
  frontmatter `summary`/`title`, and grep-ability. Not edges.
- Therefore `handoffs/` - read almost exclusively by agents - gains nothing
  from a link pass. Decision 1.

### Finding 5 - The measured instance of Finding 3, from this week

The obsidian lane's own round 2 brief, written 2026-09-01, carried three claims
that were false when written:

| Claim | Reality | Age of the error |
|---|---|---|
| "grill items 20-27 unanswered, Job 2 blocked on Zaal" | Resolved 2026-08-26; the answer to the only structural question was "notes/ stays flat" | inherited from the round 1 brief dated 2026-08-21, restated 11 days later without being re-read |
| "1 genuine `PROMOTE:` marker, 13 days old" | Zero. The single hit is prose adopting the convention, not a marker carrying content | propagated into `notes/second-brain-reconciliation-2026-08-31.md` line 120 before being caught |
| "82% of the vault is unreachable" | Inbound-only count; the bidirectional figure a reader actually sees was 72% | published as the brief's headline |

All three were one grep from being caught, and none of the three lines carried
a date or a source. This is Finding 3's mechanism with names attached: the
second claim had already replicated into a second document by the time it was
measured. **A brief is a summary, written once, of how the work used to look.**

### Finding 6 - What the field converged on in 2026

| Practice | Source | Applies here as |
|---|---|---|
| Context rot: recall degrades as tokens grow; treat context as a finite resource with "diminishing marginal returns" | Anthropic, 2025-09-29 | The 200-line cap is not style, it is recall |
| Remove rules, let the model judge. 80%+ of Claude Code's system prompt deleted with no eval loss | Anthropic, 2026-07-24 | Decision 3; briefs should carry gotchas, not restate the obvious |
| Progressive disclosure over upfront loading; deferred tool definitions | Anthropic, 2026-07-24 | Split the skills; `references/` loaded on demand |
| Dated rules + one-line why + monthly prune | MCP.Directory, 2026-07-09 | Decision 4 |
| Move enforceable rules to hooks; prose has no failure mode | MCP.Directory + Anthropic docs | Decision 2 |
| "Verify, Don't Trust" - re-fetch the resource, do not trust a retained summary, and quote the line next to the claim | r/ClaudeCode, 168 upvotes | Would have caught all three errors in Finding 5 |
| Memory as data (markdown + frontmatter), not a pipeline; ~8KB soft page limit; add pages rather than lengthen | calpaterson, 2026-08-31 | Decision 6; validates the vault's existing shape |
| Memories work best with citations, ideally URLs | calpaterson, 2026-08-31 | Matches the estate's measure-before-asserting rule |

Worth noting what the field does **not** support: the memoryfield piece argues
against agent-traversable knowledge graphs specifically, and against
"High Modernist" memory systems that strip facts from their context. The vault's
plain-markdown-plus-git shape is closer to the recommended design than the
graph-first alternative doc 2448 already rejected for other reasons.

### Finding 7 (new, 2026-09-25) - The mechanism predicted here fired again, at estate scale

`~/zao-vault/handoffs/GRILL-FORMAT.md`, written the same day as this
re-research, is an independent, undirected confirmation of Finding 3 and
Finding 5. Two sessions counted the same open-question backlog across status
files and got **305 and 254** - "one regex matched any line beginning with a
dash, the other required a bullet marker followed by a space. Nothing in the
format said which was correct." Worse: **88 of the 254 were already answered**,
struck through in the source files, so a third of what looked like an open
backlog had been resolved, "some of it seventeen days earlier."

That is this doc's own diagnosis - a rule with no enforcing hook converges to
whatever a reader guesses - recurring in the specific surface (handoff/status
files) this doc was written to fix, seventeen days after Comparison option (b)
below was written and never built. GRILL-FORMAT.md's own fix (`## for the
grill` checklist syntax, a canonical counting tool `zao-lanegrill-count`, and
`zao-grill` which "exits 2 rather than reporting a clean zero" on an unreadable
directory) is exactly the shape of fix this doc's Decision 2 and Comparison
option (b) call for - a hook/tool with a failure mode, not more prose. It was
built for the grill-item backlog specifically; it is not yet generalised to the
brief-shape problem (200-line cap, frontmatter schema) this doc measured.

## Comparison: three ways to stop brief rot

| Option | Cost | Catches | Verdict |
|---|---|---|---|
| **(a) Monthly prune by hand** | ~20 min/month | Stale rules whose reason expired | ADOPT - cheapest, and the only one that catches a claim that is merely obsolete |
| **(b) Hook enforcing cap + frontmatter schema** | ~40 lines of shell, one-time | Over-cap briefs, missing/invalid `status:`, missing frontmatter | ADOPT - the 21% and 37% failures are exactly the machine-checkable kind |
| **(c) Require a source on every claim** | Friction on every write | Claims that were never true (Finding 5, all three) | ADOPT for the MEASURED block only; requiring it everywhere would not survive contact with a lane writing at speed |

None of the three subsumes the others: (a) catches expired truth, (b) catches
shape, (c) catches never-true. Finding 5 needed (c).

## Next Actions

Original five actions below: **none shipped as specified** by 2026-09-25 (one
partially - see status column). Kept, not deleted, per standing rule. Two new
actions follow, replacing the vocabulary one that a competing decision (VOCABULARY.md)
overtook.

| Action | Owner | Type | By When | Status 2026-09-25 |
|--------|-------|------|---------|---|
| Add `scripts/hooks/brief-shape-guard.sh` rejecting a malformed brief | @Zaal | PR to zaal-dotfiles | 2026-09-08 | Not found anywhere in zaal-dotfiles - not shipped |
| Split `handoff/SKILL.md` to under 150 lines, load `references/bundle-template.md` on demand | @Zaal | Skill edit | 2026-09-05 | **Partially shipped**: 340 lines (target missed) but the load-on-demand reference IS wired (`SKILL.md` line 166 reads it explicitly) |
| Split `zao-research/SKILL.md` into core + `references/*` | @Zaal | Skill edit | 2026-09-12 | **Not shipped, arguably regressed**: grew to 862 lines; `research-index.md`/`topics.md` exist but `SKILL.md` never references them (grep confirms zero hits) |
| Add frontmatter to the 27 briefs missing it, collapse 6 status values to 3 | @Zaal | PR to zao-vault | 2026-09-08 | Frontmatter: **shipped organically** (94% coverage now vs 63% then, no hook needed). Status collapse: **overtaken** - VOCABULARY.md (2026-09-06) kept 6 values by design; live usage now has 10+ |
| Link the 88 brief-to-durable-artifact references | @Zaal | PR to zao-vault | 2026-09-15 | Not verified this pass - out of scope for this re-research; re-check next cycle |
| Add "Verify, Don't Trust" to `handoff-discipline.md` | @Zaal | Rule edit | 2026-09-08 | **Not shipped**: no `handoff-discipline.md` exists anywhere in `~/zao-vault` (searched) |

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the machine-checkable hook this doc has now asked for three times (Decision 2, Comparison (b), Finding 7) - reuse `zao-lanegrill-count`'s counting-rule discipline (one canonical rule, `exits 2` rather than a false zero) as the template, applied to the 200-line cap and frontmatter schema, not just grill items | @Zaal | PR to zaal-dotfiles | 2026-10-09 |
| Reconcile VOCABULARY.md's 6 canonical status values against the 10+ actually in use - either enforce the 6 with a hook or fold the extras (`unlabelled`, `active`, `current`, `handed-off`) into it explicitly; do not let a second vocabulary rot the way the first one did | @Zaal | PR to zao-vault | 2026-10-09 |

## Also See

- [Doc 2319](../2319-handoff-workflow-audit/) - the contract this doc measures; itself last-validated 2026-08-22, no `superseded-by` set despite the vocabulary and BLACKBOARD.md changes since
- [Doc 755](../755-handoff-skill-design/) - the `/handoff` skill spec
- [Doc 2092](../2092-lane-handoff-coordination/) - lane-to-lane coordination
- [Doc 2456](../../agents/2456-orchestrator-practice/) - measures the same briefs from the orchestrator's side; its "briefs are logs, not notes" conclusion is the premise of Decision 1
- [Doc 2448](../2448-obsidian-plugins-agent-memory/) - why no community plugins
- `~/zao-vault/handoffs/VOCABULARY.md` (2026-09-06) - the estate's current canonical status vocabulary, superseding this doc's Decision 5 recommendation
- `~/zao-vault/handoffs/GRILL-FORMAT.md` (2026-09-25) - Finding 7's confirming instance, and the closest existing template for the hook this doc keeps asking for
- **No research doc covers the 2026-09-10 BLACKBOARD.md cutover or the 2026-09-25 GRILL-FORMAT.md rewrite** - checked via `zao-research-index "blackboard"` and `"grill format"`, neither returns an on-topic hit. Flagged as a gap, not filled here (out of this re-research's scope).

## Sources

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Anthropic, published 2025-09-29. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of context rot, attention budget, just-in-time retrieval.
- [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) - Thariq Shihipar, Anthropic, published 2026-07-24. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of the 80-percent system-prompt reduction and the progressive-disclosure guidance for skills.
- [CLAUDE.md Drift and Maintenance (2026)](https://mcp.directory/blog/claude-md-agents-md-maintenance-2026) - MCP.Directory, published 2026-07-09. `[FULL - METHOD: exa web_fetch, clean markdown]` Aggregates a 97-comment r/cursor thread and a 168-upvote r/ClaudeCode post; quotes here are its quotations, not first-hand reads of the threads.
- [Agent memory as a file format](https://calpaterson.com/memoryfields.html) - Cal Paterson, published 2026-08-31. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of the 8KB page limit and the argument against agent graph-traversal.
- [HN 49508317 - Agent memory as a file format](https://news.ycombinator.com/item?id=49508317) - 176 points, 89 comments, 2026-08-31. `[FULL - METHOD: hn.algolia.com/api/v1/items/ JSON, full comment tree walked, 65 comments over 140 chars harvested]` Community source. Corroborates that agents grep rather than traverse.
- [HN 49051361 - The new rules of context engineering](https://news.ycombinator.com/item?id=49051361) - 463 points, 404 comments, 2026-07-25. `[PARTIAL - METHOD: same API, 286 comments harvested; the top-scoring subthread is an AI-risk tangent unrelated to context engineering, so little of it is usable here]` Recorded so the next lane does not re-fetch it expecting signal.
- [A2A Protocol architecture and specification](https://tyk.io/learning-center/a2a-protocol-architecture-and-technical-specification/) - `[PARTIAL - METHOD: WebSearch result summary only; not fetched]` A2A reached v1.0 in 2026 under the Linux Foundation, with a task lifecycle of submitted / working / input-required / completed / canceled / failed. Recorded as a **pointer only** - the six-state lifecycle is a better-specified version of this estate's 3-value `status:` field and is worth a real read before anyone redesigns that vocabulary. Not load-bearing for any decision above.
- Reddit `[FAILED - METHOD: not attempted]` - reddit is walled from this machine per doc 2282; the r/cursor and r/ClaudeCode material above is quoted via MCP.Directory, which is a secondary source and is marked as such.
- Local measurement `[FULL - METHOD: python over ~/zao-vault/handoffs and ~/.claude/skills, 2026-09-01]` - original counts in Findings 1 and 2.
- `~/zao-vault/handoffs/VOCABULARY.md` `[FULL - METHOD: file read, 2026-09-25]` - the 6-value canonical status vocabulary, dated 2026-09-06, and the BLACKBOARD.md WORK PACKETS / WAITING FOR ZAAL renames.
- `~/zao-vault/handoffs/GRILL-FORMAT.md` `[FULL - METHOD: file read, 2026-09-25]` - the 305-vs-254 miscount, the 88-already-answered figure, quoted verbatim.
- Local re-measurement `[FULL - METHOD: python + wc + grep over ~/zao-vault/handoffs and ~/.claude/skills, 2026-09-25]` - 94 top-level briefs, 88/94 with frontmatter, median 120 / mean 178 lines, 19/94 over 200 lines, status-value histogram, `zao-research/SKILL.md` and `handoff/SKILL.md` line counts and reference-loading check (`grep -n` for each reference filename inside its `SKILL.md`).
- `find ~/zaal-dotfiles -iname "*brief-shape*"` and `find ~/zao-vault -iname "*discipline*"` `[FULL - METHOD: local search, 2026-09-25]` - both empty; neither Next Action artifact exists.
- `zao-research-index "blackboard"` / `"grill format"` `[FULL - METHOD: FTS5 index query, 2026-09-25]` - confirms no research doc covers either rewrite.
