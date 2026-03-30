/**
 * jsdom environment setup for Vitest.
 *
 * Polyfills browser APIs that jsdom doesn't provide but our tests need.
 * Also registers custom DOM matchers (toBeInTheDocument, etc.).
 */

import '@testing-library/jest-dom/vitest';

// --- TextEncoder / TextDecoder (needed by Next.js internals) ----------------
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.TextEncoder = TextEncoder as any;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.TextDecoder = TextDecoder as any;
}

// --- structuredClone (not available in jsdom) --------------------------------
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(val: T): T => JSON.parse(JSON.stringify(val));
}

// --- BroadcastChannel stub ---------------------------------------------------
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class BroadcastChannelStub {
    name: string;
    constructor(name: string) { this.name = name; }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage = null;
    onmessageerror = null;
  }
  globalThis.BroadcastChannel = BroadcastChannelStub as typeof BroadcastChannel;
}
