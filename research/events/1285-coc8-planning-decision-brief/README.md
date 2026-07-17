---
topic: events/coc-concertz
type: decision-brief
status: needs-pilot-data (run generate-pilot-report.ts Saturday morning, then apply framework)
created: 2026-07-17
board-task: f622ee24
related-docs: 1210, 1256, 1274, 964
owner: Zaal (to approve #8 date + format after reading pilot report)
---

# 1285 -- COC Concertz #8: Planning Brief + Pilot Decision Framework

> **How to use:** Run `npx tsx scripts/generate-pilot-report.ts` Saturday morning after COC #7. Then read the numbers into the decision matrix below. The matrix outputs a recommended #8 format in 5 minutes. Target: lock COC #8 date + format by Monday July 21 to maintain monthly cadence (Aug 9 or Aug 16).

---

## Context: The Show Series

COC Concertz is now 7 shows deep (March 2025 – July 2026), monthly cadence since March 2026. COC #7 (Jul 18) is the first open-access pilot — wallet gate dropped to measure what open access does to attendance and archive participation.

Monthly cadence targets:
- COC #8: **August 9, 2026** (5 weeks after #7) ← recommended — summer still hot
- COC #8 alt: **August 16, 2026** (6 weeks after #7)
- COC #9: September 13, 2026 (maintains 4-5 week cadence)

---

## Saturday Morning: Read the Numbers

After running `npx tsx scripts/generate-pilot-report.ts`, look at these 4 key numbers:

| Metric | Where to find | What it tells you |
|--------|--------------|------------------|
| `concurrentViewers` | pilot report | Live audience size; baseline for #8 growth target |
| `walletNotConnected` | pilot report | % of attendees who wouldn't have made it through the old gate |
| `archiveUploads.gateless` | pilot report | How many people uploaded who didn't have ZABAL token |
| `battleVotes.total` | pilot report | WaveWarZ engagement during the show |

---

## Decision Matrix: What the Numbers Tell You for #8

### Gate Decision (wallet gate on/off for COC #8)

| Scenario | Signal | Recommended #8 gate |
|----------|--------|-------------------|
| `walletNotConnected` > 30% of total visitors | Open access meaningfully widened the audience | Keep gateless for #8 |
| `walletNotConnected` < 10% | Most attendees had wallets anyway; pilot didn't move the needle much | Restore token gate for #8 (or soft gate: wallet = early archive access) |
| `archiveUploads.gateless` > 5 uploads | Non-wallet users actively engaged with the archive | Keep gateless + note JubJub integration opportunity |
| `archiveUploads.gateless` = 0 | Gateless didn't produce archive participation | Consider a "free view, pay-for-archive" model (#8 variant: gateless entry + JubJub pay-per-second archive) |

**Zaal call:** approve gate decision for #8 by Monday.

### WaveWarZ Integration Level for #8

COC #7 has a live BattleVote widget. If `battleVotes.total` > 50, the WaveWarZ integration is landing. If it's < 10, it needs more promotion.

| `battleVotes.total` | Recommended #8 WaveWarZ action |
|--------------------|-------------------------------|
| > 100 | Promote the battles pre-show ("come vote, traders get early picks"); consider a live prize for top voter |
| 20-100 | Fine; add a simple pre-show reminder in the show-day social templates |
| < 20 | Feature the battles more prominently in the show format; brief battlers to actively promote "go vote now" |

### Archive Revenue: JubJub Pilot

Per doc 1274 (JubJub x ZAO partnership brief), the recommended first move is wrapping the COC #7 Saturday archive in a JubJub embed. If at least 5 people pay for 10+ seconds, it validates Tier B (COC #8 native embed).

**Action for Saturday:** After running generate-pilot-report.ts, also do:
1. Book Tom McCarthy call (contact: `~/.zao/private/jubjub-tom-mccarthy.md`)
2. Get a JubJub embed link for the #7 archive recording
3. Post "COC #7 archive is live — watch free, or pay to support the artists: [link]" to Farcaster /coc channel

If JubJub is not ready Saturday (Tom not yet reachable), skip for now and target COC #8 native launch.

---

## COC #8 Format Options

Given 7 shows of data and the #7 pilot, three format options for #8:

### Option A: Consolidation Show (recommended)
Keep the WaveWarZ Takeover theme, maintain DJ Zaal format, apply pilot learnings to gate + archive. Safe choice if #7 pilot was inconclusive or marginal.

**Lineup direction:** One established WaveWarZ artist headline (GodCloud had first-ever WW headline at #5 — consider Dagger or Krytic from the Africa expansion). Support: 2-3 WaveWarZ battlers.

### Option B: New Theme Show
A different COC theme (not WaveWarZ-focused) to show series versatility. Good if #7 metrics suggest the WaveWarZ audience is saturated.

**Lineup direction:** A ZAOstock preview show — feature an artist who will perform at ZAOstock (Oct 3). Uses #8 to promote Oct 3.

### Option C: ZAOstock Promo Show
Explicitly theme #8 as "ZAOstock is coming" — feature 2 confirmed ZAOstock performers. Drives awareness of the Oct 3 Ellsworth ME show.

**Why this matters for north star:** A COC show that doubles as ZAOstock promotion extends ZAO's live event reach — COC Concertz (virtual) → ZAOstock (IRL) → ZAO as an IP/event brand.

**Zaal call:** Pick Option A, B, or C by Monday. If Option C, which ZAOstock artists are confirmed by then?

---

## Before COC #8: Required Actions (regardless of format)

These need to happen no matter what gate/format is chosen:

| Action | Owner | Timing | Notes |
|--------|-------|--------|-------|
| Fix Cloudinary key permissions | Zaal | Before #8 | Still broken from #7 blockers; must resolve before archive uploads work |
| Book COC #8 date on Spatial.io | Zaal/Stilo | Week of Jul 21 | Coordinate with Stilo for venue booking |
| Confirm artist lineup | Zaal | By Jul 28 | 3-4 weeks of promo = minimum viable |
| Set up #8 event in admin | Loop | After date confirmed | `npx tsx scripts/update-coc8.ts` (new script needed) |
| Update WaveWarZ battle brief | Loop | By Aug 1 | `docs/wavewarz-brief.md` — update artist roster + past show data |
| Decide JubJub integration | Zaal | By Jul 21 | After Tom McCarthy call; Tier A or Tier B |
| Archive #7 recording to Arweave | Zaal | Week of Jul 21 | Complete the archive pipeline, get the AR URL for the JubJub embed |

---

## Show #8 Promotion Cadence

Based on COC attendance growth playbook (doc 964): notifications and clips are the highest-leverage growth vectors.

| When | Action | Channel |
|------|--------|---------|
| T-14 days | Announce lineup on Farcaster + X | ZOL draft, Zaal approves |
| T-7 days | "Last week to register" RSVP push | Mini app notification + Farcaster |
| T-2 days | Battle preview: "vote before the show, trade on WaveWarZ" | WaveWarZ Farcaster channel |
| Day of | Show-day post (use templates from docs/coc7-show-day-socials.md as base) | All channels |
| +2 hours | Archive live post (JubJub embed if ready) | Farcaster /coc |

---

## Metrics Targets for #8

Set these targets on Monday based on #7 pilot actuals + a growth factor:

| Metric | Formula | Example (if #7 had 80 viewers) |
|--------|---------|-------------------------------|
| Concurrent viewers | #7 actual × 1.3 | 80 × 1.3 = 104 |
| Archive uploads | #7 actual × 1.5 | Set floor of 10 regardless |
| Battle votes | #7 actual × 2 | Target 2× engagement once promoted harder |
| JubJub pays (if live) | Any > 0 is a win | New metric for #8 |

---

## Loop Action Checklist (once Zaal locks date + format)

- [ ] Create `scripts/update-coc8.ts` (copy `update-coc7.ts`, update event fields)
- [ ] Create `docs/coc8-show-day-socials.md` (adapt COC #7 templates for #8 theme)
- [ ] Update `src/data/wavewarz-history.json` with any post-#7 battles
- [ ] PR to COC Concertz with JubJub embed component (if Tier B approved)
- [ ] PR to add COC #8 event to admin panel
