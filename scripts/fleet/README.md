# Fleet board integration

Making the cowork board the automated hub every loop writes to. This is the
first slice of the "board integration keystone" - the shared write helper - plus
the design for the rest of the stack.

## `zao-board` - the shared board-write helper (shipped here)

Every loop calls one helper instead of hand-rolling raw Supabase inserts (which
was inconsistent and error-prone). The board is the `tasks` table; creds are read
from the same env-file ladder as the other fleet tools (never inlined).

```
zao-board add "<title>" [--priority P2] [--source <legacy_source>] [--project zaodevz] [--notes "..."] [--dedup]
zao-board start <id>
zao-board done  <id> [--pr <url>]
zao-board list  [--source <legacy_source>] [--status todo]
```

The lifecycle a loop uses, so every item auto-becomes an `in_progress -> done`
row with a PR link:

```bash
ID=$(python3 scripts/fleet/zao-board.py add "Fix the deadline parser" --source my-loop --priority P2 --dedup)
python3 scripts/fleet/zao-board.py start "$ID"
# ... ship the PR ...
python3 scripts/fleet/zao-board.py done "$ID" --pr https://github.com/org/repo/pull/42
```

`--dedup` skips creating a row when an OPEN one with the same
`(title, legacy_source)` already exists - a first step toward replay-safety
(re-running a loop must not spawn duplicate rows; see the durable-execution
alpha-scan unlock).

Verify with no network: `python3 scripts/fleet/zao-board.py --selftest` (6/6 -
covers payload building, validation, the done-patch PR append, and the dedup
filter).

**Install (follow-up):** symlink to `~/bin/zao-board` so loops call it by name,
the way they call the status helper. Kept as a repo script here so it ships via PR.

## The rest of the stack (design - next slices)

These complete the keystone. Sketched here so the shape is agreed before build.

### 2. Auto-triage (nightly)
A scheduled pass over the board that: **reranks** (urgency x importance x
deadline), **dedups** (merge rows with the same title/source, preferring the
open one), **closes-shipped** (mark `done` any task whose PR link is merged -
query the PR state via `gh`), and emits a **true top-10** the morning brief and
the fleet page read. Pure functions (rank score, dedup key, shipped-detection)
unit-tested like `zao-board`; the scheduler is the only side-effecting part.

### 3. ZOE DM intent-router (extends the shipped DM router)
A DM to ZOE classified as **research / task / idea** auto-creates a board row via
`zao-board`, with a guessed `legacy_source` + priority + theme tags, and replies
with the row id. Builds on the existing DM intent-router (already shipped) by
routing its classification straight into a board write instead of a capture note.
Runtime bot code -> its own PR, human-reviewed.

### 4. One fleet + board page
`fleet_status` (from the supervisor) + the board top-10 on a single page.
**Design-only here:** the intended host is zaalcaster, which this loop must not
touch (owned separately). Shape: a read-only page polling the `fleet_status`
table (session/state/last_line) and the board `tasks` (top-10 by the triage
rank), auto-refreshing. Whoever owns zaalcaster implements it; the data
contracts (both tables) already exist.

## Why the keystone is the helper

The other three all *write to the board* - triage closes/merges rows, the
intent-router creates them, the page reads them. Standardizing the write path
first (validation, dedup, consistent `done`-with-PR shape) means the rest build
on one contract instead of three divergent raw-insert styles. That is why this
slice ships first.
