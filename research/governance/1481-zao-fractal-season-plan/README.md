---
topic: governance
type: plan
status: active
last-validated: 2026-07-18
related-docs: 1227 (eden learnings), 1232 (growing-fractals playbook), 1254 (100-week record)
original-query: "Growth playbook implementation: run 6-month seasons per Eden Fractal learnings"
tier: STANDARD
---

# 1481 — ZAO Fractal Season Plan

> **Purpose:** Implement the "run seasons" recommendation from doc 1227 (Eden Fractal learnings). ZAO has run 100+ consecutive weekly Respect Games without using formal season naming. This doc retroactively names ZAO's first 8 seasons, defines the current season, and establishes the forward naming convention.

---

## Why Seasons Matter

From doc 1227: Eden Fractal names its seasons ("Season 12: Global Expansion"). Named seasons create three things:
1. **Narrative momentum** — "We're in Season 9: WaveWarZ Africa" gives the community something to rally around and communicate externally.
2. **Onboarding windows** — New members know "Season 9 starts now" and have a natural entry point. Without seasons, the Fractal appears to have been running forever with no accessible on-ramp.
3. **Tooling upgrade gates** — Changing infrastructure BETWEEN seasons (not during) means members never feel their workflow gets disrupted mid-rhythm.

The ZAO has 100+ sessions without a single missed week. Seasons give that streak a legible shape.

---

## How ZAO Seasons Work

**One season = 12 weekly Fractal sessions (~3 months).** This matches the Eden Fractal convention.

**Season boundaries are ceremonies, not disruptions:**
- End of season: brief recap at the Monday session ("We did 12 weeks. Here's what happened. Here's the next theme.").
- Start of next season: the host announces the new season name + theme at Session 1.
- No mandatory changes to the game mechanic or tooling. Seasons are labels, not hard resets.
- Optional upgrades (new tooling, on-chain migration) happen AT season boundaries, never mid-season.

**Season names follow the pattern:** Season N: [Theme Title]. Theme = what the community was building or focused on during those 12 weeks. Named retroactively when possible; prospectively starting with Season 9.

---

## Historical Seasons (Retroactive)

ZAO Fractals started **August 4, 2024** (Fractal 1). As of July 2026, ZAO has completed 100+ sessions.

| Season | Sessions | Era | Approximate Dates | Retroactive Theme | Key Event |
|--------|----------|-----|-------------------|-------------------|-----------|
| Season 1 | 1–12 | OG (1x) | Aug 2024 – Nov 2024 | **Founding** | First 12 weeks. Established the game. The core group proved the format works. |
| Season 2 | 13–24 | OG (1x) | Nov 2024 – Feb 2025 | **Building Roots** | Consistent attendance. Members started defining their contributions. |
| Season 3 | 25–36 | OG (1x) | Feb 2025 – May 2025 | **Proving Ground** | First on-chain experiments. WaveWarZ incubation. ZAO OS active build. |
| Season 4 | 37–48 | OG (1x) | May 2025 – Aug 2025 | **Threshold** | Completing the OG era. 73 total OG sessions. Community built IRL event track (ZAO-PALOOZA, ZAOCHELLA). |
| Season 5 | 49–60 | OG→ZOR | Aug 2025 – Nov 2025 | **Transition** | The shift from OG ERC-20 to ZOR ERC-1155 (Fractal 74). First ORDAO-era sessions. New scoring era begins. |
| Season 6 | 61–72 | ZOR (2x) | Nov 2025 – Feb 2026 | **On-Chain Era** | Full ZOR settlement rhythm. 63 verified on-chain distributions. OREC proposals active. |
| Season 7 | 73–84 | ZOR (2x) | Feb 2026 – May 2026 | **Scaling** | ZAOstock 2026 planning. Agent stack (ZOE) active. Research library crossed 1,200 docs. |
| Season 8 | 85–96 | ZOR (2x) | May 2026 – Aug 2026 | **100 Weeks** | ZAO hits the 100-week milestone (doc 1254). The only music-focused fractal to reach this mark. |

---

## Current Season: Season 9

**Season 9: WaveWarZ Africa**
Sessions 97–108 · August 2026 – November 2026

**Theme:** WaveWarzAfrica launches as the first Fractal expansion outside North America. Season 9 is the season where ZAO proves the model is culture-portable.

**Season 9 milestones to aim for:**
- [ ] WaveWarzAfrica Fractal node Phase 0 complete (6 recurring participants confirmed)
- [ ] Season 9 name announced at Session 97 (first session of the new season)
- [ ] Eden Fractal / Optimystics partnership call completed (Creator Talk episode scoped)
- [ ] Zaal founder welcome video recorded (unlocks WaveWarzAfrica Phase 3 outreach)
- [ ] 3 anchor artists (Sampha The Great, Dagger, Krytic, Nemesis) outreached

> **Note (Zaal-gated):** The first two milestones require Zaal's action (video + artist outreach authorization). See doc 1474 for the full WaveWarzAfrica plan.

---

## Season 10 Preview (Planned)

**Season 10: Contribution Requests**
Sessions 109–120 · November 2026 – February 2027

**Theme:** Launch Contribution Requests (CR) as a formal mechanism. Members propose specific contributions at the start of each session; the community votes on which to prioritize funding or resources. Eden Fractal is testing this now; ZAO should adopt in Season 10.

From doc 1232: "Contribution Requests" is the most impactful governance upgrade after the basic Respect Game — it turns peer recognition into proactive coordination.

---

## The Season Boundary Ceremony

Simple. Run at the LAST session of a season (Session 12 of that season):

1. **Recap** (~3 min): Host reads the season number, theme, sessions run, and top 3 contributors by Respect earned this season.
2. **Milestone call** (~2 min): Did we hit the season's milestone? What shipped? What didn't?
3. **Next season reveal** (~1 min): Host announces Season N+1 name + theme. No vote required — host + Zaal alignment is enough.

That's it. No ceremony, no ceremony. 6 minutes at the end of a session.

---

## Integration with ZAO OS

No code changes needed to implement seasons. The current `/fractals` dashboard already surfaces:
- Session count and numbering
- Era filter (1x / 2x) which maps to pre/post Season 5

**Optional future enhancement:** add a "Season" badge to the sessions list in the SessionsTab. The badge would be computed: `Math.ceil(sessionNumber / 12)` = season number. This is purely cosmetic and deferred — the most important thing is adopting the naming convention.

---

## Sources

- Doc 1227 — Eden Fractal learnings (seasons recommendation, "Season themes create momentum")
- Doc 1232 — Growing Fractals playbook (Season 1-5 phases in the ZAO history table, Contribution Requests)
- Doc 1254 — ZAO Fractal 100-week record (milestone context for Season 8 theme)
- Doc 1474 — WaveWarzAfrica Fractal onboarding plan (Season 9 milestones)
