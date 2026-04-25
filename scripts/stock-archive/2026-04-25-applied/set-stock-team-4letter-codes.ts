// Generates SQL UPDATE statements to set every ZAOstock team member's
// password to their first 4 letters (uppercase). Codes are case-insensitive
// at login time — stored hash is always uppercase.
//
// Usage:
//   npx tsx scripts/set-stock-team-4letter-codes.ts
//
// Copy the printed SQL block into Supabase SQL Editor and run.

import { scryptSync, randomBytes } from 'crypto';

// role/scope for new members (existing members won't be re-roled by this script;
// the upsert only sets password_hash, role, and scope on INSERT)
const TEAM: Array<{ name: string; role: string; scope: string }> = [
  { name: 'Zaal', role: 'lead', scope: 'ops' },
  { name: 'Candy', role: '2nd', scope: 'ops' },
  { name: 'FailOften', role: 'member', scope: 'ops' },
  { name: 'Hurric4n3Ike', role: 'member', scope: 'ops' },
  { name: 'Swarthy Hatter', role: 'member', scope: 'ops' },
  { name: 'DaNici', role: 'lead', scope: 'design' },
  { name: 'Shawn', role: 'member', scope: 'design' },
  { name: 'DCoop', role: '2nd', scope: 'music' },
  { name: 'AttaBotty', role: 'member', scope: 'music' },
  { name: 'Tyler Stambaugh', role: 'member', scope: 'finance' },
  { name: 'Ohnahji B', role: 'member', scope: 'finance' },
  { name: 'DFresh', role: 'member', scope: 'finance' },
  { name: 'Craig G', role: 'member', scope: 'finance' },
  { name: 'Maceo', role: 'member', scope: 'finance' },
  { name: 'Jango', role: 'member', scope: 'ops' },
];

function code(name: string): string {
  return name.replace(/\s+/g, '').slice(0, 4).toUpperCase();
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const entries = TEAM.map((m) => ({ ...m, code: code(m.name) }));

// Verify uniqueness
const codeSet = new Set(entries.map((c) => c.code));
if (codeSet.size !== entries.length) {
  console.error('COLLISION: two members share a 4-letter code. Resolve before running.');
  process.exit(1);
}

console.log('-- ZAOstock Team: 4-letter password codes + member upsert');
console.log('-- Paste this into Supabase SQL Editor and run.');
console.log('-- Distribute each teammate their code via DM.\n');

console.log('-- Codes (plaintext - share these, not the hashes below):');
for (const { name, code: c } of entries) {
  console.log(`--   ${name.padEnd(20)} -> ${c}`);
}
console.log('');

console.log('BEGIN;');
for (const { name, code: c, role, scope } of entries) {
  const hash = hashPassword(c);
  const safeName = name.replace(/'/g, "''");
  // Upsert: creates new members, updates password_hash for existing ones.
  // Role/scope only set on INSERT - does not overwrite existing role/scope.
  console.log(
    `INSERT INTO stock_team_members (name, role, scope, password_hash) ` +
    `VALUES ('${safeName}', '${role}', '${scope}', '${hash}') ` +
    `ON CONFLICT (name) DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
  );
}
console.log('COMMIT;');
