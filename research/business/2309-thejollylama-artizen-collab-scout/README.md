---
topic: business
type: scout
status: research-complete
last-validated: 2026-08-17
related-docs: 844, 847, 852, 853, 924, 1079
original-query: "Research TheJollyLaMa properly (repos + site) and draft an outreach note - zao-artizen lane founding directive, 2026-08-17"
tier: STANDARD
---

# 2309 — TheJollyLaMa / Decent Agency: Artizen collaborator scout + outreach draft

> **Why this doc:** the 2026-08-17 Artizen call surfaced two live collaborator threads. Stephen Reid
> (Artizen leaderboards) already has an email out from Zaal. This doc covers the second one:
> TheJollyLaMa, who shipped `arti-ZEN_FUN-d` - a public educational game about growing your Artizen
> match multiple - two days ago. Outbound is GATED: the draft at the bottom is for Zaal to send, and
> nothing was sent from this lane.

## TL;DR

TheJollyLaMa is a prolific solo vanilla-JS/Optimism builder ("Decent Agency", NYC) with 54 public
repos, who on **2026-08-15** created `arti-ZEN_FUN-d` - "The Match Garden", an MIT-licensed
educational mini-game teaching creators how Artizen Funds and match multiples work. Two days later
(2026-08-15, 20:31 UTC) he opened **issue #10: "Connect Artizen account to load active projects on
the home screen"** - he wants real Artizen data behind the game and does not have a source for it.

**That issue is the collaboration hook.** The ZAO already has a working Artizen scraper
(`ZAOartizen/scripts/refresh-fund.mjs`, anchored to a named fund on `artizen.fund/index/matchfunds`),
and Stephen Reid has a broader all-seasons dataset. The ask writes itself: we supply the data layer
and the fund-director's-eye-view of curation, he supplies the onboarding surface that our new artists
already need. Both sides ship something the other cannot easily build.

**Second, unrelated but relevant asset:** his `DecentBusking` repo runs a **GitHub-native bounty bot**
that auto-queues token payouts when a PR closes a labelled issue. That is a working implementation of
a thing the ZAO has repeatedly wanted (paid, on-chain-settled community contribution). Worth studying
independently of whether the Artizen collab happens.

## Who he is (verified)

Source: `gh api users/TheJollyLaMa`, fetched 2026-08-17. FULL.

| Field | Value |
|---|---|
| Handle | `TheJollyLaMa` (GitHub user id 75486638) |
| Display name | The Jolly LaMa |
| Company | Decent Agency |
| Location | "New New YoHk " (as written in the profile) |
| Blog | `https://thejollylama.github.io/public/#!/` |
| Public repos | 54 |
| Followers / following | 19 / 10 |
| Account created | 2020-12-04 |
| Twitter/X in profile | none listed (`twitter_username: null`) |
| Email in profile | none listed (`email: null`) |

**Contact channel is UNVERIFIED.** No email and no X handle are exposed on the GitHub profile, and
the personal site (fetched 2026-08-17, FULL) is a technical cheat-sheet with no contact block. The
realistic first contact is a **GitHub comment on issue #10** or a GitHub-profile DM equivalent, not
email. If Zaal has a Telegram/Farcaster handle for him from the Artizen call, use that instead - it
is warmer and this lane could not verify one.

**Aesthetic warning for the outreach voice:** his profile bio is
`"The Most' n' Roastn' n' boastn' n mastertoastn' to bette the host'n / Hello-Hi-Hey! Anyway....."`,
his repos are named `DecentEscrow`, `DecentNDA` ("#ProtectYoNeck"), `SHT_MON` ("A monitor fo Yo SHT").
He is playful and irreverent in public. A stiff corporate outreach note will read as a mismatch. Keep
it warm and concrete.

## What he actually builds (verified from the repo list)

Source: `gh api users/TheJollyLaMa/repos`, fetched 2026-08-17. FULL. 54 repos, one fork.

Consistent stack across the active work: **vanilla JS, no build step, Optimism mainnet, IPFS via
web3.storage/w3up, MetaMask, Three.js for 3-D, GitHub Pages hosting, GitHub Actions for automation.**
He is explicitly anti-framework - `arti-ZEN_FUN-d` issue #2 is literally titled "Codebase too complex"
and issue #4 "Repo Clean", both of which he filed against his own React scaffolding before rewriting it
in vanilla JS.

Active repos (pushed within the last 6 months):

- **`arti-ZEN_FUN-d`** - "A fun place to learn how to grow your match multiple with Artizen".
  Created 2026-08-15, last push 2026-08-15. MIT. JavaScript. 1 star. **The reason he is on our radar.**
- **`BigNuten_Vanilla`** - "A decent way to track your biological progress". Last push **2026-08-17**
  (today) - this is his current main project. Wellness tracker + `$BNUT` ERC-20 + DAO governance +
  StreakBet on-chain competitions + Aave V3 yield, all vanilla JS on Optimism, MIT, v3.1.0.
- **`TheGreenTeaParty`** / **`GreenTeaHut_01`** - environmental/community projects, pushed 2026-08-13
  and 2026-08-03.
- **`DecentCanopy`** - "A new perspective on coverage and associations", pushed 2026-08-12.
- **`DecentBusking`** - "The Web3 Digital Town Square - mint audio NFTs, tip artists, fly through
  space". Created 2026-04-01, last push 2026-06-11. **The one with direct ZAO-artist overlap.**
- **`DecentMarket`**, **`DecentHead`**, **`DecentWeighIn`** - the shared "Decent" component/toolkit
  family the others reuse (`nft-card.js` in DecentBusking explicitly "mirrors DecentMarket").

Older but thematically relevant: `DecentEscrow` (timelocked work funds with partial release),
`DecentInvoice`, `DecentSubscriptions`, `DecentMentor` ("incentivize strong mentorship and community
building in the rapidly growing environment of a new DOA"), `NewFulton` (a local match-funding DAO -
he was thinking about matched local funding years before Artizen).

## `arti-ZEN_FUN-d` — what it actually is

Source: repo README + `game.js` (646 lines, downloaded raw 2026-08-17) + the issue list. FULL.

**"The Match Garden"** - a static, vanilla-JS, Vitest-tested browser game that walks a creator through
the Artizen Funds mental model using a garden metaphor (funds are "garden beds", projects are "seeds").

Its own README states the eight learning goals verbatim, including:

- "A Fund is a curated pool that supports projects aligned with a particular mission"
- "Fund Directors make curation decisions — not algorithms"
- "A rejection does not mean the project is bad; it may simply be a poor fit for this particular
  garden bed"
- "Available match is not automatic; creator activity and supporter purchases are needed to unlock it"
- "Running a Fund is an advanced path; creators should first understand the experience of applying"

**It is scrupulously honest about not being official.** The README leads with a bolded disclaimer:
"This is an independent project. It is not affiliated with, endorsed by, or sponsored by Artizen. All
Fund information, balances, match amounts, and outcomes shown in the game are fictional examples for
educational purposes only." The contributor docs enforce it too - "**All Funds must include the
simulated disclaimer note.** Do not represent fictional Fund data as current or real."

**All five funds and three projects in it are invented.** Verified by reading `game.js`: the funds are
`The Community Spaces Fund`, `The Creative Wellness Fund`, `The Community Radio Fund`, `The Solidarity
Economy Fund`, `The Climate Technology Fund`; the projects are `Green Tea Gathering Space`,
`Streetwave Community Radio`, `Solar Commons Lab`. Every fund carries `sampleAvailableMatch:
'$X (simulated)'`. **The ZAO Fund for Emerging Culture does not appear anywhere in it** - there is
nothing to correct and no misuse of our name.

The mechanics it models (from `game.js`):

- `calculateFit(project, fund)` - trait-set matching with hard `excludedTraits` gating; >=3 shared
  preferred traits = "strong", 1-2 = "possible", 0 = "weak".
- `calculateMatchUnlocked(saleAmount, matchMultiple, matchAvailable)` -
  `min(saleAmount * matchMultiple, matchAvailable)`, returning total raised and match remaining.
- A pitch scorer that grades on five elements (what the project does, who it serves, evidence of fit,
  impact, supporter engagement) and returns coaching text.
- `simulateCuration(fund, pitch, seed)` - seeded RNG, so a strong pitch (score >=75) still only clears
  at ~70%. It deliberately teaches that curation is a judgement call you can lose.

**Where his model and ours differ - the thing worth telling him.** The game teaches the match-unlock
half of the engine correctly, but it does not model **Boost Score**. Per Artizen's own playbook
(`play.artizen.fund`, captured in `ZAOartizen/TEAM-PLAYBOOK.md` and ZAOOS doc 887), rank is
`(sales + match unlocked) x boost points received / 100` - **multiplicative**, so a project can top the
dollar column and still finish last with no boosts. A creator who plays The Match Garden learns to get
curated and to sell, and would walk away thinking dollars alone determine standing. That is a concrete,
generous, non-critical thing to offer him, and it is exactly the kind of correction a fund director is
positioned to make.

**Build style, for calibration:** issues #1, #3, #5, #7, #9 were opened and shipped by **GitHub
Copilot** agents; #2, #4, #6, #8, #10 are his own direction-setting issues. He works by filing an
intent and letting an agent implement. That makes him unusually easy to collaborate with
asynchronously - a well-specified issue from us is a contribution he can actually merge.

## The hook: open issue #10

Source: `gh api repos/TheJollyLaMa/arti-ZEN_FUN-d/issues/10`, fetched 2026-08-17. FULL.
Opened by TheJollyLaMa, 2026-08-15 20:31 UTC. Still open as of this doc.

> **"Connect Artizen account to load active projects on the home screen"**
>
> Summary: "Connect the app to a real Artizen sign-in/account flow so the home screen can show the
> user's actual active projects instead of the current mock project cards."
>
> Problem: "Right now the experience appears to keep the Artizen account connection symbolic, and the
> project picker still renders static seed/project data. We need the backend integration point to be
> real..."

He is asking for a thing that, to this lane's knowledge, **does not exist**: there is no official
Artizen public API, no OAuth for third parties, and no MCP server (established in doc 844, re-confirmed
in doc 852 - `play.artizen.fund` is Artizen's own recommended machine-readable source). The main site is
Bubble.io and returns an empty shell to plain HTTP. So issue #10 is currently unbuildable the way it is
written, and he may not know that yet.

What the ZAO can put on the table against it:

1. **The scraper we already run.** `ZAOartizen/scripts/refresh-fund.mjs` renders
   `artizen.fund/index/matchfunds` headlessly and parses a named fund's rank/score/prize/raised, with
   two hard-won guards documented in its header: anchor the parse to the fund-name substring (grabbing
   the first match silently returns whatever fund rendered first), and verify the browser's URL after
   `goto` before trusting page text (a failed navigation returns the previously-loaded page, which
   reads as valid but is stale). Those two gotchas are worth more to him than the code.
2. **Grow is not Bubble.** Doc 852 established that `grow.artizen.fund` is Vite/React + Supabase and
   its production JS bundle is readable with plain `curl` + `grep`. If any real per-user project data
   is reachable at all, that is the surface to look at - not the Bubble front end.
3. **Stephen Reid's dataset.** He built Artizen leaderboards covering all seasons; Zaal already has an
   email out to him (2026-08-17). If both threads land, Stephen is the data layer, Jolly is the
   onboarding surface, and the ZAO is the fund-director's-eye-view in the middle. **Do not broker that
   introduction until Stephen has replied** - Zaal owns that conversation.
4. **The Boost Score correction** above, which makes the game's model complete.

## Second asset: the DecentBusking bounty bot

Source: `DecentBusking/README.md` + `.github/workflows/bounty-bot.yml` + `bounty-bot-config.json`,
fetched 2026-08-17. FULL.

`DecentBusking` ships five GitHub Actions workflows that together form a working paid-contribution
pipeline:

- `bounty-bot.yml` - on issue assignment, parses a `bounty: 0.00001 ETH` label and comments to announce
  the bounty to the assignee; on a merged PR that closes the issue, auto-appends to
  `payroll-queue.json` and increments `ethPending` / `issuesClosed` in `contributor-accounts.json`,
  with deduplication.
- `bounty-audit.yml` - weekly scan for missed close tags.
- `bounty-label.yml` - labels issues with bounty amounts.
- `bounty-payout.yml` - manual payout queue as a fallback.
- `idea-label.yml` - "Credit community ideas (20/80 split)" - it pays the person who had the idea, not
  only the person who wrote the code.

`bounty-bot-config.json` currently reads `{"enabled": true, "pauseMessage": "Auto dev pay is
temporarily paused while we top up treasury funds..."}` - so the treasury is thin, but the machinery
runs. This is the shape of the thing ZOLs have wanted to be: contribution -> merged PR -> queued payout,
settled on-chain, with idea-credit split out from implementation credit. **Recommendation: read these
five workflows regardless of whether the Artizen collab lands.** MIT-adjacent repo, public, no
permission needed. (`DecentBusking` itself has no license file - `license: null` on the API - so ask
before reusing its code verbatim; reading it for the pattern is fine.)

`DecentBusking`'s product overlap with ZAO artists is also real: mint audio NFTs, tip performers,
Optimism, and a "record a busker and add a track on top, referencing the original NFT, royalties flow
back automatically" mechanic. That is COC Concertz / WaveWarZ territory. It is a second conversation,
not the opening one.

## What is UNVERIFIED

Naming these explicitly per `research-grounding.md` - do not let any of them into an outbound message
as fact.

- **Whether he has an Artizen account, project, or fund.** A `site:artizen.fund` search returned no
  results (fetched 2026-08-17), but artizen.fund is a Bubble app and is largely not indexed, so this
  proves nothing either way. Ask him; do not assume.
- **His real name, email, X, Farcaster, or Telegram.** None found on the GitHub profile or the personal
  site. "Decent Agency" as a legal entity was not checked.
- **Whether he was on the 2026-08-17 Artizen call**, and what was actually said there. This lane was
  not on the call; the founding directive is the only source, and it does not say.
- ~~Live ZAO Fund rank/score as of today.~~ **RESOLVED later in the same session - see "The live fund
  number we finally got" below. It is worse than the stale figure suggested.**
- **Whether `arti-ZEN_FUN-d` is deployed anywhere public.** `homepage` is null on the API and no Pages
  URL was confirmed; the README says it is Pages-deployable, which is not the same as deployed.

## The live fund number we finally got (and why it changes the priority)

After three tool paths failed (below), raw Playwright with a desktop Chrome user agent and a 25s settle
window rendered the page: 26,186 characters, captured 2026-08-17.

`artizen.fund/index/matchfunds` now **redirects to `artizen.fund/index/leaderboard/?season=7`** - the
fund-vs-fund leaderboard is no longer its own page.

**ZAO Fund for Emerging Culture, Season 7, 2026-08-17:**

| Field | Value |
|---|---|
| Rank | **#45** of **101** funds listed |
| Score | 0.01 |
| Sales | **$0** |
| Match deployed | **$0** |
| Prize | $100 |
| Raised | $100 |
| Projects | 12 |
| Sponsors | 22 |

45 of the 101 funds carry a numbered rank; the other 56 show "-". **#45 is the lowest numbered rank on
the board** - so the ZAO Fund is the last fund with any recorded Season 7 activity at all.

**Parse warning, because this one is a trap.** On this page each fund card's stat block *precedes* its
name. The card immediately above ZAO - Artisanal Intelligence Fund, rank #44 - shows an *identical*
`0.01 / $0 / $0 / $100 / $100` line. An off-by-one read here returns plausible, wrong numbers and
throws no error. Verified by walking back two cards to confirm the offset.

Live drive context from the same render: **Fund drive #12, the "Flywheel Fund Drive", ends Thursday
2026-08-20 at 2:00pm**, with $2,709,753 in match funding and $288,980 in cash prizes; drive-wide total
raised $900,897 against a $2.1M goal. The page also displays a **$22,445,422 endowment** figure, which
is Artizen's own on-page claim as of 2026-08-17 and is noted here only because `ZAOartizen/CLAUDE.md`
currently records the endowment as contested - this does not resolve that, it is one more self-report.

**Why this matters more than the collaborator scout it is attached to:** $0 sales means $0 match
deployed, and match deployed is the single KPI `TEAM-PLAYBOOK.md` names as "the true KPI of a good
fund" and the thing we intended to take to René. The proof currently reads as a dormant fund. The
Season 7 Artifacts are the unblock - there is nothing for anyone to buy. The tracker card for that work
was re-scoped to P1 and re-dated to 2026-08-20, the drive close.

## Tooling failure worth logging

`scripts/refresh-fund.mjs` could not complete on 2026-08-17. The `browse` binary's server does not
persist between invocations in this environment - every command reprints "[browse] Starting server..."
and `browse url` returns empty immediately after a successful `browse goto ... (200)`. The script's own
(correct, deliberate) URL-verification guard therefore trips and it aborts rather than trust stale text.
Running the same steps through `browse chain` timed out; Chrome via the extension navigated fine but
`get_page_text` hit three consecutive 45s `document_idle` timeouts on the same page.

Net effect: **the live fund scoreboard was not readable by any of those three paths.** The script is
not wrong - it failed safe, exactly as its header comment intends.

This is **instance 3** of a known shape, already root-caused: ZAOOS issue **#3065**. `browse`'s
`ensureServer()` health-check uses a single 2s probe that cannot tell a busy daemon from a dead one, so
it deletes the state file and spawns a replacement at `about:blank` without killing the original. Fixed
upstream in gstack 1.62.0.0 (`probeHealthWithBackoff`); local is 0.9.2.0. Instance 3 appended to #3065
on 2026-08-17, with the Playwright workaround **validated for the first time** and one addition:
default-UA Playwright now returns HTTP 200 with a **zero-length body** - it needs a desktop Chrome user
agent, a fixed viewport, and a fixed settle window. Orphan count was 0 before my run, so the bug
reproduces on a clean machine.

**`refresh-fund.mjs` is now broken for a second, independent reason** that fixing gstack would not
solve: its target URL redirects, and the page's stats-before-name layout inverts its parse. It needs
its own PR - deliberately not written into this research branch.

## Recommended sequence

**0. Mint the Season 7 Artifacts before Thursday 2026-08-20, 2:00pm.** This is not part of the
collaborator thread and it outranks all of it. The fund is rank #45 of 101 with $0 in sales; every
other move in this doc is downstream of having something to sell.

1. Zaal comments on issue #10 (draft below) - lowest-friction, highest-relevance first contact, in the
   place he is already working.
2. If he engages: share the two `refresh-fund.mjs` gotchas and the doc 852 finding that Grow is
   Supabase-backed, not Bubble.
3. Offer the Boost Score note as a contribution - ideally as a well-specified issue he can hand to
   Copilot, since that is demonstrably how he ships.
4. Hold the Stephen Reid introduction until Stephen replies.
5. Separately, read the five bounty workflows for the ZOL payout pattern.

---

## DRAFT — outreach note (NOT SENT. For Zaal to send, edit freely.)

**Channel:** a comment on `github.com/TheJollyLaMa/arti-ZEN_FUN-d/issues/10`. No email or social handle
for him could be verified, so this is written to work as a public GitHub comment. If Zaal has a warmer
channel from the call, send it there instead and cut the first line.

> Hey - Zaal from The ZAO. I run the ZAO Fund for Emerging Culture on Artizen. Found The Match Garden
> and read through `game.js`; the garden-bed framing is genuinely the clearest explanation of fund fit
> I've seen anywhere, and the fact that a 75-scoring pitch still only clears ~70% of the time is the
> single most honest thing in it. Curation *is* a judgement call. Most explainers pretend otherwise.
>
> On this issue specifically: as far as I've been able to establish, there's no public Artizen API or
> third-party OAuth to hook into - the main site is Bubble and returns an empty shell to a plain fetch,
> so the account connection can't be made real the way this issue describes. Two things that might
> help:
>
> - We run a headless scraper against the fund leaderboard to keep our own dashboard current. Two
>   things it cost us to learn: parse anchored to the fund *name*, because grabbing the first
>   rank/score match on the page silently returns whichever fund rendered first; and re-check the
>   browser's URL after navigating before you trust the text, because a failed navigation leaves the
>   previous page loaded and it reads as perfectly valid data. Happy to just hand you the script.
> - `grow.artizen.fund` is a different stack from the main site - Vite/React on Supabase, not Bubble -
>   and its bundle is readable with curl. If there's a per-user surface reachable at all, I'd look
>   there first.
>
> One offer, if it's useful: the game teaches the match-unlock half of the engine, but standing on
> Artizen also runs through Boost Score - roughly `(sales + match unlocked) x boost points / 100`, per
> Artizen's own playbook. It's multiplicative, so a project can lead on dollars and still finish last
> with no boosts. A creator who plays this comes away understanding curation and sales, and would be
> blindsided by that. I'd be glad to write it up as a proper issue with the mechanic spelled out, if
> you want it in the game.
>
> Either way - nice work. Are you running a project or a fund on Artizen yourself?

**Notes for Zaal before sending:**

- The Boost Score formula quoted is from `play.artizen.fund` via `TEAM-PLAYBOOK.md` / doc 887. It is
  our best-verified version, but Artizen mechanics move - if Venus has since restated it, use that.
- Do **not** mention Stephen Reid, his leaderboards, or any introduction between them until Stephen has
  replied to your email.
- Do **not** quote a live ZAO Fund rank or score in this message. The reason changed mid-session: it is
  no longer that we cannot verify it, it is that we now can, and it is rank #45 of 101 with $0 in
  Season 7 sales. Nothing in the draft needs it, and leading a first contact with that number trades
  away the credibility the rest of the note earns. Fix the number, then quote it.
- Offering "happy to hand you the script" commits us to sharing `scripts/refresh-fund.mjs`. It is
  public-safe (no keys, no auth, reads a public page) - but confirm you want it public before offering.

## Sources

All fetched 2026-08-17 by the zao-artizen lane. Method noted per
`research-grounding.md` - no WebFetch was used for any load-bearing claim.

| Source | Method | Status |
|---|---|---|
| `api.github.com/users/TheJollyLaMa` | `gh api` (raw JSON) | FULL |
| `api.github.com/users/TheJollyLaMa/repos` (54 repos) | `gh api` (raw JSON) | FULL |
| `repos/TheJollyLaMa/arti-ZEN_FUN-d` metadata + README | `gh api` + base64 decode | FULL |
| `arti-ZEN_FUN-d/game.js` (646 lines) | `curl` raw.githubusercontent.com | FULL |
| `arti-ZEN_FUN-d` issues #1-#10 | `gh api` (raw JSON) | FULL |
| `arti-ZEN_FUN-d` issue #10 body | `gh api` (raw JSON) | FULL |
| `arti-ZEN_FUN-d` last 10 commits | `gh api` (raw JSON) | FULL |
| `repos/TheJollyLaMa/DecentBusking` README + metadata | `gh api` + base64 decode | FULL |
| `DecentBusking/.github/workflows/bounty-bot.yml` | `gh api` + base64 decode | PARTIAL (first 35 lines) |
| `DecentBusking/bounty-bot-config.json` | `gh api` + base64 decode | FULL |
| `repos/TheJollyLaMa/BigNuten_Vanilla` README | `gh api` + base64 decode | PARTIAL (first 45 lines) |
| `thejollylama.github.io` | `curl` + HTML strip | FULL |
| `site:artizen.fund` search for jolly/decent agency | `curl` DuckDuckGo HTML | FULL (zero results - inconclusive, Bubble app is unindexed) |
| `artizen.fund/index/matchfunds` (live fund rank) | `browse` binary, `browse chain`, Chrome extension | **FAILED** (all three - see "Tooling failure") |
| `artizen.fund/index/leaderboard/?season=7` (live fund rank, retry) | raw Playwright, desktop Chrome UA + 1440x900 viewport + 25s settle, `innerText` captured to disk | **FULL** (26,186 chars; quotes above are from the saved capture, not from memory) |

Internal sources: `ZAOartizen/TEAM-PLAYBOOK.md`, `ZAOartizen/CLAUDE.md`,
`ZAOartizen/scripts/refresh-fund.mjs` (header comment), ZAOOS docs 844, 852, 887.
