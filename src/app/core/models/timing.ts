/**
 * The colour bands used on Age of Sigmar 4th edition ability cards.
 * These map 1:1 onto the `--aos-*` CSS custom properties in `styles.scss`.
 */
export const BANDS = [
  'deployment',
  'hero',
  'movement',
  'shooting',
  'charge',
  'combat',
  'end',
  'reaction',
] as const;

export type Band = (typeof BANDS)[number];

/**
 * Phases are a finer-grained concept than bands: they drive *grouping and sort
 * order* in the printed list, whereas bands drive *colour*. Several phases
 * deliberately collapse onto a single band (see `bandForPhase`).
 */
export const PHASES = [
  'deployment',
  'start-of-battle-round',
  'hero',
  'movement',
  'shooting',
  'charge',
  'combat',
  'end-of-turn',
  'end-of-battle-round',
  'passive',
] as const;

export type Phase = (typeof PHASES)[number];

/** Whose turn the ability is used in. */
export const TURNS = ['your', 'any', 'enemy'] as const;
export type Turn = (typeof TURNS)[number];

/** How often the ability may be used. */
export const FREQUENCIES = ['once-per-battle', 'once-per-turn', 'once-per-turn-army'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export interface Timing {
  /** Determines which section of the printed list the card appears in. */
  phase: Phase;
  turn?: Turn;
  /**
   * The trigger text for a reaction, without the leading `Reaction:`.
   * Presence of this field forces the green `reaction` colour band, but the
   * card is still grouped under `phase`.
   */
  reaction?: string;
  frequency?: Frequency;
}

/**
 * Human-readable labels for each phase, used as print section headings.
 */
export const PHASE_LABELS: Record<Phase, string> = {
  deployment: 'Deployment',
  'start-of-battle-round': 'Start of Battle Round',
  hero: 'Hero Phase',
  movement: 'Movement Phase',
  shooting: 'Shooting Phase',
  charge: 'Charge Phase',
  combat: 'Combat Phase',
  'end-of-turn': 'End of Turn',
  'end-of-battle-round': 'End of Battle Round',
  passive: 'Passive',
};

/**
 * Collapses a phase onto its colour band.
 *
 * `passive` and `start-of-battle-round` share deployment's black, and both
 * end-of-* phases share the purple `end` band.
 */
const PHASE_TO_BAND: Record<Phase, Band> = {
  deployment: 'deployment',
  'start-of-battle-round': 'deployment',
  passive: 'deployment',
  hero: 'hero',
  movement: 'movement',
  shooting: 'shooting',
  charge: 'charge',
  combat: 'combat',
  'end-of-turn': 'end',
  'end-of-battle-round': 'end',
};

export function bandForPhase(phase: Phase): Band {
  return PHASE_TO_BAND[phase];
}

/**
 * Resolves the colour band for a timing. A reaction always wears the green
 * band, overriding whatever its phase would otherwise produce.
 */
export function bandForTiming(timing: Timing): Band {
  return timing.reaction ? 'reaction' : bandForPhase(timing.phase);
}

/**
 * Renders the text shown in the card's timing bar, mirroring the wording used
 * on the printed cards.
 */
export function timingLabel(timing: Timing): string {
  if (timing.reaction) {
    return `Reaction: ${timing.reaction}`;
  }

  if (timing.phase === 'passive') {
    return 'Passive';
  }

  const base = PHASE_LABELS[timing.phase];

  switch (timing.turn) {
    case 'your':
      return `Your ${base}`;
    case 'enemy':
      return `Enemy ${base}`;
    case 'any':
      return `Any ${base}`;
    default:
      return base;
  }
}

/** Prefix shown above the timing, e.g. `Once Per Battle`. */
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'once-per-battle': 'Once Per Battle',
  'once-per-turn': 'Once Per Turn',
  'once-per-turn-army': 'Once Per Turn (Army)',
};
