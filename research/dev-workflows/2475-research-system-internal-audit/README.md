---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-07
superseded-by:
related-docs: "2474, 2473, 2472, 2421, 2411"
original-query: "can u research how to best ageticly push lanes forward like this /zao-research it and zaoresearch the zaoresarch tool and the docsumetna nd how its all set up together and find a way to make the data be more effecticent in use"
tier: DISPATCH
---

# 2475 - The research system, audited against itself

> **Goal:** Measure the zao-research skill, the 2,205-doc library and the lane
> machinery as ONE machine, and find where the data stops being usable. Internal
> counterpart to doc 2474, which carries the outside view.

## Key decisions

| # | Decision | Grounded in |
|---|---|---|
| 1 | **FIX THE DEDUP GLOB FIRST. It is one character and it invalidates every "no existing research found" this skill has ever returned.** Step 2's `research/*/README.md` is one level deep: it matches **22 files of 2,313**. | `ls */README.md \| wc -l` -> 22; `find . -name README.md \| wc -l` -> 2,313 |
| 2 | **BUILD ONE GENERATED SQLite FTS5 INDEX. Delete the three hand-maintained ones.** Hand-maintenance has failed three separate times in the same week of April 2026 and every instance is still on disk. | `search-index.json` (Apr 5, invalid JSON, 0 readers), `research-index.md` (Apr 11, stops at doc 319), `topics.md` (Apr 11) |
| 3 | **DO NOT BUILD EMBEDDINGS.** Nothing measured here is a semantic-similarity failure. The dedup path is under-scoped (22 files) and the corrected path is over-returning (830K tokens, unranked). Both are scope-and-ranking problems. | `grep -ri "agent" --include=README.md -r .` -> 3,335,401 bytes across 1,303 files in 0.58s |
| 4 | **STOP ADDING HONOR-SYSTEM RULES. Anything worth requiring gets a hook.** Structurally-enforced steps run at ~100%; every honor-system step measures 3-40%. | Step 9 PR format 30/30; `zao-doc-next` 3.6%; tracker rows 6.9%; HR10 25% |
| 5 | **WITHDRAW Hard Requirement 10's citation and re-ground the rule on the real measurement.** The "retrospective 2026-07-03, 5.8:1" does not exist. The rule may still be worth keeping - the case for changing it is the 25%/87.5% data, not the bad footnote. | Searched the library for `5.8`, the vault and skills tree for `5.8:1`, every file dated 2026-07-03, and `git log --since=2026-07-01 --until=2026-07-06`. Only substantive hit is `agents/1038-zoe-scheduler-audit.md`, dated **2026-07-12**, about ZOE's cron scheduler, self-described as "from memory notes" |
| 6 | **INSTALL THE TWO CRON LINES THAT ALREADY EXIST.** `zao-vault-toc` and `zao-grill-queue-drain` are both written, documented, and scheduled nowhere. Zero new code. | `crontab -l \| grep vault` -> only `zao-vault-log`; `~/.zao/vault-toc.txt` has never existed; `GRILL-QUEUE.md` frozen since 2026-09-03 against a 10-card VPS spool |
| 7 | **MAKE THE LANE WATCHER SEND THE TEXT, NOT THE LANE NAMES.** It already has the strings. Naming 14 lanes costs 14 terminal visits; sending the strings costs one read. Never auto-submit - that line stays. | `zao-lanes --json` returned the verbatim held text for 14 of 30 lanes, 2026-09-07 20:0x |
| 8 | **THE BOARD ABSORBS THE OTHER TWO QUEUES.** `needs-zaal.md` becomes a generated view of `route=human`, the way `TOC.md` is generated from the vault. | 0 of 59 board cards appear in `needs-zaal.md`; 45 of 147 grill items do |

## The root failure, and everything downstream of it

The zao-research skill's Step 2 exists to answer one question before any work
starts: **has this already been researched?** It is documented as

```
grep -ri "<topic_keyword>" "/Users/zaalpanthaki/Documents/ZAO OS V1/research/"*/README.md
```

`*/README.md` is one level deep. It reaches the 22 topic-level index files and
never a single doc.

**Every dedup check ever run under this skill searched 22 files out of 2,313 and
reported back that no existing research existed.**

The consequences are measurable and they are not subtle:

- **475 docs (21.5%)** already touch orchestration, multi-agent, retrieval or lanes.
- Docs `2342` (tmux-bridge vs lane-send), `2407` (Orca/tmux lanes), `2278`
  (ambient voice into lane-send) and `2461` (herdr) are all directly on-topic,
  all written in the last three weeks, and were invisible from inside the
  library. They surfaced only via `gh search code` against our own GitHub.
- `_archive/194-claude-code-multi-terminal-management` is titled *"find the best
  ways to track, monitor, and manage multiple Claude Code terminals with minimal
  friction"* - written March 2026, filed in `_archive`. Of its two headline
  recommendations, `claude-squad` is installed and `ccboard` is not.

Correcting the glob does not rescue the step. Run recursively, `grep -ri "agent"`
returns **3,335,401 bytes - roughly 830,000 tokens - across 1,303 of 2,313
files** in 0.58 seconds. Speed was never the problem. A keyword matching 56% of
the corpus has no discriminating power, and no agent can read the result.

**The step is broken in one direction and useless in the other.** That is why
the fix is an index, not a better grep.

## Identity: a doc number does not name a document

| Failure | Count |
|---|---|
| Numbers that resolve to more than one document | **218** |
| Docs carrying an ambiguous id | **462 (21%)** |
| Docs whose `# NNNN` heading disagrees with their own folder number | **12** |

`_archive/194-claude-code-multi-terminal-management/README.md` opens with
`# 165 —`. So "doc 165" and "doc 194" are the same file and neither is a reliable
address. The collisions cluster on the most-cited numbers: doc 601 carries 130
inbound citations and names two unrelated documents.

`zao-research-health --resolve N` exists and works. Hard Requirement 14 already
mandates it. It is the right tool and it is the reason this section is short.

## Freshness, and the tail nobody reads

| | |
|---|---|
| Inside the library's own 30-day SLA | **183 (8.4%)** |
| Stale | 1,302 |
| No `last-validated` field at all | 693 |
| Docs never cited by any other doc's body | **383 (20.7%)**, a floor |

383 is a floor rather than a ceiling: because 218 numbers collide, a citation of
an ambiguous number resolves to one document while its siblings sit at zero.

Growth for context - **798 docs were added in July 2026 alone**, about 26 a day.
The library is compounding faster than anyone revalidates it, and nobody is
revalidating 1,302 docs. The citation-ranked staleness list
(`zao-research-health --stale`) is the only sane entry point, and it already
exists.

## The skill's own cost, and which of its rules survive contact

`SKILL.md` is **45,539 bytes / 808 lines / 7,062 words** - roughly 9,000-11,500
tokens loaded on every single invocation. It mandates **16 checkpoints** (9 steps
plus substeps 1.5, 2.5, 2.55, 2.6, 4.5, 7.5, 9.5) and **14 Hard Requirements**.

Adoption, measured by artifact rather than by instruction:

| Step | Artifact | Measured | Rate |
|---|---|---|---|
| 9 - PR format | PR titles | 30 of 30 sampled match the template | **~100%** |
| 3 - `zao-doc-next` | reservation tags | 79 tags, spanning docs 2361-2474 only | 3.6% |
| 9.5 - tracker row | `legacy_source=research-doc` | ~153 rows | 6.9% |
| 2.55 - snapshot | `people/creators.csv` | **1 day old, 17 rows, 2 repos** | ~0% |
| HR10 - Next Actions | the table | 20 of 50 docs have one; 5 fully pass | 40% / **25%** |
| HR12 - `original-query` | frontmatter | 27 of 50 | 54% |

**The pattern is the finding.** Step 9 is a template with nothing between the
instruction and the action, and it runs at ~100%. Step 3 is backed by a commit
hook (`doc-collision-guard`, which really did block doc 2458 on 2026-09-01) and
its coverage is climbing from a standing start. Everything relying purely on an
author remembering measures between 3% and 40%.

This estate already proved the fix once and wrote it into the skill: Step 2.5
used to mandate `mcp__grep__searchGitHub`, which was measured at **zero calls
across 377 transcripts** and replaced with `gh search code`, the thing people
already reached for. That is the template for every failing step above.

### Hard Requirement 10 rests on a citation that does not exist

The rule reads: *"HARD REQUIREMENT (retrospective 2026-07-03, 5.8:1
research-to-ship ratio)."*

Searched: the entire research library for `5.8`; the vault, the skills tree and
`~/.claude/*.md` for `5.8:1`; every file dated `2026-07-03`; and
`git log --since=2026-07-01 --until=2026-07-06` for retro/ratio/ship.

`5.8:1` appears in exactly two places: the Hard Requirement itself, and
`agents/1038-zoe-scheduler-audit.md`. That doc is dated **2026-07-12**, audits
**ZOE's cron scheduler** rather than the research skill, and says in its own text
that the figure came *"from memory notes"* and *"From user memory
(feedback_assistant_operating_model)"*.

**Wrong date, wrong subsystem, self-described as recalled.** This is the same
failure class as the "$500/$50 anchors" killed on 2026-08-27 for being unsourced.

**Stated precisely, because the distinction matters:** a fabricated citation does
not make the rule wrong. The case for changing HR10 is the measurement below, not
the footnote. But the footnote must go, because a rule that cites a
non-existent retrospective teaches every future doc that invented provenance is
acceptable.

### And the tables that do exist are already dead

Of 64 sampled Next Actions rows carrying a real ISO date, **56 (87.5%) are
already in the past.** `infrastructure/629-streaming-as-main-media-source-flywheel`
has 20 dated rows from 2026-05-16 to 2026-11-01; all but two have passed, none
has a tracker row, and nothing revisits them.

A further **42% of rows use conditional phrasing that evades the banned list
without satisfying it** - "When relevant", "After cron deployed", "After
approval". Only 3.4% use a literally banned string. The ban is being complied
with in letter and evaded in spirit, which is what happens when a rule is
checked by a human reading a list rather than by a hook.

**A static markdown table nobody revisits is not an action bridge.** The fix is
to extend Step 9.5, which already has working idempotent infrastructure, so
actions become queryable rows with due dates instead of present-tense prose.

## Retrieval: what to build

**USE a single SQLite FTS5 index, generated by one script that walks all 2,313
README files**, extracting path, doc number, topic, frontmatter fields where
present, and full body text into an FTS5 virtual table.

- It fixes dedup, because `MATCH ... ORDER BY rank LIMIT 20` turns 830,000 tokens
  into twenty paths in milliseconds.
- It fixes topic-index rot structurally, because a generated index cannot drift
  to the 44-65% gaps that `agents`, `farcaster` and `governance` are at today.
- It works on the **24% of docs with no frontmatter at all**, because it indexes
  body text. A frontmatter-only index would silently miss a quarter of the
  library.
- Frontmatter becomes filter columns for the 76% that have it.

**SKIP repairing `search-index.json`.** Fixing the leading-zero JSON bug buys
nothing: it has zero readers and covers ~202 of 2,205 docs.

**SKIP embeddings and any vector database.** No measured failure here is
semantic. Doc 2474 carries the external evidence: every independent report at or
above our scale converges on FTS5/BM25 first, with a small local embedding model
added only for paraphrase-shaped queries and fused by rank fusion - and one
report at our exact size measured 93.5% precision with FTS5 alone.

**KEEP `zao-research-health`.** It already reports collisions and
citation-ranked staleness correctly and complements the index rather than
duplicating it.

## Where the estate's own rule kept being broken

The signature failure - *"a tool that exists, works, and runs nowhere"* - now has
its **fifth and sixth** recorded instances, both found in this audit:

> **RESOLVED 2026-09-08 by the zj lane. Every row in the table below is now
> false.** Struck in place rather than rewritten, because the point of the table
> was that four instances coexisted and nobody could see them - deleting the
> evidence would delete the finding. Re-measured state is in the second table.

| Tool | State AS AUDITED 2026-09-07 (all four now fixed) |
|---|---|
| `zao-grill-queue-drain` | In `~/bin`, documented, **scheduled nowhere.** `GRILL-QUEUE.md` frozen since 2026-09-03 while the VPS spool holds 10 cards, oldest from 2026-08-16 |
| `zao-vault-toc` | Its own header prescribes an hourly cron. **Never installed** - `~/.zao/vault-toc.txt` has never existed. Third recurrence, per the wrapper's own comments (2026-08-27, 2026-09-04) |
| `zao-lane-watch-all` | Exists, is a `while True` daemon, **no such process running** |
| `zao-lane-journal` | The free no-model overnight digest. **Last output 2026-09-02**, five days stale |

**Re-measured 2026-09-08 22:1x, on the machine:**

| Tool | Now | Evidence |
|---|---|---|
| `zao-grill-queue-drain` | hourly in cron, with a beat | `crontab -l` 1 line; beat 2026-09-08 21:52 |
| `zao-vault-toc` | hourly in cron, with a beat | `crontab -l` 1 line; `~/.zao/vault-toc.txt` EXISTS |
| `zao-lane-watch-all` | running under launchd | `launchctl list` -> pid 26674 |
| `zao-lane-journal` | in cron, output current | newest `~/.zao/lane-journal/2026-09-08.md` |

The VPS spool this table cites is also gone - `grill-queue-spool.jsonl` no longer
exists, and the 10 cards it held were drained into `GRILL-QUEUE.md` on 2026-09-07.

**Two things the fix changed that the audit could not have predicted.**

First, **recommendation 6 was assigned to the wrong person, and the assignment
was itself the blocker.** Both cron lines were routed to `@Zaal | Config` on the
strength of `bin/zao-vault-toc`'s header - *"Zaal installs it; a script must not
edit his crontab."* Asked directly on 2026-09-08 he answered **"lanes may install
cron lines"**, and all of them went in within the hour. The header has been
marked superseded and the rule is now convention 32 in
`zao-vault/notes/orca-organization.md`. **launchd is unchanged and still his.**

Second, **the class is now detected rather than audited by hand.** These four
were found by a person reading `bin/`. `zao-selftest` now scans every tool for a
five-field cron expression in its own header and compares it against the live
crontab and installed launchd agents - and immediately found **two more nobody
had listed**: `zao-tap-digest` (`0 7,17 * * *`, card 190a964e) and
`zao-mirror-reconcile` (`30 3 * * *`, card b6690074), both approved 2026-08-19
and never once executed in the twenty days since. `zao-tap-digest` is the digest
that pages Zaal about lanes waiting on him.

**One acceptance criterion in this doc cannot be met as written**, noted so the
next reader does not chase it. Line ~250 says the drain is shipped *"when
`GRILL-QUEUE.md` mtime is under 2h and the VPS spool is empty"*. Those two are
only simultaneously true in the minutes after a drain that actually found cards:
an empty spool means nothing to append, which means the mtime stays old. The
honest test is the one now running - the cron line exists, the beat is fresh, and
the spool is empty.

And a delivery failure of the same shape: `zao-lane-watch` fired **573 alerts in
25 days and delivered none of them**, because AppleScript-syntax leftovers fell
through its flag parser. Patched 2026-09-07; **end-to-end delivery still
unverified**, which is precisely how it stayed invisible for 25 days.

Every vault-health number this estate has quoted - 976 notes, 40% orphaned,
82 of 102 without a `next:` - is downstream of a tool that has never run on
schedule. Re-measured today: **1,034 notes and 68% orphaned.**

## The queue the human actually reads

| Surface | Items | Overlap |
|---|---|---|
| `## for the grill` across 15 status files | **147** (not ~90) | - |
| `needs-zaal.md` | 73 actionable | **45 of 147** grill items (31%) |
| Board `route=human` | **59** | **0 of 59** appear in `needs-zaal.md` |

`zaostock.md` carries **six** separate `## for the grill` blocks appended over
one day; `obsidian.md` has four. Old blocks are never pruned, so answered
questions sit beside new ones and inflate every count taken from the file.

`needs-zaal.md`'s frontmatter claimed to supersede all three lists. It supersedes
none of the board and about a third of the grill. Corrected in the vault on
2026-09-07 rather than left to be re-cited.

**The board should absorb the other two.** It is the only one of the three with
`route`, `due`, `priority`, a `status` field that can close an item in one place,
and a query interface that is not "grep a markdown file and hope". Every grill
line a lane writes should become a `route: human` card at write time, and
`needs-zaal.md` should become a generated view - which also removes the
"header says 36, table has 37" class of error entirely.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Fix Step 2's glob to a recursive `--include=README.md` search and point it at the FTS index - shipped when the skill file no longer contains `research/"*/README.md` | @Zaal (obsidian lane) | PR | 2026-09-09 |
| Ship `zao-research-index` building SQLite FTS5 over all 2,313 READMEs - shipped when `zao-research-index "herdr"` returns doc 2461 in under 1s | @Zaal (zj lane) | PR | 2026-09-14 |
| Delete `search-index.json`, `skills/zao-research/research-index.md`, `topics.md` - shipped when all three are gone and the skill cites the FTS tool instead | @Zaal (zj lane) | PR | 2026-09-14 |
| Strike the "retrospective 2026-07-03, 5.8:1" citation from HR10 and re-ground it on the 25%/87.5% measurement - shipped when SKILL.md no longer contains "5.8:1" | @Zaal (orchestrator seat) | PR | 2026-09-09 |
| Install the `zao-vault-toc` hourly cron line - shipped when `~/.zao/vault-toc.txt` exists and TOC.md's count matches `find` | @Zaal | Config | 2026-09-08 |
| Schedule `zao-grill-queue-drain` hourly - shipped when `GRILL-QUEUE.md` mtime is under 2h and the VPS spool is empty | @Zaal | Config | 2026-09-08 |
| Make `zao-lane-watch` send the held text per lane in one batched message - shipped when a stall alert names the strings, not the lanes | @Zaal (zj lane) | PR | 2026-09-10 |
| Verify rung-2 Telegram delivery end to end with one synthetic alert - shipped when a test alert is read on the phone | @Zaal | Test | 2026-09-08 |
| Set `ZOE_GRILL_MAX_OUTSTANDING` deliberately after watching the 09:00 UTC batch - shipped when the value is in `.env` with a comment saying why | @Zaal | Config | 2026-09-08 |
| Add a commit hook requiring `original-query` in research frontmatter - shipped when a doc without it is refused | @Zaal (zj lane) | PR | 2026-09-14 |

## Also See

- [Doc 2474](../../agents/2474-agentic-lane-throughput-and-research-retrieval/) - the outside view; FTS5 evidence and the one-human-many-agents literature
- [Doc 2473](../../agents/2473-orchestrator-capability-audit/) - the MCP/skill call audit this doc was briefly and wrongly credited to
- [Doc 2421](../2421-company-brain-hq-vs-zao-vault/) - measured the vault at 561 files two weeks before this doc measured 1,034
- [Doc 2411](../2411-tool-usage-audit-measured/) - the `mcp__grep__searchGitHub` zero-call measurement that is the template for fixing every unadopted step here

## Sources

All internal and measured on 2026-09-07. No external sources - those are in doc 2474.

- Research library, `/Users/zaalpanthaki/Documents/ZAO OS V1/research` [FULL - find/grep/wc on disk]
- `~/.claude/skills/zao-research/SKILL.md` [FULL - read on disk]
- `zao-research-health` [FULL - executed]
- `zao-lanes --json` [FULL - executed, 30 lanes returned]
- `crontab -l`, `launchctl list`, `ps aux` [FULL - executed]
- VPS `/home/zaal/.zao/zoe/backlog-grill-state.json` and `journalctl` for `zoe-bot.service` [FULL - read over ssh]
- Supabase board via `zao-wall.py --json`, 569 open cards, 59 `route=human` [FULL - read-only GET]
- `~/zao-vault` TOC.md, `scripts/rot-scan.py --dry-run`, all 15 `handoffs/status/*.md` [FULL - read on disk]
- `gh api repos/bettercallzaal/zao-website/commits/641cbe8` [FULL - REST]
- `zao-vault-toc` NOT run: it commits, and this audit was read-only [FAILED - deliberately not attempted]
