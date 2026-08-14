# Newsletter Draft — Saturday August 15, 2026

*Year of the ZABAL. H2 Day 47. Weekend — circle_id FK deadline day.*

---

Friday closed Week 33, and the last three PRs were archaeology more than construction. One of them found that the Reddit OAuth fix — the one people kept searching for — had been written on July 12 and saved with `.bak-redlib` in the filename. It looked like a superseded file. It was the real one. Two separate lanes each burned an hour on the walled redlib path before someone finally measured instead of assumed.

That's the pattern this week kept returning to: things that existed but weren't findable, or things that ran but left no record. The orphan branch audit (doc 2273) found 120 branches that opened and never proposed a PR — 88 of them authored by Claude. Branches from April. Work that happened and then went quiet. Not deleted, just invisible. The branches are the symptom; agent-loops.md rule 35 is the rule that was supposed to catch it.

The other finding was a silent bug in the work loop. When research comes back empty, the system counts it as a success — charges the daily cap, deletes the work, emits a receipt that says `resultType: 'success'`. Zaal, that's not a success. That's a deletion with good paperwork. The spec (doc 2272) and the fix (PR #3076) both landed Friday. Park the work. Don't delete it. A parked item costs nothing and can be asked about. A deleted item is just gone.

Week 33 was ~40 commits. The ops items didn't move. H2 midpoint is Tuesday.

---

**MINDFUL MOMENT**

Friday ended with an orphan branch list. 120 branches. April through August. Work that was done but never proposed.

The interesting thing isn't the list — it's that it had to be audited at all. All the work is there. Every commit is visible. But "done" and "proposed" and "reviewed" are three different things, and we've been treating "committed" as if it means all three.

The same shape shows up everywhere this week. The Reddit fix was committed. The failed research runs were committed as success. The vanishing dependencies were committed as present. The signal was there; the reading of it was wrong.

You can't automate legibility. You can automate the work. But someone still has to read the result and say what it is.

Tomorrow is the circle_id FK deadline. That's not a technical task — it's a decision. Implement, descope, or extend. No amount of commits changes that.

---

*Draft for Zaal's voice — edit before sending.*
*H2 midpoint: Tuesday Aug 18. ZAOstock artist cutoff: Sep 3 (19 days).*
