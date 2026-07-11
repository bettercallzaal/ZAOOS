/**
 * Draft approval buttons (doc 1021 comms fix). Any outbound draft (a ZOL cast,
 * a proactive post, a work-loop suggestion) can be sent with inline [Post]
 * [Skip] [Edit] buttons instead of a "reply 'zol yes' to post" text convention
 * that has no handler. The callback handler in index.ts resolves a tap by draft
 * id. Kept tiny + pure so it unit-tests without grammy or the network.
 */

export type DraftAction = 'post' | 'skip' | 'edit';

export interface Draft {
  id: string;
  kind: string; // e.g. "zol-cast", "proactive-post" - who owns the post action
  text: string; // the draft body
  createdAt: number;
}

// In-memory pending drafts. Small + short-lived; a restart clears them (a
// stale draft button just answers "expired").
const drafts = new Map<string, Draft>();
const MAX_DRAFTS = 100;

/** Register a draft and return its id. Evicts oldest when over capacity. */
export function putDraft(kind: string, text: string, id: string, now: number = Date.now()): Draft {
  if (drafts.size >= MAX_DRAFTS) {
    const oldest = [...drafts.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) drafts.delete(oldest.id);
  }
  const d: Draft = { id, kind, text, createdAt: now };
  drafts.set(id, d);
  return d;
}

export function getDraft(id: string): Draft | undefined {
  return drafts.get(id);
}

export function removeDraft(id: string): void {
  drafts.delete(id);
}

/** Test-only reset. */
export function _resetDrafts(): void {
  drafts.clear();
}

/** grammy inline_keyboard markup for a draft. Callback data is "<action>:<id>". */
export function draftKeyboard(id: string): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  return {
    inline_keyboard: [
      [
        { text: 'Post', callback_data: `post:${id}` },
        { text: 'Skip', callback_data: `skip:${id}` },
        { text: 'Edit', callback_data: `edit:${id}` },
      ],
    ],
  };
}

/** Parse callback data "<action>:<id>" -> {action, id}, or null if malformed. */
export function parseDraftCallback(data: string): { action: DraftAction; id: string } | null {
  const m = /^(post|skip|edit):(.+)$/.exec(data);
  if (!m) return null;
  return { action: m[1] as DraftAction, id: m[2] };
}
