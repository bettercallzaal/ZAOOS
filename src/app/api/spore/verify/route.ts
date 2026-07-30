/**
 * Spore federation boundary - Phase 4, the externally-reachable verify surface.
 *
 * POST /api/spore/verify
 *   Verify a portable artifact with ZAO's runtime, using ONLY the deterministic
 *   protocol (canonical bytes + sha256) - no shared runtime, no shared secrets
 *   (the v0.2 Phase 7 rule). Any DreamNet node (or third organism) can POST:
 *     { kind: 'zao.receipt',       receipt: <dreamnet.receipt.v1 envelope> }
 *     { kind: 'receipt.v1',        receipt: <SDK receipt.v1>, subject?: <content> }
 *     { kind: 'proof-artifact.v1', artifact: <SDK proof-artifact.v1> }
 *
 * GET /api/spore/verify
 *   Discovery: conformance status + accepted shapes (AI/agent-readable).
 *
 * PUBLIC by design: verification is deterministic math over caller-supplied
 * data - it reads nothing, writes nothing, and cannot leak state. Fails closed
 * on any unknown shape (Phase 7). Input size is capped before canonicalizing.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyReceipt,
  verifyDreamNetReceipt,
  verifyDreamNetArtifact,
  RECEIPT_SCHEMA,
  SPORE_HASH_ALG,
  type PortableReceipt,
  type DreamNetReceipt,
  type DreamNetProofArtifact,
} from '@/lib/spore';

/** Refuse to canonicalize unbounded payloads (CPU guard). */
const MAX_BODY_BYTES = 262_144; // 256 KiB

const SDK_COMMIT = '4072102ace9c4ccf1dda40302f685ac5d8e01268';

const zaoReceiptSchema = z.object({
  kind: z.literal('zao.receipt'),
  receipt: z.object({
    schemaVersion: z.string(),
    receiptId: z.string(),
    spore: z.object({
      schemaVersion: z.string(),
      subjectKey: z.string(),
      kind: z.string(),
      payload: z.unknown(),
      contentHash: z.string(),
      hashAlg: z.string(),
      source: z.string(),
      capturedAt: z.string(),
    }),
    issuer: z.string(),
    issuedAt: z.string(),
    provenance: z.object({ method: z.string(), endpoint: z.string().optional(), query: z.string().optional() }),
    digest: z.string(),
    verificationStatus: z.string(),
  }),
});

const sdkReceiptSchema = z.object({
  kind: z.literal('receipt.v1'),
  receipt: z.object({
    schemaVersion: z.string(),
    receiptId: z.string(),
    issuerId: z.string(),
    subjectHash: z.string(),
    proofArtifactId: z.string().optional(),
    timestamp: z.string(),
    digest: z.string(),
  }),
  subject: z.unknown().optional(),
});

const artifactSchema = z.object({
  kind: z.literal('proof-artifact.v1'),
  artifact: z.object({
    schemaVersion: z.string(),
    artifactId: z.string(),
    creatorId: z.string(),
    artifactType: z.string(),
    evidenceData: z.record(z.string(), z.unknown()),
    contentHash: z.string(),
    signature: z.string().optional(),
    createdIso: z.string(),
  }),
});

const bodySchema = z.discriminatedUnion('kind', [zaoReceiptSchema, sdkReceiptSchema, artifactSchema]);

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Body too large (max 256 KiB)' }, { status: 413 });
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid shape', details: parsed.error.issues.slice(0, 5) },
        { status: 400 },
      );
    }

    const verifiedAt = new Date().toISOString();
    const input = parsed.data;

    if (input.kind === 'zao.receipt') {
      // Full ZAO envelope: schema gate is inside verifyReceipt (fails closed).
      const isValid = verifyReceipt(input.receipt as unknown as PortableReceipt);
      return NextResponse.json({
        success: true,
        data: {
          schemaVersion: 'verification.v1',
          isValid,
          subjectHash: input.receipt.spore.contentHash,
          verifiedAt,
          checks: [
            {
              type: 'CONTENT_INTEGRITY',
              status: isValid ? 'VALID' : 'INVALID',
              reason: isValid
                ? 'Spore contentHash and receipt digest recompute byte-identically (ZAO runtime)'
                : 'Recompute mismatch or unsupported schema (fail closed)',
            },
          ],
        },
      });
    }

    if (input.kind === 'receipt.v1') {
      const result = verifyDreamNetReceipt(input.receipt as DreamNetReceipt, input.subject);
      return NextResponse.json({
        success: true,
        data: { schemaVersion: 'verification.v1', isValid: result.isValid, subjectHash: result.subjectHash, verifiedAt, checks: result.checks },
      });
    }

    const result = verifyDreamNetArtifact(input.artifact as DreamNetProofArtifact);
    return NextResponse.json({
      success: true,
      data: { schemaVersion: 'verification.v1', isValid: result.isValid, subjectHash: result.subjectHash, verifiedAt, checks: result.checks },
    });
  } catch (error: unknown) {
    console.error('[api/spore/verify]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      what: 'ZAO Spore federation verify endpoint - deterministic cross-runtime verification, no shared secrets',
      conformance: {
        status: 'PHASE 3 CONFIRMED - 47/47 bidirectional vs the DreamNet spore-sdk',
        sdkCommit: SDK_COMMIT,
        claim: 'ZAO is the first independently-operated conformant Spore node at the hash and receipt layers',
        doc: 'research/agents/2138-spore-phase3-cross-runtime-conformance',
      },
      hashAlg: SPORE_HASH_ALG,
      receiptSchema: RECEIPT_SCHEMA,
      accepts: [
        { kind: 'zao.receipt', body: '{ kind, receipt: <dreamnet.receipt.v1 envelope> }' },
        { kind: 'receipt.v1', body: '{ kind, receipt: <SDK receipt.v1>, subject?: <content to check subjectHash> }' },
        { kind: 'proof-artifact.v1', body: '{ kind, artifact: <SDK proof-artifact.v1> }' },
      ],
      maxBodyBytes: MAX_BODY_BYTES,
    },
  });
}
