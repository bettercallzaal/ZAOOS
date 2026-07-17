---
topic: events/coc-concertz
type: action-plan
status: ready
created: 2026-07-17
board-task: f622ee24
related-docs: 1295, 1256, 1274, 1210
owner: Zaal
deadline: 2026-07-21 (lock COC #8 date by Monday)
---

# 1300 — COC #7 Post-Show Action Plan (July 19–21, 2026)

> **When:** Starting Saturday July 19, morning after COC #7 (July 18 4PM EST).
> **Why:** The open-access pilot data only exists for 72 hours before memory fades. Capture fast, decide fast.

---

## Hour 0: Show Ends (Friday July 18, ~6PM EST)

| Action | Owner | Where |
|--------|-------|-------|
| Mark event status = closed in admin | Zaal | COC admin → Events → COC #7 → Status = Closed |
| Screenshot final concurrent viewer count | Zaal | Twitch analytics / Spatial.io |
| Note any battle vote counts from show | Zaal | wwtracker.xyz |
| Send post-show thank-you cast on Farcaster | Zaal or ZOE | /zao channel |

---

## Saturday Morning (July 19, first thing)

### Step 1: Generate the pilot report

```bash
cd /path/to/CoCConcertZ
npx tsx scripts/generate-pilot-report.ts
```

This reads from Supabase + Firestore and outputs:
- Total attendees (wallet vs. no-wallet split)
- Archive upload count
- Concurrent viewer peak
- WaveWarZ battle votes cast
- Pilot status: `gated_access_successful` / `open_access_successful` / `needs_review`

**Save the output.** Paste it into doc 1295's decision matrix.

### Step 2: Apply the pilot decision framework (doc 1295)

Open `research/events/1295-coc8-planning-decision-brief/README.md` and run through the matrix:
- Gate decision: Keep open / Re-gate / Hybrid
- WaveWarZ integration level: Full / Light / None
- Show format: Consolidation / New Theme / ZAOstock Promo
- JubJub archive revenue: Pilot now / Next show / Skip

**Target: draft decision locked by Saturday afternoon.**

### Step 3: Post social templates (PR #46)

Post-show social templates are in `docs/coc7-postshow-socials/` from COC PR #46. Post to:
- Farcaster /zao channel
- X @bettercallzaal
- Telegram @wavewarzclipshq
- LinkedIn (Zaal's profile)

Use real numbers from the pilot report (not placeholders).

---

## Saturday Afternoon: Archive Revenue Pilot (Optional — High Leverage)

**JubJub Tier A**: Wrap the COC #7 Arweave archive in a JubJub per-second USDC embed.
- Estimated time: 1-2 hours (per doc 1274)
- Do BEFORE announcing the archive publicly
- Wallet: bettercallzaal.eth

If the JubJub call with Tom McCarthy hasn't happened yet, ping him Saturday: "The COC #7 archive is live on Arweave — ready to wrap it with JubJub for the announcement?"

Board task 981ea506 (JubJub partnership).

---

## Saturday Evening: Social Amplification

| Platform | Content | Source |
|----------|---------|--------|
| Farcaster | Show recap cast with stats | PR #46 template + real numbers |
| X (Twitter) | Thread: "What happened at COC #7" | PR #46 template |
| Newsletter (Paragraph) | Post-show recap edition | PR #46 long-form draft |
| YouTube | Upload full show recording as unlisted, add JubJub link in description | Manual |

---

## Sunday (July 20): Decision Finalization

By Sunday evening, Zaal should have:
- [ ] Pilot report reviewed
- [ ] Gate decision made (open / gated / hybrid for COC #8)
- [ ] COC #8 date shortlisted (Aug 9 or Aug 16 per doc 1295)
- [ ] JubJub archive wrapped OR call booked
- [ ] Draft message to Hurricane re: WaveWarZ integration level for #8

---

## Monday (July 21): Announce COC #8

By end of day Monday:
- [ ] Lock COC #8 date (Aug 9 or Aug 16)
- [ ] Lock format (from doc 1295 matrix output)
- [ ] Draft announcement cast ready
- [ ] Board task `f622ee24` (COC #8 planning) updated to `in_progress` with locked decision

**Why Monday?** Maintains monthly cadence. COC #8 is ~3 weeks out from announcement to show.

---

## Key Reference Links

| Resource | Link |
|----------|------|
| Admin panel | `<COC_SITE>/admin` |
| Pilot report script | `npx tsx scripts/generate-pilot-report.ts` |
| Pilot decision framework | doc 1295 in ZAOOS |
| JubJub brief | doc 1274 in ZAOOS |
| Post-show social templates | COC PR #46 |
| Full series record | doc 1256 in ZAOOS |

---

## Metrics Targets for the Decision

From doc 1210 (COC #7 pilot design):

| Metric | Signal: Keep Open | Signal: Re-gate |
|--------|-------------------|-----------------|
| Total attendees | > 20 total | < 10 total |
| No-wallet %  | > 30% of attendees | < 10% |
| Archive uploads | Any uploads | Zero |
| Battle votes | > 5 | 0 |
| Concurrent peak | > 10 | < 5 |

If results are ambiguous, default recommendation (doc 1295): **stay open for COC #8** and track the data with the gate off for one more show before deciding.
