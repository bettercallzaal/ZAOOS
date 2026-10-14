# Newsletter Draft - Thursday October 15, 2026

*Zaal's voice. Build-in-public. Year of the ZABAL.*

---

We went on-chain yesterday. Not to launch something — to read what the chain actually says versus what we thought it said.

WaveZStation has done 234 buys across 35 wallets since deploy. 365.94 USDC is sitting unclaimed — 18.7% of everything ever sold — and 20 of the 35 buyers have never hit claim. The "pool size" number on the site is gross sales, not the pool. It's off by a factor of 2.2, and it's been that way long enough that it misled our own planning. That's doc 2668. Fixing the label is a single afternoon. The site is working fine; it's telling the wrong story.

The improvements doc (2670) ranked seven changes by effect on volume and by effort. The top two are both small: give every song its own link preview (right now every shared song shows the same blank card, same title, same description), and tell holders when they have money waiting. The correlation between song sales and buyer count is 0.88. We don't have a ticket-size problem. We have a 35-wallet problem. The next unlock is wallet 36, not a bigger buy from wallet 12.

Alongside the WaveZStation work, the ZAO V3 newcomer audit landed (doc 2669). Nine decisions. The loudest one: the main call-to-action on the ZAO — the "join" button — sends people to `/member/join`, which is a 404 on the live preview. Not broken in dev, not broken in theory. Broken in prod, right now, for anyone who taps it. That's the first fix before December 1. The rest of the Season 3 blockers follow: the manifesto capture session, the Snapshot space quorum and delay (currently null), the reviewer ask for the OG + ZOR wrapper. All are named with their source. The work is clear. The calendar is 47 days.

Three PRs are in hold:licence queue (#3922, #3936, #3937). They're research docs, all waiting on the same licence question. That question is now the bottleneck for the merge policy itself merging. One decision unblocks all three.

---

**MINDFUL MOMENT**

Two deep research passes in one afternoon. Different questions — WaveZStation revenue and ZAO onboarding — but the same pattern in both findings: something important was invisible because the system reported a different number.

The pool size read as 1,947.30. The real claimable pool is 365.94. The join flow read as "working." It 404s. Both were quietly wrong. Neither broke anything you could observe from the outside. Both would stay wrong until someone went and read the source.

That's the argument for ground truth passes. Not because the system lies — it doesn't mean to — but because summaries compound. A memo quotes a doc, a doc quotes a metric, and somewhere upstream the metric started measuring the wrong thing. The only fix is to go read the thing itself.

Do one ground truth pass today. Pick the number you trust most and go see where it comes from.

