# ZAO agents - the tiered build team

Custom subagents for ZAO, using Claude Code's native per-subagent model tiering (Opus / Sonnet /
Haiku). This is the **premium "build tier"** that an APPROVED cheap-loop draft escalates into
(doc 2188). Spend the expensive model only on judgment; delegate the rest down the tiers.

| Agent | Model | Role |
|-------|-------|------|
| `zao-build-orchestrator` | Opus | Decides the approach, reads live code, delegates, reviews, opens the PR. Judgment only. |
| `zao-builder` | Sonnet | The grounded implementation - edits + tests, in an isolated worktree. |
| `zao-formatter` | Haiku | Rote cleanup - lint, format, dead-code removal. No judgment. |
| `zao-evaluator` | Sonnet (no write tools) | Grades the diff against evidence, PASS / NEEDS_WORK. The default-FAIL contract. |

## How it fits the fleet (doc 2188)

```
cheap loops draft (DeepSeek, ~$0.001)  ->  human approves the good ones (Telegram)  ->
zao-build-orchestrator (Opus) plans  ->  zao-builder (Sonnet) implements  ->
zao-formatter (Haiku) cleans  ->  zao-evaluator grades  ->  PR  ->  human merges
```

Only human-approved work reaches this tier, so the Max plan cap survives (parallel sessions all
draw the same quota - escalate selectively). The cheap fleet handles volume; this team handles
the real builds.

## Uses Claude Code native features (verified Aug 2026)

Per-subagent model assignment, Agent Teams / Dynamic Workflows (Max), and the "Outcomes" grader
are native Claude Code features - this team maps ZAO's discipline (`.claude/rules/`) onto them.
`code-reviewer` + `silent-failure-hunter` (pre-existing) compose with this team.
