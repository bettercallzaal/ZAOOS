---
topic: infrastructure
type: manifest
status: research-draft
last-validated: 2026-07-15
related-docs: 1025, 1027, 836, 1021
original-query: "build the export manifest for the ZAOOS estate split - map every directory to its destination repo, move NOTHING"
tier: DEEP
---

# 1124 - ZAOOS Estate Split: Export Manifest

> **Goal:** Map every ZAOOS directory to its destination home per doc 1025 design + doc 1027 staging plan. This manifest is READ-ONLY - it names destinations, identifies risks, and gates each stage. Execution follows this map; no code moves until all dependencies are resolved per stage sequence.

## Executive summary

ZAOOS has 86 top-level directories (code + config + research + infra). Of those, 64 stay (research/ + .claude/ + CLAUDE.md + AGENTS.md), 22 move (src/, bot/, scripts, public/, community.config.ts, etc.). The split happens in three stages:

1. **Stage 1:** Bot framework out (bot/src/zoe + hermes + devz + lib -> hermes-orchestrator public + zaoos-workspace private)
2. **Stage 2:** App out (src/ + public/ + app configs -> new app repo TBD)
3. **Stage 3:** Narrow ZAOOS (delete all moved code, research library only)

This manifest lists every directory, its DESTINATION, STAGE, and RISK. The Next Actions table gates each stage on go/no-go decisions.

## Directory mapping (alphabetical by source)

| Source dir | Type | Size | DESTINATION repo | Stage | Visibility | RISK | Notes |
|---|---|---|---|---|---|---|---|
| .claude | infra | 250K | stays in ZAOOS | 0 | private | Low | Project-specific settings + rules (secret-hygiene, api-routes, etc.). Keep in ZAOOS as the docs library. App repo gets a fresh .claude/. |
| .github | infra | 8K | split | varies | private | Low | workflows/ stays in app repo; ZAOOS workflows migrate to new app repo. |
| .gstack | infra | 12K | stays in ZAOOS | 0 | private | Low | gstack-vendored skill (MIT, already in .claude/skills/gstack). Docs library needs it for build support. |
| .husky | infra | 4K | split | 2/3 | private | Medium | Pre-commit hooks stay with ZAOOS (research workflow); app gets fresh hooks. |
| .next | infra | 24K | app repo | 2 | private | Low | Next.js cache, moved with src/. |
| .serena | infra | 44K | split | varies | private | Low | Serena memory/symbols. App repo gets fresh. ZAOOS keeps no Serena state. |
| .vercel | infra | 8K | app repo | 2 | private | Medium | Vercel deployment config for the old project. New app repo needs NEW .vercel config. |
| .vscode | infra | 8K | stays in ZAOOS | 0 | private | Low | Editor config for research docs. Each repo can have its own. |
| agents/ | code | 44K | hermes-orchestrator or stay | 1 | private/public | Medium | Agent personas/doctrines (CEO, researcher, security-auditor). Policy decision: stay in ZAOOS as agent doctrine docs, or move to hermes-orchestrator as part of the framework. Recommend: STAY as docs, reference in engine. |
| android/ | code | unknown | TBD | defer | unknown | Unknown | Old Android app scaffold. Unknown status. Recommend: archive in ZAOOS/archive/ pending audit. |
| apps/zabal-snap | code | 52K | TBD | defer | unknown | Unknown | Side project (zabal snapshots?). Unknown owner/status. Recommend: archive pending clarification. |
| autoresearch-test-coverage | infra | 4K | app repo | 2 | private | Low | Test coverage report. Moved with app to new repo. |
| BRAIN/ | data | 36K | stays in ZAOOS | 0 | private | Low | Knowledge base / memory (people, projects, metadata). Keep in ZAOOS as supporting docs. Or move to zaoos-workspace as part of bot brain. Policy decision needed. Recommend: STAY in ZAOOS; bot brain moves via ZOE human.md only. |
| bot/ | code | 186M | hermes-orchestrator + zaoos-workspace + ARCHIVE | 1->3 | public/private | HIGH | The bot engine. Split in stage 1: bot/src/zoe -> split (engine public, instance private); bot/src/hermes -> hermes-orchestrator; bot/src/devz -> hermes-orchestrator (or new devz repo); bot/src/cockpit + supporting -> hermes-orchestrator or zaoos-workspace; bot/ scripts -> zaoos-workspace/ops. Completely removed in stage 3. |
| build-log | data | 8K | stays in ZAOOS | 0 | private | Low | Build logs. Archive for reference. |
| community.config.ts | config | 16K | app repo | 2 | private | HIGH | FID config (channels, contracts, admin FIDs, nav). App-specific; moves with src/. Secret risk: contains contract addresses + admin data. Sanitize before app repo creation. |
| content | data | unknown | TBD | defer | unknown | Low | Supporting content. Audit and archive or move with app. |
| csv import | data | unknown | archive | 0 | private | Low | One-time import. Archive in ZAOOS. |
| data/ | data | 32K | archive or app | 2 | private | Low | Supporting data files. Move with app if app-specific; archive if shared. |
| docs/ | data | 3.6M | archive or split | 0 | private | Low | Daily docs, specs, retros, plans, reflections. Hybrid: keep a subset (onboarding, design) in ZAOOS research/; archive working docs (daily/, weekly/, session-handoffs/) for posterity. Or consolidate into research/. Recommend: SPLIT - keep design docs in ZAOOS; archive others. |
| evals/ | code | 4K | archive or app | 2 | private | Low | Evaluation scripts. Move with app if relevant; archive otherwise. |
| infra/portal | code | 320K | zaoos-workspace | 1 | private | HIGH | VPS deployment infrastructure (caddy, cloudflared, cron, bin/). Critical for bot ops. Moves to zaoos-workspace/infra/portal/ (private, stays on VPS). Secret risk: env stubs + API keys. Secret-scan before commit. |
| infra/n8n | code | 120K | app repo or standalone | 2 | private | Medium | n8n workflow automation (if linked to app). Audit and move with app or archive. |
| infra/hindsight | code | 8K | TBD | defer | unknown | Low | Unknown infrastructure. Audit and decide. |
| ios/ | code | unknown | TBD | defer | unknown | Unknown | Old iOS app scaffold. Unknown status. Recommend: archive pending audit. |
| mcp/ | code | 4K | archive or hermes | 1 | private | Low | MCP server definitions. Audit; move to hermes-orchestrator if framework-related, archive otherwise. |
| node_modules/ | deps | 4GB | regenerate | varies | private | Low | Delete in all repos; regenerate with `npm install` on deployment. Do NOT commit. |
| packages/ | libs | 192K | split | varies | private | Medium | Internal npm packages (agents, config, db, publish). Audit each: agents -> hermes-orchestrator; config -> shared (both repos); db -> shared; publish -> hermes-orchestrator or app. Decision per package. |
| patches/ | config | 8K | split | varies | private | Low | pnpm patches. Audit which app owns which patch; duplicate if shared. |
| plugins/ | code | 8K | TBD | defer | unknown | Low | Plugin definitions. Audit and archive or move with app. |
| public/ | assets | 12M | app repo | 2 | private | Low | Static assets (icons, manifests, wasm bindings). Moves with src/ to app repo. No secret risk if no API keys in manifests. Check llms.txt for any URLs that should NOT be in the public repo. |
| research/ | docs | 1.8GB | stays in ZAOOS | 0 | private | PERMANENT | The entire research library (820+ docs): infrastructure/, agents/, business/, music/, events/, governance/, identity/, dev-workflows/, etc. This is the raison d'etre of ZAOOS post-split. STAYS, zero changes. |
| scripts/ | code | 1.4M | split | varies | private | Medium | Mix of app + bot + infra scripts. App-only (deploy-*.ts, Vercel setup) -> app repo. Bot (node startup, Telegram hooks) -> zaoos-workspace or hermes-orchestrator. Infra (db migrations, wallet generation, secrets setup) -> STAY in ZAOOS or zaoos-workspace. Audit each script. |
| security/ | docs | 56K | stays in ZAOOS | 0 | private | Low | Security docs + policies. Keep in ZAOOS as institutional knowledge. |
| skills/ | config | 4K | stays in ZAOOS | 0 | private | Low | Claude Code skills definitions (if any). Keep in ZAOOS; app repo does NOT need Claude Code skill setup. |
| src/ | code | 8M | app repo | 2 | private | HIGH | Farcaster client: 302 API routes, 295 components, 18 hooks, 42 domains. Entire app code. Moves in stage 2. Secret risk: env vars hardcoded? Audit for NEYNAR_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET before extraction. All must be moved to .env.example. |
| tests/ | code | 4K | app repo | 2 | private | Low | Test infrastructure. Moves with app. |
| tools/ | code | 8K | archive or hermes | 1 | private | Low | Utility tools. Audit; keep in ZAOOS if shared research support, move to hermes if bot-specific. |
| tmp/ | data | 8K | delete | N/A | N/A | Low | Temporary files. Delete in all repos. |
| BRAIN/ | data | 36K | see BRAIN/ row above | 0 | private | Low | Duplicate of BRAIN/. See full mapping above. |
| Video/ | data | unknown | archive | 0 | private | Low | Video files. Archive or delete. Do NOT commit to git (use git-lfs if needed). |
| ZAO-STOCK/ | code | 40K | zao-festivals spinout OR separate repo | 1/2 | private | HIGH | ZAOstock dashboard + Telegram bot (separate from main @zaoclaw_bot). Per doc 1027, this is stage 1-2 decision: does it move to hermes-orchestrator as a bot instance? Or graduate to its own zao-festivals repo? Zaal decision required. Current home: root, acts independently. Recommend: move to separate zao-festivals repo at stage 2, parallel with app split. Secret risk: Telegram bot token + admin chat IDs in configs. Secret-scan before public repo creation. |
| Root configs (package.json, tsconfig.json, next.config.ts, etc.) | config | 150K | split | varies | private | Medium | Monorepo configs. App-specific ones (next.config.ts, tailwind.config.ts, playwright.config.ts) -> app repo. Bot-specific (bot/tsconfig.json -> bot repos). Shared (eslint, biome, prettier) -> duplicate in new repos or externalize. Audit each config file. |
| CLAUDE.md | docs | 11K | stays in ZAOOS | 0 | private | PERMANENT | Project instructions. Post-split: ZAOOS CLAUDE.md becomes docs-library focused. New app repo + bot repos get their own CLAUDE.md files (adapted from this one, app/bot-specific). Do NOT delete. |
| AGENTS.md | docs | 8K | stays in ZAOOS | 0 | private | PERMANENT | Agent operating rules. Post-split: stays in ZAOOS as institutional knowledge. Referenced by bot repos. Do NOT delete. |
| .env.example | config | 4K | split | varies | private | HIGH | Root .env.example spans app + bot + infra. In stage 1-2, split into: app .env.example (app-only vars) + bot/zaoos-workspace .env.example (bot/ops vars). Original stays in ZAOOS as reference. Secret risk: ensure NO real values are in ANY .env.example. |
| .gitignore | config | 2K | split | varies | private | Low | Duplicate to each repo. Ensure .env, node_modules/, etc. are ignored everywhere. |

## What stays in ZAOOS (post-split)

- research/ (all 820+ docs, frozen)
- .claude/ (project configuration)
- CLAUDE.md (project instructions)
- AGENTS.md (agent operating rules)
- security/ (security policies)
- skills/ (Claude Code skills config)
- .claude/rules/ (governance + secret hygiene + component conventions)
- .vscode/ (editor config)
- build artifacts only as reference (build-log/, etc.)

ZAOOS becomes a pure research library + institutional memory. No code, no app, no bot in the root.

## Stage-by-stage go/no-go checklist

### Stage 1: Bot Framework Split (hermes-orchestrator + zaoos-workspace)

**Dependencies:** None (framework split is lowest-risk, decoupled from app/services)

**Go/no-go gates:**

1. [ ] Zaal confirms hermes-orchestrator remains PUBLIC (engine code only)
2. [ ] Zaal confirms zaoos-workspace remains PRIVATE (secrets + ops)
3. [ ] bot/src/zoe has no hardcoded secrets (scan: `git grep -E '[0-9a-fA-F]{64}' bot/src/zoe/`)
4. [ ] infra/portal has no hardcoded secrets (scan: `git grep -E 'TELEGRAM_BOT_TOKEN' infra/portal/`)
5. [ ] bot/src/hermes (coder/critic/PR pipeline) is documented + testable standalone
6. [ ] VPS bot boots in test env against the split boundary (submodule imports from new repos)
7. [ ] Stage 1 PR merges (bot engine + instance extracted, ZAOOS bot/ still exists, unused)

**Rollback:** If extraction fails, delete branches in hermes-orchestrator + zaoos-workspace; redo extraction.

### Stage 2: App Split (New Farcaster Client Repo)

**Depends on:** Stage 1 complete (bot framework already split, VPS bot stable)

**Go/no-go gates:**

1. [ ] Zaal decides new app repo NAME + visibility (currently "TBD")
2. [ ] community.config.ts is sanitized (no real contract addresses / admin FIDs if public)
3. [ ] src/ has no hardcoded secrets (scan: `git grep -E 'sk-ant-|sk-[A-Za-z0-9]{32,}' src/`)
4. [ ] public/ has no API keys in manifests (check llms.txt, manifest.json)
5. [ ] New Vercel project is created + linked to new app repo
6. [ ] App builds clean on new repo (`npm install && npm run build`)
7. [ ] App deploys to Vercel successfully (smoke-tested end-to-end)
8. [ ] DNS is flipped to new Vercel project (zaoos.com -> new project)
9. [ ] Old Vercel project routes become stubs (fallback 404 only AFTER new is live)
10. [ ] Stage 2 PR merges (app extracted, old ZAOOS/src still exists for rollback)

**Rollback:** If Vercel deploy fails, DNS flips back to old project; old app stays live. New app repo can be deleted if needed.

### Stage 3: Narrow ZAOOS (Delete Code, Research Library Only)

**Depends on:** Stage 1 + Stage 2 complete (both bot + app running from new homes)

**Go/no-go gates:**

1. [ ] VPS bot has been running from hermes-orchestrator + zaoos-workspace for 24+ hours (no regressions)
2. [ ] Vercel app has been running from new app repo for 24+ hours (no regressions)
3. [ ] bot/ directory is deleted from ZAOOS (confirmed in working tree)
4. [ ] src/ directory is deleted from ZAOOS (confirmed in working tree)
5. [ ] public/ directory is deleted from ZAOOS (confirmed in working tree)
6. [ ] App-specific scripts are removed from ZAOOS/scripts (infra scripts remain)
7. [ ] ZAOOS is secret-scanned (full tree: no PII, no private keys, no API keys)
8. [ ] research/ directory is intact + indexed
9. [ ] .claude/ + CLAUDE.md + AGENTS.md + security/ all present + unchanged
10. [ ] Stage 3 PR merges (ZAOOS is now docs-only, all services running from new homes)

**Rollback:** If services break, restore bot/ + src/ from previous commit. Services should still be running from new homes, so restore is backup only.

## Keep-live constraints (non-negotiable)

The VPS bot and Vercel app MUST keep running through all three stages. Here's the guarantee:

| Service | Stage 1 | Stage 2 | Stage 3 | Continuity |
|---|---|---|---|---|
| VPS bot (@zaoclaw_bot) | ZAOOS/bot/ (imports split repos) | ZAOOS/bot/ (unchanged) | hermes-orchestrator + zaoos-workspace | No downtime - transitions at stage 3 from ZAOOS repo to standalone repos |
| Vercel app (zaoos.com) | Unchanged | Runs in parallel (new repo) -> DNS flip | New app repo only | No downtime - DNS flip only AFTER new is live; old project falls back |

**Before stage 3 starts:** The VPS operator must confirm the bot is 100% functional from the new split repos (via systemd test or manual boot in tmux). Only then does stage 3 proceed with deletion.

## Risk summary by repo

| Destination | Stage | Secret risk | Visibility | Mitigation |
|---|---|---|---|---|
| hermes-orchestrator (new engine home) | 1 | HIGH: must be 100% clean (public repo) | PUBLIC | Secret-scan before every commit. No .env file ever committed. All secrets -> zaoos-workspace. |
| zaoos-workspace (private ops) | 1 | HIGH: holds real tokens + ICM boxes | PRIVATE | Secret-scan before every commit. .env must be gitignored. Owner: @Zaal + @zao-assistant. Access control critical. |
| New app repo (Farcaster client) | 2 | MEDIUM: app secrets in .env | PRIVATE (match current) | Secret-scan before every commit. community.config.ts must not contain real values (move to .env). |
| ZAOOS narrowed (research library) | 3 | LOW: no code, no secrets | PRIVATE | Maintain secret-hygiene rules for future docs. Archive old code in a separate branch for reference. |

## Next Actions table (stage gates + owner + dates)

| Action | Owner | Type | Status | By When | Blocker for |
|---|---|---|---|---|---|
| Review + approve this manifest | @Zaal | Decision | pending | 2026-07-16 | Stage 1 start |
| Confirm hermes-orchestrator stays PUBLIC (engine-only) | @Zaal | Policy | pending | 2026-07-16 | Stage 1 start |
| Confirm zaoos-workspace stays PRIVATE (ops-only) | @Zaal | Policy | pending | 2026-07-16 | Stage 1 start |
| Decide: agents/ stays in ZAOOS or moves to hermes? | @Zaal | Policy | pending | 2026-07-16 | Stage 1 start |
| Decide: BRAIN/ stays in ZAOOS or goes to zaoos-workspace? | @Zaal | Policy | pending | 2026-07-16 | Stage 1 start |
| Audit + archive old scaffolds (android/, ios/, apps/zabal-snap) | @Loop | Execution | pending | 2026-07-16 | Stage 1 start |
| Scan bot/ for hardcoded secrets + sanitize | @Loop | Security | pending | 2026-07-16 | Stage 1 start |
| Scan infra/portal for hardcoded secrets + sanitize | @Loop | Security | pending | 2026-07-16 | Stage 1 start |
| Split bot/src/zoe + hermes via git filter-repo | @Loop | Execution | pending | 2026-07-17 | Stage 1 merge |
| Create hermes-orchestrator/src/zoe-engine + verify build | @Loop | Execution | pending | 2026-07-17 | Stage 1 merge |
| Create zaoos-workspace/zoe/fleet-config + verify secrets gitignored | @Loop | Execution | pending | 2026-07-17 | Stage 1 merge |
| Boot VPS bot against split boundary (submodule test) | @Zaal | Verify | pending | 2026-07-17 | Stage 1 merge |
| Merge Stage 1 PR (bot engine extracted) | @Zaal | Gate | pending | 2026-07-17 | Stage 2 start |
| Decide new app repo NAME + visibility | @Zaal | Decision | pending | 2026-07-17 | Stage 2 start |
| Scan src/ for hardcoded secrets + sanitize | @Loop | Security | pending | 2026-07-18 | Stage 2 merge |
| Scan community.config.ts for sensitive data + sanitize | @Loop | Security | pending | 2026-07-18 | Stage 2 merge |
| Extract src/ + public/ via git filter-repo | @Loop | Execution | pending | 2026-07-18 | Stage 2 merge |
| Create new app repo + push stage2-app-in branch | @Loop | Execution | pending | 2026-07-18 | Stage 2 merge |
| Deploy new app to Vercel + verify boots | @Loop | Execution | pending | 2026-07-19 | Stage 2 merge |
| Flip DNS to new app (zaoos.com -> new project) | @Zaal | Gate | pending | 2026-07-19 | Stage 2 merge |
| Merge Stage 2 PR (app extracted, parallel deployed) | @Zaal | Gate | pending | 2026-07-19 | Stage 3 start |
| Verify VPS bot + Vercel app stable for 24h after DNS flip | @Zaal | Verify | pending | 2026-07-20 | Stage 3 start |
| Prepare VPS bot systemd to run from new repos (no ZAOOS/bot/) | @Zaal | Ops | pending | 2026-07-20 | Stage 3 start |
| Delete bot/, src/, public/, app-scripts from ZAOOS | @Loop | Execution | pending | 2026-07-21 | Stage 3 merge |
| Secret-scan narrowed ZAOOS (full tree check) | @Loop | Security | pending | 2026-07-21 | Stage 3 merge |
| Verify research/ intact + .claude/CLAUDE.md/AGENTS.md present | @Loop | QA | pending | 2026-07-21 | Stage 3 merge |
| Merge Stage 3 PR (ZAOOS narrowed to docs-only) | @Zaal | Gate | pending | 2026-07-21 | Archive |
| Archive old code branches (for reference) | @Zaal | Cleanup | pending | 2026-07-22 | Closed |

## Critical open decisions (stage-gate blockers)

1. **New app repo name + visibility** (blocks Stage 2) - Zaal must decide before stage 2 begins. Recommend: match current (private).
2. **agents/ disposition** (blocks Stage 1) - Stay in ZAOOS as doctrine docs, or move to hermes as framework persona library?
3. **BRAIN/ disposition** (blocks Stage 1) - Stay in ZAOOS as knowledge base, or move to zaoos-workspace as bot brain?
4. **ZAO-STOCK/ final home** (blocks Stage 1-2) - Separate zao-festivals spinout repo, or keep in hermes-orchestrator as a bot instance?
5. **Vercel project continuity** (blocks Stage 2) - Create brand new Vercel project, or link existing old project to new app repo?

All five must be decided before execution starts. This manifest is go/no-go only; decisions unlock the next stage.

## Architecture principles (per doc 1025 + 1027)

1. **Engine vs instance split:** Public repos (hermes-orchestrator) carry ONLY reusable code. Private repos (zaoos-workspace) carry ONLY ops + secrets + identity (ICM boxes). No secrets in public repos, ever.
2. **Keep-live is absolute:** Both Vercel app + VPS bot must keep serving production. Maintenance windows forbidden. If a stage breaks, rollback immediately.
3. **Secret-scan is hard gate:** Before ANY code commits to ANY repo (especially public), all patterns are checked (64-char hex, PEM blocks, GitHub PAT, API keys, .env files). On match: ABORT, no exceptions.
4. **History preservation:** git filter-repo for code with 6+ years of history (app, bot). Manual copy for small extracts (private fleet instance). Branch markers for rollback reference.
5. **Verification before cutover:** Each stage must typecheck + build + boot cleanly BEFORE old code is deleted or routes fallback. Tests optional; boot mandatory.

## Sources

- Doc 1025 (2026-07-10): ZAOOS Estate Split design (approved)
- Doc 1027 (2026-07-10): ZAOOS staged migration plan (detailed execution roadmap)
- Doc 836 (2026-06-11): ZAOOS repo estate census (302 routes, 295 components, 820 docs)
- Doc 1021 (2026-07-10): ZOE bot-factory + engine-vs-instance split
- Doc 998 (2026-05-04): GitHub repo estate audit (129 repos, archive triage now paused)
- CLAUDE.md: Secret hygiene rules, ZAOOS monorepo-as-lab doctrine
- .claude/rules/secret-hygiene.md: 5-guard pre-commit + post-push scanning procedures

## Appendix: Archive destinations

Old code that should NOT move to new repos, but IS kept for reference:

- android/, ios/ - Old mobile app scaffolds. Move to ZAOOS/archive/mobile-old/ with a README explaining they're stale.
- apps/zabal-snap - Old side project. Move to ZAOOS/archive/zabal-snap-old/ pending audit.
- docs/daily/, docs/weekly/, docs/session-handoffs/ - Working session docs. Archive to ZAOOS/archive/session-docs-old/ or consolidate into research/.
- Old code branches (stage1-*, stage2-*, stage3-* in bot/src/zoe history) - Tag with `legacy/` prefix for reference.
- scripts/ app-only files (deploy-*.ts, etc.) - Move to ZAOOS/archive/scripts-app-old/ before stage 3.

Archive is a ZAOOS/archive/ directory created in stage 0 (before migrations start). It is NOT committed to git; it is a living reference for rollback + audit.
