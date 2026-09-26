---
topic: community
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: 2408, 2441, 1222, 2340, 2489, 998
original-query: "https://github.com/orgs/WalkerEnterprise/repositories here is a list of repos to /zao-research"
tier: STANDARD
---

# 2491 - WalkerEnterprise: what is in Mauro's GitHub org, why Zaal is its admin, and what ZAO can use

> **Goal:** Zaal sent the WalkerEnterprise repository list for research. Doc 2408 (2026-08-24) left it as open question 5: "Zaal is an org member... nothing anywhere says what the relationship is." This doc answers that from the org's own API surface, the vault, and the research library, originally measured on 2026-09-15, and says what in the 95 repos is worth anything to ZAO. External-community sources do not apply: this is an audit of an org Zaal administers, the same footing doc 2408 used.

> **Updated 2026-09-25 - lead finding: half the central claim is resolved, half is not.** The central claim was "Zaal is an unexplained `admin` of a collaborator's GitHub org with an unreachable `leaksnipe.win` blog listed as its contact."
> 1. **`leaksnipe.win` is no longer unreachable.** `curl -sIL https://www.leaksnipe.win` now 301-redirects to `home.leaksnipe.win`, which returns HTTP 200 and 197,392 bytes of real content (re-checked twice). On 2026-09-15 the same URL returned a flat HTTP 403 block page, and exa and Wayback both failed too. The page reads clean: `<title>LeakSnipe — Field Instrument for Your Own Poker Game</title>`, a poker hand-tracking and AI-coaching product - Track/Find/Review/Study/Improve loop, a Windows HUD overlay, a Monte Carlo equity engine, a CFR+ solver, and an MCP connector that names Anthropic as one of its LLM providers. "Leak" is poker jargon for an exploitable pattern in a player's own game, not a data leak. This matches the org's own poker-tooling repos (`Chroma_Poker`, `JohnDaWalka-Poker-Coach`, `Poka-coaches`) - it reads as Mauro's own product, not a separate mystery. **Question (c) below no longer needs asking; direct measurement answered it.**
> 2. **Zaal is still `admin`, unchanged.** `gh api orgs/WalkerEnterprise/memberships/bettercallzaal --jq .role` returns `admin` today, same as 2026-09-15. The 2026-09-19 downgrade-or-explain deadline passed six days ago with neither done. This half of the central claim still stands.
> 3. **No evidence found, anywhere searched, that Mauro was ever messaged** about (a) why admin or (b) licensing the Kalshi client. Searched: `zao-vault/projects/TEAMS.md`, `zao-vault/people/jdwalka.md`, `zao-vault/people/REGISTER-2026-09-03.md`, `zao-vault/handoffs/status/zaalcaster.md`, `research/events/2441-.../README.md`, and a vault-wide grep for "leaksnipe", "mauronaz", "jdwalka". Doc 2441's own action table still lists Mauro's related mini-app question as **Open**. This is UNKNOWN, not "no reply" - absence of a record in the places searched is not proof the DM was never sent.
> 4. **"See doc 2491" was added to `TEAMS.md` (confirmed, line 72, via the merged PR https://github.com/bettercallzaal/ZAOOS/pull/3525, merged 2026-09-17T02:49:48Z per `zao-vault/handoffs/status/zaalcaster.md`) but doc 2408's own question 5 was never closed** - it is still listed open in 2408's Open Questions table, and 2408's own Next Action to answer it (due 2026-08-31) is still unmet there. The old Next Action shipped half of what it promised.
> 5. **Everything else is unchanged since 2026-09-15**, reconfirmed live: 95 repos (58 public / 37 private / 68 forks / 27 sources, same 27 names byte for byte), `WE-CFM-Orchestrator` still private with `contents/LICENSE` 404ing (no LICENSE file) and last push still 2026-04-29, member `gitgoin87` still 404s on direct lookup, Zaal still at 0 commits and 0 issues/PRs org-wide.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Whose org this is | **It is Mauro's (jdwalka / mauronaz), the ZABAL Gamez S1 builder finalist. Treat it as a collaborator's estate, not ZAO's.** Answers doc 2408 question 5 in substance - 2408's own table has not been edited to reflect that (see Updated note 4). | Org contact email is Mauro's personal Gmail; the only human committer on the source repos is `mauronaz` (account created 2026-08-26); `zao-vault/people/REGISTER-2026-09-03.md` independently names the same inbox "Mauro Mark Nazareno Fanelli" and flags `his address at his own leaksnipe.win domain (redacted - third-party personal email, not for the repo)` as likely the same person (unconfirmed link between the two addresses); doc 2441 lists "Mauro / jdwalka (finalist)" on the ZABAL builder-battle Space; `projects/TEAMS.md` (confirmed 2026-08-24, still current) records "working with him". Zaal has **0 commits and 0 issues or PRs** in the org, reconfirmed 2026-09-25. |
| 2 | Zaal's `admin` role | **Still open, past its own deadline. Ask Mauro to drop Zaal to `member`, or confirm in writing why admin is wanted, by a real new date.** | Admin on an org with 37 private repos, no two-factor requirement (`two_factor_requirement_enabled: false`, reconfirmed), a Free plan, and a listed member (`gitgoin87`) that still 404s on lookup. Admin rights without any activity are exposure with no upside. The blog-URL flag from the 2026-09-15 version is retired (see #3). |
| 3 | The `leaksnipe.win` blog field | **No longer a red flag by itself.** | Fetched FULL 2026-09-25: HTTP 200 after a 301 from `www.leaksnipe.win` to `home.leaksnipe.win`, 197,392 bytes read in full. It is a working poker-analytics product page - Tauri/React desktop app, Python/FastAPI sidecar, MCP connector, Monte Carlo equity engine, CFR+ solver - matching the org's own poker-tooling repos. Nothing in the content is concerning. |
| 4 | Moving ZAO repos here for org-only features (custom properties, doc 2489) | **NO.** | It is not ZAO's org, and doc 2489 already settled on topics for user accounts. Unchanged. |
| 5 | The 68 forks | **Ignore.** | `cli`, `react`, `tailscale`, `cloudflare-docs`, `build-your-own-x`, `mullvadvpn-app`... unmodified upstream forks, all 0 stars, plus 3 public non-forks that are CodeSandbox templates and a commit-art repo. Reconfirmed: same 68/27 split, same names, 2026-09-25. |
| 6 | The one thing worth a conversation | **`WE-CFM-Orchestrator`: a Kalshi UP/DOWN 15-minute crypto binary-contract predictions dashboard (Electron, Windows, "v2.5.0-momentum", PYTH momentum exits).** It is the closest working Kalshi client in Zaal's reach and doc 2340 parked "list a WaveWarZ battle as a market on Kalshi or Polymarket". Ask Mauro what he would license; do not copy anything until he does. | Private, **no LICENSE file** in the repo or in `WeCrypto` (`contents/LICENSE` 404 on both, reconfirmed 2026-09-25 - all rights reserved by default), 2 commits by `mauronaz`, last push still 2026-04-29 - no new work in almost 5 months. Six near-duplicate variants (`-PRODUCTION`, `-ORG`, `-dev`, `-`, `WE-CFM`) still exist, unchanged. |
| 7 | `wecrypto-farcaster` | **Go to the upstream instead: it is Neynar's `fc2x` example (crosspost Farcaster to X) copied verbatim, README included.** | Private, no LICENSE file, last push still 2026-06-17 (unchanged). The upstream is `neynarxyz/farcaster-examples/tree/main/fc2x`, which zaalcaster's own X fan-out in `api/send.js` already covers. |
| 8 | Poker tooling | **Not a ZAO thread; relevant only as Mauro's ZABAL portfolio - and now his `leaksnipe.win` product reads as the same portfolio, not a separate mystery.** | `Chroma_Poker` (MIT, but its README is a pasted copy of a sourcery-ai "autonomous advent of code" project, so the README does not describe the repo), `JohnDaWalka-Poker-Coach` (MIT), `Poka-coaches`, and the Truffle poker bot doc 2441 describes (2 to 5 ms decisions, three leaderboard wins on Chips AI). |
| 9 | The ZAO repo dashboard | **Do not add WalkerEnterprise to `bettercallzaal/zao-repos`' `ACCOUNTS` array.** | The dashboard's README pins the scope to ZAO accounts and public repos; this org is neither. Unchanged. |

## Findings

### 1. The org, measured

| Field | 2026-09-15 | 2026-09-25 |
|---|---|---|
| Login / name | `WalkerEnterprise` / "Walker Enterprise" | Unchanged |
| Type | Organization (so `orgs/...` endpoints work, unlike `bettercallzaal` and `ZAODEVZ`, which are User accounts) | Unchanged |
| Created / last updated | 2025-03-11 / 2026-08-04 | Unchanged (`updated_at` still 2026-08-04) |
| Description / blog / location | "developers" / `https://www.leaksnipe.win` (HTTP 403) / United States of America | Same fields; **blog now redirects to `home.leaksnipe.win` and returns HTTP 200** - see Updated note 1 and Finding 3 |
| Contact email | Mauro's personal Gmail (not reproduced here) | Unchanged; independently named "Mauro Mark Nazareno Fanelli" in `zao-vault/people/REGISTER-2026-09-03.md` |
| Plan / 2FA required | free / false | Unchanged |
| Repos | 95 total: 58 public, 37 private; **68 are forks**, 27 are sources | Unchanged (reconfirmed by a full re-paginated listing whose own `Link` header last-page marker reads `page=95` at `per_page=1`). Note: the org summary API's `total_private_repos` field itself reads **36**, one less than the actual listing count of 37 - a measured API undercount, not a real repo change; `owned_private_repos` reads a third number again (24). The repo listing is ground truth. |
| Members | 2: `bettercallzaal` (role `admin`, state `active`) and `gitgoin87` (id 264278389, **returns 404 on direct lookup**, so suspended, renamed or hidden) | Unchanged; `gitgoin87` still 404s |
| Pending invitations | 0 | Unchanged |
| Zaal's activity | 0 commits (`search/commits org:WalkerEnterprise author:bettercallzaal`), 0 issues or PRs | Unchanged, reconfirmed |
| Contributors on source repos | `mauronaz` only (created 2026-08-26, 1 public repo); `jdwalka` (created 2026-05-15, 1 public repo, 0 followers) is the handle the vault uses for the same person | Unchanged; `zao-vault/people/github/people.jsonl` independently snapshotted the org on 2026-09-20 and tagged its activity `DORMANT`, twitter handle `MauroMarkNaz`, 2 followers |

### 2. The 27 source repos, grouped

| Group | Repos | Visibility | Licence (LICENSE file read) | Last push |
|---|---|---|---|---|
| Kalshi predictions | `WE-CFM-Orchestrator`, `WE-CFM-Orchestrator-PRODUCTION`, `-ORG`, `-dev`, `WE-CFM-Orchestrator-`, `WE-CFM`, `WeCrypto` | private | none on `WE-CFM-Orchestrator` and `WeCrypto` (`contents/LICENSE` 404 on both, reconfirmed 2026-09-25) | 2026-04-29, 2026-04-20 (unchanged) |
| Poker | `Chroma_Poker`, `JohnDaWalka-Poker-Coach`, `JohnDaWalka-Poker-Coach-ghsa-59ch-pgcc-x89v`, `Poka-coaches`, `octo-bets` | private | MIT on `Chroma_Poker`, `JohnDaWalka-Poker-Coach`, `octo-bets` | 2025-06 to 2026-04 (unchanged) |
| Farcaster | `wecrypto-farcaster` (Neynar `fc2x` copy) | private | none | 2026-06-17 (unchanged) |
| Profile and scratch | `JohnDaWalka` (profile README: "built on an iOS proprietary CLA agreement with meta.ai"), `demo-repository`, `bug-free-octo-train`, `master`, `Freedom`, `Holiday-Activity`, `perplexity-AIG`, `Next.js`, `d1-template`, `skills-introduction-to-github`, `Apple-Developer-26-BETA-9-WATCH-OS-iOS-`, `Apple-OS-Developer-Beta-26-9`, `https-github.com-WalkerEnterprise-Datasync`, `cloudfalrwed-API` | mixed | not checked | various |

Only 3 of the 58 public repos are sources, and they are a CodeSandbox Next.js template, a Christmas-tree commit-activity repo, and a "perplexity IOS-Windows Custom Bot". Everything with substance is private. Re-pagination on 2026-09-25 found the same 27 source-repo names, byte for byte - no renames, no deletions, no additions since 2026-09-15.

### 3. `leaksnipe.win`, read in full for the first time (2026-09-25)

Previously FAILED on every route tried (2026-09-15: curl 403 block page, exa `CRAWL_UNKNOWN_ERROR`, Wayback availability API 429 twice). Re-run today with a real desktop-browser User-Agent string on curl (no other change): `curl -sIL https://www.leaksnipe.win` shows a 301 to `https://home.leaksnipe.win/`, and fetching that returns HTTP 200 with 197,392 bytes of real markup (re-checked twice). The earlier 403 was a bot-fingerprint block on curl's default UA and/or the bare domain, not a broken or private site.

The page is a marketing/documentation site for **LeakSnipe**, "a local-first poker study workstation":
- Imports poker hand histories from BetACR/ACR, CoinPoker, GGPoker, PokerStars, 888poker, Ignition and ReplayPoker into a local SQLite database.
- A five-stage loop - Track, Find, Review, Study, Improve - with a Windows HUD overlay, a 13x13 range-study matrix, a Monte Carlo equity engine (NLHE, Omaha Hi-Lo, stud, stud hi-lo), and a CFR+ solver backed by a neural value net.
- An "AI coach" exposed as **a standard MCP connector** with tool calls (`get_player_stats`, `search_hands`, `calculate_equity`, `run_cfr_solver`, `predict_value`, `web_search`) and a stated choice of LLM providers: **Anthropic, OpenAI, Gemini, DeepSeek, or ASI:One**, with local Ollama as a no-key fallback.
- Stack, per its own spec sheet: Tauri + React desktop shell, Python/FastAPI sidecar, SQLite storage, a Cloudflare Worker for sync and as the MCP endpoint, and a read-only bearer-token-gated tunnel back to the desktop database.

None of this is about data leaks, security, or anything adjacent to a scam; "leak" is poker terminology for an exploitable pattern in a player's own game. The product sits squarely alongside the org's `Chroma_Poker`, `JohnDaWalka-Poker-Coach` and Truffle-bot work (doc 2441) - it reads as Mauro's own poker-coaching product, built with the same tooling the org's private poker repos hold. No pricing, contact address, or legal page was found in the fetched HTML; the page is product marketing only.

Wayback's CDX index (`web.archive.org/cdx/search/cdx?url=leaksnipe.win`) shows exactly one snapshot, a `warc/revisit` record dated 2026-07-29 - consistent with the site existing well before this doc's first attempt, just not fetchable by the earlier route.

### 4. How the pieces connect to ZAO (from the library)

- `events/2441-zabal-gamez-builder-battle-space-1`: Mauro / jdwalka is a ZABAL Gamez S1 builder finalist; the Truffle poker bot; his Farcaster mini app scroll-drop question **still shows as Open / unanswered** in that doc's own action table as of 2026-09-25.
- `business/1222-qr-bid-zabal-reward-design`: jdwalka has two reward rows, "Chroma Poker" (builder) and "Predictive apps Space" (creator), both "Needs wallet".
- `events/2340-candy-zaal-wavewarz-prediction-market-aug12`: the WaveWarZ-as-oracle thread. Action 5, "get in front of Kalshi / Polymarket; list a WaveWarZ battle as a market", was claimed by nobody. Mauro's orchestrator is a live Kalshi API integration (UP/DOWN 15M markets, `floor_strike`, `yes_pct`, liquidity, close_time per its README architecture diagram) sitting inside an org Zaal already administers. That is the only reason this org matters to ZAO.
- `zlank` carries a Polymarket partner snap (`snap-resources/partners/polymarket.md`) and prediction-market block specs; no ZAO repo references Kalshi in code.
- `community/2408-zao-teams-and-collaborators-audit` question 5: **this doc answers it in substance, but 2408's own Open Questions table and Next Actions row still read as unresolved** - the cross-reference was never written back into 2408 itself. `zao-vault/projects/TEAMS.md` row "WalkerEnterprise / jdwalka" (line 72) **does** carry the cross-reference: "Confirmed 2026-08-24... Full org assessment in research doc 2491... Zaal is admin with zero activity, 68 of 95 repos are forks, one private unlicensed Kalshi client is the only ZAO-relevant repo." That half of the old Next Action shipped, via PR https://github.com/bettercallzaal/ZAOOS/pull/3525 (merged 2026-09-17T02:49:48Z per `zao-vault/handoffs/status/zaalcaster.md`).

## Also See

- [Doc 2408](../2408-zao-teams-and-collaborators-audit/) - raised the open question this doc answers in substance; that doc's own table has not been updated to say so (see Finding 4).
- [Doc 2441](../../events/2441-zabal-gamez-builder-battle-space-1/) - Mauro as finalist, the Truffle bot, the still-unanswered mini app question.
- [Doc 1222](../../business/1222-qr-bid-zabal-reward-design/) - jdwalka's reward rows, wallet still needed.
- [Doc 2340](../../events/2340-candy-zaal-wavewarz-prediction-market-aug12/) - the Kalshi / Polymarket thread this org's one useful repo touches.
- [Doc 2489](../../farcaster/2489-zaalcaster-repos-research-surface/) - the ZAO repo-organization decisions (topics on user accounts); this org is out of scope there.
- [Doc 998](../../infrastructure/998-github-repo-estate-audit/) - the ZAO estate audit, for contrast.
- `zao-vault/people/jdwalka.md` and `zao-vault/people/REGISTER-2026-09-03.md` - vault-side identity notes on Mauro, read directly for this update.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Message Mauro: (a) why is Zaal admin, (b) would he license the Kalshi client for a WaveWarZ market experiment; shipped = his two answers pasted into this doc as an update. (The old question (c), "what is leaksnipe.win," is answered by this doc's own fetch and no longer needs asking.) | @Zaal | DM (Zaal sends; draft available on request) | 2026-10-03 |
| Downgrade `bettercallzaal` to `member` in WalkerEnterprise unless Mauro gives a reason to stay; shipped = `gh api orgs/WalkerEnterprise/memberships/bettercallzaal --jq .role` returns `member` | @Zaal | Org setting (Zaal's tap, outward-facing) | 2026-10-03 |
| Write "answered by doc 2491" into doc 2408's own Open Questions table (row 5) and Next Actions row, not just into TEAMS.md; shipped = 2408's README on main names 2491 in both places | zaalcaster lane | Vault/research PR | 2026-09-30 |
| Answer Mauro's mini app scroll-drop question from doc 2441; shipped = reply sent, doc 2441's action table row changed from Open to Closed | @Zaal | Reply | 2026-10-03 |
| If licensing is granted (Next Action row 1, part b): scope a Kalshi read-only market probe as a research spike under `wavewarz/`, no trading, no keys in any repo; shipped = doc number reserved and brief written | WaveWarZ lane | Research doc | 2026-10-10, or wontfix if licensing is declined |

## Sources

Originally measured 2026-09-15 with the `bettercallzaal` token, which is an admin of the org, so private repos were visible to the audit but nothing private is quoted beyond names, dates and README first lines. Every source below was re-verified live on 2026-09-25 for this update, method noted per source.

- `gh api orgs/WalkerEnterprise`, `orgs/WalkerEnterprise/repos?type=all --paginate` (95 rows, re-run 2026-09-25: same 95, same 68 forks, same 27 source names), `orgs/WalkerEnterprise/members`, `orgs/WalkerEnterprise/memberships/bettercallzaal` (re-run 2026-09-25: `"role":"admin","state":"active"`, unchanged), `orgs/WalkerEnterprise/invitations` (still 0), `search/commits`, `search/issues` (both re-run 2026-09-25 for `org:WalkerEnterprise author:bettercallzaal`: still 0), `users/jdwalka`, `users/mauronaz`, `users/gitgoin87` (404, re-run 2026-09-25) - `[FULL, official API, method: gh api]`
- `repos/WalkerEnterprise/{WE-CFM-Orchestrator,WeCrypto,Chroma_Poker,wecrypto-farcaster,octo-bets,JohnDaWalka,JohnDaWalka-Poker-Coach}` metadata, contributors, `contents/LICENSE` (file read, not the API classifier; re-run 2026-09-25: still 404 on `WE-CFM-Orchestrator` and `WeCrypto`), `readme` - `[FULL, official API, method: gh api]`
- `gh search code kalshi --owner=bettercallzaal --owner=ZAODEVZ` (5 hits, 4 in zlank, 1 in ZAOOS research) - `[FULL, official API]` (not re-run 2026-09-25 - low-churn code search, no reason to expect a change in 10 days)
- `https://www.leaksnipe.win` - `[FULL, method: curl -sIL then curl -sL -A "Mozilla/5.0 ... Chrome/128", 2026-09-25 - 301 to home.leaksnipe.win, then HTTP 200, 197,392 bytes, HTML stripped and read in full, checked twice]`. Previously `[FAILED: curl HTTP 403 block page; exa web_fetch CRAWL_UNKNOWN_ERROR; Wayback availability API 429 twice, 2026-09-15]`.
- `http://web.archive.org/cdx/search/cdx?url=leaksnipe.win&output=json` - `[FULL, official API]`: one snapshot, `warc/revisit`, dated 2026-07-29.
- Local: `community/2408-zao-teams-and-collaborators-audit` (re-read 2026-09-25 - open question 5 still open there), `events/2441-zabal-gamez-builder-battle-space-1` (re-read 2026-09-25 - mini app question still Open), `business/1222-qr-bid-zabal-reward-design`, `events/2340-candy-zaal-wavewarz-prediction-market-aug12`, `zao-vault/projects/TEAMS.md` (re-read 2026-09-25 - line 72 confirmed carrying "doc 2491"), `zao-vault/people/jdwalka.md`, `zao-vault/people/REGISTER-2026-09-03.md`, `zao-vault/handoffs/status/zaalcaster.md` (PR 3525 merge time confirmed), `zao-vault/people/github/people.jsonl` (org snapshot dated 2026-09-20) - `[FULL, local read]`
- `bettercallzaal/zao-repos` README (`ACCOUNTS` scope) - `[FULL, official API]` (not re-checked 2026-09-25; no reason to expect the scope decision changed since doc 2489)
- Vault-wide grep for "leaksnipe", "mauronaz", "jdwalka" across `~/zao-vault/` - `[FULL, local read]`: found no record of the Mauro DM (why admin / license question) having been sent or answered anywhere in the vault. That part of the Next Actions is UNKNOWN, not confirmed done or confirmed not-done.
- Neynar `fc2x` upstream: `https://github.com/neynarxyz/farcaster-examples/tree/main/fc2x` - `[PARTIAL: identified from the copied README's own deploy-button URL; upstream not fetched, not needed for the decision]` (unchanged, not re-escalated - low stakes, decision does not depend on the upstream's own content)
