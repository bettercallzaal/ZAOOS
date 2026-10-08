---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "agents/2586-orchestrator-seat-outside-view, agents/2630-three-active-projects-wip-outside-view, agents/2444-always-on-orchestrator"
original-query: "Can we deep research this ... Just our agentic organization"
tier: DEEP
---

# 2636 - The agentic organization, one day measured: what it produced, where it broke, and five changes for tomorrow

## Summary for Zaal (ten lines)

1. On 2026-10-07 your estate opened 48 pull requests and merged 53, and closed none unmerged.
2. Cross-checking worked. At least seven times a reviewer that did not write the code found a real defect, before it merged.
3. Most of the friction was not the work. It was the plumbing: four reads refused by permission settings, a merge refused, and three tools that misbehaved.
4. Two lanes both reported making the same merge. One of them was wrong, and only the double report caught it.
5. The usage limit stopped the lanes at about 14:45, and you said at 15:55 that your "cogirtive load is going crazy".
6. Anthropic's own numbers: teams of agents use about 15 times the tokens of a chat, and coding splits up less well than research.
7. Claude Code's guidance for its own agent teams is 3 to 5 workers, with cost rising in step with each one.
8. Your shape (one seat you talk to, side terminals, three active projects, a queue, five gates) matches what others build. Gas Town even has a separate merge role.
9. The research on AI judges is mixed: they agree with people about 80 percent of the time, and they favour their own writing.
10. Five changes for tomorrow are at the end: fix the refused reads, one merger, cheaper reviews, a quieter heartbeat, and three asks a morning.

> **Goal:** Describe how Zaal's estate of Claude lanes worked as an organization on one full day, measured from the record, then compare it with how others organize many agents for one person, and propose the five changes most likely to cut his load and the usage spend tomorrow. Builds on [doc 2586](../2586-orchestrator-seat-outside-view/) (the seat, and his time answering agents) and [doc 2630](../2630-three-active-projects-wip-outside-view/) (work-in-progress caps, side versus active). It does not repeat them.

## Part 1. The day, measured

Sources: zao-vault origin/main at 2026-10-07 21:12 EDT (`decisions/grill-2026-10-07-seat-morning.md` items 1 to 44, `handoffs/status/orchestration.md`, `notes/orca-terminals-latest.md` stamped 20:53, `notes/orchestrator-improvements-2026-10-06.md` items 13 to 16), GitHub search, and PR comments.

### Output

| Measure | Value | How measured |
|---|---|---|
| PRs opened | **48** under `bettercallzaal`, 1 under `ZAODEVZ` | `gh api search/issues -f q="user:<owner> is:pr created:2026-10-07"` (UTC day) |
| PRs merged | **53** under `bettercallzaal`, 0 under `ZAODEVZ` | same, `merged:2026-10-07` |
| PRs closed without merging | **0** | same, `is:closed is:unmerged closed:2026-10-07` |
| PRs open at 15:55 EDT | 58 in total, 42 in his two accounts, 30 of them opened that day, 10 older than 7 days | the seat's own measurement, item 30 |
| Where the opened PRs went | ZAOOS 18, zaal-dotfiles 11, poidhz 4, north-creek 3, zao-vault 3, and 9 others | `gh search prs --created` grouped by repo |
| Terminals at 20:53 EDT | 20 listed: 7 side, 3 active, 2 NEXT, 3 LATER, 5 opened by Zaal himself | `notes/orca-terminals-latest.md` |

A measurement trap hit on the way. `gh search prs --merged 2026-10-07` returned **183** merges, against 48 created. Its results' merge dates ran from May to October: the flag did not filter. The explicit query string gave 53. A near-universal result from a new instrument was the instrument (`state-claims.md`).

### Reviews that caught a real defect

Every one of these was found by a lane that did not write the change, before merge. Each verdict is a comment on the PR.

| PR | What the reviewer found |
|---|---|
| ZAOOS #3693 (doc 2577) | The doc stated as fact what doc 2576 had measured to be false (a "use it" where the measured answer was "do not pay anyone through Quidli") |
| ZAOOS #3781 | With the flag on, a new check ran before the login and usage-limit checks and would have turned a model failover into a plain error |
| ZAOOS #3782 | A timeout after a live Farcaster cast would have told Zaal "Not published" and handed him the text to paste again: a duplicate public post. A second round found the "check before reposting" line named the wrong X account |
| zaal-dotfiles #443 | The commit's base came from a shared `FETCH_HEAD`; another lane's fetch could have put unreviewed branch work onto vault main. Later shown end to end by the lane's own test |
| zaal-dotfiles #447 | A gap in a gate (dreamnet review, "CLEAN, with one gap in the gate worth closing"); closed in a second commit |
| zaal-dotfiles #449 | A consequence to know before merge (back-off logic that does nothing on Linux, per the orchestrator's summary) |
| bcz-yapz #32 | "NEEDS ONE FIX, then clean" (a misdated video, per the orchestrator's summary) |

Each defect was fixed on the same branch and re-reviewed at the new head. None reached main.

### Friction: what slowed the day that was not the work

| Event | Count | Source |
|---|---|---|
| Reads or review steps refused by a pane's permission layer | 4 in three panes (dreamnet twice, dotfiles once, postiz once) | improvements item 15, "Four refusals of reads or review steps in one day" |
| A merge refused by a classifier ("Merge Without Review") | 1, at 08:37 | grill item 8a |
| A server read refused ("Production Reads") | 1 | grill item 43 |
| Account usage limit | panes stopped at about 14:44 to 14:47, reset 17:10 | `orchestration.md`, read from five panes |
| Two lanes reported the same merge | 1 (north-creek #3) | improvements item 16 |
| Tool defects found by running them | 3: the review dispatcher sent reviews to the merge pane; the inherit guard misread review pins; the GitHub merge call reports success on an already-merged PR | improvements items 14, 15, 16 |

The pattern behind the first three rows is one shape: a lane is told to verify, and its own settings will not let it read. Each refusal turned into a re-route, a question to Zaal, or a review that shipped with one check marked open.

The merge-call defect is the most dangerous of the tools: the lane "reported a merge it did not make; the seat caught it because two lanes claimed the same merge" (item 16). Nothing in the tool would have caught it.

### Load on Zaal

At 15:55 EDT, on the bus home: "walk me through our next steps one by one we are doing too much and my cogirtive load is going crazy" (item 28). Then: "im only going to talk in this terminal and i want you to interact with all the rest" (item 29). By 20:53 the seat's waiting-on-Zaal list held **11 items** (Z1 to Z11), several with sub-items.

## Part 2. How others organize many agents for one person

### Anthropic's multi-agent research system (fetched raw)

- "a multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval."
- "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats."
- "token usage by itself explains 80% of the variance" on BrowseComp.
- "most coding tasks involve fewer truly parallelizable tasks than research".
- Early failures: "spawning 50 subagents for simple queries ... and distracting each other with excessive updates". Fix: scaling rules in the prompt, "Simple fact-finding requires just 1 agent with 3-10 tool calls".
- "Synchronous execution creates bottlenecks ... the entire system can be blocked while waiting for a single subagent to finish".

Note the mix: a stronger model leads, a cheaper model does the parallel work.

### Anthropic, "Building effective agents" (fetched raw)

- "we recommend finding the simplest solution possible, and only increasing complexity when needed. This might mean not building agentic systems at all."
- Orchestrator-workers: "a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results".
- Evaluator-optimizer: "one LLM call generates a response while another provides evaluation and feedback in a loop", "particularly effective when we have clear evaluation criteria". This is the author-and-reviewer pair the estate runs.

### Claude Code's own guidance (fetched raw)

- Agent teams: "Start with 3-5 teammates for most workflows." "Token costs scale linearly: each teammate has its own context window and consumes tokens independently." "Having 5-6 tasks per teammate keeps everyone productive."
- Subagents: "Control costs by routing tasks to faster, lower-cost models like Haiku". Built-in research agents run with "read-only tools; Write and Edit are denied". A documented example reviewer is "read-only and ... use[s] Sonnet".
- Costs: "the average cost is around $13 per developer per active day ... with costs remaining below $30 per active day for 90% of users" (enterprise deployments). The estate's own meter put one 24-hour window at $1,838 on 2026-08-10 (`agent-spend.md`), so it runs at a different order of magnitude from the average user.

### A published setup with separate merge and review roles: Gas Town (fetched raw)

- "The Mayor ... Your primary AI coordinator ... just tell the Mayor what you want to accomplish." That is the seat.
- "Refinery: Per-rig merge queue processor ... batches merge requests, runs verification gates, and merges to main using a Bors-style bisecting queue. Failed MRs are isolated and either fixed inline or re-dispatched." That is the merge terminal.
- "Witness - Per-rig lifecycle manager. Monitors polecats, detects stuck agents, triggers recovery".
- "Scheduler: Config-driven capacity governor ... Prevents API rate limit exhaustion by batching dispatch under configurable concurrency limits." ZAO has no equivalent: the limit at 14:45 was hit, not managed.

Doc 2586 records Gas Town's caveats (its author calls it largely in maintenance mode; 502 open issues). Cited here for its role design, not as a recommendation to install it.

### Evidence on AI reviewing AI (fetched raw, arXiv abstracts)

- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (2023): strong judges "can match both controlled and crowdsourced human preferences well, achieving over 80% agreement, the same level of agreement between humans", while naming "position, verbosity, and self-enhancement biases".
- Panickssery et al., "LLM Evaluators Recognize and Favor Their Own Generations" (2024): "an LLM evaluator scores its own outputs higher than others' while human annotators consider them of equal quality", with "a linear correlation between self-recognition capability and the strength of self-preference bias".

Neither measures code review. They are about judging text. What they support: a reviewer should not be the author, which is the estate's rule already. A same-model reviewer from another lane is a weaker version of independence than a different model would be. A search for measured error rates of AI code review specifically was rate-limited (HTTP 429) and is not covered.

## Part 3. His shape against what others do

| His shape | What others report | Verdict |
|---|---|---|
| One seat he talks to, which routes and does not build | Anthropic's lead agent; Gas Town's Mayor; doc 2586 | Matches |
| Side terminals for merge, review and skills | Gas Town's Refinery (merge) and Witness (health); Anthropic's evaluator-optimizer | Matches, and the review side earned its place: seven caught defects in one day |
| Three active projects plus a queue | Claude Code: 3 to 5 teammates; doc 2630 | Matches |
| Five gates for him (money, public, irreversible, his fact, settings) | Not found in the sources as a list; Anthropic and Claude Code both keep a human on approval | His own, and sound |
| A capacity governor | Gas Town's Scheduler batches dispatch under a concurrency limit | **Missing.** The usage limit was hit at 14:45 with no plan for it |
| Model mix | Anthropic: Opus leads, Sonnet works; Claude Code: route to Haiku or Sonnet to control cost | **Not used.** Several lanes ran on the same top model all day, and the merge terminal was switched to Opus 5.5 to get past the limit |
| Lanes can read what they must check | Claude Code's built-in research and review agents are read-only by design, so reads are their whole job | **Broken today**: four review reads refused |

## Five changes for tomorrow (each reversible)

| # | Change | What changes tomorrow morning | How he would know it worked |
|---|---|---|---|
| 1 | **Let review lanes read.** Open the read-only allow-rules PR the context lane already proposed (`gh pr view`, `gh pr diff`, `git show`, `git diff`, `git log`; grill item 15, waiting on his line as Z8) | One line from him in the skills pane; the PR is reviewed and merged like any other | Zero "denied" read refusals in tomorrow's record, against four today |
| 2 | **One merger, and read before merging.** Only the merge terminal calls merge. Every merge reads the PR state first and treats a success whose merge commit predates the call as "already merged" (improvements item 16) | A line in each lane's brief; a small fix in `zao-merge` as a PR | No two lanes report the same merge; every "merged" in a report matches GitHub's merge time |
| 3 | **Cheaper models for mechanical work, Opus for the seat.** Research and review lanes run their file reads and test runs in a subagent set to Sonnet or Haiku; the lane's own model writes the verdict | The model setting is his to change (settings are a gate); proposed as one Grill item | The usage limit is not hit before 17:00, and `zao-spend` shows lower cost per merged PR than today |
| 4 | **A quiet heartbeat.** The seat's hourly heartbeat runs only when the queue has an item a lane can take; two ticks with nothing new means stop until he types (`agent-spend.md`, "two consecutive no-change ticks means stop, not lengthen") | The seat changes its own loop, no tool | Overnight, the number of seat turns with no queue change drops to near zero |
| 5 | **Three asks a morning.** The waiting-on-Zaal list keeps at most three items on top, each a single tap or one line; the rest stay below with a default and a date (doc 2630's cap, applied to his asks) | The 20:53 list of 11 is cut to three for 08:00, the rest relabelled "later, with default" | He clears the top three before noon, and nobody asks him about the rest |

Not on the list: adding more lanes or a new tool. The measured day says the estate's output is not the limit. Its plumbing and his attention are.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Change 1: one line in the skills pane to open the read-only allow-rules PR | Zaal | Settings PR | 2026-10-08 morning |
| Change 2: the read-before-merge rule in lane briefs, and the `zao-merge` fix as a PR | orchestrator seat, then the skills lane | Brief edit, then PR | 2026-10-08 |
| Change 3: ask him once which lanes may run their mechanical steps on Sonnet or Haiku | orchestrator seat to Grill | Decision | 2026-10-08 |
| Changes 4 and 5: the seat's own loop and the morning list | orchestrator seat | Habit | 2026-10-08 08:00 |
| Re-measure in seven days: PRs, defects caught, refusals, limit time, his "load" lines | a research lane | Doc re-validation | 2026-10-14 |

## Sources

Fetched 2026-10-07. Quotes come from raw text.

1. Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) [FULL, curl with a browser User-Agent, HTML stripped]
2. Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) [FULL, same method]
3. Claude Code docs, [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams.md) [FULL, raw markdown]
4. Claude Code docs, [Create custom subagents](https://code.claude.com/docs/en/sub-agents.md) [PARTIAL: read by keyword (model, cost, read-only, reviewer)]
5. Claude Code docs, [Manage costs](https://code.claude.com/docs/en/costs.md) [PARTIAL: read by keyword]
6. Gas Town, [README](https://raw.githubusercontent.com/steveyegge/gastown/main/README.md) (Steve Yegge, MIT per doc 2586) [FULL for the role sections, raw markdown]
7. Panickssery et al., [LLM Evaluators Recognize and Favor Their Own Generations](https://arxiv.org/abs/2404.13076), 2024 [FULL abstract, arXiv API]
8. Zheng et al., [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685), 2023 [FULL abstract, arXiv API]
9. arXiv search for measured AI code-review error rates [FAILED: first attempt returned a 301 with no body, the retry returned HTTP 429; not retried further]
10. GitHub search API counts and `gh search prs` repo breakdowns, 2026-10-07 [FULL; the `--merged` flag result was discarded as broken, see Part 1]
11. PR comments on zaal-dotfiles #447, #449 and bcz-yapz #32, read with `gh api` [FULL for the verdict lines]
12. zao-vault origin/main at 2026-10-07 21:12 EDT: `decisions/grill-2026-10-07-seat-morning.md`, `handoffs/status/orchestration.md`, `notes/orca-terminals-latest.md`, `notes/orchestrator-improvements-2026-10-06.md` [FULL for the items cited]

The #3693, #3781, #3782 and #443 findings are this lane's own reviews and the dreamnet lane's #3693 verdict (PR comments). The #449 and #32 details ("dead back-off on Linux", "misdated video") are as summarised by the orchestrator; their verdict lines were read, their bodies were not.

Not covered: measured error rates for AI code review, Codex or other vendors' multi-agent guidance, and the estate's own `zao-spend` figures for 2026-10-07 (not run, to save turns).
