import BaseItemModel from './base.mjs';

export default class CareerModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/jump.svg';
  /** @inheritDoc */
  static LOCALIZATION_PREFIXES = ['HONOR_INTRIGUE.Actor.Sheet.Labels.Careers'];

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'career' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.isArcane = new fields.BooleanField();
    schema.rank = new fields.NumberField({ min: 0, max: 6, initial: 0, integer: true });

    return schema;
  }
}
