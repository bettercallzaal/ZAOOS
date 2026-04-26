/**
 * Register CASTER's Farcaster FID via fid-forge API (x402 payment)
 *
 * Uses x402-fetch to auto-handle the 402 payment flow with USDC on Base.
 *
 * Usage:
 *   npx tsx scripts/register-caster-fid.ts
 *   npx tsx scripts/register-caster-fid.ts --continue
 */

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { config } from 'dotenv';
import * as crypto from 'crypto';
import * as fs from 'fs';

config({ path: '.env.local' });

const FIDFORGE_BASE = 'https://fidforge.11211.me/v1/farcaster';

const PROFILE = {
  username: 'zaocaster',
  displayName: 'THE ZAO BOT',
  bio: "ZAO's voice on Farcaster. Music community, built in public.",
  pfpUrl: 'https://zaoos.com/logo.png',
  url: 'https://zaoos.com',
  welcomeCast: "hi, i'm here to start sharing more of what the ZAO is building. feel free to tell me suggestions and help me along the way",
};

async function main() {
  const privateKey = process.env.AGENT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Missing AGENT_WALLET_PRIVATE_KEY in .env.local');
    process.exit(1);
  }

  const custodyAccount = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`Custody address: ${custodyAccount.address}`);

  // Generate Ed25519 signer keypair
  const signerPrivateKeyBytes = crypto.randomBytes(32);
  const signerPrivateKeyHex = `0x${signerPrivateKeyBytes.toString('hex')}`;
  const ed = await import('@noble/ed25519');
  const signerPubKeyBytes = await ed.getPublicKey(signerPrivateKeyBytes);
  const signerPubKeyHex = `0x${Buffer.from(signerPubKeyBytes).toString('hex')}`;
  console.log(`Signer public key: ${signerPubKeyHex}`);

  // Check username
  console.log(`\nChecking username "${PROFILE.username}"...`);
  const nameCheck = await fetch(`${FIDFORGE_BASE}/fname/${PROFILE.username}/available`);
  const nameResult = await nameCheck.json();
  if (!nameResult.available) {
    console.error(`Username "${PROFILE.username}" is taken!`);
    process.exit(1);
  }
  console.log(`Username "${PROFILE.username}" is available!`);

  // Register — try x402 first, if 402 format is non-standard fall back to Stripe
  console.log('\nCreating registration...');

  // First try x402
  const x402Response = await fetch(`${FIDFORGE_BASE}/payments/x402/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: custodyAccount.address,
      signerPubKey: signerPubKeyHex,
      recoveryAddress: custodyAccount.address,
    }),
  });

  let regResult;

  if (x402Response.status === 402) {
    // Check if it has standard x402 headers
    const paymentRequired = x402Response.headers.get('x-payment-required');
    console.log(`Got 402. X-PAYMENT-REQUIRED header: ${paymentRequired ? 'present' : 'missing'}`);

    if (paymentRequired) {
      // Standard x402 — sign and retry
      console.log('Handling x402 payment...');
      const { createSigner: createX402Signer } = await import('x402-fetch');
      const signer = await createX402Signer('base', privateKey);

      const requirements = JSON.parse(Buffer.from(paymentRequired, 'base64').toString());
      console.log('Payment requirements:', JSON.stringify(requirements, null, 2));

      // Sign the payment
      const paymentPayload = await signer.sign(requirements);
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      // Retry with payment
      const paidResponse = await fetch(`${FIDFORGE_BASE}/payments/x402/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': paymentHeader,
        },
        body: JSON.stringify({
          address: custodyAccount.address,
          signerPubKey: signerPubKeyHex,
          recoveryAddress: custodyAccount.address,
        }),
      });
      regResult = await paidResponse.json();
    } else {
      // Non-standard 402 — try reading body for payment instructions
      const body402 = await x402Response.text();
      console.log('402 body:', body402.substring(0, 500));

      // Fall back to Stripe
      console.log('\nFalling back to Stripe checkout...');
      const stripeResponse = await fetch(`${FIDFORGE_BASE}/payments/stripe/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: custodyAccount.address,
          signerPubKey: signerPubKeyHex,
          recoveryAddress: custodyAccount.address,
        }),
      });
      regResult = await stripeResponse.json();

      if (regResult.payment?.checkoutUrl) {
        console.log(`\n>>> Pay here: ${regResult.payment.checkoutUrl}`);
        // Save state for --continue
        const state = {
          registrationId: regResult.registrationId,
          custodyAddress: custodyAccount.address,
          signerPrivateKey: signerPrivateKeyHex,
          signerPubKey: signerPubKeyHex,
          profile: PROFILE,
          created: new Date().toISOString(),
        };
        fs.writeFileSync('.caster-registration.json', JSON.stringify(state, null, 2));
        console.log(`\nAfter payment, run: npx tsx scripts/register-caster-fid.ts --continue`);
        return;
      }
    }
  } else {
    regResult = await x402Response.json();
  }
  console.log(`Registration ID: ${regResult.registrationId}`);
  console.log(`Status: ${regResult.status}`);

  if (!regResult.registrationId) {
    console.error('Registration failed:', regResult);
    process.exit(1);
  }

  // Save state
  const state = {
    registrationId: regResult.registrationId,
    custodyAddress: custodyAccount.address,
    signerPrivateKey: signerPrivateKeyHex,
    signerPubKey: signerPubKeyHex,
    profile: PROFILE,
    created: new Date().toISOString(),
  };
  fs.writeFileSync('.caster-registration.json', JSON.stringify(state, null, 2));

  await completeRegistration(regResult.registrationId, custodyAccount, signerPrivateKeyHex, signerPubKeyHex);
}

async function completeRegistration(
  registrationId: string,
  custodyAccount: ReturnType<typeof privateKeyToAccount>,
  signerPrivateKeyHex: string,
  signerPubKeyHex: string
) {
  // Check current status
  console.log('\nChecking registration status...');
  const statusResp = await fetch(`${FIDFORGE_BASE}/registrations/${registrationId}`);
  const statusResult = await statusResp.json();
  console.log(`Current status: ${statusResult.status}`);

  if (statusResult.status === 'COMPLETED') {
    console.log(`Already completed! FID: ${statusResult.fid}`);
    saveCredentials(statusResult, signerPrivateKeyHex, signerPubKeyHex);
    return;
  }

  if (statusResult.status === 'AWAITING_PAYMENT') {
    console.log('Still awaiting payment. x402 may not have settled yet.');
    console.log('Try again in a few seconds.');
    return;
  }

  if (statusResult.status !== 'AWAITING_SIGNATURES') {
    console.log(`Unexpected status: ${statusResult.status}`);
    if (statusResult.status === 'SUBMITTED_ONCHAIN') {
      await pollForCompletion(registrationId, signerPrivateKeyHex, signerPubKeyHex);
      return;
    }
    return;
  }

  // Get signing instructions
  console.log('\nFetching EIP-712 signing instructions...');
  const instrResponse = await fetch(`${FIDFORGE_BASE}/registrations/${registrationId}/instructions`);
  const instrResult = await instrResponse.json();

  if (!instrResult.typedData) {
    console.error('No typedData in instructions:', instrResult);
    return;
  }

  const { typedData } = instrResult;

  // Sign both EIP-712 messages
  console.log('Signing Register transaction...');
  const registerSignature = await custodyAccount.signTypedData({
    domain: typedData.register.domain,
    types: typedData.register.types,
    primaryType: typedData.register.primaryType,
    message: typedData.register.message,
  });

  console.log('Signing Add Key transaction...');
  const addSignature = await custodyAccount.signTypedData({
    domain: typedData.add.domain,
    types: typedData.add.types,
    primaryType: typedData.add.primaryType,
    message: typedData.add.message,
  });

  // Submit signatures
  console.log('Submitting signatures...');
  const sigResponse = await fetch(`${FIDFORGE_BASE}/registrations/${registrationId}/signatures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registerSignature, addSignature }),
  });

  const sigResult = await sigResponse.json();
  console.log(`Status: ${sigResult.status}`);

  await pollForCompletion(registrationId, signerPrivateKeyHex, signerPubKeyHex);
}

async function pollForCompletion(registrationId: string, signerPrivateKeyHex: string, signerPubKeyHex: string) {
  console.log('\nPolling for on-chain confirmation...');
  let attempts = 0;

  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    const pollResponse = await fetch(`${FIDFORGE_BASE}/registrations/${registrationId}`);
    const result = await pollResponse.json();
    process.stdout.write('.');

    if (result.status === 'COMPLETED') {
      console.log(`\n\n=== CASTER FID REGISTERED ===`);
      console.log(`FID: ${result.fid}`);
      console.log(`Address: ${result.address}`);
      console.log(`Register TX: ${result.tx?.register}`);
      console.log(`Add Key TX: ${result.tx?.addKey}`);
      saveCredentials(result, signerPrivateKeyHex, signerPubKeyHex);
      return;
    }

    if (result.status === 'FAILED' || result.status === 'EXPIRED') {
      console.error(`\nRegistration ${result.status}:`, result.error);
      return;
    }

    attempts++;
  }

  console.log('\nTimed out waiting. Check status later with --continue');
}

function saveCredentials(result: any, signerPrivateKeyHex: string, signerPubKeyHex: string) {
  const creds = {
    fid: result.fid,
    username: PROFILE.username,
    custodyAddress: result.address,
    signerPrivateKey: signerPrivateKeyHex,
    signerPubKey: signerPubKeyHex,
    registerTx: result.tx?.register,
    addKeyTx: result.tx?.addKey,
    registered: new Date().toISOString(),
  };
  fs.writeFileSync('.caster-credentials.json', JSON.stringify(creds, null, 2));
  console.log('\nCredentials saved to .caster-credentials.json');
}

// Handle --continue flag
if (process.argv.includes('--continue')) {
  const stateFile = '.caster-registration.json';
  if (!fs.existsSync(stateFile)) {
    console.error('No .caster-registration.json found. Run without --continue first.');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  const privateKey = process.env.AGENT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Missing AGENT_WALLET_PRIVATE_KEY');
    process.exit(1);
  }
  const custodyAccount = privateKeyToAccount(privateKey as `0x${string}`);
  completeRegistration(state.registrationId, custodyAccount, state.signerPrivateKey, state.signerPubKey);
} else {
  main().catch(console.error);
}
