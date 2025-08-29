import BaseActorModel from './base.mjs';

const fields = foundry.data.fields;

export default class CharacterActorModel extends BaseActorModel {
  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.composure = new fields.NumberField({ min: 0, max: 3, initial: 3, integer: true, nullable: false });
    schema.fortune = new fields.NumberField({ min: 0, initial: 0, integer: true, nullable: false });

    return schema;
  }
}
