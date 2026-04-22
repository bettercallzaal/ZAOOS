-- ============================================================================
-- ZAOstock Team Meeting Prep — Tuesday April 21, 2026
-- ============================================================================
-- Seeds prep milestones into stock_timeline for Fri Apr 17 - Mon Apr 20
-- and a meeting notes stub for the Tuesday meeting itself.
-- All prep items default to Zaal (ops lead). Reassign via dashboard dropdowns.
-- ============================================================================

-- Friday April 17 — Dashboard QA + data audit
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'QA: login as each teammate, check Home tab',
    'Verify every member sees their real assignments on their personalized Home tab.',
    '2026-04-17', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    'Login as each of the 14 members. Note any broken layouts or missing data.'
  ),
  (
    'Data audit: assign owners to unassigned items',
    'Sweep Sponsors, Artists, Timeline, Todos — assign a clear owner to every unassigned row so Home tabs are populated for everyone.',
    '2026-04-17', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    'Any row still Unassigned by EOD Friday = Zaal owns by default.'
  ),
  (
    'UI polish pass on /stock/team',
    'Fix any rough spots spotted during QA — overflow, spacing, empty states.',
    '2026-04-17', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );

-- Saturday April 18 — Content + pitch materials
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'Finalize sponsor pitch deck copy (3 tracks)',
    'Lock final copy for Local / Virtual / Ecosystem sponsor tiers. Make sure pitch page and PDF match.',
    '2026-04-18', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    'Tracks: Local (Bangor Savings, Fogtown etc), Virtual (Whop, Songjam), Ecosystem (Base, Farcaster, Fractured Atlas).'
  ),
  (
    'Write artist outreach DM + email templates',
    'Reusable templates for music team to send to wishlist artists. Include ZAOstock pitch, set length, fee range, travel policy.',
    '2026-04-18', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'DCoop' LIMIT 1),
    'pending',
    '10 artist slots, Oct 3 2026, Ellsworth ME. Mix of confirmed + travel-booked.'
  ),
  (
    'Draft Tuesday meeting agenda',
    'Timeboxed agenda with status round-robin, sponsor pipeline review, artist lock-in list, budget check-in, blockers.',
    '2026-04-18', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    'Keep under 60 min. Put sharpest decision asks up top.'
  );

-- Sunday April 19 — Numbers + dry run
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'Reconcile budget: projected vs committed vs actual',
    'Walk through every budget entry. Make sure income targets tie to sponsor pipeline + expenses match vendor quotes.',
    '2026-04-19', 'finance',
    (SELECT id FROM stock_team_members WHERE name = 'Tyler Stambaugh' LIMIT 1),
    'pending',
    'Current target: $15.75K income, $19.3K expenses. Close the gap or flag it.'
  ),
  (
    'Clear all overdue milestones',
    'Either complete, reassign, or push to a realistic new date. No red overdue items going into Tuesday.',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  ),
  (
    'Full site dry-run: sponsor pitch page + team dashboard',
    'Walk through as a fresh sponsor would. Walk through as a fresh teammate would. Note every friction point.',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );

-- Monday April 20 — Teammate reports + final prep
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'DM every teammate: ask for Tuesday status report',
    'Send the status-report template to all 13 other teammates. Takes 5 min each for them to reply.',
    '2026-04-20', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    E'Message template:\n\nHey [name] — ZAOstock meeting Tuesday. Before then drop a quick status in the team dashboard (zaoos.com/stock/team). Need from you: (1) what you moved forward this week, (2) blockers, (3) top ask for the group. Takes 5 min. Thx.'
  ),
  (
    'Collect teammate reports into Meeting Notes tab',
    'As replies come in, log each one in the Tuesday meeting note so everyone can scan them before the meeting.',
    '2026-04-20', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  ),
  (
    'Lock Tuesday agenda + confirm time + location',
    'Final agenda saved to Meeting Notes. Confirm meeting time, location, attendees with whole team.',
    '2026-04-20', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );

-- Tuesday April 21 — Meeting note stub (pre-created so team can pre-read agenda)
INSERT INTO stock_meeting_notes (meeting_date, title, attendees, notes, action_items, created_by) VALUES
  (
    '2026-04-21',
    'ZAOstock Team Meeting — April 21',
    ARRAY['Zaal','Candy','FailOften','Hurric4n3Ike','Swarthy Hatter','DaNici','Shawn','DCoop','AttaBotty','Tyler Stambaugh','Ohnahji B','DFresh','Craig G','Maceo'],
    E'# Agenda (TBD — finalize Monday)\n\n1. **Status round-robin** (15 min) — each team lead: wins, blockers, asks. Reference dashboard reports.\n2. **Sponsor pipeline review** (10 min) — Local / Virtual / Ecosystem tracks. Who is in talks, who needs a push.\n3. **Artist lock-in list** (10 min) — 10 slots, confirmed count, travel decisions.\n4. **Budget check-in** (10 min) — income gap, expense commitments, cash flow.\n5. **Blockers + decisions needed** (10 min) — anything that requires the group.\n6. **Next 2 weeks** (5 min) — what each team owns through May 5.\n\n_Pre-read: every teammate''s Home tab status in the dashboard._',
    '',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1)
  );
