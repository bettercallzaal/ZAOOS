# Newsletter Draft — May 19, 2026 (Tuesday)

*Draft in Zaal's voice — Year of the ZABAL. Build-in-public. For ZAO community + anyone watching.*

---

**ZAOstock is gone from the monorepo. That's a good thing.**

Today we deleted /stock and all its API routes from ZAOOS. Not archived, not disabled — deleted. ZAOstock earned its own home: own repo, own database, own domain. That's what graduation looks like in the ZAO build model. You incubate in the lab until the thing is ready to stand alone. Then you cut the cord cleanly. No symlinks, no drift, no maintenance tax on the parent. The lab stays clean for the next thing.

We also shipped MIT LICENSE to the repo today. Took one PR. It was on the P0 list from a meta-audit (Doc 663) that got written *this morning*. The same-day execution on a P0 is the kind of thing that feels small and is actually everything — it's the difference between a list you review and a list you close. The audit also surfaced 58 doc-number collisions in the research library (165+ docs). That's next week's hygiene pass.

On the ZOE side: social posts now pull from activity across every ZAO repo (not just ZAOOS) and use the real ZABAL voice. We're getting closer to the posts not sounding like a bot narrating commits. The goal is posts that sound like someone building something they care about, because they are. Also shipping today: Bonfires deep-dive (Doc 665). Six integration vectors for wiring ZAO's research corpus into the Bonfires knowledge graph. Phase 1 spec is written. That one's going to make the research library actually queryable.

---

**MINDFUL MOMENT**

There's a pattern in today's work: making things legible before letting them go. The codebase audit, the library hygiene count, the MIT LICENSE. None of it is glamorous. But ZAOstock couldn't graduate cleanly until we knew exactly what it was touching. Bonfires can't ingest the research corpus until the library is clean enough to be worth ingesting. The audit isn't bureaucracy — it's the prerequisite for the next good thing.

The 58 doc-number collisions aren't a failure. They're evidence of parallel creative sessions that didn't coordinate. That's fine. The fix is a pre-commit hook, not a culture change. But noticing the pattern is worth sitting with: what else are we building in parallel that will need to coordinate before it can graduate? ZABAL Games. Frapp-GH. The Bonfires integration. Each of these has a "make it legible" step that comes before the ship step. Knowing that now saves the scramble later.

Build what matters. Audit what you've built. Cut what's ready. Repeat.

---

*The ZAO is 188 members on Base. Building at the intersection of music, culture, and onchain coordination.*
*Follow the build: @bettercallzaal on Farcaster.*
