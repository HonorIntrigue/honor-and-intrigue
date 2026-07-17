import BaseActorModel from './base.mjs';

export default class RetainerModel extends BaseActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'retainer',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.level = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0, max: 3 });

    return schema;
  }

  /** @inheritDoc */
  get baseLifeblood() {
    return 8;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({ system: { lifeblood: { min: 0 } } });
    return true;
  }
}
