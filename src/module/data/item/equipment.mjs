import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class EquipmentModel extends BaseItemModel {
  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'equipment' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.carriedPosition = new fields.NumberField({ choices: hi.CONFIG.equipmentCarryChoices, initial: hi.CONFIG.CARRY_CHOICE.Stowed, integer: true });
    schema.quantity = new fields.NumberField({ min: 0, initial: 1, integer: true, nullable: false });

    return schema;
  }
}
