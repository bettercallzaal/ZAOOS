/**
 * One-shot: register the ZAO OS Juke webhook receiver with Juke's developer
 * webhook API (Juke PR 2026-05-23, POST /v1/developer/webhooks).
 *
 *   npx tsx scripts/register-juke-webhook.ts <url>
 *
 * Reads JUKE_API_KEY + JUKE_WEBHOOK_SECRET from .env.local. The URL defaults
 * to https://zaoos.com/api/juke/webhooks. After the first successful run
 * Juke starts POSTing signed deliveries; verify with `gh logs` or the
 * juke_webhook_events table in Supabase.
 *
 * Per llms.txt: max 5 subscriptions per app; unique (app_id, url). Re-running
 * with the same URL returns the existing subscription, not a duplicate.
 */
import * as fs from 'fs';

interface JukeWebhookRegisterResponse {
  id?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
  [k: string]: unknown;
}

function loadEnv(): Record<string, string> {
  let raw: string;
  try {
    raw = fs.readFileSync('.env.local', 'utf8');
  } catch {
    console.error('Could not read .env.local - run this from the repo root.');
    process.exit(1);
  }
  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const apiKey = env.JUKE_API_KEY;
  const secret = env.JUKE_WEBHOOK_SECRET;
  if (!apiKey) {
    console.error('Missing JUKE_API_KEY in .env.local.');
    process.exit(1);
  }
  if (!secret) {
    console.error('Missing JUKE_WEBHOOK_SECRET in .env.local. Generate one:');
    console.error('  openssl rand -hex 32');
    process.exit(1);
  }

  const url = process.argv[2] ?? 'https://zaoos.com/api/juke/webhooks';
  console.log('Registering Juke webhook for', url);

  const res = await fetch('https://api.juke.audio/v1/developer/webhooks', {
    method: 'POST',
    headers: {
      'X-Juke-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      secret,
      events: [
        'room.started',
        'room.finished',
        'participant.joined',
        'participant.left',
        'recording.ready',
      ],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED - status ${res.status}`);
    console.error(text);
    process.exit(1);
  }

  let body: JukeWebhookRegisterResponse;
  try {
    body = JSON.parse(text);
  } catch {
    console.log('OK - Juke returned non-JSON body (logged below):');
    console.log(text);
    return;
  }

  console.log('OK - webhook registered.');
  console.log('  id      ', body.id ?? '(not returned)');
  console.log('  url     ', body.url ?? url);
  console.log('  events  ', body.events ?? '(not returned)');
  console.log('  enabled ', body.enabled ?? '(not returned)');
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
