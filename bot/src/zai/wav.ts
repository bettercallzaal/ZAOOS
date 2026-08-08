/**
 * wav.ts - wrap raw PCM bytes in a WAV container.
 *
 * Split out of voice-capture.ts so it can be unit-tested on its own. That file
 * imports @discordjs/voice and prism-media at module load; this is pure
 * arithmetic on bytes and needs neither, so the part that was actually WRONG is
 * now the part that is covered.
 *
 * WHAT WAS WRONG. The previous header math took a `number[]` of individual
 * BYTES and treated each entry as a 16-bit SAMPLE: it declared
 * `dataLength = bytes.length * 2` and then wrote each byte into an `Int16Array`.
 * So a 1000-byte payload produced a header claiming 2000 bytes of audio, and
 * every 16-bit sample carried a value in 0..255 - roughly -60 dBFS, which is
 * silence to any decoder. The container said "here is twice as much audio as I
 * have" and the audio itself was inaudible.
 *
 * The fix is that PCM is already bytes. Copy them, and say how many there are.
 */

export interface WavFormat {
  sampleRate: number;
  channels: number;
  /** Only 16 is used here, but the header math is written against the field
   *  rather than the constant so it reads as the spec, not as magic numbers. */
  bitsPerSample?: number;
}

/** Canonical 44-byte RIFF/WAVE header, then the samples verbatim. */
export function encodeWav(pcm: Uint8Array, format: WavFormat): Uint8Array {
  const bitsPerSample = format.bitsPerSample ?? 16;
  const blockAlign = (format.channels * bitsPerSample) / 8;
  const byteRate = format.sampleRate * blockAlign;
  const dataLength = pcm.length;

  const out = new Uint8Array(44 + dataLength);
  const view = new DataView(out.buffer);

  // Tags are big-endian so the literal reads in the same order as the ASCII.
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + dataLength, true); // chunk size = everything after this field
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true); // fmt chunk size (PCM)
  view.setUint16(20, 1, true); // format 1 = uncompressed PCM
  view.setUint16(22, format.channels, true);
  view.setUint32(24, format.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, dataLength, true);
  out.set(pcm, 44);

  return out;
}
