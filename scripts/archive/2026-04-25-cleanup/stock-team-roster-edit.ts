// One-shot roster edit: adds `active` column, deactivates DaNici + AttaBotty
// (bandwidth constraints), and inserts Iman Afrikah with a fresh random code.
//
// Outputs ONE SQL block for Supabase + plaintext code for Iman (saved locally).
//
// Usage:
//   npx tsx scripts/stock-team-roster-edit.ts
//   - Copy the SQL block into Supabase SQL Editor and run once
//   - DM Iman his code from the plaintext list

import { config } from 'dotenv';
config({ path: '.env.local' });

import { scryptSync, randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

const DEACTIVATE = ['DaNici', 'AttaBotty'];
const NEW_MEMBER = {
  name: 'Iman Afrikah',
  scope: 'music',
  role: 'member',
};

const code = generateCode();
const hash = hashPassword(code);

console.log('-- ZAOstock roster edit - paste into Supabase SQL Editor and run');
console.log(`-- Generated ${new Date().toISOString()}`);
console.log('');

console.log('BEGIN;');
console.log('');

console.log('-- 1. Ensure `active` column exists (idempotent)');
console.log(
  `ALTER TABLE stock_team_members ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;`,
);
console.log('');

console.log('-- 2. Deactivate (bandwidth constraints - rejoin later)');
for (const name of DEACTIVATE) {
  const safe = name.replace(/'/g, "''");
  console.log(`UPDATE stock_team_members SET active = false WHERE name = '${safe}';`);
}
console.log('');

console.log('-- 3. Insert Iman Afrikah with fresh code');
console.log(
  `INSERT INTO stock_team_members (name, role, scope, password_hash, active) ` +
    `VALUES ('${NEW_MEMBER.name}', '${NEW_MEMBER.role}', '${NEW_MEMBER.scope}', '${hash}', true) ` +
    `ON CONFLICT (name) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = true;`,
);
console.log('');

console.log('COMMIT;');
console.log('');

console.log('-- Verify (expect Iman active=true, DaNici/AttaBotty active=false)');
console.log(
  `SELECT name, scope, role, active FROM stock_team_members WHERE name IN ('Iman Afrikah','DaNici','AttaBotty');`,
);
console.log('');
console.log('');

console.log('-- Plaintext code (DO NOT paste anywhere public):');
console.log(`--   ${NEW_MEMBER.name.padEnd(20)} -> ${code}`);
console.log('');

const plaintextPath = join(
  'scripts',
  `.stock-codes-iman-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`,
);
writeFileSync(
  plaintextPath,
  `ZAOstock new member code - ${new Date().toISOString()}\n\n${NEW_MEMBER.name.padEnd(20)} -> ${code}\n`,
);
console.log(`Saved plaintext to: ${plaintextPath}`);
