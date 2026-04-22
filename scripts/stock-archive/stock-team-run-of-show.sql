-- ============================================================================
-- ZAOstock Run-of-Show: Option A data model
-- ============================================================================
-- Adds day_of_start_time and day_of_duration_min columns to stock_artists.
-- Idempotent via IF NOT EXISTS. No seed values. Team fills at or after the
-- Tuesday Apr 21 meeting when format is approved.
-- ============================================================================

ALTER TABLE stock_artists
  ADD COLUMN IF NOT EXISTS day_of_start_time TIME,
  ADD COLUMN IF NOT EXISTS day_of_duration_min INT;

COMMENT ON COLUMN stock_artists.day_of_start_time IS
  'Target start time for the artist on Oct 3 2026. Approximate — the run-of-show uses fluid pacing with 5-10 min flex between blocks.';
COMMENT ON COLUMN stock_artists.day_of_duration_min IS
  'Planned set length in minutes. Typical: 15-20 for traditional, 5-10 for WaveWarZ round segments.';

-- ============================================================================
-- Update the Tuesday Apr 21 meeting note with confirmed time + agenda
-- ============================================================================

UPDATE stock_meeting_notes
SET
  title = 'ZAOstock Team Meeting - April 21, 10:00am EST',
  notes = E'# Agenda (finalized)\n\n**Time:** Tuesday April 21, 10:00am EST\n**Location:** TBD - confirm in team channel Monday\n\n---\n\n**10:00-10:15 (15 min)** - Updates from Zaal + team leads\n- Zaal: overall status, timeline, big picks\n- DaNici: design team update\n- DCoop: music team update\n- Tyler: finance team update\n- Candy: ops update\n\n**10:15-10:30 (15 min)** - Team reports, round-robin\n- Each member: moved-forward / blockers / top ask\n- Reports pre-logged in dashboard Meeting Notes - see below\n\n**10:30-10:45 (15 min)** - Decisions needed from the group\n- Run-of-show format vote (see research doc 428)\n- Sponsor pitch deck final approvals\n- Artist outreach wave 1 sign-off\n\n**10:45-11:00 (15 min)** - Live demo + next 2 weeks\n- Quick dashboard tour (Zaal)\n- Each team confirms what they own through May 5\n- Q&A, close\n\n---\n\n_Pre-read: every teammate should log their status report in this note before the meeting using the Team Reports Collector._'
WHERE meeting_date = '2026-04-21';
