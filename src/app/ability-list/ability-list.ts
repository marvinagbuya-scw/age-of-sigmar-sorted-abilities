import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AbilityCard } from '../ability-card/ability-card';
import { bandForPhase, groupByPhase } from '../core/models';
import { AbilityDataService } from '../core/services/ability-data.service';
import { SelectionService } from '../core/services/selection.service';

@Component({
  selector: 'app-ability-list',
  templateUrl: './ability-list.html',
  styleUrl: './ability-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AbilityCard],
})
export class AbilityList {
  private readonly data = inject(AbilityDataService);
  private readonly selection = inject(SelectionService);

  readonly isLoading = this.data.isLoading;
  readonly error = this.data.error;
  readonly hasSampleData = this.data.hasSampleData;

  readonly factionName = computed(() => this.data.faction.value()?.name ?? '');

  /**
   * Abilities grouped into phase sections in turn-sequence order, narrowed to
   * the current army list (a no-op until the player selects something).
   */
  readonly groups = computed(() => groupByPhase(this.selection.filter(this.data.abilities())));

  readonly totalAbilities = computed(() =>
    this.groups().reduce((sum, group) => sum + group.abilities.length, 0),
  );

  readonly bandForPhase = bandForPhase;

  print(): void {
    window.print();
  }
}
