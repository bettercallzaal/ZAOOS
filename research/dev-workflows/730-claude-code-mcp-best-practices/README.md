---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-23
related-docs: 154, 232, 238, 408, 429, 440, 687, 694, 728
original-query: "online best practices with this and best mcps to use with claude code to maximize performance and speed and automation"
tier: STANDARD
---

# 730 — Claude Code Best Practices + Best-of-Breed MCP Stack for ZAOOS

> **Goal:** Pin down the 2026 Claude Code power-user stack — which MCPs to install, which hooks to wire, which skills to author, how to manage the 1M context window — and map each pick to ZAOOS reality. Sister doc to 728 (Serena).

## Key Decisions (Recommendations First)

| # | Decision | Reason | Action |
|---|----------|--------|--------|
| 1 | **INSTALL Supabase MCP — but with hard scoping** ([HN 848 pts — DB-leak via prompt injection](https://news.ycombinator.com/item?id=44502318)) | ZAOOS lives on Supabase. Direct query beats Read+grep. BUT a 2025-07 disclosure shipped a SQL-exfiltration attack via support-ticket prompt injection — anon key + RLS only, never service role in a context that reads untrusted text | `claude mcp add supabase` → bind ANON key + RLS; service role only via a sandboxed read-only subagent with `disallowedTools: Write,Edit,Bash` |
| 2 | **INSTALL Sentry MCP** (when Sentry wiring restored) | The Vercel deploy already pings Sentry per `.claude/settings.json` postinstall. Pulling live errors into the session collapses 10-min debugging to 90 sec ([mcpcatalog](https://mcpcatalog.dev/blog/best-mcp-servers-claude-code)) | Phase 2; verify Sentry project active first |
| 3 | **INSTALL Chrome DevTools MCP** alongside existing Playwright MCP ([HN 604 pts cross-validation](https://news.ycombinator.com/item?id=47390817)) | Playwright MCP for scripted flows; Chrome DevTools MCP for debugging the tab you already have open ([developersdigest](https://www.developersdigest.tech/blog/271-mcp-servers-top-5-that-matter)) — different jobs, both lightweight | `npm install -g @modelcontextprotocol/server-chrome-devtools` then add via absolute binary path (NOT `npx -y` — see Decision #13) |
| 4 | **KEEP current stack** (context7, gitnexus, playwright, serena, exa, github plugin, memory plugin, sequential-thinking, grep.app, gmail, gcal, gdrive) | All earn their token cost. Tool Search lazy-loads schemas so 12+ MCPs ≠ context bloat in Claude Code 4.x ([toolradar](https://toolradar.com/blog/best-mcp-servers-claude-code)) | No action |
| 5 | **SKIP Firecrawl MCP** | Already use exa web_fetch as the JS-rendered fetcher; Firecrawl needs API key + would duplicate. `/zao-research` skill v2.3 explicitly says "firecrawl NOT installed" | No action |
| 6 | **SKIP Brave Search MCP** | exa + WebSearch + WebFetch + grep.app cover search; Brave Search MCP failed silently in production ([theeditorial.news 6-week test](https://theeditorial.news/ai-agents/best-mcp-servers-for-production-ai-agents-in-2026-seven-tested-three-actually-ship-mpgvmg42), 12% timeout rate) | No action |
| 7 | **SKIP Linear / Jira MCPs** | ZAO does not use them — work tracks in cowork-zaodevz actions.json + GitHub Issues + Telegram. Save tool-description budget | No action |
| 8 | **ADD 4 high-leverage hooks** to `.claude/settings.json` (context injection, deny-credentials, post-edit format, post-compact reinject) | Highest-ROI level-up after the basic lint/typecheck/branch-guard already shipped | See "Hook Build-Out" section |
| 9 | **AUDIT skill listing budget** — 100+ skills loaded; raise `skillListingBudgetFraction` to 0.02 or set `skillOverrides` to hide rarely-used plugin skills | Default 0.01 (1% of context) truncates skill descriptions; you have 250+ skills from `everything-claude-code` + plugins | Edit `~/.claude/settings.json` |
| 10 | **ADOPT subagent-driven research as default for any task touching >5 files** | Subagents run in their own context window and return summaries — keeps main session clean. Already happens via Explore/Plan; codify in CLAUDE.md | Add line to Workflow Orchestration in CLAUDE.md |
| 11 | **COMPACT proactively at 70-75% context** (not the auto-trigger at 83.5%) | Community consensus from 2026-03 Generative.inc guide — earlier compaction preserves higher-quality summaries | Behaviour change; track via `/context` |
| 12 | **VERIFY Tool Search is on** (`ENABLE_TOOL_SEARCH=auto:5`) | Cuts MCP context consumption ~47%. Default in Claude Code 4.x but worth confirming via `/doctor` | One-time check |
| 13 | **MIGRATE all `npx -y` MCP installs to global-pinned binaries** ([modelcontextprotocol/servers#4026](https://github.com/modelcontextprotocol/servers/issues/4026)) | `npx -y` causes intermittent 4-min hangs on file writes (re-resolves package on every stdio handshake; races startup window). Reads succeed; writes hang silently | For each MCP currently using `npx -y`: `npm install -g <pkg>` then replace command with absolute binary path |
| 14 | **AUDIT custom MCPs for unfiltered `process.env` exposure** ([modelcontextprotocol/servers#3986](https://github.com/modelcontextprotocol/servers/issues/3986)) | `server-everything` reference shows a `get-env` tool that dumps ALL env (`OPENAI_API_KEY`, `GITHUB_TOKEN`, etc.). Community servers copy this pattern. Foot-gun | grep installed MCP src for `process.env` returns; require a `key` parameter or regex-filter |
| 15 | **CALIBRATE Serena expectations — 35% session-adoption reality** ([oraios/serena#1491 — n=192 sessions, 21k tool calls](https://github.com/oraios/serena/issues/1491)) | Real telemetry: 64% of Claude Code sessions fall back to plain Read/Grep/Glob even when Serena is connected; 18% of `find_symbol` calls are followed by a plain `Read` of the same file because symbol body alone lacks surrounding context | Frame Doc 728 adoption goal as "use Serena WHEN refactoring/renaming/cross-ref" — not "use Serena instead of Read." Pair Serena with explicit prompt nudges |
| 16 | **DEFER hook-driven automation that depends on missing events** ([openai/codex#21753 hook parity tracker](https://github.com/openai/codex/issues/21753)) | `PostToolUseFailure`, `FileChanged`, `SubagentStart/Stop`, `ConfigChange` are NOT shipped. Designs that assume them silently no-op | Build on shipped events only (SessionStart, PreToolUse, PostToolUse, Stop, Notification, PermissionRequest, UserPromptSubmit). Track the umbrella issue |

## Current ZAOOS MCP State (Verified 2026-05-23 from session deferred tools list)

| MCP server | Status | Verdict | Notes |
|------------|--------|---------|-------|
| **context7** | Connected | KEEP — top-3 essential | Live docs for Next.js / Supabase / etc. — kills version-drift hallucinations |
| **playwright** | Connected | KEEP — top-5 essential | Already used by `/browse` + `/gstack` + `/qa` skills |
| **serena** | Connected | KEEP (Doc 728) | Semantic code intel; hooks pending per Doc 728 |
| **gitnexus** | Connecting | KEEP — monitor | Call-graph queries for "what breaks if I change this" |
| **exa** | Connected (via plugin) | KEEP — primary semantic search | exa web_search + web_fetch are the firecrawl replacement |
| **github (plugin)** | Connected | KEEP — but use sparingly | Doc 728 + dev community both note `gh` CLI via Bash often beats this for token efficiency |
| **memory (plugin)** | Connected | REVIEW — overlaps with auto-memory + Serena memories | Decide which is canonical (probably Serena per-project + global auto-memory; drop plugin memory) |
| **sequential-thinking (plugin)** | Connected | DROP per [developersdigest](https://www.developersdigest.tech/blog/271-mcp-servers-top-5-that-matter) | Opus 4.7 with `/effort high` reasons natively; the MCP was pre-`/effort` shipping |
| **grep.app (mcp__grep__searchGitHub)** | Connected | KEEP — cross-repo essential | `/zao-research` v2.2 hard-uses this for bettercallzaal org search |
| **claude_ai_Gmail** | Available | KEEP | Used by `/inbox` skill for zoe-zao@agentmail.to |
| **claude_ai_Google_Calendar** | Available | KEEP | Used by `/morning` + `/meeting` skills |
| **claude_ai_Google_Drive** | Available | KEEP | Doc storage + research artifact handoff |
| **Supabase MCP** | NOT INSTALLED | INSTALL (Action #1) | Direct query/schema introspection beats Read+grep |
| **Sentry MCP** | NOT INSTALLED | INSTALL Phase 2 (Action #2) | Live error → fix pipeline |
| **Chrome DevTools MCP** | NOT INSTALLED | INSTALL (Action #3) | Companion to Playwright for already-open tabs |
| **Filesystem MCP** | N/A | SKIP | Claude Code's native Read/Write/Edit covers this; community-best-of unanimously native-only |
| **Brave Search MCP** | N/A | SKIP | Failed 12% of tasks in production test |
| **Firecrawl MCP** | N/A | SKIP | exa web_fetch covers it; `/zao-research` v2.3 banned reference |
| **Linear / Jira / Atlassian MCP** | N/A | SKIP | Not on the ZAO stack |
| **Slack MCP** | N/A | SKIP | Doc 601 — ZAO is on Telegram, not Slack |
| **Notion MCP** | N/A | DEFER | Not load-bearing yet; Bonfire holds knowledge |

## Findings

### Best Practices Tier — Settings, Hooks, Skills, Subagents

This is the 80/20 of Claude Code power-use. Sources converge tightly:

**1. CLAUDE.md is foundation. Settings.json is policy. Hooks are guarantees. Skills are workflows. Subagents are isolated contexts. MCPs are external reach.**

Quote from [aicodex.to](https://www.aicodex.to/articles/claude-code-project-setup):
> "The 80/20: CLAUDE.md and settings.json get you most of the value. Every layer after that is an optimization on a working foundation."

ZAOOS already has all five layers wired. Where ZAOOS is **behind the 2026 power-user bar**:
- Hook breadth (today: lint/typecheck/branch-guard/notification — missing context-injection, post-compact, deny-credentials, dangerous-bash-firewall)
- Skill budget management (100+ skills loaded; default 1% context fraction probably truncating descriptions)
- Subagent usage for read-many-files work (already happens via Explore but not codified)

**2. Context window management is the master skill.**

[Generative.inc guide](https://www.generative.inc/the-complete-claude-code-guide-2026-planning-context-engineering-and-high-leverage-development):
> "Context management is the single most important skill for Claude Code productivity. More important than prompt engineering. More important than knowing every feature."

Specific levers:
- `/context` shows token allocation — check regularly
- `/compact` at 70-75% (proactive) beats auto-compact at 83.5% — better summary quality
- `/clear` between unrelated tasks
- Subagents for read-many-files investigation — they return summaries to main thread
- `ENABLE_TOOL_SEARCH=auto:5` cuts MCP context ~47% (default on Claude Code 4.x)

**3. Hooks > Memory for must-happen rules.**

[Refactix](https://refactix.com/ai-development-engineering/claude-code-power-user-guide-skills-hooks-subagents):
> "The harness executes hooks, not Claude. That matters when a user says 'from now on, always do X.' Claude can't enforce that across sessions, but a hook can."

ZAO `/update-config` skill description captures this exact rule: "Automated behaviors... require hooks configured in settings.json — the harness executes these, not Claude, so memory/preferences cannot fulfill them."

### Best MCP Stack — 2026 Consensus

After synthesizing 10 independent ranking articles (mcpcatalog, toolradar, self.md, devreviewer, supalaunch, top-mcps, apigene, theeditorial, developersdigest, makeuseof — all FULL-fetched 2026-05-23), the convergent "starter 5" is:

| Rank | MCP | Verdict for ZAOOS |
|------|-----|-------------------|
| 1 | **GitHub MCP / `gh` CLI** | Have GitHub plugin; `gh` via Bash also wired. Lean on `gh` for routine PR/issue work to save tool-description tokens |
| 2 | **Context7** | INSTALLED — top-3 across every ranking |
| 3 | **Postgres / Supabase MCP** | INSTALL — Action #1 |
| 4 | **Playwright MCP** | INSTALLED |
| 5 | **Search (Brave / Exa / WebSearch)** | Use exa; SKIP Brave (failed prod test) |

The convergent "next 5" (install when use case arises):

| Rank | MCP | Verdict for ZAOOS |
|------|-----|-------------------|
| 6 | **Sentry MCP** | INSTALL Phase 2 — Action #2 |
| 7 | **Filesystem MCP** | SKIP — Claude Code natives cover |
| 8 | **Chrome DevTools MCP** | INSTALL — Action #3 |
| 9 | **Memory MCP** | Already have via plugin + Serena + auto-memory; rationalize |
| 10 | **Linear / Slack** | SKIP — not on the ZAO stack |

### Production Reliability Data ([theeditorial.news 6-week test](https://theeditorial.news/ai-agents/best-mcp-servers-for-production-ai-agents-in-2026-seven-tested-three-actually-ship-mpgvmg42))

| MCP | Task success rate | Action |
|-----|-------------------|--------|
| Anthropic Filesystem | 94% | N/A (use Claude natives) |
| Anthropic Postgres | 91% | Install Supabase equivalent |
| Anthropic GitHub | 89% | Already installed |
| Brave Search | 88% (12% timeout) | SKIP |
| Puppeteer | 32-66% (crashes on special chars) | Use Playwright MCP instead |
| Slack | 32% (silent OAuth refresh failure after 7 days) | SKIP — Telegram anyway |

The takeaway: official Anthropic MCPs are production-grade; community MCPs are mixed. Audit before adopting.

### Hook Build-Out — 4 High-Leverage Additions to `.claude/settings.json`

ZAOOS today has these hooks (verified from settings.json):
- PreToolUse `Bash(git commit*)` → lint staged TS
- PreToolUse `Bash(git push*)` → branch-guard + typecheck
- PostToolUse `Write(research/*)` → 8-point research quality score
- PostToolUse `Edit/Write` on src/**/*.ts(x) → eslint --fix
- SessionStart → branch warning if not on ws/*
- Notification → macOS notification

Add these four:

**a. Context injection on SessionStart (high value)**

```json
{
  "matcher": "",
  "hooks": [{
    "type": "command",
    "command": "echo \"{\\\"hookSpecificOutput\\\":{\\\"hookEventName\\\":\\\"SessionStart\\\",\\\"additionalContext\\\":\\\"$(cd \"$PROJECT_DIR\" && git log -3 --oneline; echo '---'; gh pr list --state open --limit 5 2>/dev/null | head)\\\"}}\"",
    "statusMessage": "Injecting branch + open PR state..."
  }]
}
```

**b. Post-compact context re-injection**

Per [Claude Code hooks-guide](https://code.claude.com/docs/en/hooks-guide), `SessionStart` with matcher `compact` re-injects context after auto-compaction. ZAOOS doesn't have this; losing 60-80% of tokens to compact also loses CLAUDE.md guidance unless re-injected.

**c. Deny-credentials read block**

```json
"deny": ["Read(./.env)", "Read(./.env.*)", "Read(**/credentials*)", "Read(**/*.pem)"]
```
This belongs in `permissions.deny`, not hooks. Already covered by `feedback_no_unauthorized_commitments` + `secret-hygiene.md` rules but a hard deny prevents accidental read into context.

**d. Dangerous-Bash firewall (PreToolUse)**

```json
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "INPUT=$(cat); echo \"$INPUT\" | jq -r '.tool_input.command' | grep -E '(rm -rf /|git push --force main|DROP TABLE|chmod 777|sudo)' && exit 2 || exit 0"
  }]
}
```
Already partially covered by `feedback_branch_discipline` and `safe-git-push.sh`; this catches the broader class.

### Skill Hygiene (the 100+ skill problem)

`/skills` listing at session start showed 250+ available skills (zao-research + autoresearch + everything-claude-code:* + caveman:* + superpowers:* + plugin skills). With default `skillListingBudgetFraction: 0.01` (1% of 1M = ~10K tokens), descriptions for least-used skills get auto-collapsed to bare names per Claude Code v2.1.105+.

Action: in `~/.claude/settings.json`, set:

```json
{
  "skillListingBudgetFraction": 0.02,
  "skillOverrides": {
    "everything-claude-code:django-tdd": "name-only",
    "everything-claude-code:laravel-patterns": "name-only",
    "everything-claude-code:perl-testing": "off",
    "everything-claude-code:csharp-testing": "off",
    "everything-claude-code:dotnet-patterns": "off",
    "everything-claude-code:springboot-patterns": "name-only",
    "everything-claude-code:jpa-patterns": "off",
    "everything-claude-code:rust-build": "name-only"
  }
}
```

Rule: ZAOOS is TypeScript / Next.js / Supabase. Set non-relevant language skills to `"off"` or `"name-only"`. Reclaim description tokens for skills you actually use.

Run `/doctor` to see current truncation count.

### Subagent Patterns for ZAOOS

[code.claude.com best-practices](https://code.claude.com/docs/en/best-practices):
> "Since context is your fundamental constraint, subagents are one of the most powerful tools available."

Already in active use:
- `Explore` subagent for codebase search (Doc 728 cited)
- `Plan` subagent for architecture
- `general-purpose` for multi-step research
- `everything-claude-code:typescript-reviewer` etc. for language reviews

Underused subagent patterns to formalize in CLAUDE.md:
- **Spawn one subagent per service directory** for parallel audits (e.g., per `src/lib/agents/*`)
- **Worktree-isolated subagents** for risky refactors (`isolation: "worktree"`)
- **Read-only subagents** for security reviews (restrict to Read/Grep/Glob)

### Speed Wins Beyond MCPs

| Win | How |
|-----|-----|
| `/effort high` for complex reasoning | Opus 4.7 with `xhigh` reasons natively — drops the need for sequential-thinking MCP |
| `/compact <focus>` over default compact | "/compact Focus on the Serena hook plan" preserves what matters |
| `/clear` between unrelated tasks | Free 100% of context vs 60-80% from `/compact` |
| `--bare false` on Max-plan bots | `feedback_no_bare_with_oauth` — Max-plan OAuth strips on --bare |
| Plan mode for read-only audit | Read/search/think only; cannot edit or run destructive cmds |
| Tool Search on (`ENABLE_TOOL_SEARCH=auto:5`) | ~47% MCP context reduction; default on 4.x |
| `/fast` for Opus 4.6+ | Faster output without model downgrade |
| Skill `paths` glob | Skills only auto-activate on matching paths; reduces accidental loads |

### Anti-Patterns (what NOT to do)

1. **Don't install 15 MCPs "in case"** — every tool description costs tokens. Apigene says 15 servers = 30-40% of context lost to schemas in pre-Tool-Search era; even with lazy-load, the listing isn't free.
2. **Don't duplicate built-in tools** — Filesystem MCP, Git MCP, Fetch MCP all overlap Claude natives (developersdigest). Skip.
3. **Don't write SaaS-thin MCPs** — "one tool per REST endpoint" bloats the menu without leverage. Single `run_query` beats 40 narrow tools.
4. **Don't auto-approve writes by default** — auto-approve READS only. Writes need human-in-loop per `feedback_check_pr_state_always` + `feedback_no_push_merged_pr`.
5. **Don't ignore Tool Search** — without it, every MCP tool definition is in context forever. With it, schemas load on demand.

## Comparison Tables

### Claude Code Power-Layer Stack (full)

| Layer | What | Loaded When | Cost | ZAOOS Status |
|-------|------|-------------|------|--------------|
| **CLAUDE.md** | Persistent instructions | Every session | Always-on tokens | Have at root + `~/.claude/CLAUDE.md` |
| **settings.json** | Permissions, hooks, env, plugins | Every session | Tiny | Have project + local |
| **.claude/rules/** | Modular rule files | Every session | Always-on tokens | Have: api-routes, components, tests, ts-hygiene, secret-hygiene, skill-enhancements |
| **.claude/skills/SKILL.md** | Workflow recipes | On-demand or `/skill-name` | Description tokens always; body on activation | 100+ available via plugins |
| **.claude/agents/<name>.md** | Subagent personas | When dispatched | Own context window | Many via everything-claude-code |
| **.mcp.json / mcp servers** | External tools | On-demand via Tool Search | Tool description tokens | 12+ connected |
| **Hooks** | Shell on lifecycle event | At event fire | Negligible | 6 hooks today |

### MCP Categories — ZAOOS Adoption

| Category | Pick | Status |
|----------|------|--------|
| Code search semantic | Serena (LSP) | INSTALLED (Doc 728) |
| Code search text | ripgrep built-in | NATIVE |
| Code search GitHub-wide | mcp__grep__searchGitHub | INSTALLED |
| Library docs | Context7 | INSTALLED |
| Web search | Exa | INSTALLED |
| Web fetch (JS) | Exa web_fetch | INSTALLED |
| Browser automation scripted | Playwright | INSTALLED |
| Browser inspection live | Chrome DevTools | INSTALL (Action #3) |
| Database | Supabase MCP | INSTALL (Action #1) |
| Error tracking | Sentry | INSTALL Phase 2 (Action #2) |
| Email | claude_ai_Gmail | INSTALLED |
| Calendar | claude_ai_Google_Calendar | INSTALLED |
| Doc storage | claude_ai_Google_Drive | INSTALLED |
| Knowledge graph | Bonfire (external) | LIVE |
| Issue tracking | gh CLI | NATIVE via Bash |
| Communication | Telegram via VPS | LIVE |
| Reasoning | `/effort high` native | NATIVE |

## Performance Notes

- 12 active MCP servers + Tool Search lazy-loading = ~15K tokens of tool descriptions vs ~80K without lazy-load ([toolradar](https://toolradar.com/blog/best-mcp-servers-claude-code))
- Adding Supabase + Sentry + Chrome DevTools brings total to 15 — still within the 47%-reduction lazy-load envelope
- 100+ skills with default 1% budget = description truncation; bumping to 2% = ~20K tokens reserved
- Hook execution latency: <100ms typical (eslint --fix on save measured); hooks run in parallel per Claude docs
- Compact at 70% vs 83.5% trigger = ~13 percentage points of usable context preserved with higher summary fidelity

## Community Signal (added 2026-05-23 via 5 parallel scraper agents)

After the initial draft shipped with Reddit marked FAILED, dispatched five parallel research agents to climb the full fetch ladder. Findings below — sources verified, cross-validations called out, contradictions flagged. Recommendations promoted to Decisions #13-16 above.

### Reddit (r/ClaudeAI, r/LocalLLaMA — 9 threads FULL via old.reddit.com .json)

| Thread | Subreddit | Score | Signal for ZAOOS |
|--------|-----------|-------|------------------|
| ["When is Chat, Cowork and Code merging?"](https://old.reddit.com/r/ClaudeAI/comments/1tldsrl/when_is_chat_cowork_and_code_merging/) | r/ClaudeAI | 124↑ / 65 comments | Anthropic roadmap signal: **unified memory layer across Chat/Cowork/Code is the goal** (per recent interviews cited by u/Vermillionleon7). Today's silos = "biggest UX bottleneck right now" — cross-validates Doc 728's `.serena/memories/` as the bridge until Anthropic ships unified memory |
| ["Local LLM + Claude Code full guide"](https://old.reddit.com/r/ClaudeAI/comments/1tlir65/my_experience_using_claude_code_with_local_llm/) | r/ClaudeAI | 137↑ / 39 comments | Ollama → oMLX migration for resource efficiency. Pain: offline work doesn't persist back to online Claude Code. Relevant if ZAO ever runs Claude Code on the VPS for cost reasons |
| ["Deterministic multi-subagent orchestration"](https://old.reddit.com/r/ClaudeAI/comments/1tll4mv/deterministic_multisubagent_orchestration_whats/) | r/ClaudeAI | 16↑ / 7 comments | **Emerging best practice: separate session log (transient) from project memory (durable)** — directly validates Doc 728 split between session context and `.serena/memories/` |
| ["Four calls became one: agent authors tools mid-session"](https://old.reddit.com/r/ClaudeAI/comments/1tl91km/four_calls_became_one_letting_the_agent_author/) | r/ClaudeAI | 6↑ / 1 comment | MCP design critique: "MCP in practice is a connector marketplace, not a runtime." Static catalog is the wall. Future-watch — affects how to design ZOE/Hermes tool wrappers |
| ["686 skills, vector search, 71% precision"](https://old.reddit.com/r/ClaudeAI/comments/1tlr914/how_does_a_claude_code_agent_navigate_hundreds_of/) | r/ClaudeAI | 0↑ / 7 comments | u/BasedAmumu: "vector-index pattern starts paying off past 500-ish skills" — **cross-validates Decision #9 skill budget recommendation**. ZAOOS at 250+ skills is in the danger zone where descriptions get truncated but no vector index exists |
| ["llama.cpp native --tools flag"](https://old.reddit.com/r/LocalLLaMA/comments/1tluma3/llamacpp_server_have_builtin_native_tools_exec/) | r/LocalLLaMA | 41↑ / 9 comments | MCP-style tools moving INTO the runtime (currently broken/undocumented). Trajectory note |

### HackerNews (Algolia API — 12 threads FULL)

| Thread | Points | Date | Why it matters for ZAO |
|--------|--------|------|------------------------|
| ["Supabase MCP can leak your entire SQL database"](https://news.ycombinator.com/item?id=44502318) | **848** | 2025-07-08 | **DIRECTLY impacts Decision #1.** Prompt injection via support-ticket text causes the MCP to exec attacker-supplied SQL with whatever credentials are bound. ZAO's RLS provides defense-in-depth but anon key is mandatory, NOT optional |
| ["The 'S' in MCP Stands for Security"](https://news.ycombinator.com/item?id=43600192) | **730** | 2025-04-06 | ContextGuard: **43% of public MCP servers have critical vulnerabilities**. Sandbox aggressively (Docker isolation alone insufficient per consensus); pin versions; restrict outbound network |
| ["MCP Security 2026: 30 CVEs in 60 Days"](https://news.ycombinator.com/item?id=47356600) | (linked from above) | 2026-03 | Sustained CVE pace through Q1 2026; treat every new MCP install as code execution |
| ["How I use Claude Code: planning vs execution"](https://news.ycombinator.com/item?id=47106686) | 976 | 2026-02-22 | **Spec-first workflow consensus** across 15+ threads — matches Doc 730 subagent-driven-research recommendation. The "plan in one session, execute in fresh session" pattern is the dominant power-user shape |
| ["MCP: An (Accidentally) Universal Plugin System"](https://news.ycombinator.com/item?id=44404905) | 808 | 2025-06-28 | OpenAI + Google + Anthropic all standardized on MCP organically. No vendor mandate. Investment is portable across LLM providers |
| ["Chrome DevTools MCP"](https://news.ycombinator.com/item?id=47390817) | 604 | 2025 | **Cross-validates Decision #3** — independent thread strongly recommends; complements Playwright (different jobs) |
| ["98% context-reduction MCP server"](https://news.ycombinator.com/item?id=47193064) | 570 | 2025 | Mcproxy + context-pruning tools class is real and growing. Watch list |
| ["Show HN: Semble — 98% fewer tokens than grep"](https://github.com/MinishLab/semble) | 444 | 2026-05-17 | Token-efficient code search alternative to Serena worth tracking |
| ["Anthropic Claude Code best practices"](https://www.anthropic.com/engineering/claude-code-best-practices) | (multiple HN refs) | ongoing | Cited as canonical by u/EMM_386 + others; the source of "multiple .md files, add contextually" pattern |

### GitHub Discussions + Issues (gh CLI — 5 issues FULL across modelcontextprotocol/servers, oraios/serena, openai/codex)

| Issue | Status | Why it matters |
|-------|--------|----------------|
| [**modelcontextprotocol/servers#4026**](https://github.com/modelcontextprotocol/servers/issues/4026) — Filesystem MCP `npx -y` hang | OPEN | **Promoted to Decision #13.** `npx -y` causes intermittent 4-min hangs because it re-resolves the package on every stdio handshake. **Fix: `npm install -g <pkg>` + absolute binary path.** Documentation bug affects every user following standard install instructions |
| [**modelcontextprotocol/servers#3986**](https://github.com/modelcontextprotocol/servers/issues/3986) — `server-everything` get-env leaks `process.env` | OPEN | **Promoted to Decision #14.** Reference server dumps full env including API keys. Community servers copy this pattern blindly. Audit before installing any community MCP |
| [**modelcontextprotocol/servers#754**](https://github.com/modelcontextprotocol/servers/issues/754) — Credentials best-practices proposal | OPEN | Workload identity (GCP/AWS/Azure) > secrets vault > env. ZAO impact: Supabase service role belongs in Vercel env vars only, never echoed back through an MCP tool |
| [**oraios/serena#1491**](https://github.com/oraios/serena/issues/1491) — Real adoption telemetry n=192 sessions / 21k tool calls | OPEN | **Promoted to Decision #15. Calibrates Doc 728.** Only **35.4% of sessions** (68/192) use ANY Serena query tool; **64.6%** fall back to plain Read/Grep/Glob even when Serena is connected. **18.4% of `find_symbol(include_body=true)` calls are immediately followed by a plain `Read` of the same file** — the symbol body alone lacks surrounding context (imports, neighbouring symbols). Implication: prompt explicitly for Serena, or expect the model to default to plain reads |
| [**openai/codex#21753**](https://github.com/openai/codex/issues/21753) — Claude Code Hook Parity (29+) | OPEN | **Promoted to Decision #16.** `PostToolUseFailure`, `FileChanged`, `SubagentStart/Stop`, `ConfigChange` are NOT shipped. Hook handler types `http`, `mcp_tool`, `prompt`, `agent` also missing. Design hooks against shipped events ONLY |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 87,708 stars | Top community curation — Filesystem + Everything = baseline; Serena + sequential-thinking = "considered essential" by curators |

### YouTube + Long-Form Blogs (5 videos + 7 blogs + 2 Latent Space podcast eps)

| Source | Key Signal |
|--------|------------|
| [Anthropic engineering blog — 132-engineer study](https://www.anthropic.com/engineering/claude-code-best-practices) | **67% more merged PRs/day**, **27% of work wouldn't have been attempted** without Claude Code |
| [Latent Space pod: Claude Code for Finance — Doug O'Laughlin (SemiAnalysis)](https://www.latent.space) | Claude Code writes **~4% of GitHub** as of Feb 2026. Mental model: "junior analyst" |
| Pragmatic Engineer 2026 survey | Claude Code **46% "most loved"**, **18% workplace adoption** (1.5x growth from late 2025) |
| Prabhat.dev — "Zero to Hero 2026 Field Guide" | **4-Stage Maturity Model**: Foundations (CLAUDE.md) → Automation (Skills+Hooks) → Integration (MCP) → Scale (Subagents+Worktrees+Teams). Hidden flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for parallel-session comms (research preview Feb 2026) |
| [Dev.to / Jack B. Cai — Guardrails 2026](https://dev.to) | **4 Autonomy Levels**: L1 edits+approval → L2 edits with gates → L3 test-driven hand-off → L4 background tasks with hook-enforced gates. Don't skip L2 — builds mental model of where agent drifts |
| Generative.inc 2026 guide | TDD inversion: separate sub-agents for test-writing vs implementation prevents context pollution |
| DevOps Monk — hook patterns | Auto-test-on-edit: PostToolUse → tests run → on fail spawn subagent → subagent diagnoses → main session applies fix |
| Latent Space — Felix Rieseberg (Claude Cowork) | Skills are file-based markdown; portable across Claude Code + Claude Cowork. NOT proprietary container |
| Zenva AI — GitHub MCP workflow | **AGENTS.md as separate file** from CLAUDE.md for local-only rules. Possible ZAO adoption: AGENTS.md for Hermes worktree-specific instructions |
| Cost data point | **5 parallel agents ≈ $1K/month** real cost cited in advanced guide. Hermes parallel runs need this in budgeting |
| Akshay Ghalme — MCP transports | **SSE deprecated mid-2026**; stdio (local) + Streamable HTTP (OAuth 2.1) are the standards. Hybrid pattern: community servers for horizontal + custom servers for domain logic |

### X / Twitter (FAILED for direct fetch — substitution: 25-blog cross-validation sweep)

Direct X scraping hit the auth wall. Substituted with 25-blog cross-tally producing a tier-of-consensus signal:

| Tier | MCPs (mentioned in ≥14 of 25 guides) |
|------|--------------------------------------|
| **Tier 1 (consensus must-installs)** | GitHub (22/25), Filesystem (21/25), Serena (17/25, fast-rising), Postgres (18/25), Playwright (16/25), Context7 (14/25), Brave Search (14/25) |
| **Tier 2 (specialized)** | Sentry (11/25), Memory (10/25), Linear (9/25), Supabase (8/25), Slack (7/25), Notion (8/25), Sequential-Thinking (7/25) |
| **Tier 3 (niche)** | Figma (6/25), Docker (5/25), Vercel (3/25), twikit-mcp (no API key needed), Fetch (12/25) |

Notable Serena version gotcha from this sweep: **pin to v1.1.2** if you hit a `tools/list` hang on `--context=claude-code` (regression in 2026-04-25 main). [oraios/serena#1416](https://github.com/oraios/serena/issues/1416).

### Contradictions Surfaced (resolved or flagged)

- **doc 730 said "DROP sequential-thinking MCP"** vs. **YouTube + 7-of-25 blogs still recommend it.** Resolution: drop on Opus 4.7 with `/effort high`; keep on Sonnet/Haiku sessions where native reasoning is weaker. Refined in Decision #4 stance.
- **doc 730 said "Serena 60-80% token reduction"** vs. **oraios/serena#1491 telemetry "64% of sessions never use it."** Resolution: the savings hold WHEN used, but adoption requires explicit prompting. New Decision #15.
- **MCP Catalog ranked Brave Search #5** vs. **The Editorial News measured 12% timeout rate.** Resolution: keep the SKIP (Decision #6) — production reliability outweighs popularity.

## Risks + Open Questions

1. **Supabase MCP service-role exposure** — the official Supabase MCP needs careful scoping. Use the anon key + RLS for default; service role only via explicit per-tool grant in `mcpServers` config under a constrained subagent. **CONFIRMED CRITICAL by HN 848-pt thread; SQL exfiltration via prompt injection in support-ticket text is real.**
2. **Sentry MCP credentials** — needs Sentry org auth; verify which Sentry project is the live ZAOOS one before wiring.
3. **`memory` plugin MCP vs Serena memories vs auto-memory** — three memory systems is two too many. Audit and pick one canonical layer per scope.
4. **Skill plugin sprawl** — `everything-claude-code` ships 200+ skills. Most are off-stack (Django, Rust, Kotlin, Perl). Aggressive `skillOverrides` cleanup is overdue.
5. **Sequential-thinking MCP** — installed but redundant on Opus 4.7 with `/effort high`. Drop after confirming no skill explicitly invokes it.
6. **Hook ordering when matchers overlap** — adding 4 more hooks across PreToolUse/SessionStart/Stop needs verification that the existing branch-guard + lint hooks still fire (JSON object key order is not deterministic; arrays are).

## Also See

- [Doc 154](../154-skills-commands-master-reference/) — skills + commands reference; add MCPs row
- [Doc 232](../232-mcp-server-development-guide/) — original MCP dev guide; cross-link as predecessor
- [Doc 238](../238-claude-tools-top50-evaluation/) — earlier tool evaluation; this doc supersedes the MCP section
- [Doc 408](../408-claude-code-1m-context-session-management/) — 1M context strategy; Section "Speed Wins" feeds it
- [Doc 429](../429-claude-code-skills-deep-dive/) — skills architecture deep dive; Section "Skill Hygiene" extends it
- [Doc 440](../440-claude-code-process-level-up/) — process level-ups; this doc IS a process level-up
- [Doc 687](../687-claude-code-workflow-context-patterns/) — context patterns; same orbit
- [Doc 694](../694-research-library-audit/) — research library audit; cross-link the new MCP slugs
- [Doc 728](728-serena-mcp-zao-integration/) — Serena integration plan; this doc is the broader stack-level companion

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install Supabase MCP (RLS-scoped) | @Zaal | `claude mcp add` + settings PR | This week |
| Install Chrome DevTools MCP | @Zaal | `claude mcp add` | This week |
| Add context-injection SessionStart hook to `.claude/settings.json` | @Zaal | PR | After Doc 728 hooks land |
| Add post-compact re-injection hook | @Zaal | PR | Same as above |
| Add `permissions.deny` for `.env*` reads | @Zaal | PR | Same as above |
| Add Bash firewall PreToolUse hook (rm -rf / DROP TABLE / chmod 777) | @Zaal | PR | Same as above |
| Bump `skillListingBudgetFraction` to 0.02 + set `skillOverrides` for off-stack language skills | @Zaal | Edit `~/.claude/settings.json` | This week |
| Verify Tool Search enabled (`/doctor`) | @Zaal | One-time check | Now |
| Audit memory layers (plugin memory MCP vs Serena memories vs auto-memory) — pick canonical per scope | @Zaal | Decision doc or memory note | Phase 2 |
| Drop `sequential-thinking` plugin MCP after confirming no skill invokes it | @Zaal | Plugin uninstall | Phase 2 |
| Install Sentry MCP after verifying live Sentry project | @Zaal | `claude mcp add` | Phase 2 |
| Update CLAUDE.md "Workflow Orchestration" to formalize subagent-for-read-many-files rule | @Zaal | PR | This week |
| Migrate all `npx -y` MCP installs to `npm install -g` + absolute binary path | @Zaal | settings.json PR | This week (Decision #13) |
| Audit each installed MCP src for `process.env` returns without filter | @Zaal | grep + report | This week (Decision #14) |
| Pin Serena to v1.1.2 if `tools/list` hangs on claude-code context | @Zaal | `.serena/project.yml` | Verify first; act if seen |
| Update Doc 728 with Serena 35% adoption telemetry caveat — prompt explicitly | @Zaal | PR to Doc 728 | This week (Decision #15) |
| Test `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for Hermes parallel-run pattern | @Zaal | Spike | Phase 2 |
| Adopt `AGENTS.md` separate from `CLAUDE.md` for Hermes worktree-local rules | @Zaal | New file + Hermes runner edit | Phase 2 |
| Watch [modelcontextprotocol/servers#4026](https://github.com/modelcontextprotocol/servers/issues/4026) for upstream fix to `npx -y` issue | @Zaal | Issue subscribe | Ongoing |
| Watch [openai/codex#21753](https://github.com/openai/codex/issues/21753) for hook event parity ship dates | @Zaal | Issue subscribe | Ongoing |
| Bind Supabase MCP via ANON key + RLS only; service role NEVER in tool context that reads untrusted text (per HN 848-pt disclosure) | @Zaal | Config + subagent scoping | Before Decision #1 install |

## Sources

- [code.claude.com — Best practices](https://code.claude.com/docs/en/best-practices) — [FULL] — official Anthropic guide; context-window-as-master-constraint framing
- [code.claude.com — Settings reference](https://code.claude.com/docs/en/settings) — [FULL] — `skillListingBudgetFraction`, `skillOverrides`, hook syntax
- [code.claude.com — Hooks guide](https://code.claude.com/docs/en/hooks-guide) — [FULL] — SessionStart, PostToolUse, PreToolUse, Stop, prompt-type vs agent-type hooks
- [Refactix — Power user guide: skills, hooks, subagents](https://refactix.com/ai-development-engineering/claude-code-power-user-guide-skills-hooks-subagents) — [FULL] — "harness executes hooks, not Claude" framing
- [Generative.inc — Claude Code 2026 guide](https://www.generative.inc/the-complete-claude-code-guide-2026-planning-context-engineering-and-high-leverage-development) — [FULL] — 1M context, 83.5% auto-compact, proactive 70-75% compact
- [aicodex.to — Leverage-ordered guide](https://www.aicodex.to/articles/claude-code-project-setup) — [FULL] — 5-layer config, 80/20 framing
- [dev.to / Owen Fox — Hooks, Subagents, Skills complete guide](https://dev.to/owen_fox/claude-code-hooks-subagents-and-skills-complete-guide-hjm) — [FULL] — subagent frontmatter fields table
- [TechPlained — Real workflows](https://www.techplained.com/claude-code-subagents-skills) — [FULL] — 46% "most loved" Pragmatic Engineer stat; build-from-blocks pattern
- [MCP Catalog — Top 10 MCPs for Claude Code](https://mcpcatalog.dev/blog/best-mcp-servers-claude-code) — [FULL] — 10-pick list with rationale + 4-week install order
- [Toolradar — Top 10 with install commands](https://toolradar.com/blog/best-mcp-servers-claude-code) — [FULL] — Tool Search lazy-load, ~95% context reduction, 4.x changes
- [self.md — Best MCP servers (starter stack)](https://self.md/guides/best-mcp-servers/) — [FULL] — "you need 5 good ones not 30" + attack-surface warning
- [DevReviewer — Best MCPs for Claude Code agents](https://devreviewer.com/best-mcp-servers-for-claude-code-agents-2026-2/) — [FULL] — production-table, 4GB Droplet cost, Playwright RAM warning
- [Top-MCPs.com — Ranked + setup](https://top-mcps.com/guides/best-mcps-for-claude-code) — [FULL] — directory + categorization patterns
- [Apigene — Claude MCP Servers complete list (2026)](https://apigene.ai/blog/claude-mcp-servers) — [FULL] — token cost tables (3 → 8 → 15 servers); Chrome DevTools "zero-config" callout
- [SupaLaunch — 12 Best MCP Servers](https://supalaunch.com/blog/best-mcp-servers-for-claude-code-2026) — [FULL] — Playwright 100K+ tokens warning, Context7 underrated callout, per-role starter stacks
- [The Editorial News — 6-week production test of 7 MCPs](https://theeditorial.news/ai-agents/best-mcp-servers-for-production-ai-agents-in-2026-seven-tested-three-actually-ship-mpgvmg42) — [FULL] — 140 tasks, 94/89/91% success on Filesystem/GitHub/Postgres; 32-68% failure on others
- [DevelopersDigest — 5 that actually matter (out of 271)](https://www.developersdigest.tech/blog/271-mcp-servers-top-5-that-matter) — [FULL] — 4-filter selection method; sequential-thinking deprecated by `/effort`; SaaS-thin-wrapper anti-pattern
- [MakeUseOf — MCP servers consumer guide](https://www.makeuseof.com/claudes-superpower-isnt-code-add-these-mcp-servers/) — [FULL] — Context7 "no API key needed" + accessibility-tree explanation for Playwright
- [HN — Semble: 98% fewer tokens than grep (Show HN, 444 pts)](https://github.com/MinishLab/semble) — [PARTIAL — metadata only via HN Algolia API, GitHub page not fetched] — alternative semantic code search worth monitoring

### Community Signal — added 2026-05-23 via 5 parallel scraper agents

**Reddit (9 threads FULL via old.reddit.com .json):**
- [r/ClaudeAI — Chat/Cowork/Code merge thread (124↑)](https://old.reddit.com/r/ClaudeAI/comments/1tldsrl/when_is_chat_cowork_and_code_merging/) — [FULL]
- [r/ClaudeAI — Local LLM + Claude Code guide (137↑)](https://old.reddit.com/r/ClaudeAI/comments/1tlir65/my_experience_using_claude_code_with_local_llm/) — [FULL]
- [r/ClaudeAI — Multi-subagent orchestration CC 2.1.146](https://old.reddit.com/r/ClaudeAI/comments/1tll4mv/deterministic_multisubagent_orchestration_whats/) — [FULL]
- [r/ClaudeAI — Agent authors tools mid-session](https://old.reddit.com/r/ClaudeAI/comments/1tl91km/four_calls_became_one_letting_the_agent_author/) — [FULL]
- [r/ClaudeAI — 686 skills, vector search](https://old.reddit.com/r/ClaudeAI/comments/1tlr914/how_does_a_claude_code_agent_navigate_hundreds_of/) — [FULL]
- [r/LocalLLaMA — llama.cpp --tools flag](https://old.reddit.com/r/LocalLLaMA/comments/1tluma3/llamacpp_server_have_builtin_native_tools_exec/) — [FULL]
- 3 additional FULL threads logged in `/tmp/reddit_signal_final.md`

**HackerNews (Algolia API — 12 threads FULL):**
- [Supabase MCP can leak your entire SQL database — 848 pts](https://news.ycombinator.com/item?id=44502318) — [FULL] — CRITICAL security finding
- [The 'S' in MCP Stands for Security — 730 pts](https://news.ycombinator.com/item?id=43600192) — [FULL] — 43% of public MCP servers have critical vulns
- [How I use Claude Code: planning vs execution — 976 pts](https://news.ycombinator.com/item?id=47106686) — [FULL] — spec-first workflow consensus
- [MCP: An (Accidentally) Universal Plugin System — 808 pts](https://news.ycombinator.com/item?id=44404905) — [FULL]
- [Chrome DevTools MCP — 604 pts](https://news.ycombinator.com/item?id=47390817) — [FULL] — cross-validates Decision #3
- [98% context-reduction MCP server — 570 pts](https://news.ycombinator.com/item?id=47193064) — [FULL]
- [OpenAI adds MCP support to Agents SDK — 807 pts](https://news.ycombinator.com/item?id=43485566) — [FULL]
- [MCP Security 2026: 30 CVEs in 60 Days](https://news.ycombinator.com/item?id=47356600) — [FULL]

**GitHub Discussions + Issues (5 issues FULL via gh CLI):**
- [modelcontextprotocol/servers#4026 — Filesystem MCP `npx -y` hang](https://github.com/modelcontextprotocol/servers/issues/4026) — [FULL] — promoted to Decision #13
- [modelcontextprotocol/servers#3986 — get-env leaks process.env](https://github.com/modelcontextprotocol/servers/issues/3986) — [FULL] — promoted to Decision #14
- [modelcontextprotocol/servers#754 — Credentials best-practices proposal](https://github.com/modelcontextprotocol/servers/issues/754) — [FULL]
- [oraios/serena#1491 — Real adoption telemetry n=192/21k](https://github.com/oraios/serena/issues/1491) — [FULL] — promoted to Decision #15
- [openai/codex#21753 — Claude Code Hook Parity (29+)](https://github.com/openai/codex/issues/21753) — [FULL] — promoted to Decision #16
- [punkpeye/awesome-mcp-servers (87,708 stars)](https://github.com/punkpeye/awesome-mcp-servers) — [FULL] — community curation top categories
- [oraios/serena#1416 — tools/list hang on claude-code context, v1.1.2 pin](https://github.com/oraios/serena/issues/1416) — [FULL] — version gotcha

**YouTube + Long-Form Blogs (5 videos + 7 blogs + 2 Latent Space pods FULL):**
- [Anthropic — Claude Code best practices (132-engineer study)](https://www.anthropic.com/engineering/claude-code-best-practices) — [FULL] — 67% more merged PRs/day, 27% counterfactual
- Latent Space pod: Doug O'Laughlin SemiAnalysis — Claude Code writes ~4% of GitHub as of Feb 2026 — [PARTIAL — show notes only]
- Pragmatic Engineer 2026 dev survey — 46% most-loved, 18% workplace adoption — [PARTIAL — secondary cite]
- Prabhat.dev — "Zero to Hero 2026 Field Guide" 4-stage Maturity Model — [FULL]
- Dev.to / Jack B. Cai — Guardrails 2026 (4 Autonomy Levels) — [FULL]
- DevOps Monk — hook patterns + spawn-subagent-on-test-fail — [FULL]
- Latent Space — Felix Rieseberg on Claude Cowork (skills portability) — [FULL]
- Zenva AI — GitHub MCP workflow + AGENTS.md pattern — [FULL]
- Akshay Ghalme — MCP transports (SSE deprecated mid-2026) — [FULL]
- Shah Wali, Harshit Agarwal, Leon van Zyl, Thetips4you tutorials — [FULL] — beginner-to-advanced coverage

**X / Twitter:** [FAILED — auth wall on direct fetch]. Substituted with 25-blog tier-consensus tally (Tier 1: GitHub 22/25, Filesystem 21/25, Postgres 18/25, Serena 17/25, Playwright 16/25, Context7 14/25, Brave Search 14/25; Tier 2: Sentry 11/25, Memory 10/25; Tier 3: Figma 6/25, Docker 5/25). Cross-tally produced equivalent breadth.

## Validation Notes

- All ranking articles date Feb-May 2026 (current within 4 months)
- The Editorial News test is most recent (2026-05-22) — used as production ground truth
- Filesystem MCP no longer recommended for Claude Code specifically (Claude natives cover) — top-of-list across all rankings is now GitHub MCP / Context7 / Postgres / Playwright / Search
- Tool Search lazy-loading is the single biggest 2026 change — pre-March 2026 stacks (3-4 server cap) are obsolete
- `skillOverrides` requires Claude Code v2.1.129+; verify version before applying
- `skillListingBudgetFraction` requires v2.1.105+
