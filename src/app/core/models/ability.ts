import type { EffectInput } from './effect';
import type { Timing } from './timing';

export const SOURCE_KINDS = [
  'faction',
  'battle-formation',
  'heroic-trait',
  'artefact-of-power',
  'spell-lore',
  'prayer-lore',
  'manifestation-lore',
  'generals-handbook',
  'warscroll',
  'command',
  'core',
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

/**
 * Where an ability comes from, and therefore what has to be present in an army
 * list for it to be relevant.
 *
 * Only `faction` abilities always apply. Everything else is unlocked by a
 * specific selection the player makes when building their army.
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
  /** Available to priests once the given prayer lore is chosen. */
  | { kind: 'prayer-lore'; loreId: string }
  /** Available once the given manifestation lore is chosen. */
  | { kind: 'manifestation-lore'; loreId: string }
  /**
   * From the General's Handbook, e.g. battle tactics and grand strategies.
   * Seasonal content, chosen per army rather than tied to a unit.
   */
  | { kind: 'generals-handbook' }
  /** Printed on a specific unit's warscroll. */
  | { kind: 'warscroll'; unitId: string }
  /**
   * A universal command from the core rules, available to every army.
   * Lives in `universal.json`, not a faction file.
   */
  | { kind: 'command' }
  /**
   * A universal core ability such as Normal Move or Fight, available to every
   * army. Lives in `universal.json`, not a faction file.
   */
  | { kind: 'core' };

/**
 * Human-readable labels for each source kind, used for grouping in the UI.
 */
export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  faction: 'Faction Ability',
  'battle-formation': 'Battle Formation',
  'heroic-trait': 'Heroic Trait',
  'artefact-of-power': 'Artefact of Power',
  'spell-lore': 'Spell Lore',
  'prayer-lore': 'Prayer Lore',
  'manifestation-lore': 'Manifestation Lore',
  'generals-handbook': "General's Handbook",
  warscroll: 'Warscroll',
  command: 'Command Ability',
  core: 'Core Ability',
};

/**
 * Sort priority for sources within a single phase. Faction-wide things first
 * (they apply to everything), unit-specific things next.
 *
 * Universal core and command abilities sort last: they're identical for every
 * army, so they're reference material and shouldn't push the abilities specific
 * to your list further down the page.
 */
export const SOURCE_KIND_ORDER: Record<SourceKind, number> = {
  faction: 0,
  'battle-formation': 1,
  'heroic-trait': 2,
  'artefact-of-power': 3,
  'spell-lore': 4,
  'prayer-lore': 5,
  'manifestation-lore': 6,
  'generals-handbook': 7,
  warscroll: 8,
  command: 9,
  core: 10,
};

export interface Ability {
  /** Stable slug, e.g. `sbgl-deathless-minions`. Must be unique per faction. */
  id: string;
  name: string;
  /**
   * The italic flavour line printed under the name, e.g. "What scurries beneath
   * the surface?". Purely descriptive — it carries no rules meaning.
   */
  flavour?: string;
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
  /** Command point cost for a `Command` ability. */
  commandValue?: number;
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
