---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-08
related-docs: 928, 989
original-query: "research https://x.com/aparnadhinak/status/2073492320159510869 and https://x.com/0xCodila/status/2072329149520232639"
tier: DEEP
---

# 994 - Loop engineering: the 4-loop taxonomy + Karpathy method, mapped to ZAO

> **Goal:** Two mid-2026 essays ("loop engineering" hit peak hype in June-July 2026) define the vocabulary for how autonomous agents actually run. Pin the taxonomy down and map ZAO's real loops (ZOE, /loop, the fix-PR pipeline, autoresearch) onto it so we set each autonomy dial deliberately. Extends doc 928 (agent loop best practices) + doc 989 (wheel-and-spoke).

## Key takeaways

| # | Takeaway |
|---|----------|
| 1 | "Loop" means at least 4 different things (Aparna Dhinakaran). Name which one you mean before arguing about autonomy. |
| 2 | Autonomy is a separate dial on EVERY loop. You can run a fully autonomous execution loop inside a heavily supervised product loop. The question is never "auto or not" - it's "what signal sets each dial." |
| 3 | A loop without a wired-in exit signal does not converge - it runs until something external (money, rate limit, a human) stops it. Every loop needs a nameable stop condition. (Both essays. Matches doc 928 rule 5: hard caps.) |
| 4 | Fan-out (dispatch -> gather -> validate, e.g. Cognition's "agentic MapReduce") is a PIPELINE, not a loop - "a loop without feedback is just a for statement." It's a topology you deploy inside a loop. |
| 5 | The top ring is the "oversight loop" - set goals, allocate budget, cull work. That ring is where the human lives. "Inner loop is capability; outer loop is agency." |
| 6 | Even the flagship autonomous systems keep a human at the last checkpoint (Meta Brain2Qwerty v2: agents rewrote the code, humans still picked the final config; Anthropic's internal tool: 65% of product-team code agent-written, but the team is bottlenecked on human review). The checkpoint humans keep is now the constraint. |

## The 4 loops (Aparna Dhinakaran, "What the hell is a loop, anyway?", 1.09M views)

1. **Execution loop** - the innermost "agent" loop: call tool -> read result -> decide next -> repeat until no more tool calls. Iterates on steps within ONE task. Ends on environment feedback (tests, API responses) or when the agent decides it's done (whether or not it is).
2. **Task loop (the "Ralph loop", Geoffrey Huntley)** - restart a fresh-context agent against the SAME spec over and over, one task per iteration. The waste is the point: re-feeding the full spec each loop prevents context rot / compaction decay. Ends on spec compliance + passing tests. Human writes the spec, judges done-ness, and watches for recurring failure patterns ("locomotive engineer keeping the train on the rails").
3. **Product loop (the "software factory": Factory, Warp's Oz, Anthropic's internal tool)** - iterates on a whole codebase + backlog: triage -> spec -> implement -> review -> verify -> ship -> monitor. Never really ends; signals come from OUTSIDE the codebase (new issues, prod logs, user feedback). Human role is configurable - pick which lifecycle stages to automate and where humans re-enter (e.g. ratchet auto-merge from 20% -> 60%).
4. **System loop (autoresearch: Karpathy; Meta Brain2Qwerty)** - the outer loop studies + improves the primary system: iterates on prompts, harnesses, model choice, and the evals themselves. "The loop is the product." Needs the most demanding signals: evals, judges, filtered feedback, an explicit ask-a-human tool.
5. **Oversight loop (the ??? ring)** - above all of them: set goals, allocate, cull. Exit condition = you. This is the one ring a human should hold.

## The Karpathy method (0xCodila, "Loop Engineering: The Karpathy Method", 3.5M views)

- A prompt is one instruction; a loop is a goal the AI keeps working toward until it's met - discover -> plan -> do -> check -> feed back -> repeat. You define purpose once.
- **Three parts make or break it:** a clear goal, a feedback signal, and a STOP condition (goal met OR a hard "after N tries, stop and report" cap). A loop with no exit "runs until it succeeds, breaks, or drains your account."
- **When a loop is a mistake (the honest take):** it earns its cost only when the task is real, repeatable, checkable, and worth the tokens. On a consumer/limited-token plan a heavy loop hits your rate limit or wallet before the productivity gain arrives. Most people don't need the heavy version yet.
- Origin: Karpathy's AutoResearch repo (March 2026, ~630 lines of Python, 50 overnight hypothesis-edit-eval experiments on one GPU) -> Fortune dubbed it "The Karpathy Loop."

## Map to ZAO's actual loops

| ZAO loop | Which type | Autonomy dial today | Signal / stop | Notes |
|----------|-----------|---------------------|---------------|-------|
| A Claude Code session doing one task | execution loop | high mid-task, human at boundaries | typecheck/build/tests green + PR | matches doc 928 "ground truth over confidence" |
| ZOE fix-PR pipeline (coder + critic + auto-PR) | task loop (Ralph-ish) | autonomous to PR, human merges | tests pass + critic; human gate = merge | PR-only human gate = doc 928 rule 8 |
| ZOE as orchestrator across surfaces | product loop | supervised; outbound/on-chain/spend human-gated | tracker state, inbox, events | the wheel-and-spoke (doc 989) IS a product loop |
| /loop autonomous research/daily-ops | system-ish + task | capped, PR-only, ZOE-reported | daily/budget cap; one item/tick | doc 928 rule 5 (hard caps) |
| Zaal setting priorities via the board + ZOE | oversight loop | fully human | Zaal | this is the ring Zaal holds - correct |

## Recommendations for ZAO

| Recommendation | Why |
|----------------|-----|
| Name the loop before tuning it. When proposing automation, say which of the 4 it is + where the human checkpoint sits. | Prevents the "auto vs not" false debate; the essays' core point. |
| Every ZAO loop needs a wired stop signal + a hard cap, not just a prompt rule. | Doc 928 rule 5; both essays. A loop without a signal doesn't converge. |
| Keep fan-out (subagent dispatch) labeled as a pipeline, not a loop. | It has no feedback; don't over-trust it. Matches feedback_no_sub_agent_context_fabrication. |
| The bottleneck to watch is human REVIEW, not agent capability (Anthropic's own constraint). | As ZAO ratchets ZOE autonomy, review throughput is the limit - budget for it. |
| The Karpathy "when a loop is a mistake" test is the cap-awareness rule Zaal already hit. | ZAO is on Claude Max/limited tokens; reserve heavy loops for real+repeatable+checkable+worth-it work. |

## DEEP expansion (primary-source pass, 2026-07-08)

A follow-up research pass pulled the primary sources the seed essays cite. Nine source clusters:

1. **The Karpathy Loop (AutoResearch)** - propose -> execute -> evaluate -> commit/rollback. ~700 experiments over two days, ~11% improvement. The model cannot override the stop; git is ground truth.
2. **The Ralph Loop (Geoffrey Huntley)** - spawn a clean agent per iteration against the spec; prevents context degradation. Higher token cost, lower error accumulation.
3. **Inner vs outer loop (Addy Osmani)** - inner = execution (model capability), outer = strategy (human agency). Most teams only invest in the inner.
4. **Loopcraft (swyx)** - the game is stacking loops well; early phases need reliability (step DOWN on failure), later phases need leverage (step UP as models improve).
5. **LangChain four-loop** - L1 agent work, L2 verification, L3 event-driven analysis, L4 improvement. Value compounds in L3-L4; most teams only ship L1.
6. **Software factories (Warp Oz / Factory)** - continuous issue -> spec -> code -> review -> merge; ratchet auto-merge as trust grows (e.g. 20% -> 60%); one team reports ~35k LOC/week ~50% self-written.
7. **Introspection / self-improving systems (Roland Gavrilescu)** - design outer loops that compel improvement without a human bottleneck; humans as factory components, not replaced.
8. **The critique camp** - Geoffrey Litt (Notion): understanding is the bottleneck, delegate understanding and you get replaced. Paul Bakaus: "there is no auto" - agents do the 80% grunt, humans the 20% creative. Dex Horthy (HumanLayer): step DOWN an abstraction; determinism + selective automation beats pure agentic loops; the middle of the context window is the "dumb zone."
9. **Practical patterns** - stop conditions (verification pass / iteration cap / cost ceiling / no-progress detection), context strategy (Ralph fresh-context vs compaction), rubric-based eval before loop design, token budgets + hard cost caps. The real failure mode is "loopmaxxing" - adding loops to vague goals.

### Loop-engineering checklist (build a good loop)
- Pre: a clear goal, a rubric/eval that defines done, a context strategy (fresh vs compacted), a token/cost budget.
- During: an exit signal the model cannot fake (tests, eval pass, git state), an iteration cap, a cost ceiling, no-progress detection, a per-iteration timeout.
- Post: a human checkpoint sized to the risk, a log/audit of what changed, and a review-throughput plan (review is the real bottleneck).

### Contradictions / open debates (unresolved)
- Autonomy camp (ratchet the dial up) vs human-agency camp (the dial has a stop). Understanding-lag: does delegating understanding compound leverage or erode ownership. Determinism vs abstraction: go down a level or up. There is no settled answer - set each loop's dial deliberately.

### Source status (deep pass)
FULL: Karpathy/AutoResearch, Huntley/Ralph, Osmani inner-outer, LangChain four-loop, Warp Oz + Factory, Gavrilescu/Introspection, Litt, Horthy, Bakaus, context/compaction + LLM-as-judge + cost-management writeups. PARTIAL: swyx Loopcraft (X post not full essay), arXiv (titles only). NOTE: the two seed essays remain cited FULL - both were fetched in full via fxtwitter in the original pass (the deep-pass subagent could not re-find them and mislabeled them; that is a search artifact, not a provenance problem).

## Also See
- [Doc 928](../928-agent-loop-best-practices/) - agent loop operating rules (the behavior-changing rules in .claude/rules/agent-loops.md).
- [Doc 989](../989-zoe-wheel-and-spoke-architecture/) - ZOE at the center = the product loop / oversight ring for ZAO.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fold the 4-loop naming + "name the loop before tuning" into .claude/rules/agent-loops.md - shipped = rule added | @Zaal | PR | 2026-07-15 |
| Add an explicit ask-a-human tool signal to ZOE's autonomous loops (Roland's autoresearch pattern) - shipped = ZOE can escalate uncertainty | @Zaal | Bot | 2026-07-31 |
| Track ZOE fix-PR auto-merge rate as a dial to ratchet (Warp 20%->60% pattern) - shipped = a number tracked | @Zaal | Metric | 2026-08-15 |

## Sources
- [FULL] Aparna Dhinakaran (Arize), "What the hell is a loop, anyway?" - https://x.com/aparnadhinak/status/2073492320159510869 (1,089,691 views; full article fetched via fxtwitter). The 4-loop taxonomy + oversight loop + pipeline-not-a-loop distinction.
- [FULL] 0xCodila, "Loop Engineering: The Karpathy Method" - https://x.com/0xCodila/status/2072329149520232639 (3,564,638 views; full article fetched). The Karpathy method, the 3 parts, when a loop is a mistake.
- Context (named in the essays, not independently verified here): Karpathy AutoResearch (Mar 2026), Warp Oz, Factory, Anthropic internal "Tag" tool, Meta Brain2Qwerty v2, Geoffrey Huntley's Ralph loop.
