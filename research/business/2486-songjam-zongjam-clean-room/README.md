---
topic: business
type: decision
status: research-complete
last-validated: 2026-09-13
superseded-by:
related-docs: "business/980-zao-people-in-spaces-measurement, community/065-zabal-partner-ecosystem, community/348-songjam-points-system-deep-dive, infrastructure/122-songjam-screen-share-pr, dev-workflows/815-songjam-site-fork-audit"
original-query: "https://github.com/orgs/SongjamSpace/repositories /zao-research all of these - build-our-own analysis for ZongJam, The ZAO's own version of SongJam, launching in a new lane after ZAOstock (2026-10-03)"
tier: STANDARD
---

# 2486 — SongjamSpace Org Inventory: Licence Status and What ZongJam Must Clean-Room

> **Goal:** Inventory every repo in the SongjamSpace GitHub org, establish the true licence status of the SongJam product code, and map exactly what ZAO OS V1 depends on today, so a ZongJam build (The ZAO's own version, launching after ZAOstock 2026-10-03) starts from an honest legal and technical baseline.

This is an internal build-vs-buy engineering analysis, not partner content. Zaal retired SongJam as a partner on 2026-07-31 (research doc `business/980-zao-people-in-spaces-measurement` already shows the relationship paused as of 2026-07-02). Nothing here promotes SongJam or its $SANG token; both are named only to establish what ZAO OS currently depends on and why that dependency needs replacing.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ZongJam MUST be a clean-room reimplementation. It CANNOT copy any SongJam code.** | `songjam-ui`, `songjam-site`, and `songjam-contracts` — the three repos that make up the SongJam product — carry **no LICENSE file**. Confirmed by reading the file directly (`gh api repos/SongjamSpace/<repo>/contents/LICENSE`), not the API's license classifier field. No LICENSE file means default copyright: all rights reserved, no permission to copy, modify, or redistribute the source, even though the repos are public and forkable. ZongJam may reimplement the **idea** (voice-verified space leaderboard, points/multiplier scoring) from scratch, informed only by public, black-box observation of SongJam's live API responses (Sources below) — never by reading or porting SongJam source. |
| 2 | **`songjam-ui`'s `"license": "ISC"` in `package.json` grants nothing on its own.** | A `package.json` `license` field is npm-registry metadata — it tells `npm`/tooling what to *display* as the intended license if the package is ever published to a registry. It is not itself a copyright license grant, and it does not substitute for a `LICENSE` file in the repository. GitHub's own guidance is explicit: a public repo with no license file is "all rights reserved" by default — viewing/forking is allowed, but using, copying, modifying or distributing the code requires the owner's explicit permission (https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository). Do not overstate this (the field is not proof of bad faith or an active license) or understate it (it is not a usable grant either) — most likely it is scaffold boilerplate (the default `package.json` license value many `create-react-app`/npm-init templates ship with) that nobody replaced. The same unaccompanied-ISC pattern repeats in `songjam-contracts` and `songjam-leaderboard-ui`; `songjam-site`'s `package.json` has no `license` field at all. |
| 3 | ZongJam is a new build lane, starts after ZAOstock (2026-10-03) | Zaal's stated context for this research; do not schedule any ZongJam engineering work before that date. |

## Method Control (Hard Requirement 13)

Licence claims in this doc come from reading the LICENSE file's raw bytes, never the GitHub API's `.license` classifier field (that field is a guesser and has been measured wrong on other repos — NOASSERTION for a verbatim-MIT repo, NOASSERTION for a PolyForm-Noncommercial repo — see the zao-research skill's own hard requirement 13).

**Control repo:** `bettercallzaal/zorca`, known MIT.

```
$ gh api repos/bettercallzaal/zorca/contents/LICENSE --jq '.content' | base64 -d | head -5
MIT License

Copyright (c) 2026 Zaal Panthaki (The ZAO)

Permission is hereby granted, free of charge, to any person obtaining a copy
```

Method returns MIT correctly on a known-MIT repo — the method works and an empty/NO_LICENSE_FILE result on a SongJam repo is a real finding, not a tool failure.

## Findings

### 1. Org inventory — 81 of 81 public repos, count confirmed complete

```
$ gh api orgs/SongjamSpace --jq '{login,name,description,created_at,public_repos}'
{"login":"SongjamSpace","name":"Songjam","description":"Sovereign Voices Unite",
 "created_at":"2020-11-26T14:33:14Z","public_repos":81}

$ gh repo list SongjamSpace --limit 100 --json name,... | jq length
81
```

`gh api orgs/SongjamSpace` reports `public_repos: 81` and `gh repo list` returned exactly 81 rows — the count is confirmed complete, no pagination gap. `isArchived` is `false` on all 81; GitHub's archive flag is not how this org marks dead projects.

The org was created 2020-11-26 as "Songjam" but its repo history is dominated by an earlier "Nusic"-branded NFT/music-metadata/Chainlink project (60 of 81 repos: `nusic-*`, `chainlink-*`, `numix-*`, `metadata-*`, `mirror-contracts`, `mirror.js`, `EIP3643N`, `AlphaLive`, etc., last activity mostly 2021-2024, several already MIT/Apache/public-domain). The current SongJam voice-verification/leaderboard product is a later pivot layered on the same org.

### 2. Licence status: 64 of 81 repos have no LICENSE file at all

```
$ gh api repos/SongjamSpace/<name>/contents/LICENSE --jq '.content' | base64 -d
```
run against all 81 repos, read raw file bytes (404 = no file):

| Licence found | Count | Examples |
|---|---|---|
| **No LICENSE file (all rights reserved)** | **64** | `songjam-ui`, `songjam-site`, `songjam-contracts`, `songjam-leaderboard-ui`, `2026-music-player`, `social-tts`, `agent-connect`, `dashboard-ui`, `voice-vault-contracts`, `voice-vault-ui`, `nusic-core`, and 53 more |
| MIT License | 12 | `songjam-agent-onboarding`, `audiocraft`, `ava-extension`, `deepfake-verification`, `music-info-retriever`, `nft-deployers-data-server`, `nusic-functions`, `nusic-layer-subquery`, `phaser-marble-race`, `tts-twitter-agent`, `tune-dash-ui`, `tunedash-gameonton`, `videos-mix-engine`, `voice-block-explorer` |
| Apache License | 2 | `mirror-contracts`, `mirror.js` |
| Public domain (unlicense) | 1 | `metadata-layer` |

**The 5 SongJam-branded repos (the actual product), individually:**

| Repo | Description | Stack | Last activity | LICENSE file | `package.json` license field | Stars | Surface type |
|---|---|---|---|---|---|---|---|
| `songjam-ui` | Main app UI | TypeScript, React | 2026-04-01 | **NONE — all rights reserved** | `"ISC"` (npm scaffold artifact — see Key Decision 2) | 2 | Product surface |
| `songjam-site` | "New website with leaderboard frontpage" | TypeScript | 2026-07-22 | **NONE — all rights reserved** | no license field present | 1 | Product surface |
| `songjam-leaderboard-ui` | (no description) | TypeScript | 2026-06-16 | **NONE — all rights reserved** | `"ISC"` (same pattern) | 0 | Product surface |
| `songjam-contracts` | "Repository for Songjam Smart Contracts" | Solidity | 2025-09-10 | **NONE — all rights reserved** | `"ISC"` (same pattern) | 0 | Contracts |
| `songjam-agent-onboarding` | AI-agent onboarding guide for Songjam Spaces | JavaScript | 2026-02-01 | **MIT License** (the one songjam-branded exception) | — | 0 | Docs/infra, not core product |

`zao-research-snapshot` on the three core repos also surfaced contributor counts and top committers: `songjam-ui` (2 contributors: `logesh2496` 259 commits, `adamunerate` 100), `songjam-site` (4 contributors: `logesh2496` 176, `finnmaccool888` 46, `adamunerate` 7, and **`bettercallzaal` 2 commits** — Zaal's own account has a small direct contribution history on `songjam-site` from the earlier partnership, which does not create any licence rights and is noted only for completeness), `songjam-contracts` (1 contributor, `zeeshanhanif`, 14 commits).

Adjacent, less-central repos worth naming for the inventory but not central to ZongJam: `2026-music-player` ("Tokenizing Torrenting" — a separate, unrelated experiment, no LICENSE file, last activity 2026-08-08, so not abandoned but not SongJam-branded either), `social-tts` (TTS agent, no LICENSE file, last activity 2026-03-29), `tts-twitter-agent` (MIT, but stale since 2025-06-02), `agentic-spaces-ui` / `agentic-spaces-ui-tapestry` / `moltspaces-ui-draft` / `dashboard-ui` (all no-LICENSE, all product-adjacent UI experiments), `voice-vault-*` and `emo-rag-contracts` / `emorag-arangodb-py` (a separate voice-cloning/TEE product line, no LICENSE file on the contracts/UI repos).

### 3. What ZAO OS V1 depends on today (read-only inspection, nothing modified)

Six files under `~/Documents/ZAO OS V1/src` reference SongJam:

- **`src/app/spaces/songjam/page.tsx`** — a full-page route that iframes `https://www.songjam.space/zabal` directly (constant `SONGJAM_SPACE_URL` in `src/lib/spaces/songjam.ts`). This is SongJam's own hosted UI, embedded, not proxied — ZAO ships zero SongJam UI code, just an iframe pointer.
- **`src/lib/spaces/songjam.ts`** — holds the iframe URL, label/description strings, and the `allow`/`sandbox` iframe attribute lists (`clipboard-write; microphone; camera; autoplay; fullscreen`). Its own comment cites prior research (`research/_archive/119-songjam-audio-spaces-embed/` and `research/dev-workflows/815-songjam-site-fork-audit/`) as the reason ZAO chose to embed rather than rebuild.
- **`src/app/api/songjam/leaderboard/route.ts`** — a Next.js API route that proxies `GET https://songjamspace-leaderboard.logesh-063.workers.dev/{projectId}{_timeframe}` (default `projectId=bettercallzaal_s2`), with a 60-second in-memory cache.
- **`src/components/respect/SongjamLeaderboard.tsx`** — client component that calls `/api/songjam/leaderboard` and renders a ranked table (points, Farcaster points, "Space" points, empire multiplier, share %).
- **`src/components/spaces/SongjamSpaceCard.tsx`** — a card on the Spaces "Live" tab linking to `/spaces/songjam`.
- **`src/middleware.ts`** — allowlists `https://songjam.space` and `https://www.songjam.space` in the CSP `frame-src` directive and in the Permissions-Policy `camera`/`microphone` origin lists, and rate-limits `/api/songjam` to 20 requests/minute.

**Worker liveness, re-verified 2026-09-13 (not trusted from the prior measurement — re-tested with curl):**
```
$ curl -sI https://songjamspace-leaderboard.logesh-063.workers.dev
HTTP/2 400   {"error":"Key is required"}

$ curl -s https://songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2
HTTP/2 200
[{"username":"Imanafrikah","name":"IMan Afrikah","totalPoints":1240.4,"userId":"1821787427306106880",
  "tlPoints":36.4,"songjamSpacePoints":1204,"connectedWalletAddress":"0xF73485A6..."}, ...]
```
The bare origin 400s ("Key is required") — the prior "HTTP 200" measurement was against the real path ZAO OS actually calls (`/{projectId}`), not the bare origin. Re-confirmed 200 with real leaderboard data using the exact path the production route builds. **This worker is a third party's infrastructure ZAO OS calls live in production with zero SLA, zero written agreement (partnership retired 2026-07-31), and zero ZAO-side fallback if it goes dark.** That is the concrete thing ZongJam must replace first — not the iframe (which is inert to build risk since it's just an `<iframe>` pointer) but this leaderboard data dependency.

### 4. Existing ZAO research already covers this ground

- `community/065-zabal-partner-ecosystem` — describes the original SongJam partnership (voice verification + leaderboard).
- `community/348-songjam-points-system-deep-dive` — the scoring/multiplier model ZongJam would need to reimplement independently (`totalPoints`, `stakingMultiplier`, `empireMultiplier` fields — same field names visible in the live JSON above).
- `infrastructure/122-songjam-screen-share-pr` — a prior ZAO contribution attempt into SongJam's `/spaces` (context for the `bettercallzaal` commits on `songjam-site`).
- `dev-workflows/815-songjam-site-fork-audit` (note: doc number 815 is ambiguous in the library — a second, unrelated doc also claims 815; this citation is the `dev-workflows` path specifically) — an existing fork-and-audit pass on `songjam-site` relevant to reuse questions; read it before scoping ZongJam's UI layer.
- `business/980-zao-people-in-spaces-measurement` — states the partnership "paused as of 2026-07-02," consistent with the 2026-07-31 retirement Zaal confirmed.

## Sources

- SongjamSpace org API metadata — `gh api orgs/SongjamSpace` — **[FULL]**, raw JSON read.
- SongjamSpace repo list — `gh repo list SongjamSpace --limit 100 --json name,description,visibility,isArchived,updatedAt,primaryLanguage,stargazerCount` — **[FULL]**, raw JSON, 81 rows, cross-checked against `public_repos: 81`.
- LICENSE file reads for all 81 repos — `gh api repos/SongjamSpace/<repo>/contents/LICENSE --jq .content | base64 -d` — **[FULL]** for every repo (a 404 is itself a definitive, fully-read result, not a failure).
- Control read — `gh api repos/bettercallzaal/zorca/contents/LICENSE` — **[FULL]**, confirmed MIT, validates method.
- `songjam-ui`, `songjam-contracts`, `songjam-leaderboard-ui`, `songjam-site` `package.json` reads — `gh api repos/SongjamSpace/<repo>/contents/package.json --jq .content | base64 -d` — **[FULL]**.
- `zao-research-snapshot SongjamSpace/<repo>` for `songjam-ui`, `songjam-site`, `songjam-contracts`, `songjam-leaderboard-ui`, `2026-music-player`, `social-tts`, `songjam-agent-onboarding` — **[FULL]**, tool output read directly (stars/forks/contributors/licence/top committers).
- Cloudflare Worker liveness — `curl -sI` and `curl -s` against `https://songjamspace-leaderboard.logesh-063.workers.dev` (bare and with `/bettercallzaal_s2`) — **[FULL]**, raw HTTP response read directly, not summarized.
- ZAO OS V1 source (read-only) — `src/app/spaces/songjam/page.tsx`, `src/lib/spaces/songjam.ts`, `src/app/api/songjam/leaderboard/route.ts`, `src/components/respect/SongjamLeaderboard.tsx`, `src/components/spaces/SongjamSpaceCard.tsx`, `src/middleware.ts` — **[FULL]**, files read directly, nothing modified.
- GitHub licensing guidance — https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository — **[FULL]**, fetched and read for the "no LICENSE file = all rights reserved" claim.
- ZAO research library — `zao-research-index "songjam"` — **[FULL]**, 20 existing docs surfaced and read for titles/excerpts.
- ZAO cowork tracker — `~/bin/zao-tracker search "songjam" --status todo --limit 5` — **[FULL]**, returned no matches (a real negative result, not a tool failure — control: the SongjamSpace `gh api` calls above prove the toolchain works).

## Could Not Verify

- Whether SongJam has ever issued Zaal or The ZAO a separate, out-of-repo written license or side agreement predating the 2026-07-31 retirement. Not verifiable from GitHub alone; would require checking Zaal's own email/Slack history with Adam/Logesh, which is outside this doc's tool access. Treat the LICENSE-file finding (all rights reserved) as the operative legal baseline until such an agreement is produced.
- The exact authentication/query contract of the leaderboard worker beyond `{projectId}` and `{projectId}_{timeframe}` (e.g. whether it needs an API key for other callers) — only the shape ZAO OS's own route builds was tested; the worker's own source is private (no public repo found matching its hostname).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Circulate this doc's Key Decision 1-2 (clean-room requirement) to anyone touching the ZongJam lane before design starts | Zaal | Doc review | 2026-09-20 |
| Scope a ZongJam MVP spec (leaderboard scoring engine + voice-verification flow) written from the public API shape observed here, with zero SongJam source in view | Zaal | Spec doc, PR to research library | 2026-10-10 (one week into the post-ZAOstock build lane) |
| Replace the ZAO OS `/api/songjam/leaderboard` proxy's hard dependency on `songjamspace-leaderboard.logesh-063.workers.dev` with a ZongJam-owned endpoint (or a documented graceful-degradation fallback if ZongJam is not ready) | Zaal | PR to ZAOOS repo | 2026-10-17 — shipped when `route.ts` no longer calls a third-party worker with no SLA |
| Confirm with Zaal whether the `/spaces/songjam` iframe embed and `SongjamSpaceCard` stay live during the ZongJam build or get sunset immediately | Zaal | Decision | 2026-09-20 |

## Also See

- `business/980-zao-people-in-spaces-measurement`
- `community/065-zabal-partner-ecosystem`
- `community/348-songjam-points-system-deep-dive`
- `infrastructure/122-songjam-screen-share-pr`
- `dev-workflows/815-songjam-site-fork-audit`
