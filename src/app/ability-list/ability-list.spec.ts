import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AbilityList } from './ability-list';
import { AbilityDataService } from '../core/services/ability-data.service';
import { PreferencesService } from '../core/services/preferences.service';
import { SelectionService } from '../core/services/selection.service';
import {
  FACTIONS,
  hasWarscrollProfile,
  type Ability,
  type Faction,
  type Unit,
} from '../core/models';

const flavoured: Ability = {
  id: 'skv-lurking',
  name: 'The Lurking Vermintide',
  flavour: 'What scurries beneath the surface?',
  timing: { phase: 'deployment' },
  effect: 'Set up that unit in reserve.',
  keywords: [],
  source: { kind: 'faction' },
};

const coreAbility: Ability = {
  id: 'core-normal-move',
  name: 'Normal Move',
  timing: { phase: 'movement', turn: 'your' },
  effect: 'That unit can move up to its Move characteristic.',
  keywords: ['CORE', 'MOVE'],
  source: { kind: 'core' },
};

const unit: Unit = {
  id: 'skv-grey-seer',
  name: 'Grey Seer',
  keywords: ['HERO', 'WIZARD (1)'],
  stats: { health: 5, move: 6, save: 6, control: 2, ward: 6 },
  attacks: [
    {
      id: 'skv-warpstone-staff',
      name: 'Warpstone Staff',
      abilities: ['Crit (Mortal)'],
      type: 'melee',
      characteristics: { attacks: 3, hit: 4, wound: 3, rend: 1, damage: 2 },
    },
  ],
  abilities: [],
};

const faction: Faction = {
  id: 'skaven',
  name: 'Skaven',
  factionAbilities: [flavoured],
  battleFormations: [],
  heroicTraits: [],
  artefactsOfPower: [],
  spellLores: [],
  prayerLores: [],
  manifestationLores: [],
  generalsHandbook: [],
  units: [unit],
};

/**
 * Stubs the data service so the list can be rendered without HTTP. The real
 * service is covered separately; this is about the toggles reaching the cards.
 */
function stubDataService(includeUniversal = signal(true)) {
  const value = signal<Faction | undefined>(faction);
  const universalAbilities = computed(() => (includeUniversal() ? [coreAbility] : []));
  const units = signal<readonly Unit[]>(faction.units).asReadonly();
  return {
    factions: FACTIONS,
    factionId: signal('skaven').asReadonly(),
    faction: { value },
    isLoading: signal(false).asReadonly(),
    error: signal(undefined).asReadonly(),
    universalError: signal(undefined).asReadonly(),
    factionName: signal('Skaven').asReadonly(),
    factionAbilities: signal<Ability[]>([flavoured]).asReadonly(),
    universalAbilities,
    hasUniversalData: signal(true).asReadonly(),
    abilities: computed(() => [flavoured, ...universalAbilities()]),
    hasSampleData: signal(false).asReadonly(),
    isEmpty: signal(false).asReadonly(),
    units,
    hasUnitProfiles: computed(() => units().some(hasWarscrollProfile)),
    load: () => undefined,
  };
}

describe('AbilityList flavour toggle', () => {
  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AbilityDataService, useValue: stubDataService() },
      ],
    });

    const fixture = TestBed.createComponent(AbilityList);
    fixture.detectChanges();
    return fixture;
  }

  it('renders flavour text by default', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('What scurries beneath the surface?');
  });

  it('offers a flavour toggle when something has flavour text', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLInputElement>('#toggle-flavour');
    expect(toggle).not.toBeNull();
    expect(toggle?.checked).toBe(true);
  });

  it('drops flavour from the cards when the preference is turned off', () => {
    const fixture = render();
    TestBed.inject(PreferencesService).setShowFlavour(false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('What scurries beneath the surface?');
    // The ability itself is still listed — only the flavour line goes.
    expect(el.textContent).toContain('The Lurking Vermintide');
  });

  it('reflects the preference in the checkbox', () => {
    const fixture = render();
    TestBed.inject(PreferencesService).setShowFlavour(false);
    fixture.detectChanges();

    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#toggle-flavour',
    );
    expect(toggle?.checked).toBe(false);
  });

  it('updates the preference when the checkbox is clicked', () => {
    const fixture = render();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#toggle-flavour',
    );

    toggle!.checked = false;
    toggle!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(TestBed.inject(PreferencesService).showFlavour()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'What scurries beneath the surface?',
    );
  });

  afterEach(() => {
    // The preference is a root singleton, so reset it between tests.
    TestBed.inject(PreferencesService).setShowFlavour(true);
  });
});

describe('AbilityList universal abilities toggle', () => {
  function render(includeUniversal = signal(true)) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AbilityDataService, useValue: stubDataService(includeUniversal) },
      ],
    });

    const fixture = TestBed.createComponent(AbilityList);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.inject(PreferencesService).setIncludeUniversal(true);
  });

  it('includes universal core abilities by default', () => {
    const el = render().nativeElement as HTMLElement;
    expect(el.textContent).toContain('Normal Move');
    // Universal abilities apply regardless of the army list, so they show even
    // with nothing selected.
    expect(el.textContent).toContain('The Lurking Vermintide');
  });

  it('offers a core abilities toggle, checked by default', () => {
    const el = render().nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLInputElement>('#toggle-universal');
    expect(toggle?.checked).toBe(true);
  });

  it('updates the preference when the core abilities checkbox is clicked', () => {
    const fixture = render();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#toggle-universal',
    );

    toggle!.checked = false;
    toggle!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(TestBed.inject(PreferencesService).includeUniversal()).toBe(false);
  });

  it('drops universal abilities when the toggle is turned off', () => {
    const includeUniversal = signal(true);
    const fixture = render(includeUniversal);

    TestBed.inject(PreferencesService).setIncludeUniversal(false);
    includeUniversal.set(false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Normal Move');
    // The faction's own abilities are untouched.
    expect(el.textContent).toContain('The Lurking Vermintide');
  });

  it('counts universal abilities in the total', () => {
    const el = render().nativeElement as HTMLElement;
    // 1 faction ability + 1 universal, both visible with nothing selected.
    expect(el.textContent).toContain('2 of 2 abilities');
  });

  it('renders core abilities under their own "Core" subheading', () => {
    const el = render().nativeElement as HTMLElement;
    const subheadings = [...el.querySelectorAll('.phase__subheading')].map((n) =>
      n.textContent?.trim(),
    );
    expect(subheadings).toContain('Core');
  });

  it('drops the Core subheading when universal abilities are off', () => {
    const includeUniversal = signal(true);
    const fixture = render(includeUniversal);

    TestBed.inject(PreferencesService).setIncludeUniversal(false);
    includeUniversal.set(false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.phase__subheading')).toBeNull();
  });
});

describe('AbilityList unit stats toggle', () => {
  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AbilityDataService, useValue: stubDataService() },
      ],
    });

    const fixture = TestBed.createComponent(AbilityList);
    fixture.detectChanges();
    return fixture;
  }

  /** Stat blocks only cover units you're fielding, so field one. */
  function selectUnit(fixture: ReturnType<typeof render>) {
    TestBed.inject(SelectionService).toggle('unitIds', unit.id, true);
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.inject(PreferencesService).setShowUnits(false);
    TestBed.inject(SelectionService).clear();
  });

  it('offers a unit stats toggle, unchecked by default', () => {
    const el = render().nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLInputElement>('#toggle-units');
    expect(toggle).not.toBeNull();
    expect(toggle?.checked).toBe(false);
  });

  it('hides the stat blocks until the toggle is on', () => {
    const fixture = render();
    selectUnit(fixture);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-unit-card')).toBeNull();
  });

  it('appends the stat blocks under a "Unit" heading once switched on', () => {
    const fixture = render();
    selectUnit(fixture);

    TestBed.inject(PreferencesService).setShowUnits(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-unit-card').length).toBe(1);

    const headings = [...el.querySelectorAll('.phase__heading')].map(
      (n) => n.textContent?.trim().split(/\s+/)[0],
    );
    // Last section on the page: stat blocks are reference material, so they sit
    // below every phase.
    expect(headings.at(-1)).toBe('Unit');
  });

  it('shows nothing when the toggle is on but no unit is selected', () => {
    const fixture = render();
    TestBed.inject(PreferencesService).setShowUnits(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-unit-card')).toBeNull();
  });

  it('updates the preference when the checkbox is clicked', () => {
    const fixture = render();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#toggle-units',
    );

    toggle!.checked = true;
    toggle!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(TestBed.inject(PreferencesService).showUnits()).toBe(true);
  });
});
