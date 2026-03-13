/**
 * One-time script to register the Neynar webhook for ZAO OS channel casts.
 *
 * Run with:
 *   npx tsx scripts/register-neynar-webhook.ts
 *
 * Requires NEYNAR_API_KEY in .env.local
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
if (!NEYNAR_API_KEY) {
  console.error('Missing NEYNAR_API_KEY in .env.local');
  process.exit(1);
}

// Update this to your production URL
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/neynar`
  : 'https://zaoos.com/api/webhooks/neynar';

// Farcaster channel root_parent_urls — these are the official channel identifiers
const CHANNEL_ROOT_URLS = [
  'https://warpcast.com/~/channel/zao',
  'https://warpcast.com/~/channel/zabal',
  'https://warpcast.com/~/channel/coc',
];

async function registerWebhook() {
  console.log(`Registering webhook → ${WEBHOOK_URL}`);
  console.log(`Channels: ${CHANNEL_ROOT_URLS.join(', ')}\n`);

  const res = await fetch('https://api.neynar.com/v2/farcaster/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NEYNAR_API_KEY!,
    },
    body: JSON.stringify({
      name: 'zao-channel-casts',
      url: WEBHOOK_URL,
      subscription: {
        'cast.created': {
          root_parent_urls: CHANNEL_ROOT_URLS,
        },
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Failed to register webhook:', data);
    process.exit(1);
  }

  console.log('✓ Webhook registered successfully');
  console.log(`  ID:     ${data.webhook?.webhook_id}`);
  console.log(`  Secret: ${data.webhook?.secrets?.[0]?.value ?? '(check Neynar dashboard)'}`);
  console.log('\nNext steps:');
  console.log('  1. Copy the secret above');
  console.log('  2. Add NEYNAR_WEBHOOK_SECRET=<secret> to .env.local');
  console.log('  3. Add the same variable to Vercel environment variables');
  console.log('  4. Redeploy on Vercel');
}

registerWebhook().catch(console.error);
