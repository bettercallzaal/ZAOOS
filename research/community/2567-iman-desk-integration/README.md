---
topic: community
type: audit
status: research-complete
last-validated: 2026-09-27
superseded-by:
related-docs: "2566, 2253, 2090, 2244"
original-query: "can we loop on researhcing more of how to integrate imans desk"
tier: STANDARD
---

# 2567 - Wiring iman-desk into the rest of the ZAO estate

> **Goal:** ZAODEVZ/iman-desk is where Iman's work and Zaal's rulings meet.
> Today it touches the rest of the estate (vault, board, tracker, ZOE,
> Telegram, Postiz, the live sites) mostly by a lane retyping things. This doc
> takes one integration point at a time, measures how that piece works today
> from its code and data, and ends each section with one build step.

Written a section per pass of a research loop, 27 Sept 2026. Counts only; no
private chat content. Builds on [community/2566](../2566-iman-overnight-loop/)
(the overnight loop), which is live on the desk as PRs #22 to #27.

## Key Decisions

| Integration point | Call | Section |
|---|---|---|
| Telegram to desk capture | **Built as desk PR #31; token tonight (section 5 weighed ZOE and kept the bot)** | 1, 5 |
| Board (thezao.xyz/today) | **KEEP the card job; BUILD the missing answer path** | 2 |
| Vault decisions to desk | **DETECT unrelayed rulings; do not auto-post** | 3 |
| zao-tracker | **STOP defaulting PR test cards to Iman; mirror only his real open cards to the desk** | 4 |
| ZOE | **Desk bot #31 now (answers a list in one message); ZOE route after 3 Oct as a build; banner the dead heartbeat, do not delete** | 5 |
| Postiz | **Iman drafts in Postiz, Zaal's approval = draft to schedule; desk drafts become Postiz drafts after #30; do not reuse the autocliper stub** | 6 |
| Uptime and claims guards | **Both merged on the desk (#33, #35); point the wording check at the ZAOOS canonical ledger instead of a desk copy** | 7 |
| Iman's other ZAODEVZ repos | **Add an open-PRs block to the Tonight queue (ZAOstock has 17, 15 from outside contributors)** | 8 |

## The map (measured 27 Sept)

| Point | Direction | How it moves today |
|---|---|---|
| Vault decisions | vault to desk | A lane reads `decisions/` and comments on a `for-iman` issue by hand |
| Board card | desk to board | dotfiles #379: a job on Zaal's Mac at 05:20, 07:40 and 09:10 ET turns the Morning report into a card |
| Telegram | Zaal to desk | Nothing. Rulings sent by DM reach the desk only if a lane or Iman retypes them |
| Postiz | desk to socials | Nothing yet. Desk #30 asks Iman to set it up, due 30 Sept |
| Live sites | sites to desk | Nothing. The desk's README lists 12 live addresses, and nothing checks them |

## 1. Telegram to desk capture

**What exists.** `ZAODEVZ/ZAOartizen` carries a Telegram capture bot:
`.github/workflows/telegram-capture.yml` plus `scripts/tg-capture.mjs`
(229 lines, Node 22). Every 15 minutes, a GitHub job calls Telegram's
`getUpdates` and keeps only messages from an allow-list
(`TELEGRAM_ALLOWED_CHATS`, `TELEGRAM_ALLOWED_USERS`). It refuses to run with an
empty list. It appends each message to `meetings/raw/`, saves the offset to a
committed file, and commits. A `concurrency` group stops two runs from
double-capturing, and the push retries a rebase three times.

**What it has done.** Nothing. Measured from the Actions API, 27 Sept:

| Measure | Value |
|---|---|
| Runs since the first on 21 Sept | 37 |
| Failed | **37 of 37** |
| Error in the latest run | `TELEGRAM_BOT_TOKEN is not set. See meetings/telegram-bot.md.` |
| Commits ever touching `meetings/raw` | 1 |

The code has never been exercised against a live bot. The only missing
piece is a one-time secret, and nobody has added it in six days. This is the
2244 posting failure again: the missing step is setup, not code.

**Why it matters for the desk.** It is the one integration that changes how
a ruling travels. From Monday 28 Sept Zaal is off the Mac. Today a ruling
given by phone reaches the desk only if a lane retypes it (the 15 Sept review
found 5 of 11 Needs-Zaal rows already answered but never relayed). A bot Zaal
can message, turning each message into a `for-iman` issue, removes the lane
from that path.

**What to change when porting it.**

| ZAOartizen does | iman-desk should |
|---|---|
| Append to `meetings/raw/*.md` and commit | Open a `for-iman` issue per message, titled from its first line, labelled `from-telegram` |
| Commit an offset file on every run | Keep the offset in a repo variable, or commit it on its own. The desk's `main` is also Iman's working branch, so a commit every 15 minutes would bury his history |
| Fail loudly without a token (37 red runs) | Skip with a notice while the token is absent, like `bettercallzaal/zaalcaster`'s `post-due.yml`, and start failing once it is set and the call breaks |
| Allow a chat list | Allow **Zaal's user id only**. A desk issue is an instruction to Iman, so only Zaal's messages count |

**The gated parts, stated plainly.** Creating the bot (BotFather), putting its
token in the repo's Actions secrets, and finding Zaal's numeric user id are
Zaal's steps, through `/secret`. The token never appears in chat, the desk or
this doc. Nothing here posts publicly. The bot only reads what is sent to it.

**Build step.** A PR to iman-desk adding `.github/workflows/telegram-to-issue.yml`
and `scripts/tg-to-issue.mjs`, adapted from `tg-capture.mjs` as in the table.
It is done when a dry run passes with the token absent (a skip, not a red
run) and one message from Zaal's id becomes one `for-iman` issue. Owner:
Zaal's iman-desk lane builds it. Zaal adds the token. Iman merges.

Also for ZAOartizen itself: its capture should skip rather than fail while the
token is unset. 37 red runs teach its readers to ignore red, the same point
Vault made about the desk's Vercel status.

## 2. Board (thezao.xyz/today)

**What exists.** `bettercallzaal/zaal-dotfiles` `bin/zao-iman-morning-card`
(228 lines, Python), merged as #379 on 27 Sept 18:27 UTC and tightened by #381
at 18:40. Three cron lines on Zaal's Mac run it at 05:20, 07:40 and 09:10 ET.
It finds the newest open `tonight` issue and takes Iman's newest comment whose
first line opens with "Morning report". It lifts the numbered lines under
Questions, adds one card to the ON A CLOCK TODAY section of the vault's
`TODAY.md` (the file thezao.xyz/today renders), and commits it by pathspec.
State in `~/.zao/iman-morning-card.json` stops the three runs from doubling a
card. An issue labelled `no-report` gets one card saying so.

**Measured, 27 Sept 17:3x ET.**

| Check | Result |
|---|---|
| Cron lines installed (`crontab -l`) | 3 of 3 |
| `zao-iman-morning-card-test` | PASS |
| Mac sleep setting (`pmset -g`) | `sleep 0`, held by `caffeinate` |
| Open cards already on `TODAY.md` | 71 (plus 108 done) |
| First real report it will see | Mon 28 Sept, from the first Tonight issue |

**The gap: answers have no road back.** The card goes one way. The script's
own header says "Zaal answers on the issue himself, by number". But Zaal's
ruling that created the card (grill 27 Sept, item 7) says he answers "there",
on the board, by number. Nothing reads an answer typed on or about the board
and carries it to the desk. From Monday, with Zaal on his phone, the likely
path is a reply that never reaches Iman. That is the F2 failure from the
15 Sept review ("a ruling dies in the room it is made in"), rebuilt one step
later.

**Two smaller risks.**
- **One machine.** The card exists only if Zaal's Mac is up at 05:20, 07:40 or
  09:10 ET. Sleep is off, which helps, but a crash or an update restart
  means no card, and no alert says so.
- **A crowded section.** The card lands among 71 open cards. It is the one
  item with a clock that starts at 5 AM, so it should sit at the top of ON A
  CLOCK TODAY, not wherever the append falls.

**Build step.** Close the loop through the section 1 bot rather than a second
tool. `tg-to-issue` gets one extra rule: a message from Zaal whose first line
starts with a number ("1 yes, 2 no: use the blue one") posts as a **comment on
the newest open `tonight` issue**, headed "Answers from Zaal". It does not
open a new issue. Iman's Claude already reads that issue first (CLAUDE.md,
the overnight loop). Done when a numbered Telegram reply appears on the
Tonight issue within one polling cycle. The card should also end with one
line: "Answer by replying to the ZAO desk bot with numbers". Owner: Zaal's
iman-desk lane, in the same PR as section 1. The card text change goes to the
Dotfiles lane.

## 3. Vault decisions to the desk

**How it moves today.** By hand. When Zaal rules in a grill, the lane that ran
it writes `zao-vault/decisions/grill-<date>-<seat>-<slot>.md`. If the ruling
concerns Iman, some lane then comments on a `for-iman` issue, or opens an
"Answered <date>" issue, quoting it. No link between the two surfaces is
machine-checked. The 15 Sept review named this F1 and F2: two ledgers that
never touch, and a ruling that dies in the room it was made in.

**Measured, 13 to 27 Sept.**

| Measure | Value | Surface |
|---|---|---|
| Decision files in the window | 59 | `ls decisions/` |
| Of those, mentioning Iman or iman-desk | 24 | `grep -l -i -w iman` |
| Of those 24, cited by path on the desk | 4 | every desk issue body and comment by bettercallzaal, `gh api` |
| Uncited, with a line directing Iman ("Iman should", "for Iman", ...) | 8 of the 20 | pattern count per file |

**Citation undercounts delivery, and that matters for the fix.** A sample of 5
uncited files split three ways. One reached the desk under another name: the
21 Sept afternoon grill says its answers were "posted as iman-desk#11". One was
superseded by a later ruling: 23 Sept "invite access instead" of admin, then
admin on 27 Sept. One had **not reached the desk at all**: 27 Sept batch 5,
"Iman gets admin on both" Facebook Pages (ZAOstock and the new ZAO Ellsworth).
The desk said one Page. That one was relayed to desk #13 during this pass. So
the honest number is 4 cited, at least 1 more delivered, at least 1 missed,
and the other 14 unknown without reading each. No surface today can answer
"has this ruling reached Iman", which is the finding.

**Why not auto-post.** A script that copies decision lines onto the desk
would post superseded rulings, like the 23 Sept one. It would also post
rulings meant for other lanes that only mention Iman in passing ("Iman has the
same link"), and anything quoted in a decision that should never reach a
repo. Relaying needs judgement. Detecting a missed relay needs none.

**Build step.** A `desk:` line in the decision file, and a checker.

1. **Convention (the grill skills):** a ruling that Iman must act on carries
   one line, `desk: #<issue>` once relayed or `desk: pending` until then. The
   `five-minute-grill` and `quick-grill` skills add it when they write the file.
2. **Checker (dotfiles cron, next to the morning card):** `zao-desk-relay-check`
   lists every decision file from the last 7 days with `desk: pending`, or
   with a directive Iman line and no `desk:` line at all. It adds one board
   card, "N rulings not yet on Iman's desk", with the file names. It never
   posts to the desk itself.

Done when the checker, run on 27 Sept data, names the batch-5 file (before
this pass relayed it) and nothing already relayed. Owner: the Dotfiles lane
for the checker, the skills owner for the convention.

## 4. zao-tracker (the cowork board's task table)

**What it is.** `~/bin/zao-tracker` writes and reads the ZAO cowork tracker
(Supabase `public.tasks`), the board ZAOcowork renders. Lanes create cards
through it: `pr`, `research`, `inbox`, `meeting`, `handoff`, `action`. Its
usage line reads `zao-tracker pr <pr-num> "<title>" [owner=Iman]`: **a PR
test-plan card is owned by Iman unless the caller says otherwise.** ZAOcowork's
`auto-close.yml` closes a card when its PR merges.

**Measured, 27 Sept 19:3x ET** (`zao-tracker list`, counts from its own header):

| Status | All cards | Owned by Iman |
|---|---|---|
| todo | 207 | 1 |
| in_progress | 119 | 3 |
| blocked | 0 | 0 |
| done | 1,000 | 271 |

| Of Iman's 271 done cards | Count |
|---|---|
| "Test plan: PR #..." (created by `zao-tracker pr`) | 130 |
| "Inbox action: ..." | 15 |
| "Test PR ..." | 8 |
| Everything else | 118 |

**Three findings.**

1. **The tracker's Iman column is mostly machine-made.** Nearly half his done
   cards are PR test plans a lane opened in his name and a workflow closed on
   merge. The newest three are ZAOOS research-doc PRs (#3663, #3665, #3666). The
   board shows 271 done for Iman, and a large share of that is not his work.
2. **His real work is not on it.** The desk has 15+ open `for-iman` issues
   (Postiz #30, the festival run sheet #29, the revenue plan #28 and more).
   `zao-tracker search "iman-desk"` finds 2 cards, both owned by Zaal (the
   Telegram token, and a drafts ruling). None of Iman's desk work is on the
   board.
3. **His 4 open tracker cards are old and re-dated.** Card ids 1282, 1370 and
   1386 (in progress) and 10077 (todo) are all due 2026-10-06. That looks like
   a bulk re-date rather than four live deadlines. One of them is "STANDING
   DAILY: Iman reviews every open PR", and that standing duty is how the
   PR cards land on him.

So there are three ledgers of Iman's work: the desk (his, current), the
tracker (a stale column plus auto-generated review chores), and the vault
(rulings). Section 3 covers the vault. This section is the tracker.

**Build step.** Two small changes, neither of them new tooling.

1. **`zao-tracker pr` default owner: Iman to the PR's author**, or unset. A
   test-plan card for a ZAOOS research doc belongs to whoever reviews ZAOOS,
   and during festival week that is not Iman. Done when the next
   `zao-tracker pr` without an owner argument creates an unowned card, and
   Iman's open count stops rising from PR cards. Owner: Dotfiles lane (the
   script lives in `~/bin`).
2. **Retire or mirror his 4 open cards.** Close the three in-progress ones,
   plus the standing "review every open PR" card, as superseded by the desk.
   Anything still real becomes a `for-iman` issue. Done when
   `zao-tracker list --owner iman --status in_progress` returns 0, or each card
   links a desk issue. Owner: Zaal's iman-desk lane proposes, Zaal rules (it
   retires a standing duty).

The desk stays Iman's ledger. The tracker should not grow a second, silent
copy of his work.

## 5. ZOE

**What ZOE is.** ZAO's Telegram agent. Its code is `bot/src/` in ZAOOS (157
files under `bot/src/zoe/`), and it runs on the VPS, deployed from ZAOOS main
(SYSTEM_MAP). Zaal already talks to it daily in the ZAAL BOTZ group.

**Measured on ZAOOS origin/main, 27 Sept.**

| Question | Answer | Where |
|---|---|---|
| Files in ZOE's code that mention `iman-desk` | **0** | `grep -rli iman-desk bot/src` |
| Can Zaal answer ZOE by just typing? | **Yes.** ZAAL BOTZ General is the "gesture-free ANSWER surface": ZOE arms a question id when it pushes, and Zaal's next plain message there routes back as `[answer:<qid>]` | `bot/src/zoe/pending-answers.ts`, used by `index.ts` and `orchestrator-tick.ts` |
| Can ZOE write to GitHub? | **Yes, via the gh CLI**, "authenticated on the VPS - the bot has no GITHUB_TOKEN env" | `bot/src/cockpit/adapters.ts` |
| Is the Iman heartbeat running? | **No.** `teammate-heartbeat.ts` (#2991, 8 Aug) has **zero importers**, so it has never run | `grep -rl teammate-heartbeat bot/src` |
| Does the heartbeat match today's rules? | **No.** It schedules Iman 10:00 to 20:00 CAT, every 4 hours. The overnight loop (27 Sept) runs him 06:00 to 11:00 CAT | `IMAN_DEFAULT` in the same file |

**The limit that decides it (corrected 27 Sept, 20:2x ET).** The first version
of this section recommended the ZOE route and held PR #31. That was wrong,
and the reason is in the same file: `pending-answers.ts` keeps
`const armed = new Map<number, string>()`, described as "In-memory +
last-write-wins ('answer the most recent thing')" that "Resets on bot
restart". It answers **one** question, the latest, and a restart drops the
arm. A Morning report carries a numbered list, and #31 takes "1 yes, 2 no" as
one message. For ZOE to do that, `pending-answers` would have to grow beyond
last-write-wins. That is a real ZOE change with a real test surface, not a
discovery. (Vault verified the three facts above and caught the limit.)

**So the order is both, one after the other.**
1. **Now:** the desk bot (#31). Creating it in BotFather takes about five
   minutes and can be undone. It works tomorrow morning. If ZOE later wins,
   the cost is one unused bot and a token to revoke.
2. **After 3 Oct:** evaluate the ZOE route as a build, extending
   `pending-answers` to take a numbered list. That is when a ZOE change is not
   competing with the festival.

Holding the bot for the ZOE route would have meant no phone-to-Iman path at
all in festival week, if the ZOE work did not land, and the fallback would
have been a lane retyping answers.

**Attribution is the variable, not a detail.** If `gh` on the VPS is signed
in as bettercallzaal, every "Answers from Zaal" comment ZOE posts is authored
by him and reads correctly anywhere. If it is a bot account, the comment rests
on its marker line, and the marker has to survive being quoted. This is the
same shape as the merge-author finding (the account that acts sets the
author, not the method). #31 has the same question: its comments are
authored by the Actions bot and carry the marker.

**The heartbeat: banner, do not delete.** `teammate-heartbeat.ts` has never
run, and its 10 to 20 CAT window contradicts the overnight loop. This estate
does not delete. It gets a banner at the top: never imported, the window it
encodes, what it contradicts, and the date. It stays as a record of that
design, and Zaal decides any removal.

**Build step.**
1. **Zaal creates the desk bot tonight** (card 10135), and Iman merges #31.
   Done when a Telegram message from Zaal becomes a desk issue.
2. **After 3 Oct:** a ZAOOS PR extending `pending-answers` to take a numbered
   list, and a ZOE module that posts it on the Tonight issue. Done when
   "1 yes, 2 no" typed in General lands as one comment. Owner: the ZOE/ZAOOS lane.
3. **Banner `teammate-heartbeat.ts`** as above. Done when the banner is on
   main. Owner: the ZOE/ZAOOS lane. Any removal is Zaal's.

## 6. Postiz

**Where it stands.** Zaal ruled Postiz Iman's top priority on 27 Sept, and
told him to use it for posting (desk #30, decisions items 13 to 15). Iman had
posted 0 comments on #30 by 20:40 ET the same day. The overnight loop puts
it first on that night's Tonight issue.

**What the API gives, read from Postiz's own docs** (docs.postiz.com, 27 Sept):

| Capability | Detail |
|---|---|
| Auth | an API key in the `Authorization` header; base `https://api.postiz.com/public/v1` |
| Create a post | `POST /posts` with a top-level `type` of **`now`**, **`schedule`** (with an ISO `date`) or **`draft`** |
| Approve a draft | `PUT /posts/{id}/status` with `{"status": "schedule"}` |
| Channels | `GET /integrations` lists the connected accounts; each post names one and carries a per-platform `settings.__type` (25 platforms have custom settings) |
| Rate limit | 90 create-post calls an hour (100 on cloud), and one call can carry several posts |

**Why this matters for the desk.** "Drafts only, Zaal publishes" (item 2)
maps one to one onto Postiz. Iman creates a `draft`, and Zaal's approval is a
status change from draft to schedule. Nothing about the approval needs Zaal
at a computer. A button on `/zaal/` (desk #32) or a Telegram reply (desk #31)
can make that one call.

**What already exists, and one trap in it.** ZAOOS has a Postiz client for
the clip engine, `src/lib/autocliper/postiz-api.ts` (84 lines, last changed
14 Jul). With `POSTIZ_API_KEY` unset, it does not fail. It returns
`status: 'scheduled'` for every platform with a `stub-` id. That is a
success-shaped answer for a post that never left. It predates the 7 Aug
"posting stays sovereign" decision and is not wired to the desk. Copy its
per-platform `__type` settings if useful, **not** its stub behaviour: a
missing key has to be a visible failure, or the morning report will say
"posted" about nothing.

**Build step** (after Iman has Postiz running and an API key, #30).
1. **Desk drafts become Postiz drafts.** A file in `drafts/social/` with a
   short header (network, when) is pushed as a Postiz `draft` by a desk
   workflow. The retracted-wording check (desk #33, merged) runs on it first.
   The key is `POSTIZ_API_KEY` in desk Actions secrets, from Iman's Postiz
   account. Done when a pushed draft file shows up as a draft in Postiz and its
   id is written back on the file's PR. Owner: Zaal's iman-desk lane builds;
   Iman adds the key.
2. **Approve from the phone.** `/zaal/` lists the pending Postiz drafts with an
   Approve button (`PUT /posts/{id}/status` to `schedule`). Done when a tap
   schedules a real draft. Depends on #32 being set up.
3. **No stub successes.** Whatever calls Postiz for the desk fails loudly when
   the key is absent, and the Morning report says "not posted, no key".

## 7. Uptime and wording guards

**Built and merged on the desk, 27 Sept.** `live-check.yml` (#35) reads the
README's "Live now" section and checks every address every 6 hours. The first
run, by hand, read **0 of 14 down**. `retracted-wording.yml` (#33) fails a push
that adds ruled-out wording to a changed draft, using `scripts/retracted.tsv`
(13 phrasings).

| Guard | Runs so far (27 Sept, 21:0x ET) |
|---|---|
| never-commit | 8 PR, 12 push, all green |
| retracted-wording | 1 PR green, 3 push green, 1 push red |
| live-check | 1 manual, green |

**The one red run** was the first push of the PR's own branch. With no
"before" commit the workflow fell back to a full scan and hit the 7
known lines in older drafts. Pushes to `main` have all passed. It is a small
flaw: a new branch touching `scripts/retracted*` always shows red once.

**The real finding: the desk list duplicates a canonical one.** ZAOOS already
holds the estate's retracted-claims ledger at
`research/identity/claims/retracted.tsv` (6 fields: id, pattern, allow,
scope, retracted_on, why), checked by `zao-claims-check` in ZAOOS CI and in
zao-nyc. Its README says why there is one file: "Vendoring a copy of the
ledger into each repo would build exactly that", meaning two AI-readable
surfaces that disagree. The desk's `scripts/retracted.tsv` is that copy,
built without reading the ledger first. The desk's entries are mostly
different in kind (brand spellings, one approved sentence), but the rule
holds.

**Build step.** A desk PR that makes `retracted-wording.yml` fetch the
canonical ledger (ZAOOS is public, so a raw fetch needs no token) and run
`zao-claims-check` on changed drafts. The desk-only entries move into the
canonical ledger with a `scope` that names the desk. The desk's
`scripts/retracted.tsv` gets a MIRROR banner, the same shape the vault copy
already carries, and is not deleted. Done when a draft carrying a canonical
retracted claim fails the desk check, and the desk file says MIRROR at the
top. Owner: Zaal's iman-desk lane (desk PR), ZAOOS for the ledger rows.

## 8. Iman's other ZAODEVZ repos

**Measured, 27 Sept.** ZAODEVZ has 23 unarchived repos, and 9 were pushed in
the last 30 days. The desk README names some of them by repo name and others
only by their live address (`za-oartizen.vercel.app`, `zabalgamez.com`),
so a name count undercounts and is not reported here. The number that
matters is open pull requests:

| Repo | Open PRs | Note |
|---|---|---|
| ZAOstock | **17** | 15 from outside accounts (poidh round 5 agents and others), 2 from bettercallzaal; oldest three from 26 Sept |
| iman-desk | 4 | Zaal-side PRs waiting on Iman (#31, #32, #34, #37) |
| ZAOfractal | 2 | both from bettercallzaal, 26 Sept |
| the other 6 active repos | 0 | |

On the 27 Sept call Zaal asked Iman to read the poidh round 5 PRs and report
how his agent is doing (desk updates, direction 7). **None of the 17 appear in
the Tonight queue**, which lists only `for-iman` issues on the desk. So the
biggest review backlog Iman owns is invisible from his own nightly list.

**Build step.** Extend `scripts/tonight-queue.py` with a block called "PRs
open on your repos": count per ZAODEVZ repo, the oldest PR's age, and a link.
It uses the search API (`is:pr is:open user:ZAODEVZ`, public repos, readable
with the Actions token). Done when tonight's issue shows ZAOstock 17 with its
oldest age. Owner: Zaal's iman-desk lane. It touches the same file as #37, so
it goes after #37 merges.

## Closing note

Every integration point now has a section. The pattern across all eight:
most of what the desk needs already exists somewhere in the estate. The ZOE
answer surface, the Postiz client, the claims ledger, the capture bot and
the board card were all found, not invented. Each one was missing either
a setup step (the Telegram token, 37 of 37 failed runs) or a connection
(nothing checks whether a ruling reached the desk). Where a copy was built
anyway (the desk's retracted list), the fix is to point back at the
original, not to keep two.

## Also See

- [community/2566 - The overnight loop](../2566-iman-overnight-loop/)
- [community/2253 - Working with Iman: every friction is structural](../2253-iman-workflow-structural-frictions/)
- [cross-platform/2244 - The posting platform decision](../../cross-platform/2244-posting-platform-decision/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Built as iman-desk #31, token tonight: `telegram-to-issue` on iman-desk; done when a message from Zaal's id becomes a `for-iman` issue and a tokenless run skips green | Zaal's iman-desk lane | PR | 2026-09-30 |
| Create the bot and add `TELEGRAM_BOT_TOKEN` to iman-desk Actions secrets via `/secret`; done when the secret is listed in repo settings | @Zaal | Setup | 2026-09-30 |
| Add the numbered-reply rule to `tg-to-issue` (answers become a comment on the Tonight issue); done when a Telegram reply "1 yes" lands on the issue | Zaal's iman-desk lane | PR | 2026-09-30 |
| Put the morning card at the top of ON A CLOCK TODAY and add the answer-by-bot line; done when Monday's card shows both | Dotfiles lane | PR | 2026-09-29 |
| Build `zao-desk-relay-check` and add the `desk:` line to the grill skills; done when a 27 Sept dry run names the batch-5 file and no relayed file | Dotfiles lane | PR | 2026-10-01 |
| Change `zao-tracker pr`'s default owner from Iman to unset; done when a PR card created without an owner argument is unowned | Dotfiles lane | PR | 2026-10-01 |
| Put retiring Iman's 4 open tracker cards (incl. the standing PR-review duty) to Zaal; done when each is closed or links a desk issue | Zaal's iman-desk lane | Ruling | 2026-10-06 |
| Extend ZOE `pending-answers` to take a numbered list and post it on the Tonight issue; done when "1 yes, 2 no" typed in General lands as one comment | ZOE/ZAOOS lane | PR | 2026-10-10 |
| Banner the never-imported `teammate-heartbeat.ts` (never ran, 10-20 CAT window contradicts the overnight loop, date); done when the banner is on main | ZOE/ZAOOS lane | PR | 2026-10-06 |
| Desk drafts to Postiz drafts (workflow, retracted-wording check first, key from Iman); done when a pushed draft file appears as a Postiz draft | Zaal's iman-desk lane | PR | 2026-10-06 |
| Approve Postiz drafts from /zaal/ (draft to schedule); done when a tap schedules a real draft | Zaal's iman-desk lane | PR | 2026-10-08 |
| Point the desk wording check at the ZAOOS canonical ledger, MIRROR banner on the desk copy; done when a canonical retracted claim fails the desk check | Zaal's iman-desk lane | PR | 2026-10-06 |
| Add "PRs open on your repos" to the Tonight queue; done when tonight's issue shows ZAOstock's count and oldest age | Zaal's iman-desk lane | PR | 2026-10-01 |
| Make ZAOartizen's capture skip while the token is unset; done when its next scheduled run is green | Zaal's iman-desk lane | PR | 2026-10-06 |

## Sources

- ZAOOS `research/identity/claims/README.md` and `retracted.tsv` at origin/main `[FULL]`, method: `git show`.
- ZAODEVZ repo list and open PRs per repo `[FULL]`, method: `gh repo list`, `gh pr list` per repo, 27 Sept 21:0x ET.
- iman-desk Actions runs per workflow `[FULL]`, method: `gh run list`, failed log read.

- [Postiz public API: introduction](https://docs.postiz.com/public-api/introduction), [create post](https://docs.postiz.com/public-api/posts/create), [change status](https://docs.postiz.com/public-api/posts/change-status) `[FULL]`, method: curl plus HTML strip, 27 Sept.
- ZAOOS `src/lib/autocliper/postiz-api.ts` and `config.ts` at origin/main `[FULL]`, method: `gh search code` then read.

- ZAOOS `bot/src/zoe/pending-answers.ts`, `teammate-heartbeat.ts`, `bot/src/cockpit/adapters.ts` on origin/main `[FULL]`, method: read at the worktree, importers counted with `grep -rl`.

- `~/bin/zao-tracker` usage and `list`/`search` output, 27 Sept `[FULL]`, method: ran the CLI; counts from its own `tasks (N)` header, not line counts.

- `zao-vault/decisions/` 13 to 27 Sept `[FULL]`, method: `ls`, `grep`, and five files read in full for the sample.
- ZAODEVZ/iman-desk issue bodies and comments by bettercallzaal `[FULL]`, method: `gh api .../issues/comments --paginate`, `gh issue list --state all`.

- `bettercallzaal/zaal-dotfiles` `bin/zao-iman-morning-card`, PRs #379 and #381, `cron/mac.cron` `[FULL]`, method: read locally at `ace8e45`; test run PASS; `crontab -l`, `pmset -g`.
- Vault `TODAY.md` card counts `[FULL]`, method: `grep -c` on open and done checkboxes.

- `ZAODEVZ/ZAOartizen` `.github/workflows/telegram-capture.yml` and `scripts/tg-capture.mjs` `[FULL]`, method: `gh api` contents, read 27 Sept.
- `ZAODEVZ/ZAOartizen` Actions runs for `telegram-capture.yml` `[FULL]`, method: `gh api .../runs?per_page=100`, conclusions counted; failed log read with `gh run view --log-failed`.
- `bettercallzaal/zaalcaster` `.github/workflows/post-due.yml` `[FULL]`, method: `gh api` contents (the skip-when-unset pattern).
- `ZAODEVZ/iman-desk` at origin/main, README Live table and open issues `[FULL]`, method: `git` and `gh`.
- [Telegram Bot API, getUpdates](https://core.telegram.org/bots/api#getupdates) `[FULL]`, method: curl plus HTML strip. Confirms the offset rule: an update counts as confirmed once `getUpdates` is called with a higher offset, and incoming updates are kept for at most 24 hours. A day of failed runs therefore loses messages..
