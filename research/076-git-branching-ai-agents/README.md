# 76 — Git Branching Strategy for ZAO OS + Paperclip Agents

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Define branching/merging strategy for a solo founder (Zaal) with Paperclip AI agents creating branches and commits

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Strategy** | USE trunk-based development with short-lived branches. Merge to main daily/weekly. No long-lived feature branches. |
| **Immediate** | MERGE `feat/governance-tests` (22 commits) to main NOW — it's become a de facto trunk |
| **Branch naming** | `feat/`, `fix/`, `docs/`, `chore/` prefixes. Max 1 week lifespan. |
| **Agent branches** | Paperclip agents USE worktrees (already doing this). Merge sequentially, not simultaneously. |
| **Worktree cleanup** | DELETE the 13 `worktree-agent-*` branches after verifying no pending work |
| **Who merges** | ONLY Zaal (Board) merges to main. Agents create PRs, never push to main directly. |
| **CI gates** | `npm run lint && npm run build` must pass before any merge to main |

---

## Current State (The Problem)

```
main (stale — 22 commits behind)
  │
  ├── feat/governance-tests (22 commits — has EVERYTHING: security fixes,
  │     Hats Protocol, 10+ research docs, Paperclip setup, community issues,
  │     tests, wallet auth fixes)
  │
  ├── feat/ecosystem-page (created by Founding Engineer)
  ├── fix/lint-errors (created by Founding Engineer)
  │
  └── worktree-agent-* (13 branches from Paperclip agents)
```

**The problem:** `feat/governance-tests` started as one feature but became the de facto trunk. Main is stale. Agent worktree branches may conflict.

---

## The Fix: Merge Now, Adopt Trunk-Based Going Forward

### Step 1: Merge feat/governance-tests → main (NOW)

```bash
# Verify build passes
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
npm run lint && npm run build

# Merge to main
git checkout main
git merge feat/governance-tests --no-ff -m "Merge feat/governance-tests: security fixes, Hats, research docs 62-76, Paperclip, community issues"
git push origin main

# Delete the old branch
git branch -d feat/governance-tests
git push origin --delete feat/governance-tests
```

### Step 2: Clean Up Worktree Branches

```bash
# List all worktree branches
git branch | grep worktree-agent

# Check if any have unmerged changes
for b in $(git branch | grep worktree-agent | tr -d ' '); do
  echo "=== $b ==="
  git log main..$b --oneline | head -5
done

# If empty (no unique commits) → safe to delete
git branch -D worktree-agent-a02a8974 worktree-agent-a0b667c4 ...

# Or delete all at once
git branch | grep worktree-agent | xargs git branch -D
```

### Step 3: Merge Agent Feature Branches

```bash
# Check what's on the Founding Engineer's branches
git log main..feat/ecosystem-page --oneline
git log main..fix/lint-errors --oneline

# Merge sequentially (NOT simultaneously)
git checkout main
git merge feat/ecosystem-page --no-ff
git merge fix/lint-errors --no-ff
git push origin main
```

---

## Going Forward: Trunk-Based with Short-Lived Branches

### The Model

```
main (always deployable)
  │
  ├── feat/ecosystem-page (Founding Engineer, 1-3 days max)
  ├── fix/signer-bypass (Founding Engineer, same day)
  ├── docs/research-77 (Research Agent, same session)
  │
  └── Merge back to main quickly. Delete branch after merge.
```

### Rules

1. **Main is always deployable.** Never push broken code to main.
2. **Branches live max 1 week.** Anything older is a problem.
3. **One feature per branch.** Don't let branches accumulate unrelated work.
4. **Merge sequentially.** First branch merges, second rebases on updated main, then merges. This gives each merge full context.
5. **Agents create branches, Board merges.** Agents never push to main.
6. **Build must pass.** `npm run lint && npm run build` before every merge.
7. **Delete after merge.** No stale branches.

### Branch Naming Convention

| Prefix | Use | Example |
|--------|-----|---------|
| `feat/` | New feature | `feat/ecosystem-page` |
| `fix/` | Bug fix | `fix/signer-fid-bypass` |
| `docs/` | Research or documentation | `docs/research-77-xmtp-v4` |
| `chore/` | Config, deps, cleanup | `chore/update-deps` |
| `test/` | Test additions | `test/api-route-vitest` |

### How Paperclip Agents Should Branch

**Founding Engineer:**
- Creates `feat/` or `fix/` branches per task
- Uses worktrees for parallel tasks
- Creates PR when done → Board reviews → merges

**Research Agent:**
- Creates `docs/` branches for research additions
- Or works directly on main for doc-only changes (low risk)

**CEO Main:**
- Doesn't create branches (strategy/delegation only)

**Security Auditor:**
- Read-only (no branches needed for audits)
- Creates `fix/` branch only if fixing a vulnerability

---

## Git Worktrees for Parallel Agent Work

Paperclip agents already use worktrees. Best practices:

### Why Worktrees Work for AI Agents

- Each agent gets its own directory and branch
- No file conflicts during parallel execution
- Shared `.git` database (efficient storage)
- Conflicts deferred to intentional merge points

### Setup

```bash
# Agent creates a worktree for its task
git worktree add ../zaoos-ecosystem feat/ecosystem-page

# Agent works in the worktree
cd ../zaoos-ecosystem
# ... make changes, commit ...

# When done, switch back and merge
cd "/Users/zaalpanthaki/Documents/ZAO OS V1"
git merge feat/ecosystem-page
git worktree remove ../zaoos-ecosystem
```

### Merge Order for Multiple Agent Branches

```
1. Pick the branch with the most foundational changes (merge first)
2. Rebase remaining branches on updated main
3. Merge next branch
4. Repeat until all merged
5. Delete all merged branches + worktrees
```

**Never merge multiple branches simultaneously.** Sequential merging gives each merge full context and produces cleaner history.

### Worktree Cleanup

```bash
# List active worktrees
git worktree list

# Remove finished worktrees
git worktree prune

# Delete associated branches
git branch -D <branch-name>
```

---

## ZAO-Specific Workflow

### Daily Rhythm

| Time | Action |
|------|--------|
| **Morning** | Check Paperclip dashboard. Review any PRs from agents. |
| **Merge window** | Merge completed agent branches to main. Run build. Push. |
| **During day** | Agents work on assigned tasks in worktree branches. |
| **Evening** | Review activity feed. Approve/reject hires. Plan tomorrow's tasks. |

### Vercel Deployment

- **main** branch deploys to production (zaoos.com)
- **feat/** branches get Vercel preview deployments (automatic)
- Agents can test their work on preview URLs before merge

### What Goes Directly to Main (No Branch Needed)

- Research docs (zero risk, documentation only)
- CLAUDE.md updates
- Skill file updates
- README changes
- `.env.example` additions

### What MUST Go Through a Branch + PR

- Any change to `src/` (application code)
- Any change to `scripts/*.sql` (database migrations)
- Any change to `community.config.ts` (branding/config)
- Any change to `package.json` (dependencies)
- Any change to `.env.local` equivalent

---

## Sources

- [Trunk-Based Development](https://trunkbaseddevelopment.com/) — the authoritative guide
- [Git Worktrees for AI Agents (Medium)](https://medium.com/design-bootcamp/running-multiple-ai-agents-at-once-using-git-worktrees-57759e001d7a)
- [Multi-Agent Coding Workspace (Augment Code)](https://www.augmentcode.com/guides/how-to-run-a-multi-agent-coding-workspace)
- [Git Worktrees + AI Agents (Nx Blog)](https://nx.dev/blog/git-worktrees-ai-agents)
- [Git Worktrees + Neon Branching](https://neon.com/guides/git-worktrees-neon-branching)
- [Solo Developer Git Workflows](https://dasroot.net/posts/2026/03/git-workflows-solo-developers-content-creators/)
- [Agile Git Branching Strategies 2026](https://www.javacodegeeks.com/2025/11/agile-git-branching-strategies-in-2026.html)
- [Doc 44 — Agentic Development Workflows](../044-agentic-development-workflows/) — ZAO's existing agent workflow patterns
- [Doc 67 — Paperclip AI Agent Company](../067-paperclip-ai-agent-company/) — ZAO's Paperclip deployment
