# ZAO Daily — Tuesday June 10, 2026

*Draft by ZOE — for Zaal to send/edit*

---

The keyless fetch trio shipped. X via FxTwitter, Farcaster via the Haatz Snapchain mirror, Reddit via Redlib public instances — three social data fetchers, zero environment variables, zero OAuth, zero config. Fork the repo, `chmod +x`, run. That's it. The ZAO research pipeline has been pulling data from these networks for months. Now those scripts are forkable by anyone without any setup. This is what build-in-public actually looks like: not just sharing what you built, but making the tools replicable.

Jose ran his ZABAL Games workshop last night. On-chain musician story and music ads coordination — the session was about how a musician's on-chain activity becomes a credible portfolio for brand deals and sync licensing, without a label in the middle. The roster is now: Carlos (Bonfires/vibe-coding, done), Zaal (ZAO Fractal intro, done), Jose (music ads coordination, done), Arun (~June 20, AI-automated music marketing), Rodo (July, DeSci/hackathon design). Five teachers, five disciplines, all pointing at WaveWarZ as the thing they're building toward.

The ZAOcowork audit landed in Doc 825. One map of the entire system: 23 tables, 460 tasks, three machines, one Supabase hub, two API surfaces (internal session + external bot token), one snapshot drift problem on the bots box. The cowork system is running production workloads across Vercel, a COWORK box (187.77.3.104), and a BOTS box (31.97.148.88) — and before this audit there was no single document that mapped how they connected. Now there is. The admin `/overview` dashboard is live too: repo map, bot fleet, tooling catalog, all in one place.

---

**MINDFUL MOMENT**

The keyless fetch trio and the architecture audit have the same energy: making something that was already working into something anyone can see and use. The fetch scripts existed. The cowork architecture existed. Neither was legible. Legibility is its own kind of work — not flashy, but the difference between "we built this" and "here's exactly how it works, here's how to run it, here's the map." ZAO has 825 research documents now. The goal was never to accumulate docs. The goal was to make the work reproducible. Those are the same thing.

June 14: Bonfires refactor lands. Five days.

---
