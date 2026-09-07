/**
 * Ability text that may contain bulleted lists and dice roll tables as well as
 * paragraphs.
 *
 * Plenty of cards read as a lead-in sentence followed by a list, e.g. Deathly
 * Invocation's "For each target:" followed by two bullets. Plenty of others
 * resolve on a dice roll, with a row per result. Cramming either into a single
 * string loses the structure, so the JSON accepts:
 *
 *   "effect": "A single paragraph."
 *
 *   "effect": [
 *     "A lead-in paragraph:",
 *     { "list": ["First bullet.", "Second bullet."] },
 *     { "table": [
 *       { "roll": "1-2", "text": "Something bad happens." },
 *       { "roll": "3-6", "text": "Something good happens." }
 *     ] },
 *     "An optional trailing paragraph."
 *   ]
 *
 * A plain string stays valid, so existing data needs no migration.
 */

/** A bulleted (default) or numbered list, as authored in JSON. */
export interface EffectListInput {
  list: string[];
  /** Render as `<ol>` rather than `<ul>`. */
  ordered?: boolean;
}

/** One row of a dice roll table. */
export interface EffectTableRow {
  /** The roll or range that triggers this row, e.g. `1-2`, `6`, `7+`. */
  roll: string;
  text: string;
}

/** A dice roll table, as authored in JSON. */
export interface EffectTableInput {
  table: EffectTableRow[];
}

/** The shape `effect` may take in the JSON data. */
export type EffectInput = string | ReadonlyArray<string | EffectListInput | EffectTableInput>;

/**
 * A single renderable block. Discriminated on `kind` so the template can switch
 * without type guards.
 */
export type EffectBlock =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: readonly string[]; ordered: boolean }
  | { kind: 'table'; rows: readonly EffectTableRow[] };

type BlockInput = string | EffectListInput | EffectTableInput;

function isListInput(block: BlockInput): block is EffectListInput {
  return typeof block !== 'string' && 'list' in block;
}

function isTableInput(block: BlockInput): block is EffectTableInput {
  return typeof block !== 'string' && 'table' in block;
}

/**
 * Flattens the authored form into a uniform list of blocks for rendering.
 *
 * Blank strings and empty rows are dropped so a stray entry in the JSON doesn't
 * render an empty paragraph or table row.
 */
export function normaliseEffect(effect: EffectInput): EffectBlock[] {
  if (typeof effect === 'string') {
    const text = effect.trim();
    return text === '' ? [] : [{ kind: 'text', text }];
  }

  const blocks: EffectBlock[] = [];

  for (const block of effect) {
    if (isListInput(block)) {
      const items = block.list.map((item) => item.trim()).filter((item) => item !== '');
      if (items.length > 0) {
        blocks.push({ kind: 'list', items, ordered: block.ordered ?? false });
      }
      continue;
    }

    if (isTableInput(block)) {
      const rows = block.table
        .map((row) => ({ roll: row.roll?.trim() ?? '', text: row.text?.trim() ?? '' }))
        .filter((row) => row.roll !== '' || row.text !== '');
      if (rows.length > 0) {
        blocks.push({ kind: 'table', rows });
      }
      continue;
    }

    const text = block.trim();
    if (text !== '') {
      blocks.push({ kind: 'text', text });
    }
  }

  return blocks;
}

/**
 * Collapses an effect down to a single string. Useful for plain-text contexts
 * such as search, tooltips or export.
 */
export function effectToPlainText(effect: EffectInput): string {
  return normaliseEffect(effect)
    .map((block) => {
      switch (block.kind) {
        case 'text':
          return block.text;
        case 'list':
          return block.items.join(' ');
        case 'table':
          return block.rows.map((row) => `${row.roll} ${row.text}`).join(' ');
      }
    })
    .join(' ');
}
