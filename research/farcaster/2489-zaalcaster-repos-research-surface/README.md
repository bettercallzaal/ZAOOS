---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: 998, 1026, 1025, 045, 2474, 997, 306, 2245
original-query: "how we can best organize github repos lets make that part of farcaster and seeing through all my reserach documents on farcaster and then being able to use them i am going to start using zaal caster as my main interface"
tier: STANDARD
---

# 2489 - zaalcaster as the operating surface: GitHub repos + the research library, inside the Farcaster client

> **Goal:** Decide how the GitHub estate (184+ repos owner-visible across bettercallzaal and ZAODEVZ; 131 if you only count what's public, which is what the earlier "130-repo" figure below actually measured) gets organized so it is legible from inside zaalcaster, and how the research library becomes readable and usable from the same screen, given Zaal's statement that zaalcaster is becoming his main interface. Originally measured live on 2026-09-15; re-verified 2026-09-25 (Re-Research Mode) - see "Updated 2026-09-25" below for what changed.

## Updated 2026-09-25

**One central claim needs correction, and it was true on 2026-09-15 too: "the 130-repo estate" only ever counted PUBLIC repos.** Every count in this doc (110/20/130, then 111/20/131) came from `gh api users/{login}/repos`, an endpoint that structurally excludes private repositories no matter who is authenticated - so it was never able to see the private count either, and the doc's original "21 private" figure could not have come from that call. Re-measured 2026-09-25 with owner-authenticated `gh repo list` (which does include private repos): **bettercallzaal owns 161 repos (111 public + 50 private, 28 archived - not 21 private, not 21 archived)**, and bettercallzaal is additionally a collaborator on 3 private ZAODEVZ repos (`IMan-Artizen`, `iman-desk`, `ZAOresearch`), for **23 ZAODEVZ repos bettercallzaal can see (20 public + 3 private)**. That is **at least 184 repos**, not 130/131 - and ZAODEVZ's true private total is UNKNOWN beyond those 3, since bettercallzaal does not own that account and cannot enumerate repos it has no access to. `bettercallzaal/zao-repos` itself says as much in its own data (`"note": "Public repositories only. Private repositories are never fetched or published by this workflow."`) - its 131-repo figure is the same scoped subset, not a bug, but it was being read in this doc's summary table as "the estate," which undercounts by at least 53 repos. Below that, the read-path half of the plan shipped; the write-path half (topics, the search-index fix, brand-preference in zao-repos) did not move.

- **The zaalcaster PR shipped.** Decision 6 / Next Actions row 2 is CONFIRMED DONE: PR #133 "feat: repos + research library surfaces (doc 2489)" merged 2026-09-16T00:26Z, and a same-day follow-up PR #134 "feat: Search tab scopes - research library + ZAO repos" also merged. `api/view.js` on `main` today carries `kind === 'repos'` (line 276), `kind === 'research_index'` (line 292) and `kind === 'research_doc'` (line 306), exactly as specced.
- **Topics were STILL NOT applied.** Was "1 of 130 repos carries a topic" (sparkz only); now **1 of 131 repos** (bettercallzaal grew to 111, ZAODEVZ still 20) - still only `sparkz`, still the same ten topic strings. Next Actions row 4 (apply topics to ~25 canonical repos, due 2026-09-19) did not ship. `bettercallzaal/zao-repos`'s own hygiene check confirms the same count independently: `noTopics` failing 130 of 131 repos in the live `data.json` generated 2026-09-26T01:34Z.
- **`research/search-index.json` is UNCHANGED and still broken.** Byte-identical in size (66,143 bytes) to the 2026-09-15 measurement; `"num":026` is still an unquoted, zero-padded literal, so it is still not valid JSON (`json.load` still fails at line 2). Next Actions row 5 (rebuild emits valid JSON, 2,209 rows) did not ship. This is the one Next Action most worth escalating - it is the same fix originally scoped in this doc, untouched after 10 days.
- **`zao-repos` gained a LICENSE.** Was "no LICENSE file" on 2026-09-15; now MIT, "Copyright (c) 2026 Zaal Panthaki / BCZ Strategies LLC / The ZAO", read directly from `contents/LICENSE`. Next Actions row 7's LICENSE half is DONE; its other half (prefer a `brand-*` topic over the name regex in `scripts/fetch.mjs`) is NOT done - `fetch.mjs`'s `BRANDS` array (line 32) is still pure name-regex matching, no topic check, confirmed by re-reading the file.
- **CLAUDE.md and doc 2245 still do not mention zao-repos.** Next Actions row 8 (add it to both) did not ship - `grep -rn zao-repos` against `~/zaal-dotfiles/claude/CLAUDE.md` and `infrastructure/2245-zaoos-surface-map/README.md` both return nothing.
- **`GITHUB_TOKEN` in Vercel and `kind=research_search`: still UNKNOWN/not shipped.** Vercel env cannot be read from this machine. `api/view.js` on `main` has no `research_search` kind and no code-search call, so Next Actions rows 3 and 6 (set the token; add the code-search kind) are NOT done, not merely unverified.
- **Estate growth, re-measured 2026-09-25:** public-only count is 131 repos (bettercallzaal 111, ZAODEVZ 20 - was 110/20/130); the full owner-visible count is **184+ (bettercallzaal 161, ZAODEVZ 23 visible)** - see the correction above. GitCast (`gitcast.dev`) still has no DNS A record (`dig` empty, curl `000`) and `farcaster-cast-github-action` is unchanged (1 star, last push 2024-05-11) - both still dead ends, unchanged.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Organizing primitive for OWNED repos | **USE GitHub repository topics. SKIP Star Lists and custom properties.** | Topics: REST read + write per repo (`PUT /repos/{o}/{r}/topics`), max 20 per repo, searchable with `user:bettercallzaal topic:X` (live: `topic:farcaster` returns 1 repo, `sparkz`), readable by a browser with no token. Custom properties are org-only and both accounts are `type=User`. Star Lists are GraphQL-only, capped at 32, need the `user` scope to write, and only hold STARRED repos, not owned ones. Today **1 of 130 repos carries a topic**. |
| 2 | Taxonomy | **Three topic families per repo: one `brand-*`, one `status-*`, one or more `kind-*`.** Seed from doc 998's canonical list (about 25 repos). | A repo with `brand-wavewarz status-canonical kind-site` is filterable from any client in one API call. Doc 998's keep/archive verdicts already exist; archiving moved from 3 repos (July) to 21 (today) under bettercallzaal, so the cleanup is half done and topics finish the legible half. |
| 3 | The repo ledger (doc 1026 rec #5, `REPOS.md`) | **Do not hand-write REPOS.md. Topics ARE the ledger; zaalcaster renders it.** Optionally regenerate a `docs/REPOS.md` in ZAOOS from `gh repo list --json name,repositoryTopics` for readers without the app. | `gh search code filename:REPOS.md` across both accounts finds only `ZAOOS/docs/FUTURE_REPOS.md`, a 2025 services wishlist, not a ledger. Two months after the recommendation nothing shipped because a hand-maintained file has no writer. A generated one has. |
| 4 | Research library inside zaalcaster | **Read the library straight from GitHub. ZAOOS is public (`private:false`, verified live), `raw.githubusercontent.com` answers with `access-control-allow-origin: *` and `cache-control: max-age=300`.** Zero backend, zero new Vercel function. | `research/farcaster/README.md` fetched via the contents API at 40,090 bytes; the 22 topic READMEs total 1.0 MB, so fetch per topic, not all at once. |
| 5 | The research index | **Make `zao-research-index --rebuild` also emit `research/search-index.json` and commit it.** zaalcaster fetches that one file and filters client-side; full-text goes through GitHub code search server-side. | The committed `search-index.json` is **202 entries, last touched 2026-04-05** (commit `a0f86aa5d`), while the disk has 2,209 docs and the local FTS5 db has 2,240 rows. The ranked index lives at `~/.zao/zao-research-index.db`, which no deployed app can reach. Code search `repo:bettercallzaal/ZAOOS path:research/farcaster SIWN` returns 11 hits live; it needs a token (30 req/min authenticated). |
| 6 | Where it lives in zaalcaster | **Fold into `api/view.js` as three new kinds (`repos`, `research_index`, `research_doc`) and render inside the existing Brands hub (`config.js` `brands`), one section per brand: channel feed, repos by `brand-*` topic, research by topic folder, links.** No new api file. | `api/` holds 12 function files plus `cron/post-due.js`; the last production deploy (`a40fea6`, 2026-09-13) succeeded, so the count is at the limit, not over it. `api/view.js` already dispatches 12 kinds (`profile`, `poidh_bounty`, `link_preview`, ...); adding kinds costs nothing. |
| 7 | "Make that part of Farcaster" | **Share-to-cast is a Compose PREFILL with the repo or doc URL as the embed. Never an Action, never automatic.** | The standing no-autopost rule. The marketplace action `farcaster-cast-github-action` (cast on release via a Neynar signer) has 1 star, no LICENSE file (all rights reserved), last activity 2024-05-11. GitCast, the closest prior art for "GitHub inside Farcaster", has no DNS A record today; its MIT server repo last moved 2025-08-29. Both are patterns to read, not dependencies to take. |
| 8 | Token | **Set a read-only `GITHUB_TOKEN` in Vercel for `api/view.js`.** Unauthenticated `api.github.com` is 60 req/hr per IP (header `x-ratelimit-limit: 60` measured); a fine-grained token with no repo permissions gets 5,000/hr on public data and unlocks code search. | One env var, same pattern as `EMPIRE_BUILDER_API_KEY` and `JUKE_API_KEY`. |

## Update, same day (2026-09-15, after Zaal pointed at zao-repos)

**The ledger renderer already exists and this doc missed it.** `bettercallzaal/zao-repos` (created 2026-09-12, https://bettercallzaal.github.io/zao-repos) is a GitHub Pages dashboard rebuilt hourly (`cron: 17 * * * *`, default `GITHUB_TOKEN`, GraphQL pinned to `privacy:PUBLIC`) over `bettercallzaal`, `ZAODEVZ` and `ZAO-DEVZ`. It publishes `docs/data.json`: 281,403 bytes, 130 repos, `access-control-allow-origin: *`, `cache-control: max-age=600`, generated 2026-09-15T22:14Z. Per repo it already carries stars, forks, commits at 30/90/365 days, contributors, languages, topics, licence, README/LICENSE/.gitignore/.env.example/CLAUDE.md presence, CI workflow names, last run conclusion, package.json framework, a homepage liveness probe (`{status, finalUrl, checkedAt}`, 68 of 71 probed at 200, 3 at 404), a `staleness` label (21 hot, 55 active, 26 cooling, 18 warm, 10 dormant), a 7-check `hygiene` score, and a `brand` label derived from a name regex in `scripts/fetch.mjs` (20 lines: ZAO Core 20, Experiments 16, Client Work 12, Agents & Bots 11, Fractal 11, ZABAL 8, WaveWarZ 6...). It was not in the research library, the tracker, or CLAUDE.md, and the repo has no LICENSE file.

What changes above:

- **Decision 3 (generate `docs/REPOS.md`)**: SUPERSEDED. The Portfolio tab is that ledger. The Next Actions row for it is withdrawn below.
- **Decision 6 (`kind=repos` calls the GitHub API)**: CHANGED. `kind=repos` fetches `data.json` from the Pages host instead: one request, no token, every field the Brands hub needs. The GitHub token is now only for `kind=research_search` (code search).
- **Decision 2 (topics)**: STRENGTHENED, not replaced. The dashboard measures **129 of 130 repos with no topics** and its own hygiene check fails them for it. Its `brand` regex misfiles by name (zaalcaster lands in `Personal`, commits30 reads 1), which is exactly what an explicit `brand-*` topic fixes. Once topics exist, `fetch.mjs` should prefer a `brand-*` topic over the regex (one `if` before the regex loop).
- **Decision 5 (research index)**: unchanged; zao-repos is repos only.
- zaalcaster row in the dashboard: brand `Personal`, hygiene 71/100, staleness `hot`, homepage probed at `zaalcaster.vercel.app` (the GitHub `homepage` field predates z.thezao.xyz).

## Findings

### 1. The estate, measured 2026-09-15

| Account | Repos | Private | Archived | With any topic | Pushed in Sept 2026 |
|---------|-------|---------|----------|----------------|---------------------|
| bettercallzaal | 110 | 21 | 21 | 1 | 17 |
| ZAODEVZ | 20 | 0 | 0 | 0 | 7 |
| total | 130 | 21 | 21 | 1 | 24 |

Ten distinct topic strings exist across both accounts, all on `sparkz` (`farcaster`, `clanker`, `base`, `creator-economy`, `ai-agents`, `web3`, `nextjs`, `supabase`, `typescript`, `memes`). Pinned repositories on bettercallzaal: none (GraphQL `pinnedItems` returns an empty list). Doc 998 counted 129 repos and 3 archived on 2026-07-09; archival has advanced by 18, the topic count has not moved.

**Owner-authenticated re-count, 2026-09-25** (this table above is public-only and was the same limitation on 2026-09-15; see the correction at the top of this doc):

| Account | Total (owner view) | Public | Private | Archived | With any topic |
|---------|--------------------|--------|---------|----------|-----------------|
| bettercallzaal | 161 | 111 | 50 | 28 | 1 |
| ZAODEVZ (visible to bettercallzaal as collaborator) | 23 | 20 | 3 | 0 | 0 |
| total (known floor) | 184 | 131 | 53 | 28 | 1 |

Method: `gh repo list bettercallzaal --limit 300 --json name,isPrivate,isArchived,repositoryTopics` (owner auth, sees all 161) and `gh repo list ZAODEVZ --limit 300 --json ...` run as bettercallzaal (sees only the 3 private repos where bettercallzaal is a collaborator - ZAODEVZ's true private total is UNKNOWN beyond that, since bettercallzaal is not that account's owner). Cross-checked against `gh api "user/repos?visibility=all&affiliation=owner" --paginate` (161, identical, no duplicates) and `affiliation=collaborator` filtered to `owner.login=="ZAODEVZ"` (14 rows, of which 3 are net-new beyond the 20 public names).

### 2. Four ways GitHub lets a user account group repos

| Primitive | Applies to | API | Cap | Writable from zaalcaster | Verdict |
|-----------|-----------|-----|-----|--------------------------|---------|
| Topics | owned repos | REST GET/PUT, search qualifier `topic:` | 20 per repo | yes, with a token that has `repo` metadata write | USE |
| Star Lists | starred repos only | GraphQL only (`viewer.lists`, `updateUserListsForItem`); REST `/user/starred_lists` 404s | 32 lists, 32-char names | writes need `user` scope; `updateUserListsForItem` REPLACES the set | SKIP as ledger; fine for reading lists later |
| Custom properties | org repos | REST | n/a | no, both accounts are Users | SKIP |
| Pinned items | 6 per profile | GraphQL | 6 | yes | use for the six flagship repos only |
| `REPOS.md` file | anything | none | n/a | a commit | generate, never hand-write |

Contradiction, stated: `cli/cli` issue #13226 (2026-04-19, 9 thumbs-up, 3 comments) and the GitStarRecall maintainer (2026-03-08) both say "there is no API for lists". The 2026-08-01 write-up at hs.cnies.org shows the GraphQL fields working and I confirmed `viewer.lists` live (`totalCount: 0` on bettercallzaal). Resolution: no REST API, but GraphQL reads and writes exist. The community thread #8293 (2021-12-01, 59 comments, 66 replies) has one staff reply: "we don't have immediate plans to get this out but it's definitely on our radar" (bailey, 2021-12-02). Nothing since.

### 3. Proposed topic taxonomy (Zaal approves the names before any write)

| Family | Values | Rule |
|--------|--------|------|
| `brand-*` | `brand-zao`, `brand-wavewarz`, `brand-zabal`, `brand-zabal-gamez`, `brand-coc-concertz`, `brand-bettercallzaal`, `brand-fractal`, `brand-zuke`, `brand-poidh`, `brand-zaostock`, `brand-zlank` | exactly one per repo; matches `config.js` `brands[].name` so the Brands hub can filter on it |
| `status-*` | `status-canonical`, `status-lab`, `status-experiment` | exactly one; archived repos get the GitHub archive flag instead of a topic |
| `kind-*` | `kind-farcaster-client`, `kind-mini-app`, `kind-agent`, `kind-site`, `kind-bot`, `kind-contracts`, `kind-research` | one or more |

Topics must be lowercase, letters, digits and hyphens, 50 chars max, 20 per repo. Three families use at most 5 of the 20 slots.

### 4. The research library from a deployed app

What is on GitHub today, all fetched live:

- `bettercallzaal/ZAOOS`: `private: false`, size 178,956 KB, default branch `main`, pushed 2026-09-15.
- `research/farcaster/README.md`: 40,090 bytes, base64 via the contents API, or raw at `raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/farcaster/README.md` with CORS `*`.
- `research/search-index.json`: 66,143 bytes, 202 entries, schema `{num, topic, folder, title, date, goal, path}`, and it is **not valid JSON** (`"num":026` is an unquoted zero-padded number, Python's parser fails at line 2). Last regenerated 2026-04-05. Nine percent of the library.
- The only script that names it is `~/bin/zao-research-index`, which builds the SQLite FTS5 db at `~/.zao/zao-research-index.db` (2,240 rows) and does not write the JSON.

So the read path is proven and the index is the gap. The fix is one function in `zao-research-index --rebuild`: after indexing, write `research/search-index.json` as `[{num:"2489", topic, folder, title, goal, last_validated, type, tier}]` with `num` quoted, and commit it in the same PR that adds the doc (the `research-index` guard already fails PRs missing the topic README row; the JSON row rides alongside). At 2,209 docs and about 270 bytes per row that is roughly 600 KB, one fetch, cached 5 minutes by GitHub and by the browser.

Full-text search stays server-side: `GET /search/code?q=repo:bettercallzaal/ZAOOS+path:research/<topic>+<terms>` returned 11 hits for `SIWN` in `farcaster/` (total_count 11, paths returned). Code search requires authentication and is rate-limited to 30 requests per minute, which is why it belongs behind `api/view.js kind=research_search` with the Vercel token, not in the browser.

Doc `dev-workflows/045-research-organization-patterns` recommended (rec #2 and #3) an auto-generated index from frontmatter plus Pagefind search in a docs portal. This doc narrows that: the index generator already exists, it only needs to emit JSON, and the portal is zaalcaster rather than a new site. Doc `agents/2474-agentic-lane-throughput-and-research-retrieval` decision #1 (FTS5 BM25 first, no vector DB) stands; the deployed app gets the index for browsing and GitHub code search for grep-scale retrieval, and the ranked FTS5 stays local for lanes.

### 5. Prior art for GitHub inside Farcaster

| Project | What it is | State on 2026-09-15 | Licence (LICENSE file read) | Take |
|---------|-----------|---------------------|----------------------------|------|
| GitCast (`stevedylandev/gitcast-server`) | Farcaster Mini App that joins GitHub events with the Farcaster social graph: index FC users with GitHub verifications via Warpcast, queue GitHub event fetches, serve an aggregated feed; Cloudflare Workers + D1 | `gitcast.dev` has no DNS A record; repo 5 stars, last commit 2025-08-29 | MIT | Read the schema (`users`, `follows`, `github_events`, `repositories`, `user_stars`). The "verified GitHub account on the FC profile" join already exists in zaalcaster at `api/view.js:109-112` (`verified_accounts`, platform `github`). |
| `farcaster-cast-github-action` | GitHub Action: cast a message plus embeds via Neynar signer on release | 1 star, last activity 2024-05-11, listed on the Marketplace | no LICENSE file: all rights reserved | SKIP. Automated casting violates the no-autopost rule regardless of licence. |
| BuildCast (buildcast.app) | Closed SaaS: GitHub webhooks to AI captions to 13 platforms | live marketing page | n/a | SKIP. Posting stays sovereign (2026-08-07 decision, zaalcaster lane brief). |

The pattern that survives: a repo or doc link is an EMBED on a cast that Zaal writes and confirms in Compose, exactly the way the Clanker launch-prep chip prefills the Post tab today (CLAUDE.md, PR #113).

### 6. Concrete shape in zaalcaster

`public/index.html` is 242,103 bytes, 3,119 lines, eleven `data-tab` panels. No new tab. The Brands hub (Daily tab, `config.brands`, PR #67) becomes the home:

```
brand overlay (existing)              new sections (read-only)
  tagline + links                       repos:    GET api/view?kind=repos&topic=brand-wavewarz
  channel feed                                    -> name, description, pushed_at, stars, status-* topic
                                        research: GET api/view?kind=research_index&topic=wavewarz
                                                  -> rows from search-index.json filtered by topic
                                                  tap a row -> kind=research_doc&path=... -> raw README as text
                                        share:    "cast this" chip -> prefills Compose with the URL embed
```

`api/view.js` gains three kinds; `lib.js` gains one `fetchGitHub(path)` helper with a 60-second cache, mirroring `empire.js`. Topic filter names come from `config.brands[].topic`, one new field per brand entry.

## Also See

- [Doc 998](../../infrastructure/998-github-repo-estate-audit/) - the 129-repo audit whose keep/archive verdicts seed the `status-*` topics.
- [Doc 1026](../../business/1026-zao-brand-audit/) - the brand audit; its `REPOS.md` recommendation is replaced by decision 3 here.
- [Doc 1025](../../infrastructure/1025-zaoos-estate-split-design/) - ZAOOS as docs-only library; this doc is the first reader of that library from a product.
- [Doc 045](../../dev-workflows/045-research-organization-patterns/) - the index-from-frontmatter and search-portal recommendations this doc narrows.
- [Doc 2474](../../agents/2474-agentic-lane-throughput-and-research-retrieval/) - FTS5-first retrieval decision, unchanged.
- [Doc 997](../../agents/997-agent-harness-design-zaalcaster/) - the operator-cockpit framing zaalcaster now fills.
- [Doc 306 (farcaster)](../306-farcaster-protocol-features-gap-analysis/) - Neynar surface map; `verified_accounts` is the join key GitCast used.
- [Doc 2245](../../infrastructure/2245-zaoos-surface-map/) - what ZAOOS serves today.
- Tracker: `meeting:zaal-x-adrian-empire-builder-zaalcaster--2026-07-14` (todo) - test the live Empire Builder integration; `ZOL Keystone 4: zaalcaster fleet page` (todo).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DONE 2026-09-16: topic names in Finding 3 stand as the working taxonomy (no recorded Zaal edit found in the vault or PR threads); treat as tacitly approved unless Zaal objects | @Zaal | Decision | done |
| DONE: PR to zaalcaster shipped. `api/view.js` on `main` has `kind==='repos'` (line 276), `kind==='research_index'` (line 292), `kind==='research_doc'` (line 306) - PR #133 merged 2026-09-16T00:26Z, PR #134 same day added Search-tab scoping | zaalcaster lane | PR | done (#133, #134) |
| Set `GITHUB_TOKEN` (fine-grained, read-only, public data) in Vercel for zaalcaster; shipped = `api/view?kind=repos` returns `x-ratelimit-limit` 5000 in the server log | @Zaal | Env var | STILL OPEN - carry to 2026-10-02 (cannot verify Vercel env from this machine; `kind=repos` now reads zao-repos' `data.json` per the 2026-09-15 update, not the GitHub API directly, so this token now only gates the still-unbuilt `research_search` kind) |
| `zao-research-index --rebuild` writes valid `research/search-index.json` (quoted `num`, 2,209 rows); shipped = file on `main` parses with `python3 -c "json.load"` and row count equals the doc count | dotfiles lane (owns `~/bin`) | PR to zaal-dotfiles + ZAOOS | STILL OPEN, unchanged in 10 days (66,143 bytes, `"num":026` still unquoted, still fails to parse) - carry to 2026-10-02 |
| Apply topics to the ~25 canonical repos from doc 998 with `gh api -X PUT repos/{o}/{r}/topics`; shipped = `gh search repos --owner=bettercallzaal --owner=ZAODEVZ --topic status-canonical` returns the list | @Zaal | Script run | STILL OPEN - re-measured 2026-09-25: 1 of 131 repos (still only `sparkz`) - carry to 2026-10-02 |
| Add `kind=research_search` (GitHub code search behind the token); shipped = a query for "SIWN" scoped to `farcaster/` returns the 11 known paths from inside zaalcaster | zaalcaster lane | PR | STILL OPEN - `api/view.js` has no `research_search` kind as of 2026-09-25 - carry to 2026-10-02 |
| ~~Generate `docs/REPOS.md`~~ WITHDRAWN 2026-09-15: zao-repos Portfolio tab is the ledger | - | - | wontfix |
| DONE (partial): zao-repos got a LICENSE (MIT, "Zaal Panthaki / BCZ Strategies LLC / The ZAO", confirmed via `contents/LICENSE` 2026-09-25). STILL OPEN: `scripts/fetch.mjs`'s `BRANDS` array (line 32) is still pure name-regex, no `brand-*` topic check | whoever owns zao-repos | PR | LICENSE done; topic-preference carry to 2026-10-02 |
| Add zao-repos to CLAUDE.md Map and to `infrastructure/2245-zaoos-surface-map`; shipped = both mention the URL and the hourly rebuild | zaalcaster lane | Doc PR | STILL OPEN - neither file mentions zao-repos as of 2026-09-25 - carry to 2026-09-29 |

## Sources

Internal, all read in full from disk or the repo:
- `infrastructure/998-github-repo-estate-audit/README.md`, `business/1026-zao-brand-audit/README.md`, `infrastructure/1025-zaoos-estate-split-design/README.md`, `dev-workflows/045-research-organization-patterns/README.md`, `agents/2474-agentic-lane-throughput-and-research-retrieval/README.md` - `[FULL, local read]`
- zaalcaster `api/view.js`, `config.js`, `vercel.json`, `public/index.html`, `api/` listing; `~/zao-vault/handoffs/zaalcaster.md` - `[FULL, local read]`
- `~/bin/zao-research-index` header and `~/.zao/zao-research-index.db` row count; `research/search-index.json` (parse failure reproduced) - `[FULL, local read]`

GitHub, all via `gh api` or `curl` on 2026-09-15:
- `users/bettercallzaal/repos`, `users/ZAODEVZ/repos` (paginated, 130 rows), `repos/bettercallzaal/ZAOOS`, `repos/bettercallzaal/ZAOOS/contents/research/farcaster/README.md`, `repos/bettercallzaal/zaalcaster/topics`, `search/repositories?q=user:bettercallzaal+topic:farcaster`, `search/code?q=repo:bettercallzaal/ZAOOS+path:research/farcaster+SIWN`, GraphQL `viewer.lists` and `pinnedItems`, `repos/bettercallzaal/zaalcaster/deployments` - `[FULL, official API]`
- `curl -I https://raw.githubusercontent.com/.../research/farcaster/README.md` and `https://api.github.com/repos/bettercallzaal/ZAOOS` (CORS + rate-limit headers) - `[FULL, raw headers]`
- [Classifying your repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) - "Add no more than 20 topics." - `[FULL, curl + HTML strip]`
- [Managing custom properties for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization) - "Organization owners can add and set a custom property schema at the organization level." - `[FULL, curl + HTML strip]`
- [Saving repositories with stars](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars) - "Lists are currently in public preview and subject to change." - `[FULL, curl + HTML strip]`

Community:
- [Suggestion: star lists API, github/community discussion #8293](https://github.com/orgs/community/discussions/8293) - 2021-12-01, 59 comments, 66 replies, staff answer quoted above - `[PARTIAL, curl + HTML strip: opening post and staff answer read; the comment tree is loaded by JS and was not walked]`
- [Support GitHub Star Lists management via CLI/API, cli/cli #13226](https://github.com/cli/cli/issues/13226) - open, 2026-04-19, 9 thumbs-up, 3 comments, maintainer: "there's no API for this unfortunately" - `[FULL, gh api issues endpoint]`
- [How I Organized 2,098 GitHub Stars with gh CLI and GraphQL](https://hs.cnies.org/archives/github-stars-batch-classification-en) - 2026-08-01, 27,245 chars of text read; the GraphQL Lists fields, 32-list ceiling and `user` scope requirement - `[FULL, curl + HTML strip]`
- [GitStarRecall issue #8](https://github.com/Abhinandan-Khurana/GitStarRecall/issues/8) - 2026-02-17, maintainer's four-options analysis of Lists - `[PARTIAL, exa search highlights only]`

Prior art:
- [stevedylandev/gitcast-server](https://github.com/stevedylandev/gitcast-server) - README via `gh api .../readme`, LICENSE file read (MIT), snapshot taken with `zao-research-snapshot` (5 stars, last activity 2025-08-29) - `[FULL, official API]`
- gitcast.dev - `[FAILED: curl returned HTTP 000, `dig` shows no A record, Wayback availability API answered 429]`
- [therealharpaljadeja/farcaster-cast-github-action](https://github.com/therealharpaljadeja/farcaster-cast-github-action) and its [Marketplace listing](https://github.com/marketplace/actions/cast-to-farcaster) - snapshot taken (1 star, no LICENSE file, last activity 2024-05-11) - `[FULL, official API + exa highlights]`
- [BuildCast](https://buildcast.app/) - `[PARTIAL, exa search highlights of the marketing page]`

Added same day:
- [bettercallzaal/zao-repos](https://github.com/bettercallzaal/zao-repos) - README, `scripts/fetch.mjs` (500 lines), `.github/workflows/sync.yml`, commit history via `gh api`; `docs/data.json` fetched with `curl -D` from the Pages host and parsed (130 repos); snapshot taken with `zao-research-snapshot` (no LICENSE file, last activity 2026-09-15) - `[FULL, official API + raw fetch]`

Re-verified 2026-09-25 (Re-Research Mode), all `[FULL]` unless noted:
- `gh api users/bettercallzaal/repos --paginate`, `users/ZAODEVZ/repos --paginate` (131 rows total: 111 + 20; topics field re-checked per repo) - `[FULL, official API]`
- `gh api repos/bettercallzaal/zaalcaster/pulls?state=all` (PR #133, #134 merged 2026-09-16); `raw.githubusercontent.com/.../zaalcaster/main/api/view.js` fetched and grepped for `kind ===` - `[FULL, official API + raw fetch]`
- `raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/search-index.json` re-fetched (66,143 bytes, re-confirmed invalid JSON at the same line) - `[FULL, raw fetch, byte-identical to 2026-09-15]`
- `https://bettercallzaal.github.io/zao-repos/data.json` re-fetched (`generatedAt: 2026-09-26T01:34:53Z`, 131 repos, 1 with topics) - `[FULL, raw fetch]`
- `gh api repos/bettercallzaal/zao-repos/contents/LICENSE` (now present, MIT) - `[FULL, official API]`
- `raw.githubusercontent.com/.../zao-repos/main/scripts/fetch.mjs` re-fetched and grepped for `BRANDS`/`topics` - `[FULL, raw fetch]`
- `grep -rn zao-repos ~/zaal-dotfiles/claude/CLAUDE.md infrastructure/2245-zaoos-surface-map/README.md` (both zero hits) - `[FULL, local read]`
- `dig gitcast.dev`, `curl gitcast.dev` (still no DNS/000); `gh api repos/therealharpaljadeja/farcaster-cast-github-action` (unchanged: 1 star, pushed 2024-05-11) - `[FULL, official API + DNS check]`
- Vercel env for `GITHUB_TOKEN` - `[UNKNOWN - not readable from this machine; no external evidence of a live `research_search` kind found either]`
- `gh repo list bettercallzaal --limit 300 --json name,isPrivate,isArchived,repositoryTopics` and same for `ZAODEVZ` (owner-authenticated, includes private); `gh api "user/repos?visibility=all&affiliation=owner"` and `affiliation=collaborator` cross-check (no duplicates, stable across two runs) - `[FULL, official API, owner-authenticated]`
- `https://bettercallzaal.github.io/zao-repos/data.json` `.note` field re-read: "Public repositories only. Private repositories are never fetched or published by this workflow." - `[FULL, raw fetch, confirms the dashboard's own documented scope]`
