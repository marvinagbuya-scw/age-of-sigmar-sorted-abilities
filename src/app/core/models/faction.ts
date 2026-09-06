import type { Ability } from './ability';

/** A named thing the player picks when building an army. */
export interface NamedEntry {
  id: string;
  name: string;
}

export interface Unit extends NamedEntry {
  /** Warscroll keywords, e.g. `HERO`, `WIZARD (1)`, `INFANTRY`. */
  keywords: string[];
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
    ...faction.manifestationLores.flatMap((l) => l.abilities),
    ...faction.generalsHandbook,
    ...faction.units.flatMap((u) => u.abilities),
  ];
}
