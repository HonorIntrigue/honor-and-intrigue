import BaseMessageModel from './base.mjs';

const fields = foundry.data.fields;

export default class DamageMessageModel extends BaseMessageModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      type: 'damage',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    // A required reference to the item source of this damage instance.
    schema.uuid = new fields.StringField({ required: true, nullable: false, blank: false });

    return schema;
  }
}
