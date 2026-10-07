import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPipeline = vi.hoisted(() => vi.fn());
const mockOrchestrate = vi.hoisted(() => vi.fn());
const mockFeatureRan = vi.hoisted(() => vi.fn());

vi.mock('../index', () => ({ runCasterPipeline: mockPipeline }));
vi.mock('../../agents/orchestrate', () => ({ orchestrate: mockOrchestrate }));
vi.mock('../../feature-ran', () => ({ featureRan: mockFeatureRan }));

import { casterGuardsEnabled, handleCastTrigger } from '../trigger';

const bot = {} as never;
const cast = { fid: 123, hash: '0xabc' as const, text: 'gm ZAO' };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ZOE_CASTER_GUARDS;
});
afterEach(() => {
  delete process.env.ZOE_CASTER_GUARDS;
});

describe('casterGuardsEnabled', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['1', false],
    ['TRUE', false],
    ['false', false],
    ['true', true],
  ])('reads %j as %j', (raw, want) => {
    if (raw === undefined) delete process.env.ZOE_CASTER_GUARDS;
    else process.env.ZOE_CASTER_GUARDS = raw;
    expect(casterGuardsEnabled()).toBe(want);
  });
});

describe('handleCastTrigger', () => {
  it('with the flag off, calls the pipeline with the same trigger index.ts used to build', async () => {
    mockPipeline.mockResolvedValue({ status: 'awaiting_approval' });
    const out = await handleCastTrigger(bot, 7, cast, 'persona');
    expect(out).toEqual({ mode: 'direct', status: 'awaiting_approval' });
    expect(mockPipeline).toHaveBeenCalledWith(bot, 7, {
      agentId: 'caster',
      persona: 'persona',
      context: 'Someone cast (fid 123): "gm ZAO". Draft a reply.',
      parent: { fid: 123, hash: '0xabc' },
    });
    expect(mockOrchestrate).not.toHaveBeenCalled();
    expect(mockFeatureRan).not.toHaveBeenCalled();
  });

  it('with the flag on, goes through orchestrate and never calls the pipeline directly', async () => {
    process.env.ZOE_CASTER_GUARDS = 'true';
    mockOrchestrate.mockResolvedValue({ picked: 'zol', fired: true, detail: 'ok' });
    const out = await handleCastTrigger(bot, 7, cast, 'persona');
    expect(out).toEqual({ mode: 'guarded', fired: true, blockedBy: null, detail: 'ok' });
    expect(mockOrchestrate).toHaveBeenCalledWith(bot, 7, {
      text: 'gm ZAO',
      parent: { fid: 123, hash: '0xabc' },
    });
    expect(mockPipeline).not.toHaveBeenCalled();
    expect(mockFeatureRan).toHaveBeenCalledWith('caster-guards', 'fid 123');
  });

  it('with the flag on, reports which guard blocked', async () => {
    process.env.ZOE_CASTER_GUARDS = 'true';
    mockOrchestrate.mockResolvedValue({
      picked: 'zol',
      fired: false,
      blockedBy: 'cooldown',
      detail: '10s < 90s cooldown',
    });
    const out = await handleCastTrigger(bot, 7, cast, 'persona');
    expect(out).toEqual({
      mode: 'guarded',
      fired: false,
      blockedBy: 'cooldown',
      detail: '10s < 90s cooldown',
    });
    expect(mockPipeline).not.toHaveBeenCalled();
  });

  it('rejects when the pipeline rejects, so the caller can log it', async () => {
    mockPipeline.mockRejectedValue(new Error('draft failed'));
    await expect(handleCastTrigger(bot, 7, cast, 'persona')).rejects.toThrow('draft failed');
  });
});
