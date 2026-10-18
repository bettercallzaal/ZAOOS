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
 * one marker AT THE START OF A SENTENCE, and asks ZOE nothing (no "?"), is
 * split before each marker. Mid-sentence markers do not count (Evaluator,
 * #4016: "what do you think of this new idea for the festival, should we book
 * the parklet again?" was split and saved, and the question never answered).
 * Each part, in Zaal's own words, is saved as its own entry in the voice-memo file the personal-post drafter
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
 * capitals and punctuation, so they match case-insensitively, but only at the
 * start of the transcript or right after . ! ? or a line break, optionally
 * after a filler ("so", "okay", "and"). The marker stays in the idea: it is
 * Zaal's own phrasing.
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

const FILLER = '(?:(?:so|okay|ok|and|um|uh|alright)[,.]?\\s+)*';
const MARKER_RE = new RegExp(
  `(?<=^|[.!?\\n]\\s*)${FILLER}(?:${MARKERS.map((m) => m.replace(/ /g, '\\s+')).join('|')})\\b`,
  'gi',
);

/** A part shorter than this is a stray phrase, not an idea; it joins the part before it. */
export const MIN_IDEA_WORDS = 4;
/** At most this many ideas from one voice note; the rest stay in the last one. */
export const MAX_IDEAS = 8;

/**
 * Split a transcript before each marker. Returns one part (the whole
 * transcript, flattened) when there is no marker or when it asks something:
 * a question goes to ZOE as a normal turn. Parts are flattened to one line,
 * because the voice-memo file is one entry per line.
 */
export function splitVoiceIdeas(transcript: string): string[] {
  const raw = transcript.trim();
  if (!raw) return [];
  const flat = (t: string): string => t.replace(/\s+/g, ' ').trim();
  if (raw.includes('?')) return [flat(raw)];
  const cuts = [...raw.matchAll(MARKER_RE)].map((m) => m.index ?? 0).filter((i) => i > 0);
  const bounds = [0, ...cuts, raw.length];
  const parts: string[] = [];
  let carry = '';
  for (let i = 0; i < bounds.length - 1; i++) {
    const part = flat(`${carry} ${raw.slice(bounds[i], bounds[i + 1])}`).replace(/^[,.;:!\s-]+/, '');
    carry = '';
    if (!part) continue;
    const short = part.split(' ').length < MIN_IDEA_WORDS;
    if (short && parts.length === 0 && i < bounds.length - 2) {
      // "So." or "um so." before the first marker: it opens the next idea.
      carry = part;
    } else if ((short || parts.length >= MAX_IDEAS) && parts.length > 0) {
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
