// Hindsight client — lazy import to avoid build failure when package isn't installed
// Install with: npm install @vectorize-io/hindsight-client

const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_API_URL || 'http://localhost:8888';

let _client: unknown = null;

export async function getHindsightClient() {
  if (_client) return _client;
  try {
    const { HindsightClient } = await import('@vectorize-io/hindsight-client');
    _client = new HindsightClient({ baseUrl: HINDSIGHT_BASE_URL });
    return _client;
  } catch {
    console.warn('[hindsight] @vectorize-io/hindsight-client not installed — skipping');
    return null;
  }
}

export default { getClient: getHindsightClient };
