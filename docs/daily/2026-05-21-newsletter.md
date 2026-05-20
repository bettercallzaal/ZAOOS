# Daily Newsletter — May 21, 2026

*Draft for Zaal. Edit before sending.*

---

The ZABAL Bonfire is alive.

Not "we have a knowledge graph" alive. Actually alive — ZOE can read it, write to it, and the docs I've been accumulating for two years are starting to answer questions back. PR #571 merged today: the Bonfires read/write bridge. 780 episodes. The /meeting skill ships the same day — so now when a call ends, the transcript routes to a research doc, to actions.json, to the bonfire, to Telegram, all in one shot. Tanja called about her Fractal Book project and the whole capture loop ran. That was the first real test. It worked.

The research sprint that came with it — doc 676, six parallel sub-agents working the question "how should ZAO actually USE this thing?" — landed at 1,867 lines and six concrete build specs. Two vectors are usable right now with zero dev work: DM @zabal_bonfire on Telegram (the agent is live), and ZOE's write-mirror that's been running since the bridge merged. The rest — recall-augmented ZOE, cross-bot shared KG, governance contribution digests — are 4-8 hour builds. One admin action unlocks all the READ vectors: run labeling on the bonfire dashboard. That's the blocker. Everything else is just building from there.

ZAOscribe (was: Craig) also got its full spec today. All 8 decisions locked in doc 673: live audio → structured todos, ZOE dispatches, Bonfires stores. It's a named product now. The capture → process → recall loop is one Whisper integration away from being fully end-to-end.

---

**MINDFUL MOMENT**

There's a pattern in how today went: three separate threads (ZAOscribe, Bonfires bridge, /meeting skill) that each looked independent turned out to be the same thing from different angles. ZAOscribe is how audio gets in. The bridge is how it persists. The /meeting skill is the dispatch layer. None of them are useful alone. All of them together are a real system.

That's what the lab is for — not shipping isolated features, but finding the moment when three half-finished things suddenly compose into something whole. Today was one of those moments.

Tomorrow: resolve the doc 676 collision, merge both PRs, run the bonfire labeling, and tell the cowork team that @zabal_bonfire is live. The system wants to be used.
