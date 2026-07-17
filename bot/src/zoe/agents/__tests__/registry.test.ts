// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// Stub the memory module so ZOE_PATHS.home is a controlled path
vi.mock('../../memory', () => ({
  ZOE_PATHS: { home: '/tmp/zoe-test' },
}));

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockAccess = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    access: mockAccess,
  },
}));

import { DEFAULT_CASTER, loadAgents, seedAgents } from '../registry';

afterEach(() => vi.clearAllMocks());

// ── DEFAULT_CASTER ───────────────────────────────────────────────────────────

describe('DEFAULT_CASTER', () => {
  it('has agent_id "caster"', () => {
    expect(DEFAULT_CASTER.agent_id).toBe('caster');
  });

  it('has cooldown_seconds >= 90', () => {
    expect(DEFAULT_CASTER.cooldown_seconds).toBeGreaterThanOrEqual(90);
  });

  it('has at least one topic', () => {
    expect(DEFAULT_CASTER.topics.length).toBeGreaterThan(0);
  });
});

// ── loadAgents ───────────────────────────────────────────────────────────────

describe('loadAgents', () => {
  it('returns [DEFAULT_CASTER] when the file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const agents = await loadAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].agent_id).toBe('caster');
  });

  it('returns [DEFAULT_CASTER] when file contains an empty array', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify([]));
    const agents = await loadAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].agent_id).toBe('caster');
  });

  it('returns [DEFAULT_CASTER] when file contains invalid JSON', async () => {
    mockReadFile.mockResolvedValue('not json');
    const agents = await loadAgents();
    expect(agents).toEqual([DEFAULT_CASTER]);
  });

  it('returns coerced agents from valid JSON', async () => {
    const custom = [{ agent_id: 'hype-bot', topics: ['music'], cooldown_seconds: 120 }];
    mockReadFile.mockResolvedValue(JSON.stringify(custom));
    const agents = await loadAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].agent_id).toBe('hype-bot');
    expect(agents[0].cooldown_seconds).toBe(120);
  });

  it('enforces minimum cooldown of 90 even when spec says less', async () => {
    const spec = [{ agent_id: 'fast-bot', cooldown_seconds: 10 }];
    mockReadFile.mockResolvedValue(JSON.stringify(spec));
    const agents = await loadAgents();
    expect(agents[0].cooldown_seconds).toBe(90);
  });

  it('merges persona dials with DEFAULT_CASTER defaults', async () => {
    const spec = [{ agent_id: 'x', persona: { tone: 'dry' } }];
    mockReadFile.mockResolvedValue(JSON.stringify(spec));
    const agents = await loadAgents();
    // tone is overridden; other dials inherit from DEFAULT_CASTER
    expect(agents[0].persona.tone).toBe('dry');
    expect(agents[0].persona.domain).toBe(DEFAULT_CASTER.persona.domain);
  });
});

// ── seedAgents ───────────────────────────────────────────────────────────────

describe('seedAgents', () => {
  it('returns { seeded: false } when agents.json already exists', async () => {
    mockAccess.mockResolvedValue(undefined); // file exists
    const result = await seedAgents();
    expect(result).toEqual({ seeded: false });
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('seeds the file when agents.json does not exist', async () => {
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const result = await seedAgents();
    expect(result).toEqual({ seeded: true });
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const writtenContent = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(writtenContent).toHaveLength(1);
    expect(writtenContent[0].agent_id).toBe('caster');
  });
});
