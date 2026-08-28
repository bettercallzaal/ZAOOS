---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: 2425, 2424, 2429, 2257, 241, 191, 134, 823, 2411, 2423
original-query: "can we make a lane watching other peoples githubs https://farcaster.xyz/alitiknazoglu/0xb4a31936 i wanna look more into ali"
tier: DEEP
---

# 2431 - Ali Tiknazoglu (mcprobe, Cotribe) and a glue-first "watch other people's GitHubs" feed

> **Goal:** Part A: who Ali (@alitiknazoglu, FID 12239, GitHub `alitiknazoglu`) is, what he has shipped since 2026-06-30, and where he already touches The ZAO - every name and number from a fetched source. Part B: the glue-first version of doc 2425's Upgrade Watcher - what GitHub already gives us for free, which open-source readers were measured, and a proposed sub-100-line adapter that turns the `.atom` feeds of a login list into one daily digest file in the vault. Nothing installed.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Ali is WARM, not a cold lead. Zaal DMs him, nobody else does.** | Mutual Farcaster follow (hub `linkById` both directions, 2026-08-28). BCZ YapZ episode 13 on 2026-03-25. A ZABAL Gamez workshop on 2026-06-20 (doc 2257). An X Space "to catch up with @zaal" on 2026-08-19. He replied "let's fucking zaballlllll" to Zaal on 2026-07-11. |
| 2 | **USE `alitiknazoglu/mcprobe` (MIT, read from the LICENSE file) to audit the MCP servers ZAOOS depends on.** | ZAOOS runs a dozen MCP servers (CLAUDE.md "MCP Tooling"); two of them (`serena`, `gitnexus`) timed out at 30 s at the start of this very session. mcprobe scores a server 0-100 on metadata, schema, error handling, liveness, and ships as a stdio MCP server, a CLI, a GitHub Action and an agent skill (`skill.md`, cast 0x693e327c, 2026-07-01). |
| 3 | **WATCH `alitiknazoglu/cotribe-analysis`, do NOT adopt.** | No LICENSE file (all rights reserved, `credit-attribution.md`). Created 2026-08-27 for the hellominds hackathon (cast 0x0339c609, 2026-08-28). Its pitch - an AI layer that scores who genuinely contributes in a Telegram or Discord community and turns that into rewards - is the exact thing `feedback_points_are_awarded_manually` says ZABAL points must NOT automate. Interesting for the reputation thread (docs 191, 134), not for the board. |
| 4 | **Rung 1 already supplies every raw signal doc 2425 wanted, for free and without a token.** | `https://github.com/<login>.atom`, `<owner>/<repo>/releases.atom`, `/commits/<branch>.atom`, `/tags.atom` all returned 200 this run; `gh api users/<login>/events/public` returns the same events as JSON; repo Watch has a Custom -> Releases option (GitHub docs, fetched). |
| 5 | **Rung 2 has no project that writes a daily digest FILE into a vault. Two are worth keeping in view: `glanceapp/glance` (AGPL-3.0, `rss` + `releases` widgets, 36,668 stars) and `Rongronggg9/RSS-to-Telegram-Bot` (AGPL-3.0, 2,141 stars).** | Six candidates through `glue-check`. Both survivors are delivery surfaces (a dashboard, a Telegram firehose), not a digest. Neither reads a LICENSE file or scores against the stack. |
| 6 | **PROPOSE a rung-4 adapter, `github-watch.py`, about 70 lines, stdlib only, one file, disposable - and do not install it until Zaal taps.** | Section 3 "nothing fits" block below. It replaces Part 1 (event collection) of doc 2425's `zao-watcher`; Part 2 (scoring) stays human, in a weekly grill, because scoring is judgment and collection is not (`code-over-inference.md`). |
| 7 | **Daily cron, but the adapter writes NO file on a quiet day.** | Doc 2425 chose weekly because "an empty report teaches everyone to stop reading it". A digest that only exists when something happened resolves that objection without waiting a week for a release (`noisy-signal-guard.md`). |
| 8 | **Docs 2424 and 2425 exist ONLY on an unpushed local branch. Push them.** | `ws/research-2424-github-following-watcher` (`b9ad8a4a`) sits in `~/Documents/ZAO OS V1`, not on `origin`. No worktree, no PR. This doc quotes 2425 from `git show` of that branch. A lane brief already cites "doc 2425" as if it were on main (`vanishing-dependencies.md` rule 1). |

---

## Part A - Ali

### A1. The cast Zaal sent, and the profile

Fetched keyless through Haatz (`~/bin/zao-fetch-farcaster.sh`, doc 823) plus direct hub calls.

| Field | Value (hub, 2026-08-28) |
|---|---|
| Handle / FID | `@alitiknazoglu` / **12239** |
| Display name | ali tiknazoglu |
| Bio | `product guy \| mcprobe \| prev. @inflynce ($4k/m)` |
| X | `alitiknazoglu` (USER_DATA_TYPE_TWITTER) |
| Verified addresses | 3 Ethereum, 2 Solana (`verificationsByFid`; addresses not reproduced here) |
| Followers | at least **52,555** follow links (`linksByTargetFid`, 31 pages of 1,000, paging capped at 31) |
| Following | **1,348** (`linksByFid`) |
| Casts fetched | **494** across 5 pages of 100, 2026-06-30 to 2026-08-28; **101** are top-level or channel casts, 393 replies |

The cast `0xb4a31936` is the first of a six-part thread posted **2026-06-30 12:31 UTC** (hub timestamp 173363483 + Farcaster epoch). The six parts, verbatim except that emoji and typographic dashes are removed:

1. "i finished my first fully vibecoded project. introducing mcprobe.org/ built it for cysic's ai hackathon and ended up one of winners. now it has a landing page and a web app, so anyone can use it, not just devs."
2. "mcp servers give ai agents access to tools. but most servers ship tools an agent can call, not call correctly. missing descriptions, untyped params, handlers that silently accept garbage. your agent finds out the hard way. usually mid-task."
3. "mcprobe audits any mcp server and gives it a real score. lints every tool's schema. fuzzes the tools with broken inputs. checks four dimensions: metadata, schema quality, error handling, liveness and returns 0-100 with an a-f grade."
4. "remote servers (github, linear, stripe, anything you've deployed) audit instantly. paste url, hit audit, nothing changes on their side. local stdio servers audit through the open-source cli with a pro key."
5. "free: 3 audits a day ... pro: $9.90 one-time, lifetime: 30 audits a day ... no subscription. pay once."
6. "audit engine is fully open source: github.com/alitiknazoglu/mcprobe ... try it -> mcprobe.org/"

Replies under it (hub `castsByParent`): FID 211275 on 2026-07-01 ("There are soo many MCP servers out there ... Now I can just use your auditing"), FID 290249 on 2026-06-30, FID 261177 on 2026-07-31 asking how remote fuzzing avoids WAF false positives. The "one of winners" claim is Ali's own, repeated on his LinkedIn post of 2026-06-30 (exa); no Cysic-side page listing winners was fetched, so it stays **his claim, UNVERIFIED independently**.

### A2. What he shipped, from his own casts (101 top-level casts, 2026-06-30 to 2026-08-28)

| Date | Cast | What |
|---|---|---|
| 2026-06-30 | 0xb4a31936 | mcprobe.org launch thread (above) |
| 2026-07-01 | 0x693e327c | "2 new things for mcprobe public repo: added skill[.]md, now your ai agent can audit a server just by asking; new github action" - embeds `https://github.com/alitiknazoglu/mcprobe`. **This is the source for his GitHub login.** |
| 2026-07-02 | 0x251a9596 | vibe(thinking) ep. 1 "think something" - "a weekly live workshop for builders and vibecoders", Saturdays 3pm UTC on X, Luma registration |
| 2026-07-05 | 0x61674ba0 | mcprobe: public gallery; detects "fake success" ("some servers tell ai 'done' when nothing actually happened ... flags it and lowers score"); GitHub Action; agent skill |
| 2026-07-07 | 0x46f2aec8 | "added credit card payment for mcprobe pro. thanks to lemon squeezy ... already 3-5 users generating reports every week" |
| 2026-07-09, 07-17, 07-24 | 0x22d4039c, 0x77b3c757, 0xdbaf34a6 | vibe(thinking) eps 2-4 ("prompt like you mean it", "nobody wants your app", "build in public or build in silence") |
| 2026-07-19 to 07-23 | 0xba79462a, 0x7429d97a | relocated to Da Nang, Vietnam, "for next 6 months"; on 2026-08-05 "almost 6 months since i left home" |
| 2026-07-27 | 0xa126c109 | mcprobe: shareable scorecard image per audit, per-audit pages, faster shared pages - `mcprobe.org/app/gallery/WRPY0B7C` |
| 2026-07-27 | 0x5e6a981a | "an hour call with [mention] ... ready to ship together. are you ready for one of most amazing ai podcasts" - podcast partner not resolved this run |
| 2026-08-01 | 0x190a458e | "restructuring growth strategy for [mention] to hit $1b volume (already past $273m)" - a client, name not resolved this run |
| 2026-08-04 | 0x086bf566 | "i had a project idea on telegram and had already started working on it" (the day Telegram was pulled from the App Store, his words) |
| 2026-08-08 to 08-27 | 0xb587b4b8 ... 0x8961e1da | ill from about 08-06, laptop dead 08-22, "got my laptop back with all my data" 08-27. On 08-22 he wrote that he is "struggling financially because couldn't find a job, i've one client". Relevant to outreach timing; no more detail belongs in a repo. |
| 2026-08-28 | 0x0339c609 | "just submitted my new project for hellominds hackathon - it's an ai bot for moderation, curation and rewards for online communities on both telegram and discord" (= `cotribe-analysis`) |

Pattern: a product person who ships with Claude ("burning through all my claude tokens", 0x8e6bb66b, 2026-07-31; "my claude (fable 5) keeps hallucinating", 0x1d093816, 2026-07-15), runs a weekly public workshop, and enters hackathons. One cast in 494 mentions ZABAL; **zero mention Nounspace, WaveWarZ or ZID** (grep of `casts_all.txt`).

### A3. His GitHub - `alitiknazoglu`

Login from cast 0x693e327c (2026-07-01), not guessed. `gh api users/alitiknazoglu`, 2026-08-28: name "Ali Tıknazoğlu", bio "Product | Web3", location Turkey, account created 2022-08-20, **5 public repos, 4 followers, 1 following**. Public events in the API window: **5** (2 CreateEvent, 2 ForkEvent, 1 PushEvent).

| Repo (pushed) | What | LICENSE file (Hard Req 13) | Signals |
|---|---|---|---|
| **mcprobe** (2026-08-08) | "An MCP server that audits other MCP servers ... returns a 0-100 conformance score. Black-box, no source needed. It even audits itself." TypeScript | **MIT** - "MIT License / Copyright (c) 2026 alitiknazoglu" | 6 stars, 1 fork, 37 commits (first 2026-06-27), 2 contributors (`alitiknazoglu`, `uniquebeing-base-eth`), tags `v1`, `v1.0.0`, `v1.1.0`, 1 release, `action.yml`, `claude.md`, `.agents/`, vitest. glue-check: no Dockerfile, no arm64 note |
| **cotribe-analysis** (2026-08-27) | "An AI layer that reads an online community, remembers who genuinely contributes ... helps you moderate it and reward the people who carry it." Telegram + Discord bot; README: runs on Postgres and Redis; keys from hellominds.ai; "an interaction is 'A replied to B,' never what was said" | **none** - all rights reserved | 0 stars, 1 commit, Dockerfile yes, `.env.example` yes |
| **popdex-report** (2026-08-19) | "Website-layer marketing audit of popdex.xyz - technical SEO, AI-search visibility, structured data, site architecture, and homepage CRO" | **none** | 0 stars, 1 commit |
| farcaster-client (fork, 2026-08-27) | fork of `farcasterxyz/client` - "Snapshot of the Farcaster client monorepo (mobile + web)" | upstream's | forked the same morning he got his laptop back |
| productmarketing-skill (fork, 2026-07-29) | fork of `coreyhaines31/marketingskills` - "Marketing skills for Claude Code and AI agents" | upstream's | - |

mcprobe README (raw, `gh api .../readme`): 12 static lint rules; fuzz cases `missing_required`, `wrong_type`, `out_of_enum`, `extra_garbage`; outcomes `ok` / `toolError` / `protocolCrash`, with `silentlyAccepted` flagged; four core `probe_*` tools plus two helpers; the GitHub Action takes `url`, `fuzz`, `min-score` ("A>=90 B>=75 C>=60 D>=40") and exposes `score` / `grade` outputs; tools annotated `destructiveHint: true` are skipped unless `--fuzz-destructive`.

**Contradiction, flagged:** the README says the free tier is **2** audits/day; mcprobe.org (raw HTML stripped, 2026-08-28) says **"3 free audits a day"**; the launch thread also says 3. The site wins for current pricing; the README is stale.

Community footprint: Hacker News Algolia returns **0** stories for "mcprobe" (169 fuzzy hits, all `mproberts`); Glama lists it (`glama.ai/mcp/servers/alitiknazoglu/mcprobe`); an `actions-marketplace-validations` mirror exists; LinkedIn posts 2026-06-30, 07-01, 07-04 repeat the cast content (exa search, summaries only - not quoted).

### A4. Inflynce, the "prev."

`@inflynce` is FID 1046430, "Smart Marketing Protocol on Base" (hub). ZAO already researched it: doc 191 marks it **SKIP - no public API** and doc 134 "no public API exists"; OpenRank replaced it in the reputation work. The BCZ YapZ episode 13 transcript (`bcz-yapz/content/transcripts/2026-03-25-ali-inflynce.md`, 5,336 words, `youtu.be/WTyafqHKQqM`) has Ali saying the Farcaster app launched "27 or 28th of April" 2025 and naming a co-founder "Gia, ex Unity Ads". The "$4k/m" in his bio is not explained by any fetched source; it is not interpreted here.

### A5. Why he matters to The ZAO

He is already inside the tent: YapZ ep. 13 (2026-03-25, doc 241 row 23), a ZABAL Gamez workshop (2026-06-20, doc 2257), a mutual Farcaster follow, an X Space with Zaal on 2026-08-19 (cast 0x450daae3 mentions FID 19640; the X post `2090114051376615593` has 10 likes and 484 views per fxtwitter), and three casts in two months that mention Zaal by FID. The overlap is concrete on two fronts. **MCP:** ZAOOS is an MCP-heavy stack (CLAUDE.md lists context7, Serena, supabase-cowork and more; `serena` and `gitnexus` both timed out at 30 s when this session booted) and mcprobe is an MIT-licensed auditor that measures the exact failure `silent-failure-guard.md` is about - a server that says "done" and did nothing. **Farcaster / community:** he forked `farcasterxyz/client` on 2026-08-27 and built Cotribe, a Telegram + Discord reputation-and-rewards bot, the week ZAO is scoring ZABAL S1 by hand; his vibe(thinking) format is the ZABAL Gamez workshop format. Where there is **no** evidence: Nounspace (0 of 494 casts, no repo), WaveWarZ, ZID, and Sign-in-with-Farcaster on the fleet board - the sibling Nounspace lane (doc 2430, reserved 2026-08-28 10:29Z) should not expect an Ali thread there. Outreach is Zaal's tap; he wrote on 2026-08-22 that he is looking for work, which makes "audit our MCP surface for a fee" a real offer rather than a favour.

---

## Part B - watching other people's GitHubs, glue-first

Doc 2425 (read from `ws/research-2424-github-following-watcher`, `git show`) specifies `~/bin/zao-watcher`: REST polling of repos/releases/pushes per login, a 6-axis rubric, a card format, weekly cron. This section runs the same capability through `/glue evaluate` and measures each rung.

### B1. Rung 1 - platform-native, measured 2026-08-28

| Feature | Command / URL | Result |
|---|---|---|
| Per-user public activity feed | `curl https://github.com/alitiknazoglu.atom` | **200**, 5 entries (3 push, 2 ForkEvent), newest 2026-08-27T07:43Z |
| | `https://github.com/99darwin.atom` | 200, 2 entries (2026-08-06) |
| | `https://github.com/bettercallzaal.atom` | 200, 28 entries in about 30 hours |
| | `https://github.com/sim31.atom` | **404** - and `gh api users/sim31/events/public` returns **0**, although `sim31/sim3` shows `pushed_at` 2026-08-01. A user with no public events has no feed. Watch that user's repos instead |
| Org feed | `https://github.com/blankdotspace.atom` | 200 but **0 entries** - org feeds are empty; watch members or repos |
| Releases / tags / commits per repo | `/alitiknazoglu/mcprobe/releases.atom`, `/tags.atom`, `/commits/main.atom` | 200 / 200 / 200 - 3, 3, 20 entries |
| Repo commits feed for a quiet maintainer | `/blankdotspace/space-system/commits/main.atom` | 200, 20 entries, newest 2026-02-02 |
| Same data as JSON | `gh api users/<login>/events/public` | 5 events for Ali, identical to the atom |
| Feed directory | `gh api feeds` | returns `timeline`, `user`, `current_user_public` atom hrefs; **no `current_user_url`** in the PAT session, so the private "people I follow" news feed with its token is only reachable from the web dashboard (UNMEASURED there) |
| Watch a repo for releases only | GitHub docs, fetched raw: "You can also choose to only be notified of certain event types such as issues, pull requests, releases, security alerts, or discussions" | exists; delivers to the notifications inbox and email, per repo, by hand |
| Dashboard feed | GitHub docs, fetched raw: "The new feed is currently in public preview ... discover relevant content from projects you follow" | exists; a web page, no file, no filter we control |
| GitHub Explore | not fetched | UNMEASURED |
| Zaal's follow list | `gh api users/bettercallzaal/following` | **40** logins today; docs 2424/2425 counted 38 on 2026-08-27 |

**Rung 1 verdict:** every raw signal in doc 2425 Part 1 (new repo, release, push, fork) is already published by GitHub as an unauthenticated atom feed, per login and per repo, no token, no rate-limit budget (the same 120-call REST budget doc 2425 planned for is unnecessary). What rung 1 does not do: merge many logins into one place, remember what was seen, write to the vault, read a LICENSE file, or score. So rung 1 supplies the input and nothing else.

### B2. Rung 2 - existing open-source, `glue-check` on each

Search: `gh search repos --topic rss-reader`, `--topic github-releases`, `"release monitor"`, `"rss to telegram"`, `rss2email` (2026-08-28); adoption-candidates.md had no feed-reader row; research library grep for `watcher|atom|feed` found doc 2425 only.

| Candidate | LICENSE (file) | Alive | Maintainers | Runs on | What it is | Checklist line that fails for THIS capability |
|---|---|---|---|---|---|---|
| `glanceapp/glance` | AGPL-3.0 | pushed 2026-08-21, 32 commits/180d | 83 contributors | Dockerfile, arm64 mention in README | self-hosted dashboard; `rss` widget (docs line 751) and `releases` widget (line 2029: `repositories:` list, optional `token`, GitHub/GitLab/Codeberg/Docker Hub) | output is a web page, not a vault file; no state, no "new since yesterday"; a `releases` list covers repos, not logins |
| `miniflux/v2` | Apache-2.0 | pushed 2026-08-24, 100 commits/180d | 100 contributors | Go binary (no Dockerfile at root) | feed reader with API | a reader UI; export is OPML/API, not a daily digest file; needs a Postgres |
| `FreshRSS/FreshRSS` | AGPL-3.0 | pushed 2026-08-28 | 100 contributors | arm64 mention 1 | feed reader | same as miniflux |
| `Rongronggg9/RSS-to-Telegram-Bot` | AGPL-3.0 | pushed 2026-08-24, 12 commits/180d | 46 contributors | Dockerfile, python | posts every feed entry to Telegram | per-entry firehose into the surface ZOE already owns; no batching, no scoring - the `noisy-signal-guard.md` shape. Fits "results to Telegram" later, not first |
| `slurdge/goeland` | MIT | pushed 2026-08-25, 80 commits/180d | 9 contributors | Dockerfile, arm64 mention 2 | RSS to e-mail digest | closest shape (batched digest); delivers to e-mail, not the vault; docs not read past the README - **PARTIAL** |
| `iamspido/github-release-monitor` | **AGPL-3.0 from the file** ("Licensed under the GNU Affero General Public License v3.0"; the API field says `NOASSERTION` - the file wins) | pushed 2026-08-28 | **1 contributor** | node | self-hosted GitHub release monitor | single maintainer = rung-4 risk, not a rung-2 dependency (standard, section 2) |
| `nikhilbadyal/release-tracker` | MIT | pushed 2026-08-28, 47 commits/180d | 4 (1 human + bots) | Dockerfile, python | multi-platform release tracker with notifications | releases only, single author |
| `DIYgod/RSSHub` | AGPL-3.0 | pushed 2026-08-28 | 100 contributors | Dockerfile, vercel.json, fly.toml | generates feeds for sites that lack them | unnecessary: GitHub already publishes the feeds |

**Rung 2 verdict:** nothing writes "one daily digest file under `~/zao-vault/inbox/`", and nothing reads a LICENSE file. Two are worth keeping: **glance** if Zaal wants a wall widget on the Pi (the `releases` widget is a five-line YAML block), and **RSS-to-Telegram-Bot** if the digest should later reach the phone.

### B3. Rung 3 - skill / prompt glue

A `/github-watch` skill that curls the feeds on demand is zero runtime code, but every run is a turn (about $1, `agent-spend.md`) doing work with no judgment in it. `code-over-inference.md` puts this on cron. Rung 3 is the wrong rung for a scheduled fetch. It IS the right rung for the scoring half of doc 2425: a weekly grill item that reads the digest and taps ADOPT / WATCH / NOT-FOR-US.

### B4. Rung 4 - the proposed adapter (design only, NOT installed)

**Name:** `github-watch.py`. **Home when approved:** `~/zaal-dotfiles/bin/` (git-tracked, `vanishing-dependencies.md` rule 1). **Size:** about 70 lines, python3 stdlib only (`urllib.request`, `xml.etree`, `json`). **Inputs:** `~/.zao/watcher/watchlist.txt`, one line per `login` or `owner/repo`. **State:** `~/.zao/watcher/seen-atom.json`, a set of atom entry ids. **Output:** `~/zao-vault/inbox/github-watch-<YYYY-MM-DD>.md`, written only when at least one unseen entry exists.

Behaviour, line by line:

1. For a `login`, fetch `https://github.com/<login>.atom`. For `owner/repo`, fetch `releases.atom` and `commits/<default>.atom` (default branch `main`; a line may carry `@branch`).
2. HTTP 404 on a login feed is written INTO the digest as `no public feed for <login> - watch a repo instead` (the sim31 case), and the exit code is non-zero so the cron line's log shows it (`silent-failure-guard.md` rule 3). A zero-entry 200 is also reported, never treated as "nothing happened" (`liveness-probe-guard.md`, empty result is a failure).
3. Entries whose `<id>` is already in `seen-atom.json` are skipped. New entries are grouped by login/repo with date, entry title (`push`, `ForkEvent`, release tag) and link. Event kind comes from the `<id>` (`tag:github.com,2008:ForkEvent/...`, `...:push/...`).
4. For a NEW repo seen for the first time (a `CreateEvent` or a push to a repo not in state), one extra call: `gh api repos/<o>/<r>/contents/LICENSE` decoded, first line, or `NO LICENSE FILE`. This is the only `gh` call, and it is the one doc 2425 decision 4 needs.
5. No file on a quiet day. The digest header states feeds checked, feeds failed, new entries, and the run time.
6. Hard cap 40 entries per digest; overflow is counted in the header, not dropped silently (doc 2425 decision 6, same shape).

**Seed watchlist (all logins from fetched sources this run):**

```
alitiknazoglu
99darwin
sim31/frapps
sim31/ordao
blankdotspace/space-system
j-paterson
willyogo
hiporox
sktbrd
r4topunk
hellno
```

`sim31` is listed by repo because his login feed is 404. The six after `space-system` are its top contributors by commits (`gh api repos/blankdotspace/space-system/contributors`: 511, 376, 249, 180, 150, 142) - "Nounspace maintainers" resolves to `blankdotspace` because `Nounspace/nounspace.ts` redirects there (`gh api repos/Nounspace/nounspace.ts` -> `blankdotspace/space-system`, 42 stars, GPL-3.0 from the file, last push 2026-02-09, 0 commits in 180 days). The Nounspace sibling lane owns whether that list is right.

**The exact cron line (proposed, not installed):**

```
15 6 * * * /usr/bin/python3 "$HOME/bin/github-watch.py" >> "$HOME/.zao/watcher/github-watch.log" 2>&1
```

06:15 local, daily; Zaal's day starts 04:30 (`user_zaal_schedule`) and the morning boot reads the inbox. On the VPS it is the same line; the script is not host-specific. Python 3.13 is on this Mac (measured by running it in this session); Pi/VPS python versions UNMEASURED.

**What it deliberately does not do:** score, open cards, touch the board, open PRs, or run more than one `gh` call per new repo. Scoring stays in the weekly grill (rung 3 above) until three consecutive digests show the same judgment being applied the same way - at which point rule 5 of `code-over-inference.md` says write the rubric down, and doc 2425 Part 2 already has.

### B5. GLUE VERDICT

```
GLUE VERDICT - watch a list of GitHub accounts for new repos, releases and commits, score against our stack, file candidates
rung: 4 (collection) + 3 (scoring)
choice: github-watch.py adapter over GitHub's own .atom feeds; scoring as a weekly grill item
licence: n/a - GitHub feeds are the platform; the adapter is ours, one file | alive: n/a | maintainers: us
brand via: n/a - output is a markdown file in the vault
data export: the digest IS a file; state is one JSON file; delete both and nothing is lost
runs on: mac (python3 3.13, measured this session); pi / vps UNMEASURED (stdlib only, so expected)
cost: free - unauthenticated atom (200s measured); one gh call per NEW repo for the LICENSE file
maintenance owner: us; if GitHub changes the atom shape, delete the file and fall back to glanceapp/glance
nothing-fits evidence: section 3 block below
```

**Section 3 "nothing fits" block:**

- Candidate 1: `glanceapp/glance` - fails "output is a digest file in the vault" (it is a dashboard page; no seen-state, no LICENSE read).
- Candidate 2: `Rongronggg9/RSS-to-Telegram-Bot` - fails "fails loud but not noisy": every entry becomes a Telegram message, no batching, no scoring; the digest would be the firehose `noisy-signal-guard.md` warns about.
- The search: `gh search repos --topic rss-reader`, `--topic github-releases`, `"release monitor"`, `"rss to telegram"`, `rss2email`; `~/zao-vault/notes/adoption-candidates.md`; grep of the research index for `watcher|atom|feed`.
- Smallest adapter: the one above, about 70 lines. Why rung 4 and not rung 2: the missing piece is 20 lines of "which of these did I already see" plus "read the LICENSE file", and no reader ships either.
- Maintenance cost in one line: if `github.com/<login>.atom` changes shape, one person edits one regex; if it disappears, the file is deleted and glance takes over.

### B6. What this changes in doc 2425

Doc 2425's decisions 3 (score the upstream of a fork), 4 (no LICENSE = PROPOSED-BLOCKED), 5 (never opens a PR) and 6 (cap) stand. Decision 1 (VPS cron) stands. Decision 2 (weekly) is replaced by "daily, no file on a quiet day". Part 1 (REST polling with a 120-call budget) is replaced by atom feeds with zero budget. Part 2 (the rubric) stays, applied by a human in the grill, not by the script. Part 3 (the card) waits for the board API, which returns 402 until 2026-09-21 per doc 2425. The `~/bin/zao-watcher` build in its Next Actions (2026-09-12) shrinks to the adapter above.

---

## Also See

- Doc 2425 - The Upgrade Watcher spec - **on local branch `ws/research-2424-github-following-watcher` only**, not on main; path `research/agents/2425-upgrade-watcher-spec/` once pushed
- Doc 2424 - the 38-account follow survey - same branch, `research/dev-workflows/2424-github-following-adoption-survey/`
- [Doc 2429](../../dev-workflows/2429-githubprojects-top-100-glue-scored/) - @githubprojects top 100, glue-scored; sibling feed source
- [Doc 2257](../../zabal/2257-zabal-s1-season-retrospective/) - row "2026-06-20 ZABAL GAMEZ Workshop w/Ali Tiknazoglu"
- [Doc 241](../../events/241-q1-2026-big-wins/) - BCZ YapZ ep. 13 "Ali (Inflynce)"
- [Doc 191](../../identity/191-reputation-scoring-systems/) and [Doc 134](../../identity/134-external-reputation-signals-comprehensive/) - Inflynce: no public API, SKIP
- [Doc 823](../../dev-workflows/823-farcaster-fetch-haatz-free/) - the keyless Farcaster fetch used throughout Part A
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) - why `/browse` is dead and MCP health matters (the mcprobe use case)
- [Doc 2423](../2423-vault-as-transport-inter-terminal-context/) - the vault as memory layer the digest writes into
- Doc 2430 - the Nounspace sibling lane, reserved 2026-08-28 10:29Z, not yet written

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Push `ws/research-2424-github-following-watcher` from `~/Documents/ZAO OS V1` and open its PR - done when docs 2424 and 2425 are on `origin/main` | @Zaal | Git push + PR | 2026-08-31 |
| Tap: rung-4 adapter as designed in B4, or glance on the Pi instead - done when the tap is logged in the daily note | @Zaal | Decision | 2026-09-01 |
| If tapped: commit `github-watch.py` to `zaal-dotfiles/bin`, create `~/.zao/watcher/watchlist.txt` with the B4 seed list, add the cron line - done when the first `github-watch-<date>.md` appears in `~/zao-vault/inbox/` unattended | @Zaal (or a lane with Zaal's tap) | Script + cron | 2026-09-05 |
| Run mcprobe (`npx` in a scratch dir, NOT a research worktree) against the MCP servers ZAOOS depends on - `supabase-cowork`, `context7`, `serena`, `gitnexus` - done when four scorecards are in `~/zao-vault/notes/` | @Zaal or a build lane | Audit | 2026-09-07 |
| Message Ali (warm; outbound = Zaal's tap): the MCP audit as paid work, and whether Cotribe's contribution graph is worth a ZABAL Gamez workshop episode - done when a DM is sent and the reply is captured | @Zaal | Outreach | 2026-09-04 |
| Add `alitiknazoglu/mcprobe` (MIT) as a watcher-seed row in `~/zao-vault/notes/adoption-candidates.md` - done when the row exists | @Zaal | Vault edit | 2026-09-01 |
| Correct the free-tier number wherever ZAO repeats it: mcprobe.org says 3 audits/day, the README says 2 - done when this doc's A3 note is the only place the discrepancy is recorded | @Zaal | Note | 2026-09-01 |

## Sources

Farcaster (all via Haatz hub `https://haatz.quilibrium.com`, no key, 2026-08-28):
- `zao-fetch-farcaster.sh https://farcaster.xyz/alitiknazoglu/0xb4a31936` and `.../alitiknazoglu` - profile, bio, FID 12239, the cast. **[FULL - raw hub JSON]**
- `/v1/castsByFid?fid=12239&pageSize=100&reverse=true`, 5 pages - 494 casts 2026-06-30 to 2026-08-28. **[FULL - raw JSON, decoded from farcaster epoch]**
- `/v1/castsByParent` walked from 0xb4a31936 through 0x77b9c06a - the six-part thread and its three replies. **[FULL]**
- `/v1/userDataByFid?fid=12239`, `/v1/verificationsByFid?fid=12239`, `/v1/linksByTargetFid` (31 pages), `/v1/linksByFid`, `/v1/linkById` in both directions with FID 19640. **[FULL - counts are message counts on the hub, not Neynar-enriched]**
- `/v1/castById` for parents FID 19640 (Zaal, 2026-07-11), FID 401491, FID 290249. **[FULL]**
- `zao-fetch-farcaster.sh https://farcaster.xyz/inflynce` - FID 1046430, bio. **[FULL]**
- `/v1/reactionsByCast` for the launch cast - **[FAILED - HTTP 400 on the reaction_type parameter; not retried]**

GitHub (`gh api`, REST, 2026-08-28):
- `users/alitiknazoglu`, `users/alitiknazoglu/repos?sort=pushed`, `users/alitiknazoglu/events/public` **[FULL - raw JSON]**
- `~/.claude/skills/glue-first/bin/glue-check` on `alitiknazoglu/mcprobe`, `cotribe-analysis`, `popdex-report`, `blankdotspace/space-system`, `glanceapp/glance`, `miniflux/v2`, `FreshRSS/FreshRSS`, `DIYgod/RSSHub`, `Rongronggg9/RSS-to-Telegram-Bot`, `slurdge/goeland`, `iamspido/github-release-monitor`, `nikhilbadyal/release-tracker` **[FULL - LICENSE read from the file in every case]**
- `repos/alitiknazoglu/mcprobe/readme`, `.../contents`, `.../releases`, `.../tags`, `.../commits`; `repos/alitiknazoglu/cotribe-analysis/readme`; `repos/nikhilbadyal/release-tracker/readme`; `repos/glanceapp/glance/readme` and `contents/docs/configuration.md` **[FULL - base64-decoded raw]**
- `repos/Nounspace/nounspace.ts` (redirects to `blankdotspace/space-system`), `orgs/blankdotspace`, `orgs/blankdotspace/repos`, `repos/blankdotspace/space-system/contributors`; `orgs/Nounspace` and `orgs/nounspace` **[FULL; the two org lookups 404]**
- `users/sim31`, `users/sim31/events/public`, `users/sim31/repos`; `users/99darwin`; `users/bettercallzaal/following` (40) **[FULL]**
- `gh api feeds` **[FULL - no `current_user_url` in a PAT session]**
- `gh search repos` for `--topic rss-reader`, `--topic github-releases`, `"release monitor"`, `"rss to telegram"`, `rss2email` **[FULL]**

Atom feeds (`curl -A Mozilla`, 2026-08-28): `github.com/alitiknazoglu.atom`, `99darwin.atom`, `sim31.atom` (404), `bettercallzaal.atom`, `blankdotspace.atom`, `alitiknazoglu/mcprobe/releases.atom`, `/tags.atom`, `/commits/main.atom`, `blankdotspace/space-system/commits/main.atom` **[FULL - status codes and entry counts measured]**

Web, raw:
- `https://mcprobe.org/` -> `www.mcprobe.org`, HTML stripped, 1,756 chars of visible text **[FULL - curl + strip; the "3 free audits a day" quote]**
- GitHub docs `configuring-notifications` and `about-your-personal-dashboard` **[FULL - curl + strip; the releases-only and public-preview-feed quotes]**
- `zao-fetch-x.sh` on `x.com/alitiknazoglu/status/2090114051376615593` - fxtwitter tier 0: 2026-08-19 16:29 UTC, 10 favs, 484 views, text is the Space link **[FULL - tweet only; the Space audio was not fetched]**
- `hn.algolia.com/api/v1/search?query=mcprobe` **[FULL - 0 relevant of 169]**
- exa `web_search_exa` for mcprobe - LinkedIn posts 2026-06-30 / 07-01 / 07-04, Glama listing **[PARTIAL - search highlights, not full pages; nothing from it is quoted as fact beyond what the casts already say]**
- Cysic hackathon winners page **[FAILED - not located; "one of winners" remains Ali's own claim]**

ZAO estate, read from disk:
- `research/zabal/2257-zabal-s1-season-retrospective/README.md` line 99; `research/events/241-q1-2026-big-wins/README.md` lines 50 and 255; `research/identity/191-.../README.md` lines 26, 109-112; `research/identity/134-.../README.md` line 45 **[FULL]**
- `~/Desktop/repos/bcz-yapz/content/transcripts/2026-03-25-ali-inflynce.md` frontmatter and lines 51, 84 **[FULL]**
- `git -C ~/Documents/ZAO\ OS\ V1 show ws/research-2424-github-following-watcher:research/agents/2425-upgrade-watcher-spec/README.md` (254 lines) and `.../2424-.../README.md` (185 lines) **[FULL]**
- `~/zao-vault/notes/glue-first-standard.md`, `~/zao-vault/notes/adoption-candidates.md` (42 lines), `~/zao-vault/daily/2026-08-27.md` lines 405-435 **[FULL]**
- `CLAUDE.md` MCP Tooling section; session boot notice that `serena` and `gitnexus` timed out after 30000 ms **[FULL - observed this session]**

> **Deviations from the skill, stated:** the branch is `bettercallzaal/research-ali-0828` (the Orca lane's branch, per the brief "commit on your branch"), not `ws/research-2431-...`; the number is reserved by the pushed tag `doc-2431` instead. Reddit not attempted (walled since 2026-08-14, doc 2282). Tracker writes skipped: the board API is 402 until 2026-09-21 (doc 2425). No `npm install` in this worktree; the 2.9 GB `node_modules` Orca's setup hook created here is surfaced for Zaal to delete, not deleted (`no-rm-rf.md`).
