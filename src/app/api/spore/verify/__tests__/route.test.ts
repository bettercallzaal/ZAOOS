import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makePostRequest } from '@/test-utils/api-helpers';
import { POST, GET } from '../route';
import { createObservation } from '@/lib/eyes';
import { observationToSpore } from '@/lib/spore/spore';
import { sporeToReceipt } from '@/lib/spore/receipt';

/**
 * Phase 4 verify endpoint - the externally-reachable federation boundary.
 * Committed vitest suite (now that the app runner is restored, doc 2146) so
 * every PR guards the boundary; mirrors scripts/spore-verify-endpoint-check.ts.
 * Fixtures are the DreamNet-runtime-generated cross-runtime vectors.
 */

const vectors = JSON.parse(
  readFileSync(
    join(process.cwd(), 'src', 'lib', 'spore', '__tests__', 'fixtures', 'cross-runtime-vectors.json'),
    'utf8',
  ),
);

const post = (body: unknown) => POST(makePostRequest('/api/spore/verify', body));

describe('GET /api/spore/verify (discovery)', () => {
  it('reports Phase 3 conformance status + accepted shapes', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.data.conformance.status).toContain('47/47');
    expect(b.data.accepts.map((a: { kind: string }) => a.kind)).toEqual([
      'zao.receipt',
      'receipt.v1',
      'proof-artifact.v1',
    ]);
  });
});

describe('POST /api/spore/verify - DreamNet -> ZAO', () => {
  it('verifies a DreamNet-issued receipt.v1 with its subject', async () => {
    const res = await post({ kind: 'receipt.v1', receipt: vectors.dreamnetReceipt, subject: vectors.dreamnetReceiptSubject });
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.data.isValid).toBe(true);
  });

  it('rejects a tampered digest', async () => {
    const res = await post({
      kind: 'receipt.v1',
      receipt: { ...vectors.dreamnetReceipt, digest: 'f'.repeat(64) },
      subject: vectors.dreamnetReceiptSubject,
    });
    const b = await res.json();
    expect(b.data.isValid).toBe(false);
  });

  it('rejects a tampered subject (content does not match subjectHash)', async () => {
    const forged = { ...vectors.dreamnetReceiptSubject, payload: { price: 1 } };
    const res = await post({ kind: 'receipt.v1', receipt: vectors.dreamnetReceipt, subject: forged });
    const b = await res.json();
    expect(b.data.isValid).toBe(false);
  });

  it('verifies a DreamNet proof-artifact.v1', async () => {
    const res = await post({ kind: 'proof-artifact.v1', artifact: vectors.dreamnetArtifact });
    const b = await res.json();
    expect(b.data.isValid).toBe(true);
  });

  it('rejects a tampered artifact payload', async () => {
    const res = await post({
      kind: 'proof-artifact.v1',
      artifact: { ...vectors.dreamnetArtifact, evidenceData: { ...vectors.dreamnetArtifact.evidenceData, task: 'FORGED' } },
    });
    const b = await res.json();
    expect(b.data.isValid).toBe(false);
  });
});

describe('POST /api/spore/verify - ZAO envelope', () => {
  function mintReceipt() {
    const obs = createObservation(
      {
        sensor: 'sensor:vtest',
        kind: 'market.price',
        subjectKey: 'asset:ETH-USD',
        payload: { price: 3000 },
        confidence: 1,
        provenance: { method: 'api' },
        health: { status: 'healthy', latencyMs: 1, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 },
      },
      { observerId: 'observer:vtest', now: '2026-07-30T06:00:00.000Z' },
    );
    return sporeToReceipt(observationToSpore(obs), 'organism:zao:main', { now: '2026-07-30T06:00:00.000Z' });
  }

  it('verifies a well-formed ZAO envelope', async () => {
    const res = await post({ kind: 'zao.receipt', receipt: mintReceipt() });
    const b = await res.json();
    expect(b.data.isValid).toBe(true);
  });

  it('rejects a tampered ZAO payload', async () => {
    const r = mintReceipt();
    const res = await post({ kind: 'zao.receipt', receipt: { ...r, spore: { ...r.spore, payload: { price: 1 } } } });
    const b = await res.json();
    expect(b.data.isValid).toBe(false);
  });
});

describe('POST /api/spore/verify - fail closed', () => {
  it('unknown kind -> 400', async () => {
    const res = await post({ kind: 'receipt.v2', receipt: {} });
    expect(res.status).toBe(400);
  });

  it('invalid JSON -> 400', async () => {
    const { NextRequest } = await import('next/server');
    const res = await POST(
      new NextRequest('http://localhost/api/spore/verify', { method: 'POST', body: '{not json' }),
    );
    expect(res.status).toBe(400);
  });

  it('oversize body -> 413', async () => {
    const res = await post({ kind: 'receipt.v1', receipt: { pad: 'x'.repeat(300_000) } });
    expect(res.status).toBe(413);
  });
});
