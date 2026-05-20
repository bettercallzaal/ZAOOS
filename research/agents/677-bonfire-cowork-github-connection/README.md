---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-20
related-docs: 650, 665, 669, 673, 676
tier: STANDARD
---

# 677 - Connecting the Bonfire to the cowork-zaodevz GitHub Repo

> **Goal:** ZAOcoworkingBot v0.3.1 already pipes Telegram tracker events (/add /done /wip) into the ZABAL bonfire. The GitHub side of the same repo - commits, PRs, issues - does not flow in. This doc specs a GitHub Actions workflow that closes that gap, so the knowledge graph holds both the "what the team tracked" and "what the team built" record.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Wire cowork-zaodevz GitHub events into the bonfire | YES, ship it | The bot covers tracker mutations; the repo's commits/PRs/issues are the dev half of the same story. Both halves in one graph = ZOE can answer "what did the team build AND track this week." |
| GitHub Actions workflow vs webhook-to-VPS | **GitHub Actions** | No new infra. The Action runs in GitHub's CI on the events we care about. A webhook would need a public endpoint on the VPS + its own auth + uptime. Actions is the lower-surface choice. |
| Reuse `agent/src/teams/bonfire.ts` or standalone script | **Standalone script** in `.github/scripts/bonfire-git-event.mjs` | `bonfire.ts` is TS compiled into the bot runtime. CI shouldn't `npm install` the whole agent to post one episode. A ~70-line Node script with native `fetch` (zero deps, Node 20+ on `ubuntu-latest`) mirrors the same `eventToEpisode` shape, git-event flavored. |
| Ingest commits that only touch `data/actions.json` | **NO - skip them** | The bot ALREADY live-ingests every tracker mutation. The bot writes `data/actions.json` via Octokit on every /add /done. Ingesting those commits too = exact duplication. The workflow path-filters: ingest commits touching `agent/`, `src/`, `.github/`, root configs - NOT `data/`-only commits. |
| Episode idempotency | source_description carries the git ref | `cowork-github:push:<sha>`, `cowork-github:pr:<number>`, `cowork-github:issue:<number>`. Same SHA can't double-post; a re-run of the Action is harmless. |
| BONFIRE_API_KEY storage | GitHub Actions repo secret | Settings -> Secrets and variables -> Actions. Never in the workflow file. BONFIRE_ID can be a secret too or a plain env (it's not sensitive, but secret keeps it uniform). |
| cowork dashboard surfaces bonfire data | DEFER to a Phase 2 | The Next.js web app could show a "bonfire activity" panel, but that needs the vector store labeled first (admin-gated, see doc 676). Ship the write path now; dashboard read later. |

## The gap, concretely

```
TODAY
  Telegram /add /done /wip  -> ZAOcoworkingBot v0.3.1 -> bonfire episode   COVERED
  git commit / PR / issue   -> (nothing)                                  GAP

AFTER THIS DOC
  git commit / PR / issue   -> GitHub Action -> bonfire episode            COVERED
```

The cowork-zaodevz repo has NO `.github/workflows/` directory today (verified 2026-05-20). Clean slate - this is the repo's first workflow.

## Episode taxonomy for git events

Each git event becomes one natural-language episode. Bonfires auto-extraction pulls entities (the repo, the author, the PR, files) from the text.

| Event | Trigger | Episode body shape |
|---|---|---|
| Commit landed | `push` to `main` | "`<author>` landed commit `<short-sha>` on cowork-zaodevz: `<message first line>`. Files: `<changed paths summary>`." |
| PR opened | `pull_request` `opened` | "`<author>` opened PR #`<n>` on cowork-zaodevz: `<title>`. `<body excerpt>`." |
| PR merged | `pull_request` `closed` + merged | "PR #`<n>` merged into cowork-zaodevz main: `<title>`, by `<author>`, `<N>` commits, `<additions>`/`<deletions>` lines." |
| Issue opened | `issues` `opened` | "`<author>` opened issue #`<n>` on cowork-zaodevz: `<title>`. `<body excerpt>`." |
| Issue closed | `issues` `closed` | "Issue #`<n>` closed on cowork-zaodevz: `<title>`." |

Every body ends with the brand tag so the KG groups under the right node:
`This is dev activity on the cowork-zaodevz repo - the ZAO Devz team's action tracker, part of the ZABAL ecosystem.`

## Build spec - the GitHub Action

### File 1: `.github/workflows/bonfire-sync.yml`

```yaml
name: bonfire-sync
on:
  push:
    branches: [main]
    paths-ignore:
      - 'data/**'          # bot already ingests tracker mutations
  pull_request:
    types: [opened, closed]
  issues:
    types: [opened, closed]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2     # need parent for the diff summary on push
      - name: post episode to ZABAL bonfire
        env:
          BONFIRE_API_KEY: ${{ secrets.BONFIRE_API_KEY }}
          BONFIRE_ID:      ${{ secrets.BONFIRE_ID }}
          EVENT_NAME:      ${{ github.event_name }}
          EVENT_JSON:      ${{ toJSON(github.event) }}
        run: node .github/scripts/bonfire-git-event.mjs
```

`paths-ignore: data/**` is the dedup guard - commits that only touch the tracker JSON are skipped because the bot covers them.

### File 2: `.github/scripts/bonfire-git-event.mjs`

~70 lines, zero deps, native `fetch` (Node 20 on `ubuntu-latest`). Responsibilities:

1. Parse `EVENT_NAME` + `EVENT_JSON` (the full `github.event` payload).
2. Branch on event type -> build `name` + `episode_body` + `source_description` per the taxonomy table.
3. For `pull_request` `closed`: only post if `event.pull_request.merged === true` (skip closed-unmerged).
4. POST to `https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create` with:
   ```json
   {
     "bonfire_id": "<BONFIRE_ID>",
     "name": "cowork-github:<type>:<ref>",
     "episode_body": "<natural language>",
     "source": "text",
     "source_description": "cowork-github:<type>:<ref>",
     "reference_time": "<event timestamp ISO>"
   }
   ```
5. `Authorization: Bearer <BONFIRE_API_KEY>`. 15s timeout via `AbortSignal.timeout`.
6. Log the `task_id` on 200. On non-2xx: print the error + `process.exit(1)` so the Action shows red (a failed bonfire post should be visible, not silent - the run is cheap to re-trigger).
7. A minimal inline secret check: refuse to post if the episode body matches an obvious key pattern (mirrors `scripts/bonfire-ingest/secret_scan.py` HIGH set) - PR titles/bodies are user text and could contain a pasted token.

### Secrets to add (Iman, repo settings)

| Secret | Value | Where |
|---|---|---|
| `BONFIRE_API_KEY` | the bonfire key (same one in the VPS `.env`) | github.com/songchaindao-dot/cowork-zaodevz/settings/secrets/actions |
| `BONFIRE_ID` | `69ef871f0d22ed7e6f2b243a` | same |

## data/actions.json - read from it or not?

**Not separately.** Three reasons:
1. The bot's live ingest already fires on every mutation - `data/actions.json` is the *result* of those mutations, not new information.
2. A periodic "read the whole file + diff" job would re-post episodes for items that haven't changed.
3. The `paths-ignore: data/**` filter on the workflow means even direct human edits to `data/actions.json` won't double-fire - but those are rare (the bot owns that file).

If the bot is ever offline for a stretch and tracker mutations are lost, a one-shot backfill script (re-using `scripts/bonfire-ingest/IngestPipeline`) can replay `data/actions.json` - but that's a recovery tool, not the steady-state path.

## cowork dashboard surfacing bonfire data

The cowork-zaodevz Next.js web app could add a "bonfire activity" panel - recent episodes, a search box over the KG. **Deferred** because:
- Vector search returns empty until an admin runs labeling on the bonfire (doc 676, admin-gated).
- Until labeling, the only working read paths are the bonfires.ai dashboard + @zabal_bonfire on Telegram.
- Once labeling lands (doc 676 Next Actions), a thin `/api/bonfire/search` route + a panel is a ~4h add - cross-referenced to doc 676d's `/search` build spec, which is the same surface.

## Hard Numbers

- 0 GitHub workflows exist on cowork-zaodevz today - this is the first
- ~70 LoC for the standalone poster script, 0 npm deps
- 5 git event types mapped to episodes
- 2 repo secrets to add
- 15s HTTP timeout per post
- Episode endpoint verified 2026-05-19: `POST /knowledge_graph/episode/create` -> 200 with the non-admin key
- `paths-ignore: data/**` = the one-line dedup guard against double-ingest

## Risks

| Risk | Mitigation |
|---|---|
| PR/issue body contains a pasted secret | Inline HIGH-pattern secret check in the script; refuse + exit non-zero |
| Bonfire API down during a CI run | Script exits 1, Action shows red, re-run is one click. No retry spool in CI (unlike the bot) - keep it simple; a missed git episode is low-stakes vs a missed tracker event |
| Double-ingest with the bot | `paths-ignore: data/**` + distinct `source_description` namespaces (`cowork-github:` vs the bot's `zaocoworking-bot:`) |
| Rate limits if many PRs merge fast | Unknown Bonfires limit - flag to Joshua (doc 676 consolidated questions). Git events are low-frequency vs tracker events; low concern |

## Also See

- [Doc 665](../665-bonfires-deep-dive-zao-integration/) - Bonfires deep dive
- [Doc 669](../669-bonfires-everything-we-know/) - canonical Bonfires hub
- [Doc 673](../673-zoe-bonfires-dialog-automation/) - ZOE-Bonfires Phase 2
- [Doc 676](../676-bonfires-kg-utilization/) - 6 KG utilization vectors; 676b (cross-bot KG) is the parent pattern this doc instantiates for git events
- `scripts/bonfire-ingest/` in ZAOOS - the Python ingest pipeline + secret_scan (the secret-check pattern this workflow mirrors)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add `BONFIRE_API_KEY` + `BONFIRE_ID` repo secrets on cowork-zaodevz | @Iman | Repo settings | Before the workflow runs |
| Build `.github/workflows/bonfire-sync.yml` + `.github/scripts/bonfire-git-event.mjs` per this spec | Next session | PR on cowork-zaodevz | This week |
| Smoke test: push a no-op commit, confirm an episode lands (check spool / dashboard) | @Iman | Test | After merge |
| Confirm Bonfires API rate limit with Joshua (shared question with doc 676) | @Zaal | DM | This week |
| Phase 2: cowork dashboard bonfire panel - after labeling unlocks vector search | Next session | PR | After doc 676 labeling action |

## Sources

- Bonfires API OpenAPI spec - https://tnt-v2.api.bonfires.ai/openapi.json (verified 2026-05-19, `POST /knowledge_graph/episode/create`)
- GitHub Actions events reference - https://docs.github.com/en/actions/reference/events-that-trigger-workflows (push, pull_request, issues)
- `github.event` context + `toJSON()` - https://docs.github.com/en/actions/learn-github-actions/contexts (verified 2026-05-20)
- cowork-zaodevz repo - https://github.com/songchaindao-dot/cowork-zaodevz (no `.github/` dir as of 2026-05-20)
- Doc 665, 669, 673, 676 - prior ZAO Bonfires research
