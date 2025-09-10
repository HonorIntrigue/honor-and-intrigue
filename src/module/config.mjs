import { preLocalize } from './helpers/localization.mjs';

export const HONOR_INTRIGUE = {};

HONOR_INTRIGUE.qualities = {
  might: { label: 'HONOR_INTRIGUE.Actor.qualities.might', rollKey: 'might' },
  daring: { label: 'HONOR_INTRIGUE.Actor.qualities.daring', rollKey: 'daring' },
  flair: { label: 'HONOR_INTRIGUE.Actor.qualities.flair', rollKey: 'flair' },
  savvy: { label: 'HONOR_INTRIGUE.Actor.qualities.savvy', rollKey: 'savvy' },
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
  free: { label: 'HONOR_INTRIGUE.ACTION_TYPE.free' },
  major: { label: 'HONOR_INTRIGUE.ACTION_TYPE.major' },
  minor: { label: 'HONOR_INTRIGUE.ACTION_TYPE.minor' },
  reaction: { label: 'HONOR_INTRIGUE.ACTION_TYPE.reaction' },
};
HONOR_INTRIGUE.actionTypesSorted = [
  'major',
  'minor',
  'reaction',
  'free',
];

HONOR_INTRIGUE.speedOptions = ['fly', 'teleport', 'walk'];

HONOR_INTRIGUE.damageTypes = {
  energy: {
    label: 'HONOR_INTRIGUE.DAMAGE_TYPE.energy',
    color: foundry.utils.Color.fromString('#ff870f'),
  },
  physical: {
    label: 'HONOR_INTRIGUE.DAMAGE_TYPE.physical',
    color: foundry.utils.Color.fromString('#999999'),
  },
};
preLocalize('damageTypes', { key: 'label' });
