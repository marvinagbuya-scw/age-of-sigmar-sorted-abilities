import type { Ability, AbilitySource } from './ability';
import { groupByPhase } from './grouping';
import type { Phase, Timing } from './timing';

function ability(
  id: string,
  timing: Timing,
  source: AbilitySource = { kind: 'faction' },
  name = id,
): Ability {
  return { id, name, timing, effect: 'Effect text.', keywords: [], source };
}

describe('groupByPhase', () => {
  it('orders sections by the turn sequence, not by input order', () => {
    const groups = groupByPhase([
      ability('a', { phase: 'combat' }),
      ability('b', { phase: 'hero' }),
      ability('c', { phase: 'deployment' }),
      ability('d', { phase: 'end-of-turn' }),
      ability('e', { phase: 'movement' }),
    ]);

    expect(groups.map((g) => g.phase)).toEqual([
      'deployment',
      'hero',
      'movement',
      'combat',
      'end-of-turn',
    ]);
  });

  it('omits phases that have no abilities', () => {
    const groups = groupByPhase([ability('a', { phase: 'charge' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBe('charge');
  });

  it('labels each section with its printed heading', () => {
    const groups = groupByPhase([ability('a', { phase: 'end-of-battle-round' })]);
    expect(groups[0].label).toBe('End of Battle Round');
  });

  it('interleaves reactions into the phase they trigger in', () => {
    const groups = groupByPhase([
      ability('reaction', { phase: 'combat', reaction: 'You declared a Fight ability' }),
      ability('normal', { phase: 'combat' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBe('combat');
    expect(groups[0].abilities.map((a) => a.id)).toEqual(['normal', 'reaction']);
  });

  it('sorts your-turn before any before enemy-turn', () => {
    const groups = groupByPhase([
      ability('enemy', { phase: 'hero', turn: 'enemy' }),
      ability('any', { phase: 'hero', turn: 'any' }),
      ability('your', { phase: 'hero', turn: 'your' }),
    ]);

    expect(groups[0].abilities.map((a) => a.id)).toEqual(['your', 'any', 'enemy']);
  });

  it('sorts faction-wide sources before warscroll sources', () => {
    const groups = groupByPhase([
      ability('scroll', { phase: 'hero' }, { kind: 'warscroll', unitId: 'u' }),
      ability('faction', { phase: 'hero' }, { kind: 'faction' }),
      ability('formation', { phase: 'hero' }, { kind: 'battle-formation', formationId: 'f' }),
    ]);

    expect(groups[0].abilities.map((a) => a.id)).toEqual(['faction', 'formation', 'scroll']);
  });

  it('falls back to sorting by name', () => {
    const groups = groupByPhase([
      ability('b', { phase: 'hero' }, { kind: 'faction' }, 'Zealous Blow'),
      ability('a', { phase: 'hero' }, { kind: 'faction' }, 'Aura of Dread'),
    ]);

    expect(groups[0].abilities.map((a) => a.name)).toEqual(['Aura of Dread', 'Zealous Blow']);
  });

  it('returns nothing for an empty input', () => {
    expect(groupByPhase([])).toEqual([]);
  });

  it('files an ability under its section override rather than its phase', () => {
    const groups = groupByPhase([
      ability('passive-in-combat', { phase: 'passive', section: 'combat' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBe('combat');
    expect(groups[0].label).toBe('Combat Phase');
  });

  it('sorts a section-overridden ability alongside genuine members of that section', () => {
    const groups = groupByPhase([
      ability('native', { phase: 'combat' }),
      ability('filed', { phase: 'passive', section: 'combat' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].abilities.map((a) => a.id).sort()).toEqual(['filed', 'native']);
  });

  it('leaves no empty heading behind for the overridden phase', () => {
    const groups = groupByPhase([ability('a', { phase: 'passive', section: 'combat' })]);
    expect(groups.map((g) => g.phase)).toEqual(['combat']);
  });

  it('keeps every ability across all phases', () => {
    const phases: Phase[] = ['deployment', 'hero', 'hero', 'combat', 'passive'];
    const abilities = phases.map((phase, i) => ability(`a${i}`, { phase }));
    const total = groupByPhase(abilities).reduce((n, g) => n + g.abilities.length, 0);
    expect(total).toBe(phases.length);
  });
});
