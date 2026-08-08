// transcribe.ts — voice/audio -> text for ZOE, via Groq's Whisper API.
//
// Why Groq: the fleet box has no local whisper/ffmpeg, and Groq's whisper
// endpoint is free-tier, fast, and accepts Telegram's .ogg/opus directly (it
// handles decoding server-side). No new npm dep - just `fetch` + a key.
//
// Setup: add GROQ_API_KEY to bot/.env (free key from console.groq.com).
// Optional GROQ_WHISPER_MODEL (default whisper-large-v3-turbo).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

interface VoiceGlossary {
  whisperPrompt: string;
  corrections: Record<string, string>;
}

/**
 * Absolute path to the ZAO proper-noun glossary.
 *
 * TWO THINGS WERE WRONG HERE, and both were invisible because the only reader
 * swallowed every error and returned null.
 *
 * 1. THE DEPTH. This file lives at `bot/src/zoe/`, so `../../../../` from here
 *    resolves ABOVE the repository root - the glossary was never at the path
 *    being read, on any machine. Three levels reach the repo root; four leave it.
 *
 * 2. `__dirname`. `bot/package.json` is `"type": "module"` and this file is an
 *    ES module, where `__dirname` is not a module-scope binding - referencing it
 *    is a ReferenceError under plain node, and whether a loader shims it is a
 *    property of the loader, not of the code. Every other file in `bot/src` that
 *    needs its own directory already uses `fileURLToPath(import.meta.url)`
 *    (mcp/farcaster-client.ts, the heart-fleet and spore tests); this one was
 *    the outlier.
 *
 * Exported so a test can assert the path RESOLVES against the real filesystem.
 * The existing suite mocks `node:fs` wholesale, so it exercised the parsing and
 * never the location - which is exactly how a path that escapes the repo stayed
 * green through CI.
 */
export const GLOSSARY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../research/reference/zao-voice-glossary.json',
);

/** Log the glossary miss once per process, not once per voice note. */
let warnedAboutGlossary = false;

function loadGlossary(): VoiceGlossary | null {
  try {
    return JSON.parse(readFileSync(GLOSSARY_PATH, 'utf8')) as VoiceGlossary;
  } catch (err) {
    // Optional input, so this stays non-fatal - but it is logged, once, because
    // silence is what let a broken path survive. A soft-fail nobody can see is
    // indistinguishable from a feature that works (`silent-failure-guard.md`).
    if (!warnedAboutGlossary) {
      warnedAboutGlossary = true;
      console.warn(
        `[zoe/transcribe] voice glossary unavailable at ${GLOSSARY_PATH} - ` +
          `transcribing without ZAO proper-noun bias: ${(err as Error)?.message ?? String(err)}`,
      );
    }
    return null;
  }
}

function applyCorrections(text: string, corrections: Record<string, string>): string {
  let out = text;
  for (const [wrong, right] of Object.entries(corrections)) {
    out = out.replace(new RegExp(wrong, 'gi'), right);
  }
  return out;
}

export function transcriptionConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// Groq rejects any filename whose extension is not in this list. Telegram
// serves voice notes as `.oga` - the SAME OGG/Opus container as `.ogg`, but
// spelled differently - so passing Telegram's filename straight through made
// Groq 400 on every single voice note ("file must be one of the following
// types: [flac mp3 mp4 mpeg mpga m4a ogg opus wav webm]"). Normalize instead.
const GROQ_AUDIO_EXTS = new Set([
  'flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'opus', 'wav', 'webm',
]);

/** Coerce a filename to an extension Groq accepts, defaulting to .ogg. */
export function normalizeAudioFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (GROQ_AUDIO_EXTS.has(ext)) return name;
  const base = name.replace(/\.[^.]*$/, '') || 'voice';
  return `${base}.ogg`;
}

/** Transcribe raw audio bytes (e.g. a Telegram voice .ogg) to text. */
export async function transcribeAudio(
  bytes: Uint8Array,
  filename = 'voice.ogg',
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  const model = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';
  const glossary = loadGlossary();

  const form = new FormData();
  form.append('file', new Blob([bytes as BlobPart]), filename);
  form.append('model', model);
  form.append('response_format', 'text');
  if (glossary?.whisperPrompt) {
    form.append('prompt', glossary.whisperPrompt);
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`groq transcription ${res.status}: ${detail.slice(0, 200)}`);
  }
  const raw = (await res.text()).trim();
  return glossary?.corrections ? applyCorrections(raw, glossary.corrections) : raw;
}

/** Download a Telegram file (voice/audio) by file_id and transcribe it. */
export async function transcribeTelegramFile(
  botToken: string,
  fileId: string,
): Promise<string> {
  const metaRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  const meta = (await metaRes.json()) as { ok: boolean; result?: { file_path?: string } };
  const filePath = meta.result?.file_path;
  if (!meta.ok || !filePath) throw new Error('telegram getFile failed');

  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${botToken}/${filePath}`,
    { signal: AbortSignal.timeout(30_000) },
  );
  if (!fileRes.ok) throw new Error(`telegram file download ${fileRes.status}`);
  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  const name = normalizeAudioFilename(filePath.split('/').pop() || 'voice.ogg');
  return transcribeAudio(bytes, name);
}

/**
 * Download a Telegram file (photo/document) by file_id into destDir and return
 * the local path. Used for image/doc intake - ZOE's Read tool (vision) then
 * views it. preferName lets the caller keep the original filename for documents.
 */
export async function downloadTelegramFile(
  botToken: string,
  fileId: string,
  destDir: string,
  preferName?: string,
): Promise<string> {
  const { promises: fsp } = await import('node:fs');
  const path = await import('node:path');
  const metaRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  const meta = (await metaRes.json()) as { ok: boolean; result?: { file_path?: string } };
  const filePath = meta.result?.file_path;
  if (!meta.ok || !filePath) throw new Error('telegram getFile failed');

  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${botToken}/${filePath}`,
    { signal: AbortSignal.timeout(60_000) },
  );
  if (!fileRes.ok) throw new Error(`telegram file download ${fileRes.status}`);
  const bytes = Buffer.from(await fileRes.arrayBuffer());

  await fsp.mkdir(destDir, { recursive: true });
  const base = preferName || filePath.split('/').pop() || `file-${Date.now()}`;
  // prefix with a short time-based token to avoid collisions (no Date.now in name body for determinism is unneeded here)
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '_');
  const dest = path.join(destDir, safe);
  await fsp.writeFile(dest, bytes);
  return dest;
}
