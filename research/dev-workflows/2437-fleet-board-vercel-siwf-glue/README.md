---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: 2313, 2419, 2420, 2423, 2429, 2433, 2435
original-query: "/glue evaluate \"fleet board web app on Vercel with SIWE/Farcaster sign-in\" - Zaal 2026-08-27 21:4x \"a full fleet board on a website on Vercel, locked, and partial in some places\"; 22:0x \"Fleet board auth: Sign-in with Ethereum / Farcaster - the first ZID use (two-week lane, /glue evaluate first)\". Produce the rung ladder for the board, the rung ladder for the lock, the public/locked split, a verdict per rung, the two-week pilot plan, and the board.jsonl field spec measured from orca terminal list --json and DONE.md."
tier: STANDARD
---

# 2437 - Fleet board on Vercel, locked with Sign In With Farcaster: the glue ladder, measured

> **Goal:** Decide, rung by rung, what the Vercel fleet board is made of (board rung
> 4: a sub-100-line static page that renders one file the organizer writes) and what
> locks it (lock rung 1 on day one: Vercel Authentication, already free on the Pro
> team; lock rung 2 in week two: `@farcaster/auth-kit` + `@farcaster/auth-client`
> lifted from ZAOOS's own `src/app/api/auth/verify/route.ts`), with the
> `handoffs/board.jsonl` field spec measured from what `orca terminal list --json`
> and `.handoffs/DONE.md` actually contain on 2026-08-28.

Every number below was measured on 2026-08-28 from a command or a raw fetch named
next to it. Nothing was installed (`--setup skip`), nothing was pushed to the vault,
no Orca setting was changed. Figures Zaal has not typed are **UNSET**.

## Key Decisions

| # | Decision | Call | Why (evidence) |
|---|---|---|---|
| 1 | Board rung | **Rung 4 - a thin adapter: one static HTML page + one ~30-line serverless function on Vercel that renders `handoffs/board.jsonl`.** Not vibe-kanban, not Crystal, not Claude Squad, not a Vercel port of zorca-gui. | Every rung-2 candidate fails the checklist on "runs where we run": vibe-kanban self-hosts on **Docker Compose on a Linux server with GitHub/Google OAuth** (raw fetch of its deploy guide), and it *runs agents* - a second orchestrator, which `agent-loops.md` rule 9 forbids. Crystal's README now says "Download Nimbalyst" - **0 commits in 180 days**, pivoted to a closed desktop app. Claude Squad is an AGPL Go TUI on tmux. zorca-gui / gui2 shell out to `/opt/homebrew/bin/orca` on every refresh (`gui/zorca-gui2` line 27) and so cannot leave the Mac. Section 3 carries the "nothing fits" block. |
| 2 | Lock rung, day one | **Rung 1 - Vercel Authentication, scope All Deployments, on the new project from the minute it exists.** Zero code. | The team `bettercallzaals-projects` is on **Pro** (`GET /v2/teams`, `billing.plan=pro`). Vercel's docs: "Vercel Authentication ... available on all plans"; "All Deployments: Protects all URLs, including production domains"; production-domain protection "need[s] a Pro or Enterprise plan" (raw fetch, page last updated 2026-08-21). Zaal is the only member, so the allowlist is already one person. |
| 3 | Lock rung, week two - the first ZID use | **Rung 2 - Sign In With Farcaster via `@farcaster/auth-kit` 0.8.2 + server-side `verifySignInMessage` from `@farcaster/auth-client` 0.7.1, both already in ZAOOS `package.json` (lines 48-49), verifier lifted from `src/app/api/auth/verify/route.ts` (268 lines). Allowlist = one FID, `19640`, from an env var.** SIWE as a second button only if Zaal asks; SIWN never. | Doc 2313 decision 2 picked exactly this pair for Sparkz web auth on 2026-08-17 and it holds today: auth-kit 0.8.2 published 2026-02-05, MIT from the LICENSE file (`farcasterxyz/auth-monorepo`, 12 contributors, last push 2026-03-30). **SIWN is deprecated** - Neynar's own page, raw fetch today: "new SIWN connections will stop being issued after Friday, August 14, 2026". `community.config.ts:43` already names `adminFids: [19640]`. |
| 4 | Where SIWE sits | **Second button, not first.** ZAOOS already has the pattern (`src/app/api/auth/siwe/route.ts`, 180 lines, `viem/siwe` - no `siwe` npm dep). Use it only if a wallet-only reader needs in. | `spruceid/siwe` 3.0.0 was published 2025-01-21, **0 commits in 180 days**, dual LICENSE-APACHE / LICENSE-MIT files at the repo root (glue-check reported "NO LICENSE FILE" because it looks for `LICENSE`; the files exist under the two names). Stable, not alive. `viem/siwe` is the maintained path and it is already a ZAOOS dependency (`viem` 2.47.2). |
| 5 | Privy / Dynamic | **SKIP for this board.** | Both are hosted identity vendors: Privy free to 500 MAU then $299/month (raw pricing page); Dynamic free to 1,000 MAU then $249 (raw). A one-reader board does not need a vendor in the login path, and the identity must land in ZID, not in a vendor's user table. Docs 282-284 keep them on the table for FISHBOWLZ-shaped products. |
| 6 | The board's only input | **`~/zao-vault/handoffs/board.jsonl` - one JSON line per pane per tick, fields in section 2, written by the organizer tick.** The board renders nothing else. | The tick already writes `organizer-inbox.md` every 5 minutes (automation `001be940` `organizer-tick`, `enabled`, next run `19:00Z`), and `orca-board --json` already emits the 9 fields that matter. The vault repo is **private** (`gh api repos/bettercallzaal/zao-vault --jq .private` = `true`). |
| 7 | The carrier (the gap) | **Nothing pushes the vault today.** The tick's NEVER list contains `git push`; `zao-vault-log` (hourly cron) commits and never pushes; `zorca-bundle` "Never pushes" (its header, line 4). A 5-minute launchd job that pushes ONLY `handoffs/board.jsonl` to the vault is the ~20-line rung-4 carrier, and it is a Zaal tap because it is a new push authority. | Measured: vault at 1 commit ahead of origin, 27 dirty files, last push-able commit 11:49. Without a carrier the Vercel board renders a file that never moves. |
| 8 | Repo | **A `board/` folder in `bettercallzaal/zorca` (MIT, public, already home to `gui/zorca-gui` and `gui/zorca-gui2`), Vercel project root directory = `board`.** No new repo. | glue-first section 1: no new home when one exists. Data never enters zorca: the page fetches `board.jsonl` from the private vault by GitHub token at request time. Reversible - a `git mv` to a ZAODEVZ repo later costs nothing. Logged here as an auto-proceed per `lane-autonomy.md`; Zaal overrides at the Monday tap. |
| 9 | ZID | **The pilot needs nothing from ZID. The second PR makes the first ZID use a READ: after SIWF, look up `users.zid` by fid and print "ZID 1" in the header.** No writes, no sequence, no reserved-block decision required. | Doc 2419: `users.zid` is live, Zaal is **ZID 1** in production (fid 19640), `assign_next_zid` has never run, and the open decisions (ZID 0, block size, ordering) are all writes. A read of one row by fid is independent of every one of them. |

## 1. What exists today (measured 2026-08-28)

| Thing | Measured | How |
|---|---|---|
| Orca terminals | **62** terminals, 1 orphaned, 62 connected; **15 fields** per terminal: `handle ptyId incarnationId orphaned worktreeId worktreePath branch tabId leafId title connected writable lastOutputAt preview executionHostId`; result envelope also carries `hostScope topologyRevisions totalCount truncated` | `orca terminal list --json` piped to a field-inventory script |
| Branch spread | 28 distinct branches; 10 panes on `refs/heads/main`, 10 with an empty branch (bare shells) | same JSON, `Counter(branch)` |
| `orca-board --json` | **63** rows, **9 fields**: `handle title cwd repo state ctx question tail rank`; states: waiting 32, bare-shell 19, asked-question 6, working 3, choice-prompt 2, idle-done 1 | `python3 ~/Documents/zorca/bin/orca-board --json` |
| zorca GUIs | `gui/zorca-gui` **411** lines on :7777, `gui/zorca-gui2` **3,076** lines on :7778, both stdlib Python, both call the `orca` binary, both "Never exposed off-localhost" (gui2 docstring) | `wc -l`, headers read |
| `.handoffs/DONE.md` | 12 lines, shape `YYYY-MM-DD TAG NNNN <PR url or NO-PR(...)> <free text>`; 5 tags this week (RESEARCH-MCP 3, RESEARCH-MEMORY-PREFIX 3, ZOE-COMMS 2, NG-COWORKER 2, HARNESS 2) | `awk '{print $2}' \| uniq -c` |
| `handoffs/organizer-inbox.md` | shape `HH:MM <lane> <text> verified=yes\|no next=<x>`; 8 lines since 14:08; last write 14:18 | `head` |
| Organizer automation | `001be940-...` `organizer-tick` `claude` `enabled`, custom schedule, prompt's NEVER list: "AskUserQuestion, orca terminal send, zorca-brief, any message outside this Mac, git push, force push, delete, rm -rf, npm install, edits inside any repo checkout, settings" | `orca automations list` / `show` |
| Vercel | team `bettercallzaals-projects` plan **pro**; personal scope hobby; **100** projects returned at `limit=100` (`zaoos`, `zaostock`, `zabalnewsletter` ... ) | `GET /v2/teams`, `GET /v9/projects` with the CLI token, token never printed |
| Vercel CLI | 48.12.0, logged in as `bettercallzaal` | `vercel whoami` |
| ZAOOS auth surface | `src/app/api/auth/verify/route.ts` 268 lines (SIWF, `createAppClient` + `viemConnector`, Supabase `auth_nonces`, `checkAllowlist`), `src/app/api/auth/siwe/route.ts` 180 lines (`viem/siwe`), `src/components/gate/LoginButton.tsx` 179, `src/components/providers/AuthKitWrapper.tsx` 17, `src/lib/gates/allowlist.ts` 90 | `wc -l`, files read |
| Vault | `bettercallzaal/zao-vault` **private**; `handoffs/board.jsonl` does not exist yet | `gh api`, `ls` |

## 2. `handoffs/board.jsonl` - the board's only input

One line per pane per tick. Every field names where the organizer gets it. `preview`,
`cwd`/`worktreePath`, `ptyId`, `incarnationId`, `worktreeId`, `tabId`, `leafId` are
**deliberately absent**: paths under `$HOME` and raw pane text are the two things
`secret-hygiene.md` and `pii-hygiene.md` keep off any surface that leaves the Mac,
and the six ids are Orca-internal handles the board never needs.

| Field | Type | Source (measured today) | Public strip? |
|---|---|---|---|
| `ts` | ISO-8601 UTC | tick clock | yes |
| `tick` | int | tick counter (organizer-inbox already numbers by time; the counter is new) | yes |
| `host` | `mac\|windows\|vps\|pi` | `executionHostId` (`local` today - the organizer maps it) | yes |
| `handle` | string | `orca terminal list --json` `.handle` (`term_...`) | no |
| `lane` | string | the `.handoffs/DONE.md` TAG when one exists, else the last path segment of `worktreePath` (`fleet-board-glue-0828`) | no |
| `repo` | string | `orca-board --json` `.repo` | no |
| `branch` | string | `.branch` with `refs/heads/` stripped; empty = bare shell | no |
| `state` | one of `ctx-critical choice-prompt asked-question waiting working idle-done bare-shell` | `orca-board --json` `.state` (the 6 seen today + `ctx-critical`, rank 0 in `bin/orca-board:33`) | yes, as counts only |
| `rank` | int 0-6 | `orca-board --json` `.rank` | no |
| `ctx` | int or null | `orca-board --json` `.ctx` (null on 63 of 63 rows today - the field exists, the scraper rarely fills it) | no |
| `title` | string | `.title` with the leading `✳ ` stripped | no |
| `question` | string or null | `orca-board --json` `.question` (first 200 chars) | no |
| `last_output_at` | ISO-8601 | `.lastOutputAt` (epoch ms today, e.g. `1787942790604`) | no |
| `done` | object or null | last `.handoffs/DONE.md` line for this lane: `{date, tag, doc, pr, text}` | `pr` only |
| `needs_zaal` | string or null | matching `NEEDS-ZAAL:` line from `handoffs/needs-zaal.md` | no |

Example (a real pane from today, `preview` and path removed):

```json
{"ts":"2026-08-28T18:23:00Z","tick":31,"host":"mac","handle":"term_71fc6a62-6056-446d-8c75-ebebcc1f836e","lane":"zaostock-production","repo":"zaostock","branch":"main-2","state":"choice-prompt","rank":1,"ctx":null,"title":"ZAOstock production plan 2026-10-03","question":"PICKER: Q1 - Changeover gaps. Proposed: 10 min after Crown Vics, 5 aft","last_output_at":"2026-08-28T18:23:36Z","done":null,"needs_zaal":null}
```

**Size:** 63 rows x ~330 bytes = ~21 KB per tick; 288 ticks/day = ~6 MB/day if
appended. The organizer **overwrites** the file each tick (the board shows now, not
history); history is `git log -p` on the vault, which is what the vault is for
(doc 2423). One `handoffs/board-history/` line per day if a chart is ever wanted -
not in the pilot.

**What the organizer must start writing on day one:** the file above, from
`orca-board --json` plus the DONE.md tail it already reads. That is one sentence
added to the tick prompt - "also write `handoffs/board.jsonl` from `orca-board
--json`" - and the prompt edit is Zaal's tap because the automation is his.

**The carrier (decision 7):** a launchd job every 5 minutes: `git -C ~/zao-vault
add handoffs/board.jsonl && git commit -q -m "board tick" && git push -q origin
main`, guarded by `zorca-lock check`-style "exit if nothing changed". Under 20
lines, git-tracked in `zaal-dotfiles`, named `com.zao.board-push`. It pushes ONE
path, never the 27 dirty files the orchestrator is holding.

## 3. The board ladder

Checklist columns per glue-first section 2; LICENSE read from the file
(Hard Requirement 13); "alive" = commits in the last 180 days from `glue-check`.

| Rung | Candidate | Licence (file) | Alive | Maintainers | Runs on Vercel | Brand via | Cost | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Orca's own worktree / agent view (the app) | closed, unaffiliated (zorca README) | vendor | Stably | no - Mac app | n/a | in the Orca licence Zaal pays (UNSET) | **KEEP as the Mac eyes**; it is not reachable from a phone |
| 1 | `orca artifacts share` - publishes an HTML/Markdown file at a public unlisted URL | n/a | live (`orca artifacts --help` today) | Stably | Orca-hosted, not Vercel | the HTML we write | free | **USE for the PUBLIC strip only** - "The public share URL is viewable without signing in" and publishing is off until Zaal flips Settings > Artifacts. Cannot lock. |
| 1 | GitHub renders `organizer-inbox.md` in the private vault on a phone, behind GitHub login | n/a | live | GitHub | GitHub, not Vercel | none | free | **This is the locked board that exists today**, and it is why the pilot can wait for a clean build: nothing is un-viewable meanwhile. Lock is GitHub, not ZID. |
| 2 | `BloopAI/vibe-kanban` | Apache-2.0 | yes - last push 2026-04-24 (glue-check; 100 commits/180d as of its last activity), 27,945 stars, 533 open issues | 61 contributors, top two 878/257 commits | **no** - "deploying Vibe Kanban Cloud on any Linux server using Docker Compose", GitHub/Google OAuth callback URL or `SELF_HOST_LOCAL_AUTH_EMAIL` (raw deploy guide) | none seen (`.env.example` no, theme dir no) | free | **SKIP** - it is an executor with its own task DB that spawns agents; running it beside Orca is two orchestrators on one Mac (rule 9). HN (195 pts, 132 comments): "Why does this need GitHub auth? This asks for unlimited private access to ones repo. This is a hard NO from me." (`csomar`) |
| 2 | `stravu/crystal` | MIT | **no** - last push 2026-02-26, 0 commits/180d; README now reads "Download Nimbalyst ... Built on production-grade desktop foundations with Electron" | 15 contributors, top author 617 of ~650 commits | no - Electron | n/a | free / Nimbalyst UNSET | **SKIP** - pivoted to a closed download. HN (8 pts): "I guess this will not work with a remote connection, or?" (`naiv`) - the same question this lane is answering. |
| 2 | `smtg-ai/claude-squad` | AGPL-3.0 (LICENSE.md) | yes - last push 2026-08-20, 24 commits/180d, 8,387 stars | 20 contributors, top two 116/87 | no - Go TUI, needs tmux (`brew install claude-squad`) | `config/theme dir yes` per glue-check | free | **SKIP** - a terminal multiplexer that competes with Orca for the panes; not a web board. |
| 3 | `zorca-gui` 411 / `zorca-gui2` 3,076 | MIT (zorca LICENSE) | yes - repo pushed 2026-08-2x | us (1) | **no** - both exec `/opt/homebrew/bin/orca` and `~/bin/orca-board` | Python string constants; doc 2420 tokens | free | **KEEP on the Mac; do not port.** The `:7777` bug has its own lane (`zorca-gui-fix-0828`). |
| 4 | **Static page + one function that renders `board.jsonl`** | MIT (lives in zorca) | new | us | **yes** - that is the whole point | one CSS block + the ICM `thezao` box for names | $0 incremental on the Pro team | **BUILD - the pilot.** ~60 lines HTML/JS + ~30 lines `api/board.js` (fetch raw file from the private vault with `GITHUB_TOKEN`, `Cache-Control: s-maxage=60`). |

### "Nothing fits" block (glue-first section 3, required for rung 4)

- **Two candidates and the line each failed:** vibe-kanban - "runs where we run"
  (Docker on Linux, not Vercel) and, harder, it is an agent runner not a viewer;
  zorca-gui2 - "runs where we run" (shells to `orca` on the Mac, cannot see the
  Mac from Vercel).
- **The search:** `grep -ril "vibe-kanban|crystal|claude-squad" research/*/README.md`
  (0 hits for all three - new to the library), glue-first-standard section 4 row
  "Fleet UI / board", `glue-check` on all five repos, HN Algolia for each.
- **The smallest adapter and why it is enough:** the static page IS the adapter -
  one file the organizer writes, one page that renders it, under 100 lines. It
  does not need to be more than enough, so this stays at rung 4 and never reaches
  rung 5.
- **Maintenance cost:** us; when Orca changes `orca-board --json`, the organizer's
  mapping changes, the page does not - it renders whatever keys arrive.

## 4. The lock ladder

| Rung | Candidate | Licence (file) / version | Alive | Gates ONE FID / ONE address with how much code | Runs on Vercel | Cost | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | **Vercel Authentication, scope All Deployments** | Vercel feature | vendor | **0 lines.** Allowlist = Vercel team members = Zaal. | yes | **$0** on the Pro team the account already pays (Pro seat price not re-quoted here; team is `pro` by API) | **USE on day one.** Also protects every preview URL by default. Does not know what a FID is - which is why rung 2 follows. |
| 1 | Vercel Password Protection | Vercel feature | vendor | 0 lines, one shared password | yes | **$150/month** - "Advanced Deployment Protection: $150/month" on the Pro plan page; "available on Enterprise plans or with the Advanced Deployment Protection add-on for Pro plans" | **SKIP** - $150 for a worse lock than the free one. |
| 1 | Vercel Trusted IPs | Vercel feature | vendor | 0 lines | yes | Enterprise (page fetched; plan line not captured in the strip - PARTIAL) | SKIP - phone IPs move. |
| 2 | **`@farcaster/auth-kit` 0.8.2 + `@farcaster/auth-client` 0.7.1** (SIWF) | MIT (`farcasterxyz/auth-monorepo` LICENSE), published 2026-02-05 | last push 2026-03-30, 2 commits/180d, 12 contributors, Farcaster org; 29 open issues, newest 2026-08-12 (#310, a `viemConnector` docs bug) | **~80 server lines** after lifting `verify/route.ts` and deleting Supabase nonce / Neynar lookup / DB allowlist (nonce becomes an HMAC cookie, allowlist becomes `BOARD_ALLOWED_FIDS=19640`); client = `SignInButton` (React) or `createAppClient().createChannel()` + poll (no React, the docs' "client library" path) | yes | free | **USE in PR 2 - the first ZID use.** Doc 2313 decision 2 verbatim. |
| 2 | Sign-In with Ethereum via `viem/siwe` (`siwe` npm 3.0.0 not needed) | viem MIT; `spruceid/siwe` LICENSE-APACHE + LICENSE-MIT | `siwe` npm: 0 commits/180d, published 2025-01-21; viem alive | ~same server lines as SIWF (`siwe/route.ts` pattern, 180 lines today), but needs a wallet connector on the client (wagmi + a modal) - 2-3x the client code of the QR button | yes | free | **SECOND BUTTON, only if asked.** Allowlist = `adminWallets` (empty today, `community.config.ts:45`). |
| 2 | Privy `@privy-io/react-auth` 3.38.0 | Apache-2.0, published 2026-08-25 | alive (1,827 versions) | ~40 lines but the user lives in Privy's table | yes | free to 500 MAU, then $299/mo (raw pricing) | SKIP (decision 5) |
| 2 | Dynamic `@dynamic-labs/sdk-react-core` 5.4.1 | MIT, published 2026-08-27 | alive (942 versions) | ~40 lines, same vendor shape | yes | free to 1,000 MAU, then $249/mo (raw pricing) | SKIP (decision 5) |
| - | Neynar SIWN | - | **deprecated 2026-08-14** (Neynar docs, raw) | - | - | - | **NEVER for new connections.** |

**Which gates one FID / one address with the least code:** Vercel Authentication
(zero) for a Vercel-account reader; for a Farcaster reader, auth-kit + auth-client
with the verifier already written in this repo.

## 5. What the board needs from ZID, and what it can do without

| Need | Without ZID (pilot) | With ZID (PR 2, read-only) | What ZID would have to grow (not in scope) |
|---|---|---|---|
| "Is this Zaal?" | `BOARD_ALLOWED_FIDS=19640` env var, compared to the verified fid | same check, then `GET /rest/v1/users?select=zid,username&fid=eq.19640` with the service key, server-side | nothing |
| Header identity | `@zaal` from the SIWF profile | **"ZID 1"** - the first time a ZID is shown anywhere outside the admin page (doc 2419: `zid=1, fid=19640, username=zaal`) | nothing |
| A second reader (Iman) | add a fid to the env var | allow `zid IS NOT NULL` - one query instead of an env edit | the reserved block and ordering decisions (doc 2419 section 5) - Zaal's, untouched by this doc |
| Sessions | HMAC cookie `{fid, exp}`, `SameSite=None; Secure` (doc 2313 decision 5, doc 591 lesson) | same, plus `zid` in the payload | nothing |

Nothing here calls `assign_next_zid`, and the latent sequence collision doc 2419
predicts is irrelevant to a read.

## 6. "Partial in some places" - the split

| Surface | Public (no login) | Locked (Vercel Auth / SIWF fid 19640) | Never leaves the Mac |
|---|---|---|---|
| Status strip `/` | counts per state (waiting 32 / bare-shell 19 / asked 6 / working 3 / choice 2 / done 1), `ts` of the last tick, host, an "organizer alive" dot that fails loud when `ts` is older than 15 minutes (doc 2420 staleness rule) | - | - |
| Board `/board` | - | every row: lane, repo, branch, state, rank, title, question, `last_output_at`, the DONE line, the NEEDS-ZAAL line | - |
| PR links | the `pr` URL from `done` (PRs are public already) | PR title + the DONE free text | - |
| Pane text | - | - | `preview` (raw terminal tail - can carry anything a lane printed), `cwd` / `worktreePath` (`$HOME` paths), the six Orca ids |
| Taps (gate-resolve, terminal send) | - | **not in the pilot** - the board is read-only (split note: the fleet board "Writes: nothing"). zorca-gui2 keeps the taps, on the Mac. | - |

The public strip is what `orca artifacts share` could publish today with no Vercel
at all; the pilot puts it on the same Vercel project so one file feeds both.

## 7. Verdicts

```
GLUE VERDICT - fleet board web app on Vercel
rung: 4
choice: board/ folder in bettercallzaal/zorca - index.html + api/board.js rendering handoffs/board.jsonl
licence: MIT (zorca LICENSE, "Copyright (c) 2026 Zaal Panthaki (The ZAO)") | alive: new | maintainers: us
brand via: one CSS block; names from the thezao ICM box; palette tokens from doc 2420 SPEC.md
data export: the file IS the export - handoffs/board.jsonl in the private vault, git history
runs on: vercel (measured by: GET /v2/teams -> plan=pro; vercel whoami -> bettercallzaal; 100 projects listed)
cost: $0 incremental on the existing Pro team (seat price UNSET - not re-quoted)
maintenance owner: us
nothing-fits evidence: section 3 block above
```

```
GLUE VERDICT - the lock
rung: 1 (day one) then 2 (week two)
choice: Vercel Authentication / All Deployments -> @farcaster/auth-kit 0.8.2 + @farcaster/auth-client 0.7.1, verifier lifted from src/app/api/auth/verify/route.ts
licence: Vercel feature / MIT (farcasterxyz/auth-monorepo LICENSE) | alive: last push 2026-03-30 | maintainers: 12 contributors, Farcaster org
brand via: AuthKitProvider config {domain, siweUri}; the button is the standard SIWF button (do not restyle a login button)
data export: n/a - the session is a cookie; the identity is fid 19640 -> ZID 1 in ZAOOS users
runs on: vercel (verify route already runs there for zaoos; vercel.json gives it memory 1024 / maxDuration 10)
cost: free
maintenance owner: Farcaster (auth-monorepo) upstream; the ~80 lifted lines are ours
nothing-fits evidence: n/a
```

## 8. The two-week pilot (Mon 2026-08-31 to Fri 2026-09-11)

| Step | What ships | Shipped when | Lines (estimate, UNMEASURED until the PR) |
|---|---|---|---|
| Day 1 tap | Zaal: approve the `board/`-in-zorca choice, edit the organizer prompt to also write `board.jsonl`, approve the `com.zao.board-push` launchd carrier | `handoffs/board.jsonl` exists in the vault and `git log -1 -- handoffs/board.jsonl` on origin is under 10 minutes old | ~20 (carrier) |
| **PR 1** (zorca) | `board/index.html` + `board/api/board.js`; Vercel project `zorca-board`, root `board`, env `GITHUB_TOKEN` (read-only fine-grained, vault only), **Vercel Authentication = All Deployments switched on before the first deploy** | the production URL 401s logged-out and renders 63 rows logged-in as Zaal; strip counts equal `orca-board --json` counts at the same tick | ~90 |
| **PR 2** (zorca) | `board/api/nonce.js` + `board/api/verify.js` (lifted from ZAOOS `verify/route.ts`, Supabase and Neynar removed), `board/api/board.js` gated on the session cookie, `/` public strip, `/board` locked, header shows **ZID 1** from the `users` read; Vercel Authentication dropped to Standard Protection (previews only) | logged-out `/` shows counts and no titles; `/board` shows the SIWF QR; after sign-in with fid 19640 the board renders and the header reads `ZID 1`; a second fid gets 403 | ~200 (over the rung-4 line - honest: the lock is rung 2 library + rung 4 glue) |
| Fri 09-11 | doc 2437 follow-through note: what the board showed that the Mac did not, waiting% before/after (`handoff-discipline.md` metric) | the note is appended to this doc | 0 |

Not in the pilot, on purpose: taps from the board (gate-resolve), history charts,
the Windows / VPS / Pi hosts (they have no organizer yet), SIWE button, any ZID write.

## Community signal (grounded)

- HN "Show HN: Vibe Kanban" (195 points, 132 comments, 2025-07-11, Algolia items
  API, full comment tree fetched): the two objections that shaped decision 1 are
  `csomar` on the GitHub-auth scope and `remram`: "Why do you need to 'manage' your
  coding agents like they are people? ... Don't you just prompt an[d] immediately
  review the result?" - which is the read-only-board answer this doc lands on.
  `lharries` asked for "a hosted version so I can have my team collab on it" - the
  Vercel board is that, for one team.
- HN "Multiple Claude Code Sessions in an Easy UI: Crystal" (8 points, 2025-06-12):
  `naiv`: "I guess this will not work with a remote connection, or?" - unanswered
  in the thread; answered here by putting the file, not the app, on the network.
- GitHub `farcasterxyz/auth-monorepo` issue #310 (2026-08-12): the `viemConnector`
  examples "pass a bare string and silently use the" default - read the ZAOOS verify
  route's `viemConnector({ rpcUrl })` object form when lifting, which already avoids it.
- Reddit: **FAILED** - `zao-fetch-reddit.sh --selftest` today: public `.json`
  returns `text/html` (walled), 1 of 3 redlib instances answered. Not attempted
  further; nothing in this doc rests on it.

## Also See

- [Doc 2313](../../farcaster/2313-farcaster-auth-primitives-sparkz/) - the auth-kit + verifySignInMessage decision this lifts, and the SIWN deprecation.
- [Doc 2419](../../identity/2419-zid-state-and-signup-spec/) - ZID live state; ZID 1 = Zaal; the decisions this doc does not touch.
- [Doc 2420](../../agents/2420-zorca-gui-redesign/) - the attention-router spec and staleness rule the strip reuses.
- [Doc 2423](../../agents/2423-vault-as-transport-inter-terminal-context/) - why the file lives in the vault and history is git.
- [Doc 2429](../2429-githubprojects-top-100-glue-scored/) - the glue-first scoring shape this follows.
- [Doc 2435](../../agents/2435-ng-openworker-vs-our-stack/) - the organizer split this board reads from.
- `~/zao-vault/notes/orchestrator-organizer-split.md` (shape A decided 2026-08-28 13:1x) and `~/zao-vault/notes/glue-first-standard.md` sections 1-4.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Tap: confirm `board/` in zorca (or name a ZAODEVZ repo), and add "also write `handoffs/board.jsonl` from `orca-board --json`" to automation `001be940`'s prompt - shipped when `git log -1 -- handoffs/board.jsonl` exists in the vault | @Zaal | Orca settings + one prompt line | 2026-08-31 |
| Ship `com.zao.board-push` launchd carrier (push one path every 5 min) in `zaal-dotfiles`, git-tracked - shipped when origin's `board.jsonl` is under 10 min old at any check | @Zaal (push authority) with the fleet-board lane drafting the PR | PR (zaal-dotfiles) | 2026-09-01 |
| PR 1: `board/index.html` + `board/api/board.js` in zorca, Vercel project `zorca-board` with Vercel Authentication = All Deployments ON before first deploy - shipped when logged-out = 401 and logged-in renders the same row count as `orca-board --json` | fleet-board lane, Zaal merges | PR (zorca) | 2026-09-02 |
| PR 2: SIWF lock (nonce + verify lifted from `src/app/api/auth/verify/route.ts`), `/` public strip, `/board` locked to fid 19640, header reads `ZID 1` from `users` - shipped when a second fid gets 403 and the header string is verified by screenshot | fleet-board lane, Zaal merges | PR (zorca) | 2026-09-09 |
| Append the follow-through note to this doc (what the board caught, waiting% delta) - shipped when the note carries a date and two numbers | fleet-board lane | doc edit | 2026-09-11 |
| Record the adoption line "auth-kit + auth-client for the board lock" in `~/zao-vault/notes/adoption-candidates.md` (vault is the orchestrator's - row text is in DONE.md) | @Zaal / orchestrator | vault note | 2026-08-31 |

## Sources

Method key: `raw` = curl with a browser user-agent + HTML strip, quoted from the text
file; `api` = a JSON endpoint; `local` = a command on this Mac; `file` = a file read.

- [Vercel - Deployment Protection](https://vercel.com/docs/deployment-protection) - **FULL**, raw, 18,328 chars; quotes on scope and plan.
- [Vercel - Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) - **FULL**, raw, 13,135 chars; "available on all plans", Hobby "one external user".
- [Vercel - Password Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection) - **FULL**, raw, 9,194 chars; last updated 2026-08-21; add-on wording.
- [Vercel - Pro plan](https://vercel.com/docs/plans/pro) - **PARTIAL**, raw, 16,807 chars; "Advanced Deployment Protection: $150/month" captured; the per-seat price line did not survive the strip and is not quoted.
- [Vercel - Trusted IPs](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/trusted-ips) - **PARTIAL**, raw, 10,812 chars; plan line not captured.
- Vercel API `GET /v2/teams`, `GET /v2/user`, `GET /v9/projects` - **FULL**, api, with the CLI's stored token (never printed).
- [Farcaster AuthKit introduction](https://docs.farcaster.xyz/auth-kit/introduction) and [installation](https://docs.farcaster.xyz/auth-kit/installation) and [client](https://docs.farcaster.xyz/auth-kit/client/introduction) - **FULL**, raw (610 / 1,483 / 1,363 chars - short pages).
- [Neynar - SIWN](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) - **FULL**, raw, 5,186 chars; deprecation banner quoted verbatim.
- [SIWE overview (login.xyz)](https://docs.login.xyz/general-information/siwe-overview) - **FULL**, raw, 2,441 chars.
- [Privy pricing](https://www.privy.io/pricing) - **FULL**, raw, 19,765 chars. [Dynamic pricing](https://www.dynamic.xyz/pricing) - **FULL**, raw, 6,477 chars.
- [Vibe Kanban - Deploy with Docker Compose](https://vibekanban.com/docs/self-hosting/deploy-docker) - **FULL**, raw, 10,639 chars.
- npm registry JSON for `siwe`, `@farcaster/auth-kit`, `@farcaster/auth-client`, `@neynar/react`, `@privy-io/react-auth`, `@dynamic-labs/sdk-react-core` - **FULL**, api.
- `glue-check` on `BloopAI/vibe-kanban`, `stravu/crystal`, `smtg-ai/claude-squad`, `spruceid/siwe`, `farcasterxyz/auth-monorepo` - **FULL**, api (`gh`), LICENSE files read; plus `gh api repos/spruceid/siwe/contents/` to find `LICENSE-APACHE` / `LICENSE-MIT`, and the three READMEs via `gh api .../readme`.
- [HN 44533004 Vibe Kanban](https://news.ycombinator.com/item?id=44533004) - **FULL**, api (Algolia `items`), 38 top-level comments read. [HN 44259353 Crystal](https://news.ycombinator.com/item?id=44259353) - **FULL**, api.
- [orca.stably.ai](https://orca.stably.ai/) - **FAILED** (curl exit, HTTP 000, twice); [docs.stably.ai](https://docs.stably.ai/) - **FULL** but it is the Stably testing product, not Orca. Orca facts come from the local CLI (`orca --help`, `orca skills get orca-cli`, `orca artifacts --help`, `orca automations list/show`) - local.
- Reddit - **FAILED**, `zao-fetch-reddit.sh --selftest` (walled).
- Local: `orca terminal list --json`, `orca-board --json`, `wc -l` on zorca GUIs and ZAOOS auth files, `.handoffs/DONE.md`, `~/zao-vault/handoffs/organizer-inbox.md`, `grill-next.md`, `needs-zaal.md`, `crontab -l`, `~/Library/LaunchAgents`, `git -C ~/zao-vault log/status`, `~/bin/zao-vault-log`, `~/bin/zorca-bundle` - local / file.
- ZAOOS: `src/app/api/auth/verify/route.ts`, `src/app/api/auth/siwe/route.ts`, `src/components/gate/LoginButton.tsx`, `src/components/providers/AuthKitWrapper.tsx`, `src/lib/gates/allowlist.ts`, `community.config.ts`, `package.json`, `vercel.json` - file. Docs 2313, 2419, 2420 - file.
