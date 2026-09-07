import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AbilityCard } from '../ability-card/ability-card';
import { ArmySelector } from '../army-selector/army-selector';
import { bandForPhase, groupByPhase } from '../core/models';
import { AbilityDataService } from '../core/services/ability-data.service';
import { PreferencesService } from '../core/services/preferences.service';
import { SelectionService } from '../core/services/selection.service';

@Component({
  selector: 'app-ability-list',
  templateUrl: './ability-list.html',
  styleUrl: './ability-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AbilityCard, ArmySelector],
})
export class AbilityList {
  private readonly data = inject(AbilityDataService);
  private readonly selection = inject(SelectionService);
  private readonly preferences = inject(PreferencesService);

  readonly showFlavour = this.preferences.showFlavour;

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

  readonly bandForPhase = bandForPhase;

  setShowFlavour(event: Event): void {
    this.preferences.setShowFlavour((event.target as HTMLInputElement).checked);
  }

  print(): void {
    window.print();
  }
}
