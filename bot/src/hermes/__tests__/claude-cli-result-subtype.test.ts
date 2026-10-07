/**
 * Classify the claude CLI's own result JSON on failure (doc 2239 section 5,
 * fix 3; flag ZOE_CLI_RESULT_CLASSIFY, default OFF).
 *
 * Measured 2026-10-07 on the VPS: every claude CLI failure in the 7-day
 * journal (5 of 5) was exit 1 with an EMPTY stderr and a stdout result of
 * subtype "error_max_budget_usd" - four in 7 seconds after a DM (the
 * extractors' four readers at EXTRACT_BUDGET_USD = 0.05), one at 14:01 UTC
 * that killed the work-loop research run. Every one was logged as
 * `[unknown: unclassified claude CLI failure]`, claude-health.json carried
 * lastFailKind "unknown", and the 2026-08-17 brief's open thread ("make the
 * failure legible") stayed open. The classifier already receives stdout in
 * the non-zero-exit branch; it just has no rule for the subtype field.
 *
 * Red controls: the verbatim 14:01 payload (as the journal truncates it at
 * 800 chars) classifies `unknown` with the flag unset and `budget` with it set.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { classifyClaudeError } from '../claude-cli';

// Verbatim from `journalctl --user -u zoe-bot`, 2026-10-07 14:01:44 UTC
// (the journal line cuts the payload at 800 chars; the session id is cut here).
const PAYLOAD_1401 =
  ' {"type":"result","subtype":"error_max_budget_usd","duration_ms":16849,"duration_api_ms":12082,"is_error":true,"num_turns":2,"stop_reason":"tool_use","session_id":"6c8d8662-61cf-4743-b92c-586';

// The 20:55 shape: refused before the first API call.
const PAYLOAD_2055 =
  ' {"type":"result","subtype":"error_max_budget_usd","duration_ms":17138,"duration_api_ms":0,"is_error":true,"num_turns":1,"stop_reason":"end_turn","session_id":"43ef679b-c7c7-4b4a-9377-effb947';

const saved = process.env.ZOE_CLI_RESULT_CLASSIFY;

describe('classifyClaudeError - result subtype (ZOE_CLI_RESULT_CLASSIFY)', () => {
  beforeEach(() => {
    delete process.env.ZOE_CLI_RESULT_CLASSIFY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ZOE_CLI_RESULT_CLASSIFY;
    else process.env.ZOE_CLI_RESULT_CLASSIFY = saved;
  });

  it('flag unset: the 14:01 payload is still "unknown" (today\'s behaviour, unchanged)', () => {
    const c = classifyClaudeError(PAYLOAD_1401);
    expect(c.kind).toBe('unknown');
  });

  it('flag set: the 14:01 payload classifies as budget, with a hint naming the cap flag', () => {
    process.env.ZOE_CLI_RESULT_CLASSIFY = '1';
    const c = classifyClaudeError(PAYLOAD_1401);
    expect(c.kind).toBe('budget');
    expect(c.hint).toMatch(/max-budget-usd|maxBudgetUsd/);
  });

  it('flag set: the 20:55 shape (refused before any API call, duration_api_ms 0) says so in the hint', () => {
    process.env.ZOE_CLI_RESULT_CLASSIFY = '1';
    const c = classifyClaudeError(PAYLOAD_2055);
    expect(c.kind).toBe('budget');
    expect(c.hint).toMatch(/before the first API call/);
  });

  it('flag set: error_max_turns and error_during_execution get their own kinds', () => {
    process.env.ZOE_CLI_RESULT_CLASSIFY = '1';
    expect(classifyClaudeError('{"type":"result","subtype":"error_max_turns","is_error":true}').kind).toBe('max_turns');
    expect(classifyClaudeError('{"type":"result","subtype":"error_during_execution","is_error":true}').kind).toBe('execution');
  });

  it('flag set: the existing kinds still win when their text is present, and a plain unknown stays unknown', () => {
    process.env.ZOE_CLI_RESULT_CLASSIFY = '1';
    expect(classifyClaudeError('invalid authentication - please run /login').kind).toBe('auth');
    expect(classifyClaudeError('api_error_status: 429').kind).toBe('usage_limit');
    expect(classifyClaudeError('something else entirely').kind).toBe('unknown');
  });

  it('flag set: a subtype of "success" is not an error kind', () => {
    process.env.ZOE_CLI_RESULT_CLASSIFY = '1';
    expect(classifyClaudeError('{"type":"result","subtype":"success","is_error":false}').kind).toBe('unknown');
  });
});
