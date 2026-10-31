# Newsletter Draft - Friday October 30, 2026

*ZOE Nightly draft. Zaal's voice. Build-in-public.*

---

## Draft

---

**Year of the ZABAL - Day 303.**

This week the lab went through something I've been putting off for a while: a proper rules audit. Every rule in ZAOOS now names the tool or hook that actually enforces it - not just a promise written in markdown, but a mechanism. Went from 0 of 41 rules wired to 41 of 41 documented. The ones that say "none yet" are honest about that now, which is better than pretending. That kind of infrastructure work doesn't ship features, but it's the difference between a system that holds and one that drifts.

ZOE got a /status command this week. If you ask ZOE what it's been up to, it tells you the last ten things it did. Small thing, big shift - agents should be observable. I also audited the /zao-research skill and filed six upgrades. The skill is the research brain. Better prompts in, better research out.

Tonight's batch of PRs is interesting: a doc mapping out how the lanes run when I'm away, an audit finding that the ZAODEVZ guide bot is actually PlugZ (a Discord welcome bot in disguise), and the first config for self-hosted Postiz - a social scheduler I can run on the VPS so cross-posting doesn't go through a third-party's servers. Piece by piece the ZAO stack gets more self-contained.

---

**MINDFUL MOMENT**

The away loop doc (doc 2721) and the rules mechanism pass (41/41) landed in the same week. Both are about the same thing: what does the system do when you're not watching? A rule with no mechanism is a hope. A lane with no handoff is a dependency on your presence. The work of building is also the work of making yourself less necessary - so the thing you built can actually go.

---
