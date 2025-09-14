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

    Object.values(schema.qualities.fields).forEach((quality) => {
      quality.fields.value.max = 2;
    });
    Object.values(schema.combatAbilities.fields).forEach((ability) => {
      ability.fields.value.max = 2;
    });
    schema.lifeblood.fields.value.min = 0;

    schema.competence = new fields.NumberField({ initial: 0, integer: true, nullable: false });

    return schema;
  }
}
