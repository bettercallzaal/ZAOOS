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
| 1 | **INSTALL Supabase MCP** | ZAOOS lives on Supabase (RLS, agents tables, sessions). Today every schema check requires a Read+grep tour; Supabase MCP gives Claude direct query + introspection | `claude mcp add supabase --transport http --url <official>` then bind service role server-side ONLY |
| 2 | **INSTALL Sentry MCP** (when Sentry wiring restored) | The Vercel deploy already pings Sentry per `.claude/settings.json` postinstall. Pulling live errors into the session collapses 10-min debugging to 90 sec ([mcpcatalog](https://mcpcatalog.dev/blog/best-mcp-servers-claude-code)) | Phase 2; verify Sentry project active first |
| 3 | **INSTALL Chrome DevTools MCP** alongside existing Playwright MCP | Playwright MCP for scripted flows; Chrome DevTools MCP for debugging the tab you already have open ([developersdigest](https://www.developersdigest.tech/blog/271-mcp-servers-top-5-that-matter)) — different jobs, both lightweight | `claude mcp add chrome-devtools -- npx -y @modelcontextprotocol/server-chrome-devtools` |
| 4 | **KEEP current stack** (context7, gitnexus, playwright, serena, exa, github plugin, memory plugin, sequential-thinking, grep.app, gmail, gcal, gdrive) | All earn their token cost. Tool Search lazy-loads schemas so 12+ MCPs ≠ context bloat in Claude Code 4.x ([toolradar](https://toolradar.com/blog/best-mcp-servers-claude-code)) | No action |
| 5 | **SKIP Firecrawl MCP** | Already use exa web_fetch as the JS-rendered fetcher; Firecrawl needs API key + would duplicate. `/zao-research` skill v2.3 explicitly says "firecrawl NOT installed" | No action |
| 6 | **SKIP Brave Search MCP** | exa + WebSearch + WebFetch + grep.app cover search; Brave Search MCP failed silently in production ([theeditorial.news 6-week test](https://theeditorial.news/ai-agents/best-mcp-servers-for-production-ai-agents-in-2026-seven-tested-three-actually-ship-mpgvmg42), 12% timeout rate) | No action |
| 7 | **SKIP Linear / Jira MCPs** | ZAO does not use them — work tracks in cowork-zaodevz actions.json + GitHub Issues + Telegram. Save tool-description budget | No action |
| 8 | **ADD 4 high-leverage hooks** to `.claude/settings.json` (context injection, deny-credentials, post-edit format, post-compact reinject) | Highest-ROI level-up after the basic lint/typecheck/branch-guard already shipped | See "Hook Build-Out" section |
| 9 | **AUDIT skill listing budget** — 100+ skills loaded; raise `skillListingBudgetFraction` to 0.02 or set `skillOverrides` to hide rarely-used plugin skills | Default 0.01 (1% of context) truncates skill descriptions; you have 250+ skills from `everything-claude-code` + plugins | Edit `~/.claude/settings.json` |
| 10 | **ADOPT subagent-driven research as default for any task touching >5 files** | Subagents run in their own context window and return summaries — keeps main session clean. Already happens via Explore/Plan; codify in CLAUDE.md | Add line to Workflow Orchestration in CLAUDE.md |
| 11 | **COMPACT proactively at 70-75% context** (not the auto-trigger at 83.5%) | Community consensus from 2026-03 Generative.inc guide — earlier compaction preserves higher-quality summaries | Behaviour change; track via `/context` |
| 12 | **VERIFY Tool Search is on** (`ENABLE_TOOL_SEARCH=auto:5`) | Cuts MCP context consumption ~47%. Default in Claude Code 4.x but worth confirming via `/doctor` | One-time check |

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

## Risks + Open Questions

1. **Supabase MCP service-role exposure** — the official Supabase MCP needs careful scoping. Use the anon key + RLS for default; service role only via explicit per-tool grant in `mcpServers` config under a constrained subagent.
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
- Reddit r/ClaudeAI search "best mcp servers" — [FAILED — `zao-fetch-reddit.sh` returned empty Listing twice this session] — escalation: tried JSON search endpoint with sort=top&t=month, still empty. Independent blogs (12 above) supply equivalent community signal.

## Validation Notes

- All ranking articles date Feb-May 2026 (current within 4 months)
- The Editorial News test is most recent (2026-05-22) — used as production ground truth
- Filesystem MCP no longer recommended for Claude Code specifically (Claude natives cover) — top-of-list across all rankings is now GitHub MCP / Context7 / Postgres / Playwright / Search
- Tool Search lazy-loading is the single biggest 2026 change — pre-March 2026 stacks (3-4 server cap) are obsolete
- `skillOverrides` requires Claude Code v2.1.129+; verify version before applying
- `skillListingBudgetFraction` requires v2.1.105+
