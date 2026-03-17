import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const AIRTABLE_BASE_ID = 'appTUNG04rjZ9kSF4';
const AIRTABLE_TABLE = 'Respect';
const AIRTABLE_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Known summary/non-session fields to skip when counting fractals
const SKIP_FIELDS = new Set([
  'Name', 'Wallet', 'Total Respect', 'On-chain Balance',
  'Fractal Respect', 'Events/Contributions', 'Hosting', 'Bonus/Festival',
  'id', 'createdTime',
]);

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function fetchAllRecords(token: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const headers = { Authorization: `Bearer ${token}` };

  do {
    const url = new URL(`${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable error ${res.status}: ${text}`);
    }

    const data = await res.json();
    for (const record of data.records || []) {
      records.push({ id: record.id, fields: record.fields });
    }
    offset = data.offset;
  } while (offset);

  return records;
}

function findField(
  fieldNames: Set<string>,
  candidates: string[],
): string | null {
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

/**
 * POST /api/admin/respect-import
 * Admin-only: fetch all records from Airtable "Respect" table and upsert
 * into respect_members. Returns { imported, errors }.
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
      { error: 'AIRTABLE_TOKEN not configured on server' },
      { status: 500 },
    );
  }

  try {
    // 1. Fetch all records from Airtable
    const records = await fetchAllRecords(airtableToken);
    if (records.length === 0) {
      return NextResponse.json({ imported: 0, errors: ['No records found in Airtable'] });
    }

    // 2. Detect field names across all records
    const fieldNames = new Set<string>();
    for (const record of records) {
      for (const key of Object.keys(record.fields)) {
        fieldNames.add(key);
      }
    }

    const nameField = findField(fieldNames, ['Name', 'name', 'Member', 'member']) || 'Name';
    const walletField = findField(fieldNames, ['Wallet', 'wallet', 'Wallet Address', 'wallet_address']) || 'Wallet';
    const totalField = findField(fieldNames, ['Total Respect', 'Total', 'total_respect']);
    const fractalField = findField(fieldNames, ['Fractal Respect', 'Fractal', 'fractal_respect', 'S.']);
    const eventField = findField(fieldNames, ['Events/Contributions', 'Events', 'Contributions']);
    const hostingField = findField(fieldNames, ['Hosting', 'hosting']);
    const bonusField = findField(fieldNames, ['Bonus/Festival', 'Bonus', 'Festival']);
    const onchainField = findField(fieldNames, ['On-chain Balance', 'On-chain', 'Onchain']);

    // Identify summary fields so we can find numeric session columns
    const summaryFields = new Set(
      [nameField, walletField, totalField, fractalField, eventField, hostingField, bonusField, onchainField, 'id', 'createdTime']
        .filter(Boolean) as string[],
    );

    // Detect numeric (session) columns — any non-summary column that has a numeric value in any record
    const numericColumns: string[] = [];
    for (const f of fieldNames) {
      if (summaryFields.has(f) || SKIP_FIELDS.has(f)) continue;
      const hasNumeric = records.some(
        (r) => typeof r.fields[f] === 'number' && (r.fields[f] as number) > 0,
      );
      if (hasNumeric) numericColumns.push(f);
    }

    // 3. Upsert each record into respect_members
    let imported = 0;
    const errors: string[] = [];

    for (const record of records) {
      const fields = record.fields;
      const name = fields[nameField] as string | undefined;
      if (!name) continue;

      const wallet = ((fields[walletField] as string)?.trim()?.toLowerCase()) || null;
      const total = (totalField ? (fields[totalField] as number) : 0) || 0;
      const fractal = (fractalField ? (fields[fractalField] as number) : 0) || 0;
      const events = (eventField ? (fields[eventField] as number) : 0) || 0;
      const hosting = (hostingField ? (fields[hostingField] as number) : 0) || 0;
      const bonus = (bonusField ? (fields[bonusField] as number) : 0) || 0;
      const onchain = (onchainField ? (fields[onchainField] as number) : 0) || 0;

      // Count fractal attendance from numeric session columns
      let fractalCount = 0;
      for (const col of numericColumns) {
        const val = fields[col] as number;
        if (val && val > 0) fractalCount++;
      }

      const row = {
        name,
        wallet_address: wallet || null,
        total_respect: total,
        fractal_respect: fractal,
        event_respect: events,
        hosting_respect: hosting,
        bonus_respect: bonus,
        onchain_og: onchain,
        fractal_count: fractalCount,
        updated_at: new Date().toISOString(),
      };

      // Upsert by name (since not all members have wallets)
      const { error: upsertErr } = await supabaseAdmin
        .from('respect_members')
        .upsert(row, { onConflict: 'name' });

      if (upsertErr) {
        errors.push(`${name}: ${upsertErr.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({ imported, errors: errors.length > 0 ? errors : [] });
  } catch (err) {
    console.error('Airtable import error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 });
  }
}
