import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class CareerModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'career',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = {};

    schema.description = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }
}
