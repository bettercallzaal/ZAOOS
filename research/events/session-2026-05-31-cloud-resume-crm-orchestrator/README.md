# Session handoff - 2026-05-31

> from: Zaal mac (`~/Documents/ZAO OS V1`, iCloud-corrupted) -> to: fresh Claude Code CLOUD terminal
> doc: research/events/session-2026-05-31-cloud-resume-crm-orchestrator/README.md
> chain: sibling:research/events/session-2026-05-30-bonfires-kernel-deep-dive/README.md

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet:

1. **CLONE FRESH. Do NOT pull the mac repo.** The source mac repo lives in `~/Documents`, which is iCloud-synced, and iCloud corrupted `.git` four times last session (truncated packfiles, broken `refs/stash 2`, dup `* 2.*` files). On a cloud container this is moot - just `git clone https://github.com/bettercallzaal/ZAOOS.git` clean. Everything below is pushed to origin; a fresh clone loses zero committed work.
2. Read sections A-E before acting.
3. Section C has NO diff to apply - clone fresh instead. All work is on origin in branches/PRs.
4. Create TaskList entries from section A.
5. Use section B as your "why" - do not re-litigate.
6. Note the VPS SSH caveat (section D) before attempting any VPS command.
7. Message back: "Ingested handoff cloud-resume-crm-orchestrator. N tasks queued. Ready."

## A. Tasks to absorb (most are GATED on Zaal - check the gate)

- [ ] (Zaal) **Verify + merge PR #745** - DM `@zaoclaw_bot` `plan: test routing` (expect "Decomposing into a routed plan - one moment.") + a recall question (e.g. "what do you remember about ZAOstock") to confirm the superseding orchestrator + recall work live. If good, merge #745. It's MERGEABLE (conflicts resolved this session).
- [ ] (Zaal) **Merge PR #746** (doc 775 - 2026 capability synthesis) + **close PR #735** (Fileverse `#k=` is a public share key, not a secret - nothing to fix).
- [ ] (VPS SSH) **After #745 merges: redeploy main to VPS** - `ssh zaal@31.97.148.88 'cd ~/zao-os && git fetch origin && git reset --hard origin/main && systemctl --user restart zoe-bot'`. Use `reset --hard origin/main`, NOT `git pull` (pull gets blocked by a dirty package-lock). VPS is currently on the `claude/amazing-cray-11bSV` (#745) branch ahead of main - this fast-forwards it clean.
- [ ] (Zaal) **Apply `scripts/20260529_crm.sql`** in the Supabase SQL editor (no CLI on the box). Unblocks CRM live QA.
- [ ] (Zaal + VPS SSH) **Set `CRM_BOT_SECRET`** (Vercel app env + VPS `~/zao-os/bot/.env`, same value) + **`CRM_API_URL=https://zaoos.com`** (VPS bot env) so ZOE can write to the CRM.
- [ ] (Claude, after migration + secrets) **CRM end-to-end QA** - bot write, /crm admin dashboard, /network public feed, visibility enforcement.
- [ ] (Claude, optional) **#6 Bonfire episode emit on public CRM interactions** - deferred, needs a design call (app-side poster + PII scan; `bonfire_episode_id` column already in schema).
- [ ] (Zaal, optional) **Allow `@zabal_bonfire_bot`** in ZAO Civilization (app.bonfires.ai) - recall already works without it.
- [ ] (Zaal, recommended) **Relocate the mac repo out of iCloud** to `~/dev/ZAOOS` (fresh clone) if you keep using the mac at all - otherwise corruption recurs. Moot if you stay on cloud.

## B. Why - decisions + friction + ruled-out paths

- **iCloud corrupts `.git`.** The mac repo is in `~/Documents` (iCloud-synced). iCloud copies `.git` files mid-write -> truncated packfiles + `* 2.*` dup artifacts (saw `.git/gc 2.pid`). Hit 4x: broken `refs/stash 2`, 2 corrupt packs (fixed via `git fetch --refetch` with `http.postBuffer 1048576000`), corrupt `node_modules/vitest` config (broke local `vitest`). FIX: work on cloud (clean) or relocate off `~/Documents`. This is the single biggest friction source - do not re-discover it.
- **ZOE recall: root cause was the WRONG ENDPOINT, not labeling.** `recall.ts` used `POST /vector_store/search` (empty for this bonfire) instead of `POST /delve {bonfire_id, query}` (the SDK's real graph path, returns 51 episodes for "What is ZAO?"). The "needs admin labeling / doc 680" belief was wrong - labeling is platform-internal. Fixed (PR #740, merged) + WIRED into the concierge (PR #744, merged) as a `<bonfire_recall>` RAG block per DM turn. Proven live: journal showed `[zoe/recall] delve: 5 hit(s)`.
- **PR #745 supersedes the already-merged-and-live #733.** Both implement the doc-770 orchestrator HIGH fixes; #745 is fuller (pure `commands.ts` predicates + all H1-H5 + 6 test files). Zaal chose resolve-and-supersede. Resolved 5 conflicts: 4 orchestrator files took #745's version; index.ts is a union (#745 structure + main's recall/CRM/relay wiring). Removed dead `isCommandPrefixed` (#745 uses `isZoeCommand`). Bot `tsc` clean. Deployed to VPS branch + boots clean. Behavioral verify (plan:routing) is the open gate.
- **CRM auth model: NO Supabase Auth.** ZAOOS uses iron-session + service-role. Private layer enforced at app layer (isAdmin + service-role reads); anon only sees curated SECURITY DEFINER views; RLS denies anon on base tables. Differs from doc 772's first-draft `auth.uid()` design. Tables are `crm_contacts`/`crm_interactions` (crm_ prefix to avoid the dormant legacy `contacts` table).
- **Bonfires FCG kernel is proprietary** (0 public NERDDAO code); substrate is the getzep/graphiti fork (GLiNER2 + Gemini + Neo4j bi-temporal). BUT the live API (190 endpoints) exposes typed intake (`/knowledge_graph/add_triples`, typed `/entity`+`/edge`, `/ontology/*`) - so ZAO is not stuck with prose episodes. Doc 771 corrected (trimtab is NOT the kernel - it's Tracery/n-gram/HDBSCAN). Highest-leverage next build per doc 775 = typed-triple ingestion.
- **VPS SSH is the only mac-tether.** All VPS work goes through `ssh zaal@31.97.148.88`. A cloud container needs that key added once before it can run VPS commands; else Zaal runs them with `!` or from the mac.
- **Use `git reset --hard origin/main` to redeploy the VPS, never `git pull`** - pull gets blocked by a dirty `bot/package-lock.json` on the box (discovered when a "merged all PRs" deploy silently left the VPS on stale main running the old recall code).

## C. Git state

- Source mac repo is iCloud-CORRUPTED - do not pull it. Clone fresh from `https://github.com/bettercallzaal/ZAOOS.git`.
- All work is on origin. Open PRs: **#745** (orchestrator, MERGEABLE), **#746** (doc 775), **#735** (Fileverse key - close it). Merged this session: #733, #736 (doc 771 fix), #739 (CRM code), #740 (recall fix), #741 (doc 771 API findings), #744 (recall wiring).
- Untracked on the mac (NOT committed, will not survive a fresh clone - mostly other sessions' WIP, low value): `research/agents/770-zoe-cowork-systems-audit-consolidation/`, `research/dev-workflows/2027-*`, `research/farcaster/2027-*`, prior session bundles. If any matter, they're on the mac only.

## D. In-flight

- Background bash jobs: none active.
- VPS state: on branch `claude/amazing-cray-11bSV` (#745) at `6b873600`, booting clean. Redeploy main after #745 merges.
- Open PRs awaiting Zaal: #745, #746, #735.
- Scheduled wakeups: none. Open AskUserQuestion: none.

## E. Cold-start map

- Files touched this session (all pushed): `bot/src/zoe/{recall,concierge,index,types,crm,memory,relay}.ts`, `bot/src/hermes/claude-cli.ts`, `bot/src/zoe/{dispatch,scheduler,workers,commands}.ts` (via #745 merge), `src/app/{network,crm}/**`, `src/app/api/crm/interactions/route.ts`, `src/lib/crm/types.ts`, `src/lib/env.ts`, `scripts/20260529_crm.sql`, docs `research/identity/771-*`, `research/business/772-*`, `research/agents/{773,775}-*`.
- Skills invoked: `/zao-research` x2 (docs 772, 775), `/clipboard`, `/handoff` (this).
- Memory writes: `project_bonfire_delve_recall` (new - recall via /delve not vector_store).
- Last-known mental model: Huge session - shipped CRM (Supabase-native), fixed + wired ZOE recall (live + proven), corrected doc 771, resolved PR #745 (supersedes live #733, deployed to VPS branch), wrote capability-synthesis doc 775. Everything is on origin in PRs. The remaining work is mostly Zaal merging PRs + applying the CRM migration + setting 2 secrets; then Claude runs CRM QA. The mac repo is iCloud-corrupted - resume on cloud with a fresh clone.
- Open questions for receiver: none blocking - just wait on Zaal's merges/migration/secrets, then proceed.

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/session-2026-05-31-cloud-resume-crm-orchestrator/README.md and follow receiver instructions at the top. Clone fresh (mac repo is iCloud-corrupted). ~9 tasks, most gated on Zaal.
```
