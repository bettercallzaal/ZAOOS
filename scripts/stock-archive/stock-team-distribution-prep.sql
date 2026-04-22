-- ============================================================================
-- ZAOstock Team — Additional Sat/Sun/Mon Prep for Tuesday Distribution
-- ============================================================================
-- Adds build + distribution milestones on top of the meeting-prep seed.
-- Tuesday Apr 21 = "distribution day" — Zaal hands each teammate their
-- 4-letter login code live during the meeting and walks through the dashboard.
-- ============================================================================

-- Friday Apr 17 additions (today) — unblock everything else
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'Run 4-letter password codes SQL + distribute',
    'Generate + apply the 4-letter password codes so every teammate can log in. Codes are first 4 letters of each name (uppercase). Output from scripts/set-stock-team-4letter-codes.ts.',
    '2026-04-17', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    E'Script: npx tsx scripts/set-stock-team-4letter-codes.ts\nPaste output SQL into Supabase SQL Editor. Do NOT share codes yet — save for Tuesday live distribution.'
  );

-- Saturday Apr 18 additions
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'Build Kanban spike: Sponsors tab (dnd-kit)',
    'First Kanban board wired to Sponsors tab. 6 columns by status. Drag to change status. Keep list view as toggle. Reference doc 425.',
    '2026-04-18', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    'Install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities. Mobile = horizontal swipe between columns.'
  ),
  (
    'Write one-pager handout for Tuesday',
    'Single-page PDF or screenshot to hand out at Tuesday meeting: dashboard URL, their code, 4 things to do in first login, how to update their own cards.',
    '2026-04-18', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );

-- Sunday Apr 19 additions
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'Kanban on Artists + Todos tabs',
    'Extend shared <KanbanBoard> primitive from Sponsors tab to Artists (6 status columns) and Todos (3 columns).',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  ),
  (
    'Add Pareto top-3 + Andon upgrades',
    'Pareto "Top 3 need attention" card on each tab. Bigger status pills + left-edge color stripe on every card. Reference doc 425.',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  ),
  (
    'Record 60-second dashboard demo video',
    'Screen-share loom-style: "Here is your Home tab, here is how to update your stuff." Send Monday with each code.',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  ),
  (
    'Mobile QA pass: kanban + login on iPhone',
    'Test the whole flow on a real phone. Drag works, swipe between columns works, login code input feels good.',
    '2026-04-19', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );

-- Monday Apr 20 additions (distribution prep)
INSERT INTO stock_timeline (title, description, due_date, category, owner_id, status, notes) VALUES
  (
    'DM each teammate: code + URL + demo video + report ask',
    'Single DM to each of the 13 other teammates. Include: (1) their 4-letter code, (2) zaoos.com/stock/team link, (3) 60-sec demo video, (4) status report ask for Tuesday.',
    '2026-04-20', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending',
    E'Template:\n\n"Hey [name] — ZAOstock meeting Tuesday. Your login code is [XXXX]. Go to zaoos.com/stock/team, enter your code, take a look at your Home tab. Watch this 60-sec demo: [link]. Before Tuesday drop a quick status: (1) what you moved forward, (2) blockers, (3) top ask. Takes 5 min. See you Tuesday."'
  ),
  (
    'Prep 5-min live demo for Tuesday kickoff',
    'Practice the walkthrough: login as Zaal, tour Home tab, drag a sponsor card, show Pareto card, flip to Timeline, close.',
    '2026-04-20', 'strategy',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1),
    'pending', ''
  );
