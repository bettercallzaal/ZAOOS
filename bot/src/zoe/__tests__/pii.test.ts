import { test } from 'vitest';
import assert from 'node:assert/strict';

import { scanPii, containsPii, redactPii, EMAIL_ALLOWLIST } from '../pii.ts';

test('detects a third-party email', () => {
  const hits = scanPii('reach me at jane.doe@example.com tomorrow');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'email');
  assert.equal(hits[0].value, 'jane.doe@example.com');
});

test('allowlisted emails are not flagged', () => {
  for (const email of EMAIL_ALLOWLIST) {
    assert.equal(containsPii(`mail ${email} ok`), false, `${email} should be allowed`);
  }
});

test('allowlist is case-insensitive', () => {
  assert.equal(containsPii('ZAAL@THEZAO.COM'), false);
});

test('detects US phone numbers in common formats', () => {
  for (const p of ['(207) 555-0123', '207-555-0123', '207.555.0123', '+1 207 555 0123']) {
    assert.equal(containsPii(`call ${p}`), true, `${p} should flag`);
  }
});

test('detects a credit-card-shaped number', () => {
  const hits = scanPii('card 4111 1111 1111 1111');
  assert.ok(hits.some((h) => h.kind === 'credit-card'));
});

test('detects a street address', () => {
  assert.ok(scanPii('lives at 123 Main St').some((h) => h.kind === 'street-address'));
});

test('detects a full birthdate', () => {
  assert.ok(scanPii('born 03/14/1989').some((h) => h.kind === 'birthdate'));
});

test('flags a non-allowlisted telegram handle but not an allowlisted one', () => {
  assert.ok(scanPii('ping @some_random_person').some((h) => h.kind === 'telegram-handle'));
  assert.equal(containsPii('ping @zaoclaw_bot'), false);
});

test('an email is not double-counted as a telegram handle', () => {
  const hits = scanPii('mail jane@example.com');
  assert.equal(hits.filter((h) => h.kind === 'telegram-handle').length, 0);
  assert.equal(hits.filter((h) => h.kind === 'email').length, 1);
});

test('clean ZAO text passes', () => {
  assert.equal(containsPii('Zaal committed to shipping the onepager today. @zaoclaw_bot tracking.'), false);
});

test('redactPii swaps non-allowlisted hits for placeholders, keeps allowlisted', () => {
  const out = redactPii('email jane@example.com and zaal@thezao.com, ping @rando');
  assert.ok(out.includes('<redacted-email>'));
  assert.ok(out.includes('zaal@thezao.com'));
  assert.ok(out.includes('@<redacted-handle>'));
  assert.equal(containsPii(out), false, 'redacted output should be clean');
});

test('empty / falsy input is clean', () => {
  assert.deepEqual(scanPii(''), []);
});
