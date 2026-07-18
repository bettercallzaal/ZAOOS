---
topic: community/health
type: FRAMEWORK
status: READY — ZOE can run the segmentation query; Zaal decides on outreach actions
created: 2026-07-18
owner: ZOE (automated tracking) / Zaal (outreach decisions)
related-docs: 1259, 1265, 1312, 1221, 1392
---

# 1441 — ZAO Lapsed vs Active Member Re-engagement Framework (Jul 2026)

Defines "lapsed" and "active" for ZAO members across all touchpoints, proposes a segmentation system ZOE can track automatically, and provides re-engagement playbooks for each segment. The North Star gap is **distribution (4/10)** — lapsed members who re-engage become both signal and distribution channel.

---

## Why This Matters

The ZAO has 157 ZOR holders as of July 2026. Governance streak is 100+ weeks. But participation concentration is high — a small number of members carry most of the session attendance. Lapsed member re-engagement could:
1. Restore governance headcount (more sessions with 10+ = stronger 63-week claim)
2. Generate artist re-submissions to WaveWarZ (volume growth)
3. Expand the COC audience (lapsed = warm warm-up before cold outreach)
4. Produce ZABAL S2 applicants (ZABAL alumni who went quiet may re-activate)

---

## Member Segmentation Definitions

### Active Member
Has at least ONE of the following in the past 90 days:
- Attended a ZAO Fractal session (on-chain Respect allocation)
- Submitted or voted in a WaveWarZ battle
- Contributed to ZABAL (submission, cohort participation, or voting)
- Posted in ZAO Telegram with substantive content (not just reactions)
- Sent a direct Farcaster cast mentioning /zao, /wavewarz, or @bettercallzaal

**ZOE can check:** On-chain Respect events (Optimism), WaveWarZ API, Farcaster channel activity.

### Warm Member
Was active in the last 6-12 months but NOT in the past 90 days:
- Has ZOR balance (on-chain indicator of prior commitment)
- May have attended Fractals before the 90-day window
- Has social connection to ZAO (follows @bettercallzaal, in Telegram)

**Re-engagement effort:** Low friction — one personal DM from Zaal or a Fractal invite.

### Lapsed Member
Has ZOR balance but NO qualifying activity in 12+ months. May have been active in 2024-early 2025 but drifted. Possible reasons: life, geographic move, Web3 fatigue, no compelling reason to return.

**Re-engagement effort:** Medium — requires a compelling hook (new event, new feature, personal ask).

### Churned
Had ZOR at some point but has since zero-balanced or transferred out. No longer in active channels. Recovery unlikely without a serendipitous reconnection.

**Action:** De-prioritize. Do not spam. Watch for organic re-entry signals.

---

## Current Member Estimates (July 2026)

| Segment | Estimate | Source |
|---------|----------|--------|
| Active (90-day) | 20-30 | Session attendance logs + WaveWarZ API |
| Warm (6-12 month) | 40-60 | ZOR holders minus 90-day actives |
| Lapsed (12+ month) | 70-100 | ZOR holders minus warm/active |
| Churned | Unknown | Requires ZOR transfer history query |

*ZOE: run monthly ZOR holder snapshot via Optimism Etherscan API; compare with session attendance logs.*

---

## Re-engagement Playbooks

### Playbook A — Warm Member Re-activation (ZOE-automatable)

**Trigger:** ZOR holder shows no activity for 90 days

**ZOE action:**
1. Post in ZAO Telegram (public): "Next Fractal is [DATE] — all ZOR holders are eligible to participate."
2. If the member has a Farcaster handle: cast a mention "@[handle] — you've been quiet, come back to Fractal this week."
3. If the member is in Telegram: send a direct message from Zaal's account (draft written by ZOE, sent by Zaal).

**Template (ZOE generates, Zaal sends):**
```
Hey [name] — haven't seen you at Fractal lately. We've been on a 100+ week streak and we've grown a lot since you were last in. If you have 90 minutes on [NEXT_FRACTAL_DATE], come check it out. [LINK]
```

**Expected outcome:** 20-30% reply rate for direct DMs from Zaal (personal > automated).

---

### Playbook B — Lapsed Member Re-activation (Zaal-own)

**Trigger:** Member lapsed 12+ months; ZOR still held

**Framing:** "You helped build this" — emphasize the milestone they were part of. Avoid "we miss you" (generic). Use specific receipts.

**Template:**
```
Hey [name] — I was looking at the ZAO governance record and found your name on session [#]. We've now hit 100+ consecutive weeks on-chain, and I wanted to reach out personally.

We're launching ZABAL Season 2 in September — [1-line description of S2]. WaveWarZ just crossed 1,245 battles. COC Concertz #7 was today.

No ask — just wanted you to know what became of the thing you were part of. If you want to rejoin or know someone who'd be interested, I'd love to reconnect.

— Zaal
```

**Best channel for lapsed:** Email (if available) > Telegram DM > Farcaster cast > X DM.

---

### Playbook C — Artist Re-activation (WaveWarZ-specific)

**Trigger:** Artist submitted ≥1 battle 12+ months ago, no recent submissions

**Why artists lapse:** No compelling hook to resubmit (they submitted once, heard nothing, moved on); or WaveWarZ didn't fit their release schedule.

**Template (ZOE generates, Zaal sends):**
```
Hey [artist name] — you submitted [TRACK] to WaveWarZ back in [MONTH]. We've crossed 1,245 battles since then. Things have grown.

COC Concertz #7 is tonight — our live concert series where WaveWarZ battles are featured live. We're building toward #8. If you have new music or want to get back in, submissions are open.

wavewarz.info/submit
```

**ZOE automation hook:** Pull WaveWarZ battle participants list → cross-reference against submission date → generate DM list for Zaal 14 days before each COC event.

---

### Playbook D — ZAOstock as Re-entry Hook

ZAOstock Oct 3 (ZAOville, Maine) is the single best re-activation event. In-person is the highest-fidelity re-engagement mechanism.

**Strategy:** For lapsed members in the northeastern US or with travel budget → personal invite from Zaal to ZAOstock. Frame as "you helped build this and I want you there for the milestone."

**Target list:** Pull ZOR holders with US Telegram area codes or US-based Farcaster profiles.

---

## ZOE Automation Roadmap

| Automation | Trigger | Status |
|-----------|---------|--------|
| Monthly ZOR holder snapshot | 1st of month | SPEC ONLY (not built) |
| 90-day activity flag | ZOR holder with no on-chain activity | SPEC ONLY |
| Pre-Fractal re-activation blast | 3 days before each Fractal | SPEC ONLY |
| Pre-COC artist outreach list | 14 days before each COC event | SPEC ONLY |
| ZAOstock invite list generation | Aug 1 trigger | SPEC ONLY |

*To activate these automations, Zaal needs to give ZOE access to: (1) Optimism Etherscan API for ZOR balance queries, (2) WaveWarZ participant history API endpoint, (3) Telegram bot permission to send DMs from Zaal's account.*

---

## KPIs to Track

| KPI | Current | Target (by ZAOstock) |
|-----|---------|---------------------|
| 90-day active members | ~20-30 | 40+ |
| Fractal session headcount | 8-12/session | 15+ |
| WaveWarZ submissions per month | Unknown | Baseline this month |
| Lapsed member reply rate | Unknown (first campaign) | 25%+ |
| Re-activated artists with new submission | 0 | 3+ |

---

## North Star Connection

| KPI | North Star |
|-----|-----------|
| 40+ active members | Governance score +0.1 (headcount diversification) |
| 3 lapsed artists re-submitting | WaveWarZ volume growth (battle count +30-50) |
| 5 lapsed members at ZAOstock | Distribution +0.1 (in-person network effect) |
| ZOE automating monthly ZOR snapshot | ZOE/tech layer +0.1 |

**Primary North Star relevance:** Distribution (4/10 is the main gap). A warm member who re-activates becomes an organic distributor. Every WaveWarZ battle they share is a distribution touch.

---

*Created: 2026-07-18 | Owner: ZOE (automated tracking) / Zaal (outreach) | Next action: ZOE runs first ZOR holder vs. 90-day activity comparison; Zaal reviews resulting lapsed list by Aug 1 | Related: 1265 (distribution channels), 1312 (August strategy), 1392 (ZABAL S2), 1228 (ZAOstock runbook)*
