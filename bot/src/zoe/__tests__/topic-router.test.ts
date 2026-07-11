import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeTopic, topicNameForThread } from '../topic-router';

const { readTopicsMock } = vi.hoisted(() => ({ readTopicsMock: vi.fn() }));
vi.mock('../topics', () => ({ readTopics: readTopicsMock }));

describe('routeTopic', () => {
  it('routes Research to the research pipeline', () => {
    expect(routeTopic('Research')).toEqual({ kind: 'research' });
  });

  it('routes Coding to the auto-PR pipeline', () => {
    expect(routeTopic('Coding')).toEqual({ kind: 'coding' });
  });

  it('routes Ideas to a tagged capture', () => {
    expect(routeTopic('Ideas')).toEqual({ kind: 'capture', project: 'ideas' });
  });

  it('routes cast topics to a draft with the right kind', () => {
    expect(routeTopic('Farcaster')).toMatchObject({ kind: 'draft', draftKind: 'farcaster-cast' });
    expect(routeTopic('ZOL')).toMatchObject({ kind: 'draft', draftKind: 'zol-cast' });
    expect(routeTopic('Newsletter')).toMatchObject({ kind: 'draft', draftKind: 'newsletter' });
  });

  it('brand topics also capture a tagged note', () => {
    expect(routeTopic('WaveWarZ')).toMatchObject({ kind: 'draft', alsoCapture: 'wavewarz' });
    expect(routeTopic('ZABAL Games')).toMatchObject({ kind: 'draft', alsoCapture: 'zabal-games' });
  });

  it('passive + unknown topics fall through to chat', () => {
    expect(routeTopic('Handoffs')).toEqual({ kind: 'chat' });
    expect(routeTopic('Claude Code')).toEqual({ kind: 'chat' });
    expect(routeTopic('Something Else')).toEqual({ kind: 'chat' });
    expect(routeTopic(undefined)).toEqual({ kind: 'chat' });
  });
});

describe('topicNameForThread', () => {
  const origEnv = process.env.ZAAL_BOTZ_RESEARCH_THREAD;
  afterEach(() => {
    readTopicsMock.mockReset();
    process.env.ZAAL_BOTZ_RESEARCH_THREAD = origEnv;
  });

  it('returns undefined for the General thread (no id)', async () => {
    readTopicsMock.mockResolvedValue({});
    expect(await topicNameForThread(undefined)).toBeUndefined();
  });

  it('maps a thread id to its topic name via topics.json', async () => {
    readTopicsMock.mockResolvedValue({ Coding: 19, Ideas: 21 });
    expect(await topicNameForThread(19)).toBe('Coding');
    expect(await topicNameForThread(21)).toBe('Ideas');
  });

  it('falls back to the Research env thread', async () => {
    process.env.ZAAL_BOTZ_RESEARCH_THREAD = '8';
    readTopicsMock.mockResolvedValue({});
    expect(await topicNameForThread(8)).toBe('Research');
  });

  it('returns undefined for an unmapped thread', async () => {
    readTopicsMock.mockResolvedValue({ Coding: 19 });
    expect(await topicNameForThread(999)).toBeUndefined();
  });
});
