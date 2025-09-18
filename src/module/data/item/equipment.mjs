import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class EquipmentModel extends BaseItemModel {
  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.carriedPosition = new fields.NumberField({ choices: hi.CONFIG.equipmentCarryChoices, initial: 0, integer: true });
    schema.quantity = new fields.NumberField({ min: 0, initial: 1, integer: true, nullable: false });

    return schema;
  }
}
