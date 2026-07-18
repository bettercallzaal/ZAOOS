---
topic: events/coc-concertz
type: DECISION-GUIDE
status: ready — fill actuals Saturday Jul 19 after pilot report run
created: 2026-07-18
related-docs: 1210, 1256, 1295, 1300, 1367
owner: Zaal (interprets + decides Mon Jul 21)
---

# 1393 — COC #7 Pilot Metrics Gate Matrix (Jul 2026)

> **How to use:** Run `npx tsx scripts/generate-pilot-report.ts` Saturday morning Jul 19. Paste actuals into the **Results** column. Read the gate row for each metric. Bring this sheet to the Monday Jul 21 COC #8 date decision.

---

## Metrics Captured by Pilot Report

The `generate-pilot-report.ts` script (PR #50 — must merge before show) queries:

| Source | Metric | What It Measures |
|--------|--------|-----------------|
| Firestore `stats/visitors` | concurrent_now | Active page sessions at report time (may be 0 Saturday) |
| Firestore `stats/visitors_peak` | **peak_concurrent** | Highest real-time visitor count during show (primary KPI) |
| Firestore `gallery` collection count | gallery_count | Fan photos/clips uploaded to in-venue gallery widget |
| Firestore `contestEntries` count | contest_entries | WaveWarZ fan contest submissions (COC #7-specific) |
| Supabase `archive_uploads` (show_id coc7*) | archive_total | Files archived to Arweave with UDL license from COC #7 |
| Supabase same | unique_wallets | Distinct wallet addresses that uploaded — true unique contributors |

---

## Gate Matrix

Fill actuals after running the pilot report. Then apply the gate decision.

### 1. Peak Concurrent Viewers

| Gate | Threshold | Meaning |
|------|-----------|---------|
| RED | < 5 | Minimal attendance — show did not draw. Review promotion strategy before #8. |
| YELLOW | 5–14 | Small but real audience. Community is there; grow the invite list for #8. |
| GREEN | 15–30 | Solid virtual show night. Proceed to COC #8 within 3 weeks. |
| GREAT | 31+ | Breakout show. Lock COC #8 within 2 weeks; pitch press via doc 1388 (Hypebot). |

> **Note:** peak_concurrent tracks cocconcertz.com page viewers only. Twitch viewers and Spatial.io room attendees are SEPARATE and not captured here. A low website count does not mean a small show overall — always cross-check Twitch analytics and Spatial room peak.

**Actual (fill Sat Jul 19):** ___  
**Gate reached:** ___

---

### 2. Fan Gallery Uploads

| Gate | Threshold | Meaning |
|------|-----------|---------|
| RED | < 3 | Gallery widget saw no use — check Cloudinary config (known Vercel env blocker). |
| YELLOW | 3–9 | Light engagement. Gallery is working; promote it in-show chat next time. |
| GREEN | 10–25 | Healthy fan artifact creation. Fan gallery is a real COC IP generator. |
| GREAT | 26+ | Viral-level gallery activity. Feature the best uploads in recap + press. |

> **Cloudinary gate:** If the actual is RED, first check whether the Cloudinary key fix (show blocker #1) was applied in Vercel before the show. A RED gallery count with a missing key is not a signal about audience engagement — it is a config miss. Check Cloudinary uploads directly via the dashboard at cloud dzzqdbo9k.

**Actual (fill Sat Jul 19):** ___  
**Gate reached:** ___

---

### 3. Arweave Archive Uploads (Supabase)

| Gate | Threshold | Meaning |
|------|-----------|---------|
| RED | < 2 | Archive not used. Verify the archive upload UI was visible (wallet gate must be off). |
| YELLOW | 2–9 | Archive is live but not discoverable enough — add a more prominent CTA for #8. |
| GREEN | 10–30 | Meaningful onchain fan archive created. Use count in grant + press copy. |
| GREAT | 31+ | Major archive event. Each upload is a permanent UDL-licensed IP record. |

**Actual (fill Sat Jul 19):** ___  
**Unique wallets (fill Sat Jul 19):** ___  
**Gate reached:** ___

---

### 4. Contest Entries

| Gate | Threshold | Meaning |
|------|-----------|---------|
| RED | 0 | Contest page may not have been visible or contest was already closed pre-show. Check. |
| YELLOW | 1–4 | Low entry — contest discovery issue. Move entry CTA closer to LiveMode for #8. |
| GREEN | 5–14 | Engaged audience willing to participate, not just watch. |
| GREAT | 15+ | Contest drew real participation. Repeat format for #8. |

> **Note:** COC #7 had a contest (see archive/contest). If it closed before show night, entries will reflect pre-show registrations, not show-night urgency.

**Actual (fill Sat Jul 19):** ___  
**Gate reached:** ___

---

## Composite Gate Decision

After filling all four actuals, apply this table to reach Monday's decision:

| Composite Signal | COC #8 Action |
|-----------------|---------------|
| All GREEN or GREAT | Lock COC #8 within 2 weeks. Format = WaveWarZ reprise (doc 1367 artist DMs go out Jul 21). |
| 2+ GREEN, rest YELLOW | Lock COC #8 within 3 weeks. DM top WaveWarZ artists. Fix any RED config issue first. |
| Majority YELLOW, 0+ RED (non-config) | Delay COC #8 by 1 month. Run a format debrief with Zaal + ThyRev. What wasn't working? |
| Any RED due to config miss | Fix config. Do NOT delay COC #8 — config misses are not audience signals. |
| Peak concurrent GREAT regardless of other gates | Treat as show success. Proceed to COC #8 within 2 weeks. Website KPI alone proves the show drew. |

---

## Cross-Checks (Not in Pilot Report — Pull Manually)

These metrics are NOT captured by `generate-pilot-report.ts` but should inform the Monday decision:

| Metric | Where to Find | Target |
|--------|--------------|--------|
| Twitch peak viewers | Twitch Dashboard > Analytics | Any positive count = stream is working |
| Twitch stream duration | Twitch Dashboard | Full 2-3h = no technical drops |
| Spatial.io peak room occupancy | Spatial admin panel | Capacity varies; note the high-water mark |
| BattleVote total votes | `npx tsx scripts/manage-battle.ts status` after each battle | ≥ 10 votes/battle = engaged voters |
| LiveChat messages | Firestore `chatMessages` collection count | ≥ 20 = active chat room |

---

## Monday Jul 21 Decision Checklist

- [ ] Run `npx tsx scripts/generate-pilot-report.ts` (requires PR #50 merged)
- [ ] Fill actuals above
- [ ] Apply composite gate
- [ ] Pull Twitch analytics (peak viewers, duration)
- [ ] Check Spatial room peak if admin access is available
- [ ] Run `npx tsx scripts/manage-battle.ts status` for each battle vote count
- [ ] Open doc 1295 (COC #8 planning brief) and doc 1367 (artist outreach) — apply gate decision to DM timeline
- [ ] Lock COC #8 date (target: Mon Jul 21 confirmed)

---

## Baseline Reference: COC #6 (Jun 13, 2026 — The African Experience)

COC #6 ran with the ZABAL wallet gate ON (archive required ZABAL token to access). No formal pilot report was run. As a result, there is no apples-to-apples baseline for archive uploads or open-access engagement. The COC #7 pilot report IS the baseline.

> **Implication for gate thresholds above:** The GREEN/GREAT thresholds are set conservatively for a first-time open pilot. COC #8 will have this data as a benchmark — the gate matrix will sharpen significantly for subsequent shows.

---

## Key Risk: PR #50 Not Merged Before Show

If PR #50 (`fix/track-peak-visitors`) is not merged before 4PM EST Jul 18:

- `stats/visitors_peak` will NOT be written during the show
- The pilot report will show `peak_concurrent = 0` even if 50 people were on the site
- All peak-based gate decisions above become unreliable

**Mitigation if PR #50 misses:** Use Vercel Analytics real-time tab during the show and screenshot the peak page views. This is a manual fallback that captures unique page loads (not concurrent), but it's better than no data.
