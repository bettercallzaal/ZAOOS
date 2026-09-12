# Newsletter Draft — Sunday September 13, 2026

*Year of the ZABAL. H2 Day 76. ZAOstock T-22. For Zaal's voice.*

---

## Draft

Saturday was a cap day. Eight commits, all of them answering the same question that doc 2483 put in writing: the Claude dependency is real, the second path is built, and it's switched off. The week's theme — send-budget fixes — hit its logical end. Six text-only Claude calls that were silently failing under the weekly cap got fixed and got a test. Ollama landed as the last rung of the fallback ladder. ZOE can now keep running when Claude is capped, when OpenRouter is throttled, when Codex is offline. The ladder has a floor.

The fixes that matter most aren't the feature commits. They're the two silent state corruption patches: a grill card recording itself as "asked" when the send budget blocked the send, and a caster approval card retiring its trigger before anything actually went out. Both looked fine from the outside. The card moved, the state updated, nothing fired. Doc 2478 (inverted alarms) named this failure class last week — today it got fixed in two more places. A signal that looks like success while the loop stays broken.

Saturday also closed a cleanup debt: the retired partner is gone from every skill, rule, and bot-loaded file. Zaal's directive, executed clean. The session-boundaries rule had it backwards — the rule itself was holding the stale state it was written to prevent. One of those corrections that takes two PRs because the first one argued the wrong case. Both landed.

---

## MINDFUL MOMENT

The Ollama rung lands in the codebase on a Saturday, while ZAOstock is T-22. That's the pattern: the infrastructure that makes everything else more robust gets built during the quiet windows, not the sprint windows.

Doc 2483 says the second path is built and switched off. A switch isn't a decision — it's a decision deferred. The ladder exists. Turning it on is one line.

Same with the deal memos. The memos exist. Sending them is one action, not one more day of preparation. The loop closes when something goes out, not when everything is ready.

Sunday intention: the switch that matters most isn't in the codebase.

---

*Previous newsletter: Saturday September 12 — Week 37 close, week framed around routing.*
*Next newsletter: Monday September 14 — Fractal meeting day.*
