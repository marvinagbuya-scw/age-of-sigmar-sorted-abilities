import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

import { readJson, resolveStorage, writeJson } from './local-storage';

const STORAGE_KEY = 'aos-sorted-abilities:preferences';

interface StoredPreferences {
  showFlavour?: boolean;
  includeUniversal?: boolean;
  showUnits?: boolean;
}

/**
 * Display preferences, as opposed to army selections.
 *
 * Kept out of the URL deliberately: these describe how *you* want the sheet to
 * look, not what's in the army, so a shared link shouldn't impose them on
 * whoever opens it. They persist in `localStorage` instead.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly storage = resolveStorage(inject(DOCUMENT));

  private readonly stored = readJson<StoredPreferences>(this.storage, STORAGE_KEY);

  private readonly flavour = signal(this.stored?.showFlavour ?? true);
  private readonly universal = signal(this.stored?.includeUniversal ?? true);
  private readonly units = signal(this.stored?.showUnits ?? false);

  /**
   * Whether the italic flavour line is rendered on cards. On by default; turning
   * it off makes the printed sheet noticeably shorter.
   */
  readonly showFlavour = this.flavour.asReadonly();

  /**
   * Whether universal core and command abilities are merged into the list. On by
   * default, since they apply to every army; turn it off once you no longer need
   * the core rules on the sheet.
   */
  readonly includeUniversal = this.universal.asReadonly();

  /**
   * Whether the warscroll stat blocks are appended to the list under "Unit".
   * Off by default: this sheet is about the turn sequence, and the stat blocks
   * are a bulky extra you opt into when you want the whole warscroll on paper.
   */
  readonly showUnits = this.units.asReadonly();

  constructor() {
    effect(() => {
      const value: StoredPreferences = {
        showFlavour: this.flavour(),
        includeUniversal: this.universal(),
        showUnits: this.units(),
      };
      writeJson(this.storage, STORAGE_KEY, value);
    });
  }

  setShowFlavour(show: boolean): void {
    this.flavour.set(show);
  }

  toggleFlavour(): void {
    this.flavour.update((show) => !show);
  }

  setIncludeUniversal(include: boolean): void {
    this.universal.set(include);
  }

  toggleUniversal(): void {
    this.universal.update((include) => !include);
  }

  setShowUnits(show: boolean): void {
    this.units.set(show);
  }

  toggleUnits(): void {
    this.units.update((show) => !show);
  }
}
