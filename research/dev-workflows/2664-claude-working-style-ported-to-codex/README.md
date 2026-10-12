---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-12
superseded-by:
related-docs: "2663, 2655, 2649, 2483"
original-query: "Zaal's 'sounds good' to option A, vault grill item 185 (2026-10-12): port his Claude working style to Codex. One numbered doc with the mapping table (behaviour, Claude carrier, Codex carrier, ports / shim / does not port), measured facts with dates, what does not port and the bridge proposed, and a short Gemini CLI and Antigravity section marked by what was and was not fetched."
tier: STANDARD
---

# 2664 - The Claude working style, ported to Codex

> **Goal:** Say, behaviour by behaviour, how the way Zaal works with Claude Code on his Mac is carried into Codex: what moves as it is, what needs a shim, and what does not move. Everything measured carries its date and the surface it was read from.

**Nothing in this doc is switched on.** The files are in zaal-dotfiles PR 517 (open, not merged). Installing them is one command and trusting the hook is one screen inside Codex; both are Zaal's steps and are written out at the end.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | PORT the three guards as one Codex PreToolUse hook that runs the existing guard programs unchanged. | Codex sends a PreToolUse hook the same JSON fields the guards already read, and accepts the same deny shape. Proven live for two of the three (below). |
| 2 | One adapter, not three hook entries. | Codex trusts a hook by the hash of its definition and skips it until reviewed. One entry is one review. And Codex runs the command when a hook answers "ask", so the adapter turns ask into deny. |
| 3 | EXTEND our own bootstrap for the rules. Do not adopt Ruler or rulesync. | One source file, one target. Both tools are MIT and both are Node CLIs with their own source tree; that is more surface than a 60-line generator. Credit below. |
| 4 | The binding rules reach Codex as a generated override file built from the global CLAUDE.md. | Measured live: Codex did not have them. With the override it does. |
| 5 | Skills: no change. Stop and report. | The shared skills folder already holds seven directories that are not ours. Bootstrap links shared skills by name, on purpose. |
| 6 | A read-only evaluator agent is defined. Whether Codex spawns it correctly is NOT verified. | The file format is documented and the file parses. No live spawn was run. |
| 7 | SendMessage and the memory directory do not port. The bridge is files in the vault, which both tools already read. | Codex has no cross-session message tool and no memory directory in the docs fetched. |

## What was measured, and what turned out to be wrong

All on 2026-10-12, on Zaal's Mac, codex-cli 0.153.4 (`codex --version`).

**1. The Codex home a pane uses is not `~/.codex`.** Orca starts Codex with CODEX_HOME pointing at a directory of its own under its application support folder, marked with a file named `.orca-managed-home`. Read from the environment of a running codex process. That home's `AGENTS.md` is a link to `~/.codex/AGENTS.md`, which is a link to the vault rulebook. Its `hooks.json` is written by Orca and holds nine hooks, one per lifecycle event, that report pane state back to Orca. None is a guard. Orca also records trust for its own hooks in that home's config.

The brief for this work said `~/.codex/hooks.json` is empty, so the live panes have no enforcement. The file is empty (read today: `{"hooks": {}}`). The conclusion holds. The reason is different: the panes do not read that file at all.

**2. The binding rules were not reaching Codex.** The global CLAUDE.md carries the rules Zaal wrote for every session: no emoji, no em dash, the name glossary, the retired partners, the three measurement sections. A search of the vault rulebook, which is what Codex is given, for "emoji", "em dash", "Retired" and "zao-assert" found none of them. Confirmed live: `codex exec`, read-only, in a throwaway home whose only global file was that rulebook, was asked whether the exact phrase "Never use emojis" was in its instructions. It answered "no". With the generated override linked beside it, the same question got "yes".

**3. A claim I nearly shipped, and the run that killed it.** The vault rulebook is 83,925 bytes on disk. Codex documents a limit, `project_doc_max_bytes`, "32 KiB by default". I had written, in a tool comment and in a status line, that Codex therefore loads 39 percent of the rulebook and never sees rules 14 and 15. Then the live run above was asked for the highest rule number it could see and the last ten words of its instructions. It answered rule 15 and quoted the file's real final words ("...on ZAODEVZ/iman-desk | 62 agents. comms_surfaces populated from seed."). So the whole global file was loaded. The limit did not cut it. Whether the limit applies to project-level files was not tested. The override is still built under 32,768 bytes (14,910) so that it fits wherever the limit does apply.

**4. Codex honours the hook. Live, for two guards of three.** One `codex exec` in a throwaway home holding only our hook, asked to run four commands and not to retry a refusal:

| Command | What happened | Evidence |
|---|---|---|
| `ls -la` | ran, exit 0 | the run's event stream |
| `git push origin main` | refused by the hook | Codex's own error line: "Command blocked by PreToolUse hook: [safe-git-push] BLOCKED: pushing while targeting 'main'." The adapter's log: "DENY by safe-git-push.sh" |
| `gh pr merge 99999 --squash` | refused by the hook | "Command blocked by PreToolUse hook: REFUSED: raw `gh pr merge` is blocked in every lane..." The adapter's log: "DENY by zao-merge-only-guard" |
| `rm -rf` on a fixture directory | NOT REACHED | The model declined it in its own words and never made the tool call. The adapter's log has no entry. Asked again with `git clean -fd`, it declined again. |

So the recursive-delete guard is proven through the adapter by fixture only. It uses the same deny shape as the merge guard, which was honoured live, but that is an inference and not a measurement.

Two limits on that run. It used `--dangerously-bypass-hook-trust`, Codex's flag for running a hook without persisted trust for one invocation, because trusting a hook is Zaal's step and was not taken. And the hook was the only one in the file; a hook appended to Orca's file of nine was not run live.

## The mapping

Carrier means the file or mechanism that makes the behaviour happen.

| Behaviour | Claude carrier | Codex carrier | Verdict |
|---|---|---|---|
| A dangerous shell command is refused | PreToolUse hooks in `settings.json`, matcher Bash | PreToolUse hook in `hooks.json` or inline `[hooks]` in `config.toml`, matcher `^Bash$` | PORTS. Same stdin fields (`tool_name`, `tool_input.command`, `cwd`), same deny shape, exit 2 also blocks. |
| A hook can ask the human | `permissionDecision: "ask"` | none | DOES NOT PORT. Codex docs: ask is "parsed but not supported yet. Codex marks the hook run as failed, reports the error, and continues the tool call." SHIM: the adapter turns ask into deny. |
| Hooks are on once configured | on when in settings | skipped until reviewed and trusted in `/hooks`; trust is tied to the definition's hash | SHIM by process: one adapter entry, so one review that survives guard changes. |
| Global rules for every session | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md`, or `AGENTS.override.md` which is read INSTEAD when present | PORTS with a generator: one source, built into the override. |
| Project rules | `CLAUDE.md` and `.claude/rules/` in the repo | `AGENTS.md` from the project root down to the working directory, concatenated | PORTS where a repo has an AGENTS.md. ZAOOS rule files were not ported by this work. |
| Skills | `~/.claude/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md`, plus `.agents/skills` from the working directory up to the repo root. Symlinked folders are followed. | PORTS per skill, by link. Not every skill: many of ours call Claude-only tools. |
| A reviewer that cannot write | a subagent type with read-only tools | a TOML file in `~/.codex/agents/` with `sandbox_mode = "read-only"` | PORTS on paper. Spawn not run live. |
| Headless run | `claude -p` | `codex exec`, with `--json` for an event stream | PORTS. Used for every live run here. |
| Sessions message each other | SendMessage between sessions | none found | DOES NOT PORT. Bridge below. |
| Memory across sessions | a memory directory of small files, indexed | none found | DOES NOT PORT. Bridge below. |
| The status line | a script fed session JSON | not looked at | NOT ASSESSED. |
| Picker questions are refused | a hook on the AskUserQuestion tool | no such tool | NOT NEEDED. |
| Hooks on file edits | PreToolUse on Edit and Write | PreToolUse matches `apply_patch` (aliases Edit, Write) | PORTS on paper. Our edit-time guards were not wired or tested. |

Codex's own caution applies to every PORTS row about hooks, quoted from its hooks page: "Treat tool hooks as a useful guardrail, not a complete enforcement boundary." Hosted tools such as web search do not pass through hooks at all.

## What does not port, and the bridge

**SendMessage.** Claude lanes hand work to each other and to the evaluator by session message. The Codex pages fetched for this doc (hooks, skills, subagents, AGENTS.md guide, non-interactive mode) describe no equivalent. Bridge, using what both tools already read: a Codex lane writes its hand-off as a file under the vault's inbox and status folders, the same surfaces the rulebook already names, and a Claude lane or the seat picks it up. In the other direction a Claude lane can run Codex headless with `codex exec` and read the JSON stream. This is slower than a message and it is the only path that needs nothing new. A proper bridge would be a small tool both sides call; it is not built and not proposed for now.

**The memory directory.** Claude Code keeps a folder of one-fact files with an index that loads each session. Nothing like it is in the Codex pages fetched. Bridge: the memory that binds behaviour is already in the global CLAUDE.md, and that is what the override carries. Project memory stays where it is, in the dotfiles memory folder, readable by path. Codex is not told to write memories; a lane that learns something writes it to its status file, as the rulebook already says.

**Loading the rulebook itself.** With the override on, Codex reads the override and no longer has the vault rulebook loaded for it. The override's first instruction is to read the rulebook and the blackboard by path before any ZAO work, which is the same instruction Claude gets. That makes the two tools level, and it is weaker than the file being loaded. The alternative that keeps both is to put the binding lines into the vault rulebook itself, so that every tool that reads it gets them. That is the vault's file and Zaal's call: PROPOSED, not done. If he takes it, the override becomes unnecessary and should be removed.

## The rules source: extend, not adopt

| Option | What it is | Licence | Verdict |
|---|---|---|---|
| Our bootstrap plus one generator | `bin/zao-codex-rules` builds the Codex file from the global CLAUDE.md and refuses if a binding line is missing, the file is stale, or it passes the byte cap | ours | USE |
| [Ruler](https://github.com/intellectronica/ruler) | "apply the same rules to all coding agents". A Node CLI; rules live in a `.ruler/` directory and `ruler apply` writes each tool's file. Its README lists Codex CLI among its targets. | MIT, copyright 2025 Eleanor Berger (repo LICENSE, read via the GitHub API 2026-10-12) | SKIP for now |
| [rulesync](https://github.com/dyoshikawa/rulesync) | "A Node.js CLI tool that automatically generates configuration files for various AI development tools from unified AI rule files" | MIT, copyright 2024 dyoshikawa (same method) | SKIP for now |

The brief said rulesync's licence was unverified. It is MIT. Neither tool's code is used, so no licence text is carried; they are credited here and in the generator's own header because they are the prior art for the idea. The case for adopting one later is if the number of targets grows past two or three. Today it is one.

## Skills

Read today: the shared skills folder (`~/.agents/skills`) holds eight entries. One is a link into zaal-dotfiles (grill-me). Seven are not ours: tool-installed skill folders, each with a lock entry naming its upstream repo, and one dated backup. The brief's instruction for this case was to report and stop, and that is what happened.

It is also already handled. Bootstrap links shared skills into that folder one by one from a named list, and its comment says why it does not link the whole skills tree: it would shadow the other tools' folders, and it would show Codex skills that call Claude-only tools. The list has one name today. Growing it is a per-skill judgement of whether the skill runs without Claude's tools, and nobody has made that pass.

## Gemini CLI and Antigravity

Short, and marked by what was read.

**Gemini CLI. FETCHED:** five pages of its docs from the source repo, google-gemini/gemini-cli at commit 9b6e0265d16b, raw, HTTP 200 each: the hooks overview, the hooks reference, the context-file page, the skills page and the subagents page. **NOT DONE:** Gemini CLI is not installed on this Mac (`gemini`: command not found), so nothing below was run.

- Hooks exist and the shape is close. The event before a tool runs is `BeforeTool`. Hooks are configured in `settings.json` (project, user, or system). The hook gets `tool_name` and `tool_input`. Exit 0 with `{"decision": "deny"}` on stdout blocks; exit 2 is a "System Block" with stderr as the reason. The shell tool is named `run_shell_command`, not Bash. So the same adapter idea would work with a different matcher and a different deny shape. Not built.
- The global context file is `~/.gemini/GEMINI.md`. Bootstrap deliberately does not write it, because Gemini CLI and Antigravity both own that file.
- Skills: user skills are read from `~/.gemini/skills/` or `~/.agents/skills/`, and the docs call the second "an interoperable path". So a skill linked for Codex is also visible to Gemini CLI.
- Custom agents are Markdown files with frontmatter in `~/.gemini/agents/`, a different format from Codex's TOML.

**Antigravity. NOT FETCHED.** No Antigravity documentation was read for this doc. What is known is local only: `~/.gemini/AGENTS.md` on this Mac is a link to the vault rulebook, made by bootstrap, whose comment says Antigravity 2.3.1 reads that path. Whether Antigravity has hooks, and in what shape, is unknown here.

## Turning it on (Zaal's steps)

After zaal-dotfiles PR 517 is merged:

```
zao-codex-setup --check                  # read-only: what is on, per Codex home
zao-codex-setup --apply                  # links the rules and the agent; installs the hook where hooks.json is empty
zao-codex-setup --apply --merge-hooks    # also appends the guard to Orca's hooks.json, after a dated backup
```

Then, in a Codex pane: `/hooks`, review the one new entry, trust it. Until then Codex skips it.

To turn it off: remove `AGENTS.override.md` and `agents/zao-evaluator.toml` from the Codex home (both are links), and restore the dated `hooks.json` backup.

What is not known about the last command: whether Orca keeps an entry it did not write the next time it rewrites its hooks file. If it does not, `--check` reports the hook OFF again, and bootstrap runs `--check` every time.

## Not verified

- The recursive-delete guard through a live Codex run (the model declined before the hook was asked).
- The hook running beside Orca's nine in the managed home.
- Whether Orca preserves a foreign hook entry.
- A live spawn of the evaluator agent, and whether a parent session can override its read-only sandbox.
- Whether the 32 KiB limit applies to project-level AGENTS.md files.
- The live answers in findings 2 and 3 are the model's report of its own instructions. The quoted final words matched the file exactly, which is why I trust them; it is still a model's account.
- Anything about Gemini CLI or Antigravity at runtime.
- The status line and the edit-time guards were not assessed.

## Sources

- Codex documentation, fetched by curl 2026-10-12T17:53Z, HTTP 200 each, FULL: [hooks](https://developers.openai.com/codex/hooks), [skills](https://developers.openai.com/codex/skills), [subagents](https://developers.openai.com/codex/subagents), [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md), [non-interactive mode](https://developers.openai.com/codex/noninteractive), [config reference](https://developers.openai.com/codex/config-reference). Quotes are from the page text with markup removed.
- [Ruler](https://github.com/intellectronica/ruler) and [rulesync](https://github.com/dyoshikawa/rulesync): README (raw) and licence (GitHub API), 2026-10-12.
- Gemini CLI docs source: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) at 9b6e0265d16b, `docs/hooks/index.md`, `docs/hooks/reference.md`, `docs/cli/gemini-md.md`, `docs/cli/skills.md`, `docs/core/subagents.md`.
- Local reads on the Mac, 2026-10-12: the two Codex homes, the shared skills folder, zaal-dotfiles `bootstrap.sh` and the three guards, and four `codex exec` runs (two for the hook, two for the rules).
- zao-vault `decisions/grill-2026-10-09-seat-morning.md` item 185 (private; relayed by the seat, not read by me in the file).
- zaal-dotfiles PR 517 (private repo): the files this doc describes.
