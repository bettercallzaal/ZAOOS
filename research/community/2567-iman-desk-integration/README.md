---
topic: community
type: audit
status: draft
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
| Telegram to desk capture | **BUILD, issues not files, token first** | 1 |
| Board (thezao.xyz/today) | **KEEP the card job; BUILD the missing answer path** | 2 |
| Vault decisions to desk | **DETECT unrelayed rulings; do not auto-post** | 3 |
| zao-tracker | pending | - |
| ZOE | pending | - |
| Postiz | pending | - |
| Uptime and claims guards | pending | - |
| Iman's other ZAODEVZ repos | pending | - |

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

## Also See

- [community/2566 - The overnight loop](../2566-iman-overnight-loop/)
- [community/2253 - Working with Iman: every friction is structural](../2253-iman-workflow-structural-frictions/)
- [cross-platform/2244 - The posting platform decision](../../cross-platform/2244-posting-platform-decision/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Build `telegram-to-issue` on iman-desk; done when a message from Zaal's id becomes a `for-iman` issue and a tokenless run skips green | Zaal's iman-desk lane | PR | 2026-09-30 |
| Create the bot and add `TELEGRAM_BOT_TOKEN` to iman-desk Actions secrets via `/secret`; done when the secret is listed in repo settings | @Zaal | Setup | 2026-09-30 |
| Add the numbered-reply rule to `tg-to-issue` (answers become a comment on the Tonight issue); done when a Telegram reply "1 yes" lands on the issue | Zaal's iman-desk lane | PR | 2026-09-30 |
| Put the morning card at the top of ON A CLOCK TODAY and add the answer-by-bot line; done when Monday's card shows both | Dotfiles lane | PR | 2026-09-29 |
| Build `zao-desk-relay-check` and add the `desk:` line to the grill skills; done when a 27 Sept dry run names the batch-5 file and no relayed file | Dotfiles lane | PR | 2026-10-01 |
| Make ZAOartizen's capture skip while the token is unset; done when its next scheduled run is green | Zaal's iman-desk lane | PR | 2026-10-06 |

## Sources

- `zao-vault/decisions/` 13 to 27 Sept `[FULL]`, method: `ls`, `grep`, and five files read in full for the sample.
- ZAODEVZ/iman-desk issue bodies and comments by bettercallzaal `[FULL]`, method: `gh api .../issues/comments --paginate`, `gh issue list --state all`.

- `bettercallzaal/zaal-dotfiles` `bin/zao-iman-morning-card`, PRs #379 and #381, `cron/mac.cron` `[FULL]`, method: read locally at `ace8e45`; test run PASS; `crontab -l`, `pmset -g`.
- Vault `TODAY.md` card counts `[FULL]`, method: `grep -c` on open and done checkboxes.

- `ZAODEVZ/ZAOartizen` `.github/workflows/telegram-capture.yml` and `scripts/tg-capture.mjs` `[FULL]`, method: `gh api` contents, read 27 Sept.
- `ZAODEVZ/ZAOartizen` Actions runs for `telegram-capture.yml` `[FULL]`, method: `gh api .../runs?per_page=100`, conclusions counted; failed log read with `gh run view --log-failed`.
- `bettercallzaal/zaalcaster` `.github/workflows/post-due.yml` `[FULL]`, method: `gh api` contents (the skip-when-unset pattern).
- `ZAODEVZ/iman-desk` at origin/main, README Live table and open issues `[FULL]`, method: `git` and `gh`.
- [Telegram Bot API, getUpdates](https://core.telegram.org/bots/api#getupdates) `[FULL]`, method: curl plus HTML strip. Confirms the offset rule: an update counts as confirmed once `getUpdates` is called with a higher offset, and incoming updates are kept for at most 24 hours. A day of failed runs therefore loses messages..
