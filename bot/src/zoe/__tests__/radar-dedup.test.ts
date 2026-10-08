// Tests for radar-dedup.ts (adapted from 99darwin/nexus, Nexus Contributors, MIT License,
// https://github.com/99darwin/nexus) and the flagged arXiv match in research-dedupe.ts.
import { afterEach, describe, expect, it } from 'vitest';
import {
  dedupeRadarItems,
  extractArxivId,
  extractTitleEntities,
  type RadarItem,
} from '../radar-dedup';
import { wasResearched } from '../research-dedupe';

const item = (url: string, title: string, content = '', source = 'hn'): RadarItem => ({ source, url, title, content });

describe('radar-dedup: duplicates collapse', () => {
  it('same link with tracking query and trailing slash collapses (url)', () => {
    const r = dedupeRadarItems([
      item('https://example.com/post/', 'Alpha'),
      item('https://EXAMPLE.com/post?utm_source=x', 'Something else entirely'),
    ]);
    expect(r.kept).toHaveLength(1);
    expect(r.dropped[0].reason).toBe('url');
  });

  it('same title from two sources collapses (title)', () => {
    const r = dedupeRadarItems([
      item('https://a.com/1', 'Anthropic ships a new model'),
      item('https://b.com/2', 'anthropic ships  a new model', '', 'rss'),
    ]);
    expect(r.dropped.map((d) => d.reason)).toEqual(['title']);
  });

  it('arXiv abs, pdf and versioned links are one paper (arxiv)', () => {
    const r = dedupeRadarItems([
      item('https://arxiv.org/abs/2401.12345', 'Paper one'),
      item('https://arxiv.org/pdf/2401.12345v2.pdf', 'Paper one, revised'),
    ]);
    expect(r.kept).toHaveLength(1);
    expect(r.dropped[0].reason).toBe('arxiv');
  });

  it('the same story in different words collapses (entities)', () => {
    const r = dedupeRadarItems([
      item('https://a.com/x', 'OpenAI raises $40B led by SoftBank'),
      item('https://b.com/y', 'SoftBank leads $40 billion OpenAI round'),
    ]);
    expect(r.kept).toHaveLength(1);
    expect(r.dropped[0].reason).toBe('entities');
  });

  it('an item already seen elsewhere is dropped, and the drop says what it matched', () => {
    const r = dedupeRadarItems(
      [item('https://new.com/a', 'Farcaster mini apps get notifications')],
      [item('https://old.com/b', 'Farcaster mini apps get notifications')],
    );
    expect(r.kept).toHaveLength(0);
    expect(r.dropped[0]).toMatchObject({ reason: 'title', duplicateOf: 'https://old.com/b' });
  });
});

describe('radar-dedup: distinct items stay', () => {
  it('different stories on one topic all stay', () => {
    const r = dedupeRadarItems([
      item('https://a.com/1', 'Rollups and data availability in 2026', 'blob fees fell after the upgrade'),
      item('https://b.com/2', 'A guide to vector databases for RAG', 'pgvector versus dedicated stores'),
      item('https://c.com/3', 'Telegram adds bot-to-bot messaging', 'Bot API 10.0 lets bots see bots'),
    ]);
    expect(r.kept).toHaveLength(3);
    expect(r.dropped).toHaveLength(0);
  });

  it('one shared name is not enough to call two stories the same', () => {
    const r = dedupeRadarItems([
      item('https://a.com/1', 'Farcaster adds channels to the API'),
      item('https://b.com/2', 'Why music artists are leaving Farcaster'),
    ]);
    expect(r.kept).toHaveLength(2);
  });

  it('two different arXiv papers stay', () => {
    const r = dedupeRadarItems([
      item('https://arxiv.org/abs/2401.12345', 'Paper one'),
      item('https://arxiv.org/abs/2401.54321', 'Paper two'),
    ]);
    expect(r.kept).toHaveLength(2);
  });

  it('items past the batch cap are kept unchecked, never dropped', () => {
    const many = Array.from({ length: 205 }, () => item('https://same.com/x', 'Same'));
    const r = dedupeRadarItems(many);
    expect(r.kept.length + r.dropped.length).toBe(205);
    expect(r.kept).toHaveLength(6); // 1 kept in the checked 200, plus the 5 unchecked
  });
});

describe('helpers', () => {
  it('extractArxivId reads every link form and ignores the version', () => {
    expect(extractArxivId('https://arxiv.org/abs/2401.12345v3')).toBe('2401.12345');
    expect(extractArxivId('https://arxiv.org/pdf/2401.12345.pdf')).toBe('2401.12345');
    expect(extractArxivId('see arXiv:2401.12345')).toBe('2401.12345');
    expect(extractArxivId('https://example.com/2401.12345')).toBeNull();
  });

  it('extractTitleEntities keeps names and money, drops common words', () => {
    expect(extractTitleEntities('OpenAI raises $40B led by SoftBank').sort()).toEqual(['$40b', 'openai', 'softbank']);
  });
});

describe('research-dedupe: flagged arXiv match', () => {
  const doc = '# A paper\n\nRead it at https://arxiv.org/abs/2401.12345 today.';
  const readFile = async (p: string) => {
    if (p.includes('100-paper')) return doc;
    throw new Error('missing');
  };
  const readdir = async (p: string) => (p.endsWith('research') ? ['agents'] : ['100-paper']);
  afterEach(() => { delete process.env.ZOE_RESEARCH_DEDUP_ARXIV; });

  it('flag off (the default): a pdf link to a researched paper is NOT matched, as before', async () => {
    expect(await wasResearched('https://arxiv.org/pdf/2401.12345v2.pdf', '/x/research', readFile, readdir)).toBe(false);
  });

  it('flag on: the same paper in another link form is matched', async () => {
    process.env.ZOE_RESEARCH_DEDUP_ARXIV = '1';
    expect(await wasResearched('https://arxiv.org/pdf/2401.12345v2.pdf', '/x/research', readFile, readdir)).toBe(true);
  });

  it('flag on: a different paper is still not matched', async () => {
    process.env.ZOE_RESEARCH_DEDUP_ARXIV = '1';
    expect(await wasResearched('https://arxiv.org/abs/2401.99999', '/x/research', readFile, readdir)).toBe(false);
  });
});
