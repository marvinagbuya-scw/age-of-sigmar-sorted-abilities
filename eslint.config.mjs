import { defineConfig, globalIgnores } from 'eslint/config';
import jsonc from 'eslint-plugin-jsonc';

/**
 * Key order for the faction data files, following how an ability actually reads
 * rather than the alphabet.
 *
 * `pathPattern: '.'` matches every object except the root (whose JSON path is
 * the empty string), so this single flat list governs abilities, timings,
 * sources, units, lores, formations and effect list blocks alike. Relative order
 * only matters between keys that appear in the *same* object, so the list is
 * arranged such that every object type comes out correctly:
 *
 *   ability      id, name, flavour, sample, keywords, timing, castingValue,
 *                chantingValue, commandValue, declare, effect, usedBy, source
 *   timing       phase, section, band, turn, reaction, frequency
 *   source       kind, formationId | loreId | unitId
 *   unit         id, name, keywords, stats, attacks, abilities
 *   unit stats   health, move, save, control, ward
 *   attack       id, name, abilities, type, characteristics
 *   character.   range, attacks, hit, wound, rend, damage
 *   lore/format. id, name, abilities
 *   effect list  list, ordered
 *   roll table   table, then roll, text per row
 *
 * Keys not listed here are unconstrained, so adding a field won't fail the lint
 * until it's added below.
 */
const NESTED_KEY_ORDER = [
  'id',
  'name',
  'flavour',
  'sample',
  'keywords',
  'timing',
  'phase',
  'section',
  'band',
  'turn',
  'reaction',
  'frequency',
  'castingValue',
  'chantingValue',
  'commandValue',
  'declare',
  'effect',
  'list',
  'ordered',
  'table',
  'roll',
  'text',
  'usedBy',
  'source',
  'kind',
  'formationId',
  'loreId',
  'unitId',
  // Warscroll profile. `stats` and `attacks` precede `abilities` so a unit
  // reads profile-then-rules; the weapon characteristics trail `abilities`
  // because an attack lists its weapon abilities before its numbers.
  'stats',
  'health',
  'move',
  'save',
  'control',
  'ward',
  // Also the Attacks characteristic inside `characteristics`, which is why it
  // sits ahead of hit/wound/rend/damage — with `range` ahead of it, as printed.
  'range',
  'attacks',
  'abilities',
  'type',
  'characteristics',
  'hit',
  'wound',
  'rend',
  'damage',
];

/** Top-level order: identity first, then sections as they appear in the book. */
const ROOT_KEY_ORDER = [
  '_note',
  'id',
  'name',
  'factionAbilities',
  'battleFormations',
  'heroicTraits',
  'artefactsOfPower',
  'spellLores',
  'prayerLores',
  'manifestationLores',
  'generalsHandbook',
  'units',
  // universal.json only
  'core',
  'commands',
];

export default defineConfig([
  globalIgnores(['dist/**', 'storybook-static/**', 'node_modules/**', 'coverage/**']),

  // Faction ability data. These files are hand-authored, so the point of
  // linting them is to keep the shape predictable and diffs small.
  {
    name: 'ability-data/json',
    files: ['public/data/**/*.json'],
    extends: [jsonc.configs['flat/recommended-with-json']],
    rules: {
      // Enforced and auto-fixable via `npm run lint:fix`. Alphabetical sorting
      // was tried first and rejected: it buries `id`/`name` in the middle of an
      // ability and puts `effect` before you know which ability you're reading.
      'jsonc/sort-keys': [
        'error',
        { pathPattern: '^$', order: ROOT_KEY_ORDER },
        { pathPattern: '.', order: NESTED_KEY_ORDER },
      ],

      // These files are strict .json, so comments would break `JSON.parse`.
      // Use the `_note` key for commentary instead.
      'jsonc/no-comments': 'error',
    },
  },
]);
