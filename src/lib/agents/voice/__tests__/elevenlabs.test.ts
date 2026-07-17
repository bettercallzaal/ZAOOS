// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSignedConversationUrl } from '../elevenlabs';

const AGENT_ID = 'agent-xyz-123';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 401,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.ELEVENLABS_API_KEY;
});

describe('getSignedConversationUrl', () => {
  it('throws when ELEVENLABS_API_KEY is not set', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    await expect(getSignedConversationUrl(AGENT_ID)).rejects.toThrow(
      'ELEVENLABS_API_KEY not configured',
    );
  });

  it('returns {signedUrl, agentId} on success', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    stubFetch(true, { signed_url: 'wss://signed.elevenlabs.io/session-123' });

    const result = await getSignedConversationUrl(AGENT_ID);
    expect(result.signedUrl).toBe('wss://signed.elevenlabs.io/session-123');
    expect(result.agentId).toBe(AGENT_ID);
  });

  it('URL includes the agent_id query param (URL-encoded)', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    stubFetch(true, { signed_url: 'wss://ok' });

    await getSignedConversationUrl(AGENT_ID);
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain(encodeURIComponent(AGENT_ID));
  });

  it('throws with status code when response is non-OK', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    stubFetch(false, { detail: 'Invalid API key' });

    await expect(getSignedConversationUrl(AGENT_ID)).rejects.toThrow(
      'ElevenLabs signed-url request failed: 401',
    );
  });

  it('throws when signed_url is missing from the response body', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    stubFetch(true, { other_field: 'unexpected' }); // signed_url absent

    await expect(getSignedConversationUrl(AGENT_ID)).rejects.toThrow(
      'ElevenLabs response missing signed_url',
    );
  });
});
