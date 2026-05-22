/**
 * Smoke-test the Juke developer API (research doc 695, Path B).
 *
 * Run this ONCE after JUKE_API_KEY + JUKE_USER_TOKEN land in `.env.local`.
 * It creates a throwaway Juke space and prints the result — confirming the
 * credentials work end-to-end and revealing the (undocumented) create-space
 * response shape before the live `/api/juke/space` route is relied on.
 *
 * If the response shape differs from what `extractSpaceId` expects, this is
 * where it shows up first.
 *
 *   npx tsx scripts/test-juke-space.ts
 *
 * Reads secrets from `.env.local` (gitignored) and prints them only as
 * "set" / "MISSING" — never the values.
 */
import * as fs from 'fs';
import { createJukeSpace } from '../src/lib/spaces/juke-api';

/** Parse `.env.local` from the repo root into a flat key-value map. */
function loadEnv(): Record<string, string> {
  let raw: string;
  try {
    raw = fs.readFileSync('.env.local', 'utf8');
  } catch {
    console.error('Could not read .env.local — run this from the repo root.');
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
  const userToken = env.JUKE_USER_TOKEN;

  if (!apiKey || !userToken) {
    console.error('Missing Juke credentials in .env.local:');
    console.error('  JUKE_API_KEY    ', apiKey ? 'set' : 'MISSING');
    console.error('  JUKE_USER_TOKEN ', userToken ? 'set' : 'MISSING');
    console.error('Apply at juke.audio/developers, then add both to .env.local.');
    process.exit(1);
  }

  const title = `ZAO smoke test ${new Date().toISOString()}`;
  console.log('Creating Juke space:', title);

  const result = await createJukeSpace(
    { title, allowAgents: true },
    { apiKey, userToken },
  );

  if (!result.ok) {
    console.error(`FAILED — status ${result.status} — ${result.error}`);
    process.exit(1);
  }

  console.log('OK — space created.');
  console.log('  id        ', result.space.id);
  console.log('  embedUrl  ', result.space.embedUrl);
  console.log('  ZAO route ', `/live/${result.space.id}`);
  console.log('Raw Juke response:');
  console.log(JSON.stringify(result.space.raw, null, 2));
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
