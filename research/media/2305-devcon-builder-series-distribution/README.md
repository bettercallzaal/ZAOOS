---
topic: media
type: guide
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: 827, 2153, 2304, 2282
original-query: "Devcon Builder Series distribution prep - collect the existing assets (research/ has the Zaal builder series memory), draft the distribution checklist."
tier: STANDARD
---

# 2305 - The Builder Series: what exists, and the distribution checklist

> **Goal:** Collect every existing Builder Series asset in one place and draft the distribution checklist, so when episodes exist the pipeline is a checklist and not a scramble. Prep only - nothing outbound.

## What the series is (from the assets, not from memory)

Doc 827 (Zaal x civilmonkey, 2026-06-09, transcript on disk) defines it:

- A **deeper-conversation builder/interview series**, positioned as a **complementary lane to GM Farcaster** - *"where's the lane I can do something they'd want if they had the time"*. Complement, never competitor.
- Corpus plan: the **ZABAL Games batch + agentic-bootcamp transcripts**, hosted on Zaal's page, made **AI-queryable + RSS-fed** - so a builder joining later can mine the whole vein.
- Guest cadence named in the source: **Rizzle, Cassie, Sofa, Kenny, Adrian.**

The Devcon India thread travels with it (same call): Zaal is on the **music-stage team**, wants to crowdfund bringing **Thy Revolution (UK) + Iman (Zambia)**; contacts Candy/Candyloo + Carlota (Telegram only); lodging/music-house partner Kshitij (DDAN).

## Asset inventory, verified on disk this run

| Asset | Where | State |
|---|---|---|
| The defining conversation | `research/events/827-.../README.md` + **full transcript.md** | On disk, FULL |
| Series memory | `project_zaal_builder_series_devcon` (memory store) | Current as of 2026-06-09 |
| The interview slot | Doc 2304 - ZM's **Tuesday interview block**, booked a week out | Live, running |
| Aggregation rail | Doc 2153 - ZM media aggregation (AI-queryable + RSS is ITS job) | Architecture doc, decisions pending |
| Guest pipeline warm list | CRM: adrienne/**gmfarcaster**, kenny/POIDH, cassie, rish, kmacb (doc 2158 activation map) | 3 of 5 named guests are already top-of-CRM |
| Recap pattern | Doc 2181 - guest-stream recaps | Shipped pattern |

**The finding:** the series does not need new infrastructure. The Tuesday ZM slot is the recording surface, doc 2153's aggregation is the archive surface, and the guest list is already in the CRM as warm contacts. What is missing is only the **per-episode distribution checklist** - below - and bookings.

## The distribution checklist (per episode)

**Before (booking - all outbound = Zaal sends):**
- [ ] Guest confirmed in writing by Monday noon for the Tuesday slot (doc 2304's rule: never announce unconfirmed)
- [ ] Intro card: who they are, what they built, ONE opening question
- [ ] Promo post drafted, HELD until confirmation

**During (the Tuesday show):**
- [ ] Record via the standing ZM setup (Restream); the newsletter-script skeleton still opens the show
- [ ] Flag 2-3 clip moments live, timestamped

**After (the distribution ladder, in order):**
- [ ] Clips to ohnahji (timestamped, standing pattern)
- [ ] One cast per segment - zabal/zaostock channels, Zaal sends
- [ ] **Credit line for any GM Farcaster material used** - visible, always (`credit-attribution.md`)
- [ ] Transcript into the ZM archive (doc 2153 rail) - this is what makes it AI-queryable; the transcript is the asset, the video is the ad
- [ ] RSS entry once the 2153 feed exists
- [ ] Episode recap via the doc 2181 pattern; Friday recap mentions it; Monday newsletter carries the best quote
- [ ] Guest thanked with the link package (their clips, their quote, the archive link) - the thing that makes the next booking easy

## Two flags, not resolved here

1. **The scholarship clock is of unknown state.** The June source says *"apply for scholarships now (offered last year, were closing around this time)"* - that was 2026-06-09. Whether Devcon India scholarship windows are open, closed, or reopened as of today is **unverified** (not fetched this run). If the Devcon travel plan is still live, this is the first thing to check - it gates the crowdfund-three-people plan.
2. **GM Farcaster is both the lane-to-complement and a top CRM contact** (adrienne). The complementary-lane positioning from doc 827 should be said TO them at some point rather than only about them - warm contact, Zaal's DM, his timing.

## Findings

1. Every piece of series infrastructure already exists under other names - Tuesday slot, aggregation rail, recap pattern, warm guest CRM. This doc is assembly, not invention.
2. Three of the five named guests are already top-of-CRM warm contacts.
3. The transcript, not the video, is the compounding asset - it is what feeds the AI-queryable archive the source conversation actually asked for.
4. The scholarship deadline is the only clock, and its state is unknown - flagged first in Next Actions.

## Also See

- [Doc 827](../../events/827-zaal-civilmonkey-devcon-india-builder-series-proto-dao-jun9/) - the defining call, with transcript
- [Doc 2153](../2153-zm-zao-media-aggregation-system/) - the archive rail
- [Doc 2304](../2304-zm-show-runbook/) - the Tuesday slot and its rules
- [Doc 2282](../../business/2282-reddit-as-oss-outreach-channel/) - why the archive should be joinable, not just published

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Check the Devcon India scholarship window state - the only live clock, currently unknown | @Zaal | Manual | 2026-08-19 |
| Book the first series guest into a Tuesday slot from the warm five (Rizzle/Cassie/Sofa/Kenny/Adrian) | @Zaal | Gated outbound | 2026-08-24 |
| Decide doc 2153's pending aggregation choices so the transcript archive has a home before episode 1 | @Zaal | Decision | 2026-08-24 |
| Adopt this checklist into the doc 2304 runbook's Tuesday block on first use | @Zaal | Merge | on first episode |

## Sources

- `research/events/827-.../README.md` + `transcript.md` - **[FULL]** read from disk; positioning, corpus plan, guest names and Devcon contacts all from it.
- `project_zaal_builder_series_devcon` memory - **[FULL]** read from disk; dated 2026-06-09 and treated as a June snapshot, not current truth.
- Docs 2153, 2304, 2181, 2158 - **[FULL]** on-disk state confirmed for each claim made about them.
- Devcon India scholarship pages - **[FAILED]** not fetched this run; the deadline state is flagged unknown rather than asserted either way.
