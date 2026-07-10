import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMemoryBlocks, _resetIcmCache } from '../memory';

beforeEach(() => {
  _resetIcmCache();
  vi.restoreAllMocks();
});

describe('buildMemoryBlocks brain override', () => {
  it('uses the ICM box body as persona when icmBoxId is set', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('# ZAO Devz\nWe ship the ZAO.', { status: 200 }),
    );
    const blocks = await buildMemoryBlocks('private', undefined, { icmBoxId: 'icm_devz' });
    expect(blocks.persona).toContain('We ship the ZAO.');
  });

  it('falls back to the normal persona when the ICM fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const blocks = await buildMemoryBlocks('private', undefined, { icmBoxId: 'icm_down' });
    expect(blocks.persona.length).toBeGreaterThan(0); // did not blow up; used ZOE persona
  });

  it('does not fetch an ICM box when no brain override is passed', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await buildMemoryBlocks('private');
    expect(spy).not.toHaveBeenCalled(); // no ICM fetch on the default ZOE path
  });
});
