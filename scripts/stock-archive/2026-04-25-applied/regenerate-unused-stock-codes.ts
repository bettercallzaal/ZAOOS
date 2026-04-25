// Regenerate codes ONLY for teammates who have not logged in yet.
// "Logged in" = bio OR photo_url is non-empty.
//
// Safe to run even after codes have been sent: rows where the teammate
// already used their code are skipped entirely.
//
// Output:
//   - Plaintext list (per regenerated teammate) — copy to secure notes
//   - SQL UPDATE block — paste into Supabase SQL Editor
//   - Saves the plaintext list to scripts/.stock-codes-<timestamp>.txt
//     (gitignored via the leading dot)
//
// Usage:
//   npx tsx scripts/regenerate-unused-stock-codes.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { scryptSync, randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[randomBytes(1)[0] % ALPHABET.length];
  }
  return code;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const supabase = createClient(url!, key!);

  const { data, error } = await supabase
    .from('stock_team_members')
    .select('id, name, scope, role, bio, photo_url')
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

  const skipList: string[] = [];
  const regenList: typeof data = [];

  for (const m of data) {
    const loggedIn =
      (m.bio && m.bio.trim().length > 0) || (m.photo_url && m.photo_url.trim().length > 0);
    if (loggedIn) {
      skipList.push(m.name);
    } else {
      regenList.push(m);
    }
  }

  const used = new Set<string>();
  const entries = regenList.map((m) => {
    let code = generateCode();
    while (used.has(code)) code = generateCode();
    used.add(code);
    return { ...m, code };
  });

  console.log('');
  console.log(`Skipped (already logged in, code untouched): ${skipList.length}`);
  for (const n of skipList) console.log(`  - ${n}`);
  console.log('');
  console.log(`Regenerating for ${entries.length} teammates:`);
  console.log('');
  console.log('-- Plaintext codes (share privately - DO NOT paste anywhere public):');
  for (const { name, code } of entries) {
    console.log(`--   ${name.padEnd(20)} -> ${code}`);
  }
  console.log('');

  const plaintextPath = join(
    'scripts',
    `.stock-codes-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`,
  );
  const plaintextBody = entries
    .map(({ name, code }) => `${name.padEnd(20)} -> ${code}`)
    .join('\n');
  writeFileSync(
    plaintextPath,
    `ZAOstock team codes - regenerated ${new Date().toISOString()}\nSkipped (already logged in): ${skipList.join(', ') || '(none)'}\n\n${plaintextBody}\n`,
  );
  console.log(`Saved plaintext list to: ${plaintextPath}`);
  console.log('(gitignored via leading dot in the scripts/.gitignore pattern, but double-check)');
  console.log('');

  console.log('BEGIN;');
  for (const { id, code } of entries) {
    const hash = hashPassword(code);
    console.log(
      `UPDATE stock_team_members SET password_hash = '${hash}' WHERE id = '${id}';`,
    );
  }
  console.log('COMMIT;');
  console.log('');
  console.log(
    `Copy the BEGIN..COMMIT block above into Supabase SQL Editor, run it, then DM each teammate their new code from the plaintext list.`,
  );
}

main();
