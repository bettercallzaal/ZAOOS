/**
 * Import historical fractal data from Airtable CSV exports into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-fractal-history.ts
 *   npx tsx scripts/import-fractal-history.ts --dir ./my-csvs
 *
 * Expects CSV files in the data directory (default: ./data/):
 *   - Summary-Grid view.csv      — member totals
 *   - Respect-Grid view.csv      — per-session scores (OG era, columns = sessions)
 *   - Wallet Data-Grid view.csv  — name-to-wallet mapping
 *   - awards.csv (+ awards (2).csv, etc.) — ORDAO era on-chain awards
 *   - Awards-Grid view.csv       — non-fractal respect events (introductions, hosting, etc.)
 *
 * Features:
 *   - Idempotent: uses upserts keyed on session name + member name
 *   - Handles both Fibonacci eras: 1x (5,8,13,21,34,55) and 2x (10,16,26,42,68,110)
 *   - Sets first_respect_at for members who don't have it
 *   - Logs progress throughout
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import dotenv from 'dotenv';

// ─── Configuration ───────────────────────────────────────────────────

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse --dir flag or default to ./data/
const dirFlagIndex = process.argv.indexOf('--dir');
const CSV_DIR = dirFlagIndex >= 0 && process.argv[dirFlagIndex + 1]
  ? path.resolve(process.argv[dirFlagIndex + 1])
  : path.resolve(__dirname, '../data');

// ─── Fibonacci score constants ───────────────────────────────────────

const ERA_1X_SCORES = new Set([5, 8, 13, 21, 34, 55]);
const ERA_2X_SCORES = new Set([10, 16, 26, 42, 68, 110]);

const RANK_MAP_2X: Record<number, number> = { 110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6 };
const RANK_MAP_1X: Record<number, number> = { 55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6 };

function detectEra(score: number): '1x' | '2x' | null {
  if (ERA_2X_SCORES.has(score)) return '2x';
  if (ERA_1X_SCORES.has(score)) return '1x';
  return null;
}

function scoreToRank(score: number): number {
  return RANK_MAP_2X[score] || RANK_MAP_1X[score] || 0;
}

// ─── CSV helpers ─────────────────────────────────────────────────────

function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<T>(content, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0) {
    console.warn(`  CSV parse warnings for ${path.basename(filePath)}:`, result.errors.slice(0, 3));
  }
  return result.data;
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function findField(headers: Set<string>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.has(c)) return c;
  }
  // Case-insensitive fallback
  for (const c of candidates) {
    for (const h of headers) {
      if (h.toLowerCase() === c.toLowerCase()) return h;
    }
  }
  return null;
}

// ─── Counters ────────────────────────────────────────────────────────

const stats = {
  membersImported: 0,
  membersFailed: 0,
  sessionsImported: 0,
  sessionsDuplicate: 0,
  scoresImported: 0,
  eventsImported: 0,
  firstRespectSet: 0,
};

// ─── Step 1: Import members from Summary CSV ────────────────────────

async function importMembers() {
  console.log('\n━━━ Step 1: Import members from Summary CSV ━━━');

  const filePath = path.join(CSV_DIR, 'Summary-Grid view.csv');
  if (!fileExists(filePath)) {
    console.log('  Skipping — Summary-Grid view.csv not found at', filePath);
    return;
  }

  const rows = parseCSV<Record<string, string>>(filePath);
  const headers = new Set(Object.keys(rows[0] || {}));

  // Auto-detect field names (Airtable exports vary)
  const nameField = findField(headers, ['Name', 'name', 'Member']) || 'Name';
  const walletField = findField(headers, [
    'ETH WALLET (from Wallet Data 2)', 'ETH WALLET', 'Wallet', 'wallet_address',
  ]);
  const totalField = findField(headers, ['Total Points', 'Total Respect', 'Total']);
  const fractalField = findField(headers, ['ZRespect Sum', 'Fractal Respect', 'Fractal', 'S.']);
  const eventField = findField(headers, ['Form/Intros Sum', 'Events/Contributions', 'Events']);
  const hostingField = findField(headers, ['Fractal Host sum', 'Hosting']);
  const bonusField = findField(headers, ['ZAO Festivals sum', 'Bonus/Festival', 'Bonus']);
  const onchainField = findField(headers, ['actual ZAO onchain', 'On-chain Balance', 'On-chain']);

  console.log(`  Found ${rows.length} rows. Fields: name=${nameField}, wallet=${walletField || '(none)'}`);

  for (const row of rows) {
    const name = row[nameField]?.trim();
    if (!name) continue;

    const wallet = walletField ? (row[walletField] || '').trim().toLowerCase() || null : null;
    const totalRespect = totalField ? Number(row[totalField]) || 0 : 0;
    const fractalRespect = fractalField ? Number(row[fractalField]) || 0 : 0;
    const eventRespect = eventField ? Number(row[eventField]) || 0 : 0;
    const hostingRespect = hostingField ? Number(row[hostingField]) || 0 : 0;
    const bonusRespect = bonusField ? Number(row[bonusField]) || 0 : 0;
    const onchainOG = onchainField ? Number(row[onchainField]) || 0 : 0;

    // Upsert by name (name is the stable identifier across Airtable exports)
    const memberData = {
      name,
      wallet_address: wallet,
      total_respect: totalRespect,
      fractal_respect: fractalRespect,
      event_respect: eventRespect,
      hosting_respect: hostingRespect,
      bonus_respect: bonusRespect,
      onchain_og: onchainOG,
      onchain_zor: 0,
    };

    // Try upsert on name first; if that fails (no unique constraint), check existing + update/insert
    const { data: existing } = await supabase
      .from('respect_members')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('respect_members')
        .update(memberData)
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('respect_members')
        .insert(memberData));
    }

    if (error) {
      console.error(`  Failed: ${name} — ${error.message}`);
      stats.membersFailed++;
    } else {
      stats.membersImported++;
    }
  }

  console.log(`  Imported ${stats.membersImported} members (${stats.membersFailed} failed)`);
}

// ─── Step 2: Load wallet mapping ─────────────────────────────────────

function loadWalletMap(): Map<string, string> {
  const walletMap = new Map<string, string>();
  const filePath = path.join(CSV_DIR, 'Wallet Data-Grid view.csv');
  if (!fileExists(filePath)) return walletMap;

  const rows = parseCSV<Record<string, string>>(filePath);
  for (const row of rows) {
    const name = (row['Name'] || '').trim();
    const wallet = (row['ETH WALLET'] || '').trim().toLowerCase();
    if (name && wallet && wallet.startsWith('0x')) {
      walletMap.set(name, wallet);
    }
  }
  console.log(`  Loaded ${walletMap.size} wallet mappings`);
  return walletMap;
}

// ─── Step 3: Import OG era fractal sessions (columns = sessions) ────

async function importOGSessions(walletMap: Map<string, string>) {
  console.log('\n━━━ Step 2: Import OG era sessions from Respect CSV ━━━');

  const filePath = path.join(CSV_DIR, 'Respect-Grid view.csv');
  if (!fileExists(filePath)) {
    console.log('  Skipping — Respect-Grid view.csv not found at', filePath);
    return;
  }

  const rows = parseCSV<Record<string, string>>(filePath);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  // Find fractal session columns: match "ZAO Fractal #42" or "ZAO Fractactal #5" etc.
  const fractalCols: { col: string; num: number }[] = [];
  for (const h of headers) {
    const match = h.match(
      /^ZAO\s+(?:Fractal|Fractactal|Fractctal|FRACTAL|Respect)\s+#?(\d+\.?\d*)\s*(?:Respect)?$/i
    );
    if (match) {
      fractalCols.push({ col: h, num: parseFloat(match[1]) });
    }
  }

  fractalCols.sort((a, b) => a.num - b.num);
  console.log(`  Found ${fractalCols.length} fractal columns in CSV`);

  // Pre-fetch existing sessions by name to enable idempotent upserts
  const { data: existingSessions } = await supabase
    .from('fractal_sessions')
    .select('id, name');
  const sessionsByName = new Map<string, string>();
  for (const s of existingSessions || []) {
    sessionsByName.set(s.name, s.id);
  }

  for (const { col, num } of fractalCols) {
    // OG era: fractals 1-52 were 1x scoring, 53+ were 2x
    const scoringEra = num <= 52 ? '1x' : '2x';
    const sessionName = `ZAO Fractal ${num}`;

    // Collect scores
    const scores: { name: string; wallet: string | null; score: number }[] = [];
    for (const row of rows) {
      const val = row[col]?.trim();
      if (!val || val === '' || val === '0') continue;
      const score = Number(val);
      if (score > 0) {
        const memberName = row['Name']?.trim();
        if (!memberName) continue;
        scores.push({
          name: memberName,
          wallet: walletMap.get(memberName) || null,
          score,
        });
      }
    }

    if (scores.length === 0) continue;
    scores.sort((a, b) => b.score - a.score);

    // Estimate session date: Fractal 1 ~ 2024-06-10, weekly cadence
    const startDate = new Date('2024-06-10');
    const weeksOffset = Math.floor(num) - 1;
    const estimatedDate = new Date(startDate.getTime() + weeksOffset * 7 * 24 * 60 * 60 * 1000);
    const sessionDate = estimatedDate.toISOString().split('T')[0];

    // Check if session already exists (idempotent)
    let sessionId = sessionsByName.get(sessionName);

    if (sessionId) {
      // Session exists — update it
      await supabase
        .from('fractal_sessions')
        .update({
          session_date: sessionDate,
          scoring_era: scoringEra,
          participant_count: scores.length,
          notes: 'OG era — imported from Airtable CSV',
        })
        .eq('id', sessionId);

      // Delete old scores for this session so we can re-insert cleanly
      await supabase
        .from('fractal_scores')
        .delete()
        .eq('session_id', sessionId);

      stats.sessionsDuplicate++;
    } else {
      // Create session
      const { data: session, error: sessionErr } = await supabase
        .from('fractal_sessions')
        .insert({
          name: sessionName,
          session_date: sessionDate,
          scoring_era: scoringEra,
          participant_count: scores.length,
          notes: 'OG era — imported from Airtable CSV',
        })
        .select('id')
        .single();

      if (sessionErr || !session) {
        console.error(`  Session ${sessionName} failed:`, sessionErr?.message);
        continue;
      }
      sessionId = session.id;
      stats.sessionsImported++;
    }

    // Insert scores
    const scoreRows = scores.map((s, i) => ({
      session_id: sessionId,
      member_name: s.name,
      wallet_address: s.wallet,
      rank: scoreToRank(s.score) || (i + 1),
      score: s.score,
    }));

    const { error: scoresErr } = await supabase.from('fractal_scores').insert(scoreRows);
    if (scoresErr) {
      console.error(`  Scores for ${sessionName} failed:`, scoresErr.message);
    } else {
      stats.scoresImported += scoreRows.length;
    }
  }

  console.log(`  Created ${stats.sessionsImported} sessions (${stats.sessionsDuplicate} updated)`);
  console.log(`  Inserted ${stats.scoresImported} scores`);
}

// ─── Step 4: Import ORDAO era awards (on-chain data) ────────────────

async function importOrdaoAwards(walletMap: Map<string, string>) {
  console.log('\n━━━ Step 3: Import ORDAO era awards ━━━');

  // Look for awards CSVs in both data dir and ~/Downloads
  const searchDirs = [CSV_DIR, path.join(process.env.HOME || '', 'Downloads')];
  const awardFilePatterns = ['awards.csv', 'awards (2).csv', 'awards (3).csv', 'awards (4).csv'];

  interface AwardRow {
    recipient: string;
    denomination: string;
    meetingNumber: string;
    groupNum: string;
    level: string;
    mintTs: string;
    mintTxHash: string;
    title: string;
    reason: string;
  }

  const allAwards: AwardRow[] = [];

  for (const dir of searchDirs) {
    for (const file of awardFilePatterns) {
      const filePath = path.join(dir, file);
      if (fileExists(filePath)) {
        const rows = parseCSV<AwardRow>(filePath);
        allAwards.push(...rows);
        console.log(`  Loaded ${rows.length} awards from ${filePath}`);
      }
    }
  }

  if (allAwards.length === 0) {
    console.log('  No awards CSVs found — skipping ORDAO era');
    return;
  }

  // Pre-fetch existing sessions
  const { data: existingSessions } = await supabase
    .from('fractal_sessions')
    .select('id, name');
  const sessionsByName = new Map<string, string>();
  for (const s of existingSessions || []) {
    sessionsByName.set(s.name, s.id);
  }

  // Group by meeting + group
  const groups = new Map<string, AwardRow[]>();
  for (const award of allAwards) {
    if (!award.meetingNumber || !award.groupNum) continue;
    const key = `${award.meetingNumber}-${award.groupNum}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(award);
  }

  let ordaoSessions = 0;
  let ordaoScores = 0;

  // Reverse-build a wallet-to-name map for resolving wallet-only recipients
  const reverseWalletMap = new Map<string, string>();
  for (const [name, wallet] of walletMap) {
    reverseWalletMap.set(wallet, name);
  }

  for (const [key, awards] of groups) {
    const [meetingNum, groupNum] = key.split('-');
    const sessionName = `ZAO Fractal ${meetingNum} - Group ${groupNum}`;

    // Get date from mint timestamp
    const ts = awards[0]?.mintTs ? Number(awards[0].mintTs) : 0;
    const sessionDate = ts > 0 ? new Date(ts * 1000).toISOString().split('T')[0] : null;
    const txHash = awards[0]?.mintTxHash || null;

    let sessionId = sessionsByName.get(sessionName);

    if (sessionId) {
      // Update existing
      await supabase
        .from('fractal_sessions')
        .update({
          session_date: sessionDate,
          scoring_era: '2x',
          participant_count: awards.length,
          notes: txHash
            ? `ORDAO era — on-chain verified. Tx: ${txHash}`
            : 'ORDAO era — on-chain verified',
        })
        .eq('id', sessionId);

      await supabase.from('fractal_scores').delete().eq('session_id', sessionId);
    } else {
      const { data: session, error: sessionErr } = await supabase
        .from('fractal_sessions')
        .insert({
          name: sessionName,
          session_date: sessionDate,
          scoring_era: '2x',
          participant_count: awards.length,
          notes: txHash
            ? `ORDAO era — on-chain verified. Tx: ${txHash}`
            : 'ORDAO era — on-chain verified',
        })
        .select('id')
        .single();

      if (sessionErr || !session) {
        console.error(`  Session ${sessionName} failed:`, sessionErr?.message);
        continue;
      }
      sessionId = session.id;
      ordaoSessions++;
    }

    const scoreRows = awards.map((a) => {
      const recipientAddr = a.recipient?.toLowerCase() || '';
      const memberName = reverseWalletMap.get(recipientAddr) || recipientAddr;
      return {
        session_id: sessionId,
        member_name: memberName,
        wallet_address: recipientAddr || null,
        rank: a.level ? 7 - Number(a.level) : 0,
        score: Number(a.denomination) || 0,
      };
    });

    const { error: scoresErr } = await supabase.from('fractal_scores').insert(scoreRows);
    if (scoresErr) {
      console.error(`  Scores for ${sessionName} failed:`, scoresErr.message);
    } else {
      ordaoScores += scoreRows.length;
    }
  }

  stats.sessionsImported += ordaoSessions;
  stats.scoresImported += ordaoScores;
  console.log(`  Created ${ordaoSessions} ORDAO sessions, ${ordaoScores} scores`);
}

// ─── Step 5: Import non-fractal respect events (Awards CSV) ─────────

async function importRespectEvents() {
  console.log('\n━━━ Step 4: Import non-fractal respect events ━━━');

  const filePath = path.join(CSV_DIR, 'Awards-Grid view.csv');
  if (!fileExists(filePath)) {
    console.log('  Skipping — Awards-Grid view.csv not found at', filePath);
    return;
  }

  const rows = parseCSV<Record<string, string>>(filePath);
  const headers = new Set(Object.keys(rows[0] || {}));

  const nameField = findField(headers, ['Name', 'name', 'Member', 'Recipient']) || 'Name';
  const typeField = findField(headers, ['Event Type', 'Type', 'Category', 'event_type']) || 'Event Type';
  const amountField = findField(headers, ['Amount', 'Points', 'Score', 'amount']) || 'Amount';
  const descField = findField(headers, ['Description', 'Notes', 'Reason', 'description']) || 'Description';
  const dateField = findField(headers, ['Date', 'Event Date', 'date', 'event_date']) || 'Date';

  console.log(`  Found ${rows.length} event rows`);

  for (const row of rows) {
    const name = row[nameField]?.trim();
    if (!name) continue;

    const eventType = (row[typeField] || 'other').trim().toLowerCase();
    const amount = Number(row[amountField]) || 0;
    const description = row[descField]?.trim() || null;
    const eventDate = row[dateField]?.trim() || null;

    if (amount === 0) continue;

    // Check for existing event to avoid duplicates
    const query = supabase
      .from('respect_events')
      .select('id')
      .eq('member_name', name)
      .eq('event_type', eventType)
      .eq('amount', amount);

    if (description) {
      query.eq('description', description);
    }

    const { data: existing } = await query.maybeSingle();
    if (existing) continue; // Already imported

    const { error } = await supabase.from('respect_events').insert({
      member_name: name,
      event_type: eventType,
      amount,
      description,
      event_date: eventDate,
    });

    if (error) {
      console.error(`  Event for ${name} failed:`, error.message);
    } else {
      stats.eventsImported++;
    }
  }

  console.log(`  Imported ${stats.eventsImported} respect events`);
}

// ─── Step 6: Recalculate member totals from scores ──────────────────

async function recalculateMemberTotals() {
  console.log('\n━━━ Step 5: Recalculate member totals and fractal counts ━━━');

  // Fetch all scores grouped by member
  const { data: allScores } = await supabase
    .from('fractal_scores')
    .select('member_name, score, session_id');

  if (!allScores || allScores.length === 0) {
    console.log('  No scores found — skipping');
    return;
  }

  // Build per-member aggregates
  const memberScores = new Map<string, { total: number; count: number; sessionIds: Set<string> }>();
  for (const s of allScores) {
    const name = s.member_name;
    if (!memberScores.has(name)) {
      memberScores.set(name, { total: 0, count: 0, sessionIds: new Set() });
    }
    const m = memberScores.get(name)!;
    m.total += Number(s.score);
    if (!m.sessionIds.has(s.session_id)) {
      m.sessionIds.add(s.session_id);
      m.count++;
    }
  }

  // Fetch all sessions for earliest-date lookup
  const { data: sessions } = await supabase
    .from('fractal_sessions')
    .select('id, session_date')
    .order('session_date', { ascending: true });

  const sessionDateMap = new Map<string, string>();
  for (const s of sessions || []) {
    if (s.session_date) sessionDateMap.set(s.id, s.session_date);
  }

  // Fetch all members
  const { data: members } = await supabase
    .from('respect_members')
    .select('id, name, first_respect_at, fractal_count, fractal_respect');

  const memberByName = new Map<string, { id: string; first_respect_at: string | null }>();
  for (const m of members || []) {
    memberByName.set(m.name, { id: m.id, first_respect_at: m.first_respect_at });
  }

  let updated = 0;

  for (const [name, agg] of memberScores) {
    const member = memberByName.get(name);
    if (!member) continue;

    // Find earliest session date for this member
    let earliestDate: string | null = null;
    for (const sid of agg.sessionIds) {
      const d = sessionDateMap.get(sid);
      if (d && (!earliestDate || d < earliestDate)) {
        earliestDate = d;
      }
    }

    const updates: Record<string, unknown> = {
      fractal_respect: agg.total,
      fractal_count: agg.count,
    };

    // Set first_respect_at only if not already set
    if (!member.first_respect_at && earliestDate) {
      updates.first_respect_at = earliestDate;
      stats.firstRespectSet++;
    }

    const { error } = await supabase
      .from('respect_members')
      .update(updates)
      .eq('id', member.id);

    if (!error) updated++;
  }

  console.log(`  Updated fractal_count + fractal_respect for ${updated} members`);
  console.log(`  Set first_respect_at for ${stats.firstRespectSet} members`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  ZAO Fractal History Import (Idempotent)   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nCSV directory: ${CSV_DIR}`);

  if (!fs.existsSync(CSV_DIR)) {
    console.error(`\nData directory not found: ${CSV_DIR}`);
    console.error('Create it and add your Airtable CSV exports, or use --dir <path>');
    process.exit(1);
  }

  const files = fs.readdirSync(CSV_DIR).filter((f) => f.endsWith('.csv'));
  console.log(`Found ${files.length} CSV files: ${files.join(', ')}`);

  const walletMap = loadWalletMap();

  await importMembers();
  await importOGSessions(walletMap);
  await importOrdaoAwards(walletMap);
  await importRespectEvents();
  await recalculateMemberTotals();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Import Summary                            ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Members imported:    ${String(stats.membersImported).padStart(6)}              ║`);
  console.log(`║  Members failed:      ${String(stats.membersFailed).padStart(6)}              ║`);
  console.log(`║  Sessions imported:   ${String(stats.sessionsImported).padStart(6)}              ║`);
  console.log(`║  Sessions updated:    ${String(stats.sessionsDuplicate).padStart(6)}              ║`);
  console.log(`║  Scores imported:     ${String(stats.scoresImported).padStart(6)}              ║`);
  console.log(`║  Events imported:     ${String(stats.eventsImported).padStart(6)}              ║`);
  console.log(`║  first_respect_at set:${String(stats.firstRespectSet).padStart(6)}              ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('\nDone. Visit /fractals > Analytics tab to verify.');
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
