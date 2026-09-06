import {
  PHASES,
  TURNS,
  bandForPhase,
  bandForTiming,
  phaseTakesTurn,
  sectionForTiming,
  timingLabel,
  type Timing,
} from './timing';

describe('bandForPhase', () => {
  it('maps each combat-sequence phase to its own band', () => {
    expect(bandForPhase('hero')).toBe('hero');
    expect(bandForPhase('movement')).toBe('movement');
    expect(bandForPhase('shooting')).toBe('shooting');
    expect(bandForPhase('charge')).toBe('charge');
    expect(bandForPhase('combat')).toBe('combat');
  });

  it('renders passive and start-of-battle-round in deployment black', () => {
    expect(bandForPhase('deployment')).toBe('deployment');
    expect(bandForPhase('passive')).toBe('deployment');
    expect(bandForPhase('start-of-battle-round')).toBe('deployment');
  });

  it('renders both end-of-* phases in the purple end band', () => {
    expect(bandForPhase('end-of-turn')).toBe('end');
    expect(bandForPhase('end-of-battle-round')).toBe('end');
  });
});

describe('bandForTiming', () => {
  it('uses the phase band when there is no reaction', () => {
    expect(bandForTiming({ phase: 'combat' })).toBe('combat');
  });

  it('overrides the phase band with green for a reaction', () => {
    const timing: Timing = { phase: 'combat', reaction: 'You declared a Fight ability' };
    expect(bandForTiming(timing)).toBe('reaction');
  });

  it('overrides even for phases that share a band', () => {
    expect(bandForTiming({ phase: 'end-of-turn', reaction: 'A unit was destroyed' })).toBe(
      'reaction',
    );
  });

  it('ignores section, so filing a card elsewhere does not recolour it', () => {
    // `section` alone must not change the colour; `band` is the opt-in for that.
    expect(bandForTiming({ phase: 'passive', section: 'combat' })).toBe('deployment');
    expect(bandForTiming({ phase: 'hero', section: 'shooting' })).toBe('hero');
  });

  it('uses an explicit band override over the phase', () => {
    // The headline use case: a passive filed under shooting, coloured teal so it
    // matches the section it sits in rather than standing out in black.
    expect(bandForTiming({ phase: 'passive', section: 'shooting', band: 'shooting' })).toBe(
      'shooting',
    );
  });

  it('lets an explicit band beat the reaction rule', () => {
    expect(bandForTiming({ phase: 'combat', reaction: 'Something happened', band: 'combat' })).toBe(
      'combat',
    );
  });

  it('still falls back to the phase when no band is set', () => {
    expect(bandForTiming({ phase: 'shooting' })).toBe('shooting');
  });
});

describe('sectionForTiming', () => {
  it('falls back to the phase when no section is set', () => {
    expect(sectionForTiming({ phase: 'combat' })).toBe('combat');
  });

  it('uses the section override when present', () => {
    expect(sectionForTiming({ phase: 'passive', section: 'combat' })).toBe('combat');
  });
});

describe('timingLabel', () => {
  it('prefixes the phase with whose turn it is', () => {
    expect(timingLabel({ phase: 'hero', turn: 'your' })).toBe('Your Hero Phase');
    expect(timingLabel({ phase: 'hero', turn: 'enemy' })).toBe('Enemy Hero Phase');
    expect(timingLabel({ phase: 'hero', turn: 'any' })).toBe('Any Hero Phase');
  });

  it('prefixes every in-turn phase the same way', () => {
    expect(timingLabel({ phase: 'movement', turn: 'any' })).toBe('Any Movement Phase');
    expect(timingLabel({ phase: 'shooting', turn: 'enemy' })).toBe('Enemy Shooting Phase');
    expect(timingLabel({ phase: 'charge', turn: 'your' })).toBe('Your Charge Phase');
    expect(timingLabel({ phase: 'combat', turn: 'any' })).toBe('Any Combat Phase');
  });

  it('puts the qualifier inside the phrase for end of turn, not in front of it', () => {
    // "Any End of Turn" would be wrong — the qualifier describes the turn.
    expect(timingLabel({ phase: 'end-of-turn', turn: 'any' })).toBe('End of Any Turn');
    expect(timingLabel({ phase: 'end-of-turn', turn: 'your' })).toBe('End of Your Turn');
    expect(timingLabel({ phase: 'end-of-turn', turn: 'enemy' })).toBe('End of Enemy Turn');
  });

  it('omits the prefix when the turn is unspecified', () => {
    expect(timingLabel({ phase: 'charge' })).toBe('Charge Phase');
    expect(timingLabel({ phase: 'end-of-turn' })).toBe('End of Turn');
  });

  it('ignores turn for phases that no player owns', () => {
    // A battle round belongs to neither side, and deployment has no turn.
    expect(timingLabel({ phase: 'end-of-battle-round', turn: 'any' })).toBe('End of Battle Round');
    expect(timingLabel({ phase: 'start-of-battle-round', turn: 'your' })).toBe(
      'Start of Battle Round',
    );
    expect(timingLabel({ phase: 'deployment', turn: 'any' })).toBe('Deployment');
  });

  it('renders passive abilities as Passive', () => {
    expect(timingLabel({ phase: 'passive' })).toBe('Passive');
    expect(timingLabel({ phase: 'passive', turn: 'any' })).toBe('Passive');
  });

  it('still reads Passive when filed under another phase', () => {
    expect(timingLabel({ phase: 'passive', section: 'combat' })).toBe('Passive');
  });

  it('still reads Passive when recoloured by a band override', () => {
    expect(timingLabel({ phase: 'passive', section: 'shooting', band: 'shooting' })).toBe(
      'Passive',
    );
  });

  it('renders a reaction with its trigger text', () => {
    expect(timingLabel({ phase: 'combat', reaction: 'This unit was destroyed' })).toBe(
      'Reaction: This unit was destroyed',
    );
  });

  it('leaves no unreplaced placeholder or stray spacing for any combination', () => {
    for (const phase of PHASES) {
      for (const turn of [undefined, ...TURNS] as const) {
        const label = timingLabel({ phase, turn });
        expect(label).not.toContain('{turn}');
        expect(label).not.toMatch(/\s{2,}/);
        expect(label.trim()).toBe(label);
      }
    }
  });
});

describe('phaseTakesTurn', () => {
  it('is true for the phases a player takes', () => {
    expect(phaseTakesTurn('hero')).toBe(true);
    expect(phaseTakesTurn('combat')).toBe(true);
    expect(phaseTakesTurn('end-of-turn')).toBe(true);
  });

  it('is false for phases no player owns', () => {
    expect(phaseTakesTurn('deployment')).toBe(false);
    expect(phaseTakesTurn('start-of-battle-round')).toBe(false);
    expect(phaseTakesTurn('end-of-battle-round')).toBe(false);
    expect(phaseTakesTurn('passive')).toBe(false);
  });
});
