// Generate fresh login codes for one or more named teammates.
// Prints plaintext + SQL UPDATE block. Saves plaintext locally (gitignored).
//
// Usage:
//   npx tsx scripts/stock-reset-code.ts Shawn
//   npx tsx scripts/stock-reset-code.ts Shawn Zaal

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

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('Usage: npx tsx scripts/stock-reset-code.ts <Name1> [Name2] ...');
  process.exit(1);
}

const used = new Set<string>();
const entries = names.map((name) => {
  let code = generateCode();
  while (used.has(code)) code = generateCode();
  used.add(code);
  return { name, code, hash: hashPassword(code) };
});

console.log('-- ZAOstock code reset');
console.log(`-- Generated ${new Date().toISOString()}`);
console.log('');
console.log('BEGIN;');
for (const { name, hash } of entries) {
  const safe = name.replace(/'/g, "''");
  console.log(`UPDATE stock_team_members SET password_hash = '${hash}' WHERE name = '${safe}';`);
}
console.log('COMMIT;');
console.log('');
console.log('-- Plaintext codes (DO NOT paste anywhere public):');
for (const { name, code } of entries) {
  console.log(`--   ${name.padEnd(20)} -> ${code}`);
}
console.log('');

const plaintextPath = join(
  'scripts',
  `.stock-codes-reset-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`,
);
writeFileSync(
  plaintextPath,
  `ZAOstock code reset - ${new Date().toISOString()}\n\n${entries.map((e) => `${e.name.padEnd(20)} -> ${e.code}`).join('\n')}\n`,
);
console.log(`Saved plaintext to: ${plaintextPath}`);
