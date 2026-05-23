import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { parseJukeSignature, verifyJukeWebhook } from './jukeWebhookVerify';

const SECRET = 'jk_whsec_test_only';

function signed(body: string, ts: number = Math.floor(Date.now() / 1000)): string {
  const sig = createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
  return `t=${ts},v1=${sig}`;
}

describe('parseJukeSignature', () => {
  it('parses a well-formed header', () => {
    expect(parseJukeSignature('t=123,v1=abc')).toEqual({ ts: 123, v1: 'abc' });
  });

  it('tolerates whitespace and reordered fields', () => {
    expect(parseJukeSignature(' v1=abc , t=123 ')).toEqual({ ts: 123, v1: 'abc' });
  });

  it('ignores unknown fields', () => {
    expect(parseJukeSignature('t=123,v1=abc,v2=xyz,foo=bar')).toEqual({ ts: 123, v1: 'abc' });
  });

  it('rejects when ts or v1 is missing', () => {
    expect(parseJukeSignature('v1=abc')).toBeNull();
    expect(parseJukeSignature('t=123')).toBeNull();
    expect(parseJukeSignature('')).toBeNull();
    expect(parseJukeSignature(null)).toBeNull();
    expect(parseJukeSignature(undefined)).toBeNull();
  });
});

describe('verifyJukeWebhook', () => {
  it('accepts a valid signature within the replay window', () => {
    const body = JSON.stringify({ event: 'room.finished', space_id: 'abc' });
    const ts = Math.floor(Date.now() / 1000);
    const header = signed(body, ts);
    const result = verifyJukeWebhook(body, header, SECRET, ts);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ts).toBe(ts);
      expect(result.signatureHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('rejects a body that has been tampered with', () => {
    const body = JSON.stringify({ event: 'room.finished', space_id: 'abc' });
    const header = signed(body);
    const result = verifyJukeWebhook(`${body} `, header, SECRET);
    expect(result.ok).toBe(false);
  });

  it('rejects when the timestamp is outside the replay window', () => {
    const body = JSON.stringify({ event: 'room.finished' });
    const ts = Math.floor(Date.now() / 1000) - 60 * 60;
    const header = signed(body, ts);
    const result = verifyJukeWebhook(body, header, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/replay window/i);
  });

  it('rejects when the wrong secret signed the body', () => {
    const body = JSON.stringify({ event: 'room.finished' });
    const ts = Math.floor(Date.now() / 1000);
    const wrong = createHmac('sha256', 'other').update(`${ts}.${body}`).digest('hex');
    const header = `t=${ts},v1=${wrong}`;
    const result = verifyJukeWebhook(body, header, SECRET, ts);
    expect(result.ok).toBe(false);
  });

  it('rejects when the secret is not configured', () => {
    const body = '{}';
    const result = verifyJukeWebhook(body, signed(body), '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/JUKE_WEBHOOK_SECRET/);
  });

  it('rejects a missing or malformed header', () => {
    const body = '{}';
    expect(verifyJukeWebhook(body, null, SECRET).ok).toBe(false);
    expect(verifyJukeWebhook(body, 'garbage', SECRET).ok).toBe(false);
  });

  it('produces a deterministic signatureHash for idempotency', () => {
    const body = JSON.stringify({ event: 'room.started', space_id: 'abc' });
    const ts = Math.floor(Date.now() / 1000);
    const header = signed(body, ts);
    const a = verifyJukeWebhook(body, header, SECRET, ts);
    const b = verifyJukeWebhook(body, header, SECRET, ts);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.signatureHash).toBe(b.signatureHash);
  });
});
