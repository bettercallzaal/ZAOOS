---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-31
related-docs: 684, 685, 461, 529, 601, 790, 412, 699d
original-query: "https://github.com/idolaman/galactic and https://github.com/slikk66/dangeresque and then look at all my research docs and all the original links and figure out if we are missing information we should be storing"
tier: DEEP
---

# 793 - Parallel Claude Code Fleet Tooling (galactic + dangeresque) + Research-Library Gap Audit

> **Goal:** Capture the current state of two parallel-agent tools (galactic, dangeresque), position them against ZAO's existing stack (Hermes, fix-PR pipeline, worksession worktrees), and surface what information the 805-doc research library is NOT storing but should be.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | STORE a dedicated doc on Anthropic's container + subscription-key usage policy | dangeresque cites it as its whole design rationale ("usage policy now restricts running Claude Code in containers with subscription keys"). ZAO hosts agents on a VPS and ran openclaw in Docker - this policy directly governs ZAO's agent-hosting strategy and is captured nowhere. Highest-value gap. |
| 2 | STEAL dangeresque's run-artifact discipline into Hermes | Gitignored `.dangeresque/runs/`, INVESTIGATE-before-IMPLEMENT mandatory research artifact, adversarial reviewer appends verdict to the *same* file, issue comment carries only the SUMMARY block (never the full body, never PII). This is a cleaner shape than Hermes' current pre-critic gates (doc 529) and aligns with ZAO's PII-hygiene rule. |
| 3 | EVALUATE galactic's Project Services branch-routing for ZAO's multi-terminal workflow | ZAO runs many parallel `ws/` terminals (CLAUDE.md: "each terminal gets its own ws/ branch"). galactic solves the `localhost:3000` collision with `service.branch.project.localhost:1355` routing + terminal auto-env. No ZAO doc captures this pattern. macOS-only, AGPL - evaluate the pattern, not necessarily the app. |
| 4 | KEEP Hermes as ZAO's canonical agent framework - do NOT adopt galactic or dangeresque wholesale | Hermes is locked as THE agent framework (memory: project_hermes_canonical). galactic is a macOS desktop GUI (wrong surface for a VPS-hosted fleet); dangeresque is a thin local CLI wrapper. Both are pattern donors, not replacements. |
| 5 | BACKFILL research-library provenance metadata | 164 of 805 non-archive docs lack `original-query`; 78 lack `last-validated`; 184 lack frontmatter entirely. `original-query` is the field that lets any future session re-run a doc's research from seed - missing it breaks the whole re-research model. |

## The Two Repos (current state, fetched 2026-05-31)

### galactic (idolaman/galactic) - 190 stars, AGPL-3.0, TypeScript/Electron, macOS-only

A native macOS desktop command center for running branch workspaces, services, and AI agents side by side. Pushed 2026-05-30 (active). Source repo is actually `idolaman/galactic-ide`; site at galactic-dev.com.

Four capabilities:

1. **Project Services** (the headline workflow) - define a project's services once, then run the same stack across multiple branch worktrees without fighting over one `localhost`. Each service gets a predictable route: `client.add-labels-feature.task-manager.localhost:1355`. A local proxy on `:1355` routes `service.branch.project.localhost:1355` -> `127.0.0.1:<port>`, including WebSocket traffic. A managed zsh hook (Terminal Auto-Env) exports the right `HOST`/`PORT` when you `cd` into a service folder, so plain `npm run dev` binds the workspace-specific port. Handles Next.js, Express, Nuxt, Vite, Astro, React Router, Angular, Expo, React Native, SvelteKit. Services can declare cross-service env vars (`API_URL=http://api.feature-auth.shop.localhost:1355`), including cross-project.
2. **Git Worktrees** - one-click isolated worktree per branch, each with its own `.code-workspace`, optional config inheritance from main.
3. **AI Agent Monitoring (MCP)** - runs an MCP server that connects to Cursor/VS Code/Claude/Codex; shows active agent sessions in one place; notifies when a session finishes, stalls, or needs attention.
4. **Quick Launcher** - Cmd+Shift+G global hotkey floating sidebar over all projects/workspaces/sessions.

### dangeresque (slikk66/dangeresque) - 23 stars, MIT, TypeScript, Node>=22 CLI

Run Claude Code or Codex AFK (away-from-keyboard) in isolated git worktrees with structured multi-phase passes, automatic adversarial review, and mandatory human merge. Pushed 2026-05-13. Much richer than the QUICK-tier capture in doc 684 (2026-05-20 captured it as a one-line "thin wrapper").

The pipeline: **Worker pass** (worktree) -> **Verify hook** (compile/test/lint, block-on-failure) -> **Review pass** (adversarial, same worktree) -> **human merge**.

- **Worker** runs the engine headlessly in an isolated worktree with system prompt + GitHub Issue context, writing a run result to `.dangeresque/runs/issue-<N>/<timestamp>-<MODE>.md`. Runs dir is **gitignored** - artifacts never enter git history.
- **Verify hook** (optional, per-project) runs compile/test/lint post-rebase, pre-review; block-style failure skips review and fails the run. Results land in the artifact's `<!-- SUMMARY -->` block + a `## Verification` section.
- **Reviewer** runs a second session in the same worktree with an adversarial prompt, checks the actual `git diff` against the worker's claims, appends its verdict to the run file.
- **Issue comment** carries only the `<!-- SUMMARY -->` block + local path - never the full body. Artifact stays on disk (`dangeresque results --issue <N>`).
- **On merge**, the gitignored artifact is mirrored from worktree back to project root before teardown; next dispatch for the same issue mirrors prior artifacts back in so the worker can cite them.
- **Mandatory INVESTIGATE -> IMPLEMENT**: every issue starts with INVESTIGATE (even one-liners) to verify the hypothesis and land a research artifact the IMPLEMENT pass can cite. Push main after every merge before next dispatch.
- **Engines**: `claude` (default, native session tracking) or `codex` (`codex exec --json --full-auto`), swappable per-project (`config.json`) or per-run (`DANGERESQUE_ENGINE=codex`).
- **Scope control**: declared scope block in the issue (operator allow/deny globs) + worker-written per-file scope declaration; drive-by fixes bounded by `maxFiles`/`maxLines`/`denyGlobs`.
- **Design rationale (Why Host-Native)**: Anthropic's usage policy restricts running Claude Code in containers with subscription keys, and containers break MCP + host-binary access (Unity, Chrome automation, local DBs, `gh`, runtimes) regardless of engine. Worktree isolation + adversarial reviewer + mandatory human merge replace container sandboxing.

## How they map to ZAO's stack

| ZAO has | galactic equivalent | dangeresque equivalent | Verdict |
|---------|--------------------|-----------------------|---------|
| `worksession` skill (worktree per `ws/` branch) | Git Worktrees (GUI) | worktree-per-issue (CLI) | ZAO already worktree-isolates; galactic adds service routing, dangeresque adds AFK dispatch |
| Hermes fix-PR pipeline (coder + critic + auto-PR, doc 461/529) | - | Worker + adversarial Reviewer + human merge | dangeresque's gitignored-runs + issue-SUMMARY-only is a cleaner artifact shape - STEAL |
| QuadWork local dashboard (doc 497, http://127.0.0.1:8400) | MCP agent monitoring | `dangeresque results` | overlapping; galactic's cross-editor MCP watch is broader |
| Many parallel `ws/` terminals on one mac | Project Services branch routing | - | GAP - no ZAO doc on parallel-dev local-domain routing |
| `/investigate` + `/zao-research` (artifact-first) | - | mandatory INVESTIGATE artifact gating | dangeresque enforces it as a pipeline gate; ZAO relies on discipline |
| safe-git-push + branch protection (doc 554) | - | mandatory human merge, no code touches main | same philosophy |

## Research-Library Gap Audit (the "what are we missing" half)

Method: grepped all non-archive `research/**/README.md` (805 docs) for coverage of the patterns these two repos surface, plus metadata-completeness counts. Findings:

### Content gaps (information we should be storing but aren't)

1. **Anthropic container + subscription-key usage policy** - NO dedicated doc. The matches for "usage policy" were generic false-positives in unrelated docs (227, 135, 065, 305, 098, 338). This is the single fact that decides whether ZAO can keep running agents in Docker on the VPS with a subscription key vs needing API keys. dangeresque reorganized its entire architecture around it. ZAO killed openclaw's container squad (doc 601) for other reasons but never recorded the policy constraint. STORE: a `security/` or `infrastructure/` doc capturing the current Anthropic ToS on headless/container/subscription usage, with last-validated and a re-check cadence (high-churn).
2. **Parallel-dev local-domain routing** - NO doc captures the `service.branch.project.localhost` + local-proxy + terminal-auto-env pattern. ZAO's multi-terminal `ws/` workflow hits exactly the `localhost:3000` collision galactic solves. The grep hits (345, 453, 524, 483, 733, 326, 430, 417, 463) are loose matches about remote agent access / websockets, not this pattern. STORE: a dev-workflows pattern doc, or adopt galactic and document the setup.
3. **AFK / headless dispatch run-artifact discipline** - partially covered (Hermes docs 461/529, QuadWork 497) but the specific gitignored-runs + issue-SUMMARY-only + reviewer-appends-to-same-file shape is not captured as a reusable pattern. STORE: fold into the Hermes architecture doc as a "steal-this" pattern.

### Metadata / provenance gaps (hygiene)

| Field | Coverage | Missing | Why it matters |
|-------|----------|---------|----------------|
| `original-query` | 641 / 805 | 164 | The seed that lets a future session re-run the research (Hard Req #12). Missing = doc cannot be faithfully re-researched. |
| `last-validated` | 727 / 805 | 78 | The staleness SLA. Missing = no signal when a doc went stale. |
| frontmatter (any) | 621 / 805 | 184 | 184 docs have no YAML block at all - many are hub child-docs / index files, but some are real docs predating the v2 standard. |

The 184 no-frontmatter count overlaps with hub sub-docs (e.g. `591a-e`) and index READMEs that legitimately need none, so the true backfill target is smaller - but the 164 missing `original-query` on otherwise-structured docs is a clean backfill candidate.

## Staleness Notes

- Star counts captured 2026-05-31: galactic 190, dangeresque 23. These drift.
- galactic pushed 2026-05-30, dangeresque 2026-05-13 - both active.
- The Anthropic container/subscription-key policy is the highest-churn fact here. dangeresque's README states it as current; verify against docs.anthropic.com/en/docs/claude-code/overview before acting on it. Captured second-hand from dangeresque's README, NOT verified against the primary Anthropic ToS in this pass - flagged as Decision #1 to store + verify.
- Doc 684 (2026-05-20, QUICK) captured dangeresque as a one-line wrapper; this doc supersedes that characterization. 684's QuadWork-vs-dangeresque comparison stands.

## Sources

- [idolaman/galactic README](https://github.com/idolaman/galactic) `[FULL]` - README fetched via gh API, fully read
- [slikk66/dangeresque README](https://github.com/slikk66/dangeresque) `[FULL]` - README fetched via gh API, fully read; linked `docs/` deep-refs (WORKFLOW/SCOPE/CONFIGURATION/PERMISSIONS/SCHEMA/DESIGN) summarized from the README, not individually fetched
- [r/ClaudeCode "Claude Code agent dispatcher!"](https://www.reddit.com/r/ClaudeCode/comments/1tiopk3/claude_code_agent_dispatcher/) `[PARTIAL]` - carried over from doc 684; not re-fetched this pass
- Anthropic usage policy (container + subscription keys) `[FAILED - not fetched]` - cited second-hand by dangeresque's README only; Decision #1 is to fetch + store the primary source
- ZAO research library: 805 non-archive `research/**/README.md` `[FULL]` - grepped + counted directly (primary source)
- ZAO codebase: `CLAUDE.md` (ws/ branch-per-terminal), `worksession` skill, Hermes docs 461/529/601, QuadWork doc 497 `[FULL]`

## Also See

- [Doc 684](../684-claude-code-agent-dispatch-parallelization/) - prior QUICK capture of dangeresque + QuadWork (this doc supersedes its dangeresque characterization)
- [Doc 685](../685-code-on-incus-agent-sandbox/) - Incus sandboxing layer (the container path the Anthropic policy bears on)
- [Doc 529](../../agents/529-hermes-quality-pipeline-pre-critic-gates/) - Hermes pre-critic gates (the pattern dangeresque's reviewer maps to)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - openclaw container squad decommission
- [Doc 790](../790-agentic-coding-workflows-claudemd-swarms-vibecoding/) - adjacent agentic-workflows capture from this inbox drain

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fetch + store Anthropic container/subscription-key usage policy as a security doc, set high-churn re-validate cadence | @Zaal | Research doc | Next session |
| Scope dangeresque's gitignored-runs + issue-SUMMARY-only artifact pattern as a Hermes upgrade | @Zaal | Decision | Next Hermes iteration |
| Evaluate galactic Project Services routing for the multi-terminal ws/ workflow (pattern only - macOS/AGPL app) | @Zaal | Spike | Backlog |
| Backfill `original-query` on the 164 docs missing it (start with high-traffic dev-workflows + agents folders) | @Claude | Bot task | Batch campaign |
| Verify doc 684's `original-query` exists and cross-link 793 | @Claude | Edit | This session |
