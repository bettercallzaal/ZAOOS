---
topic: community
type: guide
status: research-complete
last-validated: 2026-09-22
superseded-by:
related-docs: "2308, 2522"
original-query: "[STANDARD] How to give feedback to bounty and contest entrants that makes them come back and improve - and a draft-then-final submission flow for daily poidh bounties (submit or tag a draft before end of day, get feedback, submit a final before the close). For BetterCallZaal's daily ZAOstock poidh run, where the same ask runs three days in a row."
tier: STANDARD
---

# 2536 - Feedback that brings bounty entrants back, and a draft-then-final flow for the daily run

> **Goal:** Replace ad-hoc feedback on poidh entries with a shape the contest literature and the two platforms that do this at scale (99designs, Ludum Dare) have already measured, and give the 13-day ZAOstock run a draft-then-final rhythm that fits a 24-hour bounty.

**Why now.** Bounty one (poidh 1409, 2026-09-21) drew six entries. Zaal wrote feedback for all six by hand, rewrote it three times in an hour ("this isnt great feedback and doesnt feed very human", "these arent necessary to say", "i think theres a lot more we can do to be intentional about this"), and asked for the research. The same ask runs three days in a row so improvement is visible, then a three-day video round. Feedback is the mechanism that makes "three days in a row" mean something.

## Key decisions

| # | Decision | Because |
|---|---|---|
| 1 | **Give every entrant feedback on their FIRST entry, the same day.** Not only the winner. | Feedback on a user's first submission is what predicts whether they ever make a second (Sun et al. 2023). Gross 2017: a 1-star entrant who sees their rating goes from a **26% to a 51%** chance of improving on the next entry; the effect is largest for the weakest entries and smallest for the best (4-star: 6% to 11%). The people you are least tempted to write to are the ones the feedback moves most. |
| 2 | **Make the improvement line DIRECTED and SPECIFIC: what would have won, in one sentence.** Warmth around it is fine; the sandwich is not the active ingredient. | Wooten and Ulrich 2017, six live contests: *directed* feedback (correlated with what actually wins) raised participation and average quality; *random* feedback did not. Jiang and Wang 2019, 9,771 contests: text comments work by revealing the sponsor's taste, which lowers the entrant's risk of wasted effort. A compliment does not carry taste; "put the date on it" does. |
| 3 | **Individual feedback goes PRIVATE (DM). Public gets the winner, the thanks, and the next ask.** | Gross 2017 simulations: full public feedback raised top-rated designs **5.5x** but cut participation by exposing who is ahead; **private feedback kept the improvement and lost less participation**, and was the best policy tested. The one public comment Zaal posted on the bounty thread plus individual replies is close to this already; move the individual half to DMs where the platform allows. |
| 4 | **Do NOT publish a ranking of the entrants.** A pick, yes. A 1-to-6 order, no. | Dargahi and Namin 2020, ~500 participants: ranked feedback raised quality most but rated feedback is what raised the chance the top quartile *revised and resubmitted*. Gross: disclosure of standing is the part that drives people out. Rank privately for your own pick; tell each person only where they stand against the bar. |
| 5 | **Draft-then-final, two checkpoints inside the 24 hours.** Tag a draft by 12pm ET, get one line of direction, final claim by the 5pm close. | 99designs runs every contest as a **4-day qualifying round, up to 6 finalists, 3-day final round** with feedback in between, and tells sponsors to log in **at least once a day** to give it. Jiang, Huang and Beil 2022: feedback given in the **second half** of a contest beat feedback throughout. A mid-window checkpoint is that policy scaled to one day. |
| 6 | **Ask entrants to comment on one other entry.** Say the pick takes it into account. | Ludum Dare requires **20 ratings** for an entry to place and surfaces entries by how much feedback their maker gave; entrants report getting back **70 to 80%** of the feedback they give. itch.io's founder, running GMTK with ~3,000 entries: "Comments are definitely more work than simply leaving a rating, but they solve the quantity/quality issue." Peer feedback builds the community half; sponsor feedback builds the come-back half (Sun et al. 2023). |
| 7 | **Expect feedback to shrink the field slightly and raise the floor.** That is the trade, and it is the right one for a three-run ask. | Gross: feedback "reduces participation but improves the quality of subsequent submissions"; the net effect on high-quality output was positive in every simulation, and "perseverance is substantially more important to successful innovation in this setting than talent or luck". Three runs of the same ask is a perseverance test by design. |

## What day one actually looked like, as the baseline

Measured from `bettercallzaal/poidhz`, 2026-09-21 and 22 (`rounds/daily/d01/`, `scripts/claim-report.py`, chain reads by the Zora lane):

- **6 entries, 4 in time, 2 after the close** (one by 59 minutes, one by more than an hour).
- **2 of 6 ran out of clock on video specifically**: the only video came in late, and the best-looking still was made *instead of* a video the entrant had planned. A 24-hour window is what suppressed the format Zaal wants most.
- Feedback was written after the close, for all six, and rewritten three times. The versions that survived were **short, one thing to do next, and an invitation** (`clip-20260922-055123-feedback-short-six`). The versions that were cut were the ones carrying a second instruction ("credit attabotty on the artwork") that turned out not to be actionable.
- The public thread on poidh got one comment covering the round; the individual notes went as replies on each entrant's own post, which is public.

The literature above says three of those four instincts were right (all six, short, one thing) and one was not (individual feedback in public).

## The feedback shape, per entry

Written for a DM or a private reply. Under 400 characters is enough; the research effect is in the *direction*, not the length.

```
1. The one thing this did that the ask needed. Specific to the piece, not "great work".
2. The one change that moves it closest to winning. One. In the entrant's own terms.
3. Where it sits against the bar, not against the other entrants. ("Every fact is on it, it is
   printable as is" / "No date on it, so it cannot be used yet.")
4. When the next round closes and what it wants most.
```

What to leave out, with the reason:

- **A second improvement.** Gross's direction effect is one step at a time; two instructions halve the chance either lands.
- **The ranking.** Decision 4.
- **Anything the entrant cannot act on.** "Credit the artist on the logo" was cut on 2026-09-22 because there is no good way to do it; the credit belongs in the caption. If you cannot say *where* the change goes, it is not a change.
- **The vote mechanics, the payout, the leaderboard.** True, and not feedback. They go in the public post.

The compliment-sandwich question, answered by the evidence rather than by taste: none of the five studies tested sandwich versus no sandwich. What they tested is whether the *improvement* line is correlated with what wins. So: open warm because it is Zaal's voice and it costs nothing, but the sentence that does the work is #2, and it must be concrete.

## The draft-then-final flow for a 24-hour bounty

poidh has no draft state: a claim is a claim, and an entrant can file more than one (Gross-style revision is possible; bounty 579's own text says "You can make as many submissions as you like"). So the draft lives on the entrant's own post, not on poidh.

| When (ET) | Who | What |
|---|---|---|
| Opens (~5pm the day before) | Zaal | Cast. The description says the two checkpoints and what the round wants most. |
| **By 12pm** | Entrant | Post the draft publicly and **tag @bettercallzaal** (X) or reply in /zao (Farcaster). Not a poidh claim yet. |
| **12pm to 2pm** | Zaal | One line of direction per tagged draft, by DM or private reply. The 99designs "once a day" habit, compressed. This is the Jiang-Huang-Beil second-half feedback. |
| **By 5pm** | Entrant | File the final on poidh. If they filed a draft claim too, the later claim is the one judged. |
| 5pm | Zaal | Name the pick live on Twitch; entrants argue their own case. Contributor vote follows. |
| Same evening | Zaal | Private feedback to everyone who filed, using the shape above. Public: winner, thanks, next ask. |

Two rules that make it work:

1. **A draft that was tagged and then revised beats an equal final that was not.** Say so in the description. It rewards the behaviour the literature says compounds (Gross: less-talented players who respond to feedback outperform more-talented ones who do not).
2. **Late is late, and late gets the same feedback.** Day one's two late entries got the "enter it again tomorrow" note. Keep that: a late entrant with a draft checkpoint tomorrow is a returning entrant.

What the checkpoint costs Zaal: one pass at about 12pm, one line per draft. Six entrants is ten minutes. It is the single highest-leverage ten minutes in the day, on the evidence above.

## Comparison of feedback policies, from the sources

| Policy | Participation | Average quality | Top-end quality | Source |
|---|---|---|---|---|
| None | highest | lowest | ambiguous | Gross 2017; Wooten and Ulrich 2017 |
| Public, throughout | reduced (selection effect) | up | up 5.5x top-rated in simulation, but attrition | Gross 2017 |
| Public, second half only | better than throughout | up | up | Jiang, Huang and Beil 2022 |
| **Private, directed** | **least attrition of the feedback policies** | **up** | **up** | Gross 2017 (best simulated policy) |
| Rated (absolute) | top quartile revises more | up | - | Dargahi and Namin 2020 |
| Ranked (relative) | - | up most | - | Dargahi and Namin 2020 |
| Random | up (participation), not quality | no | no | Wooten and Ulrich 2017 |

The row this run should live on is the bold one.

## Also see

- [2308 - POIDH weekly ZAO video competition spec](../2308-poidh-weekly-zao-video-competition-spec/) - the earlier recurring-competition design; this doc supplies the feedback and checkpoint mechanics it lacked.
- [business/2522 - poidh live bounty market](../../business/2522-poidh-live-bounty-market/) - the deadline and prize-band measurements that set the daily shape.
- `bettercallzaal/poidhz` - `rounds/daily/d01/` (day one as it happened), `rounds/daily/d02/description.md` (bounty two as cast, 2026-09-21 22:11 EDT), `scripts/claim-report.py` (the per-claim readout the feedback is written from).

## Next actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Add the two checkpoints (tag a draft by 12pm ET, final by 5pm) and the "tagged-and-revised beats equal-untagged" rule to the daily template in `poidhz`, so day three's description carries them. Shipped when `rounds/daily/_template/description.md` has both and `build-daily-bounty.py --all` regenerates clean. | @Zaal (poidhz lane drafts, Zaal approves the wording) | PR | 2026-09-22, before bounty three is cast |
| Move individual feedback to DMs from day three on; the public poidh comment carries the winner, thanks and next ask only. Shipped when day three's feedback clip has DM targets, not post-reply links. | @Zaal | Clipboard change, poidhz lane | 2026-09-23 |
| Add "comment on one other entry, and say which" to the bounty text from day three; count it in the pick. Shipped when the template says it. | @Zaal | PR | 2026-09-23 |
| Measure it: for days 1 to 3, record per entrant whether they tagged a draft, got direction, and filed a final, and whether they returned the next day. Shipped when `rounds/daily/README.md` has the table. | @Zaal (poidhz lane records) | Doc | 2026-09-24, after day three closes |
| Re-validate this doc against days 1 to 3's numbers and set `last-validated`. | @Zaal | Doc | 2026-10-04, after ZAOstock |

## Sources

All fetched 2026-09-22. Method stated per source, per the research-grounding rule.

- [Gross, D. P. (2017). Performance feedback in competitive product development. RAND Journal of Economics / HBS working paper 16-110](https://www.hbs.edu/ris/Publication%20Files/16-110_61b370fd-403f-4f83-8257-495db4aad7f0.pdf) - **[FULL - raw PDF via curl, 2.4 MB, 146k chars extracted; the 26-to-51%, 4.5x, 5.5x, "four thousand" and "private feedback" figures all confirmed present in the text]**. 4,294 logo tournaments.
- [Wooten, J. O. and Ulrich, K. T. (2017). Idea Generation and the Role of Feedback: Evidence from Field Experiments with Innovation Tournaments. Production and Operations Management](https://onlinelibrary.wiley.com/doi/10.1111/poms.12613) - **[PARTIAL - abstract only via exa; full text paywalled]**. Six contests, one week each, daily feedback in three treatments.
- [Jiang, Z., Huang, Y. and Beil, D. R. (2022). The Role of Feedback in Dynamic Crowdsourcing Contests: A Structural Empirical Analysis. Management Science 68(7)](https://ideas.repec.org/a/inm/ormnsc/v68y2022i7p4858-4877.html) - **[PARTIAL - abstract via exa; the "late feedback policy leads to a better overall contest outcome" finding is in the abstract; full text paywalled]**.
- [Jiang, J. and Wang, Y. (2019). A Theoretical and Empirical Investigation of Feedback in Ideation Contests. Production and Operations Management](https://doi.org/10.1111/poms.13127) - **[PARTIAL - extended highlights via exa including the 9,771-contest Zhubajie dataset and the feedback-volume findings; full text paywalled]**.
- [Dargahi, R. and Namin, A. (2020). Making more in crowdsourcing contests: a choice model of idea generation and feedback type. Journal of Marketing Communications](https://doi.org/10.1080/13527266.2020.1748094) - **[PARTIAL - abstract via exa; ~500 participants, rated vs ranked]**.
- [Sun et al. (2023). Feedback types and users' behavior in online innovation contests: Evidence of two underlying mechanisms. Information & Management](https://www.sciencedirect.com/science/article/abs/pii/S0378720623000034) - **[PARTIAL - abstract and introduction via exa; the first-submission and sponsor-vs-peer framing is from the introduction; author list not fully shown on the abstract page, so cited as "Sun et al." from the highlights and should be checked before quoting the authors by name]**.
- [99designs Help Center - What is the Qualifying round?](https://support.99designs.com/hc/en-us/articles/204109469-What-is-the-Qualifying-round), [What is the Final round?](https://support.99designs.com/hc/en-us/articles/204109489-What-is-the-Final-round), [How do I give feedback to the designers in my contest?](https://support.99designs.com/hc/en-us/articles/204108539-How-do-I-give-feedback-to-the-designers-in-my-contest) - **[FULL - exa web_fetch, full page text; curl returned 403 from this machine]**. 4-day qualifying, 3-day final, up to 6 finalists, "at least once per day", public and private comments, star ratings, decline.
- [itch.io community thread: Karma system for the game jams (2019), with leafo's reply](https://itch.io/t/527869/karma-system-for-the-game-jams) - **[FULL - raw HTML via curl, 9k chars stripped; the "70%~80%" and "Comments are definitely more work" quotes confirmed in the text]**. Community source.
- [r/ludumdare: "Ludum Dare may lower my rating or remove it because I rated less than 20 games" (2024)](https://www.reddit.com/r/ludumdare/comments/1g2rmzy/ludum_dare_may_lower_my_rating_or_remove_it/) - **[FULL - method: Arctic Shift via zao-fetch-reddit.sh, post body and 7 comments with scores]**. Community source. The 20-rating threshold and "LD is a reciprocal community" are from the top-scored comments.
- [Ludum Dare rules archive (2017): the Coolness category](https://ludumdare.com/resources/archive/rules-2017/) - **[PARTIAL - exa highlights; the Coolness paragraph is quoted verbatim in the highlight]**.
- Hacker News, searched via the keyless Algolia API for "feedback sandwich", "game jam feedback" and "critique creative work" - **[FAILED as a source - the best hit had 8 points and 11 comments, below the bar for citing; recorded so the next reader does not repeat the search]**.
