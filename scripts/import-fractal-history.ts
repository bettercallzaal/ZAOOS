import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_DIR = path.join(__dirname, '..', 'csv import');
const AWARDS_DIR = path.join(process.env.HOME!, 'Downloads');

function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<T>(content, { header: true, skipEmptyLines: true });
  return result.data;
}

// ─── Step 1: Import members from Summary CSV ────────────────────────

async function importMembers() {
  console.log('\n=== Step 1: Importing members from Summary CSV ===');
  const filePath = path.join(CSV_DIR, 'Summary-Grid view.csv');
  if (!fs.existsSync(filePath)) {
    console.error('  Summary CSV not found at', filePath);
    return;
  }

  const rows = parseCSV<Record<string, string>>(filePath);
  let imported = 0;
  let failed = 0;

  for (const row of rows) {
    const name = row['Name']?.trim();
    if (!name) continue;

    const wallet = (row['ETH WALLET (from Wallet Data 2)'] || '').trim().toLowerCase() || null;
    const totalPoints = Number(row['Total Points']) || 0;
    const onchainOG = Number(row['actual ZAO onchain']) || 0;
    const fractalSum = Number(row['ZRespect Sum']) || 0;
    const eventSum = Number(row['Form/Intros Sum']) || 0;
    const hostingSum = Number(row['Fractal Host sum']) || 0;
    const festivalSum = Number(row['ZAO Festivals sum']) || 0;

    const { error } = await supabase.from('respect_members').upsert({
      name,
      wallet_address: wallet,
      total_respect: totalPoints,
      fractal_respect: fractalSum,
      event_respect: eventSum,
      hosting_respect: hostingSum,
      bonus_respect: festivalSum,
      onchain_og: onchainOG,
      onchain_zor: 0,
    }, { onConflict: 'name' });

    if (error) {
      // Try insert if upsert fails (name might not be unique constraint)
      const { error: insertErr } = await supabase.from('respect_members').insert({
        name,
        wallet_address: wallet,
        total_respect: totalPoints,
        fractal_respect: fractalSum,
        event_respect: eventSum,
        hosting_respect: hostingSum,
        bonus_respect: festivalSum,
        onchain_og: onchainOG,
        onchain_zor: 0,
      });
      if (insertErr) {
        console.error(`  Failed: ${name} —`, insertErr.message);
        failed++;
        continue;
      }
    }
    imported++;
  }

  console.log(`  Imported ${imported} members (${failed} failed) out of ${rows.length}`);
}

// ─── Step 2: Import OG era fractal sessions (1-73) ──────────────────

async function importOGSessions() {
  console.log('\n=== Step 2: Importing OG era sessions (Fractals 1-73) ===');
  const filePath = path.join(CSV_DIR, 'Respect-Grid view.csv');
  if (!fs.existsSync(filePath)) {
    console.error('  Respect CSV not found at', filePath);
    return;
  }

  // Load wallet mapping
  const walletPath = path.join(CSV_DIR, 'Wallet Data-Grid view.csv');
  const walletMap = new Map<string, string>();
  if (fs.existsSync(walletPath)) {
    const walletRows = parseCSV<Record<string, string>>(walletPath);
    for (const w of walletRows) {
      const name = w['Name']?.trim();
      const wallet = (w['ETH WALLET'] || '').trim().toLowerCase();
      if (name && wallet) walletMap.set(name, wallet);
    }
    console.log(`  Loaded ${walletMap.size} wallet mappings`);
  }

  const rows = parseCSV<Record<string, string>>(filePath);
  if (rows.length === 0) return;

  // Find fractal columns (match various spellings)
  const headers = Object.keys(rows[0]);
  const fractalCols: { col: string; num: number }[] = [];

  for (const h of headers) {
    const match = h.match(/^ZAO\s+(Fractal|Fractactal|Fractctal|FRACTAL|Respect)\s+#?(\d+\.?\d*)\s*(Respect)?$/i);
    if (match) {
      const num = parseFloat(match[2]);
      if (num < 74) { // Only OG era
        fractalCols.push({ col: h, num });
      }
    }
  }

  fractalCols.sort((a, b) => a.num - b.num);
  console.log(`  Found ${fractalCols.length} OG fractal columns`);

  let sessionsCreated = 0;
  let scoresCreated = 0;

  for (const { col, num } of fractalCols) {
    const scoringEra = num <= 52 ? '1x' : '2x';
    const sessionName = `ZAO Fractal ${num}`;

    // Collect non-zero, non-empty scores
    const scores: { name: string; wallet: string | null; score: number }[] = [];
    for (const row of rows) {
      const val = row[col]?.trim();
      if (!val || val === '' || val === '0') continue;
      const score = Number(val);
      if (score > 0) {
        const memberName = row['Name']?.trim();
        scores.push({
          name: memberName,
          wallet: walletMap.get(memberName) || null,
          score,
        });
      }
    }

    if (scores.length === 0) continue;

    // Sort by score desc to assign ranks
    scores.sort((a, b) => b.score - a.score);

    // Estimate session date: ZAO started ~June 2024, weekly cadence
    // Fractal 1 ~ 2024-06-10, each fractal ~1 week apart
    const startDate = new Date('2024-06-10');
    const weeksOffset = Math.floor(num) - 1;
    const estimatedDate = new Date(startDate.getTime() + weeksOffset * 7 * 24 * 60 * 60 * 1000);
    const sessionDate = estimatedDate.toISOString().split('T')[0];

    // Insert session
    const { data: session, error: sessionErr } = await supabase
      .from('fractal_sessions')
      .insert({
        name: sessionName,
        session_date: sessionDate,
        scoring_era: scoringEra,
        participant_count: scores.length,
        notes: `OG era — imported from Airtable CSV`,
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      console.error(`  Session ${sessionName} failed:`, sessionErr?.message);
      continue;
    }

    sessionsCreated++;

    // Insert scores
    const scoreRows = scores.map((s, i) => ({
      session_id: session.id,
      member_name: s.name,
      wallet_address: s.wallet,
      rank: i + 1,
      score: s.score,
    }));

    const { error: scoresErr } = await supabase.from('fractal_scores').insert(scoreRows);
    if (scoresErr) {
      console.error(`  Scores for ${sessionName} failed:`, scoresErr.message);
    } else {
      scoresCreated += scoreRows.length;
    }
  }

  console.log(`  Created ${sessionsCreated} sessions, ${scoresCreated} scores`);
}

// ─── Step 3: Import ORDAO era awards (74-90+) ───────────────────────

async function importOrdaoAwards() {
  console.log('\n=== Step 3: Importing ORDAO era awards (Meetings 74-90+) ===');
  const files = ['awards.csv', 'awards (2).csv', 'awards (3).csv'];

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

  for (const file of files) {
    const filePath = path.join(AWARDS_DIR, file);
    if (fs.existsSync(filePath)) {
      const rows = parseCSV<AwardRow>(filePath);
      allAwards.push(...rows);
      console.log(`  Loaded ${rows.length} awards from ${file}`);
    } else {
      console.log(`  File not found: ${filePath}`);
    }
  }

  if (allAwards.length === 0) {
    console.log('  No awards files found');
    return;
  }

  // Group by meeting + group
  const groups = new Map<string, AwardRow[]>();
  for (const award of allAwards) {
    const key = `${award.meetingNumber}-${award.groupNum}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(award);
  }

  let sessionsCreated = 0;
  let scoresCreated = 0;

  for (const [key, awards] of groups) {
    const [meetingNum, groupNum] = key.split('-');
    const sessionName = `ZAO Fractal ${meetingNum} - Group ${groupNum}`;

    // Get date from timestamp
    const ts = awards[0]?.mintTs ? Number(awards[0].mintTs) : 0;
    const sessionDate = ts > 0 ? new Date(ts * 1000).toISOString().split('T')[0] : null;

    // Get tx hash for verification link
    const txHash = awards[0]?.mintTxHash || null;

    const { data: session, error: sessionErr } = await supabase
      .from('fractal_sessions')
      .insert({
        name: sessionName,
        session_date: sessionDate,
        scoring_era: '2x',
        participant_count: awards.length,
        notes: txHash
          ? `ORDAO era — on-chain verified. Tx: ${txHash}`
          : `ORDAO era — on-chain verified`,
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      console.error(`  Session ${sessionName} failed:`, sessionErr?.message);
      continue;
    }

    sessionsCreated++;

    const scoreRows = awards.map(a => ({
      session_id: session.id,
      member_name: a.recipient.toLowerCase(),
      wallet_address: a.recipient.toLowerCase(),
      rank: 7 - Number(a.level), // level 6 = rank 1
      score: Number(a.denomination),
    }));

    const { error: scoresErr } = await supabase.from('fractal_scores').insert(scoreRows);
    if (scoresErr) {
      console.error(`  Scores for ${sessionName} failed:`, scoresErr.message);
    } else {
      scoresCreated += scoreRows.length;
    }
  }

  console.log(`  Created ${sessionsCreated} sessions, ${scoresCreated} scores`);
}

// ─── Step 4: Update fractal_count on respect_members ────────────────

async function updateFractalCounts() {
  console.log('\n=== Step 4: Updating fractal counts ===');

  // Count scores per member name
  const { data: scores } = await supabase
    .from('fractal_scores')
    .select('member_name');

  if (!scores) return;

  const counts = new Map<string, number>();
  for (const s of scores) {
    const name = s.member_name;
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  let updated = 0;
  for (const [name, count] of counts) {
    // Try by name first
    const { error } = await supabase
      .from('respect_members')
      .update({ fractal_count: count })
      .eq('name', name);

    if (!error) {
      updated++;
    } else {
      // Try by wallet (ORDAO awards use wallet as member_name)
      await supabase
        .from('respect_members')
        .update({ fractal_count: count })
        .eq('wallet_address', name);
    }
  }

  console.log(`  Updated fractal_count for ${updated} members`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  ZAO Fractal History Import          ║');
  console.log('╚══════════════════════════════════════╝');

  await importMembers();
  await importOGSessions();
  await importOrdaoAwards();
  await updateFractalCounts();

  console.log('\n=== Import complete ===');
  console.log('Check your Supabase dashboard to verify the data.');
  console.log('Then visit /fractals > Analytics tab to see the dashboard.');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
