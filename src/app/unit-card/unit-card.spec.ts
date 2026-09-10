import { TestBed } from '@angular/core/testing';

import { UnitCard } from './unit-card';
import type { Unit } from '../core/models';

const base: Unit = {
  id: 'test-unit',
  name: 'Neferata, Mortarch of Blood',
  keywords: ['HERO', 'MONSTER'],
  stats: { health: 14, move: 12, save: 3, control: 5 },
  attacks: [
    {
      id: 'test-claws',
      name: "Nagadron's Claws",
      abilities: [],
      type: 'melee',
      characteristics: { attacks: 5, hit: 4, wound: 2, rend: 3, damage: 3 },
    },
  ],
  abilities: [],
};

function render(unit: Unit) {
  const fixture = TestBed.createComponent(UnitCard);
  fixture.componentRef.setInput('unit', unit);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('UnitCard', () => {
  it('formats the profile box the way the warscroll prints it', () => {
    const el = render(base);
    const values = [...el.querySelectorAll('.unit-card__stat-value')].map((n) => n.textContent);
    // Move gains its inches mark and Save its plus; Health and Control are plain.
    expect(values).toEqual(['12"', '14', '5', '3+']);
  });

  it('omits the ward slot unless the unit has one', () => {
    expect(render(base).textContent).not.toContain('Ward');

    const warded = render({ ...base, stats: { ...base.stats!, ward: 6 } });
    expect(warded.textContent).toContain('Ward');
    expect(
      [...warded.querySelectorAll('.unit-card__stat-value')].map((n) => n.textContent),
    ).toContain('6+');
  });

  it('renders hit and wound as rolls whether authored as numbers or strings', () => {
    const el = render({
      ...base,
      attacks: [
        {
          ...base.attacks![0],
          characteristics: { attacks: 5, hit: '3+', wound: 3, rend: 2, damage: 1 },
        },
      ],
    });
    const cells = [...el.querySelectorAll('tbody td')].map((n) => n.textContent);
    expect(cells).toEqual(['5', '3+', '3+', '2', '1']);
  });

  it('shows a dash for a rend of zero or absent', () => {
    const el = render({
      ...base,
      attacks: [
        {
          ...base.attacks![0],
          characteristics: { attacks: 2, hit: 3, wound: 3, damage: 1 },
        },
      ],
    });
    expect([...el.querySelectorAll('tbody td')].map((n) => n.textContent)).toEqual([
      '2',
      '3+',
      '3+',
      '-',
      '1',
    ]);
  });

  it('gives ranged weapons a range column and melee weapons none', () => {
    const melee = render(base);
    expect(melee.querySelector('thead')?.textContent).not.toContain('Rng');

    const ranged = render({
      ...base,
      attacks: [
        {
          id: 'test-bow',
          name: 'Deathly Bow',
          abilities: [],
          type: 'ranged',
          characteristics: { range: 18, attacks: 2, hit: 3, wound: 3, damage: 1 },
        },
      ],
    });
    expect(ranged.querySelector('thead')?.textContent).toContain('Rng');
    expect([...ranged.querySelectorAll('tbody td')].map((n) => n.textContent)).toEqual([
      '18"',
      '2',
      '3+',
      '3+',
      '-',
      '1',
    ]);
  });

  it('splits melee and ranged weapons into their own tables', () => {
    const el = render({
      ...base,
      attacks: [
        base.attacks![0],
        {
          id: 'test-bow',
          name: 'Deathly Bow',
          abilities: [],
          type: 'ranged',
          characteristics: { range: 18, attacks: 2, hit: 3, wound: 3, damage: 1 },
        },
      ],
    });
    const headings = [...el.querySelectorAll('.unit-card__weapons-heading')].map(
      (n) => n.textContent,
    );
    expect(headings).toEqual(['Melee weapons', 'Ranged weapons']);
    expect(el.querySelectorAll('table').length).toBe(2);
  });

  it('lists weapon abilities under the weapon name', () => {
    const el = render({
      ...base,
      attacks: [{ ...base.attacks![0], abilities: ['Anti-HERO (+1 Rend)', 'Crit (Mortal)'] }],
    });
    expect(el.querySelector('.unit-card__weapon-abilities')?.textContent).toBe(
      'Anti-HERO (+1 Rend), Crit (Mortal)',
    );
  });

  it('says so when a warscroll has no profile transcribed yet', () => {
    const el = render({ id: 'u', name: 'Zombies', keywords: [], abilities: [] });
    expect(el.textContent).toContain('not transcribed yet');
    expect(el.querySelector('table')).toBeNull();
  });
});
