// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// communityConfig.sopha.enabled is true in the real config.
// SOPHA_AUTH is null in test env (no SOPHA_API_USERNAME/PASSWORD) so
// fetchSophaFeed() returns null at the credential gate.
vi.mock('../../../community.config', () => ({
  communityConfig: {
    sopha: {
      enabled: true,
      apiUrl: 'https://www.sopha.social/api/external/feed',
      minQualityScore: 0,
      maxAgeDays: 30,
    },
  },
}));

import { fetchSophaFeed } from '../client';

describe('fetchSophaFeed', () => {
  it('returns null when SOPHA credentials are absent (no API auth header)', async () => {
    // SOPHA_API_USERNAME and SOPHA_API_PASSWORD are not set in the test env,
    // so SOPHA_AUTH = null and the function exits early.
    const result = await fetchSophaFeed();
    expect(result).toBeNull();
  });
});
