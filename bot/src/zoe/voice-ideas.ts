/**
 * voice-ideas.ts - a car-ride voice note becomes several draft ideas, split
 * where Zaal says so out loud.
 *
 * Card 10465, Zaal chose A on 2026-10-18. Source: the Bradley Stone / Open
 * Loops quick read (vault notes/bradley-stone-open-loops-2026-10-17.md): he
 * walks with voice mode, "marks ideas out loud ('The interesting part is...',
 * 'This might be a different article')", and shapes them at the computer
 * later. Zaal already has the car ride and ZOE voice-in; the markers are the
 * new part.
 *
 * With ZOE_VOICE_IDEAS=1 (default OFF), a DM voice note that contains at least
 * one marker is split before each marker. Each part, in Zaal's own words, is
 * saved as its own entry in the voice-memo file the personal-post drafter
 * already reads (posts/sources.ts), and ZOE replies with the list instead of
 * running a turn on the ramble. A voice note with no marker is handled exactly
 * as before.
 *
 * splitVoiceIdeas is pure.
 */

export function voiceIdeasEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_VOICE_IDEAS === '1';
}

/**
 * Spoken markers that start a new idea. Whisper writes them with varying
 * capitals and punctuation, so they match case-insensitively on word edges.
 * The marker stays in the idea: it is Zaal's own phrasing.
 */
const MARKERS = [
  'the interesting part is',
  'the interesting thing is',
  'this might be a different article',
  'that might be a different article',
  'this could be a different article',
  'that could be a different article',
  'this might be a different post',
  'that might be a different post',
  'new idea',
  'another idea',
  'separate idea',
  'different idea',
  'next idea',
];

const MARKER_RE = new RegExp(`\\b(?:${MARKERS.map((m) => m.replace(/ /g, '\\s+')).join('|')})\\b`, 'gi');

/** A part shorter than this is a stray phrase, not an idea; it joins the part before it. */
export const MIN_IDEA_WORDS = 4;
/** At most this many ideas from one voice note; the rest stay in the last one. */
export const MAX_IDEAS = 8;

/**
 * Split a transcript before each marker. Returns one part (the whole
 * transcript, trimmed) when there is no marker. Parts are flattened to one
 * line, because the voice-memo file is one entry per line.
 */
export function splitVoiceIdeas(transcript: string): string[] {
  const text = transcript.replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const cuts = [...text.matchAll(MARKER_RE)].map((m) => m.index ?? 0).filter((i) => i > 0);
  const bounds = [0, ...cuts, text.length];
  const parts: string[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const part = text
      .slice(bounds[i], bounds[i + 1])
      .trim()
      .replace(/^[,.;:!?\s-]+/, '');
    if (!part) continue;
    const short = part.split(' ').length < MIN_IDEA_WORDS;
    if ((short || parts.length >= MAX_IDEAS) && parts.length > 0) {
      parts[parts.length - 1] = `${parts[parts.length - 1]} ${part}`;
    } else {
      parts.push(part);
    }
  }
  return parts;
}

/** The reply after saving: how many, and the opening words of each. */
export function voiceIdeasReply(ideas: string[]): string {
  const lines = ideas.map((idea, i) => {
    const words = idea.split(' ');
    const head = words.slice(0, 12).join(' ');
    return `${i + 1}. ${head}${words.length > 12 ? '...' : ''}`;
  });
  return [`Saved ${ideas.length} draft ideas from that voice note. They feed the next personal post draft.`, ...lines].join('\n');
}
