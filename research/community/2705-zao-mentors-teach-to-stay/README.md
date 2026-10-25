---
topic: community
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "community/758e-mentor-handbook-patterns, zabal/1543-zabal-s2-mentor-roster, events/654-zabal-games-empire-v3-yerbearzerker-meeting, community/1613-zao-protocol-whitepaper-chapters-2-4, governance/056-ordao-respect-system"
original-query: "What if we made a zao mentors brand / DAO that you get to stay in by doing minimum of one hour a month of lessons to the rest of the team and also produced in zao channels (Zaal, about 07:40 on 23 Oct 2026, relayed by the seat orchestrator2-ee, which set the STANDARD scope: what membership means, how the hour is verified, what members get, ties to ZOLs, Respect and the ICM boxes, prior art with real fetches, 3 to 5 likely mentors from existing docs only, a one-month one-channel pilot; design only, no new brand, token, on-chain step or bot without Zaal)"
tier: STANDARD
---

# 2705 - ZAO Mentors: teach one hour a month to stay in

> **Goal:** Turn Zaal's idea (a mentors group you stay in by teaching the rest of the team at least one hour a month, published in ZAO channels) into a design that runs on what The ZAO already has: the weekly Respect Game, the ZAO channels, ZAOlingo, and the mentors already named in the library. Nothing is built here, and nothing in it creates a brand, token, contract or bot.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **USE a circle first, a brand later.** Run "ZAO Mentors" as a named circle inside The ZAO for the pilot month, with no new ICM box, site, token or contract. Whether it becomes its own brand or DAO is Zaal's call after the pilot. | The seat's scope rules out a new brand, token or on-chain step without Zaal. The ZAO already has the governance a DAO would need: Respect (soulbound, on Optimism) and OREC with a 72-hour vote and 72-hour veto window (ICM `fractal` box, fetched 2026-10-23). A second DAO would duplicate it. |
| 2 | **Membership = one lesson hour per calendar month, taught live or recorded, and published in a ZAO channel.** Miss one month and the seat is paused, not lost; two missed months in a row moves the mentor to alumni, who can rejoin by teaching again. | Zaal's own rule is the hour and the publishing. The pause step is a recommendation: a hard drop on the first miss punishes travel and illness, and RaidGuild's handbook names "waiting for a future cohort" as a normal outcome rather than a failure (fetched, `become-an-apprentice.md`). |
| 3 | **USE a published link as the proof of the hour, ticked by a person.** The hour counts when there is a public artifact: a recording, a Farcaster thread in /zao, or a ZAOlingo lesson, of roughly an hour of teaching. Zaal (or a steward he names) ticks it in one ledger row per mentor per month. No automatic scoring. | Points in ZAO are awarded by Zaal's judgement, not accrued by a script (memory `feedback_points_are_awarded_manually`). A link is checkable by anyone, so "verified" means "someone else can open it", not "a bot counted minutes". |
| 4 | **Respect comes from the Respect Game, not from the hour.** A mentor brings the lesson to the weekly Respect Game as a contribution, and peers rank it like any other. Do not mint a fixed amount of Respect per lesson hour. | Respect is ranked weekly by peers on a Fibonacci curve (doc `governance/056-ordao-respect-system`; ICM `fractal` box). A fixed payout per hour would turn a peer-ranked, soulbound measure of contribution into a wage, and the Gini of 0.73 recorded in the `thezao` box shows how much the existing weighting already concentrates. |
| 5 | **ZOLs: list the lesson hour as a candidate ZOL activity, and wait.** ZOL credits are "the planned lightweight activity layer sitting below ZABAL", with mechanics "being finalized" (doc `community/1613-zao-protocol-whitepaper-chapters-2-4`, lines 166-171). Until ZOLs exist, the ledger in decision 3 is the record, and it can be converted later. | Nothing to credit against yet. Note the name clash in the same doc: ZOL is also the `@zolbot` Farcaster agent (line 75). Write "ZOL credits" in any mentor copy so the two are not confused. |
| 6 | **Route lessons into ZAOlingo.** A recorded lesson that fits a ZAOlingo track becomes a source for a ZAOlingo lesson, so each mentor hour also feeds the on-ramp. | The `zaolingo` ICM box (fetched 2026-10-23) says its "Lessons are community-contributed over time" and that learners "collect ZOLs". Mentor hours are the community contribution it is waiting for. |
| 7 | **What mentors get, from what the library already offers mentors:** a ZAOOS doc credit, a post from a ZAO account, alumni access, a Respect Game contribution each month, and their lesson kept and credited in ZAO channels. No cash, no token. | Doc `zabal/1543-zabal-s2-mentor-roster` lists "ZAOOS doc credit, @wavewarz social post, ZABAL alumni community access" for a 60-minute session. Every lesson carries a visible credit line (`.claude/rules/credit-attribution.md`). Any cash or token reward is a money decision and Zaal's. |
| 8 | **Pilot: one month, one channel, three mentors.** Details in "The pilot" below. | The smallest run that tests whether three people will each publish an hour without being chased. |

## What membership means

A ZAO Mentor is someone who, in each calendar month, teaches the rest of the team for at least an hour, and whose lesson is published where the team can find it later. The definition has three parts, each checkable:

| Part | Rule | How it is checked |
|---|---|---|
| Teach | At least 60 minutes of teaching in the month, in one session or several | The artifact's length, or the session's start and end time |
| To the team | Aimed at ZAO members: a live call, a recorded walkthrough, a written lesson with exercises | The audience is a ZAO surface, not a private client |
| Published in ZAO channels | Posted in /zao on Farcaster, or the recording linked there, or merged as a ZAOlingo lesson | A public link in the ledger |

The ZAO channels already configured in the client are `zao`, `zabal`, `cocconcertz` and `wavewarz`, with `zao` as the default (`community.config.ts`, lines 36-38). The pilot uses `/zao` only.

## How the hour is verified

1. The mentor posts the lesson in /zao (or the recording link), and replies with the link in the mentors thread.
2. The steward (Zaal for the pilot) opens it and ticks one ledger row: mentor, month, link, minutes, topic.
3. At month end the ledger shows each mentor as `taught`, `paused` or `alumni`.

The ledger is a single table in the vault for the pilot. It is not a board card per lesson and not a new database table: the pilot has at most three rows a month, and a schema change is an ask-first item in this repo.

What this does not try to verify: whether the lesson was good. That is what the Respect Game is for (decision 4). The hour rule is a floor that keeps the circle active; peer ranking is where quality is judged.

## How it ties to ZOLs, Respect and the ICM boxes

| System | State on 2026-10-23 (source) | Tie for the pilot |
|---|---|---|
| Respect | Live. Soulbound OG ERC-20 plus ZOR ERC-1155 on Optimism; weekly Respect Game since 2024-07-30; 156 holders (ICM `thezao` and `fractal` boxes). Code: `src/app/api/respect/`, `src/app/api/fractals/`, `src/lib/respect/leaderboard.ts` | The mentor brings the lesson to that week's Respect Game. No code change. |
| ZOL credits | In design, not deployed (doc 1613, lines 166-171) | Lesson hour listed as a candidate ZOL activity; the ledger is convertible later |
| ICM boxes | `thezao`, `fractal`, `zaolingo` and others are live on useicm.com | No new box in the pilot. If Zaal makes ZAO Mentors a brand after the pilot, a box is the first artifact (`.claude/rules/icm-grounding.md`: brand truth starts in the box), and publishing it is Zaal-gated |
| ZAOlingo | Lessons community-contributed; learners collect ZOLs (ICM `zaolingo` box) | Fitting lessons become ZAOlingo sources |

## Prior art

| Program | What it does (fetched) | What ZAO takes | What ZAO skips |
|---|---|---|---|
| **RaidGuild** apprentice cohorts | Apprentices join a cohort and need a "Champion", a member who vouches for them. "Championing is a mix of endorsement, mentorship, and staking $RAID tokens", and "Champions earn a 12,500 $RAID reward once their apprentice successfully achieves the new member success criteria (previously 25,000 $RAID)." Not making it this cohort is a listed outcome: "Waiting for a future cohort". | Mentorship is something a member is credited for; a gentle path back in | Token staking and token rewards (decision 7: no token without Zaal) |
| **MetaGame** XP and Seeds | Contribution earns XP, tracked with SourceCred; "Seeds are awarded based on your XP earned per week through direct actions as well as the XP that flows to you for past contributions". "Seeds are only created through non-monetary contributions." | Credit that flows from contribution, not purchase, which is how Respect already works | A tradeable token: Seeds "can be bought & sold", which Respect deliberately is not (soulbound) |
| **KERNEL** (Gitcoin) | A peer-learning fellowship run in "blocks"; by its April 2022 Gitcoin proposal it had run five blocks with "1,200 KERNEL fellows building 200+ web3 projects", and called itself a "lively gift economy". | Peer teaching as the core, and a gift framing for what mentors give | Paid fellowships and a treasury funded by project equity |
| **Learning by teaching** (pedagogy) | Students "learn material and prepare lessons to teach it to the other students"; Jean-Pol Martin systematised it in the early 1980s as "Lernen durch Lehren"; teaching even an inanimate object is reported to improve "understanding and knowledge retention". | The mentor gains from the hour too, which is why a teaching floor is a reasonable price of membership | - |
| **ZAO's own June 2026 prep month** | ZABAL Games June ran recorded specialist sessions from "ZAO teachers" and tool builders; one by yerbearzerker (Jordan) on Empire Builder was recorded, and recordings were posted at zabalgamez.com/recordings (doc `events/654-...`, update of 2026-08-07). | Proof the format already worked once inside ZAO: recorded hour-long sessions, watchable live or later | - |
| **Community signal** (HN) | The one HN "Ask HN: Cohort based courses for computer science" thread (2021, item 29260905) drew a single reply pointing to a course listing site. | Nothing usable: no community evidence was found for or against a teach-to-stay rule | - |

Not used: a search-result snippet claiming MetaGame set "20 XP" as the monthly minimum for an active player, and that members had to hold Seeds to stay in. Neither line was in the pages actually fetched, so neither is cited.

## Likely first mentors (from existing docs only)

The only mentor list Zaal has confirmed is the eight ZABAL Games mentors in doc `community/758e-mentor-handbook-patterns` (its FABRICATION CORRECTION of 2026-05-26 says only that list is safe to use): Tyler Stambaugh, Arthur, kmac.eth, Jordan Oram, CannonJones, Shriyash Soni, yerbearzerker and deez. Of those, the library shows two who have already taught a ZAO session or were booked to:

| Candidate | Evidence in the library |
|---|---|
| **yerbearzerker (Jordan)** | Recorded an Empire Builder session for the June 2026 prep month (doc 654, update of 2026-08-07; decision 9 "Jordan signs up to record an Empire Builder session") |
| **kmac.eth** | Booked with Zaal to "Record kmac.eth + Zaal session on zlank templates for June bootcamp" (doc 654, action table); an entry titled "kmac.eth Farcaster Snaps" with Zaal and kmac.eth on 2026-05-13 is logged in doc `dev-workflows/722-zao-claude-code-3-month-synthesis/722i-bonfire-kg-state` |
| **Zaal** | Host and steward; co-booked on the zlank session above (the library does not say whether it was recorded) |

A third mentor for the pilot is Zaal's pick from the remaining 758e names. **UNRESOLVED:** doc 758e lists "Jordan Oram" and "yerbearzerker" as two mentors, while doc 654 calls yerbearzerker "Jordan". The library does not settle whether these are one person or two; ask Zaal before naming both.

Doc 1543's S2 roster (Empire Builder, Juke, Cherie Hu and others) is not used: every status there is TBD, and those are prospects, not people who agreed to teach.

## The pilot

| Item | Pilot setting |
|---|---|
| Length | One calendar month, which Zaal picks |
| Channel | /zao on Farcaster only (recordings linked there) |
| Mentors | Three: yerbearzerker (Jordan), kmac.eth, and one more Zaal names; Zaal hosts |
| Proof | One link per mentor in a vault ledger, ticked by Zaal |
| Reward | The doc 1543 set (doc credit, a ZAO post, alumni access) plus the normal Respect Game |
| Success | All three lessons published in the month without a reminder beyond one nudge |
| After | Zaal decides: keep as a circle, make it a brand (ICM box first), or stop |

Nothing in the pilot needs code, a contract, a token or a bot. Asking the three mentors is outbound and Zaal's.

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Decide: run the pilot, and in which month | Zaal | decision | Zaal |
| Resolve whether Jordan Oram and yerbearzerker are one person | Zaal | fact only Zaal knows | Zaal |
| Name the third pilot mentor from the 758e list | Zaal | decision | Zaal |
| Ask the three mentors | Zaal | outbound | Zaal |
| Create the vault ledger table (mentor, month, link, minutes, topic, state) | a lane, after the go | vault note | none |
| Add "lesson hour" to the ZOL credits candidate activity list when ZOL design resumes | whoever owns ZOL credits | design note | none |
| After the pilot: brand or not; if brand, ICM box first | Zaal | decision + publish | Zaal |

## Sources

- [RaidGuild handbook, Become an Apprentice](https://github.com/raid-guild/handbook/blob/main/docs/membership/become-an-apprentice.md) [FULL - raw markdown via `gh api` contents]
- [RaidGuild handbook, Champion a New Member](https://github.com/raid-guild/handbook/blob/main/docs/membership/champion-a-member.md) [FULL - raw markdown via `gh api` contents]
- [RaidGuild handbook, Join the Guild](https://github.com/raid-guild/handbook/blob/main/docs/membership/join-the-guild.md) [FULL - raw markdown via `gh api` contents]
- [MetaGame, "xp seeds and quests"](https://metagame.substack.com/p/xp-seeds-and-quests) [FULL - curl, HTML stripped]
- [MetaGame, "alright this is how metagame really"](https://metagame.substack.com/p/alright-this-is-how-metagame-really) [FULL - curl, HTML stripped; source of the SourceCred mention]
- [MetaGame, "calling for rain"](https://metagame.substack.com/p/calling-for-rain) [FULL - curl, HTML stripped; source of the "non-monetary contributions" quote]
- [KERNEL: A custom educational web, Gitcoin S14 proposal, 2022-04-28](https://gov.gitcoin.co/t/kernel-a-gitcoin-workstream-proposal-s14/10444) [FULL - Discourse JSON API, first post]
- [Gitcoin blog, announcing KERNEL block 2](https://gitcoin.co/blog/announcing-kernel-block-2) [FAILED - HTTP 502 on curl; not cited]
- [Wikipedia, Learning by teaching](https://en.wikipedia.org/wiki/Learning_by_teaching) [FULL - MediaWiki API plain-text extract]
- [Hacker News, Ask HN: Cohort based courses for computer science](https://news.ycombinator.com/item?id=29260905) [FULL - HN Algolia items API]
- ICM boxes `thezao`, `fractal`, `zaolingo` from useicm.com `/api/objects/<id>/llm.txt` [FULL - curl with browser headers, 2026-10-23]
- ZAOOS docs `community/758e-mentor-handbook-patterns`, `zabal/1543-zabal-s2-mentor-roster`, `events/654-zabal-games-empire-v3-yerbearzerker-meeting`, `community/1613-zao-protocol-whitepaper-chapters-2-4`, `governance/056-ordao-respect-system` [FULL - `git show origin/main`]
- An archived mentoring-program repo from another organisation in Zaal's private archive (a mentee point table of 24 tasks from 100 to 1000 points) [FULL - read, not used: it scores mentees, not mentors, and names private people]
