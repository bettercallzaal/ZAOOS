import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as crypto from 'crypto';
import * as fs from 'fs';

// Generate a new Ethereum keypair for the app signer
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('=== ZAO OS App Signer Wallet ===');
console.log('');
console.log('Address:', account.address);
console.log('Private Key:', privateKey);
console.log('');
console.log('Add this to your .env.local:');
console.log(`APP_SIGNER_PRIVATE_KEY=${privateKey}`);
console.log('');

// Create encrypted backup
const password = crypto.randomBytes(16).toString('hex');
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
let encrypted = cipher.update(privateKey, 'utf8', 'hex');
encrypted += cipher.final('hex');

const backup = JSON.stringify({
  address: account.address,
  encrypted: encrypted,
  iv: iv.toString('hex'),
  algorithm: 'aes-256-cbc',
  created: new Date().toISOString(),
});

fs.writeFileSync('.wallet-backup.enc', backup);
console.log('Encrypted backup saved to .wallet-backup.enc');
console.log('Backup password (save this somewhere safe):', password);
console.log('');
console.log('IMPORTANT: Never share the private key. Never commit .env.local or .wallet-backup.enc');
