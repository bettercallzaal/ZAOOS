/**
 * Smoke-test the Juke developer API (research doc 695, Path B).
 *
 * Run this ONCE after JUKE_API_KEY lands in `.env.local`. Juke's
 * `/v1/developer/spaces` is key-only per llms.txt (room owner = the app's
 * owner_fid). It creates a throwaway Juke space and prints the result —
 * confirming the credential works end-to-end and revealing the (undocumented)
 * create-space response shape before the live `/api/juke/space` route is
 * relied on.
 *
 * If the response shape differs from what `extractSpaceId` expects, this is
 * where it shows up first.
 *
 *   npx tsx scripts/test-juke-space.ts
 *
 * Reads JUKE_API_KEY from `.env.local` (gitignored) and prints it only as
 * "set" / "MISSING" — never the value.
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

  if (!apiKey) {
    console.error('Missing JUKE_API_KEY in .env.local.');
    console.error('Apply at juke.audio/developers, then add it to .env.local.');
    process.exit(1);
  }

  const title = `ZAO smoke test ${new Date().toISOString()}`;
  console.log('Creating Juke space:', title);

  const result = await createJukeSpace(
    { title, allowAgents: true },
    { apiKey },
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
