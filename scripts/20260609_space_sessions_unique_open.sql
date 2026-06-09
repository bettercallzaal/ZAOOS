-- space_sessions: one open session per (fid, room_id)
--
-- Belt-and-suspenders behind the app-level dedup in src/lib/spaces/sessionsDb.ts
-- (startSession closes any open row before inserting). This adds a DB-level
-- guarantee so no path — a future caller, a race, a manual insert — can leave a
-- user with two simultaneously-open rows in the same room. Open rows are the
-- ones still counting toward "live"; duplicates corrupt the leaderboard and the
-- participant counts.
--
-- A PARTIAL unique index (WHERE left_at IS NULL) constrains only OPEN rows, so a
-- user can still have many CLOSED rows per room (their full history) — only one
-- may be open at a time.
--
-- Safe to run once in production. Idempotent. The pre-step closes any existing
-- duplicate open rows first (keeping the most recent per fid+room) so the unique
-- index can be created without a constraint violation on legacy data.

-- 1. Close stale duplicate open rows, keeping the most recent open row per
--    (fid, room_id). Older opens are settled with a duration from their own
--    joined_at so they still count (just not double).
WITH ranked AS (
  SELECT
    id,
    joined_at,
    row_number() OVER (PARTITION BY fid, room_id ORDER BY joined_at DESC) AS rn
  FROM space_sessions
  WHERE left_at IS NULL
)
UPDATE space_sessions s
SET
  left_at = now(),
  duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - s.joined_at))::int)
FROM ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- 2. Enforce the invariant going forward.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_space_sessions_open_per_room
  ON space_sessions (fid, room_id)
  WHERE left_at IS NULL;
