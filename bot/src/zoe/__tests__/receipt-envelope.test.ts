import { describe, it, expect } from 'vitest';
import {
  buildReceiptEnvelope,
  canonicalize,
  computeActionDigest,
  riskTierForApprovalClass,
  verifyEnvelopeIntegrity,
  type ReceiptEnvelopeSource,
  type ReceiptEnvelopeContext,
} from '../receipt-envelope';

const source: ReceiptEnvelopeSource = {
  agentIdentity: 'zoe',
  capability: 'post_github',
  tool: 'github_cli',
  action: 'create_pull_request',
  resultType: 'success',
  approvalClass: 'auto',
  evidenceUrl: 'https://github.com/bettercallzaal/ZAOOS/pull/123',
};

const ctx: ReceiptEnvelopeContext = {
  receiptId: 'receipt:abc',
  runId: 'run:xyz',
  startedAt: '2026-07-23T10:00:00.000Z',
  completedAt: '2026-07-23T10:00:05.000Z',
  createdAt: '2026-07-23T10:00:05.500Z',
};

describe('canonicalize', () => {
  it('is order-independent for object keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it('preserves array order (arrays are ordered data)', () => {
    expect(canonicalize([1, 2])).not.toBe(canonicalize([2, 1]));
  });

  it('sorts nested keys recursively', () => {
    expect(canonicalize({ x: { d: 1, c: 2 } })).toBe('{"x":{"c":2,"d":1}}');
  });
});

describe('computeActionDigest', () => {
  it('is stable across timing - same action identity, same digest', () => {
    const a = computeActionDigest(source, 'run:xyz');
    const b = computeActionDigest(source, 'run:xyz');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('differs when the run differs (replay across different runs is distinct)', () => {
    expect(computeActionDigest(source, 'run:1')).not.toBe(
      computeActionDigest(source, 'run:2'),
    );
  });

  it('differs when the action differs', () => {
    expect(computeActionDigest(source, 'run:xyz')).not.toBe(
      computeActionDigest({ ...source, action: 'merge_pull_request' }, 'run:xyz'),
    );
  });

  it('ignores nothing but timing - identical inputs at different times collide (dedup works)', () => {
    // No time field is part of the digest, so two calls are equal by construction.
    expect(computeActionDigest(source, 'run:xyz')).toBe(
      computeActionDigest({ ...source }, 'run:xyz'),
    );
  });
});

describe('buildReceiptEnvelope', () => {
  it('produces a valid dreamnet.receipt.v1 shape', () => {
    const env = buildReceiptEnvelope(source, ctx);
    expect(env.schemaVersion).toBe('dreamnet.receipt.v1');
    expect(env.receiptId).toBe('receipt:abc');
    expect(env.assignmentId).toBe('run:xyz');
    expect(env.principalId).toBe('zoe');
    expect(env.capsuleId).toBe('capsule:zoe:post_github');
    expect(env.execution.status).toBe('succeeded');
    expect(env.evidence).toHaveLength(1);
    expect(env.evidence[0].uri).toBe(source.evidenceUrl);
    expect(env.contentSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('maps result types to execution status', () => {
    expect(buildReceiptEnvelope({ ...source, resultType: 'error' }, ctx).execution.status).toBe('failed');
    expect(buildReceiptEnvelope({ ...source, resultType: 'pending_approval' }, ctx).execution.status).toBe('abstained');
    expect(buildReceiptEnvelope({ ...source, resultType: 'rate_limited' }, ctx).execution.status).toBe('abstained');
  });

  it('emits empty evidence when there is no evidenceUrl', () => {
    expect(buildReceiptEnvelope({ ...source, evidenceUrl: null }, ctx).evidence).toHaveLength(0);
  });

  it('contentSha256 verifies (tamper-evidence round-trip)', () => {
    const env = buildReceiptEnvelope(source, ctx);
    expect(verifyEnvelopeIntegrity(env)).toBe(true);
  });

  it('contentSha256 fails verification when a field is tampered', () => {
    const env = buildReceiptEnvelope(source, ctx);
    const tampered = { ...env, principalId: 'attacker' };
    expect(verifyEnvelopeIntegrity(tampered)).toBe(false);
  });

  it('contentSha256 is deterministic for identical inputs', () => {
    expect(buildReceiptEnvelope(source, ctx).contentSha256).toBe(
      buildReceiptEnvelope(source, ctx).contentSha256,
    );
  });

  it('contentSha256 changes when createdAt changes (integrity includes issuance time)', () => {
    const later = buildReceiptEnvelope(source, { ...ctx, createdAt: '2026-07-23T11:00:00.000Z' });
    expect(later.contentSha256).not.toBe(buildReceiptEnvelope(source, ctx).contentSha256);
  });
});

describe('riskTierForApprovalClass', () => {
  it('escalates risk with approval class', () => {
    expect(riskTierForApprovalClass('auto')).toBe('low');
    expect(riskTierForApprovalClass('user_confirm')).toBe('medium');
    expect(riskTierForApprovalClass('external_spend')).toBe('high');
    expect(riskTierForApprovalClass('on_chain')).toBe('critical');
    expect(riskTierForApprovalClass(undefined)).toBe('low');
  });
});
