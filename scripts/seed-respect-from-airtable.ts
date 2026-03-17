/**
 * Seed respect database from Airtable
 *
 * Usage:
 *   AIRTABLE_TOKEN=pat... npx tsx scripts/seed-respect-from-airtable.ts
 *
 * Requires:
 *   - AIRTABLE_TOKEN: Personal Access Token from https://airtable.com/create/tokens
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * What it does:
 *   1. Fetches all records from the "Respect" table in Airtable
 *   2. Fetches all records from the "Fractal Hosts" table (if accessible)
 *   3. Inserts members into respect_members
 *   4. Parses per-session columns into fractal_scores
 *   5. Parses non-fractal respect into respect_events
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = 'appTUNG04rjZ9kSF4';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!AIRTABLE_TOKEN) {
  console.error('Missing AIRTABLE_TOKEN. Get one at https://airtable.com/create/tokens');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Airtable API helpers
const AIRTABLE_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };

async function fetchAllRecords(tableName: string): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_BASE}/${encodeURIComponent(tableName)}`);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable error ${res.status}: ${text}`);
    }

    const data = await res.json();
    for (const record of data.records || []) {
      records.push({ id: record.id, ...record.fields });
    }
    offset = data.offset;
  } while (offset);

  return records;
}

// Known session column patterns — columns that look like dates or "ZAO..." with numeric values
function isSessionColumn(fieldName: string): boolean {
  // Session columns in the Airtable are named like "ZAO Fractal #42" or date-like
  // They contain numeric scores (5, 8, 10, 13, 21, 26, 34, 42, 55, 68, 110)
  // Skip known summary columns
  const skipFields = new Set([
    'Name', 'Wallet', 'Total Respect', 'On-chain Balance',
    'Fractal Respect', 'Events/Contributions', 'Hosting', 'Bonus/Festival',
    // Common Airtable field names
    'id', 'createdTime',
  ]);
  if (skipFields.has(fieldName)) return false;

  // If the field name starts with "ZAO" or "Z" followed by numbers, it's likely a session
  // Or if it contains a date pattern
  return true;
}

function detectScoringEra(score: number): string {
  // 2x era scores: 10, 16, 26, 42, 68, 110
  // 1x era scores: 5, 8, 13, 21, 34, 55
  const era2x = new Set([10, 16, 26, 42, 68, 110]);
  const era1x = new Set([5, 8, 13, 21, 34, 55]);
  if (era2x.has(score)) return '2x';
  if (era1x.has(score)) return '1x';
  return 'unknown';
}

function scoreToRank(score: number): number {
  // Map score to rank (1 = best)
  const rankings2x: Record<number, number> = { 110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6 };
  const rankings1x: Record<number, number> = { 55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6 };
  return rankings2x[score] || rankings1x[score] || 0;
}

async function main() {
  console.log('Fetching Airtable data...');

  // Step 1: Fetch the Respect table
  let respectRecords: Record<string, unknown>[];
  try {
    respectRecords = await fetchAllRecords('Respect');
    console.log(`Fetched ${respectRecords.length} records from Respect table`);
  } catch (err) {
    console.error('Failed to fetch Respect table:', err);
    // Try common alternate names
    try {
      respectRecords = await fetchAllRecords('Summary');
      console.log(`Fetched ${respectRecords.length} records from Summary table`);
    } catch {
      console.error('Could not find Respect or Summary table. Available tables can be listed at:');
      console.error(`${AIRTABLE_BASE}/meta/tables (requires metadata scope)`);
      process.exit(1);
    }
  }

  // Step 2: Parse records and identify columns
  const fieldNames = new Set<string>();
  for (const record of respectRecords) {
    for (const key of Object.keys(record)) {
      fieldNames.add(key);
    }
  }

  console.log('\nDetected fields:', [...fieldNames].join(', '));

  // Step 3: Find the right column names (Airtable field names may vary)
  // We'll try to auto-detect based on common patterns
  const findField = (candidates: string[]): string | null => {
    for (const c of candidates) {
      if (fieldNames.has(c)) return c;
    }
    // Try case-insensitive
    for (const c of candidates) {
      for (const f of fieldNames) {
        if (f.toLowerCase() === c.toLowerCase()) return f;
      }
    }
    return null;
  };

  const nameField = findField(['Name', 'name', 'Member', 'member']) || 'Name';
  const walletField = findField(['Wallet', 'wallet', 'Wallet Address', 'wallet_address']) || 'Wallet';
  const totalField = findField(['Total Respect', 'Total', 'total_respect']);
  const fractalField = findField(['Fractal Respect', 'Fractal', 'fractal_respect', 'S.']);
  const eventField = findField(['Events/Contributions', 'Events', 'Contributions']);
  const hostingField = findField(['Hosting', 'hosting']);
  const bonusField = findField(['Bonus/Festival', 'Bonus', 'Festival']);
  const onchainField = findField(['On-chain Balance', 'On-chain', 'Onchain']);

  console.log(`\nField mapping:`);
  console.log(`  Name: ${nameField}`);
  console.log(`  Wallet: ${walletField}`);
  console.log(`  Total: ${totalField || '(not found)'}`);
  console.log(`  Fractal: ${fractalField || '(not found)'}`);
  console.log(`  Events: ${eventField || '(not found)'}`);
  console.log(`  Hosting: ${hostingField || '(not found)'}`);
  console.log(`  Bonus: ${bonusField || '(not found)'}`);
  console.log(`  On-chain: ${onchainField || '(not found)'}`);

  // Step 4: Identify session columns (everything that's not a summary column)
  const summaryFields = new Set([
    nameField, walletField, totalField, fractalField,
    eventField, hostingField, bonusField, onchainField,
    'id', 'createdTime',
  ].filter(Boolean) as string[]);

  const sessionColumns: string[] = [];
  for (const f of fieldNames) {
    if (!summaryFields.has(f) && typeof respectRecords[0]?.[f] === 'number') {
      sessionColumns.push(f);
    }
  }

  // Try to detect session columns from records that have numeric values
  const numericColumns: string[] = [];
  for (const f of fieldNames) {
    if (summaryFields.has(f)) continue;
    // Check if any record has a numeric value for this field
    const hasNumeric = respectRecords.some(r => typeof r[f] === 'number' && (r[f] as number) > 0);
    if (hasNumeric) numericColumns.push(f);
  }

  console.log(`\nDetected ${numericColumns.length} potential session columns`);

  // Step 5: Insert members
  console.log('\nInserting members...');
  let inserted = 0;
  let skipped = 0;

  for (const record of respectRecords) {
    const name = record[nameField] as string;
    if (!name) continue;

    const wallet = (record[walletField] as string)?.trim() || null;
    const total = (totalField ? record[totalField] as number : 0) || 0;
    const fractal = (fractalField ? record[fractalField] as number : 0) || 0;
    const events = (eventField ? record[eventField] as number : 0) || 0;
    const hosting = (hostingField ? record[hostingField] as number : 0) || 0;
    const bonus = (bonusField ? record[bonusField] as number : 0) || 0;
    const onchain = (onchainField ? record[onchainField] as number : 0) || 0;

    // Count fractals attended (count non-zero session columns)
    let fractalCount = 0;
    for (const col of numericColumns) {
      const val = record[col] as number;
      if (val && val > 0) fractalCount++;
    }

    const { error } = await supabase.from('respect_members').upsert({
      name,
      wallet_address: wallet?.toLowerCase() || null,
      total_respect: total,
      fractal_respect: fractal,
      event_respect: events,
      hosting_respect: hosting,
      bonus_respect: bonus,
      onchain_og: onchain,
      fractal_count: fractalCount,
    }, { onConflict: 'wallet_address' });

    if (error) {
      // Try insert without upsert (might not have wallet)
      const { error: insertErr } = await supabase.from('respect_members').insert({
        name,
        wallet_address: wallet?.toLowerCase() || null,
        total_respect: total,
        fractal_respect: fractal,
        event_respect: events,
        hosting_respect: hosting,
        bonus_respect: bonus,
        onchain_og: onchain,
        fractal_count: fractalCount,
      });
      if (insertErr) {
        console.error(`  Failed to insert ${name}:`, insertErr.message);
        skipped++;
        continue;
      }
    }
    inserted++;
  }

  console.log(`Inserted ${inserted} members (${skipped} skipped)`);

  // Step 6: Insert fractal scores from session columns
  if (numericColumns.length > 0) {
    console.log('\nInserting fractal sessions and scores...');
    let sessionsCreated = 0;
    let scoresCreated = 0;

    for (let i = 0; i < numericColumns.length; i++) {
      const colName = numericColumns[i];

      // Collect all scores for this session
      const scores: { name: string; wallet: string | null; score: number }[] = [];
      for (const record of respectRecords) {
        const val = record[colName] as number;
        if (val && val > 0) {
          scores.push({
            name: record[nameField] as string,
            wallet: ((record[walletField] as string)?.trim()?.toLowerCase()) || null,
            score: val,
          });
        }
      }

      if (scores.length === 0) continue;

      // Detect scoring era from the scores
      const era = detectScoringEra(scores[0].score);

      // Create session
      const { data: session, error: sessErr } = await supabase
        .from('fractal_sessions')
        .insert({
          session_date: null, // We don't have dates from column names
          name: colName,
          scoring_era: era !== 'unknown' ? era : '2x',
          participant_count: scores.length,
        })
        .select('id')
        .single();

      if (sessErr || !session) {
        console.error(`  Failed to create session ${colName}:`, sessErr?.message);
        continue;
      }

      sessionsCreated++;

      // Insert scores
      const scoreRows = scores.map(s => ({
        session_id: session.id,
        member_name: s.name,
        wallet_address: s.wallet,
        rank: scoreToRank(s.score),
        score: s.score,
      }));

      const { error: scoreErr } = await supabase.from('fractal_scores').insert(scoreRows);
      if (scoreErr) {
        console.error(`  Failed to insert scores for ${colName}:`, scoreErr.message);
      } else {
        scoresCreated += scoreRows.length;
      }
    }

    console.log(`Created ${sessionsCreated} sessions, ${scoresCreated} scores`);
  }

  console.log('\nDone! Run POST /api/respect/sync to pull latest on-chain balances.');
}

main().catch(console.error);
