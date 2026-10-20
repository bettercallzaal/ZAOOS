---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-10-20
superseded-by:
related-docs: infrastructure/2691-zaoos-graduation-map-2026-10, infrastructure/836-zaoos-repo-estate-census, agents/2541-one-agent-or-many-bots, farcaster/2684-zao-xmtp-standalone-app
original-query: "Let's spend more time on this move it to a new lane zaoos and let's just do deep research on the zaoos repo" (Zaal, 2026-10-20)
tier: DEEP
---

# 2692 - ZAOOS, measured top to bottom: what holds each piece in, and the simple ZAOOS

> **Goal:** Give Zaal the evidence to decide what ZAOOS becomes. He has already said "keep ZAOOS as simple as possible", "unused code goes to private `bettercallzaal/zaoostest`", "finish zao-app", and "hold the 21 ZAOresearch docs until 2026-11-03" (vault decision note `grill-2026-10-20-seat-afternoon`). This doc measures what is left and settles the three open calls from [doc 2691](../2691-zaoos-graduation-map-2026-10/): `ZAO-STOCK/`, ZOE and the bot, and streaming. Research only: nothing is moved, deleted or created here. Wave 1 (the move to zaoostest) is the zaoos-split lane's and is not repeated.

All repo measurements: `origin/main` at `5c13b4e49`, 2026-10-20 between 14:00 and 14:40 EDT, with `git ls-tree`, `git log`, `git grep` and two small scripts named in the Method section. VPS measurements: `ssh vps`, read-only, 2026-10-20 18:35 UTC. No install, build or test was run.

## Key Decisions (recommendation first)

| # | Decision | Recommendation | Why, in one line | Who |
|---|---|---|---|---|
| 1 | Stop ZAOOS merges restarting ZOE | **Install the repo's v4 `zoe-autodeploy.sh` on the VPS and set `ZOE_AUTODEPLOY_SKIP_NONBOT=1`.** | ZOE restarted 22 times across the 23 main merges since 2026-10-19 00:00 UTC, research-only merges included, because the VPS runs a 2026-09-17 copy of the script that predates the skip. | Zaal (live deploy path) |
| 2 | `ZAO-STOCK/` (28 files) | **A: move to `ZAODEVZ/ZAOstock` under `docs/archive/zaoos-planning/`, history kept.** | The festival ran on 2026-10-03; the app already lives there; nothing imports the folder; two skill lines are the only path references. | Zaal says yes, agent does it |
| 3 | ZOE and the bot (`bot/`, 604 files) | **A: stay for now, and cut four couplings first; graduate to its own repo after.** | The bot's code reaches outside `bot/` only into `packages/heart-fleet` (7 files), but the deploy pulls ZAOOS `main` and four runtime paths read `research/`. | Agent cuts couplings by PR; the move and the new repo are Zaal's |
| 4 | Streaming cluster (198 files) | **A: freeze it into zaoostest in the PR that removes the v1 client, after the zaoos.com flip.** | Five pages answer 200 on zaoos.com today and a Vercel cron (`juke-stale-rooms`) runs from `vercel.json`; moving it earlier breaks live routes. | After Zaal's flip |
| 5 | Archive code that nothing runs (`scripts/archive`, `scripts/stock-archive`, `docs/superpowers`, dead turbo/pnpm config) | **Wave 2 to zaoostest, one PR per group, after an importer pass.** | 264 files with 0 commits in 60 days; turbo is not a dependency, so the `turbo:*` scripts cannot run. | Agent (PR), Zaal merges |
| 6 | End state | **ZAOOS = `research/` + `.claude/` + the research CI and its scripts + root policy docs.** Everything else is a product repo or zaoostest. | Research is 3,204 of 7,363 files and 473 of the 783 commits in 60 days. | Zaal approves the end state; steps below |

## 1. Inventory, every top-level entry

Columns: tracked files, bytes, commits since 2026-08-21 (60 days), last real commit (the two bulk commits `fa92d8356` biome autoformat, 988 files, and `a0f86aa5d` research reorganisation, 329 files, are excluded because they would date every directory). "Users" is what reads the path, from `git grep`, CI workflow files, `vercel.json`, the VPS units and crontab. "Live" means a production surface runs from it today.

Repo total: **7,363 files, 99.8 MB, 783 commits in 60 days.**

### Product and code directories

| Path | Files | 60d | Last real commit | Users | Live? | Fate |
|---|---|---|---|---|---|---|
| `research/` | 3,204 | 473 | 2026-10-20 | Library; research CI (doc-collision, research-index, docs-automerge, claims); ZOE reads it (section 2) | Yes (public library) | **Stays** |
| `src/` | 1,682 | 28 | 2026-10-20 (cards #4047) | zaoos.com via Vercel; `ci.yml` test + build; `scripts/vercel-ignore.sh` BUILD_PATHS | **Yes**: zaoos.com `server: Vercel`, `x-vercel-id` present | Leaves after the flip (2691 item 2) |
| `bot/` | 604 | 151 | 2026-10-20 | VPS `zoe-bot` and `zao-devz-stack` units run from `/home/zaal/zao-bot-live/bot`; `ci.yml` bot-test | **Yes** | Decision 3 |
| `docs/` | 732 | 55 | 2026-10-20 | `docs/daily` (566 files, 53 commits) is written nightly by a cloud scheduled session (`nightly-check.yml:5`: "a cloud scheduled session whose prompt is not in this repo") | Yes (nightly) | `daily`, `weekly`, `daily-briefs` stay; `superpowers` (100, 0 commits) wave 2 |
| `scripts/` | 341 | 43 | 2026-10-20 | CI (`doc-new-claims.sh`, `backfill-research-index.sh`, `check-research-index.sh`, `ci-on-main.sh`, `vercel-ignore.sh`, `zoe/nightly-check.mjs`); ZOE autodeploy | Partly | Split: 129 in `archive/` and 35 in `stock-archive/` go to zaoostest; research CI scripts stay; bot scripts go with the bot |
| `.claude/` | 370 | 33 | 2026-10-18 | Every session in ZAOOS loads the rules; vendored gstack and project skills | Yes | **Stays** |
| `.github/` | 10 | 13 | 2026-10-20 | 9 workflows (section 3) | Yes | Stays; shrinks as code leaves |
| `packages/` | 49 | 0 | 2026-08-04 | `heart-fleet` (11 files): 7 bot files, 4 `src/lib/heart` files. The other four packages: 0 importers (2691 wave 1) | heart-fleet yes | Wave 1 takes four; heart-fleet goes to `bot/` (Decision 3) |
| `infra/` | 60 | 6 | 2026-10-08 | `infra/bus` runs as VPS `zao-bus` unit, tested in `ci.yml:133`; `infra/vps` read by `bot/src/hermes/claude-health.ts`; `infra/portal` 38 files, 0 commits | bus yes | Travels with the bot |
| `ZAO-STOCK/` | 28 | 1 | 2026-09-09 (claims guard touch) | 2 skill lines (`zao-stock.md:128`, `onepager/SKILL.md:120`), 2 archived SQL files; 0 code imports | No | Decision 2 |
| `tools/` | 24 | 1 | 2026-09-12 | `ci.yml:117`, `estate-health.yml:32,77` | Weekly CI | Stays while those workflows stay |
| `agents/` | 11 | 1 | 2026-09-11 | `scripts/autopilot/doors.json` lines 5, 173; `scripts/agents/zoe-drift.py` lines 104, 114 (2691) | Indirect | Wave 2 with those edits, or with the bot |
| `android/`, `ios/`, `apps/zabal-snap`, `plugins/`, `mcp/`, `evals/`, `.superpowers/`, `tmp/`, `data/`, `security/`, `skills/`, `build-log/`, `autoresearch-test-coverage/`, `infra/hindsight`, `infra/n8n` | 195 | 0 | 2026-03 to 2026-06 | 0 importers outside themselves (2691 rev 2) | No | **Wave 1**, in `zaoostest` at `44e2fee3`; removal waits on Zaal's keystroke |
| `BRAIN/` | 7 | 0 | 2026-05-21 | `scripts/zoe-learning-pings/random_tip.py` globs it (2691) | Indirect | Wave 2 with the glob edit |
| `content/` | 4 | 0 | 2026-05-06 | Meeting-skill note only | No | Wave 2 |
| `csv import/` | 6 | 0 | 2026-03-22 | 2 prose mentions inside `ZAO-STOCK/research` | No | Wave 2 |
| `public/` | 18 | 0 | 2026-07-25 | zaoos.com static assets (`vercel-ignore.sh` BUILD_PATHS) | Yes | Leaves with `src/` |
| `tenants/` | 2 | 0 | 2026-08-03 | 3 test files in `src/lib/dreamnet/tenant` | No | Leaves with `src/` |
| `tests/` | 4 | 0 | 2026-03-30 | `playwright.config.ts` | No | Leaves with `src/` |
| `deploy/` | 5 | 1 | 2026-09-03 | Pi deploy (`deploy/pi`), references heart-fleet | Unmeasured | Travels with the bot |

### Root files and dot-directories

| Path | Users | Fate |
|---|---|---|
| `README.md`, `CLAUDE.md`, `AGENTS.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `RESEARCH.md` | Front door and policy; `RESEARCH.md` cited by 2 zao-research skill files | Stay, rewritten to the new scope |
| `.claims-public/` | `~/bin/zao-claims-check` and `claims-check.yml:61` (installs it from `research/identity/claims/`) | Stays |
| `.husky/`, `.gitattributes`, `.gitignore`, `.claudeignore`, `.serena/`, `.agents/` | Pre-commit gates; `merge=union` for research; tool config | Stay |
| `.handoffs/` | `bot/src/cockpit/brief.ts`, `cockpit.ts`, the handoff skill | Stays until the bot leaves |
| `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `instrumentation*.ts`, `sentry.*`, `vercel.json`, `.npmrc`, `.nvmrc`, `.vercel-trigger`, `community.config.ts`, `playwright.config.ts`, `vitest.config.mts`, `biome.json`, `eslint.config.mjs`, `patches/`, `package.json`, `package-lock.json` | The Next.js app and its CI | Leave with `src/`, except a slim `package.json` for whatever research tooling still needs Node |
| `turbo.json`, `pnpm-workspace.yaml` | **Nothing.** `package.json` has `turbo:dev`, `turbo:build`, `turbo:lint` scripts but no `turbo` dependency (the only match is `@ardrive/turbo-sdk`), and CI uses `npm ci`, not pnpm | Wave 2, with the capacitor follow-up (it touches `package.json`) |
| `BUILDLOG.md`, `MUSIC_TEST_CHECKLIST.md`, `skills-lock.json` | 0 references outside `research/` and `docs/` | Wave 2 |
| `DESIGN.md` | 29 hits, nearly all generic `DESIGN.md` mentions inside vendored gstack and the design-steal skill, not this file. Not separated hit by hit | Wave 2 after a hit-by-hit read |
| `DONE.md`, `TASKS.md`, `FORK.md`, `entities.json` | `bot/src/zoe/send-budget.ts` (DONE), a vps skill note (TASKS), `README`/`CONTRIBUTING`/`community.config.ts` (FORK), one bot test (entities) | Follow their readers |

## 2. Coupling: what ties each product to the rest

### Code imports across directories

Method: `escapes.py` resolves every relative import (`from`, `import()`, `require()`) in a directory and lists targets outside it. Control: it must find the known `bot` to `packages/heart-fleet` import, and it did (7 files). Separately, `@/` alias imports from `bot/` are 0 (2691, with a control).

| From | Relative imports scanned | Leaves its directory to |
|---|---|---|
| `bot/` (604 files) | 1,190 | **only** `packages/heart-fleet/src/index`: 7 files (`scheduler.ts`, `heart-run.ts`, `heart-canary.ts`, 4 tests) |
| `src/` (1,682 files) | 1,152 | `community.config` (11 files, 9 of them streaming pages), `packages/heart-fleet` (4: `src/lib/heart/lease-manager.ts`, `liveness.ts`, 2 tests), `tenants/` (3 tests), `next.config` (1 test) |
| `scripts/` (341) | 33 | `src/lib/spore`, `eyes`, `organism`, `bloodstream` (DreamNet checks), `src/lib/spaces/juke-api` (`test-juke-space.ts`), `bot/src/zoe/farcaster/signer` and `x402` (`first-cast.ts`, `register-signer.ts`) |
| `packages/heart-fleet`, `infra/*`, `tools/`, `deploy/`, `agents/`, `ZAO-STOCK/`, `apps/`, `tenants/`, `tests/` | 0 to 31 each | nothing outside themselves |

Inside `bot/`, ZOE depends on 3 of the 18 files at `bot/src/` root: `supabase.ts` (10 importers incl. `hermes/db.ts`, `zoe/crm.ts`), `agent-markup.ts` (zoe, devz and helper `index.ts`) and `auth.ts` (`hermes/commands.ts`). The other 15 root files are the ZAOstock team bot, which ZOE does not import. **The production ZAOstock bot does not run from ZAOOS:** the VPS unit `zaostock-bot` has `WorkingDirectory=/home/zaal/zaostock-bot`, a clone of private `bettercallzaal/zaostock-bot` (last commit `cfacc8f3`, 2026-09-21). The 2026-09-23 ruling ("it is a fork, not a spinout", doc 2541) says to reconcile that fork back into `ZAOOS/bot/src`; it has not happened (the VPS clone sits at `a83ec3e`, 2026-09-09).

### Runtime couplings that are not imports

| Coupling | Evidence | What it ties |
|---|---|---|
| **Deploy pulls ZAOOS main** | VPS crontab `*/10 * * * * /home/zaal/bin/zoe-autodeploy.sh`; `LIVE=/home/zaal/zao-bot-live` (`scripts/zoe-autodeploy.sh:51`); live clone at `5c13b4e4` = `origin/main` | Every ZAOOS merge reaches the bot |
| **The installed deploy script is stale** | `~/bin/zoe-autodeploy.sh` on the VPS is dated 2026-09-17, hash `9343c6d3`; the repo copy is `3c7fc86d` and has the v4 header (2026-10-08). The installed copy has no `ZOE_AUTODEPLOY_SKIP_NONBOT` and no graph verify (`diff` of non-comment lines) | Any research merge restarts ZOE (next row) |
| **Research merges restart ZOE** | Since 2026-10-19 00:00 UTC: 23 first-parent merges, 10 touching `bot/` or `heart-fleet` and 9 touching `research/` or `docs/`, and **22** `Started zoe-bot.service` journal lines. Docs-only merges each followed by a restart within the 10-minute cron: `378579ce4` 15:35 then 15:40, `621cd0a1d` 17:17 then 17:20, `bc517be56` 17:29 then 17:30 (UTC) | ZOE's uptime is tied to the research library's merge rate |
| ZOE reads `research/` | `research-doc.ts:13` and `index.ts:427`: `ZOE_REPO_DIR`, set on the VPS to `/home/zaal/zao-os` (a second clone); `research-doc.ts:58` and `team-tracker.ts:677` run `git ls-tree origin/main research/`; `meetings.ts:104` reads `research/events/_meetings-index.md` from the working tree; `transcribe.ts:46` reads `../../../research/reference/zao-voice-glossary.json` relative to the bundle; `zaostock-approvals-surface.ts:45` reads raw GitHub | Graduating the bot needs these four reads pointed at a ZAOOS clone or the GitHub API. Three already are; `transcribe.ts` is not |
| The second clone is stale | `/home/zaal/zao-os` working tree at `17dff0be3` (2026-09-28), `## main...origin/main [behind 355]`; its `origin/main` ref is current | `meetings.ts` reads a 22-day-old meetings index. `ls-tree origin/main` readers are fine. Separate from this doc's scope; flagged |
| Rules and skills | 18 non-test bot files mention `.claude/rules`; `bot/src/hermes/types.ts:186` protects `.claude/rules` paths; `bot/src/zoe/.claude/agents/*.md` cite ZAOOS rules | The bot's coder/critic follows ZAOOS rules when it edits ZAOOS. A graduated bot still edits ZAOOS, so this is a pointer, not a blocker |
| Databases | Bot (non-test): 22 table names; app: 109; names in common: `activity_log`, `agent_runs`, `contacts`, `tasks`. ZOE's writes go mostly to the cowork tracker (`COWORK_TRACKER_URL` 76 uses) and the app to the ZAOOS project. Whether the four shared names are the same project's tables: **UNVERIFIED** (the bot's `SUPABASE_URL` value was not read) | Low code coupling; a DB question only if the bot's `SUPABASE_URL` is the ZAOOS project |
| Vercel crons | `vercel.json`: agents `vault` 06:00, `banker` 14:00, `dealer` 22:00, `juke-stale-rooms` 04:00, `heart-recovery` 05:00 | Agents, streaming and heart run on the zaoos.com Vercel project, not the VPS |
| Nightly writer | A cloud scheduled session opens a PR into `docs/daily` each night (`nightly-check.yml:5`); its prompt is not in any repo | Moving `docs/daily` breaks it silently |

### The dependency picture

```
                         zaoos.com (Vercel)                    VPS (systemd user units)
                               |                                         |
         vercel.json crons ----+                     cron */10 zoe-autodeploy.sh (installed 09-17 copy)
                               v                                         v
  +--------------------------------------------+     git fetch + ff  +----------------------------+
  | src/  (1,682)  app, API, streaming, cards  |<-- same repo --->   | /home/zaal/zao-bot-live    |
  |   - community.config.ts (11 importers)     |                     |   bot/ (604) zoe, hermes,  |
  |   - public/, tenants/, tests/              |                     |   devz, helper, cockpit    |
  +----------+---------------------------------+                     +---+-----------+------------+
             | 4 files (src/lib/heart)                    7 files      |           | ZOE_REPO_DIR
             v                                                         v           v
        +---------------------------+                     +----------------+  /home/zaal/zao-os
        | packages/heart-fleet (11) |<--------------------| infra/bus (10) |  (2nd clone, tree
        +---------------------------+                     | infra/vps (5)  |   355 behind)
                                                          +----------------+        |
                                                                                    | ls-tree, raw reads
  +--------------------------------------------------------------------------------v-------+
  | research/ (3,204)  .claude/ (370)  docs/daily (nightly cloud writer)  .github/ (9 wf)  |
  |   CI: doc-collision, research-index, docs-automerge, claims, nightly-check, licence     |
  |   ci.yml (no paths filter): app test + bot test + bus test + build on EVERY PR          |
  +-----------------------------------------------------------------------------------------+
        ^                                   ^
        | 1,058 docs mention src/ paths     | ZAODEVZ/ZAOresearch (private fork, 2691)
        | (bare text, 0 GitHub blob links)

  Not wired to anything live: wave-1 paths (195 files, in zaoostest), ZAO-STOCK/ (28),
  scripts/archive + stock-archive (164), docs/superpowers (100), turbo.json, pnpm-workspace.yaml.
  ZAOstock team bot runs from /home/zaal/zaostock-bot, NOT from ZAOOS bot/src root.
```

## 3. CI wiring

| Workflow | Trigger | Runs | Depends on code leaving? |
|---|---|---|---|
| `ci.yml` | push and PR to main, daily 06:40 UTC | `npm ci`, lint, typecheck, `npm test` (app), `npm test` in `bot/`, `tools/estate-control-plane` vitest (`:117`), `node --test infra/bus/*.test.js` (`:133`), `npm run build` (`:188`) | Yes, all of it. **No `paths:` filter**, so a research-only PR pays for the full app and bot suite |
| `ci-after-automerge.yml` | after docs auto-merge | `scripts/ci-on-main.sh` (sparse checkout) | No |
| `doc-collision-guard.yml`, `claims-check.yml`, `research-index.yml`, `licence-clear.yml` | PRs | `scripts/doc-new-claims.sh`, `backfill-research-index.sh`, `check-research-index.sh`, the claims checker | No: research tooling, stays |
| `docs-automerge.yml` | PRs | Arms auto-merge for docs/tests/new scripts; runs `scripts/zoe/nightly-check.mjs` (`:352`) | No |
| `nightly-check.yml` | PRs | `scripts/zoe/nightly-check.mjs` on `docs/daily` files | Stays while `docs/daily` stays |
| `estate-health.yml` | Mondays 13:00 UTC | `tools/estate-control-plane/run-checks.ts` | Moves with `tools/` if that leaves |

`scripts/vercel-ignore.sh` already skips zaoos.com builds when nothing in its `BUILD_PATHS` (`src public packages patches ...`) changed, and skips every non-production build. So research merges do not rebuild zaoos.com; they do restart ZOE (section 2).

## 4. The three open calls from doc 2691

### 4a. `ZAO-STOCK/`

Contents: `planning/` 13, `research/` 6, `standups/` 3, `recordings/` 2, `website/` 1, `assets/` 1, `MASTER-PLAN.md`, `README.md`. Last substantive commit 2026-07-16 (ZAOville runbook, #1556). 14 research docs mention `ZAO-STOCK/` as bare text; 0 link to it on GitHub. `ZAODEVZ/ZAOstock` is public, pushed 2026-10-19, and already has a `docs/` tree of 208 files (`drafts` 27, `outreach` 26, `team` 25, `plans` 19, ...). The only filename the two trees share is `README.md`.

| Option | For | Against |
|---|---|---|
| **A. `ZAODEVZ/ZAOstock` `docs/archive/zaoos-planning/`, via `git filter-repo --path ZAO-STOCK/` (recommended)** | Product home; already public content going to a public repo, so no new exposure; history kept | That repo has its own owner lane and conventions; needs its owner's PR review |
| B. `zaoostest` | Same mechanics as wave 1, no cross-repo review | Buries festival history in a private overflow repo nobody browses |
| C. Fold findings into `research/events/` | Stays searchable in the library | 28 files are mostly plans and standups, not findings; adds to the thing being simplified |

Edits in the ZAOOS removal PR: `.claude/skills/zao-stock/zao-stock.md:128` and `.claude/skills/onepager/SKILL.md:120`. The newsletter skill's five "ZAO-STOCK" hits are the event name in prose, not the path.

### 4b. ZOE and the bot

What would have to change for `bot/` to live in its own repo, each measured above:

1. **Deploy source.** `zoe-autodeploy.sh` fetches ZAOOS `main` into `/home/zaal/zao-bot-live`. A new repo means a new live clone and a new crontab line. Zaal's (rule 32: never hot-edit the live deploy script).
2. **`packages/heart-fleet`.** Imported by 7 bot files and 4 `src/lib/heart` files. Move it into `bot/` (the bot owns the fleet) and have `src/lib/heart` stop importing it, which ends when the client leaves anyway.
3. **`infra/bus`, `infra/vps`, `infra/portal`, `deploy/pi`, `bot/systemd`.** Travel with the bot. `infra/bus` runs as its own unit (`zao-bus`) and has its own CI job.
4. **Four research reads.** Three use `ZOE_REPO_DIR` or raw GitHub already. `transcribe.ts:46` resolves `research/reference/zao-voice-glossary.json` relative to the bundle and breaks on a move; it needs `ZOE_REPO_DIR`.
5. **The ZAOstock fork.** The 2026-09-23 ruling reconciles it into `ZAOOS/bot/src`. If the bot graduates, that ruling's target moves with it. This is the one place the "simple ZAOOS" direction and an earlier ruling meet, so it is listed for Zaal (Next Actions).
6. **Bot scripts in `scripts/`.** `scripts/zoe-autodeploy.sh` and its test, `scripts/zoe-learning-pings/`, `scripts/first-cast.ts`, `scripts/register-signer.ts` import or serve the bot.

| Option | For | Against |
|---|---|---|
| **A. Stay now; cut couplings 1-step-at-a-time; graduate once the client has left (recommended)** | Each cut is a small reversible PR; the restart problem is fixed by Decision 1 without a move; graduation then is one `filter-repo` plus one deploy-line change | ZAOOS stays non-simple until the end |
| B. Graduate now to a new repo | ZAOOS gets simple fastest | Deploy-path change and restart on the hottest code (151 commits in 60 days); the heart-fleet split with `src/lib/heart` must happen first anyway |
| C. Move to zaoostest | None | zaoostest is the overflow for code with no product home; ZOE is production. Rejected |

### 4c. Streaming

The cluster: `src/app/spaces` 11, `live` 5, `juke` 1, `juke-status` 2, `src/components/spaces` 58, `src/lib/spaces` 35, and API `spaces` 24, `100ms` 12, `juke` 18, `twitch` 12, `livepeer` 6, `overlay` 4, `stream` 8, `cron/juke-stale-rooms` 2: **198 files, 5 commits in 60 days.**

- **Live:** `/spaces`, `/live`, `/juke`, `/juke-status`, `/listen` answered 200 on zaoos.com three runs out of three at 18:36 UTC; control `/definitely-not-a-page-2692` 404 three of three. 200 means the page renders, not that anyone uses it; usage (rows in `juke_spaces`, `rooms`, `space_sessions`) was not read.
- **Imported from outside the cluster by 5 files:** `src/app/listen/page.tsx`, `src/app/juke-integration.md/route.ts`, `src/components/social/MiniSpaceBanner.tsx`, `src/lib/social/msRoomsDb.ts` and its test. Control: the same pattern finds 12 importers inside `src/components/spaces`.
- **Depends on shared app code:** `lib/logger` 44, `lib/auth` 34, `lib/db` 24, `lib/social` 9, `lib/env` 9, `lib/twitch` 8, `hooks/useAuth` 8, plus `BottomNav.tsx:101` links to `/spaces`. So in zaoostest it is an archive that cannot run alone, not a working app.
- **Tables:** `juke_spaces` 21 calls, `rooms` 18, `space_sessions` 7, `juke_webhook_events` 6, and 8 more.

| Option | For | Against |
|---|---|---|
| **A. Into zaoostest, frozen, in the v1-client removal PR after the flip (recommended)** | zaoos.com will serve zao-app, whose README v1 scope has no streaming; removing it with the client removes it with its imports (`lib/auth`, `lib/db`) in one go; the Juke partnership keeps its code in git | The pages go dark at the flip unless redirected |
| B. Now, before the flip | ZAOOS simpler sooner | Breaks 5 live pages, the `juke-stale-rooms` cron and 5 outside importers, on the app that is still production |
| C. Port to zao-app | Keeps live audio live | Against zao-app's lean v1 scope; a product decision, not a move |

Redirects at the flip: 2691 lists 5 ZAOOS-only pages; the streaming pages add `/spaces`, `/live`, `/juke`, `/listen` to that list.

## 5. How other teams do it (fetched sources)

| Source | What it says | Fit for ZAOOS |
|---|---|---|
| GitHub Docs, splitting a subfolder (FULL) | "you won't lose any of your Git history ... However, note that the new repository won't have the branches and tags of the original repository." Requires git 2.22+ for filter-repo | Wave 1 already did this. Tags do not travel; the `doc-NNNN` reservation tags stay in ZAOOS, which is right |
| git-filter-repo README (FULL) | "git filter-repo is now recommended by the git project instead of git filter-branch" | Confirms the wave-1 method |
| git-subtree man page (FULL) | `split` "Extract[s] a new, synthetic project history from the history of the <prefix> subtree" | One prefix per run; filter-repo takes many `--path`s, as 2691 found |
| Babel monorepo design doc (FULL) | Pros: "Single lint, build, test and release process", "Easy to coordinate changes across modules". Cons: "Codebase looks more intimidating", "Repo is bigger in size" | ZAOOS pays the cons (99.8 MB, one CI for everything) without the pro: its products share almost no code (section 2) |
| monorepo.tools (FULL, vendor: Nx) | "A monorepo is a single repository containing multiple distinct projects, with well-defined relationships." Polyrepo: "each team or application lives in its own repository, with its own dependencies, tooling, build artifact, and CI pipeline" | ZAOOS's relationships are mostly not code: a deploy cron, a research reader, a shared package |
| Turborepo docs, structuring a repository (FULL) | "We recommend starting with splitting your packages into apps/ for applications and services and packages/ for everything else" | ZAOOS added `turbo.json` and `pnpm-workspace.yaml` (2026-04-16) and never wired them: no `turbo` dependency, CI on npm |
| Apache Incubator graduation guide (FULL) | "Graduating is a democratic process: in the end, it comes down to a VOTE"; checklist includes "Demonstrate ability to create Apache releases" | Graduation as an evidence checklist, not a date |
| CNCF TOC process (FULL) | Graduated: "projects whose adopters have demonstrated their production-readiness by their deployment to production environments" | ZOE meets "in production" already; that is why it should graduate to its own repo, not zaoostest |
| Google research page (PARTIAL, abstract only; CACM copy blocked) | "a common source of truth for tens of thousands of developers" | Scale argument; does not apply to one founder plus agents |
| HN 18808909 "Monorepos: Please don't" (FULL via Algolia, 332 points, 391 comments) | erik_seaberg: "polyrepos' ability to pin known-good versions of dependencies; that tends to be the Achilles' heel of monorepos" | `bot/` already has its own `package.json` and lockfile, so it is half a polyrepo today |
| HN 34359736 "Just use a monorepo" (FULL via Algolia, 263 points, 277 comments) | xiphias2: "if you ... aren't at, like, Google-tier scale, just throw it all in a monorepo" | The counter-view. Answered by section 2: the measured cost here is not code coupling but a deploy that restarts on every research merge |

**The pattern that fits:** a monorepo pays off when projects share code and a release process. ZAOOS's products share a deploy trigger and a CI job, not code. The cheapest fixes are the deploy filter (Decision 1) and a CI `paths:` split, and the clean end is product repos plus a library repo, the way zao-xmtp graduated (#4000 then #4011). Comments quoted from the HN API are in API order, not ranked by votes, and the "when to split" question had no fetched source beyond these: treat that part as judgment.

## 6. Risks: what breaks if each piece moves

| Piece | Breaks | Who notices | Guard |
|---|---|---|---|
| `ZAO-STOCK/` | Two skill lines; 14 research docs' bare-text mentions read stale | Nobody at runtime | Edit both skills in the same PR; research mentions stay as history |
| `bot/` | Autodeploy (fetches ZAOOS main), `transcribe.ts` glossary path, `heart-fleet` imports, `ci.yml` bot-test and bus-test jobs, `scripts/zoe-autodeploy.sh` test, cockpit's `.handoffs` reads | Zaal, by a silent or crashing ZOE | Boot-verify on a fresh checkout (rules 31-32); keep the ZAOOS clone for `ZOE_REPO_DIR`; move the crontab line last |
| Research merges while the bot stays | ZOE restart per merge (measured) | ZOE users mid-conversation | Decision 1 |
| Streaming | 5 live pages, `juke-stale-rooms` cron, 5 outside importers, `BottomNav` link | zaoos.com visitors | Only with the client removal, after the flip, with redirects |
| `src/` (client) | zaoos.com, 5 Vercel crons (agents, heart-recovery, juke), `vercel-ignore.sh` | Everyone | 2691 item 2 checklist; the crons need a home before `vercel.json` goes: the three agent crons are trading jobs (ask-first area) |
| `docs/daily` | The nightly cloud writer, whose prompt is outside the repo | Nobody until a night is missing | Leave it in ZAOOS; it is the library's diary |
| `scripts/` research tooling | doc-collision, research-index, ci-on-main, claims | Every docs PR | Never move these out of ZAOOS |
| `tools/estate-control-plane` | `ci.yml:117`, `estate-health.yml` | Monday health run | Move the workflow with the folder |
| Any move | Link rot: 1,058 docs mention `src/`, 462 `bot/`, as bare text; 0 and 2 GitHub blob links | Readers | Bare paths stay true at their date; add one line to the README saying where each moved |

## 7. The simple ZAOOS: end state and ordered steps

**End state.** ZAOOS holds: `research/`, `.claude/`, `.claims-public/`, `.github/` (the research workflows only), `docs/daily`, `docs/weekly`, `docs/daily-briefs`, the research and CI scripts (`doc-new-claims.sh`, `backfill-research-index.sh`, `check-research-index.sh`, `ci-on-main.sh`, `scripts/zoe/nightly-*.mjs` and their tests), the root policy docs, and a slim `package.json` for the research tooling that needs Node. Measured today that is roughly 3,204 + 370 + 598 + small: under half the files, and the 473-of-783 share of the work. The client lives in `zao-app`, the bot in its own repo, ZAOstock history in `ZAODEVZ/ZAOstock`, and everything else in private `zaoostest`.

| Step | What | Tag |
|---|---|---|
| 1 | Wave 1 removal (zaoos-split lane; Zaal's keystroke, then the follow-up PR) | In flight, not this lane |
| 2 | Install the v4 autodeploy on the VPS and set `ZOE_AUTODEPLOY_SKIP_NONBOT=1` (Decision 1). Verify: a docs-only merge, then no new `Started zoe-bot.service` line within 20 minutes | **Zaal's call** (live deploy path); agent writes the exact two commands and the check |
| 3 | `ci.yml`: add a `paths-ignore` for `research/**` and `docs/**` on the app and bot jobs, keeping a required no-op job so the check still reports | Agent-doable (PR); Zaal merges, since it touches a merge guard |
| 4 | `ZAO-STOCK/` to `ZAODEVZ/ZAOstock` `docs/archive/zaoos-planning/` (Decision 2), then the ZAOOS removal PR with the two skill edits | Zaal's yes; then agent-doable |
| 5 | Wave 2 to zaoostest, one PR per group: `scripts/archive` + `scripts/stock-archive` (164), `docs/superpowers` (100), `BRAIN/` with the `random_tip.py` glob edit, `content/`, `csv import/`, root loose files, `turbo.json` + `pnpm-workspace.yaml` + `turbo:*` scripts with the capacitor follow-up | Agent-doable (importer pass + PRs); Zaal merges; `package.json` edits need a lane that can `npm install` |
| 6 | `transcribe.ts` reads the glossary through `ZOE_REPO_DIR` | Agent-doable (bot PR, boot-verified) |
| 7 | Move `packages/heart-fleet` under `bot/` and repoint the 7 bot imports | Agent-doable (bot PR); `src/lib/heart` keeps its copy until step 8 |
| 8 | zaoos.com flip to zao-app, redirects (5 from 2691 + `/spaces`, `/live`, `/juke`, `/listen`), then the v1-client removal PR with streaming frozen into zaoostest (Decision 4); `vercel.json` crons rehomed first | **Zaal's call** (env vars, DNS, the agent trading crons); removal PR agent-doable after |
| 9 | Decide the zaostock-bot fork: reconcile into the bot repo-to-be, or keep it as its own repo and drop the 15 unused root files from `bot/src` | **Zaal's call** (it revisits the 2026-09-23 ruling) |
| 10 | Bot graduates: `filter-repo` `bot/`, `infra/bus`, `infra/vps`, `infra/portal`, `deploy/pi`, bot scripts, `tools/` if it goes too; new live clone; crontab line moved last | **Zaal's call** (new repo, deploy path); agent prepares and verifies |
| 11 | Rewrite `README.md`, `CLAUDE.md`, `AGENTS.md` to the library scope; one "where each piece went" table | Agent-doable (docs PR) |

## Method

- `inventory.sh <rev>`: per top-level entry, `git ls-tree -r` file count and byte sum, `git log --since=2026-08-21` commit count, last commit excluding `fa92d8356` and `a0f86aa5d`.
- `escapes.py <rev> <dir>`: resolves relative import specifiers with `posixpath.normpath` and lists targets outside `<dir>`. Control: finds the 7 known bot to heart-fleet importers.
- Restart count: `journalctl --user -u zoe-bot --since 2026-10-19 -o short-iso | grep 'systemd\[[0-9]+\]: Started'` against `TZ=UTC git log --first-parent --since=2026-10-19T00:00Z`. The pairing is by time within the 10-minute cron window, not by a logged SHA, so "each merge caused a restart" is an inference, strongly supported by the three docs-only pairs.
- GitHub link counter control: the pattern for `ZAOOS/(blob|tree)/.../research` finds 15 docs, so the 0 for `src/` is a real 0.
- Both scripts are kept in this lane's scratchpad and pasted into the PR body.

## Also See

- [Doc 2691](../2691-zaoos-graduation-map-2026-10/) - the graduation map and wave 1; this doc extends it and does not repeat its tables
- [Doc 836](../836-zaoos-repo-estate-census/) - the July census
- [Doc 2541](../../agents/2541-one-agent-or-many-bots/) - the zaostock-bot fork ruling
- [Doc 2684](../../farcaster/2684-zao-xmtp-standalone-app/) - the clean graduation to copy

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Decide Decisions 1-4 (A/B each, recommendation first) | @Zaal | Decision | Gated: deploy path, publishing into another repo |
| Write the exact VPS commands and the verify for Decision 1 | zaoos lane | Note to Zaal | After his yes |
| `ci.yml` paths split (step 3) | zaoos lane | PR | Zaal merges (merge guard) |
| `ZAO-STOCK/` move PR into `ZAODEVZ/ZAOstock`, then ZAOOS removal PR | zaoos lane, with the ZAOstock lane | PR x2 | Zaal's yes on Decision 2 |
| Wave 2 importer pass and PRs (step 5) | zaoos lane | PR per group | After wave 1 merges |
| `transcribe.ts` glossary path; `heart-fleet` under `bot/` (steps 6-7) | ZOE lane | PR, boot-verified | None beyond review |
| Refresh `/home/zaal/zao-os` working tree (355 behind) so `meetings.ts` reads a current index | @Zaal or the VPS lane | Ops | VPS action |
| Zaostock-bot fork: reconcile or keep separate (step 9) | @Zaal | Decision | Revisits a ruling |

## Sources

Internal (measured this run):
- [FULL] ZAOOS `origin/main` `5c13b4e49` via `git ls-tree`, `git log`, `git grep`, `inventory.sh`, `escapes.py` (Method)
- [FULL] VPS via `ssh vps`, read-only: crontab, `systemctl --user show` for 5 units, `journalctl --user -u zoe-bot`, `sha1sum` and `diff` of the two autodeploy copies, `git status` of `/home/zaal/zao-os` and `/home/zaal/zaostock-bot`
- [FULL] `curl` status codes against https://zaoos.com, 3 runs, 404 control, 2026-10-20 18:36 UTC
- [FULL] `gh api` for `bettercallzaal/zao-app`, `bettercallzaal/zaoostest`, `bettercallzaal/zaostock-bot`, `ZAODEVZ/ZAOstock` (recursive tree, not truncated)

External (raw text via `curl` or JSON API, saved and quoted from disk):
- [FULL] https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository (curl, HTML stripped)
- [FULL] https://raw.githubusercontent.com/newren/git-filter-repo/main/README.md (curl)
- [FULL] https://raw.githubusercontent.com/git/git/master/contrib/subtree/git-subtree.adoc (curl)
- [FULL] https://raw.githubusercontent.com/babel/babel/main/doc/design/monorepo.md (curl)
- [FULL] https://monorepo.tools/ (curl, HTML stripped; vendor page by Nx)
- [FULL] https://turborepo.com/docs/crafting-your-repository/structuring-a-repository (curl, HTML stripped)
- [FULL] https://incubator.apache.org/guides/graduation.html (curl, HTML stripped)
- [FULL] https://raw.githubusercontent.com/cncf/toc/main/process/README.md (curl)
- [PARTIAL - abstract only; the CACM copy at cacm.acm.org returned a Cloudflare block] https://research.google/pubs/why-google-stores-billions-of-lines-of-code-in-a-single-repository/
- [FULL] https://hn.algolia.com/api/v1/items/18808909 ("Monorepos: Please don't", Algolia JSON)
- [FULL] https://hn.algolia.com/api/v1/items/34359736 ("Just use a monorepo", Algolia JSON)
- [FAILED - non-JSON response] https://www.reddit.com/r/programming/search.json?q=monorepo+polyrepo ; replaced by the two HN threads
- [FAILED - 339-byte response] https://hn.algolia.com/api/v1/items/17611841 ; dropped
