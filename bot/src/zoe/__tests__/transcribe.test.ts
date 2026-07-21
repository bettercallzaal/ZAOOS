// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockMkdir = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn(() => { throw new Error('ENOENT'); }));
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: { mkdir: mockMkdir, writeFile: mockWriteFile },
  readFileSync: mockReadFileSync,
}));

import {
  downloadTelegramFile,
  transcribeAudio,
  transcribeTelegramFile,
  transcriptionConfigured,
} from '../transcribe';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_WHISPER_MODEL;
  mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
});

// ── transcriptionConfigured ───────────────────────────────────────────────────

describe('transcriptionConfigured', () => {
  it('returns false when GROQ_API_KEY is not set', () => {
    expect(transcriptionConfigured()).toBe(false);
  });

  it('returns true when GROQ_API_KEY is set', () => {
    process.env.GROQ_API_KEY = 'test-key';
    expect(transcriptionConfigured()).toBe(true);
  });
});

// ── transcribeAudio ───────────────────────────────────────────────────────────

function makeFetchOk(text: string) {
  mockFetch.mockResolvedValue({ ok: true, status: 200, text: vi.fn().mockResolvedValue(text) });
  vi.stubGlobal('fetch', mockFetch);
}

function makeFetchFail(status: number, detail = '') {
  mockFetch.mockResolvedValue({ ok: false, status, text: vi.fn().mockResolvedValue(detail) });
  vi.stubGlobal('fetch', mockFetch);
}

function withGlossary(whisperPrompt: string, corrections: Record<string, string>) {
  mockReadFileSync.mockReturnValue(
    JSON.stringify({ whisperPrompt, corrections }),
  );
}

describe('transcribeAudio', () => {
  it('throws when GROQ_API_KEY is not configured', async () => {
    await expect(transcribeAudio(new Uint8Array([1, 2]))).rejects.toThrow('GROQ_API_KEY not configured');
  });

  it('posts to Groq and returns trimmed text', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    makeFetchOk('  Hello world  ');
    const result = await transcribeAudio(new Uint8Array([1, 2, 3]), 'voice.ogg');
    expect(result).toBe('Hello world');
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect(opts.headers).toMatchObject({ Authorization: 'Bearer test-key' });
  });

  it('throws on non-ok response with status code in message', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    makeFetchFail(400, 'bad request');
    await expect(transcribeAudio(new Uint8Array([1]))).rejects.toThrow('groq transcription 400');
  });

  it('uses GROQ_WHISPER_MODEL when set, defaults to whisper-large-v3-turbo', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    process.env.GROQ_WHISPER_MODEL = 'whisper-large-v3';
    makeFetchOk('ok');
    await transcribeAudio(new Uint8Array([1]));
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as FormData;
    expect(body.get('model')).toBe('whisper-large-v3');
  });

  it('sends whisperPrompt as prompt field when glossary is loaded', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    withGlossary('ZAO, ZABAL, WaveWarZ', {});
    makeFetchOk('ok');
    await transcribeAudio(new Uint8Array([1]));
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as FormData;
    expect(body.get('prompt')).toBe('ZAO, ZABAL, WaveWarZ');
  });

  it('does not send prompt field when glossary file is missing', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    makeFetchOk('ok');
    await transcribeAudio(new Uint8Array([1]));
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as FormData;
    expect(body.get('prompt')).toBeNull();
  });

  it('applies corrections map to the raw transcript (case-insensitive)', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    withGlossary('', { 'wave wars': 'WaveWarZ', 'z a b a l': 'ZABAL' });
    makeFetchOk('The Z A B A L team played Wave Wars tonight');
    const result = await transcribeAudio(new Uint8Array([1]));
    expect(result).toBe('The ZABAL team played WaveWarZ tonight');
  });

  it('returns raw transcript unchanged when glossary has no corrections', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    withGlossary('ZAO', {});
    makeFetchOk('  plain text  ');
    const result = await transcribeAudio(new Uint8Array([1]));
    expect(result).toBe('plain text');
  });
});

// ── transcribeTelegramFile ────────────────────────────────────────────────────

describe('transcribeTelegramFile', () => {
  it('fetches file metadata, downloads bytes, and transcribes via Groq', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { file_path: 'voice/audio.ogg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue('transcribed text'),
      });
    vi.stubGlobal('fetch', mockFetch);
    const result = await transcribeTelegramFile('BOT_TOKEN', 'file123');
    expect(result).toBe('transcribed text');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws when getFile returns ok:false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: false }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await expect(transcribeTelegramFile('TOKEN', 'id')).rejects.toThrow('telegram getFile failed');
  });

  it('throws when the file download returns a non-ok status', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { file_path: 'voice/audio.ogg' } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    vi.stubGlobal('fetch', mockFetch);
    await expect(transcribeTelegramFile('TOKEN', 'id')).rejects.toThrow('telegram file download 403');
  });
});

// ── downloadTelegramFile ──────────────────────────────────────────────────────

describe('downloadTelegramFile', () => {
  it('downloads the file and writes it to destDir', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { file_path: 'photos/photo.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
    vi.stubGlobal('fetch', mockFetch);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const dest = await downloadTelegramFile('TOKEN', 'id', '/tmp/zoe-files');
    expect(mockMkdir).toHaveBeenCalledWith('/tmp/zoe-files', { recursive: true });
    expect(dest).toContain('/tmp/zoe-files');
    expect(dest).toContain('photo.jpg');
  });

  it('sanitizes the filename (replaces unsafe chars with _)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { file_path: 'docs/my file (1).pdf' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
      });
    vi.stubGlobal('fetch', mockFetch);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const dest = await downloadTelegramFile('TOKEN', 'id', '/tmp/files');
    expect(dest).not.toContain(' ');
    expect(dest).not.toContain('(');
  });

  it('uses preferName when provided instead of the remote filename', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { file_path: 'tmp/random123' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
      });
    vi.stubGlobal('fetch', mockFetch);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const dest = await downloadTelegramFile('TOKEN', 'id', '/tmp/files', 'custom-name.pdf');
    expect(dest).toContain('custom-name.pdf');
  });

  it('throws when getFile returns ok:false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: false }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await expect(downloadTelegramFile('TOKEN', 'id', '/tmp')).rejects.toThrow('telegram getFile failed');
  });
});
