// Generates SQL UPDATE statements to set every ZAOstock team member's
// password to their first 4 letters (uppercase). Codes are case-insensitive
// at login time — stored hash is always uppercase.
//
// Usage:
//   npx tsx scripts/set-stock-team-4letter-codes.ts
//
// Copy the printed SQL block into Supabase SQL Editor and run.

import { scryptSync, randomBytes } from 'crypto';

const TEAM = [
  'Zaal',
  'Candy',
  'FailOften',
  'Hurric4n3Ike',
  'Swarthy Hatter',
  'DaNici',
  'Shawn',
  'DCoop',
  'AttaBotty',
  'Tyler Stambaugh',
  'Ohnahji B',
  'DFresh',
  'Craig G',
  'Maceo',
];

function code(name: string): string {
  return name.replace(/\s+/g, '').slice(0, 4).toUpperCase();
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const codes = TEAM.map((name) => ({ name, code: code(name) }));

// Verify uniqueness
const codeSet = new Set(codes.map((c) => c.code));
if (codeSet.size !== codes.length) {
  console.error('COLLISION: two members share a 4-letter code. Resolve before running.');
  process.exit(1);
}

console.log('-- ZAOstock Team: 4-letter password codes');
console.log('-- Paste this into Supabase SQL Editor and run.');
console.log('-- Distribute each teammate their code via DM.\n');

console.log('-- Codes (plaintext — share these, not the hashes below):');
for (const { name, code: c } of codes) {
  console.log(`--   ${name.padEnd(20)} → ${c}`);
}
console.log('');

console.log('BEGIN;');
for (const { name, code: c } of codes) {
  const hash = hashPassword(c);
  console.log(`UPDATE stock_team_members SET password_hash = '${hash}' WHERE name = '${name.replace(/'/g, "''")}';`);
}
console.log('COMMIT;');
