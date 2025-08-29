import { preLocalize } from './helpers/localization.mjs';

export const HONOR_INTRIGUE = {};

HONOR_INTRIGUE.qualities = {
  might: { label: 'HONOR_INTRIGUE.Actor.qualities.might' },
  daring: { label: 'HONOR_INTRIGUE.Actor.qualities.daring' },
  flair: { label: 'HONOR_INTRIGUE.Actor.qualities.flair' },
  savvy: { label: 'HONOR_INTRIGUE.Actor.qualities.savvy' },
};
preLocalize('qualities', { keys: ['label'] });

HONOR_INTRIGUE.combatAbilities = {
  brawl: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.brawl' },
  melee: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.melee' },
  ranged: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.ranged' },
  defense: { label: 'HONOR_INTRIGUE.Actor.combatAbilities.defense' },
};
preLocalize('combatAbilities', { keys: ['label'] });

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
