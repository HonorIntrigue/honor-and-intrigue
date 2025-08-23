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

    schema.competence = new fields.NumberField({ initial: 0, integer: true, nullable: false });

    return schema;
  }
}
