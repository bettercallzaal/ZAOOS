# Newsletter Draft — April 29, 2026 (Tuesday)
*Author: Zaal | Voice: Year of the ZABAL — builder, build-in-public*
*Status: DRAFT — review before sending*

---

## Subject Line Options

- "We built the ZAOstock team page in one day."
- "29 PRs on a Monday. That's not a typo."
- "From blank page to leaderboard, bio editor, and directory — all Monday."

---

## Draft

Monday. Fractal call at 6pm. Somehow also: 29 pull requests merged.

The ZAOstock team page went from nothing to fully functional in a single day. Members can now write bios in a real WYSIWYG editor (Tiptap — same stack as Notion), add links, track their onboarding completeness percentage, see a leaderboard, browse the team directory, and reach out directly. Pass C1 landed in the morning. Pass C2 landed by afternoon. The CI fix that unblocked the merge came in the evening. By the time the Fractal call started, the feature was live.

We also dropped seven research docs in one day — Restream's developer API, Snap's Farcaster best practices, darkzodchi's CLAUDE.md thread, the Monteux School for musicians in Hancock, Andy Minton's YapZ episode — and one open PR that could save us $7,000 a year. PR #361 routes Hermes's cheap, fast diffs to sonnet/haiku instead of always burning opus. 34% cost reduction. The complexity classifier is conservative on purpose: anything touching security substrings, SQL, or child_process stays on the bigger model. Simple doc fixes go fast and cheap. We're running it with `HERMES_ROUTING=on` for 24 hours before flipping permanently.

Three blockers are on Day 17. ZabalConviction still hasn't deployed to Base. AgentMail is still blind. Agent wallets still need funding. None of these are hard. All three are waiting on focus — not on code. Today was a reminder that when we actually show up to build, the corpus compounds fast. Tomorrow those three tasks get closed.

---

## MINDFUL MOMENT

Twenty-nine pull requests on a Monday. Some days the numbers don't matter and some days they're the whole point.

The ZAOstock team page didn't exist yesterday morning. Today members can write rich bios, link their socials, see where they rank on a leaderboard, find each other in a directory, and check off their onboarding. That's not a feature — that's a context shift. The community now has a mirror. They can see themselves as a team.

There's a pattern here: the research docs, the bot fixes, the Hermes cost routing — none of it was planned. The day opened with a Fractal call on the calendar and a blank ZAOstock team page. We shipped both. One was a meeting, one was a product.

Intention for Tuesday: close the three Day 17 blockers. Not because they're exciting — because they're the gate. ZabalConviction deploy. AgentMail. Agent wallet funding. Three commands, one wallet, fifteen minutes. The downstream unlocks (BANKER burn loop, ZOE inbox, autonomous trading) are worth more than anything we shipped today.

Close the gate. Then build.

---

*[End of newsletter draft — edit before sending · save to content-bank if not used today]*
