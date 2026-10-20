---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-10-20
superseded-by:
related-docs: 836, 1025, 1027, 1124, 2263, 2541, 2684, 2690, 692
original-query: "this lane should be focused on what is in zaoos and splitting it up into different repos" (Zaal, 2026-10-20); revision 2: "lets move all this to another repo thats zaoostest and lets make zaoos the most simple it can be" (Zaal, 2026-10-20)
tier: STANDARD
---

# 2691 - What lives in ZAOOS on 2026-10-20, and how it becomes the simple ZAOOS

> **Goal:** Map every product inside ZAOOS today, say for each one whether it stays, graduates now, graduates later or is deleted, and give an order of operations. Plan only. No code moves, no new repos, no deletes in this PR. New repos, domains, databases and deletions are Zaal's calls.

All measurements below were taken 2026-10-20 between 10:30 and 11:01 EDT against `origin/main` at `b0b1f18a0`, unless a row says otherwise.

## Revision 2 (2026-10-20 afternoon): the simple ZAOOS plan

Zaal, 2026-10-20, relayed by the seat: "lets move all this to another repo thats zaoostest and lets make zaoos the most simple it can be". He then confirmed the repo: `bettercallzaal/zaoostest`, **private**. It was created 2026-10-20T16:56:08Z and was still empty when this was written (`gh repo view bettercallzaal/zaoostest`). This revision replaces the morning plan wherever the two disagree. The morning tables below stay as the record.

Measured 2026-10-20 at `origin/main` `40562ad66` with git only: `git ls-tree`, `git log --since=2026-08-21`, and `git grep`. No install, build or test was run.

### Where ZAOOS ends up

ZAOOS becomes **the research library plus the rules and CI that keep it honest**. Everything else leaves in one of three ways:

- to its own product repo (the client to `zao-app`, ZAOstock to `ZAODEVZ/ZAOstock`);
- to `zaoostest`, the private holding repo for code that has no product home;
- out of git entirely, as a delete Zaal makes.

Doc 1025 (2026-07-10, docs-only ZAOOS) pointed this way and was never run. This revision is its smaller, measured successor. The difference is that research **stays** in ZAOOS: it has 473 of the repo's commits in the last 60 days, and its CI guards (doc-collision, research-index, docs auto-merge) live in `.github/`.

### 1. The minimum that stays in ZAOOS

| Path | Why it stays | Until |
|---|---|---|
| `research/` | The library: 3,204 files, 473 commits in 60 days. CLAUDE.md: "Research stays in ZAOOS forever". | Permanent |
| `.claude/` (rules, hooks, project skills) | Every session working in ZAOOS loads these rules. Research CI and the skills cite them. | Permanent |
| `.github/` | Docs auto-merge, doc-collision guard, research-index, claims, and the CI for whatever code is still here. | Permanent; shrinks as code leaves |
| Root docs: `README.md`, `CLAUDE.md`, `AGENTS.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `RESEARCH.md` | The front door and the policy. | Permanent; rewritten to the new scope |
| `bot/` + `packages/heart-fleet` + `infra/bus` + `infra/vps` + `deploy/pi` | ZOE is live and deploys from a ZAOOS clone: `scripts/zoe-autodeploy.sh` runs `git fetch origin main`. Importers: `packages/heart-fleet` is referenced by 19 files across bot, scripts, src and deploy/pi; `infra/bus` by `bot/src/zoe/bus-bridge.ts` and `ci.yml`; `infra/vps` by `bot/src/hermes/claude-health.ts`. | Stays now. Graduates later to its **own** repo, not zaoostest, because it is production (item 4 below). |
| `docs/daily`, `docs/weekly`, `docs/daily-briefs` | Written every night by ZOE (`scripts/zoe/nightly-dates.mjs`, `nightly-redact.mjs`); 52 commits in 60 days. | Until ZOE's writer is pointed elsewhere |
| `scripts/` | 336 files and 41 commits in 60 days. Parts are wired into CI, ZOE and research tooling. Not triaged file by file in this pass. | Wave 2 triage |
| `tools/estate-control-plane`, `tools/icp-primer` | `ci.yml` line 117 and `estate-health.yml` run them. | Until those workflows move |
| `agents/` (DOCTRINE and personas) | `scripts/autopilot/doors.json` names `agents/DOCTRINE.md` (lines 5 and 173); `scripts/agents/zoe-drift.py` refers to `agents/*/PERSONA.md` (lines 104, 114). | Wave 2, together with edits to both files |
| `src/`, `public/`, `tenants/`, `tests/smoke`, the Next.js root config | zaoos.com is served from here today (morning section, finding 2). `tenants/` is read by `src/lib/dreamnet/tenant`; `tests/smoke` by `playwright.config.ts`. | Removed by the ZAOOS PR that follows the zaoos.com flip to `zao-app` (item 2, Zaal ruled A). Not moved to zaoostest, except the streaming cluster (item 6). |

### 2. What moves to `zaoostest`: wave 1, the unused set

Wave 1 is every path whose importer check found nothing outside the path itself, except `.gitignore` lines, lint/tsconfig excludes, and prose mentions. All of those are edited in the same removal PR.

**Importer check.** Command: `git grep -l -F <patterns> 40562ad66 -- . ':!<own path>' ':!research' ':!docs' ':!package-lock.json'`.

**Positive control, checked first.** The pattern `packages/heart-fleet` must find a known importer, and it found 19 files. The first control used `@zaoos/heart-fleet`, found 0, and was thrown out: `packages/heart-fleet` has no `package.json`, so that name does not exist. The first run's zeros were not trusted until the control fired.

Every count names its patterns. For `tmp/`, `data/` and `security/`, a folder-name check was added after review, anchored so that `/tmp/` and `foo-data/` do not match. Each hit it found is listed as real or not, with the line. The script is in this PR's description.

| Path | Files | Commits, 60 days | Importer check (patterns, result) | Edits in the ZAOOS removal PR |
|---|---|---|---|---|
| `packages/agents` | 15 | 0 | `@zaoos/agents`, `packages/agents`: **0** | none |
| `packages/config` | 4 | 0 | `@zaoos/config`, `packages/config`: **0** | none |
| `packages/db` | 4 | 0 | `@zaoos/db`, `packages/db`: **0** | none |
| `packages/publish` | 15 | 0 | `@zaoos/publish`, `packages/publish`: **0** | none |
| `android/` | 53 | 0 | `android/`, `capacitor`: 7, all mobile-shell config. `src/` imports `@capacitor`: **0** files. | drop `capacitor.config.ts`, the 4 `cap:*` scripts and 5 `@capacitor/*` deps in `package.json`, and the `.gitignore` lines (a dependency change, so it is Zaal's merge) |
| `ios/` | 19 | 0 | `ios/App`, `ios/`: 3 (`.gitignore`, `.serena/project.yml`, a prose inventory) | `.gitignore`, `.serena/project.yml` |
| `apps/zabal-snap` | 14 | 0 | `zabal-snap`: 1 (`tsconfig.json` exclude) | tsconfig exclude |
| `plugins/` | 20 | 0 | `plugins/`: 6. The 4 android files move with it; `bot/src/zoe/attention.ts:21` is a comment citing elizaOS's own `plugins/` (false positive); `eslint.config.mjs` ignore. | eslint, tsconfig, vitest excludes |
| `mcp/` (only `hindsight-mcp-server`, 3 files) | 3 | 0 | `mcp/`: 3. Two are substring hits on the bot's own `bot/src/zoe/mcp/` (false positives), and one is a prose inventory. | tsconfig exclude |
| `infra/hindsight` (docker-compose, `.env.example`) | 2 | 0 | `infra/hindsight`: 1, a prose inventory. `src/lib/hindsight.ts` uses the npm client `@vectorize-io/hindsight-client`, not these files. Moving the files does not stop a running server. | none |
| `evals/` | 6 | 0 | `evals/`: 18. 17 are gstack's own `evals/` and `.claude/skills/meeting/evals`; 1 is a table row in `.claude/memory.md`. | memory.md row |
| `.superpowers/` | 14 | 0 | 3: `.gitignore`, an eslint ignore, an archived skill | `.gitignore`, eslint |
| `autoresearch-test-coverage/`, `build-log/` | 1, 4 | 0 | 1 each, `.gitignore` | `.gitignore` |
| `tmp/` | 4 | 0 | File patterns (`tmp/march-zols`, `tmp/socials-day`, `tmp/zaostock-failoften`): **0**. Folder pattern `(^|[^A-Za-z0-9_./-])(\./)?tmp/` (relative paths, not `/tmp/`): 5. Real: the newsletter skill writes `tmp/newsletter-day-[N].html` (`.claude/skills/newsletter/skill.md:122,190`), and `.gitignore:113` ignores `tmp/`. Not real: `bot/src/zoe/__tests__/transcribe.test.ts:213` (a Telegram file path in a mock), and `scripts/orca-setup.sh:121,125` (a `$tmp` shell variable). | **Keep** the `.gitignore` `tmp/` line so the newsletter output stays untracked. Only the 4 tracked files move. |
| `data/` | 3 | 0 | File patterns (`data/missing-fids`, `data/ordaoawards`): **0**. Folder mentions: `scripts/import-fractal-history.ts:8,44` defaults to `./data/`, `package.json:25` runs it as `import:fractals`, and `README.md:412` documents `--dir ./data`. The script reads Airtable CSV exports passed in that folder, not the 3 tracked files. Other folder-pattern hits are `data/actions.json` in a different repo (cowork-zaodevz, meeting skill) and prose. | Moving the 3 tracked files does not change what the script reads, because whoever runs it supplies the CSVs. Edit `README.md:412` to say the user creates `./data` with the CSV exports. `.gitignore` has no `data` rule (line 86's "data" is prose in a comment). |
| `security/` (one 2026-03-19 audit) | 8 | 0 | File pattern (`security/260319`): **0**. Folder mentions: the vendored `/autoresearch:security` skill writes each audit to `security/<stamp>-<slug>/` and reads the newest one as its incremental baseline (`.claude/skills/autoresearch/references/security-workflow.md:524,532`). `.claude/skills/zao-research/SKILL.md:71` names `security/` as a **research** topic folder (`research/security/`), which is not this path. The `biome.json` hit is the word "security" in a rule name. | After the move, the next `/autoresearch:security` run in ZAOOS finds no baseline and does a full audit instead of an incremental one, then recreates `security/`. Accepted, and recorded in the removal PR body. |
| `skills/fishbowlz` | 1 | 0 | 1, a prose line in `bot/REGISTRY.md` | REGISTRY line |
| `infra/n8n` | 5 | 0 | **0** | none |

That is 19 paths, 195 files (plus `capacitor.config.ts`), and no commits in 60 days. Counted with `git ls-tree -r` and `git log --since=2026-08-21` over the 19 paths passed as one bash array; the same `ls-tree` on `packages/heart-fleet` returns 11, so the counter reads. (A first count with an unquoted zsh variable returned 0 files and was thrown out.) After wave 1, `packages/` holds only `heart-fleet`, and `pnpm-workspace.yaml` still matches it.

### 2b. Wave 2: moves that need an edit first, each its own PR

| Path | What holds it | Call |
|---|---|---|
| `BRAIN/` (7 files) | `scripts/zoe-learning-pings/random_tip.py` globs `BRAIN/projects/*.md`, so moving it silently shrinks ZOE's tip pool; `scripts/brain-to-digest.js`; `infra/portal` prompts | Move, with the glob edited in the same PR |
| `content/` (4 files) | Meeting-skill text says not to use `content/bonfire-ingest/` (a backfill pipeline) | Move after confirming nothing runs the backfill |
| `infra/portal` (38 files) | `.claude/rules/secret-hygiene.md` names its path; `infra/bus/deploy/deploy.sh` | Check whether it runs on the VPS before deciding (an `ssh vps` read) |
| `docs/` outside the ZOE-written folders (`docs/superpowers` 100 files, `adr`, `specs`, root notes) | Cited by `tools/*` READMEs, the research skill, `README.md` | Move with link edits, or fold into `research/` |
| `scripts/` | Mixed | One file-by-file importer pass |

### 3. Items 3, 4 and 6 folded in

| Item | Call | Why |
|---|---|---|
| 3. `ZAO-STOCK/` (28 files, 1 commit in 60 days) | **Move to `ZAODEVZ/ZAOstock`**, its product's home, not zaoostest. Fallback: zaoostest if that repo should not take docs. | Importers: 4. Two skills (`onepager`, `zao-stock`) cite the path and get edited; two are archived SQL files that stay as history. |
| 4. ZOE and the bot (`bot/`, 604 files, 150 commits in 60 days) | **Stay** for now. It graduates later to its own repo through its own plan. | It is the live production system, and the VPS deploys from a ZAOOS clone. A move is a deploy-path change with a restart, which is not lab overflow. |
| 6. Live audio and streaming (`src/app/spaces`, `live`, `juke`, `juke-status`, `src/components/spaces`) | **Move to zaoostest, frozen, in the same PR that removes the v1 client** after the zaoos.com flip. Not before: `/juke-status` answered 200 on zaoos.com at 11:01 EDT on 2026-10-20. | The v1 scope in `zao-app`'s README (sign-in, feed, casting, replies, player, notifications, settings, miniapp) has none of these routes, so after the flip they have no other home. |

### 4. Method: history kept, one removal PR

1. **Build zaoostest from a fresh clone, never the working clone.** Run `git clone --no-local <ZAOOS> /tmp/zt` and then `git filter-repo --path <p1> --path <p2> ...` with the wave-1 list. Every commit that touched those paths is kept with its author and date. `git subtree split` handles only one prefix per run, so it would mean 19 branches to merge; filter-repo does it in one pass. ZAOOS's MIT `LICENSE` and a README naming ZAOOS as the source go in one commit on top.
2. **Check before pushing.** Run `git ls-files | wc -l` in the filtered clone; it must equal the wave-1 file count at the source SHA. Do a `git log --follow` spot-check on two files, and run the case-insensitive secret scan (`secret-hygiene.md` steps 2 and 3) over the whole filtered history, because zaoostest is private but its history is new. Then push to `bettercallzaal/zaoostest` `main`.
3. **One ZAOOS removal PR.** `git rm -r` the wave-1 paths, plus the config edits listed in the table, on a branch off the same source SHA. The PR body cites the zaoostest commit that holds each path. It opens ready, with the `hold` label (it is not docs-only, so auto-merge does not apply anyway). **Zaal merges it.**
4. **Verify after merge:** run the importer check again on the new `origin/main` (still 0 for each path), check that CI is green, and confirm `zaoostest` `main` has the files.

### 5. Order

1. This plan PR passes the evaluator.
2. Build and push zaoostest (wave 1).
3. The ZAOOS removal PR, merged by Zaal.
4. `ZAO-STOCK/` to ZAOstock.
5. Wave 2, one PR per row.
6. After the zaoos.com flip: the client-removal PR, with streaming going to zaoostest.
7. The bot's own graduation plan.

## Revision 1 key decisions (morning of 2026-10-20; superseded where Revision 2 differs)

| # | Candidate | Recommendation | Gate |
|---|---|---|---|
| 1 | **Research library (ZAOOS public, ZAODEVZ/ZAOresearch private)** | **Keep ZAOOS `research/` canonical and public; keep ZAOresearch as the private working library it now is.** Publish each ZAOresearch-only doc into ZAOOS by its own PR, only once cleared. Of the 21: 17 look publishable, 2 are held as not cleared (1912 leads, 2300 sponsor board), 1 is already here under another number (1659 = 2372), 1 was deliberately reverted (2260). | Publishing is Zaal's |
| 2 | **Farcaster client -> `bettercallzaal/zao-app`** | **Graduate now: finish the move that already started.** zao-app exists (2026-10-16) but zaoos.com is still served by ZAOOS. | Vercel env vars, DNS flip: Zaal |
| 3 | **ZAO card builder (plan PR #4046, Phase A #4047)** | **Stay in `src/app/cards/` for v1. Graduate later.** The cards lane chose this on 2026-10-20 and the reasons hold (section 11). The lift-out is three folders plus one hook. | None now |
| 4 | **`ZAO-STOCK/` folder (28 planning files)** | **Graduate now** into `ZAODEVZ/ZAOstock` docs. The app left in May; this is residue. | Docs-only move |
| 5 | **ZOE + bot fleet (`bot/`)** | **Stay. Graduate later.** It is the hottest code in the repo and the 2026-09-23 ruling moved the other way (pull the zaostock-bot fork back in). | None now |
| 6 | **Dead code (4 packages, mobile shells, zabal-snap, plugins, mcp)** | **Delete list for Zaal.** Zero consumers or zero commits in 60 days. | Deletion is Zaal's |
| 7 | **Live audio and streaming cluster (spaces, 100ms, juke, livepeer, twitch, overlay)** | **Stay, frozen**, until zao-app is live. Then decide: graduate with zao-streamer-kit, or stay as lab. | None now |

Already graduated, nothing to do: **ZAOstock app** (removed 2026-05-17, #544, lives at `ZAODEVZ/ZAOstock`) and **ZAO XMTP** (removed 2026-10-18, #4011, lives at `bettercallzaal/zao-xmtp`).

## The finding that shapes everything: two graduations became forks

The "Monorepo as Lab" rule says a graduate's code is **deleted** from ZAOOS so there is no drift. Two of the last three graduations skipped that step, and both are now drifting:

| Graduate | New home | Copy still in ZAOOS? | Drift measured |
|---|---|---|---|
| Research library | `ZAODEVZ/ZAOresearch` (private, README: "Graduated out of the `bettercallzaal/ZAOOS` monorepo on 2026-08-10") | Yes, and it is the live one | ZAOOS has **2,413** numbered doc folders, ZAOresearch **2,049**. **385** exist only in ZAOOS, **21** only in ZAOresearch (e.g. `business/1908-clipping-as-a-service`, `business/1911-grant-short-list-oct-2026`). Both received new docs on 2026-10-19. ZAOresearch is written by IMan's desk, and its doc 1306 proposes (open for Zaal) that only cleared docs go public, so part of this gap may be by design. Method: folders matching `research/<topic>/<digit>*` in both trees (ZAOresearch via `gh api` recursive tree at `883cd32e`, not truncated), compared with `comm`. |
| Farcaster client | `bettercallzaal/zao-app` (public, created 2026-10-16) | Yes, and it is the live one: zaoos.com serves ZAOOS-only pages | ZAOOS #4037 (2026-10-19, `useVisibleInterval`) is not in zao-app: its `src/hooks/` has no such file. |
| ZAO XMTP | `bettercallzaal/zao-xmtp` | No (#4011) | None. **This is the pattern to copy.** |
| ZAOstock app | `ZAODEVZ/ZAOstock` | No (#544) | None for the app. The bot is a separate story (below). |

The same failure was found and ruled on once already: `bettercallzaal/zaostock-bot` forked from `ZAOOS/bot/src/`, and on 2026-09-23 Zaal ruled "it is a fork, not a spinout", to be reconciled back (a ruling by Zaal on 2026-09-23; doc 2541).

**So the rule for every graduation below: the PR that makes the new repo live is followed by the PR that deletes the ZAOOS copy, and the graduation is not done until the second one merges.**

## The doctrine conflict, stated so it can be closed

| Source | Date | Says |
|---|---|---|
| Doc 1025 (`status: design-approved`) | 2026-07-10 | ZAOOS becomes docs-only; all code leaves (bot to `hermes-orchestrator` + `zaoos-workspace`, app to a new repo). |
| Doc 1124 manifest | 2026-07-15 | Three-stage execution of 1025. No stage started: `zaoos-workspace` was last pushed 2026-04-05, `hermes-orchestrator` 2026-09-01. |
| Doc 2263 | 2026-08 | Research graduates OUT to ZAOresearch, then `research/` is deleted from ZAOOS. |
| ZAOOS CLAUDE.md + Zaal's lane brief | 2026-10-20 | ZAOOS is the lab; research stays in ZAOOS forever; things graduate out. |
| zao-app README | 2026-10-16 | "ZAOOS stays the lab. This repo is the lean client." |

1025 and 2263 point in opposite directions (code out vs research out), and neither was finished. The newest approved instruction is Zaal's brief of today, which matches CLAUDE.md. **This doc follows it: ZAOOS stays the lab and keeps the research.** Marking 1025, 1124 and 2263 as superseded by this doc is a Next Action, held for Zaal's yes because 1025 was approved by him.

## Inventory by product

Method for every row: `git ls-files <dir> | wc -l` for files; `wc -l` over tracked `.ts/.tsx` for lines; `git log --since=60.days -- <dir>` for commits. **Last-commit dates are not used**: `fa92d8356` (2026-07-06, biome autoformat, #1103) and a 2026-04-16 sweep touched most directories, so a "last changed" date reads those bulk commits, not real work.

Repo-wide, 777 commits in the last 60 days: **research 471, bot 150, src 27.**

### 1. Farcaster client (the zaoos.com app)

| Measure | Value |
|---|---|
| `src/` tracked files | 1,667 |
| API route handlers | 326 (`git ls-files 'src/app/api/**/route.ts'`) |
| Largest API domains (files / lines) | api total 677 / 180,235; admin 59 / 26,231; music 81 / 25,111; auth 43 / 11,036 |
| Pages | `src/app/(auth)/` holds 27 route groups; 23 more directories top-level under `src/app/` |
| Commits, 60 days | 27 across all of `src/` |
| External users | The ZAO members via zaoos.com (live, `x-vercel-id` present, 200) |
| Graduate copy | `bettercallzaal/zao-app`: 289 `src/` files, 67 route handlers. v1 scope per its README: Farcaster sign-in, channel feed, casting, replies, song player, notifications, settings, miniapp. Left out: DMs/XMTP, wallet login/wagmi/Solana, Hats/Respect/governance, cross-posting. |
| Live status of the copy | Not serving zaoos.com. Checked 2026-10-20 11:01 EDT: `/network`, `/research`, `/sopha`, `/juke-status`, `/stake` all return 200 on zaoos.com and none of those routes exist in zao-app; control `/definitely-not-a-page-2691` returns 404. The 2026-10-16 build note says the deploy waits on Zaal adding environment variables. |
| Shared deps | Supabase project ZAOOS (tables `users`, `allowlist`, `respect_members`, `user_settings`, `auth_nonces` are read by nearly every domain); iron-session `SESSION_SECRET`; Neynar app FID; `community.config.ts`; the zaoos.com Vercel project and domain |
| Verdict | **Graduate now** (finish it). |

### 2. Music player

`src/components/music` 69 files / 17,458 lines; `src/app/api/music` 81 / 25,111; `src/lib/music` 32 / 4,191; 60-day commits 1 / 2 / 1. Tables: `songs`, `playlists`, `playlist_tracks`, `song_submissions`, `track_of_the_day` and 14 more. **Part of zao-app v1** (the song player), so it travels with the client. **Not a separate graduate.** `bettercallzaal/ZAOMixZ` is a different product (a two-deck DJ app) and shares no code.

### 3. ZOE and the bot fleet (`bot/`)

| Measure | Value |
|---|---|
| `bot/src/zoe` | 467 files, 93,890 lines, **140 commits in 60 days** (the hottest directory in the repo) |
| `bot/src/hermes` | 35 / 5,974, 7 commits |
| Others | cockpit 10, devz 6, helper 7, zai 7, lib 4, fleet-agent 1 |
| ZAOstock bot | 18 `.ts` files at `bot/src/` root (per doc 2541 and `bot/REGISTRY.md`) |
| Code coupling to `src/` | **None at import level.** `grep` of `bot/src` for `../src/` imports and `@/` imports: 0 each (control: 6 files import `../lib/`, so the grep can find imports). `src/` mentions `bot/src` only as strings in `src/app/(auth)/overview/data.ts` and one comment. |
| Shared package | `packages/heart-fleet` is used by both sides: 26 files outside `packages/` and `research/` reference it, including `src/lib/heart/*` and `bot/src/zoe/scheduler.ts` |
| Deploy coupling | The VPS runs the bots from a ZAOOS clone; systemd units live in `bot/systemd/` |
| Verdict | **Stay. Graduate later.** |

Why later: the bot is where the work is, the 2026-09-23 ruling consolidates INTO `ZAOOS/bot/src`, and doc 1025's target repos were never started. Coupling to cut first: give `packages/heart-fleet` one owner (the bot), move `src/lib/heart` to call it over HTTP or drop it, and finish the zaostock-bot reconciliation.

### 4. ZAOstock

App: **graduated** 2026-05-17 (#544, "remove /stock and /api/stock from monorepo"). It lives at `ZAODEVZ/ZAOstock` (public, pushed 2026-10-19) on its own Supabase project (ZAO STOCK, doc 836 section 7). **Correction to doc 836:** its 2026-07-03 finding 1 ("ZAOstock has NOT graduated... `src/app/stock` is the #2 hottest area") is wrong. `src/app/stock` has not existed since #544; the 63 changes it counted were the history leading up to the removal.

Residue in ZAOOS:
- `ZAO-STOCK/` - 28 files (planning, standups, website notes, research, recordings index), one commit in 60 days. **Graduate now** to the ZAOstock repo's docs, or into `research/events/` if they are findings.
- The ZAOstock bot in `bot/src/` root - **stay** (see section 3) and reconcile the `zaostock-bot` fork into it.

### 5. ZAO XMTP

**Graduated** 2026-10-18 (#4011) to `bettercallzaal/zao-xmtp`. Its README: "It does not import from or call ZAOOS." Remaining in ZAOOS: `src/lib/xmtp` (3 files) behind the in-app DMs of the old client, which zao-app v1 leaves out. Nothing to do until the client graduation decides DMs.

### 6. Governance, Respect, fractals, ZOUNZ, Hats

`api/fractals` 12 files, `api/respect` 14, `api/proposals` 11, `api/zounz` 4, `api/hats` 6; components governance 6, respect 6, zounz 4, hats 3; 60-day commits 0 to 1 each. Tables: `fractal_sessions`, `fractal_scores`, `respect_events`, `respect_members`, `respect_transfers`, `proposals`, `proposal_votes`. `ZAODEVZ/ZAOfractal` is a separate live site (zaofractal.vercel.app). Whether it reads the same tables: GitHub code search for `fractal_sessions` and `respect_members` in that repo returned nothing, but that search was not checked against a known hit, so **overlap is UNVERIFIED**. **Verdict: stay (lab).** `respect_members` is read by music, social, admin, members, discord and cron, so this cluster cannot leave before the client does.

### 7. Live audio and streaming

components spaces 58 files / 9,242 lines; `api/spaces` 24, `api/100ms` 12, `api/juke` 18, `api/twitch` 12, `api/livepeer` 6, `api/overlay` 4; `src/lib/spaces` 35 / 5,929. 60-day commits: 0 to 2 per directory. Tables: `rooms`, `room_messages`, `scheduled_rooms`, `juke_spaces`, `space_sessions` and 5 more. Not in zao-app v1. Related repos: `bettercallzaal/zao-streamer-kit` (private, OBS tools), `bettercallzaal/zao-media` (archive site). **Verdict: stay, frozen**, decide after zao-app is live. The Juke partnership stands (CLAUDE.md), so this is not a delete.

### 8. Agents and trading (VAULT, BANKER, DEALER)

`src/lib/agents` 28 files / 3,080 lines, `api/agents` 4, `api/staking` 2; 60-day commits 0 / 1 / 0. Trading parameters are an ask-first area (CLAUDE.md). **Verdict: stay.** Not a graduation candidate; whether it still runs is a separate liveness question this doc did not measure.

### 9. DreamNet organism libraries

`src/lib` heart 12, cortex 7, eyes 6, ears 5, bloodstream 8, organism 3, control-plane 4, spore 14, dreamnet 16; 0 to 1 commits each in 60 days. Lab experiments by definition. **Verdict: stay.**

### 10. Publish and cross-posting

`src/lib/publish` 26 files / 4,312 lines, `api/publish` 22 / 6,503, 1 commit each in 60 days. zao-app v1 leaves it out. **Verdict: stay.**

### 11. Cards builder

Spec doc 2690 (PR #4044), plan PR #4046, Phase A PR #4047, owned by the cards lane. v1 has no sign-in, no database, no auth gate and no API route (it still passes `src/middleware.ts` for security headers and the rate limit) ("v1 saves nothing on the server, so it needs no session", plan #4046). This doc first suggested building it under `apps/zao-cards/`, as zao-xmtp was. The cards lane declined on 2026-10-20 and gave three reasons, which this doc accepts. (1) An `apps/` app brings its own `package.json`, lockfile and `node_modules` (`apps/zao-xmtp` in #4000 had both), and the Mac had 1.8 GiB free that day. (2) An `apps/` app has no URL until Zaal hosts it, while `/cards/create` ships on the existing zaoos.com deploy. (3) The coupling is small and enumerable. The code sits in three folders: `src/lib/cards` (pure logic), `src/components/cards` and `src/app/cards/create`. Its only outside imports are `@/hooks/useMiniApp` and the Inter font through the root layout's `--font-inter` variable (as reported by the cards lane; not re-read here). **Verdict: graduate later.** The cost is copying three folders and one hook, then adding `next/font` in the new layout. **Watch item:** once zao-app takes over zaoos.com (Decision 2), `/cards/create` would be served by whichever app holds that domain. Card placement is one of the questions step 4 has to answer.

### 12. Research library

2,413 numbered doc folders, 471 of the last 777 commits. **Verdict: stay** (CLAUDE.md, today's brief). The open problem is the ZAOresearch fork (Key Decision 1).

### 13. Dead code and dormant shells

| Path | Files | 60-day commits | Evidence |
|---|---|---|---|
| `packages/agents`, `config`, `db`, `publish` (`@zaoos/*`) | 15 / 4 / 4 / 15 | 0 | `git grep "@zaoos/<name>" -- . ':!packages' ':!package-lock.json' ':!research'`: 0 hits each (without `:!research` the grep also finds research docs 405 and 414, which are not code). Control: the same grep for `heart-fleet` finds 26. |
| `android/` | 53 | 0 | Capacitor shell; `capacitor.config.ts` is still at the root. Whether a store build exists was not checked. |
| `ios/` | 19 | 0 | Same as android |
| `apps/zabal-snap` | 14 | 0 | Doc 836 lists a live `zabalsnap1` Vercel project; whether it builds from here was not checked |
| `plugins/` | 20 | 0 | |
| `mcp/` | 3 | 0 | |
| `infra/hindsight` | 2 | 0 | |
| `evals/` | 6 | 0 | |

**Verdict: delete list for Zaal.** Before the mobile shells or zabal-snap go, someone confirms no store build or Vercel project builds from them.

### 14. Ops and infra

`infra/bus` 10 files (4 commits in 60 days), `infra/vps` 5 (2), `infra/portal` 38 (0), `infra/n8n` 5 (0). These run the bots and travel with `bot/` when it graduates. **Verdict: stay.**

## Order of operations

Each step is one PR or one Zaal action, and each is reversible until its delete PR merges.

1. **Research split** (Decision 1). ZAOresearch is not stale: IMan's desk writes there. Its doc 1306, about an X-thread GitHub Action ("GitHub Action: post a 2-part X thread when a new doc lands on main (IMan, approved by Zaal 2026-10-19)"; the approval is for that Action), proposes that a doc goes public only when someone opens a ZAOOS PR copying it, because some docs "were not cleared to go public". That publish-by-mirror model is 1306's own pick and is still open for Zaal as its question 4: "Public by mirror (this doc's pick) or public by default?". This doc follows the pick as the safer default until he answers. So the step is not "freeze ZAOresearch", it is: publish the 17 cleared ZAOresearch-only docs into ZAOOS (on Zaal's publish OK, with two redactions: the six personal POIDH handles in 1903 and a retired-partner mention in 1911), hold 1912 and 2300, skip 1659 (already `events/2372`) and 2260 (reverted in #3036 as "wrong recording"). Fix the ZAOresearch README line "Graduated out of ... ZAOOS", which now misdescribes a two-library setup.
2. **zao-app goes live** (Decision 2). Zaal adds env vars to a new Vercel project for zao-app, smoke-tests it on a preview URL (`scripts/smoke-live.sh` exists in zao-app), then flips zaoos.com. Rollback: point the domain back at the ZAOOS project.
3. **Port the drift** (ZAOOS commits after 2026-10-16 that touch v1 scope, starting with #4037) into zao-app before or right after the flip.
4. **Delete the v1-scope copy from ZAOOS** (the zao-xmtp step). What stays in ZAOOS `src/` afterwards is the lab: DMs, governance, publish, spaces, agents, admin. It then needs its own non-production URL, which is Zaal's call.
5. **`ZAO-STOCK/` docs** move to the ZAOstock repo (Decision 4).
6. **Dead-code deletes** (Decision 6), one PR, on Zaal's word.
7. **Bot, later** (Decision 5): finish the zaostock-bot reconciliation, give `heart-fleet` one owner, then revisit with a fresh measurement.

Cards (Decision 3) runs in parallel with all of it and is unaffected.

## Risks

| Risk | Where | Mitigation |
|---|---|---|
| A third fork: a new repo goes live and the ZAOOS copy keeps getting commits | Every graduation | The delete PR is part of the graduation; until it merges, the ZAOOS copy carries a README line saying it is frozen |
| zaoos.com outage at the flip | Step 2 | Preview URL first; domain moves back in one change |
| Session and data breakage: both apps read one Supabase project and one `SESSION_SECRET` | Step 2 to 4 | zao-app keeps the same Supabase project for v1 (doc 2660 already says the app stays on Supabase); a separate database is a later, separate decision |
| VPS bots run from a ZAOOS clone | Any change to repo layout | Nothing in this plan moves `bot/` |
| Publishing a doc that was not cleared | Step 1 | Every ported doc read in full and PII-scanned first; 1912 and 2300 held; a PR on public ZAOOS publishes its diff, so the branch is not pushed before the OK |
| Deleting a shell something still builds from | Step 6 | Check store builds and Vercel projects first |

## Also See

- [Doc 836](../836-zaoos-repo-estate-census/) - the July census; its ZAOstock finding is corrected above
- [Doc 1025](../1025-zaoos-estate-split-design/), [Doc 1124](../1124-estate-split-manifest/) - the unexecuted docs-only split
- [Doc 2263](../2263-zaoresearch-graduation-decision/) - the research graduation that became a fork
- [Doc 2541](../../agents/2541-one-agent-or-many-bots/) - the zaostock-bot fork
- [Doc 2684](../../farcaster/2684-zao-xmtp-standalone-app/) - the clean graduation to copy
- [Doc 692](../692-cowork-zaostock-unified-db/) - ZAOstock and cowork data

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| OK to publish the 17 cleared ZAOresearch-only docs in public ZAOOS | @Zaal | Decision | Gated (public) |
| Port the 17 (branch prepared locally, not pushed) | zaoos-split lane | PR | After the OK |
| Add env vars to a zao-app Vercel project, preview, then flip zaoos.com | @Zaal | Manual | Gated (Vercel, DNS) |
| Port post-2026-10-16 v1-scope ZAOOS commits into zao-app | zao-app lane | PR | Before the flip |
| Delete the v1-scope copy from ZAOOS | zaoos-split lane | PR | After 24h live on zao-app |
| Re-check the card builder coupling (3 folders + `useMiniApp`) before step 4 | zaoos-split lane | Check | Before the v1 copy is deleted |
| Move `ZAO-STOCK/` docs to the ZAOstock repo | zaoos-split lane | PR | Zaal's yes |
| Delete-list PR (section 13) | zaoos-split lane | PR | Zaal's word |
| Mark docs 1025, 1124, 2263 `superseded-by: 2691` | zaoos-split lane | PR | Zaal's yes |

## Sources

- [FULL] ZAOOS working tree at `b0b1f18a0`, measured with `git ls-files`, `wc -l`, `git log --since=60.days`, `git grep` (commands in each section)
- [FULL] GitHub REST API via `gh api` and `gh repo view`, read 2026-10-20: READMEs and commit lists of `bettercallzaal/zao-app`, `bettercallzaal/zao-xmtp`, `bettercallzaal/zao-community-client`, `ZAODEVZ/ZAOresearch`, `ZAODEVZ/ZAOstock`, `ZAODEVZ/ZAOfractal`, `ZAODEVZ/ZAOcowork`, `bettercallzaal/zao-media`, `bettercallzaal/zao-streamer-kit`, `bettercallzaal/ZAOMixZ`; recursive tree of `ZAODEVZ/ZAOresearch` main for the doc-folder diff
- [FULL] `curl -sI` and status codes against https://zaoos.com, 2026-10-20 11:01 EDT, with a 404 control
- [PARTIAL] `gh search code` in `ZAODEVZ/ZAOfractal` and `bettercallzaal/zao-fractal-bot`: empty, instrument not proven, treated as UNVERIFIED
- [FULL] ZAOOS PRs #544, #1056 (closed unmerged: doc 836 was never renumbered, the 836 collision remains), #4000, #4011, #4044, #4046
- [FULL] Zaal's 2026-09-23 ruling on the zaostock-bot fork and the 2026-10-16 zao-app build update, both read from his private notes
