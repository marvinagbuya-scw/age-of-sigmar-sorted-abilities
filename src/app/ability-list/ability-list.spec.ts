import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AbilityList } from './ability-list';
import { AbilityDataService } from '../core/services/ability-data.service';
import { PreferencesService } from '../core/services/preferences.service';
import { FACTIONS, type Ability, type Faction } from '../core/models';

const flavoured: Ability = {
  id: 'skv-lurking',
  name: 'The Lurking Vermintide',
  flavour: 'What scurries beneath the surface?',
  timing: { phase: 'deployment' },
  effect: 'Set up that unit in reserve.',
  keywords: [],
  source: { kind: 'faction' },
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
  units: [],
};

/**
 * Stubs the data service so the list can be rendered without HTTP. The real
 * service is covered separately; this is about the flavour toggle reaching the
 * cards.
 */
function stubDataService() {
  const value = signal<Faction | undefined>(faction);
  return {
    factions: FACTIONS,
    factionId: signal('skaven').asReadonly(),
    faction: { value },
    isLoading: signal(false).asReadonly(),
    error: signal(undefined).asReadonly(),
    factionName: signal('Skaven').asReadonly(),
    abilities: signal<Ability[]>([flavoured]).asReadonly(),
    hasSampleData: signal(false).asReadonly(),
    isEmpty: signal(false).asReadonly(),
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
    const toggle = el.querySelector<HTMLInputElement>('.toggle input');
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
      '.toggle input',
    );
    expect(toggle?.checked).toBe(false);
  });

  it('updates the preference when the checkbox is clicked', () => {
    const fixture = render();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '.toggle input',
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
