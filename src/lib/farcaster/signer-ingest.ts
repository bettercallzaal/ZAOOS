/**
 * Record which key signed a cast, and that key's authority, when we ingest it.
 *
 * DreamNet Phase 1 step 1 (Brandon's contract decisions 1-3, 2026-10-09). The
 * library that reads the signer from a hub and resolves its authority already
 * exists (`signer-provenance.ts`, PR #3855) and so do the two tables (PR #3858,
 * applied 2026-10-11). Nothing wrote to them. This is the writer.
 *
 * WHAT IT WRITES, per ingested cast:
 * - `cast_signer_provenance`: one row per (cast_hash, signer). The insert
 *   IGNORES an existing row, so a later observation never overwrites an
 *   earlier signer's provenance.
 * - `farcaster_signer_authority`: one row per (fid, signer). `active` and
 *   `removed` overwrite the stored row. `unknown` is written only when there
 *   is no row yet: a hub timeout is not proof of revocation, so it must not
 *   erase a status we already established.
 *
 * WHEN THE HUB CANNOT SAY who signed the cast (timeout, malformed answer, the
 * mirror has not seen the cast yet) nothing is written. A cast with no
 * provenance row is "signer unknown", which the retrieval filter treats as
 * outside current authority. That is the safe default, not a gap.
 *
 * DEFAULT OFF. Runs only when `FARCASTER_SIGNER_PROVENANCE_INGEST` is exactly
 * `1`.
 *
 * NOT COVERED:
 * - Only the Neynar webhook calls this. `/api/chat/send` and the bulk cache
 *   refresh in `/api/chat/messages` also write `channel_casts` and do not.
 * - No backfill. Casts stored before the flag is on, and casts the mirror had
 *   not seen when the webhook fired, have no row until something re-runs this.
 * - One hub. A second hub as a cross-check is a separate step.
 */
import { supabaseAdmin } from '@/lib/db/supabase';
import { checkSignerAuthority, fetchCastSigner } from '@/lib/farcaster/signer-provenance';
import { logger } from '@/lib/logger';

/** True only when the flag is exactly '1'. */
export function signerIngestEnabled(): boolean {
  return process.env.FARCASTER_SIGNER_PROVENANCE_INGEST === '1';
}

export type SignerIngestResult =
  | {
      status: 'recorded';
      hash: string;
      signer: string;
      authority: 'active' | 'removed' | 'unknown';
    }
  | { status: 'signer-unknown'; hash: string; reason: string }
  | { status: 'error'; hash: string; error: string };

type HubOptions = Parameters<typeof fetchCastSigner>[2];

/** Reads the cast's signer from a hub and stores it with the key's authority. Never throws. */
export async function recordCastSigner(
  fid: number,
  castHash: string,
  opts: HubOptions = {},
): Promise<SignerIngestResult> {
  // The tables accept lowercase hex only.
  const hash = typeof castHash === 'string' ? castHash.toLowerCase() : String(castHash);
  try {
    const cast = await fetchCastSigner(fid, hash, opts);
    if (cast.status === 'unknown') {
      logger.info(`[signer-ingest] ${hash} signer unknown (${cast.reason}), nothing written`);
      return { status: 'signer-unknown', hash, reason: cast.reason };
    }

    const { error: provenanceError } = await supabaseAdmin.from('cast_signer_provenance').upsert(
      {
        cast_hash: hash,
        fid,
        signer: cast.signer,
        signature_scheme: 'SIGNATURE_SCHEME_ED25519',
        hub_url: cast.hubUrl,
        observed_at: cast.observedAt,
      },
      { onConflict: 'cast_hash,signer', ignoreDuplicates: true },
    );
    if (provenanceError) throw provenanceError;

    const authority = await checkSignerAuthority(fid, cast.signer, opts);
    const { error: authorityError } = await supabaseAdmin.from('farcaster_signer_authority').upsert(
      {
        fid,
        signer: authority.signer,
        status: authority.status,
        reason: authority.reason,
        event_chain_id: authority.event?.chainId ?? null,
        event_block: authority.event?.blockNumber ?? null,
        event_log_index: authority.event?.logIndex ?? null,
        event_tx: authority.event?.transactionHash ?? null,
        hub_url: authority.hubUrl,
        checked_at: authority.checkedAt,
      },
      // 'unknown' never replaces a stored status: a timeout is not a revocation.
      { onConflict: 'fid,signer', ignoreDuplicates: authority.status === 'unknown' },
    );
    if (authorityError) throw authorityError;

    logger.info(`[signer-ingest] ${hash} signed by ${cast.signer}, authority ${authority.status}`);
    return { status: 'recorded', hash, signer: cast.signer, authority: authority.status };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err);
    logger.error(`[signer-ingest] ${hash} not recorded: ${message}`);
    return { status: 'error', hash, error: message };
  }
}
