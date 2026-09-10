import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ATTACK_TYPE_LABELS,
  ATTACK_TYPES,
  attacksOfType,
  formatDistance,
  formatRoll,
  formatStat,
  type Unit,
} from '../core/models';

/**
 * A unit's warscroll stat block: the profile box, then its weapon profiles.
 *
 * Purely presentational, like the ability card — everything comes from the
 * `unit` input. Abilities are deliberately *not* rendered here: they live in
 * their phase sections above, which is the whole point of the sheet.
 */
@Component({
  selector: 'app-unit-card',
  templateUrl: './unit-card.html',
  styleUrl: './unit-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'unit-card',
  },
})
export class UnitCard {
  readonly unit = input.required<Unit>();

  /** The profile box, pre-formatted with its `"` and `+` suffixes. */
  readonly stats = computed(() => {
    const stats = this.unit().stats;
    if (!stats) {
      return undefined;
    }
    return [
      { key: 'move', label: 'Move', value: formatDistance(stats.move) },
      { key: 'health', label: 'Health', value: formatStat(stats.health) },
      { key: 'control', label: 'Control', value: formatStat(stats.control) },
      { key: 'save', label: 'Save', value: formatRoll(stats.save) },
      // Most units have no ward, and the printed profile box omits it entirely
      // rather than showing a dash.
      ...(stats.ward !== undefined
        ? [{ key: 'ward', label: 'Ward', value: formatRoll(stats.ward) }]
        : []),
    ];
  });

  /**
   * Weapon profiles grouped by type, ranged first as they're printed, with
   * empty groups dropped so a melee-only warscroll shows one table.
   */
  readonly weaponGroups = computed(() =>
    ATTACK_TYPES.map((type) => ({
      type,
      label: ATTACK_TYPE_LABELS[type],
      // Only ranged profiles have a Range column, so the table is narrower for
      // melee rather than carrying a column of dashes.
      showRange: type === 'ranged',
      weapons: attacksOfType(this.unit().attacks, type).map((weapon) => ({
        id: weapon.id,
        name: weapon.name,
        abilities: weapon.abilities,
        range: formatDistance(weapon.characteristics.range),
        attacks: formatStat(weapon.characteristics.attacks),
        hit: formatRoll(weapon.characteristics.hit),
        wound: formatRoll(weapon.characteristics.wound),
        rend: formatStat(weapon.characteristics.rend),
        damage: formatStat(weapon.characteristics.damage),
      })),
    })).filter((group) => group.weapons.length > 0),
  );

  /**
   * True when neither a profile box nor any weapon has been transcribed yet —
   * an honest gap in the data rather than an error.
   */
  readonly isIncomplete = computed(
    () => this.stats() === undefined && this.weaponGroups().length === 0,
  );
}
