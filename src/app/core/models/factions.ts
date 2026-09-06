/**
 * The factions the app knows about.
 *
 * Adding a faction is two steps:
 *   1. add an entry here
 *   2. create `public/data/<id>.json` with the same `id`
 *
 * `validate:data` cross-checks the two, so a missing file or an unlisted file
 * fails the build rather than 404ing at runtime.
 */
export interface FactionSummary {
  /** Must match the data file name and the `id` inside it. */
  id: string;
  name: string;
}

export const FACTIONS: readonly FactionSummary[] = [
  { id: 'soulblight-gravelords', name: 'Soulblight Gravelords' },
  { id: 'skaven', name: 'Skaven' },
  { id: 'slaves-to-darkness', name: 'Slaves to Darkness' },
];

/** The faction shown on first load. */
export const DEFAULT_FACTION_ID = 'soulblight-gravelords';

export function isKnownFaction(id: string): boolean {
  return FACTIONS.some((f) => f.id === id);
}

export function factionName(id: string): string | undefined {
  return FACTIONS.find((f) => f.id === id)?.name;
}
