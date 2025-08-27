import BaseActorModel from './base.mjs';

const fields = foundry.data.fields;

export default class PawnModel extends BaseActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'pawn',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.competence = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    });

    return schema;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    this.lifeblood.max = 1;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      },
    });
  }
}
