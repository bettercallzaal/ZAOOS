import { describe, it, expect, vi, beforeEach } from 'vitest';
import { draftCast } from '../reason';
import type { RecallResult } from '../../recall';

const okCompletion = {
  choices: [{ message: { content: 'gm from zol' } }],
  usage: { prompt_tokens: 10, completion_tokens: 5 },
};

// Capture the request bodies sent to OpenRouter so we can assert on the system prompt.
function mockOpenRouter(): Array<{ messages: Array<{ role: string; content: string }> }> {
  const calls: Array<{ messages: Array<{ role: string; content: string }> }> = [];
  global.fetch = vi.fn(async (_url: unknown, init: { body: string }) => {
    calls.push(JSON.parse(init.body));
    return { ok: true, json: async () => okCompletion } as unknown as Response;
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.OPENROUTER_API_KEY = 'test-key';
});

describe('draftCast - ZABAL Bonfire graph memory', () => {
  it('injects graph context into the system prompt when recall returns hits', async () => {
    const calls = mockOpenRouter();
    const recallFn = vi.fn(
      async (): Promise<RecallResult> => ({
        kind: 'sdk_response',
        query: 'who is ZAO?',
        hits: 3,
        text: '- ZAO is a 188-member music community [src: doc]',
      }),
    );
    const r = await draftCast({ persona: 'You are ZOL', context: 'who is ZAO?', recallFn });
    expect(recallFn).toHaveBeenCalledOnce();
    expect(r.usedGraph).toBe(true);
    expect(r.graphHits).toBe(3);
    const system = calls[0].messages[0].content;
    expect(system).toContain('ZABAL Bonfire graph');
    expect(system).toContain('188-member music community');
  });

  it('skips recall entirely when useGraphMemory is false', async () => {
    mockOpenRouter();
    const recallFn = vi.fn();
    const r = await draftCast({ persona: 'p', context: 'c', useGraphMemory: false, recallFn });
    expect(recallFn).not.toHaveBeenCalled();
    expect(r.usedGraph).toBe(false);
    expect(r.graphHits).toBe(0);
  });

  it('adds no graph block when recall finds nothing (manual-relay fallback)', async () => {
    const calls = mockOpenRouter();
    const recallFn = vi.fn(
      async (): Promise<RecallResult> => ({ kind: 'manual_relay_needed', query: 'c', relay: '...' }),
    );
    const r = await draftCast({ persona: 'p', context: 'c', recallFn });
    expect(r.usedGraph).toBe(false);
    expect(r.graphHits).toBe(0);
    expect(calls[0].messages[0].content).not.toContain('ZABAL Bonfire graph');
  });
});
