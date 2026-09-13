---
topic: business
type: decision
status: research-complete
last-validated: 2026-09-13
superseded-by:
related-docs: "business/980-zao-people-in-spaces-measurement, community/065-zabal-partner-ecosystem, community/348-songjam-points-system-deep-dive, infrastructure/122-songjam-screen-share-pr, dev-workflows/815-songjam-site-fork-audit"
review-note: "2026-09-13: zaoos-review requested changes on commit ffd178863519c4d14b09a294977f28d56b88bd35 - fixed MIT licence count (12->14, table now reconciles 64+14+2+1=81), enumerated all 15 non-test src files via git grep on origin/main (was undercounted at 6), and added Key Decision 4 on prior SongJam-source exposure via doc 815 / elevenlabs.ts. Addressed on the same branch."
original-query: "https://github.com/orgs/SongjamSpace/repositories /zao-research all of these - build-our-own analysis for ZongJam, The ZAO's own version of SongJam, launching in a new lane after ZAOstock (2026-10-03)"
tier: STANDARD
---

# 2486 — SongjamSpace Org Inventory: Licence Status and What ZongJam Must Clean-Room

> **Goal:** Inventory every repo in the SongjamSpace GitHub org, establish the true licence status of the SongJam product code, and map exactly what ZAO OS V1 depends on today, so a ZongJam build (The ZAO's own version, launching after ZAOstock 2026-10-03) starts from an honest legal and technical baseline.

This is an internal build-vs-buy engineering analysis, not partner content. Zaal retired SongJam as a partner on 2026-07-31 (research doc `business/980-zao-people-in-spaces-measurement` already shows the relationship paused as of 2026-07-02). Nothing here promotes SongJam or its $SANG token; both are named only to establish what ZAO OS currently depends on and why that dependency needs replacing.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ZongJam MUST be a clean-room reimplementation. It CANNOT copy any SongJam code.** | `songjam-ui`, `songjam-site`, `songjam-contracts`, and `songjam-leaderboard-ui` — the **four** repos that make up the SongJam product (the fourth is the repo behind the live leaderboard dependency ZAO OS calls today, see Finding 3) — carry **no LICENSE file**. Confirmed by reading the file directly (`gh api repos/SongjamSpace/<repo>/contents/LICENSE`), not the API's license classifier field. No LICENSE file means default copyright: all rights reserved, no permission to copy, modify, or redistribute the source, even though the repos are public and forkable. ZongJam may reimplement the **idea** (voice-verified space leaderboard, points/multiplier scoring) from scratch, informed only by public, black-box observation of SongJam's live API responses (Sources below) and the behavioral spec next action — never by copying SongJam source. See Key Decision 4 below: this project is not starting from a blank slate on exposure, and that has to be managed deliberately, not asserted away. |
| 2 | **`songjam-ui`'s `"license": "ISC"` in `package.json` grants nothing on its own.** | A `package.json` `license` field is npm-registry metadata — it tells `npm`/tooling what to *display* as the intended license if the package is ever published to a registry. It is not itself a copyright license grant, and it does not substitute for a `LICENSE` file in the repository. GitHub's own guidance is explicit: a public repo with no license file is "all rights reserved" by default — viewing/forking is allowed, but using, copying, modifying or distributing the code requires the owner's explicit permission (https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository). Do not overstate this (the field is not proof of bad faith or an active license) or understate it (it is not a usable grant either) — most likely it is scaffold boilerplate (the default `package.json` license value many `create-react-app`/npm-init templates ship with) that nobody replaced. The same unaccompanied-ISC pattern repeats in `songjam-contracts` and `songjam-leaderboard-ui`; `songjam-site`'s `package.json` has no `license` field at all. |
| 3 | ZongJam is a new build lane, starts after ZAOstock (2026-10-03) | Zaal's stated context for this research; do not schedule any ZongJam engineering work before that date. |
| 4 | **The clean-room premise has a real gap: ZAO has already read SongJam's source, and it must be staffed around, not asserted away.** | `src/lib/agents/voice/elevenlabs.ts` (origin/main, line 9) says outright: "This deliberately fixes the pattern in Songjam's `agent-conversation.tsx`... See `research/dev-workflows/815-songjam-site-fork-audit/`." Doc 815 (2026-06-07) records that Adam/Logesh's team gave Zaal **verbal permission to reuse code**, confirmed by Zaal the same day, but scoped it explicitly: "No LICENSE file exists on the repo, so reuse is permission-based, not license-based — keep it internal to the lab until a license lands." That permission predates the 2026-07-31 partnership retirement; whether it survives the retirement is unconfirmed (see Could Not Verify). Reading source code is lawful — SongJam's own team invited it, once, for this specific audit. **Copying its protected expression without a license is what's barred, and that line held**: doc 815's own text is "reference Songjam's UX, re-implement the plumbing to our standards," and `elevenlabs.ts` is a fresh, differently-structured file that fixes a security anti-pattern rather than ports it. That is the right instinct, but it means at least one person (whoever wrote `elevenlabs.ts`, and Zaal via doc 815) is already "exposed" to SongJam source and cannot un-see it. **Staffing requirement for the ZongJam lane:** whoever implements ZongJam's leaderboard/scoring/voice-agent logic should either (a) not be a person who has read SongJam source (i.e., not build directly from memory of `songjam-site`/`songjam-ui`), or (b) if unavoidable given team size, work only from a written black-box behavioral spec — API shapes, field names, scoring formula as observed externally (Finding 3, doc `community/348-songjam-points-system-deep-dive`) — never from the SongJam repo itself, mirroring exactly what `elevenlabs.ts` already did correctly. Zaal should name this staffing choice explicitly before ZongJam design starts (Next Actions). |

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
| MIT (all header variants) | **14** | `songjam-agent-onboarding`, `audiocraft`, `deepfake-verification`, `music-info-retriever`, `nft-deployers-data-server`, `nusic-functions`, `phaser-marble-race`, `tts-twitter-agent`, `tune-dash-ui`, `tunedash-gameonton`, `videos-mix-engine`, `voice-block-explorer`, plus `ava-extension` ("The MIT License (MIT)" header) and `nusic-layer-subquery` ("MIT LICENSE" all-caps header) — same license, different header text, both miscounted out of this table in an earlier draft of this doc |
| Apache License | 2 | `mirror-contracts`, `mirror.js` |
| Public domain (unlicense) | 1 | `metadata-layer` |

64 + 14 + 2 + 1 = **81** — reconciles to the full repo count with no remainder.

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

**15 non-test source files under `src/` on `origin/main` reference SongJam (17 including the two test files)** — enumerated with `git grep -ilE songjam -- 'src/*'` against a fresh checkout of `origin/main` (commit `4cda5d28`), not from memory or a partial listing:

- **`src/app/spaces/songjam/page.tsx`** — a full-page route that iframes `https://www.songjam.space/zabal` directly (constant `SONGJAM_SPACE_URL` in `src/lib/spaces/songjam.ts`). This is SongJam's own hosted UI, embedded, not proxied — ZAO ships zero SongJam UI code, just an iframe pointer.
- **`src/lib/spaces/songjam.ts`** — holds the iframe URL, label/description strings, and the `allow`/`sandbox` iframe attribute lists (`clipboard-write; microphone; camera; autoplay; fullscreen`). Its own comment cites prior research (`research/_archive/119-songjam-audio-spaces-embed/` and `research/dev-workflows/815-songjam-site-fork-audit/`) as the reason ZAO chose to embed rather than rebuild.
- **`src/app/api/songjam/leaderboard/route.ts`** — a Next.js API route that proxies `GET https://songjamspace-leaderboard.logesh-063.workers.dev/{projectId}{_timeframe}` (default `projectId=bettercallzaal_s2`), with a 60-second in-memory cache.
- **`src/components/respect/SongjamLeaderboard.tsx`** — client component that calls `/api/songjam/leaderboard` and renders a ranked table (points, Farcaster points, "Space" points, empire multiplier, share %).
- **`src/components/spaces/SongjamSpaceCard.tsx`** — a card on the Spaces "Live" tab linking to `/spaces/songjam`.
- **`src/middleware.ts`** — allowlists `https://songjam.space` and `https://www.songjam.space` in the CSP `frame-src` directive and in the Permissions-Policy `camera`/`microphone` origin lists, and rate-limits `/api/songjam` to 20 requests/minute.
- **`src/app/(auth)/respect/RespectPageClient.tsx`** — dynamically imports `SongjamLeaderboard` (`ssr: false`) onto the Respect page.
- **`src/app/(auth)/ecosystem/page.tsx`** — lists SongJam as an ecosystem entry: name, emoji icon, description ("Live audio spaces & ZABAL mention leaderboard — host rooms, earn points"), and `url: 'https://songjam.space/zabal'`.
- **`src/components/ecosystem/EcosystemPanel.tsx`** — maps `SongJam: '/spaces'` in its `EMBED_URLS` table, routing the ecosystem panel's SongJam tile to ZAO's own `/spaces`.
- **`src/lib/portal/destinations.ts`** — a second, separate "SongJam" portal-destination entry (name, `url: 'https://songjam.space/zabal'`, description "Live audio spaces") — a distinct list from the ecosystem page above, so SongJam is currently link-listed in at least two independent destination registries.
- **`src/app/spaces/page.tsx`** — imports and renders `SongjamSpaceCard` on the main Spaces tab.
- **`src/app/spaces/audit-test/page.tsx`** — a page-comment only ("ElevenLabs is not involved here. See `research/dev-workflows/815-songjam-site-fork-audit/`") isolating an audit flow from the main `/spaces` path; no live SongJam call.
- **`src/lib/surface-map.ts`** — registers `/api/songjam/leaderboard` (`GET`) in ZAO OS's internal surface/route map.
- **`src/lib/agents/voice/elevenlabs.ts`** — **not a UI dependency at all**; its code comment documents that this file's auth pattern was written specifically to fix an insecure pattern found in SongJam's `agent-conversation.tsx` during the doc-815 fork audit. See Key Decision 4 below — this is the file that proves ZAO has already read SongJam source.
- **`src/components/social/ShareToFarcaster.tsx`** — an `ecosystem` share-text template that names `SongJam` (and `MAGNETIQ`) in outbound, publicly-posted Farcaster share copy (line 248: `"The ZAO Ecosystem\n\nZOUNZ DAO • SongJam • Empire Builder • MAGNETIQ • Incented • Clanker..."`). This is not a functional dependency but it is a live promotional reference to two retired partners going out in public shares today — flagged separately in Next Actions, not something this doc's scope authorizes fixing.

(The two test files, `src/app/api/songjam/leaderboard/__tests__/route.test.ts` and `src/lib/spaces/__tests__/songjam.test.ts`, exercise the route and constants above and carry no independent SongJam dependency of their own.)

**Removal scope for a ZongJam cutover is therefore 15 files, not 6** — the leaderboard proxy chain (5 files: route, component, lib constants, card, page) plus middleware, plus 3 separate SongJam listings across `ecosystem/page.tsx`, `EcosystemPanel.tsx`, and `portal/destinations.ts` that all need updating or removing independently, plus the `surface-map.ts` registry entry, plus the promotional text in `ShareToFarcaster.tsx`, plus one file (`elevenlabs.ts`) that references SongJam only in a code comment and needs no functional change.

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
- ZAO OS V1 source (read-only) — `src/app/spaces/songjam/page.tsx`, `src/lib/spaces/songjam.ts`, `src/app/api/songjam/leaderboard/route.ts`, `src/components/respect/SongjamLeaderboard.tsx`, `src/components/spaces/SongjamSpaceCard.tsx`, `src/middleware.ts`, plus 9 more (see Finding 3) — **[FULL]**, files read directly, nothing modified.
- Full-repo enumeration of SongJam references — `git grep -ilE songjam -- 'src/*'` run against a fresh, disposable shallow clone (`git clone --depth 1 --branch main`) of `bettercallzaal/ZAOOS` at commit `4cda5d28a058494f59726ff85b34284a330f90fb`, in the scratchpad directory — **[FULL]**, 15 non-test + 2 test files, no working-tree of the shared local `ZAO OS V1` checkout touched or used for this step.
- `research/dev-workflows/815-songjam-site-fork-audit/README.md` — **[FULL]**, read via `gh api repos/bettercallzaal/ZAOOS/contents/...`, for the verbal-permission and security-audit context behind `elevenlabs.ts`.
- GitHub licensing guidance — https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository — **[FULL]**, fetched and read for the "no LICENSE file = all rights reserved" claim.
- ZAO research library — `zao-research-index "songjam"` — **[FULL]**, 20 existing docs surfaced and read for titles/excerpts.
- ZAO cowork tracker — `~/bin/zao-tracker search "songjam" --status todo --limit 5` — **[FULL]**, returned no matches (a real negative result, not a tool failure — control: the SongjamSpace `gh api` calls above prove the toolchain works).

## Could Not Verify

- Whether SongJam's 2026-06-07 verbal permission to reuse code (doc `dev-workflows/815-songjam-site-fork-audit`, confirmed by Zaal) still stands after the 2026-07-31 partnership retirement, or was revoked with it. Not verifiable from GitHub alone; would require checking Zaal's own email/Slack history with Adam/Logesh, which is outside this doc's tool access. Treat the LICENSE-file finding (all rights reserved) as the operative legal baseline regardless — a verbal, revocable, internal-only permission from 2026-06-07 is not a substitute for a license grant even if it is still technically live.
- The exact authentication/query contract of the leaderboard worker beyond `{projectId}` and `{projectId}_{timeframe}` (e.g. whether it needs an API key for other callers) — only the shape ZAO OS's own route builds was tested; the worker's own source is private (no public repo found matching its hostname).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Circulate this doc's Key Decision 1-2 (clean-room requirement) to anyone touching the ZongJam lane before design starts | Zaal | Doc review | 2026-09-20 |
| Scope a ZongJam MVP spec (leaderboard scoring engine + voice-verification flow) written from the public API shape observed here, with zero SongJam source in view | Zaal | Spec doc, PR to research library | 2026-10-10 (one week into the post-ZAOstock build lane) |
| Replace the ZAO OS `/api/songjam/leaderboard` proxy's hard dependency on `songjamspace-leaderboard.logesh-063.workers.dev` with a ZongJam-owned endpoint (or a documented graceful-degradation fallback if ZongJam is not ready) | Zaal | PR to ZAOOS repo | 2026-10-17 — shipped when `route.ts` no longer calls a third-party worker with no SLA |
| Confirm with Zaal whether the `/spaces/songjam` iframe embed and `SongjamSpaceCard` stay live during the ZongJam build or get sunset immediately | Zaal | Decision | 2026-09-20 |
| Name who is and isn't "exposed" to SongJam source (at minimum: Zaal, and whoever wrote `src/lib/agents/voice/elevenlabs.ts`) and decide the clean-room staffing model for ZongJam's implementation per Key Decision 4 | Zaal | Decision, written down in the ZongJam MVP spec | 2026-09-20 |
| `src/components/social/ShareToFarcaster.tsx` line 248 ships outbound Farcaster share text naming both retired partners ("SongJam" and "MAGNETIQ") in the `ecosystem` share template — decide whether to update or remove it | Zaal | PR to ZAOOS repo | 2026-09-20 |

## Also See

- `business/980-zao-people-in-spaces-measurement`
- `community/065-zabal-partner-ecosystem`
- `community/348-songjam-points-system-deep-dive`
- `infrastructure/122-songjam-screen-share-pr`
- `dev-workflows/815-songjam-site-fork-audit`
