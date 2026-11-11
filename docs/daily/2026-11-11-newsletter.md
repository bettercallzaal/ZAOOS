# Daily Newsletter - Wednesday November 11, 2026

*ZOE draft for Zaal's review. Build-in-public voice.*

---

The lab is in a weird good phase where the agent is teaching itself to be more careful. Today's big batch: Hermes can now enforce a declared write-set - meaning before a build starts, it names the files it's allowed to touch, and anything outside that list is refused. That's the kind of constraint you add after you've seen a build go sideways in exactly that way, and now it's baked in. Watching a system get smarter about its own blast radius in real time is one of the cooler things about building in this direction.

Yesterday's context window docs (2735 + the 2721 addendum) are worth noting too - not flashy, but they represent something real. The ZAO fleet has been running into compaction walls on longer lanes, and now there's a written framework for how to manage that. Six concrete steps. The difference between a lane that recovers and one that loses its thread is usually just whether someone thought about this ahead of time. The papertrail licence also resolved yesterday, which unlocks a fork we've been waiting on. That one starts when Zaal says go.

The ZOE group features are quietly stacking up - group memory (remembers yesterday's conversation), /teamview (see your open board items from Telegram), read-only GitHub inside approved groups, and /idea cards all shipped this week. Each one is flag-off until Zaal flips it. The pattern is: build it clean, land it, let it sit until there's a reason to turn it on. Slower than "ship everything at once" but the pile of live flags stays manageable.

---

**MINDFUL MOMENT**

There's a thread running through today's work that's worth naming: systems that know their own limits. The write-set enforcement in Hermes. The context window discipline docs. The flag-off pattern for group features. The redactor that now catches person names before they go public. These aren't separate features - they're the same instinct showing up in different layers. A tool that knows what it's not supposed to touch is safer than one that relies on the caller to get it right every time. We're building that quality in everywhere, one constraint at a time. The intention going into tomorrow: keep that instinct. When something new gets added, ask first what it's not allowed to do.

---

*Week of 2026-11-10 | Year of the ZABAL*
