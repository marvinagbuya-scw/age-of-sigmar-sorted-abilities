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

  it("sorts General's Handbook abilities after faction rules but before warscrolls", () => {
    const groups = groupByPhase([
      ability('scroll', { phase: 'hero' }, { kind: 'warscroll', unitId: 'u' }),
      ability('handbook', { phase: 'hero' }, { kind: 'generals-handbook' }),
      ability('faction', { phase: 'hero' }, { kind: 'faction' }),
    ]);

    expect(groups[0].abilities.map((a) => a.id)).toEqual(['faction', 'handbook', 'scroll']);
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
});

describe('groupByPhase universal split', () => {
  it('separates universal core and command abilities from the army own', () => {
    const groups = groupByPhase([
      ability('core-move', { phase: 'movement' }, { kind: 'core' }),
      ability('faction-move', { phase: 'movement' }, { kind: 'faction' }),
      ability('rally', { phase: 'movement' }, { kind: 'command' }),
      ability('scroll', { phase: 'movement' }, { kind: 'warscroll', unitId: 'u' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].abilities.map((a) => a.id)).toEqual(['faction-move', 'scroll']);
    // Commands come from universal.json too, so they sit with core.
    expect(groups[0].coreAbilities.map((a) => a.id)).toEqual(['rally', 'core-move']);
  });

  it('counts both lists in the phase total', () => {
    const groups = groupByPhase([
      ability('faction-a', { phase: 'hero' }, { kind: 'faction' }),
      ability('core-a', { phase: 'hero' }, { kind: 'core' }),
      ability('core-b', { phase: 'hero' }, { kind: 'core' }),
    ]);

    expect(groups[0].total).toBe(3);
    expect(groups[0].abilities).toHaveLength(1);
    expect(groups[0].coreAbilities).toHaveLength(2);
  });

  it('leaves coreAbilities empty when there are none', () => {
    const groups = groupByPhase([ability('a', { phase: 'hero' }, { kind: 'faction' })]);
    expect(groups[0].coreAbilities).toEqual([]);
  });

  it('still creates a phase section when only core abilities fall in it', () => {
    // Turning core abilities on can introduce a phase the army has nothing in.
    const groups = groupByPhase([ability('core-shoot', { phase: 'shooting' }, { kind: 'core' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBe('shooting');
    expect(groups[0].abilities).toEqual([]);
    expect(groups[0].coreAbilities.map((a) => a.id)).toEqual(['core-shoot']);
  });

  it('sorts within each list independently', () => {
    const groups = groupByPhase([
      ability('core-enemy', { phase: 'hero', turn: 'enemy' }, { kind: 'core' }),
      ability('core-your', { phase: 'hero', turn: 'your' }, { kind: 'core' }),
      ability('own-enemy', { phase: 'hero', turn: 'enemy' }, { kind: 'faction' }),
      ability('own-your', { phase: 'hero', turn: 'your' }, { kind: 'faction' }),
    ]);

    expect(groups[0].abilities.map((a) => a.id)).toEqual(['own-your', 'own-enemy']);
    expect(groups[0].coreAbilities.map((a) => a.id)).toEqual(['core-your', 'core-enemy']);
  });

  it('keeps every ability across all phases', () => {
    const phases: Phase[] = ['deployment', 'hero', 'hero', 'combat', 'passive'];
    const abilities = phases.map((phase, i) => ability(`a${i}`, { phase }));
    const counted = groupByPhase(abilities).reduce((n, g) => n + g.total, 0);
    expect(counted).toBe(phases.length);
  });
});
