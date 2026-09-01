---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-01
superseded-by:
related-docs: "2319, 2092, 755, 2456, 2448, 2365, 2118, 2036"
original-query: "lets loop on improving the handoffs skill /zao-research online a bunch too to see more of what we can do"
tier: STANDARD
---

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

| Metric | Measured | Contract (doc 2319) |
|---|---|---|
| Top-level briefs | 73 | one living brief per lane |
| Nested files under `handoffs/` | 106 | not specified |
| Median length | 95 lines | soft cap 200 |
| Mean length | 137 lines | - |
| Longest live brief | 766 lines (`zabalgames.md`) | soft cap 200 |
| Over the 200-line cap | **15 of 73 (21%)** | zero |
| **No frontmatter at all** | **27 of 73 (37%)** | frontmatter required |
| Distinct `status:` values in use | **6** (`ready` 9, `unconsumed` 13, `consumed` 19, `active` 1, `open` 2, `ready-to-send` 1) | 3 |

The median brief is healthy at 95 lines. The failure is entirely in the tail
and in the metadata, which is the signature of a rule that is documented but
not enforced anywhere in code.

### Finding 2 - Skill files are monoliths, against the current guidance

Anthropic published new context-engineering guidance on 2026-07-24 that
directly contradicts how this estate's skills are written. Measured line counts
in `~/.claude/skills/`:

| Skill | Lines | `references/` files |
|---|---|---|
| `last30days` | 1,639 | 0 |
| `graphify` | 1,220 | 0 |
| `ship` | 1,135 | 0 |
| `plan-ceo-review` | 1,088 | 0 |
| `qa` | 981 | 0 |
| `meeting` | 959 | 4 |
| `zao-research` | 697 | **0** |
| `handoff` | 378 | 1 (exists, not load-on-demand) |

The guidance: "A common myth is that you want to make these a central
repository for every known practice that you might run into, because Claude
would not find it otherwise. Instead, consider having a tree of files that can
be loaded at the right time."

`zao-research` at 697 lines with zero reference files is the clearest instance.
Every invocation of it pays for the DEEP-tier instructions, the Reddit fallback
ladder and the PR-creation recipe even when the task is a QUICK-tier lookup.

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

## Comparison: three ways to stop brief rot

| Option | Cost | Catches | Verdict |
|---|---|---|---|
| **(a) Monthly prune by hand** | ~20 min/month | Stale rules whose reason expired | ADOPT - cheapest, and the only one that catches a claim that is merely obsolete |
| **(b) Hook enforcing cap + frontmatter schema** | ~40 lines of shell, one-time | Over-cap briefs, missing/invalid `status:`, missing frontmatter | ADOPT - the 21% and 37% failures are exactly the machine-checkable kind |
| **(c) Require a source on every claim** | Friction on every write | Claims that were never true (Finding 5, all three) | ADOPT for the MEASURED block only; requiring it everywhere would not survive contact with a lane writing at speed |

None of the three subsumes the others: (a) catches expired truth, (b) catches
shape, (c) catches never-true. Finding 5 needed (c).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `scripts/hooks/brief-shape-guard.sh` rejecting a `handoffs/*.md` write with no frontmatter, a `status:` outside the 3 permitted values, or over 200 lines - shipped when the hook rejects a deliberately malformed test brief | @Zaal | PR to zaal-dotfiles | 2026-09-08 |
| Split `~/.claude/skills/handoff/skill.md` from 378 lines to under 150, moving the A-E bundle spec into `references/bundle-template.md` as a load-on-demand file - shipped when `/handoff` still produces a correct bundle with the shorter skill | @Zaal | Skill edit | 2026-09-05 |
| Split `zao-research/skill.md` (697 lines, 0 reference files) into a core plus `references/{tiers,fetch-ladder,publishing}.md` - shipped when a QUICK-tier run no longer loads the DEEP-tier and PR-publishing text | @Zaal | Skill edit | 2026-09-12 |
| Add frontmatter to the 27 top-level briefs that have none, and collapse the 6 status values to 3 - shipped when the shape guard above passes on all 73 | @Zaal | PR to zao-vault | 2026-09-08 |
| Link the 88 brief-to-durable-artifact references measured in 34 briefs, and no other `handoffs/` edges - shipped when those 88 are wikilinks and `handoffs/` isolated-note count is unchanged otherwise | @Zaal | PR to zao-vault | 2026-09-15 |
| Add "Verify, Don't Trust" to the brief-writing contract: any claim in a MEASURED block carries the command that produced it - shipped when it appears in `handoff-discipline.md` | @Zaal | Rule edit | 2026-09-08 |

## Also See

- [Doc 2319](../2319-handoff-workflow-audit/) - the contract this doc measures
- [Doc 755](../755-handoff-skill-design/) - the `/handoff` skill spec
- [Doc 2092](../2092-lane-handoff-coordination/) - lane-to-lane coordination
- [Doc 2456](../../agents/2456-orchestrator-practice/) - measures the same 73 briefs from the orchestrator's side; its "briefs are logs, not notes" conclusion is the premise of Decision 1
- [Doc 2448](../2448-obsidian-plugins-agent-memory/) - why no community plugins

## Sources

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Anthropic, published 2025-09-29. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of context rot, attention budget, just-in-time retrieval.
- [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) - Thariq Shihipar, Anthropic, published 2026-07-24. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of the 80-percent system-prompt reduction and the progressive-disclosure guidance for skills.
- [CLAUDE.md Drift and Maintenance (2026)](https://mcp.directory/blog/claude-md-agents-md-maintenance-2026) - MCP.Directory, published 2026-07-09. `[FULL - METHOD: exa web_fetch, clean markdown]` Aggregates a 97-comment r/cursor thread and a 168-upvote r/ClaudeCode post; quotes here are its quotations, not first-hand reads of the threads.
- [Agent memory as a file format](https://calpaterson.com/memoryfields.html) - Cal Paterson, published 2026-08-31. `[FULL - METHOD: exa web_fetch, clean markdown]` Source of the 8KB page limit and the argument against agent graph-traversal.
- [HN 49508317 - Agent memory as a file format](https://news.ycombinator.com/item?id=49508317) - 176 points, 89 comments, 2026-08-31. `[FULL - METHOD: hn.algolia.com/api/v1/items/ JSON, full comment tree walked, 65 comments over 140 chars harvested]` Community source. Corroborates that agents grep rather than traverse.
- [HN 49051361 - The new rules of context engineering](https://news.ycombinator.com/item?id=49051361) - 463 points, 404 comments, 2026-07-25. `[PARTIAL - METHOD: same API, 286 comments harvested; the top-scoring subthread is an AI-risk tangent unrelated to context engineering, so little of it is usable here]` Recorded so the next lane does not re-fetch it expecting signal.
- [A2A Protocol architecture and specification](https://tyk.io/learning-center/a2a-protocol-architecture-and-technical-specification/) - `[PARTIAL - METHOD: WebSearch result summary only; not fetched]` A2A reached v1.0 in 2026 under the Linux Foundation, with a task lifecycle of submitted / working / input-required / completed / canceled / failed. Recorded as a **pointer only** - the six-state lifecycle is a better-specified version of this estate's 3-value `status:` field and is worth a real read before anyone redesigns that vocabulary. Not load-bearing for any decision above.
- Reddit `[FAILED - METHOD: not attempted]` - reddit is walled from this machine per doc 2282; the r/cursor and r/ClaudeCode material above is quoted via MCP.Directory, which is a secondary source and is marked as such.
- Local measurement `[FULL - METHOD: python over ~/zao-vault/handoffs and ~/.claude/skills, 2026-09-01]` - all counts in Findings 1 and 2.
