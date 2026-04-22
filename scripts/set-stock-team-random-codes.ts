// Generates RANDOMIZED 4-character codes (letters + digits, no 0/O/1/I to
// avoid confusion) for every ZAOstock team member. Unlike the name-based
// script, these are unguessable by knowing someone's name.
//
// Output: SQL upsert block for Supabase + a plaintext list of codes
// grouped per-person so Zaal can DM each teammate their code privately.
//
// Usage:
//   npx tsx scripts/set-stock-team-random-codes.ts
//
// Copy the printed SQL block into Supabase SQL Editor and run.
// Then DM each teammate their code from the plaintext list at the top.

import { scryptSync, randomBytes } from 'crypto';

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
  { name: 'Tyler Stambaugh', role: 'advisory', scope: 'finance' },
  { name: 'Ohnahji B', role: 'member', scope: 'finance' },
  { name: 'DFresh', role: 'member', scope: 'finance' },
  { name: 'Craig G', role: 'member', scope: 'finance' },
  { name: 'Maceo', role: 'member', scope: 'finance' },
  { name: 'Jango', role: 'member', scope: 'ops' },
];

// Unambiguous alphabet - no 0, O, 1, I, L
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

// Ensure uniqueness across the roster
const used = new Set<string>();
const entries = TEAM.map((m) => {
  let code = generateCode();
  while (used.has(code)) code = generateCode();
  used.add(code);
  return { ...m, code };
});

console.log('-- ZAOstock Team: randomized 4-char codes');
console.log('-- Paste into Supabase SQL Editor and run.');
console.log('-- Then DM each teammate their code from the plaintext list below.\n');

console.log('-- Plaintext codes (share privately - do NOT paste these anywhere public):');
for (const { name, code } of entries) {
  console.log(`--   ${name.padEnd(20)} -> ${code}`);
}
console.log('');

console.log('BEGIN;');
for (const { name, code, role, scope } of entries) {
  const hash = hashPassword(code);
  const safeName = name.replace(/'/g, "''");
  console.log(
    `INSERT INTO stock_team_members (name, role, scope, password_hash) ` +
    `VALUES ('${safeName}', '${role}', '${scope}', '${hash}') ` +
    `ON CONFLICT (name) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;`,
  );
}
console.log('COMMIT;');
