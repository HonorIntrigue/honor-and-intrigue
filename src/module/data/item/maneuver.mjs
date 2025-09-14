import { systemPath } from '../../constants.mjs';
import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class ManeuverModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/upgrade.svg';

  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'maneuver',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.actionType = new fields.NumberField({
      choices: hi.CONFIG.actionTypes,
      initial: 0,
      integer: true,
    });
    schema.abilityCheck = new fields.SchemaField({
      quality: new fields.StringField({ blank: true, choices: hi.CONFIG.qualities, required: true }),
      combatAbility: new fields.StringField({ blank: true, choices: hi.CONFIG.combatAbilities, required: true }),
      flatModifier: new fields.NumberField({ integer: true }),
      opposedBy: new fields.SchemaField({
        quality: new fields.StringField({ blank: true, choices: hi.CONFIG.qualities, required: true }),
        combatAbility: new fields.StringField({ blank: true, choices: hi.CONFIG.combatAbilities, required: true }),
        flatModifier: new fields.NumberField({ integer: true }),
      }),
    });
    schema.isMastered = new fields.BooleanField({ initial: false });
    schema.mastery = new fields.StringField({ trim: true });

    return schema;
  }

  /**
   * Flag that indicates if this maneuver requires an ability check to succeed.
   */
  get requiresCheck() {
    return this.abilityCheck.quality || this.abilityCheck.combatAbility;
  }

  /**
   * Flag that indicates if this maneuver is opposed by the target.
   */
  get requiresOpposedCheck() {
    return this.abilityCheck.opposedBy?.quality || this.abilityCheck.opposedBy?.combatAbility;
  }

  /** @inheritDoc */
  async toEmbed() {
    const embed = await super.toEmbed();

    if (this.mastery) {
      const masteryTag = await foundry.applications.handlebars.renderTemplate(systemPath('templates/embeds/item/maneuver-mastery.hbs'), {
        system: this,
      });
      embed.insertAdjacentHTML('beforeend', masteryTag);
    }

    return embed;
  }
}
