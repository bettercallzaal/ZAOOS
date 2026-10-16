import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCrossOriginIsolatedPath, middleware } from '@/middleware';

async function pageHeaders(path: string) {
  const res = await middleware(new NextRequest(new URL(path, 'https://zao.test')));
  return res.headers;
}

describe('middleware cross-origin isolation for XMTP pages', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    '/messages',
    '/messages/abc',
    '/messagesx',
  ])('always sets COOP and COEP on %s (unchanged from main)', async (path) => {
    const headers = await pageHeaders(path);
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(headers.get('Cross-Origin-Embedder-Policy')).toBe('credentialless');
  });

  it('flag off: /chat has no COOP or COEP', async () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', '');
    for (const path of ['/chat', '/chat/thread']) {
      const headers = await pageHeaders(path);
      expect(headers.get('Cross-Origin-Opener-Policy')).toBeNull();
      expect(headers.get('Cross-Origin-Embedder-Policy')).toBeNull();
    }
  });

  it('flag on: /chat sets COOP and COEP', async () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    for (const path of ['/chat', '/chat/thread']) {
      const headers = await pageHeaders(path);
      expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
      expect(headers.get('Cross-Origin-Embedder-Policy')).toBe('credentialless');
    }
  });

  it.each(['/', '/feed', '/chatbot'])('never sets COOP on %s', async (path) => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    const headers = await pageHeaders(path);
    expect(headers.get('Cross-Origin-Opener-Policy')).toBeNull();
    expect(headers.get('Cross-Origin-Embedder-Policy')).toBeNull();
  });

  it('allows WebAssembly compilation in script-src without allowing eval', async () => {
    const csp = (await pageHeaders('/messages')).get('Content-Security-Policy') ?? '';
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('matches /chat only with the flag on, and only on exact prefix or sub-path', () => {
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', 'true');
    expect(isCrossOriginIsolatedPath('/chat')).toBe(true);
    expect(isCrossOriginIsolatedPath('/chat/x')).toBe(true);
    expect(isCrossOriginIsolatedPath('/chatty')).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_XMTP_AUTO_CONNECT', '');
    expect(isCrossOriginIsolatedPath('/chat')).toBe(false);
  });
});
