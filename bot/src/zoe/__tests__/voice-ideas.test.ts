import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_IDEAS, splitVoiceIdeas, voiceIdeasEnabled, voiceIdeasReply } from '../voice-ideas';

describe('voiceIdeasEnabled', () => {
  it.each([
    ['1', true],
    [undefined, false],
    ['0', false],
    ['true', false],
  ])('ZOE_VOICE_IDEAS=%j -> %s', (v, want) => {
    expect(voiceIdeasEnabled({ ZOE_VOICE_IDEAS: v } as NodeJS.ProcessEnv)).toBe(want);
  });
});

describe('splitVoiceIdeas', () => {
  it('no marker: one part, the whole transcript, so the normal turn runs', () => {
    expect(splitVoiceIdeas('remind me to call Tom about the ZAOstock recap tomorrow')).toEqual([
      'remind me to call Tom about the ZAOstock recap tomorrow',
    ]);
  });

  it('empty in, nothing out', () => {
    expect(splitVoiceIdeas('   ')).toEqual([]);
  });

  it('splits before each marker and keeps the marker in his words', () => {
    const t =
      'So the festival day was long and I was tired by noon. The interesting part is that the volunteers ran the whole back of house without me. ' +
      'This might be a different article, but WaveWarZ nights feel like a sport now.';
    expect(splitVoiceIdeas(t)).toEqual([
      'So the festival day was long and I was tired by noon.',
      'The interesting part is that the volunteers ran the whole back of house without me.',
      'This might be a different article, but WaveWarZ nights feel like a sport now.',
    ]);
  });

  it('whisper capitals, punctuation and line breaks do not matter', () => {
    const t = 'first thought about the newsletter and its readers\nNEW IDEA: a ZABAL Gamez recap video for season one';
    expect(splitVoiceIdeas(t)).toEqual([
      'first thought about the newsletter and its readers',
      'NEW IDEA: a ZABAL Gamez recap video for season one',
    ]);
  });

  it('a marker at the very start does not make an empty first idea', () => {
    expect(splitVoiceIdeas('New idea, a weekly ZOE digest for the team channel')).toEqual([
      'New idea, a weekly ZOE digest for the team channel',
    ]);
  });

  it('a stray short part joins the idea before it', () => {
    const t = 'a long thought about how the festival went for everyone. new idea. ok. another idea is a merch drop for the artists';
    expect(splitVoiceIdeas(t)).toEqual([
      'a long thought about how the festival went for everyone. new idea. ok.',
      'another idea is a merch drop for the artists',
    ]);
  });

  it('the word inside another word is not a marker', () => {
    expect(splitVoiceIdeas('we renewed ideas about the venue and kept the same plan')).toHaveLength(1);
  });

  it('at most MAX_IDEAS parts; the rest stay in the last one', () => {
    const t = Array.from({ length: MAX_IDEAS + 3 }, (_, i) => `new idea number ${i} about something`).join(' ');
    const parts = splitVoiceIdeas(t);
    expect(parts).toHaveLength(MAX_IDEAS);
    expect(parts[MAX_IDEAS - 1]).toContain(`number ${MAX_IDEAS + 2}`);
  });

  it('each part is one line, as the voice-memo file needs', () => {
    for (const p of splitVoiceIdeas('one two three four\n\nnew idea five six seven eight')) expect(p).not.toContain('\n');
  });
});

describe('voiceIdeasReply', () => {
  it('counts the ideas and shows the opening words of each', () => {
    expect(voiceIdeasReply(['short one here today', 'one two three four five six seven eight nine ten eleven twelve thirteen'])).toBe(
      [
        'Saved 2 draft ideas from that voice note. They feed the next personal post draft.',
        '1. short one here today',
        '2. one two three four five six seven eight nine ten eleven twelve...',
      ].join('\n'),
    );
  });
});

describe('wiring', () => {
  const i = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');

  it('only in the DM voice path, after the group branch and resume, before the normal turn', () => {
    const handler = i.indexOf("bot.on(['message:voice', 'message:audio']");
    const group = i.indexOf('if (isZaalBotzV) {', handler);
    const resume = i.indexOf('if (looksLikeResume(transcript))', handler);
    const ideas = i.indexOf('if (voiceIdeasEnabled()) {', handler);
    const turn = i.indexOf('enqueueTurn(chatId, () => handlePrivateMessage(ctx, transcript)', handler);
    expect(handler).toBeGreaterThan(0);
    expect(ideas).toBeGreaterThan(group);
    expect(ideas).toBeGreaterThan(resume);
    expect(turn).toBeGreaterThan(ideas);
    expect(i.match(/splitVoiceIdeas\(/g)).toHaveLength(1);
  });

  it('only splits when there is more than one idea, and a failed save falls through to the turn', () => {
    const block = i.slice(i.indexOf('if (voiceIdeasEnabled()) {'), i.indexOf('enqueueTurn(chatId, () => handlePrivateMessage(ctx, transcript)'));
    expect(block).toContain('if (ideas.length > 1) {');
    expect(block).toContain("console.error('[zoe/index] voice ideas not saved, answering as a turn:'");
    expect(block.indexOf('return;')).toBeLessThan(block.indexOf('} catch (e) {'));
  });
});
