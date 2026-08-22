---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "2036, 441"
original-query: "how to managememeory i dont trust that you are doing it well with your cuts"
tier: STANDARD
---

# 2365 - Managing agent memory: the index is byte-bound, and 46% of our memories are unreachable

> **Goal:** Zaal did not trust the MEMORY.md compaction being done in-session. He
> was right. This doc establishes what the real constraint is, what belongs in an
> index vs a topic file, and why the compaction strategy in use was the one the
> literature says loses.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **STOP compressing prose in MEMORY.md. PRUNE stale entries instead.** | Measured: an in-session prose-trim pass moved the file 20,255 -> 19,657 bytes (-3%) while preserving all 212 links. Safe but useless. Research consensus is explicit that "prune the junk, persist the essence" beats "summarize everything." |
| 2 | **The binding limit is BYTES (25KB), not LINES (200).** We are at 84/200 lines (42%) but 19,657/25,000 bytes (79%). | The current index design crams many links onto one line separated by `·`. That optimizes for the line budget, which is not scarce, and does nothing for the byte budget, which is. |
| 3 | **The 190 orphaned memory files cost ZERO context. Do not "clean them up" for performance reasons.** | Official docs, verified raw: Claude Code "doesn't load topic files such as `user_role.md`" at startup. Only MEMORY.md loads. Orphans are a *discoverability* problem, not a cost problem - a different fix. |
| 4 | **Treat an unlinked memory as archived, not lost.** Grep still finds it. | 416 files on disk, 211 reachable from the index. Some orphaning is deliberate and correct (base guardrails moved into CLAUDE.md/rules). The index already says so. |
| 5 | **Doc 2036's action was 3 weeks overdue and nobody noticed.** | 2036 (2026-07-23) said "Compact MEMORY.md to under ~17KB, Owner Zaal, By When 2026-07-30." File was ~20KB then and 19.6KB now. Exactly the `recap-followthrough.md` failure: an action item with a date, in a doc nobody re-opened. |
| 6 | **Do NOT bulk-delete memory files.** | `no-rm-rf.md` - deletion is Zaal's. And orphan status is not evidence of staleness (see Finding 4 - our own mtimes are worthless). |

## Findings

### 1. The official limits, verified against raw source

Fetched `https://code.claude.com/docs/en/memory.md` with `curl` (raw markdown,
37,296 bytes - not a WebFetch summary, per `research-grounding.md`'s
never-quote-from-WebFetch rule):

> "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first,
> are loaded at the start of every conversation."

And the fact that changes the whole cleanup calculus:

> "Claude Code doesn't load topic files such as `user_role.md` [...] at startup.
> Claude reads them on demand using its standard file tools."

Two further details worth knowing, both from the same page:

- **YAML frontmatter and block-level HTML comments are stripped before the index
  is measured** (v2.1.211+), so they are free. Before that version the raw file
  was measured and frontmatter could trigger the error spuriously.
- Over the limit, **the write still succeeds** but everything past the limit is
  silently dropped on the next load. That is a `silent-failure-guard.md` shape:
  the file looks fine on disk and is truncated in practice.

### 2. What we actually measured here

| Signal | Value | Budget | % used |
|---|---|---|---|
| MEMORY.md lines | 84 | 200 | 42% |
| MEMORY.md bytes | 19,657 | ~25,000 | **79%** |
| Links in index | 211 unique | - | - |
| Memory files on disk | 416 | - | - |
| **Files unreachable from index** | **190** | - | **46%** |

The line/byte split is the finding. Every past compaction pass optimized lines
by merging entries onto shared `·`-separated lines. That is why the file has 84
very long lines instead of ~211 short ones - and why it keeps drifting toward the
byte ceiling while looking fine on a line count.

### 3. The compaction that was attempted in-session, and why it failed

On 2026-08-22 a prose-trimming pass ran against this file mid-session, prompted
by the PostToolUse size warning. Result, measured:

- 20,255 -> 19,657 bytes. **-598 bytes, -3%.**
- Links before: 212. Links after: 212. **Zero pointers lost.**

So the pass was *safe* (nothing became unreachable) and *ineffective* (nowhere
near the ~17KB target). Zaal's stated distrust - "i dont trust that you are
doing it well with your cuts" - was correct on the outcome, though the failure
mode was futility rather than data loss.

The literature names this directly. From the retrieval-vs-memory survey work:
the winning strategy is **"prune the junk, persist the essence"**, which
outperforms *both* "keep everything" *and* "summarize everything". Prose
trimming is "summarize everything" applied to an index. It compresses the
description while retaining every entry, so the entry count - the actual driver
of size - never moves.

### 4. Our file mtimes are worthless for staleness, and that matters

The obvious next move is "prune the oldest memories." It does not work here.
All 190 orphans report an mtime of 2026-08-12, because a bulk sync commit
(`e1b7de5`, "sync: add ZAOOS memory (284 files, secret-scanned)") rewrote them
all on 2026-08-11. Checked directly:

```
stat -f "%Sm" feedback_no_emojis.md          -> 2026-08-12 06:31
git log --diff-filter=A --format="%ci" -1 -- <same file>  -> 2026-08-11 18:41
```

**Use `git log --diff-filter=A` against `zaal-dotfiles` for true memory age, never
`stat`.** This is a `state-claims.md` case: the cheap proxy (mtime) is wrong
precisely where it matters, and a pruning pass built on it would have deleted by
a meaningless signal.

### 5. What belongs in the index vs a topic file

From the official docs, the division is explicit and we are mostly following it:

- **MEMORY.md** = index. One line per memory. Loaded every session.
- **Topic file** = the detail. Loaded on demand, never at startup.
- Claude "skips anything it can derive from the codebase" and "anything your
  CLAUDE.md files already say."

That last clause is the one with pruning leverage here. The index's own final
line already acknowledges it:

> `(Base guardrails - no-emojis/dashes, farcaster-not-warpcast, always-PR/never-push-main, never-ask-keys - on disk in CLAUDE.md/.claude/rules.)`

Those memories were correctly de-linked once the rules moved into
`.claude/rules/`. The same test should be applied across the remaining 211: any
memory whose content is now fully covered by a `.claude/rules/*.md` file is a
duplicate of always-loaded context and is a prune candidate. **That audit has not
been run** and is the concrete next action.

### 6. Context dilution is a real cost, not just a token cost

Two independent sources make the same point: a bloated always-loaded context does
not merely cost tokens, it degrades attention. The "lost in the middle" effect is
cited at **>30% accuracy drop** for content in the middle of a long context, and
the retrieval literature describes context dilution - "the agent's working buffer
fills with marginal facts, the model attention spreads thin and the response
degrades."

Practical read for ZAO: a 19.6KB index that is 46%-redundant with `.claude/rules/`
is not a neutral cost. It actively competes for attention with the rules that
`agent-loops.md` and friends depend on being followed.

### 7. This doc collided while being written, and the collision names a gap in today's fix

`zao-doc-next` was built on 2026-08-21 specifically to stop doc-number collisions,
using a pushed git tag as a compare-and-swap reservation. It reserved **2364** for
this doc at 14:59Z, and the tag is on the remote
(`doc-2364 reserved by MacBook-Air-5 ... agent-memory-management`).

The commit was then **blocked by the repo's own doc-collision guard**: 2364 was
already taken by `ws/zoe-research-2364`, holding a doc slugged
`repo-web-improvement-does-moving-from-a` - output of ZOE's autonomous repo-watch
research loop on the Pi.

**The reservation held; the other writer never asked.** A compare-and-swap only
serialises writers that participate in it, and ZOE's autonomous loop does not call
`zao-doc-next`. So today's fix closes collisions between *humans and lanes using
the tool* and leaves the *autonomous research loop* as an unserialised writer
against the same number space.

Worth stating plainly because it is the same shape as this doc's other findings
and as the whole `.claude/rules/` pattern: **the mechanism existed and the thing
it governs did not route through it.** The repo-side collision guard is what
actually caught this, which is an argument for keeping guards at the commit
boundary rather than trusting reservation alone.

Renumbered to 2365. Not treated as a bug in `zao-doc-next` - it did its job.

## Comparison of compaction strategies

| Strategy | Effect on bytes | Risk | Verdict |
|---|---|---|---|
| **Prose trimming** (what was tried) | -3% measured | None - links preserved | **REJECT.** Futile; it is "summarize everything," the documented loser |
| **Merge lines with `·`** (what past passes did) | Reduces lines, not bytes | Makes entries harder to scan | **REJECT** for size. Optimizes the non-scarce budget |
| **Prune entries duplicated by `.claude/rules/`** | Potentially large | Low - content still on disk + in rules | **ADOPT.** The docs' own guidance ("skips anything your CLAUDE.md files already say") |
| **Prune by age** | Unknown | **High - our mtimes are fake** | **REJECT** unless using `git log --diff-filter=A` |
| **Bulk-delete orphans** | **Zero** - orphans do not load | Destroys recallable knowledge | **REJECT.** Also `no-rm-rf.md`: deletion is Zaal's |
| **Move detail to topic files** | Real, if entries are verbose | None | **ADOPT** where an index line carries a full sentence of detail |

## Honest limits

- **The rules-duplication audit (Decision/Finding 5) has not been run.** It is
  the highest-leverage remaining move and it is a Next Action, not a finding.
  Nothing in this doc claims to know how many of the 211 are duplicates.
- **`/memory` and `/context` were not exercised** in producing this doc. Both are
  the documented audit surfaces and would give a token-level breakdown this doc
  approximates from byte counts.
- The two search-result syntheses (mem0, the "lost in the middle" figure) are
  **PARTIAL** - read via search summaries, not fetched raw. The >30% figure and
  the "prune the junk" phrasing are directionally load-bearing here but were not
  verified against the primary papers, so they are cited as direction, not fact.

## Also See

- [Doc 2036 - context hygiene + cost discipline](../2036-context-hygiene-cost-discipline/) - flagged this exact file at ~20KB on 2026-07-23 with a 2026-07-30 due date. Overdue and unactioned; this doc supersedes its MEMORY.md row with a corrected strategy.
- `.claude/rules/state-claims.md` - the mtime-vs-git-log trap in Finding 4 is its central pattern
- `.claude/rules/recap-followthrough.md` - why 2036's action rotted unnoticed
- `.claude/rules/noisy-signal-guard.md` - the PostToolUse size warning fires every write once near the limit; it is correct here but will become ignorable if the file sits at 79% indefinitely

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the rules-duplication audit: for each of the 211 linked memories, check whether `.claude/rules/*.md` already fully covers it. Done when a list of prune candidates exists with a rule-file citation each | @Zaal (Claude) | Audit | 2026-08-25 |
| Prune the confirmed duplicates from the index (de-link only, never delete the file). Done when MEMORY.md is under 17KB with zero non-duplicate pointers lost | @Zaal | Edit | 2026-08-27 |
| Run `/context` once and record the real token cost of memory files, replacing this doc's byte-count approximation | @Zaal | Measure | 2026-08-25 |
| Add `git log --diff-filter=A` as the canonical memory-age command to `state-claims.md`, since `stat` is actively wrong on this directory | @Zaal (Claude) | Rule PR | 2026-08-25 |
| Make ZOE's autonomous research loop call `zao-doc-next` before claiming a doc number (Finding 7 - it collided with this doc). Done when a loop-written doc carries a reservation tag | @Zaal (Claude) | Fix | 2026-08-27 |

## Sources

- [FULL - `curl` raw markdown, 37,296 bytes, 2026-08-22] [Claude Code docs: How Claude remembers your project](https://code.claude.com/docs/en/memory) - the 200-line/25KB limit, "doesn't load topic files at startup", frontmatter-stripped-before-measuring, over-limit-write-succeeds-but-truncates, the four memory types, `/memory` and `/context`. Both load-bearing quotes grep-verified against the raw file, not a WebFetch summary.
- [FULL - read on disk, 2026-08-22] Local measurement of `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` - 416 files, 211 linked, 190 orphaned, 84 lines, 19,657 bytes; before/after link-count diff of the failed trim pass (212 -> 212).
- [FULL - read on disk] `research/dev-workflows/2036-context-hygiene-cost-discipline/README.md` - the ~20KB figure and the overdue 2026-07-30 action row.
- [FULL - `git log` on zaal-dotfiles] commit `e1b7de5` establishing the bulk-sync mtime artifact that makes `stat` useless for memory age.
- [PARTIAL - search-result summary, primary not fetched] [mem0 - Long-Term Memory for AI Agents](https://mem0.ai/blog/long-term-memory-ai-agents) and [Memory Retrieval Strategies](https://mem0.ai/blog/memory-retrieval-strategies-for-ai-agents) - context dilution, "prune the junk, persist the essence", just-in-time retrieval.
- [PARTIAL - search-result summary] [SmartScope - Claude Code Advanced Best Practices 2026](https://smartscope.blog/en/generative-ai/claude/claude-code-best-practices-advanced-2026/) - the ">30% accuracy drop" lost-in-the-middle figure and the hooks-vs-skills-vs-CLAUDE.md decision framing. Figure NOT traced to a primary paper.
