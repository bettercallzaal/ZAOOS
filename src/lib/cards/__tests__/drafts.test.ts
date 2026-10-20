// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { clearDraft, DRAFT_STORAGE_KEY, loadDraft, saveDraft } from '../drafts';
import { createBlankDraft } from '../schema';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
}

const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('drafts', () => {
  it('saves and loads a draft round trip', () => {
    const storage = memoryStorage();
    const draft = { ...createBlankDraft(5), name: 'Card' };
    expect(saveDraft(draft, storage)).toEqual({ ok: true });
    expect(loadDraft(storage)).toEqual({ status: 'ok', draft });
  });

  it('reports empty when nothing is saved', () => {
    expect(loadDraft(memoryStorage())).toEqual({ status: 'empty' });
  });

  it('reports unavailable, not empty, when storage is missing or throws', () => {
    expect(loadDraft(null)).toEqual({ status: 'unavailable' });
    expect(loadDraft(throwing)).toEqual({ status: 'unavailable' });
  });

  it.each([
    ['bad JSON', '{not json'],
    ['a draft that fails the schema', JSON.stringify({ version: 2 })],
    [
      'a remote image URL',
      JSON.stringify({
        ...createBlankDraft(0),
        layers: [
          {
            id: 'a',
            type: 'image',
            x: 0,
            y: 0,
            rotation: 0,
            visible: true,
            src: 'https://example.com/a.png',
            width: 10,
            height: 10,
          },
        ],
      }),
    ],
  ])('reports invalid for %s', (_label, raw) => {
    const storage = memoryStorage();
    storage.map.set(DRAFT_STORAGE_KEY, raw);
    expect(loadDraft(storage)).toEqual({ status: 'invalid' });
  });

  it('refuses to save an invalid draft', () => {
    const storage = memoryStorage();
    const bad = { ...createBlankDraft(0), background: 'navy' };
    expect(saveDraft(bad, storage)).toEqual({ ok: false, reason: 'invalid' });
    expect(storage.map.size).toBe(0);
  });

  it('reports a failed write and missing storage on save', () => {
    expect(saveDraft(createBlankDraft(0), throwing)).toEqual({ ok: false, reason: 'write-failed' });
    expect(saveDraft(createBlankDraft(0), null)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('clears the draft and says whether it could', () => {
    const storage = memoryStorage();
    saveDraft(createBlankDraft(0), storage);
    expect(clearDraft(storage)).toBe(true);
    expect(loadDraft(storage)).toEqual({ status: 'empty' });
    expect(clearDraft(throwing)).toBe(false);
    expect(clearDraft(null)).toBe(false);
  });

  it('defaults to unavailable outside a browser', () => {
    expect(loadDraft()).toEqual({ status: 'unavailable' });
  });
});
