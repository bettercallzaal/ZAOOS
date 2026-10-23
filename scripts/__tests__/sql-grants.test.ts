import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// .claude/rules/sql-migrations.md (card 10559): a migration that creates a
// public table grants it explicitly in the same file. From 2026-10-30 Supabase
// gives new public tables no default grants, so an ungranted table returns 42501
// through the Data API. This is a ratchet: BASELINE holds the 84 SQL files
// that already create a table with no grant naming it (measured 2026-10-23 on
// main e868649); they keep their old default grants. Every other file must
// grant each public table it creates. The list may only shrink.

const ROOT = process.cwd();
const DIRS = ['scripts', 'supabase'];
const CREATE = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?(\w+)"?\.)?"?([a-z_][a-z0-9_]*)"?/gi;
const GRANT = /grant\s+[^;]*?\bon\s+(?:table\s+)?(?:"?public"?\.)?"?([a-z_][a-z0-9_]*)"?/gi;

const BASELINE = new Set([
  'scripts/1410-agent-control-plane.sql',
  'scripts/1411-executive-cortex-v1.sql',
  'scripts/20260529_crm.sql',
  'scripts/20260616_unlock_events.sql',
  'scripts/20260618_scrape_cache.sql',
  'scripts/20261009-farcaster-signer-provenance.sql',
  'scripts/2031-app-errors-remediation-rail.sql',
  'scripts/2033-agent-instances-liveness.sql',
  'scripts/2034-repo-improvements-scout.sql',
  'scripts/2148-transactional-outbox.sql',
  'scripts/archive/2026-04-25-cleanup/create-user-app-config.sql',
  'scripts/archive/2026-04-25-cleanup/seed-agent-config.sql',
  'scripts/archive/2026-04-25-cleanup/stock-audit-log-migration.sql',
  'scripts/archive/2026-04-25-cleanup/stock-bot-group-migration.sql',
  'scripts/archive/2026-04-25-cleanup/stock-bot-v15-migration.sql',
  'scripts/archive/2026-04-25-cleanup/stock-circles-v1-migration.sql',
  'scripts/archive/2026-04-25-cleanup/stock-onepagers-migration.sql',
  'scripts/archive/2026-04-25-cleanup/stock-schema.sql',
  'scripts/archive/2026-04-25-cleanup/v1-agent-migration.sql',
  'scripts/archive/add-zao-subname-columns.sql',
  'scripts/archive/migrations-applied/add-poll-config.sql',
  'scripts/archive/migrations-applied/add-song-comments.sql',
  'scripts/archive/migrations-applied/add-song-likes.sql',
  'scripts/archive/migrations-applied/add-song-reactions.sql',
  'scripts/archive/migrations-applied/create-moderation-log.sql',
  'scripts/archive/migrations-applied/create-music-library.sql',
  'scripts/archive/migrations-applied/create-respect-transfers.sql',
  'scripts/archive/migrations-run/all-pending-migrations.sql',
  'scripts/archive/migrations-run/arweave-assets.sql',
  'scripts/archive/migrations-run/create-engagement-metrics.sql',
  'scripts/archive/migrations-run/library-tables.sql',
  'scripts/archive/migrations-run/overlay-now-playing.sql',
  'scripts/archive/old/add-channel-casts-table.sql',
  'scripts/archive/old/add-notification-tokens-table.sql',
  'scripts/archive/old/community-profiles-table.sql',
  'scripts/archive/old/create-auth-nonces.sql',
  'scripts/archive/old/create-bluesky-tables.sql',
  'scripts/archive/old/create-community-issues.sql',
  'scripts/archive/old/create-fractal-live-tables.sql',
  'scripts/archive/old/create-notifications.sql',
  'scripts/archive/old/create-proposals.sql',
  'scripts/archive/old/create-respect-tables.sql',
  'scripts/archive/old/create-security-audit-log.sql',
  'scripts/archive/old/create-streaks-tables.sql',
  'scripts/archive/old/create-track-of-day.sql',
  'scripts/archive/old/create-users-table.sql',
  'scripts/archive/old/setup-database.sql',
  'scripts/archive/old/wavewarz-tables.sql',
  'scripts/archive/setup-broadcast-targets.sql',
  'scripts/archive/setup-connected-platforms.sql',
  'scripts/archive/setup-push-subscriptions.sql',
  'scripts/archive/setup-rooms-tables.sql',
  'scripts/archive/sql-run/collaborative-playlists.sql',
  'scripts/archive/sql-run/follower-snapshots.sql',
  'scripts/archive/sql-run/listening-parties.sql',
  'scripts/archive/sql-run/room-experience.sql',
  'scripts/archive/sql-run/scheduled-rooms.sql',
  'scripts/archive/sql-run/space-sessions.sql',
  'scripts/archive/sql-run/tips.sql',
  'scripts/archive/supabase-applied/20260313_scheduled_casts.sql',
  'scripts/archive/supabase-applied/20260313_song_submissions.sql',
  'scripts/archive/supabase-applied/20260328_song_requests.sql',
  'scripts/archive/supabase-applied/20260329000000_create_memory_tables.sql',
  'scripts/archive/supabase-applied/20260404_fishbowlz.sql',
  'scripts/archive/supabase-applied/20260405_fishbowl_chat.sql',
  'scripts/archive/supabase-applied/20260405_fishbowl_users.sql',
  'scripts/archive/supabase-applied/20260406_agent_events.sql',
  'scripts/archive/supabase-applied/20260406_contacts.sql',
  'scripts/archive/supabase-applied/20260407_build_events.sql',
  'scripts/archive/supabase-applied/20260408_fishbowl_room_gating.sql',
  'scripts/archive/supabase-applied/20260410_stock_team_dashboard.sql',
  'scripts/juke-spaces-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-audit-log-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-bot-group-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-bot-v15-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-circles-v1-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-onepagers-migration.sql',
  'scripts/stock-archive/2026-04-25-applied/stock-schema.sql',
  'scripts/stock-archive/stock-team-artists-timeline.sql',
  'scripts/stock-archive/stock-team-setup.sql',
  'scripts/stock-archive/stock-team-sponsors.sql',
  'scripts/stock-archive/stock-team-suggestions.sql',
  'scripts/stock-archive/stock-team-wave3.sql',
  'scripts/zabal-rollup-migration.sql',
]);

function sqlFiles(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of names) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...sqlFiles(p));
    else if (name.endsWith('.sql')) out.push(p);
  }
  return out;
}

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

function ungranted(sql: string): string[] {
  const s = stripComments(sql);
  const created = new Set<string>();
  for (const m of s.matchAll(CREATE)) {
    if ((m[1] ?? 'public').toLowerCase() === 'public') created.add(m[2].toLowerCase());
  }
  const granted = new Set([...s.matchAll(GRANT)].map((m) => m[1].toLowerCase()));
  return [...created].filter((t) => !granted.has(t)).sort();
}

const files: Record<string, string> = {};
for (const d of DIRS) for (const p of sqlFiles(join(ROOT, d))) files[relative(ROOT, p)] = readFileSync(p, 'utf8');
const breaking = Object.keys(files).filter((f) => ungranted(files[f]).length > 0).sort();

describe('SQL migrations grant every public table they create', () => {
  it('the scan reads the real SQL tree, so an empty walk cannot pass', () => {
    expect(Object.keys(files).length).toBeGreaterThan(100);
  });

  it('no file outside the baseline creates a public table without granting it', () => {
    expect(breaking.filter((f) => !BASELINE.has(f))).toEqual([]);
  });

  it('the baseline only shrinks: each entry still exists and still lacks a grant', () => {
    expect([...BASELINE].filter((f) => !breaking.includes(f))).toEqual([]);
  });

  it('red control: an ungranted table is caught; a granted one, a comment and another schema are not', () => {
    expect(ungranted('create table public.foo (id int);')).toEqual(['foo']);
    expect(ungranted('create table if not exists bar (id int);')).toEqual(['bar']);
    expect(ungranted('create table public.foo (id int);\ngrant select on public.foo to service_role;')).toEqual([]);
    expect(ungranted('create table foo (id int); grant all on table foo to authenticated;')).toEqual([]);
    expect(ungranted('-- create table public.foo (id int);')).toEqual([]);
    expect(ungranted('/* create table if not exists only. */')).toEqual([]);
    expect(ungranted('create table private.foo (id int);')).toEqual([]);
  });
});
