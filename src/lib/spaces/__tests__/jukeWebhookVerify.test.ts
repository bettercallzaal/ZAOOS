// @vitest-environment node
import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseJukeSignature, verifyJukeWebhook } from '../jukeWebhookVerify';

// ---------------------------------------------------------------------------
// parseJukeSignature
// ---------------------------------------------------------------------------

describe('parseJukeSignature', () => {
  it('returns null for null input', () => {
    expect(parseJukeSignature(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseJukeSignature(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseJukeSignature('')).toBeNull();
  });

  it('parses a valid header', () => {
    expect(parseJukeSignature('t=1750000000,v1=abc123def')).toEqual({
      ts: 1750000000,
      v1: 'abc123def',
    });
  });

  it('is order-insensitive (v1 before t)', () => {
    expect(parseJukeSignature('v1=hexvalue,t=1750000001')).toEqual({
      ts: 1750000001,
      v1: 'hexvalue',
    });
  });

  it('ignores unknown keys', () => {
    expect(parseJukeSignature('t=1750000002,v1=hexval,extra=ignored')).toEqual({
      ts: 1750000002,
      v1: 'hexval',
    });
  });

  it('returns null when t is not a number', () => {
    expect(parseJukeSignature('t=notanumber,v1=abc')).toBeNull();
  });

  it('returns null when v1 is missing', () => {
    expect(parseJukeSignature('t=1750000003')).toBeNull();
  });

  it('returns null when t is missing', () => {
    expect(parseJukeSignature('v1=hexvalue')).toBeNull();
  });

  it('trims whitespace around key=value pairs', () => {
    expect(parseJukeSignature(' t=1750000004 , v1=trimmed ')).toEqual({
      ts: 1750000004,
      v1: 'trimmed',
    });
  });
});

// ---------------------------------------------------------------------------
// verifyJukeWebhook — helper to build a valid HMAC signature
// ---------------------------------------------------------------------------

function makeSignature(secret: string, ts: number, rawBody: string): string {
  const message = `${ts}.${rawBody}`;
  const v1 = createHmac('sha256', secret).update(message).digest('hex');
  return `t=${ts},v1=${v1}`;
}

const NOW = 1750000000; // stable reference timestamp
const SECRET = 'test-secret-key';
const BODY = '{"event":"track.played","data":{}}';

// ---------------------------------------------------------------------------
// verifyJukeWebhook — guard cases
// ---------------------------------------------------------------------------

describe('verifyJukeWebhook guards', () => {
  it('returns error when secret is empty', () => {
    const result = verifyJukeWebhook(BODY, makeSignature(SECRET, NOW, BODY), '', NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not configured/i);
  });

  it('returns error when header is null', () => {
    const result = verifyJukeWebhook(BODY, null, SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/malformed/i);
  });

  it('returns error when header is undefined', () => {
    const result = verifyJukeWebhook(BODY, undefined, SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/malformed/i);
  });

  it('rejects a timestamp older than 5 minutes', () => {
    const oldTs = NOW - 5 * 60 - 1;
    const result = verifyJukeWebhook(BODY, makeSignature(SECRET, oldTs, BODY), SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/replay window/i);
  });

  it('rejects a timestamp more than 5 minutes in the future', () => {
    const futureTs = NOW + 5 * 60 + 1;
    const result = verifyJukeWebhook(BODY, makeSignature(SECRET, futureTs, BODY), SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/replay window/i);
  });
});

// ---------------------------------------------------------------------------
// verifyJukeWebhook — valid signature cases
// ---------------------------------------------------------------------------

describe('verifyJukeWebhook valid signatures', () => {
  it('returns ok:true for a correct signature (raw secret)', () => {
    const header = makeSignature(SECRET, NOW, BODY);
    const result = verifyJukeWebhook(BODY, header, SECRET, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ts).toBe(NOW);
      expect(result.matchedVariant).toBe('raw');
    }
  });

  it('signatureHash is SHA-256 of the v1 hex string', () => {
    const header = makeSignature(SECRET, NOW, BODY);
    const result = verifyJukeWebhook(BODY, header, SECRET, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const v1 = parseJukeSignature(header)!.v1;
      const expectedHash = createHash('sha256').update(v1).digest('hex');
      expect(result.signatureHash).toBe(expectedHash);
    }
  });

  it('accepts ts within 5 minutes (boundary)', () => {
    const borderTs = NOW - 5 * 60; // exactly at boundary
    const result = verifyJukeWebhook(BODY, makeSignature(SECRET, borderTs, BODY), SECRET, NOW);
    expect(result.ok).toBe(true);
  });

  it('verifies with whsec_ prefix using no-whsec variant', () => {
    const whsecSecret = `whsec_${SECRET}`;
    // The key used for HMAC should be SECRET (the part after "whsec_")
    const v1 = createHmac('sha256', SECRET).update(`${NOW}.${BODY}`).digest('hex');
    const header = `t=${NOW},v1=${v1}`;
    const result = verifyJukeWebhook(BODY, header, whsecSecret, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.matchedVariant).toBe('no-whsec');
  });

  it('verifies with whsec_app_key using no-whsec-noapp variant', () => {
    const innerKey = 'the-actual-key';
    const whsecSecret = `whsec_app_${innerKey}`;
    const v1 = createHmac('sha256', innerKey).update(`${NOW}.${BODY}`).digest('hex');
    const header = `t=${NOW},v1=${v1}`;
    const result = verifyJukeWebhook(BODY, header, whsecSecret, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.matchedVariant).toBe('no-whsec-noapp');
  });
});

// ---------------------------------------------------------------------------
// verifyJukeWebhook — mismatch cases
// ---------------------------------------------------------------------------

describe('verifyJukeWebhook mismatch', () => {
  it('returns ok:false for wrong secret', () => {
    const header = makeSignature('wrong-secret', NOW, BODY);
    const result = verifyJukeWebhook(BODY, header, SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/mismatch/i);
      expect(result.debug).toBeDefined();
    }
  });

  it('returns ok:false when body is tampered', () => {
    const header = makeSignature(SECRET, NOW, BODY);
    const result = verifyJukeWebhook('{"tampered":true}', header, SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/mismatch/i);
  });

  it('debug block includes secretFp and bodyLen', () => {
    const header = makeSignature('wrong', NOW, BODY);
    const result = verifyJukeWebhook(BODY, header, SECRET, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok && result.debug) {
      expect(result.debug.secretLen).toBe(SECRET.length);
      expect(result.debug.bodyLen).toBe(BODY.length);
      expect(result.debug.secretFp).toHaveLength(12);
    }
  });
});
