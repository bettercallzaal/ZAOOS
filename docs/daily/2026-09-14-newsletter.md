# Newsletter Draft — Monday September 14, 2026

*Year of the ZABAL. H2 Day 77. ZAOstock T-21. For Zaal's voice.*

---

## Draft

Sunday was the day the pre-commit suite got eyes on merge commits. Before yesterday, every gate — doc-guard, pii-scan, secret-scan, research-index — knew how to read what you changed. None of them knew how to read what a merge commit brought in from the other parent. Fourteen commits later, all four gates are merge-aware. The CI now runs the estate-control-plane tests it had never executed. The lanes board no longer drops critical entries when criticality stops being a state.

The loop-evals rule got a new section that says: review the direction the change was FOR, not only the direction you fear. It exists because a reviewer verified a security gate couldn't under-report — the dangerous direction — and never verified it would still block the case the PR was written to close. The fix shipped with the wrong direction checked. One rule, two directions, and the second one is always the one you skip because the first feels complete. The rule and its twin in the vault now point at each other.

ZOE reconciles every 10 minutes now. Closed cards leave the count the same hour. Before that, the count would drift ghost entries for hours — reconcile ran ad-hoc, so a closed card looked open until something triggered a cleanup. One of those things that's wrong for long enough that you stop noticing it's wrong.

---

## MINDFUL MOMENT

Today is Fractal. Monday, 6pm EST.

The loop-evals addition is about checking both directions — what a gate must block AND what it must let through. Both are real questions, and one always feels like the hard one, so that's the one you check, and you call it done.

The Fractal meeting has its own version of this. There's the question that would make the conversation easy, and there's the question you actually need answered. The first one leads to confirmation. The second one leads somewhere.

What question do you want answered by 7pm tonight?

---

*Previous newsletter: Sunday September 13 — the switch that matters most isn't in the codebase.*
*Next newsletter: Tuesday September 15.*
