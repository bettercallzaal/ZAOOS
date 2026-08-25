---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2408, 2407, 2405, 2113"
original-query: "can u loop on learning as much as you can with the tools that you have avilible /zao-research more tools that we can use"
tier: STANDARD
---

# 2411 - We have thirty tools and use six. The three we mandate are dead.

> **Goal:** Zaal asked what more tools we could use. Measuring what we already
> use answers a better question, and the answer inverts the ask.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adding tools is not the lever. Fixing the mandated-and-dead ones is.** | Three tools CLAUDE.md tells every session to use were called **3, 3 and 0 times** in 30 days across 377 transcripts. |
| 2 | **Un-ban `claude-in-chrome`, or build `/browse`. Right now the rule mandates a tool that cannot run.** | CLAUDE.md: *"For web browsing, use the `/browse` skill from gstack - never `mcp__claude-in-chrome__*` tools."* `gstack/browse/dist/` **does not exist**, so `/browse` cannot execute. `claude-in-chrome` was called **1,786 times** - the most-used MCP by a factor of two. |
| 3 | **Disconnect the ten servers at zero calls.** | Every connected server costs context on every request. Ten have not been called once in 30 days. CLAUDE.md already disables three on exactly this reasoning ("0 use, pure context cost"); the list is longer than it says. |
| 4 | **Serena's 60-80% token saving is theoretical here. It is used 0.03% of the time.** | Serena: **3 calls**. Read + Edit + Write: **9,786**. Either wire it into the default edit path or stop claiming the saving. |
| 5 | **`WebFetch` at 1,071 calls needs a look, not a ban.** | `research-grounding.md` says WebFetch returns a small model's summary, never the page, and is for triage only. 1,071 calls in 30 days is a lot of triage, and no measurement here says how many became quotes. |

## The measurement

**377 transcript files, all sessions modified in the 30 days to 2026-08-24, on
this Mac.** Counted by grepping `"name":"<tool>"` out of the raw JSONL. This is a
floor, not a ceiling - it covers this machine only.

### MCP calls, by server

| Server | Calls | Status in CLAUDE.md |
|---|---:|---|
| `claude-in-chrome` | **1,786** | **explicitly banned** |
| `supabase-cowork` | 784 | - |
| `exa` (via ECC plugin) | 117 | in the research fetch ladder |
| `paragraph` | 77 | - |
| `hyperagent` | 52 | - |
| `Google_Calendar` | 46 | - |
| `Gmail` | 18 | - |
| `Google_Drive` | 15 | - |
| `playwright` | 10 | in the research fetch ladder |
| `github` (ECC plugin) | 5 | - |
| `serena` | **3** | **"use for editing/refactoring ZAOOS code"** |
| `dune` | 3 | - |
| `context7` | **3** | **"Always use... without being asked"** |
| `blockscout` | 3 | - |
| `Descript` | 2 | - |
| `Expedia` | 1 | - |
| `Canva` | 1 | - |

### Connected and called ZERO times in 30 days

`grep` (grep.app) · `gitnexus` · `Slack` · `Notion` · `Linear` · `Dropbox` ·
`Calendly` · `minimax` · ECC `memory` · ECC `sequential-thinking`

`grep.app` is the sharpest of these: **`/zao-research` Step 2.5 instructs every
research run to search 30+ bettercallzaal repos with
`mcp__grep__searchGitHub`.** It has never been called.

### Native tools, same window

| Tool | Calls |
|---|---:|
| `Bash` | **29,366** |
| `Read` | 3,901 |
| `Edit` | 3,602 |
| `Write` | 2,283 |
| `WebSearch` | 1,207 |
| `WebFetch` | 1,071 |
| `Skill` | 258 |
| `Grep` | **3** |
| `Glob` | **1** |

`Grep` at 3 and `Glob` at 1 are **not** a defect. Bypass-permissions sessions are
instructed to do file work through Bash, so `grep` and `find` run as shell
commands instead. Recorded so the next reader does not file it as a bug.

## Why the banned tool won

This is the interesting part, and the explanation is already written down
elsewhere in the estate.

`idle-lane-audit.md` records that `gstack browse/dist/` was **never built**, and
that `/browse` was therefore dead for weeks while looking fine - `dist/` is
correctly gitignored, so a fresh clone shows nothing wrong. Checked again today
in this worktree: **there is no `dist/` under `.claude/skills/gstack/` at all.**

So the rule reads: use the tool that cannot run, never the one that can. Faced
with that, every session did the only thing that works, 1,786 times.

**A rule that mandates a broken tool does not get followed. It gets routed
around, silently, and the routing never gets written down.** That is the same
shape as `vanishing-dependencies.md` - the thing that breaks is never the thing
that reports.

## What this says about "more tools"

Zaal's question was what else we could adopt. The measurement says the estate is
not short of tools:

- **~30 MCP servers connected. Six carry 99% of the calls.**
- Of the six, one is banned, and the two the rules most insist on are not in it.

Before adopting anything new, the honest sequence is: make the mandated three
work or drop them, disconnect the ten dead ones, and re-measure. A tool that is
connected but never called is not neutral - it is context spent on every request
for nothing.

**The one genuine capability gap found in this sweep is not a tool at all.** Doc
2282 established that Reddit is fully walled from this machine and the fix is a
single credential file, not a new integration.

## Honest limits

- **One machine.** The VPS, the Pi and the Windows desktop are not counted, and
  the fleet loops there may use a different mix entirely.
- **Calls, not value.** One `context7` call that prevents a hallucinated API is
  worth more than a hundred `Bash` calls. This measures frequency, not benefit,
  and a low-frequency tool is not automatically a dead one.
- **Not de-duplicated by session.** A single long session with a browser loop
  contributes heavily to the 1,786.
- **`WebFetch`'s 1,071 calls were not classified** into triage versus
  load-bearing use. That classification is the follow-up that would settle
  whether `research-grounding.md` is being honoured.

## Also See

- [Doc 2408](../../community/2408-zao-teams-and-collaborators-audit/) - the teams audit that ran immediately before this one; same shape, a surface that existed and nobody read. **Unmerged as of 2026-08-24** (PR #3307)
- [Doc 2113](./2113-skills-tools-audit-overnight-loop/) - the prior skills-and-tools audit
- [Doc 2405](./2405-skills-audit/) - 75 skills, and the argument that we do not need more. **Unmerged as of 2026-08-24** (branch `ws/research-2405-skills`)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the browsing rule: build `gstack/browse/dist` or amend CLAUDE.md to permit `claude-in-chrome`. Done when the rule names a tool that runs | @Zaal | Decision | 2026-08-26 |
| Disconnect the ten zero-call MCP servers; done when `/mcp` lists only servers with a use | @Zaal | Config | 2026-08-28 |
| Either wire Serena into the default edit path or remove the 60-80% claim from CLAUDE.md; done when the file matches reality | @Zaal (Claude) | PR | 2026-08-29 |
| Fix `/zao-research` Step 2.5 - it mandates `mcp__grep__searchGitHub`, which has never been called. Done when the step names a tool that gets used | @Zaal (Claude) | PR to zaal-dotfiles | 2026-08-29 |
| Classify a sample of the 1,071 `WebFetch` calls into triage vs load-bearing; done when the split is a number in a doc | @Zaal (Claude) | Research | 2026-09-05 |
| Re-run this measurement on the VPS and the Pi | @Zaal (Claude) | Test | 2026-09-05 |

## Sources

- [FULL - measured 2026-08-24, method: `find ~/.claude/projects -name '*.jsonl' -mtime -30 | xargs grep -oh '"name":"...'`] 377 transcript files. Every count in the two tables above comes from that pass.
- [FULL - read 2026-08-24] `CLAUDE.md` lines 135, 136, 144 - the context7, Serena and claude-in-chrome rules, quoted verbatim.
- [FULL - checked 2026-08-24] no `dist/` directory exists under `.claude/skills/gstack/`; `find` over the skill tree returns none.
- [FULL - read 2026-08-24] `.claude/rules/idle-lane-audit.md` (the `gstack browse/dist` never-built finding), `.claude/rules/research-grounding.md` (WebFetch triage-only), `~/.claude/skills/zao-research/SKILL.md` Step 2.5 (`mcp__grep__searchGitHub`).
- [FULL - this session's own tool listing] the roster of connected MCP servers, used to derive the zero-call list.
