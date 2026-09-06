---
topic: business
type: audit
status: research-complete
last-validated: 2026-09-06
related-docs: 2202, 2203, 759, 625, 415, 768, 533, 631, 626, 2308, 2266
original-query: "The poidhz platform and how The ZAO brings its energy to poidh - what we have built on poidh, what ZAO uniquely contributes, and how that reads to the poidh ecosystem"
tier: STANDARD
---

# 2466 - poidhz: what the platform actually is, measured

> **Goal:** An honest internal audit of the poidhz platform against the live poidh
> ecosystem, so the story we tell about ZAO's contribution is one that survives someone
> checking it. Doc 2202 set the "ZAO becomes POIDH's tooling layer" thesis on 2026-08-05;
> this doc tests that thesis a month later against measured data, and reports where it
> holds, where it does not, and what is quietly broken.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **Do not claim ZAO brings "energy" to poidh in the sense of volume or cadence. We will lose that argument on the first check.** Claim craft, completion and infrastructure instead. | Log a Dog runs a **daily** bounty series on poidh at ~$52/day, product-integrated, with a fresh page every day (bounty 1366, 2026-09-06). ZAO has cast **5 rounds since April**. That is roughly 30:1 on frequency against us. The defensible claims are different and stronger - see #2. |
| 2 | **Lead with completion rate and prize size, both measured.** 41 of 89 open poidh bounties (**46%**) have zero submissions. Every ZAO round that ran drew **8 to 11 claims**, 36 across four rounds, never zero. ZAO's prizes ($26-$63) run **2x to 5x** the platform's $13.27 median. | This is the real differentiator and it is checkable from poidh's own public endpoint. "Our bounties get answered and theirs often do not" is a stronger and more honest claim than "we bring the energy." |
| 3 | **Fix the name split before the weekend post, or the post advertises a URL that does not exist.** The repo is renamed `poidhz`, every doc says poidhz, and the only working deployment is **`zpoidh.vercel.app`**. `poidhz.xyz` and `poidhz.com` do not resolve; `poidhz.vercel.app` 404s. | A post that says "poidhz" and links anything poidhz-branded lands on nothing. Either buy the domain, rename the Vercel project, or write the post around the URL that works. This is a 10-minute fix that otherwise breaks the launch it is meant to support. |
| 4 | **Stop citing `bettercallzaal.com/poidh-*` in bounty descriptions.** Those pages are alive at `zpoidh.vercel.app`, and the URL we hand entrants redirects to a GitHub repo instead. | The `rounds/_template/description.md` tells every future round to cite the canonical bar at `bettercallzaal.com/poidh-bounty-best-practices.html`. Measured today it 200s only after redirecting to `github.com/bettercallzaal/poidhz`. We built the page, host the page, and point clippers at a repo. |

## The thesis from doc 2202, tested a month on

Doc 2202 (2026-08-05) argued the ZAO/poidh alignment is not "run a bounty together" but
"ZAO becomes the tooling layer POIDH's ecosystem runs on," and noted Kenny is on record
wanting exactly that - he has said he does not want poidh.xyz to be the only front end.

**The thesis holds, and the month since has made it more true, not less.** What did not
exist on 2026-08-05 and does now: a public deployment with 7 working surfaces, two data
refresh crons, a 89-bounty platform-wide dashboard with task classification, and a
deadline parser covering a field poidh does not populate.

**The thesis has one hole this doc adds:** the tooling layer is real, deployed, and
effectively unadvertised. It is reachable only at the pre-rename URL, and the URLs our own
bounty copy hands to poidh users do not reach it.

## What poidh actually is, measured 2026-09-05/06

Not from docs. From `poidh.xyz/<chain>/bounty/<id>/data` and the repo's own scan.

- **The platform is small.** Highest live bounty id across all chains is **1366**, created
  2026-09-06. Base's on-chain counter is at **380**. R5 was global id 1330 / Base 344 on
  2026-08-19, so poidh added roughly **36 bounties in 17 days - about 2 per day, all
  chains combined.**
- **Of the 89 open bounties** in `data/bounty-dashboard.json` (generated 2026-09-03):

| Measure | Value |
|---|---|
| Median prize | **$13.27** (mean $72.00, dragged by a single $2,503.72 outlier) |
| Total value on the open board | $6,408 |
| Bounties with zero submissions | **41 of 89 (46%)** |
| Bounties with no parseable deadline | **77 of 89 (87%)** |
| Distinct issuers | 41 |
| Chains | Base 70, Arbitrum 14, Mainnet 5 |
| Task mix | build 26, code 16, photo 16, unclassified 14, clip 8, social 6, writing 3 |

The 87% deadline finding matches doc 2202's independent result from a different scan
(0 of 100 open bounties had the on-chain `deadline` field populated). Two scans, a month
apart, same conclusion: **poidh has a deadline field almost nobody sets.** That is the gap
`scripts/deadline_parser.py` and the calendar exist to fill, and it is the single clearest
example of ZAO building the thing poidh lacks.

## ZAO's five rounds against that board

| Round | Bounty | Prize (USD at query) | Claims | State |
|---|---|---|---|---|
| R1 | 1151 | $26.29 | 11 | winner set, paid |
| R2 | 1166 | $26.29 | 8 | winner set, paid |
| R3 | 1180 | $62.60 | 8 | winner set, paid |
| R4 | 1249 | $34.55 | - | **canceled at closeout** |
| R5 | 1330 | $59.59 | 9 | winner set, paid 2026-09-05 |

Four of five resolved with a winner. **36 claims across the four that ran.** Every single
one cleared the platform median by 2x or more, and not one drew zero in a field where 46%
draw zero.

R4 is in the table on purpose. It was accidentally canceled at closeout rather than
resolved through the intended vote-and-disperse path, and 15 builders were paid in $ZABAL
credit instead of the ETH split they were promised. A platform audit that hides its one
failure is marketing.

## What we have actually built

Measured in `~/Documents/zpoidh` on 2026-09-06.

- **14 Python tools** in `scripts/`, including `query-bounty.py` (merges poidh's `/data`
  endpoint with `claims.fetchBountyClaims` to recover the real `isAccepted` flag, which
  `/data` alone does not carry), `deadline_parser.py`, `scan-poidh-deadlines.py`,
  `build-bounty-dashboard.py`, `refresh-poidh-leaderboard.py`.
- **6 HTML surfaces** in `docs/`, including a standalone `create-bounty.html` that lets
  anyone cast a poidh bounty from their own browser wallet with no Farcaster app.
- **2 GitHub Actions crons** refreshing the leaderboard and the dashboard/calendar.
- **8 published data files**, CORS-open per `vercel.json`, including
  `data/leaderboard.json` served at `/leaderboard` with a 60-second cache. Anyone can
  consume our data layer. Nobody has been told it exists.

### Live surface check, 2026-09-06

| Path on `zpoidh.vercel.app` | Status |
|---|---|
| `/` | 200, 22.7 KB |
| `/dashboard` | 200 |
| `/hub` | 200 |
| `/about` | 200 |
| `/best-practices` | 200 |
| `/leaderboard` | 200, JSON |
| `/round/5` | 200 |
| **`/calendar`** | **404** |

**`/calendar` is broken.** `vercel.json` rewrites `/calendar` to `/index.html`, and `/`
serves that same file at 200 - so the front page works and its own advertised path does
not. The root README calls the calendar the front page. Whatever the post says about the
calendar, that link is dead today.

## What is quietly broken

1. **`/calendar` 404s** (above). Rewrite bug, front-page feature.
2. **The leaderboard cron fails intermittently.** 2 of the last 8 runs failed
   (2026-09-05T20:12, 2026-09-06T04:11), both with `urllib.error.HTTPError: HTTP Error
   504: Gateway Timeout` from `poidh.xyz/<slug>/bounty/<id>/data` at
   `scripts/refresh-poidh-leaderboard.py:111`. **This is the guard from PR #107 working
   as designed** - it refuses to publish degraded data over live data and fails loudly
   instead. The defect is that there is no retry, so any transient upstream 504 turns
   into a red build. poidh's endpoint is the flaky dependency, not our code.
3. **The name is split three ways.** Repo `poidhz`, deployment `zpoidh.vercel.app`,
   domains `poidhz.xyz` / `poidhz.com` unregistered. The rename that the 2026-08-21
   handoff listed as pending has happened on GitHub and nowhere else.
4. **Every `bettercallzaal.com/poidh-*` URL redirects to the GitHub repo** - the canonical
   bar, the leaderboard hub, the per-round judging pages. `rounds/_template/description.md`
   instructs every future round to cite one of them.
5. **R5's winner was paid on 2026-09-05 and has never been announced.** The bounty text
   promised "the clip goes up on @wavewarz with your name on it." Copy is drafted and
   unsent at `rounds/r5/winner-announce.md`.
6. **The `_template` winner-announce contains two false claims** for any round that does
   not run a $ZABAL trail: it promises every submitter an Empire Builder airdrop, and
   links a per-round judging page that was never built. R5 has no $ZABAL trail at all.
7. **Three open issues, all blocked on people outside the repo** - #5 (Unlock budget),
   #8 (spark tool), #10 (Mauro's poker game). Nothing to build; re-check periodically.

## How this reads to the poidh ecosystem

Honestly: **it does not read at all yet, because nobody there has been shown it.**

The evidence that this is a distribution problem rather than a quality problem is R5
itself. R5 was never announced from @wavewarz and never posted in the WaveWarZ Clippers
Telegram, where the people who clip that exact stream for points already are. It drew nine
claims anyway. A round that reached none of its own audience still beat the platform's
46%-get-nothing baseline.

The same pattern holds one level up. We built a public data layer for poidh, deployed it,
made it CORS-open, and told nobody - including Kenny, who is on record asking for exactly
this and who gave us the undocumented `/data` endpoint directly (doc 2202).

**The asset is built. The telling has not happened.** That is a cheaper problem than the
alternative, and it is the one to spend the weekend on.

## Also See

- [Doc 2202](../2202-poidh-zao-collab-current-state-brand-alignment/) - current state + the tooling-layer thesis this doc tests
- [Doc 2203](../2203-poidh-zao-full-lore-history/) - the origin-to-now narrative
- [Doc 759](../759-poidh-history-origin-to-2026/) - poidh history and Kenny's framing
- [Doc 625](../../community/625-poidh-zao-bounty-playbook/) - the bounty playbook
- [Doc 2308](../../community/2308-poidh-weekly-zao-video-competition-spec/) - claim-is-entry rule

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the name: buy `poidhz.xyz` or rename the Vercel project so `poidhz.*` resolves. Shipped when a poidhz-branded URL returns 200. | @Zaal | Decision + purchase | 2026-09-07, before the weekend post |
| Post R5's winner on @wavewarz crediting @wimpydwi, from `rounds/r5/winner-announce.md`. Shipped when the post is live. | @Zaal | Post | 2026-09-06 |
| Fix the `/calendar` 404 in `vercel.json`. Shipped when `zpoidh.vercel.app/calendar` returns 200. | @Zaal | PR | 2026-09-08 |
| Add a retry-with-backoff around `http_get` in `scripts/refresh-poidh-leaderboard.py` so a poidh 504 does not red-build the cron. Shipped when PR merged. | @Zaal | PR | 2026-09-10 |
| Replace the dead `bettercallzaal.com/poidh-*` citations in `rounds/_template/` and `docs/how-to-draft-next-bounty.md` with working URLs. Shipped when PR merged. | @Zaal | PR | 2026-09-10 |
| Strip the false $ZABAL-airdrop and judging-page claims from `rounds/_template/cast-templates/winner-announce.md`. Shipped when PR merged. | @Zaal | PR | 2026-09-10 |
| Tell Kenny the data layer exists and is CORS-open. Shipped when the message is sent. | @Zaal | Outbound | 2026-09-12 |

## Sources

Method is stated per source, per the skill's fetch-quality gate. Everything load-bearing
here came from a raw API response, a live HTTP status, or the local filesystem. No claim in
this doc rests on a WebFetch summary.

- [FULL - raw JSON via curl] `https://poidh.xyz/base/bounty/<id>/data` for bounties 1151, 1166, 1180, 1249, 1330, 1340, 1360, 1366. Prize amounts, claim counts, `isAccepted`, `onChainId`, `createdAt`. Verified 2026-09-05 and 2026-09-06.
- [FULL - repo tool] `python3 scripts/query-bounty.py --bounty <id>` in `~/Documents/zpoidh`, which merges `/data` with `claims.fetchBountyClaims`. This is how `isAccepted` was confirmed; `/data` alone does not carry it.
- [FULL - local file] `~/Documents/zpoidh/data/bounty-dashboard.json`, generated 2026-09-03T21:11:29Z. Source of the 89-bounty distribution, median, submission rate, deadline rate, issuer count, task mix.
- [FULL - binary search over live HTTP] Highest live bounty id = 1366, by bisecting 1360-1380 against the `/data` endpoint. 1380/1400/1450 return 404.
- [FULL - live HTTP status checks] All 8 `zpoidh.vercel.app` paths, plus `poidhz.xyz`, `poidhz.com`, `poidhz.vercel.app`, `bettercallzaal.github.io/poidhz/`, and four `bettercallzaal.com/poidh-*` URLs. Verified 2026-09-06.
- [FULL - `gh run list` / `gh run view --log-failed`] GitHub Actions history for `refresh-leaderboard.yml`. Exact traceback and the `HTTP Error 504` line quoted verbatim from the failed run of 2026-09-06T04:11.
- [FULL - local files] `~/Documents/zpoidh/vercel.json`, `scripts/`, `docs/`, `.github/workflows/`, `rounds/r1`-`r6`, `README.md`, `docs/RECAP.md`.
- [FULL - local files] Docs [2202](../2202-poidh-zao-collab-current-state-brand-alignment/) and [2203](../2203-poidh-zao-full-lore-history/) in this library, read in full for the thesis and the Kenny framing this doc tests rather than re-derives.
- [PARTIAL - client-side rendered, no JSON endpoint] `https://wavewarz.info/battles` and `/leaderboards`. Battle count (1,371, test battles excluded) and SOL price ($103.99) read from stripped HTML. SOL volume and artist-earnings totals could NOT be retrieved - the figures are rendered client-side and the site exposes no API. Escalation was not pursued past curl because these numbers are not load-bearing for this doc's conclusions; they are flagged in `rounds/r6/README.md` as needing a direct answer from WaveWarZ before any round quotes them.

**Deviation from the STANDARD tier, stated rather than papered over:** Hard Requirement 7
asks for at least one community source (Reddit / HN / GitHub Discussions / X). This audit
has none, deliberately. Every question it asks - what is on the board, what did our rounds
draw, what is deployed, what is failing - is answerable from primary data we or poidh
already publish, and a community thread would have been decoration. The one place outside
opinion would genuinely help is how poidh issuers perceive ZAO, which no public source
answers and which is better resolved by asking Kenny directly (see Next Actions).
