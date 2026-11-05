import { type CardDraft, cardDraftSchema } from './schema';

// One card draft kept in the artist's own browser (doc 2690 question 6: browser only,
// no table). Storage can be missing or throw (private windows, blocked site data), so
// "could not read" and "nothing saved" are different results, never both an empty draft.

export const DRAFT_STORAGE_KEY = 'zao-cards-draft:v1';

export type DraftLoad =
  | { status: 'ok'; draft: CardDraft }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'unavailable' };

export type DraftSave =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'invalid' | 'write-failed' };

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStorage(): DraftStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadDraft(storage: DraftStorage | null = browserStorage()): DraftLoad {
  if (!storage) return { status: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }
  const parsed = cardDraftSchema.safeParse(json);
  return parsed.success ? { status: 'ok', draft: parsed.data } : { status: 'invalid' };
}

export function saveDraft(
  draft: CardDraft,
  storage: DraftStorage | null = browserStorage(),
): DraftSave {
  if (!storage) return { ok: false, reason: 'unavailable' };
  const parsed = cardDraftSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed.data));
    return { ok: true };
  } catch {
    // Usually the storage quota, which large images can reach.
    return { ok: false, reason: 'write-failed' };
  }
}

export function clearDraft(storage: DraftStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
