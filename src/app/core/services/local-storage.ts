/**
 * `localStorage` access that copes with it being absent.
 *
 * It genuinely is in several situations: private browsing, storage disabled by
 * policy, and the jsdom environment used by the unit tests (where `window`
 * exists but `localStorage` does not). Touching it unguarded throws.
 */
export function resolveStorage(document: Document): Storage | undefined {
  try {
    return document.defaultView?.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/** Reads and parses a JSON value, returning undefined on anything unexpected. */
export function readJson<T>(storage: Storage | undefined, key: string): T | undefined {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    // Corrupt JSON is not worth failing over.
    return undefined;
  }
}

/** Writes a JSON value, ignoring quota and permission failures. */
export function writeJson(storage: Storage | undefined, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked mid-session — non-fatal.
  }
}
