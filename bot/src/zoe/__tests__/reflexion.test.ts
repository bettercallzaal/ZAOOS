import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  confidenceLabel,
  renderApprovalMessage,
  renderVoiceNoteRequest,
  applyPatch,
  type ProposedPatch,
} from '../reflexion.ts';

function mkPatch(overrides: Partial<ProposedPatch> = {}): ProposedPatch {
  return {
    id: 'patch-1',
    target: 'human.md',
    section: 'Projects',
    confidence: 'high',
    confidence_score: 90,
    summary: 'Add new project ZUKE',
    after: '- ZUKE - new project mentioned 2026-05-28',
    rationale: 'Zaal mentioned shipping ZUKE in shipped section',
    ...overrides,
  };
}

// =========================
// confidenceLabel thresholds
// =========================

test('confidenceLabel: >=80 -> high', () => {
  assert.equal(confidenceLabel(80), 'high');
  assert.equal(confidenceLabel(95), 'high');
  assert.equal(confidenceLabel(100), 'high');
});

test('confidenceLabel: 50-79 -> medium', () => {
  assert.equal(confidenceLabel(50), 'medium');
  assert.equal(confidenceLabel(70), 'medium');
  assert.equal(confidenceLabel(79), 'medium');
});

test('confidenceLabel: <50 -> low', () => {
  assert.equal(confidenceLabel(40), 'low');
  assert.equal(confidenceLabel(49), 'low');
  assert.equal(confidenceLabel(0), 'low');
});

// =========================
// renderApprovalMessage
// =========================

test('renderApprovalMessage handles empty list', () => {
  const out = renderApprovalMessage([]);
  assert.match(out, /No high-confidence memory patches/);
});

test('renderApprovalMessage lists one patch with replace-diff', () => {
  const out = renderApprovalMessage([
    mkPatch({
      id: 'patch-1',
      before: 'Zaal is at Jackson Labs',
      after: 'Zaal started at Riverside 2026-06-01',
      summary: 'Update workplace from Jackson to Riverside',
    }),
  ]);
  assert.match(out, /1 memory patch from tonight/);
  assert.match(out, /patch-1 \(human\.md -> Projects\): Update workplace from Jackson to Riverside/);
  assert.match(out, /was: Zaal is at Jackson Labs/);
  assert.match(out, /now: Zaal started at Riverside 2026-06-01/);
  assert.match(out, /Reply "y patch-1 patch-2" to approve specific ids/);
});

test('renderApprovalMessage handles append-only patch (no before)', () => {
  const out = renderApprovalMessage([
    mkPatch({
      id: 'patch-1',
      before: undefined,
      after: '- ZUKE launched 2026-05-28 (Juke variant for ZAO)',
    }),
  ]);
  // No "was:" line when there's no before.
  assert.equal(/was:/.test(out), false);
  assert.match(out, /now: - ZUKE launched/);
});

test('renderApprovalMessage uses plural "patches" for >1', () => {
  const out = renderApprovalMessage([mkPatch({ id: 'patch-1' }), mkPatch({ id: 'patch-2' })]);
  assert.match(out, /2 memory patches from tonight/);
});

test('renderApprovalMessage truncates very long after blocks', () => {
  const longAfter = 'a'.repeat(500);
  const out = renderApprovalMessage([mkPatch({ after: longAfter })]);
  // Should NOT contain the full 500 a's - we truncate at 200.
  assert.equal(out.includes('a'.repeat(500)), false);
  // Should contain the truncation marker.
  assert.match(out, /\.\.\./);
});

// =========================
// renderVoiceNoteRequest
// =========================

test('renderVoiceNoteRequest is empty string when no low-confidence patches', () => {
  const out = renderVoiceNoteRequest([]);
  assert.equal(out, '');
});

test('renderVoiceNoteRequest asks for voice note explicitly', () => {
  const out = renderVoiceNoteRequest([
    mkPatch({
      id: 'patch-3',
      confidence: 'low',
      confidence_score: 45,
      summary: 'Maybe Zaal moved to Riverside? unclear',
      rationale: 'Zaal mentioned "Riverside" but in past tense',
    }),
  ]);
  assert.match(out, /1 low-confidence memory patch from tonight/);
  assert.match(out, /Send a voice note/);
  assert.match(out, /patch-3.*Maybe Zaal moved to Riverside/);
  assert.match(out, /rationale: Zaal mentioned "Riverside" but in past tense/);
});

// =========================
// applyPatch (the actual file mutation)
// =========================

test('applyPatch replace: substitutes before with after when found', () => {
  const before = `Zaal works at Jackson Labs.\nMore stuff.`;
  const patch = mkPatch({
    before: 'Jackson Labs',
    after: 'Riverside',
  });
  const out = applyPatch(before, patch);
  assert.equal(out, `Zaal works at Riverside.\nMore stuff.`);
});

test('applyPatch append: adds after content with trailing newline when before is undefined', () => {
  const current = `Existing content`;
  const patch = mkPatch({ before: undefined, after: '- new line' });
  const out = applyPatch(current, patch);
  assert.equal(out, `Existing content\n- new line\n`);
});

test('applyPatch append: preserves existing trailing newline (no double-newline)', () => {
  const current = `Existing content\n`;
  const patch = mkPatch({ before: undefined, after: '- new line' });
  const out = applyPatch(current, patch);
  assert.equal(out, `Existing content\n- new line\n`);
});

test('applyPatch falls back to append with marker when before block not found', () => {
  const current = `One thing.\nAnother.`;
  const patch = mkPatch({
    id: 'patch-7',
    before: 'This text does not exist anywhere',
    after: 'New stuff',
  });
  const out = applyPatch(current, patch);
  assert.match(out, /reflexion patch patch-7: before-block not found, appended/);
  assert.match(out, /New stuff/);
});

test('applyPatch replace: replaces first occurrence only', () => {
  const current = `foo bar foo bar`;
  const patch = mkPatch({ before: 'foo', after: 'baz' });
  const out = applyPatch(current, patch);
  assert.equal(out, `baz bar foo bar`);
});
