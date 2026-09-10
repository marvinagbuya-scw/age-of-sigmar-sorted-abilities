import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import {
  DEFAULT_FACTION_ID,
  FACTIONS,
  UNIVERSAL_ID,
  allAbilities,
  allUniversalAbilities,
  hasWarscrollProfile,
  isKnownFaction,
  type Faction,
  type UniversalAbilities,
  type Unit,
} from '../models';
import { PreferencesService } from './preferences.service';

export { DEFAULT_FACTION_ID };

@Injectable({ providedIn: 'root' })
export class AbilityDataService {
  private readonly preferences = inject(PreferencesService);

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

  /**
   * Universal core and command abilities, fetched only once they're wanted —
   * returning undefined from the url factory skips the request entirely.
   */
  readonly universal = httpResource<UniversalAbilities>(() =>
    this.preferences.includeUniversal() ? `data/${UNIVERSAL_ID}.json` : undefined,
  );

  readonly isLoading = computed(() => this.faction.isLoading() || this.universal.isLoading());
  readonly error = computed(() => this.faction.error());

  /** A failure to load the universal file, kept separate from a faction failure. */
  readonly universalError = computed(() => this.universal.error());

  /** The faction's display name, falling back to the registry while loading. */
  readonly factionName = computed(() => {
    const loaded = this.faction.value()?.name;
    if (loaded) {
      return loaded;
    }
    return FACTIONS.find((f) => f.id === this.selectedFactionId())?.name ?? '';
  });

  /** Every ability in the faction, flattened out of its section. */
  readonly factionAbilities = computed(() => {
    const faction = this.faction.value();
    return faction ? allAbilities(faction) : [];
  });

  /** Universal abilities, or none when they're switched off. */
  readonly universalAbilities = computed(() => {
    if (!this.preferences.includeUniversal()) {
      return [];
    }
    const universal = this.universal.value();
    return universal ? allUniversalAbilities(universal) : [];
  });

  /** True when there is universal data to include, regardless of the toggle. */
  readonly hasUniversalData = computed(() => {
    const universal = this.universal.value();
    return universal ? allUniversalAbilities(universal).length > 0 : false;
  });

  /** The faction's abilities plus, when enabled, the universal ones. */
  readonly abilities = computed(() => [...this.factionAbilities(), ...this.universalAbilities()]);

  /** The faction's warscrolls, whether or not their stats are transcribed. */
  readonly units = computed<readonly Unit[]>(() => this.faction.value()?.units ?? []);

  /**
   * True when at least one warscroll has a profile box or weapon profiles, i.e.
   * there is something for the unit stats toggle to reveal.
   */
  readonly hasUnitProfiles = computed(() => this.units().some(hasWarscrollProfile));

  /** True while any loaded ability is still flagged as unverified sample data. */
  readonly hasSampleData = computed(() => this.abilities().some((a) => a.sample));

  /**
   * True when the faction loaded but has no abilities at all — a scaffolded
   * faction awaiting data, which is different from an error. Universal abilities
   * don't count, since they aren't the faction's.
   */
  readonly isEmpty = computed(
    () => !this.isLoading() && !this.error() && this.factionAbilities().length === 0,
  );

  load(factionId: string): void {
    if (!isKnownFaction(factionId)) {
      return;
    }
    this.selectedFactionId.set(factionId);
  }
}
