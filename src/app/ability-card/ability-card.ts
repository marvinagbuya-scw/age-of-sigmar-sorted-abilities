import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  FREQUENCY_LABELS,
  bandForTiming,
  normaliseEffect,
  timingLabel,
  type Ability,
  type Band,
} from '../core/models';

/**
 * A single Age of Sigmar ability card.
 *
 * Purely presentational — everything comes from the `ability` input, which
 * makes it trivial to drive from Storybook.
 */
@Component({
  selector: 'app-ability-card',
  templateUrl: './ability-card.html',
  styleUrl: './ability-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ability-card',
    '[attr.data-band]': 'band()',
  },
})
export class AbilityCard {
  readonly ability = input.required<Ability>();

  /** Colour band; a reaction overrides its phase's colour. */
  readonly band = computed<Band>(() => bandForTiming(this.ability().timing));

  /** The text shown in the coloured timing bar. */
  readonly timing = computed(() => timingLabel(this.ability().timing));

  /**
   * The effect broken into renderable blocks, so an effect authored as a
   * lead-in plus a bulleted list renders as a real `<ul>`.
   */
  readonly effectBlocks = computed(() => normaliseEffect(this.ability().effect));

  /** e.g. `Once Per Battle`, shown above the timing. */
  readonly frequency = computed(() => {
    const frequency = this.ability().timing.frequency;
    return frequency ? FREQUENCY_LABELS[frequency] : undefined;
  });

  /** Casting or chanting value, whichever the ability has. */
  readonly value = computed(() => {
    const ability = this.ability();
    if (ability.castingValue !== undefined) {
      return { label: 'Casting value', value: ability.castingValue };
    }
    if (ability.chantingValue !== undefined) {
      return { label: 'Chanting value', value: ability.chantingValue };
    }
    return undefined;
  });
}
