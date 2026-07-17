// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { logger } from '../logger';

// logger wraps console methods with production suppression. warn/error are always
// active; debug/info are active in non-production envs (NODE_ENV=test here).
// The methods are bound at module init, so spy-after-import won't intercept them —
// these tests verify structure and callability only.

describe('logger', () => {
  it('exposes debug, info, warn, and error as functions', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('warn does not throw when called', () => {
    expect(() => logger.warn('test')).not.toThrow();
  });

  it('error does not throw when called', () => {
    expect(() => logger.error('test')).not.toThrow();
  });

  it('debug does not throw in test env (non-production)', () => {
    expect(() => logger.debug('debug msg')).not.toThrow();
  });

  it('info does not throw in test env (non-production)', () => {
    expect(() => logger.info('info msg')).not.toThrow();
  });
});
