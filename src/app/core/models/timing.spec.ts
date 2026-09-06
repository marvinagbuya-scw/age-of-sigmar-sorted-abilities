import { bandForPhase, bandForTiming, sectionForTiming, timingLabel, type Timing } from './timing';

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
    // The whole point of `section`: a passive filed under combat stays black.
    expect(bandForTiming({ phase: 'passive', section: 'combat' })).toBe('deployment');
    expect(bandForTiming({ phase: 'hero', section: 'shooting' })).toBe('hero');
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

  it('omits the prefix when the turn is unspecified', () => {
    expect(timingLabel({ phase: 'charge' })).toBe('Charge Phase');
  });

  it('renders passive abilities as Passive', () => {
    expect(timingLabel({ phase: 'passive' })).toBe('Passive');
  });

  it('still reads Passive when filed under another phase', () => {
    expect(timingLabel({ phase: 'passive', section: 'combat' })).toBe('Passive');
  });

  it('renders a reaction with its trigger text', () => {
    expect(timingLabel({ phase: 'combat', reaction: 'This unit was destroyed' })).toBe(
      'Reaction: This unit was destroyed',
    );
  });
});
