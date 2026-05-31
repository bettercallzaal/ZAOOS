---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-05-31
superseded-by:
related-docs: 759, 070, 441, 789, 698
original-query: "/inbox research all - cluster of forwarded items on agentic coding: Hanako X article 'How One File Called CLAUDE.md Turns Claude from a Search Engine into a Second Employee', r/ClaudeAI 'the thing you built with claude is useless to me', r/vibecoding 'vibe coding gets better when the agent has a live...', r/ClaudeCode 'using maybe 30% of Claude Code - what's your daily workflow', r/ClaudeCode Remotion launch-video build, Kirill X long-form 'Kimi Agent Swarm: 300-agent parallel system'"
tier: DEEP
---

# 790 — Agentic Coding Workflows: CLAUDE.md, Daily-Driver Patterns, Vibecoding, Remotion Video-Gen, and the Swarm-vs-Teams Orchestration Split

> **Goal:** Synthesize a cluster of six forwarded items into one map of where agentic coding is in mid-2026 - the "AI as second employee" thesis, the context-file discipline that powers it, single-prompt output-heavy deliverables, and the architectural fork between massive swarms (Kimi, 300 agents) and small peer teams (Claude Agent Teams, 4-6 agents) - then point each finding at a concrete ZAO surface.

## Key Decisions (Recommendations First)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | KEEP the ZAO OS `CLAUDE.md` under ~200 lines and prune ruthlessly | Frontier LLMs reliably follow ~150-200 instructions; Claude Code's own system prompt eats ~50 of those. Anthropic's internal `CLAUDE.md` is ~2,500 tokens. Past the ceiling Claude silently drops rules - including the load-bearing ones. The current ZAO `CLAUDE.md` is already dense; the Project Map + Boundaries are the highest-signal parts, the rest competes for attention. | @Zaal |
| 2 | The "second employee" framing is what ZOE/Hermes already ARE - name it that way externally | The viral thesis (CLAUDE.md turns a stateless model into a teammate who retains institutional knowledge) is exactly the ZOE 4-block memory + Hermes auto-PR pattern. This is a build-in-public narrative ZAO can own, not a thing to build. | @Zaal |
| 3 | USE Remotion + Claude Code for ZAOstock / ZABAL Games promo video, NOT After Effects or an editor | One developer shipped a full 51-second launch video in one evening for $0 - video is JSX, every animation is `interpolate(frame, ...)`, Claude writes the React scene components. ZAO ships video constantly (recaps, announcements). This collapses the cost to near-zero. | @Zaal |
| 4 | The ZOE orchestrator (doc 759, locked) sits correctly on the Claude-Teams side of the swarm/teams fork, NOT the Kimi 300-agent side | Kimi Swarm = 300 parallel sub-agents + central coordinator, built for broad-coverage content batches (100 CVs, 30 landing pages). Claude Agent Teams = 4-6 peer agents for deep codebase work. ZOE's 8-worker/3-critic GATEWAY shape with a $50/day cap is a small-team coder pattern - the doc-759 design is on the right side. Do NOT pivot ZOE toward a 300-agent swarm. | @Zaal |
| 5 | INVESTIGATE adopting `AGENTS.md` as the canonical file with `@AGENTS.md` inlined from `CLAUDE.md` | ZAO already maintains both `CLAUDE.md` and `AGENTS.md` (CLAUDE.md says AGENTS.md is source-of-truth for Boundaries). AGENTS.md now has 60,000+ projects and Linux Foundation governance; Claude Code reads it as fallback. The `@AGENTS.md` inline syntax would collapse the two-file drift the current CLAUDE.md explicitly warns about. | @Zaal |
| 6 | ADD a `/til` slash command (`.claude/commands/til.md`) that appends symptom+fix one-liners to a `TIL.md` that survives `/clear` | Cheapest compounding win in the cluster (r/ClaudeCode, tonyboi76). ZAO already has a memory/feedback-file system; a `/til` is the lightweight in-session capture layer that feeds it. Stop re-solving the same arcane error. | @Zaal |
| 7 | OWN the "personal software / problem-shaping over artifact" thesis as ZAO positioning + build-in-public voice | ZAO OS is itself hyper-specific software for one 188-member community - "useless to anyone else, and that's the point" (the 1.4K-upvote r/ClaudeAI thesis). When ZAO ships build-in-public, lead with the problem-shaping (the thought pattern that transfers), not just the artifact screenshot. This is also the honest frame for the "clone, no deps" graduation model in `CLAUDE.md`. | @Zaal |

## The Cross-Cutting Pattern

Every item in this cluster is a facet of one shift that hit critical mass in 2026: **AI coding tools moved from "faster autocomplete" to "an employee you onboard and delegate to."** The pieces differ only in which part of that they emphasize:

- **Context (CLAUDE.md)** - the onboarding doc that gives the stateless model persistent institutional memory.
- **Delegation depth (Claude Code daily workflows / vibecoding)** - how much you hand over, and the habits that make handoff reliable.
- **Output ambition (Remotion)** - the model produces a finished deliverable (a rendered video), not a snippet.
- **Parallelism architecture (Kimi Swarm vs Claude Teams)** - how many employees, coordinated how, for what kind of work.

The naive read of each piece is "new AI trick." The real read is: the bottleneck stopped being model capability and became **context engineering + task decomposition + verification**. Every source independently lands on the same caveat - speed without human verification produces scaled-up errors, not scaled-up value.

## Findings

### 1. CLAUDE.md: the "second employee" file (Item 2 - Hanako X article, FULL via mirrors)

The Hanako X long-form ("How One File Called CLAUDE.md Turns Claude from a Search Engine into a Second Employee", 137 favs, 2026-05-28) makes the viral version of an argument now documented in Anthropic's own help center and a dozen guides. The article body itself is paywalled inside X's article reader (PARTIAL - see Sources), but the thesis is fully corroborated by mirrors.

Core mechanics (consensus across Anthropic + 5 independent guides):
- `CLAUDE.md` is plain markdown Claude Code auto-reads at session start and injects right after the system prompt (NOT inside it). No `@`-reference needed; if it exists, it is already read.
- Hierarchy, broad to specific: `~/.claude/CLAUDE.md` (personal, all projects) -> `<repo-root>/CLAUDE.md` (the main one, commit it) -> `<subdir>/CLAUDE.md` (loaded on demand). Later/more-specific wins ties. Enterprise level sits on top and cannot be overridden.
- Prompt-cached: first request per session pays full token price, subsequent requests within ~5 min hit cache-read rates. Any edit invalidates the cache.
- Size ceiling: keep under ~200-300 lines / ~2,500 tokens. Research says frontier LLMs reliably follow ~150-200 instructions; the system prompt consumes ~50. Over the limit, rule-following degrades.
- The high-value content is the corrections you have made more than once ("we use pnpm not npm", "test command is `make test-integration`"). One dev reported a 40-line file eliminated three months of repeated corrections overnight. Rule of thumb: if removing a line would NOT cause a mistake, cut it.
- Update loop: end a correction with "and update CLAUDE.md so this doesn't happen again"; or use `#` (inline add) / `/memory` (full edit) / `/init` (generate starter, then delete most of it).

Karpathy connection (relevant - ZAO already uses `/autoresearch` built on his principles, doc 789): on 2026-01-26 Karpathy posted about shifting from 80% manual to 80% agent-driven coding in ~2 months. Forrest Chang turned his complaints into a viral behavioral `CLAUDE.md` (four principles: think before coding, keep it simple, surgical changes, goal-driven execution) - designed to MERGE with project-context files, not replace them. This is the split ZAO should mirror: behavioral principles in a Skill, project context in CLAUDE.md.

### 2a. Daily-driver Claude Code workflows (Items 3/5 family - r/ClaudeCode "Things I wish I knew", FULL via paste)

A high-signal "habits I locked in" post (r/ClaudeCode, solo_dev_builds, 90 upvotes, 27 comments) from a zero-CS-background builder shipping Flutter + web apps since April. The five habits + the best comments are a ready-made onboarding checklist:

1. **Living project prompt** - a master context file Claude updates at the end of every session (what changed, what was decided, what's pending). Every new session starts with full context. (This IS the CLAUDE.md pattern from finding 1, applied per-project.)
2. **Fresh sessions per feature, not per day** - long sessions cause context bloat; Claude makes "weird decisions" carrying too much. One session per feature, paste only what's relevant. (Anthropic's own guide says the same: one task per conversation, `/clear` between them.)
3. **Paste functions, not files** - paste the function/component that matters, not the whole file. Saves tokens, keeps Claude focused. (ZAO's `@path/to/file` reference habit does this better - point, don't paste.)
4. **Vault credentials + build log** - a password-protected HTML file per phase. NOTE the comment-thread correction (jWoose, "Senior Developer"): pull real creds OUT into a password manager (1Password/Bitwarden), keep the HTML as a pure build-log. This is the exact `secret-hygiene.md` rule ZAO already enforces - real keys never in a file, even an "encrypted" one.
5. **Let Claude write the next session's prompt** - at the end of a build session, have Claude write the prompt for the next instance. It knows where you left off. (This is the ZAO `/handoff` skill, manualized.)

Best comment additions:
- **`/til` custom slash command** (tonyboi76): a `.claude/commands/til.md` that makes Claude append a one-line symptom+fix to `TIL.md` after every gnarly debug session - a personal playbook that survives `/clear`. "You stop re-googling the same arcane error six months later." This is directly adoptable by ZAO and complements the existing memory/feedback file system.
- **BMAD** spec-driven framework: powerful but a token hog (Max-tier only) and over-engineers if unwatched - aligns with ZAO's existing skepticism of heavy frameworks.
- **The "wish I knew earlier" = Supabase RLS** (OP, replying to Duck-Entire): "Claude can write the policy but if you don't understand what it's doing you'll never debug it when it breaks." Directly relevant - ZAO runs RLS on all Supabase tables (`CLAUDE.md` Security section).

### 2b. "The thing you built with Claude is useless to me... and that's the point" (Item 3 - r/ClaudeAI, FULL via paste)

The cluster's most-discussed thread (r/ClaudeAI, HispaniaObscura, **1.4K upvotes, 249 comments**) and the most strategically interesting for ZAO. Thesis: the things people build with Claude are each perfect for exactly one person and useless to anyone else as-is - and that is the whole point. **Vibe coding is the 3D-printing / DIY of software: personal software on demand.** The artifact (the code) is "just a souvenir / a receipt"; the only thing that transfers is the **thought pattern** - how you spotted a friction in your own life and shaped a tool to its exact contour. The author now puts a note atop every public repo: "this is an artifact, the interesting part is how I thought about the problem - steal the idea, write your own."

Why this matters beyond the meme (synthesized from the 249 comments):
- **The transferable unit is problem-shaping, not the prompt or the code** (WorthBathroom3268, zrail, Relative_Register_79: "thought patterns without artifacts = intellectual aesthetics; artifacts without thought patterns = shallow demos; the power is the loop between them").
- **"Stopped building features, started building workflows"** (Hefty_Bodybuilder893): md files telling agents how to work + who we are, scripts matching agents to tasks by skill, checkpoint/cron systems so context survives sessions. Product vs prototype. This is precisely the ZOE/Hermes design.
- **The honest counterweight - shadow IT + tech debt** (asielen, fixitchris): "Personal tools are great for personal problems. No problem in a company is personal." A "personal" KPI tool turned out load-bearing for two teams on one laptop. SaaS (JIRA, Sentry) won't disappear - carbon-copy apps are "an inch deep."
- Karpathy's CLAUDE.md gist surfaces again in-thread (devjonas, amado88) - the same through-line as finding 1.

### 2c. r/vibecoding "live feedback loop" (Item 4 - STILL FAILED, pending paste)

The one remaining gap: r/vibecoding 1tomshw "vibe coding gets better when the agent has a live [feedback loop]". Reddit IP-blocked, not yet pasted. Its likely thesis (live render/re-run loop) is already corroborated by the Remotion "change a value, re-render, see what happens" point (finding 3). Backfill when pasted; the synthesis does not depend on it.

### 3. Remotion + Claude Code: $0 launch video in one evening (Item 6 - r/ClaudeCode, FULL via paste)

A showcase post (r/ClaudeCode, ~10 days old, 32 upvotes, 16 comments) built a full 51-second startup launch video entirely in Remotion with Claude Code writing the React scene components. The whole video is JSX; every animation is `interpolate(frame, [start, end], [from, to])`. The poster described each scene, Claude composed transitions/audio timing, the poster tweaked timing and cut slow scenes. Tight feedback loop ("change a value, re-render, see what happens") - which is exactly the r/vibecoding "live feedback loop" thesis from item 4.

Five concrete tricks that made output not look dev-made (directly reusable for ZAO video):
1. Crossfade every cut (overlap + blur-fade, no hard cuts) - stops it feeling like a slideshow.
2. One easing curve everywhere: `cubic-bezier(0.22, 1, 0.36, 1)`. Consistency in motion = 80% of "looks designed".
3. Film grain + vignette: SVG noise at 2% opacity + soft dark vignette. Cheapest cinematic trick.
4. Layered audio: background music low, SFX only on chapter cuts + CTA. Overdoing SFX is the #1 amateur tell.
5. Cut ruthlessly: if a scene doesn't earn its place in 3 seconds, kill it.

Stack: Remotion, React, TypeScript, Claude Code, Google Fonts, freesound.org for SFX. Caveat from the comments: it was (lightly) a hidden ad for the poster's product (InkMotion), and a commenter flagged the demo audio cut mid-sentence - i.e. ship-quality still needs human QA, same caveat as every other item.

### 4. Kimi Agent Swarm vs Claude Agent Teams: the orchestration fork (Item 7 - Kirill X long-form, FULL via paste)

Kirill's A-Z guide (kirillk_web3, 2026-05-21, 662.5K views) frames the two dominant multi-agent architectures as solving DIFFERENT problems, not competing:

| Dimension | Claude Agent Teams (Anthropic) | Kimi Agent Swarm (Moonshot AI) |
|-----------|-------------------------------|--------------------------------|
| Scale | ~4-6 agents/session (up to ~20 reported in cloud containers); no published hard cap | Explicit ceiling: 300 sub-agents, 4,000 coordinated steps per task |
| Communication | Peer-to-peer (lateral; agents share findings directly) | Central coordinator only (all output flows to coordinator; no agent-to-agent) |
| Surface | Terminal-based, extension of Claude Code | Web interface, general-purpose productivity layer |
| Best at | Large refactors, parallel code review, multi-service debugging, cross-layer coordination INSIDE a codebase | Deep+wide research, batch content at scale (100 CVs, 30 landing pages, 10 magazine covers), multi-file synthesis, end-to-end deliverables |
| Audit/debug | Harder (agents can conflict laterally) | Cleaner audit trail, simpler conflict resolution; coordinator context window is the bottleneck |

Real Kimi Swarm outputs cited: 100 tailored CVs from 1 CV + 100 listings; a 100,000-word literature review from 40 PDFs (40 parallel sub-agents); 30 deployable landing pages for websiteless businesses scraped from Google Maps; a 40-page astrophysics report + 20,000-row dataset + 14 charts from 1 paper.

The honest caveat (Kirill states it directly): "300 agents and 4,000 steps are system parameters, not quality guarantees... Speed without verification produces scaled-up errors, not scaled-up value." Quality scales with prompt specificity, not agent count.

## ZAO Application

| Finding | ZAO surface | Action |
|---------|-------------|--------|
| CLAUDE.md "second employee" thesis | `bot/src/zoe/` 4-block memory, `bot/src/hermes/` auto-PR | This is already shipped. Frame ZOE/Hermes externally as "the second-employee pattern, productionized" - build-in-public content. |
| CLAUDE.md size discipline | `/Users/zaalpanthaki/Documents/ZAO OS V1/CLAUDE.md` | Audit against the 200-line / 2,500-token ceiling; the MEMORY.md warning (203 lines, 31.9KB) shows the same bloat risk already firing. |
| AGENTS.md as canonical + `@AGENTS.md` inline | `CLAUDE.md` + `AGENTS.md` (both maintained, drift warned about) | Collapse the documented two-file drift via `@AGENTS.md` inline. |
| Swarm vs Teams fork | ZOE orchestrator (doc 759, locked) | Confirms doc-759 design is on the correct (small-team coder) side. Do not pivot to 300-agent swarm. Kimi-style swarm only fits a future ZAO bulk-content surface (e.g. mass cold-outreach pages), never the coder. |
| Remotion $0 video | ZAOstock / ZABAL Games / newsletter promo | Spike a Remotion + Claude Code template for a 30-60s ZAO recap video; reuse the 5 cinematic tricks. |

## Also See

- [Doc 759](../../agents/759-*/) - ZOE orchestrator architecture locked (the Claude-Teams-side design this doc validates)
- [Doc 070](../../agents/070-subagents-vs-agent-teams/) - subagents vs agent teams (prior ZAO take on the same fork)
- [Doc 789](../789-*/) - /meeting + /autoresearch (Karpathy autoresearch principles already in ZAO)
- [Doc 441](../441-everything-claude-code-integration/) - ECC integration / the rules this repo cherry-picks
- [Doc 698](../../agents/698-*/) - agent stack re-audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Paste the last reddit item (4 - r/vibecoding 1tomshw) to close the final FAILED source | @Zaal | Paste-in-chat | Next /inbox pass |
| Add a `/til` slash command (`.claude/commands/til.md`) writing to a `/clear`-surviving `TIL.md` | @Zaal | PR | This sprint |
| Add a "problem-shaping, not just the artifact" note to public ZAO repo READMEs (build-in-public framing) | @Zaal | PR | When next graduating a repo |
| Audit ZAO OS `CLAUDE.md` against 200-line / 2,500-token ceiling, prune low-signal lines | @Zaal | PR | This sprint |
| Spike a Remotion + Claude Code 30-60s ZAO recap-video template (5 cinematic tricks) | @Zaal | Spike | June |
| Decide on `@AGENTS.md` inline to kill CLAUDE.md/AGENTS.md drift | @Zaal | PR | This sprint |
| Confirm ZOE orchestrator (doc 759) stays small-team, not swarm | @Zaal | Decision | Locked - re-affirm |

## Sources

- [Hanako X article - "How One File Called CLAUDE.md Turns Claude into a Second Employee"](https://x.com/hanakoxbt/status/2059956659951149275) - `[PARTIAL - tweet + article title/preview/author fetched via syndication; full article body sits behind X's i/article reader (article id 2059724389860442118) which exa+syndication do not return. Topic FULL-corroborated by mirrors below.]`
- [Anthropic Help Center - Give Claude context: CLAUDE.md and better prompts](https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts) - `[FULL]`
- [Medium / Ewan Mak - The CLAUDE.md Guide (May 2026)](https://medium.com/@tentenco/the-claude-md-guide-how-one-file-turns-a-stateless-ai-into-your-long-term-coding-partner-b8806683df7f) - `[FULL]`
- [Jimmy's Blog - The Complete CLAUDE.md Guide](https://www.jmliu6.com/en/blog/claude-code-claude-md) - `[FULL]`
- [Developers Digest - How to Write a CLAUDE.md: The Complete 2026 Guide](https://www.developersdigest.tech/blog/how-to-write-claudemd-the-complete-guide) - `[FULL]`
- [Vibe Coder Blog - CLAUDE.md File Format, Sections, and Real Examples](https://blog.vibecoder.me/claude-md-file-format-guide-sections-examples) - `[FULL]`
- [r/ClaudeCode - Used Claude Code to build a full launch video with Remotion. $0, one evening](https://www.reddit.com/r/ClaudeCode/comments/1tn8xmb/) - `[FULL - via paste-in-chat by Zaal; reddit IP-blocked from this machine]`
- [Kirill (kirillk_web3) X long-form - Kimi Agent Swarm: Complete A-Z Guide](https://x.com/kirillk_web3) - `[FULL - via paste-in-chat by Zaal; 662.5K views, 2026-05-21]`
- [r/ClaudeAI - "The thing you built with Claude is useless to me... and that's the point"](https://www.reddit.com/r/ClaudeAI/comments/1tp3en9/) - `[FULL - via paste-in-chat by Zaal; 1.4K upvotes, 249 comments, post + comment tree]`
- [r/ClaudeCode - "Things I wish I knew when I started building with Claude Code"](https://www.reddit.com/r/ClaudeCode/comments/) - `[FULL - via paste-in-chat by Zaal; 90 upvotes, 27 comments; the daily-driver workflow thread (items 3/5 family)]`
- [r/vibecoding - "vibe coding gets better when the agent has a live..."](https://www.reddit.com/r/vibecoding/comments/1tomshw/) - `[FAILED - reddit IP-blocks this datacenter; zao-fetch-reddit/exa/old.reddit/alt-UA all exhausted. NOT yet pasted. Thesis corroborated by the Remotion live-render-loop point (finding 3); synthesis does not depend on it.]`
