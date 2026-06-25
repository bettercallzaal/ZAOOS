// transcribe.ts — voice/audio -> text for ZOE, via Groq's Whisper API.
//
// Why Groq: the fleet box has no local whisper/ffmpeg, and Groq's whisper
// endpoint is free-tier, fast, and accepts Telegram's .ogg/opus directly (it
// handles decoding server-side). No new npm dep - just `fetch` + a key.
//
// Setup: add GROQ_API_KEY to bot/.env (free key from console.groq.com).
// Optional GROQ_WHISPER_MODEL (default whisper-large-v3-turbo).

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export function transcriptionConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/** Transcribe raw audio bytes (e.g. a Telegram voice .ogg) to text. */
export async function transcribeAudio(
  bytes: Uint8Array,
  filename = 'voice.ogg',
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  const model = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';

  const form = new FormData();
  form.append('file', new Blob([bytes]), filename);
  form.append('model', model);
  form.append('response_format', 'text');

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
  return (await res.text()).trim();
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
  const name = filePath.split('/').pop() || 'voice.ogg';
  return transcribeAudio(bytes, name);
}
