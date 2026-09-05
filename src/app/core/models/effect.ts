/**
 * Ability text that may contain bulleted lists as well as paragraphs.
 *
 * Plenty of cards read as a lead-in sentence followed by a list, e.g. Deathly
 * Invocation's "For each target:" followed by two bullets. Cramming that into a
 * single string loses the structure, so the JSON accepts either:
 *
 *   "effect": "A single paragraph."
 *
 *   "effect": [
 *     "A lead-in paragraph:",
 *     { "list": ["First bullet.", "Second bullet."] },
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

/** The shape `effect` may take in the JSON data. */
export type EffectInput = string | ReadonlyArray<string | EffectListInput>;

/**
 * A single renderable block. Discriminated on `kind` so the template can switch
 * without type guards.
 */
export type EffectBlock =
  { kind: 'text'; text: string } | { kind: 'list'; items: readonly string[]; ordered: boolean };

function isListInput(block: string | EffectListInput): block is EffectListInput {
  return typeof block !== 'string';
}

/**
 * Flattens the authored form into a uniform list of blocks for rendering.
 *
 * Blank strings are dropped so a stray empty entry in the JSON doesn't render
 * an empty paragraph.
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
    .map((block) => (block.kind === 'text' ? block.text : block.items.join(' ')))
    .join(' ');
}
