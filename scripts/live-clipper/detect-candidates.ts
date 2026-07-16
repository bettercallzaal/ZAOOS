#!/usr/bin/env -S npx tsx
/**
 * Doc 992 spike: rolling-transcript + candidate-scoring script for a
 * recorded stream file. Shipped criteria: outputs ranked clip candidates.
 *
 * Transcript comes from the same mlx-whisper wrapper the /meeting skill
 * uses (segment-timestamped JSON sidecar) - not zao-transcribe.sh, which
 * only emits markdown with no timestamps and can't back a clip window.
 *
 * Usage: npx tsx scripts/live-clipper/detect-candidates.ts <recorded-file>
 */
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TRANSCRIBE_SH =
  process.env.ZAO_TRANSCRIBE_SH ??
  '/Users/zaalpanthaki/.claude/skills/meeting/scripts/transcribe.sh';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ClipCandidate {
  start: number;
  end: number;
  score: number;
  reason: string;
  text: string;
}

// Same heuristic as zaal-autocliper's highlights.ts - talk/music-heavy ZAO
// streams score on hook/energy language, not chat velocity (doc 992: chat is
// too sparse on ZAO streams to be a reliable trigger).
export const ENERGY_KEYWORDS = [
  'insane',
  'crazy',
  'wow',
  'amazing',
  'no way',
  'huge',
  'unbelievable',
  'secret',
  'never',
  'worst',
  'best',
  'biggest',
  "let's go",
  'wtf',
  'literally',
  'game changer',
  "here's why",
  'did you know',
  'the reason',
];

function lastNonEmptyLine(stdout: string): string {
  const lines = stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines.at(-1);
  if (!last) throw new Error('transcribe.sh produced no output path');
  return last;
}

export async function transcribe(mediaPath: string): Promise<TranscriptSegment[]> {
  const { stdout } = await execFileAsync('bash', [TRANSCRIBE_SH, mediaPath], {
    maxBuffer: 1024 * 1024 * 16,
  });
  const txtPath = lastNonEmptyLine(stdout);
  const jsonPath = txtPath.replace(/\.txt$/, '.json');
  const raw = JSON.parse(await readFile(jsonPath, 'utf-8')) as {
    segments: Array<{ start: number; end: number; text: string }>;
  };
  return raw.segments.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
}

function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

function scoreSegment(
  segment: TranscriptSegment,
  keywords: string[],
): { score: number; hits: string[] } {
  const hits = matchedKeywords(segment.text, keywords);
  let score = hits.length * 2;
  if (/\d+%|\$\d+/.test(segment.text)) score += 1;
  if ((segment.text.match(/!/g) ?? []).length > 0) score += 1;
  if (/\?$/.test(segment.text.trim())) score += 0.5;
  return { score, hits };
}

export interface DetectCandidatesOptions {
  minClipSec?: number;
  maxClipSec?: number;
  maxCandidates?: number;
  keywords?: string[];
}

/**
 * Returns clip candidates ranked highest-score-first (not chronological -
 * doc 992's shipped criteria is "ranked clip candidates" for a human
 * reviewer to scan top-down, unlike zaal-autocliper's chronological output).
 */
export function detectCandidates(
  segments: TranscriptSegment[],
  opts: DetectCandidatesOptions = {},
): ClipCandidate[] {
  const minClipSec = opts.minClipSec ?? 15;
  const maxClipSec = opts.maxClipSec ?? 60;
  const maxCandidates = opts.maxCandidates ?? 10;
  const keywords = opts.keywords ?? ENERGY_KEYWORDS;

  if (segments.length === 0) return [];

  const windows: ClipCandidate[] = [];

  for (let i = 0; i < segments.length; i++) {
    const start = segments[i]!.start;
    let end = segments[i]!.end;
    let score = 0;
    const hits: string[] = [];
    const texts: string[] = [];

    for (let j = i; j < segments.length; j++) {
      const seg = segments[j]!;
      if (seg.end - start > maxClipSec) break;
      const s = scoreSegment(seg, keywords);
      score += s.score;
      hits.push(...s.hits);
      texts.push(seg.text);
      end = seg.end;
      if (end - start >= minClipSec) break;
    }

    if (end - start < minClipSec) continue;
    if (score <= 0) continue;

    windows.push({
      start,
      end,
      score,
      reason:
        hits.length > 0 ? `keywords: ${[...new Set(hits)].join(', ')}` : 'punctuation/stat cue',
      text: texts.join(' ').trim(),
    });
  }

  // Non-max suppression on the highest scorers first, then keep score order.
  const byScore = [...windows].sort((a, b) => b.score - a.score);
  const selected: ClipCandidate[] = [];
  for (const candidate of byScore) {
    const overlaps = selected.some((s) => candidate.start < s.end && candidate.end > s.start);
    if (overlaps) continue;
    selected.push(candidate);
    if (selected.length >= maxCandidates) break;
  }

  return selected.sort((a, b) => b.score - a.score);
}

async function main() {
  const mediaPath = process.argv[2];
  if (!mediaPath) {
    console.error(
      'usage: npx tsx scripts/live-clipper/detect-candidates.ts <recorded-stream-file>',
    );
    process.exit(1);
  }
  const segments = await transcribe(mediaPath);
  const candidates = detectCandidates(segments);
  process.stdout.write(
    JSON.stringify({ mediaPath, segmentCount: segments.length, candidates }, null, 2) + '\n',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
