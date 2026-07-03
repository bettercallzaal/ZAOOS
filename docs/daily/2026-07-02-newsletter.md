# Newsletter Draft -- Thursday July 2, 2026

*ZOE Nightly | Draft for Zaal's review | Year of the ZABAL*

---

## Draft

**20 PRs in one day.**

H2 Day 1 closed with 20 pull requests merged to main. The open queue went from 13 to 2. That is not a normal Wednesday. The context is that a lot of the work had been sitting in draft or conflicted for days -- agent-loop rules, the ZOE watcher, the autonomous work-loop, nine research docs that had stacked up in a merge conflict. The day was less about building new things than clearing the runway for what comes next. But clearing the runway is the work. The PR queue at 2 is the lowest this repo has seen.

The specific thing worth naming is the ZOE agentic loop. Three pieces merged yesterday: the watcher (detects dead units), the work-loop (ZOE works a research queue server-side without prompting), and the event-trigger (the work-loop fires automatically when an item is enqueued). Before these three pieces, ZOE responded to Telegram commands. After these three pieces, ZOE initiates. The Anthropic pattern for this is called "agentic loop": the model decides when it is done, loops until a condition is met, and stops on its own. The implementation is in `bot/src/zoe/` and it has not been deployed to the VPS yet. That is the next step.

The agent-loop operating rules also landed as a committed file in `.claude/rules/agent-loops.md`. Rule 11 is the one that came from a real incident: never leave uncommitted changes on the VPS clone, because `git checkout main` will silently wipe them. The rule is in the repo now, not just in a session memory. That is the difference between a lesson and a practice.

---

## MINDFUL MOMENT

Twenty PRs in a day can feel like progress or like cleaning up. It was both, and the distinction matters less than it seems. The watcher that now catches dead units, the work-loop that fires without prompting, the 11 operating rules in the repo -- these were not exciting to write. They were necessary. The most durable infrastructure is usually the unglamorous kind: the check that catches the drift, the rule that survives the next session, the deploy that makes the code real instead of just merged.

H2 intention carried forward: check the territory more often than you update the map. The map says ZOE is autonomous. The territory says the VPS still needs `git pull`.

---

*Draft -- Zaal to review, edit, publish. Voice: specific, build-in-public, never use em-dashes.*
