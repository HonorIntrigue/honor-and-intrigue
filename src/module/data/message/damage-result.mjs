import { systemPath } from '../../constants.mjs';
import BaseMessageModel from './base.mjs';

export default class DamageResultMessageModel extends BaseMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return { type: 'damageResult' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // A list of protection items that have been rolled with this message.
    schema.protectionItems = new fields.TypedObjectField(new fields.SchemaField({
      formula: new fields.StringField(),
      name: new fields.StringField(),
    }), { required: false });
    // The total damage (before protection) that would be applied.
    schema.total = new fields.NumberField({ min: 0, integer: true });

    return schema;
  }

  /** @inheritDoc */
  async alterMessageHTML(html) {
    await super.alterMessageHTML(html);

    if (this.protectionItems) {
      html.querySelector('.message-content').insertAdjacentHTML('afterbegin', await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/protection-roll-footer.hbs'), {
        protectionItems: Object.entries(this.protectionItems).reduce((acc, [k, v]) => [...acc, { id: k, ...v }], []),
      }));
    }
  }
}
