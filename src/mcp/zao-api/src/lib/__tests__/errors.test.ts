// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MCPError, handleError } from '../errors';

// ---------------------------------------------------------------------------
// MCPError class
// ---------------------------------------------------------------------------

describe('MCPError', () => {
  it('is an instance of Error', () => {
    const err = new MCPError('something went wrong', 'TEST_CODE');
    expect(err).toBeInstanceOf(Error);
  });

  it('sets name to "MCPError"', () => {
    expect(new MCPError('msg', 'CODE').name).toBe('MCPError');
  });

  it('stores message, code, and default status 500', () => {
    const err = new MCPError('bad request', 'BAD_REQUEST');
    expect(err.message).toBe('bad request');
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.status).toBe(500);
  });

  it('accepts a custom status code', () => {
    const err = new MCPError('not found', 'NOT_FOUND', 404);
    expect(err.status).toBe(404);
  });

  it('has a stack trace (is a real Error)', () => {
    expect(new MCPError('test', 'ERR').stack).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// handleError
// ---------------------------------------------------------------------------

describe('handleError', () => {
  it('returns { error, code } for an MCPError', () => {
    const err = new MCPError('rate limited', 'RATE_LIMIT', 429);
    const result = handleError(err);
    expect(result).toEqual({ error: 'rate limited', code: 'RATE_LIMIT' });
  });

  it('returns INTERNAL_ERROR code for a generic Error', () => {
    const result = handleError(new Error('generic failure'));
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.error).toBe('Internal server error');
  });

  it('returns INTERNAL_ERROR for a thrown string', () => {
    const result = handleError('something exploded');
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('returns INTERNAL_ERROR for null', () => {
    const result = handleError(null);
    expect(result.code).toBe('INTERNAL_ERROR');
  });
});
