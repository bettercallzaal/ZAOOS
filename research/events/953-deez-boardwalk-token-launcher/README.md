---
topic: events
type: recap
status: research-complete
last-validated: 2026-07-03
original-query: "meeting recap: Deez x Zaal - Boardwalk token launcher (2026-06-29)"
tier: STANDARD
meeting-date: 2026-06-29
platform: "recording (mp4, local mlx-whisper transcription)"
---

# 953 - Deez x Zaal: Boardwalk token launcher (recap, 2026-06-29)

> **Goal:** Understand Boardwalk (a token launcher platform with programmable fee splits) and evaluate fit for ZAO festivals tokenization.

---

## Attendees

- **Zaal** - The ZAO founder
- **Deez** - Founder/lead of Boardwalk, a token launcher platform designed to align projects, communities, and growth partners through programmable fee splits and community-owned liquidity pools

---

## Summary

Deez introduced Boardwalk, a token launching platform built for projects seeking to tokenize their momentum while directing fees to artists, fans, communities, growth partners, or treasuries. Key features include:

1. **Programmable fee distribution** (0.23-0.25% from token transfers) that routes to multiple destinations (LP, treasury, volunteers, growth partners).
2. **Cafe Boardwalk** (Discourse-based forum) that surfaces community knowledge to Google and LLMs, providing SEO lift and knowledge capture for younger communities.
3. **Liquidity pool design** with participation points that reward early and sustained participation over speculation. Early stakers earn points at a "hundred percent rate," giving core communities proportionally greater access to fees than later entrants.

Zaal found strong potential fit for ZAO festivals. He envisions a fee split (50% treasury / 50% active volunteers) to incentivize his 25-person volunteer pool and fund artist travel and event costs. Both agreed to have a deeper technical conversation after Zaal parses the transcript. Zaal mentioned he may launch Ball Games via Clanker (Farcaster-native, simpler) instead of Boardwalk, but Boardwalk aligns with ZAO festivals. Target launch date: before July 23, 2026 (mini DC-area festival).

---

## Decisions

| Decision | Owner | Confidence | Notes |
|----------|-------|------------|-------|
| Parse Boardwalk + meeting through Claude; explore cloud context | Zaal | High | "I'll take this recording and the LMS Text and parse it through my cloud at some point in the next today or tomorrow." (lines 166-168) |
| Boardwalk is **not** for Ball Games; use Clanker instead | Zaal | High | "I'm probably going to launch as a clanker because of empire builder and other things" (lines 170-171) |
| Boardwalk **is** a good fit for ZAO festivals | Zaal | High | "for Zao festivals, this will be perfect" (line 172) |
| Pursue fee split: 50% treasury, 50% active volunteers | Zaal | Medium | "It would be cool to say, Hey, the top 10 people or, or anyone who's submitted this week is going to get a portion of, um, of the fees" (lines 197-202) |
| Longer technical conversation after parsing | Both | High | "Let's maybe have a longer conversation after I parse this, um, this meeting plus boardwalk through my cloud" (lines 218-220) |
| Zaal may do a DeFi session on Boardwalk coding | Deez | Low-Medium | "I would love for you to come in and give like a defy session low key" (lines 230-231). Zaal did not commit verbatim. |

---

## Action Items

| Action | Owner | Due | Confidence | Notes |
|--------|-------|-----|------------|-------|
| Parse Boardwalk transcript + explore via Claude | Zaal | Today or tomorrow (2026-06-29 or 2026-06-30) | High | Zaal committed verbatim (lines 166-168) |
| Brainstorm ZAO festivals tokenization with Deez after parsing | Zaal | After parsing; goal is launch ~July 23 | High | "Let's do it" agreement. Zaal will "pitch to you an idea starting with South festivals" (lines 218-224) |
| Send Cafe Boardwalk tier + Google Meet link | Deez | Unspecified; offered during call | High | "I'll send that a cafe tier to this Google meet" (lines 54-55) |
| Decide on 50/50 fee split model for ZAO festivals | Zaal | Within next weeks/months before July 23 launch | Medium | "we definitely talk about it more over the next couple weeks and months" (lines 313-314) |
| Coordinate capital for 10K/10E minimum to graduate token on Boardwalk | Zaal + Deez | Before July 23 target | Low-Medium | "It will require some coordination beforehand" (lines 274-275); Zaal noted his community may struggle: "I don't expect our community to be able to come up with those kinds of funds" (lines 310-311) |

---

## Quotes

1. **Deez on core value prop:**
"the number one probably benefit is that it ensures that those fees, any kind of fees that come out of it, go to the destinations that they program. So whether it's themselves or their fans or communities or war chest or like growth partners" (lines 18-24)

2. **Deez on alignment through token:**
"when projects take off, they don't have alignment with them unless they went and bought their token themselves off the open market, which is, you know, a gray area in our space... to be able to do that transparently in a, you know, on a smart contract level beforehand" (lines 39-46)

3. **Deez on Cafe Boardwalk (Discourse):**
"It's different than, than discord or telegram because it's SEO searchable. So any type of activity that is here when people are Googling, it could surface it, which really helps younger communities" (lines 61-65)

4. **Deez on participation points design:**
"the people who are there for the longer haul have proportionally greater access to the fees generated than someone who, you know, comes in with a bigger bag or just comes in, you know, with a short-term mindset" (lines 127-132)

5. **Zaal on ZAO festivals use case:**
"for Zao festivals, this will be perfect because I have, I want to be able to put a portion of money, um, towards a couple of different things specifically, right? Like one would be money for artists travel and like just that. And then one would be, um, for events this year" (lines 172-181)

6. **Zaal on volunteer incentivization:**
"the top 10 people or, or anyone who's submitted this week is going to get a portion of, um, of the fees, right? Like let's say 50% goes to treasury and 50% goes to the people that are actually working on the project" (lines 199-205)

7. **Zaal on next steps:**
"Let's maybe have a longer conversation after I parse this, um, this meeting plus boardwalk through my cloud. And, um, maybe I'll pitch to you an idea starting with South festivals and then we can brainstorm on top of that" (lines 218-224)

---

## Research Seeds

1. **Boardwalk minimum graduation threshold:** 10K or 10E minimum to graduate from auction to liquidity pool (line 270). Mechanics of what happens at graduation, bond curve mechanics mid-auction vs. locked liquidity post-graduation trade-offs.

2. **Fee distribution architecture:** Smart contract logic for splitting 0.23-0.25% transfer fees to multiple destinations (LP, treasury, volunteers, growth partners). Is this deployed, or architecture only?

3. **Cafe Boardwalk (Discourse):** Does Discourse automatically index new project profiles to Google? What SEO lift do early projects see? How does LLM scraping of Discourse work vs. Discord archives?

4. **Participation points accrual:** "hundred percent rate" (line 115) - does this mean 1 point per day per unit LP staked, or per transaction? How does vesting supply distribution interact with LP staking rewards?

5. **ZAO festivals volunteer payout mechanism:** How to track "top 10 people" or "anyone who's submitted this week" on-chain and trigger payouts? Boardwalk designed for this or require custom logic?

6. **Ball Games vs. ZAO festivals differentiation:** Why is Clanker better for Ball Games (Farcaster-native, simpler) but Boardwalk better for festivals (multi-stakeholder fees, long-tail community)? What's the architectural difference?

7. **July 23, 2026 DC-area festival:** Mini festival before ZAO Stock 2026 (Oct 3); collaboration with DC entity. Boardwalk launch 2-3 days before could drive live stream engagement and Oct momentum.

---

## Memory-Worthy

**People:**
- Deez (token launcher founder, Boardwalk creator) - first ZAO contact; articulate on fee-split architecture and community incentives. Expressed interest in Zaal doing a live "DeFi session" coding on Boardwalk (may indicate future partnership).

**Projects:**
- **Boardwalk** - active, production-grade token launcher. Targets projects with meaning/purpose/community (not trading charts). Three pillars: (1) programmable fee routing, (2) Discourse-based community knowledge base (Cafe Boardwalk), (3) LP staking + participation points (rewards sustained holders).
- **ZAO festivals (South festivals)** - May be Boardwalk's strongest use case. Zaal envisioning 50/50 split (treasury/volunteer payouts). Target launch July 23, 2026 (before DC mini festival). Minimum 10K/10E capital raise required; Zaal uncertain community can meet it.
- **Ball Games** - will use Clanker (Farcaster native) instead of Boardwalk (too complex, not Farcaster-native).

**Strategic Insight:**
Boardwalk is positioned as infrastructure for **meaning-driven tokenization** (artists, events, communities) with **explicit revenue alignment**. Solves the "creator FOMO on upside" problem (growth partners feeling diluted). Zaal sees fit for ZAO festivals' volunteer + artist + event funding triangle. Next checkpoint: Zaal's cloud parsing of this call + Boardwalk docs, then deeper brainstorm on South festivals specifics.

**Unconfirmed / TBD:**
- Whether Zaal's community can coordinate 10K/10E for token graduation
- Exact mechanism for tracking + paying volunteers (top 10? weekly submitters?)
- Whether Boardwalk supports non-financial participation metrics (hours, events attended) or token-only

---

## Sources

- **Recording:** MP4, local mlx-whisper transcription (raw transcript at `transcript.md`)
- **Confidence level:** High (transcript is clear, ~11 minutes)
- **Garbled points:** Line 289-290 ("the evil of having the, uh, the evil of...") - intent clear but phrasing awkward; Line 98-101: specific percentage number wavered ("0.2% ... 0.25% ... let me get that correct number") - defer to Deez for exact LP fee percent.
