# 2699 BUILD log - ZAO Agent, the from-scratch agent

**Name: ZAO Agent** (Zaal confirmed 22 Oct 2026). The repo stays `bettercallzaal/zao-agent`.

One line per PR, newest last, so the agent's state can be read at any moment. A build log, not
a research doc: the research, sources and options are in [README.md](./README.md).

**State as of 2026-10-22:** library code only. Nothing runs as a bot, nothing is deployed, no
token exists. Runs locally on the Mac only, when it runs at all. ZOE is untouched.

## Decisions taken while building (auto-proceeded, override any of them)

| # | Choice | Why |
|---|---|---|
| 1 | **Repo `bettercallzaal/zao-agent` (private), not `hermes`** (Zaal confirmed 22 Oct: name ZAO Agent, no rename) | A 2026-09-09 naming decision reserves "Hermes" for the Nous Research program, and that program is installed on this Mac (`~/.hermes`, the `hermes` command at `~/.local/bin/hermes`). A second thing called hermes here collides with both. GitHub keeps redirects on rename, so the grill's answer costs nothing to apply. |
| 2 | **One bootstrap commit to main** (README only, `822385e`) | An empty repo has no base for a PR. Every change after it is a PR. |
| 3 | **No CI** | Actions minutes on a private repo are a spend. Verification is local typecheck with a planted-error control, the full test run, and evaluator-b2 on each PR. |
| 4 | **Same toolchain ranges as the ZAOOS bot package** (TypeScript ^5.6.0, vitest ^3.2.6, @types/node ^22.7.0) | No new dependency enters the estate. |

## Ruling this build follows

Zaal, 22 Oct 2026: build a fresh agent rather than keep extending ZOE. The build's shape: private repo, TypeScript core under 2,500 lines, Telegram DM first with
a token Zaal enters through `/secret`, vault and board as memory, PR-only hands, hard-coded
gates, local run only.

## Correction to doc 2699

The doc compared adopting NousResearch Hermes Agent against building, but did not say that
Hermes Agent is already installed and in use on this Mac (`~/.hermes`) or that its name is
reserved by the 2026-09-09 decision. Found 2026-10-22 while picking the repo name. The
recommendation (build a small core) stands; the omission is recorded here.

## Best practice applied to this build (fetched 2026-10-22)

Read raw: the NousResearch/hermes-agent docs sources (`website/docs/guides/tips.md`,
`use-soul-with-hermes.md`, `delegation-patterns.md`, `user-guide/profiles.md`,
`features/context-files.md`) via the GitHub API, and Anthropic's "Writing effective tools for
agents" and "Effective context engineering for AI agents" via curl and an HTML strip.

| # | Practice (source) | What it changes here |
|---|---|---|
| 1 | Identity and project context are separate files: SOUL.md holds tone and style and "should apply everywhere"; repo facts belong in AGENTS.md (Hermes, use-soul) | One small, stable persona file. ZAO facts are looked up from the vault, never pasted into the persona |
| 2 | Memory is bounded (~2,200 chars MEMORY.md, ~1,375 chars USER.md), split "what" (memory) from "how" (skills), and frozen per session (Hermes, tips) | A small bounded memory block per person; everything else is a vault or board lookup |
| 3 | "Don't break the prompt cache": a model switch or provider fallback re-reads the whole conversation at full price (Hermes, tips) | Pick the model once per session, not per turn. Code requests go to a separate fresh-context call instead of switching the main session's model. This changes the per-request Haiku/Sonnet split in doc 2699 |
| 4 | Context is "the smallest possible set of high-signal tokens"; load data "just in time" through lightweight identifiers (Anthropic, context engineering) | The system prompt carries paths and ids; tools fetch the content when needed |
| 5 | "More tools don't always lead to better outcomes"; do not just wrap API endpoints; unambiguous parameter names (`user_id`, not `user`); truncate with helpful errors (Claude Code caps tool output at 25,000 tokens) (Anthropic, tools) | A few agent-shaped tools (ask the vault, read my board items, capture, request a PR), each with a size cap and an error that says how to narrow the request |
| 6 | Never allow all users on a bot with terminal access; use allowlists or DM pairing, where a teammate gets a one-time code that the owner approves (Hermes, tips) | Roster plus pairing: a teammate's first DM gets a code, and Zaal approves it with one tap. No allow-all switch exists |
| 7 | Approval offers once / session / always / deny, and "always" permanently allowlists a pattern (Hermes, tips) | No "always" for the gated kinds. Every gated action is approved once, by Zaal |
| 8 | Context files are scanned for prompt injection ("ignore previous instructions", hidden HTML, `cat .env`, zero-width characters) and blocked on a hit (Hermes, context-files) | Vault and board text is written by people, so it is scanned and treated as data, never as instructions |
| 9 | Never point two agent processes at one home: "both write memory automatically" and compound each other's state; a second gateway on the same token is refused (Hermes, profiles) | One process per token and one memory home, matching `agent-loops.md` rule 9 |
| 10 | Subagents see only the goal and context they are given, cannot ask the user, and are not durable; durable work goes to cron or a background job (Hermes, delegation) | Long work becomes a board card or a PR, never an in-memory task that a restart can lose |
| 11 | Set a home channel or the agent "has nowhere to send proactive messages" (Hermes, tips) | One home chat, Zaal's DM by default, until he names the team group |

**Also found:** Nous Hermes Agent v0.21.7 (2026.9.24) is installed on this Mac, with OpenRouter
`anthropic/claude-haiku-4.5` as the default model and a persona file configured. Its `agent.log` was last written 2026-10-12
(file mtime, so a proxy). The latest release is v0.22.4.

## Next actions

| Action | Owner | Gate |
|---|---|---|
| Evaluator verdict on zao-agent #1 | evaluator-b2 | none |
| PR 2 `core/gates.ts`, with practices 6 to 8 above as tests | this lane | evaluator |
| PR 3 roster with pairing codes | this lane | evaluator |
| Name, first three team tasks, Telegram group, model plan | Zaal (grill) | his facts and money |
| Bot token through `/secret` (needed only at PR 7) | Zaal | his |

## PRs

| # | Repo PR | Head | What | Lines (core total) | Verdict |
|---|---|---|---|---|---|
| 1 | zao-agent #1 | 3c5bdc4c | `src/core/loop.ts`: one turn, tool calls gated first, fail closed with no gate; scaffold and line-budget script | 140 (140 / 2,500) | pending evaluator-b2 |
| - | zao-agent #2 | ef13e173 | README: name is ZAO Agent | 0 | pending evaluator-b2 |
| 2 | not opened yet, branch `pr2-gates` at 4aed564f | 4aed564f | `src/core/gates.ts`: eight gated kinds never run, argument scan, frozen table; 34 both-direction tests | 102 (242 / 2,500) | opens after #1 merges (zao-pr-open refuses stacked PRs) |

## Sources

- [bettercallzaal/zao-agent](https://github.com/bettercallzaal/zao-agent) (private), PR #1
- [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) (MIT), the program the name "Hermes" is reserved for
- [Hermes tips guide](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/guides/tips.md) [FULL]
- [Use SOUL.md with Hermes](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/guides/use-soul-with-hermes.md) [FULL]
- [Hermes profiles](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/profiles.md) [PARTIAL - sections 1 to 3 and token locks read]
- [Hermes context files](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/context-files.md) [PARTIAL - injection, size limits and tips sections read]
- [Hermes delegation patterns](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/guides/delegation-patterns.md) [PARTIAL - when to delegate, constraints, tips]
- [Anthropic, Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) [PARTIAL - principle passages read]
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) [PARTIAL - principle passages read]
- Doc 2699 [README.md](./README.md), with the full source list
