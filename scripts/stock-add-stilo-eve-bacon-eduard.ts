// One-shot: add Stilo, Eve, Bacon, Eduard to stock_team_members with NEW
// individual codes. Does NOT touch any existing teammate's code.
//
// Per memory feedback_no_regenerate_codes.md: never re-run the all-team
// random-codes script after codes have been sent.
//
// Usage: npx tsx scripts/stock-add-stilo-eve-bacon-eduard.ts
// Then paste the printed SQL into Supabase SQL Editor + DM each their code.

import { scryptSync, randomBytes } from 'crypto';

const NEW_TEAM: Array<{ name: string; role: string; scope: string }> = [
  { name: 'Stilo', role: 'member', scope: 'ops' },
  { name: 'Eve', role: 'member', scope: 'ops' },
  { name: 'Bacon', role: 'member', scope: 'ops' },
  { name: 'Eduard', role: 'member', scope: 'ops' },
];

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

const used = new Set<string>();
const entries = NEW_TEAM.map((m) => {
  let code = generateCode();
  while (used.has(code)) code = generateCode();
  used.add(code);
  return { ...m, code };
});

console.log('-- ZAOstock: add Stilo, Eve, Bacon, Eduard with new codes');
console.log('-- Idempotent on name (UPDATE if exists).');
console.log('-- DOES NOT alter other teammates.\n');

console.log('-- Plaintext (DM each privately, never paste publicly):');
for (const { name, code } of entries) {
  console.log(`--   ${name.padEnd(10)} -> ${code}`);
}
console.log('');

console.log('BEGIN;');
for (const { name, code, role, scope } of entries) {
  const hash = hashPassword(code);
  const safeName = name.replace(/'/g, "''");
  console.log(
    `INSERT INTO stock_team_members (name, role, scope, password_hash, active) ` +
      `VALUES ('${safeName}', '${role}', '${scope}', '${hash}', true) ` +
      `ON CONFLICT (name) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, scope = EXCLUDED.scope, active = true;`,
  );
}
console.log('COMMIT;');
