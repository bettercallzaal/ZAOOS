import { describe, it, expect } from 'vitest';
import { buildGroupContext, buildMemoryBlocks, renderConciergePrompt } from '../memory';
import { buildSystemBlocks } from '../concierge';

describe('buildGroupContext', () => {
  it('identifies COC group and injects partner context', () => {
    const ctxCoc = buildGroupContext('-1001609766705', '+Community of Communities');
    expect(ctxCoc).toContain('Community of Communities (COC)');
    expect(ctxCoc).toContain('Craig (@thyrevolution)');
    expect(ctxCoc).toContain('COC Concertz');
    expect(ctxCoc).toContain('Role & Boundaries');
    expect(ctxCoc).toContain('Privacy: Do not share Zaal\'s private schedule');
  });

  it('handles generic groups with standard executive assistant instructions', () => {
    const ctxOther = buildGroupContext('-1009999999', 'General Web3 Chat');
    expect(ctxOther).toContain('Group Profile: General Web3 Chat');
    expect(ctxOther).toContain('Role & Boundaries');
  });
});

describe('buildMemoryBlocks privacy isolation in groups', () => {
  it('suppresses Zaal\'s private human memory and tasks in group scope', async () => {
    const blocks = await buildMemoryBlocks('-1001609766705', '+Community of Communities');
    expect(blocks.chat_scope).toBe('-1001609766705');
    expect(blocks.human).toBe('');
    expect(blocks.tasks).toBe('(no open tasks)');
    expect(blocks.decisions).toBe('(no recent decisions)');
    expect(blocks.build_state).toBe('(no recent build-state entries)');
    expect(blocks.inbox_context).toBeUndefined();
    expect(blocks.group_context).toBeDefined();
    expect(blocks.group_context).toContain('Community of Communities (COC)');
  });

  it('loads full private memory blocks in private DM scope', async () => {
    const blocks = await buildMemoryBlocks('private');
    expect(blocks.chat_scope).toBe('private');
    expect(blocks.group_context).toBeUndefined();
  });
});

describe('renderConciergePrompt & buildSystemBlocks privacy gating', () => {
  it('renderConciergePrompt omits <human> block and <tasks> block in group scope', async () => {
    const blocks = await buildMemoryBlocks('-1001609766705', '+Community of Communities');
    const prompt = renderConciergePrompt(blocks, 'Craig', 'When is the next concert?');

    expect(prompt).toContain('<group_context>');
    expect(prompt).toContain('Community of Communities (COC)');
    expect(prompt).not.toContain('<human>\n');
    expect(prompt).not.toContain('</human>');
    expect(prompt).not.toContain('<tasks>\n');
    expect(prompt).toContain('Craig: When is the next concert?');
  });

  it('buildSystemBlocks omits <human> block and private blocks in group scope', async () => {
    const blocks = await buildMemoryBlocks('-1001609766705', '+Community of Communities');
    const sys = buildSystemBlocks(blocks, '2026-09-17 14:00');

    expect(sys).toContain('<group_context>');
    expect(sys).toContain('Community of Communities (COC)');
    expect(sys).not.toContain('<human>\n');
    expect(sys).not.toContain('</human>');
    expect(sys).not.toContain('<tasks>\n');
    expect(sys).not.toContain('<open_threads>\n');
    expect(sys).not.toContain('<companion_presence>');
  });
});
