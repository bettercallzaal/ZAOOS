import { describe, it, expect } from 'vitest';
import { isConversationalTurn, selectModel, ZOE_QUICK_MODEL, ZOE_HARD_MODEL, ZOE_DEFAULT_MODEL } from '../types';
import { buildSystemBlocks } from '../concierge';
import type { MemoryBlocks } from '../memory';

// zoe-conversational spec (2026-07-16): conversational turns get the quick model
// + no ack-theater; real work keeps default/hard model + progress narration.

describe('isConversationalTurn', () => {
  it('treats the real failure case as chat', () => {
    // The 2026-07-16 miss: Zaal replied "Can u see them" to a relayed WhatsApp
    // mention. That is a plain conversational turn - quick model, no filler.
    expect(isConversationalTurn('Can u see them')).toBe(true);
  });

  it('treats short back-and-forth as chat', () => {
    for (const m of ['hey', 'what time is it', 'yes do it', 'who is Iman', 'thanks!', 'can you see the file?']) {
      expect(isConversationalTurn(m)).toBe(true);
    }
  });

  it('treats a link to fetch/analyze as work, not chat', () => {
    expect(isConversationalTurn('check this https://example.com/thread')).toBe(false);
  });

  it('treats strategic / build / research asks as work', () => {
    for (const m of [
      'should I ship the sparkz paper today?',
      'plan the ZAOstock rollout',
      'research 0xSplits multi-recipient config',
      'draft a cold DM to the Creator Studio lead',
      'build the eval runner',
      'compare Astro vs MkDocs for the site',
    ]) {
      expect(isConversationalTurn(m)).toBe(false);
    }
  });

  it('treats long substantive messages as work', () => {
    expect(isConversationalTurn('x'.repeat(221))).toBe(false);
  });

  it('rejects empty / whitespace-only input', () => {
    expect(isConversationalTurn('')).toBe(false);
    expect(isConversationalTurn('   ')).toBe(false);
  });
});

describe('selectModel regression (unchanged by the conversational upgrade)', () => {
  it('routes strategic asks to the hard model', () => {
    expect(selectModel('should I compare these two strategies')).toBe(ZOE_HARD_MODEL);
  });
  it('routes short factual questions to the quick model', () => {
    expect(selectModel('what is the time')).toBe(ZOE_QUICK_MODEL);
  });
  it('defaults everything else to the default model', () => {
    expect(selectModel('poke the bot')).toBe(ZOE_DEFAULT_MODEL);
  });
});

describe('buildSystemBlocks capability honesty + tone', () => {
  const blocks = {
    persona: 'PERSONA',
    human: 'HUMAN',
    working: '(no recent turns)',
    tasks: '(no open tasks)',
    quests: '(no quests)',
    open_threads: '(no open threads)',
    chat_scope: 'private',
    chat_title: undefined,
  } as unknown as MemoryBlocks;

  it('always injects a capabilities block that says ZOE cannot see WhatsApp', () => {
    const sys = buildSystemBlocks(blocks, '2026-07-16');
    expect(sys).toContain('<capabilities>');
    expect(sys).toContain('no WhatsApp');
    expect(sys).toContain('forward'); // the "forward it here" move
  });

  it('injects a tone block that bans corporate filler', () => {
    const sys = buildSystemBlocks(blocks, '2026-07-16');
    expect(sys).toContain('<tone>');
    expect(sys).toContain('Got it, working on it');
  });

  it('still injects persona + human + working memory', () => {
    const sys = buildSystemBlocks(blocks, '2026-07-16');
    expect(sys).toContain('<persona>');
    expect(sys).toContain('PERSONA');
    expect(sys).toContain('<working_memory>');
  });
});
