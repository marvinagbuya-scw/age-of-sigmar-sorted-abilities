import { FACTIONS, DEFAULT_FACTION_ID, factionName, isKnownFaction } from './factions';

describe('FACTIONS', () => {
  it('has no duplicate ids', () => {
    const ids = FACTIONS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses slug-style ids, which double as data file names', () => {
    for (const faction of FACTIONS) {
      expect(faction.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(faction.name.trim()).toBe(faction.name);
      expect(faction.name).not.toBe('');
    }
  });

  it('includes the default faction', () => {
    expect(isKnownFaction(DEFAULT_FACTION_ID)).toBe(true);
  });
});

describe('isKnownFaction', () => {
  it('rejects anything not in the registry', () => {
    expect(isKnownFaction('soulblight-gravelords')).toBe(true);
    expect(isKnownFaction('not-a-faction')).toBe(false);
    expect(isKnownFaction('')).toBe(false);
  });
});

describe('factionName', () => {
  it('resolves a known id', () => {
    expect(factionName('soulblight-gravelords')).toBe('Soulblight Gravelords');
  });

  it('returns undefined for an unknown id', () => {
    expect(factionName('nope')).toBeUndefined();
  });
});
