import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Isolate the seen-episodes store in a temp dir. ZOE_HOME is read at module
// load, so this hoisted assignment must run before importing extractors.
const TEST_HOME = vi.hoisted(() => {
  const { join } = require('node:path');
  const { tmpdir } = require('node:os');
  const dir = join(tmpdir(), 'zoe-extract-test');
  process.env.ZOE_HOME = dir;
  return dir;
});
const SEEN_PATH = join(TEST_HOME, 'seen-episodes.json');

const mocks = vi.hoisted(() => ({
  callClaudeCli: vi.fn(),
  remember: vi.fn(),
  bonfireConfigured: vi.fn(() => true),
}));

vi.mock('../../hermes/claude-cli', () => ({
  callClaudeCli: mocks.callClaudeCli,
}));

vi.mock('../recall', () => ({
  remember: mocks.remember,
  bonfireConfigured: mocks.bonfireConfigured,
}));

import {
  fanOutKnowledgeExtractors,
  parseCandidates,
  containsPii,
  bodyHash,
  EXTRACT_MIN_LEN,
} from '../extractors';

function cliResult(text: string, isError = false) {
  return {
    text,
    isError,
    inputTokens: 0,
    outputTokens: 0,
    totalCostUsd: 0,
    model: 'haiku',
    durationMs: 1,
    numTurns: 1,
    sessionId: 't',
  };
}

const LONG = 'On 2026-06-16 Zaal decided to ship the extractor fan-out and met a new collaborator named Sam.';

beforeEach(async () => {
  vi.clearAllMocks();
  await fs.rm(SEEN_PATH, { force: true }); // fresh seen store each test
  mocks.bonfireConfigured.mockReturnValue(true);
  mocks.remember.mockResolvedValue({ ok: true });
  mocks.callClaudeCli.mockResolvedValue(cliResult('[]'));
});

describe('bodyHash', () => {
  it('is stable across whitespace and case', () => {
    expect(bodyHash('Hello  World')).toBe(bodyHash('hello world'));
  });
  it('differs for different content', () => {
    expect(bodyHash('a fact')).not.toBe(bodyHash('another fact'));
  });
});

describe('containsPii', () => {
  it('flags a non-allowlisted email', () => {
    expect(containsPii('reach Bob at bob@randomcorp.com today')).toBe(true);
  });
  it('allows an allowlisted ZAO email', () => {
    expect(containsPii('email zaal@thezao.com for the deck')).toBe(false);
  });
  it('flags a phone number', () => {
    expect(containsPii('call +1 415 555 1234 tomorrow')).toBe(true);
  });
  it('passes clean prose', () => {
    expect(containsPii('Zaal shipped the extractor on 2026-06-16')).toBe(false);
  });
});

describe('parseCandidates', () => {
  it('parses a clean JSON array', () => {
    const out = parseCandidates('[{"body":"Zaal shipped extractors on 2026-06-16","confidence":0.9}]', 'decisions');
    expect(out).toHaveLength(1);
    expect(out[0].confidence).toBe(0.9);
    expect(out[0].name).toMatch(/^extract:decisions:[0-9a-f]{12}$/);
  });
  it('pulls the array out of surrounding prose', () => {
    const out = parseCandidates('Here you go: [{"body":"a fact stated clearly here","confidence":0.8}] done', 'people');
    expect(out).toHaveLength(1);
  });
  it('returns [] on non-array JSON', () => {
    expect(parseCandidates('{"body":"x","confidence":1}', 'people')).toEqual([]);
  });
  it('returns [] on garbage', () => {
    expect(parseCandidates('not json at all', 'people')).toEqual([]);
  });
  it('drops items with wrong types or too-short bodies', () => {
    const out = parseCandidates('[{"body":"short","confidence":0.9},{"body":123,"confidence":0.9},{"body":"a valid long body here","confidence":"hi"}]', 'projects');
    expect(out).toEqual([]);
  });
});

describe('fanOutKnowledgeExtractors', () => {
  it('no-ops when Bonfire is unconfigured', async () => {
    mocks.bonfireConfigured.mockReturnValue(false);
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp' });
    expect(r).toEqual({ written: 0, skipped: 0 });
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
  });

  it('no-ops on a short message', async () => {
    const r = await fanOutKnowledgeExtractors('ok thanks', { cwd: '/tmp' });
    expect(r).toEqual({ written: 0, skipped: 0 });
    expect(mocks.callClaudeCli).not.toHaveBeenCalled();
    expect(LONG.length).toBeGreaterThanOrEqual(EXTRACT_MIN_LEN);
  });

  it('writes a high-confidence candidate to the graph', async () => {
    mocks.callClaudeCli
      .mockResolvedValueOnce(cliResult('[{"body":"Sam is a new collaborator as of 2026-06-16","confidence":0.9}]'))
      .mockResolvedValue(cliResult('[]'));
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp', today: '2026-06-16' });
    expect(r.written).toBe(1);
    expect(mocks.remember).toHaveBeenCalledTimes(1);
    expect(mocks.remember).toHaveBeenCalledWith(
      expect.objectContaining({ sourceTag: 'zoe:extract' }),
    );
    const persisted = JSON.parse(await fs.readFile(SEEN_PATH, 'utf8')) as string[];
    expect(persisted).toContain(bodyHash('Sam is a new collaborator as of 2026-06-16'));
  });

  it('filters out low-confidence candidates', async () => {
    mocks.callClaudeCli
      .mockResolvedValueOnce(cliResult('[{"body":"a weakly-supported guess here","confidence":0.4}]'))
      .mockResolvedValue(cliResult('[]'));
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp' });
    expect(r.written).toBe(0);
    expect(r.skipped).toBe(1);
    expect(mocks.remember).not.toHaveBeenCalled();
  });

  it('filters out candidates containing PII', async () => {
    mocks.callClaudeCli
      .mockResolvedValueOnce(cliResult('[{"body":"Reach the vendor at vendor@thirdparty.com per Zaal","confidence":0.95}]'))
      .mockResolvedValue(cliResult('[]'));
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp' });
    expect(r.written).toBe(0);
    expect(r.skipped).toBe(1);
    expect(mocks.remember).not.toHaveBeenCalled();
  });

  it('skips candidates already in the seen store (dedup)', async () => {
    const body = 'Sam is a new collaborator as of 2026-06-16';
    await fs.mkdir(TEST_HOME, { recursive: true });
    await fs.writeFile(SEEN_PATH, JSON.stringify([bodyHash(body)]), 'utf8');
    mocks.callClaudeCli
      .mockResolvedValueOnce(cliResult(`[{"body":"${body}","confidence":0.9}]`))
      .mockResolvedValue(cliResult('[]'));
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp' });
    expect(r.written).toBe(0);
    expect(r.skipped).toBe(1);
    expect(mocks.remember).not.toHaveBeenCalled();
  });

  it('survives an extractor throwing (best-effort)', async () => {
    mocks.callClaudeCli
      .mockRejectedValueOnce(new Error('cli boom'))
      .mockResolvedValue(cliResult('[]'));
    const r = await fanOutKnowledgeExtractors(LONG, { cwd: '/tmp' });
    expect(r.written).toBe(0);
  });
});
