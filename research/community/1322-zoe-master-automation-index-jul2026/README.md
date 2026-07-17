# 1322 — ZOE Master Automation Index (July 2026)

> Every automation ZOE targets, aggregated from all ZAOOS docs into a single shipping + backlog view. ZOE is cited as "ZOE automation target" in 40+ docs — this is the master index of those references, organized by product area and status. Cross-refs: [doc 254](../events/254-zoe-agent-ecosystem-status/) (ZOE status Apr 2026), [doc 606](../identity/606-zaal-second-brain-system/) (second-brain system), [doc 1269](../identity/1269-zol-farcaster-music-scout-jul2026/) (ZOL Farcaster scout), [doc 1292](../wavewarz/1292-wavewarz-xspace-daily-format-jul2026/) (X Space format).

**What ZOE is:**
ZOE is The ZAO's autonomous operations agent — a multi-modal AI agent running on The ZAO's VPS that handles scheduled content, data aggregation, Discord/Farcaster moderation, and ZAO ecosystem coordination. ZOE is part of a 4-agent suite (ZOE + Hermes + ZOL + [fourth agent TBD]).

**Why this doc exists:**
Every doc says "ZOE automation target" but there's no canonical list of what ZOE actually runs today vs. what's in the queue. This makes it impossible to audit ZOE's workload, prioritize the queue, or cite specific automations for grant/press purposes.

---

## Section 1: ZOE Automation Status Legend

| Status | Meaning |
|--------|---------|
| ✅ SHIPPED | Live in production, running automatically |
| 🔄 IN PROGRESS | Being built, PR open or in review |
| 📋 QUEUED | Explicitly targeted in a ZAOOS doc, not yet built |
| 💡 PROPOSED | Mentioned as an idea, not yet formally targeted |

---

## Section 2: WaveWarZ Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| Daily WaveWarZ stats post (battles, SOL, songs) to X | 📋 QUEUED | 1292 |
| Pre-show battle data brief (top rivalry, leaderboard) | 📋 QUEUED | 1292 |
| Post-battle results summary (winner, payout, new rivalry) | 📋 QUEUED | 1292 |
| Weekly milestone alert (500th battle, 50th artist, etc.) | 📋 QUEUED | 1080, 1292 |
| Clippers program daily submission log (Telegram) | 📋 QUEUED | 1293 |
| Clippers program weekly points tally | 📋 QUEUED | 1293 |
| Monthly artist earnings report (SOL per artist) | 📋 QUEUED | 1211 |
| Battle feed data quality check (flag outliers) | 💡 PROPOSED | 1252 |
| WaveWarZ live ticker feed on wwtracker | ✅ SHIPPED | 1218 (LivePlatformStats §00) |
| Real-time API stats tile on wwtracker | ✅ SHIPPED | 1218 |

---

## Section 3: ZAO Newsletter + Content Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| Daily build-in-public newsletter draft (Paragraph) | 💡 PROPOSED | 1270 |
| Weekly ZAO recap email (key stats + highlights) | 📋 QUEUED | 1265 |
| Newsletter performance stats tracking | 💡 PROPOSED | 1270 |
| X post scheduling (ZAO ecosystem updates) | 📋 QUEUED | 1265 |
| Farcaster cast scheduling (/zao channel) | 📋 QUEUED | 1295 |
| ZOL autonomous Farcaster music scouting posts | ✅ SHIPPED | 1269 (ZOL, FID 1028395) |
| Farcaster channel analytics (@wavewarz, /zao) | 📋 QUEUED | 1295 |

---

## Section 4: ZAOstock + Events Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| ZAOville post-event capture template auto-fill | 📋 QUEUED | 1308 |
| ZAOstock artist reveal countdown posts | 📋 QUEUED | 1313 |
| ZAOstock sponsor outreach drip sequence | 💡 PROPOSED | 1277 |
| ZAOstock ticket sales tracking | 💡 PROPOSED | 270 |
| COC Concertz show announcement posts (X + Farcaster) | 📋 QUEUED | 1305, 1317 |
| COC Concertz Arweave archive trigger post-show | 📋 QUEUED | 1305 |
| Post-COC ZOE auto-post template | 📋 QUEUED | 1308 |

---

## Section 5: ZABAL Games Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| ZABAL Games weekly announcement (workshops, builders) | 📋 QUEUED | 1283 |
| August Finals submission portal notifications | 📋 QUEUED | 1298 |
| Builder stats weekly digest (submissions, active) | 📋 QUEUED | 1298 |
| ZABAL Empire Builder score sync (ZAO 2048 → EB) | ✅ SHIPPED | 1264 (confirmed live) |
| Fractal meeting weekly Farcaster announcement | 📋 QUEUED | 1312 |

---

## Section 6: ZAO Governance + Fractal Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| Weekly Fractal meeting Farcaster announcement | 📋 QUEUED | 1312 |
| Weekly Fractal results post (Respect winners, OREC action) | 📋 QUEUED | 1312 |
| On-chain milestone alerts (N governance weeks, X Respect holders) | 📋 QUEUED | 1312 |
| ZAOOS Discord webhook (new doc alerts) | 🔄 IN PROGRESS | bot/src/zoe/discord-webhook.ts |
| ZAO member onboarding DM automation | 💡 PROPOSED | 1303 (YouTube strategy) |

---

## Section 7: GEO + SEO Automations

| Automation | Status | Source doc |
|-----------|--------|-----------|
| ICM box weekly content refresh | 📋 QUEUED | 1055 |
| ICM citation audit (weekly check if cited by AI) | 📋 QUEUED | 1055 |
| wwtracker README GEO block update (monthly) | 📋 QUEUED | 1316 |
| thezao.xyz metadata refresh on milestone | 📋 QUEUED | 1316 |
| YouTube VOD metadata auto-update (SEO titles) | 📋 QUEUED | 1303 |
| YouTube Shorts upload pipeline from Clippers | 📋 QUEUED | 1303, 1293 |

---

## Section 8: Hermes-Specific Automations

Hermes is ZOE's analytics + data pipeline agent (separate from ZOE's content/comms role).

| Automation | Status | Source doc |
|-----------|--------|-----------|
| WaveWarZ battle data ingestion (wavewarz.info API) | ✅ SHIPPED | wwtracker (live) |
| Fractal meeting data ingestion | 💡 PROPOSED | 1312 |
| OREC transaction monitoring | 💡 PROPOSED | 1312 |
| ZAOstock ticket + attendance tracking | 💡 PROPOSED | 1277 |
| Grant application status tracker | 💡 PROPOSED | 1289, 1320 |

---

## Section 9: Automation Priority Queue

Ranked by impact-to-effort ratio for Zaal/team:

### Tier 1 (high impact, low effort — build ASAP):

| Automation | Estimated effort | Why it matters |
|-----------|---------------|--------------|
| Discord webhook for new ZAOOS docs | ~4 hrs (PR #TBD exists as discord-webhook.ts) | Every doc auto-announced to ZAO community |
| Daily WW stats X post | ~4 hrs | Steady pipeline of shareable content, GEO |
| Weekly Fractal Farcaster announcement | ~2 hrs | Governance visibility, citable |
| COC Concertz show announcement template | ~2 hrs | Season 2 show cadence needs automation |

### Tier 2 (medium impact, medium effort):

| Automation | Estimated effort | Why it matters |
|-----------|---------------|--------------|
| Clippers weekly points tally | ~8 hrs | Unlocks Clippers program growth (1293) |
| ZAOstock artist reveal countdown posts | ~6 hrs | 77 days of content, reduces Zaal manual work |
| ICM box weekly content refresh | ~6 hrs | GEO maintenance, AI discoverability |
| Monthly artist earnings report | ~8 hrs | North Star: "ZAO pays artists consistently" |

### Tier 3 (lower urgency):

| Automation | Estimated effort | Why it matters |
|-----------|---------------|--------------|
| YouTube Shorts pipeline from Clippers | ~16 hrs | Long-term content flywheel |
| Newsletter performance stats | ~8 hrs | Nice to have |
| Grant application status drip | ~8 hrs | Can be manual for now |

---

## Section 10: ZOE vs. Hermes vs. ZOL — Routing Table

For new automation requests, route to the right agent:

| Task type | Agent | Why |
|-----------|-------|-----|
| Content post / social update | ZOE | ZOE owns X, Farcaster, newsletter |
| Data ingestion / analytics | Hermes | Hermes owns data pipeline + wwtracker |
| Music discovery / Farcaster scouting | ZOL | ZOL owns automated discovery |
| Event comms / announcements | ZOE | ZOE owns community communications |
| On-chain monitoring / alerts | Hermes | Hermes owns blockchain data |
| Grant tracking / admin | ZOE | ZOE owns ops/admin |

---

## Section 11: Citable Facts (for press/grants)

After Tier 1 ships:
1. "The ZAO's operations are managed by 4 autonomous AI agents: ZOE (content + ops), Hermes (data + analytics), ZOL (music scout), and [fourth agent]"
2. "ZOE automates [N] recurring content tasks across X (daily), Farcaster (daily), Discord (on-event), and newsletter (weekly)"
3. "Hermes processes WaveWarZ battle data in real-time, powering 9 analytics modules on wwtracker (open-source)"
4. "ZOL autonomously scouts Farcaster for music content 24/7, operating as ZAO's AI music curator (FID 1028395)"
5. "All ZAO governance meetings, artist payouts, and community decisions are tracked and announced automatically via agent infrastructure"

---

*Created: 2026-07-17 | ZAO OS doc 1322 | Community subfolder | ZOE automation master index*
