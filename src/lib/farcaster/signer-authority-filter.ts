/**
 * Keep casts signed by a removed key out of what we serve.
 *
 * DreamNet Phase 1 step 2 (Brandon's contract decision 3, 2026-10-09): a cast
 * existing in our store is historical truth; whether it may be returned now
 * depends on the current authority of the key that signed it. The ingestion
 * writer (PR #3904) records the signer and its authority. This is the read
 * side.
 *
 * A cast's STANDING is worked out from `cast_signer_provenance` joined to
 * `farcaster_signer_authority` on (fid, signer):
 * - `active`  - at least one recorded signer of the cast is active.
 * - `removed` - no active signer, and at least one is removed.
 * - `unknown` - anything else: no provenance row, no authority row, or an
 *   authority we could not establish.
 * One key's removal never touches a cast another active key also signed.
 *
 * `removed` is always dropped. `unknown` is the caller's choice, and the
 * caller MUST make it (`unknown: 'keep' | 'drop'`), because the two answers
 * suit different surfaces:
 * - a display surface (chat, search, feed) keeps unknown, or it would empty
 *   itself: nothing stored before the writer was switched on has a row;
 * - a current-authority context (agent memory, anything that treats a cast
 *   as a present-tense statement) drops unknown, which is what the contract
 *   asks for. Nothing in this repo is that kind of surface yet.
 *
 * Nothing is deleted. The `channel_casts` row and its provenance stay.
 *
 * DEFAULT OFF. Runs only when `FARCASTER_SIGNER_AUTHORITY_FILTER` is exactly
 * `1`. With the flag off the rows come back untouched and no query is made.
 *
 * FAILS CLOSED, like `hidden-casts.ts`. If either table cannot be read we
 * cannot tell which casts a removed key signed, so no casts are returned and
 * the failure is logged at error level.
 */
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/** True only when the flag is exactly '1'. */
export function signerAuthorityFilterEnabled(): boolean {
  return process.env.FARCASTER_SIGNER_AUTHORITY_FILTER === '1';
}

type Standing = 'active' | 'removed' | 'unknown';

const RANK: Record<Standing, number> = { unknown: 0, removed: 1, active: 2 };

interface ProvenanceRow {
  cast_hash: string;
  fid: number;
  signer: string;
}
interface AuthorityRow {
  fid: number;
  signer: string;
  status: string;
}

/**
 * Returns `rows` without the casts whose signer was removed, and without the
 * casts of unknown standing when `unknown` is 'drop'. Never throws.
 */
export async function dropCastsBySignerAuthority<T extends { hash: string }>(
  rows: T[],
  surface: string,
  opts: { unknown: 'keep' | 'drop' },
): Promise<T[]> {
  if (!signerAuthorityFilterEnabled() || rows.length === 0) return rows;
  try {
    // Provenance is stored in lowercase hex.
    const hashes = [...new Set(rows.map((r) => r.hash.toLowerCase()))];
    const { data: provenanceData, error: provenanceError } = await supabaseAdmin
      .from('cast_signer_provenance')
      .select('cast_hash, fid, signer')
      .in('cast_hash', hashes);
    if (provenanceError) throw provenanceError;
    const provenance = (provenanceData ?? []) as ProvenanceRow[];

    const standing = new Map<string, Standing>();
    if (provenance.length > 0) {
      const { data: authorityData, error: authorityError } = await supabaseAdmin
        .from('farcaster_signer_authority')
        .select('fid, signer, status')
        // Scoped to the FIDs and keys on this page, so the read is bounded by the
        // page and cannot be cut short by a row cap (a truncated read would turn
        // a removed key into an unknown one, which the display routes keep).
        .in('fid', [...new Set(provenance.map((p) => p.fid))])
        .in('signer', [...new Set(provenance.map((p) => p.signer))]);
      if (authorityError) throw authorityError;

      // Keyed on (fid, signer): the same key under another FID says nothing here.
      const statusByKey = new Map<string, string>();
      for (const a of (authorityData ?? []) as AuthorityRow[]) {
        statusByKey.set(`${a.fid}:${a.signer}`, a.status);
      }
      for (const p of provenance) {
        const status = statusByKey.get(`${p.fid}:${p.signer}`);
        const mine: Standing = status === 'active' || status === 'removed' ? status : 'unknown';
        const best = standing.get(p.cast_hash);
        if (!best || RANK[mine] > RANK[best]) standing.set(p.cast_hash, mine);
      }
    }

    return rows.filter((r) => {
      const s = standing.get(r.hash.toLowerCase()) ?? 'unknown';
      return s === 'active' || (s === 'unknown' && opts.unknown === 'keep');
    });
  } catch (error: unknown) {
    logger.error(
      `[signer-authority-filter] ${surface}: signer tables unreadable, returning no casts`,
      error,
    );
    return [];
  }
}
