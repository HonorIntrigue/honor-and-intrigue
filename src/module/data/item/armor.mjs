import EquipmentModel from './equipment.mjs';

const fields = foundry.data.fields;

export default class ArmorModel extends EquipmentModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/ice-shield.svg';

  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'armor',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.protection = new fields.SchemaField({
      dieSize: new fields.NumberField({ choices: hi.CONFIG.damageDiceValues, initial: 6, integer: true, nullable: false }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      numDice: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
    });

    return schema;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.protection.value = '';

    if (this.protection.numDice) {
      this.protection.value = `${this.protection.numDice}d${this.protection.dieSize}`;
    }

    if (this.protection.flatModifier !== 0) {
      this.protection.value += this.protection.flatModifier.signedString();
    }
  }
}
