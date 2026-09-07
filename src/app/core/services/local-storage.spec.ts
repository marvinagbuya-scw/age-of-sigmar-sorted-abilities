import { readJson, resolveStorage, writeJson } from './local-storage';

/** A minimal in-memory Storage stand-in. */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  } as Storage;
}

describe('resolveStorage', () => {
  it('returns undefined when the document has no window', () => {
    expect(resolveStorage({ defaultView: null } as unknown as Document)).toBeUndefined();
  });

  it('returns undefined when accessing localStorage throws', () => {
    // Some browsers throw on access rather than returning undefined.
    const document = {
      get defaultView(): Window {
        throw new Error('blocked');
      },
    } as unknown as Document;
    expect(resolveStorage(document)).toBeUndefined();
  });

  it('returns the storage when available', () => {
    const storage = fakeStorage();
    const document = { defaultView: { localStorage: storage } } as unknown as Document;
    expect(resolveStorage(document)).toBe(storage);
  });
});

describe('readJson / writeJson', () => {
  it('round-trips a value', () => {
    const storage = fakeStorage();
    writeJson(storage, 'key', { a: 1 });
    expect(readJson<{ a: number }>(storage, 'key')).toEqual({ a: 1 });
  });

  it('returns undefined for a missing key', () => {
    expect(readJson(fakeStorage(), 'nope')).toBeUndefined();
  });

  it('returns undefined for corrupt JSON rather than throwing', () => {
    const storage = fakeStorage();
    storage.setItem('key', '{not json');
    expect(readJson(storage, 'key')).toBeUndefined();
  });

  it('is a no-op when there is no storage at all', () => {
    expect(() => writeJson(undefined, 'key', { a: 1 })).not.toThrow();
    expect(readJson(undefined, 'key')).toBeUndefined();
  });

  it('swallows a write failure such as an exceeded quota', () => {
    const storage = {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as unknown as Storage;
    expect(() => writeJson(storage, 'key', { a: 1 })).not.toThrow();
  });
});
