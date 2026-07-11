/**
 * cli.ts - the operator cockpit from a terminal.
 *
 * Prints the exact same brief ZOE's /cockpit command shows, so the cockpit is
 * equally reachable from the desktop (via the ~/bin/zao-cockpit wrapper) and
 * from Telegram. Read-only. Run: `npx tsx src/cockpit/cli.ts`.
 */
import { buildCockpitBrief, formatCockpitBrief } from './brief';

async function main(): Promise<void> {
  const brief = await buildCockpitBrief('brief');
  console.log(formatCockpitBrief(brief));
}

main().catch((e: unknown) => {
  console.error('cockpit cli failed:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
