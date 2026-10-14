---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "2672, 2353, 2188"
original-query: "check out the next best practices to keep coding even when at rate limit for claude since im down to 2 100$ plans now we gotta make best use of the other tools"
tier: STANDARD
---

# 2675 - Working through Claude rate limits with two Max plans, Codex, Gemini, OpenRouter and Ollama

> **Goal:** Say what the Claude weekly cap counts, how to run two Max $100 plans side by side on one Mac, which lane work goes to which other tool (with the command to start it), and three tooling changes.

Asked by Zaal on 2026-10-13, relayed by the orchestrator2 seat. Current as of 2026-10-14. Two Claude Max $100 plans (zao, zaalp), Codex on the $20 ChatGPT plan, Google AI $20, OpenRouter, Ollama (per a ruling by Zaal on 2026-10-10).

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE one account per lane, fixed at launch. Do not switch accounts inside a running session with `/login`.** | Claude Code keeps each account's login, settings and session history in its own config directory, chosen by `CLAUDE_CONFIG_DIR` at start (Claude Code docs, iam). Orca already holds **3** Claude accounts on this Mac (`orca account list`, 2026-10-14). Switching with `/login` changes the account for that config directory, so every lane sharing it moves too. |
| 2 | **SPLIT lanes across the two plans so one cap never stops all of them.** Coordination lanes (seat, evaluator, merge, grill) on one plan, building lanes on the other. When a plan runs out, open new lanes on the other plan. | Each Max plan has its own **five-hour session limit, a weekly limit across all models, and a separate weekly Fable limit**, and the weekly limit resets at a fixed time assigned to the account (Claude help center). Doc 2672 measured the coordination lanes at **54.0% and 51.1%** of spend on 12 and 13 Oct, so the split is close to even. |
| 3 | **DO NOT count on `fallbackModel` to survive a cap.** | The docs say a fallback chain switches only on overload, unavailability or server errors: "Authentication, billing, rate-limit, request-size, and transport errors ... never trigger a switch" (Claude Code docs, model-config). A Sonnet fallback does not rescue a capped Opus session. |
| 4 | **HAND OFF through the lane brief, not a copied conversation.** When a lane hits its cap, it writes or refreshes `~/zao-vault/handoffs/<lane>.md` and Codex continues from that file in the same worktree. | This uses the handoff system we already have (`.claude/rules/handoff-discipline.md`). Two community tools do the same job: Hydra copies context to the clipboard, and an HN commenter saves a short handoff from hooks. A brief on disk survives the switch; a clipboard does not. |
| 5 | **INSTALL Gemini CLI. It is not on this Mac.** | `command -v gemini` returned nothing on 2026-10-14; `~/.gemini/` holds only Antigravity files. The README gives **60 requests/min and 1,000 requests/day** when signed in with a personal Google account, before any paid tier. |
| 6 | **SKIP usage credits unless Zaal turns them on.** | Usage credits keep a capped plan working at pay-as-you-go prices (help center). That is spend, which is Zaal's decision. |
| 7 | **SKIP routing Claude Code itself through OpenRouter for daily work.** Keep OpenRouter where it already runs: ZOE's cap fallback for text jobs. | OpenRouter bills per token from credits and says Claude Code through OpenRouter "is only guaranteed to work with the Anthropic first-party provider" (OpenRouter docs). That is the Claude API at list price, not a way around the cap. |

**Not checked:** whether running two personal Max subscriptions side by side is within Anthropic's consumer terms. One search result called it "a gray area"; that page was not fetched and the terms were not read. Each plan here is Zaal's own paid account, not resold access, but the terms should be read before this doc is treated as settled.

## 1. What the cap counts

From the Claude help center, fetched raw on 2026-10-14:

- **Three limits per Max plan**: a session limit that resets every five hours, a weekly limit across all models, and a separate weekly limit for Fable.
- **Shared across products**: "These limits are shared across Claude and Claude Code, meaning all activity in both tools counts against the same limits." Chat on claude.ai and Claude Code draw on the same account.
- **Fixed weekly reset**: "The weekly limit resets at a fixed time each week that is assigned to your account." The time is shown at claude.ai Settings > Usage.
- **Past the limit**: wait for the reset, or turn on usage credits.

What `/usage` in Claude Code shows on a subscription (Claude Code docs, costs): plan usage bars, plus a breakdown of recent usage by skill, subagent, plugin and MCP server, flags such as long context or cache misses when one is 10% or more of usage, and the heaviest `/loop` tasks. Press `d` or `w` for 24 hours or 7 days. **It reads local session history on this machine only**, so other devices and claude.ai chat are not in it. Doc 2672 found the same thing in our transcripts: on 12 and 13 Oct, **85% and 89%** of spend was context being re-read or rewritten into the cache.

## 2. Running two plans on one Mac

| Method | How | Fits this estate? |
|---|---|---|
| `CLAUDE_CONFIG_DIR` per account | `alias claude-zaalp='CLAUDE_CONFIG_DIR=~/.claude-zaalp claude'`. The first run asks you to log in. Each directory has its own settings, history and login; on macOS the Keychain entry is keyed to the directory (Claude Code docs, iam) | **Yes, for terminals outside Orca.** Settings and skills do not carry over, because `~/.claude/settings.json` and `~/.claude/skills` are links into `~/zaal-dotfiles`. A second directory needs the same links. |
| Orca managed accounts | `orca account add --agent claude`, `orca account list`. **3** Claude accounts are registered on this host | **Yes, for Orca panes.** `orca account select` only accepts `--agent opencode\|devin` (its `--help`, 2026-10-14). How a Claude pane picks its account was not measured. Codex has a per-pane record (`codex-pane-accounts.json`); a Claude equivalent was not found. |
| `/login` switching | `/logout`, then `/login` with the other account | **No, except for a one-off.** It changes the account for the whole config directory, and every lane on that directory moves with it. |

## 3. Which tool does which lane work

| Lane work | Tool | Start command | Why |
|---|---|---|---|
| Editing live code with verify and PR; anything that needs this repo's rules, hooks and skills | Claude Code | `claude` in an Orca pane on the lane's assigned plan | The only tier here that loads `.claude/rules`, the hooks and the skills (`.claude/rules/claude-usage.md`). |
| Well-specified mechanical code; read-only inventory with known paths; a second-model check of a count | Codex CLI 0.153.4, `gpt-5.6-terra`, reasoning low (`~/.codex/config.toml`) | `codex exec "<spec with file list>"` in the lane's worktree, or `codex` for the TUI | Measured 2026-10-11 in agent memory: strong at inventory with clear paths, weak at finding files or judging done-ness (it reported 0 cards done where 10 were). Check what it returns. |
| Research triage, reading long documents, Google Docs and Sheets output | Gemini CLI (not installed yet) | `brew install gemini-cli`, then `gemini` and choose Sign in with Google | 1,000 requests/day on a personal Google account (README). The Google AI $20 plan already pays for the Docs and Sheets side. |
| Bulk summarising and classifying inside ZOE loops | OpenRouter, through ZOE's router | Already wired: `bot/src/zoe/models/cli-cap-aware.ts` falls back to a non-Claude provider on `usage_limit`, `rate_limit` or `auth` | Text jobs only. The file says editing jobs must wait for the reset, because a text provider cannot edit files. |
| Offline or private small jobs; a Claude Code front end on a non-Claude model | Ollama 0.40.3 | `ollama launch claude --model <model>`; models here: `llama3.2` (local, 2.0 GB), `minimax-m2.7:cloud`, `nemotron-3-super:cloud` | `llama3.2` is too small for repo work. The `:cloud` models run on Ollama's servers, so they are not private. ZOE's router uses Ollama only with `OLLAMA_ENABLED=1`. |

## 4. What the community does (fetched 2026-10-14)

| Practice | Source | What it says |
|---|---|---|
| Separate config directory per account | GitHub anthropics/claude-code #18435, 200 comments | A commenter notes the CLI "already" has "workarounds using CLAUDE_CONFIG_DIR"; the Desktop app does not. Others want to run work and personal accounts side by side. |
| Handoff file on cap, then switch agent | HN 49904074 | "Hooks in Claude Code and Codex save a short handoff as the agent works: objective, progress, decisions, rejected approaches, next step. When you hit the limit you open the other agent, type 'Continue.'" (the tool's author, by their own account). |
| A wrapper that switches CLIs on cap | HN 47851935, `saadnvd1/hydra` (MIT, LICENSE file read) | "When one hits a rate limit, switch to another with your conversation context on the clipboard." It watches terminal output for rate-limit errors. **SKIP for us:** it wraps the TUI that Orca already hosts, and the clipboard is not where our state lives. |
| Cut what each turn costs | r/ClaudeAI usage-limits megathread, mod workaround guide dated 2026-03-30 | Default to Sonnet, cap thinking tokens, compact earlier, send subagents to Haiku, keep CLAUDE.md short, `/clear` between tasks, plan in Opus and build in Sonnet. The guide's savings figures ("60-80%") are the poster's, not measured here. Doc 2672 already measured our version: change models when a session starts, never partway through. |
| Peak-hour burn | same guide | Says session limits burned faster on weekdays 5am to 11am PT from about 23 Mar 2026. Seven months old and not confirmed by Anthropic in anything fetched here; treat it as UNVERIFIED. |
| Limits drain too fast | GitHub anthropics/claude-code #16157 "Instantly hitting usage limits with Max subscription", 1,499 comments, open | Only the title and comment count were read. Shows how common the complaint is; not used as evidence of a cause. |

## 5. Three changes to our tooling

| # | Change | File it touches | Gate |
|---|---|---|---|
| 1 | Replace the surface ladder with the table in section 3, and add: one plan per lane fixed at launch; `fallbackModel` does not cover caps; on cap, hand off through the brief. | `.claude/rules/claude-usage.md` (this repo) | PR, docs. |
| 2 | Give `zao-lane-boot` an `--agent codex` option. It boots a lane from its brief with `codex` instead of `claude`, using the same "read this brief in full" prompt it already sends at line 58. A capped lane is then one command from continuing on Codex. This extends the existing tool rather than adopting Hydra. | `~/zaal-dotfiles/bin/zao-lane-boot` | PR in zaal-dotfiles. |
| 3 | Add `account: zao \| zaalp` to the brief frontmatter, and have `zao-lane-boot` launch with the matching `CLAUDE_CONFIG_DIR`. The plan split in decision 2 is then written down per lane instead of remembered. | `~/zao-vault/handoffs/TEMPLATE.md` and `~/zaal-dotfiles/bin/zao-lane-boot` | PR in each; the second config directory needs the dotfiles links first. |

## Also See

- [Doc 2672](../2672-model-tier-routing-cost-per-merged-pr/) - our own spend measured; why to change models only at the start of a session
- [Doc 2664](../2664-claude-working-style-ported-to-codex/) - our shell guards and working style ported to Codex, which a lane handed off to Codex needs
- [Doc 2353](../../agents/2353-model-tiering-and-escalation/) - model tiering and escalation
- [Doc 2188](../../agents/2188-cheap-fleet-premium-escalation/) - cheap fleet, premium escalation
- `.claude/rules/claude-usage.md`, `.claude/rules/agent-spend.md`
- Tracker: `zao-tracker search "rate limit"` returned no open task, 2026-10-14

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide which lanes go on zao and which on zaalp (decision 2) | Zaal | Decision | Before the next weekly reset |
| Install Gemini CLI and sign in with the Google AI account | Zaal (needs his Google login) | Setup | When convenient |
| Read Anthropic's consumer terms on running two personal plans | repo-refresh lane | Research | Before change 3 ships |
| Change 1: update `claude-usage.md` | repo-refresh lane | PR | After this doc merges |
| Change 2: `zao-lane-boot --agent codex` | dotfiles lane | PR | After this doc merges |
| Change 3: `account:` frontmatter plus boot launch | vault and dotfiles lanes | PR | After decision 2 |

## Sources

- [Claude Code docs: authentication, "Log in with multiple accounts"](https://code.claude.com/docs/en/iam.md) [FULL - raw markdown with curl, sections read: multiple accounts, credential storage]
- [Claude Code docs: costs and `/usage`](https://code.claude.com/docs/en/costs.md) [FULL - raw markdown with curl]
- [Claude Code docs: model configuration, fallback model chains](https://code.claude.com/docs/en/model-config.md) [FULL - raw markdown with curl, fallback section read]
- [Claude Code docs: settings](https://code.claude.com/docs/en/settings.md) [PARTIAL - raw markdown, only the CLAUDE_CONFIG_DIR passage was used]
- [Claude help center: Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan) [FULL - curl and HTML strip]
- [Claude help center: What is the Max plan](https://support.claude.com/en/articles/11049741-what-is-the-max-plan) [FULL - curl and HTML strip]
- [Claude help center: Usage credits for paid plans](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) [FULL - curl and HTML strip]
- [OpenRouter: Claude Code integration](https://openrouter.ai/docs/cookbook/coding-agents/claude-code-integration.md) [FULL - raw markdown with curl; the first URL tried, /docs/guides/claude-code-integration.md, returned 404]
- [Ollama: Claude Code integration](https://docs.ollama.com/integrations/claude-code.md) [FULL - raw markdown with curl]
- [google-gemini/gemini-cli README](https://github.com/google-gemini/gemini-cli) [FULL - gh api readme; Apache 2.0 from the LICENSE file]
- [openai/codex README](https://github.com/openai/codex) [FULL - gh api readme; Apache 2.0 from the LICENSE file]
- [saadnvd1/hydra README](https://github.com/saadnvd1/hydra) [FULL - gh api readme; MIT from the LICENSE file]
- [HN 49904074: How do you handle hitting AI coding agent usage limits?](https://news.ycombinator.com/item?id=49904074) [FULL - zao-fetch-hn.sh thread, raw]
- [HN 47851935: Show HN: Hydra](https://news.ycombinator.com/item?id=47851935) [FULL - zao-fetch-hn.sh thread, raw]
- [GitHub anthropics/claude-code #18435: multiple accounts](https://github.com/anthropics/claude-code/issues/18435) [FULL - gh api, body and all comments]
- [GitHub anthropics/claude-code #16157: instantly hitting usage limits](https://github.com/anthropics/claude-code/issues/16157) [PARTIAL - title, state and comment count only]
- [r/ClaudeAI usage limits megathread, mod workaround guide](https://www.reddit.com/r/ClaudeAI/comments/1s7fcjf/claude_usage_limits_discussion_megathread_ongoing/odhu5r4/) [PARTIAL - read raw through a redlib mirror; the workaround guide was read, the 3,000 replies were not]
- Reddit search for r/ClaudeCode threads [FAILED - `zao-fetch-reddit.sh` has no OAuth credentials on this Mac; reddit.com search.json returned 403. Escalated: the megathread above, read through a mirror, stands in for it]
- Anthropic consumer terms on multiple accounts [FAILED - not fetched; flagged under Key Decisions as not checked]
- Local measurements, 2026-10-14: `orca account list` (3 Claude accounts; emails withheld), `orca account select --help`, `command -v gemini` (absent), `codex --version`, `ollama list`, `~/.codex/config.toml`, `bot/src/zoe/models/cli-cap-aware.ts`, `~/bin/zao-lane-boot`
