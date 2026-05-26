# ZAO Daily — May 27, 2026

*Draft prepared by ZOE Nightly — in Zaal's voice. Edit before sending.*

---

Juke is no longer a prototype.

We shipped five PRs in one day. Nicky dropped PR #175 — the one that wires room detail, rate limits, idempotency keys, the whole developer surface — and we consumed it the same day. Then we shipped public pages: `/listen` for members (live rooms, upcoming, recordings) and `/juke` as the partnership case study. Recap casts fire automatically when a space ends. ZOE auto-joins as a silent listener. The stale-room cron is running on Vercel Hobby tier. The full lifecycle — room starts, people join, room ends, recap goes out, recording shows up in the archive — works. We tested it in the real world.

That's the Year of the ZABAL in one sentence: don't wait for the full vision, wire the loop and see what happens.

The other thing I'm thinking about today is categorization. We built a new skill — `/capture` — to handle content sources (Reels, podcasts, YouTube) that `/meeting` was never designed for. The difference is subtle: a meeting has attendees, decisions, action items. A Reel has a framework, verbatim claims, and a question: does this map to what we're already doing? These are different extraction primitives. Getting the categorization right means the system knows what to do with the output. Wrong category = wrong workflow = noise. The @pjdlifts ADVANCED Reel (doc 753) was the forcing function. Now it's a first-class skill.

Same logic applies to cold outreach. We finished doc 743 — the full workflow for reaching out to the 2602-row Apollo list. The whole game is signal-based filtering. A prospect with a funding announcement in the last 30 days gets a 5x baseline reply rate. One with no recent signal gets skipped. The message is short, has exactly one ask, and sounds nothing like AI. The research budget is 3-5 minutes per person. You're not trying to close; you're trying to get a reply. Warmth before pipeline. Getting that prioritization right is the same problem as /capture: categorize first, then act.

---

**MINDFUL MOMENT**

There's a pattern across everything we shipped today: distinguish before you act.

`/capture` vs `/meeting` — is this content or a conversation?
Cold outreach — is there a signal, or are we guessing?
Juke's stale-room cron — is this room actually dead, or just quiet?

The failure mode in each case is the same: treat everything as the same type of thing, apply the same workflow, get noise. The win is in the moment before the action, where you stop and ask: what *kind* of thing is this?

ZAO is getting good at that question. The systems are starting to ask it automatically. That's leverage.

Tomorrow: ship the ZABAL Games + ZAOstock announce. That one's been sitting in the queue for four days. Time to close it.

— Z

---

*[Farcaster / newsletter thread — edit as needed before posting]*
