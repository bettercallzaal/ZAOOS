import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

// ─── Airtable config ────────────────────────────────────────────────
const AIRTABLE_BASE_ID = 'appTUNG04rjZ9kSF4';
const AIRTABLE_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// All 6 tabs from the ZAO TOKENS (ORDAO) base
const TABLES = {
  summary: 'Summary',
  respect: 'Respect',
  misc: 'Misc',
  hosts: 'Fractal Hosts',
  festivals: 'ZAO Festivals',
  wallets: 'Wallet Data',
} as const;

// Fibonacci score → rank mapping
const RANK_MAP_2X: Record<number, number> = { 110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6 };
const RANK_MAP_1X: Record<number, number> = { 55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6 };

function scoreToRank(score: number): number {
  return RANK_MAP_2X[score] || RANK_MAP_1X[score] || 0;
}

// Summary fields to skip when scanning for session columns in the Respect tab
const SKIP_FIELDS = new Set([
  'Name', 'name', 'Member', 'Wallet', 'ETH WALLET', 'ETH WALLET (from Wallet Data 2)',
  'Total Respect', 'Total Points', 'Total', 'On-chain Balance', 'On-chain', 'Onchain',
  'Fractal Respect', 'ZRespect Sum', 'S.', 'Events/Contributions', 'Form/Intros Sum',
  'Hosting', 'Fractal Host sum', 'Bonus/Festival', 'ZAO Festivals sum',
  'id', 'createdTime', 'actual ZAO onchain',
]);

type AirtableRecord = { id: string; fields: Record<string, unknown> };

// ─── Airtable API helpers ───────────────────────────────────────────

/** Rate-limit delay — Airtable allows 5 req/sec */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAllRecords(token: string, tableName: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const headers = { Authorization: `Bearer ${token}` };

  do {
    await delay(220); // ~4.5 req/sec to stay under limit

    const url = new URL(`${AIRTABLE_BASE}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Airtable ${tableName} error ${res.status}:`, text);
      throw new Error(`Airtable "${tableName}" failed with status ${res.status}`);
    }

    const data = await res.json();
    for (const record of data.records || []) {
      records.push({ id: record.id, fields: record.fields });
    }
    offset = data.offset;
  } while (offset);

  return records;
}

function findField(fieldNames: Set<string>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (fieldNames.has(c)) return c;
  }
  for (const c of candidates) {
    for (const f of fieldNames) {
      if (f.toLowerCase() === c.toLowerCase()) return f;
    }
  }
  return null;
}

function collectFieldNames(records: AirtableRecord[]): Set<string> {
  const names = new Set<string>();
  for (const r of records) {
    for (const key of Object.keys(r.fields)) names.add(key);
  }
  return names;
}

// ─── Step 1: Import Wallet Data (run first so other steps can use it) ─

async function importWallets(
  records: AirtableRecord[],
  walletMap: Map<string, string>,
  stats: SyncStats,
) {
  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
  const walletField = findField(fields, ['ETH WALLET', 'Wallet', 'wallet_address', 'ETH WALLET (from Wallet Data 2)']);

  for (const r of records) {
    const name = (r.fields[nameField] as string)?.trim();
    const wallet = walletField ? (r.fields[walletField] as string)?.trim().toLowerCase() : null;

    if (name && wallet && wallet.startsWith('0x')) {
      walletMap.set(name, wallet);
      stats.wallets++;
    }
  }
}

// ─── Step 2: Import Summary (members) ───────────────────────────────

async function importSummary(
  records: AirtableRecord[],
  walletMap: Map<string, string>,
  stats: SyncStats,
) {
  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';

  for (const r of records) {
    const name = (r.fields[nameField] as string)?.trim();
    if (!name) continue;

    const wallet = walletMap.get(name) || null;

    const memberData = {
      name,
      wallet_address: wallet,
      // Totals will be recalculated from raw scores in enrichment pass
      // but set initial values so the row exists
      total_respect: 0,
      fractal_respect: 0,
      event_respect: 0,
      hosting_respect: 0,
      bonus_respect: 0,
      onchain_og: 0,
      onchain_zor: 0,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from('respect_members')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      // Only update wallet if we have a new one and they don't
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (wallet) updates.wallet_address = wallet;
      await supabaseAdmin.from('respect_members').update(updates).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('respect_members').insert(memberData);
    }
    stats.members++;
  }
}

// ─── Step 3: Import Respect tab (per-session scores as columns) ─────

async function importRespectSessions(
  records: AirtableRecord[],
  walletMap: Map<string, string>,
  stats: SyncStats,
) {
  if (records.length === 0) return;

  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';

  // Detect session columns: "ZAO Fractal #42", "ZAO Fractactal #5", etc.
  const sessionCols: { col: string; num: number }[] = [];
  for (const f of fields) {
    if (SKIP_FIELDS.has(f)) continue;
    const match = f.match(
      /^ZAO\s+(?:Fractal|Fractactal|Fractctal|FRACTAL|Respect)\s+#?(\d+\.?\d*)\s*(?:Respect)?$/i,
    );
    if (match) {
      sessionCols.push({ col: f, num: parseFloat(match[1]) });
    }
  }
  sessionCols.sort((a, b) => a.num - b.num);

  if (sessionCols.length === 0) {
    // Fallback: any numeric column that isn't a known summary field
    for (const f of fields) {
      if (SKIP_FIELDS.has(f)) continue;
      const hasNumeric = records.some(r => {
        const v = r.fields[f];
        return typeof v === 'number' && v > 0;
      });
      if (hasNumeric) sessionCols.push({ col: f, num: sessionCols.length + 1 });
    }
  }

  // Pre-fetch existing sessions
  const { data: existingSessions } = await supabaseAdmin
    .from('fractal_sessions')
    .select('id, name');
  const sessionsByName = new Map<string, string>();
  for (const s of existingSessions || []) {
    sessionsByName.set(s.name, s.id);
  }

  // OG era fractal 1 started ~June 2024, weekly cadence
  const startDate = new Date('2024-06-10');

  for (const { col, num } of sessionCols) {
    const scoringEra = num <= 52 ? '1x' : '2x';
    const sessionName = `ZAO Fractal ${num}`;

    // Collect scores for this session
    const scores: { name: string; wallet: string | null; score: number }[] = [];
    for (const r of records) {
      const val = r.fields[col];
      const score = typeof val === 'number' ? val : Number(val);
      if (!score || score <= 0) continue;

      const memberName = (r.fields[nameField] as string)?.trim();
      if (!memberName) continue;

      scores.push({
        name: memberName,
        wallet: walletMap.get(memberName) || null,
        score,
      });
    }
    if (scores.length === 0) continue;
    scores.sort((a, b) => b.score - a.score);

    // Estimate session date
    const weeksOffset = Math.floor(num) - 1;
    const estimatedDate = new Date(startDate.getTime() + weeksOffset * 7 * 86400000);
    const sessionDate = estimatedDate.toISOString().split('T')[0];

    let sessionId = sessionsByName.get(sessionName);

    if (sessionId) {
      await supabaseAdmin
        .from('fractal_sessions')
        .update({
          session_date: sessionDate,
          scoring_era: scoringEra,
          participant_count: scores.length,
          notes: 'OG era — synced from Airtable API',
        })
        .eq('id', sessionId);

      // Clear old scores for clean re-import
      await supabaseAdmin.from('fractal_scores').delete().eq('session_id', sessionId);
    } else {
      const { data: session, error: sessionErr } = await supabaseAdmin
        .from('fractal_sessions')
        .insert({
          name: sessionName,
          session_date: sessionDate,
          scoring_era: scoringEra,
          participant_count: scores.length,
          notes: 'OG era — synced from Airtable API',
        })
        .select('id')
        .single();

      if (sessionErr || !session) {
        console.error(`Session ${sessionName} failed:`, sessionErr?.message);
        continue;
      }
      sessionId = session.id;
    }

    sessionsByName.set(sessionName, sessionId!);

    const scoreRows = scores.map((s, i) => ({
      session_id: sessionId,
      member_name: s.name,
      wallet_address: s.wallet,
      rank: scoreToRank(s.score) || (i + 1),
      score: s.score,
    }));

    const { error: scoresErr } = await supabaseAdmin.from('fractal_scores').insert(scoreRows);
    if (scoresErr) {
      console.error(`Scores for ${sessionName} failed:`, scoresErr.message);
    } else {
      stats.sessions++;
      stats.scores += scoreRows.length;
    }
  }
}

// ─── Step 4: Import Fractal Hosts ───────────────────────────────────

async function importHosts(records: AirtableRecord[], stats: SyncStats) {
  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member', 'Host']) || 'Name';
  const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
  const countField = findField(fields, ['Count', 'Times Hosted', 'Sessions Hosted']);
  const dateField = findField(fields, ['Date', 'date']);

  for (const r of records) {
    const name = (r.fields[nameField] as string)?.trim();
    if (!name) continue;

    const amount = amountField ? Number(r.fields[amountField]) || 0 : 0;
    if (amount === 0 && !countField) continue;

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('respect_events')
      .select('id')
      .eq('member_name', name)
      .eq('event_type', 'hosting')
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabaseAdmin
        .from('respect_events')
        .update({ amount, description: 'Fractal hosting — synced from Airtable' })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('respect_events').insert({
        member_name: name,
        event_type: 'hosting',
        amount,
        description: 'Fractal hosting — synced from Airtable',
        event_date: dateField ? (r.fields[dateField] as string) || null : null,
      });
    }
    stats.hosts++;
  }
}

// ─── Step 5: Import ZAO Festivals ───────────────────────────────────

async function importFestivals(records: AirtableRecord[], stats: SyncStats) {
  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
  const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
  const descField = findField(fields, ['Festival', 'Description', 'Event', 'Notes']);
  const dateField = findField(fields, ['Date', 'date']);

  for (const r of records) {
    const name = (r.fields[nameField] as string)?.trim();
    if (!name) continue;

    const amount = amountField ? Number(r.fields[amountField]) || 0 : 0;
    if (amount === 0) continue;

    const description = descField
      ? (r.fields[descField] as string)?.trim() || 'Festival respect'
      : 'Festival respect';

    // Deduplicate by name + type + amount
    const { data: existing } = await supabaseAdmin
      .from('respect_events')
      .select('id')
      .eq('member_name', name)
      .eq('event_type', 'festival')
      .eq('amount', amount)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('respect_events').insert({
        member_name: name,
        event_type: 'festival',
        amount,
        description: `${description} — synced from Airtable`,
        event_date: dateField ? (r.fields[dateField] as string) || null : null,
      });
    }
    stats.festivals++;
  }
}

// ─── Step 6: Import Misc events ─────────────────────────────────────

async function importMisc(records: AirtableRecord[], stats: SyncStats) {
  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
  const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
  const typeField = findField(fields, ['Type', 'Category', 'Event Type']);
  const descField = findField(fields, ['Description', 'Notes', 'Reason']);
  const dateField = findField(fields, ['Date', 'date']);

  for (const r of records) {
    const name = (r.fields[nameField] as string)?.trim();
    if (!name) continue;

    const amount = amountField ? Number(r.fields[amountField]) || 0 : 0;
    if (amount === 0) continue;

    const eventType = typeField
      ? (r.fields[typeField] as string)?.trim().toLowerCase() || 'other'
      : 'other';
    const description = descField
      ? (r.fields[descField] as string)?.trim() || null
      : null;

    // Deduplicate
    const query = supabaseAdmin
      .from('respect_events')
      .select('id')
      .eq('member_name', name)
      .eq('event_type', eventType)
      .eq('amount', amount);

    const { data: existing } = await query.maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('respect_events').insert({
        member_name: name,
        event_type: eventType,
        amount,
        description: description ? `${description} — synced from Airtable` : 'Misc — synced from Airtable',
        event_date: dateField ? (r.fields[dateField] as string) || null : null,
      });
    }
    stats.misc++;
  }
}

// ─── Step 7: Enrichment pass — recalculate everything from raw data ─

async function enrichAndReconcile(stats: SyncStats) {
  // 1. Recalculate fractal_respect + fractal_count from fractal_scores
  const { data: allScores } = await supabaseAdmin
    .from('fractal_scores')
    .select('member_name, score, session_id');

  const memberAgg = new Map<string, { fractalTotal: number; sessionIds: Set<string> }>();
  for (const s of allScores || []) {
    if (!memberAgg.has(s.member_name)) {
      memberAgg.set(s.member_name, { fractalTotal: 0, sessionIds: new Set() });
    }
    const m = memberAgg.get(s.member_name)!;
    m.fractalTotal += Number(s.score);
    m.sessionIds.add(s.session_id);
  }

  // 2. Aggregate respect_events by member + type
  const { data: allEvents } = await supabaseAdmin
    .from('respect_events')
    .select('member_name, event_type, amount');

  const eventAgg = new Map<string, { hosting: number; bonus: number; events: number; hostCount: number }>();
  for (const e of allEvents || []) {
    if (!eventAgg.has(e.member_name)) {
      eventAgg.set(e.member_name, { hosting: 0, bonus: 0, events: 0, hostCount: 0 });
    }
    const m = eventAgg.get(e.member_name)!;
    const amount = Number(e.amount);
    switch (e.event_type) {
      case 'hosting':
        m.hosting += amount;
        m.hostCount++;
        break;
      case 'festival':
      case 'bonus':
        m.bonus += amount;
        break;
      default:
        m.events += amount;
        break;
    }
  }

  // 3. Get earliest session date per member for first_respect_at
  const { data: sessions } = await supabaseAdmin
    .from('fractal_sessions')
    .select('id, session_date')
    .order('session_date', { ascending: true });

  const sessionDateMap = new Map<string, string>();
  for (const s of sessions || []) {
    if (s.session_date) sessionDateMap.set(s.id, s.session_date);
  }

  // 4. Fetch all members
  const { data: members } = await supabaseAdmin
    .from('respect_members')
    .select('id, name, first_respect_at');

  for (const member of members || []) {
    const fractal = memberAgg.get(member.name);
    const events = eventAgg.get(member.name);

    const fractalRespect = fractal?.fractalTotal || 0;
    const fractalCount = fractal?.sessionIds.size || 0;
    const hostingRespect = events?.hosting || 0;
    const hostingCount = events?.hostCount || 0;
    const bonusRespect = events?.bonus || 0;
    const eventRespect = events?.events || 0;
    const totalRespect = fractalRespect + hostingRespect + bonusRespect + eventRespect;

    // Find earliest session date
    let earliestDate: string | null = null;
    if (fractal) {
      for (const sid of fractal.sessionIds) {
        const d = sessionDateMap.get(sid);
        if (d && (!earliestDate || d < earliestDate)) earliestDate = d;
      }
    }

    const updates: Record<string, unknown> = {
      total_respect: totalRespect,
      fractal_respect: fractalRespect,
      event_respect: eventRespect,
      hosting_respect: hostingRespect,
      bonus_respect: bonusRespect,
      fractal_count: fractalCount,
      hosting_count: hostingCount,
      updated_at: new Date().toISOString(),
    };

    if (!member.first_respect_at && earliestDate) {
      updates.first_respect_at = earliestDate;
      stats.firstRespectSet++;
    }

    await supabaseAdmin.from('respect_members').update(updates).eq('id', member.id);
    stats.enriched++;
  }
}

// ─── Stats tracking ─────────────────────────────────────────────────

interface SyncStats {
  wallets: number;
  members: number;
  sessions: number;
  scores: number;
  hosts: number;
  festivals: number;
  misc: number;
  enriched: number;
  firstRespectSet: number;
  errors: string[];
}

// ─── Main handler ───────────────────────────────────────────────────

/**
 * POST /api/admin/respect-import
 * Admin-only: full sync from all 6 Airtable tabs into Supabase.
 * Imports members, sessions, scores, hosts, festivals, misc events,
 * then recalculates all totals from raw data.
 */
export async function POST() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const airtableToken = process.env.AIRTABLE_TOKEN;
  if (!airtableToken) {
    return NextResponse.json(
      { error: 'AIRTABLE_TOKEN not configured' },
      { status: 500 },
    );
  }

  const stats: SyncStats = {
    wallets: 0,
    members: 0,
    sessions: 0,
    scores: 0,
    hosts: 0,
    festivals: 0,
    misc: 0,
    enriched: 0,
    firstRespectSet: 0,
    errors: [],
  };

  try {
    // Fetch all 6 tables from Airtable API
    console.log('[Airtable Sync] Fetching all tables...');

    const [walletRecords, summaryRecords, respectRecords, hostRecords, festivalRecords, miscRecords] =
      await Promise.all([
        fetchAllRecords(airtableToken, TABLES.wallets).catch(e => { stats.errors.push(`Wallet Data: ${e.message}`); return [] as AirtableRecord[]; }),
        fetchAllRecords(airtableToken, TABLES.summary).catch(e => { stats.errors.push(`Summary: ${e.message}`); return [] as AirtableRecord[]; }),
        fetchAllRecords(airtableToken, TABLES.respect).catch(e => { stats.errors.push(`Respect: ${e.message}`); return [] as AirtableRecord[]; }),
        fetchAllRecords(airtableToken, TABLES.hosts).catch(e => { stats.errors.push(`Fractal Hosts: ${e.message}`); return [] as AirtableRecord[]; }),
        fetchAllRecords(airtableToken, TABLES.festivals).catch(e => { stats.errors.push(`ZAO Festivals: ${e.message}`); return [] as AirtableRecord[]; }),
        fetchAllRecords(airtableToken, TABLES.misc).catch(e => { stats.errors.push(`Misc: ${e.message}`); return [] as AirtableRecord[]; }),
      ]);

    console.log(`[Airtable Sync] Fetched: ${walletRecords.length} wallets, ${summaryRecords.length} summary, ${respectRecords.length} respect, ${hostRecords.length} hosts, ${festivalRecords.length} festivals, ${miscRecords.length} misc`);

    // Build wallet map first (used by all other steps)
    const walletMap = new Map<string, string>();
    await importWallets(walletRecords, walletMap, stats);

    // Also extract wallets from Summary tab as fallback
    const summaryFields = collectFieldNames(summaryRecords);
    const summaryWalletField = findField(summaryFields, ['ETH WALLET (from Wallet Data 2)', 'ETH WALLET', 'Wallet']);
    if (summaryWalletField) {
      const summaryNameField = findField(summaryFields, ['Name', 'name', 'Member']) || 'Name';
      for (const r of summaryRecords) {
        const name = (r.fields[summaryNameField] as string)?.trim();
        const wallet = (r.fields[summaryWalletField] as string)?.trim().toLowerCase();
        if (name && wallet && wallet.startsWith('0x') && !walletMap.has(name)) {
          walletMap.set(name, wallet);
        }
      }
    }

    // Import in order
    console.log('[Airtable Sync] Step 1/6: Members...');
    await importSummary(summaryRecords, walletMap, stats);

    console.log('[Airtable Sync] Step 2/6: Fractal sessions + scores...');
    await importRespectSessions(respectRecords, walletMap, stats);

    console.log('[Airtable Sync] Step 3/6: Fractal hosts...');
    await importHosts(hostRecords, stats);

    console.log('[Airtable Sync] Step 4/6: ZAO Festivals...');
    await importFestivals(festivalRecords, stats);

    console.log('[Airtable Sync] Step 5/6: Misc events...');
    await importMisc(miscRecords, stats);

    console.log('[Airtable Sync] Step 6/6: Enrichment pass...');
    await enrichAndReconcile(stats);

    console.log('[Airtable Sync] Complete:', stats);

    return NextResponse.json({
      success: true,
      stats: {
        wallets: stats.wallets,
        members: stats.members,
        sessions: stats.sessions,
        scores: stats.scores,
        hosts: stats.hosts,
        festivals: stats.festivals,
        misc: stats.misc,
        enriched: stats.enriched,
        firstRespectSet: stats.firstRespectSet,
      },
      errors: stats.errors.length > 0 ? stats.errors : [],
    });
  } catch (err) {
    console.error('[Airtable Sync] Fatal error:', err);
    return NextResponse.json(
      { error: 'Sync failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
