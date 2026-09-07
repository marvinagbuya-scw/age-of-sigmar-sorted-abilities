import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { SOURCE_KIND_LABELS, type Faction } from '../core/models';
import { AbilityDataService } from '../core/services/ability-data.service';
import { SelectionService, type ToggleableKey } from '../core/services/selection.service';

interface Choice {
  id: string;
  name: string;
  /** Extra detail shown under the name, e.g. a unit's keywords. */
  detail?: string;
}

interface ChoiceGroup {
  key: ToggleableKey;
  label: string;
  choices: Choice[];
}

/**
 * The army-list picker. Hidden when printing.
 *
 * Faction abilities aren't listed here because they always apply, so there's
 * nothing to choose.
 */
@Component({
  selector: 'app-army-selector',
  templateUrl: './army-selector.html',
  styleUrl: './army-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'no-print' },
})
export class ArmySelector {
  private readonly data = inject(AbilityDataService);
  private readonly selection = inject(SelectionService);

  readonly factions = this.data.factions;
  readonly factionId = this.data.factionId;
  readonly armyList = this.selection.armyList;
  readonly filtersActive = this.selection.filtersActive;
  readonly isLoading = this.data.isLoading;
  private readonly hasAbilities = computed(() => this.data.abilities().length > 0);

  readonly expanded = signal(true);

  readonly battleFormations = computed(
    () => this.data.faction.value()?.battleFormations.map(toChoice) ?? [],
  );

  /**
   * Everything else that can be selected, as a uniform list of groups so the
   * template doesn't repeat itself six times.
   */
  readonly groups = computed<ChoiceGroup[]>(() => {
    const faction = this.data.faction.value();
    if (!faction) {
      return [];
    }

    const groups: ChoiceGroup[] = [
      { key: 'unitIds', label: 'Units', choices: unitChoices(faction) },
      {
        key: 'heroicTraitIds',
        label: SOURCE_KIND_LABELS['heroic-trait'] + 's',
        choices: faction.heroicTraits.map(toChoice),
      },
      {
        key: 'artefactIds',
        label: 'Artefacts of Power',
        choices: faction.artefactsOfPower.map(toChoice),
      },
      {
        key: 'spellLoreIds',
        label: 'Spell Lores',
        choices: faction.spellLores.map(toChoice),
      },
      {
        key: 'manifestationLoreIds',
        label: 'Manifestation Lores',
        choices: faction.manifestationLores.map(toChoice),
      },
      {
        key: 'generalsHandbookIds',
        label: SOURCE_KIND_LABELS['generals-handbook'],
        choices: faction.generalsHandbook.map(toChoice),
      },
    ];

    return groups.filter((group) => group.choices.length > 0);
  });

  /** Total number of things selected, for the collapsed summary. */
  readonly selectedCount = computed(() => {
    const a = this.armyList();
    return (
      (a.battleFormationId ? 1 : 0) +
      a.unitIds.size +
      a.heroicTraitIds.size +
      a.artefactIds.size +
      a.spellLoreIds.size +
      a.manifestationLoreIds.size +
      a.generalsHandbookIds.size
    );
  });

  /** True when the faction has nothing at all to pick from yet. */
  readonly hasNothingToPick = computed(
    () => this.battleFormations().length === 0 && this.groups().length === 0,
  );

  /**
   * True when the faction has abilities but none of them are selectable — i.e.
   * only faction-wide abilities have been transcribed so far. Different from
   * having no data at all.
   */
  readonly onlyFactionWide = computed(() => this.hasNothingToPick() && this.hasAbilities());

  isSelected(key: ToggleableKey, id: string): boolean {
    return this.armyList()[key].has(id);
  }

  toggle(key: ToggleableKey, id: string, event: Event): void {
    this.selection.toggle(key, id, (event.target as HTMLInputElement).checked);
  }

  selectFaction(event: Event): void {
    this.selection.selectFaction((event.target as HTMLSelectElement).value);
  }

  setBattleFormation(event: Event): void {
    this.selection.setBattleFormation((event.target as HTMLSelectElement).value);
  }

  clear(): void {
    this.selection.clear();
  }

  toggleExpanded(): void {
    this.expanded.update((open) => !open);
  }
}

function toChoice(entry: { id: string; name: string }): Choice {
  return { id: entry.id, name: entry.name };
}

function unitChoices(faction: Faction): Choice[] {
  return [...faction.units]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      detail: unit.keywords.join(', ') || undefined,
    }));
}
