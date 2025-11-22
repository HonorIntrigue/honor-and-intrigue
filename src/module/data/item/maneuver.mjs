import { systemPath } from '../../constants.mjs';
import ActionModel from './action.mjs';

export default class ManeuverModel extends ActionModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/upgrade.svg';

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'maneuver' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

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
