// Quick check: who has a code + who has logged in (bio/photo filled).
// Usage: npx tsx scripts/check-stock-team-codes.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from('stock_team_members')
    .select('name, scope, role, bio, photo_url, links, password_hash, created_at')
    .order('scope')
    .order('created_at');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  if (!data) {
    console.log('No rows');
    return;
  }

  const pad = (s: string, n: number) => s.padEnd(n);
  console.log('');
  console.log(
    pad('Name', 20) +
      pad('Scope', 10) +
      pad('Role', 10) +
      pad('Code?', 10) +
      pad('Bio?', 7) +
      pad('Photo?', 8) +
      pad('Links?', 8),
  );
  console.log('-'.repeat(75));
  for (const m of data) {
    const hasCode = m.password_hash && m.password_hash.length > 10 ? 'yes' : 'NO';
    const hasBio = m.bio && m.bio.trim().length > 0 ? 'yes' : '-';
    const hasPhoto = m.photo_url && m.photo_url.trim().length > 0 ? 'yes' : '-';
    const hasLinks = m.links && m.links.trim().length > 0 ? 'yes' : '-';
    console.log(
      pad(m.name, 20) +
        pad(m.scope, 10) +
        pad(m.role, 10) +
        pad(hasCode, 10) +
        pad(hasBio, 7) +
        pad(hasPhoto, 8) +
        pad(hasLinks, 8),
    );
  }

  const withCode = data.filter((m) => m.password_hash && m.password_hash.length > 10).length;
  const loggedIn = data.filter(
    (m) => (m.bio && m.bio.trim()) || (m.photo_url && m.photo_url.trim()),
  ).length;
  console.log('');
  console.log(
    `${data.length} teammates | ${withCode} have codes | ${loggedIn} have logged in (bio or photo filled)`,
  );
}

main();
