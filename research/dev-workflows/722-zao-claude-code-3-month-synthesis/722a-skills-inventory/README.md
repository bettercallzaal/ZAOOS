---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: Catalog every Claude Code skill installed in Zaal's environment as of 2026-05-23 - 47 user + 28 project skills - grouped by purpose, with status + origin doc per skill.
---

# 722a - Claude Code Skills Inventory (2026-05-23)

Master catalog of all Claude Code skills in Zaal's environment. 75 total: 47 user-level + 28 project-level. Grouped by purpose with status, triggers, and origin docs.

## Key Counts

- **Total skills:** 75 (47 user-level @ `~/.claude/skills/`, 28 project-level @ `ZAOOS/.claude/skills/`)
- **Skills with active doc references:** 13 mapped to research docs (docs 473, 479, 487, 491, 492, 660, 662, 663, 670, 673, 680, 691, 716)
- **Last skill updated:** 2026-05-22 (/meeting, /bonfire, /zao-research)
- **Plugin-namespaced families NOT enumerated:** autoresearch:*, everything-claude-code:*, superpowers:*, caveman:*, oh-my-mermaid:*, connect-apps:* (100+ total across families)
- **Scope:** ZAO-native skills only. Plugin skills tracked by family name.

## Key Decisions Table

| Decision | Recommendation | Rationale |
|---|---|---|
| **Meeting capture pipeline** | Keep /meeting as primary; /morning + /reflect + /standup as daily/reflection satellites | /meeting (doc 673) is the heavyweight skill; lightweight satellites feed it. Consolidate under doc 673 umbrella. |
| **Research skill duplication** | Merge /zao-research + /bcz-research + /bandz-research into single /zao-research v2 | 3 separate skills doing research routing to different repos (ZAOOS, BCZ, BANDZ). Single skill with repo selector is cleaner. |
| **VPS/agent management** | Rename /vps → /vps-agents; consolidate /coworkvps + /vps under single skill with project selector | Two separate VPS skills (Iman's cowork box + main VPS) create confusion. One skill with a "project" flag eliminates the decision. |
| **Design skills** | Retire /design-steal, /design-consultation, /design-review into a single /design-review with phases | Currently 3 related skills with overlapping scope. One skill with input classification is cleaner. Docs: none found. |
| **Plan/brainstorm** | Keep separate: /plan-ceo-review, /plan-eng-review, /plan-design-review (distinct audiences) | Each has specific framing (CEO ops, eng execution, design process). Audience-specific branching is intentional. |

## Findings by Group

### 1. Meeting & Knowledge Capture

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /meeting | /meeting [path\|url] | live | 673 | Multi-phase meeting transcript → decisions/actions/recap doc | transcribe.sh, diarize.sh, extract-frames.sh, append-actions.sh, bonfire-episode.sh |
| /bonfire | /bonfire, "post to KG" | live | 680 | ZAO knowledge graph — episodes in (meeting, decision, action), auto-extracted by Bonfires | bonfire-episode.sh (VPS SSH) |
| /clipboard | /clipboard [content] | live | — | Local browser page, copy-paste ready. Feed output of other skills here | none |
| /onepager | /onepager [type] | live | — | Draft ZAOstock one-pagers (sponsor/partner/venue/city) → Supabase | none (Supabase write) |
| /reflect | /reflect (EOD ritual) | live | — | End-of-day reflection journal. Saves to running journal, sets intention | journal append |
| /morning | /morning (BOD ritual) | live | — | Daily status check, brief review, set priorities. Feed from ZAO tracker | tracker sync |
| /z | /z (quick status) | live | — | Dashboard — what's happening, needs attention, ready to close? | none (display only) |
| /big-win | /big-win [context] | live | — | Document new Big Win for ZAO → quarterly docs + master map | map update |

**Tally:** 8 skills, 1 origin doc (673), 3 supporting scripts, live status across all.

---

### 2. Research & Discovery

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /zao-research | /zao-research [topic] | live | 687 | ZAO research pipeline — search library (164+ docs) + codebase + OSS code, save findings | research doc scaffold |
| /bcz-research | /bcz-research [topic] | built | — | BCZ Strategies research (distinct repo, bcz-yapz graduations) | research doc scaffold |
| /bandz-research | /bandz-research [topic] | built | — | BANDZ research (music label ecosystem) | research doc scaffold |
| /last30days | /last30days [topic] | live | — | Real-time sentiment: Reddit, X, YouTube, TikTok, HN, Polymarket, GitHub, web | WebFetch chains |
| /fetch | /fetch [url] | live | — | Universal URL fetcher — Reddit (curl JSON), X (syndication), HN (Algolia), GitHub (gh), others (WebFetch) | zao-fetch-reddit.sh, zao-fetch-x.sh |
| /reddit-fetch | /reddit-fetch [url] | live | — | Dedicated Reddit fetcher (Gemini CLI or curl JSON fallback) | reddit fetch script |
| /ask-gpt | /ask-gpt [prompt] | live | 549 | Send prompt to user's ChatGPT (GPT-5 via codex CLI, no API cost). Cross-validation loops | ~/.zao/gpt-loop/ logging |

**Tally:** 7 skills, 2 origin docs (687, 549), 3 research routing variants needing consolidation.

---

### 3. Build / Test / Ship Pipeline

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /worksession | /worksession (at session start) | live | 459 | Isolated git worktree per terminal. Prevents parallel-session conflicts. PR at end. | worktree creation |
| /ship | /ship (code ready) | live | 461 | Full CI pipeline — detect + merge base, test, review diff, bump VERSION, update CHANGELOG, commit, push, PR | safe-git-push.sh, pre-push hooks |
| /investigate | /investigate [bug\|issue] | live | — | Root-cause analysis — read error logs, search patterns, propose fix + test | grep/bash chains |
| /review | /review [pr\|diff] | live | — | Code review — spot bugs, suggest improvements, comment inline | diff analysis |
| /verify | /verify (confirm fix works) | live | — | Manual testing on live deployed site (Vercel preview, zaoos.com, etc.) | screenshot + browser |
| /code-review | /code-review [--comment] [low\|med\|high] | live | — | Structured code review at effort level, optionally post inline PR comments | diff parsing |
| /qa | /qa (test UI feature) | live | — | UI QA — run app, click through flows, screenshot, report findings | browser automation |
| /qa-only | /qa-only | built | — | QA without any code changes (validation only) | browser automation |

**Tally:** 8 skills, 2 origin docs (459, 461), live pipeline from worktree → ship, tight integration with gstack/git hooks.

---

### 4. Planning & Brainstorm

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /plan-ceo-review | /plan-ceo-review [topic] | live | — | Brainstorm ops questions: timeline, capacity, budget, blockers, decision authority | structured Q&A |
| /plan-eng-review | /plan-eng-review [feature] | live | — | Brainstorm eng execution: arch, dependencies, testing, timeline, tech debt | structured Q&A |
| /plan-design-review | /plan-design-review [concept] | live | — | Brainstorm design decisions: brand fit, accessibility, mobile-first, flows | structured Q&A |
| /office-hours | /office-hours [topic] | built | — | 1-on-1 consulting format — async Q&A, saves to research doc | chat transcript |

**Tally:** 4 skills, 0 origin docs (implicit superpowers:writing-plans integration), audience-specific branching intentional.

---

### 5. Distribution & Content

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /socials | /socials [content] | live | — | Platform-specific social posts — Farcaster, X, Bluesky, LinkedIn, Telegram, Threads, TikTok | post generation, Firefly batch |
| /newsletter | /newsletter [topic] | live | — | "Year of the ZABAL" daily newsletter — HTML preview + distribution | newsletter HTML + PDF |
| /bcz-yapz-description | /bcz-yapz-description [slug] | live | — | BCZ YapZ YouTube description generator from transcript — tags + body → clipboard | youtube-descriptions/ write |
| /standup | /standup (build-in-public) | live | — | Tweetable standup from git activity (ZAOOS, BCZ, music community angle) | git log parsing |

**Tally:** 4 skills, 0 origin docs, tightly integrated with feedback_copyable_content_own_bubble and feedback_social_pipeline_priorities_may6.

---

### 6. Agent / VPS / Infrastructure

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /vps | /vps [status\|logs\|restart\|deploy] | live | 234-239 | Manage ZOE + agent squad on main VPS — SSH, Telegram, systemd units. 3 tiers (SOUL/AGENTS/HEARTBEAT) | vps-ssh-wrapper |
| /coworkvps | /coworkvps [status\|logs\|restart\|deploy] | live | 662 | Manage @ZAOcoworkingBot on Iman's Hostinger VPS (187.77.3.104) — cowork-zaodevz/agent/ deployment | ssh to 187.77.3.104 |
| /quad | /quad [status\|create\|list\|chat] | live | — | QuadWork local dashboard — 4-agent dev team (Head/Dev/RE1/RE2) at http://127.0.0.1:3001 | local HTTP calls |
| /inbox | /inbox [view\|process] | live | 716 | AI-augmented email processing — zoe-zao@agentmail.to forwarding, link extraction, topic routing | email ingest |
| /careful | /careful (ops guardrail) | built | — | Warning flags for prod operations, wallet operations, secret-touching. User can override each. | override prompt |
| /freeze | /freeze [scope] | built | — | Pause/lock a system state (deploy halt, wallet lock, etc.) | state lock file |
| /guard | /guard (secret watch) | built | — | Secret hygiene guardrail — scans diffs for API keys, private keys, PII | grep patterns |
| /unfreeze | /unfreeze [scope] | built | — | Resume a frozen system | state unlock file |

**Tally:** 8 skills, 2 origin docs (234-239, 662, 716), 2 VPS skills ripe for consolidation, 2 guardrail skills (careful, guard) live, freeze/unfreeze paired.

---

### 7. Project-Specific (Graduated & Paused)

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /fishbowlz | /fishbowlz [sync\|deploy\|status] | cold | — | Manage standalone FISHBOWLZ project (paused 2026-04-16, partnering with Juke instead). Sync from ZAOOS, push to GitHub, deploy to fishbowlz.com | git/github operations |
| /design-steal | /design-steal [project\|url] | built | — | Reference design component library — steal patterns from URLs, adapt to ZAO brand | screenshot + analysis |
| /design-consultation | /design-consultation [surface] | built | — | Sync design decisions with Zaal — brand fit, flow, accessibility | chat transcript |
| /design-review | /design-review [surface] | built | — | Polish pass for live sites. User can request before shipping. | diff + suggestions |

**Tally:** 4 skills, 0 origin docs, 1 cold (FISHBOWLZ), 3 design variants ripe for merger.

---

### 8. Hours & Consulting

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /start | /start [project\|task] | built | — | Start billable consulting hour clock | hour log append |
| /end | /end | built | — | End billable hour, commit to hours-log.csv (BCZ consulting) | csv write |

**Tally:** 2 skills, 0 origin docs, built, low-frequency use.

---

### 9. Meta & Tooling

| Skill | Trigger | Status | Doc | Purpose | Scripts/Outputs |
|---|---|---|---|---|---|
| /audit-skill | /audit-skill [name\|all] | live | — | Audit skills vs. Anthropic best practices (quality, performance, security) | audit report |
| /find-skills | /find-skills [capability] | live | — | Help discover installed skills when user asks "how do I X" | skill list + install |
| /humanizer | /humanizer [text] | built | — | Tone-shift for social/broadcast (formal → casual, technical → plain English) | rewrite output |
| /lean | /lean [process] | live | — | Lean waste audit — 7 wastes, value stream mapping, improvement proposals | process audit |
| /graphify | /graphify [input] | live | — | Code/doc/paper/image → knowledge graph → clustered communities → HTML + JSON + audit report | KG visualization |
| /setup-browser-cookies | /setup-browser-cookies [service] | built | — | Configure browser cookies for authenticated scraping (fallback for WebFetch) | cookie config |
| /check-env | /check-env | built | — | Validate env vars before deploy (fresh clone, CI sanity check) | env validation |
| /catchup | /catchup (context restoration) | built | — | Restore session context after /clear or lost memory (reads cowork tracker, recent git, status) | context fetch |
| /new-component | /new-component [name] | built | — | Scaffold React component with ZAO conventions (use client, dark theme, Tailwind v4) | component template |
| /new-route | /new-route [path] | built | — | Scaffold API route with ZAO conventions (Zod, session, NextResponse, tests) | route template |
| /next-best-practices | /next-best-practices [topic] | built | — | Next.js patterns reference — file conventions, RSC, data, metadata, errors | pattern lookup |
| /supabase | /supabase [task] | live | — | Supabase operations (database, auth, edge functions, RLS, migrations) | supabase CLI |
| /supabase-postgres-best-practices | /supabase-postgres-best-practices [topic] | built | — | Postgres perf optimization (indexing, query analysis, schema patterns) | query analysis |
| /gstack-upgrade | /gstack-upgrade | built | — | gstack framework self-upgrade (auto or user-prompted) | gstack update |
| /gstack | /gstack [config\|status\|update] | built | — | gstack framework config and maintenance | gstack wrapper |

**Tally:** 16 skills, 0 origin docs, mostly built/live, meta-tooling for process + env hygiene.

---

### 10. Plugin-Namespaced Families (NOT Enumerated)

These are installed as plugin skills; enumeration would add ~100+ rows. Tracked by family only.

| Family | Count | Purpose | Source |
|---|---|---|---|
| **everything-claude-code:*** | ~80+ | Massive ECC plugin suite — code review, testing, patterns, deployment, security, industry-specific (Django, Kotlin, Rust, Go, etc.) | Anthropic's affaan-m/everything-claude-code repo, pinned SHA 8bdf88e5 |
| **autoresearch:*** | 5 | Scenario planning, debugging, fixing, shipping, prediction, security analysis | ECC bundle |
| **superpowers:*** | 10+ | Writing, brainstorming, planning, receiving/requesting review, TDD, git worktrees, subagent dispatch | Anthropic superpowers suite |
| **caveman:*** | 4 | Caveman coding (commit-at-line-level), review, compression | custom skill family |
| **oh-my-mermaid:*** | 3 | Diagram scanning + view + push (omm-scan, omm-view, omm-push) | diagram automation |
| **connect-apps:*** | 1 | OAuth setup (Google Drive, Gmail, Calendar, etc.) | MCP bridge |

**Plugin total:** 100+ skills across 6 families, live and actively used. Not enumerated per 722a scope.

---

## Integration Status (as of 2026-05-23)

### Most Recently Updated
1. **/meeting** - 2026-05-22 (doc 673 meeting capture pipeline)
2. **/bonfire** - 2026-05-22 (doc 680 knowledge graph episodes)
3. **/zao-research** - 2026-05-20 (research doc scaffolding)
4. **/ask-gpt** - 2026-05-20 (ChatGPT loop via codex CLI, doc 549)

### Highest Frequency Use (inferred from CLAUDE.md + memory)
1. /worksession (session start, 100% of terminal sessions)
2. /z (status check, ~daily)
3. /meeting (whenever call recap needed, ~3-5x/week)
4. /ship (deploy ready, ~1-3x/week)
5. /zao-research (research task, ~2-3x/week)

### Cold/Superseded Status
- **/fishbowlz** - paused 2026-04-16 (partnering with Juke farcaster audio client instead, doc 695)
- **/design-steal, /design-consultation, /design-review** - built but overlapping scope (candidate for merger)
- **/start, /end** - built but low-frequency (BCZ consulting hours only)
- **/office-hours** - built but rarely invoked

---

## Next Actions

| Action | Owner | Priority | Notes |
|---|---|---|---|
| **Merge research routing skills** | Claude Code | P0 | Consolidate /zao-research + /bcz-research + /bandz-research into single skill v2 with `--repo` flag. Reduces decision fatigue. |
| **Consolidate VPS management** | Claude Code | P1 | Unify /vps + /coworkvps into single /agent-ops or /vps-fleet skill with `--project` selector (vps1 / cowork / local). Eliminates confusion. |
| **Merge design skills** | Claude Code | P1 | Unify /design-steal + /design-consultation + /design-review into single /design-review with input classification. Docs currently missing. |
| **Retire /office-hours** | Zaal | P2 | Rarely used; /plan-* skills cover the use case better. Confirm with Zaal before deletion. |
| **Document /quad integration** | Claude Code | P2 | QuadWork dashboard at http://127.0.0.1:3001 is live but /quad skill lacks docs. Add to dev-workflows reference. |
| **Post plugin skill inventory** | Claude Code | P2 | Create separate 722b doc enumerating the 100+ plugin skills per family (everything-claude-code:*, autoresearch:*, superpowers:*, etc.). |
| **Audit skill doc refs** | Claude Code | P3 | 13 skills have origin docs; 62 do not. Map remaining skills to either new research docs or existing docs for discoverability. |

---

## Appendix: Full Skill List (Alphabetical)

### User-Level (47 @ `~/.claude/skills/`)
21st, ask-gpt, audit-skill, autoresearch, bandz-research, bcz-research, bcz-yapz-description, bonfire, browse, careful, clipboard, codex, coworkvps, design-consultation, design-review, design-steal, document-release, end, fetch, find-skills, freeze, graphify, gstack, gstack-upgrade, guard, humanizer, investigate, last30days, meeting, office-hours, plan-ceo-review, plan-design-review, plan-eng-review, qa, qa-only, quad, reddit-fetch, retro, review, setup-browser-cookies, ship, socials, start, supabase, supabase-postgres-best-practices, unfreeze, zao-research

### Project-Level (28 @ `ZAOOS/.claude/skills/`)
autoresearch, big-win, bonfire, catchup, check-env, design-steal, evals, fishbowlz, fix-issue, gitnexus, inbox, lean, meeting, morning, new-component, new-route, newsletter, next-best-practices, onepager, reflect, socials, standup, vps, worksession, z, zao-os, zao-research, zao-stock

---

**Compiled 2026-05-23 by Claude Code agent. Scope: 722a skills inventory (non-enumerated: 100+ plugin skills across 6 families).**
