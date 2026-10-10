# Newsletter Draft - Sunday October 11, 2026

*Zaal's voice. Build-in-public. Year of the ZABAL.*

---

Today ZOE grew a nervous system.

Not metaphorically. Seventeen commits shipped today, and the through-line is the same in each one: ZOE is learning when to speak and when not to. The Attention Layer is a quiet work loop with a morning message, snoozable nudges, and a feedback mechanism — it watches which taps Zaal takes and adjusts. The X Desk phase 1 is ZOE learning to hold @bettercallzaal's X presence the same way it holds Farcaster. The send budget is a ceiling: twenty gated messages per hour, then defer. The farcaster signer provenance work is ZOE learning to care about cryptographic authenticity at the cast level — whose key signed this, and is it still valid?

All of it off by default. That's the pattern that's working: build the thing completely, put it behind a flag, ship it clean, flip it when ready. No half-finished features in prod. No surprises.

The one that might not be obvious: rules got slimmed from 237k to 102k bytes per turn today. That's not a minor cleanup. That's removing 135k bytes of context overhead from every session that starts. Less to read, faster to be useful, more room for actual work. The history moved to doc 2649 — nothing lost, just filed.

Week 42, day 1 tomorrow. Fractal meeting Monday at 6pm. The five things doc 2636 measured are still on the board. The DreamNet Phase 1 database schema is ready and not yet applied. The WaveWarZ adapter has been open for four days. These aren't blockers — they're decision gates, and the decisions are Zaal's to make.

The build keeps moving. So does the week.

---

**MINDFUL MOMENT**

Seventeen commits, and almost none of them are about features users see yet. Every one of them is infrastructure for something that doesn't exist publicly yet — a quieter ZOE, a version of ZOE on X, a ZOE that knows whose key signed a cast. All of it behind flags.

There's a version of this that feels like spinning wheels. There's another version where all the flags flip in the same week and suddenly the surface changes at once. The second version is only possible because the first version existed — all the careful PRs, all the flags-off defaults, all the doc-before-build discipline.

Build in public, ship cleanly, flip the flag when ready. The flags are tomorrow's surprises. Don't rush them.
