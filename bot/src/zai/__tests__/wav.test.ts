import { describe, expect, it } from 'vitest';
import { encodeWav } from '../wav';

const tag = (b: Uint8Array, at: number) => String.fromCharCode(...b.slice(at, at + 4));
const dv = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength);
const u32 = (b: Uint8Array, at: number) => dv(b).getUint32(at, true);
const u16 = (b: Uint8Array, at: number) => dv(b).getUint16(at, true);

/** Discord's decoded format: 48kHz, stereo, 16-bit signed little-endian. */
const DISCORD = { sampleRate: 48000, channels: 2 };

describe('encodeWav', () => {
  it('writes a canonical RIFF/WAVE header', () => {
    const wav = encodeWav(new Uint8Array(8), DISCORD);
    expect(tag(wav, 0)).toBe('RIFF');
    expect(tag(wav, 8)).toBe('WAVE');
    expect(tag(wav, 12)).toBe('fmt ');
    expect(tag(wav, 36)).toBe('data');
    expect(u32(wav, 16)).toBe(16); // fmt chunk size
    expect(u16(wav, 20)).toBe(1); // uncompressed PCM
  });

  it('declares the byte count it actually has - the bug that made every transcript noise', () => {
    // The old code set dataLength = bytes * 2, so the header promised twice the
    // audio the file contained. A decoder reading past the end gets garbage.
    const pcm = new Uint8Array(1000);
    const wav = encodeWav(pcm, DISCORD);
    expect(u32(wav, 40)).toBe(1000); // data chunk size, NOT 2000
    expect(u32(wav, 4)).toBe(36 + 1000); // RIFF size
    expect(wav.length).toBe(44 + 1000);
  });

  it('copies the samples through byte-for-byte', () => {
    // The old code widened each BYTE into a 16-bit sample, so 0xff became the
    // value 255 instead of part of a sample - every payload came out near-silent.
    const pcm = new Uint8Array([0x00, 0x80, 0xff, 0x7f, 0x34, 0x12]);
    const wav = encodeWav(pcm, DISCORD);
    expect(Array.from(wav.slice(44))).toEqual(Array.from(pcm));
  });

  it('derives block align and byte rate from the format', () => {
    const wav = encodeWav(new Uint8Array(4), DISCORD);
    expect(u16(wav, 22)).toBe(2); // channels
    expect(u32(wav, 24)).toBe(48000); // sample rate
    expect(u16(wav, 32)).toBe(4); // block align = 2ch * 16bit / 8
    expect(u32(wav, 28)).toBe(192000); // byte rate = 48000 * 4
    expect(u16(wav, 34)).toBe(16); // bits per sample
  });

  it('handles mono and an empty payload without lying about either', () => {
    const mono = encodeWav(new Uint8Array(0), { sampleRate: 16000, channels: 1 });
    expect(u32(mono, 40)).toBe(0);
    expect(mono.length).toBe(44);
    expect(u16(mono, 32)).toBe(2); // 1ch * 16bit / 8
    expect(u32(mono, 28)).toBe(32000);
  });
});
