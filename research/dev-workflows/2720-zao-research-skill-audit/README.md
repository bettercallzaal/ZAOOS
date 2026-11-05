---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-29
related-docs: "dev-workflows/2475-research-system-internal-audit, dev-workflows/693-zao-research-fetch-quality-audit, dev-workflows/2250-webfetch-summarises-it-does-not-quote, dev-workflows/2459-handoff-artifacts-that-get-consumed, dev-workflows/2585-precompact-context-skills, agents/2470-avoiding-fabrication-agentic, infrastructure/2691-zaoos-graduation-map-2026-10, community/2719-zao-guide-plugz-discord-bot"
original-query: "https://github.com/ZAODEVZ/zao-guide lets research, /zao-research this and lets research the zaoresearch skill please as well (Zaal, relayed by the seat, 2026-10-29)"
tier: STANDARD
---

# 2720 - The /zao-research skill, audited: what it does, where it broke, and the six upgrades

> **Goal:** Describe how the `/zao-research` skill works on 2026-10-29, list where it has failed and what each failure changed, compare it with the published practice for agent research systems, and propose upgrades. Any skill change is a separate zaal-dotfiles PR; none is made here.

Measured Thu 2026-10-29 from the skill as served on this Mac (`~/.claude/skills` is a symlink into the `zaal-dotfiles` working tree, which was on `main` at `36e7a9c`), from ZAOOS origin/main `17e55427d`, and from this lane's own run of the skill an hour earlier on doc [2719](../../community/2719-zao-guide-plugz-discord-bot/).

## Key Decisions

| # | Upgrade | Call | Grounded in |
|---|---|---|---|
| 1 | **Put the research-grounding subagent preamble into the skill, verbatim, at DISPATCH** | DO FIRST | `.claude/rules/research-grounding.md` says every research subagent prompt carries the "REAL FETCHES ONLY" block. A case-insensitive grep of the 7 instruction files (`SKILL.md`, `CHANGELOG.md`, the 5 references; the two index files left out) for `REAL FETCHES`, `fabricated arxiv`, `grounding preamble` and `tool_uses` found 0 hits in each; the same pattern run on `.claude/rules/research-grounding.md`, which carries the preamble, counts 3 lines (command in Reproduce). The DISPATCH template at `references/step-4-research-and-fetch-gate.md:44` spawns subagents with no grounding text at all |
| 2 | **Turn the fetch-marker and `original-query` requirements into a refusing check** (a lint the commit hook runs), not prose | DO | Of the 135 doc READMEs added to ZAOOS main since 2026-09-29 that still exist at `17e55427d` (136 added; one is doc 2661's original folder, renamed in #3913 to `research/agents/2661-north-creek-helper-telegram-bot/`, so the denominator is 135), 109 (81%) carry `original-query:` and 112 (83%) carry a bracketed `[FULL]`/`[PARTIAL]`/`[FAILED]` marker. Both are "Hard Requirements" that every doc "must pass". Doc 2475 decision 4 measured the same split: hooked steps near 100%, honour-system steps 3-40% |
| 3 | **Add a citation pass that checks quotes against saved raw text**, the way Anthropic's research system runs a separate CitationAgent | DO | Anthropic's post: findings go "to a CitationAgent, which processes the documents and research report to identify specific locations for citations". Ours asks the writer to grade its own sources. Raw fetches are already saved to disk in practice (this lane did it for 2719), so the check is a grep, not a model call |
| 4 | **Delete the stale lines that still instruct** | DO | Four, listed in section 3. One is a citation doc 2475 found does not exist, still printed as a "HARD REQUIREMENT" header |
| 5 | **Teach the skill about the two libraries and about private sources** | DO | ZAOOS holds 2,413 doc folders and the private `ZAODEVZ/ZAOresearch` 2,049, with 21 docs only in the private one (doc 2691, line 160). The skill names neither ZAOresearch nor what to do when the source is a private repo going into a public library; doc 2719 had to decide that alone |
| 6 | **Exempt append-only index rows from zao-pr-open's duplicate gate** | DO (tool PR, Zaal merges) | Step 7.5 tells every doc to append one row to `research/<topic>/README.md`. `zao-pr-open` gate 8b refuses any PR sharing a file with an open PR from the last 24 hours, so any two same-topic docs in one day block each other. It happened on 2026-10-29: doc 2719 was refused because of #4203 (doc 2718) |
| - | Embeddings or a vector store for dedup | SKIP | Doc 2475 decision 3 still holds: the failures are scope and ranking, and `zao-research-index` (FTS5 over origin/main) fixed both |
| - | Fan out to many subagents by default | SKIP | Anthropic's own figure: multi-agent systems "use about 15x more tokens than chats" and fit "breadth-first queries". Most ZAO docs are about one repo or one decision. `agent-spend.md` puts a turn at ~$0.15. Keep DISPATCH for hub topics only |

## 1. How the skill works today

It lives at `claude/skills/zao-research/` in zaal-dotfiles: `SKILL.md` (137 lines), five step references (785 lines between them), a 172-line `CHANGELOG.md`, and two index files. Git history on zaal-dotfiles main: 24 commits touching the folder, the first on 2026-06-05 (`915c4a0`, the initial dotfiles import) and the latest on 2026-10-22 (`d7da135`, building the index from origin/main).

Version 2.7.0 (2026-10-10, PR #508) split an 868-line file into the 137-line `SKILL.md` plus references, so the rules fit in the first 5,000 tokens that Claude Code keeps after a compaction. The current docs say exactly that: on compaction Claude Code "re-attaches the most recent invocation of each skill after the summary, keeping the first 5,000 tokens of each", inside a combined 25,000-token budget.

The run, as this lane did it for doc 2719:

| Step | What happens | Tool that enforces it |
|---|---|---|
| 1-1.5 | Pick a tier (QUICK, STANDARD, DEEP, DISPATCH); turn media into a transcript | `zao-ingest.sh` |
| 2 | Dedup against the library and the code | `zao-research-index` (FTS5, rebuilt from origin/main when it moves) |
| 2.5 | Cross-repo search across both GitHub accounts | `gh search code --owner=bettercallzaal --owner=ZAODEVZ` |
| 2.55 | Snapshot a repo source | `zao-research-snapshot` |
| 3 | Reserve the doc number | `zao-doc-next` (a pushed tag), refused at commit by `doc-collision-guard` without one |
| 4 / 4.5 | Fetch, then grade each source FULL/PARTIAL/FAILED before writing | None. Prose gate |
| 5-7 | Frontmatter, staleness, Next Actions with owner and date | None. `zao-doc-actions` reads the table afterwards |
| 7.5 | Re-check the number, verify cited paths, add one index row | `zao-research-health --resolve`, the repo's `research-index` guard |
| 8-9 | Secret scan, commit, PR | `zao-claims-check` and the pre-commit hooks; `zao-pr-open` |
| 9.5 | Tracker card if a Next Action names Zaal | `zao-tracker research` |

The pattern is clear: every step that broke badly enough now has a tool (dedup, numbering, collisions, PR shape), and the steps that are about *source quality* (4, 4.5, 6) are still prose.

## 2. Where it has failed, and what each failure changed

| Date | Failure | What changed | Evidence |
|---|---|---|---|
| 2026-05 | Docs written from metadata, search snippets or 404s; the skill named firecrawl, which was not installed | The fetch ladder and the FULL/PARTIAL/FAILED gate (v2.x) | Doc [693](../693-zao-research-fetch-quality-audit/) decisions 1-3 |
| 2026-06-09 | Two terminals both computed `next=819` and shipped six colliding pairs | A pushed-tag reservation (`zao-doc-next`), then a commit hook that refuses an unreserved number | `references/steps-1-3-search-and-reserve.md` Step 3 history |
| 2026-08-03 | Four research scouts invented arxiv ids, thread numbers and percentages | `.claude/rules/research-grounding.md` and its subagent preamble. **Not carried into the skill** (decision 1) | the rule's own header |
| 2026-08 | WebFetch output quoted as if it were the page | A "never quote from it" box in `references/tools-and-scraping.md:19` | Doc [2250](../2250-webfetch-summarises-it-does-not-quote/) |
| 2026-08-17 | A video source graded FULL at confidence 1.0, and it was not the course it claimed to be | A logged rule that FULL on video or audio needs a named transcript | ZAO's internal mistakes log, entry of that date (private) |
| 2026-08-24 | Step 2.5 mandated an MCP tool called 0 times in 377 transcripts | Replaced by `gh search code` | Doc [2411](../2411-tool-usage-audit-measured/) |
| 2026-09-07 | The dedup grep `research/*/README.md` matched 22 topic indexes and none of the 2,313 docs, for the life of the skill | `zao-research-index` | Doc [2475](../2475-research-system-internal-audit/) decision 1 |
| 2026-09-26 | A re-research agent wrote a third party's personal email into a public doc; the repo's guard caught it | Nothing in the skill: Step 8's scan pattern still covers secrets only | `references/steps-5-9-write-check-commit-pr.md:137`; mistakes log entry of that date |
| 2026-10-29 | Two same-topic docs in one day: the second PR refused by `zao-pr-open` gate 8b over the shared index file | Not yet (decision 6) | this lane, PR for doc 2719 |

The internal mistakes log (360 entries on 2026-10-29) has 6 entries under the shape `fabricated-identifier` and 51 under `trusted-my-own-unexamined-input`. Not every entry is a research run, so read those as the failure families this skill sits inside, not as counts of skill failures.

## 3. Stale lines that still instruct

| Line | What it says | What is true |
|---|---|---|
| `references/steps-5-9-write-check-commit-pr.md:69` | "HARD REQUIREMENT (retrospective 2026-07-03, 5.8:1 research-to-ship ratio)" | Doc 2475 decision 5: that retrospective "does not exist"; the rule should rest on the 25%/87.5% measurement instead |
| `SKILL.md:25` and four `REPO=` lines in the references | The library is `/Users/zaalpanthaki/Documents/ZAO OS V1/research/` | Lanes work in Orca worktrees (this one did). `.claude/rules/explicit-write-target.md` rule 1 asks for an absolute target the caller names; a hard-coded checkout is the cwd problem turned around. USE `git rev-parse --show-toplevel` checked against the ZAOOS origin, or `ZAO_OS_REPO` |
| `research-index.md` and `topics.md`, which `SKILL.md` now points at | "109 research documents" (dated 2026-04-11) | `zao-research-health` on 2026-10-29: 2,408 numbered docs, 218 colliding numbers. Doc 2475 decision 2 said delete both; v2.7.0 instead started linking to them |
| `references/background.md:49` | "126 public repos" across the two accounts | A hand count that will drift; drop the number and keep the command |

## 4. Compared with published practice

Anthropic's "How we built our multi-agent research system" (2025-06-13) is the closest public account of the same job. Four of its points bear on ours:

| Their practice | Quote | Ours |
|---|---|---|
| A separate citation step | "passes all findings to a CitationAgent, which processes the documents and research report to identify specific locations for citations" | The writer grades its own sources. Decision 3 |
| Grade on a rubric, including citation accuracy | "factual accuracy (do claims match sources?), citation accuracy (do the cited sources match the claims?), completeness ..., source quality ..., and tool efficiency" | The Hard Requirements cover form (frontmatter, counts, URLs), not whether a quote is on the page. ZAO already has a read-only evaluator agent (`zao-evaluator`) that could run this rubric |
| Watch source selection | "our early agents consistently chose SEO-optimized content farms over authoritative but less highly-ranked sources" | Our version of this is the GitHub-first source order and the community-source requirement. The latter misfits audits: doc 2719 met it with one discord.js issue, which was relevant but thin |
| Spend multi-agent only where it pays | "multi-agent systems use about 15x more tokens than chats" | DISPATCH is reserved for hub topics. Keep it there |

Simon Willison's notes on the same post (2025-06-14) quote its framing that "the essence of search is compression", which is the reason a subagent's summary should never be the record: the compressing is where invented specifics come in. `research-grounding.md` already says so; the skill does not.

## 5. The upgrades, concretely

1. **Preamble at DISPATCH.** Paste the research-grounding block, plus "write raw fetched text to a file and return its path", into the DISPATCH template and the re-research batch line (`step-4...md:88`).
2. **`zao-research-lint <doc>`**, run by the ZAOOS pre-commit hook on any staged `research/*/NNNN-*/README.md`: refuses a missing `original-query`, a Sources line with no marker, a marker with no method (curl, gh api, API), and an absolute vault or home path. Test it against the 26 docs added since 2026-09-29 that have no `original-query`, and against 2719 and 2720, which should pass.
3. **Citation check.** Raw fetches go to `<scratch>/sources/<n>.txt`. A script finds every quoted span in the doc and greps for it in the source files, printing quotes it could not find. The orchestrator reads the misses. Mechanical, no model call (`code-over-inference.md`).
4. **Stale-line cleanup.** The four rows in section 3, in one PR.
5. **Two libraries, private sources.** Step 2 adds a search of `ZAODEVZ/ZAOresearch` (`gh search code --repo ZAODEVZ/ZAOresearch`) until Zaal rules on the split (doc 2691 decision 1 comes back 2026-11-03). Add a private-source rule: describe structure and behaviour, quote only short config, never code blocks or secrets, and say in the doc's first paragraph that the source is private.
6. **Gate 8b exemption.** In `zao-pr-open`, ignore the shared file when both PRs' only change to it is appended rows in `research/<topic>/README.md`. Add a test that fails on the current gate.

Step 8's scan should also print email addresses and compare them to the `pii-hygiene.md` allowlist. The repo hook covers the staged diff already; the skill step should not claim to be a "secret/PII scan" while matching only secrets.

## Also See

- [Doc 2475 - The research system, audited against itself](../2475-research-system-internal-audit/)
- [Doc 693 - Fetch-quality audit](../693-zao-research-fetch-quality-audit/)
- [Doc 2250 - WebFetch summarises, it does not quote](../2250-webfetch-summarises-it-does-not-quote/)
- [Doc 2470 - Avoiding fabrication in agentic systems](../../agents/2470-avoiding-fabrication-agentic/)
- [Doc 2691 - ZAOOS graduation map](../../infrastructure/2691-zaoos-graduation-map-2026-10/)
- [Doc 2719 - zao-guide / PlugZ, the run this audit watched](../../community/2719-zao-guide-plugz-discord-bot/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Gate 8b exemption for append-only index rows, with a test that fails on the current gate. Done when the zaal-dotfiles PR is open and reviewed; it is a merge guard, so Zaal merges | research lane (7) builds, @Zaal merges | dotfiles PR | 2026-10-31 |
| Upgrades 1 and 4 (preamble at DISPATCH, stale lines) in one skill PR. Done when merged and the live `~/zaal-dotfiles` tree shows it | research lane (7) | dotfiles PR | 2026-11-02 |
| Upgrade 2, `zao-research-lint` plus the hook wiring. Done when the hook refuses a doc with no `original-query`. Hooks are Zaal's merge | research lane (7) builds, @Zaal merges | dotfiles + ZAOOS PR | 2026-11-09 |
| Upgrade 3, the citation check script. Done when it runs on 2719 and 2720 and prints the quotes it could not find | research lane (7) | dotfiles PR | 2026-11-09 |
| Upgrade 5: rule on ZAOresearch vs ZAOOS as the library the skill searches and writes (already due 2026-11-03 under doc 2691) | @Zaal | Decision | 2026-11-03 |

## Sources

- zao-research skill files on this Mac (`SKILL.md`, `CHANGELOG.md`, 5 references, 2 index files) `[FULL]` - read from disk with `cat`/`sed`/`grep`; history with `git -C ~/zaal-dotfiles log origin/main -- claude/skills/zao-research`
- [Anthropic, How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) `[FULL]` - `curl` plus HTML strip to a scratch file, 26,772 characters; every quote above taken from that file
- [Claude Code docs, Skills](https://code.claude.com/docs/en/skills.md) `[FULL]` - raw markdown via `curl`, line 611 quoted
- [Simon Willison, Notes on Anthropic's multi-agent research system](https://simonwillison.net/2025/Jun/14/multi-agent-research-system/) `[FULL]` - community source, `curl` plus HTML strip, 8,437 characters
- [Hacker News thread 44272278](https://news.ycombinator.com/item?id=44272278) `[PARTIAL - Algolia API shows 35 points and 0 comments, so there is no discussion to read]`
- [ZAODEVZ/ZAOresearch README](https://github.com/ZAODEVZ/ZAOresearch) (private) `[PARTIAL - README first 30 lines only]` - `gh api .../readme`
- ZAOOS research library on origin/main `17e55427d` `[FULL]` for docs 2475, 693, 2470 (Key Decisions sections) and 2691 (lines grepped for ZAOresearch); docs resolved with `zao-research-health --resolve`
- 30-day compliance count `[FULL]` - 136 READMEs added since 2026-09-29; 135 exist at `17e55427d` (the 136th, doc 2661's old folder, was renamed by #3913) and are the denominator: 109 with `original-query`, 112 with a bracketed fetch marker, 120 with Next Actions. Commands under Reproduce
- ZAO's internal mistakes log `[FULL]` - read locally, 360 entries, shapes counted with `grep '^shape:'`; private, so cited here by date only

## Reproduce

Run from a ZAOOS checkout that has fetched `17e55427d`. Printed on 2026-10-29: one `UNREADABLE research/agents/2661-<old slug>/README.md` line (the old slug carried a first name that #3913 removed, so it is not repeated here), then `docs=135 unreadable=1 original-query=109 markers=112 next-actions=120`. `docs=` is the denominator; the unreadable path is doc 2661's pre-rename folder (#3913), now `research/agents/2661-north-creek-helper-telegram-bot/`.

```bash
git log origin/main --since=2026-09-29 --diff-filter=A --name-only --format= -- 'research/*/*/README.md' | sort -u \
| while read f; do
    git show "17e55427d:$f" >/dev/null 2>&1 || { echo "UNREADABLE $f" >&2; echo UNREADABLE; continue; }
    c=$(git show "17e55427d:$f")
    printf '%s %s %s\n' "$(grep -c '^original-query:' <<<"$c")" \
      "$(grep -cE '\[(FULL|PARTIAL|FAILED)' <<<"$c")" "$(grep -ciE '^## Next Actions' <<<"$c")"
  done \
| awk '$1=="UNREADABLE"{u++;next}{n++; if($1>0)o++; if($2>0)m++; if($3>0)a++}
       END{print "docs="n, "unreadable="u, "original-query="o, "markers="m, "next-actions="a}'
```

The skill grep, against the 7 instruction files served on this Mac at zaal-dotfiles `36e7a9c` (printed 0 for each), then the same pattern on a file that carries the preamble, as the control (printed 3):

```bash
K=~/.claude/skills/zao-research
P="REAL FETCHES|fabricated arxiv|grounding preamble|tool_uses"
grep -ciE "$P" $K/SKILL.md $K/CHANGELOG.md \
  $K/references/background.md $K/references/step-4-research-and-fetch-gate.md \
  $K/references/steps-1-3-search-and-reserve.md $K/references/steps-5-9-write-check-commit-pr.md \
  $K/references/tools-and-scraping.md
grep -ciE "$P" .claude/rules/research-grounding.md   # control, run from a ZAOOS checkout: 3
```
