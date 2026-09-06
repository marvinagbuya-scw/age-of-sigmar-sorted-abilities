import { SOURCE_KIND_ORDER, type Ability } from './ability';
import { PHASES, PHASE_LABELS, TURNS, sectionForTiming, type Phase } from './timing';

export interface PhaseGroup {
  phase: Phase;
  label: string;
  abilities: Ability[];
}

const PHASE_ORDER = new Map<Phase, number>(PHASES.map((p, i) => [p, i]));
const TURN_ORDER = new Map<string, number>(TURNS.map((t, i) => [t, i]));

/**
 * Sort order *within* a phase:
 *   1. by whose turn (your -> any -> enemy; unspecified sorts with `your`)
 *   2. non-reactions before reactions
 *   3. by source kind (faction-wide first, warscroll last)
 *   4. by name
 */
function compareWithinPhase(a: Ability, b: Ability): number {
  const turnA = TURN_ORDER.get(a.timing.turn ?? 'your') ?? 0;
  const turnB = TURN_ORDER.get(b.timing.turn ?? 'your') ?? 0;
  if (turnA !== turnB) return turnA - turnB;

  const reactionA = a.timing.reaction ? 1 : 0;
  const reactionB = b.timing.reaction ? 1 : 0;
  if (reactionA !== reactionB) return reactionA - reactionB;

  const sourceA = SOURCE_KIND_ORDER[a.source.kind];
  const sourceB = SOURCE_KIND_ORDER[b.source.kind];
  if (sourceA !== sourceB) return sourceA - sourceB;

  return a.name.localeCompare(b.name);
}

/**
 * Groups abilities into phase sections in printed turn-sequence order.
 *
 * Phases with no abilities are omitted, so the printed list has no empty
 * headings. Reactions are interleaved into the phase they trigger in.
 *
 * Cards are filed by `sectionForTiming`, so an ability can be printed under a
 * different heading than its own phase while keeping its own label and colour.
 */
export function groupByPhase(abilities: readonly Ability[]): PhaseGroup[] {
  const bySection = new Map<Phase, Ability[]>();

  for (const ability of abilities) {
    const section = sectionForTiming(ability.timing);
    const bucket = bySection.get(section);
    if (bucket) {
      bucket.push(ability);
    } else {
      bySection.set(section, [ability]);
    }
  }

  return [...bySection.entries()]
    .sort(([a], [b]) => (PHASE_ORDER.get(a) ?? 0) - (PHASE_ORDER.get(b) ?? 0))
    .map(([phase, group]) => ({
      phase,
      label: PHASE_LABELS[phase],
      abilities: group.sort(compareWithinPhase),
    }));
}
