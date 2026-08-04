import { describe, it, expect, vi } from 'vitest';

// Mock the read-node so the tool-agent's logic is tested off the network
// (deterministic; no dependency on a live Farcaster endpoint).
vi.mock('../../farcaster/read-node', () => ({
  castsByFid: vi.fn(async (fid: number, pageSize: number) => ({ messages: [{ fid, text: 'gm' }], pageSize })),
  nodeInfo: vi.fn(async () => ({ maxHeight: 123, blockDelay: 5 })),
}));

import { castsByFidHandler, nodeInfoHandler } from '../farcaster-server';

describe('farcaster tool-agent handlers', () => {
  it('casts_by_fid wraps read-node output as MCP text content', async () => {
    const res = await castsByFidHandler({ fid: 3, pageSize: 2 });
    expect(res.content[0].type).toBe('text');
    const parsed = JSON.parse(res.content[0].text) as { messages: Array<{ fid: number }>; pageSize: number };
    expect(parsed.messages[0].fid).toBe(3);
    expect(parsed.pageSize).toBe(2);
  });

  it('node_info wraps sync info as MCP text content', async () => {
    const res = await nodeInfoHandler();
    const parsed = JSON.parse(res.content[0].text) as { maxHeight: number; blockDelay: number };
    expect(parsed.maxHeight).toBe(123);
    expect(parsed.blockDelay).toBe(5);
  });
});
