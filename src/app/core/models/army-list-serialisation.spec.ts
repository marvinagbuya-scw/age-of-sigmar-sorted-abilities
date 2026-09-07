import {
  armyListFromParams,
  armyListToParams,
  emptyArmyList,
  hasSelections,
  pruneArmyList,
  type ArmyList,
  type KnownIds,
} from './army-list';

function army(overrides: Partial<ArmyList> = {}): ArmyList {
  return { ...emptyArmyList('soulblight-gravelords'), ...overrides };
}

describe('hasSelections', () => {
  it('is false for a fresh list', () => {
    expect(hasSelections(army())).toBe(false);
  });

  it('is true once anything is picked', () => {
    expect(hasSelections(army({ battleFormationId: 'f' }))).toBe(true);
    expect(hasSelections(army({ unitIds: new Set(['u']) }))).toBe(true);
    expect(hasSelections(army({ spellLoreIds: new Set(['l']) }))).toBe(true);
    expect(hasSelections(army({ generalsHandbookIds: new Set(['gh']) }))).toBe(true);
  });
});

describe('armyListToParams', () => {
  it('emits only the faction for an empty list, keeping the URL clean', () => {
    expect(armyListToParams(army())).toEqual({ f: 'soulblight-gravelords' });
  });

  it('joins id sets with commas', () => {
    const params = armyListToParams(army({ unitIds: new Set(['a', 'b']) }));
    expect(params['u']).toBe('a,b');
  });

  it('sorts ids so the same army always yields the same URL', () => {
    const one = armyListToParams(army({ unitIds: new Set(['b', 'a', 'c']) }));
    const two = armyListToParams(army({ unitIds: new Set(['c', 'a', 'b']) }));
    expect(one['u']).toBe('a,b,c');
    expect(one).toEqual(two);
  });

  it('omits an unset battle formation rather than emitting an empty value', () => {
    expect(armyListToParams(army())['bf']).toBeUndefined();
  });
});

describe('armyListFromParams', () => {
  it('falls back to the default faction when absent', () => {
    expect(armyListFromParams({}, 'default-faction').factionId).toBe('default-faction');
  });

  it('reads every key back', () => {
    const parsed = armyListFromParams(
      {
        f: 'skaven',
        bf: 'formation-a',
        u: 'unit-a,unit-b',
        ht: 'trait-a',
        ar: 'art-a',
        sl: 'lore-a',
        pl: 'prayer-a',
        ml: 'manifest-a',
        gh: 'handbook-a',
      },
      'default-faction',
    );

    expect(parsed.factionId).toBe('skaven');
    expect(parsed.battleFormationId).toBe('formation-a');
    expect([...parsed.unitIds]).toEqual(['unit-a', 'unit-b']);
    expect([...parsed.heroicTraitIds]).toEqual(['trait-a']);
    expect([...parsed.artefactIds]).toEqual(['art-a']);
    expect([...parsed.spellLoreIds]).toEqual(['lore-a']);
    expect([...parsed.prayerLoreIds]).toEqual(['prayer-a']);
    expect([...parsed.manifestationLoreIds]).toEqual(['manifest-a']);
    expect([...parsed.generalsHandbookIds]).toEqual(['handbook-a']);
  });

  it('ignores empty segments and stray whitespace', () => {
    const parsed = armyListFromParams({ u: ' a , ,b, ' }, 'd');
    expect([...parsed.unitIds].sort()).toEqual(['a', 'b']);
  });

  it('treats an empty battle formation as unset', () => {
    expect(armyListFromParams({ bf: '' }, 'd').battleFormationId).toBeUndefined();
  });

  it('survives null and undefined values from the router', () => {
    const parsed = armyListFromParams({ f: null, u: undefined, bf: null }, 'default-faction');
    expect(parsed.factionId).toBe('default-faction');
    expect(parsed.unitIds.size).toBe(0);
  });

  it('round-trips a fully populated list', () => {
    const original = army({
      factionId: 'skaven',
      battleFormationId: 'f1',
      unitIds: new Set(['u1', 'u2']),
      heroicTraitIds: new Set(['t1']),
      artefactIds: new Set(['a1']),
      spellLoreIds: new Set(['s1']),
      prayerLoreIds: new Set(['p1']),
      manifestationLoreIds: new Set(['m1']),
      generalsHandbookIds: new Set(['gh1']),
    });

    const restored = armyListFromParams(armyListToParams(original), 'default-faction');
    expect(restored).toEqual(original);
  });
});

describe('pruneArmyList', () => {
  const known: KnownIds = {
    battleFormationIds: new Set(['f-known']),
    unitIds: new Set(['u-known']),
    heroicTraitIds: new Set(['t-known']),
    artefactIds: new Set(['a-known']),
    spellLoreIds: new Set(['s-known']),
    prayerLoreIds: new Set(['p-known']),
    manifestationLoreIds: new Set(['m-known']),
    generalsHandbookIds: new Set(['gh-known']),
  };

  it('drops ids that no longer exist in the data', () => {
    // The data file is hand-edited, so a bookmarked URL can reference ids that
    // have since been renamed or removed.
    const pruned = pruneArmyList(
      army({
        battleFormationId: 'f-gone',
        unitIds: new Set(['u-known', 'u-gone']),
        heroicTraitIds: new Set(['t-gone']),
        artefactIds: new Set(['a-known']),
        spellLoreIds: new Set(['s-gone']),
        prayerLoreIds: new Set(['p-known', 'p-gone']),
        manifestationLoreIds: new Set(['m-known']),
        generalsHandbookIds: new Set(['gh-known', 'gh-gone']),
      }),
      known,
    );

    expect(pruned.battleFormationId).toBeUndefined();
    expect([...pruned.unitIds]).toEqual(['u-known']);
    expect(pruned.heroicTraitIds.size).toBe(0);
    expect([...pruned.artefactIds]).toEqual(['a-known']);
    expect(pruned.spellLoreIds.size).toBe(0);
    expect([...pruned.prayerLoreIds]).toEqual(['p-known']);
    expect([...pruned.manifestationLoreIds]).toEqual(['m-known']);
    expect([...pruned.generalsHandbookIds]).toEqual(['gh-known']);
  });

  it('keeps a valid list untouched', () => {
    const valid = army({
      battleFormationId: 'f-known',
      unitIds: new Set(['u-known']),
    });
    expect(pruneArmyList(valid, known)).toEqual(valid);
  });

  it('preserves the faction id even when everything else is dropped', () => {
    const pruned = pruneArmyList(army({ factionId: 'skaven', unitIds: new Set(['nope']) }), known);
    expect(pruned.factionId).toBe('skaven');
    expect(hasSelections(pruned)).toBe(false);
  });
});
