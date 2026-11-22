# Lane Opening - the standard for opening any new lane

mechanism: none yet (since 2026-11-22)

Zaal, 2026-11-22, in the orchestrator2 pane (vault `decisions/ruling-2026-11-22-afternoon.md`, entry "Standard for opening any new lane"): "Standard for opening any new lane, add it to the rules file". The eight points are his words, kept in his order. Rule numbers are stable.

1. **Brief first, saved in the vault at `handoffs/<lane>.md` (never /tmp).** Four parts: objective, what to deliver and in what format, boundaries (what it may and may not do: deletes, sends, merges, installs are Zaal's), and a done condition. Plus where to report: one Agent orders row.
2. **Name: `[Project] lane-name`,** so the sidebar groups by project. Pin it under its project.
3. **Model: Sonnet by default;** say why if anything else.
4. **Mode: open in auto mode.** If the tool cannot, put "press Shift+Tab in <lane>" as the first line of the message to Zaal.
5. **Preflight:** check the tools the job needs exist on that machine before starting (macOS vs Windows vs WSL differences).
6. **Size it:** Who, Size, Where, as on Agent orders. If it hits its limit, it stops and reports what is incomplete.
7. **Closing:** when done, the lane writes its handoff and tells Zaal; he puts "close <lane>" on the orchestrator's list. No lane stays open idle more than a day.
8. **Cap:** before opening, list the idle lanes Zaal could close to make room.

Related: `lane-autonomy.md` (when a lane may proceed without asking), `handoff-discipline.md` (rules 1 and 5, the brief and the idle-day close), `resource-release.md` (rule 7, waiting lanes are closed once their question is filed).
