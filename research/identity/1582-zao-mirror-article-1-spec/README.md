# 1582 — ZAO Mirror Article 1: "The DAO That Pays Losing Artists" — Full Spec (Aug 1, 2026)

**Type:** CONTENT-SPEC  
**Topic:** Identity  
**Status:** ⚠️ GATED — Publish Aug 1. ZOE drafts by Jul 26. Zaal approves/edits by Jul 30. Zaal publishes on Mirror.xyz Aug 1. This is ZAO's canonical long-form public debut — the article that establishes ZAO's case study identity for press, academics, and Web3 researchers.

---

## Why This Article Exists

Mirror Article 1 is ZAO's first formal public narrative. Every press pitch (Hypebot, Bankless, Water & Music), grant application (Fisher, MAC, OP RF), and academic citation (Govbase, Wikidata) will reference this article as the primary source.

**North Star alignment:**
- ZAO = THE DAO case study (documented, cited, referenced): this article IS that documentation
- ZAO IP = staple in onchain art, music, culture: article establishes WaveWarZ as onchain music infrastructure

**What makes this the right moment (Aug 1):**
- COC #7 just happened (Jul 18 — first live-audience WaveWarZ battle)
- COC #8 date just announced (Jul 21)
- ZAOstock Eventbrite just launched (Jul 21)
- Africa Battle Week announced (Sep 26)
- ZABAL S2 cohort starts Sep 1
- Fisher grant and MAC grant applications open (Aug 15, Sep 1)

---

## Article Spec

**Title:** "The DAO That Pays Losing Artists: How WaveWarZ Turned Music Battles into On-Chain Governance"  
**Subtitle:** "Inside ZAO — the community-governed collective building the first live music festival run on-chain."  
**Platform:** Mirror.xyz (Zaal's account — bettercallzaal.mirror.xyz)  
**Publish date:** August 1, 2026  
**Length:** 1,200–1,800 words  
**Tone:** First-person founder narrative. Honest about what's small. Clear about what's new.

---

## Article Structure (Section by Section)

### §1 — Opening Hook (Zaal writes — 150 words)

The image: someone loses a WaveWarZ battle and gets paid in real time, on-chain, in front of an audience. COC #7, Jul 18. First live WaveWarZ audience vote. A few dozen people watching. Losing artist's wallet fills.

**Zaal to write:** personal moment from COC #7. What it felt like from the stage. Why this mattered.

**ZOE prepares:** pull exact payout amount from wavewarz.info API for COC #7 battle result, so Zaal can include the number.

---

### §2 — The Loser-Earns Mechanic (ZOE drafts — 200 words)

WaveWarZ is a prediction market for music. People wager SOL on which artist they think will win a community vote. The loser of the vote receives a guaranteed percentage of the pool — in real time, on Solana — regardless of outcome.

**ZOE draft block:**
```
WaveWarZ has completed [totalBattles] music battles as of [date].
Losing artists have earned [artistPayouts] SOL — approximately $[USD equiv] — 
without a record deal, without a streaming account, and without winning.

One losing WaveWarZ battle earns the equivalent of [11,667] Spotify streams 
in artist payout value. (Source: ZAOOS doc 1387.)

The platform has distributed [totalVolume] SOL in total, with [traderClaims] SOL 
going to the people who bet correctly on the outcome.
```

ZOE fills brackets from `/api/public/stats` before sending draft to Zaal.

---

### §3 — The Governance Layer (ZOE drafts — 200 words)

WaveWarZ isn't just a platform. It's governed by ZAO — a DAO running Fractal Democracy on Optimism Mainnet since [session 1 date].

**ZOE draft block:**
```
ZAO has run [100+] Fractal Democracy governance sessions (on-chain, Optimism Mainnet, 
contract [OREC address]). ZOR token holders vote on which artists battle in each MAIN event. 
The governance record is public and permanent.

This is what a DAO actually does: not launch a token, not publish a whitepaper — 
run [100+] weekly sessions where community members show up, evaluate contributions, 
and record outcomes on-chain.
```

**Zaal adds:** 1-2 sentences on what governance feels like in practice (Thursday sessions, the community, who shows up).

---

### §4 — ZAOstock: When On-Chain Meets IRL (ZOE drafts — 200 words)

ZAOstock is the annual IRL event where WaveWarZ moves from online to a stage.

**ZOE draft block:**
```
ZAOstock 2026 is October 3 in Ellsworth, Maine. It's a music festival where:
- Artists battle live, with an audience voting on wavewarz.info
- The losing artist gets paid on-chain, in real time, from the stage
- A community charity battle sends 100% of its pool to a local cause
- ZOR token holders vote the event set-list through on-chain governance

Tickets: [Eventbrite URL]
```

**Zaal adds:** 1-2 sentences on why Maine, why now, what this proves.

---

### §5 — ZABAL: The Accelerator (ZOE drafts — 150 words)

ZAO doesn't just run battles. It runs a 12-week accelerator for artists and builders.

**ZOE draft block:**
```
ZABAL (ZAO Builder Accelerator Lab) completed its first season in 2025. 
Season 2 opens September 1, 2026. Participants build ZAOOS research documents, 
compete in WaveWarZ battles, and earn micro-grants funded by ZAO treasury and Fisher grant applications.

ZABAL is ZAO's talent pipeline: every ZABAL participant is a future ZAOstock attendee, 
WaveWarZ artist, and DAO governance contributor.
```

---

### §6 — The North Star (Zaal writes — 200 words)

**Zaal writes:** personal vision paragraph. Where this goes. Why this specific format (prediction markets + live events + DAO governance) is the experiment worth running. What WaveWarZ is trying to prove about music economies.

**ZOE prepares:** pull ZAOOS document count (GitHub API — total merged PRs to main) to include: "We've published [N] research documents chronicling every decision, every event, every governance session."

---

### §7 — CTA and Links (ZOE drafts — 50 words)

```
→ ZAOstock tickets: [Eventbrite URL]
→ ZABAL S2 applications open Aug 1: [Tally form URL]
→ WaveWarZ: wavewarz.info
→ ZAO on Farcaster: /zao channel
→ ZAOOS research archive: github.com/bettercallzaal/ZAOOS
→ Follow ZAO: @bettercallzaal on X + Farcaster
```

---

## ZOE Pre-Draft Checklist (Jul 26 — 6 Days Before Publish)

| # | ZOE Task | Source |
|---|---|---|
| 1 | Pull `/api/public/stats`: totalBattles, totalVolume, artistPayouts, traderClaims | wavewarz.info |
| 2 | Pull ZAOOS merged PR count (total docs) | GitHub API (bettercallzaal/ZAOOS) |
| 3 | Pull COC #7 battle result + payout amount for §1 hook | wavewarz.info API or doc 1523 |
| 4 | Pull ZAOstock Eventbrite RSVP count | Eventbrite API (doc 1574 pattern) |
| 5 | Pull Farcaster /zao channel follower count | Neynar API |
| 6 | Fill all [brackets] in §2–§5 draft blocks above | Per sources above |
| 7 | Send completed draft to Zaal via Telegram: "Mirror Article 1 draft ready for your review" | Telegram |

---

## Zaal Review + Edit Window (Jul 28–30)

| # | Zaal Task | Notes |
|---|---|---|
| 1 | Write §1 opening hook (COC #7 moment) | 150 words, personal, from the stage |
| 2 | Write §3 governance texture (1-2 sentences) | What Thursday sessions feel like |
| 3 | Write §4 ZAOstock IRL note (1-2 sentences) | Why Maine, why now |
| 4 | Write §6 North Star vision (200 words) | Most important — Zaal's voice |
| 5 | Review all ZOE stat blocks for accuracy | Spot-check against /api/public/stats |
| 6 | Reply "APPROVED" in Telegram or request specific revision | ZOE holds until approved |

---

## Publish Day: Aug 1 Protocol

| Time | Action | Owner |
|---|---|---|
| 8:00 AM | Zaal pastes final article into Mirror.xyz draft editor | Zaal |
| 8:30 AM | Zaal reviews formatted Mirror preview (images, headers, links) | Zaal |
| 9:00 AM | Zaal publishes to Mirror (Collect enabled — ZOR holders can collect) | Zaal |
| 9:05 AM | ZOE posts X @bettercallzaal: "I wrote something — [Mirror link]" | ZOE |
| 9:10 AM | ZOE posts @wavewarz: "The article explaining WaveWarZ — [Mirror link]" | ZOE |
| 9:15 AM | ZOE posts Farcaster /zao: full article link cast | ZOE |
| 9:20 AM | ZOE posts Telegram (ZAO channel): "Mirror Article 1 is live — [link]" | ZOE |
| 9:30 AM | ZOE files Mirror URL in doc 1570 citable claims (§3 or new §9 Mirror) | ZOE |

---

## Amplification Templates (ZOE — Fire at 9:05 AM Aug 1)

### X @bettercallzaal post:
```
I wrote about what we've built.

WaveWarZ has run [N] music battles. Losing artists earned [X] SOL.
ZAO has run 100+ governance sessions on-chain.
ZAOstock is October 3 in Ellsworth, Maine.

Here's the article: [Mirror link]
```

### X @wavewarz post:
```
What is WaveWarZ?

A prediction market where losing artists get paid in real time.
Governed by a DAO. Live events. 12-week accelerator.
[N] battles. [X] SOL to artists.

Full story: [Mirror link]
```

### Farcaster /zao cast:
```
Mirror Article 1 is live.

"The DAO That Pays Losing Artists" — how WaveWarZ works, 
why governance matters, and what ZAOstock represents.

[Mirror link]

Collect on Mirror if this resonates 🙏
```

### Telegram ZAO channel:
```
📰 Mirror Article 1 is live

"The DAO That Pays Losing Artists" — Zaal wrote the canonical ZAO explainer.

Read it: [Mirror link]

This is the article we send to press, grant reviewers, and researchers. 
Share with anyone who's asked "what is ZAO?"
```

---

## Post-Publish Follow-Up (Aug 2–3)

| # | Task | Owner |
|---|---|---|
| 1 | ZOE checks Mirror article for Collect activity (ZOR holder mints) | ZOE |
| 2 | ZOE adds Mirror article URL to doc 1570 citable claims as verified external source | ZOE |
| 3 | ZOE checks if article reached any Farcaster reposts or X quote-tweets — report in EOD | ZOE |
| 4 | Use Mirror article URL in Hypebot pitch (Aug 1 deadline — doc 1388 pitch pack) | Zaal |
| 5 | Use Mirror article URL in Bankless/Decrypt pitch (Aug 1 bundle — doc 1417 pitch) | Zaal |
| 6 | Use Mirror article URL in Fisher grant application (Aug 15) | Zaal |

---

## Mirror Collect Setup

**Mirror Collect (on publish):**
- Enable Collect on the article
- Set collect price: free (maximize reach for Article 1)
- If Collect available as NFT: ZOR holders get early collect notification via ZOE Telegram post

**Reasoning:** Free collect = more on-chain proof that real people engaged with ZAO's writing. These are citable (N people collected ZAO Mirror Article 1 as of [date]).

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| Jul 26 | Pull all stats + fill draft blocks + send completed draft to Zaal via Telegram |
| Jul 28 | Remind Zaal: "Mirror Article 1 draft in your Telegram. Needs your §1, §3, §4, §6 + approval by Jul 30." |
| Jul 30 | If no Zaal reply: "Mirror Article 1 publishes Aug 1 — need your approval today" |
| Aug 1, 9:00 AM | After Zaal publishes: ZOE fires all 4 amplification posts (X @bettercallzaal, X @wavewarz, Farcaster, Telegram) |
| Aug 1, 9:30 AM | ZOE adds Mirror URL to doc 1570 citable claims |
| Aug 2 | ZOE checks Collect count + X/Farcaster amplification. Report in 7PM EOD. |

---

## Related Docs

- 1570 — Citable Claims Master Doc (add Mirror article as verified external source post-publish)
- 1574 — ZAO Newsletter Paragraph + ZOE Integration (Newsletter Issue 1 Jul 21 → Article 1 Aug 1 are sequential content moments)
- 1388 — Hypebot Pitch Pack (uses Mirror article URL as primary source for Aug 1 pitch)
- 1387 — WaveWarZ vs. Spotify Artist Economics (§2 stat basis — loser-earns math)
- 1469 — WaveWarZ Platform State Snapshot (stat source for ZOE §2 draft blocks)
- 1433 — WaveWarZ H1 2026 Platform Growth Summary (citation basis for §2–§3)
- 1565 — Fractal Democracy Facilitator Guide (§3 governance layer — OREC address)
- 1567 — ZABAL S2 Participant Tracker Spec (§5 ZABAL section basis)
