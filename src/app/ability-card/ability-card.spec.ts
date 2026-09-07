import { TestBed } from '@angular/core/testing';

import { AbilityCard } from './ability-card';
import type { Ability } from '../core/models';

function ability(overrides: Partial<Ability> = {}): Ability {
  return {
    id: 'a',
    name: 'An Ability',
    timing: { phase: 'combat', turn: 'your' },
    effect: 'Effect text.',
    keywords: [],
    source: { kind: 'faction' },
    ...overrides,
  };
}

function render(input: Ability) {
  const fixture = TestBed.createComponent(AbilityCard);
  fixture.componentRef.setInput('ability', input);
  fixture.detectChanges();
  return fixture;
}

describe('AbilityCard value badge', () => {
  it('shows no badge when the ability has no value', () => {
    const el = render(ability()).nativeElement as HTMLElement;
    expect(el.querySelector('.ability-card__value')).toBeNull();
  });

  it('shows a casting value for a spell', () => {
    const el = render(ability({ castingValue: 7, keywords: ['Spell'] }))
      .nativeElement as HTMLElement;
    const badge = el.querySelector('.ability-card__value');
    expect(badge?.textContent?.trim()).toBe('7');
    expect(badge?.getAttribute('data-kind')).toBe('casting');
    expect(badge?.getAttribute('aria-label')).toBe('Casting value 7');
  });

  it('shows a chanting value for a prayer', () => {
    const el = render(ability({ chantingValue: 4, keywords: ['Prayer'] }))
      .nativeElement as HTMLElement;
    const badge = el.querySelector('.ability-card__value');
    expect(badge?.textContent?.trim()).toBe('4');
    expect(badge?.getAttribute('data-kind')).toBe('chanting');
    expect(badge?.getAttribute('aria-label')).toBe('Chanting value 4');
  });

  it('shows a command point cost for a command ability', () => {
    const el = render(ability({ commandValue: 1, keywords: ['Command'] }))
      .nativeElement as HTMLElement;
    const badge = el.querySelector('.ability-card__value');
    expect(badge?.textContent?.trim()).toBe('1');
    expect(badge?.getAttribute('data-kind')).toBe('command');
    // A cost, not a roll target, so it must not read as "value N".
    expect(badge?.getAttribute('aria-label')).toBe('Costs 1 command point');
  });

  it('pluralises a multi-point command cost', () => {
    const el = render(ability({ commandValue: 2, keywords: ['Command'] }))
      .nativeElement as HTMLElement;
    expect(el.querySelector('.ability-card__value')?.getAttribute('aria-label')).toBe(
      'Costs 2 command points',
    );
  });

  it('renders a zero command cost rather than hiding it', () => {
    const el = render(ability({ commandValue: 0, keywords: ['Command'] }))
      .nativeElement as HTMLElement;
    expect(el.querySelector('.ability-card__value')?.textContent?.trim()).toBe('0');
  });
});

describe('AbilityCard', () => {
  it('omits the declare block for a passive ability', () => {
    const el = render(ability({ timing: { phase: 'passive' } })).nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Declare:');
    expect(el.textContent).toContain('Effect:');
  });

  it('uses the green reaction band regardless of phase', () => {
    const fixture = render(
      ability({ timing: { phase: 'combat', reaction: 'You declared a Fight ability' } }),
    );
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-band')).toBe('reaction');
  });

  it('honours an explicit band override', () => {
    const fixture = render(
      ability({ timing: { phase: 'passive', section: 'shooting', band: 'shooting' } }),
    );
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-band')).toBe('shooting');
  });

  it('renders a bulleted list effect as a real list', () => {
    const el = render(ability({ effect: ['For each target:', { list: ['First.', 'Second.'] }] }))
      .nativeElement as HTMLElement;

    const items = el.querySelectorAll('ul.ability-card__list li');
    expect(items.length).toBe(2);
    expect(items[0].textContent?.trim()).toBe('First.');
  });

  it('renders an ordered list effect as an ol', () => {
    const el = render(ability({ effect: [{ list: ['First.'], ordered: true }] }))
      .nativeElement as HTMLElement;
    expect(el.querySelector('ol.ability-card__list')).not.toBeNull();
    expect(el.querySelector('ul.ability-card__list')).toBeNull();
  });

  it('flags sample data on the card', () => {
    const el = render(ability({ sample: true })).nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sample data');
  });
});
