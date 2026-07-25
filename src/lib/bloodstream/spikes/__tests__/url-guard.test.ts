import { describe, it, expect } from 'vitest';
import { assertSafeUrl, UnsafeUrlError } from '../url-guard';
import { createHttpPollSpike } from '../http-poll-spike';

describe('assertSafeUrl (SSRF guard)', () => {
  it('allows a normal https host', () => {
    expect(() => assertSafeUrl('https://api.coinbase.com/v2/prices/ETH-USD/spot')).not.toThrow();
  });

  it('blocks loopback + localhost', () => {
    expect(() => assertSafeUrl('http://127.0.0.1/')).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrl('http://localhost:8080/x')).toThrow(UnsafeUrlError);
  });

  it('blocks private ranges + cloud metadata', () => {
    for (const u of ['http://10.0.0.5/', 'http://192.168.1.1/', 'http://172.16.0.1/', 'http://169.254.169.254/latest/meta-data/']) {
      expect(() => assertSafeUrl(u)).toThrow(UnsafeUrlError);
    }
  });

  it('blocks non-http(s) schemes', () => {
    expect(() => assertSafeUrl('file:///etc/passwd')).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrl('ftp://example.com/x')).toThrow(UnsafeUrlError);
  });

  it('enforces an allowlist when given', () => {
    expect(() => assertSafeUrl('https://api.coinbase.com/x', ['api.coinbase.com'])).not.toThrow();
    expect(() => assertSafeUrl('https://evil.example/x', ['api.coinbase.com'])).toThrow(/allowlist/);
  });
});

describe('createHttpPollSpike SSRF integration', () => {
  it('refuses to build a spike pointed at a private IP', () => {
    expect(() => createHttpPollSpike({
      spikeId: 'bad', endpoint: 'http://169.254.169.254/latest/meta-data/',
      capabilities: ['x'], produces: ['x'], map: () => [],
    })).toThrow(UnsafeUrlError);
  });

  it('builds a spike for an allowlisted public host', () => {
    expect(() => createHttpPollSpike({
      spikeId: 'ok', endpoint: 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
      capabilities: ['market.price'], produces: ['market.price'], allowedHosts: ['api.coinbase.com'], map: () => [],
    })).not.toThrow();
  });
});
