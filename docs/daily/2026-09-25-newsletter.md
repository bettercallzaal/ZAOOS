# Daily Newsletter Draft — Friday September 25, 2026

*Year of the ZABAL — build in public*

---

ZAOstock T-10. Ten days. We are in the part of the countdown where the decisions are made weeks ago and the work is execution. The Africa Battle Week wraps this weekend — five days of WaveWarZ competitors from across the continent building their moment before they walk into North Creek on October 5. That energy is already in the room.

Thursday was a documentation day in the truest sense: nine commits, six research docs, and almost every one of them arrived at the same finding from a different angle. Orca and Antigravity (doc 2543): the tools to safely drive a Claude Code session from Antigravity already exist in the Orca CLI, first-class, documented — the session that said we needed to build them hadn't read the `orca terminal --help` output. The bot fleet audit (doc 2541): ZOE and the ZAOstock bot ARE the same codebase. The consolidation recommendation from May was correct and was never executed. "Upgrade ZOE vs upgrade the ZAOstock bot" is a false choice — they're one repo, with a diverged copy running on the VPS that nobody noticed had forked. Stripe Buy Button mechanics (doc 2542): the white-card styling issue on `/tickets` is fixed through the Stripe dashboard, not through CSS. The answer was there; we just hadn't looked in the right place.

The research library keeps paying for itself in this way. You don't find things once and move on. You find things, document them, and then six months later the question comes back from a different angle — and instead of re-deriving it, you read what you already know.

---

**MINDFUL MOMENT**

Three separate docs today concluded the same thing: *the capability you think you need to build already exists*. Orca had the safety primitives. The monorepo had the bot. The dashboard had the styling control. In each case the gap wasn't in the tool — it was in the reading.

There's a pattern worth sitting with before the final ZAOstock sprint: most of the things that feel like missing infrastructure are infrastructure you haven't fully read yet. Before building for T-10, spend one hour with what already ships. The leverage is there.

Tomorrow is the W38 weekly recap. Six days overdue. Write it and post it. The build-in-public account goes quiet when recaps slip — and the WaveWarZ Africa Battle Week footage is the kind of week worth showing.

---

*ZAOOS · build-in-public · thezao.xyz*
