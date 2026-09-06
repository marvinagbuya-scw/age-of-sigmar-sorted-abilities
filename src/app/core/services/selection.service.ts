import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  DEFAULT_FACTION_ID,
  armyListFromParams,
  armyListToParams,
  emptyArmyList,
  hasSelections,
  isKnownFaction,
  isUnlocked,
  knownIds,
  pruneArmyList,
  type Ability,
  type ArmyList,
} from '../models';
import { AbilityDataService } from './ability-data.service';

const STORAGE_KEY = 'aos-sorted-abilities:army-list';

/**
 * Holds the player's army selections and filters abilities down to them.
 *
 * State lives in the URL so a list can be bookmarked or shared, with
 * `localStorage` remembering the last one for a fresh visit. While nothing is
 * selected `filter` is a pass-through, so the full faction list renders until the
 * player narrows it down.
 */
@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(AbilityDataService);
  private readonly document = inject(DOCUMENT);

  /** Query params as a signal, so the URL is the source of truth. */
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  private readonly army = signal<ArmyList>(emptyArmyList(DEFAULT_FACTION_ID));

  readonly armyList = this.army.asReadonly();

  readonly filtersActive = computed(() => hasSelections(this.army()));

  constructor() {
    // --- one-time init from the URL, falling back to the last saved list ----
    //
    // Read once rather than continuously: the write effect below uses
    // `replaceUrl`, so no history entries are created and there is no
    // back/forward state to track. Reading once also removes any possibility of
    // the read and write effects bouncing off each other.
    const params = this.route.snapshot.queryParams as Record<string, string | undefined>;
    const initial =
      Object.keys(params).length > 0
        ? armyListFromParams(params, DEFAULT_FACTION_ID)
        : (this.readStored() ?? emptyArmyList(DEFAULT_FACTION_ID));

    const factionId = isKnownFaction(initial.factionId) ? initial.factionId : DEFAULT_FACTION_ID;
    this.army.set({ ...initial, factionId });
    this.data.load(factionId);

    // --- prune selections that no longer exist in the data ------------------
    effect(() => {
      const faction = this.data.faction.value();
      if (!faction || faction.id !== this.army().factionId) {
        return;
      }
      const pruned = pruneArmyList(this.army(), knownIds(faction));
      if (!sameArmyList(pruned, this.army())) {
        this.army.set(pruned);
      }
    });

    // --- state -> URL + localStorage ---------------------------------------
    effect(() => {
      const army = this.army();
      const target = armyListToParams(army);

      this.writeStored(army);

      // Skip the navigation when the URL already says this, so repeated
      // recomputations don't churn the router.
      if (!sameParams(target, this.queryParams())) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: target,
          replaceUrl: true,
        });
      }
    });
  }

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

  // --- mutations -----------------------------------------------------------

  selectFaction(factionId: string): void {
    if (!isKnownFaction(factionId) || factionId === this.army().factionId) {
      return;
    }
    // Load directly rather than waiting for the URL to round-trip, so the data
    // starts fetching immediately. Selections are ids from the previous
    // faction's data, so they cannot carry over.
    this.data.load(factionId);
    this.army.set(emptyArmyList(factionId));
  }

  setBattleFormation(formationId: string | undefined): void {
    this.army.update((a) => ({ ...a, battleFormationId: formationId || undefined }));
  }

  toggle(key: ToggleableKey, id: string, selected?: boolean): void {
    this.army.update((army) => {
      const next = new Set(army[key]);
      const shouldSelect = selected ?? !next.has(id);
      if (shouldSelect) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return { ...army, [key]: next };
    });
  }

  clear(): void {
    this.army.set(emptyArmyList(this.army().factionId));
  }

  // --- persistence ---------------------------------------------------------

  /**
   * `localStorage` is genuinely absent in some environments — private browsing,
   * storage disabled, and the jsdom setup used by the unit tests. Resolve it
   * defensively rather than assuming it exists.
   */
  private get storage(): Storage | undefined {
    try {
      return this.document.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  }

  private readStored(): ArmyList | undefined {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) {
        return undefined;
      }
      return armyListFromParams(JSON.parse(raw) as Record<string, string>, DEFAULT_FACTION_ID);
    } catch {
      // Corrupt JSON is not worth failing over; fall back to an empty list.
      return undefined;
    }
  }

  private writeStored(army: ArmyList): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(armyListToParams(army)));
    } catch {
      // Quota exceeded or storage blocked mid-session — non-fatal.
    }
  }
}

/** Keys on `ArmyList` holding a toggleable set of ids. */
export type ToggleableKey =
  'unitIds' | 'heroicTraitIds' | 'artefactIds' | 'spellLoreIds' | 'manifestationLoreIds';

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

function sameArmyList(a: ArmyList, b: ArmyList): boolean {
  return (
    a.factionId === b.factionId &&
    a.battleFormationId === b.battleFormationId &&
    sameSet(a.unitIds, b.unitIds) &&
    sameSet(a.heroicTraitIds, b.heroicTraitIds) &&
    sameSet(a.artefactIds, b.artefactIds) &&
    sameSet(a.spellLoreIds, b.spellLoreIds) &&
    sameSet(a.manifestationLoreIds, b.manifestationLoreIds)
  );
}

function sameParams(
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string | null | undefined>>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b).filter((k) => b[k] != null && b[k] !== '');
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => a[key] === b[key]);
}
