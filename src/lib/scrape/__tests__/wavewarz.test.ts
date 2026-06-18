// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseWaveWarzArtistPage } from '../wavewarz';

const fixture = readFileSync(join(__dirname, 'wavewarz-fixture.html'), 'utf-8');
const WALLET = '62g5hYiSTqj185F26c3pT6EPx4Gs1P6gL72kGNzvkbjM';

describe('parseWaveWarzArtistPage', () => {
  it('extracts stats from a real WaveWarZ flight payload', () => {
    const res = parseWaveWarzArtistPage(fixture, WALLET);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.wins).toBe(61);
    expect(res.data.losses).toBe(27);
    expect(res.data.battlesCount).toBe(88);
    expect(res.data.totalVolumeSol).toBeCloseTo(5.2337, 4);
    expect(res.data.careerEarningsSol).toBeCloseTo(0.0922, 4);
    expect(res.data.winRatePct).toBe(69);
    expect(res.data.wallet).toBe(WALLET);
  });

  it('extracts the artist name from the page title', () => {
    const res = parseWaveWarzArtistPage(fixture, WALLET);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.name).toBe('Hurric4n3Ike');
  });

  it('fails loudly (does not return zeros) when no stats are present', () => {
    const longNoStatsHtml =
      '<html><head><title>Nope - WaveWarZ Player Card</title></head><body>' +
      'this page has navigation and footer text but absolutely no rendered stat blocks anywhere in it. '.repeat(3) +
      '</body></html>';
    const res = parseWaveWarzArtistPage(longNoStatsHtml, WALLET);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toMatch(/no stats found/);
  });

  it('rejects empty html', () => {
    const res = parseWaveWarzArtistPage('', WALLET);
    expect(res.ok).toBe(false);
  });

  it('parses stats even when escaped flight quotes are present', () => {
    // Synthetic minimal escaped-flight snippet mirroring the real structure.
    const html =
      '<title>TestArtist - WaveWarZ Player Card</title>' +
      '{\\"children\\":7},{\\"children\\":\\"Wins\\"}' +
      '{\\"children\\":3},{\\"children\\":\\"Losses\\"}' +
      '{\\"children\\":\\"Total Volume\\"}{\\"children\\":\\"1.5 SOL\\"}' +
      '{\\"children\\":\\"Career Earnings\\"}{\\"children\\":\\"0.25 SOL\\"}';
    const res = parseWaveWarzArtistPage(html, 'WALLET2');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.name).toBe('TestArtist');
    expect(res.data.wins).toBe(7);
    expect(res.data.losses).toBe(3);
    expect(res.data.totalVolumeSol).toBe(1.5);
    expect(res.data.careerEarningsSol).toBe(0.25);
  });
});