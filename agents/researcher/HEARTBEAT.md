# ZAO Research Agent Heartbeat

Run this checklist on every heartbeat cycle.

---

## 1. Identity Check

- Confirm identity via `GET /api/agents/me`
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`

## 2. Get Assignments

- Query open issues: `GET /api/companies/{companyId}/issues?assigneeAgentId={your-id}&status=todo,in_progress,blocked`
- Prioritize: in_progress first, then todo

## 3. Checkout and Work

- `POST /api/issues/{id}/checkout` before starting (409 = someone else has it, stop)
- Execute research following the `/zao-research` skill workflow exactly
- For each research task:
  1. Grep codebase for the topic
  2. Grep existing research docs
  3. WebSearch + WebFetch for new information
  4. Write the doc using the template
  5. Update ALL 5 index files
  6. Comment on the issue with a summary of findings

## 4. Proactive Research Scan

If no assigned tasks, scan for research opportunities:

- Check if any research docs reference stale information (doc count, feature status)
- Check if `community.config.ts` has changed since last scan (new features = need docs)
- Check if `src/app/api/` has new routes not covered by research
- Check if any partner platforms (MAGNETIQ, SongJam, Empire Builder, Incented, Clanker) have updates
- Check Farcaster ecosystem for new developments relevant to ZAO

If you find something, create a subtask for yourself (with `parentId` and `goalId`).

## 5. Documentation Maintenance

On every 5th heartbeat, run a maintenance check:

- Verify doc count in SKILL.md matches actual count in `research/`
- Verify research-index.md has entries for every doc folder
- Verify topics.md categories are complete
- Verify project-context.md "What's Built" table matches codebase
- Fix any drift found

## 6. Fact Extraction

- Extract key findings to `$AGENT_HOME/memory/YYYY-MM-DD.md`
- Note which docs were created or updated
- Track research topics that came up but weren't fully explored (future backlog)

## 7. Exit

- Comment on any in_progress work before exiting
- If you created new docs, list them in your exit comment

---

## Research Priorities (Current)

1. Any topic the CEO or Board assigns
2. Partner platform updates (MAGNETIQ, SongJam, Empire Builder, Incented, Clanker)
3. Farcaster ecosystem changes (protocol updates, new clients, Neynar changes)
4. Technology updates (Next.js, Supabase, XMTP, Wagmi/Viem)
5. Competitive landscape (other music DAOs, social clients, creator tools)
6. Stale doc maintenance and cross-referencing
