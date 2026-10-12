---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-11
superseded-by:
related-docs: "agents/2652-self-upgrade-shared-resources-ingest, agents/2239-zoe-capability-map"
original-query: "Zaal, 2026-10-11, zoe lane: 'all of them lets do more than that too and have it find ways to improve itself thats the most important improvement we can do'. Seat ordering the same night: build self-scout next, doc first, with the cost ceiling, the one-instance lock, what it may open and what it may never do, and the yes-or-no for Zaal at the top."
tier: QUICK
---

# 2662 - ZOE self-scout: she looks for upgrade candidates herself, one a week

## The question for Zaal

**Yes or no: may ZOE pick ONE outside open-source repo a week by herself and run the fit check on it that she already runs when you send her a link?**

- Recommended: **yes**, at one a week, with the flag left off until you say so.
- If yes: the code is built behind `ZOE_SELF_SCOUT`, default off. Turning it on is one line in the VPS env and a restart, and it is yours.
- If no: nothing changes. The code can sit merged and off, or stay unmerged.
- If there is no answer: the same as no. The flag stays off and the code PR (ZAOOS #3920) stays on hold. Nothing runs by default and nothing times out into a yes.

This is a new autonomous step, so the repo rule applies: a numbered doc and your explicit yes before it runs. Your "have it find ways to improve itself" on 2026-10-11 is taken as direction to write this, not as that yes.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | EXTEND the self-upgrade intake (`bot/src/zoe/self-upgrade.ts`). Do not build a second pipeline. | The fit check, the dedupe against the queue and the research library, the daily cap and the doc-plus-PR output already exist there (research/agents/2652-self-upgrade-shared-resources-ingest). The only thing missing is a source other than Zaal's hand. |
| 2 | The scout is plain code: GitHub's repository search, no model call. | Picking a candidate is filtering and sorting, the same judgement every time (`.claude/rules/code-over-inference.md`). The model is spent once, on the fit check. |
| 3 | ONE candidate per week, queued as an ordinary `resource` work item. | A fit check costs one research-worker run. One a week is at most 5 a month, and each lands as a doc he can read on a phone. |
| 4 | USE two flags: `ZOE_SELF_SCOUT=1` does nothing unless `ZOE_SELF_UPGRADE=1` is also set. | The scout only feeds the self-upgrade queue; with that off there is nothing to feed. |
| 5 | SKIP anything that builds. The scout ends at a research doc and its PR. | Building from a fit check stays a separate, human-started step (doc 2652's gate table). |

## What already exists (read on origin/main, 2026-10-11)

| Piece | Where | State |
|---|---|---|
| Link intake: Zaal pastes a GitHub repo link in the DM, ZOE queues a fit check | `bot/src/zoe/self-upgrade.ts` (`claimResourceLink`, `resourceDecision`, `buildFitCheckGoal`), wired at `bot/src/zoe/index.ts` | Built and wired, behind `ZOE_SELF_UPGRADE` |
| Dedupe: not queued twice, not re-run when a doc already names the repo | `resourceDecision` in the same file | Built |
| Caps: 2 resources a day, inside the work loop's 6 a day | `selfUpgradeDailyCap` (default 2), `ZOE_WORKLOOP_DAILY` (default 6) in `bot/src/zoe/work-loop.ts` | Built |
| One instance | the work-loop tick lock (`bot/src/zoe/tick-lock.ts`) and the scheduler's per-day fire sentinel (`claimFire` in `bot/src/zoe/scheduler.ts`) | Built |
| A scout that audits OUR six repos and proposes fixes | `bot/src/zoe/repo-improver.ts` (`SCOUT_REPOS`) | Built; it looks inward, never at outside repos |
| A log of what Zaal asked for that ZOE could not do | ZAOOS PR 3918, open on 2026-10-11 | Not merged |

What was not found: anything that picks an outside repo without Zaal sending it. Searched `bot/src/zoe` and `bot/src/hermes` on origin/main for `search/repositories`, `trending`, `rotation`, `nextRepo` and `SCOUT_REPOS`; the only hits are the inward scout above. The daily files under `research/_radar/` re-check our own existing docs; the newest one (2026-10-10) holds zero GitHub links. Not searched: scripts that live only on the VPS.

## Design

```
Sunday 19:00 UTC, scheduler cron
  -> both flags on?            no -> return, nothing claimed
  -> claim the day's sentinel  already claimed -> return
  -> pick this week's query    fixed list, rotated by week number
  -> GitHub repository search  one request, top 20 by stars
  -> filter and rank           plain code, rules below
  -> first repo that is not already queued and not already in the research library
  -> enqueue ONE `resource` item (the same call the DM intake makes)
  -> status line to Zaal: "Scouting <owner/repo> this week." No reply is needed or read.
The existing work loop does the rest: fit check, research doc, PR.
```

Filter rules, in order. A repo is dropped when any is true:

1. It is ours (owner `bettercallzaal`, `ZAODEVZ`, `ZAO-DEVZ`).
2. Archived, a fork, or not pushed in the last 30 days.
3. Fewer than 200 stars.
4. GitHub's licence field is empty. This is only a cheap pre-filter. The fit check still reads the LICENSE file itself, because the field is wrong often (doc 2652; the sample below shows `NOASSERTION` on 3 of 20).
5. Its name or description marks it as a list, a course or a book (`awesome`, `tutorial`, `course`, `book`, `roadmap`, `interview`).
6. It is on the deny list (an env value, described below).
7. It is already in the work queue, or a research doc already names it (the existing `resourceDecision`).

The query list is a constant in the file, one used per week in rotation. As built in ZAOOS #3920 it is these six pairs, and changing it is a PR:

1. `topic:telegram-bot topic:ai-agent`
2. `topic:personal-assistant topic:llm`
3. `topic:agent-memory topic:llm`
4. `topic:claude-code topic:agent`
5. `topic:ai-agent topic:self-improving`
6. `topic:telegram-bot topic:llm`

The deny list, as built, is not in the file. It is read from the env value `ZOE_SELF_SCOUT_DENY`: comma-separated owners or `owner/name` pairs, compared in lower case, empty by default. Two limits of that, both found in review of #3920: a mistyped entry matches nothing and so lets the repo through, and nothing checks the value's shape.

### Sample run, measured 2026-10-11

Four queries through `gh api search/repositories`, each with `pushed:>2026-09-11 stars:>200 archived:false`, sorted by stars, top 5 shown:

| Query | Total | Top 5 (stars, licence field) |
|---|---|---|
| `topic:telegram-bot topic:ai-agent` | 12 | groupultra/telegram-search (4,119, AGPL-3.0), nextlevelbuilder/goclaw (3,646, NOASSERTION), moltis-org/moltis (2,885, MIT), thClaws/thClaws (1,239, Apache-2.0), xvirobotics/metabot (995, MIT) |
| `topic:personal-assistant topic:llm` | 9 | xianyu110/awesome-openclaw-tutorial (4,564, NOASSERTION), ShenSeanChen/waku-agent (1,983, MIT), DasterProkio/awesome-ai-companion (923, CC-BY-4.0), existence-master/Sentient (698, NOASSERTION), agenvoy/Agenvoy (441, AGPL-3.0) |
| `topic:agent-memory` | 100 | 666ghj/MiroFish (78,176, AGPL-3.0), bojieli/ai-agent-book (53,542, Apache-2.0), pingcap/tidb (40,635, Apache-2.0), volcengine/OpenViking (39,685, AGPL-3.0), topoteretes/cognee (32,042, Apache-2.0) |
| `topic:claude-code topic:agent` | 84 | Leonxlnx/taste-skill (94,775, MIT), shareAI-lab/learn-claude-code (78,377, MIT), headroomlabs-ai/headroom (75,080, Apache-2.0), jeecgboot/JeecgBoot (48,177, Apache-2.0), herdrdev/herdr (43,428, Apache-2.0) |

What the sample says about the design:

- Topic search is noisy. Of these 20, at least 5 are not candidates at all: two `awesome` lists, a book, a database (tidb) and a low-code platform (JeecgBoot). Rule 5 removes three of them by name. The other two would reach a fit check, which would answer SKIP. That is one wasted run in a bad week, and the reason for one a week and not one a day.
- Narrow two-topic queries (12 and 9 results) are cleaner than one broad topic (100). The list will use pairs.
- The licence field read `NOASSERTION` on 3 of 20, which is why rule 4 is a pre-filter and never the licence answer.

## Limits

| Limit | Value | Where it is enforced |
|---|---|---|
| Candidates queued | 1 per week | the scout enqueues at most once per fire; the cron fires weekly; the sentinel stops a second fire that day |
| Fit checks run | at most 2 resources a day, 6 work items a day | existing caps, unchanged |
| GitHub requests | 1 search per week | the scout; the search limit read tonight was 30 per minute for this token |
| Model spend by the scout itself | none | it makes no model call |
| Model spend per fit check | UNKNOWN in dollars. One research-worker run. Not measured for this doc. | the work loop's own budget and cap |
| One instance | one per day by sentinel, one work tick at a time by lock | existing |

## What it may do, and what it may never do

May:

- Read GitHub's public search API.
- Add one `resource` item to ZOE's own work queue.
- Send Zaal one status line in the DM.
- Through the existing work loop: open a research doc PR.

Never:

- Write or change code, in any repo.
- Merge anything. A fit-check doc is a docs PR and follows the docs rules already in force.
- Post, cast, email or message anyone but Zaal.
- Spend money, sign anything, or touch a wallet.
- Add a dependency or copy code from a candidate. Adopting anything is a separate, human-started build with the licence read from the file and credit given (`.claude/rules/credit-attribution.md`).
- Run when either flag is off, or queue more than one item per fire.

## Risks

| Risk | What limits it |
|---|---|
| Fit-check docs auto-merge with nobody reading them first | They are research docs, PR-only, one a week. A doc that concludes about a licence is already held for a reviewer by the docs automerge. Since 2026-10-11 a `hold` label can stop any one of them. |
| A candidate's README tries to instruct the research worker | The worker is read-only and the fit-check brief already tells it to write no code and send nothing. The scout passes only the repo URL, never the description text, into the queue. |
| Noise: a weak candidate burns a run | One a week, and the name filter. There is no skip reply in this version: the status line tells Zaal what was picked, and the flag is the off switch. |
| A licence that forbids reuse passes the filter | Rule 4 checks only that GitHub shows some licence. Whether we may take anything is decided in the fit check, which reads the LICENSE file, and by the docs automerge's licence hold. The scout itself copies nothing. |
| A fit-check doc still in an open PR is not on main yet, so the same repo can look new | It can be picked a second time until that doc merges. Cost: one repeated run. Not fixed in #3920. |
| With the flag on, nobody picks the repo, and the fit check reads a stranger's README and writes a doc the bot can merge | This is the real change the yes buys. The worker is read-only and told to write no code; the doc is PR-only; one a week. It is still an outside text steering what a doc says, with no person in between. |
| The search returns nothing usable | Nothing is queued and nothing is sent. The log line says how many were seen and dropped per rule. |
| It quietly stops | It prints a `[zoe/ran]` line on a successful queue (`featureRan`), so a silent month is visible in the journal. |

## Comparison

| Option | Cost | Fit with live code | Verdict |
|---|---|---|---|
| A. Weekly GitHub search, plain code, feeds the existing fit check | 1 API request and at most 1 research run a week | High: reuses intake, dedupe, caps, output | USE |
| B. A model reads feeds and chooses what looks interesting | A model call per scan, every scan | Low: a second judgement loop next to repo-improver | SKIP for now |
| C. Only the capability gap log (PR 3918) drives upgrades | None beyond that PR | High | USE as well. It hears what Zaal asked for; this one hears what exists outside. They feed the same fit check. |
| D. Leave it manual: Zaal sends links | None | Already live | What happens if the answer is no |

## Sources

| # | Source | Read | Method |
|---|---|---|---|
| 1 | `bot/src/zoe/self-upgrade.ts`, origin/main at 5421b8f0 | [PARTIAL - lines 1 to 180 of 310: header, intake, dedupe, fit-check goal; the snapshot stage was not re-read] | Raw, `git show` |
| 2 | `bot/src/zoe/repo-improver.ts`, same commit | [PARTIAL - header and `SCOUT_REPOS`, lines 1 to 60 of 375] | Raw, `git show` |
| 3 | `bot/src/zoe/work-loop.ts`, same commit | [PARTIAL - `enqueueWork` and the daily cap lines] | Raw, `git show` and grep |
| 4 | research/agents/2652-self-upgrade-shared-resources-ingest | [PARTIAL - headings, Key Decisions rows and cap lines by grep; not read end to end] | Raw, `git show` and grep |
| 5 | GitHub REST search, four live queries, 2026-10-11 | [FULL - the 20 rows in the table are the API's own fields] | Raw JSON through `gh api search/repositories` |
| 6 | GitHub REST `rate_limit`, 2026-10-11 | [FULL - `resources.search.limit` read 30] | Raw JSON through `gh api rate_limit` |
| 7 | `research/_radar/2026-10-10.md` | [FULL - one line, zero GitHub links] | Raw, `git show` |

No community source was read for this doc. It is a QUICK-tier design decision about our own code, and the one outside fact it rests on (what the search returns) was measured directly.

## Next Actions

| Action | Owner | State |
|---|---|---|
| Answer the question at the top | Zaal | Open |
| Build the scout behind `ZOE_SELF_SCOUT`, default off, as its own code PR | zoe lane | Done: ZAOOS #3920, reviewed clean as code with flags off, on hold for this answer |
| If yes: add the flag on the VPS and restart ZOE | Zaal | Waits on the answer |
| After 4 weeks on: count fit checks that answered EXTEND or NEW against SKIP, and keep, tune or turn off | zoe lane | Waits on it being on |

## Also See

- research/agents/2652-self-upgrade-shared-resources-ingest - the loop this extends
- research/agents/2239-zoe-capability-map - what ZOE can already do
- Board cards 10387 to 10394 - the eight ZOE upgrades queued 2026-10-11; this is 10394
