import { Injectable, computed, signal } from '@angular/core';

import { emptyArmyList, isUnlocked, type Ability, type ArmyList } from '../models';
import { DEFAULT_FACTION_ID } from './ability-data.service';

/**
 * Holds the player's army selections and filters abilities down to them.
 *
 * Deliberately has no UI yet — the next pass adds a unit picker plus URL and
 * localStorage persistence. `filtersActive` is false until something is
 * selected, in which case `filter` is a pass-through, so the full faction list
 * renders until the player narrows it down.
 */
@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly army = signal<ArmyList>(emptyArmyList(DEFAULT_FACTION_ID));

  readonly armyList = this.army.asReadonly();

  /** Whether the player has selected anything at all. */
  readonly filtersActive = computed(() => {
    const a = this.army();
    return (
      a.battleFormationId !== undefined ||
      a.unitIds.size > 0 ||
      a.heroicTraitIds.size > 0 ||
      a.artefactIds.size > 0 ||
      a.spellLoreIds.size > 0 ||
      a.manifestationLoreIds.size > 0
    );
  });

  /**
   * Narrows a list of abilities to those unlocked by the current army list.
   * Returns the input untouched while no selections have been made.
   */
  filter(abilities: readonly Ability[]): readonly Ability[] {
    if (!this.filtersActive()) {
      return abilities;
    }
    const army = this.army();
    return abilities.filter((ability) => isUnlocked(ability.source, ability.id, army));
  }

  set(army: ArmyList): void {
    this.army.set(army);
  }

  clear(): void {
    this.army.set(emptyArmyList(this.army().factionId));
  }
}
