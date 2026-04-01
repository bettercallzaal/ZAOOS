# TASKS.md — Current Work Queue

_Last updated by Zaal via Claude Code: 2026-04-01_

## How to Work

You now have `gh` CLI and `git` fully working. Your SOUL.md has the workflow.

**Branch rules:**
- Every task = its own branch off main
- Branch naming: `feat/<short-name>` or `fix/<short-name>`
- One PR per task. Keep PRs focused.
- Always `git pull origin main` before branching

**Workflow for each task:**
```bash
cd /home/node/openclaw-workspace/zaoos
git pull origin main
git checkout -b feat/<task-name>
# do the work
git add <files>
git commit -m "feat: description"
git push -u origin feat/<task-name>
gh pr create --title "feat: description" --body "Summary"
```

---

## Queue

### P1 — Missing Pages (from /nexus research)

These 4 pages exist on the live site (thezao.com) but are NOT in the codebase. Build them one branch per page.

1. **`/nexus`** — Hub page linking to /community, /calendar, /zao-leaderboard
   - Branch: `feat/nexus-page`
   - It is a central navigation/landing page for community resources
   - Look at the existing page structure in `src/app/(auth)/` for patterns

2. **`/community`** — "Join as a creator" landing page
   - Branch: `feat/community-page`
   - Should explain what ZAO is and how to join

3. **`/calendar`** — ZAO Calendar page
   - Branch: `feat/calendar-page`
   - Note: the live site has a typo ("Calandar") — fix it

4. **`/zao-leaderboard`** — Leaderboard page
   - Branch: `feat/leaderboard-page`
   - Display member rankings/activity

### P2 — Navigation Gaps

5. **Add `/assistant` to BottomNav** — page exists but has no nav link
   - Branch: `feat/nav-assistant`

6. **Add `/notifications` to BottomNav** — page exists but has no nav link
   - Branch: `feat/nav-notifications`

### P2 — Open Issues

7. **Issue #78** — Join someone else's room
8. **Issue #77** — Setup: Connect Threads API for cross-posting
9. **Issue #76** — QA: Test 8 admin dashboard features

### P3 — Stale Local Branches (cleanup)

These local branches were never pushed to origin. Review and either push or delete:
- `feat/audio-provider-abstraction`
- `feat/members-pagination`
- `feat/research`
- `fix/stream-token-auth`

---

## Done

- [x] Push doc 171 Karpathy research update to main (pushed 2026-04-01)
