---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-23
related-docs: "644, 601, 717, 680, 705, 711, 714, 718, 719, 720, 721, 722, 726"
original-query: "Refactor ZOE into an agent builder. ZOE spawns a new agent for each task and gets better at agent-building over time. Per the 2026-05-23 brainstorm: scope as a supervisor pattern that wraps Hermes - classify task, spawn agent, watch streaming output, intervene mid-run, persist every step to the ZABAL Bonfire, learn from past runs. Bonfire is the durable learning store."
tier: STANDARD
---

# 727 - ZOE as agent builder: orchestrator + supervisor + learning loop

> **Goal:** Lock the architecture for ZOE-as-orchestrator. ZOE classifies any incoming task, spawns the right agent (Hermes / child bot / Claude Code subagent), supervises the streaming output, intervenes mid-run when needed, persists every step to the ZABAL Bonfire so the graph becomes the durable learning store, and gets better at agent-building over time.

This doc is the prerequisite for any code per CLAUDE.md "no new bots without doc + explicit Zaal approval." It is a NEW capability in existing ZOE, NOT a new bot. No override of any locked decision is required - the design WRAPS Hermes-canonical, it does not replace it.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Wrap Hermes, do not replace it.** ZOE's orchestrator dispatches to `bot/src/hermes/runner.ts` (and `runFixer` / `runCritic`) as its primary agent-spawn primitive. | Hermes-canonical lock 2026-05-05 ([[project_hermes_canonical]]) is intact. The orchestrator is a layer ON TOP. Hermes was never the only spawn path - child bots (`bootloader-template.md`) and CC subagents (Task tool) are too. ZOE picks among them; Hermes stays canonical for code work. |
| 2 | **Bonfire is THE learning store.** Every classify / spawn / intervene / complete / fail / learn event is a Bonfire episode. No new DB tables, no parallel state. | Bonfire brief (doc 726) plus the in-flight `/bonfire` skill (doc 717, PR #627) give us write-anywhere, idempotent-by-`name`, secret-scanned, best-effort POSTs. Episodes are self-contained prose so each becomes a graph node. The "ZOE gets better" loop = retrieve past episodes for similar tasks at spawn time, inject as few-shot. |
| 3 | **MVP = router for ALL tasks + 3 vertical-sliced patterns first.** Bug-fix (Hermes), research (/zao-research subagent), meeting capture (/meeting skill). Other task classes route to "unknown - I'll ask Zaal." | Per the 2026-05-23 brainstorm: build the router as the unifier, but only ship intervention logic for 3 patterns at MVP. Unknown classes gracefully escalate to Zaal. Avoids the "build a generic supervisor" trap. |
| 4 | **Stream-json, not blocking json, from claude-cli.** Switch Hermes from `--output-format json` to `--output-format stream-json` so the supervisor can read turn-by-turn. | Hermes currently calls `claude --output-format json` and waits for the whole reply. The supervisor needs progress signal mid-run. Same auth, same Max-plan model, same subprocess shape - one flag flip. |
| 5 | **Best-effort everywhere.** A Bonfire failure, a supervisor crash, a stuck classify - never aborts the larger workflow. The orchestrator returns control even on partial completion. | Mirrors `recall.ts` `remember()` and `bonfire-episode.sh` discipline. The orchestrator must not become a single point of failure for ZOE's concierge replies. |

## Architecture

```
                       Zaal -> ZOE Telegram message
                                    |
                                    v
+-------------------------------------------------------------------+
|                  ZOE concierge.ts (existing)                      |
|  - 4-block memory injection                                       |
|  - selectModel() routing                                          |
|  - On a "task-shaped" message, call orchestrator.handleTask(...)  |
+-------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------+
|         orchestrator/index.ts (NEW - the entry point)             |
|                                                                   |
|  1. router.classify(task)  -> pattern + confidence + reasoning    |
|  2. learner.retrieve(class) -> past episodes as few-shot context  |
|  3. patterns.<X>.spawn(task, context) -> streaming agent run      |
|  4. supervisor.watch(run)   -> turn-by-turn parse                 |
|  5. guide.maybe_intervene() -> follow-up to running subprocess    |
|  6. on completion / failure / cap: learner.record(outcome)        |
|  7. concierge gets the final summary back to reply to Zaal        |
+-------------------------------------------------------------------+
       |               |              |             |          |
       v               v              v             v          v
+-----------+   +----------+   +-----------+   +--------+  +--------+
|  router   |   | supervis.|   |   guide   |   |learner |  |bonfire |
+-----------+   +----------+   +-----------+   +--------+  | bridge |
                                                            +--------+
                                                                |
                                                                v
                                                  ZABAL Bonfire (KG)
                                                  bonfire_id 69ef871f...
                                                  source_description:
                                                    "zoe-orchestrator:<event>"
```

## Components

### router.ts - the classifier

Inputs: task text + recent ZOE memory blocks. Output: `{pattern, confidence, reasoning}`.

Patterns enumerated:
- `hermes-bug-fix` - "fix this PR", "the build is failing", "fix the type error in X"
- `zao-research` - "research X", "look up Y", "what do people say about Z"
- `meeting-capture` - "process this recording", "recap that call", a path to an audio/video file
- `content-draft` - "write a newsletter post about X", "draft a cast about Y" (post-MVP)
- `code-review` - "review PR #N" (post-MVP)
- `unknown` - escalate to Zaal: "I'd run this as a <best-guess>, confirm?"

Implementation: a single Hermes invocation with a 1-shot classifier prompt + the enum. Sonnet quick mode. Costs <$0.005/task.

### supervisor.ts - the watcher

Subscribes to the streaming output of `claude --output-format stream-json` (Hermes path) OR the Telegram reply stream (child-bot path) OR the Task-tool yield (CC subagent path).

Per turn, evaluates:
- Is the agent making progress? (output length growing, tool calls happening)
- Is the agent stuck? (no new output in 60s, same tool call 3x in a row)
- Is the agent looping? (same output text 3+ times)
- Is the agent off-track? (tool calls don't match the classified pattern)
- Has the cost cap fired? (Hermes already has $-per-run; orchestrator enforces a default $2/task cap)

On any flag -> dispatches to `guide.maybe_intervene()`. Otherwise continues watching.

### guide.ts - the intervener

Sends a follow-up message to the running subprocess (Hermes claude-cli supports multi-turn via the same session). Templates per intervention type:

- Stuck: "ZOE check-in: you've been on `<step>` for 60s. What's blocking? If you need different tools, say so."
- Looped: "ZOE check-in: I see the same output 3 times. Reconsider - the approach may be wrong."
- Off-track: "ZOE check-in: the task was `<original>`, but I see tool calls for `<other>`. Confirm the path or course-correct."
- Cost-cap: "ZOE check-in: $2 cap reached. Wrap up with the best partial result you have."

Max 3 interventions per task before escalating to Zaal.

### learner.ts - the memory loop

Two operations:

**Retrieve** (at spawn time):
```
const past = await bonfire.search({
  query: `pattern:${pattern} task-class:${class}`,
  limit: 5
})
const fewshot = past.map(e => e.episode_body).join('\n\n')
spawn(..., systemPrompt: basePrompt + '\n\nPast similar tasks:\n' + fewshot)
```

Today `vector_store/search` returns `[]` until admin labeling runs (per doc 726). Until then, retrieve is a no-op and we fall back to base prompt. The day labeling fires, the retrieve branch starts returning hits - no code change.

**Record** (at every step + at the end):
- task-classified
- agent-spawned
- intervention-N (if any)
- task-completed | task-failed | task-escalated

Each as a Bonfire episode (see Episode Types below).

### bonfire-bridge - reuse `recall.ts`

No new code path. The orchestrator's calls to record outcomes go through `recall.ts` `remember({body, name, sourceTag})` - the same function ZOE concierge uses. Episode `source_description` carries the orchestrator-specific labels.

## Bonfire episode types per orchestrator stage

Per the canon (doc 726): atomic episodes, self-contained prose, stable names for idempotent updates, secret-scan before POST.

| Event | name pattern | body shape | source_description |
|-------|--------------|------------|-------------------|
| task-classified | `zoe-orch:classify:<task-slug>` | "On <date>, ZOE classified incoming task `<task-text-trim>` as pattern `<X>` with confidence `<C>`. Reasoning: `<one-line>`." | `zoe-orchestrator:classify` |
| agent-spawned | `zoe-orch:spawn:<task-slug>:<pattern>` | "On <date>, ZOE spawned a `<pattern>` agent for task `<task-slug>`. Cost cap: $<N>. Max interventions: 3." | `zoe-orchestrator:spawn` |
| intervention | `zoe-orch:intervene:<task-slug>:<n>` | "On <date>, ZOE intervened in agent for task `<task-slug>` at step `<step>`: `<reason>`. Sent: `<follow-up-text-trim>`." | `zoe-orchestrator:intervene` |
| task-completed | `zoe-orch:done:<task-slug>` | "On <date>, ZOE marked task `<task-slug>` complete via `<pattern>`. Duration: `<X>s`. Cost: $<N>. Outcome: `<one-line summary>`." | `zoe-orchestrator:done` |
| task-failed | `zoe-orch:fail:<task-slug>` | "On <date>, ZOE marked task `<task-slug>` FAILED via `<pattern>` after `<N>` interventions. Reason: `<error>`. Recovery: `<none\|retry\|escalate>`." | `zoe-orchestrator:fail` |
| pattern-learned | `zoe-orch:learn:<pattern>:<observation-stamp>` | "On <date>, ZOE observed for pattern `<X>`: after `<N>` similar tasks, `<Y>` works better than `<Z>`. Will inject this into the bootloader template's pattern-hints section." | `zoe-orchestrator:learn` |

Each episode is one atomic graph node. Bonfires auto-extraction will link `<task-slug>` and `<pattern>` as recurring entities.

## MVP scope

Three patterns implemented end-to-end; rest route to `unknown`.

| Pattern | Spawn primitive | Watch surface | Intervene surface |
|---------|-----------------|---------------|-------------------|
| `hermes-bug-fix` | `runFixer` from `bot/src/hermes/coder.ts` | claude-cli stream-json | follow-up via same subprocess |
| `zao-research` | Spawn the `/zao-research` skill via CC Task tool (requires bridging - see Open Questions) | Task-tool yield events | Currently NOT supported by Task tool; fall back to spawn-and-validate-at-end for MVP |
| `meeting-capture` | Invoke `bash .claude/skills/meeting/scripts/transcribe.sh` + the extraction sub-script | Process exit + transcript validity | Cannot intervene mid-run on a Whisper subprocess; treat as monitor-only |

The MVP proves: classify works, spawn works on 3 paths, supervisor distinguishes between "active" and "stuck/done", Bonfire episodes land for every stage, retrieval is wired (returns [] today, ready for labeling unlock).

## File map

```
bot/src/zoe/orchestrator/
  index.ts          - handleTask(task, context): the entry called from concierge
  router.ts         - classify(task, memory) -> {pattern, confidence, reasoning}
  supervisor.ts     - watch(stream, classifierOutput) -> async iterator of decisions
  guide.ts          - intervene(run, reason) -> sends follow-up to running subprocess
  learner.ts        - retrieve(pattern, class) + record(stage, payload)
  patterns/
    hermes.ts       - dispatch to bot/src/hermes/runner.ts with stream-json
    zao-research.ts - dispatch to /zao-research via CC Task tool
    meeting.ts      - dispatch to /meeting transcribe + extract scripts
    unknown.ts      - the escalate-to-Zaal fallback
  types.ts          - Task, Pattern, RouterDecision, RunHandle, Outcome, etc
  __tests__/
    router.test.ts
    supervisor.test.ts
    learner.test.ts
    orchestrator-e2e.test.ts
```

No new bot, no new systemd unit, no new persistent state - the orchestrator is a module ZOE imports. Existing `zoe-bot.service` runs it.

## Build phases (one PR per phase)

| PR | Scope | LOC | Ships value |
|----|-------|-----|-------------|
| **PR1** | `orchestrator/index.ts` + `router.ts` + `learner.ts` (record only) + `patterns/hermes.ts` (basic, no streaming yet) + Bonfire wiring for classify + spawn + done | ~250 | Any incoming Hermes-bug-fix task gets logged to Bonfire end-to-end. Proves the route + log loop. |
| **PR2** | `supervisor.ts` + switch Hermes to `--output-format stream-json` + Bonfire `intervention` episode type wired | ~300 | The supervisor reads streaming output, detects stuck/looped/off-track, logs interventions to Bonfire. No intervening yet. |
| **PR3** | `guide.ts` + multi-turn follow-up to running subprocess + tested on real Hermes runs | ~250 | ZOE actually intervenes and the subprocess responds. End-to-end watch-and-guide loop live. |
| **PR4** | `learner.ts` retrieve path - call `bonfire.search`, inject few-shot, handle empty (today) gracefully | ~150 | The "gets better" loop wired. No-op until admin labeling, then live. |
| **PR5** | `patterns/zao-research.ts` + `patterns/meeting.ts` + `patterns/unknown.ts` | ~300 | Generalises to 3 task types + the escalation fallback. |
| **PR6** | Telegram surface - `commands.ts` route for "ZOE, run X" + status updates per intervention | ~200 | Zaal can DM ZOE a task in natural language and see the supervisor at work in the chat. |

Each PR is independently shippable - if PR3 is blocked, PR1+2 still deliver "every Hermes run is in Bonfire."

## Open questions to lock before PR1

1. **Zaal-visibility surface.** Does Zaal want per-intervention Telegram updates from ZOE, or only the final summary? My recommendation: only the final summary by default, with `/zg orchestrator verbose on` to opt into live-stream.
2. **CC subagent bridging.** The `zao-research` pattern needs ZOE to invoke a Claude Code subagent. CC subagents are normally an in-session tool; ZOE runs as a long-lived bot. Two options: (a) ZOE shells out to a one-off `claude` CLI command with the right args (Hermes-style, slow), (b) ZOE talks to a CC session that's always-on on the VPS (new infra). My recommendation: (a) for MVP, revisit if latency becomes painful.
3. **Cost cap default.** I proposed $2/task. Per Hermes existing `cost-aware-llm-pipeline` defaults, $0.50/task is more conservative. Pick one.
4. **Concurrency.** Can ZOE supervise 3 agents at once or strict serial-only at MVP? Strict serial is simpler. My recommendation: serial-only at MVP, add a job queue post-PR6.
5. **What is "improvement" the metric.** Success rate per pattern over rolling 20 tasks? Cost per task trending down? Number of interventions trending down? Pick one to instrument in PR4.

## Also See

- [Doc 644 - ZAO agent stack canon + team bot template](../644-zao-agent-stack-canon-and-team-bot-template/) - the Hermes pattern this builds on
- [Doc 601 - Agent stack cleanup decision](../601-agent-stack-cleanup-decision/) - what was killed (and stays killed) - openclaw, Composio AO, Agent Zero
- [Doc 717 - Posting Bonfire episodes via VPS](./717-meeting-bonfire-posting-via-vps/) - the auth-on-VPS rule the orchestrator inherits
- [Doc 680 - Meeting skill Bonfire bridge](./680-meeting-skill-bonfire-bridge/) - the per-event-Bonfire-episode pattern
- [Doc 705 - Fractal governance external deep research](../../governance/705-fractal-governance-external-deep-research/) - related learning-loop language
- [Doc 722 - 3-month synthesis hub](../../dev-workflows/722-zao-claude-code-3-month-synthesis/) - the corpus this orchestrator will be measured against
- [Doc 726 - Bonfires bot-teaching guide](../726-bonfires-bot-teaching/) - the canonical Bonfire integration brief this design imports
- [[project_hermes_canonical]] - the lock this design must respect
- [[project_zoe_soul_architecture]] - ZOE's current 4-block memory + child-bot template

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm scope + answer the 5 open questions in this doc | @Zaal | Decision | Before PR1 |
| Ship PR1 (router + bonfire + Hermes-bug-fix end-to-end) | @Zaal | PR | Within 7 days of approval |
| Wire stream-json on Hermes claude-cli wrapper + supervisor watcher (PR2) | @Zaal | PR | After PR1 lands |
| Ship guide.ts + multi-turn follow-up (PR3) | @Zaal | PR | After PR2 lands |
| Retrieve few-shot wiring (PR4) - lives dormant until Bonfire labeling | @Zaal | PR | After PR3 lands |
| Generalise to 3 patterns (PR5) | @Zaal | PR | After PR4 lands |
| Telegram surface + status (PR6) | @Zaal | PR | After PR5 lands |
| Escalate Bonfire admin labeling to Joshua / Ryan - PR4's retrieve branch is dormant until this fires | @Zaal | Comms | This week |

## Sources

All internal - this is a ZAO architecture decision grounded in the existing codebase + canon docs.

- `bot/src/zoe/concierge.ts`, `bot/src/zoe/memory.ts`, `bot/src/zoe/types.ts` - the existing ZOE shape - [FULL]
- `bot/src/hermes/claude-cli.ts`, `bot/src/hermes/runner.ts`, `bot/src/hermes/coder.ts`, `bot/src/hermes/critic.ts`, `bot/src/hermes/db.ts` - the Hermes primitives this wraps - [FULL]
- `bot/src/zoe/recall.ts` `remember()` + `mirrorTurn()` - the Bonfire bridge - [FULL]
- `.claude/skills/bonfire/SKILL.md` and `scripts/bonfire-post.sh` / `bonfire-remote-post.sh` - the off-VPS path - [FULL]
- Doc 726 Bonfires bot-teaching guide (the brief pasted in this brainstorm, 2026-05-23) - [FULL]
- Doc 644 ZAO agent stack canon - [FULL]
- Doc 601 agent-stack cleanup - [FULL]
- Doc 717 meeting-Bonfire-via-VPS - [FULL]
- Doc 722 hub + sub-docs (the recent corpus synthesis this orchestrator is informed by) - [FULL]
- Memories: `project_hermes_canonical`, `project_zoe_soul_architecture`, `project_zoe_v2_pivot_agent_zero`, `project_zaocoworkingbot` - [FULL]
