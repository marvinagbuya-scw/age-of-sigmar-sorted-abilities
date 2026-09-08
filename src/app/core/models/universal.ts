import type { Ability, SourceKind } from './ability';

/** File name (without extension) of the universal ability data. */
export const UNIVERSAL_ID = 'universal';

/**
 * Abilities from the core rules that every army has access to, regardless of
 * faction — so they live in `public/data/universal.json` rather than in any
 * faction file, and are merged in on top of the selected faction.
 *
 * Deliberately a different shape from `Faction`: there are no units, lores or
 * formations here, just the two kinds of universal ability.
 */
export interface UniversalAbilities {
  /** Core abilities: Normal Move, Run, Charge, Fight, and so on. */
  core: Ability[];
  /** Universal commands such as Rally and All-out Attack. */
  commands: Ability[];
}

/** The section names in `universal.json`, paired with the source kind each requires. */
export const UNIVERSAL_SECTIONS = [
  { key: 'core', kind: 'core' },
  { key: 'commands', kind: 'command' },
] as const;

export function allUniversalAbilities(universal: UniversalAbilities): Ability[] {
  return [...universal.core, ...universal.commands];
}

/**
 * Source kinds that come from `universal.json` rather than a faction file.
 *
 * Used to separate them out in the printed list: they're the same for every
 * army, so they sit under their own subheading below the army's own abilities.
 */
const UNIVERSAL_SOURCE_KINDS: ReadonlySet<SourceKind> = new Set<SourceKind>(['core', 'command']);

export function isUniversalSource(kind: SourceKind): boolean {
  return UNIVERSAL_SOURCE_KINDS.has(kind);
}
