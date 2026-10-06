---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "2585, 2473, 2276, 1485, 2156, 802"
original-query: "Zaal, orchestrator pane, Tue 6 Oct 2026, verbatim: 'why do we have 2 clipboard skills can we make another tmerinal under orcestrator called skills where we revie all our skill s and how they are performing'"
tier: STANDARD
---

# 2624 - Every skill and how it performs: 30 days of measured use, the clipboard question, overlaps and hygiene

> **Goal:** Answer Zaal's question about the clipboard skills, then list every skill on this Mac with where it lives, whether git holds it, how often it was really used between 6 Sep and 6 Oct 2026, what went wrong when it ran, and which ones should merge or retire. Nothing was deleted, renamed, moved or edited to write this. Every merge or retirement below is a proposal for Zaal.

Written by the skills lane on Tue 6 Oct 2026, 12:57 to 13:30 EDT. Every number comes from a command run in that window. The three scripts that produced them are in [`scripts/`](./scripts/) so the numbers can be re-run. Where a number came from a tool that already existed in `zaal-dotfiles/bin`, the tool is named.

## The answer to the question: there are three, and a stale fourth

| Skill | What it is for (its own SKILL.md) | Used, 6 Sep to 6 Oct | Verdict |
|---|---|---|---|
| `clipboard` | One page per call, with copy buttons, saved to `~/.zao/clipboard/` and to the vault. "Open a clean local browser page with content ready to copy/paste or share." | Loaded 108 times (38 by Claude, 70 typed by Zaal). 712 clips reached the vault between 14 Sep and 6 Oct | KEEP |
| `tclip` | One todo list, rewritten in place, now the note `~/zao-vault/TODAY.md`. Written 24 Sep because "`/clipboard` writes a NEW timestamped file on every call. That is correct for a message ... and wrong for a todo list." | Loaded as a skill 0 times. Its tool `zao-tclip` ran at least 307 times (add 160, done 58, list 46, supersede 31, render 6, title 3, reopen 3) on 11 days since 24 Sep | KEEP, and give it a description |
| `todo-clipboard` | One master page with seven fixed sections, built through the clipboard emitter. Written 21 Sep, three days before tclip | Loaded once, on the day it was written | FOLD into tclip (proposal) |
| ZAOOS `.claude/skills/clipboard` | A copy of `clipboard` last changed 15 Jul (5,637 bytes against 14,856 today) | Never runs on this Mac: the personal copy wins by name | SYNC or drop (proposal) |

Why it looks like two: `tclip` and `todo-clipboard` are both "the one todo page", written three days apart. `tclip/SKILL.md` says so itself: "`todo-clipboard` skill - the seven-section master page, which this supersedes for daily use. Keep it for a full weekly rebuild." No weekly rebuild has been run since: the one load of `todo-clipboard` in the window is 21 Sep.

Why `tclip` shows no description in the skill list: its SKILL.md has no frontmatter at all. It opens with the heading `# /tclip - ONE todo page for today, rewritten in place`. It is the only one of 114 skill files here with no `description:` line. The other names that show no description in a session's list have one on disk; the list dropped it (see Finding 4).

`tclip` is the most-used of the three in practice and the only one Claude can never pick by itself, because it has nothing to match a request against. It works today only because lanes call `zao-tclip` directly.

## Key Decisions

| # | Decision | Evidence | Owner |
|---|---|---|---|
| 1 | **Keep `clipboard` and `tclip`. Add a frontmatter block to `tclip`. Fold `todo-clipboard` into `tclip` as its weekly-rebuild section and archive the folder.** | Table above. `todo-clipboard`: 1 load in 30 days. `tclip`: 0 loads, at least 307 tool runs | Zaal decides the fold; the description fix is a one-line dotfiles PR |
| 2 | **A load count is not a use count. Count the script too.** Skills that wrap a tool are used about ten times more than their load count shows | `clipboard`: 108 loads, 712 clips written. `tclip`: 0 loads, 307 runs. `audit-skill`: 0 loads while `zao-skill-audit` ran 48 times. `fleet-status`: 1 load, `zao-fleet-status` ran 30 times | skills lane: add a script-run column to `zao-skill-audit` |
| 3 | **The grill skills are blocked by our own guard about once in three runs.** They tell Claude to open a picker; `zao-no-picker-guard` refuses it in a lane | `five-minute-grill`: 16 of 35 runs hit the block. `quick-grill`: 4 of 29. `grill-me`: 1 of 1. None of the three SKILL.md files mentions the guard or where a lane should send the question instead | skills lane, one dotfiles PR |
| 4 | **Nine ZAOOS skills are stale copies that nobody on this Mac can run, and they are what a teammate cloning ZAOOS gets.** | 12 names exist in both places; 9 differ; the ZAOOS copies were last changed 15 or 17 Jul (two on 11 Sep). Claude Code docs: "personal over project" | Zaal decides sync or drop |
| 5 | **Of the 40 ZAOOS skills that are not shadowed, one was loaded once in 30 days.** That includes `/worksession`, which CLAUDE.md mandates at session start and a hook asks for in every session | `investigate` 1 load. `worksession` 0 of 713 | Zaal decides whether the mandate stays |
| 6 | **Six skills in daily reach are not in any git repo.** | `computer-use`, `orca-cli`, `orchestration`, `find-skills`, `supabase`, `supabase-postgres-best-practices` are symlinks into `~/.agents/skills`, which is not a git tree | dotfiles lane: track `~/.agents/.skill-lock.json` |
| 7 | **Do not archive on zero loads alone.** 33 of 62 personal skills had zero loads; `tclip` is one of them and is the busiest todo tool we have | Finding 2 | applies to every later prune |

## Method, and the control that was run first

**What was counted.** For each record in `~/.claude/projects/**/*.jsonl` whose own timestamp falls between 2026-09-06 17:01 UTC and 2026-10-06 17:01 UTC:

- a **tool load**: an assistant `tool_use` block with `name: "Skill"`, deduplicated by tool-use id;
- a **typed load**: a user record carrying `<command-name>/x</command-name>`, deduplicated by record id;
- a **scheduled re-fire**: the same shape with a `scheduledTaskId`, counted apart, because it is a `/loop` waking itself and not a person.

**The files.** 11,855 transcript files on disk; 4,582 modified in the last 31 days were read; 159 held at least one load; 0 unreadable; 0 malformed lines; 19 duplicates dropped. Found with a directory walk. The shell glob `ls */*.jsonl` printed a count of 0 from the same directory at the same minute. The prior skills lane recorded the same trap. I did not establish why the glob fails; the directory walk is the instrument.

**The control.** Before trusting any zero, the counter had to find a load known to exist: `clipboard`, used in the orchestrator session this morning. It found it (`TOOL 2026-10-06T15:48:22Z`, launch ok) and two more that day in other sessions.

**The totals.** 1,479 records: 467 tool loads, 246 typed, 766 scheduled re-fires. Of the 246 typed, 121 are built-in commands (`/compact` 85, `/model` 15, `/clear` 6, `/mcp` 6, `/login` 5, `/exit` 3, one other) and 125 are skills.

**A second instrument.** `zao-skill-audit --days 30` (already in `zaal-dotfiles/bin`) was run beside it. It agrees on which skills are used and reads higher on the busy ones: `zao-research` 134 against my 110 tool loads, `clipboard` 42 against 38, `handoff` 60 against 58, `five-minute-grill` 35 against 35. I read its code for the cause: it filters transcript FILES by modification time and then counts every Skill call in them, so a long session touched this week contributes its older calls. Its own output shows it: `bonfire` reads "1 call" in a 30-day window with "last used 2026-08-26". It also does not count typed commands, which is why it shows `clipboard` at 42 where Zaal typed it 70 more times.

**What was not searched.** Sessions on the VPS, the Pi and the Windows desktop keep their own transcripts; none were read. Claude.ai and phone sessions are not in these files.

## Finding 1: what was used

Loads from 6 Sep to 6 Oct, skills only, scheduled re-fires left out. "Subagent" means the load happened inside a spawned agent.

| Skill | Loads | By Claude | Typed | Sessions | Projects | First | Last |
|---|---:|---:|---:|---:|---:|---|---|
| `zao-research` | 122 | 110 (47 subagent) | 12 | 30 | 22 | 09-07 | 10-06 |
| `clipboard` | 108 | 38 | 70 | 47 | 21 | 09-06 | 10-06 |
| `handoff` | 70 | 58 | 12 | 48 | 20 | 09-08 | 10-06 |
| `loop` (bundled) | 41 | 25 | 16 | 18 | 14 | 09-11 | 10-06 |
| `five-minute-grill` | 35 | 35 | 0 | 18 | 14 | 09-21 | 10-05 |
| `precompact` | 32 | 23 | 9 | 16 | 14 | 09-22 | 10-06 |
| `quick-grill` | 29 | 29 | 0 | 21 | 12 | 09-07 | 09-30 |
| `socials` | 17 | 16 | 1 | 13 | 9 | 09-08 | 10-06 |
| `meeting` | 16 | 12 | 4 | 13 | 8 | 09-10 | 09-29 |
| `artifact-design` (bundled) | 16 | 16 | 0 | 11 | 5 | 09-06 | 10-05 |
| `zaal-voice` | 14 | 14 | 0 | 14 | 9 | 09-07 | 10-06 |
| `claude-in-chrome` (bundled) | 7 | 7 | 0 | 7 | 4 | 09-10 | 09-28 |
| `system-audit` | 6 | 6 | 0 | 5 | 3 | 09-07 | 09-13 |
| `setting-secrets` | 6 | 6 | 0 | 6 | 5 | 09-08 | 09-29 |
| `browse` | 6 | 6 | 0 | 5 | 5 | 09-08 | 10-03 |
| `superpowers:brainstorming` | 6 | 6 | 0 | 5 | 5 | 09-09 | 09-29 |
| `newsletter` | 5 | 5 | 0 | 5 | 4 | 09-14 | 09-21 |
| `lane-init`, `vault-health`, `branch-check`, `agentic-issue` | 3 each | | | | | | |
| `autoresearch`, `computer-use` | 2 each | | | | | | |
| `orchestrate`, `orca-cli`, `glue-first`, `pi`, `candy`, `todo-clipboard`, `fleet-status`, `investigate`, `zol`, `capture`, `grill-me` | 1 each | | | | | | |

`loop` also re-fired itself 766 times on a schedule. Those are ticks, not uses, and `.claude/rules/agent-spend.md` prices each one at about a turn.

**By estate:**

| Where | Skills with a SKILL.md | Loaded at least once | Zero loads |
|---|---:|---:|---:|
| Personal, `~/.claude/skills` (a symlink into `zaal-dotfiles/claude/skills`) | 62 | 29 | 33 |
| ZAOOS `.claude/skills`, not shadowed by a personal skill of the same name | 40 | 1 (`investigate`, once) | 39 |
| ZAOOS `.claude/skills`, shadowed | 12 | counted under the personal copy | - |
| Plugin: superpowers 6.4.1 (15 skills) | 15 | 9 skills, 18 loads | 6 |
| Plugin: everything-claude-code 1.10.0 (183 skills, 79 commands) | 183 | 1 (`seo`, once) | 182 |
| Plugins: caveman, oh-my-mermaid, connect-apps | 15 | 0 | 15 |
| claude.ai synced (`anthropic-skills:*`, 14 names) | 14 | 2 names, 3 loads, 1 of them failed | 12 |

caveman runs from a SessionStart hook, so zero loads there does not mean it is idle.

## Finding 2: a load is not a use

A skill that wraps a script gets loaded once per session and then the script is called directly. Counting Bash commands that name the script, same window, same deduplication (`scripts/script-runs.py`):

| Script | Bash commands naming it | Skill loads |
|---|---:|---:|
| `clipboard-emit.sh` | 1,098 (316 of them in the dotfiles lane, where the emitter was being built and tested) | 108 |
| `zao-tclip` | 561 (at least 307 are real subcommand runs; the rest read or mention the file) | 0 |
| `handoff-build.sh` | 73 | 70 |
| `zao-skill-audit` | 48 | 0 (`audit-skill`) |
| `zao-fleet-status` | 30 | 1 (`fleet-status`) |

So "zero loads" means two different things. For a prose-only skill (`critique`, `bio`, `seat`) it means nobody reached for it. For a skill with a tool behind it, it can mean the tool outgrew the skill. Any prune has to check which.

## Finding 3: what went wrong when skills ran

**Method.** For each of the 713 loads, the counter read on through the same transcript to the next prompt typed by a person, and recorded: whether the launch itself failed, how many tool calls returned an error, whether the run was interrupted, whether the same skill was loaded again, and the text of that next prompt. An error in that stretch is not proof the skill caused it, so the error texts were then read by hand for the busy skills. No score is given; these are counts.

**Launch.** 2 of 467 tool loads failed to launch, both "Unknown skill": `orca-cli` on 2026-09-10 and `anthropic-skills:computer-use` on 2026-10-06.

**Errors before the next prompt.** 180 of 713 runs (25 percent) had at least one failed tool call before the person spoke again.

| Skill | Runs | Runs with a tool error | What the errors were, read by hand |
|---|---:|---:|---|
| `zao-research` | 122 | 43 | Environment, not the skill: a subagent trying to fork again (4), the Playwright bridge not installed (2), a guard refusing a missing `timeout` binary (2), JSON parse failures on fetches |
| `clipboard` | 108 | 7 | The commit-SHA guard refusing an id that was not a commit (3), one permission denial. 5 runs loaded the skill a second time before the next prompt |
| `handoff` | 70 | 6 | One real skill defect: `no matches found: /tmp/handoff-git-*.txt`, the step the prior skills lane fixed in zaal-dotfiles #244 (the date of this one instance was not checked). 2 runs interrupted |
| `five-minute-grill` | 35 | 19 | **16 are `BLOCKED by zao-no-picker-guard: a lane does not open a picker in a pane nobody is watching`** |
| `precompact` | 32 | 5 | A denied `git push` to the vault, one interrupted call |
| `quick-grill` | 29 | 14 | Picker guard (4), expired MCP sign-ins (2), the auto-mode classifier (2) |
| `socials` | 17 | 7 | Missing media files, one interrupted call |
| `meeting` | 16 | 2 | Recording downloads: a Drive page with no text, a download command not found |
| `browse` | 6 | 4 | `scheme "file:" is not allowed`, `Unable to connect`, and two runs inside an isolated agent worktree |
| `setting-secrets` | 6 | 3 | Permission denials on reading key files, which is the guard working |

The picker block is the one pattern that is the skill's own. The guard arrived on 2026-09-14 (zaal-dotfiles #231). The blocks run from 21 Sep to 5 Oct, in at least six different lanes. The three grill skills still say to ask through the picker (`AskUserQuestion` is on 2, 4 and 2 lines of them) and none says what a lane should do instead. Today's standing instruction for lanes is to send decisions to the Grill session; the skills do not know that.

**Did the person correct it?** A keyword match on the next prompt ("no", "wrong", "fix", "again", "still" and similar) flagged 30 of the 713. I read 23 of the 30. Two were corrections of what the skill had just produced:

- `setting-secrets`, 2026-09-08: "terminal didnt open up right to me pasting in the secret".
- `socials`, 2026-09-22: the reply began "no i posted about the boutny already", so the draft was for the wrong job.

One was a re-request ("can we grill again"). The other 20 were new tasks that happened to contain "fix" or "still". So the keyword match is right about one time in eleven and is not a usable instrument by itself; the two real corrections are the finding, not the 30.

**What this cannot see.** Whether a run that finished without errors produced something good. A lane's "next prompt" is often typed by another session through Orca, and the transcript does not say who typed it.

## Finding 4: the list every session loads has dropped most descriptions

Claude Code docs, fetched raw today: "The listing always contains every skill name, but if you have many skills, Claude Code drops some descriptions to fit the listing's character budget, which removes the keywords Claude needs to match your request. The budget scales at 1% of the model's context window. When the listing overflows, Claude Code drops descriptions starting with the skills you invoke least."

In this session's list, read from the session itself on 6 Oct: 19 of the 62 personal skills show a description and 43 show a name only. 5 of the 34 listed ZAOOS skills show one. None of the everything-claude-code names do.

That is the same shape doc 2585 measured on 4 Oct (355 entries, 50 with a description). Two things are new here:

- The 19 that kept their text are the 19 most-loaded. A skill that is rarely loaded loses the words Claude would match on, so it gets loaded less. A new skill starts at zero.
- `~/.claude/settings.json` holds 208 `skillOverrides` entries, all `"off"`, all for everything-claude-code, and this session still lists that plugin's names. Doc 2585 found the same and left the cause open. It is still open.

## Finding 5: overlaps

Each row cites the skill's own description. "Loads" is 6 Sep to 6 Oct.

| Group | Members (loads) | What each says | Recommendation |
|---|---|---|---|
| **Todo pages** | `tclip` (0, tool 307), `todo-clipboard` (1) | Both "one page" for todos; tclip says it supersedes the other "for daily use" | FOLD `todo-clipboard` into `tclip` |
| **Grills** | `five-minute-grill` (35), `quick-grill` (29), `grill-me` (1) | The first two name each other and split cleanly: one question at a time and recursive, against batches of four independent ones. `grill-me` is a spec interrogation, "deeper and slower than quick-grill" | KEEP all three. Fix the picker instruction in all three |
| **Orchestration names** | `orchestrate` (1), `orchestrator` (0), `orchestration` (0), `seat` (0) | `orchestrate`: "the cross-lane picture". `orchestrator`: "run two or more independent coding tasks in parallel". `orchestration`: Orca's own worker-coordination skill (stablyai). `seat`: how to hold the seat | Three near-identical names for three different jobs. RENAME is the fix, not a merge: proposal `orchestrator` to `parallel-build`. `orchestrate` overlaps the next row |
| **Where is everything** | `system-audit` (6), `orchestrate` (1), `fleet-status` (1, tool 30), ZAOOS `z` (0), `catchup` (0), `morning` (0), `standup` (0) | All answer "what is the state right now". `system-audit`: "every Orca terminal, every open repo, every open issue and PR". `orchestrate`: "which terminals are alive, which are blocked on Zaal". `fleet-status`: "one table of every live Claude session" | FOLD `orchestrate` into `system-audit`. KEEP `fleet-status` (it is the context-percent table). RETIRE the four ZAOOS ones: last changed March to May, zero loads |
| **Handoff** | `handoff` (70), `precompact` (32) | `precompact` writes the status-file section and then calls `/handoff` for the bundle | KEEP both. Not a duplicate: one wraps the other |
| **Design** | `design` (0), `design-review` (0), ZAOOS `plan-design-review` (0), `design-consultation` (0), `design-steal` (0), `21st` (0), `critique` (0) | Seven skills, zero loads between them. Four are gstack's and split by gstack's own design. `design` and `design-steal` both start from a reference site | No action until a design job runs. If pruning: `design` and `design-steal` are the pair to merge |
| **Review** | `review` (0, gstack), `~/.claude/commands/review.md`, bundled `/code-review`, `everything-claude-code:code-review` (0), `audit-skill` (0) | Four things answer `/review`. Docs: a personal skill beats a command file of the same name, so `commands/review.md` can never run | The user command file is dead weight. `secure.md` beside it is also in no git repo |
| **Research** | `zao-research` (122), `bcz-research` (0), `autoresearch` (2), `fetch` (0) | Doc 2276 asked for `bcz-research` to merge into `zao-research` on 14 Aug. Not done. `autoresearch` is an iteration loop, not a library search (doc 2276 said keep; still true). `fetch` is the URL router that `zao-research` uses internally | FOLD `bcz-research` into `zao-research` (repeat of doc 2276) |
| **computer-use, three times** | personal `computer-use` (2, stablyai/orca), `anthropic-skills:computer-use` (1, failed), two more copies in `.trash/` | Same name from two vendors; the claude.ai one failed to launch today | Leave the names; the docs say a local skill wins over a synced one. Clear `.trash/` (Zaal's hands) |
| **Capture** | `capture` (1), ZAOOS `inbox` (0), `meeting` (16) | `capture` and `meeting` name each other and split on whether there were attendees | KEEP |

## Finding 6: hygiene

**Not in git** (`vanishing-dependencies.md` rule 1):

| What | State | Risk |
|---|---|---|
| `~/.agents/skills/` holding 6 skills the personal tree symlinks to | Not a git tree. Installed by the `skills` CLI; `~/.agents/.skill-lock.json` records source repo and folder hash for each | Recoverable only while that lock file survives. The lock file is itself untracked |
| `~/.claude/commands/review.md`, `secure.md` | A real directory, not a symlink into dotfiles; no repo holds them | Low: `review.md` is shadowed anyway |
| `zaal-dotfiles/claude/skills/synced/` (674 files) and `.trash/` (22 files) | Untracked and not ignored, inside the shared dotfiles tree. `git check-ignore` printed nothing for either; the inventory script counted 0 ignored files in both | They are Claude Code's claude.ai sync and its trash. They show as `??` in `git status` for every lane and are one `git add .` away from being committed |
| The dotfiles main checkout | Dirty at 12:57 today: `bin/zao-auto-resolve`, `claude/settings.json`, `claude/memory/zaoos/MEMORY.md` modified. That tree is live config for every session. Reported, not touched | - |

Everything else is tracked: 53 of the 62 personal skills have their SKILL.md in `zaal-dotfiles` (6 are the `~/.agents` symlinks, 3 are KorroAi submodules pinned by gitlink), and all 52 ZAOOS skills are in ZAOOS.

**Malformed or broken** (`zao-skills-check`, exit 1, plus the inventory):

- `learned/` is an empty directory and `spawn/` holds `spawn.sh` with no SKILL.md. Doc 2276 flagged both on 2026-08-14. Both are still there 53 days later.
- ZAOOS `.claude/skills/next-best-practices` is a symlink to `../../.agents/skills/next-best-practices`, which does not exist. It reads as an installed skill in `ls`.
- ZAOOS has four more folders with no SKILL.md: `evals/`, `gitnexus/` (six nested skill folders for a tool CLAUDE.md lists as disabled), `zao-os/`, `zao-stock/`.
- Three skill files are named `skill.md` in lower case: personal `socials`, ZAOOS `socials` and `newsletter`. macOS does not care. Whether a Linux checkout (the VPS, a teammate) loads them was not tested.
- `zao-skill-paths` exits 1: 136 home paths cited by skills, 20 missing, 18 known and explained, **2 new**: `fetch` names `~/.claude/skills/last30days/` (archived), and `clipboard` names `~/.zao/clipboard-workspace` (added by zaal-dotfiles #422 yesterday; probably created on first use, not verified). 12 entries in its known-list are stale.

**Retired names.** The inventory searched every file under every skill folder for the names in the "Retired - do not reference" section of `~/.claude/CLAUDE.md`, case-insensitive. The names are not repeated here. One of them, the act that did not show, has no hit anywhere. Hits for the others:

| File | Line | What it is | Action |
|---|---|---|---|
| ZAOOS `.claude/skills/big-win/SKILL.md` | 85 | Live guidance: lists the wound-down platform among brands to "always capitalize properly" in Big Win copy | REMOVE the name. This is the one that can put it back into drafted copy |
| personal `meeting/references/lane-map.json` | 40-42 | Live routing: sends meeting items with grant keywords to that platform's lane | REMOVE or point at finance, where the one live follow-up sits |
| ZAOOS `.claude/skills/zao-stock/zao-stock.md` | - | A retired partner in a folder that is not a loadable skill | Goes with the folder |
| personal `meeting/SKILL.md` 709 and `scripts/lane-weigh-in.py` 335 | | An incident note naming the lane that committed | History. Leave |
| `zao-research/research-index.md` and `topics.md`, both copies | 10 rows | Titles of old research docs | History. Leave, per the glossary: "existing history ... is left as it is" |

**Over the 5,000-token re-attach limit.** Claude Code docs: after a compaction it re-attaches each invoked skill "keeping the first 5,000 tokens of each". Sizes are bytes divided by four, an estimate.

- Personal, 8: `meeting` 17,408; `zao-research` 12,412; `design-review` 11,035; `review` 6,676; `autoresearch` 6,626; `gstack` 6,600; `browse` 5,468; `handoff` 5,426. The same eight doc 2585 named. `zao-skill-compaction-test` passes 7 of 7 with its two red controls, and it covers three of the eight (`zao-research`, `handoff`, `meeting`). The other five are vendored or unused.
- ZAOOS, 19: `plan-ceo-review` 18,088; `ship` 14,011; `design-review` 11,104; `office-hours` 10,728; `qa` 10,486; `plan-eng-review` 9,102; `plan-design-review` 8,568; `retro` 8,505; `meeting` 8,459; `zao-research` 8,385; `design-consultation` 7,684; `qa-only` 6,801; `review` 6,676; `codex` 6,666; `autoresearch` 6,626; `gstack` 6,576; `document-release` 6,523; `handoff` 5,725; `browse` 5,468. Fifteen are gstack's and not ours to restructure.

**Total on disk:** about 175,000 tokens of SKILL.md in the personal tree and 217,000 in ZAOOS. That is disk, not context: a body costs nothing until it is loaded.

**The 12 shadowed ZAOOS copies:**

| Skill | Personal copy | ZAOOS copy | Same? |
|---|---|---|---|
| `autoresearch`, `browse`, `review` | - | - | byte-identical |
| `clipboard` | 14,856 bytes, 2026-10-05 | 5,637 bytes, 2026-07-15 | no |
| `meeting` | 69,632 bytes, 2026-10-04 | 33,837 bytes, 2026-07-17 | no |
| `zao-research` | 49,650 bytes, 2026-10-04 | 33,539 bytes, 2026-07-17 | no |
| `handoff` | 21,705 bytes, 2026-10-04 | 22,901 bytes, 2026-07-15 | no |
| `bonfire` | 10,364 bytes, 2026-09-11 | 5,502 bytes, 2026-07-17 | no |
| `newsletter` | 14,868 bytes, 2026-09-16 | 10,327 bytes, 2026-09-11 | no |
| `socials` | 9,367 bytes, 2026-09-11 | 11,179 bytes, 2026-09-11 | no |
| `design-review` | 44,141 bytes, 2026-09-12 | 44,415 bytes, 2026-07-15 | no |
| `gstack` | 26,400 bytes, 2026-09-20 | 26,305 bytes, 2026-07-15 | no |

The ZAOOS `zao-research` copy is the sharp one. The personal copy was reworked on 4 Oct so its Hard Requirements sit above the re-attach cut (doc 2585; the compaction test asserts it); the ZAOOS copy predates every fix since July. Anyone who runs `/zao-research` from a fresh ZAOOS clone on another machine gets the July rules.

## Every skill

Dates are from git: "created" is the commit that added the SKILL.md (`git log --diff-filter=A --follow`), "last change" is its latest commit. File modification times were not used. Many personal skills show 2026-06-05 as created because that is the commit that first put the tree into `zaal-dotfiles`; they are older than that and the true date is not in this repo. Descriptions are cut at 95 characters; dashes and one emoji in them were replaced, and host details were removed, because this repo is public.

### Personal: `~/.claude/skills` (zaal-dotfiles `main` at `71f4933`)

| Skill | Source | In git | Created | Last change | ~Tokens | Loads 30d (tool + typed) | What it says it does | Note |
|---|---|---|---|---|---:|---:|---|---|
| `.gstack` | - | no | - | - | - | - | (not a skill: no SKILL.md) | Two ignored log files |
| `.trash` | - | no | - | - | - | - | (not a skill: no SKILL.md) | **Untracked, not ignored.** 10 directories, copies of claude.ai synced skills |
| `21st` | own | yes | 2026-06-05 | 2026-06-05 | 1,644 | 0 + 0 | Search, generate, and adapt UI components from 21st.dev's marketplace + Magic MCP for ZAO surfa |  |
| `a2a` | own | yes | 2026-08-03 | 2026-09-12 | 1,127 | 0 + 0 | Coordinate with an external partner's AI agent over the tasern.quest message bus (a partner's coordin |  |
| `agentic-issue` | own | yes | 2026-08-12 | 2026-08-12 | 1,520 | 3 + 0 | Log an agentic infrastructure problem so it changes future decisions instead of evaporating. Se |  |
| `ask-gpt` | own | yes | 2026-06-05 | 2026-06-05 | 1,302 | 0 + 0 | Send a prompt to the user's ChatGPT (GPT-5 via codex CLI, ChatGPT-account auth, no API costs).  |  |
| `audit-skill` | own | yes | 2026-06-05 | 2026-09-11 | 4,600 | 0 + 0 | Audit Claude skills against Anthropic's official best practices. Use when asked to audit, revie | Zero loads. `zao-skill-audit` ran 48 times directly |
| `autoresearch` | own | yes | 2026-06-05 | 2026-06-05 | 6,626 | 2 + 0 | Autonomous Goal-directed Iteration. Apply Karpathy's autoresearch principles to ANY task. Loops | Byte-identical to the ZAOOS copy. Over the cut |
| `bcz-research` | own | yes | 2026-06-05 | 2026-08-21 | 731 | 0 + 0 | Research skill for BetterCallZaal. Searches the existing research library in /Users/zaalpanthak | Doc 2276 said retire on 2026-08-14 (target missing). Target exists today; still zero loads |
| `bcz-yapz-description` | own | yes | 2026-06-05 | 2026-06-05 | 4,002 | 0 + 0 | Render a BCZ YapZ YouTube description + tags from a transcript file. Input a transcript slug (e |  |
| `bio` | own | yes | 2026-08-03 | 2026-09-27 | 2,146 | 0 + 0 | Generate a grounded, copy-paste-ready Zaal bio / author profile / new-group intro / warm DM int |  |
| `bonfire` | own | yes | 2026-06-05 | 2026-09-11 | 2,591 | 0 + 0 | Post episodes to the ZABAL Bonfire knowledge graph (zabal.bonfires.ai), recall from it, or expl |  |
| `branch-check` | own | yes | 2026-09-21 | 2026-09-21 | 1,005 | 3 + 0 | Before committing to an EXISTING branch or pushing one, prove it is safe - its PR is not alread |  |
| `browse` | gstack symlink | yes | 2026-06-05 | 2026-06-05 | 5,468 | 6 + 0 | Fast headless browser for QA testing and site dogfooding. Navigate any URL, interact with eleme | gstack symlink. 4 of 6 runs hit a tool error |
| `candy` | own | yes | 2026-09-07 | 2026-09-07 | 1,385 | 1 + 0 | The WaveWarZ bus - the working channel between Zaal and Candy (Samantha), who owns wavewarz.inf |  |
| `capture` | own | yes | 2026-06-05 | 2026-09-12 | 4,294 | 1 + 0 | File content-as-source (Reels, YouTube, podcasts, articles, pasted transcripts) as a research/c |  |
| `claude-creativity` | submodule | gitlink | - | - | 1,795 | 0 + 0 | Transform Claude into a radical creative genius that delivers surprising, elegant, non-obvious  | Third-party submodule (KorroAi, MIT). Zero loads |
| `claude-is-tripping` | submodule | gitlink | - | - | 2,290 | 0 + 0 | Universal breakthrough engine. 3 agents collide + verification. Always presents idea menu BEF | Third-party submodule (KorroAi, MIT). Zero loads. Emoji in its description |
| `clipboard` | own | yes | 2026-06-05 | 2026-10-05 | 3,714 | 38 + 70 | Open a clean local browser page with content ready to copy/paste or share. Every call also save | KEEP. Emitter ran 1,098 times in the window; the load count understates it tenfold |
| `cloud-relay` | own | yes | 2026-08-17 | 2026-08-17 | 1,341 | 0 + 0 | Message another Claude session (cloud, local lane, or Remote Control) and route answers back -  |  |
| `cold-outreach` | own | yes | 2026-06-05 | 2026-06-05 | 3,997 | 0 + 0 | ZAO agentic cold-outreach kit. Research one target (LinkedIn URL / email / Twitter handle), dra | Stale: logs touches to Airtable (11 mentions); the CRM moved to Supabase. Zero loads |
| `computer-use` | `~/.agents` symlink | NO | - | - | 466 | 2 + 0 | OS/window-level inspection and input in visible local app windows through `orca computer`: nati | **Not in git.** Symlink to `~/.agents/skills` (stablyai/orca). Same name as a claude.ai synced skill |
| `coworkvps` | own | yes | 2026-06-05 | 2026-09-09 | 1,542 | 0 + 0 | Operate the @ZAOcoworkingBot deployment (cowork-agent.service) on the ONE ZAO VPS, <ip> |  |
| `critique` | own | yes | 2026-08-24 | 2026-08-24 | 2,221 | 0 + 0 | Attack your own output against a written standard BEFORE shipping it, then rebuild from the cri |  |
| `design` | own | yes | 2026-06-05 | 2026-09-11 | 1,232 | 0 + 0 | Looks at a codebase (current working directory) plus a reference website URL, then proposes THR |  |
| `design-review` | gstack symlink | yes | 2026-06-05 | 2026-09-12 | 11,035 | 0 + 0 | Designer's eye QA on a live surface: visual inconsistency, spacing, hierarchy, AI slop, slow in | gstack symlink. Zero loads. Over the cut |
| `desktop-checkin` | own | yes | 2026-08-01 | 2026-08-01 | 992 | 0 + 0 | Check in on Zaal's always-on DESKTOP Claude Code session over Claude in Chrome - open it, read  |  |
| `drunk-claude` | submodule | gitlink | - | - | 1,996 | 0 + 0 | Unleash Drunk Claude - the unfiltered, slightly tipsy genius who delivers absurdly wild ideas t | Third-party submodule (KorroAi, MIT). Zero loads |
| `fetch` | own | yes | 2026-06-05 | 2026-09-27 | 1,940 | 0 + 0 | ZAO universal URL fetcher - picks the right tool per URL when WebFetch is blocked. Routes Reddi | Names `~/.claude/skills/last30days/`, which is archived (`zao-skill-paths` reports it missing) |
| `find-skills` | `~/.agents` symlink | NO | - | - | 1,362 | 0 + 0 | Helps users discover and install agent skills when they ask questions like "how do I do X", "fi | **Not in git.** Symlink to `~/.agents/skills` (vercel-labs/skills). Zero loads |
| `five-minute-grill` | own | yes | 2026-09-21 | 2026-09-30 | 1,697 | 35 + 0 | A five-minute decision grill, one question at a time, RECURSIVE - each answer re-ranks the rema | FIX. The picker guard blocked its question in 16 of 35 runs |
| `fleet-status` | own | yes | 2026-09-26 | 2026-09-26 | 786 | 0 + 1 | One table of every live Claude session on this Mac - state, context percent, what it is doing,  | One typed use. `zao-fleet-status` ran 30 times directly |
| `fractal` | own | yes | 2026-06-05 | 2026-09-11 | 2,258 | 0 + 0 | Ingest a new fractal-governance resource (URL, repo, person, community, tool) and add it to the |  |
| `glue-first` | own | yes | 2026-08-27 | 2026-09-12 | 1,433 | 1 + 0 | Glue open-source projects together instead of writing fresh code. Use BEFORE any lane writes mo |  |
| `grill-me` | own | yes | 2026-09-10 | 2026-09-10 | 2,724 | 1 + 0 | Interrogate an idea until the ambiguity is gone, then produce a specification, architecture, af | Picker guard blocked its one run |
| `gstack` | own | yes | 2026-06-05 | 2026-09-20 | 6,600 | 0 + 0 | Fast headless browser for QA and dogfooding: navigate, interact, assert element state, diff bef | Vendored gstack <ip> (Garry Tan, MIT). Zero loads of the umbrella skill |
| `handoff` | own | yes | 2026-06-05 | 2026-10-04 | 5,426 | 58 + 12 | Compress this session into a portable bundle that another session, another machine, or ZOE resu | KEEP. Over the cut by about 400 tokens; compaction test passes |
| `iman` | own | yes | 2026-08-14 | 2026-09-20 | 1,456 | 0 + 0 | Work with Iman without the stall. Reads the real state before replying, answers every open ask, |  |
| `lane-init` | own | yes | 2026-09-01 | 2026-09-09 | 2,233 | 3 + 0 | Author a lane's founding brief by MEASURING the world rather than recalling it. Produces the br |  |
| `learned` | - | no | - | - | - | - | (not a skill: no SKILL.md) | Empty directory. Flagged in doc 2276 on 2026-08-14, still here |
| `meeting` | own | yes | 2026-06-05 | 2026-10-04 | 17,408 | 12 + 4 | Turn a meeting recording or transcript (voice memo, Craig, Fathom URL, Drive file, pasted text) | KEEP. Largest skill here. One live routing entry still names a retired partner (see Hygiene) |
| `newsletter` | own | yes | 2026-08-10 | 2026-09-16 | 3,717 | 5 + 0 | Draft, verify and refine a ZAO newsletter edition on Paragraph - measures the date and every fi | KEEP |
| `orca-cli` | `~/.agents` symlink | NO | - | - | 868 | 1 + 0 | Operate Orca-managed worktrees, folder contexts, terminals, repos, automations, artifacts, skil | **Not in git.** Symlink to `~/.agents/skills` (stablyai/orca). Failed to launch once, 2026-09-10 (`Unknown skill`) |
| `orchestrate` | own | yes | 2026-08-12 | 2026-09-11 | 1,368 | 1 + 0 | The cross-lane picture - which terminals are alive, which are blocked on Zaal, which are stale, | One load. Overlaps system-audit and fleet-status |
| `orchestration` | `~/.agents` symlink | NO | - | - | 811 | 0 + 0 | Coordinate supervised Orca workers: threaded messages, blocking ask/reply, task dispatch, worke | **Not in git.** Symlink to `~/.agents/skills` (stablyai/orca). Zero loads |
| `orchestrator` | own | yes | 2026-08-27 | 2026-09-12 | 3,692 | 0 + 0 | Run two or more independent coding tasks in parallel with built-in security review, code review | Zero loads. Near-name of orchestrate and orchestration |
| `pi` | own | yes | 2026-06-18 | 2026-09-12 | 1,319 | 1 + 0 | SSH to the Raspberry Pi (over Tailscale) and start Claude Code there in a new |  |
| `platform` | own | yes | 2026-07-05 | 2026-07-05 | 707 | 0 + 0 | Load one social platform's full context (voice, audience, goals, adapter) on demand. Trigger: / |  |
| `precompact` | own | yes | 2026-09-21 | 2026-10-04 | 2,712 | 23 + 9 | Preserve a session's memory in the Obsidian vault before /compact - assess the whole situation, | KEEP. Doc 2585 covers its reach |
| `quick-grill` | own | yes | 2026-08-12 | 2026-09-30 | 1,969 | 29 + 0 | Clear a decision backlog by tapping, not typing. Fires batches of up to 4 independent questions | FIX. Picker guard blocked 4 of 29 runs |
| `review` | gstack symlink | yes | 2026-06-05 | 2026-06-05 | 6,676 | 0 + 0 | Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust boundary | gstack symlink. Zero loads. Over the cut. Name also used by a user command and a bundled alias |
| `seat` | own | yes | 2026-09-20 | 2026-09-20 | 2,838 | 0 + 0 | Hold the orchestrator seat over time - what to do when a peer hands you authority Zaal never gr | Zero loads as a skill; the seat's rules are read from the vault instead |
| `setting-secrets` | own | yes | 2026-08-21 | 2026-09-17 | 1,644 | 6 + 0 | Use when a secret, API key, token, password or credential needs to reach a tool - Zaal enters i | KEEP. One run corrected by Zaal (2026-09-08, the terminal did not open for the paste) |
| `socials` | own | yes | 2026-06-05 | 2026-09-11 | 2,342 | 16 + 1 | Generate platform-specific social posts for any ZAO content - newsletter distribution, event re | KEEP. File is lowercase `skill.md` |
| `spawn` | - | yes | - | 2026-07-31 | - | - | (not a skill: no SKILL.md) | `spawn.sh` only, no SKILL.md. Flagged in doc 2276, still here |
| `supabase` | `~/.agents` symlink | NO | - | - | 2,152 | 0 + 0 | Use when doing ANY task involving Supabase. Triggers: Supabase products (Database, Auth, Edge F | **Not in git.** Symlink to `~/.agents/skills` (supabase/agent-skills). Zero loads |
| `supabase-postgres-best-practices` | `~/.agents` symlink | NO | - | - | 644 | 0 + 0 | Postgres performance optimization and best practices from Supabase. Use this skill when writing | **Not in git.** Symlink to `~/.agents/skills` (supabase/agent-skills). Zero loads |
| `synced` | - | no | - | - | - | - | (not a skill: no SKILL.md) | **Untracked, not ignored.** 674 files: claude.ai synced skills, listed as `anthropic-skills:*` |
| `system-audit` | own | yes | 2026-08-27 | 2026-09-23 | 2,248 | 6 + 0 | One-screen audit of the whole agentic estate - every Orca terminal, every open repo, every open | KEEP. Last load 2026-09-13 |
| `tclip` | own | yes | 2026-09-24 | 2026-09-24 | 1,880 | 0 + 0 | **(none)** | KEEP, FIX. **No frontmatter**, so no description. `zao-tclip` ran 561 times; the skill itself was never loaded |
| `todo-clipboard` | own | yes | 2026-09-21 | 2026-09-21 | 1,093 | 1 + 0 | Keep ONE master to-do clipboard page. Zaal pastes anything (drafted messages, lists, screenshot | FOLD into tclip (proposal). One load, on the day it was written; tclip's own text says it supersedes it |
| `vault-health` | own | yes | 2026-09-21 | 2026-09-21 | 1,036 | 3 + 0 | Measure the Obsidian vault (~/zao-vault) in one pass - sync state, dirty tree split by kind, li |  |
| `vision` | own | yes | 2026-08-17 | 2026-08-17 | 2,296 | 0 + 0 | Draft and stress-test a VISION.md for a repository, then iterate with the author on an interact |  |
| `vw` | own | yes | 2026-09-21 | 2026-09-21 | 2,023 | 0 + 0 | Propose a production data write, hold for one-tap approval, execute exactly what was approved,  |  |
| `zaal-voice` | own | yes | 2026-08-18 | 2026-09-11 | 935 | 14 + 0 | Write anything in Zaal's name (essays, applications, DMs, emails, posts) so it reads human and  | KEEP |
| `zao-research` | own | yes | 2026-06-05 | 2026-10-04 | 12,412 | 110 + 12 | Research a topic for the ZAO ecosystem (ZAO OS, COC Concertz, FISHBOWLZ, BetterCallZaal, WaveWa | KEEP. 47 of the 122 loads were by subagents. Over the 5,000-token cut; compaction test passes |
| `zol` | own | yes | 2026-07-05 | 2026-07-05 | 1,254 | 1 + 0 | Drive ZOL, the ZAO Farcaster music-curator agent (@zolbot, FID 3338501) on the Pi. Post, reply, |  |

`zaal-dotfiles/claude/skills-archive/` holds 12 more that are retired and no longer load: `bandz-research`, `end`, `graphify`, `humanizer`, `ingest`, `last30days`, `quad`, `reddit-fetch`, `skill-eval`, `start`, `tutorial-creator`, `zao-lens`. `zao-retired-skills` passes: "12 marked retired or folded, 65 loading, 12 archived, 0 still loading, 0 unmarked".

### ZAOOS: `.claude/skills` (`origin/main` at `9ed2e9c44`)

| Skill | Kind | Created | Last change | ~Tokens | Loads 30d (tool + typed) | What it says it does | Note |
|---|---|---|---|---:|---:|---|---|
| `autoresearch` | shadowed by personal | 2026-03-18 | 2026-03-18 | 6,626 | (counted under personal) | Autonomous Goal-directed Iteration. Apply Karpathy's autoresearch principles to ANY task. Loops |  |
| `big-win` | own | 2026-04-03 | 2026-09-11 | 757 | 0 + 0 | Document a new Big Win for The ZAO - asks context questions, saves to quarterly docs, updates t | Line 85 lists a retired partner as a brand to capitalise |
| `bonfire` | shadowed by personal | 2026-05-22 | 2026-07-17 | 1,376 | (counted under personal) | Post episodes to the ZABAL Bonfire knowledge graph, or look up how Bonfire works. Bonfire is ZA |  |
| `browse` | shadowed by personal | 2026-07-15 | 2026-07-15 | 5,468 | (counted under personal) | Fast headless browser for QA testing and site dogfooding. Navigate any URL, interact with eleme |  |
| `careful` | gstack symlink | 2026-07-15 | 2026-07-15 | 613 | 0 + 0 | Safety guardrails for destructive commands. Warns before rm -rf, DROP TABLE, force-push, git re |  |
| `catchup` | own | 2026-03-27 | 2026-03-28 | 575 | 0 + 0 | Use when starting a new session, after /clear, or when context is lost and you need to understa |  |
| `check-env` | own | 2026-03-27 | 2026-03-27 | 371 | 0 + 0 | Use when validating environment variables exist before deploy, after fresh clone, or when debug |  |
| `clipboard` | shadowed by personal | 2026-07-15 | 2026-07-15 | 1,409 | (counted under personal) | Open a clean local browser page with content ready to copy/paste or share. Every call also save |  |
| `codex` | gstack symlink | 2026-07-15 | 2026-07-15 | 6,666 | 0 + 0 | OpenAI Codex CLI wrapper - three modes. Code review: independent diff review via codex review w |  |
| `design-consultation` | gstack symlink | 2026-07-15 | 2026-07-15 | 7,684 | 0 + 0 | Design consultation: understands your product, researches the landscape, proposes a complete de |  |
| `design-review` | shadowed by personal | 2026-07-15 | 2026-07-15 | 11,104 | (counted under personal) | Designer's eye QA: finds visual inconsistency, spacing issues, hierarchy problems, AI slop patt |  |
| `design-steal` | own | 2026-04-05 | 2026-04-05 | 1,378 | 0 + 0 | Steal a specific company's design language for a component or page. Fetches any of 55 DESIGN.md |  |
| `document-release` | gstack symlink | 2026-07-15 | 2026-07-15 | 6,523 | 0 + 0 | Post-ship documentation update. Reads all project docs, cross-references the diff, updates READ |  |
| `evals` | not a skill | - | 2026-04-02 | - | - | (no SKILL.md) | Six eval notes, no SKILL.md |
| `farcaster` | own | 2026-08-08 | 2026-08-08 | 991 | 0 + 0 | Read Farcaster - any profile, cast, or thread - keyless and free. Use before any claim about a  |  |
| `fishbowlz` | own | 2026-04-05 | 2026-06-09 | 416 | 0 + 0 | FISHBOWLZ is a standalone product - it no longer lives in ZAOOS. Development and deployment hap | FISHBOWLZ was killed 2026-05-04 (CLAUDE.md). Zero loads |
| `fix-issue` | own | 2026-03-27 | 2026-03-27 | 346 | 0 + 0 | Use when fixing a GitHub issue - reads the issue, implements the fix, writes tests, and commits |  |
| `freeze` | gstack symlink | 2026-07-15 | 2026-07-15 | 751 | 0 + 0 | Restrict file edits to a specific directory for the session. Blocks Edit and Write outside the  |  |
| `gitnexus` | not a skill | - | 2026-04-07 | - | - | (no SKILL.md) | Six nested skill folders; gitnexus is disabled per CLAUDE.md |
| `gstack` | shadowed by personal | 2026-07-15 | 2026-07-15 | 6,576 | (counted under personal) | Fast headless browser for QA testing and site dogfooding. Navigate any URL, interact with eleme | Vendored gstack <ip> (Garry Tan, MIT). `browse/dist` is not built in this checkout |
| `gstack-upgrade` | gstack symlink | 2026-07-15 | 2026-07-15 | 2,010 | 0 + 0 | Upgrade gstack to the latest version. Detects global vs vendored install, runs the upgrade, and |  |
| `guard` | gstack symlink | 2026-07-15 | 2026-07-15 | 790 | 0 + 0 | Full safety mode: destructive command warnings + directory-scoped edits. Combines /careful (war |  |
| `handoff` | shadowed by personal | 2026-07-15 | 2026-07-15 | 5,725 | (counted under personal) | Compress the current Claude Code session into a portable markdown bundle the receiver can paste |  |
| `inbox` | own | 2026-04-08 | 2026-06-25 | 2,931 | 0 + 0 | Process ZOE's email inbox. Links, ideas, and research topics forwarded to zoe-zao@agentmail.to. | Zero loads |
| `investigate` | gstack symlink | 2026-07-15 | 2026-07-15 | 4,718 | 1 + 0 | Systematic debugging with root cause investigation. Four phases: investigate, analyze, hypothes |  |
| `lean` | own | 2026-04-15 | 2026-04-15 | 1,160 | 0 + 0 | Run a Lean waste audit on any process, workflow, or team. Identifies the 7 wastes, maps the val |  |
| `meeting` | shadowed by personal | 2026-05-18 | 2026-07-17 | 8,459 | (counted under personal) | Capture meeting transcripts (voice memo, Craig recording, Fathom URL, paste-in-chat) and distri |  |
| `morning` | own | 2026-04-02 | 2026-05-16 | 495 | 0 + 0 | Morning kickoff ritual - status check, daily brief review, top priorities, set intention for th | Same name as a claude.ai synced skill |
| `new-component` | own | 2026-03-27 | 2026-03-28 | 615 | 0 + 0 | Use when creating a new React component - scaffolds with ZAO OS conventions (use client, dark t |  |
| `new-route` | own | 2026-03-27 | 2026-03-28 | 1,186 | 0 + 0 | Use when creating a new API route - scaffolds with ZAO OS conventions (Zod, session, NextRespon |  |
| `newsletter` | shadowed by personal | 2026-04-07 | 2026-09-11 | 2,582 | (counted under personal) | Write a "Year of the ZABAL" daily newsletter post in Zaal's voice. Generates an HTML preview pa | Shadowed. Lowercase `skill.md`. Describes the older daily-only flow |
| `next-best-practices` | not a skill | - | 2026-05-24 | - | - | (no SKILL.md) | **Broken symlink** to `../../.agents/skills/next-best-practices` |
| `obsidian-vault` | own | 2026-08-05 | 2026-08-05 | 4,237 | 0 + 0 | Scaffolds a PARA-style Obsidian vault for a software engineering project - folders, Obsidian Ba | Frontmatter name is `obsidian-vault-scaffolder` |
| `office-hours` | gstack symlink | 2026-07-15 | 2026-07-15 | 10,728 | 0 + 0 | YC Office Hours - two modes. Startup mode: six forcing questions that expose demand reality, st |  |
| `onepager` | own | 2026-04-24 | 2026-04-24 | 1,305 | 0 + 0 | Draft a new ZAOstock one-pager (sponsor / partner / venue / city briefing) and insert it into S |  |
| `plan-ceo-review` | gstack symlink | 2026-07-15 | 2026-07-15 | 18,088 | 0 + 0 | CEO/founder-mode plan review. Rethink the problem, find the 10-star product, challenge premises |  |
| `plan-design-review` | gstack symlink | 2026-07-15 | 2026-07-15 | 8,568 | 0 + 0 | Designer's eye plan review - interactive, like CEO and Eng review. Rates each design dimension  |  |
| `plan-eng-review` | gstack symlink | 2026-07-15 | 2026-07-15 | 9,102 | 0 + 0 | Eng manager-mode plan review. Lock in the execution plan - architecture, data flow, diagrams, e |  |
| `qa` | gstack symlink | 2026-07-15 | 2026-07-15 | 10,486 | 0 + 0 | Systematically QA test a web application and fix bugs found. Runs QA testing, then iteratively  |  |
| `qa-only` | gstack symlink | 2026-07-15 | 2026-07-15 | 6,801 | 0 + 0 | Report-only QA testing. Systematically tests a web application and produces a structured report |  |
| `reflect` | own | 2026-04-02 | 2026-04-02 | 392 | 0 + 0 | End-of-day reflection - what worked, what surprised, message to tomorrow. Saves to running jour |  |
| `retro` | gstack symlink | 2026-07-15 | 2026-07-15 | 8,505 | 0 + 0 | Weekly engineering retrospective. Analyzes commit history, work patterns, and code quality metr |  |
| `review` | shadowed by personal | 2026-07-15 | 2026-07-15 | 6,676 | (counted under personal) | Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust boundary |  |
| `setup-browser-cookies` | gstack symlink | 2026-07-15 | 2026-07-15 | 3,574 | 0 + 0 | Import cookies from your real browser (Comet, Chrome, Arc, Brave, Edge) into the headless brows |  |
| `ship` | gstack symlink | 2026-07-15 | 2026-07-15 | 14,011 | 0 + 0 | Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGEL |  |
| `socials` | shadowed by personal | 2026-04-07 | 2026-09-11 | 2,795 | (counted under personal) | Generate platform-specific social posts for any ZAO content - newsletter distribution, event re | Shadowed. Lowercase `skill.md` |
| `standup` | own | 2026-03-27 | 2026-03-28 | 754 | 0 + 0 | Generate a tweetable build-in-public update from recent git activity, written for a music commu |  |
| `team-setup` | own | 2026-07-15 | 2026-07-15 | 500 | 0 + 0 | Walk a new ZAOOS contributor through local setup after cloning - confirms they're on a ws/ bran |  |
| `unfreeze` | gstack symlink | 2026-07-15 | 2026-07-15 | 339 | 0 + 0 | Clear the freeze boundary set by /freeze, allowing edits to all directories again. Use when you |  |
| `vps` | own | 2026-04-02 | 2026-09-11 | 3,493 | 0 + 0 | Manage the ZAO Telegram bot fleet (ZOE, ZAO Devz, ZAOstock, team bots) on VPS 1 via SSH, or sen | Zero loads |
| `worksession` | own | 2026-04-06 | 2026-07-03 | 1,564 | 0 + 0 | Use at the start of any work session, especially when multiple Claude Code terminals may be ope | **Mandated by CLAUDE.md and nagged by a SessionStart hook; zero loads in 30 days** |
| `z` | own | 2026-03-28 | 2026-04-06 | 1,286 | 0 + 0 | Quick status dashboard - what's happening, what needs attention, ready to close? |  |
| `zabal-games-context` | own | 2026-05-25 | 2026-09-11 | 4,347 | 0 + 0 | ZAO ecosystem context skill for ZABAL Games participants. Drop into your vibe-coding agent (Cla | Zero loads |
| `zao-bench` | own | 2026-08-06 | 2026-08-06 | 1,068 | 0 + 0 | Benchmark ZOE's model stack - cost, latency, and EMPIRICAL prompt-cache hit rate per model tier |  |
| `zao-os` | not a skill | - | 2026-04-08 | - | - | (no SKILL.md) | `brand-voice.md` only |
| `zao-research` | shadowed by personal | 2026-03-15 | 2026-07-17 | 8,385 | (counted under personal) | Research skill for the ZAO OS ecosystem. Three-tier workflow (QUICK/STANDARD/DEEP) with mandato |  |
| `zao-stock` | not a skill | - | 2026-09-11 | - | - | (no SKILL.md) | `zao-stock.md` only; names a retired partner |

ZAOOS also carries ten command files under `.claude/commands/` (`autoresearch.md`, seven `autoresearch/*.md`, `minimax.md`, `minimax.ts`), all tracked, all from March, none loaded in the window.

### Plugins and vendored skills, with credit

| Source | Author, license | Version | Skills | Loads 30d |
|---|---|---|---:|---:|
| gstack (vendored in both trees; 21 symlinks in ZAOOS, 3 in personal) | Garry Tan, MIT, `github.com/garrytan/gstack` | 0.9.2.0 in both | 21 | 7 (`browse` 6, `investigate` 1) |
| superpowers | Jesse Vincent, MIT, `anthropics/claude-plugins-official` marketplace | 6.4.1 | 15 | 18 |
| everything-claude-code | Affaan Mustafa, MIT, `affaan-m/everything-claude-code` | 1.10.0 | 183 plus 79 commands | 1 |
| caveman | Julius Brussee, MIT, `JuliusBrussee/caveman` | 63e797c | 12 | 0 (hook-driven) |
| oh-my-mermaid | oh-my-mermaid, MIT | 0.2.0 | 3 | 0 |
| connect-apps | `ComposioHQ/awesome-claude-plugins`; no LICENSE file in the installed copy | 3289566 | 1 command | 0 |
| `claude-creativity`, `claude-is-tripping`, `drunk-claude` | KorroAi, MIT, `github.com/KorroAi/*`, pinned as submodules | 2026-06-18 | 3 | 0 |
| `computer-use`, `orca-cli`, `orchestration` | `stablyai/orca`, installed by the `skills` CLI | lock file | 3 | 3 |
| `supabase`, `supabase-postgres-best-practices` | `supabase/agent-skills` | lock file | 2 | 0 |
| `find-skills` | `vercel-labs/skills` | lock file | 1 | 0 |
| `autoresearch` | Skill text: origin unknown. It credits `karpathy/autoresearch` as its inspiration | - | 1 | 2 |
| `zao-skills-check` (tool used above) | Port of the "no dark skills" check from `sweetmantech/in_process_skills`, MIT, Sweets Sweetman, per the tool's own header | - | - | - |

gstack note: `.claude/rules/liveness-probe-guard.md` records that upstream fixed the browse crash-loop in gstack 1.62.0.0. Both vendored copies are still 0.9.2.0, and `browse/dist` does not exist in this ZAOOS checkout. 4 of the 6 `browse` runs in the window hit an error.

## Recommended merges and retirements

Proposals only. Nothing here has been done. "Archive" means a `git mv` into `claude/skills-archive/` with a RETIRED or FOLDED row in `claude/README.md`, which `zao-retired-skills` then enforces. It is reversible.

| # | Action | Skills | Why | Whose call |
|---|---|---|---|---|
| 1 | FIX | `tclip` | Add `name:` and `description:` frontmatter | No decision needed; dotfiles PR |
| 2 | FOLD | `todo-clipboard` into `tclip` | Superseded by its own successor's text; 1 load | Zaal |
| 3 | FIX | `five-minute-grill`, `quick-grill`, `grill-me` | Say what a lane does when the picker is refused: send the questions to the Grill session | No decision needed; dotfiles PR |
| 4 | SYNC or DROP | 9 stale ZAOOS copies | Table above | Zaal |
| 5 | FOLD | `orchestrate` into `system-audit` | Same question, 1 load against 6 | Zaal |
| 6 | RENAME | `orchestrator` | Three names one letter apart | Zaal |
| 7 | FOLD | `bcz-research` into `zao-research` | Doc 2276, 14 Aug, never done | Zaal |
| 8 | ARCHIVE, first batch | `21st`, `ask-gpt`, `bcz-yapz-description`, `cold-outreach`, `platform`, `desktop-checkin`, and the three KorroAi skills | Zero loads in 30 days, no script behind them, untouched since before 25 Aug. `cold-outreach` logs to a CRM we left | Zaal |
| 9 | RETIRE in ZAOOS | `z`, `catchup`, `standup`, `morning`, `reflect`, `check-env`, `fix-issue`, `new-component`, `new-route`, `fishbowlz` | Zero loads; last changed March to June; `fishbowlz` is a killed product | Zaal |
| 10 | DECIDE | `/worksession` mandate in CLAUDE.md | Mandated, hook-nagged, never run | Zaal |
| 11 | REMOVE two lines | `big-win/SKILL.md:85`, `meeting/references/lane-map.json:40-42` | Retired names in live guidance | Already ruled by the glossary; two small PRs |
| 12 | Zaal's hands | `learned/`, `spawn/`, `.trash/`, ZAOOS `next-best-practices` | Empty, malformed, trash, broken link | Deletion is Zaal's (`no-rm-rf.md`) |

## What I could not establish

- Whether any skill's output was good. Only launches, errors, interrupts and the next prompt were measured.
- Use on the VPS, the Pi, the Windows desktop, claude.ai and the phone. Only this Mac's transcripts were read.
- Why `skillOverrides: off` does not remove everything-claude-code names from the list. Not investigated; open since doc 2585.
- Why the shell glob returned zero transcript files.
- Whether lower-case `skill.md` loads on Linux.
- Who typed each "next prompt" in a lane: Zaal, or another session through Orca.
- The true creation date of personal skills older than the 2026-06-05 import commit.
- What `zao-skills-sync` would do today. Its target `~/dev/zao-claude-skills` exists; the tool was not run because `pull` and `push` write.

## Sources

| Source | Method | Result |
|---|---|---|
| `~/.claude/projects/**/*.jsonl`, 4,582 files | Parsed line by line, `scripts/usage.py` and `scripts/script-runs.py` | FULL |
| `zaal-dotfiles/claude/skills`, ZAOOS `.claude/skills`, `~/.claude/plugins`, `~/.claude/commands`, `~/.agents/skills` | Walked and read, `scripts/inventory.py`; git facts from `git ls-files` and `git log` | FULL |
| `clipboard/SKILL.md`, `tclip/SKILL.md`, `todo-clipboard/SKILL.md` | Read in full (`tclip`, `todo-clipboard`) and first 80 lines (`clipboard`) | FULL, PARTIAL for clipboard |
| Other skills in the overlap table | Frontmatter description only, not the body | PARTIAL |
| `zao-skill-audit`, `zao-skills-check`, `zao-skill-paths`, `zao-retired-skills`, `zao-skill-compaction-test` in `zaal-dotfiles/bin` | Run read-only; `zao-skill-audit` counting code read | FULL |
| Claude Code docs, `https://code.claude.com/docs/en/skills.md` | `curl`, raw markdown, 104,031 bytes, quoted from disk | FULL |
| Docs 2585, 2473, 2276 in this library | First 45 lines of each (the decisions tables) | PARTIAL |
| `~/zao-vault/inbox/clips/`, `~/zao-vault/TODAY.md`, `~/.zao/tclip/` | Directory listing, `git log` | FULL |

## Next Actions

| # | Action | Owner | Type |
|---|---|---|---|
| 1 | Send the six decisions (rows 2, 4, 5-7 as one, 8, 9, 10 above) to the Grill session | skills lane | done with this doc |
| 2 | `tclip` frontmatter | skills lane, zaal-dotfiles PR | fix |
| 3 | Grill skills: the picker-refused path | skills lane, zaal-dotfiles PR | fix |
| 4 | `zao-skill-audit`: window by record timestamp, dedupe by tool-use id, count typed commands, add a script-run column | skills lane, zaal-dotfiles PR with a red control | fix |
| 5 | Remove the retired name from `big-win/SKILL.md:85` | skills lane, ZAOOS PR | fix |
| 6 | Track `~/.agents/.skill-lock.json`; ignore `claude/skills/synced/` and `.trash/` | dotfiles lane | hygiene |
| 7 | Find why 208 `off` overrides still list | dotfiles lane | investigate |
| 8 | Re-run `scripts/usage.py 30` after any prune, and before the next one | skills lane | measure |
