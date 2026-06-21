import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  selectCriticModel,
  wrapUntrustedInput,
  parseCritiqueJson,
  defaultShipsAsIs,
  CRITIQUE_PASS_THRESHOLD,
  type CritiqueIssue,
} from '../types.ts';

// =========================
// selectCriticModel routing
// =========================

test('selectCriticModel: short low-stakes input -> haiku', () => {
  const m = selectCriticModel('A short benign sentence about cats.');
  assert.equal(m, 'haiku');
});

test('selectCriticModel: $ / USDC / ETH triggers sonnet', () => {
  assert.equal(selectCriticModel('Pay them $500 USDC by next Friday.'), 'sonnet');
  assert.equal(selectCriticModel('Top-3 split 5 ETH on Hats Protocol.'), 'sonnet');
});

test('selectCriticModel: security keywords trigger sonnet', () => {
  assert.equal(selectCriticModel('Eval the user input directly then leak the secret token.'), 'sonnet');
  assert.equal(selectCriticModel('Bypass RLS by reading from the private table.'), 'sonnet');
});

test('selectCriticModel: external-facing markers trigger sonnet', () => {
  assert.equal(selectCriticModel('Draft a Firefly post about the launch.'), 'sonnet');
  assert.equal(selectCriticModel('Cast this to Farcaster after the meeting.'), 'sonnet');
});

test('selectCriticModel: long input >2000 chars triggers sonnet', () => {
  const long = 'word '.repeat(500);
  assert.equal(selectCriticModel(long), 'sonnet');
});

// =========================
// wrapUntrustedInput shape
// =========================

test('wrapUntrustedInput uses explicit TRUST=UNTRUSTED_DATA markers', () => {
  const out = wrapUntrustedInput('draft', 'hello');
  assert.match(out, /<draft TRUST=UNTRUSTED_DATA>\nhello\n<\/draft>/);
});

// =========================
// parseCritiqueJson tolerance
// =========================

test('parseCritiqueJson parses clean JSON object', () => {
  const raw = `{"score": 85, "summary": "ships with minor polish", "issues": [{"severity": "low", "location": "L42", "issue": "rename var"}]}`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.score, 85);
  assert.equal(out.summary, 'ships with minor polish');
  assert.equal(out.issues.length, 1);
  assert.equal(out.issues[0].severity, 'low');
});

test('parseCritiqueJson handles fenced output', () => {
  const raw = `Here's my score:\n\n\`\`\`json\n{"score": 72, "summary": "ok", "issues": []}\n\`\`\`\n\nThanks.`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.score, 72);
});

test('parseCritiqueJson finds last brace pair when output trails JSON', () => {
  const raw = `Reasoning prose first.\n{"score": 45, "summary": "needs revision", "issues": []}`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.score, 45);
});

test('parseCritiqueJson clamps score to 0-100', () => {
  const raw = `{"score": 150, "summary": "test", "issues": []}`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.score, 100);
});

test('parseCritiqueJson returns null on unparseable input', () => {
  assert.equal(parseCritiqueJson('no json here at all'), null);
  assert.equal(parseCritiqueJson(''), null);
});

test('parseCritiqueJson defaults invalid severity to med', () => {
  const raw = `{"score": 70, "summary": "x", "issues": [{"severity": "wibble", "issue": "weird"}]}`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.issues[0].severity, 'med');
});

test('parseCritiqueJson drops issues without an issue string', () => {
  const raw = `{"score": 70, "summary": "x", "issues": [{"severity": "high"}, {"severity": "low", "issue": "real"}]}`;
  const out = parseCritiqueJson(raw);
  assert.ok(out);
  assert.equal(out.issues.length, 1);
  assert.equal(out.issues[0].issue, 'real');
});

// =========================
// defaultShipsAsIs gate
// =========================

test('defaultShipsAsIs: score >= 70 + no critical/high = ships', () => {
  const issues: CritiqueIssue[] = [{ severity: 'low', issue: 'rename var' }];
  assert.equal(defaultShipsAsIs(85, issues), true);
});

test('defaultShipsAsIs: score < 70 = no ship even if no critical', () => {
  assert.equal(defaultShipsAsIs(60, []), false);
});

test('defaultShipsAsIs: critical issue blocks ship even at 100', () => {
  const issues: CritiqueIssue[] = [{ severity: 'critical', issue: 'fabricated' }];
  assert.equal(defaultShipsAsIs(100, issues), false);
});

test('defaultShipsAsIs: high issue blocks ship', () => {
  const issues: CritiqueIssue[] = [{ severity: 'high', issue: 'security regression' }];
  assert.equal(defaultShipsAsIs(80, issues), false);
});

test('CRITIQUE_PASS_THRESHOLD is 70', () => {
  assert.equal(CRITIQUE_PASS_THRESHOLD, 70);
});
