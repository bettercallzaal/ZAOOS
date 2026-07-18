---
topic: zabal, zoe, operations, onboarding
type: faq
status: ACTIVE — ZOE uses this starting Sep 1 (ZABAL S2 Week 1). These are the 12 most common questions new ZABAL S2 participants ask during orientation and the first few sessions. ZOE responds with these answers in ZABAL S2 Telegram and Farcaster DMs. Updated as new questions emerge.
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1696-zabal-s2-onchain-release-protocol, 1702-zabal-s2-track-b-zaoos-doc-guide, 1626-zabal-s2-curriculum-spec, 1708-zabal-s2-preseason-onboarding-sequence, 1704-sep1-zabal-s2-launch-day-ops
action-owner: ZOE (answers these questions in ZABAL S2 Telegram, Farcaster XMTP, and /zabal); Zaal (answers anything ZOE escalates)
---

# 1762 — ZABAL S2 First Week FAQ

> **What this is:** ZOE's ready answers to the 12 most common questions new ZABAL S2 participants ask in the first 2-3 weeks of the season. Sourced from the types of questions that come up during orientation and from gaps in the acceptance DMs. ZOE pastes these answers directly (no modification needed) when a question matches.
>
> **When ZOE uses this:** Anytime a participant asks one of these questions in:
> - ZABAL S2 Telegram group
> - Farcaster XMTP (direct message to ZOE's Farcaster)
> - /zabal channel (ZOE monitors)
>
> **What makes a good FAQ entry:** The answer must be complete enough that the participant doesn't need to follow up. ZOE's job is to unblock — not to refer participants to other docs. Each answer ends with a specific next action.

---

## Track A FAQ (Artists)

### Q1: "What counts as a WaveWarZ battle? Does watching count?"

No, watching doesn't count. A completed battle means:
1. Your track is uploaded on your WaveWarZ profile (wavewarz.info)
2. A host creates a battle using your track vs another artist's track
3. ZOR holders vote during the voting window
4. The battle settles (usually within a few hours of the vote window closing)

Both the winner and loser get credit. The battle appears in your WaveWarZ profile history.

**What to do:** If you haven't battled yet, post in this Telegram: "I'm ready to battle — can someone set up a Quick Battle for me?" Any ZAO community member can create a Quick Battle.

---

### Q2: "I don't have a lot of fans. Will I lose every battle because no one will vote for me?"

The loser earns regardless of who votes. Even if you get zero fan votes, you still receive your loser-earns payout if the battle settles.

More importantly: in WaveWarZ, a larger opponent fan base = a larger payout for you if you lose. The economics reward you more for losing to someone popular than for beating someone unknown.

Your 5-battle requirement is about completing battles, not winning them.

---

### Q3: "I set up my WaveWarZ account but I can't find my track. How do I upload one?"

Your track needs to come from an existing audio source. WaveWarZ pulls from Audius by default for most battles.

Steps:
1. Upload your track to Audius (audius.co) — free account
2. Note the Audius track URL
3. On your WaveWarZ profile (wavewarz.info), connect your track via the Audius link
4. Once connected, any host can create a battle using your track

If you're stuck: post in ZABAL S2 Telegram with "I need help connecting my track" and either Zaal or another participant can walk you through it. Also check doc 1680 Section 1 for the full setup walkthrough.

---

### Q4: "When is the on-chain release deadline?"

Track A on-chain release deadline: **Week 10, Nov 2, 2026.**

An on-chain release means:
- Minting your music on Sound.xyz (free edition, ~$1-2 gas on Base) OR
- Minting on Zora (also on Base, similar gas cost)

You don't need to release a full album. A single track (even a 60-second loop) minted as a free edition counts.

How to submit the milestone: `@zaoclaw_bot milestone: [your handle] zaoos_release [Sound.xyz or Zora URL]`

Full guide: doc 1696. Start now if you can — don't wait until Week 10.

---

### Q5: "Can I count a battle from before ZABAL S2 started?"

No. Only battles completed during the ZABAL S2 season (Sep 1, 2026 – Nov 21, 2026) count toward your 5-battle requirement. Battles from before Sep 1 do not count.

**Exception:** If your track was in an active battle that started before Sep 1 and settled after Sep 1, contact Zaal. He'll make the call.

---

### Q6: "What's the Africa Battle Week battle? Does that count?"

Yes. Africa Battle Week (Sep 22-26, 2026) has 5 battles. If you participate as a Track A ZABAL S2 artist in one of those battles, it counts toward your 5-battle requirement.

To get into an Africa Battle Week battle: Zaal and Hurricane are coordinating artist rosters. Let them know you're interested. However, spots are limited (one US vs one West African artist per day). Completion of Africa Battle Week battles isn't guaranteed for all Track A participants — focus on Quick Battles as your primary path to 5.

---

## Track B FAQ (Builders)

### Q7: "I can't find a topic that doesn't already exist in ZAOOS. Where do I look?"

Most uncovered topics are operational specs ZOE needs but doesn't have. Try these approaches:

**A.** Search for "[task name] spec" in the ZAOOS repo — if no result, it's a gap.

**B.** Look at ZOE's existing docs and find "see future doc" or "spec TBD" references. Those are explicit gaps.

**C.** Ask yourself: "What happened in ZABAL S2 Week 1 that wasn't spec'd?" First week questions, tech setup friction, common misunderstandings — all of those are doc opportunities.

**D.** Current confirmed gaps as of Jul 2026 (from doc 1702):
- WaveWarZ battle dispute resolution
- ZAOstock day-of volunteer checklist (detailed per-role)
- ZABAL S2 Week 8-12 detailed session curriculum
- COC #8 post-show recap template

**What to do:** Post your topic idea in ZABAL S2 Telegram before you write — someone will tell you if it already exists or if it's genuinely new.

---

### Q8: "My PR was open for 2 weeks and no one reviewed it. What do I do?"

Post in ZABAL S2 Telegram: "@zaoclaw_bot my PR is at [URL] and it's been open [N] days. Can someone review it?"

ZOE will flag it to Zaal. Zaal reviews and merges within 48h of being flagged.

PR reviews happen on a best-effort cadence. During high-activity periods (around ZAOstock and Africa Battle Week), reviews may be slower. Your PR being open doesn't mean it's been rejected — it usually just means Zaal hasn't gotten to it yet.

---

### Q9: "What makes a PR get rejected?"

PRs in ZAOOS rarely get hard-rejected (closed/denied). They usually get one of:
- Feedback comments requesting changes (you push updates to the same branch)
- "Almost there" + specific edits needed
- Merge with minor ZOE edits inline

The most common issues that cause delays or requests for changes:
1. The doc duplicates an existing doc (check first — searching takes 5 minutes)
2. The doc is too vague (no templates, no specific actions for ZOE)
3. The frontmatter `status:` field just says "draft" without telling ZOE when or how to use it
4. The doc is fewer than 200 lines (too thin to be a useful reference)

**What to do:** Before submitting, ask yourself: "If ZOE read only this doc, would it know what to do?" If not, add more specifics.

---

## Both Tracks FAQ

### Q10: "I missed 2 sessions. Am I going to fail?"

No. The minimum attendance threshold for graduation is **7 of 12 sessions** (≥58%). Missing 2 out of the first 4 weeks means you can still miss 3 more and graduate with sessions to spare.

Attendance is recorded by Zaal after each session. Check your status with: `@zaoclaw_bot status: [your handle]`

If you know you're going to miss a session: there's no excuse system, but informing ZOE in the ZABAL S2 Telegram is appreciated: "I can't make it to Week [N] — note it for attendance."

---

### Q11: "When do I get the session join link?"

The session join link is confirmed by Zaal each week and sent in the ZABAL S2 Telegram pinned message by the Friday before. It's also posted by ZOE at 1:45PM ET on Mondays (15 minutes before each session).

If it's 5 minutes before a session and you can't find the link: post in ZABAL S2 Telegram "need join link" and ZOE will post it.

The link is typically the same from week to week unless the platform changes. Check the pinned message in this Telegram group.

---

### Q12: "What happens if I don't graduate? Can I still participate in Season 3?"

Not graduating from ZABAL S2 doesn't block you from Season 3. Season 3 is currently unannounced and will be a separate application process (expected early 2027).

What graduation gives you:
- Recognition in the graduation ceremony
- Eligibility for the micro-grant (Zaal determines amount)
- People's Choice nomination eligibility
- A public acknowledgement of your Season 2 work

What non-graduation does NOT affect:
- Your ability to contribute to ZAOOS (anyone can submit PRs)
- Your ability to battle on WaveWarZ
- Your ability to attend Fractal Democracy
- Your ability to apply for Season 3

If you're at risk, ZOE will send you an at-risk DM at Week 7 (Oct 13) — that's the last real intervention point before graduation.

---

## ZOE Response Guidelines

When ZOE receives a question that matches one of the above, ZOE:
1. Pastes the answer directly (verbatim or lightly adapted for context)
2. Does NOT add qualifiers like "I think" or "you might want to check with Zaal" unless the question falls outside these answers
3. Ends the response with the specific next action (bolded above)
4. If a follow-up question arises that isn't in this FAQ: escalates to Zaal

**Questions ZOE always escalates without answering:**
- "Can I get an extension on [deadline]?" (Zaal decides)
- "I want to switch tracks mid-season." (Zaal decides)
- "Can I battle at ZAOstock?" (Zaal + Hurricane decide)
- Anything about micro-grant amounts (Zaal decides at graduation)
- "I need help with a gas fee." (Zaal decides on ZAO coverage)

---

## Adding New Questions

As the season progresses, ZOE adds new questions to this FAQ. Format:

```
### Q[N]: "[Exact question as asked]"

[Answer — complete enough to not need a follow-up. Ends with a next action.]
```

ZOE submits an update to this doc as a ZAOOS PR after Week 3 (Sep 15) once the true first-week questions are known.

---

## Sources

- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track A/B graduation criteria (source for attendance threshold, battle requirement, PR requirement)
- `research/zabal/1696-zabal-s2-onchain-release-protocol/` — Track A on-chain release steps (Q4)
- `research/zabal/1702-zabal-s2-track-b-zaoos-doc-guide/` — Track B gap-finding guidance (Q7)
- `research/zabal/1708-zabal-s2-preseason-onboarding-sequence/` — What acceptance DMs covered (context for what these FAQs fill in)
- `research/wavewarz/1644-wavewarz-onchain-settlement-mechanics/` — Loser-earns mechanics (Q2)
- `research/events/1680-africa-battle-week-artist-onboarding-guide/` — Track A WaveWarZ setup walkthrough (Q3)
