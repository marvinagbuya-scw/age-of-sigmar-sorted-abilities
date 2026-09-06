import type { AbilitySource } from './ability';

/**
 * The player's army selections. Everything is a set of ids so that lookups are
 * cheap and the whole thing serialises compactly into a URL.
 *
 * Not yet driven by any UI — see `SelectionService`.
 */
export interface ArmyList {
  factionId: string;
  /** At most one battle formation, but modelled as optional for partial lists. */
  battleFormationId?: string;
  /** Ids of units taken in the list. */
  unitIds: ReadonlySet<string>;
  /** Ids of heroic traits chosen. */
  heroicTraitIds: ReadonlySet<string>;
  /** Ids of artefacts of power chosen. */
  artefactIds: ReadonlySet<string>;
  /** Ids of spell lores chosen. */
  spellLoreIds: ReadonlySet<string>;
  /** Ids of manifestation lores chosen. */
  manifestationLoreIds: ReadonlySet<string>;
}

export function emptyArmyList(factionId: string): ArmyList {
  return {
    factionId,
    unitIds: new Set(),
    heroicTraitIds: new Set(),
    artefactIds: new Set(),
    spellLoreIds: new Set(),
    manifestationLoreIds: new Set(),
  };
}

/**
 * Whether an ability is relevant to the given army list.
 *
 * Faction and General's Handbook abilities always apply. Heroic traits and
 * artefacts are matched by the ability's own id, since each trait/artefact *is*
 * a single ability.
 */
export function isUnlocked(source: AbilitySource, abilityId: string, army: ArmyList): boolean {
  switch (source.kind) {
    case 'faction':
    case 'generals-handbook':
      return true;
    case 'battle-formation':
      return army.battleFormationId === source.formationId;
    case 'heroic-trait':
      return army.heroicTraitIds.has(abilityId);
    case 'artefact-of-power':
      return army.artefactIds.has(abilityId);
    case 'spell-lore':
      return army.spellLoreIds.has(source.loreId);
    case 'manifestation-lore':
      return army.manifestationLoreIds.has(source.loreId);
    case 'warscroll':
      return army.unitIds.has(source.unitId);
  }
}
