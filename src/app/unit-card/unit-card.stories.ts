import type { Meta, StoryObj } from '@storybook/angular-vite';

import { UnitCard } from './unit-card';
import type { Unit } from '../core/models';

/** Every story builds on this, so each one states only what differs. */
const base: Unit = {
  id: 'story-unit',
  name: 'Neferata, Mortarch of Blood',
  keywords: ['WARMASTER', 'UNIQUE', 'HERO', 'MONSTER', 'WIZARD (2)', 'FLY', 'WARD (6+)'],
  stats: { health: 14, move: 12, save: 3, control: 5, ward: 6 },
  attacks: [
    {
      id: 'story-akmet-har',
      name: 'Akmet-har, the Dagger of Jet',
      abilities: ['Anti-HERO (+1 Rend)'],
      type: 'melee',
      characteristics: { attacks: 5, hit: '3+', wound: '3+', rend: 2, damage: 1 },
    },
    {
      id: 'story-claws',
      name: "Nagadron's Claws",
      abilities: [],
      type: 'melee',
      characteristics: { attacks: 5, hit: 4, wound: 2, rend: 3, damage: 3 },
    },
  ],
  // Abilities live in their phase sections, not on this card.
  abilities: [],
};

const meta: Meta<UnitCard> = {
  title: 'Unit Card',
  component: UnitCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "A warscroll's stat block: the profile box and the weapon profiles. The unit's " +
          'abilities are deliberately absent — they belong to their phase sections in the ' +
          'list above.',
      },
    },
  },
  // Roughly the width of one column of the in-app two-column unit grid.
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px"><app-unit-card [unit]="unit" /></div>`,
  }),
};

export default meta;
type Story = StoryObj<UnitCard>;

/** The common case: a profile box, a ward, and two melee weapons. */
export const Default: Story = {
  args: { unit: base },
};

/** Ranged weapons get an extra Range column that melee tables leave out. */
export const WithRangedWeapons: Story = {
  args: {
    unit: {
      ...base,
      name: 'Deathrattle Skeleton Archers',
      keywords: ['INFANTRY', 'DEATHRATTLE'],
      stats: { health: 1, move: 5, save: 5, control: 1 },
      attacks: [
        {
          id: 'story-bow',
          name: 'Cursed Bow',
          abilities: ['Crit (Auto-wound)'],
          type: 'ranged',
          characteristics: { range: 18, attacks: 1, hit: 4, wound: 4, damage: 1 },
        },
        {
          id: 'story-blade',
          name: 'Rusted Blade',
          abilities: [],
          type: 'melee',
          characteristics: { attacks: 1, hit: 4, wound: 5, damage: 1 },
        },
      ],
    },
  },
};

/**
 * Characteristics set by an ability, or rolled, are authored as strings and pass
 * through untouched.
 */
export const VariableCharacteristics: Story = {
  args: {
    unit: {
      ...base,
      name: 'Terrorgheist',
      keywords: ['MONSTER', 'FLY'],
      stats: { health: 14, move: '*', save: 5, control: 5 },
      attacks: [
        {
          id: 'story-shriek',
          name: 'Death Shriek',
          abilities: ['Shoot in Combat'],
          type: 'ranged',
          characteristics: { range: 10, attacks: 1, hit: '*', wound: '*', damage: 'D6' },
        },
      ],
    },
  },
};

/**
 * A warscroll whose abilities were transcribed but whose profile hasn't been —
 * a known gap in the data, stated plainly rather than rendered as an empty box.
 */
export const NotYetTranscribed: Story = {
  args: {
    unit: {
      id: 'story-empty',
      name: 'Deadwalker Zombies',
      keywords: ['INFANTRY', 'DEADWALKERS'],
      abilities: [],
    },
  },
};
