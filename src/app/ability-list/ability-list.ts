import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AbilityCard } from '../ability-card/ability-card';
import { ArmySelector } from '../army-selector/army-selector';
import { bandForPhase, groupByPhase } from '../core/models';
import { AbilityDataService } from '../core/services/ability-data.service';
import { PreferencesService } from '../core/services/preferences.service';
import { SelectionService } from '../core/services/selection.service';
import { UnitCard } from '../unit-card/unit-card';

@Component({
  selector: 'app-ability-list',
  templateUrl: './ability-list.html',
  styleUrl: './ability-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AbilityCard, ArmySelector, UnitCard],
})
export class AbilityList {
  private readonly data = inject(AbilityDataService);
  private readonly selection = inject(SelectionService);
  private readonly preferences = inject(PreferencesService);

  readonly showFlavour = this.preferences.showFlavour;
  readonly includeUniversal = this.preferences.includeUniversal;
  readonly showUnits = this.preferences.showUnits;
  readonly hasUniversalData = this.data.hasUniversalData;
  readonly hasUnitProfiles = this.data.hasUnitProfiles;
  readonly universalError = this.data.universalError;

  /** True when any visible ability actually has flavour text to hide. */
  readonly hasAnyFlavour = computed(() => this.visible().some((a) => a.flavour));

  readonly isLoading = this.data.isLoading;
  readonly error = this.data.error;
  readonly hasSampleData = this.data.hasSampleData;
  readonly isEmpty = this.data.isEmpty;
  readonly factionId = this.data.factionId;
  readonly factionName = this.data.factionName;
  readonly filtersActive = this.selection.filtersActive;

  /** Abilities left after applying the army list. */
  private readonly visible = computed(() => this.selection.filter(this.data.abilities()));

  /**
   * Abilities grouped into phase sections in turn-sequence order, narrowed to
   * the current army list (a no-op until the player selects something).
   */
  readonly groups = computed(() => groupByPhase(this.visible()));

  readonly visibleCount = computed(() => this.visible().length);
  readonly totalCount = computed(() => this.data.abilities().length);

  /**
   * The warscrolls of the units in the army list, shown as stat blocks in their
   * own section below the phases. Empty until the toggle is on, so the section
   * disappears entirely rather than collapsing to a bare heading.
   */
  readonly units = computed(() =>
    this.showUnits() ? this.selection.filterUnits(this.data.units()) : [],
  );

  readonly bandForPhase = bandForPhase;

  setShowUnits(event: Event): void {
    this.preferences.setShowUnits((event.target as HTMLInputElement).checked);
  }

  setShowFlavour(event: Event): void {
    this.preferences.setShowFlavour((event.target as HTMLInputElement).checked);
  }

  setIncludeUniversal(event: Event): void {
    this.preferences.setIncludeUniversal((event.target as HTMLInputElement).checked);
  }

  print(): void {
    window.print();
  }
}
