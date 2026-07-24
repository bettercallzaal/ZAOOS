/**
 * SSRF guard for Vacuum Spikes. A spike fetches an external URL; if that URL is
 * ever config- or data-driven, an attacker could point it at localhost, a
 * private network, or a cloud metadata endpoint. This guard is the first line:
 * it rejects non-http(s) schemes, blocks private/loopback/link-local/metadata
 * IP literals, and (when an allowlist is given) requires the host to be on it.
 *
 * This mirrors the SSRF protection in Brandon's @dreamnet/spore-sdk Vacuum Spike
 * so ZAO spikes are hardened to the same bar. Note: this blocks IP LITERALS; a
 * hostname that DNS-resolves to a private IP (rebinding) is a deeper follow-up
 * that needs resolution-time checks.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

/** Private / loopback / link-local / cloud-metadata IPv4 ranges, plus IPv6 local. */
function isBlockedIpLiteral(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  // IPv6 loopback / link-local / unique-local
  if (h === '::1' || /^fe80:/i.test(h) || /^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
  return false;
}

/**
 * Throw UnsafeUrlError if the URL is unsafe to fetch. When allowedHosts is
 * given, the hostname must match one of them exactly (case-insensitive).
 */
export function assertSafeUrl(endpoint: string, allowedHosts?: string[]): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new UnsafeUrlError(`invalid URL: ${endpoint}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`blocked scheme '${url.protocol}' (only http/https)`);
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new UnsafeUrlError(`blocked host '${host}'`);
  }
  if (isBlockedIpLiteral(host)) {
    throw new UnsafeUrlError(`blocked private/metadata IP '${host}'`);
  }
  if (allowedHosts && allowedHosts.length > 0) {
    const allowed = allowedHosts.map((a) => a.toLowerCase());
    if (!allowed.includes(host)) {
      throw new UnsafeUrlError(`host '${host}' not in allowlist [${allowed.join(', ')}]`);
    }
  }
}
