import { httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';

import { allAbilities, type Faction } from '../models';

/** The only faction with data so far. */
export const DEFAULT_FACTION_ID = 'soulblight-gravelords';

@Injectable({ providedIn: 'root' })
export class AbilityDataService {
  private readonly factionId = signal(DEFAULT_FACTION_ID);

  /**
   * The loaded faction. `httpResource` gives us loading/error state as signals
   * without any manual subscription handling.
   */
  readonly faction = httpResource<Faction>(() => `data/${this.factionId()}.json`);

  readonly isLoading = computed(() => this.faction.isLoading());
  readonly error = computed(() => this.faction.error());

  /** Every ability in the faction, flattened out of its section. */
  readonly abilities = computed(() => {
    const faction = this.faction.value();
    return faction ? allAbilities(faction) : [];
  });

  /** True while any loaded ability is still flagged as unverified sample data. */
  readonly hasSampleData = computed(() => this.abilities().some((a) => a.sample));

  load(factionId: string): void {
    this.factionId.set(factionId);
  }
}
