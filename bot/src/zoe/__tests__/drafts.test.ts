import { describe, it, expect, beforeEach } from 'vitest';
import { putDraft, getDraft, removeDraft, draftKeyboard, parseDraftCallback, _resetDrafts } from '../drafts';

beforeEach(() => _resetDrafts());

describe('draft store', () => {
  it('put/get/remove roundtrips', () => {
    putDraft('zol-cast', 'hello world', 'd1', 1000);
    expect(getDraft('d1')?.text).toBe('hello world');
    removeDraft('d1');
    expect(getDraft('d1')).toBeUndefined();
  });
});

describe('draftKeyboard', () => {
  it('builds Post/Skip/Edit with <action>:<id> callback data', () => {
    const kb = draftKeyboard('abc');
    const row = kb.inline_keyboard[0];
    expect(row.map((b) => b.text)).toEqual(['Post', 'Skip', 'Edit']);
    expect(row.map((b) => b.callback_data)).toEqual(['post:abc', 'skip:abc', 'edit:abc']);
  });
});

describe('parseDraftCallback', () => {
  it('parses valid action:id', () => {
    expect(parseDraftCallback('post:xyz')).toEqual({ action: 'post', id: 'xyz' });
    expect(parseDraftCallback('skip:d-1')).toEqual({ action: 'skip', id: 'd-1' });
  });
  it('returns null on malformed data', () => {
    expect(parseDraftCallback('nope')).toBeNull();
    expect(parseDraftCallback('delete:x')).toBeNull();
  });
});
