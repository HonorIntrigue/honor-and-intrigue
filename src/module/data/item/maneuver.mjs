import { systemPath } from '../../constants.mjs';
import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class ManeuverModel extends BaseItemModel {
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
    schema.formulae = new fields.ArrayField(new fields.StringField({ trim: true })); // will hold quality+ability rollKeys to be enriched later
    schema.isMastered = new fields.BooleanField({ initial: false });
    schema.mastery = new fields.StringField({ trim: true });

    return schema;
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
