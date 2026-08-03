/**
 * The tenant boundary matrix (spec section 3) - the AUTHORITATIVE, machine-readable
 * statement of what a Stage 0 tenant (ZAO) may read/write vs what stays with
 * DreamNet. Code and gateway policy must match this table; the human-readable copy
 * lives in the Architect's Report doc and is generated from this.
 *
 * Access values: 'yes' | 'no' | 'gated' (allowed only through an explicit,
 * receipted approval step). Fail-closed default is 'no'.
 */

export type Access = 'yes' | 'no' | 'gated';

export interface BoundaryRow {
  readonly resource: string;
  readonly zaoRead: Access;
  readonly zaoWrite: Access;
  readonly dreamnetRead: Access;
  readonly dreamnetWrite: Access;
  readonly transport: string; // '-' when it never crosses the boundary
  readonly approval: string;
  readonly retention: string;
  readonly notes: string;
}

const GW = 'Federation Gateway'; // the only transport across the boundary

/** The Stage 0 boundary matrix for ZAO as a sovereign tenant. */
export const ZAO_STAGE0_BOUNDARY_MATRIX: readonly BoundaryRow[] = [
  { resource: 'private ZAO memory', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'n/a', retention: 'ZAO-controlled', notes: 'Never crosses the boundary. Not indexed by DreamNet.' },
  { resource: 'partner-shared memory', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'gated', dreamnetWrite: 'no', transport: GW, approval: 'object-level export approval', retention: 'finite TTL', notes: 'memory.shared.<tenant>.*; exact audience binding + revocation ref.' },
  { resource: 'public memory', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'yes', dreamnetWrite: 'no', transport: GW, approval: 'publication intent + scans', retention: 'per license', notes: 'Explicit publication intent; secret+PII scan required.' },
  { resource: 'ephemeral task state', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'n/a', retention: 'auto-expiry', notes: 'Cannot silently become canonical or shared.' },
  { resource: 'Proof Drops', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'yes', dreamnetWrite: 'no', transport: GW, approval: 'signed envelope', retention: 'per policy', notes: 'proofdrops.<tenant>.*; verifiable evidence.' },
  { resource: 'receipts', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'yes', dreamnetWrite: 'no', transport: GW, approval: 'signed envelope', retention: 'immutable', notes: 'receipts.<tenant>.*; terminal receipts never erased.' },
  { resource: 'claims', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'gated', dreamnetWrite: 'no', transport: GW, approval: 'independent verification', retention: 'per policy', notes: 'claims.<tenant>.*; no self-certification.' },
  { resource: 'verification results', zaoRead: 'yes', zaoWrite: 'no', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'n/a', retention: 'per policy', notes: 'DreamNet (or independent verifier) writes; ZAO consumes.' },
  { resource: 'Knowledge Crystals', zaoRead: 'gated', zaoWrite: 'no', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'explicit selection', retention: 'per review date', notes: 'Imported IMPORTED_UNVERIFIED; local acceptance is sovereign.' },
  { resource: 'Living Papers', zaoRead: 'gated', zaoWrite: 'no', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'explicit selection', retention: 'per review date', notes: 'Selected only; not auto-canonical.' },
  { resource: 'Warper Keeper Trappers', zaoRead: 'gated', zaoWrite: 'gated', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'archive + capability inspection', retention: 'per policy', notes: 'trappers.<tenant>.*; handler allowlist, sandboxed extraction.' },
  { resource: 'University evidence', zaoRead: 'yes', zaoWrite: 'gated', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'evaluation request', retention: 'per policy', notes: 'university.<tenant>.*; candidate evidence only.' },
  { resource: 'capability leases', zaoRead: 'yes', zaoWrite: 'no', dreamnetRead: 'yes', dreamnetWrite: 'yes', transport: GW, approval: 'independent approval', retention: 'until expiry/revoke', notes: 'leases.<tenant>.*; no self-approval; bounded + time-limited.' },
  { resource: 'Whale League paper research', zaoRead: 'yes', zaoWrite: 'gated', dreamnetRead: 'yes', dreamnetWrite: 'no', transport: GW, approval: 'thesis verification', retention: 'per policy', notes: 'whale.paper.<tenant>.*; simulationOnly=true, no wallets.' },
  { resource: 'wallets', zaoRead: 'no', zaoWrite: 'no', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'n/a', notes: 'Never accessible in Stage 0. No keys, no signing.' },
  { resource: 'economic actions', zaoRead: 'no', zaoWrite: 'no', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'n/a', notes: 'No trades, transfers, deploys. Paper simulation only.' },
  { resource: 'social actions', zaoRead: 'no', zaoWrite: 'no', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'n/a', notes: 'No public posting in Stage 0.' },
  { resource: 'deployment', zaoRead: 'no', zaoWrite: 'no', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'n/a', notes: 'No production deploy authority (spec section 18).' },
  { resource: 'telemetry', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'gated', dreamnetWrite: 'no', transport: GW, approval: 'tenant-scoped', retention: 'per policy', notes: 'telemetry.<tenant>.*; tenant-scoped only.' },
  { resource: 'raw logs', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'n/a', retention: 'ZAO-controlled', notes: 'Internal; never exported raw.' },
  { resource: 'prompts', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'n/a', retention: 'ZAO-controlled', notes: 'Internal/private prompts never cross the boundary.' },
  { resource: 'PII', zaoRead: 'yes', zaoWrite: 'yes', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'ZAO-controlled', notes: 'Raw PII never exported (scan gate blocks it).' },
  { resource: 'secrets', zaoRead: 'no', zaoWrite: 'no', dreamnetRead: 'no', dreamnetWrite: 'no', transport: '-', approval: 'FORBIDDEN', retention: 'n/a', notes: 'No keys/tokens ever cross; scan gate blocks it.' },
];

/** Resources that are hard-forbidden in Stage 0 (all-no rows). */
export function forbiddenResources(): string[] {
  return ZAO_STAGE0_BOUNDARY_MATRIX.filter(
    (r) => r.zaoRead === 'no' && r.zaoWrite === 'no' && r.dreamnetRead === 'no' && r.dreamnetWrite === 'no',
  ).map((r) => r.resource);
}

/** Render the matrix as a GitHub-flavored markdown table (for the report doc). */
export function boundaryMatrixMarkdown(): string {
  const header = '| Resource | ZAO R | ZAO W | DN R | DN W | Transport | Approval | Retention | Notes |';
  const sep = '|---|---|---|---|---|---|---|---|---|';
  const rows = ZAO_STAGE0_BOUNDARY_MATRIX.map(
    (r) =>
      `| ${r.resource} | ${r.zaoRead} | ${r.zaoWrite} | ${r.dreamnetRead} | ${r.dreamnetWrite} | ${r.transport} | ${r.approval} | ${r.retention} | ${r.notes} |`,
  );
  return [header, sep, ...rows].join('\n');
}
