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

  it('handles a lead-in paragraph followed by a roll table', () => {
    expect(
      normaliseEffect([
        'Roll a dice:',
        {
          table: [
            { roll: '1-2', text: 'Bad thing.' },
            { roll: '3-6', text: 'Good thing.' },
          ],
        },
      ]),
    ).toEqual([
      { kind: 'text', text: 'Roll a dice:' },
      {
        kind: 'table',
        rows: [
          { roll: '1-2', text: 'Bad thing.' },
          { roll: '3-6', text: 'Good thing.' },
        ],
      },
    ]);
  });

  it('trims roll and text in table rows', () => {
    const [block] = normaliseEffect([{ table: [{ roll: ' 6 ', text: '  Something.  ' }] }]);
    expect(block).toEqual({ kind: 'table', rows: [{ roll: '6', text: 'Something.' }] });
  });

  it('drops table rows that are entirely empty', () => {
    const [block] = normaliseEffect([
      {
        table: [
          { roll: '', text: '' },
          { roll: '1', text: 'Kept.' },
        ],
      },
    ]);
    expect(block).toEqual({ kind: 'table', rows: [{ roll: '1', text: 'Kept.' }] });
  });

  it('drops a table with no usable rows', () => {
    expect(normaliseEffect([{ table: [{ roll: '  ', text: '' }] }])).toEqual([]);
  });

  it('supports a table between two paragraphs', () => {
    const blocks = normaliseEffect([
      'Lead in:',
      { table: [{ roll: '1', text: 'A.' }] },
      'And then this.',
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(['text', 'table', 'text']);
  });

  it('supports lists and tables in the same effect', () => {
    const blocks = normaliseEffect([{ list: ['A.'] }, { table: [{ roll: '1', text: 'B.' }] }]);
    expect(blocks.map((b) => b.kind)).toEqual(['list', 'table']);
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

  it('flattens table rows into roll and outcome pairs', () => {
    expect(
      effectToPlainText([
        'Roll a dice:',
        {
          table: [
            { roll: '1', text: 'Bad.' },
            { roll: '6', text: 'Good.' },
          ],
        },
      ]),
    ).toBe('Roll a dice: 1 Bad. 6 Good.');
  });
});
