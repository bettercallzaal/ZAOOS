// Hindsight client — lazy import to avoid build failure when package isn't installed
// Install with: npm install @vectorize-io/hindsight-client

/** Minimal interface for the Hindsight client methods we use. */
export interface HindsightClientInterface {
  retain(userId: string, content: string, options: { metadata: Record<string, unknown> }): Promise<void>;
  recall(userId: string, query: string, options: { limit: number; metadataFilter?: Record<string, string> }): Promise<{ content: string; score: number; metadata?: Record<string, unknown> }[]>;
  reflect(userId: string, prompt: string): Promise<string>;
}

const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_API_URL || 'http://localhost:8888';

let _client: HindsightClientInterface | null = null;

export async function getHindsightClient() {
  if (_client) return _client;
  try {
    // @ts-expect-error — package is optional, only installed when Hindsight is configured
    const { HindsightClient } = await import('@vectorize-io/hindsight-client');
    _client = new HindsightClient({ baseUrl: HINDSIGHT_BASE_URL }) as HindsightClientInterface;
    return _client;
  } catch {
    console.warn('[hindsight] @vectorize-io/hindsight-client not installed — skipping');
    return null;
  }
}

const hindsight = { getClient: getHindsightClient };
export default hindsight;
