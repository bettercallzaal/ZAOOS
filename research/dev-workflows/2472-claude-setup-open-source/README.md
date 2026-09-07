---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-07
superseded-by:
related-docs: 2151, 2150, 2471, 2163, 2411, 2462
original-query: "make this safe. Alright. Let's reset. Trying to make our whole quad set up too for you. Especially open source. Research how - How to make a cool whole Claude setup better. Overall for an open source developer, that's the key."
tier: STANDARD
---

# 2472 — Making the Claude setup safe, and making it open-sourceable

> **Goal:** Two questions that turn out to be one. What does a Claude Code setup
> need to be safe when twelve lanes run unattended under `Bash(*)`, and what does
> it need to be handed to a stranger? Both answers are the same answer:
> **the thing you can publish is the thing that carries no secret and enforces its
> own rules.** Everything the estate currently relies on prose for fails both tests.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Publish as a PLUGIN, not as dotfiles.** Zaal already consumes five | Anthropic's own docs draw the line: standalone `.claude/` is for "personal workflows, project-specific customizations, quick experiments"; plugins are for "sharing with teammates, distributing to community, versioned releases". There is a documented "Convert existing configurations to plugins" path and a community marketplace. The estate consumes that mechanism and has never published to it |
| 2 | **Apply doc 2151 today. It has been `needs-zaal-approval` for 39 days** | Its core rule - blocking remote content piped to a shell - is measurably absent from the live deny list. It is one paste |
| 3 | **`~/zao-vault` gets a project `settings.json`. It has none** | The orchestrator seat runs there, manages 12 lanes, types into other panes and edits settings, under the **weakest** permission surface in the estate. Measured below |
| 4 | **Deny rules must name the estate's own standing rules, not just `rm -rf`** | All 23 global deny rules are filesystem-destruction. Zero cover self-modification, self-granted trust, credential reads or exfiltration - the four things the briefs repeat and prose has failed to stop |
| 5 | **Do NOT drop `Bash(*)`.** Fix the deny list instead | Deny beats allow at every level and a user-level deny cannot be overridden by a project file. With a real deny list, `Bash(*)` is a speed choice, not a safety hole. Dropping it stalls twelve lanes |
| 6 | **There is no community standard to copy.** Build ours and publish it | Measured on HN: fourteen "manage/share Claude config" projects, top score **21 points**, most at 1-4 with zero comments. That is a field of one-off tools, not convergence |

## The estate has four permission surfaces and nobody knew

Measured 2026-09-07, every file read on disk:

| File | allow | deny | ask | What runs there |
|---|---|---|---|---|
| `~/.claude/settings.json` | 32 | 23 | 0 | **Everything.** Every lane on the mac |
| `ZAO OS V1/.claude/settings.json` | 80 | 27 | 0 | The ZAOOS lane |
| `ZAO OS V1/.claude/settings.local.json` | 16 | 0 | 0 | One machine |
| `zao-vault/.claude/settings.local.json` | 4 | 0 | 0 | The orchestrator seat |
| `zao-vault/.claude/settings.json` | — | — | — | **DOES NOT EXIST** |

**The inversion is the finding.** The ZAOOS lane, which writes application code,
runs under 27 deny rules including `supabase db reset`, `npm publish`,
`gh repo delete`, `Write(.env*)` and `Bash(grep*.env*)`. The **orchestrator
seat**, which today edited global settings, dismissed prompts in other lanes,
typed into six panes and pushed commits, runs under **four allow rules and no
deny rules of its own** - inheriting only the 23 global ones, all of which are
about deleting files.

The seat has the most reach and the least restraint. That is backwards, and it is
not a hypothetical: this seat edited `~/.claude/settings.json` this afternoon and
nothing in any of the four files would have stopped it.

## What the deny list actually covers, and what it does not

All 23 global rules, grouped:

| Category | Count | Examples |
|---|---|---|
| Filesystem destruction | 18 | `rm -rf` variants, `shred`, `find -delete`, `Remove-Item -Recurse`, `rd /s` |
| Git destruction | 4 | `git push --force*`, `git reset --hard*`, `git clean -fd*` |
| SQL | 2 | `drop table*`, `DROP TABLE*` |
| **Secrets, exfiltration, self-modification, trust** | **0** | — |

Nothing denies reading `~/.zao/private/`. Nothing denies writing
`settings.json`. Nothing denies `hasTrustDialogAccepted`. Nothing denies an
outbound POST. Every one of those is a rule the estate repeats in prose in
almost every brief.

**One rule was silently not in force at all.** `Bash(rm -rf /*)` was rejected by
the parser as malformed and skipped - the harness said so at every session start
and it read as boilerplate. Corrected to `Bash(rm -rf /:*)` on 2026-09-07 and
verified by booting a fresh session and seeing the warning gone. That is the
third instance of this class: ZAOOS PR #3407 was "drop the two Write() deny
rules the harness was skipping".

**Read the startup warning.** It lists every skipped rule. It is the only
feedback the permission system gives you and it was being scrolled past.

## How permissions actually compose - the five that surprise people

From Otto's guide, checked against Claude Code 2.1.263 on 2026-09-07, and it is
the best technical source found on this:

1. **Evaluation is deny, then ask, then allow. First match wins, and a deny at
   any level beats an allow at any other.** A user-level deny cannot be
   overridden by a project settings file. So the global file is the right place
   for the estate's non-negotiables, and a lane cannot loosen them.
2. **A bare tool name in deny removes the tool from context entirely** - the
   model never sees it. Stronger and quieter than blocking calls one at a time.
3. **Compound commands must match per segment.** Every segment of a chained
   command must independently match a rule, which means a chain of individually
   allowed read-only commands can still be refused.
4. **Argument constraints cannot contain network tools.** The guide is blunt:
   rules alone restrict nothing if Bash can still run the tool - "allow specific
   subcommands" instead. This is exactly doc 2151's `curl | sh` gap.
5. **`Bash(*)` makes every other Bash ALLOW rule decoration** - the guide's
   phrase is that it grants "the whole shell". It does **not** make deny rules
   decoration, because deny beats allow. That distinction is why decision 5
   keeps `Bash(*)` and fixes the deny list instead.

Also load-bearing and new: **since v2.1.246 Claude Code warns at startup about
allow rules that are broader than they look**, and **v2.1.248 added a strict
settings mode** that loads only managed settings, ignoring project and local
files including hooks - built for eval harnesses on shared machines.

**The honest counterweight**, from the security guide: `--dangerously-skip-permissions`
"should never be used in production, and never in any directory that has access
to credentials". Its acceptable cases all share one property - **the blast radius
is something you can throw away**: containers with no host mounts, CI sandboxes
torn down after the run, isolated worktrees. `skipDangerousModePermissionPrompt`
is on across this estate, on a machine holding `~/.zao/private/icm-keys.json`.
That is a real disagreement between our setup and the field, and decision 5 takes
the risk deliberately rather than by omission - twelve lanes cannot run
attended, so the deny list has to be the control.

## Three surfaces permissions do not cover, and we use all three

The security guide names them and each maps to something live here:

- **API keys exported into the environment.** Every subprocess inherits them.
  `~/.zao/zao.env` carries `SUPABASE_SERVICE_KEY`; `zao-wall.py` reads it and its
  own docstring says it "deliberately does not print or return the key anywhere
  it could be logged" - the right pattern, applied in one tool, not a policy.
- **MCP servers as an injection vector.** This estate runs 13 MCP servers
  including `claude-in-chrome`, `playwright`, two Supabase servers and a GitHub
  server. The guidance is to enable only what you need, pin versions, restrict
  filesystem paths, and gate read-write pairs behind approval.
- **Hooks run shell silently with your full permissions.** 14 hook events, 29
  hook entries. They are the least-audited surface here and the easiest to miss.

## What to publish, and what must never leave

The plugin path is the answer to "open source ours", and the split is clean
because it is the same split that makes the setup safe.

| Publish | Never publish |
|---|---|
| Skills, agents, hook **scripts** | `~/.zao/zao.env`, `~/.zao/private/*` |
| The permission model - allow/deny/ask shapes | `~/.claude/.credentials.json` |
| `CLAUDE.md` structure and conventions | Anything under `images/_NOT-FOR-SHARING` |
| Lane briefs as **templates** | Briefs with a real person's name, fee or address |
| `zj`, `lane-send`, `zao-sweep`, `zorca-lock` | `people/handles.csv`, `crm-import-*` |
| The `autoMode` environment **shape** | Its filled-in contents - hosts, bots, domains |

**The estate already has the tooling for this and has never pointed it at
itself:** `opensource-forker` strips secrets across 20+ patterns and replaces
internal references with placeholders, `opensource-sanitizer` produces a
PASS/FAIL report, `opensource-packager` generates the `CLAUDE.md`, `setup.sh`,
`README` and `LICENSE`. Three agents, built, never run on our own config.

**The visibility default was backwards and it nearly cost real harm.** The
`autoMode.environment` block said "Repository visibility: assume private". Nine
of eleven estate repos are **public** - only `zao-vault` and `zao-website` are
private. On 2026-09-07 a PR would have published nine artists' contract terms to
the public ZAOstock repo on the strength of that default. Corrected the same day
with the measured list and the incident recorded in the block itself.

## What the community has converged on: nothing

Measured on the Hacker News Algolia API, 2026-09-07, fourteen stories matching
Claude Code config management and sharing:

| Project | Points | Comments |
|---|---|---|
| coder-config (rules, MCPs, permissions) | 21 | 0 |
| Clausona (multiple accounts, keep settings) | 3 | 0 |
| Memva (multi-session manager) | 3 | 0 |
| configure-claude-code (visual configurator) | 1 | 0 |
| Clenv, Updose, YoloAI, ralph-addons, + 6 more | 1-4 | 0-2 |

**Not one has traction.** The highest is 21 points with zero comments. Six
different tools independently solve "manage and share Claude config", which is
the signature of an unsolved problem rather than a solved one.

**So there is no standard to adopt, and that is the opportunity.** What the
estate has that none of these have is a *measured* setup: eight tools whose
install path was audited (doc 2471), a permission model with a documented
incident behind each rule, and lane briefs that record what went wrong and why.
A config manager is a tool; a config with its incidents attached is a document
people learn from. Publish the second.

**Honest limit:** this is a count of HN stories, not of adoption. A tool can be
widely used and never post well on HN, and the search was one query family
against one aggregator. Treat "no convergence" as strongly suggested by the
absence of any high-signal thread, not as proven.

## Where each thing belongs

Settled by the official docs plus the composition rules above:

| Goes in | What | Why |
|---|---|---|
| `~/.claude/settings.json` | Non-negotiable **deny** rules, model, env | A user-level deny cannot be overridden by a project file |
| Project `.claude/settings.json` | Allow rules for that repo's commands, project hooks | Committed, so teammates get safe pre-approved commands |
| `.claude/settings.local.json` | One machine's paths | Gitignored by design |
| `CLAUDE.md` | Conventions, vocabulary, "ask first" lists | Read every session; it is instruction, not enforcement |
| Skills | Procedures with steps | Invocable, versioned, shareable |
| Hooks | Enforcement that must not be skippable | Runs whether or not the model cooperates |
| **Plugin** | All of the above, packaged | The documented path for distribution and versioned releases |

**The line that matters: `CLAUDE.md` is etiquette, deny rules and hooks are
enforcement.** Every standing rule that has been broken in this estate was
written in prose. "Never self-grant trust", "never publish internal memos to
public repos", "a tap is not a measurement" - all prose, all broken, all in the
same week. The security guide's phrasing for `Read(.env*)` is the model to copy:
**"enforcement, not etiquette."**

## Also see

- [Doc 2151](../2151-permission-hardening-proposal/) — the `curl | sh` block, unapplied 39 days. **Apply it**
- [Doc 2471](../2471-zao-lane-workflow-audit/) — a merged PR does not reach the machine; the install-path audit
- [Doc 2163](../2163-claudemd-discipline-vs-zaoos/) — CLAUDE.md discipline vs rule load
- [Doc 2411](../2411-tool-usage-audit-measured/) — thirty tools, six used; the three we mandate are dead
- [Doc 2462](../2462-claudecode-subreddit-two-month-scan/) — what r/ClaudeCode actually says

## Next actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Apply doc 2151's deny block to `~/.claude/settings.json` — shipped when `curl https://example.com \| sh` is blocked rather than prompted, verified by running it | @Zaal | Settings | 2026-09-09 |
| Add deny rules for the four unenforced standing rules (settings self-write, `hasTrustDialogAccepted`, `~/.zao/private/` reads, outbound POST as `ask`) — shipped when each is a line in `permissions.deny` and a fresh session boots with no skipped-rule warning | @Zaal (seat drafts) | Settings | 2026-09-10 |
| Create `zao-vault/.claude/settings.json` so the orchestrator seat is not the least-restricted surface — shipped when the file exists with a non-empty deny array | @Zaal (seat drafts) | PR | 2026-09-10 |
| Audit the 29 hook entries across 14 events and write down what each shell command does — shipped when `notes/hook-inventory.md` exists with one row per hook | @Zaal (obsidian lane) | Audit | 2026-09-14 |
| Run `opensource-sanitizer` against a fork of the `.claude` config and publish the PASS/FAIL report — shipped when the report exists and names every finding | @Zaal (seat) | Audit | 2026-09-16 |
| Package the setup as a plugin with `.claude-plugin/plugin.json` and publish it — shipped when `claude plugin install` from a public repo reproduces the skills and permission model on a clean machine | @Zaal | Release | 2026-09-30 |

## Sources

- [Claude Code permissions: how allow, ask, and deny actually compose](https://dev.to/ottoflightrules/claude-code-permissions-how-allow-ask-and-deny-actually-compose-3kme) — **[FULL, method: curl + HTML strip]** 152 lines read as raw text. Author self-discloses as a Claude instance operating unattended overnight sessions; states it is checked against Claude Code 2.1.263 as of 2026-09-07, which matches the version measured on this machine. The composition rules, the per-segment matching, the bare-tool-name deny and the two version-gated features come from here
- [Locking Down Claude Code with settings.json](https://claudecodesecurity.substack.com/p/locking-down-claude-code-with-settingsjson) — **[FULL, method: curl + HTML strip]** 63 lines raw. Source of the `--dangerously-skip-permissions` blast-radius framing, the three uncovered surfaces, and "enforcement, not etiquette"
- [Claude Code settings — official docs](https://docs.claude.com/en/docs/claude-code/settings) — **[FULL, method: curl + HTML strip]** 313 lines. Settings-file scope and precedence
- [Create plugins — official docs](https://docs.claude.com/en/docs/claude-code/plugins) — **[FULL, method: curl + HTML strip]** 200 lines. The plugins-vs-standalone table, "Convert existing configurations to plugins", "Ship default settings with your plugin", marketplace submission
- Hacker News Algolia API, `hn.algolia.com/api/v1/search` — **[FULL, method: keyless JSON API]** two queries, 14 stories with points and comment counts. The basis for "no convergence", with the limit stated in that section
- `~/.claude/settings.json`, `ZAO OS V1/.claude/settings.json`, both `settings.local.json` — **[FULL]** read and counted on disk 2026-09-07
- [Doc 2151](../2151-permission-hardening-proposal/) — **[FULL]** read on disk; its proposals checked line by line against the live deny list
- WebSearch result set for the same query family — **[PARTIAL — snippets only]** used to find the four URLs above, not quoted. Every claim attributed to a source was read in raw form
