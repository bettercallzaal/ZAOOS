// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createClip,
  createLivepeerStream,
  deleteLivepeerStream,
  getLivepeerStreamStatus,
} from '../client';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const MOCK_STREAM = {
  id: 'stream-abc',
  streamKey: 'key-123',
  rtmpIngestUrl: 'rtmp://live.livepeer.com/live/key-123',
  playbackId: 'play-abc',
};

describe('createLivepeerStream', () => {
  it('returns data.stream on a successful response', async () => {
    stubFetch(true, { stream: MOCK_STREAM });
    const result = await createLivepeerStream('test-stream', []);
    expect(result.id).toBe('stream-abc');
    expect(result.playbackId).toBe('play-abc');
  });

  it('throws when the response is not OK', async () => {
    stubFetch(false, {});
    await expect(createLivepeerStream('test', [])).rejects.toThrow(
      'Failed to create Livepeer stream',
    );
  });
});

describe('getLivepeerStreamStatus', () => {
  it('returns the parsed JSON on success', async () => {
    stubFetch(true, { isActive: true, viewerCount: 12 });
    const result = await getLivepeerStreamStatus('stream-abc');
    expect(result.isActive).toBe(true);
    expect(result.viewerCount).toBe(12);
  });

  it('throws when the response is not OK', async () => {
    stubFetch(false, {});
    await expect(getLivepeerStreamStatus('stream-abc')).rejects.toThrow(
      'Failed to get stream status',
    );
  });
});

describe('deleteLivepeerStream', () => {
  it('returns the parsed JSON on success', async () => {
    stubFetch(true, { deleted: true });
    const result = await deleteLivepeerStream('stream-abc');
    expect(result.deleted).toBe(true);
  });

  it('throws when the response is not OK', async () => {
    stubFetch(false, {});
    await expect(deleteLivepeerStream('stream-abc')).rejects.toThrow('Failed to delete stream');
  });
});

describe('createClip', () => {
  it('returns the parsed JSON on success', async () => {
    stubFetch(true, { asset: { id: 'clip-xyz', downloadUrl: 'https://cdn.example.com/clip.mp4' } });
    const result = await createClip('play-abc', 10000, 60000, 'highlight');
    expect(result.asset.id).toBe('clip-xyz');
  });

  it('throws when the response is not OK', async () => {
    stubFetch(false, {});
    await expect(createClip('play-abc', 10000, 60000)).rejects.toThrow('Failed to create clip');
  });
});
