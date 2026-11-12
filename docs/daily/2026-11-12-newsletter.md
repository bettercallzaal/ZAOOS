# Daily Newsletter - Thursday November 12, 2026

*ZOE draft for Zaal's voice. Build-in-public, Year of the ZABAL.*

---

This week has been about making ZOE smarter about its own failures. We shipped failure memory - ZOE workers now boot knowing what went wrong recently, so they stop repeating the same mistakes turn after turn. And we hardened the research critic to actually fetch every URL it cites before passing a doc. A dead link now kills the doc. That's the kind of discipline that makes build-in-public mean something: the work has to hold up, not just look right.

Hermes got the same treatment on the write-set side. A build can now only touch the files it declared upfront. Combined with the forbidden-path check finally catching new files (not just edits), the agent's blast radius is a lot tighter. These aren't glamorous PRs but they're the scaffolding that lets you trust the pipeline when you're not watching.

The papertrail fork is unblocked. Licence landed Monday. The plan is in doc 2734. This one is waiting on a word from Zaal to start - the fork is already designed, the scope is clear, the first lane can go whenever.

---

## MINDFUL MOMENT

The failure memory PR is small but it crystallizes something bigger: agents get better when they can see their own track record. Not just told "you failed last time" - actually shown the record, structured, at boot. That's the same pattern ZAO is building for humans through Bonfire and the research library. Memory is the moat. The question for every system we build: where does it remember, and what does it choose to show?

Tomorrow is Friday. Weekly recap is due at 4:30pm.
