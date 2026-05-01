// Tiny shared state for the active audio filter key.
// Lives in its own module so ShareMenu can read the active key without
// pulling in the full AudioFiltersPanel UI (which can then code-split).

let sharedActiveFilterKey: string | null = null;

export function getActiveFilterKey(): string | null {
  return sharedActiveFilterKey;
}

export function setActiveFilterKey(key: string | null): void {
  sharedActiveFilterKey = key;
}
