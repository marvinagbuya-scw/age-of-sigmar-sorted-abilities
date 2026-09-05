import { defineConfig, globalIgnores } from 'eslint/config';
import jsonc from 'eslint-plugin-jsonc';

export default defineConfig([
  globalIgnores(['dist/**', 'storybook-static/**', 'node_modules/**', 'coverage/**']),

  // Faction ability data. These files are hand-authored, so the point of
  // linting them is to keep the shape predictable and diffs small.
  {
    name: 'ability-data/json',
    files: ['public/data/**/*.json'],
    extends: [jsonc.configs['flat/recommended-with-json']],
    rules: {
      /**
       * Keys sorted alphabetically, enforced and auto-fixable via
       * `npm run lint:fix`.
       *
       * Trade-off worth knowing: alphabetical splits up keys that read together
       * on the physical card, so an ability ends up ordered
       * `castingValue, declare, effect, id, keywords, name, sample, source,
       * timing, usedBy`.
       *
       * To order by the card's own reading order instead, swap the rule below
       * for:
       *
       *   'jsonc/sort-keys': [
       *     'error',
       *     {
       *       pathPattern: '^$',
       *       order: ['_note', 'id', 'name', 'factionAbilities', 'battleFormations',
       *               'heroicTraits', 'artefactsOfPower', 'spellLores',
       *               'manifestationLores', 'units'],
       *     },
       *     {
       *       pathPattern: '.*',
       *       order: ['id', 'name', 'keywords', 'timing', 'phase', 'turn', 'reaction',
       *               'frequency', 'castingValue', 'chantingValue', 'declare', 'effect',
       *               'list', 'ordered', 'usedBy', 'source', 'kind', 'unitId',
       *               'formationId', 'loreId', 'abilities', 'sample'],
       *     },
       *   ],
       *
       * Both are equally enforceable; only the resulting reading order differs.
       */
      'jsonc/sort-keys': [
        'error',
        'asc',
        {
          caseSensitive: false,
          natural: true,
          // A single-key object has nothing to sort.
          minKeys: 2,
        },
      ],

      // These files are strict .json, so comments would break `JSON.parse`.
      // Use the `_note` key for commentary instead.
      'jsonc/no-comments': 'error',
    },
  },
]);
