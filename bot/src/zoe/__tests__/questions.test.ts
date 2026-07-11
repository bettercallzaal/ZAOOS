import { describe, expect, it } from 'vitest';
import {
  encodeQuestion,
  parseQuestionCallback,
  questionKeyboard,
  TYPE_SENTINEL,
} from '../questions';

describe('encode/parse round-trip', () => {
  it('round-trips a simple value', () => {
    const p = parseQuestionCallback(encodeQuestion('oss4ai', 'speak'));
    expect(p).toEqual({ qid: 'oss4ai', value: 'speak', isType: false });
  });

  it('round-trips a value containing a colon', () => {
    const p = parseQuestionCallback(encodeQuestion('poidh', 'real ad: not a clip dump'));
    expect(p?.value).toBe('real ad: not a clip dump');
    expect(p?.isType).toBe(false);
  });

  it('flags the Type sentinel', () => {
    const p = parseQuestionCallback(encodeQuestion('poidh', TYPE_SENTINEL));
    expect(p?.isType).toBe(true);
  });

  it('returns null for non-question callbacks', () => {
    expect(parseQuestionCallback('post:abc123')).toBeNull();
    expect(parseQuestionCallback('skip:xyz')).toBeNull();
    expect(parseQuestionCallback('q:')).toBeNull();
    expect(parseQuestionCallback('q:onlyqid')).toBeNull();
  });
});

describe('questionKeyboard', () => {
  it('builds one row per option plus a Type row', () => {
    const kb = questionKeyboard('oss4ai', ['speak', 'recruit']);
    expect(kb.inline_keyboard).toHaveLength(3);
    expect(kb.inline_keyboard[0][0].text).toBe('speak');
    expect(kb.inline_keyboard[2][0].text).toBe('Type my own');
    // every button parses back
    for (const row of kb.inline_keyboard) {
      expect(parseQuestionCallback(row[0].callback_data)?.qid).toBe('oss4ai');
    }
  });

  it('omits the Type row when includeType is false', () => {
    const kb = questionKeyboard('yn', ['yes', 'no'], false);
    expect(kb.inline_keyboard).toHaveLength(2);
  });
});
