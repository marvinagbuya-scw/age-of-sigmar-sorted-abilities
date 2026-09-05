import { effectToPlainText, normaliseEffect } from './effect';

describe('normaliseEffect', () => {
  it('wraps a plain string in a single text block', () => {
    expect(normaliseEffect('Heal (1) that unit.')).toEqual([
      { kind: 'text', text: 'Heal (1) that unit.' },
    ]);
  });

  it('trims surrounding whitespace', () => {
    expect(normaliseEffect('  Heal (1).  ')).toEqual([{ kind: 'text', text: 'Heal (1).' }]);
  });

  it('returns no blocks for an empty string', () => {
    expect(normaliseEffect('')).toEqual([]);
    expect(normaliseEffect('   ')).toEqual([]);
  });

  it('handles a lead-in paragraph followed by a list', () => {
    expect(
      normaliseEffect(['For each target:', { list: ['Heal (3) the target.', 'Return models.'] }]),
    ).toEqual([
      { kind: 'text', text: 'For each target:' },
      { kind: 'list', items: ['Heal (3) the target.', 'Return models.'], ordered: false },
    ]);
  });

  it('defaults lists to unordered', () => {
    const [block] = normaliseEffect([{ list: ['One.'] }]);
    expect(block).toEqual({ kind: 'list', items: ['One.'], ordered: false });
  });

  it('respects an explicitly ordered list', () => {
    const [block] = normaliseEffect([{ list: ['One.'], ordered: true }]);
    expect(block).toEqual({ kind: 'list', items: ['One.'], ordered: true });
  });

  it('supports a trailing paragraph after a list', () => {
    const blocks = normaliseEffect(['Lead in:', { list: ['A.'] }, 'Then this happens.']);
    expect(blocks.map((b) => b.kind)).toEqual(['text', 'list', 'text']);
  });

  it('supports multiple lists in one effect', () => {
    const blocks = normaliseEffect([{ list: ['A.'] }, 'And:', { list: ['B.'] }]);
    expect(blocks.map((b) => b.kind)).toEqual(['list', 'text', 'list']);
  });

  it('drops empty paragraphs and empty list items', () => {
    const blocks = normaliseEffect(['', 'Real text.', { list: ['', 'Kept.', '  '] }]);
    expect(blocks).toEqual([
      { kind: 'text', text: 'Real text.' },
      { kind: 'list', items: ['Kept.'], ordered: false },
    ]);
  });

  it('drops a list whose items are all empty', () => {
    expect(normaliseEffect([{ list: ['', '  '] }])).toEqual([]);
  });
});

describe('effectToPlainText', () => {
  it('passes a plain string through', () => {
    expect(effectToPlainText('Heal (1).')).toBe('Heal (1).');
  });

  it('joins paragraphs and list items into one string', () => {
    expect(effectToPlainText(['For each target:', { list: ['Heal (3).', 'Return models.'] }])).toBe(
      'For each target: Heal (3). Return models.',
    );
  });
});
