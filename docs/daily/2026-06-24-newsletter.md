# Daily Newsletter Draft — Wednesday June 24, 2026

*Zaal's voice | Build-in-public | Year of the ZABAL*

---

Zero open PRs.

I don't mean we cleared the queue and left it empty for a few hours. I mean we went into Tuesday with 4 PRs open, merged all 4, then opened and merged 6 more — #934 through #939 — and ended the day at zero. The board is clean for the first time in weeks.

Today's focus was test coverage and one security fix that mattered. The security one: `fc-identity/check` was leaking internal error message strings back to callers. Small thing, but in identity routes it's exactly how you give an attacker a free enumeration window — submit bad input, read the stacktrace, learn the schema. PR #934 stops that. The tests: `music/metadata`, `search`, `activity/feed`, `respect/leaderboard` — 21 new cases across 4 routes. The pattern from doc 841 is holding: audit finds the gap, a PR closes it, a test locks it in. No gap survives two passes.

The agents/DOCTRINE.md finally merged today (#920). It's not a feature. It's an operating constitution — six invariants that every autonomous loop in ZAOOS runs under: ground truth from the repo, never from memory; escalate before irreversible; one task per loop; no silent self-modification. Wrote it after reading proof-531 closely (doc 888). ZOE and Hermes were running without a shared contract for ambiguous edges. Now there's one.

---

**MINDFUL MOMENT**

The empty PR queue is a snapshot, not a state. Tomorrow it fills again. But there's something in the practice of clearing — not just pushing to main, but the full cycle of: audit surfaces a gap, you scope the fix, you write the test, you close the PR. Each one is a small proof. The stack is provably safer than it was this morning. Not "we think it's better" — provably. The tests are the proof. That's a different relationship to the work than shipping features and hoping. Year of the ZABAL is partly about this: knowing what you built, not just that you built something.

---

*Draft — review before sending*
