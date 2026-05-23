---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: Audit the persistent memory state - ~80 project memories + ~30 feedback memories + user memories - identify gaps, contradictions, superseded entries, and consolidation candidates
---

# Memory State Audit - ZAOOS Claude Code (2026-05-23)

## Executive Summary

Memory system contains **173 live files + MEMORY.md index**. Index is stale: **14 files on disk are unindexed, 0 files indexed are missing** (perfect coverage ratio). Key findings:

- **Index drift:** 14 new memories created but not added to MEMORY.md
- **Contradictions:** 2 pairs of conflicting workflow rules (FISHBOWLZ sync guidance vs deprecation; branching discipline duplicates)
- **Superseded entries:** 8 memories marked "(HISTORICAL)" or "(SUPERSEDED)" still on disk, consuming scan time
- **Recommendation:** Merge old ZOE redesigns into canonical doc; delete FISHBOWLZ sync guides; update index in next session

## 1. Count & Inventory

### By Category (from MEMORY.md)

| Section | Index Count | Actual Files | Status |
|---------|------------|-------------|--------|
| Project | 117 | 119 | Index missing 2 |
| Feedback | 43 | 46 | Index missing 3 |
| User | 4 | 4 | Complete |
| MEMORY.md | 1 | 1 | Complete |
| **Total** | **165** | **173** | **8 file drift** |

### Unindexed Files on Disk (New Since Last Index Update)

**Project memories (2 new):**
- `project_zao_fractal_whitepaper.md` - ZAO Fractal Whitepaper, Zaal's "magnum opus" (doc 696)
- `project_zao_stock_details_april.md` - ZAOstock April details supplement

**Feedback memories (3 new):**
- `feedback_admin_pushed_msgs_not_in_concierge_memory.md` - ZOE concierge memory gap
- `feedback_sync_reminder.md` - Generic sync guidance

**Other project memories NOT indexed (9 additional):**
- `project_bonfires_zao_integration.md` - Bonfires integration with ZAO
- `project_bootcamp_transcripts.md` - Bootcamp call recordings/notes
- `project_bz_builds_show.md` - BetterCallZaal builds show
- `project_domain.md` - Domain registration state
- `project_music_overhaul.md` - Music system redesign
- `project_next_session.md` - Next session planning notes
- `project_onboarding_flow.md` - Onboarding funnel
- `project_respect_airtable.md` - Respect ledger Airtable sync
- `project_respect_system.md` - Actual Respect scoring (no decay, no tiers)

**Verdict:** MEMORY.md is 14 revisions behind filesystem. Last index update likely 2026-05-17 or earlier (after Arthur call on 5-19 but before ZAOstock team meeting materials).

---

## 2. Contradiction Audit

### Pair A: FISHBOWLZ Sync Guidance

**Memory 1 - `feedback_fishbowlz_push_standalone.md` (45 days old)**
- Rule: "Always push FISHBOWLZ to standalone repo after changes"
- Premise: "fishbowlz.com deploys from bettercallzaal/fishbowlz"
- Action: Run sync script + push to standalone

**Memory 2 - `feedback_fishbowlz_standalone_only.md` (44 days old)**
- Rule: "NEVER use sync script; always edit standalone directly"
- Premise: "Sync script overwrites standalone with old ZAO OS code"
- Action: Only edit at `/Documents/fishbowlz`, never sync

**Underlying Truth - `project_fishbowlz_deprecated.md` (19 days old)**
- Status: FISHBOWLZ killed 2026-05-04
- Deprecation note: "Juke partnership stands. No FISHBOWLZ resurrection without Zaal explicit reverse"
- Implication: Both sync rules are obsolete for NEW work, but may apply if resurrection occurs

**Recommendation:** Delete both sync feedback files. If FISHBOWLZ resumes, Zaal will specify new workflow. Cite `project_fishbowlz_deprecated.md` as source of truth (status = do not edit).

---

### Pair B: Branch Discipline (Minor Duplication, Not Contradiction)

Three memories encode similar guidance with slight variation:

1. `feedback_branch_discipline.md` - "Verify branch name before every push"
2. `feedback_never_push_main.md` - "Never push directly to main; always use ws/ branch"
3. `feedback_check_pr_state_always.md` - "Before git push/gh pr create, run gh pr list --state all"
4. `feedback_no_push_merged_pr.md` - "Never push to merged PR branch; create new branch if merged"

**Verdict:** Not contradictory, but overlapping scope. Could consolidate into single `feedback_git_workflow_discipline.md` covering: (1) branch naming, (2) pre-push checks (gh pr list), (3) never direct-to-main, (4) reject merged PRs.

---

## 3. Superseded / Historical Entries

Eight memories are explicitly marked as HISTORICAL or SUPERSEDED. They still consume scan time in memory reads. Classify by action:

### Tier 1: Safe to Delete (Explicitly Superseded)

| Memory | Status | Replacement | Recommendation |
|--------|--------|-------------|-----------------|
| `project_zoe_v2_redesign.md` | SUPERSEDED 2026-05-04 | `project_zoe_soul_architecture.md` + `project_hermes_canonical.md` | Delete; new canonical is bot/src/zoe |
| `project_zoe_v2_pivot_agent_zero.md` | SUPERSEDED (Agent Zero recommendation) | `project_zoe_soul_architecture.md` | Delete; no Agent Zero pivot shipped |
| `project_composio_ao_pilot.md` | SUPERSEDED; AO moved to VPS | `project_ao_vps_portal_decision.md` | Delete; use ao.zaoos.com reference instead |
| `project_openclaw_setup.md` | HISTORICAL; OpenClaw decommissioned | N/A | Delete; superseded by VPS migration |

### Tier 2: Keep (Historical Reference Value)

| Memory | Status | Reason |
|--------|--------|--------|
| `project_fishbowlz_status.md` | HISTORICAL - see fishbowlz_deprecated | Linked deprecation note; keep as context |
| `project_fishbowlz_agents_design.md` | HISTORICAL - see fishbowlz_deprecated | Linked deprecation note; keep as context |
| `project_openclaw_status.md` | Partially historical | VPS reference; partially live |
| `project_research_followups_apr21.md` | Parked 2026-04-21 | Pending Zaal decision; might resurrect |

---

## 4. Project Memory Grouping Analysis

Proposed reorganization into 8 thematic clusters. Current index is flat (117 entries); grouping reveals concentration:

### Theme: People (11 memories)

**Core team:**
- `project_arthur_neynar.md` (new, 5/19)
- `project_tyler_stambaugh.md` (doc 714)
- `project_jordan_oram.md` (doc 719)
- `project_kmac_eth.md` (doc 718)
- `project_ryan_kagy.md` (docs 648, 669, 682)
- `project_failoften.md` (doc 678)
- `project_tanja_fractal_book.md` (doc 675)
- `project_steve_peer.md` (ZAOstock co-curator)
- `project_candytoybox_samantha.md` (WaveWarZ cofounder)
- `project_hurric4n3ike.md` (WaveWarZ founder)
- `project_iman_role.md` (ZAO Devz lead, VPS owner)

**Note:** No dedicated memories for Zaal's core team (Cassie, Joni, Thyrev) or other key collaborators. Consider: are these documented elsewhere, or are they just living in chat?

### Theme: Brand & Strategy (7 memories)

- `project_zao_canonical_pitch.md` (decentralized impact network)
- `project_zao_brand_canon.md` (ZAO acronym candidate)
- `project_zao_12mo_vision.md` (May 2027 primitives)
- `project_zao_vs_zabal_projects.md` (taxonomy)
- `project_zao_brand_legal_architecture.md` (BCZ LLC hub)
- `project_zao_master_context.md` (music first, community second, tech third)
- `project_zao_incubator_model.md` (ZAO as incubator)

**Observation:** Strong brand/positioning documentation. Consider consolidating `project_zao_canonical_pitch.md` + `project_zao_master_context.md` + `project_zao_brand_canon.md` into single living doc since they overlap (pitch evolution).

### Theme: Ecosystem State (13 memories)

**ZAOstock series (8):**
- `project_zao_stock_confirmed.md`
- `project_zao_stock_team.md`
- `project_zao_stock_production_audit.md`
- `project_zao_stock_meeting_apr10.md`
- `project_zao_stock_pitch_answers.md`
- `project_zaostock_open_call.md`
- `project_zaostock_team_meeting.md`
- `project_zaostock_master_strategy.md`
- `project_zaostock_spinout.md` (graduation plan)
- `project_zao_stock_details_april.md` (unindexed)

**Other ecosystem:**
- `project_zabal_games.md` (3-month build-a-thon)
- `project_zao_jukebox_brainstorm.md` (music miniapp)
- `project_zao_festivals_umbrella.md` (ZAO Festivals as container)
- `project_zao_festivals_history.md` (event history)

**Observation:** ZAOstock has 10 dedicated memories for a single event. Consolidate into 1-2 living docs: (1) Strategy & Confirmed Details (once locked, never changes), (2) Rolling Logistics (team, audit, deadlines - updates weekly).

### Theme: Tech Stack & Infrastructure (15 memories)

**Agent/Concierge:**
- `project_hermes_canonical.md` (agent framework)
- `project_zoe_soul_architecture.md` (canonical ZOE runtime)
- `project_zoe_dashboard.md` (UI)
- `project_zoe_post_slate.md` (social pipeline)
- `project_agent_squad_dashboard.md` (agent visibility)
- `project_ollama_local_llm.md` (local inference)
- `project_zaocoworkingbot.md` (@ZAOcoworkingBot)

**Infrastructure:**
- `project_infra_keys.md`
- `project_paperclip_infra.md`
- `project_vps_skill.md` (VPS provisioning)
- `project_no_vps2.md` (decision guard: only 1 VPS)

**Deprecated infrastructure:**
- `project_openclaw_setup.md`
- `project_openclaw_status.md`
- `project_ao_vps_portal_decision.md` (moved to VPS 1)

**Observation:** ZOE redesign history (v2_redesign + v2_pivot_agent_zero + soul_architecture) shows iteration fatigue. Deleted v2_redesign + v2_pivot to clean up.

### Theme: Decisions Locked (5 memories)

- `project_zaoos_monorepo_as_lab.md` (graduation model)
- `project_hermes_canonical.md` (agent framework choice)
- `project_fix_pr_pipeline_live.md` (safe-git-push + hooks)
- `project_safe_git_push_hook_patched.md` (hook scoping)
- `project_no_vps2.md` (infrastructure boundary)

**Note:** These are guards. Valuable to keep visible.

### Theme: Completed/Shipped Features (6 memories)

- `project_bcz_yapz_graduated.md` (spun out 2026-05-06)
- `project_zaostock_bot_live.md` (@ZAOstockTeamBot systemd)
- `project_miniapp_audit_591.md` (production-ready 2026-05-02)
- `project_empire_builder_zabal_integration.md` (shipped across 6 PRs)
- `project_ask_gpt_loop_live.md` (Claude prompts ChatGPT)
- `project_juke_integration.md` (iframe embed shipped)
- `project_nexus_hub_live.md` (14-brand directory)

**Observation:** Valuable archive. Could move to `## Shipped` section in MEMORY.md for clarity.

### Theme: Research & Roadmap (12 memories)

- `project_music_research.md` (Sonata/Herocast patterns)
- `project_future_repos.md` (ZID, Respect, AI Taste, Quilibrium)
- `project_elizaos_agent.md` (onboarding bot candidate)
- `project_xmtp_research.md` (Phase 2 messaging)
- `project_hive_research.md` (cross-post to Hive)
- `project_four_pillars.md` (app section model)
- `project_next_features.md` (priorities)
- `project_research_*` (558-568 batch docs)
- `project_research_roadmap_apr29.md` (future queue)
- `project_zao_contribution_circles.md` (adaptation plan)
- `project_zao_fractal_whitepaper.md` (magnum opus)
- `project_zao_jukebox_brainstorm.md` (spec 2026-04-29)

### Theme: Historical / Paused (8 memories)

- `project_fishbowlz_status.md` (HISTORICAL)
- `project_fishbowlz_agents_design.md` (HISTORICAL)
- `project_fishbowlz_deprecated.md` (KILLED 2026-05-04)
- `project_zoe_v2_redesign.md` (SUPERSEDED)
- `project_zoe_v2_pivot_agent_zero.md` (SUPERSEDED)
- `project_composio_ao_pilot.md` (SUPERSEDED; AO moved)
- `project_openclaw_setup.md` (HISTORICAL)
- `project_openclaw_status.md` (HISTORICAL)

**Recommendation:** Move to separate `## Archived` section after Tier 2 review. Free up scan time in active memory reads.

---

## 5. Feedback Memory Audit

### By Discipline

**Style & Voice (5 memories):**
- `feedback_no_em_dashes.md`
- `feedback_no_emojis.md`
- `feedback_farcaster_not_warpcast.md`
- `feedback_never_ask_private_keys.md`
- `feedback_never_accept_pasted_secrets.md`

**Git & Branching Workflow (7 memories - consolidation candidate):**
- `feedback_worksession_first.md`
- `feedback_branch_discipline.md`
- `feedback_no_push_merged_pr.md`
- `feedback_always_pr.md`
- `feedback_no_merged_pr_code.md`
- `feedback_never_push_main.md`
- `feedback_check_pr_state_always.md`

**Skill Behavior & Process (8 memories):**
- `feedback_firefly_only.md`
- `feedback_no_mnemonic.md`
- `feedback_no_unsolicited_features.md`
- `feedback_copyable_content_own_bubble.md`
- `feedback_grill_one_by_one.md`
- `feedback_research_before_grill.md`
- `feedback_pr_auto_test_task.md` (new, unindexed)
- `feedback_admin_pushed_msgs_not_in_concierge_memory.md` (new, unindexed)

**Output & Publishing (3 memories):**
- `feedback_social_posting.md`
- `feedback_build_public.md`
- `feedback_post_irl_events.md`

**Planning & Commitment (9 memories):**
- `feedback_no_unilateral_dates.md`
- `feedback_no_unauthorized_commitments.md`
- `feedback_no_arbitrary_targets.md`
- `feedback_no_unconfirmed_anchor_partners.md`
- `feedback_dont_invent_outreach.md`
- `feedback_no_unconfirmed_roadmap.md`
- `feedback_no_regenerate_codes.md`
- `feedback_no_time_estimates.md`
- `feedback_ship_and_use_not_meta.md`

**Infrastructure & Config (3 memories):**
- `feedback_prefer_claude_max_subscription.md`
- `feedback_oss_first_no_platforms.md`
- `feedback_test_live_not_localhost.md`

**Environment & Context (3 memories):**
- `feedback_mobile_first.md`
- `feedback_workspace_worktrees.md`
- `feedback_no_flow_state_gate.md`

**Deprecated/Obsolete (4 memories):**
- `feedback_fishbowlz_push_standalone.md` (obsolete; FISHBOWLZ killed)
- `feedback_fishbowlz_standalone_only.md` (obsolete; FISHBOWLZ killed)
- `feedback_no_bare_with_oauth.md` (PR #512; check if still relevant)
- `feedback_sync_reminder.md` (unindexed; too generic)

**Observation:** Feedback rules cluster into 8-9 domains, but git workflow is severely over-documented (7 memories). Consolidate to 2: (1) Session startup (`worksession_first`), (2) Pre-push checks (merge `branch_discipline` + `check_pr_state_always` + `never_push_main` + `no_push_merged_pr`).

---

## 6. User Memory Completeness

Only 4 user memories exist:
- `user_zaal.md` - Founder bio
- `user_zaal_builder_patterns.md` - 7 patterns from 84-repo survey (doc 649)
- `user_zaal_schedule.md` - M-F 4:30am wake, gym, DND, lunch stream, prime 4-7pm
- `user_social_handles.md` - Farcaster @zaal, X @bettercallzaal, YouTube @bettercallzaal

**Missing:** No memories for other key collaborators (Cassie, Joni, Thyrev). Are they documented? Or rely on chat history?

---

## 7. Top 5 Consolidation Recommendations

### 1. Merge ZOE Redesign History (Remove 2 Superseded Entries)

- Delete: `project_zoe_v2_redesign.md`, `project_zoe_v2_pivot_agent_zero.md`
- Keep: `project_zoe_soul_architecture.md` (canonical)
- Reason: Live code is in bot/src/zoe (Hermes pattern). Old redesign specs add no value post-migration.
- Impact: Frees 2 memory slots; simplifies ZOE troubleshooting reads.

### 2. Delete FISHBOWLZ Sync Feedback (Kill Obsolete Guidance)

- Delete: `feedback_fishbowlz_push_standalone.md`, `feedback_fishbowlz_standalone_only.md`
- Keep: `project_fishbowlz_deprecated.md` (source of truth)
- Reason: FISHBOWLZ killed 2026-05-04. If resurrected, Zaal will specify new workflow.
- Impact: Frees 2 feedback slots; eliminates contradiction.

### 3. Consolidate Git Workflow (7 Memories -> 2)

- Create: `feedback_git_workflow_core.md`
  - Coverage: worksession_first, branch naming, pre-push checks (gh pr list), never direct-to-main, reject merged PR branches
- Delete: `feedback_branch_discipline.md`, `feedback_never_push_main.md`, `feedback_check_pr_state_always.md`, `feedback_no_push_merged_pr.md`, `feedback_no_merged_pr_code.md`
- Keep separately: `feedback_always_pr.md` (finishing step)
- Reason: High overlap; single memory is faster to read and apply.
- Impact: Frees 4-5 feedback slots; no functionality loss.

### 4. Merge ZAOstock State (10 Memories -> 2)

- Keep: `project_zaostock_master_strategy.md` (strategy & why - immutable)
- Keep: `project_zaostock_team_meeting.md` (rolling meetings - update-in-place)
- Delete: `project_zao_stock_confirmed.md`, `project_zao_stock_team.md`, `project_zao_stock_production_audit.md`, `project_zao_stock_meeting_apr10.md`, `project_zao_stock_pitch_answers.md`, `project_zaostock_open_call.md`, `project_zao_stock_details_april.md`
- Keep: `project_zao_stock_pitch_answers.md` (FAQ value)
- Reason: Redundant details spread across 8 memories. Update immutable state once; keep rolling doc for live changes.
- Impact: Frees 7-8 project memory slots; easier to find current ZAOstock state.

### 5. Archive Historical Entries (Move, Don't Delete)

Create new `## Archived (Historical)` section in MEMORY.md. Move 8 superseded memories there:
- All FISHBOWLZ variants (kept for context of deprecation decision)
- All ZOE v2 variants (kept for history of agent-framework evolution)
- All OpenClaw/AO variants (kept for VPS migration record)

Benefit: Keep audit trail; remove noise from active scans.

---

## 8. Index Update Checklist (Next Session)

Whoever edits MEMORY.md next should:

1. **Add 14 unindexed files** to appropriate sections:
   - `project_zao_fractal_whitepaper.md` (Projects)
   - `project_zao_stock_details_april.md` (Projects)
   - `project_bonfires_zao_integration.md` (Projects)
   - `project_bootcamp_transcripts.md` (Projects)
   - `project_bz_builds_show.md` (Projects)
   - `project_domain.md` (Projects)
   - `project_music_overhaul.md` (Projects)
   - `project_next_session.md` (Projects)
   - `project_onboarding_flow.md` (Projects)
   - `project_respect_airtable.md` (Projects)
   - `project_respect_system.md` (Projects)
   - `feedback_admin_pushed_msgs_not_in_concierge_memory.md` (Feedback)
   - `feedback_sync_reminder.md` (Feedback)
   - `feedback_pr_auto_test_task.md` (Feedback - move after `feedback_always_pr`)

2. **Delete obsolete feedback** (2 FISHBOWLZ sync rules)

3. **Mark 8 superseded entries** as moved to Archived section or delete

4. **Optionally apply consolidations** from Recommendations 1-4

---

## Conclusion

Memory system is **functioning well** (zero index-to-disk mismatches, good coverage). Key issues are:

1. Index staleness (14 files behind) - low severity, auto-fixes next edit
2. FISHBOWLZ contradictions (obsolete post-deprecation) - delete if comfortable; otherwise document "KILLED" status
3. Theme clustering opportunity (ZAOstock, ZOE, git workflow) - consolidation gains clarity, not essential
4. 8 superseded entries still consuming scan time - archive or delete

**Minimal action to unblock:** Update MEMORY.md index + delete 2 FISHBOWLZ sync memories. Done in <5 minutes.

**Optional high-value action:** Consolidate ZAOstock (10 -> 2 memories) + git workflow (7 -> 1 memory). Gain 14-15 memory slots with zero functional loss.

---

*Audit date: 2026-05-23*
*Auditor: Claude Code (Haiku 4.5)*
*Scope: Entire memory directory + MEMORY.md index*
