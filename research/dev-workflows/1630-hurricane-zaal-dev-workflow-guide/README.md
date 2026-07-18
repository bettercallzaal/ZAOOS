# 1630 — Hurricane + Zaal: Dev Collaboration Workflow Guide

**Type:** OPERATIONS-GUIDE  
**Topic:** Dev-Workflows  
**Status:** ACTIVE — Reference for how Zaal and Hurricane work together on ZAO code repos. Hurricane is the build operations AI agent; Zaal owns final merge/deploy approval. This doc is the "how we work" guide so that every session is efficient and nothing falls through the cracks.

---

## Repositories in Scope

| Repo | Purpose | Hurricane access |
|---|---|---|
| `bettercallzaal/wwtracker` | WaveWarZ stats API + wavewarz.info backend | Full (PRs, code changes) |
| `bettercallzaal/CoCConcertZ` | COC live show platform | Full |
| `bettercallzaal/ZAOOS` | Research docs repository | Full |
| `ZAODEVZ/ZAOstock` | ZAOstock festival site | Full |
| `bettercallzaal/zao-os` | ZAO OS main application (Next.js) | Full |
| Private repos (wavewarz.com backend) | Production game engine | READ: NO; WRITE: NO |

**HARD RULE:** Hurricane never touches private repos that haven't been explicitly shared. Always check visibility before reading any repo.

---

## Standard Workflow: Feature / Bug Fix

### Zaal initiates with a task description

Zaal tells Hurricane what to build. Examples:
- "Build the `zao_artists` Supabase table per doc 1604"
- "Add smoke test for /api/public/stats to wwtracker"
- "Fix the speaker-log PR to pass all 138 tests"

**What Hurricane needs:**
1. The task (what to build)
2. Relevant doc number(s) if a spec exists
3. Target repo
4. Any blocked gates ("don't deploy, just open a PR")

### Hurricane scopes the work first (new feature only)

For non-trivial builds, Hurricane outputs a **scope block** before coding:
```
SCOPE: [task name]
Repo: [repo]
Files touched: [list]
Estimated PRs: [N]
Estimated time: [N hours]
Gates: [any DECISION NEEDED items]
Proceed? (reply OK or edit scope)
```

Zaal replies OK → Hurricane codes. No reply after 5 min → Hurricane proceeds (treat as OK for pre-scoped items).

### Hurricane creates a branch and opens a PR

**Branch naming:** `feat/<feature-name>` or `fix/<issue>` or `docs/<doc-number>-<name>`  
**PR title format:** `feat: [short description]` / `fix: [short description]`  
**PR body:** Always includes:
- What this PR does (2-3 bullets)
- How to test it locally
- Any migration steps if Supabase is involved
- Related doc number(s)

### Zaal reviews and merges

Zaal reviews the PR:
- If CI passes and code looks right → merge
- If changes needed → comment on PR, Hurricane addresses in a follow-up commit on the same branch
- If blocked on external dependency → PR stays open, Hurricane adds a "BLOCKED: [reason]" comment

**Zaal never needs to:**
- Set up local branches (Hurricane does this)
- Write migration SQL (Hurricane writes and includes in the PR)
- Manually trigger tests (CI runs automatically)

---

## PR Conventions

### Commit messages

```
feat: add zao_artists Supabase table with initial schema
fix: correct SQL generated column syntax for completion_pct
docs: add ZABAL S2 curriculum spec (1626)
chore: update README with 1627 row
test: smoke test for /api/public/stats endpoint
```

### PR size

- **1 PR per logical unit** — avoid PRs that touch 10 unrelated files
- **Test + code in the same PR** — Hurricane includes tests with feature code
- **Migrations in a separate PR** from feature code (unless trivially small)

### Labels

Hurricane applies labels when possible:
- `ready-for-review` — PR is done, waiting for Zaal
- `blocked` — depends on external action (Zaal, deploy, third-party)
- `migration` — touches Supabase schema

---

## Testing Protocol

### WWtracker: before any PR merge

```bash
# Run from ~/wwtracker
npm run test           # full test suite (138 tests as of Jul 2026)
npm run test:smoke     # smoke test /api/public/stats endpoint
```

Hurricane always runs tests before opening a PR. If tests fail, Hurricane fixes before opening.

### CoCConcertZ

Hurricane runs whatever test suite exists. If no tests exist, Hurricane notes in the PR: "No test suite currently — manual test: [instructions]."

### ZAOOS docs

No code tests — just lint check via `npm run lint` if configured. Hurricane confirms the README row matches the doc content before committing.

### Database migrations

```sql
-- Hurricane always includes a rollback comment
-- Rollback: DROP TABLE IF EXISTS zao_artists;
CREATE TABLE zao_artists (...);
```

Hurricane never runs migrations in production without Zaal's explicit "run it" approval.

---

## The "Just Open a PR" Pattern

For any work that touches production (Vercel deploy, Supabase production migration, external API key usage), Hurricane defaults to "just open a PR" and stops.

**Hurricane says:**
```
PR opened: [link]
⚠️ DECISION NEEDED: This PR [touches production Supabase / deploys to Vercel / uses [API key]].
Action needed from Zaal: [specific next step]
```

Zaal takes the action. Hurricane does not auto-deploy.

---

## Hurricane + Zaal Communication Channels

| Channel | What it's for |
|---|---|
| **Telegram** | Hurricane sends build status updates ("PR #N opened", "PR #N tests failing — details below") |
| **GitHub PR comments** | Technical discussion, code review, merge decisions |
| **ZAOOS research docs** | Spec documents (Hurricane reads these for build instructions) |

Hurricane does NOT initiate work without a task from Zaal. If Hurricane finishes a task and has ideas for follow-up, it says "what's next?" not "I'll start on X."

---

## Common Task Patterns

### Supabase table build

1. Zaal: "Hurricane, build [table] per doc [N]"
2. Hurricane: reads the doc, writes migration SQL, opens PR with `[migration]` label
3. Zaal: reviews migration, approves
4. Hurricane: Zaal runs `supabase db push` or Hurricane runs it if access is confirmed
5. Hurricane: confirms via Telegram: "Table [name] is live."

### New API endpoint in wwtracker

1. Zaal: "Add endpoint [spec]"
2. Hurricane: writes handler + test + updates API docs
3. Hurricane: runs `npm test`, opens PR
4. CI passes → Zaal merges
5. Vercel auto-deploys on merge to main

### ZOE cron alert addition

1. Zaal: "Add ZOE alert: [description] on [date]"
2. Hurricane: adds cron entry + inserts `zoe_alert_log` dedup check
3. Opens PR with test (mock cron trigger)
4. Zaal merges → ZOE alert is live

### ZAOOS research doc

1. Loop creates branch `docs/[number]-[name]`
2. Writes README in `research/[topic]/[number]-[name]/`
3. Updates topic README
4. Commits + pushes + opens PR
5. Auto-merges within minutes

---

## Build Checklist: Pre-ZAOstock (Aug 15 → Sep 30)

Ordered by hurricane build priority:

| Date | Build | Repo | Gate |
|---|---|---|---|
| Aug 15 | Smoke test `/api/public/stats` (wwtracker PR #136) | wwtracker | Zaal merges PR #136 |
| Aug 15 | Eventbrite webhook → `zaostock_2026_attendees` | wwtracker or CoCConcertZ | Zaal provides Eventbrite API key |
| Aug 22 | `zao_artists` table + initial population | wwtracker | Zaal approves migration |
| Sep 1 | ZOE Eventbrite sync job + welcome sequence emails | wwtracker | ZABAL_TG_CHAT_ID + email credentials |
| Sep 15 | Arm ZOE Africa Battle Week cast schedule | wwtracker | Farcaster casts pre-drafted + approved by Zaal |
| Sep 30 | Arm ZOE ZAOstock Oct 3 automations (test run Sep 30 8PM) | wwtracker | All event times confirmed in doc 1597 |

---

## Related Docs

- 1624 — ZAO Agent Fleet Reference (Hurricane's role + blast radius rules)
- 1625 — ZAO Supabase Schema Reference (Hurricane builds these tables)
- 1615 — ZOE Architecture and Handoff Spec (ZOE build targets Hurricane executes)
- 1605 — WaveWarZ Estate Audit (canonical list of repos Hurricane works in)
