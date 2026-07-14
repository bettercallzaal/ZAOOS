/**
 * cost-governance.test.ts - tests for spend thresholds, alerts, and hard-stop logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSpendStatus,
  shouldFireAlert,
  shouldPauseAutonomousWork,
  formatSpendStatus,
  _resetAlertState,
} from '../cost-governance';
import * as costLedger from '../cost-ledger';

vi.mock('../cost-ledger');

describe('cost-governance', () => {
  beforeEach(() => {
    _resetAlertState();
    vi.clearAllMocks();
    process.env.ZOE_DAILY_BUDGET_USD = '10';
  });

  describe('getSpendStatus', () => {
    it('computes spend percentage correctly', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 2,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 2.5,
        },
      ]);

      const status = getSpendStatus();
      expect(status.todayUsd).toBe(2.5);
      expect(status.capUsd).toBe(10);
      expect(status.percentUsed).toBe(25);
      expect(status.remaining).toBe(7.5);
      expect(status.isHardStopped).toBe(false);
      expect(status.thresholdLevelPercent).toBeNull();
    });

    it('handles multiple models', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 2,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 2.5,
        },
        {
          model: 'claude-sonnet-4',
          calls: 3,
          inputTokens: 500,
          outputTokens: 200,
          costUsd: 0.5,
        },
      ]);

      const status = getSpendStatus();
      expect(status.todayUsd).toBe(3);
      expect(status.percentUsed).toBe(30);
    });

    it('identifies threshold at 60%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 6.1,
        },
      ]);

      const status = getSpendStatus();
      expect(status.percentUsed).toBeGreaterThan(60);
      expect(status.thresholdLevelPercent).toBe(61);
      expect(status.isAtThreshold).toBe(true);
    });

    it('identifies threshold at 75%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 7.51,
        },
      ]);

      const status = getSpendStatus();
      expect(status.thresholdLevelPercent).toBe(75);
      expect(status.isAtThreshold).toBe(true);
    });

    it('identifies hard-stop at 95%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 9.51,
        },
      ]);

      const status = getSpendStatus();
      expect(status.percentUsed).toBeGreaterThan(95);
      expect(status.thresholdLevelPercent).toBe(95);
      expect(status.isHardStopped).toBe(true);
      expect(status.isAtThreshold).toBe(false); // threshold only goes to 85
    });

    it('handles zero cap gracefully', () => {
      process.env.ZOE_DAILY_BUDGET_USD = '0';
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 1.0,
        },
      ]);

      const status = getSpendStatus();
      expect(status.percentUsed).toBe(0); // cap 0 means pct = 0
      expect(status.capUsd).toBe(10); // falls back to default
    });

    it('uses ZOE_DAILY_BUDGET_USD env var', () => {
      process.env.ZOE_DAILY_BUDGET_USD = '25';
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 5.0,
        },
      ]);

      const status = getSpendStatus();
      expect(status.capUsd).toBe(25);
      expect(status.percentUsed).toBe(20);
    });
  });

  describe('shouldFireAlert', () => {
    it('fires alert on first 60% threshold', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 6.1,
        },
      ]);

      expect(shouldFireAlert(60)).toBe(true);
      // Second call same day should not fire
      expect(shouldFireAlert(60)).toBe(false);
    });

    it('de-dupes alerts per day', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 7.6,
        },
      ]);

      expect(shouldFireAlert(75)).toBe(true);
      expect(shouldFireAlert(75)).toBe(false);
      expect(shouldFireAlert(75)).toBe(false);
    });

    it('fires all applicable thresholds on first check', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 9.0, // 90%
        },
      ]);

      expect(shouldFireAlert(60)).toBe(true);
      expect(shouldFireAlert(75)).toBe(true);
      expect(shouldFireAlert(85)).toBe(true);
      // 95 is not crossed
      expect(shouldFireAlert(95)).toBe(false);
    });

    it('does not fire if threshold not crossed', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 5.0, // 50%
        },
      ]);

      expect(shouldFireAlert(60)).toBe(false);
      expect(shouldFireAlert(75)).toBe(false);
      expect(shouldFireAlert(85)).toBe(false);
    });
  });

  describe('shouldPauseAutonomousWork', () => {
    it('returns false when below 95%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 9.4, // 94%
        },
      ]);

      expect(shouldPauseAutonomousWork()).toBe(false);
    });

    it('returns true at exactly 95%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 9.5, // 95%
        },
      ]);

      expect(shouldPauseAutonomousWork()).toBe(true);
    });

    it('returns true above 95%', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 10.0, // 100%
        },
      ]);

      expect(shouldPauseAutonomousWork()).toBe(true);
    });
  });

  describe('formatSpendStatus', () => {
    it('formats basic spend status', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 2,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 2.5,
        },
      ]);

      const text = formatSpendStatus(false);
      expect(text).toContain('ZOE daily budget: $2.5000 / $10.00');
      expect(text).toContain('25.0%');
      expect(text).toContain('Remaining: $7.5000');
      expect(text).toContain('Within budget');
    });

    it('shows threshold alert status', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 8.0, // 80%
        },
      ]);

      const text = formatSpendStatus(false);
      expect(text).toContain('Threshold alert');
      expect(text).toContain('80');
    });

    it('shows hard-stop status', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 1,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 9.6, // 96%
        },
      ]);

      const text = formatSpendStatus(false);
      expect(text).toContain('Hard stop active');
      expect(text).toContain('95%+');
      expect(text).toContain('autonomous work paused');
    });

    it('includes detailed breakdown when requested', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([
        {
          model: 'claude-opus-4',
          calls: 2,
          inputTokens: 1000,
          outputTokens: 500,
          costUsd: 2.5,
        },
        {
          model: 'claude-sonnet-4',
          calls: 1,
          inputTokens: 500,
          outputTokens: 200,
          costUsd: 0.5,
        },
      ]);

      const text = formatSpendStatus(true);
      expect(text).toContain('Breakdown by model:');
      expect(text).toContain('claude-opus-4');
      expect(text).toContain('2 calls');
      expect(text).toContain('claude-sonnet-4');
      expect(text).toContain('1 calls');
    });

    it('handles empty ledger', () => {
      vi.mocked(costLedger.todaySummary).mockReturnValue([]);

      const text = formatSpendStatus(false);
      expect(text).toContain('ZOE daily budget: $0.0000 / $10.00');
      expect(text).toContain('0.0%');
    });
  });
});
