import BaseItemModel from './base.mjs';

const fields = foundry.data.fields;

export default class WeaponModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/sword.svg';

  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'weapon',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.damageFormula = new fields.SchemaField({
      dieSize: new fields.NumberField({ choices: [2, 3, 4, 6, 8, 10, 12], initial: 6, integer: true, nullable: false }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      numDice: new fields.NumberField({ initial: 1, integer: true, min: 1, nullable: false }),
    });
    schema.handsHeld = new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3, nullable: false });
    schema.rangeIncrement = new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: false });
    schema.throwable = new fields.BooleanField({ initial: false, nullable: false });

    return schema;
  }
}
