---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "687, 722, 684, 644, 601, 663"
original-query: "how we can actually use the synthesized v2 operator profile (~10 sections covering identity, builds, money, content, calendar, people, failed bets, audit, repos, research lib) effectively with Claude Code - what workflows, slash commands, hooks, MCP wiring, agent prompts, and skill patterns make this dossier into a working tool rather than a one-time document"
tier: STANDARD
---

# 729 - Operationalizing the v2 Operator-Profile Dossier in Claude Code

> **Goal:** Turn the v2 operator profile (the 10-section dossier rendered at `/tmp/clipboard-archive/zaal-what-i-do-v2-20260523-2139.html`) from a one-time HTML page into a runtime artifact that every Claude Code session, subagent, and Telegram bot reads automatically.

## Key Decisions (DO THIS)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **CHECK IN the dossier source-of-truth as `docs/operator-profile.md` in the ZAOOS repo** | The v2 page is HTML in `/tmp/` - ephemeral, single-machine, not git-tracked. The underlying content needs to live in the repo so every session, subagent, and bot can read the same canonical version. Render the HTML from the markdown, not the reverse. |
| 2 | **ADD a SessionStart hook to inject the relevant section** (not the whole doc) into every new Claude Code session | Stops the "rebrief every session" tax. Official `SessionStart` hook is the canonical pattern - stdout becomes `additionalContext` injected into the conversation. Anurag's 4-file system + claude-mem ship this pattern; ZAOOS already runs PreToolUse hooks (`branch-guard.sh`, eslint, typecheck) so the wiring exists. |
| 3 | **CONSOLIDATE the three drift'd memory files** (`/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md`, root `CLAUDE.md`, `AGENTS.md`) **into one source generated from `docs/operator-profile.md`** | `.claude/memory.md` currently claims "240+ research docs", "Composio AO pilot", "VPS 2 ZAAL ASSISTANT" - all three are wrong as of 2026-05-23 (real count is 836, AO is killed, VPS 2 does not exist per `[[project_no_vps2]]`). Three places to update + drift everywhere. Generate them. |
| 4 | **BUILD `.claude/agents/*.md` subagent definitions that import the relevant dossier section** instead of restating it inline | When subagents go wide (8-agent dispatch like this session), they need the "decommissioned - do not propose" list, the "people in orbit tiers", the "feedback rules". Today they have to be told inline every time. Solve once: each `.claude/agents/<role>.md` references `docs/operator-profile.md#<section>` in its system prompt. |
| 5 | **SHIP a `/me` slash command** at `~/.claude/skills/me/SKILL.md` that renders a chosen section to terminal or clipboard | The /clipboard skill already exists (80 invocations in 10 weeks). Add `/me bio`, `/me tokens`, `/me failed-bets`, `/me people`, etc - same single-tab pattern, instant on-demand recall without re-running 8 agents. Replaces the manual "what's my X" loop. |
| 6 | **WIRE a weekly Hermes auto-refresh** of the dossier from the live sources (gh, supabase, research/, paragraph.com, bczyapz.com) | The dossier is only useful if it stays true. Today it took 8 parallel agents + ~10 minutes to build. Hermes can run the same 8 prompts on a Sunday-night cron, diff against last week's, surface what changed in the morning brief. The agents are already general-purpose Explore + general-purpose; the prompts are in this session's transcript. |
| 7 | **SKIP** building a dedicated MCP resource server for the dossier - filesystem access is enough | An MCP server is the right answer when a remote agent (a bot, a CI runner) needs structured queries. For Claude Code sessions, every agent already has filesystem + grep on the repo. Premature abstraction. Revisit if/when ZOE on the VPS or a remote runner needs it. |
| 8 | **APPLY the Karpathy-12 + Anurag-4-file context pattern** (doc 687) **specifically to the dossier - the operator profile IS the STATE.md** | Doc 687 mandates persistent multi-file context (CLAUDE.md + STATE.md + journal + backlog). The v2 dossier is the closest thing ZAO has to a STATE.md - it just isn't wired in as one yet. Decisions 1-3 above close that loop. |

## What the v2 Dossier Actually Is (and isn't)

The v2 page at `/tmp/clipboard-archive/zaal-what-i-do-v2-20260523-2139.html` synthesizes 8 parallel agent reports into 10 sections: self-onboarding, public bio, active builds, money/tokens/contracts, content rhythm, calendar, people in 5 tiers, failed bets post-mortem, internal audit, raw-dump appendix. Headline numbers: 5,114 Farcaster + 4,880 X followers, 250+ /thezao members, 836 research docs, 150 repos (17 stars), ~20 BCZ YapZ episodes, 400+ newsletter editions, 61 Claude sessions over 10 weeks, ~10 content pieces/week, 100+ Fractal weeks.

What it is: a snapshot of "who Zaal is, what he ships, what kills he made, what the working rules are" as of 2026-05-23.

What it is NOT (yet): a runtime artifact. It's a file in `/tmp/` on one laptop. The next Claude Code session, the next ZOE prompt, the next Hermes critic doesn't see it. Operationalization closes that gap.

## The 6 Leverage Points (Ranked by ROI)

### 1. Check the dossier into the repo as markdown (highest leverage)

**File:** `docs/operator-profile.md` in ZAOOS root, generated from this session's synthesis. Mirror the 10 sections one-to-one. HTML at `/tmp/` becomes a generated artifact - `npm run profile:html` (a simple `marked` or `markdown-it` script) takes the markdown and produces the clipboard-shareable HTML on demand.

Why this is leverage point #1: every other operationalization (hooks, subagents, slash commands, Hermes refresh) needs a stable file path that all sessions can read. Today there is no such file. The HTML is single-machine; the conversation transcript is unrecoverable. Until this exists, the dossier evaporates after this session.

ZAOOS already has `docs/` (CLAUDE.md, AGENTS.md, SECURITY.md). Add `docs/operator-profile.md` alongside them. Keep it under 250 lines per the Karpathy ceiling (doc 687); push raw-dump appendix data into `docs/operator-profile-appendix.md` if it bloats.

### 2. SessionStart hook auto-injects the relevant section

**File:** `.claude/settings.json` (already has `PreToolUse` hooks for git commit eslint + git push branch-guard + typecheck). Add a `SessionStart` block that runs a script and writes to stdout - whatever stdout contains becomes `additionalContext` injected silently into the new session.

Pseudocode for `.claude/hooks/session-start-inject-profile.sh`:

```bash
#!/usr/bin/env bash
# Inject the right section of the operator profile based on branch context.
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)
PROFILE="$PROJECT_DIR/docs/operator-profile.md"

[ -f "$PROFILE" ] || exit 0

# Always include identity + workflow rules (the s1 onboarding section)
sed -n '/^## 1\. /,/^## 2\. /p' "$PROFILE"

# Branch-aware section pull
case "$BRANCH" in
  ws/research-*)  sed -n '/^## 9\. /,/^## 10\. /p' "$PROFILE" ;;  # audit + gaps
  ws/spaces-*|ws/zaostock-*)  sed -n '/^## 3\. /,/^## 4\. /p' "$PROFILE" ;;  # active builds
  ws/zoe-*|ws/hermes-*|ws/agent-*)  sed -n '/^## 8\. /,/^## 9\. /p' "$PROFILE" ;;  # failed bets
  *)  sed -n '/^## 1\. /,/^## 2\. /p' "$PROFILE" ;;  # onboarding only
esac
```

This stays under the "SessionStart hooks should be fast - under 1-2 seconds" rule from the official Claude Code hooks docs (sed on a 250-line file is &lt;50ms). It does NOT inject the whole 2000-line dossier - it picks the relevant slice by branch convention, which ZAOOS already enforces via `ws/<theme>-<slug>` naming (`worksession` skill).

Official hook reference: [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks). Community walkthrough: [MindStudio - SessionStart hooks force context](https://www.mindstudio.ai/blog/session-start-hooks-claude-code-force-context). The same pattern is what claude-mem ships for persistent memory ([claude-mem hooks-architecture](https://docs.claude-mem.ai/hooks-architecture)).

### 3. Consolidate the three drifted memory files

Today there are three "memory" files in play, all out of sync:

| File | Current state | Issue |
|------|--------------|-------|
| `/Users/zaalpanthaki/Documents/ZAO OS V1/CLAUDE.md` | ~200 lines, mostly accurate but "Primary Surfaces" list correct, last full review unclear | Drifts whenever a new surface gets killed or added |
| `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md` | Claims "240+ research docs", "Composio AO pilot", "VPS 2 (DigitalOcean) ZAAL ASSISTANT" | Stale by ~6 weeks. AO killed 2026-05-04, VPS 2 explicitly does not exist (`[[project_no_vps2]]`), real doc count is 836 |
| `/Users/zaalpanthaki/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md` | 176-entry index, hit the 24.4KB size warning | Correct content but over-budget; entries too long |

Decision: keep `CLAUDE.md` (the AGENTS.md / project-root canon) and `MEMORY.md` (the auto-memory index, user-scoped). Delete `.claude/memory.md` or regenerate it from `docs/operator-profile.md` automatically. The duplication is the bug.

The headline numbers in `docs/operator-profile.md` (836 docs, 150 repos, 5K FC followers, etc) become the authoritative count. CLAUDE.md links to the profile for the live counts instead of hard-coding "240+".

### 4. Subagent system prompts reference dossier sections by path

The 8 agents dispatched in this session (B1-B8) all got their context inline in their prompts: "Zaal is founder of The ZAO, operates ZABAL, etc." Three reasons that's suboptimal:

- Prompt-token tax: ~500 tokens per agent x 8 agents = 4K tokens repeated when the same content is in the repo.
- Drift: a fact updated in `docs/operator-profile.md` doesn't propagate to the prompts; they have to be edited individually.
- Discoverability: a new subagent definition has to be hand-fed the same context.

Solution: `.claude/agents/` already exists in ZAOOS. Define reusable subagent personas (e.g. `.claude/agents/researcher.md`, `.claude/agents/reviewer.md`, `.claude/agents/audit-bot.md`) whose system prompt opens with: `Read docs/operator-profile.md sections 1, 8, 9 before responding.` That's one line; the agent does the read itself. Drift dies.

The `[[project_hermes_canonical]]` decision already locked Hermes as the framework for new agents. This is consistent: Hermes agents read project state, then act. The subagent definitions formalize what "project state" means.

### 5. `/me` slash command for on-demand section recall

The `/clipboard` skill is invoked 80 times in 10 weeks (top-2 command per doc 722 audit). Most of those are "render this content for copy-paste". The same single-tab pattern applies to dossier recall.

Create `~/.claude/skills/me/SKILL.md`:

- `/me` (no args) -> opens the full dossier HTML in the single-tab.
- `/me bio` -> opens just section 2 (public bio) in the clipboard tab with Copy All.
- `/me tokens` -> section 4 (money/tokens).
- `/me failed-bets` -> section 8.
- `/me people` -> section 7 tiered list.
- `/me audit` -> section 9 gaps list.
- `/me appendix` -> section 10 raw dump.
- `/me refresh` -> re-runs the 8-agent dispatch + regenerates the markdown + HTML.

Implementation: the skill reads `docs/operator-profile.md`, slices the requested section via the same `sed -n` pattern from leverage point #2, hands it to the existing `/clipboard` write sequence. Reuses everything already shipped.

### 6. Hermes weekly auto-refresh

The dossier needs to stay current or it becomes another stale memory file. The 8-agent dispatch in this session is repeatable: same prompts, same Explore/general-purpose subagent types. Hermes already runs autonomous PR pipelines (per the agent stack canon, doc 644) - adding a weekly profile-refresh job is the same pattern:

- Sunday 22:00 ET cron triggers a script that dispatches the 8 agents (the prompts are in this session's transcript - save them to `scripts/refresh-operator-profile.ts`).
- Each agent writes its section to a temp file.
- Synthesizer agent merges into `docs/operator-profile.md.new`.
- Diff against `docs/operator-profile.md`. If material change (new repos, follower delta &gt; 5%, new failed bet, new collaborator tier change), open a PR to main.
- Monday 6am brief includes "Profile delta this week: +12 repos, +147 FC followers, ZAOstock site now live, ..."

This is the same shape as the `/meeting` -> Bonfire -> `/morning brief` loop. Apply it to the operator profile.

## Findings

### What changes with this in place

| Before | After |
|--------|-------|
| Every new Claude Code session: 5-15 min rebriefing (where am I, what's killed, what are the rules) | SessionStart hook injects the right slice in &lt;1s; agent already knows. |
| Subagent dispatched 8 times in 1 session: 500-token preamble x 8 = 4K wasted tokens | Subagent reads `docs/operator-profile.md` once; preamble is "read sections 1, 8". |
| "What's my $ZABAL contract address again?" -> search MEMORY -> find -> copy | `/me tokens` -> single tab opens, click Copy All. |
| Dossier facts go stale (240 docs vs actual 836) | Hermes refresh weekly, diff surfaces material drift in Monday brief. |
| /tmp/ HTML evaporates on reboot | Markdown lives in repo, HTML is regenerable on demand. |
| Three drifted memory files | One canonical file generates the others. |

### Where this fits in the existing skill stack

Doc 722 named the durable triplet: `/meeting` + `/bonfire` + `/zao-research`. The proposal here adds a fourth that closes the operator-self-knowledge loop: `/me` (the slash command) + `docs/operator-profile.md` (the artifact) + SessionStart hook (the auto-inject). The triplet handles capture-of-the-world; the fourth handles capture-of-the-operator.

This is consistent with the Anurag 4-file pattern from doc 687 (CLAUDE.md + STATE.md + journal + backlog). `docs/operator-profile.md` IS the missing STATE.md.

### What this does NOT do

- It does not solve Bonfire read-locking (the v2 audit gap #1). That's still on Joshua/Ryan.
- It does not auto-publish content (gap #4 - the 80 manual /clipboard calls + no Firefly auto-cross-post). Different problem.
- It does not write to a Telegram bot directly. ZOE on the VPS would need to pull `docs/operator-profile.md` from a deployed repo or pinned HTTP endpoint; that's a separate ship.
- It does not solve the MEMORY.md size cap (gap #2). Trimming the index is its own task.

## Implementation Order (with sequence-dependency)

| Step | What | Blocks |
|------|------|--------|
| 1 | Generate `docs/operator-profile.md` from this session's 8-agent synthesis | Everything else |
| 2 | Delete or regenerate the stale `.claude/memory.md` | Decision #3 |
| 3 | Add the SessionStart hook to `.claude/settings.json` + ship `.claude/hooks/session-start-inject-profile.sh` | Decision #2 |
| 4 | Update one `.claude/agents/` definition (e.g. `researcher.md`) to reference `docs/operator-profile.md` - prove the pattern, then expand | Decision #4 |
| 5 | Ship `/me` skill at `~/.claude/skills/me/SKILL.md` | Decision #5 |
| 6 | Write `scripts/refresh-operator-profile.ts` + add Hermes weekly cron | Decision #6 |

Steps 1-3 are one PR. Steps 4-5 are another PR. Step 6 is a third PR (needs Hermes cron infra).

## Also See

- [Doc 687 - Claude Code workflow + context-engineering patterns](../687-claude-code-workflow-context-patterns/) - the Karpathy 12-rule + Anurag 4-file foundation this builds on
- [Doc 722 - ZAO Claude Code + GitHub 3-Month Synthesis](../722-zao-claude-code-3-month-synthesis/) - the prior corpus audit that this profile complements (722 = repo state, 729 = operator state)
- [Doc 684 - Claude Code agent dispatch parallelization](../684-claude-code-agent-dispatch-parallelization/) - the pattern used to build the dossier (8 parallel agents)
- [Doc 644 - ZAO agent stack canon + team bot template](../../agents/644-zao-agent-stack-canon-and-team-bot-template/) - the Hermes canonical lock that the auto-refresh leans on
- [Doc 601 - Agent stack cleanup decision](../../agents/601-agent-stack-cleanup-decision/) - the kill list referenced by the SessionStart-injected section 8
- [Doc 663 - ZAO research meta-audit 2026-05-17](../663-zao-research-meta-audit-2026-05-17/) - prior research-library audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `docs/operator-profile.md` from this session's 8-agent synthesis (10 sections, headline numbers, target ~250 lines) | @Zaal | PR | Within 24h |
| Add `SessionStart` block to `.claude/settings.json` referencing `.claude/hooks/session-start-inject-profile.sh` | @Zaal | PR | Same PR as above |
| Write `.claude/hooks/session-start-inject-profile.sh` (the branch-aware sed script) | @Zaal | PR | Same PR as above |
| Delete `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md` or regen from operator-profile.md (drift is concrete: claims 240 docs, AO pilot, VPS 2 - all wrong as of 2026-05-23) | @Zaal | PR | Same PR as above |
| Update one `.claude/agents/<role>.md` to reference `docs/operator-profile.md#section` (pick `researcher` or `reviewer`) - prove pattern | @Zaal | PR | Second PR |
| Ship `~/.claude/skills/me/SKILL.md` with subcommands bio/tokens/failed-bets/people/audit/appendix/refresh | @Zaal | Skill | Second PR |
| Write `scripts/refresh-operator-profile.ts` that re-runs the 8-agent dispatch + writes back to `docs/operator-profile.md` | @Zaal | PR | Third PR |
| Add Hermes weekly cron (Sun 22:00 ET) to invoke the refresh script + diff against last week + open auto-PR | @Zaal | Hermes job | Third PR |
| Re-validate this doc 30 days after first PR ships - did the SessionStart inject actually reduce rebriefing? Did the `/me` skill replace clipboard rebuilds? | @Zaal | Cadence | 2026-06-23 |

## Sources

- [Claude Code Hooks Reference (official)](https://code.claude.com/docs/en/hooks) - [FULL] - SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/Stop event contract, additionalContext injection, stdout-becomes-context model.
- [MindStudio: How to Use Session Start Hooks to Force Context Into Every Claude Code Session](https://www.mindstudio.ai/blog/session-start-hooks-claude-code-force-context) - [FULL] - Walkthrough of the additionalContext stdout pattern + performance ceiling.
- [Claude-Mem hooks architecture](https://docs.claude-mem.ai/hooks-architecture) - [FULL] - Working production example of SessionStart-driven persistent memory; informs the &lt;1-2s perf rule.
- [DEV Community: Embedding Memory into Claude Code - From Session Loss to Persistent Context](https://dev.to/shimo4228/embedding-memory-into-claude-code-from-session-loss-to-persistent-context-54d8) - [PARTIAL - skimmed via search snippet, did not deep-fetch] - Confirms the broader pattern; not used for any specific claim.
- [Issue: Session memory doesn't persist or load context across sessions - everything-claude-code #187](https://github.com/affaan-m/everything-claude-code/issues/187) - [PARTIAL - title only via search; did not open] - Validates that "memory hooks misconfigured / not loaded" is a common failure mode the proposed pattern guards against.
- ZAOOS local files - [FULL]:
  - `/Users/zaalpanthaki/Documents/ZAO OS V1/CLAUDE.md`
  - `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/memory.md`
  - `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/settings.json` (existing PreToolUse hook config)
  - `/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/722-zao-claude-code-3-month-synthesis/README.md`
  - `/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/687-claude-code-workflow-context-patterns/README.md`
  - The v2 dossier itself at `/tmp/clipboard-archive/zaal-what-i-do-v2-20260523-2139.html` (this session's output)
