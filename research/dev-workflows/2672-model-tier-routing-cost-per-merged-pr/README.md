---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-13
superseded-by:
related-docs: "2353, 2188, 2217, 2208, 2664"
original-query: "https://www.reddit.com/r/ClaudeUniversity/s/hDPsdoNdaP Research this" then "/zao-research onthis"
tier: STANDARD
---

# 2672 - Does routing work across model tiers cut cost per shipped outcome? Measured on this estate, 12 and 13 Oct 2026

> **Goal:** Test the Reddit claim "running AI models as a team saves a fortune worth of tokens" against this estate's own transcripts, and say what to keep, cut and route.

**Short answer.** Routing by tier is real, but the post aims at the wrong cost for us. On 12 and 13 Oct, **85% and 89% of spend was context being re-read or re-written into the cache**, not a model "thinking". Output tokens were 15% and 11%. The levers that move that are session length, context size, idle wake-ups and who holds the long-lived sessions. Tier choice helps only at the point a session or subagent is **spawned**; switching tier mid-session rewrites the cache and costs more.

## Key Decisions

| # | Decision | The number behind it |
|---|---|---|
| 1 | **FIX the meter first.** `zao-spend` prices every Opus message at Opus 4.1 rates and counts PRs in the wrong repos. | Its rate table gives **$1,606** for 12 Oct. At Anthropic's current list prices the same tokens cost **$338.65**, so the meter reads **4.74x high**. Its 24-hour run at 19:27 ET on 13 Oct printed $2,179.93 and "$198.18 per PR", counting 11 PRs opened in 6 hard-coded repos. PRs actually merged: **41 on 12 Oct, across 8 repos, 1 of which (ZAOOS) is on the meter's list**. Real cost: **$8.26 per merged PR** on 12 Oct, **$13.25** on 13 Oct (28 merged by 19:33 ET). |
| 2 | **KEEP the evaluator gate. Run it as one fresh session per PR instead of one long session.** | The evaluator lane cost **$89.58 (26% of 12 Oct) and $84.07 (23% of 13 Oct)**, the single largest or second largest lane both days. It earns its place: 47 PRs updated since 12 Oct carry a `NEEDS_WORK` comment against 82 with `PASS` (GitHub search; rough, see Method). A long-lived evaluator re-reads everything it has ever reviewed on each message. |
| 3 | **CUT wake-ups of idle sessions with a large context.** Close the lane with a handoff instead (`.claude/rules/session-boundaries.md` already says this). | Messages that rewrote more than half of a context over 100k tokens: **47 on 12 Oct ($65.46, 19% of the day) and 58 on 13 Oct ($125.64, 34% of the day)**. One rewrite of a 640k context costs about $5 at the 1-hour cache-write rate. This is the largest single avoidable item found. |
| 4 | **CUT lanes that hold a session open without merging.** | Shipping lanes in repos with **no PR merged that day** cost **$29.87 (8.8%) on 12 Oct and $63.96 (17.2%) on 13 Oct**. Some of that produced non-PR work (content, notes), so read it as a ceiling. Lane count did not move the coordination share: 29 working directories and 23 both ran at 51 to 54% coordination. |
| 5 | **ROUTE at the spawn boundary, never mid-session.** Research fetching and summarising go to Sonnet subagents; mechanical cleanup to the Haiku `zao-formatter` agent or a script; well-specified mechanical code to Codex. | Only **6.9% and 1.6%** of spend ran on Sonnet, and under 1% on Haiku, although `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is set and `.claude/agents/zao-builder.md`, `zao-evaluator.md` (both `model: sonnet`) and `zao-formatter.md` (`model: haiku`) exist. **The tiers are configured and barely used.** |
| 6 | **TRIAL the coordination lanes (orchestrator, evaluator, merge, grill) on Sonnet 5.5 with an Opus advisor.** Measure before adopting. | They were **54.0% and 51.1%** of spend. Re-priced at Sonnet 5.5 rates, token for token, that is **$78.82 and $93.44 a day less (23.3% and 25.2%)**. That is an upper bound that assumes the same message count and no loss in judgment, which is unmeasured. Anthropic documents this pairing: "Sonnet handles routine work and escalates planning, ambiguous failures, and completion checks to Opus". |
| 7 | **SKIP Jev and third-party routers for now.** | Jev is a real product (below), but the routers built on it switch tier per turn, which is exactly the cache hazard, and they send prompts to a third party. Our spend is not a which-model-answers-this-turn problem. |

**Money context, in general terms.** Tooling runs to roughly $826 a month and income is the constraint. On a subscription these list-price dollars are a consumption meter, not an invoice; the binding limit is the weekly cap, which the seat reported at 97% on 13 Oct. Everything below is a way to spend less of that cap per merged PR.

## What the post actually shows

The post is a 19-second video with no text body (Reddit `1x3abfq`, u/KazuKazu_hyperbowl, score 24). The brief summarised it as a cheap-model summarise, big-model solve, cheap-model format pipeline. **That is the poster's comment, not the video.** The frames show a terminal titled "AGENT STACK - OPUS PLANS - SONNET RUNS - FABLE WATCHES":

- **Opus 5.5 main session**: "plans + ships the final code", effort high.
- **"JEV - fork layer"**: answers small questions such as "file exists?", "which tool?", "keep going?" with a confidence score (0.97, 0.86, 0.85). "sharp -> stays in code, split -> up to opus". The footer reads "jev: 1,344 forks resolved without opus" and "stop paying opus prices to decide if a file exists".
- **Three Sonnet 5.5 subagents**: worker ("edits + tests"), explorer ("reads codebase"), researcher ("pulls the docs").
- **Fable 5.1 as `/advisor`**: "reads every turn, every tool call, every result", "says nothing unless it's actually wrong", "never writes code". The counter shows about 322k tokens read.
- The command shown is `claude --advisor fable`. The watermark is **@alfa123gg**, so the Reddit poster is probably not the author of the animation.

**No method, measurement or code is given.** The poster's own explanation in the comments is three sentences, and when asked for evals answered "you can make your own".

## What "JEV" is

**Jev is TypeSafe AI's decision model**, announced by TypeSafe's founder as "our first System One Model: a new class of frontier models built to make fast, structured decisions that software can use directly". It "gives up string generation": "unstructured state in, typed probabilistic decisions out", and the post claims it is "two orders of magnitude faster and more efficient" than existing LLMs on those tasks. The claim is TypeSafe's own.

In Claude Code it shows up as community plugins. `Flam1ngFir3ball/jev-claude-router` (MIT, "Copyright (c) 2026 Satvik Sinha", a fork of `satviksinha/jev-model-router`; 2 stars, last push 2026-09-29) asks Jev two questions per prompt: which tier, and how much effort. Its README carries the most useful sentence found in this research:

> "Claude's prompt cache is per model. Moving a long conversation to another model rewrites the whole context into that model's cache, which at a few hundred thousand tokens costs dollars. A router that follows every pick can cost more than it saves"

Its own status line shows the guard firing: "kept fable: haiku costs $4.41 vs $0.13" - moving down a tier would have cost 34 times more than staying. A commenter on the thread (u/Hungry_Loss_2268) puts it plainly: "its stillo the standard coordinator dispatch mode but with jev as the classifier/router."

## The estate's own numbers

All figures are list price at Anthropic's published rates on 2026-10-13, computed from the session transcripts on Zaal's Mac. Days are Eastern time. 13 Oct is a partial day, measured at 19:33 ET.

| | 12 Oct | 13 Oct (to 19:33 ET) |
|---|---|---|
| Spend at current list price | **$338.65** | **$370.92** |
| What `zao-spend`'s rate table gives for the same tokens | $1,606.44 (4.74x) | $1,762.98 (4.75x) |
| Opus 5.5 share | 92.3% | 97.9% |
| Sonnet 5.5 / Haiku 5.5 share | 6.9% / 0.9% | 1.6% / 0.5% |
| Output tokens | 15.2% | 10.6% |
| Cache writes (1-hour + 5-minute) | 38.9% | 44.6% |
| Cache reads | 45.8% | 44.8% |
| API messages | 4,076 | 2,650 |
| Median context per message | 168,459 tokens | 270,289 tokens |
| Messages over 200k context | 39% | 68% |
| Coordination lanes (orchestrator, evaluator, merge, grill, finance seat) | $183.03 (54.0%) | $189.55 (51.1%) |
| Full-context cache rewrites | 47 msgs, $65.46 | 58 msgs, $125.64 |
| PRs merged, all lane repos | 41 | 28 |
| **Cost per merged PR, all-in** | **$8.26** | **$13.25** |
| Cost per merged PR, shipping lanes only | $3.80 | $6.48 |

**Cost per merged PR by repo** (shipping lanes whose working directory is in that repo, divided by PRs merged in it that day):

| Repo | 12 Oct | 13 Oct |
|---|---|---|
| `bettercallzaal/ZAOOS` | $31.05 / 9 = **$3.45** | $59.75 / 7 = **$8.54** |
| `bettercallzaal/zaal-dotfiles` | $44.83 / 10 = **$4.48** | $2.74 / 6 = **$0.46** |
| `bettercallzaal/wavewarz-protocol` | $19.13 / 5 = **$3.83** | $12.33, none merged |
| `ZAODEVZ/ZAOstock` | $13.51 / 8 = **$1.69** | no lane |
| `bettercallzaal/north-creek` | $4.37 / 2 = **$2.19** | $7.86 / 3 = **$2.62** |
| `bettercallzaal/zao-fractal-bot` | $11.38 / 1 = **$11.38** | $13.29, none merged |
| `bettercallzaal/zingfisher` | $0.97, none merged | $12.24 / 2 = **$6.12** |
| `bettercallzaal/zao-papers` | $1.47 / 2 = **$0.74** | 1 merged, no lane cost |
| `bettercallzaal/zao-media` | $4.67, none merged | $24.56, none merged |

**Limits of this table.** A lane is assigned to the repo of its working directory, and lanes do work outside it (this lane wrote notes to another repo during the window). A merged PR is not a unit of value: one-line index rows and a protocol change both count as one. Two days are two data points. The table is good for spotting a lane that spends without merging, and weak for ranking lanes against each other.

**Seven days.** `zao-spend --days 7` reads $14,367 across 584 sessions. At the 4.74x overstatement measured above that is about **$3,030** at current list price. That is an estimate: it assumes the week's model mix matches these two days.

### Three things the numbers say

**1. Context is the cost.** With the median message carrying 168k to 270k tokens of context, each message pays to read it back (Opus 5.5 cache read, $0.20 per million) and each wake-up after an hour pays to write it again ($8 per million). Summed, cache was 85% and 89% of spend. A pipeline that hands the "easy" step to a cheaper model does nothing about this unless that step runs in its own small context.

**2. Half the spend is coordination.** The orchestrator and the evaluator alone were $160 of 12 Oct's $339 and $169 of 13 Oct's $371. `agents/2353-model-tiering-and-escalation` found the same shape on 2026-08-20: "The real lever is SESSION LENGTH, not model", with one orchestrator session at 69% of that day.

**3. The Sonnet floor from doc 2353 is not what is running.** That doc's decision 1 was "Sonnet is the floor for lanes". On 2026-10-13 `~/.claude/settings.json` reads `model: claude-opus-5-5`. A search of the ZAOOS research library for the decision to change it found none; other stores were not searched. Opus 5.5 now lists at $4/$20 per million, about a quarter of the Opus 4.1 rate the meter still uses, which may be why it was raised.

## The commenters' counter-evidence

Several of the 37 comments retrieved push back, and they line up with the data above:

- **Orchestration overhead.** u/SketchWeave: "I tried something like this and ended up spending more time managing it than actually building features." u/tutoredstatue95: "I spent more time dealing with poor orchestration than just using stock Claude with maybe a few sub agent spawns for very large tasks."
- **Cheap-model error rates.** u/N0xF0rt: "The cheap model still makes more mistakes, even if you give it an advisor. Essentially you are paying more for the same work - because quality is lower and time to do it is higher".
- **No measurement.** u/bestosim: "Evals or just Trust me bro? Personally any pipeline that i tried or build is worst than sonnet5.5med + /code-review Opus5.5 med token-wise, performance-wise." u/sseses asks whether it was "meaningfully measured ... against the big tools as a baseline". Neither got a number.
- **The Trello-board pattern.** u/okaygoatt: "I had the whole agent orchestration thing, with sub agents talking to each other, and the amount of rework and mistakes was insane. Now, I use a Trello board of tasks with opus 5.5 to choose the next task, assess and edit if needed, and spawn sub agents on a single task." And on why a board rather than files: "two bots writing in the same file meant things overwrote. Trello allows comments on the card so every input is added after the last".
- **Direction of delegation.** u/Standard_Eye686: "Shouldn't it be the other way around? The best doing the work, and the rest delegating?"

The Trello pattern is close to what this estate already has: a board as task truth, one strong model picking the next task, single-task subagents. The difference is that okaygoatt's strong model spawns a worker per task, where this estate keeps 23 to 29 long-lived lanes alive.

**Outside the thread**, the Hacker News discussion of a routing product (216 points, 2026-06-26) turns on the same point. `stpedgwdgfhgdd`: "with these routers ... you will have more cache misses ... using the cache is crucial." The author's reply: "If you statelessly route each new request: yes it does end up being more expensive! So our routing is cache-aware", with a self-reported "we've saved 40% ourselves". `port11` describes the alternative: "Artefact-based workflows solve this problem ... I hand the plan over to [a cheaper model] ... with 99.9% cache hits on a long session."

## Options compared

| Option | What it changes | Evidence here | Verdict |
|---|---|---|---|
| A. Per-turn tier router (Jev plugins, the HN product) | Which model answers each turn in one session | Cache is per model; the router's own log shows a $4.41 vs $0.13 refusal; vendor self-reports 40% | **SKIP.** Aims at the 11 to 15% of our spend that is output and risks the 85 to 89% that is cache |
| B. Tier at the spawn boundary (subagents, per-PR evaluator, Codex for mechanical code) | Which model a fresh, small context starts on | Tiers are configured; 1.6 to 6.9% of spend uses them | **USE.** No cache penalty, small contexts |
| C. Shorter sessions and no idle wake-ups | Context size and rewrites | Rewrites were 19% and 34% of the day; 39% and 68% of messages over 200k | **USE first.** Largest measured saving, no quality risk |
| D. Coordination lanes on Sonnet 5.5 with an Opus advisor | Rate paid on half the spend | Up to 23 to 25% of the day, quality unmeasured | **TRIAL** on one lane with a catch-rate comparison |
| E. Fewer lanes | Sessions held open | 8.8% and 17.2% of spend in repos with nothing merged; coordination share unchanged between 29 and 23 lanes | **USE** for lanes with no merge in a day; do not expect it to shrink coordination |

## What this does not show

- **Quality.** No measurement here says a Sonnet evaluator catches what an Opus one does. Decision 6 is a trial for that reason.
- **The cap.** Anthropic's docs say subscription limits are "shared across all models". How the weekly cap weights Opus against Sonnet tokens is not in any page fetched, so "X% fewer dollars" is not proven to be "X% less of the cap".
- **Cause of the 13 Oct rise.** Per-PR cost rose from $8.26 to $13.25. Rewrites nearly doubled, median context rose 60%, and the day is partial. Which of those drove it was not separated.
- **`.claude/rules/agent-spend.md` says "a turn is a dollar"**, measured 2026-08-10 with the same rate table found stale here. At current prices an API message averaged $0.08 on 12 Oct and $0.14 on 13 Oct. A message is not a turn, so this does not refute the rule; it means the rule's dollar figure needs re-measuring.

## Also See

- [agents/2353-model-tiering-and-escalation](../../agents/2353-model-tiering-and-escalation/) - "the lanes were never the expensive part", 2026-08-20; this doc re-measures it and finds the same shape at a quarter of the dollar figure
- [agents/2188-cheap-fleet-premium-escalation](../../agents/2188-cheap-fleet-premium-escalation/) - the tiered build team (orchestrator on Opus, builder on Sonnet, formatter on Haiku, evaluator default-fail)
- [agents/2217-frontier-model-routing-decision](../../agents/2217-frontier-model-routing-decision/) and [business/2208-ai-cost-agentic-infra](../../business/2208-ai-cost-agentic-infra/)
- [dev-workflows/2664-claude-working-style-ported-to-codex](../2664-claude-working-style-ported-to-codex/) - the guards now run under Codex, which is what makes "mechanical code to Codex" safe
- Rules: `.claude/rules/claude-usage.md`, `.claude/rules/agent-spend.md`, `.claude/rules/code-over-inference.md`, `.claude/rules/session-boundaries.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix `zao-spend`: price by model id at current rates (Opus 5.5 4/20/5/8/0.20, Sonnet 5.5 2/10/2.5/4/0.10, Haiku 5.5 tiered), count MERGED PRs, and derive the repo list from lane working directories. SHIPPED = a merged zaal-dotfiles PR whose test reprices a fixed transcript | Claude Code lane | PR | 2026-10-16 |
| Evaluator runs as one fresh session per PR. SHIPPED = the evaluate skill starts a new session for each PR and a week of `zao-spend` shows the evaluator lane under 15% of spend | @Zaal to approve, lane to build | PR | 2026-10-20 |
| Close-not-wake: a lane idle over an hour with more than 200k context gets a handoff and a fresh session. SHIPPED = full-context rewrites under 10% of a day's spend on the fixed meter | Seat | Rule + check | 2026-10-20 |
| Trial one coordination lane on Sonnet 5.5 with an Opus advisor for 3 days; compare its `NEEDS_WORK` catches on the same PRs against the Opus evaluator. **Stop condition:** it misses a defect the Opus run caught. SHIPPED = a result table appended here | @Zaal | Trial | 2026-10-24 |
| Re-measure "a turn is a dollar" in `.claude/rules/agent-spend.md` on the fixed meter. SHIPPED = a rule PR with the new figure and its date | Claude Code lane | PR | 2026-10-24 |
| Re-run this doc's three scripts after a full week. **Invalidation condition:** cache share under 60% or coordination share under 35% changes decisions 3 and 6. SHIPPED = a dated delta here | lane | Re-research | 2026-10-27 |

## Method

- **Spend.** Three scripts read every `~/.claude/projects/**/*.jsonl` touched since 2026-10-12 00:00 ET (130 files), keep the last usage record per API message id (the same de-duplication `zao-spend` uses), and bucket by Eastern-time day, working directory and model. Prices by model id from Anthropic's pricing page; Haiku 5.5 priced by prompt length. 1-hour and 5-minute cache writes are read from `usage.cache_creation`.
- **Model ids.** 5,256 messages on `claude-opus-5-5`, 1,081 on `claude-sonnet-5-5`, 385 on `claude-haiku-5-5` over the two days.
- **Merged PRs.** `gh api repos/<repo>/pulls?state=closed`, two pages of 100 per repo, for the 14 repos the lanes' working directories resolve to, filtered on `merged_at` inside each Eastern-time day. Ten of the 14 had a merge on one of the two days. Bot merges count.
- **Coordination lanes** are the working directories named orchestrator2, evaluator, merge, grill and seat-finance. Everything else is a shipping lane.
- **A full-context rewrite** is an Opus message with context over 100k tokens where more than half the context was written to the cache.
- **Evaluator verdict counts** are GitHub issue search for the words `NEEDS_WORK` and `PASS` in comments on PRs updated since 2026-10-12, for both owner accounts. The search matches the word anywhere in a comment and a PR can carry both, so the counts are a rough signal, not a defect count.
- **Not measured:** time spent, weekly-cap percentage (reported by the seat, not read by this lane), Codex or other non-Claude spend.

## Sources

- [Reddit: "Running AI models as a team saves a fortune worth of tokens"](https://www.reddit.com/r/ClaudeUniversity/comments/1x3abfq/running_ai_models_as_a_team_saves_a_fortune_worth/) - **[FULL, method: `zao-fetch-reddit.sh` via Arctic Shift for the text and 37 comments (the post reports 11); the video fetched from `v.redd.it` (1.29 MB, 19 s) and 6 frames read with ffmpeg]**. Six of 19 seconds were sampled, so a frame between samples could differ.
- [TypeSafe AI: Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) - **[FULL, method: curl + HTML strip, 13,728 bytes of text]**
- [Flam1ngFir3ball/jev-claude-router](https://github.com/Flam1ngFir3ball/jev-claude-router) README and LICENSE - **[FULL, method: `gh api` contents; LICENSE file read: MIT, Copyright (c) 2026 Satvik Sinha]**
- [yibie/awesome-jev](https://github.com/yibie/awesome-jev) README - **[PARTIAL - first 45 lines of 25,995 words read, enough to identify Jev; no LICENSE file returned at the repo root]**
- [Anthropic: Pricing](https://platform.claude.com/docs/en/about-claude/pricing) and [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) - **[FULL for the price table and the long-context section, method: curl of the raw markdown]**
- [Claude Code: Manage costs](https://code.claude.com/docs/en/costs), [Subagents](https://code.claude.com/docs/en/sub-agents), [Advisor tool](https://code.claude.com/docs/en/advisor) - **[PARTIAL - the sections on limits, model choice, subagent `model` and advisor pairings and cost were read by line range, not the whole pages; method: curl of the raw markdown]**
- [Hacker News: Show HN: Smart model routing directly in Claude, Codex and Cursor](https://news.ycombinator.com/item?id=48688700) - **[FULL for the 25 comments matching cache, cost or eval terms, method: keyless Algolia items API]**
- Estate transcripts, `zao-spend` source (`bin/zao-spend` in zaal-dotfiles, 338 lines), `~/.claude/settings.json` model keys, `.claude/agents/*.md` model lines - **[FULL, method: local read]**
- `agents/2353-model-tiering-and-escalation`, `agents/2188-cheap-fleet-premium-escalation`, `dev-workflows/2664-claude-working-style-ported-to-codex` - **[PARTIAL - frontmatter and Key Decisions read from origin/main]**

Credit: the Jev router is by Satvik Sinha and its fork authors (MIT); the animation carries an @alfa123gg watermark; quoted commenters are named by their public handles.
