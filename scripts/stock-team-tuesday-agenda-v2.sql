-- ============================================================================
-- ZAOstock Tuesday Apr 21 Meeting Agenda v2
-- ============================================================================
-- Updates the Apr 21 meeting note to reflect:
-- - Master context from Tricky Buddha Space (music first, community second, tech third)
-- - Cypher session now part of the run-of-show
-- - Media capture pipeline as a new gap to discuss
-- - Sponsor deck (/stock/sponsor/deck) + llms.txt live
-- - Pre-reads: team member reports via /stock/team Meeting Notes
-- ============================================================================

UPDATE stock_meeting_notes
SET
  title = 'ZAOstock Team Meeting - April 21, 10:00am EST',
  notes = E'# Agenda (v2)\n\n**Time:** Tuesday April 21, 10:00am EST\n**Location:** TBD - confirm in team channel Monday\n\n**Core principle (Tricky Buddha Space):** Music first, Community second, Technology third.\n\n---\n\n**10:00-10:15 (15 min) - Zaal + team lead updates**\n- Zaal: overall status, timeline, distribution push summary\n- DaNici: design team update\n- DCoop: music team update (including WaveWarZ + Cypher feasibility)\n- Tyler: finance team update\n- Candy: ops + permits update\n\n**10:15-10:30 (15 min) - Team reports, round-robin**\n- Each member drops: moved-forward / blockers / top ask\n- Pre-logged in dashboard Meeting Notes\n- Team Reports Collector in-app\n\n**10:30-10:45 (15 min) - Decisions needed from the group**\n- Run-of-show format vote (doc 428): traditional vs hybrid with WaveWarZ + Cypher\n- Sponsor deck final approval (live at /stock/sponsor/deck)\n- Artist outreach wave 1 sign-off (templates at scripts/artist-outreach-templates.md)\n- Media capture pipeline - who owns this\n\n**10:45-11:00 (15 min) - Live demo + next 2 weeks**\n- Quick dashboard tour (Zaal)\n- New: /stock/cypher signup, /stock/sponsor/deck, /stock/llms.txt\n- Each team confirms what they own through May 5\n- Q&A, close\n\n---\n\n## Pre-reads (before the meeting)\n\n- Master strategic context: [research/community/432-zao-master-context-tricky-buddha](https://github.com/bettercallzaal/ZAOOS/tree/main/research/community/432-zao-master-context-tricky-buddha)\n- Run-of-show draft: [research/events/428](https://github.com/bettercallzaal/ZAOOS/tree/main/research/events/428-zaostock-run-of-show-program)\n- Birding Man lessons: [research/events/418](https://github.com/bettercallzaal/ZAOOS/tree/main/research/events/418-birding-man-festival-analysis)\n- Dashboard UI plan: [research/events/425](https://github.com/bettercallzaal/ZAOOS/tree/main/research/events/425-zaostock-dashboard-ui-lean-kanban-patterns)\n\n## Post-meeting deliverables\n\n- Action items captured here in this note (use Action Items field)\n- Each team commits to 1 deliverable through May 5\n- Next meeting scheduled before closing'
WHERE meeting_date = '2026-04-21';
