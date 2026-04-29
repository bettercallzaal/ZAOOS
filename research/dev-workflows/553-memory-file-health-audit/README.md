---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-04-29
related-docs: 551, 552, 554
tier: STANDARD
---

# 553 - Memory File Health Audit

> **Goal:** 115 memory files on disk, MEMORY.md only indexes 94. **20 orphan memories Claude can't see at session start.** Plus duplicates, stale entries, conflicts. Plan re-index + dedupe + retire.

## Inventory (verified 2026-04-29)

| Metric | Value |
|---|---|
| Memory files on disk | 115 |
| Entries in `MEMORY.md` index | 94 |
| **Orphan memories (on disk, not in index)** | **20** |
| Broken pointers (in index, not on disk) | 0 |
| `MEMORY.md` line count | 101 of 200-line truncation cap (50.5% used) |
| Memory files older than 30 days | 20+ |

## Orphan Memories (Lost To Session-Start Context)

These exist on disk but `MEMORY.md` doesn't list them, so they don't load at session start:

| File | Type | Likely Status |
|---|---|---|
| `feedback_check_pr_state_always.md` | feedback | **Important - re-add** |
| `feedback_fishbowlz_push_standalone.md` | feedback | Dupe of `feedback_fishbowlz_standalone_only.md` - merge |
| `feedback_fishbowlz_standalone_only.md` | feedback | Possibly superseded by `project_fishbowlz_deprecated` (Juke pivot 2026-04-16) |
| `feedback_never_push_main.md` | feedback | **Important rule - re-add** |
| `feedback_no_mnemonic.md` | feedback | Security rule - re-add |
| `feedback_no_unsolicited_features.md` | feedback | Anti-bloat rule - re-add |
| `feedback_sync_reminder.md` | feedback | Workflow - check relevance |
| `feedback_test_live_not_localhost.md` | feedback | QA rule - re-add |
| `project_bootcamp_transcripts.md` | project | Old context - check relevance |
| `project_domain.md` | project | Old infra context - check vs `project_infra_keys.md` |
| `project_music_overhaul.md` | project | Old, possibly superseded by `project_music_research`, `project_zao_music_entity` |
| `project_next_session.md` | project | Probably one-shot, can retire |
| `project_nmc_fractured_atlas.md` | project | NMC + Fractured Atlas (fiscal sponsor) context - **important if ZAOstock pursues 501c3 fiscal sponsorship** |
| `project_onboarding_flow.md` | project | Old, check vs `project_auth_flow.md` |
| `project_respect_airtable.md` | project | Old, check vs `project_fractal_process` |
| `project_respect_system.md` | project | Same |
| `project_zao_festivals_history.md` | project | **Important if writing ZAOstock pitch / one-pager** |
| `project_zao_stock_details_april.md` | project | Old, check vs current ZAOstock memories |
| `project_zao_stock_production_audit.md` | project | **Important if planning ZAOstock production** |
| `project_zao_stock_team.md` | project | **Important - team roster lost from session-start context** |

## Duplicates Detected

### FISHBOWLZ Set

5 fishbowlz-related memories found:

| File | Status per content |
|---|---|
| `project_fishbowlz_deprecated.md` | **CANONICAL** (per memory check 2026-04-29) - Juke pivot |
| `project_fishbowlz_status.md` | Marked HISTORICAL in MEMORY.md index |
| `project_fishbowlz_agents_design.md` | Marked HISTORICAL in MEMORY.md index |
| `feedback_fishbowlz_push_standalone.md` | **Orphan, possibly redundant** |
| `feedback_fishbowlz_standalone_only.md` | **Orphan, possibly redundant** |

**Fix plan:** Read both `feedback_fishbowlz_*` memories, merge if same intent, retire if both superseded by Juke pivot.

### ZOE v2 Set

| File | Status |
|---|---|
| `project_zoe_v2_redesign.md` | Indexed |
| `project_zoe_v2_pivot_agent_zero.md` | **Orphan** (was in earlier audit; now indexed - verify) |
| `project_zoe_dashboard.md` | Indexed |

### Respect / Fractal Set

3 memories overlap (`project_respect_airtable`, `project_respect_system`, `project_fractal_process`, `project_fractal_vision`). Two orphans, two indexed. Likely 1-2 are stale, 1-2 still load-bearing.

### ZAO Stock Set

| File | Status |
|---|---|
| `project_zao_stock_confirmed.md` | Indexed (canonical) |
| `project_zao_stock_meeting_apr10.md` | Indexed |
| `project_zao_stock_pitch_answers.md` | Indexed |
| `project_zaostock_open_call.md` | Indexed |
| `project_zaostock_team_meeting.md` | Indexed |
| `project_zaostock_spinout.md` | Indexed |
| `project_zaostock_master_strategy.md` | Indexed |
| `project_zaostock_bot_live.md` | Indexed |
| `project_zao_stock_details_april.md` | **Orphan** |
| `project_zao_stock_production_audit.md` | **Orphan** |
| `project_zao_stock_team.md` | **Orphan** |

8 indexed + 3 orphan. Re-index the 3 important orphans (`team` is critical - team roster).

## MEMORY.md Truncation Risk

`MEMORY.md` is 101 lines of a 200-line truncation cap. Once we hit 200, lines after are silently dropped from session-start context.

**Currently:** 50.5% used.

**Burn rate:** ~5-10 lines/week over the past month based on commit log.

**Time to truncation:** ~10-15 weeks at current pace.

**Fix plan:**
1. Compress entries with the `caveman:compress` skill (already installed) - drops ~30% of lines
2. Move detailed historical context to memory files; keep one-line index entries
3. Consider per-project sub-indexes (e.g. `MEMORY-zaostock.md` referenced from main `MEMORY.md`)

## Conflict Watch (No Auto-Resolve, Just Flag)

| Topic | Memories | Conflict |
|---|---|---|
| FISHBOWLZ | deprecated vs push-standalone vs status (HISTORICAL) | Latest = deprecated. Older 4 should be marked SUPERSEDED in MEMORY.md descriptions. |
| ZOE | v2_redesign + v2_pivot_agent_zero + dashboard | All point at "ZOE is in flux" - readable as a set, not a real conflict. |
| Composio AO | `project_composio_ao_pilot` + ad-hoc references in 21 docs | Memory says paused / pilot-only. Some research docs treat it as default infra. Re-validate. |
| TRAE | `project_trae_ai_skip` (2026-04-25) vs 15 research docs | Memory is canonical (SKIP). Old research docs are historical evals, fine. |

## Recommended Re-Index (Add To MEMORY.md)

Priority orphans to re-index now:

```
- [feedback_check_pr_state_always.md](feedback_check_pr_state_always.md) — Always check PR state before pushing/commenting; missed checks caused issues.
- [feedback_never_push_main.md](feedback_never_push_main.md) — Never push directly to main. PR-only workflow.
- [feedback_no_mnemonic.md](feedback_no_mnemonic.md) — Never write or display mnemonic phrases. Generate fresh wallets server-side.
- [feedback_no_unsolicited_features.md](feedback_no_unsolicited_features.md) — Don't add features Zaal didn't ask for. Match scope to request.
- [feedback_test_live_not_localhost.md](feedback_test_live_not_localhost.md) — Test against live deployments, not localhost, when verifying production behavior.
- [project_zao_stock_team.md](project_zao_stock_team.md) — ZAOstock team roster.
- [project_zao_stock_production_audit.md](project_zao_stock_production_audit.md) — ZAOstock production audit baseline.
- [project_zao_festivals_history.md](project_zao_festivals_history.md) — ZAO festival history pre-ZAOstock; useful for one-pager / pitch.
- [project_nmc_fractured_atlas.md](project_nmc_fractured_atlas.md) — Fractured Atlas / NMC fiscal-sponsor context if ZAOstock needs 501c3.
```

Skip re-index for:

- `project_next_session.md` (one-shot)
- `project_bootcamp_transcripts.md` (review for relevance first)
- `project_music_overhaul.md` (likely superseded - read first)
- `project_onboarding_flow.md`, `project_domain.md` (check vs `project_auth_flow`, `project_infra_keys`)

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Read 5 priority feedback orphans, re-add to `MEMORY.md` index | Zaal or session-start auto | Update MEMORY.md | Today |
| Read 4 priority project orphans (zao_stock_team, production_audit, festivals_history, nmc_fractured_atlas), re-index | Zaal | Update MEMORY.md | Today |
| Diff `feedback_fishbowlz_push_standalone` vs `feedback_fishbowlz_standalone_only`; merge or retire | Zaal | One-shot | This week |
| Run `caveman:compress` on `MEMORY.md` to free truncation budget | Zaal | One-shot | Once index hits 150 lines |
| Quarterly memory audit | n/a | Calendar | 2026-07-29 |
| Add to `auto memory` system prompt: "if a memory file is created, ensure index entry too" | Zaal | Settings update | This week |

## Also See

- [Doc 551 - Research roadmap + library audit](../551-research-roadmap-library-audit/) - parallel audit at the doc level
- [Doc 552 - Skill library audit](../552-zao-skill-library-audit/) - parallel audit at the skill level
- `caveman:compress` skill - free truncation budget on MEMORY.md
- `everything-claude-code:context-budget` skill - measure context consumption

## Sources

- Local filesystem scan of `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` 2026-04-29
- `MEMORY.md` index at same dir, 101 lines

## Staleness Notes

Re-validate after orphan re-index pass. Re-audit quarterly.
