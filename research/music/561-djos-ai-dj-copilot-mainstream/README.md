---
topic: music
type: market-research
status: research-complete
last-validated: 2026-04-29
related-docs: 432, 475, 530, 549, 557
tier: STANDARD
---

# 561 - djOS™ AI DJ Co-Pilot (Mainstream Entertainment Group, Apr 27 2026)

> **Goal:** Decide what ZAO does about djOS™. Three lenses: 1) Tool ZAOstock could use day-of (Oct 3). 2) Strategic signal for ZAO Music + WaveWarZ. 3) Partnership / collaboration angle - patent-pending AI-DJ coordination is adjacent to ZAO's artist-first stack.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Reach out to djOS / Cory Poccia (DJ Cory P) for a partnership conversation | **YES, EXPLORATORY** | djOS is in development, just announced 2026-04-27. Founder is a working DJ since 2002. ZAO is artist-first (memory `project_zao_master_context`) + ZAOstock Oct 3 needs day-of music programming. Talking now is cheap; partnership later is easier with relationship in place. |
| Pilot djOS at ZAOstock Oct 3 if available by then | **MAYBE - DEPENDS ON BETA ACCESS** | Patent-pending, in development, no public pricing. Day-of festival is high-risk slot for unproven tech. Only pilot if djOS gives us a sandbox + their DJ on standby. |
| Adopt djOS's "crowd heat mapping" pattern as inspiration for WaveWarZ artist signals | **YES, AS PATTERN** | djOS uses optical-flow + audio source-separation to score crowd energy in real time. WaveWarZ runs prediction markets on artists - similar telemetry could power "live performance score" markets. Patterns lifted are not patent-blocked; only djOS's specific implementation is. |
| Compete with djOS by building our own | **NO** | Out of scope. ZAO's edge is artist + community + onchain attribution, not DJ-software UX. djOS is solving a different layer. |
| Watch as canary for "AI co-pilot for live performance" category | **YES** | Plus PulseDJ + VirtualDJ 2026's AI features (set building, lyrics). Category is heating up. |

## What djOS Is (Verified 2026-04-29)

| Field | Value |
|---|---|
| Company | Mainstream Entertainment Group Inc. |
| Founder | **Cory Poccia (DJ Cory P)**, club DJ since 2002 |
| Announced | **2026-04-27** (2 days ago at this doc's authoring) |
| Site | `djos.ai` |
| Patent status | **Patent-pending** in US + international, filings April 2025 |
| Status | In development, soliciting platform devs / venue ops / broadcasters / investors |
| Public pricing | Not disclosed |

### Architecture (per press release)

djOS is an **operating system layer**, not a DJ application. It integrates with major DJ platforms:

- Serato
- Rekordbox
- Traktor
- VirtualDJ

Patent claims cover an **integrated architecture** combining:

1. Constraint-satisfaction setlist generation
2. Library-reconciled platform-specific export
3. Privacy-preserving real-time telemetry
4. Feasibility-constrained transition repair
5. Deviation-weighted learning

### Core flow

**Before the event:**
- Ingests DJ's music library + historical performance data + client-defined event parameters (must-play, do-not-play, energy curves, scheduled timing cues)
- Generates a structured, acoustically optimised setlist
- When a track can't be resolved in the local library, **substitutes a harmonically + energetically compatible alternative**

**During the set:**
- Top-down camera over the booth + dedicated ambient mic
- "Privacy-preserving telemetry pipeline":
  - **Dense optical flow** on dance-floor movement
  - **Deep-learning source separation** to isolate crowd audio from music
- **Crowd heat mapping** monitors energy in real time
- Adapts setlist on the fly - suggests track changes based on loops, skips, transitions

### Products

- **djOS Pulse** - flagship product for professional + working DJs. Setlist gen + crowd monitoring + recommendations.
- **DNA feature** - AI modelling of "elite DJ styles" so any DJ can perform in the tradition of globally recognised artists.

## Why djOS Matters to ZAO

### Angle 1 - ZAOstock Oct 3 day-of

ZAOstock has 8+ hours of music programming on Franklin St Parklet. Talent is open-call (memory `project_zaostock_open_call`). DJ slots between live acts.

If djOS ships a beta by August/September 2026, it could:
- Help curate transitions between artists (genre changes, energy curves)
- Give the day-of stage manager a real-time crowd-energy signal
- Auto-substitute track when an artist doesn't show

**Risk:** new tech at a flagship event. Only pilot with their team on-site or on-call.

### Angle 2 - WaveWarZ prediction markets

ZAO runs WaveWarZ - prediction markets on artists. Today scoring is from public signals (followers, plays, Farcaster engagement). djOS's crowd-heat-mapping is a different signal class: **live performance energy**.

Pattern lift (not direct integration): WaveWarZ could include a "live performance score" market component if any data partner provides crowd-energy telemetry. djOS doesn't need to be the partner - the pattern applies to any venue with the kit.

### Angle 3 - ZAO Music attribution + artist owns data

Memory `project_zao_music_entity` says ZAO Music = 0xSplits + on-chain attribution + artist-first by design. Korea voice actor crisis (Doc 508) is the cautionary tale.

djOS captures **performance data per show**. Question for any partnership: who owns the captured data? In ZAO's framing, the **DJ owns** their performance telemetry. djOS as a tool that lets the artist export + monetise their own performance signal is interesting; djOS as a platform that aggregates performance data into a labels-style aggregator is the opposite.

This is the strategic question to put to Cory P early.

### Angle 4 - The category is real

Adjacent products discovered in same search:
- **PulseDJ** - "AI DJ Copilot" (pulsedj.com)
- **VirtualDJ 2026** - now ships AI lyrics + AI set building + new FX engine
- **DJ.Studio** - AI workflows guide

So djOS is one of several entrants. ZAO's read should be: this is a 2026 trend, not a one-off. Worth tracking the category, not just djOS.

## Outreach Pattern (If Zaal Greenlights)

Memory `feedback_dont_invent_outreach` says do not draft emails to people Zaal didn't bring up. **Zaal didn't ask for outreach drafts in this research.** This doc proposes the angle but does NOT include a draft email.

If Zaal greenlights outreach, the conversation hooks are:

1. ZAOstock Oct 3 = real festival, real DJ slots, real beta opportunity
2. ZAO Music = artist-first attribution model, philosophical alignment with "DJ-built tool that respects DJ data"
3. WaveWarZ = adjacent market for live performance signal (pattern lift, no direct integration request)
4. Cory P is a working DJ since 2002; Zaal's network (Steve Peer per memory `project_steve_peer`, ZAO music task forces) overlaps the indie / club DJ world

## Risks

| Risk | Mitigation |
|---|---|
| Patent-pending coverage may extend to patterns we adopt | Lift principles only; don't replicate the specific 5-claim architecture |
| In-development means no SLA; ZAOstock can't gate critical path on djOS | Treat as nice-to-have, not load-bearing |
| Founder is solo (or small team); bus factor unknown | Start with conversation, not commitment |
| AI on stage at a festival is press-magnet - good and bad | Decide messaging upfront if we pilot |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide whether to reach out to Cory P / djOS | **Zaal** (per `feedback_dont_invent_outreach`) | Decision | This week |
| If yes, log in `project_djos_relationship.md` memory + draft a single outreach message Zaal approves | Zaal | Memory + draft | Conditional |
| Track djOS beta launch + pricing | n/a | Calendar / signup at djos.ai | Ongoing |
| Monitor PulseDJ + VirtualDJ 2026 + DJ.Studio for category movement | n/a | Quarterly research | 2026-07-29 |
| Add "live performance score" pattern to WaveWarZ design notes | Zaal | Design memo | When WaveWarZ V3 lands |

## Also See

- [Doc 432 - The ZAO master positioning](../../community/432-tricky-buddha-zao-master-context/) - artist-first frame
- [Doc 475 - ZAO Music entity](../) - artist owns attribution
- [Doc 530 - ZOUNZ artist trait brief](../../community/530-zounz-artist-trait-brief/)
- [Doc 549 - 21st.dev hub](../../dev-workflows/549-21st-dev-component-platform/) - source of `/21st` for any DJ-facing UI we'd build
- [Doc 557 - Onchain festival ticketing for ZAOstock](../../dev-workflows/557-onchain-festival-ticketing-zaostock/) - day-of festival infra
- Memory `project_steve_peer` - Ellsworth drummer + ZAOstock co-curator; potential warm intro to indie-DJ world
- Memory `feedback_dont_invent_outreach` - reason this doc proposes but doesn't draft outreach
- Memory `feedback_no_unconfirmed_anchor_partners` - djOS is NOT confirmed; never list as anchor partner

## Sources

- [djOS official press release (wfmz.com)](https://www.wfmz.com/online_features/press_releases/djos-launches-patent-pending-ai-co-pilot-transforming-live-dj-performance-into-an-adaptive-experience/article_d2908a77-d3c8-54f0-bce1-cb559e68031a.html)
- [djOS press release (einpresswire)](https://www.einpresswire.com/article/908159078/djos-launches-patent-pending-ai-co-pilot-transforming-live-dj-performance-into-an-adaptive-experience)
- [djos.ai official site](https://djos.ai/)
- [aimusicpreneur.com - djOS AI Co-Pilot](https://www.aimusicpreneur.com/ai-tools-news/djos-ai-co-pilot-live-dj-performance-2026/)
- [PulseDJ blog - AI DJ Software](https://blog.pulsedj.com/ai-dj-software) - category context
- [DJ.Studio - AI Workflows in 2026](https://dj.studio/blog/ai-workflows-djs-preparation-performance) - category context
- [VirtualDJ 2026 AI features (gearnews)](https://www.gearnews.com/virtualdj-2026-dj/) - category context

## Staleness Notes

djOS announced 2 days before this doc. Pricing, beta access, and feature scope will evolve fast. Re-validate monthly until beta lands. If category shifts (PulseDJ acquires djOS, or vice versa), supersede this doc.
