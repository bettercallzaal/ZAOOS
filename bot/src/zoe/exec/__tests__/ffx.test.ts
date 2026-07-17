// @vitest-environment node
// Tests for ffxAvailable() — pure env-var gate for FFX serverless exec.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ffxAvailable } from '../ffx';

beforeEach(() => {
  delete process.env.FFX_VERIFY_OK;
  delete process.env.FFX_ENDPOINT;
});
afterEach(() => {
  delete process.env.FFX_VERIFY_OK;
  delete process.env.FFX_ENDPOINT;
});

describe('ffxAvailable', () => {
  it('returns false when neither env var is set', () => {
    expect(ffxAvailable()).toBe(false);
  });

  it('returns false when FFX_VERIFY_OK=1 but FFX_ENDPOINT is absent', () => {
    process.env.FFX_VERIFY_OK = '1';
    expect(ffxAvailable()).toBe(false);
  });

  it('returns false when FFX_ENDPOINT is set but FFX_VERIFY_OK is not "1"', () => {
    process.env.FFX_ENDPOINT = 'https://ffx.example.com';
    expect(ffxAvailable()).toBe(false);
  });

  it('returns false when FFX_VERIFY_OK is "true" instead of "1"', () => {
    process.env.FFX_VERIFY_OK = 'true';
    process.env.FFX_ENDPOINT = 'https://ffx.example.com';
    expect(ffxAvailable()).toBe(false);
  });

  it('returns true when both FFX_VERIFY_OK="1" and FFX_ENDPOINT are set', () => {
    process.env.FFX_VERIFY_OK = '1';
    process.env.FFX_ENDPOINT = 'https://ffx.example.com';
    expect(ffxAvailable()).toBe(true);
  });
});
