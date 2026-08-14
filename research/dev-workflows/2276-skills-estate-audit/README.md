---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 154, 2275, 2273
original-query: "audit all 69 skills in ~/.claude/skills for optimization. Find genuine overlap, skills whose description would never fire or fires on everything, last30days at 126KB, skills referencing paths/repos/tools that no longer exist, and anything superseded by what shipped this week. Deliver keep / merge / retire / fix, one line of reasoning each, grounded in a path. Recommend, do NOT delete."
tier: STANDARD
---

# 2276 - The skills estate: four broken, three duplicated, one not ours to touch

> **Goal:** Say which skills to keep, merge, retire or fix, each grounded in a path, without deleting anything.

## Key Decisions

| # | Verdict | Skill | One line |
|---|---|---|---|
| 1 | **RETIRE** | `~/.claude/skills/learned/` | An **empty directory**. Zero files, no manifest, absent from the skills roster |
| 2 | **RETIRE** | `~/.claude/skills/bcz-research/` | Its target `/Users/zaalpanthaki/Desktop/repos/BetterCallZaal/research` **does not exist**, so its first step reads a missing directory |
| 3 | **RETIRE** | `~/.claude/skills/reddit-fetch/` | Documents "curl JSON API fallback" - the exact method proven dead today. `fetch` supersedes it |
| 4 | **MERGE** | `bandz-research` + `bcz-research` -> `zao-research` | Same shape (search a repo's research library, research, save in standard format); only the target path differs. One parameterised skill beats three near-copies |
| 5 | **FIX** | `~/.claude/skills/spawn/` | Contains only `spawn.sh`. **No `SKILL.md` anywhere I searched**, yet it appears in the skills roster |
| 6 | **FIX** | `~/.gstack/analytics/skill-usage.jsonl` | 15 of 59 records carry a blank skill name - a logger writing a record with no subject |
| 7 | **KEEP, DO NOT RESTRUCTURE** | `~/.claude/skills/last30days/` | **Third-party**: MIT, Matt Van Horn, v3.1.1, `github.com/mvanhorn/last30days-skill`. Its 123.5 KB is upstream's design, not ours to refactor |
| 8 | **KEEP** | `autoresearch` | Genuinely distinct from `zao-research` - an iteration loop, not a library search. Not a duplicate |
| 9 | **KEEP** | the 21 gstack symlinks | Verified as gstack's intended layout, not duplication |

## What is actually on disk

`~/.claude/skills` holds **69 entries**, of which 24 are symlinks.

> **Corrected 2026-08-14, same day.** This section originally reported **66 entries** and called the gap against the expected 69 "unexplained". Both numbers were right, and the reason matters more than the count: **`ls -d */` does not list a dangling symlink**, because a broken link is not a directory. 66 + 3 broken links = 69.
>
> The three entries invisible to that count - `find-skills`, `supabase`, `supabase-postgres-best-practices`, all dangling into a `~/.agents/skills/` that does not exist - **are exactly the three that were broken.** The counting method had a blind spot precisely where the defects were.
>
> Found by `zao-skills-check` (`zaal-dotfiles` PR #41) within a minute of it first running. That is the argument for a checker over an audit: a hand audit is a snapshot, and this one was blind in the one place it needed to see. The defect list below should be read as **five**, not two.

### Loaded size is not directory size

This distinction matters and the two rankings disagree completely.

**What enters context on invocation** (the `SKILL.md` body):

| Skill | SKILL.md | Skill | SKILL.md |
|---|---:|---|---:|
| `last30days` | **123.5 KB** | `qa` | 41.0 KB |
| `plan-ceo-review` | 70.7 KB | `meeting` | 38.4 KB |
| `ship` | 54.7 KB | `plan-eng-review` | 35.6 KB |
| `graphify` | 47.4 KB | `plan-design-review` | 33.5 KB |
| `design-review` | 43.4 KB | `retro` | 33.2 KB |
| `office-hours` | 41.9 KB | `zao-research` | 31.7 KB |

**What sits on disk and costs nothing in context:**

| Skill | Disk |
|---|---:|
| `claude-creativity` | 9.9 MB |
| `drunk-claude` | 6.7 MB |
| `claude-is-tripping` | 3.7 MB |

Those three are assets, not prompt. They are a disk question, never a context one, and should not be confused with the list above.

At roughly 4 characters per token, `last30days`' 126,441 bytes is an estimated **~31k tokens per invocation**. That is real, and it is also not ours to fix - see below.

## The four that are broken

### `learned/` - an empty directory

```
$ ls -la ~/.claude/skills/learned/
total 0
```

No `SKILL.md`, no files at all, created 2026-08-11. It cannot fire, and it does not appear in the skills roster. Pure residue.

### `bcz-research` - points at a directory that is gone

Its description names the target explicitly:

> Searches the existing research library in `/Users/zaalpanthaki/Desktop/repos/BetterCallZaal/research/`

Checked today: **MISSING**. The sibling path `/Users/zaalpanthaki/Documents/ZAO OS V1/research` exists. So the skill's own first step reads a directory that is not there - and because a research skill that finds nothing simply reports nothing found, this fails the `silent-failure-guard.md` way: it looks like a clean empty result rather than a broken path.

### `reddit-fetch` - documents a method proven dead today

Its description:

> Fetch content from Reddit using Gemini CLI or curl JSON API fallback. Use when accessing Reddit URLs [...] or when Reddit returns 403/blocked errors.

The curl JSON path is exactly what `zao-fetch-reddit.sh --selftest` reported dead this morning: `public .json: content-type=text/html`. So the skill's remedy for a 403 is the thing that produces the 403's successor. Meanwhile `fetch` (7.2 KB) routes Reddit to `zao-fetch-reddit.sh`, which is now v5 with the OAuth path. Two skills for one job, and the smaller one is wrong.

### `spawn` - listed, but no manifest found

`~/.claude/skills/spawn/` contains one file, `spawn.sh`, and no `SKILL.md`. Yet `spawn` appears in the skills roster with a full description.

**Stating the search rather than the conclusion:** I grepped the description's literal text across `~/.claude` and the only hits were inside session transcripts under `~/.claude/projects/`. I also checked `~/.claude/plugins/` for a `spawn` skill and found none. So: **no manifest found in the locations I searched.** Whether the roster entry is generated from somewhere I did not look is unresolved, and I am not asserting the manifest does not exist.

## The overlap that is real

Three skills share one shape - *check an existing research library, then research, then save in a standard format* - differing only in which repo they point at:

| Skill | Size | Target |
|---|---:|---|
| `zao-research` | 31.7 KB | ZAO ecosystem, 30+ bettercallzaal repos |
| `bcz-research` | 2.8 KB | BetterCallZaal (**path missing**) |
| `bandz-research` | 1.7 KB | "B&Z Builds" |

`zao-research` is the only one carrying the tiering, the fetch-quality gate, the collision-safe numbering and the action bridge. The other two are 2 KB stubs of the same idea without any of the machinery that makes the output trustworthy.

**Merge them into `zao-research` as a target parameter.** A research skill that skips the fetch-quality gate is precisely how a doc gets written off a search snippet, which is the failure `research-grounding.md` exists to prevent.

### Not a duplicate, despite appearances

- **`autoresearch`** (25.9 KB) is Karpathy-style bounded iteration - modify, verify, keep/discard, repeat. It applies to any task, not to research libraries. Different job, keep.
- **`last30days`** (123.5 KB) pulls recent multi-platform sentiment. Also a different job.
- **`bonfire`** overlaps nothing here; it writes to the knowledge graph rather than searching a library.

## `last30days`: the answer is "not ours"

The brief asked whether its 123.5 KB should move into a file the skill reads instead of loading on trigger. The structure supports the instinct - it already ships `scripts/` and `agents/` subdirectories, so externalisation is a pattern it uses.

**But it is third-party.** `LICENSE` reads `MIT License, Copyright (c) 2026 Matt Van Horn`, and the manifest declares `version: "3.1.1"`, `homepage: https://github.com/mvanhorn/last30days-skill`.

Restructuring it would fork someone else's actively-versioned tool and hand us its maintenance forever, to save tokens on a skill whose telemetry shows it is not among the frequently-invoked ones. `code-restraint.md` rung 1: this does not need to exist as our work.

**Recommendation: keep as-is, and pin the version we vendored** so an upstream change is visible rather than silent. If the invocation cost genuinely bites, the correct move is an upstream issue, not a local rewrite.

## What the usage log can and cannot say

`~/.gstack/analytics/skill-usage.jsonl`, 59 records: `investigate` 18, `qa` 10, `browse` 7, `document-release` 3, `ship` 3, `office-hours` 2, `review` 1.

**This log only tracks gstack skills**, because only they carry the telemetry preamble. It says nothing whatsoever about the other ~45. Absence from it is not evidence of disuse - that is exactly the trap `confirm-before-claiming-absence.md` names, and no retirement recommendation in this doc rests on it.

The three retirements above rest on: an empty directory, a missing filesystem path, and a documented method verified dead today. All positive evidence.

**Separate small fix:** 15 of the 59 records have a **blank skill name**. A logger emitting a record with no subject is a quarter of this dataset unusable, and it is the kind of defect that makes the whole log easy to dismiss.

## Supersession check

Cross-referenced against what shipped this week:

| Tool | Skills referencing it |
|---|---|
| `iman` | 6 |
| `agentic-issue` | 4 |
| `zao-lanes` / `zao-lane` | 2 each |
| `zao-topic` | **0** |
| `zao-guard` | **0** |

Nothing is superseded outright. But `zao-topic` at zero references is worth noting - it is the newest primitive and no skill knows it exists yet, which is consistent with doc 2275's finding that it is still only a branch in PR #36.

## Findings

1. **Three skills are actively broken**, each for a different reason, and none of them announce it - an empty dir, a missing path, and a dead method.
2. **The research family is three copies of one idea**, and the two small ones lack every guardrail that makes the large one trustworthy.
3. **Loaded size and disk size rank completely differently**, and conflating them would target the wrong things. The 9.9 MB skill costs nothing per invocation; the 123.5 KB one costs ~31k tokens.
4. **The biggest context cost is not ours to fix.** `last30days` is MIT third-party and actively versioned upstream.
5. **`spawn` is an unresolved anomaly**, reported as a search result rather than a conclusion.
6. **The usage log covers a quarter of the estate and a quarter of its own records are subject-less.**

## Also See

- [Doc 154](../154-skills-commands-master-reference/) - the skills master reference this audit updates
- [Doc 2275](../2275-merging-terminals-topic-consolidation/) - `zao-topic`'s unmerged state, why 0 skills reference it
- [Doc 2273](../2273-reddit-oauth-recovered-from-stash/) - why `reddit-fetch`'s documented method is dead

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Delete `~/.claude/skills/learned/` (empty) and `~/.claude/skills/bcz-research/` (missing target). Deletion is Zaal's - this doc only recommends. | @Zaal | Manual | 2026-08-18 |
| Retire `reddit-fetch`; confirm `fetch` covers every case it claimed first | @Zaal | Manual | 2026-08-18 |
| Fold `bandz-research` into `zao-research` as a target parameter, then retire it | @Zaal | PR | 2026-08-22 |
| Resolve `spawn`: either add the `SKILL.md` its roster entry implies, or establish where that entry comes from | @Zaal | PR | 2026-08-20 |
| Fix the blank-name records in the gstack telemetry logger (15 of 59) | @Zaal | PR | 2026-08-22 |
| Pin the vendored `last30days` version so upstream drift is visible | @Zaal | PR | 2026-08-22 |

## Sources

- `~/.claude/skills/` - **[FULL]** enumerated on disk 2026-08-14: **69 entries** (corrected from 66 - see the note above; `ls -d */` omits dangling symlinks), 24 symlinks of which **3 dangle**, every `SKILL.md` byte-counted, every description frontmatter parsed.
- `zao-skills-check` run against the live directory 2026-08-14 - **[FULL]** method: the tool in `zaal-dotfiles` PR #41. Five findings, exit 1. This is what corrected the count.
- `~/.claude/skills/last30days/LICENSE` and `SKILL.md` frontmatter - **[FULL]** MIT / Matt Van Horn / v3.1.1 / `github.com/mvanhorn/last30days-skill`, read from disk.
- `~/.claude/skills/bcz-research/SKILL.md` + a filesystem check of the path it names - **[FULL]** target confirmed missing.
- `~/.gstack/analytics/skill-usage.jsonl` - **[PARTIAL]** counts carried from the brief's prior pass and not independently recounted; its gstack-only scope is treated as a hard limit on what it can support.
- `~/.claude/plugins/` - **[FULL]** searched for a `spawn` skill, none found.
- Prior pre-checks on the 21 gstack symlinks being byte-identical - **[PARTIAL]** accepted from the brief, not re-verified.

## Credit

`last30days` is **Matt Van Horn**'s (MIT). gstack is **Garry Tan**'s (MIT), vendored. The symlink and telemetry pre-checks that kept this audit from reporting a false duplication finding were done before this pass and are carried forward here.
