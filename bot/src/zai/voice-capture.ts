/**
 * voice-capture.ts — Discord voice channel capture + live transcription for ZAI.
 *
 * Subscribes to voice channels, collects audio from all speakers, buffers
 * chunks per speaker, decodes Opus to PCM/WAV, and sends to Groq
 * Whisper for live transcription. Maintains an in-memory rolling transcript
 * per session and periodically flushes to ~/.zao/private/.
 */

import { VoiceConnection, AudioReceiveStream, EndBehaviorType } from '@discordjs/voice';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { opus } from 'prism-media';
import type { CaptureSession, TranscriptLine } from './types';
import { transcribeAudio } from '../zoe/transcribe';
import { encodeWav } from './wav';

const SILENCE_THRESHOLD_MS = 2000; // 2s silence to end a chunk

/** Discord always sends 48kHz stereo Opus, and the decoder emits 16-bit signed
 *  little-endian PCM at the same rate. 960 samples is one 20ms frame, which is
 *  the frame size Discord encodes at. */
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const FRAME_SIZE = 960;

interface AudioChunkBuffer {
  speaker: string;
  userId: string;
  /** Decoded PCM, kept as the chunks the decoder emitted. Concatenating once at
   *  the end beats accumulating a `number[]` of individual bytes, which cost
   *  ~8x the memory and pushed with a spread that can overflow the call stack. */
  pcmChunks: Buffer[];
  startTime: Date;
  lastAudioTime: Date;
}

/**
 * Subscribe to all speakers in a voice channel and collect their audio.
 * Calls onTranscribed for each new transcribed line as they arrive.
 */
export function startVoiceCapture(
  connection: VoiceConnection,
  session: CaptureSession,
  onTranscribed: (line: TranscriptLine) => Promise<void>,
): () => void {
  const buffers = new Map<string, AudioChunkBuffer>();
  const sessionDir = join(process.env.HOME || '/tmp', '.zao', 'private', `discord-${session.sessionId}`);

  // Ensure session dir exists
  fs.mkdir(sessionDir, { recursive: true }).catch((err) => console.error('Failed to create session dir:', err));

  // Subscribe to each user that joins the channel
  const handleSpeakingStart = (userId: string) => {
    if (buffers.has(userId)) return;

    const opusStream: AudioReceiveStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: SILENCE_THRESHOLD_MS },
    });

    // receiver.subscribe() yields OPUS packets, not PCM. Nothing here ever
    // decoded them - the old comment said "decoder happens at transcription
    // boundary" and no decoder was ever written - so a compressed bitstream was
    // handed to Whisper inside a WAV header. prism-media and @discordjs/opus are
    // already dependencies; they were declared and never imported.
    const decoder = new opus.Decoder({
      frameSize: FRAME_SIZE,
      channels: CHANNELS,
      rate: SAMPLE_RATE,
    });

    // Forwarded by hand rather than with .pipe(). prism-media's OpusStream does
    // not satisfy `NodeJS.WritableStream` under @types/node 22 - the same
    // class-vs-interface EventEmitter split documented on the cleanup function
    // below - so `.pipe(decoder)` is a type error. write/end are declared on
    // Transform itself and typecheck cleanly. Opus frames are 20ms and one
    // speaker at a time, so there is no backpressure worth the cast.
    opusStream.on('data', (packet: Buffer) => {
      decoder.write(packet);
    });
    opusStream.on('end', () => {
      decoder.end();
    });

    const buffer: AudioChunkBuffer = {
      speaker: `user_${userId}`,
      userId,
      pcmChunks: [],
      startTime: new Date(),
      lastAudioTime: new Date(),
    };

    buffers.set(userId, buffer);

    // A stream 'error' with no listener is an UNCAUGHT EXCEPTION in Node, which
    // takes the whole ZAI process down. One malformed packet should cost one
    // speaker's chunk, not the bot.
    const dropSpeaker = (err: unknown) => {
      console.error(`Voice capture stream failed for ${buffer.speaker}:`, err);
      buffers.delete(userId);
    };
    opusStream.on('error', dropSpeaker);
    decoder.on('error', dropSpeaker);

    decoder.on('data', (chunk: Buffer) => {
      buffer.pcmChunks.push(chunk);
      buffer.lastAudioTime = new Date();
    });

    decoder.on('end', async () => {
      const pcm = Buffer.concat(buffer.pcmChunks);
      // Release the slot BEFORE the await. Transcription takes seconds, and
      // handleSpeakingStart bails when the map still holds this user - so the
      // old ordering silently dropped whatever they said while the previous
      // chunk was still in flight.
      buffers.delete(userId);
      if (pcm.length === 0) return;

      try {
        const text = await transcribeAudio(
          encodeWav(pcm, { sampleRate: SAMPLE_RATE, channels: CHANNELS }),
          `${buffer.speaker}.wav`,
        );
        const line: TranscriptLine = {
          timestamp: new Date(),
          speaker: buffer.speaker,
          userId: buffer.userId,
          text,
        };
        session.transcript.push(line);

        // Persist transcript chunk
        const transcriptPath = join(sessionDir, `transcript-${Date.now()}.jsonl`);
        await fs.appendFile(transcriptPath, `${JSON.stringify(line)}\n`).catch(() => {
          /* ignore file write errors */
        });

        // Notify caller
        await onTranscribed(line);
      } catch (err) {
        console.error(`Transcription failed for ${buffer.speaker}:`, err);
      }
    });
  };

  connection.receiver.speaking.on('start', handleSpeakingStart);

  // Return cleanup function.
  //
  // The cast is deliberate and narrow. @discordjs/voice declares
  // `interface SpeakingMap extends EventEmitter` carrying ONLY `on` overloads,
  // which leaves the inherited removal methods off the visible type - so neither
  // `removeListener` nor `off` typechecks, even though SpeakingMap really does
  // extend EventEmitter and both exist at runtime. That is a gap in the library's
  // typings, not in this code, so the honest fix is to say so at the call site
  // rather than change behaviour or silence the file.
  //
  // Without this, the listener is never detached and every capture session leaks
  // one. It went unnoticed because the bot's dependencies were not installed
  // locally, so tsc reported 183 phantom errors and buried the three real ones.
  return () => {
    (connection.receiver.speaking as unknown as ListenerRemover).removeListener(
      'start',
      handleSpeakingStart,
    );
  };
}

/**
 * The single EventEmitter method this module needs from SpeakingMap.
 *
 * Declared here rather than imported because neither route typechecks:
 * @discordjs/voice declares `interface SpeakingMap extends EventEmitter` carrying
 * ONLY `on` overloads, which hides the inherited removal methods, and node's own
 * `EventEmitter` type splits its class and interface in @types/node 22 such that
 * `off` is not on the imported interface either.
 *
 * SpeakingMap genuinely extends EventEmitter, so removeListener exists at
 * runtime. Naming the exact method we rely on is narrower and more honest than
 * casting to `any` - if this assumption ever stops holding, the failure is a
 * visible one line, not a silent no-op.
 */
interface ListenerRemover {
  removeListener(event: string, listener: (...args: never[]) => void): unknown;
}

/**
 * Build a plain-text transcript summary from the lines collected so far.
 */
export function formatTranscript(lines: TranscriptLine[]): string {
  return lines.map((line) => `[${line.speaker}] ${line.text}`).join('\n');
}

/**
 * Save full session transcript to ~/.zao/private/ and return the file path.
 */
export async function saveSessionTranscript(session: CaptureSession): Promise<string> {
  const sessionDir = join(process.env.HOME || '/tmp', '.zao', 'private', `discord-${session.sessionId}`);
  await fs.mkdir(sessionDir, { recursive: true });

  const fullPath = join(sessionDir, 'full-transcript.jsonl');
  for (const line of session.transcript) {
    await fs.appendFile(fullPath, `${JSON.stringify(line)}\n`);
  }

  return fullPath;
}
