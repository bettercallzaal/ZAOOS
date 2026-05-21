---
topic: events
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: "Ground 4 buildables from ZAOstock May 19 standup against external practice: ZAO Scribe, NFC pro tickets, Wall of Pros, Z of All Games, AI DAO voting agent"
related-docs: 609, 630, 654, 670, 680
tier: STANDARD
---

# 681 — ZAOstock 5/19 Standup: New Build Initiatives Research

> **Goal:** Ground the four net-new buildables surfaced in the May 19 ZAOstock standup (Z of All Games, NFC pro tickets / digital twins, ZAO Cards, ZAO Scribe) plus the AI DAO voting agent against external practice, so each gets a build-vs-buy call before time is spent.

## Key Decisions (recommendations first)

| Initiative | Decision | Why |
|-----------|----------|-----|
| ZAO Scribe | BUILD as thin glue, not from scratch. Craig bot records, Whisper transcribes, existing `/meeting` skill extracts. `-join` triggers the chain. | Recording + extraction already solved. Whisper is free, self-hosted, 99+ languages - also answers Jose's Spanish-summary ask. Do NOT rebuild meeting extraction. |
| NFC pro tickets / digital twins | BUILD self-hosted profile pages on zaostock.com; buy blank NTAG cards in bulk. SKIP Popl/Linq subscriptions. | Popl/Linq charge per-user monthly. The card only encodes a URL - the profile page is the asset, and ZAOstock already has profile-page infrastructure. Blank NTAG215 cards run ~$0.50-2 each at volume. |
| Wall of Pros | BUILD as a public page; physical wall mirrors it for IRL + livestream. | Gives retail/virtual supporters visible credit (ties to Pro Ticket recognition). Trey livestreaming the physical wall is free reach. |
| Z of All Games | RUN the 3-month structure as planned. Publish judging rubric day one. Cap teams at 3-4. | Matches industry build-a-thons (MS JS Build-a-thon = learn+hack phases; Aurora = multi-stage elimination). Every source: rubric-first produces better submissions. |
| AI DAO voting agent | BUILD a proposal-summarizer + suggested-vote assistant. Do NOT build autonomous voting yet. | Space is crowded (Kryon, GovPilot, Quoracle, Governa). Summarize-only matches SocialBlock's lower-risk "agents generate metadata, don't vote" model. Autonomous delegation is a later, riskier step. |

## Context: What the standup surfaced

Standup 2026-05-19, 5 attendees (Zaal, Jose, DFresh, FailOften, Philanz). Agenda doc built by Iman. Timeline anchors: 138 days to ZAOstock (event ~Oct 3 2026), 87 days to the DCoop event, Aug 15 suggested test/dry-run day, 1K committed by sponsors but not yet received via Limonae.

## Findings

### 1. ZAO Scribe (Discord transcription bot)

Goal stated: `-join` a call, auto-log todos / conversation / history asynchronously so the whole team sees who did what, no manual download-upload-paste.

- The hard parts are already solved. Craig bot handles Discord voice recording. The `/meeting` skill already extracts decisions, action items, and quotes from a transcript.
- The only missing link is automated transcription between the two. USE OpenAI Whisper self-hosted: free, runs locally, 99+ languages, near-human accuracy on clear English audio.
- Self-hosted matters here: meeting audio of internal standups never leaves a ZAO-controlled host. Meetily (open-source, Rust, local Whisper/Parakeet + diarization) is a reference architecture if a packaged tool is wanted over raw Whisper.
- ZAO OS already ships a transcription endpoint pattern at `src/app/api/fishbowlz/transcribe/route.ts` - reuse the shape.
- Spanish ask (Jose): Whisper transcribes-then-translates in one pass. Solves the "give me the meeting in Spanish" request without a separate workflow.

### 2. NFC pro tickets / digital twins

Goal: every ticket buyer (virtual or IRL) gets an NFC networking card. IRL attendees tap to share; virtual supporters appear on a "Wall of Pros".

- NFC business cards (Popl, Linq, V1CE, Mobilo) all work the same way: card encodes a URL, recipient taps phone, profile opens in browser - no app needed by either party.
- Popl/Linq sell the *platform* (hosted profile + CRM + analytics) on a per-user subscription. ZAOstock does not need the platform - it needs the card to open a ZAOstock-hosted profile.
- Build path: blank NTAG215 cards bought in bulk (~$0.50-2 each), each encoded with a zaostock.com profile URL. Profile pages reuse the existing entry-page / profile architecture already on the site.
- This also gives Canon's ZAO Cards a home: same NTAG cards, ZABAL card design already exists, mass-produce with NFC chips, hand out at the event. Teaching attendees how the card was made doubles as the educational angle.

### 3. Wall of Pros

- Virtual supporters get a card "on the wall"; IRL supporters get two (one on the wall, one to carry).
- Build as a public zaostock.com page listing every Pro Ticket / supporter profile. The physical wall is a printout/mount that mirrors it.
- Trey (or any community streamer) livestreaming the physical wall turns supporter recognition into shareable content for free.

### 4. Z of All Games (build-a-thon)

Stated structure: June = workshops (30-min volunteer-led sessions), July = open build month, August = 8 ZAO mentors guide 8 finalists to streamed final submissions, "ZABAL Games winner" end of August. Brands offered as build prompts: ZAOstock, ZABAL, WaveWarZ, The ZAO.

- The 3-phase shape is industry-standard. Microsoft's JavaScript AI Build-a-thon Season 2 ran a 4-week "Learn & Skill Up" phase then a "Global Hack" phase. Agent Academy Hackathon (May 12 - Jun 2, 2026) ran learn -> watch -> build -> submit -> improve. Aurora 2026 ran 5 stages over 6 weeks with elimination rounds.
- Industry consensus across all sources: publish the judging rubric to participants on day one, not demo night. Teams that know how they are scored produce better work. Keep it to 5 criteria, max 25 points (Agent Academy used weighted criteria: accuracy 25%, technical 25%, creativity 15%, UX 15%, reliability 10%, impact 10%).
- Cap teams at 3-4. Smaller lacks bandwidth, larger spends time coordinating.
- Set up a backup submission channel and announce it at kickoff - standard failure-mode insurance.
- The "brand prompt" idea (give builders full ZAO/ZABAL/WaveWarZ/ZAOstock context to build against) maps cleanly to hackathon "tracks". Treat each brand as a track.

### 5. AI DAO voting agent

Goal: synthesize proposals, pull a member's Farcaster cast history into a preference profile, suggest yes/no with reasoning, point them to sections to read.

- This is a crowded 2025-2026 category. Kryon, GovPilot, Quoracle, and Governa all do: scan Snapshot/Tally/forum proposals, summarize in plain language, score against a stored preference profile, draft a rationale, optionally vote via delegated wallet.
- The settled mechanism: delegate voting power to an agent-controlled wallet (Solana SPL Governance and EVM both support this with no protocol change). Agent reads proposal + preferences, casts or recommends.
- The "Farcaster cast history -> preference profile" idea matches Kryon's "identity graph" pattern (aggregate wallet/social signals into a portable preference profile).
- Lower-risk first version: summarize-and-recommend only, no autonomous voting. SocialBlock's governance agents explicitly "do not vote - they generate transparent metadata". For a DAO where Zaal is currently the main voter, a summarizer that raises participation is the win; autonomous delegation is a later step with key-custody risk.

## Also See

- [Doc 609](../609-zaostock-cobuild-six-circles-may4/) - ZAOstock co-build structure
- [Doc 630](../630-zabal-games-claude-code-hackathon-v0/) - ZABAL Games hackathon v0
- [Doc 654](../654-zabal-games-empire-v3-yerbearzerker-meeting/) - ZABAL Games empire framing
- [Doc 670](../670-iman-call-may18-craig-pizzadao/) - Iman call, Craig bot context
- [Doc 680](../../agents/680-meeting-skill-bonfire-bridge/) - meeting skill pipeline

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spec ZAO Scribe as Craig -> Whisper -> `/meeting` glue; reuse fishbowlz transcribe route shape | @Zaal | Todo | Before next standup |
| Price blank NTAG215 cards in bulk; confirm zaostock.com profile-page URL scheme | @Zaal / @Canon | Todo | Before Aug 15 dry run |
| Add Wall of Pros page to zaostock.com (profiles for Pro Ticket buyers + supporters) | @Zaal | PR | After ticket flow stable |
| Publish Z of All Games judging rubric (5 criteria, max 25 pts) before June workshops open | @Zaal | Doc | End of May 2026 |
| Set Z of All Games backup submission channel; announce at June kickoff | @Zaal / @Iman | Todo | Before June 1 |
| Build AI DAO voting agent v1 as summarize-and-recommend only (no autonomous voting) | @Zaal | Todo | After ZAOstock event |

## Sources

- [Popl - NFC Business Cards Complete Guide](https://popl.co/blogs/all/near-field-communication-cards) - verified 2026-05-20
- [Popl - Top 7 Digital Business Card Platforms 2025](https://popl.co/blogs/all/the-top-7-digital-business-card-platforms-in-2025) - verified 2026-05-20
- [Linq Smart Business Card (Amazon listing)](https://www.amazon.com/Linq-Digital-Business-Card-Networking/dp/B09LGK6WH1) - verified 2026-05-20
- [Meetily - Self-Hosted Meeting Transcription: 10 Open Source Tools (2026)](https://meetily.ai/blog/best-self-hosted-meeting-transcription-tools-2026) - verified 2026-05-20
- [GitHub - Zackriya-Solutions/meetily (open-source local meeting transcription)](https://github.com/Zackriya-Solutions/meetily) - verified 2026-05-20
- [DEV Community - Building a self-hosted AI meeting note taker (community source)](https://dev.to/zackriya/we-built-a-self-hosted-ai-meeting-note-taker-because-every-cloud-solution-failed-our-privacy-1eml) - verified 2026-05-20
- [Microsoft - JavaScript AI Build-a-thon Season 2](https://developer.microsoft.com/blog/the-javascript-ai-build-a-thon-season-2-starts-today) - verified 2026-05-20
- [Agent Academy Hackathon (judging rubric, key dates)](https://microsoft.github.io/agent-academy/events/hackathon/) - verified 2026-05-20
- [AURORA Global Hackathon 2026 (multi-stage elimination structure)](https://aurora.projectgrid.org/) - verified 2026-05-20
- [AngelHack - AI Hackathon Planning Template 2026](https://angelhack.com/blog/ai-hackathon-planning-template/) - verified 2026-05-20
- [StackUp - How to Run a Successful Virtual Hackathon](https://stackup.dev/blog/virtual-hackathon/) - verified 2026-05-20
- [Realms docs - AI Agents & Realms (DAO delegate agent pattern)](https://docs.realms.today/developer-resources/ai-agents-and-realms) - verified 2026-05-20
- [SocialBlock docs - Governance AI Agents (agents-don't-vote model)](https://docs.socialblock.io/governance/governance-ai-agents) - verified 2026-05-20
