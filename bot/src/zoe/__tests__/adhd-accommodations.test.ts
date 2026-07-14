/**
 * adhd-accommodations.test.ts - Unit tests for ADHD accommodation features.
 *
 * Tests: focus-guard, session-checkpoint, trust-audit modules.
 * These are unit tests that verify logic without I/O (mocked file ops).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildFocusDigest } from '../focus-guard';
import { buildTriageSummary } from '../inbox-triage';
import { formatAuditForTelegram } from '../trust-audit';

describe('focus-guard', () => {
  describe('buildFocusDigest', () => {
    it('returns placeholder when no pings queued', () => {
      const digest = buildFocusDigest([]);
      expect(digest).toContain('No queued updates');
    });

    it('formats single ping correctly', () => {
      const digest = buildFocusDigest(['PR #123 merged']);
      expect(digest).toContain('1 update');
      expect(digest).toContain('PR #123 merged');
    });

    it('formats multiple pings as list', () => {
      const digest = buildFocusDigest(['PR #123 merged', 'Task complete']);
      expect(digest).toContain('2 updates');
      expect(digest).toContain('- PR #123 merged');
      expect(digest).toContain('- Task complete');
    });
  });
});

describe('trust-audit', () => {
  describe('formatAuditForTelegram', () => {
    it('returns clear message when no findings', () => {
      const report = {
        scannedAt: new Date().toISOString(),
        findings: [],
        summary: 'Trust audit: all clear.',
      };
      const formatted = formatAuditForTelegram(report);
      expect(formatted).toContain('Trust audit: all clear');
    });

    it('formats capture findings', () => {
      const report = {
        scannedAt: new Date().toISOString(),
        findings: [
          {
            type: 'capture' as const,
            id: 'cap-1',
            title: 'Build WaveWarZ v2',
            daysSince: 20,
            reason: 'Capture from 20 days ago never acted on',
          },
        ],
        summary: 'Trust audit found 1 potential gap',
      };
      const formatted = formatAuditForTelegram(report);
      expect(formatted).toContain('Captures:');
      expect(formatted).toContain('Build WaveWarZ v2');
      expect(formatted).toContain('20d old');
    });

    it('formats task findings', () => {
      const report = {
        scannedAt: new Date().toISOString(),
        findings: [
          {
            type: 'task' as const,
            id: 'task-1',
            title: 'Review PR',
            daysSince: 15,
            status: 'pending',
            reason: 'Pending for 15 days with no progress',
          },
        ],
        summary: 'Trust audit found 1 potential gap',
      };
      const formatted = formatAuditForTelegram(report);
      expect(formatted).toContain('Tasks:');
      expect(formatted).toContain('Review PR');
      expect(formatted).toContain('[pending]');
    });
  });
});

describe('commands module', () => {
  it('recognizes /focus command pattern', () => {
    const { FOCUS_ON_RE, FOCUS_OFF_RE } = require('../commands');
    expect(FOCUS_ON_RE.test('/focus')).toBe(true);
    expect(FOCUS_ON_RE.test('/focus on')).toBe(true);
    expect(FOCUS_OFF_RE.test('/focus off')).toBe(true);
    expect(FOCUS_OFF_RE.test('/focus')).toBe(false);
  });

  it('recognizes /checkpoint command pattern', () => {
    const { CHECKPOINT_PREFIX } = require('../commands');
    const match = CHECKPOINT_PREFIX.exec('/checkpoint working on ZAO branding');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('working on ZAO branding');
  });

  it('recognizes /audit command', () => {
    const { AUDIT_COMMAND_RE } = require('../commands');
    expect(AUDIT_COMMAND_RE.test('/audit')).toBe(true);
    expect(AUDIT_COMMAND_RE.test('/audit full')).toBe(false);
  });
});
