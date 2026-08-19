# Lane Autonomy - non-gated menus auto-proceed

Adopted 2026-08-19 (pipeline-upgrade grill, Zaal approved all five upgrades;
this is upgrade 4). The finding that forced it: at the day's audit, 9 of 9
active local lanes were WAITING on Zaal - most on reversible work-scoping
menus, not on gates. One human was the serialization point for the whole
fleet, and the fleet's own questions were the lock.

## The rule (behavior-changing, every lane and loop)

**A lane only BLOCKS on a question when the answer is genuinely Zaal's to
give. Everything else: take the recommended option, log it, keep working.**

A question is ZAAL-GATED (block and wait) when ANY of these is true:
- money moves, or spend is committed
- anything goes PUBLIC or outbound (post, send, publish, DM)
- the action is IRREVERSIBLE (delete, on-chain, permaweb, key rotation)
- the answer is a FACT ONLY ZAAL KNOWS (who a person is, which file he
  meant, what he intends) - guessing here is fabrication, not autonomy
- Zaal explicitly asked to be asked

Everything else - scope picks, ordering, which reversible approach, whether
to include a PR-only sub-task - is NOT a gate:
1. Take the RECOMMENDED option (the one you would have listed first).
2. LOG the choice where Zaal will see it: one line in the lane's report +
   the board card note ("auto-proceeded: <choice>, override anytime").
3. Keep working. Zaal overrides at his next tap window; every auto-taken
   choice must be cheap to reverse - that is what made it non-gated.

## Guards

- When in doubt whether something is gated, IT IS GATED. The bar for
  auto-proceed is "obviously reversible and obviously not Zaal's fact".
- Auto-proceed never stacks onto outbound: a non-gated scope choice that
  LEADS to a gated action still stops at the gate.
- The log line is mandatory. An unlogged auto-choice is indistinguishable
  from drift (state-claims.md: name the source of every decision).
- This does not change AskUserQuestion in INTERACTIVE sessions where Zaal
  is present and typing - it governs lanes running semi-attended.

## Source

Zaal 2026-08-19: approved as upgrade 4 of 5 in the pipeline-upgrade grill,
after hand-tapping three lane menus himself ("can u tap them"). Evidence:
the 2026-08-19 workflow review (zao-vault/notes/workflow-review-2026-08-19.md,
throughput section). Siblings: `agent-loops.md` rule 8 (the gates that stay),
`feedback_just_do_reversible_ask_irreversible` (the same line, per-action),
`handoff-discipline.md` (tap windows are the override surface).
