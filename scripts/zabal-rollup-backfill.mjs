#!/usr/bin/env node
// ============================================================
// ZABAL Live Hub -> ZAO OS Supabase backfill
// Date: 2026-05-18
// Spec: docs/superpowers/specs/2026-05-17-zabal-zaoos-rollup-design.md
//
// Reads from zabal.art Supabase (source) and writes into ZAO OS
// Supabase (destination) with table renames + mode mapping.
//
// Mode mapping (old -> new):
//   studio  -> music
//   market  -> governance
//   social  -> events
//   battle  -> build
//
// (Mapping is best-effort. Reason: original modes were stream-direction
// focused; new modes match ZAO OS pillars. Override per row in the
// MODE_MAP constant if Zaal wants different semantics.)
//
// Idempotent via upsert on PK. Re-runnable.
//
// Env (required):
//   ZABAL_SOURCE_SUPABASE_URL          (e.g. https://abc.supabase.co)
//   ZABAL_SOURCE_SUPABASE_SERVICE_KEY  (service_role key for source)
//   SUPABASE_URL                       (ZAO OS Supabase URL)
//   SUPABASE_SERVICE_ROLE_KEY          (ZAO OS service_role key)
//
// Usage:
//   node scripts/zabal-rollup-backfill.mjs                  # dry-run, prints counts
//   node scripts/zabal-rollup-backfill.mjs --commit         # actually writes
//   node scripts/zabal-rollup-backfill.mjs --commit --only=votes,leaderboard_scores
//   node scripts/zabal-rollup-backfill.mjs --verify         # row-count parity after commit
// ============================================================

import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const ARGV = new Set(process.argv.slice(2));
const COMMIT = ARGV.has('--commit');
const VERIFY = ARGV.has('--verify');
const ONLY_FLAG = [...ARGV].find((a) => a.startsWith('--only='));
const ONLY = ONLY_FLAG ? new Set(ONLY_FLAG.slice('--only='.length).split(',')) : null;

const MODE_MAP = {
  studio: 'music',
  market: 'governance',
  social: 'events',
  battle: 'build',
};

const PAGE_SIZE = 500;

// ----------- env validation -----------

function envOr(name, fallbackName) {
  const v = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!v) {
    console.error(`Missing env var: ${name}${fallbackName ? ` (or ${fallbackName})` : ''}`);
    process.exit(1);
  }
  return v;
}

const SRC_URL = envOr('ZABAL_SOURCE_SUPABASE_URL');
const SRC_KEY = envOr('ZABAL_SOURCE_SUPABASE_SERVICE_KEY');
const DST_URL = envOr('SUPABASE_URL');
const DST_KEY = envOr('SUPABASE_SERVICE_ROLE_KEY');

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } });

// ----------- pagination helper -----------

async function* paginate(client, table, orderColumn = 'id') {
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Read ${table}: ${error.message}`);
    if (!data || data.length === 0) return;
    yield data;
    if (data.length < PAGE_SIZE) return;
    from += PAGE_SIZE;
  }
}

// ----------- migration plan -----------

const MIGRATIONS = [
  {
    name: 'votes',
    src: 'votes',
    dst: 'zabal_votes',
    transform: (row) => {
      const mapped = MODE_MAP[String(row.mode).toLowerCase()] || row.mode;
      if (!['music', 'governance', 'events', 'build'].includes(mapped)) {
        return null; // skip rows we can't map (logged)
      }
      return {
        id: row.id,
        fid: row.fid,
        username: row.username,
        mode: mapped,
        vote_power: row.vote_power ?? 1,
        vote_date: row.vote_date,
        voted_at: row.voted_at,
      };
    },
    conflict: 'id',
  },
  {
    name: 'vote_power_cache',
    src: 'vote_power_cache',
    dst: 'zabal_vote_power_cache',
    orderColumn: 'fid',
    transform: (row) => ({
      fid: row.fid,
      username: row.username,
      vote_power: row.vote_power ?? 1,
      zao_casts: row.zao_casts ?? 0,
      neynar_score: row.neynar_score ?? 0.5,
      updated_at: row.updated_at,
    }),
    conflict: 'fid',
  },
  {
    name: 'leaderboard_scores',
    src: 'leaderboard_scores',
    dst: 'zabal_leaderboard_scores',
    orderColumn: 'fid',
    transform: (row) => ({
      fid: row.fid,
      username: row.username,
      total_votes: row.total_votes ?? 0,
      last_vote_date: row.last_vote_date,
      streak_days: row.streak_days ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
    conflict: 'fid',
  },
  {
    name: 'vote_comments',
    src: 'vote_comments',
    dst: 'zabal_vote_comments',
    transform: (row) => {
      const mapped = MODE_MAP[String(row.vote_mode).toLowerCase()] || row.vote_mode;
      if (!['music', 'governance', 'events', 'build'].includes(mapped)) return null;
      return {
        id: row.id,
        fid: row.fid,
        username: row.username,
        comment: row.comment,
        vote_mode: mapped,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    },
    conflict: 'id',
  },
  {
    name: 'custom_leaderboards',
    src: 'custom_leaderboards',
    dst: 'zabal_custom_leaderboards',
    transform: (row) => row,
    conflict: 'id',
  },
  {
    name: 'custom_leaderboard_entries',
    src: 'custom_leaderboard_entries',
    dst: 'zabal_custom_leaderboard_entries',
    transform: (row) => row,
    conflict: 'id',
  },
];

// ----------- run one migration -----------

async function runOne(m) {
  let read = 0;
  let written = 0;
  let skipped = 0;
  let errors = 0;

  for await (const page of paginate(src, m.src, m.orderColumn || 'id')) {
    read += page.length;
    const rows = page.map(m.transform).filter((r) => {
      if (r === null) {
        skipped++;
        return false;
      }
      return true;
    });
    if (rows.length === 0) continue;
    if (!COMMIT) continue;

    const { error } = await dst
      .from(m.dst)
      .upsert(rows, { onConflict: m.conflict, ignoreDuplicates: false });
    if (error) {
      errors++;
      console.error(`  [${m.name}] upsert error: ${error.message}`);
      continue;
    }
    written += rows.length;
  }

  console.log(
    `  [${m.name}] read=${read} written=${written} skipped=${skipped} errors=${errors}`,
  );
  return { read, written, skipped, errors };
}

// ----------- verify -----------

async function verifyCounts() {
  console.log('\nVerify row counts (source vs destination):');
  for (const m of MIGRATIONS) {
    if (ONLY && !ONLY.has(m.name)) continue;
    const { count: srcCount, error: srcErr } = await src
      .from(m.src)
      .select('*', { count: 'exact', head: true });
    const { count: dstCount, error: dstErr } = await dst
      .from(m.dst)
      .select('*', { count: 'exact', head: true });
    const srcN = srcErr ? `ERR:${srcErr.message}` : srcCount;
    const dstN = dstErr ? `ERR:${dstErr.message}` : dstCount;
    const ok = srcCount === dstCount ? 'OK' : 'DRIFT';
    console.log(`  [${m.name}] src=${srcN} dst=${dstN} ${ok}`);
  }
}

// ----------- main -----------

async function main() {
  console.log(`ZABAL rollup backfill - mode=${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
  if (ONLY) console.log(`Only: ${[...ONLY].join(', ')}`);

  if (VERIFY) {
    await verifyCounts();
    return;
  }

  for (const m of MIGRATIONS) {
    if (ONLY && !ONLY.has(m.name)) continue;
    console.log(`\n-> ${m.name} (${m.src} -> ${m.dst})`);
    await runOne(m);
  }

  if (COMMIT) {
    console.log('\nCommit complete. Re-run with --verify for row-count parity check.');
  } else {
    console.log('\nDry-run complete. Add --commit to actually write.');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
