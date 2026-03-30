import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import Papa from 'papaparse';
import { csvRowSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Max 1MB
    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 400 });
    }

    const text = await file.text();
    const { data: rows } = Papa.parse(text, { header: false, skipEmptyLines: true });

    if (rows.length > 1000) {
      return NextResponse.json({ error: 'Too many rows (max 1000)' }, { status: 400 });
    }

    const entries: { ign: string; wallet_address: string }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as string[];
      const ign = row[0]?.trim();
      const wallet = row[1]?.trim().replace(/,+$/, ''); // Strip trailing commas

      const parsed = csvRowSchema.safeParse({ ign, wallet_address: wallet });
      if (parsed.success) {
        entries.push(parsed.data);
      } else {
        errors.push(`Row ${i + 1}: invalid data`);
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No valid entries found', errors }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('allowlist')
      .upsert(entries, { onConflict: 'wallet_address', ignoreDuplicates: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      imported: entries.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
  }
}
