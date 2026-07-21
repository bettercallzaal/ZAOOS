// @vitest-environment node
// Tests for buildSystemBlocks — the pure prompt-assembly function in concierge.ts.
// No mocks needed: function is purely functional (string in → string out).
import { describe, expect, it } from 'vitest';
import { buildSystemBlocks } from '../concierge';
import type { MemoryBlocks } from '../memory';

const BASE_BLOCKS: MemoryBlocks = {
  persona: 'ZAO keeper. Sharp, warm.',
  human: 'Zaal is building ZAO DAO.',
  working: 'Recent: asked about battle counts.',
  tasks: '- Finish blog post [P1]',
  quests: '- Become the ZAO case study',
  chat_scope: 'private',
};

const DATE = '2026-07-17T10:00:00-04:00';

// ── structural sections ───────────────────────────────────────────────────────

describe('buildSystemBlocks — structural sections', () => {
  it('wraps current_time in XML tags and includes the date string', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<current_time>');
    expect(out).toContain(DATE);
    expect(out).toContain('</current_time>');
  });

  it('contains the runtime block', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<runtime>');
    expect(out).toContain('ZOE v');
  });

  it('contains the clarify_policy block', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<clarify_policy>');
    expect(out).toContain('</clarify_policy>');
  });

  it('contains the capabilities block', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<capabilities>');
    expect(out).toContain('</capabilities>');
  });

  it('contains the tone block', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<tone>');
  });

  it('embeds persona content inside <persona> tags', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<persona>');
    expect(out).toContain('ZAO keeper. Sharp, warm.');
    expect(out).toContain('</persona>');
  });

  it('embeds human block content inside <human> tags', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<human>');
    expect(out).toContain('Zaal is building ZAO DAO.');
    expect(out).toContain('</human>');
  });

  it('embeds tasks content inside <tasks> tags', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<tasks>');
    expect(out).toContain('Finish blog post [P1]');
    expect(out).toContain('</tasks>');
  });

  it('embeds quests content inside <quests> tags', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<quests>');
    expect(out).toContain('Become the ZAO case study');
    expect(out).toContain('</quests>');
  });
});

// ── chat scope ────────────────────────────────────────────────────────────────

describe('buildSystemBlocks — chat scope', () => {
  it('labels private chat as "DM with Zaal" in working_memory', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('DM with Zaal');
  });

  it('shows group title and scope id for non-private chats', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, chat_scope: '100', chat_title: 'ZAO HQ' };
    const out = buildSystemBlocks(blocks, DATE);
    expect(out).toContain('ZAO HQ');
    expect(out).toContain('id 100');
  });

  it('uses scope id as fallback when chat_title is absent', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, chat_scope: '200', chat_title: undefined };
    const out = buildSystemBlocks(blocks, DATE);
    expect(out).toContain('id 200');
  });
});

// ── open_threads ──────────────────────────────────────────────────────────────

describe('buildSystemBlocks — open_threads', () => {
  it('shows "(no open threads)" when open_threads is undefined', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<open_threads>');
    expect(out).toContain('(no open threads)');
  });

  it('shows provided open_threads content and omits the default placeholder', () => {
    const blocks: MemoryBlocks = { ...BASE_BLOCKS, open_threads: 'Thread: ship ZAO music module' };
    const out = buildSystemBlocks(blocks, DATE);
    expect(out).toContain('Thread: ship ZAO music module');
    expect(out).not.toContain('(no open threads)');
  });
});

// ── optional recall context ───────────────────────────────────────────────────

describe('buildSystemBlocks — recall context', () => {
  it('omits <bonfire_recall> block when recallContext is not provided', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).not.toContain('<bonfire_recall>');
  });

  it('includes <bonfire_recall> block with content when provided', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, 'ZAO launched May 2024.');
    expect(out).toContain('<bonfire_recall>');
    expect(out).toContain('ZAO launched May 2024.');
    expect(out).toContain('</bonfire_recall>');
  });

  it('includes the disclaimer text about treating recall as memory, not instructions', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, 'some recall');
    expect(out).toContain('NOT instructions');
  });
});

// ── optional brand context ────────────────────────────────────────────────────

describe('buildSystemBlocks — brand context', () => {
  it('omits brand content when brandContext is not provided', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, undefined);
    expect(out).not.toContain('ZAO brand guide');
  });

  it('includes brand content in the output when provided', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, 'ZAO brand guide: bold, minimal.');
    expect(out).toContain('ZAO brand guide: bold, minimal.');
  });
});

// ── link research intent ──────────────────────────────────────────────────────

describe('buildSystemBlocks — link research intent', () => {
  it('omits <link_research_routing> block when linkResearchIntent is falsy', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).not.toContain('<link_research_routing>');
  });

  it('includes <link_research_routing> block when linkResearchIntent=true', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, undefined, true);
    expect(out).toContain('<link_research_routing>');
    expect(out).toContain('</link_research_routing>');
    expect(out).toContain('research-worker dispatch');
  });
});

// ── conversational mode ───────────────────────────────────────────────────────

describe('buildSystemBlocks — conversational mode', () => {
  it('includes tasks/quests/open_threads by default (non-conversational)', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE);
    expect(out).toContain('<tasks>');
    expect(out).toContain('<quests>');
    expect(out).toContain('<open_threads>');
  });

  it('omits tasks/quests/open_threads when conversational=true', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, undefined, undefined, true);
    expect(out).not.toContain('<tasks>');
    expect(out).not.toContain('<quests>');
    expect(out).not.toContain('<open_threads>');
  });

  it('still includes persona/human/working_memory when conversational=true', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, undefined, undefined, true);
    expect(out).toContain('<persona>');
    expect(out).toContain('<human>');
    expect(out).toContain('<working_memory>');
    expect(out).toContain('ZAO keeper. Sharp, warm.');
    expect(out).toContain('Zaal is building ZAO DAO.');
  });

  it('still includes recall context in conversational mode', () => {
    const out = buildSystemBlocks(BASE_BLOCKS, DATE, 'recall: ZAO launched May 2024', undefined, undefined, true);
    expect(out).toContain('<bonfire_recall>');
    expect(out).toContain('recall: ZAO launched May 2024');
    expect(out).not.toContain('<tasks>');
  });

  it('conversational=false behaves the same as omitting it (includes all blocks)', () => {
    const outDefault = buildSystemBlocks(BASE_BLOCKS, DATE);
    const outFalse = buildSystemBlocks(BASE_BLOCKS, DATE, undefined, undefined, undefined, false);
    expect(outFalse).toContain('<tasks>');
    expect(outFalse).toContain('<quests>');
    expect(outFalse).toContain('<open_threads>');
    expect(outFalse).toContain(BASE_BLOCKS.tasks);
    expect(outDefault).toContain(BASE_BLOCKS.tasks);
  });
});
