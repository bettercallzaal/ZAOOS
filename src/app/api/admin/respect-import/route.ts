import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

// Allow up to 60s on Vercel Pro for this heavy sync
export const maxDuration = 60;

// ─── Airtable config ────────────────────────────────────────────────
const AIRTABLE_BASE_ID = 'appTUNG04rjZ9kSF4';
const AIRTABLE_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const TABLES = {
  summary: 'Summary',
  respect: 'Respect',
  misc: 'Misc',
  hosts: 'Fractal Hosts',
  festivals: 'ZAO Festivals',
  wallets: 'Wallet Data',
} as const;

const RANK_MAP_2X: Record<number, number> = { 110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6 };
const RANK_MAP_1X: Record<number, number> = { 55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6 };

function scoreToRank(score: number): number {
  return RANK_MAP_2X[score] || RANK_MAP_1X[score] || 0;
}

const SKIP_FIELDS = new Set([
  'Name', 'name', 'Member', 'Wallet', 'ETH WALLET', 'ETH WALLET (from Wallet Data 2)',
  'Total Respect', 'Total Points', 'Total', 'On-chain Balance', 'On-chain', 'Onchain',
  'Fractal Respect', 'ZRespect Sum', 'S.', 'Events/Contributions', 'Form/Intros Sum',
  'Hosting', 'Fractal Host sum', 'Bonus/Festival', 'ZAO Festivals sum',
  'id', 'createdTime', 'actual ZAO onchain',
]);

type AirtableRecord = { id: string; fields: Record<string, unknown> };

// ─── Helpers ────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchAllRecords(token: string, tableName: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const headers = { Authorization: `Bearer ${token}` };

  do {
    if (offset) await delay(220);

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
  for (const c of candidates) if (fieldNames.has(c)) return c;
  for (const c of candidates) for (const f of fieldNames) if (f.toLowerCase() === c.toLowerCase()) return f;
  return null;
}

function collectFieldNames(records: AirtableRecord[]): Set<string> {
  const names = new Set<string>();
  for (const r of records) for (const key of Object.keys(r.fields)) names.add(key);
  return names;
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first.trim() || null : first != null ? String(first) : null;
  }
  return String(value);
}

function asNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (Array.isArray(value)) return asNumber(value[0]);
  return 0;
}

// ─── Step 1: Build wallet map ───────────────────────────────────────

function buildWalletMap(
  walletRecords: AirtableRecord[],
  summaryRecords: AirtableRecord[],
): Map<string, string> {
  const walletMap = new Map<string, string>();

  // From Wallet Data tab
  if (walletRecords.length > 0) {
    const fields = collectFieldNames(walletRecords);
    const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
    const walletField = findField(fields, ['ETH WALLET', 'Wallet', 'wallet_address', 'ETH WALLET (from Wallet Data 2)']);

    for (const r of walletRecords) {
      const name = asString(r.fields[nameField]);
      const wallet = walletField ? asString(r.fields[walletField])?.toLowerCase() ?? null : null;
      if (name && wallet && wallet.startsWith('0x')) walletMap.set(name, wallet);
    }
  }

  // Fallback from Summary tab
  if (summaryRecords.length > 0) {
    const fields = collectFieldNames(summaryRecords);
    const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
    const walletField = findField(fields, ['ETH WALLET (from Wallet Data 2)', 'ETH WALLET', 'Wallet']);
    if (walletField) {
      for (const r of summaryRecords) {
        const name = asString(r.fields[nameField]);
        const wallet = asString(r.fields[walletField])?.toLowerCase() ?? null;
        if (name && wallet && wallet.startsWith('0x') && !walletMap.has(name)) {
          walletMap.set(name, wallet);
        }
      }
    }
  }

  return walletMap;
}

// ─── Step 2: Upsert members (batched) ───────────────────────────────

async function importMembers(
  records: AirtableRecord[],
  walletMap: Map<string, string>,
): Promise<number> {
  if (records.length === 0) return 0;

  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';

  // Build rows
  const rows: Record<string, unknown>[] = [];
  for (const r of records) {
    const name = asString(r.fields[nameField]);
    if (!name) continue;
    rows.push({
      name,
      wallet_address: walletMap.get(name) || null,
      total_respect: 0,
      fractal_respect: 0,
      event_respect: 0,
      hosting_respect: 0,
      bonus_respect: 0,
      onchain_og: 0,
      onchain_zor: 0,
      updated_at: new Date().toISOString(),
    });
  }

  // Batch upsert — Supabase handles duplicates via onConflict
  const { error } = await supabaseAdmin
    .from('respect_members')
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: false });

  if (error) console.error('[Airtable Sync] Members upsert error:', error.message);
  return rows.length;
}

// ─── Step 3: Import sessions + scores (batched) ─────────────────────

async function importSessions(
  records: AirtableRecord[],
  walletMap: Map<string, string>,
  stats: SyncStats,
) {
  if (records.length === 0) return;

  const fields = collectFieldNames(records);
  const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';

  // Detect session columns
  const sessionCols: { col: string; num: number }[] = [];
  for (const f of fields) {
    if (SKIP_FIELDS.has(f)) continue;
    const match = f.match(
      /^ZAO\s+(?:Fractal|Fractactal|Fractctal|FRACTAL|Respect)\s+#?(\d+\.?\d*)\s*(?:Respect)?$/i,
    );
    if (match) sessionCols.push({ col: f, num: parseFloat(match[1]) });
  }

  // Fallback: any numeric column not in SKIP_FIELDS
  if (sessionCols.length === 0) {
    for (const f of fields) {
      if (SKIP_FIELDS.has(f)) continue;
      if (records.some(r => typeof r.fields[f] === 'number' && (r.fields[f] as number) > 0)) {
        sessionCols.push({ col: f, num: sessionCols.length + 1 });
      }
    }
  }

  sessionCols.sort((a, b) => a.num - b.num);
  if (sessionCols.length === 0) return;

  // Delete all existing OG-era sessions + scores for clean re-import
  const { data: existingOG } = await supabaseAdmin
    .from('fractal_sessions')
    .select('id')
    .like('notes', '%synced from Airtable%');

  if (existingOG && existingOG.length > 0) {
    const ids = existingOG.map(s => s.id);
    // Delete scores first (FK constraint)
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      await supabaseAdmin.from('fractal_scores').delete().in('session_id', batch);
    }
    // Delete sessions
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      await supabaseAdmin.from('fractal_sessions').delete().in('id', batch);
    }
  }

  const startDate = new Date('2024-06-10');

  // Insert all sessions in one batch
  const sessionRows = sessionCols.map(({ num }) => {
    const scoringEra = num <= 52 ? '1x' : '2x';
    const weeksOffset = Math.floor(num) - 1;
    const estimatedDate = new Date(startDate.getTime() + weeksOffset * 7 * 86400000);

    return {
      name: `ZAO Fractal ${num}`,
      session_date: estimatedDate.toISOString().split('T')[0],
      scoring_era: scoringEra,
      participant_count: 0, // updated below
      notes: 'OG era — synced from Airtable API',
    };
  });

  const { data: insertedSessions, error: sessErr } = await supabaseAdmin
    .from('fractal_sessions')
    .insert(sessionRows)
    .select('id, name');

  if (sessErr || !insertedSessions) {
    console.error('[Airtable Sync] Sessions insert error:', sessErr?.message);
    return;
  }

  const sessionIdMap = new Map<string, string>();
  for (const s of insertedSessions) sessionIdMap.set(s.name, s.id);

  stats.sessions = insertedSessions.length;

  // Build all score rows
  const allScoreRows: Record<string, unknown>[] = [];
  const participantCounts = new Map<string, number>();

  for (const { col, num } of sessionCols) {
    const sessionName = `ZAO Fractal ${num}`;
    const sessionId = sessionIdMap.get(sessionName);
    if (!sessionId) continue;

    const scores: { name: string; wallet: string | null; score: number }[] = [];
    for (const r of records) {
      const score = asNumber(r.fields[col]);
      if (!score || score <= 0) continue;
      const memberName = asString(r.fields[nameField]);
      if (!memberName) continue;
      scores.push({ name: memberName, wallet: walletMap.get(memberName) || null, score });
    }

    scores.sort((a, b) => b.score - a.score);
    participantCounts.set(sessionId, scores.length);

    for (let i = 0; i < scores.length; i++) {
      allScoreRows.push({
        session_id: sessionId,
        member_name: scores[i].name,
        wallet_address: scores[i].wallet,
        rank: scoreToRank(scores[i].score) || (i + 1),
        score: scores[i].score,
      });
    }
  }

  // Batch insert scores (chunks of 200 to avoid payload limits)
  for (let i = 0; i < allScoreRows.length; i += 200) {
    const batch = allScoreRows.slice(i, i + 200);
    const { error: scErr } = await supabaseAdmin.from('fractal_scores').insert(batch);
    if (scErr) console.error(`[Airtable Sync] Scores batch error:`, scErr.message);
  }
  stats.scores = allScoreRows.length;

  // Update participant counts
  for (const [sessionId, count] of participantCounts) {
    await supabaseAdmin.from('fractal_sessions').update({ participant_count: count }).eq('id', sessionId);
  }
}

// ─── Step 4: Import events (hosts, festivals, misc) — batched ───────

async function importEvents(
  hostRecords: AirtableRecord[],
  festivalRecords: AirtableRecord[],
  miscRecords: AirtableRecord[],
  stats: SyncStats,
) {
  // Clear existing Airtable-synced events for clean re-import
  await supabaseAdmin.from('respect_events').delete().like('description', '%synced from Airtable%');

  const eventRows: Record<string, unknown>[] = [];

  // Hosts
  if (hostRecords.length > 0) {
    const fields = collectFieldNames(hostRecords);
    const nameField = findField(fields, ['Name', 'name', 'Member', 'Host']) || 'Name';
    const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
    const dateField = findField(fields, ['Date', 'date']);

    for (const r of hostRecords) {
      const name = asString(r.fields[nameField]);
      if (!name) continue;
      const amount = amountField ? asNumber(r.fields[amountField]) : 0;
      if (amount === 0) continue;

      eventRows.push({
        member_name: name,
        event_type: 'hosting',
        amount,
        description: 'Fractal hosting — synced from Airtable',
        event_date: dateField ? asString(r.fields[dateField]) : null,
      });
      stats.hosts++;
    }
  }

  // Festivals
  if (festivalRecords.length > 0) {
    const fields = collectFieldNames(festivalRecords);
    const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
    const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
    const descField = findField(fields, ['Festival', 'Description', 'Event', 'Notes']);
    const dateField = findField(fields, ['Date', 'date']);

    for (const r of festivalRecords) {
      const name = asString(r.fields[nameField]);
      if (!name) continue;
      const amount = amountField ? asNumber(r.fields[amountField]) : 0;
      if (amount === 0) continue;
      const desc = descField ? asString(r.fields[descField]) || 'Festival respect' : 'Festival respect';

      eventRows.push({
        member_name: name,
        event_type: 'festival',
        amount,
        description: `${desc} — synced from Airtable`,
        event_date: dateField ? asString(r.fields[dateField]) : null,
      });
      stats.festivals++;
    }
  }

  // Misc
  if (miscRecords.length > 0) {
    const fields = collectFieldNames(miscRecords);
    const nameField = findField(fields, ['Name', 'name', 'Member']) || 'Name';
    const amountField = findField(fields, ['Amount', 'Points', 'Score', 'Respect', 'Total']);
    const typeField = findField(fields, ['Type', 'Category', 'Event Type']);
    const descField = findField(fields, ['Description', 'Notes', 'Reason']);
    const dateField = findField(fields, ['Date', 'date']);

    for (const r of miscRecords) {
      const name = asString(r.fields[nameField]);
      if (!name) continue;
      const amount = amountField ? asNumber(r.fields[amountField]) : 0;
      if (amount === 0) continue;
      const eventType = typeField ? asString(r.fields[typeField])?.toLowerCase() || 'other' : 'other';
      const desc = descField ? asString(r.fields[descField]) : null;

      eventRows.push({
        member_name: name,
        event_type: eventType,
        amount,
        description: desc ? `${desc} — synced from Airtable` : 'Misc — synced from Airtable',
        event_date: dateField ? asString(r.fields[dateField]) : null,
      });
      stats.misc++;
    }
  }

  // Batch insert all events
  for (let i = 0; i < eventRows.length; i += 200) {
    const batch = eventRows.slice(i, i + 200);
    const { error } = await supabaseAdmin.from('respect_events').insert(batch);
    if (error) console.error('[Airtable Sync] Events batch error:', error.message);
  }
}

// ─── Step 5: Enrichment — recalculate totals from raw data ──────────

async function enrichAndReconcile(stats: SyncStats) {
  // Fetch all data in parallel
  const [scoresRes, eventsRes, sessionsRes, membersRes] = await Promise.all([
    supabaseAdmin.from('fractal_scores').select('member_name, score, session_id'),
    supabaseAdmin.from('respect_events').select('member_name, event_type, amount'),
    supabaseAdmin.from('fractal_sessions').select('id, session_date').order('session_date', { ascending: true }),
    supabaseAdmin.from('respect_members').select('id, name, first_respect_at'),
  ]);

  // Aggregate fractal scores
  const memberAgg = new Map<string, { fractalTotal: number; sessionIds: Set<string> }>();
  for (const s of scoresRes.data || []) {
    if (!memberAgg.has(s.member_name)) memberAgg.set(s.member_name, { fractalTotal: 0, sessionIds: new Set() });
    const m = memberAgg.get(s.member_name)!;
    m.fractalTotal += Number(s.score);
    m.sessionIds.add(s.session_id);
  }

  // Aggregate events
  const eventAgg = new Map<string, { hosting: number; bonus: number; events: number; hostCount: number }>();
  for (const e of eventsRes.data || []) {
    if (!eventAgg.has(e.member_name)) eventAgg.set(e.member_name, { hosting: 0, bonus: 0, events: 0, hostCount: 0 });
    const m = eventAgg.get(e.member_name)!;
    const amount = Number(e.amount);
    if (e.event_type === 'hosting') { m.hosting += amount; m.hostCount++; }
    else if (e.event_type === 'festival' || e.event_type === 'bonus') { m.bonus += amount; }
    else { m.events += amount; }
  }

  // Session date lookup
  const sessionDateMap = new Map<string, string>();
  for (const s of sessionsRes.data || []) {
    if (s.session_date) sessionDateMap.set(s.id, s.session_date);
  }

  // Build update rows
  const updatePromises: Promise<unknown>[] = [];

  for (const member of membersRes.data || []) {
    const fractal = memberAgg.get(member.name);
    const events = eventAgg.get(member.name);

    const fractalRespect = fractal?.fractalTotal || 0;
    const fractalCount = fractal?.sessionIds.size || 0;
    const hostingRespect = events?.hosting || 0;
    const hostingCount = events?.hostCount || 0;
    const bonusRespect = events?.bonus || 0;
    const eventRespect = events?.events || 0;

    let earliestDate: string | null = null;
    if (fractal) {
      for (const sid of fractal.sessionIds) {
        const d = sessionDateMap.get(sid);
        if (d && (!earliestDate || d < earliestDate)) earliestDate = d;
      }
    }

    const updates: Record<string, unknown> = {
      total_respect: fractalRespect + hostingRespect + bonusRespect + eventRespect,
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

    updatePromises.push(
      supabaseAdmin.from('respect_members').update(updates).eq('id', member.id).then(),
    );
    stats.enriched++;
  }

  // Run all member updates in parallel (small dataset, ~40 members)
  await Promise.allSettled(updatePromises);
}

// ─── Stats ──────────────────────────────────────────────────────────

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

export async function POST() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const airtableToken = process.env.AIRTABLE_TOKEN;
  if (!airtableToken) return NextResponse.json({ error: 'AIRTABLE_TOKEN not configured' }, { status: 500 });

  const stats: SyncStats = {
    wallets: 0, members: 0, sessions: 0, scores: 0,
    hosts: 0, festivals: 0, misc: 0,
    enriched: 0, firstRespectSet: 0, errors: [],
  };

  try {
    // Fetch all 6 tables (parallel — each table is independent)
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

    // 1. Build wallet map (pure computation, no DB)
    const walletMap = buildWalletMap(walletRecords, summaryRecords);
    stats.wallets = walletMap.size;

    // 2. Upsert members (batch)
    console.log('[Airtable Sync] Upserting members...');
    stats.members = await importMembers(summaryRecords, walletMap);

    // 3. Import sessions + scores (batch)
    console.log('[Airtable Sync] Importing sessions + scores...');
    await importSessions(respectRecords, walletMap, stats);

    // 4. Import events — hosts, festivals, misc (batch)
    console.log('[Airtable Sync] Importing events...');
    await importEvents(hostRecords, festivalRecords, miscRecords, stats);

    // 5. Enrichment — recalculate totals
    console.log('[Airtable Sync] Enriching...');
    await enrichAndReconcile(stats);

    console.log('[Airtable Sync] Complete:', JSON.stringify(stats));

    return NextResponse.json({
      success: true,
      stats: {
        wallets: stats.wallets, members: stats.members,
        sessions: stats.sessions, scores: stats.scores,
        hosts: stats.hosts, festivals: stats.festivals, misc: stats.misc,
        enriched: stats.enriched, firstRespectSet: stats.firstRespectSet,
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
