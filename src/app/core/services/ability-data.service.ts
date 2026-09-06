import { httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';

import {
  DEFAULT_FACTION_ID,
  FACTIONS,
  allAbilities,
  isKnownFaction,
  type Faction,
} from '../models';

export { DEFAULT_FACTION_ID };

@Injectable({ providedIn: 'root' })
export class AbilityDataService {
  private readonly selectedFactionId = signal(DEFAULT_FACTION_ID);

  /** Every faction the app knows about, for the faction picker. */
  readonly factions = FACTIONS;

  readonly factionId = this.selectedFactionId.asReadonly();

  /**
   * The loaded faction. `httpResource` gives us loading/error state as signals
   * without any manual subscription handling, and re-fetches when the id
   * changes.
   */
  readonly faction = httpResource<Faction>(() => `data/${this.selectedFactionId()}.json`);

  readonly isLoading = computed(() => this.faction.isLoading());
  readonly error = computed(() => this.faction.error());

  /** The faction's display name, falling back to the registry while loading. */
  readonly factionName = computed(() => {
    const loaded = this.faction.value()?.name;
    if (loaded) {
      return loaded;
    }
    return FACTIONS.find((f) => f.id === this.selectedFactionId())?.name ?? '';
  });

  /** Every ability in the faction, flattened out of its section. */
  readonly abilities = computed(() => {
    const faction = this.faction.value();
    return faction ? allAbilities(faction) : [];
  });

  /** True while any loaded ability is still flagged as unverified sample data. */
  readonly hasSampleData = computed(() => this.abilities().some((a) => a.sample));

  /**
   * True when the faction loaded but has no abilities at all — a scaffolded
   * faction awaiting data, which is different from an error.
   */
  readonly isEmpty = computed(
    () => !this.isLoading() && !this.error() && this.abilities().length === 0,
  );

  load(factionId: string): void {
    if (!isKnownFaction(factionId)) {
      return;
    }
    this.selectedFactionId.set(factionId);
  }
}
