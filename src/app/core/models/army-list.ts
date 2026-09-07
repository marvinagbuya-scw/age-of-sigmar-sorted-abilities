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
  /** Ids of prayer lores chosen. */
  prayerLoreIds: ReadonlySet<string>;
  /** Ids of manifestation lores chosen. */
  manifestationLoreIds: ReadonlySet<string>;
  /**
   * Ids of the General's Handbook abilities taken. Matched on the ability's own
   * id, since each entry *is* a single ability.
   */
  generalsHandbookIds: ReadonlySet<string>;
}

export function emptyArmyList(factionId: string): ArmyList {
  return {
    factionId,
    unitIds: new Set(),
    heroicTraitIds: new Set(),
    artefactIds: new Set(),
    spellLoreIds: new Set(),
    prayerLoreIds: new Set(),
    manifestationLoreIds: new Set(),
    generalsHandbookIds: new Set(),
  };
}

/** Whether anything at all has been selected beyond the faction. */
export function hasSelections(army: ArmyList): boolean {
  return (
    army.battleFormationId !== undefined ||
    army.unitIds.size > 0 ||
    army.heroicTraitIds.size > 0 ||
    army.artefactIds.size > 0 ||
    army.spellLoreIds.size > 0 ||
    army.prayerLoreIds.size > 0 ||
    army.manifestationLoreIds.size > 0 ||
    army.generalsHandbookIds.size > 0
  );
}

/**
 * Query-parameter keys. Kept short because the URL is meant to be shareable and
 * a full army can hold a couple of dozen ids.
 */
const PARAM_KEYS = {
  faction: 'f',
  battleFormation: 'bf',
  units: 'u',
  heroicTraits: 'ht',
  artefacts: 'ar',
  spellLores: 'sl',
  prayerLores: 'pl',
  manifestationLores: 'ml',
  generalsHandbook: 'gh',
} as const;

function encodeSet(ids: ReadonlySet<string>): string | undefined {
  if (ids.size === 0) {
    return undefined;
  }
  // Sorted so the same army always yields the same URL, which keeps the router
  // from navigating in circles over a re-ordered but identical selection.
  return [...ids].sort().join(',');
}

function decodeSet(value: string | null | undefined): Set<string> {
  if (!value) {
    return new Set();
  }
  return new Set(
    value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id !== ''),
  );
}

/**
 * Serialises an army list into query parameters, omitting anything empty so the
 * URL stays as short as the selection allows.
 */
export function armyListToParams(army: ArmyList): Record<string, string> {
  const params: Record<string, string> = { [PARAM_KEYS.faction]: army.factionId };

  const entries: [string, string | undefined][] = [
    [PARAM_KEYS.battleFormation, army.battleFormationId],
    [PARAM_KEYS.units, encodeSet(army.unitIds)],
    [PARAM_KEYS.heroicTraits, encodeSet(army.heroicTraitIds)],
    [PARAM_KEYS.artefacts, encodeSet(army.artefactIds)],
    [PARAM_KEYS.spellLores, encodeSet(army.spellLoreIds)],
    [PARAM_KEYS.prayerLores, encodeSet(army.prayerLoreIds)],
    [PARAM_KEYS.manifestationLores, encodeSet(army.manifestationLoreIds)],
    [PARAM_KEYS.generalsHandbook, encodeSet(army.generalsHandbookIds)],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      params[key] = value;
    }
  }

  return params;
}

/** The inverse of `armyListToParams`. Unknown or malformed values are ignored. */
export function armyListFromParams(
  params: Readonly<Record<string, string | null | undefined>>,
  defaultFactionId: string,
): ArmyList {
  const factionId = params[PARAM_KEYS.faction]?.trim() || defaultFactionId;
  const battleFormationId = params[PARAM_KEYS.battleFormation]?.trim() || undefined;

  return {
    factionId,
    battleFormationId,
    unitIds: decodeSet(params[PARAM_KEYS.units]),
    heroicTraitIds: decodeSet(params[PARAM_KEYS.heroicTraits]),
    artefactIds: decodeSet(params[PARAM_KEYS.artefacts]),
    spellLoreIds: decodeSet(params[PARAM_KEYS.spellLores]),
    prayerLoreIds: decodeSet(params[PARAM_KEYS.prayerLores]),
    manifestationLoreIds: decodeSet(params[PARAM_KEYS.manifestationLores]),
    generalsHandbookIds: decodeSet(params[PARAM_KEYS.generalsHandbook]),
  };
}

/**
 * Drops any selected id that no longer exists in the faction's data.
 *
 * Necessary because the data file is edited by hand and grows over time: a
 * bookmarked URL, or a `localStorage` entry from a previous session, can easily
 * reference an ability or unit that has since been renamed or removed. Without
 * this, those ids would linger invisibly and quietly narrow the list.
 */
export function pruneArmyList(army: ArmyList, known: KnownIds): ArmyList {
  const keep = (ids: ReadonlySet<string>, valid: ReadonlySet<string>) =>
    new Set([...ids].filter((id) => valid.has(id)));

  return {
    factionId: army.factionId,
    battleFormationId:
      army.battleFormationId && known.battleFormationIds.has(army.battleFormationId)
        ? army.battleFormationId
        : undefined,
    unitIds: keep(army.unitIds, known.unitIds),
    heroicTraitIds: keep(army.heroicTraitIds, known.heroicTraitIds),
    artefactIds: keep(army.artefactIds, known.artefactIds),
    spellLoreIds: keep(army.spellLoreIds, known.spellLoreIds),
    prayerLoreIds: keep(army.prayerLoreIds, known.prayerLoreIds),
    manifestationLoreIds: keep(army.manifestationLoreIds, known.manifestationLoreIds),
    generalsHandbookIds: keep(army.generalsHandbookIds, known.generalsHandbookIds),
  };
}

/** The ids that actually exist in a loaded faction, used by `pruneArmyList`. */
export interface KnownIds {
  battleFormationIds: ReadonlySet<string>;
  unitIds: ReadonlySet<string>;
  heroicTraitIds: ReadonlySet<string>;
  artefactIds: ReadonlySet<string>;
  spellLoreIds: ReadonlySet<string>;
  prayerLoreIds: ReadonlySet<string>;
  manifestationLoreIds: ReadonlySet<string>;
  generalsHandbookIds: ReadonlySet<string>;
}

/**
 * Whether an ability is relevant to the given army list.
 *
 * Only faction abilities always apply. Heroic traits, artefacts and General's
 * Handbook entries are matched by the ability's own id, since each of those
 * *is* a single ability.
 */
export function isUnlocked(source: AbilitySource, abilityId: string, army: ArmyList): boolean {
  switch (source.kind) {
    case 'faction':
      return true;
    case 'battle-formation':
      return army.battleFormationId === source.formationId;
    case 'heroic-trait':
      return army.heroicTraitIds.has(abilityId);
    case 'artefact-of-power':
      return army.artefactIds.has(abilityId);
    case 'spell-lore':
      return army.spellLoreIds.has(source.loreId);
    case 'prayer-lore':
      return army.prayerLoreIds.has(source.loreId);
    case 'manifestation-lore':
      return army.manifestationLoreIds.has(source.loreId);
    case 'generals-handbook':
      return army.generalsHandbookIds.has(abilityId);
    case 'warscroll':
      return army.unitIds.has(source.unitId);
  }
}
