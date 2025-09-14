import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class CareerModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/jump.svg';

  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'career',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.rank = new fields.NumberField({ min: 0, max: 6, initial: 0, integer: true, nullable: false });

    return schema;
  }
}
