---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "2343, 2352"
original-query: "can we /zao-research escalation rules and different models"
tier: STANDARD
---

# 2353 - Model tiering: the lanes were never the expensive part

> **Goal:** Decide what model a lane starts on and when it escalates - and, before designing that, measure where the money actually goes.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Sonnet is the floor for lanes. Done - shipped in dotfiles #62.** | The global default was `claude-fable-5[1m]`, and `zao-lane-boot` passes no `--model`, so 15 of 17 lanes inherited the most expensive tier. Anthropic's own banner: *"Fable 5 draws down usage faster than Opus 5."* |
| 2 | **But do NOT expect big savings from it.** Nine Fable-only lane sessions cost **$69.15** in 24h. **One orchestrator session cost $1,718.** | Lane model choice is a rounding error against session length. Fixing it is correct and cheap; calling it the cost fix would be wrong. |
| 3 | **The real lever is SESSION LENGTH, not model.** One session was **69% of a $2,471 day**. | `agent-spend.md` already measured cost = turns x ~$1, flat. A session that runs all day costs what its turn count says regardless of tier. |
| 4 | **ADOPT ZOE's escalation logic for lanes - it already exists and is already right.** `bot/src/zoe/decompose.ts` has a working three-tier router. | Do not design a new one. It escalates on strategic keywords or goal length, defaults to Sonnet, drops to Haiku for small work. That is the rule, written and tested. |
| 5 | **TURN ON `ZOE_TASK_COMPLEXITY_ROUTING=1`.** It is opt-in and currently **unset**, so the cost-class router returns `defaultModel` unchanged - built, shipped, and inert. | Classic wire-the-last-10%. The decomposer already emits a cost class per subtask and nothing consumes it. |

## Findings

### 1. Measured first, because the intuition was wrong

`zao-spend --days 1`, taken 2026-08-20 18:20:

```
TOTAL  $2471.77   across 60 session(s)
$0.48 per 1k output tokens generated
$49.44 per PR
```

The session table, top rows:

| session | cost | output | cache read | model |
|---|---|---|---|---|
| ZAO OS V1 | **$1,718.24** | 1.5M | 949.5M | fable,opus,unknown |
| ZAO OS V1 | $233.53 | 121.4k | 58.7M | opus |
| ZAOartizen | $121.39 | 98.3k | 39.5M | opus |
| ZAO OS V1 | $47.57 | 630.3k | 74.4M | fable |

**One session is 69% of the day.** It is the orchestrator - the long-running session that drove the wall build - and it was still climbing while this doc was written ($1,708 to $1,718 across two consecutive queries).

By contrast, summing the Fable-only lane sessions: **9 sessions, $69.15 total.** The two Opus-only sessions: **$121.39**.

So the question "should lanes be Sonnet or Fable" is worth answering, and answering it correctly saves tens of dollars a day. The question "why did today cost $2,471" has a different answer entirely.

### 2. Why one session dominates, and it is not the model

`agent-spend.md` measured this in August and the finding holds: **cost = turns x ~$1.01, flat across a session's life.** Compaction bounds the context, so turn 14,000 costs what turn 10 costs. The expensive thing is *how many turns*, not which model or how long the transcript.

The mechanism is visible in the numbers above: **949.5M cache reads** on that one session. Cache reads bill at a tenth of input, which is why a billion tokens is survivable - but every turn re-reads the conversation, so a session that takes 1,700 turns pays 1,700 times regardless of tier.

This is `session-boundaries.md` arriving from the cost side rather than the correctness side. That rule was written because long sessions produce **wrong claims** (context conflict). It turns out they are also where the money goes. Two independent arguments, same remedy: one thread, one session, hand off at the boundary.

### 3. The escalation rule already exists, in code, and is switched off

`bot/src/zoe/decompose.ts` implements exactly what this research was asked to design. Two escalation points:

**`pickModel()` - keyword and length based:**

```ts
if (opts.hard) return ZOE_HARD_MODEL;
const strategicMarkers = ['architecture','strategy','roadmap','whitepaper',
                          'brand','launch','governance','tokenomics'];
if (goal.length > 400 || strategicMarkers.some(m => lower.includes(m)))
  return ZOE_HARD_MODEL;
return ZOE_DEFAULT_MODEL;
```

**`modelForCostClass()` - three-tier, and gated:**

```ts
if (process.env.ZOE_TASK_COMPLEXITY_ROUTING !== '1') return defaultModel;
case 'small':  return ZOE_QUICK_MODEL;   // haiku
case 'large':  return ZOE_HARD_MODEL;    // opus
default:       return ZOE_DEFAULT_MODEL; // sonnet
```

Its own docstring says the strong tier "is only reached for a 'large' subtask, which the decomposer is prompted to mark sparingly."

**`ZOE_TASK_COMPLEXITY_ROUTING` is not set anywhere** - not in the project settings, not in `~/.zao/zao.env`. So the router returns `defaultModel` unchanged. The decomposer classifies every subtask and nothing reads the classification.

Defaults, from `bot/src/zoe/types.ts:215-217`: `sonnet` / `opus` / `haiku`, each env-overridable. The ZAOOS project settings already set `ZOE_DEFAULT_MODEL=sonnet` and `ZOE_HARD_MODEL=opus`.

### 4. What the escalation rule should be for lanes

Take ZOE's, with one change forced by the runtime.

**A lane cannot switch its own model mid-session.** So escalation is not a function call - it is *write the handoff, re-boot at the higher tier*. Which means the tier belongs in the **brief**, declared up front, and the escalation path is the handoff system already built.

Concretely:

- **Haiku** - mechanical and verifiable: formatting, index rows, link fixes, dead-code removal. The estate already does this: `CLAUDE_CODE_SUBAGENT_MODEL: haiku` is set globally, so every subagent is already on the cheap tier.
- **Sonnet - the floor.** Grounded edits, doc writing, repo hygiene, board work, most lane work.
- **Opus - deliberate.** Architecture, ambiguous debugging, security-relevant review, and anything where being wrong is expensive. ZOE's keyword list is a good starting vocabulary.

**The honest test for escalation is not difficulty, it is cost-of-wrong.** Today produced six bugs across `zj` and `lane-send`, three of them mine, on Fable - the most expensive tier available. Tier did not prevent them; *reading the output* did. So escalate where a mistake is expensive to discover, not where the work feels hard.

### 5. Cost-of-wrong, priced

`$49.44 per PR` is the day's real unit. That is what a merged artifact costs at current session discipline. Two ways to move it, in order of leverage:

1. **Shorter sessions.** The 69%-of-spend session is the whole finding.
2. **Right tier per lane.** Worth tens of dollars a day, now shipped.

Not: fewer verifications. `confirm-before-claiming-absence.md` explicitly buys correctness with cap, and today's evidence supports it - every wrong claim was one cheap command from being right.

### Honest limits

- **`zao-spend` reports list-price consumption, not an invoice.** On Max the subscription covers it until the cap. These are meter readings, and the real constraint is the weekly cap, not dollars.
- **The `model` column is per-session and coarse** - the top session reads `fable,opus,unknown`, so its $1,718 cannot be attributed to one tier. What is solid is the *session-level* concentration, not a per-model split within it.
- **I did not measure quality by tier.** No claim here that Sonnet is as good as Opus for lane work - only that the cost data does not support Fable-by-default, and that the escalation rule should key on cost-of-wrong.

## Also See

- [Doc 2343 - zj cannot tell IDLE from BLOCKED](../../dev-workflows/2343-zj-wall-signal-quality/)
- [Doc 2352 - Serena is 8 releases behind](../../dev-workflows/2352-serena-version-gap-silent-failures/)
- `.claude/rules/agent-spend.md` - cost = turns x ~$1, measured
- `.claude/rules/session-boundaries.md` - one thread, one session
- `.claude/rules/claude-usage.md` - the cross-surface ladder

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge dotfiles #62 so Sonnet-as-floor is permanent, not just local | @Zaal | PR | 2026-08-21 |
| Set `ZOE_TASK_COMPLEXITY_ROUTING=1` and watch one day of ZOE runs for wrong-tier picks | @Zaal | Config | 2026-08-22 |
| Add `--model` to `zao-lane-boot` and a `model:` field to the brief frontmatter, so a lane's tier is declared not inherited | @Zaal | PR (zaal-dotfiles) | 2026-08-24 |
| Write the lane escalation rule into `.claude/rules/`, keyed on cost-of-wrong, reusing ZOE's keyword list | @Zaal | PR | 2026-08-25 |
| Re-run `zao-spend --days 1` after a day of shorter sessions and compare the per-PR figure against $49.44 | @Zaal | Verification | 2026-08-24 |

## Sources

All measured on this machine, 2026-08-20. No external fetches were needed.

- [FULL - `zao-spend --days 1`] $2,471.77 / 60 sessions; the session table; $49.44 per PR; $0.48 per 1k output. Run twice, ten minutes apart, showing the top session climbing $1,708.18 to $1,718.24.
- [FULL - read on disk] `bot/src/zoe/decompose.ts` lines 236-247 (`modelForCostClass`) and 373-392 (`pickModel`); `bot/src/zoe/types.ts` lines 215-217.
- [FULL - grep] `ZOE_TASK_COMPLEXITY_ROUTING` absent from `.claude/settings.json` and `~/.zao/zao.env`.
- [FULL - read on disk] `~/zaal-dotfiles/claude/settings.json` line 70 (was `claude-fable-5[1m]`, set 2026-08-18 in `f7fdb94`); `CLAUDE_CODE_SUBAGENT_MODEL: haiku` line 4.
- [FULL - `tmux` sweep] 16 of 19 lanes on Fable 5, 2 on Opus 5, with boot times - every lane booted before the settings change inherited Fable.
