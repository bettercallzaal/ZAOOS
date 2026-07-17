// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCallClaudeCli = vi.hoisted(() => vi.fn());
vi.mock('../../hermes/claude-cli', () => ({
  callClaudeCli: mockCallClaudeCli,
}));

const mockRemember = vi.hoisted(() => vi.fn());
vi.mock('../recall', () => ({ remember: mockRemember }));

const mockMkdir = vi.hoisted(() => vi.fn());
const mockAccess = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockAppendFile = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({
  promises: {
    mkdir: mockMkdir,
    access: mockAccess,
    writeFile: mockWriteFile,
    appendFile: mockAppendFile,
  },
}));

import { captureResume, looksLikeResume, stripResumeTrigger } from '../resume';

afterEach(() => vi.clearAllMocks());

// ── stripResumeTrigger ─────────────────────────────────────────────────────────

describe('stripResumeTrigger', () => {
  it('strips /resume command prefix', () => {
    expect(stripResumeTrigger('/resume Eagle Scout')).toBe('Eagle Scout');
  });

  it('strips /cv command prefix', () => {
    expect(stripResumeTrigger('/cv National Ski Patroller')).toBe('National Ski Patroller');
  });

  it('strips bot-mention suffix from command (e.g. /resume@botname)', () => {
    expect(stripResumeTrigger('/resume@mybot Eagle Scout')).toBe('Eagle Scout');
  });

  it('strips "add to my resume" preamble', () => {
    expect(stripResumeTrigger('add to my resume Eagle Scout')).toBe('Eagle Scout');
  });

  it('strips "for my resume" preamble', () => {
    expect(stripResumeTrigger('for my resume: Eagle Scout')).toBe('Eagle Scout');
  });

  it('strips "resume:" preamble', () => {
    expect(stripResumeTrigger('resume: Eagle Scout')).toBe('Eagle Scout');
  });

  it('returns plain text unchanged when no trigger present', () => {
    expect(stripResumeTrigger('Eagle Scout, earned 2010')).toBe('Eagle Scout, earned 2010');
  });
});

// ── looksLikeResume ────────────────────────────────────────────────────────────

describe('looksLikeResume', () => {
  it('returns true for "add to my resume..."', () => {
    expect(looksLikeResume('add to my resume Eagle Scout')).toBe(true);
  });

  it('returns true for "for my resume..."', () => {
    expect(looksLikeResume('for my resume: Eagle Scout')).toBe(true);
  });

  it('returns true for "resume: ..."', () => {
    expect(looksLikeResume('resume: Eagle Scout')).toBe(true);
  });

  it('returns false for a normal message', () => {
    expect(looksLikeResume('how are you?')).toBe(false);
  });

  it('returns false for a /resume command (which goes through cmdHandler, not looksLike gate)', () => {
    expect(looksLikeResume('/resume Eagle Scout')).toBe(false);
  });
});

// ── captureResume ──────────────────────────────────────────────────────────────

describe('captureResume', () => {
  beforeEach(() => {
    mockMkdir.mockResolvedValue(undefined);
    mockAccess.mockResolvedValue(undefined); // file exists → skip initial write
    mockAppendFile.mockResolvedValue(undefined);
    mockRemember.mockResolvedValue(undefined);
  });

  it('returns usage prompt when text is empty after stripping trigger', async () => {
    const r = await captureResume('/resume');
    expect(r).toContain('Tell me what to add');
    expect(mockCallClaudeCli).not.toHaveBeenCalled();
  });

  it('uses the Claude-formatted line when callClaudeCli returns a bullet line', async () => {
    mockCallClaudeCli.mockResolvedValue({
      text: '- **Eagle Scout** (achievement, 2010) - Highest rank in Scouting.',
      isError: false,
      inputTokens: 50,
      outputTokens: 20,
    });
    const r = await captureResume('/resume Eagle Scout');
    expect(r).toContain('**Eagle Scout**');
    expect(mockAppendFile).toHaveBeenCalledOnce();
    const appended: string = mockAppendFile.mock.calls[0][1];
    expect(appended).toContain('**Eagle Scout**');
  });

  it('falls back to the raw text when callClaudeCli throws', async () => {
    mockCallClaudeCli.mockRejectedValue(new Error('rate limit'));
    const r = await captureResume('/resume Eagle Scout earned 2010');
    expect(r).toContain('Eagle Scout');
    expect(mockAppendFile).toHaveBeenCalledOnce();
  });

  it('creates the resume file header when the file does not exist yet', async () => {
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // no file yet
    mockWriteFile.mockResolvedValue(undefined);
    mockCallClaudeCli.mockResolvedValue({ text: '- Some credential', isError: false, inputTokens: 10, outputTokens: 5 });
    await captureResume('/resume Some credential');
    expect(mockWriteFile).toHaveBeenCalledOnce();
    expect(mockWriteFile.mock.calls[0][1]).toContain('# Zaal Panthaki');
  });

  it('calls remember() to persist the credential to the graph', async () => {
    mockCallClaudeCli.mockResolvedValue({ text: '- **Ski Patrol** (certification, 2020) - Saved lives.', isError: false, inputTokens: 10, outputTokens: 5 });
    await captureResume('/resume Ski Patrol');
    expect(mockRemember).toHaveBeenCalledOnce();
    const opts = mockRemember.mock.calls[0][0];
    expect(opts.sourceTag).toBe('zaal-resume');
  });

  it('returns confirmation text with the formatted line', async () => {
    mockCallClaudeCli.mockResolvedValue({ text: '- **Eagle Scout** (achievement, 2010) - Top rank.', isError: false, inputTokens: 10, outputTokens: 5 });
    const r = await captureResume('/resume Eagle Scout');
    expect(r).toContain('Added to your resume');
    expect(r).toContain('**Eagle Scout**');
  });
});
