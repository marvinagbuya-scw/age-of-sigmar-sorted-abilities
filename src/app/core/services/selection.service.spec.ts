import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SelectionService } from './selection.service';
import { AbilityDataService } from './ability-data.service';
import type { Ability } from '../models';

function ability(id: string, source: Ability['source']): Ability {
  return { id, name: id, timing: { phase: 'hero' }, effect: 'Effect.', keywords: [], source };
}

@Component({ template: '' })
class HostStub {}

/** Flush effects and let any router navigation they triggered settle. */
async function settle(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
}

describe('SelectionService', () => {
  let selection: SelectionService;
  let data: AbilityDataService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: HostStub }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    // Perform a real navigation first: the service reads the route snapshot when
    // it is constructed, and writes back via the router.
    await RouterTestingHarness.create('/');

    router = TestBed.inject(Router);
    data = TestBed.inject(AbilityDataService);
    selection = TestBed.inject(SelectionService);
  });

  it('starts with nothing selected, so filtering is a pass-through', () => {
    const abilities = [
      ability('faction-a', { kind: 'faction' }),
      ability('scroll-a', { kind: 'warscroll', unitId: 'unit-a' }),
    ];

    expect(selection.filtersActive()).toBe(false);
    expect(selection.filter(abilities)).toEqual(abilities);
  });

  it('narrows to the selected units once something is picked', () => {
    const abilities = [
      ability('faction-a', { kind: 'faction' }),
      ability('handbook-a', { kind: 'generals-handbook' }),
      ability('scroll-a', { kind: 'warscroll', unitId: 'unit-a' }),
      ability('scroll-b', { kind: 'warscroll', unitId: 'unit-b' }),
    ];

    selection.toggle('unitIds', 'unit-a');

    expect(selection.filtersActive()).toBe(true);
    // Faction and handbook abilities always survive; only unit-b's is dropped.
    expect(selection.filter(abilities).map((a) => a.id)).toEqual([
      'faction-a',
      'handbook-a',
      'scroll-a',
    ]);
  });

  it('keeps a battle formation ability only for the chosen formation', () => {
    const abilities = [
      ability('a', { kind: 'battle-formation', formationId: 'legion' }),
      ability('b', { kind: 'battle-formation', formationId: 'dynasty' }),
    ];

    selection.setBattleFormation('legion');

    expect(selection.filter(abilities).map((x) => x.id)).toEqual(['a']);
  });

  it('toggles an id off again', () => {
    selection.toggle('unitIds', 'unit-a');
    expect(selection.armyList().unitIds.has('unit-a')).toBe(true);

    selection.toggle('unitIds', 'unit-a');
    expect(selection.armyList().unitIds.has('unit-a')).toBe(false);
    expect(selection.filtersActive()).toBe(false);
  });

  it('honours an explicit selected flag, so repeated checkbox events are idempotent', () => {
    selection.toggle('unitIds', 'unit-a', true);
    selection.toggle('unitIds', 'unit-a', true);
    expect(selection.armyList().unitIds.has('unit-a')).toBe(true);

    selection.toggle('unitIds', 'unit-a', false);
    expect(selection.armyList().unitIds.has('unit-a')).toBe(false);
  });

  it('clears everything but keeps the faction', () => {
    selection.toggle('unitIds', 'unit-a');
    selection.setBattleFormation('formation-a');

    selection.clear();

    expect(selection.filtersActive()).toBe(false);
    expect(selection.armyList().factionId).toBe('soulblight-gravelords');
  });

  it('clears the selection when the faction changes', () => {
    // Selections are ids from one faction's data, so they cannot carry over.
    selection.toggle('unitIds', 'sbgl-vampire-lord');

    selection.selectFaction('skaven');

    expect(selection.armyList().factionId).toBe('skaven');
    expect(selection.filtersActive()).toBe(false);
  });

  it('tells the data service to load the newly chosen faction', () => {
    selection.selectFaction('slaves-to-darkness');
    TestBed.tick();
    expect(data.factionId()).toBe('slaves-to-darkness');
  });

  it('ignores an unknown faction rather than requesting a file that does not exist', () => {
    selection.selectFaction('not-a-faction');
    expect(selection.armyList().factionId).toBe('soulblight-gravelords');
    expect(data.factionId()).toBe('soulblight-gravelords');
  });

  it('treats an empty battle formation as cleared', () => {
    selection.setBattleFormation('formation-a');
    expect(selection.armyList().battleFormationId).toBe('formation-a');

    selection.setBattleFormation('');
    expect(selection.armyList().battleFormationId).toBeUndefined();
  });

  it('pushes the selection to the URL so it can be bookmarked', async () => {
    await settle();
    const navigate = vi.spyOn(router, 'navigate');

    selection.toggle('unitIds', 'unit-a');
    TestBed.tick();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { f: 'soulblight-gravelords', u: 'unit-a' },
        replaceUrl: true,
      }),
    );
  });

  it('does not keep navigating once the URL already matches the selection', async () => {
    selection.toggle('unitIds', 'unit-a');
    await settle();

    const navigate = vi.spyOn(router, 'navigate');
    TestBed.tick();
    await settle();

    // A redundant navigation here would mean the state and the URL are bouncing
    // off each other.
    expect(navigate).not.toHaveBeenCalled();
  });

  it('replaces history rather than pushing, so Back does not walk through edits', async () => {
    await settle();
    const navigate = vi.spyOn(router, 'navigate');

    selection.toggle('unitIds', 'unit-a');
    TestBed.tick();

    const options = navigate.mock.calls[0]?.[1];
    expect(options?.replaceUrl).toBe(true);
  });

  it('works when localStorage is unavailable', () => {
    // jsdom in this setup provides no storage, and neither does private
    // browsing, so every storage access has to be optional.
    expect(() => {
      selection.toggle('unitIds', 'unit-a');
      TestBed.tick();
      selection.clear();
      TestBed.tick();
    }).not.toThrow();
  });
});
