import { describe, expect, it } from 'vitest';
import {
  buildWavewarzOutcomeReceipt,
  outcomeReceiptHash,
  outcomeReceiptId,
  type ReceiptSigner,
} from '../outcome-receipt';

const context = {
  missionId: 'mission-ww-1',
  contractId: 'contract-ww-1',
  leaseId: 'lease-ww-1',
  executorDid: 'did:example:executor',
  observerDid: 'did:example:observer',
};

const event = {
  kind: 'settlement' as const,
  subjectId: 'battle-42',
  terminalState: 'SUCCESS' as const,
  observedAt: '2026-10-06T12:00:00.000Z',
  evidence: [
    {
      artifactUri: 'https://example.org/tx/abc',
      contentHash: 'a'.repeat(64),
      observationMethod: 'EXTERNAL_API_CHECK' as const,
    },
  ],
};

const sign: ReceiptSigner = (hash) => ({
  observer_office: 'test-office',
  signature_digest: `sig:${hash}`,
});

describe('outcomeReceiptId', () => {
  it('matches the schema pattern and sanitizes other characters', () => {
    const id = outcomeReceiptId('payout', 'battle 7/x');
    expect(id).toBe('rcpt:outcome:wavewarz-payout-battle_7_x');
    expect(id).toMatch(/^rcpt:outcome:[a-zA-Z0-9_-]+$/);
  });
});

describe('buildWavewarzOutcomeReceipt', () => {
  it('returns an unsigned draft when no signer is given', () => {
    const r = buildWavewarzOutcomeReceipt(event, context);
    expect(r.ok).toBe(true);
    if (!r.ok || r.signed) throw new Error('expected an unsigned draft');
    expect(r.draft.schema).toBe('outcome-receipt.v1');
    expect(r.draft.receipt_hash).toMatch(/^[0-9a-f]{64}$/);
    expect('observer_signature' in r.draft).toBe(false);
  });

  it('returns a signed receipt with every schema-required field', () => {
    const r = buildWavewarzOutcomeReceipt(event, context, sign);
    if (!r.ok || !r.signed) throw new Error('expected a signed receipt');
    const required = [
      'schema',
      'receipt_id',
      'mission_id',
      'contract_id',
      'lease_id',
      'executor_did',
      'observer_did',
      'observed_terminal_state',
      'evidence_manifest',
      'side_effects_verified',
      'unresolved_claims',
      'observed_at',
      'receipt_hash',
      'observer_signature',
    ];
    expect(Object.keys(r.receipt).sort()).toEqual([...required].sort());
    expect(r.receipt.observer_signature.signature_digest).toBe(`sig:${r.receipt.receipt_hash}`);
    expect(r.receipt.evidence_manifest[0]).toEqual({
      artifact_uri: 'https://example.org/tx/abc',
      content_hash: 'a'.repeat(64),
      observation_method: 'EXTERNAL_API_CHECK',
    });
  });

  it('hashes deterministically and independently of input key order', () => {
    const a = buildWavewarzOutcomeReceipt(event, context);
    const reordered = { ...context, missionId: context.missionId };
    const b = buildWavewarzOutcomeReceipt({ ...event, evidence: [...event.evidence] }, reordered);
    if (!a.ok || a.signed || !b.ok || b.signed) throw new Error('expected drafts');
    expect(a.draft.receipt_hash).toBe(b.draft.receipt_hash);
  });

  it('changes the hash when any content changes', () => {
    const a = buildWavewarzOutcomeReceipt(event, context);
    const b = buildWavewarzOutcomeReceipt({ ...event, terminalState: 'PARTIAL_SUCCESS' }, context);
    if (!a.ok || a.signed || !b.ok || b.signed) throw new Error('expected drafts');
    expect(a.draft.receipt_hash).not.toBe(b.draft.receipt_hash);
  });

  it('does not let the signature change the hash', () => {
    const draft = buildWavewarzOutcomeReceipt(event, context);
    const signed = buildWavewarzOutcomeReceipt(event, context, sign);
    if (!draft.ok || draft.signed || !signed.ok || !signed.signed)
      throw new Error('unexpected shape');
    expect(signed.receipt.receipt_hash).toBe(draft.draft.receipt_hash);
    const { receipt_hash: _h, observer_signature: _s, ...body } = signed.receipt;
    expect(outcomeReceiptHash(body)).toBe(signed.receipt.receipt_hash);
  });

  describe.each([
    ['no evidence', { ...event, evidence: [] }, context],
    ['unknown kind', { ...event, kind: 'trade' }, context],
    ['bad timestamp', { ...event, observedAt: 'yesterday' }, context],
    ['unknown terminal state', { ...event, terminalState: 'DONE' }, context],
    ['missing lease', event, { ...context, leaseId: '' }],
  ])('rejects %s', (_name, ev, ctx) => {
    it('returns ok false with an error', () => {
      const r = buildWavewarzOutcomeReceipt(ev, ctx, sign);
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error('expected an error');
      expect(r.error.length).toBeGreaterThan(0);
    });
  });
});
