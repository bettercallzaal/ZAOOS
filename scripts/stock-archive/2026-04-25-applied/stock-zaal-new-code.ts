// Generate a fresh login code for Zaal. Prints plaintext + SQL UPDATE.
// Usage: npx tsx scripts/stock-zaal-new-code.ts

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

const code = generateCode();
const hash = hashPassword(code);

console.log('-- Zaal password reset');
console.log(`-- Generated ${new Date().toISOString()}`);
console.log('');
console.log(`UPDATE stock_team_members SET password_hash = '${hash}' WHERE name = 'Zaal';`);
console.log('');
console.log(`Plaintext code: ${code}`);

writeFileSync(
  join('scripts', `.stock-codes-zaal-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`),
  `Zaal reset code - ${new Date().toISOString()}\n\nZaal -> ${code}\n`,
);
