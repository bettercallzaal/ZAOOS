import { describe, expect, it } from 'vitest';
import { parseCriticReview, aggregatePanel, type PanelReview } from '../critic';

const R = (family: PanelReview['family'], score: number, feedback = 'fb'): PanelReview => ({
  family,
  model: family,
  score,
  feedback,
  inputTokens: 10,
  outputTokens: 5,
});

describe('parseCriticReview - tolerant cross-family parse', () => {
  it('parses clean JSON', () => {
    expect(parseCriticReview('{"score":80,"feedback":"ok"}')).toEqual({ score: 80, feedback: 'ok' });
  });
  it('parses JSON wrapped in a code fence', () => {
    expect(parseCriticReview('```json\n{"score":55,"feedback":"meh"}\n```')).toEqual({ score: 55, feedback: 'meh' });
  });
  it('extracts the last score object from prose (Codex/DeepSeek style)', () => {
    const text = 'Let me review.\nThe diff looks fine overall.\n{"score":90,"feedback":"clean"}';
    expect(parseCriticReview(text)).toEqual({ score: 90, feedback: 'clean' });
  });
  it('returns null on unusable output', () => {
    expect(parseCriticReview('I could not review this')).toBeNull();
  });
  it('rejects an out-of-range score', () => {
    expect(parseCriticReview('{"score":150,"feedback":"x"}')).toBeNull();
  });
});

describe('aggregatePanel - safety-biased weighted vote', () => {
  it('gates on the MIN of full-weight families (the pessimist wins)', () => {
    const out = aggregatePanel([R('claude', 85), R('codex', 60)], 20, 10);
    expect(out.score).toBe(60); // codex is the pessimist
    expect(out.modelUsed).toContain('panel:[claude,codex]');
    expect(out.modelUsed).not.toContain('degraded');
  });

  it('treats DeepSeek/openrouter as ADVISORY - it never lowers the gate on its own', () => {
    const out = aggregatePanel([R('claude', 85), R('codex', 90), R('openrouter', 40, 'looks risky')], 30, 15);
    expect(out.score).toBe(85); // min(claude,codex) - openrouter 40 does NOT gate
    expect(out.feedback).toContain('advisory openrouter flagged (40)');
  });

  it('does NOT surface an advisory family that agrees with the gate', () => {
    const out = aggregatePanel([R('claude', 80), R('codex', 82), R('openrouter', 78)], 30, 15);
    expect(out.score).toBe(80);
    expect(out.feedback).not.toContain('advisory');
  });

  it('flags DEGRADED when only one family reviewed', () => {
    const out = aggregatePanel([R('claude', 75)], 10, 5);
    expect(out.score).toBe(75);
    expect(out.modelUsed).toContain('(degraded)');
    expect(out.feedback).toContain('degraded');
  });

  it('flags DEGRADED when only same-family Claude reviewers ran (no cross-family)', () => {
    // two claude reviews but zero cross-family voters -> still degraded
    const out = aggregatePanel([R('claude', 88), R('claude', 70)], 20, 10);
    expect(out.feedback).toContain('degraded');
  });

  it('is NOT degraded with claude + one cross-family voter', () => {
    const out = aggregatePanel([R('claude', 80), R('openrouter', 76)], 20, 10);
    expect(out.feedback).not.toContain('degraded');
    // openrouter is the only cross-family voter and it is advisory; gate rests on claude
    expect(out.score).toBe(80);
  });

  it('falls back to the advisory score when NO full-weight family survived (degraded)', () => {
    const out = aggregatePanel([R('openrouter', 65)], 10, 5);
    expect(out.score).toBe(65);
    expect(out.feedback).toContain('degraded');
  });

  it('caps feedback length', () => {
    const long = 'x'.repeat(800);
    const out = aggregatePanel([R('claude', 50, long), R('codex', 45, long)], 20, 10);
    expect(out.feedback.length).toBeLessThanOrEqual(500);
  });
});
