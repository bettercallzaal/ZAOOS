# Daily Newsletter — May 22, 2026

*Draft for Zaal. Edit before sending.*

---

The lab found its own bugs today.

Three things that should have been working weren't. Every ZABAL vote cast since the haatz integration shipped has been scored wrong — the API returns 200 OK but with a null score, so every voter's multiplier silently defaulted to 0.5. Half of what it should be, for every voter, silently. The fix is one function call (go to Neynar directly), and it's in PR #592. The second bug is bigger: ZOE has been writing a permanent, per-turn archive to disk since the day she launched, and has never once read it back into context. `readArchive()` exists in the codebase. It's just not called anywhere in the context load path. Every ZOE session is functionally amnesiac past 8 turns — and has been since the beginning. The third: the pre-commit secret scan hook existed in `.husky/pre-commit` but `core.hooksPath` was pointing somewhere else. Nothing was scanning commits. A Telegram token and a test fixture key leaked this month because of that. PR #585 wires it properly.

This is what the lab is for. You build long enough on something and eventually you get to look at it honestly. Today was that day.

The research sprint that ran alongside all this was significant in its own right: the /zao-research skill went through an audit (doc 693) and came back with a real fetch ladder — no more docs written from metadata because firecrawl wasn't installed. The doc library re-research campaign kicked off: wave 1 upgraded 20 Farcaster docs from thin to v2 standard. The ZAOstock + ZAOcoworking database architecture got a final decision (merge coworking into ZAOstock's Supabase, add a `project` discriminator — supersedes last week's "don't merge" call). The meeting skill iterated through 5 versions in one autoresearch loop session. And a Telegram pitch for deploying a tradeable $ZAO token on Avalanche got flagged as almost certainly a scam — two empty shell "client" sites registered the same day, no video calls, and the pitch contradicts the entire soulbound Respect model.

16 PRs are open. Tomorrow is Friday. Weekly recap due at 4:30. The most important thing to ship before noon: merge the vote-power fix and the secret scan.

---

**MINDFUL MOMENT**

There's a kind of discovery that only happens when you stop adding and start reading. Today wasn't a day of new features — it was a day of honest auditing. The vote-power bug, the ZOE archive bug, the inert hook: all of them were visible in the code for months. They just needed someone to look.

That's a pattern worth naming. The lab bias is always toward building: new skills, new docs, new PRs. But the audit loop — doc 694's "117 thin docs," doc 693's "firecrawl wasn't installed," doc 683's ecosystem consolidation — is what turns quantity into something that actually works. You can't outrun debt by running faster.

Tomorrow: merge the bugs out, run the bonfire labeling, do the weekly recap. Then the system wants to be used.
