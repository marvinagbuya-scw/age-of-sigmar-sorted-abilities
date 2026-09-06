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
export const FREQUENCIES = [
  'once-per-battle',
  'once-per-battle-round-army',
  'once-per-turn',
  'once-per-turn-army',
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export interface Timing {
  /**
   * When the ability is used. Drives the timing bar text, the colour band, and
   * — unless `section` says otherwise — which part of the printed list it
   * appears in.
   */
  phase: Phase;
  /**
   * Files the card under a different phase in the printed list, without
   * changing its label or colour.
   *
   * For an ability that is genuinely passive but only matters during a
   * particular phase, `{ phase: 'passive', section: 'combat' }` prints a black
   * card reading "Passive" under the Combat Phase heading — so it's to hand when
   * you need it. Because the label and colour still come from `phase`, they
   * can't end up contradicting each other.
   */
  section?: Phase;
  /**
   * Forces the colour band, overriding both the phase and the reaction rule.
   *
   * Useful with `section`: `{ phase: 'passive', section: 'shooting', band:
   * 'shooting' }` prints a teal card reading "Passive" under the Shooting Phase
   * heading, so the colour matches the section it sits in rather than standing
   * out in passive black.
   *
   * Leave it unset unless you specifically want to break the phase's colour —
   * the default keeps colour and label consistent with each other.
   */
  band?: Band;
  turn?: Turn;
  /**
   * The trigger text for a reaction, without the leading `Reaction:`.
   * Presence of this field forces the green `reaction` colour band, but the
   * card is still grouped under `phase` (or `section`).
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
 * Resolves the colour band for a timing, in precedence order:
 *
 *   1. an explicit `band` override
 *   2. green, if the ability is a reaction
 *   3. the band its `phase` maps to
 *
 * Note `section` is deliberately not consulted: filing a card elsewhere in the
 * list does not recolour it on its own. Set `band` explicitly if you want the
 * colour to follow the section.
 */
export function bandForTiming(timing: Timing): Band {
  if (timing.band) {
    return timing.band;
  }
  return timing.reaction ? 'reaction' : bandForPhase(timing.phase);
}

/**
 * Which section of the printed list a card belongs in — its `section` override
 * if set, otherwise its phase.
 */
export function sectionForTiming(timing: Timing): Phase {
  return timing.section ?? timing.phase;
}

/**
 * Templates for the card's timing bar, where `{turn}` is where the "Your" /
 * "Any" / "Enemy" qualifier goes.
 *
 * The qualifier's position varies with the wording: it prefixes a phase name
 * ("Any Hero Phase") but sits *inside* a phrase built around "of"
 * ("End of Any Turn", not "Any End of Turn").
 *
 * Phases with no `{turn}` slot aren't owned by a player — a battle round belongs
 * to neither side, and deployment and passives have no turn. `timing.turn` is
 * ignored for those, and `validate:data` warns if it's set.
 */
const TIMING_TEMPLATES: Record<Phase, string> = {
  deployment: 'Deployment',
  'start-of-battle-round': 'Start of Battle Round',
  hero: '{turn}Hero Phase',
  movement: '{turn}Movement Phase',
  shooting: '{turn}Shooting Phase',
  charge: '{turn}Charge Phase',
  combat: '{turn}Combat Phase',
  'end-of-turn': 'End of {turn}Turn',
  'end-of-battle-round': 'End of Battle Round',
  passive: 'Passive',
};

const TURN_WORDS: Record<Turn, string> = {
  your: 'Your',
  any: 'Any',
  enemy: 'Enemy',
};

/** Whether `timing.turn` affects the label for a given phase. */
export function phaseTakesTurn(phase: Phase): boolean {
  return TIMING_TEMPLATES[phase].includes('{turn}');
}

/**
 * Renders the text shown in the card's timing bar, mirroring the wording used
 * on the printed cards.
 */
export function timingLabel(timing: Timing): string {
  if (timing.reaction) {
    return `Reaction: ${timing.reaction}`;
  }

  const turn = timing.turn ? `${TURN_WORDS[timing.turn]} ` : '';

  return TIMING_TEMPLATES[timing.phase].replace('{turn}', turn);
}

/** Prefix shown above the timing, e.g. `Once Per Battle`. */
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'once-per-battle': 'Once Per Battle',
  'once-per-battle-round-army': 'Once Per Battle Round (Army)',
  'once-per-turn': 'Once Per Turn',
  'once-per-turn-army': 'Once Per Turn (Army)',
};
