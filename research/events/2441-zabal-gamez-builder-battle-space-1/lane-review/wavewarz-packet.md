# Lane review packet - wavewarz

A meeting was just captured and classified to your lane. Nothing has been
written to the tracker, Bonfire, the recap doc, or anywhere else yet. This is
your chance to correct it first.

- Meeting: ZABAL Gamez builder battle finals, Space 1 (opening)
- Date: 2026-08-29
- Attendees: Zaal (WaveWarZ account, host), Candy (WaveWarZ co-founder, stream), Thy Revolution, Iman Afrikah, paperhandpapi, Mauro (jdwalka), Brandon (ghostmintops), GodclouD, N3M, Hurricane, Emergent, Steve Strange, zee3, RAK PHO (roster, silent)
- Transcript: /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/2440-zabal-gamez-builder-battle-space-1/transcript.md
- Full extraction: /tmp/extracted.json

## Decisions extracted

1. The three builder battle judges are Thy Revolution, Iman Afrikah and paperhandpapi. Thy Revolution judges all three tracks.
   (zaal | TODO | high)
2. The 24 hour challenge is to build on top of ZAOstock / ZAO Festivals for the 3 October event (zaostock.com/build ideas: a board, ticketing, a Decentraland stage, a WaveWarZ front end for the event). Builders pick whatever perspective they have.
   (zaal | TODO | high)
3. Three signals decide it: the poll (already live in the thread), the three judges, and the charts on the WaveWarZ community battle created at noon. 1 percent of trade volume goes to each builder's wallet (their Solana wallet from Farcaster).
   (zaal | TODO | high)
4. Space 2 is Sunday 30 Aug 11:00 AM ET, an hour before the battle ends; extra Spaces open whenever a builder messages Zaal.
   (zaal | TODO | high)
5. The ZABAL Gamez finals Farcaster group chat is opened to everyone in the Space (invite link posted from the ZAO Festivals account) so all builders and judges connect on Farcaster.
   (zaal | DONE | high)
6. Thy Revolution's name for the WaveWarZ lore and content store: the WaveWarZ Abyssal Plane. Accepted on the call by the person building it.
   (Open | TODO | medium)

## Actions extracted

1. Write the three judges into finals.json and merge
   (zaal | 2026-08-29 | Site / Tech | high)
   why: Judges were named live on the Space; the site still shows Judges: TBA, TBA, TBA on /august and /live.
2. Paste the poll URL into finals.json builder row
   (zaal | 2026-08-29 | Site / Tech | high)
   why: The poll is live inside the pinned thread but the site's poll field is null, so the Vote button does not render.
3. Reach out to each judge and both builders individually
   (zaal | 2026-08-29 | Ops | high)
   why: Zaal committed on the call to message all five so a builder can trigger a Space at any hour and judges get the rubric.
4. Give the builders the ZAO Festivals content: ZF3 and ZF2 folders, ZF1 finished videos, find ZF1 raw audio/video
   (zaal | 2026-08-30 | Ops | high)
   why: Zaal's stated job for the 24 hours is getting the builders the data they need to build on ZAOstock; posting from the ZAO Festivals account.
5. Post the Space 1 summary with links to what the builders discussed
   (zaal | 2026-08-29 | Social | high)
   why: Zaal promised a summary of the builders' workflow conversation with links (this recap is the source).
6. Fix the Space scheduling time error before Space 2
   (zaal | 2026-08-30 | Ops | medium)
   why: Space 1 was created for 11 PM instead of 11 AM when shared out; ghostmintops nearly missed it. Space 2 must be checked.
7. Help jdwalka with the Farcaster mini app scroll drop (pinning)
   (Open | ZAO Devz | medium)
   why: jdwalka asked for help: the poker mini app drops when scrolling; he asked if there is a way to pin it.
8. Collect artist jackets and resumes by DM for the WaveWarZ lore store
   (Open | Social | low)
   why: The person building the WaveWarZ content system (League Hub, now Abyssal Plane) asked artists on the leaderboard to DM their project and history so battle promos can be built like sports coverage.
9. Give Iman and N3M an official WaveWarZ artist-board battle
   (Open | Other | medium)
   why: Raised on the call: they are on the Quick Battles board but not the artist leaderboard.
10. Build the WaveWarZ lore synthesizer (X Space summarizer with UGC rewards)
   (zaal | Site / Tech | medium)
   why: Zaal's own idea on the call, explicitly not for the next 24 hours.
11. Look at the Hermes bleep timing bug on stream clips
   (zaal | Site / Tech | low)
   why: The live stream bleeper bleeps the word after the profanity.

## What we need from you

Write your reply to:

    /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/2440-zabal-gamez-builder-battle-space-1/lane-review/wavewarz-review.md

**That one file is the whole job. Do not commit it, and do not commit
anything.**

That path is inside the MEETINGS lane's worktree, on the meetings lane's
branch, and that lane is working in it right now. You are a guest in someone
else's checkout. Two panes committing to one branch interleave their history,
race the index, and sandwich the owning lane's commits between yours - which
is exactly what happened on 2026-08-27, when the artizen weigh-in landed
bbe12d49 in the middle of the meetings lane's own work on ws/2422-lane-weighin.
That commit was well-behaved in every other way: advisory only, review file
only, no push. It was still the wrong thing to do, because committing was
never yours to do.

Write the file. Stop. The meetings lane reads it, merges it, and commits it as
part of the recap.

Answer these four, and nothing else. Keep it short - this is merged into a
recap, not published.

1. CORRECTIONS. Anything above that is wrong. A meeting transcript mishears
   names, misses that a thing already shipped, and states intentions as facts.
   You have the repo. Say what is actually true, and cite the file or commit.
2. MISSING CONTEXT. What a reader of this recap in three weeks would need that
   the recording could not carry.
3. ACTIONS YOU OWN. By title, from the list above. Only the ones that are
   really this lane's work. Say if one is already done - that is the single
   most useful thing you can return.
4. ACTIONS THAT SHOULD NOT EXIST. Duplicates of open cards, or work that was
   decided against. Say which and why.

Rules:
- NO GIT. No `git add`, no `git commit`, no branch, no stash, no `git rm`, no
  push. Not on the meeting's branch, not on your own. If you think a commit is
  needed, say so IN the review file and let the meetings lane decide - that is
  a correction like any other.
- ONE FILE. `/Users/zaalpanthaki/Documents/ZAO OS V1/research/events/2440-zabal-gamez-builder-battle-space-1/lane-review/wavewarz-review.md` and nothing else. Not the recap README, not the
  transcript, not the extraction, not the other lanes' review files, not
  anything in your own repo.
- Your input is ADVISORY. It is merged and recorded, not executed. You are not
  being asked to approve anything and you cannot fire anything from here.
- Do NOT invent actions nobody in the meeting mentioned. Corrections and
  ownership only.
- If you have nothing to add, write the file anyway with "nothing to add" under
  each heading. A file that says nothing is a real answer; silence is not.
- You have 10 minutes. After that the fan-out proceeds without you and
  the recap records that this lane did not reply.

The meeting worktree's HEAD was recorded when this packet was written, and
`collect` compares it afterwards. A commit from a weigh-in lane is reported by
name, so this is checked rather than trusted - not because you are expected to
disobey, but because the last lane to do it thought it was being careful.
