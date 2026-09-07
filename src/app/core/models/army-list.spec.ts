import type { AbilitySource } from './ability';
import { emptyArmyList, isUnlocked, type ArmyList } from './army-list';

function army(overrides: Partial<ArmyList> = {}): ArmyList {
  return { ...emptyArmyList('soulblight-gravelords'), ...overrides };
}

describe('isUnlocked', () => {
  it('always includes faction abilities', () => {
    expect(isUnlocked({ kind: 'faction' }, 'any-id', army())).toBe(true);
  });

  it("includes a General's Handbook ability only when it has been taken", () => {
    // Seasonal content is chosen per army, so it is selected like a trait or an
    // artefact rather than applying automatically.
    expect(
      isUnlocked(
        { kind: 'generals-handbook' },
        'gh-a',
        army({ generalsHandbookIds: new Set(['gh-a']) }),
      ),
    ).toBe(true);
    expect(
      isUnlocked(
        { kind: 'generals-handbook' },
        'gh-b',
        army({ generalsHandbookIds: new Set(['gh-a']) }),
      ),
    ).toBe(false);
    expect(isUnlocked({ kind: 'generals-handbook' }, 'gh-a', army())).toBe(false);
  });

  it('includes a battle formation ability only for the chosen formation', () => {
    const source: AbilitySource = { kind: 'battle-formation', formationId: 'legion-of-night' };
    expect(isUnlocked(source, 'x', army({ battleFormationId: 'legion-of-night' }))).toBe(true);
    expect(isUnlocked(source, 'x', army({ battleFormationId: 'kastelai-dynasty' }))).toBe(false);
    expect(isUnlocked(source, 'x', army())).toBe(false);
  });

  it('matches heroic traits and artefacts on the ability id', () => {
    expect(
      isUnlocked(
        { kind: 'heroic-trait' },
        'trait-a',
        army({ heroicTraitIds: new Set(['trait-a']) }),
      ),
    ).toBe(true);
    expect(
      isUnlocked(
        { kind: 'heroic-trait' },
        'trait-b',
        army({ heroicTraitIds: new Set(['trait-a']) }),
      ),
    ).toBe(false);
    expect(
      isUnlocked({ kind: 'artefact-of-power' }, 'art-a', army({ artefactIds: new Set(['art-a']) })),
    ).toBe(true);
  });

  it('includes lore abilities only for chosen lores', () => {
    const spell: AbilitySource = { kind: 'spell-lore', loreId: 'lore-a' };
    expect(isUnlocked(spell, 'x', army({ spellLoreIds: new Set(['lore-a']) }))).toBe(true);
    expect(isUnlocked(spell, 'x', army({ spellLoreIds: new Set(['lore-b']) }))).toBe(false);

    const manifestation: AbilitySource = { kind: 'manifestation-lore', loreId: 'lore-a' };
    expect(
      isUnlocked(manifestation, 'x', army({ manifestationLoreIds: new Set(['lore-a']) })),
    ).toBe(true);
  });

  it('keeps prayer lores separate from spell lores', () => {
    // Prayers are a distinct lore type, so choosing a spell lore must not
    // unlock a prayer lore that happens to share an id.
    const prayer: AbilitySource = { kind: 'prayer-lore', loreId: 'lore-a' };
    expect(isUnlocked(prayer, 'x', army({ prayerLoreIds: new Set(['lore-a']) }))).toBe(true);
    expect(isUnlocked(prayer, 'x', army({ spellLoreIds: new Set(['lore-a']) }))).toBe(false);
    expect(isUnlocked(prayer, 'x', army())).toBe(false);
  });

  it('includes warscroll abilities only for units in the list', () => {
    const source: AbilitySource = { kind: 'warscroll', unitId: 'vampire-lord' };
    expect(isUnlocked(source, 'x', army({ unitIds: new Set(['vampire-lord']) }))).toBe(true);
    expect(isUnlocked(source, 'x', army({ unitIds: new Set(['dire-wolves']) }))).toBe(false);
  });
});
