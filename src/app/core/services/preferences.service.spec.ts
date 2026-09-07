import { TestBed } from '@angular/core/testing';

import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('shows flavour by default', () => {
    expect(TestBed.inject(PreferencesService).showFlavour()).toBe(true);
  });

  it('turns flavour off and on again', () => {
    const preferences = TestBed.inject(PreferencesService);

    preferences.setShowFlavour(false);
    expect(preferences.showFlavour()).toBe(false);

    preferences.setShowFlavour(true);
    expect(preferences.showFlavour()).toBe(true);
  });

  it('toggles flavour', () => {
    const preferences = TestBed.inject(PreferencesService);
    const before = preferences.showFlavour();

    preferences.toggleFlavour();
    expect(preferences.showFlavour()).toBe(!before);
  });

  it('works when localStorage is unavailable', () => {
    // jsdom in this setup provides no storage, and neither does private
    // browsing, so every access has to be optional.
    expect(() => {
      const preferences = TestBed.inject(PreferencesService);
      preferences.setShowFlavour(false);
      TestBed.tick();
    }).not.toThrow();
  });
});
