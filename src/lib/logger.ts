/**
 * Structured logger for API route handlers.
 *
 * - In production (NODE_ENV === 'production'), suppresses info/debug output
 *   but keeps warn and error so important issues are still visible.
 * - In development, logs everything via the native console methods.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('[my-route] Starting…');
 *   logger.error('[my-route] Failed:', err);
 */

const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => void;

const noop: LogFn = () => {};

export const logger = {
  /** Verbose development-only output. Suppressed in production. */
  debug: isProduction ? noop : console.debug.bind(console),

  /** General informational messages. Suppressed in production. */
  info: isProduction ? noop : console.log.bind(console),

  /** Warnings that may need attention. Always logged. */
  warn: console.warn.bind(console),

  /** Errors that need attention. Always logged. */
  error: console.error.bind(console),
};
