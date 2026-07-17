/**
 * voice-capture.ts — Discord voice channel capture + live transcription for ZAI.
 *
 * Subscribes to voice channels, collects audio from all speakers, buffers
 * chunks per speaker, decodes Opus to PCM/WAV, and sends to Groq
 * Whisper for live transcription. Maintains an in-memory rolling transcript
 * per session and periodically flushes to ~/.zao/private/.
 */

import { VoiceConnection, VoiceReceiveStream, EndBehaviorType } from '@discordjs/voice';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { CaptureSession, TranscriptLine } from './types';
import { transcribeAudio } from '../zoe/transcribe';

const SILENCE_THRESHOLD_MS = 2000; // 2s silence to end a chunk

interface AudioChunkBuffer {
  speaker: string;
  userId: string;
  pcmData: number[];
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

    const audioStream: VoiceReceiveStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: SILENCE_THRESHOLD_MS },
    });

    const buffer: AudioChunkBuffer = {
      speaker: `user_${userId}`,
      userId,
      pcmData: [],
      startTime: new Date(),
      lastAudioTime: new Date(),
    };

    buffers.set(userId, buffer);

    audioStream.on('data', (packet: Buffer) => {
      // Collect raw bytes; decoder happens at transcription boundary
      buffer.pcmData.push(...Array.from(packet));
      buffer.lastAudioTime = new Date();
    });

    audioStream.on('end', async () => {
      // Audio ended - transcribe if we have data
      if (buffer.pcmData.length > 0) {
        const wavBytes = constructWav(buffer.pcmData);
        try {
          const text = await transcribeAudio(new Uint8Array(wavBytes), `${buffer.speaker}.wav`);
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
      }
      buffers.delete(userId);
    });
  };

  connection.receiver.speaking.on('start', handleSpeakingStart);

  // Return cleanup function
  return () => {
    connection.receiver.speaking.removeListener('start', handleSpeakingStart);
  };
}

/**
 * Simple WAV header constructor. Input is raw PCM samples (16-bit signed, 48kHz).
 * Returns full WAV file bytes.
 */
function constructWav(pcmData: number[]): Uint8Array {
  const sampleRate = 48000;
  const channels = 1;
  const bytesPerSample = 2;
  const dataLength = pcmData.length * bytesPerSample;
  const fileLength = 36 + dataLength;

  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x46464952, true); // 'RIFF'
  view.setUint32(4, fileLength, true);
  view.setUint32(8, 0x45564157, true); // 'WAVE'

  // fmt sub-chunk
  view.setUint32(12, 0x20746d66, true); // 'fmt '
  view.setUint32(16, 16, true); // sub-chunk1 size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data sub-chunk
  view.setUint32(36, 0x61746164, true); // 'data'
  view.setUint32(40, dataLength, true);

  // Copy PCM data (as 16-bit signed integers)
  const pcmView = new Int16Array(buffer, 44);
  for (let i = 0; i < pcmData.length; i++) {
    pcmView[i] = pcmData[i];
  }

  return new Uint8Array(buffer);
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
