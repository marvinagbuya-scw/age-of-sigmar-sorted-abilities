import type { Ability } from './ability';
import type { KnownIds } from './army-list';
import type { UnitStats, WeaponProfile } from './warscroll';

/** A named thing the player picks when building an army. */
export interface NamedEntry {
  id: string;
  name: string;
}

export interface Unit extends NamedEntry {
  /** Warscroll keywords, e.g. `HERO`, `WIZARD (1)`, `INFANTRY`. */
  keywords: string[];
  /**
   * The profile box. Optional: abilities were transcribed first, so a unit may
   * have its abilities long before its characteristics — a known gap, not a bug.
   */
  stats?: UnitStats;
  /** Weapon profiles, melee and ranged together. Optional, as with `stats`. */
  attacks?: WeaponProfile[];
  /** Abilities printed on this unit's warscroll. */
  abilities: Ability[];
}

export interface BattleFormation extends NamedEntry {
  abilities: Ability[];
}

export interface Lore extends NamedEntry {
  abilities: Ability[];
}

/**
 * A faction's complete ability data, as stored in
 * `public/data/<faction-id>.json`.
 *
 * Sections may legitimately be empty while data is still being transcribed —
 * an empty section is a known gap, not a bug.
 */
export interface Faction {
  id: string;
  name: string;
  /** Army-wide abilities that always apply. */
  factionAbilities: Ability[];
  battleFormations: BattleFormation[];
  heroicTraits: Ability[];
  artefactsOfPower: Ability[];
  spellLores: Lore[];
  /** Prayer lores, chosen separately from spell lores. */
  prayerLores: Lore[];
  manifestationLores: Lore[];
  /**
   * Abilities from the General's Handbook, e.g. battle tactics and grand
   * strategies. Available to any army, so these always apply.
   */
  generalsHandbook: Ability[];
  units: Unit[];
}

/**
 * Flattens every ability in a faction into a single list, regardless of which
 * section it was declared in.
 */
export function allAbilities(faction: Faction): Ability[] {
  return [
    ...faction.factionAbilities,
    ...faction.battleFormations.flatMap((f) => f.abilities),
    ...faction.heroicTraits,
    ...faction.artefactsOfPower,
    ...faction.spellLores.flatMap((l) => l.abilities),
    ...faction.prayerLores.flatMap((l) => l.abilities),
    ...faction.manifestationLores.flatMap((l) => l.abilities),
    ...faction.generalsHandbook,
    ...faction.units.flatMap((u) => u.abilities),
  ];
}

/**
 * Every selectable id in a faction, used to prune stale selections out of a
 * bookmarked URL or a previous session's saved list.
 */
export function knownIds(faction: Faction): KnownIds {
  return {
    battleFormationIds: new Set(faction.battleFormations.map((f) => f.id)),
    unitIds: new Set(faction.units.map((u) => u.id)),
    // A trait or artefact *is* a single ability, so its ability id is the
    // selectable id.
    heroicTraitIds: new Set(faction.heroicTraits.map((a) => a.id)),
    artefactIds: new Set(faction.artefactsOfPower.map((a) => a.id)),
    spellLoreIds: new Set(faction.spellLores.map((l) => l.id)),
    prayerLoreIds: new Set(faction.prayerLores.map((l) => l.id)),
    manifestationLoreIds: new Set(faction.manifestationLores.map((l) => l.id)),
    generalsHandbookIds: new Set(faction.generalsHandbook.map((a) => a.id)),
  };
}
