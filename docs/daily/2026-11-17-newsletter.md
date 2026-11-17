# Daily Newsletter - Tuesday November 17, 2026

*Draft by ZOE Nightly. Zaal's voice. Build-in-public.*

---

Quiet weekend, loud week. The batch that landed between Nov 13 and 16 cleared out some of the longest-standing open items on the board. The Next.js P0 CVE - Day 115, five critical advisories, lockfile pinned at a version with known holes - is done. `next 16.2.10 → 16.4.6`. It shipped in one PR (#4310) and it's on main. That one was embarrassingly overdue and it's good to have it off the list.

The other thing that landed: Biome is now running on `bot/**` as well as `src/**`. Three ZOE files got cleaned as part of that - the iman-desk item 176 deliverable that's been open for a while. Farcaster failover is also finally wired: when the read base answers 200 with an empty list (doc 2418), ZOE now fails over instead of surfacing garbage. These are infrastructure wins, not feature wins, but they're the kind that make everything else more reliable.

This week's decision queue is growing. ZOE has four features built and sitting behind flags: failure memory, the research critic, the Haiku model classifier, and the group suggestions card flow (that one dropped as PR #4317 on Monday). The devz fold is also built and waiting for Zaal to flip `ZOE_DEVZ_FOLD=1` and stop `zao-devz-stack.service` on the VPS. None of these need more building - they need a decision. That's the week's work.

---

**MINDFUL MOMENT**

Five critical CVEs. Day 115. It sat on the board for nearly four months while bigger things moved in front of it. The fix was one PR. The lesson isn't about Next.js - it's about what happens when "not urgent" becomes the permanent state of something that is actually urgent. The ZABAL framework is about knowing what is load-bearing. A dependency with a CVSS 7.5 is load-bearing even when nothing has broken yet. The flag flip decisions feel different - ZOE features, not security holes - but the same question applies: how much longer does the best version of the system sit behind a flag? Decide the flags this week. Don't let them hit Day 115.

