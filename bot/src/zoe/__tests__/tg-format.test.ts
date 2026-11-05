import { describe, expect, it } from 'vitest';

import { formatOutboundPayload, installTelegramFormat, toTelegramPlain } from '../tg-format';

describe('toTelegramPlain', () => {
  it('turns a pipe table into one line per row with header labels', () => {
    const md = [
      'Router keys:',
      '',
      '| Key | Model | Status |',
      '|-----|:-----:|--------|',
      '| OPENROUTER | sonnet | low balance |',
      '| ANTHROPIC | opus | ok |',
      '',
      'Done.',
    ].join('\n');
    expect(toTelegramPlain(md)).toBe(
      [
        'Router keys:',
        '',
        '- Key: OPENROUTER; Model: sonnet; Status: low balance',
        '- Key: ANTHROPIC; Model: opus; Status: ok',
        '',
        'Done.',
      ].join('\n'),
    );
  });

  it('a table with no separator row lists each row', () => {
    expect(toTelegramPlain('| a | b |\n| c | d |')).toBe('- a; b\n- c; d');
  });

  it('drops bold, heading, code and bullet markers but keeps the words', () => {
    expect(toTelegramPlain('## Today\n**IMan status** - `orca` is up\n* one\n* two')).toBe(
      'Today\nIMan status - orca is up\n- one\n- two',
    );
  });

  it('keeps fenced code content and drops the fences', () => {
    expect(toTelegramPlain('run:\n```bash\nnpm test\n```\nok')).toBe('run:\nnpm test\nok');
  });

  it('does not rewrite markdown inside a fence', () => {
    expect(toTelegramPlain('```\n| a | b |\n**x**\n```')).toBe('| a | b |\n**x**');
  });

  it('strips code and bold markers inside table cells too', () => {
    expect(toTelegramPlain('| Env | Model |\n|---|---|\n| `KEY` | **sonnet** |')).toBe('- Env: KEY; Model: sonnet');
  });

  it('drops a horizontal rule line', () => {
    expect(toTelegramPlain('top\n\n---\n\nbottom')).toBe('top\n\nbottom');
  });

  it('shows a link as text then url', () => {
    expect(toTelegramPlain('see [PR 4239](https://github.com/x/y/pull/4239)')).toBe(
      'see PR 4239 (https://github.com/x/y/pull/4239)',
    );
  });

  it('leaves plain text exactly as it was', () => {
    const plain = 'Got it. 1 a, 2 b - snake_case_name and a | pipe stay.';
    expect(toTelegramPlain(plain)).toBe(plain);
  });

  it('does not treat a lone asterisk or arithmetic as markup', () => {
    expect(toTelegramPlain('2 * 3 = 6 and a*b')).toBe('2 * 3 = 6 and a*b');
  });

  // Fail-safe: a non-empty message never becomes empty (PR 4246 review).
  it('a separator-only table keeps its text instead of throwing', () => {
    expect(toTelegramPlain('|---|---|\n|---|---|')).toBe('|---|---|\n|---|---|');
  });

  it('a lone |---| keeps its text instead of vanishing', () => {
    expect(toTelegramPlain('|---|')).toBe('|---|');
  });

  it('a lone "- - -" rule line comes back verbatim, not empty', () => {
    expect(toTelegramPlain('- - -')).toBe('- - -');
  });

  it('a separator-only table inside other text leaves the other text alone', () => {
    expect(toTelegramPlain('before\n|---|\nafter')).toBe('before\n|---|\nafter');
  });
});

describe('formatOutboundPayload', () => {
  it('rewrites the text of a plain sendMessage', () => {
    expect(formatOutboundPayload('sendMessage', { chat_id: 1, text: '**hi**' })).toEqual({ field: 'text', text: 'hi' });
  });

  it('rewrites an edit (the thinking spinner delivers by editing)', () => {
    expect(formatOutboundPayload('editMessageText', { chat_id: 1, message_id: 2, text: '# Hi' })).toEqual({
      field: 'text',
      text: 'Hi',
    });
  });

  it('rewrites a caption', () => {
    expect(formatOutboundPayload('sendPhoto', { chat_id: 1, caption: '**c**' })).toEqual({ field: 'caption', text: 'c' });
  });

  it('passes a payload that sets its own parse_mode or entities untouched', () => {
    expect(formatOutboundPayload('sendMessage', { chat_id: 1, text: '**x**', parse_mode: 'Markdown' })).toBeNull();
    expect(formatOutboundPayload('sendMessage', { chat_id: 1, text: '**x**', entities: [] })).toBeNull();
  });

  it('passes plain text and other methods untouched', () => {
    expect(formatOutboundPayload('sendMessage', { chat_id: 1, text: 'plain' })).toBeNull();
    expect(formatOutboundPayload('answerCallbackQuery', { text: '**x**' })).toBeNull();
  });

  it('never rewrites a non-empty body to empty', () => {
    for (const text of ['|---|', '- - -', '|---|---|\n|---|---|']) {
      expect(formatOutboundPayload('sendMessage', { chat_id: 1, text })).toBeNull();
    }
  });
});

describe('installTelegramFormat', () => {
  type Transformer = (
    prev: (m: string, p: Record<string, unknown>, s?: unknown) => Promise<unknown>,
    method: string,
    payload: Record<string, unknown>,
    signal?: unknown,
  ) => Promise<unknown>;

  function install(format?: typeof formatOutboundPayload): Transformer {
    let t: Transformer | undefined;
    const bot = { api: { config: { use: (fn: Transformer) => { t = fn; } } } };
    installTelegramFormat(bot as never, format);
    return t as Transformer;
  }

  it('sends the formatted text on the normal path', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const t = install();
    await t(async (_m, p) => { sent.push({ ...p }); return {}; }, 'sendMessage', { chat_id: 1, text: '**hi**' });
    expect(sent[0].text).toBe('hi');
  });

  it('sends the ORIGINAL text when formatting throws', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const t = install(() => { throw new Error('boom'); });
    await t(async (_m, p) => { sent.push({ ...p }); return {}; }, 'sendMessage', { chat_id: 1, text: '**hi**' });
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toBe('**hi**');
  });

  it('never sends an empty replacement', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const t = install(() => ({ field: 'text', text: '  ' }));
    await t(async (_m, p) => { sent.push({ ...p }); return {}; }, 'sendMessage', { chat_id: 1, text: '- - -' });
    expect(sent[0].text).toBe('- - -');
  });
});
