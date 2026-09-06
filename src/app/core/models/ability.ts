import type { EffectInput } from './effect';
import type { Timing } from './timing';

export const SOURCE_KINDS = [
  'faction',
  'battle-formation',
  'heroic-trait',
  'artefact-of-power',
  'spell-lore',
  'manifestation-lore',
  'generals-handbook',
  'warscroll',
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

/**
 * Where an ability comes from, and therefore what has to be present in an army
 * list for it to be relevant.
 *
 * `faction` and `generals-handbook` abilities always apply. The rest are
 * unlocked by a specific selection the player makes when building their army.
 */
export type AbilitySource =
  /** Army-wide rules that always apply, e.g. Deathless Minions. */
  | { kind: 'faction' }
  /** Unlocked by choosing a given battle formation. */
  | { kind: 'battle-formation'; formationId: string }
  /** Unlocked by giving a hero this trait. */
  | { kind: 'heroic-trait' }
  /** Unlocked by giving a hero this artefact. */
  | { kind: 'artefact-of-power' }
  /** Available to casters once the given spell lore is chosen. */
  | { kind: 'spell-lore'; loreId: string }
  /** Available once the given manifestation lore is chosen. */
  | { kind: 'manifestation-lore'; loreId: string }
  /**
   * From the General's Handbook, e.g. battle tactics and grand strategies.
   * Available to any army, so these always apply.
   */
  | { kind: 'generals-handbook' }
  /** Printed on a specific unit's warscroll. */
  | { kind: 'warscroll'; unitId: string };

/**
 * Human-readable labels for each source kind, used for grouping in the UI.
 */
export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  faction: 'Faction Ability',
  'battle-formation': 'Battle Formation',
  'heroic-trait': 'Heroic Trait',
  'artefact-of-power': 'Artefact of Power',
  'spell-lore': 'Spell Lore',
  'manifestation-lore': 'Manifestation Lore',
  'generals-handbook': "General's Handbook",
  warscroll: 'Warscroll',
};

/**
 * Sort priority for sources within a single phase. Faction-wide things first
 * (they apply to everything), unit-specific things last.
 */
export const SOURCE_KIND_ORDER: Record<SourceKind, number> = {
  faction: 0,
  'battle-formation': 1,
  'heroic-trait': 2,
  'artefact-of-power': 3,
  'spell-lore': 4,
  'manifestation-lore': 5,
  'generals-handbook': 6,
  warscroll: 7,
};

export interface Ability {
  /** Stable slug, e.g. `sbgl-deathless-minions`. Must be unique per faction. */
  id: string;
  name: string;
  timing: Timing;
  /**
   * The `Declare:` text. Omitted for passive abilities, which have no
   * declaration step.
   */
  declare?: string;
  /**
   * The `Effect:` text. Always present.
   *
   * Either a single paragraph, or an array mixing paragraphs and
   * `{ "list": [...] }` blocks — see `EffectInput`.
   */
  effect: EffectInput;
  /** Card keywords, e.g. `Spell`, `Rampage`, `Core`. */
  keywords: string[];
  /** Casting value for a `Spell` ability. */
  castingValue?: number;
  /** Chanting value for a `Prayer` ability. */
  chantingValue?: number;
  /** The `Used by:` line, where the card specifies one. */
  usedBy?: string;
  source: AbilitySource;
  /**
   * Set to true for abilities transcribed as illustrative samples rather than
   * verified against the published rules. Surfaced in the UI so they are never
   * mistaken for real data.
   */
  sample?: boolean;
}
