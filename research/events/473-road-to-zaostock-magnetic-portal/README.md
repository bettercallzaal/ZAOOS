# 473 - Road to ZAOstock: Magnetic Portal Spec

> **Status:** Proposal, Tyler to iterate
> **Date:** 2026-04-21
> **Goal:** Blueprint for a single Magnetic-powered portal that drips pre-event content weekly, turns into the day-of scavenger hunt, and persists as a post-event artifact. Came from Tyler Stambaugh joining the Apr 21 meeting and proposing the frame.

---

## The insight (Tyler's framing)

"The difference between an email campaign and a portal is that emails die in your inbox, a portal accumulates into something you can return to."

A 12-week drip campaign via email = 12 forgotten messages. The same campaign via Magnetic = one growing portal of value that attendees can revisit, screenshot, share, and that builds brand surface every week.

---

## Three-phase arc

### Phase 1: Pre-event (June through September)

**Mechanics:**
- One Magnetic portal at /stock/road-to or similar
- Weekly "drop" adds a new tile to the portal
- Portal grid grows over 14 weeks (mid-June through Oct 3)
- Each drop has something immediate: a sneak peek, a sponsor reveal, an artist spotlight, a behind-the-scenes update
- Users who collected an early drop see their count on the portal

**Content calendar (sketch):**
| Week | Drop type | Hook |
|------|-----------|------|
| June 15 | ZAOstock 2026 announcement magnet | Foundation post, event overview |
| June 22 | Partner 1 reveal | First confirmed partner + why they matter |
| June 29 | Artist 1 spotlight | First confirmed artist, link to their music |
| July 6 | Ville tie-in | DCoop's DC event plus how the two connect |
| July 13 | Partner 2 reveal | |
| July 20 | Artist 2 spotlight | |
| July 25 | Ville event magnet | Live attendance magnet at Ville |
| July 27 | Ville recap | Photos, quotes, next-event tease |
| August 3 | Artist 3 spotlight | |
| August 10 | The Cypher teaser | ZAOCHELLA Miami Cipher snippet |
| August 17 | Full lineup poster reveal | All 10 artists public |
| August 24 | Ticket drop | Tickets go live |
| August 31 | Sponsor deck final | All partners named |
| September 7 | Countdown starts | Under 30 days |
| September 14 | ZAOCHELLA Miami Cipher full release | Drives traffic to /stock |
| September 21 | Travel + logistics | Parking, food trucks, afterparty info |
| September 28 | Final schedule | Run-of-show public |
| October 3 | LIVE | Day-of scavenger hunt begins |

### Phase 2: Day-of (October 3)

- Portal transforms into day-of mode
- QR codes posted at venue entry, main stage, bar, each artist set
- Each scan drops a collectible into the user's portal
- Collect 5+ collectibles during the day = post-event merch drop unlocks
- Artist-specific drops: each artist has a unique collectible that hides an unreleased song snippet, photo, or backstage clip

### Phase 3: Post-event (October 4 onwards)

- Portal preserves the full 14-week timeline + day-of collection
- New "recap" tile drops showing photos, stats, cypher release
- Attendees get a final artifact they can return to later in the year
- Leaderboard: who collected the most across the full journey
- Tyler's insight: audience intelligence. We now know who showed up, what they engaged with, how active they were

---

## Tech stack (Tyler's existing Magnetic platform)

- One portal per campaign (Magnetic handles)
- Signed URL uploads (audio, video, image) hosted in their R2 infrastructure
- Onchain NFT layer underneath for traceability, but UX is email-based (web2 friendly)
- Public QR code generator for day-of
- Admin dashboard for Zaal + team to see engagement

---

## Integration with existing ZAOstock systems

- /stock landing links to the portal in the CTA section
- /stock/program references the day-of scavenger hunt mechanic
- Dashboard Volunteers tab can be extended to show Magnetic collectors who opted in (overlap with volunteer pool)
- Media capture pipeline (research/events/433) drops go into the post-event portal recap tile

---

## Who owns what

- **Tyler Stambaugh:** portal architecture, QR generator, Magnetic admin, technical integration
- **Zaal:** content calendar, weekly drop copy, approval of each drop
- **DaNici:** visual design of each drop tile (template system so weekly drops are fast to produce)
- **DCoop:** artist spotlight coordination, artist-specific day-of drops
- **Shawn:** Web3 music label tie-in (cipher drops routed through the portal)

---

## Budget ask

- Magnetic platform: in-kind via Tyler joining advisory
- Portal branding / creative: DaNici existing scope
- Content production: Zaal + team existing scope
- QR code printing for day-of: ~$100 (signage budget)

**Total new budget ask: ~$100 for print**

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Low early engagement | Front-load value - first 3 drops include tangible things (partner discounts, artist music, etc) |
| Content production exhaustion | Lock content calendar by June 15, batch produce in 2-week sprints |
| Day-of QR failures (wifi, scanning issues) | Multiple QR locations + fallback paper signup; Tyler's platform handles offline queuing |
| Attendees don't know the portal exists | Promote via every channel: email signature, onepager, stage MC, sponsor booth, ticket email |

---

## Success metrics

- Pre-event: 200+ unique portal visitors by August 1, 500+ by Oct 1
- Day-of: 30% of attendees collect at least one day-of drop
- Post-event: 100+ users check the portal in the 2 weeks after the event
- Soft metric: sponsors see engagement data and ask to return for 2027

---

## Next steps

1. Tuesday Apr 28 meeting: Tyler presents this framework live to team
2. DaNici + Tyler: kickoff call on the visual template system
3. Zaal: draft first 4 weeks of content calendar (June 15 through July 6)
4. Prototype portal launches June 15

---

## Sources

- Apr 21 meeting transcript: Tyler's 15-minute pitch on road-to-event + day-of + post-event arc
- Running Man / Ironman endurance event pre-drip models (Tyler's co-founder is a marathoner)
- Existing Magnetic platform: https://magnetiq.xyz (Tyler's product)
- Outer Edge LA scavenger hunt precedent (Shawn's reference)

## Related ZAO research

- [432 - ZAO master context](../../community/432-zao-master-context-tricky-buddha/)
- [433 - Media capture pipeline spec](../433-zao-media-capture-pipeline-spec/)
- [428 - ZAOstock run-of-show](../428-zaostock-run-of-show-program/)
