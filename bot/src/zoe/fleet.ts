/**
 * fleet.ts — the driver that puts the per-brand Identity Kit to work (doc 2155).
 *
 * `ingestAllIdentities` iterates the fleet registry (identities.ts) and ingests
 * each brand's mailbox in turn, using that brand's resolved inbox + API key. A
 * brand whose key env var is unset is SKIPPED (not an error) — so with no fleet
 * configured, only the default ZOE identity runs, exactly as today.
 *
 * `loadPersona` reads a brand's persona block (research/identity/personas/*) so
 * the runtime can speak in that brand's voice.
 *
 * IMPORTANT — this is a capability, NOT wired to the scheduler. The scheduler
 * still calls `ingestInbox()` (ZOE's own inbox) directly. Wiring the fleet in is
 * deliberate future work, because ingestInbox currently appends to ONE shared
 * context log; per-brand context separation is the follow-up before the fleet
 * ingest should run automatically (see doc 2155). Until then this is opt-in.
 */

import { readFileSync } from 'node:fs';
import { loadIdentities, resolveEmail, type BrandIdentity } from './identities';
import { ingestInbox, type IngestResult } from './inbox-ingest';

/** Per-brand ingest outcome. `result` is null when the brand was skipped. */
export interface FleetIngestResult {
  brand: string;
  inbox: string;
  result: IngestResult | null;
  skipped?: string;
}

/**
 * Ingest every configured brand identity's inbox. Never throws — a brand with no
 * resolvable key, or whose ingest errors, is recorded as skipped and the loop
 * continues.
 *
 * @param fetchImpl injectable fetch (defaults to global fetch).
 * @param ids the fleet registry (defaults to loadIdentities()).
 * @param env environment for key resolution (defaults to process.env).
 */
export async function ingestAllIdentities(
  fetchImpl: typeof fetch = fetch,
  ids: BrandIdentity[] = loadIdentities(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<FleetIngestResult[]> {
  const out: FleetIngestResult[] = [];
  for (const id of ids) {
    const { brand, inbox, apiKey } = resolveEmail(id, env);
    if (!apiKey) {
      out.push({ brand, inbox, result: null, skipped: `no key in ${id.email.keyEnv}` });
      continue;
    }
    try {
      const result = await ingestInbox(fetchImpl, { inbox, apiKey });
      out.push({ brand, inbox, result });
    } catch (err) {
      out.push({ brand, inbox, result: null, skipped: (err as Error).message });
    }
  }
  return out;
}

/**
 * Load a brand's persona block text from its `personaRef` path. Returns '' when
 * the identity has no personaRef or the file cannot be read — never throws.
 *
 * @param readImpl injectable reader for tests (defaults to fs.readFileSync).
 */
export function loadPersona(
  id: BrandIdentity,
  readImpl: (p: string) => string = (p) => readFileSync(p, 'utf8'),
): string {
  if (!id.personaRef) return '';
  try {
    return readImpl(id.personaRef);
  } catch {
    return '';
  }
}
