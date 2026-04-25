-- ZAOstock bot: switch to public mode (telegram username auth)
-- Adds telegram_id + telegram_username columns, indexes, and a convenience view.
-- Idempotent. Paste into Supabase SQL Editor.

BEGIN;

ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- Store usernames lower-cased, no @ prefix.
CREATE UNIQUE INDEX IF NOT EXISTS stock_team_members_tg_id_uniq
  ON stock_team_members(telegram_id)
  WHERE telegram_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stock_team_members_tg_username_uniq
  ON stock_team_members(telegram_username)
  WHERE telegram_username IS NOT NULL;

-- Zaal's mapping (edit to match real @usernames, re-run as needed).
-- Leave lines commented if you don't have a username yet for that person.

-- UPDATE stock_team_members SET telegram_username = 'bettercallzaal' WHERE name = 'Zaal';
-- UPDATE stock_team_members SET telegram_username = 'dfreshmaker'   WHERE name = 'DFresh';
-- UPDATE stock_team_members SET telegram_username = 'dcoop'          WHERE name = 'DCoop';
-- UPDATE stock_team_members SET telegram_username = 'candyrose'      WHERE name = 'Candy';
-- UPDATE stock_team_members SET telegram_username = 'shawn'          WHERE name = 'Shawn';
-- UPDATE stock_team_members SET telegram_username = 'failoften'      WHERE name = 'FailOften';
-- UPDATE stock_team_members SET telegram_username = 'geek'           WHERE name = 'Geek';
-- UPDATE stock_team_members SET telegram_username = 'hurric4n3ike'   WHERE name = 'Hurric4n3Ike';
-- UPDATE stock_team_members SET telegram_username = 'imanafrikah'    WHERE name = 'Iman Afrikah';
-- UPDATE stock_team_members SET telegram_username = 'jake'           WHERE name = 'Jake';
-- UPDATE stock_team_members SET telegram_username = 'jango'          WHERE name = 'Jango';
-- UPDATE stock_team_members SET telegram_username = 'maceo'          WHERE name = 'Maceo';
-- UPDATE stock_team_members SET telegram_username = 'ohnahjib'       WHERE name = 'Ohnahji B';
-- UPDATE stock_team_members SET telegram_username = 'swarthyhatter'  WHERE name = 'Swarthy Hatter';
-- UPDATE stock_team_members SET telegram_username = 'craigg'         WHERE name = 'Craig G';
-- UPDATE stock_team_members SET telegram_username = 'tomfellenz'     WHERE name = 'Tom Fellenz';
-- UPDATE stock_team_members SET telegram_username = 'tylerstambaugh' WHERE name = 'Tyler Stambaugh';

COMMIT;

-- Verify:
SELECT name, role, scope, telegram_username, telegram_id
FROM stock_team_members
WHERE active IS NOT FALSE
ORDER BY telegram_username NULLS LAST, name;
