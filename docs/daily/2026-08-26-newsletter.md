# ZAO Daily — Wednesday August 26, 2026

*H2 Day 58 | 8 days to ZAOstock artist cutoff (Sep 3)*

---

Tuesday's theme was a quiet audit of what we thought we had. Doc 2411 put it plainly: ZOE has thirty tools and uses six. The three we've been documenting as mandatory — context7, Serena, and the memory MCP — are dead on this machine. They appear in CLAUDE.md as "always use" directives. They resolve to nothing. That's the gap between the written system and the running one, and it matters because the vault strategy was being designed around tools that aren't there. Doc 2412 closed the loop: don't wire the vault to dead servers. Doc it, route around it, and fix the root cause when the key is in hand.

The xyOps doc (2414) is the other thread worth watching. Three patterns emerged from running xyOps: the tool recognizes code-shape thinking, it applies well to agent loop work, and it's fastest when the scope is tight. That's three use cases that were guesses before Tuesday and are confirmed observations now. Small thing. Real thing.

The grill fix matters more than it looks. 185 of 385 board cards were silently unreachable — the pagination bug meant they could never surface for a grill session. You had a board that appeared full and was functionally half-empty. Now it grills the whole estate. The Sparq / Colleen / NEXUS problem that prompted `capture-quality.md` was partly about bad captures. Some of it was also that the good cards couldn't be reached. Now they can.

Eight days to ZAOstock artist cutoff. The sponsor email hasn't gone. That's the one that needs Zaal's hands on it, not another doc.

---

**MINDFUL MOMENT**

Tuesday's audit found things that were documented as present and were actually absent. That's not a system failure — that's what audits are for. The lesson isn't "we had bad docs." The lesson is that the distance between "documented" and "working" is measured by running it, not reading about it. Every tool in the stack that gets documented as mandatory should get a liveness check too. One line, one command, one honest result. The ones that fail that check today cost less to fix than the ones that fail it during a festival weekend.

