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

  /**
   * Whether to render the italic flavour line. Off makes the printed sheet
   * noticeably shorter. Defaults to on so the card stays self-contained for
   * Storybook and any other direct use.
   */
  readonly showFlavour = input(true);

  /** The flavour line, or undefined when there is none or it's switched off. */
  readonly flavour = computed(() => (this.showFlavour() ? this.ability().flavour : undefined));

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

  /**
   * The value badge: a spell's casting value, a prayer's chanting value, or a
   * command ability's command point cost. An ability only ever has one.
   */
  readonly value = computed(() => {
    const ability = this.ability();
    if (ability.castingValue !== undefined) {
      return {
        value: ability.castingValue,
        kind: 'casting' as const,
        srLabel: `Casting value ${ability.castingValue}`,
      };
    }
    if (ability.chantingValue !== undefined) {
      return {
        value: ability.chantingValue,
        kind: 'chanting' as const,
        srLabel: `Chanting value ${ability.chantingValue}`,
      };
    }
    if (ability.commandValue !== undefined) {
      const points = ability.commandValue === 1 ? 'command point' : 'command points';
      return {
        value: ability.commandValue,
        kind: 'command' as const,
        srLabel: `Costs ${ability.commandValue} ${points}`,
      };
    }
    return undefined;
  });
}
