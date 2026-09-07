import type { Meta, StoryObj } from '@storybook/angular-vite';

import { AbilityCard } from './ability-card';
import type { Ability } from '../core/models';

/**
 * Every story builds on this base so each one only has to state what makes it
 * different.
 */
const base: Ability = {
  id: 'story-ability',
  name: 'Supernatural Strength',
  timing: { phase: 'combat', turn: 'any' },
  declare: 'Pick a friendly SUMMONABLE unit wholly within 12" of this unit.',
  effect:
    "Add 1 to the Attacks characteristic of that unit's melee weapons until the end of the phase.",
  keywords: ['Once Per Turn'],
  source: { kind: 'warscroll', unitId: 'story-unit' },
};

const meta: Meta<AbilityCard> = {
  title: 'Ability Card',
  component: AbilityCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A single Age of Sigmar 4th edition ability card. The coloured band is derived ' +
          'from the timing: normally from the phase, but a reaction always overrides it ' +
          'with green.',
      },
    },
  },
  // Constrain the width so cards render at roughly their in-app size rather
  // than stretching across the whole canvas.
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 320px"><app-ability-card [ability]="ability" /></div>`,
  }),
};

export default meta;
type Story = StoryObj<AbilityCard>;

/** The common case: a phase-timed ability with a declare step and keywords. */
export const Default: Story = {
  args: { ability: base },
};

/**
 * Passive abilities have no declaration step, so the `Declare:` block is
 * omitted entirely. They use the black deployment band.
 */
export const Passive: Story = {
  args: {
    ability: {
      ...base,
      name: 'Deathless Minions',
      timing: { phase: 'passive' },
      declare: undefined,
      effect:
        'This unit has WARD (6+) while it is wholly within 12" of any friendly SOULBLIGHT GRAVELORDS HERO.',
      keywords: ['Core', 'Ward'],
      usedBy: 'Friendly SOULBLIGHT GRAVELORDS units',
      source: { kind: 'faction' },
    },
  },
};

/** A spell shows its casting value in a circle tinted with the band colour. */
export const SpellWithCastingValue: Story = {
  args: {
    ability: {
      ...base,
      name: 'Amaranthine Orb',
      timing: { phase: 'hero', turn: 'any' },
      castingValue: 7,
      declare: 'Pick a visible enemy unit within 18" of this WIZARD.',
      effect:
        'Roll a dice for each model in that unit that is within range. For each 5+, inflict 1 mortal damage on that unit.',
      keywords: ['Spell', 'Damage'],
      source: { kind: 'spell-lore', loreId: 'story-lore' },
    },
  },
};

/** A prayer, showing the chanting value in the same slot as a casting value. */
export const PrayerWithChantingValue: Story = {
  args: {
    ability: {
      ...base,
      name: 'Bless the Fallen',
      timing: { phase: 'hero', turn: 'your' },
      chantingValue: 4,
      declare: 'Pick a friendly unit wholly within 12" of this PRIEST.',
      effect: 'Heal (2) that unit.',
      keywords: ['Prayer', 'Heal'],
      source: { kind: 'warscroll', unitId: 'story-unit' },
    },
  },
};

/**
 * The band colour is green even though the ability happens in the combat phase.
 * The list still files this card under Combat Phase.
 */
export const Reaction: Story = {
  args: {
    ability: {
      ...base,
      name: 'The Hunger',
      timing: {
        phase: 'combat',
        reaction: 'You declared a Fight ability for this unit and it destroyed any enemy models',
      },
      declare: 'Pick a friendly SOULBLIGHT GRAVELORDS unit that has fought this phase.',
      effect: 'Heal (1) that unit.',
      keywords: ['Core', 'Heal'],
      source: { kind: 'faction' },
    },
  },
};

/** A frequency renders as a small uppercase line above the timing. */
export const OncePerBattle: Story = {
  args: {
    ability: {
      ...base,
      name: 'Ring of Domination',
      timing: { phase: 'hero', turn: 'your', frequency: 'once-per-battle' },
      declare: 'Pick a visible enemy unit within 12" of the bearer.',
      effect: 'Until the start of your next turn, that unit cannot use commands.',
      keywords: ['Artefact of Power', 'Once Per Battle'],
      source: { kind: 'artefact-of-power' },
    },
  },
};

/**
 * An effect authored as a lead-in paragraph plus a bulleted list, which is how
 * a lot of cards actually read.
 */
export const EffectWithList: Story = {
  args: {
    ability: {
      ...base,
      name: 'Deathly Invocation',
      timing: { phase: 'hero', turn: 'any', frequency: 'once-per-turn-army' },
      declare:
        'Pick a friendly SOULBLIGHT GRAVELORDS HERO to use this ability, then pick up to 3 friendly DEATHRATTLE or DEADWALKERS units wholly within 12" of that HERO to be the targets.',
      effect: [
        'For each target:',
        {
          list: [
            'If the target is damaged, Heal (3) the target.',
            'If the target is not damaged, return a number of slain models to it with a combined Health characteristic of up to 3.',
          ],
        },
      ],
      keywords: [],
      source: { kind: 'faction' },
    },
  },
};

/**
 * A list can sit between two paragraphs, and can be numbered when the order
 * matters.
 */
export const EffectWithOrderedList: Story = {
  args: {
    ability: {
      ...base,
      name: 'Sequenced Effect',
      timing: { phase: 'combat', turn: 'your' },
      declare: 'Pick a friendly unit to be the target.',
      effect: [
        'Resolve the following in order:',
        {
          ordered: true,
          list: [
            "Roll a dice and add the target's Health characteristic.",
            'On a 7+, heal (D3) the target.',
            'Otherwise, inflict 1 mortal damage on the target.',
          ],
        },
        'The target cannot be picked for this ability again this turn.',
      ],
      keywords: ['Once Per Turn'],
    },
  },
};

/**
 * A genuinely passive ability filed under the Combat Phase section so it's to
 * hand when it matters. The card keeps the black passive band and the "Passive"
 * label — `section` only affects which heading it prints under, which is why the
 * colour and the label can never contradict each other.
 */
export const PassiveFiledUnderCombat: Story = {
  args: {
    ability: {
      ...base,
      name: 'Dragged Down and Torn Apart',
      timing: { phase: 'passive', section: 'combat' },
      declare: undefined,
      effect: "Add 1 to hit rolls for this unit's attacks if it has 10 or more models.",
      keywords: [],
    },
  },
};

/**
 * The same idea, but recoloured to match the section it's filed under. `band`
 * forces the teal shooting colour while the label stays "Passive", so on a
 * phase-sorted sheet the card blends into its section instead of standing out in
 * black. Compare with `PassiveFiledUnderCombat`.
 */
export const PassiveColouredBySection: Story = {
  args: {
    ability: {
      ...base,
      name: 'Vigour Mortis',
      timing: { phase: 'passive', section: 'shooting', band: 'shooting' },
      declare: undefined,
      effect:
        'Subtract 1 from hit rolls for attacks that target this unit if it has 10 or more models.',
      keywords: [],
    },
  },
};

/**
 * A command ability shows its command point cost in the badge. It uses a
 * rounded square rather than a circle, because a cost isn't a roll target and
 * shouldn't be misread as a casting value.
 */
export const CommandAbility: Story = {
  args: {
    ability: {
      ...base,
      name: "Vanhel's Danse Macabre",
      timing: { phase: 'combat', turn: 'your', frequency: 'once-per-turn-army' },
      commandValue: 1,
      declare:
        'Pick a friendly DEATHRATTLE or DEADWALKERS unit wholly within 12" of this unit to be the target.',
      effect:
        'The target can use 2 FIGHT abilities this phase. After the first is used, the target has STRIKE-LAST for the rest of the turn.',
      keywords: ['Command'],
      usedBy: 'Necromancer',
    },
  },
};

/**
 * The italic flavour line under the name. Purely descriptive — it carries no
 * rules meaning, so it's styled to recede behind the Declare and Effect text.
 */
export const WithFlavourText: Story = {
  args: {
    ability: {
      ...base,
      name: 'The Lurking Vermintide',
      flavour: 'What scurries beneath the surface?',
      timing: { phase: 'deployment' },
      declare: 'Pick a friendly SKAVEN unit that has not been deployed.',
      effect: 'Set up that unit in reserve in the tunnels below. It has now been deployed.',
      keywords: ['Deploy'],
      source: { kind: 'faction' },
    },
  },
};

/**
 * A dice roll table. The roll column is tabular and boxed so you can scan down
 * it to find your result mid-game, rather than reading prose.
 */
export const EffectWithRollTable: Story = {
  args: {
    ability: {
      ...base,
      name: 'Prized Creations',
      flavour:
        'Moulder warbeasts are studded with warpstone crystals and pumped full of vile serums that spur their battle-rage.',
      timing: { phase: 'hero', turn: 'your', frequency: 'once-per-turn-army' },
      declare: 'Pick up to 3 friendly non-HERO MOULDER units to be the targets.',
      effect: [
        'Roll a dice for each target and apply the corresponding effect:',
        {
          table: [
            { roll: '1-2', text: 'Self-destructive Fury: Inflict D3 mortal damage on the target.' },
            {
              roll: '3-4',
              text: "Rabid Infusion: Add 1 to the Attacks characteristic of the target's melee weapons until the start of your next turn.",
            },
            {
              roll: '5-6',
              text: "Blinded by Frenzy: In addition to the effect of 'Rabid Infusion', the target has WARD (5+) until the start of your next turn.",
            },
          ],
        },
      ],
      keywords: [],
      source: { kind: 'battle-formation', formationId: 'skv-fleshmeld-menagerie' },
    },
  },
};

/** No declare, no keywords, no value — the most stripped-back card possible. */
export const MinimalCard: Story = {
  args: {
    ability: {
      ...base,
      name: 'Dragged Down and Torn Apart',
      timing: { phase: 'combat', turn: 'any' },
      declare: undefined,
      effect: "Add 1 to hit rolls for this unit's attacks if it has 10 or more models.",
      keywords: [],
    },
  },
};

/** Checks that a wall of text neither clips nor overflows the card. */
export const LongEffectText: Story = {
  args: {
    ability: {
      ...base,
      name: 'An Ability With A Very Long Name That Has To Wrap Onto Several Lines',
      timing: { phase: 'end-of-battle-round' },
      declare:
        'Pick up to 3 friendly SOULBLIGHT GRAVELORDS units that are not in combat and are wholly within 12" of any friendly SOULBLIGHT GRAVELORDS HERO with a Wounds characteristic of 8 or more.',
      effect:
        'Roll a dice for each of those units. On a 1, nothing happens. On a 2-5, heal (2) that unit. On a 6, heal (D3) that unit and you can return up to 3 slain models to it. Then, if any of those units are wholly within your territory, they can each make a normal move of up to 3" provided they end that move more than 3" from all enemy units. This text exists purely to stress the layout.',
      keywords: ['Once Per Battle', 'Heal', 'Rampage', 'Core', 'Movement'],
      usedBy: 'Friendly SOULBLIGHT GRAVELORDS units wholly within your territory',
    },
  },
};

/** Data still flagged as unverified shows a warning strip inside the card. */
export const FlaggedAsSampleData: Story = {
  args: {
    ability: { ...base, sample: true },
  },
};

/**
 * All eight bands at once, for checking the palette and the legibility of white
 * text on each colour — the gold hero band is the marginal one.
 */
export const AllBands: Story = {
  render: () => {
    const swatch = (
      id: string,
      name: string,
      timing: Ability['timing'],
      effect: string,
    ): Ability => ({
      ...base,
      id,
      name,
      timing,
      declare: undefined,
      effect,
      keywords: [],
    });

    const byPhase = 'The header colour is driven entirely by the timing.';

    return {
      props: {
        abilities: [
          swatch(
            'band-deployment',
            'Deployment / Passive (black)',
            { phase: 'deployment' },
            byPhase,
          ),
          swatch('band-hero', 'Hero Phase (gold)', { phase: 'hero' }, byPhase),
          swatch('band-movement', 'Movement Phase (grey)', { phase: 'movement' }, byPhase),
          swatch('band-shooting', 'Shooting Phase (teal)', { phase: 'shooting' }, byPhase),
          swatch('band-charge', 'Charge Phase (orange)', { phase: 'charge' }, byPhase),
          swatch('band-combat', 'Combat Phase (red)', { phase: 'combat' }, byPhase),
          swatch('band-end', 'End of Turn (purple)', { phase: 'end-of-turn' }, byPhase),
          swatch(
            'band-reaction',
            'Reaction (green, overrides the phase)',
            { phase: 'combat', reaction: 'Something happened' },
            'A reaction is green regardless of which phase it belongs to.',
          ),
        ],
      },
      template: `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; align-items: start;">
          @for (ability of abilities; track ability.id) {
            <app-ability-card [ability]="ability" />
          }
        </div>
      `,
    };
  },
};
