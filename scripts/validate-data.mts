/**
 * Validates the faction JSON files in `public/data`.
 *
 * Run with `npm run validate:data`. Executed directly by Node (which strips the
 * type annotations), which lets it import the canonical enums from the app's
 * domain model instead of duplicating them — so the two can never drift.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SOURCE_KINDS } from '../src/app/core/models/ability.ts';
import {
  BANDS,
  FREQUENCIES,
  PHASES,
  TURNS,
  bandForPhase,
  type Phase,
} from '../src/app/core/models/timing.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA_DIR = join(ROOT, 'public', 'data');

const problems: string[] = [];
const warnings: string[] = [];

let currentFile = '';

function fail(path: string, message: string): void {
  problems.push(`${currentFile} ${path}: ${message}`);
}

function warn(path: string, message: string): void {
  warnings.push(`${currentFile} ${path}: ${message}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  const value = obj[key];
  if (typeof value !== 'string' || value.trim() === '') {
    fail(path, `"${key}" must be a non-empty string`);
    return undefined;
  }
  return value;
}

/** Ability ids seen so far, mapped to where they were first declared. */
const seenAbilityIds = new Map<string, string>();

/**
 * Phrases that only ever appeared in the seeded sample data. If one survives
 * into an ability that is no longer flagged `sample`, the real rules text almost
 * certainly hasn't been pasted in yet — easy to miss when repurposing a sample
 * card as a real one.
 */
const FILLER_PHRASES = [
  'deliberately verbose',
  'do not clip their container',
  'stress the layout',
  'exercise the card layout',
  'header colour is driven entirely by the timing',
  'Something happened',
];

function checkForFiller(text: string, path: string, isSample: boolean): void {
  if (isSample) {
    return;
  }
  for (const phrase of FILLER_PHRASES) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      warn(path, `contains leftover sample text ("${phrase}") but is not flagged "sample": true`);
      return;
    }
  }
}

interface ExpectedSource {
  /** The source kind this section must declare. */
  kind: string;
  /** The key holding the back-reference, e.g. `unitId`. */
  refKey?: string;
  /** The value that back-reference must hold. */
  refValue?: string;
}

/**
 * Validates `effect`, which may be a plain string or an array mixing paragraph
 * strings and `{ "list": [...] }` blocks.
 */
function validateEffect(value: unknown, path: string): void {
  if (typeof value === 'string') {
    if (value.trim() === '') {
      fail(path, '"effect" must not be empty');
    }
    return;
  }

  if (!Array.isArray(value)) {
    fail(path, '"effect" must be a string, or an array of strings and { "list": [...] } blocks');
    return;
  }

  if (value.length === 0) {
    fail(path, '"effect" must not be an empty array');
    return;
  }

  let renderable = 0;

  value.forEach((block, i) => {
    const blockPath = `${path}.effect[${i}]`;

    if (typeof block === 'string') {
      if (block.trim() === '') {
        warn(blockPath, 'empty paragraph will be dropped when rendering');
      } else {
        renderable++;
      }
      return;
    }

    if (!isPlainObject(block)) {
      fail(blockPath, 'must be a string or a { "list": [...] } object');
      return;
    }

    const unknownKeys = Object.keys(block).filter((k) => k !== 'list' && k !== 'ordered');
    if (unknownKeys.length > 0) {
      fail(blockPath, `unexpected key(s): ${unknownKeys.join(', ')}`);
    }

    const list = block['list'];
    if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) {
      fail(blockPath, '"list" must be an array of strings');
      return;
    }

    const items = (list as string[]).filter((item) => item.trim() !== '');
    if (items.length === 0) {
      fail(blockPath, '"list" must contain at least one non-empty item');
    } else {
      renderable++;
    }

    if (block['ordered'] !== undefined && typeof block['ordered'] !== 'boolean') {
      fail(blockPath, '"ordered" must be a boolean');
    }
  });

  if (renderable === 0) {
    fail(path, '"effect" has no renderable content');
  }
}

function validateAbility(raw: unknown, path: string, expected: ExpectedSource): void {
  if (!isPlainObject(raw)) {
    fail(path, 'ability must be an object');
    return;
  }

  const id = requireString(raw, 'id', path);
  requireString(raw, 'name', path);

  if (raw['effect'] === undefined) {
    fail(path, '"effect" is required');
  } else {
    validateEffect(raw['effect'], path);
  }

  // Catch sample text that survived into an ability now presented as real.
  const isSample = raw['sample'] === true;
  const prose = [raw['declare'], raw['effect'], raw['usedBy']]
    .flatMap((value) => {
      if (typeof value === 'string') return [value];
      if (!Array.isArray(value)) return [];
      return value.flatMap((block) => {
        if (typeof block === 'string') return [block];
        if (isPlainObject(block) && Array.isArray(block['list'])) {
          return (block['list'] as unknown[]).filter((i): i is string => typeof i === 'string');
        }
        return [];
      });
    })
    .join(' ');
  if (prose !== '') {
    checkForFiller(prose, path, isSample);
  }

  if (id) {
    const previous = seenAbilityIds.get(id);
    if (previous) {
      fail(path, `duplicate ability id "${id}" (already declared at ${previous})`);
    } else {
      seenAbilityIds.set(id, path);
    }
  }

  // --- timing -------------------------------------------------------------
  const timing = raw['timing'];
  if (!isPlainObject(timing)) {
    fail(path, '"timing" must be an object');
  } else {
    const phase = timing['phase'];
    if (typeof phase !== 'string' || !(PHASES as readonly string[]).includes(phase)) {
      fail(path, `timing.phase "${String(phase)}" is not one of: ${PHASES.join(', ')}`);
    }

    const turn = timing['turn'];
    if (turn !== undefined && !(TURNS as readonly string[]).includes(turn as string)) {
      fail(path, `timing.turn "${String(turn)}" is not one of: ${TURNS.join(', ')}`);
    }

    const section = timing['section'];
    if (section !== undefined) {
      if (typeof section !== 'string' || !(PHASES as readonly string[]).includes(section)) {
        fail(path, `timing.section "${String(section)}" is not one of: ${PHASES.join(', ')}`);
      } else if (section === phase) {
        warn(path, 'timing.section is the same as timing.phase, so it has no effect');
      }
    }

    const band = timing['band'];
    if (band !== undefined) {
      if (typeof band !== 'string' || !(BANDS as readonly string[]).includes(band)) {
        fail(path, `timing.band "${String(band)}" is not one of: ${BANDS.join(', ')}`);
      } else if (
        typeof phase === 'string' &&
        (PHASES as readonly string[]).includes(phase) &&
        timing['reaction'] === undefined &&
        band === bandForPhase(phase as Phase)
      ) {
        warn(
          path,
          `timing.band "${band}" is what timing.phase already produces, so it has no effect`,
        );
      }
    }

    const frequency = timing['frequency'];
    if (
      frequency !== undefined &&
      !(FREQUENCIES as readonly string[]).includes(frequency as string)
    ) {
      fail(
        path,
        `timing.frequency "${String(frequency)}" is not one of: ${FREQUENCIES.join(', ')}`,
      );
    }

    const reaction = timing['reaction'];
    if (reaction !== undefined && (typeof reaction !== 'string' || reaction.trim() === '')) {
      fail(path, 'timing.reaction must be a non-empty string when present');
    }

    if (phase === 'passive' && raw['declare'] !== undefined) {
      warn(path, 'passive abilities have no declaration step, but "declare" is set');
    }
    if (phase === 'passive' && reaction !== undefined) {
      fail(path, 'an ability cannot be both passive and a reaction');
    }
  }

  // --- keywords -----------------------------------------------------------
  const keywords = raw['keywords'];
  if (!Array.isArray(keywords) || keywords.some((k) => typeof k !== 'string')) {
    fail(path, '"keywords" must be an array of strings (use [] if there are none)');
  }

  // --- casting / chanting -------------------------------------------------
  const keywordList = Array.isArray(keywords) ? (keywords as string[]) : [];
  const castingValue = raw['castingValue'];
  const chantingValue = raw['chantingValue'];

  if (castingValue !== undefined && typeof castingValue !== 'number') {
    fail(path, '"castingValue" must be a number');
  }
  if (chantingValue !== undefined && typeof chantingValue !== 'number') {
    fail(path, '"chantingValue" must be a number');
  }
  if (castingValue !== undefined && !keywordList.includes('Spell')) {
    warn(path, 'has a castingValue but no "Spell" keyword');
  }
  if (chantingValue !== undefined && !keywordList.includes('Prayer')) {
    warn(path, 'has a chantingValue but no "Prayer" keyword');
  }

  // --- source -------------------------------------------------------------
  const source = raw['source'];
  if (!isPlainObject(source)) {
    fail(path, '"source" must be an object');
    return;
  }

  const kind = source['kind'];
  if (typeof kind !== 'string' || !(SOURCE_KINDS as readonly string[]).includes(kind)) {
    fail(path, `source.kind "${String(kind)}" is not one of: ${SOURCE_KINDS.join(', ')}`);
    return;
  }

  if (kind !== expected.kind) {
    fail(path, `source.kind should be "${expected.kind}" in this section, found "${kind}"`);
  }

  if (expected.refKey) {
    const actual = source[expected.refKey];
    if (actual !== expected.refValue) {
      fail(
        path,
        `source.${expected.refKey} should be "${expected.refValue}", found "${String(actual)}"`,
      );
    }
  }
}

function validateAbilityList(raw: unknown, path: string, expected: ExpectedSource): void {
  if (raw === undefined) {
    fail(path, 'section is missing (use [] if there is no data yet)');
    return;
  }
  if (!Array.isArray(raw)) {
    fail(path, 'section must be an array');
    return;
  }
  raw.forEach((ability, i) => validateAbility(ability, `${path}[${i}]`, expected));
}

/** Validates a section of named groups that each own a list of abilities. */
function validateGroups(
  raw: unknown,
  path: string,
  kind: string,
  refKey: string,
  seenIds: Set<string>,
): void {
  if (raw === undefined) {
    fail(path, 'section is missing (use [] if there is no data yet)');
    return;
  }
  if (!Array.isArray(raw)) {
    fail(path, 'section must be an array');
    return;
  }

  raw.forEach((group, i) => {
    const groupPath = `${path}[${i}]`;
    if (!isPlainObject(group)) {
      fail(groupPath, 'must be an object');
      return;
    }

    const id = requireString(group, 'id', groupPath);
    requireString(group, 'name', groupPath);

    if (id) {
      if (seenIds.has(id)) {
        fail(groupPath, `duplicate id "${id}"`);
      }
      seenIds.add(id);
    }

    validateAbilityList(group['abilities'], `${groupPath}.abilities`, {
      kind,
      refKey,
      refValue: id,
    });
  });
}

function validateFaction(raw: unknown): void {
  if (!isPlainObject(raw)) {
    fail('$', 'file must contain a JSON object');
    return;
  }

  requireString(raw, 'id', '$');
  requireString(raw, 'name', '$');

  validateAbilityList(raw['factionAbilities'], '$.factionAbilities', { kind: 'faction' });
  validateAbilityList(raw['heroicTraits'], '$.heroicTraits', { kind: 'heroic-trait' });
  validateAbilityList(raw['artefactsOfPower'], '$.artefactsOfPower', { kind: 'artefact-of-power' });

  validateGroups(
    raw['battleFormations'],
    '$.battleFormations',
    'battle-formation',
    'formationId',
    new Set(),
  );
  validateGroups(raw['spellLores'], '$.spellLores', 'spell-lore', 'loreId', new Set());
  validateGroups(
    raw['manifestationLores'],
    '$.manifestationLores',
    'manifestation-lore',
    'loreId',
    new Set(),
  );

  // --- units --------------------------------------------------------------
  const units = raw['units'];
  if (units === undefined) {
    fail('$.units', 'section is missing (use [] if there is no data yet)');
  } else if (!Array.isArray(units)) {
    fail('$.units', 'section must be an array');
  } else {
    const seenUnitIds = new Set<string>();
    units.forEach((unit, i) => {
      const unitPath = `$.units[${i}]`;
      if (!isPlainObject(unit)) {
        fail(unitPath, 'must be an object');
        return;
      }

      const id = requireString(unit, 'id', unitPath);
      requireString(unit, 'name', unitPath);

      if (id) {
        if (seenUnitIds.has(id)) {
          fail(unitPath, `duplicate unit id "${id}"`);
        }
        seenUnitIds.add(id);
      }

      const keywords = unit['keywords'];
      if (!Array.isArray(keywords) || keywords.some((k) => typeof k !== 'string')) {
        fail(unitPath, '"keywords" must be an array of strings');
      }

      validateAbilityList(unit['abilities'], `${unitPath}.abilities`, {
        kind: 'warscroll',
        refKey: 'unitId',
        refValue: id,
      });
    });
  }
}

// ---------------------------------------------------------------------------

const entries = await readdir(DATA_DIR).catch(() => {
  console.error(`No data directory at ${DATA_DIR}`);
  process.exit(1);
});

const files = entries.filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error(`No .json files found in ${relative(ROOT, DATA_DIR)}`);
  process.exit(1);
}

let sampleCount = 0;
let abilityCount = 0;

for (const file of files) {
  currentFile = file;
  const text = await readFile(join(DATA_DIR, file), 'utf8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    problems.push(`${file}: invalid JSON — ${(error as Error).message}`);
    continue;
  }

  seenAbilityIds.clear();
  validateFaction(parsed);

  abilityCount += seenAbilityIds.size;
  sampleCount += (text.match(/"sample"\s*:\s*true/g) ?? []).length;
}

for (const warning of warnings) {
  console.warn(`warn  ${warning}`);
}

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`error ${problem}`);
  }
  console.error(`\n${problems.length} problem(s) found in ${files.length} file(s).`);
  process.exit(1);
}

console.log(
  `OK — ${abilityCount} abilities across ${files.length} file(s)` +
    `${warnings.length > 0 ? `, ${warnings.length} warning(s)` : ''}.`,
);

if (sampleCount > 0) {
  console.log(
    `Note: ${sampleCount} ability/abilities are still flagged "sample": true and ` +
      `are not verified against the published rules.`,
  );
}
