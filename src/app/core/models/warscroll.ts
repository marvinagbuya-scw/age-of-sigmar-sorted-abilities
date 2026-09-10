/**
 * The non-ability half of a warscroll: the unit's characteristics and its
 * weapon profiles.
 *
 * Values are typed `string | number` throughout because the printed cards mix
 * the two: a Move of `12"` is a number, but a Damage of `D6` is not, and a
 * Move of `*` appears on units whose profile is set by an ability. Authoring
 * the plain number where one exists keeps the data readable and lets the
 * formatters below add the `"` and `+` suffixes, so the JSON never has to
 * repeat presentation.
 */

/** A characteristic value as authored: a plain number, or `D6`, `2D3`, `*`. */
export type StatValue = string | number;

/** The four characteristics in the unit's profile box, plus an optional ward. */
export interface UnitStats {
  /** Wounds the unit can take before it is destroyed. */
  health: StatValue;
  /** Inches, e.g. `12`. */
  move: StatValue;
  /** The roll needed to save, e.g. `3` for a 3+. */
  save: StatValue;
  /** Control score used to contest objectives. */
  control: StatValue;
  /**
   * The roll needed to ward a wound, e.g. `6` for a 6+. Only present on units
   * that have one — most do not, and the profile box omits it entirely then.
   */
  ward?: StatValue;
}

export const ATTACK_TYPES = ['melee', 'ranged'] as const;

export type AttackType = (typeof ATTACK_TYPES)[number];

export const ATTACK_TYPE_LABELS: Record<AttackType, string> = {
  melee: 'Melee weapons',
  ranged: 'Ranged weapons',
};

/** The five (six, for ranged) characteristics of one weapon profile. */
export interface WeaponCharacteristics {
  attacks: StatValue;
  hit: StatValue;
  wound: StatValue;
  /** Omitted, or `0`, renders as a dash. */
  rend?: StatValue;
  damage: StatValue;
  /** Ranged weapons only, in inches. */
  range?: StatValue;
}

/** One weapon profile on a warscroll. */
export interface WeaponProfile {
  id: string;
  name: string;
  /**
   * Weapon abilities as printed under the profile, e.g. `Crit (Mortal)` or
   * `Anti-HERO (+1 Rend)`. Plain labels rather than full abilities: they modify
   * this weapon only and have no timing of their own.
   */
  abilities: string[];
  type: AttackType;
  characteristics: WeaponCharacteristics;
}

/** True when a unit has enough transcribed to be worth showing a stat block. */
export function hasWarscrollProfile(unit: {
  stats?: UnitStats;
  attacks?: WeaponProfile[];
}): boolean {
  return unit.stats !== undefined || (unit.attacks?.length ?? 0) > 0;
}

/** Weapons of one type, in the order they were authored. */
export function attacksOfType(
  attacks: readonly WeaponProfile[] | undefined,
  type: AttackType,
): WeaponProfile[] {
  return (attacks ?? []).filter((attack) => attack.type === type);
}

/** `12` -> `12"`; a string is already formatted, so it passes through. */
export function formatDistance(value: StatValue | undefined): string {
  if (value === undefined) {
    return '-';
  }
  return typeof value === 'number' ? `${value}"` : value;
}

/** `3` -> `3+`; `"3+"` and `"-"` pass through untouched. */
export function formatRoll(value: StatValue | undefined): string {
  if (value === undefined) {
    return '-';
  }
  return typeof value === 'number' ? `${value}+` : value;
}

/** A plain value, with `0` shown as a dash the way the cards print it. */
export function formatStat(value: StatValue | undefined): string {
  if (value === undefined || value === 0) {
    return '-';
  }
  return String(value);
}
