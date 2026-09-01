---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-01
superseded-by:
related-docs: "2444, 2434, 2198, 2178, 2127, 2319, 2324, 928, 2349"
original-query: "/zao-research the best practices for building an orchestrator and lets build this into the next claude code session."
tier: DEEP
---

# 2456 - Orchestrator practice, measured against our own run: the estate is right about supervision and wrong about where its own state lives

> **Goal:** Test the seven measured findings of ZAO's 2026-08-31/09-01 orchestration run against a decade of outside practice, answer the five open questions in the `orcresearch` brief, and name the concrete divergences. Every recommendation is grounded in that run, not in generic advice.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **Fix `zao-lanes` first: it reported one lane's health on another lane's row today, with exit code 0.** `classify()` calls `tmux capture-pane -t <name>` for lanes that came from `claude agents --json` and have no tmux session. tmux **prefix-matches**, so `-t orc` resolved to the `orcresearch` pane. Measured with controls: `orc` and `orcresearch` captures were byte-identical (`diff -q` equal), `-t zaostock` returned rc=1 "can't find pane". Use exact-match targets (`-t "=name"`) and render a native-only lane as NO-PANE, never as a state. | `~/zaal-dotfiles/bin/zao-lanes:150`. 5 agents in the registry, 3 tmux sessions. The board showed `orc WORKING ctx 23%` for a session the brief says was at 81%. | A |
| 2 | **The orchestrator's context problem is not solved by handoff or compaction. It is solved by never holding the messy work.** Hightouch's "dynamic subagents": the main thread offloads any multi-step subtask to an isolated thread and gets back only the answer. Their words: compaction approaches "patch up the symptoms without addressing the root cause: you're cleaning up after the fact." orc hit 81% because it did lane work itself, not because 10 hours is too long. | Amplify/Hightouch (FULL); Anthropic multi-agent (FULL): "spawn fresh subagents with clean contexts while maintaining continuity through careful handoffs" | A |
| 3 | **ADOPT the initializer/worker split. ZAO has the worker prompt and no initializer.** Anthropic runs "a different prompt for the very first context window" that builds the environment - `init.sh`, a progress file, a first commit, and a **JSON** feature list - because later agents "look around, see that progress had been made, and declare the job done." ZAO's briefs are hand-written per lane by whoever had context, which is why finding 7 (stale premise in the brief) is the dominant delegation failure. | Anthropic, *Effective harnesses for long-running agents*, 2025-11-26 (FULL) | A |
| 4 | **Keep the completion state in JSON, not prose.** Anthropic tested both: "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." ZAO's 73 briefs are markdown, median 95 lines, max 766, 14 over the 200-line soft cap. Keep the prose brief for the *why*; move the checklist a lane marks done into a JSON the lane may only flip a boolean in. | Measured `~/zao-vault/handoffs/*.md`, n=73, mean 136 lines | A |
| 5 | **The estate's supervision rules are ahead of the published literature - keep them, do not replace them with a framework.** Anthropic names as an open limitation exactly what ZAO's playbook already does: "the lead agent can't steer subagents, subagents can't coordinate." ZAO has `SendMessage` and playbook rule 2 (message the lane directly, tell Zaal after). Do not migrate to LangGraph/CrewAI to acquire something we already have. | Anthropic multi-agent (FULL) vs `~/zao-vault/notes/lane-supervision-playbook.md` | A |
| 6 | **Consolidate the two playbooks. There are two, in two stores, six days apart, and neither cites the other.** `zorca/PLAYBOOK.md` (2026-08-25, repo, public, MIT) and `~/zao-vault/notes/lane-supervision-playbook.md` (2026-08-31, vault). This is the doc-478/606 contradiction shape recurring inside orchestration itself. The vault note is newer and Zaal-set; fold it into `PLAYBOOK.md` and leave a pointer. | Both files read 2026-09-01; `grep` of each for the other's name returns nothing | A |
| 7 | **Silence-as-health is a solved problem with a name: the dead-man's switch, and SRE's rule is that a page must be actionable.** Google SRE: "Every page should be actionable... If a page merely merits a robotic response, it shouldn't be a page." Finding 1 (six silent successes in one night) is the *absence* half; finding 3 (six false alarms to three real fixes) is the *presence* half. They are one problem - precision and recall on the same alert - and SRE measures it with four parameters, not one. | `sre.google/sre-book/monitoring-distributed-systems/` (FULL), `sre.google/workbook/alerting-on-slos/` (FULL) | A |
| 8 | **Some lanes should be cron. The test is whether the work needs fresh judgment, and the literature agrees from two directions.** Anthropic: "most coding tasks involve fewer truly parallelizable tasks than research"; multi-agent systems burn ~15x the tokens of a chat and need a task valuable enough to pay for it. HN's `threecheese` on the same harness post: it is "curving back around to Workflows, after leaving them behind for agency." | Anthropic multi-agent (FULL); HN 46081704 (FULL); `.claude/rules/code-over-inference.md` | A |
| 9 | **The lane tooling has no single home. Four repos hold it, and the one named "the ZAO orchestration layer" holds none of the tools run daily.** See "Where the lanes actually live". Decide the home before adding more tools; do not split a fifth way. | Measured across `~/Documents/zorca`, `~/zaal-dotfiles/bin` (101 scripts), `~/zao-status/bin` (10), `bettercallzaal/hermes-orchestrator` | B |

---

## Zaal's question: is there a repo for the ZAO lanes?

Asked mid-session on 2026-09-01: *"see if theres a repo for that and then we can open that repo and dive in more to improving that with our orchestration."*

**Yes - four of them, and that is the problem.**

| Repo | Visibility / licence | Size | What it actually holds | Runs daily? |
|---|---|---|---|---|
| [`bettercallzaal/zorca`](https://github.com/bettercallzaal/zorca) - "The ZAO orchestration layer for Orca" | public, **MIT** (read from `LICENSE`, not the API field) | 30 files, **8,003 LOC** | `orca-board` (ranked pane board + `--auto` watcher + 6 safety rails), `repo-cleanup`, `PLAYBOOK.md`, `docs/DESIGN-bridge.md` (marked "Proposed, not built") | Only if Orca is the surface |
| `bettercallzaal/zaal-dotfiles` (`~/bin` is a symlink into it) | private | **101** scripts in `bin/` | **every lane tool actually used**: `zj`, `zao-lanes`, `zao-tick`, `lane-send`, `zao-lane-boot`, `zao-lane-watch`, `zao-spend`, `zao-assert`, `lane-relay-daemon` | yes |
| `bettercallzaal/zao-status` | private | 10 scripts | `zao-brief`, `zao-lane-health`, `zao-doc-freshness` (both symlinked into `~/bin`) | yes |
| [`bettercallzaal/hermes-orchestrator`](https://github.com/bettercallzaal/hermes-orchestrator) - "Supervisor framework for AI agents - classify, spawn, watch, intervene, learn" | public, 75KB, 1 star, pushed 2026-08-31 | - | the generalised supervisor pattern | not cloned on this Mac |

Measured: none of `zj`, `zao-lanes`, `zao-tick`, `lane-send`, `zao-lane-boot`, `zao-spend` exists in `zorca/bin`. The repo that carries the name carries a different subset.

**`zao-wall` does not resolve** in `~/zaal-dotfiles/bin`, `~/zao-status/bin`, or `zorca/bin`, though `.claude/rules/code-over-inference.md` cites it as one of seven free tools totalling 2,019 lines. Bound stated: that is three directories, not a whole-disk search - so this is "not found in the three places lane tools live", not "does not exist".

**The improvement target is `zorca`,** because it is public, MIT, already documents its conventions, and already carries the safety rails. The move is: fold the vault playbook in (decision 6), move the lane tools out of dotfiles into it (decision 9), and fix `zao-lanes` (decision 1) on the way.

---

## The live finding: the board lied today, and it lied the way the estate's own rules predict

`zao-lanes` builds its row list from two sources and says so in a comment at `~/zaal-dotfiles/bin/zao-lanes`:

> "Neither source is authoritative alone... Reading one is how a monitor reports health it cannot see."

Then `classify(name)` runs `tmux capture-pane -p -t <name>` for **every** row, including rows that came only from `claude agents --json` and have no tmux session at all.

Measured on 2026-09-01 10:45 EDT:

| Check | Result |
|---|---|
| tmux sessions | 3: `obsidian`, `orcresearch`, `zaofractal` |
| `claude agents --json` | 5: `zaostock`, `orc`, `zaofractal`, `obsidian`, `orcresearch` |
| `tmux capture-pane -t orc` | **rc=0**, output **byte-identical** to `-t orcresearch` (`diff -q` reports equal) |
| `tmux capture-pane -t zaostock` | rc=1, `can't find pane: zaostock` |
| What the board printed | `WORKING orc ctx 23% 13h ago orcresearch` |

tmux resolves an unknown target by prefix. `orc` is a prefix of `orcresearch`. So the top orchestrator's row was rendering **this session's** screen - and the "13h ago" activity stamp beside it came from the registry, so the row mixed one lane's timestamp with another lane's context percentage.

Three lanes reading `ctx 23%` simultaneously is the tell, and it was visible on screen before anything was measured.

**Why this is the doc's centre of gravity.** This is the same failure as the 2026-08-29 incident recorded in `~/.zao/orchestrators.json`, where an audit "treated 'no Orca pane' as 'orphan' and killed the ZAOstock orchestrator mid-event". Both are an instrument reasoning about a lane it cannot see. The registry file was written to stop the *consequence*; the *mechanism* survived in a second tool and is still live.

It is also finding 2 stated mechanically: a check whose failure condition is "the capture command errors" passes when the capture succeeds against the wrong subject.

**The fix, precise:**

1. `classify()` must target `-t "=" + name` - tmux's exact-match prefix - so a missing session returns rc=1 instead of a neighbour's screen.
2. A row with no pane renders `NO-PANE`, a distinct state, never `WORKING`/`IDLE`/`UNREADABLE`.
3. Add the positive control to the tool's own selftest: assert that an invented lane name returns NO-PANE. Per the estate's one rule - *a negative result is not a finding until the search has been shown capable of returning a positive* - and its mirror here, a state must be shown capable of returning NO-PANE.

Not applied by this lane: it is another repo and PR-only binds (`agent-loops.md` rule 35). Flagged to `orc`.

---

## The five questions in the brief, answered

### 1. Context exhaustion - what does practice actually do?

Four distinct positions found, and they are not variants of each other.

| Position | Source | Mechanism | Verdict for ZAO |
|---|---|---|---|
| **Bridge it** - progress file + git log + feature list, read at session start | Anthropic, *Effective harnesses*, 2025-11-26 (FULL) | "an initializer agent that sets up the environment on the first run, and a coding agent tasked with making incremental progress in every session, while leaving clear artifacts for the next" | **ZAO does the second half only.** Adopt the initializer. |
| **Never fill it** - offload every multi-step subtask to an isolated thread, keep only the answer | Hightouch via Amplify (FULL) | `write_file`/`read_file` buffering plus "dynamic subagents"; "maintain context density without losing any fidelity" | **The direct answer to orc at 81%.** Highest-value adoption. |
| **Spawn a successor** - fresh subagent with a clean context, continuity through handoff; retrieve the plan from memory | Anthropic multi-agent (FULL) | plan saved to Memory because ">200,000 tokens... will be truncated" | Already ZAO's `handoff-discipline.md`. Keep. |
| **Throw it away** - do not bridge at all | HN 46081704, `mips_avatar` (FULL) | "If the piece didn't work out by the time you hit 200k context on Claude you are going to start over. Take whatever wins you learned from the first stab... but throw the code out." | Genuine dissent. Applies to *code*, not to a research or coordination lane whose output is the artifact. |

The **contradiction is real and worth stating**: Anthropic's whole post is about bridging context windows; a practitioner in its own comment thread says the bridge is a mistake and restarting is cheaper. Both are evidence. The reconciliation that survives our data: bridge *state* (decisions, obligations, what was measured), restart *reasoning*. That is what a vault handoff already is, and what a 766-line brief has stopped being.

Also measured, on the compaction option specifically - HN `zacwellmer`: "compaction essentially borks our sessions. Good luck keeping your skills and prompts intact with a system wide compaction operation."

### 2. Supervision topology

Anthropic's Research system is orchestrator-worker and they name its limits precisely:

> "our lead agents execute subagents synchronously... the lead agent can't steer subagents, subagents can't coordinate, and the entire system can be blocked while waiting for a single subagent."

**ZAO is ahead of this**, and by accident of running terminals rather than API calls: `SendMessage`/`lane-send` make lanes addressable while running, which is what playbook rule 2 (intervene mid-action, tell Zaal after) depends on. The published constraint is not ours.

What outside practice adds that we lack:

- **Effort scaling in the delegation itself.** "Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons might need 2-4 subagents with 10-15 calls each, complex research might use more than 10." ZAO briefs carry a task and no effort budget. Early Anthropic agents "spawn[ed] 50 subagents for simple queries."
- **The excessive-update failure, named.** Early agents were "distracting each other with excessive updates." That is playbook rule 1 (relay only what changes the principal's next action, ~5 messages instead of 20) arrived at independently, which is worth knowing because it means the rule is not a ZAO idiosyncrasy.
- **Artifacts over telephone.** "Subagent output to a filesystem to minimize the 'game of telephone'... pass lightweight references back to the coordinator." Identical to `handoff-discipline.md` rule 7 (a message is transport, never the record). Keep.

**Dissent on a supervisor that is itself an agent**, HN `daxfohl` (FULL): a dedicated QA agent "doesn't work... rather than converging on a solution, they just get all out of whack. The only way I could see the QA agent idea working now is if it had the power to roll back the entire change, reset the dev agent... and trigger the dev process from scratch." Note that ZAO's `zao-evaluator` is exactly the version he concedes works - no write tools, default-FAIL, verdict only. Our design already answers his objection; `loop-evals.md` should say so.

Measured against finding 4 (neither party wins by rank): nothing in the literature covers two peer agents disagreeing on a fact. The three disagreements of 2026-08-31 each resolved because one side had measured and the other remembered. That is a ZAO original and belongs upstream in `zorca/PLAYBOOK.md`.

### 3. What belongs in a brief

Anthropic states the contract:

> "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries. Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information."

Four required fields. Measured against ZAO's 73 briefs (`~/zao-vault/handoffs/*.md`): min 3 lines, **median 95**, mean 136, p90 306, max 766; **14 exceed** the 200-line soft cap in `handoff-discipline.md`. They are strong on objective and boundaries, weak on **output format** and silent on **effort budget**.

The sharpest outside critique is from the HN thread on Anthropic's own post - `imron`: *"They've made an issue tracker out of json files and a text file. Why not hook an mcp to an actual issue tracker?"* and `_boffin_`, who self-hosts Plane and drives it by MCP.

**This lands on ZAO harder than on Anthropic, because ZAO already has the issue tracker.** The cowork board (`~/bin/zao-tracker`, Supabase) is the named owner of task truth in both `CLAUDE.md` and `handoff-discipline.md` rule 7. 73 markdown briefs in the vault are a second task tracker that the first one cannot see. The division that survives:

| Layer | Home | Why |
|---|---|---|
| Why this lane exists, what is true, what is contested | vault brief (prose, capped) | prose is right for reasoning; humans and agents both read it |
| What is open / done / owned / due | the board | it is already the source of truth and it is queryable |
| What "done" means, per item | JSON the lane may only flip a boolean in | Anthropic measured that models overwrite markdown and respect JSON |

### 4. Liveness and heartbeats

The silent-success problem is thirty years old in operations and its answer is the **dead-man's switch**: the healthy state emits, and the *absence* of the emission is the alarm. Finding 1 generalises correctly - "anything whose normal state is silence needs a way to say 'I am still listening'" is that pattern, rediscovered.

Google SRE supplies the two rules that stop the cure becoming the disease:

> "When pages occur too frequently, employees second-guess, skim, or even ignore incoming alerts, sometimes even ignoring a 'real' page that's masked by the noise."

> "Every page should be actionable. Every page response should require intelligence. If a page merely merits a robotic response, it shouldn't be a page."

And the framing that ZAO's rules do not yet have: SRE grades an alert on **four** parameters at once - precision, recall, detection time, reset time (SRE Workbook ch.5). ZAO's `noisy-signal-guard.md` covers precision; `silent-failure-guard.md` covers recall; **detection time and reset time are unmeasured**. That is why "a cron dead 32 hours with 20 notifications queued" is expressible as a bug but not as a number.

The symptom/cause distinction applies directly to finding 2: SRE says spend "much more effort on catching symptoms than causes". A check for the *presence of a bad string* is a cause check, and it is the one that passes when its subject is dead. A check for the *absence of the good output* is a symptom check.

### 5. When NOT to orchestrate

Three converging arguments, all measured:

1. **Cost.** Anthropic: agents use ~4x the tokens of chat, multi-agent ~15x; "multi-agent systems require tasks where the value of the task is high enough to pay for the increased performance." ZAO's own figure: **$56.64 per PR** across a 24h window (`code-over-inference.md`).
2. **Fit.** Anthropic: "some domains that require all agents to share the same context or involve many dependencies between agents are not a good fit... most coding tasks involve fewer truly parallelizable tasks than research."
3. **The 90/10 curve.** HN `roughly` (FULL): "with almost no effort, you can get 70% of the way there... the next 10-20% starts to require things like multi-agent judge setups, external memory, context management... By a certain point, the amount of infrastructure and LLM calls are running into several hundred dollars per run."

ZAO has already paid this once: **13 VPS cheap-loops ran for a week at load 12.5 and wrote zero files in seven days** (doc 2349, `code-over-inference.md`). The test stays the one already written down - *same judgment every time is a script; fresh judgment each time is a lane* - and this research adds no reason to soften it.

---

## The seven findings, scored against outside practice

| # | ZAO finding (measured 2026-08-31/09-01) | Outside practice says | Net |
|---|---|---|---|
| 1 | Silence is the dominant failure mode; anything normally silent needs to say "I am still listening" | **Agrees, and is 30 years older.** Dead-man's switch; SRE symptom-over-cause | CONFIRMED. Add detection time + reset time as numbers. |
| 2 | A check that fails only on the presence of something bad passes when its subject is dead | **Agrees.** SRE's symptom vs cause; "black-box monitoring... forcing discipline to only nag a human when a problem is both already ongoing and contributing to real symptoms" | CONFIRMED. Live instance found today in `zao-lanes`. |
| 3 | The verification is likelier to be wrong than the thing verified; a tool beat a memory file | **Agrees, sharply.** HN `adidoit`: "the state-of-the-art... is to use strong-worded instructions... can you really trust systems like these in production where the best control you can offer is that you're pleading with it" | CONFIRMED. `zao-assert` is the correct response; extend it. |
| 4 | Neither party wins by rank; converging on "we do not know" is a success | **Not found anywhere.** The literature covers orchestrator-to-worker, never peer-to-peer disagreement | **ZAO ORIGINAL.** Publish it in `zorca/PLAYBOOK.md`. |
| 5 | Relay only what changes the principal's next action | **Independently rediscovered.** Anthropic's early agents were "distracting each other with excessive updates"; SRE's alert-fatigue chapter is the same rule for humans | CONFIRMED. |
| 6 | Two writers in one working tree is the recurring collision | **Agrees and goes further.** HN `yaskou`: "they all seem to assume an agent lives in one worktree of one git repo... the repo boundary is often just not the task boundary" | CONFIRMED, and the harder version (multi-repo lanes) is unsolved everywhere. |
| 7 | Delegation is bounded by brief quality, not model capability | **Agrees, with a field list.** Anthropic: objective, output format, tool guidance, task boundaries - "without detailed task descriptions, agents duplicate work, leave gaps" | CONFIRMED. Add output format + effort budget to the ZAO brief template. |

Six of seven confirmed by outside practice; one is ours alone. The estate's *diagnosis* is sound. Its *instruments* are not - which is exactly what decision 1 found.

---

## Contradictions left standing (not synthesised away)

1. **Bridge vs restart** (Anthropic vs `mips_avatar`). Resolved above only for our case, not in general.
2. **Separate evaluator agent: works or does not** (ZAO `loop-evals.md` + Anthropic's future-work section vs HN `daxfohl`). Unresolved in the literature. ZAO's read-only, default-FAIL variant is the narrow shape `daxfohl` concedes.
3. **Anthropic's own future-work admission**: "it's still unclear whether a single, general-purpose coding agent performs best across contexts, or if better performance can be achieved through a multi-agent architecture." The vendor with the most data does not claim to know. Neither should we.

## Staleness audit

- Anthropic *Effective harnesses*: published **2025-11-26**, ~9 months old, written against Opus 4.5 and the Claude Agent SDK. Mechanisms (progress file, JSON feature list, git) are model-independent; the specific model claims are dated.
- Anthropic multi-agent Research post: cites Opus 4 lead / Sonnet 4 subagents and a **90.2%** internal eval improvement. Model generation is two families old - treat the *architecture* as current and the *numbers* as historical.
- Google SRE Book ch.6 and SRE Workbook ch.5: 2016/2018. Stable; nothing in them has been superseded.
- Hightouch/Amplify: HN-dated **2026-01-20**, ~7 months old.
- `zorca/PLAYBOOK.md`: `updated: 2026-08-25`, **7 days stale** against the 2026-08-31 vault playbook. This is decision 6.

---

## Also See

- [Doc 2444](../2444-always-on-orchestrator/) - the tick, the 91.5% context-handling figure, and the registry that decision 1 extends
- [Doc 2434](../2434-harness-engineering-six-layer-map/) - the six-layer harness map
- [Doc 2198](../2198-agent-orchestration-production-harness-loop/) - harness vs loop; the gate is everything
- [Doc 2178](../2178-agent-harness-orchestrator-workers/) - one orchestrator, many workers
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - loop/harness engineering alignment audit
- [Doc 928](../928-agent-loop-best-practices/) - the base rulebook behind `.claude/rules/agent-loops.md`
- [Doc 2349](../../infrastructure/2349-vps-loop-starvation/) - the 13 loops that wrote nothing in seven days

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| `zao-lanes` targets `-t "=name"` and renders NO-PANE for registry-only lanes; selftest asserts an invented name returns NO-PANE (shipped = merged zaal-dotfiles PR) | @Zaal | PR (zaal-dotfiles) | 2026-09-02 |
| Fold `~/zao-vault/notes/lane-supervision-playbook.md` into `zorca/PLAYBOOK.md`, leave a pointer in the vault, bump `updated:` (shipped = merged zorca PR) | @Zaal | PR (zorca) | 2026-09-05 |
| Add `output format` and `effort budget` (expected tool calls / turns) to the brief template at `~/zao-vault/handoffs/TEMPLATE.md` (shipped = template committed) | @Zaal | PR (zao-vault) | 2026-09-05 |
| Write the initializer prompt: one `/lane-init` that produces the brief, the JSON done-list, and the first commit, instead of hand-writing each brief (shipped = skill file committed and used once) | @Zaal | Skill | 2026-09-12 |
| Decide the single home for lane tooling - move `zj`/`zao-lanes`/`zao-tick`/`lane-send` into `zorca`, or rename `zorca` to match what it holds (shipped = decision recorded in `zorca/README.md`) | @Zaal | Decision | 2026-09-12 |
| Add detection-time and reset-time to `zao-selftest` output so "a cron dead 32 hours" is a number, not a story (shipped = selftest prints both) | @Zaal | PR (zaal-dotfiles) | 2026-09-19 |
| Establish a reddit `script` app credential at `~/.zao/private/reddit.env` so community coverage stops failing (shipped = `zao-fetch-reddit.sh --selftest` reports token 200) | @Zaal | Config | 2026-09-08 |

## Sources

Method is stated per source, per `.claude/rules/research-grounding.md` - WebFetch was not used for any quoted line.

- [Anthropic - Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - **[FULL - `curl` + HTML strip, 15,248 chars, HTTP 200]** Published 2025-11-26, by Justin Young. Initializer/coding-agent split, JSON feature list, progress file, get-your-bearings ritual, four failure modes table.
- [Anthropic - How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) - **[FULL - `curl` + HTML strip, 27,997 chars, HTTP 200]** Orchestrator-worker, 90.2% eval delta, 15x token cost, delegation contract, synchronous-execution limits, filesystem artifacts, rainbow deployments.
- [Google SRE Book, ch.6 - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) - **[FULL - `curl` + HTML strip, 30,754 chars, HTTP 200]** Symptoms vs causes, black-box vs white-box, alert-fatigue passage, "every page should be actionable".
- [Google SRE Workbook, ch.5 - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) - **[FULL - `curl` + HTML strip, 30,316 chars, HTTP 200]** Precision, recall, detection time, reset time as four simultaneous parameters.
- [Amplify Partners - How Hightouch built their long-running agent harness](https://www.amplifypartners.com/blog-posts/how-hightouch-built-their-long-running-agent-harness) - **[FULL - `curl` + HTML strip, 18,019 chars, HTTP 200]** File buffering, dynamic subagents, plan regurgitation, the compaction critique, Haiku fan-out.
- [HN 46081704 - discussion of Anthropic's long-running harness](https://news.ycombinator.com/item?id=46081704) - **[FULL - Algolia `items` API, whole comment tree]** 125 points, 37 comments, 2025-11-28. `roughly` on the 70/90/100 curve; `mips_avatar` on restarting at 200k; `imron`/`_boffin_` on reinventing an issue tracker; `daxfohl` against a QA agent; `adidoit` on strongly-worded instructions; `threecheese` on curving back to workflows; `vidarh` on multi-week runs.
- [HN 46695855 - How Hightouch built their long-running agent harness](https://news.ycombinator.com/item?id=46695855) - **[FULL - Algolia `items` API]** 45 points, 2026-01-20. `zacwellmer` on compaction borking sessions.
- [HN 48680842 - Ask HN: multi-agent orchestration for personal use](https://news.ycombinator.com/item?id=48680842) - **[FULL - Algolia `items` API]** 2026-06-26. `verdverm` on mastering single-agent first; `yaskou` on the repo boundary not being the task boundary.
- [bettercallzaal/zorca](https://github.com/bettercallzaal/zorca) - **[FULL - local clone + `git ls-files`, LICENSE read as a file per Hard Requirement 13: MIT]** 30 files, 8,003 LOC.
- [bettercallzaal/hermes-orchestrator](https://github.com/bettercallzaal/hermes-orchestrator) - **[PARTIAL - `gh api` metadata only; not cloned on this Mac, contents unread]** public, 75KB, 1 star, pushed 2026-08-31.
- [LangGraph - multi-agent concepts](https://langchain-ai.github.io/langgraph/concepts/multi_agent/) - **[FAILED - `curl` returned HTTP 200 with 549 bytes and 31 characters of text; `docs.langchain.com/oss/python/langgraph/multi-agent` returned 404]** Supervisor/network/hierarchical topologies are therefore **not** cited in this doc. The 200-with-an-empty-body is itself an instance of `measurement-traps.md` trap 7.
- Reddit - **[FAILED - `zao-fetch-reddit.sh --selftest`, 2026-09-01 10:42Z: creds ABSENT, token endpoint 401, oauth 403, public `.json` returns `text/html`, 0/3 redlib instances answered 200]** No Reddit source is cited. See Next Actions.
- Local, measured 2026-09-01: `~/zao-vault/notes/lane-supervision-playbook.md`, `~/zao-vault/notes/second-brain-reconciliation-2026-08-31.md`, `~/.zao/orchestrators.json`, `~/.claude/projects/-Users-zaalpanthaki-Documents-nsorcestrator/memory/verify-the-check-before-raising-the-alarm.md`, `~/zaal-dotfiles/bin/zao-lanes`, `~/zao-vault/handoffs/*.md` (n=73), `~/Documents/zorca/PLAYBOOK.md`.
