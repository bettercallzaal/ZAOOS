---
topic: community
type: audit
status: research-complete
last-validated: 2026-09-15
superseded-by:
related-docs: 2408, 2441, 1222, 2340, 2489, 998
original-query: "https://github.com/orgs/WalkerEnterprise/repositories here is a list of repos to /zao-research"
tier: STANDARD
---

# 2491 - WalkerEnterprise: what is in Mauro's GitHub org, why Zaal is its admin, and what ZAO can use

> **Goal:** Zaal sent the WalkerEnterprise repository list for research. Doc 2408 (2026-08-24) left it as open question 5: "Zaal is an org member... nothing anywhere says what the relationship is." This doc answers that from the org's own API surface, the vault, and the research library, all measured on 2026-09-15, and says what in the 95 repos is worth anything to ZAO. External-community sources do not apply: this is an audit of an org Zaal administers, the same footing doc 2408 used.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why (measured) |
|---|----------|----------------|----------------|
| 1 | Whose org this is | **It is Mauro's (jdwalka), the ZABAL Gamez S1 builder finalist. Treat it as a collaborator's estate, not ZAO's.** Closes doc 2408 question 5. | Org contact email is Mauro's personal Gmail; the only human committer on the source repos is `mauronaz` (account created 2026-08-26); doc 2441 lists "Mauro / jdwalka (finalist)" on the ZABAL builder-battle Space; `projects/TEAMS.md` (confirmed 2026-08-24) records "working with him". Zaal has **0 commits and 0 issues or PRs** in the org. |
| 2 | Zaal's `admin` role | **Ask Mauro to drop Zaal to `member`, or confirm in writing why admin is wanted.** Zaal decides by 2026-09-19. | Admin on an org with 37 private repos, no two-factor requirement (`two_factor_requirement_enabled: false`), a Free plan, a listed member that 404s on lookup, and a blog URL (`leaksnipe.win`) that returns 403 and could not be fetched by any route. Admin rights without any activity are exposure with no upside. |
| 3 | Moving ZAO repos here for org-only features (custom properties, doc 2489) | **NO.** | It is not ZAO's org, and doc 2489 already settled on topics for user accounts. |
| 4 | The 68 forks | **Ignore.** | `cli`, `react`, `tailscale`, `cloudflare-docs`, `build-your-own-x`, `mullvadvpn-app`... unmodified upstream forks, all 0 stars, plus 3 public non-forks that are CodeSandbox templates and a commit-art repo. |
| 5 | The one thing worth a conversation | **`WE-CFM-Orchestrator`: a Kalshi UP/DOWN 15-minute crypto binary-contract predictions dashboard (Electron, Windows, "v2.5.0-momentum", PYTH momentum exits).** It is the closest working Kalshi client in Zaal's reach and doc 2340 parked "list a WaveWarZ battle as a market on Kalshi or Polymarket". Ask Mauro what he would license; do not copy anything until he does. | Private, **no LICENSE file** in the repo or in `WeCrypto` (all rights reserved by default), 2 commits by `mauronaz`, last push 2026-04-29, six near-duplicate variants (`-PRODUCTION`, `-ORG`, `-dev`, `-`, `WE-CFM`). |
| 6 | `wecrypto-farcaster` | **Go to the upstream instead: it is Neynar's `fc2x` example (crosspost Farcaster to X) copied verbatim, README included.** | Private, no LICENSE file, last push 2026-06-17. The upstream is `neynarxyz/farcaster-examples/tree/main/fc2x`, which zaalcaster's own X fan-out in `api/send.js` already covers. |
| 7 | Poker tooling | **Not a ZAO thread; relevant only as Mauro's ZABAL portfolio.** | `Chroma_Poker` (MIT, but its README is a pasted copy of a sourcery-ai "autonomous advent of code" project, so the README does not describe the repo), `JohnDaWalka-Poker-Coach` (MIT), `Poka-coaches`, and the Truffle poker bot doc 2441 describes (2 to 5 ms decisions, three leaderboard wins on Chips AI). |
| 8 | The ZAO repo dashboard | **Do not add WalkerEnterprise to `bettercallzaal/zao-repos`' `ACCOUNTS` array.** | The dashboard's README pins the scope to ZAO accounts and public repos; this org is neither. |

## Findings

### 1. The org, measured

| Field | Value |
|---|---|
| Login / name | `WalkerEnterprise` / "Walker Enterprise" |
| Type | Organization (so `orgs/...` endpoints work, unlike `bettercallzaal` and `ZAODEVZ`, which are User accounts) |
| Created / last updated | 2025-03-11 / 2026-08-04 |
| Description / blog / location | "developers" / `https://www.leaksnipe.win` (HTTP 403) / United States of America |
| Contact email | Mauro's personal Gmail (not reproduced here) |
| Plan / 2FA required | free / false |
| Repos | 95 total: 58 public, 37 private; **68 are forks**, 27 are sources |
| Members | 2: `bettercallzaal` (role `admin`, state `active`) and `gitgoin87` (id 264278389, **returns 404 on direct lookup**, so suspended, renamed or hidden) |
| Pending invitations | 0 |
| Zaal's activity | 0 commits (`search/commits org:WalkerEnterprise author:bettercallzaal`), 0 issues or PRs |
| Contributors on source repos | `mauronaz` only (created 2026-08-26, 1 public repo); `jdwalka` (created 2026-05-15, 1 public repo, 0 followers) is the handle the vault uses for the same person |

### 2. The 27 source repos, grouped

| Group | Repos | Visibility | Licence (LICENSE file read) | Last push |
|---|---|---|---|---|
| Kalshi predictions | `WE-CFM-Orchestrator`, `WE-CFM-Orchestrator-PRODUCTION`, `-ORG`, `-dev`, `WE-CFM-Orchestrator-`, `WE-CFM`, `WeCrypto` | private | none on `WE-CFM-Orchestrator` and `WeCrypto` | 2026-04-29, 2026-04-20 |
| Poker | `Chroma_Poker`, `JohnDaWalka-Poker-Coach`, `JohnDaWalka-Poker-Coach-ghsa-59ch-pgcc-x89v`, `Poka-coaches`, `octo-bets` | private | MIT on `Chroma_Poker`, `JohnDaWalka-Poker-Coach`, `octo-bets` | 2025-06 to 2026-04 |
| Farcaster | `wecrypto-farcaster` (Neynar `fc2x` copy) | private | none | 2026-06-17 |
| Profile and scratch | `JohnDaWalka` (profile README: "built on an iOS proprietary CLA agreement with meta.ai"), `demo-repository`, `bug-free-octo-train`, `master`, `Freedom`, `Holiday-Activity`, `perplexity-AIG`, `Next.js`, `d1-template`, `skills-introduction-to-github`, `Apple-Developer-26-BETA-9-WATCH-OS-iOS-`, `Apple-OS-Developer-Beta-26-9`, `https-github.com-WalkerEnterprise-Datasync`, `cloudfalrwed-API` | mixed | not checked | various |

Only 3 of the 58 public repos are sources, and they are a CodeSandbox Next.js template, a Christmas-tree commit-activity repo, and a "perplexity IOS-Windows Custom Bot". Everything with substance is private.

### 3. How the pieces connect to ZAO (from the library)

- `events/2441-zabal-gamez-builder-battle-space-1`: Mauro / jdwalka is a ZABAL Gamez S1 builder finalist; the Truffle poker bot; his Farcaster mini app scroll-drop question went unanswered (still open in that doc's action table).
- `business/1222-qr-bid-zabal-reward-design`: jdwalka has two reward rows, "Chroma Poker" (builder) and "Predictive apps Space" (creator), both "Needs wallet".
- `events/2340-candy-zaal-wavewarz-prediction-market-aug12`: the WaveWarZ-as-oracle thread. Action 5, "get in front of Kalshi / Polymarket; list a WaveWarZ battle as a market", was claimed by nobody. Mauro's orchestrator is a live Kalshi API integration (UP/DOWN 15M markets, `floor_strike`, `yes_pct`, liquidity, close_time per its README architecture diagram) sitting inside an org Zaal already administers. That is the only reason this org matters to ZAO.
- `zlank` carries a Polymarket partner snap (`snap-resources/partners/polymarket.md`) and prediction-market block specs; no ZAO repo references Kalshi in code.
- `community/2408-zao-teams-and-collaborators-audit` question 5 and `projects/TEAMS.md` row "WalkerEnterprise / jdwalka": this doc is the answer; TEAMS.md should link here.

### 4. What could not be fetched

`leaksnipe.win`: `curl` returns HTTP 403 with a 5,401-byte block page, exa's fetcher errors, and the Wayback availability API answered 429 on two attempts three minutes apart. Whatever the site is, it is not readable from here, and an org whose public blog field points at an unreadable domain named "leaksnipe" is a fact Zaal should ask Mauro about before staying admin.

## Also See

- [Doc 2408](../2408-zao-teams-and-collaborators-audit/) - raised the open question this doc closes.
- [Doc 2441](../../events/2441-zabal-gamez-builder-battle-space-1/) - Mauro as finalist, the Truffle bot, the unanswered mini app question.
- [Doc 1222](../../business/1222-qr-bid-zabal-reward-design/) - jdwalka's reward rows, wallet still needed.
- [Doc 2340](../../events/2340-candy-zaal-wavewarz-prediction-market-aug12/) - the Kalshi / Polymarket thread this org's one useful repo touches.
- [Doc 2489](../../farcaster/2489-zaalcaster-repos-research-surface/) - the ZAO repo-organization decisions (topics on user accounts); this org is out of scope there.
- [Doc 998](../../infrastructure/998-github-repo-estate-audit/) - the ZAO estate audit, for contrast.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Message Mauro: (a) why is Zaal admin, (b) what is leaksnipe.win, (c) would he license the Kalshi client for a WaveWarZ market experiment; shipped = his three answers pasted into this doc as an update | @Zaal | DM (Zaal sends; draft available on request) | 2026-09-19 |
| Downgrade `bettercallzaal` to `member` in WalkerEnterprise unless (a) gives a reason to stay; shipped = `gh api orgs/WalkerEnterprise/memberships/bettercallzaal` returns `member` | @Zaal | Org setting (Zaal's tap, outward-facing) | 2026-09-19 |
| Add "see doc 2491" to the WalkerEnterprise row in `zao-vault/projects/TEAMS.md` and close doc 2408 question 5; shipped = both files reference 2491 on main | zaalcaster lane (this session) | Vault PR | 2026-09-16 |
| Answer Mauro's mini app scroll-drop question from doc 2441; shipped = reply sent, noted in 2441 | @Zaal | Reply | 2026-09-19 |
| If (c) is yes: scope a Kalshi read-only market probe as a research spike under `wavewarz/`, no trading, no keys in any repo; shipped = doc number reserved and brief written | WaveWarZ lane | Research doc | 2026-09-26 or wontfix if (c) is no |

## Sources

All measured 2026-09-15 with the `bettercallzaal` token, which is an admin of the org, so private repos were visible to the audit but nothing private is quoted beyond names, dates and README first lines.

- `gh api orgs/WalkerEnterprise`, `orgs/WalkerEnterprise/repos?type=all` (paginated, 95 rows), `orgs/WalkerEnterprise/members`, `orgs/WalkerEnterprise/memberships/bettercallzaal`, `orgs/WalkerEnterprise/invitations`, `search/commits`, `search/issues`, `users/jdwalka`, `users/mauronaz`, `users/gitgoin87` (404), `user/264278389` (404) - `[FULL, official API]`
- `repos/WalkerEnterprise/{WE-CFM-Orchestrator,WeCrypto,Chroma_Poker,wecrypto-farcaster,octo-bets,JohnDaWalka,JohnDaWalka-Poker-Coach}` metadata, contributors, `contents/LICENSE` (file read, not the API classifier), `readme` - `[FULL, official API]`
- `gh search code kalshi --owner=bettercallzaal --owner=ZAODEVZ` (5 hits, 4 in zlank, 1 in ZAOOS research) - `[FULL, official API]`
- Local: `community/2408-zao-teams-and-collaborators-audit`, `events/2441-zabal-gamez-builder-battle-space-1`, `business/1222-qr-bid-zabal-reward-design`, `events/2340-candy-zaal-wavewarz-prediction-market-aug12`, `zao-vault/projects/TEAMS.md` - `[FULL, local read]`
- `bettercallzaal/zao-repos` README (`ACCOUNTS` scope) - `[FULL, official API]`
- `https://www.leaksnipe.win` - `[FAILED: curl HTTP 403 block page; exa web_fetch CRAWL_UNKNOWN_ERROR; Wayback availability API 429 twice]`
- Neynar `fc2x` upstream: `https://github.com/neynarxyz/farcaster-examples/tree/main/fc2x` - `[PARTIAL: identified from the copied README's own deploy-button URL; upstream not fetched, not needed for the decision]`
