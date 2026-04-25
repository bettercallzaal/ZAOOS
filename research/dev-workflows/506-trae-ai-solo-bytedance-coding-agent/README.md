---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-24
related-docs: 491, 492, 493
tier: STANDARD
---

# 506 - TRAE AI + SOLO Mode (ByteDance)

> **Goal:** Decide whether ZAO OS / BCZ should adopt TRAE SOLO as a coding agent, given the ByteDance privacy track record and existing Claude Code + QuadWork investment.

Tweet trigger: https://x.com/trae_ai/status/2047145274200768969 (X paywall blocked direct fetch; synthesis from official site, blog posts, vendor reviews, security press, and competitor comparisons).

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| Adopt TRAE SOLO for ZAO OS / BCZ work | **SKIP** | ByteDance telemetry continues after opt-out (The Register, 2025-07); 26MB / 7min per user even idle. Repo handles `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `APP_SIGNER_PRIVATE_KEY`, agent wallets. Hard violation of `.claude/rules/secret-hygiene.md` and project secret posture. |
| Adopt TRAE SOLO for personal throwaway / learning projects | **OK** | Free Claude 4 + GPT-4o + DeepSeek R1 access is genuinely strong if the repo holds nothing sensitive. |
| Adopt TRAE SOLO instead of Claude Code Max sub | **SKIP** | Memory `feedback_prefer_claude_max_subscription` already locks the pattern. TRAE adds vendor risk, no observable upside on top of QuadWork. |
| Borrow patterns from TRAE SOLO (PRD-first, Sub Agent, Plan Mode, DiffView, Context Compression) | **STEAL** | These are the right primitives. Already mirrored by Claude Code subagents + `superpowers:writing-plans` + `everything-claude-code:santa-method`. Use TRAE as a reference for what to wire into ZOE / QuadWork. |
| Use TRAE SOLO Web for one-off micro-sites (zlank.online demos, ZAOstock landers) | **CONDITIONAL** | Only when site has zero secrets, no DB access, no auth, no proprietary data. Flag risk: AI-generated code may include third-party calls back to ByteDance domains. Audit the build before deploy. |

## What TRAE Is

TRAE = "The Real AI Engineer." ByteDance's VS Code-fork IDE for international + China markets. Two surfaces:

- **TRAE IDE** - desktop fork, chat + autocomplete + agent. Free tier with premium models.
- **TRAE SOLO** - autonomous coding agent. Multi-Agent architecture: SOLO Builder (Web app end-to-end) + SOLO Coder (deeper planning + sub-agents). Cloud + desktop. Live preview, Vercel deploy, Figma input, MCP marketplace.

Timeline:
- 2025-01 - quiet international launch
- 2025-04-08 - TRAE Agent 2.0 (LLM-driven autonomy)
- 2025-07-21 - SOLO mode launch, international Pro waitlist
- 2025-09-23 - "next-generation AI-powered coding platform" rebrand (Yahoo Finance launch piece)
- 2026-02-24 - new pricing: $3/$10/$30/$100 tiers, token-based
- 2026-03 - TRAE 2.0 + SOLO China Edition free with Plan Mode, Sub Agent, DiffView, multi-task parallelism, context compression
- 6M+ registered users across ~200 countries by Feb 2026

## Pricing (current as of 2026-04-24)

| Tier | Price | Notes |
|------|-------|-------|
| Free | $0 | 5,000 autocompletions / mo, premium model access (Claude 3.7 Sonnet, GPT-4o, DeepSeek R1, Gemini 2.5 Pro) |
| Lite | $3 / mo | First-month onboarding price |
| Pro | $10 / mo | First month $3, then $10. SOLO mode unlock. Half of Cursor's $20. |
| Higher tiers | $30, $100 / mo | Token-based, team-oriented |
| China Edition | Free | No invite code, Win/Mac/Linux. Pro (team + private deploy) opens preorders Q1 2026. |

## Privacy Red Flags - The Decisive Issue

| Source | Finding |
|--------|---------|
| The Register (2025-07-28) | Telemetry continues after opt-out is checked. Opt-out toggle is cosmetic. |
| TechRadar | Documented background data collection from disabled-telemetry installs. |
| CyberNews | "Vibe coders' data harvested" - hardware specs, OS, architecture, usage patterns, unique identifiers, project information. |
| Dhrumil Barot (Medium) | ~500 network calls in 7 minutes, ~26MB transferred even idle. Persistent connections to 5+ ByteDance domains. |

5-year retention. No enterprise SSO, no policy controls, no audit trail. ByteDance is the parent entity behind TikTok and is under continuing US scrutiny. For a repo containing:

- `src/lib/db/supabase.ts` + service-role key
- `src/lib/agents/runner.ts` + agent wallet keys
- `src/lib/auth/session.ts` + `SESSION_SECRET`
- 188 ZAO member wallets in DB
- iron-session cookies, Neynar signer keys

This is a non-starter under `.claude/rules/secret-hygiene.md`. Even with stub keys on disk (guard 1), the IDE telemetry sees source code as the agent reads it, including any in-context decrypted strings.

## TRAE SOLO vs Claude Code (current ZAO setup)

| Dimension | TRAE SOLO | Claude Code (Max sub) |
|-----------|-----------|------------------------|
| Form factor | VS Code fork IDE + cloud | CLI in terminal, subagents, MCP |
| Autonomy | Multi-Agent end-to-end (PRD - code - test - deploy) | Subagent dispatch + planner skills (santa, dispatching-parallel-agents) |
| Models | Claude 3.7 / 4, GPT-4o, DeepSeek R1, Gemini 2.5 Pro | Claude 4.7 Opus / 4.6 Sonnet / 4.5 Haiku via Max sub |
| Context engineering | "Context compression" + Plan Mode + Sub Agents | superpowers:writing-plans + auto-compaction + subagents |
| Privacy posture | ByteDance telemetry, post-opt-out collection, 5-yr retention | Anthropic API, no IDE-side collection beyond what user runs |
| Cost | $0-$100/mo, token-based | Max sub flat (already paid) |
| Vendor risk | High (CN-owned, regulatory uncertainty) | Low (US-based, signed BAA possible) |
| Already invested | None | QuadWork, ZOE on VPS, /worksession, all skills |
| Mac IDE option | Yes | N/A (terminal first) |
| Cloud parallel tasks | Yes (multi-tab + Sub Agents in cloud) | dmux-workflows, claude-devfleet, autonomous-agent-harness |

Claude Code already covers every TRAE SOLO capability ZAO actually uses. TRAE adds attack surface, not throughput.

## What's Worth Stealing

Treat TRAE as a competitor design study, not a tool. Patterns to mirror inside QuadWork / ZOE:

1. **Plan Mode before code.** TRAE forces a battle-map (file-level edits + risk points) before the agent writes anything. Already partially in `superpowers:writing-plans`. Make it a hard gate inside QuadWork's Head agent.
2. **Sub Agents with own scratch dir.** Each sub-agent inherits memory but writes to its own output folder. Mirrors `superpowers:dispatching-parallel-agents` + the `Agent` tool's `isolation: worktree`. Codify a "one sub-agent = one worktree" rule.
3. **DiffView as control surface.** Aggregated diff across all sub-agent outputs, batch accept / reject by file or function. Worth building into QuadWork dashboard at `/dashboard/quad`.
4. **Context compression as default.** TRAE auto-compresses long histories. Mirror via `everything-claude-code:strategic-compact` + the existing /compact discipline in CLAUDE.md.
5. **Multi-tab parallelism with isolated runtime.** N tabs, N independent contexts. Already covered by `zsesh` worktree pattern (see memory `feedback_workspace_worktrees`).
6. **PRD-first scaffold for new features.** TRAE auto-writes PRD before code. Worth bolting onto `/onepager` and the in-progress zlank.online builder spec (doc 505).

## Codebase Touchpoints (Where This Could Plug In - or Not)

- `src/lib/agents/runner.ts` - shared agent runner. SOLO-style sub-agent isolation could reduce blast radius if one agent goes off-script. Implement via worktrees, NOT TRAE.
- `src/lib/publish/` - cross-platform posting. PRD-first scaffold pattern would help when adding a new platform adapter (Threads, Bluesky).
- `community.config.ts` - any change here is high blast radius. TRAE's Plan Mode + DiffView pattern is the right gate; QuadWork already approximates this.
- `infra/portal/bin/bots/**` - bot fleet. Sub Agent isolation directly relevant; do NOT introduce TRAE telemetry to a box that handles app signer keys.
- `bot/` (ZAOstock Telegram bot) - same constraint.

## Sources

- [TRAE official site](https://www.trae.ai/) - product positioning, IDE Mode + SOLO Mode definition
- [TRAE SOLO product page](https://www.trae.ai/solo) - "Responsive Coding Agent" + Builder/Coder split
- [TRAE Unleashes the Next Era of AI Coding (Yahoo Finance, 2025-09-23)](https://finance.yahoo.com/news/trae-unleashes-next-era-ai-110000430.html) - launch announcement
- [TRAE SOLO: ByteDance's AI Programming Tool Revolution (TraeSolo blog, 2025-07-21)](https://www.traesolo.org/blog/trae-solo-tech-news-breakthrough) - SOLO launch breakdown
- [TRAE 2.0 + SOLO Mode developer community discussion](https://www.traesolo.org/blog/trae-solo-developer-community-discussion) - Multi-Agent architecture details
- [Trae SOLO China Edition launch (aibase, 2026-03)](https://news.aibase.com/news/23153) - Plan Mode, Sub Agent, DiffView, multi-task, context compression
- [Trae vs Cursor 2026 (Codepick)](https://codepick.dev/en/compare/trae-vs-cursor/) - feature + pricing comparison table
- [Trae vs Cursor (Morphllm)](https://www.morphllm.com/comparisons/trae-vs-cursor) - benchmarks
- [TRAE: The Real AI Engineer (Medium, ThamizhElango Natarajan, 2026-02)](https://thamizhelango.medium.com/trae-the-real-ai-engineer-how-bytedance-built-the-worlds-most-ambitious-ai-coding-agent-156223f0488a) - 6M users, ~200 countries claim
- [Trae Review 2026 (Vibecoding.app)](https://vibecoding.app/blog/trae-review) - feature + privacy summary
- [Trae Review 2026 (vibecoding.gallery)](https://vibecoding.gallery/en/tools/trae/) - free tier + SOLO autonomous deploy
- [Trae 2026 review (BattleAITools, 8.1/10)](https://battleaitools.com/tools/trae/) - market-share play, fast-request limits
- [ByteDance AI tool Trae caught collecting user data (TechRadar)](https://www.techradar.com/pro/security/bytedance-ai-tool-caught-spying-on-users) - data harvest report
- [Vibe coders' data harvested (CyberNews)](https://cybernews.com/security/bytedance-ai-coding-tool-trae-data-collection/) - data collection breakdown
- [Trae IDE telemetry continues after opt-out (The Register, 2025-07-28)](https://www.theregister.com/2025/07/28/bytedance_trae_telemetry/) - decisive privacy finding
- [Trae IDE Review: Massive Security Vulnerability in Disguise (Dhrumil Barot, Medium)](https://medium.com/@barotdhrumil21/trae-ide-review-a-massive-security-vulnerability-in-disguise-16761a300e8b) - 500 calls / 7min / 26MB measurement
- [Cursor 3 Agent-First Interface (InfoQ, 2026-04)](https://www.infoq.com/news/2026/04/cursor-3-agent-first-interface/) - market direction context

## Staleness + Verification

- Pricing block validated 2026-04-24 against vibecoding.gallery + Codepick. Re-check before any procurement.
- Privacy findings published 2025-07; ByteDance has not publicly announced telemetry remediation as of last check (2026-04-24). Re-validate if a vendor audit drops.
- TRAE 2.0 China Edition feature list pulled from aibase 2026-03 piece; cross-check against trae.ai/solo current site state if a re-eval is needed.
- The triggering tweet (status 2047145274200768969) was paywalled at fetch time; conclusions do not depend on that single tweet's content - they rest on the broader product + security record.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add TRAE to "do not install on VPS / dev machines that touch ZAO secrets" list inside `.claude/rules/secret-hygiene.md` (or new `tooling-allowlist.md`) | @Zaal | Rule edit / PR | This week |
| Steal Plan Mode gate pattern - bolt mandatory plan + risk-points step into QuadWork Head agent before any Dev write | @Zaal / Quad | Code change | Next sprint |
| Steal DiffView aggregation pattern for QuadWork dashboard (`/dashboard/quad` or new `/dashboard/diff`) | @Zaal / Quad | Feature | Backlog |
| Steal PRD-first scaffold for `/onepager` + zlank.online builder (doc 505) | @Zaal | Skill update | When zlank build resumes |
| Memory note: TRAE SOLO = SKIP for ZAO/BCZ repos, OK for throwaway projects only | Claude | Memory | This session |
| Re-validate TRAE telemetry posture in 2026-Q3 (vendor may patch under regulatory pressure) | @Zaal / Claude | Audit | 2026-09 |

## Also See

- Doc 491 - QuadWork install three-repo split (current ZAO local agent stack)
- Doc 492 - QuadWork agentchattr pin-mismatch fix
- Doc 493 - Parallel terminals red-deploys action plan
- `.claude/rules/secret-hygiene.md` - five guards on agent commit pipelines
- Memory `feedback_prefer_claude_max_subscription` - prefer Claude Code on VPS over direct API
- Memory `feedback_workspace_worktrees` - never edit ZAO OS V1 root, always worktree
