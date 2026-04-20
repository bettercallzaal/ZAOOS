# Active + Recently Resolved Conflicts

> Append-only log. Synthesis Routine (per [doc 462](../../research/agents/462-hyperspell-company-brain-context-graph/)) writes here when it detects a fact disagreement across sources.

## Format

```
### YYYY-MM-DD — <entity> — <claim>
- Source A (Tier N): says X — link
- Source B (Tier M): says Y — link
- WINNER: X (Tier N beats Tier M per source_authority.md)
- WRITTEN TO: <BRAIN file path>
- NOTES: <any nuance>
```

---

## 2026-04-20 — ZAO Stock — Steve Peer's role

- **Source A (Tier 3, 2026-03-31):** [doc 274 ZAO Stock team profiles](../../research/events/274-zao-stock-team-deep-profiles/README.md) implies Steve Peer involved in music programming.
- **Source B (Tier 3, 2026-04-10):** auto-memory `project_zao_stock_team.md` explicit correction: "Steve Peer is NOT music curation — he's local connections + event management support."
- **WINNER:** Source B. Same tier; Source B is later (2026-04-10 > 2026-03-31). Auto-memory was written specifically to correct prior assumptions.
- **WRITTEN TO:** `BRAIN/projects/zao-stock-2026-10-03.md` Team section
- **NOTES:** Doc 274 should get a "superseded for Steve Peer's role by `project_zao_stock_team.md` 2026-04-10" annotation.

## 2026-04-20 — ZAO Stock — DFresh identity

- **Source A (early assumption):** "DFresh = Cole" appeared in earlier planning notes.
- **Source B (Tier 3, 2026-04-10):** auto-memory `project_zao_stock_team.md` explicit: "DFresh = Doug (NOT Cole, Cole is not involved). DFresh is the financial advisor with Alliance Events background."
- **WINNER:** Source B. Explicit correction with reasoning.
- **WRITTEN TO:** `BRAIN/projects/zao-stock-2026-10-03.md` Team section + `BRAIN/people/` once Doug entity is created.

## 2026-04-20 — ZAO Stock — Steve Peer onboarded?

- **Source A (Tier 3, 2026-03-31):** `project_zao_stock_confirmed.md`: "Steve Peer: NOT yet onboard — still needs to be pitched."
- **Source B (Tier 2, 2026-04-20, Zaal-confirmed in session):** "Partially pitched."
- **WINNER:** Source B. Newer + Zaal-direct confirmation.
- **RESOLVED 2026-04-20.** Updated `BRAIN/projects/zao-stock-2026-10-03.md` Team section: Steve Peer status = "PARTIALLY PITCHED — conversation started, not closed."
- **NEXT:** Zaal to close the pitch loop; bump to "ONBOARDED" or "DECLINED" when known.

## 2026-04-20 — ZAO Stock — Wallace Events tents booked?

- **Source A (Tier 3, 2026-03-31):** `project_zao_stock_confirmed.md`: "Wallace Events tent rental (not yet onboarded)."
- **Source B (Tier 2, 2026-04-20, Zaal-confirmed in session):** "Not talked to at all."
- **WINNER:** Source B. Newer + more specific — confirms NO contact has happened (vs A which was just "not onboarded").
- **RESOLVED 2026-04-20.** Updated `BRAIN/projects/zao-stock-2026-10-03.md` Status table: Wallace Events = "NOT CONTACTED YET — bad-weather backup plan unexecuted."
- **NEXT:** Outreach TBD. April-May window is the sponsor-outreach critical period (per Apr 10 meeting); Wallace contact should slot into that.
