import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { isCrossOriginIsolatedPath, middleware } from '@/middleware';

async function pageHeaders(path: string) {
  const res = await middleware(new NextRequest(new URL(path, 'https://zao.test')));
  return res.headers;
}

describe('middleware cross-origin isolation for XMTP pages', () => {
  it.each([
    '/messages',
    '/messages/abc',
    '/chat',
    '/chat/thread',
  ])('sets COOP and COEP on %s', async (path) => {
    const headers = await pageHeaders(path);
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(headers.get('Cross-Origin-Embedder-Policy')).toBe('credentialless');
  });

  it.each(['/', '/feed', '/chatbot', '/messagesx'])('does not set COOP on %s', async (path) => {
    const headers = await pageHeaders(path);
    expect(headers.get('Cross-Origin-Opener-Policy')).toBeNull();
    expect(headers.get('Cross-Origin-Embedder-Policy')).toBeNull();
  });

  it('allows WebAssembly compilation in script-src without allowing eval', async () => {
    const csp = (await pageHeaders('/chat')).get('Content-Security-Policy') ?? '';
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('matches only the exact prefix or a sub-path', () => {
    expect(isCrossOriginIsolatedPath('/chat')).toBe(true);
    expect(isCrossOriginIsolatedPath('/chat/x')).toBe(true);
    expect(isCrossOriginIsolatedPath('/chatty')).toBe(false);
  });
});
