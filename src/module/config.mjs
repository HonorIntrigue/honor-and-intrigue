import { systemPath } from './constants.mjs';
import { preLocalize } from './helpers/localization.mjs';

export const HONOR_INTRIGUE = {
  ASCII: `
_______________________________________________________________
,-_/,.                         ,-_/     .
' |_|/ ,-. ,-. ,-. ,-.    .    '  | ,-. |- ,-. . ,-. . . ,-.
 /| |  | | | | | | |     -|-   .- | | | |  |   | | | | | |-'
 \`' \`' \`-' ' ' \`-' '      '    \`--' ' ' \`' '   ' \`-| \`-' \`-'
                                                  ,|
                                                  \`'
===============================================================`,
  CARRY_CHOICE: {
    Dropped: 0,
    Held: 1,
    Stowed: 2,
  },
  ROLL_OUTCOME: {
    CritSuccess: { key: 'crit-success', label: 'HONOR_INTRIGUE.ROLL_OUTCOME.CritSuccess' },
    Success: { key: 'success', label: 'HONOR_INTRIGUE.ROLL_OUTCOME.Success' },
    Failure: { key: 'failure', label: 'HONOR_INTRIGUE.ROLL_OUTCOME.Failure' },
    CritFailure: { key: 'crit-failure', label: 'HONOR_INTRIGUE.ROLL_OUTCOME.CritFailure' },
  },
  defaultPartyId: 'xxDefaultPartyxx',
};

HONOR_INTRIGUE.qualities = {
  might: { label: 'HONOR_INTRIGUE.Actor.qualities.might', rollKey: 'might' },
  daring: { label: 'HONOR_INTRIGUE.Actor.qualities.daring', rollKey: 'daring' },
  flair: { label: 'HONOR_INTRIGUE.Actor.qualities.flair', rollKey: 'flair', types: ['hero', 'pawn', 'retainer', 'villain'] },
  savvy: { label: 'HONOR_INTRIGUE.Actor.qualities.savvy', rollKey: 'savvy' },
  terror: { label: 'HONOR_INTRIGUE.Actor.qualities.terror', rollKey: 'terror', types: ['creature'] },
};
preLocalize('qualities', { keys: ['label'] });

HONOR_INTRIGUE.combatAbilities = {
  brawl: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.brawl', rollKey: 'brawl' },
  melee: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.melee', rollKey: 'melee' },
  ranged: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.ranged', rollKey: 'ranged' },
  defense: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.defense', rollKey: 'defense' },
};
preLocalize('combatAbilities', { keys: ['label'] });

HONOR_INTRIGUE.actionTypes = {
  0: { label: 'HONOR_INTRIGUE.ACTION_TYPE.free' },
  1: { label: 'HONOR_INTRIGUE.ACTION_TYPE.major' },
  2: { label: 'HONOR_INTRIGUE.ACTION_TYPE.minor' },
  3: { label: 'HONOR_INTRIGUE.ACTION_TYPE.reaction' },
};
HONOR_INTRIGUE.equipmentCarryChoices = {
  [HONOR_INTRIGUE.CARRY_CHOICE.Dropped]: { label: 'HONOR_INTRIGUE.Item.CARRY_TYPE.dropped' },
  [HONOR_INTRIGUE.CARRY_CHOICE.Held]: { label: 'HONOR_INTRIGUE.Item.CARRY_TYPE.held' },
  [HONOR_INTRIGUE.CARRY_CHOICE.Stowed]: { label: 'HONOR_INTRIGUE.Item.CARRY_TYPE.stowed' },
};

HONOR_INTRIGUE.damageDice = [
  { label: 'd2', value: 2 },
  { label: 'd3', value: 3 },
  { label: 'd4', value: 4 },
  { label: 'd6', value: 6 },
  { label: 'd8', value: 8 },
  { label: 'd10', value: 10 },
  { label: 'd12', value: 12 },
];
HONOR_INTRIGUE.damageDiceValues = HONOR_INTRIGUE.damageDice.map(x => x.value);

HONOR_INTRIGUE.damageTypes = {
  energy: {
    label: 'HONOR_INTRIGUE.DAMAGE_TYPE.energy',
    color: foundry.utils.Color.fromString('#FF870F'),
  },
  physical: {
    label: 'HONOR_INTRIGUE.DAMAGE_TYPE.physical',
    color: foundry.utils.Color.fromString('#999999'),
  },
};
preLocalize('damageTypes', { key: 'label' });

HONOR_INTRIGUE.difficulties = {
  easy: { label: 'HONOR_INTRIGUE.DIFFICULTY.easy', modifier: 1 },
  moderate: { label: 'HONOR_INTRIGUE.DIFFICULTY.moderate', modifier: 0 },
  tricky: { label: 'HONOR_INTRIGUE.DIFFICULTY.tricky', modifier: -1 },
  hard: { label: 'HONOR_INTRIGUE.DIFFICULTY.hard', modifier: -2 },
  tough: { label: 'HONOR_INTRIGUE.DIFFICULTY.tough', modifier: -4 },
  demanding: { label: 'HONOR_INTRIGUE.DIFFICULTY.demanding', modifier: -6 },
};
preLocalize('difficulties', { key: 'label' });

HONOR_INTRIGUE.statusEffects = [
  {
    id: 'at-a-loss',
    img: 'icons/svg/daze.svg',
    name: 'HONOR_INTRIGUE.EFFECT.Status.AtALoss',
  },
  {
    id: 'defeated',
    hud: { actorTypes: ['hero', 'retainer', 'villain'] },
    img: systemPath('assets/icons/advantage_defeated.webp'),
    name: 'HONOR_INTRIGUE.EFFECT.Status.Defeated',
  },
  {
    id: 'dying',
    hud: { actorTypes: ['hero', 'retainer', 'villain'] },
    img: 'icons/svg/unconscious.svg',
    name: 'HONOR_INTRIGUE.EFFECT.Status.Dying',
  },
];
