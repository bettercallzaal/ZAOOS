---
topic: community, governance
type: status-pass
status: DONE — snapshot taken 2026-07-18; intended audience: Zaal + Iman
last-validated: 2026-07-18
related-docs: 1527-zoe-work-loop-dreamloop, 1531-zabal-marketplace, 1534-devz-bounty-campaign, 1522-member-services-directory
board-tasks: 2806d899 (Iman: skim active repos), 1ffbc84e (Iman: project status pass), 34c67cbb (Iman: open PRs review), c251afa5 (Iman: board review)
action-owner: Zaal reviews + decides; Iman executes on flagged items
---

# 1537 — ZAO Status Pass: Repos, PRs, Projects, Board (Jul 18, 2026)

> Four Iman inbox tasks combined into one doc: active repo audit, open PR triage, project status (Sparkz/Zoostr, ZAOstock, Fractal, COC), and board review. Audience: Zaal + Iman.

---

## Part 1: Active Repo Audit

Repos with commits in the last 48 hours (as of 2026-07-18):

| Repo | Status | Open PRs | Notes |
|------|--------|----------|-------|
| `bettercallzaal/ZAOOS` | Very active | 30+ open | Mix: 7 fractal code fixes (today), 8+ doc PRs (today), 9 older PRs (Jul 18 but older than today's wave) |
| `bettercallzaal/sparkz` | Very active | 10 DRAFT PRs | Ongoing: copy fixes + SHIP.md updates. No blockers visible. |
| `bettercallzaal/zaalcaster` | Active | 2 open | PR #121 (WaveWarZ analytics card), PR #122 (llms.txt). Both non-blocking features. |
| `bettercallzaal/zol` | Active | 5 open (4 DRAFT) | PR #61 is the key one (DreamLoops activation — needs Pi dry-run). Drafts: hardening pass, capability-gap cycles. |
| `bettercallzaal/wwtracker` | Unknown — no recent PR activity | 0 visible | Helius integration spec written (doc 1520); implementation not started (needs Helius API key). |
| `bettercallzaal/zpoidh` | Stable | R7 drafted, not cast | R7 (bug fixes bounty) ready to cast Jul 25. R4 (open pot) closes Jul 31. |
| `bettercallzaal/zoostr` | Private, unknown | — | Zoostr = Sparkz's first Creator Capsule. No public PRs visible. |
| `bettercallzaal/zao-festivals` | Unknown | — | ZAOstock team dashboard (Expo/React Native). No recent public PR activity. |

**Half-done / needs attention:**
- `ZAOOS` PR #2074 (agent control plane v0) — open since earlier Jul 18. Large feature PR. Needs Zaal code review before merge.
- `ZAOOS` PR #2046 (consolidate 27 docs with collision resolution) — open since Jul 18. Large docs consolidation. Needs conflict check.
- `ZOL` PR #61 (DreamLoops activation) — open since Jul 18. Needs Pi dry-runs before merge. Critical path for ZOL autonomy.
- `wwtracker` — codebase exists but Helius key not provisioned. Doc 1520 has the exact steps (5 min signup).

---

## Part 2: Open ZAOOS PR Triage

**30+ open PRs as of 2026-07-18.** Grouped by action:

### Ready to Merge (doc PRs, no conflicts expected)

| PR | Title | Action |
|----|-------|--------|
| #2223 | Hurricane Aug 1 dev handoff (doc 1526) | Merge |
| #2221 | New Fractal Node Launch Checklist (doc 1523) | Merge |
| #2229 | Fractal season plan (doc 1481) | Merge |
| #2228 | Fractal campaign narrative (doc 1502) | Merge |
| #2198 | ZAOstock Eventbrite launch pack (doc 1508) | **URGENT: merge by Jul 21** |
| #2175 | ZAOstock permit call cheat sheet (doc ~1495) | **URGENT: merge by Jul 20** |
| #2194 | Fractal invisible participation playbook (doc 1505) | Merge |
| #2164 | Govbase PR submission guide (doc 1482) | Merge |
| #2155 | WaveWarZ community battle guide (doc 1476) | Merge |
| #2152 | WaveWarZ Africa Fractal onboarding (doc 1474) | Merge |
| #2172 | ZAOstock artist booking brief (doc 1494) | **Merge by Aug 1** |
| #2139 | Water & Music pitch brief (doc 1465) | Merge |
| #2129 | ZABAL S2 application form (doc 1457) | Merge |
| #2120 | COC #8 artist recruitment brief (doc 1451) | Merge |
| #2118 | ZAOstock press release template (doc 1449) | Merge |
| #2196 | CC-BY 4.0 LICENSE deployment guide | Merge — 5 min to execute after merge |
| #2058 | ZAOOS root README GEO update (doc 1401) | Merge |

### Needs Code Review (Zaal or Hurricane)

| PR | Title | What's needed |
|----|-------|--------------|
| #2208 | fix(fractals): guard fetch + empty Respect card | Code review — fractal dashboard |
| #2199 | fix(fractals): webhook scoring_era fix | Code review — webhook |
| #2192 | fix(fractals): analytics chart era coloring | Code review — UI logic |
| #2179 | fix(fractals): live tab 60s/10s polling | Code review — polling logic |
| #2171 | fix(fractals): member history source field | Code review |
| #2165 | fix(fractals): analytics OG/ORDAO session counts | Code review |
| #2159 | fix(fractals): leaderboard on-chain + ZOR column | Code review |
| #2154 | fix(fractals): era filter uses scoring_era field | Code review |
| #2074 | feat: agent control plane v0 | **Large feature — Zaal code review required** |
| #2148 | feat(fractal): belonging-first About tab | Feature review |

### Watch / May Need Close (older PRs that may have been superseded)

| PR | Title | Note |
|----|-------|------|
| #2046 | docs: consolidate 27 research docs | Large consolidation PR from earlier — verify no conflicts with 1534+ docs |
| #2054 | test(curator): fix test isolation | ZOL test fix — may be superseded by ZOL v2 branch |

### Summary counts

- Ready to merge: **17 doc PRs** (many time-sensitive)
- Needs code review: **10 code PRs** (all fractals fixes + 1 large feature)
- Watch/verify: **2 PRs**

---

## Part 3: Project Status Pass

### Sparkz / Zoostr

| Item | Status |
|------|--------|
| Sparkz repo | Active build in `bettercallzaal/sparkz`. 79 PRs (all recent, mostly DRAFT). Many small copy fixes to Collectables, spark-examples, advisor copy. |
| Current phase | SHIP TRACK on Zoostr Creator Capsule. 0xSplits-first rail merged (PR #120). BYOK advisor relay in DRAFT (PR #70). |
| Blockers | BYOK key wiring (PR #70 DRAFT). Sparkz "integrate PR #1036" task in board — PR number doesn't exist in any known repo; likely a stale task entry. |
| What's needed | Zaal: clarify what "PR #1036" refers to. Hurricane: merge BYOK relay from DRAFT when ready. |
| Zoostr | Private repo. Status unknown from external view. |

### ZAOstock

| Item | Status |
|------|--------|
| Date / venue | Oct 3, 2026, Ellsworth ME (venue TBD) |
| Tickets | GA $20 Eventbrite (launch pack PR #2198 — merge by Jul 21) |
| Artist booking | Brief in PR #2172 (doc 1494) — lock roster by Aug 1 |
| Press release | Template in PR #2118 (doc 1449) — Sep 1 lineup reveal |
| Permit call | Cheat sheet PR #2175 — call with Suzanne McLean Jul 20 |
| Colleen follow-up | Board task `f105182b` — GATED (Zaal DM/email) |
| ZAOstock day-of protocol | Doc 1524 (merged) — ZOE/Hurricane/Zaal role matrix |
| Blockers | Venue not confirmed. Artist roster not locked. Eventbrite not live yet (merge PR #2198). |

### Fractal (Weekly Respect Game)

| Item | Status |
|------|--------|
| Sessions | 104+ unbroken weeks as of Jul 2026 |
| Dashboard | Active fixes: 7 code PRs today fixing era field, analytics, polling, leaderboard |
| Docs | Season plan (PR #2229), campaign narrative (PR #2228), new node checklist (PR #2221), invisible participation guide (PR #2194) — all ready to merge |
| Blockers | Code PRs (#2154–#2208) need review before merge. Fractal dashboard likely has UX issues until these land. |
| New fractal nodes | PR #2221 = launch checklist. Board has "Fractal Africa" onboarding plan (PR #2152). |

### COC Concertz

| Item | Status |
|------|--------|
| COC #7 | Post-show debrief in doc 1523 (merged). First live-audience WaveWarZ battle. |
| COC #8 | Date TBD (decision pending Jul 21 per doc 1523). Artist recruitment brief in PR #2120 (doc 1451). |
| YouTube upload | Board task `3d3d91f8` — "Upload COC Concertz 5 and 6" — GATED (Zaal uploads). |
| JubJub integration | Board task `93dc92ff` — Tom McCarthy call needs reschedule or close. GATED (Zaal decides). |
| Blockers | COC #8 date not locked. Upload of episodes 5/6 blocked on Zaal. |

---

## Part 4: Board Review — Blocked/Stale Tasks

**Top priorities (time-sensitive, non-gated):**

| Priority | Task | Deadline | Why now |
|----------|------|----------|---------|
| 🔴 NOW | ZAOstock permit call (Suzanne McLean) | Jul 20 | PR #2175 has cheat sheet |
| 🔴 NOW | ZAOstock Eventbrite launch | Jul 21 | Merge PR #2198, then go live |
| 🔴 NOW | Merge 17 ready-to-merge ZAOOS doc PRs | ASAP | Several time-sensitive |
| 🟠 Jul 25 | Cast POIDH R7 (bug fixes bounty) | Jul 25 | Doc 1534 has cast template |
| 🟠 Jul 25 | Africa Battle Week nominations open | Jul 20 | Doc 1498 (nominations) |
| 🟠 Jul 25 | WaveWarZ mini-app + send to Arthur | Jul 25 | Doc 1518 spec ready |
| 🟡 Aug 1 | ZAOstock artist booking locked | Aug 1 | PR #2172 is ready |
| 🟡 Aug 1 | Hurricane Aug 1 dev handoff | Aug 1 | PR #2223 ready to merge |
| 🟡 ASAP | ZOL PR #61 — Pi dry-run | ASAP | Activates DreamLoops |
| 🟡 ASAP | Helius API key signup (5 min) | ASAP | Unblocks doc 1520 implementation |
| 🟡 ASAP | Fix tg.env ZAAL_BOTZ_GROUP_ID | ASAP | Re-enables DM polling |

**Stale/blocked tasks (Zaal decision needed):**

| Task | Why stale | Decision needed |
|------|-----------|----------------|
| Sparkz integrate PR #1036 | PR doesn't exist in any known repo | Clarify which repo + PR number |
| Consulting Farcaster auction | PAST DUE Jul 20, scope unknown | What's the consulting ask? |
| Upload COC Concertz 5 + 6 | YouTube upload — Zaal action | Schedule time to upload |
| Send Micky media kit | Outreach — Zaal action | Do it or close |
| Outreach: follow up with Colleen (ZAOstock) | Zaal must DM/email | Do it before Jul 28 |
| Fractal Airtable refresh | $24/mo spend | Approve or cancel subscription |
| JubJub / Tom McCarthy call | Warm lead going cold | Reschedule by Jul 25 or mark lost |
| Record fractal video | Zaal records | Schedule time |

**Iman-specific tasks (confirm with Iman):**
- Review open ZAOOS PRs: now done in this doc
- Project status pass: now done in this doc
- Create MP4 from month-2 ZABAL Games video
- Create month-3 (August) ZABAL Games video
- Set Zaal+Iman Discord co-working time

---

## Suggested Immediate Order for Zaal (next 48 hours)

1. **Merge the 17 ready-to-merge doc PRs** — they auto-merge after CI, but need a merge click
2. **ZAOstock permit call (Jul 20)** — use PR #2175 cheat sheet
3. **ZAOstock Eventbrite launch (Jul 21)** — merge PR #2198, then execute
4. **Review + decide on fractal code PRs** — 7 are waiting (they might be from an earlier agent session today)
5. **ZOL PR #61** — run Pi dry-runs, merge when green
6. **Helius API key** — 5 minutes at helius.dev
7. **Africa Battle Week nominations** — open today (Jul 20) per doc 1498

---

## Sources

- `bettercallzaal/ZAOOS` PR list (30 open PRs, Jul 18, 2026)
- `bettercallzaal/sparkz` PR list (10 DRAFT, Jul 18, 2026)
- `bettercallzaal/zaalcaster` PR list (2 open)
- `bettercallzaal/zol` PR list (5, mostly DRAFT)
- `bettercallzaal/zpoidh` README (R4 active, R7 drafted)
- Cowork board: 4 Iman inbox tasks (`2806d899`, `1ffbc84e`, `34c67cbb`, `c251afa5`)
- Related ZAOOS docs: 1518, 1520, 1522, 1523, 1524, 1526, 1527, 1528, 1531, 1534
