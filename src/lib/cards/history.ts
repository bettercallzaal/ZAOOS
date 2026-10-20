// Undo and redo for the card editor as a bounded snapshot stack. Pure functions:
// every call returns a new History and never mutates the one passed in.

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export const HISTORY_LIMIT = 50;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** Records a new present. Clears redo, and drops the oldest step past `limit`. */
export function pushHistory<T>(
  history: History<T>,
  next: T,
  limit: number = HISTORY_LIMIT,
): History<T> {
  const past = [...history.past, history.present];
  return { past: past.slice(Math.max(0, past.length - limit)), present: next, future: [] };
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  const [next, ...future] = history.future;
  return { past: [...history.past, history.present], present: next, future };
}
