import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class ManeuverModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'maneuver',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = {};

    schema.actionType = new fields.NumberField({
      initial: 0,
      integer: true,
      min: 0,
      max: hi.CONFIG.actionTypesSorted.length,
      nullable: true,
    });
    schema.description = new fields.HTMLField({ textSearch: true, trim: true });
    schema.mastery = new fields.StringField({ trim: true });
    schema.formulae = new fields.ArrayField(new fields.StringField({ trim: true })); // will hold quality+ability rollKeys to be enriched later

    return schema;
  }
}
